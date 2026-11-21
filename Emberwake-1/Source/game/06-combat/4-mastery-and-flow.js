// ============================================================
//  MASTERY, FLOW AND ARTS.
//  Moves are learned, not handed out. Each family of weapons (blades,
//  pikes, fangs, mauls, bows, chains, bare hands) starts with its basics:
//  the light chain, a heavy blow, the air chain, and the counter after a
//  perfect dodge. Landing blows with that family teaches the rest:
//    FOOTWORK  the sweep, the launcher, the dive, two more counters
//    FLOW      the lunge, the step back, the close strike, heavy rises and sweeps
//    MASTERY   dash attacks, heavy blows in the air, the last counters
//  (In the arena and the battle royale everyone has everything.)
//
//  Flow: every move sets up another.
//    a sweep knocks the foe DOWN        -> a heavy, or a blow from above, CRUSHES it
//    a launcher puts it in the AIR      -> air blows JUGGLE it, a dive SPIKES it down
//    a counter, lunge or close strike
//      leaves it OPEN                   -> a heavy BREAKS it
//    a hooked or pinned foe             -> a thrust SKEWERS it
//    light blows in a row build RHYTHM  -> the next heavy lands harder
//  Each family leans on its own: blades on rhythm, pikes and chains on
//  skewers, fangs on open foes, mauls on crushing, bows on foes in the air,
//  bare hands on counters.
//
//  A perfect dodge (through a blow at the last moment) opens a counter:
//  plain, rising (aim up), sweeping (hold S), a heavy reversal (RMB), or
//  one from the air.
//
//  Arts: better weapons hold arts of their own. Steel, glass, ember and
//  deep weapons hold the first; cinder ones and the old guardians'
//  weapons the second; gloom, prism and the Starsplitter the third. Land
//  blows with such a weapon and you learn its art; then hold the heavy
//  button until it flares, and let go.
// ============================================================
const FAM_AT = [0, 30, 110, 260], FAM_STEP = ['BASICS', 'FOOTWORK', 'FLOW', 'MASTERY'];
const FAM_NAME = { sword: 'BLADES', spear: 'PIKES', fangs: 'FANGS', maul: 'MAULS', bow: 'BOWS', chuks: 'CHAINS', brawl: 'BARE HANDS' };
// how each family leans: a bigger share of one kind of flow
const FAM_LEAN = { sword: { rhythm: 1.3 }, spear: { skewer: 1.3, open: 1.1 }, fangs: { open: 1.3, counter: 1.1 }, maul: { crush: 1.3 }, bow: { juggle: 1.3, spike: 1.2 }, chuks: { skewer: 1.25, juggle: 1.15 }, brawl: { counter: 1.3, rhythm: 1.15 } };
const FAM_LEAN_T = { sword: 'rhythm into heavies', spear: 'skewering hooked foes', fangs: 'striking open foes', maul: 'crushing downed foes', bow: 'shooting foes in the air', chuks: 'skewering and juggling', brawl: 'counters' };
// the four new counters of each family: rising, sweeping, heavy reversal, from the air
const COUNTER_N = {
  sword: ['Answering Rise', 'Answering Sweep', 'Reversal', 'Falling Answer'],
  spear: ['Upturned Pike', 'Sweeping Answer', 'Turnabout Thrust', 'Stooping Hawk'],
  fangs: ['Gutting Rise', 'Heel Cutter', 'Backstab Reversal', 'Shrike Drop'],
  maul: ['Answering Uppercut', 'Knee Breaker', 'Reversal Blow', 'Answering Fall'],
  bow: ['Answering Volley', 'Low Answer', 'Point-Blank Reversal', 'Plunging Answer'],
  chuks: ['Rising Answer', 'Sweeping Chain', 'Reversal Lash', 'Falling Chain'],
  brawl: ['Counter Uppercut', 'Counter Sweep', 'Reversal Haymaker', 'Counter Stomp']
};
// arts: [name, the move it grows from, what changes]
const ARTS = {
  sword: [['Ember Crescent', 'ember_wave', { dmg: 3.4, reach: 1.3, shake: 7, stop: 8 }],
          ['Cinder Tempest', 'cyclone', { turns: 3, act: 30, multi: 5, dmg: 1.15, iframe: 16, quake: 1.4, quake2: 1 }],
          ['Starfall Rend', 'meteor_drop', { leap: { vx: 2.6, vy: -5.4 }, dmg: 2.4, landShock: { r: 44, dmg: 3.2, kb: [3, -4] }, quake: 1.6, quake2: 1, shake: 8 }]],
  spear: [['Piercing Gale', 'impale', { dmg: 2.8, reach: 1.7, dash: { v: 5.8, t: 12 }, iframe: 10, stop: 6 }],
          ['Molten Lance', 'skewer', { btn: 'H', dmg: 2.7, reach: 1.6, quake: 1.6, launch: 1, shake: 5, stop: 6 }],
          ["Heaven's Pillar", 'sky_lance', { btn: 'H', dmg: 2.2, rise: -5.2, launch: 1, multi: 5, act: 14, shake: 5 }]],
  fangs: [['Hundred Cuts', 'thousand', { dmg: .85, multi: 3, act: 26, dash: { v: 2.4, t: 16 } }],
          ['Ashen Step', 'shadowstep', { btn: 'H', dmg: 2.6, dash: { v: 7, t: 9 }, iframe: 16, stagger: 60, crit: 1 }],
          ['Nightfall', 'whirl', { turns: 3, act: 26, multi: 4, dmg: 1.25, iframe: 12, quake: 1, quake2: 1 }]],
  maul: [['Earthshaker', 'earthsplitter', { dmg: 3.2, quake: 1.6, quake2: 1, shake: 8, stop: 8 }],
         ['Cinder Comet', 'meteor', { leap: { vx: 2.4, vy: -5.6 }, dmg: 2.6, landShock: { r: 46, dmg: 3.6, kb: [3.4, -4.4] }, shake: 9 }],
         ['Worldsplitter', 'cataclysm', { dmg: 4.4, quake: 2, quake2: 1, stop: 10, shake: 10, reach: 1.3 }]],
  bow: [['Ember Volley', 'parting_fan', { dmg: 1, arrows: { n: 7, burst: 2 } }],
        ['Cinder Rain', 'skyfall', { btn: 'H', dmg: 1.05, arrows: { n: 12, rain: 1 } }],
        ['Prism Ray', 'sunlance', { dmg: 4.2, arrows: { n: 1, v: 12, g: 0, pierce: 1 }, stop: 6, shake: 4 }]],
  chuks: [['Iron Cyclone', 'whirlwind', { turns: 3, act: 30, multi: 5, dmg: 1.1, iframe: 10 }],
          ['Chain Comet', 'chain_spear', { dmg: 2.5, reach: 1.9, pull: 1, kb: [-3, -1], stagger: 50 }],
          ['Gloom Halo', 'helicopter', { turns: 4, act: 34, multi: 5, dmg: 1.2, quake: 1.4, quake2: 1, iframe: 12 }]]
};
const ART_BAND = { steel: 1, glass: 1, ember: 1, deep: 1, cinder: 2, gloom: 3, prism: 3 }, ART_ITEM = { kblade: 2, kmaul: 2, vpike: 2, vfangs: 2, starsplitter: 3 };
const ART_NEED = [0, 60, 90, 120], ART_TIER_N = ['', 'steel, glass, ember or deep', 'cinder (or an old guardian\'s weapon)', 'gloom or prism'];
const artBand = W => !W || W.type !== 'weapon' ? 0 : ART_ITEM[W.id] || ART_BAND[W.tier] || 0;

// ---------------- setting the families up ----------------
for (const sn in MOVESETS) {
  const set = MOVESETS[sn], M = set.map, mm = set.moves, nm = COUNTER_N[sn];
  // counters after a perfect dodge, grown from the family's own moves
  const counter = (key, src, name, o) => {
    const b = mm[src]; if (!b) return null;
    const m = Object.assign({}, b, o, { name, counter: 1, cost: 0, charge: undefined, iframe: max(b.iframe || 0, 10), dmg: (b.dmg || 1) * o.mul, stagger: max(b.stagger || 0, o.stagger || 0) });
    delete m.mul; mm[key] = m; return key;
  };
  if (nm && M.rip) {
    M.ripU = counter('c_rise', M.upf || M.up || M.aU, nm[0], { mul: 1.7, launch: 1, stagger: 40, input: 'after a perfect dodge: LMB, aim up' });
    M.ripD = counter('c_sweep', M.down, nm[1], { mul: 1.6, stagger: 60, flow: 'down', input: 'after a perfect dodge: LMB + S' });
    M.ripH = counter('c_heavy', M.h, nm[2], { mul: 1.5, stagger: 80, stop: 7, shake: 4, big: 1, input: 'after a perfect dodge: RMB' });
    M.ripA = counter('c_air', M.aD || M.haD, nm[3], { mul: 1.7, input: 'after a perfect dodge, in the air' });
    if (mm[M.rip]) mm[M.rip] = Object.assign({}, mm[M.rip], { counter: 1 });
  }
  // what each kind of move sets up
  for (const id of [M.down, M.hDown]) if (mm[id] && !mm[id].flow) mm[id] = Object.assign({}, mm[id], { flow: 'down' });
  for (const id of [M.far, M.near, M.dash]) if (mm[id] && !mm[id].flow) mm[id] = Object.assign({}, mm[id], { flow: 'open' });
  if (sn === 'maul') for (const id of [M.h, M.hFwd]) if (mm[id] && !mm[id].flow) mm[id] = Object.assign({}, mm[id], { flow: 'open' }); // mauls break guards
  // arts
  set.arts = [];
  (ARTS[sn] || []).forEach(([name, src, o], k) => {
    const b = mm[src]; if (!b) return; const id = 'art_' + (k + 1);
    mm[id] = Object.assign({}, b, o, { name, art: k + 1, charge: undefined, cost: 0, big: 1, input: 'hold RMB until it flares, then let go' });
    if (o.arrows && b.arrows) mm[id].arrows = Object.assign({}, b.arrows, o.arrows);
    set.arts.push(id);
  });
  // which step teaches each move
  const t = {}, put = (ids, k) => { for (const id of [].concat(ids)) if (id && mm[id] && t[id] === undefined) t[id] = k; };
  put(M.chain, 0); put(M.h, 0); put(M.aChain, 0); put(M.rip, 0);
  put([M.down, M.up, M.aD, M.ripU, M.ripD], 1);
  put([M.far, M.back, M.near, M.upf, M.hUp, M.hDown, M.aU, M.ripH], 2);
  put([M.dash, M.hFwd, M.hBack, M.ha, M.haU, M.haD, M.ripA], 3);
  for (const id in mm) if (mm[id].charge && t[mm[id].charge.into] === undefined) t[mm[id].charge.into] = max(2, t[id] || 0);
  for (const id in mm) if (t[id] === undefined && !mm[id].art && !isStyleId(id)) t[id] = 3;
  set.tier = t;
  // the forms page: the counters and arts get pages of their own
  const into = id => mm[id] && mm[id].charge ? [id, mm[id].charge.into] : [id];
  set.sections = [['GROUND - LIGHT', [...M.chain, M.upf, M.up, M.down, M.far, M.back, M.near]], ['GROUND - HEAVY', [...into(M.h), M.hUp, M.hFwd, M.hDown, M.hBack]],
    ['AIRBORNE', [...M.aChain, M.aU, M.aD, M.ha, M.haU, M.haD]], ['DASH', [M.dash]], ['PERFECT DODGE', [M.rip, M.ripU, M.ripD, M.ripH, M.ripA]], ['ARTS', set.arts.slice()]];
  const seen = new Set(); for (const sec of set.sections) sec[1] = sec[1].filter(id => id && mm[id] && !seen.has(id) && seen.add(id));
  set.sections = set.sections.filter(sec => sec[1].length);
}

// ---------------- what you know ----------------
const famAll = () => WORLD.arena || WORLD.mode === 1;
function famStep(sn) { const x = (G.fam && G.fam[sn]) || 0; let k = 0; while (k < 3 && x >= FAM_AT[k + 1]) k++; return k; }
function famOpen(sn, id) {
  if (famAll()) return true; const set = MOVESETS[sn]; if (!set || !set.tier) return true;
  const t = set.tier[id]; return t === undefined || famStep(sn) >= t;
}
// a move you haven't learned yet becomes the plainest move that fits
function famGate(sn, set, id, btn, c) {
  if (famOpen(sn, id)) return id; const M = set.map;
  if (c.riposte || (set.moves[id] && set.moves[id].counter)) return M.rip;
  const next = ch => { const i = ch.indexOf(c.prev); return ch[i >= 0 && i < ch.length - 1 ? i + 1 : 0]; };
  if (c.air) return btn === 'H' && famOpen(sn, M.ha) ? M.ha : next(M.aChain);
  return btn === 'L' ? next(M.chain) : M.h;
}
function famGain(sn, n) {
  if (famAll() || !MOVESETS[sn]) return; if (!G.fam) G.fam = {};
  const was = famStep(sn); G.fam[sn] = round(((G.fam[sn] || 0) + n) * 10) / 10; const now = famStep(sn);
  if (now > was) {
    const set = MOVESETS[sn], names = Object.keys(set.tier).filter(id => set.tier[id] === now).map(id => set.moves[id].name);
    G.banner = { text: FAM_NAME[sn] + ': ' + FAM_STEP[now], sub: 'new: ' + names.slice(0, 5).join(', ') + (names.length > 5 ? ' and more' : '') + '.  [C] shows them', t: 0 };
    sfx('quest', 0); G.dirty = true;
  }
}
// saves from before moves were learned keep every move their Waker had already used
function famFromKnown(known) {
  const fam = {};
  for (const sn in MOVESETS) { const t = MOVESETS[sn].tier || {}; let k = 0; for (const key of known || []) { const [s, id] = String(key).split(':'); if (s === sn && t[id] !== undefined) k = max(k, t[id]); } if (k) fam[sn] = FAM_AT[k]; }
  return fam;
}

function fightSave() { return { fam: G.fam || {}, arts: [...(G.arts || [])], artk: G.artk || {} }; }
function fightLoad(o, known) {
  G.fam = {}; G.arts = new Set(); G.artk = {};
  if (o && typeof o === 'object' && o.fam && typeof o.fam === 'object') {
    for (const k in o.fam) if (MOVESETS[k] && isFinite(o.fam[k])) G.fam[k] = max(0, +o.fam[k]);
    for (const k of Array.isArray(o.arts) ? o.arts : []) if (typeof k === 'string' && k.length < 12) G.arts.add(k);
    if (o.artk && typeof o.artk === 'object') for (const k in o.artk) if (isFinite(o.artk[k])) G.artk[k] = max(0, +o.artk[k]);
  } else G.fam = famFromKnown(known);
}

// ---------------- arts ----------------
function artFor(W) {
  const b = artBand(W); if (!b || !W.set || !MOVESETS[W.set]) return null; const arts = MOVESETS[W.set].arts || [];
  if (famAll()) return arts[b - 1] || null;
  for (let k = b; k >= 1; k--) if (G.arts && G.arts.has(W.set + k)) return arts[k - 1] || null;
  return null;
}
function artGain(W) {
  const b = artBand(W); if (!b || famAll() || !W.set || !(MOVESETS[W.set].arts || [])[b - 1]) return;
  if (!G.arts) G.arts = new Set(); if (!G.artk) G.artk = {}; const key = W.set + b; if (G.arts.has(key)) return;
  G.artk[key] = (G.artk[key] || 0) + 1;
  if (G.artk[key] >= ART_NEED[b]) {
    G.arts.add(key); const m = MOVESETS[W.set].moves[MOVESETS[W.set].arts[b - 1]];
    G.banner = { text: 'ART: ' + m.name.toUpperCase(), sub: 'hold [RMB] until it flares, then let go', t: 0 }; sfx('quest', 0); G.flash = .3; G.dirty = true;
  }
}
// for the HUD and the forms page: what the weapon in hand holds, and how far along you are
function artLine(W) {
  const b = artBand(W); if (!b || !W.set || !MOVESETS[W.set].arts) return '';
  const own = artFor(W), next = MOVESETS[W.set].moves[MOVESETS[W.set].arts[b - 1]];
  if (G.arts && G.arts.has(W.set + b) || famAll()) return 'ART: ' + next.name + ' (hold RMB)';
  const k = (G.artk && G.artk[W.set + b]) || 0;
  return (own ? 'ART: ' + MOVESETS[W.set].moves[own].name + ' (hold RMB).  ' : '') + 'Learning ' + next.name + ' ' + k + '/' + ART_NEED[b];
}

// ---------------- flow: each move sets up the next ----------------
function flowPay(a, e) {
  const f = a.f, m = a.m, M = a.set.map, root = e.root || e, fl = root.fl || (root.fl = {}), now = G.time, lean = FAM_LEAN[a.setName] || {};
  const heavy = m.btn === 'H', above = m.kind === 'plunge' || !!m.pogo || a.id === M.aD || a.id === M.haD || a.id === M.ripA, thrust = m.kind === 'thrust';
  let mul = 1, tag = '';
  if ((fl.down || 0) > now) { if (heavy || above) { mul *= 1.6 * (lean.crush || 1); tag = 'CRUSH'; fl.down = 0; } else mul *= 1.15; }
  if (stActive(root, 'launched')) {
    if (above) { mul *= 1.6 * (lean.spike || 1); tag = tag || 'SPIKE'; if (!root.ghost) root.vy = max(root.vy || 0, 4.5); }
    else if (a.air) { mul *= 1.3 * (lean.juggle || 1); tag = tag || 'JUGGLE'; if (!root.ghost) root.vy = min(root.vy || 0, -1.3); }
  }
  if ((fl.open || 0) > now) { if (heavy) { mul *= 1.5 * (lean.open || 1); tag = tag || 'BREAK'; fl.open = 0; } else mul *= 1.15 * (lean.open || 1); }
  if (thrust && (stActive(root, 'hook') || stActive(root, 'pin') || stActive(root, 'reel'))) { mul *= 1.5 * (lean.skewer || 1); tag = tag || 'SKEWER'; }
  if (heavy && (f.rhythm || 0) >= 2) { mul *= (1 + .12 * min(4, f.rhythm)) * (lean.rhythm || 1); tag = tag || 'RHYTHM'; }
  if (m.counter && lean.counter) mul *= lean.counter;
  if (heavy) f.rhythm = 0;
  return mul > 1.001 ? { mul: min(2.6, mul), tag } : null;
}
function flowSet(a, e, lk, hx, hy) {
  const m = a.m, f = a.f, root = e.root || e, fl = root.fl || (root.fl = {}), now = G.time;
  if (m.flow === 'down') { fl.down = now + 60; flowTag(root, 'DOWN', '#ffb347'); }
  if (m.flow === 'open' || m.counter) { fl.open = now + 75; flowTag(root, 'OPEN', '#8ff5e6'); }
  if (m.launch && !heavyFoe(root)) flowTag(root, 'AIRBORNE', '#c9b8ff');
  if (m.btn === 'L' && a.set.map.chain.includes(a.id)) f.rhythm = min(4, (f.rhythm || 0) + 1); else if (m.btn === 'L') f.rhythm = max(0, (f.rhythm || 0) - 1);
  if (lk && lk.tag) {
    numPop(hx, hy - 12, lk.tag + '!', '#8ff5e6', 1); sparks(hx, hy, 10, 0, 2.6, ['#8ff5e6', '#ffffff', '#c9fff6']);
    G.combo.pts += 3; G.feed.unshift({ name: lk.tag, fresh: true, isNew: false, t: 0, flow: 1 }); if (G.feed.length > 5) G.feed.pop();
  }
}
// beside the hotbar: how far along the family in your hands is, and its art
function drawFamHud(c) {
  const p = G.p, W = heldOf(p); if (!W || W.type !== 'weapon' || famAll() || !MOVESETS[W.set]) return;
  const hb = hotbarLayout(), x = hb.x, y = hb.y - 22, sn = W.set, st = famStep(sn), xp = (G.fam && G.fam[sn]) || 0;
  const lab = (FAM_NAME[sn] || '') + ' ' + FAM_STEP[st]; textS(c, lab, x, y, '#b9bdd0');
  if (st < 3) { const u = clamp((xp - FAM_AT[st]) / (FAM_AT[st + 1] - FAM_AT[st]), 0, 1), bx = x + textW(lab) + 4; c.fillStyle = '#2b2740'; c.fillRect(bx, y + 2, 40, 3); c.fillStyle = '#ffd35a'; c.fillRect(bx, y + 2, round(40 * u), 3); }
  const al = artLine(W); if (al) textS(c, al, x, y - 9, artFor(W) ? '#8ff5e6' : '#8b8fa3');
  if ((p.rhythm || 0) >= 2) textS(c, 'RHYTHM ' + 'I'.repeat(min(4, p.rhythm)), x + 150, y, '#ffd35a');
}
function flowTag(root, text, col) { root.flT = { text, col, t: G.time + 50 }; }
// small words over foes left open by your last move
function drawFlowTags(c) {
  for (const e of G.enemies) {
    const q = e.flT; if (!q || q.t < G.time || e.dead) continue;
    c.globalAlpha = min(1, (q.t - G.time) / 15); textC(c, q.text, round(e.x + e.w / 2), round(e.y - 11), q.col, 1, textO); c.globalAlpha = 1;
  }
}
