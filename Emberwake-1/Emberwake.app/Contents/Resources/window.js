// Emberwake for macOS: opens the game in a window of its own, drawn by the
// WebKit engine that ships with macOS, so no browser is needed.
// Run by the app's launcher as:  osascript -l JavaScript window.js <game.html> <icon.icns>
// If the native window cannot be made, the game opens in a browser window instead.
ObjC.import('Cocoa');
ObjC.import('WebKit');

var keep = []; // objects the script must hold on to while the app runs

function shq(s) { return "'" + String(s).replace(/'/g, "'\\''") + "'"; }

function openInBrowser(game) {
  var me = Application.currentApplication(); me.includeStandardAdditions = true;
  var url = 'file://' + encodeURI(game), fm = $.NSFileManager.defaultManager, home = $.NSHomeDirectory().js;
  var apps = ['Google Chrome', 'Microsoft Edge', 'Brave Browser', 'Chromium'];
  for (var i = 0; i < apps.length; i++) {
    var found = ['/Applications/', home + '/Applications/'].some(function (d) { return fm.fileExistsAtPath(d + apps[i] + '.app'); });
    if (!found) continue;
    // its own profile, so the game keeps its saves and opens as a plain window without tabs
    var data = home + '/Library/Application Support/Emberwake/' + apps[i];
    me.doShellScript('open -na ' + shq(apps[i]) + ' --args --app=' + shq(url) + ' --user-data-dir=' + shq(data) + ' --window-size=1280,800');
    return;
  }
  me.doShellScript('open ' + shq(game));
}

function menuItem(title, action, key, mods) {
  var it = $.NSMenuItem.alloc.initWithTitleActionKeyEquivalent(title, action, key || '');
  if (mods) it.setKeyEquivalentModifierMask(mods);
  return it;
}

function openWindow(game, icon) {
  var app = $.NSApplication.sharedApplication;
  try { $.NSProcessInfo.processInfo.setProcessName('Emberwake'); } catch (e) { }
  app.setActivationPolicy(0); // a normal app: Dock icon and menu bar
  if (icon) { var img = $.NSImage.alloc.initWithContentsOfFile(icon); if (img && !img.isNil()) app.setApplicationIconImage(img); }

  // menu bar: Emberwake (hide, quit) and Window (full screen, minimise, close)
  var CMD = 1 << 20, CTRL = 1 << 18;
  var bar = $.NSMenu.alloc.init;
  var appItem = $.NSMenuItem.alloc.init; bar.addItem(appItem);
  var appMenu = $.NSMenu.alloc.initWithTitle('Emberwake');
  appMenu.addItem(menuItem('Hide Emberwake', 'hide:', 'h'));
  appMenu.addItem($.NSMenuItem.separatorItem);
  appMenu.addItem(menuItem('Quit Emberwake', 'terminate:', 'q'));
  appItem.setSubmenu(appMenu);
  // Edit: so copy and paste work in the game's text boxes (invite codes, chat)
  var editItem = $.NSMenuItem.alloc.init; bar.addItem(editItem);
  var editMenu = $.NSMenu.alloc.initWithTitle('Edit');
  editMenu.addItem(menuItem('Undo', 'undo:', 'z'));
  editMenu.addItem(menuItem('Redo', 'redo:', 'Z'));
  editMenu.addItem($.NSMenuItem.separatorItem);
  editMenu.addItem(menuItem('Cut', 'cut:', 'x'));
  editMenu.addItem(menuItem('Copy', 'copy:', 'c'));
  editMenu.addItem(menuItem('Paste', 'paste:', 'v'));
  editMenu.addItem(menuItem('Select All', 'selectAll:', 'a'));
  editItem.setSubmenu(editMenu);
  var winItem = $.NSMenuItem.alloc.init; bar.addItem(winItem);
  var winMenu = $.NSMenu.alloc.initWithTitle('Window');
  winMenu.addItem(menuItem('Enter Full Screen', 'toggleFullScreen:', 'f', CMD | CTRL));
  winMenu.addItem(menuItem('Minimize', 'performMiniaturize:', 'm'));
  winMenu.addItem(menuItem('Close', 'performClose:', 'w'));
  winItem.setSubmenu(winMenu);
  app.setMainMenu(bar); app.setWindowsMenu(winMenu);

  // closing the window quits the game
  ObjC.registerSubclass({
    name: 'EmberwakeAppDelegate',
    methods: { 'applicationShouldTerminateAfterLastWindowClosed:': { types: ['bool', ['id']], implementation: function (sender) { return true; } } }
  });
  var del = $.EmberwakeAppDelegate.alloc.init; keep.push(del); app.setDelegate(del);

  // the window: 1280 x 800, or 90% of a smaller screen
  var vf = $.NSScreen.mainScreen.visibleFrame;
  var w = Math.min(1280, Math.floor(vf.size.width * 0.9)), h = Math.min(800, Math.floor(vf.size.height * 0.9));
  var win = $.NSWindow.alloc.initWithContentRectStyleMaskBackingDefer($.NSMakeRect(0, 0, w, h), 1 | 2 | 4 | 8, 2, false);
  win.setTitle('Emberwake'); win.setMinSize($.NSMakeSize(720, 450)); win.setCollectionBehavior(1 << 7); win.setReleasedWhenClosed(false);
  win.setBackgroundColor($.NSColor.colorWithSRGBRedGreenBlueAlpha(14 / 255, 11 / 255, 20 / 255, 1));
  win.center;

  var cfg = $.WKWebViewConfiguration.alloc.init;
  try { cfg.setMediaTypesRequiringUserActionForPlayback(0); } catch (e) { }
  // playing together uses WebRTC data channels, which the Mac web view keeps switched off unless asked
  try { cfg.preferences._setPeerConnectionEnabled(true); } catch (e) { }
  try { cfg.preferences._setICECandidateFilteringEnabled(false); } catch (e) { }
  // with friends in your world it must keep running when the window is hidden or minimised
  try { cfg.preferences._setHiddenPageDOMTimerThrottlingEnabled(false); } catch (e) { }
  try { cfg.preferences._setHiddenPageDOMTimerThrottlingAutoIncreases(false); } catch (e) { }
  try { cfg.preferences._setPageVisibilityBasedProcessSuppressionEnabled(false); } catch (e) { }
  // and macOS should not nap the app (the screen may still sleep)
  try { keep.push($.NSProcessInfo.processInfo.beginActivityWithOptionsReason(0x00EFFFFF, 'Keeping a shared world running')); } catch (e) { }
  var web = $.WKWebView.alloc.initWithFrameConfiguration($.NSMakeRect(0, 0, w, h), cfg);
  web.setAutoresizingMask(2 | 16);
  try { web.setValueForKey(false, 'drawsBackground'); } catch (e) { }
  win.setContentView(web); keep.push(win, web, cfg);
  var url = $.NSURL.fileURLWithPath(game);
  web.loadFileURLAllowingReadAccessToURL(url, url.URLByDeletingLastPathComponent);

  win.makeKeyAndOrderFront(null); win.makeFirstResponder(web);
  app.activateIgnoringOtherApps(true);
  app.run;
}

function run(argv) {
  var game = argv[0], icon = argv[1];
  try { openWindow(game, icon); }
  catch (e) { try { openInBrowser(game); } catch (e2) { } }
}
