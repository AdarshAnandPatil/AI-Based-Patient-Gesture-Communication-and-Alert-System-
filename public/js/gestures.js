/**
 * gestures.js - MediaPipe 21-landmark hand gesture engine (rewritten).
 *
 * Supported signals (everything else is rejected, never alerts):
 *   👉 Pointing Finger      index straight, middle/ring/pinky folded (thumb free)  -> Help Required
 *   👌 OK Sign              thumb tip touches index tip, other fingers up           -> Feeling Better / OK
 *   👍 Thumbs Up            fist, thumb straight and pointing up                    -> Feeling Better
 *   👎 Thumbs Down          fist, thumb straight and pointing down                  -> Discomfort
 *   ✌  2 Fingers           index + middle only                                     -> Water
 *   3 Fingers               index + middle + ring only                              -> Nurse / Doctor
 *   4 Fingers               index..pinky, thumb tucked                              -> Toilet
 *   ✋ 5 Fingers            open palm, all five spread                              -> Emergency
 *   🫁 Breathing            open palm pushed toward / away from camera repeatedly   -> Difficulty Breathing
 *
 * A closed fist (no thumb signal) is a resting hand: NO alert and NO "invalid" warning.
 *
 * Finger state uses 3D joint angles + reach ratio, so it works for any hand rotation
 * and is not fooled by simple thresholds on a single landmark.
 */
const GestureEngine = {
  WRIST: 0,
  THUMB: [1, 2, 3, 4],
  FINGERS: { index: [5, 6, 7, 8], middle: [9, 10, 11, 12], ring: [13, 14, 15, 16], pinky: [17, 18, 19, 20] },

  frameBuffers: {},
  lastLandmarksByKey: {},
  ambiguousSince: {},
  palmHistory: {},

  clamp01(v) { return Math.max(0, Math.min(1, v)); },
  d2(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); },
  d3(a, b) { return Math.hypot(a.x - b.x, a.y - b.y, ((a.z || 0) - (b.z || 0))); },
  angle3(a, b, c) { // angle at b in degrees (3D)
    const v1 = [a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0)];
    const v2 = [c.x - b.x, c.y - b.y, (c.z || 0) - (b.z || 0)];
    const dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
    const m = Math.hypot(...v1) * Math.hypot(...v2) || 1e-6;
    return Math.acos(Math.max(-1, Math.min(1, dot / m))) * 180 / Math.PI;
  },

  /** Extension score 0..1 for one finger (1 = fully straight/extended, 0 = fully folded). */
  fingerScore(lm, ids) {
    const [mcp, pip, dip, tip] = ids.map(i => lm[i]);
    const wrist = lm[this.WRIST];
    const reach = this.d2(wrist, tip) / (this.d2(wrist, mcp) || 1e-6);
    const ang = this.angle3(mcp, pip, dip);
    const ang2 = this.angle3(pip, dip, tip);
    const reachScore = this.clamp01((reach - 0.95) / 0.75);
    const angScore = this.clamp01((((ang + ang2) / 2) - 110) / 60);
    return 0.6 * reachScore + 0.4 * angScore;
  },

  thumbScore(lm, scale) {
    // distance of the thumb tip from the ring-finger knuckle: tucked ~0.3, raised ~0.6, spread ~1.1 (x palm length)
    const reach = this.d3(lm[4], lm[13]) / scale;
    const ang = this.angle3(lm[2], lm[3], lm[4]);
    return 0.5 * this.clamp01((reach - 0.35) / 0.35) + 0.5 * this.clamp01((ang - 125) / 40);
  },

  stateOf(score, on = 0.70, off = 0.38) { return score >= on ? 'ext' : (score <= off ? 'curl' : 'mid'); },

  /** Full feature extraction for one hand. */
  analyse(lm) {
    const wrist = lm[this.WRIST];
    const scale = this.d3(wrist, lm[9]) || 0.1;
    const sc = {
      thumb: this.thumbScore(lm, scale),
      index: this.fingerScore(lm, this.FINGERS.index),
      middle: this.fingerScore(lm, this.FINGERS.middle),
      ring: this.fingerScore(lm, this.FINGERS.ring),
      pinky: this.fingerScore(lm, this.FINGERS.pinky)
    };
    const st = {};
    for (const k of Object.keys(sc)) st[k] = this.stateOf(sc[k], k === 'thumb' ? 0.62 : 0.64, k === 'thumb' ? 0.42 : 0.40);

    // Thumb direction in the image plane (robust to hand rotation up to ~50°).
    const tv = { x: lm[4].x - lm[2].x, y: lm[4].y - lm[2].y };
    const tlen = Math.hypot(tv.x, tv.y) || 1e-6;
    // The thumb tip must be among the highest (thumbs up) / lowest (thumbs down) points of the hand.
    let minY = 9, maxY = -9;
    for (let i = 5; i < 21; i++) { minY = Math.min(minY, lm[i].y); maxY = Math.max(maxY, lm[i].y); }
    const palmY = (lm[0].y + lm[9].y) / 2;
    const thumbUp = (-tv.y / tlen) > 0.62 && lm[4].y < minY + 0.12 * scale && lm[4].y < palmY - 0.35 * scale;
    const thumbDown = (tv.y / tlen) > 0.62 && lm[4].y > maxY - 0.12 * scale && lm[4].y > palmY + 0.35 * scale;

    const pinch = this.d3(lm[4], lm[8]) / scale;
    const palm = this.d2(lm[5], lm[17]); // palm width (for toward/away motion)
    return { sc, st, scale, thumbUp, thumbDown, pinch, palm };
  },

  /** certainty (0..1) of a required pose = mean confidence of each finger being in its required state. */
  certainty(f, req) {
    let sum = 0, n = 0;
    for (const [k, want] of Object.entries(req)) {
      const s = f.sc[k];
      let c;
      if (want === 'ext') c = this.clamp01((s - 0.38) / 0.42);          // 0.80+ => ~1
      else if (want === 'curl') c = this.clamp01((0.70 - s) / 0.45);    // <=0.25 => 1
      else c = 1;
      sum += c; n++;
    }
    return n ? sum / n : 1;
  },

  stability(lm, key) {
    const prev = this.lastLandmarksByKey[key];
    this.lastLandmarksByKey[key] = lm;
    if (!prev) return 0.85;
    let j = 0; [0, 4, 8, 12, 16, 20].forEach(i => { j += this.d2(lm[i], prev[i]); });
    return this.clamp01(1 - (j / 6) / 0.05);
  },

  conf(cert, stability, bonus = 0) {
    return Math.max(50, Math.min(99, Math.round(62 + 30 * cert + 6 * stability + bonus)));
  },

  makeResult(code, requirement, priority, message, confidence, extra = {}) {
    return Object.assign({ type: priority === 'emergency' ? 'emergency' : 'hand_gesture', gestureCode: code, requirement, priority, message, confidence, detectionStatus: 'Candidate' }, extra);
  },

  /** Push-pull palm motion (difficulty breathing): palm width swings >=15% back and forth at least 3 times in ~3 s. */
  detectBreathingMotion(key, palm, now) {
    const h = (this.palmHistory[key] = this.palmHistory[key] || []);
    h.push({ v: palm, t: now });
    while (h.length && now - h[0].t > 3200) h.shift();
    if (h.length < 12) return false;
    let dir = 0, ext = h[0].v, mn = h[0].v, mx = h[0].v, reversals = 0;
    for (const { v } of h) {
      if (dir === 0) {
        mn = Math.min(mn, v); mx = Math.max(mx, v);
        if (v > mn * 1.15) { dir = 1; ext = v; } else if (v < mx / 1.15) { dir = -1; ext = v; }
      } else if (dir === 1) {
        if (v > ext) ext = v; else if (v < ext / 1.15) { reversals++; dir = -1; ext = v; }
      } else {
        if (v < ext) ext = v; else if (v > ext * 1.15) { reversals++; dir = 1; ext = v; }
      }
    }
    return reversals >= 3;
  },

  /** Classify ONE frame. Returns a candidate result, {type:'neutral'} (resting hand) or {type:'ambiguous'}. */
  classify(lm, key = 'default', now = Date.now()) {
    const f = this.analyse(lm);
    const { st } = f;
    const stability = this.stability(lm, key);
    const fourFolded = st.index !== 'ext' && st.middle !== 'ext' && st.ring !== 'ext' && st.pinky !== 'ext';
    const fourCurl = ['index', 'middle', 'ring', 'pinky'].filter(k => st[k] === 'curl').length;
    const extCount = ['index', 'middle', 'ring', 'pinky'].filter(k => st[k] === 'ext').length;

    // 1) OK sign: thumb-index ring + the other three fingers raised
    if (f.pinch < 0.42 && st.middle === 'ext' && (st.ring === 'ext' || st.pinky === 'ext') && st.index !== 'ext') {
      const cert = this.certainty(f, { middle: 'ext', ring: 'ext', pinky: 'ext' }) * 0.6 + this.clamp01((0.42 - f.pinch) / 0.25) * 0.4;
      return this.makeResult('OK_SIGN', 'OK Sign / Feeling Better', 'normal', 'Patient communicates that they are OK / feeling better.', this.conf(cert, stability, 3));
    }

    // 2) Thumbs up / down: four fingers folded + straight thumb pointing up/down
    if (fourCurl === 4 && f.sc.index < 0.22 && f.sc.middle < 0.22 && f.sc.ring < 0.25 && f.sc.pinky < 0.25 && st.thumb === 'ext') {
      const tc = this.clamp01((f.sc.thumb - 0.5) / 0.4);
      const cert = this.certainty(f, { index: 'curl', middle: 'curl', ring: 'curl', pinky: 'curl' }) * 0.55 + tc * 0.45;
      if (f.thumbUp) return this.makeResult('THUMBS_UP', 'Thumbs Up / Feeling Better', 'normal', 'Patient reports feeling better / affirmative response.', this.conf(cert, stability, 3));
      if (f.thumbDown) return this.makeResult('THUMBS_DOWN', 'Thumbs Down / Discomfort', 'attention', 'Patient reports discomfort or a negative state.', this.conf(cert, stability, 3));
    }

    // 3) Resting fist (no strong thumb direction): intentionally NOT a signal
    if (fourCurl >= 3 && fourFolded) return { type: 'neutral', gestureCode: 'REST_FIST', requirement: 'Resting hand', confidence: 0 };

    // 4) Pointing finger: only the index is straight; other three folded; thumb unrestricted
    if (st.index === 'ext' && st.middle === 'curl' && st.ring !== 'ext' && st.pinky !== 'ext') {
      const cert = this.certainty(f, { index: 'ext', middle: 'curl', ring: 'curl', pinky: 'curl' });
      return this.makeResult('POINTING_FINGER', 'Help Required / Pointing Finger', 'attention', 'Patient requests assistance using the pointing-finger signal.', this.conf(cert, stability, 3), { fingerCount: 1 });
    }

    // 5) Finger counting (index..pinky). Thumb matters only to separate 4 from 5.
    const only = (names) => ['index', 'middle', 'ring', 'pinky'].every(k => names.includes(k) ? st[k] === 'ext' : st[k] !== 'ext');
    if (extCount === 4 && st.index === 'ext' && st.middle === 'ext' && st.ring === 'ext' && st.pinky === 'ext') {
      const allFive = st.thumb === 'ext';
      if (allFive) {
        const open = this.certainty(f, { index: 'ext', middle: 'ext', ring: 'ext', pinky: 'ext', thumb: 'ext' });
        if (this.detectBreathingMotion(key, f.palm, now)) {
          return this.makeResult('BREATHING_EMERGENCY', 'Difficulty Breathing / Emergency', 'emergency', 'Possible difficulty in breathing. Immediate clinical assessment required.', this.conf(open, stability, 2));
        }
        return this.makeResult('5_FINGERS', 'Emergency / Immediate Medical Assistance', 'emergency', 'Emergency! Immediate medical assistance required.', this.conf(open, stability, 3), { fingerCount: 5 });
      }
      if (st.thumb === 'curl') {
        const cert = this.certainty(f, { index: 'ext', middle: 'ext', ring: 'ext', pinky: 'ext', thumb: 'curl' });
        return this.makeResult('4_FINGERS', 'Toilet', 'attention', 'Washroom assistance required.', this.conf(cert, stability, 3), { fingerCount: 4 });
      }
      return { type: 'ambiguous', gestureCode: 'AMBIGUOUS', requirement: 'Unrecognized Gesture', confidence: 60 };
    }
    if (only(['index', 'middle', 'ring']) && st.pinky === 'curl') {
      const cert = this.certainty(f, { index: 'ext', middle: 'ext', ring: 'ext', pinky: 'curl' });
      return this.makeResult('3_FINGERS', 'Nurse / Doctor', 'attention', 'Nurse or Doctor assistance required.', this.conf(cert, stability, 3), { fingerCount: 3 });
    }
    if (only(['index', 'middle']) && st.ring === 'curl' && st.pinky === 'curl') {
      const cert = this.certainty(f, { index: 'ext', middle: 'ext', ring: 'curl', pinky: 'curl' });
      return this.makeResult('2_FINGERS', 'Water', 'normal', 'Water required.', this.conf(cert, stability, 3), { fingerCount: 2 });
    }

    // Anything else (relaxed open hand, rock-on sign, half-curled fingers, transitions)
    return { type: 'ambiguous', gestureCode: 'AMBIGUOUS', requirement: 'Unrecognized Gesture', confidence: 60 };
  },

  /**
   * Public entry: classify + multi-frame confirmation + safety gates.
   * Returns null (no hand), {type:'neutral'}, a pending result, a confirmed result,
   * or {type:'invalid_gesture'} (only after an unsupported pose was HELD, never for transitions).
   */
  processFrame(landmarks, handedness = 'Right', key = 'default', now = Date.now()) {
    if (!landmarks || landmarks.length < 21) { this.frameBuffers[key] = []; this.ambiguousSince[key] = 0; return null; }
    const buf = (this.frameBuffers[key] = this.frameBuffers[key] || []);
    const res = this.classify(landmarks, key, now);

    if (res.type === 'neutral') { buf.length = 0; this.ambiguousSince[key] = 0; return { ...res, detectionStatus: 'Resting', isConfirmed: false }; }

    if (res.type === 'ambiguous') {
      buf.length = 0;
      if (!this.ambiguousSince[key]) this.ambiguousSince[key] = now;
      const held = now - this.ambiguousSince[key];
      if (held >= 1600) {
        return { type: 'invalid_gesture', gestureCode: 'INVALID', requirement: 'Unrecognized Gesture', priority: 'warning', confidence: 60, detectionStatus: 'Rejected', isConfirmed: false, reason: 'unsupported', message: 'Movement did not match a supported communication gesture. No patient alert generated.' };
      }
      return { type: 'analyzing', gestureCode: 'AMBIGUOUS', requirement: 'Analyzing…', priority: 'normal', confidence: 0, detectionStatus: 'Analyzing', isConfirmed: false };
    }
    this.ambiguousSince[key] = 0;

    const min = res.priority === 'emergency' ? (AppState.emergencyThreshold || 88) : (AppState.confirmThreshold || 85);
    if (res.confidence < min) {
      buf.length = 0;
      return { ...res, detectionStatus: 'Rejected', isConfirmed: false, reason: 'low_confidence' };
    }

    buf.push(res);
    if (buf.length > 10) buf.shift();
    const need = AppState.requiredConsistentFrames || 6;
    const recent = buf.slice(-need);
    const code = res.gestureCode;
    const agree = recent.filter(r => r.gestureCode === code).length;
    if (recent.length < need) return { ...res, detectionStatus: 'Verifying...', isConfirmed: false };
    if (agree === need) {
      const avg = Math.round(recent.reduce((a, r) => a + r.confidence, 0) / recent.length);
      return { ...res, confidence: avg, detectionStatus: 'Confirmed', isConfirmed: true };
    }
    return { ...res, detectionStatus: 'Unstable', isConfirmed: false };
  },

  resetKey(key) { delete this.frameBuffers[key]; delete this.ambiguousSince[key]; delete this.palmHistory[key]; delete this.lastLandmarksByKey[key]; },
  resetAll() { this.frameBuffers = {}; this.ambiguousSince = {}; this.palmHistory = {}; this.lastLandmarksByKey = {}; }
};
if (typeof module !== 'undefined') module.exports = GestureEngine;
