import { state } from './state.js';

// Tiny synthesized sound effects: nothing to download or license.
let ctx = null;
export function unlockAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) {}
}
function tone(freq, dur, { type = 'sine', vol = .15, at = 0, slide = 0 } = {}) {
  if (!ctx || !state.sfx) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
  g.gain.setValueAtTime(.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + .015);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t); o.stop(t + dur + .05);
}
function noise(dur, { vol = .12, freq = 1200, q = .8, at = 0, sweep = 0 } = {}) {
  if (!ctx || !state.sfx) return;
  const t = ctx.currentTime + at;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q; f.frequency.setValueAtTime(freq, t);
  if (sweep) f.frequency.exponentialRampToValueAtTime(freq * sweep, t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + dur * .2); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  src.connect(f).connect(g).connect(ctx.destination); src.start(t); src.stop(t + dur + .05);
}
const NOTE = { G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99 };
/** play a little music-box tune: notes like ['G4','C5'] ; beat in ms */
export function melody(notes, beat = 300) {
  notes.forEach((n, i) => {
    if (!NOTE[n]) return;
    tone(NOTE[n], .9, { at: i * beat / 1000, vol: .07, type: 'triangle' });
    tone(NOTE[n] * 2, .4, { at: i * beat / 1000, vol: .02 });
  });
  return notes.length * beat;
}
export const sfx = {
  pop() { tone(520, .12, { slide: 2, vol: .12 }); },
  tap() { tone(760, .07, { vol: .07, type: 'triangle' }); },
  chime() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .55, { at: i * .08, vol: .1, type: 'triangle' })); },
  star() { [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(f, .7, { at: i * .07, vol: .09, type: 'triangle' })); },
  boing() { tone(260, .32, { slide: .55, vol: .12, type: 'triangle' }); },
  honk() { tone(392, .14, { type: 'square', vol: .05 }); tone(392, .2, { type: 'square', vol: .05, at: .2 }); },
  bump() { tone(140, .22, { slide: .5, vol: .2 }); noise(.15, { vol: .1, freq: 300 }); },
  step() { tone(900, .05, { vol: .035 }); },
  drip() { tone(1300, .12, { slide: .35, vol: .1 }); },
  rain(dur = 2) { noise(dur, { vol: .1, freq: 2500, q: .4 }); },
  whoosh() { noise(.8, { vol: .14, freq: 400, sweep: 6 }); },
  launch() { noise(2.5, { vol: .25, freq: 150, sweep: 4, q: .5 }); },
  click() { tone(1200, .03, { vol: .05, type: 'square' }); },
};
