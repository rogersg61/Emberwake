# More relay cases: the claude.ai room, starting on the relay then switching to a direct line, and a host with no direct links.
#  A. claude.ai: the relay rides in the page's live room (mock room), friend has no WebRTC.
#  B. A friend starts on the relay, then the direct line comes up: the switch must not reorder anything.
#  C. A host whose window has no WebRTC: everyone comes in through the relay.
import asyncio, subprocess, sys, os, time
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from broker import Broker
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
URL = GAME_URL
PORT = 18852
NO_RTC = "delete window.RTCPeerConnection; window.RTCPeerConnection = undefined;"
async def wait(pg, js, ms=15000):
    for i in range(ms // 100):
        if await pg.evaluate(js): return True
        await pg.wait_for_timeout(100)
    return False
async def host_world(A, wid, name, seed):
    await A.evaluate("Object.assign(WORLD,{id:%r,name:%r,seed:%d,size:1,shape:0,mode:0,arena:false}); FORM.nick='ALPHA'; startWorld(null);" % (wid, name, seed))
    await wait(A, "G.state==='intro'||G.state==='play'"); await A.evaluate("if (G.state==='intro') beginPlay(true); G.cine=null; G.says.length=0; G.sayCur=null; G.time=700; G.spawnT=1e9; G.p.inv=999999;")
    await A.wait_for_timeout(600); await A.evaluate("G.cine = null; UI.open = 'coop';")
    await wait(A, "!!COOP.gcode && sigReady()", 10000); return await A.evaluate("COOP.gcode")
BUILD = """(() => { const tx = floor((G.p.x + 3) / T); for (let k = 0; k < %d; k++) { const x = tx + 3 + k, y = heights[x] - %d; setTile(x, y, %s); PLACED.add(y * WW + x); } return tx; })()"""
CHK = """(() => { let n = 0; for (let k = 0; k < %d; k++) { const x = %d + 3 + k; if (tileAt(x, heights[x] - %d) === %s) n++; } return n; })()"""
async def main():
    pw = await async_playwright().start(); res = {}; errs = []
    def watch(pg, n):
        pg.on('pageerror', lambda e: errs.append(n + ' PAGEERROR ' + str(e)))
        pg.on('console', lambda m: errs.append(n + ' ' + m.text) if m.type in ('error', 'warning') and 'favicon' not in m.text and '404' not in m.text and '127.0.0.1:1' not in m.text and 'CONNECTION_REFUSED' not in m.text else None)
    # ---------- A: the room ----------
    srv = subprocess.Popen(['python3', '-m', 'http.server', '8771', '--bind', '127.0.0.1'], cwd=GAME_DIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME)
    ctx = await b.new_context(viewport={'width': 960, 'height': 540}); await ctx.add_init_script(path=os.path.join(HELPERS, 'mock_room.js'))
    A = await ctx.new_page(); watch(A, 'ROOMHOST'); await A.goto('http://127.0.0.1:8771/Emberwake.html'); await A.wait_for_timeout(1500)
    B = await ctx.new_page(); watch(B, 'ROOMGUEST'); await B.goto('http://127.0.0.1:8771/Emberwake.html'); await B.wait_for_timeout(1500)
    code = await host_world(A, 'rw', 'Room World', 31)
    await B.evaluate(NO_RTC + " FORM.nick='BRAVO'; G.state='join';"); t = time.time(); await B.evaluate("sigJoin(%r)" % code)
    ok = await wait(B, "G.state==='play' && WORLD.guest && COOP.joined", 40000)
    res['A room: relay-only friend joined (s), line'] = [ok, round(time.time() - t, 1), await B.evaluate("linkTag(COOP.peers.get('h'))")]
    await B.evaluate("G.p.inv = 999999; G.says.length = 0; G.sayCur = null;")
    tx = await B.evaluate(BUILD % (20, 4, 'PLANK')); await B.evaluate("chatSend('room relay ok')")
    await A.wait_for_timeout(4000)
    res['A room: friend built 20, host has'] = await A.evaluate(CHK % (20, tx, 4, 'PLANK'))
    res['A room: chat'] = await A.evaluate("COOP.chat.some(l => /room relay ok/.test(l.s))")
    res['A room: presence size (KB)'] = await A.evaluate("round(JSON.stringify(SIG.room ? {} : {}).length)")
    await b.close(); srv.terminate()
    # ---------- B: relay first, then the direct line ----------
    broker = Broker(PORT).start(); await asyncio.sleep(.3); broker.delay = 0.08
    async def page(name, init=''):
        bb = await pw.chromium.launch(headless=True, args=ARGS, **CHROME)
        c = await bb.new_context(viewport={'width': 960, 'height': 540})
        await c.add_init_script("window.EW_BROKERS = ['ws://127.0.0.1:%d/mqtt'];" % PORT + init)
        pg = await c.new_page(); watch(pg, name); await pg.goto(URL); await pg.wait_for_timeout(600); return bb, pg
    bH, H = await page('HOST'); bE, E = await page('EARLY')
    code = await host_world(H, 'uw', 'Upgrade World', 77)
    await E.evaluate("FORM.nick='ECHO'; G.state='join';"); await E.evaluate("sigJoin(%r)" % code)
    # the moment the answer arrives, start the relay before the direct line can open
    await wait(E, "SIG.answered", 20000); await E.evaluate("rlyBegin(COOP.peers.get('h'))")
    ok = await wait(E, "G.state==='play' && WORLD.guest && COOP.joined", 30000)
    res['B joined on the relay'] = [ok, await E.evaluate("linkTag(COOP.peers.get('h'))")]
    await E.evaluate("G.p.inv = 999999; G.says.length = 0; G.sayCur = null;")
    # keep building while the line switches over: one tile, rewritten many times; the last word must win everywhere
    tx = await E.evaluate("floor((G.p.x + 3) / T) + 4")
    for i in range(40):
        await E.evaluate("(() => { const x = %d, y = heights[x] - 5; setTile(x, y, %s); })()" % (tx, 'PLANK' if i % 2 == 0 else 'STONE'))
        await E.wait_for_timeout(120)
    await E.evaluate("(() => { const x = %d, y = heights[x] - 5; setTile(x, y, BRICK); })()" % tx)
    await H.wait_for_timeout(3000)
    res['B line after a while (guest, host)'] = [await E.evaluate("linkTag(COOP.peers.get('h'))"), await H.evaluate("[...COOP.peers.values()].map(linkTag).join()")]
    res['B last write won on host'] = await H.evaluate("tileAt(%d, heights[%d] - 5) === BRICK" % (tx, tx))
    await H.evaluate("(() => { const x = %d, y = heights[x] - 7; setTile(x, y, PLANK); })()" % tx); await H.wait_for_timeout(1200)
    res['B host builds, guest sees (direct now)'] = await E.evaluate("tileAt(%d, heights[%d] - 7) === PLANK" % (tx, tx))
    await bE.close(); await bH.close()
    # ---------- C: a host with no WebRTC ----------
    bH2, H2 = await page('HOST-NORTC', NO_RTC); bF, F = await page('FOXTROT')
    code = await host_world(H2, 'nw', 'No Link World', 55)
    await F.evaluate("FORM.nick='FOXTROT'; G.state='join';"); t = time.time(); await F.evaluate("sigJoin(%r)" % code)
    ok = await wait(F, "G.state==='play' && WORLD.guest && COOP.joined", 30000)
    res['C friend joined a host without WebRTC (s), line'] = [ok, round(time.time() - t, 1), await F.evaluate("linkTag(COOP.peers.get('h'))")]
    await F.evaluate("G.p.inv = 999999;"); tx = await F.evaluate(BUILD % (10, 4, 'PLANK')); await H2.wait_for_timeout(2500)
    res['C friend built 10, host has'] = await H2.evaluate(CHK % (10, tx, 4, 'PLANK'))
    for k, v in res.items(): print(k, '=>', v)
    print('errors:', errs[:10])
    await bF.close(); await bH2.close(); await pw.stop()
asyncio.run(main())
