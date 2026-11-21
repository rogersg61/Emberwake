// ============================================================
//  More places: blessing stones, windmills, wrecks, beast dens,
//  hamlets, hollow forts, fallen castles, sand pyramids, frozen
//  temples, the Sunken Halls, miners' camps, crawler nests and sky
//  shrines. Places with guards keep them until they are beaten, and
//  a blessing stone lends you a blessing for a while.
//  A world made before these existed keeps the land you have seen
//  exactly as it was: new places only grow where you have not been.
// ============================================================
const OBELISK = 91, SPIKES = 92, COBWEB = 93;
defT(OBELISK, { name: 'Blessing Stone', dyn: true, hard: Infinity, light: [.3, .26, .55], dust: '#a58ae0' });
defT(SPIKES, { name: 'Old Spikes', decor: true, hard: 1, ground: true, dust: '#8d8794' });
defT(COBWEB, { name: 'Cobweb', decor: true, hard: 1, dust: '#e6e6f0' });
Object.assign(PLUCK, { [SPIKES]: [['fittings', 1, 2]], [COBWEB]: [['twine', 0, 1]] });
Object.assign(LOOT_T, {
  hamlet: [['jerky', .6, 2, 4], ['berries', .5, 2, 6], ['stew', .3, 1, 2], ['twine', .5, 2, 5], ['cloth', .4, 1, 3], ['leather', .3, 1, 2], ['torch', .6, 3, 6], ['copper_bar', .3, 1, 3], ['tin_bar', .25, 1, 2], ['salve', .3, 1, 2], ['fieldmap', .08, 1, 1], ['satchel', .06, 1, 1], ['scroll', .05, 1, 1]],
  tools: [['copper_pick', .2, 1, 1], ['bronze_axe', .15, 1, 1], ['copper_hammer', .15, 1, 1], ['bronze_shovel', .12, 1, 1], ['fittings', .6, 2, 6], ['iron_bar', .3, 1, 2], ['whetstone', .4, 1, 1], ['rope', .5, 1, 3], ['chain', .25, 1, 2]],
  mill: [['ration', .5, 1, 3], ['jerky', .5, 2, 4], ['salt', .5, 2, 5], ['berries', .5, 2, 5], ['rope', .4, 1, 2], ['twine', .5, 2, 4], ['cloth', .3, 1, 2], ['tea', .3, 1, 2], ['torch', .5, 2, 5]],
  fort: [['arrow', .6, 8, 16], ['iron_bar', .5, 1, 3], ['steel_bar', .2, 1, 2], ['salve', .5, 1, 2], ['jerky', .5, 2, 4], ['hollow_ash', .5, 1, 3], ['smoke', .3, 2, 4], ['shuriken', .35, 3, 6], ['iron_sabre', .1, 1, 1], ['iron_daggers', .1, 1, 1], ['steel_spear', .06, 1, 1], ['chain', .2, 1, 2], ['leather', .4, 1, 3]],
  castle: [['steel_bar', .5, 1, 3], ['iron_bar', .5, 2, 4], ['ember_bar', .15, 1, 1], ['salve', .5, 1, 3], ['poultice', .3, 1, 2], ['scroll', .3, 1, 1], ['steel_longsword', .12, 1, 1], ['steel_halberd', .1, 1, 1], ['steel_greataxe', .08, 1, 1], ['iron_flail', .1, 1, 1], ['glass_sabre', .06, 1, 1], ['steel_head', .1, 1, 1], ['steel_body', .07, 1, 1], ['compass', .1, 1, 1], ['spyglass', .1, 1, 1], ['lantern', .1, 1, 1]],
  pyramid: [['salt', .6, 2, 5], ['glass', .5, 1, 3], ['scale', .4, 1, 3], ['bronze_bar', .4, 1, 3], ['tin_bar', .3, 1, 3], ['shard', .5, 1, 3], ['venom', .3, 1, 2], ['skyglass', .2, 1, 2], ['geode_core', .1, 1, 1], ['scroll', .25, 1, 1], ['bronze_kama', .15, 1, 1], ['glass_sai', .08, 1, 1], ['glass_glaive', .06, 1, 1], ['spyglass', .08, 1, 1]],
  temple: [['snow', .6, 3, 8], ['skyglass', .4, 1, 3], ['shard', .5, 1, 3], ['glass', .4, 1, 3], ['salve', .4, 1, 2], ['scroll', .2, 1, 1], ['glass_longbow', .08, 1, 1], ['glass_head', .08, 1, 1], ['glass_body', .06, 1, 1], ['glass_sabre', .06, 1, 1]],
  wreck: [['rope', .6, 1, 3], ['cloth', .5, 1, 3], ['twine', .5, 2, 5], ['chain', .3, 1, 2], ['fittings', .5, 2, 5], ['salt', .4, 2, 4], ['lurker_oil', .3, 1, 2], ['jug', .3, 1, 1], ['iron_bar', .3, 1, 2], ['compass', .1, 1, 1], ['spyglass', .08, 1, 1], ['bone_trident', .1, 1, 1]],
  den: [['bone', .7, 2, 6], ['hide', .5, 1, 3], ['tusk', .3, 1, 2], ['meat', .5, 1, 3], ['scale', .3, 1, 2], ['chitin', .3, 1, 2], ['membrane', .3, 1, 2], ['venom', .25, 1, 1], ['bone_claws', .12, 1, 1], ['chitin_claws', .08, 1, 1], ['bone_head', .1, 1, 1]],
  dungeon: [['shard', .6, 1, 3], ['iron_bar', .5, 1, 3], ['steel_bar', .3, 1, 2], ['salve', .5, 1, 2], ['poultice', .3, 1, 2], ['whetstone', .3, 1, 1], ['venomcoat', .15, 1, 1], ['iron_sabre', .12, 1, 1], ['steel_claws', .08, 1, 1], ['deep_greatsword', .05, 1, 1], ['deep_warhammer', .05, 1, 1], ['deep_head', .05, 1, 1], ['emberlamp', .06, 1, 1]],
  library: [['scroll', .45, 1, 1], ['cloth', .5, 1, 3], ['glue', .4, 1, 2], ['fieldmap', .15, 1, 1], ['compass', .1, 1, 1], ['tea', .4, 1, 2], ['salve', .3, 1, 1]],
  armory: [['iron_shortsword', .2, 1, 1], ['iron_spear', .2, 1, 1], ['iron_battleaxe', .15, 1, 1], ['steel_sword', .1, 1, 1], ['iron_head', .15, 1, 1], ['iron_body', .1, 1, 1], ['arrow', .6, 10, 20], ['shuriken', .4, 3, 8], ['whetstone', .4, 1, 2]],
  mcamp: [['coal', .6, 2, 6], ['iron_ore', .5, 2, 6], ['tin_ore', .4, 2, 5], ['copper_ore', .5, 2, 6], ['torch', .7, 3, 8], ['rope', .4, 1, 2], ['charge', .3, 1, 2], ['ration', .4, 1, 2], ['bronze_pick', .12, 1, 1], ['iron_shovel', .08, 1, 1], ['miners_helm', .15, 1, 1]],
  nest: [['twine', .6, 2, 6], ['venom', .5, 1, 2], ['chitin', .5, 1, 3], ['membrane', .4, 1, 2], ['bone', .5, 1, 4], ['salve', .3, 1, 1], ['venomcoat', .15, 1, 1], ['chitin_head', .08, 1, 1]],
  sky2: [['skysilk', .7, 2, 5], ['skyglass', .4, 1, 2], ['membrane', .4, 1, 2], ['shard', .5, 1, 2], ['salve', .3, 1, 1], ['glider', .1, 1, 1], ['glass_glaive', .06, 1, 1]]
});

// ---------------- what the new tiles look like ----------------
function buildPlaceArt() {
  TEX[SPIKES] = genTex((px, py, v) => {
    if (py === 7) return '#2a2636'; if (py === 6) return (px + v) % 2 ? '#5f5a69' : '#4a4458';
    const k = (px + v) % 3; if (k === 1 && py >= 1) return py === 1 ? '#ffffff' : py < 3 ? '#cfd6e0' : py < 5 ? '#8d8794' : '#5f5a69';
    if (k === 0 && py >= 3 && (px + v) % 6 === 0) return py === 3 ? '#b8b2c0' : '#6f6a85'; return null;
  });
  TEX[COBWEB] = genTex((px, py, v) => {
    const cx = v & 1 ? 0 : 7, cy = v & 2 ? 0 : 7, dx = px - cx, dy = py - cy, r = hypot(dx, dy);
    if (r > 9.5) return null; if (dx === 0 || dy === 0 || abs(dx) === abs(dy)) return r < 3 ? '#f4f4fa' : '#c9c9d8';
    if (abs(r - 3.2) < .45 || abs(r - 6.4) < .45 || abs(r - 9) < .4) return '#a8a8bc'; return null;
  });
  TEX[OBELISK] = TEX[DIRT];
  STN_SPR[OBELISK] = { img: spr(['...aa....', '..abba...', '..abba...', '.abbbba..', '.abccba..', '.abcdba..', '.abcdba..', '.abccba..', '.abbbba..', '.abcbba..', '.abdcba..', '.abccba..', '.abbbba..', '.abbbba..', '.abcbba..', '.abbbba..', 'aabbbbaa.', 'abbbbbbba', 'abbbbbbba', 'ggggggggg'],
    { a: '#2a2636', b: '#6a6480', c: '#9a7ae8', d: '#ffffff', g: '#3f3a4c' }), ox: -1, oy: -12 };
  // a windmill's sails, drawn in front of its tower
  { const [c, x] = mk(52, 52); x.translate(26, 26);
    for (let k = 0; k < 4; k++) {
      x.save(); x.rotate(k * PI / 2 + .35); x.fillStyle = '#4a3220'; x.fillRect(-1, -25, 2, 25);
      for (let s = 0; s < 6; s++) { x.fillStyle = s % 2 ? '#d8c8a0' : '#c4b088'; x.fillRect(1, -24 + s * 3.6, 7, 3); x.fillStyle = '#7a5a40'; x.fillRect(1, -24 + s * 3.6 + 3, 7, .6); }
      x.fillStyle = '#5a4030'; x.fillRect(8, -24, 1, 22); x.restore();
    }
    x.fillStyle = '#2a1c18'; x.fillRect(-3, -3, 6, 6); x.fillStyle = '#7a5a40'; x.fillRect(-2, -2, 4, 4); SAILS = outlined(c); }
}
let SAILS = null;

// ---------------- worlds made before these places ----------------
// [x0, x1] of everything a saved world had seen or changed, read straight from its save string
function legacyRange(mods) {
  const parts = String(mods || '').split('|'); let a = Infinity, b = -Infinity;
  if (parts[0]) { let i = 0; for (const s of parts[0].split(',')) { const d = parseInt(s.split('.')[0], 36); if (!isFinite(d)) continue; i += d; const x = i % WW; if (x < a) a = x; if (x > b) b = x; } }
  if (parts[4]) for (const part of parts[4].split(';')) { const mk = parseInt(part.split(':')[0], 36); if (!(mk >= 0)) continue; a = min(a, mk * 64 * MAPS); b = max(b, (mk + 1) * 64 * MAPS); }
  return a <= b ? [a - 160, b + 160] : null;
}
function legacyOf(data) {
  const L = {}; if (!data) return L; const r0 = legacyRange(data.mods); if (r0) L[data.dim | 0] = r0;
  if (data.dims && typeof data.dims === 'object') for (const k in data.dims) { const r = data.dims[k] && legacyRange(data.dims[k].mods); if (r && DIMP[k | 0] !== undefined) L[k | 0] = r; }
  return L;
}
function cleanLegacy(L) { const o = {}; if (L && typeof L === 'object') for (const k in L) if (Array.isArray(L[k]) && isFinite(L[k][0]) && isFinite(L[k][1])) o[k | 0] = [+L[k][0], +L[k][1]]; return o; }
// stones you used in the last while, so they stay resting after a reload
function blessKeep() { const o = {}; for (const k in G.blessUsed || {}) if (G.played - G.blessUsed[k] < BLESS_CD) o[k] = round(G.blessUsed[k]); return o; }
const newLand = x => { const r = WORLD.legacy && WORLD.legacy[DIM]; return !r || x < r[0] || x > r[1]; };
// the places are worked out once per cell and remembered until the world (or the world you stand in) changes
const PLC = new Map();
const pmemo = (key, fn) => { if (PLC.has(key)) return PLC.get(key); const v = fn(); PLC.set(key, v); return v; };
// builders draw from their own dice, so the rest of the land around them comes out the same
function withRng(seed, fn) { const keep = rng; rng = mulberry32(seed >>> 0); try { return fn(); } finally { rng = keep; } }

// ---------------- where the new places go ----------------
const SKINDS2 = {
  moor: ['hut', 'camp', 'circle', 'tower', 'well', 'graves', 'shrine', 'mill', 'mill', 'den'], thorn: ['camp', 'hut', 'tower', 'circle', 'shrine', 'den', 'den'],
  reach: ['camp', 'circle', 'tower', 'shrine', 'shrine', 'den'], fen: ['stilt', 'stilt', 'hut', 'wreck', 'shrine'], dunes: ['dune', 'well', 'graves', 'wreck', 'wreck', 'shrine'],
  scoria: ['tower', 'dune', 'graves', 'camp', 'shrine', 'den'], ash: ['graves', 'camp', 'circle', 'shrine', 'den']
};
const BKINDS = { moor: ['hamlet', 'hamlet', 'fort', 'castle'], thorn: ['fort', 'fort', 'hamlet', 'castle'], reach: ['temple', 'temple', 'castle', 'hamlet'], fen: ['hamlet', 'fort'], dunes: ['pyramid', 'pyramid', 'fort'], scoria: ['fort', 'castle', 'pyramid'], ash: ['fort', 'castle', 'fort'] };
const BHALF = { hamlet: 31, fort: 27, castle: 35, pyramid: 25, temple: 17 }, BIGW = 560, DEEPW = 700, CAMPW = 330;
const nearEcho = (x, r) => { for (let i = 0; i < (LORE_N[DIM] || 0); i++) if (abs(echoX(i) - x) < r) return true; return false; };
function bigOf(k) {
  return pmemo('b' + k, () => {
    if (DIM || WORLD.arena || hh(k, 1100, SEED) > .62) return null;
    const x = k * BIGW + 80 + floor(hh(k, 1101, SEED) * 400), kinds = BKINDS[biomeE(x)]; if (!kinds) return null;
    const kind = kinds[floor(hh(k, 1102, SEED) * kinds.length)], w = BHALF[kind];
    if (!newLand(x - w - 10) || !newLand(x + w + 10) || inWindow(x, w + 30) || abs(x - SPAWN_X) < 300 || nearEcho(x, w + 8) || biomeE(x - w) !== biomeE(x) || biomeE(x + w) !== biomeE(x)) return null;
    let lo = 1e9, hi = -1e9; for (let o = -w; o <= w; o += 3) { if (lakeAt(x + o)) return null; const s = surf(x + o); lo = min(lo, s); hi = max(hi, s); }
    if (hi - lo > (kind === 'pyramid' ? 10 : 7)) return null;
    return { x, kind, w };
  });
}
function bigNear(x, pad) { const k = floor(x / BIGW); for (const q of [k - 1, k, k + 1]) { const s = bigOf(q); if (s && abs(x - s.x) < s.w + pad) return s; } return null; }
const surfaceTubes = x => { for (const s of [floor(x / 260) - 1, floor(x / 260), floor(x / 260) + 1]) { const tx = s * 260 + 40 + floor(hh(s, 1011, SEED) * 180); if (hh(s, 1001, SEED) < .45 && abs(tx - x) < 70) return true; } for (const s of [floor(x / 400) - 1, floor(x / 400), floor(x / 400) + 1]) { const vx = s * 400 + 30 + floor(hh(s, 1031, SEED) * 330); if (hh(s, 1003, SEED) < .4 && abs(vx - x) < 40) return true; } for (const s of [floor(x / 300) - 1, floor(x / 300), floor(x / 300) + 1]) { const gx = s * 300 + 40 + floor(hh(s, 1021, SEED) * 220); if (hh(s, 1002, SEED) < .4 && abs(gx - x) < 40) return true; } return false; };
function deepOf(k) {
  return pmemo('d' + k, () => {
    if (DIM || WORLD.arena || hh(k, 1200, SEED) > .55) return null;
    const x = k * DEEPW + 100 + floor(hh(k, 1201, SEED) * 480), gy = surf(x);
    if (!newLand(x - 40) || !newLand(x + 40) || inWindow(x, 60) || abs(x - SPAWN_X) < 220 || nearEcho(x, 10) || lakeAt(x) || lakeAt(x - 6) || lakeAt(x + 6) || surfaceTubes(x) || bigNear(x, 16)) return null;
    for (const o of [-5, -3, 3, 5]) if (abs(surf(x + o) - gy) > 3) return null;
    for (let q = floor(x / 150) - 1; q <= floor(x / 150) + 1; q++) { const s = structOf(q); if (s && abs(s.x - x) < 24) return null; }
    const y = gy + 30 + floor(hh(k, 1202, SEED) * 26); if (y + 16 > DEEP_Y - 8) return null;
    return { x, y, gy };
  });
}
function campOf(k) {
  return pmemo('c' + k, () => {
    if (DIM || WORLD.arena || hh(k, 1300, SEED) > .5) return null;
    const x = k * CAMPW + 60 + floor(hh(k, 1301, SEED) * 210), kind = hh(k, 1302, SEED) < .6 ? 'mcamp' : 'nest';
    if (!newLand(x - 20) || !newLand(x + 20) || inWindow(x, 30) || abs(x - SPAWN_X) < 140 || surfaceTubes(x)) return null;
    for (const q of [floor(x / DEEPW) - 1, floor(x / DEEPW), floor(x / DEEPW) + 1]) { const d = deepOf(q); if (d && abs(d.x - x) < 50) return null; }
    const y = surf(x) + 24 + floor(hh(k, 1303, SEED) * 50); if (y > DEEP_Y - 14) return null;
    return { x, y, kind };
  });
}
// trees and grass keep off the new places
function placeReserved(x) { if (DIM || WORLD.arena) return false; if (bigNear(x, 4)) return true; const k = floor(x / DEEPW); for (const q of [k - 1, k, k + 1]) { const d = deepOf(q); if (d && abs(d.x - x) < 7) return true; } return false; }
function placesFinish(cx, x0, x1, here) {
  if (DIM || WORLD.arena) return;
  for (let k = floor(x0 / BIGW) - 1; k <= floor(x1 / BIGW) + 1; k++) { const s = bigOf(k); if (s && here(s.x)) withRng(hh(s.x, 1150, SEED) * 4294967296, () => BIG_B[s.kind](s.x, s)); }
  for (let k = floor(x0 / DEEPW) - 1; k <= floor(x1 / DEEPW) + 1; k++) { const s = deepOf(k); if (s && here(s.x)) withRng(hh(s.x, 1250, SEED) * 4294967296, () => dungeon(s.x, s.y)); }
  for (let k = floor(x0 / CAMPW) - 1; k <= floor(x1 / CAMPW) + 1; k++) { const s = campOf(k); if (s && here(s.x)) withRng(hh(s.x, 1350, SEED) * 4294967296, () => (s.kind === 'nest' ? nest : mcamp)(s.x, s.y)); }
}

// ---------------- building blocks ----------------
// rows of characters, top to bottom; each character names a tile, [tile, wall], or a function(x, y)
function bp(x0, y0, rows, L) {
  for (let r = 0; r < rows.length; r++) for (let c = 0; c < rows[r].length; c++) {
    const s = L[rows[r][c]]; if (s === undefined) continue; const x = x0 + c, y = y0 + r; if (!inW(x, y)) continue; const i = y * WW + x;
    if (typeof s === 'function') { s(x, y, i); continue; }
    const t = Array.isArray(s) ? s[0] : s, w = Array.isArray(s) ? s[1] : undefined;
    if (t !== null && t !== undefined) { if (TP[tiles[i]].dyn) tileObjs.delete(i); if (TP[t].dyn) dyn(x, y, t); else tiles[i] = t; }
    if (w !== undefined) walls[i] = w;
  }
}
const setT = (x, y, t, w) => { if (!inW(x, y)) return; const i = y * WW + x; if (TP[tiles[i]].dyn) tileObjs.delete(i); if (TP[t].dyn) dyn(x, y, t); else tiles[i] = t; if (w !== undefined) walls[i] = w; };
const small = () => { LANDMARKS[LANDMARKS.length - 1].small = 1; };
const lampAt = (x, ry, col) => hang(PROP.lamp, x, ry, { light: col || [.85, .58, .3] });
// carve an oval room into the rock
function oval(cx, cy, rx, ry, w) { for (let y = cy - ry; y <= cy + ry; y++) for (let x = cx - rx; x <= cx + rx; x++) { if (!inW(x, y) || tiles[y * WW + x] === BEDROCK) continue; const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (d <= 1) { setT(x, y, AIR, w); } } }
const floorAt = (x, y0, y1) => { for (let y = y0; y <= y1; y++) if (solidAt(x, y)) return y; return -1; };

// ---------------- small places (one per stretch of land, like huts and camps) ----------------
Object.assign(STRUCT_B, {
  shrine(x) {
    return withRng(hh(x, 1401, SEED) * 4294967296, () => {
      const gy = flatten(x - 7, x + 7, DIRT);
      bp(x - 5, gy - 2, ['.....O.....', '..CCCCCCC..', 'ccccccccccc'], { '.': [AIR, 0], O: [OBELISK, 0], C: CUTSTONE, c: COBBLE });
      propC(PROP.post, x - 4, gy, { light: [.6, .5, .95], lyo: 2 }); propC(PROP.post, x + 4, gy, { light: [.6, .5, .95], lyo: 2 });
      for (const dx of [-6, -5, 5, 6]) if (tileAt(x + dx, gy - 1) === AIR) tiles[(gy - 1) * WW + x + dx] = dx % 2 ? FLOWER : TALLGRASS;
      mark('o' + x, 'A BLESSING STONE', 'touch it [F]', x, gy - 5, 9); small(); return true;
    });
  },
  mill(x) {
    return withRng(hh(x, 1402, SEED) * 4294967296, () => {
      const gy = flatten(x - 6, x + 8, DIRT), x0 = x - 2; tower(x0, gy, 5, 15, { name: 'mill' });
      dyn(x0 + 2, gy - 1, QUERN); propC(PROP.sacks, x0 + 1, gy); chestAt(x0 + 3, gy - 13, 'mill'); propC(PROP.sacks, x0 + 1, gy - 12); lampAt(x0 + 2, gy - 7);
      if (SAILS) FGP.push({ img: SAILS, x: (x0 + 2) * T + 4 - 26, y: (gy - 15) * T - 26, lit: 1 });
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const fx = x0 + 2 + s * (5 + k); if (tileAt(fx, gy - 1) === AIR) tiles[(gy - 1) * WW + fx] = k % 2 ? TALLGRASS : BERRY; }
      mark('m' + x, 'AN OLD WINDMILL', 'its sails stopped long ago', x0 + 2, gy - 8, 9); small(); return true;
    });
  },
  wreck(x) {
    return withRng(hh(x, 1403, SEED) * 4294967296, () => {
      const dunes = biomeE(x) === 'dunes', gy = flatten(x - 12, x + 12, dunes ? SAND : MUD), sink = dunes ? 3 : 1, top = gy + sink - 7;
      bp(x - 10, top, [
        '..........M..........',
        '..........M..........',
        'PP........M........PP',
        'PP========M=========P',
        '.P,,,,,,,,M,,,,,,,,P.',
        '..P,,C,,,,M,,,,BB,P..',
        '...PPPPPPPPPPPPPPP...'], { '.': [AIR, 0], P: [PLANK, W_PLANK], '=': [BEAMH, W_PLANK], ',': [AIR, W_PLANK], M: [BEAM, W_PLANK], C: (tx, ty) => { walls[ty * WW + tx] = W_PLANK; chestAt(tx, ty, 'wreck'); }, B: [BONES, W_PLANK] });
      // the deck stands clear of the sand; the hold is half under it
      for (let tx = x - 10; tx <= x + 10; tx++) for (let y = top - 8; y < top + 3; y++) if (inW(tx, y) && (TP[tiles[y * WW + tx]].solid || TP[tiles[y * WW + tx]].decor) && !walls[y * WW + tx] && y < top + 3 && tiles[y * WW + tx] !== PLANK && tiles[y * WW + tx] !== BEAM) tiles[y * WW + tx] = AIR;
      hang(PROP.banners[1], x - 1, top + 1); hang(PROP.banners[1], x + 1, top + 1); lampAt(x + 4, top + 4, [.7, .5, .3]);
      mark('w' + x, dunes ? 'A SHIP IN THE SAND' : 'A WRECKED BOAT', dunes ? 'how did it get here?' : 'the fen took her', x, top - 1, 11); small(); return true;
    });
  },
  den(x) {
    return withRng(hh(x, 1404, SEED) * 4294967296, () => {
      const b = biomeE(x), gy = groundAt(x - 8), cx = x + 4, cy = gy + 8;
      // a sloping mouth down into the sleeping room
      for (let k = 0; k <= 11; k++) { const tx = x - 8 + k, ty = gy - 1 + floor(k * .75); for (let y = ty - 2; y <= ty; y++) setT(tx, y, AIR, k > 2 ? W_DIRT : 0); }
      oval(cx, cy, 7, 4, W_DIRT);
      for (let tx = cx - 6; tx <= cx + 6; tx++) { const fy = floorAt(tx, cy, cy + 6); if (fy > 0 && tileAt(tx, fy - 1) === AIR && hh(tx, fy, 41) > .55) tiles[(fy - 1) * WW + tx] = hh(tx, fy, 42) > .5 ? BONES : STICKS; }
      for (let y = cy - 4; y <= cy - 1; y++) for (let tx = cx - 7; tx <= cx + 7; tx++) if (tileAt(tx, y) === AIR && (solidAt(tx, y - 1) || solidAt(tx - 1, y) || solidAt(tx + 1, y)) && hh(tx, y, 43) > .55) tiles[y * WW + tx] = COBWEB;
      { const fy = floorAt(cx + 5, cy, cy + 6); if (fy > 0) { setT(cx + 5, fy - 1, AIR); chestAt(cx + 5, fy - 1, 'den'); } }
      const kinds = { thorn: ['thornback', 'thornback', 'thornback'], moor: ['husk', 'thornback', 'thornback'], ash: ['husk', 'husk', 'husk'], scoria: ['rustback', 'rustback', 'rustback'], reach: ['mite', 'mite', 'mite', 'mite'] }[b] || ['husk', 'husk'];
      const g = []; kinds.forEach((t, i) => { const tx = cx - 4 + i * 3, fy = floorAt(tx, cy, cy + 6); if (fy > 0) g.push([t, tx, fy]); });
      lair('den', cx, cy, g, { done: 'THE DEN IS QUIET', sub: 'whatever slept there, sleeps for good' });
      mark('n' + x, 'A BEAST DEN', 'something sleeps inside', cx, cy - 2, 10); small(); return true;
    });
  }
});

// ---------------- big places (one in a long stretch of land) ----------------
const BIG_B = {
  hamlet(x) {
    const x0 = x - 29, gy = flatten(x0 - 2, x + 31, DIRT), A = x0 + 1, B = x0 + 18, C = x0 + 43, F0 = x0 + 31, F1 = x0 + 39;
    house(A, gy, 9, 5, 3, { door: 2, chimney: -1, name: 'hamlet' });
    propAt(PROP.bed, A + 1, gy); propAt(PROP.table, A + 4, gy); propC(PROP.chair, A + 3, gy); chestAt(A + 7, gy - 1, 'hamlet'); lampAt(A + 4, gy - 5);
    STRUCT_B.well(x0 + 13);
    house(B, gy, 11, 8, 3, { door: 2, floors: 2, chimney: 1, roof: '#3a6f76', roof2: '#4fb0b8', name: 'hamlet' });
    dyn(B + 2, gy - 1, LOOM); dyn(B + 6, gy - 1, CAULDRON); propAt(PROP.shelf, B + 8, gy); lampAt(B + 5, gy - 3);
    propAt(PROP.bed, B + 1, gy - 4); chestAt(B + 9, gy - 5, 'hamlet'); propC(PROP.stool, B + 6, gy - 4); lampAt(B + 5, gy - 8, [.8, .55, .28]);
    for (let tx = F0; tx <= F1; tx++) { tiles[gy * WW + tx] = DIRT; tiles[(gy - 1) * WW + tx] = tx === F0 || tx === F1 ? AIR : [BERRY, TALLGRASS, BERRY, BUSH][(tx - F0) % 4]; }
    fgOn(PROP.fence, F0, gy, { lit: 1 }); fgOn(PROP.fence, F1, gy, { lit: 1 });
    house(C, gy, 9, 5, 3, { door: 2, stone: true, chimney: 1, roof: '#3f3a4c', roof2: '#514c62', name: 'hamlet' });
    dyn(C + 2, gy - 1, ANVIL); propC(PROP.barrel, C + 5, gy); chestAt(C + 7, gy - 1, 'tools'); lampAt(C + 4, gy - 5, [.9, .6, .3]);
    if (rand() < .5) { setT(x0 + 55, gy - 1, OBELISK); propC(PROP.post, x0 + 57, gy, { light: [.6, .5, .95], lyo: 2 }); }
    reserve(x0 - 2, x + 31, 2); mark('h' + x, 'AN EMPTY HAMLET', 'the hearths are cold', x, gy - 9, 32); return true;
  },
  fort(x) {
    const gy = flatten(x - 27, x + 27, DIRT), L = x - 25, R = x + 25;
    for (let tx = L + 1; tx < R; tx++) for (let y = gy - 5; y < gy; y++) walls[y * WW + tx] = W_LOG;
    for (const px of [L, R]) { for (let y = gy - 6; y < gy; y++) setT(px, y, y >= gy - 3 ? DOORC : LOGWALL, W_LOG); setT(px, gy - 7, SPIKES); }
    tower(L + 3, gy, 5, 13, { name: 'fort' }); chestAt(L + 6, gy - 14, 'fort'); propC(PROP.crate, L + 4, gy - 13);
    // two lean-to tents
    for (const tx0 of [x - 12, x + 7]) {
      bp(tx0, gy - 7, ['....T....', '...TTT...', '..TT.TT..', '.TT...TT.', '.B.....B.', '.B.....B.', '.B.....B.'], { T: THATCH, B: BEAM });
      dyn(tx0 + 2, gy - 1, BEDROLL); propC(PROP.sacks, tx0 + 6, gy);
    }
    chestAt(x - 6, gy - 1, 'fort'); chestAt(x + 13, gy - 1, 'fort');
    dyn(x, gy - 1, FIRE); dyn(x + 3, gy - 1, RACK); propC(PROP.crate, x - 3, gy); propC(PROP.barrel, x + 17, gy); propC(PROP.barrel, x + 18, gy);
    hang(PROP.banners[2], L + 10, gy - 5); hang(PROP.banners[2], R - 3, gy - 5);
    lair('fort', x, gy, [['hollow', x - 8, gy], ['hollow', x + 5, gy], ['hollow', x + 18, gy], ['captain', x + 1, gy]], { done: 'THE FORT IS TAKEN', sub: 'the hollowborn are gone from it' });
    reserve(L - 1, R + 1, 2); mark('f' + x, 'A HOLLOW FORT', 'the hollowborn hold it', x, gy - 8, 26); return true;
  },
  castle(x) {
    const gy = flatten(x - 35, x + 35, STONE), L = x - 33, R = x + 33;
    for (let tx = L; tx <= R; tx++) tiles[gy * WW + tx] = CUTSTONE;
    tower(L, gy, 7, 22, { ruin: true, name: 'castle' }); tower(R - 6, gy, 7, 22, { ruin: true, name: 'castle' });
    house(x - 9, gy, 19, 10, 5, { stone: true, floors: 2, door: 2, chimney: 1, roof: '#3f3a4c', roof2: '#514c62', name: 'keep' });
    STRUCT_B.well(x - 19);
    // the curtain wall behind both courtyards, with a walk along its top
    for (const [a, b] of [[L + 7, x - 12], [x + 12, R - 7]]) {
      for (let tx = a; tx <= b; tx++) { for (let y = gy - 12; y < gy; y++) { if (tiles[y * WW + tx] !== AIR && !TP[tiles[y * WW + tx]].decor) continue; walls[y * WW + tx] = W_COBBLE; } setT(tx, gy - 12, PLATFORM, W_COBBLE); if ((tx - a) % 2 === 0) setT(tx, gy - 13, COBBLE); }
      for (let y = gy - 12; y < gy; y++) { setT(a, y, LADDER, W_COBBLE); setT(b, y, LADDER, W_COBBLE); }
      hang(PROP.banners[0], a + 4, gy - 11); hang(PROP.banners[0], b - 4, gy - 11); dyn(a + 2, gy - 6, TORCH); dyn(b - 2, gy - 6, TORCH);
    }
    propAt(PROP.rug, x - 3, gy); propC(PROP.chair, x, gy); chestAt(x + 2, gy - 1, 'castle'); for (const k of [0, 1, 2]) hang(PROP.banners[k], x - 6 + k * 6, gy - 3);
    lampAt(x - 4, gy - 4, [.9, .6, .3]); lampAt(x + 4, gy - 4, [.9, .6, .3]);
    for (const k of [0, 1, 2]) propAt(PROP.shelf, x - 7 + k * 5, gy - 4); propAt(PROP.table, x + 6, gy - 4); chestAt(x + 7, gy - 5, 'library'); lampAt(x, gy - 9, [.85, .58, .3]);
    // a cellar under the keep
    for (let tx = x - 7; tx <= x + 7; tx++) for (let y = gy + 1; y <= gy + 8; y++) setT(tx, y, tx === x - 7 || tx === x + 7 || y === gy + 1 || y === gy + 8 ? BRICK : AIR, W_BRICK);
    for (let y = gy; y <= gy + 7; y++) setT(x - 5, y, LADDER, W_BRICK);
    for (const tx of [x - 1, x + 3]) for (let y = gy + 2; y <= gy + 7; y++) setT(tx, y, BEAM, W_BRICK);
    setT(x + 1, gy + 7, BONES); setT(x + 6, gy + 7, BONES); chestAt(x + 5, gy + 7, 'crypt'); dyn(x - 3, gy + 3, TORCH); setT(x - 6, gy + 7, POT);
    // courtyards: a practice post, a weapon rack, stores
    dyn(x + 16, gy - 1, POST); dyn(x + 20, gy - 1, RACK); propC(PROP.barrel, x + 23, gy); propC(PROP.crate, x - 15, gy);
    lair('castle', x, gy, [['hollow', x - 25, gy], ['hollow', x - 15, gy], ['hollow', x + 15, gy], ['hollow', x + 24, gy], ['castellan', x - 2, gy]], { done: 'THE CASTLE IS FREE', sub: 'its last lord is dust' });
    reserve(L - 1, R + 1, 2); mark('k' + x, 'A FALLEN CASTLE', 'its lord still keeps it', x, gy - 14, 36); return true;
  },
  pyramid(x) {
    const gy = flatten(x - 25, x + 25, SAND);
    for (let r = 0; r < 22; r++) { const hw = 22 - r, y = gy - 1 - r; for (let dx = -hw; dx <= hw; dx++) setT(x + dx, y, SANDSTONE, abs(dx) < hw ? W_SAND : 0); }
    for (let tx = x - 22; tx <= x + 22; tx++) tiles[gy * WW + tx] = SANDSTONE;
    // in from the side, down to the hall, up to the stone, down to the dead
    for (let tx = x - 20; tx <= x - 6; tx++) for (let y = gy - 6; y <= gy - 4; y++) setT(tx, y, AIR, W_SAND);
    for (let tx = x - 6; tx <= x + 6; tx++) for (let y = gy - 10; y <= gy - 2; y++) setT(tx, y, AIR, W_SAND);
    for (let tx = x - 6; tx <= x - 4; tx++) for (let y = gy - 3; y <= gy - 3; y++) setT(tx, y, SANDSTONE, W_SAND);
    for (let tx = x - 3; tx <= x + 3; tx++) for (let y = gy - 16; y <= gy - 13; y++) setT(tx, y, AIR, W_SAND);
    for (let y = gy - 15; y <= gy - 2; y++) setT(x + 5, y, LADDER, W_SAND); for (let y = gy - 15; y <= gy - 13; y++) setT(x + 4, y, AIR, W_SAND);
    setT(x, gy - 13, OBELISK, W_SAND); lampAt(x - 2, gy - 16, [.6, .5, .95]);
    for (let tx = x - 9; tx <= x + 9; tx++) for (let y = gy + 3; y <= gy + 8; y++) setT(tx, y, AIR, W_SAND);
    for (let tx = x - 10; tx <= x + 10; tx++) { setT(tx, gy + 9, SANDSTONE); setT(tx, gy + 2, SANDSTONE); } for (let y = gy + 2; y <= gy + 9; y++) { setT(x - 10, y, SANDSTONE); setT(x + 10, y, SANDSTONE); }
    for (let y = gy - 1; y <= gy + 8; y++) setT(x - 3, y, LADDER, W_SAND);
    for (const tx of [x - 14, x - 12, x - 10]) setT(tx, gy - 4, SPIKES, W_SAND);
    chestAt(x - 8, gy + 8, 'pyramid'); chestAt(x + 8, gy + 8, 'pyramid'); for (const tx of [x - 6, x + 6, x + 7]) setT(tx, gy + 8, POT, W_SAND);
    for (let tx = x - 1; tx <= x + 1; tx++) setT(tx, gy + 8, CUTSTONE, W_SAND); setT(x, gy + 7, CUTSTONE, W_SAND);
    for (const [tx, ty] of [[x - 9, gy + 3], [x - 8, gy + 3], [x - 9, gy + 4], [x + 9, gy + 3], [x + 8, gy + 3], [x + 9, gy + 4], [x - 6, gy - 10], [x + 6, gy - 10], [x - 5, gy - 10]]) setT(tx, ty, COBWEB, W_SAND);
    dyn(x - 6, gy + 4, TORCH); dyn(x + 6, gy + 4, TORCH); dyn(x - 5, gy - 7, TORCH);
    lair('pyramid', x, gy + 5, [['husk', x - 6, gy + 9], ['husk', x - 2, gy + 9], ['husk', x + 3, gy + 9], ['husk', x + 6, gy + 9]], { done: 'THE TOMB IS STILL', sub: 'the old dead rest again' });
    reserve(x - 25, x + 25, 2); mark('p' + x, 'A SAND PYRAMID', 'the old dead keep their gold', x, gy - 24, 26); return true;
  },
  temple(x) {
    const gy = flatten(x - 17, x + 17, SNOW);
    for (let tx = x - 15; tx <= x + 15; tx++) setT(tx, gy, CUTSTONE);
    for (let tx = x - 13; tx <= x + 13; tx++) for (let y = gy - 8; y < gy; y++) setT(tx, y, AIR, W_CUT);
    for (const dx of [-13, 13]) for (let y = gy - 8; y < gy; y++) setT(x + dx, y, y >= gy - 3 ? AIR : y < gy - 6 ? CUTSTONE : WINDOW, W_CUT);
    for (const dx of [-7, 7]) for (let y = gy - 8; y < gy; y++) walls[y * WW + x + dx] = W_COBBLE;
    for (let tx = x - 14; tx <= x + 14; tx++) setT(tx, gy - 9, CUTSTONE);
    for (let r = 0; r < 4; r++) for (let tx = x - 12 + r * 3; tx <= x + 12 - r * 3; tx++) setT(tx, gy - 10 - r, r === 3 ? CUTSTONE : BRICK);
    setT(x, gy - 1, OBELISK, W_CUT); chestAt(x + 4, gy - 1, 'temple'); chestAt(x - 4, gy - 1, 'temple');
    for (const dx of [-10, -2, 2, 10]) setT(x + dx, gy - 1, CRYSTAL, W_CUT);
    for (const dx of [-10, -4, 4, 10]) lampAt(x + dx, gy - 8, [.45, .65, .9]);
    lair('temple', x, gy, [['mite', x - 10, gy], ['mite', x + 10, gy], ['glassfly', x - 5, gy], ['glassfly', x + 5, gy]], { done: 'THE TEMPLE IS STILL', sub: 'only the cold remains' });
    reserve(x - 17, x + 17, 2); mark('t' + x, 'A FROZEN TEMPLE', 'cold light under the snow', x, gy - 12, 18); return true;
  }
};

// ---------------- under the ground ----------------
// the Sunken Halls: a ruined arch on the surface, a long ladder, and ten rooms of old brick
function dungeon(x, top) {
  const gy = flatten(x - 5, x + 5, DIRT);
  bp(x - 4, gy - 5, ['KKKKKKKKK', 'S,,,,,,,S', 'S,,,,,,,S', 'S,,,,,,,S', 'S,,,,,,,S', 'cccc,cccc'], { K: CUTSTONE, S: [AIR, W_STONE], ',': [AIR, W_COBBLE], '.': [AIR, 0], c: CUTSTONE });
  dyn(x - 3, gy - 3, TORCH); dyn(x + 3, gy - 3, TORCH);
  for (let y = gy; y < top + 1; y++) { setT(x - 1, y, AIR, y > gy + 2 ? W_STONE : W_COBBLE); setT(x + 1, y, AIR, y > gy + 2 ? W_STONE : W_COBBLE); setT(x, y, LADDER, y > gy + 2 ? W_STONE : W_COBBLE); }
  for (let y = gy + 6; y < top; y += 12) dyn(x + 1, y, TORCH);
  const x0 = x - 25, COLS = 5, ROWS = 2, PW = 10, PH = 7;
  for (let gx = 0; gx <= COLS * PW; gx++) for (let gyy = 0; gyy <= ROWS * PH; gyy++) setT(x0 + gx, top + gyy, gx % PW === 0 || gyy % PH === 0 ? BRICK : AIR, W_BRICK);
  // doorways between rooms side by side, some with doors in them
  for (let r = 0; r < ROWS; r++) for (let c = 1; c < COLS; c++) { const wx = x0 + c * PW, fy = top + (r + 1) * PH; const d = rand() < .4; for (let y = fy - 3; y < fy; y++) setT(wx, y, d ? DOORC : AIR, W_BRICK); }
  // ladders between the floors: always one near the middle, sometimes another
  const ladders = [2, rand() < .5 ? 0 : 4]; for (const c of ladders) { const lx = x0 + c * PW + (c === 2 ? 7 : 3); for (let y = top + PH; y < top + 2 * PH; y++) setT(lx, y, LADDER, W_BRICK); }
  setT(x, top, LADDER, W_BRICK); for (let y = top + 1; y < top + PH; y++) setT(x, y, LADDER, W_BRICK);
  const pool = ['treasure', 'treasure', 'trap', 'library', 'cells', 'armory', 'lair', 'lair', 'shrine', 'web'];
  for (let q = pool.length - 1; q > 0; q--) { const j = floor(rand() * (q + 1)); [pool[q], pool[j]] = [pool[j], pool[q]]; }
  let pi = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const rx = x0 + c * PW + 1, ry = top + r * PH + 1, fy = top + (r + 1) * PH, kind = r === 0 && c === 2 ? 'entry' : pool[pi++ % pool.length], mid = rx + 4;
    const free = tx => tileAt(tx, fy - 1) === AIR && tx !== x;
    if (kind !== 'web' && kind !== 'trap') dyn(rx + (c % 2 ? 7 : 1), ry + 1, TORCH);
    if (kind === 'entry') { lampAt(mid + 2, ry, [.8, .55, .3]); if (free(rx + 1)) setT(rx + 1, fy - 1, POT); }
    else if (kind === 'treasure') { if (free(mid)) chestAt(mid, fy - 1, 'dungeon'); for (const tx of [rx + 1, rx + 2, rx + 7]) if (free(tx)) setT(tx, fy - 1, POT); }
    else if (kind === 'trap') { for (let tx = rx + 1; tx <= rx + 7; tx++) if (free(tx)) setT(tx, fy - 1, SPIKES); for (let tx = rx; tx <= rx + 8; tx++) if (rand() < .5 && tileAt(tx, ry) === AIR) setT(tx, ry, COBWEB); if (free(rx + 8)) chestAt(rx + 8, fy - 1, 'dungeon'); }
    else if (kind === 'library') { propAt(PROP.shelf, rx, fy); propAt(PROP.shelf, rx + 5, fy); if (free(rx + 4)) chestAt(rx + 4, fy - 1, 'library'); lampAt(mid, ry, [.85, .6, .3]); }
    else if (kind === 'cells') { for (const tx of [rx + 2, rx + 6]) for (let y = ry; y < fy; y++) if (tileAt(tx, y) === AIR) setT(tx, y, BEAM); for (const tx of [rx, rx + 4, rx + 8]) if (free(tx)) setT(tx, fy - 1, BONES); if (free(rx + 1)) chestAt(rx + 1, fy - 1, 'crypt'); }
    else if (kind === 'armory') { dyn(rx + 1, fy - 1, RACK); if (free(rx + 6)) chestAt(rx + 6, fy - 1, 'armory'); propC(PROP.barrel, rx + 4, fy); }
    else if (kind === 'lair') { const g = rand() < .5 ? [['hollow', rx + 2, fy], ['hollow', rx + 6, fy]] : [['husk', rx + 1, fy], ['husk', rx + 4, fy], ['husk', rx + 7, fy]]; if (rand() < .25) g.push(['golem', mid, fy]); lair('halls' + c + r, mid, fy - 2, g); if (free(mid)) chestAt(mid, fy - 1, 'dungeon'); }
    else if (kind === 'shrine') { setT(mid, fy - 1, OBELISK, W_BRICK); lampAt(mid - 2, ry, [.6, .5, .95]); lampAt(mid + 2, ry, [.6, .5, .95]); }
    else if (kind === 'web') { for (let tx = rx; tx <= rx + 8; tx++) for (let y = ry; y < fy - 1; y++) if (tileAt(tx, y) === AIR && rand() < .4) setT(tx, y, COBWEB); lair('webs' + c + r, mid, ry, [['crawler', rx + 1, ry], ['crawler', rx + 5, ry], ['crawler', rx + 8, ry]]); if (free(rx + 7)) chestAt(rx + 7, fy - 1, 'nest'); }
  }
  reserve(x - 6, x + 6, 2);
  mark('de' + x, 'A STAIR INTO THE DARK', 'it goes a long way down', x, gy - 6, 8); small();
  mark('dg' + x, 'THE SUNKEN HALLS', 'built for something, long ago', x, top + 7, 28);
}
function mcamp(x, y) {
  for (let tx = x - 7; tx <= x + 7; tx++) { for (let ty = y - 5; ty < y; ty++) setT(tx, ty, AIR, W_PLANK); setT(tx, y, PLANK); setT(tx, y - 6, BEAMH); }
  for (const s of [-1, 1]) for (let k = 8; k < 18; k++) { const tx = x + s * k, wob = round(sin(k * .5)); for (let ty = y - 3 + wob; ty < y + wob; ty++) if (tileAt(tx, ty) !== BEDROCK) setT(tx, ty, AIR, W_DIRT); }
  for (const tx of [x - 4, x + 4]) for (let ty = y - 5; ty < y; ty++) setT(tx, ty, BEAM, W_PLANK);
  dyn(x - 6, y - 1, BEDROLL); dyn(x - 1, y - 1, FIRE); chestAt(x + 6, y - 1, 'mcamp'); propC(PROP.crate, x + 2, y); propC(PROP.sacks, x + 3, y); lampAt(x + 1, y - 5, [.85, .58, .3]);
  mark('mc' + x, "A MINER'S CAMP", 'someone dug here for years', x, y - 3, 9); small();
}
function nest(x, y) {
  oval(x, y, 8, 5, W_STONE);
  for (let tx = x - 8; tx <= x + 8; tx++) { const fy = floorAt(tx, y, y + 7); if (fy < 0 || tileAt(tx, fy - 1) !== AIR) continue; if (hh(tx, fy, 51) > .6) tiles[(fy - 1) * WW + tx] = hh(tx, fy, 52) > .5 ? BONES : POT; }
  for (let ty = y - 5; ty <= y + 3; ty++) for (let tx = x - 8; tx <= x + 8; tx++) if (tileAt(tx, ty) === AIR && rand() < (ty < y ? .4 : .15)) tiles[ty * WW + tx] = COBWEB;
  { const fy = floorAt(x + 5, y, y + 7); if (fy > 0) { setT(x + 5, fy - 1, AIR); chestAt(x + 5, fy - 1, 'nest'); } }
  const g = []; for (const tx of [x - 5, x, x + 4]) { let ty = y - 1; while (ty > y - 7 && tileAt(tx, ty - 1) === AIR) ty--; if (solidAt(tx, ty - 1) && tileAt(tx, ty) !== BEDROCK) { if (tileAt(tx, ty) === COBWEB) tiles[ty * WW + tx] = AIR; g.push(['crawler', tx, ty]); } }
  { const fy = floorAt(x - 2, y, y + 7); if (fy > 0) g.push(['mite', x - 2, fy]); }
  lair('nest', x, y, g, { done: 'THE NEST IS STILL', sub: 'nothing moves in the webs now' });
  mark('ns' + x, 'A CRAWLER NEST', 'the walls are moving', x, y - 2, 10); small();
}
// on an island in the sky: a little open shrine
function skyhouse(cx) {
  let top = -1; for (let y = 6; y < DRIFT_Y + 20; y++) if (tileAt(cx, y) === SNOW) { top = y; break; } if (top < 8) return false;
  for (const dx of [-5, 5]) if (!solidAt(cx + dx, top) && !solidAt(cx + dx, top + 1)) return false;
  bp(cx - 5, top - 5, ['KKKKKKKKKKK', '.S,,,,,,,S.', '.S,,,,,,,S.', '.S,,,,,,,S.', '.S,,,O,,,S.', 'CCCCCCCCCCC'], { K: CUTSTONE, S: [AIR, W_COBBLE], ',': [AIR, W_CUT], '.': [AIR, 0], O: [OBELISK, W_CUT], C: CUTSTONE });
  chestAt(cx + 3, top - 1, 'sky2'); lampAt(cx - 2, top - 4, [.6, .5, .95]);
  mark('sk' + cx, 'A SKY SHRINE', 'built where only birds go', cx, top - 6, 9); small(); return true;
}

// ---------------- guards: they wake when you come near, and stay beaten ----------------
const LAIRS = new Map();
function lair(kind, x, y, guards, o) { const id = DIM + ':' + kind + ':' + x + ':' + y; if (!LAIRS.has(id)) LAIRS.set(id, Object.assign({ id, kind, x, y, guards, act: false, list: [] }, o)); return id; }
function lairHollow(kind, tx, ty) {
  const h = spawnHollow(tx * T + 1, ty * T - 21); if (!h) return null; h.lair = 1;
  if (kind !== 'hollow') {
    const C = kind === 'castellan'; Object.assign(h, { name: C ? 'THE CASTELLAN' : 'HOLLOW CAPTAIN', maxhp: C ? 260 : 150, hp: C ? 260 : 150, dmgMul: C ? .8 : .65, wid: C ? 'maul' : 'sword', elite: kind });
    if (h.ai) h.ai.atkCd = 30;
  }
  return h;
}
function spawnLair(L) {
  L.act = true; L.list = [];
  for (const [type, tx, ty] of L.guards) {
    if (!inW(tx, ty)) continue; let e = null;
    if (type === 'hollow' || type === 'captain' || type === 'castellan') e = lairHollow(type, tx, ty);
    else if (MOBX[type] || ['husk', 'mite', 'mote', 'rustback', 'bat', 'skyray', 'cinderling'].includes(type)) { e = spawnMob(type, tx, ty); e.lair = 1; e.keep = true; if (e.state === 'idle') e.wait = 20; }
    if (e) L.list.push(e);
  }
}
// everyone who counts as near: you, and anyone playing with you
const lairPlayers = () => typeof netPlayers === 'function' ? netPlayers() : [G.p];
function tickLairs() {
  if (WORLD.arena || !G.p || G.time % 15 || !LAIRS.size || (typeof netGuest === 'function' && netGuest())) return;
  const ps = lairPlayers();
  for (const L of LAIRS.values()) {
    if (G.lairs.has(L.id)) continue;
    let near = 1e9; for (const p of ps) if (p && !p.dead) near = min(near, abs((p.x + 3) / T - L.x) + max(0, abs((p.y + 10) / T - L.y) - 16) * 2);
    if (!L.act) { if (near < 44 && chunkReadyAt(L.x - 30) && chunkReadyAt(L.x + 30)) spawnLair(L); continue; }
    let lost = false; L.list = L.list.filter(e => { if (e.dead) return false; if (!(e.fighter ? G.fighters.includes(e) : G.enemies.includes(e))) { lost = true; return false; } return true; });
    if (lost) { for (const e of L.list) { e.dead = true; if (e.fighter) e.gone = true; } L.list = []; L.act = false; G.fighters = G.fighters.filter(f => !f.gone); continue; }
    if (!L.list.length) {
      G.lairs.add(L.id); L.act = false; G.dirty = true;
      if (near < 90 && L.done) { calmNote(L.done + (L.sub ? '  :  ' + L.sub : '')); sfx('ui', 0); }
      continue;
    }
    if (near > 150) { for (const e of L.list) { if (e.fighter) e.gone = true; e.dead = true; } L.list = []; L.act = false; G.fighters = G.fighters.filter(f => !f.gone); }
  }
}

// ---------------- blessing stones ----------------
const BLESS = {
  swift: { n: 'THE WIND', s: 'you run and leap like the wind', c: '#8ff5e6' },
  might: { n: 'EMBERS', s: 'your blows land a quarter harder', c: '#ff8a3d' },
  ward: { n: 'STONE', s: 'blows glance off you', c: '#c0bac8' },
  vigor: { n: 'THE SPRING', s: 'your wounds close fast', c: '#7ddc6f' },
  delve: { n: 'THE DEEP', s: 'rock gives way to you', c: '#c58cf2' },
  fortune: { n: 'THE MAGPIE', s: 'creatures drop more', c: '#ffd35a' }
};
const BLESS_K = Object.keys(BLESS), BLESS_T = 60 * 60 * 4, BLESS_CD = 60 * 8;
const blessOn = k => !!(G.bless && G.bless.k === k && G.bless.t > 0);
const blessKind = i => BLESS_K[floor(hh(i % WW, (i / WW) | 0, SEED + 77) * BLESS_K.length)];
function blessMul(kind) {
  if (!G.bless || G.bless.t <= 0 || WORLD.arena) return 1; const k = G.bless.k;
  if (k === 'swift') return kind === 'walk' ? 1.25 : kind === 'jump' ? 1.1 : 1;
  if (k === 'delve') return kind === 'mine' ? 1.4 : 1;
  return 1;
}
const blessTaken = () => blessOn('ward') ? .75 : 1, blessRegen = () => blessOn('vigor') ? 3 : 1;
function blessAt(i) {
  const used = G.blessUsed[i], left = used !== undefined ? BLESS_CD - (G.played - used) : 0;
  if (left > 0) { say(`The stone is quiet. It wakes again in ${max(1, ceil(left / 60))} minute${left > 60 ? 's' : ''}.`); sfx('ui'); return; }
  const k = blessKind(i), B = BLESS[k]; G.bless = { k, t: BLESS_T }; G.blessUsed[i] = G.played; G.dirty = true;
  if (k === 'vigor' && G.p) G.p.hp = min(G.p.maxhp, G.p.hp + 25);
  G.banner = { text: 'BLESSING OF ' + B.n, sub: B.s, t: 0 }; sfx('quest', 0); G.flash = .35; G.flashCol = '180,156,255';
  const x = (i % WW) * T + 4, y = ((i / WW) | 0) * T - 6; burst(x, y, 30, [B.c, '#ffffff', '#b49cff'], 2.4, 60, { glow: 1, g: -.02 });
}
function tickBless() {
  const p = G.p; if (!p || WORLD.arena) return;
  if (G.bless && G.bless.t > 0) { G.bless.t--; if (G.time % 9 === 0) P(p.x + 3 + frand(-4, 4), p.y + frand(2, 18), 0, -.4, 30, BLESS[G.bless.k].c, { glow: 1, g: -.01 }); if (G.bless.t <= 0) { say('The blessing fades.'); G.bless = null; } }
  p.dmgMul = (blessOn('might') ? 1.25 : 1) * boonMul('dmg');
}
function drawBless(c) {
  if (!G.bless || G.bless.t <= 0 || WORLD.arena) return; const B = BLESS[G.bless.k], s = ceil(G.bless.t / 60);
  textS(c, `BLESSING OF ${B.n}  ${floor(s / 60)}:${String(s % 60).padStart(2, '0')}`, 4, 52, G.bless.t < 600 && (G.time >> 3) & 1 ? '#8b8fa3' : B.c);
}
// the [F] prompt on a stone
function placeInteract(L) {
  const p = G.p, ptx = floor((p.x + 3) / T), pty = floor((p.y + 10) / T);
  for (const o of tileObjs.values()) {
    if (o.id !== OBELISK || abs(o.x - ptx) > 4 || abs(o.y - pty) > 4) continue; const i = o.y * WW + o.x, used = G.blessUsed[i] !== undefined && BLESS_CD - (G.played - G.blessUsed[i]) > 0;
    L.push({ x: o.x * T + 4, y: (o.y + 1) * T, r: 14, label: used ? 'the stone is resting' : 'ask for a blessing', act: () => blessAt(i) });
  }
}
// cobwebs hold you, old spikes bite
function placeHazards(f) {
  if (f !== G.p || f.dead || WORLD.arena) return;
  const x0 = floor((f.x + 1) / T), x1 = floor((f.x + f.w - 2) / T), y0 = floor((f.y + 2) / T), y1 = floor((f.y + f.h - 1) / T); let web = false, spike = false;
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const t = tileAt(x, y); if (t === COBWEB) web = true; else if (t === SPIKES && y === y1) spike = true; }
  if (web) { f.vx *= .62; if (f.vy > .7) f.vy = .7; else if (f.vy < -1.6) f.vy *= .85; if (G.time % 12 === 0) P(f.x + 3, f.y + 8, frand(-.3, .3), frand(-.3, .1), 20, '#e6e6f0'); }
  if (spike && !(f.inv > 0) && !(f.iDodge > 0) && f.hurtT <= 0 && f.vy >= 0) hurtFighter(f, 12, f.x + 3 - (f.face || 1) * 4, { kx: -(f.face || 1) * 1.2, ky: -3.4 });
}

// ---------------- the other worlds get places of their own ----------------
// Cinderdeep: slag bastions; the Rootdark: glowcap hollows; the Glass Expanse: prism spires. Blessing stones everywhere.
const DPW = 520;
function dplaceOf(k) {
  return pmemo('p' + DIM + ':' + k, () => {
    if (!DIM || hh(k, 1500 + DIM, SEED) > .6) return null;
    let x = k * DPW + 90 + floor(hh(k, 1501 + DIM, SEED) * 340); const kind = hh(k, 1502 + DIM, SEED) < .3 ? 'dshrine' : DIM === 1 ? 'bastion' : DIM === 2 ? 'hollow' : 'spire';
    if (!newLand(x - 30) || !newLand(x + 30) || abs(x - SPAWN_X) < 90 || abs(x - DARENA_X) < 120 || nearEcho(x, 30)) return null;
    if (DIM !== 3 && [x - 18, x, x + 18].some(q => dimLakeAt(q))) return null;
    for (let q = floor(x / 210) - 1; q <= floor(x / 210) + 1; q++) { const rx = q * 210 + 30 + floor(hh(q, 1401 + DIM, SEED) * 150); if (hh(q, 1402 + DIM, SEED) <= .55 && abs(rx - x) < 40) return null; }
    return { x, kind };
  });
}
function dimPlaces(cx, x0, x1, here) {
  for (let k = floor(x0 / DPW) - 1; k <= floor(x1 / DPW) + 1; k++) {
    const s = dplaceOf(k); if (!s || !here(s.x)) continue; let x = s.x;
    if (DIM === 3) { const I = gIsleC(floor(x / GCELL)) || gIsleC(floor(x / GCELL) + 1); if (!I || I.a < 11 || !here(I.cx)) continue; x = I.cx; }
    else if (![-10, -6, -3, 3, 6, 10].every(o => abs(heights[x + o] - heights[x]) <= 2)) continue;
    const gy = DIM === 3 ? glassTop(x) : heights[x]; if (gy < 20 || gy > WH - 20) continue;
    withRng(hh(x, 1550 + DIM, SEED) * 4294967296, () => DPLACE[s.kind](x, gy));
  }
}
const DPLACE = {
  dshrine(x, gy) {
    const F = DIM === 1 ? BASALT : DIM === 2 ? SHADESTONE : PALESTONE;
    for (let dx = -5; dx <= 5; dx++) { for (let y = gy - 8; y < gy; y++) setT(x + dx, y, AIR, 0); setT(x + dx, gy, F); }
    bp(x - 3, gy - 2, ['...O...', '.CCCCC.'], { O: OBELISK, C: F, '.': undefined });
    lampAt(x - 4, gy - 3, [.6, .5, .95]); lampAt(x + 4, gy - 3, [.6, .5, .95]); reserve(x - 6, x + 6, 2);
    mark('o' + DIM + ':' + x, 'A BLESSING STONE', 'touch it [F]', x, gy - 5, 9); small();
  },
  bastion(x, gy) {
    for (let dx = -12; dx <= 12; dx++) { for (let y = gy - 12; y < gy; y++) setT(x + dx, y, AIR, abs(dx) < 11 && y > gy - 9 ? W_DBRICK : 0); setT(x + dx, gy, CINDERBRICK); for (let y = gy + 1; y < gy + 3; y++) if (!solidAt(x + dx, y)) setT(x + dx, y, BASALT); }
    for (const s of [-1, 1]) { for (let y = gy - 9; y < gy; y++) setT(x + s * 11, y, y >= gy - 3 ? AIR : CINDERBRICK, W_DBRICK); for (let y = gy - 10; y < gy - 8; y++) setT(x + s * 12, y, CINDERBRICK); }
    for (let dx = -11; dx <= 11; dx++) { setT(x + dx, gy - 9, PLATFORM, W_DBRICK); if (abs(dx) % 2 === 1) setT(x + dx, gy - 10, CINDERBRICK); }
    for (let y = gy - 9; y < gy; y++) setT(x - 9, y, LADDER, W_DBRICK);
    dyn(x - 5, gy - 1, SLAGFORGE); chestAt(x + 6, gy - 1, 'kilnruin'); chestAt(x + 1, gy - 10, 'kilnruin'); dyn(x - 2, gy - 6, TORCH); dyn(x + 4, gy - 6, TORCH);
    lair('bastion', x, gy, [['cinderimp', x - 3, gy], ['cinderimp', x + 3, gy], ['slagling', x + 8, gy], ['basaltbrute', x, gy]], { done: 'THE BASTION IS QUIET', sub: 'the forge inside is yours to use' });
    reserve(x - 13, x + 13, 2); mark('sb' + x, 'A SLAG BASTION', 'someone forged here, and fought', x, gy - 12, 14);
  },
  hollow(x, gy) {
    const cy = gy + 6; oval(x, cy, 9, 5, W_ROOT);
    for (let k = 0; k <= 8; k++) for (let y = gy - 2 + floor(k * .6); y <= gy + floor(k * .6); y++) setT(x - 13 + k, y, AIR, k > 2 ? W_ROOT : 0);
    for (const dx of [-6, -1, 4]) { const fy = floorAt(x + dx, cy, cy + 8); if (fy > 0) { for (let y = fy - 4; y < fy; y++) setT(x + dx, y, ROOTWOOD, W_ROOT); for (let q = -2; q <= 2; q++) if (tileAt(x + dx + q, fy - 5) === AIR) setT(x + dx + q, fy - 5, CAPFLESH, W_ROOT); } }
    for (let tx = x - 8; tx <= x + 8; tx++) { const fy = floorAt(tx, cy, cy + 8); if (fy > 0 && tileAt(tx, fy - 1) === AIR && hh(tx, fy, 61) > .55) tiles[(fy - 1) * WW + tx] = GLOWSHROOM; }
    { const fy = floorAt(x + 7, cy, cy + 8); if (fy > 0) { setT(x + 7, fy - 1, AIR); chestAt(x + 7, fy - 1, 'rootruin'); } }
    const g = []; for (const [t, dx] of [['sporeling', -4], ['sporeling', 2], ['gloamhound', 6]]) { const fy = floorAt(x + dx, cy, cy + 8); if (fy > 0) g.push([t, x + dx, fy]); }
    lair('hollow', x, cy, g, { done: 'THE HOLLOW IS STILL', sub: 'the spores settle' });
    mark('gh' + x, 'A GLOWCAP HOLLOW', 'it glows, and something moves', x, cy - 2, 12);
  },
  spire(x, gy) {
    const H = 18;
    for (let y = gy - H; y < gy; y++) for (let dx = -3; dx <= 3; dx++) setT(x + dx, y, abs(dx) === 3 ? (y >= gy - 3 ? AIR : SHARDGLASS) : AIR, abs(dx) < 3 ? W_PALE : 0);
    for (let dx = -3; dx <= 3; dx++) { setT(x + dx, gy - H - 1, SHARDGLASS); setT(x + dx, gy, PALESTONE); }
    for (let y = gy - 5; y > gy - H; y -= 5) for (let dx = -2; dx <= 2; dx++) setT(x + dx, y, GLASSWALK, W_PALE);
    for (let y = gy - H; y < gy; y++) setT(x - 2, y, LADDER, W_PALE);
    for (let y = gy - H - 4; y < gy - H - 1; y++) setT(x, y, SHARDGLASS); setT(x, gy - H - 5, PRISMBLOOM);
    chestAt(x + 2, gy - H + 4, 'glassruin'); chestAt(x + 2, gy - 1, 'glassisle'); lampAt(x, gy - 6, [.5, .45, .8]); lampAt(x, gy - 16, [.5, .45, .8]);
    lair('spire', x, gy, [['shardling', x - 6, gy], ['shardling', x + 6, gy], ['mirrorwisp', x, gy - 8]], { done: 'THE SPIRE IS STILL', sub: 'only the wind sings in it now' });
    reserve(x - 4, x + 4, 2); mark('ps' + x, 'A PRISM SPIRE', 'glass grown into a tower', x, gy - H - 2, 10);
  }
};
