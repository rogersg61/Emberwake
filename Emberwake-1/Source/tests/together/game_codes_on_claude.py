# Game codes on claude.ai: the notes travel through the page's live room instead of the internet message boards.
# Game codes on claude.ai: the notes travel through the page's live room (stood in for by the mock room)
# instead of the internet brokers, which the page may not reach there.
import asyncio, subprocess, time, os, sys
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', '8768', '--bind', '127.0.0.1'], cwd=GAME_DIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    pw = await async_playwright().start(); b = await pw.chromium.launch(headless=True, args=['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'], **CHROME)
    ctx = await b.new_context(viewport={'width': 960, 'height': 540}); await ctx.add_init_script(path=os.path.join(HELPERS, 'mock_room.js'))
    errs = []; res = {}
    async def page(n):
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(n + ' PAGEERROR ' + str(e)))
        pg.on('console', lambda m: errs.append(n + ' ' + m.text) if m.type == 'error' and 'favicon' not in m.text and '404' not in m.text else None)
        await pg.goto('http://127.0.0.1:8768/Emberwake.html'); await pg.wait_for_timeout(1500); return pg
    async def wait(pg, js, ms=15000):
        for i in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False
    A = await page('HOST'); B = await page('GUEST')
    res['room available'] = [await A.evaluate("!!NET.room"), await B.evaluate("!!NET.room")]
    await A.evaluate("Object.assign(WORLD,{id:'rw',name:'Room World',seed:31,size:1,shape:0,mode:0,arena:false}); FORM.nick='ALPHA'; startWorld(null);")
    await wait(A, "G.state==='intro'||G.state==='play'"); await A.evaluate("if (G.state==='intro') beginPlay(true); G.cine=null; G.says.length=0; G.sayCur=null;")
    await A.wait_for_timeout(1500); await A.evaluate("G.cine = null; UI.open = 'coop';")
    ready = await wait(A, "!!COOP.gcode && sigReady()", 10000); code = await A.evaluate("COOP.gcode")
    res['host code via the room'] = [code, ready, await A.evaluate("!!SIG.room && SIG.conns.length === 0")]
    await B.evaluate("FORM.nick='BRAVO'; G.state='join';"); await B.evaluate("sigJoin(%r)" % code)
    ok = await wait(B, "G.state==='play' && WORLD.guest && COOP.joined", 25000)
    res['guest joined through the room'] = [ok, await B.evaluate("[COOP.hostName, WORLD.name]")]
    for k, v in res.items(): print(k, '=>', v)
    print('errors:', errs[:6])
    await b.close(); await pw.stop(); srv.terminate()
asyncio.run(main())
