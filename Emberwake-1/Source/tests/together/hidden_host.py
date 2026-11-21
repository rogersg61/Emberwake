# The host's game is in a background tab (another tab in front, normal browser throttling) while a friend joins and plays.
import asyncio, os, sys, time
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, CHROME
from broker import Broker
from playwright.async_api import async_playwright
PORT = 18911
async def main():
    Broker(PORT).start(); await asyncio.sleep(.3)
    pw = await async_playwright().start(); res = {}; errs = []
    async def browser(name):
        # no anti-throttling flags, like a real browser; with a display, a real window whose background tabs really hide
        b = await pw.chromium.launch(headless=not os.environ.get('DISPLAY'), args=['--no-sandbox'], **CHROME)
        ctx = await b.new_context(viewport={'width': 960, 'height': 540})
        await ctx.add_init_script("window.EW_BROKERS = ['ws://127.0.0.1:%d/mqtt'];" % PORT)
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(name + ' ' + str(e)))
        await pg.goto(GAME_URL); await pg.wait_for_timeout(700); return b, ctx, pg
    async def wait(pg, js, ms=20000):
        for _ in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False
    bA, cA, A = await browser('HOST'); bB, cB, B = await browser('FRIEND')
    await A.evaluate("Object.assign(WORLD,{id:'hh',name:'Hidden Host',seed:4242,size:1,shape:0,mode:0,arena:false}); FORM.nick='ALPHA'; startWorld(null); 0")
    await wait(A, "G.state==='intro'||G.state==='play'")
    await A.evaluate("if (G.state==='intro') beginPlay(true); G.cine=null; G.says.length=0; G.sayCur=null; G.p.inv=999999; UI.open='coop'; 0")
    await wait(A, "!!COOP.gcode && sigReady()"); code = await A.evaluate("COOP.gcode")
    # the host switches to another tab: the game's tab is now hidden
    other = await cA.new_page(); await other.goto('about:blank'); await other.bring_to_front(); await other.wait_for_timeout(1500)
    res['host tab hidden'] = await A.evaluate("document.visibilityState")
    t0 = await A.evaluate("G.time")
    await B.evaluate("FORM.nick='BRAVO'; G.state='join'; 0"); t = time.time(); await B.evaluate("sigJoin(%r); 0" % code)
    ok = await wait(B, "G.state==='play' && COOP.joined", 40000)
    res['friend joined a hidden host (seconds)'] = [ok, round(time.time() - t, 1)]
    await B.wait_for_timeout(4000)
    t1 = await A.evaluate("G.time")
    res['host world kept ticking while hidden (ticks per second)'] = round((t1 - t0) / (time.time() - t + 0.001), 1)
    res['friend sees the host as away'] = await B.evaluate("(() => { const P = COOP.peers.get('h'); return !!(P && P.f && P.f.away); })()")
    res['host holds the keep-awake lock'] = await A.evaluate("AWAKE.on")
    res['host status line'] = await A.evaluate("netStatus()")
    await A.bring_to_front(); await A.wait_for_timeout(1200)
    res['host back: friend still here'] = await A.evaluate("[...COOP.peers.values()].filter(P => P.ok).map(P => P.name).join(',')")
    for k, v in res.items(): print(k, '=>', v)
    print('errors:', errs[:5])
    for b in (bA, bB): await b.close()
    await pw.stop()
asyncio.run(main())
