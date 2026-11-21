# Two players with the long invite codes: building, digging, a chest, a creature, chat, a shared drop, a rift, and leaving.
import asyncio, sys, io, os
from playwright.async_api import async_playwright
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import sheet
URL = GAME_URL
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
HASH = "((a, b) => { let h = 2166136261; for (let x = a; x <= b; x++) for (let y = 40; y < 200; y++) { const i = y * WW + x; h = Math.imul(h ^ tiles[i], 16777619); h = Math.imul(h ^ walls[i], 16777619); } return h >>> 0; })"

async def main():
    pw = await async_playwright().start()
    errs = []
    async def page(name):
        b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME)
        ctx = await b.new_context(viewport={'width': 960, 'height': 540}); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(name + ' PAGEERROR: ' + str(e)))
        pg.on('console', lambda m: errs.append(name + ' ' + m.type + ': ' + m.text) if m.type == 'error' else None)
        await pg.goto(URL); await pg.wait_for_timeout(800); return b, pg
    bA, A = await page('HOST'); bB, B = await page('GUEST')
    res = {}
    async def wait(pg, js, ms=15000):
        for i in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False
    # the host opens a world and makes an invite
    await A.evaluate("Object.assign(WORLD,{id:'coopworld',name:'Shared Test',seed:4242,size:1,shape:0,mode:0,arena:false}); G.skin=0; FORM.nick='ALPHA'; startWorld(null);")
    await wait(A, "G.state==='intro'||G.state==='play'")
    await A.evaluate("if (G.state==='intro') beginPlay(true); G.says.length=0; G.sayCur=null; G.cine=null; G.time=700; G.spawnT=1e9; G.p.inv=999999;")
    await A.evaluate("coopInvite()")
    await wait(A, "!!COOP.code")
    code = await A.evaluate("COOP.code")
    res['invite code length'] = len(code)
    # the guest answers from the title screen
    await B.evaluate("FORM.nick='BRAVO'; FORM.skin=2; G.state='join';")
    await B.evaluate("coopAnswer(%r)" % code)
    await wait(B, "!!COOP.reply || !!COOP.err")
    reply = await B.evaluate("COOP.reply"); res['reply code length'] = len(reply); res['guest error'] = await B.evaluate("COOP.err")
    await A.evaluate("coopConnect(%r)" % reply)
    ok = await wait(B, "G.state==='play' && WORLD.guest && COOP.joined", 20000)
    res['guest joined'] = ok
    await A.wait_for_timeout(1500)
    res['host sees'] = await A.evaluate("[...COOP.peers.values()].map(P => [P.name, P.ok, !!P.f]).join(';')")
    res['guest sees'] = await B.evaluate("[COOP.role, COOP.hostName, WORLD.name, [...COOP.peers.values()].map(P => P.name + ':' + !!P.f).join(';')]")
    # same land
    x0 = await A.evaluate("SPAWN_X")
    await B.evaluate("G.p.inv = 999999; G.says.length = 0; G.sayCur = null;")
    hA = await A.evaluate("(%s)(SPAWN_X - 150, SPAWN_X + 150)" % HASH); hB = await B.evaluate("(%s)(SPAWN_X - 150, SPAWN_X + 150)" % HASH)
    res['same land around the village'] = hA == hB
    # positions: the guest walks, the host sees it
    await B.evaluate("keys.KeyD = true"); await B.wait_for_timeout(900); await B.evaluate("keys.KeyD = false"); await B.wait_for_timeout(600)
    bx = await B.evaluate("G.p.x"); seen = await A.evaluate("(() => { const P = [...COOP.peers.values()][0]; return P.f ? P.f.x : -1; })()")
    res['guest moved, host sees within'] = [round(abs(bx - seen), 1), round(bx - (await A.evaluate("SPAWN_X")) * 8)]
    # digging and building: both ways
    tx = await A.evaluate("(() => { const p = G.p, tx = floor((p.x + 3) / T) + 4; return tx; })()")
    gy = await A.evaluate("heights[%d]" % tx)
    await A.evaluate("setTile(%d, %d - 1, PLANK); PLACED.add((%d - 1) * WW + %d);" % (tx, gy, gy, tx))
    await A.wait_for_timeout(500)
    res['host built, guest sees'] = await B.evaluate("[tileAt(%d, %d - 1) === PLANK, PLACED.has((%d - 1) * WW + %d)]" % (tx, gy, gy, tx))
    await B.evaluate("setTile(%d, %d, AIR)" % (tx + 2, gy))
    await B.wait_for_timeout(500)
    res['guest dug, host sees'] = await A.evaluate("tileAt(%d, %d) === AIR" % (tx + 2, gy))
    # a chest: the host puts something in, the guest takes it out
    await A.evaluate("setTile(%d, %d - 1, CHEST); const s = stnState((%d - 1) * WW + %d, CHEST); s.items[0] = { id: 'iron_bar', n: 5 }; COOP.stns.add((%d - 1) * WW + %d);" % (tx - 3, gy, gy, tx - 3, gy, tx - 3))
    await A.wait_for_timeout(600)
    res['chest debug'] = await B.evaluate("[tileAt(%d, %d - 1), CHEST, STN.has((%d - 1) * WW + %d), JSON.stringify(STN.get((%d - 1) * WW + %d) || null).slice(0, 80)]" % (tx - 3, gy, gy, tx - 3, gy, tx - 3))
    res['chest host'] = await A.evaluate("[tileAt(%d, %d - 1), STN.has((%d - 1) * WW + %d), COOP.stns.size]" % (tx - 3, gy, gy, tx - 3))
    res['chest shared'] = await B.evaluate("(() => { const s = STN.get((%d - 1) * WW + %d); return s && s.items[0] ? s.items[0].id + ' x' + s.items[0].n : null; })()" % (gy, tx - 3))
    await B.evaluate("(() => { const i = (%d - 1) * WW + %d, s = stnState(i, CHEST); s.items[0] = null; COOP.stns.add(i); })()" % (gy, tx - 3))
    await B.wait_for_timeout(600)
    res['chest emptied on host'] = await A.evaluate("(() => { const s = STN.get((%d - 1) * WW + %d); return s ? s.items[0] : 'none'; })()" % (gy, tx - 3))
    # a creature by the guest: the guest sees it, hits it, and gets its own loot
    await A.evaluate("(() => { const P = [...COOP.peers.values()][0], f = P.f, e = spawnMob('husk', floor((f.x + 3) / T) + 6, heights[floor((f.x + 3) / T) + 6]); e.hp = e.maxhp = 60; e.nid = COOP.nid++; window.HUSK = e; })()")
    seen = await wait(B, "[...COOP.ghosts.values()].some(g => g.type === 'husk')", 4000)
    res['guest sees the husk'] = seen
    await B.wait_for_timeout(1500)
    hp0 = await A.evaluate("HUSK.hp")
    res['husk went for the guest'] = await A.evaluate("HUSK.tgtF && HUSK.tgtF.coop ? 'guest' : 'host'")
    gh0 = await B.evaluate("G.p.hp")
    await B.evaluate("G.p.inv = 0")
    await B.wait_for_timeout(2500)
    res['guest hp after husk swings'] = [gh0, await B.evaluate("G.p.hp")]
    await B.evaluate("G.p.inv = 999999")
    png = await B.screenshot(); imB = Image.open(io.BytesIO(png)).convert('RGB')
    png = await A.screenshot(); imA = Image.open(io.BytesIO(png)).convert('RGB')
    await B.evaluate("(() => { const g = [...COOP.ghosts.values()].find(g => g.type === 'husk'); damageEnemy(g, 25, 2, -1, { crit: false }); })()")
    await B.wait_for_timeout(400)
    res['guest hit lands on host'] = [hp0, await A.evaluate("HUSK.hp")]
    d0 = await B.evaluate("G.drops.length")
    await B.evaluate("(() => { const g = [...COOP.ghosts.values()].find(g => g.type === 'husk'); if (g) damageEnemy(g, 99, 2, -1, {}); })()")
    await B.wait_for_timeout(800)
    res['husk dead on host'] = await A.evaluate("HUSK.dead")
    res['guest got its own loot'] = [d0, await B.evaluate("G.drops.length"), await B.evaluate("COOP.ghosts.size")]
    # chat
    await A.evaluate("chatSend('hello from the host')"); await A.wait_for_timeout(400)
    res['chat'] = await B.evaluate("COOP.chat.map(l => (l.n ? l.n + ': ' : '') + l.s).join(' | ')")
    # dropping an item for a friend
    await A.evaluate("(() => { const p = G.p; spawnDrop('salve', 3, p.x + 3, p.y + 4, 0, -1); const d = G.drops[G.drops.length - 1]; d.delay = 999; netDropOut(d); })()"); await A.wait_for_timeout(400)
    res['shared drop'] = await B.evaluate("G.drops.filter(d => d.uid).map(d => d.id + ' x' + d.n).join(',')")
    # through a rift together
    await A.evaluate("G.flags.seen1 = true; enterDim(1, true)")
    ok = await wait(B, "DIM === 1 && G.state === 'play'", 8000)
    await B.wait_for_timeout(800)
    res['guest followed into Cinderdeep'] = [ok, await B.evaluate("DIM"), await A.evaluate("DIM")]
    cx = await A.evaluate("floor(G.p.x / T)"); hA = await A.evaluate("(%s)(%d - 60, %d + 60)" % (HASH, cx, cx)); hB = await B.evaluate("(%s)(%d - 60, %d + 60)" % (HASH, cx, cx))
    res['same land in Cinderdeep'] = hA == hB
    res['host sees guest after travel'] = await A.evaluate("(() => { const P = [...COOP.peers.values()][0]; return P.f && G.fighters.includes(P.f) ? round(abs(P.f.x - G.p.x)) : -1; })()")
    await A.evaluate("enterDim(0, true)"); await wait(B, "DIM === 0 && G.state === 'play'", 8000); await B.wait_for_timeout(600)
    res['back home'] = [await B.evaluate("DIM"), await B.evaluate("tileAt(%d, %d - 1) === PLANK" % (tx, gy))]
    # the guest leaves; its pack is kept
    await B.evaluate("G.p.x += 0; inv[5] = { id: 'iron_bar', n: 7 }; quitToTitle()"); await B.wait_for_timeout(800)
    res['host after guest left'] = await A.evaluate("[COOP.role, COOP.peers.size, G.fighters.length]")
    res['guest pack kept'] = await B.evaluate("(JSON.parse(localStorage.getItem('ew2.guest.coopworld') || '{}').inv || []).filter(Boolean).map(s => s[0]).join(',')")
    sheet([imA, imB], 2, shot('coop_two_screens.png'), ['HOST (ALPHA)', 'GUEST (BRAVO)'], .6)
    for k, v in res.items(): print(k, '=>', v)
    print('errors:', errs[:10])
    await bA.close(); await bB.close(); await pw.stop()

asyncio.run(main())
