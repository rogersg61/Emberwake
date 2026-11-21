// ============================================================
//  THE RELAY: the way through when two computers can't link directly.
//  Some networks (schools, offices, phone hotspots, some routers) won't
//  let two games connect straight to each other. Then everything the two
//  games say goes through the same public message boards the game codes
//  use: bundled ten times a second, squeezed, sealed with the code's key,
//  numbered, and sent again if a bundle goes missing. A little slower than
//  a direct line, but it gets through almost anywhere a web page can.
//  Each bundle goes to the friend's own mailbox on a board you both reach.
// ============================================================
const RLY_MS = 100, RLY_RAW = 20000, RLY_WIN = 40, RLY_AFTER = 3500;
const RLY_ROOM = { ms: 170, raw: 7000, win: 6 };
const rlyZ = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';
const dcOpen = P => !!(P && P.dc && P.dc.readyState === 'open');
const linkUp = P => dcOpen(P) || !!(P && P.relay);
// can play together at all from this window: a direct line, or the boards
const netOK = () => rtcOK() || typeof WebSocket === 'function' || !!NET.room;

// can this friend be reached through the boards? (we must share the game code)
function rlyCan(P) {
  if (!P || !SIG.code || COOP.peers.get(P.id) !== P) return false;
  return netGuest() ? SIG.role === 'guest' && P.id === 'h' : SIG.role === 'host' && !!P.sig && SIG.guests.get(P.sig) === P;
}
// the direct line failed or broke: carry on through the relay if we can
function rlyFallback(P) {
  if (P.relay) { P.rT0 = performance.now(); P.rHeard = 0; return true; } // the relay carries on; they have a few seconds to show up on it
  if (!rlyCan(P)) return false;
  if (netGuest() || P.ok) return rlyBegin(P);
  return true; // a friend still coming in: their game starts the relay, we wait for it
}
function rlyBegin(P) {
  if (P.relay) return true; if (!rlyCan(P)) return false; const now = performance.now();
  Object.assign(P, { relay: true, rid: netGuest() ? 'h' : P.sig, rq: [], rqK: [], rqs: 0, rs: 0, rw: new Map(), ra: 0, rb: new Map(), rack: 0, rlast: 0, rbusy: false, rAckF: '', rto: 1500, srtt: 0, rT0: now, rHeard: 0 });
  P.open = true; P.heard = now;
  if (netGuest() && !P.ok) sendTo(P, { t: 'hello', v: NETV, n: coopName(), sk: G.skin | 0 });
  return true;
}
// what goes out waits here for the next bundle; a newer "where I am" replaces an older one
function rlyQueue(P, s, key) {
  if (key) { const i = P.rqK.indexOf(key); if (i >= 0) { P.rqs += s.length - P.rq[i].length; P.rq[i] = s; return; } }
  P.rq.push(s); P.rqK.push(key || ''); P.rqs += s.length;
  if (P.rqs > 4e6) { chatLine('', 'The line to ' + P.name + ' is too slow to keep up.', '#ff9a8a'); coopLost(P); }
}
// header: 1, flags, who I am, bundle number, the last bundle of theirs I have in order, which boards I reach
function rlyHead(P, seq, fl, body) {
  const me = sigTxt(netGuest() ? SIG.myId : 'h'), n = body ? body.length : 0, u = new Uint8Array(13 + me.length + n), dv = new DataView(u.buffer);
  u[0] = 1; u[1] = fl; u[2] = me.length; u.set(me, 3); const o = 3 + me.length;
  dv.setUint32(o, seq); dv.setUint32(o + 4, P.ra); dv.setUint16(o + 8, sigMask()); if (body) u.set(body, o + 10); return u;
}
function rlyBuild(P, raw) {
  let n = 0, len = 0; while (n < P.rq.length && (n === 0 || len + P.rq[n].length + 1 <= raw)) len += P.rq[n++].length + 1;
  const msgs = P.rq.splice(0, n); P.rqK.splice(0, n); P.rqs = max(0, P.rqs - (len - n));
  const seq = ++P.rs, body = sigTxt(msgs.join('\n')), z = P.rz && rlyZ() && body.length > 200; P.rbusy = true; P.rlast = performance.now();
  const put = (b, fl) => {
    if (COOP.peers.get(P.id) !== P) return; P.rack = P.ra; const u = rlyHead(P, seq, fl, b), t = performance.now();
    const F = { u, b: sigSealU(u), t, t0: t, n: 0 }; P.rw.set(seq, F); rlyPut(P, F.b);
  };
  (z ? zipBytes(body, true).then(b => put(b, 1), () => put(body, 0)) : Promise.resolve().then(() => put(body, 0))).finally(() => { P.rbusy = false; });
}
// the relay is clear and the direct line is up: what waited goes now, in order
function rlyHoldFlush(P, force) {
  const H = P.hold; P.hold = null; if (!H) return;
  let i = 0; try { for (; i < H.length; i++) P.dc.send(H[i]); } catch (e) { for (; i < H.length; i++) rlyQueue(P, H[i], ''); }
}
// the window is closing: whatever is waiting goes now, plainly, without waiting for the next bundle
function rlyFlushSync() {
  for (const P of COOP.peers.values()) if (P.relay && P.rq.length && !SIG.room) { const msgs = P.rq.splice(0); P.rqK.length = 0; P.rqs = 0; rlyPut(P, sigSealU(rlyHead(P, ++P.rs, 0, sigTxt(msgs.join('\n'))))); }
}
// a sealed bundle on its way: to the friend's mailbox on (up to) two boards you both reach
function rlyPut(P, b) {
  if (SIG.room) { SIG.roomDirty = true; return; }
  const topic = SIG.topic + '/' + P.rid; let n = 0;
  if (P.bm) for (const C of SIG.conns) if (C.ok && (P.bm >> C.i) & 1) { C.pubTo(topic, b); if (++n >= 2) return; }
  if (!n) for (const C of SIG.conns) if (C.ok) { C.pubTo(topic, b); if (++n >= 2) return; }
}
function rlyTick(now) {
  const room = !!SIG.room, ms = room ? RLY_ROOM.ms : RLY_MS, win = room ? RLY_ROOM.win : RLY_WIN;
  for (const P of COOP.peers.values()) {
    if (!P.relay) continue;
    if (P.hold && P.hold.length && dcOpen(P) && !P.rq.length && !P.rw.size && !P.rbusy) rlyHoldFlush(P);
    // a friend who fell back to the relay but never answered on it is gone
    if (!P.rHeard && !dcOpen(P) && now - P.rT0 > 9000 && P.ok) { coopLost(P); continue; }
    // bundles not confirmed in time go again (sealed afresh, with the newest "got it" inside)
    if (!room) for (const F of P.rw.values()) if (now - F.t > P.rto) { F.t = now; F.n++; new DataView(F.u.buffer).setUint32(3 + F.u[2] + 4, P.ra); F.b = sigSealU(F.u); rlyPut(P, F.b); P.rack = max(P.rack, P.ra); }
    if (P.rq.length && !P.rbusy && P.rw.size < win && now - P.rlast >= ms) rlyBuild(P, room ? RLY_ROOM.raw : RLY_RAW);
    // nothing to say, but they should hear that their bundles arrived
    else if (P.ra > P.rack && !P.rbusy && now - P.rlast >= 220) { P.rack = P.ra; P.rlast = now; const b = sigSealU(rlyHead(P, 0, 0, null)); if (room) { P.rAckF = b; SIG.roomDirty = true; } else rlyPut(P, b); }
  }
}
// a bundle arrived (already unsealed)
function rlyIn(u) {
  if (u.length < 13) return; const L = u[2]; if (u.length < 13 + L) return;
  const from = new TextDecoder().decode(u.subarray(3, 3 + L)), dv = new DataView(u.buffer, u.byteOffset, u.byteLength), o = 3 + L;
  const seq = dv.getUint32(o), ack = dv.getUint32(o + 4), bm = dv.getUint16(o + 8), fl = u[1], body = u.slice(o + 10);
  let P = null;
  if (SIG.role === 'host') { const Q = SIG.guests.get(from); if (Q && COOP.peers.get(Q.id) === Q) P = Q; }
  else if (SIG.role === 'guest' && from === 'h') P = COOP.peers.get('h') || null;
  if (!P || (!P.relay && !rlyBegin(P))) return;
  const now = performance.now(); P.heard = P.rHeard = now; if (bm) P.bm = bm;
  // what they have of ours
  let freed = false; for (const [s, F] of P.rw) if (s <= ack) { if (!F.n) rlyRtt(P, now - F.t0); P.rw.delete(s); freed = true; }
  if (freed && SIG.room) SIG.roomDirty = true;
  if (!seq) return;
  if (seq <= P.ra || P.rb.has(seq)) { P.rack = min(P.rack, P.ra - 1); return; } // they sent it again: say "got it" again
  if (seq > P.ra + 600) return;
  P.rb.set(seq, null);
  const done = msgs => { if (COOP.peers.get(P.id) !== P) return; P.rb.set(seq, msgs); rlyDrain(P); };
  if (fl & 1) zipBytes(body, false).then(b => done(rlySplit(b)), () => done([])); else done(rlySplit(body));
}
function rlySplit(b) { const s = new TextDecoder().decode(b); return s ? s.split('\n') : []; }
// bundles are read strictly in order, so nothing is ever applied twice or out of turn
function rlyDrain(P) {
  while (P.rb.get(P.ra + 1)) {
    const msgs = P.rb.get(P.ra + 1); P.rb.delete(++P.ra);
    for (const s of msgs) { try { onRaw(P, s); } catch (e) { console.warn('relay', e); } if (COOP.peers.get(P.id) !== P) return; }
  }
}
function rlyRtt(P, ms) { P.srtt = P.srtt ? P.srtt * .8 + ms * .2 : ms; P.rto = clamp(P.srtt * 2 + 250, 900, 5000); }
// how a friend is connected, for the people list
function linkTag(P) {
  if (!P) return ''; const k = dcOpen(P) ? 'direct' : P.relay ? 'relay' : 'connecting';
  return P.rtt ? k + ', ' + round(P.rtt) + 'ms' : k;
}
// quick pings, so everyone can see how good each line is
function pingTick(now) {
  for (const P of COOP.peers.values()) if (P.ok && !P.ghostPeer && linkUp(P) && now - (P.pingT || 0) > 2000) { P.pingT = now; sendTo(P, { t: 'pi', k: round(now) }); }
}
