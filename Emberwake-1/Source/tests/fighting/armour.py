# Armour: walking, jumping and damage taken with each set.
import asyncio, sys
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet
async def run():
    h = await H().start(seed=12345, size=1)
    await h.goto("SPOTS.camp.x-12", "VIL_Y-3"); await h.step(30)
    print('armor items', await h.ev("Object.values(IT).filter(i=>i.type==='armor').length"), await h.ev("RECIPES.filter(r=>IT[r.out]&&IT[r.out].type==='armor').length"))
    # walk / jump / hurt with each load
    res = {}
    for label, set_, weapon in [('none', None, None), ('hide', 'hide', 'flint_sword'), ('iron', 'iron', 'iron_greatsword'), ('iron+shell', 'iron', 'iron_greatsword')]:
        r = await h.ev("""(()=>{ inv.fill(null); G.gear={head:null,body:null,legs:null,feet:null}; GEAR_C=null; const set=%s, w=%s, shell=%s;
          if (w && IT[w]) { inv[0]={id:w,n:1}; } G.sel=0; if (set) for (const s of GEAR_SLOTS) { inv[5]={id:set+'_'+s,n:1}; wearAt(5); } if (shell) { inv[5]={id:'rust_shell',n:1}; wearAt(5); }
          const p=G.p, g=gearStats(); p.x=p.px=(SPOTS.camp.x-12)*T; p.y=p.py=(VIL_Y-3)*T; while(boxHits(p.x,p.y,p.w,p.h)){p.y-=T;p.py=p.y;} p.vx=p.vy=0;
          return [g.prot, g.load, g.cls.n, gearMul('walk'), gearMul('jump'), gearMul('mine'), gearMul('light'), gearMul('heavy')]; })()""" % (("'%s'"%set_) if set_ else 'null', ("'%s'"%weapon) if weapon else 'null', 'true' if 'shell' in label else 'false'))
        await h.step(25)
        await h.step(20, "keys.KeyD=true;"); vx = await h.ev("Math.abs(G.p.vx)"); x0=0; x1=vx*60; await h.step(20, "keys.KeyD=false;")
        await h.step(30)
        y0 = await h.ev("G.p.y"); miny = y0
        await h.step(1, "keys.Space=true;pressed.Space=true;")
        for k in range(40):
            await h.step(1, "keys.Space=true;"); miny = min(miny, await h.ev("G.p.y"))
        await h.step(40, "keys.Space=false;")
        hp = await h.ev("(()=>{ const p=G.p; p.hp=p.maxhp; p.inv=0; p.iDodge=0; const h0=p.hp; hurtFighter(p, 20, p.x+20, {}); return h0-p.hp; })()")
        await h.step(70)
        res[label] = (r, round(x1-x0,1), round(y0-miny,1), hp)
        print(label, r, 'walk60', round(x1-x0,1), 'jump', round(y0-miny,1), 'took', hp)
    # how each set looks
    ims, labels = [], []
    for m in ['hide','leather','padded','bone','chitin','scale','copper','bronze','iron','steel','glass','deep','ember']:
        await h.ev("(()=>{ G.gear={head:null,body:null,legs:null,feet:null}; GEAR_C=null; for (const s of GEAR_SLOTS) { inv[5]={id:'%s_'+s,n:1}; wearAt(5); } G.p.face=1; })()" % m)
        await h.step(8)
        im = await h.pcrop(26, 30); ims.append(im.resize((im.width*3, im.height*3))); labels.append(m)
    await h.ev("(()=>{ G.gear={head:null,body:null,legs:null,feet:null}; GEAR_C=null; inv[5]={id:'miners_helm',n:1}; wearAt(5); inv[5]={id:'rust_shell',n:1}; wearAt(5); })()"); await h.step(8)
    im = await h.pcrop(26, 30); ims.append(im.resize((im.width*3, im.height*3))); labels.append('miner helm + shell')
    sheet(ims, 7, shot('t94_sets.png'), labels)
    # the pack screen with the worn panel
    await h.ev("(()=>{ inv[6]={id:'bone_head',n:1}; inv[7]={id:'steel_body',n:1}; toggleUI('inv'); })()"); await h.step(2)
    await h.ev("(()=>{ const L=invLayout(); mouse.x=(L.gx+7*19+8)*VS.ui; mouse.y=(L.gy+8)*VS.ui; })()"); await h.step(2)
    (await h.shot()).save(shot('t94_inv.png'))
    print('errs', h.errs[:4])
    await h.stop()
asyncio.run(run())
