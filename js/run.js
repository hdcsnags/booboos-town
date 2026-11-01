import { say, hush } from './speech.js';

// A Run is one visit to a scene. Scenes are written as async scripts; when the child leaves,
// run.end() makes the next await throw ABORT so the script quietly stops.
export const ABORT = { abort: true };
export const sleep = ms => new Promise(r => setTimeout(r, ms / (window.BT_FAST || 1)));
export const ease = {
  linear: t => t,
  out: t => 1 - (1 - t) ** 3,
  inOut: t => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2,
  back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; },
};
export function animate(dur, fn, e = ease.inOut) {
  return new Promise(res => {
    const t0 = performance.now();
    const step = now => {
      const t = Math.min(1, (now - t0) / (dur / (window.BT_FAST || 1)));
      fn(e(t));
      if (t < 1) requestAnimationFrame(step); else res();
    };
    requestAnimationFrame(step);
  });
}

export class Run {
  constructor() { this.alive = true; this.last = ''; this.loops = []; }
  check() { if (!this.alive) throw ABORT; }
  async say(text, o) { this.check(); this.last = text; await say(text, o); this.check(); }
  async wait(ms) { this.check(); await sleep(ms); this.check(); }
  async anim(dur, fn, e) { this.check(); await animate(dur, t => { if (this.alive) fn(t); }, e); this.check(); }
  /** resolve when the element is pressed */
  async tap(target) {
    this.check();
    await new Promise(res => {
      const h = e => { e.stopPropagation(); target.removeEventListener('pointerdown', h); res(); };
      target.addEventListener('pointerdown', h);
    });
    this.check();
  }
  /** resolve with the index of whichever element is pressed first */
  async tapAny(targets) {
    this.check();
    const i = await new Promise(res => {
      const hs = targets.map((t, i) => { const h = e => { e.stopPropagation(); hs.forEach((hh, j) => targets[j].removeEventListener('pointerdown', hh)); res(i); }; t.addEventListener('pointerdown', h); return h; });
    });
    this.check();
    return i;
  }
  /** a requestAnimationFrame loop that stops with the run */
  loop(fn) {
    let last = performance.now(), stop = false;
    const f = now => { if (!this.alive || stop) return; fn((now - last) / 1000, now); last = now; requestAnimationFrame(f); };
    requestAnimationFrame(f);
    return () => { stop = true; };
  }
  end() { this.alive = false; hush(); }
}
