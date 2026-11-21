# The host's creatures as a friend sees them: every overworld creature, travel through a rift, and a guardian fought together.
import asyncio, sys, io, os
from playwright.async_api import async_playwright
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import sheet
URL = GAME_URL
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']

async def main():
    pw = await async_playwright().start(); errs = []; bs = []
    async def page(name):
        b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME); bs.append(b)
        pg = await (await b.new_context(viewport={'width': 960, 'height': 540})).new_page()
        pg.on('pageerror', lambda e: errs.append(name + ' PAGEERROR: ' + str(e)))
        pg.on('console', lambda m: errs.append(name + ' ' + m.type + ': ' + m.text) if m.type == 'error' else None)
        await pg.goto(URL); await pg.wait_for_timeout(800); return pg
    async def wait(pg, js, ms=15000):
        for i in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False
    A = await page('HOST'); B = await page('GUEST')
    await A.evaluate("Object.assign(WORLD,{id:'foes',name:'Foes',seed:4242,size:1,shape:0,mode:0,arena:false}); G.skin=0; FORM.nick='ALPHA'; startWorld(null);")
    await wait(A, "G.state==='intro'||G.state==='play'")
    await A.evaluate("if (G.state==='intro') beginPlay(true); G.cine=null; G.says.length=0; G.sayCur=null; G.time=700; G.spawnT=1e9; G.p.inv=999999; G.flags.seen1 = true;")
    await A.evaluate("coopInvite()"); await wait(A, "!!COOP.code"); code = await A.evaluate("COOP.code")
    await B.evaluate("FORM.nick='BRAVO'; G.state='join';"); await B.evaluate("coopAnswer(%r)" % code); await wait(B, "!!COOP.reply")
    await A.evaluate("coopConnect(%r)" % await B.evaluate("COOP.reply")); await wait(B, "G.state==='play' && COOP.joined", 20000)
    await B.evaluate("G.cine=null; G.says.length=0; G.sayCur=null; G.p.inv=999999;")
    ims, labels = [], []
    # every overworld creature, lined up beside the guest
    types = ['husk', 'mote', 'mite', 'rustback', 'thornback', 'glassfly', 'golem', 'ashhare', 'crawler', 'skyray', 'cinderling', 'bat']
    await A.evaluate("""(() => { const P = [...COOP.peers.values()][0], gx = floor((P.f.x + 3) / T); const L = %s; L.forEach((t, k) => { const tx = gx + 6 + k * 4, e = spawnMob(t, tx, heights[tx]); e.hp = e.maxhp = 999; e.stun = 99999; }); })()""" % str(types))
    await B.wait_for_timeout(1500)
    res = {'guest ghosts': await B.evaluate("[...COOP.ghosts.values()].map(g => g.type).sort().join(',')")}
    await B.evaluate("G.cam.x += 70"); await B.wait_for_timeout(300)
    ims.append(Image.open(io.BytesIO(await B.screenshot())).convert('RGB')); labels.append('guest sees the host creatures')
    await A.evaluate("G.enemies.length = 0")
    await B.wait_for_timeout(800); res['ghosts cleared'] = await B.evaluate("COOP.ghosts.size")
    # into Cinderdeep, where the host wakes the Slag Tyrant
    await A.evaluate("enterDim(1, true)"); await wait(B, "DIM === 1 && G.state === 'play'", 10000); await B.wait_for_timeout(500)
    res['after travel'] = [await A.evaluate("[round(G.p.x / T), round([...COOP.peers.values()][0].f.x / T), SPAWN_X]"), await B.evaluate("[round(G.p.x / T), round(COOP.peers.get('h').f.x / T), SPAWN_X]")]
    for pg in (A, B):
        await pg.evaluate("(() => { streamTo(DARENA_X * T, true); const p = G.p; p.x = p.px = (DARENA_X - 24) * T; p.y = p.py = (DARENA_Y - 4) * T; let n = 0; while (boxHits(p.x, p.y, p.w, p.h) && n++ < 80) p.y = p.py = p.y - T; p.vx = p.vy = 0; snapCam(); })()")
    await B.wait_for_timeout(800)
    await A.evaluate("(() => { const b = bossSpawn('slagtyrant', DARENA_X * T, (DARENA_Y - 6) * T); b.nid = COOP.nid++; window.BOSS = b; })()")
    await B.wait_for_timeout(2500)
    res['host side'] = await A.evaluate("(() => { const P = [...COOP.peers.values()][0]; return [G.enemies.length, BOSS.nid, P.seen.has(BOSS.nid), round(P.f.x - BOSS.x), round(P.f.y - BOSS.y), DIM, P.f.inDim, G.fighters.includes(P.f)]; })()")
    res['guest side'] = await B.evaluate("[COOP.ghosts.size, G.enemies.length, DIM, round(G.p.x), round(G.p.y)]")
    res['boss ghost'] = await B.evaluate("(() => { const g = [...COOP.ghosts.values()].find(g => g.boss); return g ? [g.type, g.state, G.boss === g] : null; })()")
    ims.append(Image.open(io.BytesIO(await B.screenshot())).convert('RGB')); labels.append('guest: the Slag Tyrant')
    for i in range(8):
        await B.evaluate("(() => { const g = [...COOP.ghosts.values()].find(g => g.boss); if (g) damageEnemy(g, 120, 1, -1, {}); })()"); await B.wait_for_timeout(250)
    res['boss hp on host after guest hits'] = await A.evaluate("[BOSS.hp, BOSS.maxhp, BOSS.state]")
    await A.evaluate("BOSS.hp = 1; damageEnemy(BOSS, 50, 1, -1, {})")
    ok = await wait(B, "G.flags[BOSSES.slagtyrant.flag] === true", 8000)
    res['guest credited with the Tyrant'] = [ok, await B.evaluate("G.p.maxhp"), await B.evaluate("G.drops.map(d => d.id).slice(0, 6).join(',')")]
    ims.append(Image.open(io.BytesIO(await B.screenshot())).convert('RGB')); labels.append('guest: the Tyrant falls')
    sheet(ims, 3, shot('coop_foes.png'), labels, .45)
    for k, v in res.items(): print(k, '=>', v)
    print('errors:', errs[:10])
    for b in bs: await b.close()
    await pw.stop()
asyncio.run(main())
