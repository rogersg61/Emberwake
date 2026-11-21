// ============================================================
//  Stations. Every one is worked differently:
//    workbench: saw (long steady strokes)      potter's wheel: raise the wall, keep it centred
//    quern: grind in circles                    bloomery: pump the bellows, hold the heat band
//    anvil: strike on the marks (quality)       loom: A and D on the beat
//    cauldron: stir steady, ladle at the colour mason's bench: chisel along the line
//    sieve: shake it                            knapping: knock off flakes, keep the shape
//    campfire, kiln, drying rack: slots that take time (kiln: fuel, heat, damper)
// ============================================================
const STN = new Map();
const PASSIVE = { fire: 3, kiln: 4, rack: 4 };
const FUELV = { stick: 600, bark: 600, fiber: 200, log: 1800, peat: 2400, charcoal: 3000, coal: 3600, cinder: 1800 };
const FUELQ = { stick: .55, bark: .55, fiber: .4, log: .75, peat: .8, charcoal: 1, coal: 1.1, cinder: 1 };
function stnState(i, t) {
  let s = STN.get(i); if (s && s.t === t) return s;
  s = { t };
  if (t === CHEST) s.items = LOOT.has(i) && !MODS.has(i) ? fillLoot(i, LOOT.get(i)) : new Array(20).fill(null);
  else if (t === FIRE) { s.fuel = 1800; s.q = .75; s.slots = [null, null, null]; }
  else if (t === FURNACE) { s.fuel = 0; s.q = .75; s.temp = 0; s.open = 1; s.slots = [null, null, null, null]; }
  else if (t === RACK) s.slots = [null, null, null, null];
  else if (t === CHARGE) s.fuse = 170;
  else if (t === WAYSTONE) s.name = wayName(i);
  else furnState(s, t, i);
  STN.set(i, s); return s;
}
function wayName(i) { const x = i % WW, b = placeAt(x, (i / WW) | 0); const N = { reach: 'Glassfall', moor: 'Feltmoor', ash: 'Ashrest', scoria: 'Rustgate', fen: 'Mirewatch', thorn: 'Briarhold', dunes: 'Saltway', village: 'Hearth', under: 'Underway', deep: 'Deepway', drift: 'Skyward' }; return (N[b] || 'Waystone') + ' ' + ((i % 89) + 1); }
function stnPlaced(tx, ty, t) {
  const i = ty * WW + tx; STN.delete(i); LOOT.delete(i); const s = stnState(i, t); if (typeof COOP !== 'undefined' && COOP.role && t !== CHARGE) COOP.stns.add(i);
  if (t === BEDROLL || t === BED) { G.respawn = { x: tx, y: ty }; say('You will wake here if you fall.'); }
  if (t === WAYSTONE) { G.flags.waystone = true; say(`The waystone hums awake: ${s.name}.`); }
  if (t === FIRE) { if (!hasItem('flint') && !hasItem('torch') && !hasItem('cinder_gland') && WORLD.mode !== 1) { s.fuel = 0; say('Laid, but not lit. You need flint to strike a spark.'); } else say('The campfire catches. [F] to cook on it.'); }
  if (t === CHARGE) { say('The fuse is lit. Move!'); sfx('fire', 0); }
}
function stnBroken(tx, ty, t) {
  const i = ty * WW + tx, s = STN.get(i), cx = tx * T + 4, cy = ty * T;
  if (s) {
    if (s.items) for (const it of s.items) if (it) spawnDrop(it.id, it.n, cx, cy);
    if (s.slots) for (const sl of s.slots) if (sl && RECIPES[sl.r]) for (const k in RECIPES[sl.r].need) spawnDrop(k, RECIPES[sl.r].need[k], cx, cy);
    STN.delete(i);
  }
  LOOT.delete(i);
  if (UI.open === 'stn' && UI.stn && UI.stn.tx === tx && UI.stn.ty === ty) closeUI();
  if (G.respawn && G.respawn.x === tx && G.respawn.y === ty && (t === BEDROLL || t === BED)) G.respawn = null;
}
const nearFireAt = (tx, ty) => { for (const [i, s] of STN) if ((s.t === FIRE || s.t === FURNACE) && s.fuel > 0 && abs(i % WW - tx) < 6 && abs(((i / WW) | 0) - ty) < 4) return true; return abs(tx - (SPOTS.camp ? SPOTS.camp.x : -99)) < 6; };
function tickStations() {
  for (const [i, s] of STN) {
    const tx = i % WW, ty = (i / WW) | 0; if (tiles[i] !== s.t) { STN.delete(i); continue; }
    if (s.t === FIRE) {
      if (s.fuel > 0) { s.fuel--; for (const sl of s.slots) if (sl) sl.t++; if (G.time % 4 === 0) P(tx * T + 4 + frand(-2, 2), ty * T + 3, frand(-.15, .15), frand(-.9, -.4), 22, fpick(['#ffd35a', '#ff8a3d', '#e2542b']), { glow: 1, g: -.02 }); if (G.time % 30 === 0) P(tx * T + 4, ty * T - 2, frand(-.1, .1), -.3, 80, '#5f5a69', { g: -.004, fr: .99 }); }
    } else if (s.t === FURNACE) {
      const tgt = s.fuel > 0 ? (s.open ? 5 : 1.6) * s.q : 0; s.temp = approach(s.temp, tgt, s.temp < tgt ? .006 : .004);
      if (s.fuel > 0) s.fuel -= s.open ? 2 : 1; if (s.fuel < 0) s.fuel = 0;
      for (const sl of s.slots) if (sl) { const r = RECIPES[sl.r]; if (r && (craftEasy() ? s.fuel > 0 : s.temp >= r.temp && (!r.shut || !s.open))) sl.t++; }
      if (s.temp > 1 && G.time % 6 === 0) P(tx * T + 4 + frand(-3, 3), ty * T - 4, frand(-.1, .1), -.5, 30, s.temp > 3.5 ? '#ffd35a' : '#ff8a3d', { glow: 1, g: -.01 });
    } else if (s.t === RACK) {
      const sun = G.sun > .45 && ty < SKYL[tx] && !walls[i], k = (sun ? 1.5 : 1) * (nearFireAt(tx, ty) ? 1.5 : 1); s.k = k;
      for (const sl of s.slots) if (sl) sl.t += k;
    } else if (s.t === CHARGE) {
      s.fuse--; if (G.time % 2 === 0) P(tx * T + 4, ty * T + 1, frand(-.6, .6), frand(-1.2, -.3), 12, fpick(SPARK), { glow: 1, g: .05 });
      if (s.fuse <= 0) { STN.delete(i); setTile(tx, ty, AIR); blast(tx * T + 4, ty * T + 4); }
    }
  }
  if (UI.open === 'stn' && UI.stn && (abs(UI.stn.tx * T - G.p.x) > 90 || abs(UI.stn.ty * T - G.p.y) > 70)) closeUI();
  if (UI.job) tickJob(UI.job);
}
function stationLights() {
  for (const [i, s] of STN) {
    const x = (i % WW) * T + 4, y = ((i / WW) | 0) * T;
    if (s.t === FIRE && s.fuel > 0) addLight(x, y, .95, .55, .24); else if (s.t === FURNACE && s.temp > .5) addLight(x, y - 2, .3 + s.temp * .1, .14 + s.temp * .05, .05);
    else if (s.t === CHARGE) addLight(x, y, .5, .35, .1);
  }
  for (const o of tileObjs.values()) if (o.id === WAYSTONE) addLight(o.x * T + 4, o.y * T - 6, .25, .18, .45); else if (o.id === BLOOMERY && UI.job && UI.job.kind === 'bloom') addLight(o.x * T + 4, o.y * T - 2, .9, .45, .12);
  const p = G.p; if (p && !p.dead && !G.lampOff && !WORLD.arena) { if (hasUtil('emberlamp')) addLight(p.x + 3, p.y + 6, 1.15, .72, .38); else if (hasUtil('lantern')) addLight(p.x + 3, p.y + 6, .9, .7, .42); }
  if (p && !p.dead && !WORLD.arena && gearHas('light')) addLight(p.x + 3 + p.face * 3, p.y - 1, .8, .75, .5);
  furnLights();
}
// world dressing for stations: flames, a glowing kiln mouth, what hangs on a rack
function drawStationsWorld(w) {
  for (const [i, s] of STN) {
    const x = (i % WW) * T, y = ((i / WW) | 0) * T;
    if (s.t === FIRE && s.fuel > 0) { const f = (G.time >> 2) % 3; w.fillStyle = '#ff8a3d'; w.fillRect(x + 2, y + 3 - f, 4, 4 + f); w.fillStyle = '#ffd35a'; w.fillRect(x + 3, y + 4 - f, 2, 3 + f); w.fillStyle = '#fff1a8'; w.fillRect(x + 3, y + 6, 2, 1); }
    else if (s.t === FURNACE && s.temp > .4) { w.fillStyle = s.temp > 3.5 ? '#ffd35a' : s.temp > 2 ? '#ff8a3d' : '#a3482e'; w.fillRect(x + 2, y + 3, 4, 3); }
    else if (s.t === RACK) for (let k = 0; k < 4; k++) { const sl = s.slots[k]; if (!sl || !RECIPES[sl.r]) continue; const r = RECIPES[sl.r], col = r.out === 'leather' ? '#8a5a32' : r.out === 'jerky' ? '#a8302a' : '#b88e66'; w.fillStyle = col; w.fillRect(x - 1 + k * 3, y + 2, 2, 4 + (k & 1)); }
    else if (s.t === CAULDRON) { }
  }
  drawFurnWorld(w);
}
// ---------------- opening a station ----------------
function openStation(tx, ty) {
  const t = tileAt(tx, ty), kind = STATIONS[t]; if (!kind) return;
  if (kind === 'train') { startDrill(tx, ty); return; }
  if (kind === 'rift') { openRift(tx, ty); return; }
  const L = stnLockedBy(ty * WW + tx); if (L) { say(L.n + ' is using that right now.'); sfx('deny'); return; }
  closeUI(); UI.open = 'stn'; UI.stn = { tx, ty, t, kind, i: ty * WW + tx }; UI.job = null; UI.scroll = 0; UI.msg = null; UI.stnCat = 'all'; sfx('ui');
  stnState(ty * WW + tx, t); netLock(ty * WW + tx, true); G.flags['used_' + kind] = true; learn('stations');
}
function stnList(kind, t) {
  const lvl = kind === 'armr' ? anvilNear() : t === ANVIL2 ? 2 : t === SLAGFORGE ? 3 : 1;
  return RECIPES.map((r, i) => ({ r, i })).filter(e => e.r.st === kind && (e.r.lvl !== 3 || lvl === 3 || G.flags.seen1 || WORLD.mode === 1)).map(e => ({ r: e.r, i: e.i, can: canCraft(e.r) && (!e.r.lvl || e.r.lvl <= lvl), lvlOk: !e.r.lvl || e.r.lvl <= lvl })).sort((a, b) => (b.can - a.can) || (b.lvlOk - a.lvlOk));
}
function stnBox() { const w = min(VS.uw - 10, 372), h = min(VS.uh - 48, 214), x = round((VS.uw - w) / 2), y = round((VS.uh - h) / 2) - 10; return { x, y, w, h }; }
function drawStation(c) {
  const S = UI.stn; if (!S || tileAt(S.tx, S.ty) !== S.t) { closeUI(); return; }
  const B = stnBox(), st = stnState(S.i, S.t); panel(c, B.x, B.y, B.w, B.h, TP[S.t].name.toUpperCase()); hit(B.x, B.y, B.w, B.h, () => { });
  button(c, B.x + B.w - 13, B.y + 1, 12, 10, 'x', () => { closeUI(); sfx('ui'); });
  if (S.kind === 'chest') { drawChest(c, B, st); return; }
  if (S.kind === 'way') { drawWay(c, B, S); return; }
  const L = { x: B.x + 4, y: B.y + 15, w: min(160, B.w * .46 | 0), h: B.h - 19 }, A = { x: L.x + L.w + 5, y: B.y + 15, w: B.w - L.w - 13, h: B.h - 19 };
  // recipes
  const F0 = stnFilter(c, L, stnList(S.kind, S.t)), list = F0.list; L.y += F0.dy; L.h -= F0.dy; const rows = floor((L.h - 2) / 19); UI.scroll = clamp(UI.scroll, 0, max(0, list.length - rows));
  let tip = null;
  for (let k = 0; k < rows; k++) {
    const e = list[k + UI.scroll]; if (!e) break; const r = e.r, x = L.x, y = L.y + k * 19, hov = inR(x, y, L.w, 18), outId = r.out || Object.keys(r.need)[0];
    if (hov) { c.fillStyle = '#2b2740'; c.fillRect(x, y, L.w, 18); }
    slotBox(c, x, y, false, hov && e.can); c.globalAlpha = e.can ? 1 : .4; drawStack(c, { id: outId, n: r.out ? r.n : 1 }, x, y); c.globalAlpha = 1;
    drawText(c, r.out ? IT[r.out].name : 'Sift ' + IT[outId].name.toLowerCase(), x + 21, y + 1, e.can ? '#fff' : '#8b8fa3');
    let nx = x + 21; const parts = Object.keys(r.need).map(q => [`${r.need[q]} ${IT[q].name}`, countItem(q) >= r.need[q] || WORLD.mode === 1]);
    if (r.fuel) parts.push([`${r.fuel} fuel`, fuelHave() >= r.fuel || WORLD.mode === 1]); for (const q of r.keep || []) parts.push([`(${IT[q].name})`, hasItem(q) || WORLD.mode === 1]);
    if (!e.lvlOk) parts.unshift(['needs ' + LVL_NEED[S.kind === 'armr' ? 'armr' : 'anvil'][e.r.lvl], false]);
    for (const [s, ok] of parts) { if (nx > x + L.w - 8) break; nx += drawText(c, s, nx, y + 10, ok ? '#7ddc6f' : '#e2483b') + 4; }
    if (hov) { tip = r.out ? itemTip(IT[r.out]) : [['Shake out of it:', '#ffd35a'], [r.loot.map(l => IT[l[0]].name).join(', '), '#b9bdd0']]; if (r.temp && !craftEasy()) tip.push([`needs heat ${r.temp}${r.shut ? ', damper shut' : ''}`, '#ff8a3d']); if (r.t) tip.push([`takes ${round(r.t / 60)}s`, '#8ff5e6']); if (r.band) tip.push([`heat band ${r.band}`, '#ff8a3d']); }
    hit(x, y, L.w, 18, () => pickRecipe(e, S, st));
  }
  if (list.length > rows) drawText(c, `${UI.scroll + 1}-${min(list.length, UI.scroll + rows)}/${list.length} wheel`, L.x + L.w - 70, B.y + B.h - 9, '#6a6485');
  if (!list.length) drawText(c, UI.stnCan ? 'Nothing you can make yet.' : 'Nothing here.', L.x + 2, L.y + 4, '#8b8fa3');
  // the work area
  c.fillStyle = '#141020'; c.fillRect(A.x, A.y, A.w, A.h);
  if (PASSIVE[S.kind]) drawPassive(c, A, S, st); else if (UI.job) drawJob(c, A, UI.job); else { const hint = GIM[jobKind(S.kind)] && !craftEasy() ? GIM[jobKind(S.kind)].hint : 'Green means you have everything. Shift-click makes five.'; const B0 = BENCHES.find(b => b.st === S.kind), top = B0 ? wrapText(B0.d.replace(/^Workshop\. /, ''), A.w - 12) : []; top.forEach((l, i) => drawText(c, l, A.x + 6, A.y + 8 + i * 10, '#ffd35a')); wrapText('Click something on the left to make it. ' + hint, A.w - 12).forEach((l, i) => drawText(c, l, A.x + 6, A.y + 14 + (top.length + i) * 10, '#b9bdd0')); }
  if (UI.msg) { const m = UI.msg; c.globalAlpha = clamp(m.t / 30, 0, 1); textC(c, m.s, A.x + A.w / 2, A.y + A.h - 12, m.col || '#ffd35a', 1, textO); c.globalAlpha = 1; if (--m.t <= 0) UI.msg = null; }
  if (tip) drawTip(c, tip);
}
const smsg = (s, col) => { UI.msg = { s, col, t: 150 }; };
function pickRecipe(e, S, st) {
  const r = e.r; if (!e.lvlOk) { sfx('deny'); smsg('This needs ' + LVL_NEED[S.kind === 'armr' ? 'armr' : 'anvil'][r.lvl] + '.', '#e2483b'); return; }
  if (!canCraft(r)) { sfx('deny'); smsg('You are missing something.', '#e2483b'); return; }
  if (PASSIVE[S.kind]) {
    const k = st.slots.indexOf(null); if (k < 0) { sfx('deny'); smsg('Every slot is full.', '#e2483b'); return; }
    if ((S.kind === 'fire' || S.kind === 'kiln') && st.fuel <= 0 && craftEasy()) addFuel(st, S.kind === 'fire');
    if ((S.kind === 'fire' || S.kind === 'kiln') && st.fuel <= 0) { sfx('deny'); smsg('It needs fuel: sticks, logs, peat, charcoal or coal.', '#e2483b'); return; }
    payCraft(r); st.slots[k] = { r: e.i, t: 0 }; sfx('place'); return;
  }
  UI.job = SETTINGS.craft === 'hands' && GIM[jobKind(S.kind)] ? makeJob(jobKind(S.kind), r, e.i) : easyJob(r, e.i, keys.ShiftLeft || keys.ShiftRight ? 5 : 1); sfx('ui');
}
const craftEasy = () => SETTINGS.craft !== 'hands';
function easyJob(r, ri, left) { return { kind: 'easy', r, ri, t: 0, need: r.loot ? 40 : r.lvl ? 70 : 45, left, prog: 0 }; }
// ---------------- timed stations: campfire, kiln, drying rack ----------------
function addFuel(st, fire) {
  if (WORLD.mode === 1) { st.fuel = 9999; st.q = 1; return; }
  const order = fire ? ['stick', 'bark', 'log', 'peat', 'charcoal', 'coal', 'cinder'] : ['log', 'charcoal', 'coal', 'peat', 'cinder', 'stick', 'bark'];
  const id = order.find(hasItem); if (!id) { sfx('deny'); smsg('No fuel: sticks, logs, peat, charcoal or coal.', '#e2483b'); return; }
  if (!craftEasy() && st.fuel <= 0 && !hasItem('flint') && !hasItem('torch') && !hasItem('cinder_gland')) { sfx('deny'); smsg('No spark. Carry flint, a torch or a cinder gland.', '#e2483b'); return; }
  removeItem(id, 1); st.fuel = min(fire ? 9000 : 12000, st.fuel + FUELV[id]); st.q = lerp(st.q || .75, FUELQ[id], .6); sfx('fire', 0); smsg(`+ ${IT[id].name}`, '#ffb347');
}
function drawPassive(c, A, S, st) {
  const fire = S.kind === 'fire', kiln = S.kind === 'kiln', x0 = A.x + 6;
  let y = A.y + 6;
  if (fire || kiln) {
    drawText(c, st.fuel > 0 ? (fire ? 'burning' : 'fired') : 'cold', x0, y, st.fuel > 0 ? '#ffb347' : '#8b8fa3'); bar(c, x0 + 46, y + 2, A.w - 112, 4, st.fuel / (fire ? 9000 : 12000), '#ff8a3d', '#a3482e');
    button(c, A.x + A.w - 58, y - 2, 52, 12, 'ADD FUEL', () => addFuel(st, fire)); y += 16;
  }
  if (kiln && !craftEasy()) {
    drawText(c, 'heat', x0, y, '#b9bdd0'); const gw = A.w - 112; for (let k = 0; k < 5; k++) { c.fillStyle = st.temp > k + .5 ? ['#7a3222', '#a3482e', '#e2542b', '#ff8a3d', '#ffd35a'][k] : '#2b2740'; c.fillRect(x0 + 46 + k * (gw / 5 | 0), y + 1, (gw / 5 | 0) - 2, 6); }
    textO(c, st.temp.toFixed(1), x0 + 46 + gw + 2, y, '#fff');
    button(c, A.x + A.w - 58, y - 2, 52, 12, st.open ? 'DAMPER OPEN' : 'DAMPER SHUT', () => { st.open = st.open ? 0 : 1; sfx('ui'); }, { on: !st.open });
    y += 14; wrapText(st.open ? 'Open: hotter, burns fuel twice as fast. Pots, bricks, glass.' : 'Shut: it smoulders. Logs bake to charcoal only like this.', A.w - 12).forEach(l => { drawText(c, l, x0, y, '#8b8fa3'); y += 9; }); y += 3;
  }
  if (S.kind === 'rack') { drawText(c, st.k > 1.6 ? 'sun and fire: drying fast' : st.k > 1.1 ? (G.sun > .45 ? 'in the sun: drying well' : 'by the fire: drying well') : 'drying slowly (sun or a fire nearby helps)', x0, y, '#8ff5e6'); y += 13; }
  const n = st.slots.length, sw = min(46, (A.w - 12) / n | 0);
  for (let k = 0; k < n; k++) {
    const sl = st.slots[k], x = x0 + k * sw, r = sl && RECIPES[sl.r], hov = inR(x, y, sw - 4, 34);
    c.fillStyle = hov ? '#3a3350' : '#262234'; c.fillRect(x, y, sw - 4, 34); c.fillStyle = '#4a4460'; c.fillRect(x, y, sw - 4, 1);
    if (!r) { drawText(c, 'empty', x + 3, y + 13, '#4a4460'); continue; }
    const done = sl.t >= r.t, burnt = fire && !craftEasy() && sl.t >= r.t * 1.8, f = clamp(sl.t / r.t, 0, 1);
    drawStack(c, { id: burnt ? 'charcoal' : r.out, n: burnt ? 1 : r.n }, x + (sw - 4) / 2 - 9, y + 1);
    bar(c, x + 2, y + 27, sw - 8, 3, burnt ? 1 : done && fire ? (sl.t - r.t) / (r.t * .8) : f, burnt ? '#5f5a69' : done ? (fire ? '#e2483b' : '#7ddc6f') : '#ffd35a', '#2b2740');
    drawText(c, burnt ? 'burnt' : done ? 'ready' : round(f * 100) + '%', x + 2, y + 19, burnt ? '#8b8fa3' : done ? '#7ddc6f' : '#fff');
    if (kiln && !done && !craftEasy()) { if (st.temp < r.temp) drawText(c, 'too cold', x + 2, y + 36, '#e2483b'); else if (r.shut && st.open) drawText(c, 'shut it', x + 2, y + 36, '#e2483b'); }
    hit(x, y, sw - 4, 34, () => takeSlot(st, k, fire));
  }
  y += 48; wrapText(fire ? (craftEasy() ? 'Food is ready when the bar fills. Click a slot to take it out.' : 'Food is ready when the bar fills. Leave it and it chars. Click a slot to take it out.') : kiln && craftEasy() ? 'It works while it has fuel. Click a finished slot to take it out.' : kiln ? 'Click a finished slot to take it out. Click an unfinished one to pull it back.' : 'Hang things from the list. Click a slot to take it down.', A.w - 12).forEach(l => { if (y < A.y + A.h - 22) drawText(c, l, x0, y, '#8b8fa3'); y += 9; });
}
function takeSlot(st, k, fire) {
  const sl = st.slots[k]; if (!sl) return; const r = RECIPES[sl.r]; st.slots[k] = null; if (!r) return;
  if (fire && !craftEasy() && sl.t >= r.t * 1.8) { addItem('charcoal', 1); smsg('Charred. Well, it is charcoal now.', '#8b8fa3'); if (r.ret) for (const q in r.ret) addItem(q, r.ret[q]); sfx('deny'); return; }
  if (sl.t >= r.t) { giveCraft(r); return; }
  for (const q in r.need) { const l = addItem(q, r.need[q]); if (l) spawnDrop(q, l, G.p.x + 3, G.p.y); } sfx('ui');
}
// ---------------- chests and waystones ----------------
function drawChest(c, B, st) {
  const x0 = B.x + round((B.w - 191) / 2); let y = B.y + 16; const N = st.items.length; textS(c, (TP[st.t] ? TP[st.t].name : 'Chest').toUpperCase(), x0, y, '#8ff5e6'); drawText(c, 'click a stack to move it across', B.x + 8, B.y + B.h - 12, '#8b8fa3');
  button(c, x0 + 191 - 120, y - 3, 58, 11, 'TAKE ALL', () => chestTakeAll(st)); button(c, x0 + 191 - 58, y - 3, 58, 11, 'STORE ALL', () => chestStoreAll(st)); y += 10;
  for (let k = 0; k < N; k++) { const x = x0 + (k % 10) * 19, yy = y + floor(k / 10) * 19, hov = inR(x, yy, 18, 18); slotBox(c, x, yy, false, hov); drawStack(c, st.items[k], x, yy); hit(x, yy, 18, 18, () => { const s = st.items[k]; if (!s) return; const l = addItem(s.id, s.n); st.items[k] = l ? { id: s.id, n: l } : null; sfx('ui'); G.dirty = true; }); }
  y += ceil(N / 10) * 19 + 6; textS(c, 'PACK', x0, y, '#ffd35a'); y += 10;
  const rows = ceil(INV_N / 10); for (let k = 0; k < INV_N; k++) { const x = x0 + (k % 10) * 19, yy = y + floor(k / 10) * 19; if (yy > B.y + B.h - 19) break; const hov = inR(x, yy, 18, 18); slotBox(c, x, yy, false, hov); drawStack(c, inv[k], x, yy); hit(x, yy, 18, 18, () => { const s = inv[k]; if (!s) return; let n = s.n; for (let q = 0; q < st.items.length && n > 0; q++) { const d = st.items[q]; if (d && d.id === s.id && d.n < IT[s.id].stack) { const m = min(n, IT[s.id].stack - d.n); d.n += m; n -= m; } } for (let q = 0; q < st.items.length && n > 0; q++) if (!st.items[q]) { st.items[q] = { id: s.id, n }; n = 0; } if (n) s.n = n; else inv[k] = null; sfx('ui'); G.dirty = true; }); }
  void rows;
}
function drawWay(c, B, S) {
  const ws = [...STN.entries()].filter(([i, s]) => s.t === WAYSTONE && tiles[i] === WAYSTONE); let y = B.y + 16;
  textS(c, 'Touch a stone you have raised to step to it.', B.x + 8, y, '#b49cff'); y += 12;
  for (const [i, s] of ws) {
    const x = i % WW, yy = (i / WW) | 0, here = i === S.i, d = round((x * T - G.p.x) / T);
    button(c, B.x + 8, y, B.w - 16, 14, `${s.name}   ${here ? '(here)' : d > 0 ? d + ' paces east' : -d + ' paces west'}`, () => { if (here) return; closeUI(); travelTo(x, yy); }, { off: here });
    y += 16; if (y > B.y + B.h - 16) break;
  }
  if (ws.length < 2) drawText(c, 'Raise another waystone somewhere else to travel between them.', B.x + 8, y + 4, '#8b8fa3');
}
function travelTo(x, y) { const p = G.p; streamTo(x * T, true); G.flash = .8; sfx('tele', 0); sfx('shrine', 0); p.x = p.px = x * T + 1; p.y = p.py = (y - 3) * T; p.vx = p.vy = 0; snapCam(); burst(p.x + 3, p.y + 10, 24, ['#b49cff', '#e0d2ff', '#ffffff'], 2, 40, { glow: 1, g: -.02 }); G.flags.travelled = true; }
// ---------------- the active stations ----------------
const GIM = {
  bench: { hint: 'Then hold the mouse and saw left and right across the plank: long steady strokes. Frantic sawing binds the blade.' },
  wheel: { hint: 'Then hold the mouse to raise the clay. Steer left and right against the wobble. Let go when the wall reaches the marks.' },
  quern: { hint: 'Then hold the mouse and circle it around the stone. Not too fast.' },
  bloom: { hint: 'Then click to pump the bellows. Keep the heat inside the bright band until the bloom is done. Too hot makes slag.' },
  anvil: { hint: 'Then click when the hammer mark crosses each glowing notch. Clean strikes make better steel.' },
  loom: { hint: 'Then press A, D, A, D... each on the beat as the pulse hits the centre.' },
  pot: { hint: 'Then hold the mouse and stir in steady circles. Ladle out when the brew matches the swatch.' },
  mason: { hint: 'Then click each mark along the chalk line, in order. Miss three times and the stone splits.' },
  sieve: { hint: 'Then hold the mouse and shake it hard from side to side.' }
};
function makeJob(kind, r, ri) {
  const j = { kind, r, ri, prog: 0, t: 0, need: 1 };
  if (kind === 'bench') { j.need = 6; j.dir = 0; j.run = 0; j.bind = 0; j.lx = null; }
  else if (kind === 'wheel') { j.h = 0; j.wob = 0; j.wv = 0; j.was = false; }
  else if (kind === 'quern') { j.need = 4; j.acc = 0; j.la = null; j.fast = 0; }
  else if (kind === 'bloom') { j.need = 220; j.heat = .25; j.over = 0; j.bc = .2 + (r.band || 1) * .12; }
  else if (kind === 'anvil') { const n = 3 + (r.lvl === 2 ? 1 : 0) + (r.q ? 1 : 0); j.marks = []; for (let k = 0; k < n; k++) j.marks.push(.1 + (k + Math.random() * .7) / n * .8); j.marks.sort(() => Math.random() - .5); j.k = 0; j.pos = 0; j.sp = .011 + (r.lvl === 2 ? .004 : 0) + (r.q ? .002 : 0); j.sc = []; j.need = n; }
  else if (kind === 'loom') { j.need = 8; j.exp = 'A'; j.t = 0; }
  else if (kind === 'pot') { j.la = null; j.w = 0; }
  else if (kind === 'mason') { j.pts = chiselLine(); j.k = 0; j.cracks = 0; j.need = j.pts.length; }
  else if (kind === 'sieve') { j.need = 10; j.lx = null; }
  return j;
}
function chiselLine() { const n = randi(6, 9), pts = []; for (let k = 0; k < n; k++) pts.push([.12 + k / (n - 1) * .76, .5 + (Math.random() - .5) * .5]); return pts; }
function jobArea() { const B = stnBox(), L = min(160, B.w * .46 | 0); return { x: B.x + 4 + L + 5, y: B.y + 15, w: B.w - L - 13, h: B.h - 19 }; }
const angD = (a, b) => { let d = a - b; while (d > PI) d -= TAU; while (d < -PI) d += TAU; return d; };
function tickJob(j) {
  if (j.kind === 'easy') { if (++j.t < j.need) return; const left = j.left - 1; finishJob(j, .62); UI.job = left > 0 && canCraft(j.r) ? easyJob(j.r, j.ri, left) : null; return; }
  const A = jobArea(), mx = mouse.ux, my = mouse.uy, inA = mx >= A.x && mx < A.x + A.w && my >= A.y && my < A.y + A.h, held = mouse.held && inA, cx = A.x + A.w / 2, cy = A.y + A.h / 2 + 4; j.t++;
  if (j.kind === 'bench') {
    if (held && j.lx !== null) { const dx = mx - j.lx, sp = abs(dx); if (sp > 14) j.bind = min(80, j.bind + 3); else if (sp > .4 && j.bind < 30) { const d = sign(dx); if (d === j.dir) j.run += sp; else { if (j.run > A.w * .35) { j.prog++; sfx('saw', 0); for (let k = 0; k < 4; k++) uiDust(cx, cy + 6, '#c9a46a'); } j.dir = d; j.run = sp; } } }
    j.lx = held ? mx : null; if (j.bind > 0) j.bind -= .5;
  } else if (j.kind === 'wheel') {
    if (held) { j.h += .0042; j.wv += (Math.random() - .5) * .014 + j.wob * .006; const hand = clamp((mx - cx) / (A.w / 2), -1, 1); j.wob += j.wv - hand * .022 * (1 + j.h); j.wv *= .95; if (abs(j.wob) > 1) { j.h = 0; j.wob = 0; j.wv = 0; sfx('deny'); smsg('It slumped off-centre. Again.', '#e2483b'); } }
    else if (j.was && j.h > .04) { const d = j.h - j.r.h; if (abs(d) <= .065) finishJob(j, 1); else { smsg(d < 0 ? 'Too low. Squash it and start over.' : 'Too tall: the walls sag. Again.', '#e2483b'); sfx('deny'); j.h = 0; j.wob = 0; } }
    j.was = held;
  } else if (j.kind === 'quern' || j.kind === 'pot') {
    if (held) { const a = atan2(my - cy, mx - cx); if (j.la !== null) { const d = abs(angD(a, j.la)); if (j.kind === 'quern') { if (d > .5) { j.fast = 40; } else if (d > .03) { j.acc += d; if (j.acc >= TAU) { j.acc -= TAU; j.prog++; sfx('grind', 0); for (let k = 0; k < 5; k++) uiDust(cx, cy + 14, '#b8b2c0'); } } } else { j.w = lerp(j.w, d, .15); if (j.w > .1 && j.w < .3) j.prog += .0036; else if (j.w >= .3) { j.prog += .001; if (G.time % 6 === 0) { uiDust(cx + frand(-14, 14), cy - 10, '#8ff5e6'); sfx('stir', 0); } } if (G.time % 20 === 0 && j.w > .05) sfx('stir', 0); } } j.la = a; } else j.la = null;
    if (j.fast > 0) j.fast--;
  } else if (j.kind === 'bloom') {
    j.heat = max(0, j.heat - .0034); if (mouse.hp && inA) { j.heat = min(1, j.heat + .085); sfx('bellows', 0); uiDust(A.x + 22, cy + 18, '#8d8794'); }
    const lo = j.bc - .07, hi = j.bc + .07; if (j.heat >= lo && j.heat <= hi) j.prog++; else if (j.heat > hi + .08) { j.over++; j.prog = max(0, j.prog - .5); }
  } else if (j.kind === 'anvil') {
    j.pos += j.sp * (j.dirn || 1); if (j.pos > 1) { j.pos = 1; j.dirn = -1; } if (j.pos < 0) { j.pos = 0; j.dirn = 1; }
    if (mouse.hp && inA && j.k < j.marks.length) { const acc = clamp(1 - abs(j.pos - j.marks[j.k]) / .085, 0, 1); j.sc.push(acc); j.k++; j.prog = j.k; sfx(acc > 0 ? 'anvil' : 'clink', 0); for (let k = 0; k < (acc > .5 ? 8 : 3); k++) uiDust(A.x + 10 + j.pos * (A.w - 20), cy + 4, fpick(SPARK)); smsg(acc > .85 ? 'Clean!' : acc > .5 ? 'Good.' : acc > 0 ? 'Rough.' : 'Missed.', acc > .5 ? '#7ddc6f' : '#e2483b'); }
  } else if (j.kind === 'loom') {
    const ph = j.t % 32, err = min(ph, 32 - ph), key = pressed.KeyA ? 'A' : pressed.KeyD ? 'D' : (mouse.hp && inA) ? (mx < cx ? 'A' : 'D') : null;
    if (ph === 0) sfx('beat', 0);
    if (key) { if (key === j.exp && err <= 7) { j.prog++; j.exp = j.exp === 'A' ? 'D' : 'A'; sfx('craft', 0); } else { j.prog = max(0, j.prog - 1); sfx('deny'); smsg(key !== j.exp ? 'Wrong side: tangled.' : 'Off the beat: tangled.', '#e2483b'); } }
  } else if (j.kind === 'mason') {
    if (mouse.hp && inA && j.k < j.pts.length) { const bx = A.x + 10, by = A.y + 24, bw = A.w - 20, bh = A.h - 54, p = j.pts[j.k], px = bx + p[0] * bw, py = by + p[1] * bh; if (hypot(mx - px, my - py) <= 5) { j.k++; j.prog = j.k; sfx('chisel', 0); for (let k = 0; k < 4; k++) uiDust(px, py, '#c0bac8'); } else { j.cracks++; sfx('clink', 0); if (j.cracks >= 3) { smsg('The stone split. Fresh block.', '#e2483b'); j.pts = chiselLine(); j.k = 0; j.prog = 0; j.cracks = 0; } else smsg('Off the line.', '#e2483b'); } }
  } else if (j.kind === 'sieve') {
    if (held && j.lx !== null) { const d = abs(mx - j.lx); j.prog += min(d, 14) * .009; if (d > 3 && G.time % 3 === 0) { uiDust(cx + frand(-20, 20), cy + 10, '#8a8296'); if (G.time % 9 === 0) sfx('shake', 0); } }
    j.lx = held ? mx : null;
  }
  if (j.kind !== 'wheel' && j.kind !== 'pot' && j.prog >= j.need) finishJob(j, j.kind === 'anvil' ? j.sc.reduce((a, b) => a + b, 0) / j.sc.length : 1);
  if (UI.dust) for (let k = UI.dust.length - 1; k >= 0; k--) { const d = UI.dust[k]; d.x += d.vx; d.y += d.vy; d.vy += .12; if (--d.l <= 0) UI.dust.splice(k, 1); }
}
function uiDust(x, y, col) { if (!UI.dust) UI.dust = []; if (UI.dust.length < 80) UI.dust.push({ x, y, vx: frand(-1.2, 1.2), vy: frand(-2, -.4), l: frand(14, 30) | 0, col }); }
const QN = ['Crude', 'Fine', 'Superior', 'Masterwork'];
function qTier(q) { return q < .45 ? 0 : q < .75 ? 1 : q < .92 ? 2 : 3; }
function finishJob(j, q) {
  const r = j.r; if (!canCraft(r)) { UI.job = null; sfx('deny'); smsg('Something is missing now.', '#e2483b'); return; }
  payCraft(r);
  if (r.loot) { const got = []; for (const [id, ch] of r.loot) if (Math.random() < ch * 1.6) { addItem(id, 1); got.push(IT[id].name); } sfx(got.length ? 'craft' : 'deny'); smsg(got.length ? 'Found: ' + got.join(', ') : 'Nothing but dust this time.', got.length ? '#7ddc6f' : '#8b8fa3'); G.flags.sifted = true; j.prog = 0; j.lx = null; return; }
  let n = r.n;
  if (j.kind === 'bloom' && j.over > 90) { n = max(1, floor(n / 2)); smsg('Too hot: half of it turned to slag.', '#e2483b'); }
  if (j.kind === 'pot') { const d = abs(j.prog - 1); if (d > .3) { UI.job = null; smsg('It turned to sludge. Lost.', '#e2483b'); sfx('deny'); return; } if (d > .12) { n = max(1, floor(n / 2)); smsg('Not quite right: you saved half.', '#ffb347'); } }
  const tier = qTier(q), quality = r.q ? [-.1, 0, .1, .2][tier] : 0;
  giveCraft(r, n, r.q ? q : 0);
  if (r.q) smsg(`${QN[tier]} work${quality ? ` (${quality > 0 ? '+' : ''}${round(quality * 100)}%)` : ''}`, tier >= 2 ? '#7ddc6f' : '#ffd35a');
  UI.job = j.kind !== 'easy' && canCraft(r) ? makeJob(j.kind, r, j.ri) : null;
}
const qBonus = id => { const q = G.quality && G.quality[id]; return q === undefined ? 0 : [-.1, 0, .1, .2][qTier(q)]; };
function drawJob(c, A, j) {
  const cx = A.x + A.w / 2, cy = A.y + A.h / 2 + 4, it = j.r.out ? IT[j.r.out] : null;
  textS(c, it ? 'MAKING : ' + it.name.toUpperCase() : 'SIFTING', A.x + 5, A.y + 4, '#ffd35a');
  button(c, A.x + A.w - 44, A.y + 2, 40, 11, 'STOP', () => { UI.job = null; sfx('ui'); });
  hit(A.x, A.y + 14, A.w, A.h - 14, () => { });
  const prog = (f, col = '#7ddc6f') => bar(c, A.x + 8, A.y + A.h - 22, A.w - 16, 4, f, col, '#2b2740');
  if (j.kind === 'easy') { prog(j.t / j.need); if (it) c.drawImage(it.icon, round(cx - it.icon.width), round(cy - 22), it.icon.width * 2, it.icon.height * 2); drawText(c, j.left > 1 ? j.left + ' to go' : 'almost done', A.x + 8, A.y + A.h - 34, '#b9bdd0'); return; }
  if (j.kind === 'bench') {
    const py = cy - 6, cut = j.prog / j.need; c.fillStyle = '#7a5a40'; c.fillRect(A.x + 12, py, A.w - 24, 12); c.fillStyle = '#a07a50'; c.fillRect(A.x + 12, py, A.w - 24, 2); c.fillStyle = '#2a1c18'; c.fillRect(cx - 1, py, 2, round(12 * cut));
    const sx = clamp(mouse.ux, A.x + 12, A.x + A.w - 12); c.fillStyle = j.bind > 30 ? '#e2483b' : '#cfd6e0'; c.fillRect(sx - 18, py - 6, 36, 4); c.fillStyle = '#5a4030'; c.fillRect(sx + 18, py - 8, 6, 8);
    drawText(c, j.bind > 30 ? 'The blade binds. Slow down.' : `strokes ${j.prog}/${j.need}`, A.x + 8, A.y + 18, j.bind > 30 ? '#e2483b' : '#b9bdd0'); prog(cut);
  } else if (j.kind === 'wheel') {
    const by = cy + 30, hpx = j.h * 70, tgt = j.r.h * 70; c.fillStyle = '#5a4030'; c.fillRect(cx - 34, by, 68, 4); c.fillStyle = '#7a5a40'; c.fillRect(cx - 30, by - 2, 60, 2);
    const off = j.wob * 12, wd = 12 + (j.r.id === 'cauldron_u' ? 10 : 0); c.fillStyle = '#b48a7a'; c.fillRect(round(cx - wd + off * .6), round(by - 2 - hpx), wd * 2, round(hpx)); c.fillStyle = '#d4ac9a'; c.fillRect(round(cx - wd + off), round(by - 2 - hpx), wd * 2, 2);
    c.fillStyle = 'rgba(125,220,111,.8)'; c.fillRect(cx - 40, round(by - 2 - tgt - 4.5), 10, 1); c.fillRect(cx - 40, round(by - 2 - tgt + 4.5), 10, 1); c.fillRect(cx + 30, round(by - 2 - tgt - 4.5), 10, 1); c.fillRect(cx + 30, round(by - 2 - tgt + 4.5), 10, 1);
    c.fillStyle = abs(j.wob) > .6 ? '#e2483b' : '#ffd35a'; c.fillRect(round(cx + j.wob * (A.w / 2 - 10)), A.y + 18, 2, 6); c.fillStyle = '#4a4460'; c.fillRect(A.x + 10, A.y + 21, A.w - 20, 1);
    drawText(c, 'wobble', A.x + 8, A.y + 26, '#8b8fa3'); prog(clamp(j.h / j.r.h, 0, 1.3) / 1.3, abs(j.h - j.r.h) <= .065 ? '#7ddc6f' : '#ffd35a');
  } else if (j.kind === 'quern' || j.kind === 'pot') {
    const R = min(30, A.h / 2 - 22);
    if (j.kind === 'quern') { c.fillStyle = '#5f5a69'; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill(); c.fillStyle = '#8d8794'; c.beginPath(); c.arc(cx, cy, R - 4, 0, TAU); c.fill(); const a = j.la === null ? 0 : j.la; c.fillStyle = '#7a5a40'; c.fillRect(round(cx + cos(a) * (R - 8)) - 2, round(cy + sin(a) * (R - 8)) - 2, 4, 4); drawText(c, j.fast ? 'Too fast: it skips.' : `turns ${j.prog}/${j.need}`, A.x + 8, A.y + 18, j.fast ? '#e2483b' : '#b9bdd0'); prog((j.prog + j.acc / TAU) / j.need); }
    else {
      const tc = j.r.col || [200, 200, 200], f = clamp(j.prog, 0, 1), over = clamp((j.prog - 1) * 2, 0, 1), m = [70, 64, 80], col = [0, 1, 2].map(k => round(lerp(lerp(m[k], tc[k], f), [74, 52, 30][k], over)));
      c.fillStyle = '#3f3a4c'; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.fill(); c.fillStyle = `rgb(${col})`; c.beginPath(); c.arc(cx, cy, R - 4, 0, TAU); c.fill();
      c.fillStyle = `rgb(${tc})`; c.fillRect(A.x + A.w - 26, A.y + 18, 16, 10); c.fillStyle = '#fff'; drawText(c, 'aim', A.x + A.w - 46, A.y + 19, '#8b8fa3');
      drawText(c, j.w >= .3 ? 'Too fast: it splashes.' : j.w > .1 ? 'Steady...' : 'Stir.', A.x + 8, A.y + 18, j.w >= .3 ? '#e2483b' : '#b9bdd0');
      button(c, cx - 22, A.y + A.h - 34, 44, 11, 'LADLE', () => finishJob(j, 1));
      prog(min(1, j.prog), abs(j.prog - 1) < .12 ? '#7ddc6f' : j.prog > 1.12 ? '#e2483b' : '#ffd35a');
    }
  } else if (j.kind === 'bloom') {
    const gx = A.x + 34, gw = A.w - 48, gy = cy - 4; c.fillStyle = '#2b2740'; c.fillRect(gx, gy, gw, 10);
    c.fillStyle = 'rgba(255,211,90,.45)'; c.fillRect(round(gx + (j.bc - .07) * gw), gy, round(.14 * gw), 10); c.fillStyle = 'rgba(226,72,59,.35)'; c.fillRect(round(gx + (j.bc + .15) * gw), gy, gw - round((j.bc + .15) * gw), 10);
    c.fillStyle = '#fff'; c.fillRect(round(gx + j.heat * gw), gy - 3, 2, 16); c.fillStyle = '#6a4e3a'; c.fillRect(A.x + 10, cy + 12, 18, 10); c.fillStyle = '#a07a58'; c.fillRect(A.x + 12, cy + 12 - (G.time % 20 < 6 ? 2 : 0), 14, 3);
    drawText(c, j.over > 60 ? 'Too hot! Slag is forming.' : 'click to pump', A.x + 8, A.y + 18, j.over > 60 ? '#e2483b' : '#b9bdd0'); prog(j.prog / j.need, '#ff8a3d');
  } else if (j.kind === 'anvil') {
    const bx = A.x + 10, bw = A.w - 20, by = cy - 2; c.fillStyle = '#2b2740'; c.fillRect(bx, by, bw, 8);
    j.marks.forEach((m, k) => { if (k < j.k) return; c.fillStyle = k === j.k ? '#ffd35a' : '#6a6485'; c.fillRect(round(bx + m * bw) - 2, by - 3, 4, 14); });
    c.fillStyle = '#ffffff'; c.fillRect(round(bx + j.pos * bw), by - 6, 1, 20);
    drawText(c, `strikes ${j.k}/${j.marks.length}`, A.x + 8, A.y + 18, '#b9bdd0'); if (j.r.q) drawText(c, 'quality counts', A.x + A.w - 70, A.y + 18, '#8ff5e6'); prog(j.k / j.marks.length, '#ffd35a');
  } else if (j.kind === 'loom') {
    const ph = j.t % 32, pul = 1 - min(ph, 32 - ph) / 16; c.fillStyle = '#4a4460'; c.fillRect(cx - 1, cy - 20, 2, 40); c.fillStyle = `rgba(255,211,90,${pul})`; c.fillRect(cx - 12, cy - 3, 24, 6);
    const sx = cx + (j.exp === 'A' ? -1 : 1) * 30; textC(c, j.exp, sx, cy - 4, '#ffd35a', 2, textO); for (let k = 0; k < j.prog; k++) { c.fillStyle = k & 1 ? '#e8d8b0' : '#c94a4e'; c.fillRect(cx - 30, cy + 26 - k * 2, 60, 2); }
    drawText(c, `rows ${j.prog}/${j.need}`, A.x + 8, A.y + 18, '#b9bdd0'); prog(j.prog / j.need);
  } else if (j.kind === 'mason') {
    const bx = A.x + 10, by = A.y + 24, bw = A.w - 20, bh = A.h - 54; c.fillStyle = '#8a8496'; c.fillRect(bx, by, bw, bh); c.fillStyle = '#a19baa'; c.fillRect(bx, by, bw, 2);
    j.pts.forEach((p, k) => { const px = bx + p[0] * bw, py = by + p[1] * bh; if (k > 0) { const q = j.pts[k - 1]; c.strokeStyle = k <= j.k ? '#2a2436' : 'rgba(255,255,255,.45)'; c.lineWidth = 1; c.beginPath(); c.moveTo(bx + q[0] * bw, by + q[1] * bh); c.lineTo(px, py); c.stroke(); } c.fillStyle = k < j.k ? '#2a2436' : k === j.k ? '#ffd35a' : '#ffffff'; c.fillRect(round(px) - 1, round(py) - 1, 3, 3); });
    for (let k = 0; k < j.cracks; k++) { c.fillStyle = '#2a2436'; c.fillRect(bx + 8 + k * 14, by + bh - 8, 6, 1); c.fillRect(bx + 10 + k * 14, by + bh - 7, 1, 4); }
    drawText(c, `cracks ${j.cracks}/3`, A.x + 8, A.y + A.h - 32, j.cracks ? '#e2483b' : '#8b8fa3'); prog(j.k / j.pts.length);
  } else if (j.kind === 'sieve') {
    const off = j.lx === null ? 0 : clamp(mouse.ux - cx, -20, 20); c.fillStyle = '#7a5a40'; c.fillRect(round(cx - 30 + off), cy - 4, 60, 3); c.fillStyle = '#c9a44a'; for (let k = 0; k < 14; k++) c.fillRect(round(cx - 28 + off + k * 4), cy - 1, 1, 2);
    drawText(c, 'shake!', A.x + 8, A.y + 18, '#b9bdd0'); prog(j.prog / j.need);
  }
  for (const d of UI.dust || []) { c.fillStyle = d.col; c.fillRect(round(d.x), round(d.y), 2, 2); }
}
// ---------------- knapping ----------------
function drawKnap(c) {
  const w = min(VS.uw - 10, 300), h = 176, x = round((VS.uw - w) / 2), y = round((VS.uh - h) / 2) - 10; panel(c, x, y, w, h, 'KNAPPING'); hit(x, y, w, h, () => { });
  button(c, x + w - 13, y + 1, 12, 10, 'x', () => { closeUI(); sfx('ui'); });
  const K = UI.knap = UI.knap || { mat: hasItem('flint') ? 'flint' : 'rock', k: 0, grid: new Array(25).fill(1) };
  let bx = x + 6, by = y + 16;
  for (const m of ['rock', 'flint']) { button(c, bx, by, 64, 12, `${IT[m].name.split(' ').pop()} x${countItem(m)}`, () => { K.mat = m; K.grid.fill(1); sfx('ui'); }, { on: K.mat === m, off: !hasItem(m) && WORLD.mode !== 1 }); bx += 68; }
  const opts = KNAP.filter(q => q.mat.includes(K.mat)); if (K.k >= opts.length) K.k = 0; by += 16;
  opts.forEach((q, i) => { button(c, x + 6, by + i * 14, 92, 12, IT[q.out].name, () => { K.k = i; sfx('ui'); }, { on: K.k === i }); });
  const pat = opts[K.k].pat, gx = x + 112, gy = y + 30, cs = 18;
  for (let i = 0; i < 25; i++) {
    const cx = gx + (i % 5) * cs, cy = gy + (i / 5 | 0) * cs, on = K.grid[i], keep = pat[i] === '#', hov = inR(cx, cy, cs - 1, cs - 1);
    c.fillStyle = on ? (K.mat === 'flint' ? (hov ? '#a8a0b4' : '#8a8296') : (hov ? '#6f97a8' : '#456878')) : '#141020'; c.fillRect(cx, cy, cs - 1, cs - 1);
    if (keep) { c.fillStyle = on ? 'rgba(255,241,168,.5)' : 'rgba(226,72,59,.5)'; c.fillRect(cx + 3, cy + 3, cs - 7, cs - 7); c.fillStyle = '#ffd35a'; c.fillRect(cx, cy, cs - 1, 1); c.fillRect(cx, cy + cs - 2, cs - 1, 1); c.fillRect(cx, cy, 1, cs - 1); c.fillRect(cx + cs - 2, cy, 1, cs - 1); }
    if (on) hit(cx, cy, cs - 1, cs - 1, () => knapAt(K, i, pat, opts[K.k]));
  }
  wrapText('Knock off the flakes outside the glowing shape. Strike inside it and the stone splits.', w - 210).forEach((l, i) => drawText(c, l, gx + 5 * cs + 6, gy + i * 9, '#b9bdd0'));
  drawText(c, 'Then bind the head to a stick with twine [E].', x + 6, y + h - 12, '#8ff5e6');
}
function knapAt(K, i, pat, q) {
  if (!hasItem(K.mat) && WORLD.mode !== 1) { sfx('deny'); return; }
  if (pat[i] === '#') { if (WORLD.mode !== 1) removeItem(K.mat, 1); K.grid.fill(1); sfx('brk', 0); say('It split across the line. That stone is ruined.'); return; }
  K.grid[i] = 0; sfx('chisel', 0);
  if (K.grid.every((v, k) => (pat[k] === '#') === !!v)) { if (WORLD.mode !== 1) removeItem(K.mat, 1); addItem(q.out, 1); toastItem(q.out, 1); sfx('craft'); K.grid.fill(1); G.flags.knapped = true; onCraft(q.out); }
}
// ---------------- the map ----------------
// kept in tiles of 128 columns (64 map pixels), so it can be as long as the world
const MAPS = 2, MTW = 64, MAPT = new Map();
let MAPCV = null; // set once anything is charted (kept for the "nothing charted" check)
function mapReset() { MAPT.clear(); MAPCV = null; }
function mapTile(mk) { let m = MAPT.get(mk); if (!m) { const mh = ceil(WH / MAPS), [cv, x] = mk_(MTW, mh); m = { cv, x, seen: new Uint8Array(MTW * mh), mh }; MAPT.set(mk, m); MAPCV = true; } return m; }
function mk_(w, h) { return mk(w, h); }
function mapColor(x, y) {
  const tx = x * MAPS, ty = y * MAPS, t = tileAt(tx, ty), wl = inW(tx, ty) ? walls[ty * WW + tx] : 0;
  return t ? (TP[t].liquid === 1 ? '#3a7aa8' : TP[t].liquid === 2 ? '#ff8a3d' : TP[t].stalk ? '#2c575e' : TP[t].decor ? '#3a5a46' : (TP[t].solid ? TP[t].dust : '#4a4460')) : wl ? '#231c33' : (ty < SKYL[clamp(tx, 0, WW - 1)] ? '#2d3a5a' : '#140f20');
}
function mapPaint(x, y) { const m = mapTile(x >> 6); m.x.fillStyle = mapColor(x, y); m.x.fillRect(x & 63, y, 1, 1); }
function mapReveal() {
  if (WORLD.arena || !G.p) return; const mh = ceil(WH / MAPS);
  const px = floor((G.p.x + 3) / T / MAPS), py = floor((G.p.y + 10) / T / MAPS), R = 13;
  for (let y = py - R; y <= py + R; y++) for (let x = px - R - 4; x <= px + R + 4; x++) {
    if (x < 0 || y < 0 || y >= mh || x >= WW / MAPS) continue; if ((x - px) ** 2 / 1.6 + (y - py) ** 2 > R * R) continue;
    const m = mapTile(x >> 6), k = y * MTW + (x & 63); if (m.seen[k]) continue; m.seen[k] = 1; if (chunkReadyAt(x * MAPS)) mapPaint(x, y);
  }
}
// a chunk of the world has just formed: paint what you have already seen of it
function mapChunkReady(cx) {
  const x0 = cx * CW / MAPS, m = MAPT.get(x0 >> 6); if (!m) return;
  for (let x = x0; x < x0 + CW / MAPS; x++) for (let y = 0; y < m.mh; y++) if (m.seen[y * MTW + (x & 63)]) mapPaint(x, y);
}
function encodeSeen() {
  const out = [];
  for (const [mk, m] of MAPT) { if (!m.seen.some(v => v)) continue; const r = []; let v = 0, n = 0; for (let k = 0; k < m.seen.length; k++) { const b = m.seen[k] ? 1 : 0; if (b === v) n++; else { r.push(n.toString(36)); v = b; n = 1; } } r.push(n.toString(36)); out.push(mk.toString(36) + ':' + r.join('.')); }
  return out.join(';');
}
function decodeSeen(str) {
  if (!str || !str.includes(':')) return;
  for (const part of str.split(';')) { const [a, b] = part.split(':'), mk = parseInt(a, 36); if (!(mk >= 0) || !b) continue; const m = mapTile(mk); let k = 0, v = 0; for (const q of b.split('.')) { const n = parseInt(q, 36) || 0; if (v) m.seen.fill(1, k, min(m.seen.length, k + n)); k += n; v ^= 1; } }
}
// drawing: a window onto the tiles
function mapDrawTiles(c, ox, oy, k, vx, vy, vw, vh) {
  c.imageSmoothingEnabled = false;
  const m0 = floor((vx - ox) / (MTW * k)) - 1, m1 = ceil((vx + vw - ox) / (MTW * k)) + 1;
  for (let mk = max(0, m0); mk <= m1; mk++) { const m = MAPT.get(mk); if (m) c.drawImage(m.cv, ox + mk * MTW * k, oy, MTW * k, m.mh * k); }
}
const MAPV = { z: 3, cx: -1, cy: -1, drag: null };
function mapZoom(d) { MAPV.z = clamp(MAPV.z * (d < 0 ? 1.5 : 1 / 1.5), .5, 16); sfx('ui'); }
function drawMap(c) {
  const w = min(VS.uw - 10, 520), h = min(VS.uh - 34, 320), x = round((VS.uw - w) / 2), y = round((VS.uh - h) / 2) - 6; panel(c, x, y, w, h, 'FIELD MAP'); hit(x, y, w, h, () => { });
  button(c, x + w - 13, y + 1, 12, 10, 'x', () => { closeUI(); sfx('ui'); });
  if (!MAPCV) { drawText(c, 'Nothing charted yet.', x + 8, y + 20, '#8b8fa3'); return; }
  button(c, x + w - 70, y + 1, 22, 10, '+', () => mapZoom(-1)); button(c, x + w - 46, y + 1, 22, 10, '-', () => mapZoom(1)); button(c, x + w - 120, y + 1, 48, 10, 'ON ME', () => { MAPV.cx = (G.p.x + 3) / T / MAPS; MAPV.cy = (G.p.y + 10) / T / MAPS; sfx('ui'); });
  const vx = x + 4, vy = y + 14, vw = w - 8, vh = h - 30, k = MAPV.z;
  if (MAPV.cx < 0) { MAPV.cx = (G.p.x + 3) / T / MAPS; MAPV.cy = (G.p.y + 10) / T / MAPS; }
  if (mouse.l && inR(vx, vy, vw, vh)) { if (MAPV.drag) { MAPV.cx -= (mouse.ux - MAPV.drag[0]) / k; MAPV.cy -= (mouse.uy - MAPV.drag[1]) / k; } MAPV.drag = [mouse.ux, mouse.uy]; } else MAPV.drag = null;
  MAPV.cx = clamp(MAPV.cx, 0, WW / MAPS); MAPV.cy = clamp(MAPV.cy, 0, WH / MAPS);
  const ox = vx + vw / 2 - MAPV.cx * k, oy = vy + vh / 2 - MAPV.cy * k, at = (tx, ty) => [ox + tx / MAPS * k, oy + ty / MAPS * k];
  c.save(); c.beginPath(); c.rect(vx, vy, vw, vh); c.clip();
  c.fillStyle = '#0c0a14'; c.fillRect(vx, vy, vw, vh); mapDrawTiles(c, ox, oy, k, vx, vy, vw, vh);
  let hov = null; const near = (lx, ly, name) => { if (abs(mouse.ux - lx) < 4 && abs(mouse.uy - ly) < 4) hov = [lx, ly, name]; }, taken = [];
  const label = (s, lx, ly, col) => { const r = [round(lx) + 4, round(ly) - 4, textW(s), 8]; if (taken.some(q => r[0] < q[0] + q[2] + 2 && q[0] < r[0] + r[2] + 2 && r[1] < q[1] + q[3] && q[1] < r[1] + r[3])) return; taken.push(r); textS(c, s, r[0], r[1], col); };
  { const [mx, my] = at((G.p.x + 3) / T, (G.p.y + 10) / T); taken.push([round(mx) + 4, round(my) - 4, 16, 8]); }
  for (const L of LANDMARKS) if (G.found.has(L.id)) { const [lx, ly] = at(L.x / T, L.y / T); if (lx < vx - 20 || lx > vx + vw + 20) continue; c.fillStyle = '#120d1f'; c.fillRect(round(lx) - 2, round(ly) - 2, 5, 5); c.fillStyle = '#ffd35a'; c.fillRect(round(lx) - 1, round(ly) - 1, 3, 3); near(lx, ly, L.name); if (MAPV.z >= 2) label(L.name, lx, ly, '#ffd35a'); }
  for (const [i, s] of STN) if (s.t === WAYSTONE) { const [lx, ly] = at(i % WW, (i / WW) | 0); c.fillStyle = '#b49cff'; c.fillRect(round(lx) - 1, round(ly) - 2, 3, 4); near(lx, ly, 'waystone'); }
  for (const o of tileObjs.values()) if (o.id === SIGNPOST) { const [lx, ly] = at(o.x, o.y); c.fillStyle = '#120d1f'; c.fillRect(round(lx) - 1, round(ly) - 4, 4, 6); c.fillStyle = '#ffd35a'; c.fillRect(round(lx), round(ly) - 3, 2, 2); c.fillStyle = '#c9a46a'; c.fillRect(round(lx), round(ly) - 1, 1, 2); near(lx, ly, 'signpost'); }
  if (SPOTS.camp) { const [lx, ly] = at(SPOTS.camp.x, SPOTS.camp.y); c.fillStyle = '#ff8a3d'; c.fillRect(round(lx) - 1, round(ly) - 1, 3, 3); near(lx, ly, 'Hearthhold, the fire'); }
  for (const f of netFriends()) { const [lx, ly] = at((f.x + 3) / T, (f.y + 10) / T); c.fillStyle = '#120d1f'; c.fillRect(round(lx) - 2, round(ly) - 2, 5, 5); c.fillStyle = '#8ff5e6'; c.fillRect(round(lx) - 1, round(ly) - 1, 3, 3); label(f.name, lx, ly, '#8ff5e6'); near(lx, ly, f.name); }
  if (G.respawn) { const [lx, ly] = at(G.respawn.x, G.respawn.y); c.fillStyle = '#7ddc6f'; c.fillRect(round(lx) - 1, round(ly) - 1, 3, 3); near(lx, ly, 'where you wake'); }
  if (G.deathAt) { const [lx, ly] = at(G.deathAt.x / T, G.deathAt.y / T); c.fillStyle = '#e2483b'; for (let d = -2; d <= 2; d++) { c.fillRect(round(lx) + d, round(ly) + d, 1, 1); c.fillRect(round(lx) + d, round(ly) - d, 1, 1); } near(lx, ly, 'where you fell'); }
  const [mx, my] = at((G.p.x + 3) / T, (G.p.y + 10) / T); c.fillStyle = '#120d1f'; c.fillRect(round(mx) - 2, round(my) - 2, 5, 5); c.fillStyle = (G.time >> 4) & 1 ? '#ffffff' : '#ff8a3d'; c.fillRect(round(mx) - 1, round(my) - 1, 3, 3);
  textS(c, 'you', round(mx) + 4, round(my) - 4, '#fff');
  if (hov) { const tw = textW(hov[2]) + 6; c.fillStyle = 'rgba(18,13,31,.9)'; c.fillRect(round(hov[0]) + 5, round(hov[1]) + 3, tw, 10); textS(c, hov[2], round(hov[0]) + 8, round(hov[1]) + 5, '#fff'); }
  c.restore();
  const pace = round(40 / k * MAPS); textS(c, `${pace} paces`, x + 8, y + h - 13, '#8b8fa3'); c.fillStyle = '#8b8fa3'; c.fillRect(x + 8, y + h - 15, 40, 1);
  const dx = round((G.p.x + 3) / T - SPAWN_X); textS(c, `${abs(dx)} paces ${dx >= 0 ? 'east' : 'west'} of ${DIM ? 'the rift' : 'Hearthhold'}`, x + 60, y + h - 13, '#8b8fa3');
  textS(c, 'wheel zoom, drag pan', x + w - 104, y + h - 13, '#6a6485');
}
// a corner of the map, always with you
function drawMinimap(c) {
  if (!MAPCV || WORLD.arena || !G.p || G.cine) return 0;
  const w = 104, h = 58, x = VS.uw - w - 4, y = 4, s = 2, px = (G.p.x + 3) / T / MAPS, py = (G.p.y + 10) / T / MAPS;
  c.fillStyle = 'rgba(12,10,20,.82)'; c.fillRect(x - 1, y - 1, w + 2, h + 2);
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  const ox = round(x + w / 2 - px * s), oy = round(y + h / 2 - py * s); mapDrawTiles(c, ox, oy, s, x, y, w, h);
  const at = (tx, ty) => [x + w / 2 + (tx / MAPS - px) * s, y + h / 2 + (ty / MAPS - py) * s];
  for (const L of LANDMARKS) if (G.found.has(L.id)) { const [lx, ly] = at(L.x / T, L.y / T); if (lx < x - 4 || lx > x + w + 4) continue; c.fillStyle = '#ffd35a'; c.fillRect(round(lx) - 1, round(ly) - 1, 2, 2); }
  if (SPOTS.camp) { const [lx, ly] = at(SPOTS.camp.x, SPOTS.camp.y); c.fillStyle = '#ff8a3d'; c.fillRect(round(lx) - 1, round(ly) - 1, 2, 2); }
  for (const f of netFriends()) { const [lx, ly] = at((f.x + 3) / T, (f.y + 10) / T); c.fillStyle = '#8ff5e6'; c.fillRect(round(clamp(lx, x + 1, x + w - 2)) - 1, round(clamp(ly, y + 1, y + h - 2)) - 1, 3, 3); }
  c.fillStyle = '#ffffff'; c.fillRect(x + w / 2 - 1, y + h / 2 - 1, 3, 3);
  c.restore(); c.strokeStyle = '#3d3a52'; c.lineWidth = 1; c.strokeRect(x - .5, y - .5, w + 1, h + 1);
  if (hasUtil('fieldmap')) textS(c, '[M]', x + w - 15, y + h - 8, '#6a6485');
  return h + 6;
}
// ---------------- the notice board: villagers' requests, always something to do ----------------
const REQ_POOL = [
  { who: 'Nell', need: ['berries', 8], give: ['salve', 2], tier: 0, s: 'Berries for the little ones.' }, { who: 'Odo', need: ['fiber', 20], give: ['rope', 2], tier: 0, s: 'Fiber. My nets are rags.' },
  { who: 'Pell', need: ['meat', 3], give: ['jerky', 3], tier: 0, s: 'Fresh meat, I\'ll cure it for both of us.' }, { who: 'Wick', need: ['log', 6], give: ['arrow', 16], tier: 0, s: 'Logs for the long winter fire.' },
  { who: 'Juno', need: ['bone', 6], give: ['shuriken', 4], tier: 0, s: 'Bones for practice dummies. Don\'t ask.' }, { who: 'Bram', need: ['clay', 10], give: ['crucible', 1], tier: 0, s: 'Clay. Good, wet clay.' },
  { who: 'Bram', need: ['copper_bar', 4], give: ['fittings', 8], tier: 1, s: 'Sunmetal bars for hinges.' }, { who: 'Nell', need: ['cloth', 3], give: ['bandage', 5], tier: 1, s: 'Cloth for the sickroom.' },
  { who: 'Odo', need: ['leather', 3], give: ['backpack', 1], tier: 1, s: 'Three good hides, tanned. I\'ll stitch you a pack.' }, { who: 'Pell', need: ['jerky', 6], give: ['smoke', 4], tier: 1, s: 'Jerky for a long walk.' },
  { who: 'Wick', need: ['glass', 3], give: ['lantern', 1], tier: 1, s: 'Glass. I have a lamp frame waiting.' }, { who: 'Juno', need: ['hide', 4], give: ['claws', 1], tier: 1, s: 'Hides for the dojo floor.' },
  { who: 'Bram', need: ['iron_bar', 4], give: ['shard', 2], tier: 2, s: 'Hollow iron. I am mending the gate hinges.' }, { who: 'Nell', need: ['salve', 3], give: ['magnet', 1], tier: 2, s: 'Salves, for the fevers.' },
  { who: 'Wick', need: ['skysilk', 4], give: ['glider', 1], tier: 2, s: 'Skysilk. You know what it\'s for.' }, { who: 'Juno', need: ['venom', 2], give: ['venomcoat', 3], tier: 2, s: 'Venom. For research.' },
  { who: 'Bram', need: ['steel_bar', 2], give: ['ember_bar', 1], tier: 3, s: 'Nightsteel. I want to see if you can.' }, { who: 'Odo', need: ['geode_core', 1], give: ['waystone', 1], tier: 3, s: 'A geode heart. I know a mason.' },
  { who: 'Pell', need: ['lurker_oil', 3], give: ['flask', 6], tier: 2, s: 'Lurker oil, for the forge lamps.' }, { who: 'Wick', need: ['chitin', 4], give: ['framepack', 1], tier: 3, s: 'Chitin. I\'ll frame you a pack.' }
];
function reqTier() { const F = G.flags; return F.crafted_steel_bar ? 3 : F.crafted_iron_bar ? 2 : F.crafted_copper_bar || F.crafted_cloth ? 1 : 0; }
function reqFill() { if (!G.reqs) G.reqs = []; const tr = reqTier(); let guard = 0; while (G.reqs.length < 3 && guard++ < 40) { const pool = REQ_POOL.filter(q => q.tier <= tr && !G.reqs.some(r => r.s === q.s)); if (!pool.length) break; G.reqs.push(Object.assign({}, fpick(pool))); } }
function drawBoard(c) {
  reqFill(); const w = min(VS.uw - 10, 330), h = 150, x = round((VS.uw - w) / 2), y = round((VS.uh - h) / 2) - 10; panel(c, x, y, w, h, 'NOTICE BOARD'); hit(x, y, w, h, () => { });
  button(c, x + w - 13, y + 1, 12, 10, 'x', () => { closeUI(); sfx('ui'); });
  G.reqs.forEach((r, k) => {
    const yy = y + 16 + k * 40, have = countItem(r.need[0]), ok = have >= r.need[1];
    c.fillStyle = '#262234'; c.fillRect(x + 5, yy, w - 10, 37); drawText(c, `${r.who}: "${r.s}"`, x + 9, yy + 3, '#fff');
    drawText(c, `wants ${r.need[1]} ${IT[r.need[0]].name} (you have ${have})`, x + 9, yy + 13, ok ? '#7ddc6f' : '#e2483b'); drawText(c, `gives ${r.give[1]} ${IT[r.give[0]].name}`, x + 9, yy + 23, '#ffd35a');
    button(c, x + w - 62, yy + 12, 52, 13, 'HAND IN', () => { if (!ok) { sfx('deny'); return; } removeItem(r.need[0], r.need[1]); const l = addItem(r.give[0], r.give[1]); if (l) spawnDrop(r.give[0], l, G.p.x + 3, G.p.y); toastItem(r.give[0], r.give[1]); sfx('quest', 0); G.reqs.splice(k, 1); G.flags.reqsDone = (G.flags.reqsDone || 0) + 1; G.dirty = true; }, { off: !ok });
  });
  drawText(c, `${G.flags.reqsDone || 0} requests answered. New ones go up as old ones come down.`, x + 6, y + h - 11, '#8b8fa3');
}
// ---------------- compass ----------------
function drawCompass(c) {
  if (!hasUtil('compass') || WORLD.arena || !G.p || UI.open) return; const p = G.p, L = G.pin && LEADS[G.pin], at = leadAt(L);
  const tx = at !== null && at !== undefined ? at : G.respawn ? G.respawn.x : SPAWN_X, d = tx * T - p.x, hb = hotbarLayout(), x = hb.x - 22, y = hb.y + 1;
  c.fillStyle = INK; c.fillRect(x - 1, y - 1, 18, 18); c.fillStyle = '#cfd6e0'; c.fillRect(x, y, 16, 16); c.fillStyle = '#f4efe6'; c.fillRect(x + 1, y + 1, 14, 14);
  const a = abs(d) < 40 ? -PI / 2 : d > 0 ? 0 : PI; c.fillStyle = '#e2483b'; for (let k = 0; k < 6; k++) c.fillRect(round(x + 8 + cos(a) * k), round(y + 8 + sin(a) * k), 1, 1); c.fillStyle = '#365058'; c.fillRect(x + 7, y + 7, 2, 2);
  textO(c, abs(d) < 40 ? 'here' : round(abs(d) / T) + '', x - 2, y - 9, at !== null && at !== undefined ? '#ffd35a' : '#7ddc6f');
}

// a way out of any hole: walk back to the fire (or your bedroll) at the cost of some hunger
function wakeAtFire() {
  const p = G.p, r = G.respawn; let tx = SPOTS.camp ? SPOTS.camp.x - 2 : SPAWN_X, ty = VIL_Y;
  if (r && tileAt(r.x, r.y) !== AIR) { tx = r.x; ty = r.y; }
  streamTo(tx * T, true); G.flash = .9; p.x = p.px = tx * T + 1; p.y = p.py = (ty - 3) * T; p.vx = p.vy = 0; while (boxHits(p.x, p.y, p.w, p.h) && p.y > 8) p.y = p.py = p.y - T;
  G.food = max(0, G.food - 10); snapCam(); say('You find your way back to the fire. It costs you a meal.'); sfx('shrine', 0);
}

// a chest: take everything out, or put everything that is not on your hotbar in
function chestTakeAll(st) { let any = 0; for (let q = 0; q < st.items.length; q++) { const s = st.items[q]; if (!s) continue; const l = addItem(s.id, s.n); if (l !== s.n) any = 1; st.items[q] = l ? { id: s.id, n: l } : null; } sfx(any ? 'pickup' : 'deny'); G.dirty = true; }
function chestStoreAll(st) {
  let any = 0;
  for (let k = hotN(); k < INV_N; k++) {
    const s = inv[k]; if (!s) continue; let n = s.n; const sk = IT[s.id].stack;
    for (let q = 0; q < st.items.length && n > 0; q++) { const d = st.items[q]; if (d && d.id === s.id && d.n < sk) { const m = min(n, sk - d.n); d.n += m; n -= m; } }
    for (let q = 0; q < st.items.length && n > 0; q++) if (!st.items[q]) { st.items[q] = { id: s.id, n }; n = 0; }
    if (n !== s.n) any = 1; if (n) s.n = n; else inv[k] = null;
  }
  sfx(any ? 'ui' : 'deny'); G.dirty = true;
}
