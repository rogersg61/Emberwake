# Every kind of place (hamlets, forts, castles, pyramids, halls...) is built and looks right.
import asyncio, sys
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet

FIND = r"""
(() => {
  const out = {}, add = (kind, x, y) => { if (!out[kind]) out[kind] = []; if (out[kind].length < 3) out[kind].push([x, y]); };
  for (let k = floor((SPAWN_X - 9000) / 150); k < floor((SPAWN_X + 9000) / 150); k++) { const s = structOf(k); if (s && ['shrine', 'mill', 'wreck', 'den'].includes(s.kind)) add(s.kind, s.x, surf(s.x)); }
  for (let k = floor((SPAWN_X - 12000) / BIGW); k < floor((SPAWN_X + 12000) / BIGW); k++) { const s = bigOf(k); if (s) add(s.kind, s.x, surf(s.x)); }
  for (let k = floor((SPAWN_X - 9000) / DEEPW); k < floor((SPAWN_X + 9000) / DEEPW); k++) { const s = deepOf(k); if (s) add('dungeon', s.x, s.y); }
  for (let k = floor((SPAWN_X - 6000) / CAMPW); k < floor((SPAWN_X + 6000) / CAMPW); k++) { const s = campOf(k); if (s) add(s.kind, s.x, s.y); }
  return out;
})()
"""

async def main():
    seed = int(sys.argv[1]) if len(sys.argv) > 1 else 777
    h = await H().start(seed=seed)
    found = await h.ev(FIND)
    for k, v in sorted(found.items()): print(k, len(v), v[:3])
    ims, labels = [], []
    order = ['shrine', 'mill', 'wreck', 'den', 'hamlet', 'fort', 'castle', 'pyramid', 'temple', 'dungeon', 'mcamp', 'nest']
    for kind in order:
        if kind not in found: print('MISSING', kind); continue
        x, y = found[kind][0]
        await h.ev("streamTo(%d * T, true); G.enemies.length = 0; G.fighters = [G.p];" % x)
        # stand next to it, look at it
        if kind in ('dungeon',):
            await h.ev("G.p.x = G.p.px = %d * T; G.p.y = G.p.py = (%d + 8) * T; G.p.vx = G.p.vy = 0;" % (x, y))
        elif kind in ('mcamp', 'nest'):
            await h.ev("G.p.x = G.p.px = %d * T; G.p.y = G.p.py = (%d - 3) * T; G.p.vx = G.p.vy = 0;" % (x, y))
        else:
            await h.ev("(() => { const p = G.p, tx = %d + (%s); p.x = p.px = tx * T; let ty = heights[tx] - 4; p.y = p.py = ty * T; while (boxHits(p.x, p.y, p.w, p.h)) { p.y -= T; p.py = p.y; } p.vx = p.vy = 0; })()" % (x, {'hamlet': '-34', 'fort': '-30', 'castle': '-38', 'pyramid': '-28', 'temple': '-20'}.get(kind, '-12')))
        await h.ev("G.inv = 0; G.p.inv = 9999; G.cine = null; G.banner = null; G.zoomT = 1; G.zoom = 1; snapCam();")
        await h.step(40, "G.cine = null; G.spawnT = 1e9; G.p.vx = 0;")
        if kind in ('hamlet', 'fort', 'castle', 'pyramid', 'temple', 'dungeon'):
            await h.ev("G.cam.x = %d * T - VS.vw / 2; G.cam.y = (%d - (%s)) * T - VS.vh / 2; G.camLock = 1;" % (x, y, {'dungeon': '-7'}.get(kind, '10')))
            await h.ev("render(1)")
        im = await h.shot()
        ims.append(im); labels.append('%s @ %d' % (kind, x))
    sheet(ims, 3, shot('places_%d.png' % seed), labels, .5)
    print('lairs', await h.ev("[...LAIRS.keys()].length"), 'landmarks', await h.ev("LANDMARKS.length"))
    print('errors:', [e for e in h.errs if 'agent-proxy' not in e][:8])
    await h.stop()

asyncio.run(main())
