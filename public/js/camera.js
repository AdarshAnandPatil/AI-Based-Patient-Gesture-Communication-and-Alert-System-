/**
 * camera.js - Webcam Capture, MediaPipe 21 Landmarks, Multi-Patient Bed Zones & Live State Broadcast
 */

const CameraManager = {
  video: null,
  canvas: null,
  ctx: null,
  stream: null,
  isActive: false,
  handsDetector: null,
  faceDetector: null,
  lastMetricGesture: null,
  lastMetricAt: 0,
  lastInvalidMetricAt: 0,

  bedZones: [],
  faceZones: [],

  HAND_CONNECTIONS: [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20],
    [0, 17]
  ],

  init() {
    this.video = document.getElementById('cameraVideo');
    this.canvas = document.getElementById('cameraCanvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
    }

    this.initMediaPipe();
    this.initFaceMesh();
    this.loadPatientsForCamera();
    this.bindControls();
  },


  async loadPatientsForCamera() {
    try {
      const r = await fetch('/api/patients');
      if (!r.ok) return;
      const patients = await r.json();
      AppState.patients = patients;
      AppState.activePatient = patients[0] || null;
      this.bedZones = patients.slice(0,4).map((p,i)=>({zone:i+1,minX:i%2?0.5:0,maxX:i%2?1:0.5,minY:i<2?0:0.5,maxY:i<2?0.5:1,patientId:p.id}));
      this.faceZones = this.bedZones.map(z=>({...z}));
      this.updateZoneLabels(patients);
      const selector=document.getElementById('singlePatientSelect');
      if(selector){ selector.innerHTML=patients.map(p=>`<option value="${p.id}">${p.name} — Room ${p.room} Bed ${p.bed}</option>`).join(''); selector.onchange=()=>{AppState.activePatient=patients.find(x=>x.id===selector.value)||patients[0]||null;}; }
    } catch(e) {}
  },
  updateZoneLabels(patients) {
    (patients||[]).slice(0,4).forEach((p,i)=>{
      const tag=document.getElementById('zoneTag'+(i+1)); const sub=document.getElementById('zoneSub'+(i+1));
      if(tag) tag.textContent=`Bed ${p.bed} • Room ${p.room}`;
      if(sub) sub.textContent=p.name;
    });
  },

  bindControls() {
    const toggleBtn = document.getElementById('cameraToggleBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (this.isActive) this.stopCamera();
        else this.startCamera();
      });
    }
  },

  initMediaPipe() {
    if (typeof Hands !== 'undefined') {
      try {
        this.handsDetector = new Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        this.handsDetector.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.65,
          minTrackingConfidence: 0.6
        });
        this.handsDetector.onResults((results) => {
          this.onHandResults(results);
        });
      } catch (err) {}
    }
  },

  initFaceMesh() {
    if (typeof FaceMesh === 'undefined') return;
    try {
      this.faceDetector = new FaceMesh({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}` });
      this.faceDetector.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });
      this.faceDetector.onResults((results) => this.onFaceResults(results));
    } catch (err) { console.warn('[FACE] FaceMesh unavailable', err); }
  },

  onFaceResults(results) {
    if (!results || !results.multiFaceLandmarks || !results.multiFaceLandmarks.length || typeof FaceHeadEngine === 'undefined') { if (typeof FaceHeadEngine !== 'undefined') FaceHeadEngine.reset(); resetRearmState(); return; }
    const outcome = FaceHeadEngine.processFaceLandmarks(results.multiFaceLandmarks[0]);
    if (!outcome) return;
    if (!isRearmedFor(outcome.requirement)) return;
    const patient = this.getPatientForPoint(outcome.facePoint || results.multiFaceLandmarks[0][1]);
    if (!patient) return;
    outcome.patient = patient;
    broadcastLiveState({ currentGesture: outcome.requirement, confidence: outcome.confidence, detectionStatus: outcome.detectionStatus, patientId: patient.id, patientName: patient.name, room: patient.room, bed: patient.bed, priority: outcome.priority });
    if (outcome.detectionStatus === 'Confirmed') AlertManager.triggerAlert(outcome);
  },

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }
      });
      this.video.srcObject = this.stream;
      await this.video.play();
      this.isActive = true;

      const toggleBtn = document.getElementById('cameraToggleBtn');
      if (toggleBtn) {
        toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Stop Camera';
        toggleBtn.className = 'btn-start-cam active';
      }

      const offlineMsg = document.getElementById('cameraOfflineMsg');
      if (offlineMsg) offlineMsg.style.display = 'none';

      const hudCam = document.getElementById('hudCamStatus');
      if (hudCam) hudCam.innerHTML = '<span class="hud-dot" style="background:var(--c-green)"></span> Camera Active';
      // Update summary card
      const scCam = document.getElementById('sc-cam-status');
      if (scCam) scCam.textContent = 'Camera Live';

      broadcastLiveState({ cameraActive: true });
      this.runDetectionLoop();
    } catch (err) {
      alert('Camera note: ' + err.message + '\nYou can test all gestures with the Verification & Simulation suite below.');
    }
  },

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.video) this.video.srcObject = null;
    this.isActive = false;

    const toggleBtn = document.getElementById('cameraToggleBtn');
    if (toggleBtn) {
      toggleBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg> Start Camera';
      toggleBtn.className = 'btn-start-cam';
    }

    const offlineMsg = document.getElementById('cameraOfflineMsg');
    if (offlineMsg) offlineMsg.style.display = 'flex';

    const hudCam = document.getElementById('hudCamStatus');
    if (hudCam) hudCam.innerHTML = '<span class="hud-dot" style="background:var(--c-red)"></span> Camera Offline';
    const scCam = document.getElementById('sc-cam-status');
    if (scCam) scCam.textContent = 'Camera Ready';

    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    broadcastLiveState({ cameraActive: false, currentGesture: 'Camera Offline' });
  },

  async runDetectionLoop() {
    if (!this.isActive) return;

    if (this.video.readyState >= 2) {
      if (this.canvas.width !== this.video.videoWidth || this.canvas.height !== this.video.videoHeight) {
        this.canvas.width = this.video.videoWidth || 640;
        this.canvas.height = this.video.videoHeight || 480;
      }

      if (this.handsDetector) {
        try { await this.handsDetector.send({ image: this.video }); } catch (e) {}
      }
      if (this.faceDetector) {
        try { await this.faceDetector.send({ image: this.video }); } catch (e) {}
      }
    }

    requestAnimationFrame(() => this.runDetectionLoop());
  },

  getBedForLandmarks(landmarks) {
    if (!landmarks || !landmarks.length) return null;
    if (AppState.operationMode === 'single') return AppState.activePatient || AppState.patients[0] || null;
    const wrist = landmarks[0];
    const nx = 1.0 - wrist.x, ny = wrist.y;
    const zone = this.bedZones.find(z => nx >= z.minX && nx < z.maxX && ny >= z.minY && ny < z.maxY);
    if (!zone) return null;
    return AppState.patients.find(p=>p.id===zone.patientId) || null;
  },

  getPatientForPoint(point) {
    if (!point) return null;
    if (AppState.operationMode === 'single') return AppState.activePatient || AppState.patients[0] || null;
    const nx=1.0-point.x, ny=point.y;
    const zone=this.faceZones.find(z=>nx>=z.minX&&nx<z.maxX&&ny>=z.minY&&ny<z.maxY);
    return zone ? (AppState.patients.find(p=>p.id===zone.patientId)||null) : null;
  },

  onHandResults(results) {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const hands = results?.multiHandLandmarks || [];
    if (!hands.length) {
      resetRearmState();
      this.updateHudDetection(null);
      broadcastLiveState({currentGesture:'No gesture', confidence:0, detectionStatus:'No Hand', modality:'hand', mode:AppState.operationMode});
      return;
    }

    // Process every visible hand in multi-patient mode, but only accept a hand
    // that is large/clear enough to be a real hand rather than landmark noise.
    for (let handIndex = 0; handIndex < hands.length; handIndex++) {
      const landmarks = hands[handIndex];
      if (!this.isValidHandLandmarks(landmarks)) continue;
      const handedness = (results.multiHandedness && results.multiHandedness[handIndex] && results.multiHandedness[handIndex].label) || 'Right';
      this.drawLandmarks(landmarks);

      const targetPatient = this.getBedForLandmarks(landmarks);
      if (!targetPatient) continue;

      const outcome = GestureEngine.processFrame(landmarks, handedness);
      if (!outcome) continue;
      outcome.patient = targetPatient;
      this.updateHudDetection(outcome);

      const metricNow = Date.now();
      const isInvalid = outcome.type === 'invalid_gesture';
      const isNewConfirmed = outcome.isConfirmed && (outcome.gestureCode !== this.lastMetricGesture || metricNow - this.lastMetricAt > 5000);
      const isNewInvalid = isInvalid && metricNow - this.lastInvalidMetricAt > 1800;
      if (isNewConfirmed) { this.lastMetricGesture = outcome.gestureCode; this.lastMetricAt = metricNow; }
      if (isNewInvalid) this.lastInvalidMetricAt = metricNow;

      broadcastLiveState({
        currentGesture: outcome.requirement,
        confidence: outcome.confidence,
        detectionStatus: isInvalid ? 'Rejected' : outcome.detectionStatus,
        reason: outcome.reason || (isInvalid ? 'unsupported' : undefined),
        patientId: targetPatient.id,
        patientName: targetPatient.name,
        room: targetPatient.room,
        bed: targetPatient.bed,
        priority: outcome.priority,
        modality: 'hand', mode: AppState.operationMode,
        metricEvent: isNewConfirmed || isNewInvalid,
        falsePrediction: isInvalid
      });

      if (isInvalid) {
        AlertManager.showInvalidFeedback(outcome.confidence);
        continue;
      }
      if (outcome.isConfirmed && outcome.detectionStatus === 'Confirmed' && isRearmedFor(outcome.requirement)) {
        AlertManager.triggerAlert(outcome);
        break; // global alert lock: one actionable event at a time
      }
    }
  },

  isValidHandLandmarks(landmarks) {
    if (!Array.isArray(landmarks) || landmarks.length < 21) return false;
    let minX=1,maxX=0,minY=1,maxY=0,finite=0;
    for (const p of landmarks) {
      if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return false;
      finite++;
      minX=Math.min(minX,p.x); maxX=Math.max(maxX,p.x); minY=Math.min(minY,p.y); maxY=Math.max(maxY,p.y);
    }
    const area=Math.max(0,maxX-minX)*Math.max(0,maxY-minY);
    const span=Math.hypot(maxX-minX,maxY-minY);
    // Very tiny boxes are usually tracking noise. Require a clearly visible hand.
    return finite===21 && area>=0.012 && span>=0.14 && minX>-0.08 && maxX<1.08 && minY>-0.08 && maxY<1.08;
  },

  drawLandmarks(landmarks) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    this.ctx.strokeStyle = '#06b6d4';
    this.ctx.lineWidth = 3;

    this.HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const p1 = landmarks[startIdx];
      const p2 = landmarks[endIdx];
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x * w, p1.y * h);
      this.ctx.lineTo(p2.x * w, p2.y * h);
      this.ctx.stroke();
    });

    landmarks.forEach((p, idx) => {
      this.ctx.beginPath();
      this.ctx.arc(p.x * w, p.y * h, idx % 4 === 0 ? 6 : 4, 0, 2 * Math.PI);
      if (idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20) {
        this.ctx.fillStyle = '#a855f7';
      } else if (idx === 0) {
        this.ctx.fillStyle = '#10b981';
      } else {
        this.ctx.fillStyle = '#22d3ee';
      }
      this.ctx.fill();
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();
    });
  },

  updateHudDetection(outcome) {
    const nameEl = document.getElementById('liveGestureName');
    const confEl = document.getElementById('liveConfidence');
    const statusEl = document.getElementById('liveStatus');
    const patientEl = document.getElementById('livePatientAssoc');
    const hudGestureEl = document.getElementById('hudLiveGesture');

    if (!outcome) {
      if (nameEl) nameEl.innerHTML = '<span style="color:var(--text-muted)">Waiting for gesture...</span>';
      if (confEl) confEl.textContent = '--';
      if (statusEl) statusEl.textContent = 'Ready';
      if (hudGestureEl) hudGestureEl.textContent = 'None';
      return;
    }

    if (nameEl) {
      nameEl.textContent = outcome.requirement || outcome.gestureCode;
      nameEl.className = `gesture-name ${outcome.priority === 'emergency' ? 'emergency' : (outcome.type === 'invalid_gesture' ? 'invalid' : (outcome.requirement.includes('Thumbs Up') ? 'thumbs-up' : ''))}`;
    }

    if (confEl) confEl.textContent = `${outcome.confidence}%`;
    if (statusEl) statusEl.textContent = outcome.detectionStatus;
    if (hudGestureEl) hudGestureEl.textContent = outcome.requirement;

    if (patientEl && outcome.patient) {
      patientEl.textContent = `${outcome.patient.name} (Bed ${outcome.patient.bed})`;
    }
    // Update new patient HUD chip
    const hudPatient = document.getElementById('hudPatientNameHud');
    if (hudPatient && outcome.patient) hudPatient.textContent = `${outcome.patient.name} · Bed ${outcome.patient.bed}`;
    // Update detection card icon
    const iconMap = { Water: '💧', Food: '🍲', Nurse: '🩺', Emergency: '🚨', Toilet: '🚻', OK: '✅', Pain: '⚡', Breathing: '🫁', 'Thumbs Up': '👍', 'Thumbs Down': '👎', Right: '👉', Left: '👈' };
    let detIcon = '✋';
    if (outcome.requirement) for (const [k, v] of Object.entries(iconMap)) { if (outcome.requirement.includes(k)) { detIcon = v; break; } }
    const dcIcon = document.getElementById('dcGestureIcon');
    if (dcIcon) dcIcon.textContent = detIcon;
  }
};

