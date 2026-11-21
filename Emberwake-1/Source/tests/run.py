#!/usr/bin/env python3
# Runs the tests and says which ones had trouble.
#
#   python3 run.py                      every group (takes about half an hour)
#   python3 run.py together             one group: playing, world, other-worlds, fighting, together, battle-royale
#   python3 run.py together/relay.py    one test
#
# Each test prints what it saw; read its lines to judge the results. This runner flags a test
# that crashed, or whose game page reported an error.
import os, subprocess, sys, time

TESTS = os.path.dirname(os.path.abspath(__file__))
GROUPS = ['playing', 'world', 'other-worlds', 'fighting', 'together', 'battle-royale']


def pick(args):
    out = []
    for a in args or GROUPS:
        p = os.path.join(TESTS, a)
        if os.path.isdir(p):
            out += sorted(os.path.join(p, f) for f in os.listdir(p) if f.endswith('.py'))
        elif os.path.isfile(p) or os.path.isfile(p + '.py'):
            out.append(p if os.path.isfile(p) else p + '.py')
        else:
            sys.exit('There is no test or group called %r. The groups are: %s' % (a, ', '.join(GROUPS)))
    return out


def main():
    tests, trouble = pick(sys.argv[1:]), []
    for i, t in enumerate(tests, 1):
        name = os.path.relpath(t, TESTS)
        print('\n=== [%d/%d] %s' % (i, len(tests), name), flush=True)
        t0 = time.time()
        try:
            r = subprocess.run([sys.executable, t], capture_output=True, text=True, timeout=900)
            text, code = r.stdout + r.stderr, r.returncode
        except subprocess.TimeoutExpired:
            text, code = 'took longer than 15 minutes; stopped', 1
        print(text.rstrip())
        bad = code != 0 or 'PAGEERROR' in text or 'Traceback' in text
        print('--- %s: %s in %ds' % (name, 'TROUBLE' if bad else 'ran', time.time() - t0), flush=True)
        if bad:
            trouble.append(name)
    if trouble:
        print('\n%d of %d had trouble: %s' % (len(trouble), len(tests), ', '.join(trouble)))
    else:
        print('\nAll %d ran without crashes or page errors.' % len(tests))
    sys.exit(1 if trouble else 0)


if __name__ == '__main__':
    main()
