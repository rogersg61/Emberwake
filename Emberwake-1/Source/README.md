# Emberwake: the source

Everything needed to change the game. Building it needs only Python 3.

## Building

From this folder:

```
python3 build.py           # the game, the guide and the Mac app
python3 build.py --game    # only the game (quickest while working on it)
python3 build.py --no-app  # the game and the guide
```

It writes three things next to this folder: **Emberwake.html** (the game), **Emberwake Guide.html** and **Emberwake.app**.

`build.py` refuses to build if two files define the same name, because in one big script the second would silently replace the first. If Node.js is installed, it also checks the code for syntax errors.

## What's where

| Folder | What is in it |
| --- | --- |
| `game/` | the game's code, in the order it loads (folders and files are numbered) |
| `guide/` | the guide's chapters (Markdown) and its pictures |
| `mac/` | the Mac app's parts: the launcher, the window script, `Info.plist`, the icon |
| `tests/` | automated checks (see `tests/README.md`) |
| `tools/` | helpers for looking after the project (`guide_pictures.py` retakes the guide's pictures from the game) |

## The game's code

The game is plain JavaScript in one page, with no libraries and no image files: every sprite is drawn by code. `build.py` joins every file in `game/` into one script, folders in number order and files in number order inside each. All files share one scope, so anything one file defines, every other file can use.

| Folder | What it does |
| --- | --- |
| `01-core` | constants, math, noise, input, sound, the pixel font |
| `02-art` | sprites and textures (all drawn by code), and the kinds of tiles |
| `03-world` | world generation, structures, the endless land, the other worlds, places to find |
| `04-items` | items and recipes, weapons, the later tiers, the benches (and which bench makes what), trinkets and meals |
| `05-physics` | game state, physics bodies, particles, drops, projectiles; mining and building; craters; armour; furniture and what it does |
| `06-combat` | movesets and hits, links (chains and sidearms), weapon styles, learned forms, follow-ups, counters and arts |
| `07-fighters` | the player and the other fighters (echoes, duelists) |
| `08-creatures` | creatures and spawning, the guardians, world events, the offerings that wake the guardians |
| `09-story` | people, leads, the journal, lore and echo stones |
| `10-interface` | menus, the HUD, the pack, crafting stations, the map, the recipe book and trinket slots |
| `11-arena-and-royale` | the Cinder Ring arena, and the Ashfall battle royale (island, storm, loot, echoes, online play, screens) |
| `12-playing-together` | co-op (sharing a world), game codes, the relay |
| `13-saving` | worlds: create, list, load, save |
| `14-main` | the sky, drawing, the game loop, input, start-up |

A new file goes after anything it uses while loading (for example, a `const` built from another file's values). Code inside functions can use anything, wherever it lives.

## Publishing on claude.ai

The game also runs as a claude.ai artifact page: publish `Emberwake.html` as its `index.html`. There the page can't reach the internet message boards, so online play (the arena, the battle royale's PLAY ONLINE, and game codes) goes through the page's own live room instead. Outside that artifact, the Cinder Ring uses the same public message-board relay as the game-code connection.
