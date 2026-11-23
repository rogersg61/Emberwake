import asyncio, os, subprocess, sys, time
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_DIR, HELPERS, CHROME

PORT = 18878
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']

async def main():
    server = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'], cwd=GAME_DIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(.5)
    pw = await async_playwright().start()
    browser = await pw.chromium.launch(headless=True, args=ARGS, **CHROME)
    context = await browser.new_context(viewport={'width': 960, 'height': 540})
    await context.add_init_script(path=os.path.join(HELPERS, 'mock_room.js'))
    errors = []

    async def page(name, mode='sword', spectate=False):
        p = await context.new_page()
        p.on('pageerror', lambda e: errors.append(name + ': ' + str(e)))
        await p.goto('http://127.0.0.1:%d/Emberwake.html' % PORT)
        await p.wait_for_timeout(500)
        await p.evaluate("enterDuelQueue(%r, %r, 0, %s)" % (mode, name, 'true' if spectate else 'false'))
        return p

    async def wait(p, expr, ms=10000):
        for _ in range(ms // 100):
            if await p.evaluate(expr):
                return True
            await p.wait_for_timeout(100)
        return False

    try:
        first = await page('ALPHA')
        assert await wait(first, "NET.status === 'online' && !!NET.me")
        await first.wait_for_timeout(500)
        assert await first.evaluate("G.state === 'duelQueue' && G.fighters.length === 0")

        second = await page('BRAVO')
        assert await wait(first, "G.state === 'play' && NET.duelQueueState === 'playing'")
        assert await wait(second, "G.state === 'play' && NET.duelQueueState === 'playing'")
        assert await first.evaluate("NET.peers.size === 1 && NET.duelMode === 'sword'")
        assert await second.evaluate("NET.peers.size === 1 && NET.duelMode === 'sword'")
        combat = await first.evaluate("""(() => {
          const p = G.p, e = [...NET.peers.values()][0], input = { wx: p.x + 30, wy: p.y + 7, md: 0 };
          p.inv = 0; p.iDodge = 0; p.duelCooldown = 0; p.duelRange = 0; p.state = 'normal'; p.atk = null;
          const startingRange = duelWeaponRange(p, IT.sword), clamped = duelAimPoint(p, IT.sword, p.x + 1000, p.y + 10);
          const aimRange = Math.hypot(clamped.x - (p.x + 3), clamped.y - (p.y + 10));
          startAttack(p, 'H', input);
          const simple = p.atk.id === 'duel_strike' && p.atk.m.kind === 'thrust', attackCooldown = p.duelCooldown;
          p.state = 'normal'; p.atk = null; p.duelCooldown = 15;
          tickFighter(p, { md: 0, jumpP: false, jumpH: false, down: false, l: true, r: false, lp: true, rp: false, dodgeP: false, wx: p.x + 30, wy: p.y + 7, armP: false });
          const cooldown = !p.atk;
          e.spawnT = 0; e.dead = false; p.duelRange = 0; strike(p, e, 2, 1, -1, {});
          const firstHitRange = p.duelRange;
          for (let i = 0; i < 5; i++) strike(p, e, 2, 1, -1, {});
          const maxRange = p.duelRange;
          p.inv = 20; const blocked = !hurtFighter(p, 1, e.x, { pvp: true, by: e, kx: 0, ky: 0 });
          const blockedRange = p.duelRange;
          p.inv = 0; hurtFighter(p, 1, e.x, { pvp: true, by: e, kx: 2.4, ky: -1.2, stagger: 1 });
          const reset = p.duelRange === 0, knockback = p.vx, hitstun = p.hurtT;
          const a = { f: p, id: 'duel_strike', m: { dmg: 1, kb: [.6, -.25], kind: 'thrust', btn: 'L' }, W: IT.sword, set: MOVESETS.sword, stale: 1, gm: 1, btn: 'L', hits: new Map(), fresh: true, hit: false, crit: true, setName: 'sword', pt: 1, aimA: 0, face: 1 };
          const random = Math.random; Math.random = () => .5;
          try {
            p.onGround = true; p.vx = 0; p.vy = 0; applyHit(a, e, e.x, e.y);
            const ground = NET.hits.at(-1)[2], groundKb = NET.hits.at(-1)[3];
            a.pt = 20; a.hits.clear(); p.onGround = false; p.vx = 2; p.vy = 3; applyHit(a, e, e.x, e.y);
            return { simple, attackCooldown, cooldown, firstHitRange, maxRange, blocked, blockedRange, reset, knockback, hitstun, startingRange, aimRange, groundKb, sprintKb: NET.hits.at(-1)[3], fallingRatio: NET.hits.at(-1)[2] / ground };
          } finally { Math.random = random; }
        })()""")
        assert combat['simple'] and combat['attackCooldown'] == 14 and combat['cooldown'], combat
        assert combat['firstHitRange'] == 5 and combat['maxRange'] == 18, combat
        assert combat['blocked'] and combat['blockedRange'] == 18 and combat['reset'], combat
        assert combat['knockback'] >= 2 and combat['hitstun'] == 24, combat
        assert combat['startingRange'] == 2 * 8 and abs(combat['aimRange'] - combat['startingRange']) < .01, combat
        assert combat['groundKb'] == 2.4 and combat['sprintKb'] == 5.2, combat
        assert 1.15 <= combat['fallingRatio'] <= 1.35, combat

        third = await page('CHARLIE')
        assert await wait(third, "NET.status === 'online' && NET.queuePeers.size >= 2")
        await third.wait_for_timeout(500)
        assert await third.evaluate("G.state === 'duelQueue' && G.fighters.length === 0")

        bow = await page('BOW', 'bow')
        assert await wait(bow, "NET.status === 'online' && !!NET.me")
        await bow.wait_for_timeout(500)
        assert await bow.evaluate("G.state === 'duelQueue' && NET.peers.size === 0")

        watcher = await context.new_page()
        watcher.on('pageerror', lambda e: errors.append('WATCHER: ' + str(e)))
        await watcher.goto('http://127.0.0.1:%d/Emberwake.html' % PORT)
        await watcher.wait_for_timeout(500)
        started = await watcher.evaluate("""(() => {
          G.state = 'ring'; FORM.nick = 'WATCHER'; FORM.duelMode = 1; render(1);
          const h = HITS.find(q => q.x === 85 && q.y === 216);
          if (!h) return false;
          mouse.ux = h.x + 12; mouse.uy = h.y + 8; uiMouseDown(2);
          return NET.spectateRequest;
        })()""")
        assert started
        assert await wait(watcher, "G.state === 'play' && NET.spectating && NET.peers.size === 2")
        assert await watcher.evaluate("!G.fighters.includes(G.p) && G.fighters.every(f => f.remote)")
        assert await first.evaluate("NET.peers.size === 1")
        print('one-on-one mode pairing, waiting without opponents, full-match exclusion, and non-joining spectating passed')
        assert not errors, errors
    finally:
        for p in context.pages:
            try:
                await p.evaluate("netLeave()")
            except Exception:
                pass
        await browser.close()
        await pw.stop()
        server.terminate()
        server.wait(timeout=3)

asyncio.run(main())
