# Where everything is, worked out from this file, so the tests run from any folder on any computer.
import os, pathlib
HELPERS = os.path.dirname(os.path.abspath(__file__))       # Source/tests/helpers
TESTS = os.path.dirname(HELPERS)                            # Source/tests
SOURCE = os.path.dirname(TESTS)                             # Source
GAME_DIR = os.path.dirname(SOURCE)                          # the Emberwake folder
GAME = os.path.join(GAME_DIR, 'Emberwake.html')             # the game, as Source/build.py makes it
GAME_URL = pathlib.Path(GAME).as_uri()
SCREENSHOTS = os.path.join(TESTS, 'screenshots')
# Google Chrome where it is installed in the usual Linux place; otherwise Playwright's own Chromium
CHROME = {'executable_path': '/usr/bin/google-chrome'} if os.path.exists('/usr/bin/google-chrome') else {}


def shot(name):
    """Where a test saves a picture: Source/tests/screenshots/<name>."""
    os.makedirs(SCREENSHOTS, exist_ok=True)
    return os.path.join(SCREENSHOTS, name)


if not os.path.exists(GAME):
    raise SystemExit('Build the game first:  python3 Source/build.py')
