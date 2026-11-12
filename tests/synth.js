/**
 * Synthetic landmark generators used by the detection tests.
 * Hand: forward-kinematics model of a right hand (palm facing the camera, 1 cm = 0.012 normalised units).
 * Face: parametric 478-point FaceMesh stand-in (only the landmarks the engines use).
 */
const CM = 0.012;
const rot = (x, y, deg) => { const a = deg * Math.PI / 180; return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]; };

// flex: cumulative bend angles (deg) at MCP, PIP, DIP; bent toward the camera
function finger(mcp, lens, flex) {
  const pts = [{ x: mcp[0], y: mcp[1], z: 0 }];
  let x = mcp[0], y = mcp[1], z = 0, theta = 0;
  for (let i = 0; i < 3; i++) {
    theta += flex[i];
    const t = theta * Math.PI / 180;
    y += -lens[i] * Math.cos(t); z += -lens[i] * Math.sin(t);
    pts.push({ x, y, z });
  }
  return pts; // [mcp,pip,dip,tip] in cm
}
const FLEX = { ext: [0, 0, 0], curl: [85, 100, 50], half: [45, 55, 25], hook: [10, 70, 10] };
const BASE = {
  index: { mcp: [-3.0, -9.5], len: [4.0, 2.4, 2.0] },
  middle: { mcp: [-0.5, -10], len: [4.4, 2.8, 2.2] },
  ring: { mcp: [2.0, -9.3], len: [4.1, 2.6, 2.1] },
  pinky: { mcp: [4.2, -8.0], len: [3.2, 1.8, 1.9] }
};
function thumbPts(mode, indexTip) {
  const cmc = [-2.4, -1.8];
  const seg = (angs) => { const lens = [3.9, 3.2, 2.6]; let p = cmc.slice(); const out = [{ x: p[0], y: p[1], z: 0 }]; angs.forEach((a, i) => { const r = a * Math.PI / 180; p = [p[0] - lens[i] * Math.sin(r), p[1] - lens[i] * Math.cos(r)]; out.push({ x: p[0], y: p[1], z: 0 }); }); return out; };
  if (mode === 'out') return seg([40, 50, 55]);
  if (mode === 'up') return seg([15, 5, 0]);
  if (mode === 'tucked') return seg([40, -40, -80]);
  if (mode === 'rest') return seg([35, 20, -10]);
  if (mode === 'pinch') {
    const p2 = { x: -4.4, y: -5.0, z: 0 }, p4 = { x: indexTip.x, y: indexTip.y, z: indexTip.z };
    const p3 = { x: (p2.x + p4.x) / 2 - 0.4, y: (p2.y + p4.y) / 2 + 0.3, z: (p2.z + p4.z) / 2 };
    return [{ x: cmc[0], y: cmc[1], z: 0 }, p2, p3, p4];
  }
  throw new Error('thumb ' + mode);
}
/** pose: {thumb, index, middle, ring, pinky} each state name; rotation in degrees; noise sd in cm */
function makeHand(pose, rotation = 0, noiseCm = 0.15, scale = 1, center = [0.5, 0.7]) {
  const fp = {};
  for (const k of ['index', 'middle', 'ring', 'pinky']) fp[k] = finger(BASE[k].mcp, BASE[k].len, FLEX[pose[k]]);
  const th = thumbPts(pose.thumb, fp.index[3]);
  const lm = [{ x: 0, y: 0, z: 0 }, ...th, ...fp.index, ...fp.middle, ...fp.ring, ...fp.pinky];
  const n = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2 * noiseCm;
  return lm.map(p => { const [rx, ry] = rot(p.x, p.y, rotation); return { x: center[0] + (rx + n()) * CM * scale, y: center[1] + (ry + n()) * CM * scale, z: (p.z + n()) * CM * scale }; });
}
const POSES = {
  POINTING_FINGER: { thumb: 'tucked', index: 'ext', middle: 'curl', ring: 'curl', pinky: 'curl' },
  POINTING_THUMB_OUT: { thumb: 'out', index: 'ext', middle: 'curl', ring: 'curl', pinky: 'curl' },
  OK_SIGN: { thumb: 'pinch', index: 'half', middle: 'ext', ring: 'ext', pinky: 'ext' },
  THUMBS_UP: { thumb: 'up', index: 'curl', middle: 'curl', ring: 'curl', pinky: 'curl' },
  '2_FINGERS': { thumb: 'tucked', index: 'ext', middle: 'ext', ring: 'curl', pinky: 'curl' },
  '2_FINGERS_THUMB_OUT': { thumb: 'out', index: 'ext', middle: 'ext', ring: 'curl', pinky: 'curl' },
  '3_FINGERS': { thumb: 'tucked', index: 'ext', middle: 'ext', ring: 'ext', pinky: 'curl' },
  '4_FINGERS': { thumb: 'tucked', index: 'ext', middle: 'ext', ring: 'ext', pinky: 'ext' },
  '5_FINGERS': { thumb: 'out', index: 'ext', middle: 'ext', ring: 'ext', pinky: 'ext' },
  // must NOT alert
  FIST: { thumb: 'tucked', index: 'curl', middle: 'curl', ring: 'curl', pinky: 'curl' },
  ROCK_ON: { thumb: 'tucked', index: 'ext', middle: 'curl', ring: 'curl', pinky: 'ext' },
  RING_ONLY: { thumb: 'tucked', index: 'curl', middle: 'curl', ring: 'ext', pinky: 'curl' },
  RELAXED_HALF: { thumb: 'rest', index: 'half', middle: 'half', ring: 'half', pinky: 'half' }
};

// ─── Face ────────────────────────────────────────────────────────────────────
/**
 * Parametric face. All distances in image-normalised units for a face that is ~0.40 tall, 0.30 wide.
 * p = { yaw, pitch, eyeOpen(0..1), mouthOpen(0..1 of 0.09), smile(0..1), frown(0..1) }
 */
function makeFace(p = {}) {
  const P = Object.assign({ yaw: 0, pitch: 0, eyeOpen: 1, mouthOpen: 0, smile: 0, frown: 0 }, p);
  const lm = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
  const cx = 0.5, cy = 0.5, H = 0.40, W = 0.30;
  const set = (i, x, y) => { lm[i] = { x, y, z: 0 }; };
  set(10, cx, cy - H / 2); set(152, cx, cy + H / 2);
  set(234, cx - W / 2, cy); set(454, cx + W / 2, cy);
  const eyeY = cy - 0.06;
  set(1, cx + P.yaw * W, eyeY + 0.10 + P.pitch * H);               // nose tip
  // eyes: width 0.05, open vertical = 0.015 (EAR 0.30)
  const open = 0.0165 * P.eyeOpen;
  const eye = (ox, outer, inner, top, bot, top2, bot2, top3, bot3, p1, p2, p3, p4) => {};
  // left eye (image left)
  set(33, cx - 0.105, eyeY); set(133, cx - 0.055, eyeY);
  set(159, cx - 0.08, eyeY - open / 2); set(145, cx - 0.08, eyeY + open / 2);
  set(160, cx - 0.092, eyeY - open * .45); set(144, cx - 0.092, eyeY + open * .45);
  set(158, cx - 0.068, eyeY - open * .45); set(153, cx - 0.068, eyeY + open * .45);
  // right eye
  set(362, cx + 0.055, eyeY); set(263, cx + 0.105, eyeY);
  set(386, cx + 0.08, eyeY - open / 2); set(374, cx + 0.08, eyeY + open / 2);
  set(387, cx + 0.068, eyeY - open * .45); set(373, cx + 0.068, eyeY + open * .45);
  set(385, cx + 0.092, eyeY - open * .45); set(380, cx + 0.092, eyeY + open * .45);
  // brows
  const browY = eyeY - 0.05 + P.frown * 0.012;
  set(105, cx - 0.08, browY); set(334, cx + 0.08, browY); set(70, cx - 0.09, browY); set(300, cx + 0.09, browY);
  set(107, cx - 0.03 + P.frown * 0.012, browY + 0.01); set(336, cx + 0.03 - P.frown * 0.012, browY + 0.01);
  // mouth
  const my = cy + 0.13, gap = 0.09 * P.mouthOpen + 0.004;
  set(13, cx, my - gap / 2); set(14, cx, my + gap / 2);
  const widthHalf = 0.055 + P.smile * 0.012 - P.frown * 0.004;
  const cornerY = my - P.smile * 0.012 + P.frown * 0.010;
  set(61, cx - widthHalf, cornerY); set(291, cx + widthHalf, cornerY);
  return lm;
}
module.exports = { makeHand, POSES, makeFace };
