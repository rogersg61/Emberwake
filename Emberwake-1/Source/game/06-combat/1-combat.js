// ============================================================
//  COMBAT — data-driven movesets, shared by every fighter: the
//  player, AI duelists and other people online. Each weapon has
//  its own table of forms; a resolver picks one from the button,
//  aim, held keys, air state, cursor distance, dodge state and the
//  previous form (chains).
// ============================================================
const ARM = 6.5;
// player settings, kept between sessions on this computer
const DIFFS = { easy: { n: 'EASY', taken: .7, regen: 2, hunger: .7 }, normal: { n: 'NORMAL', taken: 1, regen: 1, hunger: 1 }, hard: { n: 'HARD', taken: 1.25, regen: .6, hunger: 1.2 } };
const SETTINGS = (() => { const d = { combat: 'simple', diff: 'easy', craft: 'simple', fpsMode: false }; try { return Object.assign(d, JSON.parse(localStorage.getItem('ew_settings') || '{}')); } catch (e) { return d; } })();
const saveSettings = () => { try { localStorage.setItem('ew_settings', JSON.stringify(SETTINGS)); } catch (e) { } };
const DIFF = () => DIFFS[SETTINGS.diff] || DIFFS.easy;
const mv = (name, btn, hint, o) => Object.assign({ name, btn, hint, kind: 'swing', wind: 4, act: 5, rec: 10, dmg: 1, kb: [1.4, -.6], reach: 1, stop: 2, shake: 1, cost: 0, aimed: 18, center: 0, ctrl: .3 }, o);
const SHOCK = { r: 38, dmg: 2.1, kb: [3.2, -3.8] };
const sh = (name, btn, hint, o) => mv(name, btn, hint, Object.assign({ kind: 'shot', wind: 5, act: 3, rec: 8, lo: -88, hi: 88 }, o));
const MOVESETS = {
  sword: {
    idle: -.6, title: 'BLADE',
    map: { rip: 'riposte', dash: 'flash_draw', aD: 'talon_dive', aU: 'updraft', aChain: ['sky_cut1', 'sky_cut2'], near: 'hilt_strike', back: 'backstep_cut', far: 'wake_lunge', up: 'skypiercer', upf: 'rising_fang', down: 'reaping_sweep', chain: ['ember_cut', 'return_stroke', 'sundering_arc'], haD: 'meteor_drop', haU: 'heaven_spiral', ha: 'crescent_dive', hDown: 'cyclone', hBack: 'warding_kick', hUp: 'dawnbreaker', hFwd: 'long_thrust', h: 'skullsplitter' },
    moves: {
      ember_cut: mv('Ember Cut', 'L', 'LMB', { from: -125, to: 55, rec: 11, kb: [1.5, -.6], step: 1.3 }),
      return_stroke: mv('Return Stroke', 'L', 'LMB, LMB', { from: 75, to: -105, wind: 3, rec: 11, dmg: 1.05, kb: [1.3, -1.3], step: 1.3 }),
      sundering_arc: mv('Sundering Arc', 'L', 'LMB, LMB, LMB', { from: -160, to: 105, wind: 6, act: 7, rec: 17, dmg: 1.75, kb: [3.4, -1.6], step: 2.3, stop: 5, shake: 3, reach: 1.15, big: 1 }),
      rising_fang: mv('Rising Fang', 'L', 'LMB, aim diagonal up', { from: 70, to: -115, center: -40, act: 6, rec: 12, dmg: 1.1, kb: [.9, -3.4], hop: -2.4, launch: 1 }),
      skypiercer: mv('Skypiercer', 'L', 'LMB, aim straight up', { kind: 'thrust', lo: -90, hi: -55, act: 6, rec: 12, dmg: 1.3, kb: [0, -3.2], reach: 1.25 }),
      reaping_sweep: mv('Reaping Sweep', 'L', 'LMB + S, or aim straight down', { from: 140, to: 10, aimed: 0, wind: 5, act: 6, rec: 12, dmg: .9, kb: [.5, -2.8], stagger: 42, crouch: 3 }),
      wake_lunge: mv('Wake Lunge', 'L', 'LMB + forward key, cursor far', { kind: 'thrust', wind: 5, act: 10, rec: 14, dmg: 1.5, kb: [3.2, -.8], reach: 1.2, dash: { v: 4.3, t: 10 }, stop: 4, shake: 2 }),
      backstep_cut: mv('Backstep Cut', 'L', 'LMB + back key', { from: -70, to: 85, wind: 2, dmg: .85, kb: [2.2, -.5], back: 2.9, hop: -1.7, iframe: 8 }),
      hilt_strike: mv('Hilt Strike', 'L', 'LMB, cursor on yourself', { kind: 'thrust', lo: 0, hi: 0, wind: 1, act: 3, rec: 8, dmg: .5, kb: [1.2, 0], reach: .5, stagger: 55, blunt: 1 }),
      skullsplitter: mv('Skullsplitter', 'H', 'RMB', { from: -165, to: 95, wind: 11, act: 6, rec: 18, dmg: 2.2, kb: [2.4, 2.2], step: 1.6, stop: 6, shake: 4, cost: 12, big: 1, charge: { min: 22, max: 60, into: 'ember_wave' } }),
      ember_wave: mv('Ember Wave', 'H', 'hold RMB, then release', { from: -165, to: 95, wind: 11, act: 6, rec: 20, dmg: 2.9, kb: [3.5, -1], step: 1.2, stop: 7, shake: 6, big: 1, proj: 'wave' }),
      dawnbreaker: mv('Dawnbreaker', 'H', 'RMB, aim up', { from: 110, to: -125, center: -45, aimed: 25, wind: 8, act: 6, rec: 16, dmg: 1.6, kb: [.5, -5.4], rise: -4.7, launch: 1, cost: 12, stop: 5, shake: 3, big: 1 }),
      long_thrust: mv('Long Thrust', 'H', 'RMB + forward key', { kind: 'thrust', lo: -30, hi: 30, wind: 9, act: 7, rec: 16, dmg: 1.9, kb: [4.2, -.6], reach: 1.5, step: 2.6, cost: 12, stop: 5, shake: 3 }),
      cyclone: mv('Cyclone', 'H', 'RMB + S, or cursor on yourself', { kind: 'spin', turns: 2, wind: 5, act: 20, rec: 13, dmg: .8, kb: [1.6, -1.1], multi: 6, cost: 16, ctrl: .8, reach: 1.05 }),
      warding_kick: mv('Warding Kick', 'H', 'RMB + back key', { kind: 'kick', act: 5, rec: 12, dmg: .6, kb: [5.6, -1.6], stagger: 60, cost: 8, stop: 5, shake: 3, blunt: 1 }),
      sky_cut1: mv('Sky Cut', 'L', 'LMB in the air', { from: -115, to: 60, wind: 3, rec: 9, dmg: .95, kb: [1, -.9], float: 1 }),
      sky_cut2: mv('Sky Wheel', 'L', 'LMB, LMB in the air', { kind: 'flip', turns: 1, wind: 3, act: 9, rec: 9, dmg: 1.2, kb: [1.4, -1.6], float: 1, stop: 3 }),
      updraft: mv('Updraft', 'L', 'LMB in the air, aim up', { from: 80, to: -130, center: -60, aimed: 25, wind: 3, act: 6, rec: 12, dmg: 1.1, kb: [.4, -3.6], rise: -3.5, launch: 1 }),
      talon_dive: mv('Talon Dive', 'L', 'LMB in the air + S, or aim down', { kind: 'thrust', lo: 60, hi: 90, wind: 3, act: 16, rec: 8, dmg: 1.2, kb: [0, 1.5], pogo: 1, fall: 3.2, endOnLand: 1 }),
      crescent_dive: mv('Crescent Dive', 'H', 'RMB in the air', { from: -110, to: 80, aimed: 0, wind: 6, act: 11, rec: 14, dmg: 1.7, kb: [2.6, 2.2], dash: { v: 3.7, t: 11, vy: 3.7 }, cost: 12, endOnLand: 1, stop: 5, shake: 3, big: 1 }),
      heaven_spiral: mv('Heavenward Spiral', 'H', 'RMB in the air, aim up', { kind: 'flip', turns: 2, wind: 5, act: 16, rec: 12, dmg: .7, kb: [.3, -2.4], multi: 5, rise: -3.9, cost: 14, launch: 1 }),
      meteor_drop: mv('Meteor Drop', 'H', 'RMB in the air + S, or aim down', { kind: 'plunge', wind: 9, act: 99, rec: 20, dmg: 1.4, kb: [1.5, 2], cost: 14, landShock: SHOCK, stop: 6, shake: 7, big: 1 }),
      flash_draw: mv('Flash Draw', 'L', 'attack while dodging', { from: -35, to: 35, aimed: 0, wind: 1, act: 7, rec: 12, dmg: 1.45, kb: [.6, -1.2], dash: { v: 4.2, t: 7 }, iframe: 7, wide: 1, stop: 3 }),
      riposte: mv('Riposte', 'L', 'attack after a perfect dodge', { from: -150, to: 125, wind: 1, rec: 12, dmg: 2.7, kb: [4.2, -2], step: 3.2, stop: 8, shake: 5, crit: 1, big: 1 })
    }
  },
  spear: {
    idle: -.25, title: 'PIKE',
    map: { rip: 'riposte', dash: 'gale_rush', aD: 'heron_dive', aU: 'rising_lance', aChain: ['air_jab', 'air_sweep'], near: 'butt_strike', back: 'retreat_poke', far: 'vault', up: 'sky_lance', upf: 'high_jab', down: 'shin_rake', chain: ['jab', 'twin_jab', 'skewer'], haD: 'skyfall', haU: 'gyre', ha: 'dragoon', hDown: 'windmill', hBack: 'shove', hUp: 'hook', hFwd: 'impale', h: 'crescent' },
    moves: {
      jab: mv('Ash Jab', 'L', 'LMB', { kind: 'thrust', lo: -25, hi: 25, wind: 3, act: 4, rec: 9, dmg: .9, kb: [1.4, -.3], step: .8 }),
      twin_jab: mv('Twin Fang', 'L', 'LMB, LMB', { kind: 'thrust', lo: -25, hi: 25, wind: 2, act: 9, rec: 9, dmg: .7, kb: [1, -.3], multi: 4, pump: 2, step: .8 }),
      skewer: mv('Skewer', 'L', 'LMB, LMB, LMB', { kind: 'thrust', lo: -25, hi: 25, wind: 6, act: 6, rec: 15, dmg: 1.8, kb: [4, -.8], reach: 1.25, step: 2.4, stop: 5, shake: 3 }),
      high_jab: mv('Heron Peck', 'L', 'LMB, aim diagonal up', { kind: 'thrust', lo: -58, hi: -22, wind: 3, rec: 10, kb: [1, -2.4] }),
      sky_lance: mv('Sky Lance', 'L', 'LMB, aim straight up', { kind: 'thrust', lo: -90, hi: -58, act: 6, rec: 12, dmg: 1.3, kb: [0, -3.4], reach: 1.15 }),
      shin_rake: mv('Shin Rake', 'L', 'LMB + S, or aim straight down', { from: 120, to: 5, aimed: 0, wind: 5, act: 6, rec: 12, dmg: .9, kb: [.6, -2.6], stagger: 42, crouch: 3 }),
      vault: mv('Pole Vault', 'L', 'LMB + forward key, cursor far', { kind: 'thrust', lo: 55, hi: 55, wind: 3, act: 10, rec: 8, dmg: .8, kb: [1, -1], vault: { vx: 3.4, vy: -4.7 }, reach: .9 }),
      retreat_poke: mv('Parting Sting', 'L', 'LMB + back key', { kind: 'thrust', wind: 2, rec: 10, dmg: .9, kb: [2.4, -.4], back: 3, hop: -1.6, iframe: 8 }),
      butt_strike: mv('Butt Strike', 'L', 'LMB, cursor on yourself', { kind: 'thrust', lo: 180, hi: 180, wind: 2, act: 4, rec: 9, dmg: .6, kb: [-2.2, -.4], reach: .55, stagger: 55, blunt: 1 }),
      crescent: mv('Crescent Sweep', 'H', 'RMB', { from: -140, to: 100, wind: 10, act: 7, rec: 17, dmg: 1.9, kb: [3, -1.2], reach: 1.05, cost: 12, stop: 5, shake: 3, big: 1, charge: { min: 22, max: 60, into: 'javelin' } }),
      javelin: mv('Ash Javelin', 'H', 'hold RMB, then release', { kind: 'thrust', lo: -60, hi: 40, wind: 10, rec: 20, dmg: 1, kb: [2, -.5], proj: 'javelin', stop: 3 }),
      hook: mv('Gallows Hook', 'H', 'RMB, aim up', { from: 100, to: -120, center: -45, aimed: 25, wind: 8, act: 6, rec: 16, dmg: 1.5, kb: [.4, -5.2], rise: -4.4, launch: 1, cost: 12, big: 1, stop: 4 }),
      impale: mv('Impaling Charge', 'H', 'RMB + forward key', { kind: 'thrust', lo: -15, hi: 15, wind: 8, act: 14, rec: 18, dmg: 1.3, kb: [2.6, -.8], dash: { v: 3.9, t: 14, fixed: 1 }, multi: 5, reach: 1.1, cost: 14, stop: 3, shake: 2 }),
      windmill: mv('Windmill', 'H', 'RMB + S, or cursor on yourself', { kind: 'spin', turns: 3, wind: 5, act: 24, rec: 13, dmg: .7, kb: [1.8, -1], multi: 5, cost: 16, ctrl: .8, wheel: 1 }),
      shove: mv('Pole Shove', 'H', 'RMB + back key', { kind: 'thrust', lo: 0, hi: 0, act: 4, rec: 12, dmg: .6, kb: [5.8, -1.4], reach: .6, stagger: 60, cost: 8, stop: 5, shake: 3, blunt: 1 }),
      air_jab: mv('Sky Sting', 'L', 'LMB in the air', { kind: 'thrust', lo: -35, hi: 35, wind: 2, rec: 9, dmg: .95, kb: [1.2, -.6], float: 1 }),
      air_sweep: mv('Kite Sweep', 'L', 'LMB, LMB in the air', { from: -120, to: 80, wind: 3, act: 6, dmg: 1.15, kb: [1.6, -1.2], float: 1 }),
      rising_lance: mv('Rising Lance', 'L', 'LMB in the air, aim up', { kind: 'thrust', lo: -90, hi: -40, wind: 3, act: 6, rec: 12, dmg: 1.1, kb: [.4, -3.4], rise: -3.4, launch: 1 }),
      heron_dive: mv('Heron Dive', 'L', 'LMB in the air + S, or aim down', { kind: 'thrust', lo: 55, hi: 90, wind: 3, act: 16, rec: 8, dmg: 1.25, kb: [0, 1.5], pogo: 1, fall: 3.4, endOnLand: 1 }),
      dragoon: mv('Dragoon Dive', 'H', 'RMB in the air', { kind: 'thrust', lo: 30, hi: 60, wind: 5, act: 12, rec: 14, dmg: 1.8, kb: [2.8, 2], dash: { v: 5, t: 12, along: 1, fixed: 1 }, cost: 12, endOnLand: 1, stop: 5, shake: 3 }),
      gyre: mv('Gyre', 'H', 'RMB in the air, aim up', { kind: 'spin', turns: 3, wind: 4, act: 26, rec: 10, dmg: .65, kb: [1.2, -1.6], multi: 5, hover: 1, cost: 14, ctrl: .9, heli: 1 }),
      skyfall: mv('Skyfall', 'H', 'RMB in the air + S, or aim down', { kind: 'plunge', wind: 9, act: 99, rec: 20, dmg: 1.4, kb: [1.5, 2], cost: 14, landShock: SHOCK, stop: 6, shake: 7, big: 1 }),
      gale_rush: mv('Gale Rush', 'L', 'attack while dodging', { kind: 'thrust', lo: -15, hi: 15, wind: 1, act: 8, rec: 12, dmg: 1.4, kb: [2, -1], dash: { v: 4.6, t: 8, fixed: 1 }, iframe: 7, reach: 1.1, stop: 3 }),
      riposte: mv('Riposte', 'L', 'attack after a perfect dodge', { kind: 'thrust', lo: -30, hi: 30, wind: 1, rec: 12, dmg: 2.8, kb: [5, -1.5], reach: 1.35, step: 3.4, stop: 8, shake: 5, crit: 1 })
    }
  },
  fangs: {
    idle: -.2, title: 'TWINFANGS',
    map: { rip: 'riposte', dash: 'ghost_cut', aD: 'stinger', aU: 'wasp_rise', aChain: ['air_nick', 'air_nick2'], near: 'coil', back: 'fade', far: 'shadowstep', up: 'twin_spike', upf: 'gut_rise', down: 'hamstring', chain: ['nick', 'nick2', 'nick3', 'flurry'], haD: 'needle_drop', haU: 'gale_reel', ha: 'talon_rush', hDown: 'whirl', hBack: 'smoke_kick', hUp: 'sky_hook', hFwd: 'lunging', h: 'cross_rend' },
    moves: {
      nick: mv('Nick', 'L', 'LMB', { from: -80, to: 45, wind: 2, act: 3, rec: 7, dmg: .9, kb: [.8, -.3], step: 1.2 }),
      nick2: mv('Cross Nick', 'L', 'LMB, LMB', { from: 60, to: -70, wind: 2, act: 3, rec: 7, dmg: .9, kb: [.8, -.5], step: 1.2 }),
      nick3: mv('Twin Bite', 'L', 'LMB x3', { kind: 'thrust', lo: -25, hi: 25, wind: 2, act: 5, rec: 7, dmg: .75, kb: [1, -.3], multi: 2, pump: 2, step: 1.4 }),
      flurry: mv('Flurry', 'L', 'LMB x4', { kind: 'thrust', lo: -25, hi: 25, wind: 3, act: 13, rec: 13, dmg: .5, kb: [.5, -.2], multi: 3, pump: 4, step: 1, stop: 1 }),
      gut_rise: mv('Gutter Rise', 'L', 'LMB, aim diagonal up', { from: 70, to: -110, center: -40, wind: 3, rec: 10, kb: [.6, -3.2], hop: -3, launch: 1 }),
      twin_spike: mv('Twin Spike', 'L', 'LMB, aim straight up', { kind: 'thrust', lo: -90, hi: -55, wind: 3, act: 6, rec: 10, dmg: .7, kb: [0, -2.4], multi: 3, pump: 2 }),
      hamstring: mv('Hamstring', 'L', 'LMB + S, or aim straight down', { from: 140, to: 20, aimed: 0, wind: 3, act: 4, rec: 10, dmg: .8, kb: [.4, -1.8], stagger: 55, crouch: 3 }),
      shadowstep: mv('Shadowstep', 'L', 'LMB + forward key, cursor far', { from: -40, to: 40, aimed: 0, wind: 2, act: 8, rec: 10, dmg: 1.6, kb: [-1.5, -1], dash: { v: 5.6, t: 8, fixed: 1 }, iframe: 9, wide: 1, stop: 4 }),
      fade: mv('Parting Fang', 'L', 'LMB + back key', { kind: 'thrust', wind: 2, rec: 10, dmg: .9, kb: [1.5, -.4], back: 3.2, hop: -1.8, iframe: 9, proj: 'knife' }),
      coil: mv('Viper Coil', 'L', 'LMB, cursor on yourself', { kind: 'spin', turns: 1, wind: 2, act: 8, rec: 9, dmg: .6, kb: [1.6, -.8], multi: 4, ctrl: .8 }),
      cross_rend: mv('Cross Rend', 'H', 'RMB', { from: -140, to: 100, wind: 6, act: 6, rec: 14, dmg: 1.1, kb: [2, -1], multi: 3, step: 1.8, cost: 8, stop: 4, shake: 2, big: 1, charge: { min: 20, max: 55, into: 'thousand' } }),
      thousand: mv('Thousand Cuts', 'H', 'hold RMB, then release', { kind: 'thrust', lo: -20, hi: 20, wind: 6, act: 22, rec: 16, dmg: .55, kb: [.4, -.2], multi: 2, pump: 9, dash: { v: 1.6, t: 22, fixed: 1 }, stop: 1, big: 1 }),
      sky_hook: mv('Sky Hook', 'H', 'RMB, aim up', { from: 100, to: -125, center: -45, aimed: 25, wind: 5, rec: 13, dmg: 1.3, kb: [.4, -5], rise: -4.8, launch: 1, cost: 10, stop: 4 }),
      lunging: mv('Lunging Fangs', 'H', 'RMB + forward key', { kind: 'thrust', lo: -20, hi: 20, wind: 5, act: 8, rec: 13, dmg: .9, kb: [2.6, -.6], multi: 4, dash: { v: 4.6, t: 8, fixed: 1 }, cost: 10, stop: 3 }),
      whirl: mv('Whirl', 'H', 'RMB + S, or cursor on yourself', { kind: 'spin', turns: 3, wind: 3, act: 18, rec: 11, dmg: .5, kb: [1.4, -.8], multi: 3, cost: 12, ctrl: .9 }),
      smoke_kick: mv('Smoke Kick', 'H', 'RMB + back key', { kind: 'kick', wind: 3, rec: 11, dmg: .6, kb: [5, -1.8], stagger: 55, cost: 8, stop: 4 }),
      air_nick: mv('Sky Nick', 'L', 'LMB in the air', { from: -100, to: 55, wind: 2, act: 3, rec: 6, dmg: .85, kb: [.8, -.7], float: 1 }),
      air_nick2: mv('Sky Reel', 'L', 'LMB, LMB in the air', { kind: 'flip', turns: 1, wind: 2, act: 7, rec: 7, dmg: .9, kb: [1, -1.2], float: 1, multi: 4 }),
      wasp_rise: mv('Wasp Rise', 'L', 'LMB in the air, aim up', { kind: 'thrust', lo: -90, hi: -40, wind: 2, act: 6, rec: 10, dmg: .7, kb: [.3, -3], multi: 3, pump: 2, rise: -3.6, launch: 1 }),
      stinger: mv('Stinger', 'L', 'LMB in the air + S, or aim down', { kind: 'thrust', lo: 55, hi: 90, wind: 2, act: 16, rec: 7, dmg: 1.1, kb: [0, 1.5], pogo: 1, fall: 3.8, endOnLand: 1 }),
      talon_rush: mv('Talon Rush', 'H', 'RMB in the air', { kind: 'thrust', lo: 25, hi: 60, wind: 4, act: 11, rec: 12, dmg: .8, kb: [1.6, 1.5], multi: 4, dash: { v: 5.2, t: 11, along: 1, fixed: 1 }, cost: 10, endOnLand: 1 }),
      gale_reel: mv('Gale Reel', 'H', 'RMB in the air, aim up', { kind: 'flip', turns: 3, wind: 3, act: 16, rec: 10, dmg: .5, kb: [.3, -2], multi: 3, rise: -4, cost: 12, launch: 1 }),
      needle_drop: mv('Needle Drop', 'H', 'RMB in the air + S, or aim down', { kind: 'plunge', wind: 6, act: 99, rec: 16, dmg: 1.2, kb: [1, 2], cost: 12, landShock: { r: 26, dmg: 1.6, kb: [2.4, -3] }, stop: 4, shake: 5 }),
      ghost_cut: mv('Ghost Cut', 'L', 'attack while dodging', { from: -35, to: 35, aimed: 0, wind: 1, act: 7, rec: 10, dmg: .8, kb: [.4, -1], multi: 3, dash: { v: 4.6, t: 7 }, iframe: 8, wide: 1 }),
      riposte: mv('Heartseeker', 'L', 'attack after a perfect dodge', { kind: 'thrust', lo: -30, hi: 30, wind: 1, act: 4, rec: 11, dmg: 3.2, kb: [3.5, -1.2], step: 3.4, stop: 8, shake: 5, crit: 1 })
    }
  },
  maul: {
    idle: -1.9, title: 'MAUL',
    map: { rip: 'riposte', dash: 'rolling_crush', aD: 'hammerfall', aU: 'comet_rise', aChain: ['air_swat', 'air_wheel'], near: 'haft_jab', back: 'hindsight', far: 'leap_smash', up: 'pillar', upf: 'sky_arc', down: 'ankle', chain: ['swat', 'backswing', 'crater'], haD: 'meteor', haU: 'moonshot', ha: 'comet', hDown: 'grave_spin', hBack: 'boot', hUp: 'homerun', hFwd: 'ram', h: 'earthsplitter' },
    moves: {
      swat: mv('Swat', 'L', 'LMB', { from: -110, to: 60, wind: 7, act: 6, rec: 14, kb: [2.6, -1], step: 1, stop: 4, shake: 2, big: 1 }),
      backswing: mv('Backswing', 'L', 'LMB, LMB', { from: 80, to: -110, wind: 6, act: 6, rec: 14, dmg: 1.05, kb: [2.2, -2], step: 1, stop: 4, shake: 2, big: 1 }),
      crater: mv('Crater', 'L', 'LMB x3', { from: -170, to: 100, wind: 9, act: 6, rec: 20, dmg: 1.5, kb: [2, 2.5], step: 1.4, stop: 6, shake: 5, big: 1, quake: .8, armor: 1 }),
      sky_arc: mv('Skyward Arc', 'L', 'LMB, aim diagonal up', { from: 90, to: -120, center: -40, wind: 7, act: 6, rec: 15, dmg: 1.1, kb: [1, -4.6], launch: 1, stop: 4, shake: 2, big: 1 }),
      pillar: mv('Pillar', 'L', 'LMB, aim straight up', { kind: 'thrust', lo: -90, hi: -60, wind: 6, act: 6, rec: 14, dmg: 1.1, kb: [0, -4.4], reach: 1.1, blunt: 1, stop: 4 }),
      ankle: mv('Ankle Breaker', 'L', 'LMB + S, or aim straight down', { from: 150, to: 10, aimed: 0, wind: 7, act: 6, rec: 15, dmg: .9, kb: [.6, -2.6], stagger: 70, crouch: 3, stop: 4, big: 1 }),
      leap_smash: mv('Leap Smash', 'L', 'LMB + forward key, cursor far', { kind: 'plunge', wind: 13, act: 99, rec: 20, dmg: 1.3, kb: [1.5, 2], leap: { vx: 3.3, vy: -4.5 }, landShock: { r: 34, dmg: 1.7, kb: [3, -3.6] }, stop: 6, shake: 6, big: 1, armor: 1 }),
      hindsight: mv('Hindsight', 'L', 'LMB + back key', { kind: 'thrust', lo: 180, hi: 180, wind: 5, act: 5, rec: 13, kb: [-4, -1], reach: .8, blunt: 1, stop: 4, shake: 2 }),
      haft_jab: mv('Haft Jab', 'L', 'LMB, cursor on yourself', { kind: 'thrust', lo: 0, hi: 0, wind: 2, act: 3, rec: 9, dmg: .4, kb: [1.4, 0], reach: .5, stagger: 55, blunt: 1 }),
      earthsplitter: mv('Earthsplitter', 'H', 'RMB', { from: -170, to: 100, wind: 14, act: 6, rec: 22, dmg: 2.3, kb: [2.5, 3], step: 1, cost: 14, stop: 7, shake: 6, big: 1, armor: 1, quake: 1.3, charge: { min: 24, max: 60, into: 'cataclysm' } }),
      cataclysm: mv('Cataclysm', 'H', 'hold RMB, then release', { from: -170, to: 100, wind: 14, act: 6, rec: 26, dmg: 3, kb: [3, 3], stop: 9, shake: 9, big: 1, armor: 1, quake: 1.6, quake2: 1 }),
      homerun: mv('Home Run', 'H', 'RMB, aim up', { from: 120, to: -130, center: -45, aimed: 25, wind: 12, act: 6, rec: 18, dmg: 1.9, kb: [3, -6.4], launch: 1, cost: 14, stop: 7, shake: 5, big: 1, armor: 1 }),
      ram: mv('Battering Ram', 'H', 'RMB + forward key', { kind: 'thrust', lo: -10, hi: 10, wind: 9, act: 12, rec: 18, dmg: 1.6, kb: [5.5, -1.2], dash: { v: 3.7, t: 12, fixed: 1 }, cost: 14, stop: 6, shake: 4, blunt: 1, armor: 1, reach: .8 }),
      grave_spin: mv('Grave Spin', 'H', 'RMB + S, or cursor on yourself', { kind: 'spin', turns: 2, wheel: 1, wind: 8, act: 26, rec: 16, dmg: .9, kb: [2.4, -1.4], multi: 8, cost: 18, ctrl: .7, armor: 1, stop: 3, shake: 2 }),
      boot: mv('Boot', 'H', 'RMB + back key', { kind: 'kick', wind: 5, rec: 13, dmg: .7, kb: [6, -1.6], stagger: 60, cost: 8, stop: 5, shake: 3, blunt: 1 }),
      air_swat: mv('Sky Swat', 'L', 'LMB in the air', { from: -115, to: 60, wind: 5, act: 6, rec: 11, kb: [2, -.8], float: 1, stop: 4, big: 1 }),
      air_wheel: mv('Mill Wheel', 'L', 'LMB, LMB in the air', { kind: 'flip', turns: 1, wind: 4, act: 10, rec: 11, dmg: 1.3, kb: [2, -1.6], float: 1, stop: 4 }),
      comet_rise: mv('Comet Rise', 'L', 'LMB in the air, aim up', { from: 90, to: -130, center: -60, aimed: 25, wind: 5, act: 6, rec: 14, dmg: 1.1, kb: [.6, -4], rise: -3.3, launch: 1, big: 1 }),
      hammerfall: mv('Hammerfall', 'L', 'LMB in the air + S, or aim down', { kind: 'thrust', lo: 70, hi: 90, wind: 4, act: 18, rec: 10, dmg: 1.3, kb: [0, 2.5], pogo: 1, fall: 4, endOnLand: 1, blunt: 1, stop: 5 }),
      comet: mv('Comet', 'H', 'RMB in the air', { from: -120, to: 90, aimed: 0, wind: 8, act: 11, rec: 16, dmg: 1.8, kb: [3, 2.5], dash: { v: 3.4, t: 11, vy: 3.8 }, cost: 14, endOnLand: 1, stop: 6, shake: 4, big: 1, armor: 1 }),
      moonshot: mv('Moonshot', 'H', 'RMB in the air, aim up', { kind: 'flip', turns: 2, wind: 6, act: 18, rec: 14, dmg: .9, kb: [.5, -2.6], multi: 6, rise: -3.8, cost: 14, launch: 1, armor: 1 }),
      meteor: mv('Meteor', 'H', 'RMB in the air + S, or aim down', { kind: 'plunge', wind: 10, act: 99, rec: 22, dmg: 1.5, kb: [1.5, 2], cost: 16, landShock: { r: 50, dmg: 2.5, kb: [3.6, -4.2] }, stop: 8, shake: 9, big: 1, armor: 1 }),
      rolling_crush: mv('Rolling Crush', 'L', 'attack while dodging', { kind: 'flip', turns: 1, wind: 2, act: 10, rec: 13, dmg: 1.3, kb: [2.4, -1.5], dash: { v: 3.8, t: 9 }, iframe: 8, stop: 5, shake: 3 }),
      riposte: mv('Verdict', 'L', 'attack after a perfect dodge', { from: -170, to: 110, wind: 2, act: 6, rec: 16, dmg: 3, kb: [5, -2.5], step: 2.4, stop: 9, shake: 7, crit: 1, big: 1 })
    }
  },
  bow: {
    idle: .9, title: 'DAWNSTRING',
    map: { rip: 'riposte', dash: 'flash_volley', aD: 'pin_drop', aU: 'air_volley', aChain: ['air_loose', 'air_double'], near: 'bow_bash', back: 'backflip_shot', far: 'slide_shot', up: 'skyfall', upf: null, down: 'skimmer', chain: ['loose', 'double_loose', 'longshot'], haD: 'starfall', haU: 'sky_helix', ha: 'dive_shot', hDown: 'ground_burst', hBack: 'parting_fan', hUp: 'mortar', hFwd: 'pinning', h: 'power_draw' },
    moves: {
      loose: sh('Loose', 'L', 'LMB', { kb: [1.2, -.4], arrows: { n: 1 } }),
      double_loose: sh('Twin Loose', 'L', 'LMB, LMB', { wind: 3, act: 8, rec: 9, dmg: .75, kb: [1, -.3], arrows: { n: 2, burst: 4 } }),
      longshot: sh('Longshot', 'L', 'LMB, LMB, LMB', { wind: 9, rec: 14, dmg: 1.7, kb: [3, -.6], stop: 4, shake: 2, arrows: { n: 1, v: 9.5, g: .02, pierce: 1 } }),
      skyfall: sh('Skyfall Volley', 'L', 'LMB, aim straight up', { lo: -88, hi: -60, wind: 8, act: 4, rec: 16, dmg: .75, kb: [.4, 1.5], arrows: { n: 5, rain: 1 } }),
      skimmer: sh('Skimmer', 'L', 'LMB + S, or aim straight down', { lo: 0, hi: 0, rec: 11, dmg: .9, kb: [.6, -2.4], stagger: 45, crouch: 3, arrows: { n: 1, g: 0, low: 1, v: 6 } }),
      slide_shot: sh('Slide Shot', 'L', 'LMB + forward key, cursor far', { lo: -30, hi: 30, wind: 2, act: 9, rec: 10, dmg: 1.1, kb: [1.5, -.5], dash: { v: 3.9, t: 9, fixed: 1 }, crouch: 3, iframe: 6, arrows: { n: 2, burst: 5 } }),
      backflip_shot: sh('Backflip Shot', 'L', 'LMB + back key', { wind: 2, act: 4, rec: 11, kb: [1.6, -.5], back: 3, hop: -3, iframe: 9, flipB: 1, arrows: { n: 1 } }),
      bow_bash: mv('String Lash', 'L', 'LMB, cursor on yourself', { from: -90, to: 70, wind: 3, act: 4, dmg: .7, kb: [3.4, -1], stagger: 40, blunt: 1 }),
      power_draw: sh('Power Draw', 'H', 'RMB', { wind: 12, rec: 15, dmg: 2, kb: [3.2, -.8], cost: 10, stop: 5, shake: 3, arrows: { n: 1, v: 8.5, g: .03 }, charge: { min: 22, max: 60, into: 'sunlance' } }),
      sunlance: sh('Sunlance', 'H', 'hold RMB, then release', { wind: 12, rec: 20, dmg: 3.1, kb: [4, -1.5], stop: 7, shake: 6, big: 1, arrows: { n: 1, v: 11, g: 0, pierce: 1, boom: 22 } }),
      mortar: sh('Ember Mortar', 'H', 'RMB, aim up', { lo: -88, hi: -25, wind: 9, rec: 16, dmg: 2.1, kb: [2.5, -3], cost: 12, arrows: { n: 1, rain: 1, boom: 26, tf: 54 } }),
      pinning: sh('Pinning Shot', 'H', 'RMB + forward key', { wind: 8, rec: 14, dmg: 1.3, kb: [.3, 0], stagger: 85, cost: 10, stop: 4, arrows: { n: 1, v: 8 } }),
      ground_burst: sh('Ground Burst', 'H', 'RMB + S, or cursor on yourself', { lo: 90, hi: 90, rec: 14, dmg: 1.5, kb: [3, -3], cost: 12, hop: -4.2, stop: 4, shake: 4, arrows: { n: 1, v: 7, boom: 30 } }),
      parting_fan: sh('Parting Fan', 'H', 'RMB + back key', { rec: 14, dmg: .7, kb: [1.6, -.5], back: 2.6, hop: -1.8, iframe: 7, cost: 10, arrows: { n: 5, spread: .15 } }),
      air_loose: sh('Sky Loose', 'L', 'LMB in the air', { wind: 3, dmg: .95, kb: [1, -.4], float: 1, arrows: { n: 1 } }),
      air_double: sh('Sky Twin', 'L', 'LMB, LMB in the air', { wind: 2, act: 8, rec: 9, dmg: .75, kb: [1, -.3], float: 1, arrows: { n: 2, burst: 4 } }),
      air_volley: sh('Sparrowflight', 'L', 'LMB in the air, aim up', { lo: -88, hi: -22, wind: 4, rec: 11, dmg: .7, kb: [.5, -2], float: 1, arrows: { n: 3, spread: .16 } }),
      pin_drop: sh('Pin Drop', 'L', 'LMB in the air + S, or aim down', { lo: 50, hi: 90, wind: 3, rec: 9, dmg: 1.1, kb: [0, 2], hop: -3.4, arrows: { n: 1, v: 7.5 } }),
      dive_shot: sh('Dive Shot', 'H', 'RMB in the air', { lo: 20, hi: 70, act: 10, rec: 13, kb: [2, 1.5], dash: { v: 3.6, t: 10, vy: 3.2, fixed: 1 }, cost: 10, endOnLand: 1, arrows: { n: 3, burst: 4 } }),
      sky_helix: sh('Helix', 'H', 'RMB in the air, aim up', { act: 14, rec: 12, dmg: .7, kb: [1.5, -1], rise: -3.6, cost: 14, spinB: 2, arrows: { n: 7, burst: 2, radial: 1 } }),
      starfall: sh('Starfall', 'H', 'RMB in the air + S, or aim down', { lo: 90, hi: 90, wind: 6, rec: 14, dmg: 2.2, kb: [3, -3], cost: 14, hop: -4.6, stop: 5, shake: 5, arrows: { n: 1, v: 8, boom: 32 } }),
      flash_volley: sh('Flash Volley', 'L', 'attack while dodging', { lo: -40, hi: 40, wind: 1, act: 9, rec: 11, dmg: .7, kb: [1, -.5], dash: { v: 3.6, t: 8, fixed: 1 }, iframe: 7, arrows: { n: 3, burst: 3 } }),
      riposte: sh('Deadeye', 'L', 'attack after a perfect dodge', { wind: 1, rec: 12, dmg: 3, kb: [5, -1.5], stop: 8, shake: 5, crit: 1, arrows: { n: 1, v: 11, g: 0, pierce: 1 } })
    }
  }
};
// one resolver for every weapon: the weapon's `map` says which form answers which situation
function resolveMove(set, b, c) {
  const M = set.map, next = ch => { const i = ch.indexOf(c.prev); return ch[i >= 0 && i < ch.length - 1 ? i + 1 : 0]; };
  if (c.riposte) {
    if (b === 'H' && M.ripH) return M.ripH; if (c.air && M.ripA) return M.ripA;
    if ((c.aim === 'up' || c.aim === 'upf') && M.ripU) return M.ripU; if ((c.down || c.aim === 'down') && M.ripD) return M.ripD;
    return M.rip;
  }
  if (b === 'L') {
    if (c.dashing && M.dash) return M.dash;
    if (c.air) return (c.down || c.aim === 'down') ? M.aD : (c.aim === 'up' || c.aim === 'upf') ? M.aU : next(M.aChain);
    if (c.near && M.near) return M.near; if (c.back && M.back) return M.back; if (c.fwd && c.far && M.far) return M.far;
    if (c.aim === 'up') return M.up; if (c.aim === 'upf' && M.upf) return M.upf; if (c.down || c.aim === 'down') return M.down;
    return next(M.chain);
  }
  if (c.air) return (c.down || c.aim === 'down') ? M.haD : (c.aim === 'up' || c.aim === 'upf') ? M.haU : M.ha;
  if (c.near || c.down || c.aim === 'down') return M.hDown; if (c.back && M.hBack) return M.hBack; if (c.aim === 'up' || c.aim === 'upf') return M.hUp; if ((c.fwd || c.dashing) && M.hFwd) return M.hFwd;
  return M.h;
}
// bare hands: plain boxing. Jab, cross, hook, uppercut; no dashes, no thrown knives.
// Every blow plants your feet, so a punch never carries you off across the floor.
MOVESETS.brawl = {
  idle: -.1, title: 'BARE HANDS',
  map: { rip: 'counter', dash: 'slip_jab', aD: 'stomp', aU: 'air_upper', aChain: ['air_jab', 'air_jab2'], near: 'elbow', back: 'back_fist', far: null, up: 'uppercut', upf: 'uppercut', down: 'low_kick', chain: ['jab', 'cross', 'hook', 'upper_finish'], haD: 'stomp', haU: 'air_upper', ha: 'hammer_fist', hDown: 'sweep', h: 'haymaker', hUp: 'rising_upper', hFwd: null, hBack: null },
  moves: {
    jab: mv('Jab', 'L', 'LMB', { kind: 'thrust', lo: -35, hi: 35, wind: 1, act: 3, rec: 6, dmg: .9, kb: [.7, -.2], reach: 1.5, step: .5, plant: 1, ctrl: .45, stop: 1 }),
    cross: mv('Cross', 'L', 'LMB, LMB', { kind: 'thrust', lo: -35, hi: 35, wind: 2, act: 3, rec: 7, dmg: 1, kb: [1, -.3], reach: 1.6, step: .6, plant: 1, ctrl: .45, stop: 2 }),
    hook: mv('Hook', 'L', 'LMB x3', { from: -55, to: 45, wind: 3, act: 4, rec: 8, dmg: 1.15, kb: [1.4, -.6], reach: 1.5, step: .5, plant: 1, ctrl: .45, stop: 2 }),
    upper_finish: mv('Uppercut', 'L', 'LMB x4', { from: 55, to: -100, center: -30, wind: 4, act: 4, rec: 12, dmg: 1.5, kb: [1, -3], reach: 1.5, step: .4, plant: 1, launch: 1, stop: 3, shake: 2 }),
    uppercut: mv('Rising Uppercut', 'L', 'LMB, aim up', { from: 50, to: -110, center: -45, wind: 3, act: 4, rec: 11, dmg: 1.1, kb: [.5, -3.2], reach: 1.5, plant: 1, launch: 1, stop: 3 }),
    low_kick: mv('Low Kick', 'L', 'LMB + S, or aim down', { kind: 'kick', wind: 3, rec: 10, dmg: .9, kb: [1.6, -1.2], stagger: 40, crouch: 3, plant: 1 }),
    elbow: mv('Elbow', 'L', 'LMB, cursor on yourself', { kind: 'spin', turns: 1, wind: 2, act: 6, rec: 8, dmg: .7, kb: [1.6, -.8], reach: 1.4, plant: 1 }),
    back_fist: mv('Back Fist', 'L', 'LMB + back key', { from: -40, to: 60, wind: 3, act: 4, rec: 9, dmg: 1, kb: [1.6, -.6], reach: 1.5, plant: 1 }),
    slip_jab: mv('Slip Jab', 'L', 'LMB right after a dodge', { kind: 'thrust', lo: -30, hi: 30, wind: 1, act: 4, rec: 8, dmg: 1.4, kb: [1.2, -.4], reach: 1.6, step: 1, plant: 1, stop: 2 }),
    counter: mv('Counter', 'L', 'LMB after dodging through a hit', { kind: 'thrust', lo: -30, hi: 30, wind: 1, act: 4, rec: 10, dmg: 2.4, kb: [2.4, -1.2], reach: 1.7, stagger: 60, plant: 1, stop: 5, shake: 3, big: 1 }),
    air_jab: mv('Air Jab', 'L', 'LMB in the air', { kind: 'thrust', lo: -40, hi: 50, wind: 1, act: 3, rec: 6, dmg: .8, kb: [.8, -.6], reach: 1.5, float: 1 }),
    air_jab2: mv('Air Cross', 'L', 'LMB, LMB in the air', { kind: 'thrust', lo: -40, hi: 50, wind: 2, act: 3, rec: 8, dmg: .9, kb: [1.2, -.4], reach: 1.6, float: 1 }),
    air_upper: mv('Sky Uppercut', 'L', 'LMB in the air, aim up', { from: 50, to: -110, center: -45, wind: 2, act: 4, rec: 10, dmg: 1, kb: [.4, -3], reach: 1.5, launch: 1 }),
    stomp: mv('Stomp', 'L', 'LMB in the air, aim down', { kind: 'plunge', wind: 4, act: 99, rec: 10, dmg: 1.2, kb: [1, 2], landShock: { r: 18, dmg: 1, kb: [1.6, -2] }, stop: 3, shake: 3 }),
    haymaker: mv('Haymaker', 'H', 'RMB (hold to wind up further)', { kind: 'thrust', lo: -30, hi: 30, wind: 6, act: 4, rec: 14, dmg: 2, kb: [3, -1.2], reach: 1.6, step: .8, plant: 1, cost: 8, stop: 5, shake: 3, big: 1, charge: { min: 18, max: 48, into: 'haymaker_full' } }),
    haymaker_full: mv('Full Haymaker', 'H', 'hold RMB, then release', { kind: 'thrust', lo: -30, hi: 30, wind: 2, act: 5, rec: 16, dmg: 3.2, kb: [4.4, -2], reach: 1.7, step: 1, plant: 1, stagger: 70, stop: 7, shake: 5, big: 1 }),
    rising_upper: mv('Rising Haymaker', 'H', 'RMB, aim up', { from: 60, to: -115, center: -45, wind: 6, act: 5, rec: 14, dmg: 1.8, kb: [.4, -4.6], reach: 1.6, plant: 1, launch: 1, cost: 8, stop: 4, big: 1 }),
    sweep: mv('Leg Sweep', 'H', 'RMB + S, or aim down', { kind: 'spin', turns: 1, wind: 5, act: 8, rec: 13, dmg: 1.1, kb: [2, -2.4], reach: 1.6, stagger: 60, crouch: 4, plant: 1, cost: 8 }),
    hammer_fist: mv('Hammer Fist', 'H', 'RMB in the air', { from: -120, to: 70, wind: 4, act: 5, rec: 12, dmg: 1.7, kb: [1.2, 2.4], reach: 1.6, cost: 8, stop: 4, big: 1 })
  }
};
for (const k in MOVESETS) {
  const s = MOVESETS[k], M = s.map, mm = s.moves, into = id => mm[id].charge ? [id, mm[id].charge.into] : [id];
  s.sections = [['GROUND - LIGHT', [...M.chain, M.upf, M.up, M.down, M.far, M.back, M.near].filter(Boolean)], ['GROUND - HEAVY', [...into(M.h), M.hUp, M.hFwd, M.hDown, M.hBack]], ['AIRBORNE', [...M.aChain, M.aU, M.aD, M.ha, M.haU, M.haD]], ['SPECIAL', [M.dash, M.rip]]];
  const seen = new Set(); for (const sec of s.sections) sec[1] = sec[1].filter(id => id && mm[id] && !seen.has(id) && seen.add(id));
}
const RANKS = ['', 'SPARK', 'KINDLED', 'BLAZING', 'RADIANT', 'DAWNBRINGER'], RANK_AT = [0, 4, 12, 24, 40, 62];
const RANK_COL = ['#fff', '#b9bdd0', '#ffd35a', '#ff8a3d', '#ff6b6b', '#fff1a8'];
function rankI() { let r = 0; for (let i = 1; i < 6; i++) if (G.combo.pts >= RANK_AT[i]) r = i; return r; }
// what your hands do. A weapon fights; a tool digs (and hits whatever is in its way); things you
// only carry (ore, rope, keys, sidearms) leave your fists free. A creature under the cursor is always punched.
const ITEM_USES = new Set(['weapon', 'tool', 'block', 'wall', 'food', 'heal', 'util', 'armor', 'scroll', 'summon', 'trinket', 'offering']);
const PASSIVE_U = new Set(['belt', 'glide', 'climb', 'compass', 'map', 'magnet']); // 'carry it' gear: a click only shows a tip
const carried = it => !!it && (!ITEM_USES.has(it.type) || (it.type === 'util' && PASSIVE_U.has(it.u)));
// loose: also a foe within arm's reach in the direction you are pointing, so a punch is never a dig into the floor
function foeAtCursor(loose) {
  const p = G.p; if (!p || G.state !== 'play') return false;
  const x = mouse.wx, y = mouse.wy, cx = p.x + 3, cy = p.y + 8, dx0 = x - cx, dy0 = y - cy, d0 = hypot(dx0, dy0) || 1;
  const at = e => {
    if (x > e.x - 5 && x < e.x + e.w + 5 && y > e.y - 5 && y < e.y + e.h + 5) return true; if (!loose) return false;
    const ex = clamp(cx, e.x, e.x + e.w) - cx, ey = clamp(cy, e.y, e.y + e.h) - cy, de = hypot(ex, ey);
    return de < 3 || (de < 18 && (ex * dx0 + ey * dy0) / (de * d0) > .5);
  };
  for (const e of G.enemies) if (!e.dead && !e.noHit && at(e)) return true;
  for (const f of G.fighters) if (f !== p && f.hollow && !f.dead && at(f)) return true;
  return false;
}
const heldOf = f => {
  if (!f.isPlayer) return IT[f.wid]; const it = heldItem();
  if (it && (it.type === 'weapon' || it.type === 'tool')) return it;
  if (it && !carried(it)) return foeAtCursor(false) ? IT.fists : it;
  return foeAtCursor(true) || fistOK() ? IT.fists : it;
};
const fistOK = () => WORLD.arena || !G.p || !impactRay(G.p, HAND);

function atkContext(f, I) {
  const cx = f.x + f.w / 2, cy = f.y + 7, dx = I.wx - cx, dy = I.wy - cy;
  const near = abs(dx) < 7 && dy > -11 && dy < 15, side = near ? f.face : (dx >= 0 ? 1 : -1);
  const elev = near ? 0 : atan2(dy, abs(dx)), deg = elev / D2R;
  const aim = deg < -58 ? 'up' : deg < -22 ? 'upf' : deg <= 22 ? 'fwd' : deg <= 58 ? 'downf' : 'down';
  const dist = hypot(dx, dy); let far = dist > 60;
  // simple controls: the movement keys and how far away you point stop changing the attack
  const simple = f === G.p && SETTINGS.combat === 'simple';
  if (!far) for (const e of foesOf(f)) if (!e.dead && I.wx > e.x - 6 && I.wx < e.x + e.w + 6 && I.wy > e.y - 6 && I.wy < e.y + e.h + 6 && abs(e.x + e.w / 2 - cx) > 34) { far = true; break; }
  return {
    side, elev, aim, near: near && !simple, far: far && !simple, dist, air: !f.onGround && f.coyote <= 0, fwd: !simple && I.md === side, back: !simple && I.md === -side, down: !!I.down,
    dashing: f.state === 'dodge' || f.dodgeGrace > 0, riposte: f.riposte > 0, prev: f.state === 'attack' && f.atk ? f.atk.id : (f.chainT > 0 ? f.lastMove : null)
  };
}
function noteMove(f, setName, id, m, fresh) {
  if (f !== G.p) return; const key = setName + ':' + id; let isNew = false;
  if (!G.known.has(key)) { G.known.add(key); isNew = true; sfx('newmove'); G.dirty = true; }
  G.feed.unshift({ name: m.name, fresh, isNew, t: 0 }); if (G.feed.length > 5) G.feed.pop();
  G.movesUsed.add(key);
}
function startAttack(f, btn, I, force) {
  const W = heldOf(f); if (!W || W.type !== 'weapon') return false;
  if (!force && tryLink(f, btn)) return true;
  const set = MOVESETS[W.set], c = atkContext(f, I); let id = force || resolveMove(set, btn, c); if (!force && f === G.p) id = famGate(W.set, set, id, btn, c);
  let m = set.moves[id]; if (!m) return false;
  if (force) { if (m.cost) { f.stam = max(0, f.stam - m.cost); f.stamDelay = 42; } }
  else if (m.rise && c.air) { if (!f.updraft) { id = btn === 'L' ? set.map.aChain[0] : set.map.ha; m = set.moves[id]; } else f.updraft = false; }
  if (!force && m.cost) { if (f.stam < m.cost * .6) { if (f === G.p) sfx('deny'); id = resolveMove(set, 'L', c); if (f === G.p) id = famGate(W.set, set, id, 'L', c); m = set.moves[id]; if (m.rise && c.air) { id = set.map.aChain[0]; m = set.moves[id]; } } else { f.stam = max(0, f.stam - m.cost); f.stamDelay = 42; } }
  const rep = f.hist.slice(-4).filter(h => h === id).length, fresh = !f.hist.slice(-3).includes(id);
  f.hist.push(id); if (f.hist.length > 8) f.hist.shift();
  f.face = c.side; f.state = 'attack'; f.chainT = 0; f.mineP = 0;
  const a = f.atk = { f, id, m, W, set, setName: W.set, btn, phase: 0, pt: 0, face: c.side, aimA: c.elev, hits: new Map(), charge: 0, charged: false, hit: false, air: c.air, fresh, stale: fresh ? 1.1 : ([1, .86, .72, .6, .5][rep] || .5), act: m.act, dashT: 0, dashN: 0, prevAng: 0, aimOff: 0, th: 0, crit: !!m.crit, dist: c.dist, tx: I.wx, ty: I.wy, shots: 0, shotI: 0 };
  // what you wear and how well you know the weapon change how each kind of blow comes out
  if (f === G.p && gearOn()) { const air = c.air, sh = m.kind === 'shot', spd = (sh ? gearMul('bow') : a.btn === 'L' ? gearMul('light') : 1) * (air ? (gearMul('air') + 1) / 2 : 1) * styleSpeed(W, id); a.tm = (W.wsp || 1) / spd; a.gm = (a.btn === 'H' ? gearMul('heavy') : 1) * (air ? (gearMul('air') + 1) / 2 : 1) * styleDmg(W, id); a.dk = gearMul('dash') * (air ? gearMul('air') : 1); a.critB = (gearHas('crit') ? .06 : 0) + (gearHas('keen') ? .08 : 0); }
  if (!force && f === G.p && btn === 'H' && id === set.map.h) { const art = artFor(W); if (art) a.artCharge = { min: 26, max: 96, into: art }; }
  setAim(a);
  if (c.riposte) { f.riposte = 0; if (f === G.p) G.slowT = min(G.slowT, 8); }
  if (m.iframe) f.iDodge = max(f.iDodge, m.iframe + m.wind);
  if (m.leap && f.onGround) { f.vx = c.side * m.leap.vx; f.vy = m.leap.vy; f.onGround = false; f.noCut = true; dust(f.x + 3, f.y + f.h, 5); }
  noteMove(f, W.set, id, m, fresh);
  return true;
}
function setAim(a) {
  const m = a.m;
  if (m.kind === 'swing') a.aimOff = clamp(a.aimA - m.center * D2R, -m.aimed * D2R, m.aimed * D2R);
  else if (m.kind === 'thrust' || m.kind === 'shot') a.th = clamp(a.aimA, (m.lo === undefined ? -20 : m.lo) * D2R, (m.hi === undefined ? 20 : m.hi) * D2R);
  a.dashN = m.dash ? (m.dash.fixed || m.kind !== 'thrust' ? m.dash.t : clamp(ceil((a.dist - 22) / m.dash.v), 4, m.dash.t)) : 0;
  a.act = m.dash && !m.dash.fixed && m.kind === 'thrust' ? max(5, a.dashN) : m.act;
}
function swingAng(a, pt) { const m = a.m, f = m.from * D2R + a.aimOff, t = m.to * D2R + a.aimOff, u = clamp(pt / a.act, 0, 1); return f + (t - f) * (1 - pow(1 - u, 2.2)); }
function thrustExt(a, pt) {
  const m = a.m;
  if (m.pump) { const w = clamp(pt / a.act, 0, .999) * m.pump, fr = w - floor(w); return .35 + .65 * sin(min(1, fr * 2.2) * PI / 2); }
  return .4 + .6 * ease.out3(clamp(pt / min(a.act, 4), 0, 1));
}
function endAttack(f) { if (f.atk) { f.lastMove = f.atk.id; f.chainT = 26; } f.atk = null; if (f.state === 'attack') f.state = 'normal'; }

function tickAttack(f, I) {
  const a = f.atk; let m = a.m; a.pt++;
  if (a.phase === 0) {
    if (m.kind === 'plunge' && !m.leap) { f.vy = min(f.vy, -.7); f.vx *= .8; }
    if (m.float && f.vy > .5) f.vy = .5;
    if (a.pt >= round(m.wind * (a.tm || a.W.wsp || 1))) {
      const held = a.btn === 'H' ? I.r : I.l, ch = a.artCharge || m.charge;
      if (ch && held && a.charge < ch.max) {
        a.charge++; a.pt = round(m.wind * (a.tm || a.W.wsp || 1));
        if (a.charge === 7) fsx(f, 'charge');
        if (a.charge === ch.min) { a.charged = true; fsx(f, 'charged'); if (f === G.p) G.flash = max(G.flash, a.artCharge ? .3 : .18); sparks(f.x + 3, f.y + 6, a.artCharge ? 22 : 14, 0, 3, a.artCharge ? ['#8ff5e6', '#ffffff', '#ffd35a'] : SPARK); }
        if (a.charge > 6 && G.time % 2 === 0) { const an = frand(TAU), r = frand(14, 26); P(f.x + 3 + cos(an) * r, f.y + 8 + sin(an) * r, -cos(an) * 1.6, -sin(an) * 1.6, 12, fpick(SPARK), { glow: 1, g: 0, fr: 1 }); }
      } else {
        if (a.charged) { a.id = ch.into; a.artCharge = null; m = a.m = a.set.moves[a.id]; if (m.leap && f.onGround) { f.vx = a.face * m.leap.vx; f.vy = m.leap.vy; f.onGround = false; f.noCut = true; dust(f.x + 3, f.y + f.h, 5); } a.aimA = atkContext(f, I).elev; a.tx = I.wx; a.ty = I.wy; setAim(a); noteMove(f, a.setName, a.id, m, true); f.hist[f.hist.length - 1] = a.id; a.stale = 1.1; a.fresh = true; }
        a.phase = 1; a.pt = 0; beginActive(a);
      }
    }
  } else if (a.phase === 1) {
    activeTick(a);
    let end = a.pt >= a.act;
    if (m.kind === 'plunge') { end = false; if (f.onGround) { end = true; landShock(a, m.landShock, f.x + 3); } else if (a.pt > 110) end = true; }
    else if (m.endOnLand && f.onGround && a.pt > 2) end = true;
    if (a.pogoed && a.pt > a.pogoT + 2) end = true;
    if (end) {
      a.phase = 2; a.pt = 0; fadeTrail(a); if (m.dash) f.vx *= .5;
      if (m.quake && f.onGround) { for (const s of m.quake2 ? [1, -1] : [1]) spawnProj({ type: 'shock', owner: f, x: f.x + 3 + a.face * s * 14, y: f.y + f.h - 4, vx: a.face * s * 3.3, vy: 0, r: 6, dmg: round(a.W.dmg * m.quake), life: m.quake2 ? 40 : 28, pierce: true, kb: [1.5, -3.2] }); if (near(f)) { addShake(m.shake); sfx('boom'); } dust(f.x + 3 + a.face * 14, f.y + f.h, 8, '#b9bdd0', 2); if (m.quake2) landShock(a, { r: 44, dmg: 1.5, kb: [3.4, -4] }, f.x + 3 + a.face * 12); }
    }
  } else if (a.pt >= round(m.rec * (a.tm || a.W.wsp || 1))) endAttack(f);
}
function beginActive(a) {
  const f = a.f, m = a.m, fc = a.face;
  if (m.plant) f.vx = fc * max(m.step || 0, min(f.vx * fc, .9));
  else if (m.step) f.vx = fc * max(m.step, f.vx * fc);
  if (m.back) f.vx = -fc * m.back;
  if (m.hop) { f.vy = m.hop; f.onGround = false; f.noCut = true; }
  if (m.rise) { f.vy = m.rise; f.onGround = false; f.noCut = true; dust(f.x + 3, f.y + f.h, 5); }
  if (m.vault) { f.vx = fc * m.vault.vx; f.vy = m.vault.vy; f.onGround = false; f.noCut = true; dust(f.x + 3 + fc * 8, f.y + f.h, 6); }
  if (m.kind === 'plunge') { f.vy = 6.6; f.vx *= .3; }
  if (m.proj) fireProj(a);
  if (m.kind === 'shot') { a.shots = m.arrows.n; a.shotI = 0; if (!m.arrows.burst) { fireArrows(a, a.shots); a.shots = 0; } }
  a.dashT = a.dashN; a.prevAng = m.kind === 'swing' ? m.from * D2R + a.aimOff : 0;
  if (m.kind !== 'shot') fsx(f, m.kind === 'thrust' ? 'thrust' : (m.kind === 'spin' || m.kind === 'flip') ? 'spin' : m.big ? 'heavy' : (G.time & 1 ? 'swing' : 'swing2'), 0);
}
function activeTick(a) {
  const f = a.f, m = a.m, fc = a.face;
  if (a.dashT > 0) {
    a.dashT--;
    const dv = m.dash.v * (a.dk || 1);
    if (m.dash.along) { f.vx = fc * cos(a.th) * dv; f.vy = sin(a.th) * dv; }
    else { f.vx = fc * dv; if (m.dash.vy !== undefined) f.vy = m.dash.vy; else if (!f.onGround) f.vy = min(f.vy, 0) * .5; }
    if (a.pt % 2 === 0) f.ghostReq = true;
  }
  if (m.float && f.vy > .4) f.vy = .4;
  if (m.hover) f.vy = lerp(f.vy, -.9, .25);
  if (m.kind === 'plunge') { f.vy = 6.8; f.vx *= .8; if (a.pt % 2 === 0) f.ghostReq = true; }
  if (m.fall && !a.pogoed) f.vy = max(f.vy, m.fall);
  if (m.kind === 'spin' && a.pt % 3 === 0) f.ghostReq = true;
  if (a.shots > 0 && a.pt % m.arrows.burst === 1 % m.arrows.burst) { fireArrows(a, 1); a.shots--; }
  if (m.kind !== 'shot') attackHits(a);
}
function fireArrows(a, count) {
  const f = a.f, m = a.m, A = m.arrows, fc = a.face, sx = f.x + 3 + fc * 5, sy = f.y + (A.low ? 16 : 7);
  if (a.W.ammo && f.isPlayer && !(WORLD.arena && !WORLD.royale) && WORLD.mode !== 1) { count = min(count, countItem('arrow')); if (count <= 0) { sfx('deny'); if (G.time - (G.hintT || -999) > 240) { G.hintT = G.time; say('No arrows. Bind flint to sticks with fiber.'); } return; } removeItem('arrow', count); }
  for (let k = 0; k < count; k++, a.shotI++) {
    let vx, vy, g = A.g === undefined ? .05 : A.g;
    if (A.rain) { const tx = a.tx + (A.n > 1 ? (a.shotI - (A.n - 1) / 2) * 10 : 0) + frand(-3, 3), Tf = A.tf || 46; g = .16; vx = clamp((tx - sx) / Tf, -7, 7); vy = (a.ty - sy - .5 * g * Tf * Tf) / Tf; }
    else { const v = A.v || 6.5; if (A.radial) { const th = a.shotI / A.n * TAU; vx = cos(th) * v; vy = sin(th) * v; } else { const th = a.th + (A.spread ? (a.shotI - (A.n - 1) / 2) * A.spread : 0) + (A.burst ? frand(-.025, .025) : 0); vx = fc * cos(th) * v; vy = sin(th) * v; } }
    spawnProj({ type: A.boom ? 'bomb' : 'arrow', owner: f, x: sx, y: sy, vx, vy, g, r: 3, dmg: max(1, round(a.W.dmg * m.dmg * a.stale * (f.dmgMul || 1))), pierce: !!A.pierce, boom: A.boom || 0, life: 190, kb: [m.kb[0], m.kb[1]], crit: a.crit, stagger: m.stagger, stop: m.stop });
  }
  fsx(f, 'bolt', 0); fsx(f, 'thrust', 0);
}
function attackHits(a) {
  const f = a.f, m = a.m, fc = a.face, cx = f.x + f.w / 2, sx = cx + fc, sy = f.y + 6, L = (ARM + a.W.len) * m.reach, pts = [], foes = foesOf(f);
  if (m.kind === 'swing') {
    const a1 = swingAng(a, a.pt), a0 = a.prevAng; a.prevAng = a1;
    for (let k = 0; k <= 4; k++) { const th = a0 + (a1 - a0) * k / 4, c = cos(th) * fc, s = sin(th); for (let r = 2; r < L; r += 3) pts.push(sx + c * r, sy + s * r); pts.push(sx + c * L, sy + s * L); }
    if (m.wide) pts.push(cx, f.y + 4, cx, f.y + 10, cx, f.y + 17, cx - fc * 7, f.y + 10, cx + fc * 7, f.y + 10);
    if (a.pt % 2 === 0 && a.W.glow) P(sx + cos(a1) * fc * L, sy + sin(a1) * L, frand(-.4, .4), frand(-.6, .2), 14, fpick(SPARK), { glow: 1, g: -.01 });
    hitPts(a, pts, 3);
    // the edge bites the ground where it meets it
    if (f === G.p && !a.dug) for (const k of [1, .72]) { const b0 = a0 === undefined || a0 === a1 ? a1 - .15 * (a.m.to > a.m.from ? 1 : -1) : a0, x1 = sx + cos(a1) * fc * L * k, y1 = sy + sin(a1) * L * k, x0 = sx + cos(b0) * fc * L * k, y0 = sy + sin(b0) * L * k, d = hypot(x1 - x0, y1 - y0) || 1; if (terrainStrike(a, x1, y1, (x1 - x0) / d, (y1 - y0) / d)) break; }
  } else if (m.kind === 'thrust') {
    const c = cos(a.th) * fc, s = sin(a.th), tip = L * thrustExt(a, a.pt);
    for (let r = 2; r < tip; r += 3) pts.push(sx + c * r, sy + s * r); pts.push(sx + c * tip, sy + s * tip);
    hitPts(a, pts, 3.5);
    if (f === G.p && !a.dug && tip > L * .6) terrainStrike(a, sx + c * tip, sy + s * tip, c, s);
  } else if (m.kind === 'spin' || m.kind === 'flip') {
    const all = m.kind === 'flip' || m.wheel || m.heli, cy = f.y + 10;
    for (const e of foes) if (!e.dead && !e.noHit && circBox(cx, cy, L, e) && (all || (e.y < f.y + f.h + 3 && e.y + e.h > f.y - 5))) applyHit(a, e, clamp(cx, e.x, e.x + e.w), clamp(cy, e.y, e.y + e.h));
    for (const pr of G.projs) if (pr.owner !== f && pr.reflect && hypot(pr.x - cx, pr.y - cy) < L + pr.r) reflectProj(pr, a);
    if (f === G.p) for (let r = 5; r <= L; r += 4) for (const s of [-1, 1]) { const tx = floor((cx + s * r) / T), ty = floor((f.y + 14) / T), t = tileAt(tx, ty); if (t && TP[t].decor) breakTile(tx, ty); }
  } else if (m.kind === 'plunge') {
    for (const e of foes) if (!e.dead && !e.noHit && e.x < cx + 7 && e.x + e.w > cx - 7 && e.y < f.y + f.h + a.W.len * .8 && e.y + e.h > f.y + 8) applyHit(a, e, cx, f.y + f.h);
  } else if (m.kind === 'kick') {
    const x0 = fc > 0 ? cx : cx - 18;
    for (const e of foes) if (!e.dead && !e.noHit && e.x < x0 + 18 && e.x + e.w > x0 && e.y < f.y + f.h && e.y + e.h > f.y + 6) applyHit(a, e, cx + fc * 10, f.y + 14);
  }
}
function hitPts(a, pts, pad) {
  const f = a.f;
  for (const e of foesOf(f)) {
    if (e.dead || e.noHit) continue;
    for (let i = 0; i < pts.length; i += 2) { const X = pts[i], Y = pts[i + 1]; if (X >= e.x - pad && X <= e.x + e.w + pad && Y >= e.y - pad && Y <= e.y + e.h + pad) { applyHit(a, e, clamp(X, e.x, e.x + e.w), clamp(Y, e.y, e.y + e.h)); break; } }
  }
  for (const pr of G.projs) { if (pr.owner === f || !pr.reflect) continue; for (let i = 0; i < pts.length; i += 2) if (hypot(pts[i] - pr.x, pts[i + 1] - pr.y) < pr.r + 5) { reflectProj(pr, a); break; } }
  if (f === G.p) for (let i = 0; i < pts.length; i += 2) { const tx = floor(pts[i] / T), ty = floor(pts[i + 1] / T), t = tileAt(tx, ty); if (t && TP[t].decor) breakTile(tx, ty); }
}
function reflectProj(pr, a) {
  const from = pr.owner; pr.owner = a.f; pr.reflect = false; pr.hits.clear(); pr.life = 130; pr.dmg = round(max(pr.dmg, a.W.dmg * 2.2)); pr.kb = [2, -1];
  let tx = pr.x - pr.vx * 30, ty = pr.y - pr.vy * 30; const b = from || G.boss; if (b && !b.dead) { tx = b.x + b.w / 2; ty = b.y + b.h / 2; }
  const d = hypot(tx - pr.x, ty - pr.y) || 1, sp = hypot(pr.vx, pr.vy) * 1.7; pr.vx = (tx - pr.x) / d * sp; pr.vy = (ty - pr.y) / d * sp; pr.g = 0;
  fsx(a.f, 'reflect'); sparks(pr.x, pr.y, 10); numPop(pr.x, pr.y - 6, 'DEFLECT', '#8ff5e6'); if (a.f === G.p) { G.hitstop = max(G.hitstop, 3); comboHit(true); }
}
function comboHit(fresh) { const c = G.combo; c.n++; c.t = 180; c.pts += fresh ? 3 : 1; }
function hitFx(hx, hy, top, dmg, o, kx, involved) {
  numPop(hx, top - 4, dmg, o.crit ? '#ffd35a' : '#ffffff', o.crit ? 2 : 1); sparks(hx, hy, o.crit ? 12 : 6, sign(kx), 2.4, o.cold ? FROST : SPARK); if (o.blunt) dust(hx, hy, 4);
  G.trails.push({ kind: 'hit', x: hx, y: hy, life: 5, max: 5, a: frand(TAU), big: o.crit || o.stop >= 5 });
  if (involved || near({ x: hx, y: hy })) sfx(o.crit ? 'crit' : (o.stop >= 5 ? 'hit2' : 'hit'), 20);
  if (involved) { G.hitstop = max(G.hitstop, (o.stop || 2) + (o.crit ? 2 : 0)); if (o.shake) addShake(o.shake + (o.crit ? 1.5 : 0)); }
}
// every hit in the game goes through here: monsters, AI duelists, other people online
function strike(by, e, dmg, kx, ky, o) {
  if (!e.fighter) { const r = damageEnemy(e, dmg, kx, ky, o) > 0; if (r && o.launch && !e.dead && !o.link) applyStatus(e, 'launched', by); return r; }
  const hx = o.hx === undefined ? e.x + 3 : o.hx, hy = o.hy === undefined ? e.y + 10 : o.hy;
  if (e.remote) { if (e.dead || e.spawnT > 0 || e.noHit) return false; netHit(e, dmg, kx, ky, o.crit, 0, by); e.flash = 6; hitFx(hx, hy, e.y, max(1, round(dmg * .8)), o, kx, by === G.p); return true; }
  const r = hurtFighter(e, dmg, by ? by.x + 3 : hx - kx, { kx, ky, by, pvp: !!(by && by.fighter), stop: o.stop, shake: o.shake, crit: o.crit, stagger: o.stagger, blunt: o.blunt, launch: o.launch, cold: o.cold, hx, hy, link: o.link });
  if (r && o.launch && !e.dead && !o.link) applyStatus(e, 'launched', by); return r;
}
function applyHit(a, e, hx, hy) {
  const f = a.f, m = a.m, root = e.root || e, last = a.hits.get(root);
  if (last !== undefined && (!m.multi || a.pt - last < m.multi)) return; a.hits.set(root, a.pt);
  const P0 = f === G.p, sharp = P0 && f.sharp > 0;
  const crit = a.crit || Math.random() < .07 + (a.W.crit || 0) + (a.critB || 0) + (P0 ? boonAdd('crit') : 0);
  let dmg = a.W.dmg * m.dmg * a.stale * (P0 ? 1 + rankI() * .04 + qBonus(a.W.id) + (sharp ? .2 : 0) : 1) * (crit && !a.crit ? 1.6 : 1) * (f.dmgMul || 1) * (a.gm || 1) * (P0 ? (a.btn === 'H' ? boonMul('hdmg') : 1) * (m.counter ? boonMul('counter') : 1) : 1);
  const lk = P0 ? flowPay(a, e) : null; if (lk) dmg *= lk.mul * (lk.tag ? boonMul('flow') : 1);
  dmg = max(1, round(dmg * frand(.93, 1.07)));
  let kx = m.kb[0] * a.face; if (m.kind === 'spin') kx = m.kb[0] * (sign((e.x + e.w / 2) - (f.x + 3)) || a.face);
  if (!strike(f, e, dmg, kx, m.kb[1], { stagger: m.flow === 'down' ? max(m.stagger || 0, 45) : m.stagger, launch: m.launch, crit, stop: (m.stop || 0) + (lk && lk.tag ? 2 : 0), shake: m.shake, blunt: m.blunt, cold: a.W.cold, hx, hy })) return;
  if (P0) { flowSet(a, e, lk, hx, hy); famGain(a.setName, ((a.fresh ? 1 : .4) + (lk && lk.tag ? 1 : 0)) * (e.type === 'dummy' ? .5 : 1)); if (e.type !== 'dummy') artGain(a.W); }
  if (a.W.burn && !e.dead) applyStatus(e, 'burn', f, { d: 110 });
  if (!e.dead) { if (a.W.frost) applyStatus(e, 'frost', f, { d: 100 }); if (a.W.poison || (P0 && f.venom > 0)) applyStatus(e, 'poison', f, { d: 260 }); if (a.W.bleed && Math.random() < a.W.bleed) applyStatus(e, 'bleed', f, { d: 180 }); }
  if (a.W.steal && f.hp < f.maxhp) { f.hp = min(f.maxhp, f.hp + max(1, round(dmg * a.W.steal))); }
  if (P0 && gearHas('hungry') && f.hp < f.maxhp && Math.random() < .5) f.hp = min(f.maxhp, f.hp + max(1, round(dmg * .06)));
  if (P0 && boonHas('fang') && f.hp < f.maxhp && e.type !== 'dummy') f.hp = min(f.maxhp, f.hp + min(5, max(1, round(dmg * .04))));
  if (P0 && !e.dead && gearHas('venom') && Math.random() < .35) applyStatus(e, 'poison', f, { d: 160 });
  if (P0) styleHit(a, e, dmg);
  if (P0) { if (sharp) f.sharp--; if (f.venom > 0) f.venom--; }
  if (f === G.p) comboHit(a.fresh && !a.hit); a.hit = true;
  if (m.pogo && !a.pogoed) { a.pogoed = true; a.pogoT = a.pt; f.vy = -4.3; f.noCut = true; f.airDash = airDashMax(f); f.updraft = true; f.dblUsed = false; }
  else if (!f.onGround && m.float) f.vy = min(f.vy, -.7);
}
function landShock(a, S, cx) {
  const f = a.f, m = a.m, fy = f.y + f.h; if (!S) return;
  if (near(f)) { addShake(m.shake); sfx('boom'); } if (f === G.p) G.hitstop = max(G.hitstop, 4);
  for (const e of foesOf(f)) { if (e.dead || e.noHit) continue; const dx = e.x + e.w / 2 - cx; if (abs(dx) < S.r + e.w / 2 && e.y < fy + 8 && e.y + e.h > fy - 26) strike(f, e, round(a.W.dmg * S.dmg * a.stale), (sign(dx) || 1) * S.kb[0], S.kb[1], { stop: 3, shake: 0, launch: 1, hx: e.x + e.w / 2, hy: e.y + e.h }); }
  for (let i = 0; i < 22; i++) P(cx, fy - 1, (i - 10.5) * .42, frand(-1.6, -.2), frand(18, 34) | 0, i % 3 ? '#b9bdd0' : '#8b8fa3', { g: .03, fr: .94 });
  sparks(cx, fy - 2, 14, 0, 3); G.trails.push({ kind: 'ring', x: cx, y: fy, r: S.r, life: 12, max: 12 });
  if (f === G.p) { for (let dx = -S.r; dx <= S.r; dx += 4) { const tx = floor((cx + dx) / T), ty = floor((fy - 2) / T), t = tileAt(tx, ty); if (t && TP[t].decor) breakTile(tx, ty); } terrainSlam(a, cx, fy); }
}
function explode(x, y, r, dmg, by) {
  boomFx(x, y, r);
  for (const e of foesOf(by)) { if (e.dead || e.noHit) continue; if (circBox(x, y, r, e)) strike(by, e, dmg, (sign(e.x + e.w / 2 - x) || 1) * 3, -2.6, { stop: 4, shake: 2, hx: e.x + e.w / 2, hy: e.y + e.h / 2 }); }
}
function fireProj(a) {
  const f = a.f, m = a.m, fc = a.face, cx = f.x + 3, cy = f.y + 7, dm = f.dmgMul || 1;
  if (m.proj === 'wave') { const el = clamp(a.aimA, -.6, .6); spawnProj({ type: 'wave', owner: f, x: cx + fc * 10, y: cy + 2, vx: fc * cos(el) * 4.8, vy: sin(el) * 4.8, r: 11, dmg: round(a.W.dmg * 2.2 * dm), pierce: true, life: 46, kb: [3.5, -1.5] }); fsx(f, 'wave', 0); }
  else if (m.proj === 'javelin') spawnProj({ type: 'javelin', owner: f, x: cx + fc * 8, y: cy, vx: fc * cos(a.th) * 6.4, vy: sin(a.th) * 6.4, g: .09, r: 4, dmg: round(a.W.dmg * 2.8 * dm), life: 130, kb: [4, -1], spr: a.W.held });
  else if (m.proj === 'knife') spawnProj({ type: 'knife', owner: f, x: cx + fc * 6, y: cy, vx: fc * cos(a.th) * 7, vy: sin(a.th) * 7, g: .03, r: 3, dmg: round(a.W.dmg * 1.3 * dm), life: 90, kb: [1.5, -.4] });
}
function fadeTrail(a) {
  const f = a.f, m = a.m, cx = f.x + 3 + a.face, cy = f.y + 6, L = (ARM + a.W.len) * m.reach;
  if (m.kind === 'swing') G.trails.push({ kind: 'arc', x: cx, y: cy, face: a.face, a0: m.from * D2R + a.aimOff, a1: m.to * D2R + a.aimOff, r0: ARM + a.W.len * .3, r1: L, life: m.style || m.pair ? 10 : 7, max: m.style || m.pair ? 10 : 7, hot: a.W.glow || m.big, cold: a.W.cold, sty: m.style || m.pair ? STY_COL[m.el] || (m.pair ? STY_COL.pair : STY_COL.style) : null });
  else if (m.kind === 'thrust') G.trails.push({ kind: 'stab', x: cx, y: cy, face: a.face, th: a.th, r1: L, life: 6, max: 6 });
}

// ---- pose overlay: turns the attack state into limb + weapon angles ----
function atkPose(P, a, al) {
  const m = a.m, idle = a.set.idle, ph = a.phase, pt = a.pt + (ph === 0 && a.charge > 0 ? 0 : al), k = m.kind;
  const uw = ease.out(clamp(pt / m.wind, 0, 1)), ua = clamp(pt / a.act, 0, 1), ur = clamp(pt / m.rec, 0, 1);
  P.armExt = 1; P.stance = ph === 2 ? 1 - ur : 1;
  if (k === 'swing') {
    const f = m.from * D2R + a.aimOff, t = m.to * D2R + a.aimOff, sg = sign(t - f), l0 = sg > 0 ? -.2 : .16, l1 = sg > 0 ? .32 : -.2;
    if (ph === 0) { P.wAng = lerp(idle, f, uw); P.lean = l0 * uw; }
    else if (ph === 1) { P.wAng = swingAng(a, pt); P.lean = lerp(l0, l1, ease.out(ua)); }
    else { const ov = t + sg * .2; P.wAng = ur < .3 ? lerp(t, ov, ease.out(ur / .3)) : lerp(ov, idle, ease.io((ur - .3) / .7)); P.lean = l1 * (1 - ease.io(ur)); }
    if (m.crouch) P.crouch = m.crouch * (ph === 2 ? 1 - ur : ph === 0 ? uw : 1);
  } else if (k === 'thrust') {
    const th = a.th;
    if (ph === 0) { P.wAng = lerp(idle, th, uw); P.armExt = lerp(.85, .4, uw); P.lean = -.14 * uw; }
    else if (ph === 1) { const e = thrustExt(a, pt); P.wAng = th; P.armExt = m.blunt ? e * .7 : e; P.wOff = m.blunt ? -5 : (e - .4) * 5; P.lean = .36 * e * (abs(th) > 1.2 ? .3 : 1); }
    else { P.wAng = lerp(th, idle, ease.io(ur)); P.armExt = lerp(1, .85, ur); P.wOff = 3 * (1 - ur); P.lean = .3 * (1 - ur) * (abs(th) > 1.2 ? .3 : 1); }
    if (m.vault && ph === 1) P.rot = -.5 * sin(ua * PI);
    if (th > 1 && th < 2 && ph < 2) P.tuck = 1;
  } else if (k === 'shot') {
    const th = a.th, q = ph === 0 ? uw : ph === 1 ? 1 : 1 - ease.io(ur);
    P.wAng = lerp(idle, th, q); P.armFix = 1; P.armA = lerp(1.15, th, q); P.armExt = lerp(.8, 1, q); P.armB = lerp(1.75, th, q); P.armBext = ph === 0 ? lerp(.85, .3, uw) : ph === 1 ? .9 : .85; P.draw = ph === 0 ? uw : 0; P.lean = -.1 * q;
    if (m.crouch) P.crouch = m.crouch * q; if (th > 1.2) P.tuck = .7 * q;
    if (m.flipB && ph >= 1) { const u = (ph === 1 ? pt : a.act + pt) / (a.act + 8); if (u < 1) P.rot = -u * TAU; }
    if (m.spinB && ph === 1) P.rot = ua * m.spinB * TAU;
  } else if (k === 'spin' && m.wheel) {
    if (ph === 0) P.wAng = lerp(idle, -PI / 2, uw); else if (ph === 1) { P.wAng = -PI / 2 + ua * m.turns * TAU; P.lean = .12 * sin(ua * m.turns * TAU); } else P.wAng = lerp(-PI / 2, idle, ease.io(ur));
    P.wOff = -6 * (ph === 2 ? 1 - ur : ph === 0 ? uw : 1);
  } else if (k === 'spin' && m.heli) {
    const q = ph === 0 ? uw : ph === 1 ? 1 : 1 - ease.io(ur); P.armFix = 1; P.armA = lerp(1.15, -PI / 2, q); P.armExt = 1; P.wAng = lerp(idle, 0, q); P.wOff = -7.5 * q; P.tuck = .5 * q;
    if (ph === 1) P.wFlip = cos(ua * m.turns * TAU);
  } else if (k === 'spin') {
    if (ph === 0) { P.wAng = lerp(idle, .12, uw); P.crouch = uw; }
    else if (ph === 1) { P.spin = cos(ua * m.turns * TAU); P.wAng = .12; P.crouch = 1; }
    else { P.wAng = lerp(.12, idle, ease.io(ur)); P.crouch = 1 - ur; }
  } else if (k === 'flip') {
    if (ph === 0) { P.wAng = lerp(idle, -PI / 2, uw); P.tuck = uw; }
    else if (ph === 1) { P.rot = ua * m.turns * TAU; P.wAng = -PI / 2; P.tuck = 1; }
    else { P.wAng = lerp(-PI / 2, idle, ease.io(ur)); P.tuck = 1 - ur; }
  } else if (k === 'plunge') {
    if (ph === 0) { P.wAng = lerp(idle, -PI / 2, uw); P.tuck = uw; P.lean = -.2 * uw; }
    else if (ph === 1) { P.wAng = PI / 2; P.armExt = .75; P.tuck = .6; P.lean = .12; }
    else { P.wAng = lerp(PI / 2, idle, ease.io(ur)); P.crouch = 4 * (1 - ur); P.armExt = .8; }
  } else if (k === 'kick') {
    P.wAng = idle - .5; P.armExt = .8;
    if (ph === 0) { P.kick = uw * .35; P.lean = -.2 * uw; } else if (ph === 1) { P.kick = 1; P.lean = -.38; } else { P.kick = 1 - ease.io(ur); P.lean = -.38 * (1 - ur); }
  }
  if (a.charge > 0 && ph === 0) { P.wAng += sin(G.time * 1.9) * .035 * min(1, a.charge / 20); P.lean -= .08 * min(1, a.charge / 30); }
  if (!P.armFix) P.armA = P.wAng;
  if (a.W.dual && k !== 'kick') { P.armB = P.armA + (k === 'swing' ? .5 : .12); P.armBext = k === 'thrust' && ph === 1 ? clamp(1.4 - P.armExt, .35, 1) : P.armExt * .9; P.w2Ang = P.wAng + (k === 'swing' ? .55 : 0); }
}
