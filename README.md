# Booboo's Town

A talking science, numbers and first-coding game for a very curious little one (built for ages 3–5+).
Booboo the pink monkey drives the pink car or the Mars rover around town and stops at buildings.

No build step, no tracking, no accounts. Plain HTML + SVG + JavaScript modules; works offline after the
first visit (service worker) and can be installed to the home screen.

## Buildings
- **Spider Spout:** the Itsy Bitsy Spider song, then the water cycle (evaporation, condensation,
  precipitation, collection), putting the cycle in order, rain-gauge maths (counting on, ±10, place
  value, adding tens, differences) and cause-and-effect questions.
- **Rainbow Lab:** a prism splits white light, paint the spectrum in order (Roy G. Biv), sort light
  waves by wavelength, mix red/green/blue light (red + green = yellow!), rainbow detective questions.
- **Space Center:** order planets by size (or from the Sun), rocky vs giant, "Who am I?" deduction
  riddles where each clue rules planets out, and a countdown launch (by ones or by tens).
- **Code mode** (in town): plan Booboo's route with arrow blocks and press Go. Bumps are "bugs" to
  debug; after two tries footprints show the way. Scientist level uses forward / turn left / turn right.
- **Big Words book:** every big word learned, tap to hear it again.
- Coming soon (construction sites): Garden Lab, Number Bakery, Train Station.

## Grown-ups
Press and **hold the ⚙ gear (bottom-left) for about a second**. Choose the challenge level
(Sprout ≈3, Explorer ≈4, Scientist ≈5+), voice, talking speed, sound effects, or reset progress.
Progress is stored only on the device.

## Run locally
Any static server, from this folder:
```
python -m http.server 8791
```
then open http://localhost:8791 . (Opening index.html directly from disk won't work: browsers block
JS modules on file://.) Testing shortcut: `#scene=spider` / `rainbow` / `space` / `town` in the URL.

## Code map
- `js/main.js` title screen, grown-ups panel, scene registry
- `js/town.js` the map, driving, Code mode, Big Words book
- `js/scenes/` one file per building
- `js/ui.js` shared pieces: answer tiles (`ask`), Big Word card, drag, finish screen
- `js/art.js` all drawings (Booboo, vehicles, buildings, planets) as SVG
- `js/run.js` the async scene runner; `js/speech.js` voice + captions; `js/audio.js` synthesized sounds
