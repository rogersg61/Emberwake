// ============================================================
//  Items, recipes, inventory.
//  You start with nothing. Everything comes from the ground, from plants,
//  from beasts, and from what you make of them at the right station.
// ============================================================
const IT = {};
function defI(id, o) { IT[id] = Object.assign({ id, name: id, stack: 999, type: 'mat', desc: '' }, o); }
// small icon templates: a/b/c/d run light to dark, e and f are accents, w is white
const ICT = {
  nug: ['..ab...', '.abbc..', 'abebcc.', 'bbbccd.', '.bccdd.', '..dd...'],
  rock: ['..aab..', '.abbbc.', 'abbbbcc', 'bbebccd', '.bccdd.', '..ddd..'],
  flint: ['...a...', '..abc..', '.abbbc.', 'abbebcd', '.bbccd.', '..cdd..'],
  pile: ['....a....', '...abb...', '..abbbc..', '.abbebcc.', 'abbbbbccd', 'bccccccdd'],
  bar: ['..aaaaa..', '.abbbbbc.', 'abbebbbcc', 'cbbbbbccd', '.ccccccd.'],
  stick: ['.......ab', '......bc.', '.....bc..', '....bc...', '...bcb...', '..bc..b..', '.bc......', 'cd.......'],
  fiber: ['.a..a.a.', '.ab.ab.a', '..b.bb.b', '..bbbb..', '...bb...', '..cbbc..', '..bccb..', '.c.cc.c.'],
  coil: ['..abba..', '.ab..bc.', 'ab.ab.cc', 'b.b..c.c', 'b.bcc.cd', '.cb..cd.', '..cddd..'],
  cloth: ['aaaaaaaa.', 'abbbbbbbc', 'abebbebbc', 'acccccccc', 'abbbbbbbc', 'abebbebbc', '.ccccccdd'],
  hide: ['.a.....a.', 'abbbbbbbc', '.bbbebbc.', '.bbbbbbc.', 'abbebbbbc', '.c.....d.'],
  bone: ['.aa......', 'abba.....', '.abba....', '...ab....', '....ab...', '.....abb.', '.....abba', '......bb.'],
  meat: ['..abbc..', '.abbbcc.', '.bbebcc.', '.bcccd..', '..cdd...', '...ww...', '....ww..'],
  berry: ['...e....', '..ee.f..', '.abaab..', 'abbabbc.', '.bbcbbc.', '..cc.c..'],
  mush: ['.aaaa.', 'abebbc', 'bbbebc', '.cccc.', '..dd..', '..dd..'],
  jug: ['..dd...', '..ab...', '.abbc..', 'abbbbc.', 'abebbc.', 'abbbbc.', '.bbbc..', '..cc...'],
  vial: ['.d.', 'aba', 'beb', 'bbb', '.c.'],
  bowl: ['a......c', 'abeeeebc', '.bbbbbc.', '..cccc..'],
  brick: ['aaaaaaa', 'abbbbbc', 'abbebbc', 'ccccccd'],
  pack: ['..cccc...', '.cbbbbc..', 'cabbbbbc.', 'cbeeeebc.', 'cbbbbbbcd', 'cbbebbbcd', 'cbbbbbbc.', '.cccccc..'],
  lamp: ['..dd...', '.dccd..', '.abbc..', 'abeebc.', 'abeebc.', '.abbc..', '.dccd..'],
  wing: ['aaa........', 'abbaa......', '.abbbaaa...', '..abbbbbaaa', '...ccbbbbbc', '.....ccccc.'],
  claws: ['a.a.a....', 'b.b.b....', 'bcbcbc...', 'cccccce..', '.eeeeeeee', '..eeeeee.'],
  tube: ['.......aa', 'abbbbbbab', 'abbebbbbc', 'ccccccccc'],
  compass: ['..aaaa..', '.abbbbc.', 'abbebbbc', 'abeeebbc', 'abbfbbbc', 'abbbbbbc', '.cbbbbc.', '..cccc..'],
  scroll: ['.aaaaaaa.', 'abbbbbbbc', '.beebeeb.', '.bbbebbb.', '.bebbeeb.', 'abbbbbbbc', '.ccccccc.'],
  roll: ['.aaaaaaaa.', 'abbebbbebc', 'abbebbbebc', '.cccccccc.'],
  charge: ['...e...', '..e....', '.aa....', 'abba...', 'abbbc..', 'abebc..', '.ccc...'],
  charm: ['.aa..aa.', 'ab....bc', 'ab....bc', 'ab....bc', '.ab..bc.', '..bbbc..', '...ee...'],
  stone: ['..aaaa..', '.abbbbc.', '.abebbc.', '.abeebc.', '.abbebc.', '.abbbbc.', 'abbbbbbc', 'dddddddd'],
  whet: ['.aaaaaa.', 'abbbbbbc', 'cbbebbcc', '.cccccc.'],
  bandage: ['..aaaa..', '.abbbbc.', 'abbeebbc', 'abeebbbc', '.abbbbc.', '..cccc..'],
  arrow: ['......aa', '.....ab.', '....bb..', '...b....', '..b.....', 'eeb.....', 'ee......', 'e.......'],
  plate: ['.aaaa.', 'abbbbc', 'abebbc', 'abbebc', '.cccc.'],
  nails: ['aaa.aaa', '.b...b.', '.b...b.', '.c...c.'],
  chain: ['ab.....', 'b.b....', '.bab...', '...b.b.', '....bab', '......b'],
  belt: ['aaaaaaaaa', 'bebbbbebb', 'b.c.b.c.b'],
  bucket: ['a.....a', 'abbbbbc', 'abebbbc', '.bbbbc.', '.bbbbc.', '..ccc..'],
  strips: ['a..a..a', 'b..b..b', 'b.ab..b', 'bab.ab.', '.bb.bb.', '..c..c.']
};
const PAL = {
  rock: { a: '#5a7f90', b: '#456878', c: '#365263', d: '#1f3240', e: '#6f97a8' }, flint: { a: '#c9c2d6', b: '#8a8296', c: '#5a5468', d: '#2a2436', e: '#e6e0f0' },
  stick: { a: '#a88a60', b: '#8a6a48', c: '#5a4030', d: '#3a2a20' }, fiber: { a: '#b8e08a', b: '#6fae7a', c: '#3a7a52' }, reed: { a: '#e0c070', b: '#8aae6a', c: '#5a7a42' },
  bark: { a: '#a0805a', b: '#6b4a2f', c: '#4a3220', d: '#2a1c18', e: '#8a6a48' }, resin: { a: '#fff1a8', b: '#ffb347', c: '#c97a2b', d: '#7a4a1a', e: '#ffffff' },
  loam: { a: '#6b5276', b: '#5b4364', c: '#4c3653', d: '#3b2a42', e: '#bba888' }, sand: { a: '#ffd3a0', b: '#d67645', c: '#bd5a36', d: '#7a3222', e: '#f0b070' },
  clay: { a: '#e0c0b0', b: '#b48a7a', c: '#a0786a', d: '#7a5a4e', e: '#d4ac9a' }, ash: { a: '#d6d0dc', b: '#a19baa', c: '#8d8794', d: '#5f5a69', e: '#b8b2c0' },
  gravel: { a: '#a8a0b4', b: '#6b6478', c: '#4a4458', d: '#2e2a38', e: '#8a8296' }, peat: { a: '#6a5a40', b: '#3a2a28', c: '#2a1f22', d: '#140c10', e: '#5a4a36' },
  salt: { a: '#ffffff', b: '#efe2e6', c: '#d8c4cc', d: '#a8909c', e: '#ffffff' }, coal: { a: '#6a6480', b: '#2a2436', c: '#1a1626', d: '#0c0a12', e: '#a8a0c8' },
  char: { a: '#5a4a44', b: '#2e2626', c: '#1e1818', d: '#0c0a0a', e: '#8a6a5a' },
  cu: { a: '#fff1a8', b: '#ffd35a', c: '#c98a2b', d: '#7a5418', e: '#ffffff' }, sn: { a: '#ffffff', b: '#e6edf2', c: '#9fb0bd', d: '#5f6f7c', e: '#ffffff' },
  fe: { a: '#efe8ff', b: '#cfc3ee', c: '#8f7fc0', d: '#5a4a8a', e: '#ffffff' }, bz: { a: '#ffe0a0', b: '#f0b060', c: '#a8702e', d: '#6a4418', e: '#fff1c8' },
  st: { a: '#ffffff', b: '#c5ccd8', c: '#8a94a4', d: '#4a5464', e: '#ffffff' }, em: { a: '#fff1a8', b: '#ffb347', c: '#e2542b', d: '#7a2a14', e: '#ffffff' },
  gl: { a: '#ffffff', b: '#c9fff6', c: '#8fd0d8', d: '#4a8a9a', e: '#ffffff' }, deep: { a: '#a0525a', b: '#6e2e36', c: '#4a1e26', d: '#2a0e14', e: '#ff7a5a' },
  cloth: { a: '#f4efe6', b: '#e0d6c4', c: '#b8a890', d: '#7a6a58', e: '#c94a4e' }, leather: { a: '#b88a5a', b: '#8a5a32', c: '#5a3a20', d: '#3a2414', e: '#e0c090' },
  hide: { a: '#c9a080', b: '#a07858', c: '#6a4a38', d: '#4a3020', e: '#d8b898' }, bone: { a: '#ffffff', b: '#e6dccc', c: '#b8a890', d: '#8a7a68' },
  meat: { a: '#ff9a8a', b: '#e2483b', c: '#a8302a', d: '#6a1a18', e: '#ffc0b0', w: '#f4efe6' }, cmeat: { a: '#c98a5a', b: '#8a4a2a', c: '#5a2a18', d: '#3a1a10', e: '#ffb347', w: '#f4efe6' },
  berry: { a: '#ffb08a', b: '#ff6a4a', c: '#c93a2a', e: '#3a7a52', f: '#6fae7a' }, morel: { a: '#c9b4d8', b: '#8a7aa0', c: '#5a4a6a', d: '#d8ccb8', e: '#b49cff' },
  rmorel: { a: '#e0b080', b: '#a06a40', c: '#6a4028', d: '#d8ccb8', e: '#ffd35a' },
  terra: { a: '#e8a080', b: '#c06a4a', c: '#8a4430', d: '#5a2a1e', e: '#ffd0b0' }, raw: { a: '#c8b8b0', b: '#a0948c', c: '#7a6e68', d: '#5a504c', e: '#d8ccc4' },
  water: { a: '#e8a080', b: '#c06a4a', c: '#8a4430', d: '#4fa8d8', e: '#c9fff6' }, gold: { a: '#fff1a8', b: '#ffd35a', c: '#a8702e', d: '#5a4030', e: '#fff1a8', f: '#e2542b' },
  green: { a: '#c8f0b0', b: '#5aa05a', c: '#2a6a3a', d: '#c8b8b0', e: '#e8ffe0' }, purple: { a: '#e0c0ff', b: '#9a5ad0', c: '#5a2a8a', d: '#c8b8b0', e: '#ffffff' },
  red: { a: '#ffb0a0', b: '#e2483b', c: '#8f2233', d: '#c8b8b0', e: '#fff1a8' }, oil: { a: '#8ab070', b: '#3a5a2a', c: '#1e3018', d: '#c8b8b0', e: '#c8e8a0' },
  powder: { a: '#6a6480', b: '#2a2436', c: '#1a1626', d: '#0c0a12', e: '#ffd35a' }, mortar: { a: '#f0ece4', b: '#c8c0b4', c: '#a09888', d: '#6a6458', e: '#ffffff' },
  husk: { a: '#b8aaa0', b: '#8a7a70', c: '#5a4c44' }, membrane: { a: '#9a7ab8', b: '#6a4a8a', c: '#3a2a5a' }, glwing: { a: '#ffffff', b: '#c9fff6', c: '#6fb9c9' },
  rust: { a: '#f0a070', b: '#bd5a36', c: '#7a3222', e: '#ffd3a0' }, chitin: { a: '#8a6a9a', b: '#4a3a5a', c: '#2a1e36', e: '#c9a0e0' },
  scale: { a: '#a0e0c8', b: '#4a9a8a', c: '#1e5a50', e: '#e0fff0' }, gland: { a: '#fff1a8', b: '#ff8a3d', c: '#c94a1e', d: '#5a1a0a', e: '#ffffff' },
  hollow: { a: '#e6e0f0', b: '#b9b0d0', c: '#8a80a8', d: '#5a5078', e: '#ffffff' }, core: { a: '#ffffff', b: '#c9a0ff', c: '#7a4ad0', d: '#3a1a6a', e: '#ffffff' },
  satchel: { a: '#b8e08a', b: '#6fae7a', c: '#2a4a32', e: '#c9a44a' }, bpack: { a: '#c99a6a', b: '#8a5a32', c: '#3a2414', e: '#e0c090' },
  fpack: { a: '#c5ccd8', b: '#6b4a2f', c: '#2a1c18', e: '#8a94a4' }, lamp: { a: '#fff1a8', b: '#ffd35a', c: '#c98a2b', d: '#5a4030', e: '#ffffff' },
  elamp: { a: '#fff1a8', b: '#ff8a3d', c: '#c94a1e', d: '#3a1a10', e: '#ffffff' }, glider: { a: '#f4efe6', b: '#e0d6c4', c: '#8a6a48' },
  claws: { a: '#e6e0f0', b: '#b8a890', c: '#8a7a68', e: '#5a3a20' }, spy: { a: '#fff1a8', b: '#f0b060', c: '#6a4418', e: '#c9fff6' },
  comp: { a: '#cfd6e0', b: '#f4efe6', c: '#5f5a69', e: '#e2483b', f: '#365058' }, map: { a: '#efe6d4', b: '#d6c8ae', c: '#8a7a68', e: '#5a4030' },
  roll: { a: '#d86a6a', b: '#a83a3e', c: '#6a2028', e: '#e8d8b0' }, way: { a: '#c0bac8', b: '#8a84a0', c: '#5f5a69', d: '#3f3a4c', e: '#b49cff' },
  whet: { a: '#b8b2c0', b: '#8d8794', c: '#4a4458', e: '#e8edf2' }, band: { a: '#ffffff', b: '#f4efe6', c: '#c8b8b0', e: '#e2483b' },
  belt: { a: '#b88a5a', b: '#8a5a32', c: '#c5ccd8', e: '#ffd35a' }, bucket: { a: '#a07a50', b: '#7a5a40', c: '#4a3220', e: '#8f98a8' },
  bucket2: { a: '#ffe0a0', b: '#f0b060', c: '#6a4418', e: '#fff1c8' }, jerky: { a: '#c06a4a', b: '#8a3a2a', c: '#5a2018' },
  tea: { a: '#a0805a', b: '#c98a2b', c: '#6a4418', e: '#ffd35a' }, stew: { a: '#a0805a', b: '#8a4a2a', c: '#5a3a20', e: '#c9a44a' }
};
const icon = (t, p) => outlined(spr(ICT[t], typeof p === 'string' ? PAL[p] : p));
function buildItems() {
  const M = (id, name, ic, pal, desc, o) => defI(id, Object.assign({ name, icon: icon(ic, pal), desc }, o));
  // the old weapons of the story (found, given or taken)
  const wp = (id, name, set, dmg, len, icon, held, grip, desc, o) => defI(id, Object.assign({ name, type: 'weapon', set, dmg, len, stack: 1, icon, held, grip, desc }, o));
  wp('sword', "Waker's Blade", 'sword', 11, 15, SPR.i_sword, SPR.w_sword, [2, 2], 'Rusted, but it remembers every form.');
  wp('kblade', 'Kindled Blade', 'sword', 17, 15, SPR.i_kblade, SPR.w_kblade, [2, 2], 'Reforged in emberlight. It burns to be used.', { glow: true });
  wp('spear', 'Ashwood Pike', 'spear', 10, 22, SPR.i_spear, SPR.w_spear, [8, 2], 'Long reach. Thrusts, vaults and sweeps.');
  wp('fangs', 'Twinfangs', 'fangs', 7, 9, SPR.i_fangs, SPR.w_fangs, [2, 2], 'A blade in each hand. Fast, close, relentless.', { dual: true });
  wp('maul', "Warden's Knuckle", 'maul', 19, 17, SPR.i_maul, SPR.w_maul, [3, 4], 'Slow and enormous. Heavy forms shrug off blows.');
  wp('bow', 'Dawnstring', 'bow', 9, 9, SPR.i_bow, SPR.w_bow, [7, 10], 'Looses arrows of light. It never runs dry.');
  wp('vpike', "Vesper's Glasspike", 'spear', 14, 22, outlined(SPR.w_vpike), SPR.w_vpike, [8, 2], 'Cold to hold.', { cold: true });
  wp('vfangs', 'Mirror Fangs', 'fangs', 10, 9, outlined(SPR.w_vfangs), SPR.w_vfangs, [2, 2], 'Cold to hold.', { dual: true, cold: true });
  wp('nunchaku', 'Rattlechain', 'chuks', 8, 12, SPR.i_nunchaku, null, [0, 0], 'Two sticks and a chain. Quick, snapping, and cruel to a pinned foe.', { chuks: true });
  wp('kmaul', "Keeper's Maul", 'maul', 23, 17, SPR.i_kmaul, SPR.w_kmaul, [3, 4], 'Still hot from the Drowned Forge. Its blows set foes alight.', { glow: true, burn: true });
  // ---- from the ground ----
  M('rock', 'Basalt Rock', 'rock', 'rock', 'A fist of nightbasalt. Knap it, build with it, grind it.');
  M('flint', 'Flint', 'flint', 'flint', 'Breaks to an edge sharper than any metal. Strikes sparks.');
  M('stick', 'Stick', 'stick', 'stick', 'Handles, shafts, kindling.');
  M('fiber', 'Plant Fiber', 'fiber', 'fiber', 'Pulled from grass and leaves. Twist it into twine.');
  M('reed', 'Reed', 'fiber', 'reed', 'Hollow fen reeds. Thatch, baskets, paper.');
  defI('log', { name: 'Stalk Log', icon: SPR.i_wood, desc: 'Felled from lantern-stalks. Saw it, burn it, char it.' });
  M('bark', 'Bark', 'hide', 'bark', 'Stripped from felled stalks. Tans hides; brews a bitter tea.');
  M('resin', 'Stalk Resin', 'nug', 'resin', 'Amber sap from felled stalks. Sticky, and it burns.');
  M('dirt', 'Loam', 'pile', 'loam', 'Soil. Pack it, mud it, sift it. Place 2 to fill a gap.', { type: 'block', tile: DIRT, cost: 2 });
  M('sand', 'Rustscale Sand', 'pile', 'sand', 'Melt it to glass, mix it to mortar. Place 2 to pour a drift.', { type: 'block', tile: SAND, cost: 2 });
  M('clay', 'Paleclay', 'rock', 'clay', 'Soft when wet. Throw pots, press bricks.', { type: 'block', tile: CLAY, cost: 2 });
  M('ash', 'Ash', 'pile', 'ash', 'Fine and grey. Mortar, pellets, lye.', { type: 'block', tile: ASH, cost: 2 });
  M('gravel', 'Gravel', 'pile', 'gravel', 'Sift it for flint and ore. Place 2 for a path that settles.', { type: 'block', tile: GRAVEL, cost: 2 });
  M('peat', 'Peat', 'rock', 'peat', 'Fen fuel. Smoulders long and smoky.', { fuel: 3 });
  M('salt', 'Salt', 'nug', 'salt', 'Cures meat and hides. Draws out poison.');
  M('coal', 'Blackseam Coal', 'nug', 'coal', 'The hottest fuel. Steel wants it.', { fuel: 5 });
  M('charcoal', 'Charcoal', 'nug', 'char', 'Wood baked without air. Clean, hot fuel.', { fuel: 4 });
  M('copper_ore', 'Sunmetal Nuggets', 'nug', 'cu', 'Smelt three in a bloomery for a bar.');
  M('tin_ore', 'Whitetin Nuggets', 'nug', 'sn', 'Soft and pale. With sunmetal, it makes bronze.');
  M('iron_ore', 'Hollow Iron Nuggets', 'nug', 'fe', 'Needs real heat. A bloomery, worked hard.');
  M('snow', 'Stillglass Shards', 'flint', 'gl', 'Cold glass that never melts on its own.');
  M('deepstone', 'Deepstone', 'rock', 'deep', 'Dense and warm. Heavy heads, fireproof bricks.');
  M('fungus', 'Deep Morel', 'mush', 'morel', 'Edible, barely. Better roasted.', { type: 'food', food: 4, heal: 0 });
  M('berries', 'Emberberries', 'berry', 'berry', 'Sweet and hot. A handful takes the edge off hunger.', { type: 'food', food: 6, heal: 2 });
  defI('glowcap', { name: 'Dewbulb', type: 'heal', heal: 14, food: 3, icon: SPR.i_glowcap, desc: 'Restores 14 health.' });
  defI('cinder', { name: 'Cinder', icon: SPR.i_cinder, desc: 'Still warm. Fuel, flasks, cinderbrick.', fuel: 3 });
  defI('shard', { name: 'Ember Shard', icon: SPR.i_shard, desc: 'A splinter of the Dawnforge. Embersteel and waystones need it.' });
  // ---- from beasts ----
  M('hide', 'Raw Hide', 'hide', 'hide', 'Dry it on a rack with salt, bark or peat smoke for leather.');
  M('meat', 'Raw Meat', 'meat', 'meat', 'Cook it, cure it, or stew it.', { type: 'food', food: 8, heal: 0 });
  M('bone', 'Bone', 'bone', 'bone', 'Tools, arrows, glue.');
  M('tusk', 'Thornback Tusk', 'bone', { a: '#ffffff', b: '#f4ead8', c: '#c9b490', d: '#8a7a58' }, 'Curved and hard. Claws, clubs, horn bows.');
  M('husk_fiber', 'Husk Wrappings', 'fiber', 'husk', 'Old cloth from a husk. Weaves, binds, bandages.');
  M('membrane', 'Flit Membrane', 'wing', 'membrane', 'Thin, tough wing-skin. Gliders, bandages, satchels.');
  M('glass_wing', 'Glass Wing', 'wing', 'glwing', 'Fletching, lenses, glider skins.');
  M('rust_plate', 'Rustback Plate', 'plate', 'rust', 'A shell plate. Frames, maces, or smelt it back to iron.');
  M('cinder_gland', 'Cinder Gland', 'nug', 'gland', 'Bursts into flame when crushed. Starts fires, fills flasks.');
  M('lurker_oil', 'Lurker Oil', 'vial', 'oil', 'Burns slow and bright. Lanterns, flasks, bowstrings.');
  M('venom', 'Venom Sac', 'vial', 'purple', 'Coat a blade, cure a bite, tip a weapon.');
  M('scale', 'Serpent Scale', 'plate', 'scale', 'Overlapping and slick. Claws, packs, scaled glaives.');
  M('chitin', 'Crawler Chitin', 'plate', 'chitin', 'Light, hard plates. Claws, frame packs, chitin knives.');
  M('geode_core', 'Geode Heart', 'nug', 'core', 'Pulls at iron. Waystones and magnet charms are built around one.');
  M('hollow_ash', 'Hollow Ash', 'pile', 'hollow', 'What the Deep leaves of a person. Deep weapons drink it.');
  defI('skysilk', { name: 'Skysilk', icon: SPR.i_skysilk, desc: 'Shed by skyrays. Gliders, fine cloth, smoke pellets.' });
  // ---- worked materials ----
  M('twine', 'Twine', 'coil', { a: '#e0c070', b: '#b89a50', c: '#8a6a30', d: '#5a4020' }, 'Twisted fiber. Binds heads to handles.');
  M('rope', 'Rope', 'coil', { a: '#c9a44a', b: '#a8862e', c: '#7a5a20', d: '#4a3410' }, 'Three twines laid together.');
  M('cloth', 'Cloth', 'cloth', 'cloth', 'Woven on a loom.');
  M('leather', 'Leather', 'cloth', 'leather', 'Tanned hide. Packs, belts, grips.');
  M('mortar', 'Mortar', 'pile', 'mortar', 'Sand, ash and water. Sets stone to stone.');
  M('glue', 'Glue', 'jug', { a: '#f4ead8', b: '#d8c49a', c: '#a08a5a', d: '#5a4a30', e: '#ffffff' }, 'Boiled bone or resin and ash. Composite bows, frames.');
  M('glass', 'Glass', 'bar', 'gl', 'Kiln-melted sand. Windows, lenses, lanterns.');
  M('powder', 'Blackpowder', 'pile', 'powder', 'Ground charcoal, salt and cinder. Handle gently.');
  M('fittings', 'Fittings', 'nails', 'st', 'Hinges and nails. Doors, chests, frames.');
  M('chain', 'Chain', 'chain', 'st', 'Forged links. Hooks, flails, chain whips.');
  M('copper_bar', 'Sunmetal Bar', 'bar', 'cu', 'Soft, bright metal. First tools, bronze.'); IT.copper_bar.icon = SPR.i_copper_bar;
  M('tin_bar', 'Whitetin Bar', 'bar', 'sn', 'Alloy it with sunmetal.');
  M('bronze_bar', 'Sunbronze Bar', 'bar', 'bz', 'Harder than either of its parents.');
  M('iron_bar', 'Hollow Iron Bar', 'bar', 'fe', 'Strong. Hollow iron rings when struck.'); IT.iron_bar.icon = SPR.i_iron_bar;
  M('steel_bar', 'Nightsteel Bar', 'bar', 'st', 'Iron married to coal in a crucible.');
  M('ember_bar', 'Embersteel Bar', 'bar', 'em', 'Nightsteel quenched in ember. Never quite cools.');
  M('skyglass', 'Skyglass', 'bar', { a: '#ffffff', b: '#dcf7f5', c: '#62a9bc', d: '#2a5a6a', e: '#ffffff' }, 'Stillglass fused hard. Cold blades.');
  // knapped heads (their icons are the knapping patterns themselves)
  for (const [id, name] of [['knifeblade', 'Flint Blade'], ['axehead', 'Axe Head'], ['pickhead', 'Pick Head'], ['shovelhead', 'Spade Head'], ['spearhead', 'Spear Point']]) defI(id, { name, icon: null, desc: 'Knapped. Bind it to a stick with twine.' });
  // pottery
  M('jug_u', 'Unfired Jug', 'jug', 'raw', 'Fire it in a kiln.'); M('crucible_u', 'Unfired Crucible', 'bowl', 'raw', 'Fire it in a kiln.');
  M('cauldron_u', 'Unfired Cauldron', 'bowl', { a: '#d8ccc4', b: '#a0948c', c: '#5a504c', e: '#c8b8b0' }, 'Fire it in a kiln.'); M('brick_u', 'Brick Blank', 'brick', 'raw', 'Fire it in a kiln.');
  M('jug', 'Clay Jug', 'jug', 'terra', 'Click water to fill it. Many brews need a jug of water.', { type: 'util', u: 'jug' });
  M('jug_w', 'Jug of Water', 'jug', 'water', 'For mortar, mud, brews and broths. The jug comes back.', { stack: 20 });
  M('crucible', 'Crucible', 'bowl', 'terra', 'Kept, not used up: bloomery alloys need one in your pack.', { stack: 1 });
  // ---- food and medicine ----
  M('cmeat', 'Seared Meat', 'meat', 'cmeat', 'Hot and filling.', { type: 'food', food: 28, heal: 10 });
  M('rmorel', 'Roast Morel', 'mush', 'rmorel', 'Nutty, safe, warm.', { type: 'food', food: 14, heal: 6 });
  M('jerky', 'Jerky', 'strips', 'jerky', 'Salted and dried. Keeps forever.', { type: 'food', food: 20, heal: 4 });
  M('stew', 'Deep Stew', 'bowl', 'stew', 'Meat, morel and berries. Feeds you well.', { type: 'food', food: 40, heal: 22 });
  M('ration', 'Trail Ration', 'roll', { a: '#c98a5a', b: '#8a4a2a', c: '#5a2a18', e: '#ff6a4a' }, 'Jerky and berries pressed together.', { type: 'food', food: 34, heal: 8 });
  M('tea', 'Bark Tea', 'bowl', 'tea', 'Bitter. Dulls pain: heals 25.', { type: 'food', food: 4, heal: 25 });
  M('tonic', 'Berry Tonic', 'jug', 'red', 'Stamina refills fast for a while.', { type: 'food', food: 6, heal: 0, buff: 'tonic' });
  M('antidote', 'Antidote', 'jug', 'green', 'Cures poison and bleeding; wards them off a while.', { type: 'food', food: 0, heal: 5, buff: 'ward' });
  M('poultice', 'Dew Poultice', 'bandage', { a: '#c9fff6', b: '#6ff0e0', c: '#2b9c94', e: '#ffffff' }, 'Restores 26 health.', { type: 'heal', heal: 26 });
  defI('salve', { name: 'Dew Salve', type: 'heal', heal: 45, stack: 30, icon: SPR.i_salve, desc: 'Restores 45 health. [H] quick use.' });
  M('bandage', 'Bandage', 'bandage', 'band', 'Stops bleeding. Heals 40 over ten seconds.', { type: 'food', food: 0, heal: 0, buff: 'bandage' });
  M('venomcoat', 'Venom Coat', 'vial', 'purple', 'Coat your weapon: the next 20 blows poison.', { type: 'util', u: 'venom' });
  // ---- utility ----
  const U = (id, name, ic, pal, u, desc, o) => M(id, name, ic, pal, desc, Object.assign({ type: 'util', u, stack: 1 }, o));
  U('satchel', 'Grass Satchel', 'pack', 'satchel', 'pack', 'Click to strap it on: +10 pack slots for good.', { pack: 10 });
  U('backpack', 'Leather Pack', 'pack', 'bpack', 'pack', 'Click to strap it on: +10 more pack slots.', { pack: 10 });
  U('framepack', 'Frame Pack', 'pack', 'fpack', 'pack', 'Click to strap it on: +10 more pack slots.', { pack: 10 });
  U('toolbelt', 'Tool Belt', 'belt', 'belt', 'belt', 'Carry it: swing at stone, wood or soil and the right tool comes to hand.');
  U('lantern', 'Lantern', 'lamp', 'lamp', 'light', 'Carry it: a warm light around you. Click to snuff or light it.');
  U('emberlamp', 'Ember Lamp', 'lamp', 'elamp', 'light', 'Carry it: a wide, hot light. Click to snuff or light it.');
  U('ropecoil', 'Rope Coil', 'coil', { a: '#e0c060', b: '#c9a44a', c: '#7a5a20', d: '#4a3410' }, 'rope', 'Click a ledge to let down 24 tiles of rope. Mine the rope to take it back.');
  U('glider', 'Glider', 'wing', 'glider', 'glide', 'Carry it: hold jump while falling to glide.');
  U('claws', 'Climbing Claws', 'claws', 'claws', 'climb', 'Carry it: press into a wall in the air to cling; hold jump to climb.');
  U('bucket', 'Wooden Bucket', 'bucket', 'bucket', 'bucket', 'Click water to scoop it up, click again to pour.');
  U('bucket2', 'Sunbronze Bucket', 'bucket', 'bucket2', 'bucket', 'Scoops water or molten cinder.');
  U('bucket_w', 'Bucket of Water', 'bucket', { a: '#a07a50', b: '#4fa8d8', c: '#4a3220', e: '#c9fff6' }, 'pour', 'Click to pour.');
  U('bucket_c', 'Bucket of Cinder', 'bucket', { a: '#ffe0a0', b: '#ff8a3d', c: '#6a4418', e: '#fff1a8' }, 'pour', 'Click to pour. Careful.');
  U('spyglass', 'Spyglass', 'tube', 'spy', 'spy', 'Click to look far out. Click again to lower it.');
  U('compass', 'Compass', 'compass', 'comp', 'compass', 'Carry it: an arrow on your screen points at your pinned lead, or home.');
  U('fieldmap', 'Field Map', 'scroll', 'map', 'map', 'Carry it: [M] opens a map of everywhere you have been.');
  U('bedroll', 'Bedroll', 'roll', 'roll', 'place', 'Place it and sleep on it: you wake there after a fall.', { type: 'block', tile: BEDROLL, stack: 5 });
  U('charge', 'Blasting Charge', 'charge', 'terra', 'place', 'Place it, light it, step back. Blows a crater out of rock.', { type: 'block', tile: CHARGE, stack: 10 });
  U('magnet', 'Magnet Charm', 'charm', 'st', 'magnet', 'Carry it: drops come to you from twice as far.');
  U('whetstone', 'Whetstone', 'whet', 'whet', 'whet', 'Click to hone your held weapon: +20% damage for 40 blows.', { stack: 10 });
  U('waystone', 'Waystone', 'stone', 'way', 'place', 'Place it. Touch any waystone to travel to another you have raised.', { type: 'block', tile: WAYSTONE, stack: 5 });
  // ---- building ----
  const blk = (id, name, tile, desc = 'Placeable block.', o) => defI(id, Object.assign({ name, type: 'block', tile, icon: outlined(TEX[tile][0]), desc }, o));
  const wal = (id, name, w, desc) => defI(id, { name, type: 'wall', wall: w, icon: outlined(WTEX[w][0]), desc: desc || 'A back wall. Blocks the sky, keeps a room a room.' });
  blk('plank', 'Stalkwood Planks', PLANK); blk('brick', 'Forge Brick', BRICK, 'Kiln-fired brick. Bloomeries are built of it.');
  blk('platform', 'Rope Bridge', PLATFORM, 'Jump up through it. Hold S to drop.');
  blk('packed', 'Packed Earth', PACKED, 'Rammed loam. Cheap, holds a little.'); blk('cobble', 'Cobble', COBBLE, 'Rock set in mortar. Strong upward, weak across.');
  blk('cutstone', 'Cut Stone', CUTSTONE, 'Dressed blocks. The strongest stone.'); blk('mudbrick', 'Mudbrick', MUDBRICK, 'Sun-dried. Kilns are built of it.');
  blk('logwall', 'Log Wall', LOGWALL, 'Stacked logs.'); blk('wattle', 'Wattle and Daub', WATTLE, 'Woven sticks plastered with mud.');
  blk('thatch', 'Thatch', THATCH, 'Light roofing. Spans well, holds little.'); blk('cinderbrick', 'Cinderbrick', CINDERBRICK, 'Fireproof deepstone brick.');
  blk('window', 'Window', WINDOW, 'A glazed frame. Lets light in.'); blk('beam', 'Post', BEAM, 'A vertical timber. Carries weight far upward. Walk through it.');
  blk('beamh', 'Beam', BEAMH, 'A horizontal timber. Spans wide gaps. Stand on it.'); blk('door', 'Door', DOORC, 'Needs three tall clear tiles. [F] or right-click opens it.');
  blk('ladder', 'Ladder', LADDER, 'Climb with W and S.');
  wal('wplank', 'Plank Wall', W_PLANK); wal('wlog', 'Log Back Wall', W_LOG); wal('wwattle', 'Wattle Wall', W_WATTLE); wal('wmud', 'Mudbrick Wall', W_MUDB); wal('wcobble', 'Cobble Wall', W_COBBLE); wal('wcut', 'Cut Stone Wall', W_CUT); wal('wbrick', 'Brick Wall', W_BRICK);
  defI('torch', { name: 'Pod Lantern', type: 'block', tile: TORCH, icon: SPR.i_torch, desc: 'Warm light. Hang it on walls or blocks.' });
  const st = (id, name, tile, desc) => defI(id, { name, type: 'block', tile, stack: 20, icon: STN_SPR[tile] ? outlined(STN_SPR[tile].img) : null, desc });
  defI('bench', { name: 'Workbench', type: 'block', tile: BENCH, icon: SPR.i_bench, stack: 20, desc: 'Woodwork. Saw with the mouse: long strokes, not frantic ones.' });
  defI('furnace', { name: 'Kiln', type: 'block', tile: FURNACE, icon: SPR.i_furnace, stack: 20, desc: 'Fires pottery and brick, bakes charcoal, melts glass. Feed it and work the damper.' });
  st('campfire', 'Campfire', FIRE, 'Cook on it. Lit with flint. Feed it sticks, logs, peat or coal.'); st('chest', 'Chest', CHEST, 'Holds 20 stacks.');
  st('wheel', 'Potter\'s Wheel', WHEEL, 'Throw clay into jugs, crucibles and cauldrons.'); st('quern', 'Quern', QUERN, 'Grind by circling the mouse around the stone.');
  st('bloomery', 'Bloomery', BLOOMERY, 'Smelts ore with charcoal or coal. Pump the bellows to hold the heat.'); st('anvil', 'Stone Anvil', ANVIL, 'Smith sunmetal and bronze. Strike on the marks.');
  st('anvil2', 'Iron Anvil', ANVIL2, 'Smith anything. Strike on the marks.'); st('loom', 'Loom', LOOM, 'Weave in rhythm: A and D with the beat.');
  st('rack', 'Drying Rack', RACK, 'Hang hides, meat and mudbricks. Faster in the sun or by a fire.'); st('cauldron', 'Cauldron', CAULDRON, 'Brews. Stir steadily, ladle at the right colour.');
  st('mason', 'Mason\'s Bench', MASON, 'Chisel stone along its lines.'); st('post', 'Practice Post', POST, 'Hold a weapon and press F beside it: it calls out drills that teach that weapon\'s styles.'); st('sieve', 'Sieve', SIEVE, 'Shake loose gravel, sand, loam or ash for what hides in it.');
  IT.waystone.icon = outlined(STN_SPR[WAYSTONE].img); IT.charge.icon = outlined(STN_SPR[CHARGE].img); IT.bedroll.icon = outlined(STN_SPR[BEDROLL].img);
  // ---- sidearms and relics (the story keeps these ids) ----
  defI('shuriken', { name: 'Star Knife', type: 'arm', icon: SPR.i_shuriken, stack: 99, desc: '[R] throw. Pins a foe to a nearby wall or floor.' });
  defI('hook', { name: 'Chain Hook', type: 'arm', icon: SPR.i_hook, stack: 1, desc: '[R] throw. Drags a foe to you, or you to a wall.' });
  defI('flask', { name: 'Ember Flask', type: 'arm', icon: SPR.i_flask, stack: 30, desc: '[R] throw. Bursts into fire that clings.' });
  defI('smoke', { name: 'Smoke Pellet', type: 'arm', icon: SPR.i_smoke, stack: 30, desc: '[R] throw. Blinds whoever is caught in the cloud.' });
  M('frostflask', 'Frost Flask', 'jug', { a: '#ffffff', b: '#c9fff6', c: '#62a9bc', d: '#2a5a6a', e: '#ffffff' }, '[R] throw. Bursts into cold that slows everything it touches.', { type: 'arm', stack: 30 });
  M('arrow', 'Arrow', 'arrow', { a: '#e8edf2', b: '#8a6a48', e: '#f4efe6' }, 'Crafted bows need them. Dawnstring does not.', { stack: 300 });
  defI('wember', { name: "Warden's Ember", type: 'relic', stack: 1, icon: SPR.i_wember, desc: 'The first ember. Jump again in mid-air.' });
  defI('wember2', { name: 'Still Ember', type: 'relic', stack: 1, icon: SPR.i_wember2, desc: 'The second ember. Dodge twice in mid-air.' });
  defI('wember3', { name: 'Deep Ember', type: 'relic', stack: 1, icon: SPR.i_wember3, desc: 'The third ember. Molten cinder will not burn you.' });
  buildTools(); buildWeapons(); buildArmor(); dimItemsPost();
  defI('scroll', { name: 'Technique Scroll', type: 'scroll', stack: 5, icon: scrollIcon(), desc: 'Brush drawings of a weapon form. Click to read it: the last weapon you held gains a rank of styles.' });
  for (const id of ['knifeblade', 'axehead', 'pickhead', 'shovelhead', 'spearhead']) { const k = KNAP.find(q => q.out === id), [c, x] = mk(10, 10); for (let i = 0; i < 25; i++) if (k.pat[i] === '#') { x.fillStyle = (i % 5 + (i / 5 | 0)) % 3 ? '#8a8296' : '#c9c2d6'; x.fillRect((i % 5) * 2, (i / 5 | 0) * 2, 2, 2); } IT[id].icon = outlined(c); }
  benchItems(); trinketItems(); furnItems(); offeringItems(); regroupRecipes();
  for (const r of RECIPES) for (const k of Object.keys(r.need).concat(r.out ? [r.out] : [], r.keep || [])) if (!IT[k]) console.warn('recipe item missing', k);
  buildUses();
}
// ---------------- tools: knapped, cast and forged ----------------
const TMAT = {
  flint: { n: 'Flint', tier: 1, pow: 6, cd: 17, m: '#c9c2d6', M: '#5a5468', h: '#8a6a48' }, stone: { n: 'Stone', tier: 1, pow: 6, cd: 17, m: '#8a94a4', M: '#4a5464', h: '#8a6a48' },
  copper: { n: 'Sunmetal', tier: 2, pow: 9, cd: 15, m: '#ffd35a', M: '#c98a2b', h: '#5c8290' }, bronze: { n: 'Sunbronze', tier: 3, pow: 12, cd: 14, m: '#f0b060', M: '#a8702e', h: '#5c8290' },
  iron: { n: 'Hollow Iron', tier: 4, pow: 15, cd: 13, m: '#cfc3ee', M: '#8f7fc0', h: '#365058' }, steel: { n: 'Nightsteel', tier: 5, pow: 19, cd: 12, m: '#e8edf2', M: '#8a94a4', h: '#365058' },
  ember: { n: 'Embersteel', tier: 6, pow: 25, cd: 11, m: '#ffb347', M: '#e2542b', h: '#3a2a20' }
};
const TSHAPE = {
  pick: { rows: ['..........m.', '.........mM.', '.........mM.', '.........MM.', 'hhhhhhhhhMMm', '.........MM.', '.........mM.', '.........mM.', '..........m.'], grip: [1, 4], n: 'Pick' },
  axe: { rows: ['........mm..', '.......mMMm.', '.......MMMMm', 'hhhhhhhMMMMm', '.......hMMm.', '.......h....'], grip: [1, 3], n: 'Axe' },
  shovel: { rows: ['.........MMM.', '........Mmmmm', 'hhhhhhhhMmmmm', '........Mmmmm', '.........MMM.'], grip: [1, 2], n: 'Shovel' },
  hammer: { rows: ['........MMM', '........MmM', '........MmM', 'hhhhhhhhMmM', '........MmM', '........MmM', '........MMM'], grip: [1, 3], n: 'Hammer' },
  knife: { rows: ['....mmmm.', 'hhhhMMMMm', '....mmm..'], grip: [1, 1], n: 'Knife' }
};
// a crisp 45 degree turn of a held sprite, for icons
function rotIcon(src, size = 16) {
  const [c, x] = mk(size, size), sx = src.getContext('2d').getImageData(0, 0, src.width, src.height).data, w = src.width, h = src.height, k = max(1, max(w, h) / (size * 1.32));
  const a = -PI / 4, ca = cos(a), sa = sin(a);
  for (let Y = 0; Y < size; Y++) for (let X = 0; X < size; X++) {
    const dx = (X + .5 - size / 2) * k, dy = (Y + .5 - size / 2) * k, u = floor(dx * ca + dy * sa + w / 2), v = floor(-dx * sa + dy * ca + h / 2);
    if (u < 0 || v < 0 || u >= w || v >= h) continue; const i = (v * w + u) * 4; if (sx[i + 3] < 100) continue;
    x.fillStyle = `rgb(${sx[i]},${sx[i + 1]},${sx[i + 2]})`; x.fillRect(X, Y, 1, 1);
  }
  return outlined(c);
}
function buildTools() {
  const mkT = (mat, kind, id, name) => {
    const m = TMAT[mat], s = TSHAPE[kind], held = spr(s.rows, { h: m.h, m: m.m, M: m.M });
    defI(id, { name: name || `${m.n} ${s.n}`, type: 'tool', kind, tier: m.tier, power: m.pow, cd: m.cd, stack: 1, held, grip: s.grip, icon: rotIcon(held), desc: TOOL_D[kind], mat });
  };
  mkT('flint', 'knife', 'flint_knife'); mkT('flint', 'axe', 'flint_axe'); mkT('flint', 'pick', 'flint_pick'); mkT('stone', 'shovel', 'stone_shovel', 'Stone Spade'); mkT('stone', 'hammer', 'stone_hammer');
  for (const mat of ['copper', 'bronze', 'iron', 'steel']) for (const kind of ['pick', 'axe', 'shovel', 'hammer']) mkT(mat, kind, mat === 'iron' && kind === 'pick' ? 'pick2' : `${mat}_${kind}`);
  mkT('copper', 'knife', 'copper_knife'); mkT('iron', 'knife', 'iron_knife'); mkT('ember', 'pick', 'ember_pick'); mkT('ember', 'axe', 'ember_axe');
  mkT('copper', 'pick', 'pick', "Waker's Pick"); IT.pick.desc = 'An old sunmetal pick. ' + TOOL_D.pick;
  const B = { copper: 3, bronze: 3, iron: 3, steel: 3, ember: 2 }, bar = { copper: 'copper_bar', bronze: 'bronze_bar', iron: 'iron_bar', steel: 'steel_bar', ember: 'ember_bar' };
  for (const mat in B) for (const kind of ['pick', 'axe', 'shovel', 'hammer', 'knife']) {
    const id = mat === 'iron' && kind === 'pick' ? 'pick2' : `${mat}_${kind}`; if (!IT[id] || id === 'pick') continue;
    const n = kind === 'knife' ? 1 : kind === 'shovel' ? 2 : B[mat];
    R('anvil', id, 1, { [bar[mat]]: n, stick: kind === 'hammer' || kind === 'knife' ? 1 : 2 }, { lvl: TMAT[mat].tier >= 4 ? 2 : 1, q: 1 });
  }
}
const TOOL_D = {
  pick: 'Swing at rock: it bites deep along your aim. Best on stone and ore.', axe: 'Fells stalks. Cut low, step back, let it fall.',
  shovel: 'Scoops wide and shallow. Best on soil, sand, gravel and clay.', hammer: 'Crushes rock to gravel, knocks down what you built and gives it back, strips back walls.',
  knife: 'Harvests twice the fiber from plants. Light, quick work.'
};
// ---------------- recipes ----------------
const RECIPES = [];
function R(st, out, n, need, o) { const r = Object.assign({ st, out, n, need }, o); RECIPES.push(r); return r; }
const KNAP = [
  { out: 'knifeblade', mat: ['flint', 'rock'], pat: '....#...##..##..##...#....' },
  { out: 'axehead', mat: ['flint', 'rock'], pat: '###..####.########.###...' },
  { out: 'pickhead', mat: ['flint', 'rock'], pat: '.....##########..#.......' },
  { out: 'shovelhead', mat: ['rock', 'flint'], pat: '.###.###############.###.' },
  { out: 'spearhead', mat: ['flint'], pat: '..#...###..###..###...#..' }
];
// hand: anywhere, from the pack
R('hand', 'twine', 1, { fiber: 3 }); R('hand', 'rope', 1, { twine: 3 }); R('hand', 'twine', 2, { husk_fiber: 1 }); R('hand', 'twine', 3, { hide: 1 });
R('hand', 'torch', 3, { stick: 1, resin: 1 }); R('hand', 'torch', 2, { stick: 2, fiber: 2 }); R('hand', 'torch', 4, { stick: 2, lurker_oil: 1 });
R('hand', 'campfire', 1, { rock: 5, stick: 4, flint: 1 }); R('hand', 'campfire', 1, { rock: 5, stick: 4, cinder_gland: 1 });
R('hand', 'arrow', 4, { stick: 2, flint: 1, fiber: 1 }); R('hand', 'arrow', 4, { stick: 2, bone: 1, fiber: 1 }); R('hand', 'arrow', 8, { stick: 4, flint: 2, glass_wing: 1 });
// stone heads straight from flint or rock (the knapping game, [K], stays for the hands-on)
R('hand', 'knifeblade', 1, { flint: 1 }); R('hand', 'spearhead', 1, { flint: 1 }); R('hand', 'axehead', 1, { flint: 2 }); R('hand', 'pickhead', 1, { flint: 2 }); R('hand', 'shovelhead', 1, { rock: 3 });
R('hand', 'flint_knife', 1, { knifeblade: 1, stick: 1, twine: 1 }); R('hand', 'flint_axe', 1, { axehead: 1, stick: 1, twine: 1 });
R('hand', 'flint_pick', 1, { pickhead: 1, stick: 1, twine: 1 }); R('hand', 'stone_shovel', 1, { shovelhead: 1, stick: 1, twine: 1 }); R('hand', 'stone_hammer', 1, { rock: 2, stick: 1, twine: 1 });
R('hand', 'bench', 1, { log: 3, stick: 2, twine: 2 }); R('hand', 'rack', 1, { stick: 6, twine: 3 }); R('hand', 'sieve', 1, { stick: 4, twine: 3 });
R('hand', 'furnace', 1, { mudbrick: 8, clay: 4 }); R('hand', 'furnace', 1, { brick: 6, clay: 2 }); R('hand', 'bloomery', 1, { brick: 10, clay: 4, mortar: 2 });
R('hand', 'satchel', 1, { fiber: 10, twine: 4 }); R('hand', 'satchel', 1, { reed: 8, twine: 3 }); R('hand', 'satchel', 1, { membrane: 3, twine: 2 });
R('hand', 'bedroll', 1, { hide: 2, fiber: 6 });
R('hand', 'wattle', 2, { stick: 4, dirt: 2, fiber: 1 }); R('hand', 'wwattle', 4, { stick: 3, dirt: 1 });
R('hand', 'packed', 2, { dirt: 4, jug_w: 1 }, { ret: { jug: 1 } });
R('hand', 'thatch', 2, { reed: 3, twine: 1 }); R('hand', 'thatch', 2, { fiber: 5, twine: 1 });
R('hand', 'mortar', 3, { sand: 2, ash: 1, jug_w: 1 }, { ret: { jug: 1 } });
R('hand', 'cobble', 2, { rock: 4, mortar: 1 }); R('hand', 'cobble', 2, { gravel: 3, mortar: 1 }); R('hand', 'wcobble', 4, { rock: 2, mortar: 1 });
R('hand', 'brick_u', 2, { clay: 2 }); R('hand', 'ration', 2, { jerky: 1, berries: 2 }); R('hand', 'poultice', 1, { glowcap: 2, fiber: 1 });
R('hand', 'bandage', 2, { husk_fiber: 2 }); R('hand', 'bandage', 2, { membrane: 1, fiber: 2 });
R('hand', 'charge', 1, { jug: 1, powder: 2, twine: 1 });
R('hand', 'smoke', 3, { ash: 2, peat: 1 }); R('hand', 'smoke', 3, { ash: 2, skysilk: 1 }); R('hand', 'smoke', 3, { powder: 1, ash: 2 });
R('hand', 'ropecoil', 1, { rope: 3 }); R('hand', 'fieldmap', 1, { reed: 4, charcoal: 1, twine: 1 }); R('hand', 'fieldmap', 1, { cloth: 2, charcoal: 1 });
// workbench: saw
R('bench', 'plank', 3, { log: 1 }); R('bench', 'beam', 2, { log: 1 }); R('bench', 'beamh', 3, { plank: 2 }); R('bench', 'ladder', 3, { stick: 4, twine: 1 });
R('bench', 'platform', 4, { plank: 1, twine: 1 }); R('bench', 'door', 1, { plank: 4, twine: 2 }); R('bench', 'door', 1, { plank: 3, fittings: 1 });
R('bench', 'chest', 1, { plank: 6, twine: 2 }); R('bench', 'chest', 1, { plank: 4, fittings: 1 }); R('bench', 'logwall', 2, { log: 2 });
R('bench', 'wplank', 4, { plank: 1 }); R('bench', 'wlog', 4, { log: 1 }); R('bench', 'window', 1, { plank: 1, glass: 1 });
R('bench', 'loom', 1, { plank: 6, stick: 4, twine: 4 }); R('bench', 'post', 1, { log: 2, stick: 2, twine: 3, hide: 1 }); R('bench', 'wheel', 1, { plank: 4, rock: 3, twine: 1 }); R('bench', 'mason', 1, { plank: 6, rock: 4 });
R('bench', 'bucket', 1, { plank: 3, twine: 2, resin: 1 }); R('bench', 'toolbelt', 1, { leather: 2, twine: 2 }); R('bench', 'backpack', 1, { leather: 4, twine: 3, stick: 2 });
R('bench', 'framepack', 1, { plank: 2, rust_plate: 2, leather: 2, glue: 1 }); R('bench', 'framepack', 1, { chitin: 4, leather: 2, rope: 1 }); R('bench', 'framepack', 1, { scale: 5, leather: 2, rope: 1 });
R('bench', 'glider', 1, { stick: 4, cloth: 3, twine: 2, glue: 1 }); R('bench', 'glider', 1, { stick: 4, skysilk: 3, twine: 2 }); R('bench', 'glider', 1, { stick: 4, membrane: 3, twine: 2 }); R('bench', 'glider', 1, { stick: 4, glass_wing: 4, twine: 2 });
R('bench', 'claws', 1, { chitin: 3, leather: 2 }); R('bench', 'backpack', 1, { scale: 4, twine: 3, stick: 2 }); R('bench', 'bone_recurve', 1, { plank: 1, tusk: 1, glue: 1, twine: 2 }); R('bench', 'bone_club', 1, { tusk: 1, stick: 1, twine: 1 }); R('bench', 'claws', 1, { tusk: 2, leather: 2 }); R('bench', 'claws', 1, { scale: 3, leather: 2 });
// campfire: cook (timed; leave it too long and it chars)
R('fire', 'cmeat', 1, { meat: 1 }, { t: 540 }); R('fire', 'rmorel', 1, { fungus: 1 }, { t: 420 });
R('fire', 'tea', 1, { bark: 2, jug_w: 1 }, { t: 600, ret: { jug: 1 } }); R('fire', 'stew', 2, { meat: 1, fungus: 1, berries: 1, jug_w: 1 }, { t: 900, ret: { jug: 1 } });
// potter's wheel
R('wheel', 'jug_u', 1, { clay: 2 }, { h: .45 }); R('wheel', 'crucible_u', 1, { clay: 3 }, { h: .3 }); R('wheel', 'cauldron_u', 1, { clay: 6 }, { h: .62 });
// kiln: fire (timed, needs heat; charcoal only forms with the damper shut)
R('kiln', 'jug', 1, { jug_u: 1 }, { t: 600, temp: 2 }); R('kiln', 'crucible', 1, { crucible_u: 1 }, { t: 720, temp: 3 }); R('kiln', 'cauldron', 1, { cauldron_u: 1 }, { t: 900, temp: 3 });
R('kiln', 'brick', 1, { brick_u: 1 }, { t: 600, temp: 3 }); R('kiln', 'charcoal', 2, { log: 1 }, { t: 700, temp: 1, shut: true }); R('kiln', 'glass', 1, { sand: 2 }, { t: 800, temp: 4 }); R('kiln', 'glass', 1, { snow: 3 }, { t: 700, temp: 3 });
// quern: grind
R('quern', 'copper_ore', 3, { copper_ore: 2 }); R('quern', 'tin_ore', 3, { tin_ore: 2 }); R('quern', 'iron_ore', 3, { iron_ore: 2 });
R('quern', 'powder', 2, { charcoal: 1, salt: 1, cinder: 1 }); R('quern', 'powder', 2, { coal: 1, salt: 1, cinder: 1 }); R('quern', 'powder', 3, { charcoal: 1, cinder_gland: 1 });
R('quern', 'gravel', 3, { rock: 2 });
// bloomery: smelt (fuel: charcoal, coal or peat; the band is how fierce the heat must be)
R('bloom', 'copper_bar', 1, { copper_ore: 3 }, { fuel: 1, band: 1 }); R('bloom', 'tin_bar', 1, { tin_ore: 3 }, { fuel: 1, band: 1 });
R('bloom', 'bronze_bar', 2, { copper_ore: 3, tin_ore: 1 }, { fuel: 1, keep: ['crucible'], band: 2 }); R('bloom', 'bronze_bar', 4, { copper_bar: 3, tin_bar: 1 }, { fuel: 1, keep: ['crucible'], band: 2 });
R('bloom', 'iron_bar', 1, { iron_ore: 4 }, { fuel: 2, band: 3 }); R('bloom', 'iron_bar', 1, { rust_plate: 2 }, { fuel: 1, band: 3 });
R('bloom', 'steel_bar', 1, { iron_bar: 2, coal: 2 }, { fuel: 1, keep: ['crucible'], band: 4 }); R('bloom', 'steel_bar', 1, { iron_ore: 4, coal: 2 }, { fuel: 2, keep: ['crucible'], band: 4 });
R('bloom', 'ember_bar', 1, { steel_bar: 1, shard: 2, cinder: 2 }, { fuel: 2, keep: ['crucible'], band: 5 });
R('bloom', 'skyglass', 2, { snow: 4, glass: 1 }, { fuel: 1, keep: ['crucible'], band: 3 }); R('bloom', 'skyglass', 2, { snow: 4, geode_core: 1 }, { fuel: 1, keep: ['crucible'], band: 3 });
R('bloom', 'cinderbrick', 4, { deepstone: 2, cinder: 1, clay: 2 }, { fuel: 1, band: 2 });
// anvil: strike on the marks (lvl 2 needs the iron anvil)
R('anvil', 'fittings', 4, { copper_bar: 1 }, { lvl: 1 }); R('anvil', 'fittings', 4, { tin_bar: 1 }, { lvl: 1 }); R('anvil', 'fittings', 6, { iron_bar: 1 }, { lvl: 2 });
R('anvil', 'chain', 2, { iron_bar: 1 }, { lvl: 2 }); R('anvil', 'anvil2', 1, { iron_bar: 6 }, { lvl: 1 }); R('anvil', 'cauldron', 1, { copper_bar: 4 }, { lvl: 1 });
R('anvil', 'lantern', 1, { copper_bar: 1, glass: 1, resin: 1 }, { lvl: 1 }); R('anvil', 'lantern', 1, { tin_bar: 1, glass: 1, lurker_oil: 1 }, { lvl: 1 }); R('anvil', 'lantern', 1, { fittings: 2, glass: 1, resin: 1 }, { lvl: 1 });
R('anvil', 'emberlamp', 1, { ember_bar: 1, glass: 1 }, { lvl: 2 }); R('anvil', 'spyglass', 1, { bronze_bar: 1, glass: 2 }, { lvl: 1 }); R('anvil', 'spyglass', 1, { bronze_bar: 1, glass_wing: 2 }, { lvl: 1 });
R('anvil', 'compass', 1, { iron_bar: 1, glass: 1, copper_bar: 1 }, { lvl: 2 }); R('anvil', 'magnet', 1, { iron_bar: 2, geode_core: 1 }, { lvl: 2 }); R('anvil', 'magnet', 1, { steel_bar: 1, geode_core: 1 }, { lvl: 2 });
R('anvil', 'bucket2', 1, { bronze_bar: 3 }, { lvl: 1 }); R('anvil', 'shuriken', 6, { iron_bar: 1 }, { lvl: 2 }); R('anvil', 'shuriken', 4, { steel_bar: 1 }, { lvl: 2 });
R('anvil', 'hook', 1, { chain: 1, iron_bar: 1, rope: 1 }, { lvl: 2 }); R('anvil', 'kblade', 1, { sword: 1, shard: 3, iron_bar: 2 }, { lvl: 2 });
// loom: weave
R('loom', 'cloth', 1, { fiber: 6 }); R('loom', 'cloth', 1, { twine: 3 }); R('loom', 'cloth', 2, { husk_fiber: 3 }); R('loom', 'cloth', 2, { skysilk: 2 });
R('loom', 'bandage', 3, { cloth: 1 }); R('loom', 'satchel', 1, { cloth: 3, twine: 2 }); R('loom', 'bedroll', 1, { cloth: 2, hide: 1 });
// drying rack (timed)
R('rack', 'leather', 1, { hide: 1, salt: 1 }, { t: 1500 }); R('rack', 'leather', 1, { hide: 1, bark: 2 }, { t: 2100 }); R('rack', 'leather', 1, { hide: 1, peat: 1 }, { t: 1800 });
R('rack', 'jerky', 2, { meat: 1, salt: 1 }, { t: 1200 }); R('rack', 'mudbrick', 2, { clay: 2, fiber: 1, dirt: 1 }, { t: 900 });
// cauldron: stir
R('pot', 'salve', 2, { glowcap: 3, resin: 1, jug_w: 1 }, { ret: { jug: 1 }, col: [111, 240, 224] }); R('pot', 'salve', 2, { glowcap: 2, salt: 1, jug_w: 1 }, { ret: { jug: 1 }, col: [111, 240, 224] });
R('pot', 'antidote', 2, { fungus: 1, venom: 1, jug_w: 1 }, { ret: { jug: 1 }, col: [90, 200, 90] }); R('pot', 'glue', 2, { bone: 2, jug_w: 1 }, { ret: { jug: 1 }, col: [216, 196, 154] });
R('pot', 'glue', 2, { resin: 2, ash: 1 }, { col: [216, 196, 154] }); R('pot', 'tonic', 2, { berries: 3, bark: 1, jug_w: 1 }, { ret: { jug: 1 }, col: [226, 72, 59] });
R('pot', 'venomcoat', 2, { venom: 1, resin: 1 }, { col: [154, 90, 208] });
R('pot', 'flask', 2, { jug: 2, cinder: 2, lurker_oil: 1 }, { col: [255, 138, 61] }); R('pot', 'flask', 2, { jug: 2, cinder: 2, resin: 2 }, { col: [255, 138, 61] }); R('pot', 'flask', 2, { jug: 2, cinder_gland: 1, powder: 1 }, { col: [255, 138, 61] });
R('pot', 'frostflask', 2, { jug: 2, snow: 3, glass_wing: 1 }, { col: [180, 230, 240] }); R('pot', 'frostflask', 2, { jug: 2, snow: 4, salt: 1 }, { col: [180, 230, 240] });
// mason's bench: chisel
R('mason', 'cutstone', 2, { rock: 3 }); R('mason', 'wcut', 4, { rock: 2 }); R('mason', 'anvil', 1, { rock: 6, cutstone: 2 }); R('mason', 'quern', 1, { rock: 6, stick: 2 });
R('mason', 'whetstone', 1, { rock: 2 }); R('mason', 'whetstone', 2, { deepstone: 1 }); R('mason', 'cinderbrick', 4, { deepstone: 3, cinder: 1 }); R('mason', 'wmud', 4, { mudbrick: 1 }); R('mason', 'wbrick', 4, { brick: 1 });
R('mason', 'waystone', 1, { cutstone: 4, shard: 2, geode_core: 1 }); R('mason', 'waystone', 1, { cutstone: 4, shard: 2, hollow_ash: 3 });
// sieve: shake (the output is a draw from what was in it)
R('sieve', null, 0, { gravel: 2 }, { loot: [['flint', .45], ['rock', .4], ['copper_ore', .14], ['tin_ore', .12], ['iron_ore', .07], ['coal', .06]] });
R('sieve', null, 0, { sand: 2 }, { loot: [['snow', .22], ['salt', .2], ['tin_ore', .12], ['glass', .04], ['shard', .03]] });
R('sieve', null, 0, { dirt: 2 }, { loot: [['rock', .35], ['flint', .15], ['bone', .12], ['fiber', .3], ['berries', .06], ['clay', .2]] });
R('sieve', null, 0, { ash: 2 }, { loot: [['cinder', .3], ['charcoal', .25], ['bone', .15], ['shard', .05], ['salt', .1]] });
const ST_NAME2 = { hand: 'by hand', bench: 'Workbench', fire: 'Campfire', wheel: "Potter's Wheel", kiln: 'Kiln', quern: 'Quern', bloom: 'Bloomery', anvil: 'Anvil', loom: 'Loom', rack: 'Drying Rack', pot: 'Cauldron', mason: "Mason's Bench", sieve: 'Sieve', knap: 'Knapping' };
// every input, kept tool and other use of an item, for its tooltip
const USES = {};
function buildUses() {
  const add = (id, s) => { (USES[id] = USES[id] || []); if (!USES[id].includes(s)) USES[id].push(s); };
  for (const r of RECIPES) { const name = r.out ? IT[r.out].name : 'sifting'; for (const k in r.need) add(k, name); for (const k of r.keep || []) add(k, name); if (r.fuel) for (const f of ['charcoal', 'coal', 'peat']) add(f, 'bloomery fuel'); }
  for (const k of KNAP) for (const m of k.mat) add(m, 'knapping a ' + IT[k.out].name.toLowerCase());
  for (const id in IT) { const it = IT[id]; if (it.fuel) add(id, 'fuel'); if (it.type === 'food' || it.type === 'heal') add(id, 'eating'); if (it.type === 'block' || it.type === 'wall') add(id, 'building'); }
  add('stick', 'campfire fuel'); add('log', 'campfire fuel'); add('bark', 'campfire fuel'); add('meat', 'bait'); add('jug', 'carrying water');
}
// ---------------- inventory ----------------
const PACK0 = 20, PACK_MAX = 50;
let INV_N = PACK0;
let inv = [];
const packCap = () => WORLD.arena ? 10 : WORLD.mode === 1 ? PACK_MAX : min(PACK_MAX, PACK0 + (G.worn ? G.worn.size : 0) * 10);
function fitPack() { const n = packCap(); if (inv.length < PACK_MAX) for (let i = inv.length; i < PACK_MAX; i++) inv[i] = null; const over = []; for (let i = n; i < PACK_MAX; i++) if (inv[i]) { over.push(inv[i]); inv[i] = null; } INV_N = n; for (const s of over) { const l = addItem(s.id, s.n); if (l && G.p) spawnDrop(s.id, l, G.p.x + 3, G.p.y + 4); } }
function addItem(id, n = 1) {
  const it = IT[id]; if (!it) return 0; const st = it.stack;
  for (let i = 0; i < INV_N && n > 0; i++) { const s = inv[i]; if (s && s.id === id && s.n < st) { const k = min(n, st - s.n); s.n += k; n -= k; } }
  for (let i = 0; i < INV_N && n > 0; i++) if (!inv[i]) { const k = min(n, st); inv[i] = { id, n: k }; n -= k; }
  if (G.state === 'play') G.dirty = true;
  return n;
}
function countItem(id) { let c = 0; for (let i = 0; i < INV_N; i++) { const s = inv[i]; if (s && s.id === id) c += s.n; } return c; }
function removeItem(id, n) { for (let i = INV_N - 1; i >= 0 && n > 0; i--) { const s = inv[i]; if (s && s.id === id) { const k = min(n, s.n); s.n -= k; n -= k; if (s.n <= 0) inv[i] = null; } } }
function hasRoom(id) { const st = IT[id].stack; for (let i = 0; i < INV_N; i++) { const s = inv[i]; if (!s || (s.id === id && s.n < st)) return true; } return false; }
const hasItem = id => countItem(id) > 0;
// packs are strapped on, not carried: a satchel, a leather pack and a frame pack give +10 slots each
function wearPack(id) { if (!G.worn) G.worn = new Set(); if (G.worn.has(id)) { say('You already wear a ' + IT[id].name.toLowerCase() + '.'); sfx('deny'); return; } removeItem(id, 1); G.worn.add(id); fitPack(); sfx('craft'); G.banner = { text: IT[id].name.toUpperCase(), sub: 'strapped on : ' + INV_N + ' pack slots', t: 0 }; G.dirty = true; }
function nearStation(tile) { const p = G.p, cx = (p.x + 3) / T, cy = (p.y + 10) / T; for (const o of tileObjs.values()) if (o.id === tile && abs(o.x - cx) < 7 && abs(o.y - cy) < 6) return true; return false; }
const FUELS = ['charcoal', 'coal', 'peat'];
function fuelHave() { let n = 0; for (const f of FUELS) n += countItem(f); return n; }
function fuelTake(n) { for (const f of FUELS) { const k = min(n, countItem(f)); removeItem(f, k); n -= k; } }
function canCraft(r) {
  if (WORLD.mode === 1) return true;
  for (const k in r.need) if (countItem(k) < r.need[k]) return false;
  for (const k of r.keep || []) if (!countItem(k)) return false;
  if (r.fuel && fuelHave() < r.fuel) return false;
  return true;
}
function payCraft(r) { if (WORLD.mode === 1) return; for (const k in r.need) removeItem(k, r.need[k]); if (r.fuel) fuelTake(r.fuel); }
function giveCraft(r, n = r.n, q) {
  if (r.ret && WORLD.mode !== 1) for (const k in r.ret) { const l = addItem(k, r.ret[k]); if (l) spawnDrop(k, l, G.p.x + 3, G.p.y + 4); }
  if (!r.out) return;
  const it = IT[r.out];
  if (q && (it.type === 'weapon' || it.type === 'tool') && q > 0) { G.quality = G.quality || {}; G.quality[r.out] = max(G.quality[r.out] || 0, q); }
  const left = addItem(r.out, n); if (left) spawnDrop(r.out, left, G.p.x + 3, G.p.y + 4);
  sfx('craft'); G.flags['crafted_' + r.out] = true; toastItem(r.out, n); onCraft(r.out);
}
// hand recipes are instant
function craft(r) { if (!canCraft(r)) { sfx('deny'); return; } payCraft(r); giveCraft(r); }
// old ids from earlier worlds
const LEGACY = { wood: 'log', stone: 'rock', sandstone: 'clay', husk: 'husk_fiber' };
