// Test stand-in for claude.ai's live room: same calls (join, presence, onPeers, onConnection, connected, leave),
// carried between pages over a BroadcastChannel. Presence objects are frozen and replaced on change, like the real one.
(() => {
  const peerId = 'p' + Math.random().toString(36).slice(2, 10);
  function makeRoom(name) {
    const bc = new BroadcastChannel('mock-' + name), peers = new Map(), listeners = new Set();
    let mine = Object.freeze({}), pending = null, closed = false;
    const snap = () => { const a = [{ peer: peerId, by: null, isMe: true, sameTab: true, kind: 'viewer', guest: false, presence: mine, updatedAt: Date.now() }]; for (const [p, v] of peers) a.push({ peer: p, by: null, isMe: false, sameTab: false, kind: 'viewer', guest: false, presence: v.presence, updatedAt: v.updatedAt }); return Object.freeze(a); };
    const fire = () => { const s = snap(); for (const fn of listeners) fn({ peers: s, joined: [], left: [], updated: [] }); };
    bc.onmessage = e => { const m = e.data; if (closed) return; if (m.t === 'pres') { const had = peers.has(m.from); peers.set(m.from, { presence: Object.freeze(m.p), updatedAt: Date.now() }); fire(); if (!had) bc.postMessage({ t: 'pres', from: peerId, p: mine }); } else if (m.t === 'leave') { peers.delete(m.from); fire(); } };
    const R = {
      name,
      presence(patch) { mine = Object.freeze(Object.assign({}, mine, patch)); if (!pending) pending = setTimeout(() => { pending = null; if (!closed) { bc.postMessage({ t: 'pres', from: peerId, p: mine }); fire(); } }, 33); return Promise.resolve(); },
      onPeers(fn) { listeners.add(fn); setTimeout(() => fn({ peers: snap(), joined: [], left: [], updated: [] }), 0); return () => listeners.delete(fn); },
      onConnection(fn) { setTimeout(() => fn(true), 0); return () => { }; },
      connected: () => !closed, peers: snap, emit: () => Promise.resolve(), on: () => () => { },
      leave() { if (!closed) { bc.postMessage({ t: 'leave', from: peerId }); closed = true; bc.close(); } return Promise.resolve(); }
    };
    bc.postMessage({ t: 'pres', from: peerId, p: mine });
    window.__mockLeave = () => R.leave();
    return R;
  }
  window.claude = { use: n => Promise.resolve(n === 'room' ? { join: name => Promise.resolve(makeRoom(name)) } : null) };
})();
