# The Ashfall online while the leader's game sleeps: the other player takes over, and the leader steps aside on return.
# The Ashfall online: the leader's tab goes to sleep (their game stops), the other player takes over the clock and
# the echoes; when the leader comes back they step aside instead of fighting over the match.
import asyncio, subprocess, time, os, sys
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', '8769', '--bind', '127.0.0.1'], cwd=GAME_DIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL); time.sleep(1)
    pw = await async_playwright().start()
    async def browser():
        b = await pw.chromium.launch(headless=True, args=['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'], **CHROME)
        return b
    b = await browser(); ctx = await b.new_context(viewport={'width': 800, 'height': 500}); await ctx.add_init_script(path=os.path.join(HELPERS, 'mock_room.js'))
    errs = []; res = {}
    async def page(n):
        pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(n + ' PAGEERROR ' + str(e)))
        await pg.goto('http://127.0.0.1:8769/Emberwake.html'); await pg.wait_for_timeout(1500); await pg.evaluate("G.nick=%r; brLobbyEnter('room','sleep');" % n); return pg
    async def wait(pg, js, ms=15000):
        for i in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False
    A = await page('ALPHA'); B = await page('BRAVO'); await A.wait_for_timeout(2500)
    L, F = (A, B) if await A.evaluate("BR.lead") else (B, A)
    await L.evaluate("BR.startNow = true"); await wait(F, "G.state === 'play' && BR.phase === 'drop'"); await F.wait_for_timeout(2500)
    res['before: leader / follower lead'] = [await L.evaluate("BR.lead"), await F.evaluate("BR.lead")]
    # the leader's tab sleeps
    await L.evaluate("G.manual = true; 0"); t0 = await F.evaluate("BR.t")

    ok = await wait(F, "BR.lead && [...BR.bots.values()].every(f => !f.remote)", 12000)
    await F.wait_for_timeout(2000)
    res['follower took over while the leader slept'] = [ok, await F.evaluate("[...BR.bots.values()].filter(f => !f.dead).length")]
    # the leader wakes up
    await L.evaluate("G.manual = false; 0")
    await L.wait_for_timeout(6000)
    st = [await L.evaluate("[BR.lead, [...BR.bots.values()].every(f => f.remote), [...BR.bots.values()].every(f => !f.remote)]"), await F.evaluate("[BR.lead, [...BR.bots.values()].every(f => f.remote), [...BR.bots.values()].every(f => !f.remote)]")]
    one = (st[0][0] and st[0][2] and not st[1][0] and st[1][1]) or (st[1][0] and st[1][2] and not st[0][0] and st[0][1])
    res['after the leader came back: exactly one runs the echoes'] = [one, st]
    for k, v in res.items(): print(k, '=>', v)
    print('errors:', errs[:5])
    await b.close(); await pw.stop(); srv.terminate()
asyncio.run(main())
