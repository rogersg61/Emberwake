# Three friends with one host: everyone sees everyone, building, mining, a hollow, an event, a door, chat, and the host leaving.
import asyncio, sys, io, os
from playwright.async_api import async_playwright
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import sheet
URL = GAME_URL
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']

async def main():
    pw = await async_playwright().start(); errs = []; browsers = []
    async def page(name):
        b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME); browsers.append(b)
        ctx = await b.new_context(viewport={'width': 960, 'height': 540}); pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(name + ' PAGEERROR: ' + str(e)))
        pg.on('console', lambda m: errs.append(name + ' ' + m.type + ': ' + m.text) if m.type == 'error' else None)
        await pg.goto(URL); await pg.wait_for_timeout(800); return pg
    async def wait(pg, js, ms=15000):
        for i in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False
    A = await page('HOST'); B = await page('GUEST1'); C = await page('GUEST2')
    res, shots = {}, []
    async def snap(pg, label): shots.append(Image.open(io.BytesIO(await pg.screenshot())).convert('RGB')); labels.append(label)
    labels = []
    await A.evaluate("Object.assign(WORLD,{id:'trio',name:'Trio',seed:777,size:1,shape:0,mode:0,arena:false}); G.skin=1; FORM.nick='ALPHA'; startWorld(null);")
    await wait(A, "G.state==='intro'||G.state==='play'")
    await A.evaluate("if (G.state==='intro') beginPlay(true); G.says.length=0; G.sayCur=null; G.cine=null; G.time=700; G.spawnT=1e9; G.p.inv=999999;")
    # the panels people see while inviting and joining
    await A.evaluate("G.cine = null; G.banner = null; COOP.long = true; UI.open = 'coop'"); await A.wait_for_timeout(200)
    await A.evaluate("coopInvite()"); await wait(A, "!!COOP.code"); await A.evaluate("G.cine = null; G.banner = null;"); await A.wait_for_timeout(300)
    await snap(A, 'host: PLAY TOGETHER panel')
    for pg, nick, skin in ((B, 'BRAVO', 2), (C, 'CHARLIE', 3)):
        code = await A.evaluate("COOP.code")
        await pg.evaluate("G.state = 'join'; COOP.long = true; FORM.nick = '%s'; FORM.skin = %d;" % (nick, skin)); await pg.wait_for_timeout(200)
        await pg.evaluate("document.getElementById('ew-invite').value = %r" % code)
        await pg.evaluate("coopAnswer(document.getElementById('ew-invite').value)"); await wait(pg, "!!COOP.reply"); await pg.wait_for_timeout(300)
        if nick == 'BRAVO': await snap(pg, 'guest: JOIN A FRIEND screen')
        reply = await pg.evaluate("COOP.reply")
        await A.evaluate("document.getElementById('ew-reply').value = %r" % reply)
        await A.evaluate("coopConnect(document.getElementById('ew-reply').value)")
        ok = await wait(pg, "G.state==='play' && COOP.joined", 20000); res[nick + ' joined'] = ok
        await pg.evaluate("G.cine = null; G.says.length = 0; G.sayCur = null; G.p.inv = 999999;")
        if nick == 'BRAVO': await A.evaluate("coopInvite()"); await wait(A, "!!COOP.code")
    await A.evaluate("closeUI()"); await A.wait_for_timeout(2000)
    res['host list'] = await A.evaluate("[...COOP.peers.values()].filter(P => P.ok).map(P => P.name).join(',')")
    res['BRAVO sees'] = await B.evaluate("[...COOP.peers.values()].filter(P => P.f).map(P => P.f.name).join(',')")
    res['CHARLIE sees'] = await C.evaluate("[...COOP.peers.values()].filter(P => P.f).map(P => P.f.name).join(',')")
    # guest to guest: BRAVO builds, CHARLIE sees it (through the host)
    tx = await B.evaluate("floor((G.p.x + 3) / T) + 3"); gy = await B.evaluate("heights[%d]" % tx)
    await B.evaluate("setTile(%d, %d - 1, COBBLE); setTile(%d, %d - 2, COBBLE);" % (tx, gy, tx, gy)); await B.wait_for_timeout(700)
    res['guest-to-guest build'] = [await A.evaluate("tileAt(%d, %d - 2) === COBBLE" % (tx, gy)), await C.evaluate("tileAt(%d, %d - 2) === COBBLE" % (tx, gy))]
    # mining with a real pickaxe on a guest: the crater shows for everyone
    mx = await C.evaluate("SPAWN_X + 140"); await C.evaluate("streamTo(%d * T, true)" % mx); await A.evaluate("streamTo(%d * T, true)" % mx); await B.evaluate("streamTo(%d * T, true)" % mx)
    mg = await C.evaluate("heights[%d]" % mx); res['mine target'] = await C.evaluate("TP[tileAt(%d, %d)].name" % (mx, mg))
    await C.evaluate("(() => { inv[0] = { id: 'pick', n: 1 }; G.sel = 0; G.p.x = G.p.px = %d * T - 14; G.p.y = G.p.py = (%d - 3) * T; G.p.vx = 0; G.cine = null; })()" % (mx, mg))
    for i in range(40):
        await C.evaluate("(() => { mouse.wx = %d * T + 4; mouse.wy = %d * T + 3; mouse.x = (mouse.wx - G.rcx) * VS.s; mouse.y = (mouse.wy - G.rcy) * VS.s; mouse.l = true; G.cine = null; })()" % (mx, mg)); await C.wait_for_timeout(16)
    await C.evaluate("mouse.l = false"); await C.wait_for_timeout(700)
    q = "(() => { let n = 0, s = ''; for (let y = %d - 1; y <= %d + 2; y++) for (let x = %d - 1; x <= %d + 1; x++) { const i = y * WW + x; s += tiles[i] + (CHIP.has(i) ? 'c' + chipEnc(CHIP.get(i)).slice(0, 4) : '') + ','; } return s; })()" % (mg, mg, mx, mx)
    res['mining seen the same by all'] = [await C.evaluate(q) == await A.evaluate(q), await A.evaluate(q) == await B.evaluate(q), (await C.evaluate(q))[:60]]
    # a hollow fort's guards: everyone sees them; a guest can strike one
    await A.evaluate("(() => { const p = G.p, h = spawnHollow(p.x + 60, p.y - 10); h.nid = COOP.nid++; h.hp = h.maxhp = 200; window.HOL = h; h.ai.atkCd = 9999; })()")
    ok = await wait(B, "[...COOP.hghosts.values()].length > 0", 4000); res['guest sees the hollow'] = ok
    await B.evaluate("(() => { const f = [...COOP.hghosts.values()][0]; hurtFighter(f, 30, f.x - 10, { kx: 2, ky: -1 }); })()"); await B.wait_for_timeout(500)
    res['hollow hp on host'] = await A.evaluate("HOL.hp")
    await A.evaluate("HOL.inv = 0; HOL.hp = 1; HOL.hurtT = 0; hurtFighter(HOL, 10, HOL.x - 5, { kx: 1, ky: -1 })"); res['hollow dead on host'] = await A.evaluate("HOL.dead"); await A.wait_for_timeout(1600)
    res['hollow gone for guests'] = [await B.evaluate("[...COOP.hghosts.values()].filter(f => !f.dead).length"), await C.evaluate("COOP.hghosts.size")]
    # the sky follows the host
    await A.evaluate("startEvent('fog')"); await A.wait_for_timeout(600)
    res['event on guests'] = [await B.evaluate("G.ev && G.ev.id"), await C.evaluate("G.ev && G.ev.id")]
    await A.evaluate("G.ev = null"); await A.wait_for_timeout(500)
    # a door: open on one screen, open on all
    await A.evaluate("(() => { const x = %d - 4; for (let y = %d - 3; y < %d; y++) setTile(x, y, DOORC); })()" % (tx, gy, gy)); await A.wait_for_timeout(400)
    await B.evaluate("toggleDoor(%d - 4, %d - 1)" % (tx, gy)) if await B.evaluate("typeof toggleDoor === 'function'") else None
    await B.wait_for_timeout(500)
    res['door'] = [await A.evaluate("tileAt(%d - 4, %d - 1)" % (tx, gy)), await C.evaluate("tileAt(%d - 4, %d - 1)" % (tx, gy)), await A.evaluate("DOORO")]
    # chat between guests
    await C.evaluate("chatSend('charlie here')"); await C.wait_for_timeout(500)
    res['chat at BRAVO'] = await B.evaluate("COOP.chat.map(l => (l.n ? l.n + ': ' : '') + l.s).join(' | ')")
    await B.evaluate("chatKey()"); await B.wait_for_timeout(300)
    await snap(B, 'guest view: friends, chat, list')
    await snap(A, 'host view')
    # the host leaves: guests are told, their packs are kept
    await A.evaluate("quitToTitle()"); await B.wait_for_timeout(1500)
    res['after host left'] = [await B.evaluate("[G.state, COOP.role, COOP.err]"), await C.evaluate("[G.state, COOP.role]")]
    sheet(shots, 2, shot('coop_panels.png'), labels, .6)
    for k, v in res.items(): print(k, '=>', v)
    print('errors:', errs[:10])
    for b in browsers: await b.close()
    await pw.stop()
asyncio.run(main())
