const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 10000;

const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "data");
const uploadDir = path.join(__dirname, "uploads");

fs.mkdirSync(publicDir, { recursive: true });
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

const dbFile = path.join(dataDir, "db.json");

const defaultDB = {
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
  ]
};

function ensureDatabase() {
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(
      dbFile,
      JSON.stringify(defaultDB, null, 2),
      "utf8"
    );
  }
}

ensureDatabase();

function readDB() {
  try {
    const raw = fs.readFileSync(dbFile, "utf8");
    const parsed = JSON.parse(raw);

    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
      reports: Array.isArray(parsed.reports) ? parsed.reports : [],
      appointments: Array.isArray(parsed.appointments)
        ? parsed.appointments
        : []
    };
  } catch (error) {
    const freshDB = JSON.parse(JSON.stringify(defaultDB));

    try {
      fs.writeFileSync(
        dbFile,
        JSON.stringify(freshDB, null, 2),
        "utf8"
      );
    } catch {}

    return freshDB;
  }
}

function writeDB(db) {
  fs.writeFileSync(
    dbFile,
    JSON.stringify(db, null, 2),
    "utf8"
  );
}

function generateId(prefix) {
  return prefix + Date.now() + Math.random().toString(36).slice(2, 7);
}

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

app.use(
  express.static(publicDir, {
    extensions: ["html"],
    index: "index.html"
  })
);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const extension = path.extname(file.originalname).toLowerCase();

    const filename =
      Date.now() +
      "-" +
      Math.random().toString(36).slice(2, 10) +
      extension;

    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024
  },
  fileFilter: function (req, file, cb) {
    const allowedMimeTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg"
    ];

    const allowedExtensions = [
      ".pdf",
      ".png",
      ".jpg",
      ".jpeg"
    ];

    const extension = path
      .extname(file.originalname)
      .toLowerCase();

    const mimeAllowed = allowedMimeTypes.includes(
      file.mimetype
    );

    const extensionAllowed = allowedExtensions.includes(
      extension
    );

    if (mimeAllowed && extensionAllowed) {
      cb(null, true);
      return;
    }

    cb(
      new Error(
        "Only PDF, JPG, JPEG and PNG files are allowed."
      )
    );
  }
});

app.get("/api/health", function (req, res) {
  res.json({
    ok: true,
    service: "CareGesture AI",
    api: "AI Patient Gesture Communication API",
    time: new Date().toISOString()
  });
});

app.get("/api/state", function (req, res) {
  try {
    const db = readDB();

    res.json({
      users: db.users,
      alerts: db.alerts,
      reports: db.reports,
      appointments: db.appointments
    });
  } catch (error) {
    res.status(500).json({
      error: "Unable to load application state"
    });
  }
});

app.get("/api/users", function (req, res) {
  try {
    const db = readDB();
    res.json(db.users);
  } catch (error) {
    res.status(500).json({
      error: "Unable to load users"
    });
  }
});

app.get("/api/alerts", function (req, res) {
  try {
    const db = readDB();
    res.json(db.alerts);
  } catch (error) {
    res.status(500).json({
      error: "Unable to load alerts"
    });
  }
});

app.post("/api/alerts", function (req, res) {
  try {
    const db = readDB();

    const {
      patientId,
      patientName,
      room,
      bed,
      gesture,
      message,
      language,
      priority,
      confidence
    } = req.body;

    if (!patientId) {
      return res.status(400).json({
        error: "patientId is required"
      });
    }

    if (!message || !String(message).trim()) {
      return res.status(400).json({
        error: "message is required"
      });
    }

    let finalPriority = priority || "Normal";

    const validPriorities = [
      "Normal",
      "High",
      "Critical"
    ];

    if (!validPriorities.includes(finalPriority)) {
      finalPriority = "Normal";
    }

    const numericConfidence = Number(confidence);

    const safeConfidence = Number.isFinite(
      numericConfidence
    )
      ? Math.max(
          0,
          Math.min(100, numericConfidence)
        )
      : 0;

    const alert = {
      id: generateId("AL"),
      patientId: String(patientId),
      patientName: patientName
        ? String(patientName)
        : "Patient",
      room: room ? String(room) : "-",
      bed: bed ? String(bed) : "-",
      gesture: gesture
        ? String(gesture)
        : "Manual",
      message: String(message).trim(),
      language: language
        ? String(language)
        : "en",
      priority: finalPriority,
      confidence: safeConfidence,
      status: "New",
      createdAt: new Date().toISOString(),
      acknowledgedAt: null,
      resolvedAt: null
    };

    db.alerts.unshift(alert);

    writeDB(db);

    res.status(201).json(alert);
  } catch (error) {
    res.status(500).json({
      error: "Unable to create alert"
    });
  }
});

app.patch("/api/alerts/:id", function (req, res) {
  try {
    const db = readDB();

    const alert = db.alerts.find(function (item) {
      return String(item.id) === String(req.params.id);
    });

    if (!alert) {
      return res.status(404).json({
        error: "Alert not found"
      });
    }

    const action = req.body.action;
    const now = new Date().toISOString();

    if (action === "acknowledge") {
      alert.status = "Acknowledged";
      alert.acknowledgedAt = now;
    } else if (action === "resolve") {
      alert.status = "Resolved";
      alert.resolvedAt = now;
    } else if (action === "escalate") {
      alert.status = "Escalated";
      alert.priority = "Critical";
    } else {
      return res.status(400).json({
        error:
          "Invalid action. Use acknowledge, resolve or escalate."
      });
    }

    writeDB(db);

    res.json(alert);
  } catch (error) {
    res.status(500).json({
      error: "Unable to update alert"
    });
  }
});

app.get("/api/reports", function (req, res) {
  try {
    const db = readDB();
    res.json(db.reports);
  } catch (error) {
    res.status(500).json({
      error: "Unable to load reports"
    });
  }
});

app.post(
  "/api/reports",
  upload.single("report"),
  function (req, res) {
    try {
      const db = readDB();

      if (!req.file) {
        return res.status(400).json({
          error: "No report uploaded"
        });
      }

      const patientId =
        req.body.patientId || "P1001";

      const report = {
        id: generateId("REP"),
        patientId: String(patientId),
        originalName: req.file.originalname,
        storedName: req.file.filename,
        type: req.file.mimetype,
        size: req.file.size,
        uploadedAt: new Date().toISOString(),
        analysis:
          "Demo document intake complete. Connect an OCR/medical NLP service here for production analysis. This system does not diagnose or prescribe."
      };

      db.reports.unshift(report);

      writeDB(db);

      res.status(201).json(report);
    } catch (error) {
      if (
        req.file &&
        req.file.path &&
        fs.existsSync(req.file.path)
      ) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }

      res.status(500).json({
        error: "Unable to upload report"
      });
    }
  }
);

app.get("/api/appointments", function (req, res) {
  try {
    const db = readDB();
    res.json(db.appointments);
  } catch (error) {
    res.status(500).json({
      error: "Unable to load appointments"
    });
  }
});

app.post("/api/appointments", function (req, res) {
  try {
    const db = readDB();

    const patientId =
      req.body.patientId || "P1001";

    const doctor =
      req.body.doctor || "Dr. Ananya";

    const date = req.body.date;
    const time = req.body.time;

    if (!date) {
      return res.status(400).json({
        error: "date is required"
      });
    }

    if (!time) {
      return res.status(400).json({
        error: "time is required"
      });
    }

    const appointment = {
      id: Date.now(),
      patientId: String(patientId),
      doctor: String(doctor),
      date: String(date),
      time: String(time),
      status: "Scheduled",
      createdAt: new Date().toISOString()
    };

    db.appointments.unshift(appointment);

    writeDB(db);

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({
      error: "Unable to create appointment"
    });
  }
});

app.get("/uploads/:filename", function (req, res) {
  const filename = path.basename(
    req.params.filename
  );

  const filePath = path.join(
    uploadDir,
    filename
  );

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      error: "File not found"
    });
  }

  res.sendFile(filePath);
});

app.get("/", function (req, res) {
  res.sendFile(
    path.join(publicDir, "index.html")
  );
});

app.use(function (req, res, next) {
  if (
    req.method === "GET" &&
    req.accepts("html") &&
    !req.path.startsWith("/api/") &&
    !req.path.startsWith("/uploads/")
  ) {
    return res.sendFile(
      path.join(publicDir, "index.html")
    );
  }

  next();
});

app.use(function (req, res) {
  res.status(404).json({
    error: "Route not found"
  });
});

app.use(function (err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error:
          "File is too large. Maximum allowed size is 8 MB."
      });
    }

    return res.status(400).json({
      error: err.message
    });
  }

  res.status(400).json({
    error:
      err.message || "Request failed"
  });
});

app.listen(PORT, function () {
  console.log(
    `CareGesture AI server running on port ${PORT}`
  );
});
