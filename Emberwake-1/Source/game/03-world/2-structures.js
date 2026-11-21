// ============================================================
//  Structures scattered by the seed: huts, hunters' camps, stone circles,
//  ruined watchtowers, wells, graveyards over crypts, half-buried dune ruins,
//  fen stilt-houses, old mine tunnels, geodes, and ruins in the sky.
//  Chests are filled the first time anyone opens them, from a table that
//  fits the place, rolled from the world seed.
// ============================================================
const LOOT_T = {
  hut: [['scroll', 0.06, 1, 1], ['twine', .6, 2, 5], ['rope', .3, 1, 2], ['jerky', .4, 1, 3], ['torch', .5, 2, 5], ['salve', .2, 1, 1], ['copper_ore', .3, 2, 6], ['arrow', .3, 4, 10], ['flint_axe', .15, 1, 1], ['bone_spear', .1, 1, 1], ['berries', .4, 2, 5]],
  camp: [['scroll', 0.08, 1, 1], ['hide', .6, 1, 2], ['meat', .5, 1, 2], ['salt', .4, 1, 3], ['arrow', .5, 6, 12], ['wood_shortbow', .15, 1, 1], ['leather', .3, 1, 2], ['jerky', .5, 2, 4], ['flint_knife', .2, 1, 1]],
  cairn: [['scroll', 0.2, 1, 1], ['shard', .5, 1, 2], ['flint', .8, 2, 5], ['glowcap', .4, 1, 3], ['whetstone', .3, 1, 1], ['bone_daggers', .15, 1, 1], ['salve', .3, 1, 2], ['bone', .5, 2, 4]],
  tower: [['scroll', 0.18, 1, 1], ['iron_ore', .4, 2, 6], ['fittings', .4, 2, 6], ['copper_bar', .3, 1, 3], ['arrow', .5, 8, 16], ['iron_shortsword', .12, 1, 1], ['spyglass', .06, 1, 1], ['rope', .4, 1, 3], ['tin_bar', .2, 1, 2]],
  crypt: [['scroll', 0.25, 1, 1], ['bone', .8, 2, 6], ['shard', .5, 1, 3], ['iron_bar', .3, 1, 2], ['salve', .4, 1, 2], ['iron_sabre', .08, 1, 1], ['hollow_ash', .4, 1, 3], ['venom', .3, 1, 1], ['husk_fiber', .5, 1, 3]],
  dune: [['scroll', 0.12, 1, 1], ['salt', .7, 2, 5], ['glass', .4, 1, 3], ['scale', .3, 1, 2], ['tin_ore', .4, 2, 5], ['bronze_bar', .2, 1, 2], ['bronze_kama', .1, 1, 1], ['bone', .5, 1, 4]],
  stilt: [['scroll', 0.1, 1, 1], ['lurker_oil', .4, 1, 2], ['reed', .6, 3, 8], ['peat', .5, 2, 5], ['cloth', .3, 1, 2], ['fieldmap', .15, 1, 1], ['bone_trident', .1, 1, 1], ['jug', .4, 1, 2]],
  mine: [['coal', .6, 2, 6], ['iron_ore', .5, 2, 6], ['tin_ore', .4, 2, 6], ['copper_pick', .12, 1, 1], ['torch', .7, 3, 8], ['charge', .25, 1, 2], ['rope', .4, 1, 2], ['copper_ore', .5, 3, 6]],
  geode: [['geode_core', .35, 1, 1], ['snow', .9, 3, 8], ['skyglass', .2, 1, 2], ['glass_sai', .05, 1, 1], ['shard', .3, 1, 2]],
  sky: [['skysilk', .7, 2, 5], ['glider', .15, 1, 1], ['shard', .5, 1, 2], ['glass_glaive', .06, 1, 1], ['skyglass', .3, 1, 2], ['membrane', .4, 1, 2]],
  vault: [['shard', .6, 1, 3], ['iron_bar', .4, 1, 3], ['salve', .5, 1, 2], ['steel_bar', .15, 1, 1], ['compass', .08, 1, 1], ['fittings', .4, 2, 4]]
};
// how far along a find is: 0 everyday, 1 iron and kin, 2 steel and glass, 3 the deep metals
const lootRank = id => /^(deep|ember|kblade|kmaul)/.test(id) ? 3 : /^(steel|glass)/.test(id) ? 2 : /^(iron|chitin|rust)/.test(id) ? 1 : 0;
function fillLoot(i, key) {
  const R = mulberry32((SEED ^ (i * 2654435761)) >>> 0), items = new Array(20).fill(null); let k = 0;
  const far = clamp(abs((i % WW) - SPAWN_X) / 1800, .15, 1), cap = 6;
  for (const [id, ch, a, b] of LOOT_T[key] || []) { const rk = lootRank(id), c2 = ch * [1, .75, .45 * far, .25 * far][rk]; if (IT[id] && R() < c2 && k < cap) { const n = a + floor(R() * (b - a + 1) * (rk >= 2 ? .6 : 1)); items[k++] = { id, n: max(1, min(n, IT[id].stack)) }; } }
  if (!k) items[0] = { id: 'torch', n: 3 };
  for (let q = items.length - 1; q > 0; q--) { const j = floor(R() * (q + 1)); [items[q], items[j]] = [items[j], items[q]]; }
  return items;
}
function chestAt(x, y, key) { if (!inW(x, y)) return; dyn(x, y, CHEST); LOOT.set(y * WW + x, key); }
function groundAt(x) { let y = max(2, heights[x] - 26); while (y < WH - 4 && !TP[tiles[y * WW + x]].solid) y++; return y; }
function buildStructures(free) {
  const n = WORLD.size === 0 ? 9 : WORLD.size === 1 ? 13 : 20, made = {};
  const KINDS = { moor: ['hut', 'camp', 'circle', 'tower', 'well', 'graves'], thorn: ['camp', 'hut', 'tower', 'circle'], reach: ['camp', 'circle', 'tower'], fen: ['stilt', 'stilt', 'hut'], dunes: ['dune', 'dune', 'well', 'graves'], scoria: ['tower', 'dune', 'camp'], ash: ['graves'] };
  for (let k = 0, tries = 0; k < n && tries < n * 40; tries++) {
    const x = randi(24, WW - 30), b = biomeAt(x), kinds = KINDS[b]; if (!kinds || !free(x, 9)) continue;
    let kind = kinds[randi(0, kinds.length - 1)]; if ((made[kind] || 0) > n / 3) continue;
    const ok = STRUCT_B[kind](x); if (ok) { made[kind] = (made[kind] || 0) + 1; k++; reserve(x - 9, x + 12, 1); }
  }
  // the Waker's Blade waits in one of them
  const at = SPOTS.towerTop || SPOTS.crypt || SPOTS.cairn; if (at) { dyn(at.x, at.y, PEDESTAL); SPOTS.blade = { x: at.x, y: at.y }; }
  else { const x = clamp(SPAWN_X + (SHRINE_X > SPAWN_X ? -1 : 1) * (VIL_W + 30), 20, WW - 20), gy = groundAt(x); tiles[(gy - 1) * WW + x] = AIR; dyn(x, gy - 1, PEDESTAL); SPOTS.blade = { x, y: gy - 1 }; }
  // underground: old mine tunnels and geodes
  const nt = WORLD.size === 0 ? 3 : WORLD.size === 1 ? 5 : 7, ng = WORLD.size === 0 ? 2 : WORLD.size === 1 ? 3 : 5;
  for (let k = 0, tries = 0; k < nt && tries < 200; tries++) { const x = randi(30, WW - 60), y = heights[x] + randi(22, 70); if (y > DEEP_Y - 12 || abs(x - SPAWN_X) < VIL_W + 20 || abs(x - FORGE_X) < 50) continue; if (mineTunnel(x, y)) k++; }
  for (let k = 0, tries = 0; k < ng && tries < 200; tries++) { const x = randi(30, WW - 30), y = randi(heights[x] + 40, DEEP_Y - 16); if (abs(x - SPAWN_X) < VIL_W + 20 || abs(x - FORGE_X) < 50) continue; if (geode(x, y, randi(6, 9))) k++; }
}
const STRUCT_B = {
  hut(x) { const x0 = x, gy = flatten(x0 - 1, x0 + 7, DIRT); hutAt(x0, gy, false); chestAt(x0 + (SPOTS._d === x0 ? 5 : 1), gy - 1, 'hut'); mark('s' + x0, 'AN ABANDONED HUT', 'someone left in a hurry', x0 + 3, gy - 3, 8); LANDMARKS[LANDMARKS.length - 1].small = 1; return true; },
  stilt(x) {
    let gy = groundAt(x + 3); const top = gy - 5;
    for (let xx = x - 1; xx <= x + 7; xx++) for (let y = top - 8; y < top; y++) if (inW(xx, y) && !TP[tiles[y * WW + xx]].liquid) { tiles[y * WW + xx] = AIR; walls[y * WW + xx] = 0; }
    for (const px of [x, x + 6]) for (let y = top + 1; y < groundAt(px); y++) if (!TP[tiles[y * WW + px]].solid) tiles[y * WW + px] = BEAM;
    for (let y = top + 1; y < groundAt(x + 3); y++) if (!TP[tiles[y * WW + x + 3]].solid) tiles[y * WW + x + 3] = LADDER;
    hutAt(x, top, true); chestAt(x + 5, top - 1, 'stilt'); mark('s' + x, 'A STILT HOUSE', 'high and dry over the fen', x + 3, top - 3, 8); LANDMARKS[LANDMARKS.length - 1].small = 1; return true;
  },
  camp(x) {
    const gy = flatten(x - 4, x + 5, DIRT); dyn(x, gy - 1, FIRE); dyn(x - 3, gy - 1, RACK); chestAt(x + 4, gy - 1, 'camp'); dyn(x + 2, gy - 1, BEDROLL);
    tiles[(gy - 1) * WW + x - 5] = STICKS; tiles[(gy - 1) * WW + x + 5] = BONES; mark('s' + x, "A HUNTERS' CAMP", 'the ashes are cold', x, gy - 3, 8); LANDMARKS[LANDMARKS.length - 1].small = 1; return true;
  },
  circle(x) {
    const gy = flatten(x - 9, x + 9, DIRT);
    for (const [dx, h] of [[-8, 2], [-4, 3], [0, 3], [4, 3], [8, 2]]) for (let y = 1; y <= h; y++) tiles[(gy - y) * WW + x + dx] = y === h ? CUTSTONE : STONE;
    tiles[(gy + 1) * WW + x] = CUTSTONE; chestAt(x, gy + 2, 'cairn'); tiles[(gy - 1) * WW + x + 1] = PEBBLE; SPOTS.cairn = SPOTS.cairn || { x: x + 2, y: gy - 1 };
    mark('s' + x, 'A STONE CIRCLE', 'something is buried at its heart', x, gy - 5, 10); LANDMARKS[LANDMARKS.length - 1].small = 1; return true;
  },
  tower(x) {
    const x0 = x, gy = flatten(x0 - 1, x0 + 5, STONE), H = randi(12, 15);
    for (let y = gy - H - 2; y < gy; y++) for (let xx = x0; xx <= x0 + 4; xx++) { tiles[y * WW + xx] = AIR; walls[y * WW + xx] = y > gy - H ? W_COBBLE : 0; }
    for (let y = gy - H; y < gy; y++) { if (hash2(x0, y) > .9 && y < gy - H + 3) continue; tiles[y * WW + x0] = COBBLE; tiles[y * WW + x0 + 4] = COBBLE; }
    for (let y = gy - 3; y < gy; y++) { tiles[y * WW + x0] = AIR; tiles[y * WW + x0 + 4] = AIR; }
    for (let f = gy - 5; f > gy - H; f -= 5) for (let xx = x0 + 1; xx <= x0 + 3; xx++) if (xx !== x0 + 1) tiles[f * WW + xx] = PLANK;
    for (let y = gy - H + 1; y < gy; y++) tiles[y * WW + x0 + 1] = LADDER;
    const topF = gy - 5 * floor((H - 1) / 5); chestAt(x0 + 3, topF - 1, 'tower'); if (!SPOTS.towerTop && topF - 1 > 4) SPOTS.towerTop = { x: x0 + 2, y: topF - 1 };
    for (let xx = x0; xx <= x0 + 4; xx++) if (hash2(xx, x0) > .4) tiles[(gy - H - 1) * WW + xx] = COBBLE;
    mark('s' + x0, 'A RUINED WATCHTOWER', 'climb it', x0 + 2, gy - 6, 8); LANDMARKS[LANDMARKS.length - 1].small = 1; return true;
  },
  well(x) {
    const gy = flatten(x - 3, x + 3, DIRT);
    for (let y = gy; y < gy + 9; y++) { tiles[y * WW + x] = y >= gy + 6 ? WATER : AIR; tiles[y * WW + x - 1] = COBBLE; tiles[y * WW + x + 1] = COBBLE; walls[y * WW + x] = W_COBBLE; }
    tiles[(gy + 9) * WW + x] = COBBLE; tiles[(gy - 1) * WW + x - 1] = CUTSTONE; tiles[(gy - 1) * WW + x + 1] = CUTSTONE; tiles[(gy - 2) * WW + x] = BEAMH;
    for (let y = gy - 1; y < gy + 6; y++) tiles[y * WW + x] = ROPE;
    for (let y = gy - 2; y < gy; y++) { tiles[y * WW + x - 2] = BEAM; tiles[y * WW + x + 2] = BEAM; } return true;
  },
  graves(x) {
    const gy = flatten(x - 6, x + 6, DIRT);
    for (const dx of [-5, -2, 1, 4]) { tiles[(gy - 1) * WW + x + dx] = CUTSTONE; if (hash2(x + dx, 1) > .4) tiles[(gy - 2) * WW + x + dx] = CUTSTONE; tiles[(gy - 1) * WW + x + dx + 1] = BONES; }
    const cy = gy + 8; for (let yy = cy - 3; yy <= cy + 2; yy++) for (let xx = x - 5; xx <= x + 5; xx++) { const edge = yy === cy - 3 || yy === cy + 2 || xx === x - 5 || xx === x + 5; tiles[yy * WW + xx] = edge ? BRICK : AIR; walls[yy * WW + xx] = W_BRICK; }
    for (let y = gy - 1; y < cy - 2; y++) { tiles[y * WW + x] = y < gy ? AIR : LADDER; walls[y * WW + x] = W_BRICK; } tiles[(cy - 3) * WW + x] = LADDER;
    chestAt(x + 3, cy + 1, 'crypt'); tiles[(cy + 1) * WW + x - 3] = POT; tiles[(cy + 1) * WW + x - 2] = BONES; dyn(x - 1, cy - 1, TORCH); SPOTS.crypt = SPOTS.crypt || { x: x + 1, y: cy + 1 };
    mark('s' + x, 'A GRAVEYARD', 'a ladder goes down', x, gy - 3, 9); LANDMARKS[LANDMARKS.length - 1].small = 1; return true;
  },
  dune(x) {
    const gy = groundAt(x);
    for (const [dx, h] of [[-4, 2], [-3, 3], [2, 2], [3, 3], [4, 1]]) for (let y = 1; y <= h; y++) tiles[(gy - y) * WW + x + dx] = SANDSTONE;
    for (let xx = x - 2; xx <= x + 1; xx++) walls[(gy - 1) * WW + xx] = W_SAND; chestAt(x - 1, gy + 2, 'dune'); tiles[(gy + 1) * WW + x - 1] = SAND;
    mark('s' + x, 'A BURIED RUIN', 'dig where the walls lean', x, gy - 4, 8); LANDMARKS[LANDMARKS.length - 1].small = 1; return true;
  }
};
function hutAt(x0, gy, stilt) {
  for (let x = x0; x <= x0 + 6; x++) { for (let y = gy - 8; y < gy; y++) { tiles[y * WW + x] = AIR; walls[y * WW + x] = (y >= gy - 5 && x > x0 && x < x0 + 6) ? W_PLANK : 0; } tiles[gy * WW + x] = PLANK; }
  for (let y = gy - 5; y < gy; y++) { tiles[y * WW + x0] = LOGWALL; tiles[y * WW + x0 + 6] = LOGWALL; }
  const ds = stilt ? x0 : (hash2(x0, gy) > .5 ? x0 : x0 + 6); SPOTS._d = ds; for (let y = gy - 3; y < gy; y++) { tiles[y * WW + ds] = DOORC; if (!stilt) tiles[y * WW + (ds === x0 ? x0 + 6 : x0)] = DOORC; }
  for (let x = x0 - 1; x <= x0 + 7; x++) if (inW(x, gy - 6)) tiles[(gy - 6) * WW + x] = THATCH; for (let x = x0 + 1; x <= x0 + 5; x++) tiles[(gy - 7) * WW + x] = THATCH;
  if (stilt) tiles[gy * WW + x0 + 3] = AIR;
}
function mineTunnel(x, y) {
  const L = randi(24, 40), dir = rand() < .5 ? 1 : -1; if (x + dir * L < 10 || x + dir * L > WW - 10) return false;
  for (let k = 0; k <= L; k++) { const xx = x + dir * k; for (let yy = y - 2; yy <= y; yy++) { if (tiles[yy * WW + xx] === BEDROCK) return false; } }
  for (let k = 0; k <= L; k++) {
    const xx = x + dir * k, wob = round(sin(k * .2) * .8);
    for (let yy = y - 2 + wob; yy <= y + wob; yy++) { tiles[yy * WW + xx] = AIR; }
    if (k % 6 === 3) { for (let yy = y - 2 + wob; yy <= y + wob; yy++) tiles[yy * WW + xx] = BEAM; tiles[(y - 3 + wob) * WW + xx] = BEAMH; }
    if (k % 12 === 9) dyn(xx, y - 2 + wob, TORCH);
    if (hash2(xx, y) > .8) { const yy = y + wob + (hash2(xx, 5) > .5 ? 1 : -3); if (TP[tiles[yy * WW + xx]].solid && tiles[yy * WW + xx] !== BEDROCK) tiles[yy * WW + xx] = [COPPER, TIN, COAL, IRON][(hash2(xx, 9) * 4) | 0]; }
  }
  const ex = x + dir * L; chestAt(ex, y + round(sin(L * .2) * .8), 'mine'); return true;
}
function geode(cx, cy, R) {
  for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) if (!inW(x, y) || tiles[y * WW + x] === BEDROCK || walls[y * WW + x] === W_BRICK || walls[y * WW + x] === W_PLANK) return false;
  for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) {
    const d = hypot(x - cx, (y - cy) * 1.15); if (d > R) continue; const i = y * WW + x;
    if (d > R - 1.6) tiles[i] = GEODE; else { tiles[i] = AIR; walls[i] = W_DEEP; }
  }
  for (let x = cx - R + 2; x <= cx + R - 2; x++) { let y = cy; while (y < cy + R && tiles[(y + 1) * WW + x] === AIR) y++; if (tiles[(y + 1) * WW + x] === GEODE && hash2(x, y) > .45) tiles[y * WW + x] = CRYSTAL; }
  if (rand() < .55) { let y = cy; while (y < cy + R && tiles[(y + 1) * WW + cx] !== GEODE) y++; tiles[y * WW + cx] = AIR; chestAt(cx, y, 'geode'); }
  mark('g' + cx, 'A GEODE', 'glass grows in the dark', cx, cy, R + 2); LANDMARKS[LANDMARKS.length - 1].small = 1; return true;
}
// after the islands exist: ruins and chests on a couple of them
function skyRuins() {
  let n = 0; for (const s of ISLES) { if (n >= 2 || s.a < 7 || RESV[s.cx] > 1 || abs(s.cx - SKY_X) < 20) continue; let y = s.cy - 6; while (y < s.cy + 4 && tileAt(s.cx, y) === AIR) y++; if (tileAt(s.cx, y) !== SNOW) continue;
    for (const dx of [-3, 3]) for (let k = 1; k <= 4; k++) if (tileAt(s.cx + dx, y - k) === AIR) tiles[(y - k) * WW + s.cx + dx] = BRICK; for (let dx = -3; dx <= 3; dx++) if (tileAt(s.cx + dx, y - 5) === AIR) tiles[(y - 5) * WW + s.cx + dx] = BRICK;
    chestAt(s.cx, y - 1, 'sky'); n++; }
}

// cliffs a Waker cannot jump get a way up: low ones grow a talus of steps, tall ones carry ivy, glass roots or old chains
function makeTraversable() {
  const fill = x => { const b = biomeAt(x); return b === 'reach' ? SNOW : b === 'scoria' || b === 'dunes' ? SAND : b === 'ash' ? ASH : b === 'fen' ? MUD : DIRT; };
  const aid = x => { const b = biomeAt(x); return b === 'reach' ? GLASSROOT : b === 'scoria' || b === 'dunes' || b === 'ash' ? RUSTCHAIN : CREEPER; };
  const free = x => x > 0 && x < WW - 1 && (RESV[x] | 0) < 2, soft = i => !tiles[i] || (TP[tiles[i]].decor && !TP[tiles[i]].dyn);
  const S = new Int16Array(WW);
  for (let x = 0; x < WW; x++) { let y = max(2, heights[x] - 1); while (y < WH - 2 && !(tiles[y * WW + x] && (TP[tiles[y * WW + x]].solid || TP[tiles[y * WW + x]].liquid))) y++; S[x] = y; }
  for (let pass = 0; pass < 5; pass++) {
    let changed = false;
    for (let x = 1; x < WW - 1; x++) {
      const d = S[x - 1] - S[x]; if (abs(d) <= 4) continue;
      const hiX = d > 0 ? x : x - 1, loX = d > 0 ? x - 1 : x, dir = d > 0 ? -1 : 1, H = abs(d), loT = S[loX];
      if (!free(hiX) || !free(loX)) continue;
      const wet = TP[tiles[loT * WW + loX]].liquid;
      if (H <= 10 && !wet) {
        let y = S[hiX] + 3, cx = loX;
        while (free(cx) && y < S[cx] - 1 && !TP[tiles[S[cx] * WW + cx]].liquid) { let ok = true; for (let yy = y; yy < S[cx]; yy++) if (!soft(yy * WW + cx) && !TP[tiles[yy * WW + cx]].climb && !TP[tiles[yy * WW + cx]].stalk) ok = false; if (!ok) break; for (let yy = y; yy < S[cx]; yy++) { const i = yy * WW + cx; if (soft(i)) tiles[i] = fill(cx); } S[cx] = y; y += 3; cx += dir; }
        changed = true;
      } else if (H > 4) {
        for (let y = S[hiX] - 1; y < loT; y++) { const i = y * WW + loX; if (soft(i)) tiles[i] = aid(loX); }
      }
    }
    if (!changed) break;
  }
  for (let x = 0; x < WW; x++) { heights[x] = min(heights[x], S[x]); SKYL[x] = max(SKYL[x], S[x] + 3); }
}
