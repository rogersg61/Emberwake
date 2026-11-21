# The Ashfall alone with the echoes: the barge, the leap, the storm, the fights.
import asyncio, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet
async def main():
    h = await H().start(mode='none')
    await h.ev("G.nick = 'TESTER'; G.skin = 0; SETTINGS.diff = 'normal'; brSolo(); G.manual = true;")
    info = await h.ev("[BR.chests.length, BR.pois.map(q => q.name + '@' + q.x).join(' '), BR.segs.join(','), G.fighters.length, BR.phase, G.p.onBarge, WW, WH]")
    print('island:', info)
    ims, labels = [], []
    await h.step(200, "")
    ims.append(await h.shot()); labels.append('on the barge')
    # leap over the first named place
    px = await h.ev("BR.pois[1].x * T")
    for i in range(80):
        bx = await h.ev("brBarge().x")
        if abs(bx - px) < 40: break
        await h.step(15, "")
    await h.step(1, "pressed.Space = true;")
    print('leapt at', await h.ev("[round(G.p.x / T), G.p.glide, G.p.onBarge, BR.t]"))
    await h.step(90, "keys.KeyD = false;")
    ims.append(await h.shot()); labels.append('gliding down')
    for i in range(60):
        if await h.ev("G.p.onGround || !G.p.glide"): break
        await h.step(20, "")
    print('landed', await h.ev("[round(G.p.x / T), round(G.p.y / T), G.p.glide, G.p.onGround, G.p.hp]"))
    # walk to the nearest chest and open it
    c = await h.ev("(() => { let b = null, bd = 1e9; for (const c of BR.chests) { if (c.open || c.cave) continue; const d = abs(c.x * T - G.p.x); if (d < bd) { bd = d; b = c; } } return b ? [b.i, b.x, b.y] : null; })()")
    await h.ev("(() => { const p = G.p; p.x = p.px = %d * T - 6; p.y = p.py = (%d + 1) * T - p.h; p.vx = p.vy = 0; })()" % (c[1], c[2]))
    await h.step(10, ""); await h.step(1, "pressed.KeyF = true;"); await h.step(70, "")
    ims.append(await h.shot()); labels.append('a chest opened')
    print('chest open', await h.ev("BR.chests[%d].open" % c[0]), 'drops', await h.ev("G.drops.map(d => d.id + 'x' + d.n).join(' ')"))
    await h.step(120, "")
    print('pack', await h.ev("inv.filter(Boolean).map(s => s.id + 'x' + s.n).join(' ')"))
    # use a ward or salve if we have one
    await h.ev("G.p.hp = 60;"); await h.step(1, "pressed.KeyH = true;"); await h.step(170, "")
    print('after H', await h.ev("[round(G.p.hp), round(G.p.ward || 0), !!G.p.brUse]"))
    # now watch the echoes play the match out (you cannot be hurt)
    await h.ev("G.p.inv = 1e9;")
    stats = []
    for k in range(40):
        await h.step(300, "G.p.inv = 1e9; const z = BR.storm; if (z && z.dps > 0) { const m = (z.L + z.R) / 2; if (G.p.x < z.L + 20 || G.p.x > z.R - 20) { G.p.x = G.p.px = m; let n = 0; while (boxHits(G.p.x, G.p.y, G.p.w, G.p.h) && n++ < 80) G.p.y = G.p.py = G.p.y - T; } }")
        st = await h.ev("[BR.t, BR.phase, BR.lastAlive, round(BR.storm.L / T), round(BR.storm.R / T), [...BR.bots.values()].map(f => (f.dead ? 'x' : '') + f.name.slice(0,3) + ':' + f.wid.split('_').pop() + ':' + round(f.hp) + '/' + round(f.ward||0) + '@' + round(f.x / T)).join(' '), BR.chests.filter(c => c.open).length]")
        stats.append(st)
        if k in (3, 12): ims.append(await h.shot()); labels.append('t=%d alive %d' % (st[0], st[2]))
        if st[1] == 'over' or st[2] <= 1: break
    for s in stats[::3]: print(s)
    print('last', stats[-1])
    print('feed', await h.ev("G.kfeed.map(k => (k.a||'') + '>' + k.b + (k.txt ? ' ' + k.txt : '')).join(' | ')"))
    await h.ev("BR.mapOpen = true;"); await h.step(2, ""); ims.append(await h.shot()); labels.append('map [M]'); await h.ev("BR.mapOpen = false;")
    sheet(ims, 2, shot('royale_solo.png'), labels, .5)
    print('errors:', [e for e in h.errs if 'agent-proxy' not in e][:8])
    await h.stop()
asyncio.run(main())
