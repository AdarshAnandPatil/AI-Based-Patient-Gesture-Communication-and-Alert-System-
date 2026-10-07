/**
 * app.js - Main Application Orchestration
 * AI-Based Patient Gesture Communication and Alert System
 */

document.addEventListener('DOMContentLoaded', () => {
  VoiceManager.init();
  AlertManager.init();
  CameraManager.init();

  setupModeSelector();
  setupLanguageSelector();
  setupChannelTabs();
  setupSimulationSuite();

  // Load initial backend resources
  loadNetworkInfo();
  loadPatients();
  loadReports();
  loadAppointments();
  setupAuth();
});

// ─── Modal Helpers (Global) ─────────────────────────────────────────────────
function showModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function hideModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}

// ─── Network Info (Local Wi-Fi IP) ──────────────────────────────────────────
async function loadNetworkInfo() {
  try {
    const res = await fetch('/api/network-info');
    if (!res.ok) return;
    const data = await res.json();
    AppState.networkInfo = data;

    const wifiText = document.getElementById('wifiUrlText');
    const wifiModalUrl = document.getElementById('wifiModalUrl');
    if (wifiText) wifiText.textContent = data.mobileUrl;
    if (wifiModalUrl) wifiModalUrl.textContent = data.mobileUrl;
  } catch (e) { }
}

// ─── Authentication Management (Admin Login / Logout) ───────────────────────
function setupAuth() {
  const loginNavBtn = document.getElementById('loginNavBtn');
  const logoutNavBtn = document.getElementById('logoutNavBtn');
  const userBadge = document.getElementById('adminUserBadge');
  const usernameText = document.getElementById('adminUsernameText');

  if (loginNavBtn) {
    loginNavBtn.addEventListener('click', () => showModal('loginModal'));
  }

  if (logoutNavBtn) {
    logoutNavBtn.addEventListener('click', async () => {
      await fetch('/api/logout', { method: 'POST' });
      AppState.currentUser = null;
      localStorage.removeItem('medgesture_token');
      userBadge.style.display = 'none';
      logoutNavBtn.style.display = 'none';
      loginNavBtn.style.display = 'inline-flex';
      alert('Logged out successfully.');
    });
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const u = document.getElementById('loginUsername').value.trim();
  const p = document.getElementById('loginPassword').value.trim();

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: u, password: p })
    });
    const data = await res.json();

    if (data.success) {
      AppState.currentUser = data.user;
      localStorage.setItem('medgesture_token', data.token);

      const userBadge = document.getElementById('adminUserBadge');
      const usernameText = document.getElementById('adminUsernameText');
      const loginNavBtn = document.getElementById('loginNavBtn');
      const logoutNavBtn = document.getElementById('logoutNavBtn');

      if (usernameText) usernameText.textContent = `${data.user.role.toUpperCase()}: ${data.user.name}`;
      if (userBadge) userBadge.style.display = 'inline-flex';
      if (logoutNavBtn) logoutNavBtn.style.display = 'inline-flex';
      if (loginNavBtn) loginNavBtn.style.display = 'none';

      hideModal('loginModal');
      alert(`Welcome, ${data.user.name}! Administrative privileges active.`);
    } else {
      alert(data.message || 'Login failed.');
    }
  } catch (err) {
    alert('Login error: ' + err.message);
  }
}

// ─── Patients Management (Load & Edit Details) ──────────────────────────────
async function loadPatients() {
  try {
    const res = await fetch('/api/patients');
    if (!res.ok) return;
    const patients = await res.json();
    AppState.patients = patients;
    AppState.activePatient = patients[0];
    renderPatientCards(patients);
    populatePatientSelects(patients);
  } catch (e) { }
}

function renderPatientCards(patients) {
  patients.forEach(p => {
    const nameEl = document.getElementById(`name${p.id}`);
    const condEl = document.getElementById(`roomCond${p.id}`);
    const docEl = document.getElementById(`doc${p.id}`);
    const statusBadge = document.getElementById(`statusBadge${p.id}`);
    const zoneTag = document.getElementById(`zoneTag${p.zone || p.id.replace('P', '')}`);
    const zoneSub = document.getElementById(`zoneSub${p.zone || p.id.replace('P', '')}`);

    if (nameEl) nameEl.textContent = p.name;
    if (condEl) condEl.textContent = `Room ${p.room} • ${p.condition}`;
    if (docEl && p.doctor) docEl.textContent = p.doctor;
    if (statusBadge) {
      statusBadge.textContent = p.status;
      statusBadge.className = `badge-pill ${p.status.toLowerCase()}`;
    }
    if (zoneTag) zoneTag.textContent = `Bed ${p.bed} • Room ${p.room}`;
    if (zoneSub) zoneSub.textContent = p.name;
  });
}

function populatePatientSelects(patients) {
  const reportSelect = document.getElementById('reportPatientSelect');
  const aptSelect = document.getElementById('aptPatientSelect');

  const options = patients.map(p => `<option value="${p.id}">${p.name} (Bed ${p.bed}, Room ${p.room})</option>`).join('');
  if (reportSelect) reportSelect.innerHTML = options;
  if (aptSelect) aptSelect.innerHTML = options;
}

function openEditPatientModal(pId) {
  const patient = AppState.patients.find(p => p.id === pId);
  if (!patient) return;

  document.getElementById('editPatientId').value = patient.id;
  document.getElementById('editPatientName').value = patient.name;
  document.getElementById('editPatientRoom').value = patient.room;
  document.getElementById('editPatientBed').value = patient.bed;
  document.getElementById('editPatientCondition').value = patient.condition;
  document.getElementById('editPatientDoctor').value = patient.doctor || '';
  document.getElementById('editPatientStatus').value = patient.status || 'Normal';

  showModal('editPatientModal');
}

async function handleSavePatient(e) {
  e.preventDefault();
  const pId = document.getElementById('editPatientId').value;
  const updatedData = {
    name: document.getElementById('editPatientName').value.trim(),
    room: document.getElementById('editPatientRoom').value.trim(),
    bed: document.getElementById('editPatientBed').value.trim(),
    condition: document.getElementById('editPatientCondition').value.trim(),
    doctor: document.getElementById('editPatientDoctor').value.trim(),
    status: document.getElementById('editPatientStatus').value
  };

  try {
    const res = await fetch(`/api/patients/${pId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData)
    });
    const result = await res.json();
    if (result.success) {
      await loadPatients();
      hideModal('editPatientModal');
      alert(`Patient details for Bed ${updatedData.bed} updated successfully!`);
    }
  } catch (err) {
    alert('Failed to save patient: ' + err.message);
  }
}

// ─── Medical Reports Management ─────────────────────────────────────────────
async function loadReports() {
  try {
    const res = await fetch('/api/reports');
    if (!res.ok) return;
    const reports = await res.json();
    renderReportsTable(reports);
  } catch (e) { }
}

function renderReportsTable(reports) {
  const tbody = document.getElementById('reportsTableBody');
  if (!tbody) return;

  if (!reports || reports.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:16px;">No reports uploaded yet.</td></tr>';
    return;
  }

  tbody.innerHTML = reports.map(r => `
    <tr>
      <td><b>${r.patientName}</b><br><small style="color:var(--text-muted);">Bed ${r.bed}, Rm ${r.room}</small></td>
      <td>
        <b>${r.title}</b><br>
        <span style="font-size:0.75rem; color:#67e8f9;">${r.type}</span>
      </td>
      <td>${r.doctor}</td>
      <td>${r.date}</td>
      <td><span class="badge-pill ${r.status ? r.status.toLowerCase() : 'normal'}">${r.status || 'Normal'}</span></td>
      <td>
        <button class="btn btn-teal" style="padding:3px 8px; font-size:0.72rem;" onclick="viewReportSummary('${encodeURIComponent(r.summary)}', '${r.fileUrl || ''}')">View</button>
        <button class="btn btn-danger" style="padding:3px 8px; font-size:0.72rem;" onclick="deleteReport('${r.id}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function viewReportSummary(summaryText, fileUrl) {
  const text = decodeURIComponent(summaryText);
  let msg = `CLINICAL REPORT FINDINGS:\n\n${text}`;
  if (fileUrl && fileUrl !== 'null') {
    msg += `\n\nAttachment available at: ${fileUrl}`;
    window.open(fileUrl, '_blank');
  }
  alert(msg);
}

async function handleUploadReport(e) {
  e.preventDefault();
  const pId = document.getElementById('reportPatientSelect').value;
  const patient = AppState.patients.find(p => p.id === pId) || {};

  const formData = new FormData();
  formData.append('patientId', pId);
  formData.append('patientName', patient.name || 'Patient');
  formData.append('room', patient.room || '101');
  formData.append('bed', patient.bed || '1');
  formData.append('title', document.getElementById('reportTitle').value.trim());
  formData.append('type', document.getElementById('reportType').value);
  formData.append('doctor', document.getElementById('reportDoctor').value.trim() || patient.doctor);
  formData.append('summary', document.getElementById('reportSummary').value.trim());

  const fileInput = document.getElementById('reportFileInput');
  if (fileInput.files.length > 0) {
    formData.append('reportFile', fileInput.files[0]);
  }

  try {
    const res = await fetch('/api/reports', { method: 'POST', body: formData });
    if (res.ok) {
      await loadReports();
      hideModal('addReportModal');
      document.getElementById('addReportForm').reset();
      alert('Medical report uploaded successfully!');
    }
  } catch (err) {
    alert('Error uploading report: ' + err.message);
  }
}

async function deleteReport(id) {
  if (!confirm('Delete this report?')) return;
  try {
    await fetch(`/api/reports/${id}`, { method: 'DELETE' });
    loadReports();
  } catch (e) { }
}

// ─── Appointments Management ────────────────────────────────────────────────
async function loadAppointments() {
  try {
    const res = await fetch('/api/appointments');
    if (!res.ok) return;
    const apts = await res.json();
    renderAppointmentsTable(apts);
  } catch (e) { }
}

function renderAppointmentsTable(apts) {
  const tbody = document.getElementById('appointmentsTableBody');
  if (!tbody) return;

  if (!apts || apts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:16px;">No appointments scheduled.</td></tr>';
    return;
  }

  tbody.innerHTML = apts.map(a => `
    <tr>
      <td><b>${a.patientName}</b><br><small style="color:var(--text-muted);">Bed ${a.bed}</small></td>
      <td><b>${a.doctor}</b><br><small style="color:#a5f3fc;">${a.specialty}</small></td>
      <td>${a.date} • ${a.time}</td>
      <td><span class="badge-pill ${a.priority.toLowerCase()}">${a.priority}</span></td>
      <td><span style="font-weight:700; color:${a.status === 'Completed' ? '#34d399' : '#38bdf8'}; font-size:0.75rem;">${a.status}</span></td>
      <td>
        ${a.status !== 'Completed' ? `<button class="btn btn-success" style="padding:3px 8px; font-size:0.72rem;" onclick="updateAptStatus('${a.id}', 'Completed')">✓ Done</button>` : ''}
        <button class="btn btn-danger" style="padding:3px 8px; font-size:0.72rem;" onclick="deleteApt('${a.id}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

async function handleBookAppointment(e) {
  e.preventDefault();
  const pId = document.getElementById('aptPatientSelect').value;
  const patient = AppState.patients.find(p => p.id === pId) || {};

  const payload = {
    patientId: pId,
    patientName: patient.name || 'Patient',
    room: patient.room || '101',
    bed: patient.bed || '1',
    doctor: document.getElementById('aptDoctor').value.trim(),
    specialty: document.getElementById('aptSpecialty').value.trim(),
    date: document.getElementById('aptDate').value,
    time: document.getElementById('aptTime').value.trim(),
    priority: document.getElementById('aptPriority').value,
    reason: document.getElementById('aptReason').value.trim()
  };

  try {
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      await loadAppointments();
      hideModal('addAptModal');
      document.getElementById('addAptForm').reset();
      alert('Appointment booked successfully!');
    }
  } catch (err) {
    alert('Error booking appointment: ' + err.message);
  }
}

async function updateAptStatus(id, newStatus) {
  try {
    await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    loadAppointments();
  } catch (e) { }
}

async function deleteApt(id) {
  if (!confirm('Cancel/Delete this appointment?')) return;
  try {
    await fetch(`/api/appointments/${id}`, { method: 'DELETE' });
    loadAppointments();
  } catch (e) { }
}

// ─── Mode & Language Selectors ──────────────────────────────────────────────
function setupModeSelector() {
  const singleBtn = document.getElementById('singleModeBtn');
  const multiBtn = document.getElementById('multiModeBtn');
  const overlay = document.getElementById('multiBedOverlay');
  const hudMode = document.getElementById('hudModeBadge');

  if (singleBtn && multiBtn) {
    singleBtn.addEventListener('click', () => {
      AppState.operationMode = 'single';
      singleBtn.classList.add('active');
      multiBtn.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      if (hudMode) hudMode.textContent = 'Single Patient Mode';
    });

    multiBtn.addEventListener('click', () => {
      AppState.operationMode = 'multi';
      multiBtn.classList.add('active');
      singleBtn.classList.remove('active');
      if (overlay) overlay.classList.add('active');
      if (hudMode) hudMode.textContent = 'Multi-Patient Mode (4 Beds)';
    });
  }

  const wifiBtn = document.getElementById('openWifiModalBtn');
  if (wifiBtn) wifiBtn.addEventListener('click', () => showModal('wifiModal'));
}

function setupLanguageSelector() {
  const langSelect = document.getElementById('languageSelect');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      AppState.selectedLanguage = e.target.value;
    });
  }
}

function setupChannelTabs() {
  const tabs = document.querySelectorAll('.channel-tab');
  const contents = document.querySelectorAll('.channel-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetContent = document.getElementById(`tabContent-${target}`);
      if (targetContent) targetContent.classList.add('active');
    });
  });
}

// ─── Simulation Suite (Includes NEW Thumbs Up, Down, Swipe Left, Right) ─────
function setupSimulationSuite() {
  // NEW GESTURE: 👍 Thumbs Up
  bindSim('simThumbsUp', () => {
    triggerSimulatedGesture({
      gestureCode: 'THUMBS_UP',
      requirement: 'Thumbs Up / Feeling Better',
      priority: 'normal',
      confidence: 94,
      message: 'Thumbs up. Patient reports feeling better.'
    });
  });

  // NEW GESTURE: 👎 Thumbs Down
  bindSim('simThumbsDown', () => {
    triggerSimulatedGesture({
      gestureCode: 'THUMBS_DOWN',
      requirement: 'Thumbs Down / Discomfort',
      priority: 'attention',
      confidence: 92,
      message: 'Thumbs down. Patient reports discomfort or pain.'
    });
  });

  // NEW GESTURE: 👉 Swipe Right
  bindSim('simSwipeRight', () => {
    triggerSimulatedGesture({
      gestureCode: 'SWIPE_RIGHT',
      requirement: 'Need Position Change (Turn Right)',
      priority: 'attention',
      confidence: 91,
      message: 'Hand swipe right. Patient requests turn to right.'
    });
  });

  // NEW GESTURE: 👈 Swipe Left
  bindSim('simSwipeLeft', () => {
    triggerSimulatedGesture({
      gestureCode: 'SWIPE_LEFT',
      requirement: 'Need Position Change (Turn Left)',
      priority: 'attention',
      confidence: 91,
      message: 'Hand swipe left. Patient requests turn to left.'
    });
  });

  // 1 Finger: Food
  bindSim('simTest1', () => {
    triggerSimulatedGesture({ fingerCount: 1, gestureCode: '1_FINGER', requirement: 'Food', priority: 'normal', confidence: 91 });
  });

  // 2 Fingers: Water
  bindSim('simTest2', () => {
    triggerSimulatedGesture({ fingerCount: 2, gestureCode: '2_FINGERS', requirement: 'Water', priority: 'normal', confidence: 93 });
  });

  // 3 Fingers: Nurse
  bindSim('simTest3', () => {
    triggerSimulatedGesture({ fingerCount: 3, gestureCode: '3_FINGERS', requirement: 'Nurse / Doctor', priority: 'attention', confidence: 89 });
  });

  // 4 Fingers: Toilet
  bindSim('simTest4', () => {
    triggerSimulatedGesture({ fingerCount: 4, gestureCode: '4_FINGERS', requirement: 'Toilet', priority: 'attention', confidence: 92 });
  });

  // 5 Fingers: Emergency
  bindSim('simTest5', () => {
    triggerSimulatedGesture({ fingerCount: 5, gestureCode: '5_FINGERS', requirement: 'Emergency / Immediate Medical Assistance', priority: 'emergency', confidence: 96 });
  });

  // Clenched Fist: All OK
  bindSim('simTest6', () => {
    triggerSimulatedGesture({ fingerCount: 0, gestureCode: 'FIST', requirement: 'All OK', priority: 'normal', confidence: 94 });
  });

  // Unclear Hand -> Invalid
  bindSim('simTest7', () => {
    const calcConf = 63;
    CameraManager.updateHudDetection({ requirement: 'Invalid Gesture', confidence: calcConf, detectionStatus: 'Not Confirmed', priority: 'warning', type: 'invalid_gesture' });
    AlertManager.showInvalidFeedback(calcConf);
  });

  // Continuous Invalid
  bindSim('simTest8', () => {
    AlertManager.showInvalidFeedback(62);
    setTimeout(() => AlertManager.showInvalidFeedback(62), 300);
    setTimeout(() => AlertManager.showInvalidFeedback(62), 600);
  });

  // Water Complete Speech
  bindSim('simTest9', () => {
    triggerSimulatedGesture({ fingerCount: 2, gestureCode: '2_FINGERS', requirement: 'Water', priority: 'normal', confidence: 93 });
  });

  // Lock Blocks 2nd Alert
  bindSim('simTest10', () => {
    triggerSimulatedGesture({ fingerCount: 2, gestureCode: '2_FINGERS', requirement: 'Water', priority: 'normal', confidence: 93 });
    setTimeout(() => {
      AlertManager.triggerAlert({ requirement: 'Emergency / Immediate Medical Assistance', priority: 'emergency', confidence: 97 });
    }, 500);
  });

  // Unlock 'X' Button
  bindSim('simTest11', () => {
    triggerSimulatedGesture({ requirement: 'Water', priority: 'normal', confidence: 91 });
    setTimeout(() => {
      const closeBtn = document.getElementById('modalCloseBtn');
      if (closeBtn) closeBtn.click();
    }, 700);
  });

  // Unlock Outside Click
  bindSim('simTest12', () => {
    triggerSimulatedGesture({ requirement: 'Food', priority: 'normal', confidence: 90 });
    setTimeout(() => {
      const overlay = document.getElementById('alertModalOverlay');
      if (overlay) overlay.click();
    }, 700);
  });

  // Unlock Escape Key
  bindSim('simTest13', () => {
    triggerSimulatedGesture({ requirement: 'Nurse / Doctor', priority: 'attention', confidence: 92 });
    setTimeout(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    }, 700);
  });

  // Acknowledge & Unlock
  bindSim('simTest14', () => {
    triggerSimulatedGesture({ requirement: 'Water', priority: 'normal', confidence: 93 });
    setTimeout(() => {
      const ackBtn = document.getElementById('modalAckBtn');
      if (ackBtn) ackBtn.click();
    }, 800);
  });

  // Resolve & Unlock
  bindSim('simTest15', () => {
    triggerSimulatedGesture({ requirement: 'Toilet', priority: 'attention', confidence: 91 });
    setTimeout(() => {
      const resBtn = document.getElementById('modalResolveBtn');
      if (resBtn) resBtn.click();
    }, 800);
  });

  // Re-Arm Blocks Same Held
  bindSim('simTest16', () => {
    triggerSimulatedGesture({ requirement: 'Water', priority: 'normal', confidence: 92 });
    setTimeout(() => {
      AlertManager.dismissAlert('test_dismiss');
      const retriggered = AlertManager.triggerAlert({ requirement: 'Water', priority: 'normal', confidence: 92 });
      alert('TEST 16 Result: Re-arm blocked duplicate Water alert!');
    }, 600);
  });

  // Hand Release Re-Arms
  bindSim('simTest17', () => {
    resetRearmState();
    alert('TEST 17: Hand released. System re-armed!');
  });

  // New Intentional Gesture
  bindSim('simTest18', () => {
    resetRearmState();
    triggerSimulatedGesture({ requirement: 'Food', priority: 'normal', confidence: 94 });
  });

  // Kannada Voice Fallback
  bindSim('simTest20', () => {
    const langSelect = document.getElementById('languageSelect');
    if (langSelect) langSelect.value = 'kn';
    AppState.selectedLanguage = 'kn';
    triggerSimulatedGesture({ requirement: 'Water', priority: 'normal', confidence: 93 });
  });

  // Multi-Patient Bed 2
  bindSim('simTest21', () => {
    AppState.operationMode = 'multi';
    const multiBtn = document.getElementById('multiModeBtn');
    if (multiBtn) multiBtn.click();
    const p2 = AppState.patients[1] || AppState.patients[0];
    triggerSimulatedGesture({ requirement: 'Water', priority: 'normal', confidence: 94, patient: p2 });
  });
}

function bindSim(id, handler) {
  const el = document.getElementById(id);
  if (el) el.addEventListener('click', handler);
}

function triggerSimulatedGesture(data) {
  const patient = data.patient || (AppState.operationMode === 'multi' ? AppState.patients[0] : AppState.activePatient);

  CameraManager.updateHudDetection({
    requirement: data.requirement,
    confidence: data.confidence || 93,
    detectionStatus: 'Confirmed',
    priority: data.priority || 'normal',
    patient
  });

  broadcastLiveState({
    currentGesture: data.requirement,
    confidence: data.confidence || 93,
    detectionStatus: 'Confirmed',
    patientId: patient.id,
    patientName: patient.name,
    room: patient.room,
    bed: patient.bed,
    priority: data.priority || 'normal'
  });

  AlertManager.triggerAlert({
    type: data.type || 'hand_gesture',
    gestureCode: data.gestureCode || data.requirement,
    requirement: data.requirement,
    priority: data.priority || 'normal',
    confidence: data.confidence || 93,
    detectionStatus: 'Confirmed',
    message: data.message,
    patient
  });
}
