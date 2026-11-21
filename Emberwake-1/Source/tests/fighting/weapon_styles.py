# Weapon styles: locked until learned, learning them, the codex and the HUD.
import asyncio, sys
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet
D = "G.enemies.find(e=>e.type==='dummy'&&!e.tempPost)"
async def run():
    h = await H().start(seed=4242, size=1)
    print('style moves', await h.ev("Object.values(MOVESETS).reduce((n,s)=>n+Object.keys(s.moves).filter(isStyleId).length,0)"))
    await h.goto("SPOTS.dummy.x+3", "VIL_Y-3"); await h.step(10)
    await h.ev("inv.fill(null); inv[0]={id:'steel_greatsword',n:1}; G.sel=0; G.mast={};")
    await h.step(2)
    # locked
    await h.step(1, "pressed.KeyV=true;"); print('locked ->', await h.ev("G.p.state"), await h.ev("(G.say||G.msg||{}).text||''"))
    # Juno's lesson
    await h.ev("junoTalk()");
    for i in range(6):
        await h.step(3)
        if await h.ev("!!G.dialog"): await h.ev("dialogAdvance()")
    print('after juno rank', await h.ev("styleLevel('greatsword')"), await h.ev("masteryXp('greatsword')"))
    # a drill at the dummy: do what it calls for
    await h.ev("(()=>{ const d=%s, p=G.p; p.x=p.px=d.x+14; p.y=p.py=d.y+d.h-p.h; p.face=-1; startDrill(0,0,d); })()" % D)
    print('drill', await h.ev("G.drill && G.drill.steps"))
    AIM = "(()=>{ const d=%s; mouse.wx=d.x+4; mouse.wy=d.y+8; mouse.x=(mouse.wx-G.rcx)*VS.s; mouse.y=(mouse.wy-G.rcy)*VS.s; })();" % D
    for guard in range(40):
        st = await h.ev("G.drill ? G.drill.steps[G.drill.k] : null")
        if not st: break
        await h.ev("(()=>{ const d=%s, p=G.p; if (Math.abs(p.x-(d.x+14))>4) { p.x=p.px=d.x+14; } p.face=-1; d.hp=d.maxhp; })()" % D)
        if st in ('L3','combo5'):
            for k in range(5 if st=='combo5' else 3):
                await h.step(1, AIM+"mouse.l=true;mouse.lp=true;"); await h.step(9, AIM+"mouse.l=false;")
        elif st == 'H1':
            await h.step(1, AIM+"mouse.r=true;mouse.rp=true;"); await h.step(2, AIM+"mouse.r=false;"); await h.step(30, AIM)
        elif st == 'air':
            await h.step(1, AIM+"pressed.Space=true;keys.Space=true;"); await h.step(6, AIM+"keys.Space=true;"); await h.step(1, AIM+"mouse.l=true;mouse.lp=true;"); await h.step(30, AIM+"keys.Space=false;mouse.l=false;")
        elif st == 'dodge':
            await h.step(1, AIM+"pressed.ShiftLeft=true;"); await h.step(30, AIM)
        elif st == 'S0':
            await h.step(1, AIM+"pressed.KeyV=true;"); await h.step(45, AIM)
        else:
            await h.step(10, AIM)
    print('drill left', await h.ev("G.drill && [G.drill.k, G.drill.steps]"), 'rank', await h.ev("styleLevel('greatsword')"), await h.ev("masteryXp('greatsword')"))
    # every style of a few weapons, in its own context
    ims, labels = [], []
    errs = []
    for wid in ['steel_greatsword','bronze_glaive','steel_claws','deep_warhammer','bone_recurve','iron_flail']:
        ok = await h.ev("!!IT['%s']" % wid)
        if not ok:
            wid = await h.ev("Object.values(IT).find(i=>i.type==='weapon'&&i.wtype==='%s')?.id" % {'bone_recurve':'recurve'}.get(wid, wid))
        await h.ev("(()=>{ inv[0]={id:'%s',n:1}; G.sel=0; inv[9]={id:'arrow',n:99}; const ty=weaponType(IT['%s']); G.mast[ty]=999; })()" % (wid, wid))
        for k in range(5):
            await h.ev("(()=>{ const d=%s, p=G.p; p.state='normal'; p.atk=null; p.x=p.px=d.x+22; p.y=p.py=d.y+d.h-p.h; p.vx=p.vy=0; p.face=-1; p.stam=p.maxstam; p.dodgeGrace=0; p.riposte=0; d.hp=d.maxhp; })()" % D)
            await h.step(4, AIM)
            pre = {0: "", 1: "keys.KeyA=true;", 2: "keys.KeyS=true;", 3: "", 4: ""}[k]
            if k == 3:
                await h.step(1, AIM+"pressed.Space=true;keys.Space=true;"); await h.step(7, AIM+"keys.Space=true;")
            if k == 4:
                await h.step(1, AIM+"pressed.ShiftLeft=true;"); await h.step(11, AIM)
            await h.step(1, AIM+pre+"pressed.KeyV=true;")
            mid = await h.ev("G.p.atk ? G.p.atk.id : G.p.state")
            await h.step(6, AIM+pre)
            if k in (0, 3): ims.append((await h.pcrop(70, 46)).resize((280, 184))); labels.append('%s %s' % (wid, mid))
            await h.step(40, AIM+pre)
            await h.ev("keys.KeyA=false; keys.KeyS=false; keys.Space=false;")
            if not str(mid).startswith('S_'): errs.append((wid, k, mid))
    print('styles not started:', errs)
    # pair finisher: land a style with the greatsword, then X into a glaive
    await h.ev("(()=>{ inv[0]={id:'steel_greatsword',n:1}; G.sel=0; G.gear.off={id:'bronze_glaive',n:1}; })()")
    await h.ev("(()=>{ const d=%s, p=G.p; p.state='normal'; p.atk=null; p.x=p.px=d.x+14; p.y=p.py=d.y+d.h-p.h; p.face=-1; p.stam=p.maxstam; p.pairT=0; d.hp=d.maxhp; })()" % D)
    await h.step(3, AIM)
    await h.step(1, AIM+"pressed.KeyV=true;")
    for i in range(30):
        await h.step(1, AIM)
        if await h.ev("G.p.pairT>0"): break
    print('before X', await h.ev("[G.p.pairT, G.p.pairW, G.p.swapCd, G.p.state, G.p.atk&&G.p.atk.id, G.p.atk&&G.p.atk.phase, !!G.dialog, !!UI.open, !!G.cine]"))
    await h.step(1, AIM+"pressed.KeyX=true;"); await h.step(10, AIM)
    print('pair:', await h.ev("[G.p.atk&&G.p.atk.id, heldOf(G.p).id, G.gear.off&&G.gear.off.id, [...G.pairsKnown]]"))
    await h.step(8, AIM); ims.append((await h.pcrop(70, 46)).resize((280, 184))); labels.append('pair finisher')
    sheet(ims, 4, shot('t95.png'), labels)
    await h.step(40)
    await h.ev("toggleUI('codex'); UI.codex='styles';"); await h.step(2)
    (await h.shot()).save(shot('t95_codex.png'))
    await h.ev("closeUI()"); await h.step(2)
    (await h.shot()).save(shot('t95_hud.png'))
    print('errs', h.errs[:5])
    await h.stop()
asyncio.run(run())
