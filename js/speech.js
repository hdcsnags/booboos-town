import { state } from './state.js';

/*
 * Booboo's voice. Every line in the game is pre-recorded with a natural neural voice
 * (tools/voice.py → audio/voice/). Lines with numbers or names in them are stitched from clips:
 * "The gauge has 47." = [the gauge has] + [47]. Anything not recorded falls back to the device's
 * own text-to-speech for just that sentence (and logs "voice-missing" so it can be added).
 */

/* ---------- recorded clips ---------- */
let VO = null;
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
fetch('audio/voice/index.json').then(r => r.ok ? r.json() : null).then(j => {
  if (!j) return;
  VO = {
    clips: j.clips,
    tpl: j.templates.map(parts => ({ parts, re: new RegExp('^' + parts.map(esc).join(' ?(.+?) ?') + '$') })),
  };
}).catch(() => {});
export const recordedReady = () => !!VO;

/** MUST match norm() in tools/voice.py */
export function norm(s) {
  s = s.toLowerCase().replace(/[’‘]/g, "'");
  s = s.replace(/[^a-z0-9' ]+/g, ' ');
  s = s.replace(/(^| )'+|'+( |$)/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}
/** MUST match split_sentences() in tools/voice.py */
const splitSentences = s => s.trim().split(/(?<=[.!?])\s+/).filter(x => x.trim());

function seg(n) { // greedy longest match of known clips over the words
  const C = VO.clips, w = n.split(' '), out = [];
  let i = 0;
  while (i < w.length) {
    let hit = false;
    for (let L = Math.min(w.length - i, 16); L > 0; L--) {
      const k = w.slice(i, i + L).join(' ');
      if (C[k]) { out.push(C[k]); i += L; hit = true; break; }
    }
    if (!hit) return null;
  }
  return out;
}
function resolveSentence(s) {
  const C = VO.clips, n = norm(s);
  if (!n) return [];
  if (C[n]) return [C[n]];
  for (const t of VO.tpl) {
    const m = n.match(t.re);
    if (!m) continue;
    const out = []; let ok = true;
    for (let i = 0; i < t.parts.length && ok; i++) {
      if (t.parts[i]) { if (C[t.parts[i]]) out.push(C[t.parts[i]]); else ok = false; }
      if (ok && i < t.parts.length - 1) { const g = seg(m[i + 1]); if (g) out.push(...g); else ok = false; }
    }
    if (ok) return out;
  }
  return seg(n);
}
/** text → [{f: file} | {tts: sentence}] ; joins sentences when a longer recorded clip exists */
export function resolve(text) {
  const ss = splitSentences(text), out = [];
  let i = 0;
  while (i < ss.length) {
    let took = false;
    for (let j = ss.length; j > i + 1; j--) {
      const k = norm(ss.slice(i, j).join(' '));
      if (VO.clips[k]) { out.push({ f: VO.clips[k] }); i = j; took = true; break; }
    }
    if (took) continue;
    const r = resolveSentence(ss[i]);
    if (r) out.push(...r.map(f => ({ f })));
    else { out.push({ tts: ss[i] }); console.warn('voice-missing:', ss[i]); }
    i++;
  }
  return out;
}

/* ---------- device text-to-speech (fallback, or chosen in Grown-ups) ---------- */
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
function speakTTS(text, done) {
  if (!can) { setTimeout(done, 900 + text.length * 70); return; }
  try {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) { u.voice = voice; u.lang = voice.lang; } else u.lang = 'en-US';
    const nat = voice && NATURAL.test(voice.name);
    u.rate = (nat ? .95 : .9) * (state.rate || 1);
    u.pitch = nat ? 1.05 : 1.12;
    u.onend = u.onerror = done;
    speechSynthesis.speak(u);
  } catch (e) { done(); }
}

/* ---------- captions + speaking state ---------- */
let speakingCb = null;
export function onSpeaking(cb) { speakingCb = cb; }
const setSpeaking = v => { try { speakingCb && speakingCb(v); } catch (e) {} };
const cap = () => document.getElementById('caption');
let gen = 0, capTimer = 0, curAudio = null;
function showCaption(text) {
  const c = cap(); if (!c) return;
  c.textContent = text; c.hidden = false;
  c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
  clearTimeout(capTimer);
  capTimer = setTimeout(() => { c.hidden = true; }, 3200 + text.length * 55);
}
function stopAudio() {
  if (curAudio) { curAudio.onended = curAudio.onerror = null; try { curAudio.pause(); } catch (e) {} curAudio = null; }
}

/** Speak (and caption) text. Resolves when finished, or when something newer interrupts it. */
export function say(text, { caption = text } = {}) {
  return new Promise(res => {
    const g = ++gen;
    let done = false, t1 = 0, t2 = 0;
    const fin = () => { if (done) return; done = true; clearTimeout(t1); clearTimeout(t2); if (g === gen) setSpeaking(false); res(); };
    showCaption(caption);
    setSpeaking(true);
    stopAudio();
    const rate = state.rate || 1;
    const est = (900 + text.length * 75) / rate / (window.BT_FAST || 1);
    if (window.BT_FAST && VO) resolve(text); // tests: report lines that aren't recorded
    if (!state.voice || window.BT_FAST) { t2 = setTimeout(fin, est); return; }
    try { if (can) speechSynthesis.cancel(); } catch (e) {}
    t2 = setTimeout(fin, est * 1.6 + 6000); // safety net: some engines never report the end
    if (VO && state.voiceMode !== 'device') {
      const items = resolve(text);
      const audios = items.map(it => { if (!it.f) return null; const a = new Audio('audio/voice/' + it.f); a.preload = 'auto'; return a; });
      let k = 0;
      const next = () => {
        if (g !== gen || k >= items.length) return fin();
        const it = items[k], a = audios[k]; k++;
        if (a) {
          curAudio = a; a.playbackRate = rate;
          a.onended = next; a.onerror = next;
          a.play().catch(next);
        } else speakTTS(it.tts, () => { if (g === gen) next(); else fin(); });
      };
      next();
      return;
    }
    // Android Chrome drops an utterance spoken in the same tick as cancel(): start a moment later.
    t1 = setTimeout(() => { if (g !== gen) return fin(); speakTTS(text, fin); }, 70);
  });
}
export function hush() {
  gen++; setSpeaking(false); stopAudio();
  try { if (can) speechSynthesis.cancel(); } catch (e) {}
  const c = cap(); if (c) c.hidden = true;
}
