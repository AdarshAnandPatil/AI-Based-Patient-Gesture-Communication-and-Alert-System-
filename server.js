const express = require("express");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();
const PORT = Number(process.env.PORT) || 10000;

const publicDir = path.join(__dirname, "public");
const dataDir = path.join(__dirname, "data");
const uploadDir = path.join(__dirname, "uploads");

[publicDir, dataDir, uploadDir].forEach((dir) => {
  fs.mkdirSync(dir, { recursive: true });
});

const dbFile = path.join(dataDir, "db.json");

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


function cloneDefaults() {
  return JSON.parse(JSON.stringify(defaults));
}


function ensureDb() {

  if (!fs.existsSync(dbFile)) {

    fs.writeFileSync(
      dbFile,
      JSON.stringify(defaults, null, 2),
      "utf8"
    );

  }

}


function read() {

  try {

    ensureDb();

    const parsed = JSON.parse(
      fs.readFileSync(dbFile, "utf8")
    );

    const base = cloneDefaults();

    return {
      ...base,
      ...parsed,

      users: Array.isArray(parsed.users)
        ? parsed.users
        : base.users,

      alerts: Array.isArray(parsed.alerts)
        ? parsed.alerts
        : [],

      reports: Array.isArray(parsed.reports)
        ? parsed.reports
        : [],

      appointments: Array.isArray(parsed.appointments)
        ? parsed.appointments
        : [],

      devices: Array.isArray(parsed.devices)
        ? parsed.devices
        : []
    };

  } catch (error) {

    console.error("DATABASE READ ERROR:", error);

    const fresh = cloneDefaults();

    fs.writeFileSync(
      dbFile,
      JSON.stringify(fresh, null, 2),
      "utf8"
    );

    return fresh;

  }

}


function write(db) {

  const tempFile =
    dbFile + "." +
    process.pid +
    ".tmp";

  fs.writeFileSync(
    tempFile,
    JSON.stringify(db, null, 2),
    "utf8"
  );

  fs.renameSync(
    tempFile,
    dbFile
  );

}


function generateId(prefix) {

  return (
    prefix +
    Date.now() +
    Math.random()
      .toString(36)
      .slice(2, 8)
  );

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
  express.static(publicDir)
);


/* ================================
   FILE UPLOAD
================================ */

const storage =
  multer.diskStorage({

    destination: (req, file, cb) => {

      cb(
        null,
        uploadDir
      );

    },

    filename: (req, file, cb) => {

      const extension =
        path.extname(
          file.originalname
        ).toLowerCase();

      const fileName =
        Date.now() +
        "-" +
        Math.random()
          .toString(36)
          .slice(2, 8) +
        extension;

      cb(
        null,
        fileName
      );

    }

  });


const upload =
  multer({

    storage,

    limits: {
      fileSize: 8 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

      const extension =
        path.extname(
          file.originalname
        ).toLowerCase();

      const allowed = [
        ".pdf",
        ".png",
        ".jpg",
        ".jpeg"
      ];

      const valid =
        allowed.includes(extension);

      if (!valid) {

        return cb(
          new Error(
            "Only PDF, JPG, JPEG and PNG files are allowed."
          )
        );

      }

      cb(null, true);

    }

  });


/* ================================
   HEALTH
================================ */

app.get(
  "/api/health",
  (req, res) => {

    res.json({
      ok: true,
      service: "CareGesture AI",
      time: new Date().toISOString(),
      database: fs.existsSync(dbFile)
    });

  }
);


/* ================================
   STATE
================================ */

app.get(
  "/api/state",
  (req, res) => {

    res.json(read());

  }
);


app.get(
  "/api/users",
  (req, res) => {

    res.json(
      read().users
    );

  }
);


/* ================================
   ALERTS
================================ */

app.get(
  "/api/alerts",
  (req, res) => {

    res.json(
      read().alerts
    );

  }
);


app.post(
  "/api/alerts",
  (req, res) => {

    try {

      const body =
        req.body || {};

      const patientId =
        String(
          body.patientId || ""
        ).trim();

      const message =
        String(
          body.message || ""
        ).trim();


      if (!patientId || !message) {

        return res.status(400).json({

          ok: false,

          error:
            "patientId and message are required"

        });

      }


      const db =
        read();


      const confidence =
        Number(body.confidence);


      const alert = {

        id:
          generateId("AL"),

        patientId,

        patientName:
          String(
            body.patientName ||
            "Demo Patient"
          ),

        room:
          String(
            body.room || "-"
          ),

        bed:
          String(
            body.bed || "-"
          ),

        gesture:
          String(
            body.gesture ||
            "Manual"
          ),

        message,

        language:
          ["en", "kn", "hi"].includes(
            String(body.language)
          )
            ? String(body.language)
            : "en",

        priority:
          ["Normal", "High", "Critical"].includes(
            String(body.priority)
          )
            ? String(body.priority)
            : "Normal",

        confidence:
          Number.isFinite(confidence)
            ? Math.max(
                0,
                Math.min(
                  100,
                  confidence
                )
              )
            : 0,

        status: "New",

        createdAt:
          new Date().toISOString(),

        acknowledgedAt: null,

        resolvedAt: null

      };


      db.alerts.unshift(
        alert
      );


      write(db);


      return res
        .status(201)
        .json({
          ok: true,
          ...alert
        });


    } catch (error) {

      console.error(
        "ALERT SAVE ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          ok: false,

          error:
            "Alert could not be saved",

          detail:
            error.message

        });

    }

  }
);


app.patch(
  "/api/alerts/:id",
  (req, res) => {

    try {

      const db =
        read();


      const alert =
        db.alerts.find(

          (item) =>

            String(item.id) ===
            String(req.params.id)

        );


      if (!alert) {

        return res
          .status(404)
          .json({

            ok: false,

            error:
              "Alert not found"

          });

      }


      const action =
        String(
          req.body?.action || ""
        );


      const now =
        new Date().toISOString();


      if (
        action === "acknowledge"
      ) {

        alert.status =
          "Acknowledged";

        alert.acknowledgedAt =
          now;

      }

      else if (
        action === "resolve"
      ) {

        alert.status =
          "Resolved";

        alert.resolvedAt =
          now;

      }

      else if (
        action === "escalate"
      ) {

        alert.status =
          "Escalated";

        alert.priority =
          "Critical";

      }

      else {

        return res
          .status(400)
          .json({

            ok: false,

            error:
              "Invalid action"

          });

      }


      write(db);


      return res.json({

        ok: true,

        ...alert

      });


    } catch (error) {

      console.error(
        "ALERT UPDATE ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          ok: false,

          error:
            "Alert update failed",

          detail:
            error.message

        });

    }

  }
);


/* ================================
   REPORTS
================================ */

app.get(
  "/api/reports",
  (req, res) => {

    res.json(
      read().reports
    );

  }
);


app.post(
  "/api/reports",

  upload.single("report"),

  (req, res) => {

    try {

      if (!req.file) {

        return res
          .status(400)
          .json({

            ok: false,

            error:
              "No report uploaded"

          });

      }


      const db =
        read();


      const report = {

        id:
          generateId("REP"),

        patientId:
          String(
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
          "Document uploaded successfully."

      };


      db.reports.unshift(
        report
      );


      write(db);


      return res
        .status(201)
        .json(report);


    } catch (error) {

      console.error(
        "REPORT ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          ok: false,

          error:
            "Report could not be saved"

        });

    }

  }
);


/* ================================
   APPOINTMENTS
================================ */

app.get(
  "/api/appointments",
  (req, res) => {

    res.json(
      read().appointments
    );

  }
);


app.post(
  "/api/appointments",
  (req, res) => {

    try {

      const body =
        req.body || {};


      if (
        !body.date ||
        !body.time
      ) {

        return res
          .status(400)
          .json({

            ok: false,

            error:
              "Date and time are required"

          });

      }


      const db =
        read();


      const appointment = {

        id:
          Date.now(),

        patientId:
          String(
            body.patientId ||
            "P1001"
          ),

        doctor:
          String(
            body.doctor ||
            "Dr. Ananya"
          ),

        date:
          String(body.date),

        time:
          String(body.time),

        status:
          "Scheduled",

        createdAt:
          new Date().toISOString()

      };


      db.appointments.unshift(
        appointment
      );


      write(db);


      return res
        .status(201)
        .json(
          appointment
        );


    } catch (error) {

      console.error(
        "APPOINTMENT ERROR:",
        error
      );


      return res
        .status(500)
        .json({

          ok: false,

          error:
            "Appointment could not be saved"

        });

    }

  }
);


/* ================================
   UPLOAD FILE ACCESS
================================ */

app.get(
  "/uploads/:filename",
  (req, res) => {

    const fileName =
      path.basename(
        req.params.filename
      );


    const filePath =
      path.join(
        uploadDir,
        fileName
      );


    if (
      fs.existsSync(filePath)
    ) {

      return res.sendFile(
        filePath
      );

    }


    return res
      .status(404)
      .json({

        ok: false,

        error:
          "File not found"

      });

  }
);


/* ================================
   MAIN PAGE
================================ */

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


/* ================================
   SPA FALLBACK
================================ */

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


/* ================================
   404
================================ */

app.use(
  (req, res) => {

    res
      .status(404)
      .json({

        ok: false,

        error:
          "Route not found"

      });

  }
);


/* ================================
   ERROR HANDLER
================================ */

app.use(
  (error, req, res, next) => {

    console.error(
      "SERVER ERROR:",
      error
    );


    res
      .status(400)
      .json({

        ok: false,

        error:
          error.message ||
          "Request failed"

      });

  }
);


/* ================================
   START SERVER
================================ */

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `CareGesture AI running on port ${PORT}`
    );

  }
);
