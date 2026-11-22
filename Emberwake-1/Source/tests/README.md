# Tests

Automated checks used while building the game. Each one opens the game in a hidden Chrome window (or several), plays it from code, and prints what it sees. Many also save pictures to `screenshots/`.

## Setting up (once)

```
pip install playwright pillow
python3 -m playwright install chromium
```

Build the game first: `python3 build.py` in `Source`.

## Running

```
python3 tests/run.py                      # everything (about half an hour)
python3 tests/run.py together             # one group
python3 tests/run.py together/relay.py    # one test
python3 tests/together/relay.py           # or run a test by itself
```

The runner flags a test that crashes or whose game page reports an error; read each test's lines to judge the rest.

The multiplayer tests run several game windows on one computer and stand in for the internet: `helpers/broker.py` is a small local message board (it can also lose and delay messages on purpose, like a far-away one), and `helpers/mock_room.js` stands in for claude.ai's live room. `helpers/harness.py` drives one window for the single-player tests, and `helpers/where.py` finds the game and the screenshots folder from wherever the project is.

## The tests

### playing

Story, screens, controls, the pack and crafting.

- `accounts.py` Password-required accounts, signing out on restart, guest-save migration and separate profile saves.
- `benches_and_trinkets.py` The benches (each opens and lists its own work), trinkets made, worn and felt, a meal's boon, storage of three sizes kept through a save, planters, the bed, the ballista and traps, and the guardians' offerings.
- `controls_and_settings.py` Simple controls (fists, chains), difficulty, FPS mode, digging by hand, knapping, and the menu settings.
- `crafting.py` Crafting with the real mouse: a hand recipe from the pack, a plank at the workbench (one click, no mini-game).
- `inventory.py` Moving things in and out of the pack with the real mouse: drag between slots, drag out to drop.
- `screens.py` Screens: echo stones, the journal and other panels.
- `story.py` The story: discovery scenes, the people of Hearthhold, leads and the journal.

### world

The land, digging, places, events and saving.

- `digging.py` Digging: each tool in each material, the craters it leaves and what it yields.
- `endless_land.py` The endless land: walking and travelling far, the world forms ahead without stalls.
- `events_and_saving.py` World events (fog, ash, the ember moon...) and saving during them.
- `long_walks.py` Walking 1500 paces east and west on several seeds without getting stuck.
- `places.py` Every kind of place (hamlets, forts, castles, pyramids, halls...) is built and looks right.
- `saving.py` Saving and loading a world keeps the land, the pack and the stations.
- `using_places.py` Using places: blessing stones, guards that wake, places that stay cleared.

### other-worlds

Cinderdeep, the Rootdark and the Glass Expanse.

- `entering.py` Going through the rifts into Cinderdeep, the Rootdark and the Glass Expanse.
- `lairs.py` Waking and clearing a lair in each other world.
- `long_walks.py` Walking far in each other world without getting stuck or falling into nothing.
- `looks.py` Pictures of each other world and its places.
- `maps.py` How fast each other world forms, and a map picture of each.
- `places.py` The places of the other worlds: slag bastions, glowcap hollows, prism spires.
- `spots.py` Special spots: lava lakes, glowcap groves, bridges, the upper isles.

### fighting

Links, armour, weapon styles, creatures and guardians.

- `cinder_ring.py` The Cinder Ring relay: players meet by code, select a shared broker, survive brief stalls, share movement and land PvP damage.
- `armour.py` Armour: walking, jumping and damage taken with each set.
- `bosses.py` Each guardian: summoned, every attack, the second phase, and its reward.
- `creatures.py` Every creature of every world moves, fights, dies and drops things.
- `mastery_and_flow.py` Learned forms (BASICS to MASTERY), follow-ups (CRUSH, BREAK, JUGGLE, SPIKE, RHYTHM), the four counters after a perfect dodge, and arts learned by use.
- `links.py` Links: a thrown star pins a post to the wall, and every link on the practice post.
- `weapon_styles.py` Weapon styles: locked until learned, learning them, the codex and the HUD.

### together

Playing together: codes, the relay, sharing the world, finding friends, rejoining.

- `consistency.py` Co-op consistency: doors, explosions, new stations, one-at-a-time chests, and a host who switches away.
- `finding_friends.py` Finding each other: friends on the map and minimap, pointers at the screen edge, and GO TO.
- `game_codes.py` Playing together with a short game code: the host opens PLAY TOGETHER, the friend types the code.
- `game_codes_on_claude.py` Game codes on claude.ai: the notes travel through the page's live room instead of the internet message boards.
- `hidden_host.py` A friend joins a host whose window is in the background, and the host's world keeps running at speed.
- `long_invite_codes.py` Two players with the long invite codes: building, digging, a chest, a creature, chat, a shared drop, a rift, and leaving.
- `rejoining.py` A world keeps its game code between sessions, and a friend who loses the line gets back in by themselves.
- `relay.py` Playing together where direct links are impossible: the relay.
- `relay_more.py` More relay cases: the claude.ai room, starting on the relay then switching to a direct line, and a host with no direct links.
- `shared_creatures.py` The host's creatures as a friend sees them: every overworld creature, travel through a rift, and a guardian fought together.
- `three_friends.py` Three friends with one host: everyone sees everyone, building, mining, a hollow, an event, a door, chat, and the host leaving.

### battle-royale

The Ashfall: alone, with friends, online, over the relay.

- `leader_asleep.py` The Ashfall online while the leader's game sleeps: the other player takes over, and the leader steps aside on return.
- `online_on_claude.py` The Ashfall online on claude.ai: two players meet in the room, share the island and the echoes, and hand the echoes over.
- `over_the_relay.py` The Ashfall over the relay: the friend's window has no WebRTC at all.
- `solo.py` The Ashfall alone with the echoes: the barge, the leap, the storm, the fights.
- `with_friends.py` The Ashfall with friends by game code: the host opens a lobby, a friend joins, and the match starts for both.
