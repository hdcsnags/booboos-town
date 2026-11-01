import { scenes, go } from './nav.js';
import { town } from './town.js';
import { spiderScene } from './scenes/spider.js';
import { rainbowScene } from './scenes/rainbow.js';
import { spaceScene } from './scenes/space.js';
import { el, txt, node, stage, W, H } from './ui.js';
import { booboFull, pinkCar, cloud, sun, flower } from './art.js';
import { unlockAudio, sfx } from './audio.js';
import { state, save, resetProgress } from './state.js';
import { voiceList, loadVoices, say, canSpeak } from './speech.js';

async function title(run) {
  const s = stage();
  const defs = el('defs', {}, s);
  const g = el('linearGradient', { id: 'tSky', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: 0, 'stop-color': '#ffd1e8' }, g); el('stop', { offset: 1, 'stop-color': '#c9ecff' }, g);
  el('rect', { width: W, height: H, fill: 'url(#tSky)' }, s);
  sun(s, { x: 1400, y: 140, s: .9 });
  cloud(s, { x: 230, y: 130, s: .8 }); cloud(s, { x: 1050, y: 90, s: .55 });
  el('path', { d: 'M0 700 Q400 640 800 690 T1600 670 L1600 900 L0 900Z', fill: '#a5d66f' }, s);
  [[150, 800], [330, 760], [1300, 790], [1480, 820], [980, 850]].forEach(([x, y], i) => flower(s, x, y, ['#ff80ab', '#ffd54f', '#ce93d8', '#ff8a65', '#80deea'][i]));
  txt(s, 800, 150, "Booboo's Town", 120, { fill: '#ff4f9a', stroke: '#fff', 'stroke-width': 10, 'paint-order': 'stroke', 'font-weight': 700 });
  txt(s, 800, 250, 'Science  •  Numbers  •  Coding', 40, { fill: '#7e57c2', 'font-weight': 600 });
  const b = node(s, 400, 520); b.inner.classList.add('bob'); booboFull(b.inner, { s: 1.5 });
  const c = node(s, 1200, 690); c.inner.classList.add('bob'); const cg = el('g', { transform: 'scale(-1.3 1.3)' }, c.inner); pinkCar(cg);
  const play = node(s, 800, 520); play.inner.classList.add('tap', 'pulse');
  el('circle', { r: 118, fill: 'rgba(0,0,0,.15)', cy: 8 }, play.inner);
  el('circle', { r: 118, fill: '#4caf50', stroke: '#fff', 'stroke-width': 12 }, play.inner);
  el('path', { d: 'M-34 -56 L64 0 L-34 56Z', fill: '#fff' }, play.inner);
  await run.tap(play.inner);
  unlockAudio(); sfx.honk();
  if (matchMedia('(pointer: coarse)').matches) {
    try { await document.documentElement.requestFullscreen?.(); await screen.orientation?.lock?.('landscape'); } catch (e) {}
  }
  go('town');
}

scenes.title = title;
scenes.town = town;
scenes.spider = spiderScene;
scenes.rainbow = rainbowScene;
scenes.space = spaceScene;

/* ---------- grown-ups panel: hold the gear ---------- */
const $ = id => document.getElementById(id);
const gear = $('gear'), panel = $('parent');
let holdT = 0;
const startHold = e => { e.preventDefault(); gear.classList.add('holding'); holdT = setTimeout(openParent, 1200); };
const endHold = () => { gear.classList.remove('holding'); clearTimeout(holdT); };
gear.addEventListener('pointerdown', startHold);
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => gear.addEventListener(ev, endHold));
function openParent() {
  endHold(); loadVoices();
  document.querySelectorAll('#pLevel button').forEach(b => b.classList.toggle('on', b.dataset.level === state.level));
  $('pVoice').checked = state.voice; $('pSfx').checked = state.sfx; $('pRate').value = state.rate;
  const sel = $('pVoiceSel'); sel.innerHTML = '';
  const vs = voiceList();
  if (!vs.length) sel.append(new Option(canSpeak ? 'Default voice' : 'No voice on this device', ''));
  vs.forEach(v => sel.append(new Option(`${v.name} (${v.lang})`, v.name, false, v.name === state.voiceName)));
  const st = state.stars;
  $('pStats').textContent = `Stars: Spider Spout ${st.spider}, Rainbow Lab ${st.rainbow}, Space Center ${st.space}, Code drives ${st.code}. Big words learned: ${state.words.length}.`;
  panel.hidden = false;
}
document.querySelectorAll('#pLevel button').forEach(b => b.addEventListener('click', () => {
  state.level = b.dataset.level; save();
  document.querySelectorAll('#pLevel button').forEach(x => x.classList.toggle('on', x === b));
}));
$('pVoice').addEventListener('change', e => { state.voice = e.target.checked; save(); });
$('pSfx').addEventListener('change', e => { state.sfx = e.target.checked; save(); });
$('pRate').addEventListener('input', e => { state.rate = +e.target.value; save(); });
$('pVoiceSel').addEventListener('change', e => { state.voiceName = e.target.value; save(); loadVoices(); });
$('pTest').addEventListener('click', () => { unlockAudio(); say('Hi! I am Booboo. Evaporation, condensation, precipitation!'); });
$('pReset').addEventListener('click', () => { if (confirm('Reset all stars and big words?')) { resetProgress(); openParent(); } });
$('pClose').addEventListener('click', () => { panel.hidden = true; if (stage().dataset.scene === 'town') go('town'); });

$('rotate').addEventListener('click', () => document.body.classList.add('rotate-ok'));

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

window.BT = { go, state }; // handy for testing from the console
const m = location.hash.match(/scene=(\w+)/);
go(m && scenes[m[1]] ? m[1] : 'title');
