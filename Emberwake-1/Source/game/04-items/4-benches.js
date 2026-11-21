// ============================================================
//  The benches. Each one has one job, and every item says where it is
//  made (the recipe book, [B], lists them all).
//    Workbench           woodwork, building parts, the other benches
//    Carpenter's Table   furniture and things to place
//    Anvil               metal weapons and tools
//    Armourer's Stand    every piece of armour
//    Tinker's Table      gadgets you carry, traps, the ballista
//    Jeweller's Bench    trinkets you wear
//    Hearth Oven         hot meals that give a boon
//    Cauldron            brews and flasks
//    Offering Altar      offerings that wake the guardians, keys between worlds
//    Mason's Bench       stone blocks, statues, the stone anvil
//  The workshops turn raw things into materials: kiln, bloomery, loom,
//  quern, potter's wheel, drying rack, sieve and campfire.
// ============================================================
const CARPENTER = 130, ARMOURY = 131, TINKER = 132, JEWELLER = 133, OVEN = 134, OFFERING = 135;
defStn(CARPENTER, "Carpenter's Table", 'carpenter'); defStn(ARMOURY, "Armourer's Stand", 'armoury', { dust: '#8a94a4' });
defStn(TINKER, "Tinker's Table", 'tinker'); defStn(JEWELLER, "Jeweller's Bench", 'jeweller', { dust: '#b49cff' });
defStn(OVEN, 'Hearth Oven', 'oven', { light: [.5, .24, .08], dust: '#a0786a' }); defStn(OFFERING, 'Offering Altar', 'offering_altar', { light: [.45, .3, .12], dust: '#8a8496' });
Object.assign(STATIONS, { [CARPENTER]: 'carp', [ARMOURY]: 'armr', [TINKER]: 'tink', [JEWELLER]: 'jewel', [OVEN]: 'oven', [OFFERING]: 'altar' });
defM([CARPENTER, ARMOURY, TINKER, JEWELLER], { hp: 4, k: 'wood' }); defM([OVEN, OFFERING], { hp: 7, tier: 1, k: 'stone' });
for (const t of [CARPENTER, ARMOURY, TINKER, JEWELLER, OVEN, OFFERING]) MAT[t].y = [[TP[t].drop, 1]];
// the hands-on game each new bench borrows (the easy way is a simple bar, as everywhere)
const JOB_OF = { carp: 'bench', armr: 'anvil', tink: 'anvil', jewel: 'mason', oven: 'pot' };
const jobKind = k => JOB_OF[k] || k;

// what each bench is for, in the order the recipe book shows them
const BENCHES = [
  { st: 'hand', n: 'By hand', d: 'Anywhere, from your pack: twine, torches, flint tools and the first workshops.' },
  { st: 'bench', n: 'Workbench', item: 'bench', d: 'Woodwork: planks, doors, ladders, beams, wooden and bone weapons, and most other benches.' },
  { st: 'carp', n: "Carpenter's Table", item: 'carpenter', d: 'Furniture and things to place: crates, barrels, beds, tables, planters, signposts, lamps.' },
  { st: 'anvil', n: 'Anvil', item: 'anvil', d: 'Metal weapons and tools. Stone anvil: copper and bronze. Iron anvil: iron and steel. Slagforge: the metals of the other worlds.' },
  { st: 'armr', n: "Armourer's Stand", item: 'armoury', d: 'Every piece of armour. Metal armour also needs an anvil of the same rank close by.' },
  { st: 'tink', n: "Tinker's Table", item: 'tinker', d: 'Gadgets you carry, traps and the ember ballista: lanterns, glider, claws, compass, gauges.' },
  { st: 'jewel', n: "Jeweller's Bench", item: 'jeweller', d: 'Trinkets you wear in your trinket slots: rings, charms and amulets that change how you move and fight.' },
  { st: 'oven', n: 'Hearth Oven', item: 'oven', d: 'Hot meals. A meal fills you up and gives a boon for a few minutes (one at a time).' },
  { st: 'pot', n: 'Cauldron', item: 'cauldron', d: 'Brews: salves, tonics, antidotes, and flasks to throw.' },
  { st: 'altar', n: 'Offering Altar', item: 'offering_altar', d: 'Offerings that wake the guardians, the lamps that call the sky, and the keys between worlds.' },
  { st: 'mason', n: "Mason's Bench", item: 'mason', d: 'Cut stone: blocks, walls, statues, fountains, the stone anvil and the oven.' },
  { st: 'loom', n: 'Loom', item: 'loom', d: 'Workshop. Cloth, rugs, banners, bedrolls and bags.' },
  { st: 'kiln', n: 'Kiln', item: 'furnace', d: 'Workshop. Fires brick, glass, charcoal, pots and roof tiles.' },
  { st: 'bloom', n: 'Bloomery', item: 'bloomery', d: 'Workshop. Smelts ore into bars.' },
  { st: 'quern', n: 'Quern', item: 'quern', d: 'Workshop. Grinds ore, powder and flour.' },
  { st: 'wheel', n: "Potter's Wheel", item: 'wheel', d: 'Workshop. Shapes clay for the kiln.' },
  { st: 'rack', n: 'Drying Rack', item: 'rack', d: 'Workshop. Leather, jerky and mudbrick, given time.' },
  { st: 'fire', n: 'Campfire', item: 'campfire', d: 'Workshop. Cooks simple food, given time.' },
  { st: 'sieve', n: 'Sieve', item: 'sieve', d: 'Workshop. Shakes useful bits out of gravel, sand, dirt and ash.' }
];
const benchName = st => (BENCHES.find(b => b.st === st) || { n: st }).n;

function buildBenchArt() {
  for (const id of [CARPENTER, ARMOURY, TINKER, JEWELLER, OVEN, OFFERING]) TEX[id] = TEX[DIRT];
  const S = (id, rows, pal, ox, oy) => { STN_SPR[id] = { img: spr(rows, pal), ox, oy }; };
  S(CARPENTER, ['.........e..', '.ffffff..ee.', 'aaaaaaaaaaaa', 'bbbbbbbbbbbb', '.c........c.', '.c.gg.hh..c.', '.c........c.', '.cc......cc.'],
    { a: '#b08a5a', b: '#7a5a40', c: '#5a4030', e: '#8f98a8', f: '#d8b87a', g: '#8f98a8', h: '#c94a4e' }, -2, 0);
  S(ARMOURY, ['....aaaa....', '..aabbbbaa..', '.abbbccbbba.', '.abbbccbbba.', '..abbccbba..', '...abccba...', '....bccb....', '.....dd.....', '.....dd.....', '...dddddd...'],
    { a: '#e6edf2', b: '#8a94a4', c: '#5a6474', d: '#5a4030' }, -2, -2);
  S(TINKER, ['.h.......e..', '.hh..gg..ee.', '.h..gccg.dd.', 'aaaaaaaaaaaa', 'bbbbbbbbbbbb', '.c........c.', '.c..ffff..c.', '.cc......cc.'],
    { a: '#9a7a52', b: '#6b4a2f', c: '#4a3220', d: '#4a8a9a', e: '#8fd0d8', f: '#8f98a8', g: '#ffd35a', h: '#c98a2b' }, -2, 0);
  S(JEWELLER, ['....e.......', '...efe...h..', '....e...hh..', 'aaaaaaaaaaaa', 'bbbbbbbbbbbb', '.c..dddd..c.', '.c..d..d..c.', '.cc......cc.'],
    { a: '#c0bac8', b: '#5a4030', c: '#3a2a20', d: '#8a8496', e: '#b49cff', f: '#ffffff', h: '#ffd35a' }, -2, 0);
  S(OVEN, ['....aaaa....', '..aabbbbaa..', '.abbbbbbbbc.', '.abbffffbbc.', 'abbfeeeefbbc', 'abbfegeefbbc', 'abbfeeeefbbc', 'dddddddddddd'],
    { a: '#d0a47a', b: '#a07a58', c: '#6a4e3a', d: '#3a2a20', e: '#ff8a3d', f: '#2a1410', g: '#ffd35a' }, -2, 0);
  S(OFFERING, ['..e......e..', '..f......f..', '.aaaaaaaaaa.', 'abbbbbbbbbbc', '.cbbbiibbbc.', '.cbbiiiibbc.', '.cbbbiibbbc.', 'dddddddddddd'],
    { a: '#d6d0dc', b: '#8a8496', c: '#5f5a69', d: '#3f3a4c', e: '#ffd35a', f: '#f4efe6', i: '#ff8a3d' }, -2, 0);
}
function benchItems() {
  const st = (id, name, tile, desc) => defI(id, { name, type: 'block', tile, stack: 20, icon: outlined(STN_SPR[tile].img), desc });
  st('carpenter', "Carpenter's Table", CARPENTER, 'Furniture and things to place: crates, barrels, beds, tables, planters, signposts, lamps.');
  st('armoury', "Armourer's Stand", ARMOURY, 'Every piece of armour is made here. Metal armour also wants an anvil of its rank close by.');
  st('tinker', "Tinker's Table", TINKER, 'Gadgets: lanterns, glider, climbing claws, compass, gauges, traps and the ember ballista.');
  st('jeweller', "Jeweller's Bench", JEWELLER, 'Trinkets you wear: rings, charms and amulets.');
  st('oven', 'Hearth Oven', OVEN, 'Bakes and stews hot meals. A meal gives a boon for a few minutes.');
  st('offering_altar', 'Offering Altar', OFFERING, 'Makes the offerings that wake the guardians, and the keys between worlds.');
}
R('bench', 'carpenter', 1, { plank: 8, stick: 4, twine: 2 }); R('bench', 'armoury', 1, { plank: 4, log: 2, hide: 2, rock: 4 });
R('bench', 'tinker', 1, { plank: 6, fittings: 2, twine: 2 }); R('bench', 'jeweller', 1, { plank: 4, cutstone: 2, glass: 1, copper_bar: 1 });
R('mason', 'oven', 1, { brick: 6, cutstone: 2, clay: 2 }); R('mason', 'offering_altar', 1, { cutstone: 6, bone: 4, resin: 2, salt: 2 });

// every recipe goes to the bench whose job it is (run once, after every recipe exists)
function regroupRecipes() {
  const tink = new Set(['lantern', 'emberlamp', 'spyglass', 'compass', 'magnet', 'bucket', 'bucket2', 'toolbelt', 'glider', 'claws', 'shuriken', 'hook']);
  for (const r of RECIPES) {
    if (!r.out || r.regrouped) continue; const it = IT[r.out]; if (!it) continue; r.regrouped = true;
    if (it.type === 'armor' && r.st !== 'armr') { if (r.st !== 'anvil') delete r.lvl; r.from = r.st; r.st = 'armr'; }
    else if (tink.has(r.out) && (r.st === 'anvil' || r.st === 'bench')) { delete r.lvl; r.st = 'tink'; }
    else if ((it.type === 'summon' || it.type === 'key') && r.st === 'anvil') { delete r.lvl; r.st = 'altar'; }
    else if ((r.out === 'backpack' || r.out === 'framepack') && r.st === 'bench') r.st = 'loom';
    if (r.out === 'anvil2' && !r.need.warden_sigil) r.need.warden_sigil = 1;
  }
}
// the best anvil within reach, for the armourer's stand
const anvilNear = () => nearStation(SLAGFORGE) ? 3 : nearStation(ANVIL2) ? 2 : nearStation(ANVIL) ? 1 : 0;
const LVL_NEED = { anvil: ['', 'a stone anvil', 'an iron anvil', 'a Slagforge'], armr: ['', 'a stone anvil close by', 'an iron anvil close by', 'a Slagforge close by'] };
// where an item is made, for its tooltip
function madeAt(id) { const s = []; for (const r of RECIPES) if (r.out === id && !s.includes(r.st)) s.push(r.st); return s.map(benchName); }
