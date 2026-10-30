/**
 * camera.js - Webcam capture + MediaPipe (Hands / Face Mesh) + Detection Studio runtime.
 * Only the ONE selected modality (hand | face | eye | head) is analysed at a time.
 */
const MP_HANDS = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/';
const MP_FACE = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/';
const MP_POSE = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/';

const CameraManager = {
  video: null, canvas: null, ctx: null, stream: null, isActive: false,
  handsDetector: null, faceDetector: null, poseDetector: null, busy: false,
  safetyHistory: [], lastSafetyAlertAt: 0, lastPoseAt: Date.now(), inactivityStartAt: Date.now(), safetyModalTimer:null,
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

  libsAvailable() { return typeof Hands !== 'undefined' && typeof FaceMesh !== 'undefined' && (AppState.detectionModality !== 'safety' || typeof Pose !== 'undefined'); },

  initMediaPipe() {
    try {
      if (typeof Hands !== 'undefined') {
        this.handsDetector = new Hands({ locateFile: f => MP_HANDS + f });
        this.handsDetector.setOptions({ maxNumHands: 1, modelComplexity: 0, minDetectionConfidence: 0.42, minTrackingConfidence: 0.38 });
        this.handsDetector.onResults(r => this.onHandResults(r));
      }
      if (typeof Pose !== 'undefined') {
        this.poseDetector = new Pose({ locateFile: f => MP_POSE + f });
        this.poseDetector.setOptions({ modelComplexity: 1, smoothLandmarks: true, enableSegmentation: false, minDetectionConfidence: 0.55, minTrackingConfidence: 0.55 });
        this.poseDetector.onResults(r => this.onSafetyPoseResults(r));
      }
      if (typeof FaceMesh !== 'undefined') {
        this.faceDetector = new FaceMesh({ locateFile: f => MP_FACE + f });
        this.faceDetector.setOptions({ maxNumFaces: 1, refineLandmarks: false, minDetectionConfidence: 0.42, minTrackingConfidence: 0.38 });
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
    if (this.faceDetector) { try { this.faceDetector.setOptions({ maxNumFaces: AppState.operationMode === 'multi' ? 4 : 1, refineLandmarks: false, minDetectionConfidence: 0.42, minTrackingConfidence: 0.38 }); } catch (e) {} }
    if (this.handsDetector) { try { this.handsDetector.setOptions({ maxNumHands: AppState.operationMode === 'multi' ? 4 : 1, modelComplexity: 0, minDetectionConfidence: 0.42, minTrackingConfidence: 0.38 }); } catch (e) {} }
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
      this.lastPoseAt = Date.now(); this.safetyHistory = []; this.lastSafetyAlertAt = 0;
      this.resetDetectionState(true);
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
      // Process at the camera's negotiated resolution; request 640x480 above to reduce inference latency.
      this.canvas.width = this.video.videoWidth || 640; this.canvas.height = this.video.videoHeight || 480;
    }
    this.busy = true;
    const mod = AppState.detectionModality;
    const det = mod === 'hand' ? this.handsDetector : mod === 'safety' ? this.poseDetector : this.faceDetector;
    const p = det ? det.send({ image: this.video }) : Promise.resolve();
    p.catch(() => {}).finally(() => { this.busy = false; next(); });
  },

  // Experimental pose-based safety observations. These are not medical diagnoses.
  onSafetyPoseResults(results) {
    if (AppState.detectionModality !== 'safety' || !this.ctx) return;
    const lm=results&&results.poseLandmarks; this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    if(!lm||!lm[11]||!lm[12]||!lm[23]||!lm[24]||Math.min(lm[11].visibility||0,lm[12].visibility||0,lm[23].visibility||0,lm[24].visibility||0)<.45){this.hud({name:'Patient body not clearly visible',status:'Waiting for pose',note:'Keep shoulders and hips in camera view.'});return;}
    const now=Date.now(),mid=(a,b)=>({x:(a.x+b.x)/2,y:(a.y+b.y)/2}),sh=mid(lm[11],lm[12]),hip=mid(lm[23],lm[24]);
    const angle=Math.abs(Math.atan2(hip.y-sh.y,hip.x-sh.x)*180/Math.PI),center=mid(sh,hip);
    const prev=this.safetyHistory[this.safetyHistory.length-1],speed=prev?Math.hypot(center.x-prev.x,center.y-prev.y):0;
    this.safetyHistory.push({t:now,x:center.x,y:center.y,speed,angle,hipY:hip.y,shY:sh.y});this.safetyHistory=this.safetyHistory.filter(x=>now-x.t<30000);
    if(speed>.018)this.lastPoseAt=now;
    const event=document.getElementById('safetyEventSelect')?.value||'Patient Fall',recent=this.safetyHistory.filter(x=>now-x.t<5000),avg=recent.reduce((a,x)=>a+x.speed,0)/Math.max(1,recent.length);
    const sudden=recent.some(x=>x.speed>.075),horizontal=angle>65&&angle<115;let candidate=false,detail='';
    switch(event){
      case 'Patient Fall':candidate=sudden&&hip.y>.72;detail='Rapid body movement followed by low position';break;
      case 'Patient Collapsing':candidate=sudden&&hip.y>.62;detail='Rapid downward body movement';break;
      case 'Prolonged Inactivity':candidate=now-this.lastPoseAt>180000;detail='Low pose movement observed for at least three minutes';break;
      case 'Unusual Body Posture':candidate=horizontal||angle<20;detail='Unusual torso orientation';break;
      case 'Repeated Restless Movement':candidate=recent.length>20&&recent.filter(x=>x.speed>.012).length>15;detail='Repeated movement during the observation window';break;
      case 'Seizure-like Movement':{const m=recent.filter(x=>x.speed>.018).length;candidate=recent.length>30&&m>25;detail='Repeated movement pattern; not a seizure diagnosis';break;}
      case 'Bed Exit Attempt':candidate=hip.y<.38||(hip.y<.55&&Math.abs(hip.x-.5)>.38);detail='Body moved toward edge/out of camera area; bed-zone calibration required';break;
      case 'Unusual Night-time Activity':{const h=new Date().getHours();candidate=(h>=22||h<6)&&avg>.012&&recent.length>10;detail='Movement during quiet hours (22:00–06:00)';break;}
      case 'Breathing Pattern Observation':{const sample=this.safetyHistory,ys=sample.map(x=>x.shY);let reversals=0;for(let i=2;i<ys.length;i++)if((ys[i-1]-ys[i-2])*(ys[i]-ys[i-1])<0)reversals++;const mins=sample.length?(sample[sample.length-1].t-sample[0].t)/60000:0;candidate=sample.length>=60&&mins>=.33&&reversals/2/mins>=6&&reversals/2/mins<=30;detail='Possible periodic upper-body movement only; not a breathing-rate or distress diagnosis';break;}
    }
    this.hud({name:event,status:candidate?'Possible event':'Monitoring',note:detail,patient:AppState.activePatient});
    if(!candidate||now-this.lastSafetyAlertAt<60000)return;
    const patient=AppState.operationMode==='single'?AppState.activePatient:null;
    if(!patient){this.hud({name:'Possible event — patient not associated',status:'Unassigned',note:'Select a single patient; no family notification was sent.'});return;}
    this.lastSafetyAlertAt=now;
    apiFetch('/api/safety-events',{method:'POST',body:JSON.stringify({patientId:patient.id,eventType:event,source:'camera-pose-observation',note:detail})}).then(async r=>{if(!r.ok)throw new Error((await r.json()).message||'Could not save safety event');return r.json();}).then(item=>{
      const msg=`Attention. Possible ${event} observed for ${patient.name}, Room ${patient.room}, Bed ${patient.bed}. Nurse verification required.`;
      const overlay=document.getElementById('alertModalOverlay'),set=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
      set('modalAlertTitle',`🚨 POSSIBLE SAFETY EVENT · ${event}`);set('modalConfidence','Not calibrated');set('modalDetectionStatus','Verification Pending');set('modalPatient',patient.name);set('modalRoom',patient.room);set('modalBed',patient.bed);set('modalSpokenPreview',`${msg} ${detail}`);
      const ack=document.getElementById('modalAckBtn'),resolve=document.getElementById('modalResolveBtn');
      if(ack)ack.onclick=async()=>{await apiFetch(`/api/safety-events/${item.id}`,{method:'PATCH',body:JSON.stringify({status:'acknowledged'})});overlay?.classList.remove('active');};
      if(resolve)resolve.onclick=async()=>{await apiFetch(`/api/safety-events/${item.id}`,{method:'PATCH',body:JSON.stringify({status:'resolved'})});overlay?.classList.remove('active');};
      if(overlay)overlay.classList.add('active');
      if('speechSynthesis'in window){const u=new SpeechSynthesisUtterance(msg);u.lang=AppState.selectedLanguage==='kn'?'kn-IN':AppState.selectedLanguage==='hi'?'hi-IN':'en-IN';window.speechSynthesis.cancel();window.speechSynthesis.speak(u);}
    }).catch(e=>console.warn('[Safety monitor]',e));
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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const rawHands = (results && results.multiHandLandmarks || []).map((landmarks, sourceIndex) => ({ landmarks, sourceIndex }));
    const detectedHands = rawHands.filter(item => this.validHand(item.landmarks));
    if (!detectedHands.length) {
      // Draw raw model output for diagnosis instead of hiding it behind a generic "No hand".
      if (rawHands.length) {
        rawHands.forEach(item => this.drawHand(item.landmarks));
        return this.hud({ name: 'Hand found — checking visibility', status: 'Move hand closer / face palm to camera', note: 'Landmarks were returned, but the hand-size/quality check did not pass.' });
      }
      return this.noSignal('No hand detected', 'No Hand', 'hand');
    }
    let hands = detectedHands;

    if (AppState.operationMode === 'single') { // use the most prominent hand
      hands.sort((a, b) => this.area(b.landmarks) - this.area(a.landmarks)); hands = hands.slice(0, 1);
    }
    let shown = false;
    for (let i = 0; i < hands.length; i++) {
      const { landmarks: lm, sourceIndex } = hands[i];
      this.drawHand(lm);
      const patient = this.patientForPoint(lm[0].x, lm[0].y);
      if (!patient) continue;
      const key = `${AppState.operationMode}:${patient.id}`;
      const handedness = results && results.multiHandedness && results.multiHandedness[sourceIndex] && results.multiHandedness[sourceIndex].label || 'Right';
      const out = GestureEngine.processFrame(lm, handedness, key, Date.now());
      if (!out) continue;
      out.patient = patient;
      if (!shown) { this.showHandOutcome(out, patient, key); shown = true; }
      this.handleOutcome(out, 'hand', patient);
    }
  },

  area(lm) { let a = 1, b = 0, c = 1, d = 0; lm.forEach(p => { a = Math.min(a, p.x); b = Math.max(b, p.x); c = Math.min(c, p.y); d = Math.max(d, p.y); }); return (b - a) * (d - c); },
  validHand(lm) {
    if (!Array.isArray(lm) || lm.length < 21) return false;
    let a = 1, b = 0, c = 1, d = 0;
    for (const p of lm) { if (!p || !isFinite(p.x) || !isFinite(p.y)) return false; a = Math.min(a, p.x); b = Math.max(b, p.x); c = Math.min(c, p.y); d = Math.max(d, p.y); }
    // A slightly more permissive size gate allows a hand farther from the camera;
    // the classifier's confidence and multi-frame confirmation remain the safety gates.
    return (b - a) * (d - c) >= 0.003 && Math.hypot(b - a, d - c) >= 0.075;
  },

  showHandOutcome(out, patient, key) {
    if (out.type === 'neutral') return this.hud({ name: 'Resting hand (no signal)', status: 'Resting', patient });
    if (out.type === 'analyzing') return this.hud({ name: 'Analyzing hand shape…', status: 'Analyzing', patient });
    const need = AppState.requiredConsistentFrames || 4;
    const buf = (GestureEngine.frameBuffers[key] || []).length;
    this.hud({ name: out.requirement, conf: out.confidence, status: out.detectionStatus, priority: out.priority, patient, progress: out.isConfirmed ? 1 : Math.min(1, buf / need), invalid: out.type === 'invalid_gesture' });
  },

  // ─── FACE / EYE / HEAD ───────────────────────────────────────────────────
  onFaceResults(results) {
    const modality = AppState.detectionModality;
    if (modality === 'hand' || !this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    let faces = (results && results.multiFaceLandmarks) || [];
    if (!faces.length) return this.noSignal('No face detected — face the camera', 'No Face', modality);
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
        : `Mouth <b>${f(i.mouth)}</b> · Smile <b>${f(i.smileW)}</b> · Corners <b>${f(i.lift)}</b>`;
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
