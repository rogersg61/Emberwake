# Using places: blessing stones, guards that wake, places that stay cleared.
import asyncio, sys
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet
FIND = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'places.py')).read().split('FIND = r"""')[1].split('"""')[0]

async def main():
    h = await H().start(seed=777)
    found = await h.ev(FIND)
    res = {}
    ims, labels = [], []
    async def look(wx, wy, label, hw=300, hh_=170):
        await h.ev("render(1)"); ims.append(await h.crop(wx, wy, hw, hh_)); labels.append(label)
    # 1. a blessing stone: ask for a blessing, see it work, then it rests
    x, y = found['shrine'][1]
    await h.goto(x - 2); await h.step(20, "G.cine = null;")
    await look("%d * T" % x, "(heights[%d] - 2) * T" % x, 'shrine')
    L = await h.ev("(() => { const L = []; placeInteract(L); return L.map(l => l.label); })()")
    walk0 = await h.ev("gearMul('walk')")
    await h.ev("(() => { const L = []; placeInteract(L); L[0].act(); })()")
    res['bless'] = [L, await h.ev("G.bless && G.bless.k"), await h.ev("BLESS[G.bless.k].n"), walk0, await h.ev("gearMul('walk')"), await h.ev("G.p.dmgMul")]
    await h.step(2)
    await h.ev("G.bless.k = 'ward'"); await h.step(1)
    res['ward taken'] = await h.ev("(() => { const p = G.p; p.inv = 0; p.iDodge = 0; p.hp = p.maxhp = 100; hurtFighter(p, 20, p.x + 30, {}); const d = 100 - p.hp; p.inv = 99999; p.hp = 100; return d; })()")
    await h.ev("(() => { const L = []; placeInteract(L); L[0].act(); })()")
    res['resting'] = await h.ev("[G.says.slice(-1)[0] && G.says.slice(-1)[0].text, (() => { const L = []; placeInteract(L); return L[0].label; })()]")
    await h.ev("G.bless.k = 'swift'")
    ims.append(await h.pcrop(120, 90)); labels.append('blessed (HUD + glow)')
    await h.ev("G.says.length = 0; G.sayCur = null; G.bless = null")
    # 2. a fort: guards wake when you come near, and the place stays beaten
    x, y = found['fort'][0]
    await h.ev("streamTo(%d * T, true)" % x)
    lid = await h.ev("[...LAIRS.values()].filter(L => L.kind === 'fort' && abs(L.x - %d) < 2)[0].id" % x)
    await h.goto(x - 80); await h.step(30, "G.cine = null;")
    res['fort far'] = await h.ev("LAIRS.get('%s').act" % lid)
    await h.goto(x - 36); await h.step(30, "G.cine = null; G.p.inv = 99999;")
    res['fort near'] = await h.ev("(() => { const L = LAIRS.get('%s'); return [L.act, L.list.length, L.list.map(f => f.name).join(',')]; })()" % lid)
    await look("%d * T" % x, "(heights[%d] - 6) * T" % x, 'fort guards awake')
    await h.ev("(() => { const L = LAIRS.get('%s'); for (const f of L.list) killFighter(f, G.p); })()" % lid)
    await h.step(20, "G.cine = null;")
    res['fort cleared'] = [await h.ev("G.lairs.has('%s')" % lid), await h.ev("G.banner && G.banner.text"), await h.ev("G.drops.length")]
    snap = await h.ev("JSON.stringify(snapshotWorld()).length")
    res['save'] = [snap, await h.ev("snapshotWorld().lairs.length"), await h.ev("snapshotWorld().gen")]
    # 3. walk away and back: still cleared
    await h.goto(x - 200); await h.step(20); await h.goto(x - 30); await h.step(30, "G.cine = null;")
    res['fort stays beaten'] = await h.ev("LAIRS.get('%s').act" % lid)
    # 4. a den: guards that wander off fade and come back
    x, y = found['den'][0]
    await h.ev("streamTo(%d * T, true)" % x)
    lid = await h.ev("[...LAIRS.values()].filter(L => L.kind === 'den' && abs(L.x - %d) < 8)[0].id" % (x + 4))
    await h.goto(x - 30); await h.step(20, "G.cine = null; G.p.inv = 99999;")
    res['den awake'] = await h.ev("LAIRS.get('%s').list.map(e => e.type).join(',')" % lid)
    await look("%d * T" % (x + 2), "(heights[%d] + 4) * T" % x, 'den')
    await h.goto(x - 400); await h.step(40)
    res['den reset when far'] = await h.ev("[LAIRS.get('%s').act, G.lairs.has('%s'), G.enemies.length]" % (lid, lid))
    # 5. cobwebs slow you, spikes hurt
    x, y = found['pyramid'][0]
    await h.ev("streamTo(%d * T, true)" % x)
    gy = await h.ev("(() => { for (let yy = 40; yy < 200; yy++) if (tileAt(%d - 22, yy) === SANDSTONE && tileAt(%d - 23, yy) !== SANDSTONE) return yy; return -1; })()" % (x, x))
    sy = await h.ev("(() => { for (let yy = %d - 8; yy <= %d + 2; yy++) if (tileAt(%d - 14, yy) === SPIKES) return yy; return %d - 4; })()" % (gy, gy, x, gy))  # the spike row, wherever the hill put it
    res['pyramid spikes'] = await h.ev("[tileAt(%d - 14, %d) === SPIKES, tileAt(%d - 12, %d) === SPIKES]" % (x, sy, x, sy))
    await h.ev("G.p.inv = 0; G.p.iDodge = 0; G.p.hp = 100; G.p.hurtT = 0; G.p.x = G.p.px = (%d - 14) * T + 1; G.p.y = G.p.py = %d * T - 21; G.p.vx = 0; G.p.vy = 1;" % (x, sy))
    await h.step(6, "G.cine = null;")
    res['spike hurt'] = await h.ev("G.p.hp")
    await h.ev("G.p.inv = 99999; G.p.hp = 100")
    await look("%d * T" % x, "(%d - 4) * T" % gy, 'pyramid inside')
    # cobweb slow
    web = await h.ev("(() => { for (const [i, o] of tileObjs) {} for (let yy = %d; yy < %d + 10; yy++) for (let xx = %d - 10; xx < %d + 10; xx++) if (tileAt(xx, yy) === COBWEB) return [xx, yy]; return null; })()" % (gy, gy, x, x))
    if web:
        await h.ev("G.p.x = G.p.px = %d * T - 2; G.p.y = G.p.py = %d * T - 10; G.p.vx = 0; G.p.vy = 0;" % (web[0], web[1]))
        await h.step(1, "keys.KeyD = true;"); vx = []
        for i in range(6):
            await h.step(1, "keys.KeyD = true;"); vx.append(round(await h.ev("G.p.vx"), 2))
        await h.ev("keys.KeyD = false")
        res['web vx'] = vx
    # 6. old worlds keep the land they had seen
    leg = await h.ev("JSON.stringify(legacyOf({ dim: 0, mods: (WORLD.legacy = {}, '') + [encodeMods(), '', '', '', encodeSeen()].join('|') }))")
    res['legacy of this world'] = leg
    for k, v in res.items(): print(k, '=>', v)
    sheet(ims, 3, shot('places_play.png'), labels, .7)
    print('errors:', [e for e in h.errs if 'agent-proxy' not in e][:8])
    await h.stop()
asyncio.run(main())
