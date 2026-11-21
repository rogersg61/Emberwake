// ============================================================
//  The armoury: weapon types times materials. Every type rides one of the
//  six movesets (blade, pike, fangs, maul, bow, chain), so all twenty-odd
//  forms work with each of them; the type changes reach, weight and speed,
//  and the material changes damage and adds a trait (bleed, frost, poison,
//  burn, lifesteal, crits).
// ============================================================
const WMAT = {
  wood: { n: 'Stalkwood', base: 6, w: '#a07a50', b: '#7a5a40', B: '#5a4030', g: '#5a4030', h: '#8a6a48', x: '#c9a44a' },
  flint: { n: 'Flint', base: 7, w: '#c9c2d6', b: '#8a8296', B: '#5a5468', g: '#7a5a40', h: '#8a6a48', x: '#c9a44a', bleed: .3, t: 'Flint edges open wounds that bleed.' },
  bone: { n: 'Bone', base: 7, w: '#ffffff', b: '#e6dccc', B: '#b8a890', g: '#8a7a68', h: '#6b4a2f', x: '#c94a4e', bleed: .2, t: 'Jagged: some blows leave foes bleeding.' },
  stone: { n: 'Rock', base: 7, w: '#8a94a4', b: '#6f7a8a', B: '#4a5464', g: '#5a4030', h: '#8a6a48', x: '#4a5464' },
  copper: { n: 'Sunmetal', base: 9, w: '#fff1a8', b: '#ffd35a', B: '#c98a2b', g: '#c98a2b', h: '#5c8290', x: '#ffd35a' },
  bronze: { n: 'Sunbronze', base: 11, w: '#ffe0a0', b: '#f0b060', B: '#a8702e', g: '#6a4418', h: '#5c8290', x: '#ffd35a' },
  rust: { n: 'Rustplate', base: 12, w: '#f0a070', b: '#bd5a36', B: '#7a3222', g: '#5a2018', h: '#5a4030', x: '#ffd3a0', stag: 1, t: 'Heavy plates: blows stagger longer.' },
  chitin: { n: 'Chitin', base: 12, w: '#c9a0e0', b: '#8a6a9a', B: '#4a3a5a', g: '#2a1e36', h: '#3a2a20', x: '#9a5ad0', poison: 1, t: 'Venom-lined: every blow poisons.' },
  iron: { n: 'Hollow Iron', base: 13, w: '#efe8ff', b: '#cfc3ee', B: '#8f7fc0', g: '#5a4a8a', h: '#365058', x: '#cfc3ee' },
  steel: { n: 'Nightsteel', base: 16, w: '#ffffff', b: '#c5ccd8', B: '#8a94a4', g: '#4a5464', h: '#22343f', x: '#8ff5e6', crit: .1, t: 'Keen: more blows land as critical hits.' },
  glass: { n: 'Skyglass', base: 16, w: '#ffffff', b: '#c9fff6', B: '#6fb9c9', g: '#dcf7f5', h: '#8f88a0', x: '#ffffff', frost: 1, cold: true, t: 'Cold: blows slow foes to a crawl.' },
  deep: { n: 'Hollowdeep', base: 18, w: '#e0a0a0', b: '#8a3a44', B: '#4a1e26', g: '#2a0e14', h: '#3a2a20', x: '#ff7a5a', steal: .08, t: 'Hungry: blows give some health back.' },
  ember: { n: 'Embersteel', base: 20, w: '#fff1a8', b: '#ffb347', B: '#e2542b', g: '#7a2a14', h: '#3a2a20', x: '#ffd35a', burn: 1, glow: true, t: 'Blows set foes alight.' }
};
const WTYPE = {
  shortsword: { set: 'sword', n: 'Shortsword', k: .85, len: 12, sp: .85, sz: 2, grip: [2, 2], rows: ['...g...........', '...gbbbbbbbbb..', 'phhgwwwwwwwwwwb', '...gBBBBBBBBB..', '...g...........'], d: 'Short and quick. Recovers fast.' },
  sword: { set: 'sword', n: 'Sword', k: 1, len: 15, sp: 1, sz: 3, grip: [2, 2], rows: ['....g..............', '....gbbbbbbbbbbbbb.', 'phhhgwwwwwwwwwwwwwb', '....gBBBBBBBBBBBBB.', '....g..............'], d: 'Balanced in every form.' },
  sabre: { set: 'sword', n: 'Sabre', k: .95, len: 15, sp: .9, sz: 3, grip: [2, 2], crit: .08, rows: ['....g..............', '....gbbbbbbbbbbbb..', 'phhhgwwwwwwwwwwwwbb', '....gBBBBBBBBBBBbb.', '....g...........b..'], d: 'Curved and keen: more critical hits.' },
  longsword: { set: 'sword', n: 'Longsword', k: 1.15, len: 18, sp: 1.1, sz: 4, grip: [2, 2], rows: ['.....g.................', '.....gbbbbbbbbbbbbbbbb.', 'phhhhgwwwwwwwwwwwwwwwwb', '.....gBBBBBBBBBBBBBBBB.', '.....g.................'], d: 'Long reach, a little slower.' },
  greatsword: { set: 'sword', n: 'Greatsword', k: 1.4, len: 21, sp: 1.3, sz: 5, grip: [3, 3], rows: ['......g....................', '......gbbbbbbbbbbbbbbbbbbb.', '......gwwwwwwwwwwwwwwwwwwwb', 'phhhhhgwwwwwwwwwwwwwwwwwwwb', '......gBBBBBBBBBBBBBBBBBBBb', '......gBBBBBBBBBBBBBBBBBBB.', '......g....................'], d: 'Enormous. Every swing is a commitment.' },
  cleaver: { set: 'sword', n: 'Cleaver', k: 1.1, len: 13, sp: 1.05, sz: 3, grip: [2, 2], bleed: .35, rows: ['...gbbbbbbbbb.', '...gwwwwwwwwwb', 'phhgwwwwwwwwwb', '...gBBBBBBBBBB', '...gBBBBBBBBB.'], d: 'A butcher\'s blade. Leaves foes bleeding.' },
  spear: { set: 'spear', n: 'Spear', k: .92, len: 22, sp: 1, sz: 3, grip: [8, 2], rows: ['.'.repeat(25) + 'bb', '.'.repeat(24) + 'bwwbb', 'h'.repeat(23) + 'xwwwwwwb', '.'.repeat(24) + 'bBBbb', '.'.repeat(25) + 'bb'], d: 'Reach and thrusts.' },
  glaive: { set: 'spear', n: 'Glaive', k: 1.05, len: 22, sp: 1.1, sz: 4, grip: [8, 2], rows: ['.'.repeat(20) + 'bbbbbb..', '.'.repeat(19) + 'bwwwwwwbb', 'h'.repeat(19) + 'xwwwwwwwwwb', '.'.repeat(19) + 'bBBBBBBBb', '.'.repeat(20) + 'bbbbb'], d: 'A long blade on a pole. Sweeps hit harder.' },
  trident: { set: 'spear', n: 'Trident', k: .95, len: 21, sp: 1, sz: 4, grip: [8, 2], rows: ['.'.repeat(22) + 'bbbbb', '.'.repeat(22) + 'b', 'h'.repeat(21) + 'xbwwwwb', '.'.repeat(22) + 'b', '.'.repeat(22) + 'bbbbb'], d: 'Three points. Hard to slip.' },
  halberd: { set: 'spear', n: 'Halberd', k: 1.25, len: 24, sp: 1.25, sz: 5, grip: [9, 2], rows: ['.'.repeat(26) + 'bbb', '.'.repeat(26) + 'bwwb', 'h'.repeat(26) + 'xwwwwwb', '.'.repeat(26) + 'bwwb', '.'.repeat(26) + 'bwwwb', '.'.repeat(27) + 'bbb'], d: 'Axe, spike and pole. Slow, brutal reach.' },
  daggers: { set: 'fangs', n: 'Daggers', k: .62, len: 9, sp: .9, sz: 2, grip: [2, 2], dual: true, rows: ['..g........', '..gbbbbbbb.', 'hhgwwwwwwwb', '..gBBBBBB..', '..g........'], d: 'A blade in each hand.' },
  kama: { set: 'fangs', n: 'Kama', k: .7, len: 9, sp: .95, sz: 2, grip: [1, 2], dual: true, bleed: .3, rows: ['.......bb.', '........wb', 'hhhhhhg.wb', '......gwb.', '.......b..'], d: 'Paired sickles. Hooking cuts that bleed.' },
  claws: { set: 'fangs', n: 'Claws', k: .58, len: 7, sp: .82, sz: 2, grip: [1, 2], dual: true, rows: ['..wwwww.', '.hbbbbbb', '.hwwwwww', '.hbbbbbb', '..wwwww.'], d: 'Fastest of all. Close, closer, gone.' },
  sai: { set: 'fangs', n: 'Sai', k: .65, len: 9, sp: .9, sz: 2, grip: [2, 2], dual: true, rows: ['...g.......', '..gg.......', 'hhhgwwwwwwb', '..gg.......', '...g.......'], d: 'Pronged. Catches blades.' },
  club: { set: 'maul', n: 'Club', k: 1.35, len: 15, sp: 1, sz: 3, grip: [2, 2], rows: ['..........bbbb..', '.........bwwwwb.', 'hhhhhhhhhbwwwwwb', '.........bBBBBb.', '..........bbbb..'], d: 'A heavy end on a stick.' },
  mace: { set: 'maul', n: 'Mace', k: 1.6, len: 15, sp: 1.05, sz: 3, grip: [2, 2], rows: ['............b.b.b.', '............bwbwb.', 'hhhhhhhhhhhhbwwwwb', '............bBbBb.', '............b.b.b.'], d: 'Flanged. Breaks guards.' },
  warhammer: { set: 'maul', n: 'Warhammer', k: 1.8, len: 17, sp: 1.15, sz: 4, grip: [3, 4], stag: 1, rows: ['..............bbbbbb', '..............bwwwwb', '..............bwBwwb', 'hhhhhhhhhhhhhhbwwwwb', 'phhhhhhhhhhhhhbwwBwb', '..............bwwwwb', '..............bwBwwb', '..............bwwwwb', '..............bbbbbb'], d: 'Staggers whatever it meets.' },
  battleaxe: { set: 'maul', n: 'Battleaxe', k: 1.7, len: 16, sp: 1.1, sz: 4, grip: [2, 4], bleed: .3, rows: ['.............bb...', '............bwwb..', '............bwwwb.', '............bwwwwb', 'hhhhhhhhhhhhxwwwwb', '............bwwwwb', '............bwwwb.', '............bwwb..', '.............bb...'], d: 'Bites deep. Wounds bleed.' },
  greataxe: { set: 'maul', n: 'Greataxe', k: 2, len: 19, sp: 1.25, sz: 5, grip: [3, 5], rows: ['...............bb.....', '..............bwwb....', '.............bwwwwb...', '.............bwwwwwb..', '.............bwwwwwwb.', 'hhhhhhhhhhhhhxwwwwwwwb', '.............bwwwwwwb.', '.............bwwwwwb..', '.............bwwwwb...', '..............bwwb....', '...............bb.....'], d: 'Two great crescents. Nothing stands.' },
  shortbow: { set: 'bow', n: 'Shortbow', k: .75, len: 9, sp: .85, sz: 2, bow: 17, d: 'Quick to draw. Needs arrows.' },
  recurve: { set: 'bow', n: 'Recurve', k: .88, len: 9, sp: 1, sz: 3, bow: 21, curl: 1, d: 'Horn and glue. Hits hard. Needs arrows.' },
  longbow: { set: 'bow', n: 'Longbow', k: 1.02, len: 9, sp: 1.15, sz: 4, bow: 25, d: 'Long, slow, deadly. Needs arrows.' },
  nunchaku: { set: 'chuks', n: 'Nunchaku', k: .75, len: 12, sp: 1, sz: 3, nun: 'stick', d: 'Two sticks and a chain.' },
  flail: { set: 'chuks', n: 'Flail', k: .95, len: 12, sp: 1.15, sz: 3, nun: 'ball', d: 'A spiked head on a chain. Heavy snaps.' },
  chainwhip: { set: 'chuks', n: 'Chain Whip', k: .7, len: 13, sp: .95, sz: 3, nun: 'blade', d: 'A blade on a long chain. Quick, cutting.' }
};
const WLIST = [['shortsword', 'copper'], ['shortsword', 'bronze'], ['shortsword', 'iron'], ['sword', 'bronze'], ['sword', 'iron'], ['sword', 'steel'], ['sword', 'ember'], ['sabre', 'iron'], ['sabre', 'glass'],
  ['longsword', 'steel'], ['longsword', 'ember'], ['greatsword', 'steel'], ['greatsword', 'deep'], ['cleaver', 'bone'], ['cleaver', 'iron'],
  ['spear', 'flint'], ['spear', 'bone'], ['spear', 'copper'], ['spear', 'bronze'], ['spear', 'iron'], ['spear', 'steel'], ['glaive', 'bronze'], ['glaive', 'glass'], ['trident', 'bone'], ['trident', 'iron'], ['halberd', 'steel'], ['halberd', 'ember'],
  ['daggers', 'flint'], ['daggers', 'bone'], ['daggers', 'iron'], ['kama', 'bronze'], ['kama', 'iron'], ['claws', 'bone'], ['claws', 'steel'], ['claws', 'chitin'], ['sai', 'glass'],
  ['club', 'wood'], ['club', 'stone'], ['club', 'bone'], ['mace', 'copper'], ['mace', 'bronze'], ['mace', 'rust'], ['warhammer', 'deep'], ['battleaxe', 'flint'], ['battleaxe', 'bronze'], ['battleaxe', 'iron'], ['greataxe', 'steel'], ['greataxe', 'ember'],
  ['shortbow', 'wood'], ['recurve', 'bone'], ['longbow', 'wood'], ['longbow', 'glass'], ['longbow', 'ember'], ['nunchaku', 'bone'], ['nunchaku', 'steel'], ['flail', 'iron'], ['flail', 'ember'], ['chainwhip', 'glass']];
const NUN0 = { st: '#8a6a48', cap: '#c9a44a', l1: '#e8edf2', l2: '#7f8898', end: 'stick', n: 3 };
function bowSpr(h, M, curl) {
  const w = 9; const [c, x] = mk(w, h);
  for (let y = 0; y < h; y++) { const t = y / (h - 1), lx = round(1 + 6 * sin(PI * t)), mid = abs(y - (h >> 1)) <= 1; x.fillStyle = mid ? M.g : M.b; x.fillRect(lx, y, 1, 1); if (y > 1 && y < h - 2) { x.fillStyle = mid ? M.h : M.B; x.fillRect(lx + 1, y, 1, 1); } }
  x.fillStyle = M.w; x.fillRect(1, 0, 1, 1); x.fillRect(1, h - 1, 1, 1); if (curl) { x.fillRect(0, 1, 1, 1); x.fillRect(0, h - 2, 1, 1); }
  return c;
}
function nunIcon(st) { const [c, x] = mk(16, 16); drawNun(x, 4, 12, -PI / 3, -PI / 8, st); return outlined(c); }
function buildWeapons() {
  const sizeBars = [0, 1, 2, 3, 4, 5], bar = { copper: 'copper_bar', bronze: 'bronze_bar', iron: 'iron_bar', steel: 'steel_bar', ember: 'ember_bar', glass: 'skyglass' };
  const legacy = { 'spear:wood': 'spear', 'daggers:copper': 'fangs', 'warhammer:iron': 'maul' };
  for (const [ty, mt] of WLIST) {
    const T0 = WTYPE[ty], M = WMAT[mt], id = `${mt}_${ty}`, dmg = round(M.base * T0.k);
    let held = null, grip = [0, 0], nun = null;
    if (T0.rows) { const pal = { h: M.h, p: M.g, g: M.g, w: M.w, b: M.b, B: M.B, x: M.x }; held = spr(T0.rows, pal); grip = T0.grip; }
    else if (T0.bow) { held = bowSpr(T0.bow, M, T0.curl); grip = [7, T0.bow >> 1]; }
    else nun = { st: mt === 'bone' ? '#e6dccc' : M.h, cap: M.x, l1: M.w, l2: M.B, end: T0.nun, n: T0.nun === 'blade' ? 5 : T0.nun === 'ball' ? 4 : 3, head: M.b };
    const o = { name: `${M.n} ${T0.n}`, type: 'weapon', set: T0.set, dmg, len: T0.len, wsp: T0.sp, stack: 1, held, grip, dual: !!T0.dual, desc: [T0.d, M.t].filter(Boolean).join(' '), tier: mt, wtype: ty };
    for (const k of ['bleed', 'poison', 'frost', 'burn', 'steal', 'glow', 'cold', 'stag']) if (M[k] || T0[k]) o[k] = max(M[k] || 0, T0[k] || 0) || M[k] || T0[k];
    o.crit = (M.crit || 0) + (T0.crit || 0);
    if (T0.set === 'bow') o.ammo = true;
    if (nun) { o.chuks = true; o.nun = nun; }
    defI(id, o); IT[id].icon = nun ? nunIcon(nun) : rotIcon(held);
    // where and from what it is made
    const n = sizeBars[T0.sz], hd = T0.sz >= 4 ? { leather: 1 } : { stick: 1 };
    let r = null;
    if (NEWMATS.includes(mt)) r = null;
    else if (bar[mt] && T0.set !== 'bow' && T0.set !== 'chuks') r = R('anvil', id, 1, Object.assign({ [bar[mt]]: n }, T0.set === 'spear' ? { stick: 2 } : hd), { lvl: ['iron', 'steel', 'ember', 'glass'].includes(mt) ? 2 : 1, q: 1 });
    else if (mt === 'flint') r = R('hand', id, 1, ty === 'spear' ? { spearhead: 1, stick: 2, twine: 1 } : ty === 'daggers' ? { knifeblade: 2, stick: 1, twine: 2 } : { axehead: 2, stick: 2, twine: 2 });
    else if (mt === 'bone') r = R('bench', id, 1, ty === 'cleaver' ? { bone: 4, stick: 1, twine: 1 } : ty === 'spear' ? { bone: 2, stick: 2, twine: 1 } : ty === 'trident' ? { bone: 4, stick: 2, twine: 2 } : ty === 'daggers' ? { bone: 2, twine: 2 } : ty === 'claws' ? { bone: 3, leather: 1 } : ty === 'club' ? { bone: 3, twine: 1 } : ty === 'recurve' ? { plank: 1, bone: 2, glue: 1, twine: 2 } : { bone: 2, rope: 1 });
    else if (mt === 'stone') r = R('hand', id, 1, { stick: 1, rock: 2, twine: 1 });
    else if (mt === 'wood') r = R('bench', id, 1, ty === 'club' ? { log: 1 } : ty === 'shortbow' ? { stick: 2, log: 1, twine: 2 } : { log: 2, twine: 2, resin: 1 });
    else if (mt === 'rust') r = R('anvil', id, 1, { rust_plate: 3, stick: 1 }, { lvl: 1, q: 1 });
    else if (mt === 'chitin') r = R('bench', id, 1, { chitin: 3, venom: 1, leather: 1 });
    else if (mt === 'deep') r = R('mason', id, 1, ty === 'greatsword' ? { deepstone: 5, hollow_ash: 2, leather: 1 } : { deepstone: 4, hollow_ash: 1, plank: 1 });
    else if (T0.set === 'bow') r = R('anvil', id, 1, mt === 'glass' ? { skyglass: 3, plank: 1, rope: 1 } : { ember_bar: 2, plank: 1, rope: 1 }, { lvl: 2, q: 1 });
    else if (T0.set === 'chuks') r = R('anvil', id, 1, ty === 'chainwhip' ? { chain: 2, skyglass: 1 } : ty === 'flail' ? { chain: 1, [bar[mt]]: 2, stick: 1 } : { chain: 1, [bar[mt]]: 1, stick: 2 }, { lvl: 2, q: 1 });
    if (r && legacy[ty + ':' + mt]) { r.out = legacy[ty + ':' + mt]; delete IT[id]; }
  }
  // the old weapons get recipes of their own and their trait flags
  IT.spear.desc = 'Fire-hardened stalkwood. Long reach. Thrusts, vaults and sweeps.'; IT.fangs.desc = 'Sunmetal twin blades. Fast, close, relentless.'; IT.maul.desc = 'Hollow iron, slow and enormous. Heavy forms shrug off blows.';
  R('bench', 'spear', 1, { stick: 3, twine: 1, log: 1 }); R('bench', 'bow', 1, { log: 2, twine: 2, cinder: 3 }); R('bench', 'nunchaku', 1, { stick: 2, chain: 1 }); R('anvil', 'fangs', 1, { copper_bar: 2, stick: 1 }, { lvl: 1, q: 1 }); R('anvil', 'maul', 1, { iron_bar: 4, leather: 1 }, { lvl: 2, q: 1 });
  for (const id of ['vpike', 'vfangs']) { IT[id].frost = 1; IT[id].icon = rotIcon(IT[id].held); } IT.kmaul.burn = 1; IT.kblade.burn = 1;
  defI('fists', { name: 'Bare Hands', type: 'weapon', set: 'brawl', dmg: 5, len: 4, held: null, grip: [0, 0], dual: false, stack: 1, fist: true, desc: 'Jab, cross, hook, uppercut. Click a creature to punch it, whatever you hold.', icon: null });
}
