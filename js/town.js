import { el, txt, node, stage, svgPoint, burst, bigWord, button, wrapText, pulse, shake, W, H } from './ui.js';
import { spiderHouse, rainbowLab, spaceCenter, homeHouse, construction, pinkCar, rover, tree, flower, cloud } from './art.js';
import { state, save, lv, pick } from './state.js';
import { sfx } from './audio.js';
import { say } from './speech.js';
import { go } from './nav.js';
import { ease, ABORT } from './run.js';
const safe = p => p && p.catch && p.catch(e => { if (e !== ABORT) console.error(e); });
import { WORDS } from './words.js';

/* ---------- the grid ---------- */
const T = 130, X0 = 20, Y0 = 60, COLS = 9, ROWS = 6;
const cx = c => X0 + c * T + T / 2, cy = r => Y0 + r * T + T / 2;
const key = (c, r) => c + ',' + r;
const ROAD = new Set();
for (let c = 0; c < COLS; c++) { ROAD.add(key(c, 1)); ROAD.add(key(c, 4)); }
for (let r = 1; r <= 4; r++) for (const c of [0, 4, 8]) ROAD.add(key(c, r));
const isRoad = (c, r) => ROAD.has(key(c, r));
const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // 0 right, 1 down, 2 left, 3 up
const ABS = { R: 0, D: 1, L: 2, U: 3 };

const PLACES = {
  spider: { name: 'Spider Spout', emoji: '🕷️', x: 280, y: 202, stop: [1, 1], draw: spiderHouse },
  rainbow: { name: 'Rainbow Lab', emoji: '🌈', x: 930, y: 202, stop: [7, 1], draw: rainbowLab },
  space: { name: 'Space Center', emoji: '🚀', x: 280, y: 858, stop: [2, 4], draw: spaceCenter },
};
const SOON = [
  { name: 'Garden Lab', label: 'Garden', emoji: '🌱', x: 745, y: 566, about: 'how seeds grow into plants' },
  { name: 'Number Bakery', label: 'Bakery', emoji: '🧁', x: 995, y: 566, about: 'sharing, halves and quarters' },
  { name: 'Train Station', label: 'Trains', emoji: '🚂', x: 605, y: 858, about: 'patterns and puzzles' },
];

function bfs(from, to) {
  const prev = new Map([[key(from.c, from.r), null]]), q = [[from.c, from.r]];
  while (q.length) {
    const [c, r] = q.shift();
    if (c === to[0] && r === to[1]) break;
    for (const [dc, dr] of DIRS) {
      const n = [c + dc, r + dr], k = key(...n);
      if (isRoad(...n) && !prev.has(k)) { prev.set(k, [c, r]); q.push(n); }
    }
  }
  const path = []; let cur = to;
  if (!prev.has(key(...to))) return null;
  while (cur && !(cur[0] === from.c && cur[1] === from.r)) { path.unshift(cur); cur = prev.get(key(...cur)); }
  return path;
}

// Where Booboo is parked survives between visits.
let carPos = { c: 6, r: 4 }, heading = 2, facingLeft = true, mode = 'drive';

export async function town(run, arg) {
  const s = stage();
  if (arg && arg.mode) mode = arg.mode;
  const defs = el('defs', {}, s);
  const sky = el('linearGradient', { id: 'skyG', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: 0, 'stop-color': '#9bdcff' }, sky); el('stop', { offset: 1, 'stop-color': '#d9f3ff' }, sky);

  /* ----- background ----- */
  const map = el('g', {}, s);
  el('rect', { width: W, height: H, fill: '#a5d66f' }, map);
  el('rect', { width: 1200, height: 118, fill: 'url(#skyG)' }, map);
  el('path', { d: 'M0 118 Q300 100 600 118 T1200 118 L1200 130 L0 130Z', fill: '#a5d66f' }, map);
  const clouds = el('g', {}, map);
  const cl = [cloud(clouds, { x: 150, y: 50, s: .45 }), cloud(clouds, { x: 700, y: 36, s: .38 })];
  let cx0 = [150, 700];
  run.loop(dt => { cx0 = cx0.map(x => x > 1250 ? -100 : x + dt * 14); cl.forEach((c, i) => c.setAttribute('transform', `translate(${cx0[i]} ${i ? 36 : 50}) scale(${i ? .38 : .45})`)); });

  // rainbow reward arcs behind the lab
  if (state.stars.rainbow > 0) {
    ['#ef5350', '#ffa726', '#ffee58', '#66bb6a', '#42a5f5', '#5c6bc0', '#ab47bc'].forEach((c, i) => {
      const r = 250 - i * 14;
      el('path', { d: `M${930 - r} 175 A${r} ${r} 0 0 1 ${930 + r} 175`, fill: 'none', stroke: c, 'stroke-width': 14, opacity: .55 }, map);
    });
  }

  // roads
  const roads = el('g', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }, map);
  const roadPath = `M${cx(0)} ${cy(1)} H${cx(8)} M${cx(0)} ${cy(4)} H${cx(8)} M${cx(0)} ${cy(1)} V${cy(4)} M${cx(4)} ${cy(1)} V${cy(4)} M${cx(8)} ${cy(1)} V${cy(4)}`;
  el('path', { d: roadPath, stroke: '#8a9aa3', 'stroke-width': 98 }, roads);
  el('path', { d: roadPath, stroke: '#6f8089', 'stroke-width': 84 }, roads);
  el('path', { d: roadPath, stroke: '#fff', 'stroke-width': 5, 'stroke-dasharray': '22 20', opacity: .8 }, roads);

  // pond + trees in the left block
  const pond = node(map, 345, 452); pond.inner.classList.add('tap');
  el('ellipse', { rx: 150, ry: 78, fill: '#64b5f6', stroke: '#90caf9', 'stroke-width': 8 }, pond.inner);
  el('ellipse', { cx: -40, cy: -10, rx: 40, ry: 12, fill: '#bbdefb', opacity: .7 }, pond.inner);
  el('ellipse', { cx: 70, cy: 20, rx: 22, ry: 12, fill: '#81c784' }, pond.inner);
  txt(pond.inner, 70, 14, '🐸', 26, { class: 'emoji' });
  pond.inner.addEventListener('pointerdown', e => { e.stopPropagation(); sfx.drip(); say('A pond! When rain falls, the water collects here. That is called collection.'); });
  [[150, 360], [540, 372], [160, 560], [530, 565]].forEach(([x, y]) => tree(map, x, y, .8));
  [[660, 380], [1080, 380], [1080, 470]].forEach(([x, y]) => tree(map, x, y, .7));
  [[430, 30 + 140], [1130, 175], [40, 175], [600, 175], [700, 175]].forEach(([x, y], i) => flower(map, x, y, ['#ff80ab', '#ffd54f', '#ce93d8', '#ff8a65', '#80deea'][i]));
  [[1140, 860], [1160, 730], [480, 870], [60, 860]].forEach(([x, y]) => tree(map, x, y, .75));

  /* ----- buildings ----- */
  for (const k in PLACES) {
    const P = PLACES[k];
    const n = node(map, P.x, P.y); n.inner.classList.add('tap', 'bldg');
    P.draw(n.inner);
    const st = state.stars[k] || 0;
    if (st) {
      el('rect', { x: 70, y: -170, width: 70, height: 40, rx: 20, fill: '#fff8e1', stroke: '#ffca28', 'stroke-width': 3 }, n.inner);
      txt(n.inner, 105, -149, `⭐${st}`, 24, { 'font-weight': 700, fill: '#8d6e00' });
    }
    if (k === 'spider' && st) { // a web on the roof corner
      const wg = el('g', { transform: 'translate(-100 -112)', stroke: '#fff', 'stroke-width': 2, fill: 'none', opacity: .9 }, n.inner);
      for (let a = 0; a <= 90; a += 22.5) { const r = a * Math.PI / 180; el('line', { x1: 0, y1: 0, x2: Math.cos(r) * 46, y2: Math.sin(r) * 46 }, wg); }
      for (const r of [14, 26, 38]) el('path', { d: `M${r} 0 Q${r * .8} ${r * .8} 0 ${r}` }, wg);
    }
    if (k === 'space' && st) txt(n.inner, -130, -150, '✨', 34, { class: 'emoji twinkle' });
    n.inner.addEventListener('pointerdown', e => { e.stopPropagation(); safe(onPlace(k)); });
  }
  const home = node(map, 865, 858); home.inner.classList.add('tap', 'bldg'); homeHouse(home.inner);
  home.inner.addEventListener('pointerdown', e => {
    e.stopPropagation(); if (busy) return;
    if (mode === 'drive') safe(driveTo([6, 4], () => say("Home sweet home! You can pick the pink car or the Mars rover on the right.")));
  });
  for (const S of SOON) {
    const n = node(map, S.x, S.y); n.inner.classList.add('tap'); construction(n.inner, S.label, S.emoji);
    n.inner.addEventListener('pointerdown', e => { e.stopPropagation(); sfx.tap(); say(`The ${S.name} is still being built! Soon you can learn about ${S.about} here.`); });
  }

  /* ----- hint footprints + goal flag layer ----- */
  const hintL = el('g', { 'pointer-events': 'none' }, map);
  const flagL = el('g', { 'pointer-events': 'none' }, map);

  /* ----- Booboo's vehicle ----- */
  const car = node(map, cx(carPos.c), cy(carPos.r) - 8);
  const bob = el('g', { class: 'car-bob' }, car.inner);
  const flip = el('g', {}, bob);
  (state.vehicle === 'rover' ? rover : pinkCar)(flip);
  const arrow = el('g', { opacity: 0 }, car.inner);
  el('circle', { r: 20, cx: 0, cy: 0, fill: '#ffeb3b', stroke: '#f57f17', 'stroke-width': 4 }, arrow);
  el('path', { d: 'M-6 -9 L10 0 L-6 9Z', fill: '#f57f17' }, arrow);
  const setFlip = () => flip.setAttribute('transform', `scale(${facingLeft ? -.62 : .62} .62)`);
  const updateArrow = () => {
    const show = mode === 'code' && lv() === 2;
    arrow.setAttribute('opacity', show ? 1 : 0);
    arrow.setAttribute('transform', `translate(0 48) rotate(${heading * 90})`);
  };
  setFlip(); updateArrow();

  let busy = false;
  async function stepTo(c, r, ms = 240) {
    const x0 = car.x, y0 = car.y, x1 = cx(c), y1 = cy(r) - 8;
    sfx.step();
    await run.anim(ms, t => car.moveTo(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t), ease.linear);
    carPos = { c, r };
  }
  async function driveTo(stop, then) {
    if (busy) return;
    const path = bfs(carPos, stop);
    if (!path) return;
    busy = true; bob.classList.add('driving');
    try {
      for (const [c, r] of path) {
        const d = DIRS.findIndex(([dc, dr]) => dc === c - carPos.c && dr === r - carPos.r);
        heading = d; if (d === 0) facingLeft = false; if (d === 2) facingLeft = true; setFlip(); updateArrow();
        await stepTo(c, r);
      }
    } finally { bob.classList.remove('driving'); busy = false; }
    if (then) await then();
  }
  async function onPlace(k) {
    if (busy) return;
    const P = PLACES[k];
    if (mode === 'code') { sfx.tap(); say(P.name === target?.name ? `Write the steps to get to the ${P.name}, then press Go!` : `That's the ${P.name}. In code mode we drive with steps. Today we're going to the ${target.name}.`); return; }
    sfx.honk();
    say(`To the ${P.name}!`);
    await driveTo(P.stop);
    await enter(k);
  }
  async function enter(k) {
    busy = true;
    sfx.whoosh();
    const b = el('rect', { width: W, height: H, fill: '#fff', opacity: 0 }, s);
    await run.anim(450, t => b.setAttribute('opacity', t));
    go(k);
  }
  // tap an empty road: drive there
  map.addEventListener('pointerdown', e => {
    if (mode !== 'drive' || busy) return;
    const p = svgPoint(e);
    const c = Math.floor((p.x - X0) / T), r = Math.floor((p.y - Y0) / T);
    if (isRoad(c, r)) { sfx.tap(); safe(driveTo([c, r])); }
  });

  /* ----- right panel ----- */
  const panel = el('g', {}, s);
  let target = null, program = [], fails = 0, bugAt = -1, running = false;
  const MAX = 12;
  function drawCmd(g, cmd, sc = 1) {
    const a = el('g', { transform: `scale(${sc})` }, g);
    const COL = { U: '#42a5f5', D: '#ffa726', L: '#66bb6a', R: '#ab47bc', F: '#42a5f5', TL: '#66bb6a', TR: '#ab47bc' };
    el('rect', { x: -34, y: -34, width: 68, height: 68, rx: 16, fill: COL[cmd] }, a);
    if (cmd in ABS || cmd === 'F') {
      const rot = cmd === 'F' ? 270 : ABS[cmd] * 90;
      el('path', { d: 'M-22 -8 L2 -8 L2 -20 L24 0 L2 20 L2 8 L-22 8Z', fill: '#fff', transform: `rotate(${rot})` }, a);
    } else {
      const t = el('g', { transform: cmd === 'TR' ? 'scale(-1 1)' : '' }, a);
      el('path', { d: 'M12 24 L12 0 Q12 -12 0 -12 L-8 -12', fill: 'none', stroke: '#fff', 'stroke-width': 10, 'stroke-linecap': 'round' }, t);
      el('path', { d: 'M-26 -12 L-6 -27 L-6 3Z', fill: '#fff' }, t);
    }
    return a;
  }
  function renderPanel() {
    while (panel.firstChild) panel.removeChild(panel.firstChild);
    el('rect', { x: 1205, y: 8, width: 388, height: 884, rx: 34, fill: 'rgba(255,248,251,.95)', stroke: '#f8bbd0', 'stroke-width': 5 }, panel);
    txt(panel, 1399, 50, "Booboo's Town", 40, { fill: '#ad1457', 'font-weight': 700 });
    const total = Object.values(state.stars).reduce((a, b) => a + b, 0);
    txt(panel, 1399, 96, `⭐ ${total} stars`, 28, { fill: '#8d6e00', 'font-weight': 600 });
    // mode toggle
    const md = button(panel, 1305, 158, 180, 74, 'Drive', { icon: '🚗', size: 28, fill: mode === 'drive' ? '#ffd1e3' : '#fff', stroke: mode === 'drive' ? '#ec407a' : '#ffd1e3' });
    const mc = button(panel, 1495, 158, 180, 74, 'Code', { icon: '🧩', size: 28, fill: mode === 'code' ? '#d1c4e9' : '#fff', stroke: mode === 'code' ? '#7e57c2' : '#ffd1e3' });
    md.inner.addEventListener('pointerdown', e => { e.stopPropagation(); if (busy || mode === 'drive') return; sfx.tap(); safe(setMode('drive')); });
    mc.inner.addEventListener('pointerdown', e => { e.stopPropagation(); if (busy || mode === 'code') return; sfx.tap(); safe(setMode('code')); });
    // vehicle
    for (const [v, x] of [['car', 1305], ['rover', 1495]]) {
      const b = node(panel, x, 248); b.inner.classList.add('tap');
      const on = state.vehicle === v;
      el('rect', { x: -90, y: -37, width: 180, height: 74, rx: 26, fill: on ? '#fff3e0' : '#fff', stroke: on ? '#ff9800' : '#ffd1e3', 'stroke-width': 5 }, b.inner);
      const m = el('g', { transform: 'translate(0 8) scale(.36)' }, b.inner);
      (v === 'car' ? pinkCar : rover)(m);
      b.inner.addEventListener('pointerdown', e => {
        e.stopPropagation(); if (busy || state.vehicle === v) return;
        state.vehicle = v; save(); sfx.honk();
        while (flip.firstChild) flip.removeChild(flip.firstChild);
        (v === 'rover' ? rover : pinkCar)(flip); renderPanel();
        say(v === 'rover' ? 'The Mars rover! Real rovers explore Mars and send pictures back to Earth.' : 'The pink car! Beep beep!');
      });
    }
    const wb = button(panel, 1399, 334, 370, 64, `Big Words (${state.words.length})`, { icon: '📖', size: 28, fill: '#fffde7', stroke: '#ffd54f' });
    wb.inner.addEventListener('pointerdown', e => { e.stopPropagation(); if (busy) return; sfx.tap(); wordBook(); });

    if (mode === 'drive') {
      wrapText(panel, 1399, 470, 'Tap a building and Booboo will drive there!', 30, 20, { fill: '#6a1b4d' });
      const P = node(panel, 1399, 640); P.inner.classList.add('bob');
      txt(P.inner, -90, 0, '🕷️', 60, { class: 'emoji' }); txt(P.inner, 0, 0, '🌈', 60, { class: 'emoji' }); txt(P.inner, 90, 0, '🚀', 60, { class: 'emoji' });
      wrapText(panel, 1399, 790, 'Try Code mode to program Booboo\'s route!', 24, 26, { fill: '#7e57c2' });
      return;
    }
    // code mode
    txt(panel, 1399, 400, 'Program Booboo to:', 26, { fill: '#5e35b1', 'font-weight': 600 });
    txt(panel, 1399, 440, `${target.emoji} ${target.name}`, 32, { fill: '#311b92', 'font-weight': 700 });
    const cmds = lv() === 2 ? ['TL', 'F', 'TR'] : ['L', 'U', 'D', 'R'];
    const xs = cmds.length === 3 ? [1290, 1399, 1508] : [1255, 1351, 1447, 1543];
    cmds.forEach((c, i) => {
      const b = node(panel, xs[i], 514); b.inner.classList.add('tap'); b.inner.dataset.cmd = c;
      drawCmd(b.inner, c, 1.18);
      b.inner.addEventListener('pointerdown', e => {
        e.stopPropagation(); if (running) return;
        if (program.length >= MAX) { sfx.boing(); say("That's a lot of steps! Press Go to try them."); return; }
        sfx.click(); program.push(c); bugAt = -1; renderPanel();
      });
    });
    // program slots
    el('rect', { x: 1222, y: 562, width: 354, height: 236, rx: 20, fill: '#ede7f6' }, panel);
    for (let i = 0; i < MAX; i++) {
      const col = i % 4, row = Math.floor(i / 4);
      const x = 1266 + col * 89, y = 602 + row * 78;
      const sl = node(panel, x, y); sl.inner.setAttribute('data-slot', i);
      el('rect', { x: -34, y: -34, width: 68, height: 68, rx: 16, fill: i === bugAt ? '#ffcdd2' : '#fff', stroke: i === bugAt ? '#e53935' : '#d1c4e9', 'stroke-width': i === bugAt ? 6 : 3, 'stroke-dasharray': program[i] ? '' : '6 6' }, sl.inner);
      txt(sl.inner, -25, -24, String(i + 1), 15, { fill: '#9575cd', 'font-weight': 700 });
      if (program[i]) {
        drawCmd(sl.inner, program[i], .78); sl.inner.classList.add('tap');
        if (i === bugAt) { txt(sl.inner, 22, -24, '🐞', 24, { class: 'emoji' }); pulse(sl.inner); }
        sl.inner.addEventListener('pointerdown', e => { e.stopPropagation(); if (running) return; sfx.pop(); program.splice(i, 1); bugAt = -1; renderPanel(); });
      }
    }
    const goB = button(panel, 1292, 846, 150, 80, 'Go', { icon: '▶', fill: '#c8e6c9', stroke: '#43a047', color: '#1b5e20', size: 34 });
    const un = button(panel, 1432, 846, 110, 80, '↶', { fill: '#fff', size: 44 });
    const clr = button(panel, 1540, 846, 90, 80, '🗑', { fill: '#fff', size: 36 });
    goB.inner.dataset.go = '1';
    if (program.length && !running) pulse(goB.inner);
    goB.inner.addEventListener('pointerdown', e => { e.stopPropagation(); safe(execute()); });
    un.inner.addEventListener('pointerdown', e => { e.stopPropagation(); if (running || !program.length) return; sfx.pop(); program.pop(); bugAt = -1; renderPanel(); });
    clr.inner.addEventListener('pointerdown', e => { e.stopPropagation(); if (running) return; sfx.pop(); program = []; bugAt = -1; renderPanel(); });
  }

  function chooseTarget() {
    const pref = [3, 5, 8][lv()];
    let best = null, bd = 1e9;
    for (const k in PLACES) {
      const p = bfs(carPos, PLACES[k].stop);
      if (!p || !p.length) continue;
      const d = Math.abs(p.length - pref) + Math.random() * .5;
      if (d < bd) { bd = d; best = k; }
    }
    return { key: best, ...PLACES[best] };
  }
  function drawFlag() {
    while (flagL.firstChild) flagL.removeChild(flagL.firstChild);
    if (mode !== 'code' || !target) return;
    const f = node(flagL, cx(target.stop[0]), cy(target.stop[1])); f.inner.classList.add('bob');
    el('ellipse', { cx: 0, cy: 30, rx: 40, ry: 14, fill: '#ffeb3b', opacity: .6 }, f.inner);
    el('line', { x1: 30, y1: 30, x2: 30, y2: -50, stroke: '#5d4037', 'stroke-width': 5 }, f.inner);
    el('path', { d: 'M30 -50 L72 -38 L30 -24Z', fill: '#ff4081' }, f.inner);
  }
  function showHint() {
    while (hintL.firstChild) hintL.removeChild(hintL.firstChild);
    const path = bfs(carPos, target.stop);
    if (!path) return;
    path.forEach(([c, r], i) => {
      const d = el('circle', { cx: cx(c), cy: cy(r), r: 13, fill: '#fff', stroke: '#ff4081', 'stroke-width': 4, opacity: 0, class: 'fadein' }, hintL);
      d.style.animationDelay = (i * 120) + 'ms';
    });
  }
  async function setMode(m) {
    mode = m; program = []; bugAt = -1; fails = 0;
    while (hintL.firstChild) hintL.removeChild(hintL.firstChild);
    if (m === 'code') target = chooseTarget();
    renderPanel(); drawFlag(); updateArrow();
    if (m === 'code') {
      if (!state.seen.code) {
        state.seen.code = 1; save();
        await run.say(`Code mode! You make a plan with arrow steps, and Booboo follows them exactly, just like a computer. Each arrow moves one square on the road.`);
      }
      if (lv() === 2 && !state.seen.codeTurn) {
        state.seen.codeTurn = 1; save();
        await run.say('Scientist level! The middle arrow drives forward the way Booboo is facing. The curvy arrows turn left or right. Watch the yellow arrow!');
      }
      await run.say(`Can you program Booboo to drive to the ${target.name}? Tap the arrows, then press Go!`);
    } else {
      await run.say('Drive mode! Tap a building to go there.');
    }
  }
  async function execute() {
    if (running || busy || !program.length) return;
    running = busy = true; bugAt = -1; renderPanel();
    const start = { ...carPos }, h0 = heading, f0 = facingLeft;
    let crashed = -1;
    bob.classList.add('driving');
    for (let i = 0; i < program.length; i++) {
      const slot = panel.querySelector(`[data-slot="${i}"]`);
      slot && slot.classList.add('running');
      const c = program[i];
      if (c === 'TL' || c === 'TR') {
        heading = (heading + (c === 'TL' ? 3 : 1)) % 4;
        if (heading === 0) facingLeft = false; if (heading === 2) facingLeft = true;
        setFlip(); updateArrow(); sfx.click();
        await run.wait(380);
        slot && slot.classList.remove('running');
        continue;
      }
      const d = c === 'F' ? heading : ABS[c];
      heading = d; if (d === 0) facingLeft = false; if (d === 2) facingLeft = true; setFlip(); updateArrow();
      const nc = carPos.c + DIRS[d][0], nr = carPos.r + DIRS[d][1];
      if (!isRoad(nc, nr)) {
        const x0 = car.x, y0 = car.y;
        await run.anim(160, t => car.moveTo(x0 + DIRS[d][0] * 40 * t, y0 + DIRS[d][1] * 40 * t), ease.out);
        sfx.bump(); shake(bob);
        await run.anim(200, t => car.moveTo(x0 + DIRS[d][0] * 40 * (1 - t), y0 + DIRS[d][1] * 40 * (1 - t)), ease.out);
        crashed = i; break;
      }
      await stepTo(nc, nr, 300);
      slot && slot.classList.remove('running');
    }
    bob.classList.remove('driving');
    const arrived = crashed < 0 && carPos.c === target.stop[0] && carPos.r === target.stop[1];
    if (arrived) {
      running = false;
      while (hintL.firstChild) hintL.removeChild(hintL.firstChild);
      state.stars.code++; save();
      sfx.star(); burst(map, car.x, car.y - 40, 26);
      await run.say(pick(['You did it!', 'Perfect program!', 'Woohoo! It worked!']) + ` Booboo followed every step to the ${target.name}!`);
      if (!state.words.includes('algorithm')) await bigWord(run, 'algorithm');
      await run.say("Let's go inside!");
      return enter(target.key);
    }
    fails++;
    if (crashed >= 0) {
      bugAt = crashed;
      await run.say(`Bump! Booboo can't drive on the grass. Step ${crashed + 1} is a bug!`);
      if (!state.words.includes('debug')) await bigWord(run, 'debug');
    } else {
      await run.say(carPos.c === start.c && carPos.r === start.r ? "Booboo didn't move very far!" : `Booboo stopped, but not at the ${target.name}.`);
    }
    // back to the start, keep the program so she can fix it
    const back = el('rect', { width: 1200, height: H, fill: '#fff', opacity: 0, 'pointer-events': 'none' }, map);
    await run.anim(250, t => back.setAttribute('opacity', t * .8));
    carPos = start; heading = h0; facingLeft = f0; car.moveTo(cx(start.c), cy(start.r) - 8); setFlip(); updateArrow();
    await run.anim(250, t => back.setAttribute('opacity', (1 - t) * .8)); back.remove();
    running = busy = false; renderPanel();
    if (fails >= 2) { showHint(); await run.say('Here is a hint. Follow the dots! Fix your steps, then press Go.'); }
    else await run.say(crashed >= 0 ? 'Tap the bug step to take it out, then try again!' : 'Change your steps, then press Go again!');
  }

  function wordBook() {
    const ov = el('g', {}, s);
    el('rect', { width: W, height: H, fill: 'rgba(40,20,60,.5)' }, ov);
    const card = node(ov, 800, 450); card.inner.classList.add('pop-in');
    el('rect', { x: -740, y: -420, width: 1480, height: 840, rx: 50, fill: '#fffdf5', stroke: '#ffd54f', 'stroke-width': 10 }, card.inner);
    txt(card.inner, 0, -360, '📖 My Big Words', 48, { fill: '#7b1fa2', 'font-weight': 700 });
    const keys = Object.keys(WORDS);
    keys.forEach((k, i) => {
      const col = i % 4, row = Math.floor(i / 4);
      const x = -540 + col * 360, y = -250 + row * 140;
      const w = WORDS[k], have = state.words.includes(k);
      const c = node(card.inner, x, y); if (have) c.inner.classList.add('tap');
      el('rect', { x: -165, y: -58, width: 330, height: 116, rx: 24, fill: have ? '#f3e5f5' : '#f5f5f5', stroke: have ? '#ce93d8' : '#e0e0e0', 'stroke-width': 4 }, c.inner);
      txt(c.inner, -118, 2, have ? w.icon : '❔', 48, { class: 'emoji' });
      wrapText(c.inner, 30, 2, have ? w.word : '???', w.word.length > 13 ? 24 : 28, 13, { fill: have ? '#4a148c' : '#bdbdbd', 'font-weight': 700 });
      if (have) c.inner.addEventListener('pointerdown', e => { e.stopPropagation(); sfx.tap(); say(`${w.word}. ${w.meaning}`); });
    });
    const x = button(card.inner, 0, 360, 240, 80, 'Close', { icon: '✖', fill: '#fce4ec', stroke: '#f48fb1' });
    x.inner.addEventListener('pointerdown', e => { e.stopPropagation(); sfx.tap(); ov.remove(); });
    say(state.words.length ? `You know ${state.words.length} big words! Tap one to hear it again.` : 'No big words yet. Visit a building to learn some!');
  }

  if (mode === 'code') { target = chooseTarget(); }
  renderPanel(); drawFlag(); updateArrow();
  if (mode === 'code') {
    await run.wait(400);
    await run.say(`Code mode! Program Booboo to drive to the ${target.name}.`);
  } else if (!state.seen.town) {
    state.seen.town = 1; save();
    await run.wait(400);
    await run.say("Hi! I'm Booboo, and this is my town! Tap a building, and I'll drive us there.");
  } else {
    await run.wait(400);
    await run.say(pick(['Where should we go next?', 'Where shall we explore?', 'Pick a place to visit!']));
  }
}
