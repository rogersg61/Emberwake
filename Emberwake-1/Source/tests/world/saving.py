# Saving and loading a world keeps the land, the pack and the stations.
import asyncio
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import *
async def main():
    h = await H().start(mode='none')
    r = await h.ev("""(async()=>{
      localStorage.clear(); ACCOUNT.active={id:'test',name:'TEST',skin:0,hat:0}; FORM.name='V3'; FORM.seed='abc'; FORM.size=0; FORM.shape=0; FORM.mode=0; FORM.skin=1;
      createWorld({name:'V3', seed:'abc', size:0, shape:0, mode:0, skin:1}); await new Promise(r=>setTimeout(r,400)); if (G.state==='intro') beginPlay(true);
      G.leads.add('keeper'); G.leads.add('drift'); G.pin='drift'; G.found.add('village'); G.found.add('forge'); G.linksKnown.add('derby'); G.respawn={x:SPOTS.camp.x, y:SPOTS.camp.y};
      G.flags.e3=true; G.flags.gotHook=true; addItem('hook',1); addItem('flask',5); G.p.arm='flask'; saveWorld(true);
      const id=WORLD.id, meta=JSON.parse(localStorage.getItem(profileKey('index'))).find(m=>m.id===id);
      quitToTitle(); await new Promise(r=>setTimeout(r,200));
      await openWorld(meta); await new Promise(r=>setTimeout(r,400)); if (G.state==='intro') beginPlay(false);
      const out={ leads:[...G.leads].join(','), pin:G.pin, found:[...G.found].join(','), links:[...G.linksKnown].join(','), respawn:JSON.stringify(G.respawn), e3:!!G.flags.e3, hook:countItem('hook'), flask:countItem('flask'), arm:G.p.arm, meta:JSON.stringify({e:meta.e, v:meta.v}) };
      // an old save: v2 regrows and keeps the pack
      const raw=JSON.parse(localStorage.getItem(profileKey('w.'+id))); raw.v=2; raw.mods='0.1'; localStorage.setItem(profileKey('w.'+id), JSON.stringify(raw));
      const m2=Object.assign({}, meta, {v:2}); quitToTitle(); await new Promise(r=>setTimeout(r,200)); await openWorld(m2); await new Promise(r=>setTimeout(r,400)); if (G.state==='intro') beginPlay(false);
      out.old = [G.banner&&G.banner.text, MODS.size, countItem('flask'), G.found.size];
      return out; })()""")
    print(r)
    print('\n'.join(h.errs[:10]) or 'no errors')
    await h.stop()
asyncio.run(main())
