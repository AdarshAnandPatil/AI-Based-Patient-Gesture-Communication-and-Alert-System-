const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;

const dataDir = path.join(__dirname, "data");
const uploadDir = path.join(__dirname, "uploads");
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

const dbFile = path.join(dataDir, "db.json");

const defaultDB = {
  users: [
    { id: "P1001", name: "Demo Patient", role: "patient", room: "204", bed: "3", language: "en" },
    { id: "N1001", name: "Demo Nurse", role: "nurse", language: "en" },
    { id: "D1001", name: "Demo Doctor", role: "doctor", language: "en" },
    { id: "A1001", name: "System Admin", role: "admin", language: "en" }
  ],
  alerts: [],
  reports: [],
  appointments: [
    { id: 1, patientId: "P1001", doctor: "Dr. Ananya", date: "2026-09-05", time: "10:30", status: "Scheduled" }
  ]
};

if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, JSON.stringify(defaultDB, null, 2));

function readDB() {
  try { return JSON.parse(fs.readFileSync(dbFile, "utf8")); }
  catch { return JSON.parse(JSON.stringify(defaultDB)); }
}
function writeDB(db) {
  fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
}

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /pdf|png|jpe?g/i.test(file.mimetype) || /\.(pdf|png|jpe?g)$/i.test(file.originalname);
    cb(ok ? null : new Error("Only PDF, JPG and PNG files are allowed."), ok);
  }
});

app.get("/api/health", (req, res) => res.json({ ok: true, service: "AI Patient Gesture Communication API" }));

app.get("/api/state", (req, res) => {
  const db = readDB();
  res.json({ users: db.users, alerts: db.alerts, reports: db.reports, appointments: db.appointments });
});

app.post("/api/alerts", (req, res) => {
  const db = readDB();
  const { patientId, patientName, room, bed, gesture, message, language, priority = "Normal", confidence = 0 } = req.body;
  if (!patientId || !message) return res.status(400).json({ error: "patientId and message are required" });

  const alert = {
    id: "AL" + Date.now(),
    patientId, patientName: patientName || "Patient",
    room: room || "-", bed: bed || "-",
    gesture: gesture || "Manual",
    message, language: language || "en",
    priority, confidence: Number(confidence) || 0,
    status: "New",
    createdAt: new Date().toISOString(),
    acknowledgedAt: null,
    resolvedAt: null
  };
  db.alerts.unshift(alert);
  writeDB(db);
  res.status(201).json(alert);
});

app.patch("/api/alerts/:id", (req, res) => {
  const db = readDB();
  const alert = db.alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });

  const action = req.body.action;
  if (action === "acknowledge") {
    alert.status = "Acknowledged";
    alert.acknowledgedAt = new Date().toISOString();
  } else if (action === "resolve") {
    alert.status = "Resolved";
    alert.resolvedAt = new Date().toISOString();
  } else if (action === "escalate") {
    alert.status = "Escalated";
    alert.priority = "Critical";
  } else {
    return res.status(400).json({ error: "Use acknowledge, resolve or escalate" });
  }
  writeDB(db);
  res.json(alert);
});

app.post("/api/reports", upload.single("report"), (req, res) => {
  const db = readDB();
  if (!req.file) return res.status(400).json({ error: "No report uploaded" });

  const item = {
    id: "REP" + Date.now(),
    patientId: req.body.patientId || "P1001",
    originalName: req.file.originalname,
    storedName: req.file.filename,
    type: req.file.mimetype,
    uploadedAt: new Date().toISOString(),
    analysis: "Demo document intake complete. Connect an OCR/medical NLP service here for production analysis. This system does not diagnose or prescribe."
  };
  db.reports.unshift(item);
  writeDB(db);
  res.status(201).json(item);
});

app.post("/api/appointments", (req, res) => {
  const db = readDB();
  const a = {
    id: Date.now(),
    patientId: req.body.patientId || "P1001",
    doctor: req.body.doctor || "Dr. Ananya",
    date: req.body.date,
    time: req.body.time,
    status: "Scheduled"
  };
  if (!a.date || !a.time) return res.status(400).json({ error: "date and time are required" });
  db.appointments.unshift(a);
  writeDB(db);
  res.status(201).json(a);
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || "Request failed" });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
