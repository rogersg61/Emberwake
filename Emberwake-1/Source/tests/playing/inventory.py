# Moving things in and out of the pack with the real mouse: drag between slots, drag out to drop,
# shift-click between hotbar and pack, [G] to drop, and TAKE ALL / STORE ALL at a chest.
import asyncio, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from where import GAME_URL, GAME_DIR, HELPERS, CHROME, shot
from harness import H, sheet
async def main():
    h = await H().start(seed=777)
    pg = h.pg
    await h.ev("G.cine = null; G.dialog = null; G.says.length = 0; G.sayCur = null; inv.fill(null); inv[0] = { id: 'sword', n: 1 }; inv[12] = { id: 'log', n: 7 }; inv[13] = { id: 'rock', n: 20 }; inv[2] = { id: 'stick', n: 5 }; G.p.inv = 1e9;")
    await h.ev("UI.open = 'inv'; render(1);"); await h.step(2, "")
    async def slot_xy(i):
        return await h.ev("(() => { const L = invLayout(), x = L.gx + (%d %% 10) * 19 + 9, y = L.gy + floor(%d / 10) * 19 + 9, cv = document.getElementById('c'), r = cv.getBoundingClientRect(), k = VS.ui * r.width / cv.width; return [r.left + x * k, r.top + y * k]; })()" % (i, i))
    async def drag(a, b):
        await pg.mouse.move(*a); await pg.mouse.down(); await h.step(2, ""); await pg.mouse.move((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); await pg.mouse.move(*b); await h.step(1, ""); await pg.mouse.up(); await h.step(2, "")
    res = {}
    # drag the logs from the pack (slot 13) onto the hotbar (slot 4)
    await drag(await slot_xy(12), await slot_xy(4))
    res['drag pack to hotbar'] = await h.ev("[inv[12], inv[4] && inv[4].id + 'x' + inv[4].n, !!UI.held]")
    # drag the rocks out of the window area: they fall into the world
    n0 = await h.ev("G.drops.length"); a = await slot_xy(13)
    await drag(a, (a[0], 40)); await h.step(5, "")
    res['drag out drops it'] = await h.ev("[inv[13], G.drops.length - %d, G.drops.length ? G.drops[G.drops.length - 1].id : '']" % n0)
    # shift-click the sticks from the hotbar into the pack
    p = await slot_xy(2); await pg.keyboard.down('Shift'); await pg.mouse.click(*p); await pg.keyboard.up('Shift'); await h.step(2, "")
    res['shift-click hotbar to pack'] = await h.ev("[inv[2], inv.findIndex((s, i) => i >= hotN() && s && s.id === 'stick')]")
    # a plain click still picks up and a second click places
    await pg.mouse.click(*(await slot_xy(0))); held = await h.ev("UI.held && UI.held.id"); await pg.mouse.click(*(await slot_xy(9))); await h.step(1, "")
    res['click, click'] = [held, await h.ev("inv[9] && inv[9].id"), await h.ev("!!UI.held")]
    ims = [await h.shot()]
    # [G] drops one from the selected hotbar slot, shift+G the stack
    await h.ev("closeUI(); G.sel = 4;"); await h.step(2, "")
    await pg.keyboard.press('g'); await h.step(3, ""); one = await h.ev("inv[4] ? inv[4].n : 0")
    await pg.keyboard.down('Shift'); await pg.keyboard.press('g'); await pg.keyboard.up('Shift'); await h.step(3, "")
    res['[G] one, shift+G all'] = [one, await h.ev("inv[4]")]
    # a chest: take all, store all
    await h.ev("(() => { const p = G.p, tx = floor((p.x + 3) / T) + 2, ty = floor((p.y + p.h - 1) / T); setTile(tx, ty, CHEST); const st = stnState(ty * WW + tx, CHEST); st.items = new Array(20).fill(null); st.items[0] = { id: 'copper_ore', n: 9 }; st.items[5] = { id: 'berries', n: 4 }; window.__ch = [tx, ty]; inv[15] = { id: 'dirt', n: 30 }; inv[16] = { id: 'sand', n: 12 }; openStation(tx, ty); })()")
    await h.step(2, "")
    ims.append(await h.shot())
    await h.ev("chestTakeAll(stnState(window.__ch[1] * WW + window.__ch[0], CHEST))")
    res['take all'] = await h.ev("[countItem('copper_ore'), countItem('berries'), stnState(window.__ch[1] * WW + window.__ch[0], CHEST).items.filter(Boolean).length]")
    await h.ev("chestStoreAll(stnState(window.__ch[1] * WW + window.__ch[0], CHEST))")
    res['store all (keeps the hotbar)'] = await h.ev("[countItem('dirt'), countItem('sand'), inv.slice(0, hotN()).filter(Boolean).length, stnState(window.__ch[1] * WW + window.__ch[0], CHEST).items.filter(Boolean).length]")
    for k, v in res.items(): print(k, '=>', v)
    sheet(ims, 2, shot('inventory.png'), ['pack', 'chest'], .6)
    print('errors:', [e for e in h.errs if 'agent-proxy' not in e][:6])
    await h.stop()
asyncio.run(main())
