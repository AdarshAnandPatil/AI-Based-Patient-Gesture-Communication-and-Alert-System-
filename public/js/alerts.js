/**
 * alerts.js - Global Alert Processing, Modal UI, 6 Unlock Conditions,
 * Re-Arm Protection & Backend REST Sync.
 * 
 * Strict Alert Unlock Rules:
 *   1. Voice finishes completely
 *   2. User clicks 'X'
 *   3. User clicks outside modal
 *   4. User presses Escape
 *   5. User clicks Acknowledge
 *   6. User clicks Resolve
 */

const AlertManager = {
  currentAlertData: null,
  activeAlertElement: null,

  init() {
    this.bindEvents();
    this.fetchRecentAlerts();
  },

  bindEvents() {
    // ESC key closes active alert modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (AppState.alertProcessing && this.currentAlertData) {
          this.dismissAlert('escape');
        }
      }
    });

    // Click outside modal backdrop closes active alert
    const modalOverlay = document.getElementById('alertModalOverlay');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
          this.dismissAlert('outside_click');
        }
      });
    }

    // Modal X button
    const closeBtn = document.getElementById('modalCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.dismissAlert('close_button');
      });
    }

    // Acknowledge button
    const ackBtn = document.getElementById('modalAckBtn');
    if (ackBtn) {
      ackBtn.addEventListener('click', () => {
        this.acknowledgeAlert();
      });
    }

    // Resolve button
    const resBtn = document.getElementById('modalResolveBtn');
    if (resBtn) {
      resBtn.addEventListener('click', () => {
        this.resolveAlert();
      });
    }
  },

  /**
   * Main entry point to trigger an alert
   */
  triggerAlert(eventData) {
    // ─── 1. GLOBAL ALERT LOCK ENFORCEMENT ──────────────────────────────────
    // While an alert is processing, ALL new incoming events are strictly ignored!
    if (AppState.alertProcessing) {
      return false;
    }

    // ─── 2. RE-ARM PROTECTION ──────────────────────────────────────────────
    // If the patient continues holding the SAME gesture, do not retrigger!
    if (AppState.gestureRearmRequired) {
      if (eventData.requirement === AppState.lastConfirmedGesture) {
        return false;
      }
    }

    // ─── 3. LOCK SYSTEM ────────────────────────────────────────────────────
    AppState.alertProcessing = true;
    AppState.gestureRearmRequired = true;
    AppState.lastConfirmedGesture = eventData.requirement;

    this.updateLockStatusUI(true);

    // Patient & Room association (Single or Multi-Patient Zone)
    const patientInfo = eventData.patient || AppState.activePatient;

    const alertId = `ALT-${Date.now().toString().slice(-6)}`;
    const newAlert = {
      id: alertId,
      timestamp: new Date().toISOString(),
      patientId: patientInfo.id,
      patient: patientInfo.name,
      room: patientInfo.room,
      bed: patientInfo.bed,
      gesture: eventData.gestureCode || eventData.requirement,
      requirement: eventData.requirement,
      message: eventData.message || `${eventData.requirement} required.`,
      confidence: eventData.confidence || 92,
      detectionStatus: eventData.detectionStatus || 'Confirmed',
      priority: eventData.priority || 'normal', // 'normal' | 'attention' | 'warning' | 'emergency'
      status: 'pending',
      language: AppState.selectedLanguage,
      type: eventData.type || 'hand_gesture'
    };

    this.currentAlertData = newAlert;
    AppState.currentAlert = newAlert;

    // Play chime sound
    VoiceManager.playChime(newAlert.priority);

    // Show visual modal
    this.showModalUI(newAlert);

    // Persist to backend REST API
    this.saveAlertToBackend(newAlert);

    // ─── 4. VOICE SPEECH WITH SEQUENCE LOCK ────────────────────────────────
    // Voice speaks complete info: Requirement + Patient + Room + Bed.
    // The system remains locked until this complete voice sequence finishes!
    VoiceManager.speakCompleteAlert({
      requirement: newAlert.requirement,
      patient: newAlert.patient,
      room: newAlert.room,
      bed: newAlert.bed,
      lang: AppState.selectedLanguage,
      onFinish: () => {
        // Unlock condition 1: Voice finished completely
        this.onVoiceFinished();
      }
    });

    return true;
  },

  /**
   * Render alert modal content
   */
  showModalUI(alert) {
    const modalOverlay = document.getElementById('alertModalOverlay');
    const modalBox = document.getElementById('alertModalBox');
    if (!modalOverlay || !modalBox) return;

    modalBox.className = `alert-modal-box ${alert.priority === 'emergency' ? 'emergency' : ''}`;

    // Icon mapping
    let icon = '🔔';
    if (alert.requirement.includes('Water')) icon = '💧';
    else if (alert.requirement.includes('Food')) icon = '🍲';
    else if (alert.requirement.includes('Nurse')) icon = '🩺';
    else if (alert.requirement.includes('Toilet')) icon = '🚻';
    else if (alert.requirement.includes('Emergency')) icon = '🚨';
    else if (alert.requirement.includes('OK')) icon = '✅';
    else if (alert.requirement.includes('Pain')) icon = '⚡';
    else if (alert.requirement.includes('Breathing')) icon = '🫁';
    else if (alert.requirement.includes('Fall')) icon = '⚠️';

    document.getElementById('modalAlertTitle').innerHTML = `${icon} ${alert.requirement}`;
    document.getElementById('modalConfidence').textContent = `${alert.confidence}%`;
    document.getElementById('modalDetectionStatus').textContent = alert.detectionStatus;
    document.getElementById('modalPatient').textContent = alert.patient;
    document.getElementById('modalRoom').textContent = alert.room;
    document.getElementById('modalBed').textContent = alert.bed;

    // Translation subtitle
    const transDict = VoiceManager.translations[alert.requirement] || {};
    const transText = transDict[AppState.selectedLanguage] || alert.message;
    document.getElementById('modalSpokenPreview').textContent = transText;

    // Wave animation indicator
    const speechIndicator = document.getElementById('speechIndicator');
    if (speechIndicator) speechIndicator.style.display = 'flex';

    modalOverlay.classList.add('active');
  },

  /**
   * Unlock Condition 1: Voice finished speaking
   */
  onVoiceFinished() {
    const speechIndicator = document.getElementById('speechIndicator');
    if (speechIndicator) speechIndicator.style.display = 'none';

    // Auto-unlock after speech completes
    // Keep visible for brief readability (1.5s) then unlock & auto-close
    setTimeout(() => {
      if (AppState.alertProcessing && this.currentAlertData) {
        this.unlockSystem('voice_complete');
      }
    }, 1500);
  },

  /**
   * Unlock Conditions 2, 3, 4: Close button, Outside click, Escape key
   */
  dismissAlert(reason) {
    VoiceManager.stopSpeech();
    this.unlockSystem(reason);
  },

  /**
   * Unlock Condition 5: Acknowledge button
   */
  acknowledgeAlert() {
    VoiceManager.stopSpeech();
    if (this.currentAlertData) {
      this.updateAlertStatusOnBackend(this.currentAlertData.id, 'acknowledged');
    }
    this.unlockSystem('acknowledged');
  },

  /**
   * Unlock Condition 6: Resolve button
   */
  resolveAlert() {
    VoiceManager.stopSpeech();
    if (this.currentAlertData) {
      this.updateAlertStatusOnBackend(this.currentAlertData.id, 'resolved');
    }
    this.unlockSystem('resolved');
  },

  /**
   * Central unlock mechanism
   * Safely unlocks the global lock exactly once and re-arms the system.
   */
  unlockSystem(reason) {
    const modalOverlay = document.getElementById('alertModalOverlay');
    if (modalOverlay) {
      modalOverlay.classList.remove('active');
    }

    // Release Global Lock!
    AppState.alertProcessing = false;
    AppState.speechInProgress = false;
    this.currentAlertData = null;
    AppState.currentAlert = null;

    this.updateLockStatusUI(false);
    this.fetchRecentAlerts();

    // Re-arm protection remains true: the patient must release or return to neutral
    // before the exact same gesture can trigger again!
  },

  /**
   * Show Invalid Gesture Warning Toast (Yellow Warning Style)
   */
  showInvalidFeedback(confidence = 61) {
    if (AppState.alertProcessing) return; // Never overwrite confirmed alert!

    const toast = document.getElementById('invalidGestureToast');
    if (!toast) return;

    document.getElementById('invalidToastConf').textContent = `Confidence: ${confidence}%`;
    document.getElementById('invalidToastStatus').textContent = `Detection: Not Confirmed`;

    toast.classList.add('show');

    // Voice feedback with cooldown
    VoiceManager.speakInvalidGesture(AppState.selectedLanguage);

    // Auto-hide toast after 3.2s
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  },

  updateLockStatusUI(isLocked) {
    // New header system status
    const statusDot = document.querySelector('.status-live-dot');
    const statusText = document.getElementById('systemStatusText');
    if (isLocked) {
      if (statusDot) statusDot.classList.add('locked');
      if (statusText) statusText.textContent = 'System Locked (Speaking)';
    } else {
      if (statusDot) statusDot.classList.remove('locked');
      if (statusText) statusText.textContent = 'System Ready';
    }
    // Update voice panel
    if (typeof window.updateVoicePanel === 'function') {
      if (isLocked && this.currentAlertData) {
        const msg = this.currentAlertData.message || this.currentAlertData.requirement;
        window.updateVoicePanel('speaking', msg, AppState.selectedLanguage);
      } else {
        window.updateVoicePanel('ready', 'Waiting for patient communication...', AppState.selectedLanguage);
      }
    }
    // Update patient detail comm box
    if (isLocked && this.currentAlertData) {
      const d = this.currentAlertData;
      const icons = { 'Water': '💧', 'Food': '🍲', 'Nurse': '🩺', 'Emergency': '🚨', 'Toilet': '🚻', 'OK': '✅', 'Pain': '⚡', 'Breathing': '🫁' };
      let icon = '✋';
      for (const [k, v] of Object.entries(icons)) { if (d.requirement && d.requirement.includes(k)) { icon = v; break; } }
      const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      setEl('pdCommGesture', icon);
      setEl('pdCommName', d.requirement);
      setEl('pdCommConf', `${d.confidence}%`);
      setEl('pdCommStatus', d.detectionStatus || 'Confirmed');
      setEl('dcGestureIcon', icon);
    }
    // Legacy badge support
    const badge = document.getElementById('globalLockBadge');
    if (badge) {
      const dot = badge.querySelector('.status-live-dot, .status-dot');
      const span = badge.querySelector('#systemStatusText');
      if (!span && badge.tagName) badge.innerHTML = isLocked
        ? '<span class="status-live-dot locked"></span><span id="systemStatusText">System Locked (Speaking)</span>'
        : '<span class="status-live-dot"></span><span id="systemStatusText">System Ready</span>';
    }
  },

  /**
   * Save alert to Express backend (POST /api/alerts)
   */
  async saveAlertToBackend(alert) {
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
      if (res.ok) {
        this.fetchRecentAlerts();
      }
    } catch (err) {
      console.warn('[BACKEND] Could not reach alert API:', err.message);
    }
  },

  /**
   * Update status via PATCH /api/alerts/:id (Acknowledge / Resolve)
   */
  async updateAlertStatusOnBackend(alertId, newStatus) {
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      this.fetchRecentAlerts();
    } catch (err) {
      console.warn('[BACKEND] Failed to PATCH alert status:', err.message);
    }
  },

  /**
   * Fetch recent alerts for UI feed
   */
  async fetchRecentAlerts() {
    try {
      const res = await fetch('/api/alerts?limit=6');
      if (!res.ok) return;
      const alerts = await res.json();
      this.renderAlertsList(alerts);
    } catch (e) {
      // offline or mock
    }
  },

  renderAlertsList(alerts) {
    const list = document.getElementById('recentAlertsList');
    if (!list) return;

    if (!alerts || alerts.length === 0) {
      list.innerHTML = `<div class="empty-state-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:32px;height:32px;color:#64748b"><polyline points="20 6 9 17 4 12"/></svg>
        <p>No active alerts</p>
        <small>All patients are currently stable.</small>
      </div>`;
      return;
    }

    const iconMap = { Water: '💧', Food: '🍲', Nurse: '🩺', Emergency: '🚨', Toilet: '🚻', OK: '✅', Pain: '⚡', Breathing: '🫁', Thumbs: '👍' };
    const priorityLabel = { emergency: 'Critical', attention: 'High', normal: 'Normal', warning: 'Warning' };
    const statusPillClass = { pending: 'attention', acknowledged: 'monitoring', resolved: 'normal' };

    list.innerHTML = alerts.slice(0, 8).map(a => {
      let icon = '🔔';
      for (const [k, v] of Object.entries(iconMap)) {
        if (a.requirement && a.requirement.includes(k)) { icon = v; break; }
      }

      const timeStr = new Date(a.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      const iconClass = a.priority === 'emergency' ? 'emergency' : a.priority === 'attention' ? 'attention' : 'normal';
      const statusCls = statusPillClass[a.status] || 'attention';
      const priorityText = priorityLabel[a.priority] || 'Normal';
      const priorityColor = a.priority === 'emergency' ? 'priority-emergency' : a.priority === 'attention' ? 'priority-attention' : 'priority-normal';

      return `
        <div class="alert-feed-item ${a.priority || 'normal'}">
          <div class="alert-feed-icon ${iconClass}">${icon}</div>
          <div class="alert-feed-body">
            <div class="alert-feed-title">${a.requirement}</div>
            <div class="alert-feed-sub">${a.patient} &nbsp;·&nbsp; Room ${a.room} · Bed ${a.bed}</div>
          </div>
          <div class="alert-feed-meta">
            <span class="alert-feed-time">${timeStr}</span>
            <span class="alert-feed-priority ${priorityColor}">${priorityText}</span>
            <span class="status-pill ${statusCls}" style="font-size:0.6rem;padding:2px 7px;">${a.status}</span>
          </div>
        </div>
      `;
    }).join('');

    // Update sidebar badge count
    const activeCount = alerts.filter(a => a.status === 'open' || a.status === 'pending' || a.status === 'acknowledged').length;
    const badge = document.getElementById('sidebarAlertBadge');
    if (badge) { badge.textContent = activeCount; badge.style.display = activeCount > 0 ? 'flex' : 'none'; }

    // Update summary card
    const scActive = document.getElementById('sc-active-alerts');
    if (scActive) scActive.textContent = activeCount;
    const scResolved = document.getElementById('sc-resolved');
    if (scResolved) scResolved.textContent = alerts.filter(a => a.status === 'resolved').length;
  }
};
