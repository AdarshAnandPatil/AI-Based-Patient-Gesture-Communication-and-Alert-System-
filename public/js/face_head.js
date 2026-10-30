/**
 * face_head.js - Face / Eye / Head communication engine (rewritten).
 *
 * Exactly ONE modality is analysed at a time (selected in the Detection Studio).
 * Every signal is measured against the patient's own NEUTRAL baseline (auto-calibrated
 * in the first ~1 second of a relaxed, forward-facing face) and must be HELD / repeated
 * deliberately, so normal blinking, talking, glancing around or breathing never create alerts.
 *
 *  EYE   deliberate blink = eyes firmly closed 0.25–1.2 s (natural blinks are ~0.1–0.2 s and ignored)
 *        1 blink  -> Yes / OK            (normal)
 *        2 blinks -> Need Help           (attention)
 *        3+ blinks-> Emergency           (emergency)     blinks must be < 1 s apart
 *  HEAD  turn left / right / up / down held 1.2 s, or a quick left-right-left-right shake
 *        left/right -> position change; up -> breathing assistance; down -> pain; shake -> EMERGENCY
 *  FACE  smile held 0.9 s -> feeling better; frown (mouth corners down + brows furrowed) 1.1 s -> need help
 *        mouth open 1.2 s -> need attention; mouth wide open 1.5 s -> breathing emergency
 */
class FaceTracker {
  constructor() { this.reset(); }

  reset() {
    this.calib = { n: 0, sum: null, done: false };
    this.base = null;
    this.h = { id: null, start: 0, last: 0 };
    this.armed = true;
    this.neutralSince = 0;
    this.lastFire = 0;
    // eye
    this.eyeClosedAt = 0; this.eyeIsClosed = false; this.blinks = 0; this.lastBlinkEnd = 0;
    // head shake
    this.lastSide = null; this.sideLog = [];
    this.info = {};
  }
}

const FaceHeadEngine = {
  trackers: {},
  COOLDOWN_MS: 1500,
  GRACE_MS: 300,
  CALIB_FRAMES: 20,

  tracker(key = 'default') { return (this.trackers[key] = this.trackers[key] || new FaceTracker()); },
  reset(key) { if (key) delete this.trackers[key]; else this.trackers = {}; },
  recalibrate(key) { if (key) this.reset(key); else this.reset(); },

  dist(a, b) { return Math.hypot((a?.x || 0) - (b?.x || 0), (a?.y || 0) - (b?.y || 0)); },
  clamp01(v) { return Math.max(0, Math.min(1, v)); },

  // ─── feature extraction ───────────────────────────────────────────────────
  features(lm) {
    if (!lm || lm.length < 400) return null;
    const nose = lm[1], le = lm[234], re = lm[454], fore = lm[10], chin = lm[152];
    if (!nose || !le || !re || !fore || !chin) return null;
    const fw = Math.max(this.dist(le, re), 0.05);
    const fh = Math.max(this.dist(fore, chin), 0.08);
    const yaw = (nose.x - (le.x + re.x) / 2) / fw;                 // + = nose toward image-right = patient's LEFT
    const eyeMidY = (lm[33].y + lm[263].y) / 2;
    const pitch = (nose.y - eyeMidY) / fh;                          // + = head down
    const ear = (side) => {
      const s = side === 'L'
        ? [[160, 144], [159, 145], [158, 153], 33, 133]
        : [[387, 373], [386, 374], [385, 380], 362, 263];
      const v = (this.dist(lm[s[0][0]], lm[s[0][1]]) + this.dist(lm[s[1][0]], lm[s[1][1]]) + this.dist(lm[s[2][0]], lm[s[2][1]])) / 3;
      return v / Math.max(this.dist(lm[s[3]], lm[s[4]]), 0.01);
    };
    const mouthGap = this.dist(lm[13], lm[14]) / fh;
    const mouthW = this.dist(lm[61], lm[291]) / fw;
    const lift = (((lm[13].y + lm[14].y) / 2) - ((lm[61].y + lm[291].y) / 2)) / fh;   // corners above lip centre = +
    const browEye = (((lm[159].y - lm[105].y) + (lm[386].y - lm[334].y)) / 2) / fh;
    const browTog = this.dist(lm[107], lm[336]) / fw;
    return { yaw, pitch, ear: (ear('L') + ear('R')) / 2, mouthGap, mouthW, lift, browEye, browTog };
  },

  calibrate(t, f) {
    // only accept a calm, forward-facing, eyes-open, mouth-closed frame
    if (Math.abs(f.yaw) > 0.16 || f.mouthGap > 0.07 || f.ear < 0.15) return false;
    const c = t.calib;
    if (!c.sum) c.sum = { yaw: 0, pitch: 0, ear: 0, mouthGap: 0, mouthW: 0, lift: 0, browEye: 0, browTog: 0 };
    for (const k of Object.keys(c.sum)) c.sum[k] += f[k];
    c.n++;
    if (c.n >= this.CALIB_FRAMES) {
      t.base = {}; for (const k of Object.keys(c.sum)) t.base[k] = c.sum[k] / c.n;
      c.done = true;
    }
    return true;
  },

  adapt(t, f) { // slow drift compensation while neutral
    const a = 0.01, b = t.base;
    for (const k of ['yaw', 'pitch', 'mouthW', 'lift', 'browEye', 'browTog']) b[k] += (f[k] - b[k]) * a;
  },

  // ─── helpers ──────────────────────────────────────────────────────────────
  out(t, now, modality, requirement, priority, confidence, message, code) {
    t.lastFire = now; t.armed = false; t.h = { id: null, start: 0, last: 0 };
    return { type: priority === 'emergency' ? 'emergency' : modality, modality, requirement, priority, confidence: Math.round(Math.min(98, confidence)), detectionStatus: 'Confirmed', gestureCode: code, message };
  },
  conf(over) { return 88 + 10 * this.clamp01(over); },

  /** one candidate at a time, must be held `ms`. returns {fire, progress} */
  tick(t, cand, holdMs, now) {
    if (cand) {
      if (t.h.id === cand) t.h.last = now; else t.h = { id: cand, start: now, last: now };
      t.neutralSince = 0;
      const progress = this.clamp01((now - t.h.start) / holdMs);
      return { fire: progress >= 1 && t.armed && now - t.lastFire > this.COOLDOWN_MS, progress };
    }
    if (t.h.id && now - t.h.last > this.GRACE_MS) t.h = { id: null, start: 0, last: 0 };
    if (!t.neutralSince) t.neutralSince = now;
    if (!t.h.id && now - t.neutralSince > 600) t.armed = true;
    return { fire: false, progress: 0 };
  },

  // ─── HEAD ─────────────────────────────────────────────────────────────────
  head(t, f, now) {
    const b = t.base, dyaw = f.yaw - b.yaw, dp = f.pitch - b.pitch;
    const TURN = 0.10, PITCH = 0.06, SIDE = 0.07;
    t.info = { yaw: dyaw, pitch: dp };

    // shake: alternating left/right sides, at least 4 side changes within 3.2 s
    const side = dyaw > SIDE ? 'L' : (dyaw < -SIDE ? 'R' : null);
    if (side && side !== t.lastSide) { t.lastSide = side; t.sideLog.push(now); }
    t.sideLog = t.sideLog.filter(x => now - x < 3200);
    if (t.sideLog.length >= 4 && t.armed && now - t.lastFire > this.COOLDOWN_MS) {
      t.sideLog = []; t.lastSide = null;
      return { outcome: this.out(t, now, 'head', 'Head Shake — Emergency', 'emergency', 96, 'Repeated left-right head shaking detected as an emergency signal.', 'HEAD_SHAKE') };
    }

    let cand = null, over = 0;
    if (dyaw > TURN) { cand = 'HEAD_LEFT'; over = (dyaw - TURN) / 0.1; }
    else if (dyaw < -TURN) { cand = 'HEAD_RIGHT'; over = (-dyaw - TURN) / 0.1; }
    else if (dp < -PITCH) { cand = 'HEAD_UP'; over = (-dp - PITCH) / 0.06; }
    else if (dp > PITCH) { cand = 'HEAD_DOWN'; over = (dp - PITCH) / 0.06; }
    const r = this.tick(t, cand, 1200, now);
    if (!cand && Math.abs(dyaw) < 0.04 && Math.abs(dp) < 0.03) this.adapt(t, f);
    if (r.fire) {
      const map = {
        HEAD_LEFT: ['Head Left — Position Change', 'normal', 'Patient requests a position change to their left.'],
        HEAD_RIGHT: ['Head Right — Position Change', 'normal', 'Patient requests a position change to their right.'],
        HEAD_UP: ['Head Up — Breathing Assistance', 'attention', 'Patient requests head elevation or breathing assistance.'],
        HEAD_DOWN: ['Head Down — Pain / Discomfort', 'attention', 'Sustained downward head position indicates discomfort.']
      }[cand];
      return { outcome: this.out(t, now, 'head', map[0], map[1], this.conf(over), map[2], cand) };
    }
    return { outcome: null, state: cand ? 'active' : (t.armed ? 'neutral' : 'cooldown'), progress: r.progress, label: cand };
  },

  // ─── EYE ──────────────────────────────────────────────────────────────────
  eye(t, f, now) {
    const b = t.base;
    t.info = { ear: f.ear, open: b.ear };
    const closed = t.eyeIsClosed ? f.ear < b.ear * 0.78 : f.ear < b.ear * 0.62;   // hysteresis
    if (!closed && !t.eyeIsClosed && f.ear > b.ear * 0.8) b.ear += (f.ear - b.ear) * 0.02; // track open-eye level

    if (closed && !t.eyeIsClosed) { t.eyeIsClosed = true; t.eyeClosedAt = now; }
    else if (!closed && t.eyeIsClosed) {
      t.eyeIsClosed = false;
      const dur = now - t.eyeClosedAt;
      if (dur >= 250 && dur <= 1200) { // deliberate blink
        if (t.blinks > 0 && now - t.lastBlinkEnd > 1000) t.blinks = 0;
        t.blinks++; t.lastBlinkEnd = now;
      } // shorter = natural blink, longer = resting / sleeping eyes: both ignored
    }
    const pending = t.blinks > 0;
    const ready = t.armed && now - t.lastFire > this.COOLDOWN_MS;
    if (pending && !t.eyeIsClosed && ready && (t.blinks >= 3 || now - t.lastBlinkEnd > 900)) {
      const c = t.blinks; t.blinks = 0;
      if (c === 1) return { outcome: this.out(t, now, 'eye', 'Single Blink — Yes / OK', 'normal', 94, 'Single deliberate blink communicates yes or OK.', 'EYE_SINGLE_BLINK') };
      if (c === 2) return { outcome: this.out(t, now, 'eye', 'Double Blink — Need Help', 'attention', 95, 'Double deliberate blink requests assistance.', 'EYE_DOUBLE_BLINK') };
      return { outcome: this.out(t, now, 'eye', 'Triple Blink — Emergency', 'emergency', 97, 'Three deliberate blinks request immediate medical assistance.', 'EYE_TRIPLE_BLINK') };
    }
    if (!t.armed && !pending && !t.eyeIsClosed && now - t.lastFire > this.COOLDOWN_MS) t.armed = true;
    if (t.blinks > 0 && !t.eyeIsClosed && now - t.lastBlinkEnd > 2500) t.blinks = 0;
    return { outcome: null, state: t.eyeIsClosed ? 'active' : (pending ? 'active' : (t.armed ? 'neutral' : 'cooldown')), progress: 0, label: pending ? `${t.blinks} blink(s)` : null };
  },

  // ─── FACE ─────────────────────────────────────────────────────────────────
  face(t, f, now) {
    const b = t.base;
    const gap = Math.max(0, f.mouthGap - b.mouthGap);
    const dW = f.mouthW - b.mouthW, dL = f.lift - b.lift;
    const browDown = (b.browEye - f.browEye) >= 0.010;
    const browTogether = (b.browTog - f.browTog) >= 0.015;
    t.info = { mouth: gap, smileW: dW, lift: dL };

    let cand = null, over = 0;
    if (gap >= 0.15) { cand = 'FACE_OPEN_WIDE'; over = (gap - 0.15) / 0.08; }
    else if (gap >= 0.075) { cand = 'FACE_OPEN'; over = (gap - 0.075) / 0.07; }
    else if (gap < 0.04 && dW >= 0.035 && dL >= 0.012) { cand = 'FACE_SMILE'; over = (dW - 0.035) / 0.04; }
    else if (gap < 0.04 && dL <= -0.015 && (browDown || browTogether)) { cand = 'FACE_FROWN'; over = (-dL - 0.015) / 0.02; }
    const HOLD = { FACE_OPEN_WIDE: 1500, FACE_OPEN: 1200, FACE_SMILE: 900, FACE_FROWN: 1100 };
    const r = this.tick(t, cand, cand ? HOLD[cand] : 1000, now);
    if (!cand && gap < 0.02 && Math.abs(dW) < 0.015 && Math.abs(dL) < 0.008) this.adapt(t, f);
    if (r.fire) {
      const map = {
        FACE_OPEN_WIDE: ['Open Mouth — Breathing Emergency', 'emergency', 'Wide open mouth held: possible breathing distress.'],
        FACE_OPEN: ['Open Mouth — Need Attention', 'attention', 'Sustained open-mouth facial action requests attention.'],
        FACE_SMILE: ['Smile — Feeling Better', 'normal', 'Sustained smile communicates a positive response.'],
        FACE_FROWN: ['Frown / Distress — Need Help', 'attention', 'Downturned mouth and furrowed brows indicate distress or discomfort.']
      }[cand];
      return { outcome: this.out(t, now, 'face', map[0], map[1], this.conf(over), map[2], cand) };
    }
    return { outcome: null, state: cand ? 'active' : (t.armed ? 'neutral' : 'cooldown'), progress: r.progress, label: cand };
  },

  // ─── public API ───────────────────────────────────────────────────────────
  /** @returns {{outcome:object|null, state:string, progress?:number, info:object}} */
  analyze(lm, modality, key = 'default', now = Date.now()) {
    const t = this.tracker(key);
    const f = this.features(lm);
    if (!f) return { outcome: null, state: 'noface', info: {} };
    if (!t.calib.done) {
      const accepted = this.calibrate(t, f);
      const reason = accepted ? 'Relax your face and look straight at the camera' : (Math.abs(f.yaw) > 0.16 ? 'Look straight at the camera' : (f.mouthGap > 0.07 ? 'Close your mouth and relax your face' : 'Open your eyes and look at the camera'));
      return { outcome: null, state: 'calibrating', progress: t.calib.n / this.CALIB_FRAMES, info: { ...f, calibrationReason: reason, calibrationSamples: t.calib.n, calibrationRequired: this.CALIB_FRAMES } };
    }
    const res = modality === 'head' ? this.head(t, f, now) : modality === 'eye' ? this.eye(t, f, now) : modality === 'face' ? this.face(t, f, now) : { outcome: null, state: 'idle' };
    res.info = { ...f, ...t.info };
    return res;
  },

  /** legacy helper */
  processFaceLandmarks(lm, modality = 'face', key = 'default') { return this.analyze(lm, modality, key).outcome; }
};
if (typeof module !== 'undefined') module.exports = FaceHeadEngine;
