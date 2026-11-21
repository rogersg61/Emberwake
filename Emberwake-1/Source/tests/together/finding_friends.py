# Finding each other: friends on the map and minimap, pointers at the screen edge, and GO TO.
import asyncio, sys, io, os
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from broker import Broker
from harness import sheet
from PIL import Image
URL = GAME_URL
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
PORT = 18885
async def main():
    Broker(PORT).start(); await asyncio.sleep(.3)
    pw = await async_playwright().start(); errs = []; res = {}; ims = []
    async def page(name, init=''):
        b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME); ctx = await b.new_context(viewport={'width': 960, 'height': 540})
        await ctx.add_init_script("window.EW_BROKERS = ['ws://127.0.0.1:%d/mqtt'];" % PORT + init); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(name + ' PAGEERROR: ' + str(e)))
        pg.on('console', lambda m: errs.append(name + ' ' + m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
        await pg.goto(URL); await pg.wait_for_timeout(600); return b, pg
    async def wait(pg, js, ms=15000):
        for i in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False
    bA, A = await page('HOST'); bB, B = await page('BRAVO', 'delete window.RTCPeerConnection; window.RTCPeerConnection = undefined;'); bC, C = await page('CHARLIE')
    await A.evaluate("Object.assign(WORLD,{id:'ff',name:'Find Friends',seed:4242,size:1,shape:0,mode:0,arena:false}); FORM.nick='ALPHA'; startWorld(null);")
    await wait(A, "G.state==='intro'||G.state==='play'")
    await A.evaluate("if (G.state==='intro') beginPlay(true); G.says.length=0; G.sayCur=null; G.cine=null; G.time=700; G.spawnT=1e9; G.p.inv=999999; UI.open='coop';")
    await wait(A, "!!COOP.gcode && sigReady()", 8000); code = await A.evaluate("COOP.gcode")
    for pg, n in ((B, 'BRAVO'), (C, 'CHARLIE')):
        await pg.evaluate("FORM.nick=%r; G.state='join';" % n); await pg.evaluate("sigJoin(%r)" % code)
        await wait(pg, "G.state==='play' && WORLD.guest && COOP.joined", 30000); await pg.evaluate("G.p.inv = 999999; G.says.length = 0; G.sayCur = null; mapReveal();")
    await A.wait_for_timeout(1500)
    ims.append(Image.open(io.BytesIO(await A.screenshot())))
    # BRAVO wanders far east
    await B.evaluate("(() => { const x = floor((G.p.x + 3) / T) + 70; streamTo(x * T, true); G.p.x = G.p.px = x * T; G.p.y = G.p.py = (heights[x] - 4) * T; snapCam(); })()")
    await A.evaluate("closeUI(); UI.open = null;"); await A.wait_for_timeout(1500)
    ims.append(Image.open(io.BytesIO(await A.screenshot())))
    await A.evaluate("mapReveal(); UI.open = 'map';"); await A.wait_for_timeout(500)
    ims.append(Image.open(io.BytesIO(await A.screenshot())))
    await A.evaluate("UI.open = null;")
    res['friends known to host'] = await A.evaluate("netFriends().map(f => f.name).join(',')")
    # GO TO BRAVO from CHARLIE's game (CHARLIE knows BRAVO through the host)
    await C.evaluate("UI.open = 'coop';"); await C.wait_for_timeout(500)
    ims.append(Image.open(io.BytesIO(await C.screenshot())))
    d0 = await C.evaluate("(() => { const f = netFriends().find(f => f.name === 'BRAVO'); return f ? round(abs(f.x - G.p.x) / T) : -1; })()")
    await C.evaluate("goToFriend(netFriends().find(f => f.name === 'BRAVO'))"); await C.wait_for_timeout(700)
    d1 = await C.evaluate("(() => { const f = netFriends().find(f => f.name === 'BRAVO'); return f ? round(abs(f.x - G.p.x) / T) : -1; })()")
    res['CHARLIE to BRAVO, tiles apart before / after GO TO'] = [d0, d1, await C.evaluate("!boxHits(G.p.x, G.p.y, G.p.w, G.p.h)")]
    await C.wait_for_timeout(1200); ims.append(Image.open(io.BytesIO(await C.screenshot())))
    for k, v in res.items(): print(k, '=>', v)
    sheet(ims, 2, shot('find_friends.png'), ['host: panel', 'host: pointer to BRAVO', 'host: map', 'CHARLIE: panel', 'CHARLIE after GO TO'], .5)
    print('errors:', [e for e in errs if 'agent-proxy' not in e][:8])
    for b in (bA, bB, bC): await b.close()
    await pw.stop()
asyncio.run(main())
