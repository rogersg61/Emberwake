# Playing together where direct links are impossible: the relay.
# HOST: a normal window. NOLINK: a window with no WebRTC at all (relay only).
# BLOCKED: WebRTC exists but every route is blocked (falls back after a few seconds).
# DIRECT: a normal friend whose direct line is cut mid-game (switches to the relay).
# The local broker can lose and delay messages like a far-away public board.
import asyncio, sys, os, time
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from broker import Broker
URL = GAME_URL
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
PORT = 18841
NO_RTC = "delete window.RTCPeerConnection; window.RTCPeerConnection = undefined;"
BLOCK = r"""(() => { const P = RTCPeerConnection.prototype, strip = d => d && d.sdp ? { type: d.type, sdp: d.sdp.split('\r\n').filter(l => !/^a=(candidate|end-of-candidates)/.test(l)).join('\r\n') } : d;
  const ld = Object.getOwnPropertyDescriptor(P, 'localDescription'); Object.defineProperty(P, 'localDescription', { configurable: true, get() { return strip(ld.get.call(this)); } });
  const srd = P.setRemoteDescription; P.setRemoteDescription = function (d) { return srd.call(this, strip(d)); }; })();"""
async def main():
    broker = Broker(PORT).start(); await asyncio.sleep(.3)
    pw = await async_playwright().start(); errs = []
    async def page(name, init=''):
        b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME)
        ctx = await b.new_context(viewport={'width': 960, 'height': 540})
        await ctx.add_init_script("window.EW_BROKERS = ['ws://127.0.0.1:%d/mqtt', 'ws://127.0.0.1:1/mqtt'];" % PORT + init)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(name + ' PAGEERROR: ' + str(e)))
        pg.on('console', lambda m: errs.append(name + ' ' + m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
        await pg.goto(URL); await pg.wait_for_timeout(600); return b, pg
    async def wait(pg, js, ms=15000):
        for i in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False
    res = {}
    bA, A = await page('HOST'); bB, B = await page('NOLINK', NO_RTC); bC, C = await page('BLOCKED', BLOCK); bD, D = await page('DIRECT')
    await A.evaluate("Object.assign(WORLD,{id:'relayworld',name:'Relay Test',seed:4242,size:1,shape:0,mode:0,arena:false}); G.skin=0; FORM.nick='ALPHA'; startWorld(null);")
    await wait(A, "G.state==='intro'||G.state==='play'")
    await A.evaluate("if (G.state==='intro') beginPlay(true); G.says.length=0; G.sayCur=null; G.cine=null; G.time=700; G.spawnT=1e9; G.p.inv=999999; UI.open='coop';")
    await wait(A, "!!COOP.gcode && sigReady()", 8000); code = await A.evaluate("COOP.gcode")
    # a far-away board: 60-140 ms each way
    broker.delay = 0.1
    async def join(pg, nick, skin):
        await pg.evaluate("FORM.nick=%r; FORM.skin=%d; G.state='join'; COOP.long=false;" % (nick, skin))
        t = time.time(); await pg.evaluate("sigJoin(%r)" % code)
        ok = await wait(pg, "G.state==='play' && WORLD.guest && COOP.joined", 40000)
        how = await pg.evaluate("(() => { const P = COOP.peers.get('h'); return P ? linkTag(P) : '-'; })()")
        return [ok, round(time.time() - t, 1), how]
    res['no WebRTC at all: joined, seconds, line'] = await join(B, 'BRAVO', 2)
    res['every route blocked: joined, seconds, line'] = await join(C, 'CHARLIE', 1)
    res['normal friend: joined, seconds, line'] = await join(D, 'DELTA', 3)
    await A.wait_for_timeout(2500)
    res['host people list'] = await A.evaluate("[...COOP.peers.values()].map(P => P.name + ' (' + linkTag(P) + ')').join(', ')")
    for pg in (B, C, D): await pg.evaluate("G.p.inv = 999999; G.says.length = 0; G.sayCur = null;")
    # moving: the host sees the relayed friend where they are
    await B.evaluate("keys.KeyD = true"); await B.wait_for_timeout(900); await B.evaluate("keys.KeyD = false"); await B.wait_for_timeout(900)
    bx = await B.evaluate("G.p.x"); seen = await A.evaluate("(() => { const P = [...COOP.peers.values()].find(P => P.name === 'BRAVO'); return P && P.f ? P.f.x : -1; })()")
    res['relayed friend moved; host sees them within (px)'] = round(abs(bx - seen), 1)
    res['relayed friends see each other'] = [await B.evaluate("[...COOP.peers.values()].filter(P => P.f).map(P => P.f.name).sort().join(',')"), await C.evaluate("[...COOP.peers.values()].filter(P => P.f).map(P => P.f.name).sort().join(',')")]
    # building through a lossy board: nothing may go missing
    broker.loss = 0.25
    tx = await B.evaluate("floor((G.p.x + 3) / T)")
    await B.evaluate("""(() => { for (let k = 0; k < 24; k++) { const x = %d + 3 + k, y = heights[x] - 4; setTile(x, y, PLANK); PLACED.add(y * WW + x); } })()""" % tx)
    await B.wait_for_timeout(500)
    await C.evaluate("""(() => { for (let k = 0; k < 24; k++) { const x = %d + 3 + k, y = heights[x] - 6; setTile(x, y, STONE); } })()""" % tx)
    await B.wait_for_timeout(500)
    await B.evaluate("chatSend('hello through the relay')")
    await A.wait_for_timeout(6000); broker.loss = 0.0
    await A.wait_for_timeout(3000)
    chk = """(() => { let a = 0, b = 0; for (let k = 0; k < 24; k++) { const x = %d + 3 + k; if (tileAt(x, heights[x] - 4) === PLANK) a++; if (tileAt(x, heights[x] - 6) === STONE) b++; } return [a, b]; })()""" % tx
    res['after 25% loss: planks/stones on host, BRAVO, CHARLIE, DELTA (of 24)'] = [await A.evaluate(chk), await B.evaluate(chk), await C.evaluate(chk), await D.evaluate(chk)]
    res['chat arrived'] = [await pg.evaluate("COOP.chat.some(l => /through the relay/.test(l.s))") for pg in (A, C, D)]
    res['bundles resent / waiting'] = await A.evaluate("[...COOP.peers.values()].map(P => P.name + ':' + (P.relay ? P.rs + '/' + P.rw.size + '/' + P.rq.length : 'direct')).join(' ')")
    # creatures: the host's husk reaches the relayed friend's screen and takes their blows
    await A.evaluate("(() => { const P = [...COOP.peers.values()].find(P => P.name === 'BRAVO'), f = P.f, x = floor((f.x + 3) / T) + 5, e = spawnMob('husk', x, heights[x]); e.hp = e.maxhp = 80; e.nid = COOP.nid++; window.HUSK = e; })()")
    seen = await wait(B, "[...COOP.ghosts.values()].some(g => g.type === 'husk')", 6000); res['husk shows on relayed friend'] = seen
    hp0 = await A.evaluate("HUSK.hp")
    await B.evaluate("(() => { const g = [...COOP.ghosts.values()].find(g => g.type === 'husk'); if (g) damageEnemy(g, 25, 2, -1, {}); })()")
    await A.wait_for_timeout(1500); res['relayed blow lands on host'] = [hp0, await A.evaluate("HUSK.hp")]
    # the normal friend's direct line breaks mid-game: they carry on through the relay
    res['DELTA before'] = await D.evaluate("linkTag(COOP.peers.get('h'))")
    await D.evaluate("COOP.peers.get('h').dc.close()")
    await D.wait_for_timeout(2500)
    res['DELTA after the line broke'] = [await D.evaluate("COOP.joined && G.state"), await D.evaluate("linkTag(COOP.peers.get('h'))"), await A.evaluate("(() => { const P = [...COOP.peers.values()].find(P => P.name === 'DELTA'); return P ? linkTag(P) : 'gone'; })()")]
    await D.evaluate("chatSend('still here')"); await A.wait_for_timeout(1500)
    res['DELTA still talks'] = await A.evaluate("COOP.chat.some(l => /still here/.test(l.s))")
    # bandwidth through the board while three friends play over it
    b0 = broker.relay_bytes; await A.wait_for_timeout(5000); res['relay traffic (KB/s, all friends)'] = round((broker.relay_bytes - b0) / 5000, 1)
    res['smoothing delay for relayed friend (ms)'] = await A.evaluate("(() => { const P = [...COOP.peers.values()].find(P => P.name === 'BRAVO'); return P && P.f ? round(P.f.delay) : -1; })()")
    # a relayed friend closes the window: the host hears at once
    await C.close(); await bC.close()
    t = time.time(); gone = await wait(A, "![...COOP.peers.values()].some(P => P.name === 'CHARLIE')", 15000)
    res['closed window noticed (seconds)'] = [gone, round(time.time() - t, 1)]
    for k, v in res.items(): print(k, '=>', v)
    print('errors:', [e for e in errs if 'agent-proxy' not in e and 'favicon' not in e and '127.0.0.1:1' not in e and 'ERR_CONNECTION_REFUSED' not in e][:10])
    for b in (bA, bB, bD): await b.close()
    await pw.stop()
asyncio.run(main())
