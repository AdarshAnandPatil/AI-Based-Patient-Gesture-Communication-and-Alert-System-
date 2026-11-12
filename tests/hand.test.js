const { loadEngines } = require('./load');
const { makeHand, POSES } = require('./synth');
const ctx = loadEngines();
const G = ctx.GestureEngine;
let fail = 0, pass = 0;

function run(poseName, rotation, frames = 30, noise = 0.15, scale = 1) {
  G.resetAll();
  const key = poseName + rotation;
  let last = null, confirmed = null, invalid = false, analyzing = 0;
  let t = 1000;
  for (let i = 0; i < frames; i++) {
    t += 50;
    last = G.processFrame(makeHand(POSES[poseName], rotation, noise, scale), 'Right', key, t);
    if (last && last.isConfirmed && !confirmed) confirmed = last;
    if (last && last.type === 'invalid_gesture') invalid = true;
  }
  return { last, confirmed, invalid };
}
function expect(name, rotations, want, opts = {}) {
  for (const r of rotations) {
    const res = run(name, r, opts.frames || 30, opts.noise ?? 0.15, opts.scale || 1);
    const got = res.confirmed ? res.confirmed.gestureCode : (res.invalid ? 'INVALID' : (res.last ? (res.last.gestureCode || res.last.type) : 'null'));
    const ok = want === null ? !res.confirmed : got === want;
    if (ok) pass++; else { fail++; console.log(`  ✗ ${name} @${r}° expected ${want} got ${got} (conf ${res.last && res.last.confidence})`); }
  }
  console.log(`${name.padEnd(22)} -> ${want === null ? 'no alert' : want}`);
}

console.log('— Hand gestures (30 frames, sensor noise ±1.5 mm, rotations) —');
const UPRIGHT = [0, -20, 20];
expect('POINTING_FINGER', [0, -20, 20, 90, 180], 'POINTING_FINGER');
expect('POINTING_THUMB_OUT', UPRIGHT, 'POINTING_FINGER');
expect('OK_SIGN', UPRIGHT, 'OK_SIGN');
expect('THUMBS_UP', UPRIGHT, 'THUMBS_UP');
expect('2_FINGERS', [0, -20, 20, 90], '2_FINGERS');
expect('2_FINGERS_THUMB_OUT', UPRIGHT, '2_FINGERS');
expect('3_FINGERS', [0, -20, 20, 90], '3_FINGERS');
expect('4_FINGERS', [0, -20, 20, 90], '4_FINGERS');
expect('5_FINGERS', [0, -20, 20, 90, 180], '5_FINGERS');
// thumbs down = thumbs up rotated 180°
for (const r of [170, 180, 190]) {
  const res = run('THUMBS_UP', r);
  const got = res.confirmed ? res.confirmed.gestureCode : (res.last && (res.last.gestureCode || res.last.type));
  if (got === 'THUMBS_DOWN') pass++; else { fail++; console.log(`  ✗ THUMBS_DOWN @${r}° got ${got}`); }
}
console.log('THUMBS_DOWN (thumbs-up rotated 180°) checked');
console.log('— Must NOT create an alert —');
expect('FIST', UPRIGHT, null);
expect('ROCK_ON', UPRIGHT, null);
expect('RING_ONLY', UPRIGHT, null);
expect('RELAXED_HALF', UPRIGHT, null);
console.log('— Scale / distance robustness —');
expect('2_FINGERS', [0], '2_FINGERS', { scale: 0.6 });
expect('5_FINGERS', [0], '5_FINGERS', { scale: 1.6 });
expect('POINTING_FINGER', [0], '5_FINGERS' === '' ? '' : 'POINTING_FINGER', { scale: 0.7 });
console.log('— Heavier noise (±3 mm) —');
expect('3_FINGERS', [0], '3_FINGERS', { noise: 0.3 });
expect('OK_SIGN', [0], 'OK_SIGN', { noise: 0.3 });

// invalid is only reported after being HELD (transitions are silent)
G.resetAll();
let early = false, t = 0;
for (let i = 0; i < 10; i++) { t += 50; const r = G.processFrame(makeHand(POSES.ROCK_ON, 0), 'Right', 'k', t); if (r && r.type === 'invalid_gesture') early = true; }
const late = (() => { let r; for (let i = 0; i < 40; i++) { t += 50; r = G.processFrame(makeHand(POSES.ROCK_ON, 0), 'Right', 'k', t); } return r; })();
if (!early && late.type === 'invalid_gesture') { pass++; console.log('Unsupported pose: silent during transition, rejected only when held ✓'); } else { fail++; console.log('✗ invalid timing', early, late && late.type); }

// breathing: palm pushed toward / away from camera
G.resetAll(); let br = null; t = 0;
for (let i = 0; i < 70; i++) { t += 50; const s = 1 + 0.35 * Math.sin(i / 5); const r = G.processFrame(makeHand(POSES['5_FINGERS'], 0, 0.1, s), 'Right', 'b', t); if (r && r.gestureCode === 'BREATHING_EMERGENCY') br = r; }
if (br) { pass++; console.log('Breathing push/pull -> BREATHING_EMERGENCY ✓'); } else { fail++; console.log('✗ breathing motion not detected'); }
// steady open palm must stay plain 5 fingers
G.resetAll(); let wrong = false; t = 0;
for (let i = 0; i < 80; i++) { t += 50; const r = G.processFrame(makeHand(POSES['5_FINGERS'], 0, 0.15, 1), 'Right', 's', t); if (r && r.gestureCode === 'BREATHING_EMERGENCY') wrong = true; }
if (!wrong) { pass++; console.log('Steady open palm is not mistaken for breathing ✓'); } else { fail++; console.log('✗ steady palm flagged as breathing'); }

console.log(`\nHand tests: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
