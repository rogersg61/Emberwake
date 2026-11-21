# Going through the rifts into Cinderdeep, the Rootdark and the Glass Expanse.
import asyncio, sys
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet
async def main():
    h = await H().start(seed=4242)
    print('errs at load', h.errs[:5])
    ims, labels = [], []
    for d in [1, 2, 3, 0]:
        r = await h.ev("(()=>{ G.flags.dim1=G.flags.dim2=G.flags.dim3=true; G.flags.e3=true; const t0=performance.now(); enterDim(%d, true); return [DIM, round(performance.now()-t0), G.p.x/T|0, G.p.y/T|0, G.state, G.enemies.length]; })()" % d)
        print('enter', d, r)
        await h.step(60)
        ims.append(await h.pcrop(240, 140)); labels.append('dim %d arrive' % d)
        if d:
            # walk toward the arena side and look
            r = await h.ev("(()=>{ const x=DARENA_X; streamTo(x*T,true); const p=G.p; p.x=p.px=(x-20)*T; p.y=p.py=(DARENA_Y-4)*T; let n=0; while(boxHits(p.x,p.y,p.w,p.h)&&n++<80){p.y-=T;p.py=p.y;} snapCam(); return [x, DARENA_Y, heights[x], tileAt(x, DARENA_Y-1), tileAt(x,DARENA_Y)]; })()")
            print(' arena', r)
            await h.step(30)
            ims.append(await h.pcrop(240, 140)); labels.append('dim %d arena' % d)
            # far walk: check generation and errors over distance
            r = await h.ev("(()=>{ const t0=performance.now(); for (let k=1;k<=8;k++){ streamTo((SPAWN_X - k*400)*T, true); } return round(performance.now()-t0); })()")
            print(' far gen ms', r)
    print('errs', h.errs[:10])
    sheet(ims, 2, shot('t100_dims.png'), labels)
    await h.stop()
asyncio.run(main())
