import { el, txt, node, stage, ask, praise, bigWord, sceneButtons, finish, pulse, burst, moveTo, W, H } from '../ui.js';
import { booboHead } from '../art.js';
import { lv, byLv, shuffle, pick, rand } from '../state.js';
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { ease } from '../run.js';
import { tapPart, numOpts, guide } from './common.js';

const SETS = {
  colors: ['🔴', '🔵', '🟡', '🟢'],
  animals: ['🐶', '🐱', '🐰', '🐸'],
  shapes: ['⭐', '❤️', '🔷', '🌙'],
};
/* [pattern, symbol set, where the gap is (-1 = the end)] */
const PATTERNS = [
  [['AB', 'colors', -1], ['ABC', 'animals', -1]],
  [['AAB', 'colors', -1], ['ABC', 'shapes', -1], ['ABB', 'animals', -1]],
  [['AABB', 'shapes', -1], ['ABC', 'animals', 4], ['ABBC', 'colors', -1]],
];
const NUMBER_TRAINS = () => [
  [{ start: 10, step: 10, gap: -1 }, { start: 2, step: 2, gap: -1 }],
  [{ start: 5, step: 5, gap: -1 }, { start: rand(11, 19), step: 10, gap: -1 }],
  [{ start: rand(8, 9) * 10 + rand(1, 9), step: -10, gap: -1 }, { start: 35, step: 5, gap: 3 }],
][lv()];

const FLY = [
  { e: '🐦', fly: true, why: 'A bird can fly! So it rides in the blue carriage.' },
  { e: '🦋', fly: true, why: 'A butterfly can fly! So it rides in the blue carriage.' },
  { e: '🐝', fly: true, why: 'A bee can fly! So it rides in the blue carriage.' },
  { e: '🐶', fly: false, why: 'A dog cannot fly. So it rides in the red carriage!' },
  { e: '🐢', fly: false, why: 'A turtle cannot fly. So it rides in the red carriage!' },
  { e: '🐘', fly: false, why: 'An elephant cannot fly. So it rides in the red carriage!' },
];
const WINGS = [
  { e: '🐧', fly: true, why: 'A penguin cannot fly, but it HAS wings! The rule is about wings, so it rides in the blue carriage.' },
  { e: '🦘', fly: false, why: 'A kangaroo jumps really high, but it has no wings. So it rides in the red carriage!' },
  { e: '🐔', fly: true, why: 'A chicken has wings, even though it barely flies! Blue carriage.' },
  { e: '🐟', fly: false, why: 'A fish has fins, not wings. Red carriage!' },
  { e: '🦇', fly: true, why: 'A bat has wings! Blue carriage.' },
  { e: '🐶', fly: false, why: 'A dog has no wings. Red carriage!' },
];

function backdrop(s) {
  const g = el('g', {}, s);
  el('rect', { width: W, height: H, fill: '#e1f5fe' }, g);
  el('rect', { x: 0, y: 610, width: W, height: 290, fill: '#c5e1a5' }, g);
  el('rect', { x: 0, y: 540, width: W, height: 70, fill: '#cfd8dc' }, g); // platform
  el('rect', { x: 0, y: 540, width: W, height: 10, fill: '#ffeb3b' }, g);
  return g;
}
function track(p, y) {
  const g = el('g', {}, p);
  for (let x = -20; x < W + 40; x += 46) el('rect', { x, y: y - 4, width: 22, height: 26, rx: 4, fill: '#8d6e63' }, g);
  el('rect', { x: 0, y: y, width: W, height: 7, fill: '#757575' }, g);
  el('rect', { x: 0, y: y + 13, width: W, height: 7, fill: '#757575' }, g);
  return g;
}
function engine(p, x, y) {
  const n = node(p, x, y);
  const g = el('g', { transform: 'scale(-1 1)' }, n.inner); // faces left
  el('rect', { x: -60, y: -90, width: 130, height: 76, rx: 10, fill: '#e53935' }, g);
  el('rect', { x: 10, y: -140, width: 60, height: 56, rx: 8, fill: '#c62828' }, g);
  el('rect', { x: 20, y: -128, width: 40, height: 30, rx: 5, fill: '#bbdefb' }, g);
  el('rect', { x: -48, y: -130, width: 22, height: 42, fill: '#424242' }, g);
  el('path', { d: 'M-70 -14 L-90 -2 L-70 -2Z', fill: '#616161' }, g);
  for (const wx of [-36, 0, 40]) el('circle', { cx: wx, cy: -8, r: 18, fill: '#424242', stroke: '#9e9e9e', 'stroke-width': 4 }, g);
  booboHead(g, { x: 40, y: -114, s: .26 });
  return n;
}
function carriage(p, x, y, { fill = '#42a5f5', content = '', w = 120, size = 54, dashed = false } = {}) {
  const n = node(p, x, y);
  el('rect', { x: -w / 2, y: -96, width: w, height: 82, rx: 12, fill: dashed ? '#fff' : fill, stroke: dashed ? '#90a4ae' : 'rgba(0,0,0,.15)', 'stroke-width': 4, 'stroke-dasharray': dashed ? '10 8' : '' }, n.inner);
  el('rect', { x: -w / 2 + 12, y: -86, width: w - 24, height: 58, rx: 8, fill: dashed ? '#fff' : '#fffde7' }, n.inner);
  el('line', { x1: -w / 2 - 6, y1: -28, x2: -w / 2, y2: -28, stroke: '#616161', 'stroke-width': 6 }, n.inner);
  for (const wx of [-w / 2 + 26, w / 2 - 26]) el('circle', { cx: wx, cy: -8, r: 15, fill: '#424242', stroke: '#9e9e9e', 'stroke-width': 4 }, n.inner);
  n.t = txt(n.inner, 0, -56, content, size, { class: /^\d/.test(content) || content === '?' ? '' : 'emoji', fill: content === '?' ? '#90a4ae' : '#37474f', 'font-weight': 700 });
  return n;
}
const CAR_COLORS = ['#ef9a9a', '#90caf9', '#fff59d', '#a5d6a7', '#ce93d8', '#ffcc80', '#80cbc4', '#f48fb1'];

/** a whole train: engine on the left, then carriages; returns { all, cars } */
function train(p, contents, { y = 560, gap = -1, w = 120, size = 54, x0 } = {}) {
  const g = node(p, 0, 0);
  const n = contents.length, step = w + 14;
  const left = x0 ?? 720 - (140 + n * step) / 2;
  const eng = engine(g.inner, left + 70, y);
  const cars = contents.map((c, i) => carriage(g.inner, left + 140 + w / 2 + i * step, y, { fill: CAR_COLORS[i % CAR_COLORS.length], content: i === gap ? '?' : String(c), w, size, dashed: i === gap }));
  return { g, eng, cars };
}

export async function trainsScene(run) {
  const s = stage();
  backdrop(s);
  track(s, 560);
  const root = el('g', {}, s);
  guide(s);
  sceneButtons(run);
  const clear = () => { while (root.firstChild) root.removeChild(root.firstChild); };
  const whistle = () => { sfx.honk(); };

  /* ===== 1. pattern trains ===== */
  await run.wait(300);
  whistle();
  await run.say('Welcome to the Train Station! Each train here has a pattern. Can you figure out the rule?');
  let first = true;
  for (const [pat, set, gapAt] of PATTERNS[lv()]) {
    clear();
    const sym = shuffle(SETS[set]);
    const map = {}; [...new Set(pat)].forEach((ch, i) => { map[ch] = sym[i]; });
    const len = byLv(6, 7, 8);
    const seq = Array.from({ length: len }, (_, i) => map[pat[i % pat.length]]);
    const gap = gapAt < 0 ? len - 1 : gapAt;
    const t = train(root, seq, { gap });
    t.g.moveTo(-1400, 0);
    await run.anim(1400, e => t.g.moveTo(-1400 * (1 - e), 0), ease.out);
    pulse(t.cars[gap].inner);
    const used = [...new Set(seq)], extra = sym.find(x => !used.includes(x));
    const opts = shuffle([...used, ...(lv() ? [extra] : [])]);
    const r = await ask(run, {
      prompt: gap === len - 1 ? 'Look at the pattern. What comes next?' : 'One carriage is missing in the middle! What goes in the gap?', y: 660, tileW: 170, tileH: 170,
      options: opts.map(x => ({ icon: x, correct: x === seq[gap], iconSize: 84 })),
      hint: 'Say the pattern out loud, and listen for the part that repeats!',
    });
    pulse(t.cars[gap].inner, false);
    t.cars[gap].remove();
    const fixed = carriage(t.g.inner, t.cars[gap].x, t.cars[gap].y, { fill: CAR_COLORS[gap % CAR_COLORS.length], content: seq[gap] });
    fixed.inner.classList.add('pop-in');
    await run.say(praise(r.misses));
    if (first) { first = false; await bigWord(run, 'pattern'); }
    whistle();
    await run.anim(1300, e => t.g.moveTo(-1700 * e * e, 0), ease.linear);
  }
  clear();

  /* ===== 2. number trains ===== */
  await run.say('Number trains! The numbers on these carriages follow a pattern too.');
  for (const { start, step, gap: gapAt } of NUMBER_TRAINS()) {
    clear();
    const len = 6;
    const seq = Array.from({ length: len }, (_, i) => start + i * step);
    const gap = gapAt < 0 ? len - 1 : gapAt;
    const t = train(root, seq, { gap, size: 48 });
    t.g.moveTo(-1400, 0);
    await run.anim(1400, e => t.g.moveTo(-1400 * (1 - e), 0), ease.out);
    pulse(t.cars[gap].inner);
    const ans = seq[gap], jump = Math.abs(step);
    const r = await ask(run, {
      prompt: gap === len - 1 ? 'What number comes next?' : 'What number is missing?', y: 660, tileW: 180, tileH: 160,
      options: numOpts(ans, ans + jump, ans + (step > 0 ? 1 : -1)),
      hint: step > 0 ? 'Look at how much bigger each number gets!' : 'These numbers are counting backwards! How much smaller does each one get?',
    });
    pulse(t.cars[gap].inner, false);
    t.cars[gap].t.textContent = String(ans); t.cars[gap].t.setAttribute('fill', '#37474f');
    t.cars[gap].inner.classList.add('pop-in');
    await run.say(step > 0 ? `${praise(r.misses)} Each carriage jumps up by ${jump}.` : `${praise(r.misses)} Counting backwards! Each carriage goes down by ${jump}.`);
    whistle();
    await run.anim(1300, e => t.g.moveTo(-1700 * e * e, 0), ease.linear);
  }
  clear();

  /* ===== 3. conditions: if ... then ... ===== */
  if (lv() === 0) {
    const t = train(root, ['🐶', '🐱'], { x0: 380 });
    const post = node(root, 1180, 520);
    el('rect', { x: -10, y: -260, width: 20, height: 260, fill: '#616161' }, post.inner);
    el('rect', { x: -44, y: -400, width: 88, height: 160, rx: 22, fill: '#37474f' }, post.inner);
    const red = el('circle', { cx: 0, cy: -360, r: 30, fill: '#5d4037' }, post.inner);
    const green = el('circle', { cx: 0, cy: -280, r: 30, fill: '#33691e' }, post.inner);
    await run.say('Trains follow rules. Here is the rule: IF the light is green, THEN the train goes. IF the light is red, THEN the train stops.');
    const lights = shuffle(['green', 'red', 'green', 'red']).slice(0, 3);
    let x = 0;
    for (const L of lights) {
      red.setAttribute('fill', L === 'red' ? '#ff1744' : '#5d4037');
      green.setAttribute('fill', L === 'green' ? '#00e676' : '#33691e');
      sfx.click();
      const r = await ask(run, {
        prompt: L === 'green' ? 'The light is green! What should the train do?' : 'The light is red! What should the train do?', y: 650, tileW: 220, tileH: 170,
        options: [{ icon: '▶️', label: 'Go', correct: L === 'green' }, { icon: '✋', label: 'Stop', correct: L === 'red' }],
        hint: L === 'green' ? 'Remember the rule: green means go!' : 'Remember the rule: red means stop!',
      });
      if (L === 'green') { await run.anim(800, e => t.g.moveTo(x + 90 * e, 0)); x += 90; await run.say(`${praise(r.misses)} Green means go. Choo choo!`); }
      else await run.say(`${praise(r.misses)} Red means stop. The train waits.`);
    }
  } else {
    const list = lv() === 1 ? shuffle(FLY).slice(0, 4) : [WINGS[0], WINGS[1], ...shuffle(WINGS.slice(2)).slice(0, 2)];
    const ruleText = lv() === 1 ? 'IF it can fly ➜ BLUE.   IF it cannot fly ➜ RED.' : 'IF it has wings ➜ BLUE.   IF no wings ➜ RED.';
    const card = node(root, 760, 262);
    el('rect', { x: -560, y: -38, width: 1120, height: 76, rx: 38, fill: '#fff', stroke: '#7e57c2', 'stroke-width': 5 }, card.inner);
    txt(card.inner, 0, 3, '📜 ' + ruleText, 34, { fill: '#4527a0', 'font-weight': 700 });
    const blue = carriage(root, 520, 560, { fill: '#42a5f5', w: 300, content: '' });
    const redC = carriage(root, 1000, 560, { fill: '#ef5350', w: 300, content: '' });
    const parts = { blue: blue.inner, red: redC.inner };
    await run.say(lv() === 1
      ? 'Animals are taking the train! Here is the rule. IF an animal can fly, THEN it rides in the blue carriage. IF it cannot fly, THEN it rides in the red carriage.'
      : 'Animals are taking the train! Here is the rule. IF an animal has wings, THEN it rides in the blue carriage. IF it has no wings, THEN it rides in the red carriage. Follow the rule exactly, like a computer!');
    const seats = { blue: 0, red: 0 };
    for (const a of list) {
      const pa = node(root, 760, 385); pa.inner.classList.add('pop-in');
      el('circle', { r: 70, fill: '#fff', stroke: '#b39ddb', 'stroke-width': 5 }, pa.inner);
      txt(pa.inner, 0, 4, a.e, 90, { class: 'emoji' });
      const right = a.fly ? 'blue' : 'red';
      const m = await tapPart(run, parts, right, {
        prompt: pick(['Which carriage does this animal ride in? Tap it!', 'Where does this one go? Tap the carriage!']),
        about: { [a.fly ? 'red' : 'blue']: lv() === 1 ? 'Hmm! Think about the rule. Can this animal fly?' : 'Hmm! Think about the rule. Does this animal have wings?' },
      });
      const c = right === 'blue' ? blue : redC;
      await moveTo(pa, c.x - 90 + seats[right] * 60, c.y - 56, 500, run, ease.out);
      pa.moveTo(pa.x, pa.y, .5); seats[right]++;
      await run.say(`${praise(m)} ${a.why}`);
    }
  }
  await bigWord(run, 'condition');
  clear();

  /* ===== 4. loops ===== */
  if (lv() < 2) {
    const reps = byLv(3, 4, 4);
    const seq = Array.from({ length: reps * 2 }, (_, i) => i % 2 ? '🔵' : '🔴');
    const t = train(root, seq, { w: 92, size: 44 });
    await run.say(lv() === 0 ? 'Look at this long train! Red, blue, red, blue, red, blue.' : 'Look at this long train! Red, blue, red, blue, red, blue, red, blue.');
    const r = await ask(run, {
      prompt: 'How many times does the red, blue pattern repeat?', y: 660, tileW: 180, tileH: 160,
      options: numOpts(reps, reps * 2, reps + 1).map(o => o.label === String(reps * 2) ? { ...o, why: 'That is how many carriages there are! Count the red, blue PAIRS.' } : o),
      hint: 'Count each red and blue pair as one.',
    });
    // show the pairs
    for (let i = 0; i < reps; i++) {
      const a = t.cars[i * 2], b = t.cars[i * 2 + 1];
      el('rect', { x: a.x - 54, y: 448, width: b.x - a.x + 108, height: 130, rx: 20, fill: 'none', stroke: '#7e57c2', 'stroke-width': 6, class: 'fadein' }, t.g.inner);
      txt(t.g.inner, (a.x + b.x) / 2, 610, String(i + 1), 40, { fill: '#7e57c2', 'font-weight': 700 });
      sfx.pop(); await run.wait(350);
    }
    await run.say(`${praise(r.misses)} Instead of saying red, blue, again and again, a coder just writes: repeat red, blue, ${reps} times. That is a loop!`);
  } else {
    const card = node(root, 760, 300);
    el('rect', { x: -430, y: -120, width: 860, height: 240, rx: 34, fill: '#fff', stroke: '#7e57c2', 'stroke-width': 6 }, card.inner);
    txt(card.inner, 0, -70, '🔁 Repeat 3 times:', 44, { fill: '#4527a0', 'font-weight': 700 });
    [['🚂', 'Chug'], ['🚂', 'Chug'], ['📯', 'Toot']].forEach(([ic, w], i) => {
      const b = node(card.inner, -230 + i * 230, 40);
      el('rect', { x: -95, y: -50, width: 190, height: 100, rx: 22, fill: '#ede7f6' }, b.inner);
      txt(b.inner, 0, 2, ic + ' ' + w, 36, { fill: '#311b92', 'font-weight': 700 });
    });
    await run.say('Here is a program for the train. Repeat 3 times: Chug, chug, toot!');
    const r = await ask(run, {
      prompt: 'If the train follows this program, how many chugs will it make?', y: 520, tileW: 180, tileH: 160,
      options: numOpts(6, 3, 9).map(o => o.label === '3' ? { ...o, why: 'Hmm! It repeats 3 times, but each time there are TWO chugs.' } : o),
    });
    await run.say(`${praise(r.misses)} Let's run it and check!`);
    const counter = txt(root, 760, 490, '', 52, { fill: '#4527a0', 'font-weight': 700 });
    let chugs = 0, toots = 0;
    for (let rep = 0; rep < 3; rep++) for (const w of ['Chug', 'Chug', 'Toot']) {
      if (w === 'Chug') { chugs++; sfx.step(); } else { toots++; sfx.honk(); }
      counter.textContent = `Chugs: ${chugs}    Toots: ${toots}`;
      await run.wait(420);
    }
    const r2 = await ask(run, {
      prompt: 'And how many toots?', y: 600, tileW: 180, tileH: 160, options: numOpts(3, 6, 1), hint: 'Look at the counter!',
    });
    await run.say(`${praise(r2.misses)} 6 chugs and 3 toots. With a loop, a coder writes 3 steps instead of 9!`);
  }
  await bigWord(run, 'loop');
  clear();

  // all aboard!
  const t = train(root, ['🐶', '🐰', '🐸', '🐱'], {});
  whistle();
  await run.say('All aboard! Toot toot!');
  await run.anim(1800, e => t.g.moveTo(-1900 * e * e, 0), ease.linear);
  await finish(run, 'trains', 'Train boss! You found patterns, followed the rules, and used a loop, just like a coder!');
}
