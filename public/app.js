"use strict";

let state = {
  users: [],
  alerts: [],
  reports: [],
  appointments: []
};

let currentFilter = "all";
let camera = null;
let stream = null;
let hands = null;
let toastTimer = null;
let processingFrame = false;

const translations = {
  en: {
    water: "Patient is requesting water.",
    food: "Patient is requesting food.",
    nurse: "Patient is requesting a nurse.",
    help: "Patient needs assistance.",
    stop: "Patient indicates stop / no.",
    emergency: "EMERGENCY: Patient needs immediate assistance.",
    ack: "Your request has been received. A nurse has been notified.",
    voiceWater: "Patient in Room {room}, Bed {bed} is requesting water.",
    voiceFood: "Patient in Room {room}, Bed {bed} is requesting food.",
    voiceNurse: "Patient in Room {room}, Bed {bed} is requesting a nurse.",
    voiceHelp: "Patient in Room {room}, Bed {bed} needs assistance.",
    voiceStop: "Patient in Room {room}, Bed {bed} indicates stop or no.",
    voiceEmergency: "Emergency. Patient in Room {room}, Bed {bed} needs immediate assistance."
  },
  kn: {
    water: "ರೋಗಿಯು ನೀರನ್ನು ಕೇಳುತ್ತಿದ್ದಾರೆ.",
    food: "ರೋಗಿಯು ಆಹಾರವನ್ನು ಕೇಳುತ್ತಿದ್ದಾರೆ.",
    nurse: "ರೋಗಿಗೆ ನರ್ಸ್ ಸಹಾಯ ಬೇಕಾಗಿದೆ.",
    help: "ರೋಗಿಗೆ ಸಹಾಯ ಬೇಕಾಗಿದೆ.",
    stop: "ರೋಗಿಯು ನಿಲ್ಲಿಸಿ / ಬೇಡ ಎಂದು ಸೂಚಿಸುತ್ತಿದ್ದಾರೆ.",
    emergency: "ತುರ್ತು ಪರಿಸ್ಥಿತಿ: ರೋಗಿಗೆ ತಕ್ಷಣದ ಸಹಾಯ ಬೇಕಾಗಿದೆ.",
    ack: "ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಸ್ವೀಕರಿಸಲಾಗಿದೆ. ನರ್ಸ್‌ಗೆ ಮಾಹಿತಿ ನೀಡಲಾಗಿದೆ.",
    voiceWater: "ರೂಮ್ {room}, ಬೆಡ್ {bed} ರೋಗಿಯು ನೀರನ್ನು ಕೇಳುತ್ತಿದ್ದಾರೆ.",
    voiceFood: "ರೂಮ್ {room}, ಬೆಡ್ {bed} ರೋಗಿಯು ಆಹಾರವನ್ನು ಕೇಳುತ್ತಿದ್ದಾರೆ.",
    voiceNurse: "ರೂಮ್ {room}, ಬೆಡ್ {bed} ರೋಗಿಗೆ ನರ್ಸ್ ಸಹಾಯ ಬೇಕಾಗಿದೆ.",
    voiceHelp: "ರೂಮ್ {room}, ಬೆಡ್ {bed} ರೋಗಿಗೆ ಸಹಾಯ ಬೇಕಾಗಿದೆ.",
    voiceStop: "ರೂಮ್ {room}, ಬೆಡ್ {bed} ರೋಗಿಯು ನಿಲ್ಲಿಸಿ ಅಥವಾ ಬೇಡ ಎಂದು ಸೂಚಿಸುತ್ತಿದ್ದಾರೆ.",
    voiceEmergency: "ತುರ್ತು ಪರಿಸ್ಥಿತಿ. ರೂಮ್ {room}, ಬೆಡ್ {bed} ರೋಗಿಗೆ ತಕ್ಷಣದ ಸಹಾಯ ಬೇಕಾಗಿದೆ."
  },
  hi: {
    water: "मरीज़ पानी मांग रहे हैं।",
    food: "मरीज़ खाना मांग रहे हैं।",
    nurse: "मरीज़ को नर्स की सहायता चाहिए।",
    help: "मरीज़ को सहायता चाहिए।",
    stop: "मरीज़ रुकने या नहीं का संकेत दे रहे हैं।",
    emergency: "आपातकाल: मरीज़ को तुरंत सहायता चाहिए।",
    ack: "आपका अनुरोध प्राप्त हो गया है। नर्स को सूचित कर दिया गया है।",
    voiceWater: "कमरा {room}, बेड {bed} में मरीज़ पानी मांग रहे हैं।",
    voiceFood: "कमरा {room}, बेड {bed} में मरीज़ खाना मांग रहे हैं।",
    voiceNurse: "कमरा {room}, बेड {bed} में मरीज़ को नर्स की सहायता चाहिए।",
    voiceHelp: "कमरा {room}, बेड {bed} में मरीज़ को सहायता चाहिए।",
    voiceStop: "कमरा {room}, बेड {bed} में मरीज़ रुकने या नहीं का संकेत दे रहे हैं।",
    voiceEmergency: "आपातकाल। कमरा {room}, बेड {bed} में मरीज़ को तुरंत सहायता चाहिए।"
  }
};

const langNames = {
  en: "English",
  kn: "Kannada",
  hi: "Hindi"
};

const voiceLangs = {
  en: "en-IN",
  kn: "kn-IN",
  hi: "hi-IN"
};

document.addEventListener("DOMContentLoaded", async () => {
  initializeNavigation();
  initializeRole();
  initializeLanguage();
  initializeGestures();
  initializeFilters();
  initializeButtons();
  initializeForms();
  await refresh();
  initHands();
});

function $(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const element = $(id);
  if (element) {
    element.textContent = value;
  }
}

function getValue(id, fallback = "") {
  const element = $(id);
  return element && element.value ? element.value : fallback;
}

function getLang() {
  const select = $("languageSelect");
  return select && translations[select.value]
    ? select.value
    : "en";
}

function initializeNavigation() {
  document.querySelectorAll(".nav").forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.page) {
        showPage(button.dataset.page);
      }
    });
  });
}

function showPage(id) {
  const page = $(id);

  if (!page) {
    return;
  }

  document.querySelectorAll(".page").forEach(element => {
    element.classList.remove("active");
  });

  page.classList.add("active");

  document.querySelectorAll(".nav").forEach(element => {
    element.classList.toggle(
      "active",
      element.dataset.page === id
    );
  });

  const titles = {
    dashboard: "Nurse Dashboard",
    gesture: "Gesture Communication",
    alerts: "Alert Center",
    patient: "Patient Care",
    reports: "Medical Reports",
    appointments: "Appointments",
    analytics: "Analytics"
  };

  setText(
    "pageTitle",
    titles[id] || "CareGesture AI"
  );

  renderAll();
}

function initializeRole() {
  const element = $("roleSelect");

  if (element) {
    element.addEventListener("change", updateRole);
  }
}

function updateRole() {
  const role = getValue("roleSelect", "nurse");

  const names = {
    patient: "Patient Portal",
    nurse: "Nurse Dashboard",
    doctor: "Doctor Dashboard",
    admin: "Admin Dashboard"
  };

  setText(
    "roleLabel",
    role.charAt(0).toUpperCase() + role.slice(1)
  );

  setText(
    "pageTitle",
    names[role] || "CareGesture AI"
  );

  showToast(
    "Viewing " + (names[role] || "CareGesture AI")
  );
}

function initializeLanguage() {
  const element = $("languageSelect");

  if (element) {
    element.addEventListener("change", () => {
      renderAll();
      showToast(
        "Language changed to " +
        (langNames[getLang()] || "English")
      );
    });
  }
}

function initializeGestures() {
  document.querySelectorAll(".gesture-btn").forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.gesture) {
        createAlert(button.dataset.gesture, 0.96);
      }
    });
  });
}

function initializeFilters() {
  document.querySelectorAll(".filter").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach(element => {
        element.classList.remove("active");
      });

      button.classList.add("active");
      currentFilter = button.dataset.filter || "all";
      renderAlerts();
    });
  });
}

function initializeButtons() {
  const notifyButton = $("notifyBtn");
  const cameraButton = $("cameraBtn");
  const stopButton = $("stopCameraBtn");

  if (notifyButton) {
    notifyButton.addEventListener(
      "click",
      enableNotifications
    );
  }

  if (cameraButton) {
    cameraButton.addEventListener(
      "click",
      startCamera
    );
  }

  if (stopButton) {
    stopButton.addEventListener(
      "click",
      stopCamera
    );
  }
}

function initializeForms() {
  const reportForm = $("reportForm");
  const appointmentForm = $("appointmentForm");

  if (reportForm) {
    reportForm.addEventListener(
      "submit",
      uploadReport
    );
  }

  if (appointmentForm) {
    appointmentForm.addEventListener(
      "submit",
      addAppointment
    );
  }
}

async function apiRequest(url, options = {}) {
  try {
    const config = {
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : {
              "Content-Type": "application/json"
            }),
        ...(options.headers || {})
      }
    };

    const response = await fetch(url, config);

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        data?.error ||
        data?.message ||
        `Request failed (${response.status})`
      );
    }

    return data;
  } catch (error) {
    console.error("API error:", error);
    throw error;
  }
}

async function refresh() {
  try {
    const data = await apiRequest("/api/state");

    state = {
      users: Array.isArray(data?.users)
        ? data.users
        : [],
      alerts: Array.isArray(data?.alerts)
        ? data.alerts
        : [],
      reports: Array.isArray(data?.reports)
        ? data.reports
        : [],
      appointments: Array.isArray(data?.appointments)
        ? data.appointments
        : []
    };

    renderAll();

    return state;
  } catch (error) {
    console.error(
      "State refresh failed:",
      error
    );

    showToast(
      "Server connection error. Please check the server."
    );

    renderAll();

    return state;
  }
}

function renderAll() {
  renderDashboard();
  renderAlerts();
  renderReports();
  renderAppointments();
  renderAnalytics();
}

function renderDashboard() {
  const alerts = Array.isArray(state.alerts)
    ? state.alerts
    : [];

  const active = alerts.filter(
    alert => alert.status !== "Resolved"
  );

  const critical = alerts.filter(
    alert =>
      alert.priority === "Critical" &&
      alert.status !== "Resolved"
  );

  setText("activeCount", active.length);
  setText("criticalCount", critical.length);

  const confident = alerts.filter(
    alert =>
      typeof alert.confidence === "number" &&
      alert.confidence > 0
  );

  if (confident.length) {
    const average =
      confident.reduce(
        (sum, alert) =>
          sum + Number(alert.confidence || 0),
        0
      ) / confident.length;

    setText(
      "confidenceStat",
      Math.round(average * 100) + "%"
    );
  } else {
    setText("confidenceStat", "—");
  }

  const today = new Date().toDateString();

  const todayCount = alerts.filter(alert => {
    const date = new Date(alert.createdAt);

    return (
      !Number.isNaN(date.getTime()) &&
      date.toDateString() === today
    );
  }).length;

  setText("todayCount", todayCount);

  const recent = alerts.slice(0, 5);
  const container = $("recentAlerts");

  if (!container) {
    return;
  }

  container.innerHTML = recent.length
    ? recent.map(alert => alertHTML(alert)).join("")
    : '<p class="hint">No alerts yet. Open Gesture Communication to create a demo alert.</p>';
}

function alertHTML(alert, actions = true) {
  if (!alert) {
    return "";
  }

  const cls =
    alert.status === "Resolved"
      ? "resolved"
      : alert.priority === "Critical"
      ? "critical"
      : alert.priority === "High"
      ? "high"
      : "";

  const confidence =
    typeof alert.confidence === "number" &&
    alert.confidence > 0
      ? Math.round(alert.confidence * 100) + "%"
      : "Manual";

  const date = alert.createdAt
    ? new Date(alert.createdAt)
    : null;

  const dateText =
    date && !Number.isNaN(date.getTime())
      ? date.toLocaleString()
      : "";

  let buttons = "";

  if (actions) {
    if (alert.status === "New") {
      buttons += `
        <button
          class="outline mini"
          onclick="alertAction('${safeJS(alert.id)}','acknowledge')"
        >
          ✓ Acknowledge
        </button>
      `;
    }

    if (alert.status !== "Resolved") {
      buttons += `
        <button
          class="outline mini"
          onclick="alertAction('${safeJS(alert.id)}','resolve')"
        >
          Resolve
        </button>
      `;
    }

    if (
      alert.status !== "Resolved" &&
      alert.priority !== "Critical"
    ) {
      buttons += `
        <button
          class="outline mini"
          onclick="alertAction('${safeJS(alert.id)}','escalate')"
        >
          🚨 Escalate
        </button>
      `;
    }
  }

  return `
    <div class="alert ${cls}">
      <div class="alert-top">
        <div class="alert-main">
          <div class="alert-icon">
            ${iconFor(alert.gesture)}
          </div>

          <div>
            <h4>
              ${escapeHTML(alert.message)}
            </h4>

            <p>
              ${escapeHTML(alert.patientName)}
              · Room ${escapeHTML(alert.room)}
              · Bed ${escapeHTML(alert.bed)}
            </p>
          </div>
        </div>

        <span class="badge">
          ${escapeHTML(alert.status)}
        </span>
      </div>

      <p style="margin-top:9px">
        Gesture:
        ${escapeHTML(alert.gesture)}
        · Confidence:
        ${confidence}
        · ${escapeHTML(dateText)}
      </p>

      ${
        actions
          ? `
            <div class="alert-actions">
              ${buttons}
            </div>
          `
          : ""
      }
    </div>
  `;
}

function renderAlerts() {
  const container = $("alertList");

  if (!container) {
    return;
  }

  let alerts = Array.isArray(state.alerts)
    ? [...state.alerts]
    : [];

  if (currentFilter === "New") {
    alerts = alerts.filter(
      alert => alert.status === "New"
    );
  }

  if (currentFilter === "Critical") {
    alerts = alerts.filter(
      alert => alert.priority === "Critical"
    );
  }

  if (currentFilter === "Acknowledged") {
    alerts = alerts.filter(
      alert => alert.status === "Acknowledged"
    );
  }

  if (currentFilter === "Resolved") {
    alerts = alerts.filter(
      alert => alert.status === "Resolved"
    );
  }

  container.innerHTML = alerts.length
    ? alerts.map(alert => alertHTML(alert)).join("")
    : '<p class="hint">No alerts in this filter.</p>';
}

async function alertAction(id, action) {
  if (!id || !action) {
    return;
  }

  try {
    const alert = await apiRequest(
      "/api/alerts/" + encodeURIComponent(id),
      {
        method: "PATCH",
        body: JSON.stringify({
          action
        })
      }
    );

    if (action === "acknowledge") {
      speak(
        translations[getLang()].ack
      );
    }

    if (action === "escalate") {
      notifyUser(
        "🚨 " +
        (alert?.message || "Alert escalated")
      );
    }

    showToast(
      action === "acknowledge"
        ? "Alert acknowledged"
        : action === "resolve"
        ? "Alert resolved"
        : action === "escalate"
        ? "Alert escalated"
        : "Alert updated"
    );

    await refresh();
  } catch (error) {
    console.error(
      "Alert action failed:",
      error
    );

    showToast(
      error.message ||
      "Could not update alert"
    );
  }
}

async function createAlert(type, confidence = 0.96) {
  if (!type) {
    return;
  }

  const lang = getLang();
  const t =
    translations[lang] ||
    translations.en;

  const patientId =
    getValue("patientId", "P1001");

  const room =
    getValue("room", "204");

  const bed =
    getValue("bed", "3");

  const patient = state.users.find(
    user =>
      String(user.id) ===
      String(patientId)
  );

  const keyMap = {
    water: "water",
    food: "food",
    nurse: "nurse",
    help: "help",
    stop: "stop",
    emergency: "emergency"
  };

  const key =
    keyMap[type] ||
    "help";

  const priority =
    type === "emergency"
      ? "Critical"
      : type === "help" ||
        type === "nurse"
      ? "High"
      : "Normal";

  const body = {
    patientId,
    patientName:
      patient?.name ||
      "Demo Patient",
    room,
    bed,
    gesture: type,
    message: t[key],
    language: lang,
    priority,
    confidence:
      Number(confidence) || 0
  };

  try {
    const alert = await apiRequest(
      "/api/alerts",
      {
        method: "POST",
        body: JSON.stringify(body)
      }
    );

    const badge =
      $("detectedBadge");

    if (badge) {
      badge.textContent =
        type.toUpperCase() +
        " · " +
        Math.round(
          (Number(confidence) || 0) * 100
        ) +
        "%";
    }

    speak(
      voiceText(
        type,
        room,
        bed,
        lang
      )
    );

    notifyUser(
      (type === "emergency"
        ? "🚨 "
        : "✋ ") +
      (alert?.message || t[key])
    );

    showToast(
      "Alert sent to care team"
    );

    await refresh();
  } catch (error) {
    console.error(
      "Create alert failed:",
      error
    );

    showToast(
      error.message ||
      "Failed to create alert"
    );
  }
}

function voiceText(
  type,
  room,
  bed,
  lang
) {
  const language =
    translations[lang] ||
    translations.en;

  const keyMap = {
    water: "voiceWater",
    food: "voiceFood",
    nurse: "voiceNurse",
    help: "voiceHelp",
    stop: "voiceStop",
    emergency: "voiceEmergency"
  };

  const key =
    keyMap[type] ||
    "voiceHelp";

  return language[key]
    .replace(
      "{room}",
      String(room)
    )
    .replace(
      "{bed}",
      String(bed)
    );
}

function speak(text) {
  if (
    !text ||
    !("speechSynthesis" in window) ||
    !("SpeechSynthesisUtterance" in window)
  ) {
    return;
  }

  try {
    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        String(text)
      );

    utterance.lang =
      voiceLangs[getLang()] ||
      "en-IN";

    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.volume = 1;

    window.speechSynthesis.speak(
      utterance
    );
  } catch (error) {
    console.warn(
      "Speech synthesis failed:",
      error
    );
  }
}

async function enableNotifications() {
  if (!("Notification" in window)) {
    showToast(
      "Browser notifications are not supported."
    );
    return;
  }

  try {
    const permission =
      await Notification.requestPermission();

    if (permission === "granted") {
      showToast(
        "Notifications enabled"
      );
    } else if (permission === "denied") {
      showToast(
        "Notification permission was denied."
      );
    } else {
      showToast(
        "Notification permission not granted"
      );
    }
  } catch (error) {
    console.error(
      "Notification error:",
      error
    );

    showToast(
      "Unable to enable notifications."
    );
  }
}

function notifyUser(text) {
  if (
    !text ||
    !("Notification" in window) ||
    Notification.permission !== "granted"
  ) {
    return;
  }

  try {
    new Notification(
      "CareGesture AI",
      {
        body: String(text)
      }
    );
  } catch (error) {
    console.warn(
      "Notification failed:",
      error
    );
  }
}

function initHands() {
  if (typeof Hands === "undefined") {
    console.warn(
      "MediaPipe Hands library is not loaded."
    );
    return;
  }

  try {
    hands = new Hands({
      locateFile: file =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });

    hands.onResults(
      handleHandResults
    );
  } catch (error) {
    console.error(
      "MediaPipe initialization failed:",
      error
    );

    hands = null;

    showToast(
      "Gesture AI could not be initialized."
    );
  }
}

function handleHandResults(results) {
  const canvas =
    $("outputCanvas");

  const video =
    $("inputVideo");

  if (!canvas || !video) {
    return;
  }

  const ctx =
    canvas.getContext("2d");

  if (!ctx) {
    return;
  }

  if (
    video.videoWidth > 0 &&
    video.videoHeight > 0
  ) {
    if (
      canvas.width !== video.videoWidth ||
      canvas.height !== video.videoHeight
    ) {
      canvas.width =
        video.videoWidth;

      canvas.height =
        video.videoHeight;
    }
  }

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  const landmarks =
    results?.multiHandLandmarks;

  if (
    !landmarks ||
    !landmarks.length
  ) {
    return;
  }

  const hand =
    landmarks[0];

  try {
    if (
      typeof drawConnectors === "function" &&
      typeof HAND_CONNECTIONS !== "undefined"
    ) {
      drawConnectors(
        ctx,
        hand,
        HAND_CONNECTIONS,
        {
          color: "#62a0ff",
          lineWidth: 3
        }
      );
    }

    if (
      typeof drawLandmarks === "function"
    ) {
      drawLandmarks(
        ctx,
        hand,
        {
          color: "#fff",
          lineWidth: 1
        }
      );
    }
  } catch (error) {
    console.warn(
      "Landmark drawing failed:",
      error
    );
  }

  let gesture = null;

  try {
    gesture =
      classifyGesture(hand);
  } catch (error) {
    console.warn(
      "Gesture classification failed:",
      error
    );
  }

  if (gesture) {
    const badge =
      $("detectedBadge");

    if (badge) {
      badge.textContent =
        gesture.toUpperCase() +
        " · AI detected";
    }
  }
}

function classifyGesture(landmarks) {
  if (
    !Array.isArray(landmarks) ||
    landmarks.length < 21
  ) {
    return null;
  }

  const tips = [
    8,
    12,
    16,
    20
  ];

  const pips = [
    6,
    10,
    14,
    18
  ];

  const extended =
    tips.map(
      (tip, index) => {
        const tipPoint =
          landmarks[tip];

        const pipPoint =
          landmarks[pips[index]];

        if (
          !tipPoint ||
          !pipPoint
        ) {
          return false;
        }

        return (
          tipPoint.y <
          pipPoint.y
        );
      }
    );

  const count =
    extended.filter(Boolean).length;

  if (count === 4) {
    return "help";
  }

  if (
    extended[0] &&
    extended[1] &&
    !extended[2] &&
    !extended[3]
  ) {
    return "food";
  }

  if (
    extended[0] &&
    !extended[1] &&
    !extended[2] &&
    !extended[3]
  ) {
    return "water";
  }

  return null;
}

async function startCamera() {
  if (
    !navigator.mediaDevices ||
    !navigator.mediaDevices.getUserMedia
  ) {
    showToast(
      "Camera access is not supported by this browser."
    );
    return;
  }

  if (typeof Camera === "undefined") {
    showToast(
      "MediaPipe Camera library is not loaded."
    );
    return;
  }

  if (!hands) {
    initHands();
  }

  if (!hands) {
    showToast(
      "Gesture AI is unavailable."
    );
    return;
  }

  try {
    stopCamera(false);

    stream =
      await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user"
        },
        audio: false
      });

    const video =
      $("inputVideo");

    if (!video) {
      throw new Error(
        "Camera video element was not found."
      );
    }

    video.srcObject = stream;

    try {
      await video.play();
    } catch (error) {
      console.warn(
        "Video playback failed:",
        error
      );
    }

    setText(
      "cameraStatus",
      "Camera active · processing locally"
    );

    camera = new Camera(
      video,
      {
        onFrame: async () => {
          if (
            !hands ||
            processingFrame ||
            video.readyState < 2
          ) {
            return;
          }

          processingFrame = true;

          try {
            await hands.send({
              image: video
            });
          } catch (error) {
            console.error(
              "MediaPipe frame error:",
              error
            );
          } finally {
            processingFrame = false;
          }
        },
        width: 640,
        height: 400
      }
    );

    camera.start();

    showToast(
      "Camera started"
    );
  } catch (error) {
    console.error(
      "Camera error:",
      error
    );

    stopCamera(false);

    let message =
      "Camera permission was denied or unavailable.";

    if (
      error?.name === "NotAllowedError"
    ) {
      message =
        "Camera permission was denied.";
    } else if (
      error?.name === "NotFoundError"
    ) {
      message =
        "No camera was found.";
    } else if (
      error?.name === "NotReadableError"
    ) {
      message =
        "Camera is already being used by another application.";
    }

    showToast(message);
  }
}

function stopCamera(showMessage = true) {
  try {
    if (camera) {
      if (
        typeof camera.stop === "function"
      ) {
        camera.stop();
      }

      camera = null;
    }
  } catch (error) {
    console.warn(
      "Camera stop failed:",
      error
    );

    camera = null;
  }

  try {
    if (stream) {
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {}
      });

      stream = null;
    }
  } catch {
    stream = null;
  }

  const video =
    $("inputVideo");

  if (video) {
    try {
      video.pause();
    } catch {}

    video.srcObject = null;
  }

  setText(
    "cameraStatus",
    "Camera is off"
  );

  const canvas =
    $("outputCanvas");

  if (canvas) {
    const ctx =
      canvas.getContext("2d");

    if (ctx) {
      ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
      );
    }
  }

  processingFrame = false;

  if (showMessage) {
    showToast(
      "Camera stopped"
    );
  }
}

async function uploadReport(event) {
  event.preventDefault();

  const form =
    event.currentTarget;

  if (!form) {
    return;
  }

  try {
    const formData =
      new FormData(form);

    const data =
      await apiRequest(
        "/api/reports",
        {
          method: "POST",
          body: formData
        }
      );

    form.reset();

    showToast(
      data?.message ||
      "Report uploaded"
    );

    await refresh();
  } catch (error) {
    console.error(
      "Report upload failed:",
      error
    );

    showToast(
      error.message ||
      "Upload failed"
    );
  }
}

function renderReports() {
  const container =
    $("reportList");

  if (!container) {
    return;
  }

  const reports =
    Array.isArray(state.reports)
      ? state.reports
      : [];

  container.innerHTML =
    reports.length
      ? reports.map(report => {
          const date =
            report.uploadedAt
              ? new Date(report.uploadedAt)
              : null;

          const dateText =
            date &&
            !Number.isNaN(date.getTime())
              ? date.toLocaleString()
              : "";

          return `
            <div class="table-row">
              <span>
                <b>
                  ${escapeHTML(
                    report.originalName
                  )}
                </b>
                <small>
                  ${escapeHTML(
                    report.patientId
                  )}
                </small>
              </span>

              <span>
                ${escapeHTML(
                  report.type
                )}
              </span>

              <span>
                ${escapeHTML(
                  dateText
                )}
              </span>

              <span>
                Intake complete
              </span>
            </div>
          `;
        }).join("")
      : '<p class="hint">No reports uploaded.</p>';
}

async function addAppointment(event) {
  event.preventDefault();

  const form =
    event.currentTarget;

  if (!form) {
    return;
  }

  try {
    const formData =
      new FormData(form);

    const body =
      Object.fromEntries(
        formData.entries()
      );

    await apiRequest(
      "/api/appointments",
      {
        method: "POST",
        body: JSON.stringify(body)
      }
    );

    form.reset();

    showToast(
      "Appointment scheduled"
    );

    await refresh();
  } catch (error) {
    console.error(
      "Appointment error:",
      error
    );

    showToast(
      error.message ||
      "Could not schedule appointment"
    );
  }
}

function renderAppointments() {
  const container =
    $("appointmentList");

  if (!container) {
    return;
  }

  const appointments =
    Array.isArray(state.appointments)
      ? state.appointments
      : [];

  container.innerHTML =
    appointments.length
      ? appointments.map(appointment => `
          <div class="table-row">
            <span>
              <b>
                ${escapeHTML(
                  appointment.patientId
                )}
              </b>
            </span>

            <span>
              ${escapeHTML(
                appointment.doctor
              )}
            </span>

            <span>
              ${escapeHTML(
                appointment.date
              )}
              ${escapeHTML(
                appointment.time
              )}
            </span>

            <span>
              ${escapeHTML(
                appointment.status
              )}
            </span>
          </div>
        `).join("")
      : '<p class="hint">No appointments.</p>';
}

function renderAnalytics() {
  const alerts =
    Array.isArray(state.alerts)
      ? state.alerts
      : [];

  const appointments =
    Array.isArray(state.appointments)
      ? state.appointments
      : [];

  setText(
    "aTotal",
    alerts.length
  );

  setText(
    "aResolved",
    alerts.filter(
      alert =>
        alert.status === "Resolved"
    ).length
  );

  setText(
    "aEscalated",
    alerts.filter(
      alert =>
        alert.status === "Escalated"
    ).length
  );

  setText(
    "aAppointments",
    appointments.length
  );

  const counts = {};

  alerts.forEach(alert => {
    const gesture =
      alert.gesture || "unknown";

    counts[gesture] =
      (counts[gesture] || 0) + 1;
  });

  const values =
    Object.values(counts);

  const max =
    Math.max(
      1,
      ...values
    );

  const container =
    $("gestureBars");

  if (!container) {
    return;
  }

  container.innerHTML =
    Object.keys(counts).length
      ? Object.entries(counts)
          .map(([key, value]) => `
            <div class="bar">
              <div
                style="display:flex;justify-content:space-between;font-size:12px"
              >
                <span>
                  ${escapeHTML(key)}
                </span>

                <b>
                  ${value}
                </b>
              </div>

              <div class="bar-line">
                <div
                  class="bar-fill"
                  style="width:${(value / max) * 100}%"
                ></div>
              </div>
            </div>
          `)
          .join("")
      : '<p class="hint">Create gesture alerts to see analytics.</p>';
}

function iconFor(gesture) {
  const icons = {
    water: "💧",
    food: "🍲",
    nurse: "🧑‍⚕️",
    help: "🤚",
    stop: "✋",
    emergency: "🚨"
  };

  return icons[gesture] || "🔔";
}

function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[character])
  );
}

function safeJS(value) {
  return String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
}

function showToast(message) {
  const toast =
    $("toast");

  if (!toast) {
    return;
  }

  toast.textContent =
    String(message || "");

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer =
    setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
}

window.alertAction = alertAction;
window.createAlert = createAlert;
window.startCamera = startCamera;
window.stopCamera = stopCamera;
window.showPage = showPage;
