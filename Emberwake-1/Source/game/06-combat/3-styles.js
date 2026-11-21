// ============================================================
//  Fighting styles.
//  Every kind of weapon has five styles of its own, all on V, picked by
//  how you are moving when you press it:
//    I   standing still      II  on the move       III holding S (low)
//    IV  in the air          V   right after a dodge
//  You do not start with them. Using a weapon teaches you a little;
//  drills at a practice post (Juno's in the dojo, or one you build)
//  teach you a lot; Juno will show you the first style of anything you
//  carry to her, and technique scrolls turn up in old chests. Each new
//  rank unlocks the next style and makes every blow with that kind of
//  weapon a little faster and harder.
//  Pairs: carry a second weapon in your off hand ([X] swaps). Land a
//  style, swap within a breath, and the second weapon finishes the job
//  with a pair finisher of its own, a different one for every pairing.
// ============================================================
const STYLE_CTX = ['standing still', 'on the move', 'holding S', 'in the air', 'right after a dodge'], ROMAN = ['I', 'II', 'III', 'IV', 'V'];
const MAST_AT = [10, 45, 120, 240, 420];
const STY_COL = { style: ['#e0a020', '#fff1a8'], pair: ['#3ab8c8', '#e8fffb'], bleed: ['#b8202e', '#ff9a8a'], burn: ['#e2542b', '#ffd35a'], frost: ['#4fd8c8', '#ffffff'], poison: ['#4caf50', '#c8ffb0'], pin: ['#8f7fc0', '#efe8ff'] };
const DEF_TYPE = { sword: 'sword', spear: 'spear', fangs: 'daggers', maul: 'mace', bow: 'recurve', chuks: 'nunchaku' };
// [base form, name, changes]. changes: d dmg, s speed, el status rider, cr craters, st stagger, pull, rc reach, ifr iframes
const STYLES = {
  shortsword: [['sundering_arc', "Tailor's Cross", { d: 1.1, s: .85, el: 'bleed' }], ['flash_draw', 'Quickstep Draw', { ifr: 10 }], ['reaping_sweep', 'Hamstring Cut', { el: 'bleed', st: 60 }], ['talon_dive', 'Kestrel Drop', { d: 1.2 }], ['riposte', 'Needle Answer', { d: 1.3, crit: 1 }]],
  sword: [['skullsplitter', 'Hearth Cleave', { cr: 1, d: 1.1 }], ['wake_lunge', 'Ember Rush', { el: 'burn' }], ['rising_fang', 'Kindling Rise', { d: 1.2 }], ['meteor_drop', 'Falling Coal', { cr: 1, el: 'burn' }], ['cyclone', 'Ash Wheel', { ifr: 10 }]],
  sabre: [['ember_wave', 'Moon Crescent', { d: .9, s: .9 }], ['flash_draw', 'Gale Draw', { d: 1.15, dash: 1.3 }], ['reaping_sweep', 'Reed Cutter', { st: 50 }], ['heaven_spiral', 'Kite Spiral', {}], ['riposte', 'Sabre Answer', { crit: 1, el: 'bleed' }]],
  longsword: [['sundering_arc', 'Long Arc', { rc: 1.15, d: 1.15 }], ['long_thrust', "Pilgrim's Thrust", { dash: 1.2, d: 1.1 }], ['dawnbreaker', 'Dawnbreak', {}], ['crescent_dive', 'Hawk Dive', { d: 1.15 }], ['cyclone', "Knight's Wheel", { rc: 1.1 }]],
  greatsword: [['skullsplitter', 'Executioner', { d: 1.45, s: 1.15, cr: 1, st: 70 }], ['wake_lunge', 'Siege Charge', { d: 1.25 }], ['dawnbreaker', 'Mountain Rise', { d: 1.2 }], ['meteor_drop', 'Falling Tower', { cr: 1, d: 1.3 }], ['cyclone', 'Iron Gale', { d: 1.15 }]],
  cleaver: [['skullsplitter', "Butcher's Chop", { el: 'bleed', cr: 1 }], ['flash_draw', 'Hack Run', { el: 'bleed' }], ['reaping_sweep', 'Hock Cut', { el: 'bleed', st: 60 }], ['talon_dive', 'Meat Hook Drop', { pull: 1 }], ['cyclone', 'Bone Spiral', { el: 'bleed' }]],
  spear: [['skewer', 'Heartseeker', { d: 1.3, rc: 1.15 }], ['gale_rush', 'Wind Runner', { dash: 1.2 }], ['vault', 'Pole Vault Kick', {}], ['heron_dive', 'Heron Strike', { d: 1.2 }], ['riposte', 'Return Thrust', { crit: 1 }]],
  glaive: [['crescent', 'Moon Reaper', { el: 'bleed', d: 1.15 }], ['dragoon', 'Dragoon Rush', {}], ['shin_rake', 'Scythe Sweep', { st: 60 }], ['gyre', 'Gyre Blade', {}], ['windmill', 'Mill Wheel', { ifr: 8 }]],
  trident: [['javelin', 'Sea Throw', { el: 'frost' }], ['impale', 'Triple Skewer', { d: 1.15 }], ['hook', 'Netcast', { pull: 1, st: 40 }], ['skyfall', 'Tide Fall', { el: 'frost', cr: 1 }], ['riposte', 'Fork Turn', { el: 'frost' }]],
  halberd: [['impale', 'Halberd Breach', { d: 1.3, st: 50 }], ['dragoon', 'Charging Axe', { d: 1.2 }], ['hook', 'Rider Hook', { pull: 1 }], ['skyfall', 'Guillotine Drop', { cr: 1, d: 1.25 }], ['windmill', 'Bastion Wheel', { d: 1.15 }]],
  daggers: [['flurry', 'Thousand Needles', { d: 1.1 }], ['shadowstep', 'Shadowstep', { ifr: 12 }], ['hamstring', 'Tendon Cut', { el: 'bleed', st: 50 }], ['needle_drop', 'Needle Rain', {}], ['riposte', 'Backstab', { crit: 1, d: 1.4 }]],
  kama: [['cross_rend', 'Reaping Cross', { el: 'bleed' }], ['ghost_cut', 'Harvest Run', {}], ['hamstring', 'Sickle Hook', { pull: 1, el: 'bleed' }], ['gale_reel', 'Sheaf Spin', {}], ['whirl', 'Threshing Wheel', { el: 'bleed' }]],
  claws: [['thousand', 'Maul of Talons', { d: 1.15 }], ['talon_rush', 'Pounce', { d: 1.15 }], ['gut_rise', 'Gut Rise', { el: 'bleed' }], ['air_nick2', 'Wildcat Flip', { d: 1.2 }], ['coil', 'Coiled Fury', { ifr: 8 }]],
  sai: [['fade', 'Iron Spikes', { d: 1.2 }], ['lunging', 'Prong Lunge', {}], ['gut_rise', 'Trap Rise', { st: 70 }], ['wasp_rise', 'Wasp Ascent', {}], ['riposte', 'Catch and Turn', { st: 80, crit: 1 }]],
  club: [['crater', 'Cave Thump', { cr: 1 }], ['ram', 'Bull Rush', { d: 1.2 }], ['ankle', 'Knee Breaker', { st: 70 }], ['hammerfall', 'Hilltop Drop', { cr: 1 }], ['riposte', 'Return Bonk', { st: 60 }]],
  mace: [['earthsplitter', 'Bell Ringer', { st: 80, cr: 1 }], ['rolling_crush', 'Rolling Thunder', {}], ['sky_arc', 'Chin Splitter', { d: 1.2 }], ['meteor', 'Star Fall', { cr: 1 }], ['grave_spin', 'Flanged Wheel', {}]],
  warhammer: [['cataclysm', 'Worldbreaker', { cr: 1, d: 1.25 }], ['comet', 'Comet Charge', { d: 1.15 }], ['homerun', 'Homerun', { d: 1.2 }], ['meteor', 'Anvil Fall', { cr: 1, d: 1.2 }], ['riposte', "Smith's Answer", { st: 90 }]],
  battleaxe: [['earthsplitter', 'Split Earth', { el: 'bleed', cr: 1 }], ['ram', 'Shield Breaker', { st: 70 }], ['ankle', "Logger's Cut", { el: 'bleed' }], ['moonshot', 'Moon Axe', {}], ['grave_spin', "Woodsman's Wheel", { el: 'bleed' }]],
  greataxe: [['cataclysm', 'Ruin', { cr: 1, d: 1.35, s: 1.1 }], ['comet', 'Avalanche', { d: 1.2 }], ['homerun', "Headsman's Rise", { d: 1.25 }], ['meteor', 'Fall of Kings', { cr: 1, d: 1.3 }], ['grave_spin', 'Red Wheel', { el: 'bleed' }]],
  shortbow: [['double_loose', 'Quick Pair', { s: .85 }], ['slide_shot', 'Running Shot', {}], ['skimmer', 'Skipping Stone', {}], ['air_volley', 'Sparrow Volley', {}], ['backflip_shot', 'Flip and Loose', { ifr: 8 }]],
  recurve: [['power_draw', 'Horn Draw', { st: 50, d: 1.15 }], ['flash_volley', 'Horse Archer', {}], ['ground_burst', 'Burrow Burst', {}], ['sky_helix', 'Helix', {}], ['riposte', 'Return Arrow', { crit: 1 }]],
  longbow: [['sunlance', 'Sunlance', { d: 1.2 }], ['slide_shot', 'Long Slide', { d: 1.2 }], ['mortar', 'Siege Arc', { d: 1.2 }], ['starfall', 'Starfall', {}], ['pinning', 'Pin the Shadow', { st: 60 }]],
  nunchaku: [['figure_eight', 'Figure Eight', {}], ['slide_lash', 'Dragon Slide', {}], ['rising_whip', 'Dragon Tail Rise', { d: 1.2 }], ['helicopter', 'Helicopter', {}], ['bell_toll', 'Bell Toll', { st: 70 }]],
  flail: [['thunderclap', 'Thunderclap', { cr: 1, st: 50 }], ['comet_chain', 'Comet Chain', {}], ['skyward_crack', 'Skyward Crack', { d: 1.2 }], ['hammer_fall', 'Morningstar Fall', { cr: 1 }], ['whirlwind', 'Iron Storm', {}]],
  chainwhip: [['chain_spear', 'Serpent Strike', { pull: 1 }], ['ghost_lash', 'Ghost Lash', { el: 'bleed' }], ['ankle_whip', 'Snare', { st: 70 }], ['air_wheel', 'Wheel of Knives', { el: 'bleed' }], ['halo', 'Halo of Blades', { el: 'bleed' }]]
};
// a pair finisher is done with the weapon you swap to; what you swapped from flavours it
const PAIR_BASE = { sword: ['sundering_arc', 'Cleave', { d: 2.4 }], spear: ['impale', 'Breach', { d: 2.2 }], fangs: ['thousand', 'Frenzy', { d: 1.9 }], maul: ['cataclysm', 'Quake', { d: 2.2, cr: 1 }], bow: ['sunlance', 'Volley', { d: 2 }], chuks: ['whirlwind', 'Storm', { d: 1.8 }] };
const PAIR_SRC = { sword: ['Edge', { el: 'bleed' }], spear: ['Lance', { st: 70 }], fangs: ['Fang', { el: 'poison' }], maul: ['Hammer', { st: 90, cr: 1 }], bow: ['Arrow', { el: 'pin' }], chuks: ['Chain', { pull: 1 }] };
const SET_TITLE = { sword: 'blade', spear: 'pike', fangs: 'pair of fangs', maul: 'maul', bow: 'bow', chuks: 'chain' };

function styleMove(set, base, name, o, extra) {
  const b = MOVESETS[set].moves[base]; if (!b) return null;
  const m = Object.assign({}, b, { name, charge: null, dmg: b.dmg * 1.3 * (o.d || 1), cost: max(b.cost || 0, 10) }, extra);
  if (o.s) { m.wind = round(b.wind * o.s); m.rec = round(b.rec * o.s); }
  if (o.rc) m.reach = (b.reach || 1) * o.rc;
  if (o.ifr) m.iframe = max(b.iframe || 0, o.ifr);
  if (o.st) m.stagger = max(b.stagger || 0, o.st);
  if (o.dash && b.dash) m.dash = Object.assign({}, b.dash, { v: b.dash.v * o.dash });
  if (o.pull) m.kb = [-abs(b.kb ? b.kb[0] : 1.4) - 1.2, b.kb ? b.kb[1] : -.6];
  if (o.crit) m.crit = 1;
  m.el = o.el || null; m.cr = o.cr || 0; m.big = 1;
  return m;
}
function buildStyles() {
  for (const ty in STYLES) {
    const set = WTYPE[ty].set;
    STYLES[ty].forEach(([base, name, o], k) => { const m = styleMove(set, base, name, o, { style: k + 1, styleOf: ty, hint: 'V ' + STYLE_CTX[k] }); if (m) MOVESETS[set].moves[`S_${ty}_${k}`] = m; });
  }
  for (const dst in PAIR_BASE) for (const src in PAIR_SRC) {
    if (src === dst) continue; const [base, word, o] = PAIR_BASE[dst], [sw, so] = PAIR_SRC[src];
    const m = styleMove(dst, base, `${sw} ${word}`, Object.assign({}, o, so), { pair: src, hint: `land a style with a ${SET_TITLE[src]}, then [X] to a ${SET_TITLE[dst]}`, iframe: 12 });
    if (m) { m.cost = 0; m.wind = max(1, round(m.wind * .5)); MOVESETS[dst].moves[`P_${src}_${dst}`] = m; }
  }
}
const isStyleId = id => typeof id === 'string' && (id.startsWith('S_') || id.startsWith('P_'));

// ---------------- mastery ----------------
const weaponType = W => W && !W.fist && W.id !== 'fists' ? W.wtype || DEF_TYPE[W.set] : null;
const masteryXp = ty => (G.mast && G.mast[ty]) || 0;
function styleLevel(ty) { const x = masteryXp(ty); let n = 0; while (n < 5 && x >= MAST_AT[n]) n++; return n; }
function masteryGain(ty, n, quiet) {
  if (!ty || WORLD.arena || !STYLES[ty]) return; if (!G.mast) G.mast = {};
  const before = styleLevel(ty); G.mast[ty] = round((masteryXp(ty) + n) * 100) / 100; const after = styleLevel(ty); G.dirty = true;
  if (after > before) {
    const [, name] = STYLES[ty][after - 1];
    G.banner = { text: `NEW STYLE: ${name.toUpperCase()}`, sub: `${WTYPE[ty].n}, rank ${after}. Press V ${STYLE_CTX[after - 1]}.`, t: 0 };
    sfx('shrine', 0); if (G.p) { sparks(G.p.x + 3, G.p.y + 4, 16, 0, 2.4, ['#ffd35a', '#fff1a8', '#ffffff']); }
    learn('styles');
  }
}
// rank makes every blow with that kind of weapon a little quicker and harder
function styleSpeed(W, id) { const ty = weaponType(W); return 1 + styleLevel(ty) * .025; }
function styleDmg(W, id) { const ty = weaponType(W); return 1 + styleLevel(ty) * .04; }
// called for every blow the player lands
function styleHit(a, e, dmg) {
  const ty = weaponType(a.W), m = a.m, f = a.f; if (!ty) return;
  if (m.el && !e.dead) { if (m.el === 'pin') applyStatus(e, 'pin', f, { side: a.face }); else applyStatus(e, m.el, f, { d: m.el === 'bleed' ? 200 : 140 }); }
  const dummy = e.type === 'dummy';
  if (dummy) { if (masteryXp(ty) < MAST_AT[1]) masteryGain(ty, .34); }
  else masteryGain(ty, (m.style || m.pair ? 1.2 : .6) + (e.dead || e.hp <= 0 ? 2.5 : 0));
  if (m.style || m.pair) { f.pairT = 45; f.pairFrom = a.W.set; f.pairW = a.W.id; if (!a.flourish) { a.flourish = 1; G.hitstop = max(G.hitstop, 3); sparks(e.x + e.w / 2, e.y + e.h / 2, 8, a.face, 2.2, ['#ffd35a', '#ffffff']); } }
  drillHit(a, e);
}

// ---------------- pressing V ----------------
function styleCtx(f, I) { if (f.dodgeGrace > 0 || f.riposte > 0) return 4; if (!f.onGround && f.coyote <= 0) return 3; if (I.down) return 2; if (I.md) return 1; return 0; }
function tryStyle(f, I) {
  if (WORLD.arena || f.dead || G.dialog) return false;
  const W = heldOf(f); if (!W || W.type !== 'weapon') { if (G.time - (G.styleNoteT || -999) > 120) { G.styleNoteT = G.time; say('Styles need a weapon in your hand.'); } return false; }
  if (!(f.state === 'normal' || (f.state === 'attack' && f.atk && f.atk.phase === 2))) { f.styleBuf = 10; return false; }
  const ty = weaponType(W), k = styleCtx(f, I), lvl = styleLevel(ty), def = STYLES[ty] && STYLES[ty][k]; if (!def) { if (G.time - (G.styleNoteT || -999) > 120) { G.styleNoteT = G.time; say('Bare fists have no styles. Make or find a weapon.'); } return false; }
  if (k >= lvl) { sfx('deny'); if (G.time - (G.styleNoteT || -999) > 60) { G.styleNoteT = G.time; say(`Style ${ROMAN[k]} of the ${WTYPE[ty].n.toLowerCase()} is not yours yet. ${MAST_AT[k] - floor(masteryXp(ty))} more mastery: drills at a practice post teach fastest.`); } return false; }
  if (f.stam < 8) { sfx('deny'); return false; }
  const id = `S_${ty}_${k}`, m = MOVESETS[W.set].moves[id]; if (!m) return false;
  if (f.atk) endAttack(f); f.state = 'normal';
  if (!startAttack(f, m.btn, I, id)) return false;
  numPop(f.x + 3, f.y - 10, def[1].toUpperCase(), '#ffd35a', .7); sparks(f.x + 3, f.y + 6, 6, 0, 1.6, ['#ffd35a', '#fff1a8']); sfx('charged', 30);
  if (G.drill) drillNote('style', k);
  return true;
}
// ---------------- the off hand ----------------
function swapOff(f, I) {
  if (WORLD.arena || f.dead || (f.swapCd || 0) > 0) return;
  const off = G.gear.off, cur = inv[G.sel];
  if (!off) { if (G.time - (G.styleNoteT || -999) > 120) { G.styleNoteT = G.time; say('Nothing in your off hand. Put a second weapon in the OFF slot of your pack screen.'); } return; }
  if (cur && IT[cur.id].type !== 'weapon') { sfx('deny'); return; }
  const from = cur && IT[cur.id], fromSet = f.pairT > 0 && cur && cur.id === f.pairW ? f.pairFrom : null;
  if (f.atk && !(fromSet && IT[off.id].set !== fromSet)) endAttack(f);
  inv[G.sel] = off; G.gear.off = cur || null; GEAR_C = null; f.swapCd = 14; G.dirty = true; sfx('swing2', 0);
  const W = IT[off.id];
  // a style just landed: the new weapon finishes it
  if (fromSet && W.set !== fromSet && from) {
    const id = `P_${fromSet}_${W.set}`, m = MOVESETS[W.set].moves[id];
    if (m && styleLevel(weaponType(from)) >= 1 && styleLevel(weaponType(W)) >= 1) {
      if (f.atk) endAttack(f); f.state = 'normal'; f.pairT = 0;
      if (startAttack(f, m.btn, I, id)) {
        if (!G.pairsKnown) G.pairsKnown = new Set();
        if (!G.pairsKnown.has(id)) { G.pairsKnown.add(id); G.banner = { text: `PAIR FINISHER: ${m.name.toUpperCase()}`, sub: `${from.name} into ${W.name}`, t: 0 }; sfx('shrine', 0); }
        numPop(f.x + 3, f.y - 10, m.name.toUpperCase(), '#8ff5e6', .8); G.slowT = max(G.slowT || 0, 10); sparks(f.x + 3, f.y + 6, 12, 0, 2.4, ['#8ff5e6', '#ffffff']);
      }
      return;
    }
    if (m && G.time - (G.styleNoteT || -999) > 120) { G.styleNoteT = G.time; say('Learn the first style of both weapons before you pair them.'); }
  }
}
function tickStyles(f, I) {
  { const W = heldOf(f); if (W && W.type === 'weapon' && STYLES[weaponType(W)]) G.lastWType = weaponType(W); }
  if (f.pairT > 0) f.pairT--; if (f.swapCd > 0) f.swapCd--;
  if (f.styleBuf > 0) { f.styleBuf--; if (f.state === 'normal') { f.styleBuf = 0; tryStyle(f, I); } }
}

// ---------------- drills ----------------
// press F at a practice post with a weapon in hand. Follow the calls before the sand runs out.
const DRILL_STEP = {
  L3: { t: 'Land 3 light blows (LMB)', n: 3 }, H1: { t: 'Land a heavy blow (RMB)', n: 1 }, air: { t: 'Land a blow in the air', n: 1 }, dodge: { t: 'Dodge (SHIFT)', n: 1 }, combo5: { t: 'Land 5 blows in quick succession', n: 5 },
  S0: { t: 'Style I: V standing still', n: 1 }, S1: { t: 'Style II: V on the move', n: 1 }, S2: { t: 'Style III: V holding S', n: 1 }, S3: { t: 'Style IV: V in the air', n: 1 }, S4: { t: 'Style V: V right after a dodge', n: 1 }
};
function startDrill(x, y, dummy) {
  const p = G.p, W = heldOf(p);
  if (!W || W.type !== 'weapon') { say('Take a weapon in hand first. The post teaches the weapon you hold.'); sfx('deny'); return; }
  if (G.drill) { endDrill(false, true); return; }
  const ty = weaponType(W), L = styleLevel(ty), pool = ['L3', 'H1', 'air', 'dodge', 'combo5'], steps = [];
  for (let k = 0; k < L; k++) steps.push('S' + k);
  while (steps.length < min(7, 3 + L)) { const s = fpick(pool); if (!steps.includes(s) || s === 'L3') steps.push(s); }
  for (let k = steps.length - 1; k > 0; k--) { const j = (Math.random() * (k + 1)) | 0; [steps[k], steps[j]] = [steps[j], steps[k]]; }
  let d = dummy; if (!d) { d = mkEnemy('dummy', x * T + 1, (y - 2) * T); d.tempPost = 1; G.enemies.push(d); }
  G.drill = { ty, steps, k: 0, n: 0, t: 0, max: 600 + steps.length * 210, dummy: d, lvl: L, hits: [] };
  G.banner = { text: `DRILL: ${WTYPE[ty].n.toUpperCase()}`, sub: `${steps.length} calls. Rank ${L}.`, t: 0 }; sfx('ui');
}
function drillNote(kind, k) {
  const D = G.drill; if (!D) return; const s = D.steps[D.k];
  if (kind === 'dodge' && s === 'dodge') drillAdv();
}
function drillHit(a, e) {
  const D = G.drill; if (!D || e !== D.dummy || weaponType(a.W) !== D.ty) return; const s = D.steps[D.k], m = a.m;
  D.hits.push(G.time); D.hits = D.hits.filter(t => G.time - t < 100);
  if (s === 'L3' && a.btn === 'L' && !m.style && !m.pair) { if (++D.n >= 3) drillAdv(); }
  else if (s === 'H1' && a.btn === 'H' && !m.style) drillAdv();
  else if (s === 'air' && a.air) drillAdv();
  else if (s === 'combo5' && D.hits.length >= 5) drillAdv();
  else if (s[0] === 'S' && m.style === +s[1] + 1 && m.styleOf === D.ty) drillAdv();
}
function drillAdv() { const D = G.drill; D.k++; D.n = 0; sfx('craft'); if (D.dummy) sparks(D.dummy.x + 4, D.dummy.y + 4, 8, 0, 1.8, ['#7ddc6f', '#ffffff']); if (D.k >= D.steps.length) endDrill(true); }
function endDrill(ok, quiet) {
  const D = G.drill; if (!D) return; G.drill = null;
  if (D.dummy && D.dummy.tempPost) G.enemies = G.enemies.filter(e => e !== D.dummy);
  if (ok) { const xp = 20 + 18 * D.lvl; G.banner = { text: 'DRILL COMPLETE', sub: `+${xp} ${WTYPE[D.ty].n.toLowerCase()} mastery`, t: 0 }; masteryGain(D.ty, xp); sfx('shrine', 0); }
  else if (!quiet) { const xp = D.k * 3; say(`Out of time. ${D.k ? `+${xp} mastery for the calls you made.` : 'Again.'}`); if (xp) masteryGain(D.ty, xp); sfx('deny'); }
  else say('You step away from the post.');
}
function tickDrill() {
  const D = G.drill; if (!D) return; D.t++;
  const p = G.p, d = D.dummy; if (!p || p.dead || !d || hypot(p.x - d.x, p.y - d.y) > 140) { endDrill(false, true); return; }
  if (D.t >= D.max) endDrill(false);
}
function drawDrill(c) {
  const D = G.drill; if (!D) return; const w = 170, x = round((VS.uw - w) / 2), y = 30;
  panel(c, x, y, w, 20 + D.steps.length * 9, `DRILL  ${WTYPE[D.ty].n.toUpperCase()}`);
  bar(c, x + 4, y + 13, w - 8, 3, 1 - D.t / D.max, D.max - D.t < 180 && (G.time >> 3) & 1 ? '#ff9a8a' : '#ffd35a', '#5a4a2a');
  D.steps.forEach((s, k) => { const done = k < D.k, cur = k === D.k, st = DRILL_STEP[s]; drawText(c, (done ? '+ ' : cur ? '> ' : '  ') + st.t + (cur && st.n > 1 ? `  ${s === 'combo5' ? D.hits.length : D.n}/${st.n}` : ''), x + 5, y + 19 + k * 9, done ? '#7ddc6f' : cur ? '#ffffff' : '#6a6485'); });
}

// ---------------- the style bar over the hotbar ----------------
function drawStyleHud(c) {
  const p = G.p, W = heldOf(p); if (!W || W.type !== 'weapon' || WORLD.arena) return;
  const ty = weaponType(W); if (!STYLES[ty]) return; const L = styleLevel(ty), k = styleCtx(p, playerInput()), hb = hotbarLayout(), x = hb.x + hotN() * 19 + 30, y = hb.y + 1;
  textS(c, 'V', x - 9, y + 2, '#8b8fa3');
  for (let i = 0; i < 5; i++) { const on = i < L; c.fillStyle = i === k ? '#ffffff' : '#120d1f'; c.fillRect(x + i * 9 - 1, y - 1, 9, 9); c.fillStyle = on ? (i === k ? '#ffd35a' : '#b8902a') : '#2b2740'; c.fillRect(x + i * 9, y, 7, 7); }
  const nx = L < 5 ? MAST_AT[L] : MAST_AT[4], px = L ? MAST_AT[L - 1] : 0, u = L >= 5 ? 1 : clamp((masteryXp(ty) - px) / (nx - px), 0, 1);
  c.fillStyle = '#2b2740'; c.fillRect(x - 1, y + 9, 45, 2); c.fillStyle = '#8ff5e6'; c.fillRect(x - 1, y + 9, round(45 * u), 2);
  const name = k < L ? STYLES[ty][k][1] : `locked (${ROMAN[k]})`; textS(c, name, x - 1, y + 13, k < L ? '#ffd35a' : '#6a6485');
  if (G.gear.off) { c.drawImage(IT[G.gear.off.id].icon, x + 48, y - 4); textS(c, 'X', x + 66, y + 2, p.pairT > 0 && (G.time >> 2) & 1 ? '#8ff5e6' : '#8b8fa3'); }
}
// ---------------- technique scrolls ----------------
function scrollIcon() { return outlined(spr(['.aaaaaaaa.', 'abbbbbbbba', '.accccccb.', '.acddcdcb.', '.accccccb.', '.acdcddcb.', '.accccccb.', 'abbbbbbbba', '.aaaaaaaa.'], { a: '#8a6a48', b: '#c9a070', c: '#efe3c8', d: '#5a4a3a' })); }
function readScroll() {
  const ty = G.lastWType; if (!ty || !STYLES[ty]) { say('The scroll shows a weapon form, but you have no weapon to read it for. Hold one for a moment first.'); sfx('deny'); return; }
  const L = styleLevel(ty); if (L >= 5) { say(`You already know every style of the ${WTYPE[ty].n.toLowerCase()}.`); sfx('deny'); return; }
  removeItem('scroll', 1); masteryGain(ty, MAST_AT[L] - masteryXp(ty) + .01); say(`The scroll shows a form for your ${WTYPE[ty].n.toLowerCase()}.`);
}

// ---------------- the STYLES page of the codex ----------------
function drawStylesPage(c, x, y, w, h, tabs) {
  const W = G.p && heldOf(G.p), ty = W && W.type === 'weapon' ? weaponType(W) : null;
  const known = Object.keys(G.mast || {}).filter(t => STYLES[t]), rows = [];
  panel(c, x, y, w, h, 'STYLES'); hit(x, y, w, h, () => { }); tabs();
  if (!ty || !STYLES[ty]) rows.push({ t: 'Hold a weapon to see its styles.', col: '#b9bdd0' });
  else {
    const L = styleLevel(ty), xp = floor(masteryXp(ty));
    rows.push({ h: `${WTYPE[ty].n.toUpperCase()}  RANK ${L}/5   ${L < 5 ? `${xp}/${MAST_AT[L]} mastery` : 'mastered'}` });
    STYLES[ty].forEach(([, name, o], k) => rows.push({ k, on: k < L, name, ctx: ['still', 'moving', 'holding S', 'in the air', 'after a dodge'][k], rider: [o.el === 'pin' ? 'pins' : o.el ? o.el + 's' : '', o.cr ? 'craters' : '', o.st ? 'staggers' : '', o.pull ? 'pulls' : '', o.crit ? 'always crits' : '', o.ifr ? 'untouchable' : ''].filter(Boolean).join(', ') }));
    rows.push({ h: 'PAIR FINISHERS  land a style, then [X] within a breath' });
    if (G.gear.off) rows.push({ t: `Off hand: ${IT[G.gear.off.id].name}`, col: '#8ff5e6' }); else rows.push({ t: 'Off hand empty: put a weapon in the OFF slot of your pack screen.', col: '#8b8fa3' });
    for (const dst in PAIR_BASE) { if (dst === W.set) continue; const id = `P_${W.set}_${dst}`, m = MOVESETS[dst].moves[id]; if (m) rows.push({ pair: 1, on: G.pairsKnown && G.pairsKnown.has(id), name: m.name, ctx: `into a ${SET_TITLE[dst]}` }); }
  }
  rows.push({ h: 'TRAINING' });
  for (const t of wrapText('Every blow you land teaches you a little; style blows and kills teach more. Drills teach the most: [F] at Juno\'s post in the dojo, or at a Practice Post you build at a workbench. Juno shows you the first style of anything you carry to her. Technique scrolls from old chests teach a whole rank.', w - 20)) rows.push({ t, col: '#b9bdd0' });
  if (known.length) { rows.push({ h: 'YOUR WEAPONS' }); for (const t of known) rows.push({ t: `${WTYPE[t].n}: rank ${styleLevel(t)}/5`, col: '#e8edf2' }); }
  const vis = floor((h - 30) / 10); UI.scroll = clamp(UI.scroll, 0, max(0, rows.length - vis));
  for (let i = 0; i < vis; i++) {
    const r = rows[i + UI.scroll]; if (!r) break; const ry = y + 16 + i * 10;
    if (r.h) { textS(c, r.h, x + 6, ry, '#ffd35a'); continue; } if (r.t) { drawText(c, r.t, x + 8, ry, r.col); continue; }
    c.fillStyle = r.on ? (r.pair ? '#8ff5e6' : '#ffd35a') : '#4a4460'; c.fillRect(x + 7, ry + 1, 3, 5);
    if (r.pair) { drawText(c, r.on ? r.name : '???', x + 13, ry, r.on ? '#fff' : '#8b8fa3'); drawText(c, r.ctx, x + 110, ry, '#8b8fa3'); continue; }
    drawText(c, `${ROMAN[r.k]}  ${r.on ? r.name : '???'}`, x + 13, ry, r.on ? '#fff' : '#8b8fa3'); drawText(c, `V ${r.ctx}`, x + 122, ry, r.on ? '#8ff5e6' : '#6a6485'); if (r.on && r.rider) drawText(c, r.rider, x + 196, ry, '#ffb347');
  }
}
buildStyles();
