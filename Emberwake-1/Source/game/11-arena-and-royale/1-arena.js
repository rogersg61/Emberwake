// ============================================================
//  The Cinder Ring, online.
//  Everyone who enters the same ring code fights in one arena. Each
//  browser simulates its own Waker and shares it through the page's
//  live room or the public message-board relay as presence:
//  position, pose, the move in progress, and the hits it landed.
//  The person who was hit applies the hit (so a perfect dodge on
//  your screen really dodges). Nothing is stored; closing the page
//  leaves the ring. Alone in a ring? Echoes spar with you instead.
// ============================================================
const NET = { room: null, roomReady: Promise.resolve(), R: null, transport: '', signalPeers: new Map(), sentAt: 0, status: 'off', code: 'open', me: '', peers: new Map(), seen: new Map(), hitSeq: 0, shotSeq: 0, hits: [], shots: [], rd: 0, roundOver: 0, winner: '', deathN: 0, kb: ['', 0], unsubs: [], joinTok: 0 };
const RING_WEAPONS = ['sword', 'spear', 'fangs', 'maul', 'bow', 'nunchaku'], ECHO_WEAPONS = ['sword', 'sword', 'spear', 'spear', 'fangs', 'fangs', 'maul', 'bow', 'nunchaku', 'nunchaku'], SHOT_TYPES = ['arrow', 'bomb', 'knife', 'javelin', 'wave', 'star', 'hook', 'flask', 'pellet'], ARM_SHOTS = ['star', 'hook', 'flask', 'pellet'];
const KILLS_TO_WIN = 10, ECHO_NAMES = ['ECHO OF ASH', 'ECHO OF GLASS', 'ECHO OF RUST', 'ECHO OF DUSK', 'ECHO OF EMBER', 'ECHO OF MOSS'];
const num = (v, d = 0) => typeof v === 'number' && isFinite(v) ? v : d;
const r1 = v => round(v * 10) / 10, r2 = v => round(v * 100) / 100;
function cleanName(s) { return (typeof s === 'string' ? s : '').toUpperCase().replace(/[^A-Z0-9 _-]/g, '').trim().slice(0, 12); }
function cleanCode(s) { return (typeof s === 'string' ? s : '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 12); }
function netBoot() {
  try { if (window.claude && window.claude.use) NET.roomReady = window.claude.use('room').then(r => { NET.room = r || null; }, () => { NET.room = null; }); }
  catch (e) { NET.room = null; }
}

async function netJoin(code) {
  NET.code = code || 'open'; NET.peers.clear(); NET.seen.clear(); NET.me = ''; NET.hits = []; NET.shots = [];
  const tok = ++NET.joinTok;
  NET.transport = ''; NET.signalPeers.clear();
  await NET.roomReady;
  if (tok !== NET.joinTok || !WORLD.arena) return;
  if (!NET.room) {
    NET.transport = 'signal'; NET.status = 'connecting';
    NET.me = 'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    SIG.myId = NET.me; sigStart('cinder-ring:' + NET.code, 'ring', netSignalMessage);
    return;
  }
  NET.transport = 'room';
  NET.status = 'connecting';
  try {
    const R = await NET.room.join('ring-' + NET.code);
    if (tok !== NET.joinTok || !WORLD.arena) { try { R.leave(); } catch (e) { } return; }
    NET.R = R; NET.status = R.connected() ? 'online' : 'connecting';
    NET.unsubs.push(R.onPeers(ch => { if (NET.R === R) netPeers(ch.peers); }, () => { if (NET.R === R) NET.status = 'offline'; }));
    NET.unsubs.push(R.onConnection(c => { if (NET.R === R && NET.status !== 'offline') NET.status = c ? 'online' : 'connecting'; }, () => { if (NET.R === R) NET.status = 'offline'; }));
    netSend();
  } catch (e) { if (tok === NET.joinTok) NET.status = 'offline'; }
}
function netLeave() {
  NET.joinTok++; for (const u of NET.unsubs) try { u(); } catch (e) { } NET.unsubs = [];
  if (NET.transport === 'signal' && SIG.role === 'ring') {
    sigSend({ t: 'ringLeave', g: NET.me, ring: NET.code });
    sigStop();
  }
  if (NET.R) { try { NET.R.leave().catch(() => { }); } catch (e) { } } NET.R = null; NET.status = 'off';
  NET.transport = ''; NET.signalPeers.clear();
  for (const f of NET.peers.values()) f.gone = true; NET.peers.clear(); G.fighters = G.fighters.filter(f => !f.gone);
}
function netSignalMessage(m) {
  if (NET.transport !== 'signal' || !m || typeof m.g !== 'string' || m.g === NET.me || m.ring !== NET.code) return;
  if (m.t === 'ringLeave') NET.signalPeers.delete(m.g);
  else if (m.t === 'ring' && m.p && typeof m.p === 'object' && m.p.ring === NET.code) NET.signalPeers.set(m.g, { presence: m.p, mask: num(m.b) | 0, at: performance.now() });
}
function netSignalPublishMask() {
  const available = sigMask(); let selected = 0;
  for (const q of NET.signalPeers.values()) {
    const common = available & q.mask;
    if (common) selected |= common & -common;
  }
  return selected || available;
}
function netSignalRefresh(now) {
  const peers = [];
  for (const [id, q] of NET.signalPeers) {
    if (now - q.at > 10000) NET.signalPeers.delete(id);
    else peers.push({ peer: id, presence: q.presence, kind: 'viewer', guest: false });
  }
  netPeers(peers);
}
function netPeers(list) {
  if (BR.on) return brPeers(list);
  const here = new Set();
  for (const pe of list) {
    if (pe.isMe && pe.sameTab) { NET.me = pe.peer; continue; }
    if (pe.kind !== 'viewer') continue;
    const s = pe.presence; if (!s || s.v !== 1 || s.ring !== NET.code) continue;
    here.add(pe.peer);
    let f = NET.peers.get(pe.peer);
    if (!f) {
      f = newFighter(num(s.x, 600), num(s.y, 300), { remote: true, peer: pe.peer, team: 'r:' + pe.peer, snaps: [], spawnT: 40, name: cleanName(s.n) || 'WAKER', skin: clamp(num(s.sk) | 0, 0, 3), guest: !!pe.guest });
      NET.peers.set(pe.peer, f); G.fighters.push(f); G.kfeed.unshift({ a: '', b: f.name, txt: 'entered the ring', t: 0 }); sfx('quest', 0);
    }
    if (pe.presence !== f.lastPres) { f.lastPres = pe.presence; netApply(f, s); }
  }
  for (const [peer, f] of NET.peers) if (!here.has(peer)) { NET.peers.delete(peer); f.gone = true; G.kfeed.unshift({ a: '', b: f.name, txt: 'left the ring', t: 0 }); burst(f.x + 3, f.y + 10, 20, SPARK, 2, 40, { glow: 1 }); }
  if (G.fighters.some(f => f.gone)) G.fighters = G.fighters.filter(f => !f.gone);
}
function netApply(f, s) {
  const now = performance.now();
  f.name = cleanName(s.n) || 'WAKER'; f.skin = clamp(num(s.sk) | 0, 0, 3); f.wid = WORLD.royale ? (IT[s.w] && IT[s.w].type === 'weapon' ? s.w : 'fists') : RING_WEAPONS.includes(s.w) ? s.w : 'sword';
  const snap = {
    t: now, x: clamp(num(s.x, f.x), 0, WW * T), y: clamp(num(s.y, f.y), 0, WH * T), vx: clamp(num(s.vx), -9, 9), vy: clamp(num(s.vy), -9, 9), face: s.f < 0 ? -1 : 1, g: !!s.g, st: num(s.st) | 0, dd: s.dd < 0 ? -1 : 1,
    m: typeof s.m === 'string' ? s.m : '', an: num(s.an) | 0, mp: clamp(num(s.mp) | 0, 0, 2), mt: clamp(num(s.mt), 0, 200), ma: clamp(num(s.ma), -3.2, 3.2), md: clamp(num(s.md, 40), 0, 900), mc: clamp(num(s.mc) | 0, 0, 60), mf: s.mf < 0 ? -1 : 1, rp: !!s.rp, sp: !!s.sp
  };
  f.snaps.push(snap); if (f.snaps.length > 40) f.snaps.shift();
  { const sx = Array.isArray(s.sx) ? s.sx : [0, 0, 0, 0], st = stOf(f); st.pin = sx[0] ? 30 : 0; st.pinS = sx[0] ? clamp((sx[0] | 0) - 2, -1, 1) : 0; st.burn = sx[1] ? 30 : 0; st.blind = sx[2] ? 30 : 0; st.hook = sx[3] ? 30 : 0; st.hookBy = null; f.linking = !!s.lk; }
  f.hp = clamp(num(s.hp, 100), 0, 100); f.kills = clamp(num(s.k) | 0, 0, 999); f.deaths = clamp(num(s.d) | 0, 0, 9999); f.rd = num(s.rd) | 0;
  const hs = Array.isArray(s.hs) ? s.hs.slice(0, 12) : [], ps = Array.isArray(s.ps) ? s.ps.slice(0, 10) : [];
  let seen = NET.seen.get(f.peer);
  if (!seen) { seen = { hit: max(-1, ...hs.map(h => Array.isArray(h) ? num(h[1], -1) : -1)), shot: max(-1, ...ps.map(q => Array.isArray(q) ? num(q[0], -1) : -1)), kb: Array.isArray(s.kb) ? num(s.kb[1]) : 0 }; NET.seen.set(f.peer, seen); }
  else {
    for (const h of hs) { if (!Array.isArray(h)) continue; const sq = num(h[1], -1); if (sq <= seen.hit) continue; seen.hit = sq; if (NET.me && h[0] === NET.me) netTakeHit(f, h); else if (WORLD.royale && BR.lead && typeof h[0] === 'string' && h[0][0] === 'B') brBotHit(f, h); }
    for (const q of ps) {
      if (!Array.isArray(q)) continue; const sq = num(q[0], -1); if (sq <= seen.shot) continue; seen.shot = sq;
      const type = SHOT_TYPES[num(q[1]) | 0] || 'arrow';
      spawnProj({ type, owner: (WORLD.royale && typeof q[8] === 'string' && BR.bots.get(q[8])) || f, ghost: true, arm: ARM_SHOTS.includes(type) ? 1 : 0, hits: new Set(), x: num(q[2], f.x), y: num(q[3], f.y), vx: clamp(num(q[4]), -14, 14), vy: clamp(num(q[5]), -14, 14), g: clamp(num(q[6]), 0, .3), r: type === 'wave' ? 11 : 3, boom: clamp(num(q[7]), 0, 40), life: type === 'hook' ? 22 : 160, spr: type === 'javelin' ? SPR.w_spear : null, pierce: type === 'wave' });
    }
    if (Array.isArray(s.kb)) { const dn = num(s.kb[1]); if (dn > seen.kb) { seen.kb = dn; netDeathSeen(f, s.kb[0]); } }
  }
  if (f.rd > NET.rd) { NET.rd = f.rd; resetRound(); }
}
// someone else's blow landed on my Waker, on their screen
function netTakeHit(from, h) {
  const p = G.p; if (p.dead || NET.roundOver || p.onBarge) return;
  if (typeof h[7] === 'string' && WORLD.royale) from = BR.bots.get(h[7]) || from;
  const x = Array.isArray(h[6]) ? h[6] : null;
  if (x) {
    const k = x[0], d = clamp(num(x[1]) | 0, 0, 400), side = clamp(num(x[2]) | 0, -1, 1);
    if (k === 'rel') { const s = stOf(p); s.held = 0; p.heldT = 0; if (G.link && G.link.e === p && !G.link.L) { G.link = null; G.zoomT = 1; } }
    else if (k === 'held') { const s = stOf(p); s.held = 1; s.heldBy = from; p.heldT = d || 90; if (p.atk) endAttack(p); p.state = 'normal'; G.link = { f: from, e: p, L: null }; G.zoomT = 1.25; }
    else if (['pin', 'hook', 'burn', 'blind', 'launched'].includes(k) && !(p.iDodge > 0)) applyStatus(p, k, from, { d: d || undefined, side, floor: !side });
    if (num(h[2]) <= 0) return;
  }
  hurtFighter(p, clamp(num(h[2]), 1, 90), from.x + 3, { kx: clamp(num(h[3]), -8, 8), ky: clamp(num(h[4]), -8, 8), by: from, pvp: true, net: true, crit: !!h[5], stop: 3, shake: 2, link: !!(p.st && p.st.held) });
}
function netDeathSeen(victim, killerPeer) {
  if (WORLD.royale) return brDeathSeen(victim, killerPeer);
  const killer = killerPeer && killerPeer === NET.me ? G.p : NET.peers.get(killerPeer);
  if (killer === G.p) { G.p.kills++; sfx('newmove', 0); G.banner = { text: 'TAKEN DOWN', sub: victim.name, t: 120 }; comboHit(true); }
  G.kfeed.unshift({ a: killer ? killer.name : '', b: victim.name, t: 0, me: killer === G.p ? 1 : 0 });
  burst(victim.x + 3, victim.y + 10, 30, SPARK, 3, 50, { glow: 1, g: .02 });
}
function netHit(target, dmg, kx, ky, crit, extra, by) { const h = [target.peer, ++NET.hitSeq, round(dmg), r1(kx), r1(ky), crit ? 1 : 0, extra || 0]; if (by && by.brBot && !by.remote) h.push(by.botTag); NET.hits.push(h); if (NET.hits.length > 10) NET.hits.shift(); }
function netShot(pr) {
  if (!WORLD.arena || (!NET.R && NET.transport !== 'signal')) return; const k = SHOT_TYPES.indexOf(pr.type); if (k < 0) return;
  NET.shots.push([++NET.shotSeq, k, r1(pr.x), r1(pr.y), r2(pr.vx), r2(pr.vy), round(pr.g * 1000) / 1000, pr.boom | 0, pr.owner && pr.owner.brBot ? pr.owner.botTag : 0]); if (NET.shots.length > 6) NET.shots.shift();
}
function netPresence() {
  const p = G.p, a = p.atk, W = heldOf(p);
  return {
    v: 1, ring: NET.code, n: G.nick, sk: G.skin, w: W && RING_WEAPONS.includes(W.id) ? W.id : 'sword', x: r1(p.x), y: r1(p.y), vx: r2(p.vx), vy: r2(p.vy), f: p.face, g: p.onGround ? 1 : 0,
    st: p.dead ? 4 : p.state === 'dodge' ? 2 : p.hurtT > 0 ? 3 : a ? 1 : 0, dd: p.dodgeDir, hp: max(0, round(p.hp)), k: p.kills, d: p.deaths, rd: NET.rd,
    m: a ? a.id : '', an: p.atkN, mp: a ? a.phase : 0, mt: a ? a.pt : 0, ma: a ? r2(a.aimA) : 0, md: a ? round(a.dist) : 0, mc: a ? a.charge : 0, mf: a ? a.face : p.face, rp: p.riposte > 0 ? 1 : 0, sp: p.inv > 30 ? 1 : 0,
    hs: NET.hits, ps: NET.shots, kb: NET.kb, sx: p.st ? [p.st.pin > 0 ? (p.st.pinS || 0) + 2 : 0, p.st.burn > 0 ? 1 : 0, p.st.blind > 0 ? 1 : 0, p.st.hook > 0 || p.st.reel > 0 ? 1 : 0] : 0, lk: p.state === 'link' ? 1 : 0
  };
}
function netSend() {
  if (BR.on) return brSend();
  if (NET.transport === 'signal') {
    const now = performance.now(); if (now - NET.sentAt < 100) return; NET.sentAt = now;
    sigSend({ t: 'ring', g: NET.me, ring: NET.code, p: netPresence() });
    NET.status = SIG.conns.some(C => C.ok) ? 'online' : performance.now() - SIG.startT > 9000 ? 'offline' : 'connecting';
    netSignalRefresh(now);
    return;
  }
  const R = NET.R; if (!R || !R.connected()) return;
  R.presence(netPresence()).catch(() => { });
}
// replay another person's Waker, about a tenth of a second behind, so motion is smooth
function tickRemote(f) {
  f.px = f.x; f.py = f.y; if (f.flash > 0) f.flash--; if (f.spawnT > 0) f.spawnT--;
  if (f.st) { if (f.st.burn > 0 && G.time % 5 === 0) P(f.x + frand(6), f.y + frand(4, 18), 0, -1, 16, fpick(['#ff7a2a', '#ffd35a']), { glow: 1, g: -.03 }); }
  const S = f.snaps; if (!S.length) return;
  const rt = performance.now() - 110; let a = null, b = null;
  for (let i = S.length - 1; i >= 0; i--) if (S[i].t <= rt) { a = S[i]; b = S[i + 1] || null; break; }
  if (!a) a = S[0];
  let x, y;
  if (b) { const u = clamp((rt - a.t) / max(1, b.t - a.t), 0, 1); x = lerp(a.x, b.x, u); y = lerp(a.y, b.y, u); }
  else { const e = clamp((rt - a.t) / 16.67, 0, 5); x = a.x + a.vx * e; y = a.y + (a.g ? 0 : a.vy * e); }
  if (hypot(x - f.x, y - f.y) > 90) { f.px = x; f.py = y; for (const s of f.scarf) { s.x = s.ox = x + 3; s.y = s.oy = y + 5; } }
  f.x = x; f.y = y; f.vx = a.vx; f.vy = a.vy; f.face = a.face; f.onGround = a.g; f.dodgeDir = a.dd; f.riposte = a.rp ? 1 : 0; f.inv = a.sp ? 2 : 0;
  const wasDead = f.dead; f.dead = a.st === 4; if (f.dead && !wasDead) f.deadT = 0; if (f.dead) f.deadT++;
  f.state = a.st === 2 ? 'dodge' : a.st === 1 ? 'attack' : 'normal'; f.hurtT = a.st === 3 ? 6 : 0; if (f.linking) f.iDodge = 2; else f.iDodge = 0;
  if (f.state === 'dodge' && G.time % 2 === 0) f.ghostReq = true;
  if (f.onGround && abs(f.vx) > .3) f.runPh += abs(f.vx) * .21;
  const W = IT[f.wid], set = MOVESETS[W.set], m = a.st === 1 && set.moves[a.m];
  if (m) {
    if (!f.atk || f.atk.id !== a.m || f.atkN !== a.an) { f.atkN = a.an; f.atk = { f, id: a.m, m, W, set, setName: W.set, btn: m.btn, phase: 0, pt: 0, face: a.mf, aimA: a.ma, dist: a.md, charge: 0, hits: new Map(), act: m.act, aimOff: 0, th: 0, dashT: 0, lastPhase: 0 }; setAim(f.atk); }
    const at = f.atk, adv = (rt - a.t) / 16.67; at.phase = a.mp; at.charge = a.mc; at.face = a.mf;
    at.pt = clamp(a.mt + adv, 0, at.phase === 0 ? m.wind + (a.mc ? 0 : 1) : at.phase === 1 ? at.act : m.rec);
    if (at.phase === 1 && at.lastPhase === 0) fsx(f, m.kind === 'thrust' ? 'thrust' : m.big ? 'heavy' : 'swing', 0);
    if (at.phase === 2 && at.lastPhase === 1) fadeTrail(at);
    at.lastPhase = at.phase; if (at.dashN && at.phase === 1 && G.time % 2 === 0) f.ghostReq = true;
  } else { if (f.atk && f.atk.phase === 1) fadeTrail(f.atk); f.atk = null; }
  tickScarf(f);
}

// ---------------- the arena itself ----------------
function enterArena(nick, skin, code) {
  if (BR.on) brLeave(); netLeave(); if (COOP.role) coopLeave(); WORLD.guest = false; WORLD.id = ''; WORLD.mode = 0; genArena(); freshSession();
  G.nick = nick; G.skin = skin; NET.rd = 0; NET.roundOver = 0; NET.deathN = 0; NET.kb = ['', 0]; G.echoT = 60;
  accountSaveProfile();
  inv = new Array(INV_N).fill(null); RING_WEAPONS.forEach((id, i) => inv[i] = { id, n: 1 });
  G.p = newPlayer(); G.fighters = [G.p]; G.npcs = []; G.clock = .57; arenaRespawn(G.p); G.p.inv = 60;
  snapCam(); G.state = 'play'; G.banner = { text: 'THE CINDER RING', sub: NET.room ? 'ring code: ' + (code || 'open') : 'practice with the echoes', t: 0 };
  netJoin(code || 'open');
}
function arenaRespawn(f) {
  let best = ARENA_SPAWNS[0], bd = -1;
  for (const s of ARENA_SPAWNS) { let d = 1e9; for (const o of G.fighters) if (o !== f && !o.dead) d = min(d, hypot(o.x / T - s[0], o.y / T - s[1])); d += Math.random() * 6; if (d > bd) { bd = d; best = s; } }
  reviveFighter(f, best[0] * T + 1, best[1] * T - 21); f.inv = 90;
  if (f === G.p) snapCam(); else { f.wid = fpick(ECHO_WEAPONS); f.arms = [fpick(ARMS), fpick(ARMS)]; }
  burst(f.x + 3, f.y + 10, 24, SPARK, 2.4, 40, { glow: 1 });
}
function spawnEcho() {
  const used = new Set(G.fighters.map(f => f.name)), name = ECHO_NAMES.find(n => !used.has(n)) || 'ECHO';
  const f = newFighter(0, 0, { name, skin: 1 + floor(Math.random() * 3), team: 'e:' + name, wid: fpick(ECHO_WEAPONS), ai: newBrain(frand(.38, .62)), echoBot: true, arms: [fpick(ARMS), fpick(ARMS)] });
  G.fighters.push(f); arenaRespawn(f);
}
function arenaDeath(f, by) {
  if (WORLD.royale) return brDeath(f, by);
  if (f === G.p) {
    NET.deathN++; NET.kb = [by && by.remote ? by.peer : '', NET.deathN];
    if (by && !by.remote && by !== G.p) by.kills++;
    G.kfeed.unshift({ a: by && by !== G.p ? by.name : '', b: G.p.name, t: 0, me: 2 });
  } else if (!f.remote) {
    if (by === G.p) { G.p.kills++; G.banner = { text: 'TAKEN DOWN', sub: f.name, t: 120 }; } else if (by && !by.remote) by.kills++;
    G.kfeed.unshift({ a: by ? by.name : '', b: f.name, t: 0, me: by === G.p ? 1 : 0 }); f.respawnT = 140;
  }
  if (G.kfeed.length > 6) G.kfeed.length = 6;
}
function resetRound() {
  NET.roundOver = 0; NET.winner = '';
  for (const f of G.fighters) if (!f.remote) { f.kills = 0; f.deaths = 0; if (f !== G.p || f.dead) arenaRespawn(f); }
  G.banner = { text: 'ROUND ' + (NET.rd + 1), sub: 'first to ' + KILLS_TO_WIN + ' takes the ring', t: 0 };
}
function arenaTick() {
  if (WORLD.royale) return brTick();
  const humans = NET.peers.size, echoes = G.fighters.filter(f => f.echoBot);
  if (humans === 0) { if (echoes.length < 3 && --G.echoT <= 0) { spawnEcho(); G.echoT = 100; } }
  else if (echoes.length) { const e = echoes[0]; e.gone = true; burst(e.x + 3, e.y + 10, 30, SPARK, 2.6, 40, { glow: 1 }); G.fighters = G.fighters.filter(f => !f.gone); if (echoes.length === 1) say('Another Waker has entered the ring. The echoes step aside.'); }
  for (const f of G.fighters) if (f.echoBot && f.dead && --f.respawnT <= 0) arenaRespawn(f);
  if (!NET.roundOver) {
    let win = null; for (const f of G.fighters) if (f.kills >= KILLS_TO_WIN && (!f.remote || f.rd === NET.rd)) win = f;
    if (win) { NET.roundOver = 330; NET.winner = win.name; G.banner = { text: win === G.p ? 'YOU TAKE THE RING' : win.name + ' TAKES THE RING', sub: 'next round soon', t: 0 }; sfx('quest', 0); G.flash = .4; G.flashCol = '255,211,90'; }
  } else if (--NET.roundOver === 0) { NET.rd++; resetRound(); }
  if (G.time % 3 === 0) netSend();
}
