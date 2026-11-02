import { el, txt, node, stage, ask, praise, bigWord, sceneButtons, attachGuide, finish, moveTo, pulse, burst, drag, W, H } from '../ui.js';
import { spider, cloud, sun, booboFull, flower } from '../art.js';
import { state, lv, byLv, rand, pick, shuffle } from '../state.js';
import { sfx, melody } from '../audio.js';

// The Itsy Bitsy Spider tune (traditional, public domain), one phrase per tap.
const TUNE = {
  climb: [['G4', 'C5', 'C5', 'C5', 'D5', 'E5', 'E5'], ['E5', 'D5'], ['C5', 'D5', 'E5'], ['C5']],
  rain: ['E5', 'E5', 'F5', 'G5', 'G5', 'F5', 'E5', 'F5', 'G5', 'E5'],
  sun: ['C5', 'C5', 'D5', 'E5', 'E5', 'D5', 'C5', 'D5', 'E5', 'C5'],
  again: ['G4', 'G4', 'C5', 'C5', 'C5', 'D5', 'E5', 'E5', 'E5', 'D5', 'C5', 'D5', 'E5', 'C5'],
};
import { ease } from '../run.js';

/* falling rain inside a box; returns stop() which lets the last drops finish */
export function rain(run, parent, { x0, x1, y0, y1, n = 40, speed = 950, color = '#4fc3f7' }) {
  const g = el('g', { 'pointer-events': 'none' }, parent);
  let on = true;
  const drops = Array.from({ length: n }, () => ({ d: el('line', { stroke: color, 'stroke-width': 5, 'stroke-linecap': 'round', opacity: .9 }, g), x: x0 + Math.random() * (x1 - x0), y: y0 - Math.random() * (y1 - y0) }));
  const stop = run.loop(dt => {
    let alive = 0;
    for (const q of drops) {
      if (q.dead) continue;
      q.y += speed * dt;
      if (q.y > y1) { if (on) { q.y = y0; q.x = x0 + Math.random() * (x1 - x0); } else { q.dead = true; q.d.remove(); continue; } }
      alive++;
      const vis = q.y >= y0;
      q.d.setAttribute('x1', q.x); q.d.setAttribute('x2', q.x - 4);
      q.d.setAttribute('y1', vis ? q.y : -99); q.d.setAttribute('y2', vis ? q.y + 22 : -99);
    }
    if (!on && !alive) { stop(); g.remove(); }
  });
  return () => { on = false; };
}
export function wisp(parent, x, y, s = 1) {
  const g = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, parent);
  el('path', { d: 'M0 0 c-14 -14 14 -26 0 -40 c-14 -14 14 -26 0 -40', fill: 'none', stroke: '#fff', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: .9 }, g);
  return g;
}
function riseWisp(run, parent, x, y) {
  const w = wisp(parent, x, y, .8);
  const dx = (Math.random() - .5) * 60;
  run.anim(1800, t => { w.setAttribute('transform', `translate(${x + dx * t} ${y - 260 * t}) scale(.8)`); w.setAttribute('opacity', 1 - t); }, ease.out).catch(() => {}).finally(() => w.remove());
}
const mixHex = (a, b, t) => '#' + [0, 2, 4].map(i => Math.round(parseInt(a.substr(i + 1, 2), 16) * (1 - t) + parseInt(b.substr(i + 1, 2), 16) * t).toString(16).padStart(2, '0')).join('');

/* ---------- rain gauge maths ---------- */
function distractors(ans, prefer) {
  const swap = ans >= 10 && ans % 11 ? (ans % 10) * 10 + Math.floor(ans / 10) : -1;
  const pool = [...new Set([...(prefer || []), ans + 1, ans - 1, ans + 10, ans - 10, swap])].filter(v => v >= 0 && v <= 100 && v !== ans);
  return shuffle([ans, ...shuffle(pool).slice(0, 2)]);
}
function problems() {
  const L = lv(), out = [];
  if (L === 0) {
    const a = rand(15, 38);
    out.push({ type: 'add', start: a, n: 1, q: `The rain gauge has ${a}. One more drop falls in. How many now?`, ans: a + 1, prefer: [a + 2, a - 1] });
    const t = rand(1, 5) * 10;
    out.push({ type: 'add', start: t, n: 10, q: `Each big drop is ten! The gauge has ${t}. Count by tens. Ten more makes...?`, ans: t + 10, prefer: [t + 1, t + 20] });
    const x = rand(12, 19), y = x + rand(5, 9);
    out.push({ type: 'compare', a: x, b: y, q: `Spider Town got ${x} drops of rain. Booboo Town got ${y}. Which town got more rain?` });
  } else if (L === 1) {
    const a = rand(21, 79);
    out.push({ type: 'add', start: a, n: 10, q: `The gauge has ${a}. Ten more falls in. How many now?`, ans: a + 10, prefer: [a + 1, a + 20] });
    const b = rand(31, 89);
    out.push({ type: 'sub', start: b, n: 10, q: `The gauge has ${b}. The sun evaporates ten away! How many are left?`, ans: b - 10, prefer: [b - 1, b + 10] });
    let d1 = rand(2, 8), d2 = rand(1, 8); if (d1 === d2) d2 = d1 - 1;
    const x = d1 * 10 + d2, y = d2 * 10 + d1;
    out.push({ type: 'compare', a: Math.min(x, y), b: Math.max(x, y), q: `Spider Town got ${x} rain. Booboo Town got ${y}. Which town got more?`, swap: x > y });
  } else {
    const a = rand(13, 49), n = pick([20, 30]);
    out.push({ type: 'add', start: a, n, q: `The gauge has ${a}. Then ${n} more rain falls. How much now?`, ans: a + n, prefer: [a + n - 10, a + n + 10, a + n + 1] });
    const b = rand(21, 64), m = rand(3, 8);
    out.push({ type: 'add', start: b, n: m, q: `The gauge has ${b}. ${m} more drops fall in. How many now?`, ans: b + m, prefer: [b + m - 1, b + m + 1, b + m + 10] });
    const lo = rand(1, 4) * 10, hi = lo + rand(2, 5) * 10;
    out.push({ type: 'diff', a: lo, b: hi, q: `On Monday the gauge had ${lo}. On Tuesday it had ${hi}. How much MORE rain on Tuesday?`, ans: hi - lo, prefer: [hi - lo + 10, hi - lo - 10, hi] });
  }
  return out;
}

/* ---------- thinking questions ---------- */
const THINK = [
  { lv: 0, q: 'One puddle is in the sunshine. One puddle is in the shade. Which one dries up first?', o: [{ icon: '☀️', label: 'Sunny puddle', correct: true }, { icon: '🌳', label: 'Shady puddle' }], why: 'The sun\'s heat makes water evaporate faster!' },
  { lv: 0, q: 'When should the spider climb the spout, so she doesn\'t get washed out?', o: [{ icon: '☀️', label: 'Sunny day', correct: true }, { icon: '🌧️', label: 'Rainy day' }], why: 'No rain, no washing out. Smart spider!' },
  { lv: 0, q: 'Clouds get too full of water drops. What happens?', o: [{ icon: '🌧️', label: 'It rains', correct: true }, { icon: '🌙', label: 'It gets dark' }, { icon: '🌈', label: 'A rainbow' }], why: 'Heavy clouds let the water fall. Precipitation!' },
  { lv: 1, q: 'Your cold cup gets wet on the OUTSIDE. Where did those drops come from?', o: [{ icon: '💨', label: 'Water vapor in the air', correct: true }, { icon: '🥤', label: 'Leaked through the cup' }, { icon: '✨', label: 'Magic' }], why: 'The cold cup cooled the water vapor in the air, and it turned into drops. Condensation!' },
  { lv: 1, q: 'Where does rain go after it lands?', o: [{ icon: '🌊', label: 'Rivers, lakes and the ocean', correct: true }, { icon: '🚀', label: 'Into space' }, { icon: '🕳️', label: 'It disappears' }], why: 'It collects! Then the sun evaporates it again. Round and round.' },
  { lv: 1, q: 'It is freezing cold up in the cloud and down on the ground. What falls?', o: [{ icon: '❄️', label: 'Snow', correct: true }, { icon: '🍂', label: 'Leaves' }, { icon: '🌧️', label: 'Warm rain' }], why: 'When it\'s freezing, precipitation falls as snow!' },
  { lv: 2, q: 'If the sun stopped shining, what part of the water cycle would stop first?', o: [{ icon: '☀️', label: 'Evaporation', correct: true }, { icon: '🌊', label: 'Collection' }, { icon: '🌧️', label: 'Precipitation' }], why: 'The sun\'s heat is what makes water evaporate. No sun, no evaporation, and soon no new clouds!' },
  { lv: 2, q: 'Wet clothes hang outside on a windy, sunny day. Do they dry fast or slow?', o: [{ icon: '💨', label: 'Fast', correct: true }, { icon: '🐌', label: 'Slow' }], why: 'Sun warms the water and wind carries the vapor away. Super evaporation!' },
  { lv: 2, q: 'Is the water you drink today maybe the SAME water a dinosaur drank long ago?', o: [{ icon: '🦕', label: 'Yes!', correct: true }, { icon: '🙅', label: 'No way' }], why: 'Yes! The water cycle keeps using the same water over and over, for millions of years!' },
];

export async function spiderScene(run) {
  const s = stage();
  const defs = el('defs', {}, s);
  const g1 = el('linearGradient', { id: 'spSky', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: 0, 'stop-color': '#8fd3ff' }, g1); el('stop', { offset: 1, 'stop-color': '#e3f6ff' }, g1);

  const root = el('g', {}, s);
  el('rect', { width: W, height: H, fill: 'url(#spSky)' }, root);
  const sunN = node(root, 1300, 720); sun(sunN.inner, { s: .9 });
  el('path', { d: 'M0 700 Q400 650 800 690 T1600 680 L1600 900 L0 900Z', fill: '#8bc34a' }, root);
  el('rect', { x: 0, y: 760, width: W, height: 140, fill: '#7cb342' }, root);
  [[80, 800], [700, 820], [900, 790], [1380, 820], [1050, 840]].forEach(([x, y], i) => flower(root, x, y, ['#ff80ab', '#ffd54f', '#ce93d8', '#ff8a65', '#80deea'][i]));
  // house + spout
  el('rect', { x: 170, y: 262, width: 380, height: 440, fill: '#fff3e0', stroke: '#e0c9a6', 'stroke-width': 6 }, root);
  el('polygon', { points: '140,264 360,118 580,264', fill: '#ff8a65', stroke: '#e6704d', 'stroke-width': 6, 'stroke-linejoin': 'round' }, root);
  el('rect', { x: 210, y: 330, width: 120, height: 110, rx: 12, fill: '#bbdefb', stroke: '#e0c9a6', 'stroke-width': 6 }, root);
  el('line', { x1: 270, y1: 330, x2: 270, y2: 440, stroke: '#e0c9a6', 'stroke-width': 5 }, root);
  el('rect', { x: 380, y: 520, width: 100, height: 182, rx: 10, fill: '#a1887f' }, root);
  el('circle', { cx: 462, cy: 612, r: 7, fill: '#ffd54f' }, root);
  el('rect', { x: 140, y: 256, width: 470, height: 16, rx: 8, fill: '#90a4ae' }, root);
  el('rect', { x: 560, y: 262, width: 34, height: 430, rx: 8, fill: '#90a4ae' }, root);
  el('rect', { x: 566, y: 262, width: 8, height: 430, fill: '#b0bec5' }, root);
  el('path', { d: 'M560 670 Q560 708 600 708 L650 708 L650 676 L600 676 Q594 676 594 670Z', fill: '#90a4ae' }, root);
  txt(root, 360, 215, 'Itsy Bitsy Spider', 34, { fill: '#fff', 'font-weight': 700, stroke: '#e6704d', 'stroke-width': 1 });
  const puddle = el('ellipse', { cx: 700, cy: 716, rx: 0, ry: 0, fill: '#64b5f6', opacity: .9 }, root);
  const pond = el('ellipse', { cx: 990, cy: 732, rx: 0, ry: 0, fill: '#64b5f6', opacity: .9 }, root);
  const fx = el('g', {}, root);
  const spi = node(root, 577, 650); spider(spi.inner, { s: .9 });
  const guide = node(root, 1490, 742); booboFull(guide.inner, { s: .62 }); guide.inner.classList.add('guide');
  attachGuide(guide.inner);
  sceneButtons(run);

  /* ===== 1. the song ===== */
  await run.wait(300);
  await run.say("Let's sing the Itsy Bitsy Spider! Tap the spider to help her climb up the water spout.");
  const lines = ['The itsy bitsy spider', 'climbed up', 'the water', 'spout!'], ys = [560, 470, 380, 300];
  for (let i = 0; i < 4; i++) {
    pulse(spi.inner);
    await run.tap(spi.inner);
    pulse(spi.inner, false); melody(TUNE.climb[i], 280);
    const sp = run.say(lines[i]);
    await moveTo(spi, 577, ys[i], 650, run, ease.out);
    if (i === 3) await sp;
  }
  const cl = node(root, 420, -150); cloud(cl.inner, { s: 1.1, fill: '#b0bec5' });
  await moveTo(cl, 420, 110, 900, run, ease.out);
  await run.say('Uh oh! A rain cloud. Tap the cloud!');
  pulse(cl.inner); await run.tap(cl.inner); pulse(cl.inner, false);
  sfx.rain(3.2); melody(TUNE.rain, 300);
  let stopRain = rain(run, fx, { x0: 300, x1: 760, y0: 160, y1: 720, n: 46 });
  const songLine = run.say('Down came the rain, and washed the spider out!');
  await run.wait(600);
  await run.anim(1300, t => {
    const y = 300 + (690 - 300) * t;
    spi.moveTo(577 + (t > .9 ? (t - .9) * 1200 : 0), y);
    spi.inner.setAttribute('transform', `rotate(${t * 720})`);
    puddle.setAttribute('rx', 140 * t); puddle.setAttribute('ry', 24 * t);
  }, ease.inOut);
  await songLine;
  await run.wait(900);
  stopRain();
  await moveTo(cl, -300, 110, 1400, run);
  await run.say('Out came the sun! Drag the sun up into the sky.');
  await drag(run, sunN, [1300, 170]);
  melody(TUNE.sun, 300);
  const dry = run.say('Out came the sun, and dried up all the rain!');
  let acc = 0;
  await run.anim(2600, t => {
    puddle.setAttribute('rx', 140 * (1 - t)); puddle.setAttribute('ry', 24 * (1 - t));
    if (t - acc > .07) { acc = t; riseWisp(run, fx, 640 + Math.random() * 120 * (1 - t), 700); }
  }, ease.linear);
  await dry;
  await run.say('Where did the rain go? The sun warmed the water, and it turned into water vapor. It floated up into the sky, too tiny to see!');
  await bigWord(run, 'evaporation');
  melody(TUNE.again, 280);
  run.say('And the itsy bitsy spider climbed up the spout again!');
  spi.inner.removeAttribute('transform');
  await moveTo(spi, 577, 660, 500, run);
  await moveTo(spi, 577, 300, 1800, run);
  await run.wait(600);

  /* ===== 2. follow the water up: condensation, precipitation, collection ===== */
  await run.say("Let's follow the water vapor up, up, up into the sky!");
  const big = node(root, 990, 150, ''); const bc = cloud(big.inner, { s: 1 }); big.moveTo(990, 150, .2);
  const spots = byLv([[760, 470], [900, 360], [1060, 460], [1180, 340]], [[760, 470], [900, 360], [1060, 470], [1180, 340], [880, 560]], [[740, 470], [880, 350], [1040, 470], [1180, 340], [860, 570], [1200, 520]]);
  const wisps = spots.map(([x, y], i) => {
    const n = node(fx, x, y); n.inner.classList.add('tap', 'float'); n.inner.style.animationDelay = (i * 300) + 'ms';
    el('circle', { r: 62, cy: -40, fill: '#fff', opacity: .18 }, n.inner);
    wisp(n.inner, 0, 0);
    return n;
  });
  await run.say('High in the sky, the air is cold. Tap each bit of vapor to cool it down!');
  let left = wisps.slice(), size = .2;
  while (left.length) {
    const i = await run.tapAny(left.map(w => w.inner));
    const w = left.splice(i, 1)[0];
    sfx.drip();
    while (w.inner.firstChild) w.inner.removeChild(w.inner.firstChild);
    w.inner.classList.remove('float', 'tap');
    for (const dx of [-14, 0, 14]) el('circle', { cx: dx, cy: -30 + Math.abs(dx) / 2, r: 9, fill: '#4fc3f7' }, w.inner);
    const x0 = w.x, y0 = w.y;
    run.anim(700, t => w.moveTo(x0 + (990 - x0) * t, y0 + (170 - y0) * t, 1 - t * .7), ease.inOut).then(() => w.remove()).catch(() => {});
    size += (1 - .2) / wisps.length;
    const s0 = big.s, s1 = size;
    await run.anim(400, t => big.moveTo(990, 150, s0 + (s1 - s0) * t), ease.back);
  }
  await run.wait(500);
  await run.say('The cold air turned the vapor back into tiny water drops, and they huddled together to make a cloud!');
  await bigWord(run, 'condensation');
  if (lv() > 0) await run.say('You can see condensation at home! When your cup is cold, little drops appear on the outside. That water came from the air!');
  await run.say('More drops join the cloud. Tap the cloud to add more drops!');
  const taps = byLv(4, 5, 6);
  for (let k = 1; k <= taps; k++) {
    pulse(big.inner); await run.tap(big.inner); pulse(big.inner, false);
    sfx.drip();
    bc.body.setAttribute('fill', mixHex('#ffffff', '#6f8591', k / taps));
    big.moveTo(990, 150 + k * 6, 1 + k * .04);
    if (lv() > 0) run.say(String(k));
  }
  await run.say('The cloud is so heavy! The drops are falling!');
  sfx.rain(4);
  stopRain = rain(run, fx, { x0: 870, x1: 1110, y0: 200, y1: 735, n: 40 });
  await run.anim(2400, t => { pond.setAttribute('rx', 160 * t); pond.setAttribute('ry', 30 * t); }, ease.out);
  await bigWord(run, 'precipitation');
  stopRain();
  run.anim(1500, t => bc.body.setAttribute('fill', mixHex('#6f8591', '#ffffff', t))).catch(() => {});
  await run.say('Rain, snow, sleet and hail are all precipitation!');
  await bigWord(run, 'collection');
  await run.say('Then the sun warms the water again, and it all starts over. Round and round, forever!');
  await bigWord(run, 'watercycle');

  /* ===== 3. put the cycle in order ===== */
  const P = el('g', {}, s);
  el('rect', { x: 380, y: 112, width: 840, height: 504, rx: 44, fill: 'rgba(255,255,255,.95)', stroke: '#81d4fa', 'stroke-width': 8 }, P);
  const C0 = [800, 380], R = 160;
  txt(P, 800, 362, 'The Water', 34, { fill: '#0277bd', 'font-weight': 700 });
  txt(P, 800, 402, 'Cycle', 34, { fill: '#0277bd', 'font-weight': 700 });
  el('circle', { cx: C0[0], cy: C0[1], r: R, fill: 'none', stroke: '#b3e5fc', 'stroke-width': 14, 'stroke-dasharray': '30 18' }, P);
  for (const a of [45, 135, 225, 315]) {
    const r = a * Math.PI / 180, x = C0[0] + Math.cos(r) * R, y = C0[1] + Math.sin(r) * R;
    el('path', { d: 'M-14 -14 L14 0 L-14 14Z', fill: '#4fc3f7', transform: `translate(${x} ${y}) rotate(${a + 90})` }, P);
  }
  const STG = {
    evaporation: { icon: '☀️', label: 'Evaporation', pos: [800, 220] },
    condensation: { icon: '☁️', label: 'Condensation', pos: [960, 380] },
    precipitation: { icon: '🌧️', label: 'Precipitation', pos: [800, 540] },
    collection: { icon: '🌊', label: 'Collection', pos: [640, 380] },
  };
  const slots = {};
  for (const k in STG) {
    const n = node(P, ...STG[k].pos);
    el('circle', { r: 66, fill: '#fff', stroke: '#81d4fa', 'stroke-width': 5, 'stroke-dasharray': '10 8' }, n.inner);
    txt(n.inner, 0, 2, '?', 50, { fill: '#b3e5fc', 'font-weight': 700 });
    slots[k] = n;
  }
  const fill = k => {
    const n = slots[k]; while (n.inner.firstChild) n.inner.removeChild(n.inner.firstChild);
    n.inner.classList.add('pop-in');
    el('circle', { r: 66, fill: '#e1f5fe', stroke: '#29b6f6', 'stroke-width': 6 }, n.inner);
    txt(n.inner, 0, -12, STG[k].icon, 56, { class: 'emoji' });
    txt(n.inner, 0, 40, STG[k].label, 19, { fill: '#01579b', 'font-weight': 700 });
  };
  fill('collection');
  await run.say("Let's put the water cycle in order! The water starts in the lake. That's collection.");
  const steps = [
    ['evaporation', 'The sun comes out and warms the lake. What happens next?'],
    ['condensation', 'The water vapor floats up high where it is cold. What happens next?'],
    ['precipitation', 'The cloud gets too full and heavy. What happens next?'],
  ];
  const HINT = {
    evaporation: { condensation: "Not yet! We need vapor in the sky before we can make a cloud.", precipitation: 'Not yet! Rain falls from clouds, and we have no cloud yet.', collection: 'The water is already collected in the lake. What does the sun do to it?' },
    condensation: { evaporation: 'That already happened! Now the vapor is up high and cold.', precipitation: "Almost! First the vapor has to turn into a cloud.", collection: 'Hmm, the water is up in the sky now, not in the lake.' },
    precipitation: { evaporation: 'Hmm, the water is up in the cloud. How does it come down?', condensation: 'The cloud is already made! It is too heavy now.', collection: 'Almost! First the water has to fall down from the cloud.' },
  };
  for (const [k, q] of steps) {
    pulse(slots[k].inner);
    const keys = lv() === 0 ? Object.keys(STG).filter(x => x === k || !['collection'].includes(x) && !slots[x].done) : Object.keys(STG);
    const opts = shuffle(keys).map(x => ({ icon: STG[x].icon, label: STG[x].label, correct: x === k, why: x === k ? null : HINT[k][x], iconSize: 64 }));
    const r = await ask(run, { prompt: q, options: opts, y: 650, tileW: 250, tileH: 170 });
    pulse(slots[k].inner, false); slots[k].done = true; fill(k);
    await run.say(`${praise(r.misses)} ${STG[k].label}!`);
  }
  if (lv() === 2) {
    const r = await ask(run, {
      prompt: 'Brain teaser! What comes AFTER precipitation?',
      options: shuffle(Object.keys(STG)).map(x => ({ icon: STG[x].icon, label: STG[x].label, correct: x === 'collection', iconSize: 64 })), y: 650, tileW: 250, tileH: 170,
      hint: 'Follow the arrows around the circle!',
    });
    await run.say(`${praise(r.misses)} After the rain falls, it collects. Then it goes round again. That's why it's called a cycle!`);
  }
  await run.wait(500);
  P.remove();

  /* ===== 4. rain gauge maths ===== */
  moveTo(sunN, 1480, 130, 800, run).catch(() => {});
  const G = node(s, 1250, 0); const gg = G.inner;
  const PX = 4, TOP = 250, BOT = 650;
  el('rect', { x: -60, y: TOP - 20, width: 120, height: BOT - TOP + 40, rx: 22, fill: 'rgba(255,255,255,.85)', stroke: '#90a4ae', 'stroke-width': 6 }, gg);
  const water = el('rect', { x: -50, y: BOT, width: 100, height: 0, rx: 10, fill: '#4fc3f7', opacity: .9 }, gg);
  for (let v = 0; v <= 100; v += 10) {
    const y = BOT - v * PX;
    el('line', { x1: -60, y1: y, x2: -36, y2: y, stroke: '#546e7a', 'stroke-width': 4 }, gg);
    txt(gg, -92, y, String(v), 24, { fill: '#37474f', 'font-weight': 700 });
  }
  txt(gg, 0, BOT + 50, 'Rain Gauge', 28, { fill: '#01579b', 'font-weight': 700 });
  const bubble = node(gg, 110, BOT);
  el('rect', { x: -6, y: -30, width: 96, height: 60, rx: 30, fill: '#fff', stroke: '#29b6f6', 'stroke-width': 5 }, bubble.inner);
  const bubT = txt(bubble.inner, 42, 2, '0', 34, { fill: '#01579b', 'font-weight': 700 });
  let level = 0;
  const setLevel = v => run.anim(900, t => {
    const x = level + (v - level) * t;
    water.setAttribute('y', BOT - x * PX); water.setAttribute('height', x * PX);
    bubble.moveTo(110, BOT - x * PX); bubT.textContent = Math.round(x);
  }, ease.inOut).then(() => { level = v; });
  G.inner.classList.add('pop-in');
  await run.say('This is a rain gauge. Scientists use it to measure how much rain falls!');
  for (const p of problems()) {
    if (p.type === 'add' || p.type === 'sub') {
      await setLevel(p.start);
      const ex = el('g', {}, gg);
      const big10 = p.n >= 10, count = big10 ? p.n / 10 : p.n;
      for (let i = 0; i < count; i++) {
        const x = (i - (count - 1) / 2) * (big10 ? 64 : 34), y = TOP - 60;
        if (p.type === 'add') {
          el('path', { d: big10 ? 'M0 -34 C18 -6 26 8 26 18 A26 26 0 0 1 -26 18 C-26 8 -18 -6 0 -34Z' : 'M0 -18 C9 -3 13 4 13 9 A13 13 0 0 1 -13 9 C-13 4 -9 -3 0 -18Z', fill: '#29b6f6', transform: `translate(${x} ${y})`, class: 'bob' }, ex);
          if (big10) txt(ex, x, y + 16, '10', 20, { fill: '#fff', 'font-weight': 700 });
        } else {
          wisp(ex, x, y + 30, .7); if (big10) txt(ex, x + 26, y - 30, '−10', 22, { fill: '#e65100', 'font-weight': 700 });
        }
      }
      if (!big10 && p.type === 'add' && count > 1) txt(ex, 0, TOP - 110, `+${count}`, 30, { fill: '#0277bd', 'font-weight': 700 });
      const r = await ask(run, { prompt: p.q, options: distractors(p.ans, p.prefer).map(v => ({ label: String(v), correct: v === p.ans, labelSize: 70 })), y: 700, tileW: 190, tileH: 150 });
      if (p.type === 'add') { sfx.rain(1); await run.anim(500, t => ex.setAttribute('transform', `translate(0 ${t * 200})`), ease.out); }
      else await run.anim(500, t => { ex.setAttribute('transform', `translate(0 ${-t * 120})`); ex.setAttribute('opacity', 1 - t); });
      ex.remove();
      await setLevel(p.ans);
      const how = p.n === 10 ? (p.type === 'add' ? ` Ten more! The tens number goes up by one.` : ` Ten less! The tens number goes down by one.`) : p.n >= 20 ? ` Count on by tens: ${Array.from({ length: p.n / 10 }, (_, i) => p.start + 10 * (i + 1)).join(', ')}.` : '';
      await run.say(`${praise(r.misses)} ${p.ans}!${how}`);
    } else if (p.type === 'compare') {
      const first = p.swap ? p.b : p.a, second = p.swap ? p.a : p.b;
      const r = await ask(run, {
        prompt: p.q,
        options: [{ icon: '🕷️', label: `Spider Town: ${first}`, correct: first === p.b }, { icon: '🐵', label: `Booboo Town: ${second}`, correct: second === p.b }],
        y: 660, tileW: 330, tileH: 190,
        hint: lv() ? 'Look at the tens! Which number has more tens?' : 'Count up. Which number comes later when you count?',
      });
      const tens = n => Math.floor(n / 10);
      await run.say(`${praise(r.misses)} ${p.b} is more than ${p.a}.` + (lv() ? ` ${p.b} has ${tens(p.b)} tens, and ${p.a} has only ${tens(p.a)} tens.` : ` When we count, ${p.b} comes after ${p.a}.`));
    } else if (p.type === 'diff') {
      await setLevel(p.a);
      const mark = el('line', { x1: -70, y1: BOT - p.b * PX, x2: 70, y2: BOT - p.b * PX, stroke: '#e91e63', 'stroke-width': 6, 'stroke-dasharray': '10 6' }, gg);
      const r = await ask(run, { prompt: p.q, options: distractors(p.ans, p.prefer).map(v => ({ label: String(v), correct: v === p.ans, labelSize: 70 })), y: 700, tileW: 190, tileH: 150, hint: `Count up by tens from ${p.a} to ${p.b}!` });
      await setLevel(p.b); mark.remove();
      const hops = []; for (let v = p.a + 10; v <= p.b; v += 10) hops.push(v);
      await run.say(`${praise(r.misses)} Count up from ${p.a}: ${hops.join(', ')}. That's ${hops.length} tens. ${p.ans} more!`);
    }
  }
  await run.anim(400, t => G.setAttribute('opacity', 1 - t));
  G.remove();

  /* ===== 5. thinking questions ===== */
  await run.say('Now some thinking questions!');
  const L = lv();
  const qs = shuffle(THINK.filter(q => q.lv <= L)).sort((a, b) => (b.lv === L) - (a.lv === L)).slice(0, byLv(2, 2, 3));
  for (const q of qs) {
    const r = await ask(run, { prompt: q.q, options: shuffle(q.o), y: 600, tileW: q.o.length > 2 ? 300 : 320, tileH: 220 });
    await run.say(`${praise(r.misses)} ${q.why}`);
  }
  spi.moveTo(577, 300);
  await finish(run, 'spider', 'You know the whole water cycle! Evaporation, condensation, precipitation, and collection!');
}
