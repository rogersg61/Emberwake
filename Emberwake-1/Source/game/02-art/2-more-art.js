// ============================================================
//  Art, part two: liquids and deep stone, village props, house
//  facades, foreground foliage, new creatures and folk, sidearms,
//  nunchaku, and parallax backdrops for every region and depth.
// ============================================================
const WATER = 32, CINDER = 33, DEEPSTONE = 34, FUNGUS = 35, PEDESTAL = 36, DEEPGLOW = 37, HEARTH = 38;
const W_PLANK = 8, W_DEEP = 9, WSKY = [0, 0, 0, 0, 0, 0, 1, 1, 0, 0];
defT(WATER, { name: 'Dewwater', liquid: 1, dust: '#8fd0d8' });
defT(CINDER, { name: 'Molten Cinder', liquid: 2, light: [.95, .45, .14], dust: '#ff7a2a' });
defT(DEEPSTONE, { name: 'Deepstone', solid: true, full: true, hard: 58, drop: 'deepstone', hi: '#6a3f52', dust: '#3a2430' });
defT(DEEPGLOW, { name: 'Veined Deepstone', solid: true, full: true, hard: 58, drop: 'deepstone', hi: '#6a3f52', dust: '#ff7a2a', light: [.4, .13, .05] });
defT(FUNGUS, { name: 'Ember Cap', decor: true, hard: 1, ground: true, drop: 'glowcap', light: [.55, .24, .08], dust: '#ffb347' });
defT(PEDESTAL, { name: 'Pedestal', dyn: true, hard: Infinity });
defT(HEARTH, { name: 'Hearth', dyn: true, hard: Infinity, light: [1, .62, .3] });
function buildTiles2() {
  const DP = ['#2c1d28', '#382533', '#462c3e', '#1f141c'];
  const deep = (px, py, v) => { const r = hh(px >> 1, py >> 1, 171 + v * 7) * .6 + hh(px, py, 173 + v) * .4; return r > .93 ? '#6a3f52' : shade(DP, r); };
  TEX[DEEPSTONE] = genTex(deep);
  TEX[DEEPGLOW] = genTex((px, py, v) => { const k = (px * 2 + py * 3 + v * 5) % 11; return (k === 0 || (k === 1 && hh(px, py, 5) > .5)) ? (hh(px, py, 179 + v) > .4 ? '#ff9a3d' : '#e2542b') : deep(px, py, v); });
  TEX[FUNGUS] = genTex(mask8(['........', '..###...', '.#####..', '#######.', '..#.#...', '..#.#...', '..#.#...', '.##.##..'], (px, py, v) => py < 4 ? (hh(px, py, v) > .6 ? '#fff1a8' : py === 3 ? '#e2542b' : '#ffb347') : '#6b4a2f'));
  for (const id of [WATER, CINDER, PEDESTAL, HEARTH, GHOST]) TEX[id] = TEX[DIRT];
  const wall = (src, a) => src.map(s => { const [c, x] = mk(8, 8); x.drawImage(s, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = `rgba(9,6,24,${a})`; x.fillRect(0, 0, 8, 8); return c; });
  WTEX[W_PLANK] = wall(TEX[PLANK], .5); WTEX[W_DEEP] = wall(TEX[DEEPSTONE], .35);
}

// ---------------- props (background furniture, purely visual) ----------------
const PROP = {};
const WOOD = { t: '#8fb4c0', T: '#4b6d78', d: '#365058', D: '#22343f' };
function buildProps() {
  PROP.table = spr(['..gg......oo..', '..gg.....oooo.', 'tttttttttttttt', 'TTTTTTTTTTTTTT', '.dd........dd.', '.dd........dd.', '.dd........dd.', '.dd........dd.'], Object.assign({ g: '#e3d8c2', o: '#d67645' }, WOOD));
  PROP.chair = spr(['d....', 'd....', 'd....', 'd....', 'ttttt', 'TTTTT', 'd...d', 'd...d', 'd...d', 'd...d'], WOOD);
  PROP.shelf = spr(['dddddddddddd', 'dppppppppppd', 'dbbrgbpyypDd', 'dbbrgbpyypDd', 'dTTTTTTTTTTd', 'dppppppppppd', 'dpoopcbbrppd', 'dpoopcbbrppd', 'dTTTTTTTTTTd', 'dppppppppppd', 'dyypgbbrpppd', 'dyypgbbrpppd', 'dTTTTTTTTTTd', 'dppppppppppd', 'dddddddddddd'],
    Object.assign({ p: '#22343f', b: '#3a6f9a', r: '#c94a4e', g: '#58a868', y: '#ffd35a', o: '#d67645', c: '#e3d8c2' }, WOOD));
  PROP.bed = spr(['hh..............', 'hh..............', 'hhwwcCccCccCccCc', 'hhwwcccccccccccc', 'hhmmmmmmmmmmmmmm', 'hhMMMMMMMMMMMMMM', 'h..............h'], { h: '#4b6d78', w: '#f4efe6', c: '#c94a4e', C: '#ffa07c', m: '#e3d8c2', M: '#bba888' });
  PROP.lamp = spr(['..k..', '..k..', '..k..', '.kkk.', 'kyyyk', 'kyYyk', 'kyyyk', '.kkk.', '..k..'], { k: '#365058', y: '#ffb347', Y: '#fff1a8' });
  PROP.barrel = spr(['.bbbbbb.', 'bBBBBBBb', 'iiiiiiii', 'bBbbbbBb', 'bBbbbbBb', 'bBbbbbBb', 'bBbbbbBb', 'iiiiiiii', 'bBBBBBBb', '.bbbbbb.'], { b: '#8a6a48', B: '#a8845a', i: '#4a3220' });
  PROP.crate = spr(['cccccccc', 'cppppppc', 'cpdppppc', 'cppdpppc', 'cpppdppc', 'cppppdpc', 'cppppppc', 'cccccccc'], { c: '#6b4a2f', p: '#a8845a', d: '#6b4a2f' });
  PROP.anvil = spr(['aaaaaaaaa..', 'AAAAAAAAAaa', '..AAAAAA...', '...aAAa....', '...aAAa....', '..aaaaaa...', '.AAAAAAAA..'], { a: '#3f3a4c', A: '#726d7d' });
  PROP.rug = spr(['cccccccccccccccc', 'CyCyCyCyCyCyCyCy'], { c: '#c94a4e', C: '#e3d8c2', y: '#ffd35a' });
  PROP.sacks = spr(['..ss.....', '.sSss.ss.', 'sSSssSSss', 'sSSssSSss', 'sssssssss'], { s: '#bba888', S: '#e3d8c2' });
  PROP.pot = spr(['..c.c..', '.ccCcc.', 'cCcccCc', '.cccCc.', '...g...', '.ooooo.', '.oOOOo.', '.ooooo.', '..ooo..'], { c: '#f06a55', C: '#ffa07c', o: '#bd5a36', O: '#d67645', g: '#2c575e' });
  PROP.cauldron = spr(['.aaaaaaa.', 'aAAAAAAAa', 'a.ggggg.a', 'aaggggga.', '.aaaaaaa.', '..a...a..'], { a: '#3f3a4c', A: '#726d7d', g: '#58a868' });
  PROP.stool = spr(['ttttt', 'TTTTT', 'd...d', 'd...d'], WOOD);
  PROP.board = spr(['pp..........pp', 'bbbbbbbbbbbbbb', 'bBBBBBBBBBBBBb', 'bBwwB.wwwBwwBb', 'bBwwB.wwwBwwBb', 'bBwwByBwwBwwBb', 'bBBBByBBBBBBBb', 'bBwwwBBwwwBBBb', 'bBwwwBBwwwBBBb', 'bBBBBBBBBBBBBb', 'bbbbbbbbbbbbbb', '.p..........p.', '.p..........p.', '.p..........p.'], { b: '#4b6d78', B: '#6f97a4', w: '#f4efe6', y: '#c94a4e', p: '#365058' });
  PROP.post = spr(['.kkk.', 'kyyyk', 'kyYyk', 'kyyyk', '.kkk.', ...Array(15).fill('..p..'), '.ppp.'], { k: '#365058', y: '#ffb347', Y: '#fff1a8', p: '#4b6d78' });
  const ban = (c, C) => spr(['kkkkkkk', '.ccccc.', '.ccccc.', '.cyyyc.', '.yc.cy.', '.yc.cy.', '.cyyyc.', '.ccccc.', '.cCcCc.', '.ccccc.', '.ccccc.', '.cc.cc.', '.c...c.'], { k: '#365058', c, C, y: '#ffd35a' });
  PROP.banners = [ban('#c94a4e', '#a93a42'), ban('#3a6f76', '#2c575e'), ban('#5a4a72', '#3a2f4a')];
  PROP.hearth = spr(['..ssssssssssss..', '..sSSSSSSSSSSs..', '..sSsSSsSSsSSs..', '.ssssssssssssss.', 'ssSSSSSSSSSSSSss', 'sSSkkkkkkkkkkSSs', 'sSkkkkkkkkkkkkSs', 'sSkk........kkSs', 'sSk..........kSs', 'sSk..........kSs', 'sSk...llll...kSs', 'sSk..llllll..kSs', 'ssssssssssssssss', 'SSSSSSSSSSSSSSSS'], { s: '#514c62', S: '#7f7a93', k: '#1d131b', l: '#6b4a2f' });
  PROP.altar = spr(['.ssssssssss.', 'sSSSSSSSSSSs', '.sSsSSSSsSs.', '..sSSSSSSs..', '..sSsSSsSs..', '..sSSSSSSs..', '.ssssssssss.', 'SSSSSSSSSSSS'], { s: '#514c62', S: '#938ea8' });
  PROP.chain = spr(['.a.', 'a.a', '.a.', 'a.a'], { a: '#7f8898' });
  PROP.beam = (h) => { const [c, x] = mk(4, h); x.fillStyle = '#6b4a2f'; x.fillRect(0, 0, 4, h); x.fillStyle = '#8a6a48'; x.fillRect(1, 0, 1, h); x.fillStyle = '#4a3220'; x.fillRect(3, 0, 1, h); for (let y = 4; y < h; y += 9) { x.fillStyle = '#4a3220'; x.fillRect(0, y, 4, 1); } return c; };
  PROP.crossbeam = (w) => { const [c, x] = mk(w, 4); x.fillStyle = '#6b4a2f'; x.fillRect(0, 0, w, 4); x.fillStyle = '#8a6a48'; x.fillRect(0, 1, w, 1); x.fillStyle = '#4a3220'; x.fillRect(0, 3, w, 1); return c; };
  PROP.stalactite = (h, seed) => { const R = mulberry32(seed); const w = 5 + (R() * 5 | 0); const [c, x] = mk(w, h); for (let y = 0; y < h; y++) { const hw = (w / 2) * (1 - y / h) ** .8; x.fillStyle = y > h - 3 ? '#4a3f5a' : '#2d2440'; x.fillRect(round(w / 2 - hw), y, max(1, round(hw * 2)), 1); } return c; };
  PROP.crystal = (seed) => { const R = mulberry32(seed); const [c, x] = mk(9, 10); for (let k = 0; k < 3; k++) { const bx = 1 + k * 3 + (R() * 2 | 0) - 1, ht = 4 + (R() * 6 | 0); for (let y = 0; y < ht; y++) { x.fillStyle = y === 0 ? '#ffffff' : k === 1 ? '#8fd0d8' : '#4fb0b8'; x.fillRect(bx, 10 - ht + y, 2, 1); } } return c; };
  PROP.vent = spr(['...ss......ss...', '.sSss.kkkk.ssSs.', 'sSSskkkkkkkksSSs', 'SSskkkkkkkkkksSS', 'ssskkkkkkkkkksss', 'SsssssssssssssSs'], { s: '#514c62', S: '#7f7a93', k: '#1d1424' });
  // foreground fences
  PROP.fence = spr(['.k....k.', 'kPk..kPk', 'rrrrrrrr', 'rRRRRRRr', '.P....P.', 'rrrrrrrr', '.P....P.', '.P....P.'], { k: '#8fb4c0', P: '#4b6d78', r: '#6f97a4', R: '#8fb4c0' });
}
// ---------------- house facades: drawn in front of you, fade when you step inside ----------------
function genFacade(w, h, roofH, o = {}) {
  const CW = (w + 2) * 8, wallTop = roofH * 8, CH = (roofH + h + 1) * 8 + 3; const [c, x] = mk(CW, CH); const win = [], smoke = [];
  const px = (X, Y, col) => { x.fillStyle = col; x.fillRect(X, Y, 1, 1); };
  const L = 8, R = 8 + w * 8, plaster = o.stone ? ['#7f7a93', '#938ea8', '#6d6880'] : ['#e3d8c2', '#efe6d4', '#d6c8ae'];
  for (let Y = wallTop; Y < CH - 3; Y++) for (let X = L; X < R; X++) px(X, Y, o.stone ? (((Y >> 2) + ((X + ((Y >> 2) & 1) * 4) >> 3)) & 1 ? plaster[0] : plaster[2]) : plaster[hh(X >> 1, Y >> 1, 41) > .82 ? 1 : hh(X, Y, 43) > .9 ? 2 : 0]);
  const beamC = o.stone ? '#514c62' : '#4b6d78', beamD = o.stone ? '#3f3a4c' : '#365058';
  const vbeam = X => { x.fillStyle = beamC; x.fillRect(X, wallTop, 3, CH - 3 - wallTop); x.fillStyle = beamD; x.fillRect(X + 2, wallTop, 1, CH - 3 - wallTop); };
  const hbeam = Y => { x.fillStyle = beamC; x.fillRect(L, Y, R - L, 3); x.fillStyle = beamD; x.fillRect(L, Y + 2, R - L, 1); };
  if (!o.stone) { vbeam(L); vbeam(R - 3); for (let X = L + 32; X < R - 16; X += 32) vbeam(X); hbeam(wallTop); hbeam(CH - 8); if (h > 6) hbeam(o.floors === 2 ? wallTop + 8 * h - 24 : wallTop + floor((CH - 8 - wallTop) / 2)); }
  else { x.fillStyle = '#514c62'; x.fillRect(L, wallTop, 3, CH - 3 - wallTop); x.fillRect(R - 3, wallTop, 3, CH - 3 - wallTop); }
  // windows (glow at night)
  const floors = o.floors || 1, fh = floor(h / floors);
  for (let f = 0; f < floors; f++) {
    const wy = wallTop + 8 + f * fh * 8 + floor((fh - 3) * 4);
    for (let X = L + 14; X < R - 22; X += 24) {
      if (((o.door === -1 || o.door === 2) && X < L + 24 || (o.door === 1 || o.door === 2) && X > R - 40) && f === floors - 1) continue;
      x.fillStyle = beamD; x.fillRect(X - 1, wy - 1, 12, 12); x.fillStyle = '#ffb347'; x.fillRect(X, wy, 10, 10); x.fillStyle = '#fff1a8'; x.fillRect(X + 1, wy + 1, 3, 3); x.fillRect(X + 6, wy + 1, 3, 3);
      x.fillStyle = beamD; x.fillRect(X + 4, wy, 2, 10); x.fillRect(X, wy + 4, 10, 2); x.fillStyle = beamC; x.fillRect(X - 2, wy + 11, 14, 2);
      win.push([X, wy, 10, 10]);
    }
  }
  // doorway on the side you walk in from
  const dr = (side) => { const dx = side < 0 ? L + 3 : R - 19, dy = CH - 3 - 26; x.fillStyle = beamD; x.fillRect(dx - 1, dy - 2, 18, 28); x.fillStyle = '#1d1424'; x.fillRect(dx + 1, dy, 14, 26); for (let Y = 0; Y < 4; Y++) { x.fillStyle = beamD; x.fillRect(dx + 1 + Y, dy + Y - 4 + 4, 14 - Y * 2, 1); } x.fillStyle = '#ffd35a'; x.fillRect(side < 0 ? dx + 11 : dx + 3, dy + 13, 1, 2); };
  if (o.door) { if (o.door === 2) { dr(-1); dr(1); } else dr(o.door); }
  // foundation
  for (let X = L - 2; X < R + 2; X++) for (let Y = CH - 3; Y < CH; Y++) px(X, Y, ((X >> 2) + Y) & 1 ? '#6d6880' : '#514c62');
  // gable roof with shingles
  if (roofH > 0) {
    const cxr = CW / 2, rh = roofH * 8 + 2;
    for (let Y = 0; Y < rh; Y++) {
      const half = 4 + (Y / rh) * (CW / 2 - 2), row = Y >> 1;
      for (let X = round(cxr - half); X < round(cxr + half); X++) { const edge = X === round(cxr - half) || X === round(cxr + half) - 1; px(X, Y + wallTop - rh + 3, edge ? INK : (Y & 1) && ((X + row * 3) % 6 === 0) ? '#8f2f36' : row % 2 ? (o.roof2 || '#c94a4e') : (o.roof || '#a93a42')); }
    }
    x.fillStyle = INK; x.fillRect(L - 4, wallTop + 2, R - L + 8, 1);
    if (o.chimney) { const cxp = o.chimney > 0 ? R - 22 : L + 12; x.fillStyle = '#514c62'; x.fillRect(cxp, 2, 8, wallTop); x.fillStyle = '#7f7a93'; x.fillRect(cxp + 1, 2, 2, wallTop); x.fillStyle = '#3f3a4c'; x.fillRect(cxp - 1, 0, 10, 3); smoke.push([cxp + 4, 0]); }
  }
  if (o.sign) { const sx = (L + R) / 2 - 7, sy = wallTop + 4; x.drawImage(o.sign, round(sx), sy); }
  return { cv: outlined(c), win: win.map(w => [w[0] + 1, w[1] + 1, w[2], w[3]]), smoke: smoke.map(s => [s[0] + 1, s[1] + 1]) };
}
function genTowerFacade(w, h, o = {}) {
  const CW = w * 8, CH = h * 8; const [c, x] = mk(CW, CH + 6); const win = [];
  for (let Y = 6; Y < CH + 6; Y++) for (let X = 0; X < CW; X++) { const row = (Y - 6) >> 2, odd = row & 1; x.fillStyle = (Y - 6) % 4 === 3 || (X + odd * 4) % 8 === 0 ? '#514c62' : hh(X >> 2, row, 51) > .8 ? '#938ea8' : o.ruin && hh(X >> 1, row, 57) > .9 ? '#4b6d78' : '#7f7a93'; x.fillRect(X, Y, 1, 1); }
  for (let X = 0; X < CW; X += 8) { x.fillStyle = '#7f7a93'; x.fillRect(X, 0, 5, 7); x.fillStyle = '#514c62'; x.fillRect(X, 6, 5, 1); }
  for (let Y = 20; Y < CH - 30; Y += 32) { const X = CW / 2 - 2; x.fillStyle = '#1d1424'; x.fillRect(X, Y, 4, 12); x.fillStyle = '#ffb347'; x.fillRect(X + 1, Y + 2, 2, 8); if (!o.ruin) win.push([X + 1, Y + 2, 2, 8]); else { x.fillStyle = '#1d1424'; x.fillRect(X + 1, Y + 2, 2, 8); } }
  // doors at both foot corners: that is where the walls are open
  for (const dx of [0, CW - 12]) { x.fillStyle = '#1d1424'; x.fillRect(dx + 1, CH + 6 - 23, 10, 23); x.fillStyle = '#514c62'; x.fillRect(dx, CH + 6 - 25, 12, 2); }
  if (o.ruin) { const R = mulberry32(w * 97 + h); let cut = 6; for (let X = 0; X < CW; X++) { cut = clamp(cut + (R() - .45) * 4, 4, 30); x.clearRect(X, 0, 1, round(cut)); } for (let k = 0; k < 7; k++) { const hx = R() * CW | 0, hy = 30 + R() * (CH - 60) | 0; x.fillStyle = '#1d1424'; x.fillRect(hx, hy, 2 + (R() * 3 | 0), 1 + (R() * 2 | 0)); }
    for (let k = 0; k < 9; k++) { let vx = R() * CW | 0, vy = 10 + R() * 30 | 0; for (let i = 0; i < 12; i++) { x.fillStyle = i % 3 ? '#2c575e' : '#8ff5e6'; x.fillRect(vx, vy + i, 1, 1); if (R() < .3) vx += R() < .5 ? -1 : 1; } } }
  return { cv: outlined(c), win: win.map(w => [w[0] + 1, w[1] + 1, w[2], w[3]]), smoke: [] };
}
function genArchFacade(w, h, o = {}) {
  const CW = w * 8, CH = h * 8; const [c, x] = mk(CW, CH); const stone = o.deep ? ['#3a2430', '#5a3a4a', '#2a1a24'] : ['#7f7a93', '#938ea8', '#514c62'];
  const n = max(2, round(w / 7)), span = CW / n;
  for (let k = 0; k <= n; k++) { const X = round(k * span) - (k === n ? 6 : 0); x.fillStyle = stone[0]; x.fillRect(X, 10, 6, CH - 10); x.fillStyle = stone[1]; x.fillRect(X + 1, 10, 1, CH - 10); x.fillStyle = stone[2]; x.fillRect(X - 1, CH - 4, 8, 4); x.fillRect(X - 1, 8, 8, 3); }
  x.fillStyle = stone[0]; x.fillRect(0, 0, CW, 6); x.fillStyle = stone[1]; x.fillRect(0, 1, CW, 1); x.fillStyle = stone[2]; x.fillRect(0, 5, CW, 1);
  for (let k = 0; k < n; k++) { const a = round(k * span) + 6, b = round((k + 1) * span), mid = (a + b) / 2, rw = (b - a) / 2; for (let X = a; X < b; X++) { const t = (X - mid) / rw, d = round(sqrt(max(0, 1 - t * t)) * 9); x.fillStyle = stone[0]; x.fillRect(X, 6, 1, max(0, 12 - d)); x.fillStyle = stone[2]; x.fillRect(X, 6 + max(0, 12 - d), 1, 1); } if (o.banners && k % 2 === 0) x.drawImage(PROP.banners[(k / 2) % 3 | 0], round(mid - 3), 14); }
  if (o.broken) for (let i = 0; i < 6; i++) { const bx = (hh(i, 7, 9) * CW) | 0, bw = 4 + (hh(i, 8, 9) * 10 | 0); x.clearRect(bx, 0, bw, 4 + (hh(i, 9, 9) * 8 | 0)); }
  return { cv: outlined(c), win: [], smoke: [] };
}
function genWellFacade() {
  const [c, x] = mk(36, 34);
  x.fillStyle = '#4b6d78'; x.fillRect(3, 6, 3, 18); x.fillRect(30, 6, 3, 18);
  for (let Y = 0; Y < 7; Y++) { const half = 6 + Y * 2.2; x.fillStyle = Y & 1 ? '#a93a42' : '#c94a4e'; x.fillRect(round(18 - half), Y, round(half * 2), 1); }
  x.fillStyle = '#365058'; x.fillRect(6, 9, 24, 2); x.fillStyle = '#7f8898'; x.fillRect(17, 11, 1, 7); x.fillStyle = '#8a6a48'; x.fillRect(15, 18, 5, 4);
  for (let Y = 22; Y < 34; Y++) for (let X = 1; X < 35; X++) { x.fillStyle = (Y - 22) % 4 === 3 || (X + (((Y - 22) >> 2) & 1) * 3) % 6 === 0 ? '#514c62' : '#938ea8'; x.fillRect(X, Y, 1, 1); }
  return { cv: outlined(c), win: [], smoke: [] };
}
function genStallFacade(cols) {
  const [c, x] = mk(48, 30);
  for (let X = 0; X < 48; X++) { const st = ((X >> 3) & 1); x.fillStyle = st ? cols[0] : '#f4efe6'; x.fillRect(X, 0, 1, 7); if (X % 8 < 4) { x.fillStyle = st ? cols[0] : '#f4efe6'; x.fillRect(X, 7, 1, 2); } }
  x.fillStyle = '#4b6d78'; x.fillRect(2, 7, 2, 23); x.fillRect(44, 7, 2, 23);
  x.fillStyle = '#8a6a48'; x.fillRect(0, 20, 48, 3); x.fillStyle = '#6b4a2f'; x.fillRect(0, 23, 48, 7); x.fillStyle = '#a8845a'; x.fillRect(0, 20, 48, 1);
  const goods = ['#ffd35a', '#f06a55', '#58a868', '#8fd0d8', '#e3d8c2']; for (let i = 0; i < 9; i++) { x.fillStyle = goods[i % 5]; x.fillRect(6 + i * 4, 17 + (i & 1), 3, 3); }
  return { cv: outlined(c), win: [], smoke: [] };
}
function genHeadframe() {
  const [c, x] = mk(48, 44);
  const L = (x1, y1, x2, y2) => { const n = max(abs(x2 - x1), abs(y2 - y1)); for (let i = 0; i <= n; i++) { const X = round(x1 + (x2 - x1) * i / n), Y = round(y1 + (y2 - y1) * i / n); x.fillStyle = '#6b4a2f'; x.fillRect(X, Y, 3, 3); x.fillStyle = '#8a6a48'; x.fillRect(X, Y, 1, 3); } };
  L(4, 43, 22, 4); L(42, 43, 24, 4); L(10, 30, 36, 30); L(14, 20, 32, 20);
  for (let a = 0; a < TAU; a += .2) { x.fillStyle = '#3f3a4c'; x.fillRect(round(24 + cos(a) * 6), round(8 + sin(a) * 6), 2, 2); }
  x.fillStyle = '#7f8898'; x.fillRect(24, 8, 1, 30);
  return { cv: outlined(c), win: [], smoke: [] };
}
// ---------------- foreground foliage ----------------
const FOL = {};
function buildFoliage() {
  const tuft = (seed, cols, w = 16, hmax = 8) => { const R = mulberry32(seed); const [c, x] = mk(w, hmax); for (let X = 0; X < w; X++) { const edge = min(X, w - 1 - X), hgt = max(1, round((1 + R() * (hmax - 1)) * min(1, edge / 3 + .35))); for (let Y = 0; Y < hgt; Y++) { x.fillStyle = Y === hgt - 1 ? cols[0] : Y > hgt * .5 ? cols[1] : cols[2]; x.fillRect(X, hmax - 1 - Y, 1, 1); } } return outlined(c); };
  const fern = (seed, stem, tip) => { const R = mulberry32(seed); const [c, x] = mk(14, 14); for (let k = 0; k < 5; k++) { let X = 7, Y = 13; const a0 = -PI / 2 + (k - 2) * .38, len = 7 + R() * 6; for (let i = 0; i < len; i++) { const a = a0 + i * .05 * (k - 2); X += cos(a); Y += sin(a); x.fillStyle = i > len - 3 ? tip : stem; x.fillRect(round(X), round(Y), 1, 1); if (i % 2 && i < len - 2) { x.fillRect(round(X + 1), round(Y), 1, 1); } } } return outlined(c); };
  const shards = (seed) => { const R = mulberry32(seed); const [c, x] = mk(12, 11); for (let k = 0; k < 4; k++) { const bx = 1 + k * 3 + (R() * 2 | 0), ht = 3 + (R() * 8 | 0); for (let Y = 0; Y < ht; Y++) { x.fillStyle = Y === 0 ? '#ffffff' : (k & 1) ? '#b4e6e8' : '#8fd0d8'; x.fillRect(bx, 11 - ht + Y, 2 - (Y === 0 ? 1 : 0), 1); } } return outlined(c); };
  const weeds = (seed) => { const R = mulberry32(seed); const [c, x] = mk(12, 11); for (let k = 0; k < 4; k++) { let X = 1 + k * 3, Y = 10; const len = 5 + R() * 5; for (let i = 0; i < len; i++) { x.fillStyle = i > len - 2 ? '#f0b070' : '#a3482e'; x.fillRect(round(X), round(Y), 1, 1); Y--; if (i > len - 3) X += k & 1 ? 1 : -1; } } return outlined(c); };
  const fungi = (seed) => { const R = mulberry32(seed); const [c, x] = mk(12, 9); for (let k = 0; k < 3; k++) { const bx = 1 + k * 4 + (R() * 2 | 0), ht = 2 + (R() * 4 | 0); x.fillStyle = '#6b4a2f'; x.fillRect(bx + 1, 9 - ht, 1, ht); x.fillStyle = '#e2542b'; x.fillRect(bx - 1, 9 - ht - 2, 5, 2); x.fillStyle = '#ffb347'; x.fillRect(bx, 9 - ht - 3, 3, 1); } return outlined(c); };
  FOL.moor = [tuft(1, ['#ffc2a0', '#f06a55', '#c94a4e']), tuft(2, ['#ffc2a0', '#f06a55', '#c94a4e'], 12, 7), fern(3, '#2c575e', '#ffa07c'), fern(4, '#3a6f76', '#f06a55')];
  FOL.reach = [shards(5), shards(6), tuft(7, ['#ffffff', '#dcf7f5', '#b4e6e8'], 12, 5)];
  FOL.scoria = [weeds(8), weeds(9), tuft(10, ['#f0b070', '#d67645', '#a3482e'], 12, 6)];
  FOL.ash = [tuft(11, ['#d6d0dc', '#a19baa', '#726c7c'], 12, 5), weeds(12)];
  FOL.drift = [tuft(13, ['#ffffff', '#dcf7f5', '#8fd0d8'], 14, 6), fern(14, '#62a9bc', '#ffffff')];
  FOL.deep = [fungi(15), fungi(16)];
}

// ---------------- new folk and creatures ----------------
function torsoSpr(pal) { return spr(['CCCCCC', 'CCCCCc', 'CCeCCc', 'CCCCCc', 'bbbbbb', 'dCCCCc', 'dCCCCd', '.dCCd.'], pal); }
function folk(headRows, headPal, hx, hy, torsoPal, limbs, scarf) { return Object.assign({ head: spr(headRows, headPal), torso: torsoSpr(torsoPal), hx, hy, scarf: scarf || null }, limbs); }
const LIMBS = (leg, legB, boot, arm, armB, hand, handB) => ({ leg, legB, boot, arm, armB, hand, handB });
function buildFolk() {
  SK[6] = folk(['..hhh..', '.hhhhh.', 'hhhhhhh', 'rrrrrrr', 'hhsssys', '.hssss.', '..sss..'], { h: '#1d1820', r: '#c94a4e', s: '#c98a64', y: '#1d131b' }, -3, -7, { C: '#2a2430', c: '#3a3340', d: '#17121f', e: '#c94a4e', b: '#c94a4e' }, LIMBS('#2a2430', '#1d1820', '#120d1f', '#3a3340', '#2a2430', '#c98a64', '#a87050'), ['#c94a4e', '#a93a42']);
  SK[7] = folk(['..ssss..', '.ssssss.', '.sssssys', '.ssssss.', '.bbbssb.', '.bbbbbb.', '..bbbb..', '...bb...'], { s: '#d9a682', b: '#e3d8c2', y: '#1d131b' }, -4, -8, { C: '#8a6a48', c: '#a8845a', d: '#4a3220', e: '#c9a44a', b: '#4a3220' }, LIMBS('#3f3a4c', '#2e2a36', '#1d131b', '#d9a682', '#b98c70', '#d9a682', '#b98c70'));
  SK[8] = folk(['.hhhhh.', 'hhhhhhh', 'hgGhgGh', 'hssssys', '.sssss.', '..sss..'], { h: '#c98a2b', g: '#8fd0d8', G: '#ffffff', s: '#e9b999', y: '#1d131b' }, -3, -6, { C: '#3a6f76', c: '#4fb0b8', d: '#1f3d44', e: '#ffd35a', b: '#6b4a2f' }, LIMBS('#4a3220', '#3a2618', '#1d131b', '#3a6f76', '#1f3d44', '#e9b999', '#c99a80'), ['#ffd35a', '#c98a2b']);
  SK[9] = folk(['..hhh..', '.hhhhh.', 'hhssshh', 'hhsssys', 'hhsssss', 'hh.sss.', 'h......'], { h: '#6b4a2f', s: '#d9a682', y: '#1d131b' }, -3, -7, { C: '#c94a4e', c: '#e06a60', d: '#8f2f36', e: '#ffd35a', b: '#f4efe6' }, LIMBS('#c94a4e', '#8f2f36', '#4a3220', '#e06a60', '#c94a4e', '#d9a682', '#b98c70'));
  SK[10] = folk(['.cccc..', 'cccccc.', 'ccccccc', '.ssssys', '.ssssss', '..ssss.'], { c: '#3a6f76', s: '#c98a64', y: '#1d131b' }, -3, -6, { C: '#6f97a4', c: '#8fb4c0', d: '#4b6d78', e: '#f4efe6', b: '#4a3220' }, LIMBS('#4b5468', '#363d4e', '#1d131b', '#6f97a4', '#4b6d78', '#c98a64', '#a87050'));
  SK[11] = folk(['.ddddd.', 'ddddddd', 'ddddddd', 'dddddvd', 'ddddddd', '.ddddd.', '..ddd..'], { d: '#17121f', v: '#c58cf2' }, -3, -7, { C: '#221c2a', c: '#2b2338', d: '#120d1f', e: '#c58cf2', b: '#3a2f4a' }, LIMBS('#221c2a', '#17121f', '#0b0812', '#2b2338', '#1d1726', '#3a2f4a', '#2b2338'), ['#3a2f4a', '#221c2a']);
  SK[12] = folk(['.iiiiii.', 'iIWIIIIi', 'iIiiiiIi', 'iIooYoIi', 'iIiiiiIi', 'iIIIIIIi', '.iiiiii.', '..iiii..'], { i: '#514c62', I: '#938ea8', W: '#d6d0dc', o: '#ff7a2a', Y: '#fff1a8' }, -4, -8, { C: '#726d7d', c: '#938ea8', d: '#3f3a4c', e: '#ffb347', b: '#e2542b' }, LIMBS('#514c62', '#3f3a4c', '#2e2a36', '#726d7d', '#514c62', '#938ea8', '#726d7d'));
  const rb = { r: '#7a3222', R: '#bd5a36', o: '#f0b070', k: '#4f2018', Y: '#ffd35a', L: '#4f2018' };
  SPR.rustback = [spr(['....rrrrrr....', '..rrRRRRRRrr..', '.rRRoRRRRRoRr.', 'rRRRRRRRRRRRrk', 'rrrrrrrrrrrrkY', '.L..L..L..L...', 'L..L..L..L....'], rb), spr(['....rrrrrr....', '..rrRRRRRRrr..', '.rRRoRRRRRoRr.', 'rRRRRRRRRRRRrk', 'rrrrrrrrrrrrkY', '..L..L..L..L..', '...L..L..L..L.'], rb)];
  SPR.rustball = spr(['...rrrr...', '.rrRRRRrr.', '.rRoRRoRr.', 'rRRRRRRRRr', 'rRRrrrrRRr', 'rRRRRRRRRr', 'rRoRRRRoRr', '.rRRRRRRr.', '.rrRRRRrr.', '...rrrr...'], rb);
  const ry = { W: '#b4e6e8', w: '#62a9bc', b: '#dcf7f5', E: '#1d131b', t: '#3f7f92', g: '#8ff5e6' };
  SPR.skyray = [spr(['w..................w', '.ww..............ww.', '..wWW....gg....WWw..', '...wWWWWbbbbWWWWw...', '.....WWWbbbEWWW.....', '.......WWbbWW.......', '.........tt.........', '..........t.........'], ry),
  spr(['....................', '....................', '.........gg.........', '..wwWWWWbbbbWWWWww..', 'ww...WWWbbbEWWW...ww', '.......WWbbWW.......', '.........tt.........', '..........t.........'], ry)];
  const cl = { k: '#3a2430', o: '#ff9a3d', y: '#e2542b', Y: '#fff1a8', e: '#1d131b' };
  SPR.cinderling = [spr(['...kkkk...', '..koyyok..', '.koYYYYok.', 'koYeYYeYok', 'koYYYYYYok', 'kooYYYYook', '.koooooook', '..kkkkkkk.'], cl), spr(['..........', '...kkkk...', '.kkoyyokk.', 'koYYYYYYok', 'koYeYYeYok', 'koYYYYYYok', 'kooYYYYook', 'kkkkkkkkkk'], cl)];
  SPR.dummy = spr(['..sss....', '.sSSSs...', '.sSSSs...', '..sss....', 'bbbbbbbbb', 'B..sss..B', '..sSSSs..', '..sSrSs..', '..sSSSs..', '..sSrSs..', '...sss...', '....p....', '....p....', '....p....', '....p....', '....p....', '...ppp...', '..ppppp..'], { s: '#a8845a', S: '#e3d8c2', r: '#c94a4e', b: '#6b4a2f', B: '#4a3220', p: '#4a3220' });
  SPR.glob = spr(['.yy.', 'yYYy', 'yYYy', '.yy.'], { y: '#e2542b', Y: '#ffd35a' });
}
// ---------------- sidearms, nunchaku, new weapon art ----------------
function buildArms() {
  const st = { w: '#e8edf2', s: '#aab3c2', d: '#5f6878', r: '#c94a4e' };
  SPR.shuriken = [spr(['..w..', '.wsw.', 'wsdsw', '.wsw.', '..w..'], st), spr(['w...w', '.wsw.', '.sds.', '.wsw.', 'w...w'], st)];
  SPR.hookhead = spr(['.www.', 'w...w', '....w', '...w.', '..w..'], { w: '#e8edf2' });
  SPR.flask = spr(['.kk.', '.gg.', 'gffg', 'gFfg', 'gffg', '.gg.'], { k: '#6b4a2f', g: '#b4e6e8', f: '#ff7a2a', F: '#ffd35a' });
  SPR.pellet = spr(['.dd.', 'dDDd', 'dDDd', '.dd.'], { d: '#3f3a4c', D: '#726d7d' });
  const I = (rows, pal) => outlined(spr(rows, pal));
  SPR.pedestal = outlined(spr(['sssssssss', 'SSSSSSSSS', '.sSSSSSs.', '..sSSSs..', '..sSsSs..', '..sSSSs..', '..sSsSs..', '.sSSSSSs.', 'sssssssss', 'SSSSSSSSS'], { s: '#514c62', S: '#938ea8' }));
  SPR.i_shuriken = I(['....w....', '...wsw...', '...sws...', '.wwsdsww.', 'wssdrdssw', '.wwsdsww.', '...sws...', '...wsw...', '....w....'], st);
  SPR.i_hook = I(['..www....', '.w...w...', '.....w...', '....w....', '...a.....', '..a.a....', '.a...a...', 'a.....a..', '.......aa'], { w: '#e8edf2', a: '#7f8898' });
  SPR.i_flask = I(['..kk..', '..kk..', '.gggg.', 'gffffg', 'gfFffg', 'gffFfg', 'gffffg', '.gggg.'], { k: '#6b4a2f', g: '#b4e6e8', f: '#ff7a2a', F: '#ffd35a' });
  SPR.i_smoke = I(['...dd...', '..dDDd..', '.dDDDDd.', '.dDDDDd.', '..dDDd..', '...dd...'], { d: '#3f3a4c', D: '#8b8fa3' });
  SPR.i_nunchaku = I(['ss.......', 'Sss......', '.sss.....', '..ss.....', '...c.....', '....c....', '.....ss..', '.....sSs.', '......sS.'], { s: '#8a6a48', S: '#c9a44a', c: '#aab3c2' });
  SPR.i_kmaul = I(['....sssss', '....sSSSs', '....sSySs', '...hsssss', '..h......', '.h.......', 'h........'], { h: '#3f3a4c', s: '#7a3222', S: '#e2542b', y: '#ffd35a' });
  SPR.w_kmaul = spr(['..............ssssss', '..............sSSSSs', '..............sSyySs', 'hhhhhhhhhhhhhhsSyySs', 'pHHHHHHHHHHHHHsSSSSs', '..............sSyySs', '..............sSSSSs', '..............sSSSSs', '..............ssssss'], { h: '#938ea8', H: '#726d7d', p: '#ff7a2a', s: '#a83a1e', S: '#ff7a2a', y: '#fff1a8' });
  SPR.i_wember3 = I(['...y...', '..yYy..', '.yYWYo.', '.oYWYo.', 'ooYYYoo', '.ooYoo.', '..ooo..'], { y: '#ff9a3d', Y: '#ffd35a', W: '#ffffff', o: '#c94a4e' });
  SPR.i_deepstone = outlined(TEX[DEEPSTONE][0]); SPR.i_skysilk = I(['..w....', '.wWw...', 'wWwWw..', '.wWwWw.', '..wWwWw', '...wWw.', '....w..'], { w: '#b4e6e8', W: '#ffffff' });
}
// nunchaku: one stick in the hand, a short chain, and a free stick that follows the swing
function drawNun(x, hx, hy, ang, a2, st) {
  const S = st || { st: '#8a6a48', cap: '#c9a44a', l1: '#e8edf2', l2: '#7f8898', end: 'stick', n: 3 }, c1 = cos(ang), s1 = sin(ang);
  seg(x, hx - c1, hy - s1, hx + c1 * 5, hy + s1 * 5, 2, S.st); x.fillStyle = S.cap; x.fillRect(round(hx - c1 * 1.5) - 1, round(hy - s1 * 1.5) - 1, 2, 2);
  const ex = hx + c1 * 5.6, ey = hy + s1 * 5.6, c2 = cos(a2), s2 = sin(a2), n = S.n || 3;
  for (let i = 1; i <= n; i++) { x.fillStyle = i & 1 ? S.l1 : S.l2; x.fillRect(round(ex + c2 * i) - 1, round(ey + s2 * i) - 1, 2, 2); }
  const bx = ex + c2 * (n + .6), by = ey + s2 * (n + .6);
  if (S.end === 'ball') { x.fillStyle = S.l2; x.fillRect(round(bx + c2 * 2) - 2, round(by + s2 * 2) - 2, 5, 5); x.fillStyle = S.head || S.l1; x.fillRect(round(bx + c2 * 2) - 1, round(by + s2 * 2) - 1, 3, 3); x.fillStyle = S.l1; for (const [ox, oy] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) x.fillRect(round(bx + c2 * 2) + ox, round(by + s2 * 2) + oy, 1, 1); }
  else if (S.end === 'blade') { seg(x, bx, by, bx + c2 * 5, by + s2 * 5, 2, S.l1); x.fillStyle = S.head || S.l2; x.fillRect(round(bx + c2 * 5) - 1, round(by + s2 * 5) - 1, 2, 2); }
  else { seg(x, bx, by, bx + c2 * 6, by + s2 * 6, 2, S.st); x.fillStyle = S.cap; x.fillRect(round(bx + c2 * 6) - 1, round(by + s2 * 6) - 1, 2, 2); }
}

// ---------------- parallax backdrops: every region, the Drift, the Underdark, the Deep ----------------
const BGL = {};
function genBg(kind) {
  const W = 640, H = 200; const [c, x] = mk(W, H), [hc, hx] = mk(W, H); const em = [], R = mulberry32(kind.length * 977 + kind.charCodeAt(0) * 31 + kind.charCodeAt(2));
  const pn = (X, f, s, o = 3) => fbm(cos(X / W * TAU) * f + s, sin(X / W * TAU) * f + s * 1.7, o);
  x.fillStyle = '#1d1433'; const col = (X, top, bot = H) => { if (bot > top) x.fillRect(X, round(top), 1, round(bot - top)); };
  const spike = (X0, w, ht, base, hi) => { for (let i = 0; i < w; i++) { const t = abs(i - w / 2) / (w / 2), top = base - ht * (1 - t); col(round(X0 + i) % W, top, base + 2); if (hi && i < w / 2) { hx.fillStyle = hi; hx.fillRect(round(X0 + i) % W, round(top), 1, 2); } } };
  const stalk = (X, ht, base, fr, pod) => { for (let y = 0; y < ht; y++) x.fillRect(X, base - y, 2, 1); for (let k = -fr; k <= fr; k++) { if (!k) continue; let px = X, py = base - ht; for (let i = 0; i < 9; i++) { px += sign(k) * (1 + abs(k) * .3); py += i < 4 ? -1 : 1; x.fillRect(round(px), round(py), 1, 1); } if (pod) em.push([round(px), round(py) + 1, R() < .7 ? '#ffb347' : '#4fd8c8']); } };
  switch (kind) {
    case 'far': for (let X = 0; X < W; X++) { const r = 16 + pn(X, 2, 9, 3) * 34; col(X, H - r); } { let X = R() * 40; while (X < W - 30) { const n = 3 + (R() * 7 | 0), H0 = 44 + R() * 84; for (let k = 0; k < n; k++) { const t = abs(k - (n - 1) / 2) / ((n - 1) / 2 + .01), ch = round(H0 * (1 - t * t * .6) + R() * 8), cx2 = round(X + k * 3.5); x.fillRect(cx2, H - ch, 3, ch); } X += n * 3.5 + 26 + R() * 100; } } break;
    case 'reach_far': for (let X = 0; X < W; X++) { const r = max(0, 1 - abs(pn(X, 2.2, 11, 3) - .5) * 3.4), top = H - 30 - pow(r, 1.5) * 128 - pn(X, 9, 4, 2) * 10; col(X, top); if (r > .55) { hx.fillStyle = '#ffffff'; hx.fillRect(X, round(top), 1, round(2 + pow(r, 2) * 14 * (.6 + .4 * hh(X >> 1, 3, 5)))); hx.fillStyle = '#b4e6e8'; hx.fillRect(X, round(top) + round(2 + pow(r, 2) * 14), 1, 2); } } break;
    case 'reach_mid': for (let X = 0; X < W; X++) col(X, H - 22 - pn(X, 3, 21) * 26); { let X = 6; while (X < W - 10) { if (R() < .55) spike(X, 6 + R() * 10, 30 + R() * 90, H - 24, '#dcf7f5'); else stalk(round(X), 30 + R() * 60, H - 24, 3, false); X += 14 + R() * 34; } } break;
    case 'moor_far': for (let X = 0; X < W; X++) { const top = H - 36 - pn(X, 2, 3) * 64; col(X, top); hx.fillStyle = '#ffa07c'; hx.fillRect(X, round(top), 1, 1); } for (let k = 0; k < 3; k++) { const ax = 80 + k * 210 + R() * 60, ar = 18 + R() * 14, ay = H - 60 - pn(ax, 2, 3) * 50; for (let a = PI; a < TAU; a += .02) { if (a > 4.1 && a < 4.5) continue; x.fillRect(round(ax + cos(a) * ar), round(ay + sin(a) * ar), 3, 3); } } break;
    case 'moor_mid': for (let X = 0; X < W; X++) col(X, H - 20 - pn(X, 3, 31) * 22); { let X = 4; while (X < W - 6) { stalk(round(X), 40 + R() * 80, H - 22, 2, true); X += 12 + R() * 28; } } break;
    case 'ash_far': for (let X = 0; X < W; X++) { const t = (X % 320) / 320, rim = exp(-pow((abs(t - .5) - .3) / .07, 2)) * 34; col(X, H - 30 - rim - pn(X, 2, 41) * 16); } for (let k = 0; k < 4; k++) { const sx = R() * W, sw = 10 + R() * 14; for (let y = 0; y < 150; y += 3) { const wv = sin(y * .05 + k) * 8 + y * .12; hx.fillStyle = 'rgba(214,208,220,.35)'; hx.fillRect(round(sx + wv - sw / 2 * (1 + y / 150)), H - 40 - y, round(sw * (1 + y / 150)), 3); } } break;
    case 'ash_mid': for (let X = 0; X < W; X++) col(X, H - 18 - pn(X, 3, 51) * 14); { let X = 10; while (X < W - 10) { if (R() < .4) { const pw = 5 + (R() * 5 | 0), ph = 20 + R() * 50; x.fillRect(round(X), H - 18 - ph, pw, ph); x.clearRect(round(X) + (R() * pw | 0), H - 18 - ph, 2, 3 + (R() * 6 | 0)); } else { const ht = 30 + R() * 50; for (let y = 0; y < ht; y++) x.fillRect(round(X), H - 18 - y, 2, 1); for (let b = 0; b < 3; b++) { let bx = X, by = H - 18 - ht * (.5 + b * .18), d = R() < .5 ? -1 : 1; for (let i = 0; i < 10; i++) { bx += d; by -= .6; x.fillRect(round(bx), round(by), 1, 1); } } } X += 20 + R() * 40; } } break;
    case 'rust_far': for (let X = 0; X < W; X++) { const n = pn(X, 3, 61, 3), top = H - 30 - round((max(0, n - .32) * 210) / 14) * 14; col(X, top); for (let y = top + 6; y < H; y += 7) { hx.fillStyle = 'rgba(214,118,69,.5)'; hx.fillRect(X, round(y), 1, 1); } hx.fillStyle = '#f0b070'; hx.fillRect(X, round(top), 1, 1); } break;
    case 'rust_mid': for (let X = 0; X < W; X++) col(X, H - 18 - pn(X, 3, 71) * 18); { let X = 8; while (X < W - 20) { const ht = 30 + R() * 70, dir = R() < .5 ? 1 : -1; for (let y = 0; y < ht; y++) x.fillRect(round(X), H - 18 - y, 2, 1); let hx2 = X, hy2 = H - 18 - ht; for (let i = 0; i < 10; i++) { x.fillRect(round(hx2), round(hy2), 2, 2); hx2 += dir; if (i > 5) hy2++; } for (let i = 0; i < 5; i++) x.fillRect(round(hx2), round(hy2 + 1 + i), 1, 1); em.push([round(hx2), round(hy2 + 6), '#e2542b']); X += 26 + R() * 50; } } break;
    case 'cave_far': for (let X = 0; X < W; X++) { col(X, 0, 12 + pn(X, 4, 81) * 30); col(X, H - 10 - pn(X, 4, 83) * 34); } for (let k = 0; k < 26; k++) { const sx = R() * W, ln = 14 + R() * 50, w = 4 + R() * 8; for (let y = 0; y < ln; y++) { const hw = w / 2 * (1 - y / ln); x.fillRect(round(sx - hw), 20 + y, max(1, round(hw * 2)), 1); } } for (let k = 0; k < 20; k++) { const sx = R() * W, ln = 10 + R() * 40, w = 4 + R() * 9; for (let y = 0; y < ln; y++) { const hw = w / 2 * (1 - y / ln); x.fillRect(round(sx - hw), H - 30 - y, max(1, round(hw * 2)), 1); } } break;
    case 'cave_mid': for (let k = 0; k < 9; k++) { const sx = R() * W, w = 8 + R() * 16; for (let y = 0; y < H; y++) { const hw = w / 2 * (.55 + .45 * abs(sin(y / H * PI * (1 + k % 2)))); x.fillRect(round(sx - hw), y, round(hw * 2), 1); } } for (let k = 0; k < 40; k++) em.push([R() * W | 0, R() * H | 0, R() < .7 ? '#4fd8c8' : '#c58cf2']); break;
    case 'deep_far': for (let X = 0; X < W; X++) { col(X, 0, 20 + pn(X, 4, 91) * 40); col(X, H - 16 - pn(X, 5, 93) * 46); } for (let k = 0; k < 18; k++) { let vx = R() * W, vy = 30 + R() * 120; for (let i = 0; i < 30; i++) { em.push([round(vx), round(vy), i % 3 ? '#e2542b' : '#ff9a3d']); vx += R() * 2 - .5; vy += R() * 2 - 1; } } break;
    case 'clouds': for (let k = 0; k < 40; k++) { const cx2 = R() * W, cy2 = 120 + R() * 50, r = 10 + R() * 22; for (let y = -r; y < r; y++) { const hw = sqrt(r * r - y * y) * 1.8; hx.fillStyle = y < -r * .3 ? '#ffffff' : y < r * .2 ? '#dcd4ee' : '#a99cc8'; hx.fillRect(round(cx2 - hw), round(cy2 + y * .7), round(hw * 2), 1); hx.fillRect(round(cx2 - hw) - W, round(cy2 + y * .7), round(hw * 2), 1); hx.fillRect(round(cx2 - hw) + W, round(cy2 + y * .7), round(hw * 2), 1); } } hx.fillStyle = '#a99cc8'; hx.fillRect(0, 150, W, 50); break;
  }
  return { cv: c, hi: hc, em };
}
function buildBackdrops() {
  const keep = SEED; SEED = 7331;
  for (const k of ['far', 'reach_far', 'reach_mid', 'moor_far', 'moor_mid', 'ash_far', 'ash_mid', 'rust_far', 'rust_mid', 'cave_far', 'cave_mid', 'deep_far', 'clouds']) BGL[k] = genBg(k);
  SEED = keep;
}
function buildSprites2() { buildProps(); buildFoliage(); buildFolk(); buildArms(); buildBackdrops(); }
