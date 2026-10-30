/**
 * studio.js - Detection Studio UI (modality / mode / language / supported-signal guide).
 */
const SIGNAL_GUIDE = {
  hand: [
    { i: '👉', n: 'Pointing Finger', m: 'Help Required', how: 'Raise ONLY the index finger, fold the other three. Thumb can be anywhere.', p: 'attention' },
    { i: '👌', n: 'OK Sign', m: 'Feeling Better / OK', how: 'Touch thumb tip to index tip, keep the other three fingers up.', p: 'normal' },
    { i: '👍', n: 'Thumbs Up', m: 'Feeling Better', how: 'Tight fist, thumb straight UP.', p: 'normal' },
    { i: '👎', n: 'Thumbs Down', m: 'Discomfort / Pain', how: 'Tight fist, thumb straight DOWN.', p: 'attention' },
    { i: '✌️', n: '2 Fingers', m: 'Water', how: 'Index + middle only (V sign).', p: 'normal' },
    { i: '🤟', n: '3 Fingers', m: 'Nurse / Doctor', how: 'Index + middle + ring, little finger folded.', p: 'attention' },
    { i: '🖖', n: '4 Fingers', m: 'Toilet', how: 'Four fingers up, thumb tucked into the palm.', p: 'attention' },
    { i: '✋', n: '5 Fingers', m: 'Emergency', how: 'Open palm, all five fingers spread.', p: 'emergency' },
    { i: '🫁', n: 'Palm push–pull', m: 'Difficulty Breathing', how: 'Open palm, move it toward and away from the camera 2–3 times.', p: 'emergency' }
  ],
  face: [
    { i: '😊', n: 'Smile', m: 'Feeling Better', how: 'Smile broadly and hold ~1 second.', p: 'normal' },
    { i: '😟', n: 'Frown / Distress', m: 'Need Help', how: 'Turn mouth corners down and furrow brows, hold ~1 second.', p: 'attention' },
    { i: '😮', n: 'Open Mouth', m: 'Need Attention', how: 'Open mouth moderately and hold ~1.2 seconds.', p: 'attention' },
    { i: '🫁', n: 'Mouth Wide Open', m: 'Breathing Emergency', how: 'Open mouth very wide and hold ~1.5 seconds.', p: 'emergency' }
  ],
  eye: [
    { i: '👁️', n: 'Single Blink', m: 'Yes / All OK', how: 'Close eyes firmly for about half a second, then open.', p: 'normal' },
    { i: '👁️👁️', n: 'Double Blink', m: 'Need Help', how: 'Two firm half-second blinks, less than 1 s apart.', p: 'attention' },
    { i: '🚨', n: 'Triple Blink', m: 'Emergency', how: 'Three firm half-second blinks in a row.', p: 'emergency' },
    { i: 'ℹ️', n: 'Normal blinking', m: 'Ignored', how: 'Quick natural blinks and long eye-rest are never alerts.', p: 'normal' }
  ],
  head: [
    { i: '⬅️', n: 'Turn Left', m: 'Position change (left)', how: 'Turn head to your left and hold ~1.2 s.', p: 'normal' },
    { i: '➡️', n: 'Turn Right', m: 'Position change (right)', how: 'Turn head to your right and hold ~1.2 s.', p: 'normal' },
    { i: '⬆️', n: 'Head Up', m: 'Breathing assistance', how: 'Tilt chin up and hold ~1.2 s.', p: 'attention' },
    { i: '⬇️', n: 'Head Down', m: 'Pain / Discomfort', how: 'Lower chin and hold ~1.2 s.', p: 'attention' },
    { i: '🚨', n: 'Head Shake', m: 'Emergency', how: 'Quick left-right-left-right shake within 3 seconds.', p: 'emergency' }
  ]
};
const MODALITY_HINT = {
  hand: 'Show one clear hand to the camera, about an arm’s length away, palm facing the lens.',
  face: 'Face the camera with a relaxed face for 1–2 s (auto-calibrates), then perform the action.',
  eye: 'Face the camera with a relaxed face for 1–2 s (auto-calibrates), then use slow, firm blinks.',
  head: 'Face the camera with a relaxed face for 1–2 s (auto-calibrates), then move your head.',
  safety: 'Keep the patient’s full upper body visible. Select one observation. Safety indicators are experimental and must be verified by clinical staff.'
};

function renderGuide(mod) {
  const lib = document.getElementById('gestureLibrary'); if (!lib) return;
  lib.innerHTML = (SIGNAL_GUIDE[mod] || []).map(s => `
    <div class="gesture-item ${s.p}"><span class="gi-icon">${s.i}</span><div><b>${s.n} <em>→ ${s.m}</em></b><span>${s.how}</span></div></div>`).join('');
  const h = document.getElementById('modalityHint'); if (h) h.textContent = MODALITY_HINT[mod] || '';
  const rc = document.getElementById('recalibrateBtn'); if (rc) rc.style.display = ['hand','safety'].includes(mod) ? 'none' : 'inline-flex';
  const sp = document.getElementById('safetyEventPick'); if (sp) sp.style.display = mod === 'safety' ? 'inline-flex' : 'none';
}

function setupDetectionStudio() {
  const btns = document.querySelectorAll('.modality-btn');
  const apply = mod => {
    AppState.detectionModality = mod;
    btns.forEach(b => b.classList.toggle('active', b.dataset.modality === mod));
    renderGuide(mod);
    const lbl = document.getElementById('studioModeLabel'); if (lbl) lbl.textContent = `${AppState.operationMode.toUpperCase()} · ${mod.toUpperCase()} ONLY`;
    const sig = document.getElementById('sigValues'); if (sig) sig.textContent = '';
    CameraManager.resetDetectionState();
    if (CameraManager.ctx && CameraManager.canvas) CameraManager.ctx.clearRect(0, 0, CameraManager.canvas.width, CameraManager.canvas.height);
  };
  btns.forEach(b => b.addEventListener('click', () => apply(b.dataset.modality)));
  renderGuide(AppState.detectionModality);
}

function setupModeSelector() {
  const single = document.getElementById('singleModeBtn'), multi = document.getElementById('multiModeBtn');
  const overlay = document.getElementById('multiBedOverlay'), badge = document.getElementById('hudModeBadge'), pick = document.getElementById('singlePatientPick');
  const set = mode => {
    AppState.operationMode = mode;
    single.classList.toggle('active', mode === 'single'); multi.classList.toggle('active', mode === 'multi');
    overlay.classList.toggle('active', mode === 'multi');
    if (pick) pick.style.display = mode === 'single' ? 'flex' : 'none';
    badge.textContent = mode === 'single' ? 'Single patient' : 'Multi-patient · 4 beds';
    const lbl = document.getElementById('studioModeLabel'); if (lbl) lbl.textContent = `${mode.toUpperCase()} · ${AppState.detectionModality.toUpperCase()} ONLY`;
    CameraManager.resetDetectionState(); CameraManager.updatePatientChip();
  };
  single.addEventListener('click', () => set('single'));
  multi.addEventListener('click', () => set('multi'));
}

function setupLanguageSelector() {
  const l = document.getElementById('languageSelect');
  if (l) l.addEventListener('change', e => { AppState.selectedLanguage = e.target.value; });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!authToken()) { (window.top || window).location.href = '/'; return; }
  const params = new URLSearchParams(location.search);
  if (params.get('embed') === '1') document.body.classList.add('embed');
  VoiceManager.init();
  AlertManager.init();
  CameraManager.init();
  setupModeSelector(); setupDetectionStudio(); setupLanguageSelector();

  // dashboard iframe auto-height
  if (document.body.classList.contains('embed') && window.parent !== window) {
    const post = () => window.parent.postMessage({ type: 'camera-height', h: document.documentElement.scrollHeight }, location.origin);
    new ResizeObserver(post).observe(document.body); post();
  }
  // live alert feed refresh
  try {
    const es = new EventSource('/api/events?token=' + encodeURIComponent(authToken()));
    es.onmessage = e => { try { const d = JSON.parse(e.data); if (d.type === 'alert') AlertManager.fetchRecentAlerts(); } catch (x) {} };
  } catch (e) {}
  const u = JSON.parse(localStorage.getItem('patientUser') || '{}');
  const un = document.getElementById('userName'); if (un) un.textContent = u.name || u.username || 'Admin';
  const ua = document.getElementById('userAvatar'); if (ua) ua.textContent = (u.name || 'A').charAt(0).toUpperCase();
});
