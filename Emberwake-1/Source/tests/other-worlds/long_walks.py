# Walking far in each other world without getting stuck or falling into nothing.
import asyncio, sys, json
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet
sys.argv = sys.argv[:1]
exec(open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'world', 'long_walks.py')).read().split('async def main')[0])
async def main():
    seeds = [4242, 777]
    ims=[]; labels=[]; ok=0; tot=0
    for seed in seeds:
        h = await H().start(seed=seed, size=1)
        await h.ev(BOT); await h.ev("G.p.maxhp = 99999; G.p.hp = 99999; G.enemies.length = 0; spawnTick = () => {}; G.flags.dim1=G.flags.dim2=G.flags.dim3=true; G.flags.e3=true;")
        for d0 in [1, 2, 3]:
            await h.ev("enterDim(%d, true); G.cine=null; G.banner=null; G.enemies.length=0;" % d0)
            for key, d in [('KeyD', 1), ('KeyA', -1)]:
                await h.ev("{ const p = G.p; p.x = p.px = (SPAWN_X+2) * T; p.y = p.py = (VIL_Y - 3) * T; p.vx = p.vy = 0; p.bot = null; G.lastSafe=null; G.voids=0; snapCam(); }")
                best = 0; room = 1200
                for k in range(45):
                    await h.step(200, js=f"botStep('{key}'); G.p.hp = G.p.maxhp; G.cine=null; if (G.p.y > (WH-34)*T) G.voids=(G.voids||0)+1;")
                    r = json.loads(await h.ev("JSON.stringify({x: G.p.x / T, y: G.p.y / T, still: G.p.bot.still, voids: G.voids||0})"))
                    dist = (r['x'] - await h.ev("SPAWN_X")) * d; best = max(best, dist)
                    if dist > room or r['still'] > 600: break
                tot += 1; reached = best > room - 20; ok += reached
                print(seed, 'dim', d0, 'east' if d > 0 else 'west', 'got', round(best), 'voids', r['voids'], 'OK' if reached else 'STUCK at x=%d still=%d' % (r['x'] - 32768, r['still']))
                if not reached: ims.append(await h.pcrop(200, 110)); labels.append(f"{seed} d{d0} {'east' if d > 0 else 'west'} x={int(r['x'])-32768}")
        print('errs', h.errs[:4])
        await h.stop()
    print('walked', ok, 'of', tot)
    if ims: sheet(ims, 3, shot('t108.png'), labels, .75)
asyncio.run(main())
