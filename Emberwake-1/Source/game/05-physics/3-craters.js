// ============================================================
//  Craters.
//  Every tile is an 8x8 grid of one-pixel cells. A blow lands where the
//  swing first meets matter and blows a crater out of it, sized by the
//  tool's power against that matter's toughness: bare hands dent, flint
//  gouges, sunmetal bites, embersteel blows out a hole you could stand in.
//  The rim is ragged and bruised. Stone splits along cracks that the next
//  blow follows. Sand and ash pour into the hole. Ore pops loose with a
//  glint. Crystal crazes, then bursts. Wood splits along its grain. Ember
//  seams flare. Matter too hard for the tool throws it back in sparks.
// ============================================================
const BREAK_LEFT = 20;
let HITSEED = 7;
function chipArr(i) { let a = CHIP.get(i); if (!a) { a = new Uint8Array(64).fill(255); CHIP.set(i, a); } return a; }
function aliveOf(i) { const a = CHIP.get(i); if (!a) return 64; let n = 0; for (let k = 0; k < 64; k++) if (a[k]) n++; return n; }
function hpOf(i) { const a = CHIP.get(i); if (!a) return 64 * 255; let n = 0; for (let k = 0; k < 64; k++) n += a[k]; return n; }
// a hole that runs clean through a tile, side to side or top to bottom, leaves it in pieces
const SEV = new Uint8Array(64), SEVQ = new Int8Array(64);
function severed(i) {
  const a = CHIP.get(i); if (!a) return false;
  for (const [start, end] of [[c => (c & 7) === 0, c => (c & 7) === 7], [c => c < 8, c => c >= 56]]) {
    SEV.fill(0); let h = 0, n = 0;
    for (let c = 0; c < 64; c++) if (!a[c] && start(c)) { SEV[c] = 1; SEVQ[n++] = c; }
    while (h < n) { const c = SEVQ[h++]; if (end(c)) return true; const x = c & 7, y = c >> 3; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X > 7 || Y > 7) continue; const q = Y * 8 + X; if (!SEV[q] && !a[q]) { SEV[q] = 1; SEVQ[n++] = q; } } }
  }
  return false;
}
const cellAlive = (gx, gy) => { const a = CHIP.get((gy >> 3) * WW + (gx >> 3)); return !a || a[(gy & 7) * 8 + (gx & 7)] > 0; };

// how each kind of matter answers a blow. jag: how ragged the rim is; rim: how hard the bruise around
// the crater is hit; cracks: lines that run out from the blow; crackD: how much a crack weakens what it crosses
const MFX = {
  soil: { jag: .3, rim: .45, rimW: 1, spd: .75, puff: 4, clods: 2 },
  sand: { jag: .2, rim: .35, rimW: 1, spd: .6, puff: 7, slump: 1 },
  clay: { jag: .25, rim: .3, rimW: .8, spd: .55, rk: .88, clumps: 2 },
  stone: { jag: .55, rim: .55, rimW: 1, spd: 1.1, cracks: 2, crackD: 85 },
  ore: { jag: .5, rim: .5, rimW: 1, spd: 1.05, cracks: 2, crackD: 70 },
  wood: { jag: .35, rim: .4, rimW: .9, spd: .9, grain: 1, splinters: 3 },
  glass: { jag: .3, rim: .5, rimW: 1.3, spd: 1.2, cracks: 4, crackD: 125, shatter: .6 }
};
// the shape of the head: [stretch along the swing, stretch across it, how far the crater sits inside, rim width, raggedness]
const KSH = { hand: [1, 1, .3, 1, .25], knife: [1.3, .65, .45, .9, .3], pick: [1.3, .85, .55, 1.3, .4], shovel: [.75, 1.4, .25, 1.1, .2], axe: [1.25, .75, .45, 1.1, .35], hammer: [1, 1.05, .3, 2.2, .45], blast: [1, 1, 0, 3, .35], weapon: [1, 1.1, .3, 1.8, .45], blade: [1.5, .5, .4, 1, .3] };
const KR = { hand: .85, knife: .75, pick: 1, shovel: 1, axe: .92, hammer: 1, blast: 1, weapon: 1, blade: .85 };
const VGRAIN = new Set([TRUNK, TRUNK2, TRUNK3, TRUNK4, LOGWALL, LADDER, BEAM, DOORC, DOORO]);
const NATURAL = new Set([DIRT, GRASS, MUD, PEAT, ASH, SNOW, SAND, GRAVEL, CLAY, SANDSTONE, STONE, DEEPSTONE, DEEPGLOW, COPPER, TIN, COAL, SALT, IRON, EMBER, GEODE]);
const GLINT = { copper_ore: '#ffd35a', tin_ore: '#e8edf2', iron_ore: '#cfc3ee', coal: '#8a8296', shard: '#ff8a3d', cinder: '#ff7a2a', salt: '#ffffff', flint: '#e8edf2', snow: '#c9fff6', skyglass: '#c9fff6', deepstone: '#8f7fc0' };

function powerRatio(tool, t, mul) { const M = MAT[t], eff = tool.eff != null ? tool.eff : (EFF[M.k][tool.kind] || 0); return tool.power * eff * mul / M.hp; }
function craterR(tool, t, mul) {
  const M = MAT[t], fx = MFX[M.k] || MFX.stone;
  if (tool.rad) return tool.rad * sqrt(min(1.6, 5 / M.hp)) * (fx.rk || 1);
  const E = powerRatio(tool, t, mul); return E <= 0 ? 0 : min(11, (.3 + 1.6 * sqrt(E)) * (KR[tool.kind] || 1) * (fx.rk || 1));
}
// what a cell looks like, so the debris is the colour of what it came from
const TEXC = new Map();
function texCols(t, v) {
  const key = t * 4 + v; let a = TEXC.get(key); if (a) return a;
  a = new Array(64).fill(TP[t].dust || '#8a8296'); const cv = TEX[t] && TEX[t][v];
  if (cv && cv.width) { try { if (!TEXC.cv) { TEXC.cv = document.createElement('canvas'); TEXC.cv.width = TEXC.cv.height = 8; TEXC.x = TEXC.cv.getContext('2d', { willReadFrequently: true }); } TEXC.x.clearRect(0, 0, 8, 8); TEXC.x.drawImage(cv, 0, 0); const d = TEXC.x.getImageData(0, 0, 8, 8).data; for (let q = 0; q < 64; q++) if (d[q * 4 + 3] > 40) a[q] = `rgb(${d[q * 4]},${d[q * 4 + 1]},${d[q * 4 + 2]})`; } catch (e) { } }
  TEXC.set(key, a); return a;
}
const cellCol = (gx, gy, t) => texCols(t, (hash2(gx >> 3, gy >> 3) * 4) | 0)[(gy & 7) * 8 + (gx & 7)];

// ---------------- one blow ----------------
// (x, y) is where the swing met the surface; (ux, uy) the way it was travelling
function crater(x, y, ux, uy, tool, mul, out, soft = 1) {
  let gx0 = floor(x), gy0 = floor(y);
  // a charge goes off wherever it sits: take the nearest matter as what it is blowing apart
  if (tool.rad) for (let r = 0; r < 6 && !(areaHit(tileAt(gx0 >> 3, gy0 >> 3)) && cellAlive(gx0, gy0)); r++) for (const [dx, dy] of [[0, r], [r, 0], [-r, 0], [0, -r], [r, r], [-r, r]]) if (areaHit(tileAt((floor(x) + dx) >> 3, (floor(y) + dy) >> 3))) { gx0 = floor(x) + dx; gy0 = floor(y) + dy; break; }
  const tx0 = gx0 >> 3, ty0 = gy0 >> 3; if (!inW(tx0, ty0)) return;
  const i0 = ty0 * WW + tx0, t0 = tiles[i0]; if (!t0) return;
  if (!MAT[t0] || TP[t0].hard === Infinity || t0 === BEDROCK) { if (!tool.rad) glance(x, y, ux, uy, 3, out, t0); return; }
  const M0 = MAT[t0];
  if (tool.tier < M0.tier) { out.hard = M0.tier; glance(x, y, ux, uy, M0.tier - tool.tier, out, t0); return; }
  const E0 = tool.rad ? 3 : powerRatio(tool, t0, mul * soft); if (E0 <= 0) { out.wrong = t0; scuff(x, y, ux, uy, t0); return; }
  const fx0 = MFX[M0.k] || MFX.stone, sh = KSH[tool.kind] || KSH.pick, r0 = craterR(tool, t0, mul * soft);
  out.mat = out.mat || t0; out.r = r0; out.E = E0;
  // wood splits along its grain whatever hits it
  let ax = ux || (uy ? 0 : 1), ay = uy, sa = sh[0], sb = sh[1];
  if (fx0.grain && !tool.rad) { const v = VGRAIN.has(t0); ax = v ? 0 : 1; ay = v ? 1 : 0; sa = 1.5; sb = .72; }
  const cx = x + ux * r0 * sh[2], cy = y + uy * r0 * sh[2], bx = -ay, by = ax;
  HITSEED = (HITSEED * 1103515245 + 12345) & 0x7fffffff; const seed = HITSEED & 1023;
  const R = r0 * max(sa, sb) * 1.25 + sh[3] + 1, rad = new Map(), touched = new Set(), removed = [];
  for (let gy = floor(cy - R); gy <= ceil(cy + R); gy++) for (let gx = floor(cx - R); gx <= ceil(cx + R); gx++) {
    const tx = gx >> 3, ty = gy >> 3; if (!inW(tx, ty)) continue;
    const i = ty * WW + tx, t = tiles[i]; if (!areaHit(t) && !(out.direct === i && hittable(t))) continue;
    if (tool.rad && TP[t].hard === Infinity) continue;
    if (out.natural && (!NATURAL.has(t) || PLACED.has(i))) continue;
    const M = MAT[t]; if (tool.tier < M.tier) continue;
    let rt = rad.get(t); if (rt === undefined) { rt = t === t0 ? r0 : craterR(tool, t, mul * soft); rad.set(t, rt); } if (rt <= 0) continue;
    const ex = CHIP.get(i), c = (gy & 7) * 8 + (gx & 7); if (ex && !ex[c]) continue;
    const dx = gx + .5 - cx, dy = gy + .5 - cy, al = (dx * ax + dy * ay) / sa, ac = (dx * bx + dy * by) / sb, d = sqrt(al * al + ac * ac);
    const fx = MFX[M.k] || fx0, jag = (sh[4] + fx.jag) * .5, rr = rt * (1 - jag * .5 + jag * hh(gx, gy, seed)), rim = sh[3] * (fx.rimW || 1);
    if (d >= rr + rim) continue;
    const a = ex || chipArr(i); touched.add(i);
    if (d < rr) { a[c] = 0; removed.push(gx, gy, t); }
    else { const dmg = 255 * fx.rim * (1 - (d - rr) / rim) * (.75 + .5 * hh(gy, gx, seed + 9)); if (a[c] <= dmg) { a[c] = 0; removed.push(gx, gy, t); } else a[c] -= dmg; }
  }
  // stone, ore and crystal split: cracks run out from the blow and weaken what they cross
  if (fx0.cracks && removed.length && !tool.rad) {
    const n = clamp(fx0.cracks + (out.crit ? 2 : 0) + (E0 > 2.6 ? 1 : 0) - (Math.random() < .45 ? 1 : 0), 1, 6), base = atan2(uy, ux);
    for (let k = 0; k < n; k++) {
      let th = base + frand(-1.5, 1.5), px = cx + cos(th) * r0 * .7, py = cy + sin(th) * r0 * .7; const L = r0 * frand(1.1, 2.3) * (fx0.shatter ? 1.7 : 1);
      for (let s = 0; s < L; s += .75) {
        th += frand(-.4, .4); px += cos(th) * .75; py += sin(th) * .75;
        const gx = floor(px), gy = floor(py), tx = gx >> 3, ty = gy >> 3; if (!inW(tx, ty)) break;
        const i = ty * WW + tx, t = tiles[i]; if (!areaHit(t) || tool.tier < MAT[t].tier || (out.natural && !NATURAL.has(t))) break;
        const fx = MFX[MAT[t].k]; if (!fx || !fx.crackD) break;
        const a = chipArr(i), c = (gy & 7) * 8 + (gx & 7); if (!a[c]) continue;
        a[c] = max(1, a[c] - fx.crackD * (out.crit ? 1.3 : 1)); touched.add(i);
      }
    }
  }
  for (let q = 0; q < removed.length; q += 3) yieldCell(removed[q + 2], tool);
  out.n += removed.length / 3;
  if (fx0.slump) slump(cx, cy, R, touched);
  craterFx(x, y, ux, uy, cx, cy, r0, E0, t0, fx0, removed, out, tool);
  // what is left: crumbled, shattered, or still standing with a hole in it
  for (const i of touched) {
    const tx = i % WW, ty = (i / WW) | 0, t = tiles[i]; if (!t || !MAT[t]) continue;
    const fx = MFX[MAT[t].k] || fx0, hp = hpOf(i);
    if (fx.shatter && hp < 64 * 255 * fx.shatter) { shatter(tx, ty, tool, out); out.broke++; continue; }
    if (aliveOf(i) <= BREAK_LEFT || hp < 64 * 255 * .26 || (aliveOf(i) <= 40 && severed(i))) { breakAt(tx, ty, { tool, by: out.by, rubble: 1, ux, uy }); out.broke++; }
    else dirtyAt(tx, ty);
  }
}

// sand, ash and gravel do not hold a crater: what is above pours down into it
function slump(cx, cy, R, touched) {
  const x0 = floor(cx - R - 2), x1 = ceil(cx + R + 2), y0 = floor(cy - R - 12), y1 = ceil(cy + R + 2);
  const loose = (gx, gy) => { const i = (gy >> 3) * WW + (gx >> 3), t = tiles[i]; return t && MAT[t] && MAT[t].fall && !PLACED.has(i) ? t : 0; };
  const get = (gx, gy) => { const a = CHIP.get((gy >> 3) * WW + (gx >> 3)); return a ? a[(gy & 7) * 8 + (gx & 7)] : 255; };
  const set = (gx, gy, v) => { const i = (gy >> 3) * WW + (gx >> 3); chipArr(i)[(gy & 7) * 8 + (gx & 7)] = v; touched.add(i); };
  for (let pass = 0; pass < 5; pass++) {
    let moved = 0;
    for (let gy = y1; gy >= y0; gy--) for (let k = 0; k <= x1 - x0; k++) {
      const gx = pass & 1 ? x1 - k : x0 + k, t = loose(gx, gy); if (!t) continue; const v = get(gx, gy); if (!v) continue;
      for (const dx of [0, hh(gx, gy, pass) < .5 ? -1 : 1]) { const nx = gx + dx, ny = gy + 1; if (loose(nx, ny) !== t || get(nx, ny)) continue; if (dx && get(nx, gy)) continue; set(nx, ny, v); set(gx, gy, 0); moved++; break; }
    }
    if (!moved) break;
  }
}

// too hard: the tool skates off. one step too hard leaves a scratch; more than that leaves nothing
function glance(x, y, ux, uy, gap, out, t) {
  const p = out.by; sparks(x, y, 5 + gap * 3, -ux, 1.5 + gap * .4, gap > 1 ? ['#ffffff', '#e8edf2', '#aab3c2', '#fff1a8'] : SPARK);
  if (p && p === G.p) { p.vx -= ux * (1.1 + gap * .5); p.swingT += 5 + gap * 3; if (uy > .6) p.vy = min(p.vy, -1); }
  addShake(.5 + gap * .35); sfx(gap > 1 ? 'clang' : 'clink', 30); G.trails.push({ kind: 'dent', x, y, r: 2.5, col: '#ffffff', life: 6, max: 6 });
  if (gap === 1 && t && MAT[t]) { const gx = floor(x), gy = floor(y), i = (gy >> 3) * WW + (gx >> 3), a = chipArr(i); for (const [dx, dy] of [[0, 0], [1, 0], [0, 1]]) { const c = ((gy + dy) & 7) * 8 + ((gx + dx) & 7); if (a[c] && (gx + dx) >> 3 === gx >> 3 && (gy + dy) >> 3 === gy >> 3) a[c] = max(1, a[c] - 70); } dirtyAt(i % WW, (i / WW) | 0); }
  out.glance = gap;
}
// the wrong tool for the job: it scuffs and bounces
function scuff(x, y, ux, uy, t) { dust(x - ux * 2, y - uy * 2, 3, TP[t].dust); sfx('clink', 30); }

// ---------------- what you see and hear ----------------
function craterFx(x, y, ux, uy, cx, cy, r0, E0, t0, fx, removed, out, tool) {
  const nRem = removed.length / 3, step = max(1, ceil(nRem / 28)), sp0 = min(2.8, .8 + E0 * .33) * (fx.spd || 1);
  for (let q = 0; q < removed.length; q += 3 * step) {
    const gx = removed[q], gy = removed[q + 1], t = removed[q + 2]; let dx = gx + .5 - cx, dy = gy + .5 - cy; const L = hypot(dx, dy) || 1; dx /= L; dy /= L;
    const sp = sp0 * frand(.5, 1.3); P(gx + .5, gy + .5, (dx * .7 - ux * .7) * sp + frand(-.3, .3), (dy * .7 - uy * .7) * sp - frand(.3, 1.1), frand(26, 54) | 0, cellCol(gx, gy, t), { hit: 1, g: .16, fr: .99, sz: Math.random() < .22 ? 2 : 1 });
  }
  const dc = TP[t0].dust || '#8a8296', bx = x - ux * 1.5, by = y - uy * 1.5;
  if (fx.puff && nRem) for (let k = 0; k < fx.puff + min(6, nRem >> 2); k++) P(bx + frand(-2, 2), by + frand(-2, 2), frand(-.8, .8) - ux * .5, frand(-.9, -.1), frand(18, 34) | 0, t0 === SNOW ? '#ffffff' : dc, { g: -.006, fr: .93, sz: k & 1 ? 2 : 1 });
  if (fx.clods && E0 > 1.3 && nRem > 4) for (let k = 0; k < fx.clods; k++) P(bx, by, -ux * frand(.5, 1.4) + frand(-.6, .6), -frand(1, 2.2), frand(30, 50) | 0, cellCol(floor(x), floor(y), t0), { hit: 1, g: .2, sz: 2 });
  if (fx.clumps && nRem > 3) for (let k = 0; k < fx.clumps; k++) P(bx, by, -ux * frand(.3, .9) + frand(-.4, .4), -frand(.6, 1.4), frand(40, 70) | 0, dc, { hit: 1, g: .22, sz: 3, fr: .97 });
  if (fx.splinters && nRem) for (let k = 0; k < fx.splinters + (E0 > 2 ? 2 : 0); k++) P(bx, by, -ux * frand(.6, 1.8) + frand(-.8, .8), -frand(.4, 1.8), frand(30, 60) | 0, k & 1 ? (TP[t0].hi || dc) : dc, { hit: 1, g: .1, fr: .97, sz: 1 });
  if (t0 === GRASS && nRem) for (let k = 0; k < 4; k++) P(bx, by - 1, frand(-1, 1), -frand(.8, 1.8), frand(20, 40) | 0, fpick(['#7ddc6f', '#4caf50', '#a6e88f']), { g: .08, fr: .96 });
  if (t0 === EMBER && nRem) { burst(bx, by, 10 + nRem, ['#fff1a8', '#ffd35a', '#ff8a3d', '#e2542b'], 2.2, 30, { glow: 1, g: -.02, fr: .95 }); G.flash = max(G.flash, .08); if (G.p && hypot(G.p.x + 3 - x, G.p.y + 10 - y) < 14 && Math.random() < .3 && !gearHas('heat')) { G.p.hp = max(1, G.p.hp - 2); numPop(G.p.x + 3, G.p.y - 2, 'HOT', '#ff8a3d'); } sfx('fire', 50); }
  if (t0 === DEEPGLOW && nRem) for (let k = 0; k < 5; k++) P(bx + frand(-3, 3), by + frand(-3, 3), frand(-.3, .3), -frand(.2, .6), frand(40, 70) | 0, fpick(['#8ff5e6', '#cfc3ee', '#8f7fc0']), { glow: 1, g: -.004, fr: .97 });
  if (fx === MFX.glass && nRem) for (let k = 0; k < 6; k++) P(bx, by, frand(-1.5, 1.5) - ux, frand(-1.6, .2), frand(16, 32) | 0, fpick(['#ffffff', '#c9fff6', '#8fd0d8']), { glow: 1, g: .1 });
  if ((fx === MFX.stone || fx === MFX.ore) && tool.tier >= 2 && Math.random() < .35 + E0 * .05) sparks(bx, by, 3, -ux, 1.3);
  if (nRem && r0 > 2.4) G.trails.push({ kind: 'dent', x: cx, y: cy, r: r0 + 1.5, col: out.crit ? '#fff1a8' : 'rgba(255,255,255,.45)', life: out.crit ? 10 : 6, max: out.crit ? 10 : 6 });
  if (out.crit && nRem) { sparks(bx, by, 12, -ux, 2.8, ['#ffffff', '#fff1a8']); G.trails.push({ kind: 'glint', x: bx, y: by, col: '#fff1a8', life: 10, max: 10 }); G.hitstop = max(G.hitstop, 3); sfx('crit', 30); }
  out.fxKind = fx === MFX.sand || fx === MFX.soil ? 'soft' : fx === MFX.clay ? 'clay' : fx === MFX.wood ? 'wood' : fx === MFX.glass ? 'glass' : 'hard';
}

// a crystal that has crazed through bursts all at once, and the burst cracks the crystal beside it
function shatter(tx, ty, tool, out, depth = 0) {
  const i = ty * WW + tx, t = tiles[i]; if (!t) return; const cx = tx * T + 4, cy = ty * T + 4;
  for (let k = 0; k < 18; k++) P(cx + frand(-4, 4), cy + frand(-4, 4), frand(-2, 2), frand(-2.4, .6), frand(20, 44) | 0, fpick(['#ffffff', '#c9fff6', '#8fd0d8', cellCol(tx * 8 + (k & 7), ty * 8 + ((k * 3) & 7), t)]), { glow: k & 1, g: .14, hit: 1 });
  breakAt(tx, ty, { tool, by: out.by, quiet: true }); sfx('shatter', 40); addShake(1.2);
  if (depth < 2) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const j = (ty + dy) * WW + tx + dx, u = tiles[j]; if (!u || !MAT[u] || MAT[u].k !== 'glass' || tool.tier < MAT[u].tier) continue;
    const a = chipArr(j); for (let c = 0; c < 64; c++) if (a[c] && hh(c, j, depth) < .4) a[c] = max(1, a[c] - 110);
    if (hpOf(j) < 64 * 255 * MFX.glass.shatter) shatter(tx + dx, ty + dy, tool, out, depth + 1); else dirtyAt(tx + dx, ty + dy);
  }
}

// ---------------- what is left of a tile when it gives way ----------------
// a tile blown out of the ground takes the corners of its neighbours with it, so a pit is round, not square
function erodeAround(tx, ty, tool) {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const nx = tx + dx, ny = ty + dy; if (!inW(nx, ny)) continue; const j = ny * WW + nx, t = tiles[j];
    if (!NATURAL.has(t) || PLACED.has(j) || (tool && tool.tier < MAT[t].tier)) continue;
    const a = chipArr(j); let n = 0;
    for (let c = 0; c < 64; c++) {
      if (!a[c]) continue; const cx = c & 7, cy = c >> 3, ex = dx > 0 ? cx : dx < 0 ? 7 - cx : 0, ey = dy > 0 ? cy : dy < 0 ? 7 - cy : 0;
      const pr = dx && dy ? (ex + ey < 1 ? .6 : ex + ey < 2 ? .4 : ex + ey < 3 ? .12 : 0) : (ex + ey < 1 ? .28 : ex + ey < 2 ? .07 : 0);
      if (pr && hh(c, j, HITSEED & 255) < pr) { a[c] = 0; n++; }
    }
    if (n) { if (aliveOf(j) <= BREAK_LEFT) breakAt(nx, ny, { tool, quiet: true }); else dirtyAt(nx, ny); }
    else if (a.every(v => v === 255)) CHIP.delete(j);
  }
}
function rubbleFrom(tx, ty, t, a, ux = 0) {
  if (!a || !MAT[t]) return; const k = MAT[t].k, cells = []; let n = 0;
  for (let c = 0; c < 64; c++) if (a[c]) { n++; cells.push((c & 7) - 3.5, (c >> 3) - 3.5, cellCol(tx * 8 + (c & 7), ty * 8 + (c >> 3), t)); }
  if (!n) return;
  if (k === 'soil' || k === 'sand' || k === 'clay' || G.rubble.length > 14 || n < 5) {
    for (let q = 0; q < cells.length; q += 3 * max(1, ceil(n / 18))) P(tx * T + 4 + cells[q], ty * T + 4 + cells[q + 1], frand(-.7, .7) + ux * .5, frand(-1.2, 0), frand(24, 44) | 0, cells[q + 2], { hit: 1, g: .18 });
    return;
  }
  G.rubble.push({ x: tx * T + 4, y: ty * T + 4, vx: ux * .7 + frand(-.4, .4), vy: -frand(.5, 1.4), rot: 0, vr: frand(-.12, .12), cells, t, life: 150, hurt: new Set() });
}
function tickRubble() {
  const a = G.rubble;
  for (let k = a.length - 1; k >= 0; k--) {
    const r = a[k]; r.vy = min(r.vy + .22, 5); r.x += r.vx; r.y += r.vy; r.rot += r.vr; r.vx *= .99;
    if (solidAt(floor((r.x + r.vx * 3) / T), floor(r.y / T))) { r.vx *= -.4; r.x += r.vx * 2; }
    for (const e of G.enemies) if (!e.dead && r.vy > 2 && !r.hurt.has(e) && overlap(e, { x: r.x - 3, y: r.y - 3, w: 6, h: 6 })) { r.hurt.add(e); damageEnemy(e, 6, sign(r.vx) || 1, 1, { stagger: 18 }); }
    const land = solidAt(floor(r.x / T), floor((r.y + 3) / T)) && r.vy > 0;
    if (land || --r.life <= 0) {
      for (let q = 0; q < r.cells.length; q += 3) { const c = cos(r.rot), s = sin(r.rot), X = r.x + r.cells[q] * c - r.cells[q + 1] * s, Y = r.y + r.cells[q] * s + r.cells[q + 1] * c; if ((q / 3) % 2 === 0) P(X, min(Y, r.y + 2), frand(-1.1, 1.1), frand(-1.6, -.2), frand(24, 50) | 0, r.cells[q + 2], { hit: 1, g: .18 }); }
      if (land && near(G.p, r.x, r.y)) { sfx('brk', 20); dust(r.x, r.y + 3, 3, TP[r.t].dust); }
      a.splice(k, 1);
    }
  }
}
function drawRubble(w) {
  for (const r of G.rubble) { const c = cos(r.rot), s = sin(r.rot); for (let q = 0; q < r.cells.length; q += 3) { w.fillStyle = r.cells[q + 2]; w.fillRect(round(r.x + r.cells[q] * c - r.cells[q + 1] * s), round(r.y + r.cells[q] * s + r.cells[q + 1] * c), 1, 1); } }
}
function glint(x, y, col) {
  for (let k = 0; k < 7; k++) P(x, y, frand(-1.1, 1.1), frand(-1.5, -.2), frand(14, 28) | 0, k & 1 ? '#ffffff' : col, { glow: 1, g: .02, fr: .94 });
  G.trails.push({ kind: 'glint', x, y, col, life: 14, max: 14 }); sfx('ting', 40);
}

// ---------------- the chips themselves, drawn into the chunk ----------------
function drawChips(x, a, px, py, w, v, t) {
  for (let c = 0; c < 64; c++) {
    const cx = c & 7, cy = c >> 3, X = px + cx, Y = py + cy, h = a[c];
    const up = cy ? a[c - 8] : 255, dn = cy < 7 ? a[c + 8] : 255, lf = cx ? a[c - 1] : 255, rt = cx < 7 ? a[c + 1] : 255;
    if (!h) {
      // the hole: whatever is behind, deep in shadow, darkest under the lip
      x.clearRect(X, Y, 1, 1);
      if (w) { x.drawImage(WTEX[w][v], cx, cy, 1, 1, X, Y, 1, 1); x.fillStyle = up || lf ? 'rgba(4,2,10,.78)' : 'rgba(4,2,10,.55)'; x.fillRect(X, Y, 1, 1); }
      continue;
    }
    // the lip: lit where it faces up and left, shadowed where it faces down and right
    if (!up || !lf) { x.fillStyle = 'rgba(255,248,230,.42)'; x.fillRect(X, Y, 1, 1); }
    else if (!dn || !rt) { x.fillStyle = 'rgba(6,4,14,.6)'; x.fillRect(X, Y, 1, 1); }
    if (h < 205) { x.fillStyle = h < 120 ? 'rgba(6,4,14,.85)' : 'rgba(6,4,14,.5)'; x.fillRect(X, Y, 1, 1); }
  }
}

// ---------------- weapons mark the ground too ----------------
const WTIER = { wood: 0, flint: 1, bone: 1, stone: 1, copper: 2, bronze: 3, rust: 3, chitin: 4, iron: 4, steel: 5, glass: 5, deep: 5, ember: 6 };
function weaponTool(W, m, k = 1) {
  const blunt = W.set === 'maul' || (W.set === 'chuks' && W.nun !== 'blade') || W.fist;
  return { kind: W.fist ? 'hand' : blunt ? 'weapon' : 'blade', tier: W.fist ? 0 : (WTIER[W.tier] != null ? WTIER[W.tier] : 2), power: (W.dmg || 6) * (W.fist ? .5 : blunt ? .8 : .42) * (m && m.dmg || 1) * k, eff: 1, name: W.name };
}
// the first time in a swing that the weapon meets the ground, it bites
function terrainStrike(a, x, y, ux, uy) {
  if (a.dug || WORLD.arena || a.f !== G.p || !a.W) return false;
  const gx = floor(x), gy = floor(y), tx = gx >> 3, ty = gy >> 3; if (!inW(tx, ty)) return false;
  const i = ty * WW + tx, t = tiles[i]; if (!NATURAL.has(t) || PLACED.has(i) || !cellAlive(gx, gy)) return false;
  a.dug = true; const tool = weaponTool(a.W, a.m, (a.charged ? 1.4 : 1) * (a.m.cr ? 2.2 : 1)), out = { n: 0, broke: 0, hard: 0, wrong: 0, mat: 0, direct: i, by: G.p, natural: 1 };
  crater(x, y, ux, uy, tool, gearMul('mine'), out); const [ox, oy] = openSpot(x, y, ux, uy); emitYield(ox, oy);
  if (out.n) { addShake(min(2, .3 + (out.r || 1) * .25)); sfx(out.fxKind === 'soft' ? 'thud' : 'crack', 40); }
  return true;
}
// a heavy landing leaves a pit
function terrainSlam(a, cx, fy) {
  if (WORLD.arena || a.f !== G.p || !a.W) return;
  const tool = weaponTool(a.W, a.m, a.m && a.m.cr ? 2.6 : 1.5); tool.kind = 'hammer';
  for (const dx of [-5, 0, 5]) { const x = cx + dx, gx = floor(x); let gy = floor(fy); while (gy < fy + 6 && !(NATURAL.has(tileAt(gx >> 3, gy >> 3)) && cellAlive(gx, gy))) gy++; if (gy >= fy + 6) continue; const out = { n: 0, broke: 0, hard: 0, wrong: 0, mat: 0, direct: (gy >> 3) * WW + (gx >> 3), by: G.p, natural: 1 }; crater(x, gy, 0, 1, tool, gearMul('mine') * (dx ? .7 : 1), out); emitYield(x, gy - 6); }
}
