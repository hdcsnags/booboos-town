import { el, txt, node, stage, ask, praise, bigWord, sceneButtons, finish, pulse, burst, moveTo, W, H } from '../ui.js';
import { booboHead } from '../art.js';
import { lv, byLv, shuffle, pick } from '../state.js';
import { sfx } from '../audio.js';
import { ease } from '../run.js';
import { orderGame, numOpts, guide } from './common.js';

const FRIENDS = [
  { name: 'Booboo', draw: g => booboHead(g, { s: .9 }) },
  { name: 'Bunny', emoji: '🐰' },
  { name: 'Bear', emoji: '🐻' },
  { name: 'Kitty', emoji: '🐱' },
];
const COUNT_HINT = {
  2: 'Count by twos: 2, 4, 6...',
  4: 'Count by fours: 4, 8, 12...',
  5: 'Count by fives: 5, 10, 15...',
  10: 'Count by tens: 10, 20, 30...',
};
const STEPS = {
  crack: { icon: '🥚', label: 'Crack the eggs' },
  mix: { icon: '🥣', label: 'Mix' },
  pour: { icon: '🧁', label: 'Pour into cups' },
  bake: { icon: '🔥', label: 'Bake' },
  decorate: { icon: '🍓', label: 'Decorate' },
};

export function cupcake(p, { x = 0, y = 0, s = 1, top = '#f8bbd0' } = {}) {
  const g = el('g', { transform: `translate(${x} ${y}) scale(${s})` }, p);
  el('path', { d: 'M-26 0 L-20 32 L20 32 L26 0Z', fill: '#ffb74d', stroke: '#f57c00', 'stroke-width': 3 }, g);
  for (const lx of [-12, 0, 12]) el('line', { x1: lx, y1: 4, x2: lx * .8, y2: 30, stroke: '#f57c00', 'stroke-width': 2 }, g);
  el('path', { d: 'M-28 2 Q-32 -22 -10 -22 Q0 -44 10 -22 Q32 -22 28 2Z', fill: top, stroke: '#ec407a', 'stroke-width': 3 }, g);
  el('circle', { cx: 0, cy: -38, r: 7, fill: '#e53935' }, g);
  return g;
}
/** a pie cut in different ways: half, halfBad, thirds, quarters, quartersBad */
function pie(g, kind, r = 70, y = -10) {
  const p = el('g', { transform: `translate(0 ${y})` }, g);
  el('circle', { r: r + 6, fill: '#d7a86e' }, p);
  el('circle', { r, fill: '#ffcc80' }, p);
  for (let i = 0; i < 10; i++) { const a = i * .63; el('circle', { cx: Math.cos(a) * r * .55, cy: Math.sin(a) * r * .55, r: 6, fill: '#e57373' }, p); }
  const line = (x1, y1, x2, y2) => el('line', { x1, y1, x2, y2, stroke: '#6d4c41', 'stroke-width': 5, 'stroke-linecap': 'round' }, p);
  if (kind === 'half') line(0, -r, 0, r);
  if (kind === 'halfBad') line(r * .45, -r * .89, r * .45, r * .89);
  if (kind === 'thirds') [90, 210, 330].forEach(a => { const t = a * Math.PI / 180; line(0, 0, Math.cos(t) * r, -Math.sin(t) * r); });
  if (kind === 'quarters') { line(0, -r, 0, r); line(-r, 0, r, 0); }
  if (kind === 'quartersBad') { line(r * .4, -r * .92, r * .4, r * .92); line(-r, r * .35, r, r * .35); }
}
function piece(g, kind, r = 70) {
  const p = el('g', { transform: 'translate(0 -10)' }, g);
  const d = kind === 'half' ? `M0 ${-r} A${r} ${r} 0 0 0 0 ${r}Z` : `M0 0 L0 ${-r} A${r} ${r} 0 0 0 ${-r} 0Z`;
  el('path', { d, fill: '#ffcc80', stroke: '#d7a86e', 'stroke-width': 8, transform: kind === 'half' ? 'translate(30 0)' : 'translate(30 30)' }, p);
}

export async function bakeryScene(run) {
  const s = stage();
  const bg = el('g', {}, s);
  el('rect', { width: W, height: H, fill: '#fff3e0' }, bg);
  for (let x = 0; x < W; x += 80) for (let y = 0; y < 640; y += 80) el('rect', { x: x + 4, y: y + 4, width: 72, height: 72, rx: 8, fill: (x + y) % 160 ? '#ffe0b2' : '#ffecb3', opacity: .6 }, bg);
  el('rect', { x: 0, y: 640, width: W, height: 260, fill: '#d7a86e' }, bg);
  el('rect', { x: 0, y: 640, width: W, height: 18, fill: '#bc8a52' }, bg);
  const root = el('g', {}, s);
  guide(s);
  sceneButtons(run);
  const clear = () => { while (root.firstChild) root.removeChild(root.firstChild); };

  /* ===== 1. fair sharing ===== */
  const k = byLv(2, 3, 3), N = byLv(6, 12, 12), each = N / k;
  const fs = FRIENDS.slice(0, k);
  const fx = fs.map((_, i) => 800 - (k - 1) * 170 + i * 340 - 100);
  const plates = fs.map((f, i) => {
    const n = node(root, fx[i], 330);
    if (f.draw) f.draw(n.inner); else txt(n.inner, 0, 0, f.emoji, 100, { class: 'emoji' });
    txt(n.inner, 0, 78, f.name, 30, { fill: '#6d4c41', 'font-weight': 700 });
    el('ellipse', { cx: 0, cy: 190, rx: 130, ry: 34, fill: '#fff', stroke: '#e0e0e0', 'stroke-width': 4 }, n.inner);
    n.count = 0; n.num = txt(n.inner, 0, 250, '', 34, { fill: '#8d6e63', 'font-weight': 700 });
    return n;
  });
  const tray = [];
  for (let i = 0; i < N; i++) {
    const c = node(root, 800 - (Math.min(N, 6) - 1) * 50 + (i % 6) * 100 - 100, 715 + Math.floor(i / 6) * 95);
    cupcake(c.inner, { s: .9 });
    c.inner.classList.add('tap', 'float'); c.inner.style.animationDelay = (i * 130) + 'ms';
    tray.push(c);
  }
  await run.wait(300);
  await run.say(byLv(
    'Welcome to the Number Bakery! Booboo and Bunny want to share these cupcakes fairly. Tap a cupcake, and I will give them out: one for Booboo, one for Bunny, one for Booboo, one for Bunny.',
    'Welcome to the Number Bakery! Booboo, Bunny and Bear want to share these cupcakes fairly. Tap the cupcakes, and I will give them out in turns: one for you, one for you, one for you!',
    'Welcome to the Number Bakery! Booboo, Bunny and Bear want to share these cupcakes fairly. Tap the cupcakes, and I will give them out in turns: one for you, one for you, one for you!'));
  let turn = 0;
  const left = tray.slice();
  while (left.length) {
    const i = await run.tapAny(left.map(c => c.inner));
    const c = left.splice(i, 1)[0];
    c.inner.classList.remove('tap', 'float');
    const pl = plates[turn % k], j = pl.count++;
    sfx.pop();
    await moveTo(c, pl.x - 60 + (j % 3) * 60, pl.y + 165 - Math.floor(j / 3) * 34 + (j % 3 === 1 ? -8 : 0), 380, run, ease.out);
    c.moveTo(c.x, c.y, .75);
    pl.num.textContent = String(pl.count);
    turn++;
  }
  const r1 = await ask(run, {
    prompt: 'All shared! How many cupcakes does each friend get?', y: 700, tileW: 180, tileH: 150,
    options: numOpts(each, each + 1, each - 1), hint: 'Count the cupcakes on just one plate.',
  });
  await run.say(`${praise(r1.misses)} ${N} cupcakes shared by ${k} friends is ${each} each. Everybody gets the same. That is fair!`);
  await bigWord(run, 'division');
  if (lv() === 2) {
    const r2 = await ask(run, {
      prompt: 'Three more friends come to the party! Now 6 friends share the same 12 cupcakes. Will each friend get more cupcakes, or fewer?', y: 700, tileW: 240, tileH: 160,
      options: shuffle([{ icon: '⬇️', label: 'Fewer', correct: true }, { icon: '⬆️', label: 'More', why: 'Hmm! More friends are sharing the same cupcakes. Will the plates get fuller, or emptier?' }, { icon: '🟰', label: 'The same', why: 'Hmm! More friends are sharing the same cupcakes. Will the plates get fuller, or emptier?' }]),
    });
    await run.say(`${praise(r2.misses)} More friends sharing means fewer for each friend.`);
    const r3 = await ask(run, {
      prompt: 'So how many does each of the 6 friends get?', y: 700, tileW: 180, tileH: 150,
      options: numOpts(2, 3, 6), hint: 'Give out the 12 cupcakes in turns to 6 friends. 6 for the first turn, and 6 more for the second turn.',
    });
    await run.say(`${praise(r3.misses)} 12 shared by 6 is 2 each!`);
  }
  clear();

  /* ===== 2. halves and quarters ===== */
  const pieOpt = (kind, extra) => ({ draw: (g, w, h) => pie(g, kind, 70, -6), ...extra });
  await run.say('Pie time! When we cut a pie for friends, the pieces must be the same size, or it is not fair.');
  const r4 = await ask(run, {
    prompt: 'Two friends want to share a pie. Which pie is cut into two EQUAL halves?', y: 330, tileW: 250, tileH: 230,
    options: shuffle([pieOpt('half', { correct: true }), pieOpt('halfBad', { why: 'Look closely. One piece is much bigger! That is not fair.' }), ...(lv() ? [pieOpt('thirds', { why: 'That pie has 3 pieces. We need 2 equal pieces.' })] : [])]),
  });
  const bigHalf = node(root, 560, 760); pie(bigHalf.inner, 'half', 80, 0); bigHalf.inner.classList.add('pop-in');
  await run.say(`${praise(r4.misses)} Two equal pieces. Each piece is one half!`);
  const r5 = await ask(run, {
    prompt: 'Now 4 friends want pie! Which pie is cut into 4 equal quarters?', y: 330, tileW: 250, tileH: 230,
    options: shuffle([pieOpt('quarters', { correct: true }), pieOpt('quartersBad', { why: 'Those 4 pieces are all different sizes. Not fair!' }), pieOpt('half', { why: 'That pie only has 2 pieces. We need 4.' })]),
  });
  const bigQ = node(root, 960, 760); pie(bigQ.inner, 'quarters', 80, 0); bigQ.inner.classList.add('pop-in');
  await run.say(`${praise(r5.misses)} Four equal pieces. Each piece is one quarter!`);
  await bigWord(run, 'fraction');
  if (lv() > 0) {
    const r6 = await ask(run, {
      prompt: 'Tricky one! Which piece of pie is BIGGER: one half, or one quarter?', y: 330, tileW: 280, tileH: 250,
      options: shuffle([
        { draw: (g, w, h) => { piece(g, 'half'); txt(g, 0, h / 2 - 28, 'One half', 28, { class: 'lbl', 'font-weight': 700 }); }, correct: true },
        { draw: (g, w, h) => { piece(g, 'quarter'); txt(g, 0, h / 2 - 28, 'One quarter', 28, { class: 'lbl', 'font-weight': 700 }); }, why: 'Hmm! A quarter means the pie was cut into MORE pieces. Are more pieces bigger, or smaller?' },
      ]),
    });
    await run.say(`${praise(r6.misses)} When you cut a pie into more pieces, each piece gets smaller. So a half is bigger than a quarter!`);
  }
  if (lv() === 2) {
    const r7 = await ask(run, { prompt: 'How many quarters make one whole pie?', y: 330, tileW: 180, tileH: 150, options: numOpts(4, 2, 3), hint: 'Look at the pie cut into quarters. Count the pieces!' });
    await run.say(`${praise(r7.misses)} 4 quarters make a whole!`);
    const r8 = await ask(run, { prompt: 'And how many quarters make one half?', y: 330, tileW: 180, tileH: 150, options: numOpts(2, 4, 1), hint: 'A half is half of the whole pie. Half of 4 quarters is...?' });
    await run.say(`${praise(r8.misses)} 2 quarters make a half!`);
  }
  clear();

  /* ===== 3. boxes of cupcakes (groups) ===== */
  const rounds = byLv([[3, 2], [2, 5]], [[4, 5], [3, 10]], [[6, 5], [4, 10]]);
  for (const [b, n] of rounds) {
    clear();
    const perRow = Math.min(b, 4), bw = n > 2 ? 290 : 180, bh = n > 5 ? 130 : 90;
    const boxes = [];
    for (let i = 0; i < b; i++) {
      const row = Math.floor(i / perRow), col = i % perRow, inRow = Math.min(perRow, b - row * perRow);
      const bx = node(root, 760 - (inRow - 1) * (bw + 30) / 2 + col * (bw + 30), 250 + row * (bh + 50));
      el('rect', { x: -bw / 2, y: -bh / 2, width: bw, height: bh, rx: 16, fill: '#fff', stroke: '#f48fb1', 'stroke-width': 5 }, bx.inner);
      for (let j = 0; j < n; j++) {
        const cols = Math.min(n, 5), rr = Math.floor(j / 5), cc = j % 5;
        cupcake(bx.inner, { x: -(cols - 1) * 27 + cc * 54, y: (n > 5 ? -26 + rr * 54 : 2) - 4, s: .62 });
      }
      bx.lab = txt(bx.inner, 0, bh / 2 + 22, '', 28, { fill: '#ad1457', 'font-weight': 700 });
      boxes.push(bx);
    }
    const ans = b * n;
    const r = await ask(run, {
      prompt: `There are ${b} boxes, with ${n} cupcakes in each box. How many cupcakes altogether?`, y: 700, tileW: 180, tileH: 150,
      options: numOpts(ans, ans + n, ans - n), hint: COUNT_HINT[n],
    });
    await run.say(praise(r.misses));
    for (let i = 0; i < b; i++) {
      boxes[i].lab.textContent = String((i + 1) * n);
      boxes[i].inner.classList.remove('pop-in'); void boxes[i].inner.getBoundingClientRect(); boxes[i].inner.classList.add('pop-in');
      sfx.pop();
      await run.wait(380);
    }
    await run.say(`${Array.from({ length: b }, (_, i) => (i + 1) * n).join(', ')}! ${b} groups of ${n} is ${ans}.`);
  }
  await bigWord(run, 'multiply');
  clear();

  /* ===== 4. the recipe (an algorithm) ===== */
  const keys = byLv(['mix', 'bake', 'decorate'], ['crack', 'mix', 'bake', 'decorate'], ['crack', 'mix', 'pour', 'bake', 'decorate']);
  const items = keys.map(k => ({ k, draw: (g, w, h) => { txt(g, 0, -22, STEPS[k].icon, 80, { class: 'emoji' }); txt(g, 0, h / 2 - 34, STEPS[k].label, STEPS[k].label.length > 10 ? 22 : 28, { class: 'lbl', 'font-weight': 700, fill: '#6d4c41' }); } }));
  await run.say('Now let us bake our own cupcakes! A recipe tells us the steps, in the right order. Can you put the steps in order?');
  await orderGame(run, root, {
    items, gap: keys.length > 4 ? 230 : 260, stroke: '#ffcc80', numColor: '#ffb74d',
    prompt: (i, n) => i === 0 ? 'What do we do first?' : i === n - 1 ? 'And what is the very last step?' : pick(['What comes next?', 'And then?']),
    hint: (i, it) => it && it.k === 'bake' ? 'Not yet! We cannot bake until the batter is ready.' : it && it.k === 'decorate' ? 'Not yet! We decorate at the very end, when the cupcakes are baked.' : 'Hmm, what has to happen before that?',
  });
  sfx.chime();
  await run.say('Yum! A recipe is a list of steps in order. It is an algorithm for cooking!');
  if (lv() === 2) {
    const r = await ask(run, {
      prompt: 'Uh oh! Bunny wrote a recipe with a bug in it: Bake, then Mix. What is wrong?', y: 680, tileW: 300, tileH: 180,
      options: shuffle([{ icon: '🔀', label: 'Mix first, then bake', correct: true }, { icon: '👍', label: 'Nothing is wrong', why: 'Hmm! Can you bake a cake before you mix it?' }, { icon: '🔥', label: 'Bake two times', why: 'Hmm! The problem is the ORDER of the steps.' }]),
    });
    await run.say(`${praise(r.misses)} The order matters. You found the bug and fixed it!`);
  }
  // celebration: cupcakes everywhere
  for (let i = 0; i < 8; i++) { const c = node(root, 220 + i * 150, 560); cupcake(c.inner, { s: 1.1, top: pick(['#f8bbd0', '#b3e5fc', '#fff59d', '#c5e1a5']) }); c.inner.classList.add('pop-in'); c.inner.style.animationDelay = (i * 90) + 'ms'; }
  sfx.star(); burst(root, 800, 500, 26);
  await run.wait(800);
  await finish(run, 'bakery', 'Master baker! You shared fairly, cut fractions, counted groups, and followed the recipe!');
}
