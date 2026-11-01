import { say, onSpeaking } from './speech.js';
import { sfx } from './audio.js';
import { state, save, pick } from './state.js';
import { animate, ease } from './run.js';
import { go } from './nav.js';
import { WORDS } from './words.js';

export const NS = 'http://www.w3.org/2000/svg';
export const W = 1600, H = 900;
export const stage = () => document.getElementById('stage');

export function el(tag, attrs = {}, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) {
    const v = attrs[k];
    if (v == null) continue;
    if (k === 'text') e.textContent = v; else e.setAttribute(k, v);
  }
  if (parent) parent.appendChild(e);
  return e;
}
/** text helper: centered by default */
export function txt(parent, x, y, text, size = 32, attrs = {}) {
  return el('text', { x, y, 'font-size': size, 'text-anchor': 'middle', 'dominant-baseline': 'middle', text, ...attrs }, parent);
}
/** wrap text into lines of about `max` characters, centered on x */
export function wrapText(parent, x, y, text, size, max, attrs = {}) {
  const words = text.split(' '), lines = [];
  let line = '';
  for (const w of words) { if ((line + ' ' + w).trim().length > max && line) { lines.push(line); line = w; } else line = (line + ' ' + w).trim(); }
  if (line) lines.push(line);
  const t = el('text', { x, y: y - (lines.length - 1) * size * .6, 'font-size': size, 'text-anchor': 'middle', 'dominant-baseline': 'middle', ...attrs }, parent);
  lines.forEach((l, i) => el('tspan', { x, dy: i ? size * 1.2 : 0, text: l }, t));
  return t;
}
/** A positioned group with an inner group: CSS animations go on .inner so they don't fight the transform. */
export function node(parent, x = 0, y = 0, cls = '') {
  const o = el('g', { transform: `translate(${x} ${y})` }, parent);
  const i = el('g', { class: cls }, o);
  o.inner = i; o.x = x; o.y = y; o.s = 1;
  o.moveTo = (nx, ny, s = o.s) => { o.x = nx; o.y = ny; o.s = s; o.setAttribute('transform', `translate(${nx} ${ny})${s !== 1 ? ` scale(${s})` : ''}`); };
  return o;
}
export function moveTo(n, x, y, dur, run, e = ease.inOut) {
  const x0 = n.x, y0 = n.y;
  const f = t => n.moveTo(x0 + (x - x0) * t, y0 + (y - y0) * t);
  return run ? run.anim(dur, f, e) : animate(dur, f, e);
}
export function svgPoint(evt) {
  const s = stage(), p = s.createSVGPoint();
  p.x = evt.clientX; p.y = evt.clientY;
  return p.matrixTransform(s.getScreenCTM().inverse());
}
/**
 * Let her drag a thing toward `target`. Toddler-friendly: any tap or release glides it the rest of
 * the way, so the drag is the fun part, never a test of fine motor control.
 */
export async function drag(run, n, target, { dur = 700 } = {}) {
  run.check();
  const g = n.inner; g.classList.add('tap'); pulse(g);
  await new Promise(res => {
    let start = null, ox = 0, oy = 0;
    const move = e => { if (!start) return; const p = svgPoint(e); n.moveTo(p.x + ox, p.y + oy); };
    const up = () => {
      if (!start) return; start = null;
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up);
      g.removeEventListener('pointerdown', down);
      moveTo(n, target[0], target[1], dur, null, ease.out).then(res);
    };
    const down = e => {
      e.stopPropagation(); e.preventDefault(); pulse(g, false);
      const p = svgPoint(e); start = p; ox = n.x - p.x; oy = n.y - p.y;
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
    };
    g.addEventListener('pointerdown', down);
  });
  g.classList.remove('tap');
  run.check();
}
export function shake(g) { g.classList.remove('shake'); void g.getBoundingClientRect(); g.classList.add('shake'); }
export function pulse(g, on = true) { g.classList.toggle('pulse', on); }

/** star burst */
export function burst(parent, x, y, n = 16, colors = ['#ffd54f', '#ff80ab', '#80d8ff', '#b9f6ca', '#ea80fc']) {
  const g = el('g', { 'pointer-events': 'none' }, parent);
  const parts = [];
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = 250 + Math.random() * 350;
    const p = el('path', { d: 'M0 -14 L4 -4 L14 -4 L6 3 L9 13 L0 7 L-9 13 L-6 3 L-14 -4 L-4 -4Z', fill: pick(colors) }, g);
    parts.push({ p, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 200, r: Math.random() * 360 });
  }
  animate(1100, t => {
    for (const q of parts) {
      const x1 = x + q.vx * t * 1.1, y1 = y + q.vy * t * 1.1 + 500 * t * t;
      q.p.setAttribute('transform', `translate(${x1} ${y1}) rotate(${q.r + t * 300}) scale(${1.4 - t})`);
      q.p.setAttribute('opacity', 1 - t * t);
    }
  }, ease.linear).then(() => g.remove());
}

export const PRAISE = ['Yes!', 'You got it!', 'Brilliant!', 'Super thinking!', 'Exactly right!', 'Wow, smart!', 'That\'s it!', 'Great job, scientist!'];
export const TRY = ['Hmm, not that one. Try another!', 'Good try! Look again.', 'Ooh, close! Think about it again.', 'Not quite. You can do it!'];

/**
 * Show answer tiles and wait for the right one. Never "wrong": a miss wiggles, gives a hint, and after
 * two misses the right tile glows. options: [{label, icon, draw(g,w,h), correct, why, bg}]
 * Resolves { misses, index }.
 */
export async function ask(run, { prompt, options, y = 640, tileW = 210, tileH = 190, gap = 26, hint, keep = false, parent }) {
  run.check();
  const L = el('g', { class: 'ask' }, parent || stage());
  const n = options.length, total = n * tileW + (n - 1) * gap, x0 = (W - total) / 2;
  let misses = 0, finished = false, resolve;
  const done = new Promise(r => resolve = r);
  const tiles = options.map((o, i) => {
    const t = node(L, x0 + i * (tileW + gap) + tileW / 2, y + tileH / 2);
    const g = t.inner; g.classList.add('tap', 'tile-in'); g.style.animationDelay = (i * 60) + 'ms';
    el('rect', { x: -tileW / 2, y: -tileH / 2 + 6, width: tileW, height: tileH, rx: 30, fill: 'rgba(0,0,0,.18)' }, g);
    el('rect', { x: -tileW / 2, y: -tileH / 2, width: tileW, height: tileH, rx: 30, fill: o.bg || '#fff', stroke: o.stroke || '#ffd1e3', 'stroke-width': 6 }, g);
    if (o.draw) o.draw(g, tileW, tileH);
    else {
      if (o.icon) txt(g, 0, o.label ? -18 : 4, o.icon, o.iconSize || (o.label ? 76 : 96), { class: 'emoji' });
      if (o.label) wrapText(g, 0, o.icon ? tileH / 2 - 36 : 0, String(o.label), o.labelSize || (o.icon ? 28 : 64), o.icon ? 14 : 10, { class: 'lbl', 'font-weight': 600 });
    }
    t.opt = o; t.i = i; if (o.correct) g.dataset.correct = '1';
    g.addEventListener('pointerdown', e => {
      e.stopPropagation();
      if (finished || !run.alive || t.dead) return;
      if (o.correct) {
        finished = true; sfx.chime(); pulse(g, false); g.classList.add('right');
        burst(L, t.x, t.y - tileH / 2);
        setTimeout(() => { if (!keep) L.remove(); resolve({ misses, index: i }); }, 500);
      } else {
        misses++; sfx.boing(); shake(g); t.dead = true; g.style.opacity = .4;
        const h = o.why || (typeof hint === 'function' ? hint(o, misses) : hint) || pick(TRY);
        run.last = h; say(h);
        if (misses >= 2) { const c = tiles.find(x => x.opt.correct); if (c) pulse(c.inner); }
      }
    });
    return t;
  });
  if (prompt) { run.last = prompt; say(prompt); }
  const r = await done;
  run.check();
  r.layer = L;
  return r;
}
export const praise = misses => misses ? pick(['There you go!', 'You figured it out!', 'Yes! Good thinking.']) : pick(PRAISE);

/** a big rounded button; returns its node */
export function button(parent, x, y, w, h, label, { fill = '#fff', color = '#5d3a6a', size = 34, icon, stroke = '#ffd1e3' } = {}) {
  const b = node(parent, x, y); const g = b.inner; g.classList.add('tap');
  el('rect', { x: -w / 2, y: -h / 2 + 5, width: w, height: h, rx: h / 2.6, fill: 'rgba(0,0,0,.18)' }, g);
  el('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2.6, fill, stroke, 'stroke-width': 5 }, g);
  txt(g, 0, 3, (icon ? icon + '  ' : '') + label, size, { fill: color, 'font-weight': 700 });
  return b;
}

/** The Big Word card: pop up, say it, invite her to say it back. */
export async function bigWord(run, key) {
  const w = WORDS[key];
  if (!state.words.includes(key)) { state.words.push(key); save(); }
  const ov = el('g', {}, stage());
  el('rect', { width: W, height: H, fill: 'rgba(40,20,60,.35)' }, ov);
  const card = node(ov, 800, 430); const g = card.inner; g.classList.add('pop-in');
  el('rect', { x: -440, y: -230, width: 880, height: 460, rx: 46, fill: '#fffdf5', stroke: '#ffb300', 'stroke-width': 10 }, g);
  txt(g, 0, -185, '⭐  BIG WORD  ⭐', 34, { fill: '#ff8f00', 'font-weight': 700 });
  txt(g, 0, -105, w.icon, 96, { class: 'emoji' });
  txt(g, 0, -5, w.word.toUpperCase(), w.word.length > 13 ? 62 : 74, { fill: '#7b1fa2', 'font-weight': 700 });
  txt(g, 0, 62, w.syll, 36, { fill: '#ab47bc' });
  wrapText(g, 0, 150, w.meaning, 30, 48, { fill: '#4e4e5e' });
  sfx.star();
  await run.say(`${w.word}! ${w.meaning}`);
  await run.wait(300);
  await run.say(`Can you say ${w.word}?`);
  await run.wait(1600);
  ov.remove();
}

/** The guide (Booboo) bobs and talks while the voice speaks. */
export function attachGuide(g) {
  onSpeaking(v => { if (g && g.isConnected) g.classList.toggle('talking', v); });
}

/** Home + repeat buttons every scene gets. */
export function sceneButtons(run) {
  const s = stage();
  const home = node(s, 74, 74); home.inner.classList.add('tap');
  el('circle', { r: 52, fill: 'rgba(255,255,255,.92)', stroke: '#ffd1e3', 'stroke-width': 6 }, home.inner);
  txt(home.inner, 0, 4, '🏠', 52, { class: 'emoji' });
  home.inner.addEventListener('pointerdown', e => { e.stopPropagation(); sfx.tap(); go('town'); });
  const rep = node(s, 192, 74); rep.inner.classList.add('tap');
  el('circle', { r: 52, fill: 'rgba(255,255,255,.92)', stroke: '#ffd1e3', 'stroke-width': 6 }, rep.inner);
  txt(rep.inner, 0, 4, '🔊', 48, { class: 'emoji' });
  rep.inner.addEventListener('pointerdown', e => { e.stopPropagation(); if (run.last) say(run.last); });
}

/** End of a building visit: star, then Play again / Town (+ optional extra button). */
export async function finish(run, key, message, extra) {
  state.stars[key] = (state.stars[key] || 0) + 1; save();
  const ov = el('g', {}, stage());
  el('rect', { width: W, height: H, fill: 'rgba(40,20,60,.45)' }, ov);
  const card = node(ov, 800, 400); card.inner.classList.add('pop-in');
  el('rect', { x: -460, y: -260, width: 920, height: 520, rx: 50, fill: '#fffdf5', stroke: '#ffb300', 'stroke-width': 10 }, card.inner);
  const star = node(card.inner, 0, -140); star.inner.classList.add('spin-slow');
  txt(star.inner, 0, 0, '⭐', 150, { class: 'emoji' });
  wrapText(card.inner, 0, 10, message, 36, 40, { fill: '#5d3a6a', 'font-weight': 600 });
  txt(card.inner, 0, 100, `Stars here: ${'⭐'.repeat(Math.min(state.stars[key], 10))}${state.stars[key] > 10 ? ' +' + (state.stars[key] - 10) : ''}`, 30, { fill: '#8d6e63' });
  sfx.star(); burst(ov, 800, 260, 30);
  const btns = [button(card.inner, extra ? -290 : -170, 190, 260, 100, 'Again', { icon: '🔁', fill: '#e1f5fe', stroke: '#81d4fa' }),
    button(card.inner, extra ? 0 : 170, 190, 260, 100, 'Town', { icon: '🏠', fill: '#fce4ec', stroke: '#f48fb1' })];
  if (extra) btns.push(button(card.inner, 290, 190, 260, 100, extra.label, { icon: extra.icon, fill: '#ede7f6', stroke: '#b39ddb', size: 30 }));
  run.say(message);
  for (;;) {
    const i = await run.tapAny(btns.map(b => b.inner));
    sfx.tap();
    if (i === 0) return go(key);
    if (i === 1) return go('town');
    extra.onTap();
  }
}
