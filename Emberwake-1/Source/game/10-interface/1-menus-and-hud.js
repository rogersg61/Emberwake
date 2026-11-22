// ============================================================
//  UI: menus, HUD, pack + crafting, forms codex, journal,
//  dialogue, the ring scoreboard. Everything clickable registers
//  a hit box while it draws; clicks test last frame's boxes.
// ============================================================
const inR = (x, y, w, h) => mouse.ux >= x && mouse.ux < x + w && mouse.uy >= y && mouse.uy < y + h;
const FORM = { name: '', seed: '', size: 1, shape: 0, mode: 0, skin: 0, hat: 0, nick: '', code: '', accountName: '', accountPassword: '', accountConfirm: '' };
const SIZE_D = ['600 x 260 tiles', '900 x 320 tiles', '1400 x 380 tiles', '2200 x 440 tiles: days to cross'], SHAPE_D = ['every seed deals its lands in a new order', 'the Drift is crowded with islands', 'few islands, the Underdark yawns wider'], MODE_D = ['three embers, any order, nothing forced', 'every item, no monsters, build freely'];
let HITS = [], HITS_NEXT = [];
const hit = (x, y, w, h, fn, slot) => HITS_NEXT.push({ x, y, w, h, fn, slot: !!slot });
function panel(c, x, y, w, h, title) {
  c.fillStyle = INK; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.fillStyle = '#1d1a29'; c.fillRect(x, y, w, h);
  c.fillStyle = '#4a4460'; c.fillRect(x, y, w, 1); c.fillRect(x, y, 1, h); c.fillStyle = '#2b2740'; c.fillRect(x, y + h - 1, w, 1); c.fillRect(x + w - 1, y, 1, h);
  if (title) { c.fillStyle = '#2b2740'; c.fillRect(x + 1, y + 1, w - 2, 11); textS(c, title, x + 5, y + 3, '#ffd35a'); }
}
function button(c, x, y, w, h, label, fn, o = {}) {
  const hv = !o.off && inR(x, y, w, h), on = o.on;
  c.fillStyle = o.off ? '#2b2740' : hv || on ? '#ffd35a' : '#4a4460'; c.fillRect(x, y, w, h);
  c.fillStyle = hv ? '#3a3350' : on ? '#3d3320' : '#262234'; c.fillRect(x + 1, y + 1, w - 2, h - 2);
  textC(c, label, x + w / 2, y + round(h / 2) - 4, o.off ? '#6a6485' : hv || on ? '#ffd35a' : (o.col || '#fff'), 1, drawText);
  if (!o.off) hit(x, y, w, h, fn);
}
function field(c, x, y, w, key, ph) {
  const f = UI.focus === key, raw = FORM[key], secret = key === 'accountPassword' || key === 'accountConfirm', v = secret ? '*'.repeat(min(raw.length, max(1, floor((w - 8) / 6)))) : raw;
  c.fillStyle = f ? '#ffd35a' : inR(x, y, w, 14) ? '#8c86a8' : '#4a4460'; c.fillRect(x, y, w, 14); c.fillStyle = INK; c.fillRect(x + 1, y + 1, w - 2, 12);
  if (v) drawText(c, v, x + 4, y + 4, '#fff'); else drawText(c, ph, x + 4, y + 4, '#6a6485');
  if (f && (performance.now() / 400 | 0) & 1) { c.fillStyle = '#ffd35a'; c.fillRect(x + 5 + (v ? textW(v) : -1), y + 3, 1, 8); }
  hit(x, y, w, 14, () => { UI.focus = key; sfx('ui'); });
}
function chooser(c, x, y, w, label, names, key, descs) {
  drawText(c, label, x, y + 4, '#b9bdd0'); const bx = x + 46, bw = w - 46;
  button(c, bx, y, 14, 14, '<', () => { FORM[key] = (FORM[key] + names.length - 1) % names.length; sfx('ui'); });
  textC(c, names[FORM[key]], bx + bw / 2, y + 4, '#ffd35a', 1, drawText);
  button(c, bx + bw - 14, y, 14, 14, '>', () => { FORM[key] = (FORM[key] + 1) % names.length; sfx('ui'); });
  if (descs) textC(c, descs[FORM[key]], bx + bw / 2, y + 17, '#8b8fa3', 1, drawText);
}
function skinPicker(c, x, y) {
  drawText(c, 'LOOK', x, y + 8, '#b9bdd0');
  for (let i = 0; i < SKINS.length; i++) {
    const bx = x + 46 + i * 24, on = FORM.skin === i; c.fillStyle = on ? '#ffd35a' : inR(bx, y, 20, 22) ? '#8c86a8' : '#4a4460'; c.fillRect(bx, y, 20, 22); c.fillStyle = '#262234'; c.fillRect(bx + 1, y + 1, 18, 20);
    c.drawImage(SK[i].head, bx + 3, y + 2, 14, 14); c.fillStyle = SKINS[i][4]; c.fillRect(bx + 3, y + 17, 7, 2); c.fillStyle = SKINS[i][0]; c.fillRect(bx + 10, y + 17, 7, 2);
    hit(bx, y, 20, 22, () => { FORM.skin = i; sfx('ui'); });
  }
}
function hatPicker(c, x, y) {
  const names = ['NO HAT', 'EMBER', 'CROWN', 'FROST'];
  drawText(c, 'HAT', x, y + 8, '#b9bdd0');
  for (let i = 0; i < names.length; i++) {
    const bx = x + 46 + i * 48, on = FORM.hat === i;
    button(c, bx, y, 44, 16, names[i], () => { FORM.hat = i; sfx('ui'); }, { on });
  }
}
function slotBox(c, x, y, sel, hov) { c.fillStyle = sel ? '#ffd35a' : hov ? '#8c86a8' : '#4a4460'; c.fillRect(x, y, 18, 18); c.fillStyle = sel ? '#3a3350' : '#262234'; c.fillRect(x + 1, y + 1, 16, 16); }
function drawStack(c, s, x, y) { if (!s) return; const ic = IT[s.id].icon; c.drawImage(ic, x + 9 - (ic.width >> 1), y + 9 - (ic.height >> 1)); if (s.n > 1) textO(c, s.n > 999 ? '999' : s.n, x + 17 - textW(min(s.n, 999)), y + 10, '#fff'); }
function bar(c, x, y, w, h, f, col, dark) { c.fillStyle = INK; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.fillStyle = '#2b2740'; c.fillRect(x, y, w, h); const fw = round(w * clamp(f, 0, 1)); c.fillStyle = col; c.fillRect(x, y, fw, h); c.fillStyle = dark; c.fillRect(x, y + h - 1, fw, 1); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x, y, fw, 1); }
const hotN = () => WORLD.arena ? 6 : 10;
const hotbarLayout = () => ({ x: round((VS.uw - hotN() * 19 + 1) / 2), y: VS.uh - 22 });
function invLayout() {
  const wide = VS.uw >= 420, gw = 189, cw = 190, pr = ceil(INV_N / 10), ph = pr * 19 + 20, rows = wide ? clamp(floor((VS.uh - 90) / 19), 4, 9) : clamp(floor((VS.uh - 150 - ph) / 19), 2, 6);
  const tw = wide ? gw + cw + 14 : cw, x0 = round((VS.uw - tw) / 2), y0 = wide ? round(max(34, (VS.uh - rows * 19) / 2 - 20)) : 34;
  const nr = wide ? rows : max(2, rows - 3);
  return { gx: x0, gy: y0, cx: wide ? x0 + gw + 14 : x0, cy: wide ? y0 : y0 + ph + 18 + 80, cw, rows: nr, ph, ay: y0 + ph + 2 };
}
const craftMiss = r => Object.keys(r.need).reduce((n, k) => n + (countItem(k) >= r.need[k] ? 0 : 1), 0);
const craftList = () => RECIPES.filter(r => r.st === 'hand').map(r => ({ r, can: canCraft(r), miss: craftMiss(r) })).sort((a, b) => b.can - a.can || a.miss - b.miss);
function closeUI() { if (UI.stn && COOP.role) { COOP.stns.add(UI.stn.i); netLock(UI.stn.i, false); } UI.job = null; UI.stn = null; UI.msg = null; UI.dust = null; if (UI.held) { const l = addItem(UI.held.id, UI.held.n); if (l) spawnDrop(UI.held.id, l, G.p.x + 3, G.p.y + 4); UI.held = null; } UI.open = null; UI.scroll = 0; }
function toggleUI(n) {
  if (n === 'map' && !hasUtil('fieldmap')) { say('You have no map. Reeds pressed flat, a little charcoal: you could draw one.'); return; }
  if (UI.open === n) closeUI(); else { closeUI(); UI.open = n; UI.scroll = 0; if (n === 'map') mapReveal(); if (n === 'journal') { G.jNew = false; UI.scroll = 9999; } if (n === 'codex') { const it = heldItem(); UI.codex = it && it.type === 'weapon' ? it.set : !it || carried(it) ? 'brawl' : (UI.codex || 'brawl'); } }
  sfx('ui');
}
function slotClick(i, btn) {
  if (btn === 0 && !UI.held && inv[i] && (keys.ShiftLeft || keys.ShiftRight)) { quickMove(i); return; }
  const s = inv[i], h = UI.held, st = s ? IT[s.id].stack : 0;
  // right click a piece of armour to put it on
  if (btn !== 0 && !h && s && IT[s.id].type === 'armor') { wearAt(i); return; }
  if (btn !== 0 && !h && s && IT[s.id].type === 'trinket') { wearTrinketAt(i); return; }
  if (btn === 0) {
    if (!h) { if (s) { UI.held = s; inv[i] = null; } }
    else if (!s) { inv[i] = h; UI.held = null; }
    else if (s.id === h.id && s.n < st) { const k = min(h.n, st - s.n); s.n += k; h.n -= k; if (h.n <= 0) UI.held = null; }
    else { inv[i] = h; UI.held = s; }
  } else {
    if (!h) { if (s && s.n > 1) { const k = ceil(s.n / 2); UI.held = { id: s.id, n: k }; s.n -= k; } else if (s) { UI.held = s; inv[i] = null; } }
    else if (!s) { inv[i] = { id: h.id, n: 1 }; if (--h.n <= 0) UI.held = null; }
    else if (s.id === h.id && s.n < st) { s.n++; if (--h.n <= 0) UI.held = null; }
  }
  G.dirty = true; sfx('ui');
}
function uiMouseDown(btn) {
  UI.focus = null; UI.dn = btn === 0 ? { x: mouse.ux, y: mouse.uy, had: !!UI.held } : null;
  for (let i = HITS.length - 1; i >= 0; i--) { const h = HITS[i]; if (inR(h.x, h.y, h.w, h.h)) { h.fn(btn); if (UI.open === 'stn' && UI.stn && COOP.role) COOP.stns.add(UI.stn.i); return true; } }
  if (G.state !== 'play' || G.dialog) return true;
  if (UI.open === 'inv' && UI.held) { dropHeld(); return true; }
  return !!UI.open && UI.open !== 'score';
}
function drawTip(c, lines) {
  let w = 0; for (const l of lines) w = max(w, textW(l[0])); const h = lines.length * 9 + 5;
  const x = clamp(mouse.ux + 10, 2, VS.uw - w - 10), y = clamp(mouse.uy + 10, 2, VS.uh - h - 2);
  c.fillStyle = INK; c.fillRect(x - 1, y - 1, w + 10, h + 2); c.fillStyle = '#2b2740'; c.fillRect(x, y, w + 8, h); c.fillStyle = '#6a6485'; c.fillRect(x, y, w + 8, 1);
  lines.forEach((l, i) => drawText(c, l[0], x + 4, y + 3 + i * 9, l[1] || '#fff'));
}
function itemTip(it) {
  const L = [[it.name, '#ffd35a']];
  if (it.type === 'weapon') {
    const q = qBonus(it.id), tr = ['bleed', 'poison', 'frost', 'burn', 'steal', 'stag'].filter(k => it[k]).map(k => ({ bleed: 'bleeds', poison: 'poisons', frost: 'chills', burn: 'burns', steal: 'drinks life', stag: 'staggers' }[k]));
    L.push([`${it.dmg} damage${q ? ` (${q > 0 ? '+' : ''}${round(q * 100)}% ${QN[qTier(G.quality[it.id])].toLowerCase()})` : ''}${it.wsp ? (it.wsp < .95 ? ', quick' : it.wsp > 1.08 ? ', slow' : '') : ''}`, '#fff']);
    if (tr.length || it.crit) L.push([[...tr, it.crit ? 'keen' : ''].filter(Boolean).join(', '), '#ffb347']);
    L.push([`${Object.keys(MOVESETS[it.set].moves).filter(k => !isStyleId(k)).length} forms  [C]`, '#8ff5e6']); if (STYLES[weaponType(it)]) L.push([`styles: rank ${styleLevel(weaponType(it))}/5 (V)`, '#ffd35a']);
  }
  else if (it.type === 'tool') L.push([`${{ pick: 'pick', axe: 'axe', shovel: 'shovel', hammer: 'hammer', knife: 'knife' }[it.kind]} : power ${it.power}, works ${TIER_N[it.tier].replace(/^an? /, '').replace(' tool', '')} rock and softer`, '#fff']);
  else if (it.type === 'food') L.push([`food +${it.food || 0}${it.heal ? `, heals ${it.heal}` : ''}`, '#7ddc6f']);
  else if (it.type === 'armor') { L.push([`${it.slot}: protection ${it.prot}, weight ${it.wt}`, '#fff']); if (it.light || it.mine || it.poise || it.shot) L.push([[it.light ? 'sheds light' : '', it.mine ? `digs ${round((it.mine - 1) * 100)}% harder` : '', it.poise ? 'barely flinches' : '', it.shot ? 'turns arrows' : ''].filter(Boolean).join(', '), '#ffb347']); const g = G.gear && G.gear[it.slot]; if (g && g.id !== it.id) L.push([`now wearing ${IT[g.id].name} (${IT[g.id].prot})`, '#8b8fa3']); L.push(['right click to wear', '#8ff5e6']); }
  if (it.type === 'trinket') { const on = (G.trink || []).slice(0, trinkSlots()).includes(it.id); L.push([on ? 'TRINKET: worn' : 'TRINKET', '#b49cff']); }
  for (const l of wrapText(it.desc, 150)) if (l) L.push([l, '#b9bdd0']);
  { const ma = madeAt(it.id); if (ma.length) L.push(['made at: ' + ma.slice(0, 3).join(', '), '#b49cff']); }
  const u = USES[it.id]; if (u && u.length) for (const l of wrapText('Used for: ' + u.slice(0, 6).join(', ') + (u.length > 6 ? `, +${u.length - 6} more` : ''), 150)) L.push([l, '#8ff5e6']);
  return L;
}
function fmtTime(s) { s = s | 0; const h = (s / 3600) | 0, m = ((s % 3600) / 60) | 0; return h ? `${h}h ${m}m` : `${m}m`; }

// ---------------- menus ----------------
function drawLogo(c, cy, sub) {
  const uw = VS.uw, sc = uw > 520 ? 5 : uw > 380 ? 4 : 3, s = 'EMBERWAKE', w = textW(s, sc), x = round((uw - w) / 2);
  textO(c, s, x, cy, '#e2542b', sc, INK); c.save(); c.beginPath(); c.rect(0, cy, uw, sc * 4); c.clip(); drawText(c, s, x, cy, '#ffd35a', sc); c.restore();
  c.save(); c.beginPath(); c.rect(0, cy, uw, sc * 2); c.clip(); drawText(c, s, x, cy, '#fff1a8', sc); c.restore();
  if (sub) textC(c, sub, uw / 2, cy + sc * 8 + 6, '#fff', 1, textO);
}
function drawTitle(c) {
  const uw = VS.uw, uh = VS.uh; c.fillStyle = 'rgba(18,13,31,.38)'; c.fillRect(0, 0, uw, uh);
  drawLogo(c, round(uh * .16), 'THREE EMBERS : GO ANYWHERE');
  const bw = 176, bx = round((uw - bw) / 2), by = round(uh * .47);
  button(c, bx, by, bw, 18, 'WORLDS', () => { G.state = 'worlds'; UI.scroll = 0; UI.confirm = null; G.menuNote = ''; sfx('ui'); });
  button(c, bx, by + 23, bw, 18, 'JOIN A FRIEND', () => { G.state = 'join'; UI.focus = null; COOP.err = ''; COOP.note = ''; COOP.long = false; if (!FORM.nick) FORM.nick = cleanName(G.nick) || 'WAKER' + ((Math.random() * 90 + 10) | 0); sfx('ui'); });
  button(c, bx, by + 46, bw, 18, 'THE CINDER RING : ONLINE PVP', () => { G.state = 'ring'; UI.focus = null; if (!FORM.nick) FORM.nick = 'WAKER' + ((Math.random() * 90 + 10) | 0); sfx('ui'); });
  button(c, bx, by + 69, bw, 18, 'THE ASHFALL : BATTLE ROYALE', () => { G.state = 'brform'; UI.focus = null; if (!FORM.nick) FORM.nick = cleanName(G.nick) || 'WAKER' + ((Math.random() * 90 + 10) | 0); if (FORM.brcode === undefined) FORM.brcode = ''; sfx('ui'); });
  button(c, bx, by + 92, bw, 18, 'ACCOUNT: ' + (ACCOUNT.active ? ACCOUNT.active.name.toUpperCase().slice(0, 16) : 'GUEST'), () => { G.state = 'accounts'; ACCOUNT.note = ''; UI.focus = null; sfx('ui'); });
  button(c, bx, by + 115, bw, 18, muted ? 'SOUND: OFF' : 'SOUND: ON', () => { muted = !muted; sfx('ui'); });
  textC(c, 'build, explore, and fight with every form', uw / 2, uh - 26, '#d8d4e6', 1, textO);
  textC(c, 'mouse + keyboard', uw / 2, uh - 15, '#8b8fa3', 1, textO);
  const vs = 'version ' + GAME_VERSION; textS(c, vs, uw - textW(vs) - 4, uh - 10, '#6a6485');
}
function drawWorlds(c) {
  const uw = VS.uw, uh = VS.uh, w = min(360, uw - 16), x = round((uw - w) / 2), y = 16, h = uh - 32;
  c.fillStyle = 'rgba(18,13,31,.55)'; c.fillRect(0, 0, uw, uh); panel(c, x, y, w, h, 'YOUR WORLDS');
  const st = SAVE.db ? 'saved to your Claude account' : 'saved in this browser'; drawText(c, st, x + w - textW(st) - 6, y + 3, '#8ff5e6');
  const rowH = 26, vis = max(1, floor((h - 50) / rowH)); UI.scroll = clamp(UI.scroll, 0, max(0, SAVE.list.length - vis));
  if (!SAVE.list.length) textC(c, 'No worlds yet. Forge your first one below.', uw / 2, y + 40, '#b9bdd0', 1, drawText);
  for (let i = 0; i < vis; i++) {
    const m = SAVE.list[i + UI.scroll]; if (!m) break; const ry = y + 16 + i * rowH, hv = inR(x + 4, ry, w - 8, rowH - 3);
    c.fillStyle = hv ? '#2b2740' : '#221e30'; c.fillRect(x + 4, ry, w - 8, rowH - 3);
    c.drawImage(SK[clamp(m.skin | 0, 0, 5)].head, x + 8, ry + 4, 14, 14); if (!m.mode) for (let k = 0; k < 3; k++) { c.fillStyle = k < (m.e | 0) ? ['#ffd35a', '#8ff5e6', '#ff9a3d'][k] : '#3a3450'; c.fillRect(x + 9 + k * 4, ry + 19, 3, 2); }
    drawText(c, String(m.name || 'World').slice(0, 24), x + 28, ry + 3, '#fff');
    const prog = m.mode ? 'free forge' : m.v < 3 ? 'old world (will regrow)' : (m.e | 0) + ' of 3 embers';
    { let info = `${MODE_N[m.mode ? 1 : 0]} - ${m.endless ? (GEN_RANGE_N[m.size | 0] || 'Normal') + ' range' : SIZE_N[m.size | 0] || ''} - ${SHAPE_N[m.shape | 0] || ''} - ${prog} - ${fmtTime(m.played || 0)}`; const room = w - 160; if (textW(info) > room) info = `${prog} - ${fmtTime(m.played || 0)}`; while (info.length > 4 && textW(info) > room) info = info.slice(0, -1); drawText(c, info, x + 28, ry + 13, '#8b8fa3'); }
    if (UI.confirm === m.id) {
      drawText(c, 'delete?', x + w - 108, ry + 8, '#ff6b6b');
      button(c, x + w - 70, ry + 4, 30, 14, 'YES', () => { deleteWorld(m.id); UI.confirm = null; sfx('brk'); }, { col: '#ff6b6b' });
      button(c, x + w - 38, ry + 4, 30, 14, 'NO', () => { UI.confirm = null; sfx('ui'); });
    } else {
      button(c, x + w - 126, ry + 4, 40, 14, 'COPY', () => { worldCopy(m); sfx('ui'); });
      button(c, x + w - 82, ry + 4, 44, 14, 'PLAY', () => { openWorld(m); sfx('quest', 0); });
      button(c, x + w - 34, ry + 4, 26, 14, 'X', () => { UI.confirm = m.id; sfx('ui'); }, { col: '#ff9a8a' });
    }
  }
  if (SAVE.list.length > vis) drawText(c, `${UI.scroll + 1}-${min(SAVE.list.length, UI.scroll + vis)} of ${SAVE.list.length}  (wheel)`, x + 6, y + h - 30, '#6a6485');
  if (G.menuNote) drawText(c, G.menuNote, x + 6, y + h - 30, '#ff9a8a'); else if (G.worldNote) drawText(c, G.worldNote, x + 6, y + h - 30, '#7ddc6f');
  button(c, x + 6, y + h - 20, 110, 15, '+ NEW WORLD', () => { G.state = 'create'; Object.assign(FORM, { name: 'World ' + (SAVE.list.length + 1), seed: '' }); UI.focus = 'name'; sfx('ui'); });
  button(c, x + 122, y + h - 20, 110, 15, 'PASTE A WORLD', () => { G.state = 'wpaste'; COOP.err = ''; G.worldNote = ''; sfx('ui'); });
  button(c, x + w - 66, y + h - 20, 60, 15, 'BACK', () => { G.state = 'title'; G.worldNote = ''; sfx('ui'); });
}
function drawCreate(c) {
  const uw = VS.uw, uh = VS.uh, w = min(300, uw - 16), h = 258, x = round((uw - w) / 2), y = max(8, round((uh - h) / 2));
  c.fillStyle = 'rgba(18,13,31,.55)'; c.fillRect(0, 0, uw, uh); panel(c, x, y, w, h, 'FORGE A NEW WORLD');
  const fx = x + 10, fw = w - 20;
  drawText(c, 'NAME', fx, y + 22, '#b9bdd0'); field(c, fx + 46, y + 18, fw - 46, 'name', 'my world');
  drawText(c, 'SEED', fx, y + 42, '#b9bdd0'); field(c, fx + 46, y + 38, fw - 46, 'seed', 'random (type a word or number)');
  chooser(c, fx, y + 60, fw, 'RANGE', GEN_RANGE_N, 'size', GEN_RANGE_D);
  chooser(c, fx, y + 92, fw, 'SHAPE', SHAPE_N, 'shape', SHAPE_D);
  chooser(c, fx, y + 124, fw, 'MODE', MODE_N, 'mode', MODE_D);
  skinPicker(c, fx, y + 158);
  hatPicker(c, fx, y + 188);
  button(c, x + 10, y + h - 26, 140, 18, 'FORGE WORLD', () => { UI.focus = null; createWorld({ name: FORM.name.trim() || 'World', seed: FORM.seed, size: FORM.size, shape: FORM.shape, mode: FORM.mode, skin: FORM.skin, hat: FORM.hat }); sfx('quest', 0); });
  button(c, x + w - 70, y + h - 26, 60, 18, 'BACK', () => { G.state = 'worlds'; UI.focus = null; sfx('ui'); });
}
function drawAccounts(c) {
  const uw = VS.uw, uh = VS.uh, w = min(340, uw - 16), h = min(260, uh - 16), x = round((uw - w) / 2), y = max(8, round((uh - h) / 2));
  c.fillStyle = 'rgba(18,13,31,.55)'; c.fillRect(0, 0, uw, uh); panel(c, x, y, w, h, 'ACCOUNTS');
  const fx = x + 10, fw = w - 20;
  if (ACCOUNT.form === 'create') {
    drawText(c, 'NAME', fx, y + 22, '#b9bdd0'); field(c, fx + 46, y + 18, fw - 46, 'accountName', 'account name');
    drawText(c, 'PASS', fx, y + 42, '#b9bdd0'); field(c, fx + 46, y + 38, fw - 46, 'accountPassword', '8 characters minimum');
    drawText(c, 'AGAIN', fx, y + 62, '#b9bdd0'); field(c, fx + 46, y + 58, fw - 46, 'accountConfirm', 'confirm password');
    skinPicker(c, fx, y + 78);
    hatPicker(c, fx, y + 108);
    button(c, x + 10, y + h - 26, 150, 18, ACCOUNT.busy ? 'CREATING...' : 'CREATE ACCOUNT', () => {
      UI.focus = null;
      accountCreate(FORM.accountName, FORM.accountPassword, FORM.accountConfirm, FORM.skin, FORM.hat).then(ok => {
        if (ok) { G.skin = FORM.skin; G.hat = FORM.hat; G.nick = ACCOUNT.active.name; FORM.accountPassword = FORM.accountConfirm = ''; }
      });
      sfx('quest', 0);
    }, { off: ACCOUNT.busy });
    button(c, x + w - 70, y + h - 26, 60, 18, 'BACK', () => { ACCOUNT.form = 'list'; UI.focus = null; sfx('ui'); });
  } else {
    textC(c, 'SIGN IN TO CONTINUE', uw / 2, y + 17, '#b9bdd0', 1, drawText);
    textC(c, 'Choose an account, or create one. Profiles stay in this browser.', uw / 2, y + 28, '#8b8fa3', 1, drawText);
    const rowH = 22, start = y + 34, visible = max(1, floor((h - 120) / rowH));
    UI.scroll = clamp(UI.scroll, 0, max(0, ACCOUNT.profiles.length - visible));
    for (let i = 0; i < visible; i++) {
      const p = ACCOUNT.profiles[i + UI.scroll]; if (!p) break;
      const ry = start + i * rowH, active = ACCOUNT.active && ACCOUNT.active.id === p.id;
      c.fillStyle = active ? '#3d3320' : inR(x + 6, ry, w - 12, rowH - 4) ? '#2b2740' : '#221e30';
      c.fillRect(x + 6, ry, w - 12, rowH - 3);
      c.drawImage(SK[clamp(p.skin | 0, 0, 5)].head, x + 10, ry + 3, 14, 14);
      drawText(c, p.name, x + 30, ry + 6, active ? '#ffd35a' : '#fff');
      button(c, x + w - 82, ry + 3, 74, 14, active ? 'ACTIVE' : ACCOUNT.loginId === p.id ? 'SELECTED' : 'SELECT', () => {
        if (active) { G.state = 'title'; return; }
        ACCOUNT.loginId = p.id; FORM.accountPassword = ''; FORM.accountConfirm = ''; UI.focus = 'accountPassword'; ACCOUNT.note = '';
        sfx('ui');
      }, { off: active });
    }
    if (ACCOUNT.profiles.length > visible) drawText(c, `${UI.scroll + 1}-${min(ACCOUNT.profiles.length, UI.scroll + visible)} of ${ACCOUNT.profiles.length} (wheel)`, x + 8, start + visible * rowH + 1, '#6a6485');
    const selected = ACCOUNT.profiles.find(v => v.id === ACCOUNT.loginId), legacy = selected && (!selected.salt || !selected.hash);
    if (selected && legacy) {
      panel(c, x + 8, y + h - 104, w - 16, 76, 'SET PASSWORD');
      field(c, x + 70, y + h - 82, 94, 'accountPassword', '8+ characters');
      field(c, x + 70, y + h - 62, 94, 'accountConfirm', 'confirm');
      button(c, x + w - 92, y + h - 44, 80, 14, ACCOUNT.busy ? 'SAVING...' : 'SAVE + LOG IN', () => {
        accountSetPassword(selected, FORM.accountPassword, FORM.accountConfirm).then(ok => { if (ok) FORM.accountPassword = FORM.accountConfirm = ''; });
        sfx('ui');
      }, { off: ACCOUNT.busy });
    } else if (selected) {
      panel(c, x + 8, y + h - 80, w - 16, 52, 'PASSWORD');
      field(c, x + 16, y + h - 58, 150, 'accountPassword', 'your password');
      button(c, x + w - 94, y + h - 58, 82, 14, ACCOUNT.busy ? 'CHECKING...' : 'LOG IN', () => {
        accountLogin(selected, FORM.accountPassword).then(ok => { if (ok) FORM.accountPassword = ''; });
        sfx('ui');
      }, { off: ACCOUNT.busy });
    }
    button(c, x + 6, y + h - 22, 150, 16, '+ CREATE ACCOUNT', () => {
      ACCOUNT.loginId = null; ACCOUNT.form = 'create'; FORM.accountName = ''; FORM.accountPassword = ''; FORM.accountConfirm = ''; if (!FORM.skin) FORM.skin = 0; if (!FORM.hat) FORM.hat = 0; UI.focus = 'accountName'; sfx('ui');
    });
    if (ACCOUNT.active) button(c, x + w - 66, y + h - 22, 60, 16, 'SIGN OUT', () => { accountLogout(); sfx('ui'); });
    else textC(c, 'PASSWORD REQUIRED', x + w - 87, y + h - 12, '#6a6485', 1, drawText);
  }
  if (ACCOUNT.note) textC(c, ACCOUNT.note, uw / 2, y + h - 3, '#8ff5e6', 1, textO);
}
function drawRingForm(c) {
  const uw = VS.uw, uh = VS.uh, w = min(330, uw - 16), h = 214, x = round((uw - w) / 2), y = max(8, round((uh - h) / 2));
  c.fillStyle = 'rgba(18,13,31,.55)'; c.fillRect(0, 0, uw, uh); panel(c, x, y, w, h, 'THE CINDER RING : ONLINE PVP');
  const fx = x + 10, fw = w - 20;
  drawText(c, 'NAME', fx, y + 22, '#b9bdd0'); field(c, fx + 46, y + 18, fw - 46, 'nick', 'WAKER');
  skinPicker(c, fx, y + 38);
  drawText(c, 'RING', fx, y + 70, '#b9bdd0'); field(c, fx + 46, y + 66, fw - 46, 'code', 'open  (or a private code)');
  const L = ['Everyone who opens this game and types the same ring code', 'fights together, live. Leave it blank for the open ring.', 'First to 10 takedowns takes the ring.', 'Alone in a ring? Echoes spar with you until someone joins.'];
  L.forEach((l, i) => drawText(c, l, fx, y + 92 + i * 10, '#d8d4e6'));
  drawText(c, NET.room ? 'Live room: available on this page.' : 'Online play uses the internet relay when no live room is available.', fx, y + 136, NET.room ? '#7ddc6f' : '#8b8fa3');
  drawText(c, 'Use the same ring code and game version to meet your friends.', fx, y + 148, '#8b8fa3');
  button(c, x + 10, y + h - 26, 150, 18, 'ENTER THE RING', () => {
    UI.focus = null; const nick = cleanName(FORM.nick) || 'WAKER'; FORM.nick = nick; G.state = 'loading'; G.loadMsg = 'Entering the ring...';
    setTimeout(() => enterArena(nick, FORM.skin, cleanCode(FORM.code) || 'open'), 30); sfx('quest', 0);
  });
  button(c, x + w - 70, y + h - 26, 60, 18, 'BACK', () => { G.state = 'title'; UI.focus = null; sfx('ui'); });
}

// ---------------- in-game HUD ----------------
function drawHUD(c) {
  const p = G.p, uw = VS.uw, uh = VS.uh, A = WORLD.arena;
  c.drawImage(SPR.heart, 3, 3); bar(c, 15, 4, 72, 7, p.hp / p.maxhp, p.hp < 30 && (G.time >> 3) & 1 ? '#ff9a8a' : '#e2483b', '#8f2233'); textO(c, ceil(max(0, p.hp)), 91, 4, '#fff');
  if (!A && gearOn()) { drawGearHud(c); drawStyleHud(c); drawFamHud(c); drawDrill(c); }
  bar(c, 15, 14, 72, 4, p.stam / p.maxstam, p.stam < 22 ? '#ffd35a' : '#7ddc6f', p.stam < 22 ? '#b85a1e' : '#2f8a43');
  if (!A && WORLD.mode !== 1) { const f = G.food / 100; bar(c, 15, 20, 72, 2, f, f < .25 && (G.time >> 4) & 1 ? '#ff9a8a' : '#e0a050', '#7a4a1a'); if (f < .3) textO(c, f <= 0 ? 'STARVING' : 'HUNGRY', 91, 16, '#e0a050'); }
  if (p.riposte > 0 && (G.time >> 2) & 1) textO(c, 'RIPOSTE READY', 15, 22, '#8ff5e6');
  else if (!UI.open) textS(c, WORLD.royale ? '[F] open chests  [H] heal  [M] map  [TAB] who is left  [R] sidearm  [E] pack' : A ? '[TAB] scores  [C] forms  [P] menu  1-6 weapons  [R] sidearm [T] swap' : '[E] pack  [K] knap  [F] use  [J] journal  [P] menu', 4, 25, '#8b8fa3');
  if (!A && G.jNew && (G.time >> 4) & 1) textS(c, 'NEW JOURNAL ENTRY [J]', 4, 32, '#ffd35a');
  drawBless(c); drawMealHud(c); drawGadgetHud(c); drawCoopHud(c);
  if (G.savedNote) { const t = G.savedNote.t; c.globalAlpha = clamp((120 - t) / 30, 0, 1); textS(c, G.savedNote.ok ? (SAVE.db ? 'saved to your account' : 'saved') : 'could not save', 4, A ? 32 : 42, '#7ddc6f'); c.globalAlpha = 1; }
  // hotbar
  const hb = hotbarLayout();
  for (let i = 0; i < hotN(); i++) {
    const sel = i === G.sel, x = hb.x + i * 19, y = hb.y - (sel ? 2 : 0); slotBox(c, x, y, sel, !G.dialog && inR(x, hb.y - 2, 18, 20)); drawStack(c, inv[i], x, y); drawText(c, (i + 1) % 10, x + 2, y + 2, sel ? '#ffd35a' : '#6a6485');
    if (!G.dialog && UI.open !== 'pause') hit(x, hb.y - 2, 18, 20, b => { if (UI.open === 'inv') slotClick(i, b); else { G.sel = i; G.selT = 120; sfx('ui'); } }, UI.open === 'inv');
  }
  { const id = curArm(p), ax = hb.x + hotN() * 19 + 6, ay = hb.y; c.fillStyle = INK; c.fillRect(ax - 1, ay - 1, 20, 20); c.fillStyle = id ? '#2b2740' : '#1d1828'; c.fillRect(ax, ay, 18, 18); c.fillStyle = '#ff8a3d'; c.fillRect(ax, ay + 17, 18, 1);
    if (id) { const ic = IT[id].icon; c.drawImage(ic, ax + 9 - (ic.width >> 1), ay + 9 - (ic.height >> 1)); const n = (A && !WORLD.royale) || WORLD.mode === 1 || id === 'hook' ? '' : countItem(id); if (n !== '') textO(c, n, ax + 18 - textW(String(n)), ay + 11, '#fff'); if (p.armCd > 0) { c.fillStyle = 'rgba(18,13,31,.6)'; c.fillRect(ax, ay, 18, round(18 * p.armCd / 34)); } }
    drawText(c, 'R', ax + 2, ay + 2, '#ff8a3d'); if (armsOwned(p).length > 1) drawText(c, 'T', ax + 13, ay - 8, '#8b8fa3');
    if (G.armT > 0 && !UI.open) { c.globalAlpha = min(1, G.armT / 30); textO(c, id ? IT[id].name : 'no sidearms', ax + 22, ay + 5, id ? '#ffd35a' : '#8b8fa3'); c.globalAlpha = 1; } }
  const it = heldItem(); if (it && G.selT > 0 && !UI.open) { c.globalAlpha = min(1, G.selT / 30); textC(c, it.name, uw / 2, hb.y - 14, '#fff'); c.globalAlpha = 1; }
  // objective / ring status
  if (!UI.open) { if (WORLD.royale) brHud(c); else if (A) drawRingStatus(c); else { G.miniH = drawMinimap(c); drawObjective(c); } }
  // move feed
  let fy = round(uh * .34);
  G.feed.forEach((f, i) => { const a = clamp(1 - (f.t - 150) / 60, 0, 1) * (1 - i * .16); if (a <= 0) return; c.globalAlpha = a; const x = 6 + (f.t < 6 ? (6 - f.t) * -3 : 0); if (f.isNew) { textO(c, 'NEW FORM', x, fy, '#8ff5e6'); fy += 9; } textO(c, f.name, x, fy, f.isNew ? '#ffd35a' : f.fresh ? '#fff' : '#8b8fa3'); if (i === 0 && !f.fresh) drawText(c, 'dull', x + textW(f.name) + 5, fy, '#6a6485'); fy += 10; });
  c.globalAlpha = 1;
  if (G.combo.n > 1 && !A) { const r = rankI(), s = `${G.combo.n} HITS`, x = uw - 8 - textW(s, 2), y = round(uh * .34), pop = G.combo.t > 172 ? 1 : 0; textO(c, s, x, y - pop, '#fff', 2); if (r) textO(c, RANKS[r], uw - 8 - textW(RANKS[r]), y + 18, RANK_COL[r]); bar(c, uw - 68, y + 29, 60, 2, G.combo.t / 180, RANK_COL[r], '#4a4460'); }
  // boss bars
  const b = G.boss, v = G.duel;
  if (b && b.state !== 'intro') { const bw = clamp(uw - 300, 110, 220), bx = round((uw - bw) / 2); textC(c, b.name, uw / 2, 5, '#ffd35a', 1, textO); bar(c, bx, 15, bw, 6, b.hp / b.maxhp, b.phase === 2 ? '#ff7a2a' : '#c94a3a', '#8f2233'); if (b.state === 'tired' || b.state === 'stagger') textC(c, 'STAGGERED: STRIKE NOW', uw / 2, 24, (G.time >> 3) & 1 ? '#8ff5e6' : '#fff', 1, textO); else if (b.st && b.st.blind > 0) textC(c, 'BLINDED', uw / 2, 24, '#b9bdd0', 1, textO); }
  else if (v && !v.yielded) { const bw = clamp(uw - 300, 110, 220), bx = round((uw - bw) / 2); textC(c, 'VESPER, THE GLASS WAKER', uw / 2, 5, '#8ff5e6', 1, textO); bar(c, bx, 15, bw, 6, v.hp / v.maxhp, v.phase === 2 ? '#8ff5e6' : '#6fb9c9', '#3f7f92'); }
  // banners and notes
  if (G.biomeT > 0 && !G.banner && G.state === 'play') { const a = min(1, G.biomeT / 40, (200 - G.biomeT) / 30); c.globalAlpha = max(0, a); const s = BIOME[G.biome] || ''; textC(c, s, uw / 2, round(uh * .2), '#fff', 2, textO); c.fillStyle = '#ffd35a'; c.fillRect(round(uw / 2 - 30), round(uh * .2) + 20, 60, 1); c.globalAlpha = 1; }
  if (G.banner && G.banner.t >= 0) { const t = G.banner.t, a = clamp(min(t / 25, (230 - t) / 30), 0, 1); c.globalAlpha = a; textC(c, G.banner.text, uw / 2, round(uh * .24), '#ffd35a', 2, textO); if (G.banner.sub) textC(c, G.banner.sub, uw / 2, round(uh * .24) + 22, '#fff', 1, textO); c.globalAlpha = 1; }
  if (G.note && G.note.t >= 0) { c.globalAlpha = clamp(min(G.note.t / 15, (240 - G.note.t) / 30), 0, 1); textC(c, G.note.text, uw / 2, 36, '#ffd35a', 1, textO); c.globalAlpha = 1; }
  if (G.linkBanner) { const t = G.linkBanner.t, a = clamp(min(t / 8, (150 - t) / 25), 0, 1), y = round(uh * .36); c.globalAlpha = a; textC(c, G.linkBanner.first ? 'NEW LINK' : 'LINK', uw / 2, y - 12, '#8ff5e6', 1, textO); textC(c, G.linkBanner.name.toUpperCase(), uw / 2 + (t < 8 ? (8 - t) * 3 : 0), y, '#fff1a8', 2, textO); c.globalAlpha = 1; }
  if (G.leadDone) { const t = G.leadDone.t; c.globalAlpha = clamp(min(t / 15, (200 - t) / 30), 0, 1); textC(c, 'LEAD FOLLOWED : ' + G.leadDone.title, uw / 2, 48, '#7ddc6f', 1, textO); c.globalAlpha = 1; }
  G.picks.forEach((q, i) => { c.globalAlpha = clamp((200 - q.t) / 40, 0, 1); const ic = IT[q.id].icon, y = uh - 16 - i * 12; c.drawImage(ic, 4, y - (ic.height >> 1) + 4); textS(c, `+${q.n} ${IT[q.id].name}`, 24, y, '#fff'); }); c.globalAlpha = 1;
  if (G.sayCur && !UI.open && !G.dialog) {
    const s = G.sayCur, col = s.who === 'vesper' ? '#8ff5e6' : s.who === 'wick' ? '#ffd35a' : '#ff8a3d', w = min(300, uw - 30), lines = wrapText(s.text, w - 16), h = lines.length * 9 + 8, x = round((uw - w) / 2), y = hb.y - 22 - h; let left = floor(s.t / 1.4);
    c.globalAlpha = clamp((s.text.length * 1.4 + 190 - s.t) / 30, 0, 1); c.fillStyle = 'rgba(18,13,31,.8)'; c.fillRect(x, y, w, h); c.fillStyle = col; c.fillRect(x, y, 2, h);
    lines.forEach((l, i) => { if (left <= 0) return; drawText(c, l.slice(0, left), x + 8, y + 5 + i * 9, s.who === 'vesper' ? '#c9fff6' : '#fff1a8'); left -= l.length + 1; }); c.globalAlpha = 1;
  }
  if (A) drawKillFeed(c);
  if (p.dead && !WORLD.royale) {
    c.fillStyle = `rgba(18,13,31,${min(.6, p.deadT / 100)})`; c.fillRect(0, 0, uw, uh); c.globalAlpha = min(1, p.deadT / 50);
    textC(c, A ? 'TAKEN DOWN' : 'YOUR EMBER GUTTERS', uw / 2, round(uh * .4), '#e2483b', 2, textO);
    if (A) textC(c, 'rising in ' + max(1, ceil((150 - p.deadT) / 60)), uw / 2, round(uh * .4) + 22, '#fff', 1, textO);
    c.globalAlpha = 1;
  }
}
function drawObjective(c) {
  const uw = VS.uw, p = G.p, id = G.pin, L = id && LEADS[id];
  if (WORLD.mode === 1 && !L) return;
  if (!L) { if (leadsOpen().length) textS(c, '[J] leads', uw - 52, 6 + (G.miniH || 0), '#6a6485'); return; }
  const qw = min(160, uw - 200), lines = wrapText(L.text, qw - 10), at = leadAt(L), qh = 14 + min(3, lines.length) * 9 + (at !== null && at !== undefined ? 9 : 0), qx = uw - qw - 4, oy = G.miniH || 0;
  c.fillStyle = 'rgba(18,13,31,.62)'; c.fillRect(qx, 4 + oy, qw, qh); c.fillStyle = '#ffd35a'; c.fillRect(qx, 4 + oy, 2, qh);
  textS(c, 'LEAD : ' + L.title.toUpperCase(), qx + 6, 7 + oy, '#ffd35a'); lines.slice(0, 3).forEach((l, i) => textS(c, l, qx + 6, 17 + oy + i * 9, '#fff'));
  if (at !== null && at !== undefined) { const d = at * T - p.x, m = round(abs(d) / T); textS(c, m < 8 ? 'you are here' : d > 0 ? `→ ${m} paces east` : `← ${m} paces west`, qx + 6, 17 + oy + min(3, lines.length) * 9, '#8ff5e6'); }
}
function ringStatusText() { return NET.status === 'online' ? `ONLINE : ${NET.peers.size + 1} WAKER${NET.peers.size ? 'S' : ''}` : NET.status === 'connecting' ? 'CONNECTING...' : 'OFFLINE : PRACTICE'; }
function drawRingStatus(c) {
  const uw = VS.uw, list = [...G.fighters].filter(f => !f.npc).sort((a, b) => b.kills - a.kills || a.deaths - b.deaths);
  const w = 120, x = uw - w - 4; let y = 4;
  c.fillStyle = 'rgba(18,13,31,.62)'; c.fillRect(x, y, w, 13 + min(5, list.length) * 9); c.fillStyle = NET.status === 'online' ? '#7ddc6f' : '#ffb347'; c.fillRect(x, y, 2, 13 + min(5, list.length) * 9);
  textS(c, `RING ${NET.code.toUpperCase()}`, x + 6, y + 3, '#ffd35a'); drawText(c, NET.status === 'online' ? 'live' : NET.status === 'connecting' ? '...' : 'solo', x + w - 24, y + 3, NET.status === 'online' ? '#7ddc6f' : '#ffb347');
  list.slice(0, 5).forEach((f, i) => { const yy = y + 13 + i * 9, me = f === G.p; drawText(c, (me ? '> ' : '') + f.name, x + 6, yy, me ? '#ffd35a' : f.echoBot ? '#b9bdd0' : '#8ff5e6'); drawText(c, String(f.kills), x + w - 8 - textW(f.kills), yy, '#fff'); });
  textC(c, ringStatusText(), uw / 2, 4, NET.status === 'online' ? '#7ddc6f' : '#ffb347', 1, textO);
  if (NET.roundOver) textC(c, 'next round in ' + ceil(NET.roundOver / 60), uw / 2, 14, '#fff', 1, textO);
}
function drawKillFeed(c) {
  const uw = VS.uw; let y = WORLD.royale ? 30 : 4 + 13 + min(5, G.fighters.length) * 9 + 6;
  for (const k of G.kfeed) {
    const a = clamp((330 - k.t) / 40, 0, 1); if (a <= 0) continue; c.globalAlpha = a;
    const s = k.txt ? `${k.b} ${k.txt}` : (k.a ? `${k.a} > ${k.b}` : `${k.b} fell`), w = textW(s) + 8, x = uw - w - 4;
    c.fillStyle = k.me === 1 ? 'rgba(255,211,90,.35)' : k.me === 2 ? 'rgba(226,72,59,.35)' : 'rgba(18,13,31,.55)'; c.fillRect(x, y, w, 10); drawText(c, s, x + 4, y + 1, '#fff'); y += 11;
  }
  c.globalAlpha = 1;
}
function drawScore(c) {
  const uw = VS.uw, uh = VS.uh, list = [...G.fighters].sort((a, b) => b.kills - a.kills || a.deaths - b.deaths), w = min(260, uw - 16), h = 34 + list.length * 11, x = round((uw - w) / 2), y = round((uh - h) / 2) - 10;
  panel(c, x, y, w, h, `THE CINDER RING : ${NET.code.toUpperCase()} : ROUND ${NET.rd + 1}`);
  drawText(c, 'WAKER', x + 8, y + 16, '#8b8fa3'); drawText(c, 'TAKEDOWNS', x + w - 110, y + 16, '#8b8fa3'); drawText(c, 'FALLS', x + w - 44, y + 16, '#8b8fa3');
  list.forEach((f, i) => { const yy = y + 28 + i * 11, me = f === G.p; if (me) { c.fillStyle = '#2b2740'; c.fillRect(x + 4, yy - 2, w - 8, 10); } drawText(c, f.name + (f.echoBot ? '  (echo)' : f.remote ? '' : '  (you)'), x + 8, yy, me ? '#ffd35a' : f.echoBot ? '#b9bdd0' : '#8ff5e6'); drawText(c, String(f.kills), x + w - 80, yy, '#fff'); drawText(c, String(f.deaths), x + w - 34, yy, '#fff'); });
  drawText(c, ringStatusText(), x + 8, y + h - 10, '#7ddc6f');
}
function drawInv(c) {
  const L = invLayout(); let tip = null;
  // the panels catch clicks first (so a click never falls through into the world); the slots and rows drawn after them sit on top
  hit(L.gx - 5, L.gy - 16, 199, L.ph, () => { }); hit(L.cx - 5, L.cy - 16, L.cw + 10, L.rows * 19 + 21, () => { });
  panel(c, L.gx - 5, L.gy - 16, 199, L.ph + 0, `PACK ${INV_N}`); { const hb = hotbarLayout(); textC(c, 'drag to move  :  drag out to drop  :  shift-click: hotbar / pack  :  right-click splits', VS.uw / 2, hb.y - 13, '#b9bdd0', 1, textO); }
  if (hasItem('rock') || hasItem('flint') || WORLD.mode === 1) button(c, L.gx + 120, L.gy - 15, 68, 10, 'KNAP [K]', () => toggleUI('knap'));
  for (let i = 0; i < INV_N; i++) { const x = L.gx + (i % 10) * 19, y = L.gy + floor(i / 10) * 19, hov = inR(x, y, 18, 18); slotBox(c, x, y, i === G.sel, hov); drawStack(c, inv[i], x, y); if (hov && inv[i] && !UI.held) tip = itemTip(IT[inv[i].id]); hit(x, y, 18, 18, b => slotClick(i, b), true); }
  const list = craftList(); UI.scroll = clamp(UI.scroll, 0, max(0, list.length - L.rows));
  panel(c, L.cx - 5, L.cy - 16, L.cw + 10, L.rows * 19 + 21, 'BY HAND'); button(c, L.cx + L.cw - 62, L.cy - 15, 64, 10, 'BOOK [B]', () => toggleUI('book'));
  drawText(c, 'more at benches [F]', L.cx, L.cy + L.rows * 19 + 7, '#6a6485');
  for (let r = 0; r < L.rows; r++) {
    const e = list[r + UI.scroll]; if (!e) break; const x = L.cx, y = L.cy + r * 19, hov = inR(x, y, L.cw, 18), it = IT[e.r.out];
    if (hov) { c.fillStyle = '#2b2740'; c.fillRect(x, y, L.cw, 18); }
    slotBox(c, x, y, false, hov && e.can); c.globalAlpha = e.can ? 1 : .4; drawStack(c, { id: e.r.out, n: e.r.n }, x, y); c.globalAlpha = 1;
    drawText(c, it.name, x + 22, y + 1, e.can ? '#fff' : '#8b8fa3');
    let nx = x + 22; for (const k in e.r.need) { if (nx > x + L.cw - 10) { drawText(c, '...', nx, y + 10, '#8b8fa3'); break; } const hv = countItem(k), s = `${min(hv, e.r.need[k])}/${e.r.need[k]} ${IT[k].name}`; nx += drawText(c, s, nx, y + 10, hv >= e.r.need[k] ? '#7ddc6f' : '#e2483b') + 5; }
    if (hov) { tip = itemTip(it).slice(0, 4); tip.push(['NEEDS', '#ffd35a']); for (const k in e.r.need) { const hv = countItem(k); tip.push([`${IT[k].name}: ${hv} of ${e.r.need[k]}`, hv >= e.r.need[k] ? '#7ddc6f' : '#e2483b']); } tip.push([e.can ? 'click to make it' : 'you are missing the red ones', e.can ? '#8ff5e6' : '#b9bdd0']); }
    hit(x, y, L.cw, 18, () => craft(e.r));
  }
  if (list.length > L.rows) drawText(c, `${UI.scroll + 1}-${min(list.length, UI.scroll + L.rows)}/${list.length}`, L.cx + L.cw - 34, L.cy + L.rows * 19 + 7, '#6a6485');
  if (!WORLD.arena) { const t2 = drawGearPanel(c, L.gx, L.ay + 14); if (t2) tip = t2; }
  if (tip) drawTip(c, tip);
}
const CODEX_SETS = ['brawl', 'sword', 'spear', 'fangs', 'maul', 'bow', 'chuks', 'links', 'styles'], CODEX_TABS = ['FISTS', 'BLADE', 'PIKE', 'FANGS', 'MAUL', 'BOW', 'CHAIN', 'LINKS', 'STYLE'];
// forms that only the movement keys or cursor distance reach: not used with SIMPLE controls
const fullOnly = (set, id) => SETTINGS.combat === 'simple' && ['far', 'back', 'near', 'hBack'].some(k => set.map[k] === id) && !['up', 'upf', 'down', 'h', 'hUp', 'hDown', 'hFwd', 'dash', 'rip', 'aD', 'aU', 'ha', 'haU', 'haD'].some(k => set.map[k] === id) && !set.map.chain.includes(id) && !set.map.aChain.includes(id);
const ST_NAME = { pin: 'pinned', hook: 'hooked', burn: 'burning', blind: 'blinded', launched: 'in the air' };
function drawCodex(c) {
  const sn = UI.codex || 'sword', w = min(404, VS.uw - 12), h = min(VS.uh - 44, 340), x = round((VS.uw - w) / 2), y = round((VS.uh - h) / 2) - 8;
  const tx0 = x + 78, tw = floor((w - 82) / CODEX_SETS.length);
  const tabs = () => CODEX_SETS.forEach((s, i) => button(c, tx0 + i * tw, y + 1, tw - 2, 11, CODEX_TABS[i], () => { UI.codex = s; UI.scroll = 0; sfx('ui'); }, { on: s === sn }));
  if (sn === 'links') {
    panel(c, x, y, w, h, `LINKS ${G.linksKnown.size}/${LINK_ORDER.length}`); hit(x, y, w, h, () => { }); tabs();
    const rows = [{ h: 'SIDEARMS : [R] THROW  [T] SWITCH' }, { t: 'Star Knife: carries a foe into the nearest wall and pins it there.', col: '#e8edf2' }, { t: 'Chain Hook: drags a foe to you, or you to a wall. Big foes pull you in.', col: '#e8edf2' }, { t: 'Ember Flask: bursts into fire that clings. Smoke Pellet: blinds.', col: '#e8edf2' }, { t: 'Launchers (aim up) throw a foe into the air.', col: '#e8edf2' }, { h: 'LINKS : THE RIGHT WEAPON ON THE RIGHT MOMENT' }];
    for (const id of LINK_ORDER) { const L = LINKS[id], k = G.linksKnown.has(id); rows.push({ L, k, id }); }
    const vis = floor((h - 32) / 10); UI.scroll = clamp(UI.scroll, 0, max(0, rows.length - vis));
    for (let i = 0; i < vis; i++) {
      const r = rows[i + UI.scroll]; if (!r) break; const ry = y + 16 + i * 10;
      if (r.h) { textS(c, r.h, x + 6, ry, '#ffd35a'); continue; } if (r.t) { drawText(c, r.t, x + 8, ry, '#b9bdd0'); continue; }
      const L = r.L, names = L.sets.length > 4 ? 'any close weapon' : L.sets.map(s => CODEX_TABS[CODEX_SETS.indexOf(s)]).join(' / ');
      c.fillStyle = r.k ? '#7ddc6f' : '#4a4460'; c.fillRect(x + 7, ry + 1, 3, 5);
      drawText(c, r.k ? L.name : '???', x + 13, ry, r.k ? '#fff' : '#8b8fa3');
      drawText(c, `${ST_NAME[L.st]} + ${names} + ${L.btn === 'L' ? 'LMB' : 'RMB'}`, x + 104, ry, r.k ? '#b9bdd0' : '#6f6a85');
    }
    drawText(c, 'A link fires when you attack a foe in that state, close enough.', x + 6, y + h - 10, '#8ff5e6'); return;
  }
  if (sn === 'styles') { drawStylesPage(c, x, y, w, h, tabs); return; }
  const set = MOVESETS[sn]; let kn = 0, tot = 0; for (const k in set.moves) { if (isStyleId(k)) continue; tot++; if (G.known.has(sn + ':' + k)) kn++; }
  panel(c, x, y, w, h, `FORMS ${kn}/${tot}`); hit(x, y, w, h, () => { }); tabs();
  { const st = famStep(sn), xp = (G.fam && G.fam[sn]) || 0; textS(c, (FAM_NAME[sn] || '') + ': ' + FAM_STEP[st] + (st < 3 && !famAll() ? '  ' + floor(xp) + '/' + FAM_AT[st + 1] + ' to ' + FAM_STEP[st + 1] : '') + '.  Best at ' + (FAM_LEAN_T[sn] || 'everything') + '.', x + 6, y + h - 30, '#ffd35a'); }
  const rows = []; for (const [sec, ids] of set.sections) { rows.push({ h: sec }); for (const id of ids) rows.push({ id, m: set.moves[id] }); }
  const vis = floor((h - 40) / 9); UI.scroll = clamp(UI.scroll, 0, max(0, rows.length - vis));
  for (let i = 0; i < vis; i++) {
    const r = rows[i + UI.scroll]; if (!r) break; const ry = y + 16 + i * 9;
    if (r.h) { textS(c, r.h, x + 6, ry, '#ffd35a'); c.fillStyle = '#4a4460'; c.fillRect(x + 10 + textW(r.h), ry + 3, w - 18 - textW(r.h), 1); }
    else { const k = G.known.has(sn + ':' + r.id), lock = !famOpen(sn, r.id) || (r.m.art && !famAll() && !(G.arts && [...G.arts].some(q => q.startsWith(sn) && +q.slice(sn.length) >= r.m.art))), off = fullOnly(set, r.id) || lock; c.fillStyle = off ? '#4a4460' : r.m.btn === 'L' ? '#6c93a8' : '#ff8a3d'; c.fillRect(x + 7, ry, 2, 7); drawText(c, r.m.name, x + 13, ry, off ? '#6a6485' : k ? '#fff' : '#8b8fa3'); if (k && !off) { c.fillStyle = '#7ddc6f'; c.fillRect(x + 108, ry + 2, 3, 3); } drawText(c, lock ? (r.m.art ? 'art of ' + ART_TIER_N[r.m.art] + ' weapons' : 'learned at ' + FAM_STEP[set.tier[r.id]]) : off ? 'FULL controls only (pause menu)' : r.m.hint, x + 116, ry, off ? '#5a5470' : k ? '#b9bdd0' : '#6f6a85'); }
  }
  drawText(c, SETTINGS.combat === 'simple' ? 'SIMPLE controls: aim and S choose the form, not A / D.' : 'Forward key = A or D toward your cursor. Back key = away.', x + 6, y + h - 20, '#b9bdd0');
  drawText(c, 'Fresh forms hit 10% harder. Repeats go dull. Wheel scrolls.', x + 6, y + h - 10, '#8ff5e6');
}
function drawJournal(c) {
  const w = min(330, VS.uw - 12), h = min(VS.uh - 44, 300), x = round((VS.uw - w) / 2), y = round((VS.uh - h) / 2) - 8, tab = UI.jtab || 'leads';
  panel(c, x, y, w, h, 'JOURNAL'); hit(x, y, w, h, () => { });
  button(c, x + 70, y + 1, 50, 11, 'LEADS', () => { UI.jtab = 'leads'; UI.scroll = 0; sfx('ui'); }, { on: tab === 'leads' });
  button(c, x + 123, y + 1, 50, 11, 'LORE', () => { UI.jtab = 'lore'; UI.scroll = 0; G.jNew = false; sfx('ui'); }, { on: tab === 'lore' });
  button(c, x + 176, y + 1, 50, 11, 'ECHOES', () => { UI.jtab = 'echo'; UI.scroll = 0; sfx('ui'); }, { on: tab === 'echo' });
  button(c, x + 229, y + 1, 50, 11, 'BEASTS', () => { UI.jtab = 'beast'; UI.scroll = 0; sfx('ui'); }, { on: tab === 'beast' });
  if (tab === 'leads') {
    const open = leadsOpen(), done = LEAD_ORDER.filter(id => G.leads.has(id) && LEADS[id].done()), rows = [];
    rows.push({ t: open.length ? 'Things you have heard about. Click one to follow it, or none.' : 'No open leads. Talk to people, read notices, wander.', col: '#8b8fa3' });
    for (const id of open) { const L = LEADS[id], at = leadAt(L); rows.push({ id, title: L.title, sub: at !== null && at !== undefined ? (at * T > G.p.x ? `${round(abs(at * T - G.p.x) / T)} paces east` : `${round(abs(at * T - G.p.x) / T)} paces west`) : '' }); for (const l of wrapText(L.text, w - 24)) rows.push({ t: l, col: '#d8d4e6', id }); }
    if (done.length) { rows.push({ t: '' }); rows.push({ t: 'FOLLOWED', col: '#7ddc6f' }); for (const id of done) rows.push({ t: '  ' + LEADS[id].title, col: '#6f6a85' }); }
    const vis = floor((h - 22) / 9); UI.scroll = clamp(UI.scroll, 0, max(0, rows.length - vis));
    for (let i = 0; i < vis; i++) {
      const r = rows[i + UI.scroll]; if (!r) break; const ry = y + 17 + i * 9;
      if (r.title) { const on = G.pin === r.id, hv = inR(x + 4, ry - 1, w - 8, 9); if (hv || on) { c.fillStyle = on ? '#3a3020' : '#2b2740'; c.fillRect(x + 4, ry - 1, w - 8, 9); } c.fillStyle = on ? '#ffd35a' : '#6a6485'; c.fillRect(x + 6, ry, 3, 6); drawText(c, r.title, x + 12, ry, on ? '#ffd35a' : '#fff'); if (r.sub) drawText(c, r.sub, x + w - textW(r.sub) - 8, ry, '#8ff5e6'); if (on) drawText(c, 'following', x + 16 + textW(r.title), ry, '#b85a1e'); hit(x + 4, ry - 1, w - 8, 9, () => { G.pin = G.pin === r.id ? null : r.id; sfx('ui'); }); }
      else if (r.t) drawText(c, r.t, x + 12, ry, r.col);
    }
  } else if (tab === 'echo') drawEchoTab(c, x, y, w, h);
  else if (tab === 'beast') drawBeastTab(c, x, y, w, h);
  else {
    const rows = []; for (const id of G.journal) { if (!JOURNAL[id]) continue; rows.push([JOURNAL[id][0], '#ffd35a']); for (const l of wrapText(JOURNAL[id][1], w - 16)) rows.push([l, '#d8d4e6']); rows.push(['', '']); }
    const vis = floor((h - 22) / 9); UI.scroll = clamp(UI.scroll, 0, max(0, rows.length - vis));
    for (let i = 0; i < vis; i++) { const r = rows[i + UI.scroll]; if (!r) break; if (r[0]) drawText(c, r[0], x + 8, y + 17 + i * 9, r[1]); }
    if (rows.length > vis) drawText(c, 'wheel', x + w - 34, y + 3, '#6a6485');
  }
}
function drawPause(c) {
  const A = WORLD.arena, w = min(A ? 340 : 392, VS.uw - 16), h = A ? 158 : 240, x = round((VS.uw - w) / 2), y = round((VS.uh - h) / 2);
  panel(c, x, y, w, h, A ? (WORLD.royale ? 'THE ASHFALL : MENU' : 'THE CINDER RING : MENU') : `${WORLD.name.toUpperCase()} : PAUSED`); hit(x, y, w, h, () => { });
  button(c, x + 8, y + 18, 70, 15, 'RESUME', () => { closeUI(); sfx('ui'); });
  button(c, x + 84, y + 18, 96, 15, A ? (WORLD.royale ? (BR.via !== 'solo' ? 'TO THE LOBBY' : 'LEAVE MATCH') : 'LEAVE RING') : 'SAVE & QUIT', () => { closeUI(); if (WORLD.royale && BR.on && BR.via !== 'solo') brBackToLobby(); else quitToTitle(); sfx('ui'); });
  button(c, x + 186, y + 18, 84, 15, muted ? 'SOUND: OFF' : 'SOUND: ON', () => { muted = !muted; sfx('ui'); });
  if (!A) button(c, x + 276, y + 18, 56, 15, 'SAVE', () => { saveWorld(); sfx('craft'); });
  if (!A && G.p && !G.boss && !G.duel) button(c, x + w - 112, y + h - 19, 104, 13, 'WAKE AT THE FIRE', () => { closeUI(); wakeAtFire(); });
  if (!A) button(c, x + w - 112, y + h - 36, 104, 13, netGuest() ? 'LEAVE THEIR WORLD' : COOP.role ? 'PLAY TOGETHER (' + (1 + [...COOP.peers.values()].filter(P => P.ok).length) + ')' : 'PLAY TOGETHER', () => { if (netGuest()) { closeUI(); quitToTitle(); } else { UI.open = 'coop'; COOP.err = ''; sfx('ui'); } });
  button(c, x + 8, y + h - 19, 118, 13, 'CONTROLS: ' + (SETTINGS.combat === 'simple' ? 'SIMPLE' : 'FULL'), () => { SETTINGS.combat = SETTINGS.combat === 'simple' ? 'full' : 'simple'; saveSettings(); sfx('ui'); });
  if (!A) button(c, x + 8, y + h - 36, 118, 13, 'CRAFTING: ' + (SETTINGS.craft === 'hands' ? 'HANDS-ON' : 'SIMPLE'), () => { SETTINGS.craft = SETTINGS.craft === 'hands' ? 'simple' : 'hands'; saveSettings(); UI.job = null; sfx('ui'); });
  button(c, x + 130, y + h - 36, 118, 13, 'FPS MODE: ' + (SETTINGS.fpsMode ? 'ON' : 'OFF'), () => { SETTINGS.fpsMode = !SETTINGS.fpsMode; if (SETTINGS.fpsMode) G.parts.length = 0; saveSettings(); sfx('ui'); });
  if (!A) button(c, x + 130, y + h - 19, 118, 13, 'DIFFICULTY: ' + DIFF().n, () => { SETTINGS.diff = SETTINGS.diff === 'easy' ? 'normal' : SETTINGS.diff === 'normal' ? 'hard' : 'easy'; saveSettings(); sfx('ui'); });
  const H = ['A / D  move        SPACE or W  jump        SHIFT  dodge', 'LMB  light attack (hold to keep going)   RMB or Q  heavy', ...(SETTINGS.combat === 'simple' ? ['Aim up to launch, aim down or hold S for low blows. Click', 'a creature to punch it, whatever you are holding.'] : ['Where you aim, which keys you hold, whether you are in', 'the air and how far the cursor is all change the attack.']), 'Dodge through a hit at the last moment, then strike: Riposte.', A ? '1-6 weapons    TAB scores    C forms    O sound' : '1-0 / wheel  hotbar     E  pack + crafting     C  forms', A ? 'R  throw sidearm    T  switch sidearm    Echoes leave when a Waker joins.' : 'J  journal + leads   F  talk / use   H  quick heal', A ? '' : 'R  throw sidearm   T  switch sidearm   S held: drop through bridges', A ? '' : 'Ore, keys and such leave your fists free.   K  knap   M  map', A ? '' : 'F beside a station uses it. Hold W/S on ladders. RMB opens doors.', A ? '' : 'V  weapon style (5 per weapon)   X  swap to off hand', A ? '' : 'Tools swing where you point, at rock or beast. Hold RMB: heavy.'];
  H.forEach((l, i) => drawText(c, l, x + 8, y + 42 + i * 12, i === 2 || i === 3 ? '#8ff5e6' : '#d8d4e6'));
}
function drawDialog(c) {
  const d = G.dialog, line = d.s.lines[d.i], sp = SPEAKER[line[0]] || { col: '#fff', skin: 0 }, uw = VS.uw, uh = VS.uh;
  d.t += 1.15; const w = min(380, uw - 16), h = 58, x = round((uw - w) / 2), y = uh - h - 30;
  panel(c, x, y, w, h); c.fillStyle = '#262234'; c.fillRect(x + 6, y + 6, 46, 46); c.fillStyle = sp.col; c.fillRect(x + 6, y + 50, 46, 2);
  const hd = SK[sp.skin].head; c.drawImage(hd, x + 29 - hd.width * 2.5, y + 10, hd.width * 5, hd.height * 5);
  textS(c, line[0], x + 60, y + 7, sp.col);
  let left = floor(d.t); wrapText(line[1], w - 70).forEach((l, i) => { if (left <= 0) return; drawText(c, l.slice(0, left), x + 60, y + 19 + i * 9, '#fff'); left -= l.length + 1; });
  if (d.t >= line[1].length && (performance.now() / 400 | 0) & 1) drawText(c, d.i < d.s.lines.length - 1 ? 'click' : 'done', x + w - 30, y + h - 10, '#8b8fa3');
  hit(0, 0, uw, uh, () => dialogAdvance());
}
function drawUI(c) {
  HITS_NEXT = []; const uw = VS.uw, uh = VS.uh, st = G.state;
  if (st === 'title') drawTitle(c); else if (st === 'accounts') drawAccounts(c); else if (st === 'worlds') drawWorlds(c); else if (st === 'create') drawCreate(c); else if (st === 'ring') drawRingForm(c); else if (st === 'brform') drawBrForm(c); else if (st === 'brlobby') drawBrLobby(c); else if (st === 'join') drawJoin(c); else if (st === 'wcopy') drawWorldCopy(c); else if (st === 'wpaste') drawWorldPaste(c);
  else if (st === 'loading') { c.fillStyle = 'rgba(18,13,31,.82)'; c.fillRect(0, 0, uw, uh); textC(c, G.loadMsg || 'Loading...', uw / 2, round(uh * .45), '#fff1a8', 1, textO); const n = (performance.now() / 300 | 0) % 4; textC(c, '.'.repeat(n), uw / 2, round(uh * .45) + 12, '#ffd35a', 1, textO); }
  else if (st === 'intro') {
    c.fillStyle = 'rgba(18,13,31,.84)'; c.fillRect(0, 0, uw, uh);
    const lines = INTRO[G.introI].split('\n'), y0 = round(uh * .4 - lines.length * 6); c.globalAlpha = clamp(G.introT / 40, 0, 1);
    lines.forEach((l, i) => textC(c, l, uw / 2, y0 + i * 13, '#fff1a8', 1, textO)); c.globalAlpha = 1;
    if (G.introT > 50) textC(c, 'click to continue', uw / 2, round(uh * .78), '#8b8fa3', 1, textS);
  } else if (G.cine) {
    const ci = G.cine, a = clamp(min((ci.t - 30) / 25, (ci.dur - 20 - ci.t) / 25), 0, 1);
    c.globalAlpha = a; textC(c, ci.title, uw / 2, round(uh * .2), '#ffd35a', uw > 420 ? 3 : 2, textO); if (ci.sub) textC(c, ci.sub, uw / 2, round(uh * .2) + (uw > 420 ? 30 : 22), '#fff', 1, textO); c.globalAlpha = 1;
    if (ci.t > 30) textC(c, 'space to skip', uw / 2, uh - 14, '#6a6485', 1, textS);
    if (G.dialog) drawDialog(c);
  } else {
    drawHUD(c);
    if (UI.open === 'inv') drawInv(c); else if (UI.open === 'codex') drawCodex(c); else if (UI.open === 'journal') drawJournal(c); else if (UI.open === 'pause') drawPause(c); else if (UI.open === 'coop') drawCoopPanel(c);
    else if (UI.open === 'book') drawBook(c); else if (UI.open === 'stn') drawStation(c); else if (UI.open === 'knap') drawKnap(c); else if (UI.open === 'map') drawMap(c); else if (UI.open === 'board') drawBoard(c); else if (UI.open === 'rift') drawRiftUI(c); else if (UI.open === 'echo') drawEchoUI(c);
    drawCompass(c);
    if (WORLD.arena && !WORLD.royale && keys.Tab && !UI.open) drawScore(c);
    if (G.dialog) drawDialog(c);
    if (UI.held) drawStack(c, UI.held, mouse.ux - 9, mouse.uy - 9);
    drawChatBox(c);
  }
  domSweep();
  HITS = HITS_NEXT;
  c.drawImage(SPR.cursor, mouse.ux - 3, mouse.uy - 3);
}
// ---------------- moving things in and out of the pack ----------------
// throw what you hold on the cursor into the world in front of you
function dropHeld() {
  if (!UI.held) return; const p = G.p, n0 = G.drops.length; spawnDrop(UI.held.id, UI.held.n, p.x + 3 + p.face * 8, p.y + 6, p.face * 2.2, -1.5);
  if (G.drops.length > n0) { G.drops[G.drops.length - 1].delay = 90; netDropOut(G.drops[G.drops.length - 1]); }
  UI.held = null; G.dirty = true; sfx('ui');
}
// [G]: drop one of what is in your hand (shift: the whole stack)
function dropSelected(all) {
  const s = inv[G.sel]; if (!s) { sfx('deny'); return; } const n = all ? s.n : 1, p = G.p, n0 = G.drops.length;
  spawnDrop(s.id, n, p.x + 3 + p.face * 8, p.y + 6, p.face * 2.2, -1.5); if (G.drops.length > n0) { G.drops[G.drops.length - 1].delay = 90; netDropOut(G.drops[G.drops.length - 1]); }
  s.n -= n; if (s.n <= 0) inv[G.sel] = null; G.dirty = true; sfx('ui');
}
// shift-click: hotbar to pack, or pack to hotbar
function quickMove(i) {
  const s = inv[i]; if (!s) return; const hn = hotN(), toPack = i < hn, a = toPack ? hn : 0, b = toPack ? INV_N : hn, st = IT[s.id].stack;
  for (let k = a; k < b && s.n > 0; k++) { const t = inv[k]; if (t && t.id === s.id && t.n < st) { const m = min(s.n, st - t.n); t.n += m; s.n -= m; } }
  for (let k = a; k < b && s.n > 0; k++) if (!inv[k]) { inv[k] = { id: s.id, n: s.n }; s.n = 0; }
  if (s.n <= 0) inv[i] = null; else { sfx('deny'); return; } G.dirty = true; sfx('ui');
}
// letting go of the mouse after dragging a stack: drop it on the slot under the cursor, or out into the world
function uiMouseUp() {
  const d = UI.dn; UI.dn = null; if (!d || d.had || !UI.held || G.state !== 'play') return;
  if (abs(mouse.ux - d.x) + abs(mouse.uy - d.y) < 5) return;
  for (let i = HITS.length - 1; i >= 0; i--) { const h = HITS[i]; if (inR(h.x, h.y, h.w, h.h)) { if (h.slot) h.fn(0); return; } }
  if (UI.open === 'inv') dropHeld();
}
