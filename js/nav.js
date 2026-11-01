import { Run, ABORT } from './run.js';
import { hush } from './speech.js';

export const scenes = {};
let cur = null;
export function go(name, arg) {
  if (cur) cur.end();
  hush();
  const run = cur = new Run();
  const stage = document.getElementById('stage');
  stage.innerHTML = '';
  stage.dataset.scene = name;
  Promise.resolve().then(() => scenes[name](run, arg)).catch(e => { if (e !== ABORT) console.error(e); });
  return run;
}
