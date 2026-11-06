import { el, txt, node, ask, pulse, shake, TRY, attachGuide } from '../ui.js';
import { booboFull } from '../art.js';
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { shuffle, pick } from '../state.js';

/**
 * Put things in order: numbered slots fill one at a time, the answers are tiles below.
 * items: [{ draw(g, w, h) }] in the right order. prompt(i) and hint(i, chosenItem) give the words.
 */
export async function orderGame(run, root, { items, prompt, hint, y = 300, gap = 230, askY = 560, bg = '#fff', stroke = '#c5e1a5', numColor = '#9ccc65' }) {
  const n = items.length, x0 = 800 - (n - 1) * gap / 2;
  const slots = items.map((_, i) => {
    if (i < n - 1) txt(root, x0 + i * gap + gap / 2, y, '➜', 40, { fill: '#a1887f' });
    const s = node(root, x0 + i * gap, y);
    el('rect', { x: -95, y: -105, width: 190, height: 210, rx: 28, fill: 'rgba(255,255,255,.65)', stroke, 'stroke-width': 5, 'stroke-dasharray': '10 8' }, s.inner);
    txt(s.inner, 0, 0, String(i + 1), 60, { fill: numColor, 'font-weight': 700 });
    return s;
  });
  let rest = shuffle(items.slice());
  for (let i = 0; i < n; i++) {
    const a = items[i];
    pulse(slots[i].inner);
    await ask(run, {
      prompt: prompt(i, n), y: askY, tileW: 190, tileH: 210, gap: 22,
      options: rest.map(it => ({ draw: it.draw, correct: it === a, it, bg, stroke })),
      hint: o => hint(i, o.it),
    });
    rest = rest.filter(x => x !== a);
    pulse(slots[i].inner, false);
    while (slots[i].inner.firstChild) slots[i].inner.removeChild(slots[i].inner.firstChild);
    el('rect', { x: -95, y: -105, width: 190, height: 210, rx: 28, fill: bg, stroke, 'stroke-width': 5 }, slots[i].inner);
    a.draw(slots[i].inner, 190, 210);
    slots[i].inner.classList.add('pop-in');
    sfx.pop();
  }
  return slots;
}

/**
 * Tap the right thing in the picture (a part of a plant, a train carriage...).
 * parts: { key: <g> }. A wrong tap says what that part IS (so it still teaches), and after two
 * misses the right one glows. Resolves the number of misses.
 */
export async function tapPart(run, parts, right, { prompt, about = {} }) {
  run.check();
  const keys = Object.keys(parts);
  keys.forEach(k => { parts[k].classList.add('tap'); if (k === right) parts[k].dataset.correct = '1'; else delete parts[k].dataset.correct; });
  if (prompt) { run.last = prompt; say(prompt); }
  let misses = 0;
  for (;;) {
    const i = await run.tapAny(keys.map(k => parts[k]));
    const k = keys[i];
    if (k === right) break;
    misses++; sfx.boing(); shake(parts[k]);
    const h = about[k] || pick(TRY); run.last = h; say(h);
    if (misses >= 2) pulse(parts[right]);
  }
  keys.forEach(k => { parts[k].classList.remove('tap'); delete parts[k].dataset.correct; });
  pulse(parts[right], false);
  sfx.chime();
  return misses;
}

/** answer options for a number question: the answer plus near misses, shuffled */
export function numOpts(ans, ...near) {
  const all = [ans, ...near].filter((x, i, a) => x > 0 && a.indexOf(x) === i).slice(0, 3);
  return shuffle(all).map(x => ({ label: String(x), correct: x === ans, labelSize: 64 }));
}

export function guide(parent) {
  const g = node(parent, 1500, 752); booboFull(g.inner, { s: .6 }); g.inner.classList.add('guide'); attachGuide(g.inner);
  return g;
}
