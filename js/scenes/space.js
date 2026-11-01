import { el, txt, node, stage, ask, praise, bigWord, sceneButtons, attachGuide, finish, pulse, burst, shake, wrapText, W, H } from '../ui.js';
import { booboFull, booboHead, planet, PLANETS, PLANET_NAMES, C } from '../art.js';
import { state, lv, byLv, shuffle, pick, rand } from '../state.js';
import { sfx } from '../audio.js';
import { say } from '../speech.js';
import { ease } from '../run.js';

const GIANTS = ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], ROCKY = ['Mercury', 'Venus', 'Earth', 'Mars'];
const RIDDLES = [
  { a: 'Saturn', clues: [['I am a giant planet, made of gas.', GIANTS], ['I have the biggest, brightest rings of all.', ['Saturn']]] },
  { a: 'Jupiter', clues: [['I am a giant planet, made of gas.', GIANTS], ['I am the biggest planet of all, with a giant storm called the Great Red Spot.', ['Jupiter']]] },
  { a: 'Earth', clues: [['I am a rocky planet.', ROCKY], ['I have big oceans of water, and people live on me!', ['Earth']]] },
  { a: 'Mars', clues: [['I am a rocky planet.', ROCKY], ['I am farther from the Sun than Venus.', ['Earth', 'Mars']], ['I am red and dusty, and rovers drive on me!', ['Mars']]] },
  { a: 'Venus', clues: [['I am a rocky planet.', ROCKY], ['I am closer to the Sun than Earth.', ['Mercury', 'Venus']], ['I am the hottest planet, wrapped in thick clouds.', ['Venus']]] },
  { a: 'Mercury', clues: [['I am a rocky planet.', ROCKY], ['I am closer to the Sun than Earth.', ['Mercury', 'Venus']], ['I am the smallest planet of all.', ['Mercury']]] },
  { a: 'Neptune', clues: [['I am a giant planet.', GIANTS], ['I am farther from the Sun than Saturn.', ['Uranus', 'Neptune']], ['I am the very farthest planet from the Sun.', ['Neptune']]] },
  { a: 'Uranus', clues: [['I am a giant planet.', GIANTS], ['I am farther from the Sun than Saturn.', ['Uranus', 'Neptune']], ['I spin tipped over on my side, like a rolling ball!', ['Uranus']]] },
];
const andList = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' or ' + a[a.length - 1];

function starfield(p, n = 120) {
  for (let i = 0; i < n; i++) el('circle', { cx: Math.random() * W, cy: Math.random() * H, r: Math.random() * 2.2 + .4, fill: '#fff', opacity: Math.random() * .7 + .3, class: i % 7 ? '' : 'twinkle' }, p);
}

export async function spaceScene(run) {
  const s = stage();
  const bg = el('g', {}, s);
  el('rect', { width: W, height: H, fill: '#0d1030' }, bg);
  starfield(bg);
  const root = el('g', {}, s);
  const gd = node(s, 1500, 752); booboFull(gd.inner, { s: .6 }); gd.inner.classList.add('guide'); attachGuide(gd.inner);
  sceneButtons(run);
  const clear = () => { while (root.firstChild) root.removeChild(root.firstChild); };

  /* ===== 1. line up the planets ===== */
  const bySize = lv() > 0;
  const order = PLANET_NAMES.slice().sort((a, b) => bySize ? PLANETS[a].size - PLANETS[b].size : PLANETS[a].order - PLANETS[b].order);
  if (!bySize) { el('circle', { cx: -60, cy: 300, r: 190, fill: '#ffca28' }, root); el('circle', { cx: -60, cy: 300, r: 230, fill: '#ffca28', opacity: .25 }, root); }
  txt(root, 800, 205, bySize ? 'Biggest  ➜  Smallest' : 'From the Sun  ➜', 40, { fill: '#fff', 'font-weight': 700 });
  const slots = order.map((_, i) => {
    const n = node(root, 260 + i * 156, 345);
    el('circle', { r: 58, fill: 'none', stroke: '#5c6bc0', 'stroke-width': 4, 'stroke-dasharray': '8 8' }, n.inner);
    txt(n.inner, 0, 2, String(i + 1), 36, { fill: '#5c6bc0', 'font-weight': 700 });
    return n;
  });
  await run.wait(300);
  await run.say(bySize
    ? "Welcome to the Space Center, astronaut! You know all the planets. But can you line them up from the BIGGEST to the SMALLEST?"
    : "Welcome to the Space Center, astronaut! Let's line up the planets, starting with the one closest to the Sun.");
  const tileArt = name => (g, w, h) => { planet(g, name, 40, { y: -16 }); txt(g, 0, h / 2 - 24, name, 22, { class: 'lbl', 'font-weight': 700 }); };
  let rest = PLANET_NAMES.slice();
  for (let i = 0; i < order.length; i++) {
    const a = order[i];
    pulse(slots[i].inner);
    const prompt = i === 0 ? (bySize ? 'Which planet is the biggest?' : 'Which planet is closest to the Sun?') : i === order.length - 1 ? (bySize ? 'And the smallest planet is...' : 'And the farthest planet is...') : pick(bySize ? ['Which is the next biggest?', 'Next biggest?'] : ['Which planet comes next?', 'What comes next?']);
    const r = await ask(run, {
      prompt, y: 560, tileW: 150, tileH: 170, gap: 14,
      options: rest.map(n => ({ name: n, draw: tileArt(n), correct: n === a, bg: '#1d2342', stroke: '#5c6bc0' })),
      hint: o => {
        if (bySize && a === 'Uranus' && o.name === 'Neptune') return 'So close! Uranus and Neptune are almost the same size, but Uranus is just a tiny bit wider.';
        if (bySize && a === 'Earth' && o.name === 'Venus') return 'So close! Venus is almost Earth\'s twin, but Earth is just a little bit bigger.';
        return bySize ? 'Hmm, think about which one is bigger.' : 'Hmm, think about which one is closer to the Sun.';
      },
    });
    rest = rest.filter(n => n !== a);
    pulse(slots[i].inner, false);
    while (slots[i].inner.firstChild) slots[i].inner.removeChild(slots[i].inner.firstChild);
    slots[i].inner.classList.add('pop-in');
    planet(slots[i].inner, a, 46);
    txt(slots[i].inner, 0, 90, a, 24, { fill: '#fff', 'font-weight': 700 });
    sfx.pop();
    if (!r.misses) say(a + '!');
  }
  if (bySize) {
    await run.say('Perfect! Now look how big they REALLY are, compared to each other!');
    for (let i = 0; i < order.length; i++) {
      const sl = slots[i]; while (sl.inner.firstChild) sl.inner.removeChild(sl.inner.firstChild);
      const rr = Math.max(3, 74 * PLANETS[order[i]].radiusKm / 69911);
      planet(sl.inner, order[i], rr);
      txt(sl.inner, 0, 100, order[i], 22, { fill: '#fff', 'font-weight': 700 });
    }
    await run.say('Jupiter is SO big, that eleven Earths could line up across it! And tiny Mercury is barely bigger than our Moon.');
  } else {
    await run.say('Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune! Here is a trick: My Very Excellent Mother Just Served Us Noodles!');
  }
  clear();

  /* ===== 2. rocky or giant? ===== */
  const sortSet = shuffle([...shuffle(ROCKY).slice(0, 2), ...shuffle(GIANTS).slice(0, 2)]);
  await run.say('Some planets are rocky, and some are giant balls of gas. Let\'s sort them!');
  const seenKind = {};
  for (const name of sortSet) {
    const p = node(root, 800, 330); p.inner.classList.add('pop-in');
    planet(p.inner, name, 110);
    txt(root, 800, 490, name, 40, { fill: '#fff', 'font-weight': 700 });
    const rocky = PLANETS[name].rocky;
    const r = await ask(run, {
      prompt: `${name}. Is it a rocky planet, or a giant?`, y: 560, tileW: 330, tileH: 200,
      options: [{ icon: '🪨', label: 'Rocky planet', correct: rocky }, { icon: '💨', label: 'Giant planet', correct: !rocky }],
      hint: rocky ? 'Hmm, could you stand on it?' : 'Hmm, is it huge? Could you stand on it?',
    });
    const why = rocky ? `${name} has hard, rocky ground. You could stand on it!` : name === 'Uranus' || name === 'Neptune' ? `${name} is an ice giant, made of gas and ice. There's no ground to stand on!` : `${name} is a gas giant. There's no ground to stand on at all!`;
    await run.say(`${praise(r.misses)} ${why}`);
    const kind = rocky ? 'terrestrial' : 'gasgiant';
    if (!seenKind[kind]) { seenKind[kind] = 1; await bigWord(run, kind); }
    clear();
  }

  /* ===== 3. Who am I? (deduction) ===== */
  const riddles = shuffle(RIDDLES.filter(r => lv() === 0 ? r.clues.length === 2 : lv() === 2 ? r.clues.length === 3 : true)).slice(0, byLv(1, 2, 2));
  await run.say('Riddle time! I am thinking of a planet. Listen to the clues, and figure out which one it is.');
  for (const rd of riddles) {
    clear();
    txt(root, 800, 160, '🔎 Who am I?', 46, { fill: '#fff', 'font-weight': 700 });
    const line = {};
    PLANET_NAMES.forEach((n, i) => {
      const g = node(root, 250 + i * 157, 330); g.inner.classList.add('tap');
      planet(g.inner, n, 46);
      txt(g.inner, 0, 84, n, 22, { fill: '#fff', 'font-weight': 700 });
      line[n] = g;
    });
    let alive = PLANET_NAMES.slice();
    const why = {};
    for (let c = 0; c < rd.clues.length; c++) {
      const [text, keep] = rd.clues[c];
      const card = node(root, 800, 480 + c * 62); card.inner.classList.add('pop-in');
      el('rect', { x: -560, y: -26, width: 1120, height: 52, rx: 26, fill: '#283593' }, card.inner);
      txt(card.inner, 0, 2, `Clue ${c + 1}: ${text}`, 27, { fill: '#fff' });
      await run.say(`Clue ${c + 1}. ${text}`);
      const out = alive.filter(n => !keep.includes(n));
      out.forEach(n => { why[n] = text; });
      if (out.length) {
        await run.say(c === rd.clues.length - 1 ? 'Only one planet is left!' : `So it can't be ${andList(out)}. Let's put them away.`);
        sfx.whoosh();
        await run.anim(500, t => out.forEach(n => line[n].setAttribute('opacity', 1 - t * .8)));
        alive = alive.filter(n => keep.includes(n));
      }
    }
    pulse(line[rd.a].inner);
    run.say('Who am I? Tap the planet!');
    for (;;) {
      const i = await run.tapAny(PLANET_NAMES.map(n => line[n].inner));
      const n = PLANET_NAMES[i];
      if (n === rd.a) break;
      sfx.boing(); shake(line[n].inner);
      say(why[n] ? `Not ${n}. Remember the clue: ${why[n]}` : `Hmm, listen to the clues again!`);
    }
    pulse(line[rd.a].inner, false);
    sfx.chime(); burst(root, line[rd.a].x, 330, 24);
    await run.say(`Yes! I am ${rd.a}! You used the clues to figure it out.`);
    if (!state.words.includes('deduction')) await bigWord(run, 'deduction');
  }
  clear();

  /* ===== 4. countdown + launch ===== */
  const tens = lv() === 2;
  const seq = Array.from({ length: 10 }, (_, i) => tens ? 100 - i * 10 : 10 - i);
  const blanks = shuffle([2, 3, 4, 5, 6, 7]).slice(0, byLv(1, 2, 3)).sort((a, b) => a - b);
  const rocket = node(root, 1240, 640);
  el('rect', { x: -110, y: 110, width: 220, height: 30, rx: 10, fill: '#546e7a' }, rocket.inner);
  const flame = el('path', { d: 'M-24 100 Q0 190 24 100Z', fill: '#ff9800', opacity: 0 }, rocket.inner);
  const rb = el('g', {}, rocket.inner);
  el('path', { d: 'M0 -230 C48 -180 48 -40 40 60 L-40 60 C-48 -40 -48 -180 0 -230Z', fill: '#fff', stroke: '#b0bec5', 'stroke-width': 5 }, rb);
  el('path', { d: 'M0 -230 C24 -205 36 -180 40 -160 L-40 -160 C-36 -180 -24 -205 0 -230Z', fill: C.car }, rb);
  el('circle', { cx: 0, cy: -95, r: 34, fill: '#81d4fa', stroke: '#b0bec5', 'stroke-width': 5 }, rb);
  booboHead(rb, { y: -95, s: .5 });
  el('path', { d: 'M-40 0 L-80 90 L-40 60Z M40 0 L80 90 L40 60Z', fill: C.car }, rb);
  el('rect', { x: -22, y: 60, width: 44, height: 40, fill: '#90a4ae' }, rb);
  const boxes = seq.map((v, i) => {
    const n = node(root, 200 + i * 104, 190);
    el('rect', { x: -44, y: -44, width: 88, height: 88, rx: 20, fill: blanks.includes(i) ? '#fff8e1' : '#fff', stroke: blanks.includes(i) ? '#ffb300' : '#c5cae9', 'stroke-width': 5, 'stroke-dasharray': blanks.includes(i) ? '8 6' : '' }, n.inner);
    n.t = txt(n.inner, 0, 3, blanks.includes(i) ? '?' : String(v), tens && v === 100 ? 34 : 42, { fill: blanks.includes(i) ? '#ffb300' : '#1a237e', 'font-weight': 700 });
    return n;
  });
  await run.say(tens ? 'Booboo is ready to launch! Scientists count down by tens. Some numbers are missing!' : 'Booboo is ready to launch! Let\'s count down from ten. Some numbers are missing!');
  for (const i of blanks) {
    pulse(boxes[i].inner);
    const v = seq[i], step = tens ? 10 : 1;
    const opts = shuffle([v, v + step, v - step].filter((x, j, a) => x >= 0 && a.indexOf(x) === j));
    const r = await ask(run, {
      prompt: `${seq[i - 1]}, then...?`, y: 560, tileW: 190, tileH: 150,
      options: opts.map(x => ({ label: String(x), correct: x === v, labelSize: 64 })),
      hint: `Counting down, the numbers get smaller. What comes right after ${seq[i - 1]}?`,
    });
    pulse(boxes[i].inner, false);
    boxes[i].t.textContent = String(v); boxes[i].t.setAttribute('fill', '#1a237e');
    sfx.pop();
    if (!r.misses) say(pick(['Yes!', 'Right!', String(v) + '!']));
  }
  await run.wait(500);
  await run.say('Everyone count with me!');
  const cd = run.say(seq.join('! ') + '! Blast off!');
  for (let i = 0; i < seq.length; i++) {
    boxes[i].inner.classList.add('pop-in');
    boxes[i].inner.querySelector('rect').setAttribute('fill', '#ffd54f');
    await run.wait(tens ? 720 : 560);
  }
  await cd;
  sfx.launch();
  flame.setAttribute('opacity', 1); flame.classList.add('flicker');
  const puffs = el('g', {}, root);
  await run.anim(2600, t => {
    const y = 640 - 1200 * t * t;
    rocket.moveTo(1240 + Math.sin(t * 40) * 3 * (1 - t), y);
    if (Math.random() < .3) { const c = el('circle', { cx: 1240 + (Math.random() - .5) * 80, cy: y + 150, r: 20 + Math.random() * 30, fill: '#cfd8dc', opacity: .7 }, puffs); setTimeout(() => c.remove(), 1200); }
  }, ease.linear);
  await run.say('Woohoo! Booboo is flying to space!');
  await finish(run, 'space', 'Space expert! You sorted planets, solved riddles, and launched a rocket!', {
    label: 'Planet Parade', icon: '🪐', onTap: () => { try { window.open('https://hdcsnags.github.io/planet-parade/', '_blank', 'noopener'); } catch (e) {} },
  });
}
