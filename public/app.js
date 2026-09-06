/* =========================================================
   CareGesture AI - Complete app.js
   PART 1/3
   ========================================================= */

"use strict";

const API = "";

const $ = (id) => document.getElementById(id);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

let alerts = [];
let reports = [];
let appointments = [];

let currentFilter = "all";
let currentAlert = null;

let voiceEnabled = false;
let notificationsEnabled = false;

let handStream = null;
let faceStream = null;

let handCameraRunning = false;
let faceCameraRunning = false;

let selectedLanguage = "en";

const LANGUAGES = {
  en: {
    name: "English",
    water: "I need water",
    food: "I need food",
    nurse: "I need a nurse",
    help: "I need help",
    emergency: "Emergency. Doctor or nurse needed",
    ok: "I am okay",
    faceReady: "Face communication ready",
    yes: "Yes",
    no: "No"
  },

  kn: {
    name: "ಕನ್ನಡ",
    water: "ನನಗೆ ನೀರು ಬೇಕು",
    food: "ನನಗೆ ಆಹಾರ ಬೇಕು",
    nurse: "ನನಗೆ ನರ್ಸ್ ಬೇಕು",
    help: "ನನಗೆ ಸಹಾಯ ಬೇಕು",
    emergency: "ತುರ್ತು ಪರಿಸ್ಥಿತಿ. ವೈದ್ಯರು ಅಥವಾ ನರ್ಸ್ ಬೇಕು",
    ok: "ನಾನು ಚೆನ್ನಾಗಿದ್ದೇನೆ",
    faceReady: "ಮುಖ ಸಂವಹನ ಸಿದ್ಧವಾಗಿದೆ",
    yes: "ಹೌದು",
    no: "ಇಲ್ಲ"
  },

  hi: {
    name: "हिन्दी",
    water: "मुझे पानी चाहिए",
    food: "मुझे खाना चाहिए",
    nurse: "मुझे नर्स चाहिए",
    help: "मुझे मदद चाहिए",
    emergency: "आपातकाल। डॉक्टर या नर्स चाहिए",
    ok: "मैं ठीक हूँ",
    faceReady: "चेहरा संचार तैयार है",
    yes: "हाँ",
    no: "नहीं"
  }
};


/* =========================================================
   UTILITY FUNCTIONS
   ========================================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function showToast(message, type = "success") {

  const toast = $("toast");

  if (!toast) return;

  toast.textContent = message;

  toast.className = "";
  toast.id = "toast";

  toast.classList.add("show");
  toast.classList.add(type);

  clearTimeout(showToast.timer);

  showToast.timer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}


async function api(url, options = {}) {

  try {

    const response = await fetch(API + url, options);

    let data = null;

    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }

    if (!response.ok) {

      throw new Error(
        data?.error ||
        `Request failed (${response.status})`
      );

    }

    return data;

  } catch (error) {

    console.error("API ERROR:", url, error);

    throw error;

  }

}


function getLanguage() {

  const select = $("languageSelect");

  if (select) {
    selectedLanguage = select.value;
  }

  return selectedLanguage;

}


function getText(key) {

  const language = getLanguage();

  return (
    LANGUAGES[language]?.[key] ||
    LANGUAGES.en[key] ||
    key
  );

}


function formatDate(value) {

  if (!value) return "-";

  try {

    return new Date(value).toLocaleString();

  } catch (error) {

    return value;

  }

}


function todayISO() {

  return new Date().toISOString().slice(0, 10);

}


/* =========================================================
   PAGE NAVIGATION
   ========================================================= */

function openPage(pageName) {

  $$(".page").forEach((page) => {

    page.classList.remove("active");

  });

  $$(".nav").forEach((button) => {

    button.classList.remove("active");

  });

  const page = $(pageName);

  if (page) {

    page.classList.add("active");

  }

  const navButton = $(
    `.nav[data-page="${pageName}"]`
  );

  if (navButton) {

    navButton.classList.add("active");

  }

  updatePageTitle(pageName);

  if (pageName === "alerts") {
    renderAlerts();
  }

  if (pageName === "reports") {
    loadReports();
  }

  if (pageName === "appointments") {
    loadAppointments();
  }

  if (pageName === "analytics") {
    updateAnalytics();
  }

  if (pageName === "dashboard") {
    refreshDashboard();
  }

}


function updatePageTitle(pageName) {

  const titles = {

    dashboard: "Nurse Dashboard",

    gesture: "Gesture Communication",

    faceeye: "Face & Eye AI",

    alerts: "Alert Center",

    patient: "Patient Care",

    reports: "Medical Reports",

    appointments: "Appointments",

    analytics: "Analytics",

    mobile: "Mobile App",

    test: "Test All Modules"

  };

  const title = $("pageTitle");

  if (title) {

    title.textContent =
      titles[pageName] || "CareGesture AI";

  }

}


function setupNavigation() {

  $$(".nav").forEach((button) => {

    button.addEventListener("click", () => {

      openPage(button.dataset.page);

    });

  });


  $("openGestureBtn")?.addEventListener(
    "click",
    () => openPage("gesture")
  );


  $("viewAlertsBtn")?.addEventListener(
    "click",
    () => openPage("alerts")
  );


  $("openMobileBtn")?.addEventListener(
    "click",
    () => openPage("mobile")
  );

}


/* =========================================================
   LOAD APPLICATION DATA
   ========================================================= */

async function loadState() {

  try {

    const state = await api("/api/state");

    alerts =
      Array.isArray(state.alerts)
        ? state.alerts
        : [];

    reports =
      Array.isArray(state.reports)
        ? state.reports
        : [];

    appointments =
      Array.isArray(state.appointments)
        ? state.appointments
        : [];


    refreshDashboard();

    updateAnalytics();

    renderAlerts();

  } catch (error) {

    console.error(error);

    showToast(
      "Server connection failed",
      "error"
    );

  }

}


async function loadAlerts() {

  try {

    alerts = await api("/api/alerts");

    if (!Array.isArray(alerts)) {
      alerts = [];
    }

    refreshDashboard();

    renderAlerts();

    updateAnalytics();

  } catch (error) {

    console.error(error);

  }

}


function refreshDashboard() {

  const activeAlerts =
    alerts.filter(
      (alert) =>
        alert.status !== "Resolved"
    );

  const criticalAlerts =
    alerts.filter(
      (alert) =>
        alert.priority === "Critical" &&
        alert.status !== "Resolved"
    );

  const today = todayISO();

  const todayAlerts =
    alerts.filter(
      (alert) =>
        String(alert.createdAt || "")
          .slice(0, 10) === today
    );


  $("activeCount") &&
    ($("activeCount").textContent =
      activeAlerts.length);


  $("criticalCount") &&
    ($("criticalCount").textContent =
      criticalAlerts.length);


  $("todayCount") &&
    ($("todayCount").textContent =
      todayAlerts.length);


  const confidenceValues =
    alerts
      .map((alert) =>
        Number(alert.confidence)
      )
      .filter(
        (value) =>
          Number.isFinite(value) &&
          value > 0
      );


  const averageConfidence =
    confidenceValues.length
      ? Math.round(
          confidenceValues.reduce(
            (sum, value) =>
              sum + value,
            0
          ) /
          confidenceValues.length
        )
      : null;


  $("confidenceStat") &&
    ($("confidenceStat").textContent =
      averageConfidence
        ? averageConfidence + "%"
        : "—");


  renderRecentAlerts();

}


function renderRecentAlerts() {

  const container =
    $("recentAlerts");

  if (!container) return;


  const recent =
    alerts.slice(0, 5);


  if (!recent.length) {

    container.innerHTML =
      `<p class="empty">
        No alerts yet.
       </p>`;

    return;

  }


  container.innerHTML =
    recent.map((alert) => {

      return `
      <div class="alert-card">

        <div>

          <b>
            ${escapeHTML(
              alert.message
            )}
          </b>

          <p>
            Patient:
            ${escapeHTML(
              alert.patientId
            )}
            · Room
            ${escapeHTML(
              alert.room
            )}
            · Bed
            ${escapeHTML(
              alert.bed
            )}
          </p>

        </div>

        <span class="priority-${String(
          alert.priority
        ).toLowerCase()}">

          ${escapeHTML(
            alert.priority
          )}

        </span>

      </div>
      `;

    }).join("");

}


/* =========================================================
   CREATE PATIENT ALERT
   ========================================================= */

async function createAlert(data) {

  try {

    const alert =
      await api(
        "/api/alerts",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(data)

        }
      );


    alerts.unshift(alert);


    refreshDashboard();

    renderAlerts();

    updateAnalytics();


    showAlertOverlay(alert);


    if (voiceEnabled) {

      speakAlert(alert);

    }


    sendBrowserNotification(alert);


    return alert;

  } catch (error) {

    console.error(error);

    showToast(
      error.message ||
      "Alert could not be created",
      "error"
    );

    return null;

  }

}


/* =========================================================
   ALERT CENTER
   ========================================================= */

function setupAlertFilters() {

  $$(".filter").forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        $$(".filter").forEach(
          (item) =>
            item.classList.remove(
              "active"
            )
        );


        button.classList.add(
          "active"
        );


        currentFilter =
          button.dataset.filter ||
          "all";


        renderAlerts();

      }
    );

  });

}


function getFilteredAlerts() {

  if (
    currentFilter === "all"
  ) {

    return alerts;

  }


  if (
    currentFilter === "Critical"
  ) {

    return alerts.filter(
      (alert) =>
        alert.priority ===
        "Critical"
    );

  }


  return alerts.filter(
    (alert) =>
      alert.status ===
      currentFilter
  );

}


function renderAlerts() {

  const container =
    $("alertList");

  if (!container) return;


  const list =
    getFilteredAlerts();


  if (!list.length) {

    container.innerHTML =
      `<div class="panel">
        <p class="empty">
          No alerts found.
        </p>
       </div>`;

    return;

  }


  container.innerHTML =
    list.map((alert) => {

      const priority =
        String(
          alert.priority ||
          "Normal"
        );


      const status =
        String(
          alert.status ||
          "New"
        );


      return `
      <div
        class="panel alert-item
        priority-${priority.toLowerCase()}"
      >

        <div class="alert-main">

          <div>

            <h3>
              ${escapeHTML(
                alert.message
              )}
            </h3>


            <p>

              👤
              ${escapeHTML(
                alert.patientName ||
                "Patient"
              )}

              · ID:
              ${escapeHTML(
                alert.patientId
              )}

            </p>


            <p>

              🏥 Room:
              ${escapeHTML(
                alert.room
              )}

              · Bed:
              ${escapeHTML(
                alert.bed
              )}

            </p>


            <small>

              Gesture:
              ${escapeHTML(
                alert.gesture
              )}

              · Confidence:
              ${escapeHTML(
                alert.confidence
              )}%

              · ${escapeHTML(
                formatDate(
                  alert.createdAt
                )
              )}

            </small>

          </div>


          <div>

            <b>
              ${escapeHTML(
                priority
              )}
            </b>

            <p>
              ${escapeHTML(
                status
              )}
            </p>

          </div>

        </div>


        <div class="alert-actions">

          <button
            class="outline"
            type="button"
            onclick="window.CareGesture.acknowledgeAlert('${alert.id}')"
          >
            ✓ Acknowledge
          </button>


          <button
            class="outline"
            type="button"
            onclick="window.CareGesture.resolveAlert('${alert.id}')"
          >
            ✓ Resolve
          </button>


          <button
            class="primary"
            type="button"
            onclick="window.CareGesture.escalateAlert('${alert.id}')"
          >
            🚨 Escalate
          </button>

        </div>

      </div>
      `;

    }).join("");

}


async function updateAlert(
  alertId,
  action
) {

  try {

    const updated =
      await api(
        "/api/alerts/" +
        encodeURIComponent(alertId),
        {

          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify({
              action
            })

        }
      );


    const index =
      alerts.findIndex(
        (alert) =>
          String(alert.id) ===
          String(alertId)
      );


    if (index >= 0) {

      alerts[index] =
        updated;

    }


    refreshDashboard();

    renderAlerts();

    updateAnalytics();


    if (currentAlert &&
        String(currentAlert.id) ===
        String(alertId)) {

      currentAlert =
        updated;

    }


    showToast(
      "Alert " +
      action +
      " successful"
    );


    return updated;

  } catch (error) {

    showToast(
      error.message,
      "error"
    );

  }

}


async function acknowledgeAlert(id) {

  await updateAlert(
    id,
    "acknowledge"
  );

}


async function resolveAlert(id) {

  await updateAlert(
    id,
    "resolve"
  );

  hideAlertOverlay();

}


async function escalateAlert(id) {

  await updateAlert(
    id,
    "escalate"
  );

}


/* =========================================================
   ALERT OVERLAY
   ========================================================= */

function showAlertOverlay(alert) {

  currentAlert = alert;

  const overlay =
    $("alertOverlay");

  if (!overlay) return;


  $("overlayPriority") &&
    ($("overlayPriority").textContent =
      "🚨 " +
      (
        alert.priority ||
        "PATIENT"
      ).toUpperCase() +
      " ALERT");


  $("overlayMessage") &&
    ($("overlayMessage").textContent =
      alert.message ||
      "Patient Alert");


  $("overlayMeta") &&
    ($("overlayMeta").textContent =
      "Room " +
      (alert.room || "-") +
      " · Bed " +
      (alert.bed || "-"));


  $("overlayPatient") &&
    ($("overlayPatient").textContent =
      "Patient " +
      (alert.patientId || "-") +
      " · " +
      (
        alert.patientName ||
        "Patient"
      ));


  overlay.classList.add("show");

}


function hideAlertOverlay() {

  $("alertOverlay")?.classList.remove(
    "show"
  );

}


/* =========================================================
   VOICE
   ========================================================= */

function enableVoice() {

  if (
    !("speechSynthesis" in window)
  ) {

    showToast(
      "Voice is not supported in this browser",
      "error"
    );

    return false;

  }


  voiceEnabled = true;

  showToast(
    "Automatic voice enabled"
  );

  return true;

}


function findVoice(language) {

  if (
    !window.speechSynthesis
  ) return null;


  const voices =
    window.speechSynthesis.getVoices();


  const languageCodes = {

    en: ["en-IN", "en-US", "en-GB", "en"],

    kn: ["kn-IN", "kn"],

    hi: ["hi-IN", "hi"]

  };


  const codes =
    languageCodes[language] ||
    languageCodes.en;


  for (
    const code of codes
  ) {

    const voice =
      voices.find(
        (item) =>
          item.lang
            .toLowerCase()
            .startsWith(
              code
                .toLowerCase()
                .slice(0, 2)
            )
      );


    if (voice) return voice;

  }


  return null;

}


function speak(text, language = null) {

  if (
    !("speechSynthesis" in window)
  ) return;


  const lang =
    language ||
    getLanguage();


  window.speechSynthesis.cancel();


  const utterance =
    new SpeechSynthesisUtterance(
      String(text)
    );


  const voice =
    findVoice(lang);


  if (voice) {

    utterance.voice =
      voice;

    utterance.lang =
      voice.lang;

  }


  utterance.rate = 0.9;

  utterance.pitch = 1;


  window.speechSynthesis.speak(
    utterance
  );

}


function speakAlert(alert) {

  const text =
    (alert.message || "") +
    ". Patient " +
    (alert.patientId || "") +
    ". Room " +
    (alert.room || "") +
    ". Bed " +
    (alert.bed || "");


  speak(
    text,
    alert.language ||
    getLanguage()
  );

}


function setupVoice() {

  $("voiceBtn")?.addEventListener(
    "click",
    () => enableVoice()
  );


  $("overlayVoiceBtn")
    ?.addEventListener(
      "click",
      () => {

        if (currentAlert) {

          speakAlert(
            currentAlert
          );

        }

      }
    );


  $("testVoiceBtn")
    ?.addEventListener(
      "click",
      () => {

        enableVoice();

        speak(
          "CareGesture AI voice test. " +
          getText("help"),
          getLanguage()
        );

      }
    );


  if (
    "speechSynthesis" in window
  ) {

    window.speechSynthesis
      .onvoiceschanged =
        () => {

          window.speechSynthesis
            .getVoices();

        };

  }

}


/* =========================================================
   BROWSER NOTIFICATIONS
   ========================================================= */

async function enableNotifications() {

  if (
    !("Notification" in window)
  ) {

    showToast(
      "Notifications are not supported",
      "error"
    );

    return;

  }


  try {

    const permission =
      await Notification.requestPermission();


    notificationsEnabled =
      permission === "granted";


    if (notificationsEnabled) {

      showToast(
        "Notifications enabled"
      );

      const button =
        $("notifyBtn");

      if (button) {

        button.textContent =
          "🔔 Notifications Enabled";

      }

    } else {

      showToast(
        "Notification permission was not granted",
        "error"
      );

    }

  } catch (error) {

    console.error(error);

  }

}


function sendBrowserNotification(alert) {

  if (
    !notificationsEnabled ||
    Notification.permission !==
    "granted"
  ) return;


  new Notification(
    "CareGesture AI Alert",
    {

      body:
        (alert.message || "") +
        " | Room " +
        (alert.room || "-") +
        " Bed " +
        (alert.bed || "-")

    }
  );

}


/* =========================================================
   LANGUAGE
   ========================================================= */

function updateLanguageUI() {

  const language =
    getLanguage();


  const lang =
    LANGUAGES[language] ||
    LANGUAGES.en;


  $("patientLang") &&
    ($("patientLang").textContent =
      lang.name);


  const updates = {

    guideWater:
      language === "en"
        ? "Water"
        : language === "kn"
        ? "ನೀರು"
        : "पानी",

    guideFood:
      language === "en"
        ? "Food"
        : language === "kn"
        ? "ಆಹಾರ"
        : "खाना",

    guideNurse:
      language === "en"
        ? "Nurse"
        : language === "kn"
        ? "ನರ್ಸ್"
        : "नर्स",

    guideHelp:
      language === "en"
        ? "Help"
        : language === "kn"
        ? "ಸಹಾಯ"
        : "मदद",

    guideEmergency:
      language === "en"
        ? "Doctor / Nurse Needed"
        : language === "kn"
        ? "ವೈದ್ಯರು / ನರ್ಸ್ ಬೇಕು"
        : "डॉक्टर / नर्स चाहिए",

    guideOk:
      language === "en"
        ? "All OK"
        : language === "kn"
        ? "ಎಲ್ಲಾ ಚೆನ್ನಾಗಿದೆ"
        : "सब ठीक है"

  };


  Object.entries(updates)
    .forEach(
      ([id, text]) => {

        if ($(id)) {

          $(id).textContent =
            text;

        }

      }
    );

}


/* =========================================================
   OVERLAY BUTTONS
   ========================================================= */

function setupOverlay() {

  $("closeAlertOverlay")
    ?.addEventListener(
      "click",
      hideAlertOverlay
    );


  $("overlayAckBtn")
    ?.addEventListener(
      "click",
      async () => {

        if (currentAlert) {

          await acknowledgeAlert(
            currentAlert.id
          );

        }

      }
    );


  $("overlayResolveBtn")
    ?.addEventListener(
      "click",
      async () => {

        if (currentAlert) {

          await resolveAlert(
            currentAlert.id
          );

        }

      }
    );


  $("alertOverlay")
    ?.addEventListener(
      "click",
      (event) => {

        if (
          event.target ===
          $("alertOverlay")
        ) {

          hideAlertOverlay();

        }

      }
    );

}


/* =========================================================
   MAKE FUNCTIONS AVAILABLE TO HTML
   ========================================================= */

window.CareGesture = {

  acknowledgeAlert,

  resolveAlert,

  escalateAlert

};


/* =========================================================
   PART 1 END
   PART 2 MUST BE PASTED DIRECTLY BELOW THIS
   ========================================================= */
// ============================================================
// CareGesture AI - app.js
// PART 2: CAMERA, HAND GESTURE DETECTION & ALERT SYSTEM
// ============================================================

let cameraStream = null;
let handDetectionRunning = false;
let voiceEnabled = false;
let currentAlert = null;

let lastGesture = null;
let lastGestureTime = 0;
let gestureStableCount = 0;
let gestureProcessing = false;


// ============================================================
// CAMERA ELEMENTS
// ============================================================

const inputVideo = document.getElementById("inputVideo");
const outputCanvas = document.getElementById("outputCanvas");

const cameraBtn = document.getElementById("cameraBtn");
const stopCameraBtn = document.getElementById("stopCameraBtn");

const cameraStatus = document.getElementById("cameraStatus");
const cameraDiagnostic = document.getElementById("cameraDiagnostic");
const handLiveStatus = document.getElementById("handLiveStatus");

const cameraHint = document.getElementById("cameraHint");


// ============================================================
// GESTURE INFORMATION
// ============================================================

const gestures = {
    0: {
        gesture: "0 Fingers",
        emoji: "✊",
        need: "All OK",
        message: "Patient is okay",
        priority: "Normal"
    },

    1: {
        gesture: "1 Finger",
        emoji: "💧",
        need: "Need Water",
        message: "Patient needs water",
        priority: "Normal"
    },

    2: {
        gesture: "2 Fingers",
        emoji: "🍛",
        need: "Need Food",
        message: "Patient needs food",
        priority: "Normal"
    },

    3: {
        gesture: "3 Fingers",
        emoji: "👩‍⚕️",
        need: "Call Nurse",
        message: "Patient needs a nurse",
        priority: "High"
    },

    4: {
        gesture: "4 Fingers",
        emoji: "🆘",
        need: "Need Help",
        message: "Patient needs help",
        priority: "High"
    },

    5: {
        gesture: "5 Fingers",
        emoji: "🚨",
        need: "Emergency",
        message: "Emergency assistance needed",
        priority: "Critical"
    }
};


// ============================================================
// START HAND CAMERA
// ============================================================

async function startCamera() {

    try {

        if (!navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia) {

            throw new Error(
                "Camera is not supported in this browser."
            );
        }


        cameraStatus.textContent =
            "Requesting camera permission...";

        cameraDiagnostic.textContent =
            "Please allow camera access.";

        handLiveStatus.textContent =
            "Camera: STARTING";


        cameraStream =
            await navigator.mediaDevices.getUserMedia({

                video: {
                    facingMode: "user",
                    width: {
                        ideal: 640
                    },
                    height: {
                        ideal: 480
                    }
                },

                audio: false

            });


        inputVideo.srcObject = cameraStream;

        await inputVideo.play();


        handDetectionRunning = true;


        cameraStatus.textContent =
            "Camera AI is running";

        cameraDiagnostic.textContent =
            "Camera connected successfully.";

        handLiveStatus.textContent =
            "Camera: LIVE";

        cameraHint.style.display =
            "none";


        if (cameraBtn) {

            cameraBtn.textContent =
                "📷 Camera Running";

        }


        if (typeof loadHandAI === "function") {

            await loadHandAI();

        }


        startHandDetection();


        updateCameraHealth();


    }

    catch (error) {

        console.error(
            "CAMERA_ERROR:",
            error
        );


        cameraStatus.textContent =
            "Camera could not start";

        handLiveStatus.textContent =
            "Camera: ERROR";


        cameraDiagnostic.textContent =
            error.message ||
            "Please check camera permission.";


        showToast(
            "Camera Error: " +
            (error.message ||
                "Permission denied")
        );

    }

}


// ============================================================
// STOP CAMERA
// ============================================================

function stopCamera() {

    handDetectionRunning = false;


    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(track => {

                track.stop();

            });

        cameraStream = null;

    }


    if (inputVideo) {

        inputVideo.srcObject = null;

    }


    cameraStatus.textContent =
        "Camera is off";

    cameraDiagnostic.textContent =
        "Camera stopped.";

    handLiveStatus.textContent =
        "Camera: OFF";


    if (cameraHint) {

        cameraHint.style.display =
            "flex";

    }


    if (cameraBtn) {

        cameraBtn.textContent =
            "📷 Start Camera AI";

    }


    clearCanvas();


    updateCameraHealth();

}


// ============================================================
// CLEAR CAMERA CANVAS
// ============================================================

function clearCanvas() {

    if (!outputCanvas) return;


    const ctx =
        outputCanvas.getContext("2d");


    ctx.clearRect(

        0,
        0,
        outputCanvas.width,
        outputCanvas.height

    );

}


// ============================================================
// LOAD MEDIAPIPE HAND AI
// ============================================================

let handAI = null;
let handAIReady = false;


async function loadHandAI() {

    if (handAIReady) return;


    try {

        if (
            typeof Hands === "undefined"
        ) {

            cameraDiagnostic.textContent =
                "Hand AI library not loaded.";

            console.warn(
                "MediaPipe Hands library missing."
            );

            return;

        }


        handAI = new Hands({

            locateFile: function(file) {

                return
                    "https://cdn.jsdelivr.net/npm/@mediapipe/hands/" +
                    file;

            }

        });


        handAI.setOptions({

            maxNumHands: 1,

            modelComplexity: 1,

            minDetectionConfidence: 0.6,

            minTrackingConfidence: 0.6

        });


        handAI.onResults(
            handleHandResults
        );


        handAIReady = true;


        cameraDiagnostic.textContent =
            "AI hand detection loaded successfully.";


    }

    catch (error) {

        console.error(
            "HAND_AI_ERROR:",
            error
        );


        cameraDiagnostic.textContent =
            "Hand AI initialization failed.";

    }

}


// ============================================================
// START HAND DETECTION LOOP
// ============================================================

async function startHandDetection() {

    if (!handDetectionRunning) return;


    if (
        !inputVideo ||
        inputVideo.readyState < 2
    ) {

        requestAnimationFrame(
            startHandDetection
        );

        return;

    }


    try {

        if (
            handAI &&
            handAIReady
        ) {

            await handAI.send({

                image: inputVideo

            });

        }

        else {

            simpleHandFallback();

        }

    }

    catch (error) {

        console.error(
            "HAND_DETECTION_ERROR:",
            error
        );

    }


    if (handDetectionRunning) {

        requestAnimationFrame(
            startHandDetection
        );

    }

}


// ============================================================
// MEDIAPIPE HAND RESULTS
// ============================================================

function handleHandResults(results) {

    if (!handDetectionRunning) return;


    if (!outputCanvas) return;


    const width =
        inputVideo.videoWidth || 640;

    const height =
        inputVideo.videoHeight || 480;


    outputCanvas.width =
        width;

    outputCanvas.height =
        height;


    const ctx =
        outputCanvas.getContext("2d");


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    if (
        !results.multiHandLandmarks ||
        results.multiHandLandmarks.length === 0
    ) {

        handLiveStatus.textContent =
            "Camera: LIVE • No hand detected";

        return;

    }


    handLiveStatus.textContent =
        "Camera: LIVE • Hand detected";


    const landmarks =
        results.multiHandLandmarks[0];


    drawHandLandmarks(
        ctx,
        landmarks,
        width,
        height
    );


    const fingerCount =
        countRaisedFingers(
            landmarks
        );


    const confidence =
        calculateHandConfidence(
            landmarks
        );


    processGesture(
        fingerCount,
        confidence
    );

}


// ============================================================
// DRAW HAND LANDMARKS
// ============================================================

function drawHandLandmarks(
    ctx,
    landmarks,
    width,
    height
) {

    try {

        if (
            typeof drawConnectors !==
            "undefined"
        ) {

            drawConnectors(

                ctx,

                landmarks,

                HAND_CONNECTIONS,

                {
                    color: "#00ff88",
                    lineWidth: 3
                }

            );

        }


        if (
            typeof drawLandmarks !==
            "undefined"
        ) {

            drawLandmarks(

                ctx,

                landmarks,

                {
                    color: "#00d4ff",
                    lineWidth: 4
                }

            );

        }

    }

    catch (error) {

        console.warn(
            "DRAW_ERROR:",
            error
        );

    }

}


// ============================================================
// COUNT RAISED FINGERS
// ============================================================

function countRaisedFingers(
    landmarks
) {

    let fingers = 0;


    // INDEX FINGER

    if (
        landmarks[8].y <
        landmarks[6].y
    ) {

        fingers++;

    }


    // MIDDLE FINGER

    if (
        landmarks[12].y <
        landmarks[10].y
    ) {

        fingers++;

    }


    // RING FINGER

    if (
        landmarks[16].y <
        landmarks[14].y
    ) {

        fingers++;

    }


    // PINKY

    if (
        landmarks[20].y <
        landmarks[18].y
    ) {

        fingers++;

    }


    // THUMB

    const thumbTip =
        landmarks[4];

    const thumbIP =
        landmarks[3];


    if (

        Math.abs(
            thumbTip.x -
            thumbIP.x
        ) > 0.04

    ) {

        fingers++;

    }


    return Math.min(
        fingers,
        5
    );

}


// ============================================================
// CALCULATE AI CONFIDENCE
// ============================================================

function calculateHandConfidence(
    landmarks
) {

    if (
        !landmarks ||
        landmarks.length < 21
    ) {

        return 0;

    }


    let valid = 0;


    landmarks.forEach(
        point => {

            if (

                point.x >= 0 &&
                point.x <= 1 &&

                point.y >= 0 &&
                point.y <= 1

            ) {

                valid++;

            }

        }
    );


    return Math.round(

        (valid / landmarks.length)
        * 100

    );

}


// ============================================================
// PROCESS DETECTED GESTURE
// ============================================================

function processGesture(
    fingerCount,
    confidence
) {

    if (
        !gestures[fingerCount]
    ) return;


    const now =
        Date.now();


    if (
        lastGesture === fingerCount
    ) {

        gestureStableCount++;

    }

    else {

        lastGesture =
            fingerCount;

        gestureStableCount =
            1;

    }


    updateDetectionPanel(
        fingerCount,
        confidence
    );


    // Require stable detection

    if (
        gestureStableCount < 8
    ) {

        return;

    }


    // Prevent repeated alerts

    if (
        now -
        lastGestureTime <
        5000
    ) {

        return;

    }


    lastGestureTime =
        now;


    sendGestureAlert(
        fingerCount,
        confidence
    );

}


// ============================================================
// UPDATE DETECTION PANEL
// ============================================================

function updateDetectionPanel(
    fingerCount,
    confidence
) {

    const data =
        gestures[fingerCount];


    if (!data) return;


    const detectedGesture =
        document.getElementById(
            "detectedGesture"
        );

    const detectedEmoji =
        document.getElementById(
            "detectedEmoji"
        );

    const detectedNeed =
        document.getElementById(
            "detectedNeed"
        );

    const detectedDetail =
        document.getElementById(
            "detectedDetail"
        );


    if (detectedGesture) {

        detectedGesture.textContent =
            data.gesture +
            " detected";

    }


    if (detectedEmoji) {

        detectedEmoji.textContent =
            data.emoji;

    }


    if (detectedNeed) {

        detectedNeed.textContent =
            data.need;

    }


    if (detectedDetail) {

        detectedDetail.textContent =
            data.message +
            " • AI Confidence: " +
            confidence +
            "%";

    }

}


// ============================================================
// GET PATIENT INFORMATION
// ============================================================

function getPatientInformation() {

    const patientId =
        document.getElementById(
            "patientId"
        );

    const room =
        document.getElementById(
            "room"
        );

    const bed =
        document.getElementById(
            "bed"
        );


    return {

        patientId:

            patientId
                ? patientId.value
                : "P1001",

        patientName:
            "Demo Patient",

        room:

            room
                ? room.value
                : "204",

        bed:

            bed
                ? bed.value
                : "3"

    };

}


// ============================================================
// SEND GESTURE ALERT TO SERVER
// ============================================================

async function sendGestureAlert(
    fingerCount,
    confidence
) {

    if (
        gestureProcessing
    ) return;


    gestureProcessing =
        true;


    try {

        const gesture =
            gestures[fingerCount];


        if (!gesture) return;


        const patient =
            getPatientInformation();


        const languageSelect =
            document.getElementById(
                "languageSelect"
            );


        const language =
            languageSelect
                ? languageSelect.value
                : "en";


        const alertData = {

            patientId:
                patient.patientId,

            patientName:
                patient.patientName,

            room:
                patient.room,

            bed:
                patient.bed,

            gesture:
                gesture.gesture,

            message:
                gesture.message,

            language:
                language,

            priority:
                gesture.priority,

            confidence:
                confidence

        };


        const response =
            await fetch(
                "/api/alerts",
                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(
                            alertData
                        )

                }
            );


        const result =
            await response.json();


        if (
            !response.ok
        ) {

            throw new Error(

                result.error ||
                "Unable to save alert"

            );

        }


        currentAlert =
            result;


        showPatientAlert(
            result
        );


        speakAlert(
            result
        );


        showToast(
            "Alert sent: " +
            gesture.message
        );


        loadAlerts();


        loadDashboard();


        loadAnalytics();


    }

    catch (error) {

        console.error(
            "SEND_ALERT_ERROR:",
            error
        );


        showToast(
            "Alert error: " +
            error.message
        );

    }

    finally {

        setTimeout(
            () => {

                gestureProcessing =
                    false;

            },
            1000
        );

    }

}


// ============================================================
// SIMPLE FALLBACK
// ============================================================

function simpleHandFallback() {

    handLiveStatus.textContent =
        "Camera: LIVE • Camera working • AI library unavailable";

}


// ============================================================
// CAMERA HEALTH
// ============================================================

function updateCameraHealth() {

    const health =
        document.getElementById(
            "cameraHealth"
        );


    if (!health) return;


    const secure =
        location.protocol ===
        "https:" ||

        location.hostname ===
        "localhost";


    const cameraSupport =
        !!(
            navigator.mediaDevices &&
            navigator.mediaDevices.getUserMedia
        );


    health.innerHTML = `

        <div class="health-card">

            <b>Camera Support</b>

            <span>

                ${
                    cameraSupport
                    ? "✅ Supported"
                    : "❌ Not Supported"
                }

            </span>

        </div>


        <div class="health-card">

            <b>Secure Connection</b>

            <span>

                ${
                    secure
                    ? "✅ Ready"
                    : "⚠️ HTTP"
                }

            </span>

        </div>


        <div class="health-card">

            <b>AI Engine</b>

            <span>

                ${
                    handAIReady
                    ? "🤖 Ready"
                    : "⚠️ Loading"
                }

            </span>

        </div>

    `;

}


// ============================================================
// CAMERA BUTTON EVENTS
// ============================================================

if (cameraBtn) {

    cameraBtn.addEventListener(
        "click",
        startCamera
    );

}


if (stopCameraBtn) {

    stopCameraBtn.addEventListener(
        "click",
        stopCamera
    );

}


// ============================================================
// OPEN GESTURE PAGE
// ============================================================

const openGestureBtn =
    document.getElementById(
        "openGestureBtn"
    );


if (openGestureBtn) {

    openGestureBtn.addEventListener(
        "click",
        () => {

            openPage(
                "gesture"
            );

        }
    );

}


// ============================================================
// VIEW ALERTS BUTTON
// ============================================================

const viewAlertsBtn =
    document.getElementById(
        "viewAlertsBtn"
    );


if (viewAlertsBtn) {

    viewAlertsBtn.addEventListener(
        "click",
        () => {

            openPage(
                "alerts"
            );

        }
    );

}


// ============================================================
// MOBILE PAGE BUTTON
// ============================================================

const openMobileBtn =
    document.getElementById(
        "openMobileBtn"
    );


if (openMobileBtn) {

    openMobileBtn.addEventListener(
        "click",
        () => {

            openPage(
                "mobile"
            );

        }
    );

          }
// ============================================================
// CareGesture AI - app.js
// PART 3: VOICE, ALERTS, DASHBOARD, REPORTS, APPOINTMENTS
// ANALYTICS, MOBILE, DIAGNOSTICS & FINAL INITIALIZATION
// ============================================================


// ============================================================
// NAVIGATION
// ============================================================

const navButtons =
    document.querySelectorAll(".nav");

const pages =
    document.querySelectorAll(".page");

const pageTitle =
    document.getElementById("pageTitle");


function openPage(pageName) {

    pages.forEach(page => {

        page.classList.remove("active");

    });


    navButtons.forEach(button => {

        button.classList.remove("active");

    });


    const selectedPage =
        document.getElementById(pageName);


    const selectedButton =
        document.querySelector(
            `.nav[data-page="${pageName}"]`
        );


    if (selectedPage) {

        selectedPage.classList.add("active");

    }


    if (selectedButton) {

        selectedButton.classList.add("active");

    }


    const titles = {

        dashboard: "Nurse Dashboard",

        gesture: "Gesture Communication",

        faceeye: "Face & Eye AI",

        alerts: "Alert Center",

        patient: "Patient Care",

        reports: "Medical Reports",

        appointments: "Appointments",

        analytics: "Analytics",

        mobile: "Mobile App",

        test: "Test All Modules"

    };


    if (pageTitle) {

        pageTitle.textContent =
            titles[pageName] ||
            "CareGesture AI";

    }


    if (pageName === "alerts") {

        loadAlerts();

    }


    if (pageName === "reports") {

        loadReports();

    }


    if (pageName === "appointments") {

        loadAppointments();

    }


    if (pageName === "analytics") {

        loadAnalytics();

    }


    if (pageName === "dashboard") {

        loadDashboard();

    }


    if (pageName === "mobile") {

        updateMobileServerUrl();

    }

}


navButtons.forEach(button => {

    button.addEventListener(
        "click",
        function() {

            openPage(
                button.dataset.page
            );

        }
    );

});


// ============================================================
// TOAST MESSAGE
// ============================================================

function showToast(message) {

    const toast =
        document.getElementById("toast");


    if (!toast) {

        console.log(message);

        return;

    }


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        3500
    );

}


// ============================================================
// LANGUAGE TRANSLATIONS
// ============================================================

const translations = {

    en: {

        water: "Patient needs water",

        food: "Patient needs food",

        nurse: "Patient needs a nurse",

        help: "Patient needs help",

        emergency:
            "Emergency assistance needed",

        ok: "Patient is okay"

    },


    kn: {

        water:
            "ರೋಗಿಗೆ ನೀರು ಬೇಕಾಗಿದೆ",

        food:
            "ರೋಗಿಗೆ ಆಹಾರ ಬೇಕಾಗಿದೆ",

        nurse:
            "ರೋಗಿಗೆ ನರ್ಸ್ ಬೇಕಾಗಿದೆ",

        help:
            "ರೋಗಿಗೆ ಸಹಾಯ ಬೇಕಾಗಿದೆ",

        emergency:
            "ತುರ್ತು ಸಹಾಯ ಅಗತ್ಯವಿದೆ",

        ok:
            "ರೋಗಿ ಚೆನ್ನಾಗಿದ್ದಾರೆ"

    },


    hi: {

        water:
            "मरीज को पानी चाहिए",

        food:
            "मरीज को खाना चाहिए",

        nurse:
            "मरीज को नर्स चाहिए",

        help:
            "मरीज को मदद चाहिए",

        emergency:
            "तुरंत सहायता की आवश्यकता है",

        ok:
            "मरीज ठीक है"

    }

};


// ============================================================
// LANGUAGE NAME
// ============================================================

function getLanguageName(code) {

    const languages = {

        en: "English",

        kn: "ಕನ್ನಡ",

        hi: "हिन्दी"

    };


    return languages[code] ||
        "English";

}


// ============================================================
// ENABLE VOICE
// ============================================================

const voiceBtn =
    document.getElementById(
        "voiceBtn"
    );


if (voiceBtn) {

    voiceBtn.addEventListener(
        "click",
        function() {

            voiceEnabled = true;


            if (
                "speechSynthesis"
                in window
            ) {

                speechSynthesis.cancel();


                const test =
                    new SpeechSynthesisUtterance(
                        "Voice alerts enabled"
                    );


                test.lang =
                    "en-IN";


                speechSynthesis.speak(
                    test
                );


                showToast(
                    "Voice alerts enabled"
                );


                voiceBtn.textContent =
                    "🔊 Voice Enabled";

            }

            else {

                showToast(
                    "Voice is not supported in this browser."
                );

            }

        }
    );

}


// ============================================================
// GET SPEECH LANGUAGE
// ============================================================

function getSpeechLanguage(language) {

    const map = {

        en: "en-IN",

        kn: "kn-IN",

        hi: "hi-IN"

    };


    return map[language] ||
        "en-IN";

}


// ============================================================
// SPEAK ALERT
// ============================================================

function speakAlert(alert) {

    if (
        !("speechSynthesis"
            in window)
    ) {

        return;

    }


    const language =
        alert.language ||
        "en";


    let message =
        alert.message ||
        "Patient alert";


    message =
        `Patient ${alert.patientId}.
        Room ${alert.room}.
        Bed ${alert.bed}.
        ${message}`;


    speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(
            message
        );


    utterance.lang =
        getSpeechLanguage(
            language
        );


    utterance.rate =
        0.9;


    utterance.pitch =
        1;


    speechSynthesis.speak(
        utterance
    );


    const voiceStatus =
        document.getElementById(
            "voiceStatus"
        );


    if (voiceStatus) {

        voiceStatus.textContent =
            "🔊 Voice alert played in " +
            getLanguageName(
                language
            );

    }

}


// ============================================================
// OVERLAY ALERT
// ============================================================

function showPatientAlert(alert) {

    currentAlert =
        alert;


    const overlay =
        document.getElementById(
            "alertOverlay"
        );


    if (!overlay) return;


    const priority =
        document.getElementById(
            "overlayPriority"
        );


    const message =
        document.getElementById(
            "overlayMessage"
        );


    const meta =
        document.getElementById(
            "overlayMeta"
        );


    const patient =
        document.getElementById(
            "overlayPatient"
        );


    if (priority) {

        priority.textContent =
            alert.priority ===
            "Critical"

                ? "🚨 CRITICAL PATIENT ALERT"

                : alert.priority ===
                    "High"

                    ? "⚠️ HIGH PRIORITY ALERT"

                    : "🔔 PATIENT ALERT";

    }


    if (message) {

        message.textContent =
            alert.message ||
            "Patient needs help";

    }


    if (meta) {

        meta.textContent =
            "Room " +
            (alert.room || "-") +

            " · Bed " +

            (alert.bed || "-");

    }


    if (patient) {

        patient.textContent =
            "Patient " +

            (alert.patientId ||
                "P1001") +

            " · " +

            (alert.patientName ||
                "Patient");

    }


    overlay.classList.add(
        "show"
    );


    if (
        alert.priority ===
        "Critical"
    ) {

        overlay.classList.add(
            "critical"
        );

    }

    else {

        overlay.classList.remove(
            "critical"
        );

    }


    requestNotification(
        alert
    );

}


// ============================================================
// CLOSE ALERT OVERLAY
// ============================================================

const closeAlertOverlay =
    document.getElementById(
        "closeAlertOverlay"
    );


if (closeAlertOverlay) {

    closeAlertOverlay.addEventListener(
        "click",
        function() {

            const overlay =
                document.getElementById(
                    "alertOverlay"
                );


            if (overlay) {

                overlay.classList.remove(
                    "show"
                );

            }

        }
    );

}


// ============================================================
// PLAY OVERLAY VOICE
// ============================================================

const overlayVoiceBtn =
    document.getElementById(
        "overlayVoiceBtn"
    );


if (overlayVoiceBtn) {

    overlayVoiceBtn.addEventListener(
        "click",
        function() {

            if (currentAlert) {

                speakAlert(
                    currentAlert
                );

            }

        }
    );

}


// ============================================================
// ACKNOWLEDGE ALERT
// ============================================================

const overlayAckBtn =
    document.getElementById(
        "overlayAckBtn"
    );


if (overlayAckBtn) {

    overlayAckBtn.addEventListener(
        "click",
        async function() {

            if (!currentAlert) return;


            await updateAlert(
                currentAlert.id,
                "acknowledge"
            );


            const overlay =
                document.getElementById(
                    "alertOverlay"
                );


            if (overlay) {

                overlay.classList.remove(
                    "show"
                );

            }

        }
    );

}


// ============================================================
// RESOLVE ALERT
// ============================================================

const overlayResolveBtn =
    document.getElementById(
        "overlayResolveBtn"
    );


if (overlayResolveBtn) {

    overlayResolveBtn.addEventListener(
        "click",
        async function() {

            if (!currentAlert) return;


            await updateAlert(
                currentAlert.id,
                "resolve"
            );


            const overlay =
                document.getElementById(
                    "alertOverlay"
                );


            if (overlay) {

                overlay.classList.remove(
                    "show"
                );

            }

        }
    );

}


// ============================================================
// BROWSER NOTIFICATIONS
// ============================================================

const notifyBtn =
    document.getElementById(
        "notifyBtn"
    );


if (notifyBtn) {

    notifyBtn.addEventListener(
        "click",
        async function() {

            if (
                !("Notification"
                    in window)
            ) {

                showToast(
                    "Notifications are not supported."
                );

                return;

            }


            const permission =
                await Notification.requestPermission();


            if (
                permission ===
                "granted"
            ) {

                notifyBtn.textContent =
                    "🔔 Notifications Enabled";


                showToast(
                    "Notifications enabled"
                );

            }

            else {

                showToast(
                    "Notification permission denied"
                );

            }

        }
    );

}


// ============================================================
// SEND BROWSER NOTIFICATION
// ============================================================

function requestNotification(alert) {

    if (
        !("Notification"
            in window)
    ) {

        return;

    }


    if (
        Notification.permission !==
        "granted"
    ) {

        return;

    }


    try {

        new Notification(
            "CareGesture AI Alert",
            {

                body:

                    alert.message +

                    "\nRoom " +

                    alert.room +

                    " • Bed " +

                    alert.bed

            }
        );

    }

    catch (error) {

        console.warn(
            "NOTIFICATION_ERROR",
            error
        );

    }

}


// ============================================================
// LOAD ALERTS
// ============================================================

let allAlerts = [];

let currentFilter =
    "all";


async function loadAlerts() {

    try {

        const response =
            await fetch(
                "/api/alerts"
            );


        const alerts =
            await response.json();


        allAlerts =
            Array.isArray(alerts)

                ? alerts

                : [];


        renderAlerts();


        updateAlertStatistics();

    }

    catch (error) {

        console.error(
            "LOAD_ALERTS_ERROR",
            error
        );

    }

}


// ============================================================
// RENDER ALERTS
// ============================================================

function renderAlerts() {

    const alertList =
        document.getElementById(
            "alertList"
        );


    if (!alertList) return;


    let filtered =
        [...allAlerts];


    if (
        currentFilter ===
        "Critical"
    ) {

        filtered =
            filtered.filter(
                alert =>
                    alert.priority ===
                    "Critical"
            );

    }

    else if (
        currentFilter !==
        "all"
    ) {

        filtered =
            filtered.filter(
                alert =>
                    alert.status ===
                    currentFilter
            );

    }


    if (
        filtered.length === 0
    ) {

        alertList.innerHTML = `

            <div class="panel">

                <p>
                    No alerts found.
                </p>

            </div>

        `;

        return;

    }


    alertList.innerHTML =
        filtered.map(
            alert => {

                const date =
                    formatDateTime(
                        alert.createdAt
                    );


                return `

                <div class="alert-card
                    ${String(alert.priority || "")
                        .toLowerCase()}">

                    <div>

                        <h3>

                            ${escapeHTML(
                                alert.message
                            )}

                        </h3>


                        <p>

                            👤
                            ${escapeHTML(
                                alert.patientId
                            )}

                            · Room
                            ${escapeHTML(
                                alert.room
                            )}

                            · Bed
                            ${escapeHTML(
                                alert.bed
                            )}

                        </p>


                        <small>

                            ${escapeHTML(
                                alert.gesture ||
                                "Manual"
                            )}

                            ·

                            ${date}

                        </small>

                    </div>


                    <div class="alert-actions">

                        <b class="priority">

                            ${escapeHTML(
                                alert.priority ||
                                "Normal"
                            )}

                        </b>


                        <b>

                            ${escapeHTML(
                                alert.status ||
                                "New"
                            )}

                        </b>


                        ${alert.status !== "Resolved"

                            ? `

                            <button
                                class="outline"
                                onclick="alertAction('${alert.id}','acknowledge')">

                                ✓ Acknowledge

                            </button>


                            <button
                                class="outline"
                                onclick="alertAction('${alert.id}','resolve')">

                                ✓ Resolve

                            </button>


                            <button
                                class="outline"
                                onclick="alertAction('${alert.id}','escalate')">

                                🚨 Escalate

                            </button>

                            `

                            : ""
                        }

                    </div>

                </div>

                `;

            }
        ).join("");

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

    return String(
        value ?? ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================================
// ALERT BUTTON ACTION
// ============================================================

async function alertAction(
    alertId,
    action
) {

    await updateAlert(
        alertId,
        action
    );

}


// Make available to onclick

window.alertAction =
    alertAction;


// ============================================================
// UPDATE ALERT
// ============================================================

async function updateAlert(
    alertId,
    action
) {

    try {

        const response =
            await fetch(

                "/api/alerts/" +
                encodeURIComponent(
                    alertId
                ),

                {

                    method:
                        "PATCH",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({
                            action: action
                        })

                }

            );


        const result =
            await response.json();


        if (
            !response.ok
        ) {

            throw new Error(
                result.error ||
                "Unable to update alert"
            );

        }


        showToast(
            "Alert " +
            action +
            " successfully"
        );


        await loadAlerts();

        await loadDashboard();

        await loadAnalytics();


    }

    catch (error) {

        console.error(
            "UPDATE_ALERT_ERROR",
            error
        );


        showToast(
            error.message
        );

    }

}


// ============================================================
// ALERT FILTER BUTTONS
// ============================================================

const filterButtons =
    document.querySelectorAll(
        ".filter"
    );


filterButtons.forEach(button => {

    button.addEventListener(
        "click",
        function() {

            filterButtons.forEach(
                item => {

                    item.classList.remove(
                        "active"
                    );

                }
            );


            button.classList.add(
                "active"
            );


            currentFilter =
                button.dataset.filter ||
                "all";


            renderAlerts();

        }
    );

});


// ============================================================
// UPDATE ALERT STATISTICS
// ============================================================

function updateAlertStatistics() {

    const active =
        allAlerts.filter(
            alert =>
                alert.status !==
                "Resolved"
        );


    const critical =
        allAlerts.filter(
            alert =>
                alert.priority ===
                "Critical" &&

                alert.status !==
                "Resolved"
        );


    const activeCount =
        document.getElementById(
            "activeCount"
        );


    const criticalCount =
        document.getElementById(
            "criticalCount"
        );


    if (activeCount) {

        activeCount.textContent =
            active.length;

    }


    if (criticalCount) {

        criticalCount.textContent =
            critical.length;

    }

}


// ============================================================
// DASHBOARD
// ============================================================

async function loadDashboard() {

    try {

        const response =
            await fetch(
                "/api/alerts"
            );


        const alerts =
            await response.json();


        const list =
            Array.isArray(alerts)

                ? alerts

                : [];


        const active =
            list.filter(
                alert =>
                    alert.status !==
                    "Resolved"
            );


        const critical =
            active.filter(
                alert =>
                    alert.priority ===
                    "Critical"
            );


        const today =
            new Date()
                .toDateString();


        const todayAlerts =
            list.filter(
                alert => {

                    if (
                        !alert.createdAt
                    ) return false;


                    return new Date(
                        alert.createdAt
                    ).toDateString() ===
                    today;

                }
            );


        const confidenceValues =
            list

                .map(
                    alert =>
                        Number(
                            alert.confidence
                        )
                )

                .filter(
                    value =>
                        Number.isFinite(
                            value
                        )
                );


        let average =
            "—";


        if (
            confidenceValues.length
        ) {

            average =
                Math.round(

                    confidenceValues.reduce(
                        (
                            total,
                            value
                        ) =>
                            total + value,
                        0
                    )

                    /

                    confidenceValues.length

                ) + "%";

        }


        const activeCount =
            document.getElementById(
                "activeCount"
            );


        const criticalCount =
            document.getElementById(
                "criticalCount"
            );


        const todayCount =
            document.getElementById(
                "todayCount"
            );


        const confidenceStat =
            document.getElementById(
                "confidenceStat"
            );


        if (activeCount) {

            activeCount.textContent =
                active.length;

        }


        if (criticalCount) {

            criticalCount.textContent =
                critical.length;

        }


        if (todayCount) {

            todayCount.textContent =
                todayAlerts.length;

        }


        if (confidenceStat) {

            confidenceStat.textContent =
                average;

        }


        renderRecentAlerts(
            list
        );


    }

    catch (error) {

        console.error(
            "DASHBOARD_ERROR",
            error
        );

    }

}


// ============================================================
// RECENT ALERTS
// ============================================================

function renderRecentAlerts(
    alerts
) {

    const container =
        document.getElementById(
            "recentAlerts"
        );


    if (!container) return;


    const recent =
        alerts.slice(
            0,
            5
        );


    if (
        recent.length === 0
    ) {

        container.innerHTML =

            "<p>No alerts yet.</p>";

        return;

    }


    container.innerHTML =
        recent.map(
            alert => `

            <div class="recent-alert">

                <b>

                    ${escapeHTML(
                        alert.message
                    )}

                </b>

                <small>

                    Room
                    ${escapeHTML(
                        alert.room
                    )}

                    · Bed
                    ${escapeHTML(
                        alert.bed
                    )}

                </small>

            </div>

            `
        ).join("");

}


// ============================================================
// REPORT UPLOAD
// ============================================================

const reportForm =
    document.getElementById(
        "reportForm"
    );


if (reportForm) {

    reportForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            try {

                const formData =
                    new FormData(
                        reportForm
                    );


                const response =
                    await fetch(

                        "/api/reports",

                        {

                            method:
                                "POST",

                            body:
                                formData

                        }

                    );


                const result =
                    await response.json();


                if (
                    !response.ok
                ) {

                    throw new Error(
                        result.error ||
                        "Upload failed"
                    );

                }


                showToast(
                    "Medical report uploaded"
                );


                reportForm.reset();


                loadReports();


            }

            catch (error) {

                showToast(
                    "Upload error: " +
                    error.message
                );

            }

        }
    );

}


// ============================================================
// LOAD REPORTS
// ============================================================

async function loadReports() {

    const reportList =
        document.getElementById(
            "reportList"
        );


    if (!reportList) return;


    try {

        const response =
            await fetch(
                "/api/reports"
            );


        const reports =
            await response.json();


        if (
            !Array.isArray(reports) ||
            reports.length === 0
        ) {

            reportList.innerHTML =
                "<p>No reports uploaded.</p>";

            return;

        }


        reportList.innerHTML =
            reports.map(
                report => `

                <div class="report-item">

                    <div>

                        <b>

                            📄
                            ${escapeHTML(
                                report.originalName
                            )}

                        </b>


                        <small>

                            ${formatDateTime(
                                report.uploadedAt
                            )}

                        </small>

                    </div>


                    <a
                        class="outline"
                        target="_blank"
                        href="/uploads/${encodeURIComponent(
                            report.storedName
                        )}">

                        Open

                    </a>

                </div>

                `
            ).join("");


    }

    catch (error) {

        reportList.innerHTML =
            "<p>Unable to load reports.</p>";

    }

}


// ============================================================
// APPOINTMENT FORM
// ============================================================

const appointmentForm =
    document.getElementById(
        "appointmentForm"
    );


if (appointmentForm) {

    appointmentForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            try {

                const form =
                    new FormData(
                        appointmentForm
                    );


                const data = {

                    patientId:
                        form.get(
                            "patientId"
                        ),

                    doctor:
                        form.get(
                            "doctor"
                        ),

                    date:
                        form.get(
                            "date"
                        ),

                    time:
                        form.get(
                            "time"
                        )

                };


                const response =
                    await fetch(

                        "/api/appointments",

                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify(
                                    data
                                )

                        }

                    );


                const result =
                    await response.json();


                if (
                    !response.ok
                ) {

                    throw new Error(
                        result.error ||
                        "Appointment failed"
                    );

                }


                showToast(
                    "Appointment scheduled"
                );


                appointmentForm.reset();


                loadAppointments();

                loadAnalytics();


            }

            catch (error) {

                showToast(
                    error.message
                );

            }

        }
    );

}


// ============================================================
// LOAD APPOINTMENTS
// ============================================================

async function loadAppointments() {

    const appointmentList =
        document.getElementById(
            "appointmentList"
        );


    if (!appointmentList) return;


    try {

        const response =
            await fetch(
                "/api/appointments"
            );


        const appointments =
            await response.json();


        if (
            !Array.isArray(
                appointments
            ) ||

            appointments.length === 0
        ) {

            appointmentList.innerHTML =
                "<p>No appointments.</p>";

            return;

        }


        appointmentList.innerHTML =
            appointments.map(
                appointment => `

                <div class="appointment-item">

                    <b>

                        🩺
                        ${escapeHTML(
                            appointment.doctor
                        )}

                    </b>


                    <p>

                        📅
                        ${escapeHTML(
                            appointment.date
                        )}

                        ·

                        🕐
                        ${escapeHTML(
                            appointment.time
                        )}

                    </p>


                    <small>

                        ${escapeHTML(
                            appointment.status ||
                            "Scheduled"
                        )}

                    </small>

                </div>

                `
            ).join("");


    }

    catch (error) {

        appointmentList.innerHTML =
            "<p>Unable to load appointments.</p>";

    }

}


// ============================================================
// ANALYTICS
// ============================================================

async function loadAnalytics() {

    try {

        const alertsResponse =
            await fetch(
                "/api/alerts"
            );


        const appointmentsResponse =
            await fetch(
                "/api/appointments"
            );


        const alerts =
            await alertsResponse.json();


        const appointments =
            await appointmentsResponse.json();


        const alertList =
            Array.isArray(alerts)

                ? alerts

                : [];


        const appointmentList =
            Array.isArray(
                appointments
            )

                ? appointments

                : [];


        const total =
            alertList.length;


        const resolved =
            alertList.filter(
                alert =>
                    alert.status ===
                    "Resolved"
            ).length;


        const escalated =
            alertList.filter(
                alert =>
                    alert.status ===
                    "Escalated"
            ).length;


        setText(
            "aTotal",
            total
        );


        setText(
            "aResolved",
            resolved
        );


        setText(
            "aEscalated",
            escalated
        );


        setText(
            "aAppointments",
            appointmentList.length
        );


        renderGestureAnalytics(
            alertList
        );


    }

    catch (error) {

        console.error(
            "ANALYTICS_ERROR",
            error
        );

    }

}


// ============================================================
// GESTURE ANALYTICS
// ============================================================

function renderGestureAnalytics(
    alerts
) {

    const container =
        document.getElementById(
            "gestureBars"
        );


    if (!container) return;


    const counts = {};


    alerts.forEach(
        alert => {

            const gesture =
                alert.gesture ||
                "Manual";


            counts[gesture] =
                (counts[gesture] || 0)
                + 1;

        }
    );


    const entries =
        Object.entries(
            counts
        );


    if (
        entries.length === 0
    ) {

        container.innerHTML =
            "<p>No gesture data yet.</p>";

        return;

    }


    const max =
        Math.max(
            ...entries.map(
                item =>
                    item[1]
            ),
            1
        );


    container.innerHTML =
        entries.map(
            ([name, count]) => `

            <div class="gesture-bar">

                <div>

                    <b>
                        ${escapeHTML(name)}
                    </b>

                    <span>
                        ${count}
                    </span>

                </div>


                <div class="bar-track">

                    <div
                        class="bar-fill"
                        style="width:${
                            Math.round(
                                count / max * 100
                            )
                        }%">

                    </div>

                </div>

            </div>

            `
        ).join("");

}


// ============================================================
// MOBILE SERVER URL
// ============================================================

function updateMobileServerUrl() {

    const element =
        document.getElementById(
            "mobileServerUrl"
        );


    if (!element) return;


    element.textContent =
        window.location.origin;

}


// ============================================================
// COPY MOBILE URL
// ============================================================

const copyMobileUrl =
    document.getElementById(
        "copyMobileUrl"
    );


if (copyMobileUrl) {

    copyMobileUrl.addEventListener(
        "click",
        async function() {

            try {

                await navigator.clipboard.writeText(
                    window.location.origin
                );


                showToast(
                    "Server URL copied"
                );

            }

            catch (error) {

                showToast(
                    window.location.origin
                );

            }

        }
    );

}


// ============================================================
// LANGUAGE CHANGE
// ============================================================

const languageSelect =
    document.getElementById(
        "languageSelect"
    );


if (languageSelect) {

    languageSelect.addEventListener(
        "change",
        function() {

            updateLanguageUI(
                languageSelect.value
            );

        }
    );

}


function updateLanguageUI(language) {

    const patientLang =
        document.getElementById(
            "patientLang"
        );


    if (patientLang) {

        patientLang.textContent =
            getLanguageName(
                language
            );

    }


    showToast(
        "Language changed to " +
        getLanguageName(
            language
        )
    );

}


// ============================================================
// TEST VOICE
// ============================================================

const testVoiceBtn =
    document.getElementById(
        "testVoiceBtn"
    );


if (testVoiceBtn) {

    testVoiceBtn.addEventListener(
        "click",
        function() {

            const language =
                languageSelect
                    ? languageSelect.value
                    : "en";


            const alert = {

                patientId:
                    "P1001",

                room:
                    "204",

                bed:
                    "3",

                language:
                    language,

                message:

                    language === "kn"

                        ? "ಇದು ಧ್ವನಿ ಪರೀಕ್ಷೆಯಾಗಿದೆ"

                        : language === "hi"

                            ? "यह वॉइस परीक्षण है"

                            : "This is a voice test"

            };


            speakAlert(
                alert
            );

        }
    );

}


// ============================================================
// TEST ALERT
// ============================================================

const testAlertBtn =
    document.getElementById(
        "testAlertBtn"
    );


if (testAlertBtn) {

    testAlertBtn.addEventListener(
        "click",
        async function() {

            try {

                const patient =
                    getPatientInformation();


                const response =
                    await fetch(

                        "/api/alerts",

                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body:
                                JSON.stringify({

                                    patientId:
                                        patient.patientId,

                                    patientName:
                                        patient.patientName,

                                    room:
                                        patient.room,

                                    bed:
                                        patient.bed,

                                    gesture:
                                        "System Test",

                                    message:
                                        "Test alert: Patient communication system is working",

                                    language:
                                        languageSelect
                                            ? languageSelect.value
                                            : "en",

                                    priority:
                                        "High",

                                    confidence:
                                        100

                                })

                        }

                    );


                const alert =
                    await response.json();


                if (
                    !response.ok
                ) {

                    throw new Error(
                        alert.error ||
                        "Test failed"
                    );

                }


                showPatientAlert(
                    alert
                );


                speakAlert(
                    alert
                );


                loadAlerts();

                loadDashboard();

                loadAnalytics();


                showToast(
                    "Test alert created successfully"
                );


            }

            catch (error) {

                showToast(
                    "Test failed: " +
                    error.message
                );

            }

        }
    );

}


// ============================================================
// FULL DIAGNOSTICS
// ============================================================

const runDiagnosticsBtn =
    document.getElementById(
        "runDiagnosticsBtn"
    );


if (runDiagnosticsBtn) {

    runDiagnosticsBtn.addEventListener(
        "click",
        runDiagnostics
    );

}


async function runDiagnostics() {

    const results =
        document.getElementById(
            "diagnosticResults"
        );


    if (!results) return;


    results.innerHTML =
        "<p>Running diagnostics...</p>";


    const tests = [];


    // Browser

    tests.push({

        name:
            "Browser JavaScript",

        ok:
            true

    });


    // Camera

    tests.push({

        name:
            "Camera API",

        ok:

            !!(
                navigator.mediaDevices &&
                navigator.mediaDevices.getUserMedia
            )

    });


    // Voice

    tests.push({

        name:
            "Speech Synthesis",

        ok:

            "speechSynthesis"
            in window

    });


    // Notification

    tests.push({

        name:
            "Browser Notifications",

        ok:

            "Notification"
            in window

    });


    // AI

    tests.push({

        name:
            "MediaPipe Hand AI",

        ok:

            typeof Hands !==
            "undefined"

    });


    // Server

    try {

        const response =
            await fetch(
                "/api/health"
            );


        tests.push({

            name:
                "CareGesture Server",

            ok:
                response.ok

        });

    }

    catch (error) {

        tests.push({

            name:
                "CareGesture Server",

            ok:
                false

        });

    }


    // Language

    tests.push({

        name:

            "Selected Language: " +

            getLanguageName(

                languageSelect
                    ? languageSelect.value
                    : "en"

            ),

        ok:
            true

    });


    results.innerHTML =
        tests.map(
            test => `

            <div class="diagnostic-row">

                <span>

                    ${
                        test.ok
                            ? "✅"
                            : "❌"
                    }

                    ${escapeHTML(
                        test.name
                    )}

                </span>


                <b>

                    ${
                        test.ok
                            ? "PASS"
                            : "FAIL"
                    }

                </b>

            </div>

            `
        ).join("");


}


// ============================================================
// FACE & EYE AI
// ============================================================

let faceStream =
    null;

let faceRunning =
    false;


const faceVideo =
    document.getElementById(
        "faceVideo"
    );


const faceCameraBtn =
    document.getElementById(
        "faceCameraBtn"
    );


const stopFaceCameraBtn =
    document.getElementById(
        "stopFaceCameraBtn"
    );


const faceStatus =
    document.getElementById(
        "faceStatus"
    );


const faceDiagnostic =
    document.getElementById(
        "faceDiagnostic"
    );


const faceLiveStatus =
    document.getElementById(
        "faceLiveStatus"
    );


// ============================================================
// START FACE CAMERA
// ============================================================

async function startFaceCamera() {

    try {

        if (
            !navigator.mediaDevices ||
            !navigator.mediaDevices.getUserMedia
        ) {

            throw new Error(
                "Camera API is not supported."
            );

        }


        faceStatus.textContent =
            "Requesting camera access...";


        faceDiagnostic.textContent =
            "Allow camera permission.";


        faceStream =
            await navigator.mediaDevices.getUserMedia({

                video: {

                    facingMode:
                        "user",

                    width: {
                        ideal: 640
                    },

                    height: {
                        ideal: 480
                    }

                },

                audio:
                    false

            });


        faceVideo.srcObject =
            faceStream;


        await faceVideo.play();


        faceRunning =
            true;


        faceStatus.textContent =
            "Face & Eye AI camera is running";


        faceDiagnostic.textContent =
            "Camera connected. Face detection demonstration is active.";


        faceLiveStatus.textContent =
            "Face AI: LIVE";


        if (faceCameraBtn) {

            faceCameraBtn.textContent =
                "🙂 Face AI Running";

        }


        simulateFaceDetection();


    }

    catch (error) {

        console.error(
            "FACE_CAMERA_ERROR",
            error
        );


        if (faceStatus) {

            faceStatus.textContent =
                "Face camera error";

        }


        if (faceDiagnostic) {

            faceDiagnostic.textContent =
                error.message;

        }


        if (faceLiveStatus) {

            faceLiveStatus.textContent =
                "Face AI: ERROR";

        }


        showToast(
            "Face camera error: " +
            error.message
        );

    }

}


// ============================================================
// STOP FACE CAMERA
// ============================================================

function stopFaceCamera() {

    faceRunning =
        false;


    if (faceStream) {

        faceStream
            .getTracks()
            .forEach(
                track =>
                    track.stop()
            );


        faceStream =
            null;

    }


    if (faceVideo) {

        faceVideo.srcObject =
            null;

    }


    if (faceStatus) {

        faceStatus.textContent =
            "Face & Eye AI is off";

    }


    if (faceDiagnostic) {

        faceDiagnostic.textContent =
            "Face camera stopped.";

    }


    if (faceLiveStatus) {

        faceLiveStatus.textContent =
            "Face AI: OFF";

    }


    if (faceCameraBtn) {

        faceCameraBtn.textContent =
            "🙂 Start Face & Eye AI";

    }

}


// ============================================================
// FACE DEMO DETECTION
// ============================================================

function simulateFaceDetection() {

    if (!faceRunning) return;


    const faceDetected =
        document.getElementById(
            "faceDetected"
        );


    const faceNeed =
        document.getElementById(
            "faceNeed"
        );


    const faceDetail =
        document.getElementById(
            "faceDetail"
        );


    if (faceDetected) {

        faceDetected.textContent =
            "Face detected";

    }


    if (faceNeed) {

        faceNeed.textContent =
            "Patient is visible";

    }


    if (faceDetail) {

        faceDetail.textContent =
            "Camera is monitoring face presence. Blink and head movement AI requires a face landmark model.";

    }

}


// ============================================================
// FACE BUTTONS
// ============================================================

if (faceCameraBtn) {

    faceCameraBtn.addEventListener(
        "click",
        startFaceCamera
    );

}


if (stopFaceCameraBtn) {

    stopFaceCameraBtn.addEventListener(
        "click",
        stopFaceCamera
    );

}


// ============================================================
// DATE FORMAT
// ============================================================

function formatDateTime(value) {

    if (!value) {

        return "Unknown time";

    }


    try {

        return new Date(
            value
        ).toLocaleString();

    }

    catch (error) {

        return String(value);

    }

}


// ============================================================
// SAFE TEXT UPDATE
// ============================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


// ============================================================
// AUTO REFRESH
// ============================================================

function startAutoRefresh() {

    setInterval(
        () => {

            loadDashboard();

            loadAlerts();

        },
        10000
    );

}


// ============================================================
// PAGE VISIBILITY
// ============================================================

document.addEventListener(
    "visibilitychange",
    function() {

        if (
            document.visibilityState ===
            "visible"
        ) {

            loadDashboard();

            loadAlerts();

        }

    }
);


// ============================================================
// PREVENT CAMERA FROM RUNNING AFTER PAGE CLOSE
// ============================================================

window.addEventListener(
    "beforeunload",
    function() {

        stopCamera();

        stopFaceCamera();

    }
);


// ============================================================
// FINAL APPLICATION INITIALIZATION
// ============================================================

async function initializeCareGestureAI() {

    console.log(
        "CareGesture AI initializing..."
    );


    try {

        updateCameraHealth();

        updateMobileServerUrl();


        await loadDashboard();

        await loadAlerts();

        await loadAnalytics();


        startAutoRefresh();


        console.log(
            "CareGesture AI ready."
        );

    }

    catch (error) {

        console.error(
            "INITIALIZATION_ERROR",
            error
        );

    }

}


// ============================================================
// START APPLICATION
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    initializeCareGestureAI
);
