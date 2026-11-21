# The Ashfall online on claude.ai: two players meet in the room, share the island and the echoes, and hand the echoes over.
# The Ashfall online: two players meet in the claude.ai room (stood in for by the mock room),
# start a match, see the same island and the same echoes, hit echoes and each other, and the
# second player takes over the echoes when the leader leaves.
import asyncio, subprocess, time, io, os, sys
from playwright.async_api import async_playwright
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import sheet
async def main():
    srv = subprocess.Popen(['python3', '-m', 'http.server', '8766', '--bind', '127.0.0.1'], cwd=GAME_DIR, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)
    pw = await async_playwright().start()
    b = await pw.chromium.launch(headless=True, args=['--no-sandbox', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'], **CHROME)
    ctx = await b.new_context(viewport={'width': 960, 'height': 540}); await ctx.add_init_script(path=os.path.join(HELPERS, 'mock_room.js'))
    errs = []; res = {}
    async def page(name):
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(name + ' PAGEERROR: ' + str(e)))
        pg.on('console', lambda m: errs.append(name + ' ' + m.type + ': ' + m.text) if m.type == 'error' and 'favicon' not in m.text and '404' not in m.text else None)
        await pg.goto('http://127.0.0.1:8766/Emberwake.html'); await pg.wait_for_timeout(1500)
        await pg.evaluate("G.nick = %r; G.skin = 1; SETTINGS.diff = 'normal'; brLobbyEnter('room', 'brtest');" % name); return pg
    async def wait(pg, js, ms=15000):
        for i in range(ms // 100):
            if await pg.evaluate(js): return True
            await pg.wait_for_timeout(100)
        return False
    A = await page('ALPHA'); B = await page('BRAVO')
    await wait(A, "!!NET.me && BR.people.size >= 1"); await wait(B, "!!NET.me && BR.people.size >= 1")
    await A.wait_for_timeout(800)
    la, lb = await A.evaluate("[NET.me, BR.lead, BR.leaderId, BR.lobbyN]"), await B.evaluate("[NET.me, BR.lead, BR.leaderId, BR.lobbyN]")
    res['lobby A / B'] = [la, lb]
    L, F = (A, B) if la[1] else (B, A)
    res['countdown on the leader'] = await L.evaluate("BR.cdEnd ? Math.ceil((BR.cdEnd - performance.now()) / 1000) : -1")
    await L.evaluate("BR.startNow = true")
    okL = await wait(L, "G.state === 'play' && BR.phase === 'drop'"); okF = await wait(F, "G.state === 'play' && BR.phase === 'drop'")
    res['both in the match'] = [okL, okF]
    sig = "[BR.mi, BR.seed, BR.chests.map(c => c.x + ':' + c.y).join(',').length, BR.pois.map(q => q.name).join('/'), BR.ro.length, BR.nb]"
    res['same island'] = (await L.evaluate(sig)) == (await F.evaluate(sig)); res['island'] = await L.evaluate(sig)
    await F.wait_for_timeout(1500)
    res['echoes: leader local / follower ghosts'] = [await L.evaluate("[...BR.bots.values()].filter(f => !f.remote).length"), await F.evaluate("[...BR.bots.values()].filter(f => f.remote).length")]
    res['each sees the other'] = [await L.evaluate("[...NET.peers.values()].map(f => f.name).join(',')"), await F.evaluate("[...NET.peers.values()].map(f => f.name).join(',')")]
    res['clock'] = [await L.evaluate("BR.t"), await F.evaluate("BR.t")]
    # both leap and land
    await L.evaluate("pressed.Space = true"); await F.evaluate("pressed.Space = true")
    await wait(L, "!G.p.onBarge && G.p.onGround", 20000); await wait(F, "!G.p.onBarge && G.p.onGround", 20000)
    res['landed'] = [await L.evaluate("[round(G.p.x / T), G.p.onGround]"), await F.evaluate("[round(G.p.x / T), G.p.onGround]")]
    # the follower hits an echo (the leader decides the blow)
    await wait(F, "[...BR.bots.values()].some(f => !f.dead && !f.onBarge && !f.glide)", 25000)
    tag = await F.evaluate("(() => { const b = [...BR.bots.values()].find(f => !f.dead && !f.onBarge && !f.glide); return b ? b.botTag : null; })()")
    if tag:
        await L.evaluate("for (const f of BR.bots.values()) { f.ai = null; f.inv = 0; } 0")
        await L.evaluate("window.__bh = 0; const o = brBotHit; brBotHit = function (f, h) { window.__bh++; return o(f, h); }; 0")
        hp0 = await L.evaluate("BR.bots.get(%r).hp" % tag)
        for k in range(8):
            await F.evaluate("(() => { const b = BR.bots.get(%r); if (b && !b.dead) netHit(b, 22, 1, -1, false, 0, G.p); })()" % tag); await F.wait_for_timeout(250); await L.evaluate("BR.bots.get(%r).inv = 0" % tag)
        await F.wait_for_timeout(1200)
        res['echo hit from the follower: hp before, after (leader)'] = [hp0, await L.evaluate("(() => { const b = BR.bots.get(%r); return [round(b.hp), b.dead]; })()" % tag)]
        fid0 = await F.evaluate("NET.me")
        res['debug: F hits, L seen, L brBotHit calls, L bot'] = [await F.evaluate("JSON.stringify(NET.hits.slice(-3))"), await L.evaluate("JSON.stringify(NET.seen.get(%r))" % fid0), await L.evaluate("window.__bh"), await L.evaluate("(() => { const b = BR.bots.get(%r); return [b.hp, b.inv, b.noHit, b.onBarge, b.dead, b.state, b.remote, b.glide, BR.lead, BR.phase]; })()" % tag), await L.evaluate("(() => { const q = BR.people.get(%r); return q ? [q.mi === BR.mi, q.ph, (q.pres.hs || []).length] : null; })()" % fid0)]
        res['follower got the takedown'] = await F.evaluate("[G.p.kills, (G.kfeed[0] || {}).a, (G.kfeed[0] || {}).b, BR.bots.get(%r).dead]" % tag)
    # the leader takes the follower down
    fid = await F.evaluate("NET.me")
    for k in range(10):
        await L.evaluate("(() => { const f = NET.peers.get(%r); if (f && !f.dead) netHit(f, 30, 1, -1, false); })()" % fid); await L.wait_for_timeout(250)
    await F.wait_for_timeout(1500)
    res['follower down, placed'] = await F.evaluate("[G.p.dead, BR.place, BR.lastAlive]")
    res['leader saw it'] = await L.evaluate("[G.p.kills, BR.lastAlive, (NET.peers.get(%r) || {}).dead]" % fid)
    shots = [Image.open(io.BytesIO(await L.screenshot())), Image.open(io.BytesIO(await F.screenshot()))]
    # the leader leaves: the follower runs the echoes now
    await L.evaluate("brLeave(); window.__mockLeave && window.__mockLeave();")
    ok = await wait(F, "BR.lead && [...BR.bots.values()].every(f => !f.remote)", 8000)
    res['follower took over the echoes'] = [ok, await F.evaluate("[BR.leaderId === NET.me, [...BR.bots.values()].filter(f => !f.dead).length]")]
    await F.wait_for_timeout(2000)
    res['echoes still act'] = await F.evaluate("[...BR.bots.values()].filter(f => !f.dead).map(f => f.name + '@' + round(f.x / T)).slice(0, 4).join(' ')")
    for k, v in res.items(): print(k, '=>', v)
    sheet(shots, 2, shot('royale_online.png'), ['leader', 'follower'], .5)
    print('errors:', errs[:8])
    await b.close(); await pw.stop(); srv.terminate()
asyncio.run(main())
