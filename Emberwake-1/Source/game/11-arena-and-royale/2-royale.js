// ============================================================
//  THE ASHFALL: battle royale.
//  Everyone rides the Ember Barge over an island and leaps off where
//  they like. Chests hold weapons, salves and wards. The ashfall storm
//  closes in from both sides, and the last Waker standing wins. Empty
//  places are filled by echoes (computer players).
//  Online, the match leader (the first person in the lobby) runs the
//  storm clock and the echoes; every computer runs its own Waker and
//  shares it as presence, exactly like the Cinder Ring.
// ============================================================
const BRW = 520, BRH = 140, BRSKY = 17, BR_MAX = 12, BR_FILL = 8;
const BR_TIERS = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'], BR_TCOL = ['#c8c4d4', '#7ddc6f', '#5aa8ff', '#c77dff', '#ffd35a'];
const BR_MATT = { wood: 0, flint: 0, bone: 0, stone: 0, copper: 1, bronze: 1, rust: 2, chitin: 2, iron: 2, steel: 3, glass: 3, deep: 4, ember: 4 };
const BR_OLD = { sword: 0, spear: 0, fangs: 1, maul: 2, bow: 1, nunchaku: 1, kblade: 4, kmaul: 4, vpike: 3, vfangs: 3 };
const BR_BIOMES = ['moor', 'thorn', 'dunes', 'reach', 'ash'];
const BR_SURF = { moor: [GRASS, DIRT], thorn: [GRASS, DIRT], dunes: [SAND, SANDSTONE], reach: [SNOW, STONE], ash: [ASH, STONE] };
const BR_WALL = { moor: W_DIRT, thorn: W_DIRT, dunes: W_SAND, reach: W_STONE, ash: W_ASH };
const BR_PNAMES = { moor: ['HEARTHWICK', 'MILLSTEAD', 'LANTERN GREEN'], thorn: ['THORNWOOD', 'BRAMBLE CAMP', 'THE TANGLE'], dunes: ['SUNKEN SPIRE', 'DUSTWATCH', 'RUSTFALL RUINS'], reach: ['COLDGLASS KEEP', 'FROSTGATE', 'STILLWATCH'], ash: ['CINDER WORKS', 'SLAG HOLLOW', 'THE KILNS'] };
const BR_BOTN = ['WREN', 'KESTREL', 'MARROW', 'TINDER', 'SORREL', 'FLINT', 'ROOK', 'BRAMBLE', 'EMBERLY', 'SALTWICK', 'HOLLIS', 'VESK', 'ODA', 'TALLOW'];
// storm phases: seconds of waiting, seconds of closing, share of the map still safe after, damage per second outside
const STORM = [[55, 25, .6, 1], [35, 20, .36, 2], [28, 18, .18, 4], [24, 15, .08, 6], [20, 15, 0, 10]];
const BR_DROP = 22 * 60;
const BR = {
  on: false, via: 'solo', code: 'open', phase: '', mi: '', seed: 0, t: 0, ro: [], nb: 0, lead: true, leaderId: '', people: new Map(),
  cd: 0, cdAt: 0, cdMax: 0, chests: [], open: new Set(), mine: new Set(), zones: [], storm: null, bots: new Map(), bk: [], bkSeq: 0, bkSeen: new Map(),
  dlSeen: new Set(), dl: null, place: 0, spec: null, specT: 0, overT: 0, winner: '', winMe: false, pois: [], segs: BR_BIOMES.slice(), segW: BRW / 5, mapCv: null,
  note: '', noteT: 0, chan: null, inStorm: false, poiNow: '', mapOpen: false, total: 0, lastAlive: 0, lobbyT: 0, err: ''
};
const brOn = () => WORLD.royale && BR.on;
const brTag = f => !f ? '' : f === G.p ? (NET.me || 'me') : f.botTag || f.peer || '';

// ---------------- loot ----------------
const brTier = id => { const it = IT[id]; if (!it || it.type !== 'weapon' || it.fist) return -1; return it.tier ? (BR_MATT[it.tier] ?? 0) : (BR_OLD[id] ?? 0); };
let BR_POOL = null;
function brPool() { if (BR_POOL) return BR_POOL; BR_POOL = [[], [], [], [], []]; for (const id in IT) { const k = brTier(id); if (k >= 0) BR_POOL[k].push(id); } return BR_POOL; }
function brItems() {
  const v = (a, b, c, d, e) => ({ a, b, c, d, e });
  defI('br_salve', { name: 'Ember Salve', type: 'brheal', heal: 25, cap: 100, use: 70, stack: 6, icon: icon('vial', v('#ffd3a0', '#ff8a3d', '#c94a1e', '#5a2010', '#fff1a8')), desc: 'Heals 25. Takes a moment to rub in.' });
  defI('br_draught', { name: 'Heartroot Draught', type: 'brheal', heal: 60, cap: 100, use: 150, stack: 3, icon: icon('jug', v('#ffb0b0', '#e2483b', '#8f2233', '#4a1018', '#ffd0d0')), desc: 'Heals 60. Drink it somewhere safe.' });
  defI('br_shard', { name: 'Ward Shard', type: 'brheal', ward: 25, cap: 50, use: 80, stack: 6, icon: icon('stone', v('#e0f4ff', '#8fd0ff', '#4a8adf', '#22406a', '#ffffff')), desc: '+25 ward, up to 50. Ward takes blows before your health does.' });
  defI('br_ward', { name: 'Greatward Flask', type: 'brheal', ward: 50, cap: 100, use: 160, stack: 3, icon: icon('vial', v('#e0f4ff', '#5aa8ff', '#2a62c0', '#14305a', '#ffffff')), desc: '+50 ward, up to 100.' });
}
function brRollTier(rare) { const r = Math.random(); return rare ? (r < .3 ? 2 : r < .78 ? 3 : 4) : (r < .4 ? 0 : r < .7 ? 1 : r < .89 ? 2 : r < .975 ? 3 : 4); }
function brLoot(rare) {
  const P = brPool(), k = brRollTier(rare), pool = P[k].length ? P[k] : P[0], out = [[fpick(pool), 1]];
  const n = rare ? 2 : 1 + (Math.random() < .55 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const r = Math.random();
    out.push(r < .27 ? ['br_salve', 2] : r < .38 ? ['br_draught', 1] : r < .62 ? ['br_shard', 2] : r < .7 ? ['br_ward', 1] : r < .84 ? [fpick(['shuriken', 'flask', 'smoke']), fpick([2, 3])] : r < .9 ? ['hook', 1] : ['arrow', 15]);
  }
  if (IT[out[0][0]].ammo && !out.some(o => o[0] === 'arrow')) out.push(['arrow', 20]);
  return out;
}

// ---------------- the island ----------------
const brBio = x => BR.segs[clamp(floor(x / BR.segW), 0, BR.segs.length - 1)] || 'moor';
function brRegionMix(x) {
  const BG = { moor: 'moor', thorn: 'moor', dunes: 'scoria', reach: 'reach', ash: 'ash' }, acc = { reach: 0, moor: 0, ash: 0, scoria: 0 }; let tot = 0;
  BR.segs.forEach((b, i) => { const c = (i + .5) * BR.segW, w = smooth(1 - (abs(x - c) - BR.segW * .3) / (BR.segW * .45)); if (w > .001) { acc[BG[b]] += w; tot += w; } });
  if (!tot) { acc.moor = 1; tot = 1; } for (const k in acc) acc[k] /= tot; return Object.entries(acc).filter(e => e[1] > .02);
}
function brFlat(x0, x1, gy, b) {
  const [top, sub] = BR_SURF[b || brBio((x0 + x1) >> 1)];
  for (let x = x0; x <= x1; x++) {
    if (!inW(x, gy)) continue;
    for (let y = 0; y < gy; y++) if (tiles[y * WW + x] !== BEDROCK) { tiles[y * WW + x] = AIR; walls[y * WW + x] = 0; }
    for (let y = gy; y < min(BRH - 3, gy + 6); y++) { tiles[y * WW + x] = y === gy ? top : sub; if (y > gy) walls[y * WW + x] = BR_WALL[brBio(x)]; }
    heights[x] = gy; SKYL[x] = gy + 3;
  }
}
// a ramp of earth so the ground beside a flattened place stays walkable
function brEase(x, dir, gy) { for (let k = 1; k < 30; k++) { const xx = x + dir * k; if (xx < 3 || xx > BRW - 4) return; const want = gy + sign(heights[xx] - gy) * min(abs(heights[xx] - gy), k * 2); if (want === heights[xx]) return; brFlat(xx, xx, want); } }
function brChest(x, y, rare, o = {}) {
  if (!inW(x, y) || tiles[y * WW + x] !== AIR || !TP[tileAt(x, y + 1)].solid && tileAt(x, y + 1) !== PLATFORM) return null;
  for (const c of BR.chests) if (abs(c.x - x) < 3 && abs(c.y - y) < 3) return null;
  const c = { i: BR.chests.length, x, y, rare: !!rare, cave: !!o.cave, high: !!o.high, open: false, t: 0 }; BR.chests.push(c); return c;
}
function brTree(x, gy, b) {
  const kind = b === 'thorn' ? 3 : b === 'moor' ? 0 : b === 'reach' ? 1 : 2, th = kind === 0 ? 7 + randi(0, 7) : kind === 1 ? 5 + randi(0, 5) : 5 + randi(0, 4);
  for (let y = 1; y <= th + 4; y++) if (tileAt(x, gy - y) !== AIR) return; if (tileAt(x - 1, gy) === AIR || tileAt(x + 1, gy) === AIR) return;
  for (let y = 1; y <= th; y++) tiles[(gy - y) * WW + x] = [TRUNK, TRUNK2, TRUNK3, TRUNK4][kind];
  treeTops.set(x, { y: gy - th, kind, v: randi(0, 2), ph: rand(TAU) });
}
function genRoyale(seed) {
  SEED = seed >>> 0; rng = mulberry32(SEED); DIM = 0; resetWorld(BRW, BRH); WORLD.arena = true; WORLD.royale = true; WORLD.endless = 0;
  SPAWN_X = BRW >> 1; SHRINE_X = SHRINE2_X = MINE_X = FORGE_X = GATE_X = SKY_X = BLADE_X = SPIRE_X = REACH_X = RUST_X = -100000; SHRINE_Y = SHRINE2_Y = GATE_Y = MINE_Y = FORGE_Y = SKY_Y = 0;
  BASE_Y = 74; DEEP_Y = 9999; DRIFT_Y = -99; VIL_Y = -999;
  const order = BR_BIOMES.slice(); for (let i = order.length - 1; i > 0; i--) { const j = randi(0, i); const q = order[i]; order[i] = order[j]; order[j] = q; }
  BR.segs = order; BR.segW = BRW / order.length; BR.chests = []; BR.pois = [];
  // the shape of the land: rolling hills, steeper in the Reach, flatter in the dunes, cliffs at the edges of the world
  const a1 = rand(TAU), a2 = rand(TAU), a3 = rand(TAU);
  for (let x = 0; x < BRW; x++) {
    const b = brBio(x), amp = b === 'dunes' ? .55 : b === 'reach' ? 1.35 : b === 'thorn' ? 1.1 : 1;
    let h = 76 + (8 * sin(x * .019 + a1) + 4 * sin(x * .051 + a2) + 2 * sin(x * .13 + a3)) * amp; const e = min(x, BRW - 1 - x); if (e < 16) h -= (16 - e) * 3.2;
    heights[x] = round(h);
  }
  for (let pass = 0; pass < 4; pass++) for (let x = 17; x < BRW - 17; x++) { const d = heights[x] - heights[x - 1]; if (abs(d) > 2) heights[x] = heights[x - 1] + sign(d) * 2; }
  for (let x = 0; x < BRW; x++) {
    const b = brBio(x), [top, sub] = BR_SURF[b], gy = heights[x], deep = 4 + floor(hh(x, 7, SEED) * 3);
    for (let y = gy; y < BRH; y++) { const d = y - gy, i = y * WW + x; tiles[i] = y >= BRH - 3 ? BEDROCK : d === 0 ? top : d < deep ? sub : hh(x, y, 11) > .94 ? GRAVEL : hh(x, y, 12) > .97 ? COAL : STONE; walls[i] = d > 0 ? (d < 7 ? BR_WALL[b] : W_STONE) : 0; }
    if (x < 2 || x >= BRW - 2) for (let y = 0; y < gy; y++) tiles[y * WW + x] = BEDROCK;
    SKYL[x] = gy + 3;
  }
  // tunnels under the hills: two or three, each with a chest or two at its far end
  for (let k = 0; k < 3; k++) {
    let x = randi(40, BRW - 80), y = heights[x] + 1, dir = rand() < .5 ? -1 : 1, len = randi(50, 90), ent = x;
    for (let s = 0; s < len; s++) {
      const dy = s < 10 ? 1 : s > len - 10 ? -1 : (rand() < .2 ? (rand() < .5 ? -1 : 1) : 0); x += dir; y = clamp(y + dy, heights[clamp(x, 0, BRW - 1)] + 2, BRH - 12);
      if (x < 20 || x > BRW - 21) break;
      for (let oy = -2; oy <= 1; oy++) for (let ox = 0; ox <= 1; ox++) { const xx = x + ox, yy = y + oy; if (inW(xx, yy) && tiles[yy * WW + xx] !== BEDROCK) tiles[yy * WW + xx] = AIR; }
      if (s % 14 === 7) { const ty = y - 2; if (tileAt(x, ty - 1) !== AIR) dyn(x, ty, TORCH); }
    }
    for (let yy = heights[ent] - 1; yy <= heights[ent] + 3; yy++) for (let xx = ent - 1; xx <= ent + 1; xx++) if (inW(xx, yy) && tiles[yy * WW + xx] !== BEDROCK && yy >= heights[ent]) tiles[yy * WW + xx] = AIR;
    for (let q = 0; q < 2; q++) { const qx = x - q * 4 * dir; let fy = y; while (fy < BRH - 4 && !solidAt(qx, fy + 1)) fy++; brChest(qx, fy, q === 0, { cave: true }); }
  }
  // the named places, one in each land
  const used = new Set();
  BR.segs.forEach((b, i) => {
    const cx = round((i + .5) * BR.segW + rand(-BR.segW * .18, BR.segW * .18)), names = BR_PNAMES[b], name = names.find(n => !used.has(n) && rand() < .6) || names[0]; used.add(name);
    withRng(hh(cx, 2201, SEED) * 4294967296, () => brPOI(b, cx, name));
  });
  // floating isles with a rare chest each, and a vent beneath to reach them
  for (let k = 0; k < 3; k++) {
    const cx = round((k + .5) * BRW / 3 + rand(-50, 50)), cy = heights[cx] - 26 - randi(0, 6), a = 7 + randi(0, 3);
    if (island(cx, cy, a, 4, false)) { for (let y = cy - 4; y < cy; y++) for (let x = cx - 3; x <= cx + 3; x++) if (inW(x, y)) tiles[y * WW + x] = AIR; let gy = cy; while (gy < cy + 6 && !solidAt(cx, gy)) gy++; brChest(cx, gy - 1, true, { high: true }); const vx = cx + (rand() < .5 ? -1 : 1) * (a + 3); vent(vx, cy - 8); }
  }
  // trees, grass and rocks between the places
  for (let x = 8; x < BRW - 8; x++) {
    const b = brBio(x), gy = heights[x]; if (RESV[x] || tileAt(x, gy - 1) !== AIR) continue;
    const ch = b === 'thorn' ? .2 : b === 'moor' ? .09 : b === 'reach' ? .07 : b === 'ash' ? .03 : 0;
    if (rand() < ch && abs(heights[x - 1] - gy) <= 1 && abs(heights[x + 1] - gy) <= 1) { brTree(x, gy, b); x += 3; continue; }
    const r = rand(); if (b === 'dunes') { if (r < .05) tiles[(gy - 1) * WW + x] = DEADBUSH; } else if (b === 'ash') { if (r < .04) tiles[(gy - 1) * WW + x] = DEADBUSH; } else if (b !== 'reach' || r < .3) { if (r < .22) tiles[(gy - 1) * WW + x] = TALLGRASS; else if (r < .27) tiles[(gy - 1) * WW + x] = FLOWER; else if (r < .29) tiles[(gy - 1) * WW + x] = BUSH; }
  }
  // chests out in the open, about one every thirty paces
  for (let x = 20; x < BRW - 20; x += 22 + randi(0, 16)) { if (RESV[x]) continue; const gy = heights[x]; if (abs(heights[x - 1] - gy) <= 1 && abs(heights[x + 1] - gy) <= 1) brChest(x, gy - 1, rand() < .1); }
  // a few watch platforms with a chest on top
  for (let k = 0; k < 6; k++) {
    const x = randi(30, BRW - 40); if (RESV[x] || RESV[x + 7]) continue; const gy = min(heights[x], heights[x + 7]), py = gy - 6;
    for (let y = py + 1; y <= max(heights[x], heights[x + 7]) - 1; y++) { if (tileAt(x, y) === AIR) tiles[y * WW + x] = BEAM; if (tileAt(x + 7, y) === AIR) tiles[y * WW + x + 7] = BEAM; }
    for (let xx = x; xx <= x + 7; xx++) if (tileAt(xx, py) === AIR) tiles[py * WW + xx] = PLATFORM;
    brChest(x + 3, py - 1, false, { high: true }); reserve(x - 1, x + 8, 1);
  }
  for (let x = 0; x < BRW; x++) { let y = 0; while (y < BRH && !TP[tiles[y * WW + x]].solid) y++; SKYL[x] = max(heights[x] + 3, min(y + 3, BRH)); }
  for (const q of PROPS) bucketAdd(PROPB, q); for (const q of FGP) bucketAdd(FGPB, q);
  MODS_ON = false; brMapArt();
}
// the five kinds of named place
function brPOI(b, cx, name) {
  const gy = heights[cx]; BR.pois.push({ name, x: cx, b });
  if (b === 'moor') {
    brFlat(cx - 26, cx + 26, gy); brEase(cx - 26, -1, gy); brEase(cx + 26, 1, gy);
    house(cx - 22, gy, 11, 6, 4, { door: 2, name }); house(cx - 5, gy, 11, 9, 4, { door: 2, floors: 2 }); house(cx + 12, gy, 10, 6, 3, { door: 2 });
    for (let x = cx - 24; x <= cx + 24; x++) for (let y = gy - 4; y < gy; y++) if (tiles[y * WW + x] === DOORC) tiles[y * WW + x] = DOORO;
    brChest(cx - 17, gy - 1, false); brChest(cx, gy - 1, false); brChest(cx + 1, gy - 5, true); brChest(cx + 16, gy - 1, false);
    dyn(cx - 24, gy - 1, TORCH); dyn(cx + 24, gy - 1, TORCH);
  } else if (b === 'thorn') {
    brFlat(cx - 18, cx + 18, gy); brEase(cx - 18, -1, gy); brEase(cx + 18, 1, gy);
    for (const [ox, w] of [[-14, 7], [5, 8]]) { const x0 = cx + ox; for (let k = 0; k < w; k++) { const hgt = round((1 - abs(k - (w - 1) / 2) / (w / 2)) * 4); for (let y = gy - hgt; y < gy; y++) if (y === gy - hgt || k === 0 || k === w - 1) tiles[y * WW + x0 + k] = THATCH; else walls[y * WW + x0 + k] = W_WATTLE; } }
    dyn(cx - 2, gy - 1, CAMP);
    brChest(cx - 11, gy - 1, false); brChest(cx + 9, gy - 1, true); brChest(cx + 15, gy - 1, false);
    for (const ox of [-17, 17]) brTree(cx + ox, gy, 'thorn');
  } else if (b === 'dunes') {
    brFlat(cx - 14, cx + 14, gy); brEase(cx - 14, -1, gy); brEase(cx + 14, 1, gy);
    tower(cx - 4, gy, 9, 20, { ruin: true, name }); brChest(cx, gy - 1, false); brChest(cx - 1, gy - 5, false); brChest(cx + 1, gy - 13, false); brChest(cx, gy - 21, true, { high: true });
    for (const ox of [-12, 10]) for (let y = gy - 3; y < gy; y++) tiles[y * WW + cx + ox] = SANDSTONE;
  } else if (b === 'reach') {
    brFlat(cx - 20, cx + 20, gy); brEase(cx - 20, -1, gy); brEase(cx + 20, 1, gy);
    for (let x = cx - 16; x <= cx + 16; x++) { for (let y = gy - 9; y < gy; y++) walls[y * WW + x] = W_BRICK; tiles[(gy - 9) * WW + x] = abs(x - cx) < 15 ? PLATFORM : BRICK; if (abs(x - cx) % 3 === 0) tiles[(gy - 10) * WW + x] = BRICK; }
    for (const s of [-1, 1]) { for (let y = gy - 9; y < gy - 3; y++) tiles[y * WW + cx + s * 16] = BRICK; for (let y = gy - 13; y < gy - 9; y++) { tiles[y * WW + cx + s * 16] = BRICK; tiles[y * WW + cx + s * 15] = BRICK; } }
    for (let x = cx - 6; x <= cx + 6; x++) tiles[(gy - 5) * WW + x] = PLATFORM;
    brChest(cx - 10, gy - 1, false); brChest(cx + 10, gy - 1, false); brChest(cx, gy - 6, true); brChest(cx + 12, gy - 10, false, { high: true });
    dyn(cx - 13, gy - 4, TORCH); dyn(cx + 13, gy - 4, TORCH);
  } else {
    brFlat(cx - 18, cx + 18, gy); brEase(cx - 18, -1, gy); brEase(cx + 18, 1, gy);
    for (const [ox, h] of [[-15, 6], [-9, 9], [7, 7], [14, 5]]) for (let y = gy - h; y < gy; y++) { tiles[y * WW + cx + ox] = y < gy - h + 2 && rand() < .5 ? AIR : CINDERBRICK; walls[y * WW + cx + ox + 1] = W_RUIN; }
    for (let x = cx - 9; x <= cx + 7; x++) tiles[(gy - 9) * WW + x] = PLATFORM;
    vent(cx - 3, gy - 22); brChest(cx - 12, gy - 1, false); brChest(cx + 2, gy - 1, false); brChest(cx - 1, gy - 10, true, { high: true }); brChest(cx + 11, gy - 1, false);
  }
  reserve(cx - 28, cx + 28, 2);
}
// a small picture of the whole island for the map and the storm strip
function brMapArt() {
  const s = 2, c = document.createElement('canvas'); c.width = ceil(BRW / s); c.height = ceil(BRH / s); const x = c.getContext('2d');
  const col = { moor: '#4f7a3a', thorn: '#3d6a32', dunes: '#c9a46a', reach: '#d8e6ee', ash: '#6a6070' };
  for (let tx = 0; tx < BRW; tx += s) for (let ty = 0; ty < BRH; ty += s) { const t = tiles[ty * WW + tx]; if (!TP[t].solid || t === BEDROCK && (tx < 3 || tx > BRW - 4)) continue; x.fillStyle = ty <= heights[tx] + 1 ? col[brBio(tx)] : ty < heights[tx] + 8 ? '#5a4a40' : '#3a3442'; x.fillRect(tx / s, ty / s, 1, 1); }
  BR.mapCv = c;
}

// ---------------- the storm ----------------
function brZones(seed) {
  const r = mulberry32((seed ^ 0x5bd1e995) >>> 0), Wp = BRW * T, Z = [[3 * T, Wp - 3 * T]];
  for (const [, , fr] of STORM) { const L = Z[Z.length - 1][0], R = Z[Z.length - 1][1], w = fr * Wp, room = max(0, R - L - w); const nL = L + r() * room; Z.push([nL, nL + min(w, R - L)]); }
  return Z;
}
function brStormAt(t) {
  let at = 0; const Z = BR.zones;
  for (let i = 0; i < STORM.length; i++) {
    const w = STORM[i][0] * 60, d = STORM[i][1] * 60;
    if (t < at + w) return { L: Z[i][0], R: Z[i][1], nL: Z[i + 1][0], nR: Z[i + 1][1], i, moving: false, left: at + w - t, dps: i ? STORM[i - 1][3] : 0 };
    if (t < at + w + d) { const u = (t - at - w) / d; return { L: lerp(Z[i][0], Z[i + 1][0], u), R: lerp(Z[i][1], Z[i + 1][1], u), nL: Z[i + 1][0], nR: Z[i + 1][1], i, moving: true, left: at + w + d - t, dps: STORM[i][3] }; }
    at += w + d;
  }
  const L = Z[Z.length - 1]; return { L: L[0], R: L[1], nL: L[0], nR: L[1], i: STORM.length, moving: false, left: 0, dps: STORM[STORM.length - 1][3] };
}
const brOut = f => { const z = BR.storm, x = f.x + 3; return !!z && z.dps > 0 && (x < z.L || x > z.R); };
function brStormHurt(f) {
  const d = BR.storm.dps / 2; f.hp -= d; f.flash = 4; f.regenT = 0;
  if (f === G.p) { numPop(f.x + 3, f.y - 4, round(d * 10) / 10, '#c77dff'); sfx('hurt', 30); G.flash = max(G.flash, .12); G.flashCol = '170,70,200'; }
  if (f.hp <= 0) { f.hp = 0; killFighter(f, null); }
}

// ---------------- the barge ----------------
function brBarge(t) { const u = clamp((t === undefined ? BR.t : t) / BR_DROP, 0, 1), dir = BR.seed & 1 ? 1 : -1, x0 = 26 * T, x1 = (BRW - 26) * T; return { x: dir > 0 ? lerp(x0, x1, u) : lerp(x1, x0, u), y: BRSKY * T, dir }; }
function brRide(f) { const b = brBarge(); f.x = f.px = b.x + (f === G.p ? 0 : ((hh(f.botI | 0, 3, 7) * 40) | 0) - 20); f.y = f.py = b.y; f.vx = f.vy = 0; f.onGround = false; }
function brLeap(f) {
  if (!f.onBarge) return; f.onBarge = false; f.glide = true; f.vy = 1; f.vx = brBarge().dir * 1.4; f.noHit = false; f.inv = 30;
  if (f === G.p) { sfx('jump', 0); G.banner = null; BR.note = 'A / D to steer, S to dive'; BR.noteT = 240; }
  burst(f.x + 3, f.y + 6, 10, SPARK, 1.4, 30, { glow: 1 });
}
function brGlide(f, I) {
  if (!f.glide) return;
  if (f.onGround || f.dead) { f.glide = false; if (!f.dead) dust(f.x + 3, f.y + f.h, 8); return; }
  const dive = I && I.down; f.vy = min(f.vy, dive ? 3.6 : 1.2);
  const want = (I ? I.md : 0) * 2.7; f.vx += (want - f.vx) * .06;
}

// ---------------- using salves and wards (it takes a moment) ----------------
function brStartUse(f, id) {
  const it = IT[id]; if (!it || it.type !== 'brheal') return false;
  const full = it.heal ? f.hp >= it.cap : (f.ward || 0) >= it.cap; if (full) { if (f === G.p) { sfx('deny'); BR.note = it.heal ? 'Your health is full' : 'Your ward is as strong as that will make it'; BR.noteT = 90; } return false; }
  f.brUse = { id, t: 0, dur: it.use }; if (f === G.p) sfx('stir', 0); return true;
}
function brTickUse(f) {
  const u = f.brUse; if (!u) return;
  if (f.dead || f.hurtT > 0 || f.state !== 'normal' || f.glide) { f.brUse = null; if (f === G.p) { BR.note = 'Interrupted'; BR.noteT = 60; } return; }
  if (++u.t < u.dur) { if (G.time % 6 === 0) P(f.x + frand(-1, 7), f.y + frand(4, 18), 0, -.5, 20, IT[u.id].ward ? '#8fd0ff' : '#ffb347', { glow: 1, g: -.01 }); return; }
  const it = IT[u.id]; f.brUse = null;
  if (f === G.p) { if (countItem(u.id) < 1) return; removeItem(u.id, 1); } else if (f.br) { if (it.heal) f.br.heals--; else f.br.wards--; }
  if (it.heal) { f.hp = min(it.cap, f.hp + it.heal); numPop(f.x + 3, f.y - 4, '+' + it.heal, '#7ddc6f'); }
  else { f.ward = min(it.cap, (f.ward || 0) + it.ward); numPop(f.x + 3, f.y - 4, '+' + it.ward, '#8fd0ff'); }
  sfx('heal', 0); burst(f.x + 3, f.y + 10, 12, it.ward ? ['#8fd0ff', '#ffffff'] : ['#7ddc6f', '#c9fff6'], 1.4, 30, { glow: 1, g: -.01 });
}
function brQuickUse(p) {
  const order = p.hp < 75 ? ['br_salve', 'br_draught', 'br_shard', 'br_ward'] : ['br_shard', 'br_ward', 'br_salve', 'br_draught'];
  for (const id of order) if (countItem(id) > 0 && brStartUse(p, id)) return; if (!p.brUse) sfx('deny');
}

// ---------------- chests ----------------
function brNearChest(f, r = 16) { let best = null, bd = r; for (const c of BR.chests) { if (c.open) continue; const d = abs(c.x * T + 4 - (f.x + 3)) + abs((c.y + 1) * T - (f.y + f.h)) * .7; if (d < bd) { bd = d; best = c; } } return best; }
function brOpenChest(c, f) {
  if (!c || c.open) return; c.open = true; c.t = 0; BR.mine.add(c.i);
  const px = c.x * T + 4, py = c.y * T + 2; sfx('craft', 0); burst(px, py, 14, c.rare ? ['#ffd35a', '#fff1a8'] : ['#ffb347', '#c98a5a'], 1.6, 30, { glow: 1 });
  const loot = brLoot(c.rare);
  if (f === G.p) { loot.forEach(([id, n], k) => spawnDrop(id, n, px - 3, py - 4, (k - (loot.length - 1) / 2) * 1.1, -2.4 - k * .2)); return; }
  if (f && f.br) for (const [id, n] of loot) brBotTake(f, id, n);
}
function brBotTake(f, id, n) {
  const it = IT[id]; if (!it) return;
  if (it.type === 'weapon') { if (brTier(id) > brTier(f.wid) || f.wid === 'fists') { f.wid = id; f.arms = f.arms || []; } }
  else if (id === 'br_salve' || id === 'br_draught') f.br.heals += n; else if (id === 'br_shard' || id === 'br_ward') f.br.wards += n;
  else if (ARMS.includes(id) && f.arms && !f.arms.includes(id)) f.arms.push(id);
}
// what you drop when you fall: everything you carried
function brSpill(f) {
  const out = [];
  if (f === G.p) { for (let i = 0; i < INV_N; i++) { const s = inv[i]; if (s && IT[s.id]) { out.push([s.id, s.n]); inv[i] = null; } } }
  else if (f.br) { if (f.wid && f.wid !== 'fists') out.push([f.wid, 1]); if (f.br.heals > 0) out.push(['br_salve', min(4, f.br.heals)]); if (f.br.wards > 0) out.push(['br_shard', min(4, f.br.wards)]); }
  return out;
}
function brDropPile(x, y, items) { items.forEach(([id, n], k) => { if (IT[id] && n > 0) spawnDrop(id, n, x + frand(-3, 3), y - 4, (k - (items.length - 1) / 2) * .9, -2 - frand(1)); }); }

// ---------------- starting a match ----------------
function brNewBot(i, skill) {
  const name = BR_BOTN[i % BR_BOTN.length], f = newFighter(0, 0, { name, skin: i % 4, team: 'B' + i, botTag: 'B' + i, botI: i, wid: 'fists', ai: newBrain(skill), brBot: true, echoBot: true, brIn: true, arms: [], ward: 0, onBarge: true, noHit: true,
    br: { heals: 0, wards: 0, drop: 0, roam: null, roamT: 0, chest: null, skip: new Set(), lx: 0, stuck: 0, think: 0 } });
  const P0 = BR.pois.length ? BR.pois : [{ x: BRW / 2 }]; f.br.drop = (rand() < .65 ? fpick(P0).x + frand(-20, 20) : frand(30, BRW - 30)) * T; return f;
}
function brSkill() { const d = SETTINGS.diff; return d === 'hard' ? frand(.58, .82) : d === 'normal' ? frand(.42, .66) : frand(.3, .52); }
// everyone runs this with the same seed, so everyone stands on the same island
function brEnterMatch(mi, seed, roster, nb) {
  const nick = G.nick, skin = G.skin;
  genRoyale(seed); freshSession(); G.nick = nick; G.skin = skin; G.clock = [.3, .36, .2, .58][seed % 4]; updateSun();
  Object.assign(BR, { mapHide: false, mi, seed, t: 0, ro: roster.slice(), nb, phase: 'drop', open: new Set(), mine: new Set(), bots: new Map(), bk: [], bkSeq: 0, bkSeen: new Map(), dlSeen: new Set(), dl: null, place: 0, spec: null, specT: 0, overT: 0, winner: '', winMe: false, chan: null, note: '', noteT: 0, inStorm: false, poiNow: '', mapOpen: false, lastAlive: 0 });
  BR.zones = brZones(seed); BR.storm = brStormAt(0); NET.deathN = 0; NET.kb = ['', 0]; NET.hits = []; NET.shots = []; NET.seen.clear();
  inv = new Array(INV_N).fill(null); G.sel = 0;
  G.p = newPlayer(); Object.assign(G.p, { name: G.nick, brIn: true, ward: 0, onBarge: true, noHit: true, team: 'me' }); G.fighters = [G.p]; G.npcs = []; G.enemies = [];
  for (const f of NET.peers.values()) { f.gone = true; } NET.peers.clear();
  // echoes fill the empty places; the leader runs them, everyone else sees them through the leader
  rng = mulberry32((seed ^ 0x2545F491) >>> 0);
  if (BR.lead) for (let i = 0; i < nb; i++) { const f = brNewBot(i, brSkill()); BR.bots.set(f.botTag, f); G.fighters.push(f); brRide(f); }
  brRide(G.p); snapCam(); G.state = 'play'; UI.open = null; G.cine = null; G.dialog = null;
  BR.total = roster.length + nb; G.banner = { text: 'THE ASHFALL', sub: BR.total + ' Wakers. Leap from the barge with SPACE.', t: 0 }; sfx('quest', 0);
}
function brSolo() {
  BR.via = 'solo'; BR.lead = true; BR.on = true; NET.me = ''; NET.status = 'off';
  const seed = (Math.random() * 4294967296) >>> 0; brEnterMatch('s' + seed.toString(36), seed, ['me'], BR_FILL - 1);
}

// ---------------- the match, every tick ----------------
function brTick() {
  if (!BR.on) return;
  if (BR.phase === 'drop' || BR.phase === 'fight') BR.t++;
  BR.storm = brStormAt(max(0, BR.t - BR_DROP));
  if (BR.phase === 'drop' && BR.t >= BR_DROP) { BR.phase = 'fight'; for (const f of G.fighters) if (f.onBarge && !f.remote) brLeap(f); }
  if (BR.noteT > 0) BR.noteT--;
  for (const c of BR.chests) if (c.open && c.t < 40) c.t++;
  // my Waker and my echoes take storm damage; everyone else's computer handles theirs
  if (BR.t % 30 === 0 && BR.phase !== 'over') for (const f of G.fighters) if (f.brIn && !f.remote && !f.dead && !f.onBarge && brOut(f)) brStormHurt(f);
  const p = G.p; BR.inStorm = !p.dead && !p.onBarge && brOut(p);
  // the named place you stand in
  if (!p.dead && !p.onBarge && G.time % 20 === 0) { const q = BR.pois.find(q => abs(q.x * T - p.x) < 26 * T); const n = q ? q.name : ''; if (n && n !== BR.poiNow) { G.note = { text: n, t: 0 }; } BR.poiNow = n; }
  // spectating after you fall
  if (p.dead && BR.phase !== 'over') { const s = BR.spec; if (!s || s.dead || s.gone || !G.fighters.includes(s)) { BR.specT++; if (BR.specT > 50) { BR.spec = brAlive().find(f => f !== p) || null; BR.specT = 0; } } if (pressed.KeyD || pressed.ArrowRight || pressed.KeyA || pressed.ArrowLeft) brSpecNext(pressed.KeyA || pressed.ArrowLeft ? -1 : 1); }
  // who is left
  const alive = brAlive(); BR.lastAlive = alive.length;
  if (BR.phase === 'fight' && alive.length <= 1 && BR.t > BR_DROP + 60) brOver(alive[0] || null);
  if (BR.phase === 'over') { BR.overT++; if (BR.via !== 'solo' && BR.overT > 60 * 14) brBackToLobby(); }
  if (BR.via !== 'solo') brNetTick();
}
const brAlive = () => G.fighters.filter(f => f.brIn && !f.dead && !f.gone);
function brSpecNext(d) { const a = brAlive().filter(f => f !== G.p); if (!a.length) return; const i = a.indexOf(BR.spec); BR.spec = a[((i < 0 ? 0 : i + d) % a.length + a.length) % a.length]; sfx('ui'); }
function brOver(w) {
  BR.phase = 'over'; BR.overT = 0; BR.winner = w ? w.name : ''; BR.winMe = w === G.p;
  if (BR.winMe) { BR.place = 1; G.banner = { text: 'YOU ARE THE LAST EMBER', sub: G.p.kills + ' taken down. The ashfall settles.', t: 0 }; sfx('quest', 0); G.flash = .5; G.flashCol = '255,211,90'; for (let i = 0; i < 40; i++) P(G.p.x + 3 + frand(-60, 60), G.p.y - frand(10, 80), frand(-.5, .5), frand(.3, 1), 90, fpick(['#ffd35a', '#ff8a3d', '#fff1a8']), { glow: 1, g: .01 }); }
  else G.banner = { text: w ? w.name + ' IS THE LAST EMBER' : 'THE ASHFALL TOOK EVERYONE', sub: BR.place ? 'you placed #' + BR.place : '', t: 0 };
  if (w && w !== G.p) BR.spec = w;
}
// someone fell (called for every death this computer is in charge of)
function brDeath(f, by) {
  const ka = by ? by.name : '';
  if (f === G.p) {
    NET.deathN++; NET.kb = [brTag(by), NET.deathN]; if (by && by.brBot && !by.remote) by.kills++;
    BR.place = brAlive().length + 1; const items = brSpill(f); BR.dl = [NET.deathN, round(f.x + 3), round(f.y + 10), items]; brDropPile(f.x + 3, f.y + 10, items);
    G.kfeed.unshift({ a: ka, b: f.name, t: 0, me: 2, txt: by ? '' : 'fell to the ashfall' }); BR.spec = by && !by.dead && by !== f ? by : null; BR.specT = 0; f.brUse = null;
  } else if (f.brBot && !f.remote) {
    if (by === G.p) { G.p.kills++; G.banner = { text: 'TAKEN DOWN', sub: f.name, t: 120 }; comboHit(true); sfx('newmove', 0); } else if (by && by.brBot && !by.remote) by.kills++;
    const items = brSpill(f); brDropPile(f.x + 3, f.y + 10, items); f.brUse = null;
    BR.bk.push([f.botTag, brTag(by), ++BR.bkSeq, round(f.x + 3), round(f.y + 10), items]); if (BR.bk.length > 8) BR.bk.shift();
    G.kfeed.unshift({ a: ka, b: f.name, t: 0, me: by === G.p ? 1 : 0, txt: by ? '' : 'fell to the ashfall' });
  }
  if (G.kfeed.length > 6) G.kfeed.length = 6;
}

// ---------------- your Waker in a match ----------------
// runs before the usual fighter tick; returns false while you ride the barge
function brInput(p, I) {
  if (p.onBarge) { if (BR.phase === 'drop' && I.jumpP && BR.t > 40) brLeap(p); else { brRide(p); return false; } }
  if (p.dead) return true;
  if (p.glide) { I.lp = I.rp = I.l = I.r = I.dodgeP = I.armP = I.jumpP = false; }
  if (p.brUse) { I.lp = I.rp = I.l = I.r = I.dodgeP = I.armP = false; I.md = 0; }
  const it = heldItem();
  if (it && it.type === 'brheal' && !UI.open) { if (I.lp && !p.brUse) brStartUse(p, it.id); I.lp = I.l = false; }
  if (!UI.open && !G.dialog) {
    if (pressed.KeyF) { const c = brNearChest(p); if (c) brOpenChest(c, p); }
    if (pressed.KeyH) brQuickUse(p);
    if (pressed.KeyT) cycleArm(p);
  }
  return true;
}
function brAfter(p, I) { brGlide(p, I); brTickUse(p); }
// the camera follows whoever you are watching
function brCamTarget() {
  const p = G.p; if (!brOn()) return null;
  // on the barge: keep it near the top of the screen and show as much of the island below as fits
  if (p.onBarge) { const b = brBarge(), gy = heights[clamp(floor(b.x / T), 0, BRW - 1)] * T, top = min(b.y - 46, (b.y + gy) / 2 - VS.vh / 2); return { x: b.x - 3, y: top + VS.vh / 2 + 4, w: 6, h: 20 }; }
  if (!p.dead) return null; const s = BR.spec; return s && !s.gone ? s : null;
}

// ---------------- echoes: they loot, mind the storm, and fight ----------------
function brSee(f, o) {
  const x0 = f.x + 3, y0 = f.y + 6, x1 = o.x + 3, y1 = o.y + 6, n = ceil(hypot(x1 - x0, y1 - y0) / 6);
  for (let k = 1; k < n; k++) { const u = k / n, tx = floor(lerp(x0, x1, u) / T), ty = floor(lerp(y0, y1, u) / T), t = tileAt(tx, ty); if (TP[t].solid && t !== PLATFORM && !TP[t].ghost) return false; }
  return true;
}
function brBotChest(f) {
  const cx = f.x + 3, fy = f.y + f.h, z = BR.storm; let best = null, bd = 1e9;
  for (const c of BR.chests) {
    if (c.open || c.cave || f.br.skip.has(c.i)) continue; const x = c.x * T + 4, dx = abs(x - cx); if (dx > 420) continue;
    if (z && (x < z.L + 16 || x > z.R - 16)) continue; const dy = (c.y + 1) * T - fy; if (dy < -7 * T) continue;
    const d = dx + abs(dy) * 2; if (d < bd) { bd = d; best = c; }
  }
  return best;
}
function brWalk(f, I, gx) {
  const B = f.ai, br = f.br, cx = f.x + 3, d = gx - cx;
  I.md = abs(d) < 5 ? 0 : sign(d); I.jumpH = false; I.down = false; I.wx = cx + I.md * 40; I.wy = f.y + 8;
  if (I.md) {
    const ax = floor((cx + I.md * 8) / T), fy = floor((f.y + f.h - 1) / T); let rise = 0;
    for (let k = 0; k < 9; k++) { if (TP[tileAt(ax, fy - k)].solid && tileAt(ax, fy - k) !== PLATFORM) rise = k + 1; else break; }
    if (f.onGround && B.jumpCd <= 0 && (rise >= 2 || f.hitWall)) { I.jumpP = I.jumpH = true; B.jumpCd = 16; }
    else if (!f.onGround && f.vy > -.4 && !f.dblUsed && (f.hitWall || rise >= 2) && canDbl(f)) I.jumpP = I.jumpH = true;
    else if (!f.onGround && f.vy < 0) I.jumpH = true;
  }
  const below = tileAt(floor(cx / T), floor((f.y + f.h + 1) / T)); if (below === PLATFORM && br.chest && (br.chest.y + 1) * T > f.y + f.h + 12) I.down = true;
  if (G.time % 30 === (f.botI | 0) % 30) { if (I.md && abs(cx - br.lx) < 3) { if (++br.stuck >= 3) { if (br.chest) br.skip.add(br.chest.i); br.chest = null; br.roam = null; br.stuck = 0; } } else br.stuck = 0; br.lx = cx; }
}
function brBotThink(f) {
  const B = f.ai, I = B.I, br = f.br;
  I.lp = I.rp = I.jumpP = I.dodgeP = I.armP = false; I.l = I.r = false;
  if (f.dead) { I.md = 0; return I; }
  if (f.glide) { const dx = br.drop - (f.x + 3); I.md = abs(dx) > 10 ? sign(dx) : 0; I.down = abs(dx) < 40 && f.y < heights[clamp(floor(f.x / T), 0, BRW - 1)] * T - 120; I.jumpH = false; return I; }
  if (f.brUse) { I.md = 0; return I; }
  const z = BR.storm, cx = f.x + 3, out = brOut(f) || (z && (cx < z.L + 6 || cx > z.R - 6));
  let foe = null, fd = 1e9;
  for (const o of foesOf(f)) { if (o.dead || o.onBarge || o.noHit) continue; const dx = abs(o.x - f.x), dy = abs(o.y - f.y); if (dx > 220 || dy > 80) continue; const dd = dx + dy * 1.5; if (dd < fd && (dd < 60 || brSee(f, o))) { fd = dd; foe = o; } }
  if (!foe && f.lastHitBy && !f.lastHitBy.dead && f.takenT > 0 && abs(f.lastHitBy.x - f.x) < 300) foe = f.lastHitBy;
  if (foe && !(out && z && z.dps >= 4)) { if (B.tgt !== foe) { B.tgt = foe; B.retarget = 40; } return aiThink(f); }
  if (B.atkCd > 0) B.atkCd--; if (B.jumpCd > 0) B.jumpCd--;
  if (f.onGround && !out && f.hurtT <= 0 && ((f.hp < 70 && br.heals > 0) || ((f.ward || 0) < 50 && br.wards > 0))) { brStartUse(f, f.hp < 70 && br.heals > 0 ? (f.hp < 45 ? 'br_draught' : 'br_salve') : (f.ward < 25 ? 'br_ward' : 'br_shard')); I.md = 0; return I; }
  let gx = null;
  if (out || !z) gx = z ? (z.L + z.R) / 2 : cx;
  else {
    if (z.left < 60 * 20 && (cx < z.nL || cx > z.nR)) gx = (z.nL + z.nR) / 2;
    if (gx === null) { if (!br.chest || br.chest.open || --br.think <= 0) { br.chest = brBotChest(f); br.think = 90; } if (br.chest) gx = br.chest.x * T + 4; }
    if (gx === null) { if (br.roam === null || abs(br.roam - cx) < 12 || --br.roamT <= 0) { br.roam = lerp(z.nL, z.nR, frand(.2, .8)); br.roamT = 900; } gx = br.roam; }
  }
  brWalk(f, I, gx);
  const c = br.chest; if (c && !c.open && abs(c.x * T + 4 - cx) < 10 && abs((c.y + 1) * T - (f.y + f.h)) < 14 && f.onGround) { brOpenChest(c, f); br.chest = null; br.think = 0; }
  return I;
}
// echoes riding the barge leap when it passes the spot they chose
function brBotRide(f) { const b = brBarge(); if (BR.phase === 'drop' && BR.t > 60 && (abs(b.x - f.br.drop) < 60 || BR.t > BR_DROP - 30)) brLeap(f); else brRide(f); }
function brBotAfter(f) { brGlide(f, f.ai.I); brTickUse(f); }
