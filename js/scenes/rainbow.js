import { el, txt, node, stage, ask, praise, bigWord, sceneButtons, attachGuide, finish, pulse, burst, drag, W, H } from '../ui.js';
import { booboFull, cloud } from '../art.js';
import { lv, byLv, shuffle, pick } from '../state.js';
import { sfx } from '../audio.js';
import { ease } from '../run.js';

const BANDS = [
  { k: 'red', name: 'Red', hex: '#f44336' }, { k: 'orange', name: 'Orange', hex: '#ff9800' }, { k: 'yellow', name: 'Yellow', hex: '#ffeb3b' },
  { k: 'green', name: 'Green', hex: '#4caf50' }, { k: 'blue', name: 'Blue', hex: '#2196f3' }, { k: 'indigo', name: 'Indigo', hex: '#3f51b5' },
  { k: 'violet', name: 'Violet', hex: '#9c27b0' },
];
const BY = Object.fromEntries(BANDS.map(b => [b.k, b]));

const DETECT = [
  { lv: 0, q: 'To see a rainbow, where should the sun be?', o: [{ icon: '☀️', label: 'Behind me', correct: true }, { icon: '☀️', label: 'In front of me' }], why: 'Rainbows appear when the sun is behind you and the rain is in front of you!' },
  { lv: 0, q: 'Which color is always on the outside, at the very top of a rainbow?', o: [{ icon: '🔴', label: 'Red', correct: true }, { icon: '🟣', label: 'Violet' }, { icon: '🟢', label: 'Green' }], why: 'Red is always on top. Then orange, yellow, green, blue, indigo, violet.' },
  { lv: 0, q: 'What two things do we need to make a rainbow?', o: [{ icon: '☀️🌧️', label: 'Sun and rain', correct: true, iconSize: 60 }, { icon: '🌙', label: 'The moon' }, { icon: '💨', label: 'Just wind' }], why: 'Sunlight shines through raindrops, and the colors split apart!' },
  { lv: 1, q: 'Can you see a rainbow at night, when the sun is down?', o: [{ icon: '🙅', label: 'No', correct: true }, { icon: '👍', label: 'Yes' }], why: 'Rainbows are made of sunlight. No sunlight, no rainbow!' },
  { lv: 1, q: 'Raindrops make rainbows in the sky. What are the raindrops acting like?', o: [{ icon: '🔺', label: 'Tiny prisms', correct: true }, { icon: '🎈', label: 'Balloons' }, { icon: '🍪', label: 'Cookies' }], why: 'Each raindrop bends the sunlight, just like our prism!' },
  { lv: 1, q: 'Sunlight looks white. What is it really made of?', o: [{ icon: '🌈', label: 'All the colors', correct: true }, { icon: '🟡', label: 'Only yellow' }, { icon: '⚪', label: 'Only white' }], why: 'White light is all the colors of the rainbow mixed together!' },
  { lv: 2, q: 'Which light has the SHORTEST waves?', o: [{ icon: '🟣', label: 'Violet', correct: true }, { icon: '🔴', label: 'Red' }, { icon: '🟢', label: 'Green' }], why: 'Violet has short, squished waves. Red has long, stretchy waves.' },
  { lv: 2, q: 'Rainbows need raindrops. Which part of the water cycle gives us raindrops?', o: [{ icon: '🌧️', label: 'Precipitation', correct: true }, { icon: '☀️', label: 'Evaporation' }, { icon: '☁️', label: 'Condensation' }], why: 'Precipitation! The Itsy Bitsy Spider house and the Rainbow Lab are connected!' },
  { lv: 2, q: 'You shine a flashlight into a glass of water and see colors. Why?', o: [{ icon: '↗️', label: 'Water bends the light', correct: true }, { icon: '🎨', label: 'Paint in the water' }, { icon: '✨', label: 'Magic glass' }], why: 'Water bends light. That is refraction, the same thing a prism does!' },
];

function wavePath(w, period, amp = 26) {
  let d = '';
  for (let x = 0; x <= w; x += 4) d += `${x ? 'L' : 'M'}${(x - w / 2).toFixed(1)} ${(Math.sin(x / period * Math.PI * 2) * amp).toFixed(1)}`;
  return d;
}

export async function rainbowScene(run) {
  const s = stage();
  const guideFor = parent => { const g = node(parent, 1500, 752); booboFull(g.inner, { s: .6 }); g.inner.classList.add('guide'); attachGuide(g.inner); return g; };

  /* ===== 1. the prism ===== */
  let root = el('g', {}, s);
  el('rect', { width: W, height: H, fill: '#1d2342' }, root);
  el('rect', { x: 0, y: 780, width: W, height: 120, fill: '#151a33' }, root);
  el('rect', { x: 0, y: 260, width: 60, height: 140, fill: '#fff9c4' }, root);
  el('rect', { x: 0, y: 250, width: 70, height: 160, fill: 'none', stroke: '#8d6e63', 'stroke-width': 10 }, root);
  txt(root, 120, 230, '☀️', 60, { class: 'emoji' });
  el('rect', { x: 1400, y: 110, width: 90, height: 600, rx: 14, fill: '#eceff1' }, root);
  txt(root, 1445, 740, 'wall', 26, { fill: '#9fa8da' });
  el('rect', { x: 300, y: 772, width: 280, height: 20, rx: 8, fill: '#8d6e63' }, root);
  const beam = el('polygon', { points: '60,300 1400,318 1400,342 60,360', fill: '#fffde7', opacity: .8 }, root);
  const spot = el('ellipse', { cx: 1404, cy: 330, rx: 10, ry: 26, fill: '#fff' }, root);
  const spec = el('g', { opacity: 0 }, root);
  BANDS.forEach((b, i) => {
    const y0 = 150 + i * 60;
    el('polygon', { points: `752,${322 + i * 3} 1400,${y0} 1400,${y0 + 60} 752,${325 + i * 3}`, fill: b.hex, opacity: .85 }, spec);
  });
  const prism = node(root, 440, 700);
  el('polygon', { points: '0,-72 -64,40 64,40', fill: 'rgba(225,245,254,.55)', stroke: '#b3e5fc', 'stroke-width': 6, 'stroke-linejoin': 'round' }, prism.inner);
  el('polygon', { points: '0,-50 -36,22 6,22', fill: '#fff', opacity: .25 }, prism.inner);
  txt(root, 440, 830, 'prism', 28, { fill: '#9fa8da' });
  guideFor(root);
  sceneButtons(run);

  await run.wait(300);
  await run.say('Welcome to the Rainbow Lab! Sunlight is shining through the window. It looks white, right?');
  await run.say('This clear glass shape is a prism. Drag the prism into the beam of light!');
  await drag(run, prism, [720, 330]);
  sfx.chime();
  beam.setAttribute('points', '60,300 690,322 690,346 60,360'); spot.remove();
  await run.anim(1200, t => spec.setAttribute('opacity', t), ease.out);
  burst(root, 1400, 380, 20);
  await run.say('Wow! White light went in, and a rainbow came out!');
  await bigWord(run, 'prism');
  await run.say('The prism bends the light. Each color bends a different amount, so the colors spread apart.');
  if (lv() > 0) await bigWord(run, 'refraction');
  await run.say('So white sunlight is secretly made of ALL the colors mixed together!');
  await bigWord(run, 'spectrum');
  root.remove();

  /* ===== 2. paint the rainbow in order ===== */
  root = el('g', {}, s);
  el('rect', { width: W, height: H, fill: '#bfe7ff' }, root);
  cloud(root, { x: 200, y: 600, s: 1.1 }); cloud(root, { x: 1400, y: 600, s: 1.1 });
  el('rect', { x: 0, y: 650, width: W, height: 250, fill: '#9ccc65' }, root);
  const CX = 800, CY = 650, R0 = 520, BW = 44;
  const arcs = BANDS.map((b, i) => {
    const r = R0 - i * BW;
    el('path', { d: `M${CX - r} ${CY} A${r} ${r} 0 0 1 ${CX + r} ${CY}`, fill: 'none', stroke: '#fff', 'stroke-width': BW - 6, opacity: .45 }, root);
    const len = Math.PI * r;
    return el('path', { d: `M${CX - r} ${CY} A${r} ${r} 0 0 1 ${CX + r} ${CY}`, fill: 'none', stroke: b.hex, 'stroke-width': BW - 2, 'stroke-dasharray': `${len} ${len}`, 'stroke-dashoffset': len }, root);
  });
  guideFor(root);
  sceneButtons(run);
  const pot = b => (g, w, h) => {
    el('ellipse', { cx: 0, cy: 30, rx: 50, ry: 16, fill: '#000', opacity: .1 }, g);
    el('path', { d: 'M-46 -30 L-40 30 Q0 44 40 30 L46 -30Z', fill: '#eceff1', stroke: '#b0bec5', 'stroke-width': 4 }, g);
    el('ellipse', { cx: 0, cy: -30, rx: 46, ry: 14, fill: b.hex, stroke: '#b0bec5', 'stroke-width': 4 }, g);
    txt(g, 0, h / 2 - 26, b.name, 26, { class: 'lbl', 'font-weight': 700 });
  };
  await run.say(lv() ? "Let's paint a rainbow! The colors always go in the same order. Red is on the outside. Can you remember what comes next?" : "Let's paint a rainbow! The colors always go in the same order. I'll tell you each one.");
  let remaining = BANDS.slice();
  for (let i = 0; i < BANDS.length; i++) {
    const b = BANDS[i];
    let opts = remaining;
    if (lv() === 0) opts = [b, ...shuffle(remaining.filter(x => x !== b)).slice(0, 2)];
    const prompt = i === 0 ? 'Red goes on the outside. Tap red!' : lv() === 0 ? `Next comes ${b.name.toLowerCase()}. Tap ${b.name.toLowerCase()}!` : pick(['What color comes next?', 'Which color is next?', 'And next?']);
    const r = await ask(run, {
      prompt, y: 690, tileW: lv() === 0 ? 200 : 168, tileH: 170, gap: 18,
      options: shuffle(opts).map(x => ({ draw: pot(x), correct: x === b })),
      hint: `It's ${b.name.toLowerCase()}! ${i ? `${BANDS[i - 1].name} then ${b.name.toLowerCase()}.` : ''}`,
    });
    remaining = remaining.filter(x => x !== b);
    sfx.pop();
    const len = Math.PI * (R0 - i * BW);
    await run.anim(700, t => arcs[i].setAttribute('stroke-dashoffset', len * (1 - t)), ease.out);
    if (r.misses === 0 && lv() > 0) run.say(b.name + '!');
  }
  burst(root, 800, 200, 30);
  await run.say('Red, orange, yellow, green, blue, indigo, violet! A whole rainbow!');
  if (lv() > 0) await run.say('Here is a secret trick to remember the order. The first letters make a funny name: Roy G Biv!');
  if (lv() === 2) {
    const r = await ask(run, {
      prompt: 'Brain teaser! Which color is between blue and violet?', y: 690, tileW: 200, tileH: 170,
      options: shuffle([BY.indigo, BY.green, BY.orange]).map(x => ({ draw: pot(x), correct: x.k === 'indigo' })), hint: 'Look at the rainbow! Find blue, then look next to it.',
    });
    await run.say(`${praise(r.misses)} Indigo! It's a deep, dark blue-purple.`);
  }
  root.remove();

  /* ===== 3. light waves ===== */
  root = el('g', {}, s);
  el('rect', { width: W, height: H, fill: '#1d2342' }, root);
  guideFor(root);
  sceneButtons(run);
  txt(root, 800, 150, 'Light travels in waves', 44, { fill: '#fff', 'font-weight': 700 });
  const demo = el('g', {}, root);
  el('path', { d: wavePath(900, 220, 40), transform: 'translate(800 280)', fill: 'none', stroke: '#f44336', 'stroke-width': 10, 'stroke-linecap': 'round' }, demo);
  el('path', { d: wavePath(900, 70, 40), transform: 'translate(800 430)', fill: 'none', stroke: '#9c27b0', 'stroke-width': 10, 'stroke-linecap': 'round' }, demo);
  txt(demo, 240, 280, 'Red', 32, { fill: '#ef9a9a', 'font-weight': 700, 'text-anchor': 'end' });
  txt(demo, 240, 430, 'Violet', 32, { fill: '#ce93d8', 'font-weight': 700, 'text-anchor': 'end' });
  await run.say('Light travels in wiggly waves, like ripples in a pond. Red light has long, stretchy waves.');
  await run.say('Violet light has short, squished waves. Our eyes see different wave sizes as different colors!');
  await bigWord(run, 'wavelength');
  demo.remove();
  const set = byLv(['red', 'violet'], ['red', 'green', 'violet'], ['red', 'yellow', 'blue', 'violet']).map(k => BY[k]);
  const PER = { red: 150, yellow: 112, green: 98, blue: 74, violet: 50 };
  const done = el('g', {}, root);
  await run.say(`Now you sort them! The waves have lost their colors. Tap the longest wave first.`);
  let rest = set.slice();
  for (let i = 0; i < set.length; i++) {
    const b = set[i];
    const r = await ask(run, {
      prompt: i === 0 ? 'Which wave is the longest?' : i === set.length - 1 ? 'And the last one is the shortest!' : 'Which is the longest now?',
      y: 560, tileW: rest.length > 3 ? 320 : 360, tileH: 170, gap: 22,
      options: shuffle(rest).map(x => ({ correct: x === b, bg: '#2a3160', stroke: '#5c6bc0', draw: (g, w) => el('path', { d: wavePath(w - 50, PER[x.k], 34), fill: 'none', stroke: '#e8eaf6', 'stroke-width': 8, 'stroke-linecap': 'round' }, g) })),
      hint: 'Look for the wave with the biggest, widest bumps.',
    });
    rest = rest.filter(x => x !== b);
    const y = 230 + i * 80;
    el('path', { d: wavePath(700, PER[b.k] * .8, 22), transform: `translate(820 ${y})`, fill: 'none', stroke: b.hex, 'stroke-width': 8, 'stroke-linecap': 'round', class: 'fadein' }, done);
    txt(done, 430, y, b.name, 30, { fill: b.hex, 'font-weight': 700, 'text-anchor': 'end' });
    await run.say(`${praise(r.misses)} That one is ${b.name.toLowerCase()}!`);
  }
  await run.say('Long waves are red, short waves are violet. Every color has its own wavelength!');
  root.remove();

  /* ===== 4. mixing light ===== */
  root = el('g', {}, s);
  el('rect', { width: W, height: H, fill: '#0e1124' }, root);
  const mix = el('g', { style: 'isolation:isolate' }, root);
  el('rect', { x: 430, y: 110, width: 740, height: 600, rx: 40, fill: '#000' }, mix);
  const LIGHTS = { r: { hex: '#ff0000', pos: [710, 340], name: 'Red' }, g: { hex: '#00ff00', pos: [890, 340], name: 'Green' }, b: { hex: '#0000ff', pos: [800, 500], name: 'Blue' } };
  const circ = {};
  for (const k in LIGHTS) circ[k] = el('circle', { cx: LIGHTS[k].pos[0], cy: LIGHTS[k].pos[1], r: 165, fill: LIGHTS[k].hex, style: 'mix-blend-mode:screen', opacity: 0 }, mix);
  const on = { r: false, g: false, b: false };
  const torches = ['r', 'g', 'b'].map((k, i) => {
    const n = node(root, 590 + i * 210, 800); n.inner.classList.add('tap');
    el('rect', { x: -80, y: -60, width: 160, height: 120, rx: 30, fill: '#263238', stroke: LIGHTS[k].hex, 'stroke-width': 6 }, n.inner);
    const lens = el('circle', { cx: 0, cy: -10, r: 30, fill: '#37474f', stroke: '#90a4ae', 'stroke-width': 4 }, n.inner);
    txt(n.inner, 0, 38, LIGHTS[k].name, 26, { fill: '#fff', 'font-weight': 700 });
    n.lens = lens; n.k = k;
    return n;
  });
  let want = '';
  const mark = () => torches.forEach(t => { t.inner.dataset.want = (want.includes(t.k) !== on[t.k]) ? '1' : ''; });
  const setLight = (k, v) => { on[k] = v; queueMicrotask(mark); circ[k].setAttribute('opacity', v ? 1 : 0); const t = torches.find(t => t.k === k); t.lens.setAttribute('fill', v ? LIGHTS[k].hex : '#37474f'); };
  const sw = node(root, 1340, 250);
  el('rect', { x: -120, y: -110, width: 240, height: 250, rx: 30, fill: '#1d2342', stroke: '#5c6bc0', 'stroke-width': 5 }, sw.inner);
  txt(sw.inner, 0, -76, 'Make this:', 28, { fill: '#fff', 'font-weight': 700 });
  const swatch = el('circle', { cx: 0, cy: 25, r: 70, fill: '#fff', stroke: '#fff', 'stroke-width': 4 }, sw.inner);
  guideFor(root);
  sceneButtons(run);
  await run.say("Here's a surprise. When you mix paint, colors get darker. But when you mix LIGHT, colors get brighter!");
  await run.say('Tap the flashlights to turn them on and off. Try it!');
  const TGT = {
    yellow: { set: 'rg', hex: '#ffff00', name: 'yellow', why: 'Red light plus green light makes YELLOW light! That surprises lots of grown-ups!', hint: 'Try red and green together!' },
    magenta: { set: 'rb', hex: '#ff00ff', name: 'magenta, a bright pinky purple', why: 'Red light plus blue light makes magenta!', hint: 'Try red and blue together!' },
    cyan: { set: 'gb', hex: '#00ffff', name: 'cyan, a bright sky blue', why: 'Green light plus blue light makes cyan!', hint: 'Try green and blue together!' },
    white: { set: 'rgb', hex: '#ffffff', name: 'white', why: 'All three together make WHITE light! Just like sunlight is all the colors mixed.', hint: 'Try turning on ALL the flashlights!' },
  };
  for (const tk of byLv(['yellow', 'white'], ['yellow', 'magenta', 'white'], ['yellow', 'cyan', 'magenta', 'white'])) {
    const t = TGT[tk]; want = t.set;
    ['r', 'g', 'b'].forEach(k => setLight(k, false));
    swatch.setAttribute('fill', t.hex); sw.inner.classList.remove('pop-in'); void sw.inner.getBoundingClientRect(); sw.inner.classList.add('pop-in');
    run.say(`Can you make ${t.name} light?`);
    let tries = 0;
    for (;;) {
      const i = await run.tapAny(torches.map(x => x.inner));
      const k = torches[i].k; sfx.click(); setLight(k, !on[k]); tries++;
      const cur = ['r', 'g', 'b'].filter(x => on[x]).join('');
      if (cur === t.set) break;
      if (tries === 4 || tries === 8) run.say(t.hint);
    }
    sfx.chime(); burst(root, 800, 400, 22);
    await run.wait(400);
    await run.say(t.why);
  }
  await run.say('Here is a secret: a TV or tablet screen makes every color using only tiny red, green and blue lights!');
  root.remove();

  /* ===== 5. rainbow detective ===== */
  root = el('g', {}, s);
  el('rect', { width: W, height: H, fill: '#bfe7ff' }, root);
  BANDS.forEach((b, i) => { const r = 380 - i * 26; el('path', { d: `M${800 - r} 520 A${r} ${r} 0 0 1 ${800 + r} 520`, fill: 'none', stroke: b.hex, 'stroke-width': 24, opacity: .7 }, root); });
  el('rect', { x: 0, y: 520, width: W, height: 380, fill: '#9ccc65' }, root);
  txt(root, 800, 210, '🔎 Rainbow Detective', 48, { fill: '#4a148c', 'font-weight': 700 });
  guideFor(root);
  sceneButtons(run);
  const L = lv();
  const qs = shuffle(DETECT.filter(q => q.lv <= L)).sort((a, b) => (b.lv === L) - (a.lv === L)).slice(0, byLv(2, 3, 3));
  await run.say('Time to be a rainbow detective!');
  for (const q of qs) {
    const r = await ask(run, { prompt: q.q, options: shuffle(q.o), y: 560, tileW: 300, tileH: 230 });
    await run.say(`${praise(r.misses)} ${q.why}`);
  }
  await finish(run, 'rainbow', 'You are a light scientist! Prisms, wavelengths, and mixing light!');
}
