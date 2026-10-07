const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const ALERTS_FILE = path.join(DATA_DIR, 'alerts.json');
const PATIENTS_FILE = path.join(DATA_DIR, 'patients.json');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');
const APPOINTMENTS_FILE = path.join(DATA_DIR, 'appointments.json');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Configure Multer for report uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
    cb(null, safeName);
  }
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

// ─── Network Info (Wi-Fi Local IP Detection) ────────────────────────────────
function getLocalIpAddress() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Find non-internal IPv4
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIpAddress();

// ─── Initial Default Data ───────────────────────────────────────────────────
const DEFAULT_PATIENTS = [
  { id: 'P1', name: 'Ramesh Kumar', room: '101', bed: '1', zone: 1, condition: 'Post-Surgery Recovery', status: 'Normal', doctor: 'Dr. Sharma', contact: '+91 98765 43210' },
  { id: 'P2', name: 'Priya Sharma', room: '101', bed: '2', zone: 2, condition: 'Mobility Impaired', status: 'Monitoring', doctor: 'Dr. Verma', contact: '+91 98111 22334' },
  { id: 'P3', name: 'Anil Deshmukh', room: '102', bed: '3', zone: 3, condition: 'Respiratory Care', status: 'Normal', doctor: 'Dr. Kulkarni', contact: '+91 97222 33445' },
  { id: 'P4', name: 'Sunita Patil', room: '102', bed: '4', zone: 4, condition: 'Elderly Cardiac Care', status: 'Attention', doctor: 'Dr. Mehta', contact: '+91 99333 44556' }
];

const DEFAULT_ALERTS = [
  {
    id: 'ALT-1001',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    patientId: 'P1',
    patient: 'Ramesh Kumar',
    room: '101',
    bed: '1',
    gesture: 'Water (2 fingers)',
    requirement: 'Water Required',
    message: 'Water required. Ramesh Kumar. Room 101. Bed 1.',
    confidence: 93,
    detectionStatus: 'Confirmed',
    priority: 'normal',
    status: 'resolved',
    language: 'en',
    resolvedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  },
  {
    id: 'ALT-1002',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    patientId: 'P2',
    patient: 'Priya Sharma',
    room: '101',
    bed: '2',
    gesture: 'Food (1 finger)',
    requirement: 'Food Required',
    message: 'Food required. Priya Sharma. Room 101. Bed 2.',
    confidence: 91,
    detectionStatus: 'Confirmed',
    priority: 'normal',
    status: 'acknowledged',
    language: 'en',
    acknowledgedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString()
  }
];

const DEFAULT_REPORTS = [
  {
    id: 'REP-101',
    patientId: 'P1',
    patientName: 'Ramesh Kumar',
    room: '101',
    bed: '1',
    title: 'Post-Operative Blood Profile',
    type: 'Blood Test',
    doctor: 'Dr. Sharma',
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    summary: 'Hemoglobin 13.2 g/dL, WBC counts normal. Vitals stable.',
    status: 'Normal',
    fileName: null,
    fileUrl: null
  },
  {
    id: 'REP-102',
    patientId: 'P3',
    patientName: 'Anil Deshmukh',
    room: '102',
    bed: '3',
    title: 'Chest X-Ray Digital Imaging',
    type: 'Radiology',
    doctor: 'Dr. Kulkarni',
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    summary: 'Mild bronchial congestion clearing. Continued bronchodilator support.',
    status: 'Monitoring',
    fileName: null,
    fileUrl: null
  },
  {
    id: 'REP-103',
    patientId: 'P4',
    patientName: 'Sunita Patil',
    room: '102',
    bed: '4',
    title: '12-Lead ECG Analysis',
    type: 'Cardiology',
    doctor: 'Dr. Mehta',
    date: new Date().toISOString().split('T')[0],
    summary: 'Sinus rhythm with mild ST-segment elevation under observation.',
    status: 'Attention',
    fileName: null,
    fileUrl: null
  }
];

const DEFAULT_APPOINTMENTS = [
  {
    id: 'APT-201',
    patientId: 'P1',
    patientName: 'Ramesh Kumar',
    room: '101',
    bed: '1',
    doctor: 'Dr. Sharma (Chief Surgeon)',
    specialty: 'Post-Op Follow-up',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    time: '10:30 AM',
    reason: 'Surgical wound check & mobility assessment',
    priority: 'Routine',
    status: 'Scheduled'
  },
  {
    id: 'APT-202',
    patientId: 'P2',
    patientName: 'Priya Sharma',
    room: '101',
    bed: '2',
    doctor: 'Dr. Verma (Physiotherapist)',
    specialty: 'Physical Therapy',
    date: new Date().toISOString().split('T')[0],
    time: '03:00 PM',
    reason: 'Daily limb mobility exercises & assisted walking session',
    priority: 'Priority',
    status: 'Scheduled'
  },
  {
    id: 'APT-203',
    patientId: 'P4',
    patientName: 'Sunita Patil',
    room: '102',
    bed: '4',
    doctor: 'Dr. Mehta (Cardiologist)',
    specialty: 'Cardiology Review',
    date: new Date().toISOString().split('T')[0],
    time: '05:30 PM',
    reason: 'Review 12-lead ECG and adjust anti-hypertensive medication',
    priority: 'Urgent',
    status: 'Scheduled'
  }
];

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(fallback, null, 2), 'utf-8');
      return fallback;
    }
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (err) {
    return fallback;
  }
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Write error on ${file}:`, err);
    return false;
  }
}

// Initialise storage
readJson(PATIENTS_FILE, DEFAULT_PATIENTS);
readJson(ALERTS_FILE, DEFAULT_ALERTS);
readJson(REPORTS_FILE, DEFAULT_REPORTS);
readJson(APPOINTMENTS_FILE, DEFAULT_APPOINTMENTS);

// ─── Real-Time Live State (For Mobile Wi-Fi Monitoring) ──────────────────────
let liveState = {
  currentGesture: 'Waiting for gesture...',
  confidence: 0,
  detectionStatus: 'Ready',
  patientId: 'P1',
  patientName: 'Ramesh Kumar',
  room: '101',
  bed: '1',
  priority: 'normal',
  timestamp: new Date().toISOString(),
  cameraActive: false
};

// ─── Authentication API (Admin / Nurse Login & Logout) ──────────────────────
let activeSessions = new Set(['admin-token-demo']);

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if ((username === 'admin' && password === 'admin123') || (username === 'nurse' && password === 'nurse123')) {
    const role = username === 'admin' ? 'admin' : 'nurse';
    const token = `token-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    activeSessions.add(token);
    return res.json({
      success: true,
      token,
      user: {
        username,
        name: username === 'admin' ? 'Adarsh (Lead Admin)' : 'Staff Nurse Mary',
        role
      }
    });
  }
  res.status(401).json({ success: false, message: 'Invalid username or password! Use admin / admin123' });
});

app.post('/api/logout', (req, res) => {
  const token = req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null;
  if (token) activeSessions.delete(token);
  res.json({ success: true });
});

app.get('/api/auth-status', (req, res) => {
  const token = req.headers.authorization ? req.headers.authorization.replace('Bearer ', '') : null;
  const isAuth = activeSessions.has(token);
  res.json({ authenticated: isAuth });
});

// ─── Network Info API (For Mobile Connect via Same Wi-Fi) ───────────────────
app.get('/api/network-info', (req, res) => {
  res.json({
    localIp,
    port: PORT,
    mobileUrl: `http://${localIp}:${PORT}/mobile`,
    dashboardUrl: `http://${localIp}:${PORT}/dashboard`,
    mainUrl: `http://${localIp}:${PORT}/`
  });
});

// ─── Live State API (Real-Time Mobile Radar) ────────────────────────────────
app.get('/api/live-status', (req, res) => {
  const alerts = readJson(ALERTS_FILE, DEFAULT_ALERTS);
  const pendingAlerts = alerts.filter(a => a.status === 'pending');
  const latestAlert = alerts.length > 0 ? alerts[0] : null;

  res.json({
    ...liveState,
    pendingCount: pendingAlerts.length,
    latestAlert
  });
});

app.post('/api/live-status', (req, res) => {
  const body = req.body || {};
  liveState = {
    ...liveState,
    ...body,
    timestamp: new Date().toISOString()
  };
  res.json({ success: true, liveState });
});

// ─── Patient Management APIs (Edit Patient Details) ─────────────────────────
app.get('/api/patients', (req, res) => {
  const patients = readJson(PATIENTS_FILE, DEFAULT_PATIENTS);
  res.json(patients);
});

app.put('/api/patients/:id', (req, res) => {
  const patients = readJson(PATIENTS_FILE, DEFAULT_PATIENTS);
  const pId = req.params.id;
  const index = patients.findIndex(p => p.id === pId);

  if (index === -1) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const updated = {
    ...patients[index],
    ...req.body,
    id: pId // ensure ID remains intact
  };

  patients[index] = updated;
  writeJson(PATIENTS_FILE, patients);
  res.json({ success: true, patient: updated });
});

app.patch('/api/patients/:id', (req, res) => {
  const patients = readJson(PATIENTS_FILE, DEFAULT_PATIENTS);
  const pId = req.params.id;
  const index = patients.findIndex(p => p.id === pId);

  if (index === -1) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const updated = {
    ...patients[index],
    ...req.body,
    id: pId
  };

  patients[index] = updated;
  writeJson(PATIENTS_FILE, patients);
  res.json({ success: true, patient: updated });
});

// ─── Medical Reports APIs (Add & Upload) ────────────────────────────────────
app.get('/api/reports', (req, res) => {
  const reports = readJson(REPORTS_FILE, DEFAULT_REPORTS);
  const { patientId } = req.query;
  if (patientId) {
    return res.json(reports.filter(r => r.patientId === patientId));
  }
  res.json(reports);
});

app.post('/api/reports', upload.single('reportFile'), (req, res) => {
  const reports = readJson(REPORTS_FILE, DEFAULT_REPORTS);
  const body = req.body || {};

  let fileUrl = null;
  let fileName = null;

  if (req.file) {
    fileName = req.file.originalname;
    fileUrl = `/uploads/${req.file.filename}`;
  }

  const newReport = {
    id: `REP-${Date.now().toString().slice(-5)}`,
    patientId: body.patientId || 'P1',
    patientName: body.patientName || 'Patient',
    room: body.room || '101',
    bed: body.bed || '1',
    title: body.title || 'Diagnostic Report',
    type: body.type || 'General Test',
    doctor: body.doctor || 'Attending Physician',
    date: body.date || new Date().toISOString().split('T')[0],
    summary: body.summary || 'Clinical observations recorded.',
    status: body.status || 'Normal',
    fileName,
    fileUrl
  };

  reports.unshift(newReport);
  writeJson(REPORTS_FILE, reports);
  res.status(201).json(newReport);
});

app.delete('/api/reports/:id', (req, res) => {
  let reports = readJson(REPORTS_FILE, DEFAULT_REPORTS);
  const targetId = req.params.id;
  reports = reports.filter(r => r.id !== targetId);
  writeJson(REPORTS_FILE, reports);
  res.json({ success: true });
});

// ─── Appointments APIs ──────────────────────────────────────────────────────
app.get('/api/appointments', (req, res) => {
  const appointments = readJson(APPOINTMENTS_FILE, DEFAULT_APPOINTMENTS);
  const { patientId } = req.query;
  if (patientId) {
    return res.json(appointments.filter(a => a.patientId === patientId));
  }
  res.json(appointments);
});

app.post('/api/appointments', (req, res) => {
  const appointments = readJson(APPOINTMENTS_FILE, DEFAULT_APPOINTMENTS);
  const body = req.body || {};

  const newApt = {
    id: `APT-${Date.now().toString().slice(-5)}`,
    patientId: body.patientId || 'P1',
    patientName: body.patientName || 'Patient',
    room: body.room || '101',
    bed: body.bed || '1',
    doctor: body.doctor || 'Doctor On Call',
    specialty: body.specialty || 'General Consultation',
    date: body.date || new Date().toISOString().split('T')[0],
    time: body.time || '11:00 AM',
    reason: body.reason || 'Routine Health Review',
    priority: body.priority || 'Routine',
    status: 'Scheduled'
  };

  appointments.unshift(newApt);
  writeJson(APPOINTMENTS_FILE, appointments);
  res.status(201).json(newApt);
});

app.patch('/api/appointments/:id', (req, res) => {
  const appointments = readJson(APPOINTMENTS_FILE, DEFAULT_APPOINTMENTS);
  const aId = req.params.id;
  const index = appointments.findIndex(a => a.id === aId);

  if (index === -1) {
    return res.status(404).json({ error: 'Appointment not found' });
  }

  appointments[index] = { ...appointments[index], ...req.body };
  writeJson(APPOINTMENTS_FILE, appointments);
  res.json(appointments[index]);
});

app.delete('/api/appointments/:id', (req, res) => {
  let appointments = readJson(APPOINTMENTS_FILE, DEFAULT_APPOINTMENTS);
  appointments = appointments.filter(a => a.id !== req.params.id);
  writeJson(APPOINTMENTS_FILE, appointments);
  res.json({ success: true });
});

// ─── Alerts APIs ────────────────────────────────────────────────────────────
app.get('/api/alerts', (req, res) => {
  const alerts = readJson(ALERTS_FILE, DEFAULT_ALERTS);
  const { status, priority, limit } = req.query;

  let filtered = [...alerts];
  if (status && status !== 'all') {
    filtered = filtered.filter(a => a.status === status);
  }
  if (priority && priority !== 'all') {
    filtered = filtered.filter(a => a.priority === priority);
  }

  filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  if (limit) filtered = filtered.slice(0, parseInt(limit, 10));

  res.json(filtered);
});

app.post('/api/alerts', (req, res) => {
  const alerts = readJson(ALERTS_FILE, DEFAULT_ALERTS);
  const body = req.body || {};

  const newAlert = {
    id: body.id || `ALT-${Date.now().toString().slice(-6)}`,
    timestamp: body.timestamp || new Date().toISOString(),
    patientId: body.patientId || 'P1',
    patient: body.patient || 'Patient',
    room: body.room || '101',
    bed: body.bed || '1',
    gesture: body.gesture || 'General Alert',
    requirement: body.requirement || 'Assistance Required',
    message: body.message || 'Assistance required',
    confidence: typeof body.confidence === 'number' ? body.confidence : 92,
    detectionStatus: body.detectionStatus || 'Confirmed',
    priority: body.priority || 'normal',
    status: 'pending',
    language: body.language || 'en',
    type: body.type || 'hand_gesture'
  };

  alerts.unshift(newAlert);
  writeJson(ALERTS_FILE, alerts);

  // Also update liveState
  liveState = {
    ...liveState,
    currentGesture: newAlert.requirement,
    confidence: newAlert.confidence,
    detectionStatus: newAlert.detectionStatus,
    patientId: newAlert.patientId,
    patientName: newAlert.patient,
    room: newAlert.room,
    bed: newAlert.bed,
    priority: newAlert.priority,
    timestamp: newAlert.timestamp
  };

  res.status(201).json(newAlert);
});

app.patch('/api/alerts/:id', (req, res) => {
  const alerts = readJson(ALERTS_FILE, DEFAULT_ALERTS);
  const alertId = req.params.id;
  const { status } = req.body;

  const targetIndex = alerts.findIndex(a => a.id === alertId);
  if (targetIndex === -1) {
    return res.status(404).json({ error: 'Alert not found' });
  }

  const alert = alerts[targetIndex];
  if (status) {
    alert.status = status;
    if (status === 'acknowledged') alert.acknowledgedAt = new Date().toISOString();
    else if (status === 'resolved') alert.resolvedAt = new Date().toISOString();
  }

  alerts[targetIndex] = alert;
  writeJson(ALERTS_FILE, alerts);
  res.json(alert);
});

app.delete('/api/alerts/:id', (req, res) => {
  let alerts = readJson(ALERTS_FILE, DEFAULT_ALERTS);
  alerts = alerts.filter(a => a.id !== req.params.id);
  writeJson(ALERTS_FILE, alerts);
  res.json({ success: true });
});

app.get('/api/stats', (req, res) => {
  const alerts = readJson(ALERTS_FILE, DEFAULT_ALERTS);
  const reports = readJson(REPORTS_FILE, DEFAULT_REPORTS);
  const appointments = readJson(APPOINTMENTS_FILE, DEFAULT_APPOINTMENTS);

  res.json({
    total: alerts.length,
    pending: alerts.filter(a => a.status === 'pending').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    emergency: alerts.filter(a => a.priority === 'emergency').length,
    reportsCount: reports.length,
    appointmentsCount: appointments.length
  });
});

// ─── Static Web App Routes ──────────────────────────────────────────────────
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/nurse', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));
app.get('/mobile', (req, res) => res.sendFile(path.join(__dirname, 'public', 'mobile.html')));

// Listen on all network interfaces (0.0.0.0) so smartphones on same Wi-Fi connect
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n================================================================`);
  console.log(`🏥 AI-Based Patient Gesture Communication & Alert System`);
  console.log(`================================================================`);
  console.log(`📡 Local Computer URL:   http://localhost:${PORT}`);
  console.log(`📱 Same Wi-Fi Mobile:    http://${localIp}:${PORT}/mobile`);
  console.log(`📊 Nurse Dashboard:      http://${localIp}:${PORT}/dashboard`);
  console.log(`================================================================\n`);
});
