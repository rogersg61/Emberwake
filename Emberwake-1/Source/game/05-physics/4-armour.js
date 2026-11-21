// ============================================================
//  Armour.
//  Four places to wear it: head, body, legs, feet. Every piece has its
//  protection and its weight. Protection takes a share off every blow
//  (all of it together: prot / (prot + 60)). Weight, together with the
//  weapon in your hand, puts you in a class, and the class is felt in
//  everything: light is quick on its feet, quick with light blows and in
//  the air; heavy walks slower, jumps lower, digs and dodges shorter, but
//  its heavy blows land harder and it barely flinches. A full set of one
//  material gives that material's gift.
// ============================================================
const GEAR_SLOTS = ['head', 'body', 'legs', 'feet'], GEAR_SHARE = { head: .2, body: .4, legs: .25, feet: .15 };
const GEAR_NAMES = { soft: ['Hood', 'Jerkin', 'Leggings', 'Boots'], crest: ['Cap', 'Cuirass', 'Greaves', 'Boots'], helm: ['Helm', 'Breastplate', 'Cuisses', 'Sabatons'] };
// c: main, shade, dark, light. prot and wt are for the whole set
const AMAT = {
  hide: { n: 'Hide', prot: 8, wt: 4, k: 'soft', c: ['#a07a50', '#7a5a3a', '#4a3220', '#c9a070'], gift: 'swift', set: 'Stalker: you walk 8% faster.' },
  leather: { n: 'Leather', prot: 12, wt: 5, k: 'soft', c: ['#8a5a3a', '#6b4a2f', '#3d2818', '#b07a4a'], gift: 'draw', set: 'Quickdraw: bows draw 20% faster.' },
  padded: { n: 'Padded', prot: 10, wt: 3, k: 'soft', c: ['#8a8296', '#6a6478', '#3d3a4c', '#c9c2d6'], res: { cold: 1 }, gift: 'warm', set: 'Warm: frost never slows you, and you tire less.' },
  bone: { n: 'Bone', prot: 16, wt: 9, k: 'crest', c: ['#e6dccc', '#b8a890', '#8a7a68', '#ffffff'], gift: 'crit', set: 'Ossuary: 6% more critical hits.' },
  chitin: { n: 'Chitin', prot: 22, wt: 8, k: 'crest', c: ['#8a6a9a', '#5a4a6a', '#2a1e36', '#c9a0e0'], res: { poison: 1 }, gift: 'venom', set: 'Venomous: poison cannot touch you, and your blows carry it.' },
  scale: { n: 'Scale', prot: 24, wt: 10, k: 'crest', c: ['#c9a44a', '#8a7a38', '#4a4220', '#f0d070'], res: { fire: .5 }, gift: 'sand', set: 'Sandskin: half damage from fire and heat.' },
  copper: { n: 'Sunmetal', prot: 26, wt: 15, k: 'helm', c: ['#ffd35a', '#c98a2b', '#7a5218', '#fff1a8'], gift: 'bright', set: 'Bright: you shed light, and dig 10% harder.' },
  bronze: { n: 'Sunbronze', prot: 32, wt: 17, k: 'helm', c: ['#f0b060', '#a8702e', '#6a4418', '#ffe0a0'], gift: 'bulwark', set: 'Bulwark: knockback halved.' },
  iron: { n: 'Hollow Iron', prot: 40, wt: 20, k: 'helm', c: ['#cfc3ee', '#8f7fc0', '#5a4a8a', '#efe8ff'], gift: 'anvil', set: 'Anvil: small hits never stagger you.' },
  steel: { n: 'Nightsteel', prot: 50, wt: 18, k: 'helm', c: ['#c5ccd8', '#8a94a4', '#4a5464', '#ffffff'], gift: 'keen', set: 'Keen: 8% more crits, light blows 6% faster.' },
  glass: { n: 'Skyglass', prot: 44, wt: 9, k: 'crest', c: ['#c9fff6', '#6fb9c9', '#3a7a8a', '#ffffff'], res: { cold: 1 }, gift: 'feather', set: 'Featherfall: you jump higher and fall slower.' },
  deep: { n: 'Hollowdeep', prot: 52, wt: 16, k: 'helm', c: ['#8a3a44', '#5a2430', '#2a0e14', '#e0a0a0'], gift: 'hungry', set: 'Hungry: your blows give health back.' },
  ember: { n: 'Embersteel', prot: 60, wt: 18, k: 'helm', c: ['#ffb347', '#e2542b', '#7a2a14', '#fff1a8'], res: { fire: 1, heat: 1 }, gift: 'kindled', set: 'Kindled: fire cannot hurt you, and what strikes you burns.' }
};
// how weight is felt. light/heavy/air/dash/bow are attack types; walk, jump, dodge, mine, swing (tool speed), poise (knockback taken), st (stamina)
const WCLASS = [
  { n: 'LIGHT', col: '#7ddc6f', walk: 1.04, jump: 1.03, dodge: 1.08, light: 1.08, heavy: .93, air: 1.12, dash: 1.1, bow: 1.06, mine: 1.05, swing: .96, poise: 1.1, st: 1.1, d: 'quick light blows, long dashes, strong in the air; heavy blows land softer' },
  { n: 'MEDIUM', col: '#ffd35a', walk: 1, jump: 1, dodge: 1, light: 1, heavy: 1, air: 1, dash: 1, bow: 1, mine: 1, swing: 1, poise: .9, st: 1, d: 'balanced' },
  { n: 'HEAVY', col: '#ff8a3d', walk: .88, jump: .94, dodge: .84, light: .92, heavy: 1.15, air: .85, dash: .86, bow: .9, mine: .9, swing: 1.08, poise: .62, st: .85, d: 'heavy blows land harder and you barely flinch; slower feet, blows, digging and dodges' },
  { n: 'OVERLOADED', col: '#e2483b', walk: .74, jump: .86, dodge: .62, light: .84, heavy: 1.2, air: .65, dash: .7, bow: .8, mine: .8, swing: 1.16, poise: .5, st: .7, d: 'too much to carry: everything is slow, and a high ledge is out of reach' }
];
const WCLASS_AT = [10, 19, 27];
const SET_WT = { maul: 4, sword: 3, spear: 3, fangs: 2, bow: 2, chuks: 3, brawl: 0 };

const HEAD_SPR = {
  soft: ['.LLHHH.', 'LLHHHHH', 'HHhhhhH', 'HHhssys', 'HHhssss', '.HHhss.', '..HHH..'],
  crest: ['..LLL..', '.LHHHHH', 'HHHHHHH', 'HHhssys', 'HHhssss', '.HHhss.', '..HhH..'],
  helm: ['.LLHHH.', 'LHHHHHH', 'HHHHHHH', 'HHddyyd', 'HHHHHHH', '.HHhHH.', '..HHH..']
};
const TORSO_SPR = {
  soft: ['CCCCCC', 'CCCCCc', 'CCeCCc', 'CCCCCc', 'bbbbbb', 'dCCCCc', 'dCCCCd', '.dCCd.'],
  crest: ['LCCCCc', 'CcCcCc', 'CCeCCc', 'cCcCcd', 'bbbbbb', 'dCCCCc', 'dCcCcd', '.dCCd.'],
  helm: ['LLCCCc', 'LCCCCc', 'CCeeCc', 'cCCCCd', 'dbbbbd', 'dCCCCc', 'dCcCcd', '.dCCd.']
};
const GEAR_ICON = {
  head: { soft: ['...aaaaa....', '..aeeaaab...', '.aeaaaaabb..', '.aaabbbbbb..', 'aaab....bb..', 'aab.....cb..', 'aab.....cb..', 'aabb...bcb..', '.aabbbbbc...', '..cccccc....'],
    crest: ['....eee.....', '...eaaab....', '..aaaaaabb..', '.aeaaaaaabb.', '.aaaaaaaabb.', '.abbbbbbbbb.', '.ab......cb.', '.ab......cb.', '..b......c..'],
    helm: ['...aaaaa....', '..aeeaaab...', '.aeaaaaabb..', '.aaaaaaabb..', '.accccccbb..', '.aaaaaaabb..', '.aabaaabbb..', '.aabaaabbb..', '..abbbbbc...', '...cccccc...'] },
  body: ['..aa....aa..', '.aeaa..aaab.', 'aeaaaaaaaabb', 'aaaaaeaaaabb', '.aaaaaaaabb.', '..aaaaaaab..', '..cccccccc..', '..aaaaaaab..', '..aaabbaab..', '...abb.bb...'],
  legs: ['.aaaaaaab.', '.aaaaaaab.', '.aaab.aab.', '.aeab.aab.', '.aeab.aab.', '.aab..aab.', '.aab..aab.', '.cc...cc..'],
  feet: ['.aab...aab..', '.aab...aab..', '.aab...aab..', '.aaab..aaab.', '.aaaab.aaaab', '.ccccc.ccccc']
};
function gearIcon(slot, k, c) {
  const rows = slot === 'head' ? GEAR_ICON.head[k] : GEAR_ICON[slot], src = spr(rows, { a: c[0], b: c[1], c: c[2], e: c[3] });
  const [cv, x] = mk(16, 16); x.drawImage(src, (16 - src.width) >> 1, (16 - src.height) >> 1); return outlined(cv);
}
function buildArmor() {
  for (const m in AMAT) {
    const M = AMAT[m];
    GEAR_SLOTS.forEach((slot, si) => {
      const id = `${m}_${slot}`, f = GEAR_SHARE[slot], name = `${M.n} ${GEAR_NAMES[M.k][si]}`;
      defI(id, { name, type: 'armor', slot, mat: m, prot: max(1, round(M.prot * f)), wt: round(M.wt * f * 10) / 10, stack: 1, icon: gearIcon(slot, M.k, M.c), desc: `${M.n} armour. Full set: ${M.set}` });
      const n = { head: 2, body: 4, legs: 3, feet: 2 }[slot];
      if (m === 'hide') R('bench', id, 1, { hide: n, twine: 1 });
      else if (m === 'leather') R('bench', id, 1, { leather: n, twine: 1 });
      else if (m === 'padded') R('loom', id, 1, { cloth: n + 1, fiber: 2 });
      else if (m === 'bone') R('bench', id, 1, { bone: n * 2, leather: 1, twine: 1 });
      else if (m === 'chitin') R('bench', id, 1, { chitin: n, leather: 1, glue: 1 });
      else if (m === 'scale') R('bench', id, 1, { scale: n + 1, leather: 1, twine: 1 });
      else if (m === 'glass') R('anvil', id, 1, { skyglass: n, leather: 1, skysilk: 1 }, { lvl: 2, q: 1 });
      else if (m === 'deep') R('mason', id, 1, { deepstone: n * 2, hollow_ash: 1, leather: 1 });
      else R('anvil', id, 1, { [m + '_bar']: n, leather: 1 }, { lvl: m === 'copper' || m === 'bronze' ? 1 : 2, q: 1 });
    });
  }
  defI('miners_helm', { name: "Miner's Helm", type: 'armor', slot: 'head', mat: 'copper', prot: 4, wt: 2, stack: 1, light: 1, mine: 1.15, icon: gearIcon('head', 'helm', ['#c98a2b', '#7a5218', '#3a2a10', '#fff1a8']), desc: 'A sunmetal pot with a glowcap lamp on the brow. Lights your way and steadies your swing: digs 15% harder.' });
  R('anvil', 'miners_helm', 1, { copper_bar: 2, glowcap: 2, resin: 1 }, { lvl: 1 });
  defI('rust_shell', { name: 'Rustback Shellplate', type: 'armor', slot: 'body', mat: 'rust', prot: 16, wt: 9, stack: 1, poise: .6, shot: .7, icon: gearIcon('body', 'helm', ['#bd5a36', '#7a3222', '#4a1a12', '#f0a070']), desc: 'A whole rustback shell, strapped on. Very heavy. Arrows and spit glance off it; nothing knocks you far.' });
  R('anvil', 'rust_shell', 1, { rust_plate: 4, leather: 2 }, { lvl: 1 });
}

// ---------------- what you are wearing, summed up ----------------
let GEAR_C = null;
function gearKey() { const W = G.p && heldOf(G.p); return GEAR_SLOTS.map(s => G.gear && G.gear[s] ? G.gear[s].id : '').join(',') + '|' + (W && W.type === 'weapon' ? W.id || W.name : '') + '|' + (G.p && G.p.mastery ? 1 : 0); }
function gearStats() {
  const key = gearKey(); if (GEAR_C && GEAR_C.key === key) return GEAR_C;
  const g = { key, prot: 0, wt: 0, res: {}, mats: {}, tags: new Set(), mine: 1, poise: 1, shot: 1 };
  for (const s of GEAR_SLOTS) {
    const it = G.gear && G.gear[s] && IT[G.gear[s].id]; if (!it) continue;
    g.prot += it.prot * (1 + qBonus(it.id) * .5); g.wt += it.wt; g.mats[it.mat] = (g.mats[it.mat] || 0) + 1;
    if (it.light) g.tags.add('light'); if (it.mine) g.mine *= it.mine; if (it.poise) g.poise *= it.poise; if (it.shot) g.shot *= it.shot;
    const M = AMAT[it.mat]; if (M && M.res) for (const k in M.res) g.res[k] = max(g.res[k] || 0, M.res[k] * .25);
  }
  for (const m in g.mats) if (g.mats[m] === 4 && AMAT[m]) { g.set = m; g.tags.add(AMAT[m].gift); for (const k in AMAT[m].res || {}) g.res[k] = AMAT[m].res[k]; }
  if (g.tags.has('bright')) { g.tags.add('light'); g.mine *= 1.1; }
  if (g.res.heat) g.tags.add('heat');
  const W = G.p && heldOf(G.p), ww = W && W.type === 'weapon' && !W.fist ? (W.wtype && WTYPE[W.wtype] ? WTYPE[W.wtype].sz : SET_WT[W.set] || 2) : 0;
  g.load = g.wt + ww; g.ci = g.load <= WCLASS_AT[0] ? 0 : g.load <= WCLASS_AT[1] ? 1 : g.load <= WCLASS_AT[2] ? 2 : 3; g.cls = WCLASS[g.ci];
  g.prot = round(g.prot); g.dr = g.prot / (g.prot + 60);
  return GEAR_C = g;
}
const gearOn = () => !WORLD.arena && !!G.p;
function gearMul(kind) {
  if (!gearOn()) return blessMul(kind); const g = gearStats(); let v = (g.cls[kind] !== undefined ? g.cls[kind] : 1) * blessMul(kind);
  if (kind === 'mine') v *= g.mine;
  if (kind === 'poise') v *= g.poise * (g.tags.has('bulwark') ? .5 : 1);
  if (kind === 'walk' && g.tags.has('swift')) v *= 1.08;
  if (kind === 'jump' && (g.tags.has('feather') || g.tags.has('prismatic'))) v *= 1.07;
  if (kind === 'bow' && g.tags.has('draw')) v *= 1.2;
  if (kind === 'light' && g.tags.has('keen')) v *= 1.06;
  if (kind === 'st' && g.tags.has('warm')) v *= 1.12;
  if (kind === 'blast') v = 1 - g.dr * .8;
  if (kind === 'walk' || kind === 'jump' || kind === 'st' || kind === 'mine' || kind === 'dodge') v *= boonMul(kind);
  return v;
}
function gearHas(tag) { return gearOn() && gearStats().tags.has(tag); }
function gearRes(kind) { return gearOn() ? max(gearStats().res[kind] || 0, boonRes(kind)) : 0; }
// a blow on the player: armour takes its share
function gearDamage(dmg, o) {
  if (!gearOn()) return dmg; const g = gearStats();
  let d = dmg * (1 - g.dr) * boonMul('taken');
  if (o.fire || o.burn) d *= 1 - gearRes('fire');
  if (o.poison) d *= 1 - gearRes('poison');
  if (o.proj) d *= g.shot;
  return d;
}

// ---------------- putting it on and taking it off ----------------
function wear(id) {
  const it = IT[id]; if (!it || it.type !== 'armor') return false;
  const k = inv.findIndex(s => s && s.id === id); if (k < 0) return false;
  const old = G.gear[it.slot]; G.gear[it.slot] = { id, n: 1 }; inv[k] = old || null;
  GEAR_C = null; G.dirty = true; sfx('craft'); toastGear(it); return true;
}
function toastGear(it) { const g = gearStats(); numPop(G.p.x + 3, G.p.y - 6, `${it.name}`, '#e8edf2', .8); G.gearNote = { t: 0, text: `PROT ${g.prot}  ${g.cls.n}` + (g.set ? `  ${AMAT[g.set].n.toUpperCase()} SET` : ''), col: g.cls.col }; }
function gearSlotClick(slot) {
  const h = UI.held, cur = G.gear[slot];
  if (slot === 'off') { if (h && (!IT[h.id] || IT[h.id].type !== 'weapon' || h.n > 1)) { sfx('deny'); return; } G.gear.off = h ? { id: h.id, n: 1 } : null; UI.held = cur || null; GEAR_C = null; G.dirty = true; sfx('ui'); return; }
  if (h) { const it = IT[h.id]; if (!it || it.type !== 'armor' || it.slot !== slot) { sfx('deny'); return; } G.gear[slot] = { id: h.id, n: 1 }; UI.held = cur || null; GEAR_C = null; toastGear(it); }
  else if (cur) { UI.held = cur; G.gear[slot] = null; GEAR_C = null; }
  G.dirty = true; sfx('ui');
}

// ---------------- how it looks on you ----------------
let GSKIN = { key: '', sk: null };
// a friend's armour, from what their game says they wear
function gearSkinOf(f) { if (!f.gskin || f.gskin.key !== f.grKey + ':' + f.skin) { const keep = G.gear, kc = GSKIN; G.gear = f.gearObj; GSKIN = { key: '', sk: null }; const sk = gearSkin(SK[f.skin] || SK[0], f.skin, true); G.gear = keep; GSKIN = kc; f.gskin = { key: f.grKey + ':' + f.skin, sk }; } return f.gskin.sk; }
function gearSkin(base, skin, any) {
  if (!any && !gearOn()) return base;
  const key = skin + ':' + GEAR_SLOTS.map(s => G.gear[s] ? G.gear[s].id : '').join(',');
  if (GSKIN.key === key) return GSKIN.sk;
  const S = Object.assign({}, base), s0 = SKINS[skin] || SKINS[0], face = skin === 4 ? '#d8d4e6' : '#e9b999', eye = skin === 4 ? '#8ff5e6' : '#ffd35a';
  const colOf = it => it.mat === 'rust' ? ['#bd5a36', '#7a3222', '#4a1a12', '#f0a070'] : it.id === 'miners_helm' ? ['#c98a2b', '#7a5218', '#3a2a10', '#fff1a8'] : AMAT[it.mat].c;
  const kOf = it => it.id === 'miners_helm' ? 'helm' : it.mat === 'rust' ? 'helm' : AMAT[it.mat].k;
  const hd = G.gear.head && IT[G.gear.head.id], bd = G.gear.body && IT[G.gear.body.id], lg = G.gear.legs && IT[G.gear.legs.id], ft = G.gear.feet && IT[G.gear.feet.id];
  if (hd) { const c = colOf(hd), k = kOf(hd); S.head = spr(HEAD_SPR[k], { L: c[3], H: c[0], h: c[1], d: c[2], s: face, y: hd.mat === 'ember' ? '#ff3b2a' : hd.id === 'miners_helm' ? '#fff1a8' : eye }); S.hx = -3; S.hy = -7; if (hd.id === 'miners_helm') S.lamp = 1; }
  if (bd) { const c = colOf(bd), k = kOf(bd); S.torso = spr(TORSO_SPR[k], { C: c[0], c: c[1], d: c[2], e: k === 'soft' ? s0[4] : c[3], L: c[3], b: k === 'helm' ? c[2] : '#7a5a3a' }); S.arm = c[1]; S.armB = c[2]; }
  if (lg) { const c = colOf(lg); S.leg = c[1]; S.legB = c[2]; }
  if (ft) { const c = colOf(ft); S.boot = c[2]; }
  GSKIN = { key, sk: S }; return S;
}

// ---------------- in the pack screen ----------------
const SLOT_GLYPH = { head: ['.aaa.', 'a...a', 'a...a', '.a.a.'], body: ['aa.aa', 'aaaaa', '.aaa.', '.aaa.'], legs: ['aaaaa', 'aa.aa', 'aa.aa', 'aa.aa'], feet: ['a..a.', 'a..a.', 'aa.aa', '.....'] };
let SLOT_G = null;
function wearAt(i) { const s = inv[i]; if (!s) return; const it = IT[s.id]; if (!it || it.type !== 'armor') return; const old = G.gear[it.slot]; G.gear[it.slot] = { id: s.id, n: 1 }; inv[i] = old || null; GEAR_C = null; G.dirty = true; sfx('craft'); toastGear(it); }
function drawGearPanel(c, x, y) {
  if (!SLOT_G) { SLOT_G = {}; for (const k in SLOT_GLYPH) SLOT_G[k] = spr(SLOT_GLYPH[k], { a: '#3d3a52' }); }
  const g = gearStats(); let tip = null;
  panel(c, x - 5, y - 16, 199, 76, 'WORN'); hit(x - 5, y - 16, 199, 76, () => { });
  GEAR_SLOTS.forEach((s, k) => {
    const sx = x + k * 19, sy = y, hov = inR(sx, sy, 18, 18), cur = G.gear[s], h = UI.held, fits = h && IT[h.id] && IT[h.id].type === 'armor' && IT[h.id].slot === s;
    slotBox(c, sx, sy, fits, hov); if (cur) drawStack(c, cur, sx, sy); else c.drawImage(SLOT_G[s], sx + 6, sy + 7);
    if (hov && cur && !h) tip = itemTip(IT[cur.id]); else if (hov && !cur && !h) tip = [[s.toUpperCase(), '#ffd35a'], ['Drop armour here, or right click it in your pack.', '#b9bdd0']];
    hit(sx, sy, 18, 18, () => gearSlotClick(s));
  });
  { const sx = x + 80, hov = inR(sx, y, 18, 18), cur = G.gear.off, h = UI.held, fits = h && IT[h.id] && IT[h.id].type === 'weapon'; slotBox(c, sx, y, fits, hov); if (cur) drawStack(c, cur, sx, y); else drawText(c, 'OFF', sx + 3, y + 6, '#3d3a52'); if (hov && cur && !h) tip = itemTip(IT[cur.id]); else if (hov && !cur && !h) tip = [['OFF HAND', '#ffd35a'], ['A second weapon. [X] swaps it into your hand. Swap right after a style lands for a pair finisher.', '#b9bdd0']]; hit(sx, y, 18, 18, () => gearSlotClick('off')); }
  const tx = x + 104; textS(c, `PROT ${g.prot}`, tx, y - 1, '#e8edf2'); textS(c, `-${round(g.dr * 100)}%`, tx + 50, y - 1, '#8b8fa3');
  textS(c, `LOAD ${round(g.load * 10) / 10}`, tx, y + 8, '#e8edf2'); textS(c, g.cls.n, tx + 50, y + 8, g.cls.col);
  if (g.set) textS(c, AMAT[g.set].set.split(':')[0].toUpperCase() + ' SET', tx, y + 17, '#ffd35a');
  drawText(c, wrapText(g.cls.d, 188)[0] || '', x - 2, y + 21, '#6a6485');
  { const t2 = drawTrinketRow(c, x, y + 31); if (t2) tip = t2; }
  return tip;
}
function drawGearHud(c) {
  const g = gearStats(); if (!g.prot && g.ci === 1) return;
  const x = 108, y = 3; c.fillStyle = '#120d1f'; c.fillRect(x - 1, y - 1, 9, 10); c.fillStyle = g.cls.col; c.fillRect(x, y, 7, 5); c.fillRect(x + 1, y + 5, 5, 2); c.fillRect(x + 2, y + 7, 3, 1); c.fillStyle = '#120d1f'; c.fillRect(x + 3, y + 1, 1, 5);
  textO(c, String(g.prot), x + 10, y + 1, '#e8edf2'); textS(c, g.cls.n, x + 10, y + 10, g.cls.col);
  const n = G.gearNote; if (n && n.t < 150) { n.t++; c.globalAlpha = clamp((150 - n.t) / 30, 0, 1); textS(c, n.text, x + 10, y + 18, n.col); c.globalAlpha = 1; }
}
