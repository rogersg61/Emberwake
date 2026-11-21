# How fast each other world forms, and a map picture of each.
import asyncio, sys, base64, io
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H
from PIL import Image
async def run(h, d, span, out):
    await h.ev("(()=>{ G.flags.dim1=G.flags.dim2=G.flags.dim3=true; enterDim(%d, true); G.cine=null; })()" % d)
    t = await h.ev("(()=>{ const t0=performance.now(); const c0=floor(X0/CW)-%d, c1=floor(X0/CW)+%d; for (let k=c0;k<=c1;k++) readyChunk(k); return [performance.now()-t0, c0, c1]; })()" % (span, span))
    print('dim', d, 'gen ms', round(t[0]), 'per chunk', round(t[0]/(t[2]-t[1]+1),1))
    data = await h.ev("""(()=>{ const c0=%d*CW, c1=(%d+1)*CW, w=c1-c0, cv=document.createElement('canvas'); cv.width=w; cv.height=WH; const x=cv.getContext('2d'); const img=x.createImageData(w,WH);
      const hex=s=>{ s=String(s||'#000'); if(s[0]!=='#') return [0,0,0]; if(s.length===4) s='#'+s[1]+s[1]+s[2]+s[2]+s[3]+s[3]; return [parseInt(s.slice(1,3),16),parseInt(s.slice(3,5),16),parseInt(s.slice(5,7),16)]; };
      for (let yy=0; yy<WH; yy++) for (let xx=0; xx<w; xx++) { const X=c0+xx, i=yy*WW+X, t=tiles[i]; let c;
        if (t) { const p=TP[t]; c = p.liquid===1?[58,122,168]:p.liquid===2?[255,138,61]:t===CINDERITE?[255,200,120]:t===GLOOMORE?[140,255,220]:t===PRISMORE?[255,140,220]:t===RIFT||t===DALTAR||t===ECHOSTONE?[255,255,0]:(p.decor&&!p.solid)?[90,140,90]:hex(p.hi||p.dust||'#888'); }
        else c = walls[i]?[35,28,51]:(yy<SKYL[X]?[120,150,200]:[20,15,32]);
        const o=(yy*w+xx)*4; img.data[o]=c[0]; img.data[o+1]=c[1]; img.data[o+2]=c[2]; img.data[o+3]=255; }
      x.putImageData(img,0,0); return cv.toDataURL('image/png'); })()""" % (t[1], t[2]))
    im = Image.open(io.BytesIO(base64.b64decode(data.split(',')[1])))
    im.save(out)
    print(' biomes', await h.ev("(()=>{ const c0=%d*CW, c1=(%d+1)*CW; let last='', out=[]; for (let x=c0;x<c1;x+=8){ const b=biomeE(x); if(b!==last){ out.push((x-X0)+':'+b); last=b; } } return out.join(' '); })()" % (t[1], t[2])))
    print(' echoes', await h.ev("[...ECHOPOS.entries()].map(([i,id])=>[(i%WW)-X0, id])"), 'arena', await h.ev("DARENA_X-X0"))
async def main():
    seed = int(sys.argv[1]) if len(sys.argv) > 1 else 4242
    h = await H().start(seed=seed, size=1)
    for d in [1, 2, 3]: await run(h, d, 12, shot('dim%d_%d.png' % (d, seed)))
    print('errs', h.errs[:5])
    await h.stop()
asyncio.run(main())
