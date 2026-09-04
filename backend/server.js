const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const admin = require("firebase-admin");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.static("../web"));

const PORT = process.env.PORT || 10000;
const alerts = [];
const devices = new Map();

let firebaseReady = false;

function initFirebase() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) return;

  privateKey = privateKey.replace(/\\n/g, "\n");

  try {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey })
    });
    firebaseReady = true;
    console.log("Firebase Admin initialized.");
  } catch (err) {
    console.error("Firebase initialization failed:", err.message);
  }
}

initFirebase();

function makeId() {
  return `A${Date.now()}${Math.floor(Math.random() * 1000)}`;
}

async function sendPush(alert) {
  if (!firebaseReady || devices.size === 0) return;

  const tokens = [...devices.values()].map(x => x.token).filter(Boolean);
  if (!tokens.length) return;

  const message = {
    notification: {
      title: alert.severity === "critical" ? "🚨 CRITICAL PATIENT ALERT" : "Patient Alert",
      body: `${alert.request} — Room ${alert.room}, Bed ${alert.bed}`
    },
    data: {
      alertId: alert.id,
      patientId: alert.patientId,
      patientName: alert.patientName,
      room: alert.room,
      bed: alert.bed,
      request: alert.request,
      severity: alert.severity
    },
    tokens
  };

  try {
    const result = await admin.messaging().sendEachForMulticast(message);
    console.log(`FCM sent: ${result.successCount} success, ${result.failureCount} failed`);
  } catch (err) {
    console.error("FCM error:", err.message);
  }
}

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "smart-patient-alert-backend", firebaseReady });
});

app.get("/api/alerts", (req, res) => {
  res.json(alerts);
});

app.post("/api/alerts", async (req, res) => {
  const {
    patientId = "P1001",
    patientName = "Patient",
    room = "N/A",
    bed = "N/A",
    request = "NEED HELP",
    language = "en",
    severity = "normal"
  } = req.body || {};

  const alert = {
    id: makeId(),
    patientId: String(patientId),
    patientName: String(patientName),
    room: String(room),
    bed: String(bed),
    request: String(request).toUpperCase(),
    language: String(language),
    severity: severity === "critical" ? "critical" : "normal",
    status: "NEW",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  alerts.unshift(alert);
  if (alerts.length > 200) alerts.pop();

  io.emit("patient-alert", alert);
  await sendPush(alert);

  res.status(201).json(alert);
});

app.patch("/api/alerts/:id/status", (req, res) => {
  const alert = alerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: "Alert not found" });

  const allowed = ["NEW", "ACKNOWLEDGED", "RESOLVED", "ESCALATED"];
  const status = String(req.body.status || "").toUpperCase();

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  alert.status = status;
  alert.updatedAt = new Date().toISOString();
  io.emit("alert-updated", alert);
  res.json(alert);
});

app.post("/api/devices/register", (req, res) => {
  const { token, platform = "android", userId = "caregiver" } = req.body || {};
  if (!token) return res.status(400).json({ error: "FCM token is required" });

  devices.set(token, { token, platform, userId, registeredAt: new Date().toISOString() });
  res.json({ ok: true, registered: true });
});

app.get("/api/devices/count", (req, res) => {
  res.json({ count: devices.size });
});

io.on("connection", socket => {
  console.log("Dashboard/mobile socket connected:", socket.id);
  socket.emit("initial-alerts", alerts);
});

app.get("*", (req, res) => {
  res.sendFile("index.html", { root: "../web" });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Smart Patient backend running on port ${PORT}`);
});
