# Booboo's Town

A talking science, numbers and first-coding game for a very curious little one (built for ages 3–5+).
Booboo the pink monkey drives the pink car or the Mars rover around town and stops at buildings.

No build step, no tracking, no accounts. Plain HTML + SVG + JavaScript modules; works offline after the
first visit (service worker) and can be installed to the home screen.

## Buildings
- **Itsy Bitsy Spider:** the Itsy Bitsy Spider song, then the water cycle (evaporation, condensation,
  precipitation, collection), putting the cycle in order, rain-gauge maths (counting on, ±10, place
  value, adding tens, differences) and cause-and-effect questions.
- **Rainbow Lab:** a prism splits white light, paint the spectrum in order (Roy G. Biv), sort light
  waves by wavelength, mix red/green/blue light (red + green = yellow!), rainbow detective questions.
- **Space Center:** order planets by size (or from the Sun), rocky vs giant, "Who am I?" deduction
  riddles where each clue rules planets out, and a countdown launch (by ones or by tens).
- **Code mode** (in town): plan Booboo's route with arrow blocks and press Go. Bumps are "bugs" to
  debug; after two tries footprints show the way. Scientist level uses forward / turn left / turn right.
- **Big Words book:** every big word learned, tap to hear it again.
- **Garden Lab:** what a seed needs (germination), order the sunflower life cycle, tap the parts of a
  plant (roots, stem, leaves, flower), photosynthesis and oxygen, a bee carrying pollen to the right
  kind of flower (pollination), and a growth chart (counting on by tens, differences, adding 15).
- **Number Bakery:** deal cupcakes in turns to share fairly (division; "more friends = fewer each"),
  fair halves and quarters (fractions; is a half or a quarter bigger?), boxes of cupcakes (skip
  counting, groups = multiplication), and putting a recipe in order, then fixing a buggy recipe.
- **Train Station:** pattern trains (AB, AAB, ABBC, gap in the middle), number trains (by 2s, 5s, 10s,
  backwards), IF/THEN rules (traffic light; "IF it has wings: blue carriage", with a penguin to test
  the rule), and loops ("repeat chug, chug, toot 3 times: how many chugs?").

## Grown-ups
Press and **hold the ⚙ gear (bottom-left) for about a second**. Choose the challenge level
(Sprout ≈3, Explorer ≈4, Scientist ≈5+), voice, talking speed, sound effects, or reset progress.
Progress is stored only on the device.

## Voices
Every line is pre-recorded with natural Microsoft neural voices (via `edge-tts`), stitched together at
runtime for lines with numbers. Two voices ship: **Jenny** (default) and **Ava**, switchable in Grown-ups,
plus the device's own voice. After changing any text in the game, record the new lines:
```
pip install edge-tts
python tools/voice.py                           # Jenny  -> audio/voice/jenny
python tools/voice.py --voice en-US-AvaNeural   # Ava    -> audio/voice/ava
```

## Run locally
Any static server, from this folder:
```
python -m http.server 8791
```
then open http://localhost:8791 . (Opening index.html directly from disk won't work: browsers block
JS modules on file://.) Testing shortcut: `#scene=spider` / `rainbow` / `space` / `garden` / `bakery` / `trains` / `town` in the URL.

## Code map
- `js/main.js` title screen, grown-ups panel, scene registry
- `js/town.js` the map, driving, Code mode, Big Words book
- `js/scenes/` one file per building
- `js/ui.js` shared pieces: answer tiles (`ask`), Big Word card, drag, finish screen
- `js/art.js` all drawings (Booboo, vehicles, buildings, planets) as SVG
- `js/run.js` the async scene runner; `js/speech.js` voice + captions; `js/audio.js` synthesized sounds
