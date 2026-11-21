// ============================================================
//  Past the embers: three more tiers, each mined in its own world and worked
//  at a Slagforge (an anvil that runs hot enough for them).
//    Cinderite   (Cinderdeep)  heavy, molten: blows burn and stagger
//    Gloomsteel  (Rootdark)    medium, hungry: blows poison and heal you
//    Prismglass  (Glass Exp.)  light, keen: more crits, blows chill
//  The keys between worlds need a guardian's heart and something only an
//  event drops: wax from the Ember Moon, stars from a Starfall, umbral
//  shards from an Eclipse.
// ============================================================
const NEWMATS = ['cinder', 'gloom', 'prism'], NEWBAR = { cinder: 'cinder_bar', gloom: 'gloom_bar', prism: 'prism_bar' }, NEWGRIP = { cinder: 'stick', gloom: 'rootwood', prism: 'rootwood' };
function dimItemsPre() {
  Object.assign(TMAT, {
    cinder: { n: 'Cinderite', tier: 7, pow: 31, cd: 10, m: '#ffb070', M: '#d8643a', h: '#2a1e1a' },
    gloom: { n: 'Gloomsteel', tier: 8, pow: 38, cd: 9, m: '#8ff5d6', M: '#2fb8a8', h: '#1a2a2a' },
    prism: { n: 'Prismglass', tier: 9, pow: 46, cd: 8, m: '#ffffff', M: '#a58ae0', h: '#2a2440' }
  });
  Object.assign(WMAT, {
    cinder: { n: 'Cinderite', base: 24, w: '#ffe0b0', b: '#ff9a5a', B: '#c94a2a', g: '#5a1a10', h: '#2a1e1a', x: '#ffb347', burn: 1, stag: 1, glow: true, t: 'Molten through: blows burn and stagger.' },
    gloom: { n: 'Gloomsteel', base: 28, w: '#e0fff4', b: '#8ff5d6', B: '#2fb8a8', g: '#0e2a28', h: '#1a2a2a', x: '#6ff0c0', poison: 1, steal: .06, t: 'Drinks the dark: blows poison and give a little life back.' },
    prism: { n: 'Prismglass', base: 33, w: '#ffffff', b: '#f0e4ff', B: '#a58ae0', g: '#4a3a8a', h: '#2a2440', x: '#ffffff', crit: .15, frost: 1, cold: true, t: 'Sharper than sharp: more critical hits, and blows chill.' }
  });
  WLIST.push(['sword', 'cinder'], ['greatsword', 'cinder'], ['warhammer', 'cinder'], ['spear', 'cinder'], ['greataxe', 'cinder'], ['flail', 'cinder'],
    ['longsword', 'gloom'], ['claws', 'gloom'], ['halberd', 'gloom'], ['daggers', 'gloom'], ['longbow', 'gloom'], ['kama', 'gloom'],
    ['sabre', 'prism'], ['greatsword', 'prism'], ['glaive', 'prism'], ['longbow', 'prism'], ['sai', 'prism'], ['mace', 'prism']);
  Object.assign(AMAT, {
    cinder: { n: 'Cinderite', prot: 70, wt: 24, k: 'helm', c: ['#ff9a5a', '#c94a2a', '#5a1a10', '#ffe0b0'], res: { fire: 1, heat: 1 }, gift: 'molten', set: 'Molten: fire cannot hurt you, and whatever strikes you burns.' },
    gloom: { n: 'Gloomsteel', prot: 80, wt: 15, k: 'crest', c: ['#4fd8c8', '#1e6a64', '#0e2a28', '#c8fff0'], res: { poison: 1 }, gift: 'regrowth', set: 'Regrowth: poison cannot touch you, and your wounds close on their own.' },
    prism: { n: 'Prismglass', prot: 90, wt: 9, k: 'crest', c: ['#f0e4ff', '#a58ae0', '#4a3a8a', '#ffffff'], res: { cold: 1 }, gift: 'prismatic', set: 'Prismatic: you jump higher, fall slower, and the void cannot hurt you.' }
  });
}
function dimItemsPost() {
  const PAL2 = {
    cind: { a: '#ffd0a0', b: '#ff8a3d', c: '#c94a2a', d: '#5a1a10', e: '#fff1a8' }, gloo: { a: '#c8fff0', b: '#4fd8c8', c: '#1e6a64', d: '#0e2a28', e: '#ffffff' },
    pris: { a: '#ffffff', b: '#e0c8ff', c: '#a58ae0', d: '#5a4a8a', e: '#9ad0ff' }, slag: { a: '#8a5a4a', b: '#5a3634', c: '#3a2426', d: '#1a1012', e: '#ff7a2a' },
    basa: { a: '#6a7080', b: '#4a5060', c: '#2e323e', d: '#16181e', e: '#8a94a4' }, char: { a: '#b49cd8', b: '#4a3a6a', c: '#2a2236', d: '#120d1f', e: '#e0d2ff' },
    glom: { a: '#4a5a62', b: '#2a3640', c: '#1e262c', d: '#0e1418', e: '#6ff0c0' }, root: { a: '#9a7a6a', b: '#6a4a3a', c: '#4a3228', d: '#2a1a14', e: '#c9a080' },
    shad: { a: '#5a6a7a', b: '#34404c', c: '#28323c', d: '#141a20', e: '#8a9aaa' }, pale: { a: '#ffffff', b: '#e0daea', c: '#b8b0c8', d: '#7a7090', e: '#ffffff' },
    spor: { a: '#c8fff0', b: '#6ff0c0', c: '#2fb8a8', d: '#1e6a64', e: '#ffffff' }, wax: { a: '#ffd8c8', b: '#e86a5a', c: '#a83a3e', d: '#5a1a20', e: '#ffffff' },
    star: { a: '#ffffff', b: '#c9fff6', c: '#8fd0d8', d: '#4a8a9a', e: '#fff1a8' }, umbr: { a: '#e0d2ff', b: '#7a4ad0', c: '#3a1a6a', d: '#120d1f', e: '#ffffff' },
    fang: { a: '#ffffff', b: '#c8d8d0', c: '#6a8a80', e: '#1e2a34' }, silk: { a: '#e0d2ff', b: '#7a6ab0', c: '#3a2a6a', d: '#1a1036', e: '#ffffff' },
    cap: { a: '#c8fff0', b: '#2fb8a8', c: '#1e6a64', d: '#8a9a8a' }
  };
  const M = (id, name, ic, pal, desc, o) => defI(id, Object.assign({ name, icon: icon(ic, typeof pal === 'string' ? PAL2[pal] : pal), desc }, o));
  const Ico = (rows, p) => outlined(spr(rows, p));
  // ---- from the ground ----
  M('cinderite_ore', 'Cinderite Nuggets', 'nug', 'cind', 'Ore that is still molten inside. A Slagforge can work it.');
  M('gloom_ore', 'Gloom Ore', 'nug', 'gloo', 'Cold, faintly glowing ore from the Rootdark.');
  M('prism_ore', 'Prism Ore', 'nug', 'pris', 'It splits light even in the dark.');
  M('cinder_bar', 'Cinderite Bar', 'bar', 'cind', 'Never cools all the way. Heavy gear, burning blades.');
  M('gloom_bar', 'Gloomsteel Bar', 'bar', 'gloo', 'Cinderite folded with spores. It drinks light.');
  M('prism_bar', 'Prismglass Bar', 'bar', 'pris', 'Glass that is harder than steel. The best there is.');
  M('slagrock', 'Slagrock', 'rock', 'slag', 'The ground of Cinderdeep. Place it to build.', { type: 'block', tile: SLAG });
  M('basalt', 'Basalt', 'brick', 'basa', 'Columnar and heavy. Place it to build.', { type: 'block', tile: BASALT });
  M('charglass', 'Charglass', 'flint', 'char', 'Black glass from lava that cooled too fast. Place it to build.', { type: 'block', tile: CHARGLASS });
  M('gloam', 'Gloam Soil', 'pile', 'glom', 'The black soil of the Rootdark. Place 2 to fill a gap.', { type: 'block', tile: GLOAM, cost: 2 });
  M('rootwood', 'Rootwood', 'stick', 'root', 'A length of root as hard as oak. Handles; place it to build.', { type: 'block', tile: ROOTWOOD, fuel: 3 });
  M('capflesh', 'Glowcap Flesh', 'mush', 'cap', 'Springy and glowing. Place it as a ledge you can jump through.', { type: 'block', tile: CAPFLESH });
  M('shadestone', 'Shadestone', 'rock', 'shad', 'Dark stone from under the roots. Place it to build.', { type: 'block', tile: SHADESTONE });
  M('palestone', 'Palestone', 'rock', 'pale', 'The pale rock of the floating isles. Place it to build.', { type: 'block', tile: PALESTONE });
  M('shardglass', 'Shardglass', 'flint', 'pris', 'Lit from inside. Place it to build.', { type: 'block', tile: SHARDGLASS });
  M('glasswalk', 'Glasswalk', 'brick', 'star', 'A crystal plank: solid underfoot, and it lets the light through.', { type: 'block', tile: GLASSWALK, stack: 999 });
  M('spore_dust', 'Spore Dust', 'pile', 'spor', 'Fine, green, alive. Gloomsteel needs it.');
  M('prism_dust', 'Prism Dust', 'pile', 'pris', 'Ground rainbow. Prismglass needs it.');
  // ---- from creatures ----
  M('moth_wax', 'Moth Wax', 'nug', { a: '#fff8d8', b: '#f0d890', c: '#c9a44a', d: '#6a5420', e: '#ffffff' }, 'Lantern moths make it. It burns for days.', { fuel: 6 });
  M('gloam_fang', 'Gloam Fang', 'bone', 'fang', 'Long, black and still sharp.');
  M('void_silk', 'Void Silk', 'cloth', 'silk', 'Woven by nothing. It holds a shape you give it.');
  M('slag_heart', 'Slag Heart', 'rock', 'cind', 'The hot core of a basalt brute.', { fuel: 8 });
  M('moon_wax', 'Moon Wax', 'nug', 'wax', 'Red wax that only drips from things walking under the Ember Moon.');
  M('starshard', 'Starshard', 'flint', 'star', 'A piece of a falling star. Only a Starfall brings them down.');
  M('umbral_shard', 'Umbral Shard', 'flint', 'umbr', 'Cut from an Umbral Knight. Only an Eclipse calls them.');
  // ---- from guardians ----
  defI('tyrant_core', { name: "Tyrant's Core", icon: Ico(['..aaaa..', '.abccba.', 'abcddcba', 'acdeedca', 'acdeedca', 'abcddcba', '.abccba.', '..aaaa..'], { a: '#3a2426', b: '#c94a2a', c: '#ff8a3d', d: '#ffd35a', e: '#ffffff' }), desc: 'The Slag Tyrant\'s heart. Still beating. A Rootward Key needs it.' });
  defI('heartseed', { name: 'Heartseed', icon: Ico(['...aa...', '..abba..', '.abccba.', 'abcddcba', 'abcddcba', '.abccba.', '..bbbb..', '...ee...'], { a: '#1e6a64', b: '#2fb8a8', c: '#6ff0c0', d: '#c8fff0', e: '#6a4a3a' }), desc: 'The Rootmother\'s seed. A Prism Key needs it.' });
  defI('prism_heart', { name: 'Prism Heart', icon: Ico(['...a....', '..aba...', '.abcba..', 'abcdcba.', '.abcba..', '..aba...', '...a....'], { a: '#a58ae0', b: '#e0c8ff', c: '#9ad0ff', d: '#ffffff' }), desc: 'What the Matriarch kept instead of a heart. It makes the Starsplitter, or makes you stronger.' });
  defI('shepherd_bell', { name: "Shepherd's Bell", type: 'summon', summon: 'emoon', stack: 1, icon: Ico(['...aa...', '..abba..', '..bccb..', '.bccccb.', '.bccccb.', 'bccccccb', 'aaaaaaaa', '...dd...'], { a: '#8a84a0', b: '#c8c0d8', c: '#e8e0f0', d: '#ff3b2a' }), desc: 'Ring it at night to call the Ember Moon. It does not break.' });
  // ---- keys, lamps and other ways to call things ----
  const key = (id, name, c1, c2, desc) => defI(id, { name, type: 'key', stack: 1, icon: Ico(['.aaa......', 'a...a.....', 'a.b.abbbbb', 'a...a..b.b', '.aaa...b..'], { a: c1, b: c2 }), desc });
  key('rootkey', 'Rootward Key', '#6ff0c0', '#ff8a3d', 'Touch it to a rift (or a waygate) to open the Rootdark.');
  key('prismkey', 'Prism Key', '#e0c8ff', '#6ff0c0', 'Touch it to a rift (or a waygate) to open the Glass Expanse.');
  const sm = (id, name, ev, pal, desc) => M(id, name, 'lamp', pal, desc, { type: 'summon', summon: ev, stack: 10 });
  sm('moon_lantern', 'Moon Lantern', 'emoon', 'wax', 'Light it at night to call the Ember Moon. Burns out.');
  sm('star_chime', 'Star Chime', 'starfall', 'star', 'Strike it at night to call a Starfall. Breaks.');
  sm('umbral_disc', 'Umbral Disc', 'eclipse', 'umbr', 'Raise it in daylight to call an Eclipse. Breaks.');
  sm('ash_censer', 'Ash Censer', 'ashfall', 'slag', 'Swing it anywhere in the Waking Lands to call down Ashfall. Burns out.');
  sm('heart_draught', 'Heart of the Expanse', 'heart', 'pris', 'Drink it: 20 more health, for good.');
  defI('slagforge', { name: 'Slagforge', type: 'block', tile: SLAGFORGE, stack: 5, icon: Ico(['.aaaaaa.', 'abbbbbba', 'abceecba', 'abcffcba', 'abbbbbba', '.a....a.'], { a: '#1a1216', b: '#4a2a26', c: '#2a1a1c', e: '#ff7a2a', f: '#fff1a8' }), desc: 'An anvil that burns hot enough for cinderite, gloomsteel and prismglass. Place it, then [F].' });
  defI('waygate', { name: 'Waygate', type: 'block', tile: WAYGATE, stack: 5, icon: Ico(['..aaaa..', '.abccba.', 'abcddcba', 'abdeedba', 'abdeedba', 'aabbbbaa'], { a: '#3f3a4c', b: '#8a84a0', c: '#7a4ad0', d: '#b49cff', e: '#ffffff' }), desc: 'A small rift of your own. Place it anywhere to step between the worlds you have opened.' });
  // ---- the new tools ----
  for (const mat of NEWMATS) for (const kind of ['pick', 'axe', 'shovel', 'hammer']) {
    const m = TMAT[mat], s = TSHAPE[kind], held = spr(s.rows, { h: m.h, m: m.m, M: m.M }), id = `${mat}_${kind}`;
    defI(id, { name: `${m.n} ${s.n}`, type: 'tool', kind, tier: m.tier, power: m.pow, cd: m.cd, stack: 1, held, grip: s.grip, icon: rotIcon(held), desc: TOOL_D[kind], mat });
    R('anvil', id, 1, { [NEWBAR[mat]]: kind === 'shovel' ? 2 : 3, [NEWGRIP[mat]]: 2 }, { lvl: 3, q: 1 });
  }
  // ---- recipes for the new weapons and armour ----
  for (const [ty, mt] of WLIST) {
    if (!NEWMATS.includes(mt)) continue; const id = `${mt}_${ty}`, T0 = WTYPE[ty]; if (!IT[id]) continue; const b = NEWBAR[mt], n = max(1, T0.sz);
    const need = T0.set === 'bow' ? { [b]: 2, plank: 1, rope: 1 } : T0.set === 'chuks' ? { chain: 1, [b]: 2, [NEWGRIP[mt]]: 1 } : Object.assign({ [b]: n }, T0.set === 'spear' ? { [NEWGRIP[mt]]: 2 } : T0.sz >= 4 ? { leather: 1 } : { [NEWGRIP[mt]]: 1 });
    R('anvil', id, 1, need, { lvl: 3, q: 1 });
  }
  for (const r of RECIPES) if (IT[r.out] && IT[r.out].type === 'armor' && NEWMATS.includes(IT[r.out].mat)) r.lvl = 3;
  if (IT.prism_greatsword) { defI('starsplitter', Object.assign({}, IT.prism_greatsword, { id: 'starsplitter', name: 'Starsplitter', dmg: round(IT.prism_greatsword.dmg * 1.3), crit: (IT.prism_greatsword.crit || 0) + .1, desc: 'Forged around the Prism Heart. It hums the note the sky made when it broke.' })); R('anvil', 'starsplitter', 1, { prism_heart: 1, prism_bar: 6, starshard: 6 }, { lvl: 3, q: 1 }); }
  FORGE_KIT.push('waygate', 'cinder_pick', 'prism_sabre');
}
// smelting and forging, all at the Slagforge (anvil level 3) except the forge itself
R('anvil', 'slagforge', 1, { slagrock: 12, charglass: 4, ember_bar: 2, cinderite_ore: 6 }, { lvl: 2, q: 1 });
R('anvil', 'cinder_bar', 1, { cinderite_ore: 3, cinder: 1 }, { lvl: 3 });
R('anvil', 'gloom_bar', 1, { gloom_ore: 3, spore_dust: 2 }, { lvl: 3 });
R('anvil', 'prism_bar', 1, { prism_ore: 3, prism_dust: 2 }, { lvl: 3 });
R('anvil', 'waygate', 1, { charglass: 6, cinder_bar: 2, shard: 2 }, { lvl: 3 });
R('anvil', 'rootkey', 1, { tyrant_core: 1, cinder_bar: 5, moon_wax: 3 }, { lvl: 3 });
R('anvil', 'prismkey', 1, { heartseed: 1, gloom_bar: 5, starshard: 4, umbral_shard: 2 }, { lvl: 3 });
R('anvil', 'moon_lantern', 1, { moon_wax: 2, cinder_bar: 1, glass: 1 }, { lvl: 3 });
R('anvil', 'star_chime', 1, { starshard: 2, gloom_bar: 1 }, { lvl: 3 });
R('anvil', 'umbral_disc', 1, { umbral_shard: 1, gloom_bar: 2 }, { lvl: 3 });
R('anvil', 'ash_censer', 1, { cinder: 10, slagrock: 4, cinder_bar: 1 }, { lvl: 3 });
R('anvil', 'heart_draught', 1, { prism_heart: 1, starshard: 2 }, { lvl: 3 });
R('bench', 'glasswalk', 4, { shardglass: 2 }); R('bench', 'capflesh', 2, { gloam: 1, spore_dust: 1 });
// what lies in the other worlds' chests
Object.assign(LOOT_T, {
  riftcache: [['torch', 1, 4, 8], ['salve', 1, 2, 3], ['jerky', .8, 2, 4], ['rope', .5, 1, 2]],
  kilnruin: [['cinderite_ore', .6, 2, 6], ['cinder', .8, 3, 8], ['ember_bar', .3, 1, 2], ['shard', .5, 1, 3], ['salve', .5, 1, 2], ['charglass', .5, 2, 5], ['coal', .5, 2, 5], ['cinder_sword', .06, 1, 1], ['scroll', .12, 1, 1]],
  rootruin: [['gloom_ore', .55, 2, 6], ['spore_dust', .7, 2, 5], ['moth_wax', .5, 1, 3], ['salve', .5, 1, 3], ['glowcap', .6, 2, 4], ['cinder_bar', .3, 1, 2], ['gloom_claws', .06, 1, 1], ['scroll', .14, 1, 1]],
  glassruin: [['prism_ore', .5, 2, 6], ['prism_dust', .7, 2, 5], ['shardglass', .6, 3, 8], ['salve', .6, 1, 3], ['gloom_bar', .3, 1, 2], ['void_silk', .4, 1, 2], ['prism_sai', .06, 1, 1], ['scroll', .16, 1, 1]],
  glassisle: [['prism_ore', .7, 3, 7], ['prism_dust', .6, 2, 4], ['glasswalk', .6, 6, 16], ['salve', .4, 1, 2], ['starshard', .15, 1, 1]]
});
