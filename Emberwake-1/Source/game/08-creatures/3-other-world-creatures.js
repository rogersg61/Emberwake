// ============================================================
//  Creatures of the other worlds, the creatures that only come out when
//  something happens in the sky, and the three guardians (plus one that
//  walks under the Ember Moon). Where things spawn is a table: each world,
//  each land, under or deep, in lava or water, and each event has its own.
// ============================================================
const grav = (e, g = .25, m = 5) => { e.vy = min(e.vy + g, m); };
const toIdle = b => { b.state = 'idle'; b.t = 0; };
function hitP(e, dmg, o) { const p = G.p; if (!p || p.dead) return false; return hurtFighter(p, dmg, e.x + e.w / 2, Object.assign({ kx: (sign(p.x + 3 - e.x - e.w / 2) || 1) * 2.6, ky: -1.8, by: e }, o)); }
function touch(e, p, o) {
  if (p.dead || !overlap(e, p)) return false; const h = hitP(e, e.dmg, o);
  if (h && e.burnT) applyStatus(p, 'burn', e, { d: e.burnT }); if (h && e.poisT) applyStatus(p, 'poison', e, { d: e.poisT }); return h;
}
function walker(e, p, dx, dy, dist, sp, aggro) {
  grav(e); const chase = dist < aggro && !p.dead && abs(dy) < 90;
  if (chase) { e.dir = sign(dx) || e.dir || 1; e.vx = approach(e.vx, e.dir * sp, .12); } else { if (e.hitWall || Math.random() < .005) e.dir = -(e.dir || 1); e.vx = approach(e.vx, (e.dir || 1) * sp * .35, .05); }
  if (e.onGround && e.hitWall && chase) e.vy = -3.6;
  e.ph += abs(e.vx) * .25; moveBody(e); return chase;
}
function flyTo(e, tx, ty, acc, mx) { e.vx = approach(e.vx, clamp((tx - e.x - e.w / 2) * .04, -mx, mx), acc); e.vy = approach(e.vy, clamp((ty - e.y - e.h / 2) * .04, -mx, mx), acc); }
function shootAt(e, p, o) { const sx = e.x + e.w / 2, sy = e.y + e.h / 2, tx = p.x + 3, ty = p.y + 9, d = hypot(tx - sx, ty - sy) || 1, sp = o.sp || 2.4; return spawnProj(Object.assign({ type: 'orb', x: sx, y: sy, vx: (tx - sx) / d * sp, vy: (ty - sy) / d * sp, r: 3, dmg: e.dmg, life: 150 }, o)); }
function lob(sx, sy, tx, ty, n, o) { const g = o.g || .15; return spawnProj(Object.assign({ x: sx, y: sy, vx: (tx - sx) / n, vy: (ty - sy) / n - .5 * g * n, g, life: n + 70 }, o)); }
function fireBeam(b, ang, len, w, dmg, col) {
  const sx = b.x + b.w / 2, sy = b.y + b.h / 2, cx = cos(ang), cy = sin(ang); let L = 0;
  while (L < len && !solidAt(floor((sx + cx * L) / T), floor((sy + cy * L) / T))) L += 4;
  const ex = sx + cx * L, ey = sy + cy * L, p = G.p; G.trails.push({ kind: 'beam', x: sx, y: sy, x2: ex, y2: ey, w, life: 3, max: 3, col: col || '#e0c8ff' });
  if (!p.dead) { const px = p.x + 3 - sx, py = p.y + 10 - sy, u = clamp(px * cx + py * cy, 0, L), qx = sx + cx * u - p.x - 3, qy = sy + cy * u - p.y - 10; if (qx * qx + qy * qy < (w + 6) ** 2) hitP(b, dmg, { kx: sign(cx) * 3, ky: -2 }); }
}
const aimTrail = (b, ang, len, col) => G.trails.push({ kind: 'aim', x: b.x + b.w / 2, y: b.y + b.h / 2, x2: b.x + b.w / 2 + cos(ang) * len, y2: b.y + b.h / 2 + sin(ang) * len, life: 2, max: 2, col: col || '#ff3b2a' });
function drawBeamTrail(f, t, u) {
  f.globalAlpha = t.kind === 'aim' ? .35 + .3 * ((G.time >> 2) & 1) : u; f.strokeStyle = t.kind === 'aim' ? t.col : t.col; f.lineWidth = t.kind === 'aim' ? 1 : t.w * 2;
  f.beginPath(); f.moveTo(t.x, t.y); f.lineTo(t.x2, t.y2); f.stroke(); if (t.kind === 'beam') { f.strokeStyle = '#ffffff'; f.lineWidth = max(1, t.w * .8); f.beginPath(); f.moveTo(t.x, t.y); f.lineTo(t.x2, t.y2); f.stroke(); }
  f.globalAlpha = 1;
}
// small creature art
function buildDimMobs() {
  const S = (k, rows, pal) => { MOBSPR[k] = spr(rows, pal); };
  const sl = { a: '#a8705a', b: '#6a3e36', c: '#ffb347', d: '#3a2020' };
  S('slag0', ['..aaaa..', '.abbbba.', 'abcbbcba', 'bbbbbbbb', 'bcbbbbcb', '.dd..dd.'], sl); S('slag1', ['........', '..aaaa..', '.abbbba.', 'abcbbcba', 'bbbbbbbb', 'dddddddd'], sl);
  const im = { w: '#7a2a22', a: '#c94a2a', b: '#fff1a8', c: '#ffd35a', d: '#5a1a10' };
  S('imp0', ['w.......w', 'ww.aaa.ww', '.wabcbaw.', '..aaaaa..', '...ada...', '...a.a...'], im); S('imp1', ['.........', '...aaa...', 'wwabcbaww', 'w.aaaaa.w', '...ada...', '...a.a...'], im);
  const br = { a: '#7a8090', b: '#3a3e4a', c: '#ff8a3d', d: '#5a6070', e: '#ff6a2a' }, brT = ['....aaaaa.....', '...abbbbba....', '...bcbbcbb....', '...bbbbbbb....', '.aabbbbbbbaa..', 'abbbbbbbbbbba.', 'bbbebbbbbebbb.', 'bbb.bbbbb.bbb.', 'bb..bbbbb..bb.', 'dd..bbebb..dd.', 'dd..bbbbb..dd.'];
  S('brute0', brT.concat(['....bb.bb.....', '...bbb.bbb....', '...bb...bb....', '..abb...bba...', '..bbb...bbb...']), br); S('brute1', brT.concat(['....bb.bb.....', '....bbbbb.....', '....bb.bb.....', '...abb.bba....', '...bbb.bbb....']), br);
  S('wraith', ['...aaaa...', '..abbbba..', '.abcbbcba.', '.abbbbbba.', 'abbbbbbbba', 'abbbbbbbba', '.bbbbbbbb.', '.bbbbbbbb.', '..bbbbbb..', '..b.bb.b..', '.b..b...b.'], { a: '#e0dae8', b: '#8d8794', c: '#ff7a2a' });
  const el = { a: '#ff9a3d', b: '#c94a2a', c: '#fff1a8', d: '#7a2a14' };
  S('eel0', ['..aaaaaaaa....', '.abbbbbbbbaa..', 'abcbbbbbbbbbaa', '.addddddddd...'], el); S('eel1', ['...aaaaaaaa...', '.aabbbbbbbbaa.', 'abcbbbbbbbbbba', '.adddddddddd..'], el);
  const sp = { a: '#2fb8a8', b: '#1e6a64', c: '#c8fff0', d: '#c8b8a0', e: '#120d1f' }, spT = ['..aaaa..', '.abbbba.', 'abcbbcba', 'aaaaaaaa', '..dddd..', '..deed..', '..dddd..'];
  S('spore0', spT.concat(['..d..d..', '.dd..dd.']), sp); S('spore1', spT.concat(['...dd...', '..dd.dd.']), sp);
  const hd = { a: '#3a4a5a', b: '#1e2a34', c: '#6ff0c0', d: '#141c24' }, hdT = ['..........aa.', '.........abba', '.aaaaaaaaabcb', 'abbbbbbbbbbb.', 'bbbbbbbbbbb..'];
  S('hound0', hdT.concat(['.dd.....dd...', '.d.d...d.d...', '.d..d..d..d..']), hd); S('hound1', hdT.concat(['..dd...dd....', '..dd...dd....', '.d..d.d..d...']), hd);
  const mo = { a: '#c9a44a', b: '#8a6a3a', c: '#fff1a8' };
  S('moth0', ['aa......aa', 'abb.cc.bba', '.abbccbba.', '..bbccbb..', '...b..b...'], mo); S('moth1', ['..........', 'aabb..bbaa', 'abbbccbbba', '..bbccbb..', '...b..b...'], mo);
  const sh = { a: '#ffffff', b: '#c9b4f0', c: '#7a4ad0', d: '#8a7ab0' };
  S('shard0', ['...a....', '..aba...', '.abbba..', 'abbcbba.', 'abbbbbba', '.dd..dd.'], sh); S('shard1', ['....a...', '...aba..', '..abbba.', '.abbcbba', 'abbbbbba', 'dd....dd'], sh);
  const vr = { a: '#6a5ab0', b: '#1e1636', c: '#e0c8ff' };
  S('vray0', ['aa..............aa', '.abb..........bba.', '..abbbbbbbbbbbba..', '....bbbccbbbb.....', '.......bb.........'], vr); S('vray1', ['..................', 'aabb..........bbaa', '.abbbbbbbbbbbbbba.', '....bbbccbbbb.....', '........bb........'], vr);
  const mw = { a: '#e8d8d0', b: '#8a6a6a', c: '#ff3b2a' }, mwT = ['...aaa...', '..abbba..', '..bcbcb..', '..bbbbb..', '.abbbbba.', 'abbbbbbba', 'b.bbbbb.b', 'b.bbbbb.b'];
  S('wretch0', mwT.concat(['..bb.bb..', '..b...b..', '.bb...bb.']), mw); S('wretch1', mwT.concat(['..bb.bb..', '...b.b...', '..bb.bb..']), mw);
  S('starling', ['..a..', '.aba.', 'abcba', '.aba.', '..a..'], { a: '#c9fff6', b: '#ffffff', c: '#fff1a8' });
  S('umbral', ['...aaaa...', '..abbbba..', '..bcbbcb..', '..bbbbbb..', '...dddd...', '.aaddddaa.', 'abbddddbba', 'abbddddbbe', 'abbddddbbe', '.bbddddbbe', '..dddddd.e', '..bbbbbb..', '..bb..bb..', '..bb..bb..', '..bb..bb..', '.bbb..bbb.'], { a: '#8a84a0', b: '#3a3450', c: '#b49cff', d: '#1e1830', e: '#c9b4f0' });
}
const rc = (c, col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
const frameOf = (e, a, b, k = 1) => ((e.ph * k) | 0) % 2 ? MOBSPR[b] : MOBSPR[a];
// ================= Cinderdeep =================
mob('slagling', { w: 8, h: 6, hp: 70, dmg: 18, contact: false, canStep: true, kbRes: .2, name: 'Slagling', burnT: 90, glow: [.45, .18, .05] }, (e, p, dx, dy, dist) => {
  grav(e, .24);
  if (e.onGround) { e.vx *= .7; if (e.t > e.wait) { const near = dist < 200 && !p.dead; e.dir = near ? (sign(dx) || 1) : (Math.random() < .5 ? -1 : 1); e.vy = -(2.6 + frand(1.3)); e.vx = e.dir * (near ? 1.5 + frand(.6) : .6); e.t = 0; e.wait = 24 + frand(36); e.sq = -1; } }
  const wg = e.onGround; moveBody(e); if (!wg && e.onGround) { e.sq = 1; dust(e.x + 4, e.y + e.h, 2, '#4a2a26'); if (Math.random() < .3) P(e.x + 4, e.y + e.h - 1, frand(-.3, .3), -.6, 30, '#ff8a3d', { glow: 1, g: .02 }); } e.sq *= .86;
  touch(e, p);
}, (e, x, y, o) => { const s = e.sq; drawEnt(32, 16, 24, c => { c.scale(1 + s * .3, 1 - s * .3); c.drawImage(e.onGround ? MOBSPR.slag0 : MOBSPR.slag1, -4, -6); }, x + e.w / 2, y + e.h, { flash: o.flash, ly: -3, unlit: 1 }); });
mob('cinderimp', { w: 8, h: 7, hp: 60, dmg: 16, contact: false, fly: true, name: 'Cinder Imp', glow: [.6, .26, .06] }, (e, p, dx, dy, dist) => {
  e.ph += .3; if (e.a === undefined) e.a = frand(TAU);
  if (p.dead || dist > 320) flyTo(e, e.x + e.w / 2 + sin(e.t * .02) * 30, e.y + e.h / 2 + cos(e.t * .03) * 10, .05, .8);
  else {
    e.a += .02; e.dir = sign(dx) || 1; flyTo(e, p.x + 3 + cos(e.a) * 90, p.y - 40 + sin(e.a * 2) * 16, .08, 1.6);
    if (e.state === 'idle' && e.t > 90 + (e.seed % 50)) { e.state = 'tele'; e.t = 0; }
    else if (e.state === 'tele' && e.t > 22) { shootAt(e, p, { col: '#ff8a3d', col2: '#fff1a8', sz: 2, burn: true, sp: 2.6, light: [.8, .35, .1] }); sfx('fire', 40); e.state = 'idle'; e.t = 0; }
  }
  moveBody(e);
}, (e, x, y, o) => drawEnt(32, 16, 16, c => { c.scale(e.dir || 1, 1); c.drawImage(frameOf(e, 'imp0', 'imp1', .5), -4, -3); }, x + e.w / 2, y + e.h / 2, { flash: o.flash || (e.state === 'tele' && (e.t >> 1) & 1), unlit: 1 }));
mob('basaltbrute', { w: 13, h: 16, hp: 260, dmg: 26, contact: false, canStep: true, kbRes: .75, armor: .8, name: 'Basalt Brute' }, (e, p, dx, dy, dist) => {
  if (e.cd > 0) e.cd--;
  if (e.state === 'idle' || e.state === 'chase') { walker(e, p, dx, dy, dist, .55, 230); if (dist < 44 && abs(dy) < 30 && !(e.cd > 0) && !p.dead) { e.state = 'wind'; e.t = 0; sfx('tele'); } return; }
  grav(e, .3);
  if (e.state === 'wind') { e.vx *= .8; if (e.t > 34) { e.state = 'slam'; e.t = 0; addShake(5); sfx('boom', 30); for (const s of [-1, 1]) spawnProj({ type: 'shock', x: e.x + e.w / 2 + s * 8, y: e.y + e.h - 4, vx: s * 2.6, vy: 0, r: 5, dmg: 18, life: 60 }); if (abs(dx) < 30 && abs(dy) < 26) hitP(e, e.dmg, { kx: (sign(dx) || 1) * 4, ky: -3 }); dust(e.x + e.w / 2, e.y + e.h, 10, '#4a5060', 1.6); } }
  else if (e.state === 'slam') { e.vx = 0; if (e.t > 40) { e.state = 'idle'; e.t = 0; e.cd = 60; } }
  moveBody(e);
}, (e, x, y, o) => drawEnt(48, 24, 40, c => { c.scale(e.dir || 1, 1); const up = e.state === 'wind' ? -min(4, e.t / 6) : e.state === 'slam' && e.t < 6 ? 3 : 0; c.translate(0, up * .3); c.drawImage(frameOf(e, 'brute0', 'brute1', .3), -7, -16); if (up) { rc(c, '#5a6070', -9, -10 + up, 3, 4); rc(c, '#5a6070', 6, -10 + up, 3, 4); } }, x + e.w / 2, y + e.h, { flash: o.flash || (e.state === 'wind' && (e.t >> 2) & 1), ly: -8 }));
mob('ashwraith', { w: 9, h: 12, hp: 90, dmg: 18, contact: false, fly: true, name: 'Ash Wraith', glow: [.25, .12, .06] }, (e, p, dx, dy, dist) => {
  e.ph += .1; if (e.alpha === undefined) e.alpha = 1;
  if (e.state === 'idle') { e.vx = approach(e.vx, clamp(dx * .02, -.9, .9), .04); e.vy = approach(e.vy, clamp(dy * .02 + sin(e.t * .05) * .3, -.7, .7), .04); if (dist < 26) touch(e, p); if (e.t > 160 && dist < 170 && !p.dead) { e.state = 'fade'; e.t = 0; } }
  else if (e.state === 'fade') { e.alpha = max(0, 1 - e.t / 30); e.noHit = e.t > 15; if (e.t > 30) { e.x = p.x + 3 + (Math.random() < .5 ? -1 : 1) * 42 - e.w / 2; e.y = p.y - 18; e.px = e.x; e.py = e.y; e.vx = e.vy = 0; e.state = 'appear'; e.t = 0; } }
  else if (e.state === 'appear') { e.alpha = min(1, e.t / 20); e.noHit = false; if (e.t > 20) { const d = hypot(dx, dy) || 1; e.vx = dx / d * 3; e.vy = dy / d * 3; e.state = 'lunge'; e.t = 0; e.hitP = false; sfx('tele'); } }
  else if (e.state === 'lunge') { if (!e.hitP && overlap(e, p) && !p.dead) { e.hitP = true; hitP(e, e.dmg); } e.vx *= .97; e.vy *= .97; if (e.t > 40) { e.state = 'idle'; e.t = 0; } }
  e.x += e.vx; e.y += e.vy;
}, (e, x, y, o) => drawEnt(32, 16, 16, c => { c.drawImage(MOBSPR.wraith, -5, -6 + sin(G.time * .08 + e.seed) * 1.5); }, x + e.w / 2, y + e.h / 2, { flash: o.flash, alpha: .72 * (e.alpha === undefined ? 1 : e.alpha), unlit: 1 }));
mob('cindereel', { w: 13, h: 4, hp: 80, dmg: 20, contact: false, name: 'Cinder Eel', burnT: 120, glow: [.5, .2, .05] }, (e, p, dx, dy, dist) => {
  e.ph += .2; const inL = liqAt(e.x + e.w / 2, e.y + e.h / 2) === 2;
  if (inL && e.state !== 'leap') { e.vy = approach(e.vy, sin(e.t * .05) * .3, .1); e.vx = approach(e.vx, (e.dir || 1) * .8, .05); if (e.hitWall) e.dir = -(e.dir || 1); if (dist < 100 && dy < 4 && e.t > 70 && !p.dead) { e.state = 'leap'; e.t = 0; e.vy = -4.6; e.vx = clamp(dx * .035, -2.4, 2.4); e.dir = sign(dx) || 1; burst(e.x + 6, e.y, 10, ['#ff8a3d', '#ffd35a'], 1.6, 20, { glow: 1 }); e.hitP = false; } }
  else { grav(e, .2); if (e.state === 'leap') { if (!e.hitP && overlap(e, p)) { e.hitP = true; touch(e, p); } if (e.t > 8 && inL) { e.state = 'swim'; e.t = 0; } } if (!inL && e.onGround) { e.vx *= .8; if ((e.flop = (e.flop || 0) + 1) > 240) e.hp = 0; if (e.hp <= 0) killEnemy(e); } }
  moveBody(e);
}, (e, x, y, o) => drawEnt(32, 16, 16, c => { c.scale(e.dir || 1, 1); if (e.state === 'leap') c.rotate(clamp(e.vy * .15, -.6, .6)); c.drawImage(frameOf(e, 'eel0', 'eel1', .4), -7, -2); }, x + e.w / 2, y + e.h / 2, { flash: o.flash, unlit: 1 }));
// ================= Rootdark =================
mob('sporeling', { w: 7, h: 9, hp: 80, dmg: 18, contact: false, canStep: true, name: 'Sporeling', glow: [.05, .25, .22] }, (e, p, dx, dy, dist) => {
  if (e.state === 'puff') { grav(e); e.vx *= .8; moveBody(e); if (e.t > 26) { sporeCloud(e.x + e.w / 2, e.y + 2, 1); e.state = 'idle'; e.t = 0; e.cd = 120; } return; }
  if (e.cd > 0) e.cd--; walker(e, p, dx, dy, dist, .7, 200);
  if (dist < 26 && !(e.cd > 0) && !p.dead) { e.state = 'puff'; e.t = 0; sfx('tele'); }
}, (e, x, y, o) => { const sw = e.state === 'puff' ? 1 + min(.4, e.t / 50) : 1; drawEnt(32, 16, 26, c => { c.scale((e.dir || 1) * sw, sw); c.drawImage(frameOf(e, 'spore0', 'spore1', .5), -4, -9); }, x + e.w / 2, y + e.h, { flash: o.flash || (e.state === 'puff' && (e.t >> 2) & 1), ly: -4 }); });
mob('rootlasher', { w: 8, h: 12, hp: 120, dmg: 22, contact: false, kbRes: 1, noKb: true, name: 'Root Lasher' }, (e, p, dx, dy, dist) => {
  grav(e); e.vx = 0; moveBody(e); if (e.cd > 0) e.cd--; e.dir = sign(dx) || e.dir || 1;
  if (e.state === 'idle' && dist < 58 && abs(dy) < 30 && !(e.cd > 0) && !p.dead) { e.state = 'wind'; e.t = 0; sfx('tele'); }
  else if (e.state === 'wind' && e.t > 20) { e.state = 'lash'; e.t = 0; e.hitP = false; }
  else if (e.state === 'lash') { if (!e.hitP && e.t > 3 && e.t < 12 && abs(dx) < 56 && abs(dy) < 30) { e.hitP = true; hitP(e, e.dmg, { kx: (e.dir) * 4, ky: -2.5 }); } if (e.t > 24) { e.state = 'idle'; e.t = 0; e.cd = 50; } }
}, (e, x, y, o) => drawEnt(96, 48, 40, c => {
  c.scale(e.dir || 1, 1); const sway = sin(G.time * .05 + e.seed) * 1.5, lash = e.state === 'lash' ? min(1, e.t / 6) * (e.t < 18 ? 1 : max(0, 1 - (e.t - 18) / 6)) : 0, wind = e.state === 'wind' ? min(1, e.t / 20) : 0;
  rc(c, '#3a5a3a', -1, -10, 2, 10); rc(c, '#4a3a2a', -3, -1, 6, 1);
  c.save(); c.translate(sway - wind * 2, -11); rc(c, '#6a2a3a', -4, -3, 8, 6); rc(c, '#a83a4a', -3, -4, 6, 5); rc(c, '#ffd35a', 1, -2, 2, 2); c.restore();
  if (lash > 0) { c.strokeStyle = '#3a5a3a'; c.lineWidth = 2; c.beginPath(); c.moveTo(2, -11); c.quadraticCurveTo(24 * lash, -20, 52 * lash, -6); c.stroke(); rc(c, '#a83a4a', 52 * lash - 2, -8, 4, 3); }
}, x + e.w / 2, y + e.h, { flash: o.flash || (e.state === 'wind' && (e.t >> 1) & 1), ly: -6 }));
mob('gloamhound', { w: 12, h: 7, hp: 110, dmg: 20, contact: false, canStep: true, kbRes: .3, name: 'Gloam Hound', glow: [.02, .14, .1] }, (e, p, dx, dy, dist) => {
  if (e.cd > 0) e.cd--;
  if (e.state === 'crouch') { grav(e); e.vx *= .7; moveBody(e); if (e.t > 14) { e.state = 'pounce'; e.t = 0; e.vy = -3.2; e.vx = e.dir * 3.6; e.hitP = false; } return; }
  if (e.state === 'pounce') { grav(e); moveBody(e); if (!e.hitP && overlap(e, p) && !p.dead) { e.hitP = true; hitP(e, e.dmg, { kx: e.dir * 3 }); } if (e.onGround && e.t > 6) { e.state = 'idle'; e.t = 0; e.cd = 50; } return; }
  walker(e, p, dx, dy, dist, 2, 320); if (e.onGround && dist < 76 && dist > 22 && !(e.cd > 0) && !p.dead) { e.state = 'crouch'; e.t = 0; }
}, (e, x, y, o) => drawEnt(32, 16, 24, c => { c.scale(-(e.dir || 1), 1); if (e.state === 'pounce') c.rotate(-.2); c.drawImage(frameOf(e, 'hound0', 'hound1', .4), -6, -8 + (e.state === 'crouch' ? 1 : 0)); }, x + e.w / 2, y + e.h, { flash: o.flash, ly: -3 }));
mob('lanternmoth', { w: 9, h: 5, hp: 40, dmg: 12, contact: false, fly: true, name: 'Lantern Moth', glow: [.55, .48, .25] }, (e, p, dx, dy, dist) => {
  e.ph += .45; if (e.a === undefined) e.a = frand(TAU);
  if (e.state === 'dive') { if (!e.hitP && overlap(e, p) && !p.dead) { e.hitP = true; hitP(e, e.dmg); } if (e.t > 30 || e.hitWall) { e.state = 'idle'; e.t = 0; } }
  else { e.a += .045 + sin(e.t * .07) * .02; const tx = p.x + 3 + cos(e.a) * 50, ty = p.y - 10 + sin(e.a * 1.3) * 26; flyTo(e, tx, ty, .1, 1.8); if (e.t > 120 && dist < 90 && !p.dead) { const d = hypot(dx, dy) || 1; e.vx = dx / d * 3.4; e.vy = dy / d * 3.4; e.state = 'dive'; e.t = 0; e.hitP = false; } }
  e.dir = sign(e.vx) || 1; moveBody(e);
}, (e, x, y, o) => drawEnt(32, 16, 16, c => { c.drawImage(frameOf(e, 'moth0', 'moth1', .5), -5, -3); }, x + e.w / 2, y + e.h / 2, { flash: o.flash, unlit: 1 }));
mob('mirestalker', { w: 7, h: 22, hp: 220, dmg: 28, contact: false, canStep: true, kbRes: .5, name: 'Mire Stalker' }, (e, p, dx, dy, dist) => {
  if (e.alpha === undefined) e.alpha = .2; if (e.cd > 0) e.cd--;
  if (e.state === 'idle') { grav(e); e.vx *= .8; moveBody(e); e.alpha = approach(e.alpha, .18, .02); if (dist < 64 && !p.dead) { e.state = 'chase'; e.t = 0; sfx('tele'); } return; }
  e.alpha = approach(e.alpha, 1, .06);
  if (e.state === 'chase') { walker(e, p, dx, dy, dist, 1.1, 300); if (dist > 280) { e.state = 'idle'; e.t = 0; } if (dist < 34 && !(e.cd > 0)) { e.state = 'swipe'; e.t = 0; e.n = 0; } return; }
  grav(e); e.vx *= .8; moveBody(e);
  if (e.state === 'swipe') { if ((e.t === 16 || e.t === 30) && abs(dx) < 36 && abs(dy) < 30) hitP(e, e.dmg, { kx: e.dir * 3.5, ky: -2 }); if (e.t > 40) { e.state = 'chase'; e.t = 0; e.cd = 50; } }
}, (e, x, y, o) => drawEnt(64, 32, 40, c => {
  c.scale(e.dir || 1, 1); const sw = e.state === 'swipe' ? sin(min(1, (e.t % 14) / 14) * PI) : 0, step = sin(e.ph * .8) * 2;
  rc(c, '#2a3a30', -2, -10, 1, 10 + step * .2); rc(c, '#2a3a30', 1, -10, 1, 10 - step * .2); rc(c, '#3a4a3a', -3, -21, 6, 12); rc(c, '#4a5a44', -2, -20, 4, 9); rc(c, '#2a3a30', -3, -25, 6, 5); rc(c, '#c8e8a0', 1, -24, 2, 1);
  c.save(); c.translate(2, -18); c.rotate(-.4 + sw * 1.8); rc(c, '#2a3a30', 0, 0, 2, 14); rc(c, '#c8e8a0', 0, 13, 3, 2); c.restore();
}, x + e.w / 2, y + e.h, { flash: o.flash, alpha: e.alpha, ly: -10 }));
// ================= the Glass Expanse =================
mob('shardling', { w: 7, h: 6, hp: 90, dmg: 22, contact: false, canStep: true, armor: .85, name: 'Shardling', glow: [.15, .12, .25] }, (e, p, dx, dy, dist) => {
  grav(e, .26);
  if (e.onGround) { e.vx *= .7; if (e.t > e.wait) { const near = dist < 220 && !p.dead; e.dir = near ? (sign(dx) || 1) : (Math.random() < .5 ? -1 : 1); e.vy = -(3 + frand(1.4)); e.vx = e.dir * (near ? 1.8 + frand(.6) : .7); e.t = 0; e.wait = 20 + frand(30); } }
  moveBody(e); touch(e, p);
}, (e, x, y, o) => drawEnt(32, 16, 24, c => { c.scale(e.dir || 1, 1); c.drawImage(e.onGround ? MOBSPR.shard0 : MOBSPR.shard1, -4, -6); }, x + e.w / 2, y + e.h, { flash: o.flash, ly: -3, unlit: 1 }));
mob('mirrorwisp', { w: 8, h: 8, hp: 110, dmg: 22, contact: false, fly: true, name: 'Mirror Wisp', glow: [.35, .35, .55] }, (e, p, dx, dy, dist) => {
  e.ph += .1; if (e.alpha === undefined) e.alpha = 1;
  if (e.state === 'blink') { e.alpha = max(0, 1 - e.t / 12); e.noHit = true; if (e.t === 12) { const a = frand(TAU); e.x = e.px = p.x + 3 + cos(a) * 60 - e.w / 2; e.y = e.py = p.y + 4 + sin(a) * 30 - e.h / 2; e.vx = e.vy = 0; } if (e.t > 12) e.alpha = min(1, (e.t - 12) / 10); if (e.t > 22) { e.noHit = false; e.state = 'fire'; e.t = 0; } return; }
  if (e.state === 'fire') { e.vx *= .9; e.vy *= .9; if (e.t === 18) for (const k of [-.25, 0, .25]) { const a = atan2(dy, dx) + k; spawnProj({ type: 'orb', x: e.x + 4, y: e.y + 4, vx: cos(a) * 2.6, vy: sin(a) * 2.6, r: 2, dmg: 14, life: 120, col: '#e0c8ff', col2: '#ffffff', sz: 2, light: [.3, .3, .5] }); } if (e.t > 40) { e.state = 'idle'; e.t = 0; } e.x += e.vx; e.y += e.vy; return; }
  flyTo(e, p.x + 3 + sin(e.t * .02) * 70, p.y - 30 + cos(e.t * .03) * 20, .06, 1.4); if (e.t > 150 && dist < 260 && !p.dead) { e.state = 'blink'; e.t = 0; sfx('tele'); }
  moveBody(e);
}, (e, x, y, o) => drawEnt(32, 16, 16, c => {
  c.rotate(G.time * .03 + e.seed); rc(c, '#a58ae0', -4, -1, 8, 2); rc(c, '#a58ae0', -1, -4, 2, 8); rc(c, '#ffffff', -2, -2, 4, 4); rc(c, '#e0c8ff', -1, -1, 2, 2);
  for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + G.time * .06; rc(c, '#c9fff6', round(cos(a) * 6) - 1, round(sin(a) * 6) - 1, 2, 2); }
}, x + e.w / 2, y + e.h / 2, { flash: o.flash, alpha: e.alpha, unlit: 1 }));
mob('voidray', { w: 16, h: 5, hp: 160, dmg: 26, contact: false, fly: true, kbRes: .5, name: 'Void Ray' }, (e, p, dx, dy, dist) => {
  e.ph += .15; if (e.hx === undefined) { e.hx = e.x; e.hy = e.y; }
  if (e.state === 'swoop') { if (!e.hitP && overlap(e, p) && !p.dead) { e.hitP = true; hitP(e, e.dmg, { kx: sign(e.vx) * 3.5, ky: -2.5 }); } e.vy -= .06; if (e.t > 60) { e.state = 'idle'; e.t = 0; } }
  else { const a = e.t * .015; flyTo(e, p.x + 3 + cos(a) * 140, p.y - 70 + sin(a * 2) * 20, .05, 1.8); if (e.t > 140 && dist < 220 && !p.dead) { e.state = 'swoop'; e.t = 0; e.hitP = false; const d = hypot(dx, dy) || 1; e.vx = dx / d * 4; e.vy = dy / d * 4; sfx('tele'); } }
  e.dir = sign(e.vx) || e.dir || 1; e.x += e.vx; e.y += e.vy;
}, (e, x, y, o) => drawEnt(32, 16, 16, c => { c.scale(e.dir || 1, 1); c.rotate(clamp(e.vy * .1, -.4, .4)); c.drawImage(frameOf(e, 'vray0', 'vray1', .5), -9, -3); }, x + e.w / 2, y + e.h / 2, { flash: o.flash, ly: 0 }));
mob('glasssentinel', { w: 11, h: 11, hp: 300, dmg: 30, contact: false, fly: true, kbRes: .95, armor: .8, name: 'Glass Sentinel', glow: [.4, .35, .6] }, (e, p, dx, dy, dist) => {
  if (e.hx === undefined) { e.hx = e.x; e.hy = e.y; } e.ph += .05;
  const tx = e.hx + sin(e.t * .01) * 20, ty = e.hy + sin(e.t * .02) * 6; e.vx = approach(e.vx, clamp((tx - e.x) * .02, -.5, .5), .03); e.vy = approach(e.vy, clamp((ty - e.y) * .02, -.5, .5), .03);
  if (e.state === 'idle' && e.t > 100 && dist < 230 && !p.dead) { e.state = 'aim'; e.t = 0; e.ang = atan2(dy, dx); sfx('tele'); }
  else if (e.state === 'aim') { e.ang += clamp(atan2(dy, dx) - e.ang, -.03, .03); aimTrail(e, e.ang, 230, '#e0c8ff'); if (e.t > 50) { e.state = 'beam'; e.t = 0; sfx('boom', 40); } }
  else if (e.state === 'beam') { fireBeam(e, e.ang, 230, 2, e.dmg, '#e0c8ff'); if (e.t > 16) { e.state = 'idle'; e.t = 0; } }
  e.x += e.vx; e.y += e.vy;
}, (e, x, y, o) => drawEnt(32, 16, 16, c => {
  const a = e.ang === undefined ? 0 : e.ang; rc(c, '#4a3a8a', -5, -5, 10, 10); c.save(); c.rotate(PI / 4 + e.ph); rc(c, '#a58ae0', -4, -4, 8, 8); c.restore(); rc(c, '#ffffff', -3, -3, 6, 6);
  rc(c, e.state === 'aim' && (e.t >> 2) & 1 ? '#ff3b2a' : '#7a4ad0', round(cos(a) * 2) - 1, round(sin(a) * 2) - 1, 3, 3);
}, x + e.w / 2, y + e.h / 2, { flash: o.flash, unlit: 1 }));
// ================= things that walk only when the sky changes =================
mob('moonwretch', { w: 6, h: 14, hp: 90, dmg: 20, contact: false, canStep: true, name: 'Moonwretch', glow: [.3, .04, .03] }, (e, p, dx, dy, dist) => {
  if (e.cd > 0) e.cd--;
  if (e.state === 'leap') { grav(e); moveBody(e); if (!e.hitP && overlap(e, p) && !p.dead) { e.hitP = true; hitP(e, e.dmg, { kx: e.dir * 3 }); } if (e.onGround && e.t > 5) { e.state = 'idle'; e.t = 0; e.cd = 40; } return; }
  walker(e, p, dx, dy, dist, 1.9, 400); if (e.onGround && dist < 60 && dist > 16 && !(e.cd > 0) && !p.dead) { e.state = 'leap'; e.t = 0; e.vy = -3.4; e.vx = e.dir * 3.2; e.hitP = false; }
}, (e, x, y, o) => drawEnt(32, 16, 26, c => { c.scale(e.dir || 1, 1); if (e.state === 'leap') c.rotate(.3); c.drawImage(frameOf(e, 'wretch0', 'wretch1', .5), -5, -14); }, x + e.w / 2, y + e.h, { flash: o.flash, ly: -7 }));
mob('starling', { w: 5, h: 5, hp: 30, dmg: 12, contact: false, fly: true, name: 'Starling', glow: [.4, .5, .5] }, (e, p, dx, dy, dist) => {
  e.ph += .4; if (e.a === undefined) { e.a = frand(TAU); e.next = 80 + frand(80); }
  if (e.state === 'dart') { if (!e.hitP && overlap(e, p) && !p.dead) { e.hitP = true; hitP(e, e.dmg); } if (e.t > 24 || e.hitWall) { e.state = 'idle'; e.t = 0; e.next = 70 + frand(90); } }
  else if (e.state === 'tele') { e.vx *= .8; e.vy *= .8; if (e.t > 16) { const d = hypot(dx, dy) || 1; e.vx = dx / d * 4.4; e.vy = dy / d * 4.4; e.state = 'dart'; e.t = 0; e.hitP = false; } }
  else { e.a += .04; flyTo(e, p.x + 3 + cos(e.a) * 40, p.y + sin(e.a) * 22 - 16, .14, 2.2); if (e.t > e.next && dist < 120 && !p.dead) { e.state = 'tele'; e.t = 0; } }
  moveBody(e);
}, (e, x, y, o) => drawEnt(32, 16, 16, c => { c.rotate(e.ph * .3); c.drawImage(MOBSPR.starling, -2, -2); }, x + e.w / 2, y + e.h / 2, { flash: o.flash || (e.state === 'tele' && (e.t >> 1) & 1), unlit: 1 }));
mob('umbralknight', { w: 8, h: 20, hp: 420, dmg: 30, contact: false, canStep: true, kbRes: .8, name: 'Umbral Knight', glow: [.18, .1, .3] }, (e, p, dx, dy, dist) => {
  if (e.cd > 0) e.cd--; const facing = (sign(dx) || 1) === (e.dir || 1);
  e.armor = facing && e.state !== 'swing' && e.state !== 'recover' ? .35 : 1;
  if (e.state === 'idle' || e.state === 'chase') { walker(e, p, dx, dy, dist, .8, 320); if (dist < 40 && abs(dy) < 30 && !(e.cd > 0) && !p.dead) { e.state = 'wind'; e.t = 0; sfx('tele'); } else if (dist > 60 && dist < 110 && !(e.cd > 0) && Math.random() < .01) { e.state = 'lunge'; e.t = 0; } return; }
  grav(e); moveBody(e);
  if (e.state === 'wind') { e.vx *= .8; if (e.t > 30) { e.state = 'swing'; e.t = 0; if (abs(dx) < 42 && abs(dy) < 30 && facing) hitP(e, e.dmg, { kx: e.dir * 4.5, ky: -3 }); G.trails.push({ kind: 'arc', x: e.x + 4, y: e.y + 8, face: e.dir, a0: -1.6, a1: 1.1, r0: 6, r1: 34, life: 10, max: 10, sty: ['#7a4ad0', '#e0d2ff'] }); } }
  else if (e.state === 'swing') { e.vx = 0; if (e.t > 12) { e.state = 'recover'; e.t = 0; } }
  else if (e.state === 'recover') { e.vx = 0; if (e.t > 40) { e.state = 'idle'; e.t = 0; e.cd = 40; } }
  else if (e.state === 'lunge') { if (e.t < 20) e.vx *= .8; else if (e.t === 20) { e.vx = e.dir * 4.5; e.hitP = false; } else { if (!e.hitP && overlap(e, p)) { e.hitP = true; hitP(e, e.dmg, { kx: e.dir * 4 }); } e.vx *= .93; if (e.t > 50) { e.state = 'recover'; e.t = 0; } } }
}, (e, x, y, o) => drawEnt(48, 24, 36, c => {
  c.scale(e.dir || 1, 1); c.drawImage(MOBSPR.umbral, -5, -20); const up = e.state === 'wind' ? -min(1, e.t / 20) : 0;
  c.save(); c.translate(4, -12); c.rotate(up * 1.6 + (e.state === 'swing' ? 1.2 : 0)); rc(c, '#c9b4f0', 0, -1, 14, 2); rc(c, '#ffffff', 10, -1, 4, 1); c.restore();
  rc(c, '#3a3450', -7, -15, 3, 9); rc(c, '#8a84a0', -7, -14, 1, 7);
}, x + e.w / 2, y + e.h, { flash: o.flash || (e.state === 'wind' && (e.t >> 2) & 1), ly: -10 }));
mob('fogwalker', { w: 7, h: 24, hp: 150, dmg: 24, contact: false, canStep: true, kbRes: .5, name: 'Fogwalker', slowT: 90 }, (e, p, dx, dy, dist) => {
  e.alpha = clamp(1 - (dist - 40) / 60, .04, 1); e.noHit = dist > 110;
  walker(e, p, dx, dy, dist, .55, 500); if (dist < 16 && (e.cd = (e.cd || 0) - 1) <= 0) { if (hitP(e, e.dmg)) applyStatus(p, 'frost', e, { d: 90 }); e.cd = 50; }
}, (e, x, y, o) => drawEnt(48, 24, 40, c => {
  c.scale(e.dir || 1, 1); const sw = sin(e.ph * .6) * 1.5; rc(c, '#cfc8dc', -3, -23, 6, 6); rc(c, '#120d1f', 0, -21, 2, 1); rc(c, '#a8a0b8', -4, -17, 8, 11); rc(c, '#8a8296', -3, -6, 2, 6 + sw * .3); rc(c, '#8a8296', 1, -6, 2, 6 - sw * .3);
  rc(c, '#a8a0b8', 3, -16, 2, 12); rc(c, '#a8a0b8', -5, -16, 2, 10);
}, x + e.w / 2, y + e.h, { flash: o.flash, alpha: (e.alpha || 0) * .85, ly: -12 }));
// what they leave behind
Object.assign(DROPS, {
  slagling: [['slagrock', .8, 1, 3], ['cinder', .6, 1, 3], ['cinderite_ore', .15, 1, 2]], cinderimp: [['cinder', .9, 1, 3], ['cinder_gland', .3, 1, 1], ['membrane', .3, 1, 1]],
  basaltbrute: [['basalt', 1, 2, 5], ['slag_heart', .5, 1, 1], ['cinderite_ore', .5, 2, 4], ['shard', .2, 1, 2]], ashwraith: [['hollow_ash', .8, 1, 3], ['ash', .6, 2, 4], ['shard', .12, 1, 1]],
  cindereel: [['scale', .8, 1, 2], ['cinder_gland', .5, 1, 1], ['meat', .4, 1, 1]],
  sporeling: [['spore_dust', 1, 1, 3], ['glowcap', .3, 1, 1], ['fungus', .3, 1, 2]], rootlasher: [['rootwood', .9, 1, 3], ['fiber', .6, 2, 4], ['spore_dust', .3, 1, 1]],
  gloamhound: [['gloam_fang', .7, 1, 2], ['hide', .7, 1, 2], ['meat', .8, 1, 2]], lanternmoth: [['moth_wax', .9, 1, 2], ['membrane', .4, 1, 1]], mirestalker: [['gloom_ore', .8, 2, 4], ['hide', .5, 1, 2], ['spore_dust', .5, 1, 2]],
  shardling: [['shardglass', .9, 1, 3], ['prism_dust', .5, 1, 2], ['prism_ore', .15, 1, 2]], mirrorwisp: [['prism_dust', .9, 1, 3], ['glass_wing', .3, 1, 1]], voidray: [['void_silk', .8, 1, 2], ['skysilk', .5, 1, 2]],
  glasssentinel: [['prism_ore', .9, 2, 4], ['prism_dust', .7, 2, 3], ['shardglass', .6, 2, 4]],
  moonwretch: [['moon_wax', .3, 1, 1], ['bone', .5, 1, 2], ['hollow_ash', .4, 1, 2]], starling: [['starshard', .18, 1, 1], ['glass_wing', .3, 1, 1]], umbralknight: [['umbral_shard', .4, 1, 1], ['steel_bar', .4, 1, 2], ['hollow_ash', .5, 1, 2]],
  fogwalker: [['hollow_ash', .7, 1, 3], ['cloth', .4, 1, 2], ['scroll', .06, 1, 1]], prismecho: []
});
function sporeCloud(x, y, big) { for (let k = 0; k < (big ? 3 : 1); k++) spawnProj({ type: 'cloud', x: x + frand(-6, 6), y: y + frand(-4, 2), vx: frand(-.3, .3), vy: -.06, g: 0, r: big ? 12 : 9, dmg: 4, life: 110, poison: true, pierce: true, col: '#6ff0c0' }); sfx('tele', 30); }
// ================= the guardians =================
const BOSSES = {
  slagtyrant: { flag: 'tyrantDead', down: 'THE TYRANT FALLS', sub: 'its core still beats. a Slagforge can use it', loot: [['tyrant_core', 1, 1], ['cinderite_ore', 14, 20], ['cinder_bar', 2, 4], ['shard', 3, 5], ['slag_heart', 1, 2]], cols: ['#ff8a3d', '#ffd35a', '#c94a2a', '#3a2426'], flash: '255,170,90', journal: 'tyrant', leads: ['rootkey'] },
  rootmother: { flag: 'rootmotherDead', down: 'THE ROOTMOTHER WITHERS', sub: 'a seed falls from what is left', loot: [['heartseed', 1, 1], ['gloom_ore', 14, 20], ['gloom_bar', 2, 4], ['spore_dust', 6, 10], ['moth_wax', 2, 4]], cols: ['#6ff0c0', '#2fb8a8', '#c8fff0', '#1e6a64'], flash: '140,255,210', journal: 'rootmother', leads: ['prismkey', 'eclipse'] },
  matriarch: { flag: 'matriarchDead', down: 'THE MATRIARCH SHATTERS', sub: 'the broken sky goes quiet', loot: [['prism_heart', 1, 1], ['prism_ore', 14, 20], ['prism_bar', 2, 4], ['starshard', 3, 5], ['void_silk', 2, 3]], cols: ['#ffffff', '#e0c8ff', '#9ad0ff', '#a58ae0'], flash: '240,230,255', journal: 'matriarch', leads: [] },
  shepherd: { flag: 'shepherdDead', down: 'THE SHEPHERD LIES DOWN', sub: 'the Ember Moon has no one to walk it now', loot: [['moon_wax', 3, 5], ['hollow_ash', 2, 4]], first: [['shepherd_bell', 1, 1]], cols: ['#ff3b2a', '#e8d8d0', '#8a6a6a'], flash: '255,120,110', journal: 'shepherd', leads: [] }
};
function bossSpawn(type, x, y) { const b = mkEnemy(type, x, y); Object.assign(b, { state: 'intro', t: 0, phase: 1, atkN: 0, leash: 0, dir: 1 }); b.px = b.x; b.py = b.y; G.boss = b; G.enemies.push(b); sfx('roar', 0); addShake(6); G.biomeT = 0; return b; }
function bossGone(b) { b.dead = true; for (const e of G.enemies) if (e.root === b || e.minion === b) e.dead = true; if (G.boss === b) G.boss = null; G.projs = G.projs.filter(q => q.owner); }
function bossLeash(b, cx, r, msg) { const p = G.p; if (p.dead || abs(p.x + 3 - cx) > r) { if (++b.leash > 240 && b.state !== 'dying') { bossGone(b); say(msg); return true; } } else b.leash = 0; return false; }
function bossPhase(b, msg) { if (b.phase === 1 && b.hp < b.maxhp * .5 && b.state !== 'dying') { b.phase = 2; G.flash = .5; G.flashCol = '255,255,255'; addShake(8); sfx('roar', 0); if (msg) say(msg); return true; } return false; }
function bossDying(b) { const I = BOSSES[b.type] || BOSSES.shepherd; b.invuln = true; if (b.t % 5 === 0) { burst(b.x + frand(b.w), b.y + frand(b.h), 8, I.cols, 2.2, 30, { glow: 1 }); addShake(2); sfx('hit2', 60); } if (b.t > 110) bossDown(b); }
function bossDown(b) {
  if (netHost() && b.nid) sendAll({ t: 'bossdown', id: b.nid });
  const cx = b.x + b.w / 2, cy = b.y + b.h / 2, F = G.flags, I = BOSSES[b.type], first = !F[I.flag];
  bossGone(b); burst(cx, cy, 70, I.cols, 3.6, 64, { glow: 1 }); addShake(10); G.flash = .9; G.flashCol = I.flash; sfx('boom', 0); sfx('quest', 0);
  for (const [id, a, c] of I.loot.concat(first && I.first ? I.first : [])) spawnDrop(id, randi(a, c), cx + frand(-10, 10), cy - 4);
  F[I.flag] = true; G.dirty = true; G.kills = (G.kills || 0) + 1; beastKill(b.type);
  G.banner = { text: I.down, sub: first ? I.sub : 'it will wake again, given time', t: 0 };
  if (first) { unlock(I.journal); for (const id of I.leads) learn(id, true); if (b.type === 'slagtyrant') guardianFirst(); setTimeout(() => say('Some of its strength stays with you. You can take more punishment now.'), 10); }
}
function altarAct() {
  if (G.boss || !DIM) return; if (!payOffering(DIM_OFFER[DIMP[DIM].boss])) return; const D = DIMP[DIM], cx = DARENA_X * T + 4, gy = DARENA_Y * T, p = G.p, side = p.x + 3 < cx ? 1 : -1;
  const b = D.boss === 'slagtyrant' ? bossSpawn('slagtyrant', cx + side * 90 - 13, gy - 36) : D.boss === 'rootmother' ? bossSpawn('rootmother', cx - 17, gy - 40) : bossSpawn('matriarch', cx - 10, gy - 140);
  G.barT = 1; burst(cx, gy - 8, 30, BOSSES[b.type].cols, 2.6, 40, { glow: 1 }); G.flags['woke_' + b.type] = true;
}
// ---- the Slag Tyrant: walks, slams, spits, charges; cracks open at half health and calls rock down ----
mob('slagtyrant', { w: 26, h: 36, hp: 2600, dmg: 30, contact: false, noKb: true, boss: true, kbRes: 1, armor: .9, name: 'THE SLAG TYRANT', glow: [.95, .45, .14] }, (b, p, dx, dy, dist) => {
  const cx = DARENA_X * T + 4, R = (DIMP[1].arenaR - 3) * T, P2 = b.phase === 2, gy = DARENA_Y * T;
  grav(b, .3); if (b.hitCd > 0) b.hitCd--;
  if (b.state === 'dying') { b.vx *= .85; moveBody(b); bossDying(b); return; }
  if (bossLeash(b, cx, R + 34 * T, 'The Tyrant sinks back into its heat. The caldera waits.')) return;
  if (b.state !== 'charge' && b.state !== 'stagger') b.dir = sign(dx) || b.dir;
  switch (b.state) {
    case 'intro': b.invuln = true; b.vx = 0; if (b.t % 8 === 0) { addShake(3); dust(b.x + b.w / 2, b.y + b.h, 6, '#4a2a26', 1.4); } if (b.t > 150) { b.invuln = false; toIdle(b); } break;
    case 'idle': b.vx = approach(b.vx, b.dir * (P2 ? .8 : .55), .05); b.ph += abs(b.vx) * .2;
      if (b.t > (P2 ? 40 : 70)) { const r = Math.random(); b.t = 0; b.state = dist < 70 && r < .5 ? 'slamPrep' : r < .35 ? 'spitPrep' : r < .7 ? 'chargePrep' : P2 && r < .92 ? 'rainPrep' : 'slamPrep'; sfx('tele'); } break;
    case 'slamPrep': b.vx *= .8; if (b.t > (P2 ? 28 : 40)) { b.state = 'slam'; b.t = 0; addShake(8); sfx('boom', 0); for (const s of [-1, 1]) spawnProj({ type: 'shock', x: b.x + b.w / 2 + s * 14, y: b.y + b.h - 4, vx: s * (P2 ? 3.4 : 2.8), vy: 0, r: 5, dmg: 20, life: 90 }); if (abs(dx) < 36 && dy > -44) hitP(b, b.dmg, { kx: (sign(dx) || 1) * 4, ky: -3.5, fire: 1 }); dust(b.x + b.w / 2, b.y + b.h, 16, '#5a3634', 2); } break;
    case 'slam': b.vx = 0; if (b.t > 36) toIdle(b); break;
    case 'spitPrep': b.vx *= .8; if (b.t > 26) { b.state = 'spit'; b.t = 0; b.n = 0; } break;
    case 'spit': if (b.t % 9 === 0 && b.n < (P2 ? 5 : 3)) { b.n++; lob(b.x + b.w / 2 + b.dir * 6, b.y + 6, p.x + 3 + frand(-34, 34), p.y + 18, 38 + b.n * 4, { type: 'glob', r: 3, dmg: 18, burn: true, light: [.8, .35, .1] }); sfx('fire', 20); } if (b.t > 52) toIdle(b); break;
    case 'chargePrep': b.vx *= .7; if (b.t % 6 === 0) dust(b.x + b.w / 2 - b.dir * 10, b.y + b.h, 3, '#5a3634'); if (b.t > 30) { b.state = 'charge'; b.t = 0; b.dir = sign(dx) || 1; b.hitP = false; } break;
    case 'charge': b.vx = b.dir * (P2 ? 3.6 : 3); if (b.t % 3 === 0) dust(b.x + b.w / 2 - b.dir * 12, b.y + b.h, 2, '#5a3634'); if (!b.hitP && overlap(b, p) && !p.dead) { b.hitP = true; hitP(b, b.dmg + 4, { kx: b.dir * 5, ky: -3, fire: 1 }); }
      if (b.hitWall || abs(b.x + b.w / 2 + b.vx * 4 - cx) > R) { b.state = 'stagger'; b.t = 0; b.vx = -b.dir * 1.5; b.vy = -2; addShake(7); sfx('hit2', 0); b.vuln = 1.6; b.armor = 1; sparks(b.x + b.w / 2 + b.dir * 14, b.y + 10, 14, 0, 2.4); } else if (b.t > 110) toIdle(b); break;
    case 'stagger': b.vx *= .9; if (b.t % 10 === 0) P(b.x + b.w / 2, b.y - 4, frand(-.5, .5), -.5, 24, '#ffd35a', { glow: 1, g: 0 }); if (b.t > (P2 ? 80 : 110)) { b.vuln = 1; b.armor = .9; toIdle(b); } break;
    case 'rainPrep': b.vx = 0; if (b.t === 1) { sfx('roar', 0); addShake(5); } if (b.t > 30) { b.state = 'rain'; b.t = 0; } break;
    case 'rain': b.vx = 0; if (b.t % 12 === 0 && b.t < 96) { const x = clamp(p.x + 3 + frand(-60, 60), cx - R, cx + R); G.trails.push({ kind: 'warn', x, y: gy, life: 40, max: 40 }); G.dhaz.push({ kind: 'rock', x, y: gy - 170, vx: 0, vy: 0, delay: 34 }); } if (b.t > 110) toIdle(b); break;
  }
  bossPhase(b, 'The Tyrant cracks open. Its heat pours out.');
  if (b.state !== 'stagger' && b.state !== 'intro' && b.state !== 'charge' && overlap(b, p) && !(b.hitCd > 0)) { if (hitP(b, 14, { kx: (sign(dx) || 1) * 3, ky: -2, fire: 1 })) applyStatus(p, 'burn', b, { d: 90 }); b.hitCd = 40; }
  moveBody(b); if (b.state !== 'charge') b.x = clamp(b.x, cx - R - b.w / 2, cx + R - b.w / 2);
}, (b, x, y, o) => drawEnt(96, 48, 92, c => {
  c.scale(b.dir || 1, 1); const st = b.state, P2 = b.phase === 2, t = G.time, glow = P2 ? '#fff1a8' : '#ffb347', hot = P2 ? '#ffd35a' : '#ff6a2a';
  const lift = st === 'slamPrep' ? min(1, b.t / 30) : st === 'slam' ? max(0, 1 - b.t / 6) : st === 'rainPrep' || st === 'rain' ? 1 : 0, wk = sin((b.ph || 0) * 1.2) * 2, rise = st === 'intro' ? max(0, 1 - b.t / 110) * 40 : 0;
  c.translate(0, rise); if (st === 'charge') c.rotate(.18); if (st === 'stagger') c.rotate(-.12);
  rc(c, '#241416', -11, -12 + max(0, wk), 8, 12); rc(c, '#241416', 3, -12 + max(0, -wk), 8, 12); rc(c, '#4a2c2c', -10, -12 + max(0, wk), 5, 3); rc(c, '#4a2c2c', 4, -12 + max(0, -wk), 5, 3);
  rc(c, '#2e1c1e', -15, -36, 30, 26); rc(c, '#4a2c2c', -13, -35, 26, 7); rc(c, '#5a3634', -11, -34, 10, 4); rc(c, '#5a3634', 3, -34, 9, 4); rc(c, '#241416', -15, -12, 30, 3);
  for (const [cx2, cy2, h2] of [[-7, -27, 9], [4, -23, 7], [-1, -18, 5], [9, -30, 5]]) rc(c, hot, cx2, cy2, 2, h2);
  const pulse = .6 + .4 * sin(t * .15); c.globalAlpha = pulse; rc(c, glow, -3, -31, 6, 6); c.globalAlpha = 1; rc(c, '#ffffff', -1, -29, 2, 2);
  rc(c, '#2e1c1e', -8, -45, 16, 10); rc(c, '#4a2c2c', -7, -44, 14, 3); rc(c, glow, 2, -40, 5, 2); rc(c, '#241416', -10, -47, 3, 4); rc(c, '#241416', 7, -47, 3, 4);
  const ay = -32 - lift * 16; rc(c, '#3a2426', -22, ay, 7, 18); rc(c, '#3a2426', 15, ay, 7, 18); rc(c, '#241416', -23, ay + 16, 9, 8); rc(c, '#241416', 14, ay + 16, 9, 8); rc(c, hot, -21, ay + 6, 2, 5); rc(c, hot, 18, ay + 8, 2, 4);
  if (st === 'spit' || st === 'spitPrep') { c.globalAlpha = .8; rc(c, '#ffd35a', 5, -39, 4, 3); c.globalAlpha = 1; }
}, x + b.w / 2, y + b.h, { flash: o.flash || ((st => st === 'slamPrep' || st === 'chargePrep')(b.state) && (b.t >> 2) & 1), unlit: 1 }));
// ---- the Rootmother: rooted in place. Tendrils burst up under you; strike them, or wait for her to bloom ----
mob('rmtendril', { w: 6, h: 34, hp: 1, dmg: 22, contact: false, noKb: true, kbRes: 1, name: 'Root Tendril' }, () => { }, (e, x, y, o) => {
  const up = e.up || 0; if (up <= 0) { if ((G.time >> 2) & 1) { wctx.fillStyle = '#6ff0c0'; wctx.fillRect(round(x), round(e.gy - 1), e.w, 1); } return; }
  drawEnt(64, 32, 60, c => { const h = 34 * up; for (let k = 0; k < h; k += 2) { const sw = sin(k * .25 + G.time * .1) * 1.5 * (k / 34); rc(c, k > h - 6 ? '#a83a4a' : '#3a5a3a', round(sw) - 3 + (k > h - 6 ? 1 : 0), -k - 2, k > h - 6 ? 4 : 6, 2); } rc(c, '#2fb8a8', -1, -h, 2, 2); }, x + e.w / 2, e.gy, { flash: o.flash, ly: -10 });
});
mob('rootmother', { w: 34, h: 40, hp: 3000, dmg: 26, contact: false, noKb: true, boss: true, kbRes: 1, armor: .5, name: 'THE ROOTMOTHER', glow: [.2, .75, .6] }, (b, p, dx, dy, dist) => {
  const cx = DARENA_X * T + 4, gy = DARENA_Y * T, P2 = b.phase === 2, R = (DIMP[2].arenaR - 2) * T;
  b.x = b.px = cx - b.w / 2; b.y = b.py = gy - b.h; b.vx = b.vy = 0; b.open = approach(b.open || 0, b.state === 'bloom' ? 1 : 0, .05);
  for (const e of G.enemies) if (e.root === b && !e.dead) {
    e.t++; const up = e.t < 45 ? 0 : e.t < 55 ? (e.t - 45) / 10 : e.t < 115 ? 1 : max(0, 1 - (e.t - 115) / 12); e.up = up; e.noHit = up < .5; e.y = e.py = e.gy - e.h * up; e.px = e.x;
    if (e.t === 45) { burst(e.x + 3, e.gy, 12, ['#3a5a3a', '#6a4a3a', '#6ff0c0'], 2, 24); addShake(3); sfx('brk'); }
    if (up > .6 && !p.dead && overlap(e, p)) { if (hitP(e, e.dmg, { kx: (sign(p.x - e.x) || 1) * 3, ky: -4.5 })) applyStatus(p, 'poison', b, { d: 140 }); }
    if (e.t > 127) e.dead = true;
  }
  if (b.state === 'dying') { bossDying(b); return; }
  if (bossLeash(b, cx, R + 34 * T, 'The Rootmother draws back into the ground.')) return;
  const tendril = x => { const e = mkEnemy('rmtendril', x - 3, gy); e.root = b; e.t = 0; e.gy = gy; e.up = 0; e.noHit = true; e.px = e.x; e.py = e.y; G.enemies.push(e); };
  switch (b.state) {
    case 'intro': b.invuln = true; if (b.t % 10 === 0) { addShake(3); dust(cx + frand(-30, 30), gy, 4, '#3a5a3a'); } if (b.t > 150) { b.invuln = false; toIdle(b); } break;
    case 'idle': if (b.t > (P2 ? 40 : 65)) { b.t = 0; b.atkN++; if (b.atkN % 4 === 0) { b.state = 'bloom'; sfx('shrine', 0); } else { const r = Math.random(), kids = G.enemies.filter(e => e.minion === b && !e.dead).length; b.state = r < .45 ? 'tendrils' : r < .75 ? 'spores' : kids < (P2 ? 4 : 2) ? 'brood' : 'tendrils'; } } break;
    case 'tendrils': if (b.t === 1 || (P2 && b.t === 25)) { const n = P2 ? 3 : 2; for (let k = 0; k < n; k++) tendril(clamp(p.x + 3 + (k ? frand(-56, 56) : p.vx * 24), cx - R, cx + R)); } if (b.t > 60) toIdle(b); break;
    case 'spores': if (b.t % 12 === 0 && b.t <= (P2 ? 48 : 24)) { for (let k = -2; k <= 2; k++) { const a = -PI / 2 + k * .38 + (sign(dx) || 1) * .5; spawnProj({ type: 'cloud', x: cx, y: b.y + 10, vx: cos(a) * 1.5, vy: sin(a) * 1.5, g: .012, r: 6, dmg: 10, life: 160, poison: true, col: '#6ff0c0' }); } sfx('tele'); } if (b.t > 56) toIdle(b); break;
    case 'brood': if (b.t === 20) for (const s of [-1, 1]) { const e = mkEnemy('sporeling', cx + s * 30, gy - 12); e.minion = b; G.enemies.push(e); burst(cx + s * 30, gy - 6, 10, ['#2fb8a8', '#c8fff0'], 1.4, 20); } if (b.t > 40) toIdle(b); break;
    case 'bloom': b.armor = 1; b.vuln = 1.5; if (b.t % 24 === 0) sporeCloud(cx + frand(-14, 14), b.y + 4, 0); if (b.t > (P2 ? 130 : 160)) { b.armor = .5; b.vuln = 1; toIdle(b); } break;
  }
  if (b.state !== 'bloom' && b.state !== 'intro' && abs(dx) < 36 && abs(dy) < 44 && (b.lashCd = (b.lashCd || 0) - 1) <= 0) { b.lashT = 22; b.lashCd = 90; sfx('tele'); }
  if (b.lashT > 0 && --b.lashT === 8 && abs(dx) < 46 && abs(dy) < 46) hitP(b, 20, { kx: (sign(dx) || 1) * 5, ky: -3 });
  bossPhase(b, 'The Rootmother screams through the ground. Everything here grows faster.');
}, (b, x, y, o) => drawEnt(96, 48, 92, c => {
  const op = b.open || 0, P2 = b.phase === 2, t = G.time, rise = b.state === 'intro' ? max(0, 1 - b.t / 120) * 44 : 0, lash = b.lashT > 0 ? sin((22 - b.lashT) / 22 * PI) : 0;
  c.translate(0, rise);
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) rc(c, '#4a3a2a', s * (8 + k * 6), -3 - k, 6, 3 + k);
  rc(c, '#1e3a30', -14, -30, 28, 28); rc(c, '#2a5a44', -12, -28, 24, 22); rc(c, '#1e3a30', -10, -38, 20, 10);
  c.globalAlpha = .6 + .4 * sin(t * .1); rc(c, P2 ? '#c8fff0' : '#6ff0c0', -3, -20 - op * 6, 6, 6 + op * 4); c.globalAlpha = 1;
  for (let k = 0; k < 5; k++) { const a = -PI / 2 + (k - 2) * (.35 + op * .4); c.save(); c.translate(0, -24); c.rotate(a + PI / 2 - (k - 2) * .05); rc(c, k % 2 ? '#6a2a3a' : '#8a3a4a', -3, -24 - op * 4, 6, 22); rc(c, '#a83a4a', -2, -24 - op * 4, 4, 3); c.restore(); }
  if (lash > 0) for (const s of [-1, 1]) { c.strokeStyle = '#3a5a3a'; c.lineWidth = 3; c.beginPath(); c.moveTo(s * 12, -10); c.quadraticCurveTo(s * 30 * lash, -30, s * 44 * lash, -6); c.stroke(); }
}, x + b.w / 2, y + b.h, { flash: o.flash, unlit: 1 }));
// ---- the Prism Matriarch: flies; beams, rings of shards, dives, mirror copies; drops to the floor, cracked, now and then ----
mob('prismecho', { w: 20, h: 28, hp: 40, dmg: 0, contact: false, fly: true, noKb: true, name: 'Prism Echo', glow: [.25, .25, .4] }, (e, p, dx, dy, dist) => {
  e.a0 = (e.a0 || 0) + .025; flyTo(e, p.x + 3 + cos(e.a0) * 80, p.y - 50 + sin(e.a0 * 2) * 20, .08, 2); e.x += e.vx; e.y += e.vy;
  if (e.t % 70 === 69 && !p.dead) shootAt(e, p, { col: '#e0c8ff', col2: '#ffffff', sz: 2, dmg: 12, sp: 2.4, light: [.3, .3, .5] });
  if (e.t > (e.life || 280) || !G.boss) { e.dead = true; burst(e.x + 10, e.y + 14, 14, ['#ffffff', '#e0c8ff'], 2, 24, { glow: 1 }); }
}, (e, x, y, o) => drawMatriarch(e, x, y, o, .5));
function drawMatriarch(b, x, y, o, alpha) {
  drawEnt(96, 48, 52, c => {
    const t = G.time, P2 = b.phase === 2, crack = b.state === 'stagger';
    c.rotate(sin(t * .03) * .05); rc(c, '#4a3a8a', -6, -14, 12, 30); c.save(); c.rotate(PI / 4); rc(c, '#a58ae0', -9, -9, 18, 18); rc(c, '#e0c8ff', -6, -6, 12, 12); c.restore(); rc(c, '#ffffff', -3, -4, 6, 8);
    rc(c, crack ? '#4a3a8a' : '#9ad0ff', -1, -2, 2, 4); for (let k = 0; k < 3; k++) rc(c, '#ffffff', -6 + k * 5, -24 - (k === 1 ? 3 : 0), 2, 6);
    for (let k = 0; k < (P2 ? 8 : 6); k++) { const a = k / (P2 ? 8 : 6) * TAU + t * .04, r = 18 + sin(t * .05 + k) * 2; c.save(); c.translate(round(cos(a) * r), round(sin(a) * r * .6)); c.rotate(a); rc(c, k % 2 ? '#e0c8ff' : '#9ad0ff', -1, -3, 2, 6); c.restore(); }
    if (crack) { c.strokeStyle = '#2a2440'; c.lineWidth = 1; c.beginPath(); c.moveTo(-5, -8); c.lineTo(1, 0); c.lineTo(-2, 6); c.stroke(); }
  }, x + b.w / 2, y + b.h / 2, { flash: o.flash, unlit: 1, alpha });
}
mob('matriarch', { w: 20, h: 28, hp: 3400, dmg: 30, contact: false, fly: true, noKb: true, boss: true, kbRes: 1, name: 'THE PRISM MATRIARCH', glow: [.6, .55, .95] }, (b, p, dx, dy, dist) => {
  const cx = DARENA_X * T + 4, gy = DARENA_Y * T, R = (DIMP[3].arenaR - 2) * T, P2 = b.phase === 2;
  if (b.state === 'dying') { b.vy = min(b.vy + .1, 3); b.vx *= .9; b.x += b.vx; b.y += b.vy; if (b.y + b.h > gy) b.y = gy - b.h; bossDying(b); return; }
  if (bossLeash(b, cx, R + 34 * T, 'The Matriarch rises out of sight. The spire waits.')) return;
  const hover = (tx, ty) => { b.vx = approach(b.vx, clamp((tx - b.x - b.w / 2) * .03, -2.4, 2.4), .1); b.vy = approach(b.vy, clamp((ty - b.y - b.h / 2) * .03, -2.4, 2.4), .1); }, here = () => hover(b.x + b.w / 2, b.y + b.h / 2), aimAt = () => atan2(p.y + 10 - b.y - b.h / 2, p.x + 3 - b.x - b.w / 2);
  switch (b.state) {
    case 'intro': b.invuln = true; hover(cx, gy - 110); if (b.t > 150) { b.invuln = false; toIdle(b); } break;
    case 'idle': { const a = b.t * .02; hover(clamp(p.x + 3 + cos(a) * 90, cx - R, cx + R), gy - 90 + sin(a * 1.7) * 26); if (b.t > (P2 ? 50 : 80)) { b.t = 0; b.atkN++; if (b.atkN % 5 === 0) { b.state = 'stagger'; sfx('brk'); } else { const r = Math.random(); b.state = r < .4 ? 'beamPrep' : r < .65 ? 'ring' : r < .85 ? 'dive' : 'mirror'; } } } break;
    case 'beamPrep': here(); b.vx *= .9; b.vy *= .9; if (b.t === 1) { b.aim = aimAt(); sfx('tele'); } else if (!P2) b.aim += clamp(aimAt() - b.aim, -.04, .04); aimTrail(b, b.aim, 260, '#ff3b2a'); if (b.t > 50) { b.state = 'beam'; b.t = 0; sfx('boom', 0); b.sweep = P2 ? (Math.random() < .5 ? -1 : 1) * .02 : 0; } break;
    case 'beam': b.vx = b.vy = 0; b.aim += b.sweep; fireBeam(b, b.aim, 280, 4, b.dmg, '#e0c8ff'); if (b.t > (P2 ? 54 : 24)) toIdle(b); break;
    case 'ring': here(); if (b.t === 10 || (P2 && b.t === 34)) { for (let k = 0; k < 14; k++) { const a = k / 14 * TAU + b.t * .1; spawnProj({ type: 'shard', x: b.x + b.w / 2, y: b.y + b.h / 2, vx: cos(a) * 2.2, vy: sin(a) * 2.2, r: 3, dmg: 16, life: 160 }); } sfx('shrine', 0); } if (b.t > 60) toIdle(b); break;
    case 'dive': if (b.t === 1) { b.tx = p.x + 3; b.ty = p.y + 8; sfx('tele'); } if (b.t < 30) { b.vx *= .8; b.vy *= .8; } else if (b.t === 30) { const d = hypot(b.tx - b.x - b.w / 2, b.ty - b.y - b.h / 2) || 1; b.vx = (b.tx - b.x - b.w / 2) / d * 6; b.vy = (b.ty - b.y - b.h / 2) / d * 6; b.hitP = false; } else { if (!b.hitP && overlap(b, p) && !p.dead) { b.hitP = true; hitP(b, b.dmg, { kx: sign(b.vx) * 4, ky: -3 }); } b.vx *= .96; b.vy *= .96; if (b.t > 62) toIdle(b); } break;
    case 'mirror': if (b.t === 1) { for (let k = 0; k < (P2 ? 3 : 2); k++) { const e = mkEnemy('prismecho', b.x, b.y); e.minion = b; e.life = 260; e.a0 = (k + 1) / 3 * TAU; e.phase = b.phase; G.enemies.push(e); } burst(b.x + 10, b.y + 14, 20, ['#ffffff', '#e0c8ff'], 2.4, 30, { glow: 1 }); sfx('tele', 0); } { const a = b.t * .025; hover(cx + cos(a) * R * .6, gy - 100 + sin(a * 2) * 20); } if (b.t > 200) toIdle(b); break;
    case 'stagger': b.vy = min(b.vy + .15, 3); b.vx *= .9; b.vuln = 1.5; if (b.t > 110) { b.vuln = 1; toIdle(b); } break;
  }
  bossPhase(b, 'The Matriarch splits the light into knives.');
  b.x += b.vx; b.y += b.vy; b.x = clamp(b.x, cx - R - b.w / 2, cx + R - b.w / 2); if (b.y + b.h > gy) { b.y = gy - b.h; b.vy = 0; } b.y = max(b.y, gy - 220);
}, (b, x, y, o) => drawMatriarch(b, x, y, o, 1));
// ---- the Pale Shepherd: walks under the Ember Moon, rings its bell for wretches, reaps, and leaves at dawn ----
mob('shepherd', { w: 10, h: 28, hp: 1800, dmg: 26, contact: false, noKb: true, boss: true, kbRes: 1, canStep: true, name: 'THE PALE SHEPHERD', glow: [.6, .16, .16] }, (b, p, dx, dy, dist) => {
  const P2 = b.phase === 2; if (b.alpha === undefined) b.alpha = 1;
  if (b.state === 'dying') { grav(b); b.vx *= .8; moveBody(b); bossDying(b); return; }
  if (G.dn > .55 || DIM) { bossGone(b); say('The Shepherd walks back into the morning.'); return; }
  if (dist > 520 && b.state !== 'blink' && b.state !== 'intro') { b.state = 'blink'; b.t = 0; }
  switch (b.state) {
    case 'intro': b.invuln = true; grav(b); moveBody(b); b.alpha = min(1, b.t / 90); if (b.t > 120) { b.invuln = false; toIdle(b); } return;
    case 'idle': walker(b, p, dx, dy, dist, P2 ? 1.1 : .8, 900); if (b.t > (P2 ? 40 : 65)) { b.t = 0; const r = Math.random(), kids = G.enemies.filter(e => e.minion === b && !e.dead).length; b.state = dist < 50 && r < .55 ? 'sweepPrep' : r < .3 && kids < 3 ? 'toll' : r < .6 ? 'moonfall' : r < .85 ? 'blink' : 'sweepPrep'; } return;
    case 'sweepPrep': grav(b); b.vx *= .8; moveBody(b); b.dir = sign(dx) || b.dir; if (b.t > (P2 ? 20 : 28)) { b.state = 'sweep'; b.t = 0; if (abs(dx) < 48 && abs(dy) < 32 && (sign(dx) || 1) === b.dir) hitP(b, b.dmg, { kx: b.dir * 4.5, ky: -3 }); G.trails.push({ kind: 'arc', x: b.x + 5, y: b.y + 10, face: b.dir, a0: -1.8, a1: 1.3, r0: 8, r1: 46, life: 12, max: 12, sty: ['#ff3b2a', '#ffe0d8'] }); sfx('swing', 0); } return;
    case 'sweep': grav(b); b.vx = 0; moveBody(b); if (b.t > 16) toIdle(b); return;
    case 'blink': b.noHit = b.t > 6 && b.t < 30; b.alpha = b.t < 18 ? 1 - b.t / 18 : min(1, (b.t - 18) / 12); if (b.t === 18) { const s = -(p.face || 1); b.x = b.px = p.x + 3 + s * 30 - b.w / 2; b.y = b.py = p.y - 8; b.vx = b.vy = 0; b.dir = -s; } grav(b); moveBody(b); if (b.t > 30) { b.noHit = false; b.state = 'sweepPrep'; b.t = 0; } return;
    case 'toll': grav(b); b.vx = 0; moveBody(b); if (b.t === 10) { sfx('shrine', 0); G.flash = .3; G.flashCol = '255,80,70'; for (let k = 0; k < (P2 ? 3 : 2); k++) { const e = mkEnemy('moonwretch', b.x + (k - 1) * 28, b.y); e.minion = b; G.enemies.push(e); burst(e.x + 3, e.y + 7, 10, ['#ff3b2a', '#e8d8d0'], 1.6, 20); } } if (b.t > 40) toIdle(b); return;
    case 'moonfall': grav(b); b.vx = 0; moveBody(b); if (b.t % (P2 ? 10 : 14) === 1 && b.t < 60) { const x = p.x + 3 + frand(-50, 50) + p.vx * 20, gy = groundAt(floor(x / T)) * T; G.trails.push({ kind: 'warn', x, y: gy, life: 36, max: 36 }); G.dhaz.push({ kind: 'pillar', x, y: gy, delay: 36, life: 14 }); } if (b.t > 80) toIdle(b); return;
  }
}, (b, x, y, o) => drawEnt(64, 32, 58, c => {
  c.scale(b.dir || 1, 1); const sw = b.state === 'sweep' ? min(1, b.t / 6) : 0, up = b.state === 'sweepPrep' ? min(1, b.t / 20) : 0, bob = sin(G.time * .06) * 1;
  rc(c, '#cfc4c0', -5, -24 + bob, 10, 24); rc(c, '#e8dcd6', -4, -23 + bob, 8, 20); rc(c, '#8a6a6a', -5, -4, 10, 4); rc(c, '#e8dcd6', -3, -30 + bob, 6, 7); rc(c, '#120d1f', -2, -28 + bob, 4, 3); rc(c, '#ff3b2a', 0, -27 + bob, 1, 1);
  c.save(); c.translate(3, -20 + bob); c.rotate(-1.2 * up + 1.6 * sw); rc(c, '#6a4a3a', 0, -1, 2, 26); rc(c, '#e8e0f0', -10, 23, 12, 2); rc(c, '#ffffff', -10, 23, 3, 1); c.restore();
  rc(c, '#c8c0d8', -8, -16 + bob, 4, 5); rc(c, '#ff3b2a', -7, -11 + bob, 2, 1);
}, x + b.w / 2, y + b.h, { flash: o.flash || (b.state === 'sweepPrep' && (b.t >> 2) & 1), alpha: b.alpha, ly: -14, unlit: 1 }));
// ================= where things spawn =================
const DSPAWN = {
  1: { cinder: [['slagling', 5], ['cinderimp', 3], ['ashwraith', 1]], basalt: [['basaltbrute', 3], ['slagling', 3], ['cinderimp', 2]], kiln: [['cinderimp', 4], ['slagling', 2], ['ashwraith', 2], ['hollow', 1]], under: [['slagling', 4], ['cinderling', 3], ['basaltbrute', 1], ['bat', 1]], deep: [['cinderling', 4], ['basaltbrute', 2], ['ashwraith', 1], ['hollow', 1]] },
  2: { rootwood: [['gloamhound', 3], ['rootlasher', 2], ['lanternmoth', 2]], mycel: [['sporeling', 5], ['lanternmoth', 3], ['rootlasher', 1]], mire: [['mirestalker', 2], ['sporeling', 3], ['lanternmoth', 2]], under: [['sporeling', 3], ['crawler', 2], ['gloamhound', 1], ['rootlasher', 2]], deep: [['rootlasher', 2], ['sporeling', 3], ['mirestalker', 1], ['crawler', 1]] },
  3: { shard: [['shardling', 5], ['mirrorwisp', 3], ['voidray', 1]], prism: [['shardling', 3], ['glasssentinel', 2], ['mirrorwisp', 3]], hush: [['voidray', 3], ['mirrorwisp', 2], ['shardling', 1]] }
};
const DEVMOBS = { eruption: [['cinderimp', 4], ['slagling', 4], ['ashwraith', 2]], sporebloom: [['sporeling', 6], ['lanternmoth', 3]], shatterstorm: [['mirrorwisp', 4], ['shardling', 3], ['glasssentinel', 1]] };
function spawnInLiquid(type, liq, ptx, pty) {
  for (let k = 0; k < 20; k++) {
    const tx = ptx + (Math.random() < .5 ? -1 : 1) * randi(16, 56);
    for (let y = pty - 14; y < pty + 16; y++) if (inW(tx, y) && tiles[y * WW + tx] === liq && tileAt(tx, y + 1) === liq) { if (type === 'lurker') spawnMob('lurker', tx, y + 1); else { const e = mkEnemy(type, tx * T, (y + 1) * T); e.px = e.x; e.py = e.y; e.dir = Math.random() < .5 ? 1 : -1; G.enemies.push(e); } return true; }
  }
  return false;
}
function groundSpot(tx, pty, under) {
  const y0 = under ? pty + floor(frand(-14, 6)) : max(3, pty - 24), y1 = under ? y0 + 16 : pty + 24;
  for (let y = y0; y < y1; y++) if (solidAt(tx, y) && !TP[tileAt(tx, y)].ghost && !solidAt(tx, y - 1) && !solidAt(tx, y - 2) && !solidAt(tx, y - 3) && !liqAt(tx * T + 4, (y - 1) * T + 4)) return y;
  return -1;
}
function placeMob(type, ptx, pty, under, avoid) {
  const fly = MOBX[type] && MOBX[type].stats.fly;
  for (let tries = 0; tries < 14; tries++) {
    const tx = ptx + (Math.random() < .5 ? -1 : 1) * floor(frand(30, 54)); if (tx < 3 || tx > WW - 4 || (avoid && avoid(tx))) continue;
    if (fly && (DIM === 3 || !under)) { const y = pty - floor(frand(4, 18)); if (!solidAt(tx, y) && !solidAt(tx, y + 1) && !solidAt(tx + 1, y)) { const e = mkEnemy(type, tx * T, y * T); e.px = e.x; e.py = e.y; G.enemies.push(e); return e; } continue; }
    const ty = groundSpot(tx, pty, under); if (ty < 0) continue;
    if (type === 'gloamhound') { const k = randi(2, 3); for (let q = 0; q < k; q++) spawnMob(type, tx + q, ty); return true; }
    if (type === 'starling') { for (let q = 0; q < 3; q++) spawnMob(type, tx + q, ty); return true; }
    if (type === 'hollow') { spawnHollow(tx * T + 1, (ty - 3) * T); return true; }
    if (type === 'crawler') { if (!trySpecialSpawn('under', 'moor', ptx, pty, true)) spawnMob('sporeling', tx, ty); return true; }
    if (type === 'glasssentinel') { const e = mkEnemy(type, tx * T, (ty - 6) * T); e.px = e.x; e.py = e.y; G.enemies.push(e); return e; }
    spawnMob(type, tx, ty); return true;
  }
  return false;
}
function dimSpawn() {
  const p = G.p, ptx = floor((p.x + 3) / T), pty = floor((p.y + 10) / T), realm = realmAt(ptx, pty), under = realm === 'under' || realm === 'deep', D = DIMP[DIM];
  if (abs(ptx - SPAWN_X) < 22 && !under) return; if (abs(ptx - DARENA_X) < D.arenaR + 8) return;
  let n = 0; for (const e of G.enemies) if (!e.dead) n++; for (const f of G.fighters) if (f.hollow && !f.dead) n++; const ev = G.dev && G.dev.fade > .5;
  if (n >= (ev ? 9 : under ? 7 : 6)) return;
  if (DIM === 1 && Math.random() < .3 && G.enemies.filter(e => e.type === 'cindereel').length < 2 && spawnInLiquid('cindereel', CINDER, ptx, pty)) return;
  if (DIM === 2 && Math.random() < .25 && G.enemies.filter(e => e.type === 'lurker').length < 2 && spawnInLiquid('lurker', WATER, ptx, pty)) return;
  const S0 = DSPAWN[DIM], list = (ev && Math.random() < .6 ? DEVMOBS[G.dev.id] : realm === 'deep' ? S0.deep : under ? S0.under : S0[dimBio(ptx)]) || S0.under || S0[D.bio[0]];
  placeMob(pickMob(list, true), ptx, pty, under && DIM !== 3, tx => abs(tx - SPAWN_X) < 20 || abs(tx - DARENA_X) < D.arenaR + 4);
}
// ================= events: the sky changes, and different things walk =================
const EVENTS = {
  emoon: { name: 'THE EMBER MOON', sub: 'something walks out of the red light', when: 'dusk', need: F => F.seen1, chance: .16, mobs: [['moonwretch', 6], ['husk', 1]], cap: 6, end: 'The Ember Moon sets.' },
  starfall: { name: 'STARFALL', sub: 'the sky is shedding. catch what falls', when: 'dusk', need: F => F.seen2, chance: .14, mobs: [['starling', 5]], cap: 6, end: 'The last star burns out on the way down.' },
  eclipse: { name: 'THE ECLIPSE', sub: 'the ring goes dark at noon', when: 'dawn', need: F => F.rootmotherDead, chance: .12, mobs: [['umbralknight', 3], ['moonwretch', 1]], cap: 3, end: 'The light comes back to the ring.' },
  ashfall: { name: 'ASHFALL', sub: 'grey snow, and things that walk in it', when: 'any', need: () => embers() >= 1, chance: .07, mobs: [['ashwraith', 4]], cap: 4, dur: 9000, end: 'The ash stops falling.' },
  fog: { name: 'THE LONG FOG', sub: 'keep to the paths', when: 'dawn', need: () => G.played > 900, chance: .14, mobs: [['fogwalker', 4]], cap: 3, dur: 7000, end: 'The fog burns off.' }
};
const DEVENTS = { eruption: { name: 'ERUPTION', sub: 'the ground spits fire. keep moving' }, sporebloom: { name: 'SPORE BLOOM', sub: 'breathe shallow' }, shatterstorm: { name: 'SHATTERSTORM', sub: 'the sky is falling in pieces' } };
const EVMOB = new Set(['moonwretch', 'starling', 'umbralknight', 'ashwraith', 'fogwalker']);
function startEvent(k, called) { G.ev = { id: k, t: 0, fade: 0, end: false, called: !!called }; const E = EVENTS[k]; G.banner = { text: E.name, sub: E.sub, t: 0 }; sfx('roar', 0); G.flags['ev_' + k] = (G.flags['ev_' + k] || 0) + 1; G.dirty = true; if (LEADS['ev_' + k]) learn('ev_' + k, true); }
function tickEvents() {
  if (netGuest()) return;
  if (DIM) { tickDimEvent(); return; }
  const c = G.clock, was = G.evClock === undefined ? c : G.evClock, F = G.flags; G.evClock = c;
  const crossed = a => was <= c ? (was < a && c >= a) : (was < a || c >= a), e = G.ev;
  if (e) {
    e.t++; const E = EVENTS[e.id];
    if (!e.end && (E.dur ? e.t > E.dur : E.when === 'dusk' ? crossed(.04) : E.when === 'dawn' ? crossed(.56) : false)) { e.end = true; say(E.end); }
    e.fade = e.end ? max(0, e.fade - .01) : min(1, e.fade + .008); if (e.end && e.fade <= 0) { G.ev = null; return; }
    if (e.fade > .5 && !e.end) eventTick(e);
    return;
  }
  if (WORLD.mode === 1 || !G.p || G.time < 600 || WORLD.arena) return;
  const dusk = crossed(.58), dawn = crossed(.035); if (!dusk && !dawn) return;
  const pool = Object.keys(EVENTS).filter(k => { const E = EVENTS[k]; return E.need(F) && (E.when === 'any' || (E.when === 'dusk' && dusk) || (E.when === 'dawn' && dawn)); }).sort(() => Math.random() - .5);
  for (const k of pool) if (Math.random() < EVENTS[k].chance * .6) { startEvent(k); break; }
}
function eventTick(e) {
  const p = G.p;
  if (e.id === 'starfall' && G.time % 150 === 0 && !p.dead) { const x = p.x + 3 + frand(-240, 240); G.dhaz.push({ kind: 'star', x, y: G.cam.y - 30, vx: frand(-1.2, 1.2), vy: 2.4, g: .03, light: [.6, .7, .7] }); }
  if (e.id === 'ashfall' && G.time % 2 === 0) P(G.cam.x + frand(VS.vw + 60), G.cam.y - 4, frand(-.5, -.1), frand(.4, .8), 340, fpick(['#a19baa', '#8d8794', '#d6d0dc']), { g: 0, fr: 1 });
  if (e.id === 'emoon' && e.called && !e.shep && !G.boss && G.dn < .25 && e.t > 1500 && (Math.random() < .0015 || e.t > 4200) && realmAt(floor((p.x + 3) / T), floor((p.y + 10) / T)) === 'surface' && placeAt(floor((p.x + 3) / T), floor((p.y + 10) / T)) !== 'village') {
    e.shep = true; const s = Math.random() < .5 ? 1 : -1, tx = floor((p.x + 3) / T) + s * 16, ty = groundAt(tx); const b = bossSpawn('shepherd', tx * T, (ty - 4) * T); b.dir = -s; G.banner = { text: 'THE PALE SHEPHERD', sub: 'it has come for its flock', t: 0 }; learn('shepherd', true);
  }
}
function tickDimEvent() {
  if (G.devT === undefined) G.devT = 2400; const e = G.dev, p = G.p;
  if (!e) { if (--G.devT > 0 || G.boss) return; G.devT = 6000 + frand(6000); if (Math.random() < .35) { const id = DIMP[DIM].ev; G.dev = { id, t: 0, fade: 0, end: false }; G.banner = { text: DEVENTS[id].name, sub: DEVENTS[id].sub, t: 0 }; sfx('roar', 0); } return; }
  e.t++; if (e.t > 3600 && !e.end) e.end = true; e.fade = e.end ? max(0, e.fade - .01) : min(1, e.fade + .01); if (e.end && e.fade <= 0) { G.dev = null; return; }
  if (e.fade < .5 || p.dead || realmAt(floor((p.x + 3) / T), floor((p.y + 10) / T)) !== 'surface') return;
  if (e.id === 'eruption' && G.time % 45 === 0) G.dhaz.push({ kind: 'bomb', x: p.x + 3 + frand(-220, 220), y: G.cam.y - 20, vx: frand(-1, 1), vy: 1.5, g: .07, light: [.9, .4, .1] });
  if (e.id === 'sporebloom' && G.time % 70 === 0) sporeCloud(p.x + 3 + frand(-140, 140), p.y + frand(-60, 20), 1);
  if (e.id === 'shatterstorm' && G.time % 24 === 0) spawnProj({ type: 'shard', x: p.x + 3 + frand(-220, 220), y: G.cam.y - 10, vx: frand(-.5, .5), vy: 3.6, g: .05, r: 2, dmg: 10, life: 160 });
}
function tickHazards() {
  const a = G.dhaz || (G.dhaz = []), p = G.p;
  for (let i = a.length - 1; i >= 0; i--) {
    const z = a[i]; z.t = (z.t || 0) + 1;
    if (z.delay > 0) { if (--z.delay === 0) { if (z.kind === 'rock') { spawnProj({ type: 'rock', x: z.x, y: z.y, vx: 0, vy: 1, g: .3, r: 5, dmg: 22, life: 150 }); a.splice(i, 1); } else if (z.kind === 'pillar') { addShake(4); sfx('boom', 40); burst(z.x, z.y - 4, 16, ['#ff3b2a', '#ffe0d8'], 2.4, 30, { glow: 1 }); if (abs(p.x + 3 - z.x) < 10 && p.y + p.h > z.y - 150 && !p.dead) hitP({ x: z.x - 4, w: 8 }, 24, { kx: sign(p.x + 3 - z.x) * 3, ky: -3 }); } } continue; }
    if (z.kind === 'pillar') { for (let k = 0; k < 3; k++) P(z.x + frand(-3, 3), z.y - frand(150), 0, -1, 10, fpick(['#ff3b2a', '#ffe0d8']), { glow: 1, g: 0 }); if (--z.life <= 0) a.splice(i, 1); continue; }
    z.vy += z.g || .06; z.x += z.vx; z.y += z.vy;
    P(z.x, z.y, frand(-.3, .3), -.3, 22, z.kind === 'star' ? fpick(['#ffffff', '#c9fff6', '#fff1a8']) : fpick(SPARK), { glow: 1, g: 0 }); P(z.x, z.y, 0, 0, 2, '#ffffff', { glow: 1, g: 0, sz: 2 });
    const tx = floor(z.x / T), ty = floor(z.y / T);
    if (solidAt(tx, ty) || liqAt(z.x, z.y) || z.t > 500) {
      a.splice(i, 1); burst(z.x, z.y - 3, z.kind === 'bomb' ? 22 : 14, z.kind === 'bomb' ? SPARK : ['#ffffff', '#c9fff6', '#fff1a8'], 2.4, 30, { glow: 1 }); addShake(z.kind === 'bomb' ? 3 : 1); sfx(z.kind === 'bomb' ? 'boom' : 'brk', 60);
      if (!p.dead && hypot(p.x + 3 - z.x, p.y + 10 - z.y) < (z.kind === 'bomb' ? 24 : 14)) hurtFighter(p, z.kind === 'bomb' ? 20 : 8, z.x, { kx: (sign(p.x + 3 - z.x) || 1) * 3, ky: -2.5, fire: z.kind === 'bomb' });
      if (z.kind === 'star' && !solidAt(tx, ty - 1)) spawnDrop('starshard', 1, z.x, (ty - 1) * T);
    }
  }
}
function eventSpawn() {
  const e = G.ev; if (!e || e.fade < .5 || e.end || DIM) return false; const E = EVENTS[e.id]; if (Math.random() > .6) return false;
  const p = G.p, ptx = floor((p.x + 3) / T), pty = floor((p.y + 10) / T), realm = realmAt(ptx, pty); if (realm !== 'surface') return false;
  if (G.enemies.filter(q => !q.dead && EVMOB.has(q.type)).length >= E.cap) return false;
  const type = pickMob(E.mobs, true); if (type === 'fogwalker' && !['moor', 'fen', 'thorn', 'reach'].includes(biomeAt(ptx))) return false;
  return !!placeMob(type, ptx, pty, false, tx => abs(tx - SPAWN_X) < VIL_W + 10);
}
function useSummon(it) {
  const k = it.summon, F = G.flags;
  if (k === 'heart') { if (F.heartUp) { say('You already carry the heart of the Expanse.'); sfx('deny'); return; } removeItem(it.id, 1); F.heartUp = true; sfx('heal'); G.flash = .6; G.flashCol = '220,200,255'; say('Warmth spreads through you. You will be harder to kill.'); G.dirty = true; return; }
  if (DIM || WORLD.arena) { say('That only answers in the Waking Lands.'); sfx('deny'); return; }
  if (G.ev && !G.ev.end) { say('The sky is already busy.'); sfx('deny'); return; }
  if (netGuest()) { const E0 = EVENTS[k], nt = G.dn < .4; if (E0.when === 'dusk' && !nt) { say('It wants the dark. Wait for night.'); sfx('deny'); return; } if (it.id !== 'shepherd_bell') removeItem(it.id, 1); G.p.toolT = 12; sendAll({ t: 'summon', k }); say('You call it. The sky answers your host.'); return; }
  const E = EVENTS[k], night = G.dn < .4;
  if (E.when === 'dusk' && !night) { say('It wants the dark. Wait for night.'); sfx('deny'); return; }
  if (E.when === 'dawn' && night && k === 'eclipse') { say('It wants daylight.'); sfx('deny'); return; }
  if (it.id !== 'shepherd_bell') removeItem(it.id, 1); G.p.toolT = 12; startEvent(k, true);
}
