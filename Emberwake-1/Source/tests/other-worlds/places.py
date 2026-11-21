# The places of the other worlds: slag bastions, glowcap hollows, prism spires.
import asyncio, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet
async def main():
    h = await H().start(seed=777)
    ims, labels, res = [], [], {}
    for d in (1, 2, 3):
        await h.ev("switchDim(%d); G.cine = null; G.enemies.length = 0;" % d)
        found = await h.ev("(() => { const o = {}; for (let k = floor((SPAWN_X - 6000) / DPW); k < floor((SPAWN_X + 6000) / DPW); k++) { const s = dplaceOf(k); if (s) (o[s.kind] = o[s.kind] || []).push(s.x); } return o; })()")
        res['dim %d' % d] = {k: len(v) for k, v in found.items()}
        for kind, xs in found.items():
            done = False
            for x in xs[:6]:
                await h.ev("streamTo(%d * T, true)" % x)
                mk = await h.ev("(() => { const L = LANDMARKS.find(l => abs(l.x / T - %d) < 40 && /BASTION|HOLLOW|SPIRE|BLESSING/.test(l.name)); return L ? [L.name, round(L.x / T), round(L.y / T)] : null; })()" % x)
                if not mk: continue
                await h.ev("(() => { const p = G.p; p.x = p.px = (%d - 16) * T; p.y = p.py = (%d - 2) * T; let n = 0; while (boxHits(p.x, p.y, p.w, p.h) && n++ < 80) p.y = p.py = p.y - T; p.vx = p.vy = 0; p.inv = 99999; G.cine = null; snapCam(); })()" % (mk[1], mk[2]))
                await h.step(30, "G.cine = null; G.banner = null;")
                await h.ev("G.cam.x = %d * T - VS.vw / 2; G.cam.y = %d * T - VS.vh / 2; render(1);" % (mk[1], mk[2]))
                ims.append(await h.shot()); labels.append('%s (world %d)' % (mk[0], d)); done = True
                res['%s lair' % mk[0]] = await h.ev("[...LAIRS.values()].filter(L => abs(L.x - %d) < 30).map(L => L.kind + ':' + L.list.map(e => e.type || e.name).join('/')).join(' ')" % mk[1])
                break
            if not done: res['%s %d' % (kind, d)] = 'not built (terrain)'
    sheet(ims, 3, shot('dim_places.png'), labels, .45)
    for k, v in res.items(): print(k, '=>', v)
    print('errors:', [e for e in h.errs if 'agent-proxy' not in e][:6])
    await h.stop()
asyncio.run(main())
