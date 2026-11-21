// ============================================================
//  Other worlds. Past the Furnace Gate the land has floors beneath and
//  above it: CINDERDEEP (molten, under everything), the ROOTDARK (the dark
//  where the world's roots drink) and the GLASS EXPANSE (islands of a broken
//  sky). Each is an endless world of its own, made by the same chunk
//  pipeline from the seed, with its own ground, ore, creatures, weather and
//  a guardian. Only the world you stand in is held in memory; the others
//  wait as their saved edits (DSTASH) until you step back in.
// ============================================================
const SLAG = 100, CHARGLASS = 101, CINDERITE = 102, ASHSOIL = 103, MAGMAROCK = 104, BASALT = 105,
  GLOAM = 106, MYCEL = 107, ROOTWOOD = 108, CAPFLESH = 109, GLOOMORE = 110, SHADESTONE = 111, GLOWSHROOM = 112, ROOTHANG = 113,
  PALESTONE = 114, SHARDGLASS = 115, PRISMORE = 116, STARMOSS = 117, GLASSWALK = 118, PRISMBLOOM = 119,
  RIFT = 120, ECHOSTONE = 121, SLAGFORGE = 122, DALTAR = 123, DBRICK = 124, WAYGATE = 125;
const W_SLAG = 20, W_ROOT = 21, W_PALE = 22, W_DBRICK = 23;
defT(SLAG, { name: 'Slagrock', solid: true, full: true, hard: 40, hi: '#8a4a3a', dust: '#4a2a26' });
defT(CHARGLASS, { name: 'Charglass', solid: true, full: true, hard: 70, hi: '#b49cd8', dust: '#2a2236' });
defT(CINDERITE, { name: 'Cinderite Ore', solid: true, full: true, hard: 80, hi: '#ffb070', dust: '#ff7a2a', light: [.3, .1, .03] });
defT(ASHSOIL, { name: 'Scorched Soil', solid: true, full: true, hard: 14, hi: '#7a6a6a', dust: '#3a3034', cap: 5 });
defT(MAGMAROCK, { name: 'Magma Vein', solid: true, full: true, hard: 50, hi: '#ff8a3d', dust: '#ff7a2a', light: [.5, .18, .05] });
defT(BASALT, { name: 'Basalt', solid: true, full: true, hard: 46, hi: '#6a7080', dust: '#2a2e38' });
defT(GLOAM, { name: 'Gloam Soil', solid: true, full: true, hard: 14, hi: '#3a4a52', dust: '#1e262c' });
defT(MYCEL, { name: 'Glowmycel', solid: true, full: true, hard: 14, hi: '#6ff0c0', dust: '#2a4a44', cap: 6, capC: ['#6ff0c0', '#2fb8a8'], light: [.03, .11, .1] });
defT(ROOTWOOD, { name: 'Rootwood', solid: true, full: true, hard: 30, hi: '#9a7a6a', dust: '#4a3228' });
defT(CAPFLESH, { name: 'Glowcap Flesh', plat: true, hard: 6, dust: '#4fd8c8', light: [.06, .26, .24] });
defT(GLOOMORE, { name: 'Gloom Ore', solid: true, full: true, hard: 90, hi: '#8ff5d6', dust: '#2fb8a8', light: [.04, .17, .14] });
defT(SHADESTONE, { name: 'Shadestone', solid: true, full: true, hard: 50, hi: '#4a5a6a', dust: '#1a222a' });
defT(GLOWSHROOM, { name: 'Lanternshroom', decor: true, hard: 1, ground: true, drop: 'glowcap', light: [.12, .5, .45], dust: '#6ff0c0' });
defT(ROOTHANG, { name: 'Hanging Roots', climb: 1, hard: Infinity, dust: '#6a4a3a' });
defT(PALESTONE, { name: 'Palestone', solid: true, full: true, hard: 55, hi: '#f4eefa', dust: '#9a90b0' });
defT(SHARDGLASS, { name: 'Shardglass', solid: true, full: true, hard: 60, hi: '#ffffff', dust: '#c9b4f0', light: [.12, .1, .2] });
defT(PRISMORE, { name: 'Prism Ore', solid: true, full: true, hard: 100, hi: '#ffffff', dust: '#e0c8ff', light: [.2, .16, .3] });
defT(STARMOSS, { name: 'Starmoss', solid: true, full: true, hard: 14, hi: '#c9b4ff', dust: '#6a5a9a', cap: 6, capC: ['#e0d2ff', '#a58ae0'] });
defT(GLASSWALK, { name: 'Glasswalk', solid: true, hard: 8, drop: 'glasswalk', dust: '#c9fff6', light: [.05, .09, .11] });
defT(PRISMBLOOM, { name: 'Prism Bloom', decor: true, hard: 1, ground: true, light: [.2, .14, .3], dust: '#e0c8ff' });
defT(RIFT, { name: 'Rift', dyn: true, hard: Infinity, light: [.75, .45, 1], dust: '#b49cff' });
defT(ECHOSTONE, { name: 'Echo Stone', dyn: true, hard: Infinity, light: [.25, .38, .55], dust: '#8a84a0' });
defStn(SLAGFORGE, 'Slagforge', 'slagforge', { light: [.85, .38, .1], dust: '#4a2a26', hard: 30 });
defStn(WAYGATE, 'Waygate', 'waygate', { light: [.5, .3, .75], dust: '#8a84a0' });
defT(DALTAR, { name: 'Altar', dyn: true, hard: Infinity, light: [.45, .3, .55], dust: '#8a84a0' });
defT(DBRICK, { name: 'Old Brick', solid: true, full: true, hard: Infinity, hi: '#9a90a8', dust: '#4a4458' });
Object.assign(STATIONS, { [SLAGFORGE]: 'anvil', [WAYGATE]: 'rift', [RIFT]: 'rift' });
TIER_N.push('a cinderite tool', 'a gloomsteel tool', 'a prismglass tool');
defM(ASHSOIL, { hp: 3, y: [['ash', 1.5], ['dirt', .4]] }); defM(SLAG, { hp: 8, tier: 4, k: 'stone', y: [['slagrock', 2]], ham: [['gravel', 1.5], ['cinder', .3]] });
defM(BASALT, { hp: 9, tier: 4, k: 'stone', y: [['basalt', 2]] }); defM(CHARGLASS, { hp: 11, tier: 5, k: 'glass', y: [['charglass', 2]] });
defM(MAGMAROCK, { hp: 10, tier: 5, k: 'ore', y: [['slagrock', 1], ['cinder', 1.4]] }); defM(CINDERITE, { hp: 14, tier: 6, k: 'ore', y: [['cinderite_ore', 3], ['slagrock', .4]] });
defM(GLOAM, { hp: 3, y: [['gloam', 2]] }); defM(MYCEL, { hp: 3, y: [['gloam', 2], ['spore_dust', .25]] });
defM(ROOTWOOD, { hp: 9, tier: 4, k: 'wood', y: [['rootwood', 1.5]] }); defM(CAPFLESH, { hp: 2, k: 'soil', y: [['capflesh', 1]] });
defM(SHADESTONE, { hp: 12, tier: 6, k: 'stone', y: [['shadestone', 2]] }); defM(GLOOMORE, { hp: 16, tier: 7, k: 'ore', y: [['gloom_ore', 3], ['shadestone', .4]] });
defM(PALESTONE, { hp: 13, tier: 7, k: 'stone', y: [['palestone', 2]] }); defM(STARMOSS, { hp: 4, y: [['palestone', 1], ['prism_dust', .2]] });
defM(SHARDGLASS, { hp: 12, tier: 7, k: 'glass', y: [['shardglass', 2]] }); defM(PRISMORE, { hp: 18, tier: 8, k: 'ore', y: [['prism_ore', 3], ['shardglass', .4]] });
defM(GLASSWALK, { hp: 3, k: 'glass', y: [['glasswalk', 1]] }); defM([SLAGFORGE, WAYGATE], { hp: 8, tier: 1, k: 'stone' }); MAT[SLAGFORGE].y = [['slagforge', 1]]; MAT[WAYGATE].y = [['waygate', 1]];
Object.assign(PLUCK, { [GLOWSHROOM]: [['glowcap', 1, 1], ['spore_dust', 0, 1]], [PRISMBLOOM]: [['prism_dust', 1, 2]] });
Object.assign(BIOME, {
  cinder: 'THE CINDER WASTES', basalt: 'THE BASALT STEPS', kiln: 'THE KILNWORKS', cinder_u: 'THE MAGMA VEINS', cinder_d: 'THE MOLTEN CORE',
  rootwood: 'THE ROOTWOOD', mycel: 'THE GLOWCAP GROVES', mire: 'THE GLOAM MIRE', root_u: 'THE UNDERROOTS', root_d: 'THE TAPROOTS',
  shard: 'THE SHARD ISLES', prism: 'THE PRISM FIELDS', hush: 'THE HUSH', glass_u: 'UNDER THE ISLES', rift: 'THE RIFT'
});

// ---------------- the worlds ----------------
let DIM = 0, DARENA_X = 0, DARENA_Y = 0, DSIDE = 1;
const DSTASH = {}, ECHOPOS = new Map(), GISLE = new Map();
const DIMP = [
  { key: 'over', name: 'THE WAKING LANDS', short: 'the Waking Lands', col: '#ffd35a' },
  { key: 'cinder', name: 'CINDERDEEP', short: 'Cinderdeep', sub: 'the furnace under the world', col: '#ff8a3d', base: 150, deep: EH - 72, bio: ['cinder', 'basalt', 'kiln'], aid: RUSTCHAIN, wall: W_SLAG,
    sun: [.66, .42, .34], dn: .34, sky: [[24, 6, 10], [84, 22, 20], [170, 64, 32]], tone: [[96, 32, 30], [58, 18, 20]], arena: 620, arenaR: 32, boss: 'slagtyrant',
    place: "THE TYRANT'S CALDERA", placeSub: 'something huge sleeps in its own heat', loot: 'kilnruin', ev: 'eruption', floor: BASALT },
  { key: 'root', name: 'THE ROOTDARK', short: 'the Rootdark', sub: 'where the roots of the world drink', col: '#6ff0c0', base: 136, deep: EH - 64, bio: ['rootwood', 'mycel', 'mire'], aid: ROOTHANG, wall: W_ROOT,
    sun: [.32, .42, .44], dn: .16, sky: [[3, 8, 12], [10, 26, 30], [26, 56, 54]], tone: [[26, 52, 54], [14, 32, 34]], arena: 700, arenaR: 32, boss: 'rootmother',
    place: 'THE HEARTROOT HOLLOW', placeSub: 'the ground here breathes', loot: 'rootruin', ev: 'sporebloom', floor: SHADESTONE },
  { key: 'glass', name: 'THE GLASS EXPANSE', short: 'the Glass Expanse', sub: 'islands of a broken sky', col: '#e0c8ff', base: 176, deep: EH + 200, bio: ['shard', 'prism', 'hush'], aid: GLASSROOT, wall: W_PALE,
    sun: [.66, .64, .9], dn: .5, sky: [[6, 4, 22], [30, 18, 64], [86, 58, 144]], tone: [[70, 54, 126], [44, 34, 90]], arena: 740, arenaR: 28, boss: 'matriarch',
    place: "THE MATRIARCH'S SPIRE", placeSub: 'every shard here faces one point', loot: 'glassruin', ev: 'shatterstorm', floor: PALESTONE }
];
const canEnterDim = d => d === 0 || WORLD.mode === 1 || (d === 1 ? !!(G.flags.dim1 || G.flags.gateOpen) : !!G.flags['dim' + d]);
function initDim(d) {
  const D = DIMP[d]; DIM = d; rng = mulberry32((SEED ^ (d * 0x2545F491)) >>> 0); WORLD.arena = false; WORLD.endless = 1; resetWorld(EW, EH);
  CST = new Uint8Array(NCH); CPROG = new Uint8Array(NCH); SURF = new Int16Array(EW).fill(-32768); BIO = new Uint8Array(EW); LAKES.clear(); GISLE.clear(); PEND.mods.clear(); PEND.walls.clear(); PEND.stn.clear();
  BASE_Y = D.base; DEEP_Y = D.deep; DRIFT_Y = 0; UD0 = BASE_Y + 64; UD1 = DEEP_Y - 18; CRATER_R = 0; VIL_W = 12; LOOT.clear(); roadY = x => WH + 50;
  DSIDE = hh(5, 6, SEED + d * 13) < .5 ? 1 : -1; SPAWN_X = X0; DARENA_X = X0 + DSIDE * D.arena;
  SHRINE_X = SHRINE2_X = MINE_X = FORGE_X = GATE_X = SKY_X = BLADE_X = SPIRE_X = REACH_X = RUST_X = -100000; SHRINE_Y = SHRINE2_Y = GATE_Y = MINE_Y = FORGE_Y = SKY_Y = 0;
  FORCE = []; SEGS = []; FLATS = [];
  const fl = (x, r, k) => { let s = 0, n = 0; for (let q = x - r; q <= x + r; q += 2) { s += dimRaw(q); n++; } FLATS.push({ x, r, k, h: round(s / n) }); };
  if (d !== 3) { fl(SPAWN_X, 12, 10); fl(DARENA_X, D.arenaR + 4, 14); } else FLATS.push({ x: SPAWN_X, r: 0, k: 1, h: D.base }, { x: DARENA_X, r: 0, k: 1, h: D.base - 6 });
  VIL_Y = FLATS[0].h; DARENA_Y = FLATS[1].h;
  WINDOWS = [[X0 - 18, X0 + 18, 16], [DARENA_X - D.arenaR - 10, DARENA_X + D.arenaR + 10, 26]];
  SPOTS.altar = { x: DARENA_X, y: DARENA_Y - 1 }; MODS_ON = true;
}
// ---------------- ground ----------------
const dimN = x => fbm(x * .0024 + DIM * 37.1, 3.3 + DIM, 3);
function dimW(x) { const n = dimN(x), a = smooth((.45 - n) / .04), c = smooth((n - .54) / .04); return [a, max(0, 1 - a - c), c]; }
function dimBio(x) {
  const k = clamp(x | 0, 0, EW - 1); let v = BIO[k];
  if (!v) { const n = dimN(k); v = BIO[k] = n < .43 ? 1 : n > .56 ? 3 : 2; }
  return DIMP[DIM].bio[v - 1];
}
const DLF = {
  cinder: x => (fbm(x * .007, 11.1, 3) - .5) * 70 + (fbm(x * .03, 12.2, 2) - .5) * 10,
  basalt: x => { const h = (fbm(x * .006, 13.3, 3) - .5) * 110 - 10; return round(h / 4) * 4 + (fbm(x * .07, 14.4, 2) - .5) * 1.5; },
  kiln: x => (fbm(x * .009, 15.5, 3) - .5) * 50 - 6,
  rootwood: x => (fbm(x * .008, 21.1, 3) - .5) * 90 + (fbm(x * .035, 22.2, 2) - .5) * 12,
  mycel: x => (fbm(x * .006, 23.3, 3) - .5) * 46,
  mire: x => (fbm(x * .01, 24.4, 2) - .5) * 14 + 12,
  shard: x => 0, prism: x => 0, hush: x => 0
};
function dimRaw(x) { const D = DIMP[DIM], w = dimW(x); let h = 0; for (let k = 0; k < 3; k++) if (w[k] > .001) h += w[k] * DLF[D.bio[k]](x); return D.base + h; }
function dimFlat(x) { let y = dimRaw(x); for (const f of FLATS) { const k = smooth(1 - (abs(x - f.x) - f.r) / f.k); if (k > 0) y = lerp(y, f.h, k); } return y; }
function dimSurf(x) {
  x = clamp(x | 0, 0, EW - 1); let v = SURF[x]; if (v !== -32768) return v;
  if (DIM === 3) v = glassTop(x); else { let s = 0; for (let k = -2; k <= 2; k++) s += dimFlat(x + k); v = clamp(round(s / 5), 40, DEEP_Y - 60); const L = dimLakeAt(x); if (L) v = max(v, L.lv + round(L.d * (1 - ((x - L.c) / L.r) ** 2))); }
  SURF[x] = v; return v;
}
// a pool to a cell: lava in Cinderdeep (mostly in the wastes), black water in the Rootdark (mostly in the mire)
function dimLakeOf(k) {
  if (LAKES.has(k)) return LAKES.get(k); let L = null; const sd = SEED + DIM * 77, c = k * 200 + 50 + floor(hh(k, 71, sd) * 100), b = dimBio(c), home = DIM === 1 ? 'cinder' : 'mire';
  if (DIM !== 3 && !inWindow(c, 34) && hh(k, 73, sd) < (b === home ? .85 : .3)) {
    const r = 7 + floor(hh(k, 74, sd) * 9), rim = q => { let s = 0; for (let j = -2; j <= 2; j++) s += dimFlat(q + j); return round(s / 5); };
    const a = rim(c - r - 1), b = rim(c + r + 1); if (abs(a - b) <= 2) L = { c, r, lv: max(a, b), d: 3 + floor(hh(k, 75, sd) * 4), liq: DIM === 1 ? CINDER : WATER };
  }
  LAKES.set(k, L); return L;
}
function dimLakeAt(x) { const k = floor(x / 200); for (const q of [k, k - 1, k + 1]) { const L = dimLakeOf(q); if (L && abs(x - L.c) < L.r) return L; } return null; }
function dimPlace(tx, ty) {
  const r = realmAt(tx, ty), k = DIMP[DIM].key; if (r === 'deep') return k + '_d'; if (r === 'under') return k + '_u';
  if (abs(tx - SPAWN_X) < 16) return 'rift'; return dimBio(tx);
}
function dimColumn(x) {
  if (DIM === 3) { glassColumn(x); return; }
  const D = DIMP[DIM], C = DIM === 1, hs = dimSurf(x), b = dimBio(x), dd = 3 + floor(fbm(x * .07, 50 + DIM, 2) * 4), prot = protectDepth(x), win = inWindow(x, 2);
  heights[x] = hs; SKYL[x] = hs + 3;
  const LK = win ? null : dimLakeAt(x), lvl = LK ? LK.lv : -1, liq = LK ? LK.liq : WATER;
  for (let y = 0; y < WH; y++) {
    const i = y * WW + x, d = y - hs; let t = AIR, w = 0;
    if (y >= WH - 3) t = BEDROCK;
    else if (d < 0) { if (lvl > 0 && y >= lvl) t = liq; }
    else {
      const deep = y >= DEEP_Y + (fbm(x * .04, 3.3 + DIM, 2) - .5) * 12;
      if (d > 2) w = D.wall;
      if (C) {
        if (d < dd) t = b === 'basalt' && d > 0 ? BASALT : ASHSOIL;
        else if (deep) t = abs(fbm(x * .05, y * .05 + 40, 3) - .5) < .03 ? MAGMAROCK : BASALT;
        else t = b === 'basalt' ? (fbm(x * .3, y * .02, 2) > .45 ? BASALT : SLAG) : abs(fbm(x * .05, y * .05 + 40, 3) - .5) < .016 ? MAGMAROCK : fbm(x * .08, y * .08 + 60, 2) > .74 ? CHARGLASS : SLAG;
      } else {
        if (d < dd) t = GLOAM;
        else if (!deep && abs(fbm(x * .02, y * .06 + 80, 2) - .5) < .022) t = ROOTWOOD;
        else t = deep ? (fbm(x * .06, y * .06 + 20, 2) > .64 ? ROOTWOOD : SHADESTONE) : (fbm(x * .06, y * .06 + 20, 2) > .7 ? GLOAM : SHADESTONE);
      }
      let cave = 0;
      if (d >= max(1, prot)) {
        if (deep) { const v = fbm(x * .018, y * .04 + 300 + DIM * 500, 3); if (v > .57) cave = v > .61 ? 2 : 1; }
        else if (d >= 6) {
          const wid = .02 + min(.012, d * .00018);
          if (abs(fbm(x * .021, y * .032 + 100 + DIM * 500, 2) - .5) < wid || abs(fbm(x * .016 + 50, y * .027 + 300 + DIM * 500, 2) - .5) < wid * .8) cave = 1;
          else if (d > 14) { const cv = fbm(x * .0105, y * .019 + 700 + DIM * 500, 3); if (cv > .66) cave = cv > .7 ? 2 : 1; }
        }
      }
      if (cave) { t = AIR; if (cave === 2) w = 0; }
      else if (t !== ASHSOIL && t !== GLOAM) t = dimOre(x, y, d, t, deep);
    }
    tiles[i] = t; walls[i] = w;
  }
  if (!C) for (let y = max(3, hs - 2); y < min(WH - 4, hs + 3); y++) { const i = y * WW + x; if (tiles[i] === GLOAM && !TP[tiles[i - WW]].full && !TP[tiles[i - WW]].liquid) tiles[i] = MYCEL; }
  dimDecor(x, hs, b);
  for (const nx of [x - 1, x + 1]) { const hn = dimSurf(nx); if (hs - hn < 5 || inWindow(x, 2)) continue; for (let y = hn; y < hs; y++) { const i = y * WW + x; if (!tiles[i] || (TP[tiles[i]].decor && !TP[tiles[i]].dyn)) tiles[i] = D.aid; } }
}
function dimOre(x, y, d, t, deep) {
  if (DIM === 1) {
    if (d > 10 && fbm(x * .11, y * .11 + 70, 2) > (deep ? .74 : .785)) return CINDERITE;
    if (d > 6 && d < 70 && fbm(x * .12, y * .12 + 75, 2) > .8) return COAL;
    if (deep && fbm(x * .13, y * .13 + 77, 2) > .81) return EMBER;
  } else {
    if (d > 12 && fbm(x * .11, y * .11 + 90, 2) > (deep ? .75 : .79)) return GLOOMORE;
    if (d > 6 && fbm(x * .12, y * .12 + 95, 2) > .81) return COAL;
    if (d > 20 && fbm(x * .1, y * .1 + 97, 2) > .82) return IRON;
  }
  return t;
}
function dimDecor(x, hs, b) {
  const i = (hs - 1) * WW + x; if (hs < 4 || tiles[i] !== AIR || !TP[tiles[hs * WW + x]].solid || inWindow(x, 1)) return; const r = hh(x, 77, SEED + DIM);
  if (DIM === 1) { if (r < .05) tiles[i] = FUNGUS; else if (r < .09) tiles[i] = BONES; else if (r < .16) tiles[i] = PEBBLE; else if (r < .2 && b !== 'basalt') tiles[i] = DEADBUSH; }
  else if (DIM === 2) { if (r < (b === 'mycel' ? .22 : .08)) tiles[i] = GLOWSHROOM; else if (b === 'mire' && r < .34) tiles[i] = REED; else if (r < .14) tiles[i] = PEBBLE; }
}
// ---------------- the Glass Expanse: islands over nothing ----------------
const GCELL = 44;
function gIsleC(k) { if (GISLE.has(k)) return GISLE.get(k); const I = gIsle(k); GISLE.set(k, I); return I; }
function gIsle(k) {
  const D = DIMP[3], cx = k * GCELL + 22 + floor((hh(k, 31, SEED) - .5) * 10), A = abs(cx - SPAWN_X), B = abs(cx - DARENA_X), R = D.arenaR + 4, path = q => round(D.base + (fbm(q * .06, 3.7, 3) - .5) * 120 + (fbm(q * .3, 5.1, 2) - .5) * 10);
  if (abs(k * GCELL + 22 - SPAWN_X) <= GCELL / 2) return { cx: SPAWN_X, a: 20, ty: D.base, th: 12, flat: 1, k };
  if (A < 46) return null;
  if (abs(k * GCELL + 22 - DARENA_X) <= GCELL / 2) return { cx: DARENA_X, a: R, ty: D.base - 6, th: 15, flat: 1, k };
  if (B < R + 24) return null;
  const near = min(A, B) < 140 ? smooth(1 - (min(A, B) - 40) / 100) : 0, ty = round(lerp(path(k), A < B ? D.base : D.base - 6, near));
  return { cx, a: 11 + floor(hh(k, 32, SEED) * 9), ty: clamp(ty, 60, WH - 60), th: 6 + floor(hh(k, 33, SEED) * 6), k };
}
function gUpper(q) {
  if (hh(q, 41, SEED) > .55) return null; const cx = q * 90 + 20 + floor(hh(q, 42, SEED) * 50);
  if (abs(cx - SPAWN_X) < 50 || abs(cx - DARENA_X) < DIMP[3].arenaR + 26) return null;
  const I = gIsleC(floor(cx / GCELL)), base = I ? I.ty : DIMP[3].base;
  return { cx, a: 5 + floor(hh(q, 43, SEED) * 6), ty: base - 26 - floor(hh(q, 44, SEED) * 30), th: 4 + floor(hh(q, 45, SEED) * 4), up: 1, k: q };
}
const isleTop = (I, x) => I.flat ? I.ty : I.ty + round((fbm(x * .2, I.cx * .1, 2) - .5) * 3 * abs((x - I.cx) / I.a));
function glassTop(x) { const k = floor(x / GCELL); let best = WH - 4; for (let q = k - 1; q <= k + 1; q++) { const I = gIsleC(q); if (I && abs(x - I.cx) <= I.a) best = min(best, isleTop(I, x)); } return best; }
function glassColumn(x) {
  for (let y = 0; y < WH; y++) { const i = y * WW + x; tiles[i] = y >= WH - 3 ? BEDROCK : AIR; walls[i] = 0; }
  const k = floor(x / GCELL), ku = floor(x / 90), isl = []; let top = WH - 4;
  for (let q = k - 1; q <= k + 1; q++) { const I = gIsleC(q); if (I && abs(x - I.cx) <= I.a) isl.push(I); }
  for (let q = ku - 1; q <= ku + 1; q++) { const U = gUpper(q); if (U && abs(x - U.cx) <= U.a) isl.push(U); }
  for (const I of isl) {
    const u = (x - I.cx) / I.a, ty = isleTop(I, x), tk = max(2, round(pow(max(0, 1 - u * u), .55) * I.th + (fbm(x * .3, I.cx, 2) - .5) * 4));
    for (let dy = 0; dy < tk; dy++) {
      const y = ty + dy; if (y < 2 || y >= WH - 4) continue;
      let t = dy === 0 ? STARMOSS : dy < 3 ? PALESTONE : fbm(x * .15, y * .15 + 40, 2) > .72 ? SHARDGLASS : PALESTONE;
      if (dy > 1 && fbm(x * .12, y * .12 + 60, 2) > (I.up ? .72 : .78)) t = PRISMORE;
      tiles[y * WW + x] = t; if (dy > 1 && dy < tk - 1) walls[y * WW + x] = W_PALE;
    }
    if (!I.up) top = min(top, ty);
    if (hh(x, I.cx, 9) > .76 && !I.flat) { const len = 1 + floor(hh(x, I.cx, 10) * 6); for (let j = 0; j < len; j++) { const y = ty + tk + j; if (y < WH - 4 && tiles[y * WW + x] === AIR) tiles[y * WW + x] = GLASSROOT; } }
  }
  heights[x] = top; SKYL[x] = WH;
  if (top < WH - 4 && tiles[(top - 1) * WW + x] === AIR && !inWindow(x, 1)) { const r = hh(x, 78, SEED); if (r < .12) tiles[(top - 1) * WW + x] = PRISMBLOOM; else if (r < .2) tiles[(top - 1) * WW + x] = CRYSTAL; }
}
// ---------------- step two in another world: set pieces ----------------
function dimFinish(cx, x0, x1, here) {
  const D = DIMP[DIM];
  if (here(SPAWN_X)) buildRiftAnchor();
  if (here(DARENA_X)) buildArena();
  echoStones(x0, x1, here);
  for (let k = floor(x0 / 210) - 1; k <= floor(x1 / 210) + 1; k++) {
    let rx = k * 210 + 30 + floor(hh(k, 1401 + DIM, SEED) * 150); if (!here(rx) || hh(k, 1402 + DIM, SEED) > .55 || inWindow(rx, 30)) continue;
    if (DIM === 3) { const I = gIsleC(floor(rx / GCELL)); if (!I || I.flat || I.a < 13) continue; rx = I.cx; if (!here(rx)) continue; }
    if (DIM !== 3 && ![-12, -8, -5, 5, 8, 12].every(k => abs(heights[rx + k] - heights[rx]) <= 1)) continue;
    ruinAt(rx, DIM === 3 ? glassTop(rx) : heights[rx], DIM === 1 ? CINDERBRICK : DIM === 2 ? ROOTWOOD : SHARDGLASS, DIM === 1 ? W_DBRICK : DIM === 2 ? W_ROOT : W_PALE, D.loot);
  }
  if (DIM === 1) cinderFinish(x0, x1, here); else if (DIM === 2) rootFinish(x0, x1, here); else glassFinish(cx, x0, x1, here);
  dimPlaces(cx, x0, x1, here);
  if (DIM !== 3) {
    if (!PROPV) { PROPV = { st: [], cy: [] }; for (let k = 0; k < 12; k++) PROPV.st.push(PROP.stalactite(8 + round(k * 1.2), 100 + k)); for (let k = 0; k < 6; k++) PROPV.cy.push(PROP.crystal(k * 7 + 3)); }
    for (let k = 0, n = CW * WH / 800 | 0; k < n; k++) {
      const x = randi(x0, x1 - 1), y = randi(BASE_Y - 20, WH - 6), i = y * WW + x; if (tiles[i] !== AIR || !walls[i] && y < SKYL[x]) continue;
      if (TP[tiles[i - WW]].full && !TP[tiles[i - WW]].ghost && tileAt(x, y + 1) === AIR && tileAt(x, y + 2) === AIR) hang(PROPV.st[randi(0, 11)], x, y, { lit: 1 });
      else if (TP[tiles[i + WW]].full && rand() < .3) { const g = DFOL[D.key]; fgOn(g[randi(0, g.length - 1)], x, y + 1, { lit: 1, light: DIM === 2 && rand() < .5 ? [.05, .22, .2] : null }); }
    }
  }
  for (let x = x0 + randi(0, 5); x < x1; x += randi(4, 9)) {
    if (RESV[x] > 1) continue; const h = heights[x], t = tileAt(x, h); if (h >= WH - 5 || !TP[t].solid || TP[t].ghost || tileAt(x, h - 1) !== AIR) continue;
    const g = DFOL[D.key]; fgOn(g[randi(0, g.length - 1)], x, h, { lit: 1 });
  }
}
function buildRiftAnchor() {
  const x = SPAWN_X, gy = VIL_Y, D = DIMP[DIM];
  for (let dx = -9; dx <= 9; dx++) {
    const X = x + dx; for (let y = gy - 14; y < gy; y++) { tiles[y * WW + X] = AIR; walls[y * WW + X] = 0; }
    tiles[gy * WW + X] = DBRICK; for (let y = gy + 1; y < gy + 3; y++) if (!TP[tiles[y * WW + X]].solid) tiles[y * WW + X] = D.floor;
  }
  dyn(x, gy - 1, RIFT); dyn(x - 6, gy - 1, FIRE); chestAt(x + 5, gy - 1, 'riftcache'); for (const s of [-8, 8]) { for (let y = gy - 5; y < gy; y++) walls[y * WW + x + s] = W_DBRICK; dyn(x + s, gy - 6, TORCH); }
  reserve(x - 10, x + 10, 2); SPOTS.rift = { x, y: gy - 1 };
}
function buildArena() {
  const D = DIMP[DIM], x = DARENA_X, R = D.arenaR, gy = DARENA_Y;
  for (let dx = -R; dx <= R; dx++) {
    const X = x + dx; for (let y = max(1, gy - 44); y < gy; y++) { tiles[y * WW + X] = AIR; walls[y * WW + X] = 0; }
    tiles[gy * WW + X] = abs(dx) % 6 === 0 ? D.floor : DBRICK; for (let y = gy + 1; y < gy + 4; y++) if (!TP[tiles[y * WW + X]].solid || TP[tiles[y * WW + X]].liquid) tiles[y * WW + X] = D.floor;
  }
  for (const px of [-R + 1, R - 3]) { for (let y = 1; y <= 3; y++) for (let dx = 0; dx < 3; dx++) tiles[(gy - y) * WW + x + px + dx] = DBRICK; dyn(x + px + 1, gy - 4, TORCH); }
  dyn(x, gy - 1, DALTAR); reserve(x - R - 1, x + R + 1, 2);
  mark('arena' + DIM, D.place, D.placeSub, x, gy - 4, 34); SPOTS.altar = { x, y: gy - 1 };
}
function ruinAt(x, gy, mat, wall, key) {
  if (gy < 12 || gy > WH - 12) return;
  for (let dx = -4; dx <= 4; dx++) {
    const X = x + dx;
    for (let y = gy - 7; y < gy; y++) { const i = y * WW + X, edge = abs(dx) === 4 || y === gy - 7, door = abs(dx) === 4 && y >= gy - 4, hole = y === gy - 7 && abs(dx) < 3 && hh(X, y, 3) < .4; tiles[i] = edge && !door && !hole ? mat : AIR; walls[i] = wall; }
    tiles[gy * WW + X] = mat; for (let y = gy + 1; y < gy + 3; y++) if (!TP[tiles[y * WW + X]].solid) tiles[y * WW + X] = mat;
  }
  chestAt(x + 2, gy - 1, key); dyn(x - 1, gy - 6, TORCH); reserve(x - 5, x + 5, 1);
}
// one echo stone at each of a few fixed distances from where you arrive, alternating sides
const ECHO_D = [150, 290, 430, 600, 780, 980, 1200, 1460];
function echoX(i) { let x = SPAWN_X + (i % 2 ? 1 : -1) * round(ECHO_D[i] * (DIM ? 1 : 1.12)), s = i % 2 ? 1 : -1; for (let k = 0; k < 40 && inWindow(x, 8); k++) x += s * 13; return x; }
function echoStones(x0, x1, here) {
  const n = LORE_N[DIM] || 0;
  for (let i = 0; i < n; i++) {
    let x = echoX(i); if (DIM === 3) { const I = gIsleC(floor(x / GCELL)) || gIsleC(floor(x / GCELL) + 1) || gIsleC(floor(x / GCELL) - 1); if (!I) continue; x = I.cx + (I.flat ? 6 : 0); }
    if (!here(x)) continue; const gy = DIM === 3 ? glassTop(x) : groundAt(x); if (gy >= WH - 6) continue;
    for (let y = gy - 3; y < gy; y++) if (tileAt(x, y) !== AIR && !TP[tileAt(x, y)].solid) tiles[y * WW + x] = AIR;
    if (TP[tileAt(x, gy - 1)].solid) continue; dyn(x, gy - 1, ECHOSTONE); ECHOPOS.set((gy - 1) * WW + x, DIM * 100 + i); reserve(x - 1, x + 1, 1);
  }
}
function cinderFinish(x0, x1, here) {
  for (let k = floor(x0 / 110); k <= floor(x1 / 110); k++) { const vx = k * 110 + 20 + floor(hh(k, 1501, SEED) * 70); if (here(vx) && dimBio(vx) === 'kiln' && !inWindow(vx, 20) && hh(k, 1502, SEED) < .6) vent(vx, heights[vx] - 34); }
  for (let k = 0; k < 4; k++) { const x = randi(x0, x1 - 1), y = randi(DEEP_Y - 6, WH - 8); if (tileAt(x, y) === AIR && !inWindow(x, 30)) poolAt(x, y, CINDER, 26, 5); }
  for (let k = 0; k < 2; k++) { const x = randi(x0, x1 - 1), y = randi(heights[x] + 18, DEEP_Y - 12); if (tileAt(x, y) === AIR && !inWindow(x, 30)) poolAt(x, y, CINDER, 16, 3); }
}
function rootFinish(x0, x1, here) {
  // giant glowcaps you can stand on
  for (let x = x0 + randi(2, 10); x < x1; x += randi(14, 30)) {
    if (dimBio(x) !== 'mycel' || inWindow(x, 6) || RESV[x]) continue; const gy = heights[x]; if (!TP[tileAt(x, gy)].solid || tileAt(x, gy - 1) !== AIR && !TP[tileAt(x, gy - 1)].decor) continue;
    const v = randi(0, MUSHI.length - 1), m = MUSHI[v], top = gy - m.h; propC(m.img, x, gy, { lit: 1, light: [.05, .2, .19] });
    for (let dx = -m.r; dx <= m.r; dx++) if (tileAt(x + dx, top) === AIR) tiles[top * WW + x + dx] = CAPFLESH; reserve(x - 1, x + 1, 1);
  }
  // root arches you can walk over or under
  for (let k = floor(x0 / 90); k <= floor(x1 / 90); k++) {
    const ax = k * 90 + 10 + floor(hh(k, 1601, SEED) * 50); if (!here(ax) || dimBio(ax) !== 'rootwood' || hh(k, 1602, SEED) > .5 || inWindow(ax, 50)) continue;
    const span = 18 + floor(hh(k, 1603, SEED) * 18), ht = 8 + floor(hh(k, 1604, SEED) * 7), xa = ax, xb = ax + span;
    for (let x = xa; x <= xb; x++) { const u = (x - xa) / span, g = heights[x], y = round(lerp(heights[xa], heights[xb], u) - sin(u * PI) * ht); for (let th = 0; th < 2; th++) if (y + th < g && tileAt(x, y + th) === AIR) tiles[(y + th) * WW + x] = ROOTWOOD; if (hh(x, k, 12) > .7) for (let j = 2; j < 2 + randi(1, 5); j++) if (tileAt(x, y + j) === AIR && y + j < g - 1) tiles[(y + j) * WW + x] = ROOTHANG; }
  }
  for (let k = 0; k < 3; k++) { const x = randi(x0, x1 - 1), y = randi(heights[x] + 14, WH - 10); if (tileAt(x, y) === AIR && !inWindow(x, 30)) poolAt(x, y, WATER, 20, 4); }
}
function glassFinish(cx, x0, x1, here) {
  // walkways between the islands of the main path
  for (let k = floor(x0 / GCELL) - 1; k <= floor(x1 / GCELL); k++) {
    const I = gIsleC(k); if (!I || !here(I.cx)) continue; let J = null; for (let q = k + 1; q < k + 5 && !J; q++) J = gIsleC(q); if (!J) continue;
    let xa = I.cx + I.a - 2, xb = J.cx - J.a + 2; const ya = isleTop(I, xa), yb = isleTop(J, xb); if (xb - xa <= 4 && abs(ya - yb) <= 1) continue;
    // never steeper than one step a column: a big climb starts early, on the lower island
    const need = min(40, abs(ya - yb) - (xb - xa)); if (need > 0) { if (yb < ya) xa -= need; else xb += need; }
    for (let x = xa; x <= xb; x++) { const y = round(lerp(ya, yb, (x - xa) / max(1, xb - xa))); if (tileAt(x, y) === AIR || TP[tileAt(x, y)].decor) tiles[y * WW + x] = GLASSWALK; }
  }
  // updrafts up to the high islands, and a chest on half of them
  for (let q = floor(x0 / 90) - 1; q <= floor(x1 / 90) + 1; q++) {
    const U = gUpper(q); if (!U || !here(U.cx)) continue;
    for (const s of [1, -1]) { const vx = U.cx + s * (U.a + 3); if (glassTop(vx) < WH - 4 && heights[vx] < WH - 4 && vent(vx, U.ty - 9)) break; }
    if (hh(q, 46, SEED) < .5) { const y = isleTop(U, U.cx) - 1; if (tileAt(U.cx, y) === AIR) chestAt(U.cx, y, 'glassisle'); }
  }
}
// ---------------- saving a world you leave; making the one you enter ----------------
function worldBlob() {
  const p = G.p; return { mods: [encodeMods(), encodeChips(), encodeIdx(PLACED), encodePairs(WMODS), encodeSeen()].join('|'), stn: encodeStn(), respawn: G.respawn ? [G.respawn.x, G.respawn.y] : 0, pos: p ? [r1(p.x), r1(p.y)] : 0,
    drops: (G.drops || []).slice(0, 60).map(d => [d.id, d.n, round(d.x), round(d.y)]) };
}
function loadBlob(b) {
  if (!b) return; const parts = String(b.mods || '').split('|');
  deferMods(parts[0] || ''); applyIdx(parts[2] || '', i => PLACED.add(i));
  applyPairs(parts[3] || '', (i, w) => { if (w >= 0 && w < 64 && (WTEX[w] !== undefined || w === 0)) { WMODS.set(i, w); if (w >= 8) WMODS_PLACED.add(i); const k = chunkOf(i); if (!PEND.walls.has(k)) PEND.walls.set(k, []); PEND.walls.get(k).push([i, w]); } });
  applyChips(parts[1] || ''); decodeSeen(parts[4] || '');
  if (Array.isArray(b.stn)) for (const o of b.stn) if (o && o.i >= 0 && o.i < WW * WH) { const k = chunkOf(o.i); if (!PEND.stn.has(k)) PEND.stn.set(k, []); PEND.stn.get(k).push(o); }
}
function settlePlaced() { for (const i of PLACED) if (chunkReadyAt(i % WW)) SUP.set(i, 99); const xs = new Set([...PLACED].filter(i => chunkReadyAt(i % WW)).map(i => i % WW)); for (const x of xs) supRecalc(x, (([...PLACED].find(i => i % WW === x)) / WW) | 0); }
function switchDim(d) {
  const p = G.p; DSTASH[DIM] = worldBlob();
  Object.assign(G, { enemies: [], projs: [], drops: [], npcs: [], boss: null, duel: null, fires: [], smokes: [], stuck: [], falling: [], felled: [], rubble: [], autoDoors: [], regrow: [], trails: [], nums: [], ghosts: [], link: null, cine: null, drill: null, dialog: null, spawnT: 300, biome: '', dhaz: [], dev: null, devT: 2400 });
  for (const f of G.fighters) if (f !== p) f.gone = true; G.fighters = [p]; G.respawn = null;
  if (d) initDim(d); else initEndless();
  const b = DSTASH[d]; delete DSTASH[d]; loadBlob(b);
  if (b && Array.isArray(b.respawn)) G.respawn = { x: clamp(b.respawn[0] | 0, 1, WW - 2), y: clamp(b.respawn[1] | 0, 1, WH - 2) };
  if (!d) streamTo(SPAWN_X * T, true);
  let px = (SPAWN_X + 2) * T + 1, py = (VIL_Y - 3) * T;
  if (!d && b && Array.isArray(b.pos) && b.pos[0] > 0) { px = b.pos[0]; py = b.pos[1]; }
  streamTo(px, true); settlePlaced();
  p.x = p.px = px; p.y = p.py = py; p.vx = p.vy = 0; p.onGround = false; let n = 0; while (boxHits(p.x, p.y, p.w, p.h) && p.y > 8 && n++ < 60) p.y = p.py = p.y - T;
  if (b && Array.isArray(b.drops)) for (const q of b.drops) if (IT[q[0]]) spawnDrop(q[0], q[1] | 0, q[2], q[3]);
  if (d) G.flags['seen' + d] = true;
  spawnNPCs(); snapCam(); updateSun(); G.dirty = true; G.lastSafe = null; mapReveal();
  if (netHost()) netAfterDim();
}
function enterDim(d, now) {
  if (d === DIM || !DIMP[d] || !G.p || G.p.dead) return;
  if (NET.R) { say('The rift will not open while others share your world.'); sfx('deny'); return; }
  if (netGuest()) { say('The rift answers ' + (COOP.hostName || 'your host') + '. Go together: when they step through, you follow.'); sfx('deny'); return; }
  const first = d && !G.flags['seen' + d];
  const go = () => { switchDim(d); G.state = 'play'; arriveFx(d, first); saveWorld(true); };
  closeUI(); if (now) { go(); return; }
  G.state = 'loading'; G.loadMsg = d ? 'Stepping into ' + DIMP[d].short + '...' : 'Back to the Waking Lands...'; setTimeout(go, 30);
}
function arriveFx(d, first) {
  const p = G.p; G.flash = .9; G.flashCol = d === 1 ? '255,140,70' : d === 2 ? '110,240,190' : d === 3 ? '220,200,255' : '255,230,160'; sfx('tele', 0); sfx('shrine', 0);
  burst(p.x + 3, p.y + 10, 30, ['#b49cff', '#e0d2ff', '#ffffff', DIMP[d].col], 2.4, 46, { glow: 1, g: -.02 });
  if (first) { startCine({ x: p.x + 3, y: p.y, title: DIMP[d].name, sub: DIMP[d].sub, dur: 240 }); unlock('dim' + d); for (const id of DIM_LEADS[d] || []) learn(id, true); G.note = { text: 'New leads in your journal  [J]', t: 0 }; }
  else G.banner = { text: DIMP[d].name, sub: d ? 'the rift closes behind you' : 'home, such as it is', t: 0 };
}
const DIM_LEADS = { 1: ['slagforge', 'tyrant', 'emoon'], 2: ['rootmother', 'starfall'], 3: ['matriarch'] };
// ---------------- the rift: a door to every world you have opened ----------------
function openRift(tx, ty) { if (netGuest()) { say('The rift answers ' + (COOP.hostName || 'your host') + '. When they step through, you follow.'); sfx('deny'); return; } closeUI(); UI.open = 'rift'; UI.rift = { tx, ty }; UI.msg = null; sfx('ui'); G.flags.usedRift = true; }
function drawRiftUI(c) {
  const R0 = UI.rift; if (!R0 || !G.p || abs(R0.tx * T - G.p.x) > 100 || abs(R0.ty * T - G.p.y) > 80) { closeUI(); return; }
  const w = min(VS.uw - 10, 300), h = 188, x = round((VS.uw - w) / 2), y = round((VS.uh - h) / 2) - 10, F = G.flags; panel(c, x, y, w, h, 'THE RIFT'); hit(x, y, w, h, () => { });
  button(c, x + w - 13, y + 1, 12, 10, 'x', () => { closeUI(); sfx('ui'); });
  let yy = y + 16; textS(c, 'Step through to any world you have opened.', x + 8, yy, '#b49cff'); yy += 12;
  for (let d = 0; d < DIMP.length; d++) {
    const D = DIMP[d], open = canEnterDim(d), here = d === DIM;
    button(c, x + 8, yy, w - 16, 14, `${D.name}${here ? '   (here)' : open ? '' : '   sealed'}`, () => { if (here || !open) { sfx('deny'); return; } enterDim(d); }, { off: here || !open });
    yy += 16;
  }
  for (const [key, d] of [['rootkey', 2], ['prismkey', 3]]) if (!F['dim' + d] && hasItem(key)) {
    button(c, x + 8, yy, w - 16, 14, `Attune the ${IT[key].name}`, () => { removeItem(key, 1); F['dim' + d] = true; G.dirty = true; sfx('quest', 0); G.flash = .7; G.flashCol = '200,160,255'; UI.msg = { s: DIMP[d].name + ' is open.', col: '#e0d2ff', t: 150 }; unlock('dim' + d); }, { on: true }); yy += 16;
  }
  yy += 2; const need = !canEnterDim(1) ? 'Cinderdeep opens when the Furnace Gate does.' : !F.dim2 ? 'The Rootdark needs a Rootward Key, forged at a Slagforge.' : !F.dim3 ? 'The Glass Expanse needs a Prism Key.' : 'Every world is open to you.';
  for (const l of wrapText(need, w - 16)) { drawText(c, l, x + 8, yy, '#8b8fa3'); yy += 9; }
  if (UI.msg) { const m = UI.msg; c.globalAlpha = clamp(m.t / 30, 0, 1); textC(c, m.s, x + w / 2, y + h - 12, m.col || '#ffd35a', 1, textO); c.globalAlpha = 1; if (--m.t <= 0) UI.msg = null; }
}
// ---------------- light, sky and air of the other worlds ----------------
function dimSun() {
  const D = DIMP[DIM], s = D.sun, e = G.dev; G.dn = D.dn; let k = 1, r = s[0], g = s[1], b = s[2];
  if (e && e.id === 'eruption') { r = min(1, r + .2 * e.fade + .06 * sin(G.time * .2) * e.fade); g += .04 * e.fade; }
  else if (e && e.id === 'sporebloom') { g += .1 * e.fade; b += .05 * e.fade; r *= 1 - .3 * e.fade; }
  else if (e && e.id === 'shatterstorm') { k = 1 + .25 * e.fade * (hh(G.time >> 2, 1, 3) > .9 ? 1 : 0); }
  G.sun[0] = min(1, r * k); G.sun[1] = min(1, g * k); G.sun[2] = min(1, b * k);
}
function drawDimSky(c, cx, cy) {
  const W = VS.W, H = VS.H, S = VS.s, D = DIMP[DIM], t = G.time;
  const ctx0 = clamp(floor((cx + VS.vw / 2) / T), 0, WW - 1), cty = (cy + VS.vh / 2) / T;
  const under = DIM === 3 ? 0 : smooth((cty - SKYL[ctx0] - 6) / 22), deep = DIM === 3 ? 0 : smooth((cty - DEEP_Y + 10) / 16);
  if (under < 1) {
    const [a, m, bt] = D.sky, bands = 18;
    for (let i = 0; i < bands; i++) { const u = i / (bands - 1), col = u < .6 ? mixc(a, m, u / .6) : mixc(m, bt, (u - .6) / .4); c.fillStyle = rgb(col); c.fillRect(0, floor(i * H / bands), W, ceil(H / bands) + 1); }
    if (DIM === 1) {
      const sx = W * .62 - cx * .01 * S, sy = H * .58, R = H * .34, g = c.createRadialGradient(sx, sy, R * .1, sx, sy, R); g.addColorStop(0, 'rgba(255,170,90,.55)'); g.addColorStop(.4, 'rgba(220,80,40,.25)'); g.addColorStop(1, 'rgba(120,20,10,0)');
      c.fillStyle = g; c.fillRect(sx - R, sy - R, R * 2, R * 2); c.fillStyle = '#ffd3a0'; c.globalAlpha = .7; c.beginPath(); c.arc(sx, sy, R * .16, 0, TAU); c.fill(); c.globalAlpha = 1;
      for (let k = 0; k < 40; k++) { const X = ((hh(k, 1, 7) * W + t * (.2 + hh(k, 2, 7) * .5) * S - cx * .05 * S) % W + W) % W, Y = H - ((hh(k, 3, 7) * H + t * (.3 + hh(k, 4, 7)) * S) % H); c.globalAlpha = .5 + .5 * sin(t * .05 + k); c.fillStyle = k % 3 ? '#ff8a3d' : '#ffd35a'; c.fillRect(round(X), round(Y), S - 1 || 1, S - 1 || 1); }
      c.globalAlpha = 1;
    } else if (DIM === 2) {
      for (let k = 0; k < 50; k++) { const X = ((hh(k, 5, 9) * W + sin(t * .01 + k) * 20 * S - cx * .06 * S) % W + W) % W, Y = ((hh(k, 6, 9) * H - t * (.05 + hh(k, 7, 9) * .15) * S) % H + H) % H; c.globalAlpha = .3 + .4 * sin(t * .03 + k * 2); c.fillStyle = k % 4 ? '#6ff0c0' : '#c8fff0'; c.fillRect(round(X), round(Y), S - 1 || 1, S - 1 || 1); }
      c.globalAlpha = 1;
    } else {
      for (const s of stars) { c.globalAlpha = .55 + .45 * sin(t * .03 + s[2]); c.fillStyle = s[3] > 1 ? '#e0d2ff' : '#fff'; c.fillRect(floor(s[0] * W), floor(s[1] * H * 1.2), s[3] * (S - 1) || 1, s[3] * (S - 1) || 1); }
      for (let k = 0; k < 3; k++) { c.globalAlpha = .1; c.fillStyle = k === 1 ? '#c58cf2' : '#6fb9c9'; for (let X = 0; X < W; X += S * 2) { const y = H * (.18 + .1 * k) + sin(X * .003 + t * .004 + k * 2) * H * .06; c.fillRect(X, y, S * 2, H * .05); } }
      const sx = W * .3 - cx * .008 * S, sy = H * .3, R = H * .1; c.globalAlpha = .9; c.fillStyle = '#ffffff'; c.beginPath(); for (let k = 0; k < 8; k++) { const an = k / 8 * TAU + t * .002, rr = k % 2 ? R * .45 : R; c.lineTo(sx + cos(an) * rr, sy + sin(an) * rr); } c.fill();
      c.globalAlpha = .25; c.strokeStyle = '#e0c8ff'; c.lineWidth = S; for (let k = 0; k < 4; k++) { const an = k * .8 + .3; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + cos(an) * R * 2.4, sy + sin(an) * R * 2.4); c.stroke(); }
      c.globalAlpha = 1;
    }
    const ref = BASE_Y * T, mid = cy + VS.vh * .55, [f1, f2] = D.tone;
    const k1 = DIM === 1 ? 'rust' : DIM === 2 ? 'moor' : 'reach';
    drawLayer(c, k1 + '_far', f1, .2, .07, H * .8 + (ref - mid) * .07 * S, .9 * (1 - under), cx, DIM !== 3, false, .6);
    drawLayer(c, (DIM === 1 ? 'ash' : k1) + '_mid', f2, .15, .16, H * .9 + (ref - mid) * .16 * S, .9 * (1 - under), cx, DIM !== 3, false, .6);
    if (DIM === 3) { const y = round(H * .78 + (BASE_Y * T + 260 - cy) * .45 * S), w = 640 * S, x0 = -(((cx * .22 * S + t * .1 * S) % w) + w) % w; c.globalAlpha = .35; for (let x = x0; x < W; x += w) c.drawImage(BGL.clouds.hi, round(x), y, w, 200 * S); c.globalAlpha = 1; }
  }
  if (under > .01) {
    c.globalAlpha = under; c.fillStyle = rgb(DIM === 1 ? mixc([30, 12, 14], [48, 14, 10], deep) : mixc([10, 20, 24], [6, 14, 18], deep)); c.fillRect(0, 0, W, H); c.globalAlpha = 1;
    const ref = SKYL[ctx0] * T + 400, mid = cy + VS.vh / 2;
    drawLayer(c, 'cave_far', DIM === 1 ? [64, 26, 26] : [24, 46, 50], 0, .08, (ref - mid) * .08 * S, under, cx, false, true);
    drawLayer(c, 'cave_mid', DIM === 1 ? [44, 18, 20] : [16, 34, 36], 0, .2, (ref - mid) * .2 * S, under * .9, cx, false, true);
  }
}
function dimOverlay(c, W, H, cx, cy) {
  if (G.state !== 'play' && G.state !== 'intro') return;
  if (DIM === 3) { const vy = (WH - 60) * T, a = clamp((cy + VS.vh - vy) / 300, 0, .85); if (a > 0) { const g = c.createLinearGradient(0, H * .3, 0, H); g.addColorStop(0, 'rgba(20,10,40,0)'); g.addColorStop(1, `rgba(20,8,44,${a})`); c.fillStyle = g; c.fillRect(0, 0, W, H); } }
  const e = DIM ? G.dev : G.ev; if (!e || e.fade <= .01) return; const f = e.fade;
  if (e.id === 'fog') { c.globalAlpha = .42 * f; c.fillStyle = '#c8c2d4'; c.fillRect(0, 0, W, H); c.globalAlpha = .18 * f; for (let k = 0; k < 4; k++) { const y = H * (.2 + k * .2) + sin(G.time * .004 + k) * H * .05; c.fillStyle = '#ece8f2'; c.fillRect(0, y, W, H * .08); } c.globalAlpha = 1; }
  else if (e.id === 'ashfall') { c.globalAlpha = .16 * f; c.fillStyle = '#6a6474'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  else if (e.id === 'emoon' && G.dn < .5) { c.globalAlpha = .13 * f; c.fillStyle = '#b02020'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  else if (e.id === 'eclipse') { c.globalAlpha = .12 * f; c.fillStyle = '#2a1a5a'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  else if (e.id === 'sporebloom') { c.globalAlpha = .1 * f; c.fillStyle = '#2fb88a'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
  else if (e.id === 'eruption') { c.globalAlpha = .1 * f * (.7 + .3 * sin(G.time * .1)); c.fillStyle = '#ff5a1a'; c.fillRect(0, 0, W, H); c.globalAlpha = 1; }
}
function dimLights(cx, cy) {
  for (const e of G.enemies) { if (e.dead || e.x < cx - 80 || e.x > cx + VS.vw + 80) continue; const L = MOBX[e.type] && MOBX[e.type].stats.glow; if (L) addLight(e.x + e.w / 2, e.y + e.h / 2, L[0], L[1], L[2]); }
  for (const pr of G.projs) if (pr.light) addLight(pr.x, pr.y, pr.light[0], pr.light[1], pr.light[2]);
  for (const z of G.dhaz || []) if (z.light) addLight(z.x, z.y, z.light[0], z.light[1], z.light[2]);
  const b = G.boss; if (b && b.boss && !b.dead) { const L = MOBX[b.type].stats.glow; if (L) { addLight(b.x + b.w / 2, b.y + b.h / 2, L[0], L[1], L[2]); addLight(b.x + b.w / 2, b.y + 4, L[0] * .8, L[1] * .8, L[2] * .8); } }
}
// per-tick upkeep: the void, the air, the worlds' weather and the hidden rules of each place
function tickDims() {
  const p = G.p, F = G.flags; if (!p) return;
  if (F.gateOpen && !F.dim1) F.dim1 = true;
  const mh = 100 + bonusHP(); if (p.maxhp !== mh) { p.maxhp = mh; if (p.hp > mh) p.hp = mh; }
  if (gearHas('regrowth') && !p.dead && p.hp < p.maxhp && p.regenT > 150 && G.time % 24 === 0) p.hp++;
  if (DIM === 3) {
    if (p.onGround && !p.dead && solidAt(floor((p.x + 3) / T), floor((p.y + p.h + 2) / T))) G.lastSafe = { x: p.x, y: p.y };
    if (p.y > (WH - 34) * T && !p.dead) {
      const s = G.lastSafe || { x: (SPAWN_X + 2) * T, y: (VIL_Y - 3) * T }; p.x = p.px = s.x; p.y = p.py = s.y - 4; p.vx = p.vy = 0; snapCam(); G.flash = .6; G.flashCol = '120,80,200'; sfx('tele', 0);
      if (!gearHas('prismatic')) { const dmg = max(8, round(p.maxhp * .18)); p.hp -= dmg; numPop(p.x + 3, p.y - 4, dmg, '#c58cf2'); if (p.hp <= 0) killFighter(p); }
      say('The void spits you back out.');
    }
    for (const e of G.enemies) if (!e.dead && e.y > (WH - 30) * T) e.dead = true;
  }
  dimAmbient(); tickEvents(); tickHazards();
}
function bonusHP() { const F = G.flags; return (F.tyrantDead ? 15 : 0) + (F.rootmotherDead ? 15 : 0) + (F.matriarchDead ? 20 : 0) + (F.shepherdDead ? 10 : 0) + (F.heartUp ? 20 : 0); }
function dimAmbient() {
  if (!DIM || G.time % 3) return; const cx = G.cam.x, cy = G.cam.y, under = realmAt(floor((G.p.x + 3) / T), floor((G.p.y + 10) / T)) !== 'surface';
  if (DIM === 1) { if (Math.random() < .6) P(cx + frand(VS.vw), cy + VS.vh * frand(.5, 1.1), frand(-.2, .2), frand(-.6, -.25), 220, fpick(SPARK), { g: -.002, fr: 1, glow: 1 }); if (!under && Math.random() < .4) P(cx + frand(VS.vw + 40), cy - 4, frand(-.3, -.05), frand(.3, .6), 340, '#8d8794', { g: 0, fr: 1 }); }
  else if (DIM === 2) { if (Math.random() < .5) P(cx + frand(VS.vw), cy + frand(VS.vh), frand(-.15, .15), frand(-.2, .05), 300, fpick(['#6ff0c0', '#2fb8a8', '#c8fff0']), { g: -.0005, fr: .995, glow: 1 }); }
  else if (Math.random() < .5) P(cx + frand(VS.vw), cy + frand(VS.vh), frand(-.1, .1), frand(-.12, .12), 240, fpick(['#ffffff', '#e0d2ff', '#c9fff6']), { g: 0, fr: 1, glow: 1 });
}
// ---------------- art for the other worlds ----------------
const DFOL = {}, MUSHI = [];
function buildDimArt() {
  for (const t of [SLAG, CHARGLASS, CINDERITE, ASHSOIL, MAGMAROCK, BASALT, GLOAM, MYCEL, ROOTWOOD, GLOOMORE, SHADESTONE, PALESTONE, SHARDGLASS, PRISMORE, STARMOSS]) NATURAL.add(t);
  const pal = (p, seed) => (px, py, v) => shade(p, hh(px >> 1, py >> 1, seed + v * 7) * .55 + hh(px, py, seed + v * 13) * .45);
  const SL = ['#3a2426', '#4a2c2c', '#5a3634', '#2a1a1c'], BS = ['#2e323e', '#3a3e4a', '#4a5060', '#22252e'], SH = ['#1e262e', '#28323c', '#34404c', '#141a20'], PL = ['#b8b0c8', '#ccc4da', '#e0daea', '#9a90b0'];
  TEX[SLAG] = genTex((px, py, v) => { const r = hh(px, py, 401 + v); return r > .94 ? '#ff7a2a' : pal(SL, 402)(px, py, v); });
  TEX[BASALT] = genTex((px, py, v) => { const col = (px + v) % 4 === 0 ? '#1a1c24' : (px + v) % 4 === 1 ? BS[2] : pal(BS, 411)(px, py, v); return py % 5 === 4 && hh(px, py, 412 + v) > .5 ? '#1a1c24' : col; });
  TEX[CHARGLASS] = genTex((px, py, v) => { const r = hh(px, py, 421 + v), d = (px + py + v) % 5; return d === 0 ? '#6a5a8a' : r > .9 ? '#b49cd8' : r > .5 ? '#2a2236' : '#1a1424'; });
  TEX[CINDERITE] = genTex((px, py, v) => { const r = hh(px >> 1, py >> 1, 431 + v); return r > .7 ? (hh(px, py, 432) > .5 ? '#ffb070' : '#ff7a2a') : r > .55 ? '#c94a2a' : pal(SL, 433)(px, py, v); });
  TEX[ASHSOIL] = genTex(pal(['#4a3c40', '#5c4c50', '#6e5c5e', '#3a2e32'], 441));
  TEX[MAGMAROCK] = genTex((px, py, v) => { const k = (px * 2 + py * 3 + v * 5) % 9; return k === 0 || (k === 1 && hh(px, py, 5) > .5) ? (hh(px, py, 451 + v) > .4 ? '#ffb347' : '#ff6a2a') : pal(SL, 452)(px, py, v); });
  TEX[GLOAM] = genTex(pal(['#1e262c', '#28323a', '#34404a', '#151b20'], 461));
  TEX[MYCEL] = genTex((px, py, v) => py < 2 ? (hh(px, py, 471 + v) > .4 ? '#6ff0c0' : '#2fb8a8') : hh(px, py, 472 + v) > .93 ? '#4fd8c8' : pal(['#1e262c', '#28323a', '#34404a', '#151b20'], 473)(px, py, v));
  TEX[ROOTWOOD] = genTex((px, py, v) => { const s = (py + (px >> 2) + v) % 3; return s === 0 ? '#5a4034' : hh(px, py, 481 + v) > .85 ? '#8a6a5a' : '#3e2c24'; });
  TEX[GLOOMORE] = genTex((px, py, v) => { const r = hh(px >> 1, py >> 1, 491 + v); return r > .7 ? (hh(px, py, 492) > .5 ? '#8ff5d6' : '#2fb8a8') : r > .58 ? '#1e6a64' : pal(SH, 493)(px, py, v); });
  TEX[SHADESTONE] = genTex(pal(SH, 501));
  TEX[PALESTONE] = genTex((px, py, v) => hh(px, py, 511 + v) > .95 ? '#ffffff' : pal(PL, 512)(px, py, v));
  TEX[SHARDGLASS] = genTex((px, py, v) => { const d = (px - py + 8 + v) % 4; return d === 0 ? '#ffffff' : d === 1 ? '#e0d2ff' : hh(px, py, 521 + v) > .5 ? '#c9b4f0' : '#a58ae0'; });
  TEX[PRISMORE] = genTex((px, py, v) => { const r = hh(px >> 1, py >> 1, 531 + v); return r > .68 ? ['#ff9ad0', '#9ad0ff', '#d0ff9a', '#ffffff'][(px + py + v) & 3] : pal(PL, 532)(px, py, v); });
  TEX[STARMOSS] = genTex((px, py, v) => py < 2 ? (hh(px, py, 541 + v) > .5 ? '#e0d2ff' : '#a58ae0') : pal(PL, 542)(px, py, v));
  TEX[CAPFLESH] = genTex((px, py, v) => py === 0 ? '#c8fff0' : py < 3 ? (hh(px, py, 551 + v) > .75 ? '#c8fff0' : '#2fb8a8') : null);
  TEX[GLASSWALK] = genTex((px, py, v) => py === 0 ? '#ffffff' : py === 1 ? ((px + v) % 3 ? '#c9fff6' : '#8fd0d8') : py === 2 && (px + v) % 4 === 0 ? '#8fd0d8' : null);
  TEX[GLOWSHROOM] = genTex(mask8(['........', '..###...', '.#####..', '#######.', '..#.#...', '..#.#...', '..#.#...', '.##.##..'], (px, py, v) => py < 4 ? (hh(px, py, v) > .6 ? '#c8fff0' : py === 3 ? '#1e6a64' : '#4fd8c8') : '#8a9a8a'));
  TEX[PRISMBLOOM] = genTex(mask8(['...#....', '..###...', '.#.#.#..', '...#....', '..###...', '.#####..', '...#....', '...#....'], (px, py, v) => py < 6 ? ['#ffffff', '#e0c8ff', '#9ad0ff', '#ff9ad0'][(px + py + v) & 3] : '#8a7ab0'));
  TEX[ROOTHANG] = genTex((px, py, v) => (px === 2 || px === 5 || (px === 3 && py > 3)) && hh(px, py, 561 + v) > .2 ? (py % 3 ? '#5a4034' : '#8a6a5a') : null);
  for (const id of [RIFT, ECHOSTONE, SLAGFORGE, WAYGATE, DALTAR]) TEX[id] = TEX[DIRT];
  TEX[DBRICK] = genTex((px, py, v) => { const row = py >> 2, off = row % 2 ? 4 : 0; if (py % 4 === 3 || (px + off + v * 0) % 8 === 0) return '#2a2636'; return hh(px >> 1, py, 571 + v) > .8 ? '#8a84a0' : '#5f5a72'; });
  const wall = (src, a) => src.map(s => { const [c, x] = mk(8, 8); x.drawImage(s, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = `rgba(9,6,24,${a})`; x.fillRect(0, 0, 8, 8); return c; });
  WTEX[W_SLAG] = wall(TEX[SLAG], .5); WTEX[W_ROOT] = wall(TEX[ROOTWOOD], .55); WTEX[W_PALE] = wall(TEX[PALESTONE], .5); WTEX[W_DBRICK] = wall(TEX[DBRICK], .5);
  // the dyn tiles: rift, echo stone, altar, forge, waygate
  const R = (rows, p) => spr(rows, p);
  STN_SPR[RIFT] = { img: R(['...aaaa...', '..abbbba..', '.abcddcba.', 'abcdeedcba', 'abdeffedba', 'abdeffedba', 'abdeffedba', 'abcdeedcba', 'abcddddcba', 'abbcccccba', 'aabbbbbbaa', 'gggggggggg'], { a: '#3f3a4c', b: '#5f5a69', c: '#7a4ad0', d: '#b49cff', e: '#e0d2ff', f: '#ffffff', g: '#2a2636' }), ox: -1, oy: -4 - 0 };
  STN_SPR[WAYGATE] = { img: R(['..aaaa..', '.abccba.', 'abcddcba', 'abdeedba', 'abdeedba', 'abcddcba', 'aabbbbaa', 'gggggggg'], { a: '#3f3a4c', b: '#8a84a0', c: '#7a4ad0', d: '#b49cff', e: '#ffffff', g: '#2a2636' }), ox: 0, oy: 0 };
  STN_SPR[ECHOSTONE] = { img: R(['..aaa...', '.abbba..', '.abcba..', 'abbcbba.', 'abcdcba.', 'abbcbba.', 'abbbbba.', 'gggggggg'], { a: '#3f3a4c', b: '#6a6480', c: '#8ff5e6', d: '#ffffff', g: '#2a2636' }), ox: 0, oy: 0 };
  STN_SPR[DALTAR] = { img: R(['...aaaa...', '..abccba..', '..abddba..', '.aabbbbaa.', '.abbbbbba.', '..abbbba..', '..abbbba..', '.aabbbbaa.', 'gggggggggg'], { a: '#2a2636', b: '#6a6480', c: '#ff8a3d', d: '#fff1a8', g: '#1a1626' }), ox: -1, oy: -1 };
  STN_SPR[SLAGFORGE] = { img: R(['.aaaaaaaa.', 'abbbbbbbba', 'abcccccdba', 'abceeecdba', 'abceffcdba', 'abbbbbbbba', '.ab....ba.', '.aa....aa.'], { a: '#1a1216', b: '#4a2a26', c: '#2a1a1c', d: '#6a3a30', e: '#ff7a2a', f: '#fff1a8' }), ox: -1, oy: 0 };
  // foliage of the other worlds
  const fol = (seed, w, h, fn) => { const Rn = mulberry32(seed), [c, x] = mk(w, h); fn(x, Rn, w, h); return c; };
  DFOL.cinder = [fol(901, 12, 8, (x, Rn) => { for (let k = 0; k < 4; k++) { const bx = 1 + k * 3, ht = 2 + (Rn() * 5 | 0); x.fillStyle = '#3a3034'; x.fillRect(bx, 8 - ht, 1, ht); x.fillStyle = Rn() < .5 ? '#ff8a3d' : '#ffd35a'; x.fillRect(bx, 8 - ht - 1, 1, 1); } }),
    fol(902, 10, 6, (x, Rn) => { for (let k = 0; k < 5; k++) { x.fillStyle = k % 2 ? '#5a4c50' : '#7a6a6a'; x.fillRect(k * 2, 6 - (1 + (Rn() * 3 | 0)), 2, 6); } })];
  DFOL.root = [fol(911, 14, 12, (x, Rn) => { for (let k = 0; k < 5; k++) { let X = 7, Y = 11; const a0 = -PI / 2 + (k - 2) * .4, len = 6 + Rn() * 6; for (let i = 0; i < len; i++) { X += cos(a0 + i * .05); Y += sin(a0); x.fillStyle = i > len - 2 ? '#c8fff0' : '#2fb8a8'; x.fillRect(round(X), round(Y), 1, 1); } } }),
    fol(912, 12, 9, (x, Rn) => { for (let k = 0; k < 3; k++) { const bx = 1 + k * 4, ht = 2 + (Rn() * 5 | 0); x.fillStyle = '#8a9a8a'; x.fillRect(bx + 1, 9 - ht, 1, ht); x.fillStyle = '#4fd8c8'; x.fillRect(bx, 9 - ht - 1, 3, 1); x.fillStyle = '#c8fff0'; x.fillRect(bx + 1, 9 - ht - 2, 1, 1); } })];
  DFOL.glass = [fol(921, 12, 11, (x, Rn) => { for (let k = 0; k < 4; k++) { const bx = 1 + k * 3, ht = 3 + (Rn() * 8 | 0); for (let Y = 0; Y < ht; Y++) { x.fillStyle = Y === 0 ? '#ffffff' : Y < 3 ? '#e0d2ff' : '#a58ae0'; x.fillRect(bx, 11 - ht + Y, 2, 1); } } }),
    fol(922, 10, 7, (x, Rn) => { for (let k = 0; k < 5; k++) { x.fillStyle = ['#ff9ad0', '#9ad0ff', '#e0d2ff'][k % 3]; x.fillRect(k * 2, 7 - (1 + (Rn() * 4 | 0)), 1, 7); } })];
  DFOL.over = DFOL.cinder;
  // giant glowcaps
  for (const [hgt, r] of [[9, 3], [12, 4], [15, 5]]) {
    const w = r * 2 * 8 + 8, h = hgt * 8 + 4, [c, x] = mk(w, h), mid = w / 2;
    x.fillStyle = '#6a7a72'; x.fillRect(mid - 3, 10, 6, h - 10); x.fillStyle = '#8a9a8a'; x.fillRect(mid - 2, 10, 2, h - 10); x.fillStyle = '#3a4a44'; x.fillRect(mid + 2, 10, 1, h - 10);
    x.fillStyle = '#1e6a64'; x.beginPath(); x.ellipse(mid, 10, w / 2 - 1, 9, 0, PI, TAU); x.fill(); x.fillStyle = '#2fb8a8'; x.beginPath(); x.ellipse(mid, 9, w / 2 - 3, 7, 0, PI, TAU); x.fill();
    x.fillStyle = '#c8fff0'; for (let k = 0; k < r * 3; k++) x.fillRect(mid - w / 2 + 6 + ((k * 37) % (w - 12)), 3 + ((k * 13) % 5), 2, 1);
    x.fillStyle = '#4fd8c8'; x.fillRect(4, 9, w - 8, 1);
    MUSHI.push({ img: c, h: hgt, r });
  }
}
