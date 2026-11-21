# Screens: echo stones, the journal and other panels.
import asyncio, sys
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet
async def main():
    h = await H().start(seed=4242)
    ims, labels = [], []
    # an overworld echo stone
    r = await h.ev("""(()=>{ for (let i=0;i<8;i++){ const x=echoX(i); streamTo(x*T,true); } const a=[...ECHOPOS.entries()].map(([i,id])=>[(i%WW)-X0, id, tileAt(i%WW, floor(i/WW))===ECHOSTONE]); return a; })()""")
    print('overworld echoes', r)
    first = [e for e in r if e[2]][0]
    await h.ev("(()=>{ const x=X0+%d; const p=G.p; streamTo(x*T,true); p.x=p.px=(x-1)*T+1; p.y=p.py=(groundAt(x)-3)*T; let n=0; while(boxHits(p.x,p.y,p.w,p.h)&&n++<80){p.y-=T;p.py=p.y;} snapCam(); G.cine=null; })()" % first[0])
    await h.step(20, "G.cine=null")
    r = await h.ev("(()=>{ const o=nearestInteract(); if(!o) return null; const l=o.label; o.act(); return [l, UI.open, G.echoes.size]; })()")
    print('echo interact', r)
    await h.step(2); ims.append((await h.shot()).resize((640, 360))); labels.append('echo stone ' + str(r))
    await h.ev("closeUI(); Object.assign(G.beasts,{slagling:4, husk:9, moonwretch:2}); G.echoes.add(100); G.echoes.add(203); G.flags.seen1=true; UI.open='journal'; UI.jtab='echo';")
    await h.step(1); ims.append((await h.shot()).resize((640, 360))); labels.append('journal echoes')
    await h.ev("UI.jtab='beast'; UI.scroll=0;"); await h.step(1); ims.append((await h.shot()).resize((640, 360))); labels.append('journal beasts')
    await h.ev("UI.jtab='leads'; learn('tyrant',true); learn('emoon',true); learn('rootkey',true);"); await h.step(1); ims.append((await h.shot()).resize((640, 360))); labels.append('journal leads')
    await h.ev("closeUI(); G.flags.gateOpen=true; G.flags.dim1=true; addItem('rootkey',1); enterDim(1, true); G.cine=null; G.banner=null; openRift(SPAWN_X, VIL_Y-1);")
    await h.step(2); ims.append((await h.shot()).resize((640, 360))); labels.append('rift panel (with key)')
    await h.ev("closeUI(); const tx=floor((G.p.x+3)/T)+3, ty=floor((G.p.y+G.p.h-1)/T); setTile(tx,ty,SLAGFORGE); for (const [id,n] of [['tyrant_core',1],['cinder_bar',8],['moon_wax',3],['cinderite_ore',9],['cinder',4]]) addItem(id,n); openStation(tx,ty);")
    await h.step(2); ims.append((await h.shot()).resize((640, 360))); labels.append('slagforge')
    print('errs', h.errs[:8])
    sheet(ims, 2, shot('t107_ui.png'), labels)
    await h.stop()
asyncio.run(main())
