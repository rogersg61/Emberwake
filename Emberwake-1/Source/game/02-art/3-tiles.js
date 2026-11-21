// ============================================================
//  Round 4 tiles: new ground and ores, gatherable plants, building parts
//  (beams, doors, ladders, windows, walls) and crafting stations.
//  MAT holds what mining needs: how tough each 2x2 chunk of a tile is,
//  which tool tier it takes, what kind of tool bites best, and what dust,
//  rubble or ore it gives back as you carve it away.
// ============================================================
const GRAVEL = 40, MUD = 41, PEAT = 42, TIN = 43, COAL = 44, SALT = 45, CLAY = 46, TRUNK4 = 47, REED = 48, BERRY = 49, BUSH = 50, PEBBLE = 51, STICKS = 52, BONES = 53, GEODE = 54,
  PACKED = 56, COBBLE = 57, CUTSTONE = 58, MUDBRICK = 59, LOGWALL = 60, WATTLE = 61, THATCH = 62, WINDOW = 63, BEAM = 64, BEAMH = 65, DOORC = 66, DOORO = 67, LADDER = 68, ROPE = 69, CINDERBRICK = 70,
  CHEST = 72, BEDROLL = 73, FIRE = 74, WHEEL = 75, QUERN = 76, BLOOMERY = 77, ANVIL = 78, ANVIL2 = 79, LOOM = 80, RACK = 81, CAULDRON = 82, MASON = 83, SIEVE = 84, WAYSTONE = 85, CHARGE = 86,
  CREEPER = 87, GLASSROOT = 88, RUSTCHAIN = 89, POST = 90;
const W_WATTLE = 10, W_MUDB = 11, W_COBBLE = 12, W_CUT = 13, W_LOG = 14;
defT(GRAVEL, { name: 'Gravel', solid: true, full: true, hard: 12, hi: '#8a8296', dust: '#6b6478' });
defT(MUD, { name: 'Fen Mud', solid: true, full: true, hard: 12, hi: '#6f5a66', dust: '#4a3438' });
defT(PEAT, { name: 'Peat', solid: true, full: true, hard: 12, hi: '#5a4a36', dust: '#3a2a28' });
defT(TIN, { name: 'Whitetin Ore', solid: true, full: true, hard: 40, hi: '#375666', dust: '#e6edf2' });
defT(COAL, { name: 'Blackseam Coal', solid: true, full: true, hard: 36, hi: '#375666', dust: '#3a3448' });
defT(SALT, { name: 'Saltrock', solid: true, full: true, hard: 24, hi: '#ffffff', dust: '#efe2e6' });
defT(CLAY, { name: 'Wet Clay', solid: true, full: true, hard: 14, hi: '#c49c8a', dust: '#a0786a' });
defT(TRUNK4, { name: 'Thornwood', hard: 24, dust: '#7a3434', ground: true, stalk: true });
defT(REED, { name: 'Reeds', decor: true, hard: 1, ground: true, dust: '#6fae7a' });
defT(BERRY, { name: 'Emberberry Bush', decor: true, hard: 1, ground: true, dust: '#ff6a4a' });
defT(BUSH, { name: 'Picked Bush', decor: true, hard: 1, ground: true, dust: '#3a6f46' });
defT(PEBBLE, { name: 'Pebbles', decor: true, hard: 1, ground: true, dust: '#6b6478' });
defT(STICKS, { name: 'Fallen Sticks', decor: true, hard: 1, ground: true, dust: '#7a5a40' });
defT(BONES, { name: 'Old Bones', decor: true, hard: 1, ground: true, dust: '#e6dccc' });
// natural climbing aids on cliffs too tall to jump: ivy, glass roots, old climbers' chains
defT(CREEPER, { name: 'Cliff Ivy', climb: 1, hard: Infinity, dust: '#3a7a52' }); defT(GLASSROOT, { name: 'Glass Roots', climb: 1, hard: Infinity, dust: '#8fd0d8', light: [.04, .08, .09] }); defT(RUSTCHAIN, { name: "Climbers' Chain", climb: 1, hard: Infinity, dust: '#bd5a36' });
defT(GEODE, { name: 'Geode Shell', solid: true, full: true, hard: 60, hi: '#c9b4f0', dust: '#7a64b8', light: [.14, .07, .22] });
// parts the player builds with. part: 1 joins them to the support web
const defPart = (id, o) => defT(id, Object.assign({ part: 1, hard: 14 }, o));
defPart(PACKED, { name: 'Packed Earth', solid: true, full: true, hi: '#7d6386', dust: '#5b4364', drop: 'packed' });
defPart(COBBLE, { name: 'Cobble', solid: true, full: true, hi: '#8a94a4', dust: '#5a6474', drop: 'cobble' });
defPart(CUTSTONE, { name: 'Cut Stone', solid: true, full: true, hi: '#c0bac8', dust: '#8a8496', drop: 'cutstone' });
defPart(MUDBRICK, { name: 'Mudbrick', solid: true, full: true, hi: '#d0a47a', dust: '#a07a58', drop: 'mudbrick' });
defPart(LOGWALL, { name: 'Log Wall', solid: true, full: true, hi: '#a07a50', dust: '#5a4030', drop: 'logwall' });
defPart(WATTLE, { name: 'Wattle and Daub', solid: true, full: true, hi: '#a8987a', dust: '#8a7a62', drop: 'wattle' });
defPart(THATCH, { name: 'Thatch', solid: true, full: true, hi: '#f0d070', dust: '#c9a44a', drop: 'thatch' });
defPart(CINDERBRICK, { name: 'Cinderbrick', solid: true, full: true, hi: '#7a3a32', dust: '#4a2228', drop: 'cinderbrick', light: [.12, .03, .01] });
defPart(WINDOW, { name: 'Window', solid: true, hi: '#dcf7f5', dust: '#8fd0d8', drop: 'window' });
defPart(BEAM, { name: 'Post', hi: '#8a6a48', dust: '#6b4a2f', drop: 'beam' });
defPart(BEAMH, { name: 'Beam', plat: true, hi: '#8a6a48', dust: '#6b4a2f', drop: 'beamh' });
defPart(DOORC, { name: 'Door', solid: true, hi: '#6f97a4', dust: '#5c8290', drop: 'door' });
defPart(DOORO, { name: 'Door', hi: '#6f97a4', dust: '#5c8290', drop: 'door' });
defPart(LADDER, { name: 'Ladder', climb: 1, hi: '#8a6a48', dust: '#6b4a2f', drop: 'ladder' });
defPart(ROPE, { name: 'Rope', climb: 1, hang: true, hard: 4, dust: '#c9a44a', drop: null });
const defStn = (id, name, drop, o) => defT(id, Object.assign({ name, dyn: true, hard: 12, ground: true, drop, part: 1, dust: '#7a5a40' }, o));
defStn(CHEST, 'Chest', 'chest'); defStn(BEDROLL, 'Bedroll', 'bedroll', { dust: '#a83a3e' }); defStn(FIRE, 'Campfire', 'campfire', { light: [1, .6, .26], dust: '#8d8794' });
defStn(WHEEL, 'Potter\'s Wheel', 'wheel'); defStn(QUERN, 'Quern', 'quern', { dust: '#8d8794' }); defStn(BLOOMERY, 'Bloomery', 'bloomery', { light: [.6, .26, .08], dust: '#a0786a' });
defStn(ANVIL, 'Stone Anvil', 'anvil', { dust: '#8d8794' }); defStn(ANVIL2, 'Iron Anvil', 'anvil2', { dust: '#5f5a69' }); defStn(LOOM, 'Loom', 'loom'); defStn(RACK, 'Drying Rack', 'rack');
defStn(CAULDRON, 'Cauldron', 'cauldron', { dust: '#a0786a' }); defStn(MASON, 'Mason\'s Bench', 'mason', { dust: '#8d8794' }); defStn(SIEVE, 'Sieve', 'sieve');
defStn(WAYSTONE, 'Waystone', 'waystone', { light: [.3, .2, .55], dust: '#8a84a0' }); defStn(CHARGE, 'Blasting Charge', null, { hard: 1 }); defStn(POST, 'Practice Post', 'post', { dust: '#8a6a48' });
const STATIONS = { [BENCH]: 'bench', [FURNACE]: 'kiln', [FIRE]: 'fire', [WHEEL]: 'wheel', [QUERN]: 'quern', [BLOOMERY]: 'bloom', [ANVIL]: 'anvil', [ANVIL2]: 'anvil', [LOOM]: 'loom', [RACK]: 'rack', [CAULDRON]: 'pot', [MASON]: 'mason', [SIEVE]: 'sieve', [CHEST]: 'chest', [WAYSTONE]: 'way', [POST]: 'train' };
TP[BENCH].part = 1; TP[FURNACE].part = 1; TP[PLANK].part = 1; TP[BRICK].part = 1; TP[PLATFORM].part = 1;

// ---------------- what mining sees ----------------
const MAT = [], EFF = {
  soil: { hand: .9, pick: .6, shovel: 1.6, axe: .3, hammer: .5, knife: .3 },
  sand: { hand: 1.1, pick: .5, shovel: 1.7, axe: .2, hammer: .4, knife: .2 },
  clay: { hand: .75, pick: .8, shovel: 1.5, axe: .3, hammer: .6, knife: .5 },
  stone: { hand: 0, pick: 1, shovel: .15, axe: .1, hammer: .85, knife: 0 },
  ore: { hand: 0, pick: 1, shovel: .1, axe: .05, hammer: .95, knife: 0 },
  wood: { hand: 0, pick: .35, shovel: .2, axe: 1.7, hammer: .8, knife: .35 },
  glass: { hand: .4, pick: 1, shovel: .4, axe: .4, hammer: 1.5, knife: .3 }
};
const TIER_N = ['bare hands', 'a stone or flint tool', 'a sunmetal tool', 'a sunbronze tool', 'a hollow iron tool', 'a nightsteel tool', 'an embersteel tool'];
function defM(ids, o) { for (const t of [].concat(ids)) MAT[t] = Object.assign({ hp: 4, tier: 0, k: 'soil', y: [], fall: 0 }, o); }
defM([DIRT, GRASS], { hp: 3, y: [['dirt', 2]] }); MAT[GRASS].y = [['dirt', 2], ['fiber', .6]];
defM(MUD, { hp: 3, y: [['dirt', 1], ['clay', 1.2]] }); defM(PEAT, { hp: 3, y: [['peat', 2]] });
defM(ASH, { hp: 2, k: 'sand', y: [['ash', 2]], fall: 1 }); defM(SNOW, { hp: 3, k: 'sand', y: [['snow', 1.5]] });
defM(SAND, { hp: 2, k: 'sand', y: [['sand', 2]], fall: 1 }); defM(GRAVEL, { hp: 3, k: 'sand', y: [['gravel', 2], ['flint', .35]], fall: 1 });
defM(CLAY, { hp: 3, k: 'clay', y: [['clay', 3]] });
defM(SANDSTONE, { hp: 5, tier: 1, k: 'stone', y: [['clay', 1.4], ['sand', .6]] });
defM(STONE, { hp: 5, tier: 1, k: 'stone', y: [['rock', 2.5]], ham: [['gravel', 2.2], ['flint', .25]] });
defM(DEEPSTONE, { hp: 9, tier: 3, k: 'stone', y: [['deepstone', 2]], ham: [['gravel', 2]] });
defM(DEEPGLOW, { hp: 9, tier: 3, k: 'ore', y: [['deepstone', 1], ['cinder', .8]] });
defM(COPPER, { hp: 7, tier: 1, k: 'ore', y: [['copper_ore', 3], ['rock', .5]] }); defM(TIN, { hp: 7, tier: 1, k: 'ore', y: [['tin_ore', 3], ['rock', .5]] });
defM(COAL, { hp: 6, tier: 1, k: 'ore', y: [['coal', 3]] }); defM(SALT, { hp: 5, tier: 1, k: 'stone', y: [['salt', 3]] });
defM(IRON, { hp: 9, tier: 2, k: 'ore', y: [['iron_ore', 3], ['rock', .5]] }); defM(EMBER, { hp: 12, tier: 4, k: 'ore', y: [['shard', 1.6], ['rock', .5]] });
defM(GEODE, { hp: 10, tier: 3, k: 'glass', y: [['snow', 2], ['rock', .5]] });
defM([TRUNK, TRUNK2, TRUNK3, TRUNK4], { hp: 6, tier: 1, k: 'wood', y: [['log', 1]] });
defM([PLANK, LOGWALL, WATTLE, THATCH, BEAM, BEAMH, DOORC, DOORO, LADDER, ROPE, PLATFORM, CHEST, BEDROLL, WHEEL, LOOM, RACK, SIEVE, BENCH], { hp: 4, k: 'wood' });
defM([PACKED], { hp: 4, k: 'soil' }); defM([MUDBRICK], { hp: 5, k: 'clay' });
defM([COBBLE, CUTSTONE, BRICK, QUERN, ANVIL, MASON, WAYSTONE, FURNACE, FIRE, BLOOMERY, CAULDRON], { hp: 7, tier: 1, k: 'stone' });
defM([CINDERBRICK, ANVIL2], { hp: 9, tier: 2, k: 'stone' }); defM([WINDOW], { hp: 2, k: 'glass' });
MAT[PLANK].y = [['plank', 1]]; MAT[BRICK].y = [['brick', 1]]; MAT[PLATFORM].y = [['platform', 1]];
for (let t = 0; t < TP.length; t++) if (TP[t] && TP[t].part && TP[t].drop && MAT[t] && !MAT[t].y.length) MAT[t].y = [[TP[t].drop, 1]];
// what plants, litter and urns give when you take them by hand
const PLUCK = {
  [TALLGRASS]: [['fiber', 1, 2]], [FLOWER]: [['fiber', 1, 1]], [GLOWCAP]: [['glowcap', 1, 1]], [DEADBUSH]: [['stick', 2, 3]], [VINE]: [['fiber', 1, 1]], [CRYSTAL]: [['snow', 1, 2]],
  [REED]: [['reed', 2, 3]], [BERRY]: [['berries', 2, 3], ['stick', 0, 1]], [BUSH]: [['stick', 1, 2]], [PEBBLE]: [['rock', 1, 2], ['flint', 0, 1]], [STICKS]: [['stick', 2, 3]],
  [BONES]: [['bone', 1, 3]], [FUNGUS]: [['fungus', 1, 1]]
};

// ---------------- textures ----------------
function buildTiles3() {
  const pxs = (p, seed) => (px, py, v) => shade(p, hh(px, py, seed + v * 13));
  TEX[GRAVEL] = genTex((px, py, v) => { const r = hh(px >> 1, py >> 1, 211 + v), q = hh(px, py, 212 + v); return r > .72 ? (q > .5 ? '#8a8296' : '#6b6478') : r > .4 ? '#56506a' : q > .8 ? '#2e2a38' : '#4a4458'; });
  TEX[MUD] = genTex((px, py, v) => { const r = hh(px, py >> 1, 221 + v); return (py + v) % 5 === 0 && r > .3 ? '#6f5a66' : r > .8 ? '#5a4046' : r < .2 ? '#2e2026' : '#3b2a2e'; });
  TEX[PEAT] = genTex((px, py, v) => { const f = (px + py * 2 + v) % 5 === 0, r = hh(px, py, 231 + v); return f ? '#5a4a36' : r > .82 ? '#4a3a2c' : r < .2 ? '#1c1418' : '#2a1f22'; });
  const ore = (c1, c2, seed) => (px, py, v) => { for (let k = 0; k < 3; k++) { const cx = 1 + ((hh(k, v, seed) * 6) | 0), cy = 1 + ((hh(k, v, seed + 1) * 6) | 0), d = abs(px - cx) + abs(py - cy); if (d === 0) return c1; if (d === 1 && hh(px, py, seed + k) > .4) return c2; } return shade(PALS.basalt, hh(px, py, seed + 9 + v)); };
  TEX[TIN] = genTex(ore('#f4f8fb', '#9fb0bd', 241)); TEX[COAL] = genTex(ore('#6a6480', '#14101c', 251));
  TEX[SALT] = genTex((px, py, v) => { const d = (px + py + v) % 4, e = (px - py + 8 + v) % 6; return d === 0 ? '#ffffff' : e === 0 ? '#bfa6b0' : hh(px, py, 261 + v) > .5 ? '#efe2e6' : '#d8c4cc'; });
  TEX[CLAY] = genTex((px, py, v) => { const r = hh(px >> 1, py, 271 + v); return (py + (px >> 2) + v) % 4 === 0 ? '#c49c8a' : r > .75 ? '#b48a7a' : r < .15 ? '#8a6458' : '#a0786a'; });
  TEX[GEODE] = genTex((px, py, v) => { const r = hh(px, py, 281 + v); if (r > .9) return '#e0d2ff'; if (r > .74) return '#a58ae0'; return hh(px >> 1, py >> 1, 282 + v) > .5 ? '#5a4a8a' : '#3d2f5c'; });
  TEX[PACKED] = genTex((px, py, v) => { const b = (py + v) % 3; return b === 0 ? PALS.loam[2] : b === 1 ? PALS.loam[0] : hh(px, py, 291 + v) > .6 ? PALS.loam[1] : PALS.loam[3]; });
  TEX[COBBLE] = genTex((px, py, v) => { const gx = (px + (py > 3 ? 2 : 0) + v) % 4, gy = py % 4; if (gx === 0 || gy === 0) return '#b8b2a8'; return gx === 1 && gy === 1 ? '#8a94a4' : hh(px, py, 301 + v) > .6 ? '#6f7a8a' : '#5a6474'; });
  TEX[CUTSTONE] = genTex((px, py) => { if (py % 4 === 3 || px === (py < 4 ? 0 : 4)) return '#5f5a69'; return py % 4 === 0 ? '#c0bac8' : hh(px, py, 311) > .7 ? '#a19baa' : '#8a8496'; });
  TEX[MUDBRICK] = genTex((px, py, v) => { if (py % 4 === 3 || px === ((py >> 2) % 2 ? 1 : 5)) return '#6a4e3a'; return py % 4 === 0 ? '#d0a47a' : hh(px, py, 321 + v) > .7 ? '#a07a58' : '#b88e66'; });
  TEX[LOGWALL] = genTex((px, py, v) => { const r = py % 4; if (r === 3) return '#2e2018'; if (px === (v * 3 + (py >> 2) * 5) % 8 && r === 1) return '#c9a46a'; return r === 0 ? '#a07a50' : r === 1 ? '#7a5a40' : '#5a4030'; });
  TEX[WATTLE] = genTex((px, py, v) => { const s = (px + v) % 3 === 0, w = ((py >> 1) + (px >> 1)) % 2 === 0; return s && w ? '#6b5a40' : hh(px, py, 331 + v) > .8 ? '#6b5f4a' : hh(px, py, 332) > .4 ? '#8a7a62' : '#9a8a70'; });
  TEX[THATCH] = genTex((px, py, v) => { const d = (px + py * 2 + v) % 4; return d === 0 ? '#7a5a20' : d === 1 ? '#e0c060' : d === 2 ? '#c9a44a' : '#a8862e'; });
  TEX[CINDERBRICK] = genTex((px, py, v) => { if (py % 4 === 3 || px === ((py >> 2) % 2 ? 2 : 6)) return (hh(px, py, 341 + v) > .7) ? '#ff7a2a' : '#1c0c10'; return py % 4 === 0 ? '#7a3a32' : '#4a2228'; });
  TEX[WINDOW] = genTex((px, py) => px === 0 || px === 7 || py === 0 || py === 7 ? '#5c8290' : px === 4 || py === 4 ? '#4b6d78' : (px + py) % 5 === 1 ? 'rgba(236,252,250,.75)' : 'rgba(143,208,216,.38)');
  TEX[BEAM] = genTex((px, py, v) => px < 2 || px > 5 ? null : px === 2 ? '#a07a50' : px === 5 ? '#4a3220' : py === (v * 2 + 3) % 8 && px === 3 ? '#4a3220' : '#7a5a40');
  TEX[BEAMH] = genTex((px, py, v) => py > 3 ? (py === 4 && (px === 1 || px === 6) ? '#4a3220' : null) : py === 0 ? '#a07a50' : py === 3 ? '#4a3220' : px === (v * 3 + 2) % 8 && py === 1 ? '#4a3220' : '#7a5a40');
  TEX[DOORC] = genTex((px, py, v) => px === 0 || px === 7 ? '#365058' : (px === 6 && py === 4 && v % 2 === 0) ? '#ffd35a' : px % 3 === 0 ? '#4b6d78' : py === 1 || py === 6 ? '#365058' : '#6f97a4');
  TEX[DOORO] = genTex((px, py) => px === 0 ? '#365058' : px === 1 ? '#6f97a4' : px === 2 && (py === 1 || py === 6) ? '#4b6d78' : null);
  TEX[LADDER] = genTex((px, py) => px === 1 || px === 6 ? (px === 1 ? '#a07a50' : '#5a4030') : (py % 4 === 1 && px > 1 && px < 6) ? '#8a6a48' : (py % 4 === 2 && px > 1 && px < 6) ? '#4a3220' : null);
  TEX[ROPE] = genTex((px, py, v) => px === 3 ? ((py + v) % 2 ? '#c9a44a' : '#e0c060') : px === 4 ? ((py + v) % 2 ? '#8a6a28' : '#a8862e') : null);
  TEX[TRUNK4] = genTex((px, py, v) => { if ((px === 1 || px === 6) && py === (v * 3 + (px === 1 ? 1 : 5)) % 8) return '#c9a0a0'; if (px === 2 && py === (v * 3 + 2) % 8) return '#7a3434'; return px === 3 ? '#7a3434' : px === 4 ? '#5a2424' : px === 5 && py % 3 === 0 ? '#3a1414' : null; });
  TEX[REED] = genTex((px, py, v) => { const s = [1, 3, 4, 6][(px + v) % 4] === px; if (!s && !(px === (2 + v) % 8 && py > 2)) return null; if (py < 2) return py === 0 && px % 3 === v % 3 ? '#8a5a2a' : null; return py === 2 ? '#8a5a2a' : (py + px) % 3 ? '#6fae7a' : '#3a7a52'; });
  const bush = berries => (px, py, v) => { const dx = px - 3.5, dy = py - 4.6, inb = dx * dx / 14 + dy * dy / 9 < 1; if (!inb) return py === 7 && (px === 3 || px === 4) ? '#4a3220' : null; if (berries && hh(px, py, 351 + v) > .78) return hh(px, py, 352) > .5 ? '#ff6a4a' : '#ffb347'; return hh(px, py, 353 + v) > .55 ? '#3a6f46' : py < 4 ? '#5a9a5e' : '#24442e'; };
  TEX[BERRY] = genTex(bush(true)); TEX[BUSH] = genTex(bush(false));
  TEX[PEBBLE] = genTex((px, py, v) => { const pts = [[1 + v % 2, 6], [4, 6 + (v >> 1) % 2], [6 - v % 2, 7]]; for (const [cx, cy] of pts) { const d = abs(px - cx) + abs(py - cy); if (d === 0) return '#8a8296'; if (d === 1 && py >= cy) return '#4a4458'; } return null; });
  TEX[STICKS] = genTex((px, py, v) => { if (py === 7 - ((px + v) >> 2) && px < 7) return '#7a5a40'; if (py === 5 + ((px + v) >> 2) % 3 && px > 1 && px < 7 && (px + v) % 3) return '#5a4030'; return null; });
  TEX[BONES] = genTex((px, py, v) => { if (py === 6 && px > 0 && px < 7) return '#e6dccc'; if ((py === 5 || py === 7) && (px === 1 || px === 6)) return '#c9bca6'; if (py === 7 - abs(px - 4) && v > 1 && py > 4) return '#d8ccb8'; return null; });
  for (const id of [CHEST, BEDROLL, FIRE, WHEEL, QUERN, BLOOMERY, ANVIL, ANVIL2, LOOM, RACK, CAULDRON, MASON, SIEVE, WAYSTONE, CHARGE, POST]) TEX[id] = TEX[DIRT];
  TEX[CREEPER] = genTex((px, py, v) => { const vx = 3 + round(sin((py + v * 3) * .9)); if (px === vx) return '#2c4a34'; if (abs(px - vx) === 1 && (py + v) % 3 === 0) return '#5a9a5e'; if (abs(px - vx) === 2 && (py + v) % 3 === 1) return hh(px, py, 361 + v) > .4 ? '#3a7a52' : null; return null; });
  TEX[GLASSROOT] = genTex((px, py, v) => { const vx = 3 + ((py + v) % 4 < 2 ? 0 : 1); if (px === vx) return '#62a9bc'; if (px === vx + 1 && (py + v) % 4 === 1) return '#c9fff6'; if (px === vx - 1 && (py + v) % 5 === 2) return '#8fd0d8'; return null; });
  TEX[RUSTCHAIN] = genTex((px, py, v) => { const k = (py + v) % 4; if ((px === 3 || px === 4) && (k === 0 || k === 2)) return k === 0 ? '#bd5a36' : '#7a3222'; if ((px === 2 || px === 5) && k === 1) return '#d67645'; return py % 8 === 0 && px === 4 ? '#5f5a69' : null; });
  const wall = (src, a) => src.map(s => { const [c, x] = mk(8, 8); x.drawImage(s, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = `rgba(9,6,24,${a})`; x.fillRect(0, 0, 8, 8); return c; });
  WTEX[W_WATTLE] = wall(TEX[WATTLE], .5); WTEX[W_MUDB] = wall(TEX[MUDBRICK], .5); WTEX[W_COBBLE] = wall(TEX[COBBLE], .52); WTEX[W_CUT] = wall(TEX[CUTSTONE], .5); WTEX[W_LOG] = wall(TEX[LOGWALL], .5);
  while (WSKY.length < 15) WSKY.push(0);
  SPR.top[3] = []; for (let v = 0; v < 3; v++) SPR.top[3][v] = genThornTop(v);
  buildStationSprites();
}
// thornwood crowns: black-red bramble with ember berries
function genThornTop(v) {
  const w = 46, h = 32; const [c, x] = mk(w, h); const R = mulberry32(v * 733 + 91), pods = [];
  const px = (X, Y, col) => { x.fillStyle = col; x.fillRect(round(X), round(Y), 1, 1); };
  for (let i = 0; i < 7 + v; i++) {
    const a = -PI / 2 + (R() - .5) * 2.6, len = 8 + R() * 13; let X = 23, Y = 31;
    for (let k = 0; k < len; k++) { X += cos(a + sin(k * .5 + i) * .3); Y += sin(a + sin(k * .5 + i) * .3) * .8; px(X, Y, k < 4 ? '#3a1414' : '#5a2424'); if (k % 3 === 2) px(X + (R() < .5 ? -1 : 1), Y - 1, '#c9a0a0'); }
    for (let k = 0; k < 9; k++) px(X + (R() - .5) * 6, Y + (R() - .5) * 5, R() > .3 ? '#2c4a34' : '#4a7a50');
    if (R() > .35) { x.fillStyle = '#ff6a4a'; x.fillRect(round(X), round(Y), 2, 2); px(X, Y, '#ffd35a'); pods.push([round(X), round(Y), 2]); }
  }
  return { cv: c, pods };
}
// ---------------- station sprites, drawn over their tile like the bench and kiln ----------------
const STN_SPR = {};
function buildStationSprites() {
  const S = (id, rows, pal, ox, oy) => { STN_SPR[id] = { img: spr(rows, pal), ox, oy }; };
  const wood = { d: '#2a1c18', b: '#7a5a40', a: '#9a7a52', c: '#5a4030', g: '#8f98a8', y: '#ffd35a' };
  S(CHEST, ['.dddddddd.', 'dbaaaaaabd', 'dbbbbbbbbd', 'dggggyyggd', 'dbbbbybbbd', 'dbbbbbbbbd', 'dccccccccd', '.dddddddd.'], wood, -1, 0);
  S(BEDROLL, ['..aaaaaaaa..', '.abbbbbbbbc.', 'abbebbbbebbc', '.cccccccccc.'], { a: '#d86a6a', b: '#a83a3e', c: '#6a2028', e: '#e8d8b0' }, -2, 4);
  S(FIRE, ['..........', '..........', '..d....d..', '.eddccdde.', 'eeeddddeee', 'feefeefeef'], { d: '#5a4030', c: '#ff8a3d', e: '#8d8794', f: '#5f5a69' }, -1, 2);
  S(WHEEL, ['...aaaaaa...', '..bbbbbbbb..', '.....cc.....', '.....cc.....', '..dddddddd..', '.dd......dd.', 'dd........dd'], { a: '#c49c8a', b: '#7a5a40', c: '#5a4030', d: '#4a3220' }, -2, 1);
  S(QUERN, ['.......hh.', '..aaaaah..', '.abbbbbbc.', '.cccccccc.', '.abbbbbbc.', '.dddddddd.', 'dddddddddd'], { a: '#b8b2c0', b: '#8d8794', c: '#5f5a69', d: '#4a4458', h: '#7a5a40' }, -1, 1);
  S(BLOOMERY, ['....aaaa....', '....abba....', '...abbbbc...', '...abbbbc...', '..abbbbbbc..', '..abbbbbbc..', '..abbbbbbc..', '.abbbbbbbbc.', '.abbbbbbbbc.', '.abbffffbbc.', 'abbbffffbbbc', 'abbbffffbbbc', 'dddddddddddd'], { a: '#d0a47a', b: '#a07a58', c: '#6a4e3a', d: '#3a2a20', f: '#2a1410' }, -2, -5);
  S(ANVIL, ['aaaaaaaaa.', 'bbbbbbbbbb', '.cbbbbbbc.', '...bbbb...', '..bbbbbb..', '.dddddddd.'], { a: '#b8b2c0', b: '#8d8794', c: '#5f5a69', d: '#4a4458' }, -1, 2);
  S(ANVIL2, ['aaaaaaaaaaa.', 'bbbbbbbbbbbb', '.cbbbbbbbbc.', '....bbbb....', '...bbbbbb...', '..dddddddd..'], { a: '#cfd6e0', b: '#6f7888', c: '#3f4656', d: '#2a2e3a' }, -2, 2);
  S(LOOM, ['a..........a', 'aaaaaaaaaaaa', 'a.e.e.e.e..a', 'a.e.e.e.e..a', 'a.ffffffff.a', 'a.e.e.e.e..a', 'a.e.e.e.e..a', 'aaaaaaaaaaaa', 'a..........a', 'a..........a', 'aa........aa'], { a: '#7a5a40', e: '#e8d8b0', f: '#c94a4e' }, -2, -3);
  S(RACK, ['a..........a', 'aaaaaaaaaaaa', 'a..........a', 'a..........a', 'a..........a', 'a..........a', 'a..........a', 'aa........aa'], { a: '#7a5a40' }, -2, 0);
  S(CAULDRON, ['.aaaaaaaa.', 'abbbbbbbbc', 'abbbbbbbbc', '.bbbbbbbc.', '..cccccc..', '.d......d.', 'd........d'], { a: '#8d8794', b: '#5f5a69', c: '#3f3a4c', d: '#2a2436' }, -1, 1);
  S(MASON, ['......h.....', '..aaaaaaaa..', '.abbbbbbbbc.', 'dddddddddddd', '.d........d.', '.d........d.', '.dd......dd.'], { a: '#c0bac8', b: '#8a8496', c: '#5f5a69', d: '#5a4030', h: '#cfd6e0' }, -2, 1);
  S(SIEVE, ['a........a', 'aeaeaeaeaa', 'aaaaaaaaaa', '.d......d.', '.d......d.', 'dd......dd'], { a: '#7a5a40', e: '#c9a44a', d: '#5a4030' }, -1, 2);
  S(WAYSTONE, ['..aaaa..', '.abbbbc.', '.abbbbc.', '.abebbc.', '.abeebc.', '.abbebc.', '.abebbc.', '.abbbbc.', '.abbbbc.', 'abbbbbbc', 'abbbbbbc', 'dddddddd'], { a: '#c0bac8', b: '#8a84a0', c: '#5f5a69', d: '#3f3a4c', e: '#b49cff' }, 0, -4);
  S(CHARGE, ['...e..', '..e...', '.aa...', 'abba..', 'abbbc.', 'abbbc.', '.ccc..'], { a: '#c49c8a', b: '#a0786a', c: '#6a4e3a', e: '#ffd35a' }, 1, 1);
  S(POST, ['..aaaa..', '.abbbbc.', '.abeebc.', '..bbbb..', 'aaabbaaa', '...bb...', '..cbbc..', '...bb...', '...bb...', '...bb...', '..dddd..'], { a: '#c9a46a', b: '#8a6a48', c: '#c94a4e', d: '#4a3220', e: '#2a1c18' }, 0, -3);
}
