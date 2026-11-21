// ============================================================
//  The guardians answer offerings, not chance.
//  Every guardian is woken on purpose with an offering made at the
//  Offering Altar, from things you gather and from what the guardian
//  before it left behind. Beating one for the first time leaves a
//  trophy trinket, opens a trinket slot (the first four), and something
//  the next step needs:
//    Ashen Warden   (the shrine)       Ashen Offering  -> Warden's Sigil: the Iron Anvil, Vesper's offering
//    Vesper         (the mirror)       Mirror Offering -> Glass Sigil: the Forge-Keeper's offering
//    Forge-Keeper   (its anvil)        Forge Offering  -> Keeper's Sigil: the Slag Tyrant's offering
//    Slag Tyrant    (Cinderdeep altar) Cinder Offering -> its core: the Rootward Key; slag hearts: the Rootmother's offering
//    Rootmother     (Rootdark altar)   Root Offering   -> its seed: the Prism Key; moth wax: the Matriarch's offering
//    Prism Matriarch (Glass altar)     Prism Offering
//    Pale Shepherd  only walks an Ember Moon you called (Moon Lantern, or its bell)
// ============================================================
const OFFER = {
  ashen_offering: { boss: 'the Ashen Warden', where: 'the shrine' },
  mirror_offering: { boss: 'Vesper', where: 'the mirror' },
  forge_offering: { boss: 'the Forge-Keeper', where: 'the anvil in its hall' },
  cinder_offering: { boss: 'the Slag Tyrant', where: 'the altar in Cinderdeep' },
  root_offering: { boss: 'the Rootmother', where: 'the altar in the Rootdark' },
  prism_offering: { boss: 'the Prism Matriarch', where: 'the altar in the Glass Expanse' }
};
const DIM_OFFER = { slagtyrant: 'cinder_offering', rootmother: 'root_offering', matriarch: 'prism_offering' };
R('altar', 'ashen_offering', 1, { charcoal: 6, copper_bar: 3, bone: 4, resin: 2 });
R('altar', 'mirror_offering', 1, { glass: 4, bronze_bar: 2, salt: 3, warden_sigil: 1 });
R('altar', 'forge_offering', 1, { iron_bar: 5, bronze_bar: 4, coal: 8, glass_sigil: 1 });
R('altar', 'cinder_offering', 1, { slagrock: 10, charglass: 4, cinderite_ore: 3, keeper_sigil: 1 });
R('altar', 'root_offering', 1, { rootwood: 10, capflesh: 6, gloom_ore: 4, slag_heart: 1 });
R('altar', 'prism_offering', 1, { shardglass: 10, palestone: 8, prism_ore: 4, moth_wax: 2 });
function offeringItems() {
  const I = (rows, p) => outlined(spr(rows, p)), bowl = ['...e...', '..efe..', '...e...', 'a.....a', 'abbbbba', '.abbba.', '..ccc..'], disc = ['..aaa..', '.abbba.', 'abcbcba', 'abbcbba', 'abcbcba', '.abbba.', '..aaa..'];
  const off = (id, name, pal) => { const O = OFFER[id], r = RECIPES.find(q => q.out === id); defI(id, { name, type: 'offering', stack: 5, icon: I(bowl, pal), desc: `Wakes ${O.boss}: bring it to ${O.where} and press [F]. Made at an Offering Altar${r ? ' from ' + Object.keys(r.need).map(k => r.need[k] + ' ' + IT[k].name.toLowerCase()).join(', ') : ''}.` }); };
  // the sigils first: the offerings list them
  defI('warden_sigil', { name: "Warden's Sigil", stack: 10, icon: I(disc, { a: '#5f5a69', b: '#8d8794', c: '#ffd35a' }), desc: 'Left by the Ashen Warden. The Iron Anvil and the Mirror Offering need one.' });
  defI('glass_sigil', { name: 'Glass Sigil', stack: 10, icon: I(disc, { a: '#62a9bc', b: '#c9fff6', c: '#ffffff' }), desc: 'Left by Vesper. The Forge Offering needs one.' });
  defI('keeper_sigil', { name: "Keeper's Sigil", stack: 10, icon: I(disc, { a: '#3f4656', b: '#6f7888', c: '#ff8a3d' }), desc: 'Left by the Forge-Keeper. The Cinder Offering needs one.' });
  off('ashen_offering', 'Ashen Offering', { a: '#5f5a69', b: '#8d8794', c: '#3f3a4c', e: '#ffd35a', f: '#ffffff' });
  off('mirror_offering', 'Mirror Offering', { a: '#62a9bc', b: '#c9fff6', c: '#4a8a9a', e: '#8ff5e6', f: '#ffffff' });
  off('forge_offering', 'Forge Offering', { a: '#3f4656', b: '#6f7888', c: '#2a2e3a', e: '#ff8a3d', f: '#ffd35a' });
  off('cinder_offering', 'Cinder Offering', { a: '#3a2426', b: '#c94a2a', c: '#1a1216', e: '#ff7a2a', f: '#fff1a8' });
  off('root_offering', 'Root Offering', { a: '#1e6a64', b: '#2fb8a8', c: '#0e3a36', e: '#6ff0c0', f: '#c8fff0' });
  off('prism_offering', 'Prism Offering', { a: '#a58ae0', b: '#e0c8ff', c: '#5a4a8a', e: '#9ad0ff', f: '#ffffff' });
  // the guardians leave their trophies on the first fall
  BOSSES.slagtyrant.first = [['tyrant_scale', 1, 1]]; BOSSES.rootmother.first = [['root_bloom', 1, 1]];
}
// take the offering, or say what is missing (the world of forge mode needs none)
function payOffering(id) {
  if (WORLD.mode === 1) return true;
  if (hasItem(id)) { removeItem(id, 1); G.flags['offered_' + id] = true; G.dirty = true; return true; }
  const r = RECIPES.find(q => q.out === id), need = r ? Object.keys(r.need).map(k => r.need[k] + ' ' + IT[k].name.toLowerCase()).join(', ') : '';
  say(`It wants ${IT[id].name.replace(/^an? /, 'an ')}: make one at an Offering Altar (${need}).`); sfx('deny'); learn('offerings', true); return false;
}
// a guardian down for the first time: a trinket slot opens (for the first four)
function guardianFirst() { setTimeout(() => { if (G.state !== 'play') return; const n = trinkSlots(); G.note = { text: `A trinket slot opens (${n} now)`, t: 0 }; say(`A new trinket slot opens: you can wear ${n} trinkets now.`); sfx('newmove', 0); }, 2600); }
function sigilDrops(id, first, x, y) { spawnDrop(id, first ? 2 : 1, x, y, 0, -2.6); }
