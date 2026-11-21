# The Ashfall with friends by game code: the host opens a lobby, a friend joins, and the match starts for both.
# The Ashfall with friends from the plain HTML file: the host opens a lobby, a friend joins with the game code,
# and the match starts for both. A local stand-in broker plays the public ones.
import asyncio, sys, io, os, time
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from broker import Broker
URL = GAME_URL
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
PORT = 18832
async def main():
    Broker(PORT).start(); await asyncio.sleep(.3)
    pw = await async_playwright().start(); errs = []; res = {}
    async def page(name):
        b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME); ctx = await b.new_context(viewport={'width': 960, 'height': 540})
        await ctx.add_init_script("window.EW_BROKERS = ['ws://127.0.0.1:%d/mqtt'];" % PORT); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(name + ' PAGEERROR: ' + str(e)))
        pg.on('console', lambda m: errs.append(name + ' ' + m.type + ': ' + m.text) if m.type == 'error' else None)
        await pg.goto(URL); await pg.wait_for_timeout(700); return b, pg
    async def wait(pg, js, ms=15000):
        for i in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False
    bA, A = await page('HOST'); bB, B = await page('FRIEND')
    await A.evaluate("G.nick = 'ALPHA'; FORM.nick = 'ALPHA'; COOP.br = true; brLobbyEnter('rtc', 'friends');")
    await wait(A, "!!COOP.gcode && sigReady()", 8000); code = await A.evaluate("COOP.gcode")
    res['host lobby code'] = code
    await B.evaluate("FORM.nick = 'BRAVO'; G.state = 'join';"); await B.evaluate("sigJoin(%r)" % code)
    ok = await wait(B, "BR.on && G.state === 'brlobby' && BR.via === 'rtc'", 25000)
    res['friend in the host lobby'] = [ok, await B.evaluate("[NET.me, BR.leaderId]")]
    await A.wait_for_timeout(1200)
    res['host lobby sees'] = await A.evaluate("[...BR.people.values()].map(q => q.n + ':' + q.ph).join(',')")
    await A.evaluate("BR.startNow = true")
    okA = await wait(A, "G.state === 'play' && BR.phase === 'drop'"); okB = await wait(B, "G.state === 'play' && BR.phase === 'drop'")
    res['both in the match, same seed'] = [okA, okB, (await A.evaluate("BR.seed")) == (await B.evaluate("BR.seed"))]
    await B.wait_for_timeout(1500)
    res['friend sees host and echoes'] = await B.evaluate("[[...NET.peers.values()].map(f => f.name).join(','), [...BR.bots.values()].filter(f => f.remote).length]")
    await B.evaluate("pressed.Space = true"); await wait(B, "!G.p.onBarge && G.p.onGround", 20000); await B.wait_for_timeout(600)
    bx = await B.evaluate("G.p.x"); hx = await A.evaluate("(() => { const f = [...NET.peers.values()][0]; return f ? f.x : -1; })()")
    res['host sees the friend where they landed (px apart)'] = round(abs(bx - hx), 1)
    for k, v in res.items(): print(k, '=>', v)
    print('errors:', errs[:6])
    await bA.close(); await bB.close(); await pw.stop()
asyncio.run(main())
