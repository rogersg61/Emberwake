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
        first_account_id = await h.ev("ACCOUNT.active.id")
        migrated = await h.ev("[SAVE.list.some(m => m.id === 'legacy'), !!LS.get(profileKey('w.legacy'))]")
        password_not_stored = await h.ev("!LS.get('ew2.accounts').includes('ember-wake-123')")
        friend_added = await h.ev("friendAdd('Alice', 'abc-123')")
        invalid_friend_code_rejected = await h.ev("friendAdd('Bob', 'short') === false")
        friend_updated = await h.ev("friendAdd('Alice Updated', 'ABC123')")
        saved_friend = await h.ev("friendList()")
        friend_rewards = await h.ev("[ACCOUNT.active.coins, ACCOUNT.active.achievements.slice().sort()]")
        await h.ev("G.state = 'friends'; render(1);")
        friends_screen_draws = await h.ev("G.state === 'friends' && HITS.length > 0")
        await h.ev("G.state = 'customize'; UI.customTab = 'shop'; render(1);")
        shop_screen_draws = await h.ev("G.state === 'customize' && HITS.length > 0")
        await h.ev("UI.customTab = 'achievements'; render(1);")
        achievements_screen_draws = await h.ev("UI.customTab === 'achievements' && HITS.length > 0")
        await h.ev("""createWorld({name:'Saved world',seed:'account-test',size:0,shape:0,mode:0,skin:1});""")
        await h.pg.wait_for_timeout(500)
        await h.ev("G.manual=true; if (G.state === 'intro') beginPlay(true); addItem('flask', 5); saveWorld(true);")
        world = await h.ev("({id:WORLD.id, meta:SAVE.list.find(m => m.id === WORLD.id), items:countItem('flask')})")
        await h.ev("accountLogout()")
        reloaded_out = await h.ev("G.state === 'accounts' && ACCOUNT.active === null")
        await h.pg.reload(); await h.pg.wait_for_timeout(500)
        signed_out_after_reload = await h.ev("G.state === 'accounts' && ACCOUNT.active === null")
        wrong_password = await h.ev("(async()=>await accountLogin(ACCOUNT.profiles.find(p => p.name === 'Waker'), 'wrong-password'))()")
        correct_login = await h.ev("(async()=>await accountLoginByName('waker', 'ember-wake-123'))()")
        world_found = await h.ev("SAVE.list.some(m => m.id === %r)" % world['id'])
        await h.ev("(async()=>await openWorld(SAVE.list.find(m => m.id === %r)) )()" % world['id'])
        await h.pg.wait_for_timeout(500)
        await h.ev("G.manual=true; if (G.state === 'intro') beginPlay(false);")
        restored_items = await h.ev("countItem('flask')")
        friend_join = await h.ev("""(() => {
          const original = sigJoin; let attempted = '';
          try {
            sigJoin = code => { attempted = code; };
            G.state = 'friends'; joinFriendWorld(friendList()[0]);
            return [G.state, FORM.gcode, FORM.nick, FORM.skin, attempted];
          } finally { sigJoin = original; }
        })()""")
        reward_idempotence = await h.ev("""(() => {
          G.kills = 5;
          checkAchievements();
          const progressSaved = ACCOUNT.active.worldKills[WORLD.id] === 5;
          G.kills = 10;
          checkAchievements();
          const first = ACCOUNT.active.coins;
          checkAchievements();
          return [first, ACCOUNT.active.coins, ACCOUNT.active.achievements.includes('hunter_10'), progressSaved];
        })()""")
        cosmetic_purchase = await h.ev("""(() => {
          const bought = cosmeticBuy('skin', 2);
          const equipped = cosmeticEquip('skin', 2);
          return [bought, equipped, ACCOUNT.active.coins, ACCOUNT.active.skin, cosmeticOwned('skin', 2)];
        })()""")
        await h.ev("accountSwitch(%r)" % first_account_id)
        cosmetic_persisted = await h.ev("ACCOUNT.active.skin === 2 && cosmeticOwned('skin', 2) && ACCOUNT.active.coins === 0")
        second_created = await h.ev("(async()=>await accountCreate('Another', 'another-pass-123', 'another-pass-123', 0, 0))()")
        second_account_id = await h.ev("ACCOUNT.active.id")
        second_has_no_worlds = await h.ev("SAVE.list.length === 0")
        second_has_no_friends = await h.ev("friendList().length === 0")
        await h.ev("accountSwitch(%r)" % first_account_id)
        first_friend_restored = await h.ev("friendList().length === 1 && friendList()[0].name === 'Alice Updated'")
        friend_removed = await h.ev("friendRemove('ABC123') && friendList().length === 0")
        guest_migration = await h.ev("""(() => {
          WORLD.id = 'friend-save-world';
          LS.set('ew2.guest.friend-save-world', JSON.stringify({ inv: [['flask', 2]] }));
          guestLoad();
          const moved = LS.get(guestKey()) !== null && LS.get('ew2.guest.friend-save-world') === null;
          COOP.role = 'guest'; COOP.joined = true; guestSave(); COOP.role = null; COOP.joined = false;
          return [moved, countItem('flask'), LS.get(guestKey()) !== null];
        })()""")
        await h.ev("accountSwitch(%r)" % second_account_id)
        guest_save_isolated = await h.ev("LS.get(guestKey()) === null")
        checks = {
            'starts signed out': initial == ['accounts', True],
            'rejects short password': too_short is False,
            'creates account': created is True,
            'migrates guest saves': migrated == [True, True],
            'does not store plaintext password': password_not_stored is True,
            'awards friend and migrated-world achievements once': friend_rewards[0] == 30 and {'friend', 'first_world'}.issubset(set(friend_rewards[1])),
            'saves world and inventory': world['meta']['name'] == 'Saved world' and world['items'] == 5,
            'signs out immediately': reloaded_out is True,
            'signs out after reload': signed_out_after_reload is True,
            'rejects wrong password': wrong_password is False,
            'logs in with correct password': correct_login is True,
            'restores account world': world_found is True,
            'restores saved item': restored_items == 5,
            'saves a friend under the current profile': friend_added and friend_updated and saved_friend == [{'name': 'Alice Updated', 'code': 'ABC123'}],
            'rejects invalid friend code': invalid_friend_code_rejected is True,
            'draws the friends screen': friends_screen_draws is True,
            'draws customization and achievements screens': shop_screen_draws is True and achievements_screen_draws is True,
            'joins saved friend with current account name and skin': friend_join == ['join', 'ABC123', 'WAKER', 1, 'ABC123'],
            'rewards kills once and purchases/equips cosmetics': reward_idempotence == [50, 50, True, True] and cosmetic_purchase == [True, True, 0, 2, True] and cosmetic_persisted is True,
            'keeps other profile separate': second_created is True and second_has_no_worlds is True and second_has_no_friends is True,
            'restores and removes a profile friend': first_friend_restored is True and friend_removed is True,
            'migrates and saves a guest pack by account': guest_migration == [True, 2, True] and guest_save_isolated is True
        }
        print(checks)
        assert all(checks.values()), 'One or more account/save checks failed.'
        print('errors:', h.errs[:8] or 'none')
    finally:
        await h.stop()

asyncio.run(main())
