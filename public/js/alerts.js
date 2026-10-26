/**
 * alerts.js - Alert processing, modal, 6 unlock conditions, re-arm protection and backend sync.
 *
 * Unlock rules: (1) voice finishes, (2) X button, (3) click outside, (4) Escape,
 *               (5) Acknowledge, (6) Resolve.
 */
const AlertManager = {
  currentAlertData: null,

  init() { this.bindEvents(); this.fetchRecentAlerts(); },

  bindEvents() {
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && AppState.alertProcessing && this.currentAlertData) this.dismissAlert('escape'); });
    const ov = document.getElementById('alertModalOverlay');
    if (ov) ov.addEventListener('click', e => { if (e.target === ov) this.dismissAlert('outside_click'); });
    const c = document.getElementById('modalCloseBtn'); if (c) c.addEventListener('click', () => this.dismissAlert('close_button'));
    const a = document.getElementById('modalAckBtn'); if (a) a.addEventListener('click', () => this.acknowledgeAlert());
    const r = document.getElementById('modalResolveBtn'); if (r) r.addEventListener('click', () => this.resolveAlert());
  },

  iconFor(text = '') {
    const map = [['Breathing', '🫁'], ['Shake', '🚨'], ['Emergency', '🚨'], ['Water', '💧'], ['Food', '🍲'], ['Nurse', '🩺'], ['Toilet', '🚻'], ['Thumbs Up', '👍'], ['Thumbs Down', '👎'], ['OK', '✅'], ['Pointing', '👉'], ['Help', '🆘'], ['Blink', '👁️'], ['Head', '↔️'], ['Smile', '😊'], ['Frown', '😟'], ['Mouth', '😮'], ['Pain', '⚡']];
    for (const [k, v] of map) if (text.includes(k)) return v;
    return '🔔';
  },

  /** Main entry. Returns true only when an alert was really raised. */
  triggerAlert(ev) {
    if (AppState.alertProcessing) return false;                                   // global lock
    if (AppState.gestureRearmRequired && ev.requirement === AppState.lastConfirmedGesture && !isRearmedFor(ev.requirement)) return false;
    const patient = ev.patient || AppState.activePatient;
    if (!patient) return false;

    AppState.alertProcessing = true;
    AppState.gestureRearmRequired = true;
    AppState.lastConfirmedGesture = ev.requirement;
    AppState.lastAlertAt = Date.now();
    AppState.releasedSinceAlert = false;
    this.updateLockStatusUI(true);

    const alert = {
      id: `ALT-${Date.now().toString().slice(-7)}`,
      timestamp: new Date().toISOString(),
      patientId: patient.id, patient: patient.name, room: patient.room, bed: patient.bed,
      gesture: ev.gestureCode || ev.requirement,
      requirement: ev.requirement,
      message: ev.message || `${ev.requirement} required.`,
      confidence: ev.confidence || 92,
      detectionStatus: ev.detectionStatus || 'Confirmed',
      priority: ev.priority || 'normal',
      status: 'pending',
      language: AppState.selectedLanguage,
      type: ev.type || 'hand_gesture'
    };
    this.currentAlertData = alert;
    AppState.currentAlert = alert;

    VoiceManager.playChime(alert.priority);
    this.showModalUI(alert);
    this.saveAlertToBackend(alert);
    VoiceManager.speakCompleteAlert({
      requirement: alert.requirement, patient: alert.patient, room: alert.room, bed: alert.bed,
      lang: AppState.selectedLanguage, onFinish: () => this.onVoiceFinished()
    });
    return true;
  },

  showModalUI(a) {
    const ov = document.getElementById('alertModalOverlay'), box = document.getElementById('alertModalBox');
    if (!ov || !box) return;
    box.className = 'alert-modal-box' + (a.priority === 'emergency' ? ' emergency' : '');
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    document.getElementById('modalAlertTitle').textContent = `${this.iconFor(a.requirement)} ${a.requirement}`;
    set('modalConfidence', `${a.confidence}%`); set('modalDetectionStatus', a.detectionStatus);
    set('modalPatient', a.patient); set('modalRoom', a.room); set('modalBed', a.bed);
    const tr = (VoiceManager.translations[a.requirement] || {})[AppState.selectedLanguage];
    set('modalSpokenPreview', tr || a.message);
    const si = document.getElementById('speechIndicator'); if (si) si.style.display = 'flex';
    ov.classList.add('active');
  },

  onVoiceFinished() {
    const si = document.getElementById('speechIndicator'); if (si) si.style.display = 'none';
    setTimeout(() => { if (AppState.alertProcessing && this.currentAlertData) this.unlockSystem('voice_complete'); }, 1500);
  },
  dismissAlert(reason) { VoiceManager.stopSpeech(); this.unlockSystem(reason); },
  acknowledgeAlert() { VoiceManager.stopSpeech(); if (this.currentAlertData) this.updateAlertStatusOnBackend(this.currentAlertData.id, 'acknowledged'); this.unlockSystem('acknowledged'); },
  resolveAlert() { VoiceManager.stopSpeech(); if (this.currentAlertData) this.updateAlertStatusOnBackend(this.currentAlertData.id, 'resolved'); this.unlockSystem('resolved'); },

  unlockSystem() {
    const ov = document.getElementById('alertModalOverlay'); if (ov) ov.classList.remove('active');
    AppState.alertProcessing = false; AppState.speechInProgress = false;
    this.currentAlertData = null; AppState.currentAlert = null;
    this.updateLockStatusUI(false);
    this.fetchRecentAlerts();
  },

  showInvalidFeedback(confidence = 60) {
    if (AppState.alertProcessing) return;
    const t = document.getElementById('invalidGestureToast'); if (!t) return;
    const c = document.getElementById('invalidToastConf'); if (c) c.textContent = `Confidence: ${confidence}%`;
    t.classList.add('show');
    VoiceManager.speakInvalidGesture(AppState.selectedLanguage);
    clearTimeout(this._toastT); this._toastT = setTimeout(() => t.classList.remove('show'), 3200);
  },

  updateLockStatusUI(locked) {
    const dot = document.querySelector('.status-live-dot, .live-chip i'); const txt = document.getElementById('systemStatusText');
    if (dot) dot.classList.toggle('locked', locked);
    if (txt) txt.textContent = locked ? 'Alert active — system locked' : 'System ready';
  },

  async saveAlertToBackend(alert) {
    try { const r = await apiFetch('/api/alerts', { method: 'POST', body: JSON.stringify(alert) }); if (r.ok) this.fetchRecentAlerts(); }
    catch (e) { console.warn('[alerts] save failed', e.message); }
  },
  async updateAlertStatusOnBackend(id, status) {
    try { await apiFetch(`/api/alerts/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); this.fetchRecentAlerts(); }
    catch (e) { console.warn('[alerts] status update failed', e.message); }
  },

  async fetchRecentAlerts() {
    try { const r = await apiFetch('/api/alerts?limit=6'); if (r.ok) this.renderAlertsList(await r.json()); } catch (e) { /* offline */ }
  },

  renderAlertsList(alerts) {
    const list = document.getElementById('recentAlertsList'); if (!list) return;
    const esc = v => String(v ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
    if (!alerts || !alerts.length) { list.innerHTML = '<div class="empty">No alerts yet. All monitored patients are stable.</div>'; return; }
    list.innerHTML = alerts.slice(0, 6).map(a => `
      <div class="mini-alert ${esc(a.priority)}">
        <span class="mini-icon">${this.iconFor(a.requirement)}</span>
        <div><b>${esc(a.requirement)}</b><small>${esc(a.patient)} · Room ${esc(a.room)} · Bed ${esc(a.bed)}</small></div>
        <div class="mini-meta"><small>${new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small><span class="state ${esc(a.status)}">${esc(a.status)}</span></div>
      </div>`).join('');
  }
};
