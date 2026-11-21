#!/usr/bin/env python3
# Takes the pictures in the guide straight from the game, so they always match it:
#   python3 tools/guide_pictures.py      (from Source; then python3 build.py)
# Needs what the tests need (Playwright and Pillow). Saves to Source/guide/pictures/.
import asyncio, io, os, sys
SOURCE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(SOURCE, 'tests', 'helpers'))
from where import GAME_URL, CHROME
from broker import Broker
from playwright.async_api import async_playwright
from PIL import Image

OUT = os.path.join(SOURCE, 'guide', 'pictures')
SIZE = {'width': 1120, 'height': 630}
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
PORT = 18901


def save(png, name):
    os.makedirs(OUT, exist_ok=True)
    Image.open(io.BytesIO(png)).convert('RGB').save(os.path.join(OUT, name), 'JPEG', quality=84, optimize=True, progressive=True)
    print('saved', name)


async def main():
    Broker(PORT).start(); await asyncio.sleep(.3)
    pw = await async_playwright().start()

    async def window():
        b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME)
        ctx = await b.new_context(viewport=SIZE)
        await ctx.add_init_script("window.EW_BROKERS = ['ws://127.0.0.1:%d/mqtt'];" % PORT)
        pg = await ctx.new_page(); await pg.goto(GAME_URL); await pg.wait_for_timeout(900)
        return b, pg

    async def wait(pg, js, ms=20000):
        for _ in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False

    async def world(pg, nick, seed=4242):
        await pg.evaluate("Object.assign(WORLD,{id:'guide',name:'Aldermere',seed:%d,size:1,shape:0,mode:0,arena:false}); FORM.nick=%r; G.skin=0; startWorld(null);" % (seed, nick))
        await wait(pg, "G.state==='intro'||G.state==='play'")
        await pg.evaluate("if (G.state==='intro') beginPlay(true); G.says.length=0; G.sayCur=null; G.cine=null; G.banner=null; G.clock=.32; G.spawnT=1e9; G.p.inv=999999; 0")
        await pg.wait_for_timeout(1500)
        await pg.evaluate("G.says.length=0; G.sayCur=null; G.banner=null; G.cine=null; 0")

    bA, A = await window()
    save(await A.screenshot(), 'title.jpg')
    await world(A, 'ALPHA')
    await A.evaluate("keys.KeyD = true; 0"); await A.wait_for_timeout(700); await A.evaluate("keys.KeyD = false; 0"); await A.wait_for_timeout(900)
    await A.evaluate("G.says.length=0; G.sayCur=null; G.banner=null; 0"); await A.wait_for_timeout(300)
    save(await A.screenshot(), 'world.jpg')
    # the pack, with a few things picked up
    await A.evaluate("for (const [id, n] of [['log', 6], ['stick', 9], ['fiber', 14], ['flint', 3], ['berries', 5], ['glow_amulet', 1]]) addItem(id, n); trinkFit(); G.trink[0] = 'quick_ring'; G.trink[1] = 'miner_charm'; UI.open = 'inv'; 0")
    await A.wait_for_timeout(600); save(await A.screenshot(), 'pack.jpg')
    # the recipe book, open at the carpenter's page
    await A.evaluate("closeUI(); for (const [id, n] of [['plank', 14], ['stick', 6], ['fittings', 2], ['resin', 3], ['glass', 1]]) addItem(id, n); UI.open = 'book'; UI.bookSt = 'carp'; UI.scroll = 0; 0")
    await A.wait_for_timeout(500); save(await A.screenshot(), 'book.jpg')
    await A.evaluate("closeUI(); UI.open = null; 0")
    # playing together: the friend types the code, then the host sees them
    await A.evaluate("UI.open = 'coop'; 0"); await wait(A, "!!COOP.gcode && sigReady()"); code = await A.evaluate("COOP.gcode")
    bB, B = await window()
    await B.evaluate("FORM.nick = 'BRAVO'; FORM.skin = 2; G.state = 'join'; COOP.long = false; 0"); await B.wait_for_timeout(400)
    box = await B.query_selector('#ew-gcin'); await box.click(); await B.keyboard.type(code); await B.wait_for_timeout(300)
    save(await B.screenshot(), 'join.jpg')
    await B.keyboard.press('Enter'); await wait(B, "G.state==='play' && COOP.joined", 30000)
    await B.evaluate("G.p.inv = 999999; G.says.length = 0; G.sayCur = null; G.banner = null; 0")
    await A.wait_for_timeout(2500); save(await A.screenshot(), 'together.jpg')
    await A.evaluate("closeUI(); UI.open = null; 0")
    # the friend's own view, once their arrival scene is over: both Wakers, names over their heads
    await B.wait_for_timeout(1500); await B.evaluate("G.cine = null; G.banner = null; G.says.length = 0; G.sayCur = null; 0"); await B.wait_for_timeout(1500)
    await B.evaluate("G.cine = null; G.banner = null; G.says.length = 0; G.sayCur = null; 0"); await B.wait_for_timeout(400)
    save(await B.screenshot(), 'friends.jpg')
    # the battle royale: on the barge over the island
    bC, C = await window()
    # a home: furniture that does something, at dusk
    await world(C, 'ALPHA')
    await C.evaluate("""(() => { const p = G.p, tx = floor((p.x + 3) / T) + 90, g = heights[tx], ty = g - 1; streamTo(tx * T, true); G.clock = .5; updateSun(); G.enemies.length = 0; G.pin = null; G.found.add('village');
      for (let y = ty - 7; y <= ty; y++) for (let x = tx - 11; x <= tx + 11; x++) { setTile(x, y, AIR); walls[y * WW + x] = x < tx ? W_POLISHED : W_MOSSB; }
      for (let x = tx - 16; x <= tx + 26; x++) { for (let y = ty - 9; y <= ty; y++) if (x < tx - 12 || x > tx + 12) setTile(x, y, AIR); for (let y = ty + 2; y <= ty + 30; y++) if (!TP[tileAt(x, y)].solid) setTile(x, y, DIRT); setTile(x, ty + 1, x < tx - 12 || x > tx + 12 ? GRASS : POLISHED); }
      for (let x = tx - 12; x <= tx + 12; x++) setTile(x, ty - 8, ROOFTILE);
      for (let x = tx - 20; x <= tx + 30; x++) treeTops.delete(x); for (const B of [PROPB, FGPB]) for (const [k, bk] of B) B.set(k, bk.filter(q => q.x < (tx - 20) * T || q.x > (tx + 30) * T));
      for (let y = ty - 7; y <= ty; y++) { setTile(tx - 12, y, MOSSBRICK); setTile(tx + 12, y, MOSSBRICK); }
      for (let y = ty - 2; y <= ty; y++) setTile(tx + 12, y, AIR); setTile(tx - 12, ty - 4, STAINED_R); setTile(tx + 12, ty - 5, STAINED_B);
      const put = [[BED, -10], [CHAIR, -7], [TABLE, -5], [CANDLES, -5], [RUG, -2], [BOOKSHELF, 0], [WRACK, 2], [STRONGBOX, 4], [BARREL, 5], [PLANTER, 7], [FLOWERPOT, 9], [BRAZIER, 10]];
      for (const [t, dx] of put) { setTile(tx + dx, ty, t); stnPlaced(tx + dx, ty, t); }
      setTile(tx - 3, ty - 7, CHANDELIER); setTile(tx + 6, ty - 7, BANNER);
      stnState(ty * WW + tx + 2, WRACK).items[0] = { id: 'steel_sword', n: 1 }; const pl = stnState(ty * WW + tx + 7, PLANTER); pl.crop = 'berries'; pl.grow = 99999;
      for (const [t, dx] of [[LAMPPOST, 14], [BALLISTA, 17], [SPIKETRAP, 20], [FENCE, 21], [FENCE, 22], [BEEHIVE, 24], [SIGNPOST, -14]]) { const x = tx + dx; setTile(x, ty, t); stnPlaced(x, ty, t); }
      p.x = p.px = (tx + 9) * T; p.y = p.py = (ty + 1) * T - p.h; p.vx = p.vy = 0; p.face = -1; G.says.length = 0; G.sayCur = null; G.banner = null; G.cine = null; snapCam(); })(); 0""")
    for _ in range(3):
        await C.wait_for_timeout(700); await C.evaluate("G.says.length = 0; G.sayCur = null; G.banner = null; G.note = null; G.cine = null; G.biomeT = 0; 0")
    await C.wait_for_timeout(200)
    save(await C.screenshot(), 'home.jpg')
    await C.evaluate("G.nick = 'ALPHA'; FORM.nick = 'ALPHA'; brSolo(); 0"); await wait(C, "G.state === 'play' && BR.on")
    await C.wait_for_timeout(3500); save(await C.screenshot(), 'royale.jpg')
    for b in (bA, bB, bC): await b.close()
    await pw.stop()


asyncio.run(main())
