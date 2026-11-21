// ============================================================
//  Things to place, and what they do once they stand somewhere.
//    storage: crate (10), barrel (20), strongbox (30)
//    bed: you wake there; sleep through the night and wake rested
//         (a table, a chair and a light nearby make it cosy: rest lasts longer)
//    planter: grows berries, reeds, mushrooms, glowcaps or fibre
//    signpost: shows on your map      weapon rack: holds a weapon for show
//    lamp post, candles, chandelier: light     brazier: light and warmth
//    spike trap, snare: hurt or hold what walks over them
//    ember ballista: shoots what comes close     warning bell: rings when something does
//    beehive: makes honey near flowers     fountain: fills jugs, heals you while you rest by it
//    and furniture that is just for a home: table, chair, bookshelf, rug, banner,
//    fence, statue, flower pot, stained glass, polished stone, mosaic, roof tiles.
//  Traps, the ballista and the bell are worked by whoever hosts the world.
// ============================================================
const CRATE = 136, BARREL = 137, STRONGBOX = 138, BED = 139, PLANTER = 140, SIGNPOST = 141, WRACK = 142, TABLE = 143, CHAIR = 144, BOOKSHELF = 145,
  LAMPPOST = 146, CANDLES = 147, CHANDELIER = 148, BRAZIER = 149, SPIKETRAP = 150, SNARE = 151, BALLISTA = 152, BELL = 153, BEEHIVE = 154, RUG = 155,
  BANNER = 156, FENCE = 157, STATUE = 158, FOUNTAIN = 159, FLOWERPOT = 160,
  STAINED_R = 161, STAINED_B = 162, POLISHED = 163, MOSAIC = 164, ROOFTILE = 165, MOSSBRICK = 166;
const STORE_N = { [CHEST]: 20, [CRATE]: 10, [BARREL]: 20, [STRONGBOX]: 30 };
// what of a station's state is saved and shared with friends
const STN_KEYS = ['fuel', 'temp', 'open', 'q', 'name', 'looted', 'crop', 'grow', 'honey', 'face'];
// tile, item id, name, what it is made of (wood or stone), tile properties, what the item says
const FURN = [
  [CRATE, 'crate', 'Crate', 'wood', {}, 'Holds 10 stacks.'],
  [BARREL, 'barrel', 'Barrel', 'wood', {}, 'Holds 20 stacks.'],
  [STRONGBOX, 'strongbox', 'Strongbox', 'stone', { dust: '#5a6474' }, 'Holds 30 stacks.'],
  [BED, 'bed', 'Bed', 'wood', { dust: '#c94a4e' }, 'You wake here after a fall. [F] to sleep: through the night, and you wake rested (you heal for a while). A table, a chair and a light nearby make it cosy.'],
  [PLANTER, 'planter', 'Planter Box', 'wood', {}, '[F] to plant berries, reeds, mushrooms, glowcaps or fibre from your pack. Come back when it is ripe.'],
  [SIGNPOST, 'signpost', 'Signpost', 'wood', {}, 'Shows on your map, so you can find your way back.'],
  [WRACK, 'weapon_rack', 'Weapon Rack', 'wood', {}, '[F] while holding a weapon to hang it up; [F] again to take it down.'],
  [TABLE, 'table', 'Table', 'wood', {}, 'A table. Part of a cosy home.'],
  [CHAIR, 'chair', 'Chair', 'wood', {}, 'A chair. Part of a cosy home.'],
  [BOOKSHELF, 'bookshelf', 'Bookshelf', 'wood', {}, '[F] to read something useful.'],
  [LAMPPOST, 'lamppost', 'Lamp Post', 'wood', { light: [.95, .72, .4] }, 'A tall warm light.'],
  [CANDLES, 'candles', 'Candles', 'wood', { light: [.6, .44, .24], hard: 2 }, 'A small warm light.'],
  [CHANDELIER, 'chandelier', 'Chandelier', 'stone', { light: [.98, .8, .5], ground: false, hang: true }, 'Hangs from a ceiling or a beam. A wide light.'],
  [BRAZIER, 'brazier', 'Brazier', 'stone', { light: [1, .56, .22] }, 'Fire in a bowl. Light, and warmth: the cold cannot reach you beside it.'],
  [SPIKETRAP, 'spike_trap', 'Spike Trap', 'stone', { hard: 6, dust: '#8a94a4' }, 'Creatures that walk over it are hurt. Yours never cut you.'],
  [SNARE, 'snare', 'Snare', 'wood', { hard: 3 }, 'Holds the next creature that steps in it. Sets itself again after a while.'],
  [BALLISTA, 'ballista', 'Ember Ballista', 'stone', { dust: '#8a94a4' }, 'Shoots bolts at creatures that come close. It never runs out.'],
  [BELL, 'warning_bell', 'Warning Bell', 'wood', {}, 'Rings when a creature comes close, so nothing creeps up on your home.'],
  [BEEHIVE, 'beehive', 'Beehive', 'wood', { dust: '#e0b040' }, 'Makes honey, faster with flowers and berry bushes nearby. [F] to take it.'],
  [RUG, 'rug', 'Rug', 'wood', { hard: 2, dust: '#c94a4e' }, 'Lies flat on the floor.'],
  [BANNER, 'banner', 'Banner', 'wood', { ground: false, hang: true, hard: 2, dust: '#c94a4e' }, 'Hangs under a ceiling, a beam or a block.'],
  [FENCE, 'fence', 'Fence', 'wood', {}, 'A low fence. You can walk through it.'],
  [STATUE, 'statue', 'Waker Statue', 'stone', {}, 'Someone, carved in stone.'],
  [FOUNTAIN, 'fountain', 'Fountain', 'stone', { dust: '#8fd0d8' }, 'Rest beside it and you heal. [F] fills your empty jugs.'],
  [FLOWERPOT, 'flowerpot', 'Flower Pot', 'stone', { hard: 2 }, 'A pot of flowers. Bees love it.']
];
for (const [t, id, name, kind, o] of FURN) { defStn(t, name, id, o); defM(t, kind === 'wood' ? { hp: 4, k: 'wood' } : { hp: 7, tier: 1, k: 'stone' }); MAT[t].y = [[id, 1]]; }
Object.assign(STATIONS, { [CRATE]: 'chest', [BARREL]: 'chest', [STRONGBOX]: 'chest' });
// blocks for building, not furniture
defPart(STAINED_R, { name: 'Ember Glass', solid: true, hi: '#ff8a3d', dust: '#c94a2a', drop: 'stained_r', light: [.25, .1, .04] });
defPart(STAINED_B, { name: 'Sky Glass Pane', solid: true, hi: '#8fd0d8', dust: '#4a8a9a', drop: 'stained_b', light: [.06, .14, .2] });
defPart(POLISHED, { name: 'Polished Stone', solid: true, full: true, hi: '#e6e0f0', dust: '#8a8496', drop: 'polished' });
defPart(MOSAIC, { name: 'Mosaic Tiles', solid: true, full: true, hi: '#ffd35a', dust: '#8a8496', drop: 'mosaic' });
defPart(ROOFTILE, { name: 'Roof Tiles', solid: true, full: true, hi: '#e8a080', dust: '#8a4430', drop: 'rooftile' });
defPart(MOSSBRICK, { name: 'Mossy Brick', solid: true, full: true, hi: '#8ab070', dust: '#5a7a42', drop: 'mossbrick' });
defM([STAINED_R, STAINED_B], { hp: 2, k: 'glass' }); defM([POLISHED, MOSAIC, MOSSBRICK], { hp: 7, tier: 1, k: 'stone' }); defM(ROOFTILE, { hp: 5, k: 'clay' });
for (const t of [STAINED_R, STAINED_B, POLISHED, MOSAIC, ROOFTILE, MOSSBRICK]) MAT[t].y = [[TP[t].drop, 1]];
// what a planter grows: seed, how many come back, how long (ticks), likes the dark
const CROPS = { berries: { n: 5, t: 6000, col: '#ff6a4a' }, reed: { n: 5, t: 5400, col: '#e0c070' }, fiber: { n: 6, t: 4200, col: '#6fae7a' }, fungus: { n: 4, t: 6000, dark: 1, col: '#c9b4d8' }, glowcap: { n: 3, t: 7200, dark: 1, col: '#6ff0c0' } };
const BOOKS = ['Every guardian wants an offering. The Offering Altar makes them, from what you gather and what the last guardian left.', 'The recipe book [B] lists every bench, and what it makes.',
  'Trinkets go in the trinket slots in your pack. Each guardian you beat opens another.', 'A sweep knocks a foe down. A heavy blow on a foe that is down CRUSHES it.',
  'A perfect dodge opens a counter: attack straight after, aiming up, down or with a heavy blow.', 'Hot meals from the Hearth Oven give a boon. Only one at a time: the last one eaten counts.',
  'Metal armour is made at the Armourer\'s Stand, with an anvil of its rank close by.', 'Weapons teach you more of their forms the more you use them: BASICS, FOOTWORK, FLOW, MASTERY.',
  'A long run of light blows sets up a heavy one: RHYTHM.', 'Strong weapons hide arts: keep hitting with one and it will teach you. Hold RMB to call them.'];

function buildFurnArt() {
  for (const [t] of FURN) TEX[t] = TEX[DIRT];
  const S = (id, rows, pal, ox, oy) => { STN_SPR[id] = { img: spr(rows, pal), ox, oy }; };
  const wood = { a: '#5a4030', b: '#9a7a52', c: '#7a5a40', d: '#3a2a20', e: '#c9a46a' };
  S(CRATE, ['aaaaaaaa', 'abccccba', 'acbccbca', 'accbbcca', 'accbbcca', 'acbccbca', 'abccccba', 'aaaaaaaa'], wood, 0, 0);
  S(BARREL, ['.bbbbbb.', 'bccccccc', 'ffffffff', 'bccccccc', 'bccccccc', 'ffffffff', 'bccccccc', '.aaaaaa.'], Object.assign({ f: '#8f98a8' }, wood), 0, 0);
  S(STRONGBOX, ['.dddddddd.', 'dbaaaaaabd', 'dbbbbbbbbd', 'dggggyyggd', 'dbbbbybbbd', 'dbbbbbbbbd', 'dccccccccd', '.dddddddd.'], { a: '#8a94a4', b: '#5a6474', c: '#3a4250', d: '#1e2230', g: '#cfd6e0', y: '#ffd35a' }, -1, 0);
  S(BED, ['aa..........', 'abeeeffffff.', 'abeeeffffffa', 'accccccccccc', 'ac........ca', 'ad........da'], { a: '#5a4030', b: '#7a5a40', c: '#9a7a52', d: '#3a2a20', e: '#f4efe6', f: '#c94a4e' }, -2, 2);
  S(PLANTER, ['gggggggggg', 'abbbbbbbbc', 'abbbbbbbbc', '.cccccccc.'], { a: '#9a7a52', b: '#7a5a40', c: '#5a4030', g: '#3b2a2e' }, -1, 4);
  S(SIGNPOST, ['.aaaaaa.', 'abbbbbbc', 'abeeeebc', 'abbbbbbc', '.cccccc.', '...dd...', '...dd...', '...dd...', '..dddd..'], { a: '#c9a46a', b: '#9a7a52', c: '#5a4030', d: '#7a5a40', e: '#3a2a20' }, 0, -1);
  S(WRACK, ['a........a', 'aaaaaaaaaa', 'a........a', 'a........a', 'a........a', 'a........a', 'aaaaaaaaaa', 'a........a', 'aa......aa'], { a: '#7a5a40' }, -1, -1);
  S(TABLE, ['aaaaaaaaaa', 'bbbbbbbbbb', '.c......c.', '.c......c.', '.c......c.', '.cc....cc.'], wood, -1, 2);
  S(CHAIR, ['a.....', 'a.....', 'a.....', 'abbbbb', 'acccca', 'a....a', 'a....a'], wood, 1, 1);
  S(BOOKSHELF, ['aaaaaaaaaa', 'aeffgheffa', 'aeffgheffa', 'aaaaaaaaaa', 'afgeehgfea', 'afgeehgfea', 'aaaaaaaaaa', 'aheffegfha', 'aheffegfha', 'aaaaaaaaaa', 'a........a', 'aa......aa'],
    { a: '#5a4030', e: '#c94a4e', f: '#4a8a9a', g: '#ffd35a', h: '#6fae7a' }, -1, -4);
  S(LAMPPOST, ['.aaaa.', 'aeeeea', 'aeffea', 'aeeeea', '.aaaa.', '..bb..', '..bb..', '..bb..', '..bb..', '..bb..', '..bb..', '..bb..', '..bb..', '..bb..', '..bb..', '.bbbb.'],
    { a: '#3a2a20', b: '#5a4030', e: '#ffd35a', f: '#fff1a8' }, 1, -8);
  S(CANDLES, ['.e..e.', '.f.ef.', '.f.ff.', 'aaaaaa'], { a: '#8a6a48', e: '#ffd35a', f: '#f4efe6' }, 1, 4);
  S(CHANDELIER, ['.....a......', '.....a......', '.e..eae..e..', '.f..faf..f..', 'aaaaaaaaaaa.', '..a.....a...'], { a: '#c98a2b', e: '#ffd35a', f: '#f4efe6' }, -2, 0);
  S(BRAZIER, ['........', '........', 'aaaaaaaa', '.abbbba.', '...cc...', '...cc...', '..cccc..', '.cccccc.'], { a: '#8a94a4', b: '#5a6474', c: '#3a4250' }, 0, 0);
  S(SPIKETRAP, ['.a..a..a', '.b..b..b', 'abbabbab', 'cccccccc'], { a: '#e6edf2', b: '#8a94a4', c: '#3a4250' }, 0, 4);
  S(SNARE, ['..aaaa..', '.a....a.', 'bbbbbbbb'], { a: '#c9a44a', b: '#5a4030' }, 0, 5);
  S(BELL, ['aaaaaaaa', 'a......a', 'a..bb..a', 'a.bccb.a', 'a.bccb.a', 'abccccba', 'a.dddd.a', 'a......a', 'a......a', 'aa....aa'], { a: '#7a5a40', b: '#ffd35a', c: '#c98a2b', d: '#7a5418' }, 0, -2);
  S(BEEHIVE, ['..aaaa..', '.abbbba.', 'abbbbbba', 'cccccccc', 'abbbbbba', 'abbddbba', 'cccccccc', '.abbbba.', '..eeee..'], { a: '#ffd35a', b: '#e0b040', c: '#a8702e', d: '#3a2414', e: '#5a4030' }, 0, -1);
  S(RUG, ['aebebebebeba', 'acccccccccca'], { a: '#8a2a2a', b: '#ffd35a', c: '#c94a4e', e: '#e6dccc' }, -2, 6);
  S(BANNER, ['aaaaaa', '.bbbb.', '.bccb.', '.bccb.', '.bbbb.', '.bddb.', '.bddb.', '.bbbb.', '.b..b.'], { a: '#5a4030', b: '#c94a4e', c: '#ffd35a', d: '#8a2a2a' }, 1, 0);
  S(FENCE, ['.a...a..', 'aaaaaaaa', '.a...a..', '.a...a..', 'aaaaaaaa', '.a...a..'], { a: '#9a7a52' }, 0, 2);
  S(STATUE, ['...aa...', '..abba..', '..abba..', '...bb...', '.abbbba.', 'abbbbbba', 'a.bbbb.a', '..bbbb..', '..b..b..', '..b..b..', '.dddddd.', 'dddddddd'], { a: '#e6e0f0', b: '#a19baa', d: '#5f5a69' }, 0, -4);
  S(FOUNTAIN, ['.....ee.....', '.....ee.....', '....eeee....', '.aaaaaaaaaa.', 'abeeeeeeeeba', '.abbbbbbbba.', '...cbbbbc...', '...cbbbbc...', '..dddddddd..'], { a: '#c0bac8', b: '#8a8496', c: '#5f5a69', d: '#3f3a4c', e: '#8fd0d8' }, -2, -1);
  S(FLOWERPOT, ['.e.f..', 'efefe.', '.ggg..', 'aaaaa.', 'abbba.', '.bbb..', '.ccc..'], { a: '#e8a080', b: '#c06a4a', c: '#8a4430', e: '#ff6a4a', f: '#ffd35a', g: '#5aa05a' }, 1, 1);
  STN_SPR[BALLISTA] = { img: spr(['....a.......', '...aba......', 'aaabbbbbbbe.', '...aba......', '....a.......', '....cc......', '...cccc.....', '..cddddc....', '.dddddddd...'], { a: '#7a5a40', b: '#9a7a52', c: '#5a6474', d: '#3a4250', e: '#e6edf2' }), ox: -2, oy: -1 };
  // the blocks
  TEX[STAINED_R] = genTex((px, py, v) => px === 0 || px === 7 || py === 0 || py === 7 ? '#3a2426' : px === 4 || py === 3 ? '#5a2a20' : ['rgba(255,138,61,.7)', 'rgba(226,84,43,.7)', 'rgba(255,211,90,.7)'][(px + py + v) % 3]);
  TEX[STAINED_B] = genTex((px, py, v) => px === 0 || px === 7 || py === 0 || py === 7 ? '#22343f' : px === 3 || py === 4 ? '#2a4a5a' : ['rgba(143,208,216,.6)', 'rgba(98,169,188,.6)', 'rgba(201,255,246,.6)'][(px * 2 + py + v) % 3]);
  TEX[POLISHED] = genTex((px, py, v) => px === 0 || py === 0 ? '#f4efe6' : px === 7 || py === 7 ? '#8a8496' : (px + py + v) % 7 === 0 ? '#ffffff' : '#c9c2d6');
  TEX[MOSAIC] = genTex((px, py, v) => (px % 4 === 0 || py % 4 === 0) ? '#5f5a69' : ['#ffd35a', '#8fd0d8', '#e2483b', '#e6e0f0'][((px >> 2) + (py >> 2) * 2 + v) % 4]);
  TEX[ROOFTILE] = genTex((px, py) => { const row = py >> 1, off = row % 2 ? 2 : 0; return py % 2 === 1 ? '#5a2a1e' : (px + off) % 4 === 0 ? '#8a4430' : (px + off) % 4 === 1 ? '#e8a080' : '#c06a4a'; });
  TEX[MOSSBRICK] = genTex((px, py, v) => { if (py % 4 === 3 || px === ((py >> 2) % 2 ? 2 : 6)) return '#4a2c26'; if (hh(px, py, 611 + v) > .62) return hh(px, py, 612) > .5 ? '#6fae7a' : '#3a7a52'; return py % 4 === 0 ? '#b0705a' : '#8a5040'; });
  const wall = (src, a) => src.map(s => { const [c, x] = mk(8, 8); x.drawImage(s, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = `rgba(9,6,24,${a})`; x.fillRect(0, 0, 8, 8); return c; });
  WTEX[W_POLISHED] = wall(TEX[POLISHED], .5); WTEX[W_MOSAIC] = wall(TEX[MOSAIC], .66); WTEX[W_MOSSB] = wall(TEX[MOSSBRICK], .5);
}
const W_POLISHED = 40, W_MOSAIC = 41, W_MOSSB = 42;
function furnItems() {
  for (const [t, id, name, , , desc] of FURN) defI(id, { name, type: 'block', tile: t, stack: 20, icon: outlined(STN_SPR[t].img), desc });
  const blk = (id, name, tile, desc) => defI(id, { name, type: 'block', tile, icon: outlined(TEX[tile][0]), desc });
  blk('stained_r', 'Ember Glass', STAINED_R, 'Coloured glass. Glows warm when the light is behind it.'); blk('stained_b', 'Sky Glass Pane', STAINED_B, 'Coloured glass, cool and blue.');
  blk('polished', 'Polished Stone', POLISHED, 'Smooth pale stone.'); blk('mosaic', 'Mosaic Tiles', MOSAIC, 'Little squares of colour.');
  blk('rooftile', 'Roof Tiles', ROOFTILE, 'Fired clay roofing.'); blk('mossbrick', 'Mossy Brick', MOSSBRICK, 'Old brick with moss in the joints.');
  const wal = (id, name, w) => defI(id, { name, type: 'wall', wall: w, icon: outlined(WTEX[w][0]), desc: 'A back wall. Blocks the sky, keeps a room a room.' });
  wal('wpolished', 'Polished Stone Wall', W_POLISHED); wal('wmosaic', 'Mosaic Wall', W_MOSAIC); wal('wmossb', 'Mossy Brick Wall', W_MOSSB);
  // gadgets you carry: they work from anywhere in your pack
  const G0 = (id, name, rows, pal, desc) => defI(id, { name, type: 'util', u: id, icon: outlined(spr(rows, pal)), stack: 1, desc });
  G0('depth_gauge', 'Depth Gauge', ['.aaaa.', 'abbbba', 'abeeba', 'abfeba', 'abbbba', '.aaaa.'], { a: '#c98a2b', b: '#f4efe6', e: '#5f5a69', f: '#e2483b' }, 'Carry it: your depth shows on screen.');
  G0('pocket_watch', 'Pocket Watch', ['..aa..', '.abba.', 'abeeba', 'abfeba', 'abbbba', '.aaaa.'], { a: '#ffd35a', b: '#fff1a8', e: '#5f5a69', f: '#e2483b' }, 'Carry it: the time of day, and how long until dark, shows on screen.');
  for (const id of ['depth_gauge', 'pocket_watch', 'ore_seeker']) PASSIVE_U.add(id);
  G0('ore_seeker', 'Ore Seeker', ['...a...', '..aba..', '.abeba.', 'abeeeba', '.abeba.', '..aba..', '...c...'], { a: '#8a94a4', b: '#cfd6e0', c: '#5a4030', e: '#ff8a3d' }, 'Carry it: ore near you glints, even through rock.');
}
// ---- the carpenter's work ----
R('carp', 'crate', 1, { plank: 6, stick: 2 }); R('carp', 'barrel', 1, { plank: 8, fittings: 2 }); R('carp', 'strongbox', 1, { plank: 6, iron_bar: 3, fittings: 2 });
R('carp', 'bed', 1, { plank: 6, cloth: 2, fiber: 6 }); R('carp', 'planter', 1, { plank: 4, dirt: 6, clay: 1 }); R('carp', 'signpost', 1, { plank: 3, stick: 2, charcoal: 1 });
R('carp', 'weapon_rack', 1, { plank: 5, stick: 4, fittings: 1 }); R('carp', 'table', 1, { plank: 6, stick: 2 }); R('carp', 'chair', 1, { plank: 4, stick: 2 });
R('carp', 'bookshelf', 1, { plank: 8, reed: 6, resin: 1 }); R('carp', 'lamppost', 1, { plank: 3, glass: 1, resin: 2 }); R('carp', 'candles', 2, { resin: 2, twine: 1 });
R('carp', 'fence', 4, { stick: 4, plank: 1 }); R('carp', 'beehive', 1, { plank: 4, fiber: 6, resin: 1 });
R('carp', 'platform', 4, { plank: 2 }); R('carp', 'door', 1, { plank: 6, stick: 2 }); R('carp', 'ladder', 4, { stick: 6, twine: 2 });
// ---- the tinker's work ----
R('tink', 'spike_trap', 2, { bronze_bar: 1, plank: 1 }); R('tink', 'snare', 1, { rope: 1, stick: 2 }); R('tink', 'ballista', 1, { plank: 6, iron_bar: 3, rope: 2, fittings: 2 });
R('tink', 'warning_bell', 1, { bronze_bar: 2, plank: 3, rope: 1 }); R('tink', 'brazier', 1, { copper_bar: 2, rock: 4, coal: 2 }); R('tink', 'chandelier', 1, { copper_bar: 2, fittings: 2, resin: 3 });
R('tink', 'depth_gauge', 1, { copper_bar: 1, glass: 1, fittings: 1 }); R('tink', 'pocket_watch', 1, { bronze_bar: 1, glass: 1, fittings: 2 }); R('tink', 'ore_seeker', 1, { iron_bar: 1, geode_core: 1, glass: 1 });
R('tink', 'fittings', 4, { copper_bar: 1 }); R('tink', 'ropecoil', 1, { rope: 4, fittings: 1 });
// ---- stone, cloth and fire ----
R('mason', 'statue', 1, { cutstone: 6 }); R('mason', 'fountain', 1, { cutstone: 6, jug_w: 2, glass: 1 }, { ret: { jug: 2 } });
R('mason', 'polished', 4, { cutstone: 2 }); R('mason', 'mosaic', 4, { cutstone: 2, glass: 1 }); R('mason', 'mossbrick', 4, { brick: 2, fiber: 1 });
R('mason', 'wpolished', 4, { polished: 1 }); R('mason', 'wmosaic', 4, { mosaic: 1 }); R('mason', 'wmossb', 4, { mossbrick: 1 });
R('loom', 'rug', 1, { cloth: 3, fiber: 2 }); R('loom', 'banner', 1, { cloth: 2, stick: 2, berries: 2 });
R('kiln', 'rooftile', 4, { clay: 2 }, { t: 600, temp: 2 }); R('kiln', 'flowerpot', 1, { clay: 2, fiber: 2 }, { t: 600, temp: 2 });
R('kiln', 'stained_r', 2, { glass: 2, berries: 1 }, { t: 700, temp: 3 }); R('kiln', 'stained_b', 2, { glass: 2, glowcap: 1 }, { t: 700, temp: 3 });

// ---------------- what they do ----------------
function furnState(s, t, i) {
  if (STORE_N[t] && t !== CHEST) s.items = new Array(STORE_N[t]).fill(null);
  else if (t === WRACK) s.items = [null];
  else if (t === PLANTER) { s.crop = ''; s.grow = 0; }
  else if (t === BEEHIVE) { s.honey = 0; s.grow = 0; }
  else if (t === BALLISTA) { s.cd = 60; s.face = 1; }
  else if (t === BELL || t === SNARE || t === SPIKETRAP) s.cd = 0;
  void i;
}
const FURN_IDS = new Set(FURN.map(f => f[0]));
const furnNear = (tx, ty, ids, rx, ry) => { for (const o of tileObjs.values()) if (ids.includes(o.id) && abs(o.x - tx) <= rx && abs(o.y - ty) <= ry) return o; return null; };
function furnFoes(cx, cy, r) { const out = []; for (const e of G.enemies) if (!e.dead && !e.noHit && e.hp > 0 && !e.root && e.type !== 'dummy' && hypot(e.x + e.w / 2 - cx, e.y + e.h / 2 - cy) < r) out.push(e); return out; }
function tickFurniture() {
  const p = G.p; if (!p) return; const host = !netGuest(); oreSeekerFx();
  if (G.time % 20 === 0) { const ptx = floor((p.x + 3) / T), pty = floor((p.y + 10) / T); G.nearWarm = !!furnNear(ptx, pty, [BRAZIER], 5, 4); G.nearFount = !!furnNear(ptx, pty, [FOUNTAIN], 3, 3); }
  if (G.nearFount && !p.dead && p.hp < p.maxhp && p.regenT > 120 && G.time % 40 === 0) { p.hp = min(p.maxhp, p.hp + 1); if (G.time % 120 === 0) P(p.x + 3, p.y + 4, 0, -.5, 30, '#8fd0d8', { glow: 1, g: -.01 }); }
  for (const [i, s] of STN) {
    const t = s.t; if (!FURN_IDS.has(t) || tiles[i] !== t) continue; const tx = i % WW, ty = (i / WW) | 0, cx = tx * T + 4, cy = ty * T + 4;
    if (t === PLANTER) { if (s.crop && CROPS[s.crop]) { const C = CROPS[s.crop], sun = G.sun > .45 && ty < SKYL[tx] && !walls[i]; s.grow += C.dark ? (sun ? .6 : 1.2) : (sun ? 1.4 : .8); } continue; }
    if (t === BEEHIVE) { if (s.honey < 3) { const fl = G.time % 120 === 0 ? countNear(tx, ty, [FLOWER, BERRY, FLOWERPOT, TALLGRASS], 6) : s.fl || 0; s.fl = fl; s.grow += 1 + min(4, fl) * .5; if (s.grow >= 5400) { s.grow = 0; s.honey++; } } if (G.time % 50 === 0 && abs(cx - p.x) < 200) P(cx + frand(-6, 6), cy - 4 + frand(-4, 4), frand(-.4, .4), frand(-.3, .3), 40, '#ffd35a', { g: 0 }); continue; }
    if (t === BRAZIER) { if (G.time % 5 === 0 && abs(cx - p.x) < 260) P(cx + frand(-2, 2), ty * T + 2, frand(-.15, .15), frand(-.9, -.4), 20, fpick(['#ffd35a', '#ff8a3d', '#e2542b']), { glow: 1, g: -.02 }); continue; }
    if (!host || G.time % 3) continue;
    if (s.cd > 0) s.cd -= 3;
    if (t === SPIKETRAP && s.cd <= 0) { for (const e of G.enemies) if (!e.dead && !e.noHit && !e.root && e.type !== 'dummy' && !e.fly && e.x < tx * T + T && e.x + e.w > tx * T && e.y + e.h >= ty * T + 2 && e.y + e.h <= ty * T + T + 2) { damageEnemy(e, 10, 0, -1.5, { stagger: 10 }); sparks(cx, ty * T + 6, 4, 0, 1.2); sfx('clink', 20); s.cd = 45; break; } }
    else if (t === SNARE && s.cd <= 0) { for (const e of G.enemies) if (!e.dead && !e.noHit && !e.root && !e.boss && e.type !== 'dummy' && !e.fly && e.x < tx * T + T && e.x + e.w > tx * T && abs(e.y + e.h - (ty * T + T)) < 4) { e.stun = max(e.stun || 0, 150); e.vx = 0; numPop(cx, ty * T - 2, 'SNARED', '#c9a44a'); sfx('thud', 0); s.cd = 900; break; } }
    else if (t === BALLISTA && s.cd <= 0) {
      const oy = ty * T + 1, foes = furnFoes(cx, oy, 120).filter(e => abs(e.y + e.h / 2 - oy) < 70).sort((a, b) => abs(a.x - cx) - abs(b.x - cx));
      const e = foes.find(q => clearLine(cx, oy, q.x + q.w / 2, q.y + q.h / 2)); if (!e) { s.cd = 20; continue; }
      const ex = e.x + e.w / 2, ey = e.y + e.h / 2, d = max(1, hypot(ex - cx, ey - oy)), sp = 4.6;
      s.face = ex < cx ? -1 : 1; s.cd = 75; spawnProj({ type: 'arrow', x: cx + s.face * 5, y: oy, vx: (ex - cx) / d * sp, vy: (ey - oy) / d * sp - d * .0035, g: .02, dmg: 14, owner: G.p, life: 70, r: 3, kb: [2.4, -1.2] }); sfx('bolt', 20);
    }
    else if (t === BELL && s.cd <= 0 && furnFoes(cx, cy, 100).some(e => !e.boss)) { s.cd = 1500; s.ring = 90; sfx('ting', 0); sfx('shrine', 0); if (abs(cx - p.x) < 600) say('The warning bell rings: something is close.'); }
  }
}
// nothing solid between two points (sampled every few pixels)
function clearLine(x0, y0, x1, y1) { const d = hypot(x1 - x0, y1 - y0), n = max(1, ceil(d / 4)); for (let k = 2; k < n; k++) { const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n; if (solidAt(floor(x / T), floor(y / T))) return false; } return true; }
function countNear(tx, ty, ids, r) { let n = 0; for (let y = ty - r; y <= ty + r; y++) for (let x = tx - r; x <= tx + r; x++) if (ids.includes(tileAt(x, y))) n++; return n; }
// [F] on furniture
function furnInteract(L, ptx, pty) {
  for (const o of tileObjs.values()) {
    if (!FURN_IDS.has(o.id) || abs(o.x - ptx) > 6 || abs(o.y - pty) > 5) continue; const i = o.y * WW + o.x, x = o.x * T + 4, y = (o.y + 1) * T;
    if (o.id === BED) L.push({ x, y, r: 14, label: 'sleep', act: () => bedSleep(o.x, o.y) });
    else if (o.id === PLANTER) { const s = stnState(i, PLANTER), C = s.crop && CROPS[s.crop]; L.push({ x, y, r: 12, label: !C ? (seedHave() ? 'plant ' + IT[seedHave()].name.toLowerCase() : 'plant something') : s.grow >= C.t ? 'harvest the ' + IT[s.crop].name.toLowerCase() : 'growing: ' + floor(s.grow / C.t * 100) + '%', act: () => planterAct(i, s) }); }
    else if (o.id === WRACK) { const s = stnState(i, WRACK), it = s.items[0], h = heldItem(); L.push({ x, y, r: 12, label: it ? 'take the ' + IT[it.id].name : h && h.type === 'weapon' && !h.fist ? 'hang the ' + h.name : 'hang a weapon (hold one)', act: () => rackAct(i, s) }); }
    else if (o.id === BEEHIVE) { const s = stnState(i, BEEHIVE); L.push({ x, y, r: 12, label: s.honey ? 'take ' + s.honey + ' honey' : 'the bees are busy', act: () => { if (!s.honey) { say('No honey yet. Flowers and berry bushes nearby make it come faster.'); return; } const l = addItem('honey', s.honey); if (l) spawnDrop('honey', l, x, y - 8); toastItem('honey', s.honey - l); s.honey = 0; sfx('pickup'); if (COOP.role) COOP.stns.add(i); G.dirty = true; } }); }
    else if (o.id === FOUNTAIN) L.push({ x, y, r: 14, label: countItem('jug') ? 'fill your jugs' : 'drink', act: () => { const n = countItem('jug'); if (n) { removeItem('jug', n); const l = addItem('jug_w', n); if (l) spawnDrop('jug_w', l, x, y - 8); toastItem('jug_w', n); sfx('pickup'); } else { const p = G.p; p.hp = min(p.maxhp, p.hp + 6); say('Cold and clean.'); sfx('heal'); } } });
    else if (o.id === BOOKSHELF) L.push({ x, y, r: 12, label: 'read a book', act: () => { G.bookI = ((G.bookI | 0) + 1) % BOOKS.length; say(BOOKS[G.bookI]); sfx('ui'); } });
    else if (o.id === BELL) L.push({ x, y, r: 12, label: 'ring the bell', act: () => { const s = stnState(i, BELL); s.ring = 90; sfx('ting', 0); } });
  }
}
const seedHave = () => Object.keys(CROPS).find(hasItem) || null;
function planterAct(i, s) {
  const C = s.crop && CROPS[s.crop];
  if (!C) { const id = seedHave(); if (!id) { say('Plant berries, reeds, fibre, mushrooms or glowcaps: carry one of them.'); sfx('deny'); return; } removeItem(id, 1); s.crop = id; s.grow = 0; sfx('place'); say(`Planted. ${CROPS[id].dark ? 'Mushrooms like the dark.' : 'It grows faster in the sun.'}`); }
  else if (s.grow >= C.t) { const x = (i % WW) * T + 4, y = ((i / WW) | 0) * T, l = addItem(s.crop, C.n); if (l) spawnDrop(s.crop, l, x, y - 6); toastItem(s.crop, C.n - l); s.crop = ''; s.grow = 0; sfx('pickup'); G.flags.harvested = true; }
  else { say(`Not ripe yet: ${floor(s.grow / C.t * 100)}%.`); return; }
  if (COOP.role) COOP.stns.add(i); G.dirty = true;
}
function rackAct(i, s) {
  const it = s.items[0];
  if (it) { const l = addItem(it.id, it.n); if (l) { sfx('deny'); say('Your pack is full.'); return; } s.items[0] = null; sfx('pickup'); }
  else { const k = G.sel, h = inv[k]; if (!h || IT[h.id].type !== 'weapon' || IT[h.id].fist) { say('Hold the weapon you want to hang, then [F].'); sfx('deny'); return; } s.items[0] = { id: h.id, n: 1 }; if (--h.n <= 0) inv[k] = null; sfx('place'); }
  if (COOP.role) COOP.stns.add(i); G.dirty = true;
}
function bedSleep(x, y) {
  const cosy = !!(furnNear(x, y, [TABLE], 8, 4) && furnNear(x, y, [CHAIR], 8, 4) && (furnNear(x, y, [LAMPPOST, CANDLES, CHANDELIER, BRAZIER, TORCH], 8, 5) || nearFireAt(x, y)));
  sleepAt(x, y); G.rest = cosy ? 36000 : 18000; G.dirty = true;
  numPop(G.p.x + 3, G.p.y - 12, cosy ? 'COSY: RESTED' : 'RESTED', '#ffd35a'); if (cosy) G.flags.cosy = true;
}
// world dressing: crops, the hung weapon, flames, the ballista's aim, a swinging bell
function drawFurnWorld(w) {
  for (const [i, s] of STN) {
    const t = s.t; if (!FURN_IDS.has(t) || tiles[i] !== t) continue; const x = (i % WW) * T, y = ((i / WW) | 0) * T;
    if (t === PLANTER && s.crop && CROPS[s.crop]) {
      const C = CROPS[s.crop], f = min(1, s.grow / C.t), h = 1 + round(f * 5), ripe = f >= 1;
      for (let k = 0; k < 4; k++) { const sx = x + k * 2 + (k > 1 ? 1 : 0); w.fillStyle = '#3a7a52'; w.fillRect(sx, y + 4 - h + (k % 2), 1, h - (k % 2)); if (f > .4) { w.fillStyle = '#6fae7a'; w.fillRect(sx - (k % 2 ? 1 : -1) * 0, y + 4 - h + 1, 1, 1); } if (ripe || f > .75) { w.fillStyle = ripe ? C.col : '#8a8496'; w.fillRect(sx, y + 4 - h, 2, 1); } }
      if (ripe && (G.time >> 5) % 2) { w.fillStyle = '#fff1a8'; w.fillRect(x + 3, y - 4, 1, 1); }
    } else if (t === WRACK && s.items && s.items[0] && IT[s.items[0].id]) { const ic = IT[s.items[0].id].icon, k = min(1, 10 / max(ic.width, ic.height)), iw = round(ic.width * k), ih = round(ic.height * k); w.drawImage(ic, x + 4 - (iw >> 1), y + 2 - (ih >> 1), iw, ih); }
    else if (t === BRAZIER) { const f = (G.time >> 2) % 3; w.fillStyle = '#ff8a3d'; w.fillRect(x + 2, y - f, 4, 2 + f); w.fillStyle = '#ffd35a'; w.fillRect(x + 3, y + 1 - f, 2, 1 + f); }
    else if (t === BELL && s.ring > 0) { s.ring--; const sw = round(sin(s.ring * .4) * 1.5); w.fillStyle = '#ffd35a'; w.fillRect(x + 3 + sw, y + 6, 2, 1); }
    else if (t === SNARE && s.cd > 0) { w.fillStyle = '#5a4030'; w.fillRect(x + 1, y + 6, 6, 1); }
  }
}
// the ballista turns to its target (the generic sprite pass skips it)
function drawBallista(w, o) {
  const s = STN.get(o.y * WW + o.x), q = STN_SPR[BALLISTA], x = o.x * T, y = o.y * T;
  if (s && s.face === -1) { w.save(); w.translate(x + 8 - q.ox, y + q.oy); w.scale(-1, 1); w.drawImage(q.img, 0, 0); w.restore(); } else w.drawImage(q.img, x + q.ox, y + q.oy);
}
function furnLights() { const p = G.p; if (p && !p.dead && !WORLD.arena && boonHas('glow')) addLight(p.x + 3, p.y + 6, .7, .8, .7); }
// carried gadgets: depth, time, ore
function drawGadgetHud(c) {
  if (WORLD.arena || !G.p) return; const p = G.p; let y = VS.uh - 34; const lines = [];
  if (hasUtil('depth_gauge')) { const ty = floor((p.y + p.h) / T), g = heights[clamp(floor((p.x + 3) / T), 0, WW - 1)] || 0, d = ty - g; lines.push([DIM ? 'DEPTH: another world' : d <= 0 ? 'DEPTH: surface' : `DEPTH: ${d} down`, '#cfd6e0']); }
  if (hasUtil('pocket_watch') && !DIM) { const h = (G.clock * 24 + 6) % 24, hh0 = floor(h), mm = floor((h - hh0) * 60), dark = G.dn < .4; lines.push([`TIME ${String(hh0).padStart(2, '0')}:${String(mm).padStart(2, '0')}  ${dark ? 'night' : 'day'}`, dark ? '#b49cff' : '#ffd35a']); }
  for (const [s, col] of lines) { textS(c, s, VS.uw - textW(s) - 6, y, col); y -= 9; }
}
// ore near you glints, through rock
const ORE_T = new Set([COPPER, TIN, IRON, COAL, EMBER, GEODE, SALT]);
function oreSeekerFx() {
  if (WORLD.arena || !hasUtil('ore_seeker') || G.time % 6) return; const p = G.p, tx0 = floor((p.x + 3) / T), ty0 = floor((p.y + 10) / T);
  for (let k = 0; k < 3; k++) { const x = tx0 + randi(-12, 12), y = ty0 + randi(-9, 9), t = tileAt(x, y); if (ORE_T.has(t) || (typeof CINDERITE !== 'undefined' && (t === CINDERITE || t === GLOOMORE || t === PRISMORE))) P(x * T + frand(8), y * T + frand(8), 0, -.1, 40, '#fff1a8', { glow: 1, g: 0, top: 1 }); }
}
