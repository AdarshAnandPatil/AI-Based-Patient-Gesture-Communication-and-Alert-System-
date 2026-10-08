/**
 * state.js - Centralized State Management
 * AI-Based Patient Gesture Communication and Alert System
 */

const AppState = {
  // Global Alert & Voice Lock
  alertProcessing: false,
  currentAlert: null,
  speechInProgress: false,

  // Re-arm protection
  gestureRearmRequired: false,
  lastConfirmedGesture: null,

  // Cooldown for invalid gesture feedback
  invalidFeedbackCooldown: false,
  invalidCooldownTimer: null,
  invalidCooldownMs: 3800,

  // Localization
  selectedLanguage: 'en', // 'en' | 'kn' | 'hi'

  // Operation Mode: 'single' | 'multi'
  operationMode: 'single',

  // Current User / Auth Status
  currentUser: {
    authenticated: false,
    username: '',
    name: '',
    role: 'admin'
  },

  // Active Patient in Single Patient Mode
  activePatient: {
    id: '',
    name: '',
    room: '',
    bed: '',
    zone: 1,
    condition: 'Post-Surgery Recovery',
    status: 'Normal'
  },

  // Patients are loaded from the admin-managed backend.
  patients: [],

  // Buffer for fast consistency check
  consistencyBuffer: [],
  requiredConsistentFrames: 5,

  // Sound effects mute state
  soundEnabled: true,

  // Network & Mobile Wi-Fi URL
  networkInfo: {
    localIp: 'localhost',
    port: 3000,
    mobileUrl: 'http://localhost:3000/mobile'
  }
};

function canProcessDetection() {
  return !AppState.alertProcessing;
}

function isRearmedFor(gestureName) {
  if (!AppState.gestureRearmRequired) return true;
  if (gestureName && gestureName !== AppState.lastConfirmedGesture && gestureName !== 'none') {
    AppState.gestureRearmRequired = false;
    return true;
  }
  return false;
}

function resetRearmState() {
  AppState.gestureRearmRequired = false;
  AppState.lastConfirmedGesture = null;
}

// Broadcast live state to server for mobile devices on same Wi-Fi
async function broadcastLiveState(update) {
  try {
    await fetch('/api/live-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update)
    });
  } catch (e) {}
}
