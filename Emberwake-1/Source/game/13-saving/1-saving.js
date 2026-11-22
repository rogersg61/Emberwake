// ============================================================
//  Worlds: create, list, load, save, delete.
//  Saves go to this browser right away, and to the player's own
//  private space in the page's store when the page can reach it
//  (so worlds follow you between devices). Nobody else can read it.
// ============================================================
const SAVE = { db: null, uid: null, list: [], busy: false, pending: null, status: 'local', note: '' };
const ACCOUNT = { profiles: [], active: null, form: 'list', note: '', loginId: null, busy: false };
const FRIENDS = { note: '' };
const COSMETICS = [
  { type: 'skin', id: 0, name: 'ASH', price: 0 }, { type: 'skin', id: 1, name: 'EMBER', price: 30 },
  { type: 'skin', id: 2, name: 'TIDE', price: 50 }, { type: 'skin', id: 3, name: 'MOSS', price: 70 },
  { type: 'skin', id: 4, name: 'FROST', price: 100 }, { type: 'skin', id: 5, name: 'DUSK', price: 120 },
  { type: 'hat', id: 0, name: 'NO HAT', price: 0 }, { type: 'hat', id: 1, name: 'EMBER HAT', price: 20 },
  { type: 'hat', id: 2, name: 'CROWN', price: 40 }, { type: 'hat', id: 3, name: 'FROST HAT', price: 60 }
];
const ACHIEVEMENTS = [
  { id: 'first_world', name: 'A Place to Begin', desc: 'Save your first world.', coins: 15 },
  { id: 'hunter_10', name: 'Husk Breaker', desc: 'Defeat 10 creatures.', coins: 20 },
  { id: 'hunter_50', name: 'Seasoned Hunter', desc: 'Defeat 50 creatures.', coins: 40 },
  { id: 'warden', name: 'First Ember', desc: 'Defeat the Ashen Warden.', coins: 30 },
  { id: 'three_embers', name: 'All Three Embers', desc: 'Claim all three embers.', coins: 65 },
  { id: 'maker', name: 'First Craft', desc: 'Make an item.', coins: 20 },
  { id: 'explorer', name: 'Farther Afield', desc: 'Find eight places.', coins: 20 },
  { id: 'friend', name: 'Friend Keeper', desc: 'Save a friend code.', coins: 15 }
];
const LS = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { } }
};
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej({ code: 'timeout' }), ms))]);
const accountId = () => ACCOUNT.active ? ACCOUNT.active.id : 'none';
const dpath = (k, owner = accountId()) => 'data/users/' + SAVE.uid + '/accounts/' + owner + '/' + k;
const profileKey = k => 'ew2.p.' + accountId() + '.' + k;
const profilePath = (id, k) => 'ew2.p.' + id + '.' + k;
function readAccountProfiles() { try { const a = JSON.parse(LS.get('ew2.accounts') || '[]'); return Array.isArray(a) ? a.filter(p => p && typeof p.id === 'string' && typeof p.name === 'string') : []; } catch (e) { return []; } }
function writeAccountProfiles() { return LS.set('ew2.accounts', JSON.stringify(ACCOUNT.profiles)); }
function accountBoot() {
  ACCOUNT.profiles = readAccountProfiles();
  ACCOUNT.active = null; ACCOUNT.loginId = null; ACCOUNT.form = 'list'; ACCOUNT.note = ''; ACCOUNT.busy = false;
  LS.del('ew2.active');
  G.nick = 'WAKER'; G.skin = 0; G.hat = 0; SAVE.list = [];
}
function cleanAccountName(s) { s = String(s || '').trim().replace(/[^A-Za-z0-9 _-]/g, '').slice(0, 18); return s; }
function accountSalt() {
  if (!crypto || !crypto.getRandomValues) throw new Error('Secure password storage is unavailable in this browser.');
  return [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function accountPasswordHash(password, saltHex) {
  if (!crypto || !crypto.subtle || !window.TextEncoder) throw new Error('Secure password storage is unavailable in this browser.');
  const salt = Uint8Array.from(saltHex.match(/../g), b => parseInt(b, 16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, key, 256);
  return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function accountPasswordValid(password, confirm) {
  if (String(password || '').length < 8) { ACCOUNT.note = 'Use a password with at least 8 characters.'; return false; }
  if (password !== confirm) { ACCOUNT.note = 'Those passwords do not match.'; return false; }
  return true;
}
function migrateGuestWorlds() {
  const oldIndex = LS.get(profilePath('guest', 'index')) || LS.get('ew2.index');
  if (!oldIndex || LS.get(profilePath(accountId(), 'index')) !== null) return;
  let worlds;
  try { worlds = JSON.parse(oldIndex); } catch (e) { return; }
  if (!Array.isArray(worlds)) return;
  SAVE.list = worlds.filter(m => m && typeof m.id === 'string');
  for (const m of SAVE.list) {
    const raw = LS.get(profilePath('guest', 'w.' + m.id)) || LS.get('ew2.w.' + m.id);
    if (raw !== null && LS.get(profilePath(accountId(), 'w.' + m.id)) === null) LS.set(profilePath(accountId(), 'w.' + m.id), raw);
  }
  writeLocalIndex(); sortWorlds();
}
async function accountCreate(name, password, confirm, skin, hat) {
  name = cleanAccountName(name);
  if (!name) { ACCOUNT.note = 'Enter an account name.'; return false; }
  if (ACCOUNT.profiles.some(p => p.name.toLowerCase() === name.toLowerCase())) { ACCOUNT.note = 'That account name is already in use.'; return false; }
  if (!accountPasswordValid(password, confirm)) return false;
  if (ACCOUNT.busy) return false;
  ACCOUNT.busy = true; ACCOUNT.note = '';
  try {
    const salt = accountSalt(), hash = await accountPasswordHash(password, salt);
    const firstAccount = !ACCOUNT.profiles.some(p => p.id !== 'guest');
    const p = { id: Date.now().toString(36) + ((Math.random() * 46656) | 0).toString(36), name, skin: clamp(skin | 0, 0, 5), hat: clamp(hat | 0, 0, 3), salt, hash };
    ACCOUNT.profiles.push(p);
    if (!writeAccountProfiles()) { ACCOUNT.profiles.pop(); ACCOUNT.note = 'Could not save this account in this browser.'; return false; }
    accountSwitch(p.id);
    if (firstAccount) migrateGuestWorlds();
    ACCOUNT.note = 'Account created. Saves stay in this browser unless cloud saving is available.';
    G.state = 'title'; ACCOUNT.form = 'list'; ACCOUNT.loginId = null;
    return true;
  } catch (e) {
    ACCOUNT.note = e && e.message ? e.message : 'Could not create the account.';
    return false;
  } finally { ACCOUNT.busy = false; }
}
function accountSwitch(id) {
  const p = ACCOUNT.profiles.find(v => v.id === id); if (!p) return false;
  p.coins = max(0, p.coins | 0);
  p.ownedSkins = Array.isArray(p.ownedSkins) ? p.ownedSkins.filter(n => Number.isInteger(n) && n >= 0 && n < SKINS.length) : [clamp(p.skin | 0, 0, SKINS.length - 1)];
  p.ownedHats = Array.isArray(p.ownedHats) ? p.ownedHats.filter(n => Number.isInteger(n) && n >= 0 && n <= 3) : [clamp(p.hat | 0, 0, 3)];
  p.ownedSkins = [...new Set([...p.ownedSkins, clamp(p.skin | 0, 0, SKINS.length - 1)])];
  p.ownedHats = [...new Set([...p.ownedHats, clamp(p.hat | 0, 0, 3)])];
  p.achievements = Array.isArray(p.achievements) ? p.achievements.filter(id => ACHIEVEMENTS.some(a => a.id === id)) : [];
  p.worldKills = p.worldKills && typeof p.worldKills === 'object' ? p.worldKills : {};
  p.lifetimeKills = max(0, p.lifetimeKills | 0);
  ACCOUNT.active = p; LS.del('ew2.active'); G.nick = p.name; G.skin = clamp(p.skin | 0, 0, 5); G.hat = clamp(p.hat | 0, 0, 3);
  if (FORM) { FORM.nick = p.name; FORM.skin = G.skin; FORM.hat = G.hat; }
  SAVE.list = readLocalIndex(); sortWorlds(); ACCOUNT.note = 'Logged in as ' + p.name + '.';
  writeAccountProfiles();
  saveBoot();
  return true;
}
async function accountSetPassword(p, password, confirm) {
  if (!p || !accountPasswordValid(password, confirm) || ACCOUNT.busy) return false;
  ACCOUNT.busy = true; ACCOUNT.note = '';
  try {
    p.salt = accountSalt(); p.hash = await accountPasswordHash(password, p.salt); delete p.pin;
    if (!writeAccountProfiles()) { delete p.salt; delete p.hash; ACCOUNT.note = 'Could not save this account in this browser.'; return false; }
    accountSwitch(p.id); G.state = 'title'; ACCOUNT.form = 'list'; return true;
  } catch (e) {
    ACCOUNT.note = e && e.message ? e.message : 'Could not set the account password.';
    return false;
  } finally { ACCOUNT.busy = false; }
}
async function accountLogin(p, password) {
  if (!p || ACCOUNT.busy) return false;
  if (!p.salt || !p.hash) { ACCOUNT.note = 'Set a password for this older account to continue.'; return false; }
  ACCOUNT.busy = true; ACCOUNT.note = '';
  try {
    const hash = await accountPasswordHash(String(password || ''), p.salt);
    if (hash !== p.hash) { ACCOUNT.note = 'Wrong password.'; return false; }
    accountSwitch(p.id); G.state = 'title'; ACCOUNT.form = 'list'; return true;
  } catch (e) {
    ACCOUNT.note = e && e.message ? e.message : 'Could not log in.';
    return false;
  } finally { ACCOUNT.busy = false; }
}
async function accountLoginByName(name, password) {
  const username = cleanAccountName(name);
  if (!username) { ACCOUNT.note = 'Enter your username.'; return false; }
  const p = ACCOUNT.profiles.find(v => v.name.toLowerCase() === username.toLowerCase());
  if (!p) { ACCOUNT.note = 'That username is not saved in this browser. Online accounts are not set up yet.'; return false; }
  return accountLogin(p, password);
}
function accountLogout() {
  if (G.state === 'play' && WORLD.id && !WORLD.arena) saveWorld(true);
  if (COOP.role) coopLeave();
  ACCOUNT.active = null; ACCOUNT.loginId = null; ACCOUNT.form = 'list'; ACCOUNT.note = 'Signed out.';
  SAVE.list = []; LS.del('ew2.active');
  G.state = 'accounts'; UI.open = null; UI.focus = null; UI.held = null;
}
function accountSaveProfile() {
  if (!ACCOUNT.active) return;
  ACCOUNT.active.skin = G.skin; ACCOUNT.active.hat = G.hat; ACCOUNT.active.name = G.nick || ACCOUNT.active.name;
  return writeAccountProfiles();
}
function cosmeticOwned(type, id, profile = ACCOUNT.active) {
  if (!profile) return false;
  return ((type === 'skin' ? profile.ownedSkins : profile.ownedHats) || []).includes(id);
}
function cosmeticBuy(type, id) {
  const item = COSMETICS.find(c => c.type === type && c.id === id), p = ACCOUNT.active;
  if (!p || !item) { ACCOUNT.note = 'Sign in to use the customization shop.'; return false; }
  if (cosmeticOwned(type, id, p)) { ACCOUNT.note = 'You already own that look.'; return false; }
  if (p.coins < item.price) { ACCOUNT.note = 'You need ' + (item.price - p.coins) + ' more coins.'; return false; }
  const owned = type === 'skin' ? p.ownedSkins : p.ownedHats, oldCoins = p.coins;
  p.coins -= item.price; owned.push(id);
  if (!writeAccountProfiles()) { p.coins = oldCoins; owned.pop(); ACCOUNT.note = 'Could not save your purchase in this browser.'; return false; }
  ACCOUNT.note = 'Bought ' + item.name + '. Equip it from the customization hub.';
  return true;
}
function cosmeticEquip(type, id) {
  const p = ACCOUNT.active;
  if (!p || !cosmeticOwned(type, id, p)) { ACCOUNT.note = 'You do not own that look yet.'; return false; }
  const key = type === 'skin' ? 'skin' : type === 'hat' ? 'hat' : '';
  if (!key) return false;
  const previous = p[key], gamePrevious = G[key];
  p[key] = id; G[key] = id; if (G.p) G.p[key] = id;
  if (!accountSaveProfile()) { p[key] = previous; G[key] = gamePrevious; if (G.p) G.p[key] = gamePrevious; ACCOUNT.note = 'Could not save your equipped look in this browser.'; return false; }
  ACCOUNT.note = 'Equipped ' + COSMETICS.find(c => c.type === type && c.id === id).name + '.';
  return true;
}
function checkAchievements() {
  const p = ACCOUNT.active;
  if (!p) return [];
  p.coins = max(0, p.coins | 0);
  p.achievements = Array.isArray(p.achievements) ? p.achievements : [];
  p.worldKills = p.worldKills && typeof p.worldKills === 'object' ? p.worldKills : {};
  p.lifetimeKills = max(0, p.lifetimeKills | 0);
  const world = WORLD && WORLD.id && !WORLD.guest && !WORLD.arena;
  let progressChanged = false;
  const previousLifetimeKills = p.lifetimeKills;
  let previousWorldKills = 0;
  if (world) {
    const kills = max(0, G.kills | 0), prior = max(0, p.worldKills[WORLD.id] | 0);
    previousWorldKills = prior;
    if (kills > prior) { p.lifetimeKills += kills - prior; p.worldKills[WORLD.id] = kills; progressChanged = true; }
  }
  const checks = {
    first_world: SAVE.list.length > 0,
    hunter_10: p.lifetimeKills >= 10,
    hunter_50: p.lifetimeKills >= 50,
    warden: !!(world && G.flags && G.flags.wardenDead),
    three_embers: !!(world && G.flags && G.flags.dbl && G.flags.e2 && G.flags.e3),
    maker: !!(world && G.flags && G.flags.madeThing),
    explorer: !!(world && G.found && G.found.size >= 8),
    friend: friendList().length > 0
  };
  const earned = [];
  for (const a of ACHIEVEMENTS) if (checks[a.id] && !p.achievements.includes(a.id)) {
    p.achievements.push(a.id); p.coins += a.coins; earned.push(a);
  }
  if (earned.length || progressChanged) {
    const total = earned.reduce((n, a) => n + a.coins, 0);
    if (!writeAccountProfiles()) {
      p.achievements = p.achievements.filter(id => !earned.some(a => a.id === id));
      p.coins -= total;
      p.lifetimeKills = previousLifetimeKills;
      if (world) { if (previousWorldKills) p.worldKills[WORLD.id] = previousWorldKills; else delete p.worldKills[WORLD.id]; }
      ACCOUNT.note = 'Could not save achievement progress in this browser.';
      if (G.state === 'play') G.banner = { text: 'SAVE FAILED', sub: 'achievement progress could not be saved', t: 0 };
      return [];
    }
    if (earned.length) {
      ACCOUNT.note = 'Achievement unlocked: ' + earned.map(a => a.name).join(', ') + ' (+' + total + ' coins).';
      if (G.state === 'play') G.banner = { text: 'ACHIEVEMENT', sub: earned[0].name + '  +' + total + ' COINS', t: 0 };
    }
  }
  return earned;
}
function friendList() {
  if (!ACCOUNT.active) return [];
  try {
    const saved = JSON.parse(LS.get(profileKey('friends')) || '[]');
    return Array.isArray(saved) ? saved.filter(f => f && typeof f.name === 'string' && typeof f.code === 'string') : [];
  } catch (e) { return []; }
}
function friendAdd(name, code) {
  if (!ACCOUNT.active) { FRIENDS.note = 'Sign in to save friends to this profile.'; return false; }
  name = cleanAccountName(name);
  code = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!name) { FRIENDS.note = 'Enter your friend name.'; return false; }
  if (code.length !== 6) { FRIENDS.note = 'A world code has six letters and numbers.'; return false; }
  const friends = friendList(), i = friends.findIndex(f => f.code === code);
  if (i >= 0) friends[i].name = name;
  else friends.push({ name, code });
  if (!LS.set(profileKey('friends'), JSON.stringify(friends))) { FRIENDS.note = 'Could not save this friend in this browser.'; return false; }
  FRIENDS.note = i >= 0 ? 'Updated ' + name + '.' : 'Added ' + name + '.';
  checkAchievements();
  if (ACCOUNT.note.startsWith('Could not save achievement')) FRIENDS.note = ACCOUNT.note;
  return true;
}
function friendRemove(code) {
  if (!ACCOUNT.active) { FRIENDS.note = 'Sign in to manage saved friends.'; return false; }
  const friends = friendList().filter(f => f.code !== code);
  if (!LS.set(profileKey('friends'), JSON.stringify(friends))) { FRIENDS.note = 'Could not update saved friends in this browser.'; return false; }
  FRIENDS.note = 'Friend removed.';
  return true;
}
function readLocalIndex() {
  try {
    const own = LS.get(profileKey('index'));
    const raw = own !== null ? own : (accountId() === 'guest' ? LS.get('ew2.index') : null);
    const a = JSON.parse(raw || '[]'); return Array.isArray(a) ? a.filter(m => m && typeof m.id === 'string') : [];
  } catch (e) { return []; }
}
function writeLocalIndex() { LS.set(profileKey('index'), JSON.stringify(SAVE.list)); }
function saveBoot() {
  if (!ACCOUNT.active) return;
  const owner = accountId();
  SAVE.list = readLocalIndex(); sortWorlds();
  try {
    if (!(window.claude && window.claude.use)) return;
    Promise.all([window.claude.use('user'), window.claude.use('db')]).then(async ([user, db]) => {
      if (!user || !db) return; const uid = await user.id(); if (!uid) return;
      SAVE.db = db; SAVE.uid = uid; SAVE.status = 'syncing';
      try {
        const snap = await withTimeout(db.doc(dpath('index', owner)).get(), 9000);
        if (accountId() !== owner) return;
        const remote = snap && snap.exists && Array.isArray((snap.data() || {}).worlds) ? snap.data().worlds : [];
        for (const m of remote) { if (!m || typeof m.id !== 'string') continue; const i = SAVE.list.findIndex(l => l.id === m.id); if (i < 0) SAVE.list.push(Object.assign({}, m, { cloud: true })); else if ((m.savedAt || 0) > (SAVE.list[i].savedAt || 0)) SAVE.list[i] = Object.assign({}, m, { cloud: true }); else SAVE.list[i].cloud = true; }
        sortWorlds(); writeLocalIndex(); SAVE.status = 'cloud';
      } catch (e) { if (accountId() === owner) SAVE.status = 'cloud'; }
    }, () => { });
  } catch (e) { }
}
function sortWorlds() { SAVE.list.sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)); }
function worldMeta() { return { id: WORLD.id, name: WORLD.name, seed: WORLD.seed, size: WORLD.size, shape: WORLD.shape, mode: WORLD.mode, skin: G.skin, hat: G.hat, e: embers(), v: 6, endless: 1, savedAt: Date.now(), played: round(G.played), kills: G.kills | 0, gcode: WORLD.gcode || '', gen: WORLD.gen || 1 }; }
function snapshotWorld() {
  const p = G.p;
  return Object.assign(worldMeta(), {
    v: 6, endless: 1, gen: 2, legacy: WORLD.legacy || {}, lairs: [...(G.lairs || [])], bless: G.bless && G.bless.t > 0 ? [G.bless.k, round(G.bless.t)] : 0, blessUsed: blessKeep(), dim: DIM, dims: Object.assign({}, DSTASH), echoes: [...(G.echoes || [])], beasts: G.beasts || {}, mods: [encodeMods(), encodeChips(), encodeIdx(PLACED), encodePairs(WMODS), encodeSeen()].join('|'), inv: inv.slice(0, INV_N).map(s => s ? [s.id, s.n] : 0),
    food: r1(G.food), worn: [...(G.worn || [])], gear: GEAR_SLOTS.map(s => G.gear && G.gear[s] ? G.gear[s].id : ''), off: G.gear && G.gear.off ? G.gear.off.id : '', mast: G.mast || {}, fight: fightSave(), boons: trinkSave(), pairs: [...(G.pairsKnown || [])], quality: G.quality || {}, reqs: G.reqs || [], stn: encodeStn(), wake: G.respawn ? 1 : 0, p: { x: r1(p.x), y: r1(p.y), hp: max(1, round(p.hp)), arm: p.arm || '' }, flags: G.flags, journal: G.journal,
    known: [...G.known], used: [...G.movesUsed], clock: r2(G.clock), deaths: G.deaths || 0, kills: G.kills || 0,
    leads: [...G.leads], pin: G.pin || '', found: [...G.found], links: [...G.linksKnown], respawn: G.respawn ? [G.respawn.x, G.respawn.y] : 0
  });
}
function saveWorld(quiet) {
  if (WORLD.arena || WORLD.guest || !WORLD.id || (G.state !== 'play' && G.state !== 'intro') || !G.p) return;
  const data = snapshotWorld(), meta = worldMeta();
  const okLocal = LS.set(profileKey('w.' + WORLD.id), JSON.stringify(data));
  const i = SAVE.list.findIndex(m => m.id === WORLD.id); if (i < 0) SAVE.list.unshift(meta); else SAVE.list[i] = Object.assign(SAVE.list[i], meta);
  sortWorlds(); writeLocalIndex(); G.dirty = false; G.saveT = 0;
  checkAchievements();
  if (SAVE.db) { SAVE.pending = { data, owner: accountId(), worlds: SAVE.list.map(m => Object.assign({}, m)) }; if (!SAVE.busy) pumpSaves(); }
  if (!quiet) G.savedNote = { t: 0, ok: okLocal || !!SAVE.db };
}
async function pumpSaves() {
  SAVE.busy = true;
  while (SAVE.pending && SAVE.db) {
    const pending = SAVE.pending, data = pending.data, owner = pending.owner; SAVE.pending = null;
    try {
      const mods = data.mods || '', parts = []; for (let i = 0; i < mods.length; i += 180000) parts.push(mods.slice(i, i + 180000));
      for (let k = 0; parts.length > 1 && k < parts.length; k++) await withTimeout(SAVE.db.doc(dpath('w-' + data.id + '-m' + k, owner)).set({ s: parts[k] }), 15000);
      await withTimeout(SAVE.db.doc(dpath('w-' + data.id, owner)).set(Object.assign({}, data, { mods: parts.length > 1 ? '' : mods, mparts: parts.length > 1 ? parts.length : 0 })), 15000);
      const m = pending.worlds.find(l => l.id === data.id); if (m) m.cloud = true;
      await withTimeout(SAVE.db.doc(dpath('index', owner)).set({ worlds: pending.worlds.map(l => { const c = Object.assign({}, l); delete c.cloud; return c; }) }), 15000);
      if (accountId() === owner) SAVE.status = 'cloud';
    } catch (e) {
      const c = e && e.code; if (accountId() === owner) SAVE.status = c === 'quota_exceeded' ? 'cloud full' : 'local';
      if (c === 'invalid_argument' || c === 'revoked' || c === 'not_granted' || c === 'quota_exceeded') SAVE.db = null;
    }
  }
  SAVE.busy = false;
}
async function loadWorldData(id) {
  const owner = accountId();
  let local = null;
  try {
    const own = LS.get(profileKey('w.' + id));
    const raw = own !== null ? own : (accountId() === 'guest' ? LS.get('ew2.w.' + id) : null);
    local = JSON.parse(raw || 'null');
  } catch (e) { }
  let remote = null;
  if (SAVE.db) {
    try {
      const s = await withTimeout(SAVE.db.doc(dpath('w-' + id, owner)).get(), 9000);
      if (s && s.exists) {
        remote = Object.assign({}, s.data());
        if (remote.mparts > 0) { let m = ''; for (let k = 0; k < remote.mparts; k++) { const ps = await withTimeout(SAVE.db.doc(dpath('w-' + id + '-m' + k, owner)).get(), 9000); m += ps && ps.exists ? (ps.data().s || '') : ''; } remote.mods = m; }
      }
    } catch (e) { }
  }
  return remote && (!local || (remote.savedAt || 0) > (local.savedAt || 0)) ? remote : local;
}
function deleteWorld(id) {
  const owner = accountId();
  const m = SAVE.list.find(l => l.id === id); SAVE.list = SAVE.list.filter(l => l.id !== id); writeLocalIndex(); LS.del(profileKey('w.' + id)); if (accountId() === 'guest') LS.del('ew2.w.' + id);
  const worlds = SAVE.list.map(l => Object.assign({}, l));
  if (SAVE.db && m) (async () => {
    try {
      const s = await withTimeout(SAVE.db.doc(dpath('w-' + id, owner)).get(), 9000); const n = s && s.exists ? (s.data().mparts || 0) : 0;
      for (let k = 0; k < n; k++) await SAVE.db.doc(dpath('w-' + id + '-m' + k, owner)).delete();
      await SAVE.db.doc(dpath('w-' + id, owner)).delete();
      await SAVE.db.doc(dpath('index', owner)).set({ worlds: worlds.map(l => { const c = Object.assign({}, l); delete c.cloud; return c; }) });
    } catch (e) { }
  })();
}
function seedFrom(text) {
  const t = String(text || '').trim(); if (!t) return (Math.random() * 1e9) | 0;
  if (/^\d{1,9}$/.test(t)) return +t; let h = 2166136261; for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 1e9;
}
const FORGE_KIT_OLD = ['sword', 'spear', 'fangs', 'maul', 'bow', 'nunchaku', 'pick2', 'torch', 'plank', 'brick', 'platform', 'dirt', 'stone', 'sandstone', 'snow', 'sand', 'ash', 'deepstone', 'bench', 'furnace', 'salve', 'kblade', 'kmaul', 'vpike', 'vfangs', 'shuriken', 'hook', 'flask', 'smoke'];
function createWorld(o) {
  Object.assign(WORLD, { id: Date.now().toString(36) + ((Math.random() * 46656) | 0).toString(36), name: o.name || 'Aldermere', seed: seedFrom(o.seed), size: o.size, shape: o.shape, mode: o.mode, arena: false });
  G.skin = o.skin; G.hat = o.hat || 0; accountSaveProfile(); startWorld(null);
}
async function openWorld(meta) {
  G.state = 'loading'; G.loadMsg = 'Opening ' + meta.name + '...';
  const data = await loadWorldData(meta.id);
  if (!data) { SAVE.list = SAVE.list.filter(l => l.id !== meta.id); writeLocalIndex(); G.state = 'worlds'; G.menuNote = 'That world could not be found.'; return; }
  Object.assign(WORLD, { id: data.id, name: data.name, seed: data.seed | 0, size: clamp(data.size | 0, 0, 2), shape: clamp(data.shape | 0, 0, 2), mode: data.mode ? 1 : 0, arena: false });
  G.skin = clamp(data.skin | 0, 0, 5); G.hat = clamp(data.hat | 0, 0, 3); accountSaveProfile(); startWorld(data);
}
function startWorld(data) {
  G.state = 'loading'; G.loadMsg = data ? 'Rebuilding ' + WORLD.name + '...' : 'Forging ' + WORLD.name + '...';
  setTimeout(() => {
    // a saved world keeps the land it was made with; a new one gets the wider lands
    WORLD.gen = data ? (data.gen | 0) || 1 : 2;
    netLeave(); if (COOP.role) coopLeave(); WORLD.guest = false; SEED = WORLD.seed; initEndless(); fixLeadTexts(); freshSession(); for (const k in DSTASH) delete DSTASH[k];
    // the world's game code stays the same from one session to the next, so friends can come back with it
    WORLD.gcode = data && typeof data.gcode === 'string' && /^[A-HJ-NP-Z2-9]{6}$/.test(data.gcode) ? data.gcode : '';
    // new places only grow where a world made before them had not yet been
    WORLD.legacy = !data ? {} : (data.gen | 0) >= 2 ? cleanLegacy(data.legacy) : legacyOf(data); PLC.clear();
    // you saved standing in another world: that world is the one made now; the rest wait as their edits
    const dimL = data && (data.v | 0) >= 6 && data.endless && DIMP[data.dim | 0] ? data.dim | 0 : 0; if (dimL) initDim(dimL);
    if (data) {
      // worlds saved before the new landforms regrow from their seed; their old edits would land in the wrong places
      // worlds saved before the random lands regrow from their seed; their old edits would land in the wrong places
      const old = (data.v | 0) < 5 && !data.mode, parts = String(data.mods || '').split('|');
      // the land is remade as you travel: your changes wait with their chunk and go back in when it forms
      const regrow = (data.v | 0) < 6 || !data.endless;
      if (!regrow) {
        if (data.dims && typeof data.dims === 'object') for (const k in data.dims) if (DIMP[k | 0] && (k | 0) !== dimL && data.dims[k]) DSTASH[k | 0] = data.dims[k];
        deferMods(parts[0] || ''); applyIdx(parts[2] || '', i => PLACED.add(i));
        applyPairs(parts[3] || '', (i, w) => { if (w >= 0 && w < 64 && (WTEX[w] !== undefined || w === 0)) { WMODS.set(i, w); if (w >= 8) WMODS_PLACED.add(i); const k = chunkOf(i); if (!PEND.walls.has(k)) PEND.walls.set(k, []); PEND.walls.get(k).push([i, w]); } });
        applyChips(parts[1] || ''); decodeSeen(parts[4] || ''); if (Array.isArray(data.stn)) for (const o of data.stn) if (o && o.i >= 0 && o.i < WW * WH) { const k = chunkOf(o.i); if (!PEND.stn.has(k)) PEND.stn.set(k, []); PEND.stn.get(k).push(o); }
      } else if (!old) G.regrewNote = true;
      G.worn = new Set(!old && Array.isArray(data.worn) ? data.worn.filter(id => IT[id] && IT[id].pack) : []); INV_N = packCap();
      G.gear = { head: null, body: null, legs: null, feet: null }; if (!old && Array.isArray(data.gear)) GEAR_SLOTS.forEach((s, k) => { const id = data.gear[k]; if (IT[id] && IT[id].type === 'armor' && IT[id].slot === s) G.gear[s] = { id, n: 1 }; }); GEAR_C = null; trinkLoad(!old ? data.boons : null);
      if (!old && IT[data.off] && IT[data.off].type === 'weapon') G.gear.off = { id: data.off, n: 1 };
      G.mast = {}; if (data.mast && typeof data.mast === 'object') for (const k in data.mast) if (STYLES[k] && isFinite(data.mast[k])) G.mast[k] = max(0, +data.mast[k]); fightLoad(data.fight, data.known); G.pairsKnown = new Set(Array.isArray(data.pairs) ? data.pairs.filter(isStyleId) : []);
      G.food = clamp(num(data.food, 100), 0, 100); G.quality = data.quality && typeof data.quality === 'object' ? data.quality : {}; G.reqs = Array.isArray(data.reqs) ? data.reqs.filter(r => r && Array.isArray(r.need) && IT[r.need[0]] && Array.isArray(r.give) && IT[r.give[0]]) : null;
      // a world from before the lands were dealt at random regrows, and you wake in it with nothing
      inv = new Array(PACK_MAX).fill(null); if (!old) (Array.isArray(data.inv) ? data.inv : []).forEach((s, i) => { if (!Array.isArray(s)) return; const id = LEGACY[s[0]] || s[0]; if (i < INV_N && IT[id]) inv[i] = { id, n: clamp(s[1] | 0, 1, IT[id].stack) }; });
      G.flags = data.flags && typeof data.flags === 'object' ? data.flags : {}; G.journal = Array.isArray(data.journal) ? data.journal.filter(j => JOURNAL[j]) : ['waking', 'forge'];
      G.echoes = new Set((Array.isArray(data.echoes) ? data.echoes : []).filter(n => isFinite(n) && echoInfo(n))); G.beasts = data.beasts && typeof data.beasts === 'object' ? data.beasts : {};
      G.lairs = new Set((Array.isArray(data.lairs) ? data.lairs : []).filter(s => typeof s === 'string')); G.bless = Array.isArray(data.bless) && BLESS[data.bless[0]] ? { k: data.bless[0], t: clamp(num(data.bless[1]), 0, BLESS_T) } : null;
      G.blessUsed = {}; if (data.blessUsed && typeof data.blessUsed === 'object') for (const k in data.blessUsed) if (isFinite(data.blessUsed[k])) G.blessUsed[k] = +data.blessUsed[k];
      G.known = new Set(Array.isArray(data.known) ? data.known : []); G.movesUsed = new Set(Array.isArray(data.used) ? data.used : []);
      G.clock = num(data.clock, .1) % 1; G.played = num(data.played); G.deaths = data.deaths | 0; G.kills = data.kills | 0;
      const ids = (a, ok) => new Set((Array.isArray(a) ? a : []).filter(x => typeof x === 'string' && ok(x)));
      G.leads = ids(data.leads, x => !!LEADS[x]); G.found = ids(data.found, () => true); G.linksKnown = ids(data.links, x => !!LINKS[x]); G.pin = LEADS[data.pin] ? data.pin : null;
      if (Array.isArray(data.respawn) && !regrow) G.respawn = { x: clamp(data.respawn[0] | 0, 1, WW - 2), y: clamp(data.respawn[1] | 0, 1, WH - 2) };
      if (G.flags.metWick && !G.leads.size) for (const id of ['warden', 'vesper', 'keeper', 'juno', 'bram']) G.leads.add(id);
      if (old) { G.found = new Set(); G.oldNote = true; for (const k of ['gotHook', 'gotBlade', 'gotFlask', 'bramGift', 'pellTrades']) delete G.flags[k]; G.food = 100; }
    } else {
      G.worn = new Set(); G.gear = { head: null, body: null, legs: null, feet: null }; GEAR_C = null; G.mast = {}; fightLoad(null, []); trinkLoad(null); G.pairsKnown = new Set(); INV_N = packCap(); inv = new Array(PACK_MAX).fill(null);
      if (WORLD.mode === 1) { FORGE_KIT.forEach((id, i) => { if (i < INV_N && IT[id]) inv[i] = { id, n: IT[id].stack }; }); G.flags.dbl = G.flags.e2 = true; }
    }
    // make the land around the fire, and around wherever you were standing
    streamTo(SPAWN_X * T, true); if (data && data.p && num(data.p.x, -1) > 0) streamTo(num(data.p.x, 0), true);
    for (const i of PLACED) if (chunkReadyAt(i % WW)) SUP.set(i, 99); { const xs = new Set([...PLACED].filter(i => chunkReadyAt(i % WW)).map(i => i % WW)); for (const x of xs) supRecalc(x, (([...PLACED].find(i => i % WW === x)) / WW) | 0); }
    G.p = newPlayer(); G.fighters = [G.p]; spawnNPCs();
    if (data && data.p) { const x = num(data.p.x, -1), y = num(data.p.y, -1); if ((data.v | 0) >= 6 && data.endless && x > 0 && x < WW * T && y > 0 && y < WH * T - 40 && !boxHits(x, y, 6, 20)) { G.p.x = G.p.px = x; G.p.y = G.p.py = y; } G.p.maxhp = 100 + bonusHP(); G.p.hp = clamp(num(data.p.hp, 100), 1, G.p.maxhp); if (ARMS.includes(data.p.arm)) G.p.arm = data.p.arm; }
    for (const s of G.p.scarf) { s.x = s.ox = G.p.x + 3; s.y = s.oy = G.p.y + 5; }
    snapCam(); G.dirty = !data; updateSun();
    if (!data && WORLD.mode === 0) { G.state = 'intro'; G.introI = 0; G.introT = 0; } else beginPlay(!data);
    if (G.oldNote) { G.oldNote = false; G.banner = { text: 'THE LAND HAS CHANGED', sub: 'this world regrew. you wake with nothing; your embers and journal remain', t: 0 }; G.dirty = true; }
    else if (G.regrewNote) { G.regrewNote = false; G.banner = { text: 'THE LAND HAS CHANGED', sub: 'the world now goes on forever. your pack, embers and journal remain', t: 0 }; G.dirty = true; }
    if (!data) saveWorld(true);
  }, 40);
}

const FORGE_KIT = ['sword', 'spear', 'fangs', 'maul', 'bow', 'nunchaku', 'steel_pick', 'steel_axe', 'steel_hammer', 'plank', 'steel_shovel', 'steel_longsword', 'glass_sabre', 'ember_greataxe', 'ember_longbow', 'cutstone', 'cobble', 'beam', 'beamh', 'door',
  'ladder', 'window', 'thatch', 'torch', 'wplank', 'wcut', 'bench', 'furnace', 'anvil2', 'bloomery', 'loom', 'cauldron', 'chest', 'campfire', 'mudbrick', 'brick', 'logwall', 'platform', 'dirt', 'sand', 'gravel', 'clay', 'charge', 'waystone', 'salve', 'shuriken', 'hook', 'flask', 'frostflask', 'smoke'];
// compact codecs for the new layers: chipped tiles, built parts, back walls, the map, stations
// a dug tile keeps its crater: 64 cells at two bits each (gone, badly cracked, cracked, whole)
const B64C = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function encodeChips() {
  const a = [...CHIP].filter(([i, c]) => (MAT[tiles[i]] || !chunkReadyAt(i % WW)) && c.some(v => v < 255)).sort((p, q) => p[0] - q[0]); let prev = 0;
  return a.map(([i, c]) => { let s = '', acc = 0, bits = 0; for (let k = 0; k < 64; k++) { acc = ((acc << 2) | (c[k] ? (c[k] < 120 ? 1 : c[k] < 205 ? 2 : 3) : 0)) & 0xffff; bits += 2; if (bits >= 6) { bits -= 6; s += B64C[(acc >> bits) & 63]; } } if (bits) s += B64C[(acc << (6 - bits)) & 63]; const r = (i - prev).toString(36) + ':' + s; prev = i; return r; }).join(',');
}
function applyChips(str) {
  if (!str) return; let i = 0;
  for (const s of str.split(',')) {
    const nu = s.includes(':'), [a, h] = s.split(nu ? ':' : '.'); i += parseInt(a, 36);
    if (!(i >= 0 && i < WW * WH) || !h || (!WORLD.endless && !MAT[tiles[i]])) continue;
    const c = new Uint8Array(64);
    if (nu) { if (h.length !== 22) continue; let acc = 0, bits = 0, k = 0; for (const ch of h) { const v = B64C.indexOf(ch); if (v < 0) break; acc = ((acc << 6) | v) & 0xffff; bits += 6; while (bits >= 2 && k < 64) { bits -= 2; c[k++] = [0, 80, 165, 255][(acc >> bits) & 3]; } } if (k < 64) continue; }
    else { if (h.length !== 16) continue; for (let k = 0; k < 16; k++) { const v = parseInt(h[k], 16) || 0, hp = v ? min(255, v * 16 + 15) : 0, ox = (k & 3) * 2, oy = (k >> 2) * 2; c[oy * 8 + ox] = c[oy * 8 + ox + 1] = c[(oy + 1) * 8 + ox] = c[(oy + 1) * 8 + ox + 1] = hp; } }
    CHIP.set(i, c); dirtyAt(i % WW, (i / WW) | 0);
  }
}
function encodeIdx(set) { const a = [...set].sort((p, q) => p - q); let prev = 0; return a.map(i => { const s = (i - prev).toString(36); prev = i; return s; }).join(','); }
function applyIdx(str, fn) { if (!str) return; let i = 0; for (const s of str.split(',')) { i += parseInt(s, 36); if (i >= 0 && i < WW * WH) fn(i); } }
function encodePairs(map) { const a = [...map].sort((p, q) => p[0] - q[0]); let prev = 0; return a.map(([i, v]) => { const s = (i - prev).toString(36) + '.' + v.toString(36); prev = i; return s; }).join(','); }
function applyPairs(str, fn) { if (!str) return; let i = 0; for (const s of str.split(',')) { const [a, b] = s.split('.'); i += parseInt(a, 36); if (i >= 0 && i < WW * WH) fn(i, parseInt(b, 36)); } }
function encodeStn() {
  const out = []; for (const [i, s] of STN) {
    if (tiles[i] !== s.t) continue; const o = { i, t: s.t };
    if (s.items) o.items = s.items.map(q => q ? [q.id, q.n] : 0); if (s.slots) o.slots = s.slots.map(q => q && RECIPES[q.r] ? [q.r, round(q.t), RECIPES[q.r].out || ''] : 0);
    for (const k of STN_KEYS) if (s[k] !== undefined) o[k] = typeof s[k] === 'number' ? round(s[k] * 100) / 100 : s[k];
    out.push(o);
  }
  for (const arr of PEND.stn.values()) for (const o of arr) out.push(o);
  return out;
}
function applyStn(arr) { if (Array.isArray(arr)) for (const o of arr) restoreStn(o); }
function restoreStn(o) {
  {
    if (!o || !(o.i >= 0 && o.i < WW * WH) || tiles[o.i] !== o.t) return; const s = stnState(o.i, o.t);
    if (Array.isArray(o.items) && s.items) o.items.forEach((q, k) => { if (k < s.items.length) s.items[k] = Array.isArray(q) && IT[q[0]] ? { id: q[0], n: clamp(q[1] | 0, 1, IT[q[0]].stack) } : null; });
    if (Array.isArray(o.slots) && s.slots) o.slots.forEach((q, k) => { if (k < s.slots.length) s.slots[k] = Array.isArray(q) && RECIPES[q[0]] && (RECIPES[q[0]].out || '') === q[2] ? { r: q[0], t: q[1] | 0 } : null; });
    for (const k of STN_KEYS) if (o[k] !== undefined) s[k] = o[k];
  }
}
