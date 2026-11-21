// ============================================================
//  RELATIONSHIPS. The Rattlechain (nunchaku), four sidearms, the
//  states they leave a foe in, and LINKS: when a foe is pinned,
//  hooked, burning, blinded or launched, the right weapon turns the
//  next attack into a cinematic combination.
//    star knife pins a foe to a wall -> Rattlechain: Pin and Pummel
//    chain hook drags a foe in       -> Pike: Harpoon, Maul: Derby
//    ember flask sets a foe alight   -> Maul: Forge Strike, Bow: Cinder Rain
//    smoke pellet blinds a foe       -> any blade: Ash Dance
//    a launcher puts a foe in the air-> Rattlechain: Juggler, Pike/Blade: Skyhunt
// ============================================================
MOVESETS.chuks = {
  idle: 1.25, title: 'RATTLECHAIN',
  map: { rip: 'bell_toll', dash: 'ghost_lash', aD: 'meteor_whip', aU: 'updraft_crack', aChain: ['air_snap', 'air_wheel'], near: 'figure_eight', back: 'parting_crack', far: 'slide_lash', up: 'halo', upf: 'rising_whip', down: 'ankle_whip', chain: ['snap', 'snap2', 'rattle', 'chain_break'], haD: 'hammer_fall', haU: 'helicopter', ha: 'comet_chain', hDown: 'whirlwind', hBack: 'mule_kick', hUp: 'skyward_crack', hFwd: 'chain_spear', h: 'thunderclap' },
  moves: {
    snap: mv('Snap', 'L', 'LMB', { from: -95, to: 50, wind: 2, act: 3, rec: 7, dmg: .8, kb: [.9, -.4], step: 1.1 }),
    snap2: mv('Return Snap', 'L', 'LMB, LMB', { from: 70, to: -80, wind: 2, act: 3, rec: 7, dmg: .8, kb: [.9, -.6], step: 1.1 }),
    rattle: mv('Rattle', 'L', 'LMB x3', { kind: 'thrust', lo: -20, hi: 20, wind: 2, act: 12, rec: 9, dmg: .45, kb: [.4, -.2], multi: 3, pump: 4, step: .8, reach: 1.1 }),
    chain_break: mv('Chain Breaker', 'L', 'LMB x4', { from: -170, to: 110, wind: 5, act: 6, rec: 15, dmg: 1.6, kb: [3.4, -1.8], step: 2, stop: 5, shake: 3, big: 1, reach: 1.15 }),
    rising_whip: mv('Rising Whip', 'L', 'LMB, aim diagonal up', { from: 80, to: -120, center: -40, wind: 3, act: 5, rec: 11, dmg: 1, kb: [.8, -3.6], hop: -2.2, launch: 1 }),
    halo: mv('Halo', 'L', 'LMB, aim straight up', { kind: 'spin', heli: 1, turns: 2, wind: 3, act: 12, rec: 9, dmg: .5, kb: [.4, -2.6], multi: 4, ctrl: .8 }),
    ankle_whip: mv('Ankle Whip', 'L', 'LMB + S, or aim straight down', { from: 150, to: 15, aimed: 0, wind: 3, act: 5, rec: 10, dmg: .8, kb: [.5, -2.2], stagger: 55, crouch: 3 }),
    slide_lash: mv('Slide Lash', 'L', 'LMB + forward key, cursor far', { kind: 'thrust', lo: -15, hi: 15, wind: 3, act: 9, rec: 11, dmg: 1.2, kb: [2.4, -.8], reach: 1.35, dash: { v: 4.6, t: 9, fixed: 1 }, crouch: 2, stop: 3 }),
    parting_crack: mv('Parting Crack', 'L', 'LMB + back key', { from: -60, to: 90, wind: 2, act: 4, rec: 10, dmg: .9, kb: [2.6, -.6], back: 3, hop: -1.8, iframe: 8 }),
    figure_eight: mv('Figure Eight', 'L', 'LMB, cursor on yourself', { kind: 'spin', turns: 2, wind: 2, act: 12, rec: 9, dmg: .5, kb: [1.4, -.8], multi: 4, ctrl: .8 }),
    thunderclap: mv('Thunderclap', 'H', 'RMB', { from: -175, to: 95, wind: 9, act: 6, rec: 16, dmg: 2, kb: [2.6, 2], step: 1.4, cost: 12, stop: 6, shake: 4, big: 1, charge: { min: 20, max: 56, into: 'stormbells' } }),
    stormbells: mv('Storm of Bells', 'H', 'hold RMB, then release', { kind: 'thrust', lo: -25, hi: 25, wind: 9, act: 24, rec: 16, dmg: .5, kb: [.5, -.3], multi: 2, pump: 10, dash: { v: 1.4, t: 24, fixed: 1 }, stop: 1, big: 1, reach: 1.2 }),
    skyward_crack: mv('Skyward Crack', 'H', 'RMB, aim up', { from: 110, to: -130, center: -45, aimed: 25, wind: 7, act: 5, rec: 14, dmg: 1.5, kb: [.5, -5.4], rise: -4.4, launch: 1, cost: 12, stop: 4, big: 1 }),
    chain_spear: mv('Chain Spear', 'H', 'RMB + forward key', { kind: 'thrust', lo: -25, hi: 25, wind: 7, act: 7, rec: 15, dmg: 1.5, kb: [-2.6, -1.2], reach: 2.1, cost: 10, stop: 4, shake: 2 }),
    whirlwind: mv('Whirlwind', 'H', 'RMB + S, or cursor on yourself', { kind: 'spin', wheel: 1, turns: 3, wind: 5, act: 22, rec: 12, dmg: .55, kb: [1.8, -1.2], multi: 4, cost: 14, ctrl: .85, reach: 1.15 }),
    mule_kick: mv('Mule Kick', 'H', 'RMB + back key', { kind: 'kick', wind: 4, act: 5, rec: 12, dmg: .7, kb: [5.4, -1.8], stagger: 60, cost: 8, stop: 5, shake: 3, blunt: 1 }),
    air_snap: mv('Sky Snap', 'L', 'LMB in the air', { from: -100, to: 55, wind: 2, act: 3, rec: 7, dmg: .85, kb: [.9, -.8], float: 1 }),
    air_wheel: mv('Bell Wheel', 'L', 'LMB, LMB in the air', { kind: 'flip', turns: 2, wind: 2, act: 10, rec: 8, dmg: .6, kb: [1.2, -1.4], float: 1, multi: 4 }),
    updraft_crack: mv('Updraft Crack', 'L', 'LMB in the air, aim up', { from: 90, to: -130, center: -60, aimed: 25, wind: 2, act: 5, rec: 11, dmg: 1, kb: [.4, -3.6], rise: -3.6, launch: 1 }),
    meteor_whip: mv('Meteor Whip', 'L', 'LMB in the air + S, or aim down', { kind: 'thrust', lo: 60, hi: 90, wind: 2, act: 16, rec: 8, dmg: 1.1, kb: [0, 1.8], pogo: 1, fall: 3.6, endOnLand: 1 }),
    comet_chain: mv('Comet Chain', 'H', 'RMB in the air', { from: -120, to: 90, aimed: 0, wind: 5, act: 10, rec: 13, dmg: 1.5, kb: [2.6, 2.2], dash: { v: 3.8, t: 10, vy: 3.4 }, cost: 12, endOnLand: 1, stop: 5, shake: 3, big: 1 }),
    helicopter: mv('Helicopter', 'H', 'RMB in the air, aim up', { kind: 'spin', heli: 1, turns: 4, wind: 4, act: 26, rec: 10, dmg: .45, kb: [1.2, -1.8], multi: 4, hover: 1, cost: 14, ctrl: .9 }),
    hammer_fall: mv('Hammer Fall', 'H', 'RMB in the air + S, or aim down', { kind: 'plunge', wind: 8, act: 99, rec: 18, dmg: 1.3, kb: [1.4, 2], cost: 14, landShock: { r: 30, dmg: 1.8, kb: [3, -3.6] }, stop: 6, shake: 6, big: 1 }),
    ghost_lash: mv('Ghost Lash', 'L', 'attack while dodging', { from: -40, to: 40, aimed: 0, wind: 1, act: 7, rec: 10, dmg: .7, kb: [.6, -1.1], multi: 3, dash: { v: 4.4, t: 7 }, iframe: 8, wide: 1 }),
    bell_toll: mv('Bell Toll', 'L', 'attack after a perfect dodge', { from: -170, to: 120, wind: 1, act: 6, rec: 13, dmg: 2.9, kb: [4.4, -2.4], step: 3, stop: 8, shake: 6, crit: 1, big: 1 })
  }
};
{ const s = MOVESETS.chuks, M = s.map, mm = s.moves, into = id => mm[id].charge ? [id, mm[id].charge.into] : [id]; s.sections = [['GROUND - LIGHT', [...M.chain, M.upf, M.up, M.down, M.far, M.back, M.near]], ['GROUND - HEAVY', [...into(M.h), M.hUp, M.hFwd, M.hDown, M.hBack]], ['AIRBORNE', [...M.aChain, M.aU, M.aD, M.ha, M.haU, M.haD]], ['SPECIAL', [M.dash, M.rip]]]; }

// ---------------- states ----------------
const stOf = e => e.st || (e.st = { pin: 0, hook: 0, reel: 0, burn: 0, blind: 0, launched: 0, held: 0, lk: 0, stag: 0 });
const heavyFoe = e => !!(e.type === 'boss' || e.type === 'fist' || e.isBoss || e.heavy);
function stActive(e, k) { const s = e.st; if (!s) return false; if (k === 'pin') return s.pin > 0 && !s.pinGo; if (k === 'launched') return s.launched > 0 && !e.onGround; return s[k] > 0; }
// a star carries its foe up to three tiles to the nearest wall in its flight, or nails it to the floor
function findPinSpot(e, d) {
  for (let dx = 0; dx <= 30; dx += 2) {
    const x = d > 0 ? e.x + e.w + dx : e.x - dx;
    for (const fy of [.35, .7]) { const tx = floor(x / T), ty = floor((e.y + e.h * fy) / T); if (solidAt(tx, ty) && !platAt(tx, ty)) return { x: d > 0 ? tx * T - e.w - .02 : (tx + 1) * T + .02, y: e.y, side: d }; }
  }
  return null;
}
function applyStatus(e, k, by, o = {}) {
  if (e.dead || e.noHit) return false; const s = stOf(e), pvp = !!(e.fighter && by && by.fighter);
  if (e.ghost) { netStatusGhost(e, k, o); return true; }
  if (e.remote && (e.coop || e.ghostH)) { if (e.coop && netHost()) { const P = COOP.peers.get(e.peer); if (P && P.ok) sendTo(P, { t: 'hurt', dmg: 0, st: k }); } return true; }
  if (e.remote) { netHit(e, 0, 0, 0, false, [k, o.d || 0, o.side || 0], by); return true; }
  if ((k === 'pin' || k === 'hook') && heavyFoe(e)) { s.stag = 30; return false; }
  if (k === 'pin') {
    let spot = o.side ? findPinSpot(e, o.side) : null;
    if (!spot && o.floor && (e.onGround || e.fly)) spot = { x: e.x, y: e.y, side: 0 };
    if (!spot) return false;
    s.pin = o.d || (pvp ? (WORLD.arena ? 70 : 90) : e.fighter ? 120 : 175); s.pinS = spot.side; s.pinGo = { x: spot.x, y: spot.y }; s.pinBy = by; s.hook = s.reel = 0;
    if (e.fighter) { if (e.atk) endAttack(e); e.state = 'normal'; }
  } else if (k === 'hook') { s.reel = 14; s.hook = pvp ? 40 : 60; s.hookBy = by; s.pin = 0; if (e.fighter) { if (e.atk) endAttack(e); e.state = 'normal'; } }
  else if (k === 'burn') { if (liqAt(e.x + e.w / 2, e.y + e.h - 2) === 1 || e.fireproof || (e === G.p && G.flags.e3)) return false; s.burn = max(s.burn, o.d || 200); s.burnBy = by; }
  else if (k === 'blind') { if (e.type === 'hollow') return false; s.blind = max(s.blind, o.d || 160); }
  else if (k === 'launched') s.launched = max(s.launched, o.d || 50);
  else if (k === 'poison' || k === 'bleed') { if (e === G.p && e.ward > 0) return false; if (k === 'poison' && (e.type === 'golem' || e.type === 'mote' || e.type === 'cinderling')) return false; s[k] = max(s[k] || 0, o.d || 240); s[k + 'By'] = by; }
  else if (k === 'frost') { if (e.fireproof && e.type !== 'golem') { s.burn = 0; } s.frost = max(s.frost || 0, o.d || 100); s.burn = 0; }
  return true;
}
// poison and bleeding hurt over time; bleeding hurts more while the victim moves
function dotTick(e, n, col) {
  if (e.fighter) { if (e.remote) return; e.hp -= n; e.flash = 2; e.regenT = 0; numPop(e.x + 3, e.y - 2, n, col); if (e.hp <= 0) { if (e.yieldAt) { e.hp = 1; e.yieldAt(e); } else killFighter(e, null); } }
  else damageEnemy(e, n, 0, 0, { dot: 1 });
}
function burnTick(e, s) {
  if (e.fighter) { if (e.remote) return; e.hp -= 2; e.flash = 3; e.regenT = 0; numPop(e.x + 3, e.y - 2, 2, '#ff9a3d'); if (e.hp <= 0) { if (e.yieldAt) { e.hp = 1; e.yieldAt(e); } else killFighter(e, s.burnBy); } }
  else damageEnemy(e, 3, 0, 0, { dot: 1 });
}
// returns true while the state holds the body still (its own AI and input are skipped)
function tickStatus(e) {
  const s = e.st; if (!s) return false;
  if (s.lk > 0) s.lk--; if (s.stag > 0) s.stag--;
  if (s.launched > 0) { s.launched--; if (e.onGround && s.launched < 44) s.launched = 0; }
  if (s.burn > 0) {
    s.burn--; if (G.time % 5 === 0) P(e.x + frand(e.w), e.y + e.h * frand(.15, .9), frand(-.2, .2), frand(-1.2, -.5), 18, fpick(['#ff7a2a', '#ffd35a', '#e2542b']), { glow: 1, g: -.03 });
    if (s.burn % 24 === 12 && !e.dead) burnTick(e, s);
    if (liqAt(e.x + e.w / 2, e.y + e.h - 3) === 1) { s.burn = 0; for (let i = 0; i < 8; i++) P(e.x + e.w / 2, e.y + 4, frand(-.6, .6), frand(-1.4, -.4), 40, '#d8d4e6', { g: -.01 }); }
  }
  if (s.poison > 0) { s.poison--; if (s.poison % 40 === 20 && !e.dead) dotTick(e, e.fighter ? 2 : 3, '#9a5ad0'); if (G.time % 9 === 0) P(e.x + frand(e.w), e.y + frand(e.h), 0, -.4, 18, fpick(['#9a5ad0', '#c9a0e0']), { g: -.01 }); }
  if (s.bleed > 0) { s.bleed--; const mv = abs(e.vx) > .5 ? 2 : 1; if ((s.bleed % 30) === 15 && !e.dead) dotTick(e, (e.fighter ? 1 : 2) * mv, '#e2483b'); if (G.time % 6 === 0) P(e.x + e.w / 2 + frand(-2, 2), e.y + e.h * .4, frand(-.3, .3), .2, 24, '#c93a2a', { g: .12 }); }
  if (s.frost > 0) { s.frost--; if (G.time % 7 === 0) P(e.x + frand(e.w), e.y + frand(e.h), 0, -.2, 22, fpick(FROST), { g: 0 }); }
  if (s.blind > 0) { s.blind--; if (G.time % 7 === 0) P(e.x + e.w / 2 + frand(-5, 5), e.y + frand(-2, 4), frand(-.3, .3), -.25, 34, fpick(['#5f5a69', '#8d8794', '#3f3a4c']), { g: -.008, fr: .97 }); }
  if (s.held > 0) { if (e.heldT > 0 && --e.heldT <= 0) { s.held = 0; if (G.link && G.link.e === e && !G.link.L) { G.link = null; G.zoomT = 1; } } e.vx = e.vy = 0; return true; }
  if (s.reel > 0) {
    s.reel--; const by = s.hookBy;
    if (!by || by.dead) s.reel = 0; else { const tx = by.x + 3 + by.face * 13 - e.w / 2, ty = by.y + by.h - e.h; e.vx = (tx - e.x) * .32; e.vy = (ty - e.y) * .32; const cs = e.canStep; e.canStep = false; moveBody(e); e.canStep = cs; }
    if (s.reel <= 0) { e.vx = e.vy = 0; } return true;
  }
  if (s.hook > 0) { s.hook--; e.vx *= .6; e.vy = min(e.vy + .25, 4); if (!e.fly) moveBody(e); if (G.time % 6 === 0) P(e.x + e.w / 2 + frand(-4, 4), e.y - 3, 0, -.4, 20, '#fff1a8', { glow: 1, g: 0 }); return true; }
  if (s.pin > 0) {
    if (s.pinGo) { e.x = lerp(e.x, s.pinGo.x, .5); e.y = lerp(e.y, s.pinGo.y, .5); if (abs(e.x - s.pinGo.x) < .8 && abs(e.y - s.pinGo.y) < .8) { e.x = s.pinGo.x; e.y = s.pinGo.y; s.pinGo = null; dust(e.x + e.w / 2 + s.pinS * e.w / 2, e.y + e.h * .4, 6, '#b9bdd0', 1.2); sparks(e.x + e.w / 2 + s.pinS * e.w / 2, e.y + e.h * .4, 6, -s.pinS, 1.6); if (near(e)) { sfx('brk', 30); addShake(2); } } }
    else { s.pin--; if (e === G.p && (pressed.KeyA || pressed.KeyD || pressed.Space || pressed.KeyW)) s.pin = max(0, s.pin - 7); if (s.pin <= 0) sparks(e.x + e.w / 2 + s.pinS * 3, e.y + e.h * .4, 5, -s.pinS, 1.4, ['#e8edf2', '#aab3c2']); }
    e.vx = e.vy = 0; return true;
  }
  return false;
}

// ---------------- sidearms ----------------
const ARMS = ['shuriken', 'hook', 'flask', 'smoke'];
function armsOwned(f) { if (!f.isPlayer) return f.arms || []; if ((WORLD.arena && !WORLD.royale) || WORLD.mode === 1) return ARMS; return ARMS.filter(id => countItem(id) > 0); }
function curArm(f) { const own = armsOwned(f); if (!own.length) return null; if (!own.includes(f.arm)) f.arm = own[0]; return f.arm; }
function cycleArm(f) { const own = armsOwned(f); if (!own.length) { sfx('deny'); return; } f.arm = own[(own.indexOf(f.arm) + 1) % own.length]; G.armT = 100; sfx('ui'); }
function throwArm(f, wx, wy) {
  const id = curArm(f); if (!id) { if (f === G.p) { sfx('deny'); G.armT = 100; } return false; }
  if (f.armCd > 0 || f.state === 'dodge' || f.state === 'link' || f.hurtT > 0 || (f.state === 'attack' && f.atk && f.atk.phase < 2) || (f.st && (f.st.pin || f.st.held || f.st.reel || f.st.hook))) return false;
  if (f.state === 'attack') endAttack(f);
  const cx = f.x + 3, cy = f.y + 7, dx = wx - cx, dy = wy - cy, d = hypot(dx, dy) || 1, ang = atan2(dy, dx);
  f.face = sign(dx) || f.face; f.throwT = 12; f.throwA = atan2(dy, abs(dx));
  if (f.isPlayer && !(WORLD.arena && !WORLD.royale) && WORLD.mode !== 1 && id !== 'hook') removeItem(id, 1);
  const base = { arm: 1, owner: f, x: cx + cos(ang) * 5, y: cy + sin(ang) * 5, kb: [.6, -.4], hits: new Set() };
  if (id === 'shuriken') { spawnProj(Object.assign(base, { type: 'star', vx: cos(ang) * 7.6, vy: sin(ang) * 7.6, g: .015, r: 3, dmg: 4, life: 60 })); f.armCd = 16; fsx(f, 'swing2', 0); }
  else if (id === 'hook') { spawnProj(Object.assign(base, { type: 'hook', vx: cos(ang) * 8.6, vy: sin(ang) * 8.6, g: 0, r: 3, dmg: 3, life: 21 })); f.armCd = 32; fsx(f, 'thrust', 0); }
  else { const v = min(6.4, 2.6 + d * .028); spawnProj(Object.assign(base, { type: id === 'flask' ? 'flask' : 'pellet', vx: cos(ang) * v, vy: sin(ang) * v - 1.7, g: .17, r: 3, dmg: id === 'flask' ? 6 : 0, life: 140 })); f.armCd = 26; fsx(f, 'swing', 0); }
  if (f === G.p) { G.flags['threw_' + id] = true; G.armT = 100; } return true;
}
function armFoeAt(pr) { const ow = pr.owner; for (const e of foesOf(ow)) { if (e.dead || e.noHit || pr.hits.has(e.root || e)) continue; if (circBox(pr.x, pr.y, pr.r + 1, e)) return e; } return null; }
function tickArm(pr) {
  pr.px = pr.x; pr.py = pr.y; pr.t++; pr.vy += pr.g; pr.spin = (pr.spin || 0) + .55;
  for (let s = 0; s < 2; s++) {
    pr.x += pr.vx / 2; pr.y += pr.vy / 2; const tx = floor(pr.x / T), ty = floor(pr.y / T);
    if (liqAt(pr.x, pr.y) && pr.type !== 'star' && pr.type !== 'hook') { if (pr.type === 'flask' && liqAt(pr.x, pr.y) === 1) { for (let i = 0; i < 8; i++) P(pr.x, pr.y, frand(-.8, .8), frand(-1.5, -.5), 30, '#d8d4e6', { g: -.01 }); return true; } return armBurst(pr); }
    if (solidAt(tx, ty) && !platAt(tx, ty)) return armWall(pr);
    if (pr.ghost) { for (const f of G.fighters) if (f !== pr.owner && !f.dead && circBox(pr.x, pr.y, pr.r, f)) return pr.type === 'flask' || pr.type === 'pellet' ? armBurst(pr) : true; }
    else { const e = armFoeAt(pr); if (e) return armHit(pr, e); }
  }
  if (pr.type === 'flask' && pr.t % 2 === 0) P(pr.x, pr.y, frand(-.2, .2), -.2, 10, fpick(SPARK), { glow: 1, g: 0 });
  if (--pr.life <= 0) return pr.type === 'flask' || pr.type === 'pellet' ? armBurst(pr) : true;
  return false;
}
function armHit(pr, e) {
  const ow = pr.owner, d = sign(pr.vx) || ow.face; pr.hits.add(e.root || e);
  if (pr.type === 'star') {
    if (pr.ghost) return true;
    strike(ow, e, pr.dmg, d * .4, -.2, { stop: 3, shake: 1, hx: pr.x, hy: pr.y });
    if (!e.dead && applyStatus(e, 'pin', ow, { side: abs(pr.vx) > abs(pr.vy) * .4 ? d : 0, floor: pr.vy > 2 })) { if (ow === G.p) { numPop(e.x + e.w / 2, e.y - 10, 'PINNED', '#e8edf2'); G.hitstop = max(G.hitstop, 4); } fsx(ow, 'crit', 0); }
    return true;
  }
  if (pr.type === 'hook') {
    if (pr.ghost) return true;
    if (heavyFoe(e)) { if (ow.fighter) ow.grap = { x: e.x + e.w / 2, y: e.y + e.h / 2, t: 26, foe: e }; fsx(ow, 'reflect', 0); return true; }
    strike(ow, e, pr.dmg, 0, 0, { stop: 2, shake: 1, hx: pr.x, hy: pr.y }); if (!e.dead && applyStatus(e, 'hook', ow)) { if (ow === G.p) numPop(e.x + e.w / 2, e.y - 10, 'HOOKED', '#fff1a8'); fsx(ow, 'reflect', 0); }
    return true;
  }
  return armBurst(pr);
}
function armWall(pr) {
  const bx = pr.x - pr.vx * .5, by = pr.y - pr.vy * .5, ow = pr.owner;
  if (pr.type === 'star') { G.stuck.push({ x: bx, y: by, a: pr.spin || 0, life: 360 }); sparks(bx, by, 3, 0, 1.2, ['#e8edf2', '#aab3c2']); fsx(ow, 'mine', 0); if (ow === G.p && !pr.ghost && !WORLD.arena && WORLD.mode !== 1 && Math.random() < .65) spawnDrop('shuriken', 1, bx, by, 0, 0); return true; }
  if (pr.type === 'hook') { if (!pr.ghost && ow && ow.fighter && !ow.dead) { ow.grap = { x: bx, y: by, t: 30 }; fsx(ow, 'mine', 0); sparks(bx, by, 5, 0, 1.4, ['#e8edf2', '#fff1a8']); } return true; }
  pr.x = bx; pr.y = by; return armBurst(pr);
}
function armBurst(pr) {
  const ow = pr.owner, x = pr.x, y = pr.y;
  if (pr.type === 'flask') {
    burst(x, y, 24, ['#ff7a2a', '#ffd35a', '#e2542b', '#fff1a8'], 2.6, 30, { glow: 1, g: .04 }); sfx('boom', 40); if (near(ow)) addShake(2.5);
    G.trails.push({ kind: 'ring', x, y: y + 2, r: 22, life: 10, max: 10 });
    if (!pr.ghost) for (const e of foesOf(ow)) if (!e.dead && !e.noHit && circBox(x, y, 22, e)) { strike(ow, e, pr.dmg, (sign(e.x + e.w / 2 - x) || 1) * 1.4, -1.6, { stop: 3, shake: 1, hx: e.x + e.w / 2, hy: e.y + e.h / 2 }); applyStatus(e, 'burn', ow); }
    let gy = floor(y / T); for (let k = 0; k < 7 && !solidAt(floor(x / T), gy + 1); k++) gy++;
    if (solidAt(floor(x / T), gy + 1) && !liqAt(x, gy * T + 4)) G.fires.push({ x0: x - 18, x1: x + 18, y: (gy + 1) * T, life: 260, max: 260, by: ow, ghost: !!pr.ghost });
  } else if (pr.type === 'pellet') {
    for (let i = 0; i < 26; i++) { const a = frand(TAU), v = frand(.4, 1.8); P(x, y, cos(a) * v, sin(a) * v * .7, frand(30, 60) | 0, fpick(['#8d8794', '#a19baa', '#726c7c', '#d6d0dc']), { g: -.01, fr: .9 }); }
    sfx('dodge', 40); G.smokes.push({ x, y: y - 6, r: 38, life: 320, max: 320, by: ow, ghost: !!pr.ghost });
    if (!pr.ghost) for (const e of foesOf(ow)) if (!e.dead && !e.noHit && circBox(x, y - 6, 38, e)) applyStatus(e, 'blind', ow);
  }
  return true;
}
function tickArmsWorld() {
  for (let i = G.fires.length - 1; i >= 0; i--) {
    const f = G.fires[i]; if (--f.life <= 0) { G.fires.splice(i, 1); continue; }
    if (G.time % 3 === 0) P(frand(f.x0, f.x1), f.y - 1, frand(-.2, .2), frand(-1.4, -.6), 16, fpick(['#ff7a2a', '#ffd35a', '#e2542b']), { glow: 1, g: -.02 });
    if (!f.ghost && G.time % 10 === 0) { const by = f.by; for (const e of (by && by.fighter ? foesOf(by) : G.fighters.filter(q => q.team === 'p' && !q.remote))) if (!e.dead && !e.noHit && e.x + e.w > f.x0 && e.x < f.x1 && abs(e.y + e.h - f.y) < 7) applyStatus(e, 'burn', by, { d: 120 }); }
  }
  for (let i = G.smokes.length - 1; i >= 0; i--) {
    const s = G.smokes[i]; if (--s.life <= 0) { G.smokes.splice(i, 1); continue; }
    if (!s.ghost && G.time % 12 === 0) { const by = s.by, k = s.life / s.max; for (const e of foesOf(by)) if (!e.dead && !e.noHit && circBox(s.x, s.y, s.r * (.5 + .5 * k), e)) applyStatus(e, 'blind', by, { d: 70 }); if (by && !by.dead && circBox(s.x, s.y, s.r * .8, by)) by.veil = 14; }
  }
  for (let i = G.stuck.length - 1; i >= 0; i--) if (--G.stuck[i].life <= 0) G.stuck.splice(i, 1);
}
// the hook pulls its thrower to where it bit
function tickGrapple(f) {
  const g = f.grap; if (!g) return false;
  if (--g.t <= 0 || f.dead || f.hurtT > 0 || f.state === 'link') { f.grap = null; return false; }
  if (g.foe && !g.foe.dead) { g.x = g.foe.x + g.foe.w / 2; g.y = g.foe.y + g.foe.h / 2; }
  const dx = g.x - (f.x + 3), dy = g.y - (f.y + 8), d = hypot(dx, dy);
  if (d < 12 || (f.hitWall && abs(dx) > abs(dy)) || (f.hitCeil && dy < 0)) { f.grap = null; f.vy = min(f.vy, -2.4); f.vx *= .4; f.airDash = airDashMax(f); f.dblUsed = false; return false; }
  const v = min(6.6, 2.5 + g.t * .3); f.vx = dx / d * v; f.vy = dy / d * v; f.onGround = false; f.noCut = true; if (G.time % 2 === 0) f.ghostReq = true;
  return true;
}

// ---------------- LINKS ----------------
// a step names a form from the attacker's own moveset ('$c0' = first light chain form, '$h' = heavy, ...), how long it lasts,
// where the attacker stands (x: in front of the foe, y: above its feet), and what the blow does.
const LINKS = {
  pin_pummel: { name: 'Pin and Pummel', sets: ['chuks'], st: 'pin', btn: 'L', hint: 'Star Knife a foe to a wall, then Rattlechain.', end: [-1.4, -5.6],
    steps: [{ m: 'snap', t: 6, x: 11, hit: .5 }, { m: 'snap2', t: 6, x: 11, hit: .5 }, { m: 'snap', t: 5, x: 10, hit: .5 }, { m: 'snap2', t: 5, x: 10, hit: .5 }, { m: 'rattle', t: 16, x: 10, hit: .3, multi: 4, zoom: 1.5 }, { m: 'rising_whip', t: 16, x: 12, hit: 2, final: 1, slow: 18, fx: 'tear' }] },
  nail_driver: { name: 'Nail Driver', sets: ['maul'], st: 'pin', btn: 'L', hint: 'Star Knife a foe to a wall, then Maul.', end: [1.5, 1.5],
    steps: [{ m: 'swat', t: 15, x: 15, hit: 1, shake: 4 }, { m: 'backswing', t: 15, x: 15, hit: 1, shake: 4 }, { m: 'crater', t: 24, x: 16, hit: 2.4, final: 1, slow: 20, zoom: 1.5, fx: 'crack' }] },
  wall_skewer: { name: 'Wall Skewer', sets: ['spear'], st: 'pin', btn: 'L', hint: 'Star Knife a foe to a wall, then Pike.', end: [-4.2, -3.2],
    steps: [{ m: 'jab', t: 8, x: 21, hit: .6 }, { m: 'skewer', t: 20, x: 19, hit: 1.6, zoom: 1.45, fx: 'impale' }, { m: 'shove', t: 14, x: 17, hit: 1.2, final: 1, slow: 14 }] },
  cross_cut: { name: 'Cross Cut', sets: ['sword', 'fangs'], st: 'pin', btn: 'L', hint: 'Star Knife a foe to a wall, then a blade.', end: [-2.2, -4.8],
    steps: [{ m: '$c0', t: 7, x: 12, hit: .8 }, { m: '$c1', t: 7, x: 12, hit: .8 }, { m: '$h', t: 18, x: 13, hit: 2.2, final: 1, slow: 16, zoom: 1.45 }] },
  quiver_nail: { name: 'Quiver Nail', sets: ['bow'], st: 'pin', btn: 'L', hint: 'Star Knife a foe to a wall, then Dawnstring.', end: [3, -1], stay: 1, rx: 150, ry: 70,
    steps: [{ m: 'loose', t: 8, hit: .8, fx: 'arrow' }, { m: 'double_loose', t: 12, hit: .6, multi: 4, fx: 'arrow' }, { m: 'power_draw', t: 20, hit: 2.4, final: 1, slow: 14, fx: 'arrow', zoom: 1.25 }] },
  tether_flail: { name: 'Tether Flail', sets: ['chuks'], st: 'hook', btn: 'L', hint: 'Chain Hook a foe, then Rattlechain.', end: [4.2, -2.6],
    steps: [{ m: 'figure_eight', t: 32, x: 0, hit: .4, multi: 6, orbit: 2, zoom: 1.35 }, { m: 'thunderclap', t: 18, x: 14, hit: 2, final: 1, slow: 14, tgt: [16, 'ground'] }] },
  harpoon: { name: 'Harpoon', sets: ['spear'], st: 'hook', btn: 'L', hint: 'Chain Hook a foe, then Pike.', end: [2.6, 1.6],
    steps: [{ m: 'skewer', t: 12, x: 17, hit: 1.2, fx: 'impale' }, { m: 'sky_lance', t: 18, x: 4, hit: .5, carry: [6, -26], zoom: 1.4 }, { m: 'crescent', t: 18, x: 13, hit: 2, final: 1, slow: 16, tgt: [16, 'ground'] }] },
  derby: { name: 'Derby', sets: ['maul'], st: 'hook', btn: 'L', hint: 'Chain Hook a foe, then Maul.', end: [7.2, -6.4],
    steps: [{ m: 'haft_jab', t: 9, x: 10, hit: .5 }, { m: 'homerun', t: 24, x: 14, hit: 2.6, final: 1, slow: 22, zoom: 1.5, fx: 'homerun' }] },
  reel_cut: { name: 'Reel and Cut', sets: ['sword', 'fangs'], st: 'hook', btn: 'L', hint: 'Chain Hook a foe, then a blade.', end: [-3.6, -2.4],
    steps: [{ m: '$dash', t: 10, x: -14, hit: 1.2, zoom: 1.4 }, { m: '$c1', t: 8, x: -12, hit: .8 }, { m: '$rip', t: 18, x: -13, hit: 2.2, final: 1, slow: 16 }] },
  kindling: { name: 'Kindling', sets: ['sword', 'fangs', 'chuks'], st: 'burn', btn: 'L', hint: 'Set a foe alight, then a blade or Rattlechain.', end: [3.8, -2.8],
    steps: [{ m: '$c0', t: 7, x: 12, hit: .7, fx: 'flare' }, { m: '$c1', t: 7, x: 12, hit: .7, fx: 'flare' }, { m: '$hDown', t: 22, x: 8, hit: .45, multi: 4, fx: 'flare', zoom: 1.35 }, { m: '$h', t: 16, x: 12, hit: 1.6, final: 1, slow: 14, fx: 'blaze' }] },
  forge_strike: { name: 'Forge Strike', sets: ['maul'], st: 'burn', btn: 'L', hint: 'Set a foe alight, then Maul.', end: [3, 2.2],
    steps: [{ m: 'pillar', t: 14, x: 12, hit: 1, tgt: [0, -20] }, { m: 'earthsplitter', t: 24, x: 14, hit: 2.8, final: 1, slow: 20, zoom: 1.5, fx: 'forge', tgt: [2, 'ground'] }] },
  cinder_rain: { name: 'Cinder Rain', sets: ['bow'], st: 'burn', btn: 'L', hint: 'Set a foe alight, then Dawnstring.', end: [2.4, -1.4], stay: 1, rx: 150, ry: 70,
    steps: [{ m: 'skyfall', t: 30, hit: .4, multi: 5, fx: 'rain', zoom: 1.25 }, { m: 'longshot', t: 18, hit: 2.2, final: 1, slow: 14, fx: 'arrow' }] },
  ash_dance: { name: 'Ash Dance', sets: ['sword', 'spear', 'fangs', 'maul', 'chuks'], st: 'blind', btn: 'L', hint: 'Blind a foe with smoke, then any close weapon.', end: [3.4, -3.8],
    steps: [{ m: '$c0', t: 9, x: -13, hit: .9, blink: 1 }, { m: '$c1', t: 9, x: 13, hit: .9, blink: 1 }, { m: '$aD', t: 10, x: 2, y: 22, hit: .9, blink: 1 }, { m: '$h', t: 18, x: -13, hit: 2.2, final: 1, slow: 18, zoom: 1.45, blink: 1 }] },
  skyhunt: { name: 'Skyhunt', sets: ['spear', 'sword'], st: 'launched', btn: 'H', hint: 'Launch a foe, then RMB with Pike or a blade.', end: [1.6, 4.2], rx: 72, ry: 70,
    steps: [{ m: '$aU', t: 10, x: 10, hit: 1, tgt: [0, -16] }, { m: '$ac0', t: 8, x: 10, hit: .8 }, { m: '$ac1', t: 11, x: 10, hit: .9 }, { m: '$haD', t: 20, x: 8, hit: 2.4, final: 1, slow: 16, zoom: 1.45, tgt: [6, 'ground'], fx: 'quake' }] },
  juggler: { name: 'Juggler', sets: ['chuks'], st: 'launched', btn: 'H', hint: 'Launch a foe, then RMB with the Rattlechain.', end: [1.6, 3.6], rx: 72, ry: 70,
    steps: [{ m: 'air_snap', t: 6, x: 10, hit: .6, tgt: [2, -8] }, { m: 'air_wheel', t: 12, x: 9, hit: .4, multi: 4, tgt: [4, -18] }, { m: 'updraft_crack', t: 10, x: 10, hit: .9, tgt: [6, -28] }, { m: 'helicopter', t: 16, x: 8, hit: .35, multi: 4, zoom: 1.4 }, { m: 'hammer_fall', t: 18, x: 6, hit: 2.2, final: 1, slow: 16, tgt: [10, 'ground'], fx: 'quake' }] }
};
const LINK_ORDER = Object.keys(LINKS);
const linkDur = L => L.steps.reduce((s, st) => s + st.t, 0) + 6;
function linkMove(set, ref) {
  const M = set.map; if (ref[0] !== '$') return set.moves[ref] ? ref : M.chain[0];
  const k = ref.slice(1), v = k === 'c0' ? M.chain[0] : k === 'c1' ? M.chain[1] : k === 'ac0' ? M.aChain[0] : k === 'ac1' ? M.aChain[1] : M[k];
  return set.moves[v] ? v : M.chain[0];
}
function findLink(f, btn) {
  const W = heldOf(f); if (!W || W.type !== 'weapon' || f.st && (f.st.held || f.st.pin)) return null; let best = null, bd = 1e9;
  for (const e of foesOf(f)) {
    if (e.dead || e.noHit || !e.st || e.st.held || e.st.lk > 0 || e.yielded) continue;
    const dx = e.x + e.w / 2 - (f.x + 3), dy = e.y + e.h - (f.y + f.h);
    for (const id of LINK_ORDER) {
      const L = LINKS[id]; if (L.btn !== btn || !L.sets.includes(W.set) || !stActive(e, L.st)) continue;
      if (heavyFoe(e) && L.st !== 'burn' && L.st !== 'blind') continue;
      if (abs(dx) > (L.rx || 46) || abs(dy) > (L.ry || 30)) continue;
      const d = abs(dx) + abs(dy); if (d < bd) { bd = d; best = { id, e }; } break;
    }
  }
  return best;
}
function startLink(f, id, e) {
  const L = LINKS[id], face = sign(e.x + e.w / 2 - (f.x + 3)) || f.face; if (f.atk) endAttack(f);
  const k = { L, id, f, e, face, i: -1, t: 0, ex0: e.x, ey0: e.y, gy: e.y + e.h };
  f.link = k; f.state = 'link'; f.vx = f.vy = 0; f.buf = null; f.grap = null;
  const s = stOf(e); s.held = 1; s.lk = 0; s.pin = 0; s.hook = 0; s.reel = 0; s.launched = 0; s.pinGo = null; if (e.fighter && e.atk) endAttack(e);
  // the ground under the foe, for slams
  let gy = floor((e.y + e.h) / T); for (let n = 0; n < 40 && !solidAt(floor((e.x + e.w / 2) / T), gy); n++) gy++; k.ground = gy * T;
  if (e.remote) netHit(e, 0, 0, 0, false, ['held', linkDur(L), 0], f);
  if (f === G.p || e === G.p) { G.link = k; G.zoomT = 1.28; }
  if (f === G.p) { const first = !G.linksKnown.has(id); if (first) { G.linksKnown.add(id); G.dirty = true; sfx('newmove', 0); } G.linkBanner = { name: L.name, first, t: 0 }; G.flags.linked = true; }
  fsx(f, 'charged', 0); nextStep(k);
}
function nextStep(k) {
  const f = k.f, e = k.e; k.i++; k.t = 0; const st = k.L.steps[k.i]; if (!st) return endLink(k, false);
  const W = heldOf(f); if (!W || W.type !== 'weapon') return endLink(k, true);
  const set = MOVESETS[W.set], mid = linkMove(set, st.m), m = set.moves[mid];
  k.sx = f.x; k.sy = f.y; k.tx0 = e.x; k.ty0 = e.y; k.hits = 0; k.sface = st.x !== undefined && st.x < 0 ? -k.face : k.face;
  if (st.tgt) { k.tx1 = e.x + st.tgt[0] * k.face; k.ty1 = st.tgt[1] === 'ground' ? k.ground - e.h : e.y + st.tgt[1]; } else { k.tx1 = e.x; k.ty1 = e.y; }
  const a = f.atk = { f, id: mid, m, W, set, setName: W.set, btn: m.btn, phase: 1, pt: 0, face: k.sface, aimA: 0, hits: new Map(), charge: 0, charged: false, hit: false, fresh: true, stale: 1, act: max(3, round(st.t * .55)), dashT: 0, dashN: 0, prevAng: 0, aimOff: 0, th: 0, crit: !!st.final, dist: 0, tx: 0, ty: 0, shots: 0, shotI: 0, link: true };
  setAim(a); a.act = max(3, round(st.t * .55)); a.dashN = 0; a.prevAng = m.kind === 'swing' ? m.from * D2R + a.aimOff : 0;
  if (m.kind === 'thrust' || m.kind === 'shot') { const ang = atan2(e.y + e.h * .5 - (f.y + 7), abs(e.x + e.w / 2 - (f.x + 3))); a.th = clamp(ang, (m.lo === undefined ? -20 : m.lo) * D2R, (m.hi === undefined ? 20 : m.hi) * D2R); }
  f.face = k.sface; noteMove(f, W.set, mid, m, true);
  if (st.blink) { burst(f.x + 3, f.y + 10, 14, ['#8d8794', '#a19baa', '#3f3a4c'], 1.6, 26, { g: -.01 }); fsx(f, 'dodge', 0); }
  if (st.slow && slowOK() && (f === G.p || e === G.p)) G.slowT = max(G.slowT, st.slow);
  if (st.zoom && (f === G.p || e === G.p)) G.zoomT = st.zoom;
  fsx(f, m.kind === 'thrust' ? 'thrust' : (m.kind === 'spin' || m.kind === 'flip') ? 'spin' : m.big ? 'heavy' : (G.time & 1 ? 'swing' : 'swing2'), 0);
}
function tickLink(f) {
  const k = f.link, st = k.L.steps[k.i], e = k.e; if (!st) return endLink(k, false);
  if (e.dead || (!e.remote && !e.st)) return endLink(k, true);
  k.t++; f.iDodge = max(f.iDodge, 2); f.vx = f.vy = 0; f.onGround = false;
  // the foe: moved only where it fits, so a juggle never passes through a ceiling
  const fits = (x, y, b) => !boxHits(x, y, b.w, b.h);
  if (!e.remote) {
    let nx = e.x, ny = e.y;
    if (st.orbit) { const u = k.t / st.t, an = -PI / 2 + u * st.orbit * TAU * k.face, r = 20; nx = f.x + 3 + cos(an) * r - e.w / 2; ny = f.y + 6 + sin(an) * r * .75 - e.h / 2; }
    else if (st.carry) { nx = f.x + 3 + st.carry[0] * k.sface - e.w / 2; ny = f.y + f.h + st.carry[1] - e.h; }
    else { const u = ease.io(min(1, k.t / max(1, st.t * .7))); nx = lerp(k.tx0, k.tx1, u); ny = lerp(k.ty0, k.ty1, u); }
    if (fits(nx, ny, e)) { e.x = nx; e.y = ny; } else if (fits(nx, e.y, e)) e.x = nx; else if (fits(e.x, ny, e)) e.y = ny;
    e.vx = e.vy = 0; if (e.st) e.st.held = 1;
  }
  // the attacker: stands where the step says, or on the near side if the far side is rock
  if (!st.stay && !k.L.stay && !st.orbit && !st.carry) {
    const tcx = e.x + e.w / 2, tfy = e.y + e.h, sx = st.x === undefined ? 12 : st.x, gy = tfy - (st.y || 0) - f.h;
    let gx = tcx - k.face * sx - 3; if (boxHits(gx, gy, f.w, f.h) && sx < 0) { gx = tcx + k.face * sx - 3; k.sface = k.face; }
    if (!boxHits(gx, gy, f.w, f.h)) {
      if (st.blink) { f.x = gx; f.y = gy; } else { const q = ease.out(min(1, k.t / max(2, st.t * .35))), nx = lerp(k.sx, gx, q), ny = lerp(k.sy, gy, q); if (fits(nx, ny, f)) { f.x = nx; f.y = ny; } if (k.t < st.t * .35 && k.t % 2 === 0) f.ghostReq = true; }
    }
  }
  f.face = k.sface;
  // the pose
  const a = f.atk; if (a) { a.pt++; if (a.phase === 1 && a.pt >= a.act) { fadeTrail(a); a.phase = 2; a.pt = 0; } else if (a.phase === 2 && a.pt > a.m.rec - 1) a.pt = a.m.rec - 1; }
  // the blows
  if (st.hit) { const at = max(2, round(st.t * .4)); if (k.t === at || (st.multi && k.t > at && k.hits < st.multi && (k.t - at) % max(2, floor(st.t * .5 / st.multi)) === 0)) linkHit(k, st); }
  if (k.t >= st.t) nextStep(k);
}
function linkHit(k, st) {
  const f = k.f, e = k.e, W = heldOf(f); k.hits++;
  const fin = st.final && k.hits >= (st.multi || 1), dmg = max(1, round(W.dmg * st.hit * (f.dmgMul || 1) * (f === G.p ? 1.1 : 1) * frand(.95, 1.05) * (e.fighter && WORLD.arena ? .85 : 1)));
  const end = fin ? k.L.end : null, kx = end ? end[0] * k.face : 0, ky = end ? end[1] : 0, hx = e.x + e.w / 2, hy = e.y + e.h * .45;
  if (fin && e.st) e.st.held = 0; if (fin && e.remote) netHit(e, 0, 0, 0, false, ['rel', 0, 0], f);
  if (st.fx === 'arrow' || st.fx === 'rain') { const sx = f.x + 3 + f.face * 5, sy = f.y + 7; for (let i = 0; i < (st.fx === 'rain' ? 2 : 1); i++) { const tx = hx + frand(-3, 3), ty = st.fx === 'rain' ? hy - 140 : hy, d = hypot(tx - sx, ty - sy) || 1; spawnProj({ type: 'arrow', ghost: true, owner: f, x: st.fx === 'rain' ? tx + frand(-10, 10) : sx, y: st.fx === 'rain' ? ty : sy, vx: st.fx === 'rain' ? 0 : (tx - sx) / d * 9, vy: st.fx === 'rain' ? 8 : (ty - sy) / d * 9, g: 0, r: 2, dmg: 0, life: 22 }); } fsx(f, 'bolt', 0); }
  strike(f, e, dmg, kx || .01 * k.face, ky, { stop: st.stop || (fin ? 8 : 3), shake: st.shake || (fin ? 6 : 2), crit: fin, link: true, hx, hy, launch: fin && ky < -2.5, cold: W.cold });
  if (fin && !e.dead) { if (ky < -2.5) applyStatus(e, 'launched', f, { d: 70 }); if (e.st) e.st.lk = 10; }
  const fx = st.fx;
  if (fx === 'flare' || fx === 'blaze' || fx === 'forge') { burst(hx, hy, fx === 'flare' ? 10 : 30, ['#ff7a2a', '#ffd35a', '#e2542b', '#fff1a8'], fx === 'flare' ? 1.8 : 3.4, 30, { glow: 1, g: .02 }); if (e.st && e.st.burn) e.st.burn = max(e.st.burn, 120); }
  if (fin && (fx === 'blaze' || fx === 'forge')) { explode(hx, hy, fx === 'forge' ? 44 : 30, round(W.dmg * (fx === 'forge' ? 1.6 : 1)), f); for (const o of foesOf(f)) if (o !== e && !o.dead && circBox(hx, hy, 40, o)) applyStatus(o, 'burn', f); if (fx === 'forge') G.fires.push({ x0: hx - 30, x1: hx + 30, y: k.ground, life: 200, max: 200, by: f }); }
  if (fin && fx === 'crack' && !WORLD.arena) { const s = k.face; for (let i = 0; i < 3; i++) { const tx = floor((hx + s * (e.w / 2 + 3 + i * 6)) / T); for (const yy of [hy - 4, hy + 4]) { const ty = floor(yy / T), t = tileAt(tx, ty); if (t && TP[t].solid && TP[t].hard < 60 && !TP[t].ghost && t !== DOORC && t !== DOORO) breakTile(tx, ty, true); } } addShake(8); sfx('brk', 0); }
  if (fx === 'impale') { sparks(hx, hy, 10, k.face, 2.4); }
  if (fin && fx === 'tear') { sparks(hx - k.face * 4, hy, 12, -k.face, 2.6, ['#e8edf2', '#aab3c2', '#fff1a8']); G.stuck.push({ x: hx + k.face * 4, y: hy, a: 0, life: 200 }); }
  if (fin && fx === 'quake') landShock({ f, m: { shake: 4 }, W, stale: 1 }, { r: 30, dmg: .8, kb: [2.6, -3] }, hx);
  if (fin && (f === G.p || e === G.p)) { G.flash = max(G.flash, .35); G.flashCol = '255,241,168'; }
  if (f === G.p) comboHit(true);
}
function endLink(k, broken) {
  const f = k.f, e = k.e; f.link = null; if (f.state === 'link') f.state = 'normal'; if (f.atk && f.atk.link) { f.atk = null; f.state = 'normal'; }
  f.inv = max(f.inv, 16); f.iDodge = max(f.iDodge, 8); f.vy = -1.2; f.chainT = 0;
  if (e.st) { e.st.held = 0; e.st.lk = max(e.st.lk, 10); }
  if (G.link === k) { G.link = null; G.zoomT = 1; }
}
function tryLink(f, btn) { const l = findLink(f, btn); if (!l) return false; startLink(f, l.id, l.e); return true; }
