// Saved settings + progress (this device only). Every storage call is guarded: private mode etc.
const KEY = 'booboo-town-v1';
const DEF = {
  level: 'explorer',            // sprout (~3) | explorer (~4) | scientist (~5+)
  vehicle: 'car',               // car | rover
  voice: true, voiceMode: 'jenny', voiceName: '', rate: 1,   // voiceMode: jenny | ava | device
  sfx: true,
  stars: { spider: 0, rainbow: 0, space: 0, garden: 0, bakery: 0, trains: 0, code: 0 },
  words: [],
  seen: {},                     // one-time intros already given
};
let s;
try { s = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { s = {}; }
export const state = { ...structuredClone(DEF), ...s };
state.stars = { ...DEF.stars, ...(s.stars || {}) };
state.seen = { ...(s.seen || {}) };
if (!Array.isArray(state.words)) state.words = [];
if (!['jenny', 'ava', 'device'].includes(state.voiceMode)) state.voiceMode = 'jenny';

export function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
export function resetProgress() {
  state.stars = { ...DEF.stars }; state.words = []; state.seen = {}; save();
}
/** 0 = sprout, 1 = explorer, 2 = scientist */
export const lv = () => ({ sprout: 0, explorer: 1, scientist: 2 })[state.level] ?? 1;
/** pick a value by level: byLv(a, b, c) */
export const byLv = (...v) => v[Math.min(lv(), v.length - 1)];

export const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = a => a[Math.floor(Math.random() * a.length)];
export function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
