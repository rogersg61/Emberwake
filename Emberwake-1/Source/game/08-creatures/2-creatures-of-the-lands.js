// ============================================================
//  Creatures of the new lands. Each has one way of fighting and one reason
//  to be hunted, and how hard it hits follows how dangerous it is meant to be:
//    tier 0  ashhare      flees; meat and hide for the first days
//    tier 1  thornback    paws, then charges in a line; dazed if it hits a wall. tusks, hide, meat
//    tier 1  glassfly     circles in swarms, darts in, bursts into shards. glass wings
//    tier 2  bog lurker   waits under fen water, lunges, drags you in. lurker oil
//    tier 2  crawler      walks the cave ceiling, drops on you, poisons. chitin, venom
//    tier 3  dune serpent swims under sand, erupts beneath you. scales, venom
//    tier 4  crystal golem slow, armoured (blunt weapons bite), slams and sprays shards. geode hearts
// ============================================================
const MOBX = {}, MOBSPR = {};
const DROPS = {
  mote: [['cinder', .75, 1, 2], ['ash', .5, 1, 2]], husk: [['husk_fiber', .8, 1, 2], ['cinder', .4, 1, 2], ['bone', .5, 1, 2], ['iron_ore', .2, 1, 3], ['shard', .08, 1, 1], ['glowcap', .16, 1, 1]],
  mite: [['snow', 1, 1, 3], ['glowcap', .25, 1, 1], ['shard', .06, 1, 1]], bat: [['membrane', .7, 1, 1], ['cinder', .4, 1, 1]],
  skyray: [['skysilk', 1, 1, 2], ['membrane', .3, 1, 1], ['glowcap', .2, 1, 1]], rustback: [['rust_plate', .9, 1, 2], ['copper_ore', .5, 2, 3], ['iron_ore', .4, 1, 3], ['shard', .1, 1, 1]],
  cinderling: [['cinder', 1, 1, 3], ['cinder_gland', .5, 1, 1], ['shard', .25, 1, 1]],
  ashhare: [['meat', 1, 1, 1], ['hide', .8, 1, 1], ['bone', .3, 1, 1]], thornback: [['meat', 1, 2, 3], ['hide', 1, 1, 2], ['tusk', .7, 1, 2], ['bone', .5, 1, 2]],
  glassfly: [['glass_wing', .85, 1, 1], ['snow', .3, 1, 1]], lurker: [['lurker_oil', 1, 1, 2], ['hide', .7, 1, 1], ['meat', .8, 1, 2], ['bone', .4, 1, 2]],
  serpent: [['scale', 1, 2, 4], ['venom', .8, 1, 1], ['meat', .7, 2, 3], ['bone', .5, 2, 3]], crawler: [['chitin', .9, 1, 2], ['venom', .45, 1, 1]],
  golem: [['geode_core', 1, 1, 1], ['snow', 1, 3, 5], ['rock', 1, 2, 4], ['shard', .3, 1, 2]]
};
function rollDrops(type, cx, cy) { const D = DROPS[type]; if (!D) return false; const k = boonMul('drop'); for (const [id, ch, a, b] of D) if (Math.random() < ch * k) spawnDrop(id, randi(a, b), cx, cy); return true; }
function buildMobSprites() {
  const S = (k, rows, pal) => { MOBSPR[k] = spr(rows, pal); };
  const hare = { a: '#e6e0f0', b: '#b8b2c0', c: '#8d8794', e: '#120d1f', p: '#ff9a8a' };
  S('hare0', ['.aa.....', '..a.....', '..bbb...', '.bbebbb.', 'bbbbbbbc', '.cc..cc.'], hare); S('hare1', ['..aa....', '...a....', '..bbbb..', '.bbebbbb', 'cbbbbbb.', 'c.....cc'], hare);
  const boar = { t: '#c9a0a0', b: '#5a3a3a', B: '#3a2424', e: '#ff6a4a', w: '#f4ead8', c: '#2a1818' };
  S('boar0', ['...t.t.t.....', '..tbtbtbt....', '.bbbbbbbbbb..', 'bbbbbbbbbbbbe', 'BbbbbbbbbbbbbW', '.BBbbbbbbbbw.', '.cc..cc..cc..', '.cc...c...c..'], Object.assign({ W: '#f4ead8' }, boar));
  S('boar1', ['...t.t.t.....', '..tbtbtbt....', '.bbbbbbbbbb..', 'bbbbbbbbbbbbe', 'BbbbbbbbbbbbbW', '.BBbbbbbbbbw.', '..cc..cc..c..', '..c...cc..cc.'], Object.assign({ W: '#f4ead8' }, boar));
  const fly = { w: '#dcf7f5', b: '#62a9bc', B: '#2a5a6a' };
  MOBSPR.fly0 = spr(['.w...w.', 'wwwbwww', '..bbb..', '...B...'], fly); MOBSPR.fly1 = spr(['.......', '..wbw..', 'wwbbbww', '...B...'], fly);
  const lurk = { b: '#3a5a3a', B: '#24402a', e: '#c8e8a0', m: '#120d1f', t: '#e8edf2' };
  MOBSPR.lurk = spr(['..e.......e.....', '.ebe.....ebe....', 'bbbbbbbbbbbbbbb.', 'bbbbbbbbbbbbbbbb', 'BmtmtmtmtmtmtmB.', '.BBBBBBBBBBBBB..', '..B..B..B..B....'], lurk);
  MOBSPR.lurkEyes = spr(['e.....e', 'b.....b'], { e: '#c8e8a0', b: '#24402a' });
  const crawl = { c: '#2a1e36', b: '#4a3a5a', B: '#8a6a9a', e: '#ff6a4a' };
  MOBSPR.crawl0 = spr(['.c.c.c.c..', 'cBbBbBbBbe', 'bbbbbbbbbb', '.c.c.c.c..'], crawl); MOBSPR.crawl1 = spr(['c.c.c.c...', 'cBbBbBbBbe', 'bbbbbbbbbb', 'c.c.c.c...'], crawl);
  MOBSPR.shead = spr(['..aaaaaa..', '.abbbbbba.', 'abbebbbbba', 'bbbbbbbbbb', 'bmmmmmmmbb', '.tbtbtbtb.', '..bbbbbb..'], { a: '#a0e0c8', b: '#4a9a8a', e: '#ffd35a', m: '#120d1f', t: '#f4ead8' });
  MOBSPR.sseg = spr(['.aaaa.', 'abbbba', 'bbcbbb', 'bbbcbb', '.bbbb.'], { a: '#a0e0c8', b: '#4a9a8a', c: '#1e5a50' });
  const gl = { a: '#e0d2ff', b: '#a58ae0', c: '#5a4a8a', d: '#3d2f5c', e: '#ffffff', y: '#ffd35a' };
  MOBSPR.golem = spr(['....aaaa....', '...abbbbc...', '...bbyybc...', '...cbbbbc...', '.aabbbbbbcc.', 'abbbcbbcbbbc', 'abbccbbccbbc', 'bbc.cbbc.cbb', 'bbc.abbc.cbb', 'cc..bbbb..cc', 'cc..bbbb..cc', 'ee..cccc..ee', '....bc.cb...', '...abc.cbb..', '...bbc.cbb..', '...bbc.cbb..', '..abbc.cbbc.', '..bbcc.ccbb.', '..cccc.cccc.'], gl);
}
const mob = (type, stats, ai, draw) => { MOBX[type] = { stats, ai, draw }; };
// ---- ashhare ----
mob('ashhare', { w: 7, h: 5, hp: 10, dmg: 0, contact: false, name: 'Ashhare', canStep: true }, (e, p, dx, dy, dist) => {
  e.vy = min(e.vy + .22, 5);
  if (e.onGround) {
    e.vx *= .7; const scared = dist < 74 && !p.dead; if (scared) e.dir = -sign(dx) || 1;
    if (e.t > (scared ? 8 : e.wait)) { e.t = 0; e.wait = 50 + frand(120); if (scared || Math.random() < .55) { if (e.hitWall) e.dir *= -1; e.vy = scared ? -2.7 : -1.7; e.vx = e.dir * (scared ? 2.5 : .9); } else e.dir = Math.random() < .5 ? 1 : -1; }
  }
  moveBody(e);
}, (e, x, y, o) => drawEnt(32, 16, 20, c => { c.scale(e.dir, 1); c.drawImage(e.onGround ? MOBSPR.hare0 : MOBSPR.hare1, -4, -6); }, x + e.w / 2, y + e.h, { flash: o.flash, ly: -3 }));
// ---- thornback ----
mob('thornback', { w: 13, h: 8, hp: 58, dmg: 13, contact: false, kbRes: .45, name: 'Thornback', canStep: true }, (e, p, dx, dy, dist) => {
  e.vy = min(e.vy + .25, 5);
  if (e.state === 'idle') { e.vx = approach(e.vx, e.dir * .45, .05); if (e.hitWall || Math.random() < .004) e.dir *= -1; e.ph += abs(e.vx) * .4; if (dist < 150 && abs(dy) < 34 && !p.dead && e.t > 40) { e.state = 'paw'; e.t = 0; e.dir = sign(dx) || 1; sfx('tele'); } }
  else if (e.state === 'paw') { e.vx *= .7; if (e.t % 7 === 0) dust(e.x + e.w / 2 - e.dir * 5, e.y + e.h, 2, '#8a6a48'); if (e.t >= 34) { e.state = 'charge'; e.t = 0; e.hitP = false; } }
  else if (e.state === 'charge') {
    e.vx = e.dir * 3.4; e.ph += 1; if (e.t % 4 === 0) dust(e.x + e.w / 2 - e.dir * 6, e.y + e.h, 1, '#8a6a48');
    if (!e.hitP && !p.dead && overlap(e, p)) { e.hitP = true; hurtFighter(p, e.dmg, e.x + e.w / 2, { kx: e.dir * 3.6, ky: -2.6 }); }
    if (e.hitWall && e.t > 4) { e.state = 'dazed'; e.t = 0; e.vx = -e.dir * 1.5; e.vy = -2; addShake(2); sfx('hit2', 0); sparks(e.x + e.w / 2 + e.dir * 7, e.y + 3, 8, 0, 2); } else if (e.t > 80) { e.state = 'skid'; e.t = 0; }
  }
  else if (e.state === 'skid') { e.vx *= .9; if (e.t > 22) { e.state = 'idle'; e.t = 0; e.dir = sign(dx) || e.dir; } }
  else if (e.state === 'dazed') { e.vx *= .9; e.vuln = 1.7; if (e.t % 10 === 0) P(e.x + e.w / 2, e.y - 3, frand(-.4, .4), -.4, 20, '#ffd35a', { glow: 1, g: 0 }); if (e.t > 80) { e.state = 'idle'; e.t = 0; e.vuln = 1; } }
  moveBody(e);
}, (e, x, y, o) => drawEnt(32, 16, 24, c => { c.scale(e.dir, 1); if (e.state === 'paw') c.rotate(-.08 + sin(e.t * .5) * .04); c.drawImage(MOBSPR[(e.ph | 0) % 2 ? 'boar1' : 'boar0'], -7, -8); }, x + e.w / 2, y + e.h, { flash: o.flash || (e.state === 'paw' && (e.t >> 2) & 1), ly: -4 }));
// ---- glassfly ----
mob('glassfly', { w: 6, h: 4, hp: 12, dmg: 7, contact: false, fly: true, name: 'Glassfly' }, (e, p, dx, dy, dist) => {
  e.ph += .5; if (e.a === undefined) { e.a = frand(TAU); e.next = 90 + frand(90); }
  if (e.state === 'idle' || e.state === 'chase') {
    e.a += .035; const tx = p.x + 3 + cos(e.a) * 44, ty = p.y + 4 + sin(e.a) * 22 - 18; e.vx = approach(e.vx, clamp((tx - e.x) * .05, -2, 2), .12); e.vy = approach(e.vy, clamp((ty - e.y) * .05, -2, 2), .12);
    if (dist > 260) { e.vx *= .9; e.vy *= .9; } if (e.t > e.next && dist < 120 && !p.dead) { e.state = 'tele'; e.t = 0; sfx('tele'); }
  } else if (e.state === 'tele') { e.vx *= .8; e.vy *= .8; if (e.t > 18) { const d = hypot(dx, dy) || 1; e.vx = dx / d * 4.2; e.vy = dy / d * 4.2; e.state = 'dart'; e.t = 0; e.hitP = false; } }
  else if (e.state === 'dart') { if (!e.hitP && !p.dead && overlap(e, p)) { e.hitP = true; hurtPlayer(e.dmg, e.x); } if (e.t > 26 || e.hitWall) { e.state = 'chase'; e.t = 0; e.next = 80 + frand(100); } }
  moveBody(e);
}, (e, x, y, o) => drawEnt(32, 16, 16, c => { c.drawImage(MOBSPR[(G.time >> 1) & 1 ? 'fly1' : 'fly0'], -3, -2); }, x + e.w / 2, y + e.h / 2, { flash: o.flash || (e.state === 'tele' && (e.t >> 1) & 1), unlit: e.state === 'tele' }));
// ---- bog lurker ----
const inWater = e => liqAt(e.x + e.w / 2, e.y + e.h - 2) === 1;
mob('lurker', { w: 15, h: 6, hp: 74, dmg: 16, contact: false, kbRes: .5, name: 'Bog Lurker' }, (e, p, dx, dy, dist) => {
  const wet = inWater(e); if (e.hx === undefined) { e.hx = e.x; e.hy = e.y; }
  if (e.state === 'idle' || e.state === 'sub') {
    e.state = 'sub'; e.noHit = wet && e.t > 10; e.vx *= .9; e.vy = wet ? approach(e.vy, (e.hy - e.y) * .02, .05) : min(e.vy + .25, 5);
    const pwet = liqAt(p.x + 3, p.y + p.h + 6) === 1 || liqAt(p.x + 3, p.y + p.h - 2) === 1 || liqAt(p.x - 12, p.y + p.h + 4) === 1 || liqAt(p.x + 18, p.y + p.h + 4) === 1;
    if (wet && !p.dead && abs(dx) < 70 && abs(dy) < 44 && (pwet || abs(dx) < 30) && e.t > 50) { e.state = 'rise'; e.t = 0; e.noHit = false; sfx('tele'); }
    if (!wet) { e.state = 'beach'; e.t = 0; }
  } else if (e.state === 'rise') { e.vx *= .8; e.vy = -.4; if (e.t % 3 === 0) P(e.x + frand(e.w), e.y, frand(-.3, .3), -.6, 18, '#b4e6e8', { g: 0 }); if (e.t > 22) { e.dir = sign(dx) || 1; e.vx = e.dir * clamp(abs(dx) / 18, 1.6, 3.2); e.vy = -3.8; e.state = 'lunge'; e.t = 0; e.hitP = false; sfx('jump'); } }
  else if (e.state === 'lunge') {
    e.vy = min(e.vy + .22, 5); if (!e.hitP && !p.dead && overlap(e, p, 2)) { e.hitP = true; hurtFighter(p, e.dmg, e.x + e.w / 2, { kx: -e.dir * 2.4, ky: -1 }); p.dragT = 40; p.dragX = e.hx + e.w / 2; say('It drags you toward the water!'); }
    if (e.onGround || (wet && e.t > 10)) { e.state = wet ? 'sub' : 'beach'; e.t = 0; }
  } else if (e.state === 'beach') { e.vy = min(e.vy + .25, 5); e.vuln = 1.4; if (e.onGround && e.t % 24 === 0) { e.dir = sign(e.hx - e.x) || 1; e.vx = e.dir * 1.2; e.vy = -1.6; } else if (e.onGround) e.vx *= .85; if (wet) { e.state = 'sub'; e.t = 0; e.vuln = 1; } if (e.t > 900) e.hx = e.x; }
  moveBody(e);
}, (e, x, y, o) => {
  if (e.state === 'sub' && e.noHit) { const [dx2, dy2] = [x + e.w / 2, y + 1]; drawEnt(32, 16, 16, c => c.drawImage(MOBSPR.lurkEyes, -3, -2), dx2, dy2, { unlit: 1, alpha: .75 }); return; }
  drawEnt(32, 16, 22, c => { c.scale(e.dir, 1); if (e.state === 'lunge') c.rotate(-.25); c.drawImage(MOBSPR.lurk, -8, -7); }, x + e.w / 2, y + e.h, { flash: o.flash || (e.state === 'rise' && (e.t >> 2) & 1), ly: -3 });
});
// ---- cave crawler ----
mob('crawler', { w: 10, h: 4, hp: 40, dmg: 10, contact: false, name: 'Crawler', canStep: true }, (e, p, dx, dy, dist) => {
  const ceilAt = (x, y) => solidAt(floor(x / T), floor((y - 1) / T));
  if (e.state === 'idle') e.state = ceilAt(e.x + e.w / 2, e.y) ? 'ceil' : 'skitter';
  e.ph += .3;
  if (e.state === 'ceil') {
    e.vy = 0; e.vx = approach(e.vx, e.dir * .6, .05); if (!ceilAt(e.x + e.w / 2 + e.dir * 6, e.y) || e.hitWall) e.dir *= -1;
    if (!p.dead && abs(dx) < 10 && dy > 0 && dy < 130 && e.t > 30) { e.state = 'drop'; e.t = 0; sfx('tele'); }
    if (!ceilAt(e.x + e.w / 2, e.y)) e.state = 'drop';
    e.x += e.vx; if (boxHits(e.x, e.y, e.w, e.h)) { e.x -= e.vx; e.dir *= -1; } return;
  }
  if (e.state === 'drop') { e.vy = min(e.vy + .3, 6); e.vx *= .9; if (e.onGround) { e.state = 'skitter'; e.t = 0; dust(e.x + 5, e.y + e.h, 3); } if (!e.hitP && !p.dead && overlap(e, p)) { e.hitP = true; hurtPlayer(e.dmg + 4, e.x); applyStatus(p, 'poison', e, { d: 300 }); } }
  else if (e.state === 'skitter') {
    e.vy = min(e.vy + .25, 5); e.dir = sign(dx) || e.dir; e.vx = approach(e.vx, e.dir * 1.6, .15);
    if (!p.dead && overlap(e, p) && e.t % 40 === 0) { hurtPlayer(e.dmg, e.x); if (Math.random() < .5) applyStatus(p, 'poison', e, { d: 240 }); }
    if (e.hitWall && e.t > 120) { e.state = 'climb'; e.t = 0; }
  } else if (e.state === 'climb') { e.vy = -1.4; e.vx = e.dir * .3; if (ceilAt(e.x + e.w / 2, e.y) || e.t > 120) { e.state = 'ceil'; e.t = 0; e.hitP = false; } }
  moveBody(e);
}, (e, x, y, o) => drawEnt(32, 16, 16, c => { c.scale(e.dir, e.state === 'ceil' ? -1 : 1); c.drawImage(MOBSPR[(e.ph | 0) % 2 ? 'crawl1' : 'crawl0'], -5, -2); }, x + e.w / 2, y + e.h / 2, { flash: o.flash || (e.state === 'drop' && e.t < 10) }));
// ---- dune serpent ----
function sandTop(tx, y0) { let y = max(0, y0); while (y < WH - 1 && !solidAt(tx, y)) y++; while (y > 0 && solidAt(tx, y - 1)) y--; return y; }
mob('serpent', { w: 10, h: 8, hp: 130, dmg: 20, contact: false, kbRes: .6, name: 'Dune Serpent' }, (e, p, dx, dy, dist) => {
  if (!e.trail) e.trail = [];
  const tx = clamp(floor((e.x + 5) / T), 0, WW - 1);
  if (e.state === 'idle' || e.state === 'burrow') {
    e.state = 'burrow'; e.noHit = true; e.trail.length = 0; const top = sandTop(tx, floor(e.y / T) - 8); e.y = top * T + 6; e.x += clamp(dx, -1.6, 1.6) * (dist < 300 ? 1 : 0);
    if (e.t % 6 === 0) dust(e.x + 5, top * T, 2, '#d67645', .5);
    if (!p.dead && abs(dx) < 16 && dy < 10 && dy > -60 && e.t > 60) { e.state = 'rumble'; e.t = 0; sfx('tele'); }
  } else if (e.state === 'rumble') { const top = sandTop(tx, floor(e.y / T) - 8); if (e.t % 3 === 0) { P(e.x + 5 + frand(-14, 14), top * T, frand(-.4, .4), frand(-2.2, -.8), 24, fpick(['#d67645', '#f0b070', '#bd5a36']), { g: .12 }); addShake(.6); } if (e.t > 40) { e.state = 'erupt'; e.t = 0; e.noHit = false; e.vy = -6.2; e.vx = (sign(dx) || 1) * 1.1; e.hitP = false; addShake(3); sfx('boom', 0); } }
  else if (e.state === 'erupt') {
    e.vy += .2; e.x += e.vx; e.y += e.vy; e.trail.unshift([e.x, e.y]); if (e.trail.length > 18) e.trail.pop();
    if (!e.hitP && !p.dead && overlap(e, p, 3)) { e.hitP = true; hurtFighter(p, e.dmg, e.x + 5, { kx: sign(e.vx || 1) * 2.4, ky: -4 }); applyStatus(p, 'poison', e, { d: 300 }); }
    if (e.vy > 0 && e.y >= sandTop(clamp(floor((e.x + 5) / T), 0, WW - 1), floor(e.y / T) - 4) * T) { e.state = 'dive'; e.t = 0; dust(e.x + 5, e.y, 8, '#d67645'); }
  } else if (e.state === 'dive') { e.y += 1.5; e.trail.pop(); if (e.t > 26) { e.state = 'burrow'; e.t = 0; } }
}, (e, x, y, o) => {
  if (e.state === 'burrow' || e.state === 'rumble') return;
  for (let k = e.trail.length - 1; k >= 2; k -= 2) { const [sx, sy] = e.trail[k]; drawEnt(16, 8, 8, c => c.drawImage(MOBSPR.sseg, -3, -3), sx + 5, sy + 4, { flash: o.flash }); }
  drawEnt(32, 16, 16, c => { c.rotate(atan2(e.vy, e.vx || .01)); c.drawImage(MOBSPR.shead, -5, -4); }, x + 5, y + 4, { flash: o.flash });
});
// ---- crystal golem ----
mob('golem', { w: 12, h: 19, hp: 280, dmg: 24, contact: false, kbRes: .85, armor: .5, name: 'Crystal Golem', canStep: true, heavy: true }, (e, p, dx, dy, dist) => {
  e.vy = min(e.vy + .3, 6);
  if (e.state === 'idle' || e.state === 'walk') {
    e.state = 'walk'; if (dist < 260 && !p.dead) { e.dir = sign(dx) || 1; e.vx = approach(e.vx, e.dir * .45, .04); e.ph += .08; } else e.vx *= .8;
    if (e.t > 70 && dist < 46 && abs(dy) < 30) { e.state = 'raise'; e.t = 0; sfx('tele'); } else if (e.t > 140 && dist < 160 && dist > 60) { e.state = 'aim'; e.t = 0; sfx('tele'); }
  } else if (e.state === 'raise') { e.vx *= .7; if (e.t > 34) { e.state = 'slam'; e.t = 0; addShake(5); sfx('boom', 0); const cx = e.x + e.w / 2, gy = e.y + e.h; for (const s of [-1, 1]) spawnProj({ type: 'shock', x: cx + s * 10, y: gy - 4, vx: s * 2.6, vy: 0, r: 5, dmg: 16, life: 46, pierce: true }); burst(cx, gy, 16, ['#a58ae0', '#e0d2ff', '#5a4a8a'], 2.4, 30, { hit: 1 }); if (!p.dead && abs(dx) < 22 && abs(dy) < 24) hurtFighter(p, e.dmg, cx, { kx: e.dir * 3, ky: -3.4 }); } }
  else if (e.state === 'aim') { e.vx *= .7; if (e.t % 4 === 0) P(e.x + e.w / 2, e.y + 4, frand(-.5, .5), frand(-.5, .5), 14, '#e0d2ff', { glow: 1, g: 0 }); if (e.t > 40) { const cx = e.x + e.w / 2, cy = e.y + 5, a0 = atan2(dy, dx); for (let k = -2; k <= 2; k++) { const a = a0 + k * .18; spawnProj({ type: 'shard', x: cx, y: cy, vx: cos(a) * 3.4, vy: sin(a) * 3.4, g: .02, r: 3, dmg: 9, life: 90 }); } sfx('reflect', 0); e.state = 'slam'; e.t = 0; } }
  else if (e.state === 'slam') { e.vx *= .8; if (e.t > 44) { e.state = 'walk'; e.t = 0; } }
  moveBody(e);
}, (e, x, y, o) => drawEnt(48, 24, 40, c => { c.scale(e.dir, 1); if (e.state === 'raise') c.translate(0, -2); const b = e.state === 'walk' ? round(sin(e.ph * 3) * .8) : 0; c.drawImage(MOBSPR.golem, -6, -19 + b); }, x + e.w / 2, y + e.h, { flash: o.flash || ((e.state === 'raise' || e.state === 'aim') && (e.t >> 2) & 1), ly: -9 }));
// glassflies come apart into shards
function mobDeath(e) {
  const cx = e.x + e.w / 2, cy = e.y + e.h / 2;
  if (e.type === 'glassfly') for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + frand(.3); spawnProj({ type: 'shard', x: cx, y: cy, vx: cos(a) * 2.2, vy: sin(a) * 2.2 - .5, g: .08, r: 2, dmg: 3, life: 40 }); }
  if (e.type === 'golem') { addShake(6); burst(cx, cy, 30, ['#a58ae0', '#e0d2ff', '#ffffff', '#5a4a8a'], 3, 50, { glow: 1, g: .05 }); G.flags.golemDown = true; }
  if (e.type === 'serpent') G.flags.serpentDown = true;
}
// ---------------- where things live ----------------
function spawnMob(type, tx, ty) {
  const e = mkEnemy(type, tx * T + 1, 0); e.y = e.py = ty * T - e.h - (e.fly ? 26 : 0);
  if (type === 'lurker') { e.y = e.py = ty * T - e.h; e.hx = e.x; e.hy = e.y; }
  if (type === 'crawler') { e.y = e.py = ty * T; e.state = 'ceil'; }
  if (type === 'serpent') { e.state = 'burrow'; e.noHit = true; }
  G.enemies.push(e); return e;
}
// surface creatures by biome: [type, weight, night only?]
const BIOME_MOBS = {
  moor: [['ashhare', 3], ['thornback', 2], ['mote', 3], ['husk', 2, 1]], thorn: [['thornback', 4], ['ashhare', 2], ['husk', 2, 1], ['mote', 1]],
  reach: [['mite', 4], ['glassfly', 2], ['ashhare', 1], ['husk', 1, 1]], ash: [['mote', 3], ['husk', 3], ['bat', 1, 1]],
  scoria: [['rustback', 4], ['mote', 2], ['husk', 1, 1]], fen: [['lurker', 0], ['mote', 2], ['ashhare', 1], ['bat', 2, 1], ['husk', 1, 1]],
  dunes: [['serpent', 1], ['ashhare', 2], ['glassfly', 1], ['husk', 1, 1], ['mote', 1]]
};
function pickMob(list, night) { const L = list.filter(m => m[1] > 0 && (!m[2] || night)); let s = 0; for (const m of L) s += m[1]; let r = Math.random() * s; for (const m of L) { r -= m[1]; if (r <= 0) return m[0]; } return L.length ? L[0][0] : 'mote'; }
// fen lurkers are placed in water near the player instead of on the ground
function trySpecialSpawn(realm, b, ptx, pty, night) {
  if (realm === 'surface' && b === 'fen' && Math.random() < .45 && G.enemies.filter(e => e.type === 'lurker').length < 2) {
    for (let k = 0; k < 20; k++) { const tx = ptx + (Math.random() < .5 ? -1 : 1) * randi(24, 60); for (let y = pty - 10; y < pty + 14; y++) if (inW(tx, y) && tiles[y * WW + tx] === WATER && tileAt(tx, y - 1) === WATER) { spawnMob('lurker', tx, y + 1); return true; } }
  }
  if (realm === 'under' && Math.random() < .3) {
    for (let k = 0; k < 16; k++) { const tx = ptx + (Math.random() < .5 ? -1 : 1) * randi(26, 52), ty = pty + randi(-14, 6); if (!inW(tx, ty)) continue; if (tileAt(tx, ty) === AIR && solidAt(tx, ty - 1) && !solidAt(tx, ty + 1) && !solidAt(tx, ty + 2)) { spawnMob('crawler', tx, ty); return true; } }
  }
  if (realm === 'under' && pty > (BASE_Y + DEEP_Y) / 2 && Math.random() < .08 && !G.enemies.some(e => e.type === 'golem')) {
    for (let k = 0; k < 16; k++) { const tx = ptx + (Math.random() < .5 ? -1 : 1) * randi(34, 60); for (let y = pty - 12; y < pty + 12; y++) if (solidAt(tx, y) && !solidAt(tx, y - 1) && !solidAt(tx, y - 2) && !solidAt(tx, y - 3) && !solidAt(tx + 1, y - 2)) { spawnMob('golem', tx, y); return true; } }
  }
  return false;
}
