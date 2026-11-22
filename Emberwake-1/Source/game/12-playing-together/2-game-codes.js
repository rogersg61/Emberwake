// ============================================================
//  GAME CODES: the simple way to play together.
//  The host's game shows a short code, like K7P2QX. A friend types it
//  into JOIN A FRIEND. The two games find each other by posting short
//  sealed notes to public message boards (MQTT brokers on the internet,
//  or on claude.ai the page's own live room), swap the few lines a
//  direct connection needs, and from then on talk to each other directly.
//  When a network won't allow a direct link, the games keep talking
//  through the boards instead (the relay, 3-relay.js).
//  The notes are sealed with a key made from the code: without the code
//  nobody can read them or even find them.
// ============================================================
// several boards at once, so one being down or blocked doesn't matter. Three
// listen on port 443 (the web's own port), which school and office networks allow.
const SIG_BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://mqtt.eclipseprojects.io:443/mqtt',
  { u: 'wss://public.cloud.shiftr.io:443', user: 'public', pass: 'public' },
  'wss://test.mosquitto.org:8081/mqtt',
  { u: 'wss://demo.tbmq.io:443/mqtt', user: 'demo' }
];
const SIG_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const SIG = { code: '', role: '', topic: '', rid: '', key: null, conns: [], room: null, unsubs: [], seen: new Set(), on: null, out: [], startT: 0, sayT: 0, myId: '', host: null, offer: '', offerT: 0, answered: false, guests: new Map(), stage: '', ok: false, err: '' };

// ---------------- SHA-256, and sealing notes with it ----------------
const SHA_K = new Uint32Array([0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2]);
function sha256(m) {
  const ror = (x, n) => (x >>> n) | (x << (32 - n)), l = m.length, nb = ((l + 9 + 63) >> 6) << 6, b = new Uint8Array(nb); b.set(m); b[l] = 0x80;
  const dv = new DataView(b.buffer); dv.setUint32(nb - 4, (l * 8) >>> 0); dv.setUint32(nb - 8, Math.floor(l / 536870912));
  const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]), w = new Uint32Array(64);
  for (let o = 0; o < nb; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) { const a = w[i - 15], c = w[i - 2]; w[i] = (w[i - 16] + (ror(a, 7) ^ ror(a, 18) ^ (a >>> 3)) + w[i - 7] + (ror(c, 17) ^ ror(c, 19) ^ (c >>> 10))) >>> 0; }
    let a = H[0], bb = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
    for (let i = 0; i < 64; i++) { const t1 = (h + (ror(e, 6) ^ ror(e, 11) ^ ror(e, 25)) + ((e & f) ^ (~e & g)) + SHA_K[i] + w[i]) >>> 0, t2 = ((ror(a, 2) ^ ror(a, 13) ^ ror(a, 22)) + ((a & bb) ^ (a & c) ^ (bb & c))) >>> 0; h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = bb; bb = a; a = (t1 + t2) >>> 0; }
    H[0] += a; H[1] += bb; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  const out = new Uint8Array(32), od = new DataView(out.buffer); for (let i = 0; i < 8; i++) od.setUint32(i * 4, H[i]); return out;
}
const sigCat = (...a) => { const n = a.reduce((s, x) => s + x.length, 0), u = new Uint8Array(n); let o = 0; for (const x of a) { u.set(x, o); o += x.length; } return u; };
const sigHex = u => [...u].map(b => b.toString(16).padStart(2, '0')).join('');
const sigTxt = s => new TextEncoder().encode(s);
function sigStream(nonce, n) {
  const out = new Uint8Array(n), pre = sigCat(SIG.key, nonce, new Uint8Array(4)), L = pre.length;
  for (let k = 0, o = 0; o < n; k++, o += 32) { pre[L - 4] = k >>> 24; pre[L - 3] = (k >> 16) & 255; pre[L - 2] = (k >> 8) & 255; pre[L - 1] = k & 255; const blk = sha256(pre); out.set(blk.subarray(0, min(32, n - o)), o); }
  return out;
}
function sigSealU(pt) {
  const nonce = crypto.getRandomValues(new Uint8Array(12)), ks = sigStream(nonce, pt.length), ct = pt.map((b, i) => b ^ ks[i]);
  return b64e(sigCat(nonce, sha256(sigCat(SIG.key, nonce, ct)).subarray(0, 16), ct));
}
function sigOpenU(s) {
  try {
    const u = b64d(String(s)); if (u.length < 29 || u.length > 90000) return null; const nonce = u.subarray(0, 12), tag = u.subarray(12, 28), ct = u.subarray(28), want = sha256(sigCat(SIG.key, nonce, ct));
    for (let i = 0; i < 16; i++) if (want[i] !== tag[i]) return null;
    const ks = sigStream(nonce, ct.length); return ct.map((b, i) => b ^ ks[i]);
  } catch (e) { return null; }
}
const sigSeal = obj => sigSealU(sigTxt(JSON.stringify(obj)));
function sigOpen(s) { const u = sigOpenU(s); if (!u) return null; try { const o = JSON.parse(new TextDecoder().decode(u)); return o && typeof o === 'object' ? o : null; } catch (e) { return null; } }
function sigNewCode() { const r = crypto.getRandomValues(new Uint8Array(6)); return [...r].map(b => SIG_ABC[b % SIG_ABC.length]).join(''); }
const sigClean = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

// ---------------- a tiny MQTT client (3.1.1 over a WebSocket): connect, subscribe, publish ----------------
function mqttOpen(B, i) {
  const url = typeof B === 'string' ? B : B && B.u, now0 = performance.now();
  const C = { url, i, ok: false, closed: false, buf: new Uint8Array(0), ping: now0, heard: now0, ws: null, fails: 0 };
  try { C.ws = new WebSocket(url, ['mqtt']); } catch (e) { C.closed = true; C.closeT = now0; return C; }
  const str = s => { const b = sigTxt(s); return [b.length >> 8, b.length & 255, ...b]; };
  const pkt = (h, body) => { const out = [h]; let x = body.length; do { let d = x % 128; x = floor(x / 128); if (x > 0) d |= 128; out.push(d); } while (x > 0); const u = new Uint8Array(out.length + body.length); u.set(out); u.set(body, out.length); return u; };
  const send = u => { try { if (C.ws.readyState === 1) C.ws.send(u); } catch (e) { } };
  C.ws.binaryType = 'arraybuffer';
  C.ws.onopen = () => {
    // a few boards want a name and password; the public ones say what to use
    let fl = 2; const pay = [...str('ew' + sigHex(crypto.getRandomValues(new Uint8Array(8))))];
    if (B && B.user) { fl |= 0x80; pay.push(...str(B.user)); if (B.pass) { fl |= 0x40; pay.push(...str(B.pass)); } }
    send(pkt(0x10, [...str('MQTT'), 4, fl, 0, 50, ...pay]));
  };
  C.ws.onmessage = e => {
    if (!(e.data instanceof ArrayBuffer)) return; C.heard = performance.now(); C.buf = sigCat(C.buf, new Uint8Array(e.data));
    for (;;) {
      const b = C.buf; if (b.length < 2) break; let len = 0, mul = 1, i = 1;
      for (; i < 5 && i < b.length; i++) { len += (b[i] & 127) * mul; mul *= 128; if (!(b[i] & 128)) break; }
      if (i >= b.length || i >= 5) break; const start = i + 1; if (b.length < start + len) break;
      const type = b[0] >> 4, body = b.subarray(start, start + len); C.buf = b.slice(start + len);
      // on hello: listen to the game's board, and to my own mailbox on it (the relay)
      if (type === 2) { if (body[1] === 0) { C.ok = true; C.fails = 0; SIG.everOk = true; C.ping = performance.now(); const sub = [0, 1, ...str(SIG.topic), 0]; if (SIG.rid) sub.push(...str(SIG.topic + '/' + SIG.rid), 0); send(pkt(0x82, sub)); } else C.close(); }
      else if (type === 3) { const tl = (body[0] << 8) | body[1], q = (b[0] >> 1) & 3, off = 2 + tl + (q ? 2 : 0); sigIn(new TextDecoder().decode(body.subarray(off))); }
    }
  };
  C.ws.onclose = C.ws.onerror = () => { if (!C.closed) C.closeT = performance.now(); C.ok = false; C.closed = true; };
  C.pubTo = (topic, s) => { if (C.ok) send(pkt(0x30, [...str(topic), ...sigTxt(s)])); };
  C.pub = s => C.pubTo(SIG.topic, s);
  // keep the line warm, and notice when it has quietly died
  C.tick = now => { if (!C.ok) return; if (now - C.ping > 20000) { C.ping = now; send(new Uint8Array([0xC0, 0])); } if (now - C.heard > 50000) C.close(); };
  C.close = () => { if (!C.closed) C.closeT = performance.now(); C.closed = true; C.ok = false; try { if (C.ws.readyState === 1) C.ws.send(new Uint8Array([0xE0, 0])); C.ws.close(); } catch (e) { } };
  return C;
}
// ---------------- the board: send and hear sealed notes ----------------
function sigBrokers() { return Array.isArray(window.EW_BROKERS) && window.EW_BROKERS.length ? window.EW_BROKERS : SIG_BROKERS; }
// which boards this computer can reach right now (friends pick one you share)
function sigMask() { let m = 0; for (const C of SIG.conns) if (C.ok) m |= 1 << C.i; return m; }
function sigStart(code, role, on) {
  sigStop(); SIG.code = code; SIG.role = role; SIG.on = on; SIG.startT = performance.now(); SIG.seen.clear(); SIG.out = []; SIG.err = ''; SIG.everOk = false;
  SIG.key = sha256(sigTxt('emberwake-key:' + code)); SIG.topic = 'emberwake/v2/' + sigHex(sha256(sigTxt('emberwake-topic:' + code))).slice(0, 24);
  SIG.rid = role === 'host' ? 'h' : SIG.myId;
  SIG.viaRoom = !!(NET.room && !window.EW_BROKERS);
  if (SIG.viaRoom) {
    // on claude.ai: the page's own live room carries the notes (nothing else may leave the page there)
    NET.room.join('sig-' + SIG.topic.slice(-24)).then(R => {
      if (SIG.code !== code) { try { R.leave(); } catch (e) { } return; } SIG.room = R;
      SIG.unsubs.push(R.onPeers(ch => {
        for (const pe of ch.peers || []) {
          if (pe.isMe) continue; const s = pe.presence; if (!s) continue;
          if (Array.isArray(s.m)) for (const x of s.m.slice(-8)) sigIn(x);
          const r = s.r && typeof s.r === 'object' ? s.r[SIG.rid] : null; if (Array.isArray(r)) for (const x of r.slice(0, 16)) sigIn(x);
        }
      }, () => { }));
      sigRoomPush();
    }, () => { });
  } else SIG.conns = sigBrokers().map(mqttOpen);
}
function sigStop() {
  for (const C of SIG.conns) C.close(); SIG.conns = [];
  for (const u of SIG.unsubs) try { u(); } catch (e) { } SIG.unsubs = []; if (SIG.room) { try { SIG.room.leave(); } catch (e) { } SIG.room = null; }
  SIG.code = ''; SIG.role = ''; SIG.rid = ''; SIG.on = null; SIG.guests.clear(); SIG.host = null; SIG.answered = false; SIG.offer = '';
}
const sigReady = () => !!SIG.room || SIG.conns.some(C => C.ok);
// on claude.ai the notes, and any relayed bundles not yet received, ride in this page's presence
function sigRoomPush() {
  if (!SIG.room) return; const r = {};
  for (const P of COOP.peers.values()) if (P.relay && P.rid) { const a = []; for (const F of P.rw.values()) a.push(F.b); if (P.rAckF) a.push(P.rAckF); if (a.length) r[P.rid] = a; }
  SIG.room.presence({ m: SIG.out.map(o => o.s), r }).catch(() => { }); SIG.roomDirty = false; SIG.roomT = performance.now();
}
function sigSend(obj) {
  if (!SIG.code) return; obj.b = sigMask(); obj.z = rlyZ() ? 1 : 0; const s = sigSeal(obj); SIG.seen.add(s.slice(0, 22));
  // the newest of each kind of note is enough (an offer, an answer to a friend, the host's hello)
  const k = obj.t + ':' + (obj.g || ''); SIG.out = SIG.out.filter(o => o.k !== k); SIG.out.push({ k, s }); if (SIG.out.length > 8) SIG.out.shift();
  const mask = SIG.role === 'ring' ? netSignalPublishMask() : sigMask();
  for (const C of SIG.conns) if (mask & (1 << C.i)) C.pub(s); sigRoomPush();
}
function sigIn(s) {
  if (typeof s !== 'string' || !SIG.code) return; const k = s.slice(0, 22); if (SIG.seen.has(k)) return; SIG.seen.add(k);
  if (SIG.seen.size > 3000) { const it = SIG.seen.values(); for (let i = 0; i < 1000; i++) SIG.seen.delete(it.next().value); }
  const u = sigOpenU(s); if (!u || !u.length) return;
  if (u[0] === 1) { try { rlyIn(u); } catch (e) { console.warn('relay', e); } return; }
  let m = null; try { m = JSON.parse(new TextDecoder().decode(u)); } catch (e) { return; }
  if (m && typeof m === 'object' && typeof m.t === 'string' && SIG.on) try { SIG.on(m); } catch (e) { console.warn('sig', e); }
}
// boards that dropped out are tried again, more patiently each time
function sigKeep(now) {
  if (SIG.viaRoom) return; const list = sigBrokers();
  SIG.conns.forEach((C, i) => {
    if (!C.closed) return; const wait = min(60000, 3000 * 2 ** min(5, C.fails | 0));
    if (now - (C.closeT || 0) > wait) { const N = mqttOpen(list[i], i); N.fails = (C.fails | 0) + 1; SIG.conns[i] = N; }
  });
}
// ---------------- hosting: anyone with the code can come in ----------------
function sigHost(mode) {
  if (!netOK()) return; if (SIG.role === 'host' && SIG.code) { SIG.mode = mode; return; }
  const keep = mode === 'world' && !WORLD.arena && !WORLD.guest && WORLD.id;
  if (!COOP.gcode) COOP.gcode = (keep && WORLD.gcode) || sigNewCode(); SIG.mode = mode;
  if (keep && WORLD.gcode !== COOP.gcode) { WORLD.gcode = COOP.gcode; G.dirty = true; }
  sigStart(COOP.gcode, 'host', sigHostMsg); SIG.sayT = 0;
}
function sigHostMsg(m) {
  if (m.t !== 'offer' || typeof m.g !== 'string' || !/^[0-9a-f]{12}$/.test(m.g) || typeof m.sdp !== 'string') return;
  const P0 = SIG.guests.get(m.g); if (P0) { if (m.b) P0.bm = m.b | 0; if (P0.answer) sigSend({ t: 'answer', g: m.g, sdp: P0.answer === 'R' ? '' : P0.answer, r: P0.answer === 'R' ? 1 : 0 }); return; }
  if ((m.v | 0) !== NETV) { sigSend({ t: 'old', g: m.g, v: NETV, gv: GAME_VERSION }); return; }
  if ([...COOP.peers.values()].filter(P => P.ok || P.connT).length >= MAXG) { sigSend({ t: 'full', g: m.g }); return; }
  sigAccept(m);
}
async function sigAccept(m) {
  if (!COOP.role) coopHostStart();
  const P = { id: 'g' + COOP.seq++, pc: null, open: false, ok: false, name: cleanName(m.n) || 'WAKER', snaps: [], connT: performance.now(), sig: m.g, answer: '', bm: m.b | 0, rz: !!m.z };
  SIG.guests.set(m.g, P);
  const viaRelay = () => { P.answer = 'R'; COOP.peers.set(P.id, P); sigSend({ t: 'answer', g: m.g, sdp: '', r: 1 }); COOP.note = P.name + ' is coming in...'; COOP.err = ''; };
  // the friend's window can't make direct links (or this one can't): straight to the relay
  if (m.r || !m.sdp || !rtcOK()) return viaRelay();
  try {
    const pc = P.pc = new RTCPeerConnection(ICE); pc.ondatachannel = e => wireDC(P, e.channel); watchPC(P);
    await pc.setRemoteDescription({ type: 'offer', sdp: m.sdp }); await pc.setLocalDescription(await pc.createAnswer()); await iceDone(pc, 2600);
    if (SIG.guests.get(m.g) !== P) return;
    P.answer = pc.localDescription.sdp; COOP.peers.set(P.id, P); sigSend({ t: 'answer', g: m.g, sdp: P.answer }); COOP.note = P.name + ' is coming in...'; COOP.err = '';
  } catch (e) { const pc = P.pc; P.pc = null; try { pc && pc.close(); } catch (_) { } if (SIG.guests.get(m.g) === P) viaRelay(); }
}
function sigStopHosting() { if (SIG.role === 'host') sigStop(); COOP.gcode = ''; }

// ---------------- joining with a code ----------------
async function sigJoin(code) {
  code = sigClean(code); COOP.err = ''; COOP.note = '';
  if (code.length !== 6) { COOP.err = 'A game code is 6 letters and numbers, like K7P2QX.'; return; }
  if (!netOK()) { COOP.err = 'This window cannot reach the internet. Open Emberwake.html in Chrome, Safari, Edge or Firefox.'; return; }
  if (COOP.busy) return; COOP.busy = true; coopReset(); COOP.busy = true; COOP.note = 'Getting ready...'; const tok = SIG.tok = (SIG.tok | 0) + 1; G.skin = FORM.skin | 0; FORM.nick = coopName(); FORM.gcode = code;
  try {
    const P = { id: 'h', pc: null, open: false, ok: false, name: 'HOST', snaps: [] }; let sdp = '';
    // try for a direct line first; if this window can't make one, the relay will carry everything
    if (rtcOK()) try {
      const pc = P.pc = new RTCPeerConnection(ICE), dc = pc.createDataChannel('ew', { ordered: true });
      wireDC(P, dc); watchPC(P); await pc.setLocalDescription(await pc.createOffer()); await iceDone(pc, 2600); sdp = pc.localDescription.sdp || '';
    } catch (e) { const pc = P.pc; P.pc = null; P.dc = null; try { pc && pc.close(); } catch (_) { } }
    if (tok !== SIG.tok) { try { P.pc && P.pc.close(); } catch (e) { } return; }
    COOP.role = 'guest'; COOP.pend = P; COOP.peers.set('h', P); COOP.joinBR = false; COOP.joinWorld = '';
    SIG.myId = sigHex(crypto.getRandomValues(new Uint8Array(6))); sigStart(code, 'guest', sigGuestMsg); SIG.offer = sdp || 'R'; SIG.offerT = 0; SIG.stage = 'look'; COOP.lastCode = code;
    COOP.note = 'Looking for game ' + code + '...';
  } catch (e) { COOP.err = 'Could not start a connection in this window.'; coopReset(); }
  COOP.busy = false;
}
function sigGuestMsg(m) {
  const P = COOP.peers.get('h'); if (!P || SIG.role !== 'guest') return;
  if (m.t === 'host') {
    if (m.b) P.bm = m.b | 0; P.rz = !!m.z; if (COOP.joined) return;
    if ((m.v | 0) !== NETV) { sigGuestFail(versionClash(m.gv)); return; }
    if (!SIG.host) { SIG.host = m; P.name = cleanName(m.n) || 'HOST'; COOP.hostName = P.name; COOP.joinBR = m.mode === 'br'; COOP.joinWorld = String(m.w || '').slice(0, 30); SIG.stage = 'found'; COOP.note = 'Found ' + P.name + (COOP.joinBR ? "'s battle royale lobby" : "'s world" + (COOP.joinWorld ? ', ' + COOP.joinWorld : '')) + '. Connecting...'; SIG.offerT = 0; }
  } else if (m.g === SIG.myId) {
    if (m.t === 'answer' && !SIG.answered && typeof m.sdp === 'string') {
      SIG.answered = true; SIG.stage = 'link'; P.connT = performance.now(); if (m.b) P.bm = m.b | 0; P.rz = !!m.z;
      const relay = () => { if (!P.relay) { SIG.stage = 'relay'; rlyBegin(P); } };
      if (m.r || !m.sdp || !P.pc) relay(); else P.pc.setRemoteDescription({ type: 'answer', sdp: m.sdp }).catch(relay);
    }
    else if (m.t === 'full') sigGuestFail('That game is full (four Wakers at most).');
    else if (m.t === 'old') sigGuestFail(versionClash(m.gv));
  }
}
function sigGuestFail(msg) { coopReset(); sigStop(); COOP.err = msg; COOP.note = ''; SIG.stage = ''; }
// every frame: keep the boards alive, say hello as host, resend the offer as guest,
// carry relayed talk, and give up kindly
function sigTick() {
  if (!SIG.code) return; const now = performance.now();
  for (const C of SIG.conns) if (C.tick) C.tick(now);
  sigKeep(now); if (SIG.conns.some(C => C.ok)) SIG.everOk = true;
  if (COOP.peers.size) rlyTick(now);
  if (SIG.room && SIG.roomDirty && now - (SIG.roomT || 0) > RLY_ROOM.ms) sigRoomPush();
  if (SIG.role === 'ring') return;
  if (SIG.role === 'host') {
    if (now - SIG.sayT > 2000) { SIG.sayT = now; const n = [...COOP.peers.values()].filter(P => P.ok).length; sigSend({ t: 'host', n: coopName(), mode: SIG.mode || 'world', w: SIG.mode === 'br' ? '' : WORLD.name, v: NETV, gv: GAME_VERSION, full: n >= MAXG ? 1 : 0 }); }
    for (const [g, P] of SIG.guests) if (COOP.peers.get(P.id) !== P && !P.ok && now - P.connT > 30000) SIG.guests.delete(g);
    if (!SIG.viaRoom && NET.room && !window.EW_BROKERS && !COOP.peers.size) { const c = SIG.code, md = SIG.mode; sigStart(c, 'host', sigHostMsg); SIG.mode = md; }
    return;
  }
  const P = COOP.peers.get('h'); if (!P) { sigStop(); return; }
  // once in, the boards stay open: if the direct line ever breaks, the relay takes over
  if (P.ok || COOP.joined || (BR.on && BR.via === 'rtc')) return;
  if (SIG.answered && !P.relay && !dcOpen(P) && now - P.connT > RLY_AFTER) { SIG.stage = 'relay'; rlyBegin(P); }
  if (!SIG.answered && SIG.offer && now - SIG.offerT > (SIG.host ? 2500 : 3500) && sigReady()) { SIG.offerT = now; sigSend({ t: 'offer', g: SIG.myId, n: coopName(), sk: G.skin | 0, v: NETV, gv: GAME_VERSION, sdp: SIG.offer === 'R' ? '' : SIG.offer, r: SIG.offer === 'R' ? 1 : 0 }); }
  const age = now - SIG.startT;
  if (!SIG.room && !SIG.everOk && !SIG.answered && age > 9000) sigGuestFail("Can't reach the internet to look for that game. Check your connection and try again.");
  else if (!SIG.host && !SIG.answered && age > 16000) sigGuestFail('No game is open with that code right now. Check the code, and ask your friend to open PLAY TOGETHER in their world.' + (SIG.room ? '' : ' (Reached ' + SIG.conns.filter(C => C.ok).length + ' of ' + SIG.conns.length + ' message boards.)') + ' A game on the claude.ai page can only be joined from that page; a game in the file or the app, only from the file or the app.');
  else if (SIG.answered && now - P.connT > 35000) sigGuestFail("Found your friend's game, but couldn't get through to it. Check that you both have internet, then try again.");
}

// ---------------- what this computer can do, in a line ----------------
function versionClash(gv) {
  return 'Your friend has a different version of Emberwake' + (gv ? ' (' + String(gv).slice(0, 12) + '; yours is ' + GAME_VERSION + ')' : ' (yours is ' + GAME_VERSION + ')') + '. You both need the same one: send each other the newest Emberwake.html or app.';
}
// can this computer make direct links? A public STUN server tells us how we look from outside.
const PROBE = { st: '' };
async function netProbe() {
  if (PROBE.st) return; if (!rtcOK()) { PROBE.st = 'none'; return; } PROBE.st = 'checking'; let pc = null;
  try {
    pc = new RTCPeerConnection(ICE); pc.createDataChannel('probe'); await pc.setLocalDescription(await pc.createOffer()); await iceDone(pc, 4000);
    const sdp = (pc.localDescription && pc.localDescription.sdp) || ''; PROBE.st = /typ srflx/.test(sdp) ? 'yes' : 'no';
  } catch (e) { PROBE.st = 'no'; }
  try { pc && pc.close(); } catch (e) { }
}
function netStatus() {
  const boards = SIG.room ? 'claude.ai room: connected' : 'Message boards reached: ' + SIG.conns.filter(C => C.ok).length + ' of ' + SIG.conns.length;
  const d = { yes: 'direct links work here', no: 'direct links blocked here (the relay will carry the game)', none: 'no direct links in this window (the relay will carry the game)', checking: 'checking direct links...' }[PROBE.st] || '';
  return boards + (d ? ' - ' + d : '');
}
// a page that is hosting or playing online holds a lock, so the browser doesn't freeze it in the background
const AWAKE = { on: false, release: null };
function netKeepAwake(on) {
  if (on === AWAKE.on) return; AWAKE.on = on;
  if (on) { try { navigator.locks.request('emberwake-online', () => new Promise(r => { AWAKE.release = r; })).catch(() => { }); } catch (e) { } }
  else { try { AWAKE.release && AWAKE.release(); } catch (e) { } AWAKE.release = null; }
}

// ---------------- getting back in ----------------
// the line to the host broke for good (internet down for a while): keep trying the same code a few times
const RETRIES = 5;
function coopRetryTick(now) {
  const R = COOP.retry; if (!R) return;
  if (G.state !== 'join' || COOP.long) { COOP.retry = null; return; }
  if (COOP.role || COOP.busy || SIG.code || now < R.at) return; // a try is still going, or it's not time yet
  if (R.n >= RETRIES) { COOP.retry = null; COOP.err = "Couldn't get back in. Check your internet connection, then press JOIN to try again."; return; }
  R.n++; R.at = now + 6000; sigJoin(R.code);
}

// ---------------- the screens ----------------
const sigSpaced = s => s.split('').join(' ');
function drawCoopPanel(c) {
  if (COOP.long && !netGuest()) return drawCoopLong(c);
  const nf = [...COOP.peers.values()].filter(P => P.ok && P.f).length, w = min(380, VS.uw - 16), h = 246 + nf * 12, x = round((VS.uw - w) / 2), y = round((VS.uh - h) / 2);
  panel(c, x, y, w, h, 'PLAY TOGETHER'); hit(x, y, w, h, () => { });
  button(c, x + w - 20, y + 2, 16, 11, 'X', () => { closeUI(); });
  const fx = x + 10, fw = w - 20; let ty = y + 18;
  // everyone here: how each is connected, and a way to find them
  drawText(c, 'IN THIS WORLD: ' + coopName() + (netGuest() ? '' : ' (host)'), fx, ty, '#8ff5e6'); ty += 11;
  for (const P of COOP.peers.values()) {
    if (!P.ok || !P.f) continue; const f = P.f, here = netFriends().includes(f);
    drawText(c, P.name + (P.id === 'h' ? ' (host)' : ''), fx + 8, ty, '#e8edf2'); drawText(c, P.ghostPeer ? 'through your host' : linkTag(P), fx + 96, ty, P.relay && !dcOpen(P) ? '#ffd35a' : '#8b8fa3');
    if (here && !f.dead) button(c, fx + fw - 52, ty - 2, 50, 11, 'GO TO', () => goToFriend(f)); else drawText(c, f.dead ? 'resting' : 'elsewhere', fx + fw - 50, ty, '#6a6485');
    ty += 12;
  }
  ty += 3;
  if (netGuest()) {
    ['You are in ' + (COOP.hostName || 'a friend') + "'s world.", 'Your pack is saved on this computer for next time.'].forEach((l, i) => drawText(c, l, fx, ty + i * 10, '#d8d4e6'));
    button(c, fx, y + h - 22, 120, 15, 'LEAVE THEIR WORLD', () => { closeUI(); quitToTitle(); }, { col: '#ff9a8a' }); return;
  }
  if (!netOK()) { ['This window cannot connect to other computers.', 'Open Emberwake.html in Chrome, Safari, Edge or Firefox to play together.'].forEach((l, i) => drawText(c, l, fx, ty + i * 10, '#ffb347')); return; }
  sigHost('world');
  drawText(c, 'YOUR NAME', fx, ty + 3, '#b9bdd0'); const el = domBox('hname', fx + 62, ty, 120, 12, { input: true, val: FORM.nick || G.nick || 'WAKER' }); const nm = cleanName(el.value); if (nm && nm !== FORM.nick) { FORM.nick = nm; if (G.p) G.p.name = nm; } ty += 20;
  drawText(c, 'YOUR GAME CODE', fx, ty, '#b9bdd0'); ty += 10;
  c.fillStyle = '#16121f'; c.fillRect(fx, ty, fw, 30); c.fillStyle = '#6a6485'; c.fillRect(fx, ty, fw, 1);
  textC(c, sigSpaced(COOP.gcode || '......'), fx + (fw - 64) / 2, ty + 7, '#ffd35a', 2, textO);
  button(c, fx + fw - 60, ty + 3, 56, 12, copyLabel(), () => copyText(COOP.gcode, 'gcopy'));
  // a fresh code would cut off anyone using this one, so it's only offered while nobody is here
  if (!COOP.peers.size) button(c, fx + fw - 60, ty + 16, 56, 11, 'NEW CODE', () => { sigStopHosting(); COOP.gcode = sigNewCode(); sigHost('world'); sfx('ui'); });
  ty += 36;
  const ready = sigReady(), slow = performance.now() - SIG.startT > 7000;
  const st = COOP.err ? [COOP.err, '#ff9a8a'] : ready ? ['Ready. Your friends open Emberwake, pick JOIN A FRIEND, and type this code. Up to 3 can join.', '#7ddc6f'] : slow ? ["Can't reach the internet right now, so friends can't find this game. Check your connection, or use long codes (below).", '#ffb347'] : ['Getting ready...', '#ffd35a'];
  wrapDraw(c, st[0], fx, ty, fw, st[1]); ty += 24;
  if (COOP.note) { wrapDraw(c, COOP.note, fx, ty, fw, '#7ddc6f'); ty += 12; }
  if (COOP.copied > 0 && COOP.copyFail) copyHint(c, fx, ty);
  netProbe(); drawText(c, netStatus(), fx, y + h - 44, '#8b8fa3');
  drawText(c, SIG.viaRoom ? 'Friends join from this same page on claude.ai.' : 'Friends need this same version (' + GAME_VERSION + '), as the file or the app.', fx, y + h - 34, '#8b8fa3');
  drawText(c, 'Keep the game running while friends play (switching windows is fine).', fx, y + h - 24, '#8b8fa3');
  button(c, x + w - 132, y + h - 15, 124, 11, 'USE LONG CODES INSTEAD', () => { COOP.long = true; COOP.err = ''; sfx('ui'); });
}
function drawJoin(c) {
  if (COOP.long) return drawJoinLong(c);
  const uw = VS.uw, uh = VS.uh, w = min(360, uw - 16), h = 214, x = round((uw - w) / 2), y = max(8, round((uh - h) / 2));
  c.fillStyle = 'rgba(18,13,31,.55)'; c.fillRect(0, 0, uw, uh); panel(c, x, y, w, h, 'JOIN A FRIEND');
  const fx = x + 10, fw = w - 20; let ty = y + 20;
  drawText(c, 'NAME', fx, ty + 4, '#b9bdd0'); field(c, fx + 46, ty, 130, 'nick', 'WAKER'); skinPicker(c, fx + 190, ty - 2); ty += 34;
  if (!netOK()) { ['This window cannot connect to other computers.', 'Open Emberwake.html in Chrome, Safari, Edge or Firefox to play together.'].forEach((l, i) => drawText(c, l, fx, ty + i * 10, '#ffb347')); }
  else {
    drawText(c, 'GAME CODE  (your friend sees it in PLAY TOGETHER)', fx, ty, '#d8d4e6'); ty += 11;
    const busy = (SIG.role === 'guest' && !!SIG.code) || COOP.busy, go = () => { if (!(SIG.role === 'guest' && SIG.code) && !COOP.busy) sigJoin(domVal('gcin')); };
    const el = domBox('gcin', fx, ty, 120, 22, { input: true, ph: 'K7P2QX', onEnter: go }); el.maxLength = 8; if (!el.dataset.pre && FORM.gcode) { el.value = FORM.gcode; el.dataset.pre = '1'; } el.style.textTransform = 'uppercase'; el.style.letterSpacing = '3px'; el.style.fontSize = max(12, round(parseFloat(el.style.fontSize) * 1.6)) + 'px';
    if (!busy && !COOP.retry) button(c, fx + 128, ty + 3, 80, 16, 'JOIN', go); else button(c, fx + 128, ty + 3, 80, 16, 'CANCEL', () => { SIG.tok = (SIG.tok | 0) + 1; COOP.retry = null; coopReset(); sigStop(); COOP.note = ''; COOP.err = ''; COOP.busy = false; sfx('ui'); });
    ty += 30;
    const st = COOP.retry ? 'Lost the connection to ' + (COOP.hostName || 'your friend') + '. Getting back in (try ' + max(1, COOP.retry.n) + ' of ' + RETRIES + ')...' : COOP.err || COOP.note;
    if (st) wrapDraw(c, st, fx, ty, fw, COOP.err && !COOP.retry ? '#ff9a8a' : COOP.retry ? '#ffd35a' : '#7ddc6f');
    if (busy) { const d = '.'.repeat(1 + ((G.time >> 4) % 3)); drawText(c, SIG.stage === 'relay' ? 'no direct line here, going through the relay' + d : SIG.stage === 'link' ? 'connecting' + d : SIG.stage === 'found' ? 'saying hello' + d : 'searching' + d, fx, ty + 22, '#8b8fa3'); }
  }
  drawText(c, 'You bring your own pack to their world; it is kept for next time.', fx, y + h - 36, '#8b8fa3');
  button(c, fx, y + h - 22, 140, 13, 'I HAVE A LONG INVITE CODE', () => { COOP.long = true; COOP.err = ''; sigStop(); sfx('ui'); });
  button(c, x + w - 70, y + h - 22, 60, 13, 'BACK', () => { COOP.retry = null; coopLeave(); coopReset(); sigStop(); COOP.err = ''; COOP.note = ''; G.state = 'title'; UI.focus = null; sfx('ui'); });
}
