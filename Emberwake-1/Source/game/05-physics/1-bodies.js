// ============================================================
//  Game state, physics bodies, particles, drops, projectiles
// ============================================================
const G = {
  state: 'title', time: 0, clock: .1, fires: [], smokes: [], stuck: [], linksKnown: new Set(), link: null, zoom: 1, zoomT: 1, armT: 0, linkBanner: null, hitstop: 0, shake: 0, tscale: 1, slowT: 0, p: null, enemies: [], fighters: [], npcs: [], drops: [], projs: [], nums: [], parts: [], trails: [], ghosts: [],
  flags: {}, combo: { n: 0, t: 0, pts: 0 }, feed: [], picks: [], cam: { x: 0, y: 0, px: 0, py: 0 }, boss: null, duel: null, flash: 0, flashCol: '255,255,255', sun: [1, 1, 1], dn: 1, spawnT: 0, biome: '', biomeT: 0,
  sel: 0, selT: 0, known: new Set(), movesUsed: new Set(), journal: [], jNew: false, q: 0, qFlash: 0, says: [], sayCur: null, note: null, banner: null, dialog: null, kfeed: [], skin: 0, hat: 0, nick: '', dirty: false, played: 0, introI: 0, introT: 0
};
const addShake = v => { G.shake = max(G.shake, v * .6); };
{
  let cur = null; const Q = [];
  Object.defineProperty(G, 'banner', { configurable: true, enumerable: true, get: () => cur, set: v => {
    if (!v) { cur = null; if (Q.length) { cur = Q.shift(); cur.t = -40; } return; }
    if (cur && cur !== v && cur.t < 170 && cur.t >= -40 && !WORLD.arena && v.text !== cur.text) { if (Q.length < 3 && !Q.some(b => b.text === v.text)) Q.push(v); return; }
    cur = v;
  } });
  G.bannerQ = Q;
}

function boxHits(x, y, w, h) {
  const x0 = floor(x / T), x1 = floor((x + w - .001) / T), y0 = floor(y / T), y1 = floor((y + h - .001) / T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (solidAt(tx, ty)) return true;
  return false;
}
function moveBody(e) {
  e.hitWall = 0; const wasG = e.onGround;
  const dx = e.vx;
  if (dx) {
    const n = ceil(abs(dx) / 4), sx = dx / n;
    for (let i = 0; i < n; i++) {
      e.x += sx;
      if (boxHits(e.x, e.y, e.w, e.h)) {
        if (e.canStep && wasG && e.vy >= 0 && !boxHits(e.x, e.y - T - .01, e.w, e.h)) { e.y -= T + .01; e.stepVis = (e.stepVis || 0) + T; continue; }
        e.x = sx > 0 ? floor((e.x + e.w - .001) / T) * T - e.w - .001 : (floor(e.x / T) + 1) * T + .001;
        e.hitWall = sign(sx); e.vx = 0; break;
      }
    }
  }
  e.onGround = false; e.hitCeil = false;
  const dy = e.vy;
  if (dy) {
    const n = ceil(abs(dy) / 4), sy = dy / n;
    for (let i = 0; i < n; i++) {
      const ob = e.y + e.h; e.y += sy;
      if (boxHits(e.x, e.y, e.w, e.h)) {
        if (sy > 0) { e.y = floor((e.y + e.h - .001) / T) * T - e.h; e.onGround = true; } else { e.y = (floor(e.y / T) + 1) * T; e.hitCeil = true; }
        e.vy = 0; break;
      }
      if (sy > 0 && !e.dropThru) {
        const ty = floor((e.y + e.h - .001) / T);
        if (ty * T >= ob - .01) { const x0 = floor(e.x / T), x1 = floor((e.x + e.w - .001) / T); let hit = false; for (let tx = x0; tx <= x1; tx++) if (platAt(tx, ty)) hit = true; if (hit) { e.y = ty * T - e.h; e.vy = 0; e.onGround = true; break; } }
      }
    }
  }
  if (e.x < 2) { e.x = 2; e.vx = 0; } if (e.x > WW * T - e.w - 2) { e.x = WW * T - e.w - 2; e.vx = 0; }
}

// ---------------- particles ----------------
function P(x, y, vx, vy, life, col, o) { if (SETTINGS.fpsMode || G.parts.length > 1400) return; const p = { x, y, vx, vy, life, max: life, col, sz: 1, g: .12, fr: .985, glow: 0, hit: 0 }; if (o) Object.assign(p, o); G.parts.push(p); }
function burst(x, y, n, cols, sp, life, o) { for (let i = 0; i < n; i++) { const a = frand(TAU), v = frand(.2, 1) * sp; P(x, y, cos(a) * v, sin(a) * v, max(4, life * frand(.5, 1) | 0), fpick(cols), o); } }
function tickParts() {
  const a = G.parts;
  for (let i = a.length - 1; i >= 0; i--) {
    const p = a[i]; if (--p.life <= 0) { a[i] = a[a.length - 1]; a.pop(); continue; }
    p.vy += p.g; p.vx *= p.fr; p.vy *= p.fr; p.x += p.vx; p.y += p.vy;
    if (p.hit && solidAt(floor(p.x / T), floor(p.y / T))) { p.y -= p.vy; p.vy *= -.35; p.vx *= .6; if (abs(p.vy) < .3) { p.vy = 0; p.g = 0; p.vx = 0; } }
  }
  const nm = G.nums; for (let i = nm.length - 1; i >= 0; i--) { const n = nm[i]; n.y += n.vy; n.vy *= .93; n.x += n.vx; if (--n.life <= 0) nm.splice(i, 1); }
  const tr = G.trails; for (let i = tr.length - 1; i >= 0; i--) if (--tr[i].life <= 0) tr.splice(i, 1);
  const gh = G.ghosts; for (let i = gh.length - 1; i >= 0; i--) if (--gh[i].life <= 0) { ghostPool.push(gh[i].cv); gh.splice(i, 1); }
}
function numPop(x, y, text, col = '#fff', sc = 1) { if (G.nums.length > 60) G.nums.shift(); G.nums.push({ x: x + frand(-3, 3), y, vx: frand(-.2, .2), vy: -1.3, life: 46, max: 46, text: String(text), col, sc }); }
const SPARK = ['#fff1a8', '#ffd35a', '#ff8a3d', '#ffffff'], FROST = ['#ffffff', '#dcf7f5', '#8fd0d8', '#c9fff6'];
function sparks(x, y, n, dirx = 0, sp = 2.4, cols = SPARK) { for (let i = 0; i < n; i++) { const a = frand(TAU), v = frand(.4, 1) * sp; P(x, y, cos(a) * v + dirx * 1.5, sin(a) * v - .4, frand(8, 20) | 0, fpick(cols), { glow: 1, g: .06, fr: .92 }); } }
function dust(x, y, n, col = '#b9bdd0', sp = .8) { for (let i = 0; i < n; i++) P(x + frand(-3, 3), y, frand(-1, 1) * sp, frand(-.7, -.1), frand(14, 28) | 0, col, { g: -.005, fr: .93 }); }

// ---------------- drops ----------------
function spawnDrop(id, n, x, y, vx, vy) { if (!IT[id] || n <= 0 || COOP.applying) return; for (const d of G.drops) if (d.id === id && d.t < 40 && abs(d.x + 3 - x) < 8 && abs(d.y + 3 - y) < 8 && d.n + n <= IT[id].stack) { d.n += n; return; } G.drops.push({ id, n, x: x - 3, y: y - 3, px: x - 3, py: y - 3, w: 6, h: 6, vx: vx === undefined ? frand(-1, 1) : vx, vy: vy === undefined ? frand(-2, -.8) : vy, t: 0, delay: 26, onGround: false }); }
function tickDrops() {
  const p = G.p, a = G.drops;
  for (let i = a.length - 1; i >= 0; i--) {
    const d = a[i]; d.px = d.x; d.py = d.y; d.t++; if (d.delay > 0) d.delay--;
    const dx = p.x + 3 - (d.x + 3), dy = p.y + 10 - (d.y + 3), dist = hypot(dx, dy) || 1;
    if (!p.dead && d.delay <= 0 && dist < (WORLD.arena ? 36 : G.magR || 36) && hasRoom(d.id)) {
      d.vx = lerp(d.vx, dx / dist * 3.4, .25); d.vy = lerp(d.vy, dy / dist * 3.4, .25); d.x += d.vx; d.y += d.vy;
      if (dist < 8) { const left = addItem(d.id, d.n); if (left < d.n) { sfx('pickup'); toastItem(d.id, d.n - left); onPickup(d.id); } if (left) { d.n = left; d.delay = 90; } else { netTook(d); a.splice(i, 1); continue; } }
    } else { d.vy = min(d.vy + .2, 5); d.vx *= d.onGround ? .8 : .985; moveBody(d); }
    if (d.t > 18000) a.splice(i, 1);
  }
}

// ---------------- projectiles ----------------
// owner = the fighter who threw it (it hurts that fighter's foes); no owner = a monster's (it hurts the player's side).
// ghost = a copy of someone else's shot, shown on this screen only: their own browser decides what it hits.
function spawnProj(o) {
  const pr = Object.assign({ x: 0, y: 0, vx: 0, vy: 0, r: 3, dmg: 5, owner: null, life: 120, type: 'bolt', g: 0, hits: new Set(), t: 0, kb: [2, -1], boom: 0 }, o); pr.px = pr.x; pr.py = pr.y;
  if (COOP.ghostFx) pr.ghost = true;
  G.projs.push(pr); if (pr.owner && (pr.owner === G.p || (pr.owner.brBot && !pr.owner.remote)) && !pr.ghost) netShot(pr); netShotOut(pr); return pr;
}
function boomFx(x, y, r) { addShake(4); sfx('boom', 60); burst(x, y, 22, SPARK, 3.2, 26, { glow: 1, g: .02 }); G.trails.push({ kind: 'ring', x, y: y + 2, r, life: 10, max: 10 }, { kind: 'hit', x, y, life: 6, max: 6, a: 0, big: true }); }
function tickProjs() {
  const a = G.projs;
  for (let i = a.length - 1; i >= 0; i--) {
    const pr = a[i]; if (pr.arm) { if (tickArm(pr)) a.splice(i, 1); continue; }
    pr.px = pr.x; pr.py = pr.y; pr.t++; pr.vy += pr.g; pr.x += pr.vx; pr.y += pr.vy;
    let dead = --pr.life <= 0; const tx = floor(pr.x / T), ty = floor(pr.y / T), solid = solidAt(tx, ty), ow = pr.owner;
    if (pr.type === 'shock') { if (solid || !solidAt(tx, ty + 1)) dead = true; if (pr.t % 2 === 0) { dust(pr.x, pr.y + 3, 2, '#8c8999', 1.2); P(pr.x, pr.y, frand(-.4, .4), frand(-2.4, -1), 14, fpick(SPARK), { glow: 1 }); } }
    else if (solid && pr.t > 1 && !pr.phase && pr.type !== 'cloud') {
      dead = true; const bx = pr.x - pr.vx, by = pr.y - pr.vy;
      if (pr.type === 'rock') { addShake(3); sfx('brk'); burst(pr.x, pr.y - 4, 12, ['#375666', '#22343f'], 2, 30, { hit: 1 }); }
      else if (pr.type === 'bomb') { if (pr.ghost) boomFx(bx, by, pr.boom); else explode(bx, by, pr.boom, pr.dmg, ow); }
      else if (pr.type === 'glob') burst(bx, by, 8, ['#ff7a2a', '#ffd35a'], 1.4, 16, { glow: 1 });
      else if (pr.type === 'arrow' || pr.type === 'knife' || pr.type === 'javelin') { sparks(bx, by, 3, 0, 1.4); P(bx, by, 0, 0, 90, '#ffd35a', { g: 0, fr: 0, glow: 1 }); }
      else sparks(bx, by, 6);
    }
    if (!dead) {
      if (pr.type === 'bolt' && pr.t % 2 === 0) P(pr.x, pr.y, frand(-.3, .3), frand(-.3, .3), 12, fpick(SPARK), { glow: 1, g: 0 });
      else if (pr.type === 'wave') P(pr.x + frand(-2, 2), pr.y + frand(-9, 9), -pr.vx * .2, frand(-.4, .4), 12, fpick(SPARK), { glow: 1, g: 0 });
      else if ((pr.type === 'arrow' || pr.type === 'bomb') && pr.t % 2 === 0) P(pr.x - pr.vx * .5, pr.y - pr.vy * .5, 0, 0, pr.type === 'bomb' ? 14 : 8, pr.type === 'bomb' ? fpick(SPARK) : '#ffd35a', { glow: 1, g: 0 });
    }
    if (!dead) {
      if (pr.ghost) { for (const f of G.fighters) if (f !== ow && !f.dead && circBox(pr.x, pr.y, pr.r, f)) { dead = true; if (pr.type === 'bomb') boomFx(pr.x, pr.y, pr.boom); else sparks(pr.x, pr.y, 5); break; } }
      else if (ow && ow.fighter) {
        for (const e of foesOf(ow)) {
          if (e.dead || e.noHit) continue; const root = e.root || e;
          if (!pr.hits.has(root) && circBox(pr.x, pr.y, pr.r, e)) {
            pr.hits.add(root);
            if (pr.boom) { explode(pr.x, pr.y, pr.boom, pr.dmg, ow); dead = true; break; }
            strike(ow, e, pr.dmg, (sign(pr.vx) || 1) * pr.kb[0], pr.kb[1], { stop: pr.stop || 3, shake: 2, crit: pr.crit, stagger: pr.stagger, hx: pr.x, hy: pr.y });
            if (!pr.pierce) { dead = true; break; }
          }
        }
      } else for (const f of G.fighters) if (f.team === 'p' && !f.dead && (!f.remote || (f.coop && netHost())) && circBox(pr.x, pr.y, pr.r, f)) { const hit = hurtFighter(f, pr.dmg, pr.x - pr.vx * 6); if (hit && pr.burn) applyStatus(f, 'burn', null, { d: 120 }); if (hit && pr.poison) applyStatus(f, 'poison', null, { d: 150 }); if (hit && !pr.pierce) dead = true; }
    }
    if (dead) a.splice(i, 1);
  }
}
function circBox(cx, cy, r, e) { const nx = clamp(cx, e.x, e.x + e.w), ny = clamp(cy, e.y, e.y + e.h); return (cx - nx) ** 2 + (cy - ny) ** 2 <= r * r; }
