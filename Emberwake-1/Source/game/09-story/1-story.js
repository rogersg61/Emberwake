// ============================================================
//  Lore, journal, quests, dialogue, the lamplighter
// ============================================================
const INTRO = [
  'Before the dark there was the Dawnforge,\na ring of fire turning above Aldermere.\nIts light was called morning.',
  'Then the Hollow rose from beneath the world,\na hunger with no face. The ring cracked,\nand three embers fell across the land.',
  'Wardens were raised to guard them until\nsomeone came to carry them home.\nThey waited so long they forgot what for.',
  'You are a Waker. Ash that remembered\nhow to stand.\n\nThe embers are out there. Whether you\ncarry them home is up to you.'
];
const JOURNAL = {
  waking: ['Waking', 'You were ash on the wind. Then something said rise, and you had hands again. The old tongue called your kind Wakers: the dead of the Dawnforge, kindled one last time when the light is in danger. You woke with nothing at all: no blade, no pack, not even a knife. The land will have to give you the rest.'],
  forge: ['The Dawnforge', 'Look up. The broken ring of fire is the Dawnforge, or what is left of it. Its light was called morning. When the Hollow rose from below, the ring cracked and three embers fell out across the land. While they lie cold, every night runs a little longer than the last.'],
  wick: ['Wick', 'The lamplighter has kept the same campfire burning for longer than he will admit. He talks like a man who has buried a lot of Wakers and would rather not bury another. He told you to start with what the ground gives.'],
  forms: ['The Forms', 'A Waker does not swing a weapon. A Waker answers with it. Where you look, how you move, whether your feet are on the ground: the weapon reads all of it and chooses. The same form twice in a row grows dull. Variety keeps the edge.'],
  motes: ['Ash Motes', 'Ash that drifted too close to a fallen ember and learned to be hungry. They are not cruel. They are only trying to get warm.'],
  husks: ['Husks', 'Soldiers of the old watch. The Hollow emptied them and left the armor walking. They raise the blade slowly, as if trying to remember why. That pause is your opening: strike it, or step through it.'],
  flits: ['Cinder Flits', 'They nest where emberstone glows and hunt whatever carries heat. You carry a great deal.'],
  mites: ['Glass Mites', 'Stillglass grows them the way frost grows ferns. They skitter, they stop, and then they jump at you. Watch for the stop.'],
  glowcap: ['Dewbulbs', 'The only thing in the Underdark that makes its own light and asks nothing for it. Two of them, crushed together, make a salve.'],
  hollow: ['The Ashen Hollow', 'Nothing grows here. The first ember fell on this ground and the ground has not forgiven it. The shrine at its center was a place of offering once. Now it is a door with a guard.'],
  warden: ['The Ashen Warden', 'The Wardens were raised from the hills to guard the embers until the Wakers came. They waited so long that they lost the second half of the order. Its fists tire. Its bolts can be turned back with a well-timed cut.'],
  fall: ['What the Stone Kept', 'Inside the Warden, under centuries of moss, the ember was still lit. It never went out. It was only kept. When you took it up, you felt the ground let go of you a little: you can jump again in mid-air.'],
  west: ['Another Waker', 'Wick says you were not the first to wake this age. Another came through before you, quick as water and cold as a well, and went west into the Stillglass. Whatever she wants with the second ember, it is not to bring it home.'],
  reach: ['Stillglass Reach', 'The cold out here is not weather. When the second ember fell it froze the hills in the shape they were in, mid-breath. The stalks grow glass instead of pods.'],
  mirror: ['The Mirror Court', 'A court of broken pillars around a mirror tall as a house. It does not show you. It shows the sky the way it was before the ring broke.'],
  vesper: ['Vesper', 'The Glass Waker. She woke an age before you and spent it keeping the Still Ember from anyone who would carry it home. She believes the Hollow wakes with the morning. She fights with a pike first, then two blades, then her own reflection.'],
  vesper2: ['The Still Ember', 'Vesper yielded, and the second ember settled behind your ribs with a cold you can feel in your teeth. Your feet have learned to push off the air twice: dodge two times before you land.'],
  wick2: ['What Wick Knows', 'Wick knew Vesper once. She kept a fire too, before hers went out. He thinks she might not be wrong about the Hollow. He thinks you should keep going anyway.'],
  gate: ['The Furnace Gate', 'In Rustfall, a door taller than any stalk is set into the hillside. Three sockets. Two of them hum when you come near. Something on the other side has been waiting a very long time.'],
  ring: ['The Cinder Ring', 'A coliseum where Wakers sparred, once. The echoes that wait there are memories of every Waker who ever fought in it. Other Wakers can reach it too, from wherever they woke.'],
  village: ['Hearthhold', 'The last village that still keeps its lamps lit. A dojo, a smithy, a watchtower, a well, and a fire in the square that has not gone out in living memory.'],
  juno: ['Juno', 'Juno runs the dojo. She does not care which weapon you carry. She cares what happens between two of them: the star that pins, the chain that follows.'],
  bram: ['Bram', 'The smith. Bald, bearded, busy. His family worked the Drowned Forge before the Keeper took it, and he has never once gone down to look.'],
  links: ['Links', 'A foe that is pinned, hooked, burning, blinded or thrown into the air is a foe in the middle of a sentence. The right weapon finishes it. The codex [C] keeps every link you find.'],
  hook: ['The Chain Hook', "Juno's, once. Thrown at a foe it drags them to you. Thrown at a wall or a ceiling it drags you to it. Heavy things stay put and pull you in instead."],
  flasks: ['Ember Flasks', 'Ember oil sealed in stillglass. It bursts into fire that clings to whatever it touches, and pools on the ground for a while after.'],
  drift: ['The Drift', 'When the ring broke, pieces of the sky broke too. They never fell. Updraft vents on the moor still breathe up toward them. Skyrays nest there and do not like visitors.'],
  under: ['The Underdark', 'Under every field, the stone is hollow: chambers like split geodes, joined by cracks. Some are so large they have their own weather.'],
  deep: ['The Deep', 'Below the Underdark the rock turns red and veined, and the lakes are molten cinder. A road runs through it that nobody remembers building.'],
  mine: ['Rustfall Mine', 'A timbered shaft dropped straight into the earth. Rope bridges zigzag down it every few strides, all the way to the Deep road.'],
  forge2: ['The Drowned Forge', 'A hall of brick at the bottom of the world, flooded at both ends. Hearths still burn along its back wall. Something tends them.'],
  keeper: ['The Forge-Keeper', 'It works the forge as if the forge still has work. It cannot be pinned, and fire means nothing to it. Smoke, though. Smoke it cannot see through.'],
  e3: ['The Deep Ember', 'The third ember sits warm in your chest. Molten cinder does not burn you now. You can walk the lakes of the Deep like puddles.'],
  spireseen: ['The Broken Spire', 'A watchtower older than the village, broken off at the top. Platforms still climb its inside.'],
  spire: ['What the Spire Says', 'THE RING WAS NOT BROKEN. IT WAS OPENED. And under it, smaller, newer: by whom.'],
  kiln: ['The Kiln Heart', 'Behind the Furnace Gate a tunnel runs into the hill and stops at a round red door, warm to the touch, sealed from the inside. Something in there is awake. It is not ready to see you.'],
  hollowborn: ['Hollowborn', 'What the Deep makes of people who stayed too long. They fight with the old forms and they throw smoke and stars. They are what a Waker becomes without a fire to come back to.'],
  survival: ['Living off the land', 'Hands dig loam, sand and clay, and pull plants. Rock needs a pick, stalks need an axe. Every swing lands where you aim: chip a tunnel exactly as you want it, and the dust and rubble you knock loose is what you carry home. Sand and gravel fall when undercut; stalks topple when cut. Hunger is slow, but it is real: cooked food feeds far better than raw.'],
  stations: ['Stations', 'Workbench: saw with long steady strokes. Potter\'s wheel: raise the clay, steer against the wobble, stop at the marks. Kiln: feed it, open the damper for heat, shut it to bake charcoal. Quern: grind in circles. Bloomery: pump the bellows and hold the heat band. Anvil: strike on the marks; clean work makes better steel. Loom: A and D on the beat. Cauldron: stir steadily, ladle at the colour. Mason\'s bench: chisel along the line. Sieve: shake. Drying rack: hang it and wait, faster in sun or by a fire.'],
  m_ashhare: ['Ashhares', 'Skittish grey hares of the moors and dunes. They run before you are close. Meat and a small hide: the first meal of most Wakers.'],
  m_thornback: ['Thornbacks', 'Bramble-backed boars. They paw the ground, then charge in a straight line. Step aside and let them hit a wall: they stand dazed long enough to finish. Tusks make claws and clubs.'],
  m_glassfly: ['Glassflies', 'Swarms of living glass from the Reach. They circle, flash, and dart. Killed, they burst into splinters. Their wings fletch arrows and skin gliders.'],
  m_lurker: ['Bog Lurkers', 'Flat-headed things that wait under fen water with only their eyes showing. Stand near the water and they lunge and drag. Stranded on land they flop helplessly. Their oil burns bright and slow.'],
  m_crawler: ['Crawlers', 'Long-legged cave things that walk the ceiling and drop on whatever passes below. Poisonous. Their chitin is light and hard: claws, frame packs.'],
  m_serpent: ['Dune Serpents', 'They swim under the sand. The ground rumbles, then they burst up beneath you. Strike while they are in the air; underground nothing touches them. Scales and venom.'],
  m_golem: ['Crystal Golems', 'Walking geodes deep in the Underdark. Slow, armoured: blades skid, but hammers and mauls crack them. They slam the ground and throw shards. A golem\'s heart is a geode heart, and waystones are built around one.'],
  rustbacks: ['Rustbacks', 'Armored crawlers of Rustfall. They curl into a ball and come at you like barrels. A star knife stops the roll cold.'],
  skyrays: ['Skyrays', 'Glass-winged gliders of the Drift. They circle, then fold and dive. Skysilk sheds from them when they fall.'],
  cinderlings: ['Cinderlings', 'Living drips of molten cinder. They spit, and the spit burns.'],
  w_chuks: ['Rattlechain', 'Two sticks and a chain. Every form snaps. Its best work is on a foe that cannot move.'],
  w_fangs: ['Twinfangs', 'Two short blades, two hands, no patience. Light forms chain four deep, and holding the heavy form becomes Thousand Cuts.'],
  w_maul: ["Warden's Knuckle", "A knuckle of the Warden's own stone on a stalkwood haft. Heavy forms do not flinch when struck, and some of them crack the ground ahead of you."],
  w_bow: ['Dawnstring', 'A bow strung with a thread of morning. Its arrows never run out. Aim straight up to rain them down. Hold the heavy draw for a Sunlance.']
};
// ---------------- leads: things you have heard about. Nothing makes you follow them ----------------
const LEADS = {
  wick: { title: 'The lamplighter', text: 'Someone keeps a fire in the square of Hearthhold.', at: () => SPOTS.camp && SPOTS.camp.x, done: () => G.flags.metWick },
  juno: { title: "Juno's dojo", text: 'Juno trains anyone who asks in the two-floor dojo in Hearthhold.', at: () => SPOTS.juno && SPOTS.juno.x, done: () => G.flags.metJuno },
  bram: { title: "Bram's smithy", text: 'Bram works the smithy in Hearthhold. His bench and kiln are open to anyone.', at: () => SPOTS.bram && SPOTS.bram.x, done: () => G.flags.metBram },
  warden: { title: 'The first ember', text: 'An ember fell into the crater east of the village. The Ashen Warden still guards it at the shrine. It wakes for an Ashen Offering (Offering Altar).', at: () => SHRINE_X, done: () => G.flags.wardenDead },
  vesper: { title: 'The Glass Waker', text: 'Another Waker, Vesper, keeps the second ember at the Mirror Court, high in the western mountains. The mirror answers a Mirror Offering (it needs a Warden\'s Sigil).', at: () => SHRINE2_X, done: () => G.flags.vesperDone },
  keeper: { title: 'The Drowned Forge', text: 'The third ember fell to the bottom of the world. A Keeper sleeps over the anvil of the Drowned Forge. Strike it with a Forge Offering (it needs a Glass Sigil).', at: () => FORGE_X, done: () => G.flags.keeperDead },
  mine: { title: 'The long way down', text: "Rustfall's old mine shaft drops all the way to the road through the Deep.", at: () => MINE_X, done: () => G.found.has('mine') },
  drift: { title: 'The altar in the sky', text: 'Islands ride the wind above the moor. Updraft vents lift you to them. An altar up there holds a chain hook.', at: () => SKY_X, done: () => G.flags.gotHook },
  flask: { title: 'An ember flask', text: "An ember flask rests on a dais in the Drowned Forge's west hall.", at: () => SPOTS.flask && SPOTS.flask.x, done: () => G.flags.gotFlask },
  spire: { title: 'The Broken Spire', text: 'An old watchtower stands on the western moor. Something is carved at the top.', at: () => SPOTS.spire && SPOTS.spire.x, done: () => G.flags.spireRead },
  gate: { title: 'The Furnace Gate', text: 'A door in Rustfall with three sockets. It wants all three embers.', at: () => GATE_X, done: () => G.flags.gateOpen },
  links: { title: 'Links', text: 'Juno says a pinned, hooked, burning, blinded or launched foe can be finished with the right weapon. Find three links.', done: () => G.linksKnown.size >= 3 },
  ring: { title: 'The Cinder Ring', text: 'Wakers spar in the Cinder Ring, against echoes or each other. Enter it from the title screen.', done: () => false },
  tools: { title: 'Bare hands', text: 'You woke with nothing. Pebbles and flint lie about; grass gives fiber, bushes give sticks. Knap a blade [K], twist twine, bind them.', done: () => !!(G.flags.crafted_flint_axe || G.flags.crafted_flint_pick) },
  food: { title: 'An empty stomach', text: 'Berries off the bushes, hares and thornbacks for meat. Raw meat feeds you; seared on a campfire it feeds you far better.', done: () => !!(G.flags.ate_cmeat || G.flags.ate_stew || G.flags.ate_jerky) },
  styles: { title: 'Five forms', text: 'Every weapon has five styles on V. Juno shows you the first; drills at a practice post teach the rest. Land one and swap [X] to your off hand for a pair finisher.', done: () => Object.keys(G.mast || {}).some(t => styleLevel(t) >= 5) },
  stations: { title: 'Benches and fires', text: 'A workbench saws logs into planks. A kiln fires clay. A bloomery smelts ore. Every bench has one job: the recipe book [B] says which makes what. [F] beside one to use it.', done: () => !!(G.flags.crafted_copper_bar || G.flags.crafted_tin_bar) },
  blade: { title: "The Waker's Blade", text: "Wick says the last Waker's blade was left on a pedestal in some ruin out on the land. A tower, a crypt or a stone circle.", at: () => SPOTS.blade && SPOTS.blade.x, done: () => !!G.flags.gotBlade },
  home: { title: 'A roof', text: 'Build somewhere of your own: posts and beams carry walls, a door keeps out the night, a bedroll or a bed makes it the place you wake. A Carpenter\'s Table makes the rest.', done: () => !!(G.flags.placed_door && (G.flags.placed_bedroll || G.flags.placed_bed)) }
};
const sideOf = x => x < SPAWN_X ? 'west' : 'east';
function fixLeadTexts() {
  LEADS.warden.text = `An ember fell into the crater ${sideOf(SHRINE_X)} of the village. The Ashen Warden still guards it at the shrine.`;
  LEADS.vesper.text = `Another Waker, Vesper, keeps the second ember at the Mirror Court, high in the glass mountains to the ${sideOf(SHRINE2_X)}.`;
  LEADS.spire.text = `An old lookout stands out on the land to the ${sideOf(SPOTS.spire ? SPOTS.spire.x : 0)}. Something is carved at the top.`;
  LEADS.gate.text = `A door at the ${sideOf(GATE_X)} edge of the world with three sockets. It wants all three embers.`;
  LEADS.mine.text = `An old mine shaft in Rustfall, ${sideOf(MINE_X)} of the village, drops all the way to the road through the Deep.`;
}
const LEAD_ORDER = Object.keys(LEADS);
function learn(id, quiet) { if (!LEADS[id] || G.leads.has(id) || LEADS[id].done()) return; G.leads.add(id); G.dirty = true; if (!quiet) { G.note = { text: 'New lead: ' + LEADS[id].title + '  [J]', t: 0 }; sfx('quest', 0); } if (!G.pin && LEADS[id].at && !quiet) G.pin = id; }
function leadsOpen() { return LEAD_ORDER.filter(id => G.leads.has(id) && !LEADS[id].done()); }
const SPEAKER = { WICK: { col: '#ffd35a', skin: 5 }, VESPER: { col: '#8ff5e6', skin: 4 }, JUNO: { col: '#ff8a7a', skin: 6 }, BRAM: { col: '#f0b070', skin: 7 }, PELL: { col: '#ffd35a', skin: 8 }, NELL: { col: '#ffa07c', skin: 9 }, ODO: { col: '#8fb4c0', skin: 10 } };
const SCRIPTS = {
  wick_intro: {
    lines: [['WICK', 'Easy, easy. You came up out of the ash like a sneeze. Third one this age.'], ['WICK', 'Name is Wick. This is Hearthhold, and that is my fire. Somebody has to keep one while the ring up there stays broken.'],
    ['WICK', 'See it? The Dawnforge. Three embers fell out of it. Every night since has run a little longer.'],
    ['WICK', 'One fell in the crater east of here, and the Ashen Warden sits on it. One went west, up into the mountains, where a Waker called Vesper keeps it. The third fell all the way down, to the Drowned Forge at the bottom of the world.'],
    ['WICK', 'Go after them in any order you like, or none. Nobody here will make you. Juno in the dojo can teach you a few tricks. Bram at the smithy can make you things.'],
    ['WICK', 'You came with nothing, so start with what the ground gives. Pebbles, flint, sticks, grass. Knock a blade off a flint, twist grass into twine, and bind them to a stick.'],
    ['WICK', 'Eat when you can. Cook when you can. And if you fall, the fire will wake you here.']],
    end() { G.flags.metWick = true; unlock('wick'); unlock('survival'); learn('tools', true); learn('food', true); learn('stations', true); learn('blade', true); learn('home', true); for (const id of ['warden', 'vesper', 'keeper', 'juno', 'bram']) learn(id, true); G.pin = 'juno'; G.note = { text: 'New leads in your journal  [J]', t: 0 }; sfx('quest', 0); G.dirty = true; }
  },
  wick_any: { lines: [['WICK', 'The crater, the glass mountains, the bottom of the world. Pick one. Or fell stalks and build a house. The embers have waited this long.']] },
  wick_tools: { lines: [['WICK', 'Still bare-handed? Pick up a flint, press [K], knock the flakes off around the shape. Three grass fibers twist into twine. Head, stick, twine: a tool.'], ['WICK', 'An axe for stalks, a pick for rock. Hands only dig soft ground.']] },
  wick_more: { lines: [['WICK', 'You carry embers now. I can see them from here, like coals behind your ribs.'], ['WICK', 'The Furnace Gate in Rustfall wants all three. Whenever you are ready. Not before.']] },
  wick_warden: {
    lines: [['WICK', 'You smell like burnt moss and victory. The first ember, and it chose you.'], ['WICK', 'You were not the first to wake this age, you know. Vesper came through before you. Moved like water, cold as a well. She went west, into the Stillglass.'],
    ['WICK', 'Whatever she wants with the second ember, it is not to bring it home. Mind her when you go. If you go.']],
    end() { G.flags.wickTold1 = true; unlock('west'); learn('vesper', true); G.dirty = true; }
  },
  wick_vesper: {
    lines: [['WICK', 'Vesper. So she is still out there. I knew her, once. She kept a fire too, before hers went out.'], ['WICK', 'She thinks relighting the Forge wakes the Hollow along with the morning. She might not be wrong.'],
    ['WICK', 'But she yielded to you, and you let her go. Two Wakers with sense. Rare as dewbulbs on a dune.']],
    end() { G.flags.wickTold2 = true; unlock('wick2'); G.dirty = true; }
  },
  wick_keeper: { lines: [['WICK', 'You went all the way down. And you came back up with fire that does not burn you.'], ['WICK', 'Bram will want to hear about the forge. He will pretend he does not.']], end() { G.flags.wickTold3 = true; G.dirty = true; } },
  wick_three: { lines: [['WICK', 'All three. I did not think I would see it. I am not sure I wanted to.'], ['WICK', 'The Furnace Gate is in Rustfall, far east. Whatever happens when it opens, it happens because you chose it.']], end() { learn('gate'); G.pin = 'gate'; } },
  wick_forge: { lines: [['WICK', 'A free forge, then. No embers to chase, just stone to shape and stalks to cut.'], ['WICK', 'The shrine, the mirror and the Drowned Forge still answer, if you want a fight. So does the Cinder Ring, where Wakers spar with each other.']], end() { G.flags.metWick = true; for (const id of ['warden', 'vesper', 'keeper', 'juno', 'bram', 'ring']) learn(id, true); unlock('ring'); } },
  juno_intro: {
    lines: [['JUNO', 'You walk like a Waker. Loud. Come in, then.'], ['JUNO', 'Weapons are not the interesting part. What happens between them is.'],
    ['JUNO', 'You made that yourself? Then you are worth teaching. Take these. A Rattlechain, and star knives. [R] throws a star. It carries whatever it hits into the nearest wall and nails it there.'],
    ['JUNO', 'While it hangs there, go in with the chain. That is a link: the right weapon on the right moment. Every weapon has some. Hooked, burning, blinded, thrown up in the air. Find them.'],
    ['JUNO', 'The post by the wall does not mind being hit. Try it. [T] switches sidearms once you carry more than one.']],
    end() { G.flags.metJuno = true; if (!countItem('nunchaku')) addItem('nunchaku', 1); addItem('shuriken', 12); toastItem('nunchaku', 1); toastItem('shuriken', 12); G.p.arm = 'shuriken'; G.armT = 200; unlock('juno'); unlock('links'); learn('links', true); learn('drift'); G.dirty = true; }
  },
  juno_hint: { lines: [] },
  juno_lesson: { lines: [] },
  bram_gift: { lines: [['BRAM', 'Your own bar. Lumpy. Good. Here: a crucible, and two flasks of ember oil for the things that will not stay dead.']], end() { G.flags.bramGift = true; addItem('crucible', 1); addItem('flask', 2); toastItem('crucible', 1); toastItem('flask', 2); G.dirty = true; } },
  pell_trade: { lines: [['PELL', 'Meat! Here, three pellets. Throw them at something. Not at me.']], end() { removeItem('meat', 2); addItem('smoke', 3); toastItem('smoke', 3); G.flags.pellTrades = (G.flags.pellTrades || 0) + 1; G.dirty = true; } },
  juno_wait: { lines: [['JUNO', 'Empty hands. Come back holding a weapon you made yourself, even a flint knife bound to a stick. Then we talk.']] },
  juno_done: { lines: [['JUNO', 'You found all of them. I only knew nine. Show me the others sometime.']] },
  bram_intro: {
    lines: [['BRAM', 'Hm. Another one. Bench and kiln are yours, Waker. Ore from Rustfall, shards from deep down. Bring me nothing, I am busy.'],
    ['BRAM', 'My grandfather\'s grandfather worked the Drowned Forge, before the Keeper took it. Bottom of the world. The old mine in Rustfall still goes all the way down.'],
    ['BRAM', 'Metal does not come out of rock by wishing. Clay into mudbricks, mudbricks into a kiln, kiln-fired bricks into a bloomery. Then you pump the bellows till your arms quit.'],
    ['BRAM', 'Come back with a bar of sunmetal you smelted yourself and I will give you a crucible. Not before.']],
    end() { G.flags.metBram = true; unlock('bram'); learn('keeper', true); learn('mine'); G.dirty = true; }
  },
  bram_again: { lines: [['BRAM', 'Ore: three nuggets a bar, more if you grind them first. Bronze: sunmetal and whitetin in a crucible. Steel: iron and coal, crucible again, and a hotter fire than you think.'], ['BRAM', 'Strike the anvil clean and the blade is better for it. Stop looking at me like that.']] },
  bram_flask: { lines: [['BRAM', 'You found the old forge flask. Grandfather would have liked you. He liked anyone who came back.']] },
  bram_after: { lines: [['BRAM', 'The Keeper is down? ...Good. Good. I will go see the forge one day. When my knees agree.']] },
  pell_intro: {
    lines: [['PELL', 'You are a Waker! Do you see the islands? Up there, in the wind!'], ['PELL', 'The vents push you up if you stand in them. I tried. I got halfway. There is an altar up there with a chain hook on it. Juno says it is hers.'],
    ['PELL', 'I make smoke pellets. Bring me two pieces of meat and I will trade you three. Nobody gets anything for free around here. Wick says so.']],
    end() { G.flags.metPell = true; learn('drift'); learn('spire', true); G.dirty = true; }
  },
  pell_again: { lines: [['PELL', 'There is a broken tower on the moor, west of here. I climbed it once. There is writing at the top. I did not tell my mother.']] },
  pell_hook: { lines: [['PELL', 'You got the hook! Throw it at a wall and it pulls you right up. Can I try? I cannot try. Fine.']] },
  folk: { lines: [] },
  vesper_meet: {
    lines: [['VESPER', 'So the ash coughed up another one.'], ['VESPER', 'I can hear the embers humming in you. Or I can hear that you want them. Same thing.'],
    ['VESPER', 'Leave the Still Ember where it is. Every ember carried home drags the morning closer, and the Hollow wakes with the morning.'], ['VESPER', 'No? Then show me your forms, little Waker. I will show you mine.']],
    end() { G.flags.vesperMet = true; unlock('vesper'); startDuel(); }
  },
  vesper_again: { lines: [['VESPER', 'Back again. Good. Again, then.']], end() { startDuel(); } },
  vesper_after: {
    lines: [['VESPER', '...Enough. Enough.'], ['VESPER', 'You fight like someone who means to finish it. Fine. Take the Still Ember. It never liked me anyway.'],
    ['VESPER', 'Take my blades too. Where I am going, I will not need them.'], ['VESPER', 'When the Hollow comes up to meet the dawn, remember who warned you.']],
    end() { endDuel(true); }
  },
  vesper_after2: { lines: [['VESPER', 'Better. Still not enough to stop what is coming.']], end() { endDuel(true); } }
};
function talk(id) { const s = SCRIPTS[id]; if (!s) return; G.dialog = { id, s, i: 0, t: 0 }; sfx('ui'); }
function dialogAdvance() {
  const d = G.dialog; if (!d) return; const line = d.s.lines[d.i];
  if (d.t < line[1].length) { d.t = 9999; return; }
  if (++d.i >= d.s.lines.length) { G.dialog = null; if (d.s.end) d.s.end(); } else { d.t = 0; sfx('ui'); }
}
function wickTalk() {
  const F = G.flags, n = embers();
  if (!F.metWick) return talk(WORLD.mode === 1 ? 'wick_forge' : 'wick_intro');
  if (!LEADS.tools.done() && WORLD.mode !== 1) return talk('wick_tools');
  if (n === 3) return talk('wick_three');
  if (F.vesperDone && !F.wickTold2) return talk('wick_vesper');
  if (F.wardenDead && !F.wickTold1) return talk('wick_warden');
  if (F.keeperDead && !F.wickTold3) return talk('wick_keeper');
  return talk(n ? 'wick_more' : 'wick_any');
}
function junoTalk() {
  if (!G.flags.metJuno) return talk(WORLD.mode === 1 || RECIPES.some(r => r.out && IT[r.out] && IT[r.out].type === 'weapon' && G.flags['crafted_' + r.out]) ? 'juno_intro' : 'juno_wait');
  // carry her a weapon you have no style with, and she shows you the first one
  const W = G.p && heldOf(G.p), ty = W && W.type === 'weapon' ? weaponType(W) : null;
  if (ty && STYLES[ty] && styleLevel(ty) === 0) {
    const [, name] = STYLES[ty][0]; SCRIPTS.juno_lesson.lines = [['JUNO', `A ${WTYPE[ty].n.toLowerCase()}. Stand still. Feet like roots. Now: V.`], ['JUNO', `That is ${name}. The first of five. The rest you earn at the post, or in the field.`]];
    SCRIPTS.juno_lesson.end = () => { masteryGain(ty, MAST_AT[0] - masteryXp(ty) + .01); G.dirty = true; }; return talk('juno_lesson');
  }
  if (ty && STYLES[ty] && styleLevel(ty) < 5 && (G.time >> 7) % 2 === 0) { SCRIPTS.juno_hint.lines = [['JUNO', `Your ${WTYPE[ty].n.toLowerCase()} is at rank ${styleLevel(ty)}. The post is right there. F with the weapon in hand, and follow my calls.`]]; return talk('juno_hint'); }
  const left = LINK_ORDER.filter(id => !G.linksKnown.has(id));
  if (!left.length) return talk('juno_done');
  const L = LINKS[left[(G.time >> 6) % left.length]]; SCRIPTS.juno_hint.lines = [['JUNO', fpick(['Something to try:', 'Here is one I like:', 'Try this, then come back and tell me it hurt.'])], ['JUNO', L.hint + '  She calls it ' + L.name + '.']];
  return talk('juno_hint');
}
function bramTalk() { if (!G.flags.metBram) return talk('bram_intro'); if (!G.flags.bramGift && (hasItem('copper_bar') || WORLD.mode === 1)) return talk('bram_gift'); if (G.flags.keeperDead) return talk('bram_after'); return talk(G.flags.gotFlask ? 'bram_flask' : 'bram_again'); }
function pellTalk() { if (!G.flags.metPell) return talk('pell_intro'); if (countItem('meat') >= 2 && (G.flags.pellTrades || 0) < 6) return talk('pell_trade'); return talk(G.flags.gotHook ? 'pell_hook' : 'pell_again'); }
function folkTalk(n) { const L = n.skin === 9 ? VILL_N : VILL_O, who = n.skin === 9 ? 'NELL' : 'ODO'; SCRIPTS.folk.lines = [[who, L[(n.said = ((n.said || 0) + 1)) % L.length]]]; talk('folk'); }
const VILL_N = ['The fire in the square has not gone out in my lifetime. Wick will not let it.', 'Pell keeps climbing the watchtower to look at the islands. One day the wind will take him with it.', 'If you go down into the Deep, take water. Or a reason to come back.', 'Juno threw a star clean through my laundry once. Pinned my shirt to the dojo wall. Still there.'];
const VILL_O = ['Rustfall is all ore and rolling things. The rustbacks curl up and come at you like barrels. A star stops them.', 'Bram says his grandfather worked the old forge, before the Keeper. Bram says a lot of things.', 'Night is longer than it used to be. I count it.', 'Hollowborn come up from the Deep sometimes. They fight like you do. That is what scares me.'];
function embers() { return (G.flags.dbl ? 1 : 0) + (G.flags.e2 ? 1 : 0) + (G.flags.e3 ? 1 : 0); }
function unlock(id) { if (G.journal.includes(id) || !JOURNAL[id]) return; G.journal.push(id); G.jNew = true; G.dirty = true; G.note = { text: 'Journal: ' + JOURNAL[id][0] + '  [J]', t: 0 }; }
function say(text, who = 'ember') {
  const now = G.time | 0, said = G.saidAt || (G.saidAt = new Map()), last = said.get(text);
  if ((last !== undefined && now - last < 5400 && now >= last) || (G.sayCur && G.sayCur.text === text) || G.says.some(s => s.text === text)) return;
  said.set(text, now); if (said.size > 200) said.clear(); if (G.says.length >= 3) G.says.shift(); G.says.push({ text, who });
}
// a quiet line at the top of the screen; lines wait their turn instead of piling up
function calmNote(text) { if (G.note && G.note.text === text) return; if (G.note && G.note.t < 150) { const q = G.noteQ || (G.noteQ = []); if (q.length < 3 && !q.includes(text)) q.push(text); return; } G.note = { text, t: 0 }; }
function toastItem(id, n) { const f = G.picks.find(q => q.id === id && q.t < 120); if (f) { f.n += n; f.t = 0; } else { G.picks.unshift({ id, n, t: 0 }); if (G.picks.length > 5) G.picks.pop(); } }
function onKill(type) {
  beastKill(type);
  if (type === 'mote') unlock('motes'); else if (type === 'husk') unlock('husks'); else if (type === 'bat') unlock('flits'); else if (type === 'mite') unlock('mites');
  else if (type === 'boss') { unlock('fall'); say('It is done. The ember was never dead. Only kept.'); }
  else if (type === 'keeper') say('The Keeper sets its hammer down, finally. The hearths burn on without it.');
  else if (type === 'skyray') unlock('skyrays'); else if (type === 'rustback') unlock('rustbacks'); else if (type === 'cinderling') unlock('cinderlings');
  else if (JOURNAL['m_' + type]) unlock('m_' + type);
}
function onCraft(id) {
  const it = IT[id]; if (!it) return;
  const first = (k, msg) => { if (!G.flags['said_' + k]) { G.flags['said_' + k] = true; say(msg); } };
  if (id === 'twine') first('twine', 'Twine. Now you can bind things.');
  if (['knifeblade', 'axehead', 'pickhead', 'shovelhead', 'spearhead'].includes(id)) first('head', 'A clean head. Bind it to a stick with twine [E].');
  if (it.type === 'tool') first('tool', it.kind === 'axe' ? 'An axe. Cut stalks low and step back: they fall away from you.' : it.kind === 'pick' ? 'A pick. Aim where you want it to bite. It digs along your line.' : 'A tool. Better than hands.');
  if (it.type === 'weapon') { first('weapon', 'A weapon you made. Juno will want to see it.'); unlock('w_' + it.set === 'w_chuks' ? 'w_chuks' : 'w_' + it.set); }
  if (id === 'campfire') first('fire', 'A campfire. Place it and press [F] to cook.');
  if (id === 'bench') { unlock('stations'); first('bench', 'A workbench. Place it, then [F]: saw logs into planks.'); }
  if (id === 'copper_bar') first('bar', 'Your first bar of sunmetal. An anvil turns it into tools that bite real rock.');
  G.dirty = true;
}
function onPickup(id) {
  if ((id === 'rock' || id === 'flint') && !G.flags.saidKnap) { G.flags.saidKnap = true; say('A good stone. Press [K] to knap it into a blade or a tool head.'); }
  if (id === 'glowcap') unlock('glowcap');
  if (id === 'nunchaku') unlock('w_chuks');
  if (id === 'wember3' && !G.flags.e3) { G.flags.e3 = true; sfx('quest', 0); G.flash = .5; G.flashCol = '255,154,61'; unlock('e3'); say('The Deep Ember sits warm in your chest. Molten cinder will not burn you now.'); G.banner = { text: 'CINDERWALK', sub: 'molten cinder no longer burns you', t: 0 }; }
  if (id === 'fangs' || id === 'vfangs') unlock('w_fangs'); if (id === 'maul') unlock('w_maul'); if (id === 'bow') unlock('w_bow');
  if (id === 'wember' && !G.flags.dbl) { G.flags.dbl = true; sfx('quest', 0); G.flash = .5; G.flashCol = '255,211,90'; say("The Warden's Ember settles in your chest. Jump again in mid-air: the ground has let go of you."); G.banner = { text: 'EMBER LEAP', sub: 'jump again in mid-air', t: 0 }; }
  if (id === 'wember2' && !G.flags.e2) { G.flags.e2 = true; sfx('quest', 0); G.flash = .5; G.flashCol = '143,245,230'; say('The Still Ember is cold behind your ribs. Dodge twice before you land.'); G.banner = { text: 'STILL STEP', sub: 'dodge twice in mid-air', t: 0 }; }
  G.dirty = true;
}
// ---------------- things you can press [F] on ----------------
const NPC_LABEL = { wick: 'talk to Wick', juno: 'talk to Juno', bram: 'talk to Bram', pell: 'talk to Pell', folk: 'talk' };
function interactables() {
  const L = [], F = G.flags;
  for (const n of G.npcs) if (!n.hidden || n.kind !== 'folk') L.push({ x: n.x + 3, y: n.y + 20, r: 18, label: NPC_LABEL[n.kind], act: () => npcTalk(n) });
  if (!WORLD.arena) {
    L.push({ x: SHRINE_X * T + 4, y: SHRINE_Y * T, r: 34, label: F.wardenDead ? 'rekindle the shrine' : 'offer your flame', act: shrineAct, hide: () => G.boss || G.duel, host: 1 });
    L.push({ x: SHRINE2_X * T + 4, y: SHRINE2_Y * T, r: 34, label: 'touch the mirror', act: mirrorAct, hide: () => G.duel || G.boss, host: 1 });
    L.push({ x: GATE_X * T + 4, y: GATE_Y * T, r: 28, label: F.gateOpen ? 'step into the Kiln Heart' : 'inspect the gate', act: gateAct, host: 1 });
    dimInteract(L); placeInteract(L); furnInteract(L, floor((G.p.x + 3) / T), floor((G.p.y + 10) / T));
    if (SPOTS.board) L.push({ x: SPOTS.board.x * T + 4, y: SPOTS.board.y * T, r: 14, label: 'read the notice board', act: boardAct });
    const p = G.p, ptx = floor((p.x + 3) / T), pty = floor((p.y + 10) / T);
    for (const o of tileObjs.values()) { if (abs(o.x - ptx) > 6 || abs(o.y - pty) > 5) continue; const k = STATIONS[o.id]; if (k) L.push({ x: o.x * T + 4, y: (o.y + 1) * T, r: 14, label: k === 'way' ? 'touch the waystone' : k === 'rift' ? 'step into the ' + TP[o.id].name.toLowerCase() : 'use the ' + TP[o.id].name.toLowerCase(), act: () => openStation(o.x, o.y) }); else if (o.id === BEDROLL) L.push({ x: o.x * T + 4, y: (o.y + 1) * T, r: 12, label: 'sleep', act: () => sleepAt(o.x, o.y) }); }
    for (let y = pty - 2; y <= pty + 1; y++) for (let x = ptx - 2; x <= ptx + 2; x++) { const t = tileAt(x, y); if ((t === DOORC || t === DOORO) && tileAt(x, y + 1) !== t) L.push({ x: x * T + 4, y: (y + 1) * T, r: 13, label: t === DOORC ? 'open the door' : 'close the door', act: () => toggleDoor(x, y) }); }
    if (SPOTS.camp) L.push({ x: SPOTS.camp.x * T + 4, y: SPOTS.camp.y * T, r: 12, label: 'rest by the fire', act: campAct });
    { const d = G.enemies.find(e => e.type === 'dummy' && !e.tempPost); if (d) L.push({ x: d.x + 4, y: d.y + d.h, r: 22, label: G.drill ? 'stop the drill' : 'drill at the post', act: () => startDrill(0, 0, d) }); }
    if (SPOTS.spire) L.push({ x: SPOTS.spire.x * T + 4, y: SPOTS.spire.y * T, r: 18, label: 'read the carving', act: spireAct });
    for (const o of tileObjs.values()) if (o.id === PEDESTAL && pedItem(o)) L.push({ x: o.x * T + 4, y: (o.y + 1) * T, r: 16, label: 'take the ' + IT[pedItem(o)].name, act: () => pedTake(o) });
    if (SPOTS.keeper && (F.keeperDead || F.keeperSeen)) L.push({ x: SPOTS.keeper.x * T + 4, y: SPOTS.keeper.y * T, r: 26, label: hasItem('forge_offering') ? 'strike the anvil with the offering' : 'strike the anvil', act: () => { if (!G.boss && payOffering('forge_offering')) { sfx('shrine', 0); spawnKeeper(); unlock('keeper'); } }, hide: () => G.boss, host: 1 });
  }
  if (netGuest()) for (const o of L) if (o.host) o.act = () => { say('That is for ' + (COOP.hostName || 'your host') + ' to do in their world.'); sfx('deny'); };
  return L;
}
function nearestInteract() { const p = G.p; if (!p || p.dead || G.cine) return null; let best = null, bd = 1e9; for (const o of interactables()) { if (o.hide && o.hide()) continue; const d = abs(p.x + 3 - o.x); if (d < o.r && abs(p.y + p.h - o.y) < 30 && d < bd) { bd = d; best = o; } } return best; }
function interact() { if (G.dialog || G.cine) return; const o = nearestInteract(); if (o) o.act(); }
function npcTalk(n) { n.talkT = 120; if (n.kind === 'wick') wickTalk(); else if (n.kind === 'juno') junoTalk(); else if (n.kind === 'bram') bramTalk(); else if (n.kind === 'pell') pellTalk(); else folkTalk(n); }
function shrineAct() {
  if (G.boss || G.duel) return;
  if (!payOffering('ashen_offering')) { learn('warden', true); return; }
  if (G.flags.wardenDead) say('The brazier flares. The Warden remembers its vigil.');
  G.flags.shrineUsed = true; sfx('shrine', 0); addShake(4); spawnBoss(); unlock('warden'); learn('warden', true); G.banner = { text: 'ASHEN WARDEN', sub: 'Keeper of the First Ember', t: 0 };
}
function mirrorAct() { if (G.duel || G.boss) return; if (!payOffering('mirror_offering')) { learn('vesper', true); return; } sfx('shrine', 0); learn('vesper', true); talk(G.flags.vesperMet ? 'vesper_again' : 'vesper_meet'); }
function gateAct() {
  const F = G.flags, n = embers(); F.gateSeen = true; unlock('gate'); learn('gate', true);
  if (F.gateOpen) { F.dim1 = true; learn('kiln', true); openRift(GATE_X, GATE_Y - 1); return; }
  if (n < 3) { say(n ? `The gate is warm. ${n === 1 ? 'One' : 'Two'} of its three sockets hum${n === 1 ? 's' : ''} as you come near. The rest are cold.` : 'A furnace door taller than any stalk. Three sockets, all of them cold.'); return; }
  F.gateOpen = true; F.dim1 = true; G.dirty = true; unlock('kiln'); learn('kiln');
  const gx = GATE_X, gy = GATE_Y; for (let y = gy - 4; y < gy; y++) for (let x = gx + 1; x < gx + 18; x++) if (inW(x, y) && TP[tileAt(x, y)].hard < Infinity) setTile(x, y, AIR);
  startCine({ x: (gx + 8) * T, y: (gy - 3) * T, title: 'THE KILN HEART', sub: 'beyond it the Kiln Heart burns open. Cinderdeep is waiting', dur: 260 });
  sfx('roar', 0); addShake(8); G.flash = .6; G.flashCol = '255,180,100';
}
function boardAct() {
  toggleUI('board');
  sfx('ui'); const fresh = ['warden', 'vesper', 'keeper', 'drift', 'spire', 'mine'].filter(id => !G.leads.has(id) && !LEADS[id].done());
  if (fresh.length) { const id = fresh[0]; learn(id); say('A notice, nailed over older notices: ' + LEADS[id].text); }
  else say('Old notices. A lost goat. A warning about rustbacks. A drawing of the ring in the sky, mended, by a child.');
}
function sleepAt(x, y) { const p = G.p; G.respawn = { x, y }; const night = G.dn < .4; if (night) { G.clock = .27; G.flash = .9; say('You sleep until the light comes back.'); } else say('You rest a while. You will wake here if you fall.'); p.hp = min(p.maxhp, p.hp + 30); G.food = max(0, G.food - (night ? 12 : 3)); sfx('heal'); G.dirty = true; }
function campAct() { const p = G.p; G.respawn = { x: SPOTS.camp.x, y: SPOTS.camp.y }; if (p.hp < p.maxhp) { p.hp = p.maxhp; numPop(p.x + 3, p.y - 4, 'RESTED', '#ffd35a'); } sfx('heal'); saveWorld(true); say('You sit with the fire a while. The village will wake you here if you fall.'); }
function spireAct() { if (!G.flags.spireRead) { G.flags.spireRead = true; unlock('spire'); G.dirty = true; sfx('quest', 0); } say('Carved into the lookout: THE RING WAS NOT BROKEN. IT WAS OPENED. Someone has scratched a second line under it: by whom.'); }
function pedTake(o) {
  const id = pedItem(o); if (!id) return;
  if (id === 'hook') { G.flags.gotHook = true; addItem('hook', 1); G.banner = { text: 'CHAIN HOOK', sub: '[R] throw it. drag foes in, or pull yourself to a wall', t: 0 }; unlock('hook'); }
  else if (id === 'sword') { G.flags.gotBlade = true; addItem('sword', 1); G.banner = { text: "THE WAKER'S BLADE", sub: 'rusted, but it remembers every form. [C] shows them', t: 0 }; learn('blade', true); sfx('quest', 0); G.flash = .4; G.dirty = true; return; }
  else { G.flags.gotFlask = true; addItem('flask', 6); G.banner = { text: 'EMBER FLASKS', sub: '[R] throw, [T] switch sidearms. fire clings to what it touches', t: 0 }; unlock('flasks'); }
  G.p.arm = id; G.armT = 160; sfx('quest', 0); G.flash = .4; G.flashCol = '255,211,90'; G.dirty = true; burst(o.x * T + 4, o.y * T - 8, 20, SPARK, 2, 40, { glow: 1 });
}
// ---------------- discovery: the first time you reach a place, the camera goes to look at it ----------------
function startCine(o) { G.cine = Object.assign({ t: 0, dur: 220 }, o); G.dialog = null; }
function tickCine() { const c = G.cine; if (!c) return; c.t++; if (G.p) G.p.inv = max(G.p.inv, 2); if (c.t >= c.dur || (c.t > 25 && (pressed.Space || pressed.Enter || pressed.Escape || pressed.KeyF || mouse.lp))) { G.cine = null; for (const k in pressed) pressed[k] = false; mouse.lp = false; } }
const FIND_LEAD = { village: 'wick', crater: 'warden', court: 'vesper', forge: 'keeper', drift: 'drift', gate: 'gate', mine: 'mine', spire: 'spire' };
function discover(L) {
  G.found.add(L.id); G.dirty = true; if (FIND_LEAD[L.id]) learn(FIND_LEAD[L.id], true);
  if (L.id === 'mine' || L.id === 'forge') learn('keeper', true); if (L.id === 'forge') learn('flask', true);
  unlock({ crater: 'hollow', court: 'mirror', forge: 'forge2', drift: 'drift', gate: 'gate', village: 'village', spire: 'spireseen', mine: 'mine' }[L.id]);
  const story = !!FIND_LEAD[L.id] || ['crater', 'court', 'forge', 'drift', 'gate', 'village', 'spire', 'mine'].includes(L.id);
  if (L.small || !story) { calmNote(L.name + (L.sub ? '  :  ' + L.sub : '')); return; }
  if (G.boss || G.duel || G.dialog) return;
  startCine({ x: L.x, y: L.y, title: L.name, sub: L.sub, dur: L.id === 'village' ? 260 : 210 });
}
// ---------------- the people of Hearthhold ----------------
function spawnNPCs() {
  G.npcs = []; G.enemies = G.enemies.filter(e => e.type !== 'dummy');
  if (WORLD.arena || !SPOTS.camp) return;
  const gy = VIL_Y, add = (kind, skin, x, o) => G.npcs.push(Object.assign({ kind, skin, x: x * T + 1, y: gy * T - 20, face: 1, t: 0, vx: 0, wait: 0, hidden: false }, o));
  add('wick', 5, SPOTS.camp.x - 3); add('juno', 6, SPOTS.juno.x, { face: -1 }); add('bram', 7, SPOTS.bram.x); add('pell', 8, SPOTS.pell.x, { roam: [SPOTS.pell.x - 4, SPOTS.pell.x + 3] });
  const W = SPOTS.walk || []; W.forEach((r, i) => add('folk', i & 1 ? 10 : 9, (r[0] + r[1]) >> 1, { roam: r, folk: true }));
  const d = mkEnemy('dummy', SPOTS.dummy.x * T + 1, (gy - 3) * T); G.enemies.push(d);
}
const WICK_STAFF = { held: null, grip: [4, 2] }, BRAM_HAMMER = { held: null, grip: [3, 4] }, JUNO_CHUKS = { chuks: true, grip: [0, 0] };
function tickNPCs() {
  const p = G.p;
  for (const n of G.npcs) {
    n.t++; if (n.talkT > 0) n.talkT--; n.px = n.x;
    if (n.roam && !(G.dialog && n.talkT > 0)) {
      if (n.wait > 0) { n.wait--; n.vx = 0; }
      else { if (!n.goal || abs(n.x - n.goal) < 2) { n.goal = frand(n.roam[0], n.roam[1]) * T; n.wait = 60 + frand(200); } n.vx = sign(n.goal - n.x) * (n.kind === 'pell' ? .55 : .38); n.x += n.vx; n.face = sign(n.vx) || n.face; n.ph = (n.ph || 0) + .13; }
    }
    if (!n.roam || n.wait > 0 || n.talkT > 0) { if (abs(p.x - n.x) < 50 && abs(p.y - n.y) < 40) n.face = p.x > n.x ? 1 : -1; }
    n.hidden = STRUCTS.some(s => s.mode === 'fade' && s.a > .5 && n.x + 3 > s.x0 * T && n.x + 3 < (s.x1 + 1) * T && n.y + 10 > s.y0 * T && n.y + 10 < (s.y1 + 1) * T);
  }
  const d = G.enemies.find(e => e.type === 'dummy'); if (d && d.hp < d.maxhp && G.time % 30 === 0) d.hp = min(d.maxhp, d.hp + 40);
}
function npcHeld(n) { if (n.kind === 'wick') { WICK_STAFF.held = SPR.w_staff; return WICK_STAFF; } if (n.kind === 'bram') { BRAM_HAMMER.held = SPR.w_maul; return BRAM_HAMMER; } if (n.kind === 'juno') return JUNO_CHUKS; return null; }
function drawNPC(n, al) {
  const talking = G.dialog && G.dialog.s.lines[G.dialog.i] && SPEAKER[G.dialog.s.lines[G.dialog.i][0]] && SPEAKER[G.dialog.s.lines[G.dialog.i][0]].skin === n.skin && n.talkT > 0, x = lerp(n.px === undefined ? n.x : n.px, n.x, al);
  drawEnt(96, 48, 70, c => {
    const P = basePose(), t = G.time + n.x; P.bob = sin(t * .05) * .5; P.armA = .95; P.armExt = .8; P.wAng = -1.48; P.lean = .08; P.head = talking ? sin(t * .3) * .08 : 0;
    if (n.vx) { const ph = n.ph, A = .7; P.l1a = sin(ph) * .8 * A; P.l1b = P.l1a - (.2 + .8 * max(0, cos(ph))) * A; P.l2a = sin(ph + PI) * .8 * A; P.l2b = P.l2a - (.2 + .8 * max(0, cos(ph + PI))) * A; P.bob = -abs(sin(ph)) * .9; P.armB = 1.6 - sin(ph) * .6; P.armA = 1.3 + sin(ph) * .3; }
    if (n.kind === 'bram') { P.wAng = -2; P.armA = -1.3; if (!talking && (G.time >> 5) % 4 === 0) { const u = (G.time & 31) / 31; P.wAng = lerp(-2.6, .9, ease.out3(u)); P.armA = P.wAng; P.armExt = 1; } }
    if (n.kind === 'juno') { P.wAng = .2; P.armA = 1.2; P.nA = 1.4 + sin(t * .09) * .3; if (!talking && (G.time >> 6) % 3 === 0) { const u = (G.time & 63) / 63; P.wAng = -1.2 + u * TAU * 2; P.armA = -.3; P.armExt = 1; P.nA = P.wAng + .5; } }
    if (n.kind === 'pell') { P.armA = 1.4; P.armB = 1.5; P.bob = sin(t * .12) * .8; }
    if (talking) { P.armB = .2 + sin(t * .12) * .4; P.armBext = .9; }
    c.save(); c.scale(n.face, 1); if (n.kind === 'pell') c.scale(.85, .85); drawRig(c, P, SK[n.skin], npcHeld(n)); c.restore();
  }, x + 3, n.y + 20, { ly: -10 });
}
// ---------------- per-tick story upkeep ----------------
function tickStory() {
  const p = G.p, ptx = floor((p.x + 3) / T), pty = floor((p.y + 10) / T);
  tickCine(); if (!WORLD.arena) tickNPCs(); tickArmsWorld();
  if (G.time % 20 === 0 && !WORLD.arena) {
    for (const L of LANDMARKS) if (!G.found.has(L.id) && hypot(p.x + 3 - L.x, (p.y + 10 - L.y) * 1.4) < L.r && !G.cine) { discover(L); break; }
    if (abs(ptx - SHRINE_X) < 24) G.flags.shrineSeen = true;
    if (abs(ptx - SHRINE2_X) < 26) G.flags.mirrorSeen = true;
    const b = placeAt(ptx, pty);
    if (b !== G.biome) {
      G.biome = b; G.biomeT = 200; if (b === 'ash') unlock('hollow'); if (b === 'reach') unlock('reach'); if (b === 'drift') unlock('drift'); if (b === 'under') unlock('under'); if (b === 'deep') unlock('deep');
      if (!G.found.has('realm_' + b) && (b === 'drift' || b === 'under' || b === 'deep')) { G.found.add('realm_' + b); G.banner = { text: BIOME[b], sub: { drift: 'islands on the wind', under: 'the caves under everything', deep: 'where the third ember fell' }[b], t: 0 }; sfx('quest', 0); }
    }
    if (G.movesUsed.size >= 3) unlock('forms');
    if (G.linksKnown.size) unlock('links');
    // the Forge-Keeper wakes when you walk into its hall
    const F = SPOTS.forge; if (F && !G.boss && !G.flags.keeperSeen && !G.cine && ptx > F.x0 + 6 && ptx < F.x1 - 6 && abs(pty - F.y) < 10 && !p.dead) { G.flags.keeperSeen = true; G.dirty = true; learn('keeper', true); G.banner = { text: 'THE DROWNED FORGE', sub: 'something huge sleeps over the anvil', t: 0 }; say('The Forge-Keeper sleeps over its anvil. Strike the anvil with a Forge Offering to wake it.'); }
    if (G.pin && LEADS[G.pin].done()) { G.leadDone = { title: LEADS[G.pin].title, t: 0 }; sfx('quest', 0); G.pin = leadsOpen().find(id => LEADS[id].at) || null; }
  }
  if (WORLD.arena && !WORLD.royale && G.biome !== 'ring') { G.biome = 'ring'; G.biomeT = 200; }
  if (G.biomeT > 0) G.biomeT--; if (G.qFlash > 0) G.qFlash--; if (G.armT > 0) G.armT--;
  if (G.leadDone && ++G.leadDone.t > 200) G.leadDone = null;
  if (G.linkBanner && ++G.linkBanner.t > 150) G.linkBanner = null;
  if (G.note) { if (++G.note.t > 240) { G.note = null; if (G.noteQ && G.noteQ.length) G.note = { text: G.noteQ.shift(), t: -30 }; } }
  if (G.banner) { if (++G.banner.t > 230) G.banner = null; }
  for (let i = G.picks.length - 1; i >= 0; i--) if (++G.picks[i].t > 200) G.picks.splice(i, 1);
  for (let i = G.feed.length - 1; i >= 0; i--) if (++G.feed[i].t > 210) G.feed.splice(i, 1);
  for (let i = G.kfeed.length - 1; i >= 0; i--) if (++G.kfeed[i].t > 330) G.kfeed.splice(i, 1);
  if (!G.sayCur && G.says.length) { const s = G.says.shift(); G.sayCur = { text: s.text, who: s.who, t: 0 }; }
  if (G.sayCur) { const s = G.sayCur; s.t++; if (s.t > s.text.length * 1.4 + 190) G.sayCur = null; }
}
