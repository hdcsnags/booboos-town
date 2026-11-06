import { el, txt } from './ui.js';

export const C = {
  pink: '#f78fb3', pinkD: '#e0649a', face: '#ffe3ec', dark: '#3d2b3d',
  car: '#ff5fa2', carD: '#d63f84',
};
let uid = 0;
export const nextId = p => `${p}${++uid}`;

/* ---------- Booboo ---------- */
export function booboHead(p, { x = 0, y = 0, s = 1 } = {}) {
  const g = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, p);
  for (const sx of [-1, 1]) {
    el('circle', { cx: sx * 47, cy: -4, r: 19, fill: C.pinkD }, g);
    el('circle', { cx: sx * 47, cy: -4, r: 11, fill: C.face }, g);
  }
  el('circle', { r: 50, fill: C.pink }, g);
  el('path', { d: 'M-6 -48 Q2 -68 14 -57 Q4 -55 5 -47 Z', fill: C.pink }, g);
  el('path', { d: 'M0 -20 C-10 -36 -40 -32 -35 -8 C-42 12 -24 38 0 38 C24 38 42 12 35 -8 C40 -32 10 -36 0 -20Z', fill: C.face }, g);
  for (const sx of [-1, 1]) {
    el('ellipse', { cx: sx * 15, cy: -9, rx: 6.5, ry: 8, fill: C.dark }, g);
    el('circle', { cx: sx * 15 + 2, cy: -12, r: 2.4, fill: '#fff' }, g);
    el('circle', { cx: sx * 26, cy: 12, r: 7, fill: '#ff9fc2', opacity: .6 }, g);
    el('ellipse', { cx: sx * 4, cy: 7, rx: 2.2, ry: 1.6, fill: C.dark }, g);
  }
  el('path', { d: 'M-12 18 Q0 30 12 18', fill: 'none', stroke: C.dark, 'stroke-width': 4, 'stroke-linecap': 'round', class: 'mouth' }, g);
  el('ellipse', { cx: 0, cy: 22, rx: 7, ry: 5, fill: '#c2185b', class: 'mouth-open' }, g);
  return g;
}
/** full Booboo, origin at head center; feet at about y=105 */
export function booboFull(p, { x = 0, y = 0, s = 1 } = {}) {
  const g = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, p);
  el('path', { d: 'M32 70 C88 80 86 8 58 16', fill: 'none', stroke: C.pinkD, 'stroke-width': 9, 'stroke-linecap': 'round' }, g);
  el('ellipse', { cx: -20, cy: 98, rx: 17, ry: 12, fill: C.pinkD }, g);
  el('ellipse', { cx: 20, cy: 98, rx: 17, ry: 12, fill: C.pinkD }, g);
  el('ellipse', { cx: 0, cy: 58, rx: 42, ry: 44, fill: C.pink }, g);
  el('ellipse', { cx: 0, cy: 64, rx: 26, ry: 30, fill: C.face }, g);
  el('path', { d: 'M-36 42 Q-62 62 -52 88', fill: 'none', stroke: C.pink, 'stroke-width': 16, 'stroke-linecap': 'round' }, g);
  el('path', { d: 'M36 42 Q62 22 62 -4', fill: 'none', stroke: C.pink, 'stroke-width': 16, 'stroke-linecap': 'round', class: 'wave-arm' }, g);
  booboHead(g, { y: -8 });
  return g;
}

/* ---------- vehicles (facing right, wheels touch y≈46) ---------- */
export function pinkCar(p) {
  const g = el('g', {}, p);
  booboHead(g, { x: -10, y: -40, s: .56 });
  el('path', { d: 'M-92 24 L-92 -4 Q-90 -20 -68 -20 L44 -20 L58 -46 L67 -43 L57 -18 L80 -14 Q95 -10 95 6 L95 24 Z', fill: C.car, stroke: C.carD, 'stroke-width': 4, 'stroke-linejoin': 'round' }, g);
  el('line', { x1: 50, y1: -22, x2: 62, y2: -44, stroke: '#cdeeff', 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
  el('path', { d: 'M-46 -2 C-54 -10 -62 -4 -56 3 L-46 11 L-36 3 C-30 -4 -38 -10 -46 -2Z', fill: '#fff', opacity: .9 }, g);
  el('circle', { cx: 88, cy: -1, r: 6, fill: '#fff59d' }, g);
  el('rect', { x: -95, y: -8, width: 6, height: 11, rx: 2, fill: '#ff1744' }, g);
  for (const x of [-55, 58]) {
    el('circle', { cx: x, cy: 24, r: 22, fill: '#37303a' }, g);
    el('circle', { cx: x, cy: 24, r: 10, fill: '#ffd1e3' }, g);
  }
  return g;
}
export function rover(p) {
  const g = el('g', {}, p);
  el('rect', { x: 48, y: -88, width: 8, height: 62, fill: '#b0bec5' }, g);
  el('rect', { x: 34, y: -106, width: 38, height: 22, rx: 6, fill: '#eceff1', stroke: '#78909c', 'stroke-width': 3 }, g);
  el('circle', { cx: 45, cy: -95, r: 5, fill: '#263238' }, g);
  el('circle', { cx: 61, cy: -95, r: 5, fill: '#263238' }, g);
  booboHead(g, { x: -22, y: -54, s: .52 });
  el('rect', { x: -84, y: -32, width: 168, height: 11, rx: 3, fill: '#3f51b5' }, g);
  for (let x = -60; x <= 60; x += 30) el('line', { x1: x, y1: -32, x2: x, y2: -21, stroke: '#9fa8da', 'stroke-width': 2 }, g);
  el('rect', { x: -72, y: -22, width: 144, height: 36, rx: 8, fill: '#eceff1', stroke: '#90a4ae', 'stroke-width': 4 }, g);
  el('rect', { x: -72, y: -6, width: 144, height: 6, fill: C.car }, g);
  el('path', { d: 'M-62 30 L-30 12 L0 30 M0 30 L30 12 L62 30', stroke: '#78909c', 'stroke-width': 6, fill: 'none' }, g);
  for (const x of [-62, 0, 62]) {
    el('circle', { cx: x, cy: 30, r: 18, fill: '#455a64' }, g);
    el('circle', { cx: x, cy: 30, r: 7, fill: '#cfd8dc' }, g);
  }
  return g;
}

/* ---------- nature ---------- */
export function spider(p, { x = 0, y = 0, s = 1 } = {}) {
  const g = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, p);
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) {
    const y0 = -14 + i * 9, y1 = -30 + i * 20;
    el('path', { d: `M0 ${y0} Q${sx * 30} ${y0 - 22} ${sx * 46} ${y1}`, fill: 'none', stroke: '#3a2747', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
  }
  el('circle', { r: 24, fill: '#5a3d6e' }, g);
  for (const sx of [-1, 1]) {
    el('circle', { cx: sx * 9, cy: -5, r: 8, fill: '#fff' }, g);
    el('circle', { cx: sx * 9 + 1, cy: -4, r: 4, fill: '#1b1020' }, g);
  }
  el('path', { d: 'M-7 9 Q0 15 7 9', fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
  el('path', { d: 'M0 -22 L-14 -32 L-14 -14Z M0 -22 L14 -32 L14 -14Z', fill: '#ff5fa2' }, g);
  el('circle', { cx: 0, cy: -22, r: 4, fill: '#ff5fa2' }, g);
  return g;
}
export function cloud(p, { x = 0, y = 0, s = 1, fill = '#fff' } = {}) {
  const g = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, p);
  const body = el('g', { fill }, g);
  el('circle', { cx: -50, cy: 10, r: 38 }, body);
  el('circle', { cx: 0, cy: -14, r: 52 }, body);
  el('circle', { cx: 52, cy: 6, r: 40 }, body);
  el('rect', { x: -80, y: 10, width: 160, height: 38, rx: 19 }, body);
  g.body = body;
  return g;
}
export function sun(p, { x = 0, y = 0, s = 1 } = {}) {
  const g = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, p);
  const rays = el('g', { class: 'spin' }, g);
  for (let i = 0; i < 12; i++) {
    const a = i * 30 * Math.PI / 180;
    el('line', { x1: Math.cos(a) * 72, y1: Math.sin(a) * 72, x2: Math.cos(a) * 98, y2: Math.sin(a) * 98, stroke: '#ffca28', 'stroke-width': 10, 'stroke-linecap': 'round' }, rays);
  }
  el('circle', { r: 62, fill: '#ffd54f', stroke: '#ffca28', 'stroke-width': 6 }, g);
  el('circle', { cx: -20, cy: -8, r: 6, fill: '#6d4c41' }, g);
  el('circle', { cx: 20, cy: -8, r: 6, fill: '#6d4c41' }, g);
  el('path', { d: 'M-20 16 Q0 32 20 16', fill: 'none', stroke: '#6d4c41', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
  return g;
}
export function tree(p, x, y, s = 1) {
  const g = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, p);
  el('rect', { x: -7, y: -30, width: 14, height: 32, rx: 4, fill: '#8d6e63' }, g);
  el('circle', { cx: 0, cy: -48, r: 30, fill: '#66bb6a' }, g);
  el('circle', { cx: -16, cy: -36, r: 20, fill: '#5cad60' }, g);
  el('circle', { cx: 16, cy: -38, r: 20, fill: '#76c77a' }, g);
  return g;
}
export function flower(p, x, y, color = '#ff80ab') {
  const g = el('g', { transform: `translate(${x} ${y})` }, p);
  el('line', { x1: 0, y1: 0, x2: 0, y2: -16, stroke: '#558b2f', 'stroke-width': 3 }, g);
  for (let i = 0; i < 5; i++) { const a = i * 72 * Math.PI / 180; el('circle', { cx: Math.cos(a) * 6, cy: -18 + Math.sin(a) * 6, r: 5, fill: color }, g); }
  el('circle', { cx: 0, cy: -18, r: 3.5, fill: '#ffeb3b' }, g);
  return g;
}

/* ---------- planets ---------- */
export const PLANETS = {
  Mercury: { color: '#a8a3a0', rocky: true, order: 1, size: 8, radiusKm: 2440 },
  Venus: { color: '#f2cf86', rocky: true, order: 2, size: 6, radiusKm: 6052 },
  Earth: { color: '#4fb3f0', rocky: true, order: 3, size: 5, radiusKm: 6371 },
  Mars: { color: '#e2704f', rocky: true, order: 4, size: 7, radiusKm: 3390 },
  Jupiter: { color: '#dfb184', rocky: false, order: 5, size: 1, radiusKm: 69911 },
  Saturn: { color: '#efd59a', rocky: false, order: 6, size: 2, radiusKm: 58232 },
  Uranus: { color: '#9fe3ea', rocky: false, order: 7, size: 3, radiusKm: 25362 },
  Neptune: { color: '#4f6fe6', rocky: false, order: 8, size: 4, radiusKm: 24622 },
};
export const PLANET_NAMES = Object.keys(PLANETS);
export function planet(p, name, r, { x = 0, y = 0 } = {}) {
  const P = PLANETS[name];
  const g = el('g', { transform: `translate(${x} ${y})` }, p);
  const id = nextId('pc');
  const cp = el('clipPath', { id }, g); el('circle', { r }, cp);
  if (name === 'Saturn') el('ellipse', { rx: r * 1.9, ry: r * .45, fill: 'none', stroke: '#d9bf86', 'stroke-width': r * .22, transform: 'rotate(-14)' }, g);
  if (name === 'Uranus') el('ellipse', { rx: r * .3, ry: r * 1.5, fill: 'none', stroke: '#c9f1f5', 'stroke-width': r * .06, transform: 'rotate(-8)' }, g);
  el('circle', { r, fill: P.color }, g);
  const f = el('g', { 'clip-path': `url(#${id})` }, g);
  if (name === 'Mercury') [[-.3, -.3, .2], [.35, .1, .15], [-.1, .45, .12], [.2, -.5, .1]].forEach(([a, b, c]) => el('circle', { cx: a * r, cy: b * r, r: c * r, fill: '#8a8582' }, f));
  if (name === 'Venus') [-.4, 0, .4].forEach((b, i) => el('path', { d: `M${-r} ${b * r} Q0 ${(b - .25) * r} ${r} ${b * r}`, stroke: '#e3b866', 'stroke-width': r * .16, fill: 'none' }, f));
  if (name === 'Earth') {
    el('path', { d: `M${-.6 * r} ${-.5 * r} q${.4 * r} ${-.2 * r} ${.5 * r} ${.2 * r} q${-.1 * r} ${.4 * r} ${-.4 * r} ${.5 * r} q${-.3 * r} ${-.3 * r} ${-.1 * r} ${-.7 * r}Z`, fill: '#66bb6a' }, f);
    el('path', { d: `M${.2 * r} ${.1 * r} q${.4 * r} ${-.1 * r} ${.5 * r} ${.3 * r} q${-.2 * r} ${.4 * r} ${-.4 * r} ${.3 * r}Z`, fill: '#66bb6a' }, f);
    el('ellipse', { cx: 0, cy: -.92 * r, rx: .6 * r, ry: .18 * r, fill: '#fff' }, f);
  }
  if (name === 'Mars') { [[-.3, -.2, .18], [.3, .3, .14], [.1, -.5, .1]].forEach(([a, b, c]) => el('circle', { cx: a * r, cy: b * r, r: c * r, fill: '#b9533a' }, f)); el('ellipse', { cx: 0, cy: -.95 * r, rx: .4 * r, ry: .12 * r, fill: '#fff' }, f); }
  if (name === 'Jupiter') {
    [-.6, -.25, .1, .45].forEach((b, i) => el('rect', { x: -r, y: b * r, width: 2 * r, height: .16 * r, fill: i % 2 ? '#c48a5a' : '#b97a4c' }, f));
    el('ellipse', { cx: .3 * r, cy: .3 * r, rx: .22 * r, ry: .13 * r, fill: '#c1442e' }, f);
  }
  if (name === 'Saturn') [-.4, 0, .35].forEach(b => el('rect', { x: -r, y: b * r, width: 2 * r, height: .13 * r, fill: '#d8b878' }, f));
  if (name === 'Neptune') { el('ellipse', { cx: -.2 * r, cy: -.1 * r, rx: .2 * r, ry: .12 * r, fill: '#2c3e9e' }, f); el('rect', { x: -r, y: .35 * r, width: 2 * r, height: .1 * r, fill: '#6f8cf0' }, f); }
  el('circle', { cx: -.3 * r, cy: -.3 * r, r: r * .9, fill: '#fff', opacity: .12 }, f);
  el('circle', { r, fill: 'none', stroke: 'rgba(0,0,0,.18)', 'stroke-width': 3 }, g);
  if (name === 'Saturn') el('path', { d: `M${-1.9 * r} 0 A${1.9 * r} ${.45 * r} 0 0 0 ${1.9 * r} 0`, fill: 'none', stroke: '#d9bf86', 'stroke-width': r * .22, transform: 'rotate(-14)' }, g);
  return g;
}

/* ---------- town buildings (origin = bottom center) ---------- */
function sign(g, text, y = -16) {
  const w = text.length * 15 + 34;
  el('rect', { x: -w / 2, y: y - 19, width: w, height: 38, rx: 19, fill: '#fff', stroke: '#f48fb1', 'stroke-width': 4 }, g);
  txt(g, 0, y + 1, text, 25, { fill: '#6a1b4d', 'font-weight': 700 });
}
export function spiderHouse(p) {
  const g = el('g', {}, p);
  el('rect', { x: -100, y: -112, width: 200, height: 112, fill: '#fff3e0', stroke: '#e0c9a6', 'stroke-width': 4 }, g);
  el('polygon', { points: '-116,-110 0,-170 116,-110', fill: '#ff8a65', stroke: '#e6704d', 'stroke-width': 4, 'stroke-linejoin': 'round' }, g);
  el('rect', { x: -78, y: -96, width: 44, height: 40, rx: 6, fill: '#bbdefb', stroke: '#e0c9a6', 'stroke-width': 4 }, g);
  el('rect', { x: 22, y: -96, width: 44, height: 40, rx: 6, fill: '#bbdefb', stroke: '#e0c9a6', 'stroke-width': 4 }, g);
  el('rect', { x: 86, y: -118, width: 16, height: 118, rx: 4, fill: '#90a4ae' }, g);
  el('polygon', { points: '80,-122 108,-122 102,-110 86,-110', fill: '#78909c' }, g);
  el('line', { x1: 94, y1: -150, x2: 94, y2: -80, stroke: '#ccc', 'stroke-width': 1.5 }, g);
  spider(g, { x: 94, y: -72, s: .42 });
  sign(g, 'Itsy Bitsy Spider');
  return g;
}
export function rainbowLab(p) {
  const g = el('g', {}, p);
  el('rect', { x: -100, y: -100, width: 200, height: 100, fill: '#e3f2fd', stroke: '#90caf9', 'stroke-width': 4 }, g);
  el('path', { d: 'M-74 -100 A74 74 0 0 1 74 -100Z', fill: '#fff', stroke: '#90caf9', 'stroke-width': 4 }, g);
  ['#ef5350', '#ffa726', '#ffee58', '#66bb6a', '#42a5f5', '#7e57c2'].forEach((c, i) => {
    const r = 62 - i * 8;
    el('path', { d: `M${-r} -100 A${r} ${r} 0 0 1 ${r} -100`, fill: 'none', stroke: c, 'stroke-width': 8 }, g);
  });
  for (const x of [-70, 30]) el('rect', { x, y: -84, width: 40, height: 34, rx: 6, fill: '#fff9c4', stroke: '#90caf9', 'stroke-width': 4 }, g);
  el('polygon', { points: '0,-88 -16,-60 16,-60', fill: '#e1f5fe', stroke: '#4fc3f7', 'stroke-width': 3 }, g);
  sign(g, 'Rainbow Lab');
  return g;
}
export function spaceCenter(p) {
  const g = el('g', {}, p);
  el('rect', { x: -100, y: -82, width: 170, height: 82, fill: '#ede7f6', stroke: '#b39ddb', 'stroke-width': 4 }, g);
  el('rect', { x: -84, y: -132, width: 40, height: 52, fill: '#d1c4e9', stroke: '#b39ddb', 'stroke-width': 4 }, g);
  el('path', { d: 'M-90 -150 A26 14 -20 0 0 -40 -146', fill: '#fff', stroke: '#9575cd', 'stroke-width': 4 }, g);
  el('line', { x1: -64, y1: -132, x2: -66, y2: -146, stroke: '#9575cd', 'stroke-width': 4 }, g);
  for (const x of [-30, 16]) el('rect', { x, y: -66, width: 34, height: 28, rx: 5, fill: '#b3e5fc', stroke: '#b39ddb', 'stroke-width': 3 }, g);
  const r = el('g', { transform: 'translate(98 0)', class: 'town-rocket' }, g);
  el('path', { d: 'M0 -150 C18 -128 18 -60 14 -20 L-14 -20 C-18 -60 -18 -128 0 -150Z', fill: '#fff', stroke: '#b0bec5', 'stroke-width': 3 }, r);
  el('path', { d: 'M0 -150 C10 -138 13 -126 14 -116 L-14 -116 C-13 -126 -10 -138 0 -150Z', fill: C.car }, r);
  el('circle', { cx: 0, cy: -84, r: 8, fill: '#81d4fa', stroke: '#b0bec5', 'stroke-width': 3 }, r);
  el('path', { d: 'M-14 -44 L-28 -8 L-14 -20Z M14 -44 L28 -8 L14 -20Z', fill: C.car }, r);
  el('rect', { x: -6, y: -20, width: 12, height: 18, fill: '#90a4ae' }, r);
  sign(g, 'Space Center');
  return g;
}
export function homeHouse(p) {
  const g = el('g', {}, p);
  el('rect', { x: -72, y: -88, width: 144, height: 88, fill: '#fce4ec', stroke: '#f48fb1', 'stroke-width': 4 }, g);
  el('polygon', { points: '-86,-86 0,-140 86,-86', fill: '#d81b60', stroke: '#ad1457', 'stroke-width': 4, 'stroke-linejoin': 'round' }, g);
  el('path', { d: 'M0 -100 C-10 -112 -24 -104 -16 -92 L0 -80 L16 -92 C24 -104 10 -112 0 -100Z', fill: '#fff' }, g);
  el('rect', { x: 26, y: -76, width: 32, height: 30, rx: 5, fill: '#bbdefb', stroke: '#f48fb1', 'stroke-width': 3 }, g);
  el('rect', { x: -58, y: -76, width: 32, height: 30, rx: 5, fill: '#bbdefb', stroke: '#f48fb1', 'stroke-width': 3 }, g);
  sign(g, "Booboo's House");
  return g;
}
export function construction(p, label, emoji) {
  const g = el('g', {}, p);
  el('rect', { x: -70, y: -60, width: 70, height: 60, fill: '#cfd8dc', stroke: '#90a4ae', 'stroke-width': 3, 'stroke-dasharray': '8 6' }, g);
  el('line', { x1: 40, y1: 0, x2: 40, y2: -140, stroke: '#fbc02d', 'stroke-width': 8 }, g);
  el('line', { x1: -40, y1: -136, x2: 90, y2: -136, stroke: '#fbc02d', 'stroke-width': 8 }, g);
  el('line', { x1: -30, y1: -136, x2: -30, y2: -96, stroke: '#616161', 'stroke-width': 3 }, g);
  el('rect', { x: -42, y: -96, width: 24, height: 16, fill: '#ff7043' }, g);
  for (let x = -90; x < 90; x += 22) el('rect', { x, y: -26, width: 14, height: 26, fill: x % 44 ? '#fff' : '#ff9800' }, g);
  txt(g, -34, -32, emoji, 40, { class: 'emoji' });
  sign(g, label + ' 🚧', 6);
  return g;
}

/* ---------- the newer buildings ---------- */
export function gardenLab(p) {
  const g = el('g', {}, p);
  el('rect', { x: -84, y: -8, width: 168, height: 8, fill: '#8d6e63' }, g);
  el('path', { d: 'M-80 0 L-80 -70 A80 70 0 0 1 80 -70 L80 0Z', fill: 'rgba(225,245,254,.85)', stroke: '#81c784', 'stroke-width': 5 }, g);
  for (const x of [-40, 0, 40]) el('line', { x1: x, y1: 0, x2: x, y2: x ? -128 : -140, stroke: '#a5d6a7', 'stroke-width': 3 }, g);
  el('line', { x1: -80, y1: -70, x2: 80, y2: -70, stroke: '#a5d6a7', 'stroke-width': 3 }, g);
  [[-58, '#66bb6a'], [-20, '#43a047'], [22, '#66bb6a'], [58, '#43a047']].forEach(([x, c]) => {
    el('path', { d: `M${x} -8 Q${x - 14} -40 ${x} -52 Q${x + 14} -40 ${x} -8Z`, fill: c }, g);
  });
  // a sunflower on top
  el('line', { x1: 0, y1: -140, x2: 0, y2: -168, stroke: '#558b2f', 'stroke-width': 5 }, g);
  for (let i = 0; i < 10; i++) { const a = i * 36 * Math.PI / 180; el('ellipse', { cx: Math.cos(a) * 14, cy: -178 + Math.sin(a) * 14, rx: 9, ry: 5, fill: '#ffd54f', transform: `rotate(${i * 36} ${Math.cos(a) * 14} ${-178 + Math.sin(a) * 14})` }, g); }
  el('circle', { cx: 0, cy: -178, r: 10, fill: '#6d4c41' }, g);
  sign(g, 'Garden Lab');
  return g;
}
export function bakery(p) {
  const g = el('g', {}, p);
  el('rect', { x: -78, y: -100, width: 156, height: 100, fill: '#fff8e1', stroke: '#ffcc80', 'stroke-width': 4 }, g);
  for (let i = 0; i < 6; i++) el('path', { d: `M${-84 + i * 28} -104 h28 v18 a14 14 0 0 1 -28 0Z`, fill: i % 2 ? '#fff' : '#f06292' }, g);
  el('rect', { x: -60, y: -66, width: 50, height: 40, rx: 6, fill: '#bbdefb', stroke: '#ffcc80', 'stroke-width': 4 }, g);
  el('rect', { x: 18, y: -66, width: 40, height: 66, rx: 6, fill: '#a1887f', stroke: '#ffcc80', 'stroke-width': 4 }, g);
  // giant cupcake on the roof
  el('path', { d: 'M-30 -104 L-22 -136 L22 -136 L30 -104Z', fill: '#ffb74d', stroke: '#f57c00', 'stroke-width': 3 }, g);
  el('path', { d: 'M-30 -136 Q-34 -160 -10 -160 Q0 -182 10 -160 Q34 -160 30 -136Z', fill: '#f8bbd0', stroke: '#ec407a', 'stroke-width': 3 }, g);
  el('circle', { cx: 0, cy: -178, r: 8, fill: '#e53935' }, g);
  sign(g, 'Number Bakery');
  return g;
}
export function trainStation(p) {
  const g = el('g', {}, p);
  el('rect', { x: -112, y: -14, width: 224, height: 14, fill: '#a1887f' }, g);
  el('rect', { x: -100, y: -96, width: 90, height: 82, fill: '#e3f2fd', stroke: '#64b5f6', 'stroke-width': 4 }, g);
  el('polygon', { points: '-110,-94 -55,-128 0,-94', fill: '#1e88e5', stroke: '#1565c0', 'stroke-width': 3, 'stroke-linejoin': 'round' }, g);
  el('circle', { cx: -55, cy: -70, r: 14, fill: '#fff', stroke: '#1565c0', 'stroke-width': 3 }, g);
  el('path', { d: 'M-55 -70 V-79 M-55 -70 H-48', stroke: '#1565c0', 'stroke-width': 3 }, g);
  // little engine
  const t = el('g', { transform: 'translate(40 -14)' }, g);
  el('rect', { x: -26, y: -56, width: 70, height: 40, rx: 6, fill: '#e53935' }, t);
  el('rect', { x: -24, y: -84, width: 30, height: 30, rx: 4, fill: '#c62828' }, t);
  el('rect', { x: -18, y: -78, width: 18, height: 14, rx: 3, fill: '#bbdefb' }, t);
  el('rect', { x: 24, y: -74, width: 12, height: 20, fill: '#424242' }, t);
  for (const x of [-12, 12, 32]) el('circle', { cx: x, cy: -12, r: 10, fill: '#424242', stroke: '#9e9e9e', 'stroke-width': 3 }, t);
  sign(g, 'Train Station');
  return g;
}
/** a sunflower at a life-cycle stage: 0 seed, 1 sprout, 2 seedling, 3 bud, 4 flower, 5 seed head */
export function plantStage(p, stage, { x = 0, y = 0, s = 1 } = {}) {
  const g = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, p);
  if (stage === 0) {
    el('ellipse', { cx: 0, cy: -10, rx: 16, ry: 24, fill: '#5d4037', transform: 'rotate(20 0 -10)' }, g);
    el('path', { d: 'M-4 -28 Q4 -12 -2 8', stroke: '#d7ccc8', 'stroke-width': 3, fill: 'none' }, g);
    return g;
  }
  const h = [0, 40, 80, 130, 150, 150][stage];
  el('path', { d: `M0 0 Q${stage > 2 ? 6 : 3} ${-h / 2} 0 ${-h}`, stroke: '#558b2f', 'stroke-width': stage > 2 ? 9 : 6, fill: 'none', 'stroke-linecap': 'round' }, g);
  const leaf = (lx, ly, dir, sz) => el('path', { d: `M${lx} ${ly} q${dir * sz} ${-sz * .9} ${dir * sz * 1.7} ${-sz * .2} q${-dir * sz * .7} ${sz * .9} ${-dir * sz * 1.7} ${sz * .2}Z`, fill: '#7cb342' }, g);
  if (stage === 1) { leaf(0, -h, -1, 14); leaf(0, -h, 1, 14); return g; }
  leaf(0, -h * .45, -1, 24); leaf(0, -h * .6, 1, 24);
  if (stage >= 3) { leaf(0, -h * .25, 1, 28); leaf(0, -h * .8, -1, 22); }
  if (stage === 2) { leaf(0, -h, -1, 16); leaf(0, -h, 1, 16); return g; }
  if (stage === 3) { el('circle', { cx: 0, cy: -h - 10, r: 14, fill: '#9ccc65', stroke: '#689f38', 'stroke-width': 3 }, g); return g; }
  const petals = stage === 4 ? '#ffd54f' : '#c5a24a';
  for (let i = 0; i < 14; i++) { const a = i * (360 / 14); el('ellipse', { cx: 0, cy: -h - 10 - 30, rx: 9, ry: 20, fill: petals, opacity: stage === 5 ? .55 : 1, transform: `rotate(${a} 0 ${-h - 10})` }, g); }
  el('circle', { cx: 0, cy: -h - 10, r: 24, fill: '#6d4c41' }, g);
  if (stage === 5) for (let i = 0; i < 16; i++) { const a = i * 2.4, r = 4 + i * 1.2; el('ellipse', { cx: Math.cos(a) * r, cy: -h - 10 + Math.sin(a) * r, rx: 3, ry: 4.5, fill: '#efebe9' }, g); }
  return g;
}
