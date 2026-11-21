# Walking 1500 paces east and west on several seeds without getting stuck.
import asyncio, sys, json
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet
BOT = r"""
window.botStep = (key) => {
  const p = G.p; keys.KeyA = keys.KeyD = false; keys.KeyW = !p.onGround && p.vy < 0 && (p.bot && p.bot.jumping); keys[key] = true; if (p.onGround && p.bot) p.bot.jumping = false;
  if (!p.bot) p.bot = { lx: p.x, still: 0 };
  const moved = Math.abs(p.x - p.bot.lx); p.bot.lx = p.x;
  if (moved < .2) p.bot.still++; else p.bot.still = 0;
  const onC = climbAt(p), wet = liqAt(p.x + 3, p.y + 10);
  if (wet) keys.KeyW = true;
  const cx = Math.floor((p.x + 3) / T), dir = key === 'KeyD' ? 1 : -1, hh0 = heights[cx];
  if (p.onGround && heights[cx + dir] > hh0 + 5 && [2, 3, 4].some(k => heights[cx + dir * k] <= hh0 + 3)) { pressed.KeyW = true; keys.KeyW = true; p.bot.jumping = true; }
  if (p.bot.still > 4) { if (onC) { keys.KeyW = true; keys[key] = p.bot.still % 40 > 30; } else if (p.onGround) { pressed.KeyW = true; keys.KeyW = true; p.bot.jumping = true; } }
  if (p.bot.still > 600) { p.bot.stuck = true; }
};
"""
async def main():
    seeds = [int(a) for a in sys.argv[1:]] or [4242, 31337, 777, 12345, 2024]
    ims=[]; labels=[]; ok=0; tot=0
    for seed in seeds:
        h = await H().start(seed=seed, size=1)
        await h.ev(BOT); await h.ev("G.p.maxhp = 99999; G.p.hp = 99999; G.enemies.length = 0; spawnTick = () => {};")
        for key, d in [('KeyD', 1), ('KeyA', -1)]:
            await h.ev("{ const p = G.p; p.x = p.px = SPAWN_X * T; p.y = p.py = (VIL_Y - 3) * T; p.vx = p.vy = 0; p.bot = null; snapCam(); }")
            best = 0
            for k in range(62):  # the Waker walks a steadier pace now: give it the time
                await h.step(200, js=f"botStep('{key}'); G.p.hp = G.p.maxhp;")
                r = json.loads(await h.ev("JSON.stringify({x: G.p.x / T, y: G.p.y / T, still: G.p.bot.still})"))
                dist = (r['x'] - await h.ev("SPAWN_X")) * d; best = max(best, dist)
                edge = dist > 1500
                if edge or r['still'] > 600: break
            tot += 1; room = 1500
            reached = best > room - 20; ok += reached
            print(seed, 'east' if d > 0 else 'west', 'got', round(best), 'of', room, 'OK' if reached else '%s at x=%d (%s) still=%d' % ('STUCK' if r['still'] > 600 else 'OUT OF TIME', r['x'], await h.ev(f"biomeAt({int(r['x'])})"), r['still']))
            if not reached: ims.append(await h.pcrop(200, 110)); labels.append(f"{seed} {'east' if d > 0 else 'west'} x={int(r['x'])}")
        await h.stop()
    print('walked 1500 paces', ok, 'of', tot)
    if ims: sheet(ims, 3, shot('t82.png'), labels, .75)
asyncio.run(main())
