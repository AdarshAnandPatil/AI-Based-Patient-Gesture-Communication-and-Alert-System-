/**
 * camera.js - Webcam capture + MediaPipe (Hands / Face Mesh) + Detection Studio runtime.
 * Only the ONE selected modality (hand | face | eye | head) is analysed at a time.
 */
const MP_HANDS = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/';
const MP_FACE = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/';

const CameraManager = {
  video: null, canvas: null, ctx: null, stream: null, isActive: false,
  handsDetector: null, faceDetector: null, busy: false,
  bedZones: [],
  lastNoSignalBroadcast: 0,
  lastHud: null,

  HAND_CONNECTIONS: [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]],
  FACE_POINTS: {
    eye:  [33,133,159,145,160,144,158,153,362,263,386,374,387,373,385,380],
    face: [61,291,13,14,105,334,107,336,70,300],
    head: [1,10,152,234,454,33,263]
  },

  // ─── lifecycle ────────────────────────────────────────────────────────────
  init() {
    this.video = document.getElementById('cameraVideo');
    this.canvas = document.getElementById('cameraCanvas');
    if (this.canvas) this.ctx = this.canvas.getContext('2d');
    this.initMediaPipe();
    this.loadContext();
    const t = document.getElementById('cameraToggleBtn');
    if (t) t.addEventListener('click', () => (this.isActive ? this.stopCamera() : this.startCamera()));
    const rc = document.getElementById('recalibrateBtn');
    if (rc) rc.addEventListener('click', () => { this.resetDetectionState(true); this.hud({ status: 'Calibrating', name: 'Relax your face and look at the camera…' }); });
    window.addEventListener('beforeunload', () => this.stopCamera(true));
  },

  isMobile() { return /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent) || window.innerWidth < 700; },

  libsAvailable() { return typeof Hands !== 'undefined' && typeof FaceMesh !== 'undefined'; },

  initMediaPipe() {
    try {
      if (typeof Hands !== 'undefined') {
        this.handsDetector = new Hands({ locateFile: f => MP_HANDS + f });
        this.handsDetector.setOptions({ maxNumHands: 2, modelComplexity: this.isMobile() ? 0 : 1, minDetectionConfidence: 0.5, minTrackingConfidence: 0.4 });
        this.handsDetector.onResults(r => this.onHandResults(r));
      }
      if (typeof FaceMesh !== 'undefined') {
        this.faceDetector = new FaceMesh({ locateFile: f => MP_FACE + f });
        this.faceDetector.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.5, minTrackingConfidence: 0.4 });
        this.faceDetector.onResults(r => this.onFaceResults(r));
      }
    } catch (e) { console.warn('[MediaPipe] init failed', e); }
  },

  async loadContext() {
    try {
      const r = await apiFetch('/api/patients');
      if (r.ok) {
        const patients = await r.json();
        AppState.patients = patients;
        AppState.activePatient = patients[0] || null;
        this.bedZones = patients.slice(0, 4).map((p, i) => ({ minX: i % 2 ? 0.5 : 0, maxX: i % 2 ? 1 : 0.5, minY: i < 2 ? 0 : 0.5, maxY: i < 2 ? 0.5 : 1, patientId: p.id }));
        patients.slice(0, 4).forEach((p, i) => {
          const tag = document.getElementById('zoneTag' + (i + 1)), sub = document.getElementById('zoneSub' + (i + 1));
          if (tag) tag.textContent = `Bed ${p.bed} • Room ${p.room}`;
          if (sub) sub.textContent = p.name;
        });
        const sel = document.getElementById('singlePatientSelect');
        if (sel) {
          sel.innerHTML = patients.map(p => `<option value="${p.id}">${p.name} — Room ${p.room} · Bed ${p.bed}</option>`).join('');
          sel.onchange = () => { AppState.activePatient = patients.find(x => x.id === sel.value) || patients[0] || null; this.resetDetectionState(); this.updatePatientChip(); };
        }
        this.updatePatientChip();
      }
    } catch (e) { /* ignore */ }
    try { // safety settings configured by the admin
      const r = await apiFetch('/api/settings');
      if (r.ok) {
        const s = await r.json();
        if (s.confirmedConfidenceThreshold) AppState.confirmThreshold = Number(s.confirmedConfidenceThreshold);
        if (s.emergencyConfidenceThreshold) AppState.emergencyThreshold = Number(s.emergencyConfidenceThreshold);
        if (s.rearmSeconds) AppState.rearmSeconds = Number(s.rearmSeconds);
        AppState.voiceEnabled = s.voiceEnabled !== false;
        if (s.defaultLanguage) { AppState.selectedLanguage = s.defaultLanguage; const ls = document.getElementById('languageSelect'); if (ls) ls.value = s.defaultLanguage; }
      }
    } catch (e) { /* ignore */ }
  },

  updatePatientChip() {
    const p = AppState.activePatient;
    const chip = document.getElementById('hudPatientNameHud');
    if (chip) chip.textContent = AppState.operationMode === 'multi' ? 'Multi-patient · 4 bed zones' : (p ? `${p.name} · Bed ${p.bed}` : 'No patient admitted');
    const assoc = document.getElementById('livePatientAssoc');
    if (assoc) assoc.textContent = p && AppState.operationMode === 'single' ? `${p.name} (Room ${p.room} · Bed ${p.bed})` : 'Auto by bed zone';
  },

  // ─── metrics ──────────────────────────────────────────────────────────────
  resetDetectionState(keepMetrics) {
    if (typeof GestureEngine !== 'undefined') GestureEngine.resetAll();
    if (typeof FaceHeadEngine !== 'undefined') FaceHeadEngine.reset();
    resetRearmState();
    if (!keepMetrics) AppState.detectionMetrics = { attempts: 0, accepted: 0, rejected: 0, emergencies: 0, lastConfidence: 0 };
    this.renderMetrics();
    this.hud(null);
    if (this.faceDetector) { try { this.faceDetector.setOptions({ maxNumFaces: AppState.operationMode === 'multi' ? 4 : 1 }); } catch (e) {} }
    if (this.handsDetector) { try { this.handsDetector.setOptions({ maxNumHands: AppState.operationMode === 'multi' ? 4 : 2 }); } catch (e) {} }
  },

  renderMetrics() {
    const m = AppState.detectionMetrics;
    const total = m.accepted + m.rejected;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('metricAccuracy', total ? Math.round(m.accepted / total * 100) + '%' : '--%');
    set('metricConfidence', m.lastConfidence ? m.lastConfidence + '%' : '--%');
    set('metricFalseRate', total ? Math.round(m.rejected / total * 100) + '%' : '0%');
    set('metricEmergency', String(m.emergencies || 0));
  },

  recordEvent(accepted, outcome) {
    const m = AppState.detectionMetrics;
    m.attempts++;
    if (accepted) { m.accepted++; if (outcome.priority === 'emergency') m.emergencies++; } else m.rejected++;
    m.lastConfidence = Number(outcome.confidence || 0);
    this.renderMetrics();
  },

  // ─── camera ───────────────────────────────────────────────────────────────
  async startCamera() {
    const msg = document.getElementById('cameraOfflineMsg');
    if (!this.libsAvailable()) {
      this.setOfflineMessage('AI libraries could not be loaded', 'The MediaPipe scripts come from a CDN. Check the internet connection and reload. You can still test every signal with the Verification & Simulation suite.');
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.setOfflineMessage('Camera not available in this browser', 'Camera access needs HTTPS (or localhost). Open the HTTPS address of this site.');
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30, max: 30 }, facingMode: 'user' }, audio: false });
      this.video.srcObject = this.stream;
      await this.video.play();
      this.isActive = true;
      const wrap = document.querySelector('.camera-viewport-wrap');
      if (wrap && this.video.videoWidth) wrap.style.aspectRatio = this.video.videoWidth + ' / ' + this.video.videoHeight;
      this.resetDetectionState(true);
      this.firstResult = false;
      this.hud({ name: 'Loading AI model… (first time takes a few seconds)', status: 'Loading' });
      this.warm();
      const btn = document.getElementById('cameraToggleBtn');
      if (btn) { btn.textContent = '■ Stop Camera'; btn.classList.add('active'); }
      if (msg) msg.style.display = 'none';
      this.setCamChip(true);
      broadcastLiveState({ cameraActive: true, currentGesture: 'Camera started', detectionStatus: 'Ready', modality: AppState.detectionModality });
      this.loop();
    } catch (err) {
      const denied = err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError');
      this.setOfflineMessage(denied ? 'Camera permission was blocked' : 'Could not start the camera', denied ? 'Allow camera access in the browser address bar, then press Start Camera again.' : (err.message || 'Unknown camera error') + '. You can still use the Simulation suite.');
    }
  },

  /** Pre-load the selected model so the first detection is not slow. */
  warm() { try { const d = AppState.detectionModality === 'hand' ? this.handsDetector : this.faceDetector; if (d && d.initialize) d.initialize(); } catch (e) {} },

  /** Warn when the picture is too dark for reliable tracking. */
  checkLight() {
    const now = Date.now(); if (now - (this._lightAt || 0) < 2500 || !this.video.videoWidth) return; this._lightAt = now;
    try {
      const c = this._lc || (this._lc = document.createElement('canvas')); c.width = 32; c.height = 24;
      const x = c.getContext('2d'); x.drawImage(this.video, 0, 0, 32, 24);
      const d = x.getImageData(0, 0, 32, 24).data; let sum = 0; for (let i = 0; i < d.length; i += 4) sum += d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
      this.dark = sum / (d.length / 4) < 55;
      const el = document.getElementById('lightWarn'); if (el) el.style.display = this.dark ? 'block' : 'none';
    } catch (e) {}
  },

  stopCamera(silent) {
    if (this.stream) { this.stream.getTracks().forEach(t => t.stop()); this.stream = null; }
    if (this.video) this.video.srcObject = null;
    const wasActive = this.isActive;
    this.isActive = false;
    if (silent) return;
    const btn = document.getElementById('cameraToggleBtn');
    if (btn) { btn.textContent = '▶ Start Camera'; btn.classList.remove('active'); }
    this.setOfflineMessage('Camera is stopped', 'Press Start Camera to begin live detection.');
    this.setCamChip(false);
    if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.hud(null);
    if (wasActive) broadcastLiveState({ cameraActive: false, currentGesture: 'Camera offline', detectionStatus: 'Ready' });
  },

  setOfflineMessage(title, sub) {
    const m = document.getElementById('cameraOfflineMsg'); if (!m) return;
    m.style.display = 'flex';
    m.innerHTML = `<div class="cam-offline-icon">📷</div><b>${title}</b><span>${sub}</span>`;
  },
  setCamChip(on) {
    const c = document.getElementById('hudCamStatus');
    if (c) c.innerHTML = `<i class="hud-dot ${on ? 'on' : ''}"></i> Camera ${on ? 'active' : 'offline'}`;
  },

  loop() {
    if (!this.isActive) return;
    const next = () => (this.video.requestVideoFrameCallback ? this.video.requestVideoFrameCallback(() => this.loop()) : requestAnimationFrame(() => this.loop()));
    if (this.busy || this.video.readyState < 2) return next();
    if (this.canvas.width !== this.video.videoWidth || this.canvas.height !== this.video.videoHeight) {
      this.canvas.width = this.video.videoWidth || 640; this.canvas.height = this.video.videoHeight || 480;
    }
    this.checkLight();
    this.busy = true;
    const det = AppState.detectionModality === 'hand' ? this.handsDetector : this.faceDetector;
    const p = det ? det.send({ image: this.video }) : Promise.resolve();
    p.catch(() => {}).finally(() => { this.busy = false; next(); });
  },

  // ─── patient association ─────────────────────────────────────────────────
  patientForPoint(x, y) {
    if (AppState.operationMode === 'single') return AppState.activePatient || AppState.patients[0] || null;
    const nx = 1 - x; // video is mirrored on screen
    const z = this.bedZones.find(z => nx >= z.minX && nx < z.maxX && y >= z.minY && y < z.maxY);
    return z ? (AppState.patients.find(p => p.id === z.patientId) || null) : null;
  },

  // ─── HAND ────────────────────────────────────────────────────────────────
  onHandResults(results) {
    if (AppState.detectionModality !== 'hand' || !this.ctx) return;
    this.firstResult = true;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    let hands = (results && results.multiHandLandmarks || []).filter(h => this.validHand(h));
    if (!hands.length) return this.noSignal(this.dark ? 'No hand found — too dark, turn on a light' : 'No hand found — show your palm, closer to the camera', 'No Hand', 'hand');

    if (AppState.operationMode === 'single') { // use the most prominent hand
      hands.sort((a, b) => this.area(b) - this.area(a)); hands = hands.slice(0, 1);
    }
    let shown = false;
    for (let i = 0; i < hands.length; i++) {
      const lm = hands[i];
      this.drawHand(lm);
      const patient = this.patientForPoint(lm[0].x, lm[0].y);
      if (!patient) continue;
      const key = `${AppState.operationMode}:${patient.id}:${i}`;
      const out = GestureEngine.processFrame(lm, 'Right', key, Date.now());
      if (!out) continue;
      out.patient = patient;
      if (!shown) { this.showHandOutcome(out, patient); shown = true; }
      this.handleOutcome(out, 'hand', patient);
    }
  },

  area(lm) { let a = 1, b = 0, c = 1, d = 0; lm.forEach(p => { a = Math.min(a, p.x); b = Math.max(b, p.x); c = Math.min(c, p.y); d = Math.max(d, p.y); }); return (b - a) * (d - c); },
  validHand(lm) {
    if (!Array.isArray(lm) || lm.length < 21) return false;
    let a = 1, b = 0, c = 1, d = 0;
    for (const p of lm) { if (!p || !isFinite(p.x) || !isFinite(p.y)) return false; a = Math.min(a, p.x); b = Math.max(b, p.x); c = Math.min(c, p.y); d = Math.max(d, p.y); }
    return (b - a) * (d - c) >= 0.004 && Math.hypot(b - a, d - c) >= 0.08;
  },

  showHandOutcome(out, patient) {
    if (out.type === 'neutral') return this.hud({ name: 'Resting hand (no signal)', status: 'Resting', patient });
    if (out.type === 'analyzing') return this.hud({ name: 'Analyzing hand shape…', status: 'Analyzing', patient });
    const need = AppState.requiredConsistentFrames || 6;
    const buf = (GestureEngine.frameBuffers[`${AppState.operationMode}:${patient.id}:0`] || []).length;
    this.hud({ name: out.requirement, conf: out.confidence, status: out.detectionStatus, priority: out.priority, patient, progress: out.isConfirmed ? 1 : Math.min(1, buf / need), invalid: out.type === 'invalid_gesture' });
  },

  // ─── FACE / EYE / HEAD ───────────────────────────────────────────────────
  onFaceResults(results) {
    const modality = AppState.detectionModality;
    if (modality === 'hand' || !this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    let faces = (results && results.multiFaceLandmarks) || [];
    if (!faces.length) return this.noSignal(this.dark ? 'No face found — too dark, turn on a light' : 'No face detected — face the camera', 'No Face', modality);
    if (AppState.operationMode === 'single') faces = faces.slice(0, 1);

    let shown = false;
    for (const lm of faces) {
      const patient = this.patientForPoint(lm[1].x, lm[1].y);
      if (!patient) continue;
      this.drawFace(lm, modality);
      const res = FaceHeadEngine.analyze(lm, modality, `${AppState.operationMode}:${patient.id}`, Date.now());
      if (!shown) { this.showFaceState(res, patient, modality); shown = true; }
      if (res.state === 'neutral') markReleased();
      if (res.outcome) { res.outcome.patient = patient; this.handleOutcome(res.outcome, modality, patient); }
    }
  },

  showFaceState(res, patient, modality) {
    const sig = document.getElementById('sigValues');
    if (sig && res.info) {
      const i = res.info, f = (v, d = 2) => (typeof v === 'number' ? v.toFixed(d) : '–');
      sig.innerHTML = modality === 'eye' ? `Eye openness <b>${f(i.ear)}</b> (open ${f(i.open)})`
        : modality === 'head' ? `Turn <b>${f(i.yaw)}</b> · Tilt <b>${f(i.pitch)}</b>`
        : `Mouth <b>${f(i.mouth)}</b> · Mouth width <b>${f(i.smileW)}</b> · Corners <b>${f(i.lift)}</b>`;
    }
    if (res.state === 'calibrating') return this.hud({ name: 'Calibrating neutral face…', status: 'Calibrating', patient, progress: res.progress, note: 'Relax your face and look straight at the camera' });
    if (res.state === 'active') return this.hud({ name: res.label ? this.pretty(res.label) : 'Signal in progress…', status: 'Hold…', patient, progress: res.progress || 0.3, note: modality === 'eye' ? 'Counting deliberate blinks' : 'Keep holding the signal' });
    if (res.state === 'cooldown') return this.hud({ name: 'Signal sent — relax to re-arm', status: 'Cooldown', patient });
    this.hud({ name: 'Waiting for signal…', status: 'Ready', patient });
  },
  pretty(code) { return ({ HEAD_LEFT: 'Head turn left', HEAD_RIGHT: 'Head turn right', HEAD_UP: 'Head up', HEAD_DOWN: 'Head down', FACE_SMILE: 'Smile', FACE_FROWN: 'Frown / distress', FACE_OPEN: 'Mouth open', FACE_OPEN_WIDE: 'Mouth wide open' })[code] || code; },

  // ─── shared outcome handling ─────────────────────────────────────────────
  noSignal(text, status, modality) {
    markReleased();
    if (typeof GestureEngine !== 'undefined' && modality === 'hand') GestureEngine.resetAll();
    this.hud({ name: text, status });
    const now = Date.now();
    if (now - this.lastNoSignalBroadcast > 4000) { this.lastNoSignalBroadcast = now; broadcastLiveState({ currentGesture: text, confidence: 0, detectionStatus: status, modality, mode: AppState.operationMode }); }
  },

  handleOutcome(out, modality, patient) {
    if (out.type === 'invalid_gesture') {
      this.recordEvent(false, out);
      broadcastLiveState({ currentGesture: out.requirement, confidence: out.confidence, detectionStatus: 'Rejected', reason: 'unsupported', patientId: patient.id, patientName: patient.name, room: patient.room, bed: patient.bed, priority: 'normal', modality, mode: AppState.operationMode, metricEvent: true, falsePrediction: true });
      AlertManager.showInvalidFeedback(out.confidence);
      return;
    }
    if (out.reason === 'low_confidence' && Date.now() - (this._lowConfAt || 0) > 4000) {
      this._lowConfAt = Date.now(); this.recordEvent(false, out);
      broadcastLiveState({ currentGesture: out.requirement, confidence: out.confidence, detectionStatus: 'Rejected', reason: 'low_confidence', patientId: patient.id, patientName: patient.name, room: patient.room, bed: patient.bed, priority: out.priority, modality, mode: AppState.operationMode, metricEvent: true, falsePrediction: true });
      return;
    }
    const confirmed = out.detectionStatus === 'Confirmed' && (out.isConfirmed !== false);
    if (!confirmed) return;
    if (!isRearmedFor(out.requirement)) { this.hud({ name: out.requirement, conf: out.confidence, status: 'Held — release to re-arm', priority: out.priority, patient, progress: 1 }); return; }
    if (AlertManager.triggerAlert(out)) {
      this.recordEvent(true, out);
      broadcastLiveState({ currentGesture: out.requirement, confidence: out.confidence, detectionStatus: 'Confirmed', patientId: patient.id, patientName: patient.name, room: patient.room, bed: patient.bed, priority: out.priority, modality, mode: AppState.operationMode, metricEvent: true, falsePrediction: false });
    }
  },

  // ─── drawing ─────────────────────────────────────────────────────────────
  drawHand(lm) {
    const w = this.canvas.width, h = this.canvas.height, c = this.ctx;
    c.lineWidth = 3; c.strokeStyle = '#ffd166';
    this.HAND_CONNECTIONS.forEach(([a, b]) => { c.beginPath(); c.moveTo(lm[a].x * w, lm[a].y * h); c.lineTo(lm[b].x * w, lm[b].y * h); c.stroke(); });
    lm.forEach((p, i) => { c.beginPath(); c.arc(p.x * w, p.y * h, [4, 8, 12, 16, 20].includes(i) ? 6 : 4, 0, 6.283); c.fillStyle = [4, 8, 12, 16, 20].includes(i) ? '#e52e91' : (i === 0 ? '#16a765' : '#7c3aed'); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke(); });
  },
  drawFace(lm, modality) {
    const w = this.canvas.width, h = this.canvas.height, c = this.ctx;
    const pts = this.FACE_POINTS[modality] || this.FACE_POINTS.head;
    c.fillStyle = modality === 'eye' ? '#25c7a8' : modality === 'face' ? '#ffd166' : '#e52e91';
    pts.forEach(i => { const p = lm[i]; if (!p) return; c.beginPath(); c.arc(p.x * w, p.y * h, 3.5, 0, 6.283); c.fill(); });
  },

  // ─── HUD ─────────────────────────────────────────────────────────────────
  hud(s) {
    const $ = id => document.getElementById(id);
    const name = $('liveGestureName'), conf = $('liveConfidence'), st = $('liveStatus'), g = $('hudLiveGesture'), prog = $('holdProgressFill'), note = $('holdNote'), icon = $('dcGestureIcon');
    if (!s) {
      if (name) { name.textContent = 'Waiting for signal…'; name.className = 'dc-value'; }
      if (conf) conf.textContent = '--'; if (st) st.textContent = 'Ready'; if (g) g.textContent = 'None';
      if (prog) prog.style.width = '0%'; if (note) note.textContent = ''; if (icon) icon.textContent = '✋';
      return;
    }
    if (name) { name.textContent = s.name || '—'; name.className = 'dc-value' + (s.priority === 'emergency' ? ' emergency' : (s.invalid ? ' invalid' : '')); }
    if (conf) conf.textContent = s.conf ? s.conf + '%' : '--';
    if (st) st.textContent = s.status || '';
    if (g) g.textContent = s.name || 'None';
    if (prog) { prog.style.width = Math.round((s.progress || 0) * 100) + '%'; prog.className = s.priority === 'emergency' ? 'emergency' : ''; }
    if (note) note.textContent = s.note || '';
    if (icon) icon.textContent = pickIcon(s.name || '');
    if (s.patient) { const a = $('livePatientAssoc'); if (a) a.textContent = `${s.patient.name} (Room ${s.patient.room} · Bed ${s.patient.bed})`; }
  }
};

function pickIcon(text) {
  const map = [['Breathing', '🫁'], ['Emergency', '🚨'], ['Shake', '🚨'], ['Water', '💧'], ['Nurse', '🩺'], ['Toilet', '🚻'], ['Thumbs Up', '👍'], ['Thumbs Down', '👎'], ['OK Sign', '👌'], ['Pointing', '👉'], ['Blink', '👁️'], ['Head', '↔️'], ['Smile', '😊'], ['Frown', '😟'], ['Mouth', '😮'], ['Resting', '✊'], ['Calibrating', '🎯']];
  for (const [k, v] of map) if (text.includes(k)) return v;
  return '✋';
}
