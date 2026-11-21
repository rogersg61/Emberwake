// ============================================================
//  Mining, felling, building.
//  Wherever you click, the tool swings: it winds up, comes down along your
//  aim, and blows a crater where it first meets matter (see craters). What
//  you knock out comes back as dust, rubble, ore and soil, not whole blocks.
//  Sand, gravel and ash fall when undercut, cut stalks topple, and what you
//  build has to be held up.
// ============================================================
const CHIP = new Map(), PLACED = new Set(), SUP = new Map(), WMODS = new Map(), WMODS_PLACED = new Set(), YACC = {};
for (const k in EFF) EFF[k].blast = k === 'wood' ? 1.2 : 1;
const HAND = { kind: 'hand', tier: 0, power: 3.6, cd: 16, name: 'hands' };
const hittable = t => !!t && t !== BEDROCK && !TP[t].ghost && !TP[t].liquid && !!MAT[t] && TP[t].hard !== Infinity;
const solidHit = t => hittable(t) && TP[t].solid && !TP[t].dyn;
const areaHit = t => solidHit(t) || (hittable(t) && TP[t].stalk);
const isWeb = t => !!TP[t].part && !TP[t].dyn;
function dirtyAt(tx, ty) { const c = chunks.get(floor(ty / CH) * 8192 + floor(tx / CH)); if (c) c.dirty = true; if (MODS_ON) netTile(ty * WW + tx); }

// ---------------- which tool is in your hand ----------------
const reachOf = tool => WORLD.mode === 1 ? 72 : tool.kind === 'hand' ? 30 : tool.kind === 'knife' ? 32 : 38;
function bestTool(t) {
  if (!hasItem('toolbelt')) return null; const M = MAT[t]; if (!M) return null; let best = null, bv = 0;
  for (let i = 0; i < INV_N; i++) { const s = inv[i]; if (!s) continue; const it = IT[s.id]; if (it.type !== 'tool' || it.tier < M.tier) continue; const v = (EFF[M.k][it.kind] || 0) * it.power; if (v > bv) { bv = v; best = i; } }
  return best;
}
// ---------------- the swing ----------------
function impactRay(p, tool) {
  const ox = p.x + 3, oy = p.y + 7, dx0 = mouse.wx - ox, dy0 = mouse.wy - oy, L0 = hypot(dx0, dy0) || 1, ux = dx0 / L0, uy = dy0 / L0, R = reachOf(tool);
  const ctx = floor(mouse.wx / T), cty = floor(mouse.wy / T), cursorIn = L0 <= R + 4;
  for (let d = 2; d <= R; d += 1) {
    const x = ox + ux * d, y = oy + uy * d, tx = floor(x / T), ty = floor(y / T); if (!inW(tx, ty)) break;
    const t = tiles[ty * WW + tx];
    if (solidHit(t)) {
      if (cellAlive(floor(x), floor(y))) return { tx, ty, gx: floor(x), gy: floor(y), x, y, ux, uy, t };
      // the swing goes into a hole already dug in this tile: it lands on the nearest rock still standing in it
      const a = CHIP.get(ty * WW + tx); if (a) { let best = -1, bd = 1e9; for (let c = 0; c < 64; c++) if (a[c]) { const d2 = (tx * T + (c & 7) + .5 - x) ** 2 + (ty * T + (c >> 3) + .5 - y) ** 2; if (d2 < bd) { bd = d2; best = c; } } if (best >= 0) { const gx = tx * T + (best & 7), gy = ty * T + (best >> 3); return { tx, ty, gx, gy, x: gx + .5, y: gy + .5, ux, uy, t }; } }
    }
    if (t && (TP[t].decor || TP[t].stalk || TP[t].dyn || TP[t].plat || TP[t].climb || t === DOORO || t === BEAM) && tx === ctx && ty === cty && cursorIn) {
      if (TP[t].stalk || hittable(t) || PLUCK[t] || (TP[t].dyn && TP[t].hard < Infinity)) return { tx, ty, gx: floor(x), gy: floor(y), x, y, ux, uy, t, soft: true };
    }
    if (t && TP[t].ghost) break;
  }
  return null;
}
function yieldCell(t, tool) {
  const M = MAT[t], ys = tool.kind === 'hammer' && M.ham ? M.ham : M.y, bonus = tool.kind === 'shovel' && (M.k === 'soil' || M.k === 'sand' || M.k === 'clay') ? 1.15 : 1;
  for (const [id, k] of ys) YACC[id] = (YACC[id] || 0) + k / 64 * bonus;
}
function emitYield(x, y) { for (const id in YACC) { const n = floor(YACC[id] + 1e-6); if (n > 0 && IT[id]) { spawnDrop(id, n, x, y, frand(-.8, .8), frand(-1.6, -.4)); YACC[id] -= n; if (GLINT[id]) glint(x, y, GLINT[id]); } } }
// a tool swung at a creature hits it: weaker than a weapon, but never useless
function toolHitsFoe(p, tool, k) {
  const cx = p.x + 3, cy = p.y + 8, dx = mouse.wx - cx, dy = mouse.wy - cy, d = hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, R = min(d + 6, reachOf(tool) + 6);
  let best = null, bt = 1e9;
  for (const e of G.enemies.concat(G.fighters.filter(f => f !== p && f.hollow))) {
    if (e.dead || e.noHit) continue;
    for (let r = 3; r <= R; r += 3) { const x = cx + ux * r, y = cy + uy * r; if (x > e.x - 3 && x < e.x + e.w + 3 && y > e.y - 3 && y < e.y + e.h + 3) { if (r < bt) { bt = r; best = e; } break; } }
  }
  if (!best) return false;
  const dmg = max(2, round((tool.power || 4) * .55 * (1 + k * .9) * (tool.kind === 'axe' ? 1.25 : 1))), fc = sign(ux) || p.face || 1;
  if (best.hollow) hurtFighter(best, dmg, cx, { kx: fc * 2.6, ky: -1.6, by: p });
  else damageEnemy(best, dmg, fc * (1.8 + k * 1.6), -1.2 - k, { blunt: tool.kind === 'hammer' || tool.kind === 'hand' });
  sfx('hit', 0); sparks(best.x + best.w / 2, best.y + best.h / 2, 5, fc, 1.6); addShake(1 + k * 2); best.flash = 6;
  return true;
}
function swing(p, tool, k = 0) {
  if (toolHitsFoe(p, tool, k)) return;
  const hit = impactRay(p, tool); if (!hit) { if (tool.kind === 'hammer' && hammerWall(p, tool)) return; sfx('swing2', 120); return; }
  const t = hit.t, i = hit.ty * WW + hit.tx;
  // plants, litter and urns come away whole
  if (hit.soft && (TP[t].decor || (TP[t].dyn && !MAT[t]))) { pluck(hit.tx, hit.ty, tool); return; }
  const q = tool.id ? qBonus(tool.id) : 0, crit = Math.random() < .05 + q * .25 + k * .12;
  const out = { n: 0, broke: 0, hard: 0, wrong: 0, mat: 0, direct: i, by: p, crit, k };
  const mul = (WORLD.mode === 1 ? 3 : 1) * (1 + q) * (1 + k * .9) * (crit ? 1.45 : 1) * gearMul('mine');
  if (TP[t].stalk) chopStalk(hit, tool, out, mul);
  else crater(hit.x, hit.y, hit.ux, hit.uy, tool, mul, out, hit.soft ? 1.6 : 1);
  const [ox, oy] = openSpot(hit.x, hit.y, hit.ux, hit.uy); emitYield(ox, oy);
  if (out.hard) { if (G.time - (G.hintT || -999) > 300) { G.hintT = G.time; say(`Too hard. That needs ${TIER_N[out.hard]} at least.`); } }
  else if (out.glance) { if (G.time - (G.hintT || -999) > 300) { G.hintT = G.time; say('Nothing you carry will mark that.'); } }
  else if (out.wrong && !out.n) { if (G.time - (G.hintT || -999) > 300) { G.hintT = G.time; say(TP[out.wrong].stalk || MAT[out.wrong].k === 'wood' ? 'Bare hands won\'t fell a stalk. Knap a flint axe head and bind it to a stick.' : MAT[out.wrong].k === 'stone' || MAT[out.wrong].k === 'ore' ? 'You can\'t dig rock with your hands. A pick, or at least a rock in your fist.' : 'That tool does nothing to it.'); } }
  else if (out.n || out.broke) {
    const big = (out.r || 1) * (1 + k);
    sfx(out.broke ? 'brk' : out.fxKind === 'soft' ? 'thud' : out.fxKind === 'clay' ? 'thud' : out.fxKind === 'glass' ? 'clink' : out.fxKind === 'wood' ? 'chop' : 'crack', 0);
    addShake(min(2.4, (out.broke ? .6 : .2) + big * .18)); if (k > .5 || big > 5) G.hitstop = max(G.hitstop, 2); G.flags.mined = true;
  }
  else dust(hit.x, hit.y, 2, TP[t].dust);
}
// stalks are narrow: each axe blow cuts a wedge across the trunk from your side
function chopStalk(hit, tool, out, mul) {
  const M = MAT[hit.t], i = hit.ty * WW + hit.tx, eff = EFF.wood[tool.kind] || 0;
  if (tool.tier < M.tier) { out.hard = M.tier; glance(hit.x, hit.y, hit.ux, hit.uy, M.tier - tool.tier, out, hit.t); return; } if (eff <= 0) { out.wrong = hit.t; scuff(hit.x, hit.y, hit.ux, hit.uy, hit.t); return; }
  let n = max(2, round(tool.power * eff * mul / M.hp * 6)); const a = chipArr(i), row = hit.gy & 7, side = hit.ux >= 0 ? 0 : 7, order = [];
  for (let c = 0; c < 64; c++) { const r = c >> 3, col = c & 7, depth = abs(col - side); order.push([abs(r - row) * 1.5 + depth + hh(c, i, G.time) * .8, c]); }
  order.sort((p, q) => p[0] - q[0]);
  for (const [, c] of order) { if (n <= 0) break; if (a[c]) { a[c] = 0; n--; out.n++; yieldCell(hit.t, tool); if (out.n < 8) P(hit.tx * T + (c & 7) + .5, hit.ty * T + (c >> 3) + .5, -hit.ux * frand(.6, 1.6) + frand(-.5, .5), -frand(.4, 1.6), frand(30, 56) | 0, cellCol(hit.tx * 8 + (c & 7), hit.ty * 8 + (c >> 3), hit.t), { hit: 1, g: .12 }); } }
  out.mat = hit.t; out.fxKind = 'wood'; out.r = 2; if (aliveOf(i) <= BREAK_LEFT || (aliveOf(i) <= 40 && severed(i))) { breakAt(hit.tx, hit.ty, { tool, by: out.by }); out.broke++; } else dirtyAt(hit.tx, hit.ty);
}
const WALL_ITEM = { [W_PLANK]: 'wplank', [W_LOG]: 'wlog', [W_WATTLE]: 'wwattle', [W_MUDB]: 'wmud', [W_COBBLE]: 'wcobble', [W_CUT]: 'wcut', [W_BRICK]: 'wbrick' };
function hammerWall(p, tool) {
  const tx = floor(mouse.wx / T), ty = floor(mouse.wy / T), i = ty * WW + tx; if (!inW(tx, ty) || hypot(tx * T + 4 - (p.x + 3), ty * T + 4 - (p.y + 7)) > reachOf(tool) + 6) return false;
  const w = walls[i]; if (!w || solidAt(tx, ty)) return false;
  walls[i] = 0; WMODS.set(i, 0); dirtyAt(tx, ty); const cx = tx * T + 4, cy = ty * T + 4;
  if (WMODS_PLACED.has(i) && WALL_ITEM[w]) spawnDrop(WALL_ITEM[w], 1, cx, cy); else if (Math.random() < .5) spawnDrop(w === W_DIRT ? 'dirt' : w === W_SAND ? 'clay' : 'rock', 1, cx, cy);
  WMODS_PLACED.delete(i); burst(cx, cy, 6, ['#5f5a69', '#3f3a4c'], 1.2, 26, { hit: 1 }); sfx('brk', 0); return true;
}
function pluck(tx, ty, tool) {
  const t = tileAt(tx, ty), cx = tx * T + 4, cy = ty * T + 4;
  if (t === POT) { setTile(tx, ty, AIR); burst(cx, cy, 6, ['#d6c8ae', '#bba888'], 1.5, 30, { hit: 1 }); sfx('brk'); const r = Math.random(); if (r < .3) spawnDrop('cinder', randi(1, 3), cx, cy); else if (r < .5) spawnDrop('glowcap', 1, cx, cy); else if (r < .64) spawnDrop('torch', randi(2, 4), cx, cy); else if (r < .74) spawnDrop('shard', 1, cx, cy); else if (r < .84) spawnDrop('bone', randi(1, 2), cx, cy); else if (r < .92) spawnDrop('copper_ore', randi(2, 4), cx, cy); else spawnDrop('salve', 1, cx, cy); afterRemove(tx, ty, t); return; }
  if (t === BERRY) { setTile(tx, ty, BUSH); G.regrow.push({ i: ty * WW + tx, at: G.time + 60 * 240 }); }
  else setTile(tx, ty, AIR);
  const L = PLUCK[t]; if (L) for (const [id, a, b] of L) { const n = randi(a, b) * (tool.kind === 'knife' && id === 'fiber' ? 2 : 1); if (n > 0) spawnDrop(id, n, cx, cy, frand(-.6, .6), frand(-1.5, -.6)); }
  else if (TP[t].drop) spawnDrop(TP[t].drop, 1, cx, cy);
  burst(cx, cy, 5, [TP[t].dust, '#ffffff'], 1.2, 24, { hit: 1 }); sfx('mine', 0);
  if (t !== BERRY) afterRemove(tx, ty, t);
}
// ---------------- taking a tile away entirely ----------------
function breakAt(tx, ty, o = {}) {
  const i = ty * WW + tx, t = tiles[i]; if (!t || TP[t].hard === Infinity) return;
  if (TP[t].decor) { pluck(tx, ty, o.tool || HAND); return; }
  const cx = tx * T + 4, cy = ty * T + 4;
  if (MAT[t] && !o.noYield) { const tool = o.tool || HAND, n = aliveOf(i); for (let k = 0; k < n; k++) yieldCell(t, tool); }
  if (o.rubble && !TP[t].dyn) rubbleFrom(tx, ty, t, CHIP.get(i) || new Uint8Array(64).fill(255), o.ux || 0);
  CHIP.delete(i);
  if (t === DOORC || t === DOORO) { doorColumn(tx, ty).forEach(y => { setTile(tx, y, AIR); PLACED.delete(y * WW + tx); }); if (!o.noYield) spawnDrop('door', 1, cx, cy); }
  else if (t === ROPE) { removeRope(tx, ty); }
  else {
    if (TP[t].dyn) stnBroken(tx, ty, t);
    setTile(tx, ty, AIR); PLACED.delete(i); SUP.delete(i);
    if (TP[t].dyn && TP[t].drop && !o.noYield && !MAT[t]) spawnDrop(TP[t].drop, 1, cx, cy);
  }
  if (!o.noYield) emitYield(cx, cy);
  if (o.rubble && NATURAL.has(t)) erodeAround(tx, ty, o.tool);
  if (!o.quiet && !o.rubble) burst(cx, cy, 7, [TP[t].dust, TP[t].hi || TP[t].dust], 1.5, 30, { hit: 1, sz: 2 });
  afterRemove(tx, ty, t, o);
}
function afterRemove(tx, ty, t, o = {}) {
  const up = tileAt(tx, ty - 1), dn = tileAt(tx, ty + 1);
  // cut stalks and undercut trees topple away from whoever did it
  if (TP[up].stalk) { const by = o.by || G.p, dir = by && by.x + 3 < tx * T + 4 ? 1 : by ? -1 : (Math.random() < .5 ? 1 : -1); fell(tx, ty - 1, dir); }
  else if (up && TP[up].ground && !TP[up].stalk && !TP[up].solid) { if (TP[up].decor) pluck(tx, ty - 1, HAND); else if (TP[up].dyn && TP[up].hard < Infinity) breakAt(tx, ty - 1, { quiet: true }); }
  else if (up && MAT[up] && MAT[up].fall && !PLACED.has((ty - 1) * WW + tx)) startFall(tx, ty - 1);
  if (dn === VINE) breakAt(tx, ty + 1, { quiet: true });
  if (dn === ROPE && t !== ROPE) removeRope(tx, ty + 1);
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) if (PLACED.has((ty + dy) * WW + tx + dx) || isWeb(t)) { supRecalc(tx, ty); break; }
  for (const [dx, dy] of [[1, 0], [-1, 0]]) { const s = tileAt(tx + dx, ty); if (s && MAT[s] && MAT[s].fall && !solidAt(tx + dx, ty + 1)) startFall(tx + dx, ty); }
}
// ---------------- gravity: sand, gravel and ash fall; unsupported building falls apart ----------------
function startFall(tx, ty) {
  const i = ty * WW + tx, t = tiles[i]; if (!t) return; const part = PLACED.has(i);
  if (!part && (!MAT[t] || !MAT[t].fall)) return;
  if ((solidAt(tx, ty + 1) || platAt(tx, ty + 1)) && !part) return;
  CHIP.delete(i); setTile(tx, ty, AIR); PLACED.delete(i); SUP.delete(i);
  G.falling.push({ t, x: tx * T, y: ty * T, px: tx * T, py: ty * T, vy: part ? .5 : 0, part, hurt: new Set() });
  const up = tileAt(tx, ty - 1);
  if (up && MAT[up] && MAT[up].fall && !PLACED.has((ty - 1) * WW + tx)) startFall(tx, ty - 1);
  else if (up && TP[up].ground && TP[up].decor) pluck(tx, ty - 1, HAND);
  else if (TP[up].stalk) fell(tx, ty - 1, Math.random() < .5 ? 1 : -1);
}
function tickFalling() {
  const a = G.falling;
  for (let k = a.length - 1; k >= 0; k--) {
    const f = a[k]; f.px = f.x; f.py = f.y; f.vy = min(f.vy + .22, 5.5); f.y += f.vy;
    const tx = floor((f.x + 4) / T), by = floor((f.y + T - .01) / T);
    for (const e of G.enemies) if (!e.dead && !f.hurt.has(e) && f.vy > 2 && overlap(e, { x: f.x, y: f.y, w: T, h: T })) { f.hurt.add(e); damageEnemy(e, f.part ? 14 : 8, 0, 1, { stagger: 20 }); }
    if (by >= WH - 1 || solidAt(tx, by) || platAt(tx, by) && f.vy > 0) {
      const ly = by - 1, here = tileAt(tx, ly), cx = tx * T + 4, cy = ly * T + 4;
      if (f.part) { const d = TP[f.t].drop; if (d && Math.random() < .65) spawnDrop(d, 1, cx, cy); burst(cx, cy, 10, [TP[f.t].dust, TP[f.t].hi], 1.8, 34, { hit: 1, sz: 2 }); sfx('brk', 40); }
      else if (ly >= 0 && (here === AIR || flowable(here) || TP[here].liquid)) { if (TP[here].decor) setTile(tx, ly, AIR); setTile(tx, ly, f.t); dust(cx, cy + 4, 4, TP[f.t].dust); if (!solidAt(tx, ly + 1) && !platAt(tx, ly + 1)) startFall(tx, ly); }
      else { for (const [id, n] of MAT[f.t].y) spawnDrop(id, max(1, floor(n)), cx, cy); }
      a.splice(k, 1);
    } else if (f.y > WH * T) a.splice(k, 1);
  }
}
// ---------------- felling ----------------
const TRUNK_T = [TRUNK, TRUNK2, TRUNK3, TRUNK4];
function fell(tx, ty0, dir) {
  let n = 0, y = ty0, kind = max(0, TRUNK_T.indexOf(tileAt(tx, ty0)));
  while (TP[tileAt(tx, y)].stalk) { CHIP.delete(y * WW + tx); setTile(tx, y, AIR); n++; y--; }
  const top = treeTops.get(tx); if (top) treeTops.delete(tx);
  if (!n && !top) return;
  G.felled.push({ x: tx * T + 4, y: (ty0 + 1) * T, n, kind, top, v: (hash2(tx, ty0) * 4) | 0, ang: 0, va: .006, dir, hit: new Set(), noDrop: COOP.applying });
  sfx('brk', 0); G.flags.felled = true;
}
function tickFelled() {
  const a = G.felled;
  for (let k = a.length - 1; k >= 0; k--) {
    const f = a[k]; f.va += .0016 + sin(f.ang) * .0045; f.ang += f.va;
    const L = f.n * T + (f.top ? 24 : 0), s = sin(f.ang) * f.dir, c = cos(f.ang);
    let crash = f.ang >= PI / 2 - .05;
    for (let r = 10; r <= L && !crash; r += 4) { const x = f.x + s * r, y = f.y - c * r; if (solidAt(floor(x / T), floor(y / T)) && !TP[tileAt(floor(x / T), floor(y / T))].stalk) crash = true; }
    if (f.ang > .5) for (const e of G.enemies) if (!e.dead && !f.hit.has(e)) for (let r = 12; r <= L; r += 8) { if (circBox(f.x + s * r, f.y - c * r, 6, e)) { f.hit.add(e); damageEnemy(e, 26, f.dir * 3, -2, { stagger: 30, shake: 3 }); break; } }
    if (G.p && !G.p.dead && f.ang > .9 && !f.hit.has(G.p)) for (let r = 20; r <= L; r += 8) if (circBox(f.x + s * r, f.y - c * r, 5, G.p)) { f.hit.add(G.p); hurtFighter(G.p, 8, f.x, { kx: f.dir * 2.5, ky: -2 }); say('Watch where it falls.'); break; }
    if (crash) {
      addShake(2.5); sfx('kill', 0);
      const drop = (id, n) => { if (f.noDrop) return; for (let q = 0; q < n; q++) { const r = 8 + Math.random() * L * .9; spawnDrop(id, 1, f.x + s * r, f.y - c * r - 4, frand(-.5, .5), frand(-1.6, -.6)); } };
      drop('log', max(1, round(f.n * .55))); drop('stick', randi(1, 3)); drop('bark', max(1, (f.n / 3) | 0)); drop('fiber', f.top ? randi(1, 3) : 0);
      if (f.kind === 0 || f.kind === 3) drop('resin', Math.random() < .55 ? randi(1, 2) : 0);
      if (f.kind === 0 && f.top) drop('glowcap', Math.random() < .35 ? 1 : 0); if (f.kind === 1) drop('snow', randi(1, 2)); if (f.kind === 3 && f.top) drop('berries', randi(1, 3));
      for (let r = 4; r <= L; r += 3) P(f.x + s * r, f.y - c * r, frand(-1, 1), frand(-1.5, -.2), frand(20, 40) | 0, fpick(f.kind === 1 ? FROST : f.kind === 3 ? ['#3a1414', '#5a2424', '#2c4a34'] : ['#2c575e', '#3a6f76', '#142a30', '#8a6a48']), { sz: 2, g: .1, hit: 1 });
      a.splice(k, 1);
    }
  }
}
// ---------------- the support web ----------------
// [most support a piece can carry, lost per tile up, lost per tile across]
const SUPT = { [BEAM]: [18, 1, 4], [BEAMH]: [14, 2, 1], [ROPE]: [30, 1, 99], [THATCH]: [8, 1, 1], [PLANK]: [12, 1, 2], [LOGWALL]: [14, 1, 2], [WATTLE]: [9, 1, 3], [WINDOW]: [8, 1, 3],
  [DOORC]: [12, 1, 2], [DOORO]: [12, 1, 2], [LADDER]: [10, 1, 3], [PLATFORM]: [10, 1, 2], [COBBLE]: [16, 1, 4], [CUTSTONE]: [20, 1, 3], [BRICK]: [20, 1, 3], [CINDERBRICK]: [20, 1, 3], [MUDBRICK]: [12, 1, 4], [PACKED]: [9, 1, 5] };
function supP(t) { return SUPT[t] || [12, 1, 3]; }
const natSolid = j => { const t = tiles[j]; return !!t && TP[t].solid && !PLACED.has(j) && !TP[t].liquid; };
function groundSup(i) {
  const t = tiles[i], [mx, , hl] = supP(t), x = i % WW; let v = 0;
  if (i + WW < tiles.length && natSolid(i + WW) && t !== ROPE) v = mx;
  if (t !== ROPE && ((x > 0 && natSolid(i - 1)) || (x < WW - 1 && natSolid(i + 1)))) v = max(v, mx - (t === BEAMH ? 0 : 1));
  if (i - WW >= 0 && natSolid(i - WW)) v = max(v, t === ROPE || t === LADDER || t === BEAM ? mx : mx - hl * 2);
  return v;
}
function supRecalc(cx, cy, depth = 0) {
  const R = 20, L = [];
  for (const i of PLACED) { const x = i % WW, y = (i / WW) | 0; if (abs(x - cx) <= R && abs(y - cy) <= R) L.push(i); }
  if (!L.length) return;
  const val = new Map(); for (const i of L) val.set(i, groundSup(i));
  const get = j => val.has(j) ? val.get(j) : PLACED.has(j) ? (SUP.get(j) || 0) : null;
  for (let pass = 0; pass < 48; pass++) {
    let ch = false;
    for (const i of L) {
      const t = tiles[i], [mx, vl, hl] = supP(t), x = i % WW; let v = val.get(i);
      const nb = (j, loss) => { const w = get(j); if (w !== null && w - loss > v) v = min(mx, w - loss); };
      nb(i + WW, vl); if (x > 0) nb(i - 1, hl); if (x < WW - 1) nb(i + 1, hl); nb(i - WW, t === ROPE || t === LADDER ? vl : hl * 2);
      if (v !== val.get(i)) { val.set(i, v); ch = true; }
    }
    if (!ch) break;
  }
  const fall = []; for (const [i, v] of val) { SUP.set(i, v); if (v <= 0) fall.push(i); }
  for (const i of fall) { const x = i % WW, y = (i / WW) | 0; if (tiles[i] === DOORC || tiles[i] === DOORO) { breakAt(x, y, { quiet: true }); continue; } if (PLACED.has(i)) startFall(x, y); }
  if (fall.length && depth < 4) supRecalc(cx, cy, depth + 1);
}
function supPreview(tx, ty, t) {
  const i = ty * WW + tx, [mx, vl, hl] = supP(t); let v = 0; const old = tiles[i]; tiles[i] = t; v = groundSup(i); tiles[i] = old;
  const nb = (j, loss) => { if (PLACED.has(j)) v = max(v, min(mx, (SUP.get(j) || 0) - loss)); };
  nb(i + WW, vl); nb(i - 1, hl); nb(i + 1, hl); nb(i - WW, t === ROPE || t === LADDER ? vl : hl * 2);
  return v;
}
// ---------------- doors and ropes ----------------
function doorColumn(tx, ty) { const ys = []; let y = ty; while (y > 0 && (tileAt(tx, y - 1) === DOORC || tileAt(tx, y - 1) === DOORO)) y--; while (tileAt(tx, y) === DOORC || tileAt(tx, y) === DOORO) { ys.push(y); y++; } return ys; }
// a door you pushed open swings shut behind you once the way is clear
function tickDoors() {
  const a = G.autoDoors; for (let k = a.length - 1; k >= 0; k--) { const d = a[k]; if (--d.t > 0) continue; if (tileAt(d.tx, d.ty) !== DOORO) { a.splice(k, 1); continue; } const ys = doorColumn(d.tx, d.ty), box = { x: d.tx * T - 2, y: ys[0] * T, w: T + 4, h: ys.length * T }; if (G.fighters.some(f => !f.dead && !f.gone && overlap(f, box)) || G.enemies.some(e => !e.dead && overlap(e, box))) { d.t = 30; continue; } toggleDoor(d.tx, d.ty); a.splice(k, 1); }
}
function toggleDoor(tx, ty) {
  const ys = doorColumn(tx, ty); if (!ys.length) return false; const open = tileAt(tx, ys[0]) === DOORC;
  if (!open) { const box = { x: tx * T, y: ys[0] * T, w: T, h: ys.length * T }; if (G.fighters.some(f => !f.dead && !f.gone && overlap(f, box)) || G.enemies.some(e => !e.dead && overlap(e, box))) { sfx('deny'); return false; } }
  for (const y of ys) { const i = y * WW + tx; tiles[i] = open ? DOORO : DOORC; if (MODS_ON) MODS.set(i, tiles[i]); dirtyAt(tx, y); }
  sfx(open ? 'swing2' : 'place', 0); return true;
}
function removeRope(tx, ty) {
  let y0 = ty; while (tileAt(tx, y0 - 1) === ROPE) y0--; let y = y0, n = 0; while (tileAt(tx, y) === ROPE) { setTile(tx, y, AIR); PLACED.delete(y * WW + tx); n++; y++; }
  if (n) spawnDrop('ropecoil', 1, tx * T + 4, y0 * T + 4);
}
function dropRope(tx, ty) {
  if (!inW(tx, ty) || tileAt(tx, ty) !== AIR || !(solidAt(tx, ty - 1) || PLACED.has((ty - 1) * WW + tx))) return false;
  let n = 0; for (let y = ty; y < ty + 24 && inW(tx, y) && (tileAt(tx, y) === AIR || TP[tileAt(tx, y)].liquid === 1); y++) { setTile(tx, y, ROPE); PLACED.add(y * WW + tx); n++; }
  supRecalc(tx, ty); sfx('place', 0); return n > 0;
}
// ---------------- placing ----------------
const LOOSE = new Set([DIRT, SAND, CLAY, ASH, GRAVEL]);
function canStand(tx, ty) { const t = tileAt(tx, ty); return solidAt(tx, ty) && !TP[t].liquid || platAt(tx, ty); }
function placeHit(tx, ty) { const bx = tx * T, by = ty * T, b = { x: bx, y: by, w: T, h: T }; return overlap(G.p, b) || G.enemies.some(e => !e.dead && !e.fly && overlap(e, b)) || G.fighters.some(f => f !== G.p && overlap(f, b)); }
function tryPlace(it, tx, ty) {
  const forge = WORLD.mode === 1, cost = it.cost || 1;
  if (!forge && countItem(it.id) < cost) { if (G.time - (G.hintT || -999) > 200) { G.hintT = G.time; say(`It takes ${cost} ${it.name.toLowerCase()} to fill a tile.`); } return false; }
  if (!inW(tx, ty)) return false;
  const i = ty * WW + tx;
  if (it.type === 'wall') {
    if (walls[i] || solidAt(tx, ty) && !TP[tiles[i]].ghost) return false;
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => solidAt(tx + dx, ty + dy) || walls[(ty + dy) * WW + tx + dx]);
    if (!near) return false;
    walls[i] = it.wall; WMODS.set(i, it.wall); WMODS_PLACED.add(i); dirtyAt(tx, ty); if (!forge) removeItem(it.id, 1); sfx('place', 0); return true;
  }
  const tile = it.tile, np = TP[tile], cur = tileAt(tx, ty);
  if (!(cur === AIR || (TP[cur].decor && !TP[cur].dyn && cur !== POT) || TP[cur].liquid)) return false;
  if (tile === DOORC) {
    if (!canStand(tx, ty + 1)) return false;
    for (let y = ty; y > ty - 3; y--) { const c = tileAt(tx, y); if (!(c === AIR || TP[c].decor && !TP[c].dyn) || placeHit(tx, y)) return false; }
    for (let y = ty; y > ty - 3; y--) { setTile(tx, y, DOORC); PLACED.add(y * WW + tx); }
    supRecalc(tx, ty); if (!forge) removeItem(it.id, 1); sfx('place', 0); G.flags.placed_door = true; return true;
  }
  if (np.ground && !canStand(tx, ty + 1)) return false;
  if (isWeb(tile)) { if (supPreview(tx, ty, tile) <= 0) { if (G.time - (G.hintT || -999) > 200) { G.hintT = G.time; say('It would not hold there. Set a post or wall down to solid ground first.'); } sfx('deny', 30); return false; } }
  else if (!np.ground) { const ok = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => solidAt(tx + dx, ty + dy) || platAt(tx + dx, ty + dy)) || walls[i] > 0; if (!ok) return false; }
  if ((np.solid || tile === CHARGE) && placeHit(tx, ty)) return false;
  setTile(tx, ty, tile); CHIP.delete(i);
  if (isWeb(tile)) { PLACED.add(i); supRecalc(tx, ty); }
  if (np.dyn) stnPlaced(tx, ty, tile);
  if (MAT[tile] && MAT[tile].fall && !solidAt(tx, ty + 1)) startFall(tx, ty);
  if (!forge) removeItem(it.id, cost);
  sfx('place', 0); G.flags['placed_' + it.id] = true; G.dirty = true; return true;
}
// ---------------- what your hands do each tick ----------------
function toolTick(p, I) {
  const it0 = heldItem(), it = carried(it0) ? null : it0, forge = WORLD.mode === 1;
  if (p.swingT > 0) p.swingT--;
  if (p.toolT > 0) { p.toolT--; if (p.strike && p.toolT <= p.strike.at) { const s = p.strike; p.strike = null; swing(p, s.tool, s.k); } }
  if (p.placeCd > 0) p.placeCd--;
  if (p.state !== 'normal' || I.blockA || p.hurtT > 0 || G.cine) { p.strike = null; p.toolCharge = 0; return; }
  // your fists have this click: a creature is under the cursor, or nothing in hand needs it
  if ((!it || it.type !== 'tool') && heldOf(p) === IT.fists) { p.toolCharge = 0; return; }
  const tx = floor(mouse.wx / T), ty = floor(mouse.wy / T), dx = tx * T + 4 - (p.x + 3), dy = ty * T + 4 - (p.y + 10), near = dx * dx + dy * dy < (forge ? 90 : 46) ** 2;
  // right click: doors, and stations in reach
  if (mouse.rp && near && (!it || it.type !== 'weapon')) { const t = tileAt(tx, ty); if (t === DOORC || t === DOORO) { toggleDoor(tx, ty); p.toolCharge = -1; return; } }
  if (!it || it.type === 'tool') {
    // hold right to wind up a heavy blow; let go to bring it down
    if (mouse.r && p.toolCharge >= 0 && !p.strike && p.swingT <= 0) { p.toolCharge = min(50, (p.toolCharge || 0) + 1); p.swingTool = it || HAND; p.face = mouse.wx >= p.x + 3 ? 1 : -1; if (p.toolCharge === 50 && G.time % 20 === 0) sparks(p.x + 3, p.y - 2, 2, 0, .8); if (p.toolCharge === 30) sfx('charge'); return; }
    if (!mouse.r) { const c = p.toolCharge || 0; p.toolCharge = 0; if (c > 10 && !p.strike) { startSwing(p, it || HAND, min(1, c / 50)); return; } }
    if (!mouse.l || p.swingT > 0 || p.strike) return;
    startSwing(p, it || HAND, 0); return;
  }
  if (it.type === 'summon') { if (mouse.lp) useSummon(it); return; }
  if (it.type === 'trinket') { if (mouse.lp) { const k = inv.findIndex(q => q && q.id === it.id); if (k >= 0) wearTrinketAt(k); } return; }
  if (it.type === 'offering') { if (mouse.lp) { const O = OFFER[it.id]; say(`Bring it to ${O.where} and press [F] to wake ${O.boss}.`); } return; }
  if (it.type === 'scroll') { if (mouse.lp) readScroll(); return; }
  if (it.type === 'armor') { if (mouse.lp) { const k = inv.findIndex(q => q && q.id === it.id); if (k >= 0) wearAt(k); } return; }
  if (it.type === 'block' || it.type === 'wall') { if (mouse.l && near && p.placeCd <= 0) { if (tryPlace(it, tx, ty)) { p.placeCd = forge ? 3 : 7; p.toolT = 8; p.face = dx >= 0 ? 1 : -1; } } return; }
  if (!mouse.lp) return;
  if (it.type === 'food') eat(it);
  else if (it.type === 'heal') useHeal(it.id);
  else if (it.type === 'util') useUtil(it, tx, ty, near);
  else if (it.type === 'mat' && (it.id === 'rock' || it.id === 'flint')) { toggleUI('knap'); }
}
// ---------------- eating and the hunger it answers ----------------
function eat(it) {
  const p = G.p; if (p.eatCd > 0) return; if (!WORLD.mode && G.food >= 99 && !(it.heal > 0 && p.hp < p.maxhp) && !it.buff) { say('You are full.'); return; }
  removeItem(it.id, 1); p.eatCd = 30; G.food = min(100, (G.food || 0) + (it.food || 0)); if (it.heal) { p.hp = min(p.maxhp, p.hp + it.heal); numPop(p.x + 3, p.y - 4, '+' + it.heal, '#7ddc6f'); }
  if (it.meal) startMeal(it);
  if (it.buff === 'tonic') p.tonic = 1800; if (it.buff === 'ward') { p.ward = 1800; if (p.st) p.st.poison = p.st.bleed = 0; } if (it.buff === 'bandage') { p.bandT = 600; if (p.st) p.st.bleed = 0; }
  sfx('pickup', 0); for (let k = 0; k < 6; k++) P(p.x + 3, p.y + 6, frand(-.8, .8), frand(-1.2, -.3), 18, fpick(['#ffd35a', '#f4efe6', '#e2483b']), { g: .08 });
  G.flags['ate_' + it.id] = true;
}
function tickHunger() {
  const p = G.p; if (!p || p.dead || WORLD.arena || WORLD.mode === 1) return;
  if (p.eatCd > 0) p.eatCd--; if (p.tonic > 0) p.tonic--; if (p.ward > 0) p.ward--;
  if (p.bandT > 0) { p.bandT--; if (p.bandT % 15 === 0 && p.hp < p.maxhp) p.hp++; }
  const spent = max(0, (p.lastStam === undefined ? p.stam : p.lastStam) - p.stam); p.lastStam = p.stam;
  G.food = max(0, G.food - (.0011 + spent * .012) * DIFF().hunger);
  if (G.food <= 0 && G.time % 360 === 0 && p.hp > 15) { p.hp--; p.flash = 3; if (G.time % 1440 === 0) say('Your stomach is a fist. Eat something.'); }
  if (G.food < 25 && !G.flags.hungryOnce) { G.flags.hungryOnce = true; say('Hungry. Berries, a hare, a morel roasted on a fire. Anything.'); learn('food'); }
}
// ---------------- utility items ----------------
const hasUtil = id => (WORLD.mode === 1 && ['lantern', 'compass', 'fieldmap', 'magnet', 'toolbelt'].includes(id)) || countItem(id) > 0;
function useUtil(it, tx, ty, near) {
  const p = G.p, liq = inW(tx, ty) ? TP[tiles[ty * WW + tx]].liquid || 0 : 0;
  if (it.u === 'pack') { wearPack(it.id); return; }
  if (it.u === 'jug') { if (near && liq === 1) { removeItem('jug', 1); const l = addItem('jug_w', 1); if (l) spawnDrop('jug_w', 1, p.x + 3, p.y); sfx('pickup', 0); splash(tx, ty); } else say('Click water to fill the jug.'); return; }
  if (it.u === 'bucket') { if (near && liq && (liq === 1 || it.id === 'bucket2')) { setTile(tx, ty, AIR); swapHeld(it.id, liq === 1 ? 'bucket_w' : 'bucket_c'); splash(tx, ty); } else say(it.id === 'bucket' ? 'Click water to scoop it.' : 'Click water or cinder to scoop it.'); return; }
  if (it.u === 'pour') { if (near && (tileAt(tx, ty) === AIR || flowable(tileAt(tx, ty)))) { setTile(tx, ty, it.id === 'bucket_w' ? WATER : CINDER); LQ.add(ty * WW + tx); wakeLiquid(tx, ty, 2); swapHeld(it.id, it.id === 'bucket_w' ? 'bucket' : 'bucket2'); splash(tx, ty); } return; }
  if (it.u === 'rope') { if (near && dropRope(tx, ty)) removeItem('ropecoil', 1); else say('Click an open tile right under a ledge or beam to let the rope down.'); return; }
  if (it.u === 'spy') { G.spy = !G.spy; sfx('ui'); return; }
  if (it.u === 'light') { G.lampOff = !G.lampOff; sfx('ui'); return; }
  if (it.u === 'whet') { const w = inv[G.lastWeapon] && IT[inv[G.lastWeapon].id]; removeItem('whetstone', 1); p.sharp = 40; sfx('craft'); sparks(p.x + 3, p.y + 8, 8, 0, 1.6, ['#e8edf2', '#ffffff']); say(`Honed${w && w.type === 'weapon' ? ': ' + w.name : ''}. The next 40 blows bite harder.`); return; }
  if (it.u === 'venom') { removeItem('venomcoat', 1); p.venom = 20; sfx('craft'); say('Venom on the edge. Twenty blows will poison.'); return; }
  const tips = { belt: 'Carry it: the right tool comes to hand when you swing.', glide: 'Carry it: hold jump while falling.', climb: 'Carry it: press into a wall in mid-air.', compass: 'Carry it: watch the arrow by your hotbar.', map: 'Carry it: press M.', magnet: 'Carry it: drops come from twice as far.' };
  if (tips[it.u]) say(tips[it.u]);
}
function swapHeld(from, to) { const s = inv[G.sel]; if (s && s.id === from) { if (s.n > 1) { s.n--; const l = addItem(to, 1); if (l) spawnDrop(to, 1, G.p.x + 3, G.p.y); } else inv[G.sel] = { id: to, n: 1 }; } sfx('pickup', 0); }
function splash(tx, ty) { for (let k = 0; k < 8; k++) P(tx * T + 4, ty * T + 4, frand(-1.2, 1.2), frand(-2, -.5), 22, fpick(['#b4e6e8', '#8fd0d8', '#ffffff']), { g: .14 }); }
// ---------------- moving: ladders, ropes, gliders, claws ----------------
function climbAt(f) { const cx = floor((f.x + 3) / T); for (let y = floor((f.y + 2) / T); y <= floor((f.y + f.h - 1) / T); y++) if (TP[tileAt(cx, y)].climb) return true; return false; }
function travelTick(f, I, grav) {
  if (!f.isPlayer || WORLD.arena || f.dead) return grav;
  if (f.dragT > 0) { f.dragT--; f.vx = approach(f.vx, sign(f.dragX - (f.x + 3)) * 2.2, .35); }
  const onC = climbAt(f);
  if (onC && (I.jumpH && !f.onGround || I.down || (I.jumpH && f.onGround && !I.md))) f.climbing = true;
  if (f.climbing) {
    if (!onC || (I.jumpP && I.md)) { f.climbing = false; if (I.jumpP && I.md) { f.vy = -3.6; f.vx = I.md * 2; } }
    else { f.vy = I.jumpH ? -1.35 : I.down ? 1.7 : 0; f.vx *= .6; f.coyote = 0; f.dblUsed = false; f.airDash = airDashMax(f); f.onGround = false; f.runPh += abs(f.vy) * .3; return 0; }
  }
  f.gliding = f.clinging = false;
  if (!f.onGround && !liqAt(f.x + 3, f.y + f.h - 5)) {
    if (hasUtil('claws') && I.md && f.state === 'normal') {
      const wx = I.md > 0 ? floor((f.x + f.w + 1) / T) : floor((f.x - 1) / T);
      if (solidAt(wx, floor((f.y + 6) / T)) && solidAt(wx, floor((f.y + 14) / T)) && !TP[tileAt(wx, floor((f.y + 6) / T))].ghost) {
        f.clinging = true; f.face = I.md; f.dblUsed = false; f.airDash = airDashMax(f);
        if (I.jumpH) f.vy = -1.25; else f.vy = min(f.vy, .3); if (G.time % 8 === 0) P(f.x + 3 + I.md * 4, f.y + 10, -I.md * .4, .2, 14, '#b9bdd0', { g: .05 }); return 0;
      }
    }
    if (hasUtil('glider') && I.jumpH && f.vy > .6 && f.state === 'normal') {
      f.gliding = true; f.vy = min(f.vy, .7); f.vx = approach(f.vx, (I.md || f.face) * 2.5, .06); if (G.time % 5 === 0) P(f.x + 3, f.y + 2, -f.vx * .3, .1, 22, '#f4efe6', { g: 0, fr: .95 }); return .02;
    }
  }
  return grav;
}
// ---------------- blasting charges ----------------
// loot from a blow pops out on your side of the hole, never inside the rock
function openSpot(x, y, ux, uy) { for (let d = 3; d < 24; d += 2) { const X = x - ux * d, Y = y - uy * d; if (!solidAt(floor(X / T), floor(Y / T))) return [X, Y]; } return [x - ux * 4, y - uy * 4]; }
function startSwing(p, tool0, k) {
  let tool = tool0;
  if (tool0.type === 'tool' || tool0 === HAND) { const h = impactRay(p, tool); if (h && (!h.soft || TP[h.t].stalk)) { const b = bestTool(h.t); if (b !== null && IT[inv[b].id] !== tool0) { tool = IT[inv[b].id]; p.beltT = 20; p.beltId = inv[b].id; } } }
  const sp = gearMul('swing'), D = max(11, round(tool.cd * sp * (1 + k * .35))), wind = round((tool.kind === 'hammer' ? 6 : tool.kind === 'hand' ? 3 : 5) * (k ? .6 : 1));
  p.swingT = D; p.toolT = p.toolD = D; p.strike = { tool, k, at: D - wind }; p.toolHit = wind; p.toolK = k; p.face = mouse.wx >= p.x + 3 ? 1 : -1; p.swingTool = tool;
  if (k > .3 || tool.kind === 'hammer') sfx('heavy', 40);
}
function blast(cx, cy, R = 13) {
  const out = { n: 0, broke: 0, hard: 0, wrong: 0, mat: 0, direct: -1, by: null };
  // the charge goes off in the open: it digs from its own centre outwards
  const tool = { kind: 'blast', tier: 4, power: 26, eff: 1, rad: R * 1.5 };
  const gx = floor(cx), gy = floor(cy);
  out.direct = (gy >> 3) * WW + (gx >> 3); crater(cx, cy, 0, 0, tool, 1, out); emitYield(cx, cy - 6);
  for (const e of G.enemies) if (!e.dead) { const d = hypot(e.x + e.w / 2 - cx, e.y + e.h / 2 - cy); if (d < 44) damageEnemy(e, round(50 * (1 - d / 50)), sign(e.x + e.w / 2 - cx) * 4, -3, { stagger: 40, shake: 4 }); }
  blastFelt(cx, cy);
  // friends see and feel it too; the rock it broke reaches them as tiles, the creatures it hit through the host
  if (typeof COOP !== 'undefined' && COOP.role && !COOP.applying) sendAll({ t: 'boom', x: round(cx), y: round(cy) });
}
function blastFelt(cx, cy) {
  const p = G.p; if (p && !p.dead) { const d = hypot(p.x + 3 - cx, p.y + 10 - cy); if (d < 34) hurtFighter(p, round(30 * (1 - d / 40) * gearMul('blast')), cx, { kx: sign(p.x + 3 - cx) * 4, ky: -3.5 }); }
  burst(cx, cy, 40, ['#fff1a8', '#ffd35a', '#ff8a3d', '#e2542b', '#5f5a69'], 3.6, 46, { glow: 1, g: .05 }); burst(cx, cy, 30, ['#5f5a69', '#8d8794', '#3f3a4c'], 2.2, 70, { g: -.01, fr: .96 });
  const near = !p || hypot(p.x - cx, p.y - cy) < 60 * T; if (near) { addShake(8); G.flash = max(G.flash, .35); sfx('boom', 0); sfx('kill', 0); }
}
// ---------------- regrowth: picked bushes fruit again ----------------
function tickRegrow() { if (G.time % 60) return; for (let k = G.regrow.length - 1; k >= 0; k--) { const r = G.regrow[k]; if (G.time < r.at) continue; if (tiles[r.i] === BUSH) setTile(r.i % WW, (r.i / WW) | 0, BERRY); G.regrow.splice(k, 1); } }
// old callers (links that crack walls, explosions) still break tiles this way
function breakTile(tx, ty, silent) { const t = tileAt(tx, ty); if (!t || TP[t].hard === Infinity) return; breakAt(tx, ty, { quiet: silent }); }
// ---------------- drawing ----------------
function drawPhys(w, al) {
  drawRubble(w);
  for (const f of G.falling) { const y = round(lerp(f.py, f.y, al)); w.drawImage(TEX[f.t][0], f.x, y); }
  for (const f of G.felled) {
    w.save(); w.translate(f.x, f.y); w.rotate(f.ang * f.dir);
    const tt = TRUNK_T[f.kind]; for (let k = 0; k < f.n; k++) w.drawImage(TEX[tt][(f.v + k) & 3], -4, -(k + 1) * T);
    if (f.top) w.drawImage(SPR.top[f.top.kind][f.top.v].cv, -23, -f.n * T + 1 - 31);
    w.restore();
  }
}
function drawAim(c, S) {
  const p = G.p, it = heldItem(); if (!p || p.dead || UI.open || G.dialog || WORLD.arena || G.cine) return;
  // the support web, shown while you hold building parts or a hammer
  if (it && ((it.type === 'block' && isWeb(it.tile)) || (it.type === 'tool' && it.kind === 'hammer'))) {
    const vx0 = floor(G.cam.x / T) - 1, vx1 = vx0 + ceil(VS.vw / T) + 2, vy0 = floor(G.cam.y / T) - 1, vy1 = vy0 + ceil(VS.vh / T) + 2;
    for (const i of PLACED) { const x = i % WW, y = (i / WW) | 0; if (x < vx0 || x > vx1 || y < vy0 || y > vy1) continue; const v = SUP.get(i) || 0, mx = supP(tiles[i])[0], k = clamp(v / mx, 0, 1); c.fillStyle = k > .6 ? 'rgba(125,220,111,.5)' : k > .3 ? 'rgba(255,211,90,.55)' : 'rgba(226,72,59,.6)'; c.fillRect(x * T + 3, y * T + 3, 2, 2); }
  }
  if (!it || it.type === 'tool') {
    const h = impactRay(p, it || HAND); if (!h) return;
    if (h.soft) { c.strokeStyle = 'rgba(255,241,168,.6)'; c.lineWidth = 1 / S; c.strokeRect(h.tx * T + .5 / S, h.ty * T + .5 / S, T - 1 / S, T - 1 / S); return; }
    const M = MAT[h.t], tool = it || HAND, ok = tool.tier >= M.tier && (EFF[M.k][tool.kind] || 0) > 0, k = p.toolCharge > 10 ? min(1, p.toolCharge / 50) : 0;
    const r = ok ? craterR(tool, h.t, (1 + (tool.id ? qBonus(tool.id) : 0)) * (1 + k * .9) * gearMul('mine') * (WORLD.mode === 1 ? 3 : 1)) : 0, sh = KSH[tool.kind] || KSH.pick, cx = h.x + h.ux * r * sh[2], cy = h.y + h.uy * r * sh[2];
    c.fillStyle = ok ? 'rgba(255,241,168,.9)' : 'rgba(226,72,59,.9)'; c.fillRect(h.gx, h.gy, 1, 1);
    if (ok && r > .5) { c.strokeStyle = k ? 'rgba(255,179,71,.75)' : 'rgba(255,241,168,.4)'; c.lineWidth = 1 / S; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke(); }
    else if (!ok) { c.strokeStyle = 'rgba(226,72,59,.7)'; c.lineWidth = 1 / S; c.beginPath(); c.moveTo(h.gx - 1.5, h.gy - 1.5); c.lineTo(h.gx + 2.5, h.gy + 2.5); c.moveTo(h.gx + 2.5, h.gy - 1.5); c.lineTo(h.gx - 1.5, h.gy + 2.5); c.stroke(); }
    return;
  }
  if (it.type === 'block' || it.type === 'wall') {
    const tx = floor(mouse.wx / T), ty = floor(mouse.wy / T), dx = tx * T + 4 - (p.x + 3), dy = ty * T + 4 - (p.y + 10); if (dx * dx + dy * dy >= (WORLD.mode === 1 ? 90 : 46) ** 2) return;
    let col = 'rgba(255,241,168,.75)';
    if (it.type === 'block' && isWeb(it.tile) && inW(tx, ty)) { const v = supPreview(tx, ty, it.tile), mx = supP(it.tile)[0]; col = v <= 0 ? 'rgba(226,72,59,.9)' : v < mx * .4 ? 'rgba(255,179,71,.85)' : 'rgba(125,220,111,.85)'; }
    c.strokeStyle = col; c.lineWidth = 1 / S; const hgt = it.tile === DOORC ? 3 : 1; c.strokeRect(tx * T + .5 / S, (ty - hgt + 1) * T + .5 / S, T - 1 / S, hgt * T - 1 / S);
  }
}
