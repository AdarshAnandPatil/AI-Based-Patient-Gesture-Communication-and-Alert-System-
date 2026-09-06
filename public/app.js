(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  let state = { alerts: [], reports: [], appointments: [] };
  let activeFilter = 'all', activeAlert = null;
  let handStream = null, faceStream = null;
  let hands = null, faceMesh = null;
  let handRunning = false, faceRunning = false;
  let handFrame = null, faceFrame = null, handBusy = false, faceBusy = false;
  let handLastFrame = 0, faceLastFrame = 0;
  let handCandidate = null, handCandidateAt = 0, handLastSent = null, handLastSentAt = 0;
  let handHistory = [];
  let faceLastEvent = '', faceLastEventAt = 0, headCandidate = '', headCandidateAt = 0;
  let blinkClosed = false, blinkStartedAt = 0, blinkCount = 0, blinkTimer = null;
  let faceDistressStartedAt = 0;
  let audioFallback = null;

  const locale = { en: 'en-IN', kn: 'kn-IN', hi: 'hi-IN' };
  const TEXT = {
    en: {
      detect: 'FINGERS DETECTED', waiting: 'Waiting for hand gesture…', detail: 'AI is watching the hand landmarks automatically.', voiceReady: '🔊 Automatic voice is ready',
      food: 'PATIENT NEEDS FOOD', water: 'PATIENT NEEDS WATER', nurse: 'PATIENT NEEDS NURSE', toilet: 'PATIENT NEEDS TOILET', emergency: 'EMERGENCY — DOCTOR / NURSE NEEDED', ok: 'ALL OK',
      faceWaiting: 'Waiting for patient face…', faceReady: 'Face & eye communication ready', faceDetail: 'Face presence, eye blinks and head movement will be detected automatically.',
      normalFace: 'PATIENT FACE DETECTED', possibleDistress: 'POSSIBLE PATIENT DISTRESS', needHelp: 'PATIENT NEEDS HELP', yes: 'PATIENT SIGNAL: YES / OK', no: 'PATIENT SIGNAL: NO', longEye: 'LONG EYE CLOSURE — CHECK PATIENT',
      room: 'Room', bed: 'Bed'
    },
    kn: {
      detect: 'ಬೆರಳುಗಳು ಪತ್ತೆಯಾಗಿವೆ', waiting: 'ಕೈ ಸನ್ನೆಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ…', detail: 'AI ಕೈಯ ಲ್ಯಾಂಡ್‌ಮಾರ್ಕ್‌ಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಗಮನಿಸುತ್ತಿದೆ.', voiceReady: '🔊 ಸ್ವಯಂಚಾಲಿತ ಧ್ವನಿ ಸಿದ್ಧವಾಗಿದೆ',
      food: 'ರೋಗಿಗೆ ಆಹಾರ ಬೇಕಾಗಿದೆ', water: 'ರೋಗಿಗೆ ನೀರು ಬೇಕಾಗಿದೆ', nurse: 'ರೋಗಿಗೆ ನರ್ಸ್ ಬೇಕು', toilet: 'ರೋಗಿಗೆ ಶೌಚಾಲಯ ಬೇಕಾಗಿದೆ', emergency: 'ತುರ್ತು — ವೈದ್ಯರು / ನರ್ಸ್ ಬೇಕು', ok: 'ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ',
      faceWaiting: 'ರೋಗಿಯ ಮುಖಕ್ಕಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ…', faceReady: 'ಮುಖ ಮತ್ತು ಕಣ್ಣಿನ ಸಂವಹನ ಸಿದ್ಧವಾಗಿದೆ', faceDetail: 'ಮುಖ, ಕಣ್ಣು ಮಿಟುಕಿಸುವಿಕೆ ಮತ್ತು ತಲೆ ಚಲನೆಯನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಪತ್ತೆ ಮಾಡಲಾಗುತ್ತದೆ.',
      normalFace: 'ರೋಗಿಯ ಮುಖ ಪತ್ತೆಯಾಗಿದೆ', possibleDistress: 'ರೋಗಿಯಲ್ಲಿ ಸಂಭವನೀಯ ತೊಂದರೆ', needHelp: 'ರೋಗಿಗೆ ಸಹಾಯ ಬೇಕು', yes: 'ರೋಗಿಯ ಸಂಕೇತ: ಹೌದು / ಸರಿ', no: 'ರೋಗಿಯ ಸಂಕೇತ: ಇಲ್ಲ', longEye: 'ಕಣ್ಣು ದೀರ್ಘ ಸಮಯ ಮುಚ್ಚಿದೆ — ರೋಗಿಯನ್ನು ಪರಿಶೀಲಿಸಿ',
      room: 'ಕೊಠಡಿ', bed: 'ಹಾಸಿಗೆ'
    },
    hi: {
      detect: 'उंगलियां पहचानी गईं', waiting: 'हाथ के इशारे का इंतजार…', detail: 'AI हाथ के लैंडमार्क को अपने आप पहचान रहा है।', voiceReady: '🔊 स्वचालित आवाज तैयार है',
      food: 'मरीज को खाना चाहिए', water: 'मरीज को पानी चाहिए', nurse: 'मरीज को नर्स चाहिए', toilet: 'मरीज को शौचालय जाना है', emergency: 'आपातकाल — डॉक्टर / नर्स की जरूरत है', ok: 'सब ठीक है',
      faceWaiting: 'मरीज के चेहरे का इंतजार…', faceReady: 'चेहरा और आंख संचार तैयार है', faceDetail: 'चेहरे की उपस्थिति, आंख झपकना और सिर की गतिविधि अपने आप पहचानी जाएगी।',
      normalFace: 'मरीज का चेहरा पहचाना गया', possibleDistress: 'मरीज में संभावित परेशानी', needHelp: 'मरीज को मदद चाहिए', yes: 'मरीज का संकेत: हाँ / ठीक', no: 'मरीज का संकेत: नहीं', longEye: 'आंख लंबे समय से बंद है — मरीज की जांच करें',
      room: 'कमरा', bed: 'बिस्तर'
    }
  };

  const GESTURES = {
    0: { key: 'ok', name: '0 Fingers', emoji: '✊', priority: 'Normal' },
    1: { key: 'food', name: '1 Finger', emoji: '☝️', priority: 'Normal' },
    2: { key: 'water', name: '2 Fingers', emoji: '✌️', priority: 'Normal' },
    3: { key: 'nurse', name: '3 Fingers', emoji: '🤟', priority: 'High' },
    4: { key: 'toilet', name: '4 Fingers', emoji: '🖖', priority: 'High' },
    5: { key: 'emergency', name: '5 Fingers', emoji: '🖐️', priority: 'Critical' }
  };

  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const langKey = () => $('languageSelect')?.value || 'en';
  const tx = () => TEXT[langKey()] || TEXT.en;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  function toast(message, error = false) {
    const el = $('toast'); if (!el) return;
    el.textContent = message;
    el.classList.toggle('error', !!error);
    el.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  async function api(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(url, { cache: 'no-store', ...options, signal: controller.signal });
      let data = null; try { data = await response.json(); } catch (_) {}
      if (!response.ok) throw new Error(data?.detail || data?.error || `Request failed (${response.status})`);
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Server request timed out. Please wait and try again.');
      throw error;
    } finally { clearTimeout(timer); }
  }

  /* ---------------- Voice: English + Kannada + Hindi ---------------- */
  function voices() { return window.speechSynthesis?.getVoices?.() || []; }
  function findVoice(code) {
    const all = voices(), target = code.toLowerCase(), base = target.split('-')[0];
    return all.find(v => String(v.lang).toLowerCase() === target) ||
      all.find(v => String(v.lang).toLowerCase().startsWith(base + '-')) ||
      all.find(v => String(v.lang).toLowerCase() === base) || null;
  }
  function googleFallback(text, code) {
    try {
      if (audioFallback) { audioFallback.pause(); audioFallback = null; }
      const language = code.split('-')[0];
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${encodeURIComponent(language)}&q=${encodeURIComponent(text)}`;
      audioFallback = new Audio(url);
      audioFallback.volume = 1;
      audioFallback.play().catch(() => toast('Voice is unavailable. Install the Kannada/Hindi voice on this device.', true));
    } catch (_) { toast('Voice could not start on this device.', true); }
  }
  function localizedAlertVoice(alert) {
    const language = alert.language || langKey();
    const t = TEXT[language] || TEXT.en;
    return `${alert.message}. ${t.room} ${alert.room}. ${t.bed} ${alert.bed}.`;
  }
  function speak(text, language = null, statusId = 'voiceStatus') {
    if (!text) return;
    const key = language || langKey();
    const code = locale[key] || locale.en;
    const status = $(statusId);
    if (!('speechSynthesis' in window) || !window.SpeechSynthesisUtterance) { googleFallback(text, code); return; }
    const voice = findVoice(code);
    if (!voice && (key === 'kn' || key === 'hi')) {
      if (status) status.textContent = '🔊 Using multilingual voice fallback';
      googleFallback(text, code); return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = code; utterance.rate = 0.88; utterance.pitch = 1; utterance.volume = 1;
      if (voice) utterance.voice = voice;
      utterance.onstart = () => { if (status) status.textContent = '🔊 Speaking'; };
      utterance.onend = () => { if (status) status.textContent = '✓ Voice completed'; };
      utterance.onerror = () => googleFallback(text, code);
      window.speechSynthesis.speak(utterance);
      setTimeout(() => { try { if (window.speechSynthesis.paused) window.speechSynthesis.resume(); } catch (_) {} }, 150);
    } catch (_) { googleFallback(text, code); }
  }
  function primeVoice() {
    try { window.speechSynthesis?.getVoices?.(); window.speechSynthesis?.resume?.(); } catch (_) {}
  }
  if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();

  /* ---------------- Navigation + rendering ---------------- */
  function page(name) {
    document.querySelectorAll('.page').forEach(el => el.classList.toggle('active', el.id === name));
    document.querySelectorAll('.nav').forEach(el => el.classList.toggle('active', el.dataset.page === name));
    const titles = { dashboard: 'Nurse Dashboard', gesture: 'Gesture Communication', faceeye: 'Face, Eye & Head AI', alerts: 'Alert Center', patient: 'Patient Care', reports: 'Medical Reports', appointments: 'Appointments', analytics: 'Analytics', mobile: 'Mobile App' };
    if ($('pageTitle')) $('pageTitle').textContent = titles[name] || 'CareGesture AI';
    if (name === 'mobile') updateMobilePanel();
    if (name === 'gesture' && !handRunning) setTimeout(startHandCamera, 120);
    if (name === 'faceeye' && !faceRunning) setTimeout(startFaceCamera, 120);
  }
  function formatDate(v) { const d = new Date(v); return Number.isNaN(d.getTime()) ? String(v || '-') : d.toLocaleString(); }
  function card(a) {
    return `<div class="alert-card ${a.priority === 'Critical' ? 'critical' : ''}"><b>${a.priority === 'Critical' ? '🚨' : a.priority === 'High' ? '⚠️' : '🔔'} ${esc(a.priority)} · ${esc(a.status)}</b><div class="alert-message">${esc(a.message)}</div><div class="alert-meta">Patient ${esc(a.patientId)} · Room ${esc(a.room)} · Bed ${esc(a.bed)} · ${esc(a.confidence)}%</div><div class="alert-meta">${esc(a.gesture)} · ${formatDate(a.createdAt)}</div><div class="alert-actions"><button class="primary act" data-id="${esc(a.id)}" data-action="voice" type="button">🔊 Voice</button><button class="outline act" data-id="${esc(a.id)}" data-action="acknowledge" type="button">✓ Acknowledge</button><button class="outline act" data-id="${esc(a.id)}" data-action="resolve" type="button">✓ Resolve</button><button class="outline act" data-id="${esc(a.id)}" data-action="escalate" type="button">🚨 Escalate</button></div></div>`;
  }
  function render() {
    const alerts = state.alerts || [];
    const active = alerts.filter(a => a.status !== 'Resolved');
    const confidence = alerts.map(a => Number(a.confidence)).filter(Number.isFinite);
    if ($('activeCount')) $('activeCount').textContent = active.length;
    if ($('criticalCount')) $('criticalCount').textContent = alerts.filter(a => a.priority === 'Critical' && a.status !== 'Resolved').length;
    if ($('todayCount')) $('todayCount').textContent = alerts.filter(a => String(a.createdAt || '').slice(0, 10) === new Date().toISOString().slice(0, 10)).length;
    if ($('confidenceStat')) $('confidenceStat').textContent = confidence.length ? Math.round(confidence.reduce((s, n) => s + n, 0) / confidence.length) + '%' : '—';
    if ($('recentAlerts')) $('recentAlerts').innerHTML = alerts.slice(0, 5).map(card).join('') || '<p>No alerts yet.</p>';
    const filtered = activeFilter === 'all' ? alerts : activeFilter === 'Critical' ? alerts.filter(a => a.priority === 'Critical') : alerts.filter(a => a.status === activeFilter);
    if ($('alertList')) $('alertList').innerHTML = filtered.map(card).join('') || '<p>No alerts in this filter.</p>';
    if ($('reportList')) $('reportList').innerHTML = (state.reports || []).map(r => `<div class="alert-card"><b>📄 ${esc(r.originalName)}</b><div class="alert-meta">Patient ${esc(r.patientId)} · ${formatDate(r.uploadedAt)}</div><br><a class="outline" href="/uploads/${encodeURIComponent(r.storedName)}" target="_blank" rel="noopener">Open Report</a></div>`).join('') || '<p>No reports.</p>';
    if ($('appointmentList')) $('appointmentList').innerHTML = (state.appointments || []).map(a => `<div class="alert-card"><b>📅 ${esc(a.date)} ${esc(a.time)}</b><div class="alert-meta">${esc(a.doctor)} · ${esc(a.status)}</div></div>`).join('') || '<p>No appointments.</p>';
    if ($('aTotal')) $('aTotal').textContent = alerts.length;
    if ($('aResolved')) $('aResolved').textContent = alerts.filter(a => a.status === 'Resolved').length;
    if ($('aEscalated')) $('aEscalated').textContent = alerts.filter(a => a.status === 'Escalated').length;
    if ($('aAppointments')) $('aAppointments').textContent = (state.appointments || []).length;
    const counts = {}; alerts.forEach(a => counts[a.gesture || 'Unknown'] = (counts[a.gesture || 'Unknown'] || 0) + 1);
    if ($('gestureBars')) $('gestureBars').innerHTML = Object.entries(counts).map(([k, v]) => `<div class="alert-card"><b>${esc(k)}</b> — ${v}</div>`).join('') || '<p>No communication data yet.</p>';
  }
  async function refresh(silent = true) {
    try { state = await api('/api/state'); render(); }
    catch (e) { if (!silent) toast(e.message || 'Server connection error', true); }
  }

  /* ---------------- Alerts ---------------- */
  function showOverlay(alert, speakNow = true) {
    activeAlert = alert;
    $('overlayMessage').textContent = alert.message || 'Patient alert';
    $('overlayMeta').textContent = `Room ${alert.room || '-'} · Bed ${alert.bed || '-'}`;
    $('overlayPatient').textContent = `Patient ${alert.patientId || '-'} · ${alert.patientName || 'Patient'}`;
    $('overlayPriority').textContent = alert.priority === 'Critical' ? '🚨 CRITICAL PATIENT ALERT' : alert.priority === 'High' ? '⚠️ HIGH PRIORITY PATIENT ALERT' : '🔔 PATIENT ALERT';
    $('alertOverlay')?.classList.add('show');
    if (speakNow) speak(localizedAlertVoice(alert), alert.language);
    if ('Notification' in window && Notification.permission === 'granted') { try { new Notification('CareGesture AI Alert', { body: `${alert.message} · Room ${alert.room} · Bed ${alert.bed}` }); } catch (_) {} }
  }
  function closeOverlay() { $('alertOverlay')?.classList.remove('show'); try { window.speechSynthesis?.cancel(); } catch (_) {} }
  function patientPayload() { return { patientId: $('patientId')?.value.trim() || 'P1001', patientName: 'Demo Patient', room: $('room')?.value.trim() || '204', bed: $('bed')?.value.trim() || '3' }; }
  async function createAlert(event) {
    const language = langKey();
    const payload = { ...patientPayload(), language, confidence: event.confidence ?? 95, priority: event.priority || 'Normal', gesture: event.gesture || event.key || 'AI Detection', message: event.message || (TEXT[language] || TEXT.en)[event.key] };
    if (!payload.message) return null;
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const saved = await api('/api/alerts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        state.alerts = [saved, ...(state.alerts || []).filter(a => String(a.id) !== String(saved.id))];
        render();
        showOverlay(saved, true);
        return saved;
      } catch (e) { lastError = e; if (attempt < 2) await sleep(700); }
    }
    toast(lastError?.message || 'Server could not save alert.', true);
    return null;
  }
  async function alertAction(id, action) {
    if (action === 'voice') { const a = (state.alerts || []).find(x => String(x.id) === String(id)); if (a) speak(localizedAlertVoice(a), a.language); return; }
    try {
      const updated = await api(`/api/alerts/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      state.alerts = (state.alerts || []).map(a => String(a.id) === String(id) ? updated : a); render();
      toast(action === 'acknowledge' ? 'Alert acknowledged' : action === 'resolve' ? 'Alert resolved' : 'Alert escalated');
    } catch (e) { toast(e.message || 'Could not update alert', true); }
  }

  /* ---------------- Hand AI ---------------- */
  const HAND_VERSION = '0.4.1675469240';
  let handBase = `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${HAND_VERSION}/`;
  function loadScript(id, src) { return new Promise((resolve, reject) => { if (document.getElementById(id)) return resolve(); const s = document.createElement('script'); s.id = id; s.src = src; s.async = true; s.onload = resolve; s.onerror = () => reject(new Error(`Could not load ${id}`)); document.head.appendChild(s); }); }
  async function ensureHands() {
    if (window.Hands) return;
    const sources = [
      [`https://cdn.jsdelivr.net/npm/@mediapipe/hands@${HAND_VERSION}/hands.js`, `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${HAND_VERSION}/`],
      [`https://unpkg.com/@mediapipe/hands@${HAND_VERSION}/hands.js`, `https://unpkg.com/@mediapipe/hands@${HAND_VERSION}/`]
    ];
    let error; for (const [src, base] of sources) { try { await loadScript('mp-hands', src); if (window.Hands) { handBase = base; return; } } catch (e) { error = e; } }
    throw error || new Error('MediaPipe Hands is unavailable');
  }
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  function ang(a, b, c) { const ab = { x: a.x - b.x, y: a.y - b.y }, cb = { x: c.x - b.x, y: c.y - b.y }; const den = Math.hypot(ab.x, ab.y) * Math.hypot(cb.x, cb.y); return den ? Math.acos(Math.max(-1, Math.min(1, (ab.x * cb.x + ab.y * cb.y) / den))) * 180 / Math.PI : 0; }
  function fingerExtended(lm, mcp, pip, tip) { return ang(lm[mcp], lm[pip], lm[tip]) > 150 && dist(lm[tip], lm[0]) > dist(lm[pip], lm[0]) * 1.04; }
  function countFingers(lm) { let n = 0; [[5,6,8],[9,10,12],[13,14,16],[17,18,20]].forEach(([a,b,c]) => { if (fingerExtended(lm,a,b,c)) n++; }); if (fingerExtended(lm,2,3,4)) n++; return Math.max(0, Math.min(5, n)); }
  function updateHandDetection(number, sent = false) {
    const g = GESTURES[number]; if (!g) return; const t = tx();
    $('detectedGesture').textContent = `${g.emoji} ${g.name} · ${t.detect}`;
    $('detectedEmoji').textContent = g.emoji; $('detectedNeed').textContent = t[g.key];
    $('detectedDetail').textContent = `${t.detail}${sent ? ' ✓ Alert sent automatically.' : ''}`;
    $('voiceStatus').textContent = t.voiceReady;
  }
  function handResults(results) {
    const v = $('inputVideo'), c = $('outputCanvas'); if (!v || !c) return;
    const ctx = c.getContext('2d'), w = v.videoWidth || 640, h = v.videoHeight || 480; if (c.width !== w) c.width = w; if (c.height !== h) c.height = h; ctx.clearRect(0,0,c.width,c.height);
    const lm = results.multiHandLandmarks?.[0];
    if (!lm) { handHistory = []; handCandidate = null; return; }
    $('cameraHint')?.classList.add('hidden'); $('cameraStatus').textContent = '✋ Hand detected';
    ctx.fillStyle = '#00d68f'; lm.forEach(p => { ctx.beginPath(); ctx.arc(p.x*c.width,p.y*c.height,4,0,Math.PI*2); ctx.fill(); });
    const n = countFingers(lm); handHistory.push(n); if (handHistory.length > 8) handHistory.shift();
    const counts = {}; handHistory.forEach(x => counts[x] = (counts[x] || 0) + 1); const best = Object.entries(counts).sort((a,b) => b[1]-a[1])[0];
    if (!best || Number(best[1]) < 6) return; const detected = Number(best[0]), now = Date.now();
    if (handCandidate !== detected) { handCandidate = detected; handCandidateAt = now; return; }
    if (now - handCandidateAt < 450 || handLastSent === detected && now - handLastSentAt < 3500) return;
    handLastSent = detected; handLastSentAt = now; updateHandDetection(detected, false);
    const g = GESTURES[detected]; createAlert({ key: g.key, gesture: g.name, priority: g.priority, confidence: 95 }).then(a => { if (a) updateHandDetection(detected, true); });
  }
  async function handLoop(now) { if (!handRunning) return; handFrame = requestAnimationFrame(handLoop); const v = $('inputVideo'); if (!v || v.readyState < 2 || !hands || handBusy || now-handLastFrame < 70) return; handLastFrame = now; handBusy = true; try { await hands.send({ image: v }); } catch (e) { console.warn('Hand AI frame error', e); } finally { handBusy = false; } }
  async function startHandCamera() {
    if (handRunning) return;
    try {
      if (!window.isSecureContext) throw new Error('Camera requires HTTPS or localhost. Use the Render HTTPS URL.');
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera is not supported in this browser.');
      await ensureHands();
      hands = new window.Hands({ locateFile: file => handBase + file }); hands.setOptions({ maxNumHands: 1, modelComplexity: 0, minDetectionConfidence: .55, minTrackingConfidence: .55 }); hands.onResults(handResults);
      handStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'user' }, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      const v = $('inputVideo'); v.srcObject = handStream; v.muted = true; v.playsInline = true; await v.play();
      handRunning = true; handHistory=[]; handCandidate=null; handLastSent=null; handLastSentAt=0; primeVoice();
      $('cameraStatus').textContent='Camera AI is running — show your hand'; $('aiBadge').textContent='AI RUNNING'; $('aiBadge').classList.add('running'); $('cameraHint').textContent='Show one hand clearly';
      handFrame = requestAnimationFrame(handLoop);
    } catch (e) { stopHandCamera(); toast(e.message || 'Camera could not start', true); }
  }
  function stopHandCamera() { handRunning=false; if(handFrame) cancelAnimationFrame(handFrame); handFrame=null; if(handStream){handStream.getTracks().forEach(t=>t.stop());handStream=null;} if($('inputVideo')) $('inputVideo').srcObject=null; try{hands?.close?.();}catch(_){} hands=null; if($('cameraStatus'))$('cameraStatus').textContent='Camera is off'; if($('aiBadge')){$('aiBadge').textContent='AI READY';$('aiBadge').classList.remove('running');} }

  /* ---------------- Face + Eye + Head AI ----------------
     Important: FaceMesh provides landmarks. Pain/fear is NOT medically diagnosed;
     this module reports only possible visual distress patterns. */
  const FACE_VERSION = '0.4.1633559619';
  let faceBase = `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${FACE_VERSION}/`;
  async function ensureFaceMesh() {
    if (window.FaceMesh) return;
    const sources = [
      [`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${FACE_VERSION}/face_mesh.js`, `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${FACE_VERSION}/`],
      [`https://unpkg.com/@mediapipe/face_mesh@${FACE_VERSION}/face_mesh.js`, `https://unpkg.com/@mediapipe/face_mesh@${FACE_VERSION}/`]
    ]; let error;
    for (const [src, base] of sources) { try { await loadScript('mp-face-mesh', src); if (window.FaceMesh) { faceBase = base; return; } } catch(e) { error=e; } }
    throw error || new Error('MediaPipe Face AI library could not be loaded');
  }
  function ear(lm, ids) { const [a,b,c,d,e,f] = ids.map(i=>lm[i]); return (dist(b,f)+dist(c,e))/(2*dist(a,d)+1e-6); }
  function setFaceUI(kind, emoji, title, detail) { if($('faceDetected'))$('faceDetected').textContent=kind; if($('faceEmoji'))$('faceEmoji').textContent=emoji; if($('faceNeed'))$('faceNeed').textContent=title; if($('faceDetail'))$('faceDetail').textContent=detail; }
  function drawFace(lm) {
    const v=$('faceVideo'), c=$('faceCanvas'); if(!v||!c)return; const ctx=c.getContext('2d'),w=v.videoWidth||640,h=v.videoHeight||480; if(c.width!==w)c.width=w;if(c.height!==h)c.height=h;ctx.clearRect(0,0,w,h);ctx.fillStyle='#38bdf8';[1,10,152,33,133,362,263,61,291].forEach(i=>{const p=lm[i];if(!p)return;ctx.beginPath();ctx.arc(p.x*w,p.y*h,4,0,Math.PI*2);ctx.fill();});
  }
  function faceEventCooldown(key, ms=3500) { const now=Date.now(); if(faceLastEvent===key && now-faceLastEventAt<ms)return false; faceLastEvent=key;faceLastEventAt=now;return true; }
  function triggerFaceAlert(key, gesture, priority, confidence=90) { if(!faceEventCooldown(gesture))return; createAlert({key,gesture,priority,confidence}).then(a=>{if(a&&$('faceVoiceStatus'))$('faceVoiceStatus').textContent='🔊 Alert voice sent';}); }
  function resetBlinkTimer(){clearTimeout(blinkTimer);blinkTimer=setTimeout(()=>{blinkCount=0;},1800);}
  function processBlink(lm, averageEar) {
    const now=Date.now(), closed=averageEar<0.20;
    if(closed&&!blinkClosed){blinkClosed=true;blinkStartedAt=now;}
    if(!closed&&blinkClosed){const duration=now-blinkStartedAt;blinkClosed=false;if(duration>=1200){setFaceUI('LONG EYE CLOSURE','⚠️',tx().longEye,'Possible unresponsiveness or distress. This is not a medical diagnosis.');triggerFaceAlert('longEye','Long Eye Closure','High',90);blinkCount=0;return;} if(duration>=80){blinkCount++;resetBlinkTimer();setFaceUI(`${blinkCount} EYE BLINK${blinkCount>1?'S':''}`,'👁️',blinkCount===1?tx().yes:blinkCount===2?tx().needHelp:tx().emergency,'Eye communication detected automatically.');if(blinkCount===2)triggerFaceAlert('needHelp','2 Eye Blinks','High',94);if(blinkCount>=3){triggerFaceAlert('emergency','3 Eye Blinks','Critical',96);blinkCount=0;}}}
  }
  function processHead(lm) {
    const nose=lm[1],left=lm[234],right=lm[454]; if(!nose||!left||!right)return;
    const ratio=(nose.x-left.x)/((right.x-left.x)||1); let movement='';
    if(ratio<0.39)movement='HEAD LEFT'; else if(ratio>0.61)movement='HEAD RIGHT'; else { const top=lm[10],bottom=lm[152]; const vertical=(nose.y-top.y)/((bottom.y-top.y)||1); if(vertical>0.59)movement='HEAD DOWN'; }
    if(!movement){headCandidate='';return;} const now=Date.now();if(headCandidate!==movement){headCandidate=movement;headCandidateAt=now;return;}if(now-headCandidateAt<700)return;
    if(movement==='HEAD RIGHT'){setFaceUI('HEAD MOVEMENT','➡️',tx().yes,'Patient head movement detected.');if(faceEventCooldown('head-right',2500))speak(tx().yes,langKey(),'faceVoiceStatus');}
    else if(movement==='HEAD LEFT'){setFaceUI('HEAD MOVEMENT','⬅️',tx().no,'Patient head movement detected.');if(faceEventCooldown('head-left',2500))speak(tx().no,langKey(),'faceVoiceStatus');}
    else {setFaceUI('HEAD DOWN','⬇️',tx().needHelp,'Head-down assistance signal detected.');triggerFaceAlert('needHelp','Head Down','High',92);}
    headCandidateAt=now+999999;
  }
  function processVisualDistress(lm) {
    const mouthOpen=dist(lm[13],lm[14]), faceHeight=dist(lm[10],lm[152])+1e-6, ratio=mouthOpen/faceHeight;
    if(ratio>0.055){if(!faceDistressStartedAt)faceDistressStartedAt=Date.now();if(Date.now()-faceDistressStartedAt>1200){setFaceUI('POSSIBLE DISTRESS','😣',tx().possibleDistress,'Visual distress pattern detected. This is an AI observation, not a medical diagnosis.');triggerFaceAlert('possibleDistress','Possible Facial Distress','High',78);}}
    else faceDistressStartedAt=0;
  }
  function faceResults(results) {
    const lm=results.multiFaceLandmarks?.[0]; if(!lm){setFaceUI(tx().faceWaiting,'🙂',tx().faceReady,tx().faceDetail);$('faceHint')?.classList.remove('hidden');return;}
    $('faceHint')?.classList.add('hidden');$('faceStatus').textContent='Face & Eye AI is running — face detected';drawFace(lm);
    const leftEAR=ear(lm,[33,160,158,133,153,144]),rightEAR=ear(lm,[362,385,387,263,373,380]);
    if(!blinkClosed&&Date.now()-faceLastEventAt>1000)setFaceUI('FACE DETECTED','🙂',tx().normalFace,'Patient face is visible and responsive monitoring is active.');
    processBlink(lm,(leftEAR+rightEAR)/2);processHead(lm);processVisualDistress(lm);
  }
  async function faceLoop(now){if(!faceRunning)return;faceFrame=requestAnimationFrame(faceLoop);const v=$('faceVideo');if(!v||v.readyState<2||!faceMesh||faceBusy||now-faceLastFrame<80)return;faceLastFrame=now;faceBusy=true;try{await faceMesh.send({image:v});}catch(e){console.warn('Face AI frame error',e);}finally{faceBusy=false;}}
  async function startFaceCamera(){if(faceRunning)return;try{if(!window.isSecureContext)throw new Error('Face & Eye camera requires HTTPS or localhost.');if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera is not supported in this browser.');await ensureFaceMesh();faceMesh=new window.FaceMesh({locateFile:file=>faceBase+file});faceMesh.setOptions({maxNumFaces:1,refineLandmarks:true,minDetectionConfidence:.55,minTrackingConfidence:.55});faceMesh.onResults(faceResults);faceStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'user'},width:{ideal:640},height:{ideal:480}},audio:false});const v=$('faceVideo');v.srcObject=faceStream;v.muted=true;v.playsInline=true;await v.play();faceRunning=true;primeVoice();$('faceStatus').textContent='Starting Face & Eye AI…';$('faceAiBadge').textContent='AI RUNNING';$('faceAiBadge').classList.add('running');$('faceHint').textContent='Look at the camera';faceFrame=requestAnimationFrame(faceLoop);}catch(e){stopFaceCamera();toast(e.message||'Face & Eye AI could not start',true);}}
  function stopFaceCamera(){faceRunning=false;if(faceFrame)cancelAnimationFrame(faceFrame);faceFrame=null;if(faceStream){faceStream.getTracks().forEach(t=>t.stop());faceStream=null;}if($('faceVideo'))$('faceVideo').srcObject=null;try{faceMesh?.close?.();}catch(_){}faceMesh=null;clearTimeout(blinkTimer);blinkCount=0;blinkClosed=false;headCandidate='';faceDistressStartedAt=0;if($('faceStatus'))$('faceStatus').textContent='Face & Eye AI is off';if($('faceAiBadge')){$('faceAiBadge').textContent='AI READY';$('faceAiBadge').classList.remove('running');}}

  /* ---------------- Forms + language ---------------- */
  function updateLanguageUI(){const t=tx(),l=langKey();const set=(id,v)=>{if($(id))$(id).textContent=v;};set('patientLang',{en:'English',kn:'ಕನ್ನಡ',hi:'हिन्दी'}[l]);set('guideFood1',l==='en'?'Food':t.food);set('guideFood1Sub',t.food);set('guideWater',l==='en'?'Water':t.water);set('guideWaterSub',t.water);set('guideFood3',l==='en'?'Nurse':t.nurse);set('guideFood3Sub',t.nurse);set('guideToilet',l==='en'?'Toilet':t.toilet);set('guideToiletSub',t.toilet);set('guideEmergency',l==='en'?'Doctor / Nurse Needed':t.emergency);set('guideEmergencySub',t.emergency);set('guideOk',l==='en'?'All OK':t.ok);set('guideOkSub',t.ok);set('voiceStatus',t.voiceReady);set('faceVoiceStatus',t.voiceReady);if(!handRunning){set('detectedGesture',t.waiting);}if(!faceRunning){set('faceDetected',t.faceWaiting);set('faceNeed',t.faceReady);set('faceDetail',t.faceDetail);}}
  async function uploadReport(e){e.preventDefault();try{await api('/api/reports',{method:'POST',body:new FormData(e.target)});toast('Report uploaded successfully');e.target.reset();await refresh(false);}catch(err){toast(err.message,true);}}
  async function appointment(e){e.preventDefault();try{const data=Object.fromEntries(new FormData(e.target).entries());await api('/api/appointments',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});toast('Appointment scheduled successfully');e.target.reset();await refresh(false);}catch(err){toast(err.message,true);}}
  async function enableNotifications(){if(!('Notification'in window)){toast('Notifications are not supported',true);return;}const p=await Notification.requestPermission();toast(p==='granted'?'Notifications enabled':'Notification permission was not granted',p!=='granted');}
  function updateMobilePanel(){if($('mobileServerUrl'))$('mobileServerUrl').textContent=location.origin;}

  document.addEventListener('DOMContentLoaded',async()=>{
    document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>page(b.dataset.page)));
    $('openGestureBtn')?.addEventListener('click',()=>page('gesture'));$('viewAlertsBtn')?.addEventListener('click',()=>page('alerts'));$('openMobileBtn')?.addEventListener('click',()=>page('mobile'));
    $('languageSelect')?.addEventListener('change',()=>{primeVoice();updateLanguageUI();});$('notifyBtn')?.addEventListener('click',enableNotifications);$('voiceBtn')?.addEventListener('click',()=>{primeVoice();toast('Voice enabled. Multilingual voice will be used for alerts.');});
    $('cameraBtn')?.addEventListener('click',startHandCamera);$('stopCameraBtn')?.addEventListener('click',stopHandCamera);$('faceCameraBtn')?.addEventListener('click',startFaceCamera);$('stopFaceCameraBtn')?.addEventListener('click',stopFaceCamera);
    document.querySelectorAll('.filter').forEach(b=>b.addEventListener('click',()=>{activeFilter=b.dataset.filter||'all';document.querySelectorAll('.filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');render();}));
    document.addEventListener('click',e=>{const b=e.target.closest('.act');if(b)alertAction(b.dataset.id,b.dataset.action);});
    $('reportForm')?.addEventListener('submit',uploadReport);$('appointmentForm')?.addEventListener('submit',appointment);
    $('closeAlertOverlay')?.addEventListener('click',closeOverlay);$('alertOverlay')?.addEventListener('click',e=>{if(e.target===$('alertOverlay'))closeOverlay();});$('overlayVoiceBtn')?.addEventListener('click',()=>{if(activeAlert)speak(localizedAlertVoice(activeAlert),activeAlert.language);});$('overlayAckBtn')?.addEventListener('click',async()=>{if(activeAlert?.id){await alertAction(activeAlert.id,'acknowledge');closeOverlay();}});$('overlayResolveBtn')?.addEventListener('click',async()=>{if(activeAlert?.id){await alertAction(activeAlert.id,'resolve');closeOverlay();}});
    $('copyMobileUrl')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(location.origin);toast('Server URL copied');}catch(_){toast('Copy failed — copy the URL manually.',true);}});
    window.addEventListener('beforeunload',()=>{stopHandCamera();stopFaceCamera();});
    updateLanguageUI();await refresh(false);setInterval(()=>refresh(true),5000);
  });
})();
