/* dashboard.js - command center SPA (login-theme UI). */
const T = localStorage.getItem('patientToken'); if (!T) location.href = '/';
const state = { page: 'dashboard', user: JSON.parse(localStorage.getItem('patientUser') || '{}'), patients: [], alerts: [], rooms: [], appointments: [], reports: [], stats: {}, settings: {}, metrics: {}, health: {}, alertTab: 'active', alertFilter: 'all', alertQuery: '', aptFilter: 'all' };
const headers = () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('patientToken') });
async function api(url, opt = {}) {
  opt.headers = { ...(opt.headers || {}), Authorization: 'Bearer ' + localStorage.getItem('patientToken') };
  const r = await fetch(url, opt);
  if (r.status === 401) { localStorage.clear(); location.href = '/'; throw new Error('Session expired'); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.message || 'Request failed');
  return d;
}
function toast(s, kind = '') { const t = document.getElementById('toast'); t.textContent = s; t.className = 'toast show ' + kind; setTimeout(() => t.className = 'toast', 2800); }
function esc(v) { return String(v ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m])); }
function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function modal(html) { document.getElementById('modalBody').innerHTML = html; document.getElementById('modal').classList.remove('hidden'); }
const PAGES = { dashboard: ['OVERVIEW', 'Hospital Command Center'], monitor: ['LIVE', 'Live AI Monitor'], patients: ['PATIENTS', 'Patient Admission & Management'], rooms: ['WARD', 'Ward Rooms & Bed Assignment'], appointments: ['SCHEDULE', 'Appointments & Care Schedule'], alerts: ['ALERTS', 'Active Patient Alerts'], history: ['HISTORY', 'Alert History & Response Timeline'], reports: ['ANALYTICS', 'Reports, Analytics & System Health'], settings: ['SETTINGS', 'Detection & Communication Settings'], admin: ['ADMIN', 'Admin, Security & Audit'] };
function nav(page) {
  if (!PAGES[page]) page = 'dashboard';
  state.page = page; if (location.hash.slice(1) !== page) history.replaceState(null, '', '#' + page);
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('active', b.dataset.page === page));
  render(); window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.querySelectorAll('#nav button').forEach(b => b.onclick = () => nav(b.dataset.page));
document.getElementById('logoutBtn').onclick = async () => { try { await fetch('/api/logout', { method: 'POST', headers: headers() }); } catch (e) {} localStorage.clear(); location.href = '/'; };
document.getElementById('wifiBtn').onclick = async () => { const n = await api('/api/network-info'); modal(`<div class="modal-title">📱 Nurse phone connection</div><p class="muted">${n.hosted ? 'This site is hosted online — open this address on any phone and sign in.' : 'Connect the nurse phone to the same hospital Wi-Fi as this computer.'}</p><div class="connect-box"><b>${esc(n.mobileUrl)}</b><span>Open this address on the nurse phone, then sign in.</span></div><p class="small">Alerts sync live between this dashboard, the camera and the phone.</p>`); };
document.getElementById('userName').textContent = state.user.name || state.user.username || 'User';
document.getElementById('userAvatar').textContent = (state.user.name || 'U').charAt(0).toUpperCase();
if (state.user.role !== 'admin') document.querySelector('.admin-only').style.display = 'none';

async function load() {
  [state.patients, state.alerts, state.rooms, state.appointments, state.reports, state.stats, state.metrics, state.health] = await Promise.all([api('/api/patients'), api('/api/alerts'), api('/api/rooms'), api('/api/appointments'), api('/api/reports'), api('/api/stats'), api('/api/detection-metrics'), api('/api/system-health')]);
  if (state.user.role === 'admin') state.settings = await api('/api/settings');
  document.getElementById('alertBadge').textContent = state.stats.pending + state.stats.acknowledged;
}
function shell(title, sub, actions = '', desc = '', pills = [], icon = '✚') {
  return `<section class="hero"><div><div class="hero-icon">${icon}</div><span class="eyebrow">${sub}</span><h2>${title}</h2>${desc ? `<p>${desc}</p>` : ''}${pills.length ? `<div class="pills">${pills.map(p => `<span>${p}</span>`).join('')}</div>` : ''}</div><div class="hero-actions">${actions}</div></section>`;
}
function stat(label, val, icon, cls) { return `<div class="stat ${cls}"><div class="stat-icon">${icon}</div><div><b>${val}</b><span>${label}</span></div></div>`; }
function ago(t) { const s = Math.max(0, (Date.now() - new Date(t)) / 1000); return s < 60 ? 'just now' : s < 3600 ? Math.floor(s / 60) + ' min ago' : s < 86400 ? Math.floor(s / 3600) + ' h ago' : new Date(t).toLocaleDateString(); }
function patientCard(p) { return `<div class="patient-card"><div class="patient-top"><div class="avatar">${esc((p.name || '?')[0])}</div><div><b>${esc(p.name)}</b><span>${esc(p.id)} · Room ${esc(p.room)} · Bed ${esc(p.bed)}</span></div><span class="status ${p.status === 'Attention' ? 'attention' : 'ok'}">${esc(p.status)}</span></div><div class="patient-grid"><span>Condition<strong>${esc(p.condition)}</strong></span><span>Doctor<strong>${esc(p.doctor)}</strong></span><span>Nurse<strong>${esc(p.nurse)}</strong></span><span>Priority<strong>${esc(p.priority)}</strong></span></div><div class="card-actions"><button onclick="viewPatient('${esc(p.id)}')">View</button>${state.user.role === 'admin' ? `<button onclick="editPatient('${esc(p.id)}')">Edit</button><button class="danger" onclick="deletePatient('${esc(p.id)}')">Remove</button>` : ''}</div></div>`; }
function alertCard(a, opts = {}) {
  const em = a.priority === 'emergency';
  const act = [];
  if (a.status === 'pending') act.push(`<button onclick="alertStatus('${a.id}','acknowledged')">Acknowledge</button>`);
  if (a.status !== 'resolved' && a.status !== 'archived') act.push(`<button class="success" onclick="alertStatus('${a.id}','resolved')">Resolve</button>`);
  if (a.status === 'resolved') act.push(`<button onclick="alertStatus('${a.id}','archived')">Archive</button>`);
  if (opts.history && !em) act.push(`<button class="danger" onclick="deleteAlert('${a.id}')">Delete</button>`);
  const steps = [`Detected ${new Date(a.timestamp).toLocaleTimeString()}`, a.acknowledgedAt ? `Acknowledged ${new Date(a.acknowledgedAt).toLocaleTimeString()}` : '', a.resolvedAt ? `Resolved ${new Date(a.resolvedAt).toLocaleTimeString()}` : ''].filter(Boolean);
  return `<div class="alert-card ${em ? 'emergency' : ''}"><div class="alert-icon">${em ? '🚨' : a.type === 'invalid_gesture' ? '🛡️' : '🔔'}</div><div class="alert-main"><div class="alert-title"><b>${esc(a.requirement)}</b><span class="priority ${esc(a.priority)}">${esc(a.priority)}</span><span class="state ${esc(a.status)}">${esc(a.status)}</span></div><p>${esc(a.patient)} · Room ${esc(a.room)} · Bed ${esc(a.bed)}</p><small>${esc(a.gesture)} · Confidence ${esc(a.confidence)}% · ${ago(a.timestamp)}</small><div class="alert-message">${esc(a.message)}</div>${opts.history ? `<div class="timeline-line">${steps.map(s => `<div class="tl-step">${esc(s)}</div>`).join('')}</div>` : ''}</div><div class="alert-actions">${act.join('')}</div></div>`;
}
let rendering = false;
async function render() {
  if (rendering) return; rendering = true;
  try {
    await load();
    const p = document.getElementById('page');
    const fn = { dashboard, monitor, patients: patientsPage, rooms: roomsPage, appointments: appointmentsPage, alerts: () => alertsPage(false), history: () => alertsPage(true), reports: reportsPage, settings: settingsPage, admin: adminPage }[state.page];
    p.innerHTML = fn();
    document.getElementById('pageTitle').textContent = PAGES[state.page][1]; document.getElementById('pageEyebrow').textContent = PAGES[state.page][0];
    await bindPage();
  } catch (e) { if (e.message !== 'Session expired') document.getElementById('page').innerHTML = `<div class="panel"><div class="empty"><b>Could not load data</b>${esc(e.message)}<br><button class="primary-btn compact" style="margin-top:10px" onclick="render()">Retry</button></div></div>`; }
  finally { rendering = false; }
}

function dashboard() {
  const active = state.alerts.filter(a => ['pending', 'acknowledged'].includes(a.status)).slice(0, 4);
  return `${shell('Hospital overview', 'REAL-TIME COMMAND CENTER', '<button class="primary-btn compact" onclick="nav(\'monitor\')">Open Live Monitor →</button>', 'Patient signal → AI validation → nurse alert → acknowledge → resolve, all in one place.', ['🤟 Gesture', '👁 Eye Blink', '🙂 Face', '↕ Head', '🚨 Emergency'])}
<div class="stats">${stat('Patients', state.stats.patients, '♙', 'purple')}${stat('Pending response', state.stats.pending, '⏳', 'amber')}${stat('Acknowledged', state.stats.acknowledged, '👀', 'teal')}${stat('Resolved', state.stats.resolved, '✓', 'green')}${stat('Emergency alerts', state.stats.emergency, '🚨', 'red')}</div>
<div class="grid-2"><section class="panel"><div class="panel-head"><div><b>Patient → AI → Nurse</b><span>End-to-end communication workflow</span></div><span class="badge good">SYSTEM READY</span></div><div class="workflow"><span>Patient signal</span><i>→</i><span>AI detection</span><i>→</i><span>Validation</span><i>→</i><span>Nurse alert</span><i>→</i><span>Acknowledge</span><i>→</i><span>Resolve</span></div><div class="mini-callout"><b>Safety principle</b><span>Unknown movements never create alerts. Emergency signals follow a separate high-priority path.</span></div></section>
<section class="panel"><div class="panel-head"><div><b>Ward snapshot</b><span>Rooms 101–106 · 2 beds each</span></div><button class="link-btn" onclick="nav('rooms')">View rooms</button></div><div class="room-mini">${state.rooms.slice(0, 6).map(r => `<div class="room-chip ${r.occupied ? (r.patient.priority === 'Priority' ? 'attention' : 'occupied') : ''}"><b>${r.room}/${r.bed}</b><span>${r.occupied ? esc(r.patient.name) : 'Available'}</span></div>`).join('')}</div></section></div>
<section class="panel"><div class="panel-head"><div><b>Priority feed</b><span>Alerts waiting for a response</span></div><button class="link-btn" onclick="nav('alerts')">All alerts</button></div>${active.length ? active.map(a => alertCard(a)).join('') : '<div class="empty"><b>All clear</b>No active alerts. All monitored patients are stable.</div>'}</section>`;
}

function monitor() {
  const opts = state.patients.map(p => `<option value="${esc(p.id)}">${esc(p.name)} · ${esc(p.room)}/${esc(p.bed)}</option>`).join('');
  const sims = [['Pointing Finger', '👉', 'hand'], ['OK Sign', '👌', 'hand'], ['Thumbs Up', '👍', 'hand'], ['Thumbs Down', '👎', 'hand'], ['2 Fingers', '✌️', 'hand'], ['3 Fingers', '🤟', 'hand'], ['4 Fingers', '🖖', 'hand'], ['5 Fingers', '✋', 'hand'], ['Smile', '😊', 'face'], ['Frown / Distress', '😟', 'face'], ['Open Mouth', '😮', 'face'], ['Single Blink', '👁️', 'eye'], ['Double Blink', '👁️', 'eye'], ['Triple Blink', '🚨', 'eye'], ['Head Left', '⬅️', 'head'], ['Head Right', '➡️', 'head'], ['Head Down', '⬇️', 'head'], ['Head Shake', '↔️', 'head'], ['Difficulty Breathing', '🫁', 'emergency'], ['Unknown Gesture', '🛡️', 'unknown']];
  return `${shell('Live AI Monitor', 'CAMERA + VALIDATION + PATIENT MAPPING', '<a class="ghost-btn" href="/camera" target="_blank">Open full screen ↗</a>', 'Pick Hand, Face, Eye or Head, start the camera and the patient’s signals become validated alerts.')}
<section class="panel" style="padding:8px"><iframe id="camFrame" src="/camera?embed=1" allow="camera; microphone" title="Live camera" style="width:100%;height:1150px;border:0;border-radius:16px;background:transparent"></iframe></section>
<section class="panel"><div class="panel-head"><div><b>Verification & Simulation Suite</b><span>Use when no camera is available. Simulated signals go through the same validation and alert workflow.</span></div><span class="badge warning">SIMULATION</span></div>
<div class="toolbar"><label class="muted">Patient <select id="simPatient">${opts}</select></label></div>
<div class="sim-grid">${sims.map(([g, ic, m]) => `<button onclick="simulate('${g}','${m}')">${ic}<span>${g}</span></button>`).join('')}</div>
<div id="validationResult" class="validation-result">Select a scenario. Valid signals create a tracked alert; Unknown Gesture is rejected and creates no alert.</div></section>`;
}
window.addEventListener('message', e => { if (e.origin === location.origin && e.data && e.data.type === 'camera-height') { const f = document.getElementById('camFrame'); if (f) f.style.height = Math.max(700, e.data.h + 10) + 'px'; } });

function patientsPage() {
  return `${shell('Patient Admission & Management', 'PATIENT → ROOM → BED → NURSE', state.user.role === 'admin' ? '<button class="primary-btn compact" onclick="addPatient()">+ Admit Patient</button>' : '', 'Admit patients, assign doctor, nurse and bed. Duplicate IDs and beds are blocked.', [`${state.patients.length} admitted`])}
<section class="panel"><div class="toolbar"><input class="search" id="patientSearch" placeholder="Search patient, ID, room…"></div><div id="patientList" class="patient-list">${state.patients.length ? state.patients.map(patientCard).join('') : '<div class="empty"><b>No patients yet</b>Admit the first patient to begin monitoring.</div>'}</div></section>`;
}
function roomsPage() {
  const by = {}; state.rooms.forEach(r => (by[r.room] ??= []).push(r));
  return `${shell('Ward Rooms & Bed Assignment', 'OCCUPANCY COMMAND MAP', '<button class="ghost-btn" onclick="nav(\'patients\')">Manage patients</button>', 'Tap an available bed to admit a patient straight into it.', [`${state.rooms.filter(r => r.occupied).length}/${state.rooms.length} beds occupied`])}
<section class="panel"><div class="room-grid">${Object.entries(by).map(([room, beds]) => `<div class="room-card"><div class="room-title"><b>Room ${room}</b><span>${beds.filter(x => x.occupied).length}/2 occupied</span></div>${beds.map(r => `<div class="bed-card ${r.occupied ? 'occupied' : ''} ${r.patient?.priority === 'Priority' ? 'attention' : ''}"><div class="bed-icon">${r.occupied ? '🛏️' : '＋'}</div><div><b>Bed ${r.bed}</b><span>${r.occupied ? esc(r.patient.name) : 'Available'}</span>${r.occupied ? `<small>${esc(r.patient.condition)}</small>` : ''}</div>${r.occupied ? `<button onclick="viewPatient('${esc(r.patient.id)}')">View</button>` : (state.user.role === 'admin' ? `<button class="assign" onclick="addPatient('${r.room}','${r.bed}')">Admit here</button>` : '<span class="available">Available</span>')}</div>`).join('')}</div>`).join('')}</div></section>`;
}
function appointmentsPage() {
  const list = state.appointments.filter(a => state.aptFilter === 'all' || String(a.status).toLowerCase() === state.aptFilter).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const tab = (k, l) => `<button class="tab ${state.aptFilter === k ? 'active' : ''}" onclick="state.aptFilter='${k}';render()">${l}</button>`;
  return `${shell('Appointments & Care Schedule', 'ADMISSION + FOLLOW-UP WORKFLOW', state.user.role === 'admin' ? '<button class="primary-btn compact" onclick="addAppointment()">+ Add Appointment</button>' : '', 'Doctor rounds, reviews and follow-ups linked to each patient’s bed.', [`${state.appointments.length} total`])}
<section class="panel"><div class="tabs">${tab('all', 'All')}${tab('scheduled', 'Scheduled')}${tab('completed', 'Completed')}${tab('cancelled', 'Cancelled')}</div><div class="table-wrap"><table><thead><tr><th>Patient</th><th>Room / Bed</th><th>Doctor</th><th>Specialty</th><th>Date</th><th>Reason</th><th>Status</th><th></th></tr></thead><tbody>${list.map(a => `<tr><td><b>${esc(a.patientName)}</b><small>${esc(a.patientId)}</small></td><td>${esc(a.room)} / ${esc(a.bed)}</td><td>${esc(a.doctor)}</td><td>${esc(a.specialty)}</td><td>${esc(a.date)}<small>${esc(a.time)}</small></td><td>${esc(a.reason)}</td><td><span class="state ${esc(String(a.status).toLowerCase())}">${esc(a.status)}</span></td><td style="white-space:nowrap">${a.status === 'Scheduled' ? `<button class="act-btn good" onclick="aptStatus('${a.id}','Completed')">Complete</button> <button class="act-btn bad" onclick="aptStatus('${a.id}','Cancelled')">Cancel</button> ` : ''}${state.user.role === 'admin' ? `<button class="act-btn" onclick="aptDelete('${a.id}')">Delete</button>` : ''}</td></tr>`).join('')}</tbody></table>${list.length ? '' : '<div class="empty"><b>No appointments</b>Nothing in this view.</div>'}</div></section>`;
}
async function aptStatus(id, status) { try { await api('/api/appointments/' + id, { method: 'PATCH', headers: headers(), body: JSON.stringify({ status }) }); toast('Appointment ' + status.toLowerCase(), 'success'); render(); } catch (x) { toast(x.message, 'error'); } }
async function aptDelete(id) { if (!confirm('Delete this appointment?')) return; try { await api('/api/appointments/' + id, { method: 'DELETE' }); toast('Appointment deleted', 'success'); render(); } catch (x) { toast(x.message, 'error'); } }

function filteredAlerts(history) {
  const base = state.alerts.filter(a => history ? ['resolved', 'archived'].includes(a.status) : ['pending', 'acknowledged'].includes(a.status));
  const q = state.alertQuery.toLowerCase();
  return base.filter(a => (state.alertFilter === 'all' || a.priority === state.alertFilter) && (!q || JSON.stringify([a.patient, a.room, a.bed, a.requirement, a.gesture, a.id]).toLowerCase().includes(q)));
}
function alertsPage(history) {
  const list = filteredAlerts(history);
  const count = p => state.alerts.filter(a => (history ? ['resolved', 'archived'].includes(a.status) : ['pending', 'acknowledged'].includes(a.status)) && (p === 'all' || a.priority === p)).length;
  const tab = (k, l) => `<button class="tab ${state.alertFilter === k ? 'active' : ''}" onclick="state.alertFilter='${k}';render()">${l}<b>${count(k)}</b></button>`;
  const actions = `<button class="ghost-btn" onclick="render()">↻ Refresh</button>${history ? '<button class="ghost-btn" onclick="exportAlertHistory()">⬇ Export CSV</button>' : ''}`;
  return `${shell(history ? 'Alert History' : 'Active Patient Alerts', history ? 'AUDITABLE COMMUNICATION RECORD' : 'RECEIVE → ACKNOWLEDGE → RESOLVE', actions, history ? 'Every resolved alert with its full response timeline.' : 'Live alerts from camera, simulation and nurse phones. Emergency items are highlighted.', [`${list.length} shown`, `${state.stats.emergency} emergency total`], history ? '⌁' : '⚠')}
<section class="panel"><div class="tabs">${tab('all', 'All')}${tab('emergency', '🚨 Emergency')}${tab('attention', 'Attention')}${tab('normal', 'Normal')}</div><div class="toolbar"><input class="search" id="alertSearch" placeholder="Search patient, room, signal…" value="${esc(state.alertQuery)}"></div>${list.length ? list.map(a => alertCard(a, { history })).join('') : `<div class="empty"><b>${history ? 'No history yet' : 'No active alerts'}</b>${history ? 'Resolved alerts will appear here.' : 'Everything is under control.'}</div>`}</section>`;
}
function exportAlertHistory() { const rows = filteredAlerts(true).map(a => [a.timestamp, a.patientId, a.patient, a.room, a.bed, a.gesture, a.requirement, a.priority, a.status, a.confidence, a.acknowledgedAt || '', a.resolvedAt || '']); const csv = [['Timestamp', 'Patient ID', 'Patient', 'Room', 'Bed', 'Gesture', 'Requirement', 'Priority', 'Status', 'Confidence', 'Acknowledged', 'Resolved'], ...rows].map(r => r.map(v => '"' + String(v ?? '').replaceAll('"', '""') + '"').join(',')).join('\n'); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'patient-alert-history.csv'; a.click(); URL.revokeObjectURL(a.href); }

function reportsPage() {
  const avg = state.alerts.filter(a => a.acknowledgedAt && a.timestamp).map(a => (new Date(a.acknowledgedAt) - new Date(a.timestamp)) / 60000);
  const avgMin = avg.length ? (avg.reduce((x, y) => x + y, 0) / avg.length).toFixed(1) : '0.0';
  const m = state.metrics || {}, h = state.health || {};
  return `${shell('Reports & Analytics', 'DETECTION QUALITY + RESPONSE + SYSTEM HEALTH', state.user.role === 'admin' ? '<button class="ghost-btn" onclick="downloadBackup()">⬇ Backup JSON</button>' : '', 'Detection quality, response times and system health.')}
<div class="stats">${stat('Valid detections', (m.validPercentage || 0) + '%', '✓', 'green')}${stat('Invalid / rejected', (m.invalidPercentage || 0) + '%', '🛡️', 'amber')}${stat('False-prediction rate', (m.falsePredictionPercentage || 0) + '%', '⌁', 'red')}${stat('Avg acknowledge', avgMin + ' min', '⏱', 'purple')}${stat('Reports', state.reports.length, '▤', 'teal')}</div>
<div class="grid-2"><section class="panel"><div class="panel-head"><div><b>Detection quality</b><span>Validation events from live and simulation modes</span></div></div><div class="bars"><div><span>Valid</span><i><b style="width:${m.validPercentage || 0}%"></b></i><strong>${m.validPercentage || 0}%</strong></div><div><span>Rejected</span><i><b style="width:${m.invalidPercentage || 0}%"></b></i><strong>${m.invalidPercentage || 0}%</strong></div><div><span>Est. false</span><i><b style="width:${m.falsePredictionPercentage || 0}%"></b></i><strong>${m.falsePredictionPercentage || 0}%</strong></div></div><p class="small muted">False-prediction rate is an estimated rejection metric; clinical ground truth is needed for true accuracy.</p></section>
<section class="panel"><div class="panel-head"><div><b>System health</b><span>Command-center services</span></div><span class="badge good">${esc(h.server || 'RUNNING')}</span></div><div class="health"><div>📷 Camera engine <b>${esc(h.camera || 'READY')}</b></div><div>🧠 AI validation <b>${esc(h.aiEngine || 'ACTIVE')}</b></div><div>📱 Nurse sync <b>${esc(h.mobileSync || 'READY')}</b></div><div>🗃️ Data store <b>${esc(h.dataStore || 'ONLINE')}</b></div><div>🔐 Audit logging <b>ACTIVE</b></div></div></section></div>
<section class="panel"><div class="panel-head"><div><b>Communication analytics</b><span>Events per modality</span></div></div><div class="value-grid">${['hand', 'face', 'eye', 'head', 'emergency', 'unknown'].map(k => `<div><b>${k[0].toUpperCase() + k.slice(1)}</b><span>${m.byModality?.[k] || 0} events</span></div>`).join('')}</div></section>
<section class="panel"><div class="panel-head"><div><b>Clinical reports</b><span>Uploaded files are linked to a patient.</span></div>${state.user.role === 'admin' ? '<button class="primary-btn compact" onclick="addReport()">+ Add Report</button>' : ''}</div><div class="report-list">${state.reports.length ? state.reports.map(r => `<div class="report-row"><b>${esc(r.title)}</b><span>${esc(r.patientName)} · ${esc(r.type)} · ${esc(r.date)}${r.summary ? ' · ' + esc(r.summary) : ''}</span>${r.fileUrl ? `<a href="${esc(r.fileUrl)}" target="_blank">Open file</a>` : ''}${state.user.role === 'admin' ? `<button class="act-btn bad" onclick="delReport('${esc(r.id)}')">Delete</button>` : ''}</div>`).join('') : '<div class="empty"><b>No reports yet</b>Add the first clinical report.</div>'}</div></section>`;
}
async function delReport(id) { if (!confirm('Delete this report?')) return; try { await api('/api/reports/' + id, { method: 'DELETE' }); toast('Report deleted', 'success'); render(); } catch (x) { toast(x.message, 'error'); } }
function settingsPage(){const gs=state.settings.gestures||[];return `${shell('Detection & Communication Settings','SAFETY THRESHOLDS + MULTIMODAL COMMUNICATION','<span class="badge good">Protected</span>')}<section class="panel"><div class="panel-head"><div><b>Supported communication modes</b><span>Each mode is validated separately and feeds the same patient → nurse workflow.</span></div></div><div class="value-grid"><div><b>🤟 Hand</b><span>Pointing Finger, OK Sign, thumbs, 2–5 finger mappings</span></div><div><b>🙂 Face</b><span>Face communication hooks and controlled recognition path</span></div><div><b>👁 Eye Blink</b><span>Deliberate blink patterns with cooldown</span></div><div><b>↕ Head</b><span>Held movement and repeated movement validation</span></div><div><b>🫁 Emergency</b><span>Separate high-priority breathing/emergency path</span></div><div><b>🛡️ Invalid</b><span>Unknown movement is rejected and does not create an alert</span></div></div></section><section class="panel form-panel"><form id="settingsForm"><div class="form-grid"><label>Confirmed confidence %<input name="confirmedConfidenceThreshold" type="number" min="50" max="99" value="${state.settings.confirmedConfidenceThreshold||85}"></label><label>Emergency confidence %<input name="emergencyConfidenceThreshold" type="number" min="50" max="99" value="${state.settings.emergencyConfidenceThreshold||88}"></label><label>Same-gesture re-arm seconds<input name="rearmSeconds" type="number" min="1" max="60" value="${state.settings.rearmSeconds||5}"></label><label>Session timeout minutes<input name="sessionMinutes" type="number" min="5" max="240" value="${state.settings.sessionMinutes||30}"></label><label>Default voice language<select name="defaultLanguage"><option value="en" ${state.settings.defaultLanguage==='en'?'selected':''}>English</option><option value="kn" ${state.settings.defaultLanguage==='kn'?'selected':''}>ಕನ್ನಡ</option><option value="hi" ${state.settings.defaultLanguage==='hi'?'selected':''}>हिन्दी</option></select></label><label>Voice alerts<select name="voiceEnabled"><option value="true" ${state.settings.voiceEnabled?'selected':''}>Enabled</option><option value="false" ${!state.settings.voiceEnabled?'selected':''}>Disabled</option></select></label></div><div class="safety-box"><b>Safety controls</b><span>Emergency alerts remain protected. Unknown movements are rejected. Destructive actions require confirmation and are audit logged.</span></div><button class="primary-btn" type="submit">Save settings</button></form></section><section class="panel"><div class="panel-head"><div><b>Gesture & meaning registry</b><span>Admin can add, edit or remove mappings. Keep one unambiguous meaning per supported signal.</span></div><button class="ghost-btn" type="button" onclick="addGestureRow()">+ Add mapping</button></div><div id="gestureRows">${gs.map((g,i)=>`<div class="gesture-row" data-index="${i}"><input class="g-name" value="${esc(g.name)}"><input class="g-meaning" value="${esc(g.meaning)}"><select class="g-mode"><option ${g.mode==='Hand'?'selected':''}>Hand</option><option ${g.mode==='Eye'?'selected':''}>Eye</option><option ${g.mode==='Face'?'selected':''}>Face</option><option ${g.mode==='Head'?'selected':''}>Head</option><option ${g.mode==='Emergency'?'selected':''}>Emergency</option></select><button type="button" class="card-actions-btn danger" onclick="this.parentElement.remove()">Remove</button></div>`).join('')}</div><button class="primary-btn compact" type="button" onclick="saveGestureRegistry()">Save gesture registry</button></section><section class="panel form-panel"><div class="panel-head"><div><b>Change password</b><span>Stored using scrypt hashing; never displayed in the interface.</span></div></div><form id="passwordForm"><div class="form-grid"><label>Current password<input name="currentPassword" type="password" required></label><label>New password<input name="newPassword" type="password" minlength="8" required></label></div><button class="primary-btn" type="submit">Update password</button></form></section>`}
function addGestureRow(){const wrap=document.getElementById('gestureRows');const d=document.createElement('div');d.className='gesture-row';d.innerHTML='<input class="g-name" placeholder="Gesture name"><input class="g-meaning" placeholder="Patient meaning"><select class="g-mode"><option>Hand</option><option>Eye</option><option>Face</option><option>Head</option><option>Emergency</option></select><button type="button" class="card-actions-btn danger" onclick="this.parentElement.remove()">Remove</button>';wrap.appendChild(d)}
async function saveGestureRegistry(){const gestures=[...document.querySelectorAll('.gesture-row')].map(r=>({name:r.querySelector('.g-name').value.trim(),meaning:r.querySelector('.g-meaning').value.trim(),mode:r.querySelector('.g-mode').value})).filter(x=>x.name&&x.meaning);try{await api('/api/settings',{method:'PUT',headers:{...headers()},body:JSON.stringify({gestures})});toast('Gesture registry saved','success');state.settings.gestures=gestures}catch(x){toast(x.message,'error')}}
function adminPage(){return `${shell('Admin, Security & Audit','ADMIN-ONLY ACCESS + TRACEABILITY','<span class="badge good">ADMIN ONLY</span>')}
<section class="panel"><div class="panel-head"><div><b>User accounts</b><span>Admin accounts have full access. Family accounts can only view their linked patient.</span></div><div style="display:flex;gap:8px"><button class="primary-btn compact" onclick="addUser('admin')">+ Add Admin</button><button class="ghost-btn" onclick="addUser('family')">+ Add Family Account</button></div></div>
<div id="userList" class="report-list">Loading…</div></section>
<section class="panel"><div class="panel-head"><div><b>Family portal link</b><span>Share this with families so they can track their patient on any phone.</span></div></div>
<div class="mini-callout"><b>📱 Family portal address</b><span id="familyLink" style="word-break:break-all;font-weight:700;color:#7c3aed">Loading…</span><br><small style="color:#6a587d;margin-top:4px;display:block">Family members open this on their phone and sign in with the account you create above.</small></div></section>
<section class="panel"><div class="panel-head"><div><b>Audit log</b><span>Security-sensitive actions and communication workflow events.</span></div></div><div id="auditList" class="audit-list">Loading…</div></section>`}
async function addUser(role='admin'){
  if(role==='family'&&(!state.patients||!state.patients.length)){
    try{state.patients=await api('/api/patients');}catch(x){toast('Could not load patients','error');return;}
  }
  const patientOpts=(state.patients||[]).map(p=>`<option value="${esc(p.id)}">${esc(p.name)} — Room ${esc(p.room)} Bed ${esc(p.bed)}</option>`).join('');
  const isFamily=role==='family';
  modal(`<form id="userForm"><div class="modal-title">${isFamily?'Create Family Account':'Create Admin Account'}</div>
  ${isFamily?`<div class="mini-callout" style="margin-bottom:12px"><b>📱 Family accounts</b><span>Family members sign in at <b>/family</b> and can only see their linked patient's signals and alerts.</span></div>`:''}
  <div class="form-grid">
    <label>Username<input name="username" required placeholder="${isFamily?'e.g. ravi_family':'e.g. nurse1'}"></label>
    <label>Display name<input name="name" required placeholder="${isFamily?'e.g. Ravi Family':''}"></label>
    <input type="hidden" name="role" value="${role}">
    <label>Password (min 8 chars)<input name="password" type="password" minlength="8" required></label>
      ${isFamily?`<label style="grid-column:1/-1">Link to patient<select name="linkedPatientId"><option value="">— Select patient —</option>${patientOpts}</select></label>`:''}
  </div>
  <div class="form-actions"><button type="button" class="ghost-btn" onclick="closeModal()">Cancel</button><button type="button" class="primary-btn" id="createUserBtn">Create account</button></div>
  </form>`);
  document.getElementById('createUserBtn').onclick=async()=>{
    const form=document.getElementById('userForm');
    const b=Object.fromEntries(new FormData(form).entries());
    if(!b.username||!b.username.trim()){toast('Enter a username','warn');return;}
    if(!b.password||b.password.length<8){toast('Password must be at least 8 characters','warn');return;}
    if(isFamily&&!b.linkedPatientId){toast('Please select a patient to link','warn');return;}
    try{
      await api('/api/users',{method:'POST',headers:{...headers()},body:JSON.stringify(b)});
      closeModal();
      toast(isFamily?'Family account created — share /family with them':'Admin account created','success');
      render();
    }catch(x){toast(x.message,'error');}
  };
                                                                  }
async function removeUser(username){if(!confirm('Remove this account?'))return;try{await api('/api/users/'+encodeURIComponent(username),{method:'DELETE'});toast('User removed','success');render()}catch(x){toast(x.message,'error')}}
function patientForm(p={}){return `<form id="patientForm"><div class="modal-title">${p.id?'Edit Patient':'Admit New Patient'}</div><div class="form-grid"><label>Patient ID<input name="id" value="${esc(p.id||'')}" placeholder="Auto-generated if blank" ${p.id?'readonly':''}></label><label>Full name<input name="name" required value="${esc(p.name||'')}"></label><label>Age<input name="age" type="number" value="${esc(p.age||'')}"></label><label>Gender<select name="gender"><option>Male</option><option ${p.gender==='Female'?'selected':''}>Female</option><option ${p.gender==='Other'?'selected':''}>Other</option></select></label><label>Room<input name="room" required value="${esc(p.room||'101')}"></label><label>Bed<input name="bed" required value="${esc(p.bed||'1')}"></label><label>Condition<input name="condition" value="${esc(p.condition||'')}"></label><label>Status<select name="status"><option ${p.status==='Normal'?'selected':''}>Normal</option><option ${p.status==='Monitoring'?'selected':''}>Monitoring</option><option ${p.status==='Attention'?'selected':''}>Attention</option></select></label><label>Assigned doctor<input name="doctor" value="${esc(p.doctor||'')}"></label><label>Assigned nurse<input name="nurse" value="${esc(p.nurse||'')}"></label><label>Emergency contact<input name="emergencyContact" value="${esc(p.emergencyContact||'')}"></label><label>Priority<select name="priority"><option ${p.priority==='Normal'?'selected':''}>Normal</option><option ${p.priority==='Priority'?'selected':''}>Priority</option><option ${p.priority==='Emergency'?'selected':''}>Emergency</option></select></label><label class="wide">Communication preferences<input name="communication" value="${esc((p.communication||[]).join(', '))}" placeholder="Pointing Finger, OK Sign, Eye Blink"></label><label class="wide">Notes<textarea name="notes">${esc(p.notes||'')}</textarea></label></div><div class="form-actions"><button type="button" class="ghost-btn" onclick="closeModal()">Cancel</button><button class="primary-btn" type="submit">Save patient</button></div></form>`}
function editPatient(id){const p=state.patients.find(x=>x.id===id);modal(patientForm(p));document.getElementById('patientForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);const b=Object.fromEntries(f.entries());b.communication=b.communication.split(',').map(x=>x.trim()).filter(Boolean);try{await api('/api/patients/'+id,{method:'PUT',headers:{...headers()},body:JSON.stringify(b)});closeModal();toast('Patient details updated','success');render();}catch(x){toast(x.message,'error')}}}
async function deletePatient(id){if(!confirm('Remove this patient? A security audit entry will be created.'))return;try{await api('/api/patients/'+id,{method:'DELETE'});toast('Patient removed','success');render()}catch(x){toast(x.message,'error')}}
function addAppointment(){modal(`<form id="aptForm"><div class="modal-title">Add Appointment / Care Schedule</div><div class="form-grid"><label>Patient<select name="patientId" id="aptPatient">${state.patients.map(p=>`<option value="${p.id}">${esc(p.name)} · ${p.room}/${p.bed}</option>`).join('')}</select></label><label>Doctor<input name="doctor" required></label><label>Specialty<input name="specialty" required></label><label>Date<input name="date" type="date" required value="${new Date().toISOString().slice(0,10)}"></label><label>Time<input name="time" type="time" required></label><label>Priority<select name="priority"><option>Routine</option><option>Priority</option><option>Urgent</option></select></label><label class="wide">Reason<textarea name="reason" required></textarea></label></div><div class="form-actions"><button type="button" class="ghost-btn" onclick="closeModal()">Cancel</button><button class="primary-btn">Save appointment</button></div></form>`);document.getElementById('aptForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),b=Object.fromEntries(f.entries()),p=state.patients.find(x=>x.id===b.patientId);Object.assign(b,{patientName:p.name,room:p.room,bed:p.bed});try{await api('/api/appointments',{method:'POST',headers:{...headers()},body:JSON.stringify(b)});closeModal();toast('Appointment added','success');render()}catch(x){toast(x.message,'error')}}}
async function deleteAlert(id){if(!confirm('Delete this alert? A backup is recommended first. Emergency alerts cannot be deleted.'))return;try{await api('/api/alerts/'+id,{method:'DELETE'});toast('Alert deleted and audited','success');render()}catch(x){toast(x.message,'error')}}
async function saveSettings(e){e.preventDefault();const b=Object.fromEntries(new FormData(e.target).entries());b.voiceEnabled=b.voiceEnabled==='true';try{await api('/api/settings',{method:'PUT',headers:{...headers()},body:JSON.stringify(b)});toast('Settings saved','success')}catch(x){toast(x.message,'error')}}
async function changePassword(e){e.preventDefault();const b=Object.fromEntries(new FormData(e.target).entries());try{await api('/api/change-password',{method:'POST',headers:{...headers()},body:JSON.stringify(b)});e.target.reset();toast('Password changed','success')}catch(x){toast(x.message,'error')}}
async function downloadBackup(){try{const r=await fetch('/api/backup',{headers:{Authorization:'Bearer '+localStorage.getItem('patientToken')}});if(!r.ok)throw new Error('Backup request failed');const blob=await r.blob();const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='patient-system-backup.json';a.click();URL.revokeObjectURL(a.href);toast('Backup downloaded','success')}catch(x){toast(x.message,'error')}}
function addReport(){modal(`<form id="reportForm" enctype="multipart/form-data"><div class="modal-title">Add Clinical Report</div><div class="form-grid"><label>Patient<select name="patientId">${state.patients.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('')}</select></label><label>Title<input name="title" required></label><label>Type<input name="type" value="General"></label><label>Doctor<input name="doctor"></label><label class="wide">Summary<textarea name="summary"></textarea></label><label class="wide">Optional file<input name="reportFile" type="file"></label></div><div class="form-actions"><button type="button" class="ghost-btn" onclick="closeModal()">Cancel</button><button class="primary-btn">Save report</button></div></form>`);document.getElementById('reportForm').onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target),p=state.patients.find(x=>x.id===f.get('patientId'));f.append('patientName',p.name);f.append('room',p.room);f.append('bed',p.bed);try{await api('/api/reports',{method:'POST',body:f});closeModal();toast('Report saved','success');render()}catch(x){toast(x.message,'error')}}}
function addPatient(room, bed) {
  modal(patientForm({ room: room || '101', bed: bed || '1' }));
  document.getElementById('patientForm').onsubmit = async e => {
    e.preventDefault(); const b = Object.fromEntries(new FormData(e.target).entries());
    b.communication = b.communication.split(',').map(x => x.trim()).filter(Boolean);
    try { await api('/api/patients', { method: 'POST', headers: headers(), body: JSON.stringify(b) }); closeModal(); toast('Patient admitted and bed assigned', 'success'); render(); } catch (x) { toast(x.message, 'error'); }
  };
}
function viewPatient(id) {
  const p = state.patients.find(x => x.id === id); if (!p) return;
  const alerts = state.alerts.filter(a => a.patientId === id);
  modal(`<div class="modal-title">${esc(p.name)}</div><div class="detail-hero"><b>Room ${esc(p.room)} · Bed ${esc(p.bed)}</b><span>${esc(p.condition)}</span></div><div class="detail-grid"><span>Patient ID<strong>${esc(p.id)}</strong></span><span>Doctor<strong>${esc(p.doctor)}</strong></span><span>Nurse<strong>${esc(p.nurse)}</strong></span><span>Priority<strong>${esc(p.priority)}</strong></span><span>Communication<strong>${esc((p.communication || []).join(', '))}</strong></span><span>Emergency contact<strong>${esc(p.emergencyContact)}</strong></span></div><h4>Communication timeline</h4>${alerts.slice(0, 8).map(a => `<div class="timeline"><b>${esc(a.requirement)}</b><span>${new Date(a.timestamp).toLocaleString()} · ${esc(a.confidence)}% · ${esc(a.status)}</span></div>`).join('') || '<div class="empty">No alerts recorded for this patient.</div>'}`);
}
async function alertStatus(id, status) {
  if (status === 'archived' && !confirm('Archive this alert? It stays in the audit history.')) return;
  try { await api('/api/alerts/' + id, { method: 'PATCH', headers: headers(), body: JSON.stringify({ status }) }); toast('Alert ' + status, 'success'); render(); } catch (x) { toast(x.message, 'error'); }
}
async function simulate(gesture, modality) {
  const sel = document.getElementById('simPatient'); const pid = sel ? sel.value : (state.patients[0] || {}).id;
  if (!pid) return toast('Admit a patient first', 'warn');
  try {
    const d = await api('/api/simulate', { method: 'POST', headers: headers(), body: JSON.stringify({ gesture, modality, patientId: pid, mode: 'single' }) });
    const box = document.getElementById('validationResult');
    box.className = 'validation-result ' + (d.validation.accepted ? 'accepted' : 'rejected');
    box.innerHTML = `<b>${d.validation.accepted ? '✓ VALIDATED' : '🛡️ REJECTED'}</b><span>${esc(d.validation.reason)}</span>${d.alert ? `<small>${esc(d.alert.requirement)} · ${esc(d.alert.confidence)}% · Room ${esc(d.alert.room)} Bed ${esc(d.alert.bed)}</small>` : ''}`;
    toast(d.validation.accepted ? 'Alert generated and synced' : 'Unknown movement rejected', d.validation.accepted ? 'success' : 'warn');
    const s = await api('/api/stats'); state.stats = s; document.getElementById('alertBadge').textContent = s.pending + s.acknowledged;
  } catch (x) { toast(x.message, 'error'); }
}
async function bindPage() {
  if (state.page === 'patients') { const s = document.getElementById('patientSearch'); if (s) s.oninput = () => { const q = s.value.toLowerCase(); document.getElementById('patientList').innerHTML = state.patients.filter(p => JSON.stringify(p).toLowerCase().includes(q)).map(patientCard).join('') || '<div class="empty"><b>No match</b>No patients found.</div>'; }; }
  if (state.page === 'alerts' || state.page === 'history') { const s = document.getElementById('alertSearch'); if (s) s.oninput = () => { state.alertQuery = s.value; const pos = s.selectionStart; render().then(() => { const n = document.getElementById('alertSearch'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } }); }; }
  if (state.page === 'settings') { document.querySelector('#settingsForm').onsubmit = saveSettings; document.querySelector('#passwordForm').onsubmit = changePassword; }
  if (state.page === 'admin') {
    const [logs, users, netInfo] = await Promise.all([api('/api/audit'), api('/api/users'), api('/api/network-info').catch(()=>({mobileUrl:''}))]);
    const fl=document.getElementById('familyLink');
    if(fl){
      const base=(netInfo.mobileUrl||window.location.origin).replace('/mobile','');
      fl.textContent=base.replace('/mobile','')+'/family';
    }
    document.getElementById('auditList').innerHTML = logs.slice(0, 80).map(l => `<div><span>${new Date(l.timestamp).toLocaleString()}</span><b>${esc(l.action)}</b><span>${esc(l.user)}</span><p>${esc(l.details)}</p></div>`).join('') || '<div class="empty">No audit entries yet.</div>';
    const pts=state.patients||[];
    document.getElementById('userList').innerHTML = users.map(u => {
      const linkedPt=u.linkedPatientId?pts.find(p=>p.id===u.linkedPatientId):null;
      const roleLabel=u.role==='family'?'👨‍👩‍👦 Family':'🔐 Admin';
      const linkedLabel=linkedPt?` → ${esc(linkedPt.name)} (Room ${esc(linkedPt.room)})`:u.linkedPatientId?' → Patient ID: '+esc(u.linkedPatientId):'';
      return `<div class="report-row"><b>${esc(u.name)}</b><span>${esc(u.username)} · <span class="badge ${u.role==='family'?'warning':'good'}">${roleLabel}</span>${linkedLabel}</span>${u.username !== state.user.username ? `<button class="card-actions-btn danger" onclick="removeUser('${esc(u.username)}')">Remove</button>` : ''}</div>`;
    }).join('');
  }
}
// live sync: refresh only on real alert/patient events, debounced
let _t; const es = new EventSource('/api/events?token=' + encodeURIComponent(localStorage.getItem('patientToken')));
es.onopen = () => document.getElementById('connectionText').textContent = 'System online';
es.onmessage = e => { try { const d = JSON.parse(e.data); if (['alert', 'patients'].includes(d.type)) { clearTimeout(_t); _t = setTimeout(() => { if (['dashboard', 'alerts', 'history'].includes(state.page) && document.getElementById('modal').classList.contains('hidden')) render(); else load().catch(() => {}); }, 600); } } catch {} };
es.onerror = () => document.getElementById('connectionText').textContent = 'Reconnecting…';
window.addEventListener('hashchange', () => { const p = location.hash.slice(1); if (p !== state.page) nav(p); });
state.page = PAGES[location.hash.slice(1)] ? location.hash.slice(1) : 'dashboard';
document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('active', b.dataset.page === state.page));
render();
