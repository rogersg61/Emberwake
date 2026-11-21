'use strict';
// ============================================================
//  EMBERWAKE — core: constants, math, input, audio, pixel font
// ============================================================
const T = 8, CH = 16;
let WW = 900, WH = 240;
const { abs, min, max, floor, ceil, round, sin, cos, atan2, sqrt, PI, sign, hypot, pow, acos, exp } = Math;
const TAU = PI * 2, D2R = PI / 180;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const approach = (v, t, s) => v < t ? min(v + s, t) : max(v - s, t);
const ease = {
  out: t => 1 - (1 - t) * (1 - t),
  out3: t => 1 - pow(1 - t, 3),
  io: t => t < .5 ? 2 * t * t : 1 - pow(-2 * t + 2, 2) / 2,
  back: t => { const c = 1.70158; return 1 + (c + 1) * pow(t - 1, 3) + c * pow(t - 1, 2); }
};
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let SEED = (Math.random() * 1e9) | 0;
let rng = mulberry32(SEED);
const rand = (a = 1, b) => b === undefined ? rng() * a : a + rng() * (b - a);
const randi = (a, b) => floor(rand(a, b + 1));
const frand = (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const fpick = arr => arr[floor(Math.random() * arr.length)];
function hh(a, b, c) { let n = (Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; }
const hash2 = (x, y) => hh(x, y, SEED);
function vnoise(x, y) { const xi = floor(x), yi = floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return lerp(lerp(hash2(xi, yi), hash2(xi + 1, yi), u), lerp(hash2(xi, yi + 1), hash2(xi + 1, yi + 1), u), v); }
function fbm(x, y, oct = 4) { let s = 0, a = .5, f = 1, n = 0; for (let i = 0; i < oct; i++) { s += a * vnoise(x * f, y * f); n += a; a *= .5; f *= 2; } return s / n; }
function mk(w, h, opts) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d', opts); x.imageSmoothingEnabled = false; return [c, x]; }
function mixc(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
const rgb = c => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;

// ---------------- input ----------------
const keys = {}, pressed = {};
const mouse = { x: 0, y: 0, l: false, r: false, lp: false, rp: false, wx: 0, wy: 0, ux: 0, uy: 0 };

// ---------------- audio (all synthesized) ----------------
let AC = null, master = null, noiseBuf = null, muted = false;
const sfxLast = {};
function audioInit() {
  if (AC) return;
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = .45; master.connect(AC.destination);
    noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { AC = null; }
}
function tone(type, f0, f1, dur, vol = .2, delay = 0) {
  const t = AC.currentTime + delay, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(max(1, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .03);
}
function noise(dur, vol, f0, f1, q = 1, type = 'bandpass', delay = 0) {
  const t = AC.currentTime + delay, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; s.loop = true; f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random() * .5); s.stop(t + dur + .03);
}
const SFX = {
  swing() { noise(.13, .22, 2200, 600, 1.4); },
  swing2() { noise(.12, .22, 1500, 2600, 1.4); },
  heavy() { noise(.24, .3, 1000, 180, 1); tone('sine', 110, 60, .2, .12); },
  thrust() { noise(.1, .22, 3000, 1200, 2); },
  spin() { noise(.4, .2, 700, 1500, 1.2); },
  hit() { noise(.07, .38, 2600, 700, .8); tone('triangle', 170, 55, .11, .32); },
  hit2() { noise(.1, .45, 1800, 300, .7); tone('square', 120, 40, .16, .22); },
  crit() { noise(.12, .4, 3000, 500, .7); tone('sine', 880, 1320, .18, .2); tone('sine', 1320, 1760, .22, .14, .05); },
  perfect() { tone('sine', 660, 1320, .3, .22); tone('sine', 990, 1980, .4, .15, .06); noise(.4, .1, 6000, 2000, 2); },
  dodge() { noise(.18, .2, 500, 2400, 1); },
  jump() { tone('sine', 260, 420, .1, .1); },
  land() { noise(.07, .16, 400, 120, .8, 'lowpass'); },
  step() { noise(.03, .05, 900, 400, 1, 'lowpass'); },
  mine() { noise(.04, .2, 3000, 1500, 2, 'highpass'); tone('square', 420, 300, .04, .05); },
  brk() { noise(.09, .28, 1200, 300, .8); },
  place() { tone('sine', 300, 200, .07, .14); noise(.03, .1, 1500, 800, 1); },
  pickup() { tone('square', 620, 940, .07, .07); },
  craft() { tone('square', 520, 780, .07, .08); tone('square', 780, 1040, .09, .08, .07); },
  hurt() { tone('sawtooth', 320, 90, .22, .22); noise(.12, .25, 900, 200, .8); },
  heal() { tone('sine', 520, 780, .16, .14); tone('sine', 780, 1170, .2, .12, .08); },
  die() { tone('sawtooth', 220, 40, .9, .25); noise(.7, .2, 800, 100, .7); },
  kill() { noise(.16, .3, 900, 200, .8); tone('triangle', 240, 60, .2, .2); },
  ui() { tone('square', 700, 700, .03, .05); },
  deny() { tone('square', 160, 120, .08, .08); },
  newmove() { tone('sine', 784, 784, .09, .12); tone('sine', 1047, 1047, .09, .12, .08); tone('sine', 1568, 1568, .2, .12, .16); },
  charge() { tone('sine', 300, 900, .35, .1); },
  charged() { tone('sine', 1200, 1500, .15, .18); noise(.15, .12, 5000, 3000, 3); },
  wave() { noise(.45, .3, 400, 2500, .8); tone('sawtooth', 180, 520, .3, .12); },
  boom() { tone('sine', 90, 28, .5, .5); noise(.4, .5, 500, 60, .6, 'lowpass'); },
  roar() { tone('sawtooth', 70, 45, 1.1, .3); tone('sawtooth', 105, 62, 1.1, .2); noise(1.1, .28, 300, 120, .5); },
  bolt() { tone('square', 900, 300, .12, .06); },
  reflect() { tone('sine', 1400, 2000, .1, .2); noise(.08, .2, 4000, 2000, 2); },
  quest() { tone('sine', 523, 523, .12, .14); tone('sine', 659, 659, .12, .14, .11); tone('sine', 784, 784, .3, .14, .22); },
  shrine() { tone('sine', 110, 220, 1.4, .25); tone('sine', 165, 330, 1.4, .18, .2); },
  tele() { tone('square', 1100, 1100, .05, .06); },
  thud() { noise(.1, .32, 520, 140, .9); tone('sine', 95, 48, .12, .22); },
  crack() { noise(.06, .34, 3600, 900, 1.3); tone('square', 190, 70, .07, .09); noise(.12, .14, 900, 300, .8, 'bandpass', .03); },
  ting() { tone('sine', 1760, 1740, .28, .1); tone('sine', 2637, 2600, .2, .06, .03); },
  shatter() { noise(.32, .3, 6500, 2500, 2, 'highpass'); tone('triangle', 2200, 3300, .2, .07); tone('triangle', 1650, 2900, .26, .05, .06); },
  clang() { tone('square', 640, 610, .26, .09); tone('sine', 1280, 1210, .45, .1); noise(.06, .3, 4200, 2200, 2, 'highpass'); },
  chop() { noise(.07, .34, 1400, 500, 1); tone('triangle', 260, 140, .08, .12); },
  clink() { tone('square', 1300, 1100, .05, .06); noise(.04, .12, 6000, 4000, 3, 'highpass'); },
  saw() { noise(.09, .14, 2400, 1800, 3); },
  grind() { noise(.12, .12, 300, 500, 1, 'lowpass'); },
  bellows() { noise(.22, .2, 300, 900, .8, 'lowpass'); },
  anvil() { tone('square', 1500, 1400, .08, .1); tone('sine', 2200, 2100, .25, .06); noise(.05, .2, 5000, 3000, 2); },
  beat() { tone('sine', 220, 200, .05, .1); },
  stir() { noise(.1, .08, 700, 500, 1, 'lowpass'); },
  chisel() { tone('square', 1800, 1500, .03, .06); noise(.03, .12, 4000, 2500, 2, 'highpass'); },
  shake() { noise(.06, .1, 1200, 2400, 1.5); },
  fire() { noise(.3, .08, 600, 300, .9, 'lowpass'); }
};
function sfx(n, cd = 35) {
  if (!AC || muted) return;
  const now = performance.now(); if (sfxLast[n] && now - sfxLast[n] < cd) return; sfxLast[n] = now;
  try { SFX[n] && SFX[n](); } catch (e) { }
}

// ---------------- 5x8 pixel font (hand drawn) ----------------
const FONT_SRC = String.raw`
! ..#../..#../..#../..#../..#../...../..#..
" .#.#./.#.#.
# .#.#./.#.#./#####/.#.#./#####/.#.#./.#.#.
$ ..#../.####/#.#../.###./..#.#/####./..#..
% ##..#/##..#/...#./..#../.#.../#..##/#..##
& .##../#..#./#.#../.#.../#.#.#/#..#./.##.#
' ..#../..#..
( ...#./..#../.#.../.#.../.#.../..#../...#.
) .#.../..#../...#./...#./...#./..#../.#...
* ...../..#../#.#.#/.###./#.#.#/..#..
+ ...../..#../..#../#####/..#../..#..
, ...../...../...../...../...../..#../..#../.#...
- ...../...../...../#####
. ...../...../...../...../...../...../..#..
/ ....#/....#/...#./..#../.#.../#..../#....
0 .###./#...#/#..##/#.#.#/##..#/#...#/.###.
1 ..#../.##../..#../..#../..#../..#../.###.
2 .###./#...#/....#/...#./..#../.#.../#####
3 .###./#...#/....#/..##./....#/#...#/.###.
4 ...#./..##./.#.#./#..#./#####/...#./...#.
5 #####/#..../####./....#/....#/#...#/.###.
6 ..##./.#.../#..../####./#...#/#...#/.###.
7 #####/....#/...#./..#../.#.../.#.../.#...
8 .###./#...#/#...#/.###./#...#/#...#/.###.
9 .###./#...#/#...#/.####/....#/...#./.##..
: ...../...../..#../...../...../..#..
; ...../...../..#../...../...../..#../..#../.#...
< ...#./..#../.#.../#..../.#.../..#../...#.
= ...../...../#####/...../#####
> .#.../..#../...#./....#/...#./..#../.#...
? .###./#...#/....#/...#./..#../...../..#..
@ .###./#...#/#.###/#.#.#/#.###/#..../.###.
A .###./#...#/#...#/#####/#...#/#...#/#...#
B ####./#...#/#...#/####./#...#/#...#/####.
C .###./#...#/#..../#..../#..../#...#/.###.
D ####./#...#/#...#/#...#/#...#/#...#/####.
E #####/#..../#..../####./#..../#..../#####
F #####/#..../#..../####./#..../#..../#....
G .###./#...#/#..../#.###/#...#/#...#/.####
H #...#/#...#/#...#/#####/#...#/#...#/#...#
I ###/.#./.#./.#./.#./.#./###
J ..###/...#./...#./...#./...#./#..#./.##..
K #...#/#..#./#.#../##.../#.#../#..#./#...#
L #..../#..../#..../#..../#..../#..../#####
M #...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#
N #...#/##..#/#.#.#/#..##/#...#/#...#/#...#
O .###./#...#/#...#/#...#/#...#/#...#/.###.
P ####./#...#/#...#/####./#..../#..../#....
Q .###./#...#/#...#/#...#/#.#.#/#..#./.##.#
R ####./#...#/#...#/####./#.#../#..#./#...#
S .####/#..../#..../.###./....#/....#/####.
T #####/..#../..#../..#../..#../..#../..#..
U #...#/#...#/#...#/#...#/#...#/#...#/.###.
V #...#/#...#/#...#/#...#/#...#/.#.#./..#..
W #...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#
X #...#/#...#/.#.#./..#../.#.#./#...#/#...#
Y #...#/#...#/.#.#./..#../..#../..#../..#..
Z #####/....#/...#./..#../.#.../#..../#####
[ .###./.#.../.#.../.#.../.#.../.#.../.###.
] .###./...#./...#./...#./...#./...#./.###.
^ ..#../.#.#./#...#
_ ...../...../...../...../...../...../#####
a ...../...../.###./....#/.####/#...#/.####
b #..../#..../####./#...#/#...#/#...#/####.
c ...../...../.###./#..../#..../#...#/.###.
d ....#/....#/.####/#...#/#...#/#...#/.####
e ...../...../.###./#...#/#####/#..../.###.
f ..##./.#.../###../.#.../.#.../.#.../.#...
g ...../...../.####/#...#/#...#/.####/....#/.###.
h #..../#..../#.##./##..#/#...#/#...#/#...#
i .#./.../##./.#./.#./.#./###
j ...#./...../..##./...#./...#./...#./#..#./.##..
k #..../#..../#..#./#.#../##.../#.#../#..#.
l ##./.#./.#./.#./.#./.#./###
m ...../...../##.#./#.#.#/#.#.#/#...#/#...#
n ...../...../#.##./##..#/#...#/#...#/#...#
o ...../...../.###./#...#/#...#/#...#/.###.
p ...../...../####./#...#/#...#/####./#..../#....
q ...../...../.####/#...#/#...#/.####/....#/....#
r ...../...../#.##./##..#/#..../#..../#....
s ...../...../.####/#..../.###./....#/####.
t .#.../.#.../###../.#.../.#.../.#..#/..##.
u ...../...../#...#/#...#/#...#/#..##/.##.#
v ...../...../#...#/#...#/#...#/.#.#./..#..
w ...../...../#...#/#...#/#.#.#/#.#.#/.#.#.
x ...../...../#...#/.#.#./..#../.#.#./#...#
y ...../...../#...#/#...#/#...#/.####/....#/.###.
z ...../...../#####/...#./..#../.#.../#####
| ..#../..#../..#../..#../..#../..#../..#..
~ ...../...../.#.../#.#.#/...#.
> .#.../..#../...#./....#/...#./..#../.#...
`;
const Font = { g: {}, base: null, tint: new Map() };
(function buildFont() {
  const lines = FONT_SRC.split('\n').filter(l => l.length > 2);
  const [c, x] = mk(lines.length * 6 + 24, 8); x.fillStyle = '#fff';
  lines.forEach((l, i) => {
    const ch = l[0], rows = l.slice(2).split('/'); let x0 = 9, x1 = 0;
    rows.forEach((r, y) => { for (let k = 0; k < r.length; k++) if (r[k] === '#') { x.fillRect(i * 6 + k, y, 1, 1); x0 = min(x0, k); x1 = max(x1, k); } });
    Font.g[ch] = { sx: i * 6 + x0, w: x1 - x0 + 1 };
  });
  // extra glyphs drawn by hand: arrows + mouse icons
  const ex = lines.length * 6;
  const put = (ch, ox, rows) => { rows.forEach((r, y) => { for (let k = 0; k < r.length; k++) if (r[k] === '#') x.fillRect(ex + ox + k, y, 1, 1); }); Font.g[ch] = { sx: ex + ox, w: rows[0].length }; };
  put('→', 0, ['.....', '..#..', '...#.', '#####', '...#.', '..#..', '.....']);
  put('←', 6, ['.....', '..#..', '.#...', '#####', '.#...', '..#..', '.....']);
  put('↑', 12, ['..#..', '.###.', '#.#.#', '..#..', '..#..', '..#..', '..#..']);
  put('↓', 18, ['..#..', '..#..', '..#..', '..#..', '#.#.#', '.###.', '..#..']);
  Font.base = c;
})();
function fontAtlas(col) {
  let a = Font.tint.get(col);
  if (!a) { const [c, x] = mk(Font.base.width, 8); x.drawImage(Font.base, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = col; x.fillRect(0, 0, c.width, 8); a = c; Font.tint.set(col, a); }
  return a;
}
function drawText(c, s, x, y, col = '#fff', sc = 1) {
  const a = fontAtlas(col); let cx = x; s = String(s);
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]; if (ch === ' ') { cx += 3 * sc; continue; }
    const g = Font.g[ch] || Font.g['?'];
    c.drawImage(a, g.sx, 0, g.w, 8, cx, y, g.w * sc, 8 * sc); cx += (g.w + 1) * sc;
  }
  return cx - x;
}
function textW(s, sc = 1) { let w = 0; s = String(s); for (let i = 0; i < s.length; i++) { const ch = s[i]; w += ch === ' ' ? 3 : ((Font.g[ch] || Font.g['?']).w + 1); } return (w - 1) * sc; }
const TC = new Map();
function textSprite(s, col, sc, mode, oc) {
  const k = mode + col + sc + oc + '|' + s; let e = TC.get(k);
  if (!e) {
    if (TC.size > 700) TC.clear(); const [cv, x] = mk(max(1, textW(s, sc) + 3 * sc), 10 * sc + sc);
    if (mode === 1) drawText(x, s, 2 * sc, 2 * sc, oc, sc); else { drawText(x, s, 0, sc, oc, sc); drawText(x, s, 2 * sc, sc, oc, sc); drawText(x, s, sc, 0, oc, sc); drawText(x, s, sc, 2 * sc, oc, sc); }
    drawText(x, s, sc, sc, col, sc); e = cv; TC.set(k, e);
  }
  return e;
}
function textS(c, s, x, y, col = '#fff', sc = 1, sh = '#0e0b14') { s = String(s); if (!s) return 0; c.drawImage(textSprite(s, col, sc, 1, sh), x - sc, y - sc); return textW(s, sc); }
function textO(c, s, x, y, col = '#fff', sc = 1, oc = '#0e0b14') { s = String(s); if (!s) return 0; c.drawImage(textSprite(s, col, sc, 2, oc), x - sc, y - sc); return textW(s, sc); }
function textC(c, s, cx, y, col, sc = 1, fn = textS) { return fn(c, s, round(cx - textW(s, sc) / 2), y, col, sc); }
function wrapText(s, w, sc = 1) {
  const out = []; for (const para of String(s).split('\n')) {
    let line = ''; for (const word of para.split(' ')) { const t = line ? line + ' ' + word : word; if (textW(t, sc) > w && line) { out.push(line); line = word; } else line = t; }
    out.push(line);
  } return out;
}
