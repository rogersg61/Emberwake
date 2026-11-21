# Pictures of each other world and its places.
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
        await h.step(20)
        ims.append(await h.shot()); labels.append('dim %d rift' % d)
        for (dx, nm) in [(-20, 'arena'), (-300, 'far'), (900, 'far east')]:
            r = await h.ev("(()=>{ const x=%s; streamTo(x*T,true); const p=G.p; const gy=DIM===3?glassTop(x):heights[x]; p.x=p.px=x*T+1; p.y=p.py=(gy-4)*T; p.vx=p.vy=0; let n=0; while(boxHits(p.x,p.y,p.w,p.h)&&n++<80){p.y-=T;p.py=p.y;} snapCam(); return [x, gy, G.p.dead, G.state]; })()" % ('DARENA_X+DSIDE*(-20)' if nm=='arena' else 'SPAWN_X+(%d)' % dx))
            await h.step(30)
            info = await h.ev("[G.rcx|0, G.rcy|0, G.p.x|0, G.p.y|0, G.cam.x|0, G.cam.y|0, VS.s]")
            print(d, nm, r, info)
            ims.append(await h.shot()); labels.append('dim %d %s' % (d, nm))
    print('errs', h.errs[:10])
    sheet(ims, 2, shot('t101_look.png'), labels, scale=.5)
    await h.stop()
asyncio.run(main())
