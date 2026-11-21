# The story: discovery scenes, the people of Hearthhold, leads and the journal.
import asyncio
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import *
async def main():
    h = await H().start(seed=777, w=1280, h=720)
    ims=[]; labels=[]; log=[]
    def L(*a): print(*a, flush=True); log.append(a)
    async def snap(lbl): ims.append(await h.shot()); labels.append(lbl)
    async def talkthrough(maxn=30):
        n=0
        while await h.ev("!!G.dialog") and n < maxn:
            await h.step(3); await h.ev("dialogAdvance(); dialogAdvance();"); n+=1
        return n
    async def press_f(): await h.ev("pressed.KeyF=true"); await h.step(1)
    async def pickup(): await h.step(30); await h.ev("for(const d of G.drops){ d.x=G.p.x; d.y=G.p.y+4; d.delay=0; }"); await h.step(40)
    L('start leads', await h.ev("[[...G.leads].join(','), G.pin]"))
    # discovery cutscene for the village
    await h.ev("G.found=new Set()"); await h.goto("SPAWN_X-30"); await h.step(25)
    await h.step(40); L('cine', await h.ev("G.cine && G.cine.title")); await snap('discovery: Hearthhold')
    await h.step(260); L('cine over', await h.ev("!G.cine")); await h.ev("G.found=new Set(LANDMARKS.map(l=>l.id)); for (const r of ['drift','under','deep']) G.found.add('realm_'+r);")
    # Wick
    await h.goto("SPOTS.camp.x-3", "VIL_Y-3"); await h.step(20)
    L('near', await h.ev("(nearestInteract()||{}).label")); await press_f(); await h.ev("if(G.dialog) G.dialog.t=60"); await snap('Wick')
    await talkthrough(); await h.step(5)
    L('after wick', await h.ev("[G.flags.metWick, countItem('spear'), [...G.leads].join(','), G.pin]"))
    # Juno
    await h.goto("SPOTS.juno.x-1", "VIL_Y-3"); await h.step(20); L('near', await h.ev("(nearestInteract()||{}).label")); await press_f(); await h.ev("if(G.dialog) G.dialog.t=80"); await snap('Juno in the dojo')
    await talkthrough(); L('after juno', await h.ev("[countItem('nunchaku'), countItem('shuriken'), G.p.arm, [...G.leads].join(',')]"))
    # Bram, Pell
    await h.goto("SPOTS.bram.x+1", "VIL_Y-3"); await h.step(20); L('near', await h.ev("(nearestInteract()||{}).label")); await press_f(); await h.ev("if(G.dialog) G.dialog.t=80"); await snap('Bram at the smithy'); await talkthrough()
    L('after bram', await h.ev("[countItem('flask'), [...G.leads].join(',')]"))
    await h.goto("SPOTS.pell.x", "VIL_Y-3"); await h.step(10); await h.ev("const n=G.npcs.find(n=>n.kind==='pell'); G.p.x=n.x; G.p.y=n.y;"); await h.step(2); L('near', await h.ev("(nearestInteract()||{}).label")); await press_f(); await talkthrough()
    L('after pell', await h.ev("[countItem('smoke'), [...G.leads].join(',')]"))
    await h.goto("SPOTS.board.x", "VIL_Y-3"); await h.step(5); L('near', await h.ev("(nearestInteract()||{}).label")); await press_f(); await h.step(5); L("board ui", await h.ev("UI.open")); await h.ev("closeUI()")
    await h.goto("SPOTS.camp.x", "VIL_Y-3"); await h.step(5); L('near', await h.ev("(nearestInteract()||{}).label")); await press_f(); L('respawn', await h.ev("G.respawn"))
    # sky altar
    await h.goto("SKY_X-1", "SKY_Y-3"); await h.step(20); L('near', await h.ev("(nearestInteract()||{}).label")); await press_f(); await h.step(5); await snap('altar in the Drift')
    L('hook', await h.ev("[G.flags.gotHook, countItem('hook'), G.p.arm]"))
    # forge: flask, then the Keeper wakes
    await h.goto("SPOTS.flask.x+1", "FORGE_Y-4"); await h.step(20); await h.ev("G.cine=null"); L('near', await h.ev("(nearestInteract()||{}).label")); await press_f(); L('flask', await h.ev("[G.flags.gotFlask, countItem('flask')]"))
    await h.goto("FORGE_X-8", "FORGE_Y-4"); await h.ev("G.cine=null"); await h.step(40); L('keeper asleep until offered to', await h.ev("[!!G.boss, !!G.flags.keeperSeen, G.banner && G.banner.text]"))
    await h.goto("SPOTS.keeper.x", "SPOTS.keeper.y-3"); await h.step(10); L('near the anvil', await h.ev("(nearestInteract()||{}).label")); await press_f(); L('no offering', await h.ev("!!G.boss"))
    await h.ev("addItem('forge_offering', 1)"); await h.step(2); L('near the anvil', await h.ev("(nearestInteract()||{}).label")); await press_f(); await h.step(30)
    await h.goto("FORGE_X-8", "FORGE_Y-4"); await h.step(10); L('keeper', await h.ev("G.boss && [G.boss.type, G.boss.state]")); await snap('the Forge-Keeper wakes')
    await h.step(100)
    # fight a little: stand and take a few attacks
    for i in range(6):
        await h.ev("G.p.hp=100; G.p.inv=0"); await h.step(40); await snap('keeper: '+await h.ev("G.boss?G.boss.state:'none'"))
    # blind it, then link
    await h.ev("(()=>{const k=G.boss; applyStatus(k,'blind',G.p,{d:200}); G.sel=0; })()"); await h.step(2)
    await h.ev("(()=>{const k=G.boss, p=G.p; p.x=k.x-14; p.y=k.y+k.h-p.h; p.face=1; render(1); mouse.x=(k.x+6-G.rcx)*VS.s; mouse.y=(k.y+16-G.rcy)*VS.s; mouse.lp=true; mouse.l=true;})()"); await h.step(1); await h.ev("mouse.l=false")
    L('link on keeper', await h.ev("G.p.state==='link'?G.p.link.id:'none'")); await h.step(20); await snap('ash dance on the keeper')
    await h.step(40)
    await h.ev("G.boss.hp=10; damageEnemy(G.boss, 50, 0, 0, {})"); await h.step(200); await pickup()
    L('keeper down', await h.ev("[G.flags.keeperDead, G.flags.e3, countItem('kmaul'), countItem('wember3'), countItem('keeper_sigil'), countItem('keeper_brand'), trinkSlots()]"))
    # cinder walk with the Deep Ember
    await h.ev("(()=>{ for(let x=FORGE_X+60;x<WW-10;x++) for(let y=DEEP_Y;y<WH-6;y++) if(tiles[y*WW+x]===CINDER && tiles[(y-1)*WW+x]===AIR){ G.p.x=x*T; G.p.y=(y-3)*T; return; } })()"); await h.ev("G.p.hp=100"); await h.step(60)
    L('in cinder with e3', await h.ev("[G.p.hp, liqAt(G.p.x+3,G.p.y+G.p.h-4), (G.p.st||{}).burn||0]"))
    # warden and vesper, quickly
    await h.goto("SHRINE_X-1"); await h.step(10); await press_f(); await h.step(10); L('shrine without an offering', await h.ev("!!G.boss"))
    await h.ev("addItem('ashen_offering', 1)"); await press_f(); await h.step(60); await h.ev("killEnemy(G.boss)"); await h.step(260); await pickup()
    L('warden', await h.ev("[G.flags.wardenDead, G.flags.dbl, countItem('warden_sigil'), countItem('warden_eye'), trinkSlots()]"))
    await h.goto("SHRINE2_X+1"); await h.step(10); await press_f(); L('mirror without an offering', await h.ev("!!G.dialog || !!G.duel")); await h.ev("addItem('mirror_offering', 1)"); await press_f(); await talkthrough(); await h.step(30)
    await h.ev("(()=>{ const v=G.fighters.find(f=>f.name==='VESPER'); if(v){ v.hp=1; hurtFighter(v, 10, G.p.x, {by:G.p}); } })()"); await h.step(120); await talkthrough(); await h.step(60); await pickup()
    L('vesper', await h.ev("[G.flags.vesperDone, G.flags.e2, embers(), countItem('glass_sigil'), trinkSlots()]"))
    # the gate
    await h.goto("GATE_X-1"); await h.step(10); await h.ev("G.cine=null"); L('near', await h.ev("(nearestInteract()||{}).label")); await press_f(); await h.step(80); await snap('the gate opens')
    L('gate', await h.ev("[G.flags.gateOpen, G.cine&&G.cine.title]"))
    L('leads open', await h.ev("leadsOpen().join(',')"), 'done', await h.ev("LEAD_ORDER.filter(id=>G.leads.has(id)&&LEADS[id].done()).join(',')"))
    sheet(ims,3,shot('story.png'),labels,.42)
    print('\n'.join(h.errs[:20]) or 'no errors')
    await h.stop()
asyncio.run(main())
