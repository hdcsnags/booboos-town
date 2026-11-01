import { state } from './state.js';

// Talking voice. Natural/neural voices are ranked first (Edge "Natural", Google, Apple "Enhanced").
const can = 'speechSynthesis' in window;
const NATURAL = /natural|neural|online|enhanced|premium|siri/i;
let voices = [], voice = null;
function score(v) {
  let s = 0;
  if (NATURAL.test(v.name)) s += 6;
  if (/google/i.test(v.name)) s += 3;
  if (/en[-_](us|ca)/i.test(v.lang)) s += 1;
  if (/aria|jenny|ava|emma|samantha|zira/i.test(v.name)) s += .5;
  return s;
}
export function loadVoices() {
  if (!can) return;
  voices = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)).sort((a, b) => score(b) - score(a));
  voice = voices.find(v => v.name === state.voiceName) || voices[0] || null;
}
if (can) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
export const voiceList = () => voices;
export const canSpeak = can;

let speakingCb = null;
export function onSpeaking(cb) { speakingCb = cb; }
const setSpeaking = v => { try { speakingCb && speakingCb(v); } catch (e) {} };

const cap = () => document.getElementById('caption');
let gen = 0, capTimer = 0;
function showCaption(text) {
  const c = cap(); if (!c) return;
  c.textContent = text; c.hidden = false;
  c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
  clearTimeout(capTimer);
  capTimer = setTimeout(() => { c.hidden = true; }, 3200 + text.length * 55);
}

/** Speak (and caption) text. Resolves when finished, or when something newer interrupts it. */
export function say(text, { caption = text } = {}) {
  return new Promise(res => {
    const g = ++gen;
    let done = false, t1 = 0, t2 = 0;
    const fin = () => { if (done) return; done = true; clearTimeout(t1); clearTimeout(t2); if (g === gen) setSpeaking(false); res(); };
    showCaption(caption);
    setSpeaking(true);
    const rate = state.rate || 1;
    const est = (900 + text.length * 72) / rate / (window.BT_FAST || 1);
    if (!state.voice || !can || window.BT_FAST) { t2 = setTimeout(fin, est); return; }
    try { speechSynthesis.cancel(); } catch (e) {}
    // Android Chrome drops an utterance spoken in the same tick as cancel(): start a moment later.
    t1 = setTimeout(() => {
      if (g !== gen) { fin(); return; }
      try {
        const u = new SpeechSynthesisUtterance(text);
        if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-US';
        const nat = voice && NATURAL.test(voice.name);
        u.rate = (nat ? .95 : .9) * rate;
        u.pitch = nat ? 1.05 : 1.12;
        u.onend = u.onerror = fin;
        speechSynthesis.speak(u);
      } catch (e) { fin(); }
    }, 70);
    t2 = setTimeout(fin, est + 6000); // some engines never fire onend
  });
}
export function hush() {
  gen++; setSpeaking(false);
  try { if (can) speechSynthesis.cancel(); } catch (e) {}
  const c = cap(); if (c) c.hidden = true;
}
