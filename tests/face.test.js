const { loadEngines } = require('./load');
const { makeFace } = require('./synth');
const ctx = loadEngines();
const E = ctx.FaceHeadEngine;
let pass = 0, fail = 0;
const FPS = 25, DT = 1000 / FPS;

/** Run a scripted sequence. script = [[seconds, faceParams | fn(tSec)->params], ...]. Returns list of outcomes. */
function run(modality, script, key = 'k' + Math.random(), noise = 0.0008) {
  E.reset(key);
  let now = 100000; const events = []; let calibrated = false;
  const feed = (params) => {
    const lm = makeFace(params).map(p => ({ x: p.x + (Math.random() - .5) * noise, y: p.y + (Math.random() - .5) * noise, z: 0 }));
    const r = E.analyze(lm, modality, key, now);
    if (r.outcome) events.push({ code: r.outcome.gestureCode, req: r.outcome.requirement, pri: r.outcome.priority, t: now });
    now += DT;
  };
  for (let i = 0; i < 35; i++) feed({}); // neutral calibration period (1.4 s)
  for (const [sec, p] of script) { const n = Math.round(sec * FPS); for (let i = 0; i < n; i++) feed(typeof p === 'function' ? p(i / FPS) : p); }
  return events;
}
function expectCodes(name, modality, script, want) {
  const ev = run(modality, script).map(e => e.code);
  const ok = JSON.stringify(ev) === JSON.stringify(want);
  if (ok) pass++; else fail++;
  console.log(`${ok ? '✓' : '✗'} ${name.padEnd(46)} ${ok ? '' : 'got ' + JSON.stringify(ev) + ' want ' + JSON.stringify(want)}`);
}
const N = {}; // neutral
const blink = (ms) => [[ms / 1000, { eyeOpen: 0 }], [0.4, N]];

console.log('— EYE —');
expectCodes('neutral 6 s, eyes open', 'eye', [[6, N]], []);
expectCodes('natural blinks (120 ms) x5 ignored', 'eye', [[1, N], ...[1, 2, 3, 4, 5].flatMap(() => [[0.12, { eyeOpen: 0 }], [0.8, N]]), [1, N]], []);
expectCodes('1 deliberate blink (500 ms)', 'eye', [...blink(500), [1.5, N]], ['EYE_SINGLE_BLINK']);
expectCodes('2 deliberate blinks', 'eye', [...blink(450), ...blink(450), [1.5, N]], ['EYE_DOUBLE_BLINK']);
expectCodes('3 deliberate blinks', 'eye', [...blink(450), ...blink(450), ...blink(450), [1.5, N]], ['EYE_TRIPLE_BLINK']);
expectCodes('eyes closed 6 s (sleeping) -> no alert', 'eye', [[6, { eyeOpen: 0 }], [1, N]], []);
expectCodes('squint (50% open) -> no alert', 'eye', [[4, { eyeOpen: 0.55 }], [1, N]], []);
expectCodes('two separate single blinks re-arm', 'eye', [...blink(500), [2.5, N], ...blink(500), [1.5, N]], ['EYE_SINGLE_BLINK', 'EYE_SINGLE_BLINK']);

console.log('— HEAD —');
expectCodes('neutral 6 s', 'head', [[6, N]], []);
expectCodes('turn left held 1.6 s', 'head', [[1.6, { yaw: 0.14 }], [1, N]], ['HEAD_LEFT']);
expectCodes('turn right held 1.6 s', 'head', [[1.6, { yaw: -0.14 }], [1, N]], ['HEAD_RIGHT']);
expectCodes('head up held 1.6 s', 'head', [[1.6, { pitch: -0.09 }], [1, N]], ['HEAD_UP']);
expectCodes('head down held 1.6 s', 'head', [[1.6, { pitch: 0.09 }], [1, N]], ['HEAD_DOWN']);
expectCodes('quick glance left 0.5 s -> no alert', 'head', [[0.5, { yaw: 0.15 }], [2, N]], []);
expectCodes('small head movement -> no alert', 'head', [[3, { yaw: 0.05, pitch: 0.03 }]], []);
expectCodes('shake left-right x4 -> emergency', 'head', [[0.35, { yaw: 0.12 }], [0.35, { yaw: -0.12 }], [0.35, { yaw: 0.12 }], [0.35, { yaw: -0.12 }], [1, N]], ['HEAD_SHAKE']);
expectCodes('look around slowly L then R -> no alert', 'head', [[0.7, { yaw: 0.12 }], [0.7, N], [0.7, { yaw: -0.12 }], [1, N]], []);

console.log('— FACE —');
expectCodes('neutral 6 s', 'face', [[6, N]], []);
expectCodes('smile held 1.4 s', 'face', [[1.4, { smile: 1 }], [1, N]], ['FACE_SMILE']);
expectCodes('frown held 1.6 s', 'face', [[1.6, { frown: 1 }], [1, N]], ['FACE_FROWN']);
expectCodes('mouth open held 1.8 s', 'face', [[1.8, { mouthOpen: 0.45 }], [1, N]], ['FACE_OPEN']);
expectCodes('mouth WIDE open held 2.2 s', 'face', [[2.2, { mouthOpen: 1.0 }], [1, N]], ['FACE_OPEN_WIDE']);
expectCodes('talking (mouth flaps) -> no alert', 'face', [[5, t => ({ mouthOpen: 0.4 + 0.4 * Math.sin(t * 14) })]], []);
expectCodes('brief smile 0.4 s -> no alert', 'face', [[0.4, { smile: 1 }], [2, N]], []);
expectCodes('smile twice re-arms', 'face', [[1.4, { smile: 1 }], [2, N], [1.4, { smile: 1 }], [1, N]], ['FACE_SMILE', 'FACE_SMILE']);
expectCodes('held smile fires ONCE (no spam)', 'face', [[6, { smile: 1 }]], ['FACE_SMILE']);

console.log('— Modality isolation —');
{ // a head turn must not create anything while Eye / Face are selected
  for (const m of ['eye', 'face']) { const ev = run(m, [[3, { yaw: 0.2 }], [1, N]]); const ok = ev.length === 0; ok ? pass++ : fail++; console.log(`${ok ? '✓' : '✗'} head turn ignored in ${m} mode`); }
  const ev = run('head', [...blink(500), [1.5, N]]); const ok = ev.length === 0; ok ? pass++ : fail++; console.log(`${ok ? '✓' : '✗'} blink ignored in head mode`);
}
console.log(`\nFace/Eye/Head tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
