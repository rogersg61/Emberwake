# World events (fog, ash, the ember moon...) and saving during them.
import asyncio, sys, json
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet
async def main():
    h = await H().start(seed=777)
    ims, labels = [], []
    # ---- events ----
    await h.ev("(()=>{ const x=SPAWN_X+160; streamTo(x*T,true); const p=G.p; p.x=p.px=x*T+1; p.y=p.py=(heights[x]-4)*T; snapCam(); Object.assign(G.flags,{seen1:true,seen2:true,rootmotherDead:true,dbl:true}); })()")
    for ev, clock in [('emoon', .78), ('starfall', .8), ('eclipse', .3), ('ashfall', .3), ('fog', .1)]:
        await h.ev("(()=>{ G.enemies.length=0; G.dhaz.length=0; G.drops.length=0; G.ev=null; G.clock=%s; G.evClock=%s; startEvent('%s'); G.ev.fade=1; })()" % (clock, clock, ev))
        await h.step(900, "G.p.inv=99999; G.p.hp=G.p.maxhp; G.clock=%s; G.spawnT=min(G.spawnT,30); G.cine=null;" % clock)
        r = await h.ev("(()=>{ const c={}; for (const e of G.enemies) if(!e.dead) c[e.type]=(c[e.type]||0)+1; return [G.ev&&G.ev.id, JSON.stringify(c), G.dhaz.length, G.drops.filter(d=>d.id==='starshard').length, G.sun.map(v=>v.toFixed(2)).join('/'), G.boss&&G.boss.type]; })()")
        print(ev, r)
        ims.append((await h.shot()).resize((640, 360))); labels.append(ev + ' ' + r[1][:60])
        await h.ev("(()=>{ if (G.boss) bossGone(G.boss); G.ev=null; })()")
    # natural rolls at dusk and dawn
    r = await h.ev("""(()=>{ const n={}; for (let i=0;i<400;i++){ G.ev=null; G.evClock=.57; G.clock=.585; tickEvents(); if(G.ev) n[G.ev.id]=(n[G.ev.id]||0)+1; G.ev=null; G.evClock=.03; G.clock=.04; tickEvents(); if(G.ev) n[G.ev.id]=(n[G.ev.id]||0)+1; } G.ev=null; return JSON.stringify(n); })()""")
    print('natural (400 days)', r)
    # summon items
    r = await h.ev("(()=>{ G.ev=null; G.clock=.8; updateSun(); addItem('moon_lantern',1); useSummon(IT.moon_lantern); const a=G.ev&&G.ev.id; G.ev=null; G.clock=.3; updateSun(); addItem('umbral_disc',1); useSummon(IT.umbral_disc); const b=G.ev&&G.ev.id; G.ev=null; return [a,b,countItem('moon_lantern'),countItem('umbral_disc')]; })()")
    print('summons', r)
    # ---- saves across worlds ----
    r = await h.ev("""(()=>{ G.ev=null; G.flags.dim1=G.flags.dim2=true; const ox=SPAWN_X+40; streamTo(ox*T,true); setTile(ox, heights[ox]-6, BRICK); G.saveMark0=[ox, heights[ox]-6];
       enterDim(1, true); const x1=SPAWN_X+30; setTile(x1, heights[x1]-5, CINDERBRICK); G.saveMark1=[x1, heights[x1]-5]; G.echoes.add(101); G.beasts.slagling=3;
       enterDim(2, true); const x2=SPAWN_X+30; setTile(x2, heights[x2]-5, ROOTWOOD); const m2=[x2, heights[x2]-5];
       const snap=JSON.parse(JSON.stringify(snapshotWorld())); return [snap.dim, Object.keys(snap.dims), snap.echoes, JSON.stringify(snap.beasts), m2, G.saveMark0, G.saveMark1, JSON.stringify(snap).length]; })()""")
    print('snapshot', r)
    m2, m0, m1 = r[4], r[5], r[6]
    await h.ev("window.__snap = JSON.parse(JSON.stringify(snapshotWorld())); startWorld(window.__snap);")
    for i in range(60):
        if await h.ev("G.state==='play'"): break
        await h.pg.wait_for_timeout(100)
    await h.ev("G.manual=true; G.cine=null;")
    r = await h.ev("(()=>{ const a=[DIM, tileAt(%d,%d)===ROOTWOOD, G.echoes.has(101), G.beasts.slagling]; enterDim(1, true); a.push(DIM, tileAt(%d,%d)===CINDERBRICK); enterDim(0, true); streamTo(%d*T,true); a.push(DIM, tileAt(%d,%d)===BRICK); return a; })()" % (m2[0], m2[1], m1[0], m1[1], m0[0], m0[0], m0[1]))
    print('after reload [dim, rootwood kept, echo, beasts, dim, cinderbrick kept, dim, brick kept]', r)
    # ---- the rift panel and the slagforge ----
    r = await h.ev("""(()=>{ openRift(SPAWN_X, VIL_Y-1); render(1); const ok=UI.open==='rift'; closeUI();
       addItem('slagforge',1); const p=G.p, tx=floor((p.x+3)/T)+2, ty=floor((p.y+p.h-1)/T); setTile(tx,ty,SLAGFORGE); const L=stnList('anvil', SLAGFORGE);
       const cb=L.find(e=>e.r.out==='cinder_pick'), L2=stnList('anvil', ANVIL2).find(e=>e.r.out==='cinder_pick'), rk=stnList('altar', OFFERING).find(e=>e.r.out==='rootkey');
       return [ok, 'key at the offering altar', !!rk, 'cinder pick: slagforge, iron anvil', cb&&cb.lvlOk, L2&&L2.lvlOk, L.length]; })()""")
    print('rift ui / slagforge', r)
    print('errs', h.errs[:8])
    sheet(ims, 2, shot('t106_events.png'), labels)
    await h.stop()
asyncio.run(main())
