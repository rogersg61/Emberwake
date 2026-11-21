// ============================================================
//  The Ashfall, together. Two ways to share a match:
//  - on claude.ai, the page's live room: everyone who picks the same
//    match code meets in one lobby;
//  - anywhere else, invite codes: the host's computer passes every
//    player's state on to the others (the same codes as playing together).
//  Both look the same to the game: each computer publishes its own
//  Waker as one small "presence" object and reads everyone else's.
//  The first person in the lobby leads: they start the match, keep the
//  storm clock and run the echoes. If they leave, the next one takes over.
// ============================================================
const brMe = () => NET.me || 'me';
function brJoinRoom(code) {
  NET.code = code; NET.peers.clear(); NET.seen.clear(); NET.me = ''; NET.hits = []; NET.shots = [];
  const tok = ++NET.joinTok;
  if (!NET.room) { NET.status = 'offline'; return; }
  NET.status = 'connecting';
  NET.room.join('br-' + code).then(R => {
    if (tok !== NET.joinTok || !BR.on) { try { R.leave(); } catch (e) { } return; }
    NET.R = R; NET.status = R.connected() ? 'online' : 'connecting';
    NET.unsubs.push(R.onPeers(ch => { if (NET.R === R) netPeers(ch.peers); }, () => { if (NET.R === R) NET.status = 'offline'; }));
    NET.unsubs.push(R.onConnection(c => { if (NET.R === R && NET.status !== 'offline') NET.status = c ? 'online' : 'connecting'; }, () => { if (NET.R === R) NET.status = 'offline'; }));
    brSend();
  }, () => { if (tok === NET.joinTok) NET.status = 'offline'; });
}
// ---------------- the lobby ----------------
function brLobbyEnter(via, code) {
  BR.on = true; BR.via = via; BR.code = code || 'open'; BR.phase = 'lobby'; BR.mi = ''; BR.lead = false; BR.leaderId = ''; BR.cdEnd = 0; BR.lastCd = 0; BR.startNow = false; BR.err = ''; BR.sq = 0;
  BR.people.clear(); NET.peers.clear();
  if (!WORLD.royale) { genRoyale((Math.random() * 4294967296) >>> 0); freshSession(); G.p = newPlayer(); G.fighters = [G.p]; G.clock = .32; updateSun(); G.cam.x = G.cam.px = 40 * T; }
  G.state = 'brlobby'; UI.open = null; UI.focus = null;
  if (via === 'room') brJoinRoom(BR.code);
  else if (via === 'rtc') { NET.code = BR.code; NET.status = 'online'; if (!COOP.role) { COOP.role = 'host'; COOP.me = 'h'; COOP.hostName = coopName(); } COOP.br = true; NET.me = netGuest() ? COOP.me : '0h'; NET.R = brRtcRoom(); NET.unsubs.push(NET.R.onPeers(ch => netPeers(ch.peers))); }
}
function brLobbyTick() {
  if (!BR.on || G.state !== 'brlobby') return;
  const now = performance.now(), me = brMe();
  if (BR.via === 'rtc') brRtcTick();
  const ids = [me]; let busy = 0;
  for (const [id, q] of BR.people) { if (q.ph === 'L') ids.push(id); else if (q.ph === 'M') busy++; }
  ids.sort(); const known = BR.via !== 'room' || !!NET.me, lead = known && ids[0] === me;
  if (lead && !BR.lead) BR.cdEnd = BR.lastCd > 0 ? now + BR.lastCd * 1000 : 0;
  BR.lead = lead; BR.leaderId = ids[0]; BR.lobbyN = ids.length; BR.busy = busy;
  if (lead) {
    const want = ids.length >= 2 ? 15000 : 30000;
    if (BR.via === 'rtc' && !BR.startNow) BR.cdEnd = 0;   // friends' lobby: the host starts it when everyone is in
    else if (busy && !BR.startNow) BR.cdEnd = 0;
    else {
      if (!BR.cdEnd) BR.cdEnd = now + want; if (ids.length >= 2 && BR.cdEnd - now > 15000) BR.cdEnd = now + 15000;
      if (BR.startNow || now >= BR.cdEnd) { BR.startNow = false; brStartMatch(ids.slice(0, BR_MAX)); return; }
    }
  }
  if (now - (BR.sentAt || 0) > 150) brSend();
}
function brStartMatch(ids) {
  const seed = (Math.random() * 4294967296) >>> 0, mi = brMe().slice(0, 6) + seed.toString(36);
  BR.lead = true; BR.leaderId = brMe(); brEnterMatch(mi, seed, ids, max(0, BR_FILL - ids.length)); brSend();
}
function brJoinMatch(ld) {
  BR.lead = false; BR.leaderId = '';
  brEnterMatch(ld.mi, ld.s >>> 0, ld.ro.filter(x => typeof x === 'string').slice(0, BR_MAX), clamp(num(ld.nb) | 0, 0, BR_MAX));
  BR.t = clamp(num(ld.t) | 0, 0, 60 * 60 * 20); brSend();
}
function brBackToLobby() {
  BR.lastMi = BR.mi; BR.mi = ''; BR.phase = 'lobby'; BR.cdEnd = 0; BR.startNow = false; BR.lead = false;
  for (const f of NET.peers.values()) f.gone = true; NET.peers.clear(); G.fighters = G.fighters.filter(f => !f.remote && !f.brBot);
  NET.hits = []; NET.shots = []; NET.kb = ['', 0]; G.state = 'brlobby'; UI.open = null; brSend();
}
function brLeave() {
  if (BR.via === 'room') netLeave(); else if (BR.via === 'rtc') { for (const u of NET.unsubs) try { u(); } catch (e) { } NET.unsubs = []; NET.R = null; coopLeave(); COOP.br = false; }
  BR.on = false; BR.phase = ''; BR.mi = ''; BR.people.clear(); NET.me = ''; NET.status = 'off';
  for (const f of NET.peers.values()) f.gone = true; NET.peers.clear(); G.fighters = G.fighters.filter(f => !f.gone);
  G.state = 'title'; UI.open = null; G.dialog = null; G.boss = null; G.duel = null; WORLD.id = '';
}

// ---------------- what this computer says about itself ----------------
function brSend() {
  const R = NET.R; if (!R || !R.connected()) return; BR.sentAt = performance.now();
  const o = { v: 1, br: 1, ring: BR.code, n: G.nick, sk: G.skin | 0, sq: ++BR.sq, ph: BR.phase === 'lobby' ? 'L' : 'M', mi: BR.phase === 'lobby' ? '' : BR.mi, ld: 0 };
  if (BR.phase !== 'lobby' && G.p) {
    const p = G.p, a = p.atk, W = heldOf(p);
    Object.assign(o, {
      w: W && W.type === 'weapon' ? W.id : 'fists', x: r1(p.x), y: r1(p.y), vx: r2(p.vx), vy: r2(p.vy), f: p.face, g: p.onGround ? 1 : 0,
      st: p.dead ? 4 : p.state === 'dodge' ? 2 : p.hurtT > 0 ? 3 : a ? 1 : 0, dd: p.dodgeDir, hp: max(0, round(p.hp)), k: p.kills, d: p.deaths,
      m: a ? a.id : '', an: p.atkN, mp: a ? a.phase : 0, mt: a ? a.pt : 0, ma: a ? r2(a.aimA) : 0, md: a ? round(a.dist) : 0, mc: a ? a.charge : 0, mf: a ? a.face : p.face, rp: p.riposte > 0 ? 1 : 0, sp: p.inv > 30 ? 1 : 0,
      hs: NET.hits, ps: NET.shots, kb: NET.kb, sx: p.st ? [p.st.pin > 0 ? (p.st.pinS || 0) + 2 : 0, p.st.burn > 0 ? 1 : 0, p.st.blind > 0 ? 1 : 0, p.st.hook > 0 || p.st.reel > 0 ? 1 : 0] : 0, lk: p.state === 'link' ? 1 : 0,
      wd: round(p.ward || 0), gl: p.glide ? 1 : 0, ob: p.onBarge ? 1 : 0, al: p.dead ? 0 : 1, pl: BR.place | 0, oc: [...BR.mine], dl: BR.dl || 0
    });
  }
  if (BR.lead) {
    if (BR.phase === 'lobby') o.ld = { st: 'L', cd: BR.cdEnd ? max(0, ceil((BR.cdEnd - performance.now()) / 1000)) : -1 };
    else {
      if (!BR.btCache || G.time % 6 === 0) BR.btCache = [...BR.bots.values()].map(brBotSer);
      o.ld = { st: 'M', mi: BR.mi, s: BR.seed, ro: BR.ro, nb: BR.nb, t: BR.t, bt: BR.btCache, bk: BR.bk };
    }
  }
  R.presence(o).catch(() => { });
}
function brBotSer(f) {
  const a = f.atk, fl = (f.face < 0 ? 1 : 0) | (f.onGround ? 2 : 0) | (f.glide ? 4 : 0) | (f.onBarge ? 8 : 0) | (f.dodgeDir < 0 ? 16 : 0) | (f.riposte > 0 ? 32 : 0) | (f.dead ? 64 : 0);
  return [f.botI, r1(f.x), r1(f.y), r2(f.vx), r2(f.vy), fl, f.dead ? 4 : f.state === 'dodge' ? 2 : f.hurtT > 0 ? 3 : a ? 1 : 0, max(0, round(f.hp)), round(f.ward || 0), f.wid, a ? a.id : '', f.atkN, a ? a.phase : 0, a ? round(a.pt) : 0, a ? r2(a.aimA) : 0, a ? round(a.dist) : 0, a ? a.charge : 0, a ? (a.face < 0 ? -1 : 1) : 1, f.kills | 0];
}

// ---------------- what everyone else says ----------------
function brPeers(list) {
  const here = new Set();
  for (const pe of list) {
    if (pe.isMe && pe.sameTab) { NET.me = pe.peer; continue; }
    if (pe.isMe || (pe.kind && pe.kind !== 'viewer')) continue;
    const s = pe.presence; if (!s || s.v !== 1 || !s.br || s.ring !== BR.code) continue;
    here.add(pe.peer);
    let q = BR.people.get(pe.peer); if (!q) { q = { id: pe.peer, sq: -1 }; BR.people.set(pe.peer, q); }
    if (q.sq === s.sq && q.pres) continue; q.sq = s.sq; q.pres = s; q.at = performance.now();
    q.n = cleanName(s.n) || 'WAKER'; q.sk = clamp(num(s.sk) | 0, 0, 3); q.ph = s.ph === 'M' ? 'M' : 'L'; q.mi = typeof s.mi === 'string' ? s.mi.slice(0, 24) : ''; q.ld = s.ld && typeof s.ld === 'object' ? s.ld : null; q.guest = !!pe.guest;
    if (q.ld && q.ld.st === 'L') BR.lastCd = num(q.ld.cd);
    brSaw(pe.peer, q, s);
  }
  for (const id of [...BR.people.keys()]) if (!here.has(id)) { BR.people.delete(id); brGone(id); }
}
function brSaw(id, q, s) {
  // a leader starting a match with me in it: go
  if (BR.phase === 'lobby' && G.state === 'brlobby' && q.ld && q.ld.st === 'M' && typeof q.ld.mi === 'string' && q.ld.mi !== BR.lastMi && Array.isArray(q.ld.ro) && q.ld.ro.includes(brMe()) && typeof q.ld.s === 'number') { brJoinMatch(q.ld); return; }
  if (!BR.mi || BR.phase === 'lobby' || q.mi !== BR.mi) { const f = NET.peers.get(id); if (f) { NET.peers.delete(id); f.gone = true; } return; }
  if (q.ld && q.ld.st === 'M' && q.ld.mi === BR.mi && !BR.lead) brFromLeader(id, q.ld);
  let f = NET.peers.get(id);
  if (!f && BR.ro.includes(id)) { f = newFighter(num(s.x, 600), num(s.y, 300), { remote: true, peer: id, team: 'r:' + id, snaps: [], spawnT: 0, name: q.n, skin: q.sk, brIn: true, ward: 0, guest: q.guest }); NET.peers.set(id, f); G.fighters.push(f); }
  if (f && typeof s.x === 'number') {
    netApply(f, s); f.ward = clamp(num(s.wd) | 0, 0, 100); f.glide = !!s.gl; f.onBarge = !!s.ob; f.noHit = !!s.ob;
    if (s.al === 0 && !f.dead) { f.dead = true; f.deadT = 0; f.hp = 0; }
  }
  if (Array.isArray(s.oc)) for (const i of s.oc.slice(0, 200)) { const c = BR.chests[i | 0]; if (c && !c.open) { c.open = true; c.t = 0; } }
  if (Array.isArray(s.dl) && s.dl.length === 4) { const key = id + ':' + s.dl[0]; if (!BR.dlSeen.has(key)) { BR.dlSeen.add(key); brDropPile(num(s.dl[1]), num(s.dl[2]), brItemsOk(s.dl[3])); } }
}
const brItemsOk = a => Array.isArray(a) ? a.slice(0, 12).filter(e => Array.isArray(e) && IT[e[0]] && num(e[1]) > 0).map(e => [e[0], clamp(num(e[1]) | 0, 1, 300)]) : [];
function brGone(id) {
  const f = NET.peers.get(id); if (!f) return; NET.peers.delete(id); f.gone = true;
  if (BR.phase !== 'lobby') { G.kfeed.unshift({ a: '', b: f.name, txt: 'left the match', t: 0 }); burst(f.x + 3, f.y + 10, 20, SPARK, 2, 40, { glow: 1 }); }
}
// the leader's echoes, the clock, and who the echoes took down
function brFromLeader(id, ld) {
  if (BR.leaderId && id !== BR.leaderId) return;
  if (typeof ld.t === 'number' && abs(ld.t - BR.t) > 40) BR.t = ld.t | 0;
  if (Array.isArray(ld.bt)) for (const a of ld.bt.slice(0, BR_MAX)) if (Array.isArray(a)) brGhostBot(a);
  if (Array.isArray(ld.bk)) for (const e of ld.bk) {
    if (!Array.isArray(e) || typeof e[0] !== 'string') continue; const sq = num(e[2]), last = BR.bkSeen.get(id) || 0; if (sq <= last) continue; BR.bkSeen.set(id, sq);
    const v = BR.bots.get(e[0]), k = e[1] === brMe() ? G.p : NET.peers.get(e[1]) || BR.bots.get(e[1]) || null;
    if (v && !v.dead) { v.dead = true; v.deadT = 0; v.hp = 0; }
    if (k === G.p) { G.p.kills++; G.banner = { text: 'TAKEN DOWN', sub: v ? v.name : '', t: 120 }; comboHit(true); sfx('newmove', 0); }
    G.kfeed.unshift({ a: k ? k.name : '', b: v ? v.name : 'AN ECHO', t: 0, me: k === G.p ? 1 : 0, txt: k ? '' : 'fell to the ashfall' }); if (G.kfeed.length > 6) G.kfeed.length = 6;
    brDropPile(num(e[3]), num(e[4]), brItemsOk(e[5]));
  }
}
function brGhostBot(a) {
  const i = clamp(num(a[0]) | 0, 0, BR_MAX), tag = 'B' + i; let f = BR.bots.get(tag);
  if (!f) { f = newFighter(num(a[1]), num(a[2]), { remote: true, ghostBot: true, peer: tag, botTag: tag, botI: i, team: tag, snaps: [], spawnT: 0, name: BR_BOTN[i % BR_BOTN.length], skin: i % 4, brIn: true, ward: 0, echoBot: true }); BR.bots.set(tag, f); G.fighters.push(f); }
  if (!f.remote) return;
  const fl = num(a[5]) | 0, now = performance.now(), wid = IT[a[9]] && IT[a[9]].type === 'weapon' ? a[9] : 'fists';
  f.wid = wid; f.hp = clamp(num(a[7]), 0, 100); f.ward = clamp(num(a[8]) | 0, 0, 100); f.glide = !!(fl & 4); f.onBarge = !!(fl & 8); f.noHit = f.onBarge; f.kills = num(a[18]) | 0;
  if (fl & 64 && !f.dead) { f.dead = true; f.deadT = 0; }
  f.snaps.push({ t: now, x: clamp(num(a[1]), 0, WW * T), y: clamp(num(a[2]), 0, WH * T), vx: clamp(num(a[3]), -9, 9), vy: clamp(num(a[4]), -9, 9), face: fl & 1 ? -1 : 1, g: !!(fl & 2), st: num(a[6]) | 0, dd: fl & 16 ? -1 : 1,
    m: typeof a[10] === 'string' ? a[10] : '', an: num(a[11]) | 0, mp: clamp(num(a[12]) | 0, 0, 2), mt: clamp(num(a[13]), 0, 200), ma: clamp(num(a[14]), -3.2, 3.2), md: clamp(num(a[15], 40), 0, 900), mc: clamp(num(a[16]) | 0, 0, 60), mf: a[17] < 0 ? -1 : 1, rp: !!(fl & 32), sp: false });
  if (f.snaps.length > 40) f.snaps.shift();
}
// a blow someone landed on one of my echoes (I lead)
function brBotHit(from, h) {
  const b = BR.bots.get(h[0]); if (!b || b.dead || b.remote || b.onBarge) return;
  const x = Array.isArray(h[6]) ? h[6] : null;
  if (x) { const k = x[0], d = clamp(num(x[1]) | 0, 0, 400), side = clamp(num(x[2]) | 0, -1, 1); if (['pin', 'hook', 'burn', 'blind', 'launched'].includes(k)) applyStatus(b, k, from, { d: d || undefined, side, floor: !side }); }
  if (num(h[2]) <= 0) return;
  hurtFighter(b, clamp(num(h[2]), 1, 90), from.x + 3, { kx: clamp(num(h[3]), -8, 8), ky: clamp(num(h[4]), -8, 8), by: from, pvp: true, net: true, crit: !!h[5], stop: 3 });
}
// someone else's Waker fell; their computer says who did it
function brDeathSeen(victim, tag) {
  const k = tag === brMe() ? G.p : NET.peers.get(tag) || BR.bots.get(tag) || null;
  if (!victim.dead) { victim.dead = true; victim.deadT = 0; victim.hp = 0; }
  if (k === G.p) { G.p.kills++; G.banner = { text: 'TAKEN DOWN', sub: victim.name, t: 120 }; comboHit(true); sfx('newmove', 0); }
  else if (k && k.brBot && !k.remote) k.kills++;
  G.kfeed.unshift({ a: k ? k.name : '', b: victim.name, t: 0, me: k === G.p ? 1 : 0, txt: k ? '' : 'fell to the ashfall' }); if (G.kfeed.length > 6) G.kfeed.length = 6;
  burst(victim.x + 3, victim.y + 10, 30, SPARK, 3, 50, { glow: 1, g: .02 });
}
// during a match: who leads, and keep telling everyone where I am
function brNetTick() {
  // who leads: the one already leading while they keep talking; otherwise the first in the roster who is here.
  // a leader whose tab went to sleep stops talking, and the next one carries on with the clock and the echoes
  const me = brMe(), now = performance.now(), ids = [me];
  for (const id of BR.ro) if (id !== me) { const q = BR.people.get(id); if (q && q.mi === BR.mi && now - (q.at || 0) < 4000) ids.push(id); }
  ids.sort(); let lid = ids.includes(BR.leaderId) ? BR.leaderId : ids[0];
  // back from a sleeping tab while someone else ran the match further: step aside
  // two leaders at once (one came back from sleep): the one further along keeps it; if they are level, the first in the roster
  if (BR.lead) for (const [id, q] of BR.people) if (id !== me && q.ld && q.ld.st === 'M' && q.ld.mi === BR.mi && now - (q.at || 0) < 4000) { const d = num(q.ld.t) - BR.t; if (d > 90 || (abs(d) <= 90 && id < me)) { lid = id; break; } }
  if (lid !== BR.leaderId || (lid !== me && BR.lead)) { BR.leaderId = lid; if (lid === me && !BR.lead) brTakeOver(); else if (lid !== me && BR.lead) brYield(); }
  if (BR.via === 'rtc') brRtcTick();
  if (G.time % 3 === 0) brSend();
  if (BR.lead && BR.phase === 'over' && BR.overT === 60 * 14) { }
}
// someone else runs the match now: my echoes become pictures of theirs
function brYield() { BR.lead = false; for (const f of BR.bots.values()) { if (f.remote) continue; f.remote = true; f.ghostBot = true; f.brBot = false; f.ai = null; f.atk = null; f.snaps = []; f.brUse = null; } }
// the leader left: this computer runs the echoes from where they stood
function brTakeOver() {
  BR.lead = true;
  for (const f of BR.bots.values()) {
    if (!f.remote) continue; f.remote = false; f.ghostBot = false; f.brBot = true; f.atk = null; f.state = 'normal'; f.snaps = []; f.foes = []; f.arms = [];
    f.ai = newBrain(brSkill()); f.br = { heals: 1, wards: 1, drop: f.x, roam: null, roamT: 0, chest: null, skip: new Set(), lx: 0, stuck: 0, think: 0 };
    if (f.onBarge && BR.phase !== 'drop') { f.onBarge = false; f.glide = true; }
  }
}

// ---------------- invite codes: the host passes everyone's presence along ----------------
function brRtcRoom() {
  const R = { ls: new Set(), mine: {}, closed: false, last: [] };
  R.presence = patch => { R.mine = Object.assign({}, R.mine, patch); if (netHost()) BR.rtcDirty = true; else { const H = COOP.peers.get('h'); if (H && H.open) sendTo(H, { t: 'bp', p: R.mine }, 'bp'); } return Promise.resolve(); };
  R.onPeers = fn => { R.ls.add(fn); return () => R.ls.delete(fn); };
  R.onConnection = fn => { setTimeout(() => fn(true), 0); return () => { }; };
  R.connected = () => !R.closed; R.leave = () => { R.closed = true; return Promise.resolve(); };
  return R;
}
function brRtcList() {
  const R = NET.R; if (!R || !R.mine) return [];
  const l = [{ peer: '0h', presence: R.mine }]; for (const P of COOP.peers.values()) if (P.ok && P.pres) l.push({ peer: P.id, presence: P.pres });
  return l;
}
function brRtcFan() {
  const R = NET.R; if (!R || !R.ls) return; const l = brRtcList(), s = JSON.stringify({ t: 'bl', l });
  for (const P of COOP.peers.values()) if (P.ok && P.open) sendTo(P, s, 'bl');
  const mine = l.map(e => Object.assign({ isMe: e.peer === '0h', sameTab: e.peer === '0h', kind: 'viewer' }, e)); for (const fn of R.ls) fn({ peers: mine });
  BR.rtcDirty = false; BR.rtcAt = performance.now();
}
function brRtcTick() {
  if (!COOP.br) return; const now = performance.now();
  if (netHost() && BR.rtcDirty && now - (BR.rtcAt || 0) > 45) brRtcFan();
  for (const P of COOP.peers.values()) if (P.open && P.heard && now - P.heard > 15000 && !P.ghostPeer) coopLost(P);
  for (const P of COOP.peers.values()) if (!P.open && !P.ok && P.connT && now - P.connT > 25000) { COOP.peers.delete(P.id); try { P.pc.close(); } catch (e) { } COOP.note = ''; COOP.err = 'Could not reach ' + P.name + '. Try again with a new invite; on the same Wi-Fi it almost always works.'; }
  if (netGuest() && NET.R && NET.R.mine && now - (BR.rtcPing || 0) > 2000) { BR.rtcPing = now; const H = COOP.peers.get('h'); if (H && H.open) sendTo(H, { t: 'bp', p: NET.R.mine }, 'bp'); }
}
// the host lets a friend into the lobby
function brRtcWelcome(P, m) {
  if ([...COOP.peers.values()].filter(Q => Q.ok).length >= MAXG) { sendTo(P, { t: 'kick' }); return; }
  P.name = cleanName(m.n) || P.name || 'WAKER'; P.skin = clamp(m.sk | 0, 0, 3); P.ok = true; P.pres = null;
  sendTo(P, { t: 'brw', v: NETV, id: P.id, host: coopName(), code: BR.code }); COOP.note = ''; sfx('quest', 0); BR.rtcDirty = true;
}
function brRtcJoin(m) {
  COOP.me = String(m.id || 'g?'); COOP.joined = true; COOP.br = true; COOP.hostName = cleanName(m.host) || COOP.hostName;
  const HP = COOP.peers.get('h'); if (HP) { HP.ok = true; HP.name = COOP.hostName || HP.name; }
  G.nick = coopName(); G.skin = FORM.skin | 0; COOP.reply = ''; COOP.code = ''; COOP.note = '';
  brLobbyEnter('rtc', typeof m.code === 'string' ? m.code.slice(0, 12) : 'friends'); NET.me = COOP.me; sfx('quest', 0);
}
function brRtcMsg(P, m) {
  const H = netHost();
  if (m.t === 'bp' && H) { if (m.p && typeof m.p === 'object') { P.pres = m.p; BR.rtcDirty = true; } return true; }
  if (m.t === 'bl' && !H) { const R = NET.R; if (!R || !R.ls || !Array.isArray(m.l)) return true; const me = brMe(); const l = m.l.filter(e => e && typeof e.peer === 'string').map(e => ({ peer: e.peer, presence: e.presence, isMe: e.peer === me, sameTab: e.peer === me, kind: 'viewer' })); for (const fn of R.ls) fn({ peers: l }); return true; }
  if (m.t === 'brw' && !H) { brRtcJoin(m); return true; }
  return false;
}
// someone's line dropped
function brRtcLost(P) {
  if (netGuest()) { coopReset(); COOP.br = false; brLeave(); COOP.err = 'The host closed the match.'; G.state = 'join'; return; }
  COOP.peers.delete(P.id); try { P.pc.close(); } catch (e) { } BR.rtcDirty = true;
  if (!COOP.peers.size && !COOP.pend) { COOP.role = null; COOP.me = ''; COOP.role = 'host'; COOP.me = 'h'; }
}
