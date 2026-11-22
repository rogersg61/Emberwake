# Accounts require a password, start signed out, and keep each profile's worlds separate.
import asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'helpers'))
from harness import H

async def main():
    h = await H().start(mode='none')
    try:
        initial = await h.ev("[G.state, ACCOUNT.active === null]")
        too_short = await h.ev("(async()=>await accountCreate('Waker', 'short', 'short', 0, 0))()")
        await h.ev("""localStorage.setItem('ew2.index', JSON.stringify([{id:'legacy',name:'Old world'}]));
          localStorage.setItem('ew2.w.legacy', JSON.stringify({id:'legacy',name:'Old world',savedAt:1}));""")
        created = await h.ev("(async()=>await accountCreate('Waker', 'ember-wake-123', 'ember-wake-123', 1, 0))()")
        migrated = await h.ev("[SAVE.list.some(m => m.id === 'legacy'), !!LS.get(profileKey('w.legacy'))]")
        password_not_stored = await h.ev("!LS.get('ew2.accounts').includes('ember-wake-123')")
        await h.ev("""createWorld({name:'Saved world',seed:'account-test',size:0,shape:0,mode:0,skin:1});""")
        await h.pg.wait_for_timeout(500)
        await h.ev("G.manual=true; if (G.state === 'intro') beginPlay(true); addItem('flask', 5); saveWorld(true);")
        world = await h.ev("({id:WORLD.id, meta:SAVE.list.find(m => m.id === WORLD.id), items:countItem('flask')})")
        await h.ev("accountLogout()")
        reloaded_out = await h.ev("G.state === 'accounts' && ACCOUNT.active === null")
        await h.pg.reload(); await h.pg.wait_for_timeout(500)
        signed_out_after_reload = await h.ev("G.state === 'accounts' && ACCOUNT.active === null")
        wrong_password = await h.ev("(async()=>await accountLogin(ACCOUNT.profiles.find(p => p.name === 'Waker'), 'wrong-password'))()")
        correct_login = await h.ev("(async()=>await accountLogin(ACCOUNT.profiles.find(p => p.name === 'Waker'), 'ember-wake-123'))()")
        world_found = await h.ev("SAVE.list.some(m => m.id === %r)" % world['id'])
        await h.ev("(async()=>await openWorld(SAVE.list.find(m => m.id === %r)) )()" % world['id'])
        await h.pg.wait_for_timeout(500)
        await h.ev("G.manual=true; if (G.state === 'intro') beginPlay(false);")
        restored_items = await h.ev("countItem('flask')")
        second_created = await h.ev("(async()=>await accountCreate('Another', 'another-pass-123', 'another-pass-123', 0, 0))()")
        second_has_no_worlds = await h.ev("SAVE.list.length === 0")
        checks = {
            'starts signed out': initial == ['accounts', True],
            'rejects short password': too_short is False,
            'creates account': created is True,
            'migrates guest saves': migrated == [True, True],
            'does not store plaintext password': password_not_stored is True,
            'saves world and inventory': world['meta']['name'] == 'Saved world' and world['items'] == 5,
            'signs out immediately': reloaded_out is True,
            'signs out after reload': signed_out_after_reload is True,
            'rejects wrong password': wrong_password is False,
            'logs in with correct password': correct_login is True,
            'restores account world': world_found is True,
            'restores saved item': restored_items == 5,
            'keeps other profile separate': second_created is True and second_has_no_worlds is True
        }
        print(checks)
        assert all(checks.values()), 'One or more account/save checks failed.'
        print('errors:', h.errs[:8] or 'none')
    finally:
        await h.stop()

asyncio.run(main())
