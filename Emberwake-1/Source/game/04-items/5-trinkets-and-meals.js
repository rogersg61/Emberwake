// ============================================================
//  Trinkets and meals: things that work without being held.
//  Trinkets are worn in trinket slots (the WORN panel in your pack).
//  You start with two slots; each guardian you beat for the first time
//  (the Warden, Vesper, the Forge-Keeper, the Slag Tyrant) opens one more.
//  A hot meal from the Hearth Oven gives one boon for a few minutes.
//  Both add up into "boons", which the rest of the game asks about.
// ============================================================
const TRINK_MAX = 6;
const TRINK = {
  quick_ring: { n: 'Quickstep Ring', mul: { walk: 1.07 }, d: 'You walk 7% faster.' },
  spring_anklet: { n: 'Spring Anklet', mul: { jump: 1.08 }, d: 'You jump 8% higher.' },
  miner_charm: { n: "Miner's Charm", mul: { mine: 1.15 }, d: 'You dig 15% faster.' },
  runner_charm: { n: "Runner's Charm", mul: { st: 1.2 }, d: 'Stamina comes back 20% faster.' },
  might_band: { n: 'Band of Might', mul: { dmg: 1.06 }, d: 'Every blow lands 6% harder.' },
  stone_ring: { n: 'Stoneskin Ring', mul: { taken: .92 }, d: 'You take 8% less from every blow.' },
  hunter_eye: { n: "Hunter's Eye", add: { crit: .06 }, d: '6% more critical hits.' },
  glow_amulet: { n: 'Glowstone Amulet', tags: ['glow'], d: 'A soft light hangs around you.' },
  ash_veil: { n: 'Ashen Veil', tags: ['veil'], d: 'A wider window for a perfect dodge.' },
  counter_sigil: { n: 'Counter Sigil', mul: { counter: 1.3 }, tags: ['riposte'], d: 'Counters after a perfect dodge hit 30% harder, and you have longer to throw one.' },
  rhythm_bead: { n: 'Rhythm Bead', mul: { flow: 1.12 }, d: 'Follow-ups (CRUSH, BREAK, JUGGLE, SPIKE, SKEWER, RHYTHM) pay 12% more.' },
  thorn_ring: { n: 'Thorn Ring', tags: ['thorn'], d: 'Whatever hits you up close takes a quarter of it back.' },
  fang_necklace: { n: 'Fang Necklace', tags: ['fang'], d: 'Your blows drink a little life back.' },
  ember_heart: { n: 'Ember Heart', tags: ['regen'], d: 'You slowly heal when nothing has hit you for a while.' },
  fortune_charm: { n: 'Fortune Charm', mul: { drop: 1.3 }, d: 'Creatures you fell drop more.' },
  frost_charm: { n: 'Frostward Charm', res: { cold: .6 }, d: 'Cold barely bites.' },
  ash_charm: { n: 'Ashward Charm', res: { fire: .35 }, d: 'Fire and heat hurt a third less.' },
  // left behind by the guardians
  warden_eye: { n: "Warden's Eye", mul: { hdmg: 1.12 }, tags: ['glow'], d: 'Heavy blows land 12% harder, and it glows.', boss: 1 },
  glass_tear: { n: "Vesper's Tear", mul: { dodge: 1.12 }, tags: ['veil'], d: 'Dodges carry further, with a wider perfect window.', boss: 1 },
  keeper_brand: { n: "Keeper's Brand", mul: { taken: .9 }, d: 'Branded by the forge: you take 10% less.', boss: 1 },
  tyrant_scale: { n: "Tyrant's Scale", res: { fire: .5 }, mul: { dmg: 1.05 }, d: 'Fire hurts half as much; blows land 5% harder.', boss: 1 },
  root_bloom: { n: 'Rootbloom', tags: ['regen2'], d: 'You heal steadily, even in a fight.', boss: 1 }
};
// what a hot meal gives
const MEALB = {
  quick: { n: 'QUICK', d: 'you walk 10% faster', mul: { walk: 1.1, jump: 1.04 }, c: '#8ff5e6' },
  hearty: { n: 'HEARTY', d: 'you heal between fights and take 5% less', tags: ['regen'], mul: { taken: .95 }, c: '#ff9a8a' },
  sweet: { n: 'SWEET', d: 'stamina comes back 30% faster', mul: { st: 1.3 }, c: '#ffd35a' },
  warm: { n: 'WARM', d: 'the cold barely touches you', res: { cold: .7 }, c: '#ffb347' },
  glow: { n: 'GLOWING', d: 'you shed a little light', tags: ['glow'], c: '#c8fff0' },
  fierce: { n: 'FIERCE', d: 'your blows land 8% harder', mul: { dmg: 1.08 }, c: '#e2483b' },
  delve: { n: 'DELVING', d: 'you dig 20% faster', mul: { mine: 1.2 }, c: '#b8b2c0' },
  feast: { n: 'FEASTED', d: 'faster, harder, and healing', mul: { dmg: 1.06, walk: 1.06, st: 1.15 }, tags: ['regen'], c: '#fff1a8' }
};
const trinkSlots = () => WORLD.mode === 1 ? TRINK_MAX : min(TRINK_MAX, 2 + ['wardenDead', 'vesperDone', 'keeperDead', 'tyrantDead'].filter(k => G.flags && G.flags[k]).length);
const TRINK_OPEN = ['the Ashen Warden', 'Vesper', 'the Forge-Keeper', 'the Slag Tyrant'];
function trinkFit() { if (!Array.isArray(G.trink)) G.trink = []; while (G.trink.length < TRINK_MAX) G.trink.push(null); }
// everything worn and eaten, added up
let BOON_C = null;
function boons() {
  const n = trinkSlots(), worn = Array.isArray(G.trink) ? G.trink.slice(0, n) : [], m = G.meal && G.meal.t > 0 ? G.meal.k : '';
  const key = worn.join(',') + '|' + m + '|' + (G.rest > 0 ? 1 : 0) + (G.nearWarm ? 1 : 0) + '|' + (WORLD.arena ? 1 : 0);
  if (BOON_C && BOON_C.key === key) return BOON_C;
  const b = { key, mul: {}, add: {}, res: {}, tags: new Set() };
  if (!WORLD.arena) {
    const src = worn.filter(id => id && TRINK[id]).map(id => TRINK[id]);
    if (m && MEALB[m]) src.push(MEALB[m]); if (G.rest > 0) src.push({ tags: ['regen'] }); if (G.nearWarm) src.push({ res: { cold: .8 } });
    for (const s of src) {
      for (const k in s.mul || {}) b.mul[k] = (b.mul[k] || 1) * s.mul[k];
      for (const k in s.add || {}) b.add[k] = (b.add[k] || 0) + s.add[k];
      for (const k in s.res || {}) b.res[k] = max(b.res[k] || 0, s.res[k]);
      for (const t of s.tags || []) b.tags.add(t);
    }
  }
  return BOON_C = b;
}
const boonMul = k => boons().mul[k] || 1, boonAdd = k => boons().add[k] || 0, boonHas = t => boons().tags.has(t), boonRes = k => boons().res[k] || 0;

// ---------------- wearing trinkets ----------------
function wearTrinket(id, slot) {
  if (WORLD.arena || !IT[id] || IT[id].type !== 'trinket') return false; trinkFit(); const n = trinkSlots();
  if (G.trink.slice(0, n).includes(id) && G.trink[slot] !== id) { say('You already wear ' + IT[id].name + '.'); sfx('deny'); return false; }
  const k = slot !== undefined ? slot : G.trink.findIndex((q, i) => i < n && !q);
  if (k < 0 || k >= n) { say(n < TRINK_MAX ? 'Every trinket slot is full. Each guardian you beat opens another.' : 'Every trinket slot is full. Take one off first.'); sfx('deny'); return false; }
  const old = G.trink[k]; G.trink[k] = id; if (old && old !== id) { const l = addItem(old, 1); if (l) spawnDrop(old, l, G.p.x + 3, G.p.y + 4); }
  sfx('craft'); G.gearNote = { text: IT[id].name.toUpperCase(), col: '#b49cff', t: 0 }; G.dirty = true; G.flags.woreTrinket = true; return true;
}
// wear the one in pack slot i
function wearTrinketAt(i) { const s = inv[i]; if (!s || IT[s.id].type !== 'trinket') return; if (wearTrinket(s.id)) { s.n--; if (s.n <= 0) inv[i] = null; } }
// a click on trinket slot k: put the held one on, or take this one off
function trinkSlotClick(k) {
  trinkFit(); const n = trinkSlots(); if (k >= n) { sfx('deny'); return; }
  const h = UI.held, cur = G.trink[k];
  if (h) { if (IT[h.id].type !== 'trinket' || (G.trink.slice(0, n).includes(h.id) && cur !== h.id)) { sfx('deny'); return; } G.trink[k] = h.id; if (--h.n <= 0) UI.held = null; if (cur) { if (UI.held) { const l = addItem(cur, 1); if (l) spawnDrop(cur, l, G.p.x + 3, G.p.y + 4); } else UI.held = { id: cur, n: 1 }; } sfx('craft'); }
  else if (cur) { UI.held = { id: cur, n: 1 }; G.trink[k] = null; sfx('ui'); }
  G.dirty = true;
}
// ---------------- meals ----------------
function startMeal(it) {
  const B = MEALB[it.meal]; if (!B) return; G.meal = { k: it.meal, id: it.id, t: it.mealT || 14400 }; G.dirty = true;
  numPop(G.p.x + 3, G.p.y - 12, B.n, B.c); say(`${it.name}: ${B.d} for ${round((it.mealT || 14400) / 3600)} minutes.`); G.flags.ateMeal = true;
}
function tickMeal() {
  const p = G.p; if (!p || WORLD.arena) return;
  if (G.meal && G.meal.t > 0 && --G.meal.t <= 0) { say('The meal wears off.'); G.meal = null; }
  if (G.rest > 0) G.rest--;
  if (!p.dead && p.hp < p.maxhp && G.state === 'play') {
    if (boonHas('regen2') && G.time % 50 === 0) p.hp = min(p.maxhp, p.hp + 1);
    else if (boonHas('regen') && p.regenT > 300 && G.time % 80 === 0) p.hp = min(p.maxhp, p.hp + 1);
  }
}
function drawMealHud(c) {
  if (WORLD.arena) return; const y = G.bless && G.bless.t > 0 ? 61 : 52; let x = 4;
  if (G.meal && G.meal.t > 0) { const B = MEALB[G.meal.k], s = ceil(G.meal.t / 60); x += textS(c, `MEAL: ${B.n}  ${floor(s / 60)}:${String(s % 60).padStart(2, '0')}`, x, y, G.meal.t < 600 && (G.time >> 3) & 1 ? '#8b8fa3' : B.c) + 8; }
  if (G.rest > 0) textS(c, 'RESTED', x, y, '#ffd35a');
}

// ---------------- the items ----------------
function trinketItems() {
  const I = (rows, p) => outlined(spr(rows, p));
  const SH = {
    ring: ['..ef..', '..ff..', '.abba.', 'a....b', 'a....b', '.bbbb.'],
    band: ['.abba.', 'ab..bc', 'b....c', 'b....c', 'cb..cc', '.cccc.'],
    amulet: ['a.....a', '.a...a.', '..a.a..', '...b...', '..beb..', '.befeb.', '..beb..', '...b...'],
    charm: ['...a...', '..a.a..', '.bbbbb.', 'bceefcb', 'bceefcb', '.bcccb.', '..bbb..'],
    anklet: ['.aaaaa.', 'a.....a', 'a.....a', '.aeaea.', '..f.f..'],
    eye: ['.aaaaa.', 'abbbbba', 'abcfcba', 'abbbbba', '.aaaaa.'],
    bead: ['a.....a', '.b...b.', '..b.b..', '...e...', '..efe..', '...e...'],
    veil: ['..aaa..', '.abbba.', 'abbbbba', 'abbbbba', '.b.b.b.', '.a.a.a.'],
    fangs: ['a.....a', '.a...a.', '..aaa..', '.e.e.e.', '.e.e.e.', '..e.e..'],
    heart: ['.aa.aa.', 'abbabba', 'abbbbba', '.abbba.', '..aba..', '...a...'],
    brand: ['aaaaaaa', 'abbbbba', 'abeeeba', 'abeeeba', '.abbba.', '..aba..', '...a...'],
    scale: ['...a...', '..aba..', '.abebc.', 'abeebbc', '.abbbc.', '..abc..', '...c...'],
    bloom: ['..e.e..', '.eefee.', '..efe..', '.e.b.e.', '...b...', '..bbb..'],
    tear: ['...a...', '..aba..', '.abbba.', 'abbebba', 'abbbbba', '.abbba.', '..aaa..']
  };
  const P = {
    quick_ring: ['ring', { a: '#ffd35a', b: '#c98a2b', e: '#8ff5e6', f: '#ffffff' }], spring_anklet: ['anklet', { a: '#e6edf2', e: '#9fb0bd', f: '#ffd35a' }],
    miner_charm: ['charm', { a: '#c9a44a', b: '#c98a2b', c: '#7a5418', e: '#2a2436', f: '#6a6480' }], runner_charm: ['charm', { a: '#c9a44a', b: '#f0b060', c: '#a8702e', e: '#8ff5e6', f: '#ffffff' }],
    might_band: ['band', { a: '#ffe0a0', b: '#f0b060', c: '#a8702e' }], stone_ring: ['ring', { a: '#cfc3ee', b: '#8f7fc0', e: '#8a8496', f: '#c0bac8' }],
    hunter_eye: ['eye', { a: '#3a2414', b: '#e6edf2', c: '#4a9a8a', f: '#120d1f' }], glow_amulet: ['amulet', { a: '#c9a44a', b: '#6ff0c0', e: '#c8fff0', f: '#ffffff' }],
    ash_veil: ['veil', { a: '#8d8794', b: '#d6d0dc' }], counter_sigil: ['charm', { a: '#cfd6e0', b: '#8a94a4', c: '#4a5464', e: '#8ff5e6', f: '#ffffff' }],
    rhythm_bead: ['bead', { a: '#c9a44a', b: '#e6dccc', e: '#e2483b', f: '#ffd35a' }], thorn_ring: ['ring', { a: '#cfc3ee', b: '#5a4a6a', e: '#6fae7a', f: '#c8f0b0' }],
    fang_necklace: ['fangs', { a: '#8a5a32', e: '#f4efe6' }], ember_heart: ['heart', { a: '#7a2a14', b: '#ff8a3d' }],
    fortune_charm: ['amulet', { a: '#ffd35a', b: '#c98a2b', e: '#7ddc6f', f: '#ffffff' }], frost_charm: ['charm', { a: '#c9fff6', b: '#8fd0d8', c: '#4a8a9a', e: '#ffffff', f: '#c9fff6' }],
    ash_charm: ['charm', { a: '#ff8a3d', b: '#a3482e', c: '#5a1a0a', e: '#ffd35a', f: '#fff1a8' }],
    warden_eye: ['eye', { a: '#5f5a69', b: '#ffd35a', c: '#ff7a2a', f: '#fff1a8' }], glass_tear: ['tear', { a: '#62a9bc', b: '#c9fff6', e: '#ffffff' }],
    keeper_brand: ['brand', { a: '#3f4656', b: '#6f7888', e: '#ff8a3d' }], tyrant_scale: ['scale', { a: '#ffd35a', b: '#c94a2a', c: '#3a2426', e: '#ff8a3d' }],
    root_bloom: ['bloom', { b: '#2fb8a8', e: '#6ff0c0', f: '#ffffff' }]
  };
  for (const id in TRINK) { const T0 = TRINK[id], [sh, pal] = P[id]; defI(id, { name: T0.n, type: 'trinket', stack: 1, icon: I(SH[sh], pal), desc: T0.d + ' Wear it: right click, or drop it on a trinket slot.' }); }
  // ---- meals and what goes in them ----
  const M = (id, name, rows, pal, desc, o) => defI(id, Object.assign({ name, icon: I(rows, pal), desc }, o));
  const meal = (id, name, rows, pal, food, heal, k, desc, t) => M(id, name, rows, pal, desc, { type: 'food', food, heal, meal: k, buff: k ? 'meal' : undefined, mealT: t, stack: 20 });
  M('flour', 'Reed Flour', ['....a....', '...abb...', '..abbbc..', '.abbebcc.', 'abbbbbccd', 'bccccccdd'], { a: '#ffffff', b: '#efe6d4', c: '#d6c8ae', d: '#a89a80', e: '#ffffff' }, 'Ground reed seed. The oven makes bread and pies of it.');
  M('honey', 'Honey', ['..dd..', '.abba.', 'abbbbc', 'abeebc', 'abbbbc', '.cccc.'], { a: '#fff1a8', b: '#ffb347', c: '#c97a2b', d: '#8a6a48', e: '#ffffff' }, 'From a beehive. Sweet on its own, better in a cake.', { type: 'food', food: 8, heal: 4, stack: 50 });
  const bowl = ['a......c', 'abeeeebc', '.bbbbbc.', '..cccc..'];
  meal('bread', 'Reed Bread', ['..aaaa..', '.abbbba.', 'abebbebc', 'abbbbbbc', '.cccccc.'], { a: '#f0c070', b: '#c98a2b', c: '#8a5a22', e: '#ffe0a0' }, 30, 4, null, 'Plain and filling.');
  meal('berry_pie', 'Emberberry Pie', ['.aaaaaa.', 'abebebea', 'abbbbbbc', 'dddddddd', '.dddddd.'], { a: '#f0c070', b: '#c93a2a', c: '#8a2a1a', d: '#c98a2b', e: '#ff6a4a' }, 35, 6, 'quick', 'A boon: QUICK. You walk faster for 4 minutes.');
  meal('hunter_pie', "Hunter's Pie", ['.aaaaaa.', 'abebebea', 'abbbbbbc', 'dddddddd', '.dddddd.'], { a: '#f0c070', b: '#8a4a2a', c: '#5a2a18', d: '#c98a2b', e: '#c98a5a' }, 50, 10, 'hearty', 'A boon: HEARTY. You heal between fights and take less, for 4 minutes.');
  meal('mush_soup', 'Mushroom Soup', bowl, { a: '#8a5a32', b: '#8a6a48', c: '#4a3220', e: '#c9b4d8' }, 28, 16, null, 'Warm and kind to wounds.');
  meal('honey_cake', 'Honey Cake', ['...e....', '..aaaa..', '.abbbba.', '.ffffff.', '.bbbbbb.', '.cccccc.'], { a: '#fff1a8', b: '#f0c070', c: '#a8702e', e: '#e2483b', f: '#ffb347' }, 40, 8, 'sweet', 'A boon: SWEET. Stamina comes back faster for 4 minutes.');
  meal('fire_roast', 'Fire Roast', ['..abbc..', '.abbbcc.', '.bbebcc.', '.bcccd..', '..cdd...', '...ww...', '....ww..'], PAL.cmeat, 60, 12, 'warm', 'A boon: WARM. The cold barely touches you, for 4 minutes.');
  meal('glow_stew', 'Glowcap Stew', bowl, { a: '#5a4030', b: '#2fb8a8', c: '#1e6a64', e: '#c8fff0' }, 35, 20, 'glow', 'A boon: GLOWING. You shed light for 4 minutes.');
  meal('spiced_jerky', 'Spiced Jerky', ['......ab', '....abbc', '..abbbc.', 'abbebc..', 'bbcc....'], { a: '#ff8a3d', b: '#a83a2a', c: '#5a2018', e: '#ffd35a' }, 30, 0, 'fierce', 'A boon: FIERCE. Your blows land harder for 3 minutes.', 10800);
  meal('miner_stew', "Miner's Stew", bowl, { a: '#5a4030', b: '#a06a40', c: '#6a4028', e: '#e0b080' }, 40, 10, 'delve', 'A boon: DELVING. You dig faster for 4 minutes.');
  meal('wakers_feast', "Waker's Feast", ['.e.f.g..', 'eeefffgg', 'aaaaaaaa', '.bbbbbb.'], { a: '#e6edf2', b: '#8a94a4', e: '#c98a5a', f: '#ff6a4a', g: '#f0c070' }, 100, 40, 'feast', 'A boon: FEASTED. Faster, harder and healing, for 6 minutes.', 21600);
}
// ---- the jeweller's work ----
R('jewel', 'quick_ring', 1, { copper_bar: 2, glass: 1 }); R('jewel', 'spring_anklet', 1, { tin_bar: 2, hide: 1 });
R('jewel', 'miner_charm', 1, { copper_bar: 1, coal: 4, twine: 1 }); R('jewel', 'runner_charm', 1, { bronze_bar: 1, husk_fiber: 2, twine: 1 });
R('jewel', 'might_band', 1, { bronze_bar: 2, bone: 2 }); R('jewel', 'stone_ring', 1, { iron_bar: 2, cutstone: 1 });
R('jewel', 'hunter_eye', 1, { glass: 2, scale: 1, copper_bar: 1 }); R('jewel', 'glow_amulet', 1, { glowcap: 3, glass: 1, twine: 1 });
R('jewel', 'ash_veil', 1, { hollow_ash: 3, cloth: 2 }); R('jewel', 'counter_sigil', 1, { iron_bar: 1, shard: 2, hollow_ash: 2 });
R('jewel', 'rhythm_bead', 1, { bone: 3, resin: 2, shard: 1 }); R('jewel', 'thorn_ring', 1, { iron_bar: 1, chitin: 3 });
R('jewel', 'fang_necklace', 1, { tusk: 2, twine: 2, bone: 2 }); R('jewel', 'ember_heart', 1, { ember_bar: 1, glass: 1, cinder_gland: 1 });
R('jewel', 'fortune_charm', 1, { geode_core: 1, copper_bar: 2, glass: 1 }); R('jewel', 'frost_charm', 1, { skyglass: 1, cloth: 1, tin_bar: 1 });
R('jewel', 'ash_charm', 1, { cinder: 4, rust_plate: 2, bronze_bar: 1 });
// ---- the oven's work ----
R('quern', 'flour', 1, { reed: 3 }); R('quern', 'flour', 2, { reed: 5, husk_fiber: 1 });
R('oven', 'bread', 2, { flour: 2, jug_w: 1 }, { ret: { jug: 1 } }); R('oven', 'berry_pie', 1, { flour: 2, berries: 4 });
R('oven', 'hunter_pie', 1, { flour: 2, cmeat: 2, salt: 1 }); R('oven', 'mush_soup', 2, { fungus: 3, jug_w: 1 }, { ret: { jug: 1 } });
R('oven', 'honey_cake', 1, { flour: 2, honey: 2, berries: 2 }); R('oven', 'fire_roast', 1, { meat: 3, salt: 1, bark: 1 });
R('oven', 'glow_stew', 2, { glowcap: 2, meat: 1, jug_w: 1 }, { ret: { jug: 1 } }); R('oven', 'spiced_jerky', 2, { jerky: 2, cinder_gland: 1 });
R('oven', 'miner_stew', 2, { rmorel: 2, meat: 1, salt: 1 }); R('oven', 'wakers_feast', 1, { hunter_pie: 1, berry_pie: 1, honey_cake: 1 });
R('oven', 'cmeat', 2, { meat: 2 }); R('oven', 'tea', 2, { fiber: 4, jug_w: 1 }, { ret: { jug: 1 } });
// ---------------- saving ----------------
const trinkSave = () => ({ trink: (G.trink || []).map(id => id || ''), meal: G.meal && G.meal.t > 0 ? { k: G.meal.k, id: G.meal.id, t: round(G.meal.t) } : null, rest: round(G.rest || 0) });
function trinkLoad(o) {
  G.trink = []; G.meal = null; G.rest = 0; BOON_C = null; if (!o) { trinkFit(); return; }
  if (Array.isArray(o.trink)) o.trink.slice(0, TRINK_MAX).forEach((id, k) => { G.trink[k] = IT[id] && IT[id].type === 'trinket' ? id : null; });
  trinkFit(); if (o.meal && MEALB[o.meal.k]) G.meal = { k: o.meal.k, id: IT[o.meal.id] ? o.meal.id : '', t: clamp(o.meal.t | 0, 0, 30000) }; G.rest = clamp(o.rest | 0, 0, 40000);
}
