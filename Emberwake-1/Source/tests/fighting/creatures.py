# Every creature of every world moves, fights, dies and drops things.
import asyncio, sys
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet
MOBS = {1: ['slagling', 'cinderimp', 'basaltbrute', 'ashwraith', 'cindereel'], 2: ['sporeling', 'rootlasher', 'gloamhound', 'lanternmoth', 'mirestalker'], 3: ['shardling', 'mirrorwisp', 'voidray', 'glasssentinel'], 0: ['moonwretch', 'starling', 'umbralknight', 'fogwalker']}
async def main():
    h = await H().start(seed=4242)
    ims, labels = [], []
    for d in [1, 2, 3, 0]:
        await h.ev("(()=>{ G.flags.dim1=G.flags.dim2=G.flags.dim3=true; G.flags.e3=true; if (DIM!==%d) enterDim(%d, true); G.cine=null; G.banner=null; })()" % (d, d))
        for m in MOBS[d]:
            r = await h.ev("""(()=>{ G.enemies.length=0; G.projs.length=0; const p=G.p; const x=SPAWN_X+(DIM===3?2:DIM?60:-70); streamTo(x*T,true); const gy=DIM===3?glassTop(x):heights[x]; p.x=p.px=x*T+1; p.y=p.py=(gy-3)*T; let n=0; while(boxHits(p.x,p.y,p.w,p.h)&&n++<80){p.y-=T;p.py=p.y;} snapCam();
              let e; if ('%s'==='cindereel') { for (let y=gy-2;y<gy+2;y++) for (let k=-3;k<12;k++) { const tx=x+12+k; if (tileAt(tx,y)===AIR || TP[tileAt(tx,y)].solid) tiles[y*WW+tx]=CINDER; } for (let k=-3;k<12;k++) tiles[(gy+2)*WW+x+12+k]=BASALT; e=mkEnemy('cindereel',(x+14)*T,(gy)*T); G.enemies.push(e); dirtyAt(x+14,gy); }
              else { e=mkEnemy('%s',(x+(DIM===3?10:14))*T,(gy-4)*T); G.enemies.push(e); }
              e.px=e.x; e.py=e.y; G.p.inv=99999; return [e.type, e.hp, e.w, e.h]; })()""" % (m, m))
            hp0 = r[1]
            await h.step(240, "G.p.inv=99999; G.p.hp=G.p.maxhp;")
            st = await h.ev("(()=>{ const e=G.enemies.find(q=>q.type==='%s'); return e?[e.state, round(e.x/T-G.p.x/T), round(e.y/T-G.p.y/T), e.dead?1:0, round(e.hp)]:'gone'; })()" % m)
            ims.append(await h.pcrop(150, 90)); labels.append('%s %s' % (m, st))
            # make sure it can die and drop things
            k = await h.ev("(()=>{ const e=G.enemies.find(q=>q.type==='%s'&&!q.dead); if(!e) return 'none'; e.hp=1; damageEnemy(e, 50, 1, -1, {}); return [e.dead, G.drops.length]; })()" % m)
            print(d, m, 'hp', hp0, 'after 240', st, 'kill', k)
    print('errs', h.errs[:8])
    sheet(ims, 4, shot('t104_mobs.png'), labels)
    await h.stop()
asyncio.run(main())
