// ============================================================
//  Fighters. The local player, AI duelists (echoes, Vesper) and
//  other people online all use this one body: movement, dodge,
//  perfect dodge, hit reactions and the pixel-rig renderer.
// ============================================================
const UI = { open: null, held: null, scroll: 0, codex: null, focus: null, confirm: null };
const VS = { s: 3, W: 0, H: 0, vw: 0, vh: 0, ui: 2, uw: 0, uh: 0 };
const heldItem = () => { const s = inv[G.sel]; return s ? IT[s.id] : null; };
const NOFOES = [];
function foesOf(f) { return f.foes || NOFOES; }
const near = f => f === G.p || (G.p && abs(f.x - G.p.x) < 330 && abs(f.y - G.p.y) < 230);
const fsx = (f, n, cd) => { if (near(f)) sfx(n, cd); };
const canDbl = f => WORLD.arena || WORLD.mode === 1 || (f === G.p ? !!G.flags.dbl : !!f.dbl);
const airDashMax = f => (WORLD.arena || WORLD.mode === 1 || (f === G.p ? G.flags.e2 : f.e2)) ? 2 : 1;
const slowOK = () => !(WORLD.arena && NET.peers.size);
const AI_RANGE = { sword: 20, spear: 30, fangs: 13, maul: 22, bow: 125, chuks: 15, brawl: 12 };

function newFighter(x, y, o) {
  const f = {
    fighter: true, x, y, px: x, py: y, w: 6, h: 20, vx: 0, vy: 0, face: 1, onGround: false, canStep: true, stepVis: 0, hp: 100, maxhp: 100, stam: 100, maxstam: 100, stamDelay: 0,
    inv: 0, iDodge: 0, dodgeT: 0, dodgeCd: 0, dodgeDir: 1, dodgeGrace: 0, dodgeGround: true, dbuf: 0, airDash: 1, updraft: true, dblUsed: false, perfected: false,
    state: 'normal', atk: null, buf: null, coyote: 0, jbuf: 0, runPh: 0, landT: 0, hurtT: 0, riposte: 0, lastMove: null, chainT: 0, hist: [], toolT: 0, mineX: -1, mineY: -1, mineP: 0,
    placeCd: 0, dead: false, deadT: 0, healCd: 0, regenT: 0, sHold: 0, noCut: false, ghostReq: false, scarf: [], skin: 0, hat: 0, team: 'p', name: '', wid: 'sword', flash: 0, taken: 0, takenT: 0,
    kills: 0, deaths: 0, foes: [], atkN: 0
  };
  Object.assign(f, o);
  for (let i = 0; i < 7; i++) f.scarf.push({ x: x + 3, y: y + 5, ox: x + 3, oy: y + 5 });
  return f;
}
function newPlayer() {
  const sx = SPOTS.camp ? SPOTS.camp.x - 6 : SPAWN_X, sy = SPOTS.camp ? SPOTS.camp.y : heights[SPAWN_X]; const p = newFighter(sx * T + 1, (sy - 3) * T, { isPlayer: true, skin: G.skin || 0, hat: G.hat || 0, name: G.nick || 'You' });
  while (boxHits(p.x, p.y, p.w, p.h)) p.y -= T; p.py = p.y; return p;
}
function reviveFighter(f, x, y) {
  Object.assign(f, { x, y, px: x, py: y, vx: 0, vy: 0, hp: f.maxhp, stam: f.maxstam, dead: false, deadT: 0, inv: 120, iDodge: 0, state: 'normal', atk: null, buf: null, hurtT: 0, riposte: 0, taken: 0, chainT: 0, mineP: 0 });
  while (boxHits(f.x, f.y, f.w, f.h)) { f.y -= T; f.py = f.y; }
  for (const s of f.scarf) { s.x = s.ox = f.x + 3; s.y = s.oy = f.y + 5; }
}
function startDodge(f, md, I) {
  const c = atkContext(f, I), dir = md || -c.side;
  if (f.atk) endAttack(f); f.state = 'dodge'; f.dodgeT = 0; f.dodgeDir = dir; f.dodgeGround = f.onGround || f.coyote > 0; if (!f.dodgeGround) { f.airDash--; f.vy = 0; }
  f.iDodge = f === G.p && boonHas('veil') ? 15 : 10; f.dodgeCd = 24; f.stam = max(0, f.stam - 22); f.stamDelay = 38; f.dbuf = 0; f.perfected = false; if (md) f.face = dir;
  fsx(f, 'dodge', 0); dust(f.x + 3, f.y + f.h, 5); f.ghostReq = true;
  if (f === G.p && G.drill) drillNote('dodge');
}
function perfectDodge(f) {
  if (f.perfected) return; f.perfected = true; f.riposte = f === G.p && boonHas('riposte') ? 120 : 80; f.stam = min(f.maxstam, f.stam + 30); f.iDodge = max(f.iDodge, 18); f.ghostReq = true;
  numPop(f.x + 3, f.y - 8, 'PERFECT', '#8ff5e6');
  if (f === G.p) { if (slowOK()) G.slowT = 26; G.flash = max(G.flash, .25); G.flashCol = '143,245,230'; sfx('perfect', 0); comboHit(true); G.flags.perfect = true; }
  else fsx(f, 'reflect', 0);
}
function hurtFighter(f, dmg, fromX, o = {}) {
  if (f.remote && f.coop) return netHurtPeer(f, dmg, fromX, o || {}); if (f.ghostH) return netHitHollow(f, dmg, fromX, o || {});
  if (f.dead || G.state !== 'play' || f.remote) return false;
  if (f.iDodge > 0 && !o.link) { if (!f.perfected && (f.state === 'dodge' || f.dodgeGrace > 0)) perfectDodge(f); return false; }
  if (f.inv > (o.net ? 30 : o.link ? 999 : 0)) return false;
  if (f.state === 'link' && !o.link) return false;
  const pvp = !!o.pvp, armored = f.atk && f.atk.m.armor && f.atk.phase < 2;
  const gp = f === G.p && gearOn(); if (gp) { dmg = gearDamage(dmg, o); if ((gearHas('kindled') || gearHas('molten')) && o.by && o.by !== f && !o.by.dead && o.by.hp !== undefined && !o.by.fighter) applyStatus(o.by, 'burn', f, { d: 90 }); }
  dmg = max(1, round(dmg * (pvp && WORLD.arena ? .8 : 1) * (armored ? .65 : 1) * (f.dmgTaken || 1) * (f === G.p && !WORLD.arena && !o.net ? DIFF().taken * blessTaken() : 1)));
  let warded = 0; if (WORLD.royale && f.ward > 0) { warded = min(f.ward, dmg); f.ward -= warded; dmg -= warded; if (warded) sparks(f.x + 3, f.y + 8, 5, 0, 1.6, ['#8fd0ff', '#ffffff']); }
  f.hp -= dmg; f.regenT = 0; f.flash = 6; if (o.by) f.lastHitBy = o.by;
  if (gp && boonHas('thorn') && !o.net && !pvp) { const by = o.by && !o.by.fighter && !o.by.dead ? o.by : G.enemies.find(e => !e.dead && !e.noHit && e.type !== 'dummy' && abs(e.x + e.w / 2 - (f.x + 3)) < 22 && abs(e.y + e.h / 2 - (f.y + 10)) < 24); if (by && by.hp !== undefined) damageEnemy(by, max(1, round(dmg * .25)), 0, 0, { thorn: 1 }); }
  const held = f.st && f.st.held > 0;
  if (held) { f.flash = 6; f.hurtT = 8; }
  // hollow iron does not flinch at small blows
  else if (gp && dmg < 9 && gearHas('anvil')) { f.inv = 40; fsx(f, 'hit2', 0); sparks(f.x + 3, f.y + 8, 3, 0, 1.2); }
  else if (!armored) {
    const d = sign((f.x + 3) - fromX) || -f.face;
    const pz = gp ? gearMul('poise') : 1; f.vx = (o.kx !== undefined ? o.kx * .85 : d * 2.7) * pz; f.vy = (o.ky !== undefined ? min(o.ky, -1.2) : -2.3) * (.4 + .6 * pz); f.onGround = false;
    f.hurtT = pvp ? clamp(o.stagger ? 24 : 11 + (o.stop || 2), 10, 26) : 13; f.inv = pvp ? 7 : 58;
    if (o.link) f.inv = 0; else if (pvp && ++f.taken >= 4) { f.inv = 50; f.taken = 0; f.vx *= 1.4; sparks(f.x + 3, f.y + 10, 10, 0, 2, FROST); }
    f.takenT = 70; if (f.atk) { f.atk = null; } f.state = 'normal'; f.buf = null;
  } else fsx(f, 'hit2', 0);
  if (f === G.p) {
    G.combo.n = 0; G.combo.pts = 0; G.combo.t = 0; addShake(4.5); G.hitstop = max(G.hitstop, 5); sfx('hurt', 0); G.flash = .24; G.flashCol = '226,72,59';
    if (dmg > 0) numPop(f.x + 3, f.y - 4, dmg, '#ff6b6b'); if (warded) numPop(f.x + 3, f.y - 12, warded, '#8fd0ff'); burst(f.x + 3, f.y + 10, 8, ['#e2483b', '#ff9a8a'], 1.8, 22);
  } else hitFx(o.hx === undefined ? f.x + 3 : o.hx, o.hy === undefined ? f.y + 10 : o.hy, f.y, dmg, o, o.kx || 0, o.by === G.p);
  if (f.hp <= 0) { if (f.yieldAt) { f.hp = 1; f.yieldAt(f); } else killFighter(f, o.by); }
  return true;
}
function hurtPlayer(dmg, fromX) { return hurtFighter(G.p, dmg, fromX, {}); }
function killFighter(f, by) {
  if (f.hollow && !f.remote && netHost() && f.nid) sendAll({ t: 'hdie', id: f.nid, x: round(f.x), y: round(f.y), elite: f.elite || '' });
  f.hp = 0; f.dead = true; f.deadT = 0; f.atk = null; f.state = 'normal'; f.deaths++;
  burst(f.x + 3, f.y + 10, 40, f.skin === 4 ? FROST : SPARK, 3, 60, { glow: 1, g: .02 }); if (f === G.p) sfx('die', 0); else fsx(f, 'kill', 0);
  if (WORLD.arena) arenaDeath(f, by); else if (f === G.p) { G.deaths = (G.deaths || 0) + 1; G.dirty = true; }
  else if (f.hollow && !f.remote) hollowDrops(f);
}

// ---------------- one tick of a fighter, driven by an input object ----------------
// I = { md, jumpP, jumpH, down, l, r, lp, rp, dodgeP, wx, wy, faceAim }
function tickFighter(f, I) {
  f.px = f.x; f.py = f.y; if (f.flash > 0) f.flash--;
  if (f.dead) { f.deadT++; f.vy = min(f.vy + .26, 6); f.vx *= .9; moveBody(f); if (f.hollow && f.deadT > 50) f.gone = true; return; }
  if (f.inv > 0) f.inv--; if (f.iDodge > 0) f.iDodge--; if (f.dodgeCd > 0) f.dodgeCd--; if (f.dodgeGrace > 0) f.dodgeGrace--; if (f.riposte > 0) f.riposte--;
  if (f.chainT > 0) f.chainT--; if (f.hurtT > 0) f.hurtT--; if (f.landT > 0) f.landT--; if (f.healCd > 0) f.healCd--; if (f.placeCd > 0) f.placeCd--;
  if (f.takenT > 0 && --f.takenT <= 0) f.taken = 0;
  if (f.armCd > 0) f.armCd--; if (f.throwT > 0) f.throwT--; if (f.veil > 0) f.veil--;
  if (f.state === 'link') { tickLink(f); tickScarf(f); return; }
  if (f.st && tickStatus(f)) { f.atk = null; if (f.state === 'attack') f.state = 'normal'; tickScarf(f); return; }
  if (tickGrapple(f)) { moveBody(f); tickScarf(f); return; }
  if (I.armP && f.hurtT <= 0) throwArm(f, I.wx, I.wy);
  if (I.jumpP) f.jbuf = 7; else if (f.jbuf > 0) f.jbuf--;
  if (f.onGround) { f.coyote = 6; f.airDash = airDashMax(f); f.updraft = true; f.dblUsed = false; } else if (f.coyote > 0) f.coyote--;
  if (f.stamDelay > 0) f.stamDelay--; else f.stam = min(f.maxstam, f.stam + .6 * (f.isPlayer && !WORLD.arena ? (f.tonic > 0 ? 1.8 : 1) * (WORLD.mode !== 1 && G.food <= 0 ? .5 : 1) * gearMul('st') : 1));
  f.regenT++;
  if (WORLD.arena && !WORLD.royale) { if (f.regenT > 240 && f.hp < f.maxhp && G.time % 4 === 0) f.hp++; }
  else if (f.isPlayer && f.regenT > 420 / DIFF().regen && G.time % max(1, round((WORLD.mode === 1 || G.food > 70 ? 40 : G.food > 30 ? 80 : 1e9) / DIFF().regen / blessRegen())) === 0 && f.hp < f.maxhp) f.hp++;
  const W = heldOf(f), isW = W && W.type === 'weapon', free = f.hurtT <= 0;
  if (isW && free) { if (I.lp) f.buf = { b: 'L', t: 10 }; else if (f === G.p && I.l && f.state === 'normal' && !f.buf && !(f.toolT > 0)) f.buf = { b: 'L', t: 2 }; if (I.rp) f.buf = { b: 'H', t: 10 }; }
  if (f.buf && --f.buf.t < 0) f.buf = null;
  if (I.dodgeP) f.dbuf = 7; else if (f.dbuf > 0) f.dbuf--;
  let a = f.atk;
  if (f.dbuf > 0 && f.dodgeCd <= 0 && f.hurtT <= 0 && f.stam >= 12 && (f.state === 'normal' || (f.state === 'attack' && (a.phase === 2 || (a.phase === 0 && a.charge > 0)))) && (f.onGround || f.coyote > 0 || f.airDash > 0)) startDodge(f, I.md, I);
  if (f.buf && f.hurtT <= 0) {
    a = f.atk; const ok = f.state === 'normal' || (f.state === 'dodge' && f.dodgeT >= 2) || (f.state === 'attack' && a.phase === 2 && a.pt >= floor(a.m.rec * .38));
    if (ok) { const b = f.buf.b; f.buf = null; if (f.state === 'attack') endAttack(f); if (startAttack(f, b, I)) f.atkN++; }
  }
  let grav = .26; const gp = f === G.p && gearOn(), maxV = 1.45 * (gp ? gearMul('walk') : 1);
  if (gp && f.vy > 0 && (gearHas('feather') || gearHas('prismatic')) && I.jumpH && !f.onGround) grav = .17;
  if (f.state === 'dodge') {
    f.dodgeT++; f.vx = f.dodgeDir * 3.5 * (f.dodgeT > 8 ? .7 : 1) * (f === G.p ? gearMul('dodge') : 1); if (!f.dodgeGround) { f.vy = 0; grav = 0; }
    if (f.dodgeT % 2 === 0) f.ghostReq = true;
    if (f.dodgeT >= 11) { f.state = 'normal'; f.dodgeGrace = 9; f.vx *= .5; }
  } else if (f.state === 'attack') tickAttack(f, I);
  a = f.atk;
  if (f.state !== 'dodge' && !(a && a.dashT > 0 && a.phase === 1)) {
    const ctrl = a ? (a.phase === 2 ? .7 : a.m.ctrl) : (f.hurtT > 0 ? .12 : 1), md = I.md;
    const tgt = md * maxV * (a && a.phase < 2 ? min(1, ctrl + .15) : 1), acc = (f.onGround ? .24 : .15) * ctrl;
    if (md && ctrl > 0) f.vx = (abs(f.vx) > maxV && sign(f.vx) === md) ? approach(f.vx, tgt, .07) : approach(f.vx, tgt, acc);
    // walking into a shut door pushes it open
    if (md && f === G.p && !WORLD.arena && f.state === 'normal') { const tx = floor((f.x + (md > 0 ? f.w + 1.5 : -1.5)) / T); for (let y = floor(f.y / T); y <= floor((f.y + f.h - 1) / T); y++) if (tileAt(tx, y) === DOORC) { if (toggleDoor(tx, y)) G.autoDoors.push({ tx, ty: y, t: 150 }); break; } }
    else f.vx = approach(f.vx, 0, (f.onGround ? .2 : .035) * (a ? .6 : 1));
  }
  if (f.jbuf > 0 && !(f.climbing && !I.md) && f.hurtT <= 0 && (f.state === 'normal' || (f.state === 'attack' && a.phase === 2))) {
    if (f.coyote > 0) doJump(f, -4.55 * (f === G.p ? gearMul('jump') : 1));
    else if (canDbl(f) && !f.dblUsed) { f.dblUsed = true; doJump(f, -4.15); for (let i = 0; i < 12; i++) P(f.x + 3, f.y + f.h, cos(i / 12 * TAU) * 1.6, sin(i / 12 * TAU) * .5, 16, fpick(f.skin === 4 ? FROST : SPARK), { glow: 1, g: 0, fr: .9 }); }
  }
  if (!I.jumpH && f.vy < -1.7 && !f.noCut) f.vy = -1.7;
  a = f.atk;
  if (a && a.phase < 2) { if (a.m.float) grav = .1; if (a.dashT > 0 && a.m.dash.vy === undefined && !a.m.dash.along && !f.onGround) grav = .04; }
  const liq = liqAt(f.x + 3, f.y + f.h - 5), head = liqAt(f.x + 3, f.y + 2);
  if (liq) {
    grav *= .3; f.vx *= .9; if (f.vy > 1.3) f.vy = lerp(f.vy, 1.3, .3);
    if (I.jumpH && f.state !== 'dodge') { f.vy = max(f.vy - .42, head ? -2.1 : -3.2); if (!head && I.jumpP) { f.vy = -4; fsx(f, 'jump'); } }
    if (!f.wet) { f.wet = 1; if (abs(f.vy) > 1.5) { for (let i = 0; i < 10; i++) P(f.x + 3, f.y + f.h - 3, frand(-1.4, 1.4), frand(-2.4, -.8), 26, liq === 2 ? '#ffb347' : '#b4e6e8', { g: .15 }); fsx(f, 'land'); } }
    if (liq === 2 && !(f === G.p ? G.flags.e3 : f.fireproof)) { if (G.time % 15 === 0) { if (f.remote) { } else { f.hp -= 4; f.flash = 4; f.regenT = 0; if (f === G.p) { numPop(f.x + 3, f.y - 4, 4, '#ff7a2a'); sfx('hurt', 40); } if (f.hp <= 0) killFighter(f, null); } } applyStatus(f, 'burn', null, { d: 50 }); }
  } else f.wet = 0;
  for (const v of VENTS) if (abs(f.x + 3 - v.cx) < 11 && f.y + f.h > v.top * T && f.y < v.gy * T) { const k = clamp((f.y - v.top * T) / max(1, (v.gy - v.top) * T), 0, 1); grav = 0; f.vy = max(f.vy - .55, -(1.3 + 3.6 * k)); f.coyote = 0; f.updraft = true; f.airDash = airDashMax(f); if (G.time % 3 === 0 && f === G.p) P(f.x + 3 + frand(-6, 6), f.y + f.h, 0, -2, 14, '#dcf7f5', { g: 0 }); }
  grav = travelTick(f, I, grav);
  f.vy = min(f.vy + grav, 6.4);
  f.sHold = I.down ? f.sHold + 1 : 0; f.dropThru = f.sHold > 7 && f.state === 'normal';
  const wasG = f.onGround, vyb = f.vy; moveBody(f); placeHazards(f);
  if (!wasG && f.onGround) { f.landT = 7; f.noCut = false; if (vyb > 3) { dust(f.x + 3, f.y + f.h, 3 + (vyb | 0)); fsx(f, 'land'); } }
  if (f.onGround && abs(f.vx) > .3) { const o = f.runPh; f.runPh += abs(f.vx) * .21; if (floor(o / PI) !== floor(f.runPh / PI)) { if (f === G.p) sfx('step', 120); if (abs(f.vx) > 1.2) P(f.x + 3, f.y + f.h - 1, -f.vx * .3, -.4, 12, '#b9bdd0', { g: .02 }); } }
  if (f.state === 'normal' && f.toolT <= 0) { if (I.md) f.face = I.md; else if (I.faceAim) f.face = sign(I.wx - (f.x + 3)) || f.face; }
  f.stepVis *= .6; if (abs(f.stepVis) < .3) f.stepVis = 0;
  if (f.y > WH * T - 30) { f.inv = 0; f.iDodge = 0; if (!f.dead) killFighter(f, f.lastHitBy); }
  tickScarf(f);
}
function doJump(f, v) { f.vy = v; f.onGround = false; f.coyote = 0; f.jbuf = 0; f.noCut = false; if (f.atk) endAttack(f); fsx(f, 'jump'); dust(f.x + 3, f.y + f.h, 3); }
function tickScarf(f) {
  const sc = f.scarf, ax = f.x + 3 - f.face * 2, ay = f.y + 6;
  sc[0].x = ax; sc[0].y = ay;
  for (let i = 1; i < sc.length; i++) { const s = sc[i], vx = (s.x - s.ox) * .86, vy = (s.y - s.oy) * .86; s.ox = s.x; s.oy = s.y; s.x += vx - f.face * .05 + sin(G.time * .11 + i) * .05; s.y += vy + .09; }
  for (let k = 0; k < 2; k++) for (let i = 1; i < sc.length; i++) { const s = sc[i], q = sc[i - 1], dx = s.x - q.x, dy = s.y - q.y, d = hypot(dx, dy) || 1, ex = (d - 1.9) / d; s.x -= dx * ex; s.y -= dy * ex; }
}

// ---------------- the local player ----------------
function playerInput() {
  const talk = !!G.dialog || !!G.cine, menu = UI.open === 'pause' || UI.open === 'score' || (UI.open === 'stn' && !!UI.job) || UI.open === 'knap', blockA = talk || !!UI.open, blockM = talk || menu;
  return {
    md: blockM ? 0 : (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0),
    jumpP: !blockM && !!(pressed.Space || pressed.KeyW || pressed.ArrowUp), jumpH: !blockM && !!(keys.Space || keys.KeyW || keys.ArrowUp), down: !blockM && !!(keys.KeyS || keys.ArrowDown),
    l: !blockA && mouse.l, r: !blockA && (mouse.r || !!keys.KeyQ), lp: !blockA && mouse.lp, rp: !blockA && (mouse.rp || !!pressed.KeyQ),
    dodgeP: !blockM && !!(pressed.ShiftLeft || pressed.ShiftRight), wx: mouse.wx, wy: mouse.wy, blockA, armP: !blockA && !!pressed.KeyR
  };
}
function tickPlayer() {
  const p = G.p, I = playerInput();
  if (WORLD.royale && !brInput(p, I)) return;
  tickFighter(p, I);
  if (WORLD.royale) brAfter(p, I);
  if (p.dead) { if (!WORLD.royale && p.deadT > (WORLD.arena ? 150 : 190)) respawnPlayer(); return; }
  if (WORLD.arena) return;
  // ---- tools, blocks, consumables ----
  toolTick(p, I);
  const hi = heldItem(); if (hi && hi.type === 'weapon') G.lastWeapon = G.sel;
  if (pressed.KeyH && !G.dialog) useHeal(countItem('salve') ? 'salve' : 'glowcap');
  if (pressed.KeyT && !G.dialog && !UI.open) cycleArm(p);
  if (!UI.open && !G.dialog && !G.cine) { if (pressed.KeyV) tryStyle(p, I); if (pressed.KeyX) swapOff(p, I); }
  tickStyles(p, I);
  if (pressed.KeyF && !UI.open) interact();
}
function respawnPlayer() {
  const p = G.p;
  if (WORLD.arena) { arenaRespawn(p); return; }
  G.deathAt = { x: p.x + 3, y: p.y + 10 };
  const rs = G.respawn || (SPOTS.camp ? { x: SPOTS.camp.x - 2, y: SPOTS.camp.y } : { x: SPAWN_X + 2, y: DIM ? VIL_Y : heights[SPAWN_X] }); streamTo(rs.x * T, true); reviveFighter(p, rs.x * T + 1, (rs.y - 3) * T); if (G.link) G.link = null;
  G.cam.x = G.cam.px = p.x - VS.vw / 2; G.cam.y = G.cam.py = p.y - VS.vh / 2;
  if (G.boss) despawnBoss(); if (G.duel) endDuel(false); G.enemies.length = 0; G.projs.length = 0;
  say('The ember gutters... and catches again. Ash does not stay down.');
}
function useHeal(id) {
  const p = G.p, it = IT[id]; if (WORLD.arena || p.healCd > 0 || p.hp >= p.maxhp || countItem(id) < 1) { sfx('deny'); return; }
  if (WORLD.mode !== 1) removeItem(id, 1); p.hp = min(p.maxhp, p.hp + it.heal); p.healCd = 70; sfx('heal'); numPop(p.x + 3, p.y - 4, '+' + it.heal, '#8ff5e6');
  for (let i = 0; i < 14; i++) P(p.x + frand(-2, 8), p.y + frand(4, 20), 0, frand(-.9, -.3), 30, fpick(['#8ff5e6', '#c9fff6', '#4fd8c8']), { glow: 1, g: -.01 });
}

// ---------------- AI duelists: read the foe, slip their swings, vary the forms ----------------
function newBrain(skill, o) { return Object.assign({ skill, I: { md: 0, jumpP: false, jumpH: false, down: false, l: false, r: false, lp: false, rp: false, dodgeP: false, wx: 0, wy: 0, faceAim: true }, tgt: null, retarget: 0, think: 0, atkCd: 40, hold: 0, holdB: '', plan: null, jumpCd: 0, lastThreat: null, strafe: 1, strafeT: 0, ex: 0, ey: 0, rest: 0, home: null }, o); }
function aiThink(f) {
  const B = f.ai, I = B.I, sk = B.skill;
  I.lp = I.rp = I.jumpP = I.dodgeP = I.armP = false;
  if (B.atkCd > 0) B.atkCd--; if (B.jumpCd > 0) B.jumpCd--; if (B.rest > 0) B.rest--;
  if (f.dead) { I.md = 0; I.l = I.r = I.jumpH = I.down = false; return I; }
  if (--B.retarget <= 0 || !B.tgt || B.tgt.dead || B.tgt.noHit) {
    B.retarget = 40; let best = null, bd = 1e9;
    for (const o of foesOf(f)) { if (o.dead || o.noHit || o.root) continue; const d = hypot(o.x - f.x, (o.y - f.y) * 1.5) * (o === G.p ? .8 : 1); if (d < bd) { bd = d; best = o; } }
    B.tgt = best;
  }
  const t = B.tgt; I.armP = false;
  if (!t || hypot(t.x - f.x, t.y - f.y) > 600) { I.md = 0; I.l = I.r = I.jumpH = I.down = false; return I; }
  if (f.st && f.st.blind > 0) { if (--B.think <= 0) { B.think = 12; I.md = Math.random() < .6 ? (Math.random() < .5 ? -1 : 1) : 0; I.wx = f.x + 3 + I.md * 30; I.wy = f.y + 8; if (Math.random() < .25) I.lp = true; } return I; }
  if (t.veil > 0 && Math.random() < .7) { I.md = 0; return I; }
  const W = IT[f.wid], set = W.set, MS = MOVESETS[set], ranged = set === 'bow';
  const tcx = t.x + t.w / 2, tcy = t.y + t.h / 2, fx = f.x + 3, fy = f.y + 10, dx = tcx - fx, dy = tcy - fy, adx = abs(dx), dir = sign(dx) || 1, pref = AI_RANGE[set];
  I.wx = tcx + B.ex; I.wy = tcy + B.ey;
  // --- read the foe's wind-up and slip it ---
  const ta = t.fighter && t.atk;
  if (ta && ta.phase === 0 && ta !== B.lastThreat && f.dodgeCd <= 0 && B.rest <= 0 && f.stam > 22 && f.hurtT <= 0) {
    const reach = (ARM + ta.W.len) * ta.m.reach + 12 + (ta.m.dash ? ta.m.dash.v * ta.m.dash.t * .7 : 0) + (ta.m.kind === 'shot' ? 240 : 0), left = ta.m.wind - ta.pt;
    if (hypot(dx, dy) < reach && left >= 0 && left <= 2 + (1 - sk) * 5) { B.lastThreat = ta; if (Math.random() < sk * .55) { I.dodgeP = true; I.md = Math.random() < .55 ? dir : -dir; if (B.home && abs(fx + I.md * 30 - B.home.x) > B.home.r) I.md = -I.md; B.rest = 45 + floor(Math.random() * 30); } }
  }
  if (!I.dodgeP && f.dodgeCd <= 0 && B.rest <= 0 && f.stam > 22) for (const pr of G.projs) {
    if (pr.owner === f || pr.type === 'shock' && false) continue; const px = pr.x - fx, py = pr.y - fy;
    if (px * px + py * py < 46 * 46 && px * pr.vx < 0 && (!pr.owner || foesOf(f).includes(pr.owner)) && Math.random() < sk * .2) { I.dodgeP = true; I.md = -sign(pr.vx) || dir; B.rest = 40; break; }
  }
  // --- sidearms: pin a foe near a wall, hook one that keeps its distance, burn or blind a crowd ---
  if (f.arms && f.armCd <= 0 && B.atkCd <= 0 && f.hurtT <= 0 && f.state === 'normal' && Math.random() < .03 + sk * .03) {
    const want = f.arms.find(a => (a === 'shuriken' && adx < 150 && findPinSpot(t, sign(dx) || 1)) || (a === 'hook' && adx > 50 && adx < 140 && abs(dy) < 30) || ((a === 'flask' || a === 'smoke') && adx > 30 && adx < 110));
    if (want) { f.arm = want; I.armP = true; I.wx = tcx; I.wy = tcy - (want === 'flask' || want === 'smoke' ? 8 : 0); B.atkCd = 14; return I; }
  }
  if (t.st && (t.st.pin > 0 || t.st.hook > 0) && adx < 48 && f.state === 'normal' && f.hurtT <= 0) { I.lp = true; I.md = dir; return I; }
  // --- a perfect dodge opens a riposte ---
  if (f.riposte > 0 && f.state !== 'attack' && adx < pref + 40) { I.lp = true; I.md = 0; return I; }
  if (B.hold > 0) { B.hold--; I.r = B.holdB === 'H'; I.l = B.holdB === 'L'; if (B.hold === 0) I.l = I.r = false; } else I.l = I.r = false;
  if (B.plan && --B.plan.t <= 0) { if (B.plan.b === 'H') I.rp = true; else I.lp = true; I.down = !!B.plan.down; B.plan = null; }
  if (--B.think > 0) return I;
  B.think = 3 + floor((1 - sk) * 8 * Math.random()); B.ex = frand(-1, 1) * (1 - sk) * 12; B.ey = frand(-1, 1) * (1 - sk) * 10;
  // --- movement ---
  let md = 0;
  if (ranged) { if (adx < pref - 45) md = -dir; else if (adx > pref + 45) md = dir; else { if (--B.strafeT <= 0) { B.strafe = Math.random() < .5 ? 1 : -1; B.strafeT = 6; } md = Math.random() < .5 ? B.strafe : 0; } }
  else if (adx > pref + 6) md = dir; else if (adx < pref - 10 && Math.random() < .5) md = -dir;
  if (B.home) { const off = fx - B.home.x; if (abs(off) > B.home.r) md = -sign(off); }
  I.md = md; I.jumpH = false; I.down = false;
  if (f.onGround && B.jumpCd <= 0 && ((dy < -26 && adx < 140) || (f.hitWall && md) || (ranged && Math.random() < .04))) { I.jumpP = true; I.jumpH = true; B.jumpCd = 22; }
  else if (!f.onGround && dy < -10 && f.vy > 0 && canDbl(f) && !f.dblUsed && Math.random() < .3) { I.jumpP = true; I.jumpH = true; }
  if (dy > 26 && f.onGround && adx < 70) I.down = true;
  // --- choose a form ---
  const inRange = ranged ? adx < 270 && abs(dy) < 130 : adx < pref + 14 && abs(dy) < 34;
  if (inRange && B.atkCd <= 0 && f.hurtT <= 0 && (f.state === 'normal' || (f.state === 'attack' && f.atk.phase === 2))) {
    const r = Math.random(), heavy = f.stam > 35 && Math.random() < .3;
    B.atkCd = round(lerp(36, 9, sk) + Math.random() * 16);
    let ax = tcx, ay = tcy;
    if (r < .14 && f.onGround && !ranged) { I.jumpP = I.jumpH = true; B.plan = { b: heavy ? 'H' : 'L', t: 8, down: Math.random() < .3 }; }
    else if (r < .27 && adx > 30) { I.md = dir; ax = tcx + dir * 50; }
    else if (r < .35) I.md = -dir;
    else if (r < .45 && dy < -10) { ax = fx + dir * 6; ay = fy - 60; }
    else if (r < .53 && !ranged) I.down = true;
    else if (r < .57 && !ranged) { ax = fx; ay = fy - 3; }
    I.wx = ax; I.wy = ay;
    if (!B.plan) { if (heavy) { I.rp = true; const h = MS.moves[MS.map.h]; if (h.charge && Math.random() < .3) { B.hold = h.charge.min + 8; B.holdB = 'H'; I.r = true; } } else I.lp = true; }
  }
  return I;
}

// ---------------- rig ----------------
const SK_H = { leg: '#463f4a', legB: '#332d38', boot: '#221c2a', arm: '#5d5560', armB: '#463f4a', hand: '#463f4a', handB: '#332d38', hx: -3, hy: -7 };
function seg(x, x1, y1, x2, y2, w, col) { const dx = x2 - x1, dy = y2 - y1, len = hypot(dx, dy); x.save(); x.translate(x1, y1); x.rotate(atan2(dy, dx)); x.fillStyle = col; x.fillRect(-.5, -w / 2, len + 1, w); x.restore(); }
function legDraw(x, hx, hy, a1, a2, col, boot) { const kx = hx + sin(a1) * 4, ky = hy + cos(a1) * 4, fx = kx + sin(a2) * 4, fy = ky + cos(a2) * 4; seg(x, hx, hy, kx, ky, 2.2, col); seg(x, kx, ky, fx, fy, 2.2, col); x.fillStyle = boot; x.fillRect(round(fx - 1.2), round(fy - 2), 3, 2); }
function armDraw(x, sx, sy, ang, ext, col, hand) {
  const L = ARM * clamp(ext, .3, 1), hx = sx + cos(ang) * L, hy = sy + sin(ang) * L, l = ARM / 2; let ex = (sx + hx) / 2, ey = (sy + hy) / 2;
  if (L < ARM - .05) { const h = sqrt(max(0, l * l - L * L / 4)), nx = -(hy - sy) / L, ny = (hx - sx) / L, s = ny > 0 ? 1 : -1; ex += nx * h * s; ey += ny * h * s; }
  seg(x, sx, sy, ex, ey, 2, col); seg(x, ex, ey, hx, hy, 2, col); x.fillStyle = hand; x.fillRect(round(hx - 1), round(hy - 1), 2, 2);
}
function basePose() { return { l1a: .08, l1b: .08, l2a: -.08, l2b: -.08, lean: 0, bob: 0, armA: 1.15, armExt: .8, armB: 1.75, armBext: .85, wAng: -.6, wOff: 0, rot: 0, head: 0, crouch: 0, tuck: 0, kick: 0, stance: 0 }; }
function drawHat(x, hat) {
  if (hat === 1) { x.fillStyle = '#7a3222'; x.fillRect(-4, -11, 8, 2); x.fillStyle = '#ff8a3d'; x.fillRect(-3, -14, 6, 3); x.fillStyle = '#ffd35a'; x.fillRect(-1, -16, 2, 2); }
  else if (hat === 2) { x.fillStyle = '#ffd35a'; x.fillRect(-4, -12, 8, 3); x.fillStyle = '#fff1a8'; x.fillRect(-3, -15, 2, 3); x.fillRect(1, -15, 2, 3); x.fillRect(-1, -14, 2, 2); }
  else if (hat === 3) { x.fillStyle = '#4fd8c8'; x.fillRect(-4, -12, 8, 2); x.fillStyle = '#c9fff6'; x.fillRect(-2, -15, 4, 3); x.fillStyle = '#8ff5e6'; x.fillRect(-1, -17, 2, 2); }
}
function drawRig(x, P, S, wp, wp2) {
  x.save();
  if (P.spin !== undefined) { const s = P.spin; x.scale(abs(s) < .3 ? (s < 0 ? -.3 : .3) : s, 1); }
  if (P.rot) { x.translate(0, -10); x.rotate(P.rot); x.translate(0, 10); }
  const cr = P.crouch, hipY = -8 + cr; let l1a = P.l1a, l1b = P.l1b, l2a = P.l2a, l2b = P.l2b;
  if (P.stance) { const s = P.stance; l1a = lerp(l1a, .55, s); l1b = lerp(l1b, .15, s); l2a = lerp(l2a, -.6, s); l2b = lerp(l2b, -.75, s); }
  if (P.tuck) { const t = P.tuck; l1a = lerp(l1a, 1.1, t); l1b = lerp(l1b, -.6, t); l2a = lerp(l2a, .5, t); l2b = lerp(l2b, -1.2, t); }
  if (cr > 0) { const th = acos(clamp((8 - cr) / 8, 0, 1)); l1a = th + .25; l1b = -th + .4; l2a = th - .55; l2b = -th - .35; }
  if (P.kick) { l1a = lerp(l1a, 1.5, P.kick); l1b = lerp(l1b, 1.45, P.kick); }
  const lean = P.lean, shx = .5 * cos(lean) + 6 * sin(lean), shy = hipY + .5 * sin(lean) - 6 * cos(lean) + P.bob;
  if (wp2) { const L2 = ARM * clamp(P.armBext, .3, 1), hx2 = shx - 1.5 + cos(P.armB) * L2, hy2 = shy + sin(P.armB) * L2; x.save(); x.translate(hx2, hy2); x.rotate(P.w2Ang !== undefined ? P.w2Ang : P.armB - 1.05); x.drawImage(wp2.held, -wp2.grip[0], -wp2.grip[1]); x.restore(); }
  armDraw(x, shx - 1.5, shy, P.armB, P.armBext, S.armB, S.handB);
  legDraw(x, -.9, hipY, l2a, l2b, S.legB, S.boot); legDraw(x, .9, hipY, l1a, l1b, S.leg, S.boot);
  x.save(); x.translate(0, hipY); x.rotate(lean); x.drawImage(S.torso, -3, -8 + P.bob); x.translate(0, -7 + P.bob); x.rotate(P.head); x.drawImage(S.head, S.hx, S.hy); drawHat(x, S.hat || 0); x.restore();
  const L = ARM * clamp(P.armExt, .3, 1), hx = shx + cos(P.armA) * L, hy = shy + sin(P.armA) * L;
  if (wp) {
    x.save(); x.translate(hx, hy); x.rotate(P.wAng); if (P.wFlip !== undefined) x.scale(abs(P.wFlip) < .18 ? (P.wFlip < 0 ? -.18 : .18) : P.wFlip, 1);
    const ox = -wp.grip[0] + P.wOff, oy = -wp.grip[1];
    if (wp.chuks) drawNun(x, P.wOff, 0, 0, (P.nA === undefined ? PI / 2 - P.wAng : P.nA - P.wAng), wp.nun); else x.drawImage(wp.held, ox, oy);
    if (wp.set === 'bow') { const hb = wp.held.height - 1, d = P.draw || 0, nx = ox + 1.5 - 8 * d, ny = oy + hb / 2; seg(x, ox + 1.5, oy + .5, nx, ny, 1.3, '#fff1a8'); seg(x, nx, ny, ox + 1.5, oy + hb + .5, 1.3, '#fff1a8'); if (d > .2) x.drawImage(SPR.arrow, nx - 1, ny - 1); }
    x.restore();
  }
  armDraw(x, shx, shy, P.armA, P.armExt, S.arm, S.hand);
  x.restore();
}
function fighterPose(f, al) {
  const t = G.time + al, P = basePose(), sp = abs(f.vx), it = visHeld(f), isW = it && it.type === 'weapon';
  const idle = isW ? MOVESETS[it.set].idle : -.3; P.wAng = idle;
  if (f.dead) { P.rot = -min(1.5, f.deadT * .08); P.armA = 2.4; P.armB = 2.8; return P; }
  if (f.kneel) { P.crouch = 4; P.lean = .35; P.head = .35; P.armA = 1.4; P.armB = 1.3; P.wAng = 1.3; return P; }
  if (f.state === 'dodge') { P.lean = .75; P.l1a = -.4; P.l1b = -1.3; P.l2a = -.9; P.l2b = -1.5; P.armA = 2.5; P.armB = 2.7; P.wAng = 2.7; }
  else if (!f.onGround) {
    if (f.vy < 0) { P.l1a = .9; P.l1b = -.3; P.l2a = -.35; P.l2b = -1.05; P.armB = 2.3; } else { const k = min(1, f.vy / 3); P.l1a = .45; P.l1b = .05; P.l2a = -.5; P.l2b = -.95; P.armB = lerp(2.1, 3.7, k); P.armBext = .9; }
    P.lean = clamp(f.vx * f.face * .07, -.2, .25); P.armA = .7; P.wAng = idle - .25;
  } else if (sp > .25) {
    const ph = f.runPh + al * sp * .21, A = min(1, sp / 1.6), dir = sign(f.vx) * f.face;
    P.l1a = sin(ph) * .95 * A * dir; P.l1b = P.l1a - (.25 + .95 * max(0, cos(ph))) * A; P.l2a = sin(ph + PI) * .95 * A * dir; P.l2b = P.l2a - (.25 + .95 * max(0, cos(ph + PI))) * A;
    P.bob = -abs(sin(ph)) * 1.2 * A; P.lean = .14 * A * dir; P.armB = 1.6 - sin(ph) * .8 * A; P.armA = 1.25 + sin(ph) * .2 * A; P.wAng = idle + .25 + sin(ph * 2) * .05;
  } else { P.bob = sin(t * .06) * .55; P.wAng = idle + sin(t * .06) * .04; P.armA = 1.15 + sin(t * .06) * .04; }
  if (f.landT > 0 && f.onGround && !f.atk) P.crouch = max(P.crouch, f.landT / 7 * 2.4);
  if (f.hurtT > 0) { P.lean = -.4; P.head = -.3; P.armA = 2.2; }
  const st = f.st;
  if (st && st.pin > 0) { const w = st.pinS ? st.pinS * f.face : 0; P.lean = w ? -.3 * w : 0; P.armA = -2.2; P.armB = -1.7; P.armExt = 1; P.armBext = 1; P.head = -.25 + sin(G.time * .5) * .05; P.l1a = .3; P.l2a = -.3; P.crouch = st.pinS ? 0 : 4; P.wAng = -2; return P; }
  if (st && (st.hook > 0 || st.reel > 0 || st.held > 0)) { P.lean = -.35; P.head = -.35 + sin(G.time * .3) * .1; P.armA = 2.4; P.armB = 2.7; P.l1a = .5; P.l2a = -.4; P.wAng = 2.2; if (!f.atk) return P; }
  if (f.throwT > 0 && !f.atk) { const u = 1 - f.throwT / 12; P.armA = lerp(-2.4, f.throwA || 0, ease.out(min(1, u * 2))); P.armExt = 1; P.lean = .25 * sin(u * PI); P.wAng = idle; }
  if (f.atk) atkPose(P, f.atk, al);
  if (isW && it.chuks) { const a = f.atk; if (a && a.phase === 1 && a.m.kind === 'swing') P.nA = swingAng(a, max(0, a.pt + al - 2.2)) + (a.m.to > a.m.from ? -.5 : .5); else if (a && (a.m.kind === 'thrust' || a.m.kind === 'shot') && a.phase === 1) P.nA = P.wAng; else if (a && (a.m.kind === 'spin' || a.m.kind === 'flip')) P.nA = P.wAng + .35; else P.nA = PI / 2 + sin(t * .07) * .12 - P.lean; }
  else if (f.isPlayer && (f.toolT > 0 || f.toolCharge > 0) && (!it || it.type === 'tool' || it.fist)) {
    // the tool rises behind you, comes down along your aim, bites, and comes back
    const aim = atan2(mouse.wy - (f.y + 7), abs(mouse.wx - (f.x + 3))), hand = !f.swingTool || f.swingTool === HAND || f.swingTool.kind === 'hand';
    if (f.toolCharge > 0 && !(f.toolT > 0)) { const k = min(1, f.toolCharge / 50); P.wAng = aim - 2.1 - .6 * k + sin(G.time * .8) * .05 * k; P.armA = hand ? aim + 2.6 : P.wAng; P.armExt = hand ? .45 : 1; P.lean = -.12 * k; }
    else {
      const D = f.toolD || 15, I0 = f.toolHit || 5, el = D - f.toolT + al, up = aim - 2.2 - .45 * (f.toolK || 0); let w;
      if (el < I0 - 1.5) w = lerp(.5, up, ease.out(clamp(el / max(1, I0 - 1.5), 0, 1)));
      else if (el < I0) w = lerp(up, aim + .2, (el - (I0 - 1.5)) / 1.5);
      else if (el < I0 + 3) w = aim + .2 - .22 * sin((el - I0) / 3 * PI);
      else w = lerp(aim + .2, .55, ease.io(clamp((el - I0 - 3) / max(1, D - I0 - 3), 0, 1)));
      if (hand) { P.armA = aim; P.armExt = el < I0 - 1 ? lerp(.85, .35, clamp(el / I0, 0, 1)) : el < I0 + 2 ? 1.1 : lerp(1.1, .85, clamp((el - I0 - 2) / 6, 0, 1)); P.wAng = aim; }
      else { P.wAng = w; P.armA = w; P.armExt = 1; }
      P.lean = .14 * sin(clamp(el / D, 0, 1) * PI);
    }
  }
  else if (it && it.id === 'torch') { P.armA = -.5; P.armExt = .9; P.wAng = 0; }
  else if (it && it.type === 'block') { P.armA = f.toolT > 0 ? .1 : 1.15; }
  return P;
}
const TORCH_HELD = { held: null, grip: [2, 5] };
// what the rig shows: a tool the belt brought to hand mid-swing, else what you hold
function visHeld(f) { if (f.isPlayer && (f.toolT > 0 || f.toolCharge > 0) && f.swingTool && f.swingTool.held && !f.atk) return f.swingTool; if (f.isPlayer && (f.toolT > 0 || f.toolCharge > 0) && !f.atk && f.swingTool === HAND) return null; if (f === G.p) return f.atk && f.atk.W ? f.atk.W : heldItem() || heldOf(f); return heldOf(f); }
function drawFighterRig(x, f, al, rx, ry) {
  const P = fighterPose(f, al), it = visHeld(f), S = f === G.p ? gearSkin(SK[f.skin] || SK[0], f.skin) : f.coop && f.gearObj ? gearSkinOf(f) : SK[f.skin] || SK[0];
  S.hat = f.hat || 0;
  if (S.scarf) { const sc = f.scarf; for (let i = 1; i < sc.length; i++) seg(x, sc[i - 1].x - rx, sc[i - 1].y - ry, sc[i].x - rx, sc[i].y - ry, i < 3 ? 2.4 : 2, S.scarf[i % 2]); }
  let wp = null, wp2 = null; if (it) { if (it.held || it.chuks) { wp = it; if (it.dual) wp2 = it; } else if (it.id === 'torch') { TORCH_HELD.held = SPR.i_torch; wp = TORCH_HELD; } }
  x.save(); x.scale(f.face, 1); drawRig(x, P, S, wp, wp2); x.restore();
}
function drawFighter(f, al) {
  const rx = lerp(f.px, f.x, al) + 3, ry = lerp(f.py, f.y, al) + f.h + (f.stepVis || 0);
  const blink = f.inv > 0 && !f.dead && f.hurtT <= 0 && (G.time >> 2) & 1;
  const burn = f.st && f.st.burn > 0, veil = f.veil > 0;
  const [dx, dy] = drawEnt(96, 48, 70, c => drawFighterRig(c, f, al, rx, ry), rx, ry, { flash: f.hurtT > 9 || f.flash > 3 && f !== G.p, alpha: (blink ? .45 : 1) * (f.fade === undefined ? 1 : f.fade) * (veil ? .45 : 1), ly: -10, tint: burn ? [255, 110, 40, .18 + .12 * sin(G.time * .4)] : null });
  if (f.ghostReq) { f.ghostReq = false; makeGhost(dx, dy, 96, f.riposte > 0 ? '#8ff5e6' : (SK[f.skin] || SK[0]).scarf ? (SK[f.skin] || SK[0]).scarf[1] : '#c9fff6'); }
  return [rx, ry];
}

// ---------------- pixelizer: rig -> crisp outlined sprite, lit by the light map ----------------
const RB = 96;
const [rigCv, rigX] = mk(RB, RB, { willReadFrequently: true });
const [outCv, outX] = mk(RB, RB);
const outImg = outX.createImageData(RB, RB), ghostPool = [];
let wctx = null; const LIT = [1, 1, 1];
function pixelize(n, o) {
  const src = rigX.getImageData(0, 0, n, n).data, dst = outImg.data, W4 = RB * 4, n4 = n * 4, fl = o && o.flash, tn = o && o.tint;
  const L = LIT, l0 = L[0], l1 = L[1], l2 = L[2];
  for (let y = 0; y < n; y++) {
    let si = y * n4, di = y * W4;
    for (let x = 0; x < n; x++, si += 4, di += 4) {
      if (src[si + 3] >= 120) {
        if (fl) { dst[di] = 255; dst[di + 1] = 255; dst[di + 2] = 255; }
        else if (tn) { dst[di] = (src[si] + (tn[0] - src[si]) * tn[3]) * l0; dst[di + 1] = (src[si + 1] + (tn[1] - src[si + 1]) * tn[3]) * l1; dst[di + 2] = (src[si + 2] + (tn[2] - src[si + 2]) * tn[3]) * l2; }
        else { dst[di] = src[si] * l0; dst[di + 1] = src[si + 1] * l1; dst[di + 2] = src[si + 2] * l2; }
        dst[di + 3] = 255;
      } else if ((x > 0 && src[si - 1] >= 120) || (x < n - 1 && src[si + 7] >= 120) || (y > 0 && src[si - n4 + 3] >= 120) || (y < n - 1 && src[si + n4 + 3] >= 120)) { dst[di] = 18; dst[di + 1] = 13; dst[di + 2] = 31; dst[di + 3] = 255; }
      else dst[di + 3] = 0;
    }
  }
  outX.putImageData(outImg, 0, 0, 0, 0, n, n);
}
function drawEnt(n, ox, oy, fn, wx, wy, o) {
  rigX.setTransform(1, 0, 0, 1, 0, 0); rigX.clearRect(0, 0, n, n); rigX.translate(ox, oy); fn(rigX); rigX.setTransform(1, 0, 0, 1, 0, 0);
  lightSample(wx, wy + (o && o.ly !== undefined ? o.ly : 0), LIT); if (o && o.unlit) LIT[0] = LIT[1] = LIT[2] = 1; pixelize(n, o);
  const S = VS.s, dx = round((wx - ox) * S) / S, dy = round((wy - oy) * S) / S;
  if (o && o.alpha !== undefined) wctx.globalAlpha = o.alpha;
  wctx.drawImage(outCv, 0, 0, n, n, dx, dy, n, n); wctx.globalAlpha = 1;
  return [dx, dy];
}
function makeGhost(dx, dy, n, col) {
  if (G.ghosts.length > 40) return;
  const cv = ghostPool.pop() || mk(RB, RB)[0], gx = cv.getContext('2d');
  gx.globalCompositeOperation = 'copy'; gx.drawImage(outCv, 0, 0); gx.globalCompositeOperation = 'source-in'; gx.fillStyle = col; gx.fillRect(0, 0, RB, RB);
  G.ghosts.push({ cv, x: dx, y: dy, n, life: 13, max: 13 });
}
