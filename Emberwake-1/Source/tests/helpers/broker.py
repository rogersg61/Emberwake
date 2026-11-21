# A tiny MQTT 3.1.1 broker over WebSockets, just enough for the game's code system:
# CONNECT, SUBSCRIBE (exact topics), PUBLISH QoS 0, PINGREQ, DISCONNECT.
# Used by the tests in place of the public message boards the game uses on the internet
# (it can also lose and delay messages on purpose, like a far-away board).
import asyncio, base64, hashlib, random, struct, threading, time

GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'

class Client:
    def __init__(self, w):
        self.w = w; self.subs = set(); self.buf = b''; self.next = 0.0

    def send_ws(self, data):
        n = len(data)
        if n < 126: head = bytes([0x82, n])
        elif n < 65536: head = bytes([0x82, 126]) + struct.pack('>H', n)
        else: head = bytes([0x82, 127]) + struct.pack('>Q', n)
        try: self.w.write(head + data)
        except Exception: pass

class Broker:
    def __init__(self, port):
        self.port = port; self.clients = set(); self.published = 0; self.loop = None; self.down = False
        # to imitate a far-away, imperfect board: drop some messages, and deliver late (in order)
        self.loss = 0.0; self.delay = 0.0; self.bytes = 0; self.relay_bytes = 0

    def remlen(self, n):
        out = bytearray()
        while True:
            d = n % 128; n //= 128
            if n: d |= 128
            out.append(d)
            if not n: return bytes(out)

    async def handle(self, r, w):
        if self.down: w.close(); return
        try:
            head = await r.readuntil(b'\r\n\r\n')
        except Exception:
            w.close(); return
        lines = head.decode('latin1').split('\r\n'); hdr = {}
        for l in lines[1:]:
            if ':' in l: k, v = l.split(':', 1); hdr[k.strip().lower()] = v.strip()
        key = hdr.get('sec-websocket-key', '')
        acc = base64.b64encode(hashlib.sha1((key + GUID).encode()).digest()).decode()
        proto = 'Sec-WebSocket-Protocol: mqtt\r\n' if 'mqtt' in hdr.get('sec-websocket-protocol', '') else ''
        w.write(('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: %s\r\n%s\r\n' % (acc, proto)).encode())
        c = Client(w); self.clients.add(c)
        try:
            while True:
                b0, b1 = await r.readexactly(2)
                op = b0 & 15; masked = b1 & 128; n = b1 & 127
                if n == 126: n = struct.unpack('>H', await r.readexactly(2))[0]
                elif n == 127: n = struct.unpack('>Q', await r.readexactly(8))[0]
                mask = await r.readexactly(4) if masked else b'\0\0\0\0'
                data = bytearray(await r.readexactly(n))
                for i in range(n): data[i] ^= mask[i % 4]
                if op == 8: break
                if op == 9: c.w.write(bytes([0x8A, len(data)]) + bytes(data)); continue
                if op in (0, 1, 2): c.buf += bytes(data); self.mqtt(c)
        except Exception:
            pass
        self.clients.discard(c)
        try: w.close()
        except Exception: pass

    def mqtt(self, c):
        while len(c.buf) >= 2:
            n = 0; mul = 1; i = 1
            while i < len(c.buf):
                n += (c.buf[i] & 127) * mul; mul *= 128
                if not c.buf[i] & 128: break
                i += 1
            if i >= len(c.buf) or len(c.buf) < i + 1 + n: return
            t = c.buf[0] >> 4; body = c.buf[i + 1:i + 1 + n]; whole = c.buf[:i + 1 + n]; c.buf = c.buf[i + 1 + n:]
            if t == 1: c.send_ws(bytes([0x20, 2, 0, 0]))
            elif t == 8:
                pid = body[0:2]; j = 2; codes = b''
                while j < len(body):
                    tl = struct.unpack('>H', body[j:j + 2])[0]; c.subs.add(body[j + 2:j + 2 + tl].decode()); j += 2 + tl + 1; codes += b'\0'
                c.send_ws(bytes([0x90]) + self.remlen(2 + len(codes)) + pid + codes)
            elif t == 3:
                tl = struct.unpack('>H', body[0:2])[0]; topic = body[2:2 + tl].decode(); self.published += 1; self.bytes += len(whole)
                if topic.count('/') >= 3: self.relay_bytes += len(whole)
                for o in list(self.clients):
                    if topic not in o.subs: continue
                    if self.loss and random.random() < self.loss: continue
                    if self.delay:
                        now = time.monotonic(); at = max(o.next, now + self.delay * (0.6 + 0.8 * random.random())); o.next = at
                        self.loop.call_later(at - now, o.send_ws, whole)
                    else: o.send_ws(whole)
            elif t == 12: c.send_ws(bytes([0xD0, 0]))
            elif t == 14: c.w.close(); return

    def start(self):
        def run():
            self.loop = asyncio.new_event_loop(); asyncio.set_event_loop(self.loop)
            srv = self.loop.run_until_complete(asyncio.start_server(self.handle, '127.0.0.1', self.port))
            self.loop.run_forever()
        threading.Thread(target=run, daemon=True).start()
        return self
