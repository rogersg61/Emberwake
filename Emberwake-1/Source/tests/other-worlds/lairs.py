# Waking and clearing a lair in each other world.
import asyncio, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H
async def main():
    h = await H().start(seed=777)
    for d in (1, 2, 3):
        await h.ev("switchDim(%d); G.cine = null; G.enemies.length = 0;" % d)
        xs = await h.ev("(() => { const o = []; for (let k = floor((SPAWN_X - 6000) / DPW); k < floor((SPAWN_X + 6000) / DPW); k++) { const s = dplaceOf(k); if (s && s.kind !== 'dshrine') o.push(s.x); } return o; })()")
        got = None
        for x in xs[:8]:
            await h.ev("streamTo(%d * T, true)" % x)
            L = await h.ev("(() => { const L = [...LAIRS.values()].find(L => abs(L.x - %d) < 30); return L ? [L.id, L.x, L.y] : null; })()" % x)
            if L: got = L; break
        if not got: print('dim', d, 'no lair built'); continue
        lid, lx, ly = got
        await h.ev("(() => { const p = G.p; p.x = p.px = (%d - 20) * T; p.y = p.py = (%d - 3) * T; let n = 0; while (boxHits(p.x, p.y, p.w, p.h) && n++ < 80) p.y = p.py = p.y - T; p.vx = p.vy = 0; p.inv = 999999; G.cine = null; snapCam(); })()" % (lx, ly))
        await h.step(60, "G.cine = null; G.p.hp = G.p.maxhp;")
        woke = await h.ev("(() => { const L = LAIRS.get(%r); return L ? [L.act, L.list.map(e => (e.type || e.name) + ':' + round(e.x / T) + ',' + round(e.y / T)).join(' ')] : null; })()" % lid)
        print('dim', d, lid, 'woke =>', woke)
        await h.step(90, "G.cine = null; G.p.hp = G.p.maxhp;")
        alive = await h.ev("(() => { const L = LAIRS.get(%r); return L.list.filter(e => !e.dead).map(e => (e.type || e.name) + ' hp' + round(e.hp) + ' st:' + (e.state || '')).join(' | '); })()" % lid)
        print('   after 90 ticks:', alive)
        await h.ev("(() => { const L = LAIRS.get(%r); for (const e of L.list) if (!e.dead) { if (e.fighter) hurtFighter(e, 9999, G.p, 0); else damageEnemy(e, 9999, 0, G.p); } })()" % lid)
        await h.step(40, "G.cine = null;")
        print('   cleared =>', await h.ev("G.lairs.has(%r)" % lid), 'banner =>', await h.ev("G.banner && G.banner.text"), 'drops =>', await h.ev("G.drops.length"))
    print('errors:', [e for e in h.errs if 'agent-proxy' not in e][:6])
    await h.stop()
asyncio.run(main())
