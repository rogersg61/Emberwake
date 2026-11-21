# A world keeps its game code between sessions, and a friend who loses the line gets back in by themselves.
import asyncio, sys, os, time
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from broker import Broker
URL = GAME_URL
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
PORT = 18896
async def main():
    Broker(PORT).start(); await asyncio.sleep(.3)
    pw = await async_playwright().start(); errs = []; res = {}
    async def page(name):
        b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME); ctx = await b.new_context(viewport={'width': 960, 'height': 540})
        await ctx.add_init_script("window.EW_BROKERS = ['ws://127.0.0.1:%d/mqtt'];" % PORT); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(name + ' PAGEERROR: ' + str(e)))
        pg.on('console', lambda m: errs.append(name + ' ' + m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
        await pg.goto(URL); await pg.wait_for_timeout(600); return b, pg
    async def wait(pg, js, ms=15000):
        for i in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False
    bA, A = await page('HOST'); bB, B = await page('BRAVO')
    await A.evaluate("Object.assign(WORLD,{id:'rj',name:'Rejoin World',seed:4242,size:1,shape:0,mode:0,arena:false}); FORM.nick='ALPHA'; startWorld(null);")
    await wait(A, "G.state==='intro'||G.state==='play'")
    await A.evaluate("if (G.state==='intro') beginPlay(true); G.says.length=0; G.sayCur=null; G.cine=null; G.p.inv=999999; UI.open='coop';")
    await wait(A, "!!COOP.gcode && sigReady()", 8000); code1 = await A.evaluate("COOP.gcode")
    # save, back to the title, and open the world again
    await A.evaluate("closeUI(); saveWorld(true); quitToTitle();"); await A.wait_for_timeout(800)
    await A.evaluate("openWorld(SAVE.list.find(m => m.id === 'rj')); 0"); await wait(A, "G.state==='intro'||G.state==='play'")
    await A.evaluate("if (G.state==='intro') beginPlay(true); G.says.length=0; G.sayCur=null; G.cine=null; G.p.inv=999999; UI.open='coop';")
    await wait(A, "!!COOP.gcode && sigReady()", 8000); code2 = await A.evaluate("COOP.gcode")
    res['same code after reopening the world'] = [code1, code2, code1 == code2]
    await A.evaluate("closeUI();")
    await B.evaluate("FORM.nick='BRAVO'; G.state='join';"); await B.evaluate("sigJoin(%r)" % code2)
    res['friend joined'] = await wait(B, "G.state==='play' && COOP.joined", 25000)
    # the line breaks for good on the friend's side
    await B.evaluate("coopLost(COOP.peers.get('h'))"); await B.wait_for_timeout(300)
    res['friend sees'] = await B.evaluate("[G.state, !!COOP.retry]")
    t = time.time(); back = await wait(B, "G.state==='play' && COOP.joined", 45000)
    res['back in by themselves (seconds)'] = [back, round(time.time() - t, 1), await B.evaluate("COOP.retry")]
    await A.wait_for_timeout(12000)
    res['host list after (old line cleared)'] = await A.evaluate("[...COOP.peers.values()].map(P => P.name + ':' + P.ok).join(',')")
    # the join screen remembers the code
    await B.evaluate("coopLeave(); G.state = 'join';"); await B.wait_for_timeout(400)
    res['code box filled in'] = await B.evaluate("(document.getElementById('ew-gcin') || {}).value || ''")
    for k, v in res.items(): print(k, '=>', v)
    print('errors:', [e for e in errs if 'agent-proxy' not in e][:8])
    for b in (bA, bB): await b.close()
    await pw.stop()
asyncio.run(main())
