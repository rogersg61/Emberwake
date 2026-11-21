// ============================================================
//  World generation.
//  The surface is four landforms blended into each other: ridged glass
//  mountains in the west, rolling moor hills with lakes in the middle,
//  a crater of ash, and stepped rust mesas cut by canyons in the east.
//  Above it drifts a chain of sky islands, reached on updraft vents.
//  Below it: the Underdark's geode caves, then the Deep, where deepstone
//  holds lakes of molten cinder and the Drowned Forge.
//  Buildings are made of real tiles (floors, invisible walls) plus two
//  purely visual layers: props behind you, and facades, fences and
//  foliage in front of you. Facades fade away when you step inside.
// ============================================================
const GHOST = 39;
defT(GHOST, { name: 'Wall', solid: true, full: true, hard: Infinity, ghost: true, hi: '#000', dust: '#5c8290' });
let tiles, walls, heights, RESV, SKYL;
const treeTops = new Map(), tileObjs = new Map(), chunks = new Map(), MODS = new Map();
let MODS_ON = false;
let SPAWN_X = 450, SHRINE_X = 570, SHRINE2_X = 150, GATE_X = 820, SHRINE_Y = 0, SHRINE2_Y = 0, GATE_Y = 0;
let BASE_Y = 110, DEEP_Y = 240, DRIFT_Y = 70, REACH_X = 240, RUST_X = 660, CRATER_R = 44, VIL_W = 46, VIL_Y = 0;
let FORGE_X = 0, FORGE_Y = 0, SKY_X = 0, SKY_Y = 0, MINE_X = 0, MINE_Y = 0, roadY = x => WH - 30;
const SIZES = [[600, 260], [900, 320], [1400, 380], [2200, 440]], SIZE_N = ['Small', 'Medium', 'Large', 'Vast'], SHAPE_N = ['Balanced', 'Skylands', 'Hollows'], MODE_N = ['Journey', 'Free Forge'];
const WORLD = { id: '', name: '', seed: 0, size: 1, shape: 0, mode: 0, arena: false };
const ARENA_SPAWNS = [[18, 58], [131, 58], [75, 48], [44, 43], [105, 43], [75, 38]];
const BIOME = { reach: 'STILLGLASS REACH', moor: 'EMBERFELT MOOR', scoria: 'RUSTFALL', ash: 'ASHEN HOLLOW', drift: 'THE DRIFT', under: 'THE UNDERDARK', deep: 'THE DEEP', ring: 'THE CINDER RING', village: 'HEARTHHOLD' };
// visual layers and set pieces, rebuilt from the seed every time a world loads
const STRUCTS = [], PROPS = [], FGP = [], VENTS = [], SPOTS = {}, LANDMARKS = [], ISLES = [];
let PROPB = new Map(), FGPB = new Map();
const LQ = new Set();
function pedItem(o) { const at = q => q && o.x === q.x && o.y === q.y; if (at(SPOTS.hook)) return G.flags.gotHook ? null : 'hook'; if (at(SPOTS.flask)) return G.flags.gotFlask ? null : 'flask'; if (at(SPOTS.blade)) return G.flags.gotBlade ? null : 'sword'; return null; }
let SEGS = [];
const LOOT = new Map();
function biomeAt(x) { if (WORLD.arena) return WORLD.royale ? brBio(x) : 'ring'; if (WORLD.endless) return biomeE(x); if (abs(x - SHRINE_X) < CRATER_R + 8) return 'ash'; for (const s of SEGS) if (x < s.x1) return s.b; return SEGS.length ? SEGS[SEGS.length - 1].b : 'moor'; }
const segW = (s, x, k = 30) => smooth((x - s.x0) / k + .5) * smooth((s.x1 - x) / k + .5);
const segOf = b => { let best = null; for (const s of SEGS) if (s.b === b && (!best || s.x1 - s.x0 > best.x1 - best.x0)) best = s; return best; };
// a new order of lands for every seed: the village always sits on temperate ground near the middle;
// there is always a glass range (the Mirror Court), a rust country (the mine) and the ash crater by the village
function layoutBiomes(small) {
  const n = WORLD.size === 0 ? 5 : WORLD.size === 1 ? 7 : 9, extra = ['moor', 'fen', 'thorn', 'dunes', 'reach', 'scoria', 'thorn', 'fen', 'dunes', 'moor'];
  CRATER_R = small ? 36 : 44; VIL_W = small ? 38 : 46;
  let seq, mid; for (let tries = 0; tries < 80; tries++) {
    const pool = ['reach', 'scoria']; while (pool.length < n - 1) pool.push(extra[randi(0, extra.length - 1)]);
    for (let i = pool.length - 1; i > 0; i--) { const j = randi(0, i); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    mid = (n - 1) >> 1; seq = pool.slice(0, mid).concat([rand() < .6 ? 'moor' : 'thorn'], pool.slice(mid));
    let ok = true; for (let i = 1; i < seq.length; i++) if (seq[i] === seq[i - 1]) ok = false; if (ok) break;
  }
  // the ash crater is a land of its own, right beside the village
  const side = rand() < .5 ? 1 : -1, ai = side > 0 ? mid + 1 : mid; seq.splice(ai, 0, 'ash'); const hi = side > 0 ? mid : mid + 1;
  const aw = 2 * CRATER_R + 40, ws = seq.map((b, i) => b === 'ash' ? 0 : i === hi ? 1.4 : rand(.7, 1.3)), tot = ws.reduce((a, b) => a + b, 0), rest = WW - aw; let x = 0;
  SEGS = seq.map((b, i) => { const x0 = round(x); x += b === 'ash' ? aw : ws[i] / tot * rest; return { b, x0, x1: i === seq.length - 1 ? WW : round(x), home: i === hi }; });
  const home = SEGS[hi], ash = SEGS[ai];
  SHRINE_X = round((ash.x0 + ash.x1) / 2); SPAWN_X = side > 0 ? min(round((home.x0 + home.x1) / 2), SHRINE_X - (VIL_W + CRATER_R + 32)) : max(round((home.x0 + home.x1) / 2), SHRINE_X + (VIL_W + CRATER_R + 32));
  SPAWN_X = clamp(SPAWN_X, VIL_W + 30, WW - VIL_W - 30);
  GATE_X = SPAWN_X < WW / 2 ? round(WW * .93) : round(WW * .07);
  for (let k = 0; k < 40; k++) { SKY_X = round(rand(.15, .85) * WW); if (abs(SKY_X - SPAWN_X) > 70 && abs(SKY_X - SHRINE_X) > 50) break; }
  for (let k = 0; k < 40; k++) { FORGE_X = round(rand(.18, .82) * WW); if (abs(FORGE_X - SPAWN_X) > WW * .14) break; }
  const R = segOf('reach'), U = segOf('scoria'); REACH_X = round((R.x0 + R.x1) / 2); RUST_X = round((U.x0 + U.x1) / 2);
}
function realmAt(tx, ty) {
  if (WORLD.arena) return WORLD.royale ? (ty > SKYL[clamp(tx, 0, WW - 1)] + 9 ? 'under' : 'surface') : 'ring'; if (ty >= DEEP_Y - 3) return 'deep';
  const h = heights[clamp(tx, 0, WW - 1)];
  if (ty < DRIFT_Y && ty < h - 12) return 'drift';
  return ty > SKYL[clamp(tx, 0, WW - 1)] + 9 ? 'under' : 'surface';
}
function placeAt(tx, ty) { if (DIM) return dimPlace(tx, ty); const r = realmAt(tx, ty); if (r !== 'surface') return r; if (abs(tx - SPAWN_X) < VIL_W + 2 && abs(ty - VIL_Y) < 30) return 'village'; return biomeAt(tx); }
const inW = (x, y) => x >= 0 && x < WW && y >= 0 && y < WH;
const tileAt = (x, y) => inW(x, y) ? tiles[y * WW + x] : (y < 0 ? AIR : BEDROCK);
const solidAt = (x, y) => (x < 0 || x >= WW || y >= WH) ? true : y < 0 ? false : TP[tiles[y * WW + x]].solid;
const fullAt = (x, y) => (x < 0 || x >= WW || y >= WH) ? true : y < 0 ? false : TP[tiles[y * WW + x]].full;
const platAt = (x, y) => inW(x, y) && TP[tiles[y * WW + x]].plat;
const liqAt = (px, py) => { const x = floor(px / T), y = floor(py / T); return inW(x, y) ? TP[tiles[y * WW + x]].liquid || 0 : 0; };

function setTile(x, y, id) {
  if (!inW(x, y)) return; const i = y * WW + x, old = tiles[i]; if (old === id) return;
  tiles[i] = id; if (MODS_ON) { MODS.set(i, id); netTile(i); } if (CHIP.size) CHIP.delete(i);
  if (TP[old].dyn) tileObjs.delete(i); if (TP[id].dyn) tileObjs.set(i, { x, y, id });
  for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const c = chunks.get(floor((y + dy) / CH) * 8192 + floor((x + dx) / CH)); if (c) c.dirty = true; }
  if (MODS_ON && !TP[id].liquid) wakeLiquid(x, y);
}
function resetWorld(w, h) {
  WORLD.royale = false;
  WW = w; WH = h; tiles = new Uint8Array(WW * WH); walls = new Uint8Array(WW * WH); heights = new Int16Array(WW); RESV = new Uint8Array(WW); SKYL = new Int16Array(WW).fill(WH);
  treeTops.clear(); tileObjs.clear(); chunks.clear(); MODS.clear(); MODS_ON = false; LQ.clear(); CHIP.clear(); PLACED.clear(); SUP.clear(); WMODS.clear(); WMODS_PLACED.clear(); STN.clear(); LOOT.clear(); ECHOPOS.clear(); mapReset(); LAIRS.clear(); PLC.clear();
  STRUCTS.length = PROPS.length = FGP.length = VENTS.length = LANDMARKS.length = ISLES.length = 0; for (const k in SPOTS) delete SPOTS[k]; PROPB = new Map(); FGPB = new Map();
}
// ---------------- small builders ----------------
const reserve = (x0, x1, lv = 1) => { for (let x = max(0, x0); x <= min(WW - 1, x1); x++) RESV[x] = max(RESV[x], lv); };
function clearBox(x0, x1, y0, y1, wall = 0) { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) if (inW(x, y)) { tiles[y * WW + x] = AIR; walls[y * WW + x] = wall; } }
function fillBox(x0, x1, y0, y1, t) { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) if (inW(x, y)) tiles[y * WW + x] = t; }
function groundUnder(x0, x1, gy, t = DIRT, depth = 8) { for (let x = x0; x <= x1; x++) for (let y = gy; y < gy + depth; y++) if (inW(x, y) && !TP[tiles[y * WW + x]].solid) tiles[y * WW + x] = t; }
function prop(img, x, y, o) { const p = Object.assign({ img, x: round(x), y: round(y) }, o); PROPS.push(p); return p; }
const propAt = (img, tx, gy, o) => prop(img, tx * T, gy * T - img.height, o);                       // left edge on a tile, standing on row gy
const propC = (img, tx, gy, o) => prop(img, tx * T + 4 - (img.width >> 1), gy * T - img.height, o);  // centred on a tile
const hang = (img, tx, ry, o) => prop(img, tx * T + 4 - (img.width >> 1), ry * T, o);                 // hanging from the underside of row ry-1
function fgOn(img, tx, gy, o) { const p = Object.assign({ img, x: round(tx * T + 4 - (img.width >> 1)), y: gy * T - img.height + 2 }, o); FGP.push(p); return p; }
const dyn = (x, y, id) => { tiles[y * WW + x] = id; if (TP[id].dyn) tileObjs.set(y * WW + x, { x, y, id }); };
function mark(id, name, sub, tx, ty, r) { LANDMARKS.push({ id, name, sub, x: tx * T + 4, y: ty * T, r: r * T }); }
function bucket(arr) { const m = new Map(); for (const p of arr) { const k0 = floor(p.x / 256), k1 = floor((p.x + p.img.width) / 256); for (let k = k0; k <= k1; k++) { if (!m.has(k)) m.set(k, []); m.get(k).push(p); } } return m; }
function signSpr(rows) {
  const ic = spr(rows, { o: '#ffd35a', O: '#fff1a8', r: '#c94a4e' }); const [c, x] = mk(16, 11);
  x.fillStyle = '#7f8898'; x.fillRect(3, 0, 1, 2); x.fillRect(12, 0, 1, 2); x.fillStyle = '#22343f'; x.fillRect(0, 2, 16, 9); x.fillStyle = '#4b6d78'; x.fillRect(1, 3, 14, 7);
  x.drawImage(ic, 8 - (ic.width >> 1), 4); return c;
}
// a house: real plank floor, invisible ceiling/roof/side walls, a plank back wall, and a facade drawn in front
function house(x0, gy, w, h, roofH, o = {}) {
  const x1 = x0 + w - 1, top = gy - h - 1;
  clearBox(x0 - 2, x1 + 2, top - roofH - 3, gy - 1); groundUnder(x0 - 2, x1 + 2, gy, DIRT, 6);
  for (let x = x0; x <= x1; x++) { tiles[gy * WW + x] = o.stone ? BRICK : PLANK; for (let y = top; y < gy; y++) walls[y * WW + x] = o.stone ? W_BRICK : W_PLANK; }
  const fac = genFacade(w, h, roofH, o), CW = (w + 2) * 8, rh = roofH * 8 + 2, cxp = (x0 + w / 2) * T, px = x0 * T - 9, py = gy * T + 4 - fac.cv.height;
  for (let x = x0 - 1; x <= x1 + 1; x++) {
    const dx = abs((x + .5) * T - cxp), Y = clamp((dx - 4) / (CW / 2 - 2) * rh, 0, rh), wy = py + 1 + Y + roofH * 8 - rh + 3;
    const r0 = roofH > 0 ? clamp(round(wy / T), top - roofH - 1, top) : top;
    for (let y = r0; y <= top; y++) if (inW(x, y)) tiles[y * WW + x] = GHOST;
  }
  const dl = o.door === -1 || o.door === 2, dr = o.door === 1 || o.door === 2;
  // doorways get real doors: they open as you walk into them
  for (let y = top + 1; y < gy; y++) { tiles[y * WW + x0] = !dl || y < gy - 3 ? GHOST : DOORC; tiles[y * WW + x1] = !dr || y < gy - 3 ? GHOST : DOORC; }
  if (o.floors === 2) for (let x = x0 + 1; x < x1; x++) tiles[(gy - 4) * WW + x] = PLATFORM;
  const S = { kind: 'house', name: o.name || '', x0, x1, y0: top + 1, y1: gy - 1, fac, px, py, a: 1, mode: 'fade', lx: round(x0 + w / 2), ly: top - roofH - 2, win: true };
  STRUCTS.push(S); reserve(x0 - 2, x1 + 2, 2); return S;
}
function tower(x0, gy, w, h, o = {}) {
  const x1 = x0 + w - 1, top = gy - h;
  clearBox(x0 - 1, x1 + 1, top - 3, gy - 1); groundUnder(x0 - 1, x1 + 1, gy, o.ruin ? STONE : DIRT, 6);
  for (let x = x0; x <= x1; x++) { tiles[gy * WW + x] = BRICK; for (let y = top; y < gy; y++) walls[y * WW + x] = W_BRICK; }
  for (let y = top + 1; y < gy - 3; y++) { tiles[y * WW + x0] = GHOST; tiles[y * WW + x1] = GHOST; }
  for (let y = gy - 4; y > top + 1; y -= 4) for (let x = x0 + 1; x < x1; x++) tiles[y * WW + x] = PLATFORM;
  for (let x = x0; x <= x1; x++) tiles[top * WW + x] = PLATFORM;
  const fac = genTowerFacade(w, h, o);
  const S = { kind: 'tower', name: o.name || '', x0, x1, y0: top + 1, y1: gy - 1, fac, px: x0 * T - 1, py: gy * T - fac.cv.height + 1, a: 1, mode: 'fade', lx: x0 + (w >> 1), ly: top - 3, win: !o.ruin };
  STRUCTS.push(S); reserve(x0 - 1, x1 + 1, 2); return S;
}
// see-through set dressing in front of you (wells, stalls, arcades, headframes)
function seeFG(fac, cx, gy, o = {}) {
  const w = fac.cv.width, h = fac.cv.height, px = round(cx - w / 2), py = gy * T - h + (o.sink || 1);
  const S = Object.assign({ kind: 'see', fac, px, py, x0: floor(px / T), x1: floor((px + w) / T), y0: floor(py / T), y1: gy - 1, a: 1, mode: 'see', see: .45, base: 1 }, o); STRUCTS.push(S); return S;
}
function flatten(x0, x1, t = DIRT) { let s = 0; for (let x = x0; x <= x1; x++) s += heights[x]; const gy = round(s / (x1 - x0 + 1)); for (let x = x0; x <= x1; x++) { for (let y = gy - 30; y < gy; y++) if (inW(x, y)) { tiles[y * WW + x] = AIR; walls[y * WW + x] = 0; } for (let y = gy; y < gy + 10; y++) if (inW(x, y) && !TP[tiles[y * WW + x]].solid) tiles[y * WW + x] = t; heights[x] = gy; } return gy; }

// ---------------- the generator ----------------
// the old all-at-once generator for fixed-size worlds (kept for reference; new worlds are endless: see 02c)
function genWorldLegacy() {
  rng = mulberry32(SEED); WORLD.arena = false; WORLD.endless = 0; resetWorld(SIZES[WORLD.size][0], SIZES[WORLD.size][1]);
  const shape = WORLD.shape, small = WW < 800;
  BASE_Y = round(WH * .35); DEEP_Y = WH - 76; DRIFT_Y = BASE_Y - 40;
  layoutBiomes(small); LOOT.clear();
  // ---- landforms ----
  const B = BASE_Y;
  // mountain peaks are placed one by one, so the Reach has real summits and passes between them
  const peaks = []; for (const sg of SEGS) if (sg.b === 'reach') { let x = sg.x0 + rand(12); while (x < sg.x1 - 4) { peaks.push([x, rand(36, 80), rand(26, 40)]); x += rand(30, 52); } }
  const LF = {
    moor: x => B + (fbm(x * .0065, 21.3, 3) - .5) * 84 - max(0, fbm(x * .028, 4.1, 2) - .56) * 95 + (fbm(x * .06, 8.3, 2) - .5) * 5,
    reach: x => { let m = 0; for (const [px, ph, pw] of peaks) { const t = max(0, 1 - abs(x - px) / pw); m = max(m, ph * (t > .9 ? .95 + (t - .9) * .5 : t * t * (2.2 - 1.2 * t) / 1.08)); } const r2 = max(0, 1 - abs(fbm(x * .03, 2.9, 3) - .5) * 4); return B - 8 - m - pow(r2, 2) * 9 * smooth(m / 20); },
    scoria: x => { const n = (fbm(x * .0062, 31.1, 3) - .22) * 3.8, st = floor(n * 3) / 3, fr = n * 3 - floor(n * 3), lv = st + smooth((fr - .8) * 5) / 3; return B + 14 - max(0, lv) * 40 + (fbm(x * .06, 5.5, 2) - .5) * 2; },
    fen: x => B + 12 + (fbm(x * .012, 61.7, 2) - .5) * 9 + (fbm(x * .05, 3.1, 2) - .5) * 3,
    thorn: x => B - 4 + (fbm(x * .011, 71.3, 3) - .5) * 46 + (fbm(x * .05, 7.7, 2) - .5) * 6,
    dunes: x => B + 4 - abs(sin(x * .045 + fbm(x * .01, 81.1, 2) * 6)) * 13 + (fbm(x * .004, 83.3, 2) - .5) * 22
  };
  LF.ash = LF.moor;
  const landH = x => {
    let hs = 0, wsum = 0; for (const sg of SEGS) { const w = segW(sg, x); if (w > .001) { hs += w * LF[sg.b](x); wsum += w; } }
    let h = wsum > 0 ? hs / wsum : LF.moor(x);
    const dx = abs(x - SHRINE_X), wa = smooth((CRATER_R + 34 - dx) / 34);
    if (wa > 0) { const t = dx / CRATER_R, rim = exp(-pow((t - 1) / .5, 2)) * 17, bowl = t < 1 ? (1 - t * t) * 15 : 0; h = lerp(h, B + 2 + bowl - rim, wa); }
    return h;
  };
  // the Mirror Court sits in the lowest pass of the mountains; the mine on the highest mesa
  // the Mirror Court takes the lowest pass of any glass range, the mine the highest rust mesa, both well clear of the village, the crater and the gate
  const pickIn = (b, pad, score, avoid) => { let best = null, bv = -1e9; for (const sg of SEGS) if (sg.b === b) for (let x = sg.x0 + pad; x <= sg.x1 - pad; x++) { if (avoid(x)) continue; const v = score(x); if (v > bv) { bv = v; best = x; } }
    if (best === null) { let far = -1; for (const sg of SEGS) if (sg.b === b) { const c = round((sg.x0 + sg.x1) / 2), d = abs(c - SHRINE_X) + abs(c - SPAWN_X); if (d > far) { far = d; best = c; } } } return best; };
  SHRINE2_X = pickIn('reach', 26, x => landH(x), x => abs(x - SHRINE_X) < CRATER_R + 60 || abs(x - SPAWN_X) < VIL_W + 40 || abs(x - GATE_X) < 40 || x < 30 || x > WW - 30);
  MINE_X = pickIn('scoria', 20, x => -landH(x), x => abs(x - GATE_X) < 40 || abs(x - SHRINE_X) < CRATER_R + 40 || abs(x - SHRINE2_X) < 50 || abs(x - SPAWN_X) < VIL_W + 30 || x < 24 || x > WW - 24);
  const flats = [[SPAWN_X, VIL_W + 2, 16], [SHRINE2_X, 27, 8], [GATE_X, 12, 10], [SHRINE_X, 27, 8], [MINE_X, 7, 6]];
  const fh = flats.map(f => { let s = 0, n = 0; for (let x = f[0] - f[1]; x <= f[0] + f[1]; x += 2) { s += landH(x); n++; } return round(s / n); });
  const flatK = x => { let m = 0; for (const f of flats) m = max(m, smooth(1 - (abs(x - f[0]) - f[1]) / f[2])); return m; };
  const nearFlat = x => flats.some(f => abs(x - f[0]) < f[1] + 18);
  const base0 = new Int16Array(WW);
  for (let x = 0; x < WW; x++) { let h = landH(x); flats.forEach((f, i) => { h = lerp(h, fh[i], smooth(1 - (abs(x - f[0]) - f[1]) / f[2])); }); base0[x] = clamp(round(h), 24, DEEP_Y - 56); SKYL[x] = base0[x] + 3; }
  // ---- shape: a density field displaced in 2D, so ground overhangs and breaks off ----
  for (let x = 0; x < WW; x++) {
    const h = base0[x], b = biomeAt(x), rg = smooth((fbm(x * .013, 55, 2) - .42) * 5) * (1 - flatK(x)) * (shape === 2 ? .6 : 1) * (b === 'scoria' ? .45 : b === 'ash' ? .3 : b === 'reach' ? 1.1 : 1);
    for (let y = max(2, h - 22); y < WH; y++) { const d = y - h; let s = d >= 0; if (rg > .02 && d > -20 && d < 9) s = d - 19 * rg * (fbm(x * .07, y * .085 + 100, 3) - .5) > 0; if (s) tiles[y * WW + x] = 1; }
  }
  for (let pass = 0; pass < 2; pass++) for (let x = 1; x < WW - 1; x++) for (let y = 3; y < WH - 4; y++) { const i = y * WW + x; if (tiles[i] && (tiles[i - 1] ? 1 : 0) + (tiles[i + 1] ? 1 : 0) + (tiles[i - WW] ? 1 : 0) + (tiles[i + WW] ? 1 : 0) < 2) tiles[i] = 0; }
  const top = x => { for (let y = max(2, base0[x] - 23); y < WH; y++) if (tiles[y * WW + x]) return y; return WH - 4; };
  for (let x = 0; x < WW; x++) heights[x] = top(x);
  // ---- materials: soil per region, clay and rust strata, basalt, then deepstone ----
  const deepAt = (x, y) => y >= DEEP_Y + (fbm(x * .04, 3.3, 2) - .5) * 12;
  for (let x = 0; x < WW; x++) {
    const b = biomeAt(x), h = heights[x], dd = 4 + floor(fbm(x * .07, 50, 2) * 6), slope = abs(base0[min(WW - 1, x + 2)] - base0[max(0, x - 2)]), high = base0[x] < B - 30;
    for (let y = 2; y < WH; y++) {
      const i = y * WW + x, d = y - h, band = ((y + fbm(x * .025, y * .025 + 7, 2) * 26) % 21 + 21) % 21, dl = deepAt(x, y), deep = d >= dd + 12, clay = d >= dd && band < (deep ? 2.2 : 3);
      const strata = (((y + fbm(x * .03, 9, 2) * 5) % 6) + 6) % 6 < 2.4;
      if (y > base0[x] + 2) walls[i] = dl ? W_DEEP : clay ? W_SAND : (b === 'ash' && d < dd) ? W_ASH : deep ? W_STONE : W_DIRT;
      if (!tiles[i]) continue;
      let t;
      if (y >= WH - 3) t = BEDROCK;
      else if (dl) t = abs(fbm(x * .05, y * .05 + 40, 3) - .5) < .018 ? DEEPGLOW : DEEPSTONE;
      else if (d < dd) t = b === 'reach' ? ((high || d < 2) ? (slope > 7 && d < 3 ? STONE : SNOW) : (slope > 8 && d < 3 ? STONE : DIRT)) : b === 'scoria' ? (d < 2 ? SAND : strata ? SANDSTONE : SAND) : b === 'ash' ? ASH
        : b === 'fen' ? (d < 2 ? MUD : d < 5 ? PEAT : fbm(x * .08, y * .08 + 5, 2) > .55 ? CLAY : DIRT) : b === 'dunes' ? (d < 1 && fbm(x * .05, 9.9, 2) > .62 ? SALT : SAND)
        : b === 'thorn' ? (fbm(x * .09, y * .09 + 3, 2) > .66 ? GRAVEL : slope > 9 && d < 3 ? STONE : DIRT) : (slope > 9 && d < 3 ? STONE : DIRT);
      else if ((b === 'scoria' || b === 'dunes') && d < dd + 20) t = strata ? SANDSTONE : b === 'dunes' && d < dd + 8 ? SAND : SAND;
      else if (b === 'fen' && d < dd + 10 && fbm(x * .06, y * .06 + 11, 2) > .5) t = CLAY;
      else t = clay ? SANDSTONE : !deep ? DIRT : fbm(x * .06, y * .06 + 20, 2) > .7 ? DIRT : STONE;
      tiles[i] = t;
    }
  }
  // ---- the Underdark: Voronoi chambers joined by cracks; the big chambers open onto a backdrop ----
  const cw = 26, chh = 18;
  for (let x = 2; x < WW - 2; x++) {
    const nf = nearFlat(x), vil = abs(x - SPAWN_X) < VIL_W + 12;
    for (let y = heights[x] + 1; y < DEEP_Y + 4; y++) {
      const d = y - heights[x], i = y * WW + x; if ((nf && d < 20) || (vil && d < 34)) continue;
      const gx = floor(x / cw), gy = floor(y / chh); let f1 = 1e9, f2 = 1e9, id = 0;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const cx = gx + ox, cy = gy + oy, qx = x - (cx + .5 + (hh(cx, cy, SEED + 1) - .5) * .8) * cw, qy = (y - (cy + .5 + (hh(cx, cy, SEED + 2) - .5) * .8) * chh) * .85, ds = sqrt(qx * qx + qy * qy); if (ds < f1) { f2 = f1; f1 = ds; id = cx * 7919 + cy * 104729; } else if (ds < f2) f2 = ds; }
      const has = hh(id, 5, SEED) > (shape === 2 ? .22 : .42), R = (4.5 + hh(id, 6, SEED) * 5) * (shape === 2 ? 1.25 : 1) * (1 + (fbm(x * .16, y * .16, 2) - .5) * .7), mask = fbm(x * .02, y * .02 + 9, 2);
      let open = false;
      if (d >= 7) open = (has && f1 < R) || (f2 - f1 < 3.3 && mask > (shape === 2 ? .46 : .54)); else open = f2 - f1 < 2.6 && mask > .63;
      if (open) { tiles[i] = AIR; if (has && R > 7.5 && f1 < R - 3 && d > 16) walls[i] = 0; }
      else if (has && hh(id, 7, SEED) > .78 && f1 < R + 1.5 && tiles[i] === STONE) tiles[i] = hh(x, y, 9) > .82 ? EMBER : SNOW;
    }
  }
  // ---- the Deep: wide caverns, and one long road through them ----
  roadY = x => clamp(round(DEEP_Y + 30 + (fbm(x * .008, 7.7, 3) - .5) * 34), DEEP_Y + 14, WH - 16);
  for (let x = 2; x < WW - 2; x++) {
    const ry = roadY(x), rh = 3 + fbm(x * .05, 2.2, 2) * 5;
    for (let y = DEEP_Y - 6; y < WH - 4; y++) {
      const i = y * WW + x; if (!tiles[i] || tiles[i] === BEDROCK) continue;
      const cav = fbm(x * .02, y * .046 + 300, 3) > .57 + max(0, DEEP_Y + 6 - y) * .025, road = y > ry - rh * 2 && y <= ry;
      if (cav || road) { tiles[i] = AIR; if (cav && !road && y > DEEP_Y + 4 && fbm(x * .02, y * .046 + 300, 3) > .6) walls[i] = 0; }
    }
  }
  // shafts from the Underdark down to the road
  for (let k = 0, n = max(3, WW / 200 | 0); k < n; k++) {
    let x = randi(30, WW - 31); if (nearFlat(x) || abs(x - SPAWN_X) < VIL_W + 20) continue;
    const y1 = roadY(x); for (let y = heights[x] + 30; y < y1; y++) { x = clamp(round(x + (fbm(y * .08, k * 9.1, 2) - .5) * 2.4), 4, WW - 5); for (let dx = -1; dx <= 1; dx++) if (tiles[y * WW + x + dx] !== BEDROCK) tiles[y * WW + x + dx] = AIR; }
  }
  // ---- chasms (moor, reach) and canyons (rust) ----
  const chasm = (cx, w0, D, river) => {
    const s0 = heights[cx]; let lowest = 0;
    for (let y = s0 - 8; y < s0 + D; y++) {
      const t = clamp((y - s0) / D, 0, 1), hw = max(1, w0 / 2 * (river ? 1 - floor(t * 4) / 4 * .5 : 1 - t * t * .7) + (fbm(y * .15, cx * .1, 2) - .5) * 3), c = cx + (fbm(y * .05, cx * .3 + 3, 2) - .5) * (river ? 4 : 9);
      for (let x = round(c - hw); x <= round(c + hw); x++) if (inW(x, y) && tiles[y * WW + x] !== BEDROCK) { tiles[y * WW + x] = AIR; if (y < SKYL[x]) walls[y * WW + x] = 0; lowest = y; }
    }
    if (river) { const y = lowest; for (let x = cx - w0; x <= cx + w0; x++) for (let r = y - 1; r <= y; r++) if (inW(x, r) && tiles[r * WW + x] === AIR && solidAt(x, r + 1)) tiles[r * WW + x] = WATER; }
    reserve(cx - w0, cx + w0, 1);
  };
  const free = (x, r) => x - r > 8 && x + r < WW - 8 && !nearFlat(x) && abs(x - SPAWN_X) > VIL_W + r + 16 && !RESV[x] && abs(x - SKY_X) > 40;
  for (let k = 0, tries = 0, n = max(1, WW / 420 | 0) + (shape === 2 ? 1 : 0); k < n && tries < 80; tries++) { const x = randi(20, WW - 20), b = biomeAt(x); if (b === 'ash' || b === 'scoria' || b === 'dunes' || b === 'fen' || !free(x, 8)) continue; chasm(x, randi(4, 7), randi(30, 52), false); k++; }
  for (let k = 0, tries = 0, n = small ? 1 : 2; k < n && tries < 120; tries++) { const x = randi(20, WW - 20), b = biomeAt(x); if ((b !== 'scoria' && b !== 'dunes') || !free(x, 10) || abs(x - MINE_X) < 26 || abs(x - GATE_X) < 26) continue; chasm(x, randi(9, 13), randi(26, 38), true); k++; }
  // ---- natural arches ----
  const arch = (ax, A, H, th) => {
    const gy = heights[ax], b = biomeAt(ax);
    for (let dx = -A; dx <= A; dx++) {
      const x = ax + dx, t = dx / A, ot = gy - round(H * sqrt(1 - t * t)), inner = abs(dx) < A - th ? gy - round((H - th) * sqrt(max(0, 1 - pow(dx / (A - th), 2)))) : 1e9;
      for (let y = ot; y < heights[x] + 2; y++) { if (y > inner && y < gy) continue; const d = y - ot; tiles[y * WW + x] = b === 'scoria' || b === 'dunes' ? ((((y % 6) + 6) % 6) < 2.4 ? SANDSTONE : SAND) : b === 'reach' ? (d < 2 ? SNOW : STONE) : (d < 3 ? DIRT : STONE); }
    }
    reserve(ax - A, ax + A, 1);
  };
  for (let k = 0, tries = 0, n = small ? 2 : 3; k < n && tries < 120; tries++) {
    const x = randi(30, WW - 31), A = randi(8, 13); if (!free(x, A + 2) || biomeAt(x) === 'ash' || biomeAt(x) === 'fen') continue;
    if (abs(heights[x - A] - heights[x]) > 3 || abs(heights[x + A] - heights[x]) > 3) continue; arch(x, A, randi(8, 12), randi(3, 4)); k++;
  }
  // ---- lakes: bowls dug into the moor, filled to the lower rim ----
  const lake = (lx, a, D) => {
    const L = max(heights[lx - a - 1], heights[lx + a + 1]);
    for (let dx = -a; dx <= a; dx++) {
      const x = lx + dx, t = dx / a, bot = L + max(1, round(D * pow(1 - t * t, .7)));
      for (let y = heights[x] - 1; y < bot; y++) { tiles[y * WW + x] = y >= L ? WATER : AIR; if (y < L) walls[y * WW + x] = 0; }
      for (let y = bot; y < bot + 3; y++) tiles[y * WW + x] = SANDSTONE; heights[x] = L;
    }
    for (const s of [-1, 1]) for (let y = L; y < L + D + 2; y++) { const x = lx + s * (a + 1); if (!TP[tiles[y * WW + x]].solid) tiles[y * WW + x] = DIRT; }
    reserve(lx - a - 2, lx + a + 2, 1);
  };
  for (let k = 0, tries = 0, n = (small ? 2 : WW > 1200 ? 4 : 3) + SEGS.filter(q => q.b === 'fen').length * 2; k < n && tries < 220; tries++) {
    const x = randi(20, WW - 20), a = randi(8, 15), b = biomeAt(x); if (!free(x, a + 3) || !(b === 'moor' || b === 'fen' || b === 'thorn')) continue;
    let lo = 1e9, hi = -1e9; for (let dx = -a - 1; dx <= a + 1; dx++) { lo = min(lo, heights[x + dx]); hi = max(hi, heights[x + dx]); } if (hi - lo > 9) continue;
    lake(x, a, randi(4, 7)); k++;
  }
  // ---- ore ----
  const vein = (id, n, y0, y1, s0, s1) => { for (let k = 0; k < n; k++) { let x = randi(4, WW - 5), y = heights[x] + randi(y0, y1); if (y > WH - 6) continue; for (let s = randi(s0, s1); s > 0; s--) { const t = tileAt(x, y); if (t === STONE || t === SANDSTONE || t === DIRT || t === DEEPSTONE) tiles[y * WW + x] = id; x += randi(-1, 1); y += randi(-1, 1); } } };
  const oreK = WW * WH / 216000; vein(COPPER, 190 * oreK | 0, 5, 70, 4, 10); vein(IRON, 140 * oreK | 0, 28, 150, 3, 9); vein(EMBER, 110 * oreK | 0, 70, 260, 3, 7);
  vein(TIN, 130 * oreK | 0, 6, 80, 3, 8); vein(COAL, 150 * oreK | 0, 14, 120, 5, 12); vein(GRAVEL, 160 * oreK | 0, 3, 50, 6, 14); vein(CLAY, 90 * oreK | 0, 2, 26, 5, 12);
  // each land has its own underneath: frost-crystal under the Reach, coal seams under the moor, cinder pockets under the ash,
  // clay and peat under the fen, gravel beds under the thorns, salt pans under the dunes
  for (let k = 0; k < 320 * oreK; k++) {
    let x = randi(4, WW - 5); const b = biomeAt(x), id = b === 'reach' ? GEODE : b === 'moor' ? COAL : b === 'ash' || b === 'scoria' ? (rng() < .25 ? EMBER : COAL) : b === 'fen' ? (rng() < .5 ? CLAY : PEAT) : b === 'thorn' ? GRAVEL : b === 'dunes' ? SALT : 0; if (!id) continue;
    let y = heights[x] + randi(b === 'reach' || id === EMBER ? 24 : 8, b === 'reach' ? 90 : 60); if (y > WH - 8) continue;
    for (let n = randi(4, id === GEODE || id === EMBER ? 7 : 13); n > 0; n--) { const t = tileAt(x, y); if (t === STONE || t === DIRT || t === SANDSTONE) tiles[y * WW + x] = id; x += randi(-1, 1); y += randi(-1, 1); if (x < 1 || x >= WW - 1) break; }
  }
  for (let k = 0; k < 60 * oreK; k++) { let x = randi(4, WW - 5); if (biomeAt(x) !== 'dunes') continue; let y = heights[x] + randi(2, 12); for (let n = randi(5, 12); n > 0; n--) { if (tileAt(x, y) === SAND || tileAt(x, y) === SANDSTONE) tiles[y * WW + x] = SALT; x += randi(-1, 1); y += randi(0, 1); } }
  // ---- backdrop: basalt hoodoos and broken brick walls on the surface (wall layer only) ----
  for (let x = 6; x < WW - 8; x++) {
    if (nearFlat(x) || RESV[x] || rand() > .03) continue; const h = heights[x], brick = rand() < .4, w = brick ? randi(5, 9) : randi(3, 5), ht = brick ? randi(4, 8) : randi(5, 11);
    for (let dx = 0; dx < w; dx++) { const gh = heights[x + dx], th2 = brick ? ht - (hh(x + dx, 1, 2) * 3 | 0) : ht - abs(dx - w / 2) * 2; for (let y = gh - 1; y > gh - 1 - th2 && y > 2; y--) if (!(brick && dx > 1 && dx < w - 2 && gh - y > 2 && gh - y < 5) && tiles[y * WW + x + dx] === AIR) walls[y * WW + x + dx] = brick ? W_RUIN : W_COL; }
    x += w + 3;
  }
  // ---- buried vaults ----
  for (let k = max(2, WW / 150 | 0), tries = 0; k > 0 && tries < 200; tries++) {
    const x = randi(20, WW - 34), y = heights[x] + randi(22, 80); if (nearFlat(x) || abs(x - SPAWN_X) < VIL_W + 10 || y > DEEP_Y - 12) continue; k--;
    for (let dx = 0; dx < 13; dx++) for (let dy = 0; dy < 8; dy++) { const i = (y + dy) * WW + x + dx, edge = dx === 0 || dx === 12 || dy === 0 || dy === 7; tiles[i] = edge && !((dx === 0 || dx === 12) && dy > 3 && dy < 7) ? BRICK : AIR; walls[i] = W_BRICK; }
    tiles[(y + 6) * WW + x + 3] = POT; tiles[(y + 6) * WW + x + 6] = POT; tiles[(y + 6) * WW + x + 9] = POT; tiles[(y + 7) * WW + x + 5] = EMBER; tiles[(y + 7) * WW + x + 7] = COPPER; dyn(x + 6, y + 2, TORCH);
  }
  // ---- set pieces ----
  const clearAbove = (cx, r, gy) => { for (let x = cx - r; x <= cx + r; x++) for (let y = max(1, gy - 46); y < gy; y++) { tiles[y * WW + x] = AIR; walls[y * WW + x] = 0; } };
  const pillars = (cx, gy) => { for (const px of [-22, -14, 13, 21]) { const ph = 5 + ((px * 7 + SEED) & 3) + (px & 1) * 2, broken = ((px + SEED) & 1); for (let y = 1; y <= ph; y++) for (let dx = (y === ph && !broken ? -1 : 0); dx < (y === ph && !broken ? 4 : 3); dx++) if (!(broken && y === ph && dx === 2)) walls[(gy - y) * WW + cx + px + dx] = W_RUIN; } };
  SHRINE_Y = heights[SHRINE_X]; clearAbove(SHRINE_X, 26, SHRINE_Y);
  for (let x = SHRINE_X - 26; x <= SHRINE_X + 26; x++) { tiles[SHRINE_Y * WW + x] = BRICK; tiles[(SHRINE_Y + 1) * WW + x] = abs(x - SHRINE_X) % 5 === 0 ? BRICK : ASH; }
  pillars(SHRINE_X, SHRINE_Y); dyn(SHRINE_X, SHRINE_Y - 1, SHRINE); reserve(SHRINE_X - 27, SHRINE_X + 27, 2);
  mark('crater', 'ASHEN HOLLOW', "the Warden's shrine", SHRINE_X, SHRINE_Y - 4, 30);
  SHRINE2_Y = heights[SHRINE2_X]; clearAbove(SHRINE2_X, 26, SHRINE2_Y);
  for (let x = SHRINE2_X - 26; x <= SHRINE2_X + 26; x++) { tiles[SHRINE2_Y * WW + x] = abs(x - SHRINE2_X) % 6 === 0 ? BRICK : SNOW; tiles[(SHRINE2_Y + 1) * WW + x] = BRICK; }
  pillars(SHRINE2_X, SHRINE2_Y); dyn(SHRINE2_X, SHRINE2_Y - 1, SHRINE2); reserve(SHRINE2_X - 27, SHRINE2_X + 27, 2);
  mark('court', 'THE MIRROR COURT', 'where the Glass Waker waits', SHRINE2_X, SHRINE2_Y - 4, 30);
  GATE_Y = heights[GATE_X]; clearAbove(GATE_X, 10, GATE_Y); for (let x = GATE_X - 9; x <= GATE_X + 9; x++) tiles[GATE_Y * WW + x] = BRICK; dyn(GATE_X, GATE_Y - 1, GATE); reserve(GATE_X - 10, GATE_X + 10, 2);
  mark('gate', 'THE FURNACE GATE', 'three embers open it', GATE_X, GATE_Y - 4, 22);
  buildVillage(); buildMine(); buildForge();
  { let tx = 60; for (let k = 0; k < 80; k++) { tx = randi(50, WW - 60); const b = biomeAt(tx); if ((b === 'moor' || b === 'thorn' || b === 'reach') && !RESV[tx] && !RESV[tx + 8] && abs(tx - SPAWN_X) > VIL_W + 30 && abs(tx - SHRINE2_X) > 40 && abs(tx - GATE_X) > 30 && abs(tx - SHRINE_X) > CRATER_R + 30) break; } let gy = flatten(tx - 2, tx + 8, STONE); tower(tx, gy, 7, 19, { ruin: true, name: 'spire' }); dyn(tx + 3, gy - 1, POT); dyn(tx + 2, gy - 9, POT); tiles[(gy - 1) * WW + tx + 5] = POT; mark('spire', 'THE BROKEN SPIRE', 'an old watch over the moor', tx + 3, gy - 6, 14); SPOTS.spire = { x: tx + 3, y: gy - 20 }; }
  buildStructures(free);
  // the surface is final now (sky islands are not the surface): fix heights and the sky line
  for (let x = 0; x < WW; x++) { heights[x] = top(x); SKYL[x] = max(SKYL[x], heights[x] + 3); }
  // ---- the Drift: sky islands, an altar on the largest, updraft vents beneath ----
  buildDrift(); skyRuins();
  // ---- pools: water in the Underdark, molten cinder in the Deep ----
  const pool = (x, y, liq, maxW, maxD) => {
    while (inW(x, y + 1) && tiles[(y + 1) * WW + x] === AIR) y++;
    if (!inW(x, y + 1) || !TP[tiles[(y + 1) * WW + x]].solid) return 0; let n = 0;
    for (let d = 0; d < maxD; d++, y--) {
      let a = x, b = x; const sup = k => TP[tiles[(y + 1) * WW + k]].solid || TP[tiles[(y + 1) * WW + k]].liquid;
      while (a > 2 && tiles[y * WW + a - 1] === AIR && sup(a - 1) && x - a < maxW) a--;
      while (b < WW - 3 && tiles[y * WW + b + 1] === AIR && sup(b + 1) && b - x < maxW) b++;
      if (!TP[tiles[y * WW + a - 1]].solid || !TP[tiles[y * WW + b + 1]].solid || !sup(a) || !sup(b)) break;
      for (let k = a; k <= b; k++) tiles[y * WW + k] = liq; n += b - a + 1;
    }
    return n;
  };
  for (let k = 0, tries = 0, n = WW / 45 | 0; k < n && tries < n * 30; tries++) { const x = randi(10, WW - 11), y = randi(heights[x] + 16, DEEP_Y - 10); if (tileAt(x, y) === AIR && walls[y * WW + x] !== W_BRICK && pool(x, y, WATER, 22, 4)) k++; }
  for (let k = 0, tries = 0, n = WW / 30 | 0; k < n && tries < n * 30; tries++) { const x = randi(10, WW - 11), y = randi(DEEP_Y + 4, WH - 8); if (abs(x - FORGE_X) < 50 || abs(x - MINE_X) < 8) continue; if (tileAt(x, y) === AIR && pool(x, y, CINDER, k < 4 ? 44 : 28, k < 4 ? 8 : 5)) k++; }
  // ---- growth ----
  for (let x = 0; x < WW; x++) for (let y = 3; y < WH - 4; y++) { const i = y * WW + x; if (tiles[i] === DIRT && !TP[tiles[i - WW]].full && !TP[tiles[i - WW]].liquid && !walls[i - WW]) tiles[i] = GRASS; }
  let lastTree = -9;
  for (let x = 3; x < WW - 3; x++) {
    const h = heights[x], b = biomeAt(x), tp = tileAt(x, h); if (RESV[x] || tileAt(x, h - 1) !== AIR || nearFlat(x) && flatK(x) > .5) continue;
    const ch = b === 'moor' ? .3 : b === 'thorn' ? .45 : b === 'reach' ? .2 : b === 'ash' ? .1 : b === 'fen' ? .08 : b === 'dunes' ? 0 : .06;
    if (abs(heights[x - 1] - h) <= 1 && abs(heights[x + 1] - h) <= 1 && x - lastTree > 3 && TP[tp].solid && !TP[tp].ghost && rand() < ch) {
      const kind = b === 'thorn' ? 3 : b === 'moor' || b === 'fen' ? 0 : b === 'reach' ? 1 : 2, th = kind === 0 ? randi(6, 14) : kind === 1 ? randi(5, 10) : kind === 3 ? randi(5, 9) : randi(4, 8); let ok = true;
      for (let y = 1; y <= th + 4; y++) if (tileAt(x, h - y) !== AIR) ok = false;
      if (ok) { for (let y = 1; y <= th; y++) tiles[(h - y) * WW + x] = [TRUNK, TRUNK2, TRUNK3, TRUNK4][kind]; treeTops.set(x, { y: h - th, kind, v: randi(0, 2), ph: rand(TAU) }); lastTree = x; }
    }
  }
  for (const s of ISLES) for (let x = s.cx - s.a + 3; x < s.cx + s.a - 3; x += randi(4, 7)) {
    if (RESV[x] > 1) continue; let y = s.cy - 4; while (y < s.cy + 4 && tileAt(x, y) === AIR) y++; if (tileAt(x, y) !== SNOW || rand() > .45) continue;
    const th = randi(4, 8); let ok = true; for (let k = 1; k <= th + 4; k++) if (tileAt(x, y - k) !== AIR) ok = false;
    if (ok && !treeTops.has(x)) { for (let k = 1; k <= th; k++) tiles[(y - k) * WW + x] = TRUNK2; treeTops.set(x, { y: y - th, kind: 1, v: randi(0, 2), ph: rand(TAU) }); }
  }
  for (let x = 2; x < WW - 2; x++) {
    const nf = RESV[x] > 1, reach = biomeAt(x) === 'reach';
    for (let y = 4; y < WH - 4; y++) {
      const i = y * WW + x; if (tiles[i] !== AIR) continue; const below = tiles[i + WW], r = rand();
      if (y >= DEEP_Y - 2) { if ((below === DEEPSTONE || below === DEEPGLOW) && r < .05) tiles[i] = FUNGUS; else if (TP[tiles[i - WW]].full && r > .985) { const len = randi(1, 4); for (let j = 0; j < len && tiles[i + j * WW] === AIR; j++) tiles[i + j * WW] = VINE; } continue; }
      if (!walls[i]) { if (nf) continue; const bb = biomeAt(x);
        if (tiles[i + WW + WW] === WATER || below === WATER) { continue; }
        if (below === MUD || below === PEAT) { if (r < .5) tiles[i] = REED; else if (r < .54) tiles[i] = BERRY; continue; }
        if (below === GRASS) { if (r < (bb === 'thorn' ? .09 : .035)) tiles[i] = BERRY; else if (r < .1) tiles[i] = STICKS; else if (r < .14) tiles[i] = PEBBLE; else if (r < .52) tiles[i] = TALLGRASS; else if (r < .6) tiles[i] = FLOWER; continue; }
        if ((below === SAND || below === SALT) && bb === 'dunes') { if (r < .04) tiles[i] = BONES; else if (r < .07) tiles[i] = PEBBLE; else if (r < .1) tiles[i] = DEADBUSH; continue; }
        if ((below === STONE || below === GRAVEL || below === SANDSTONE || below === DIRT) && r < .07) { tiles[i] = r < .045 ? PEBBLE : STICKS; continue; }
        if (below === ASH && r < .03) { tiles[i] = BONES; continue; } else if (below === SNOW && r < .12) tiles[i] = CRYSTAL; else if ((below === SAND || below === ASH) && r < .07) tiles[i] = DEADBUSH; else if (TP[tiles[i - WW]].full && !TP[tiles[i - WW]].ghost && r > .9) { const len = randi(1, 6); for (let j = 0; j < len && tiles[i + j * WW] === AIR; j++) tiles[i + j * WW] = VINE; } }
      else if (walls[i] === W_PLANK || walls[i] === W_BRICK && nf) continue;
      else if (TP[below].full && !TP[below].ghost) { if (r < .024) tiles[i] = GLOWCAP; else if (r < .036) tiles[i] = POT; else if (r < (reach ? .09 : .05)) tiles[i] = CRYSTAL; }
      else if (TP[tiles[i - WW]].full && !TP[tiles[i - WW]].ghost && r < .06) { const len = randi(1, 5); for (let j = 0; j < len && tiles[i + j * WW] === AIR; j++) tiles[i + j * WW] = VINE; }
    }
  }
  makeTraversable();
  // ---- purely visual: foliage in front of you, stalactites and crystals behind you ----
  for (let x = 4; x < WW - 4; x += randi(3, 8)) {
    if (RESV[x] > 1) continue; const h = heights[x], t = tileAt(x, h), b = biomeAt(x); if (!TP[t].solid || TP[t].ghost || tileAt(x, h - 1) === WATER) continue;
    if (b === 'dunes' && rand() < .7) continue; const set = FOL[b === 'ash' ? 'ash' : b === 'reach' ? 'reach' : b === 'scoria' || b === 'dunes' ? 'scoria' : 'moor']; fgOn(set[randi(0, set.length - 1)], x, h, { lit: 1 });
  }
  for (const s of ISLES) for (let x = s.cx - s.a + 2; x < s.cx + s.a - 2; x += randi(3, 6)) { if (RESV[x] > 1) continue; let y = s.cy - 4; while (y < s.cy + 4 && tileAt(x, y) !== SNOW) y++; if (tileAt(x, y) === SNOW && tileAt(x, y - 1) !== SNOW) fgOn(FOL.drift[randi(0, 1)], x, y, { lit: 1 }); }
  const stv = [], cyv = []; for (let k = 0; k < 12; k++) stv.push(PROP.stalactite(8 + round(k * 1.2), 100 + k)); for (let k = 0; k < 6; k++) cyv.push(PROP.crystal(k * 7 + 3));
  for (let k = 0, n = WW * WH / 700 | 0; k < n; k++) {
    const x = randi(4, WW - 5), y = randi(BASE_Y, WH - 6), i = y * WW + x; if (tiles[i] !== AIR || !walls[i] && y < SKYL[x]) continue;
    if (TP[tiles[i - WW]].full && !TP[tiles[i - WW]].ghost && tileAt(x, y + 1) === AIR && tileAt(x, y + 2) === AIR) hang(stv[randi(0, 11)], x, y, { lit: 1 });
    else if (TP[tiles[i + WW]].full && rand() < .25) propC(cyv[randi(0, 5)], x, y + 1, { lit: 1, light: biomeAt(x) === 'reach' ? [.1, .3, .34] : null });
    else if (y >= DEEP_Y && TP[tiles[i + WW]].full) fgOn(FOL.deep[randi(0, 1)], x, y + 1, { lit: 1 });
  }
  PROPB = bucket(PROPS); FGPB = bucket(FGP);
  MODS_ON = true;
}
// ---------------- Hearthhold: houses, a dojo, a smithy, a watchtower, a well ----------------
function buildVillage() {
  const c = SPAWN_X, wide = VIL_W >= 46; let gy = heights[c]; { let s = 0; for (let x = c - VIL_W; x <= c + VIL_W; x++) s += heights[x]; gy = round(s / (2 * VIL_W + 1)); }
  VIL_Y = gy;
  for (let x = c - VIL_W - 3; x <= c + VIL_W + 3; x++) { for (let y = gy - 40; y < gy; y++) { tiles[y * WW + x] = AIR; walls[y * WW + x] = 0; } for (let y = gy; y < gy + 12; y++) if (!TP[tiles[y * WW + x]].solid || TP[tiles[y * WW + x]].liquid) tiles[y * WW + x] = y < gy + 5 ? DIRT : STONE; heights[x] = gy; }
  reserve(c - VIL_W - 3, c + VIL_W + 3, 1);
  const L = wide ? { tw: c - 45, a: c - 37, aw: 10, d: c - 24, dw: 12, s: c + 11, sw: 12, b: c + 26, bw: 9, e: c + 38, ew: 8, th: 18 } : { tw: c - 37, a: c - 30, aw: 9, d: c - 19, dw: 11, s: c + 9, sw: 11, b: c + 23, bw: 8, e: 0, ew: 0, th: 16 };
  const dojoSign = signSpr(['o...o', '.o.o.', '..O..', '.o.o.', 'o...o']), smithSign = signSpr(['ooooo', 'OOOOo', '.ooo.', '..o..', '.ooo.']), homeSign = signSpr(['..r..', '.rrr.', 'rrrrr', '.o.o.', '.ooo.']);
  // watchtower
  tower(L.tw, gy, 5, L.th, { name: 'watchtower' }); propC(PROP.crate, L.tw + 2, gy); hang(PROP.lamp, L.tw + 2, gy - 7, { light: [.9, .62, .3] });
  // home A: bed, table, shelf, lamp
  { const x0 = L.a, w = L.aw; house(x0, gy, w, 5, 3, { door: 2, chimney: -1, name: 'home' }); propAt(PROP.bed, x0 + 1, gy); propAt(PROP.rug, x0 + 4, gy); propAt(PROP.table, x0 + 4, gy); propC(PROP.chair, x0 + 3, gy); propC(PROP.chair, x0 + 6, gy); propAt(PROP.shelf, x0 + w - 3, gy); hang(PROP.lamp, x0 + 5, gy - 5, { light: [.85, .6, .3] }); propC(PROP.pot, x0 + w + 1, gy); SPOTS.homeA = { x: x0 + 4, y: gy }; }
  // Juno's dojo: two floors, a practice post near the far wall
  { const x0 = L.d, w = L.dw; house(x0, gy, w, 8, 4, { door: 2, floors: 2, sign: dojoSign, roof: '#5a4a72', roof2: '#7a6a92', name: 'dojo' }); propAt(PROP.rug, x0 + 3, gy); propAt(PROP.rug, x0 + 5, gy);
    for (let k = 0; k < 3; k++) hang(PROP.banners[k], x0 + 2 + k * 3, gy - 3); hang(PROP.lamp, x0 + w - 3, gy - 3, { light: [.85, .58, .3] });
    propAt(PROP.bed, x0 + 1, gy - 4); propAt(PROP.shelf, x0 + w - 4, gy - 4); propC(PROP.sacks, x0 + 5, gy - 4); hang(PROP.lamp, x0 + 6, gy - 8, { light: [.8, .55, .28] });
    SPOTS.juno = { x: x0 + w - 4, y: gy }; SPOTS.dummy = { x: x0 + 2, y: gy }; }
  // plaza: a well, a stall, the notice board and the fire
  { for (let x = c - (wide ? 9 : 7); x <= c + (wide ? 9 : 7); x++) tiles[gy * WW + x] = BRICK;
    seeFG(genWellFacade(), c * T + 4, gy, { see: .4, name: 'well' }); seeFG(genStallFacade(['#c94a4e']), (c - (wide ? 6 : 5)) * T, gy, { see: .4, name: 'stall' });
    propC(PROP.board, c + (wide ? 7 : 5), gy); dyn(c + 4, gy - 1, CAMP); SPOTS.board = { x: c + (wide ? 7 : 5), y: gy }; SPOTS.pell = { x: c - 2, y: gy }; SPOTS.camp = { x: c + 4, y: gy };
    for (const dx of wide ? [-11, 10] : [-9, 8]) { propC(PROP.post, c + dx, gy, { light: [.9, .62, .3], lyo: 2 }); }
    propC(PROP.banners[0], c - (wide ? 13 : 11), gy - 6); }
  // Bram's smithy: walk-through, with the real bench and kiln
  { const x0 = L.s, w = L.sw; house(x0, gy, w, 6, 3, { door: 2, chimney: 1, stone: true, sign: smithSign, roof: '#3f3a4c', roof2: '#514c62', name: 'smithy' });
    propAt(PROP.hearth, x0 + 1, gy); dyn(x0 + 2, gy - 1, HEARTH); propC(PROP.anvil, x0 + 5, gy); dyn(x0 + 7, gy - 1, BENCH); dyn(x0 + 9, gy - 1, FURNACE); propC(PROP.barrel, x0 + w - 2, gy); hang(PROP.lamp, x0 + 6, gy - 6, { light: [.9, .6, .3] });
    SPOTS.bram = { x: x0 + 4, y: gy }; }
  // home B: two floors
  { const x0 = L.b, w = L.bw; house(x0, gy, w, 8, 3, { door: 2, floors: 2, chimney: 1, sign: homeSign, roof: '#3a6f76', roof2: '#4fb0b8', name: 'home' }); propAt(PROP.table, x0 + 2, gy); propC(PROP.stool, x0 + 2, gy); propC(PROP.cauldron, x0 + w - 3, gy); hang(PROP.lamp, x0 + 4, gy - 3, { light: [.85, .6, .3] });
    propAt(PROP.bed, x0 + w - 3, gy - 4); propAt(PROP.shelf, x0 + 1, gy - 4); hang(PROP.lamp, x0 + 4, gy - 8, { light: [.8, .55, .28] }); SPOTS.homeB = { x: x0 + 3, y: gy }; }
  // storehouse (wide villages only)
  if (L.ew) { const x0 = L.e, w = L.ew; house(x0, gy, w, 5, 3, { door: 2, name: 'store' }); propC(PROP.barrel, x0 + 2, gy); propC(PROP.barrel, x0 + 3, gy); propC(PROP.crate, x0 + 5, gy); propC(PROP.crate, x0 + 5, gy - 1); propC(PROP.sacks, x0 + w - 2, gy); hang(PROP.lamp, x0 + 4, gy - 5, { light: [.8, .55, .28] }); }
  // fences and posts
  for (const s of [-1, 1]) { for (let k = 0; k < 3; k++) fgOn(PROP.fence, c + s * (VIL_W + 1 + k), gy, { lit: 1 }); propC(PROP.post, c + s * (VIL_W - 1), gy, { light: [.9, .62, .3], lyo: 2 }); }
  for (const dx of wide ? [-26, 24] : [-21, 21]) propC(PROP.post, c + dx, gy, { light: [.9, .62, .3], lyo: 2 });
  SPOTS.walk = [[c - VIL_W + 8, c - 10], [c + 10, c + VIL_W - 4], [c - 22, c + 22]];
  mark('village', 'HEARTHHOLD', 'the last lit village', c, gy - 6, VIL_W);
}
// ---------------- the Rustfall mine: a timbered shaft down to the Deep road ----------------
function buildMine() {
  const x = MINE_X; let gy = heights[x]; gy = flatten(x - 6, x + 7, SAND); MINE_Y = gy; const bot = roadY(x) + 1;
  for (let y = gy - 1; y <= bot; y++) { for (let dx = -1; dx <= 2; dx++) { tiles[y * WW + x + dx] = AIR; if (y >= gy && y < gy + 28) walls[y * WW + x + dx] = W_PLANK; } if (y >= gy && y < gy + 28) { tiles[y * WW + x - 2] = PLANK; tiles[y * WW + x + 3] = PLANK; } }
  for (let y = gy + 4, k = 0; y < bot - 1; y += 4, k++) { const a = k & 1 ? x + 1 : x - 1; tiles[y * WW + a] = PLATFORM; tiles[y * WW + a + 1] = PLATFORM; }
  // a hatch over the shaft: walk across it, or hold S to drop through
  for (let dx = -1; dx <= 2; dx++) tiles[gy * WW + x + dx] = PLATFORM;
  for (let y = gy + 7; y < bot - 3; y += 12) dyn(x + (((y / 12) | 0) & 1 ? -1 : 2), y, TORCH);
  seeFG(genHeadframe(), (x + 1) * T, gy, { see: .5, name: 'headframe', sink: 2 });
  propC(PROP.crate, x - 4, gy); propC(PROP.crate, x - 5, gy); propC(PROP.sacks, x + 5, gy); propC(PROP.post, x + 6, gy, { light: [.9, .62, .3], lyo: 2 });
  reserve(x - 7, x + 8, 2); mark('mine', 'RUSTFALL MINE', 'the long way down', x, gy - 4, 12);
}
// ---------------- the Drowned Forge, at the bottom of the world ----------------
function buildForge() {
  const cx = FORGE_X, fy = FORGE_Y = WH - 12, hw = 34, top = fy - 18;
  for (let x = cx - hw - 3; x <= cx + hw + 3; x++) for (let y = top - 3; y <= fy + 2; y++) { tiles[y * WW + x] = BRICK; walls[y * WW + x] = W_BRICK; }
  clearBox(cx - hw, cx + hw, top, fy - 1, W_BRICK);
  for (const s of [-1, 1]) {
    // doorways, then ramps climbing to the road
    for (let x = cx + s * (hw + 1); abs(x - cx) <= hw + 3; x += s) for (let y = fy - 6; y < fy; y++) tiles[y * WW + x] = y >= fy - 2 && abs(x - cx) === hw + 1 ? BRICK : AIR;
    let x = cx + s * (hw + 4), fl = fy; for (let k = 0; k < 90; k++, x += s) {
      if (x < 4 || x > WW - 5) break; const ry = roadY(x); if (fl > ry + 1 && k % 2 === 0) fl--;
      for (let y = fl - 6; y < fl; y++) if (tiles[y * WW + x] !== BEDROCK) tiles[y * WW + x] = AIR; if (!TP[tiles[fl * WW + x]].solid) tiles[fl * WW + x] = DEEPSTONE;
      if (fl <= ry + 1 && k > 8) break;
    }
    // flooded antechambers
    for (let x2 = cx + s * hw; abs(x2 - cx) >= hw - 9; x2 -= s) for (let y = fy - 2; y < fy; y++) tiles[y * WW + x2] = WATER;
  }
  // the ember flask rests on a dais in the west hall
  fillBox(cx - hw + 3, cx - hw + 6, fy - 2, fy - 1, BRICK); dyn(cx - hw + 5, fy - 3, PEDESTAL); propC(PROP.altar, cx - hw + 5, fy - 2); SPOTS.flask = { x: cx - hw + 5, y: fy - 3 };
  for (let k = -2; k <= 2; k++) { const x = cx + k * 11; dyn(x, fy - 1, HEARTH); propAt(PROP.hearth, x - 1, fy); }
  for (let k = 0; k < 9; k++) { const x = cx - hw + 4 + k * 8; for (let j = 0; j < 3 + (k % 3) * 2; j++) hang(PROP.chain, x, top + j / 2); }
  for (let k = 0; k < 4; k++) hang(PROP.banners[k % 3], cx - 24 + k * 16, top + 1);
  propC(PROP.anvil, cx - 6, fy); propC(PROP.anvil, cx + 7, fy); propC(PROP.barrel, cx - 18, fy); propC(PROP.crate, cx + 18, fy);
  for (const s of [-1, 1]) seeFG(genArchFacade(10, 7, { deep: true, broken: true }), (cx + s * (hw - 5)) * T + 4, fy, { see: .5, name: 'arcade' });
  SPOTS.keeper = { x: cx + 8, y: fy }; SPOTS.forge = { x0: cx - hw + 10, x1: cx + hw - 10, y: fy };
  reserve(cx - hw - 3, cx + hw + 3, 0); mark('forge', 'THE DROWNED FORGE', 'the Keeper still works', cx, fy - 6, 30);
}
// ---------------- the Drift ----------------
function island(cx, cy, a, th, force) {
  if (cx - a < 4 || cx + a > WW - 5 || cy < 8) return false;
  if (!force) for (let dx = -a - 3; dx <= a + 3; dx++) for (let dy = -7; dy < th + 6; dy++) if (tileAt(cx + dx, cy + dy) !== AIR) return false;
  for (let dx = -a; dx <= a; dx++) {
    const x = cx + dx, t = dx / a, tk = max(1, round(pow(1 - t * t, .55) * th + (fbm(x * .3, cy, 2) - .5) * 4)), y0 = cy + round((fbm(x * .12, cy * .7, 2) - .5) * 3 * (1 - abs(t)));
    for (let dy = 0; dy < tk; dy++) { const y = y0 + dy; tiles[y * WW + x] = dy < 2 ? SNOW : dy < 4 ? DIRT : hh(x, y, 4) > .9 ? (hh(x, y, 5) > .5 ? EMBER : IRON) : STONE; }
    if (hh(x, cy, 9) > .7) { const len = 1 + floor(hh(x, cy, 10) * 8); for (let j = 0; j < len; j++) if (tileAt(x, y0 + tk + j) === AIR) tiles[(y0 + tk + j) * WW + x] = VINE; }
  }
  ISLES.push({ cx, cy, a }); return true;
}
function vent(x, topY) { let gy = heights[x]; if (!TP[tileAt(x, gy)].solid || tileAt(x, gy - 1) === WATER || RESV[x] > 1) return false; VENTS.push({ x, cx: x * T + 4, gy, top: topY }); propC(PROP.vent, x, gy + 1, { lit: 1 }); reserve(x - 2, x + 2, 1); return true; }
function buildDrift() {
  const shape = WORLD.shape; SKY_Y = max(14, DRIFT_Y - 22);
  island(SKY_X, SKY_Y, 19, 10, true);
  for (let x = SKY_X - 9; x <= SKY_X + 9; x++) { for (let y = SKY_Y - 6; y < SKY_Y; y++) tiles[y * WW + x] = AIR; tiles[SKY_Y * WW + x] = abs(x - SKY_X) % 4 === 0 ? BRICK : SNOW; tiles[(SKY_Y + 1) * WW + x] = BRICK; }
  dyn(SKY_X, SKY_Y - 1, PEDESTAL); propC(PROP.altar, SKY_X, SKY_Y); SPOTS.hook = { x: SKY_X, y: SKY_Y - 1 };
  seeFG(genArchFacade(19, 7, { banners: true }), SKY_X * T + 4, SKY_Y, { see: .45, name: 'colonnade' }); reserve(SKY_X - 10, SKY_X + 10, 2);
  mark('drift', 'THE DRIFT', 'islands on the wind', SKY_X, SKY_Y - 4, 20);
  const n = (shape === 1 ? WW / 26 : shape === 2 ? WW / 100 : WW / 46) | 0;
  for (let k = 0, tries = 0; k < n && tries < n * 30; tries++) {
    const cx = randi(16, WW - 17), cy = randi(14, DRIFT_Y - 4), a = randi(5, shape === 1 ? 16 : 12);
    if (abs(cx - SKY_X) < a + 26 && abs(cy - SKY_Y) < 16) continue; if (island(cx, cy, a, randi(4, 8), false)) k++;
  }
  // vents: two under the altar island, then one beside every other island
  vent(SKY_X - 25, SKY_Y - 8) || vent(SKY_X - 29, SKY_Y - 8); vent(SKY_X + 25, SKY_Y - 8) || vent(SKY_X + 29, SKY_Y - 8);
  ISLES.slice(1).sort((p, q) => p.cx - q.cx).forEach((s, i) => { if (i % 2) return; const x = s.cx + (i % 4 ? 1 : -1) * (s.a + 4); if (x > 6 && x < WW - 7 && heights[x] - s.cy > 16) vent(x, s.cy - 7); });
}

function genArena() {
  SEED = 4242; rng = mulberry32(SEED); WORLD.arena = true; resetWorld(150, 68);
  const fy = 60; SPAWN_X = 75; SHRINE_X = SHRINE2_X = GATE_X = -9999; BASE_Y = fy; DEEP_Y = 9999; DRIFT_Y = -99; VIL_Y = -999;
  for (let x = 0; x < WW; x++) {
    heights[x] = fy;
    for (let y = fy; y < WH; y++) tiles[y * WW + x] = y >= WH - 3 ? BEDROCK : y < fy + 2 ? BRICK : STONE;
    for (let y = 8; y < fy; y++) { if (x < 3 || x >= WW - 3) tiles[y * WW + x] = BEDROCK; else if (x % 14 < 2 && y > fy - 26 || (y > fy - 28 && y <= fy - 26)) walls[y * WW + x] = W_RUIN; }
  }
  const plat = (x0, x1, y) => { for (let x = x0; x <= x1; x++) tiles[y * WW + x] = PLATFORM; };
  const block = (x0, x1, y0, y1) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) tiles[y * WW + x] = BRICK; };
  plat(16, 36, 53); plat(113, 133, 53); plat(48, 58, 55); plat(91, 101, 55); block(61, 88, 50, 51); plat(36, 52, 46); plat(97, 113, 46); plat(66, 83, 41); plat(20, 31, 39); plat(118, 129, 39);
  for (const [x, y] of [[14, 52], [42, 52], [70, 44], [79, 44], [107, 52], [135, 52], [28, 34], [121, 34], [56, 52], [93, 52]]) setTile(x, y, TORCH);
  MODS_ON = false;
}
function encodeMods() { const a = [...MODS].sort((p, q) => p[0] - q[0]); let prev = 0; return a.map(([i, t]) => { const s = (i - prev).toString(36) + '.' + t.toString(36); prev = i; return s; }).join(','); }
function applyMods(str) {
  if (!str) return; let i = 0; const was = MODS_ON; MODS_ON = true;
  for (const s of str.split(',')) { const [a, b] = s.split('.'); i += parseInt(a, 36); const t = parseInt(b, 36); if (i >= 0 && i < WW * WH && TP[t]) setTile(i % WW, floor(i / WW), t); }
  MODS_ON = was; LQ.clear();
  for (const [x, tr] of treeTops) if (!TP[tileAt(x, tr.y)].stalk) treeTops.delete(x);
}
// ---------------- liquids: they fall, slide off edges, and spread under their own weight ----------------
function wakeLiquid(x, y, r = 1) { for (let dy = -1; dy <= 1; dy++) for (let dx = -r; dx <= r; dx++) { const xx = x + dx, yy = y + dy; if (inW(xx, yy) && TP[tiles[yy * WW + xx]].liquid) LQ.add(yy * WW + xx); } }
const flowable = t => t === AIR || (TP[t].decor && !TP[t].dyn && !TP[t].stalk);
function tickLiquids() {
  if (!LQ.size || G.time % 3) return; const list = [...LQ].sort((a, b) => b - a); LQ.clear(); let n = 0;
  const mv = (i, j) => {
    const t = tiles[i]; if (tiles[j] !== AIR) { const x = j % WW, y = (j / WW) | 0; setTile(x, y, AIR); }
    tiles[j] = t; tiles[i] = AIR; if (MODS_ON) { MODS.set(i, AIR); MODS.set(j, t); netTile(i); netTile(j); } const x = j % WW, y = (j / WW) | 0; wakeLiquid(x, y); wakeLiquid(i % WW, (i / WW) | 0, 3);
    for (const k of [j - 1, j + 1, j + WW, j - WW]) if (k >= 0 && k < WW * WH && TP[tiles[k]].liquid && TP[tiles[k]].liquid !== TP[t].liquid) { const c = TP[tiles[k]].liquid === 2 ? k : j; setTile(c % WW, (c / WW) | 0, STONE); for (let q = 0; q < 6; q++) P((c % WW) * T + 4, ((c / WW) | 0) * T, frand(-.6, .6), frand(-1.4, -.4), 40, '#d8d4e6', { g: -.01 }); }
  };
  for (const i of list) {
    if (n > 300) { LQ.add(i); continue; } const t = tiles[i]; if (!TP[t].liquid) continue; const x = i % WW, y = (i / WW) | 0; if (y >= WH - 1) continue; n++;
    if (flowable(tiles[i + WW])) { mv(i, i + WW); continue; }
    const d = (x + G.time) & 1 ? 1 : -1; let done = false;
    for (const s of [d, -d]) { const xx = x + s; if (xx < 1 || xx > WW - 2) continue; if (flowable(tiles[i + s]) && flowable(tiles[i + s + WW])) { mv(i, i + s); done = true; break; } }
    if (done) continue;
    // walk along a floor toward the nearest drop, so thin layers still find the hole
    const drop = s => { for (let k = 1; k <= 10; k++) { const xx = x + s * k; if (xx < 1 || xx > WW - 2) return false; const j = y * WW + xx; if (!flowable(tiles[j])) return false; if (flowable(tiles[j + WW])) return true; } return false; };
    for (const s of [d, -d]) if (flowable(tiles[i + s]) && drop(s)) { mv(i, i + s); done = true; break; }
    if (done) continue;
    if (y > 0 && TP[tiles[i - WW]].liquid) for (const s of [d, -d]) { const xx = x + s; if (xx < 1 || xx > WW - 2) continue; if (flowable(tiles[i + s])) { mv(i, i + s); break; } }
  }
}

// ---------------- chunk cache: ink outline, rounded corners, rim light, moss caps ----------------
const FELT = ['#ffa07c', '#f06a55', '#c94a4e'];
function renderChunk(c) {
  const x = c.x; x.clearRect(0, 0, CH * T, CH * T);
  for (let ly = 0; ly < CH; ly++) for (let lx = 0; lx < CH; lx++) {
    const tx = c.cx * CH + lx, ty = c.cy * CH + ly; if (tx >= WW || ty >= WH) continue;
    const i = ty * WW + tx, t = tiles[i], w = walls[i], p = TP[t], px = lx * T, py = ly * T, v = (hash2(tx, ty) * 4) | 0;
    if (!p.full || p.ghost) {
      if (w) x.drawImage(WTEX[w][v], px, py);
      if (t && !p.dyn && !p.liquid && !p.ghost) { x.drawImage(TEX[t][v], px, py); const ch = CHIP.size && CHIP.get(i); if (ch) drawChips(x, ch, px, py, w, v, t); }
      if (!w && tileAt(tx, ty + 1) === GRASS) for (let k = 0; k < 8; k++) { const f = hh(tx * 8 + k, ty + 1, 5); if (f > .5) { x.fillStyle = FELT[0]; x.fillRect(px + k, py + 7, 1, 1); if (f > .86) { x.fillStyle = '#ffc2a0'; x.fillRect(px + k, py + 6, 1, 1); } } }
      continue;
    }
    const nf = (ax, ay) => { const q = tileAt(ax, ay); return !TP[q].full || TP[q].ghost; };
    const u = nf(tx, ty - 1), d = nf(tx, ty + 1), l = nf(tx - 1, ty), r = nf(tx + 1, ty), tl = u && l, tr = u && r, bl = d && l, br = d && r;
    if (w && (tl || tr || bl || br)) x.drawImage(WTEX[w][v], px, py);
    x.drawImage(TEX[t][v], px, py);
    const cut = (cx, cy, sx, sy) => { for (const [ax, ay] of [[cx, cy], [cx + sx, cy], [cx, cy + sy]]) { x.clearRect(px + ax, py + ay, 1, 1); if (w) x.drawImage(WTEX[w][v], ax, ay, 1, 1, px + ax, py + ay, 1, 1); } };
    if (tl) cut(0, 0, 1, 1); if (tr) cut(7, 0, -1, 1); if (bl) cut(0, 7, 1, -1); if (br) cut(7, 7, -1, -1);
    if (u) { x.fillStyle = p.hi; x.fillRect(px + (tl ? 2 : 1), py + 1, 8 - (tl ? 2 : 1) - (tr ? 2 : 1), 1); }
    if (d) { x.fillStyle = 'rgba(9,6,24,.38)'; x.fillRect(px + (bl ? 2 : 1), py + 6, 8 - (bl ? 2 : 1) - (br ? 2 : 1), 1); }
    if (u && p.cap === 1) {
      for (let k = 0; k < 8; k++) { const y0 = (tl && k < 2) || (tr && k > 5) ? 2 : 1, hgt = 2 + (hh(tx * 8 + k, ty, 5) > .55 ? 1 : 0) + (hh(tx * 8 + k, ty, 6) > .86 ? 2 : 0); for (let j = 0; j < hgt; j++) { x.fillStyle = FELT[j === 0 ? 0 : j < hgt - 1 ? 1 : 2]; x.fillRect(px + k, py + y0 + j, 1, 1); } }
      if (l) for (let j = 0, n = 2 + (hash2(tx, ty) * 3 | 0); j < n; j++) { x.fillStyle = FELT[j ? 2 : 1]; x.fillRect(px + 1, py + 2 + j, 1, 1); }
      if (r) for (let j = 0, n = 2 + (hash2(ty, tx) * 3 | 0); j < n; j++) { x.fillStyle = FELT[j ? 2 : 1]; x.fillRect(px + 6, py + 2 + j, 1, 1); }
    } else if (u && p.cap) {
      const c1 = p.capC ? p.capC[0] : p.cap === 2 ? '#ffffff' : p.cap === 3 ? '#f0b070' : '#d6d0dc', c2 = p.capC ? p.capC[1] : p.cap === 2 ? '#dcf7f5' : p.cap === 3 ? '#e58a52' : '#b8b2c0';
      for (let k = tl ? 2 : 1; k < (tr ? 6 : 7); k++) { x.fillStyle = p.cap === 3 && (k + tx) % 3 === 0 ? c2 : c1; x.fillRect(px + k, py + 1, 1, 1); if (hh(tx * 8 + k, ty, 8) > .55) { x.fillStyle = c2; x.fillRect(px + k, py + 2, 1, 1); } }
    }
    x.fillStyle = INK;
    if (u) x.fillRect(px + (tl ? 2 : 0), py, 8 - (tl ? 2 : 0) - (tr ? 2 : 0), 1);
    if (d) x.fillRect(px + (bl ? 2 : 0), py + 7, 8 - (bl ? 2 : 0) - (br ? 2 : 0), 1);
    if (l) x.fillRect(px, py + (tl ? 2 : 0), 1, 8 - (tl ? 2 : 0) - (bl ? 2 : 0));
    if (r) x.fillRect(px + 7, py + (tr ? 2 : 0), 1, 8 - (tr ? 2 : 0) - (br ? 2 : 0));
    if (tl) x.fillRect(px + 1, py + 1, 1, 1); if (tr) x.fillRect(px + 6, py + 1, 1, 1); if (bl) x.fillRect(px + 1, py + 6, 1, 1); if (br) x.fillRect(px + 6, py + 6, 1, 1);
    const ch = CHIP.size && CHIP.get(i); if (ch) drawChips(x, ch, px, py, w, v, t);
  }
  c.dirty = false;
}
function getChunk(cx, cy) {
  const k = cy * 8192 + cx; let c = chunks.get(k);
  if (!c) { const [cv, x] = mk(CH * T, CH * T); c = { cv, x, dirty: true, cx, cy }; chunks.set(k, c); }
  if (c.dirty) renderChunk(c); return c;
}
function pruneChunks(ccx, ccy) { if (chunks.size < 110) return; for (const [k, c] of chunks) if (abs(c.cx - ccx) > 7 || abs(c.cy - ccy) > 5) chunks.delete(k); }

// ---------------- lighting ----------------
let LW = 0, LH = 0, lr, lg, lb, ld, limg, lmc, lmx, LX0 = 0, LY0 = 0;
const dynLights = [];
function addLight(x, y, r, g, b) { dynLights.push(x, y, r, g, b); }
function computeLight(x0, y0, w, h, sun) {
  LX0 = x0; LY0 = y0;
  if (w !== LW || h !== LH) { LW = w; LH = h; lr = new Float32Array(w * h); lg = new Float32Array(w * h); lb = new Float32Array(w * h); ld = new Float32Array(w * h);[lmc, lmx] = mk(w, h); limg = lmx.createImageData(w, h); }
  const s0 = sun[0], s1 = sun[1], s2 = sun[2];
  for (let y = 0; y < h; y++) {
    const ty = y0 + y;
    for (let x = 0; x < w; x++) {
      const tx = x0 + x, i = y * w + x; let r = 0, g = 0, b = 0, d = .875;
      if (ty < 0) { r = s0; g = s1; b = s2; }
      else if (tx >= 0 && tx < WW && ty < WH) {
        const k = ty * WW + tx, p = TP[tiles[k]];
        if (p.full) d = .72; else { if (p.liquid === 1) d = .8; if ((!walls[k] || WSKY[walls[k]]) && ty < SKYL[tx]) { r = s0; g = s1; b = s2; } else if (ty >= DEEP_Y) { r = .17; g = .07; b = .06; } }
        if (p.light) { const L = p.light; if (L[0] > r) r = L[0]; if (L[1] > g) g = L[1]; if (L[2] > b) b = L[2]; }
      } else d = .5;
      lr[i] = r; lg[i] = g; lb[i] = b; ld[i] = d;
    }
  }
  for (let k = 0; k < dynLights.length; k += 5) {
    const x = floor(dynLights[k] / T) - x0, y = floor(dynLights[k + 1] / T) - y0;
    if (x >= 0 && x < w && y >= 0 && y < h) { const i = y * w + x; lr[i] = max(lr[i], dynLights[k + 2]); lg[i] = max(lg[i], dynLights[k + 3]); lb[i] = max(lb[i], dynLights[k + 4]); }
  }
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < h; y++) {
      const o = y * w;
      for (let x = 1; x < w; x++) { const j = o + x, d = ld[j]; let v = lr[j - 1] * d; if (v > lr[j]) lr[j] = v; v = lg[j - 1] * d; if (v > lg[j]) lg[j] = v; v = lb[j - 1] * d; if (v > lb[j]) lb[j] = v; }
      for (let x = w - 2; x >= 0; x--) { const j = o + x, d = ld[j]; let v = lr[j + 1] * d; if (v > lr[j]) lr[j] = v; v = lg[j + 1] * d; if (v > lg[j]) lg[j] = v; v = lb[j + 1] * d; if (v > lb[j]) lb[j] = v; }
    }
    for (let x = 0; x < w; x++) {
      for (let y = 1; y < h; y++) { const j = y * w + x, d = ld[j]; let v = lr[j - w] * d; if (v > lr[j]) lr[j] = v; v = lg[j - w] * d; if (v > lg[j]) lg[j] = v; v = lb[j - w] * d; if (v > lb[j]) lb[j] = v; }
      for (let y = h - 2; y >= 0; y--) { const j = y * w + x, d = ld[j]; let v = lr[j + w] * d; if (v > lr[j]) lr[j] = v; v = lg[j + w] * d; if (v > lg[j]) lg[j] = v; v = lb[j + w] * d; if (v > lb[j]) lb[j] = v; }
    }
  }
  const D = limg.data;
  for (let i = 0, n = w * h; i < n; i++) { const k = i * 4; D[k] = min(255, 6 + lr[i] * 262); D[k + 1] = min(255, 6 + lg[i] * 262); D[k + 2] = min(255, 10 + lb[i] * 262); D[k + 3] = 255; }
  lmx.putImageData(limg, 0, 0);
}
function lightSample(wx, wy, out) {
  const fx = wx / T - .5 - LX0, fy = wy / T - .5 - LY0, x = floor(fx), y = floor(fy);
  if (!lr || x < 0 || y < 0 || x >= LW - 1 || y >= LH - 1) { out[0] = out[1] = out[2] = 1; return; }
  const u = fx - x, v = fy - y, i = y * LW + x, a = (1 - u) * (1 - v), b = u * (1 - v), c = (1 - u) * v, d = u * v;
  out[0] = min(1, .024 + 1.027 * (lr[i] * a + lr[i + 1] * b + lr[i + LW] * c + lr[i + LW + 1] * d));
  out[1] = min(1, .024 + 1.027 * (lg[i] * a + lg[i + 1] * b + lg[i + LW] * c + lg[i + LW + 1] * d));
  out[2] = min(1, .04 + 1.027 * (lb[i] * a + lb[i + 1] * b + lb[i + LW] * c + lb[i + LW + 1] * d));
}
