// ============================================================
//  Main: sky, render pipeline, game loop, input, boot
// ============================================================
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
let acv, actx, lcv, lctx, fcv, fctx, gcv, gctx, glcv, glctx, tcv, tctx, vig, vigR, SIL = [], VEILS = [], SHARDMOON = null;
const stars = []; for (let i = 0; i < 110; i++) stars.push([Math.random(), Math.random() * .75, Math.random() * TAU, Math.random() < .18 ? 2 : 1]);
const veils = []; for (let i = 0; i < 7; i++) veils.push({ x: Math.random(), y: .08 + Math.random() * .34, k: i % 4, sp: .15 + Math.random() * .35, s: .8 + Math.random() * .7 });
function genSil(seed, kind) {
  const w = 640, h = 170; const [c, x] = mk(w, h); const R = mulberry32(seed); x.fillStyle = '#1d1433';
  if (kind === 0) {
    for (let X = 0; X < w; X++) { const a = X / w * TAU, r = 16 + fbm(cos(a) * 2 + 9, sin(a) * 2 + 9, 3) * 34 + fbm(cos(a) * 7 + 3, sin(a) * 7, 2) * 6; x.fillRect(X, round(h - r), 1, ceil(r)); }
    let X = R() * 40; while (X < w - 30) {
      const n = 3 + (R() * 7 | 0), H0 = 44 + R() * 84, lean = (R() - .5) * .6;
      for (let k = 0; k < n; k++) { const t = abs(k - (n - 1) / 2) / ((n - 1) / 2 + .01), cw = 3, ch = round(H0 * (1 - t * t * .6) + R() * 8), cx2 = round(X + k * 3.5 + lean * (n - k) * 2); x.fillRect(cx2, h - ch, cw, ch); x.clearRect(cx2 + (R() < .5 ? 0 : 2), h - ch, 1, 1 + (R() * 2 | 0)); }
      X += n * 3.5 + 26 + R() * 100;
    }
  }
  else {
    for (let k = 0; k < 8; k++) {
      const cx = R() * w, cy = 26 + R() * 70, a = 10 + R() * 26, b = 4 + R() * 6;
      for (let X = -a; X <= a; X++) { const t = 1 - (X / a) ** 2, top = cy - b * sqrt(t) * .6, bot = cy + b * 2.4 * t + R() * 3; x.fillRect((((cx + X) % w) + w) % w | 0, top | 0, 1, max(1, (bot - top) | 0)); }
      for (let d = 0; d < 3; d++) x.fillRect((((cx + (R() - .5) * a) % w) + w) % w | 0, (cy + b) | 0, 1, (4 + R() * 12) | 0);
    }
    let X = 0; while (X < w) { const sw = 6 + (R() * 10 | 0), sh = 14 + (R() * 56 | 0); for (let i = 0; i < sw; i++) { const hh2 = sh * (1 - abs(i - sw / 2) / (sw / 2) * .3); x.fillRect(X + i, h - hh2, 1, hh2); } X += sw + 10 + (R() * 70 | 0); }
  }
  return c;
}
function genVeil(seed) { const w = 90, h = 6; const [c, x] = mk(w, h); const R = mulberry32(seed + 3); for (let y = 0; y < h; y++) { let X = R() * 20 | 0; while (X < w) { const L = 8 + (R() * 30 | 0); x.globalAlpha = .35 + R() * .65; x.fillStyle = y < 2 ? '#ffffff' : '#eadff2'; x.fillRect(X, y, L, 1); X += L + 4 + (R() * 22 | 0); } } return c; }
function resize() {
  const W = max(320, innerWidth), H = max(240, innerHeight); cv.width = W; cv.height = H;
  // the world is drawn at a whole-pixel scale that shows about 40 to 55 tiles from top to bottom; menus keep their own size
  VS.W = W; VS.H = H; VS.s = clamp(floor(H / 300), 2, 6); VS.vw = W / VS.s; VS.vh = H / VS.s; VS.ui = clamp(round(H / 250), 2, 6) >= 4 ? 3 : 2; VS.uw = W / VS.ui; VS.uh = H / VS.ui;
  ctx.imageSmoothingEnabled = false;
  const bw = ceil(VS.vw) + 2, bh = ceil(VS.vh) + 2;[acv, actx] = mk(bw, bh);[lcv, lctx] = mk(bw, bh);[fcv, fctx] = mk(bw, bh);[gcv, gctx] = mk(bw, bh);[glcv, glctx] = mk(bw, bh); wctx = ctx;
  const mkV = (r, g, b, k) => { const [c, vx] = mk(64, 36); const d = vx.createImageData(64, 36); for (let Y = 0; Y < 36; Y++) for (let X = 0; X < 64; X++) { const q = hypot((X - 31.5) / 32, (Y - 17.5) / 18), i = (Y * 64 + X) * 4; d.data[i] = r; d.data[i + 1] = g; d.data[i + 2] = b; d.data[i + 3] = 255 * clamp((q - .62) * k, 0, 1); } vx.putImageData(d, 0, 0); return c; };
  vig = mkV(10, 6, 24, .75); vigR = mkV(190, 30, 30, 1.1);
}
const SKYC = { dayT: [84, 146, 196], dayB: [250, 222, 192], duskT: [70, 48, 122], duskB: [240, 122, 96], nightT: [9, 7, 28], nightB: [40, 24, 72] };
function updateSun() {
  if (DIM) { dimSun(); return; }
  const t = G.clock, dn = t < .06 ? .5 + t / .12 : t < .54 ? 1 : t < .66 ? 1 - (t - .54) / .12 : t < .94 ? 0 : (t - .94) / .12; G.dn = dn;
  const w = sin(dn * PI) * .2; G.sun[0] = min(1, lerp(.2, 1, dn) + w); G.sun[1] = lerp(.2, 1, dn); G.sun[2] = lerp(.42, 1, dn) - w * .5; eventSun();
}
const camX = x => WW * T <= VS.vw ? (WW * T - VS.vw) / 2 : clamp(x, 0, WW * T - VS.vw), camY = y => WH * T <= VS.vh ? (WH * T - VS.vh) / 2 : clamp(y, 0, WH * T - VS.vh);
// ---------------- backdrop: sky, then layered silhouettes for wherever the camera is ----------------
const BGTONE = { reach: [[78, 98, 146], [52, 70, 114]], moor: [[128, 76, 118], [84, 46, 88]], ash: [[112, 104, 126], [74, 66, 88]], scoria: [[160, 88, 66], [110, 54, 46]], cave: [[54, 66, 94], [38, 48, 70]], deep: [[104, 36, 42], [70, 24, 32]] };
const BGT = {};
function bgLayer(k, col, hiA) {
  const key = (col[0] >> 2) + ',' + (col[1] >> 2) + ',' + (col[2] >> 2) + ',' + round(hiA * 12); let t = BGT[k];
  if (!t) { const [c, x] = mk(640, 200); t = BGT[k] = { c, x, key: '' }; }
  if (t.key !== key) { const x = t.x; t.key = key; x.globalCompositeOperation = 'copy'; x.drawImage(BGL[k].cv, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = rgb(col); x.fillRect(0, 0, 640, 200); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = hiA; x.drawImage(BGL[k].hi, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
  return t.c;
}
function regionMix(x) {
  if (WORLD.arena) return WORLD.royale ? brRegionMix(x) : [['ash', 1]];
  const BGK = { reach: 'reach', moor: 'moor', fen: 'moor', thorn: 'moor', ash: 'ash', scoria: 'scoria', dunes: 'scoria' }, acc = { reach: 0, moor: 0, ash: 0, scoria: 0 };
  let tot = 0;
  if (WORLD.endless) { const [t, h] = climate(x), w = bweights(t, h); for (const b in w) if (w[b] > .001) { acc[BGK[b] || 'moor'] += w[b]; tot += w[b]; } }
  else for (const sg of SEGS) { const w = segW(sg, x, 60); if (w > .001) { acc[BGK[sg.b] || 'moor'] += w; tot += w; } }
  const a = smooth((CRATER_R + 50 - abs(x - SHRINE_X)) / 40); if (!tot) { acc.moor = 1; tot = 1; }
  for (const k in acc) acc[k] = acc[k] / tot * (1 - a); acc.ash += a;
  return Object.entries(acc).filter(e => e[1] > .02);
}
function drawLayer(c, k, col, hiA, par, bottom, alpha, cx, fill, vt, emA = 1) {
  const S = VS.s, W = VS.W, H = VS.H, img = bgLayer(k, col, hiA), w = 640 * S, x0 = -(((cx * par * S) % w) + w) % w, hgt = 200 * S;
  let y = round(bottom - hgt); if (vt) y = round(((bottom % hgt) + hgt) % hgt - hgt);
  c.globalAlpha = alpha; for (let yy = y; yy < (vt ? H : y + 1); yy += hgt) for (let x = x0; x < W; x += w) c.drawImage(img, round(x), yy, w, hgt);
  if (fill && y + 200 * S < H) { c.fillStyle = rgb(col); c.fillRect(0, y + 200 * S - 1, W, H - y - 200 * S + 1); }
  const em = BGL[k].em; if (em.length && alpha > .05) { c.globalCompositeOperation = 'lighter'; for (const [ex, ey, ec] of em) { const X = (x0 + ex * S) % w; for (let xx = X; xx < W; xx += w) { if (xx < -S * 3) continue; c.globalAlpha = alpha * emA * (.45 + .35 * sin(G.time * .04 + ex)); c.fillStyle = ec; c.fillRect(round(xx) - S, y + ey * S - S, S * 3, S * 3); c.globalAlpha = alpha * emA; c.fillRect(round(xx), y + ey * S, S, S); } } c.globalCompositeOperation = 'source-over'; }
  c.globalAlpha = 1;
}
function drawSky(c, cx, cy) {
  if (DIM) { drawDimSky(c, cx, cy); return; }
  const W = VS.W, H = VS.H, S = VS.s, dn = G.dn, t = WORLD.arena && !WORLD.royale ? .44 : G.clock;
  const ctx0 = clamp(floor((cx + VS.vw / 2) / T), 0, WW - 1), cty = (cy + VS.vh / 2) / T;
  const under = WORLD.arena ? 0 : smooth((cty - SKYL[ctx0] - 6) / 22), deep = WORLD.arena ? 0 : smooth((cty - DEEP_Y + 10) / 16), high = WORLD.arena ? 0 : smooth((DRIFT_Y + 18 - cty) / 26);
  const top = dn > .5 ? mixc(SKYC.duskT, SKYC.dayT, (dn - .5) * 2) : mixc(SKYC.nightT, SKYC.duskT, dn * 2), bot = dn > .5 ? mixc(SKYC.duskB, SKYC.dayB, (dn - .5) * 2) : mixc(SKYC.nightB, SKYC.duskB, dn * 2);
  if (under < 1) {
    const bands = 18; for (let i = 0; i < bands; i++) { c.fillStyle = rgb(mixc(top, bot, pow(i / (bands - 1), 1.1))); c.fillRect(0, floor(i * H / bands), W, ceil(H / bands) + 1); }
    if (dn < .7) {
      const a = (.7 - dn) / .7; for (const s of stars) { c.globalAlpha = a * (.45 + .55 * sin(G.time * .03 + s[2])); c.fillStyle = s[3] > 1 ? '#c9fff6' : '#fff'; c.fillRect(floor(s[0] * W), floor(s[1] * H), s[3] * (S - 1), s[3] * (S - 1)); }
      const ha = clamp((.5 - dn) * 1.4, 0, .5);
      if (ha > 0) for (let k = 0; k < 3; k++) { c.fillStyle = k === 1 ? '#7a4ad0' : '#2fb8a8'; for (let X = 0; X < W; X += S * 2) { const y = H * (.1 + .07 * k) + sin(X * .0035 + G.time * .006 + k * 2) * H * .05 + sin(X * .011 + k) * H * .015, h = H * (.05 + .03 * sin(X * .006 + G.time * .01 + k)); c.globalAlpha = ha * (.25 + .25 * sin(X * .02 + G.time * .02 + k)); c.fillRect(X, round(y), S * 2, round(h)); } }
      c.globalAlpha = 1;
    }
    if (t < .62) {
      const u = t / .62, rx = W * (.08 + .84 * u), ry = H * .7 - sin(u * PI) * H * .52, sc = S * .8, sz = SPR.ring.width * sc;
      const g = c.createRadialGradient(rx, ry, sz * .1, rx, ry, sz * .9); g.addColorStop(0, 'rgba(255,214,120,.45)'); g.addColorStop(1, 'rgba(255,150,80,0)');
      c.fillStyle = g; c.fillRect(rx - sz, ry - sz, sz * 2, sz * 2); c.drawImage(SPR.ring, round(rx - sz / 2), round(ry - sz / 2), round(sz), round(sz)); if (G.ev && G.ev.id === 'eclipse' && G.ev.fade > 0) { c.globalAlpha = G.ev.fade; c.fillStyle = '#0c0818'; c.beginPath(); c.arc(rx + sz * .06, ry, sz * .3, 0, TAU); c.fill(); c.strokeStyle = 'rgba(200,170,255,.8)'; c.lineWidth = S; c.beginPath(); c.arc(rx + sz * .06, ry, sz * .31, 0, TAU); c.stroke(); c.globalAlpha = 1; }
    } else { const u = (t - .62) / .38, mx = W * (.1 + .8 * u), my = H * .66 - sin(u * PI) * H * .5, sc = S * 1.2; c.globalAlpha = .9; c.drawImage(SHARDMOON, round(mx - SHARDMOON.width * sc / 2), round(my), round(SHARDMOON.width * sc), round(SHARDMOON.height * sc)); c.globalAlpha = 1; }
    for (const v of veils) { const sp = VEILS[v.k], w = sp.width * S * v.s, span = W + w * 2, x = ((v.x * span + G.time * v.sp * .1 * S - cx * .04 * S) % span + span) % span - w; c.globalAlpha = .18 + .32 * dn; c.drawImage(sp, round(x), round(v.y * H - (cy - 400) * .02 * S), round(w), round(sp.height * S)); }
    c.globalAlpha = 1;
    // region silhouettes: a far range, then a nearer one, each region fading into the next
    const mix = regionMix((cx + VS.vw / 2) / T), lt = .35 + .65 * dn, ref = BASE_Y * T, mid = cy + VS.vh * .55, hiA = .25 + .6 * dn;
    const far = mixc(mixc([60, 52, 96], bot, .55), [14, 10, 30], 1 - lt);
    drawLayer(c, 'far', far, 0, .03, H * .74 + (ref - mid) * .03 * S, .55 * (1 - under), cx, false);
    for (const [k, w] of mix) drawLayer(c, (k === 'scoria' ? 'rust' : k) + '_far', mixc(mixc(BGTONE[k][0], bot, .3), [12, 9, 26], 1 - lt), hiA, .07, H * .8 + (ref - mid) * .07 * S, w * (1 - under), cx, true, false, .15 + .85 * (1 - dn));
    for (const [k, w] of mix) drawLayer(c, (k === 'scoria' ? 'rust' : k) + '_mid', mixc(mixc(BGTONE[k][1], bot, .2), [8, 6, 18], 1 - lt), hiA * .8, .16, H * .9 + (ref - mid) * .16 * S, w * (1 - under), cx, true, false, .15 + .85 * (1 - dn));
    // a sea of cloud below the Drift
    if (high > .01) { const y = round(H * .62 + (DRIFT_Y * T + 120 - cy) * .45 * S), w = 640 * S, x0 = -(((cx * .22 * S + G.time * .15 * S) % w) + w) % w; c.globalAlpha = high * (.5 + .4 * dn); for (let x = x0; x < W; x += w) c.drawImage(BGL.clouds.hi, round(x), y, w, 200 * S); c.fillStyle = '#a99cc8'; if (y + 200 * S < H) c.fillRect(0, y + 200 * S - 1, W, H); c.globalAlpha = 1; }
  }
  // below ground: caverns behind the rock, warmer and redder the deeper you go
  if (under > .01) {
    c.globalAlpha = under; c.fillStyle = rgb(mixc([22, 18, 36], [36, 14, 22], deep)); c.fillRect(0, 0, W, H); c.globalAlpha = 1;
    const ref = SKYL[ctx0] * T + 400, mid = cy + VS.vh / 2;
    if (deep < .99) { drawLayer(c, 'cave_far', BGTONE.cave[0], 0, .08, (ref - mid) * .08 * S, under * (1 - deep), cx, false, true); drawLayer(c, 'cave_mid', BGTONE.cave[1], 0, .2, (ref - mid) * .2 * S, under * (1 - deep) * .9, cx, false, true); }
    if (deep > .01) drawLayer(c, 'deep_far', BGTONE.deep[0], 0, .1, ((DEEP_Y + 30) * T - mid) * .1 * S, deep, cx, false, true);
  }
}
function arcTrail(f, cx, cy, face, a0, a1, r0, r1, alpha, hot, cold, sty) {
  const n = max(3, ceil(abs(a1 - a0) / .2));
  for (let pass = 0; pass < 2; pass++) {
    f.fillStyle = sty ? sty[pass] : pass ? (hot ? '#fff1a8' : cold ? '#dcf7f5' : '#ffffff') : (hot ? '#ff7a2a' : cold ? '#4fd8c8' : '#8fb0d8');
    const ri = u => lerp(r1 - 1.2, r0 + (pass ? (r1 - r0) * .5 : 0), pow(u, .8));
    for (let i = 0; i < n; i++) {
      const u0 = i / n, u1 = (i + 1) / n, b0 = a0 + (a1 - a0) * u0, b1 = a0 + (a1 - a0) * u1; f.globalAlpha = alpha * (.08 + .92 * u1 * u1) * (pass ? .95 : .7);
      f.beginPath(); f.moveTo(cx + face * cos(b0) * ri(u0), cy + sin(b0) * ri(u0)); f.lineTo(cx + face * cos(b0) * r1, cy + sin(b0) * r1); f.lineTo(cx + face * cos(b1) * r1, cy + sin(b1) * r1); f.lineTo(cx + face * cos(b1) * ri(u1), cy + sin(b1) * ri(u1)); f.fill();
    }
  }
  f.globalAlpha = 1;
}
function stabTrail(f, cx, cy, face, th, tip, alpha, cold) {
  const c = cos(th) * face, s = sin(th), nx = -s, ny = c, x1 = cx + c * tip, y1 = cy + s * tip, x0 = cx + c * max(4, tip - 22), y0 = cy + s * max(4, tip - 22);
  f.globalAlpha = alpha * .8; f.fillStyle = cold ? '#4fd8c8' : '#8fb0d8'; f.beginPath(); f.moveTo(x0, y0); f.lineTo(x1 - c * 3 + nx * 2.2, y1 - s * 3 + ny * 2.2); f.lineTo(x1 + c * 2, y1 + s * 2); f.lineTo(x1 - c * 3 - nx * 2.2, y1 - s * 3 - ny * 2.2); f.fill();
  f.globalAlpha = alpha; f.fillStyle = '#fff'; f.beginPath(); f.moveTo(x0 + c * 6, y0 + s * 6); f.lineTo(x1 - c * 2 + nx, y1 - s * 2 + ny); f.lineTo(x1 + c * 2, y1 + s * 2); f.lineTo(x1 - c * 2 - nx, y1 - s * 2 - ny); f.fill(); f.globalAlpha = 1;
}
function liveTrail(f, fi, al) {
  const a = fi.atk, m = a.m, rx = lerp(fi.px, fi.x, al) + 3, ry = lerp(fi.py, fi.y, al), tcx = rx + a.face, tcy = ry + 6, L = (ARM + a.W.len) * m.reach, pt = a.pt + (fi.remote ? 0 : al), hot = a.W.glow || m.big, cold = a.W.cold;
  if (m.kind === 'swing') arcTrail(f, tcx, tcy, a.face, m.from * D2R + a.aimOff, swingAng(a, pt), ARM + a.W.len * .3, L, 1, hot, cold);
  else if (m.kind === 'thrust') stabTrail(f, tcx, tcy, a.face, a.th, L * thrustExt(a, pt), 1, cold);
  else if (m.kind === 'flip') { const r = clamp(pt / a.act, 0, 1) * m.turns * TAU; arcTrail(f, tcx - a.face, tcy + 4, a.face, -PI / 2 + r - 2.6, -PI / 2 + r, ARM + a.W.len * .3, L, 1, true, cold); }
  else if (m.kind === 'spin' && m.wheel) { const r = clamp(pt / a.act, 0, 1) * m.turns * TAU; arcTrail(f, tcx, tcy, a.face, -PI / 2 + r - 2.4, -PI / 2 + r, ARM + a.W.len * .2, L, 1, hot, cold); }
  else if (m.kind === 'spin') {
    const ph = clamp(pt / a.act, 0, 1) * m.turns * TAU, yo = m.heli ? -13 : 5; f.fillStyle = hot ? '#ffd35a' : cold ? '#c9fff6' : '#ffffff';
    for (let i = 0; i < 16; i++) { const an = ph - i * .16, X = tcx - a.face + cos(an) * L, Y = tcy + yo + sin(an) * L * .22; f.globalAlpha = (1 - i / 16) * .9; f.fillRect(round(X) - 1, round(Y) - (sin(an) > 0 ? 0 : 1), 3, 2); }
    f.globalAlpha = 1;
  } else if (m.kind === 'plunge') { f.fillStyle = '#ffd35a'; for (let i = 0; i < 5; i++) { f.globalAlpha = .6 - i * .1; f.fillRect(round(tcx) - 1 + (i & 1), tcy - 8 - i * 7, 2, 7); } f.globalAlpha = 1; }
}
const CRACK = [[3, 1], [3, 2], [4, 3], [4, 4], [3, 5], [5, 4], [6, 5], [2, 3], [1, 3], [3, 6], [2, 6], [5, 2], [6, 1], [4, 6], [5, 7], [1, 5], [6, 3], [2, 1], [0, 2], [7, 6]];

function render(al) {
  const z = G.state === 'play' ? G.zoom || 1 : 1;
  if (z !== 1) { const s0 = VS.s, w0 = VS.vw, h0 = VS.vh; VS.s = s0 * z; VS.vw = VS.W / VS.s; VS.vh = VS.H / VS.s; G.zoomOff = [(w0 - VS.vw) / 2, (h0 - VS.vh) / 2]; try { renderView(al); } finally { VS.s = s0; VS.vw = w0; VS.vh = h0; G.zoomOff = null; } }
  else renderView(al);
}
function renderView(al) {
  const S = VS.s, W = VS.W, H = VS.H, p = G.p, F = G.flags;
  let cx = lerp(G.cam.px, G.cam.x, al), cy = lerp(G.cam.py, G.cam.y, al);
  if (G.zoomOff) { cx += G.zoomOff[0]; cy += G.zoomOff[1]; const L = G.link; if (L && L.e && L.f) { const u = clamp((G.zoom - 1) / .2, 0, 1), fx = (L.f.x + 3 + L.e.x + L.e.w / 2) / 2, fy = (L.f.y + L.e.y + L.e.h / 2 + 4) / 2; cx = lerp(cx, camX(fx - VS.vw / 2), u); cy = lerp(cy, camY(fy - VS.vh / 2 - 4), u); } }
  if (G.shake > .15) { cx += frand(-1, 1) * G.shake; cy += frand(-1, 1) * G.shake; }
  cx = camX(cx); cy = camY(cy);
  const ox = round(cx * S), oy = round(cy * S); cx = ox / S; cy = oy / S; G.rcx = cx; G.rcy = cy;
  mouse.wx = cx + mouse.x / S; mouse.wy = cy + mouse.y / S;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = false;
  drawSky(ctx, cx, cy);
  const ax0 = floor(cx), ay0 = floor(cy), offx = (ax0 - cx) * S, offy = (ay0 - cy) * S;
  const vx0 = floor(cx / T) - 3, vx1 = floor((cx + VS.vw) / T) + 3, vy0 = floor(cy / T) - 3, vy1 = floor((cy + VS.vh) / T) + 3;
  const play = G.state === 'play' || G.state === 'intro', showP = play && !(p.dead && p.deadT > 60) && !p.onBarge;
  // ---------- lights ----------
  dynLights.length = 0;
  const lit = F.wardenDead || !!G.boss, b = G.boss, v = G.duel, mirrorOn = F.vesperDone || !!v;
  for (const o of tileObjs.values()) {
    if (o.x < vx0 - 20 || o.x > vx1 + 20) continue;
    if (o.id === SHRINE) addLight(o.x * T + 4, o.y * T, lit ? 1 : .32, lit ? .62 : .14, lit ? .25 : .3);
    else if (o.id === SHRINE2) addLight(o.x * T + 4, o.y * T - 4, mirrorOn ? .35 : .12, mirrorOn ? .75 : .25, mirrorOn ? .8 : .32);
    else if (o.id === GATE) addLight(o.x * T + 4, o.y * T - 4, .6 + (F.vesperDone ? .25 : 0), .2, .08);
  }
  RFRAME++; const kx0 = floor(cx / 256) - 1, kx1 = floor((cx + VS.vw) / 256) + 1;
  for (const fi of G.fires) if (fi.x1 > cx - 60 && fi.x0 < cx + VS.vw + 60) for (let X = fi.x0; X < fi.x1; X += 12) addLight(X, fi.y - 4, .8, .4, .12);
  for (const e of G.enemies) if (e.type === 'cinderling' && !e.dead && e.x > cx - 60 && e.x < cx + VS.vw + 60) addLight(e.x + 4, e.y + 4, .7, .32, .1);
  for (let k = kx0; k <= kx1; k++) { const bk = PROPB.get(k); if (bk) for (const q of bk) if (q.light && q.x > cx - 120 && q.x < cx + VS.vw + 120 && q.y > cy - 120 && q.y < cy + VS.vh + 120) { const fl = .93 + .07 * sin(G.time * .21 + q.x); addLight(q.x + (q.img.width >> 1), q.y + (q.lyo !== undefined ? q.lyo : q.img.height * .6), q.light[0] * fl, q.light[1] * fl, q.light[2] * fl); } }
  if (!WORLD.arena) stationLights();
  for (const o of tileObjs.values()) if (o.id === PEDESTAL && pedItem(o) && o.x > vx0 - 20 && o.x < vx1 + 20) addLight(o.x * T + 4, o.y * T - 6, .5, .45, .3);
  const pods = [];
  for (const [tx, tr] of treeTops) {
    if (tx < vx0 - 6 || tx > vx1 + 6) continue; const top = SPR.top[tr.kind][tr.v], sw = round(sin(G.time * .02 + tr.ph) * 1.3), X0 = tx * T + 4 - 23 + sw, Y0 = tr.y * T + 1 - 31;
    for (const pd of top.pods) { const X = X0 + pd[0], Y = Y0 + pd[1], k = pd[2]; pods.push(X, Y, k); addLight(X, Y, k === 0 ? .62 : k === 1 ? .14 : .55, k === 0 ? .38 : k === 1 ? .46 : .16, k === 0 ? .14 : k === 1 ? .5 : .06); }
  }
  for (const pr of G.projs) { if (pr.type === 'wave') addLight(pr.x, pr.y, 1, .65, .3); else if (pr.type === 'bolt') addLight(pr.x, pr.y, .8, .35, .1); else if (pr.type === 'shock' || pr.type === 'bomb') addLight(pr.x, pr.y, .8, .45, .15); else if (pr.type === 'arrow') addLight(pr.x, pr.y, .45, .35, .12); }
  for (const f of G.fighters) {
    if (f.dead || f.x < cx - 60 || f.x > cx + VS.vw + 60) continue; const it = f === G.p && heldItem() || heldOf(f);
    if (f === G.p) { if (!showP) continue; addLight(f.x + 3, f.y + 8, .66, .5, .32); if (it && it.id === 'torch') addLight(f.x + 3, f.y + 6, 1, .8, .46); }
    if (it && it.glow) addLight(f.x + 3, f.y + 8, .75, .45, .18); else if (it && it.cold || f.skin === 4) addLight(f.x + 3, f.y + 8, .2, .5, .55);
  }
  for (const n of G.npcs) addLight(n.x + 3 + n.face * 3, n.y + 3, 1, .72, .36);
  if (b && !b.boss) { if (b.type === 'keeper') { addLight(b.x + 6, b.y + 8, .95, .55, .25); addLight(b.x + 6 + b.dir * 14, b.y + 2, .7, .34, .12); } else addLight(b.x + 20, b.y + 10, .7 + b.core * .3, .36 + b.core * .3, .14); }
  for (const t of G.trails) if (t.kind === 'hit' && t.big) addLight(t.x, t.y, .9, .7, .4);
  const tx0 = floor(cx / T) - 10, ty0 = floor(cy / T) - 10, tw = ceil(VS.vw / T) + 21, th = ceil(VS.vh / T) + 21;
  dimLights(cx, cy); computeLight(tx0, ty0, tw, th, G.sun);
  // ---------- static world at art resolution ----------
  const w = actx; w.setTransform(1, 0, 0, 1, 0, 0); w.clearRect(0, 0, acv.width, acv.height); w.setTransform(1, 0, 0, 1, -ax0, -ay0);
  const CP = CH * T, c0x = floor(cx / CP), c1x = floor((cx + VS.vw) / CP), c0y = floor(cy / CP), c1y = floor((cy + VS.vh) / CP);
  for (let yy = max(0, c0y); yy <= c1y; yy++) for (let xx = max(0, c0x); xx <= c1x; xx++) { if (xx * CH >= WW || yy * CH >= WH) continue; w.drawImage(getChunk(xx, yy).cv, xx * CP, yy * CP); }
  pruneChunks(c0x, c0y);
  for (const o of tileObjs.values()) {
    if (o.x < vx0 - 4 || o.x > vx1 + 4 || o.y < vy0 - 4 || o.y > vy1 + 4) continue; const px = o.x * T, py = o.y * T;
    if (o.id === TORCH) w.drawImage(SPR.torch, px + 2, py + 2); else if (o.id === BENCH) w.drawImage(SPR.bench, px - 4, py); else if (o.id === FURNACE) w.drawImage(SPR.furnace, px - 3, py - 3);
    else if (o.id === SHRINE) w.drawImage(SPR.shrine, px - 6, py - 8); else if (o.id === SHRINE2) w.drawImage(SPR.shrine2, px - 6, py - 8); else if (o.id === GATE) w.drawImage(SPR.gate, px - 8, py - 13); else if (o.id === CAMP) w.drawImage(SPR.logs, px - 1, py + 4);
    else if (o.id === BALLISTA) drawBallista(w, o); else if (STN_SPR[o.id]) { const q = STN_SPR[o.id]; w.drawImage(q.img, px + q.ox, py + q.oy); }
  }
  for (const o of tileObjs.values()) if (o.id === PEDESTAL && o.x >= vx0 - 2 && o.x <= vx1 + 2 && o.y >= vy0 - 2 && o.y <= vy1 + 2) { w.drawImage(SPR.pedestal, o.x * T - 1, o.y * T - 4); const it = pedItem(o); if (it) { const ic = IT[it].icon; w.drawImage(ic, o.x * T + 4 - (ic.width >> 1), o.y * T - 14 + round(sin(G.time * .06) * 1.5)); } }
  for (let k = kx0; k <= kx1; k++) { const bk = PROPB.get(k); if (bk) for (const q of bk) if (q.rf !== RFRAME && q.x < cx + VS.vw && q.x + q.img.width > cx && q.y < cy + VS.vh && q.y + q.img.height > cy) { q.rf = RFRAME; w.drawImage(q.img, q.x, q.y); } }
  for (const [tx, tr] of treeTops) { if (tx < vx0 - 6 || tx > vx1 + 6) continue; const sw = round(sin(G.time * .02 + tr.ph) * 1.3); w.drawImage(SPR.top[tr.kind][tr.v].cv, tx * T + 4 - 23 + sw, tr.y * T + 1 - 31); }
  if (!WORLD.arena) { drawPhys(w, al); drawStationsWorld(w); }
  for (const d of G.drops) { const ic = IT[d.id].icon, x = lerp(d.px, d.x, al) + 3, y = lerp(d.py, d.y, al) + 3 + sin(d.t * .1), k = ic.width > 12 ? .7 : 1; w.drawImage(ic, round(x - ic.width * k / 2), round(y - ic.height * k / 2), round(ic.width * k), round(ic.height * k)); }
  if (WORLD.royale) brWorld(w, al, cx, cy);
  for (const q of G.parts) { if (q.glow) continue; w.globalAlpha = min(1, q.life / q.max * 2); w.fillStyle = q.col; w.fillRect(floor(q.x), floor(q.y), q.sz, q.sz); } w.globalAlpha = 1;
  for (const pr of G.projs) {
    const x = lerp(pr.px, pr.x, al), y = lerp(pr.py, pr.y, al);
    if (pr.type === 'rock') w.drawImage(SPR.rock, round(x - 4), round(y - 4));
    else if (pr.type === 'javelin') { w.save(); w.translate(round(x), round(y)); w.rotate(atan2(pr.vy, pr.vx)); w.drawImage(pr.spr || SPR.w_spear, -22, -2); w.restore(); }
    else if (pr.type === 'arrow') { w.save(); w.translate(round(x), round(y)); w.rotate(atan2(pr.vy, pr.vx)); w.drawImage(SPR.arrow, -8, -1); w.restore(); }
    else if (pr.type === 'knife') { w.save(); w.translate(round(x), round(y)); w.rotate(pr.t * .6 * (sign(pr.vx) || 1)); w.drawImage(SPR.knife, -3, -1); w.restore(); }
    else if (pr.type === 'star') w.drawImage(SPR.shuriken[(pr.t >> 1) & 1], round(x) - 2, round(y) - 2);
    else if (pr.type === 'hook') { w.save(); w.translate(round(x), round(y)); w.rotate(atan2(pr.vy, pr.vx) + PI / 2); w.drawImage(SPR.hookhead, -2, -2); w.restore(); }
    else if (pr.type === 'flask') { w.save(); w.translate(round(x), round(y)); w.rotate(pr.t * .3); w.drawImage(SPR.flask, -2, -3); w.restore(); }
    else if (pr.type === 'pellet') w.drawImage(SPR.pellet, round(x) - 2, round(y) - 2);
    else if (pr.type === 'glob') w.drawImage(SPR.glob, round(x) - 2, round(y) - 2);
    else if (pr.type === 'shard') { w.fillStyle = '#c9fff6'; w.fillRect(round(x) - 1, round(y) - 1, 2, 2); w.fillStyle = '#ffffff'; w.fillRect(round(x) - 1, round(y) - 1, 1, 1); }
    else if (pr.type === 'orb') { const s = pr.sz || 2; w.fillStyle = pr.col || '#ffffff'; w.fillRect(round(x) - s, round(y) - s, s * 2, s * 2); w.fillStyle = pr.col2 || '#ffffff'; w.fillRect(round(x) - (s >> 1), round(y) - (s >> 1), max(1, s), max(1, s)); }
    else if (pr.type === 'cloud') { const r = pr.r * min(1, pr.t / 12) * min(1, (pr.life - pr.t) / 30 + .2); w.globalAlpha = .28; w.fillStyle = pr.col || '#6ff0c0'; w.beginPath(); w.arc(x, y, max(1, r), 0, TAU); w.fill(); w.globalAlpha = .45; w.beginPath(); w.arc(x + sin(G.time * .1 + pr.r) * 2, y, max(1, r * .55), 0, TAU); w.fill(); w.globalAlpha = 1; }
  }
  for (const q of G.stuck) w.drawImage(SPR.shuriken[0], round(q.x) - 2, round(q.y) - 2);
  lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.globalCompositeOperation = 'copy'; lctx.imageSmoothingEnabled = true;
  lctx.drawImage(lmc, 0, 0, tw, th, tx0 * T - ax0, ty0 * T - ay0, tw * T, th * T);
  lctx.globalCompositeOperation = 'destination-in'; lctx.imageSmoothingEnabled = false; lctx.drawImage(acv, 0, 0);
  w.setTransform(1, 0, 0, 1, 0, 0); w.globalCompositeOperation = 'multiply'; w.drawImage(lcv, 0, 0); w.globalCompositeOperation = 'source-over';
  ctx.drawImage(acv, offx, offy, acv.width * S, acv.height * S);
  // ---------- actors at full resolution, lit per sprite ----------
  ctx.setTransform(S, 0, 0, S, -ox, -oy);
  for (const g of G.ghosts) { ctx.globalAlpha = g.life / g.max * .5; ctx.drawImage(g.cv, 0, 0, g.n, g.n, g.x, g.y, g.n, g.n); } ctx.globalAlpha = 1;
  for (const e of G.enemies) if (!e.dead && e.x > cx - 90 && e.x < cx + VS.vw + 90 && e.y > cy - 90 && e.y < cy + VS.vh + 90) drawEnemy(e, al);
  for (const n of G.npcs) if (n.x > cx - 60 && n.x < cx + VS.vw + 60) drawNPC(n, al);
  for (const f of G.fighters) { if (f === p || f.onBarge || f.dead && f.deadT > 60 || f.x < cx - 90 || f.x > cx + VS.vw + 90) continue; if (f.spawnT > 0 && (G.time >> 2) & 1) continue; drawFighter(f, al); }
  if (showP) drawFighter(p, al);
  if (WORLD.royale) brActors(ctx, al);
  drawStates(ctx, al);
  drawLiquids(ctx, vx0, vx1, vy0, vy1);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawFG(cx, cy, ax0, ay0, offx, offy, tx0, ty0, tw, th, kx0, kx1);
  // ---------- emissive fx (low-res, additive) ----------
  const f = fctx, fx0 = floor(cx), fy0 = floor(cy); f.setTransform(1, 0, 0, 1, 0, 0); f.clearRect(0, 0, fcv.width, fcv.height); f.setTransform(1, 0, 0, 1, -fx0, -fy0);
  const night = 1 - G.dn;
  for (let i = 0; i < pods.length; i += 3) { const X = pods[i], Y = pods[i + 1], k = pods[i + 2]; f.globalAlpha = .25 + .5 * night + .1 * sin(G.time * .05 + X); f.fillStyle = k === 1 ? '#4fd8c8' : k === 2 ? '#e2542b' : '#ffb347'; f.fillRect(X - 1, Y - 1, 3, 3); f.globalAlpha = 1; f.fillStyle = k === 1 ? '#c9fff6' : '#fff1a8'; f.fillRect(X, Y, 1, 1); }
  for (const o of tileObjs.values()) {
    if (o.x < vx0 || o.x > vx1 || o.y < vy0 || o.y > vy1) continue; const px = o.x * T, py = o.y * T, fl = (hh(o.x, o.y, G.time >> 2) * 3) | 0;
    if (o.id === TORCH) { f.globalAlpha = .5 + .1 * fl; f.fillStyle = '#ffb347'; f.fillRect(px + 1, py + 1, 6, 7); f.globalAlpha = 1; f.fillStyle = '#fff1a8'; f.fillRect(px + 3, py + 4, 2, 2); }
    else if (o.id === CAMP) { for (let i = 0; i < 7; i++) { const hg = 4 + ((hh(i, o.x, G.time >> 2) * 9) | 0) - abs(i - 3); f.fillStyle = i % 2 ? '#ffd35a' : '#ff7a2a'; f.fillRect(px + 1 + i, py + 5 - hg, 1, hg); } f.fillStyle = '#fff1a8'; f.fillRect(px + 3, py + 2, 2, 3); }
    else if (o.id === SHRINE && lit) { for (let i = 0; i < 5; i++) { const hg = 4 + ((hh(i, o.x, G.time >> 2) * 7) | 0); f.fillStyle = i % 2 ? '#ffd35a' : '#ff7a2a'; f.fillRect(px + 1 + i, py - 1 - hg, 1, hg); } }
    else if (o.id === SHRINE2) { f.globalAlpha = mirrorOn ? .55 : .2; f.fillStyle = '#8ff5e6'; f.fillRect(px - 2, py - 6, 12, 9); f.globalAlpha = 1; if ((G.time >> 3) % 7 === 0) { f.fillStyle = '#ffffff'; f.fillRect(px + (G.time >> 3) % 8 - 1, py - 5 + ((G.time >> 5) % 4), 1, 1); } }
    else if (o.id === GATE) { const k = .45 + .25 * sin(G.time * .05); f.globalAlpha = k; f.fillStyle = '#e2542b'; f.fillRect(px - 1, py - 5, 8, 6); f.globalAlpha = 1; if (F.vesperDone) { f.fillStyle = '#ffd35a'; f.fillRect(px - 5, py - 9, 2, 2); f.fillStyle = '#8ff5e6'; f.fillRect(px + 9, py - 9, 2, 2); } }
  }
  for (const fi of G.fires) { const a = min(1, fi.life / 40); for (let X = fi.x0; X < fi.x1; X += 2) { const hg = 2 + ((hh(X | 0, fi.y, G.time >> 2) * 7) | 0) * a - abs(X - (fi.x0 + fi.x1) / 2) / 8; if (hg <= 0) continue; f.globalAlpha = .75 * a; f.fillStyle = (X >> 1) & 1 ? '#ffd35a' : '#ff7a2a'; f.fillRect(round(X), round(fi.y - hg), 2, round(hg)); } f.globalAlpha = .18 * a; f.fillStyle = '#ff7a2a'; f.fillRect(round(fi.x0), round(fi.y - 8), round(fi.x1 - fi.x0), 8); } f.globalAlpha = 1;
  for (const v of VENTS) { if (v.cx < cx - 30 || v.cx > cx + VS.vw + 30) continue; for (let k = 0; k < 7; k++) { const span = (v.gy - v.top) * T, yy = v.gy * T - ((G.time * (1.6 + k * .2) + k * 53) % span), xx = v.cx + sin(G.time * .04 + k * 2.1) * 7; if (yy < cy - 10 || yy > cy + VS.vh + 10) continue; f.globalAlpha = .22 * min(1, (v.gy * T - yy) / 40); f.fillStyle = '#dcf7f5'; f.fillRect(round(xx), round(yy), 1, 6); } } f.globalAlpha = 1;
  const nightK = clamp(1.3 - G.dn * 1.5, .15, 1);
  for (const st of STRUCTS) { if (!st.win || st.a < .1 || st.px > cx + VS.vw || st.px + st.fac.cv.width < cx || st.py > cy + VS.vh || st.py + st.fac.cv.height < cy) continue; for (const [wx, wy, ww, wh] of st.fac.win) { const k = nightK * st.a * (.88 + .12 * sin(G.time * .05 + wx * 3)); f.globalAlpha = k * .35; f.fillStyle = '#ff9a3d'; f.fillRect(st.px + wx - 2, st.py + wy - 2, ww + 4, wh + 4); f.globalAlpha = k * .75; f.fillStyle = '#ffb347'; f.fillRect(st.px + wx, st.py + wy, ww, wh); } }
  f.globalAlpha = 1;
  for (const o of tileObjs.values()) { if (o.id !== HEARTH || o.x < vx0 || o.x > vx1 || o.y < vy0 || o.y > vy1) continue; const px = o.x * T, py = o.y * T; for (let i = 0; i < 6; i++) { const hg = 3 + ((hh(i, o.x, G.time >> 2) * 6) | 0) - abs(i - 2.5); f.fillStyle = i % 2 ? '#ffd35a' : '#ff7a2a'; f.fillRect(px - 2 + i, py + 6 - hg, 1, hg); } }
  for (let ty = max(0, vy0); ty <= min(WH - 1, vy1); ty++) for (let tx = max(0, vx0); tx <= min(WW - 1, vx1); tx++) if (tiles[ty * WW + tx] === CINDER && tileAt(tx, ty - 1) !== CINDER) { f.globalAlpha = .22 + .08 * sin(G.time * .05 + tx); f.fillStyle = '#ff7a2a'; f.fillRect(tx * T - 1, ty * T - 5, 10, 7); }
  f.globalAlpha = 1;
  for (const n of G.npcs) { if (n.hidden) continue; f.globalAlpha = .6; f.fillStyle = '#ffb347'; f.fillRect(round(n.x + 3 + n.face * 3) - 1, round(n.y + 2), 3, 3); f.globalAlpha = 1; }
  for (const pr of G.projs) {
    const x = lerp(pr.px, pr.x, al), y = lerp(pr.py, pr.y, al);
    if (pr.type === 'wave') { const d = sign(pr.vx) || 1; arcTrail(f, x - d * 9, y, d, -1.15, 1.15, 8, 14, 1, true); }
    else if (pr.type === 'bolt') { f.globalAlpha = .35; f.fillStyle = pr.owner ? '#8ff5e6' : '#ff7a2a'; f.fillRect(x - 5, y - 5, 10, 10); f.globalAlpha = 1; f.drawImage(SPR.bolt, round(x) - 3, round(y) - 3); }
    else if (pr.type === 'bomb') { const X = round(x), Y = round(y); f.globalAlpha = .45; f.fillStyle = '#ff7a2a'; f.fillRect(X - 3, Y - 2, 7, 5); f.fillRect(X - 2, Y - 3, 5, 7); f.globalAlpha = .9; f.fillStyle = '#ffd35a'; f.fillRect(X - 1, Y - 1, 3, 3); f.fillStyle = '#fff'; f.fillRect(X, Y, 1, 1); f.globalAlpha = 1; }
    else if (pr.type === 'arrow') { f.globalAlpha = .55; f.fillStyle = '#ffd35a'; const an = atan2(pr.vy, pr.vx); for (let i = 1; i < 6; i++) f.fillRect(round(x - cos(an) * i * 2), round(y - sin(an) * i * 2), 1, 1); f.globalAlpha = 1; }
    else if (pr.type === 'shock') { for (let i = -2; i <= 2; i++) { const hgt = 5 + ((hh(i, pr.t, 7) * 9) | 0) - abs(i) * 2; f.fillStyle = i % 2 ? '#ffd35a' : '#ff7a2a'; f.fillRect(round(x) + i, y + 4 - hgt, 1, hgt); } }
  }
  for (const fi of G.fighters) if (fi.atk && fi.atk.phase === 1 && !fi.dead && (fi !== p || showP)) liveTrail(f, fi, al);
  for (const t of G.trails) {
    const u = t.life / t.max;
    if (t.kind === 'arc') arcTrail(f, t.x, t.y, t.face, t.a0 + (t.a1 - t.a0) * (1 - u) * .6, t.a1, t.r0, t.r1, u, t.hot, t.cold, t.sty);
    else if (t.kind === 'stab') stabTrail(f, t.x, t.y, t.face, t.th, t.r1, u);
    else if (t.kind === 'dent') { const R = t.r * (1.25 - u * .55); f.globalAlpha = u * .9; f.strokeStyle = t.col; f.lineWidth = 1; f.beginPath(); f.arc(t.x, t.y, R, 0, TAU); f.stroke(); f.globalAlpha = 1; }
    else if (t.kind === 'glint') { const L = 1 + 4 * sin(u * PI); f.globalAlpha = min(1, u * 1.5); f.fillStyle = '#ffffff'; f.fillRect(round(t.x - L), round(t.y), round(L * 2) + 1, 1); f.fillRect(round(t.x), round(t.y - L), 1, round(L * 2) + 1); f.fillStyle = t.col; f.fillRect(round(t.x) - 1, round(t.y) - 1, 3, 3); f.globalAlpha = 1; }
    else if (t.kind === 'ring') { const R = t.r * (1.15 - u * .8); f.globalAlpha = u; f.strokeStyle = '#fff1a8'; f.lineWidth = 2; f.beginPath(); f.ellipse(t.x, t.y - 1, R, R * .22, 0, 0, TAU); f.stroke(); f.globalAlpha = 1; }
    else if (t.kind === 'hit') { const len = (t.big ? 10 : 6) * (1.5 - u * .5); f.globalAlpha = u; f.strokeStyle = '#ffffff'; f.lineWidth = 1; f.beginPath(); for (let i = 0; i < 4; i++) { const an = t.a + i * PI / 2 + (i & 1 ? .3 : 0), l2 = i & 1 ? len * .55 : len; f.moveTo(t.x - cos(an) * 1.5, t.y - sin(an) * 1.5); f.lineTo(t.x + cos(an) * l2, t.y + sin(an) * l2); } f.stroke(); f.globalAlpha = 1; }
    else if (t.kind === 'warn') { f.globalAlpha = .2 + .25 * ((G.time >> 2) & 1); f.fillStyle = '#ff3b2a'; f.fillRect(t.x - 1, t.y - 150, 2, 150); f.fillRect(t.x - 5, t.y - 2, 10, 2); f.globalAlpha = 1; }
    else if (t.kind === 'beam' || t.kind === 'aim') drawBeamTrail(f, t, u);
  }
  for (const q of G.parts) { if (!q.glow) continue; f.globalAlpha = min(1, q.life / q.max * 1.6); f.fillStyle = q.col; f.fillRect(floor(q.x), floor(q.y), q.sz, q.sz); } f.globalAlpha = 1;
  if (showP && !p.dead) { const prx = lerp(p.px, p.x, al) + 3, pry = lerp(p.py, p.y, al) + p.h; f.globalAlpha = .55 + .2 * sin(G.time * .1); f.fillStyle = '#ff9a3d'; f.fillRect(round(prx + p.face * .5) - 1, round(pry - 14), 2, 2); f.globalAlpha = 1; }
  for (const e of G.enemies) {
    if (e.dead) continue; const ex = lerp(e.px, e.x, al), ey = lerp(e.py, e.y, al);
    if (e.type === 'husk') { f.fillStyle = e.state === 'windup' ? '#fff1a8' : '#ff7a2a'; f.fillRect(round(ex + 3 + e.dir * 2), round(ey + 3), 2, 1); if (e.state === 'windup' && e.t > 4) textO(f, '!', round(ex + 2), round(ey - 11), (G.time >> 1) & 1 ? '#ff3b2a' : '#ffd35a'); }
    else if (e.type === 'mite' && e.state === 'tele') textO(f, '!', round(ex + 3), round(ey - 11), (G.time >> 1) & 1 ? '#ff3b2a' : '#c9fff6');
    else if (e.type === 'boss' && e.state !== 'tired') { const look = clamp(round((p.x - e.x - 20) / 40), -2, 2); f.fillStyle = e.phase === 2 ? '#fff1a8' : '#ff8a3d'; f.globalAlpha = .8; for (const q of [-12, 8]) f.fillRect(round(ex + 20 + q + look), round(ey + 16 - 5), 3, 3); f.fillStyle = '#ffd35a'; f.globalAlpha = .5 + e.core * .5; f.fillRect(round(ex + 18 - e.core * 2), round(ey - 1 - e.core * 2), 4 + e.core * 4, 5 + e.core * 4); f.globalAlpha = 1; }
  }
  ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(fcv, (fx0 - cx) * S, (fy0 - cy) * S, fcv.width * S, fcv.height * S); ctx.globalCompositeOperation = 'source-over';
  // ---------- unlit overlays in world space ----------
  ctx.setTransform(S, 0, 0, S, -ox, -oy);
  if (G.state === 'play') {
    if (WORLD.royale) brOverlay(ctx, al, cx, cy);
    for (const e of G.enemies) if (!e.dead && !e.root && e.type !== 'boss' && !e.boss && e.hp < e.maxhp) { const x = round(lerp(e.px, e.x, al) + e.w / 2 - 6), y = round(lerp(e.py, e.y, al) - 5); ctx.fillStyle = INK; ctx.fillRect(x - 1, y - 1, 14, 3); ctx.fillStyle = '#e2483b'; ctx.fillRect(x, y, round(12 * max(0, e.hp) / e.maxhp), 1); }
    drawFlowTags(ctx);
    for (const n of G.nums) { ctx.globalAlpha = min(1, n.life / 12); const tw2 = textW(n.text, n.sc); textO(ctx, n.text, round((n.x - tw2 / 2) * S) / S, round(n.y * S) / S, n.col, n.sc); } ctx.globalAlpha = 1;
    drawAim(ctx, S);
  }
  // ---------- screen space ----------
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(vig, 0, 0, W, H); dimOverlay(ctx, W, H, cx, cy); if (WORLD.royale && G.state === 'play') brScreen(ctx, W, H);
  if (G.state === 'play' && p.hp < 30 && !p.dead) { ctx.globalAlpha = (.35 + .2 * sin(G.time * .12)) * (1 - p.hp / 30) + .1; ctx.drawImage(vigR, 0, 0, W, H); ctx.globalAlpha = 1; }
  ctx.imageSmoothingEnabled = false;
  if (b && b.state === 'intro') G.barT = max(G.barT || 0, min(1, b.t / 30, (150 - b.t) / 20));
  if (G.bars > .01) { const k = round(ease.io(G.bars) * H * .11); ctx.fillStyle = INK; ctx.fillRect(0, 0, W, k); ctx.fillRect(0, H - k, W, k); }
  if (G.state === 'play' && p && p.st && p.st.blind > 0) { ctx.globalAlpha = min(.85, p.st.blind / 40); ctx.imageSmoothingEnabled = true; ctx.drawImage(vig, -W * .4, -H * .4, W * 1.8, H * 1.8); ctx.fillStyle = 'rgba(30,26,40,.55)'; ctx.fillRect(0, 0, W, H); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 1; }
  if (G.state === 'play' && p && liqAt(p.x + 3, p.y + 3) === 1) { ctx.fillStyle = 'rgba(40,110,150,.16)'; ctx.fillRect(0, 0, W, H); }
  if (G.flash > .01) { ctx.fillStyle = `rgba(${G.flashCol},${min(.4, G.flash * .65)})`; ctx.fillRect(0, 0, W, H); }
  if (G.slowT > 0) { ctx.fillStyle = 'rgba(80,220,230,.06)'; ctx.fillRect(0, 0, W, H); }
  ctx.setTransform(VS.ui, 0, 0, VS.ui, 0, 0); mouse.ux = mouse.x / VS.ui; mouse.uy = mouse.y / VS.ui;
  if (G.state === 'play') drawTags(ctx, cx, cy, al);
  drawUI(ctx);
}
function drawStates(c, al) {
  const ent = [...G.fighters, ...G.enemies];
  for (const e of ent) {
    const s = e.st; if (!s || e.dead) continue; const x = lerp(e.px, e.x, al), y = lerp(e.py, e.y, al);
    if (s.pin > 0) { const sx = s.pinS ? x + e.w / 2 + s.pinS * (e.w / 2 + 1) : x + e.w / 2, sy = s.pinS ? y + e.h * .35 : y + e.h - 2; c.drawImage(SPR.shuriken[0], round(sx) - 2, round(sy) - 2); if (!s.pinS) { c.drawImage(SPR.shuriken[1], round(x) - 2, round(y + e.h) - 3); c.drawImage(SPR.shuriken[1], round(x + e.w) - 2, round(y + e.h) - 3); } }
    const by = s.hookBy; if ((s.hook > 0 || s.reel > 0) && by && !by.dead) chainLine(c, lerp(by.px === undefined ? by.x : by.px, by.x, al) + 3 + (by.face || by.dir || 1) * 4, lerp(by.py === undefined ? by.y : by.py, by.y, al) + 8, x + e.w / 2, y + e.h * .4);
  }
  for (const pr of G.projs) if (pr.type === 'hook' && pr.owner) { const o = pr.owner; chainLine(c, o.x + 3 + (o.face || o.dir || 1) * 4, o.y + (o.h > 22 ? 14 : 8), lerp(pr.px, pr.x, al), lerp(pr.py, pr.y, al)); }
  for (const f of G.fighters) if (f.grap) chainLine(c, f.x + 3, f.y + 8, f.grap.x, f.grap.y);
  for (const sm of G.smokes) { const k = sm.life / sm.max, R = sm.r * (.6 + .4 * (1 - k)); c.globalAlpha = .55 * min(1, k * 3); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + G.time * .004 * (i & 1 ? 1 : -1), rr = R * (.35 + .4 * hh(i, 3, 7)), px = sm.x + cos(a) * rr, py = sm.y + sin(a) * rr * .6; c.fillStyle = i % 3 === 0 ? '#a19baa' : i % 3 === 1 ? '#8d8794' : '#726c7c'; c.beginPath(); c.arc(round(px), round(py), R * (.45 + .2 * hh(i, 5, 9)), 0, TAU); c.fill(); } c.globalAlpha = 1; }
}
function chainLine(c, x0, y0, x1, y1) { const d = hypot(x1 - x0, y1 - y0), n = max(1, floor(d / 3)); for (let i = 0; i <= n; i++) { const u = i / n, sag = sin(u * PI) * min(6, d * .05); c.fillStyle = i & 1 ? '#7f8898' : '#e8edf2'; c.fillRect(round(lerp(x0, x1, u)) - .5, round(lerp(y0, y1, u) + sag) - .5, 1.5, 1.5); } }
let RFRAME = 0; const LIT2 = [1, 1, 1], BAYER = [];
function buildBayer() {
  const M = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
  [tcv, tctx] = mk(220, 220);
  for (let lv = 0; lv <= 16; lv++) { const [c, x] = mk(8, 8); x.fillStyle = '#fff'; for (let i = 0; i < 64; i++) if (M[i] < lv * 4) x.fillRect(i % 8, i >> 3, 1, 1); BAYER.push(tctx.createPattern(c, 'repeat')); }
}
// water and molten cinder: drawn over actors so they look submerged
function drawLiquids(c, x0, x1, y0, y1) {
  for (let ty = max(0, y0); ty <= min(WH - 1, y1); ty++) for (let tx = max(0, x0); tx <= min(WW - 1, x1); tx++) {
    const t = tiles[ty * WW + tx]; if (t !== WATER && t !== CINDER) continue;
    const above = tileAt(tx, ty - 1), surf = above !== t && !TP[above].full, px = tx * T, py = ty * T, o = surf ? (sin(tx * .9 + G.time * .07) > .35 ? 1 : 0) : 0;
    if (t === WATER) {
      const li = (ty - LY0) * LW + (tx - LX0); let r = 1, g = 1, b = 1; if (li >= 0 && li < LW * LH) { r = min(1, .12 + lr[li] * 1.05); g = min(1, .12 + lg[li] * 1.05); b = min(1, .16 + lb[li] * 1.05); }
      c.fillStyle = `rgba(${44 * r + 8 | 0},${118 * g + 10 | 0},${158 * b + 14 | 0},${surf ? .5 : .6})`; c.fillRect(px, py + o, T, T - o);
      if (surf) { c.fillStyle = `rgba(${170 * r | 0},${226 * g | 0},${240 * b | 0},.85)`; c.fillRect(px, py + o, T, 1); if ((tx + (G.time >> 4)) % 5 === 0) { c.fillStyle = `rgba(255,255,255,${.5 * g})`; c.fillRect(px + 2, py + o + 2, 3, 1); } }
    } else {
      c.fillStyle = surf ? '#e2542b' : '#a83a1e'; c.fillRect(px, py + o, T, T - o);
      if (surf) { c.fillStyle = '#ffb347'; c.fillRect(px, py + o, T, 1); c.fillStyle = '#ff7a2a'; c.fillRect(px, py + o + 1, T, 2); }
      const k = hh(tx, ty, G.time >> 3); if (k > .8) { c.fillStyle = k > .93 ? '#fff1a8' : '#ffd35a'; c.fillRect(px + ((k * 37) | 0) % 7, py + o + 2 + ((k * 53) | 0) % 5, 1 + (k > .9), 1); }
    }
  }
}
// the foreground: facades, fences and foliage in front of actors. Opaque pixels only (fades are dithered), so the light multiply is exact
function drawFG(cx, cy, ax0, ay0, offx, offy, tx0, ty0, tw, th, kx0, kx1) {
  const g = gctx, S = VS.s; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, gcv.width, gcv.height); g.setTransform(1, 0, 0, 1, -ax0, -ay0);
  const uni = []; let any = false;
  for (const st of STRUCTS) {
    const fw = st.fac.cv.width, fh = st.fac.cv.height; if (st.a < .04 || st.px > cx + VS.vw || st.px + fw < cx || st.py > cy + VS.vh || st.py + fh < cy) continue; any = true;
    if (st.a > .96) g.drawImage(st.fac.cv, st.px, st.py);
    else { const tx = tctx; tx.globalCompositeOperation = 'copy'; tx.drawImage(st.fac.cv, 0, 0); tx.globalCompositeOperation = 'destination-in'; tx.fillStyle = BAYER[round(st.a * 16)]; tx.fillRect(0, 0, fw, fh); tx.globalCompositeOperation = 'source-over'; g.drawImage(tcv, 0, 0, fw, fh, st.px, st.py, fw, fh); }
    if (st.mode === 'fade') uni.push(st);
  }
  for (let k = kx0; k <= kx1; k++) { const bk = FGPB.get(k); if (bk) for (const q of bk) if (q.rf !== RFRAME && q.x < cx + VS.vw && q.x + q.img.width > cx && q.y < cy + VS.vh && q.y + q.img.height > cy) { q.rf = RFRAME; g.drawImage(q.img, q.x, q.y); any = true; } }
  if (!any) return;
  const l = glctx; l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'copy'; l.imageSmoothingEnabled = true; l.drawImage(lmc, 0, 0, tw, th, tx0 * T - ax0, ty0 * T - ay0, tw * T, th * T); l.imageSmoothingEnabled = false; l.globalCompositeOperation = 'source-over';
  for (const st of uni) { lightSample(st.lx * T + 4, st.ly * T + 4, LIT2); l.fillStyle = `rgb(${min(255, LIT2[0] * 250) | 0},${min(255, LIT2[1] * 250) | 0},${min(255, LIT2[2] * 250) | 0})`; l.fillRect(st.px - ax0, st.py - ay0, st.fac.cv.width, st.fac.cv.height); }
  l.globalCompositeOperation = 'destination-in'; l.drawImage(gcv, 0, 0); l.globalCompositeOperation = 'source-over';
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply'; g.drawImage(glcv, 0, 0); g.globalCompositeOperation = 'source-over';
  ctx.drawImage(gcv, offx, offy, gcv.width * S, gcv.height * S);
}
// facades fade when you are inside; see-through dressing thins out when you are behind it
function tickStructs() {
  const p = G.p; if (!p) return; const px = p.x + 3, py = p.y + p.h * .5;
  for (const s of STRUCTS) {
    let tgt = s.base || 1; const fw = s.fac.cv.width, fh = s.fac.cv.height;
    if (s.mode === 'fade') { if (px >= s.x0 * T && px < (s.x1 + 1) * T && py >= s.y0 * T - 6 && py < (s.y1 + 1) * T) tgt = 0; }
    else if (p.x + p.w > s.px + 3 && p.x < s.px + fw - 3 && p.y + p.h > s.py + 2 && p.y < s.py + fh) tgt = s.see;
    s.inside = tgt < .5; s.a = approach(s.a, tgt, .08);
    if (s.fac.smoke.length && G.time % 10 === 0 && abs(s.px - G.cam.x - VS.vw / 2) < VS.vw) for (const [sx, sy] of s.fac.smoke) P(s.px + sx + frand(-1, 1), s.py + sy, frand(-.05, .25), frand(-.45, -.3), 150, fpick(['#8d8794', '#a19baa', '#726c7c']), { g: -.0015, fr: .992 });
  }
}
// names over other fighters, and the [F] prompt, drawn at interface scale
function drawTags(c, cx, cy, al) {
  const k = VS.s / VS.ui, ux = x => round((x - cx) * k), uy = y => round((y - cy) * k);
  for (const f of G.fighters) {
    if (f === G.p || f.dead || f.yielded || f.onBarge) continue; const x = lerp(f.px, f.x, al) + 3, y = lerp(f.py, f.y, al) - 8;
    if (x < cx - 20 || x > cx + VS.vw + 20) continue;
    const col = f.remote ? '#8ff5e6' : f.echoBot ? '#d8d4e6' : f.skin === 4 ? '#c9fff6' : '#fff', X = ux(x), Y = uy(y) - 10;
    if (!f.isBoss) { textC(c, f.name, X, Y, col, 1, textO); if (f.away) textC(c, 'away', X, Y - 8, '#8b8fa3', 1, textO); c.fillStyle = INK; c.fillRect(X - 9, Y + 9, 18, 3); c.fillStyle = f.remote ? '#4fd8c8' : '#e2483b'; c.fillRect(X - 8, Y + 10, round(16 * clamp(f.hp / f.maxhp, 0, 1)), 1); }
  }
  const o = !G.dialog && !UI.open && nearestInteract();
  if (o) textC(c, '[F] ' + o.label, ux(o.x), uy(o.y - 32) + round(sin(G.time * .08) * 1.5), '#fff1a8', 1, textO);
}

function ambient() {
  const b = G.biome, cx = G.cam.x, cy = G.cam.y;
  if (b === 'reach' && G.time % 3 === 0) P(cx + frand(-20, VS.vw + 60), cy - 4, frand(-.5, -.15), frand(.3, .7), 340, fpick(['#ffffff', '#dcf7f5', '#b4e6e8']), { g: 0, fr: 1 });
  else if (b === 'moor' && G.time % 7 === 0) P(cx + frand(VS.vw), cy + VS.vh * frand(.4, 1.1), frand(-.15, .15), frand(-.35, -.12), 260, fpick(['#ffa07c', '#f06a55', '#ffc2a0']), { g: -.0008, fr: .998, glow: G.dn < .5 ? 1 : 0 });
  else if (b === 'scoria' && G.time % 4 === 0) P(cx + VS.vw + 4, cy + frand(VS.vh), frand(-2.2, -1.2), frand(-.1, .2), 260, fpick(['#d67645', '#bd5a36', '#f0b070']), { g: 0, fr: 1 });
  else if ((b === 'ash' || b === 'ring') && G.time % 4 === 0) { if (Math.random() < .5) P(cx + frand(VS.vw), cy + VS.vh * frand(.3, 1), frand(-.2, .2), frand(-.5, -.2), 200, fpick(SPARK), { g: -.002, fr: 1, glow: 1 }); else P(cx + frand(VS.vw + 40), cy - 4, frand(-.4, -.1), frand(.3, .6), 340, '#a19baa', { g: 0, fr: 1 }); }
  else if (b === 'deep' && G.time % 9 === 0) P(cx + frand(VS.vw), cy + frand(VS.vh), frand(-.1, .1), frand(-.1, .1), 200, fpick(['#4fd8c8', '#8ff5e6']), { g: 0, fr: 1, glow: 1 });
}
function snapCam() { const p = G.p; G.cam.x = G.cam.px = camX(p.x + 3 - VS.vw / 2); G.cam.y = G.cam.py = camY(p.y + 4 - VS.vh / 2 - 8); }
function tickCam() {
  const c = G.cam, p = brCamTarget() || G.p; c.px = c.x; c.py = c.y;
  const lx = (mouse.x / VS.s - VS.vw / 2) * .15, ly = (mouse.y / VS.s - VS.vh / 2) * .15, free = !UI.open && !G.dialog && !G.cine && !G.link;
  const spy = G.spy && free && !WORLD.arena && hasItem('spyglass') ? 1 : 0; if (G.spy && !spy && !hasItem('spyglass')) G.spy = false;
  let tx = p.x + 3 - VS.vw / 2 + (free ? lx * (1 + spy * 9) : 0), ty = p.y + 4 - VS.vh / 2 + (free ? ly * (1 + spy * 7) : 0) - (G.boss ? 22 : 8), k = spy ? .06 : .14;
  const ci = G.cine;
  if (ci) { const u = ci.t < 70 ? ease.io(ci.t / 70) : ci.t > ci.dur - 50 ? 1 - ease.io((ci.t - ci.dur + 50) / 50) : 1; tx = lerp(tx, ci.x - VS.vw / 2, u); ty = lerp(ty, ci.y - VS.vh / 2, u); k = .2; }
  else if (G.link) { const L = G.link, e = L.e, f = L.f; tx = (f.x + e.x + e.w / 2 + 3) / 2 - VS.vw / 2; ty = (f.y + e.y + e.h / 2 + 4) / 2 - VS.vh / 2 - 6; k = .2; }
  else if (G.boss && G.boss.type === 'keeper' && G.boss.state === 'intro') { tx = lerp(tx, G.boss.x - VS.vw / 2, .7); ty = lerp(ty, G.boss.y - VS.vh / 2, .7); }
  c.x += (tx - c.x) * k; c.y += (ty - c.y) * k; c.x = camX(c.x); c.y = camY(c.y);
  G.zoom += ((G.link ? G.zoomT : 1) - G.zoom) * .12; if (abs(G.zoom - 1) < .004) G.zoom = 1;
}
function refreshFoes() {
  const fs = G.fighters;
  for (const f of fs) {
    const arr = f.foes; arr.length = 0; if (f.remote) continue;
    for (const o of fs) if (o !== f && !o.dead && !o.noHit && o.team !== f.team) arr.push(o);
    if (f.team === 'p') for (const e of G.enemies) if (!e.dead) arr.push(e);
  }
}
function tick() {
  if (WORLD.endless && G.p) streamTo(G.p.x + 3);
  G.time++; if (!WORLD.arena) { G.clock = (G.clock + 1 / 36000) % 1; G.played += 1 / 60; } updateSun();
  if (G.dialog && !WORLD.arena && !netLive()) { tickParts(); tickStory(); tickCam(); endTick(); return; }
  coopTick();
  refreshFoes(); tickPlayer();
  for (const f of G.fighters) { if (f === G.p) continue; if (f.remote) { if (f.coop || f.ghostH) coopReplay(f); else tickRemote(f); } else if (f.ai) { if (f.onBarge) brBotRide(f); else { tickFighter(f, f.brBot ? brBotThink(f) : aiThink(f)); if (f.brBot) brBotAfter(f); } } }
  if (G.duel) tickDuel();
  tickEnemies(); spawnTick(); tickDrops(); tickProjs(); tickParts(); tickStory(); tickStructs(); if (!netGuest()) tickLiquids(); tickCam(); ambient();
  if (!WORLD.arena) { tickFalling(); tickFelled(); tickRubble(); tickDoors(); tickDrill(); tickStations(); if (!G.away) tickHunger(); if (!netGuest()) tickRegrow(); tickDims(); tickLairs(); tickBless(); tickFurniture(); tickMeal(); if (G.time % 20 === 0) { mapReveal(); G.magR = hasUtil('magnet') ? 76 : 36; } }
  if (WORLD.arena) arenaTick();
  if (G.combo.t > 0 && --G.combo.t <= 0) { G.combo.n = 0; G.combo.pts = 0; }
  if (G.slowT > 0) G.slowT--; if (G.selT > 0) G.selT--;
  G.bars = approach(G.bars || 0, max(G.barT || 0, G.cine || G.link ? 1 : 0), .08); G.barT = 0;
  if (G.savedNote && ++G.savedNote.t > 120) G.savedNote = null;
  if (!WORLD.arena && WORLD.id && G.dirty && ++G.saveT > 3600) saveWorld(true);
  G.fighters = G.fighters.filter(f => !f.gone);
  endTick();
}
function endTick() { G.shake *= .86; G.flash *= .88; for (const k in pressed) pressed[k] = false; mouse.lp = mouse.rp = mouse.hp = false; }
let lastT = 0, acc = 0;
function frame(now) {
  // alone, a slow moment just slows the game; with friends here it must keep time, so it catches up
  const shared = netLive() || (BR.on && BR.via !== 'solo'), dt = min(shared ? .5 : .1, (now - lastT) / 1000 || 0); lastT = now; rafT = performance.now(); G.away = false;
  try { sigTick(); if (COOP.role) pingTick(rafT); coopRetryTick(rafT); netKeepAwake(!!(SIG.code || COOP.role || (BR.on && BR.via !== 'solo'))); } catch (e) { console.warn('net', e); }
  if (G.manual) { requestAnimationFrame(frame); return; }
  if (G.state === 'play' && (UI.open !== 'pause' || WORLD.arena || netLive())) {
    G.tscale += ((G.slowT > 0 ? .3 : 1) - G.tscale) * .25; acc += dt * 60 * G.tscale; let n = 0;
    const most = shared ? 30 : 6;
    while (acc >= 1 && n < most) { if (G.hitstop > 0) { G.hitstop--; tickParts(); G.shake *= .86; if (WORLD.arena && G.time % 3 === 0) netSend(); } else tick(); acc -= 1; n++; }
    if (n >= most) acc = 0;
  } else {
    G.time++; if (G.state !== 'play') { G.clock = (G.clock + 1 / 20000) % 1; } updateSun(); tickParts(); const c = G.cam; c.px = c.x; c.py = c.y;
    if (G.state !== 'play' && G.state !== 'intro') { c.x += .3; if (WORLD.endless) { streamTo(c.x + VS.vw / 2); if (c.x > (SPAWN_X + 600) * T) c.x = c.px = (SPAWN_X - 200) * T; } else if (c.x > WW * T - VS.vw - 2) c.x = c.px = 0; const hx = clamp(floor((c.x + VS.vw / 2) / T), 0, WW - 1); c.y += (camY(heights[hx] * T - VS.vh * .62) - c.y) * .02; c.x = camX(c.x); }
    if (G.state === 'intro') G.introT++;
    if (BR.on && G.state === 'brlobby') brLobbyTick();
    G.shake *= .86; G.flash *= .88; acc = 1;
    if (WORLD.arena && G.state === 'play' && G.time % 3 === 0) netSend();
  }
  render(G.hitstop > 0 || G.state !== 'play' ? 1 : clamp(acc, 0, 1));
  requestAnimationFrame(frame);
}
// ---------------- while the window is hidden ----------------
// With friends here the world must not stop when you switch away: the game keeps
// ticking (without drawing) on a timer browsers don't freeze, and your Waker rests,
// safe from harm and hunger, until you come back. Alone, the game simply pauses.
let rafT = 0, bgLast = 0;
function bgStep() {
  const now = performance.now(); if (now - rafT < 400) { bgLast = now; return; }
  try { sigTick(); if (COOP.role) pingTick(now); } catch (e) { }
  const live = netLive() || (BR.on && BR.via !== 'solo' && (G.state === 'play' || G.state === 'brlobby'));
  if (!live || G.manual) { bgLast = now; return; }
  const dt = min(.5, (now - (bgLast || now)) / 1000); bgLast = now; G.away = !WORLD.arena;
  try {
    if (G.state === 'play') { acc += dt * 60; let n = 0; while (acc >= 1 && n < 40) { if (G.hitstop > 0) G.hitstop--; else tick(); acc -= 1; n++; } if (n >= 40) acc = 0; }
    else if (BR.on && G.state === 'brlobby') brLobbyTick();
  } catch (e) { console.warn('bg', e); }
}
(function bgTimer() {
  setInterval(bgStep, 250);
  try { const w = new Worker(URL.createObjectURL(new Blob(['setInterval(function(){postMessage(0)},50)'], { type: 'text/javascript' }))); w.onmessage = bgStep; w.onerror = () => { }; } catch (e) { }
})();
function freshSession() {
  Object.assign(G, {
    time: 0, hitstop: 0, shake: 0, tscale: 1, slowT: 0, enemies: [], fighters: [], npcs: [], drops: [], projs: [], nums: [], parts: [], trails: [], ghosts: [], flags: {}, combo: { n: 0, t: 0, pts: 0 }, feed: [], picks: [], kfeed: [],
    boss: null, duel: null, flash: 0, spawnT: 200, biome: '', biomeT: 0, sel: 0, selT: 0, known: new Set(), movesUsed: new Set(), journal: ['waking', 'forge'], jNew: false, q: 0, qFlash: 0, says: [], sayCur: null,
    note: null, banner: null, dialog: null, kills: 0, deaths: 0, played: 0, dirty: false, saveT: 0, savedNote: null, clock: .1, introI: 0, introT: 0, echoT: 60,
    leads: new Set(), pin: null, found: new Set(), linksKnown: new Set(), fam: {}, arts: new Set(), artk: {}, respawn: null, fires: [], smokes: [], stuck: [], link: null, zoom: 1, zoomT: 1, armT: 0, linkBanner: null, leadDone: null, cine: null, bars: 0,
    falling: [], felled: [], rubble: [], autoDoors: [], regrow: [], lairs: new Set(), bless: null, blessUsed: {}, ev: null, dev: null, devT: 2400, evClock: undefined, dhaz: [], echoes: new Set(), beasts: {}, gear: { head: null, body: null, legs: null, feet: null, off: null }, trink: [], meal: null, rest: 0, nearWarm: false, nearFount: false, mast: {}, pairsKnown: new Set(), drill: null, food: 100, worn: new Set(), spy: false, lampOff: false, quality: {}, reqs: null, seen: null, hintT: -999
  });
  for (const k in YACC) delete YACC[k]; INV_N = packCap(); mapReset();
  UI.open = null; UI.held = null; UI.scroll = 0; acc = 0;
}
function beginPlay(fresh) {
  G.state = 'play'; snapCam(); acc = 0;
  if (fresh && WORLD.mode === 0) { say('You are standing. Good. The blade remembers more than you do.'); say('Someone is keeping a fire in the square. Walk over and press F.'); say('Left click strikes. Right click or Q strikes heavy. Shift slips past a blow. [C] lists every form.'); learn('wick', true); G.pin = 'wick'; }
  else G.banner = { text: (WORLD.name || 'WORLD').toUpperCase(), sub: fresh ? 'a free forge' : 'welcome back, Waker', t: 0 };
  if (!SETTINGS.tip1 && !WORLD.arena) { SETTINGS.tip1 = 1; saveSettings(); say('Hold left click to keep punching or swinging. Click a creature to hit it, whatever you hold.'); say('Esc opens the menu: CONTROLS and DIFFICULTY live there.'); }
}
function advance() { if (G.state === 'intro') { if (G.introT < 20) return; if (++G.introI >= INTRO.length) beginPlay(true); else { G.introT = 0; sfx('ui'); } } }
function quitToTitle() {
  if (BR.on) { brLeave(); return; }
  if (WORLD.arena) netLeave(); else if (netGuest()) coopLeave(); else { saveWorld(true); coopLeave(); }
  G.dialog = null; UI.open = null; G.state = 'title'; WORLD.guest = false; G.boss = null; G.duel = null; G.enemies = []; G.projs = [];
  WORLD.id = ''; sfx('ui');
}
// ---------------- input ----------------
function setMouse(e) { const r = cv.getBoundingClientRect(); mouse.x = (e.clientX - r.left) * (cv.width / r.width); mouse.y = (e.clientY - r.top) * (cv.height / r.height); mouse.ux = mouse.x / VS.ui; mouse.uy = mouse.y / VS.ui; }
addEventListener('keydown', e => {
  const k = e.code;
  if (UI.focus && G.state !== 'play') {
    if (!e.metaKey && !e.ctrlKey) e.preventDefault();
    if (k === 'Backspace') { FORM[UI.focus] = FORM[UI.focus].slice(0, -1); e.preventDefault(); return; }
    if (k === 'Enter' || k === 'Tab' || k === 'Escape') { UI.focus = null; e.preventDefault(); return; }
    if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      const password = UI.focus === 'accountPassword' || UI.focus === 'accountConfirm', lim = password ? 64 : UI.focus === 'name' ? 24 : UI.focus === 'seed' ? 18 : UI.focus === 'gcode' ? 6 : 12;
      if (FORM[UI.focus].length < lim && (password ? !/[\u0000-\u001f]/.test(e.key) : /[A-Za-z0-9 _\-'.]/.test(e.key))) FORM[UI.focus] += UI.focus === 'nick' ? e.key.toUpperCase() : UI.focus === 'code' ? e.key.toLowerCase() : e.key;
      e.preventDefault();
    }
    return;
  }
  if (!e.ctrlKey && !e.metaKey && (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Escape', 'ShiftLeft', 'ShiftRight', 'Backspace'].includes(k) || k.startsWith('Key') || k.startsWith('Digit'))) e.preventDefault();
  if (e.repeat) return; keys[k] = true; pressed[k] = true;
  if (G.state === 'intro') { if (k === 'Enter' || k === 'Space') { audioInit(); advance(); } return; }
  if (G.state === 'brlobby') { if (k === 'Escape') { brLeave(); sfx('ui'); } return; }
  if (G.state !== 'play') { if (k === 'Escape') { if (G.state === 'accounts' && !ACCOUNT.active) return; G.state = ['create', 'wcopy', 'wpaste'].includes(G.state) ? 'worlds' : 'title'; if (G.state === 'accounts') ACCOUNT.form = 'list'; if (G.state === 'title' && COOP.role) coopLeave(); sfx('ui'); } return; }
  if (G.dialog) { if (k === 'KeyF' || k === 'Space' || k === 'Enter' || k === 'KeyE') { dialogAdvance(); pressed[k] = false; } return; }
  if (k === 'Escape' || k === 'KeyP') { if (UI.open) { closeUI(); sfx('ui'); } else toggleUI('pause'); return; }
  if ((k === 'Enter' || k === 'NumpadEnter') && chatKey()) return;
  if (k === 'KeyM' && WORLD.royale) { if (G.p && G.p.onBarge) BR.mapHide = !BR.mapHide; else BR.mapOpen = !BR.mapOpen; sfx('ui'); return; }
  if (k === 'KeyO' || k === 'KeyM' && (WORLD.arena || !hasUtil('fieldmap'))) { muted = !muted; G.banner = { text: muted ? 'SOUND OFF' : 'SOUND ON', sub: '[O] toggles sound', t: 0 }; return; }
  if (k === 'KeyM') { toggleUI('map'); return; }
  if (k === 'KeyC') { toggleUI('codex'); return; }
  if (k === 'KeyG' && !UI.open) { dropSelected(e.shiftKey); return; }
  if (k.startsWith('Digit')) { const n = +k[5], i = n === 0 ? 9 : n - 1; if (i < hotN()) { G.sel = i; G.selT = 120; if (G.p.atk && G.p.atk.phase < 2) endAttack(G.p); } return; }
  if (WORLD.royale && k === 'KeyE') { toggleUI('inv'); return; }
  if (WORLD.arena) return;
  if (k === 'KeyE' || k === 'Tab') toggleUI('inv'); else if (k === 'KeyJ') toggleUI('journal');
  else if (k === 'KeyK' && (hasItem('rock') || hasItem('flint'))) toggleUI('knap');
  else if (k === 'KeyB') toggleUI('book');
});
addEventListener('keyup', e => { keys[e.code] = false; });
cv.addEventListener('mousemove', setMouse);
cv.addEventListener('mousedown', e => {
  e.preventDefault(); setMouse(e); audioInit(); if (AC && AC.state === 'suspended') AC.resume(); try { cv.focus(); } catch (_) { }
  if (G.state === 'intro') { advance(); return; }
  if (e.button === 0) { mouse.held = true; mouse.hp = true; }
  if (uiMouseDown(e.button)) return;
  if (G.state !== 'play') return;
  if (e.button === 2 || (e.button === 0 && e.ctrlKey)) { mouse.r = true; mouse.rp = true; } else if (e.button === 0) { mouse.l = true; mouse.lp = true; }
});
addEventListener('mouseup', e => { if (e.button === 0) { mouse.l = false; mouse.r = false; mouse.held = false; setMouse(e); uiMouseUp(); } else if (e.button === 2) mouse.r = false; });
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('wheel', e => {
  e.preventDefault(); const d = sign(e.deltaY);
  if (G.state === 'worlds' || G.state === 'accounts') { UI.scroll = max(0, UI.scroll + d); return; }
  if (G.state !== 'play') return;
  if (UI.open === 'map') mapZoom(d);
  else if (UI.open) UI.scroll = max(0, UI.scroll + d * (UI.open === 'inv' ? 1 : 2));
  else if (!G.dialog) { const n = hotN(); G.sel = (G.sel + d + n) % n; G.selT = 120; if (G.p.atk && G.p.atk.phase < 2) endAttack(G.p); }
}, { passive: false });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; mouse.l = mouse.r = false; });
addEventListener('resize', () => { resize(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'play' && !WORLD.arena && G.dirty) saveWorld(true); if (document.hidden && netGuest()) guestSave(); });
addEventListener('pagehide', e => {
  if (netGuest()) guestSave(); else if (G.state === 'play' && !WORLD.arena && WORLD.id) saveWorld(true);
  // closing the window: tell friends at once instead of leaving them waiting
  if (COOP.role && !e.persisted) try { sendAll({ t: 'bye' }); rlyFlushSync(); } catch (err) { }
});

// ---------------- boot ----------------
buildTiles(); buildTiles2(); buildSprites(); buildSprites2(); buildTiles3(); buildMobSprites(); buildDimArt(); buildPlaceArt(); buildBenchArt(); buildFurnArt(); buildDimMobs(); dimItemsPre(); buildItems(); brItems(); resize(); buildBayer();
SIL = [genSil(31, 0), genSil(77, 1)]; for (let i = 0; i < 4; i++) VEILS.push(genVeil(i * 17));
SHARDMOON = spr(['.....w.....', '....wWc....', '....WWc....', '...wWWcc...', '...WWWcc...', '..wWWWccc..', '..WWWWccd..', '.wWWWWcccd.', '..WWWccdd..', '..WWWcccd..', '...WWccd...', '...Wcccd...', '....ccd....', '....cd.....', '.....d.....'], { w: '#ffffff', W: '#dcf7f5', c: '#8fd0d8', d: '#62a9bc' });
accountBoot(); netBoot();
Object.assign(WORLD, { id: '', name: 'Aldermere', seed: (Math.random() * 1e9) | 0, size: 0, shape: (Math.random() * 3) | 0, mode: 0, arena: false });
SEED = WORLD.seed; genWorld(); freshSession(); G.p = newPlayer(); G.fighters = [G.p]; spawnNPCs(); G.clock = .3; updateSun();
G.state = 'accounts'; G.cam.x = G.cam.px = camX((SPAWN_X - 70) * T); G.cam.y = G.cam.py = camY(heights[SPAWN_X - 40] * T - VS.vh * .62);
requestAnimationFrame(frame);
