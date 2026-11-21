// ============================================================
//  The recipe book [B], the bench filters, and the trinket slots.
//  The book lists every bench with what it is for and everything it
//  makes, green where you have enough. A bench with a long list gets a
//  SHOW button (weapons, tools, armour...) and a CAN MAKE switch.
// ============================================================
const CAT_N = { all: 'ALL', weapons: 'WEAPONS', tools: 'TOOLS', armour: 'ARMOUR', blocks: 'BLOCKS', food: 'FOOD', gear: 'GEAR', trinkets: 'TRINKETS', offerings: 'OFFERINGS', materials: 'MATERIALS' };
function catOf(r) {
  const it = r.out && IT[r.out]; if (!it) return 'materials'; const t = it.type;
  return t === 'weapon' ? 'weapons' : t === 'tool' ? 'tools' : t === 'armor' ? 'armour' : t === 'block' || t === 'wall' ? 'blocks' : t === 'food' || t === 'heal' ? 'food'
    : t === 'trinket' ? 'trinkets' : t === 'util' || t === 'arm' ? 'gear' : t === 'offering' || t === 'summon' || t === 'key' ? 'offerings' : 'materials';
}
// the SHOW and CAN MAKE buttons over a station's list; returns the list they leave
function stnFilterOf(list) {
  const cats = ['all']; for (const e of list) { const k = catOf(e.r); if (!cats.includes(k)) cats.push(k); }
  if (!cats.includes(UI.stnCat)) UI.stnCat = 'all';
  if (!(cats.length > 2 || list.length > 8)) return { list, dy: 0, cats };
  return { list: list.filter(e => (UI.stnCat === 'all' || catOf(e.r) === UI.stnCat) && (!UI.stnCan || e.can)), dy: 12, cats };
}
function stnFilter(c, L, list) {
  const F0 = stnFilterOf(list), cats = F0.cats; if (!F0.dy) return F0;
  const half = (L.w >> 1) - 1;
  if (cats.length > 2) button(c, L.x, L.y, half, 10, 'SHOW: ' + CAT_N[UI.stnCat], () => { UI.stnCat = cats[(cats.indexOf(UI.stnCat) + 1) % cats.length]; UI.scroll = 0; sfx('ui'); }, { on: UI.stnCat !== 'all' });
  button(c, L.x + (cats.length > 2 ? half + 2 : 0), L.y, half, 10, UI.stnCan ? 'CAN MAKE: ON' : 'CAN MAKE: OFF', () => { UI.stnCan = !UI.stnCan; UI.scroll = 0; sfx('ui'); }, { on: !!UI.stnCan });
  return F0;
}
// where a station's recipe row sits on screen (in UI units), for whoever wants to click it
function stnRowXY(kind, t, pick) {
  const B = stnBox(), L = { x: B.x + 4, y: B.y + 15, w: min(160, B.w * .46 | 0) }, F0 = stnFilterOf(stnList(kind, t)), k = F0.list.findIndex(pick);
  return k < 0 ? null : [L.x + 30, L.y + F0.dy + (k - UI.scroll) * 19 + 9];
}
// ---------------- the book ----------------
function drawBook(c) {
  const w = min(VS.uw - 10, 430), h = min(VS.uh - 40, 280), x = round((VS.uw - w) / 2), y = round((VS.uh - h) / 2) - 8;
  panel(c, x, y, w, h, 'RECIPE BOOK  [B]'); hit(x, y, w, h, () => { }); button(c, x + w - 13, y + 1, 12, 10, 'x', () => { closeUI(); sfx('ui'); });
  if (!UI.bookSt) UI.bookSt = 'hand';
  const lw = 116, rh = clamp(floor((h - 22) / BENCHES.length), 9, 13); let tip = null;
  BENCHES.forEach((b, k) => {
    const by = y + 15 + k * rh, on = UI.bookSt === b.st, hov = inR(x + 4, by, lw, rh - 1), built = b.st === 'hand' || (b.item && (G.flags['placed_' + b.item] || hasItem(b.item) || WORLD.mode === 1));
    if (on || hov) { c.fillStyle = on ? '#3a3350' : '#2b2740'; c.fillRect(x + 4, by - 1, lw, rh - 1); }
    if (k === 11) { c.fillStyle = '#3d3a52'; c.fillRect(x + 6, by - 2, lw - 4, 1); }
    drawText(c, b.n, x + 8, by + ((rh - 9) >> 1), on ? '#ffd35a' : built ? '#fff' : '#8b8fa3');
    hit(x + 4, by - 1, lw, rh - 1, () => { UI.bookSt = b.st; UI.scroll = 0; sfx('ui'); });
  });
  const B = BENCHES.find(b => b.st === UI.bookSt) || BENCHES[0], rx = x + lw + 10, rw = w - lw - 16; let ry = y + 15;
  for (const l of wrapText(B.d, rw)) { drawText(c, l, rx, ry, '#b9bdd0'); ry += 9; }
  const br = B.item && RECIPES.find(r => r.out === B.item);
  if (br) { const s = 'Build one at the ' + benchName(br.st) + ': ' + Object.keys(br.need).map(k => br.need[k] + ' ' + IT[k].name.toLowerCase()).join(', ') + '.'; for (const l of wrapText(s, rw)) { drawText(c, l, rx, ry, '#8ff5e6'); ry += 9; } }
  ry += 3;
  const list = RECIPES.map((r, i) => ({ r, i })).filter(e => e.r.st === B.st && (e.r.lvl !== 3 || G.flags.seen1 || WORLD.mode === 1)).map(e => ({ r: e.r, can: canCraft(e.r) })).sort((a, b) => b.can - a.can);
  const rows = max(1, floor((y + h - 12 - ry) / 19)); UI.scroll = clamp(UI.scroll, 0, max(0, list.length - rows));
  for (let k = 0; k < rows; k++) {
    const e = list[k + UI.scroll]; if (!e) break; const r = e.r, yy = ry + k * 19, hov = inR(rx, yy, rw, 18), outId = r.out || Object.keys(r.need)[0];
    if (hov) { c.fillStyle = '#2b2740'; c.fillRect(rx, yy, rw, 18); }
    slotBox(c, rx, yy, false, hov && e.can); c.globalAlpha = e.can ? 1 : .45; drawStack(c, { id: outId, n: r.out ? r.n : 1 }, rx, yy); c.globalAlpha = 1;
    drawText(c, (r.out ? IT[r.out].name : 'Sift ' + IT[outId].name.toLowerCase()) + (r.lvl ? '  (' + LVL_NEED[r.st === 'armr' ? 'armr' : 'anvil'][r.lvl] + ')' : ''), rx + 21, yy + 1, e.can ? '#fff' : '#8b8fa3');
    let nx = rx + 21; for (const q in r.need) { if (nx > rx + rw - 12) { drawText(c, '...', nx, yy + 10, '#8b8fa3'); break; } const hv = countItem(q); nx += drawText(c, `${r.need[q]} ${IT[q].name}`, nx, yy + 10, hv >= r.need[q] || WORLD.mode === 1 ? '#7ddc6f' : '#e2483b') + 4; }
    if (hov) tip = r.out ? itemTip(IT[r.out]) : [['Shake out of it:', '#ffd35a'], [r.loot.map(l => IT[l[0]].name).join(', '), '#b9bdd0']];
  }
  if (!list.length) drawText(c, 'Nothing yet.', rx, ry, '#8b8fa3');
  else { const s = `${list.length} recipes${list.length > rows ? `: ${UI.scroll + 1}-${min(list.length, UI.scroll + rows)}, wheel scrolls` : ''}`; drawText(c, s, x + w - 6 - textW(s), y + h - 10, '#6a6485'); }
  drawText(c, 'use a bench: [F] by it', x + 8, y + h - 10, '#6a6485');
  if (tip) drawTip(c, tip);
}
// ---------------- trinket slots, in the WORN panel ----------------
function drawTrinketRow(c, x, y) {
  trinkFit(); const n = trinkSlots(); let tip = null;
  textS(c, 'TRINKETS', x, y + 6, '#b49cff');
  for (let k = 0; k < TRINK_MAX; k++) {
    const sx = x + 54 + k * 19, hov = inR(sx, y, 18, 18), cur = k < n ? G.trink[k] : null, h = UI.held, fits = k < n && h && IT[h.id] && IT[h.id].type === 'trinket';
    if (k >= n) { c.fillStyle = '#2a2638'; c.fillRect(sx, y, 18, 18); c.fillStyle = '#1a1626'; c.fillRect(sx + 1, y + 1, 16, 16); c.fillStyle = '#4a4460'; c.fillRect(sx + 7, y + 8, 4, 4); c.fillRect(sx + 7, y + 5, 1, 3); c.fillRect(sx + 10, y + 5, 1, 3); c.fillRect(sx + 7, y + 5, 4, 1);
      if (hov) tip = [['LOCKED', '#8b8fa3'], [`Beat ${TRINK_OPEN[k - 2] || 'more guardians'} to open it.`, '#b9bdd0']]; continue; }
    slotBox(c, sx, y, fits, hov); if (cur && IT[cur]) drawStack(c, { id: cur, n: 1 }, sx, y);
    if (hov && cur && !h) tip = itemTip(IT[cur]); else if (hov && !cur && !h) tip = [['TRINKET', '#b49cff'], ['Drop a trinket here, or right click one in your pack.', '#b9bdd0'], ['Trinkets come from the Jeweller\'s Bench and the guardians.', '#8b8fa3']];
    hit(sx, y, 18, 18, () => trinkSlotClick(k), true);
  }
  return tip;
}
