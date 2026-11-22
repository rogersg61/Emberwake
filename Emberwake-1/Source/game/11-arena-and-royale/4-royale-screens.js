// ============================================================
//  The Ashfall on screen: the menu, the lobby, the barge, chests,
//  the storm, the match HUD, the map, and the end of a match.
// ============================================================
function drawBrForm(c) {
  const uw = VS.uw, uh = VS.uh, w = min(350, uw - 16), h = 258, x = round((uw - w) / 2), y = max(8, round((uh - h) / 2));
  c.fillStyle = 'rgba(18,13,31,.55)'; c.fillRect(0, 0, uw, uh); panel(c, x, y, w, h, 'THE ASHFALL : BATTLE ROYALE');
  const fx = x + 10, fw = w - 20;
  drawText(c, 'NAME', fx, y + 22, '#b9bdd0'); field(c, fx + 46, y + 18, fw - 46, 'nick', 'WAKER');
  skinPicker(c, fx, y + 38);
  drawText(c, 'MATCH', fx, y + 70, '#b9bdd0'); field(c, fx + 46, y + 66, fw - 46, 'brcode', 'open  (or a private code)');
  const L = ['Ride the Ember Barge over the island and leap off (SPACE).', 'Open chests (F) for weapons, salves and wards. The ashfall', 'storm closes in from both sides: last one standing wins.', 'Echoes fill any empty places, so a match is never empty.'];
  L.forEach((l, i) => drawText(c, l, fx, y + 92 + i * 10, '#d8d4e6'));
  const go = (fn) => { UI.focus = null; const nick = cleanName(FORM.nick) || 'WAKER'; FORM.nick = nick; G.nick = nick; G.skin = FORM.skin | 0; accountSaveProfile(); G.state = 'loading'; G.loadMsg = 'Raising the island...'; setTimeout(fn, 30); sfx('quest', 0); };
  let by = y + 140;
  if (NET.room) { button(c, fx, by, fw, 17, 'PLAY ONLINE', () => go(() => brLobbyEnter('room', cleanCode(FORM.brcode) || 'open'))); drawText(c, 'Everyone with this page open on claude.ai who picks the same match meets here.', fx, by + 20, '#8b8fa3'); by += 34; }
  else { drawText(c, 'Online lobby: only on claude.ai (open this page there to find others).', fx, by + 4, '#ffb347'); by += 16; }
  if (netOK()) { button(c, fx, by, fw, 17, 'HOST A MATCH FOR FRIENDS', () => go(() => { COOP.br = true; brLobbyEnter('rtc', 'friends'); })); drawText(c, 'Invite up to 3 friends with codes; they pick JOIN A FRIEND.', fx, by + 20, '#8b8fa3'); by += 34; }
  button(c, fx, by, fw, 17, 'PLAY WITH ECHOES', () => go(() => brSolo())); by += 22;
  button(c, x + w - 70, y + h - 22, 60, 15, 'BACK', () => { G.state = 'title'; UI.focus = null; sfx('ui'); });
}
function drawBrLobby(c) {
  const uw = VS.uw, uh = VS.uh, host = BR.via === 'rtc' && netHost(), w = min(384, uw - 16), h = host ? 250 : 196, x = round((uw - w) / 2), y = max(8, round((uh - h) / 2)), fx = x + 10, fw = w - 20;
  c.fillStyle = 'rgba(18,13,31,.5)'; c.fillRect(0, 0, uw, uh); panel(c, x, y, w, h, 'THE ASHFALL : LOBBY' + (BR.via === 'room' ? '  (' + BR.code.toUpperCase() + ')' : ''));
  const me = brMe(), list = [{ id: me, n: G.nick, me: true }]; for (const [id, q] of BR.people) list.push({ id, n: q.n, ph: q.ph });
  list.sort((a, b) => (a.ph === 'M') - (b.ph === 'M') || (a.id < b.id ? -1 : 1));
  let ty = y + 18;
  drawText(c, 'WAKERS HERE', fx, ty, '#b9bdd0'); ty += 11;
  list.slice(0, 8).forEach((e, i) => { const yy = ty + i * 10, lead = e.id === BR.leaderId && e.ph !== 'M'; drawText(c, (e.me ? '> ' : '  ') + e.n + (e.me ? ' (you)' : ''), fx + (i >= 4 ? fw / 2 : 0), ty + (i % 4) * 10, e.ph === 'M' ? '#8b8fa3' : e.me ? '#ffd35a' : '#8ff5e6'); if (lead) drawText(c, 'LEADS', fx + (i >= 4 ? fw / 2 : 0) + 110, ty + (i % 4) * 10, '#7ddc6f'); if (e.ph === 'M') drawText(c, 'IN A MATCH', fx + (i >= 4 ? fw / 2 : 0) + 110, ty + (i % 4) * 10, '#8b8fa3'); });
  ty += 44;
  const now = performance.now(), cd = BR.lead ? (BR.cdEnd ? max(0, ceil((BR.cdEnd - now) / 1000)) : -1) : BR.lastCd > 0 ? BR.lastCd : -1;
  let st;
  if (BR.via === 'room' && NET.status === 'offline') st = ['The live room cannot be reached from here.', '#ffb347'];
  else if (BR.via === 'room' && !NET.me) st = ['Joining the lobby...', '#ffd35a'];
  else if (BR.via === 'rtc' && BR.lead) st = [BR.lobbyN > 1 ? 'Everyone here? Press START NOW. Echoes fill the empty places.' : 'Give your friends the game code below, then press START NOW.', '#7ddc6f'];
  else if (BR.busy && cd < 0) st = ['A match is running. The next one starts when it ends (or start now).', '#ffd35a'];
  else if (cd >= 0) st = ['The barge leaves in ' + cd + 's' + (BR.lobbyN < 2 ? '  (echoes fill the empty places)' : ''), '#7ddc6f'];
  else st = ['Waiting for the leader...', '#d8d4e6'];
  wrapDraw(c, st[0], fx, ty, fw, st[1]); ty += 22;
  if (BR.via === 'room' && NET.status === 'offline') button(c, fx, ty, 150, 15, 'PLAY WITH ECHOES', () => { brLeave(); brSolo(); });
  else if (BR.lead) button(c, fx, ty, 150, 15, 'START NOW', () => { BR.startNow = true; sfx('ui'); });
  else if (BR.via === 'rtc') drawText(c, 'Your host starts the match.', fx, ty + 4, '#8b8fa3');
  ty += 22;
  if (host) {
    if (!netOK()) drawText(c, 'This window cannot connect to other computers.', fx, ty, '#ffb347');
    else {
      sigHost('br'); drawText(c, 'GAME CODE: friends pick JOIN A FRIEND and type it', fx, ty, '#d8d4e6'); ty += 11;
      c.fillStyle = '#16121f'; c.fillRect(fx, ty, fw, 26); textC(c, sigSpaced(COOP.gcode || '......'), fx + (fw - 64) / 2, ty + 5, '#ffd35a', 2, textO);
      button(c, fx + fw - 60, ty + 7, 56, 12, copyLabel(), () => copyText(COOP.gcode, 'gcopy')); ty += 31;
      const s2 = COOP.err || COOP.note || (sigReady() ? 'Ready: up to 3 friends can join with this code.' : performance.now() - SIG.startT > 7000 ? "Can't reach the internet, so friends can't find this match." : 'Getting ready...');
      if (COOP.copied > 0 && COOP.copyFail) copyHint(c, fx, ty); else wrapDraw(c, s2, fx, ty, fw, COOP.err ? '#ff9a8a' : sigReady() ? '#7ddc6f' : '#ffd35a');
    }
  }
  drawText(c, BR.via === 'room' ? 'Friends need this page: share it from claude.ai.' : BR.via === 'rtc' ? 'Up to 4 Wakers; echoes fill the rest.' : '', fx, y + h - 16, '#8b8fa3');
  button(c, x + w - 70, y + h - 20, 60, 14, 'LEAVE', () => { brLeave(); sfx('ui'); });
}

// ---------------- in the world ----------------
function brDrawBarge(w, b, al) {
  const X = round(b.x), Y = round(b.y), d = b.dir, t = G.time;
  w.fillStyle = INK; w.fillRect(X - 30, Y + 6, 60, 10); w.fillRect(X - 24, Y + 16, 48, 3);
  w.fillStyle = '#7a4a2a'; w.fillRect(X - 29, Y + 7, 58, 8); w.fillStyle = '#a06a3a'; w.fillRect(X - 29, Y + 7, 58, 2); w.fillStyle = '#5a3420'; for (let k = -24; k < 28; k += 8) w.fillRect(X + k, Y + 9, 1, 6);
  w.fillStyle = '#ffd35a'; for (let k = -20; k < 24; k += 10) w.fillRect(X + k, Y + 10, 3, 2);
  w.fillStyle = '#3a2a20'; w.fillRect(X - 1, Y - 22, 2, 29); w.fillRect(X - 20, Y - 16, 1, 23); w.fillRect(X + 19, Y - 16, 1, 23);
  w.fillStyle = INK; w.beginPath(); w.ellipse(X, Y - 26, 34, 13, 0, 0, TAU); w.fill();
  w.fillStyle = '#c94a2e'; w.beginPath(); w.ellipse(X, Y - 26, 33, 12, 0, 0, TAU); w.fill(); w.fillStyle = '#ff7a3d'; w.beginPath(); w.ellipse(X - 3, Y - 29, 28, 7, 0, 0, TAU); w.fill(); w.fillStyle = '#ffb36a'; w.fillRect(X - 18, Y - 34, 22, 2);
  w.fillStyle = '#8f2a1e'; for (let k = -24; k <= 24; k += 12) w.fillRect(X + k, Y - 37, 1, 22);
  const fl = 4 + ((t >> 2) & 3); w.fillStyle = '#ffd35a'; w.fillRect(X - d * 32 - (d > 0 ? fl : 0), Y + 9, fl, 3); w.fillStyle = '#ff7a2a'; w.fillRect(X - d * 32 - (d > 0 ? fl + 2 : -fl), Y + 10, 2, 2);
}
function brWorld(w, al, cx, cy) {
  if (!brOn()) return; const q = STN_SPR[CHEST], vx0 = cx - 20, vx1 = cx + VS.vw + 20;
  for (const ch of BR.chests) {
    const px = ch.x * T, py = ch.y * T; if (px < vx0 || px > vx1 || py < cy - 20 || py > cy + VS.vh + 20) continue;
    if (ch.open) { w.globalAlpha = .55; w.drawImage(q.img, px + q.ox, py + q.oy + 1); w.globalAlpha = 1; w.fillStyle = '#2a1e16'; w.fillRect(px + q.ox + 1, py + q.oy + 1, q.img.width - 2, 2); }
    else { w.drawImage(q.img, px + q.ox, py + q.oy); if (ch.rare) { w.fillStyle = '#ffd35a'; w.fillRect(px + q.ox + 1, py + q.oy, q.img.width - 2, 1); } }
  }
  if (BR.phase === 'drop' || BR.t < BR_DROP + 240) { const b = brBarge(min(BR.t, BR_DROP) + max(0, BR.t - BR_DROP)); if (b.x > cx - 80 && b.x < cx + VS.vw + 80) brDrawBarge(w, { x: BR.t > BR_DROP ? b.x + b.dir * (BR.t - BR_DROP) * 3 : b.x, y: b.y - max(0, BR.t - BR_DROP) * .3, dir: b.dir }, al); }
}
function brGlider(ctx, f, al) {
  const x = round(lerp(f.px, f.x, al)) + 3, y = round(lerp(f.py, f.y, al)) - 9, k = (G.time >> 3) & 1;
  ctx.fillStyle = INK; ctx.fillRect(x - 10, y - 1, 20, 4); ctx.fillStyle = '#ff7a3d'; ctx.fillRect(x - 9, y, 18, 2); ctx.fillStyle = '#ffd35a'; ctx.fillRect(x - 9, y, 6, 1); ctx.fillRect(x + 3, y, 6, 1);
  ctx.fillStyle = '#c94a2e'; ctx.fillRect(x - 10, y + 2 + k, 2, 1); ctx.fillRect(x + 8, y + 2 + k, 2, 1); ctx.fillStyle = '#d8d4e6'; ctx.fillRect(x - 6, y + 2, 1, 8); ctx.fillRect(x + 5, y + 2, 1, 8);
}
function brActors(ctx, al) { if (!brOn()) return; for (const f of G.fighters) if (f.glide && !f.dead && !f.onBarge && (f !== G.p || !G.p.dead)) brGlider(ctx, f, al); }
// unlit, in the world: the storm curtains, chest prompts, wards over heads
function brOverlay(ctx, al, cx, cy) {
  if (!brOn() || !BR.storm) return; const z = BR.storm, vh = VS.vh, top = cy - 4, x0 = cx - 4, x1 = cx + VS.vw + 4;
  if (z.dps > 0 || z.moving) {
    const pulse = .26 + .05 * sin(G.time * .05);
    for (const [a, b] of [[x0, min(x1, z.L)], [max(x0, z.R), x1]]) {
      if (b <= a) continue; ctx.fillStyle = `rgba(110,40,130,${pulse})`; ctx.fillRect(a, top, b - a, vh + 8);
      for (let k = 0; k < 40; k++) { const fx = a + ((hh(k, 3, 9) * 997 + G.time * (.3 + hh(k, 4, 9))) % max(1, b - a)), fy = top + ((hh(k, 5, 9) * 613 + G.time * (.6 + hh(k, 6, 9) * .8)) % (vh + 8)); ctx.fillStyle = k % 3 ? 'rgba(255,140,80,.55)' : 'rgba(220,200,255,.5)'; ctx.fillRect(round(fx), round(fy), 1, 2); }
    }
    for (const e of [z.L, z.R]) if (e > x0 - 4 && e < x1 + 4) { const g = .55 + .25 * sin(G.time * .2 + e); ctx.fillStyle = `rgba(255,120,200,${g})`; ctx.fillRect(round(e) - 1, top, 2, vh + 8); ctx.fillStyle = 'rgba(255,220,240,.5)'; ctx.fillRect(round(e), top, 1, vh + 8); }
  }
  const p = G.p;
  if (!p.dead && !p.onBarge) { const ch = brNearChest(p, 22); if (ch) { const s = '[F] OPEN', X = ch.x * T + 4, Y = ch.y * T - 10; textO(ctx, s, round(X - textW(s) / 2), Y, ch.rare ? '#ffd35a' : '#fff'); } }
  for (const f of G.fighters) { if (f === p || f.dead || f.onBarge || !f.brIn || (f.ward || 0) <= 0 || f.x < x0 || f.x > x1) continue; const X = round(lerp(f.px, f.x, al)) - 3, Y = round(lerp(f.py, f.y, al)) - 4; ctx.fillStyle = INK; ctx.fillRect(X - 1, Y - 1, 14, 3); ctx.fillStyle = '#5aa8ff'; ctx.fillRect(X, Y, round(12 * f.ward / 100), 1); }
}
function brScreen(ctx, W, H) {
  if (!brOn()) return;
  if (BR.inStorm) { ctx.fillStyle = `rgba(120,40,150,${.14 + .06 * sin(G.time * .1)})`; ctx.fillRect(0, 0, W, H); }
}

// ---------------- the HUD ----------------
function brStrip(c, x, y, w, h) {
  const m = BR.mapCv; c.fillStyle = INK; c.fillRect(x - 1, y - 1, w + 2, h + 2); c.fillStyle = 'rgba(40,50,80,.85)'; c.fillRect(x, y, w, h);
  if (m) { c.globalAlpha = .9; c.drawImage(m, 0, round(m.height * .3), m.width, round(m.height * .45), x, y, w, h); c.globalAlpha = 1; }
  const k = w / (BRW * T), z = BR.storm;
  if (z) {
    c.fillStyle = 'rgba(150,60,170,.55)'; c.fillRect(x, y, max(0, round(z.L * k)), h); c.fillRect(x + round(z.R * k), y, max(0, w - round(z.R * k)), h);
    c.fillStyle = '#ffffff'; c.fillRect(x + round(z.nL * k), y + h, max(1, round((z.nR - z.nL) * k)), 1); c.fillRect(x + round(z.nL * k), y - 1, 1, h + 2); c.fillRect(x + round(z.nR * k), y - 1, 1, h + 2);
  }
  for (const q of BR.pois) { c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x + round(q.x * T * k), y + h - 2, 1, 2); }
  const p = G.p, me = p.onBarge ? brBarge() : p; c.fillStyle = '#ffd35a'; c.fillRect(x + round((me.x + 3) * k) - 1, y - 2, 3, h + 4);
}
function brHud(c) {
  const p = G.p, uw = VS.uw, uh = VS.uh, z = BR.storm, alive = BR.lastAlive;
  if ((p.ward || 0) > 0) { bar(c, 15, 20, 72, 3, p.ward / 100, '#8fd0ff', '#2a62c0'); textO(c, round(p.ward), 91, 17, '#8fd0ff'); }
  // the storm strip and its clock
  const sw = clamp(uw - 280, 140, 260), sx = round((uw - sw) / 2); brStrip(c, sx, 4, sw, 9);
  let msg = '', col = '#fff';
  if (BR.phase === 'drop' && p.onBarge) { msg = 'SPACE TO LEAP  :  the barge drops you in ' + max(0, ceil((BR_DROP - BR.t) / 60)) + 's'; col = '#ffd35a'; }
  else if (BR.phase === 'drop') { msg = 'the ashfall gathers'; col = '#d8d4e6'; }
  else if (z && z.moving) { msg = 'THE ASHFALL CLOSES IN  ' + ceil(z.left / 60) + 's'; col = '#ff9adf'; }
  else if (z && z.i < STORM.length) { msg = 'the ashfall moves in ' + ceil(z.left / 60) + 's'; col = '#e8d8ff'; }
  else msg = 'the ashfall has closed';
  textC(c, msg, uw / 2, 17, col, 1, textO);
  // who is left
  const bw = 96, bx = uw - bw - 4; c.fillStyle = 'rgba(18,13,31,.66)'; c.fillRect(bx, 4, bw, 22); c.fillStyle = '#ff8a3d'; c.fillRect(bx, 4, 2, 22);
  textO(c, alive + ' LEFT', bx + 7, 7, '#fff1a8', 1); drawText(c, p.kills + ' taken down', bx + 7, 16, '#d8d4e6');
  if (BR.inStorm && (G.time >> 4) & 1) textC(c, 'YOU ARE IN THE ASHFALL', uw / 2, round(uh * .3), '#ff9adf', 1, textO);
  if (BR.noteT > 0) { c.globalAlpha = min(1, BR.noteT / 30); textC(c, BR.note, uw / 2, round(uh * .66), '#fff', 1, textO); c.globalAlpha = 1; }
  if (p.brUse) { const u = p.brUse, it = IT[u.id], hb = hotbarLayout(), w2 = 110, x2 = round((uw - w2) / 2), y2 = hb.y - 24; textC(c, (it.ward ? 'MENDING YOUR WARD' : 'APPLYING ' + it.name.toUpperCase()), uw / 2, y2 - 9, it.ward ? '#8fd0ff' : '#7ddc6f', 1, textO); bar(c, x2, y2, w2, 4, u.t / u.dur, it.ward ? '#8fd0ff' : '#7ddc6f', '#2b2740'); }
  if (keys.Tab && !UI.open) brScore(c);
  if ((BR.mapOpen || (p.onBarge && !BR.mapHide)) && !UI.open) brMap(c);
  if (p.dead && BR.phase !== 'over') brDeadPanel(c);
  if (BR.phase === 'over' && BR.overT > 80) brResults(c);
}
function brScore(c) {
  const list = G.fighters.filter(f => f.brIn).sort((a, b) => (a.dead - b.dead) || b.kills - a.kills), uw = VS.uw, w = 200, h = 22 + list.length * 10, x = round((uw - w) / 2), y = 40;
  panel(c, x, y, w, h, 'THE ASHFALL : ' + BR.lastAlive + ' OF ' + list.length + ' LEFT');
  list.forEach((f, i) => { const yy = y + 16 + i * 10; drawText(c, (f === G.p ? '> ' : '') + f.name + (f.brBot || f.ghostBot ? '  (echo)' : ''), x + 8, yy, f.dead ? '#6a6485' : f === G.p ? '#ffd35a' : f.brBot || f.ghostBot ? '#d8d4e6' : '#8ff5e6'); drawText(c, f.dead ? 'down' : String(f.kills), x + w - 30, yy, f.dead ? '#6a6485' : '#fff'); });
}
function brMap(c) {
  const m = BR.mapCv; if (!m) return; const uw = VS.uw, uh = VS.uh, w = min(uw - 30, 520), k = w / m.width, sy0 = 8, sh = 48, h = round(sh * k), x = round((uw - w) / 2), y = max(30, round((uh - h) / 2) - 10);
  panel(c, x - 6, y - 16, w + 12, h + 30, 'THE ISLAND  [M] close'); c.fillStyle = '#2a3150'; c.fillRect(x, y, w, h); c.drawImage(m, 0, sy0, m.width, sh, x, y, w, h);
  const s = w / (BRW * T), oy = sy0 * 2 * T * s, z = BR.storm;
  if (z) { c.fillStyle = 'rgba(150,60,170,.45)'; c.fillRect(x, y, round(z.L * s), h); c.fillRect(x + round(z.R * s), y, w - round(z.R * s), h); c.fillStyle = '#ffffff'; c.fillRect(x + round(z.nL * s), y, 1, h); c.fillRect(x + round(z.nR * s), y, 1, h); }
  for (const q of BR.pois) { const X = x + round(q.x * T * s), Y = y + round(heights[q.x] * T * s - oy) - 14; textC(c, q.name, X, max(y + 2, Y), '#fff1a8', 1, textO); }
  for (const ch of BR.chests) if (!ch.open && !ch.cave) { c.fillStyle = ch.rare ? '#ffd35a' : 'rgba(255,200,120,.7)'; c.fillRect(x + round(ch.x * T * s), y + round(ch.y * T * s - oy), 1, 1); }
  const p = G.p, me = p.onBarge ? brBarge() : p, my = clamp(round((me.y + 10) * s - oy), 2, h - 2); c.fillStyle = '#ffd35a'; c.fillRect(x + round((me.x + 3) * s) - 2, y + my - 2, 5, 5); c.fillStyle = INK; c.fillRect(x + round((me.x + 3) * s), y + my, 1, 1);
  if (p.onBarge) textC(c, 'SPACE to leap here', x + round((me.x + 3) * s), y + my + 6, '#ffd35a', 1, textO);
}
function brDeadPanel(c) {
  const p = G.p, uw = VS.uw, uh = VS.uh, a = min(1, p.deadT / 50), by = p.lastHitBy;
  c.globalAlpha = a; textC(c, 'TAKEN DOWN', uw / 2, round(uh * .3), '#e2483b', 2, textO);
  textC(c, '#' + BR.place + ' of ' + BR.total + (by && !by.gone ? '  :  ' + by.name + ' got you' : ''), uw / 2, round(uh * .3) + 22, '#fff', 1, textO);
  const s = BR.spec; if (s) textC(c, 'watching ' + s.name + '   [A] [D] switch', uw / 2, uh - 46, '#8ff5e6', 1, textO);
  c.globalAlpha = 1;
  if (p.deadT > 60) { const bw = 110, x = round(uw / 2 - bw - 4); if (BR.via !== 'solo') button(c, x, uh - 34, bw, 14, 'BACK TO LOBBY', () => brBackToLobby()); else button(c, x, uh - 34, bw, 14, 'PLAY AGAIN', () => brSolo()); button(c, round(uw / 2 + 4), uh - 34, bw, 14, 'LEAVE', () => brLeave()); }
}
function brResults(c) {
  const uw = VS.uw, uh = VS.uh, w = min(280, uw - 16), h = 96, x = round((uw - w) / 2), y = round(uh * .55);
  panel(c, x, y, w, h, BR.winMe ? 'VICTORY' : 'THE ASHFALL SETTLES');
  textC(c, BR.winMe ? 'You are the last ember burning.' : BR.winner ? BR.winner + ' is the last ember.' : 'Nobody walked out of the ashfall.', uw / 2, y + 18, BR.winMe ? '#ffd35a' : '#fff', 1, textO);
  textC(c, 'You placed #' + (BR.place || 1) + ' of ' + BR.total + '   :   ' + G.p.kills + ' taken down', uw / 2, y + 32, '#d8d4e6', 1, drawText);
  if (BR.via !== 'solo') textC(c, 'back to the lobby in ' + max(0, ceil((60 * 14 - BR.overT) / 60)) + 's', uw / 2, y + 46, '#8b8fa3', 1, drawText);
  const bw = 110; if (BR.via !== 'solo') button(c, x + 10, y + h - 24, bw, 15, 'BACK TO LOBBY', () => brBackToLobby()); else button(c, x + 10, y + h - 24, bw, 15, 'PLAY AGAIN', () => brSolo());
  button(c, x + w - bw - 10, y + h - 24, bw, 15, 'LEAVE', () => brLeave());
}
// rarity: a coloured edge on a stack in the hotbar, and a glow under drops
const brTierOf = id => { const k = brTier(id); return k; };
function brDropGlow(w, d, x, y) { const k = brTier(d.id); if (k < 1) return; w.globalAlpha = .35 + .15 * sin(G.time * .1 + d.x); w.fillStyle = BR_TCOL[k]; w.fillRect(round(x) - 4, round(y) + 3, 9, 2); w.fillRect(round(x) - 1, round(y) - 6, 2, 9); w.globalAlpha = 1; }
