#!/usr/bin/env python3
# Builds everything in the Emberwake folder from what is in Source:
#
#   ../Emberwake.html        the game: every file in game/, joined in order into one page
#   ../Emberwake Guide.html  the guide: the chapters in guide/, with their pictures, in one page
#   ../Emberwake.app         the Mac app: the pieces in mac/ wrapped around the game
#
#   python3 build.py           build all three
#   python3 build.py --game    only the game (quickest, while working on it)
#   python3 build.py --no-app  the game and the guide
#
# Needs only Python 3. If Node.js is installed, the game's code is also syntax-checked.
import base64, datetime, html, os, re, shutil, stat, subprocess, sys, tempfile

SOURCE = os.path.dirname(os.path.abspath(__file__))
TOP = os.path.dirname(SOURCE)                      # the Emberwake folder
GAME_DIR, GUIDE_DIR, MAC_DIR = (os.path.join(SOURCE, d) for d in ('game', 'guide', 'mac'))
OUT_GAME = os.path.join(TOP, 'Emberwake.html')
OUT_GUIDE = os.path.join(TOP, 'Emberwake Guide.html')
OUT_APP = os.path.join(TOP, 'Emberwake.app')
# names some old code defines twice on purpose would go here; there are none now, so keep it that way
ALLOWED_TWICE = set()


def by_number(name):
    """Sort '2-art' before '10-interface': by the number at the front, then the name."""
    m = re.match(r'(\d+)', name)
    return (int(m.group(1)) if m else 1 << 30, name)


def game_files():
    """Every .js file under game/, folders in number order, files in number order inside each."""
    out = []
    for folder in sorted(os.listdir(GAME_DIR), key=by_number):
        path = os.path.join(GAME_DIR, folder)
        if not os.path.isdir(path):
            continue
        for f in sorted(os.listdir(path), key=by_number):
            if f.endswith('.js'):
                out.append(os.path.join(path, f))
    return out


def check_names(files):
    """The game is one big script: a name defined twice silently replaces the first. Refuse that."""
    seen, twice = {}, []
    pat = re.compile(r'^(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(|^(?:const|let|var|class)\s+([A-Za-z0-9_$]+)')
    for path in files:
        for n, line in enumerate(open(path, encoding='utf-8'), 1):
            m = pat.match(line)
            if not m:
                continue
            name = m.group(1) or m.group(2)
            here = os.path.relpath(path, GAME_DIR) + ':' + str(n)
            if name in seen and name not in ALLOWED_TWICE:
                twice.append(f'  {name}: {seen[name]} and {here}')
            seen.setdefault(name, here)
    return twice


PAGE = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Emberwake</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
html,body{margin:0;height:100%;background:#0e0b14;overflow:hidden}
canvas{display:block;width:100vw;height:100vh;image-rendering:pixelated;image-rendering:crisp-edges;cursor:none;outline:none;touch-action:none;user-select:none}
</style>
</head>
<body>
<canvas id="c" tabindex="0"></canvas>
<script>
{{GAME}}
</script>
</body>
</html>
'''


def build_game():
    files = game_files()
    twice = check_names(files)
    if twice:
        sys.exit('These names are defined in two places (the second would silently replace the first):\n' + '\n'.join(twice))
    # the version players see on the title screen and when two games can't play together
    version = datetime.date.today().strftime('%Y.%m.%d')
    js = "const GAME_VERSION = '%s';\n" % version + '\n'.join(open(p, encoding='utf-8').read() for p in files)
    if shutil.which('node'):
        with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8') as t:
            t.write(js)
        r = subprocess.run(['node', '--check', t.name], capture_output=True, text=True)
        os.unlink(t.name)
        if r.returncode:
            sys.exit('The game code has a syntax error:\n' + r.stderr.replace(t.name, 'game'))
    page = PAGE.replace('{{GAME}}', js)
    open(OUT_GAME, 'w', encoding='utf-8').write(page)
    print(f'game   Emberwake.html  (version {version}: {len(files)} files, {js.count(chr(10)) + 1} lines, {len(page) // 1024} KB)')
    return page


# ---------------- the guide: a little Markdown, turned into one page ----------------
def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def inline(s):
    codes = []
    s = re.sub(r'`([^`]+)`', lambda m: codes.append(m.group(1)) or '\x00%d\x00' % (len(codes) - 1), s)
    s = html.escape(s, quote=False)
    s = re.sub(r'\*\*(.+?)\*\*', r'<b>\1</b>', s)
    s = re.sub(r'(?<![\w*])\*(?=\S)(.+?)(?<=\S)\*(?![\w*])', r'<i>\1</i>', s)
    s = re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', r'<a href="\2">\1</a>', s)
    return re.sub('\x00(\\d+)\x00', lambda m: '<code>' + html.escape(codes[int(m.group(1))], quote=False) + '</code>', s)


def picture(src, alt):
    path = os.path.join(GUIDE_DIR, src)
    if not os.path.exists(path):
        print('  (missing picture: %s)' % src)
        return ''
    kind = 'jpeg' if src.lower().endswith(('.jpg', '.jpeg')) else 'png'
    data = base64.b64encode(open(path, 'rb').read()).decode()
    return f'<figure><img src="data:image/{kind};base64,{data}" alt="{html.escape(alt)}"><figcaption>{inline(alt)}</figcaption></figure>'


def blocks(text, toc):
    lines, out, i = text.split('\n'), [], 0
    starts = re.compile(r'^(#{1,4}\s|```|!\[|\||\s*[-*]\s+|\s*\d+\.\s+|>\s?)')
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.startswith('```'):
            j = i + 1
            while j < len(lines) and not lines[j].startswith('```'):
                j += 1
            out.append('<pre><code>' + html.escape('\n'.join(lines[i + 1:j])) + '</code></pre>')
            i = j + 1
            continue
        m = re.match(r'^(#{1,4})\s+(.*)', line)
        if m:
            level, title = len(m.group(1)), m.group(2).strip()
            anchor = slug(title)
            if level <= 2:
                toc.append((level, title, anchor))
            out.append(f'<h{level} id="{anchor}">{inline(title)}</h{level}>')
            i += 1
            continue
        m = re.match(r'^!\[([^\]]*)\]\(([^)]+)\)\s*$', line)
        if m:
            out.append(picture(m.group(2), m.group(1)))
            i += 1
            continue
        if line.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].startswith('|'):
                cells = [c.strip() for c in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r':?-{3,}:?', c) for c in cells):
                    rows.append(cells)
                i += 1
            head, body = rows[0], rows[1:]
            out.append('<table><thead><tr>' + ''.join(f'<th>{inline(c)}</th>' for c in head) + '</tr></thead><tbody>'
                       + ''.join('<tr>' + ''.join(f'<td>{inline(c)}</td>' for c in r) + '</tr>' for r in body) + '</tbody></table>')
            continue
        m = re.match(r'^\s*([-*]|\d+\.)\s+', line)
        if m:
            tag = 'ol' if m.group(1)[0].isdigit() else 'ul'
            items = []
            while i < len(lines) and lines[i].strip():
                if re.match(r'^\s*([-*]|\d+\.)\s+', lines[i]):
                    items.append(re.sub(r'^\s*([-*]|\d+\.)\s+', '', lines[i]))
                elif items:
                    items[-1] += ' ' + lines[i].strip()
                i += 1
            out.append(f'<{tag}>' + ''.join(f'<li>{inline(t)}</li>' for t in items) + f'</{tag}>')
            continue
        if line.startswith('>'):
            body = []
            while i < len(lines) and lines[i].startswith('>'):
                body.append(lines[i][1:].strip())
                i += 1
            out.append('<div class="tip">' + inline(' '.join(body)) + '</div>')
            continue
        para = []
        while i < len(lines) and lines[i].strip() and not (para and starts.match(lines[i])):
            para.append(lines[i].strip())
            i += 1
        out.append('<p>' + inline(' '.join(para)) + '</p>')
    return '\n'.join(out)


GUIDE = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Emberwake Guide</title>
<style>
:root{--bg:#0e0b14;--panel:#16121f;--line:#3d3a52;--text:#e8edf2;--soft:#b9bdd0;--gold:#ffd35a;--ember:#ff8a3d;--sea:#8ff5e6}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
a{color:var(--sea)}
header{padding:48px 24px 28px;text-align:center;background:radial-gradient(ellipse at 50% 120%,#3a1d16 0%,var(--bg) 70%);border-bottom:1px solid var(--line)}
header h1{margin:0;font:700 44px/1 Menlo,Consolas,monospace;letter-spacing:10px;color:var(--gold);text-shadow:0 0 18px rgba(255,138,61,.45),3px 3px 0 #5a2418}
header p{margin:12px 0 0;color:var(--soft)}
.wrap{display:flex;max-width:1180px;margin:0 auto;gap:36px;padding:28px 24px 80px}
nav{flex:0 0 230px;position:sticky;top:20px;align-self:flex-start;max-height:calc(100vh - 40px);overflow:auto;font-size:14px}
nav .t{color:var(--gold);font:700 12px Menlo,Consolas,monospace;letter-spacing:2px;margin:0 0 8px}
nav a{display:block;color:var(--soft);text-decoration:none;padding:3px 8px;border-left:2px solid transparent}
nav a.l1{color:var(--text);font-weight:600;margin-top:10px}
nav a.l2{padding-left:18px;font-size:13px}
nav a:hover{color:var(--gold);border-left-color:var(--ember)}
main{flex:1;min-width:0;max-width:780px}
section{margin-bottom:56px}
h1,h2,h3,h4{line-height:1.25}
main h1{font:700 28px Menlo,Consolas,monospace;letter-spacing:3px;color:var(--gold);margin:0 0 18px;padding-bottom:10px;border-bottom:2px solid #5a2418;text-transform:uppercase}
main h2{color:var(--ember);font-size:21px;margin:34px 0 10px}
main h3{color:var(--sea);font-size:17px;margin:24px 0 8px}
b{color:#fff1a8}
code{font:14px Menlo,Consolas,monospace;background:#241d33;border:1px solid var(--line);border-radius:4px;padding:1px 5px;color:#ffe2b8}
pre{background:#120f1a;border:1px solid var(--line);border-radius:6px;padding:12px 14px;overflow:auto}
pre code{background:none;border:0;padding:0}
table{border-collapse:collapse;width:100%;margin:14px 0;font-size:15px}
th,td{border:1px solid var(--line);padding:6px 10px;text-align:left;vertical-align:top}
th{background:var(--panel);color:var(--gold)}
tr:nth-child(even) td{background:#120f1a}
ul,ol{padding-left:24px}
li{margin:5px 0}
figure{margin:20px 0}
figure img{display:block;width:100%;border:2px solid var(--line);border-radius:6px;image-rendering:pixelated}
figcaption{color:var(--soft);font-size:14px;margin-top:6px;text-align:center}
.tip{background:var(--panel);border-left:3px solid var(--sea);padding:10px 14px;border-radius:0 6px 6px 0;margin:14px 0;color:var(--soft)}
footer{text-align:center;color:#6a6485;font-size:13px;padding:0 0 30px}
@media (max-width:860px){.wrap{display:block}nav{position:static;max-height:none;margin-bottom:28px;columns:2}}
</style>
</head>
<body>
<header><h1>EMBERWAKE</h1><p>Guide: how to play, playing together, the battle royale, and what's new</p></header>
<div class="wrap">
<nav><p class="t">CONTENTS</p>
{{NAV}}
</nav>
<main>
{{MAIN}}
</main>
</div>
<footer>Open Emberwake.app or Emberwake.html to play.</footer>
</body>
</html>
'''


def build_guide():
    chapters = sorted((f for f in os.listdir(GUIDE_DIR) if f.endswith('.md')), key=by_number)
    toc, sections = [], []
    for f in chapters:
        sections.append('<section>\n' + blocks(open(os.path.join(GUIDE_DIR, f), encoding='utf-8').read(), toc) + '\n</section>')
    nav = '\n'.join(f'<a class="l{lv}" href="#{a}">{inline(t)}</a>' for lv, t, a in toc)
    page = GUIDE.replace('{{NAV}}', nav).replace('{{MAIN}}', '\n'.join(sections))
    open(OUT_GUIDE, 'w', encoding='utf-8').write(page)
    print(f'guide  Emberwake Guide.html  ({len(chapters)} chapters, {len(page) // 1024} KB)')


# ---------------- the Mac app ----------------
def build_app(page):
    if os.path.exists(OUT_APP):
        shutil.rmtree(OUT_APP)
    contents = os.path.join(OUT_APP, 'Contents')
    res = os.path.join(contents, 'Resources')
    os.makedirs(os.path.join(res, 'game'))
    os.makedirs(os.path.join(contents, 'MacOS'))
    shutil.copy(os.path.join(MAC_DIR, 'Info.plist'), os.path.join(contents, 'Info.plist'))
    open(os.path.join(contents, 'PkgInfo'), 'w').write('APPL????')
    exe = os.path.join(contents, 'MacOS', 'Emberwake')
    shutil.copy(os.path.join(MAC_DIR, 'launcher.sh'), exe)
    os.chmod(exe, os.stat(exe).st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
    for f in ('window.js', 'Emberwake.icns'):
        shutil.copy(os.path.join(MAC_DIR, f), os.path.join(res, f))
    open(os.path.join(res, 'game', 'index.html'), 'w', encoding='utf-8').write(page)
    print('app    Emberwake.app')


if __name__ == '__main__':
    args = set(sys.argv[1:])
    page = build_game()
    if '--game' not in args:
        build_guide()
        if '--no-app' not in args:
            build_app(page)
