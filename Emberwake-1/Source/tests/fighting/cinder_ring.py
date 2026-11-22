import asyncio, os, sys
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, CHROME
from broker import Broker

PORTS = (18876, 18877)
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']

async def main():
    brokers = [Broker(port).start() for port in PORTS]
    await asyncio.sleep(.3)
    pw = await async_playwright().start()
    errors = []
    browsers = []

    async def page(name):
        browser = await pw.chromium.launch(headless=True, args=ARGS, **CHROME)
        browsers.append(browser)
        context = await browser.new_context(viewport={'width': 960, 'height': 540})
        urls = ', '.join(repr('ws://127.0.0.1:%d/mqtt' % port) for port in PORTS)
        await context.add_init_script("window.EW_BROKERS = [%s];" % urls)
        p = await context.new_page()
        p.on('pageerror', lambda e: errors.append(name + ': ' + str(e)))
        await p.goto(GAME_URL)
        await p.wait_for_timeout(700)
        await p.evaluate("enterArena(%r, 0, 'sharedring')" % name)
        return p

    async def wait(page, js, ms=12000):
        for _ in range(ms // 100):
            if await page.evaluate(js):
                return True
            await page.wait_for_timeout(100)
        return False

    a = await page('ALPHA')
    b = await page('BRAVO')
    try:
        assert await wait(a, "NET.status === 'online' && NET.peers.size === 1")
        assert await wait(b, "NET.status === 'online' && NET.peers.size === 1")

        await a.wait_for_timeout(500)
        before = [b.published for b in brokers]
        await a.wait_for_timeout(1500)
        traffic = [b.published - n for b, n in zip(brokers, before)]
        assert traffic[0] > 10 and traffic[0] > traffic[1] * 3, traffic
        await a.evaluate("const q = NET.signalPeers.values().next().value; q.at = performance.now() - 5000; netSignalRefresh(performance.now())")
        assert await a.evaluate("NET.peers.size === 1")

        old_x = await b.evaluate("NET.peers.values().next().value.x")
        await a.evaluate("G.p.x += 120; G.p.px = G.p.x; G.p.vx = 0; netSend()")
        assert await wait(b, "Math.abs(NET.peers.values().next().value.snaps.slice(-1)[0].x - %s) < 2" % (old_x + 120))

        await a.evaluate("netShot({ type: 'arrow', x: G.p.x, y: G.p.y, vx: 2, vy: -2, g: .1, boom: 0, owner: G.p }); netSend()")
        assert await wait(b, "G.projs.some(q => q.ghost)")

        await b.evaluate("G.p.inv = 0; G.p.hp = 100")
        await a.evaluate("netHit(NET.peers.values().next().value, 25, 1, -1, false, 0, G.p); netSend()")
        assert await wait(b, "G.p.hp < 100")
        print('same-code matchmaking, reduced broker traffic, reconnect tolerance, movement, projectile, and PvP damage passed')
        print('relay messages:', [b.published for b in brokers])

        await a.evaluate("netLeave()")
        assert await wait(b, "NET.peers.size === 0")
        assert not errors, errors
    finally:
        for browser in browsers:
            await browser.close()
        await pw.stop()

asyncio.run(main())
