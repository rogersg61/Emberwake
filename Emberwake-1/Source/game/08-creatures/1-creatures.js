// ============================================================
//  Enemies: ash mote, husk, cinder flit, glass mite, the Ashen
//  Warden, and Vesper, the Glass Waker (a duelist on the fighter rig)
// ============================================================
function mkEnemy(type, x, y) {
  const e = { type, x, y, px: x, py: y, vx: 0, vy: 0, onGround: false, flash: 0, stun: 0, state: 'idle', t: 0, dir: 1, dead: false, launched: 0, kbRes: 0, seed: Math.random() * 100, contact: true, sq: 0, wait: 30, ph: 0 };
  if (type === 'mote') Object.assign(e, { w: 10, h: 8, hp: 20, dmg: 8, name: 'Ash Mote' });
  else if (type === 'husk') Object.assign(e, { w: 6, h: 19, hp: 48, dmg: 14, kbRes: .25, canStep: true, contact: false, name: 'Husk' });
  else if (type === 'mite') Object.assign(e, { w: 9, h: 6, hp: 24, dmg: 9, canStep: true, name: 'Glass Mite' });
  else if (type === 'dummy') Object.assign(e, { w: 8, h: 18, hp: 600, dmg: 0, contact: false, name: 'Practice Post', keep: true });
  else if (type === 'skyray') Object.assign(e, { w: 18, h: 6, hp: 30, dmg: 10, fly: true, name: 'Skyray' });
  else if (type === 'rustback') Object.assign(e, { w: 12, h: 7, hp: 46, dmg: 12, canStep: true, kbRes: .3, name: 'Rustback', bounces: 0 });
  else if (type === 'cinderling') Object.assign(e, { w: 9, h: 8, hp: 26, dmg: 9, fireproof: true, name: 'Cinderling', spit: 60 + Math.random() * 60 });
  else if (MOBX[type]) Object.assign(e, MOBX[type].stats);
  else Object.assign(e, { w: 7, h: 6, hp: 13, dmg: 7, fly: true, name: 'Cinder Flit' });
  e.maxhp = e.hp; return e;
}
const overlap = (a, b, pad = 0) => a.x < b.x + b.w + pad && a.x + a.w > b.x - pad && a.y < b.y + b.h + pad && a.y + a.h > b.y - pad;

// returns 0 = no effect, 1 = hit, 2 = killed
function damageEnemy(e, dmg, kx, ky, o = {}) {
  if (e.ghost) return e.ghostDying ? 0 : netHitGhost(e, dmg, kx, ky, o);
  const root = e.root || e; if (e.dead || root.dead || root.invuln) return 0;
  if (o.dot) { root.hp -= dmg; e.flash = 3; numPop(e.x + e.w / 2, e.y - 2, dmg, '#ff9a3d'); if (root.hp <= 0) killEnemy(root); return 1; }
  dmg = max(1, round(dmg * (e.dmgMul || 1) * (root.vuln || 1) * (o.blunt && e.armor ? max(e.armor, .9) : e.armor || 1)));
  if (e.armor && e.armor < 1) sparks(o.hx === undefined ? e.x + e.w / 2 : o.hx, o.hy === undefined ? e.y : o.hy, 4, 0, 1.6, ['#d67645', '#f0b070']);
  if (root.type === 'keeper' && root.state !== 'stagger' && root.state !== 'dying' && (root.poise -= dmg) <= 0) { root.state = 'stagger'; root.t = 0; root.poise = root.phase === 2 ? 150 : 110; sfx('hit2', 0); addShake(5); }
  root.hp -= dmg; e.flash = 6; root.flash = 6;
  if (!root.noKb) {
    const kr = 1 - (e.kbRes || 0); e.vx = kx * kr; if (ky) { e.vy = ky * kr; e.onGround = false; }
    e.stun = max(e.stun, o.stagger || (o.stop >= 5 ? 22 : 13)); if (o.launch) e.launched = 34;
    if ((e.state === 'windup' || e.state === 'tele') && (o.stagger || o.stop >= 5 || e.t < 13)) { e.state = 'chase'; e.t = 0; }
    else if (e.state === 'swoop' || e.state === 'leap') { e.state = 'idle'; e.t = 0; }
  }
  hitFx(o.hx === undefined ? e.x + e.w / 2 : o.hx, o.hy === undefined ? e.y + e.h / 2 : o.hy, e.y, dmg, o, kx, true);
  if (root.hp <= 0) { killEnemy(root); return 2; }
  return 1;
}
function killEnemy(e) {
  if (e.type === 'dummy') { e.hp = e.maxhp; e.dead = false; sparks(e.x + 4, e.y + 6, 10); return; }
  if (e.boss && MOBX[e.type]) { if (e.state !== 'dying') { e.state = 'dying'; e.t = 0; e.hp = 0; e.invuln = true; e.vuln = 1; if (slowOK()) G.slowT = 40; sfx('roar', 0); } return; }
  if (e.type === 'keeper') { if (e.state !== 'dying') { e.state = 'dying'; e.t = 0; e.hp = 0; e.invuln = true; if (slowOK()) G.slowT = 40; sfx('roar', 0); } return; }
  if (e.type === 'boss') { if (e.state !== 'dying') { e.state = 'dying'; e.t = 0; e.hp = 0; e.invuln = true; if (slowOK()) G.slowT = 40; G.projs = G.projs.filter(p => p.owner); for (const f of e.fists) f.state = 'limp'; sfx('roar', 0); } return; }
  e.dead = true; const cx = e.x + e.w / 2, cy = e.y + e.h / 2; sfx('kill', 30); if (netHost()) netEnemyDied(e);
  burst(cx, cy, 16, e.type === 'bat' ? ['#5a4a72', '#3a2f4a', '#ffd35a'] : e.type === 'mite' ? FROST : ['#544a5c', '#3a3340', '#ff7a2a'], 2.4, 34, { hit: 1 }); sparks(cx, cy, 8, 0, 2.4, e.type === 'mite' ? FROST : SPARK);
  const r = Math.random(); mobDeath(e);
  if (blessOn('fortune')) rollDrops(e.type, cx, cy);
  if (rollDrops(e.type, cx, cy)) { }
  else if (e.type === 'mote') { if (r < .75) spawnDrop('cinder', randi(1, 2), cx, cy); }
  else if (e.type === 'husk') { if (r < .5) spawnDrop('cinder', randi(1, 3), cx, cy); if (r > .8) spawnDrop('shard', 1, cx, cy); else if (r > .62) spawnDrop('iron_ore', randi(1, 3), cx, cy); if (Math.random() < .16) spawnDrop('glowcap', 1, cx, cy); }
  else if (e.type === 'mite') { spawnDrop('snow', randi(1, 3), cx, cy); if (r < .25) spawnDrop('glowcap', 1, cx, cy); else if (r > .9) spawnDrop('shard', 1, cx, cy); }
  else if (e.type === 'skyray') { spawnDrop('skysilk', randi(1, 2), cx, cy); if (r < .2) spawnDrop('glowcap', 1, cx, cy); }
  else if (e.type === 'rustback') { spawnDrop(r < .5 ? 'copper_ore' : 'iron_ore', randi(2, 4), cx, cy); if (r > .85) spawnDrop('shard', 1, cx, cy); }
  else if (e.type === 'cinderling') { spawnDrop('cinder', randi(1, 3), cx, cy); if (r < .35) spawnDrop('shard', 1, cx, cy); }
  else if (r < .4) spawnDrop('cinder', 1, cx, cy);
  G.kills = (G.kills || 0) + 1; onKill(e.type);
}

function spawnTick() {
  if (netGuest()) return;
  if (netHost() && COOP.peers.size) { const ps = netPlayers(), keep = G.p, who = ps[(COOP.spawnK = ((COOP.spawnK | 0) + 1) % ps.length)]; if (who && who !== keep && !who.dead) { const k0 = G.enemies, near = G.enemies.filter(e => abs(e.x - who.x) < 110 * T), kf = G.fighters; G.p = who; G.enemies = near; G.fighters = kf.filter(f => !f.hollow || abs(f.x - who.x) < 110 * T); try { spawnTick0(); } finally { const add = G.enemies.filter(e => !near.includes(e)); const addF = G.fighters.filter(f => !kf.includes(f)); G.enemies = k0.concat(add); G.fighters = kf.concat(addF); G.p = keep; } return; } }
  spawnTick0();
}
function spawnTick0() {
  if (WORLD.arena || WORLD.mode === 1 || G.boss || G.duel || (G.dialog && !netLive()) || G.cine || G.time < 500 || --G.spawnT > 0) return; G.spawnT = 120 + frand(150); if (DIM) { dimSpawn(); return; }
  const p = G.p, ptx = floor(p.x / T), pty = floor(p.y / T), realm = realmAt(ptx, pty), night = G.dn < .3, under = realm === 'under' || realm === 'deep';
  if (placeAt(ptx, pty) === 'village' || abs(ptx - SPAWN_X) < VIL_W + 12 && !under) return;
  let n = 0, nh = 0; for (const e of G.enemies) if (!e.dead) n++; for (const f of G.fighters) if (f.hollow && !f.dead) nh++;
  if (G.ev && eventSpawn()) return;
  if (n + nh >= (realm === 'deep' ? 5 : under ? 5 : realm === 'drift' ? 3 : night ? 5 : 3)) return;
  const edge = ceil(VS.vw / T / 2) + 4; // just past the edge of the screen
  if (realm === 'drift') {
    for (let tries = 0; tries < 10; tries++) { const x = p.x + (Math.random() < .5 ? -1 : 1) * frand(edge * T, edge * T + 100), y = p.y + frand(-60, 30); if (x < 40 || x > WW * T - 40 || boxHits(x, y, 18, 6)) continue; const e = mkEnemy(Math.random() < .85 ? 'skyray' : 'bat', x, y); e.hx = x; e.hy = y; G.enemies.push(e); return; }
    return;
  }
  for (let tries = 0; tries < 14; tries++) {
    const tx = ptx + (Math.random() < .5 ? -1 : 1) * floor(frand(edge, edge + 22)); if (tx < 3 || tx > WW - 4) continue;
    if (abs(tx - SPAWN_X) < VIL_W + 8 || abs(tx - SHRINE2_X) < 28 || RESV[tx] > 1 && !under) continue;
    let ty = -1; const y0 = under ? pty + floor(frand(-14, 6)) : max(3, pty - 24), y1 = under ? y0 + 16 : pty + 24;
    for (let y = y0; y < y1; y++) if (solidAt(tx, y) && !TP[tileAt(tx, y)].ghost && !solidAt(tx, y - 1) && !solidAt(tx, y - 2) && !solidAt(tx, y - 3) && !liqAt(tx * T + 4, (y - 1) * T + 4)) { ty = y; break; }
    if (ty < 0 || (realmAt(tx, ty) !== realm && realm !== 'surface')) continue;
    const r = Math.random(), b = biomeAt(tx);
    if (trySpecialSpawn(realm, b, ptx, pty, night)) return;
    if (realm === 'deep') {
      if (r < .3 && nh < 2) { spawnHollow(tx * T + 1, (ty - 3) * T); return; }
      const e = mkEnemy(r < .8 ? 'cinderling' : 'bat', tx * T + 1, 0); e.y = e.py = ty * T - e.h - (e.fly ? 24 : 0); G.enemies.push(e); return;
    }
    let type;
    if (under) type = r < .25 ? 'bat' : r < .5 ? 'husk' : r < .62 ? 'crawler' : b === 'reach' ? (r < .8 ? 'mite' : 'glassfly') : b === 'scoria' ? 'rustback' : 'mote';
    else type = pickMob(BIOME_MOBS[b] || BIOME_MOBS.moor, night);
    if (type === 'crawler') { if (!trySpecialSpawn('under', b, ptx, pty, night)) type = 'husk'; else return; }
    if (type === 'serpent') { if (G.enemies.some(q => q.type === 'serpent') || TP[tileAt(tx, ty)].name !== 'Rustscale') type = 'ashhare'; }
    if (type === 'glassfly') { for (let k = 0; k < 3; k++) spawnMob('glassfly', tx + k, ty); return; }
    spawnMob(type, tx, ty); return;
  }
}
// hollowborn: what the Deep makes of people who stayed too long. They fight like you do, sidearms and all
function spawnHollow(x, y) {
  const wid = fpick(['fangs', 'nunchaku', 'spear', 'nunchaku']), h = newFighter(x, y, { name: 'HOLLOWBORN', skin: 11, team: 'h', wid, hp: 70, maxhp: 70, ai: newBrain(.42 + Math.random() * .12), dmgMul: .5, arms: [fpick(['smoke', 'shuriken', 'shuriken'])], hollow: true, spawnT: 20 });
  while (boxHits(h.x, h.y, h.w, h.h)) h.y -= T; h.py = h.y; h.ai.atkCd = 50; G.fighters.push(h);
  burst(h.x + 3, h.y + 10, 16, ['#3a2f4a', '#c58cf2', '#17121f'], 2, 30, { g: -.01 }); return h;
}
function hollowDrops(f) { const x = f.x + 3, y = f.y + 8, r = Math.random(); if (f.elite) { spawnDrop('steel_bar', randi(1, 3), x, y); spawnDrop('salve', 2, x, y); if (Math.random() < .6) spawnDrop(fpick(f.elite === 'castellan' ? ['steel_greatsword', 'steel_halberd', 'ember_sword', 'steel_greataxe', 'steel_body'] : ['steel_longsword', 'iron_flail', 'steel_spear', 'iron_battleaxe', 'iron_head']), 1, x, y); if (f.elite === 'castellan') spawnDrop('ember_bar', randi(1, 2), x, y); } spawnDrop('shard', randi(1, 2), x, y); spawnDrop('hollow_ash', randi(1, 3), x, y); if (r < .4) spawnDrop('salve', 1, x, y); else if (r < .7) spawnDrop(f.arms[0], randi(2, 4), x, y); if (Math.random() < .5) spawnDrop('cinder', randi(1, 3), x, y); }
// with friends here, each creature goes after whichever of you is nearest
function coopTarget(e) { let best = G.p, bd = 1e9; const ex = e.x + e.w / 2, ey = e.y + e.h / 2; for (const f of netPlayers()) { if (f.dead || f.noHit) continue; const d = abs(f.x + 3 - ex) + abs(f.y + 10 - ey) * 1.4 - (f === e.tgtF ? 40 : 0); if (d < bd) { bd = d; best = f; } } e.tgtF = best; return best; }
function tickEnemies() {
  if (netGuest()) return; const arr = G.enemies, keep = G.p, co = netHost() && COOP.peers.size > 0;
  for (let i = arr.length - 1; i >= 0; i--) { const e = arr[i]; if (co && !e.dead) G.p = coopTarget(e); try { tickEnemy(e, i, arr, G.p); } finally { G.p = keep; } }
}
function tickEnemy(e, i, arr, p) {
  {
    if (e.dead) { arr.splice(i, 1); return; }
    e.px = e.x; e.py = e.y; if (e.flash > 0) e.flash--;
    if (e.st && tickStatus(e)) return;
    if (e.root) return; if (e.type === 'boss') { tickBoss(e); return; } if (e.type === 'keeper') { tickKeeper(e); return; }
    if (e.type === 'dummy') { e.vy = min(e.vy + .3, 5); e.vx *= .6; moveBody(e); if (e.homeX === undefined) { e.homeX = e.x; e.homeY = e.y; } if (!e.tempPost && hypot(e.x - e.homeX, e.y - e.homeY) > 20 && e.flash <= 0 && (e.idle = (e.idle || 0) + 1) > 120) { dust(e.x + 4, e.y + e.h, 6); e.x = e.px = e.homeX; e.y = e.py = e.homeY; e.vx = e.vy = 0; e.idle = 0; dust(e.x + 4, e.y + e.h, 6); } else if (e.flash > 0) e.idle = 0; return; }
    const dx = (p.x + 3) - (e.x + e.w / 2), dy = (p.y + 10) - (e.y + e.h / 2), dist0 = hypot(dx, dy), lost = (e.st && e.st.blind > 0) || p.veil > 0, dist = lost ? 999 : dist0;
    if (dist0 > 760 && !e.boss) { arr.splice(i, 1); return; }
    if (e.launched > 0) e.launched--;
    if (e.stun > 0) { e.stun--; e.vy = min(e.vy + (e.launched > 0 ? .13 : .22), 5); e.vx *= e.onGround ? .8 : .97; moveBody(e); return; }
    if (e.st && e.st.frost > 0 && (G.time & 1)) { if (!e.fly) e.vy = min(e.vy + .22, 5); e.vx *= .9; if (e.type !== 'serpent' && !(e.type === 'crawler' && e.state === 'ceil')) moveBody(e); return; }
    e.t++;
    if (MOBX[e.type]) { MOBX[e.type].ai(e, p, dx, dy, dist); return; }
    if (e.type === 'mote') {
      if (e.onGround) { e.vx *= .7; if (e.t > e.wait) { const far = dist > 230 || p.dead; e.dir = sign(dx) || 1; if (far && Math.random() < .5) e.dir *= -1; e.vy = -(2.7 + frand(1.2)); e.vx = e.dir * (far ? .6 : 1.25 + frand(.5)); e.t = 0; e.wait = 28 + frand(40); e.sq = -1; } }
      e.vy = min(e.vy + .22, 5); const wg = e.onGround; moveBody(e); if (!wg && e.onGround) { e.sq = 1; dust(e.x + 5, e.y + e.h, 2, '#69636f'); } e.sq *= .86;
    } else if (e.type === 'mite') {
      if (e.state === 'idle' || e.state === 'chase') {
        if (dist < 230 && !p.dead) { e.dir = sign(dx) || 1; e.vx = approach(e.vx, e.dir * 1.05, .1); if (e.hitWall && e.onGround) e.vy = -3.6; if (abs(dx) < 62 && abs(dy) < 30 && e.onGround && e.t > 30) { e.state = 'tele'; e.t = 0; sfx('tele'); } }
        else e.vx *= .8;
        e.ph += abs(e.vx) * .5;
      } else if (e.state === 'tele') { e.vx *= .6; if (e.t >= 20) { e.state = 'leap'; e.t = 0; e.vx = e.dir * clamp(abs(dx) / 16, 1.6, 3.4); e.vy = -3.3; e.onGround = false; sfx('jump'); } }
      else if (e.state === 'leap') { if (e.onGround && e.t > 3) { e.state = 'chase'; e.t = 0; e.vx *= .3; dust(e.x + 4, e.y + e.h, 3, '#b4e6e8'); } }
      e.vy = min(e.vy + .24, 5.5); moveBody(e);
    } else if (e.type === 'husk') {
      if (e.state === 'idle' || e.state === 'chase') {
        if (dist < 250 && !p.dead) { e.dir = sign(dx) || 1; e.vx = approach(e.vx, e.dir * .74, .08); if (e.hitWall && e.onGround) e.vy = -4.2; if (abs(dx) < 20 && abs(dy) < 18 && e.onGround) { e.state = 'windup'; e.t = 0; sfx('tele'); } }
        else e.vx *= .8;
      } else if (e.state === 'windup') { e.vx *= .7; if (e.t >= 24) { e.state = 'swing'; e.t = 0; e.vx = e.dir * 2.7; e.hitDone = false; sfx('swing'); } }
      else if (e.state === 'swing') {
        e.vx *= .9; const hx = e.dir > 0 ? e.x + e.w - 2 : e.x - 16;
        if (!e.hitDone && e.t <= 8 && !p.dead && p.x < hx + 18 && p.x + p.w > hx && p.y < e.y + e.h && p.y + p.h > e.y - 4) { e.hitDone = true; hurtPlayer(e.dmg, e.x + e.w / 2); }
        if (e.t >= 12) { e.state = 'recover'; e.t = 0; }
      } else if (e.t >= 36) { e.state = 'chase'; e.t = 0; }
      e.ph += abs(e.vx) * .26; e.vy = min(e.vy + .24, 5.5); moveBody(e);
    } else if (e.type === 'skyray') {
      if (e.state === 'idle') {
        const tx = lost || dist > 300 ? (e.hx || e.x) + sin(e.t * .015 + e.seed) * 80 : p.x + 3 + sin(e.t * .02 + e.seed) * 90, ty = lost || dist > 300 ? (e.hy || e.y) + sin(e.t * .04) * 12 : p.y - 50 + sin(e.t * .045 + e.seed) * 14;
        e.vx = approach(e.vx, clamp((tx - e.x) * .02, -1.7, 1.7), .05); e.vy = approach(e.vy, clamp((ty - e.y) * .02, -1, 1), .05);
        if (e.t > 110 && dist < 170) { e.state = 'swoop'; e.t = 0; }
      } else {
        if (e.t < 20) { e.vx *= .9; e.vy = approach(e.vy, -1, .1); }
        else { if (e.t === 20) { const d = dist0 || 1; e.sx = dx / d; e.sy = dy / d; sfx('tele'); } e.vx = approach(e.vx, e.sx * 3.6, .35); e.vy = approach(e.vy, e.sy * 3.6, .35); }
        if (e.t > 58 || (e.t > 24 && (e.hitWall || e.onGround))) { e.state = 'idle'; e.t = frand(40); }
      }
      e.ph += .12; if (abs(e.vx) > .1) e.dir = sign(e.vx); moveBody(e);
    } else if (e.type === 'rustback') {
      if (e.state === 'idle' || e.state === 'chase') {
        e.armor = 0; if (dist < 240) { e.dir = sign(dx) || 1; e.vx = approach(e.vx, e.dir * .55, .06); if (e.hitWall && e.onGround) e.vy = -3.4; if (abs(dx) < 120 && abs(dy) < 22 && e.onGround && e.t > 60) { e.state = 'curl'; e.t = 0; sfx('tele'); } } else e.vx *= .8;
        e.ph += abs(e.vx) * .5;
      } else if (e.state === 'curl') { e.vx *= .7; e.armor = .3; if (e.t >= 22) { e.state = 'roll'; e.t = 0; e.vx = e.dir * 3.5; e.bounces = 0; sfx('dodge'); } }
      else if (e.state === 'roll') { e.armor = .3; e.vx = e.dir * 3.5; e.ph += .45; if (e.hitWall) { e.dir *= -1; e.bounces++; if (near(e)) { addShake(2); sfx('brk', 20); } dust(e.x + e.w / 2, e.y + e.h, 4, '#bd5a36'); if (e.bounces > 2) { e.state = 'uncurl'; e.t = 0; } } if (e.t > 120) { e.state = 'uncurl'; e.t = 0; } if (e.t % 4 === 0 && e.onGround) dust(e.x + e.w / 2, e.y + e.h, 1, '#bd5a36'); }
      else if (e.t > 30) { e.state = 'chase'; e.t = 0; e.armor = 0; } else e.vx *= .8;
      e.vy = min(e.vy + .24, 5.5); moveBody(e);
    } else if (e.type === 'cinderling') {
      if (e.onGround) { e.vx *= .7; if (e.t > e.wait) { e.dir = dist < 220 ? sign(dx) || 1 : (Math.random() < .5 ? -1 : 1); e.vy = -(2.4 + frand(1.4)); e.vx = e.dir * (1 + frand(.6)); e.t = 0; e.wait = 30 + frand(50); e.sq = -1; } }
      if (--e.spit <= 0 && dist < 150 && e.onGround) { e.spit = 100 + frand(60); const tt = 34, vx = clamp(dx / tt, -3.4, 3.4), vy = (dy - 4 - .5 * .16 * tt * tt) / tt; spawnProj({ type: 'glob', x: e.x + e.w / 2, y: e.y + 2, vx, vy, g: .16, r: 3, dmg: 8, life: 120, burn: 1 }); sfx('bolt', 30); e.sq = .6; }
      e.vy = min(e.vy + .22, 5); const wg = e.onGround; moveBody(e); if (!wg && e.onGround) { e.sq = 1; for (let k = 0; k < 3; k++) P(e.x + e.w / 2, e.y + e.h, frand(-.8, .8), frand(-1, -.2), 14, fpick(SPARK), { glow: 1 }); } e.sq *= .86;
      if (G.time % 6 === 0) P(e.x + frand(e.w), e.y, 0, -.6, 14, fpick(['#ff7a2a', '#ffd35a']), { glow: 1, g: -.02 });
    } else {
      if (e.state === 'idle') {
        const tx = p.x + 3 + sin(e.t * .03 + e.seed) * 54, ty = p.y - 36 + cos(e.t * .05 + e.seed) * 10;
        e.vx = approach(e.vx, clamp((tx - e.x) * .03, -1.3, 1.3), .06); e.vy = approach(e.vy, clamp((ty - e.y) * .03, -1.1, 1.1), .06);
        if (e.t > 120 && dist < 130 && !p.dead) { e.state = 'swoop'; e.t = 0; }
      } else {
        if (e.t < 14) { e.vx *= .85; e.vy = approach(e.vy, -.7, .1); }
        else { if (e.t === 14) { const d = dist || 1; e.sx = dx / d; e.sy = dy / d; sfx('tele'); } e.vx = approach(e.vx, e.sx * 3.1, .4); e.vy = approach(e.vy, e.sy * 3.1, .4); }
        if (e.t > 52 || (e.t > 18 && (e.hitWall || e.onGround))) { e.state = 'idle'; e.t = frand(50); }
      }
      if (abs(e.vx) > .1) e.dir = sign(e.vx); moveBody(e);
    }
    if (e.contact && !p.dead && !lost && overlap(e, p) && (e.type !== 'mite' || e.state === 'leap' || e.state === 'chase') && (e.type !== 'rustback' || e.state === 'roll')) hurtPlayer(e.dmg, e.x + e.w / 2);
  }
}

// ---------------- the Ashen Warden ----------------
function spawnBoss() {
  const gx = SHRINE_X * T + 4, gy = SHRINE_Y * T;
  const b = { type: 'boss', name: 'ASHEN WARDEN', x: gx - 20, y: gy - 20, w: 40, h: 32, vx: 0, vy: 0, hp: 1150, maxhp: 1150, flash: 0, stun: 0, noKb: true, state: 'intro', t: 0, phase: 1, atkN: 0, cd: 90, dead: false, gy, jaw: 0, core: 0, vuln: 1, dmg: 11, sub: null, rockT: 120, invuln: true, last: '', leash: 0 };
  b.px = b.x; b.py = b.y;
  b.fists = [-1, 1].map(s => ({ type: 'fist', root: b, side: s, x: b.x + 20 + s * 34 - 8, y: gy - 10, px: 0, py: 0, w: 16, h: 15, vx: 0, vy: 0, flash: 0, stun: 0, state: 'rest', t: 0, dmgMul: .6, hot: false, dead: false }));
  for (const f of b.fists) { f.px = f.x; f.py = f.y; }
  G.boss = b; G.enemies = G.enemies.filter(e => e.type === 'boss'); G.enemies.push(b, ...b.fists);
}
function despawnBoss() { const b = G.boss; if (!b) return; b.dead = true; for (const f of b.fists) f.dead = true; G.boss = null; G.projs = G.projs.filter(p => p.owner); }
function nextBoss(b) { b.atkN++; if (b.atkN >= 3) { b.state = 'tired'; b.t = 0; } else { b.state = 'idle'; b.t = 0; b.cd = b.phase === 2 ? 32 : 62; } }
function tickBoss(b) {
  b.t++; const p = G.p, gy = b.gy, pcx = p.x + 3, bcx = b.x + b.w / 2, P2 = b.phase === 2, hoverY = gy - 80;
  let tx = bcx, ty = b.y, sp = .045; b.core = max(0, b.core - .02);
  if (abs(pcx - (SHRINE_X * T + 4)) > 300 || p.dead) { if (++b.leash > 150 && b.state !== 'dying') { despawnBoss(); say('The Warden sinks back into its vigil. The shrine waits.'); return; } } else b.leash = 0;
  switch (b.state) {
    case 'intro': ty = hoverY; sp = .035; addShake(1.6); if (b.t % 3 === 0) dust(bcx + frand(-22, 22), gy, 2, '#69636f', 2);
      if (b.t === 75) { b.jaw = 1; sfx('roar', 0); addShake(9); } if (b.t > 75) b.jaw = max(0, b.jaw - .014);
      if (b.t > 150) { b.state = 'idle'; b.t = 0; b.cd = 45; b.invuln = false; } break;
    case 'idle': tx = pcx + sin(G.time * .013) * 44; ty = hoverY + sin(G.time * .04) * 5;
      if (--b.cd <= 0) {
        let pick; do { const r = Math.random(); pick = r < .42 ? 'slam' : r < .72 ? 'sweep' : 'barrage'; } while (pick === b.last && Math.random() < .7);
        b.last = pick; b.state = pick; b.t = 0;
        if (pick === 'slam') { const f = b.fists[pcx < bcx ? 0 : 1]; b.sub = f; f.state = 'aim'; f.t = 0; }
        else if (pick === 'sweep') { const f = b.fists[Math.random() < .5 ? 0 : 1]; b.sub = f; f.state = 'sweepPrep'; f.t = 0; }
      } break;
    case 'slam': tx = pcx - b.sub.side * 36; ty = hoverY; if (b.sub.state === 'rest' && b.t > 30) { if (P2 && b.t < 400 && !b.dbl) { b.dbl = true; const f = b.fists[b.sub.side < 0 ? 1 : 0]; b.sub = f; f.state = 'aim'; f.t = 0; b.t = 0; } else { b.dbl = false; nextBoss(b); } } break;
    case 'sweep': tx = pcx; ty = hoverY - 8; if (b.sub.state === 'rest' && b.t > 30) nextBoss(b); break;
    case 'barrage': {
      ty = hoverY + 8; b.core = min(1, b.t / 40); const n = P2 ? 8 : 5, k = b.t - 44;
      if (b.t < 40 && b.t % 2 === 0) { const an = frand(TAU), r = frand(18, 34); P(bcx + cos(an) * r, b.y + 4 + sin(an) * r, -cos(an) * 1.8, -sin(an) * 1.8, 14, fpick(SPARK), { glow: 1, g: 0, fr: 1 }); }
      if (k >= 0 && k % 7 === 0 && k / 7 < n) {
        const an = atan2(p.y + 10 - (b.y + 4), pcx - bcx) + (k / 7 - (n - 1) / 2) * .13, v = P2 ? 2.9 : 2.3;
        spawnProj({ type: 'bolt', x: bcx, y: b.y + 4, vx: cos(an) * v, vy: sin(an) * v, r: 3, dmg: 10, life: 170, reflect: true }); sfx('bolt', 0); b.core = 1;
      }
      if (k > n * 7 + 26) nextBoss(b); break;
    }
    case 'tired': ty = gy - b.h - 5; sp = .07; b.vuln = 1.5; if (b.t % 14 === 0) P(bcx + frand(-14, 14), b.y + 6, 0, -.4, 30, '#b9bdd0', { g: -.01 });
      if (b.t > (P2 ? 130 : 175)) { b.vuln = 1; b.state = 'idle'; b.t = 0; b.cd = 40; b.atkN = 0; } break;
    case 'roar': ty = hoverY; b.jaw = min(1, b.jaw + .1); addShake(5); if (b.t === 1) sfx('roar', 0);
      if (b.t % 3 === 0) { const an = frand(TAU); P(bcx, b.y + 16, cos(an) * 3, sin(an) * 3, 24, fpick(SPARK), { glow: 1, g: 0 }); }
      if (b.t > 85) { b.state = 'idle'; b.t = 0; b.cd = 30; b.invuln = false; } break;
    case 'dying': b.invuln = true; b.jaw = min(1, b.jaw + .05); b.x += frand(-.6, .6);
      if (b.t % 6 === 0) { const ex = bcx + frand(-20, 20), ey = b.y + frand(0, 32); burst(ex, ey, 10, SPARK, 2.6, 26, { glow: 1 }); burst(ex, ey, 6, ['#5f5a69', '#726d7d'], 2, 40, { hit: 1 }); sfx('hit2', 0); addShake(3); }
      if (b.t > 150) {
        G.flash = .95; G.flashCol = '255,241,168'; sfx('boom', 0); addShake(12); burst(bcx, b.y + 16, 70, SPARK, 5, 70, { glow: 1, g: .03 }); burst(bcx, b.y + 16, 50, ['#5f5a69', '#726d7d', '#4d4856'], 4, 80, { hit: 1 });
        b.dead = true; for (const f of b.fists) { f.dead = true; burst(f.x + 8, f.y + 7, 20, ['#5f5a69', '#726d7d'], 3, 60, { hit: 1 }); } G.boss = null;
        const first = !G.flags.wardenDead;
        if (first) { spawnDrop('wember', 1, bcx, b.y + 10, 0, -3); spawnDrop('warden_eye', 1, bcx - 12, b.y + 10, -1, -2.6); guardianFirst(); }
        sigilDrops('warden_sigil', first, bcx + 12, b.y + 10);
        spawnDrop('shard', 6, bcx - 8, b.y + 10); spawnDrop('iron_bar', 5, bcx + 8, b.y + 10); spawnDrop('salve', 2, bcx, b.y + 16);
        if (!countItem('maul')) spawnDrop('maul', 1, bcx + 14, b.y + 10, 1, -2.5);
        G.flags.wardenDead = true; G.dirty = true; onKill('boss');
      } return;
  }
  if (!P2 && b.hp < b.maxhp * .5 && b.state !== 'intro') {
    b.phase = 2; b.state = 'roar'; b.t = 0; b.invuln = true; b.vuln = 1; b.atkN = 0; b.dbl = false; for (const f of b.fists) if (f.state !== 'rest') { f.state = 'return'; f.t = 0; }
    say('The stone splits. Something under it is still burning.');
  }
  tx = clamp(tx, (SHRINE_X - 30) * T, (SHRINE_X + 30) * T);
  b.x += (tx - b.w / 2 - b.x) * sp; b.y += (ty - b.y) * sp;
  if (b.state !== 'roar' && b.state !== 'intro') b.jaw = max(0, b.jaw - .03);
  if (P2 && b.state !== 'roar' && --b.rockT <= 0) {
    b.rockT = 70 + frand(45); const rx = pcx + frand(-56, 56) + p.vx * 20;
    spawnProj({ type: 'rock', x: rx, y: gy - 175, vx: 0, vy: .5, g: .11, r: 4, dmg: 12, life: 220 }); G.trails.push({ kind: 'warn', x: rx, y: gy - 1, life: 55, max: 55 });
  }
  for (const f of b.fists) tickFist(b, f);
  if (!p.dead && b.state !== 'intro' && overlap(b, p, -3)) hurtPlayer(b.dmg, bcx);
}
function tickFist(b, f) {
  f.t++; const p = G.p, P2 = b.phase === 2, gy = b.gy; f.hot = false;
  const rx = b.x + b.w / 2 + f.side * 36 - f.w / 2, ry = b.y + b.h - 6 + sin(G.time * .05 + f.side) * 3;
  switch (f.state) {
    case 'rest': f.x += (rx - f.x) * .14; f.y += (ry - f.y) * .14; break;
    case 'aim': { const tx = p.x + 3 - f.w / 2 + p.vx * 9, ty = gy - 92; f.x += (tx - f.x) * .16; f.y += (ty - f.y) * .16; if (f.t > (P2 ? 26 : 40)) { f.state = 'tele'; f.t = 0; sfx('tele', 0); } break; }
    case 'tele': f.x += frand(-.9, .9); if (f.t > (P2 ? 10 : 16)) { f.state = 'slam'; f.t = 0; f.vy = 1; } break;
    case 'slam': f.hot = true; f.vy = min(f.vy + 1.1, 9.5); f.y += f.vy;
      if (f.y + f.h >= gy) {
        f.y = gy - f.h; f.state = 'stuck'; f.t = 0; addShake(8); sfx('boom', 0); G.hitstop = max(G.hitstop, 3); const cx = f.x + f.w / 2;
        for (let i = 0; i < 18; i++) P(cx, gy - 1, (i - 8.5) * .5, frand(-2, -.3), frand(18, 34) | 0, i % 2 ? '#938ea8' : '#514c62', { g: .05, fr: .95 });
        sparks(cx, gy - 2, 10, 0, 3); G.trails.push({ kind: 'ring', x: cx, y: gy, r: 30, life: 12, max: 12 });
        for (const s of [-1, 1]) spawnProj({ type: 'shock', x: cx + s * 10, y: gy - 4, vx: s * (P2 ? 3.4 : 2.7), vy: 0, r: 5, dmg: 13, life: P2 ? 62 : 48, pierce: true });
        if (!p.dead && abs(p.x + 3 - cx) < 20 && p.y + p.h > gy - 22) hurtPlayer(22, cx);
      } break;
    case 'stuck': if (f.t > (P2 ? 38 : 62)) { f.state = 'return'; f.t = 0; } break;
    case 'sweepPrep': { const tx = clamp(p.x + 3 + f.side * 120, (SHRINE_X - 26) * T, (SHRINE_X + 26) * T) - f.w / 2, ty = gy - f.h - 1; f.x += (tx - f.x) * .1; f.y += (ty - f.y) * .1; if (f.t > 46) { f.state = 'sweepTele'; f.t = 0; sfx('tele', 0); } break; }
    case 'sweepTele': f.x += frand(-.8, .8); if (f.t % 3 === 0) dust(f.x + f.w / 2, gy, 2, '#938ea8'); if (f.t > (P2 ? 14 : 22)) { f.state = 'sweep'; f.t = 0; } break;
    case 'sweep': f.hot = true; f.x -= f.side * (P2 ? 5.2 : 4.3); if (f.t % 2 === 0) dust(f.x + f.w / 2 + f.side * 8, gy, 2, '#938ea8', 1.5); if (f.t > (P2 ? 46 : 54)) { f.state = 'return'; f.t = 0; } break;
    case 'return': f.x += (rx - f.x) * .1; f.y += (ry - f.y) * .1; if (abs(rx - f.x) < 5 && abs(ry - f.y) < 5) f.state = 'rest'; break;
    case 'limp': f.vy = min((f.vy || 0) + .3, 6); f.y = min(gy - f.h, f.y + f.vy); break;
  }
  if (f.hot && !p.dead && overlap(f, p, 1)) hurtPlayer(f.state === 'slam' ? 22 : 17, f.x + f.w / 2);
}

// ---------------- Vesper, the Glass Waker (Chapter II) ----------------
function startDuel() {
  const x = SHRINE2_X * T + 4 + 60, y = SHRINE2_Y * T - 20;
  const v = newFighter(x, y, { name: 'VESPER', title: 'The Glass Waker', skin: 4, team: 'v', wid: 'vpike', hp: 520, maxhp: 520, ai: newBrain(.78, { home: { x: SHRINE2_X * T + 4, r: 150 } }), dbl: true, e2: true, dmgMul: .62, isBoss: true, phase: 1, yieldAt: vesperYield });
  v.face = -1; v.spawnT = 40; G.duel = v; G.fighters.push(v);
  burst(v.x + 3, v.y + 10, 40, FROST, 3, 50, { glow: 1, g: .02 }); sfx('reflect', 0); G.flash = .3; G.flashCol = '220,247,245';
  G.banner = { text: 'VESPER', sub: 'The Glass Waker', t: 0 };
}
function tickDuel() {
  const v = G.duel; if (!v) return;
  if (v.yielded) { v.px = v.x; v.py = v.y; v.vy = min(v.vy + .26, 6); v.vx *= .8; moveBody(v); if (v.yieldT > 0 && --v.yieldT === 0) talk(G.flags.vesperDone ? 'vesper_after2' : 'vesper_after'); return; }
  const p = G.p, cx = SHRINE2_X * T + 4;
  if (abs(p.x - cx) > 330 || p.dead) { if (++v.leash > 150) { endDuel(false); return; } } else v.leash = 0;
  if (v.phase === 1 && v.hp < v.maxhp * .55) {
    v.phase = 2; v.wid = 'vfangs'; v.dmgMul = .7; v.ai.skill = .82; v.inv = 30; burst(v.x + 3, v.y + 8, 30, FROST, 3, 40, { glow: 1 }); sfx('reflect', 0);
    say('Fast hands. Let us see how fast.', 'vesper');
  }
  if (v.phase === 2 && v.hp < v.maxhp * .3 && !v.echoed) {
    v.echoed = true; say('Mirror, mirror.', 'vesper'); sfx('shrine', 0); G.flash = .25; G.flashCol = '143,245,230';
    for (const s of [-1, 1]) {
      const e = newFighter(v.x + s * 40, v.y - 10, { name: 'MIRROR ECHO', skin: 4, team: 'v', wid: s < 0 ? 'sword' : 'spear', hp: 45, maxhp: 45, ai: newBrain(.35, { home: { x: SHRINE2_X * T + 4, r: 170 } }), fade: .62, dmgMul: .55, echo: true });
      e.ai.atkCd = 60; G.fighters.push(e); burst(e.x + 3, e.y + 10, 20, FROST, 2.5, 40, { glow: 1 });
    }
  }
}
function vesperYield(v) {
  v.yielded = true; v.kneel = true; v.noHit = true; v.atk = null; v.state = 'normal'; v.ai = null; v.vx = 0;
  if (slowOK()) G.slowT = 30; G.flash = .5; G.flashCol = '220,247,245'; sfx('perfect', 0); burst(v.x + 3, v.y + 10, 30, FROST, 2.5, 50, { glow: 1 });
  for (const e of G.fighters) if (e.echo) { e.dead = true; e.gone = true; burst(e.x + 3, e.y + 10, 24, FROST, 2.6, 40, { glow: 1 }); }
  G.projs = G.projs.filter(p => p.owner === G.p); v.yieldT = 55;
}
function endDuel(won) {
  const v = G.duel; if (!v) return; G.duelEnd = won ? 'won' : 'lost';
  for (const e of G.fighters) if (e === v || e.echo) e.gone = true;
  G.fighters = G.fighters.filter(e => !e.gone); G.duel = null;
  burst(v.x + 3, v.y + 10, 50, FROST, 3.4, 60, { glow: 1, g: .02 }); sfx('reflect', 0);
  if (won) {
    const x = v.x + 3, y = v.y + 6, first = !G.flags.vesperDone;
    if (first) { spawnDrop('wember2', 1, x, y, 0, -3); spawnDrop('glass_tear', 1, x - 8, y, -1, -2.6); guardianFirst(); }
    sigilDrops('glass_sigil', first, x + 8, y);
    if (!countItem('vpike')) spawnDrop('vpike', 1, x - 6, y, -1, -2.5);
    if (!countItem('vfangs')) spawnDrop('vfangs', 1, x + 6, y, 1, -2.5);
    spawnDrop('shard', 4, x, y); spawnDrop('salve', 2, x, y);
    G.flags.vesperDone = true; G.dirty = true; unlock('vesper2');
  } else say('Come back when you have learned something, Waker.', 'vesper');
}


// ---------------- the Forge-Keeper, in the Drowned Forge ----------------
// a giant on the fighter rig. It throws its own ember flasks and chain hook, so the relationships cut both ways:
// it cannot be pinned or burned, but a smoke pellet blinds it, and a blinded Keeper is open to the Ash Dance.
function spawnKeeper() {
  const s = SPOTS.keeper, x = s.x * T, y = (s.y - 5) * T;
  const k = { type: 'keeper', name: 'THE FORGE-KEEPER', x, y, px: x, py: y, w: 12, h: 34, vx: 0, vy: 0, hp: 1500, maxhp: 1500, flash: 0, stun: 0, state: 'intro', t: 0, phase: 1, dir: -1, face: -1, onGround: false, dead: false, heavy: true, fireproof: true, noKb: true, cd: 50, atkN: 0, poise: 110, dmg: 16, canStep: true, contact: false, invuln: true, leash: 0, last: '', core: 0, foes: [], vuln: 1, ph: 0 };
  G.boss = k; G.enemies = G.enemies.filter(e => e.type === 'keeper'); G.enemies.push(k); G.flags.keeperMet = true;
}
function keeperHit(k, x0, x1, y0, y1, dmg, kx, ky) { const p = G.p; if (!p.dead && p.x + p.w > x0 && p.x < x1 && p.y + p.h > y0 && p.y < y1) { if (hurtFighter(p, dmg, k.x + k.w / 2, { kx, ky, stagger: 1 })) { addShake(6); return true; } } return false; }
function keeperShock(k, n) { const cx = k.x + k.w / 2, fy = k.y + k.h; for (const s of [-1, 1]) spawnProj({ type: 'shock', x: cx + s * 12, y: fy - 4, vx: s * (k.phase === 2 ? 3.5 : 2.8), vy: 0, r: 5, dmg: 13, life: n, pierce: true }); G.fires.push({ x0: cx - 24, x1: cx + 24, y: fy, life: 150, max: 150, by: null }); }
function tickKeeper(k) {
  k.t++; const p = G.p, P2 = k.phase === 2, cx = k.x + k.w / 2, pcx = p.x + 3, dx = pcx - cx, adx = abs(dx), blind = k.st && k.st.blind > 0, F = SPOTS.forge;
  k.foes = p.dead ? [] : [p]; k.face = k.dir; k.core = max(0, k.core - .03);
  if (k.state !== 'dying') { if (pcx < (F.x0 - 14) * T || pcx > (F.x1 + 14) * T || p.dead) { if (++k.leash > 150) { G.boss = null; k.dead = true; say('The Keeper goes back to its anvil. The forge waits.'); return; } } else k.leash = 0; }
  const look = () => { if (!blind) k.dir = sign(dx) || k.dir; }, W = P2 ? .75 : 1;
  const next = () => { k.atkN++; k.vuln = 1; if (k.atkN >= (P2 ? 5 : 4)) { k.state = 'tired'; k.t = 0; } else { k.state = 'idle'; k.t = 0; k.cd = P2 ? 26 : 44; } };
  switch (k.state) {
    case 'intro': G.barT = 1; if (k.t === 1) { sfx('roar', 0); addShake(6); } if (k.t % 4 === 0) P(cx + frand(-8, 8), k.y + 4, 0, -1, 20, fpick(SPARK), { glow: 1, g: -.02 }); if (k.t > 120) { k.state = 'idle'; k.t = 0; k.invuln = false; G.banner = { text: 'THE FORGE-KEEPER', sub: 'it still works the forge', t: 0 }; } break;
    case 'idle': look(); if (blind) { k.vx = approach(k.vx, sin(k.t * .05) * .6, .05); if (k.t % 30 === 0 && Math.random() < .5) { k.state = 'sweep'; k.t = 0; } break; }
      k.vx = adx > 30 ? approach(k.vx, k.dir * (P2 ? 1.05 : .75), .06) : approach(k.vx, 0, .1); k.ph += abs(k.vx) * .18;
      if (--k.cd <= 0) {
        const opts = adx < 46 ? ['slam', 'sweep', 'sweep'] : adx < 150 ? ['leap', 'hook', 'flask', 'slam'] : ['flask', 'leap', 'hook'];
        let pick; do pick = fpick(opts); while (pick === k.last && Math.random() < .7); k.last = pick; k.state = pick; k.t = 0; k.vx = 0;
      } break;
    case 'slam': { const wnd = round(32 * W); if (k.t < wnd) { look(); k.vx *= .8; if (k.t === wnd - 10) sfx('tele', 0); }
      else if (k.t === wnd) { const x0 = k.dir > 0 ? cx : cx - 46; keeperHit(k, x0, x0 + 46, k.y - 10, k.y + k.h + 2, 22, k.dir * 3.6, -3); keeperShock(k, P2 ? 60 : 44); addShake(10); sfx('boom', 0); G.hitstop = max(G.hitstop, 4); dust(cx + k.dir * 24, k.y + k.h, 14, '#938ea8', 2.4); sparks(cx + k.dir * 24, k.y + k.h - 2, 16, 0, 3); }
      else if (k.t > wnd + 30) next(); break; }
    case 'sweep': { const wnd = round(22 * W); if (k.t < wnd) { look(); k.vx *= .8; }
      else if (k.t < wnd + 8) { const x0 = k.dir > 0 ? cx - 6 : cx - 52; if (!k.hitDone) k.hitDone = keeperHit(k, x0, x0 + 58, k.y - 4, k.y + k.h, 17, k.dir * 4.2, -2.2); k.vx = k.dir * 1.2; if (k.t === wnd) sfx('heavy', 0); }
      else { k.hitDone = false; k.vx *= .8; if (k.t > wnd + 32) next(); } break; }
    case 'leap': if (k.t < 16) { look(); k.vx = 0; } else if (k.t === 16) { k.vx = clamp(dx / 38, -3.6, 3.6); k.vy = -6.2; k.onGround = false; sfx('jump', 0); }
      else if (k.onGround && k.t > 20 && !k.landed) { k.landed = true; k.vx = 0; addShake(9); sfx('boom', 0); keeperHit(k, cx - 34, cx + 34, k.y + k.h - 18, k.y + k.h + 4, 18, sign(dx) * 3.4, -3.6); keeperShock(k, P2 ? 50 : 36); dust(cx, k.y + k.h, 16, '#938ea8', 2.4); }
      else if (k.landed && k.t > 60) { k.landed = false; next(); } break;
    case 'flask': look(); k.vx *= .8; if (k.t > 18 && (k.t - 18) % 9 === 0 && (k.t - 18) / 9 < (P2 ? 5 : 3)) { const i = (k.t - 18) / 9, tx = pcx + (i - 1) * 26 + p.vx * 14, tt = 40, vx = clamp((tx - cx) / tt, -5, 5), vy = (p.y + 10 - (k.y + 4) - .5 * .17 * tt * tt) / tt; spawnProj({ type: 'flask', arm: 1, owner: k, x: cx + k.dir * 6, y: k.y + 4, vx, vy, g: .17, r: 3, dmg: 9, life: 140, kb: [1, -1.5], hits: new Set() }); sfx('swing', 0); k.throwT = 8; }
      if (k.t > 18 + (P2 ? 5 : 3) * 9 + 24) next(); break;
    case 'hook': look(); k.vx *= .8; if (k.t === 16) { const an = atan2(p.y + 10 - (k.y + 10), dx); spawnProj({ type: 'hook', arm: 1, owner: k, x: cx, y: k.y + 10, vx: cos(an) * 8, vy: sin(an) * 8, g: 0, r: 4, dmg: 6, life: 26, kb: [0, 0], hits: new Set() }); sfx('thrust', 0); k.throwT = 10; }
      if (k.t > 22 && p.st && (p.st.reel > 0 || p.st.hook > 0)) { k.state = 'slam'; k.t = 14; k.last = 'slam'; } else if (k.t > 48) next(); break;
    case 'tired': k.vx *= .8; k.vuln = 1.5; if (k.t % 12 === 0) P(cx + frand(-6, 6), k.y + 6, 0, -.5, 30, '#b9bdd0', { g: -.01 }); if (k.t > (P2 ? 100 : 140)) { k.vuln = 1; k.state = 'idle'; k.t = 0; k.cd = 30; k.atkN = 0; } break;
    case 'stagger': k.vx *= .7; k.vuln = 1.35; if (k.t > 80) { k.vuln = 1; k.state = 'idle'; k.t = 0; k.cd = 20; } break;
    case 'roar': k.vx = 0; addShake(4); if (k.t === 1) { sfx('roar', 0); for (const o of tileObjs.values()) if (o.id === HEARTH) G.fires.push({ x0: o.x * T - 30, x1: o.x * T + 38, y: (o.y + 1) * T, life: 240, max: 240, by: null }); }
      if (k.t % 3 === 0) { const an = frand(TAU); P(cx, k.y + 10, cos(an) * 3, sin(an) * 3, 24, fpick(SPARK), { glow: 1, g: 0 }); }
      if (k.t > 90) { k.state = 'idle'; k.t = 0; k.cd = 20; k.invuln = false; for (const s of [-1, 1]) { const e = mkEnemy('cinderling', cx + s * 70, k.y); G.enemies.push(e); } } break;
    case 'dying': k.invuln = true; k.vx = 0; if (k.t % 6 === 0) { const ex = cx + frand(-10, 10), ey = k.y + frand(0, 34); burst(ex, ey, 10, SPARK, 2.6, 26, { glow: 1 }); sfx('hit2', 0); addShake(3); }
      if (k.t > 150) {
        G.flash = .9; G.flashCol = '255,180,100'; sfx('boom', 0); addShake(12); burst(cx, k.y + 16, 70, SPARK, 5, 70, { glow: 1, g: .03 }); k.dead = true; G.boss = null;
        if (!G.flags.keeperDead) { spawnDrop('wember3', 1, cx, k.y + 10, 0, -3); spawnDrop('keeper_brand', 1, cx - 12, k.y + 10, -1, -2.6); guardianFirst(); }
        sigilDrops('keeper_sigil', !G.flags.keeperDead, cx + 12, k.y + 10);
        if (!countItem('kmaul')) spawnDrop('kmaul', 1, cx + 10, k.y + 10, 1, -2.5);
        spawnDrop('shard', 6, cx - 8, k.y + 10); spawnDrop('iron_bar', 4, cx + 8, k.y + 10); spawnDrop('flask', 5, cx, k.y + 10); spawnDrop('salve', 2, cx, k.y + 16);
        G.flags.keeperDead = true; G.dirty = true; onKill('keeper');
      } return;
  }
  if (!P2 && k.hp < k.maxhp * .5 && k.state !== 'intro' && k.state !== 'dying') { k.phase = 2; k.state = 'roar'; k.t = 0; k.invuln = true; k.atkN = 0; say('The hearths answer it. The whole forge is awake now.'); }
  if (k.throwT > 0) k.throwT--;
  k.vy = min(k.vy + .3, 7); moveBody(k);
  k.x = clamp(k.x, (F.x0 - 6) * T, (F.x1 + 6) * T);
}
const KMAUL = { held: null, grip: [3, 4] };
function keeperPose(k, al) {
  const P = basePose(), t = k.t + al, st = k.state; P.wAng = -1.9; P.armA = -1.2; P.armExt = .9;
  const sp = abs(k.vx);
  if (sp > .1 && k.onGround) { const ph = k.ph, A = min(1, sp / .8); P.l1a = sin(ph) * .7 * A; P.l1b = P.l1a - (.2 + .6 * max(0, cos(ph))) * A; P.l2a = sin(ph + PI) * .7 * A; P.l2b = P.l2a - (.2 + .6 * max(0, cos(ph + PI))) * A; P.bob = -abs(sin(ph)) * .8; }
  else P.bob = sin(G.time * .05) * .5;
  const W = k.phase === 2 ? .75 : 1;
  if (st === 'intro') { const u = clamp(t / 100, 0, 1); P.crouch = 4 * (1 - u); P.lean = .35 * (1 - u); P.head = .3 * (1 - u); P.wAng = lerp(1.3, -1.9, ease.io(u)); P.armA = lerp(1.3, -1.2, u); }
  else if (st === 'slam') { const wnd = 32 * W; if (t < wnd) { const u = ease.out(t / wnd); P.wAng = lerp(-1.9, -3.4, u); P.armA = P.wAng; P.armExt = 1; P.lean = -.3 * u; } else { const u = clamp((t - wnd) / 4, 0, 1); P.wAng = lerp(-3.4, 1.25, ease.out3(u)); P.armA = P.wAng; P.armExt = 1; P.lean = .45 * u; P.stance = 1; } }
  else if (st === 'sweep') { const wnd = 22 * W; if (t < wnd) { const u = ease.out(t / wnd); P.wAng = lerp(-1.9, -2.6, u); P.armA = P.wAng; P.lean = -.25 * u; } else { const u = clamp((t - wnd) / 8, 0, 1); P.wAng = lerp(-2.6, .5, ease.out(u)); P.armA = P.wAng; P.armExt = 1; P.lean = .35; P.stance = 1; } }
  else if (st === 'leap') { if (t < 16) P.crouch = 3 * t / 16; else if (!k.onGround) { P.tuck = .7; P.wAng = -2.8; P.armA = -2.6; } else { P.crouch = 3; P.wAng = 1.2; P.armA = 1.2; P.lean = .3; } }
  else if (st === 'flask' || st === 'hook') { if (k.throwT > 0) { P.armA = lerp(-2.2, 0, 1 - k.throwT / 10); P.armExt = 1; P.lean = .2; } P.armB = -2; }
  else if (st === 'tired') { P.crouch = 4; P.lean = .35; P.head = .35; P.armA = 1.4; P.wAng = 1.3; P.bob = sin(G.time * .08) * .8; }
  else if (st === 'stagger') { P.lean = -.45; P.head = -.35; P.armA = 2.3; P.armB = 2.6; P.wAng = 2; }
  else if (st === 'roar') { P.lean = -.4; P.head = -.45; P.armA = -2.2; P.armB = -1.6; P.armExt = 1; P.armBext = 1; P.wAng = -2.4; }
  else if (st === 'dying') { P.crouch = min(4, t / 20); P.lean = .4; P.head = .4; P.wAng = 1.5; P.armA = 1.5; }
  return P;
}

// ---------------- drawing ----------------
const HUSK_W = { held: null, grip: [1, 2] };
function huskPose(e, al) {
  const P = basePose(); P.lean = .22; P.armB = .9; P.armBext = .9; P.armA = .6; P.wAng = -.3; P.head = .1;
  const sp = abs(e.vx);
  if (e.onGround && sp > .1) { const ph = e.ph, A = min(1, sp / .7); P.l1a = sin(ph) * .7 * A; P.l1b = P.l1a - (.2 + .6 * max(0, cos(ph))) * A; P.l2a = sin(ph + PI) * .7 * A; P.l2b = P.l2a - (.2 + .6 * max(0, cos(ph + PI))) * A; P.bob = -abs(sin(ph)) * .8; }
  if (!e.onGround) { P.l1a = .5; P.l1b = -.2; P.l2a = -.4; P.l2b = -.8; }
  if (e.stun > 0) { P.lean = -.35; P.head = -.3; P.armA = 1.9; }
  else if (e.state === 'windup') { const u = ease.out(min(1, (e.t + al) / 18)); P.wAng = lerp(-.3, -2.5, u) + (e.t > 14 ? sin(G.time * 2.2) * .07 : 0); P.armA = P.wAng; P.armExt = 1; P.lean = .22 - .42 * u; }
  else if (e.state === 'swing') { const u = min(1, (e.t + al) / 6); P.wAng = lerp(-2.5, 1.1, ease.out3(u)); P.armA = P.wAng; P.armExt = 1; P.lean = .45; P.stance = 1; }
  else if (e.state === 'recover') { const u = min(1, (e.t + al) / 36); P.wAng = lerp(1.1, -.3, ease.io(u)); P.armA = lerp(1.1, .6, u); P.lean = lerp(.45, .22, u); }
  return P;
}
function drawEnemy(e, al) {
  const x = lerp(e.px, e.x, al), y = lerp(e.py, e.y, al), o = { flash: e.flash > 3 };
  if (MOBX[e.type]) { MOBX[e.type].draw(e, x, y, o); return; }
  if (e.type === 'mote') { const s = e.sq + sin(G.time * .12 + e.seed) * .06; drawEnt(32, 16, 26, c => { c.scale(1 + s * .32, 1 - s * .32); c.drawImage(SPR.mote, -6, -9); }, x + e.w / 2, y + e.h, { flash: o.flash, ly: -5 }); }
  else if (e.type === 'mite') { const fr = SPR.mite[(e.ph | 0) % 2], tele = e.state === 'tele'; drawEnt(32, 16, 24, c => { c.scale(e.dir, 1); if (e.state === 'leap') c.rotate(-.3); c.drawImage(fr, -5, -7 + (tele && (e.t >> 1) & 1 ? -1 : 0)); }, x + e.w / 2, y + e.h, { flash: o.flash || (tele && (e.t >> 2) & 1), ly: -4 }); }
  else if (e.type === 'bat') {
    const fl = sin(G.time * .55 + e.seed) * .75;
    drawEnt(32, 16, 16, c => { c.scale(e.dir, 1); for (const s of [1, -1]) { c.save(); c.scale(s, 1); c.translate(2, -1); c.rotate(-fl - .15); c.drawImage(SPR.wing, 0, -2); c.restore(); } c.drawImage(SPR.bat, -3, -3); }, x + e.w / 2, y + e.h / 2, o);
  } else if (e.type === 'husk') { HUSK_W.held = SPR.w_husk; SK_H.head = SPR.h_head; SK_H.torso = SPR.h_torso; drawEnt(64, 32, 46, c => { c.scale(e.dir, 1); drawRig(c, huskPose(e, al), SK_H, HUSK_W); }, x + e.w / 2, y + e.h, { flash: o.flash, ly: -10 }); }
  else if (e.type === 'dummy') drawEnt(32, 16, 28, c => { c.rotate(e.flash > 0 ? sin(e.flash * 1.6) * .12 : 0); c.drawImage(SPR.dummy, -5, -19); }, x + e.w / 2, y + e.h, { flash: o.flash, ly: -8 });
  else if (e.type === 'skyray') { const fr = SPR.skyray[(e.ph | 0) % 2]; drawEnt(32, 16, 16, c => { c.scale(e.dir, 1); c.rotate(clamp(e.vy * .12, -.4, .4)); c.drawImage(fr, -10, -4); }, x + e.w / 2, y + e.h / 2, { flash: o.flash, ly: 0 }); }
  else if (e.type === 'rustback') { const ball = e.state === 'roll' || e.state === 'curl' || e.state === 'uncurl' && e.t < 10; drawEnt(32, 16, 24, c => { if (ball) { c.translate(0, -5); c.rotate(e.ph * e.dir); c.drawImage(SPR.rustball, -5, -5); } else { c.scale(-e.dir, 1); c.drawImage(SPR.rustback[(e.ph | 0) % 2], -7, -7); } }, x + e.w / 2, y + e.h, { flash: o.flash || (e.state === 'curl' && (e.t >> 2) & 1), ly: -4 }); }
  else if (e.type === 'cinderling') { const s2 = e.sq; drawEnt(32, 16, 26, c => { c.scale(1 + s2 * .3, 1 - s2 * .3); c.drawImage(SPR.cinderling[(G.time >> 3) & 1], -5, -8); }, x + e.w / 2, y + e.h, { flash: o.flash, ly: -4, unlit: 1 }); }
  else if (e.type === 'keeper') { KMAUL.held = SPR.w_kmaul; const P2 = e.phase === 2; drawEnt(96, 48, 88, c => { c.scale(e.dir * 1.7, 1.7); drawRig(c, keeperPose(e, al), SK[12], KMAUL); }, x + e.w / 2 + (e.state === 'stagger' || e.state === 'dying' ? frand(-.6, .6) : 0), y + e.h, { flash: o.flash, ly: -18, tint: e.state === 'tired' ? [90, 90, 130, .25] : P2 ? [255, 110, 50, .12] : null }); }
  else if (e.type === 'fist') drawEnt(32, 16, 16, c => { if (e.side < 0) c.scale(-1, 1); c.drawImage(SPR.fist, -8, -7); }, x + e.w / 2 + (e.state === 'tele' || e.state === 'sweepTele' ? frand(-1, 1) : 0), y + e.h / 2, { tint: e.flash > 3 ? [255, 255, 255, .55] : e.hot ? [255, 120, 60, .25] : null });
  else if (e.type === 'boss') {
    const b = e, P2 = b.phase === 2, tired = b.state === 'tired', sh = (b.state === 'roar' || b.state === 'dying') ? frand(-1, 1) : 0;
    drawEnt(96, 48, 50, c => {
      c.drawImage(SPR.boss, -24, -26);
      const mo = 3 + round(b.jaw * 7); c.fillStyle = '#17121f'; c.fillRect(-10, 4, 20, mo); c.fillStyle = '#b9bdd0'; for (let i = 0; i < 5; i++) { c.fillRect(-9 + i * 4, 4, 2, 2); c.fillRect(-7 + i * 4, 4 + mo - 2, 2, 2); }
      if (b.jaw > .3) { c.fillStyle = '#ff7a2a'; c.fillRect(-6, 6, 12, max(0, mo - 4)); }
      const look = clamp(round((G.p.x - b.x - 20) / 40), -2, 2); c.fillStyle = tired ? '#6a3a22' : P2 ? '#fff1a8' : '#ff8a3d';
      for (const ex of [-12, 8]) c.fillRect(ex + look, tired ? -3 : -5, 3, tired ? 1 : 3);
      c.fillStyle = b.core > .5 ? '#ffffff' : '#ffd35a'; c.fillRect(-2, -16, 4, 5); c.fillStyle = '#ff7a2a'; c.fillRect(-3, -15, 1, 3); c.fillRect(2, -15, 1, 3); c.fillRect(-1, -11, 2, 1);
      if (P2) { c.fillStyle = '#ff7a2a'; for (let i = 0; i < 9; i++) { c.fillRect(-20 + i, -8 + (i >> 1) + (i & 1), 1, 1); c.fillRect(13 + (i >> 1), 6 + i, 1, 1); c.fillRect(-16 + (i >> 2), 8 + i, 1, 1); } }
    }, x + b.w / 2 + sh, y + b.h / 2, { tint: b.flash > 3 ? [255, 255, 255, .55] : tired ? [90, 90, 130, .28] : P2 ? [255, 90, 40, .14] : null });
  }
}
