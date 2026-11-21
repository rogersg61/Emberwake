# Links: a thrown star pins a post to the wall, and every link on the practice post.
import asyncio, sys
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import *
SEL = {'sword':0,'spear':1,'fangs':2,'maul':3,'bow':4,'chuks':5}
async def main():
    h = await H().start(gmode=1, seed=4242)
    await h.goto("SPOTS.dummy.x+5", "VIL_Y-3")
    await h.step(5)
    ims=[]; labels=[]; res=[]
    async def mouse_at(js): await h.ev("(()=>{ render(1); const t=%s; mouse.x=(t[0]-G.rcx)*VS.s; mouse.y=(t[1]-G.rcy)*VS.s; render(1); })()"%js)
    D = "G.enemies.find(e=>e.type==='dummy')"
    # 1. throw a star at the post: it should carry into the wall and pin
    await h.ev("G.sel=5; G.p.arm='shuriken'")
    await mouse_at("[%s.x+4, %s.y+8]"%(D,D))
    await h.ev("pressed.KeyR=true"); await h.step(1)
    for i in range(30):
        await h.step(1)
        if await h.ev("(%s.st||{}).pin>0"%D): break
    pinned = await h.ev("({pin:(%s.st||{}).pin, side:(%s.st||{}).pinS, go: !!(%s.st||{}).pinGo})"%(D,D,D))
    await h.step(6); ims.append(await h.pcrop(110,70)); labels.append('star pins the post')
    print('pin:', pinned)
    # 2. every link, on the post
    links = await h.ev("LINK_ORDER.map(id=>[id, LINKS[id].sets[0], LINKS[id].st, LINKS[id].btn, !!LINKS[id].stay])")
    for (lid, setn, st, btn, stay) in links:
        await h.ev("""(()=>{ const d=%s, p=G.p; d.st=null; d.hp=d.maxhp; d.x=d.px=SPOTS.dummy.x*T+1; d.y=d.py=(VIL_Y)*T-d.h; d.vx=d.vy=0; d.onGround=true;
            p.state='normal'; p.atk=null; p.link=null; G.link=null; p.vx=p.vy=0; p.x=p.px=d.x+(%s?60:16); p.y=p.py=d.y+d.h-p.h; p.face=-1; p.st=null; p.inv=0; p.hurtT=0; G.sel=%d; G.slowT=0; G.zoom=1; })()"""%(D, 'true' if stay else 'false', SEL[setn]))
        await h.step(3)
        if st=='launched':
            await h.ev("(()=>{const d=%s; d.y-=26; d.py=d.y; d.onGround=false; applyStatus(d,'launched',G.p,{d:60}); const p=G.p; p.y=d.y+d.h-p.h; p.py=p.y; p.onGround=false;})()"%D)
        else:
            await h.ev("applyStatus(%s,'%s',G.p,{side:-1})"%(D,st))
            for i in range(10):
                await h.step(1)
                if await h.ev("!(%s.st&&%s.st.pinGo)"%(D,D)): break
        await mouse_at("[%s.x+4, %s.y+8]"%(D,D))
        hp0 = await h.ev("%s.hp"%D)
        await h.ev("mouse.%s=true; mouse.%sp=true"%(('l','l') if btn=='L' else ('r','r'))); await h.step(1); await h.ev("mouse.l=mouse.r=false")
        started = await h.ev("G.p.state==='link' ? G.p.link.id : (G.p.atk? 'form:'+G.p.atk.id : 'none')")
        dur = await h.ev("LINKS['%s'].steps.reduce((s,x)=>s+x.t,0)"%lid)
        snap_at = [int(dur*0.35), int(dur*0.8)]
        t=0
        for k in range(dur+20):
            await h.step(1); t+=1
            if t in snap_at: ims.append((await h.shot()).crop((240,120,1040,600))); labels.append(lid+' %d%%'%(100*t//dur))
            if await h.ev("G.p.state!=='link'"): break
        hp1 = await h.ev("%s.hp"%D)
        res.append((lid, started, hp0-hp1 if hp0>=hp1 else 'regen', await h.ev("G.linksKnown.has('%s')"%lid)))
    for r in res: print(r)
    sheet(ims[1:11],2,shot('links_a.png'),labels[1:11], .5); sheet(ims[11:21],2,shot('links_b.png'),labels[11:21], .5); sheet(ims[21:],2,shot('links_c.png'),labels[21:], .5)
    print('\n'.join(h.errs[:20]) or 'no errors')
    await h.stop()
asyncio.run(main())
