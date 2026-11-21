# Co-op consistency: doors, explosions, new stations, one-at-a-time chests, and a host who switches away.
import asyncio, sys, os, time
from playwright.async_api import async_playwright
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from broker import Broker
URL = GAME_URL
ARGS = ['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows']
PORT = 18863
async def main():
    broker = Broker(PORT).start(); await asyncio.sleep(.3)
    pw = await async_playwright().start(); errs = []; res = {}
    async def page(name):
        b = await pw.chromium.launch(headless=True, args=ARGS, **CHROME)
        ctx = await b.new_context(viewport={'width': 960, 'height': 540})
        await ctx.add_init_script("window.EW_BROKERS = ['ws://127.0.0.1:%d/mqtt'];" % PORT)
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(name + ' PAGEERROR: ' + str(e)))
        pg.on('console', lambda m: errs.append(name + ' ' + m.type + ': ' + m.text) if m.type in ('error', 'warning') else None)
        await pg.goto(URL); await pg.wait_for_timeout(600); return b, pg
    async def wait(pg, js, ms=15000):
        for i in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False
    bA, A = await page('HOST'); bB, B = await page('BRAVO')
    await A.evaluate("Object.assign(WORLD,{id:'cw',name:'Consistency',seed:4242,size:1,shape:0,mode:0,arena:false}); FORM.nick='ALPHA'; startWorld(null);")
    await wait(A, "G.state==='intro'||G.state==='play'")
    await A.evaluate("if (G.state==='intro') beginPlay(true); G.says.length=0; G.sayCur=null; G.cine=null; G.time=700; G.spawnT=1e9; G.p.inv=999999; UI.open='coop';")
    await wait(A, "!!COOP.gcode && sigReady()", 8000); code = await A.evaluate("COOP.gcode"); await A.evaluate("closeUI(); UI.open = null;")
    await B.evaluate("FORM.nick='BRAVO'; G.state='join';"); await B.evaluate("sigJoin(%r)" % code)
    res['joined'] = await wait(B, "G.state==='play' && WORLD.guest && COOP.joined", 25000)
    await B.evaluate("G.p.inv = 999999; G.says.length = 0; G.sayCur = null;"); await A.wait_for_timeout(800)
    # stand the guest on flat ground next to the host
    hx = await A.evaluate("floor((G.p.x + 3) / T)")
    # ---- a door: the host's door must not shut on the guest standing in it ----
    dx = hx + 6
    await A.evaluate("""(() => { const x = %d, g = heights[x]; for (let y = g - 3; y < g; y++) setTile(x, y, DOORC); })()""" % dx)
    await A.wait_for_timeout(600)
    await A.evaluate("toggleDoor(%d, heights[%d] - 1);" % (dx, dx)); await A.wait_for_timeout(500)
    await B.evaluate("(() => { const x = %d; G.p.x = G.p.px = x * T + 1; G.p.y = G.p.py = (heights[x] - 3) * T + 2; G.p.vx = 0; })()" % dx)
    await A.wait_for_timeout(700)
    res['host sees guest in the doorway (tile)'] = await A.evaluate("(() => { const P = [...COOP.peers.values()][0]; return P && P.f ? floor((P.f.x + 3) / T) - %d : 'none'; })()" % dx)
    await A.evaluate("G.autoDoors.push({ tx: %d, ty: heights[%d] - 1, t: 5 });" % (dx, dx))
    await A.wait_for_timeout(1500)
    res['door stays open while the guest stands in it'] = [await A.evaluate("tileAt(%d, heights[%d] - 1) === DOORO" % (dx, dx)), await B.evaluate("tileAt(%d, heights[%d] - 1) === DOORO" % (dx, dx))]
    await B.evaluate("G.p.x = G.p.px = (%d - 4) * T; G.p.y = G.p.py = (heights[%d - 4] - 3) * T;" % (dx, dx))
    await A.wait_for_timeout(1500)
    res['door shuts once they step away'] = await A.evaluate("tileAt(%d, heights[%d] - 1) === DOORC" % (dx, dx))
    # a door shut on someone anyway (a race): they are nudged free
    await B.evaluate("(() => { const x = %d; G.p.x = G.p.px = x * T + 1; G.p.y = G.p.py = (heights[x] - 3) * T + 2; })()" % (dx + 1))
    await A.evaluate("""(() => { const x = %d, g = heights[x]; for (let y = g - 3; y < g; y++) setTile(x, y, STONE); })()""" % (dx + 1))
    await B.wait_for_timeout(800)
    res['guest nudged out of a block placed on them'] = await B.evaluate("!boxHits(G.p.x, G.p.y, G.p.w, G.p.h)")
    # ---- an explosion: the guest standing close feels it; a creature is hit once ----
    await B.evaluate("G.p.inv = 0; G.p.iDodge = 0; G.p.x = G.p.px = %d * T; G.p.y = G.p.py = (heights[%d] - 3) * T;" % (hx - 8, hx - 8))
    await A.evaluate("(() => { const x = %d, e = spawnMob('husk', x + 1, heights[x + 1]); e.hp = e.maxhp = 400; e.nid = COOP.nid++; window.HUSK = e; })()" % (hx - 8))
    await A.wait_for_timeout(900)
    hp0 = await B.evaluate("G.p.hp"); h0 = await A.evaluate("HUSK.hp")
    # the charge goes right beside the husk, wherever it has wandered, and the guest beside it too
    hk = await A.evaluate("floor((HUSK.x + HUSK.w / 2) / T)")
    await B.evaluate("G.p.x = G.p.px = %d * T; G.p.y = G.p.py = (heights[%d] - 3) * T;" % (hk + 2, hk + 2)); await A.wait_for_timeout(300)
    await A.evaluate("(() => { const x = %d - 1, y = heights[x] - 1; setTile(x, y, CHARGE); stnPlaced(x, y, CHARGE); STN.get(y * WW + x).fuse = 12; })()" % hk)
    await A.wait_for_timeout(2000)
    res['guest hurt by the host charge (hp before, after)'] = [hp0, await B.evaluate("G.p.hp")]
    res['husk hit once by it (hp before, after)'] = [h0, await A.evaluate("HUSK.hp")]
    await B.evaluate("G.p.inv = 999999;")
    # ---- a campfire the guest lays without flint: unlit for everyone ----
    await B.evaluate("(() => { for (let i = 0; i < inv.length; i++) if (inv[i] && ['flint', 'torch', 'cinder_gland'].includes(inv[i].id)) inv[i] = null; })()")
    fx = hx + 12
    await B.evaluate("(() => { const x = %d, y = heights[x] - 1; setTile(x, y, FIRE); stnPlaced(x, y, FIRE); })()" % fx)
    await A.wait_for_timeout(900)
    res['guest campfire fuel (guest, host)'] = [await B.evaluate("STN.get((heights[%d] - 1) * WW + %d).fuel" % (fx, fx)), await A.evaluate("(() => { const s = STN.get((heights[%d] - 1) * WW + %d); return s ? s.fuel : 'none'; })()" % (fx, fx))]
    # ---- a chest: one at a time ----
    cx = hx - 3
    await A.evaluate("(() => { const x = %d, y = heights[x] - 1; setTile(x, y, CHEST); stnPlaced(x, y, CHEST); STN.get(y * WW + x).items[0] = { id: 'iron_bar', n: 5 }; COOP.stns.add(y * WW + x); })()" % cx)
    await A.wait_for_timeout(700)
    await A.evaluate("G.p.x = G.p.px = %d * T; openStation(%d, heights[%d] - 1);" % (cx, cx, cx)); await A.wait_for_timeout(500)
    await B.evaluate("G.p.x = G.p.px = %d * T; G.says.length = 0; G.sayCur = null; openStation(%d, heights[%d] - 1);" % (cx + 1, cx, cx))
    res['guest blocked while the host has it open'] = [await B.evaluate("UI.open"), await B.evaluate("(G.sayCur && G.sayCur.text) || (G.says[0] && G.says[0].text) || ''")]
    await A.evaluate("closeUI();"); await A.wait_for_timeout(600)
    await B.evaluate("openStation(%d, heights[%d] - 1);" % (cx, cx))
    res['guest opens it after the host closes'] = await B.evaluate("UI.open === 'stn'")
    await B.evaluate("closeUI();"); await A.wait_for_timeout(400)
    # both at the very same moment: exactly one keeps it
    await asyncio.gather(A.evaluate("openStation(%d, heights[%d] - 1)" % (cx, cx)), B.evaluate("openStation(%d, heights[%d] - 1)" % (cx, cx)))
    await A.wait_for_timeout(900)
    res['same moment: open on host, on guest'] = [await A.evaluate("UI.open === 'stn'"), await B.evaluate("UI.open === 'stn'")]
    await A.evaluate("closeUI()"); await B.evaluate("closeUI()")
    # ---- the host switches to another window: the world keeps going for the guest ----
    t0 = await A.evaluate("G.time"); c0 = await B.evaluate("G.clock")
    await A.evaluate("window.__raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;")
    await A.wait_for_timeout(4000)
    t1 = await A.evaluate("G.time"); res['host world ticks while hidden (ticks in 4 s)'] = t1 - t0
    res['guest sees the host as away'] = await B.evaluate("(() => { const P = COOP.peers.get('h'); return !!(P && P.f && P.f.away); })()")
    res['guest still connected, clock moving'] = [await B.evaluate("COOP.joined && G.state"), round(await B.evaluate("G.clock") - c0, 5) != 0]
    res['hidden host is safe'] = await A.evaluate("G.p.inv > 0 && G.away")
    await A.evaluate("window.requestAnimationFrame = window.__raf; requestAnimationFrame(frame);"); await A.wait_for_timeout(800)
    res['host back: not away'] = [await A.evaluate("G.away"), await B.evaluate("(() => { const P = COOP.peers.get('h'); return !!(P && P.f && P.f.away); })()")]
    for k, v in res.items(): print(k, '=>', v)
    print('errors:', [e for e in errs if 'agent-proxy' not in e and 'favicon' not in e][:10])
    for b in (bA, bB): await b.close()
    await pw.stop()
asyncio.run(main())
