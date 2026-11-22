# The benches, things to place, trinkets, meals and the guardians' offerings.
# Every new bench opens and lists its own work; a trinket is made, worn and felt; a meal gives its boon;
# storage keeps its slots through a save; planters grow; the bed rests you; traps, the ballista and the bell
# work; the Warden waits for its offering; the iron anvil wants the Warden's sigil; screenshots of the book,
# a furnished room and the trinket slots.
import asyncio, sys, os, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet

async def main():
    h = await H().start(seed=4242, size=1); res = {}; ims = []; labels = []
    await h.ev("SETTINGS.craft = 'simple'; G.cine = null; G.dialog = null; G.says.length = 0; G.sayCur = null; inv.fill(null); G.p.inv = 1e9; G.enemies.length = 0;")
    here = "const p = G.p, tx = floor((p.x + 3) / T), ty = floor((p.y + p.h - 1) / T);"
    # ---- every bench: it can be built, placed, opened, and lists its own work ----
    res['benches and what they make'] = json.loads(await h.ev("""(() => { %s const out = {};
      for (const [tile, kind, item] of [[CARPENTER, 'carp', 'carpenter'], [ARMOURY, 'armr', 'armoury'], [TINKER, 'tink', 'tinker'], [JEWELLER, 'jewel', 'jeweller'], [OVEN, 'oven', 'oven'], [OFFERING, 'altar', 'offering_altar']]) {
        const made = RECIPES.find(r => r.out === item); setTile(tx + 2, ty, tile); openStation(tx + 2, ty); render(1);
        out[TP[tile].name] = [made ? made.st : 'nowhere', UI.open === 'stn' && UI.stn.kind === kind, stnList(kind, tile).length]; closeUI(); setTile(tx + 2, ty, AIR); }
      return JSON.stringify(out); })()""" % here))
    res['where things went'] = await h.ev("['lantern', 'glider', 'compass', 'iron_head', 'hide_head', 'moon_lantern', 'rootkey', 'backpack'].map(id => id + ': ' + madeAt(id).join('/')).join(', ')")
    res['iron anvil needs the Warden sigil'] = await h.ev("JSON.stringify(RECIPES.find(r => r.out === 'anvil2').need)")
    # ---- the armourer's stand wants an anvil of the armour's rank nearby ----
    res['iron armour: no anvil, then an iron anvil'] = await h.ev("""(() => { %s setTile(tx + 2, ty, ARMOURY); const a = stnList('armr', ARMOURY).find(e => e.r.out === 'iron_head');
      setTile(tx - 2, ty, ANVIL2); const b = stnList('armr', ARMOURY).find(e => e.r.out === 'iron_head'); setTile(tx - 2, ty, AIR); setTile(tx + 2, ty, AIR); return [a && a.lvlOk, b && b.lvlOk]; })()""" % here)
    # ---- a trinket: made at the jeweller, worn, felt ----
    await h.ev("""(() => { %s addItem('copper_bar', 2); addItem('glass', 1); setTile(tx + 2, ty, JEWELLER); openStation(tx + 2, ty); })()""" % here); await h.step(2, "")
    xy = await h.ev("stnRowXY('jewel', JEWELLER, e => e.r.out === 'quick_ring')")
    cx, cy = await h.ev("(() => { const r = cv.getBoundingClientRect(), k = VS.ui * r.width / cv.width; return [r.left + %f * k, r.top + %f * k]; })()" % tuple(xy))
    await h.pg.mouse.click(cx, cy); await h.step(80, "")
    res['made a quickstep ring'] = await h.ev("countItem('quick_ring')")
    await h.ev("closeUI(); setTile(floor((G.p.x + 3) / T) + 2, floor((G.p.y + G.p.h - 1) / T), AIR);")
    res['walk speed before / after wearing it'] = await h.ev("(() => { const a = gearMul('walk'); const k = inv.findIndex(s => s && s.id === 'quick_ring'); wearTrinketAt(k); return [+a.toFixed(3), +gearMul('walk').toFixed(3), G.trink.filter(Boolean), countItem('quick_ring')]; })()")
    res['slots at the start, then with the Warden beaten'] = await h.ev("(() => { const a = trinkSlots(); G.flags.wardenDead = true; const b = trinkSlots(); G.flags.wardenDead = false; return [a, b]; })()")
    res['third trinket with two slots'] = await h.ev("(() => { addItem('might_band', 1); addItem('stone_ring', 1); wearTrinketAt(inv.findIndex(s => s && s.id === 'might_band')); const ok = wearTrinket('stone_ring'); return [ok, G.trink.filter(Boolean)]; })()")
    res['damage and harm with the band'] = await h.ev("(() => { tickBless(); return [+G.p.dmgMul.toFixed(2), +boonMul('taken').toFixed(2)]; })()")
    # ---- a meal ----
    res['a berry pie'] = await h.ev("(() => { addItem('berry_pie', 1); G.food = 100; const a = gearMul('walk'); G.p.eatCd = 0; eat(IT.berry_pie); return [G.meal && G.meal.k, +a.toFixed(3), +gearMul('walk').toFixed(3), countItem('berry_pie')]; })()")
    # ---- storage of three sizes, kept through a save ----
    res['storage sizes'] = await h.ev("""(() => { %s const out = []; for (const [t, d] of [[CRATE, 2], [BARREL, 3], [STRONGBOX, 4]]) { tryPlace(IT[TP[t].drop], tx + d, ty) || setTile(tx + d, ty, t); stnPlaced(tx + d, ty, t); const s = stnState(ty * WW + tx + d, t); out.push(s.items.length); }
      const s = stnState(ty * WW + tx + 4, STRONGBOX); s.items[25] = { id: 'rock', n: 7 }; return out; })()""" % here)
    await h.ev("UI.open = 'stn'; UI.stn = { tx: floor((G.p.x + 3) / T) + 4, ty: floor((G.p.y + G.p.h - 1) / T), t: STRONGBOX, kind: 'chest', i: floor((G.p.y + G.p.h - 1) / T) * WW + floor((G.p.x + 3) / T) + 4 }; render(1);")
    await h.step(2, ""); ims.append(await h.shot()); labels.append('a strongbox: 30 slots')
    await h.ev("closeUI()")
    # ---- a planter ----
    res['planter: plant, grow, harvest'] = await h.ev("""(() => { %s setTile(tx - 3, ty, PLANTER); stnPlaced(tx - 3, ty, PLANTER); addItem('berries', 1); const i = ty * WW + tx - 3, s = stnState(i, PLANTER);
      planterAct(i, s); const planted = s.crop; for (let k = 0; k < 200; k++) tickFurniture(); const g = s.grow > 0; s.grow = 99999; const b = countItem('berries'); planterAct(i, s); return [planted, g, countItem('berries') - b, s.crop || 'empty']; })()""" % here)
    # ---- the bed ----
    res['bed: wake here, rested'] = await h.ev("""(() => { %s setTile(tx + 6, ty, BED); stnPlaced(tx + 6, ty, BED); const r = G.respawn && G.respawn.x === tx + 6; bedSleep(tx + 6, ty); return [r, G.rest > 0, boonHas('regen')]; })()""" % here)
    # ---- traps, the ballista, the bell ----
    res['ballista shoots a husk'] = await h.ev("""(() => { %s G.enemies.length = 0; G.projs.length = 0; setTile(tx - 6, ty, BALLISTA); stnPlaced(tx - 6, ty, BALLISTA); for (let x = tx - 16; x <= tx - 5; x++) { for (let y = ty - 4; y <= ty; y++) setTile(x, y, AIR); setTile(x, ty + 1, STONE); } setTile(tx - 6, ty, BALLISTA); stnPlaced(tx - 6, ty, BALLISTA); const e = spawnMob('husk', tx - 14, ty + 1); e.x = (tx - 14) * T; e.y = (ty + 1) * T - e.h; e.stun = 9999; const hp0 = e.hp;
      const s = stnState(ty * WW + tx - 6, BALLISTA); s.cd = 0; for (let k = 0; k < 90; k++) { G.time++; refreshFoes(); tickFurniture(); tickProjs(); e.stun = 9999; } const out = [hp0, e.hp, s.face]; e.dead = true; G.enemies.length = 0; setTile(tx - 6, ty, AIR); return out; })()""" % here)
    res['spike trap hurts what walks on it'] = await h.ev("""(() => { %s G.enemies.length = 0; const x = tx + 9; setTile(x, heights[x] - 1, SPIKETRAP); stnPlaced(x, heights[x] - 1, SPIKETRAP); const e = spawnMob('husk', x, heights[x]); e.x = x * T; e.y = heights[x] * T - e.h; e.stun = 9999; const hp0 = e.hp;
      for (let k = 0; k < 30; k++) { G.time++; tickFurniture(); } const out = [hp0, e.hp]; e.dead = true; G.enemies.length = 0; return out; })()""" % here)
    # ---- the guardians want offerings ----
    res['the shrine without, then with, an Ashen Offering'] = await h.ev("""(() => { G.boss = null; shrineAct(); const a = !!G.boss; addItem('ashen_offering', 1); shrineAct(); const b = !!G.boss && G.boss.type === 'boss'; despawnBoss(); return [a, b, countItem('ashen_offering')]; })()""")
    res['ashen offering recipe'] = await h.ev("JSON.stringify(RECIPES.find(r => r.out === 'ashen_offering').need) + ' at ' + RECIPES.find(r => r.out === 'ashen_offering').st")
    res['shepherd only for a called moon'] = await h.ev("(() => { const t = eventTick.toString(); return t.includes('e.called'); })()")
    # ---- save and load: trinkets, meal, strongbox ----
    res['after a save and load'] = await h.ev("""(async () => { %s const bx = tx + 4, by = ty; saveWorld(true); const id = WORLD.id, meta = JSON.parse(localStorage.getItem(profileKey('index'))).find(m => m.id === id);
      if (!meta) return 'no save'; quitToTitle(); await new Promise(r => setTimeout(r, 200)); await openWorld(meta); await new Promise(r => setTimeout(r, 500)); if (G.state === 'intro') beginPlay(false);
      const s = STN.get(by * WW + bx); return [G.trink.filter(Boolean), G.meal && G.meal.k, s ? s.items.length : 'no box', s && s.items[25] ? s.items[25].n : 0, G.rest > 0]; })()""" % here)
    await h.ev("G.cine = null; G.dialog = null; G.p.inv = 1e9;")
    # ---- screenshots: the recipe book, the trinket slots, a furnished room ----
    await h.ev("closeUI(); UI.open = 'book'; UI.bookSt = 'carp'; UI.scroll = 0;"); await h.step(2, ""); ims.append(await h.shot()); labels.append('the recipe book')
    await h.ev("closeUI(); UI.open = 'inv';"); await h.step(2, ""); ims.append(await h.shot()); labels.append('pack: trinket slots')
    await h.ev("""(() => { closeUI(); %s G.clock = .75; updateSun(); G.enemies.length = 0;
      for (let y = ty - 6; y <= ty; y++) for (let x = tx - 9; x <= tx + 9; x++) { setTile(x, y, AIR); walls[y * WW + x] = W_POLISHED; }
      for (let x = tx - 10; x <= tx + 10; x++) setTile(x, ty + 1, POLISHED); for (let y = ty - 7; y <= ty; y++) { setTile(tx - 10, y, MOSSBRICK); setTile(tx + 10, y, MOSSBRICK); } for (let x = tx - 10; x <= tx + 10; x++) setTile(x, ty - 7, ROOFTILE);
      const put = [[BED, -8], [TABLE, -4], [CHAIR, -6], [CANDLES, -4], [BOOKSHELF, -2], [WRACK, 0], [STRONGBOX, 2], [BARREL, 3], [CRATE, 4], [PLANTER, 6], [FLOWERPOT, 8], [RUG, -5]];
      for (const [t, dx] of put) { setTile(tx + dx, ty, t); stnPlaced(tx + dx, ty, t); }
      setTile(tx - 1, ty - 6, CHANDELIER); setTile(tx + 5, ty - 6, BANNER); setTile(tx + 9, ty - 3, STAINED_R); setTile(tx - 9, ty - 3, STAINED_B);
      const rk = stnState(ty * WW + tx, WRACK); rk.items[0] = { id: 'steel_sword', n: 1 }; const pl = stnState(ty * WW + tx + 6, PLANTER); pl.crop = 'berries'; pl.grow = 99999;
      G.p.x = G.p.px = (tx + 1) * T; G.p.y = G.p.py = (ty + 1) * T - G.p.h; G.cam.x = G.p.x - VS.vw / 2; G.cam.y = G.p.y - VS.vh / 2; })()""" % here)
    await h.step(20, ""); ims.append(await h.shot()); labels.append('a furnished room at night')
    await h.ev("snapCam(); G.says.length = 0; G.sayCur = null;"); await h.step(4, "")
    (await h.pcrop(260, 110)).save(shot('a_furnished_room.png'))
    sheet(ims, 2, shot('benches_and_trinkets.png'), labels, .5)
    for k, v in res.items(): print(k, '=>', v)
    print('errors:', [e for e in h.errs if 'agent-proxy' not in e][:6])
    await h.stop()
asyncio.run(main())
