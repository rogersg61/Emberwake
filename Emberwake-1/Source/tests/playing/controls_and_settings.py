# Simple controls (fists, chains), difficulty, digging by hand, knapping, and the menu settings.
import asyncio, sys
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet

PRE = r"""
window.aimW = (wx, wy) => { mouse.wx = wx; mouse.wy = wy; mouse.x = (wx - G.rcx) * VS.s; mouse.y = (wy - G.rcy) * VS.s; };
window.flatSpot = () => { for (let x = SPAWN_X + 30; x < SPAWN_X + 900; x++) { const h = heights[x]; let ok = true; for (let k = -8; k <= 14 && ok; k++) { if (heights[x + k] !== h) ok = false; for (let y = h - 8; y < h; y++) if (tileAt(x + k, y)) ok = false; } if (ok) return x; } return SPAWN_X + 40; };
window.reset = () => { const p = G.p; G.enemies.length = 0; G.projs.length = 0; p.atk = null; p.state = 'normal'; p.buf = null; p.vx = 0; p.hurtT = 0; p.toolT = 0; p.swingT = 0; p.strike = null; p.toolCharge = 0; p.inv = 99999; p.stam = p.maxstam; p.chainT = 0; p.lastMove = null; for (const k in keys) keys[k] = false; mouse.l = mouse.r = mouse.lp = mouse.rp = false; UI.open = null; G.cine = null; G.dialog = null; };
window.hold = (id) => { inv[0] = id ? { id, n: IT[id].stack > 1 ? 20 : 1 } : null; G.sel = 0; };
"""

async def main():
    h = await H().start(seed=4242)
    await h.ev(PRE)
    x0 = await h.ev("flatSpot()")
    await h.goto(x0)
    await h.step(20)
    gy = await h.ev("heights[%d]" % x0)
    res = {}

    async def put(dx):
        await h.ev("reset(); G.p.x = G.p.px = %d * T + 1; G.p.y = G.p.py = (%d - 3) * T; G.p.face = 1;" % (x0, gy))
        await h.step(6, "reset()")

    # A. a carried item (flint) leaves the fists free: click on air = punch, no knapping window
    await put(0); await h.ev("hold('flint')")
    await h.step(1, "aimW(G.p.x + 30, G.p.y + 7); mouse.lp = true; mouse.l = true;")
    await h.step(3, "aimW(G.p.x + 30, G.p.y + 7); mouse.l = true;")
    res['A carried->fist'] = await h.ev("[G.p.atk && G.p.atk.W.id, UI.open]")

    # B. a block in hand, cursor on a creature: punch it, place nothing
    await put(0); await h.ev("hold('dirt'); window.E = spawnMob('husk', %d + 2, %d); E.hp = E.maxhp = 400;" % (x0, gy))
    before = await h.ev("let n = 0; for (let x = %d - 4; x < %d + 8; x++) for (let y = %d - 6; y < %d; y++) if (tileAt(x, y)) n++; n" % (x0, x0, gy, gy))
    seen = set()
    for i in range(40):
        await h.step(1, "aimW(E.x + E.w / 2, E.y + E.h / 2); mouse.l = true; if (G.time %% 12 === 0) mouse.lp = true; E.vx = 0; E.x = E.px = %d * T + 18;" % x0)
        a = await h.ev("G.p.atk ? G.p.atk.W.id : ''")
        if a: seen.add(a)
    after = await h.ev("let n = 0; for (let x = %d - 4; x < %d + 8; x++) for (let y = %d - 6; y < %d; y++) if (tileAt(x, y)) n++; n" % (x0, x0, gy, gy))
    res['B block+foe'] = [sorted(seen), await h.ev("400 - E.hp"), 'tiles placed: %d' % (after - before)]
    res['K held drawn'] = await h.ev("[visHeld(G.p) && visHeld(G.p).id, heldOf(G.p).id]")
    await h.step(30, "G.p.atk = null; G.p.state = 'normal'; G.p.buf = null; mouse.l = mouse.lp = false; hold('torch'); aimW(E.x + E.w / 2, E.y + E.h / 2);")
    await h.ev("aimW(E.x + E.w / 2, E.y + E.h / 2)")
    res['K torch drawn idle'] = await h.ev("[visHeld(G.p) && visHeld(G.p).id, heldOf(G.p).id, IT.torch.type]")

    # C. a block in hand, cursor on an empty tile: places it
    await put(0); await h.ev("hold('dirt')")
    await h.step(1, "aimW((%d + 2) * T + 4, (%d - 1) * T + 4); mouse.lp = true; mouse.l = true;" % (x0, gy))
    await h.step(2, "aimW((%d + 2) * T + 4, (%d - 1) * T + 4); mouse.l = true;" % (x0, gy))
    res['C block placed'] = await h.ev("[tileAt(%d + 2, %d - 1) === DIRT, G.p.atk && G.p.atk.W.id]" % (x0, gy))
    await h.ev("setTile(%d + 2, %d - 1, 0)" % (x0, gy))

    # D. a pickaxe swung at a creature hurts it instead of digging behind it
    await put(0); await h.ev("hold('pick'); window.E = spawnMob('husk', %d + 2, %d); E.hp = E.maxhp = 400;" % (x0, gy))
    for i in range(40):
        await h.step(1, "aimW(E.x + E.w / 2, E.y + E.h / 2); mouse.l = true; E.vx = 0; E.x = E.px = %d * T + 18;" % x0)
    res['D pick hits foe'] = await h.ev("[400 - E.hp, G.p.atk ? 'attacked' : 'swung']")

    # E. walking forward and clicking far ahead with bare hands: no dash
    async def walk(click, mode, wid=None):
        await put(0); await h.ev("hold(%s); SETTINGS.combat = '%s';" % ("'%s'" % wid if wid else 'null', mode))
        x_start = await h.ev("G.p.x"); moves = []
        for i in range(30):
            await h.step(1, "keys.KeyD = true; aimW(G.p.x + 110, G.p.y + 7); %s" % ("if (G.time % 10 === 0) { mouse.lp = true; } mouse.l = false;" if click else ''))
            a = await h.ev("G.p.atk ? G.p.atk.id : ''")
            if a and (not moves or moves[-1] != a): moves.append(a)
        return round(await h.ev("G.p.x") - x_start, 1), moves
    res['E walk only'] = await walk(False, 'simple')
    res['E walk+punch simple'] = await walk(True, 'simple')
    res['E walk+punch full'] = await walk(True, 'full')
    res['E fangs full (old)'] = await walk(True, 'full', 'fangs')
    res['E fangs simple'] = await walk(True, 'simple', 'fangs')
    await h.ev("SETTINGS.combat = 'simple'")

    # F. hold the button: the combo keeps going
    await put(0); await h.ev("hold(null)")
    seq = []
    for i in range(110):
        await h.step(1, "aimW(G.p.x + 24, G.p.y + 7); mouse.l = true; %s" % ("mouse.lp = true;" if i == 0 else ''))
        a = await h.ev("G.p.atk ? G.p.atk.id : ''")
        if a and (not seq or seq[-1] != a): seq.append(a)
    res['F hold chain'] = seq

    # G. difficulty scales the damage you take (beasts and hollows alike)
    out = {}
    for d in ['easy', 'normal', 'hard']:
        out[d] = await h.ev("(() => { SETTINGS.diff = '%s'; const p = G.p, r = []; for (const o of [{}, { by: G.p, pvp: true }]) { p.inv = 0; p.iDodge = 0; p.state = 'normal'; p.atk = null; p.hp = p.maxhp = 100; hurtFighter(p, 20, p.x + 30, o); r.push(100 - p.hp); } p.inv = 99999; p.hp = p.maxhp; return r; })()" % d)
    res['G damage taken'] = out
    await h.ev("SETTINGS.diff = 'easy'")

    # L. a carried item with ground under the cursor still digs by hand
    await put(0); await h.ev("hold('flint')")
    tile0 = await h.ev("tileAt(%d + 1, %d)" % (x0, gy))
    swung = False
    for i in range(140):
        await h.step(1, "aimW((%d + 1) * T + 4, %d * T + 3); mouse.l = true;" % (x0, gy))
        if await h.ev("G.p.toolT > 0"): swung = True
    res['L hand dig'] = [swung, tile0, await h.ev("tileAt(%d + 1, %d)" % (x0, gy)), await h.ev("UI.open")]

    # M. knapping still opens on K
    await put(0); await h.ev("hold('flint')")
    await h.pg.keyboard.down('KeyK'); await h.step(1); await h.pg.keyboard.up('KeyK'); await h.step(1)
    res['M K knaps'] = await h.ev("UI.open")
    await h.ev("UI.open = null")

    # I. pause menu buttons cycle the settings
    await h.ev("reset(); UI.open = 'pause'"); await h.step(1, "UI.open = 'pause'")
    btn = "(() => { const A = WORLD.arena, w = Math.min(A ? 340 : 392, VS.uw - 16), hh = A ? 158 : 240, x = Math.round((VS.uw - w) / 2), y = Math.round((VS.uh - hh) / 2); return [x, y, w, hh]; })()"
    x, y, w, hh = await h.ev(btn)
    cyc = []
    for i in range(3):
        await h.ev("render(1); mouse.ux = %d; mouse.uy = %d; uiMouseDown(0);" % (x + 130 + 59, y + hh - 19 + 6)); cyc.append(await h.ev("SETTINGS.diff"))
    await h.ev("render(1); mouse.ux = %d; mouse.uy = %d; uiMouseDown(0);" % (x + 8 + 59, y + hh - 19 + 6)); cyc.append(await h.ev("SETTINGS.combat"))
    await h.ev("mouse.ux = %d; mouse.uy = %d; render(1);" % (x + 130 + 59, y + hh - 19 + 6))
    im = await h.shot(); im.save(shot('pause_settings.png'))
    await h.ev("render(1); mouse.ux = %d; mouse.uy = %d; uiMouseDown(0);" % (x + 8 + 59, y + hh - 19 + 6)); cyc.append(await h.ev("SETTINGS.combat"))
    res['I pause cycle'] = cyc
    res['I stored'] = await h.ev("localStorage.getItem('ew_settings')")
    await h.ev("UI.open = 'journal'; UI.jtab = 'leads'; render(1);")
    jx = await h.ev("(() => { const w = Math.min(330, VS.uw - 12), hh = Math.min(VS.uh - 44, 300), x = Math.round((VS.uw - w) / 2), y = Math.round((VS.uh - hh) / 2) - 8; return [x, y]; })()")
    await h.ev("render(1); mouse.ux = %d; mouse.uy = %d; uiMouseDown(0);" % (jx[0] + 176 + 25, jx[1] + 6))
    res['I journal tab click'] = await h.ev("UI.jtab")
    await h.ev("UI.open = null; hold(null); toggleUI('codex'); render(1);")
    res['I codex opens on'] = await h.ev("UI.codex")
    await h.ev("render(1)"); (await h.shot()).save(shot('codex_fists.png'))
    await h.ev("UI.open = null")
    await h.ev("UI.open = null")

    # J. what the punches look like
    ims, labels = [], []
    for mid, aim, air in [('jab', (24, 0), 0), ('cross', (24, 0), 0), ('hook', (24, 0), 0), ('upper_finish', (24, 0), 0), ('uppercut', (6, -30), 0), ('low_kick', (24, 14), 0), ('haymaker', (24, 0), 0), ('sweep', (24, 14), 0), ('elbow', (2, -6), 0), ('stomp', (4, 30), 1), ('air_jab', (24, 0), 1), ('counter', (24, 0), 0)]:
        await put(0); await h.ev("hold(null); window.E = spawnMob('husk', %d + 3, %d); E.hp = E.maxhp = 900;" % (x0, gy))
        if air: await h.ev("G.p.y -= 24; G.p.py = G.p.y; G.p.onGround = false; G.p.vy = 0;")
        await h.step(1, "aimW(G.p.x + 3 + %d, G.p.y + 7 + %d); E.x = E.px = %d * T + 20; E.vx = 0;" % (aim[0], aim[1], x0))
        ok = await h.ev("startAttack(G.p, MOVESETS.brawl.moves['%s'].btn, playerInput(), '%s')" % (mid, mid))
        for i in range(30):
            await h.step(1, "aimW(G.p.x + 3 + %d, G.p.y + 7 + %d); E.x = E.px = %d * T + 20; E.vx = 0;" % (aim[0], aim[1], x0))
            ph = await h.ev("G.p.atk ? G.p.atk.phase : -1")
            if ph >= 1: break
        await h.step(1)
        ims.append(await h.pcrop(60, 50)); labels.append('%s %s' % (mid, 'ok' if ok else 'NO'))
    sheet(ims, 6, shot('brawl_moves.png'), labels)

    for k, v in res.items(): print(k, '=>', v)
    print('errors:', [e for e in h.errs if 'agent-proxy' not in e][:6])
    await h.stop()

asyncio.run(main())
