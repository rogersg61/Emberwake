// ============================================================
//  Pixel art. Everything here is drawn by this file: no images.
//  Art direction: a world lit by a broken sun. Coral emberfelt on
//  plum loam, cream clay strata, blue-black basalt columns,
//  lantern-stalks instead of trees, ink outlines with a rim light.
// ============================================================
function spr(rows, pal) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length)); const [c, x] = mk(w, h);
  for (let Y = 0; Y < h; Y++) for (let X = 0; X < rows[Y].length; X++) { const col = pal[rows[Y][X]]; if (col) { x.fillStyle = col; x.fillRect(X, Y, 1, 1); } }
  return c;
}
function outlined(src, col = '#120d1f') {
  const w = src.width + 2, h = src.height + 2; const [c, x] = mk(w, h); const [tc, tx] = mk(src.width, src.height);
  tx.drawImage(src, 0, 0); tx.globalCompositeOperation = 'source-in'; tx.fillStyle = col; tx.fillRect(0, 0, w, h);
  x.drawImage(tc, 0, 1); x.drawImage(tc, 2, 1); x.drawImage(tc, 1, 0); x.drawImage(tc, 1, 2); x.drawImage(src, 1, 1); return c;
}
const INK = '#120d1f';
// ---------------- tiles ----------------
// (ids keep short internal names; what the player sees is in `name`)
const AIR = 0, DIRT = 1, GRASS = 2, STONE = 3, SAND = 4, SNOW = 5, SANDSTONE = 6, ASH = 7, PLANK = 8, BRICK = 9, COPPER = 10, IRON = 11, EMBER = 12,
  BEDROCK = 13, PLATFORM = 14, TRUNK = 15, TORCH = 16, BENCH = 17, FURNACE = 18, TALLGRASS = 19, FLOWER = 20, GLOWCAP = 21, POT = 22, DEADBUSH = 23, SHRINE = 24,
  VINE = 25, CRYSTAL = 26, CAMP = 27, TRUNK2 = 28, TRUNK3 = 29, GATE = 30, SHRINE2 = 31;
const W_DIRT = 1, W_STONE = 2, W_SAND = 3, W_BRICK = 4, W_ASH = 5, W_RUIN = 6, W_COL = 7;
const PALS = {
  loam: ['#4c3653', '#5b4364', '#6b5276', '#3b2a42'], basalt: ['#2b4150', '#365263', '#456878', '#1f3240'],
  clay: ['#d6c8ae', '#e3d8c2', '#efe6d4', '#bba888'], rust: ['#a3482e', '#bd5a36', '#d67645', '#7a3222'],
  glass: ['#8fd0d8', '#b4e6e8', '#dcf7f5', '#62a9bc'], ash: ['#8d8794', '#a19baa', '#b8b2c0', '#726c7c'],
  plank: ['#4b6d78', '#5c8290', '#6f97a4', '#365058'], brick: ['#6d6880', '#7f7a93', '#938ea8', '#514c62'],
  void: ['#1a1226', '#231833', '#2d2040', '#110b1a'], stalk: ['#1f3d44', '#2c575e', '#3a6f76', '#142a30']
};
const shade = (p, r) => r < .14 ? p[3] : r < .62 ? p[0] : r < .9 ? p[1] : p[2];
const TP = [];
function defT(id, o) { TP[id] = Object.assign({ name: '', solid: false, full: false, hard: 0, drop: null, light: null, dyn: false, decor: false, plat: false, ground: false, hi: '#fff', dust: '#888', cap: 0, stalk: false, hang: false }, o); }
defT(AIR, {});
defT(DIRT, { name: 'Cinderloam', solid: true, full: true, hard: 14, drop: 'dirt', hi: '#553d5e', dust: '#473350' });
defT(GRASS, { name: 'Emberfelt', solid: true, full: true, hard: 14, drop: 'dirt', hi: '#553d5e', dust: '#f06a55', cap: 1, light: [.15, .055, .045] });
defT(STONE, { name: 'Nightbasalt', solid: true, full: true, hard: 32, drop: 'stone', hi: '#375666', dust: '#2b4250' });
defT(SAND, { name: 'Rustscale', solid: true, full: true, hard: 12, drop: 'sand', hi: '#d67645', dust: '#bd5a36', cap: 3 });
defT(SNOW, { name: 'Stillglass', solid: true, full: true, hard: 16, drop: 'snow', hi: '#dcf7f5', dust: '#b4e6e8', cap: 2 });
defT(SANDSTONE, { name: 'Paleclay', solid: true, full: true, hard: 24, drop: 'sandstone', hi: '#efe6d4', dust: '#d6c8ae' });
defT(ASH, { name: 'Ash', solid: true, full: true, hard: 13, drop: 'ash', hi: '#b8b2c0', dust: '#a19baa', cap: 4 });
defT(PLANK, { name: 'Stalkwood Planks', solid: true, full: true, hard: 14, drop: 'plank', hi: '#6f97a4', dust: '#5c8290' });
defT(BRICK, { name: 'Forge Brick', solid: true, full: true, hard: 40, drop: 'brick', hi: '#938ea8', dust: '#7f7a93' });
defT(COPPER, { name: 'Sunmetal Ore', solid: true, full: true, hard: 44, drop: 'copper_ore', hi: '#375666', dust: '#ffd35a' });
defT(IRON, { name: 'Hollow Iron Ore', solid: true, full: true, hard: 56, drop: 'iron_ore', hi: '#375666', dust: '#cfc3ee' });
defT(EMBER, { name: 'Emberstone', solid: true, full: true, hard: 70, drop: 'shard', hi: '#375666', dust: '#ff8a3d', light: [.55, .22, .06] });
defT(BEDROCK, { name: 'Voidstone', solid: true, full: true, hard: Infinity, hi: '#2d2040', dust: '#231833' });
defT(PLATFORM, { name: 'Rope Bridge', plat: true, hard: 8, drop: 'platform', dust: '#5c8290' });
defT(TRUNK, { name: 'Lantern Stalk', hard: 22, drop: 'wood', dust: '#2c575e', ground: true, stalk: true });
defT(TRUNK2, { name: 'Frost Stalk', hard: 22, drop: 'wood', dust: '#b4e6e8', ground: true, stalk: true });
defT(TRUNK3, { name: 'Rust Stalk', hard: 22, drop: 'wood', dust: '#a3482e', ground: true, stalk: true });
defT(TORCH, { name: 'Pod Lantern', dyn: true, hard: 1, drop: 'torch', light: [1, .8, .46], dust: '#ffd35a' });
defT(BENCH, { name: 'Workbench', dyn: true, hard: 12, drop: 'bench', ground: true, dust: '#5c8290' });
defT(FURNACE, { name: 'Kiln', dyn: true, hard: 20, drop: 'furnace', ground: true, light: [.75, .38, .12], dust: '#2b4250' });
defT(TALLGRASS, { decor: true, hard: 1, ground: true, dust: '#f06a55' });
defT(FLOWER, { decor: true, hard: 1, ground: true, dust: '#8ff5e6' });
defT(GLOWCAP, { name: 'Dewbulb', decor: true, hard: 1, ground: true, drop: 'glowcap', light: [.1, .46, .52], dust: '#6ff0e0' });
defT(POT, { name: 'Urn', decor: true, hard: 1, ground: true, dust: '#d6c8ae' });
defT(DEADBUSH, { decor: true, hard: 1, ground: true, dust: '#6a4a9a' });
defT(VINE, { decor: true, hard: 1, hang: true, dust: '#2c575e' });
defT(CRYSTAL, { name: 'Glass Bloom', decor: true, hard: 1, ground: true, light: [.1, .32, .38], dust: '#dcf7f5' });
defT(SHRINE, { name: 'Shrine', dyn: true, hard: Infinity });
defT(SHRINE2, { name: 'Mirror', dyn: true, hard: Infinity });
defT(CAMP, { name: 'Campfire', dyn: true, hard: Infinity, light: [1, .62, .28] });
defT(GATE, { name: 'Furnace Gate', dyn: true, hard: Infinity, light: [.5, .16, .08] });

const TEX = [], WTEX = [];
function genTex(fn) { const out = []; for (let v = 0; v < 4; v++) { const [c, x] = mk(8, 8); for (let py = 0; py < 8; py++) for (let px = 0; px < 8; px++) { const col = fn(px, py, v); if (col) { x.fillStyle = col; x.fillRect(px, py, 1, 1); } } out.push(c); } return out; }
const tnoise = (p, seed, clump) => (px, py, v) => shade(p, clump ? hh(px >> 1, py >> 1, seed + v * 7) * .55 + hh(px, py, seed + v * 13) * .45 : hh(px, py, seed + v * 13));
const mask8 = (rows, fn) => (px, py, v) => { const m = rows[py][(px + v) % 8]; return m === '#' ? fn(px, py, v) : null; };
function buildTiles() {
  const L = PALS.loam, B = PALS.basalt, K = PALS.clay, R = PALS.rust, GL = PALS.glass, PK = PALS.plank, BR = PALS.brick;
  const loam = (px, py, v) => { const r = hh(px, py, 11 + v * 13), r2 = hh(px >> 1, py >> 1, 17 + v * 7); return r > .975 ? '#bba888' : r2 > .82 ? L[1] : r < .13 ? L[3] : L[0]; };
  const basalt = (px, py, v) => { const o = (v * 3) % 4, c = (px + o) % 4, s = (py + ((hh((px + o) >> 2, v, 31) * 8) | 0)) % 8; return c === 0 ? B[3] : s === 0 ? B[2] : s === 7 ? B[3] : c === 1 ? B[1] : B[0]; };
  const ore = (c1, c2, seed) => (px, py, v) => { for (let k = 0; k < 2; k++) { const cx = 1 + ((hh(k, v, seed) * 6) | 0), cy = 1 + ((hh(k, v, seed + 1) * 6) | 0), d = abs(px - cx) + abs(py - cy); if (d === 0) return '#ffffff'; if (d === 1) return c1; if (d === 2 && hh(px, py, seed) > .45) return c2; } return basalt(px, py, v); };
  TEX[DIRT] = genTex(loam); TEX[GRASS] = TEX[DIRT]; TEX[STONE] = genTex(basalt);
  const fossil = ['........', '..###...', '.#...#..', '.#.#.#..', '.#..##..', '..#.....', '...###..', '........'];
  TEX[SANDSTONE] = genTex((px, py, v) => { if (v === 3 && fossil[py][px] === '#') return K[3]; const k = (py + v * 2 + (hh(px >> 2, v, 71) > .5 ? 1 : 0)) % 8; return k === 0 ? K[3] : k < 3 ? K[0] : k === 3 ? K[1] : k < 6 ? K[2] : K[1]; });
  TEX[SAND] = genTex((px, py, v) => { const bx = (px + v * 2) % 8, by = (py + v * 3) % 8; if (by === 0 || bx === 0) return R[3]; if (by === 1 && (bx === 1 || bx === 7)) return '#f0b070'; return hh(px, py, 51 + v) > .82 ? R[2] : hh(px >> 1, py >> 1, 53 + v) > .6 ? R[1] : R[0]; });
  TEX[SNOW] = genTex((px, py, v) => { const d = (px + py + v * 3) % 8, e = (px - py + 16 + v) % 8; return d === 0 ? GL[2] : e === 0 ? GL[3] : (((px + py) >> 2) + v) % 2 ? GL[0] : GL[1]; });
  TEX[ASH] = genTex(tnoise(PALS.ash, 81, true));
  TEX[PLANK] = genTex((px, py, v) => py % 4 === 3 ? PK[3] : px === (py < 4 ? 2 + v : 6 - v) ? PK[3] : py % 4 === 0 ? PK[2] : hh(px >> 1, py, 91 + v) > .7 ? PK[1] : PK[0]);
  TEX[BRICK] = genTex((px, py, v) => { if (py % 4 === 3 || px === ((py >> 2) % 2 ? 2 : 6)) return BR[3]; if (v === 2 && ((px === 4 && py < 3) || (px === 3 && py === 1) || (px === 5 && py === 1))) return '#c96a4a'; return py % 4 === 0 ? BR[2] : hh(px, py, 101 + v) > .75 ? BR[1] : BR[0]; });
  TEX[COPPER] = genTex(ore('#ffd35a', '#c98a2b', 111)); TEX[IRON] = genTex(ore('#cfc3ee', '#8f7fc0', 121)); TEX[EMBER] = genTex(ore('#ff9a3d', '#e2542b', 131));
  TEX[BEDROCK] = genTex((px, py, v) => hh(px, py, 141 + v) > .965 ? '#c04ad0' : tnoise(PALS.void, 141, true)(px, py, v));
  TEX[PLATFORM] = genTex((px, py, v) => (px === 0 || px === 7) && py < 4 ? '#e3d8c2' : py === 0 ? PK[2] : py === 1 ? PK[0] : py === 2 ? PK[3] : null);
  const stalk = P => (px, py, v) => { if (py === (1 + v * 2) % 8 && px >= 2 && px <= 5) return px === 2 || px === 5 ? P[3] : P[2]; return px === 3 ? P[1] : px === 4 ? P[0] : null; };
  TEX[TRUNK] = genTex(stalk(PALS.stalk)); TEX[TRUNK2] = genTex(stalk(['#6fb0c0', '#b4e6e8', '#dcf7f5', '#3f7f92'])); TEX[TRUNK3] = genTex(stalk(['#7a3222', '#a3482e', '#d67645', '#4f2018']));
  TEX[TALLGRASS] = genTex((px, py, v) => { const hgt = hh(px, v, 161) > .35 ? 1 + ((hh(px, v, 162) * 4) | 0) : 0; return py >= 8 - hgt ? (py === 8 - hgt ? '#ffc2a0' : '#f06a55') : null; });
  TEX[FLOWER] = genTex((px, py, v) => { const sx = 2 + v; if (px === sx && py >= 3) return '#2c575e'; if (py === 2 && (px === sx || px === sx + 1)) return '#2c575e'; if (px === sx + 1 && (py === 3 || py === 4)) return py === 3 ? '#c9fff6' : '#4fd8c8'; if (v > 1 && px === sx - 1 && (py === 5 || py === 6)) return py === 5 ? '#c9fff6' : '#4fd8c8'; return null; });
  TEX[GLOWCAP] = genTex(mask8(['........', '...#....', '..###...', '..###...', '.#####..', '..###...', '...#....', '...#....'], (px, py) => py >= 6 ? '#2c575e' : py === 1 || (py < 4 && hh(px, py, 3) > .6) ? '#ffffff' : py === 5 ? '#2b9c94' : '#6ff0e0'));
  TEX[POT] = genTex((px, py) => { if (py === 1 && px >= 2 && px <= 5) return '#efe6d4'; if (py === 2 && px >= 3 && px <= 4) return '#bba888'; if (py >= 3 && py <= 6 && px >= 1 && px <= 6) return (py === 4 && (px === 3 || px === 4)) || (py === 5 && px === 3) ? '#f06a55' : px === 1 ? '#efe6d4' : px === 6 ? '#bba888' : '#d6c8ae'; if (py === 7 && px >= 2 && px <= 5) return '#bba888'; return null; });
  TEX[DEADBUSH] = genTex(mask8(['...#....', '...#....', '..##....', '..##..#.', '.###..#.', '.###.##.', '.######.', '.######.'], (px, py) => (px + py) % 3 === 0 ? '#6a4a9a' : '#231833'));
  TEX[VINE] = genTex((px, py, v) => { const sx = 3 + ((py >> 1) + v) % 2; return px === sx ? '#2c575e' : px === sx + 1 && py % 3 === v % 3 ? '#3a6f76' : px === sx - 1 && py % 4 === (v + 2) % 4 ? '#8ff5e6' : null; });
  TEX[CRYSTAL] = genTex(mask8(['........', '....#...', '....#...', '.#..##..', '.#.###..', '.##.###.', '.######.', '.######.'], (px, py, v) => py === 7 ? '#62a9bc' : hh(px, py, v) > .55 ? '#dcf7f5' : '#8fd0d8'));
  for (const id of [TORCH, BENCH, FURNACE, SHRINE, SHRINE2, CAMP, GATE, AIR]) TEX[id] = TEX[DIRT];
  const wall = (src, a = .56) => src.map(s => { const [c, x] = mk(8, 8); x.drawImage(s, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = `rgba(9,6,24,${a})`; x.fillRect(0, 0, 8, 8); return c; });
  WTEX[W_DIRT] = wall(TEX[DIRT], .5); WTEX[W_STONE] = wall(TEX[STONE], .55); WTEX[W_SAND] = wall(TEX[SANDSTONE], .66); WTEX[W_BRICK] = wall(TEX[BRICK], .52); WTEX[W_ASH] = wall(TEX[ASH], .6); WTEX[W_RUIN] = wall(TEX[BRICK], .42); WTEX[W_COL] = wall(TEX[STONE], .3);
}

// ---------------- fighters' skins ----------------
const SKINS = [['#2f4858', '#3f6076', '#22343f', '#6c93a8', '#e2542b', '#ff8a3d'], ['#5a2a3a', '#7a3a4c', '#3d1c28', '#a85a6c', '#ffd35a', '#fff1a8'], ['#3a2f5c', '#52447e', '#281f42', '#8a7cc0', '#4fd8c8', '#c9fff6'],
['#3d4a2c', '#56683e', '#2a331e', '#8ea86a', '#f4efe6', '#b9bdd0'], ['#c9c2d6', '#e6e0f0', '#8f88a0', '#ffffff', '#6fb9c9', '#dcf7f5'], ['#6b4a2f', '#8a6a48', '#4a3220', '#c9a44a', '#ff8a3d', '#ffd35a']];
const SK = [];
function mkSkin(i) {
  const s = SKINS[i];
  return {
    head: spr(['.LLHHH.', 'LLHHHHH', 'HHhhhhH', 'HHhssys', 'HHhssss', '.HHhss.', '..HHH..'], { L: s[3], H: s[1], h: s[2], s: i === 4 ? '#d8d4e6' : '#e9b999', y: i === 4 ? '#8ff5e6' : '#ffd35a' }),
    torso: spr(['CCCCCC', 'CCCCCc', 'CCeCCc', 'CCCCCc', 'bbbbbb', 'dCCCCc', 'dCCCCd', '.dCCd.'], { C: s[0], c: s[1], d: s[2], e: i === 4 ? '#8ff5e6' : '#ff9a3d', b: '#7a5a3a' }),
    leg: '#2b3046', legB: '#1d2032', boot: '#131119', arm: s[1], armB: s[2], hand: '#e9b999', handB: '#b98c70', scarf: [s[4], s[5]], hx: -3, hy: -7
  };
}

// ---------------- item icons, weapons, objects ----------------
const SPR = {};
function buildSprites() {
  for (let i = 0; i < SKINS.length; i++) SK[i] = mkSkin(i);
  SK[5].head = spr(['..ggggg..', '.ggggggg.', 'ggGGGGGgg', '..HHhhhH.', '..HhssyS.', '..Hhssss.', '...Hwww..', '...wwww..'], { g: '#4a3220', G: '#c9a44a', H: '#8a6a48', h: '#4a3220', s: '#d9a682', S: '#b98c70', y: '#ffd35a', w: '#f4efe6' }); SK[5].hx = -4; SK[5].hy = -8; SK[5].scarf = null;
  const rust = { w: '#cfc6ba', b: '#a89c8e', B: '#7d7066', g: '#9a7b4a', h: '#5a3d26', p: '#b08a4a' }, steel = { w: '#e8edf2', b: '#aab3c2', B: '#7f8898', g: '#c9a44a', h: '#365058', p: '#e0c060' };
  const fire = { w: '#fff1a8', b: '#ffb347', B: '#e2542b', g: '#ffd35a', h: '#5a3d26', p: '#ffd35a' }, glassp = { w: '#ffffff', b: '#c9fff6', B: '#6fb9c9', g: '#dcf7f5', h: '#8f88a0', p: '#8ff5e6', s: '#b4e6e8', r: '#ffffff' };
  const blade = ['....g..............', '....gbbbbbbbbbbbbb.', 'phhhgwwwwwwwwwwwwwb', '....gBBBBBBBBBBBBB.', '....g..............'];
  SPR.w_sword = spr(blade, rust); SPR.w_kblade = spr(blade, fire);
  SPR.w_husk = spr(['...g.........', '...gBBBBBBBB.', 'hhhgbbbbbbbbB', '...gBBBBBBB..', '...g.........'], { g: '#5a4a44', h: '#3a2c26', b: '#8a7468', B: '#5f4c44' });
  const sp = { s: '#5c8290', r: '#e2542b', w: '#e8edf2', b: '#aab3c2', B: '#7f8898' };
  const spearRows = ['.'.repeat(25) + 'bb', '.'.repeat(24) + 'bwwbb', 's'.repeat(23) + 'rwwwwwwb', '.'.repeat(24) + 'bBBbb', '.'.repeat(25) + 'bb'];
  SPR.w_spear = spr(spearRows, sp); SPR.w_vpike = spr(spearRows, glassp);
  const dag = ['..g........', '..gbbbbbbb.', 'hhgwwwwwwwb', '..gBBBBBB..', '..g........'];
  SPR.w_fangs = spr(dag, steel); SPR.w_vfangs = spr(dag, glassp);
  SPR.w_maul = spr(['..............ssssss', '..............sSSSSs', '..............sSsSSs', 'hhhhhhhhhhhhhhsSSSSs', 'pHHHHHHHHHHHHHsSSsSs', '..............sSSSSs', '..............sSsSSs', '..............sSSSSs', '..............ssssss'], { h: '#5c8290', H: '#365058', p: '#c9a44a', s: '#3f3a4c', S: '#726d7d' });
  SPR.w_bow = (() => { const h = 21, w = 9; const [c, x] = mk(w, h); for (let y = 0; y < h; y++) { const t = y / (h - 1), lx = round(1 + 6 * sin(PI * t)), mid = abs(y - 10) <= 1; x.fillStyle = mid ? '#e2542b' : '#ffd35a'; x.fillRect(lx, y, 1, 1); if (y > 1 && y < h - 2) { x.fillStyle = mid ? '#a3482e' : '#c98a2b'; x.fillRect(lx + 1, y, 1, 1); } } x.fillStyle = '#fff1a8'; x.fillRect(1, 0, 1, 1); x.fillRect(1, h - 1, 1, 1); return c; })();
  SPR.arrow = spr(['f......w.', 'fsssssswW', 'f......w.'], { f: '#e2542b', s: '#f4efe6', w: '#ffd35a', W: '#fff1a8' });
  SPR.knife = spr(['.bbbb.', 'hwwwwb', '.BBB..'], steel);
  SPR.w_staff = spr(['...............kkk.', '...............kyk.', 'sssssssssssssssyYy.', '...............kyk.', '...............kkk.'], { s: '#6b4a2f', k: '#4a3220', y: '#ffd35a', Y: '#fff1a8' });
  const pk = { h: '#5c8290', M: '#8f98a8', m: '#c5ccd8' }, pk2 = { h: '#365058', M: '#8f7fc0', m: '#cfc3ee' };
  const pick = ['..........m.', '.........mM.', '.........mM.', '.........MM.', 'hhhhhhhhhMMm', '.........MM.', '.........mM.', '.........mM.', '..........m.'];
  SPR.w_pick = spr(pick, pk); SPR.w_pick2 = spr(pick, pk2);
  const I = (rows, pal) => outlined(spr(rows, pal));
  const swI = ['.......ww', '......wbw', '.....wbw.', '....wbw..', 'g..wbw...', '.gwbw....', '..gg.....', '.h.g.....', 'h........'];
  SPR.i_sword = I(swI, rust); SPR.i_kblade = I(swI, fire);
  SPR.i_spear = I(['.......ww', '......wbw', '.....rww.', '....s....', '...s.....', '..s......', '.s.......', 's........'], sp);
  SPR.i_fangs = I(['w.......w', 'bw.....wb', '.bw...wb.', '..bw.wb..', '...gwg...', '...wgw...', '..h...h..', '.h.....h.'], steel);
  SPR.i_maul = I(['....sssss', '....sSSSs', '....sSSSs', '...hsssss', '..h......', '.h.......', 'h........'], { h: '#5c8290', s: '#3f3a4c', S: '#726d7d' });
  SPR.i_bow = I(['..WWW....', '.W..sW...', 'W....sW..', 'W.....sW.', 'W..aaaasw', 'W.....sW.', 'W....sW..', '.W..sW...', '..WWW....'], { W: '#5c8290', s: '#f4efe6', a: '#ffd35a', w: '#fff1a8' });
  const pkI = ['..mmmm...', '.m....mm.', '......hMm', '.....h..M', '....h...m', '...h.....', '..h......', '.h.......', 'h........'];
  SPR.i_pick = I(pkI, pk); SPR.i_pick2 = I(pkI, pk2);
  SPR.i_torch = I(['.kkk.', '.k.k.', 'kyYyk', 'kYWYk', 'kyYyk', '.kkk.'], { k: '#365058', y: '#ffb347', Y: '#ffd35a', W: '#fff1a8' });
  SPR.i_wood = I(['.bbbbbbb..', 'bdbbbbbbLl', 'bdbbdbbblL', 'bdbbbbbbLl', '.bbbbbbb..'], { b: '#2c575e', d: '#142a30', L: '#b4e6e8', l: '#6f97a4' });
  const bar = ['..hhhhhh..', '.hmmmmmmd.', 'hmmmmmmmdd', 'dddddddddd'];
  SPR.i_copper_bar = I(bar, { h: '#fff1a8', m: '#ffd35a', d: '#c98a2b' }); SPR.i_iron_bar = I(bar, { h: '#f0eaff', m: '#cfc3ee', d: '#8f7fc0' });
  SPR.i_cinder = I(['...o...', '..oyo..', '.koyok.', 'kkkokkk', 'kKkkkKk', '.kkkkk.'], { o: '#ff7a2a', y: '#ffd35a', k: '#3c3842', K: '#5a5562' });
  SPR.i_shard = I(['...y...', '..yYo..', '..yYo..', '.yYYoo.', '.yYooo.', '..yoo..', '...o...'], { y: '#ffd35a', Y: '#fff1a8', o: '#ff7a2a' });
  SPR.i_glowcap = I(['...W...', '..cWc..', '..ccc..', '.ccccc.', '.dcccd.', '..ddd..'], { c: '#6ff0e0', W: '#ffffff', d: '#2b9c94' });
  SPR.i_salve = I(['..kk..', '..gg..', '.gCCg.', 'gCcCCg', 'gCCCCg', 'gCCCCg', '.gggg.'], { k: '#5c8290', g: '#d6c8ae', C: '#4fd8c8', c: '#c9fff6' });
  const emb = ['...y...', '..yYy..', '.yYWYo.', '.oYWYo.', 'ooYYYoo', '.ooYoo.', '..ooo..'];
  SPR.i_wember = I(emb, { y: '#ffd35a', Y: '#fff1a8', W: '#ffffff', o: '#ff7a2a' }); SPR.i_wember2 = I(emb, { y: '#8ff5e6', Y: '#c9fff6', W: '#ffffff', o: '#4fd8c8' });
  SPR.bench = spr(['LLLLLLLLLLLLLLLL', 'bbbbbbbbbbbbbbbb', 'dddddddddddddddd', '.bd..........bd.', '.bd..........bd.', '.bdddddddddddbd.', '.bd..........bd.', '.bd..........bd.'], { L: '#6f97a4', b: '#4b6d78', d: '#365058' });
  SPR.furnace = spr(['....ssssss....', '..ssSSSSSSss..', '.sSSssssssSSs.', 'sSSsddddddsSSs', 'sSsdyoyyoydsSs', 'sSsdoyooyodsSs', 'sSsddddddddsSs', 'sSSssssssssSSs', 'sSSSSSSSSSSSSs', 'sSsSSsSSsSSsSs', 'ssssssssssssss'], { s: '#172630', S: '#2b4250', d: '#120d1f', y: '#ffd35a', o: '#ff7a2a' });
  SPR.i_bench = outlined(SPR.bench); SPR.i_furnace = outlined(SPR.furnace);
  SPR.torch = spr(['.kk.', 'kyyk', 'kYYk', 'kyyk', '.kk.'], { k: '#365058', y: '#ffb347', Y: '#fff1a8' });
  SPR.shrine = spr([
    '....................', '..SSSS........SSSS..', '.SsssSS......SSsssS.', '..Sss..........ssS..', '..Sss..........ssS..', '..SsS..........SsS..', '..Sss..........ssS..', '..Sss..bbbbbb..ssS..',
    '..SsS.bBBBBBBb.SsS..', '..Sss..bBBBBb..ssS..', '..Sss...bBBb...ssS..', '..SsS....ss....SsS..', '..Sss....ss....ssS..', '..Sss...Ssss...ssS..', '.SSssS.SSssSS.SssSS.', 'SSSSSSSSSSSSSSSSSSSS'], { S: '#938ea8', s: '#514c62', b: '#3c3842', B: '#221c2a' });
  SPR.shrine2 = spr([
    '......gggggggg......', '....ggGGGGGGGGgg....', '...gGGmmmmmmmmGGg...', '..gGGmmMMmmmmmmGGg..', '..gGmmMMmmmmmmmmGg..', '..gGmmMmmmmmmmmmGg..', '..gGmmmmmmmmmMmmGg..', '..gGmmmmmmmmMMmmGg..',
    '..gGmmmmmmmMMmmmGg..', '..gGmmmmmmmmmmmmGg..', '..gGGmmmmmmmmmmGGg..', '...gGGmmmmmmmmGGg...', '....ggGGGGGGGGgg....', '......gggSSggg......', '.....SSSSssSSSS.....', 'SSSSSSSSSSSSSSSSSSSS'], { g: '#8f88a0', G: '#e6e0f0', m: '#6fb9c9', M: '#dcf7f5', S: '#938ea8', s: '#514c62' });
  SPR.gate = spr([
    '...SSSSSSSSSSSSSSSSSS...', '..SSssssssssssssssssSS..', '.SSsDDDDDDDDDDDDDDDDsSS.', '.SsDDddddddDDddddddDDsS.', '.SsDddddddddddddddddDsS.', '.SsDddooddddddddooddDsS.', '.SsDddooddddddddooddDsS.', '.SsDddddddddddddddddDsS.',
    '.SsDddddddoooodddddDDsS.', '.SsDdddddoyyyyoddddDDsS.', '.SsDdddddoyYYyoddddDDsS.', '.SsDdddddoyyyyoddddDDsS.', '.SsDddddddoooodddddDDsS.', '.SsDddddddddddddddddDsS.', '.SsDddooddddddddooddDsS.', '.SsDddooddddddddooddDsS.',
    '.SsDddddddddddddddddDsS.', '.SsDddddddddddddddddDsS.', '.SsDDddddddDDddddddDDsS.', '.SsDDDDDDDDDDDDDDDDDDsS.', 'SSSSSSSSSSSSSSSSSSSSSSSS'], { S: '#7a3222', s: '#4f2018', D: '#2b1a22', d: '#3d2630', o: '#a3482e', y: '#e2542b', Y: '#ffd35a' });
  SPR.camp = spr(['.....k......k.....', '....k.k....k.k....', '...kLLLk..kLLLk...', '..kLLLLLkkLLLLLk..', '.kLLLLdLLLLdLLLLk.', 'kLLLLddLLLLddLLLLk'], { k: '#4a3220', L: '#8a6a48', d: '#2b1a22' });
  SPR.logs = spr(['.b.......b', 'bLbbbbbbbLb', '.b.bLLb..b.', '..bbbbbbb..'], { b: '#142a30', L: '#2c575e' });
  SPR.mote = spr(['...dddddd...', '.ddDDDDDDdd.', 'dDDDDoDDDDDd', 'dDwkDDDDwkDd', 'dDDDDDDoDDDd', 'dDoDDDDDDDDd', 'dDDDDooDDDDd', '.dDDDDDDDDd.', '..dddddddd..'], { d: '#3a3340', D: '#544a5c', o: '#ff7a2a', w: '#f4efe6', k: '#17121f' });
  const mitePal = { c: '#62a9bc', C: '#b4e6e8', W: '#ffffff', k: '#120d1f', d: '#3f7f92' };
  SPR.mite = [spr(['...ccc...', '..cCWCc..', '.cCCCCCc.', 'cCkCCCkCc', '.d.d.d.d.', 'd..d.d..d'], mitePal), spr(['...ccc...', '..cCWCc..', '.cCCCCCc.', 'cCkCCCkCc', 'd.d...d.d', '.d.d.d.d.'], mitePal)];
  SPR.bat = spr(['d....d', 'dDddDd', 'dDDDDd', 'dyDDyd', '.dDDd.', '..dd..'], { d: '#3a2f4a', D: '#5a4a72', y: '#ffd35a' });
  SPR.wing = spr(['dd......', 'dDDdd...', 'dDDDDdd.', '.dDdDDDd', '..d.dDd.'], { d: '#3a2f4a', D: '#5a4a72' });
  SPR.h_head = spr(['.GGGGG.', 'GGGGGGg', 'GGddddd', 'GGdodod', 'GGGGGGg', '.GgGgG.', '..ggg..'], { G: '#6b6470', g: '#4a444f', d: '#17121f', o: '#ff7a2a' });
  SPR.h_torso = spr(['GGGGGG', 'GgGGGg', 'GGGdGg', 'GgGGGg', 'rrrrrr', 'gGGGGg', 'gGGGgg', '.gGGg.'], { G: '#5d5560', g: '#463f4a', d: '#221c2a', r: '#5a3a30' });
  SPR.boss = genBoss(); SPR.fist = genFist();
  SPR.rock = spr(['..ssss..', '.sSSSSs.', 'sSSsSSSs', 'sSsSSSds', 'sSSSSdds', '.sSddds.', '..ssss..'], { s: '#172630', S: '#375666', d: '#22343f' });
  SPR.top = []; for (let k = 0; k < 3; k++) { SPR.top[k] = []; for (let v = 0; v < 3; v++) SPR.top[k][v] = genTop(k, v); }
  SPR.cursor = outlined(spr(['..w..', '..w..', 'ww.ww', '..w..', '..w..'], { w: '#fff1a8' }));
  SPR.heart = outlined(spr(['.rr.rr.', 'rRrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], { r: '#e2483b', R: '#ff9a8a' }));
  SPR.bolt = outlined(spr(['.yy.', 'yYYy', 'yYYy', '.yy.'], { y: '#ff7a2a', Y: '#fff1a8' }), '#8f2233');
  SPR.ring = genRing();
}
// lantern-stalk crowns: fronds ending in glowing pods (kind 0), frost blooms (1), rust hooks (2)
function genTop(kind, v) {
  const w = 46, h = 32; const [c, x] = mk(w, h); const R = mulberry32(v * 977 + kind * 131 + 7), pods = [];
  const px = (X, Y, col) => { x.fillStyle = col; x.fillRect(round(X), round(Y), 1, 1); };
  if (kind === 0) {
    const n = 4 + (v % 2);
    for (let i = 0; i < n; i++) {
      const dir = i % 2 ? 1 : -1, len = 7 + R() * 12, up = 10 + R() * 14, x2 = 23 + dir * len, y2 = 31 - up * .45 + R() * 4, x1 = 23 + dir * len * .45, y1 = 31 - up;
      for (let t = 0; t <= 1; t += .03) { const X = (1 - t) * (1 - t) * 23 + 2 * (1 - t) * t * x1 + t * t * x2, Y = (1 - t) * (1 - t) * 31 + 2 * (1 - t) * t * y1 + t * t * y2; px(X, Y, PALS.stalk[1]); if (t < .5) px(X + (dir > 0 ? -1 : 1), Y, PALS.stalk[0]); }
      const amber = (i + v) % 3 !== 0; const X = round(x2), Y = round(y2);
      x.fillStyle = PALS.stalk[3]; x.fillRect(X - 2, Y, 5, 5); x.fillStyle = amber ? '#ffb347' : '#4fd8c8'; x.fillRect(X - 1, Y + 1, 3, 3); px(X, Y + 2, amber ? '#fff1a8' : '#c9fff6'); px(X, Y - 1, PALS.stalk[1]);
      pods.push([X, Y + 2, amber ? 0 : 1]);
    }
  } else if (kind === 1) {
    for (let i = 0; i < 6; i++) { const a = -PI / 2 + (i - 2.5) * .42 + (R() - .5) * .2, len = 9 + R() * 12; for (let r = 0; r < len; r++) { const wd = max(0, (1 - r / len) * 2.2); for (let k = -wd; k <= wd; k++) { const X = 23 + cos(a) * r - sin(a) * k, Y = 31 + sin(a) * r + cos(a) * k; px(X, Y, r > len - 3 ? '#ffffff' : k < 0 ? '#dcf7f5' : '#8fd0d8'); } } }
    pods.push([23, 24, 1]);
  } else {
    let X = 23, Y = 31; const dir = v % 2 ? 1 : -1; for (let i = 0; i < 8; i++) { px(X, Y, '#a3482e'); px(X + 1, Y, '#7a3222'); Y--; }
    for (let i = 0; i < 9; i++) { px(X, Y, '#a3482e'); px(X, Y + 1, '#7a3222'); X += dir; if (i > 5) Y++; }
    for (let i = 0; i < 5; i++) px(X, Y + 1 + i, i % 2 ? '#4f2018' : '#bd5a36');
    x.fillStyle = '#4f2018'; x.fillRect(X - 2, Y + 6, 5, 5); x.fillStyle = '#e2542b'; x.fillRect(X - 1, Y + 7, 3, 3); px(X, Y + 8, '#ffb347'); pods.push([X, Y + 8, 2]);
  }
  return { cv: c, pods };
}
// the Dawnforge: a broken ring of light hanging in the sky
function genRing() {
  const n = 121, r0 = 44, r1 = 52; const [c, x] = mk(n, n); const gaps = [[.2, .5], [1.9, 2.25], [3.3, 3.5], [4.6, 5.15]];
  for (let Y = 0; Y < n; Y++) for (let X = 0; X < n; X++) {
    const dx = X - 60, dy = Y - 60, d = hypot(dx, dy), a = (atan2(dy, dx) + TAU) % TAU; let col = null;
    const gap = gaps.some(g => a > g[0] && a < g[1]);
    if (d >= r0 && d <= r1 && !gap) col = d < r0 + 2 ? '#fff1a8' : d < r0 + 5 ? '#ffd35a' : '#ff9a3d';
    else if (d > r1 && d < r1 + 3 && !gap && ((X + Y) & 1)) col = '#e2542b';
    else if (d < 15) col = d < 9 ? '#fff1a8' : ((X + Y) & 1) || d < 12 ? '#ffd35a' : null;
    if (col) { x.fillStyle = col; x.fillRect(X, Y, 1, 1); }
  }
  const R = mulberry32(9); for (let i = 0; i < 14; i++) { const g = gaps[i % 4], a = g[0] + R() * (g[1] - g[0]), d = r0 - 4 + R() * 18, X = round(60 + cos(a) * d), Y = round(60 + sin(a) * d), s = 1 + (R() * 3 | 0); x.fillStyle = R() > .5 ? '#ffd35a' : '#ff9a3d'; x.fillRect(X, Y, s, s > 1 ? s - 1 : 1); }
  return c;
}
function genBoss() {
  const w = 48, h = 46; const [c, x] = mk(w, h); const px = (X, Y, col) => { x.fillStyle = col; x.fillRect(X, Y, 1, 1); };
  const cols = ['#4d4856', '#5f5a69', '#726d7d', '#8a8596'];
  const inside = (X, Y) => { if (Y < 8) { return (X >= 5 && X <= 11 && Y >= 3) || (X >= 20 && X <= 27 && Y >= 1) || (X >= 36 && X <= 42 && Y >= 4); } const nx = (X - 23.5) / 23.5, ny = (Y - 26.5) / 19.5; return pow(abs(nx), 3.4) + pow(abs(ny), 3.4) < 1 - .09 * hh(X >> 1, Y >> 1, 5); };
  for (let Y = 0; Y < h; Y++) for (let X = 0; X < w; X++) if (inside(X, Y)) {
    const edge = !inside(X - 1, Y) || !inside(X + 1, Y) || !inside(X, Y - 1) || !inside(X, Y + 1);
    let n = hh(X >> 1, Y >> 1, 9) * .6 + hh(X, Y, 3) * .4, col = cols[n < .2 ? 0 : n < .6 ? 1 : n < .9 ? 2 : 3];
    if (Y > 36) col = cols[n < .6 ? 0 : 1]; if (Y < 12 && X < 20 && n > .45) col = cols[3];
    if (Y < 13 + hh(X >> 1, 0, 4) * 6 && hh(X, Y, 6) > .3) col = hh(X, Y, 8) > .5 ? '#f06a55' : '#c94a4e';
    if (edge) col = '#2e2a36'; px(X, Y, col);
  }
  for (let X = 8; X < 40; X++) { px(X, 17, '#2e2a36'); if (X < 20 || X > 27) px(X, 18, '#8a8596'); }
  for (const ex of [10, 30]) for (let Y = 20; Y < 25; Y++) for (let X = ex; X < ex + 8; X++) px(X, Y, '#17121f');
  const R = mulberry32(42); for (let k = 0; k < 6; k++) { let X = 6 + R() * 36, Y = 12 + R() * 28; for (let i = 0; i < 9; i++) { if (inside(round(X), round(Y)) && !(Y > 18 && Y < 37 && X > 8 && X < 40)) px(round(X), round(Y), '#2e2a36'); X += R() * 2 - 1; Y += R() * 1.4; } }
  return c;
}
function genFist() {
  const w = 16, h = 15; const [c, x] = mk(w, h); const cols = ['#4d4856', '#5f5a69', '#726d7d', '#8a8596'];
  const inside = (X, Y) => pow(abs((X - 7.5) / 8), 3) + pow(abs((Y - 7) / 7.5), 3) < 1;
  for (let Y = 0; Y < h; Y++) for (let X = 0; X < w; X++) if (inside(X, Y)) { const edge = !inside(X - 1, Y) || !inside(X + 1, Y) || !inside(X, Y - 1) || !inside(X, Y + 1); const n = hh(X >> 1, Y >> 1, 19) * .6 + hh(X, Y, 23) * .4; x.fillStyle = edge ? '#2e2a36' : (Y > 9 && X % 4 === 3) || Y === 9 ? '#3a3542' : Y < 3 ? cols[3] : cols[n < .25 ? 0 : n < .7 ? 1 : 2]; x.fillRect(X, Y, 1, 1); }
  return c;
}
