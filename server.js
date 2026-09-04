const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;

// --------------------------------------------------
// FOLDERS
// --------------------------------------------------

const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "data");
const uploadDir = path.join(__dirname, "uploads");

[publicDir, dataDir, uploadDir].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

// --------------------------------------------------
// DATABASE FILE
// --------------------------------------------------

const dbFile = path.join(dataDir, "db.json");

// IMPORTANT:
// This must be declared BEFORE dbFile initialization.
const defaults = {
  users: [
    {
      id: "P1001",
      name: "Demo Patient",
      role: "patient",
      room: "204",
      bed: "3",
      language: "en"
    },
    {
      id: "N1001",
      name: "Demo Nurse",
      role: "nurse",
      language: "en"
    },
    {
      id: "D1001",
      name: "Demo Doctor",
      role: "doctor",
      language: "en"
    },
    {
      id: "A1001",
      name: "System Admin",
      role: "admin",
      language: "en"
    }
  ],

  alerts: [],

  reports: [],

  appointments: [
    {
      id: 1,
      patientId: "P1001",
      doctor: "Dr. Ananya",
      date: "2026-09-05",
      time: "10:30",
      status: "Scheduled"
    }
  ],

  devices: []
};

// Create database if it does not exist
if (!fs.existsSync(dbFile)) {
  fs.writeFileSync(
    dbFile,
    JSON.stringify(defaults, null, 2),
    "utf8"
  );
}

// --------------------------------------------------
// DATABASE FUNCTIONS
// --------------------------------------------------

function read() {
  try {
    if (!fs.existsSync(dbFile)) {
      fs.writeFileSync(
        dbFile,
        JSON.stringify(defaults, null, 2),
        "utf8"
      );
    }

    const raw = fs.readFileSync(dbFile, "utf8");

    if (!raw.trim()) {
      return JSON.parse(JSON.stringify(defaults));
    }

    const saved = JSON.parse(raw);

    return {
      ...defaults,
      ...saved,

      users: Array.isArray(saved.users)
        ? saved.users
        : defaults.users,

      alerts: Array.isArray(saved.alerts)
        ? saved.alerts
        : [],

      reports: Array.isArray(saved.reports)
        ? saved.reports
        : [],

      appointments: Array.isArray(saved.appointments)
        ? saved.appointments
        : defaults.appointments,

      devices: Array.isArray(saved.devices)
        ? saved.devices
        : []
    };
  } catch (error) {
    console.error("Database read error:", error.message);

    try {
      fs.writeFileSync(
        dbFile,
        JSON.stringify(defaults, null, 2),
        "utf8"
      );
    } catch (writeError) {
      console.error(
        "Database reset error:",
        writeError.message
      );
    }

    return JSON.parse(JSON.stringify(defaults));
  }
}

function write(data) {
  const tempFile =
    dbFile +
    "." +
    process.pid +
    "." +
    Date.now() +
    ".tmp";

  fs.writeFileSync(
    tempFile,
    JSON.stringify(data, null, 2),
    "utf8"
  );

  fs.renameSync(tempFile, dbFile);
}

// --------------------------------------------------
// ID GENERATOR
// --------------------------------------------------

function createId(prefix) {
  return (
    prefix +
    Date.now() +
    Math.random()
      .toString(36)
      .slice(2, 7)
  );
}

// --------------------------------------------------
// ALERT SAVE FUNCTION
// --------------------------------------------------

function saveAlert(alert) {
  const db = read();

  if (!Array.isArray(db.alerts)) {
    db.alerts = [];
  }

  db.alerts.unshift(alert);

  write(db);

  return alert;
}

// --------------------------------------------------
// MIDDLEWARE
// --------------------------------------------------

app.use(
  express.json({
    limit: "2mb"
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb"
  })
);

app.use(express.static(publicDir));

// --------------------------------------------------
// FILE UPLOAD
// --------------------------------------------------

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
  },

  filename: (req, file, callback) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const filename =
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .slice(2, 8) +
      extension;

    callback(null, filename);
  }
});

const upload = multer({
  storage,

  limits: {
    fileSize: 8 * 1024 * 1024
  },

  fileFilter: (req, file, callback) => {
    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const allowed = [
      ".pdf",
      ".png",
      ".jpg",
      ".jpeg"
    ];

    if (allowed.includes(extension)) {
      callback(null, true);
    } else {
      callback(
        new Error(
          "Only PDF, JPG, JPEG and PNG files are allowed."
        ),
        false
      );
    }
  }
});

// --------------------------------------------------
// HEALTH CHECK
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "CareGesture AI",
    time: new Date().toISOString(),
    database: fs.existsSync(dbFile)
  });
});

// --------------------------------------------------
// STATE
// --------------------------------------------------

app.get("/api/state", (req, res) => {
  res.json(read());
});

// --------------------------------------------------
// USERS
// --------------------------------------------------

app.get("/api/users", (req, res) => {
  res.json(read().users);
});

// --------------------------------------------------
// ALERTS - GET
// --------------------------------------------------

app.get("/api/alerts", (req, res) => {
  res.json(read().alerts);
});

// --------------------------------------------------
// ALERTS - CREATE
// --------------------------------------------------

app.post("/api/alerts", (req, res) => {
  try {
    const body = req.body || {};

    if (!body.patientId) {
      return res.status(400).json({
        error: "patientId and message are required"
      });
    }

    if (!String(body.message || "").trim()) {
      return res.status(400).json({
        error: "patientId and message are required"
      });
    }

    const confidenceNumber = Number(
      body.confidence
    );

    const confidence = Number.isFinite(
      confidenceNumber
    )
      ? Math.max(
          0,
          Math.min(100, confidenceNumber)
        )
      : 0;

    const alert = {
      id: createId("AL"),

      patientId: String(
        body.patientId
      ),

      patientName: String(
        body.patientName || "Patient"
      ),

      room: String(
        body.room || "-"
      ),

      bed: String(
        body.bed || "-"
      ),

      gesture: String(
        body.gesture || "Manual"
      ),

      message: String(
        body.message
      ).trim(),

      language: String(
        body.language || "en"
      ),

      priority: [
        "Normal",
        "High",
        "Critical"
      ].includes(body.priority)
        ? body.priority
        : "Normal",

      confidence,

      status: "New",

      createdAt:
        new Date().toISOString(),

      acknowledgedAt: null,

      resolvedAt: null
    };

    const savedAlert = saveAlert(alert);

    console.log(
      "Alert saved:",
      savedAlert.id,
      savedAlert.message
    );

    return res
      .status(201)
      .json(savedAlert);

  } catch (error) {
    console.error(
      "Alert save error:",
      error
    );

    return res.status(500).json({
      error: "Alert could not be saved",
      detail: error.message
    });
  }
});

// --------------------------------------------------
// ALERTS - UPDATE
// --------------------------------------------------

app.patch("/api/alerts/:id", (req, res) => {
  try {
    const db = read();

    const alert = db.alerts.find(
      (item) =>
        String(item.id) ===
        String(req.params.id)
    );

    if (!alert) {
      return res.status(404).json({
        error: "Alert not found"
      });
    }

    const action =
      req.body?.action;

    const now =
      new Date().toISOString();

    if (action === "acknowledge") {
      alert.status = "Acknowledged";
      alert.acknowledgedAt = now;
    }

    else if (action === "resolve") {
      alert.status = "Resolved";
      alert.resolvedAt = now;
    }

    else if (action === "escalate") {
      alert.status = "Escalated";
      alert.priority = "Critical";
    }

    else {
      return res.status(400).json({
        error: "Invalid action"
      });
    }

    write(db);

    return res.json(alert);

  } catch (error) {
    console.error(
      "Alert update error:",
      error
    );

    return res.status(500).json({
      error: "Alert update failed",
      detail: error.message
    });
  }
});

// --------------------------------------------------
// DEVICES - REGISTER
// --------------------------------------------------

app.post(
  "/api/devices/register",
  (req, res) => {
    try {
      const body = req.body || {};

      if (!body.userId || !body.token) {
        return res.status(400).json({
          error:
            "userId and token required"
        });
      }

      const db = read();

      if (!Array.isArray(db.devices)) {
        db.devices = [];
      }

      // Remove old record for same token
      db.devices =
        db.devices.filter(
          (device) =>
            device.token !==
            String(body.token)
        );

      db.devices.push({
        userId: String(
          body.userId
        ),

        role: String(
          body.role || "nurse"
        ),

        token: String(
          body.token
        ),

        platform: String(
          body.platform || "android"
        ),

        updatedAt:
          new Date().toISOString()
      });

      write(db);

      return res
        .status(201)
        .json({
          ok: true
        });

    } catch (error) {
      console.error(
        "Device registration error:",
        error
      );

      return res.status(500).json({
        error:
          "Device registration failed",
        detail: error.message
      });
    }
  }
);

// --------------------------------------------------
// DEVICES - GET
// --------------------------------------------------

app.get(
  "/api/devices",
  (req, res) => {
    res.json(
      read().devices || []
    );
  }
);

// --------------------------------------------------
// REPORTS - GET
// --------------------------------------------------

app.get(
  "/api/reports",
  (req, res) => {
    res.json(
      read().reports || []
    );
  }
);

// --------------------------------------------------
// REPORTS - UPLOAD
// --------------------------------------------------

app.post(
  "/api/reports",
  upload.single("report"),
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "No report uploaded"
        });
      }

      const db = read();

      const report = {
        id: createId("REP"),

        patientId: String(
          req.body.patientId ||
          "P1001"
        ),

        originalName:
          req.file.originalname,

        storedName:
          req.file.filename,

        type:
          req.file.mimetype,

        size:
          req.file.size,

        uploadedAt:
          new Date().toISOString(),

        analysis:
          "Demo document intake complete."
      };

      if (!Array.isArray(db.reports)) {
        db.reports = [];
      }

      db.reports.unshift(report);

      write(db);

      return res
        .status(201)
        .json(report);

    } catch (error) {
      console.error(
        "Report upload error:",
        error
      );

      return res.status(500).json({
        error:
          "Report upload failed",
        detail: error.message
      });
    }
  }
);

// --------------------------------------------------
// APPOINTMENTS - GET
// --------------------------------------------------

app.get(
  "/api/appointments",
  (req, res) => {
    res.json(
      read().appointments || []
    );
  }
);

// --------------------------------------------------
// APPOINTMENTS - CREATE
// --------------------------------------------------

app.post(
  "/api/appointments",
  (req, res) => {
    try {
      const body =
        req.body || {};

      if (!body.date || !body.time) {
        return res.status(400).json({
          error:
            "date and time are required"
        });
      }

      const db = read();

      const appointment = {
        id: Date.now(),

        patientId: String(
          body.patientId ||
          "P1001"
        ),

        doctor: String(
          body.doctor ||
          "Dr. Ananya"
        ),

        date: String(
          body.date
        ),

        time: String(
          body.time
        ),

        status: "Scheduled",

        createdAt:
          new Date().toISOString()
      };

      if (
        !Array.isArray(
          db.appointments
        )
      ) {
        db.appointments = [];
      }

      db.appointments.unshift(
        appointment
      );

      write(db);

      return res
        .status(201)
        .json(appointment);

    } catch (error) {
      console.error(
        "Appointment error:",
        error
      );

      return res.status(500).json({
        error:
          "Appointment creation failed",
        detail: error.message
      });
    }
  }
);

// --------------------------------------------------
// UPLOADED FILES
// --------------------------------------------------

app.get(
  "/uploads/:filename",
  (req, res) => {
    const filename =
      path.basename(
        req.params.filename
      );

    const filePath =
      path.join(
        uploadDir,
        filename
      );

    if (fs.existsSync(filePath)) {
      return res.sendFile(
        filePath
      );
    }

    return res.status(404).json({
      error: "File not found"
    });
  }
);

// --------------------------------------------------
// MAIN WEBSITE
// --------------------------------------------------

app.get(
  "/",
  (req, res) => {
    res.sendFile(
      path.join(
        publicDir,
        "index.html"
      )
    );
  }
);

// --------------------------------------------------
// SPA FALLBACK
// --------------------------------------------------

app.use(
  (req, res, next) => {
    if (
      req.method === "GET" &&
      req.accepts("html") &&
      !req.path.startsWith("/api/") &&
      !req.path.startsWith("/uploads/")
    ) {
      return res.sendFile(
        path.join(
          publicDir,
          "index.html"
        )
      );
    }

    next();
  }
);

// --------------------------------------------------
// 404 HANDLER
// --------------------------------------------------

app.use(
  (req, res) => {
    res.status(404).json({
      error: "Route not found"
    });
  }
);

// --------------------------------------------------
// ERROR HANDLER
// --------------------------------------------------

app.use(
  (error, req, res, next) => {
    console.error(
      "Server error:",
      error
    );

    res.status(400).json({
      error:
        error.message ||
        "Request failed"
    });
  }
);

// --------------------------------------------------
// START SERVER
// --------------------------------------------------

app.listen(
  PORT,
  "0.0.0.0",
  () => {
    console.log(
      `CareGesture AI running on port ${PORT}`
    );

    console.log(
      `Database file: ${dbFile}`
    );
  }
);
