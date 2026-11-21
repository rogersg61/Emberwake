# Digging: each tool in each material, the craters it leaves and what it yields.
import asyncio, sys
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet

SETUP = r"""
window.ROOM = (mat, tool, wallW) => {
  const p = G.p, bx = SPAWN_X + 40, by = heights[SPAWN_X + 40] + 26;
  for (let y = by - 8; y <= by + 2; y++) for (let x = bx - 6; x <= bx + 14; x++) { const i = y * WW + x; tiles[i] = (y === by + 1 || y === by + 2 || x === bx - 6 || x === bx + 14 || y === by - 8) ? STONE : AIR; walls[i] = W_STONE || walls[i]; CHIP.delete(i); }
  for (let y = by - 6; y <= by; y++) for (let x = bx + 3; x < bx + 3 + (wallW || 5); x++) { tiles[y * WW + x] = mat; CHIP.delete(y * WW + x); }
  for (const [dx, dy] of [[-3, 0], [1, -5], [9, -7]]) dyn(bx + dx, by + dy, TORCH);
  for (const c of chunks.values()) c.dirty = true;
  inv.fill(null); if (tool) { inv[0] = { id: tool, n: 1 }; } G.sel = 0;
  p.x = p.px = (bx) * T + 1; p.y = p.py = (by - 2) * T - 4; p.vx = p.vy = 0; p.face = 1; p.hp = p.maxhp;
  G.drops && (G.drops.length = 0); G.parts.length = 0; G.rubble.length = 0; G.trails.length = 0; snapCam();
  window.BX = bx; window.BY = by; return [bx, by];
};
window.AIMAT = (wx, wy) => { mouse.wx = wx; mouse.wy = wy; mouse.x = (wx - G.rcx) * VS.s; mouse.y = (wy - G.rcy) * VS.s; };
"""
AIMJS = "G.shake=0; AIMAT(window.AX, window.AY);"

async def run():
    h = await H().start(seed=12345, size=1)
    await h.ev(SETUP)
    ims, labels = [], []
    async def scenario(mat, tool, swings, aimdx=0, aimdy=-12, label='', charge=0):
        bx, by = await h.ev("ROOM(%s, %s)" % (mat, ("'%s'" % tool) if tool else 'null'))
        await h.ev("window.AX = (BX + 3) * T + 2 + %d; window.AY = (BY) * T + %d;" % (aimdx, aimdy))
        await h.step(2, AIMJS)
        res = []
        for k in range(swings):
            if charge:
                await h.step(charge, AIMJS + "mouse.r=true;")
                await h.step(1, AIMJS + "mouse.r=false;")
                await h.step(30, AIMJS)
            else:
                cd = await h.ev("((heldItem()||HAND).cd)")
                await h.step(1, AIMJS + "mouse.l=true; mouse.lp=true;")
                await h.step(cd + 6, AIMJS + "mouse.l=false; mouse.lp=false;")
            st = await h.ev("(()=>{let n=0,a=0; for(let y=BY-6;y<=BY;y++) for(let x=BX+3;x<BX+8;x++){ const i=y*WW+x; if(tiles[i]) { n++; a+=aliveOf(i);} } return [n, a, G.drops?G.drops.length:0, G.rubble.length];})()")
            res.append(st)
        await h.step(1, AIMJS)
        im = await h.crop("(BX+3)*T", "(BY-2)*T", 96, 72)
        im = im.resize((im.width*2, im.height*2))
        ims.append(im); labels.append(label or '%s %s x%d' % (mat, tool, swings))
        print(label, res)
    await scenario('DIRT', None, 3, label='hands dirt x3')
    await scenario('DIRT', 'stone_shovel', 2, label='spade dirt x2')
    await scenario('STONE', 'flint_pick', 1, label='flint pick stone x1')
    await scenario('STONE', 'flint_pick', 4, label='flint pick stone x4')
    await scenario('STONE', 'copper_pick', 3, label='sunmetal pick stone x3')
    await scenario('STONE', 'pick2', 3, label='iron pick stone x3')
    await scenario('STONE', 'ember_pick', 1, label='ember pick stone x1')
    await scenario('STONE', 'ember_pick', 3, label='ember pick stone x3')
    await scenario('IRON', 'flint_pick', 3, label='flint on iron (too hard)')
    await scenario('COPPER', 'copper_pick', 4, label='copper ore x4')
    await scenario('SAND', 'stone_shovel', 2, aimdy=-30, label='sand slump x2')
    await scenario('GEODE', 'bronze_pick', 3, label='geode crystal x3')
    await scenario('PLANK', 'flint_axe', 3, label='planks axe x3')
    await scenario('STONE', 'stone_hammer', 3, label='hammer stone x3')
    await scenario('STONE', 'copper_pick', 1, label='charged sunmetal x1', charge=52)
    await scenario('EMBER', 'pick2', 2, label='ember seam iron pick x2')
    sheet(ims, 4, shot('t90.png'), labels)
    print('errs', [e for e in h.errs if 'agent' not in e][:5])
    await h.stop()
asyncio.run(run())
