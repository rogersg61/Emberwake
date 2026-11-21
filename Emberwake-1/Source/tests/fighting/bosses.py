# Each guardian: summoned, every attack, the second phase, and its reward.
import asyncio, sys
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet
async def main():
    h = await H().start(seed=4242)
    ims, labels = [], []
    for d in [1, 2, 3]:
        await h.ev("(()=>{ G.flags.dim1=G.flags.dim2=G.flags.dim3=true; G.flags.e3=true; enterDim(%d, true); G.cine=null; G.banner=null; })()" % d)
        r = await h.ev("""(()=>{ const x=DARENA_X; streamTo(x*T,true); const p=G.p; p.x=p.px=(x-3)*T+1; p.y=p.py=(DARENA_Y-4)*T; let n=0; while(boxHits(p.x,p.y,p.w,p.h)&&n++<80){p.y-=T;p.py=p.y;} snapCam(); G.cine=null;
            const L=interactables().filter(o=>o.act===altarAct); if(!L.length) return 'no altar interact'; L[0].act(); const none=!G.boss; addItem(DIM_OFFER[DIMP[DIM].boss], 1); L[0].act(); return ['without an offering: '+(none?'asleep':'awake'), G.boss&&G.boss.type, G.boss&&G.boss.hp, tileAt(x, DARENA_Y-1)===DALTAR]; })()""")
        print('dim', d, 'summon', r)
        seen = set(); phase2 = False; t = 0
        for k in range(200):
            await h.step(15, "G.p.inv=99999; G.p.hp=G.p.maxhp; G.cine=null;")
            st = await h.ev("G.boss?[G.boss.state, G.boss.hp|0, G.boss.phase, G.enemies.length, G.projs.length]:null")
            if not st: break
            seen.add(st[0]); phase2 = phase2 or st[2] == 2
            if k in (14, 40): ims.append((await h.shot()).resize((640, 360))); labels.append('dim %d %s' % (d, st))
            if k > 10 and st[0] not in ('intro', 'dying'):
                await h.ev("(()=>{ const b=G.boss; if(b && !b.invuln) damageEnemy(b, 90, 0, 0, {}); })()")
            t = k
        fl = await h.ev("[G.flags.tyrantDead, G.flags.rootmotherDead, G.flags.matriarchDead, G.drops.map(d=>d.id+':'+d.n).join(','), G.p.maxhp, G.banner&&G.banner.text]")
        print('  states', sorted(seen), 'phase2', phase2, 'steps', t, 'after', fl)
    # the shepherd under an ember moon
    await h.ev("(()=>{ enterDim(0, true); G.cine=null; { const x=SPAWN_X+140; streamTo(x*T,true); const p=G.p; p.x=p.px=x*T+1; p.y=p.py=(heights[x]-4)*T; snapCam(); } G.clock=.75; updateSun(); startEvent('emoon', true); G.ev.fade=1; G.ev.t=5000; })()")
    for k in range(40):
        await h.step(10, "G.p.inv=99999; G.p.hp=G.p.maxhp; G.cine=null;")
        if await h.ev("!!(G.boss && G.boss.type==='shepherd')"): break
    print('shepherd', await h.ev("G.boss?[G.boss.type, G.boss.state]:null"), 'ev', await h.ev("G.ev&&[G.ev.id,G.ev.fade]"))
    seen=set()
    for k in range(200):
        await h.step(15, "G.p.inv=99999; G.p.hp=G.p.maxhp; G.cine=null; G.clock=.8;")
        st = await h.ev("G.boss?[G.boss.state, G.boss.hp|0, G.boss.phase, G.enemies.length]:null")
        if not st: break
        seen.add(st[0])
        if k == 20: ims.append((await h.shot()).resize((640, 360))); labels.append('shepherd %s' % st)
        if k > 10 and st[0] not in ('intro', 'dying'): await h.ev("(()=>{ const b=G.boss; if(b && !b.invuln && !b.noHit) damageEnemy(b, 90, 0, 0, {}); })()")
    print('shepherd states', sorted(seen), await h.ev("[G.flags.shepherdDead, G.drops.map(d=>d.id+':'+d.n).join(',')]"))
    print('errs', h.errs[:8])
    sheet(ims, 2, shot('t105_bosses.png'), labels)
    await h.stop()
asyncio.run(main())
