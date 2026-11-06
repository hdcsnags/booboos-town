import { el, txt, node, stage, ask, praise, bigWord, sceneButtons, finish, pulse, burst, shake, moveTo, W, H } from '../ui.js';
import { plantStage, flower, sun } from '../art.js';
import { lv, byLv, shuffle, pick, rand } from '../state.js';
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { ease } from '../run.js';
import { orderGame, tapPart, numOpts, guide } from './common.js';

/* What a seed needs. lv = the lowest level that sees it. */
const NEEDS = [
  { icon: '💧', label: 'Water', need: true, why: 'Water! Seeds need a drink to wake up.' },
  { icon: '☀️', label: 'Sunlight', need: true, why: 'Sunlight! Plants use light to make their own food.' },
  { icon: '💨', label: 'Air', need: true, lv: 1, why: 'Air! Plants breathe air through tiny holes in their leaves.' },
  { icon: '🍭', label: 'Candy', why: 'Candy? Plants do not eat candy! They make their own food.' },
  { icon: '🧸', label: 'Teddy', why: 'A teddy is cozy, but plants do not need toys!' },
  { icon: '📺', label: 'TV', lv: 1, why: 'Ha ha! Plants do not watch TV!' },
  { icon: '🧃', label: 'Juice', lv: 2, why: 'Juice is too sugary! Plants drink plain water.' },
];
const PART_ABOUT = {
  roots: 'Those are the roots. They drink water from the soil.',
  stem: 'That is the stem. It carries water up, like a straw.',
  leaves: 'Those are the leaves. They catch sunlight to make food.',
  flower: 'That is the flower. It makes the seeds.',
};
const PART_Q = {
  roots: 'Which part drinks water from the soil? Tap it!',
  stem: 'Which part carries the water up, like a drinking straw? Tap it!',
  leaves: 'Which part catches the sunlight to make food? Tap it!',
  flower: 'Which part makes the new seeds? Tap it!',
};

function backdrop(s) {
  const g = el('g', {}, s);
  el('rect', { width: W, height: H, fill: '#e8f5e9' }, g);
  for (let x = 0; x <= W; x += 200) el('line', { x1: x, y1: 0, x2: x, y2: 770, stroke: '#c8e6c9', 'stroke-width': 6 }, g);
  el('line', { x1: 0, y1: 130, x2: W, y2: 130, stroke: '#c8e6c9', 'stroke-width': 6 }, g);
  el('rect', { x: 0, y: 770, width: W, height: 130, fill: '#8d6e63' }, g);
  el('rect', { x: 0, y: 770, width: W, height: 14, fill: '#6d4c41' }, g);
  return g;
}
function pot(parent, x, y) {
  const p = node(parent, x, y);
  el('path', { d: 'M-110 -40 L110 -40 L84 80 L-84 80Z', fill: '#e57347', stroke: '#bf5530', 'stroke-width': 5 }, p.inner);
  el('rect', { x: -122, y: -62, width: 244, height: 30, rx: 8, fill: '#ef8354', stroke: '#bf5530', 'stroke-width': 5 }, p.inner);
  el('ellipse', { cx: 0, cy: -60, rx: 104, ry: 11, fill: '#5d4037' }, p.inner);
  p.plant = el('g', { transform: 'translate(0 -60)' }, p.inner);
  p.grow = st => { while (p.plant.firstChild) p.plant.removeChild(p.plant.firstChild); plantStage(p.plant, st, { s: st === 0 ? 1 : 1.3 }); };
  return p;
}
/** a little growth chart bar */
function bar(parent, x, base, cm, label, { color = '#7cb342', unknown = false, px = 5.5 } = {}) {
  const g = node(parent, x, base);
  const h = cm * px;
  el('rect', { x: -40, y: -h, width: 80, height: h, rx: 10, fill: unknown ? 'rgba(255,255,255,.7)' : color, stroke: unknown ? '#9ccc65' : 'none', 'stroke-width': 4, 'stroke-dasharray': unknown ? '10 8' : '' }, g.inner);
  if (!unknown) plantStage(g.inner, 2, { y: -h, s: .5 });
  g.num = txt(g.inner, 0, -h - (unknown ? -h / 2 : 64), unknown ? '?' : String(cm), 36, { fill: unknown ? '#9ccc65' : '#33691e', 'font-weight': 700 });
  txt(g.inner, 0, 30, label, 26, { fill: '#5d4037', 'font-weight': 600 });
  return g;
}

export async function gardenScene(run) {
  const s = stage();
  backdrop(s);
  const root = el('g', {}, s);
  guide(s);
  sceneButtons(run);
  const clear = () => { while (root.firstChild) root.removeChild(root.firstChild); };

  /* ===== 1. what does a seed need? ===== */
  const p = pot(root, 800, 700);
  p.grow(0);
  const items = shuffle(NEEDS.filter(n => (n.lv || 0) <= lv()));
  const tw = 170, gap = 18, x0 = 800 - (items.length - 1) * (tw + gap) / 2;
  const tiles = items.map((it, i) => {
    const t = node(root, x0 + i * (tw + gap), 290);
    el('rect', { x: -tw / 2, y: -80, width: tw, height: 160, rx: 26, fill: '#fff', stroke: '#c5e1a5', 'stroke-width': 5 }, t.inner);
    txt(t.inner, 0, -16, it.icon, 64, { class: 'emoji' });
    txt(t.inner, 0, 52, it.label, 26, { fill: '#33691e', 'font-weight': 600 });
    t.inner.classList.add('tap', 'tile-in'); t.inner.style.animationDelay = (i * 60) + 'ms';
    if (it.need) t.inner.dataset.want = '1';
    t.it = it;
    return t;
  });
  await run.wait(300);
  await run.say('Welcome to the Garden Lab! This is a tiny sunflower seed. What does a seed need to grow? Tap everything it needs!');
  let left = items.filter(i => i.need).length, stageNow = 0, open = tiles.slice();
  while (left) {
    const i = await run.tapAny(open.map(t => t.inner));
    const t = open[i];
    if (t.it.need) {
      open.splice(i, 1); left--;
      delete t.inner.dataset.want; t.inner.classList.remove('tap');
      sfx.drip();
      say(t.it.why);
      await moveTo(t, 800, 560, 600, run);
      t.remove();
      p.grow(++stageNow); p.plant.classList.remove('pop-in'); void p.plant.getBoundingClientRect(); p.plant.classList.add('pop-in');
      burst(root, 800, 560, 10, ['#aed581', '#fff59d', '#81d4fa']);
      await run.wait(900);
    } else {
      sfx.boing(); shake(t.inner); t.inner.style.opacity = .45;
      open.splice(i, 1); t.inner.classList.remove('tap');
      await run.say(t.it.why);
    }
  }
  open.forEach(t => t.remove());
  await run.say('Look! The seed drank the water and woke up. It cracked open, and a root and a shoot came out!');
  await bigWord(run, 'germination');
  clear();

  /* ===== 2. the life cycle ===== */
  const STAGES = lv() === 0
    ? [[0, 'Seed'], [1, 'Sprout'], [3, 'Plant'], [4, 'Flower']]
    : [[0, 'Seed'], [1, 'Sprout'], [2, 'Seedling'], [4, 'Flower'], [5, 'New seeds']];
  const scale = st => st === 0 ? 1.3 : st < 3 ? 1 : .5;
  const cyc = STAGES.map(([st, name]) => ({ name, draw: (g, w, h) => { plantStage(g, st, { y: st === 0 ? 30 : 50, s: scale(st) }); txt(g, 0, h / 2 - 26, name, 26, { class: 'lbl', 'font-weight': 700, fill: '#33691e' }); } }));
  await run.say('A sunflower grows in steps. Can you put the steps in order, from the very beginning?');
  const slots = await orderGame(run, root, {
    items: cyc, gap: lv() === 0 ? 260 : 230,
    prompt: (i, n) => i === 0 ? 'What comes first?' : i === n - 1 ? 'And what comes at the end?' : pick(['What comes next?', 'And then what happens?']),
    hint: i => i === 0 ? 'Everything starts small. What is the tiniest one?' : 'Hmm, the plant gets a little bigger at each step. Which one is just a little bigger?',
  });
  if (lv() > 0) {
    const a = slots[0], b = slots[slots.length - 1];
    const arc = el('path', { d: `M${b.x} ${b.y + 110} Q800 ${b.y + 300} ${a.x} ${a.y + 110}`, fill: 'none', stroke: '#8d6e63', 'stroke-width': 8, 'stroke-dasharray': '16 12', 'marker-end': '' }, root);
    txt(root, a.x - 20, a.y + 130, '⬆', 44, { fill: '#8d6e63' });
    arc.classList.add('fadein');
    await run.say('And the new seeds fall to the ground, and grow into new sunflowers! Round and round, again and again.');
  } else {
    await run.say('Seed, sprout, plant, flower! And the flower makes new seeds, so it can start all over again.');
  }
  await bigWord(run, 'lifecycle');
  clear();

  /* ===== 3. parts of a plant ===== */
  el('rect', { x: 330, y: 640, width: 780, height: 140, rx: 20, fill: '#a1887f' }, root);
  txt(root, 1040, 668, 'soil', 26, { fill: '#efebe9' });
  const P = node(root, 720, 640);
  const roots = el('g', {}, P.inner);
  const rootLines = 'M0 0 Q-10 40 -60 80 M0 0 Q4 50 -6 110 M0 0 Q20 40 70 70 M-30 50 Q-60 60 -90 50 M30 40 Q60 70 50 110';
  el('path', { d: rootLines, stroke: '#efebe9', 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round' }, roots);
  el('rect', { x: -110, y: 4, width: 220, height: 126, fill: '#fff', 'fill-opacity': 0 }, roots);
  plantStage(P.inner, 4, { s: 2 });
  const zone = (attrs, shape = 'ellipse') => { const g = el('g', {}, P.inner); el(shape, { ...attrs, fill: '#fff', 'fill-opacity': 0 }, g); return g; };
  const parts = {
    roots,
    stem: zone({ x: -22, y: -260, width: 44, height: 250 }, 'rect'),
    leaves: zone({ cx: -55, cy: -130, rx: 60, ry: 80 }),
    flower: zone({ cx: 0, cy: -320, rx: 100, ry: 100 }),
  };
  const leaf2 = zone({ cx: 60, cy: -110, rx: 60, ry: 90 }); parts.leaves.appendChild(leaf2.firstChild); leaf2.remove();
  const labelAt = { roots: [-200, 70], stem: [-150, -200], leaves: [190, -170], flower: [200, -340] };
  const ask4 = byLv(['roots', 'leaves'], ['roots', 'stem', 'leaves', 'flower'], ['roots', 'stem', 'leaves', 'flower']);
  await run.say('Here is a big sunflower, with its roots under the soil. Every part has a job!');
  for (const k of ask4) {
    const m = await tapPart(run, parts, k, { prompt: PART_Q[k], about: PART_ABOUT });
    const [lx, ly] = labelAt[k];
    const tag = node(P.inner, lx, ly); tag.inner.classList.add('pop-in');
    el('rect', { x: -80, y: -26, width: 160, height: 52, rx: 26, fill: '#fff', stroke: '#7cb342', 'stroke-width': 4 }, tag.inner);
    txt(tag.inner, 0, 2, k[0].toUpperCase() + k.slice(1), 28, { fill: '#33691e', 'font-weight': 700 });
    burst(root, P.x + lx, P.y + ly, 10);
    await run.say(`${praise(m)} ${PART_ABOUT[k]}`);
  }

  // photosynthesis
  const sn = node(root, 1240, 240); sun(sn.inner, { s: .7 });
  const rays = el('g', { opacity: 0 }, root);
  for (const [x, y] of [[665, 510], [780, 530]]) el('line', { x1: 1200, y1: 280, x2: x, y2: y, stroke: '#ffee58', 'stroke-width': 10, 'stroke-dasharray': '18 14', 'stroke-linecap': 'round' }, rays);
  await run.anim(700, t => rays.setAttribute('opacity', t));
  await run.say('Here is a secret. Leaves are like little kitchens! They use sunlight, water and air to make sugary food for the plant.');
  await bigWord(run, 'photosynthesis');
  if (lv() > 0) {
    const r = await ask(run, {
      prompt: 'When leaves make food, they also let out a gas that people and animals need to breathe. What is it?', y: 560, tileW: 260, tileH: 200,
      options: shuffle([{ icon: '🫧', label: 'Oxygen', correct: true }, { icon: '💨', label: 'Smoke', why: 'Smoke comes from fires, not leaves. Think about what WE need to breathe.' }, { icon: '🧃', label: 'Juice', why: 'Ha ha! Juice is not a gas. Think about what we breathe.' }]),
    });
    await run.say(`${praise(r.misses)} Oxygen! Plants make the air we breathe. Thank you, plants!`);
  }
  clear();

  /* ===== 4. pollination ===== */
  const kinds = byLv(['sun', 'purple', 'sun'], ['sun', 'purple', 'sun', 'pink'], ['sun', 'yellow', 'purple', 'sun', 'pink']);
  const order = ['sun', ...shuffle(kinds.slice(1))];
  const fx = order.map((_, i) => 260 + i * (1000 / Math.max(1, order.length - 1)));
  const fl = {}, flowers = order.map((k, i) => {
    const f = node(root, fx[i], 720);
    if (k === 'sun') plantStage(f.inner, 4, { s: 1.05 });
    else { const g = el('g', { transform: 'scale(5.5)' }, f.inner); flower(g, 0, 0, { purple: '#ab47bc', pink: '#f06292', yellow: '#fdd835' }[k]); }
    f.k = k; fl['f' + i] = f.inner;
    return f;
  });
  const bee = node(root, 160, 250); bee.inner.classList.add('bob');
  txt(bee.inner, 0, 0, '🐝', 80, { class: 'emoji' });
  const pollen = el('g', { opacity: 0 }, bee.inner);
  for (const [x, y] of [[-14, 18], [6, 24], [18, 10], [-4, 8]]) el('circle', { cx: x, cy: y, r: 6, fill: '#fdd835' }, pollen);
  await run.say('Flowers need a helper to make seeds. Here comes a bumblebee! Tap the bee.');
  pulse(bee.inner);
  await run.tap(bee.inner);
  pulse(bee.inner, false);
  const first = flowers[0], top = f => [f.x, f.y - (f.k === 'sun' ? 180 : 110)];
  await moveTo(bee, ...top(first), 1000, run, ease.inOut);
  pollen.setAttribute('opacity', 1); sfx.pop();
  await run.say('The bee drinks sweet nectar. And look! Yellow sunflower pollen sticks to its fuzzy body.');
  const targetIdx = order.findIndex((k, i) => i > 0 && k === 'sun');
  const about = {};
  flowers.forEach((f, i) => { about['f' + i] = i === 0 ? 'The bee was just there! Find a DIFFERENT sunflower.' : f.k === 'yellow' ? 'That flower is yellow too, but it is not a sunflower. Look at its shape!' : 'That is a different kind of flower. Sunflower pollen only helps sunflowers!'; });
  const m = await tapPart(run, fl, 'f' + targetIdx, { prompt: 'The bee has sunflower pollen. Which flower should it visit next? Tap it!', about });
  const t2 = flowers[targetIdx];
  await moveTo(bee, ...top(t2), 1000, run, ease.inOut);
  pollen.setAttribute('opacity', 0);
  while (t2.inner.firstChild) t2.inner.removeChild(t2.inner.firstChild);
  plantStage(t2.inner, 5, { s: 1.05 }); t2.inner.classList.add('pop-in');
  sfx.star(); burst(root, t2.x, t2.y - 180, 18);
  await run.say(`${praise(m)} The pollen from one sunflower helped the other sunflower make lots of new seeds!`);
  await bigWord(run, 'pollination');
  clear();

  /* ===== 5. measuring (maths) ===== */
  const base = 680, AY = 735;
  el('line', { x1: 150, y1: base, x2: 1300, y2: base, stroke: '#795548', 'stroke-width': 6 }, root);
  if (lv() < 2) {
    const a = lv() === 0 ? 10 : rand(1, 2) * 10 + rand(1, 9);
    const hts = [a, a + 10, a + 20, a + 30];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday'];
    const bars = hts.map((h, i) => bar(root, 360 + i * 220, base, h, days[i], { unknown: i === 3 }));
    txt(root, 760, 180, '📏 How tall is the sunflower? (cm)', 36, { fill: '#33691e', 'font-weight': 700 });
    await run.say(lv() === 0
      ? 'Booboo measured the sunflower every day. It grows 10 centimeters every day!'
      : `Booboo measured the sunflower every day. On Monday it was ${a} centimeters tall. It grows 10 centimeters every day!`);
    pulse(bars[3].inner);
    const r = await ask(run, {
      prompt: `${hts[2]} centimeters on Wednesday. How tall will it be on Thursday?`, y: AY, tileW: 190, tileH: 150,
      options: numOpts(hts[3], hts[3] + 10, hts[3] + 1), hint: `It grows 10 more every day. What is ${hts[2]}, and 10 more?`,
    });
    pulse(bars[3].inner, false);
    bars[3].remove(); bar(root, 360 + 3 * 220, base, hts[3], days[3]).inner.classList.add('pop-in');
    await run.say(`${praise(r.misses)} ${hts[3]} centimeters!`);
    if (lv() === 1) {
      const r2 = await ask(run, {
        prompt: `On Monday it was ${a}. On Thursday it was ${hts[3]}. How much did it grow in all?`, y: AY, tileW: 190, tileH: 150,
        options: numOpts(30, 3, 40), hint: 'It grew 10 on Tuesday, 10 on Wednesday, and 10 on Thursday. Count by tens!',
      });
      await run.say(`${praise(r2.misses)} 10, 20, 30. It grew 30 centimeters!`);
    }
  } else {
    const sunH = rand(6, 8) * 10 + rand(1, 9), d = pick([20, 30, 40]), tom = sunH - d;
    txt(root, 760, 180, '📏 Which plant is taller? (cm)', 36, { fill: '#33691e', 'font-weight': 700 });
    bar(root, 520, base, sunH, 'Sunflower', { px: 4 });
    const tb = bar(root, 900, base, tom, 'Tomato', { color: '#e57373', px: 4 });
    await run.say(`The sunflower is ${sunH} centimeters tall. The tomato plant is ${tom} centimeters tall.`);
    const r = await ask(run, {
      prompt: 'How much taller is the sunflower?', y: AY, tileW: 190, tileH: 150,
      options: numOpts(d, d + 10, d - 10), hint: `Look at the tens. Count up from ${tom} by tens until you reach ${sunH}.`,
    });
    await run.say(`${praise(r.misses)} The sunflower is ${d} centimeters taller!`);
    const r2 = await ask(run, {
      prompt: `If the tomato plant grows 15 more centimeters, how tall will it be?`, y: AY, tileW: 190, tileH: 150,
      options: numOpts(tom + 15, tom + 5, tom + 25), hint: `Add 10 first, then add 5 more. ${tom}, then ${tom + 10}, then...?`,
    });
    tb.remove(); bar(root, 900, base, tom + 15, 'Tomato', { color: '#e57373', px: 4 }).inner.classList.add('pop-in');
    await run.say(`${praise(r2.misses)} ${tom + 15} centimeters!`);
  }
  await finish(run, 'garden', 'Garden scientist! You grew a seed, learned the life cycle, and helped a bee pollinate!');
}
