"""Record every line Booboo can say with a natural neural voice (Microsoft Edge "Ava").

    python tools/voice.py                              # Jenny: record anything new (existing clips are kept)
    python tools/voice.py --voice en-US-AvaNeural      # Ava: same, into audio/voice/ava
    python tools/voice.py --list                       # just print what would be recorded
Each voice lives in audio/voice/<name>/ and can be picked in the game's Grown-ups panel
(add a new one to the pMode list in index.html).

It reads the game's JavaScript, pulls out every sentence, and every template like
`The gauge has ${a}.` as fixed pieces ("the gauge has") with a gap. Numbers 0-200 are recorded on
their own, so js/speech.js can stitch a line like "The gauge has 47." from clips at runtime.
Output: audio/voice/<name>/*.mp3 + audio/voice/<name>/index.json
"""
import argparse, asyncio, hashlib, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = None  # audio/voice/<short name>, e.g. audio/voice/jenny for en-US-JennyNeural


def voice_dir(voice: str) -> Path:
    short = re.sub(r'^[a-z]{2}-[A-Z]{2}-|Neural$|MultilingualNeural$', '', voice).lower()
    return ROOT / 'audio' / 'voice' / short
HOLE = '\u0001'


def norm(s: str) -> str:
    """MUST match norm() in js/speech.js"""
    s = s.lower().replace('’', "'").replace('‘', "'")
    s = re.sub(r"[^a-z0-9' ]+", ' ', s)
    s = re.sub(r"(^| )'+|'+( |$)", ' ', s)  # quotes, not apostrophes inside words
    return re.sub(r'\s+', ' ', s).strip()


def split_sentences(s: str):
    """MUST match splitSentences() in js/speech.js"""
    return [x for x in re.split(r'(?<=[.!?])\s+', s.strip()) if x.strip()]


# ---------- a small JS tokenizer: string literals + template literals ----------
def scan(src: str, out: list):
    i, n = 0, len(src)
    prev = ''  # last significant char, to tell a regex literal from division
    while i < n:
        c = src[i]
        if c == '/' and src.startswith('//', i):
            i = src.find('\n', i); i = n if i < 0 else i; continue
        if c == '/' and src.startswith('/*', i):
            j = src.find('*/', i + 2); i = n if j < 0 else j + 2; continue
        if c == '/' and (prev == '' or prev in '(,=:[!&|?{};+-*%<>~^'):
            j, cls = i + 1, False
            while j < n:
                if src[j] == '\\': j += 2; continue
                if src[j] == '[': cls = True
                elif src[j] == ']': cls = False
                elif src[j] == '/' and not cls: break
                elif src[j] == '\n': break
                j += 1
            i = j + 1; prev = 'a'; continue
        if c in '\'"':
            j, buf = i + 1, []
            while j < n and src[j] != c:
                if src[j] == '\\': buf.append(src[j + 1]); j += 2; continue
                buf.append(src[j]); j += 1
            out.append(('str', ''.join(buf)))
            i = j + 1; prev = 'a'; continue
        if c == '`':
            i, parts = read_template(src, i + 1, out)
            out.append(('tpl', parts)); prev = 'a'; continue
        if not c.isspace(): prev = c
        i += 1


def read_template(src, i, out):
    parts, buf = [], []
    n = len(src)
    while i < n:
        c = src[i]
        if c == '\\': buf.append(src[i + 1]); i += 2; continue
        if c == '`': parts.append(''.join(buf)); return i + 1, parts
        if c == '$' and i + 1 < n and src[i + 1] == '{':
            parts.append(''.join(buf)); buf = []
            depth, j = 1, i + 2
            start = j
            while j < n and depth:
                if src[j] in '\'"`':  # skip nested strings inside the expression
                    q = src[j]
                    if q == '`':
                        j, _ = read_template(src, j + 1, out); continue
                    j += 1
                    while j < n and src[j] != q:
                        j += 2 if src[j] == '\\' else 1
                    j += 1; continue
                if src[j] == '{': depth += 1
                elif src[j] == '}': depth -= 1
                j += 1
            scan(src[start:j - 1], out)  # strings used inside ${...}
            i = j; continue
        buf.append(c); i += 1
    return i, parts


SPEECHY = re.compile(r"[A-Za-z]")
NOT_SPEECH = re.compile(r"[#<>=_{}\[\]\\/@$()]|^[a-z][a-zA-Z-]*$|^[A-Za-z]\d+$|\w:\w|^M[-\d]|\.js$|\.png$|^https?:|·")


def is_speech(s: str) -> bool:
    s = s.strip()
    if len(s) < 2 or not SPEECHY.search(s) or NOT_SPEECH.search(s):
        return False
    if re.search(r'[←-⯿\U0001F000-\U0001FFFF]', s) and len(norm(s)) < 3:
        return False
    return True


def tts_text(fragment: str) -> str:
    t = fragment.strip().strip(',:;').strip()
    return t


def collect():
    tokens = []
    for f in sorted((ROOT / 'js').rglob('*.js')):
        scan(f.read_text(encoding='utf8'), tokens)
    clips = {}       # key -> text to speak
    templates = set()

    def add(text):
        k = norm(text)
        if k and k not in clips:
            clips[k] = tts_text(text)

    for kind, v in tokens:
        if kind == 'str':
            if is_speech(v):
                for sent in split_sentences(v):
                    add(sent)
                if len(split_sentences(v)) > 1:
                    add(v)
        else:
            pattern = HOLE.join(v)
            if not is_speech(pattern.replace(HOLE, ' ')) and len(v) == 1:
                continue
            for sent in split_sentences(pattern):
                if HOLE not in sent:
                    if is_speech(sent): add(sent)
                    continue
                pieces = sent.split(HOLE)
                keys = tuple(norm(p) for p in pieces)
                if not any(re.search('[a-z]', k) for k in keys):
                    continue
                if not all(is_speech(p) or not norm(p) or re.fullmatch(r"[\s\d.,!?'a-z]*", p) for p in pieces):
                    continue
                templates.add(keys)
                for p in pieces:
                    if norm(p): add(p)
    for k in range(0, 201):
        clips[str(k)] = str(k)
    for w in ['and', 'or', 'then', 'white', 'yellow', 'cyan', 'magenta', 'red', 'green', 'blue']:
        clips.setdefault(w, w)
    # templates that are mostly code (css, svg paths) slip through rarely: keep ones with real words
    templates = sorted((t for t in templates if sum(len(x) for x in t) >= 2), key=lambda t: -sum(len(x) for x in t))
    return clips, templates


async def record(clips, voice, rate, fresh):
    import edge_tts
    OUT.mkdir(parents=True, exist_ok=True)
    files = {}
    todo = []
    for k, text in clips.items():
        name = hashlib.sha1(f'{voice}|{rate}|{text}'.encode()).hexdigest()[:12] + '.mp3'
        files[k] = name
        if fresh or not (OUT / name).exists():
            todo.append((text, name))
    sem = asyncio.Semaphore(8)
    done = 0

    async def one(text, name):
        nonlocal done
        async with sem:
            for attempt in range(4):
                try:
                    await edge_tts.Communicate(text, voice, rate=rate).save(str(OUT / name))
                    break
                except Exception as e:
                    if attempt == 3: print('FAILED', text, e, file=sys.stderr)
                    await asyncio.sleep(1.5 * (attempt + 1))
            done += 1
            if done % 50 == 0: print(f'  {done}/{len(todo)}')
    print(f'recording {len(todo)} new clips ({len(clips) - len(todo)} already there)')
    await asyncio.gather(*(one(t, n) for t, n in todo))
    return files


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--voice', default='en-US-JennyNeural')
    ap.add_argument('--rate', default='-6%')
    ap.add_argument('--list', action='store_true')
    ap.add_argument('--fresh', action='store_true')
    a = ap.parse_args()
    global OUT
    OUT = voice_dir(a.voice)
    clips, templates = collect()
    if a.list:
        for k, t in clips.items():
            if not k.isdigit(): print(repr(t))
        print('--- templates'); [print(t) for t in templates]
        print(len(clips), 'clips,', len(templates), 'templates'); return
    files = asyncio.run(record(clips, a.voice, a.rate, a.fresh))
    keep = set(files.values())
    for f in OUT.glob('*.mp3'):
        if f.name not in keep: f.unlink()
    (OUT / 'index.json').write_text(json.dumps({'voice': a.voice, 'clips': files, 'templates': [list(t) for t in templates]}, separators=(',', ':')), encoding='utf8')
    print('wrote', OUT / 'index.json', len(files), 'clips', len(templates), 'templates')


if __name__ == '__main__':
    main()
