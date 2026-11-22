// ============================================================
//  Play together: up to four Wakers in one world.
//  One of you hosts: the world is theirs, and they save it. The
//  others join with a pair of codes swapped by any chat app; after
//  that the computers talk straight to each other (WebRTC), no
//  server in between. The host runs the creatures, the sky and the
//  water; everyone runs their own Waker, digging and building, and
//  shares it. Loot is everyone's own: each of you gets your share.
// ============================================================
const COOP = { role: null, me: '', seq: 1, pid: 0, peers: new Map(), pend: null, out: [], tiles: new Set(), stns: new Set(), applying: false, ghostFx: false, nid: 1, ghosts: new Map(), hghosts: new Map(), chat: [], note: '', t: 0, saveT: 0, uid: 0, hostName: '', busy: false, code: '', reply: '', err: '', chatOpen: false };
const NETV = 3, MAXG = 3;
const netOn = () => !!COOP.role, netHost = () => COOP.role === 'host', netGuest = () => COOP.role === 'guest';
// someone is actually here with you (the world should not stop for menus then)
const netLive = () => netGuest() ? !!COOP.joined : netHost() && [...COOP.peers.values()].some(P => P.ok);
function netPlayers() { const a = G.p ? [G.p] : []; for (const P of COOP.peers.values()) if (P.f && P.ok && !P.f.gone) a.push(P.f); return a; }
const ICE = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }, { urls: 'stun:stun.cloudflare.com:3478' }, { urls: 'stun:global.stun.twilio.com:3478' }] };
const rtcOK = () => typeof RTCPeerConnection === 'function';
const coopName = () => cleanName(FORM.nick || G.nick) || 'WAKER';

// ---------------- the codes you swap ----------------
const b64e = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const b64d = s => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
async function zipBytes(u8, pack) { const cs = pack ? new CompressionStream('deflate-raw') : new DecompressionStream('deflate-raw'); const w = cs.writable.getWriter(); w.write(u8); w.close(); return new Uint8Array(await new Response(cs.readable).arrayBuffer()); }
async function packCode(o) {
  const u = new TextEncoder().encode(JSON.stringify(o));
  try { if (typeof CompressionStream === 'function') return 'EW1' + b64e(await zipBytes(u, true)); } catch (e) { }
  return 'EW0' + b64e(u);
}
async function unpackCode(s) {
  s = String(s || '').replace(/\s+/g, ''); const i = s.indexOf('EW'); if (i < 0) return null; s = s.slice(i);
  try { const raw = s[2] === '1' ? await zipBytes(b64d(s.slice(3)), false) : b64d(s.slice(3)); const o = JSON.parse(new TextDecoder().decode(raw)); return o && typeof o === 'object' ? o : null; } catch (e) { return null; }
}
async function iceDone(pc, ms) {
  if (pc.iceGatheringState === 'complete') return;
  await new Promise(res => { const t = setTimeout(res, ms); pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } }); });
}

// ---------------- the line between two computers ----------------
// a direct line (WebRTC) when the networks allow it; otherwise the relay (3-relay.js)
function wireDC(P, dc) {
  P.dc = dc;
  dc.onopen = () => { P.open = true; P.heard = performance.now(); if (netGuest() && !P.ok) sendTo(P, { t: 'hello', v: NETV, n: coopName(), sk: G.skin | 0, ht: G.hat | 0 }); };
  dc.onclose = () => { if (P.dc === dc) P.dc = null; if (rlyFallback(P)) return; P.open = false; coopLost(P); };
  dc.onmessage = e => { P.heard = performance.now(); try { onRaw(P, e.data); } catch (err) { console.warn('coop', err); } };
}
// key: a message that only says where something is now; a newer one replaces it if it hasn't left yet
function sendTo(P, m, key) {
  if (!P) return; const dc = dcOpen(P); if (!dc && !P.relay) return;
  const s = typeof m === 'string' ? m : JSON.stringify(m), out = [];
  if (s.length > 15000) { const id = ++COOP.pid, n = ceil(s.length / 15000); for (let k = 0; k < n; k++) out.push(JSON.stringify({ t: '_p', id, k, n, s: s.slice(k * 15000, (k + 1) * 15000) })); } else out.push(s);
  if (dc) {
    // the direct line came up while the relay was busy: wait until the relay is clear, so nothing arrives out of turn
    if (P.relay && (P.rq.length || P.rw.size || P.rbusy || (P.hold && P.hold.length))) { const H = P.hold || (P.hold = []); for (const x of out) H.push(x); if (H.length > 3000) rlyHoldFlush(P, true); return; }
    try { for (const x of out) P.dc.send(x); return; } catch (e) { if (!P.relay) return; }
  }
  for (const x of out) rlyQueue(P, x, out.length === 1 ? key : '');
}
function sendAll(m, except, key) { const s = JSON.stringify(m); for (const P of COOP.peers.values()) if (P !== except && P.ok && !P.ghostPeer) sendTo(P, s, key); }
function onRaw(P, data) {
  if (typeof data !== 'string' || data.length > 4e6) return; const m = JSON.parse(data); if (!m || typeof m !== 'object' || typeof m.t !== 'string') return;
  if (m.t === '_p') { const b = P.parts || (P.parts = new Map()); let a = b.get(m.id); if (!a) { if (b.size > 8) b.clear(); b.set(m.id, a = { n: 0, s: [] }); } if (a.s[m.k] === undefined) { a.s[m.k] = String(m.s); a.n++; } if (a.n >= m.n) { b.delete(m.id); onRaw(P, a.s.join('')); } return; }
  if (m.t === 'pi') { sendTo(P, { t: 'po', k: m.k }); return; }
  if (m.t === 'po') { const r = performance.now() - num(m.k); if (r >= 0 && r < 60000) P.rtt = P.rtt ? P.rtt * .7 + r * .3 : r; return; }
  onMsg(P, m, data);
}

// ---------------- host: inviting a friend ----------------
async function coopInvite() {
  if (COOP.busy) return; if (!rtcOK()) { COOP.err = 'This window cannot connect to others. Open Emberwake.html in Chrome, Safari or Edge to play together.'; return; }
  if (netGuest()) return; if ([...COOP.peers.values()].filter(P => P.ok).length >= MAXG) { COOP.err = 'Four Wakers is the most one world can hold.'; return; }
  COOP.busy = true; COOP.err = ''; COOP.code = ''; COOP.reply = '';
  try {
    if (!COOP.role) coopHostStart();
    if (COOP.pend && COOP.pend.pc) try { COOP.pend.pc.close(); } catch (e) { }
    const pc = new RTCPeerConnection(ICE), dc = pc.createDataChannel('ew', { ordered: true }), P = { id: 'g' + COOP.seq++, pc, open: false, ok: false, name: '', snaps: [] };
    wireDC(P, dc); watchPC(P);
    await pc.setLocalDescription(await pc.createOffer()); await iceDone(pc, 2600);
    COOP.pend = P; COOP.code = await packCode({ k: 'o', v: NETV, s: pc.localDescription.sdp, w: COOP.br ? '' : WORLD.name, br: COOP.br ? 1 : 0, h: coopName() });
  } catch (e) { COOP.err = 'Could not make an invite here.'; }
  COOP.busy = false;
}
async function coopConnect(text) {
  const P = COOP.pend; if (!P || COOP.busy) return; COOP.err = '';
  const o = await unpackCode(text); if (!o || o.k !== 'a' || typeof o.s !== 'string') { COOP.err = "That isn't a reply code. Ask your friend to copy the whole code their game made."; return; }
  COOP.busy = true;
  try { await P.pc.setRemoteDescription({ type: 'answer', sdp: o.s }); P.name = cleanName(o.n) || 'WAKER'; P.connT = performance.now(); COOP.peers.set(P.id, P); COOP.pend = null; COOP.code = ''; COOP.reply = ''; COOP.note = 'Connecting to ' + P.name + '...'; }
  catch (e) { COOP.err = 'That reply belongs to a different invite. Make a new invite and try again.'; }
  COOP.busy = false;
}
function watchPC(P) {
  const pc = P.pc; pc.onconnectionstatechange = () => { const s = pc.connectionState; if (s !== 'failed' && s !== 'closed') return; if (P.pc !== pc || rlyFallback(P)) return; coopLost(P); };
}
function coopHostStart() { COOP.role = 'host'; COOP.me = 'h'; COOP.hostName = coopName(); for (const e of G.enemies) if (!e.nid) e.nid = COOP.nid++; if (G.p) G.p.name = coopName(); }

// ---------------- guest: answering an invite ----------------
async function coopAnswer(text) {
  if (COOP.busy) return; COOP.err = ''; COOP.reply = '';
  if (!rtcOK()) { COOP.err = 'This window cannot connect to others. Open Emberwake.html in Chrome, Safari or Edge to play together.'; return; }
  const o = await unpackCode(text); if (!o || o.k !== 'o' || typeof o.s !== 'string') { COOP.err = "That isn't an invite code. Ask your friend to copy the whole code."; return; }
  if ((o.v | 0) !== NETV) { COOP.err = versionClash(o.gv); return; }
  COOP.busy = true; coopReset(); G.skin = FORM.skin | 0; COOP.lastCode = '';
  try {
    const pc = new RTCPeerConnection(ICE), P = { id: 'h', pc, open: false, ok: false, name: cleanName(o.h) || 'HOST', snaps: [] };
    pc.ondatachannel = e => wireDC(P, e.channel); watchPC(P);
    await pc.setRemoteDescription({ type: 'offer', sdp: o.s }); await pc.setLocalDescription(await pc.createAnswer()); await iceDone(pc, 2600);
    COOP.role = 'guest'; COOP.pend = P; COOP.peers.set('h', P); COOP.hostName = P.name; COOP.joinWorld = String(o.w || '').slice(0, 30); COOP.joinBR = !!o.br;
    COOP.reply = await packCode({ k: 'a', v: NETV, s: pc.localDescription.sdp, n: coopName() }); COOP.note = 'Waiting for ' + P.name + '...';
  } catch (e) { COOP.err = 'Could not answer that invite here.'; coopReset(); }
  COOP.busy = false;
}

// ---------------- leaving ----------------
function coopReset() {
  if (SIG.role === 'guest') sigStop();
  for (const P of COOP.peers.values()) { try { P.dc && P.dc.close(); } catch (e) { } try { P.pc && P.pc.close(); } catch (e) { } if (P.f) P.f.gone = true; }
  if (COOP.pend && COOP.pend.pc) try { COOP.pend.pc.close(); } catch (e) { }
  for (const g of COOP.ghosts.values()) g.dead = true; for (const f of COOP.hghosts.values()) f.gone = true;
  Object.assign(COOP, { role: null, me: '', pend: null, code: '', reply: '', busy: false, note: '', err: '', chatOpen: false, joined: false, br: false, locks: new Map(), myLock: -1, slow: false, entering: false, backlog: [] }); COOP.peers.clear(); COOP.ghosts.clear(); COOP.hghosts.clear(); COOP.tiles.clear(); COOP.stns.clear(); COOP.applying = false;
  if (G.fighters) G.fighters = G.fighters.filter(f => !f.gone); WORLD.guest = false;
}
function coopLeave() {
  sigStop(); COOP.gcode = '';
  if (!COOP.role) return; if (netGuest() && COOP.joined) guestSave();
  sendAll({ t: 'bye' }); const keep = [...COOP.peers.values()]; setTimeout(() => keep.forEach(P => { try { P.pc.close(); } catch (e) { } }), 200);
  for (const P of COOP.peers.values()) P.dc = null; coopReset();
}
// someone dropped out (or the line broke)
function coopLost(P) {
  if (!COOP.peers.has(P.id)) return;
  if (COOP.br) return brRtcLost(P);
  if (netGuest()) {
    const was = COOP.joined, br = COOP.br, code = COOP.lastCode; guestSave(); coopReset(); if (was && G.state !== 'title') { G.state = 'title'; UI.open = null; G.dialog = null; G.menuNote = ''; COOP.note = ''; }
    COOP.err = was ? 'The connection to your host ended. Your pack is kept for next time.' : 'Could not reach your friend.'; G.state = was ? 'join' : G.state;
    // joined with a game code: try to get back in by itself
    if (was && !br && code) COOP.retry = { code, n: 0, at: performance.now() + 1500 };
    return;
  }
  COOP.peers.delete(P.id); dropLocks(P.id); if (P.f) { P.f.gone = true; burst(P.f.x + 3, P.f.y + 10, 20, SPARK, 2, 40, { glow: 1 }); }
  if (P.ok) { chatLine('', P.name + ' left', '#8b8fa3'); sendAll({ t: 'pl', id: P.id }); }
  try { P.pc.close(); } catch (e) { }
  if (!COOP.peers.size && !COOP.pend) { COOP.role = null; COOP.me = ''; }
}

// ---------------- what each computer says ----------------
function onMsg(P, m, raw) {
  const H = netHost();
  // the world is still being built from the host's welcome (or a rift crossing): keep what arrives, in order, for a moment
  if (!H && COOP.entering && m.t !== 'bye' && m.t !== 'kick') { COOP.backlog.push([P, m, raw]); return; }
  if ((COOP.br || m.t === 'brw') && brRtcMsg(P, m)) return;
  switch (m.t) {
    case 'hello': if (H && !P.ok && COOP.br) { brRtcWelcome(P, m); return; } if (!H || P.ok) return; P.name = cleanName(m.n) || P.name || 'WAKER'; P.skin = clamp(m.sk | 0, 0, 5); P.hat = clamp(m.ht | 0, 0, 3); hostWelcome(P); return;
    case 'welcome': if (H || COOP.joined) return; guestEnter(m); return;
    case 'me': {
      const id = H ? P.id : m.id; if (!id || id === COOP.me) return; const Q = H ? P : COOP.peers.get(id) || peerFor(id, m);
      if (!Q || !m.s) return; if (!Q.f) makeRemote(Q, m.s); pushSnap(Q.f, m.s); if (H) { m.id = P.id; sendAll(m, P, 'me:' + P.id); } return;
    }
    case 'pj': if (!H && m.id !== COOP.me) { const Q = peerFor(m.id, m); Q.name = cleanName(m.n) || Q.name; chatLine('', Q.name + ' joined', '#7ddc6f'); } return;
    case 'pl': if (!H) { dropLocks(m.id); const Q = COOP.peers.get(m.id); if (Q && Q.ghostPeer) { COOP.peers.delete(m.id); if (Q.f) Q.f.gone = true; chatLine('', Q.name + ' left', '#8b8fa3'); } } return;
    case 'tiles': if (Array.isArray(m.d)) { applyTiles(m.d); if (H) sendAll(m, P); } return;
    case 'stn': if (m.o && typeof m.o === 'object') { netApplyStn(m.o); if (H) sendAll(m, P); } return;
    case 'chat': { const s = String(m.s || '').slice(0, 120), n = cleanName(H ? P.name : m.n) || 'WAKER'; if (!s) return; chatLine(n, s); if (H) sendAll({ t: 'chat', n, s }, P); return; }
    case 'shot': netGhostShot(m); if (H) sendAll(m, P); return;
    case 'boom': { const x = num(m.x), y = num(m.y); if (G.p && abs(G.p.x - x) < 120 * T && abs(G.p.y - y) < 80 * T) blastFelt(x, y); if (H) sendAll(m, P); return; }
    case 'lk': onLock(P, m); return;
    case 'drop': netDropIn(m); if (H) sendAll(m, P); return;
    case 'take': netTakeIn(m); if (H) sendAll(m, P); return;
    case 'bye': if (COOP.br) { if (H) brRtcLost(P); else brRtcLost(P); return; } if (H) coopLost(P); else { const was = COOP.joined; guestSave(); coopReset(); if (was) { G.state = 'join'; UI.open = null; G.dialog = null; COOP.err = 'Your host closed their world. Your pack is kept for next time.'; } } return;
    // guests tell the host what they did to its creatures
    case 'hit': if (H) hostHit(P, m); return;
    case 'fhit': if (H) hostFHit(P, m); return;
    case 'status': if (H) hostStatus(P, m); return;
    case 'summon': if (H && EVENTS[m.k] && !G.ev && !DIM) { startEvent(m.k, true); chatLine('', P.name + ' called ' + EVENTS[m.k].name.toLowerCase(), '#ffd35a'); } return;
    // the host tells guests about the world
    case 'foes': if (!H) onFoes(m); return;
    case 'edie': if (!H) onEdie(m); return;
    case 'hdie': if (!H) onHdie(m); return;
    case 'bossdown': if (!H) onBossDown(m); return;
    case 'hurt': if (!H) onHurt(m); return;
    case 'world': if (!H) onWorld(m); return;
    case 'dim': if (!H) onDim(m); return;
    case 'kick': if (!H) { guestSave(); coopReset(); G.state = 'join'; COOP.err = 'The host is full.'; } return;
  }
}
// guests learn about each other through the host
function peerFor(id, m) {
  const n = cleanName(m && (m.n || (m.s && m.s.n))); let Q = COOP.peers.get(id);
  if (!Q) { Q = { id, ghostPeer: true, ok: true, name: n || 'WAKER', snaps: [] }; COOP.peers.set(id, Q); } else if (n && Q.ghostPeer) Q.name = n; return Q;
}

// ---------------- the host lets someone in ----------------
function hostWelcome(P) {
  if ([...COOP.peers.values()].filter(Q => Q.ok).length >= MAXG) { sendTo(P, { t: 'kick' }); return; }
  const b = worldBlob(); b.drops = [];
  const p = G.p, pos = [r1(p.x + (Math.random() < .5 ? -14 : 14)), r1(p.y)];
  sendTo(P, { t: 'welcome', v: NETV, id: P.id, host: coopName(), world: { id: WORLD.id, name: WORLD.name, seed: WORLD.seed, size: WORLD.size, shape: WORLD.shape, mode: WORLD.mode, gen: WORLD.gen || 1, legacy: WORLD.legacy || {} }, dim: DIM, blob: b, pos, clock: G.clock, ev: G.ev, dev: G.dev, devT: G.devT,
    players: [...COOP.peers.values()].filter(Q => Q.ok && Q !== P).map(Q => ({ id: Q.id, n: Q.name })) });
  P.ok = true; P.seen = new Map(); P.hseen = new Set(); makeRemote(P, { x: pos[0], y: pos[1], n: P.name, sk: P.skin });
  sendAll({ t: 'pj', id: P.id, n: P.name }, P); chatLine('', P.name + ' joined your world', '#7ddc6f'); COOP.note = ''; sfx('quest', 0);
}
// ---------------- a guest arrives ----------------
function backlogStart() { COOP.entering = true; COOP.backlog = []; }
function backlogEnd() { const L = COOP.backlog || []; COOP.entering = false; COOP.backlog = []; for (const [P, m, raw] of L) { if (!COOP.role) return; try { onMsg(P, m, raw); } catch (e) { console.warn('coop', e); } } }
function guestEnter(m) {
  const w = m.world || {}; COOP.me = String(m.id || 'g?'); COOP.hostName = cleanName(m.host) || COOP.hostName; COOP.joined = true; COOP.retry = null; backlogStart();
  const HP = COOP.peers.get('h'); if (HP) { HP.ok = true; HP.name = COOP.hostName || HP.name; }
  G.state = 'loading'; G.loadMsg = 'Joining ' + String(w.name || 'a world').slice(0, 30) + '...';
  setTimeout(() => {
    COOP.applying = true;
    try {
      Object.assign(WORLD, { id: String(w.id || 'shared'), name: String(w.name || 'Shared World').slice(0, 30), seed: w.seed | 0, size: clamp(w.size | 0, 0, 2), shape: clamp(w.shape | 0, 0, 2), mode: w.mode ? 1 : 0, gen: GENS[w.gen | 0] ? w.gen | 0 : 1, arena: false });
      netLeave(); SEED = WORLD.seed; initEndless(); fixLeadTexts(); freshSession(); for (const k in DSTASH) delete DSTASH[k];
      WORLD.legacy = cleanLegacy(w.legacy); WORLD.guest = true; PLC.clear();
      const d = DIMP[m.dim | 0] && (m.dim | 0) ? m.dim | 0 : 0; if (d) initDim(d);
      loadBlob(m.blob || {}); const pos = Array.isArray(m.pos) ? m.pos : [SPAWN_X * T, (VIL_Y - 3) * T];
      if (!d) streamTo(SPAWN_X * T, true); streamTo(num(pos[0], SPAWN_X * T), true); settlePlaced();
      G.p = newPlayer(); G.fighters = [G.p]; guestLoad(); G.p.name = coopName();
      G.p.x = G.p.px = num(pos[0], G.p.x); G.p.y = G.p.py = num(pos[1], G.p.y); let n = 0; while (boxHits(G.p.x, G.p.y, G.p.w, G.p.h) && n++ < 60) G.p.y = G.p.py = G.p.y - T;
      spawnNPCs(); G.clock = num(m.clock, .3) % 1; G.ev = m.ev && typeof m.ev === 'object' ? m.ev : null; G.dev = m.dev && typeof m.dev === 'object' ? m.dev : null; G.devT = num(m.devT, 2400);
      for (const q of Array.isArray(m.players) ? m.players : []) peerFor(String(q.id), q);
      snapCam(); updateSun(); G.state = 'play'; beginPlay(false); G.says.length = 0; G.sayCur = null;
      G.banner = { text: WORLD.name.toUpperCase(), sub: 'in ' + (COOP.hostName || 'a friend') + "'s world", t: 0 }; COOP.note = ''; COOP.reply = ''; G.found = G.found || new Set();
      for (const P of COOP.peers.values()) if (P.f && !P.f.gone && !G.fighters.includes(P.f)) G.fighters.push(P.f);
    } finally { COOP.applying = false; backlogEnd(); }
  }, 40);
}
// what you carry between visits to a friend's world
function guestKey() { return 'ew2.guest.' + WORLD.id; }
function guestSave() {
  if (!netGuest() || !G.p || !WORLD.id) return;
  const o = { v: 1, inv: inv.slice(0, INV_N).map(s => s ? [s.id, s.n] : 0), worn: [...(G.worn || [])], gear: GEAR_SLOTS.map(s => G.gear && G.gear[s] ? G.gear[s].id : ''), off: G.gear && G.gear.off ? G.gear.off.id : '',
    food: r1(G.food), mast: G.mast || {}, fight: fightSave(), pairs: [...(G.pairsKnown || [])], known: [...G.known], used: [...G.movesUsed], flags: G.flags || {}, quality: G.quality || {}, hp: round(G.p.hp), skin: G.skin | 0, beasts: G.beasts || {}, kills: G.kills | 0, journal: G.journal || [], boons: trinkSave() };
  LS.set(guestKey(), JSON.stringify(o));
}
function guestLoad() {
  let o = null; try { o = JSON.parse(LS.get(guestKey()) || 'null'); } catch (e) { }
  G.worn = new Set(); G.gear = { head: null, body: null, legs: null, feet: null }; GEAR_C = null; G.mast = {}; fightLoad(o && o.fight, o && o.known); trinkLoad(null); G.pairsKnown = new Set(); INV_N = packCap(); inv = new Array(PACK_MAX).fill(null);
  if (!o) {
    // a friend's first visit starts like the host's did: with nothing (a forge world hands everyone its kit)
    if (WORLD.mode === 1) FORGE_KIT.forEach((id, i) => { if (i < INV_N && IT[id]) inv[i] = { id, n: IT[id].stack }; });
    G.flags.metWick = true; return;
  }
  G.worn = new Set((Array.isArray(o.worn) ? o.worn : []).filter(id => IT[id] && IT[id].pack)); INV_N = packCap();
  (Array.isArray(o.inv) ? o.inv : []).forEach((s, i) => { if (Array.isArray(s) && i < INV_N && IT[s[0]]) inv[i] = { id: s[0], n: clamp(s[1] | 0, 1, IT[s[0]].stack) }; });
  if (Array.isArray(o.gear)) GEAR_SLOTS.forEach((s, k) => { const id = o.gear[k]; if (IT[id] && IT[id].type === 'armor' && IT[id].slot === s) G.gear[s] = { id, n: 1 }; });
  if (IT[o.off] && IT[o.off].type === 'weapon') G.gear.off = { id: o.off, n: 1 };
  trinkLoad(o.boons);
  G.food = clamp(num(o.food, 100), 0, 100); if (o.mast && typeof o.mast === 'object') for (const k in o.mast) if (STYLES[k] && isFinite(o.mast[k])) G.mast[k] = +o.mast[k];
  G.pairsKnown = new Set(Array.isArray(o.pairs) ? o.pairs.filter(isStyleId) : []); G.known = new Set(Array.isArray(o.known) ? o.known : []); G.movesUsed = new Set(Array.isArray(o.used) ? o.used : []);
  G.flags = o.flags && typeof o.flags === 'object' ? o.flags : {}; G.quality = o.quality && typeof o.quality === 'object' ? o.quality : {}; G.beasts = o.beasts && typeof o.beasts === 'object' ? o.beasts : {}; G.kills = o.kills | 0;
  G.journal = Array.isArray(o.journal) ? o.journal.filter(j => JOURNAL[j]) : G.journal; G.p.maxhp = 100 + bonusHP(); G.p.hp = clamp(num(o.hp, G.p.maxhp), 20, G.p.maxhp);
}

// ---------------- other people's Wakers ----------------
function fighterState(f, me) {
  const a = f.atk, held = me ? (visHeld(f) || null) : IT[f.wid];
  const o = { x: r1(f.x), y: r1(f.y), vx: r2(f.vx), vy: r2(f.vy), f: f.face, g: f.onGround ? 1 : 0, st: f.dead ? 4 : f.state === 'dodge' ? 2 : f.hurtT > 0 ? 3 : a ? 1 : 0, hp: max(0, round(f.hp)), mhp: round(f.maxhp || 100),
    w: held && held.id ? held.id : '', m: a ? a.id : '', wa: a && a.W ? a.W.id : '', an: f.atkN | 0, mp: a ? a.phase : 0, mt: a ? r1(a.pt) : 0, ma: a ? r2(a.aimA || 0) : 0, md: a ? round(a.dist || 40) : 0, mc: a ? a.charge | 0 : 0, mf: a ? a.face : f.face,
    tt: f.toolT | 0, tc: f.toolCharge | 0, tw: f.swingTool ? (f.swingTool === HAND ? 'hand' : f.swingTool.id || '') : '', tk: r2(f.toolK || 0), tn: f.throwT | 0, iv: f.inv > 0 || f.iDodge > 0 ? 1 : 0, dd: f.dodgeDir | 0, n: f.name || '', sk: f.skin | 0, ht: f.hat | 0 };
  if (me) { o.gr = GEAR_SLOTS.map(s => G.gear && G.gear[s] ? G.gear[s].id : '').join(','); o.d = DIM; if (G.away) o.aw = 1; }
  o.ts = round(performance.now()); return o;
}
function makeRemote(Q, s) {
  const f = newFighter(num(s.x, G.p ? G.p.x : 0), num(s.y, G.p ? G.p.y : 0), { remote: true, coop: true, peer: Q.id, team: 'p', name: cleanName(s.n) || Q.name || 'WAKER', skin: clamp(s.sk | 0, 0, 5), hat: clamp(s.ht | 0, 0, 3), snaps: [], spawnT: 30 });
  f.wid = ''; Q.f = f; G.fighters.push(f); return f;
}
function pushSnap(f, s) {
  const S = f.snaps || (f.snaps = []), now = performance.now();
  // when it was sent, on our clock: smooths out a bumpy line (the relay bundles ten times a second)
  if (isFinite(s.ts)) {
    const off = now - s.ts; if (f.toff === undefined || off < f.toff) f.toff = off; else f.toff += .02;
    const late = off - f.toff; f.jit = f.jit === undefined ? late : f.jit * .92 + late * .08;
    if (f.lts !== undefined && s.ts > f.lts) f.gap = f.gap === undefined ? min(500, s.ts - f.lts) : f.gap * .9 + min(500, s.ts - f.lts) * .1; f.lts = s.ts;
    if (S.length && isFinite(S[S.length - 1].ts) && s.ts <= S[S.length - 1].ts) return; // an older word that arrived late: the newer one stands
    for (const q of S) if (isFinite(q.ts)) q.t = q.ts + f.toff; s.t = s.ts + f.toff; f.delay = clamp((f.gap || 50) + 1.5 * f.jit + 35, 85, 650);
  } else s.t = now;
  S.push(s); if (S.length > 30) S.shift(); f.away = !!s.aw;
  if (s.n && !f.hollow) f.name = cleanName(s.n) || f.name; if (s.sk !== undefined) f.skin = clamp(s.sk | 0, 0, f.hollow ? 11 : 5); if (s.ht !== undefined) f.hat = clamp(s.ht | 0, 0, 3);
  f.hp = num(s.hp, f.hp); f.maxhp = num(s.mhp, f.maxhp || 100); f.inDim = s.d;
  if (s.gr !== undefined && s.gr !== f.grKey) { f.grKey = s.gr; const ids = String(s.gr).split(','); f.gearObj = {}; GEAR_SLOTS.forEach((k, i) => { if (IT[ids[i]] && IT[ids[i]].type === 'armor') f.gearObj[k] = { id: ids[i], n: 1 }; }); f.gskin = null; }
}
// replay a remote Waker about a tenth of a second behind, so it moves smoothly
function coopReplay(f) {
  f.px = f.x; f.py = f.y; if (f.flash > 0) f.flash--; if (f.spawnT > 0) f.spawnT--; if (f.netHurtT > 0) f.netHurtT--;
  const S = f.snaps; if (!S || !S.length) return;
  const rt = performance.now() - (f.delay || 110); let a = null, b = null;
  for (let i = S.length - 1; i >= 0; i--) if (S[i].t <= rt) { a = S[i]; b = S[i + 1] || null; break; }
  if (!a) a = S[0];
  let x, y; if (b) { const u = clamp((rt - a.t) / max(1, b.t - a.t), 0, 1); x = lerp(a.x, b.x, u); y = lerp(a.y, b.y, u); } else { const e = clamp((rt - a.t) / 16.67, 0, 6); x = a.x + a.vx * e; y = a.y + (a.g ? 0 : a.vy * e); }
  if (!isFinite(x) || !isFinite(y)) return;
  if (hypot(x - f.x, y - f.y) > 90) { f.px = x; f.py = y; for (const s of f.scarf) { s.x = s.ox = x + 3; s.y = s.oy = y + 5; } }
  f.x = x; f.y = y; f.vx = num(a.vx); f.vy = num(a.vy); f.face = a.f < 0 ? -1 : 1; f.onGround = !!a.g; f.dodgeDir = a.dd | 0; f.inv = a.iv ? 2 : 0;
  const wasDead = f.dead; f.dead = a.st === 4; if (f.dead && !wasDead) f.deadT = 0; if (f.dead) f.deadT++;
  f.state = a.st === 2 ? 'dodge' : a.st === 1 ? 'attack' : 'normal'; f.hurtT = a.st === 3 ? 6 : 0; if (f.state === 'dodge' && G.time % 2 === 0) f.ghostReq = true;
  if (f.onGround && abs(f.vx) > .3) f.runPh += abs(f.vx) * .21;
  f.wid = IT[a.w] ? a.w : ''; f.toolT = a.tt | 0; f.toolCharge = a.tc | 0; f.swingTool = a.tw === 'hand' ? HAND : IT[a.tw] || null; f.toolK = num(a.tk); f.throwT = a.tn | 0;
  const W = IT[a.wa], set = W && W.type === 'weapon' && MOVESETS[W.set], m = a.st === 1 && set && set.moves[a.m];
  if (m) {
    if (!f.atk || f.atk.id !== a.m || f.atkN !== a.an) { f.atkN = a.an; f.atk = { f, id: a.m, m, W, set, setName: W.set, btn: m.btn, phase: 0, pt: 0, face: a.mf, aimA: num(a.ma), dist: num(a.md, 40), charge: 0, hits: new Map(), act: m.act, aimOff: 0, th: 0, dashT: 0, lastPhase: 0 }; setAim(f.atk); }
    const at = f.atk, adv = (rt - a.t) / 16.67; at.phase = a.mp | 0; at.charge = a.mc | 0; at.face = a.mf;
    at.pt = clamp(num(a.mt) + adv, 0, at.phase === 0 ? m.wind + (a.mc ? 0 : 1) : at.phase === 1 ? at.act : m.rec);
    if (at.phase === 1 && at.lastPhase === 0) fsx(f, m.kind === 'thrust' ? 'thrust' : m.big ? 'heavy' : 'swing', 0);
    if (at.phase === 2 && at.lastPhase === 1) fadeTrail(at); at.lastPhase = at.phase;
  } else { if (f.atk && f.atk.phase === 1) fadeTrail(f.atk); f.atk = null; }
  tickScarf(f);
}

// ---------------- the land, shared ----------------
// every change to a tile you make goes out; the host's water and sand go out too
function netTile(i) { if (COOP.role && !COOP.applying && G.state === 'play') COOP.tiles.add(i); }
function chipEnc(c) { let s = '', acc = 0, bits = 0; for (let k = 0; k < 64; k++) { acc = ((acc << 2) | (c[k] ? (c[k] < 120 ? 1 : c[k] < 205 ? 2 : 3) : 0)) & 0xffff; bits += 2; if (bits >= 6) { bits -= 6; s += B64C[(acc >> bits) & 63]; } } if (bits) s += B64C[(acc << (6 - bits)) & 63]; return s; }
function chipDec(h) { const c = new Uint8Array(64); let acc = 0, bits = 0, k = 0; for (const ch of String(h)) { const v = B64C.indexOf(ch); if (v < 0) break; acc = ((acc << 6) | v) & 0xffff; bits += 6; while (bits >= 2 && k < 64) { bits -= 2; c[k++] = [0, 80, 165, 255][(acc >> bits) & 3]; } } return c; }
function flushTiles() {
  if (!COOP.tiles.size) return; const d = [];
  for (const i of COOP.tiles) { if (d.length >= 700) break; d.push([i, tiles[i], walls[i], CHIP.has(i) ? chipEnc(CHIP.get(i)) : 0, PLACED.has(i) ? 1 : 0]); COOP.tiles.delete(i); }
  sendAll({ t: 'tiles', d });
}
function applyTiles(d) {
  const was = MODS_ON; COOP.applying = true; MODS_ON = true;
  try { for (const r of d) if (Array.isArray(r)) applyTile(r[0] | 0, r[1] | 0, r[2] | 0, r[3], r[4]); } finally { COOP.applying = false; MODS_ON = was; }
  unstickMe();
}
// someone else's block or door ended up where you stand: step to the nearest free spot
function unstickMe() {
  const p = G.p; if (!p || p.dead || !boxHits(p.x, p.y, p.w, p.h)) return;
  for (const [dx, dy] of [[0, -T], [-T, 0], [T, 0], [-T, -T], [T, -T], [0, -2 * T], [-2 * T, 0], [2 * T, 0], [0, -3 * T]]) if (!boxHits(p.x + dx, p.y + dy, p.w, p.h)) { p.x += dx; p.y += dy; p.px = p.x; p.py = p.y; p.vy = 0; return; }
}

// ---------------- one at a time at a chest, fire, kiln or rack ----------------
// two people taking from the same chest at once could double an item or lose one, so whoever
// opens it first has it until they close it; the others are told who is using it
const LOCK_T = () => [CHEST, FIRE, FURNACE, RACK];
function stnLockedBy(i) {
  if (!COOP.role || !COOP.locks) return null; const L = COOP.locks.get(i); if (!L || L.id === COOP.me) return null;
  if (performance.now() - L.t > 6500) { COOP.locks.delete(i); return null; } return L;
}
function netLock(i, on) { if (!COOP.role || !LOCK_T().includes(tiles[i])) return; if (on) COOP.myLock = i; else if (COOP.myLock === i) COOP.myLock = -1; sendAll({ t: 'lk', i, on: on ? 1 : 0, id: COOP.me, n: coopName() }); }
function onLock(P, m) {
  const i = m.i | 0, id = netHost() ? P.id : String(m.id || ''); if (!id || !(i >= 0 && i < WW * WH)) return; const L = COOP.locks || (COOP.locks = new Map());
  if (m.on) {
    const cur = L.get(i), now = performance.now(), n = cleanName(m.n) || P.name || 'A FRIEND';
    if (!cur || cur.id === id || id < cur.id || now - cur.t > 6500) L.set(i, { id, n, t: now });
    // both opened it in the same moment: the one listed first keeps it
    if (UI.open === 'stn' && UI.stn && UI.stn.i === i && id < COOP.me) { UI.stn = null; COOP.myLock = -1; closeUI(); sendAll({ t: 'lk', i, on: 0, id: COOP.me }); say(n + ' got to it first.'); sfx('deny'); }
  } else { const q = L.get(i); if (q && q.id === id) L.delete(i); }
  if (netHost()) { m.id = id; sendAll(m, P); }
}
function dropLocks(id) { if (COOP.locks) for (const [i, q] of COOP.locks) if (q.id === id) COOP.locks.delete(i); }
function applyTile(i, t, w, ch, pl) {
  if (!(i >= 0 && i < WW * WH) || !TP[t] || w < 0 || w > 63) return; const x = i % WW, y = (i / WW) | 0;
  if (!chunkReadyAt(x)) {
    MODS.set(i, t); const k = chunkOf(i); if (!PEND.mods.has(k)) PEND.mods.set(k, []); PEND.mods.get(k).push([i, t]);
    WMODS.set(i, w); if (!PEND.walls.has(k)) PEND.walls.set(k, []); PEND.walls.get(k).push([i, w]);
    if (ch) CHIP.set(i, chipDec(ch)); else CHIP.delete(i); if (pl) PLACED.add(i); else PLACED.delete(i); return;
  }
  const old = tiles[i];
  if (old !== t) {
    if (UI.open === 'stn' && UI.stn && UI.stn.i === i) closeUI();
    if (TP[old].dyn && STATIONS[old]) STN.delete(i);
    if (old === ROPE && t === AIR) { setTile(x, y, AIR); }
    else if (t === AIR || (TP[old].solid && !TP[t].solid && !TP[t].liquid)) { setTile(x, y, t); PLACED.delete(i); SUP.delete(i); if (t === AIR && !TP[old].liquid) afterRemove(x, y, old, { net: 1 }); }
    else setTile(x, y, t);
  }
  if (walls[i] !== w) { walls[i] = w; WMODS.set(i, w); if (w >= 8) WMODS_PLACED.add(i); else WMODS_PLACED.delete(i); dirtyAt(x, y); }
  if (ch) { CHIP.set(i, chipDec(ch)); dirtyAt(x, y); } else if (CHIP.has(i)) { CHIP.delete(i); dirtyAt(x, y); }
  if (pl) { if (!PLACED.has(i)) { PLACED.add(i); SUP.set(i, 99); } } else PLACED.delete(i);
}
// chests and stations: what is in them, after anyone touches them
function stnEnc(i, s) {
  const o = { i, t: s.t }; if (s.items) o.items = s.items.map(q => q ? [q.id, q.n] : 0); if (s.slots) o.slots = s.slots.map(q => q && RECIPES[q.r] ? [q.r, round(q.t), RECIPES[q.r].out || ''] : 0);
  for (const k of STN_KEYS) if (s[k] !== undefined) o[k] = typeof s[k] === 'number' ? round(s[k] * 100) / 100 : s[k]; return o;
}
function flushStns() { for (const i of COOP.stns) { const s = STN.get(i); if (s && tiles[i] === s.t) sendAll({ t: 'stn', o: stnEnc(i, s) }); } COOP.stns.clear(); }
function netApplyStn(o) {
  if (!(o.i >= 0 && o.i < WW * WH)) return; COOP.applying = true;
  try { if (chunkReadyAt(o.i % WW)) restoreStn(o); else { const k = chunkOf(o.i); if (!PEND.stn.has(k)) PEND.stn.set(k, []); PEND.stn.get(k).push(o); } } finally { COOP.applying = false; }
}

// ---------------- the host's creatures, seen by guests ----------------
const FOE_RX = 76 * T, FOE_RY = 50 * T, ESKIP = new Set(['px', 'py', 'nid', 'hits', 'ax', 'ay', 'ghost', 'snapNew']);
const plainObj = v => v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype;
function flatObj(v) { const o = {}; let n = 0; for (const k in v) { const q = v[k]; if (typeof q === 'number') o[k] = round(q * 100) / 100; else if (typeof q === 'string' || typeof q === 'boolean') o[k] = q; else continue; if (++n > 24) break; } return o; }
function eSer(e) {
  const o = {};
  for (const k in e) {
    if (ESKIP.has(k)) continue; const v = e[k], t = typeof v;
    if (t === 'number') o[k] = isFinite(v) ? round(v * 100) / 100 : 0;
    else if (t === 'string' || t === 'boolean') o[k] = v;
    else if (v && t === 'object') {
      if (Array.isArray(v)) { if (v.length <= 32 && v.every(q => typeof q === 'number')) o[k] = v.map(q => round(q * 100) / 100); else if (v.length <= 32 && v.every(plainObj)) o[k] = v.map(flatObj); }
      else if (v.fighter || v.remote || v.isPlayer) continue;
      else if (v.nid !== undefined && v.type && v.hp !== undefined) o[k] = { $e: v.nid };
      else if (plainObj(v)) o[k] = flatObj(v);
    }
  }
  return o;
}
function delta(cur, last) { const d = {}; for (const k in cur) { const a = cur[k], b = last[k]; if (a === b) continue; if (a && typeof a === 'object' && b && JSON.stringify(a) === JSON.stringify(b)) continue; d[k] = a; } return d; }
function sendFoes(P) {
  const f = P.f; if (!f) return; const seen = P.seen, live = new Set(), e1 = [];
  for (const e of G.enemies) {
    if (e.dead || e.type === 'dummy' || abs(e.x - f.x) > FOE_RX || abs(e.y - f.y) > FOE_RY) continue; if (!e.nid) e.nid = COOP.nid++; live.add(e.nid);
    const cur = eSer(e), last = seen.get(e.nid); if (!last) e1.push([e.nid, cur, 1]); else { const d = delta(cur, last); if (Object.keys(d).length) e1.push([e.nid, d, 0]); } seen.set(e.nid, cur);
  }
  const gone = []; for (const id of seen.keys()) if (!live.has(id)) { gone.push(id); seen.delete(id); }
  const hs = [], hnow = new Set();
  for (const h of G.fighters) { if (!h.hollow || h.remote || h.gone || abs(h.x - f.x) > FOE_RX || abs(h.y - f.y) > FOE_RY) continue; if (!h.nid) h.nid = COOP.nid++; hnow.add(h.nid); const s = fighterState(h); s.n = h.name; s.sk = h.skin; hs.push([h.nid, s]); }
  const hx = []; for (const id of P.hseen) if (!hnow.has(id)) { hx.push(id); P.hseen.delete(id); } for (const id of hnow) P.hseen.add(id);
  if (e1.length || gone.length || hs.length || hx.length) sendTo(P, { t: 'foes', e: e1, x: gone, h: hs, hx });
}
function onFoes(m) {
  for (const q of Array.isArray(m.e) ? m.e : []) {
    const id = q[0], d = q[1]; if (!d || typeof d !== 'object') continue; let g = COOP.ghosts.get(id);
    if (!g) { if (!q[2] || typeof d.type !== 'string') continue; g = { ghost: true, nid: id, x: num(d.x), y: num(d.y), px: num(d.x), py: num(d.y), vx: 0, vy: 0, w: 8, h: 8, hp: 1, maxhp: 1, flash: 0, t: 0, dead: false }; COOP.ghosts.set(id, g); G.enemies.push(g); }
    for (const k in d) { let v = d[k]; if (k === 'x' || k === 'y') continue; if (plainObj(v)) { if (v.$e !== undefined) { const r = COOP.ghosts.get(v.$e); if (!r) (g._ref || (g._ref = {}))[k] = v.$e; v = r || null; } else v = Object.assign({}, v); } g[k] = v; }
    if (d.x !== undefined) g.ax = num(d.x); if (d.y !== undefined) g.ay = num(d.y); g.heardT = 0; g.dead = false;
    if (g.boss && !G.boss) G.boss = g;
  }
  for (const id of Array.isArray(m.x) ? m.x : []) { const g = COOP.ghosts.get(id); if (g) { g.dead = true; COOP.ghosts.delete(id); if (G.boss === g) G.boss = null; } }
  for (const q of Array.isArray(m.h) ? m.h : []) {
    const id = q[0], s = q[1]; if (!s || typeof s !== 'object') continue; let f = COOP.hghosts.get(id);
    if (!f) { f = newFighter(num(s.x), num(s.y), { remote: true, ghostH: true, hollow: true, team: 'h', nid: id, name: cleanName(s.n) || 'HOLLOWBORN', skin: 11, snaps: [], hp: num(s.hp, 70), maxhp: num(s.mhp, 70) }); COOP.hghosts.set(id, f); G.fighters.push(f); }
    const nm = cleanName(s.n); s.n = ''; pushSnap(f, s); if (nm) f.name = nm;
  }
  for (const id of Array.isArray(m.hx) ? m.hx : []) { const f = COOP.hghosts.get(id); if (f) { f.gone = true; COOP.hghosts.delete(id); } }
}
// guests: creatures glide toward where the host says they are
function ghostTick() {
  for (const g of COOP.ghosts.values()) {
    g.px = g.x; g.py = g.y; if (g.flash > 0) g.flash--; g.heardT = (g.heardT || 0) + 1;
    if (g._ref) for (const k in g._ref) { const r = COOP.ghosts.get(g._ref[k]); if (r) { g[k] = r; delete g._ref[k]; } }
    if (g.ax === undefined) continue; if (g.heardT <= (COOP.slow ? 12 : 6)) { g.ax += num(g.vx); if (g.fly) g.ay += num(g.vy); }
    if (abs(g.ax - g.x) > 80 || abs(g.ay - g.y) > 80) { g.x = g.px = g.ax; g.y = g.py = g.ay; } else { g.x += (g.ax - g.x) * .35; g.y += (g.ay - g.y) * .35; }
  }
  // anything this game made up on its own would only stand frozen: the host's creatures are the real ones
  G.enemies = G.enemies.filter(e => !e.dead && (e.ghost || e.type === 'dummy'));
}
// a guest's blow lands: it shows at once, and the host does the rest
function netHitGhost(e, dmg, kx, ky, o) {
  const tgt = e.root && e.root.ghost ? e : e; if (e.dead || (e.root || e).invuln) return 0; const id = tgt.nid; if (!id) return 0;
  const oo = {}; for (const k of ['crit', 'stagger', 'launch', 'blunt', 'stop', 'shake', 'dot', 'big', 'hx', 'hy', 'pierce', 'elem']) if (o && (typeof o[k] === 'number' || typeof o[k] === 'boolean' || typeof o[k] === 'string')) oo[k] = o[k];
  sendAll({ t: 'hit', id, dmg: round(dmg * 10) / 10, kx: r2(kx || 0), ky: r2(ky || 0), o: oo });
  e.flash = 6; if (e.root) e.root.flash = 6; numPop(e.x + e.w / 2, e.y - 2, max(1, round(dmg * (e.dmgMul || 1))), o && o.dot ? '#ff9a3d' : o && o.crit ? '#ffd35a' : '#ffffff');
  return 1;
}
const foeById = id => G.enemies.find(e => e.nid === id && !e.dead);
function hostHit(P, m) {
  const e = foeById(m.id); if (!e) return; const o = {}; if (m.o && typeof m.o === 'object') for (const k in m.o) if (['number', 'boolean', 'string'].includes(typeof m.o[k])) o[k] = m.o[k];
  o.by = P.f; damageEnemy(e, clamp(num(m.dmg), 0, 999), clamp(num(m.kx), -9, 9), clamp(num(m.ky), -9, 9), o);
}
function hostFHit(P, m) {
  const h = G.fighters.find(f => f.nid === m.id && f.hollow && !f.remote && !f.dead); if (!h) return;
  hurtFighter(h, clamp(num(m.dmg), 0, 999), num(m.fx, h.x), { kx: clamp(num(m.kx), -9, 9), ky: clamp(num(m.ky), -9, 9), by: P.f, crit: !!m.crit, stagger: m.stagger | 0 });
}
function hostStatus(P, m) { const e = foeById(m.id); if (e && typeof m.k === 'string') applyStatus(e, m.k, P.f, m.o && typeof m.o === 'object' ? flatObj(m.o) : {}); }
// a guest strikes a hollow: same idea
function netHitHollow(f, dmg, fromX, o) {
  if (f.dead) return false; sendAll({ t: 'fhit', id: f.nid, dmg: round(dmg * 10) / 10, fx: round(fromX || f.x), kx: r2(o.kx || 0), ky: r2(o.ky || 0), crit: !!o.crit, stagger: o.stagger | 0 });
  f.flash = 6; numPop(f.x + 3, f.y - 2, max(1, round(dmg)), o.crit ? '#ffd35a' : '#ffffff'); return true;
}
// the host's creature catches a guest: the guest's own game decides (so a perfect dodge still dodges)
function netHurtPeer(f, dmg, fromX, o) {
  if (!netHost() || f.dead || f.inv > 0 || f.netHurtT > 0) return false; const P = COOP.peers.get(f.peer); if (!P || !P.ok) return false;
  f.netHurtT = 18; sendTo(P, { t: 'hurt', dmg: round(dmg * 10) / 10, fx: round(fromX === undefined ? f.x : fromX), kx: o && o.kx !== undefined ? r2(o.kx) : undefined, ky: o && o.ky !== undefined ? r2(o.ky) : undefined, st: o && o.status || '' });
  return true;
}
function onHurt(m) {
  const p = G.p; if (!p || p.dead) return; const o = {}; if (m.kx !== undefined) o.kx = clamp(num(m.kx), -9, 9); if (m.ky !== undefined) o.ky = clamp(num(m.ky), -9, 9);
  const hit = hurtFighter(p, clamp(num(m.dmg), 0, 300), num(m.fx, p.x), o); if (hit && typeof m.st === 'string' && m.st) applyStatus(p, m.st, null, {});
}
function netStatusGhost(e, k, o) { sendAll({ t: 'status', id: e.nid, k, o: o ? flatObj(o) : {} }); }
// a creature falls: everyone near gets their own share of what it drops
function netEnemyDied(e) { if (!e.nid) return; sendAll({ t: 'edie', id: e.nid, type: e.type, x: round(e.x), y: round(e.y), w: e.w, h: e.h }); }
function onEdie(m) {
  const g = COOP.ghosts.get(m.id) || { ghost: true, type: String(m.type || ''), x: num(m.x), y: num(m.y), w: num(m.w, 8), h: num(m.h, 8), hp: 0, maxhp: 1 }; COOP.ghosts.delete(m.id);
  if (g.dead || g.boss) return; g.hp = 0; const near = G.p && abs(G.p.x - g.x) < 70 * T && abs(G.p.y - g.y) < 50 * T, n0 = G.enemies.length;
  if (!near) { g.dead = true; return; }
  COOP.ghostFx = true; try { g.ghostDying = true; killEnemy(g); } finally { COOP.ghostFx = false; }
  if (G.enemies.length > n0) G.enemies = G.enemies.filter((e, i) => i < n0 || e.ghost);
  g.dead = true; if (G.boss === g) G.boss = null;
}
function onHdie(m) { if (!G.p || abs(G.p.x - num(m.x)) > 70 * T) return; const f = { x: num(m.x), y: num(m.y), elite: m.elite || null, arms: ['shuriken'] }; hollowDrops(f); }
function onBossDown(m) { const g = COOP.ghosts.get(m.id); if (!g) return; COOP.ghosts.delete(m.id); g.state = 'dying'; if (G.p && abs(G.p.x - g.x) < 90 * T) { COOP.ghostFx = true; try { bossDown(g); } finally { COOP.ghostFx = false; } } g.dead = true; if (G.boss === g) G.boss = null; }
// shots: everyone sees everyone's arrows; only the shooter's game counts the hits
function netShotOut(pr) {
  if (!COOP.role || COOP.applying || pr.ghost || pr.arm || pr.net) return; if (netGuest() && !(pr.owner === G.p)) return;
  sendAll({ t: 'shot', k: pr.type, x: r1(pr.x), y: r1(pr.y), vx: r2(pr.vx), vy: r2(pr.vy), g: round(pr.g * 1000) / 1000, r: pr.r, l: pr.life | 0, b: pr.boom | 0 });
}
function netGhostShot(m) {
  if (typeof m.k !== 'string' || !G.p || abs(num(m.x) - G.p.x) > 90 * T) return;
  spawnProj({ type: m.k, owner: null, ghost: true, net: true, x: num(m.x), y: num(m.y), vx: clamp(num(m.vx), -16, 16), vy: clamp(num(m.vy), -16, 16), g: clamp(num(m.g), 0, .5), r: clamp(num(m.r, 3), 1, 14), life: clamp(num(m.l, 120), 1, 400), boom: m.b | 0, dmg: 0 });
}
// things you throw down for a friend: they are there for everyone, until someone picks them up
function netDropOut(d) { if (!COOP.role || COOP.applying || !d) return; d.uid = COOP.me + ':' + (++COOP.uid); sendAll({ t: 'drop', u: d.uid, id: d.id, n: d.n, x: r1(d.x), y: r1(d.y), vx: r2(d.vx), vy: r2(d.vy) }); }
function netDropIn(m) { if (!IT[m.id] || !(m.n > 0) || typeof m.u !== 'string' || G.drops.some(d => d.uid === m.u)) return; const x = num(m.x), y = num(m.y); G.drops.push({ id: m.id, n: clamp(m.n | 0, 1, IT[m.id].stack), x, y, px: x, py: y, w: 6, h: 6, vx: num(m.vx), vy: num(m.vy), t: 0, delay: 40, onGround: false, uid: m.u }); }
function netTakeIn(m) { for (let i = G.drops.length - 1; i >= 0; i--) if (G.drops[i].uid === m.u) G.drops.splice(i, 1); }
function netTook(d) { if (COOP.role && d.uid) sendAll({ t: 'take', u: d.uid }); }

// ---------------- the sky and the clock follow the host ----------------
function worldState() { return { t: 'world', c: r2(G.clock * 1e4) / 1e4, ev: G.ev || null, dev: G.dev || null, devT: G.devT | 0 }; }
function onWorld(m) {
  const c = num(m.c, G.clock); if (abs(c - G.clock) > .002 && abs(c - G.clock) < .998) G.clock = c;
  G.ev = m.ev && typeof m.ev === 'object' ? m.ev : null; G.dev = m.dev && typeof m.dev === 'object' ? m.dev : null; G.devT = m.devT | 0;
}
// through a rift: the host leads, everyone follows
function netAfterDim() {
  if (!netHost()) return; const b = worldBlob(); b.drops = [];
  sendAll({ t: 'dim', d: DIM, blob: b, pos: [r1(G.p.x), r1(G.p.y)] });
  for (const P of COOP.peers.values()) if (P.ok) { P.seen = new Map(); P.hseen = new Set(); if (P.f) { P.f.gone = false; P.f.snaps = []; if (!G.fighters.includes(P.f)) G.fighters.push(P.f); P.f.x = P.f.px = G.p.x; P.f.y = P.f.py = G.p.y; } }
}
function onDim(m) {
  const d = m.d | 0; if (!DIMP[d] && d !== 0) return; const first = d && !G.flags['seen' + d];
  G.state = 'loading'; G.loadMsg = d ? 'Following your host into ' + DIMP[d].short + '...' : 'Following your host home...'; backlogStart();
  setTimeout(() => {
    COOP.applying = true;
    try {
      for (const g of COOP.ghosts.values()) g.dead = true; COOP.ghosts.clear(); for (const f of COOP.hghosts.values()) f.gone = true; COOP.hghosts.clear();
      DSTASH[d] = m.blob || {}; switchDim(d); const pos = Array.isArray(m.pos) ? m.pos : null;
      if (pos) { streamTo(num(pos[0]), true); G.p.x = G.p.px = num(pos[0]) + 10; G.p.y = G.p.py = num(pos[1]); let n = 0; while (boxHits(G.p.x, G.p.y, G.p.w, G.p.h) && n++ < 60) G.p.y = G.p.py = G.p.y - T; }
      for (const P of COOP.peers.values()) if (P.f) { P.f.gone = false; P.f.snaps = []; if (!G.fighters.includes(P.f)) G.fighters.push(P.f); }
      snapCam();
    } finally { COOP.applying = false; }
    G.state = 'play'; arriveFx(d, first); backlogEnd();
  }, 30);
}

// ---------------- every tick ----------------
function coopTick() {
  if (!COOP.role) return; COOP.t++;
  if (G.away && G.p && !WORLD.arena && !COOP.br) G.p.inv = max(G.p.inv | 0, 40);
  if (COOP.t % 120 === 60 && UI.open === 'stn' && UI.stn && COOP.myLock === UI.stn.i) netLock(UI.stn.i, true);
  if (COOP.br) return;
  if (G.state !== 'play' || !G.p) return;
  if (COOP.t % 3 === 0) { const s = fighterState(G.p, true); s.n = coopName(); s.sk = G.skin | 0; sendAll({ t: 'me', id: COOP.me, s }, null, 'me:' + COOP.me); }
  if (COOP.t % 3 === 1) flushTiles(); if (COOP.t % 6 === 2 && COOP.stns.size) { flushTiles(); flushStns(); }
  if (netHost()) {
    if (COOP.t % 5 === 0) for (const P of COOP.peers.values()) if (P.ok && !P.ghostPeer) sendFoes(P);
    if (COOP.t % 15 === 7) sendAll(worldState(), null, 'world');
    for (const P of COOP.peers.values()) if (P.ok && P.f && P.f.snaps.length && G.time % 4 === 0) streamTo(P.f.x + 3);
  } else { const HP = COOP.peers.get('h'); COOP.slow = !!(HP && HP.relay && !dcOpen(HP)); ghostTick(); if (++COOP.saveT % 3600 === 0) guestSave(); }
  const now = performance.now();
  for (const P of COOP.peers.values()) if (P.open && P.heard && now - P.heard > 15000 && !P.ghostPeer) coopLost(P);
  // a friend who never got through
  for (const P of COOP.peers.values()) if (!P.open && !P.ok && P.connT && now - P.connT > 25000) { COOP.peers.delete(P.id); try { P.pc.close(); } catch (e) { } COOP.note = ''; COOP.err = 'Could not reach ' + P.name + '. Try again with a new invite; on the same Wi-Fi it almost always works.'; }
  for (const P of COOP.peers.values()) if (P.f && P.f.inDim !== undefined && netHost()) P.f.noHit = P.f.inDim !== DIM;
}

// ---------------- finding each other ----------------
// friends in the same world and place as you (for the map, the pointers and GO TO)
function netFriends() { const a = []; if (!COOP.role || COOP.br || WORLD.arena) return a; for (const P of COOP.peers.values()) { const f = P.f; if (P.ok && f && !f.gone && (f.inDim === undefined || (f.inDim | 0) === DIM)) a.push(f); } return a; }
function goToFriend(f) {
  const p = G.p; if (!p || !f || f.gone || p.dead || G.cine || G.link) return;
  if ((G.gotoT || 0) > G.time) { say('Catch your breath first (' + ceil((G.gotoT - G.time) / 60) + 's).'); sfx('deny'); return; }
  burst(p.x + 3, p.y + 10, 16, ['#8ff5e6', '#4fd8c8'], 2, 30, { glow: 1 }); streamTo(f.x + 3, true);
  p.x = p.px = f.x + (f.face || 1) * -8; p.y = p.py = f.y - 2; p.vx = p.vy = 0; unstickMe(); if (boxHits(p.x, p.y, p.w, p.h)) { p.x = p.px = f.x; p.y = p.py = f.y; unstickMe(); }
  snapCam(); closeUI(); G.gotoT = G.time + 600; burst(p.x + 3, p.y + 10, 20, ['#8ff5e6', '#4fd8c8'], 2.4, 36, { glow: 1 }); sfx('quest', 0); say('You find ' + f.name + '.');
}
// a small pointer at the screen's edge toward each friend out of sight
function drawFriendArrows(c) {
  const k = VS.s / VS.ui, mx = VS.uw / 2, my = VS.uh / 2;
  for (const f of netFriends()) {
    const sx = (f.x + 3 - G.cam.x) * k, sy = (f.y + 8 - G.cam.y) * k; if (sx > -4 && sx < VS.uw + 4 && sy > -4 && sy < VS.uh + 4) continue;
    const dx = sx - mx, dy = sy - my, s = min((mx - 16) / max(1, abs(dx)), (my - 16) / max(1, abs(dy))), ax = round(mx + dx * s), ay = round(my + dy * s), a = Math.atan2(dy, dx);
    c.fillStyle = '#120d1f'; c.beginPath(); c.moveTo(ax + Math.cos(a) * 7, ay + Math.sin(a) * 7); c.lineTo(ax + Math.cos(a + 2.4) * 6, ay + Math.sin(a + 2.4) * 6); c.lineTo(ax + Math.cos(a - 2.4) * 6, ay + Math.sin(a - 2.4) * 6); c.closePath(); c.fill();
    c.fillStyle = '#8ff5e6'; c.beginPath(); c.moveTo(ax + Math.cos(a) * 5, ay + Math.sin(a) * 5); c.lineTo(ax + Math.cos(a + 2.4) * 4, ay + Math.sin(a + 2.4) * 4); c.lineTo(ax + Math.cos(a - 2.4) * 4, ay + Math.sin(a - 2.4) * 4); c.closePath(); c.fill();
    const lab = f.name.slice(0, 10) + ' ' + round(hypot(f.x - G.p.x, f.y - G.p.y) / T), tw = textW(lab), lx = clamp(ax - tw / 2, 2, VS.uw - tw - 2), ly = clamp(ay + (dy > 0 ? -16 : 8), 2, VS.uh - 10);
    textS(c, lab, round(lx), round(ly), '#8ff5e6');
  }
}

// ---------------- talking ----------------
function chatLine(n, s, col) { COOP.chat.push({ n, s, col: col || '#e8edf2', t: 0 }); if (COOP.chat.length > 8) COOP.chat.shift(); }
function chatSend(s) { s = String(s || '').replace(/[\u0000-\u001f]/g, '').trim().slice(0, 120); if (!s) return; chatLine(coopName(), s); sendAll({ t: 'chat', n: coopName(), s }); }
function drawCoopHud(c) {
  if (!COOP.role || G.state !== 'play') return;
  for (const l of COOP.chat) l.t++; COOP.chat = COOP.chat.filter(l => l.t < 900 || COOP.chatOpen);
  const hb = hotbarLayout(), y0 = hb.y - 14 - COOP.chat.length * 10;
  COOP.chat.forEach((l, i) => { c.globalAlpha = COOP.chatOpen ? 1 : clamp((900 - l.t) / 120, 0, 1); const y = y0 + i * 10; if (l.n) { textS(c, l.n + ':', 4, y, '#ffd35a'); textS(c, l.s, 8 + textW(l.n + ':'), y, l.col); } else textS(c, l.s, 4, y, l.col); c.globalAlpha = 1; });
  if (!COOP.chatOpen && !UI.open) textS(c, '[ENTER] chat', 4, hb.y - 10, '#6a6485');
  if (!UI.open && !G.cine) drawFriendArrows(c);
  // who is here
  const list = [{ n: coopName() + (netHost() ? ' (host)' : ''), hp: G.p.hp, mx: G.p.maxhp, me: 1 }]; for (const P of COOP.peers.values()) if (P.ok && P.f) list.push({ n: P.f.name + (P.id === 'h' ? ' (host)' : ''), hp: P.f.hp, mx: P.f.maxhp || 100, away: P.f.inDim !== undefined && P.f.inDim !== DIM });
  const x = 4; list.forEach((q, i) => { const y = 62 + i * 11; textS(c, q.n.slice(0, 16), x, y, q.me ? '#8ff5e6' : q.away ? '#6a6485' : '#e8edf2'); bar(c, x, y + 8, 60, 2, clamp(q.hp / (q.mx || 100), 0, 1), '#e2483b', '#8f2233'); });
}
function chatKey() { if (!COOP.role || G.state !== 'play' || G.dialog) return false; COOP.chatOpen = true; COOP.chatFocus = false; for (const k in keys) keys[k] = false; return true; }

// ---------------- text boxes laid over the game (so copy and paste work everywhere) ----------------
const DOMX = { els: new Map(), used: new Set() };
function domBox(id, x, y, w, h, o = {}) {
  let el = DOMX.els.get(id);
  if (!el) {
    el = document.createElement(o.input ? 'input' : 'textarea'); el.spellcheck = false; el.autocomplete = 'off'; el.setAttribute('autocapitalize', 'off'); el.id = 'ew-' + id;
    Object.assign(el.style, { position: 'fixed', zIndex: 5, background: '#16121f', color: '#e8edf2', border: '1px solid #6a6485', fontFamily: 'Menlo, Consolas, monospace', padding: '3px 5px', resize: 'none', outline: 'none', boxSizing: 'border-box', wordBreak: 'break-all', borderRadius: '2px' });
    el.addEventListener('keydown', e => { e.stopPropagation(); if (o.onEnter && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); o.onEnter(el); } if (o.onEsc && e.key === 'Escape') { e.preventDefault(); o.onEsc(el); } });
    el.addEventListener('keyup', e => e.stopPropagation()); el.addEventListener('mousedown', e => e.stopPropagation());
    document.body.appendChild(el); DOMX.els.set(id, el);
  }
  const r = cv.getBoundingClientRect(), k = VS.ui * r.width / cv.width;
  Object.assign(el.style, { left: (r.left + x * k) + 'px', top: (r.top + y * k) + 'px', width: (w * k) + 'px', height: (h * k) + 'px', fontSize: max(10, round(4.6 * k)) + 'px', display: '' });
  el.readOnly = !!o.ro; if (o.ph !== undefined) el.placeholder = o.ph; if (o.val !== undefined && el.value !== o.val && (o.ro || document.activeElement !== el)) el.value = o.val;
  DOMX.used.add(id); return el;
}
function domSweep() {
  if (COOP.copied > 0) COOP.copied--; for (const [id, el] of DOMX.els) if (!DOMX.used.has(id) && el.style.display !== 'none') { el.style.display = 'none'; if (document.activeElement === el) el.blur(); } DOMX.used.clear(); }
const domVal = id => { const el = DOMX.els.get(id); return el ? el.value : ''; };
// copy a code: select it in its box and copy that (works inside claude.ai's frame); if the page may not
// touch the clipboard at all, the code stays selected and the button says which keys to press
const MACKEYS = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');
function copyText(s, id) {
  let el = DOMX.els.get(id), tmp = null; let ok = false;
  if (!el) { tmp = el = document.createElement('textarea'); el.value = s; Object.assign(el.style, { position: 'fixed', left: '-9999px', top: '0' }); document.body.appendChild(el); }
  if (el) { try { el.focus(); el.select(); el.setSelectionRange(0, el.value.length); ok = !!document.execCommand('copy'); } catch (e) { ok = false; } }
  if (tmp) { tmp.remove(); try { cv.focus(); } catch (e) { } }
  COOP.copied = 150; COOP.copyFail = !ok;
  if (!ok) {
    const pp = document.permissionsPolicy || document.featurePolicy, may = !pp || !pp.allowsFeature || pp.allowsFeature('clipboard-write');
    if (may && navigator.clipboard && navigator.clipboard.writeText) { try { navigator.clipboard.writeText(s).then(() => { COOP.copyFail = false; }, () => { }); } catch (e) { } }
  }
  sfx('ui');
}
const copyLabel = () => COOP.copied > 0 ? (COOP.copyFail ? (MACKEYS ? 'CMD+C' : 'CTRL+C') : 'COPIED') : 'COPY';
function copyHint(c, x, y) { if (COOP.copied > 0 && COOP.copyFail) drawText(c, 'The code is selected: press ' + (MACKEYS ? 'Cmd+C' : 'Ctrl+C') + ' to copy it.', x, y, '#ffd35a'); }
// the chat line itself
function drawChatBox(c) {
  if (!COOP.chatOpen || G.state !== 'play') { COOP.chatFocus = false; return; } const hb = hotbarLayout();
  const el = domBox('chat', 4, hb.y - 26, min(240, VS.uw - 8), 13, { input: true, ph: 'say something, then Enter', onEnter: el => { chatSend(el.value); el.value = ''; COOP.chatOpen = false; el.blur(); }, onEsc: el => { el.value = ''; COOP.chatOpen = false; el.blur(); } });
  if (!COOP.chatFocus) { COOP.chatFocus = true; el.value = ''; el.focus(); }
}

// ---------------- the host's panel: inviting ----------------
function drawCoopLong(c) {
  const w = min(380, VS.uw - 16), h = 252, x = round((VS.uw - w) / 2), y = round((VS.uh - h) / 2);
  panel(c, x, y, w, h, 'PLAY TOGETHER'); hit(x, y, w, h, () => { });
  button(c, x + w - 20, y + 2, 16, 11, 'X', () => { closeUI(); });
  const fx = x + 8, fw = w - 16; let ty = y + 18;
  const ppl = [coopName() + (netGuest() ? '' : ' (host)')]; for (const P of COOP.peers.values()) if (P.ok) ppl.push(P.name + (P.id === 'h' ? ' (host)' : ''));
  drawText(c, 'IN THIS WORLD: ' + ppl.join(', '), fx, ty, '#8ff5e6'); ty += 12;
  if (!netGuest()) { drawText(c, 'YOUR NAME', fx, ty + 3, '#b9bdd0'); const el = domBox('hname', fx + 62, ty, 120, 12, { input: true, val: FORM.nick || G.nick || 'WAKER' }); const nm = cleanName(el.value); if (nm && nm !== FORM.nick) { FORM.nick = nm; if (G.p) G.p.name = nm; } ty += 16; }
  if (netGuest()) {
    ['You are in ' + (COOP.hostName || 'a friend') + "'s world. Only the host can invite.", 'Your pack is saved on this computer for next time.'].forEach((l, i) => drawText(c, l, fx, ty + i * 10, '#d8d4e6'));
    button(c, fx, y + h - 22, 120, 15, 'LEAVE THEIR WORLD', () => { closeUI(); quitToTitle(); }, { col: '#ff9a8a' }); return;
  }
  if (!rtcOK()) { ['This window cannot connect to other computers.', 'Open Emberwake.html in Chrome, Safari or Edge to play together.'].forEach((l, i) => drawText(c, l, fx, ty + i * 10, '#ffb347')); return; }
  drawText(c, '1  Make an invite code and send it to your friend (any chat app).', fx, ty, '#d8d4e6'); ty += 11;
  if (!COOP.code) button(c, fx, ty, 150, 15, COOP.busy ? 'MAKING THE CODE...' : 'MAKE AN INVITE CODE', () => { if (!COOP.busy) coopInvite(); });
  else { domBox('code', fx, ty, fw - 64, 30, { ro: true, val: COOP.code }); button(c, fx + fw - 58, ty, 58, 15, copyLabel(), () => copyText(COOP.code, 'code')); button(c, fx + fw - 58, ty + 17, 58, 13, 'NEW CODE', () => coopInvite()); }
  ty += 36;
  drawText(c, '2  They open Emberwake, pick JOIN A FRIEND, paste it, and send', fx, ty, '#d8d4e6'); drawText(c, '   you back a reply code. Paste their reply here:', fx, ty + 10, '#d8d4e6'); ty += 23;
  domBox('reply', fx, ty, fw - 64, 30, { ph: 'paste their reply code here' });
  button(c, fx + fw - 58, ty, 58, 15, 'CONNECT', () => { coopConnect(domVal('reply')).then(() => { const el = DOMX.els.get('reply'); if (el && !COOP.err) el.value = ''; }); });
  ty += 36;
  const st = COOP.err || COOP.note || ([...COOP.peers.values()].some(P => P.ok) ? 'Invite someone else the same way (up to 3 friends).' : '');
  if (COOP.copied > 0 && COOP.copyFail) copyHint(c, fx, ty); else if (st) wrapDraw(c, st, fx, ty, fw, COOP.err ? '#ff9a8a' : '#7ddc6f');
  drawText(c, 'Best on the same Wi-Fi; most home internet works too.', fx, y + h - 22, '#8b8fa3');
  drawText(c, 'Your world keeps running while this is open. Esc closes it.', fx, y + h - 12, '#8b8fa3');
  button(c, x + w - 112, y + h - 24, 104, 12, 'BACK TO GAME CODES', () => { COOP.long = false; COOP.err = ''; sfx('ui'); });
}
// ---------------- joining from the title screen ----------------
function drawJoinLong(c) {
  const uw = VS.uw, uh = VS.uh, w = min(380, uw - 16), h = 256, x = round((uw - w) / 2), y = max(8, round((uh - h) / 2));
  c.fillStyle = 'rgba(18,13,31,.55)'; c.fillRect(0, 0, uw, uh); panel(c, x, y, w, h, 'JOIN A FRIEND');
  const fx = x + 8, fw = w - 16; let ty = y + 18;
  drawText(c, 'NAME', fx, ty + 4, '#b9bdd0'); field(c, fx + 40, ty, 140, 'nick', 'WAKER'); skinPicker(c, fx + 190, ty - 2); ty += 34;
  if (!rtcOK()) { ['This window cannot connect to other computers.', 'Open Emberwake.html in Chrome, Safari or Edge to play together.'].forEach((l, i) => drawText(c, l, fx, ty + i * 10, '#ffb347')); }
  else {
    drawText(c, "1  Paste the invite code your friend sent you:", fx, ty, '#d8d4e6'); ty += 11;
    domBox('invite', fx, ty, fw, 30, { ph: 'paste the invite code here' }); ty += 34;
    if (!COOP.reply) button(c, fx, ty, 150, 15, COOP.busy ? 'ANSWERING...' : 'MAKE MY REPLY CODE', () => { if (!COOP.busy) { FORM.nick = coopName(); coopAnswer(domVal('invite')); } });
    else {
      drawText(c, '2  Send this reply code back to your friend:', fx, ty, '#d8d4e6'); ty += 11;
      domBox('code', fx, ty, fw - 64, 30, { ro: true, val: COOP.reply }); button(c, fx + fw - 58, ty, 58, 15, copyLabel(), () => copyText(COOP.reply, 'code'));
      ty += 34; drawText(c, COOP.joinBR ? '3  When they paste it, you join their battle royale lobby.' : '3  When they paste it, you join their world' + (COOP.joinWorld ? ', ' + COOP.joinWorld : '') + '.', fx, ty, '#d8d4e6');
    }
    ty += 18; const st = COOP.err || COOP.note; if (COOP.copied > 0 && COOP.copyFail) copyHint(c, fx, ty); else if (st) wrapDraw(c, st, fx, ty, fw, COOP.err ? '#ff9a8a' : '#7ddc6f');
  }
  drawText(c, 'You bring your own pack to their world; it is kept for next time.', fx, y + h - 34, '#8b8fa3');
  drawText(c, 'Best on the same Wi-Fi; most home internet works too.', fx, y + h - 24, '#8b8fa3');
  button(c, x + w - 70, y + h - 16, 60, 13, 'BACK', () => { COOP.long = false; coopLeave(); COOP.err = ''; sfx('ui'); });
}
function wrapDraw(c, s, x, y, w, col) { const words = String(s).split(' '); let line = '', yy = y; for (const wd of words) { const t = line ? line + ' ' + wd : wd; if (textW(t) > w && line) { drawText(c, line, x, yy, col); yy += 10; line = wd; } else line = t; } if (line) drawText(c, line, x, yy, col); }

// ---------------- moving a world between computers (or from the Mac app to a browser) as text ----------------
async function worldCopy(m) {
  G.state = 'wcopy'; COOP.wcode = ''; COOP.wname = m.name || 'World'; COOP.err = '';
  const data = await loadWorldData(m.id); if (!data) { COOP.err = 'That world could not be read.'; return; }
  COOP.wcode = await packCode({ k: 'w', v: 6, d: data });
}
async function worldPaste(text) {
  COOP.err = ''; const o = await unpackCode(text);
  if (!o || o.k !== 'w' || !o.d || typeof o.d !== 'object' || !isFinite(o.d.seed)) { COOP.err = "That isn't a world. Copy the whole text from the other game's COPY WORLD screen."; return; }
  const d = o.d; d.name = String(d.name || 'World').slice(0, 24);
  if (!d.id || typeof d.id !== 'string' || SAVE.list.some(l => l.id === d.id)) { d.id = Date.now().toString(36) + ((Math.random() * 46656) | 0).toString(36); d.name = (d.name + ' (copy)').slice(0, 24); }
  d.savedAt = Date.now(); if (!LS.set('ew2.w.' + d.id, JSON.stringify(d))) { COOP.err = 'There is no room left to keep that world in this browser.'; return; }
  const meta = { id: d.id, name: d.name, seed: d.seed, size: d.size | 0, shape: d.shape | 0, mode: d.mode ? 1 : 0, skin: d.skin | 0, e: d.e | 0, v: d.v | 0, endless: d.endless ? 1 : 0, savedAt: d.savedAt, played: d.played | 0 };
  SAVE.list.unshift(meta); sortWorlds(); writeLocalIndex(); G.state = 'worlds'; G.menuNote = ''; COOP.err = ''; G.worldNote = 'Added ' + d.name + '.'; sfx('quest', 0);
}
function drawWorldCopy(c) {
  const uw = VS.uw, uh = VS.uh, w = min(380, uw - 16), h = 176, x = round((uw - w) / 2), y = max(8, round((uh - h) / 2)), fx = x + 8, fw = w - 16;
  c.fillStyle = 'rgba(18,13,31,.55)'; c.fillRect(0, 0, uw, uh); panel(c, x, y, w, h, 'COPY A WORLD : ' + String(COOP.wname).toUpperCase().slice(0, 18));
  ['This text is the whole world: land, buildings, chests and your pack.', 'Copy it, then in the other game (or a browser) choose WORLDS,', 'PASTE A WORLD, and paste it there.'].forEach((l, i) => drawText(c, l, fx, y + 18 + i * 10, '#d8d4e6'));
  if (COOP.err) wrapDraw(c, COOP.err, fx, y + 54, fw, '#ff9a8a');
  else if (!COOP.wcode) drawText(c, 'Packing the world...', fx, y + 54, '#7ddc6f');
  else { domBox('wcode', fx, y + 52, fw, 80, { ro: true, val: COOP.wcode }); copyHint(c, fx, y + 135); button(c, fx, y + h - 20, 90, 14, copyLabel(), () => copyText(COOP.wcode, 'wcode')); drawText(c, COOP.wcode.length < 2048 ? COOP.wcode.length + ' letters' : round(COOP.wcode.length / 1024) + ' KB of text', fx + 100, y + h - 16, '#8b8fa3'); }
  button(c, x + w - 70, y + h - 20, 60, 14, 'BACK', () => { G.state = 'worlds'; COOP.wcode = ''; sfx('ui'); });
}
function drawWorldPaste(c) {
  const uw = VS.uw, uh = VS.uh, w = min(380, uw - 16), h = 176, x = round((uw - w) / 2), y = max(8, round((uh - h) / 2)), fx = x + 8, fw = w - 16;
  c.fillStyle = 'rgba(18,13,31,.55)'; c.fillRect(0, 0, uw, uh); panel(c, x, y, w, h, 'PASTE A WORLD');
  ['Paste a world copied with COPY in another game’s world list.', 'It is added to your worlds; nothing here is replaced.'].forEach((l, i) => drawText(c, l, fx, y + 18 + i * 10, '#d8d4e6'));
  domBox('wpaste', fx, y + 42, fw, 80, { ph: 'paste the world here' });
  if (COOP.err) wrapDraw(c, COOP.err, fx, y + 126, fw, '#ff9a8a');
  button(c, fx, y + h - 20, 110, 14, 'ADD THIS WORLD', () => worldPaste(domVal('wpaste')));
  button(c, x + w - 70, y + h - 20, 60, 14, 'BACK', () => { G.state = 'worlds'; COOP.err = ''; sfx('ui'); });
}
