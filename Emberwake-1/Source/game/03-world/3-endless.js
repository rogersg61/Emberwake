// ============================================================
//  The endless world.
//  The land is not made all at once any more. It is a pure function of
//  the seed: any column, anywhere, can be worked out on its own, so the
//  world is made a chunk (64 columns) at a time, only where you are and
//  a range around you, and it comes out the same every time.
//  Climate drifts slowly along the land, so lands are wide and run into
//  each other (moor greens into fen, fen into thorn, the cold climbs into
//  the Reach); hills, caves, ore and water are all smooth noise, so they
//  carry on across chunk edges and connect.
//  A chunk goes through three steps: terrain (its own columns only),
//  finish (things anchored in it that reach a little way into its
//  neighbours: structures, islands, set pieces, pools), and ready (its
//  neighbours are finished too, so nothing else will write into it: your
//  saved changes go back in, and it can be shown and walked on).
// ============================================================
const EW = 65536, EH = 360, CW = 64, NCH = EW / CW, X0 = EW / 2;
const GEN_RANGE = [4, 7, 12], GEN_RANGE_N = ['Near', 'Normal', 'Far'], GEN_RANGE_D = ['the world forms 256 paces around you', 'the world forms 448 paces around you', 'the world forms 768 paces around you: heavier'];
const BNAMES = ['', 'moor', 'thorn', 'reach', 'fen', 'dunes', 'scoria', 'ash'], BIDX = { moor: 1, thorn: 2, reach: 3, fen: 4, dunes: 5, scoria: 6, ash: 7 };
let CST = null, SURF = null, BIO = null, UD0 = 0, UD1 = 0, FORCE = [], FLATS = [], WINDOWS = [], BLADE_X = 0, SPIRE_X = 0;
const LAKES = new Map(), PEND = { mods: new Map(), walls: new Map(), stn: new Map() };
let GENQ = 0;

// ---------------- climate: where the lands are ----------------
// how a world's land is shaped: 1 for worlds made before the lands grew, 2 for new ones
const GENS = { 1: { cl: 1, wide: 1, tall: 1, blend: 60 }, 2: { cl: .5, wide: .7, tall: 1.25, blend: 110 } };
const GEN = () => GENS[WORLD.gen] || GENS[1];
function climate(x) {
  const k = GEN().cl;
  let t = clamp((fbm(x * .00055 * k, 17.3, 3) - .5) * 2.7 + .5, 0, 1), h = clamp((fbm(x * .0008 * k, 53.1, 3) - .5) * 2.7 + .5, 0, 1);
  for (const f of FORCE) { const w = smooth((f.r + 70 - abs(x - f.x)) / 70); if (w > 0) { t = lerp(t, f.t, w); h = lerp(h, f.h, w); } }
  return [t, h];
}
const bioOf = (t, h) => t < .34 ? 'reach' : t > .66 ? (h < .45 ? 'dunes' : h > .7 ? 'ash' : 'scoria') : h > .63 ? 'fen' : h < .37 ? 'thorn' : 'moor';
function bweights(t, h) {
  const cold = smooth((.38 - t) / .08), hot = smooth((t - .62) / .08), temp = max(0, 1 - cold - hot);
  const wet = smooth((h - .59) / .08), dry = smooth((.41 - h) / .08), mid = max(0, 1 - wet - dry);
  const hw = smooth((h - .66) / .08), hd = smooth((.49 - h) / .08), hm = max(0, 1 - hw - hd);
  return { reach: cold, moor: temp * mid, fen: temp * wet, thorn: temp * dry, dunes: hot * hd, scoria: hot * hm, ash: hot * hw };
}
function biomeE(x) {
  if (DIM) return dimBio(x);
  if (x >= 0 && x < EW && BIO && BIO[x]) return BNAMES[BIO[x]];
  const [t, h] = climate(x), b = bioOf(t, h); if (BIO && x >= 0 && x < EW) BIO[x] = BIDX[b]; return b;
}

// ---------------- the shape of the land ----------------
const LFN = {
  moor: x => (fbm(x * .0075, 21.3, 3) - .5) * 46 - max(0, fbm(x * .028, 4.1, 2) - .58) * 60,
  thorn: x => -4 + (fbm(x * .011, 71.3, 3) - .5) * 48 + (fbm(x * .05, 7.7, 2) - .5) * 6,
  reach: x => { const r = 1 - abs(fbm(x * .0058, 2.9, 3) * 2 - 1); return -14 - r * r * 72 - (fbm(x * .03, 2.9, 2) - .5) * 8; },
  scoria: x => { const n = (fbm(x * .0062, 31.1, 3) - .24) * 3.8, st = floor(n * 3) / 3, fr = n * 3 - floor(n * 3), lv = st + smooth((fr - .78) * 5) / 3; return 14 - max(0, lv) * 36 + (fbm(x * .06, 5.5, 2) - .5) * 2; },
  fen: x => 12 + (fbm(x * .012, 61.7, 2) - .5) * 9 + (fbm(x * .05, 3.1, 2) - .5) * 3,
  dunes: x => 4 - abs(sin(x * .045 + fbm(x * .01, 81.1, 2) * 6)) * 12 + (fbm(x * .004, 83.3, 2) - .5) * 18,
  ash: x => (fbm(x * .0075, 21.3, 3) - .5) * 30
};
// the lands' shapes blend over a long stretch, so one land rises out of the next instead of stepping up a cliff
const HW = { moor: 0, thorn: 0, reach: 0, fen: 0, dunes: 0, scoria: 0, ash: 0 };
function Hraw(x) {
  for (const b in HW) HW[b] = 0;
  const g = GEN(), bl = g.blend;
  for (const o of [-2 * bl, -bl, 0, bl, 2 * bl]) { const [t, h] = climate(x + o), w = bweights(t, h); for (const b in w) HW[b] += w[b] * (o ? .18 : .28); }
  let s = 0, ws = 0; const w = HW;
  for (const b in w) if (w[b] > .002) { s += w[b] * LFN[b](x * g.wide) * g.tall; ws += w[b]; }
  let y = BASE_Y + (fbm(x * .0013 * g.wide, 3.3, 3) - .5) * 50 * g.tall + (ws ? s / ws : 0);
  const dx = abs(x - SHRINE_X), wa = smooth((CRATER_R + 34 - dx) / 34);
  if (wa > 0) { const tt = dx / CRATER_R, rim = exp(-pow((tt - 1) / .5, 2)) * 17, bowl = tt < 1 ? (1 - tt * tt) * 15 : 0; y = lerp(y, BASE_Y + 2 + bowl - rim, wa); }
  return y;
}
function Hflat(x) { let y = Hraw(x); for (const f of FLATS) { const k = smooth(1 - (abs(x - f.x) - f.r) / f.k); if (k > 0) y = lerp(y, f.h, k); } return y; }
// lakes: a bowl pressed into low country, full to its lower rim
function lakeOf(k) {
  let L = LAKES.get(k); if (L !== undefined) return L; L = null;
  if (hh(k, 501, SEED) < .5) {
    const c = k * 360 + 70 + floor(hh(k, 502, SEED) * 220), a = 13 + floor(hh(k, 503, SEED) * 14), D = 5 + floor(hh(k, 504, SEED) * 5), b = biomeE(c);
    if ((b === 'moor' || b === 'fen' || b === 'thorn' || b === 'reach') && !WINDOWS.some(w => c + a + 20 > w[0] && c - a - 20 < w[1])) {
      const l = round(Hflat(c - a)), r = round(Hflat(c + a)), lv = max(l, r);   // full to the lower rim, never above it
      if (abs(l - r) < 8) L = { c, a, D, L: lv, ice: b === 'reach' };
    }
  }
  LAKES.set(k, L); return L;
}
function lakeAt(x) { if (DIM) return null; const k = floor(x / 360); for (const q of [k, k - 1, k + 1]) { const L = lakeOf(q); if (L && abs(x - L.c) < L.a) return L; } return null; }
function surf(x) {
  if (DIM) return dimSurf(x);
  if (x < 0 || x >= EW) return BASE_Y;
  let s = SURF[x]; if (s !== -32768) return s;
  let y = (Hflat(x - 2) + 2 * Hflat(x - 1) + 3 * Hflat(x) + 2 * Hflat(x + 1) + Hflat(x + 2)) / 9; const L = lakeAt(x); if (L) { const u = (x - L.c) / L.a; y = max(y, L.L + L.D * (1 - u * u)); }
  s = SURF[x] = clamp(round(y), 30, DEEP_Y - 90); return s;
}
// the Deep road runs the whole length of the world
const roadE = x => clamp(round(DEEP_Y + 30 + (fbm(x * .008, 7.7, 3) - .5) * 34), DEEP_Y + 14, WH - 16);
function inWindow(x, pad = 0) { for (const w of WINDOWS) if (x >= w[0] - pad && x <= w[1] + pad) return w; return null; }
function protectDepth(x) { const w = inWindow(x, 4); return w ? w[2] : 0; }
const mouthAt = x => { const k = floor(x / 90), c = k * 90 + 20 + floor(hh(k, 701, SEED) * 50); return hh(k, 702, SEED) < .35 && abs(x - c) < 5 && !inWindow(x, 30); };
const shaftX = (k, y) => k * 200 + 40 + floor(hh(k, 602, SEED) * 120) + round((fbm(y * .08, k * 9.1, 2) - .5) * 6);
// procedural structures: one cell per 150 columns, maybe a hut, a camp, a tower...
const SKINDS = { moor: ['hut', 'camp', 'circle', 'tower', 'well', 'graves'], thorn: ['camp', 'hut', 'tower', 'circle'], reach: ['camp', 'circle', 'tower'], fen: ['stilt', 'stilt', 'hut'], dunes: ['dune', 'dune', 'well', 'graves'], scoria: ['tower', 'dune', 'graves', 'camp'], ash: ['graves', 'camp', 'circle'] };
function structOf(k) { return pmemo('s' + k, () => structOf0(k)); }
function structOf0(k) {
  const x = k * 150 + 30 + floor(hh(k, 802, SEED) * 90), nu = newLand(x - 16) && newLand(x + 16);
  if (hh(k, 801, SEED) > (nu ? .74 : .55)) return null;
  if (inWindow(x, 26) || lakeAt(x) || lakeAt(x + 6) || lakeAt(x - 6)) return null;
  if (nu && bigNear(x, 18)) return null;
  // only on fairly level ground, so a building never stands in a pit or against a bank
  { const h0 = surf(x + 3); for (const o of [-14, -10, -6, -2, 2, 6, 10, 14, 18]) if (abs(surf(x + o) - h0) > 4) return null; }
  const kinds = (nu ? SKINDS2 : SKINDS)[biomeE(x)]; if (!kinds) return null; return { x, kind: kinds[floor(hh(k, 803, SEED) * kinds.length)] };
}
const reservedAt = x => { if (inWindow(x, 6)) return true; const k = floor(x / 150); for (const q of [k, k - 1, k + 1]) { const s = structOf(q); if (s && x > s.x - 13 && x < s.x + 16) return true; } return placeReserved(x); };

// ---------------- the world for a new seed ----------------
function initEndless() {
  DIM = 0; GISLE.clear(); rng = mulberry32(SEED); WORLD.arena = false; WORLD.endless = 1; resetWorld(EW, EH);
  CST = new Uint8Array(NCH); CPROG = new Uint8Array(NCH); SURF = new Int16Array(EW).fill(-32768); BIO = new Uint8Array(EW); LAKES.clear(); PEND.mods.clear(); PEND.walls.clear(); PEND.stn.clear();
  BASE_Y = 132; DEEP_Y = WH - 76; DRIFT_Y = BASE_Y - 40; UD0 = BASE_Y + 64; UD1 = DEEP_Y - 18; CRATER_R = 44; VIL_W = 46; LOOT.clear();
  roadY = roadE;
  // the story's places sit at fixed distances from the village; which side each is on depends on the seed
  const s = hh(1, 2, SEED) < .5 ? 1 : -1;
  SPAWN_X = X0; SHRINE_X = X0 + s * 420; SHRINE2_X = X0 - s * 540; MINE_X = X0 + s * 880; FORGE_X = X0 + s * 1040; GATE_X = X0 + s * 1200; SKY_X = X0 - s * 270; BLADE_X = X0 + s * 228; SPIRE_X = X0 - s * 170;
  FORCE = [{ x: X0, r: 160, t: .5, h: .5 }, { x: SKY_X, r: 80, t: .5, h: .47 }, { x: SHRINE_X, r: CRATER_R + 50, t: .78, h: .9 }, { x: SHRINE2_X, r: 190, t: .12, h: .5 }, { x: MINE_X, r: 160, t: .82, h: .56 }, { x: GATE_X, r: 120, t: .82, h: .56 }, { x: FORGE_X, r: 60, t: .82, h: .56 }];
  FLATS = []; const fl = (x, r, k) => { let sum = 0, n = 0; for (let q = x - r; q <= x + r; q += 2) { sum += Hraw(q); n++; } FLATS.push({ x, r, k, h: round(sum / n) }); };
  fl(SPAWN_X, VIL_W + 2, 18); fl(SHRINE2_X, 27, 8); fl(GATE_X, 12, 10); fl(SHRINE_X, 27, 8); fl(MINE_X, 7, 6); fl(BLADE_X + 3, 6, 6); fl(SPIRE_X + 3, 6, 6);
  // [x0, x1, protect depth]: no caves, lakes, trees or wandering structures here
  WINDOWS = [[X0 - VIL_W - 20, X0 + VIL_W + 20, 34], [SHRINE_X - 32, SHRINE_X + 32, 20], [SHRINE2_X - 32, SHRINE2_X + 32, 20], [GATE_X - 14, GATE_X + 22, 20], [MINE_X - 10, MINE_X + 11, 12], [BLADE_X - 5, BLADE_X + 11, 12], [SPIRE_X - 5, SPIRE_X + 11, 12], [SKY_X - 32, SKY_X + 32, 0]];
  VIL_Y = FLATS[0].h; SHRINE2_Y = FLATS[1].h; GATE_Y = FLATS[2].h; SHRINE_Y = FLATS[3].h; MINE_Y = FLATS[4].h; FORGE_Y = WH - 12;
  { let lo = 1e9; for (let x = SKY_X - 40; x <= SKY_X + 40; x += 4) lo = min(lo, Hraw(x)); SKY_Y = clamp(round(min(DRIFT_Y - 22, lo - 50)), 14, DRIFT_Y - 10); }
  REACH_X = SHRINE2_X; RUST_X = MINE_X; SEGS = [];
  // where the relics will be, so the journal can point the way before that land has formed (made exact when it forms)
  Object.assign(SPOTS, { flask: { x: FORGE_X - 29, y: FORGE_Y - 3 }, keeper: { x: FORGE_X + 8, y: FORGE_Y }, blade: { x: BLADE_X + 2, y: FLATS[5].h - 20 }, spire: { x: SPIRE_X + 3, y: FLATS[6].h - 20 }, hook: { x: SKY_X, y: SKY_Y - 1 } });
  MODS_ON = true;
}
function genWorld() { initEndless(); streamTo(SPAWN_X * T, true); }

// ---------------- step one: terrain ----------------
let CPROG = null;
function terrainChunk(cx, tEnd) {
  if (CST[cx] >= 1) return true; const x0 = cx * CW, was = MODS_ON; MODS_ON = false;
  while (CPROG[cx] < CW) { (DIM ? dimColumn : terrainColumn)(x0 + CPROG[cx]++); if (tEnd && performance.now() > tEnd) break; }
  MODS_ON = was; if (CPROG[cx] >= CW) { CST[cx] = 1; return true; } return false;
}
function terrainColumn(x) {
  const hs = surf(x), b = biomeE(x), slope = abs(surf(x + 2) - surf(x - 2)), high = hs < BASE_Y - 30, dd = 4 + floor(fbm(x * .07, 50, 2) * 6), prot = protectDepth(x), L = lakeAt(x);
  const vil = abs(x - SPAWN_X) < VIL_W + 20, mouth = !L && mouthAt(x), shape = WORLD.shape;
  heights[x] = hs; SKYL[x] = hs + 3;
  const sk = floor(x / 200), shafts = [sk - 1, sk, sk + 1].filter(k => hh(k, 601, SEED) < .5 && !inWindow(k * 200 + 100, 60));
  for (let y = 0; y < WH; y++) {
    const i = y * WW + x; let t = AIR, w = 0; const d = y - hs;
    if (y >= WH - 3) t = BEDROCK;
    else if (d < 0) { if (L && y >= L.L) t = L.ice && y === L.L ? SNOW : WATER; }
    else {
      const deep = d >= dd + 12, band = ((y + fbm(x * .025, y * .025 + 7, 2) * 26) % 21 + 21) % 21, clay = d >= dd && band < (deep ? 2.2 : 3), strata = (((y + fbm(x * .03, 9, 2) * 5) % 6) + 6) % 6 < 2.4;
      const dl = y >= DEEP_Y + (fbm(x * .04, 3.3, 2) - .5) * 12;
      if (d > 2) w = dl ? W_DEEP : clay ? W_SAND : (b === 'ash' && d < dd) ? W_ASH : deep ? W_STONE : W_DIRT;
      if (dl) t = abs(fbm(x * .05, y * .05 + 40, 3) - .5) < .018 ? DEEPGLOW : DEEPSTONE;
      else if (d < dd) t = b === 'reach' ? ((high || d < 2) ? (slope > 7 && d < 3 ? STONE : SNOW) : (slope > 8 && d < 3 ? STONE : DIRT)) : b === 'scoria' ? (d < 2 ? SAND : strata ? SANDSTONE : SAND) : b === 'ash' ? ASH
        : b === 'fen' ? (d < 2 ? MUD : d < 5 ? PEAT : fbm(x * .08, y * .08 + 5, 2) > .55 ? CLAY : DIRT) : b === 'dunes' ? (d < 1 && fbm(x * .05, 9.9, 2) > .62 ? SALT : SAND)
        : b === 'thorn' ? (fbm(x * .09, y * .09 + 3, 2) > .66 ? GRAVEL : slope > 9 && d < 3 ? STONE : DIRT) : (slope > 9 && d < 3 ? STONE : DIRT);
      else if ((b === 'scoria' || b === 'dunes') && d < dd + 20) t = strata ? SANDSTONE : SAND;
      else if (b === 'fen' && d < dd + 10 && fbm(x * .06, y * .06 + 11, 2) > .5) t = CLAY;
      else t = clay ? SANDSTONE : !deep ? DIRT : fbm(x * .06, y * .06 + 20, 2) > .7 ? DIRT : STONE;
      if (L && d < 1 && t !== WATER) t = b === 'fen' ? MUD : CLAY;
      // caves, which wind and join: two families of tunnels along the zero lines of smooth noise, caverns, the Underdark and the Deep
      let cave = 0;
      if (d >= 1 && d >= prot) {
        if (y >= DEEP_Y - 6) {
          const ry = roadE(x), rh = 3 + fbm(x * .05, 2.2, 2) * 5;
          if (y > ry - rh * 2 && y <= ry) cave = 1; else { const v = fbm(x * .02, y * .046 + 300, 3); if (v > .57 + max(0, DEEP_Y + 6 - y) * .025) cave = v > .6 && y > DEEP_Y + 4 ? 2 : 1; }
        } else if (!(L && d < L.D + 8) && (d >= 7 || mouth) && !(vil && d < 34)) {
          const ud = y > UD0 && y < UD1, wid = .019 + min(.012, d * .00018) + (ud ? .01 : 0) + (shape === 2 ? .008 : 0);
          if (abs(fbm(x * .021, y * .032 + 100, 2) - .5) < wid || abs(fbm(x * .016 + 50, y * .027 + 300, 2) - .5) < wid * .8) cave = 1;
          else if (d > 14) { const cv = fbm(x * .0105, y * .019 + 700, 3); if (cv > (ud ? .6 : .68) - (shape === 2 ? .04 : 0)) cave = cv > (ud ? .64 : .72) ? 2 : 1; }
          if (!cave && d > 25 && y < roadE(x)) for (const k of shafts) if (abs(x - shaftX(k, y)) <= 1) { cave = 1; break; }
        }
      }
      if (cave) { t = AIR; if (cave === 2) w = 0; }
      else if (t === STONE || t === DIRT || t === SANDSTONE || t === DEEPSTONE) t = oreAt(x, y, d, b, t);
    }
    tiles[i] = t; walls[i] = w;
  }
  // the surface: grass, plants, a tree now and then, and something to climb where the ground steps up hard
  for (let y = max(3, hs - 2); y < min(WH - 4, hs + 3); y++) { const i = y * WW + x; if (tiles[i] === DIRT && !TP[tiles[i - WW]].full && !TP[tiles[i - WW]].liquid && !walls[i - WW]) tiles[i] = GRASS; }
  decorColumn(x, hs, b, L);
  if (!vil && !L && !reservedAt(x)) treeColumn(x, hs, b);
  for (const [nx, side] of [[x - 1, -1], [x + 1, 1]]) {
    const hn = surf(nx); if (hs - hn < 5 || lakeAt(nx) || inWindow(x, 2)) continue;
    const aid = b === 'reach' ? GLASSROOT : b === 'scoria' || b === 'dunes' || b === 'ash' ? RUSTCHAIN : CREEPER;
    for (let y = hn; y < hs; y++) { const i = y * WW + x; if (!tiles[i] || (TP[tiles[i]].decor && !TP[tiles[i]].dyn)) tiles[i] = aid; }
  }
}
// ore sits in blobs at the depths it belongs to; each land has its own underneath
function oreAt(x, y, d, b, t) {
  const n = (sx, sy, s) => fbm(x * s + sx, y * s + sy, 2);
  if (y >= DEEP_Y - 10) { if (n(6.6, 8.8, .08) > .815) return EMBER; return t; }
  if (d > 4 && d < 80 && n(1.1, 7.7, .09) > .785) return COPPER;
  if (d > 6 && d < 90 && n(9.1, 3.3, .09) > .795) return TIN;
  if (d > 10 && d < 140 && n(2.2, 5.5, .07) > .77) return COAL;
  if (d > 30 && d < 180 && n(4.4, 1.1, .085) > .79) return IRON;
  if (d > 70 && n(6.6, 8.8, .08) > .8) return EMBER;
  if (d > 3 && d < 50 && n(12.3, 4.5, .07) > .78) return GRAVEL;
  if (d > 2 && d < 26 && n(8.8, 2.1, .06) > .77) return CLAY;
  if (d > 8) {
    const p = n(3.7, 9.2, .1);
    if (p > .8) { if (b === 'reach' && d > 20) return GEODE; if (b === 'moor') return COAL; if (b === 'ash' || b === 'scoria') return d > 24 && hh(x, y, 31) < .3 ? EMBER : COAL; if (b === 'fen') return d < 40 ? PEAT : CLAY; if (b === 'thorn') return GRAVEL; if (b === 'dunes') return SALT; }
  }
  return t;
}
function decorColumn(x, hs, b, L) {
  for (let y = 4; y < WH - 4; y++) {
    const i = y * WW + x; if (tiles[i] !== AIR) continue; const below = tiles[i + WW], above = tiles[i - WW], r = hh(x, y, SEED + 77);
    if (y >= DEEP_Y - 2) { if ((below === DEEPSTONE || below === DEEPGLOW) && r < .05) tiles[i] = FUNGUS; else if (TP[above].full && r > .985) { for (let j = 0, n = 1 + floor(hh(x, y, 79) * 4); j < n && tiles[i + j * WW] === AIR; j++) tiles[i + j * WW] = VINE; } continue; }
    if (!walls[i]) {
      if (y < hs - 1 || below === WATER || L || inWindow(x, 3)) continue;
      if (below === MUD || below === PEAT) { if (r < .5) tiles[i] = REED; else if (r < .54) tiles[i] = BERRY; continue; }
      if (below === GRASS) { if (r < (b === 'thorn' ? .09 : .035)) tiles[i] = BERRY; else if (r < .1) tiles[i] = STICKS; else if (r < .14) tiles[i] = PEBBLE; else if (r < .52) tiles[i] = TALLGRASS; else if (r < .6) tiles[i] = FLOWER; continue; }
      if ((below === SAND || below === SALT) && b === 'dunes') { if (r < .04) tiles[i] = BONES; else if (r < .07) tiles[i] = PEBBLE; else if (r < .1) tiles[i] = DEADBUSH; continue; }
      if ((below === STONE || below === GRAVEL || below === SANDSTONE || below === DIRT) && r < .07) { tiles[i] = r < .045 ? PEBBLE : STICKS; continue; }
      if (below === ASH && r < .03) tiles[i] = BONES; else if (below === SNOW && r < .12) tiles[i] = CRYSTAL; else if ((below === SAND || below === ASH) && r < .07) tiles[i] = DEADBUSH;
      continue;
    }
    if (TP[below].full && !TP[below].ghost) { if (r < .024) tiles[i] = GLOWCAP; else if (r < .036) tiles[i] = POT; else if (r < (b === 'reach' ? .09 : .05)) tiles[i] = CRYSTAL; }
    else if (TP[above].full && !TP[above].ghost && r < .06) { for (let j = 0, n = 1 + floor(hh(x, y, 78) * 5); j < n && tiles[i + j * WW] === AIR; j++) tiles[i + j * WW] = VINE; }
  }
}
function treeColumn(x, hs, b) {
  const k = floor(x / 5); if (x !== k * 5 + floor(hh(k, 77, SEED) * 5)) return;
  const ch = b === 'moor' ? .55 : b === 'thorn' ? .7 : b === 'reach' ? .35 : b === 'ash' ? .18 : b === 'fen' ? .14 : b === 'dunes' ? 0 : .1;
  if (hh(k, 78, SEED) > ch || abs(surf(x - 1) - hs) > 1 || abs(surf(x + 1) - hs) > 1) return;
  const tp = tiles[hs * WW + x]; if (!TP[tp].solid || TP[tp].ghost) return;
  const kind = b === 'thorn' ? 3 : b === 'moor' || b === 'fen' ? 0 : b === 'reach' ? 1 : 2, r = hh(k, 79, SEED), th = kind === 0 ? 6 + floor(r * 9) : kind === 1 ? 5 + floor(r * 6) : kind === 3 ? 5 + floor(r * 5) : 4 + floor(r * 5);
  for (let y = 1; y <= th + 4; y++) { const t = tiles[(hs - y) * WW + x]; if (t !== AIR && !(TP[t].decor && !TP[t].dyn)) return; }
  for (let y = 1; y <= th; y++) tiles[(hs - y) * WW + x] = [TRUNK, TRUNK2, TRUNK3, TRUNK4][kind];
  treeTops.set(x, { y: hs - th, kind, v: floor(hh(k, 80, SEED) * 3), ph: hh(k, 81, SEED) * TAU });
}

// ---------------- step two: what is anchored in a chunk ----------------
function finishChunk(cx) {
  if (CST[cx] >= 2) return;
  for (let k = cx - 1; k <= cx + 1; k++) if (k >= 0 && k < NCH) terrainChunk(k);
  const x0 = cx * CW, x1 = x0 + CW, was = MODS_ON, np = PROPS.length, nf = FGP.length; MODS_ON = false;
  rng = mulberry32((hh(cx, 991, SEED) * 4294967296) | 0);
  const here = x => x >= x0 && x < x1;
  if (DIM) { dimFinish(cx, x0, x1, here); for (let q = np; q < PROPS.length; q++) bucketAdd(PROPB, PROPS[q]); for (let q = nf; q < FGP.length; q++) bucketAdd(FGPB, FGP[q]); CST[cx] = 2; MODS_ON = was; return; }
  // the story's places
  if (here(SPAWN_X)) buildVillage();
  if (here(SHRINE_X)) setPiece('shrine'); if (here(SHRINE2_X)) setPiece('court'); if (here(GATE_X)) setPiece('gate');
  if (here(MINE_X)) buildMine(); if (here(FORGE_X)) buildForge(); if (here(SKY_X)) buildAltarIsland();
  if (here(BLADE_X)) { const keep = SPOTS.towerTop; SPOTS.towerTop = null; STRUCT_B.tower(BLADE_X); const at = SPOTS.towerTop || { x: BLADE_X + 2, y: groundAt(BLADE_X + 2) - 1 }; SPOTS.towerTop = keep || SPOTS.towerTop; dyn(at.x, at.y, PEDESTAL); SPOTS.blade = { x: at.x, y: at.y }; mark('relic', 'THE OLD WATCH', 'something glints at the top', BLADE_X + 3, at.y, 10); }
  if (here(SPIRE_X)) { const tx = SPIRE_X, gy = flatten(tx - 2, tx + 8, STONE); tower(tx, gy, 7, 19, { ruin: true, name: 'spire' }); dyn(tx + 3, gy - 1, POT); dyn(tx + 2, gy - 9, POT); tiles[(gy - 1) * WW + tx + 5] = POT; mark('spire', 'THE BROKEN SPIRE', 'an old watch over the moor', tx + 3, gy - 6, 14); SPOTS.spire = { x: tx + 3, y: gy - 20 }; }
  // wandering structures
  for (let k = floor(x0 / 150) - 1; k <= floor(x1 / 150) + 1; k++) { const s = structOf(k); if (s && here(s.x)) { const fn = STRUCT_B[s.kind]; if (fn && fn(s.x)) reserve(s.x - 9, s.x + 12, 1); } }
  // hamlets, forts, castles, pyramids, temples, the Sunken Halls, camps and nests (only in land you had not seen before they existed)
  placesFinish(cx, x0, x1, here);
  // under the ground: old mine tunnels, geodes, buried vaults
  for (let k = floor(x0 / 260); k <= floor(x1 / 260); k++) { const x = k * 260 + 40 + floor(hh(k, 1011, SEED) * 180); if (here(x) && hh(k, 1001, SEED) < .45 && !inWindow(x, 40)) mineTunnel(x, heights[x] + 22 + floor(hh(k, 1012, SEED) * 48)); }
  for (let k = floor(x0 / 300); k <= floor(x1 / 300); k++) { const x = k * 300 + 40 + floor(hh(k, 1021, SEED) * 220), y = heights[x] + 40 + floor(hh(k, 1022, SEED) * (DEEP_Y - 60 - heights[x])); if (here(x) && hh(k, 1002, SEED) < .4 && !inWindow(x, 30) && y < DEEP_Y - 16) geode(x, y, 6 + floor(hh(k, 1023, SEED) * 4)); }
  for (let k = floor(x0 / 400); k <= floor(x1 / 400); k++) { const x = k * 400 + 30 + floor(hh(k, 1031, SEED) * 330), y = heights[x] + 22 + floor(hh(k, 1032, SEED) * 58); if (here(x) && hh(k, 1003, SEED) < .4 && !inWindow(x, 30) && y < DEEP_Y - 12) vaultAt(x, y); }
  // islands on the wind, and vents beneath every other one
  for (let k = floor(x0 / 80) - 1; k <= floor(x1 / 80) + 1; k++) {
    const sh = WORLD.shape, icx = k * 80 + 15 + floor(hh(k, 902, SEED) * 50); if (!here(icx) || hh(k, 901, SEED) > (sh === 1 ? .72 : sh === 2 ? .2 : .42)) continue;
    const a = 5 + floor(hh(k, 904, SEED) * (sh === 1 ? 11 : 7)), icy = 14 + floor(hh(k, 903, SEED) * (DRIFT_Y - 32)); if (abs(icx - SKY_X) < 60 + a || abs(icx - SPAWN_X) < VIL_W + a || min(surf(icx - a), surf(icx), surf(icx + a)) - icy < 46) continue;
    const made = island(icx, icy, a, 4 + floor(hh(k, 905, SEED) * 5), false); if (made && a >= 7 && newLand(icx) && hh(k, 908, SEED) < .35) withRng(hh(icx, 1450, SEED) * 4294967296, () => skyhouse(icx));
    if (made && hh(k, 906, SEED) < .5) { const vx = icx + (hh(k, 907, SEED) < .5 ? 1 : -1) * (a + 4); if (vx > x0 - CW && vx < x1 + CW) vent(vx, icy - 7); }
  }
  // water in the Underdark, molten cinder in the Deep
  for (let k = 0; k < 3; k++) { const x = randi(x0, x1 - 1), y = randi(heights[x] + 16, DEEP_Y - 10); if (tileAt(x, y) === AIR && walls[y * WW + x] !== W_BRICK) poolAt(x, y, WATER, 22, 4); }
  for (let k = 0; k < 3; k++) { const x = randi(x0, x1 - 1), y = randi(DEEP_Y + 4, WH - 8); if (abs(x - FORGE_X) > 50 && abs(x - MINE_X) > 8 && tileAt(x, y) === AIR) poolAt(x, y, CINDER, 26, 5); }
  // things to see: foliage in front, stalactites and crystals behind
  for (let x = x0 + randi(0, 5); x < x1; x += randi(3, 8)) {
    if (RESV[x] > 1) continue; const h = heights[x], t = tileAt(x, h), b = biomeE(x); if (!TP[t].solid || TP[t].ghost || tileAt(x, h - 1) === WATER || tileAt(x, h - 1) !== AIR && !TP[tileAt(x, h - 1)].decor) continue;
    if (b === 'dunes' && rand() < .7) continue; const set = FOL[b === 'ash' ? 'ash' : b === 'reach' ? 'reach' : b === 'scoria' || b === 'dunes' ? 'scoria' : 'moor']; fgOn(set[randi(0, set.length - 1)], x, h, { lit: 1 });
  }
  if (!PROPV) { PROPV = { st: [], cy: [] }; for (let k = 0; k < 12; k++) PROPV.st.push(PROP.stalactite(8 + round(k * 1.2), 100 + k)); for (let k = 0; k < 6; k++) PROPV.cy.push(PROP.crystal(k * 7 + 3)); }
  for (let k = 0, n = CW * WH / 700 | 0; k < n; k++) {
    const x = randi(x0, x1 - 1), y = randi(BASE_Y, WH - 6), i = y * WW + x; if (tiles[i] !== AIR || !walls[i] && y < SKYL[x]) continue;
    if (TP[tiles[i - WW]].full && !TP[tiles[i - WW]].ghost && tileAt(x, y + 1) === AIR && tileAt(x, y + 2) === AIR) hang(PROPV.st[randi(0, 11)], x, y, { lit: 1 });
    else if (TP[tiles[i + WW]].full && rand() < .25) propC(PROPV.cy[randi(0, 5)], x, y + 1, { lit: 1, light: biomeE(x) === 'reach' ? [.1, .3, .34] : null });
    else if (y >= DEEP_Y && TP[tiles[i + WW]].full) fgOn(FOL.deep[randi(0, 1)], x, y + 1, { lit: 1 });
  }
  echoStones(x0, x1, here);
  for (let q = np; q < PROPS.length; q++) bucketAdd(PROPB, PROPS[q]); for (let q = nf; q < FGP.length; q++) bucketAdd(FGPB, FGP[q]);
  CST[cx] = 2; MODS_ON = was;
}
let PROPV = null;
function bucketAdd(m, p) { const k0 = floor(p.x / 256), k1 = floor((p.x + p.img.width) / 256); for (let k = k0; k <= k1; k++) { let a = m.get(k); if (!a) m.set(k, a = []); a.push(p); } }
function poolAt(x, y, liq, maxW, maxD) {
  while (inW(x, y + 1) && tiles[(y + 1) * WW + x] === AIR) y++;
  if (!inW(x, y + 1) || !TP[tiles[(y + 1) * WW + x]].solid) return 0; let n = 0;
  for (let d = 0; d < maxD; d++, y--) {
    let a = x, b = x; const sup = k => TP[tiles[(y + 1) * WW + k]].solid || TP[tiles[(y + 1) * WW + k]].liquid;
    while (tiles[y * WW + a - 1] === AIR && sup(a - 1) && x - a < maxW) a--;
    while (tiles[y * WW + b + 1] === AIR && sup(b + 1) && b - x < maxW) b++;
    if (!TP[tiles[y * WW + a - 1]].solid || !TP[tiles[y * WW + b + 1]].solid || !sup(a) || !sup(b)) break;
    for (let k = a; k <= b; k++) tiles[y * WW + k] = liq; n += b - a + 1;
  }
  return n;
}
function vaultAt(x, y) {
  for (let dx = 0; dx < 13; dx++) for (let dy = 0; dy < 8; dy++) { const i = (y + dy) * WW + x + dx, edge = dx === 0 || dx === 12 || dy === 0 || dy === 7; tiles[i] = edge && !((dx === 0 || dx === 12) && dy > 3 && dy < 7) ? BRICK : AIR; walls[i] = W_BRICK; }
  tiles[(y + 6) * WW + x + 3] = POT; tiles[(y + 6) * WW + x + 6] = POT; tiles[(y + 6) * WW + x + 9] = POT; tiles[(y + 7) * WW + x + 5] = EMBER; tiles[(y + 7) * WW + x + 7] = COPPER; dyn(x + 6, y + 2, TORCH);
}
function setPiece(kind) {
  const clearAbove = (cx, r, gy) => { for (let x = cx - r; x <= cx + r; x++) for (let y = max(1, gy - 46); y < gy; y++) { tiles[y * WW + x] = AIR; walls[y * WW + x] = 0; } };
  const pillars = (cx, gy) => { for (const px of [-22, -14, 13, 21]) { const ph = 3 + ((px * 7 + SEED) & 1), broken = ((px + SEED) & 1); for (let y = 1; y <= ph; y++) for (let dx = (y === ph && !broken ? -1 : 0); dx < (y === ph && !broken ? 4 : 3); dx++) if (!(broken && y === ph && dx === 2)) tiles[(gy - y) * WW + cx + px + dx] = BRICK; } };
  if (kind === 'shrine') {
    SHRINE_Y = heights[SHRINE_X]; clearAbove(SHRINE_X, 26, SHRINE_Y);
    for (let x = SHRINE_X - 26; x <= SHRINE_X + 26; x++) { tiles[SHRINE_Y * WW + x] = BRICK; tiles[(SHRINE_Y + 1) * WW + x] = abs(x - SHRINE_X) % 5 === 0 ? BRICK : ASH; }
    pillars(SHRINE_X, SHRINE_Y); dyn(SHRINE_X, SHRINE_Y - 1, SHRINE); reserve(SHRINE_X - 27, SHRINE_X + 27, 2); mark('crater', 'ASHEN HOLLOW', "the Warden's shrine", SHRINE_X, SHRINE_Y - 4, 30);
  } else if (kind === 'court') {
    SHRINE2_Y = heights[SHRINE2_X]; clearAbove(SHRINE2_X, 26, SHRINE2_Y);
    for (let x = SHRINE2_X - 26; x <= SHRINE2_X + 26; x++) { tiles[SHRINE2_Y * WW + x] = abs(x - SHRINE2_X) % 6 === 0 ? BRICK : SNOW; tiles[(SHRINE2_Y + 1) * WW + x] = BRICK; }
    pillars(SHRINE2_X, SHRINE2_Y); dyn(SHRINE2_X, SHRINE2_Y - 1, SHRINE2); reserve(SHRINE2_X - 27, SHRINE2_X + 27, 2); mark('court', 'THE MIRROR COURT', 'where the Glass Waker waits', SHRINE2_X, SHRINE2_Y - 4, 30);
  } else {
    GATE_Y = heights[GATE_X]; clearAbove(GATE_X, 10, GATE_Y); for (let x = GATE_X - 9; x <= GATE_X + 9; x++) tiles[GATE_Y * WW + x] = BRICK; dyn(GATE_X, GATE_Y - 1, GATE); reserve(GATE_X - 10, GATE_X + 10, 2);
    mark('gate', 'THE FURNACE GATE', 'three embers open it', GATE_X, GATE_Y - 4, 22);
  }
}
function buildAltarIsland() {
  island(SKY_X, SKY_Y, 19, 10, true);
  for (let x = SKY_X - 9; x <= SKY_X + 9; x++) { for (let y = SKY_Y - 6; y < SKY_Y; y++) tiles[y * WW + x] = AIR; tiles[SKY_Y * WW + x] = abs(x - SKY_X) % 4 === 0 ? BRICK : SNOW; tiles[(SKY_Y + 1) * WW + x] = BRICK; }
  dyn(SKY_X, SKY_Y - 1, PEDESTAL); propC(PROP.altar, SKY_X, SKY_Y); SPOTS.hook = { x: SKY_X, y: SKY_Y - 1 };
  seeFG(genArchFacade(19, 7, { banners: true }), SKY_X * T + 4, SKY_Y, { see: .45, name: 'colonnade' }); reserve(SKY_X - 10, SKY_X + 10, 2);
  mark('drift', 'THE DRIFT', 'islands on the wind', SKY_X, SKY_Y - 4, 20);
  vent(SKY_X - 25, SKY_Y - 8) || vent(SKY_X - 29, SKY_Y - 8); vent(SKY_X + 25, SKY_Y - 8) || vent(SKY_X + 29, SKY_Y - 8);
}

// ---------------- step three: ready to walk on ----------------
function readyChunk(cx) {
  if (CST[cx] >= 3) return;
  for (let k = cx - 1; k <= cx + 1; k++) if (k >= 0 && k < NCH) finishChunk(k);
  const x0 = cx * CW, x1 = x0 + CW;
  // the surface as it ended up (towers, set pieces), and the line below which the sky does not reach
  const sl = y => { const t = tiles[y * WW + x]; return TP[t].solid || TP[t].liquid; }; let x;
  for (x = x0; x < x1; x++) {
    const s = surf(x); let y = max(2, s - 30);
    while (y < WH - 3) { if (sl(y)) { let k = y; while (k < WH - 3 && sl(k)) k++; let gap = 0; while (k < WH - 3 && !sl(k) && gap < 6) { k++; gap++; } if (gap >= 6 && k < s + 2) { y = k; continue; } break; } y++; }
    heights[x] = min(y, s + 2); SKYL[x] = max(heights[x] + 3, SKYL[x]);
  }
  // wherever the ground (or something built on it) steps up more than a jump, something grows or hangs there to climb
  for (x = x0; x < x1; x++) {
    if (DIM === 3 || inWindow(x, 0) || RESV[x] || RESV[x + 1]) continue; const a = heights[x], b = x + 1 < x1 ? heights[x + 1] : topAt(x + 1); if (abs(a - b) < 5) continue;
    const lo = a > b ? x : x + 1, top = min(a, b), bot = max(a, b), bi = biomeE(lo), aid = DIM ? DIMP[DIM].aid : bi === 'reach' ? GLASSROOT : bi === 'scoria' || bi === 'dunes' || bi === 'ash' ? RUSTCHAIN : CREEPER;
    for (let yy = top; yy < bot; yy++) { const i = yy * WW + lo, t = tiles[i]; if (!t || (TP[t].decor && !TP[t].dyn && !TP[t].stalk)) tiles[i] = aid; }
  }
  // your changes go back in
  const was = MODS_ON; MODS_ON = false;
  const pm = PEND.mods.get(cx); if (pm) { for (const [i, t] of pm) putTile(i, t); PEND.mods.delete(cx); }
  const pw = PEND.walls.get(cx); if (pw) { for (const [i, w] of pw) walls[i] = w; PEND.walls.delete(cx); }
  const ps = PEND.stn.get(cx); if (ps) { for (const o of ps) restoreStn(o); PEND.stn.delete(cx); }
  MODS_ON = was;
  // what you built stands on what holds it up
  if (PLACED.size && CST[cx] < 3) { const cols = new Map(); for (const i of PLACED) { const x = i % WW; if (x >= x0 && x < x1) { SUP.set(i, 99); if (!cols.has(x)) cols.set(x, (i / WW) | 0); } } CST[cx] = 3; for (const [x, y] of cols) supRecalc(x, y); }
  for (const [x, tr] of treeTops) if (x >= x0 && x < x1 && !TP[tileAt(x, tr.y)].stalk) treeTops.delete(x);
  for (const [k, c] of chunks) if (c.cx * CH + CH > x0 && c.cx * CH < x1) chunks.delete(k);
  CST[cx] = 3; mapChunkReady(cx);
}
// a saved change, put back without waking water or marking it again
function putTile(i, t) { const x = i % WW, y = (i / WW) | 0, old = tiles[i]; if (old === t || !TP[t]) return; tiles[i] = t; if (TP[old].dyn) tileObjs.delete(i); if (TP[t].dyn) tileObjs.set(i, { x, y, id: t }); }
const chunkOf = i => ((i % WW) / CW) | 0;
// the ground at a column as it stands, ignoring rock that floats in the sky
function topAt(x) {
  const s = surf(x), sl = y => { const t = tiles[y * WW + x]; return TP[t].solid || TP[t].liquid; }; let y = max(2, s - 30);
  while (y < WH - 3) { if (sl(y)) { let k = y; while (k < WH - 3 && sl(k)) k++; let gap = 0; while (k < WH - 3 && !sl(k) && gap < 6) { k++; gap++; } if (gap >= 6 && k < s + 2) { y = k; continue; } break; } y++; }
  return min(y, s + 2);
}
// saved tile changes: kept in MODS for saving, and queued for their chunk
function deferMods(str) {
  if (!str) return; let i = 0;
  for (const s of str.split(',')) { const [a, b] = s.split('.'); i += parseInt(a, 36); const t = parseInt(b, 36); if (!(i >= 0 && i < WW * WH) || !TP[t]) continue; MODS.set(i, t); const k = chunkOf(i); if (!PEND.mods.has(k)) PEND.mods.set(k, []); PEND.mods.get(k).push([i, t]); }
}

// ---------------- streaming: the world forms around you ----------------
// the chunks right around you are made at once; the rest of the range a little each frame
function streamTo(px, all) {
  if (!WORLD.endless || WORLD.arena || !CST) return;
  const pc = clamp(floor(px / T / CW), 2, NCH - 3), R = GEN_RANGE[WORLD.size] !== undefined ? GEN_RANGE[WORLD.size] : 7;
  for (let k = pc - 2; k <= pc + 2; k++) readyChunk(k);
  if (all) { for (let k = max(2, pc - R); k <= min(NCH - 3, pc + R); k++) readyChunk(k); return; }
  const t0 = performance.now();
  for (let r = 3; r <= R; r++) for (const k of [pc - r, pc + r]) {
    if (k < 2 || k >= NCH - 2 || CST[k] >= 3) continue;
    if (CST[k] === 0) terrainChunk(k, t0 + 4); else if (CST[k] === 1) { for (const q of [k - 1, k + 1]) if (CST[q] === 0) terrainChunk(q, t0 + 4); if (CST[k - 1] && CST[k + 1]) finishChunk(k); } else { if (CST[k - 1] >= 2 && CST[k + 1] >= 2) readyChunk(k); else for (const q of [k - 1, k + 1]) if (CST[q] < 2) { if (CST[q] === 0) terrainChunk(q, t0 + 4); else if (CST[q - 1] && CST[q + 1]) finishChunk(q); else for (const z of [q - 1, q + 1]) if (CST[z] === 0) terrainChunk(z, t0 + 4); } }
    if (performance.now() - t0 > 4) return;
  }
}
const chunkReadyAt = tx => !WORLD.endless || WORLD.arena || !CST || (tx >= 0 && tx < WW && CST[(tx / CW) | 0] >= 3);
