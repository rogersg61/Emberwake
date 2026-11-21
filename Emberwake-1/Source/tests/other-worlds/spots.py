# Special spots: lava lakes, glowcap groves, bridges, the upper isles.
import asyncio, sys
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet
async def main():
    h = await H().start(seed=4242)
    ims, labels = [], []
    async def at(x_js, lab):
        r = await h.ev("(()=>{ const x=%s; streamTo(x*T,true); const p=G.p; const gy=DIM===3?glassTop(x):heights[x]; p.x=p.px=x*T+1; p.y=p.py=(gy-4)*T; p.vx=p.vy=0; let n=0; while(boxHits(p.x,p.y,p.w,p.h)&&n++<80){p.y-=T;p.py=p.y;} G.cine=null; G.banner=null; snapCam(); return [x-X0, gy]; })()" % x_js)
        await h.step(40, "G.cine=null")
        ims.append((await h.shot()).resize((640, 360))); labels.append(lab + ' ' + str(r))
    for d in [1, 2, 3]:
        await h.ev("(()=>{ G.flags.dim1=G.flags.dim2=G.flags.dim3=true; G.flags.e3=true; enterDim(%d, true); G.cine=null; })()" % d)
        if d == 1:
            await at("(()=>{ for (let k=floor(X0/200)-6;k<floor(X0/200)+6;k++){ const L=dimLakeOf(k); if(L&&L.liq===CINDER) return L.c; } return X0+100; })()", 'lava pool')
            await at("X0+180", 'basalt')
        elif d == 2:
            await at("(()=>{ for (let x=X0-760;x<X0+760;x+=4) if (dimBio(x)==='mycel') return x; return X0; })()", 'glowcaps')
            await at("(()=>{ for (let k=floor(X0/200)-6;k<floor(X0/200)+6;k++){ const L=dimLakeOf(k); if(L&&L.liq===WATER) return L.c; } return X0+100; })()", 'pool')
        else:
            await at("SPAWN_X+70", 'bridges')
            await at("(()=>{ for (let q=floor(X0/90)+1;q<floor(X0/90)+12;q++){ const U=gUpper(q); if(U) return U.cx; } return X0; })()", 'upper isle')
    print('errs', h.errs[:6])
    sheet(ims, 2, shot('t103_spots.png'), labels)
    await h.stop()
asyncio.run(main())
