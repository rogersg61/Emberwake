# Playing together with a short game code: the host opens PLAY TOGETHER, the friend types the code.
# A local stand-in broker plays the part of the public ones.
import asyncio, sys, io, os, time
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from broker import Broker
from harness import sheet
from PIL import Image
URL = GAME_URL
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
PORT = 18830
async def main():
    broker = Broker(PORT).start(); await asyncio.sleep(.3)
    pw = await async_playwright().start(); errs = []
    async def page(name, brokers=True):
        b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME)
        ctx = await b.new_context(viewport={'width': 960, 'height': 540})
        if brokers: await ctx.add_init_script("window.EW_BROKERS = ['ws://127.0.0.1:%d/mqtt'];" % PORT)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(name + ' PAGEERROR: ' + str(e)))
        pg.on('console', lambda m: errs.append(name + ' ' + m.type + ': ' + m.text) if m.type == 'error' else None)
        await pg.goto(URL); await pg.wait_for_timeout(700); return b, pg
    async def wait(pg, js, ms=15000):
        for i in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False
    res = {}; ims = []
    bA, A = await page('HOST'); bB, B = await page('GUEST'); bC, C = await page('THIRD')
    await A.evaluate("Object.assign(WORLD,{id:'codeworld',name:'Code Test',seed:777,size:1,shape:0,mode:0,arena:false}); G.skin=0; FORM.nick='ALPHA'; startWorld(null);")
    await wait(A, "G.state==='intro'||G.state==='play'")
    await A.evaluate("if (G.state==='intro') beginPlay(true); G.says.length=0; G.sayCur=null; G.cine=null; G.p.inv=999999;")
    # the host opens PLAY TOGETHER: a code appears and the board connects
    await A.evaluate("UI.open = 'coop';")
    t0 = time.time(); ready = await wait(A, "!!COOP.gcode && sigReady()", 8000)
    code = await A.evaluate("COOP.gcode"); res['host code, ready'] = [code, ready, round(time.time() - t0, 1)]
    ims.append(Image.open(io.BytesIO(await A.screenshot())))
    # the friend: JOIN A FRIEND, types the code into the box, presses JOIN (real typing)
    await B.evaluate("FORM.nick = 'BRAVO'; FORM.skin = 2; G.state = 'join'; COOP.long = false;")
    await B.wait_for_timeout(300)
    box = await B.query_selector('#ew-gcin'); await box.click(); await B.keyboard.type(code.lower()); await B.keyboard.press('Enter')
    t1 = time.time(); ok = await wait(B, "G.state==='play' && WORLD.guest && COOP.joined", 25000)
    res['friend joined with the code (seconds)'] = [ok, round(time.time() - t1, 1)]
    res['friend sees'] = await B.evaluate("[COOP.hostName, WORLD.name, [...COOP.peers.values()].map(P => P.name + ':' + P.ok).join(';'), SIG.code === '' ]")
    await A.wait_for_timeout(800)
    res['host sees'] = await A.evaluate("[...COOP.peers.values()].map(P => P.name + ':' + P.ok).join(';')")
    ims.append(Image.open(io.BytesIO(await B.screenshot())))
    # a third friend with the same code
    await C.evaluate("FORM.nick = 'CHARLIE'; FORM.skin = 1; G.state = 'join';"); await C.evaluate("sigJoin(%r)" % code)
    ok3 = await wait(C, "G.state==='play' && WORLD.guest && COOP.joined", 25000)
    await A.wait_for_timeout(800)
    res['third joined; host sees'] = [ok3, await A.evaluate("[...COOP.peers.values()].filter(P => P.ok).map(P => P.name).join(',')")]
    res['guests see each other'] = [await B.evaluate("COOP.hghosts ? [...COOP.hghosts.values()].map(f => f.name).join(',') : ''"), await C.evaluate("COOP.hghosts ? [...COOP.hghosts.values()].map(f => f.name).join(',') : ''")]
    # a wrong code: a kind message, not a hang
    bD, D = await page('WRONG')
    await D.evaluate("FORM.nick = 'DELTA'; G.state = 'join';"); await D.evaluate("sigJoin('ZZZZZZ')")
    await wait(D, "!!COOP.err", 22000); res['wrong code says'] = await D.evaluate("COOP.err")
    # no internet at all: says so quickly
    bE, E = await page('OFFLINE', brokers=False)
    await E.evaluate("window.EW_BROKERS = ['ws://127.0.0.1:1/mqtt']; FORM.nick = 'ECHO'; G.state = 'join';"); await E.evaluate("sigJoin(%r)" % code)
    await wait(E, "!!COOP.err", 12000); res['offline says'] = await E.evaluate("COOP.err")
    res['sealed notes on the broker'] = broker.published
    for k, v in res.items(): print(k, '=>', v)
    sheet(ims, 2, shot('gamecode.png'), ['host: PLAY TOGETHER', 'friend: joined'], .5)
    print('errors:', [e for e in errs if 'agent-proxy' not in e and 'favicon' not in e and '404' not in e][:8])
    for b in (bA, bB, bC, bD, bE): await b.close()
    await pw.stop()
asyncio.run(main())
