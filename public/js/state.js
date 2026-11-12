/**
 * state.js - Centralized state, auth helpers and alert re-arm protection.
 * AI-Based Patient Gesture Communication and Alert System
 */

const AppState = {
  // Global alert + voice lock
  alertProcessing: false,
  currentAlert: null,
  speechInProgress: false,

  // Re-arm protection (same signal cannot spam alerts)
  gestureRearmRequired: false,
  lastConfirmedGesture: null,
  lastAlertAt: 0,
  releasedSinceAlert: true,
  rearmSeconds: 1.2,

  // Invalid-signal feedback cooldown
  invalidFeedbackCooldown: false,
  invalidCooldownTimer: null,
  invalidCooldownMs: 6000,

  selectedLanguage: 'en', // 'en' | 'kn' | 'hi'
  operationMode: 'single', // 'single' | 'multi'
  detectionModality: 'hand', // hand | face | eye | head  (exactly one is analysed at a time)
  detectionMetrics: { attempts: 0, accepted: 0, rejected: 0, emergencies: 0, lastConfidence: 0 },

  // Safety thresholds (overridden from /api/settings)
  confirmThreshold: 85,
  emergencyThreshold: 88,
  requiredConsistentFrames: 4,

  activePatient: null,
  patients: [],
  soundEnabled: true,
  networkInfo: { localIp: 'localhost', port: 3000, mobileUrl: '/mobile' }
};

// ─── Auth helpers (token is created by the login page) ──────────────────────
function authToken() { return localStorage.getItem('patientToken') || ''; }
function authHeaders(extra) {
  return Object.assign({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken() }, extra || {});
}
async function apiFetch(url, opts) {
  const o = Object.assign({}, opts || {});
  o.headers = authHeaders(o.headers);
  const r = await fetch(url, o);
  if (r.status === 401) {
    localStorage.removeItem('patientToken');
    if (window.top === window) location.href = '/'; else window.top.location.href = '/';
    throw new Error('Session expired');
  }
  return r;
}

function canProcessDetection() { return !AppState.alertProcessing; }

/**
 * A signal may fire an alert when:
 *  - nothing is waiting for re-arm, or
 *  - it is a DIFFERENT signal from the last alert, or
 *  - the same signal was released (hand/face returned to neutral) AND the re-arm timer elapsed.
 */
function isRearmedFor(name) {
  if (!AppState.gestureRearmRequired) return true;
  if (name && name !== AppState.lastConfirmedGesture) { AppState.gestureRearmRequired = false; return true; }
  const elapsed = Date.now() - (AppState.lastAlertAt || 0);
  if (AppState.releasedSinceAlert && elapsed >= Number(AppState.rearmSeconds || 5) * 1000) {
    AppState.gestureRearmRequired = false;
    return true;
  }
  return false;
}

/** Called when the patient returns to neutral / hand leaves frame. */
function markReleased() { AppState.releasedSinceAlert = true; }

function resetRearmState() {
  AppState.gestureRearmRequired = false;
  AppState.lastConfirmedGesture = null;
  AppState.releasedSinceAlert = true;
}

// ─── Live state broadcast to nurse phones (throttled, change-based) ─────────
let _lastBroadcastKey = '';
let _lastBroadcastAt = 0;
async function broadcastLiveState(update) {
  try {
    const key = [update.currentGesture, update.detectionStatus, update.patientId, update.cameraActive, update.modality].join('|');
    const now = Date.now();
    const important = update.metricEvent || update.cameraActive !== undefined;
    if (!important && key === _lastBroadcastKey && now - _lastBroadcastAt < 2000) return;
    if (!important && now - _lastBroadcastAt < 350) return;
    _lastBroadcastKey = key; _lastBroadcastAt = now;
    await fetch('/api/live-status', { method: 'POST', headers: authHeaders(), body: JSON.stringify(update) });
  } catch (e) { /* offline */ }
}
