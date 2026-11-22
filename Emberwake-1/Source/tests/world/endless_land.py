# The endless land: walking and travelling far, the world forms ahead without stalls.
import asyncio, sys
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H
async def run():
    h = await H().start(seed=777, size=1)
    # 1. walk east for real, holding D, and see the world form ahead
    await h.ev("(()=>{ const p=G.p; p.x=p.px=(SPAWN_X+60)*T; p.y=p.py=(heights[SPAWN_X+60]-3)*T; while(boxHits(p.x,p.y,p.w,p.h)){p.y-=T;p.py=p.y;} G.flags.dbl=true; })()")
    worst = 0; stuck = 0; lastx = 0
    for k in range(60):
        r = await h.ev("(()=>{ const t0=performance.now(); for(let i=0;i<20;i++){ keys.KeyD=true; if (G.p.vx<.3 && G.p.onGround) { pressed.Space=true; keys.Space=true; } else keys.Space=G.p.vy<0; if(G.hitstop>0){G.hitstop--;tickParts();} else tick(); } render(1); const p=G.p, pc=floor((p.x+3)/T/CW); return [performance.now()-t0, p.x/T|0, p.y/T|0, CST[pc], CST[pc+3], [...CST].filter(v=>v===3).length, p.dead]; })()")
        worst = max(worst, r[0]/20)
        if r[1] == lastx: stuck += 1
        lastx = r[1]
    print('walk east: at', r[1]-32768, 'ready here/ahead', r[3], r[4], 'ready chunks', r[5], 'worst ms/frame', round(worst,1), 'stalls', stuck, 'dead', r[6])
    # 2. jump far both ways (like a waystone) and check the land forms under you
    for dx in [3000, -3000, 9000, -15000]:
        r = await h.ev("(()=>{ const x=SPAWN_X+%d; travelTo(x, surf(x)); for(let i=0;i<30;i++) tick(); const p=G.p; return [p.x/T|0, p.y/T|0, CST[floor(x/CW)], heights[x], biomeAt(x), p.onGround, boxHits(p.x,p.y,p.w,p.h)]; })()" % dx)
        print('travel', dx, r)
    # 3. story places
    r = await h.ev("(()=>{ for (const x of [SHRINE_X, SHRINE2_X, MINE_X, FORGE_X, GATE_X, SKY_X, BLADE_X, SPIRE_X]) streamTo(x*T, true); return { blade: SPOTS.blade, hook: SPOTS.hook, flask: SPOTS.flask, keeper: SPOTS.keeper, spire: SPOTS.spire, marks: LANDMARKS.map(l=>l.id).filter(id=>!id.startsWith('s')).join(','), shrineTile: tileAt(SHRINE_X, SHRINE_Y-1)===SHRINE, gate: tileAt(GATE_X, GATE_Y-1)===GATE, court: tileAt(SHRINE2_X, SHRINE2_Y-1)===SHRINE2 }; })()")
    print('story', r)
    # 4. edits far away survive a save and come back when that land forms again
    r = await h.ev("""(async()=>{
      const fx = SPAWN_X + 2500; streamTo(fx*T, true); const fy = heights[fx]; setTile(fx, fy, AIR); setTile(fx+1, fy-1, COBBLE); const nx = SPAWN_X + 20, ny = heights[nx]; setTile(nx, ny-1, PLANK);
      travelTo(SPAWN_X, VIL_Y); for (let i=0;i<5;i++) tick(); saveWorld(true);
      const id=WORLD.id, meta=JSON.parse(localStorage.getItem(profileKey('index'))).find(m=>m.id===id);
      quitToTitle(); await new Promise(r=>setTimeout(r,200)); await openWorld(meta); await new Promise(r=>setTimeout(r,600)); if (G.state==='intro') beginPlay(false);
      const near = tileAt(nx, ny-1) === PLANK, farBefore = CST[floor(fx/CW)];
      streamTo(fx*T, true);
      return { near, farBefore, farHole: tileAt(fx, fy) === AIR, farCobble: tileAt(fx+1, fy-1) === COBBLE, mods: MODS.size, pend: PEND.mods.size };
    })()""")
    print('save', r)
    print('errs', h.errs[:5])
    await h.stop()
asyncio.run(run())
