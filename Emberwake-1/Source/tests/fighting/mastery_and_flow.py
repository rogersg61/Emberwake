# Fighting: moves learned step by step, flow between moves, perfect-dodge counters, and weapon arts.
import asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from harness import H

# a husk standing still in front of the Waker, and the mouse pointing at it
FOE = """(() => { G.enemies.length = 0; const p = G.p, x = floor((p.x + 3) / T) + 3, e = spawnMob('husk', x, heights[x]); e.hp = e.maxhp = 2000; e.frozen = 1; e.stun = 9999; window.FOE = e;
  p.face = 1; mouse.wx = e.x + 3; mouse.wy = e.y + 8; return e.hp; })()"""
AIM = "(() => { const e = FOE; mouse.wx = e.x + 3 + (window.AX || 0); mouse.wy = e.y + 8 + (window.AY || 0); mouse.x = (mouse.wx - G.rcx) * VS.s; mouse.y = (mouse.wy - G.rcy) * VS.s; })();"


async def swing(h, btn='L', extra='', ticks=40):
    """press one attack and let it play out; return the move used and the damage it did"""
    await h.ev("(() => { const p = G.p, e = FOE; p.x = p.px = e.x - 16; p.y = p.py = e.y + e.h - p.h; p.vx = p.vy = 0; p.face = 1; p.onGround = true; p.atk = null; p.state = 'normal'; })()")
    hp0 = await h.ev("FOE.hp")
    key = 'mouse.lp=true; mouse.l=true;' if btn == 'L' else 'mouse.rp=true; mouse.r=true;'
    await h.step(1, extra + AIM + key)
    await h.step(ticks, AIM + "mouse.l=false; mouse.r=false; FOE.stun = 9999;")
    return await h.ev("G.p.lastMove || (G.p.atk && G.p.atk.id) || ''"), round(hp0 - await h.ev("FOE.hp"))


def round(x): return int(x + .5)


async def run():
    h = await H().start(seed=4242, size=1)
    out = {}
    await h.ev("inv.fill(null); inv[0] = { id: 'steel_sword', n: 1 }; G.sel = 0; G.fam = {}; G.arts = new Set(); G.artk = {}; G.p.inv = 99999; G.p.stam = 100;")
    await h.ev(FOE); await h.step(5)
    out['a new Waker: blades step'] = await h.ev("FAM_STEP[famStep('sword')]")
    out['aiming down before FOOTWORK gives'] = (await swing(h, extra="window.AY = 30; keys.KeyS = true;"))[0]
    await h.ev("keys.KeyS = false; window.AY = 0; G.fam.sword = 30;")
    out['after 30 practice: step'] = await h.ev("FAM_STEP[famStep('sword')]")
    out['aiming down now gives (move, damage)'] = await swing(h, extra="window.AY = 30; keys.KeyS = true;")
    await h.ev("keys.KeyS = false; window.AY = 0;")
    out['the husk is DOWN after the sweep'] = await h.ev("(FOE.fl && FOE.fl.down || 0) > G.time")
    # what each kind of follow-up earns (the multiplier on the blow, and its name), worked out directly
    PAY = """(() => { const set = MOVESETS.sword, M = set.map, p = G.p, out = {};
      const a = (id, air) => ({ f: p, m: set.moves[id], id, set, setName: 'sword', air: !!air });
      const t = (name, id, air, fl, st, rh) => { FOE.fl = fl || {}; FOE.st = null; FOE.onGround = !st; if (st) applyStatus(FOE, st, p); p.rhythm = rh || 0; const r = flowPay(a(id, air), FOE); out[name] = r ? r.tag + ' x' + r.mul.toFixed(2) : 'none'; };
      t('heavy on a standing foe', M.h); t('heavy on a downed foe', M.h, 0, { down: G.time + 50 }); t('light on a downed foe', M.chain[0], 0, { down: G.time + 50 });
      t('air blow on a launched foe', M.aChain[0], 1, {}, 'launched'); t('dive on a launched foe', M.aD, 1, {}, 'launched');
      t('heavy on an open foe', M.h, 0, { open: G.time + 50 }); t('heavy after three light blows', M.h, 0, {}, null, 3);
      FOE.fl = {}; FOE.st = null; p.rhythm = 0; return JSON.stringify(out); })()"""
    for k, v in __import__('json').loads(await h.ev(PAY)).items(): out['flow: ' + k] = v
    # rhythm builds for real: three light blows in a row
    await h.ev("FOE.fl = {}; G.p.rhythm = 0; G.p.stam = 100;")
    for _ in range(3): await swing(h, ticks=22)
    out['rhythm after three real light blows'] = await h.ev("G.p.rhythm")
    # perfect-dodge counters
    await h.ev("G.fam.sword = 260;")
    for name, extra, btn in (('plain', '', 'L'), ('aim up', 'window.AY = -40;', 'L'), ('holding S', 'keys.KeyS = true; window.AY = 30;', 'L'), ('heavy', '', 'H')):
        await h.ev("keys.KeyS = false; window.AY = 0; G.p.stam = 100; FOE.fl = {};"); await h.step(20)
        mv, d = await swing(h, btn, extra="G.p.riposte = 20;" + extra, ticks=50)
        out['counter, ' + name] = [await h.ev("MOVESETS.sword.moves[%r] ? MOVESETS.sword.moves[%r].name : %r" % (mv, mv, mv)), d]
    await h.ev("keys.KeyS = false; window.AY = 0;")
    # arts: a steel blade's art, learned by fighting with it
    out['art before learning'] = await h.ev("artLine(heldOf(G.p))")
    await h.ev("for (let i = 0; i < 60; i++) artGain(heldOf(G.p));")
    out['art after 60 blows with steel'] = await h.ev("artLine(heldOf(G.p))")
    await h.ev("G.p.stam = 100; FOE.fl = {}; FOE.hp = 2000;")
    await h.step(1, AIM + "mouse.rp = true; mouse.r = true;")
    await h.step(40, AIM + "mouse.r = true; FOE.stun = 9999;")       # hold until it flares
    await h.step(60, AIM + "mouse.r = false; FOE.stun = 9999;")      # let go
    out['released art'] = [await h.ev("G.p.lastMove"), await h.ev("MOVESETS.sword.moves[G.p.lastMove] && MOVESETS.sword.moves[G.p.lastMove].name"), round(2000 - await h.ev("FOE.hp"))]
    # an old save: moves already used stay learned
    out['old save that used Talon Dive and Cyclone'] = await h.ev("JSON.stringify(famFromKnown(['sword:talon_dive', 'sword:cyclone', 'maul:swat']))")
    # the battle royale and the arena keep every move
    out['arena: everything open'] = await h.ev("(() => { const a = WORLD.arena; WORLD.arena = true; const r = famOpen('sword', 'meteor_drop'); WORLD.arena = a; return r; })()")
    for k, v in out.items(): print(k, '=>', v)
    print('errors:', await h.ev("window.__errs ? window.__errs.slice(0, 5) : []"))
    await h.stop()

asyncio.run(run())
