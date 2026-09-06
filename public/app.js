(() => {

"use strict";


const $ = (id) =>
  document.getElementById(id);


/* =====================================
   APPLICATION STATE
===================================== */

let state = {
  alerts: [],
  reports: [],
  appointments: []
};


let activeAlert = null;

let activeFilter = "all";


let stream = null;

let hands = null;

let cameraRunning = false;

let processingFrame = false;

let animationId = null;


let candidateGesture = null;

let stableFrames = 0;

let lastDetectedGesture = null;

let lastAlertGesture = null;

let lastAlertTime = 0;


let voices = [];


/* =====================================
   LANGUAGE DATA
===================================== */

const LANGUAGES = {


en: {

  code: "en-IN",

  name: "English",

  ok: "All OK",

  food: "Need Food",

  water: "Need Water",

  medicine: "Need Medicine",

  toilet: "Need Toilet",

  emergency:
    "Emergency. Doctor or Nurse Needed",

  handDetected:
    "Hand detected",

  cameraRunning:
    "Camera AI is running",

  cameraStarting:
    "Starting camera...",

  cameraStopped:
    "Camera is off",

  alertCreated:
    "Alert created successfully",

  emergencyAlert:
    "CRITICAL PATIENT ALERT"

},


kn: {

  code: "kn-IN",

  name: "ಕನ್ನಡ",

  ok:
    "ಎಲ್ಲವೂ ಸರಿ ಇದೆ",

  food:
    "ಆಹಾರ ಬೇಕು",

  water:
    "ನೀರು ಬೇಕು",

  medicine:
    "ಔಷಧಿ ಬೇಕು",

  toilet:
    "ಶೌಚಾಲಯಕ್ಕೆ ಹೋಗಬೇಕು",

  emergency:
    "ತುರ್ತು ಪರಿಸ್ಥಿತಿ. ವೈದ್ಯರು ಅಥವಾ ನರ್ಸ್ ಬೇಕು",

  handDetected:
    "ಕೈ ಪತ್ತೆಯಾಗಿದೆ",

  cameraRunning:
    "ಕ್ಯಾಮೆರಾ AI ಚಾಲನೆಯಲ್ಲಿದೆ",

  cameraStarting:
    "ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭವಾಗುತ್ತಿದೆ...",

  cameraStopped:
    "ಕ್ಯಾಮೆರಾ ಆಫ್ ಆಗಿದೆ",

  alertCreated:
    "ಅಲರ್ಟ್ ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ",

  emergencyAlert:
    "ರೋಗಿಯ ತುರ್ತು ಎಚ್ಚರಿಕೆ"

},


hi: {

  code: "hi-IN",

  name: "हिन्दी",

  ok:
    "सब ठीक है",

  food:
    "खाना चाहिए",

  water:
    "पानी चाहिए",

  medicine:
    "दवा चाहिए",

  toilet:
    "शौचालय जाना है",

  emergency:
    "आपातकाल। डॉक्टर या नर्स चाहिए",

  handDetected:
    "हाथ का पता चला",

  cameraRunning:
    "कैमरा AI चल रहा है",

  cameraStarting:
    "कैमरा शुरू हो रहा है...",

  cameraStopped:
    "कैमरा बंद है",

  alertCreated:
    "अलर्ट सफलतापूर्वक बनाया गया",

  emergencyAlert:
    "मरीज का गंभीर अलर्ट"

}

};



function currentLanguageKey() {

  return $("languageSelect")
    ? $("languageSelect").value
    : "en";

}


function currentLanguage() {

  return LANGUAGES[
    currentLanguageKey()
  ] || LANGUAGES.en;

}



/* =====================================
   GESTURE MAPPING
===================================== */

const FINGER_GESTURES = {


0: {

  key: "ok",

  gesture: "0 Fingers",

  emoji: "✊",

  priority: "Normal",

  confidence: 94

},


1: {

  key: "food",

  gesture: "1 Finger",

  emoji: "🍛",

  priority: "Normal",

  confidence: 95

},


2: {

  key: "water",

  gesture: "2 Fingers",

  emoji: "💧",

  priority: "Normal",

  confidence: 95

},


3: {

  key: "medicine",

  gesture: "3 Fingers",

  emoji: "💊",

  priority: "High",

  confidence: 96

},


4: {

  key: "toilet",

  gesture: "4 Fingers",

  emoji: "🚻",

  priority: "High",

  confidence: 96

},


5: {

  key: "emergency",

  gesture: "5 Fingers",

  emoji: "🚨",

  priority: "Critical",

  confidence: 98

}

};



/* =====================================
   BASIC HELPERS
===================================== */

function escapeHTML(value) {

  return String(value ?? "")

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}



function showToast(message, error = false) {

  const toast = $("toast");

  if (!toast) return;


  toast.textContent =
    message;


  toast.classList.add(
    "show"
  );


  if (error) {

    toast.classList.add(
      "error"
    );

  } else {

    toast.classList.remove(
      "error"
    );

  }


  clearTimeout(
    showToast.timer
  );


  showToast.timer =
    setTimeout(
      () => {

        toast.classList.remove(
          "show"
        );

      },
      3000
    );

}



function formatDate(value) {

  if (!value) return "-";


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return String(value);

  }


  return date.toLocaleString();

}



/* =====================================
   API
===================================== */

async function api(
  url,
  options = {}
) {

  const controller =
    new AbortController();


  const timeout =
    setTimeout(
      () => controller.abort(),
      10000
    );


  try {

    const config = {

      cache: "no-store",

      ...options,

      signal:
        controller.signal

    };


    if (

      options.body &&

      !(options.body instanceof FormData)

    ) {

      config.headers = {

        "Content-Type":
          "application/json",

        ...(options.headers || {})

      };

    }


    const response =
      await fetch(
        url,
        config
      );


    clearTimeout(timeout);


    let data;


    try {

      data =
        await response.json();

    } catch {

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

    clearTimeout(timeout);

    throw error;

  }

}



/* =====================================
   VOICE
===================================== */

function loadVoices() {

  if (
    !("speechSynthesis" in window)
  ) {

    voices = [];

    return;

  }


  voices =
    speechSynthesis.getVoices();

}


function setupVoices() {

  if (
    !("speechSynthesis" in window)
  ) {

    return;

  }


  loadVoices();


  speechSynthesis.onvoiceschanged =
    loadVoices;


  setTimeout(
    loadVoices,
    500
  );


  setTimeout(
    loadVoices,
    1500
  );

}


function findVoice(
  languageCode
) {

  loadVoices();


  const target =
    languageCode.toLowerCase();


  const base =
    target.split("-")[0];


  let voice =
    voices.find(

      (item) =>

        item.lang
          .toLowerCase() === target

    );


  if (voice) {

    return voice;

  }


  voice =
    voices.find(

      (item) =>

        item.lang
          .toLowerCase()
          .startsWith(base)

    );


  return voice || null;

}


function speak(
  text,
  languageKey = null
) {

  if (!text) return;


  if (
    !("speechSynthesis" in window)
  ) {

    showToast(
      "Voice is not supported",
      true
    );

    return;

  }


  try {

    const key =
      languageKey ||
      currentLanguageKey();


    const language =
      LANGUAGES[key] ||
      LANGUAGES.en;


    speechSynthesis.cancel();


    const utterance =
      new SpeechSynthesisUtterance(
        text
      );


    utterance.lang =
      language.code;


    utterance.rate =
      0.85;


    utterance.pitch =
      1;


    utterance.volume =
      1;


    const voice =
      findVoice(
        language.code
      );


    if (voice) {

      utterance.voice =
        voice;

    }


    speechSynthesis.speak(
      utterance
    );


    setTimeout(
      () => {

        if (
          speechSynthesis.paused
        ) {

          speechSynthesis.resume();

        }

      },
      200
    );


  } catch (error) {

    console.error(
      "VOICE ERROR:",
      error
    );

  }

}



/* =====================================
   NAVIGATION
===================================== */

function page(name) {

  document
    .querySelectorAll(".page")
    .forEach(

      (section) => {

        section.classList.toggle(

          "active",

          section.id === name

        );

      }

    );


  document
    .querySelectorAll(".nav")
    .forEach(

      (button) => {

        button.classList.toggle(

          "active",

          button.dataset.page === name

        );

      }

    );


  const titles = {

    dashboard:
      "Nurse Dashboard",

    gesture:
      "Gesture Communication",

    alerts:
      "Alert Center",

    patient:
      "Patient Care",

    reports:
      "Medical Reports",

    appointments:
      "Appointments",

    analytics:
      "Analytics",

    mobile:
      "Mobile App"

  };


  if ($("pageTitle")) {

    $("pageTitle").textContent =

      titles[name] ||

      "CareGesture AI";

  }


  if (

    name === "dashboard" ||

    name === "alerts" ||

    name === "analytics"

  ) {

    refresh();

  }

}



/* =====================================
   RENDER ALERTS
===================================== */

function priorityIcon(priority) {

  if (
    priority === "Critical"
  ) {

    return "🚨";

  }


  if (
    priority === "High"
  ) {

    return "⚠️";

  }


  return "🔔";

}


function alertCard(alert) {

  return `

<div class="alert-card">

<b>

${priorityIcon(alert.priority)}

${escapeHTML(alert.priority)}

·

${escapeHTML(alert.status)}

</b>


<div class="alert-message">

${escapeHTML(alert.message)}

</div>


<div class="alert-meta">

Patient:

${escapeHTML(alert.patientId)}

· Room:

${escapeHTML(alert.room)}

· Bed:

${escapeHTML(alert.bed)}

·

${escapeHTML(alert.confidence)}%

</div>


<div class="alert-meta">

${escapeHTML(alert.gesture)}

·

${formatDate(alert.createdAt)}

</div>


<div class="alert-actions">


<button
class="primary act"
data-id="${escapeHTML(alert.id)}"
data-action="voice">

🔊 Voice

</button>


<button
class="outline act"
data-id="${escapeHTML(alert.id)}"
data-action="acknowledge">

✓ Acknowledge

</button>


<button
class="outline act"
data-id="${escapeHTML(alert.id)}"
data-action="resolve">

✓ Resolve

</button>


<button
class="outline act"
data-id="${escapeHTML(alert.id)}"
data-action="escalate">

🚨 Escalate

</button>


</div>


</div>

`;

}



function render() {

  const alerts =
    state.alerts || [];


  const active =
    alerts.filter(

      (alert) =>

        alert.status !==
        "Resolved"

    );


  const critical =
    alerts.filter(

      (alert) =>

        alert.priority ===
        "Critical" &&

        alert.status !==
        "Resolved"

    );


  const today =
    new Date()
      .toISOString()
      .slice(0, 10);


  const todayAlerts =
    alerts.filter(

      (alert) =>

        String(
          alert.createdAt || ""
        ).slice(0, 10) === today

    );


  const confidenceValues =
    alerts

      .map(
        (alert) =>
          Number(alert.confidence)
      )

      .filter(
        Number.isFinite
      );


  if ($("activeCount")) {

    $("activeCount").textContent =
      active.length;

  }


  if ($("criticalCount")) {

    $("criticalCount").textContent =
      critical.length;

  }


  if ($("todayCount")) {

    $("todayCount").textContent =
      todayAlerts.length;

  }


  if ($("confidenceStat")) {

    $("confidenceStat").textContent =

      confidenceValues.length

        ?

        Math.round(

          confidenceValues.reduce(

            (sum, value) =>
              sum + value,

            0

          ) /

          confidenceValues.length

        ) + "%"

        :

        "—";

  }


  if ($("recentAlerts")) {

    $("recentAlerts").innerHTML =

      alerts
        .slice(0, 5)
        .map(alertCard)
        .join("")

      ||

      "<p>No alerts yet.</p>";

  }


  let filtered =
    alerts;


  if (
    activeFilter !== "all"
  ) {

    if (
      activeFilter === "Critical"
    ) {

      filtered =
        alerts.filter(

          (alert) =>

            alert.priority ===
            "Critical"

        );

    } else {

      filtered =
        alerts.filter(

          (alert) =>

            alert.status ===
            activeFilter

        );

    }

  }


  if ($("alertList")) {

    $("alertList").innerHTML =

      filtered
        .map(alertCard)
        .join("")

      ||

      "<p>No alerts found.</p>";

  }


  renderReports();

  renderAppointments();

  renderAnalytics();

}



/* =====================================
   REPORTS
===================================== */

function renderReports() {

  const container =
    $("reportList");


  if (!container) return;


  container.innerHTML =

    (state.reports || [])

      .map(

        (report) => `

<div class="alert-card">

<b>

📄

${escapeHTML(
  report.originalName
)}

</b>


<div class="alert-meta">

Patient:

${escapeHTML(
  report.patientId
)}

·

${formatDate(
  report.uploadedAt
)}

</div>


<br>


<a
class="outline"
href="/uploads/${encodeURIComponent(
  report.storedName
)}"
target="_blank">

Open Report

</a>


</div>

`

      )

      .join("")

    ||

    "<p>No reports.</p>";

}



/* =====================================
   APPOINTMENTS
===================================== */

function renderAppointments() {

  const container =
    $("appointmentList");


  if (!container) return;


  container.innerHTML =

    (state.appointments || [])

      .map(

        (item) => `

<div class="alert-card">

<b>

📅

${escapeHTML(item.date)}

${escapeHTML(item.time)}

</b>


<div class="alert-meta">

${escapeHTML(item.doctor)}

·

${escapeHTML(item.status)}

</div>


</div>

`

      )

      .join("")

    ||

    "<p>No appointments.</p>";

}



/* =====================================
   ANALYTICS
===================================== */

function renderAnalytics() {

  const alerts =
    state.alerts || [];


  if ($("aTotal")) {

    $("aTotal").textContent =
      alerts.length;

  }


  if ($("aResolved")) {

    $("aResolved").textContent =

      alerts.filter(

        (alert) =>

          alert.status ===
          "Resolved"

      ).length;

  }


  if ($("aEscalated")) {

    $("aEscalated").textContent =

      alerts.filter(

        (alert) =>

          alert.status ===
          "Escalated"

      ).length;

  }


  if ($("aAppointments")) {

    $("aAppointments").textContent =

      (state.appointments || [])
        .length;

  }


  const container =
    $("gestureBars");


  if (!container) return;


  const counts = {};


  alerts.forEach(

    (alert) => {

      const gesture =
        alert.gesture ||
        "Unknown";


      counts[gesture] =

        (counts[gesture] || 0) + 1;

    }

  );


  const entries =
    Object.entries(counts);


  if (!entries.length) {

    container.innerHTML =
      "<p>No gesture data.</p>";

    return;

  }


  const max =
    Math.max(

      ...entries.map(
        ([, count]) => count
      ),

      1

    );


  container.innerHTML =

    entries.map(

      ([gesture, count]) => {

        const percentage =

          Math.round(

            count /
            max *
            100

          );


        return `

<div class="alert-card">

<div
style="display:flex;justify-content:space-between">

<b>
${escapeHTML(gesture)}
</b>

<b>
${count}
</b>

</div>


<div
style="width:100%;height:10px;background:#ddd;border-radius:10px;overflow:hidden;margin-top:10px">

<div
style="width:${percentage}%;height:100%;background:#2563eb">

</div>

</div>


</div>

`;

      }

    ).join("");

}



/* =====================================
   REFRESH
===================================== */

async function refresh() {

  try {

    state =
      await api(
        "/api/state"
      );


    render();


  } catch (error) {

    console.warn(
      "REFRESH ERROR:",
      error
    );

  }

}



/* =====================================
   BROWSER NOTIFICATIONS
===================================== */

async function enableNotifications() {

  if (
    !("Notification" in window)
  ) {

    showToast(
      "Notifications are not supported",
      true
    );

    return;

  }


  try {

    const permission =
      await Notification.requestPermission();


    if (
      permission === "granted"
    ) {

      showToast(
        "Notifications enabled"
      );

    } else {

      showToast(
        "Notification permission denied",
        true
      );

    }

  } catch {

    showToast(
      "Could not enable notifications",
      true
    );

  }

}



function showBrowserNotification(alert) {

  if (

    "Notification" in window &&

    Notification.permission ===
    "granted"

  ) {

    new Notification(

      "CareGesture AI Alert",

      {

        body:

          `${alert.message} • Room ${alert.room} • Bed ${alert.bed}`

      }

    );

  }

}



/* =====================================
   ALERT OVERLAY
===================================== */

function showOverlay(alert) {

  if (!alert) return;


  activeAlert =
    alert;


  const language =
    LANGUAGES[
      alert.language
    ] || LANGUAGES.en;


  $("overlayMessage").textContent =
    alert.message;


  $("overlayMeta").textContent =

    `Room ${alert.room} · Bed ${alert.bed}`;


  $("overlayPatient").textContent =

    `Patient ${alert.patientId} · ${
      alert.patientName ||
      "Demo Patient"
    }`;


  $("overlayPriority").textContent =

    alert.priority === "Critical"

      ?

      `🚨 ${language.emergencyAlert}`

      :

      "🔔 PATIENT ALERT";


  $("alertOverlay")
    ?.classList
    .add("show");


  speak(

    `${alert.message}. Room ${alert.room}. Bed ${alert.bed}.`,

    alert.language

  );


  showBrowserNotification(
    alert
  );

}



function closeOverlay() {

  $("alertOverlay")
    ?.classList
    .remove("show");


  if (
    "speechSynthesis" in window
  ) {

    speechSynthesis.cancel();

  }

}



/* =====================================
   CREATE ALERT
===================================== */

async function createAlert(
  gestureKey,
  options = {}
) {

  try {

    const languageKey =
      currentLanguageKey();


    const language =
      currentLanguage();


    const message =

      options.message ||

      language[gestureKey];


    if (!message) {

      throw new Error(
        "Invalid gesture"
      );

    }


    const patientId =

      $("patientId")?.value.trim()

      ||

      "P1001";


    const room =

      $("room")?.value.trim()

      ||

      "204";


    const bed =

      $("bed")?.value.trim()

      ||

      "3";


    const alert =
      await api(

        "/api/alerts",

        {

          method: "POST",

          body:

            JSON.stringify({

              patientId,

              patientName:
                "Demo Patient",

              room,

              bed,

              gesture:
                options.gesture ||
                gestureKey,

              message,

              language:
                languageKey,

              priority:
                options.priority ||
                "Normal",

              confidence:
                options.confidence ||
                95

            })

        }

      );


    showToast(
      language.alertCreated
    );


    showOverlay(
      alert
    );


    await refresh();


    return alert;


  } catch (error) {

    console.error(
      "CREATE ALERT ERROR:",
      error
    );


    showToast(
      error.message,
      true
    );


    return null;

  }

}



/* =====================================
   ALERT ACTIONS
===================================== */

async function alertAction(
  id,
  action
) {

  if (
    action === "voice"
  ) {

    const alert =
      state.alerts.find(

        (item) =>

          String(item.id) ===
          String(id)

      );


    if (alert) {

      speak(

        `${alert.message}. Room ${alert.room}. Bed ${alert.bed}.`,

        alert.language

      );

    }


    return;

  }


  try {

    await api(

      `/api/alerts/${encodeURIComponent(id)}`,

      {

        method: "PATCH",

        body:

          JSON.stringify({
            action
          })

      }

    );


    await refresh();


    showToast(
      "Alert updated successfully"
    );


  } catch (error) {

    showToast(
      error.message,
      true
    );

  }

}



/* =====================================
   HAND LANDMARK DRAWING
===================================== */

const HAND_CONNECTIONS = [

[0,1],
[1,2],
[2,3],
[3,4],

[0,5],
[5,6],
[6,7],
[7,8],

[0,9],
[9,10],
[10,11],
[11,12],

[0,13],
[13,14],
[14,15],
[15,16],

[0,17],
[17,18],
[18,19],
[19,20],

[5,9],
[9,13],
[13,17]

];


function drawHand(landmarks) {

  const video =
    $("inputVideo");


  const canvas =
    $("outputCanvas");


  if (!video || !canvas) {

    return;

  }


  canvas.width =
    video.videoWidth ||
    640;


  canvas.height =
    video.videoHeight ||
    480;


  const context =
    canvas.getContext("2d");


  context.clearRect(

    0,
    0,

    canvas.width,
    canvas.height

  );


  if (!landmarks) return;


  context.strokeStyle =
    "#22c55e";


  context.lineWidth =
    3;


  HAND_CONNECTIONS.forEach(

    ([start, end]) => {

      const a =
        landmarks[start];


      const b =
        landmarks[end];


      context.beginPath();


      context.moveTo(

        a.x * canvas.width,

        a.y * canvas.height

      );


      context.lineTo(

        b.x * canvas.width,

        b.y * canvas.height

      );


      context.stroke();

    }

  );


  context.fillStyle =
    "#00ff88";


  landmarks.forEach(

    (point) => {

      context.beginPath();


      context.arc(

        point.x * canvas.width,

        point.y * canvas.height,

        5,

        0,

        Math.PI * 2

      );


      context.fill();

    }

  );

}



/* =====================================
   FINGER COUNTING
===================================== */

function distance(a, b) {

  const x =
    a.x - b.x;


  const y =
    a.y - b.y;


  return Math.sqrt(
    x * x +
    y * y
  );

}



function countFingers(landmarks) {

  if (
    !landmarks ||
    landmarks.length < 21
  ) {

    return 0;

  }


  let count = 0;


  /* INDEX */

  if (
    landmarks[8].y <
    landmarks[6].y
  ) {

    count++;

  }


  /* MIDDLE */

  if (
    landmarks[12].y <
    landmarks[10].y
  ) {

    count++;

  }


  /* RING */

  if (
    landmarks[16].y <
    landmarks[14].y
  ) {

    count++;

  }


  /* PINKY */

  if (
    landmarks[20].y <
    landmarks[18].y
  ) {

    count++;

  }


  /* THUMB */

  const wrist =
    landmarks[0];


  const tip =
    landmarks[4];


  const ip =
    landmarks[3];


  const mcp =
    landmarks[2];


  const tipDistance =
    distance(
      tip,
      wrist
    );


  const ipDistance =
    distance(
      ip,
      wrist
    );


  const mcpDistance =
    distance(
      mcp,
      wrist
    );


  if (

    tipDistance >
    ipDistance * 1.15

    &&

    tipDistance >
    mcpDistance * 1.25

  ) {

    count++;

  }


  return Math.max(
    0,
    Math.min(
      5,
      count
    )
  );

}



/* =====================================
   GESTURE DETECTION
===================================== */

function updateDetectionUI(
  fingerCount
) {

  const info =
    FINGER_GESTURES[
      fingerCount
    ];


  if (!info) return;


  const language =
    currentLanguage();


  if ($("detectedGesture")) {

    $("detectedGesture").textContent =
      info.gesture;

  }


  if ($("detectedEmoji")) {

    $("detectedEmoji").textContent =
      info.emoji;

  }


  if ($("detectedNeed")) {

    $("detectedNeed").textContent =
      language[info.key];

  }


  if ($("detectedDetail")) {

    $("detectedDetail").textContent =

      `Gesture detected: ${info.gesture}`;

  }

}



function processGesture(
  fingerCount
) {

  const info =
    FINGER_GESTURES[
      fingerCount
    ];


  if (!info) return;


  updateDetectionUI(
    fingerCount
  );


  if (
    candidateGesture !==
    fingerCount
  ) {

    candidateGesture =
      fingerCount;


    stableFrames =
      1;


    return;

  }


  stableFrames++;


  if (
    stableFrames < 8
  ) {

    return;

  }


  if (
    lastDetectedGesture ===
    fingerCount
  ) {

    return;

  }


  lastDetectedGesture =
    fingerCount;


  handleDetectedGesture(
    fingerCount
  );

}



async function handleDetectedGesture(
  fingerCount
) {

  const info =
    FINGER_GESTURES[
      fingerCount
    ];


  if (!info) return;


  const now =
    Date.now();


  if (

    lastAlertGesture ===
    fingerCount

    &&

    now -
    lastAlertTime <
    4000

  ) {

    return;

  }


  lastAlertGesture =
    fingerCount;


  lastAlertTime =
    now;


  const language =
    currentLanguage();


  if ($("cameraStatus")) {

    $("cameraStatus").textContent =

      `${language.handDetected}: ${info.gesture} → ${language[info.key]}`;

  }


  await createAlert(

    info.key,

    {

      gesture:
        info.gesture,

      priority:
        info.priority,

      confidence:
        info.confidence

    }

  );

}



/* =====================================
   MEDIAPIPE RESULTS
===================================== */

function onResults(results) {

  processingFrame =
    false;


  if (

    !results ||

    !results.multiHandLandmarks ||

    !results.multiHandLandmarks.length

  ) {

    candidateGesture =
      null;


    stableFrames =
      0;


    lastDetectedGesture =
      null;


    return;

  }


  const landmarks =
    results.multiHandLandmarks[0];


  drawHand(
    landmarks
  );


  const fingerCount =
    countFingers(
      landmarks
    );


  processGesture(
    fingerCount
  );

}



/* =====================================
   INITIALIZE MEDIAPIPE
===================================== */

function initializeHands() {

  if (hands) {

    return true;

  }


  if (
    !window.Hands
  ) {

    console.error(
      "MediaPipe Hands library not loaded"
    );


    return false;

  }


  try {

    hands =
      new window.Hands({

        locateFile:

          (file) =>

            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`

      });


    hands.setOptions({

      maxNumHands: 1,

      modelComplexity: 1,

      minDetectionConfidence:
        0.6,

      minTrackingConfidence:
        0.6

    });


    hands.onResults(
      onResults
    );


    return true;


  } catch (error) {

    console.error(
      "MEDIAPIPE ERROR:",
      error
    );


    return false;

  }

}



/* =====================================
   VIDEO AI LOOP
===================================== */

async function processVideoFrame() {

  if (
    !cameraRunning
  ) {

    return;

  }


  const video =
    $("inputVideo");


  if (

    !processingFrame &&

    hands &&

    video &&

    video.readyState >= 2

  ) {

    processingFrame =
      true;


    try {

      await hands.send({

        image:
          video

      });

    } catch (error) {

      console.error(
        "FRAME ERROR:",
        error
      );


      processingFrame =
        false;

    }

  }


  if (
    cameraRunning
  ) {

    animationId =
      requestAnimationFrame(
        processVideoFrame
      );

  }

}



/* =====================================
   START CAMERA
===================================== */

async function startCamera() {

  if (
    cameraRunning
  ) {

    showToast(
      "Camera is already running"
    );

    return;

  }


  const video =
    $("inputVideo");


  if (!video) {

    showToast(
      "Camera element not found",
      true
    );

    return;

  }


  if (

    !navigator.mediaDevices ||

    !navigator.mediaDevices.getUserMedia

  ) {

    showToast(
      "Camera is not supported in this browser",
      true
    );

    return;

  }


  try {

    const language =
      currentLanguage();


    $("cameraStatus").textContent =
      language.cameraStarting;


    $("cameraDiagnostic").textContent =
      "Checking AI library...";


    const aiReady =
      initializeHands();


    if (!aiReady) {

      $("cameraStatus").textContent =
        "AI library could not load";


      $("cameraDiagnostic").textContent =

        "MediaPipe Hands is missing. Check internet connection and reload the page.";


      showToast(

        "AI library could not load. Check internet connection.",

        true

      );


      return;

    }


    $("cameraDiagnostic").textContent =
      "Requesting camera permission...";


    try {

      stream =
        await navigator
          .mediaDevices
          .getUserMedia({

            video: {

              facingMode: {
                ideal: "user"
              },

              width: {
                ideal: 1280
              },

              height: {
                ideal: 720
              }

            },

            audio: false

          });

    } catch {

      stream =
        await navigator
          .mediaDevices
          .getUserMedia({

            video: true,

            audio: false

          });

    }


    video.srcObject =
      stream;


    await new Promise(

      (resolve) => {

        video.onloadedmetadata =
          resolve;

      }

    );


    await video.play();


    cameraRunning =
      true;


    candidateGesture =
      null;


    stableFrames =
      0;


    lastDetectedGesture =
      null;


    lastAlertGesture =
      null;


    $("cameraStatus").textContent =
      language.cameraRunning;


    $("cameraDiagnostic").textContent =
      "Camera connected. AI hand detection is active.";


    showToast(
      "Camera AI started. Show your hand."
    );


    processVideoFrame();


  } catch (error) {

    console.error(
      "CAMERA ERROR:",
      error
    );


    cameraRunning =
      false;


    let message =
      "Camera could not start";


    if (
      error.name ===
      "NotAllowedError"
    ) {

      message =
        "Camera permission denied";

    }


    else if (
      error.name ===
      "NotFoundError"
    ) {

      message =
        "No camera found";

    }


    $("cameraStatus").textContent =
      message;


    $("cameraDiagnostic").textContent =
      error.message;


    showToast(
      message,
      true
    );

  }

}



/* =====================================
   STOP CAMERA
===================================== */

function stopCamera() {

  cameraRunning =
    false;


  processingFrame =
    false;


  if (
    animationId
  ) {

    cancelAnimationFrame(
      animationId
    );

    animationId =
      null;

  }


  if (stream) {

    stream
      .getTracks()
      .forEach(

        (track) =>
          track.stop()

      );


    stream = null;

  }


  const video =
    $("inputVideo");


  if (video) {

    video.srcObject =
      null;

  }


  const canvas =
    $("outputCanvas");


  if (canvas) {

    canvas
      .getContext("2d")
      .clearRect(

        0,
        0,

        canvas.width,

        canvas.height

      );

  }


  candidateGesture =
    null;


  stableFrames =
    0;


  lastDetectedGesture =
    null;


  lastAlertGesture =
    null;


  if ($("cameraStatus")) {

    $("cameraStatus").textContent =
      currentLanguage()
        .cameraStopped;

  }


  if ($("cameraDiagnostic")) {

    $("cameraDiagnostic").textContent =
      "Camera stopped.";

  }


  showToast(
    "Camera stopped"
  );

}



/* =====================================
   REPORT UPLOAD
===================================== */

async function uploadReport(event) {

  event.preventDefault();


  try {

    await api(

      "/api/reports",

      {

        method: "POST",

        body:
          new FormData(
            event.target
          )

      }

    );


    showToast(
      "Report uploaded successfully"
    );


    event.target.reset();


    await refresh();


  } catch (error) {

    showToast(
      error.message,
      true
    );

  }

}



/* =====================================
   APPOINTMENT
===================================== */

async function createAppointment(event) {

  event.preventDefault();


  try {

    const formData =
      new FormData(
        event.target
      );


    const payload =
      Object.fromEntries(
        formData.entries()
      );


    await api(

      "/api/appointments",

      {

        method: "POST",

        body:
          JSON.stringify(
            payload
          )

      }

    );


    showToast(
      "Appointment scheduled"
    );


    event.target.reset();


    await refresh();


  } catch (error) {

    showToast(
      error.message,
      true
    );

  }

}



/* =====================================
   EVENTS
===================================== */

function setupEvents() {


document
  .querySelectorAll(".nav")
  .forEach(

    (button) => {

      button.addEventListener(

        "click",

        () =>

          page(
            button.dataset.page
          )

      );

    }

  );


$("openGestureBtn")
  ?.addEventListener(

    "click",

    () =>
      page("gesture")

  );


$("viewAlertsBtn")
  ?.addEventListener(

    "click",

    () =>
      page("alerts")

  );


$("openMobileBtn")
  ?.addEventListener(

    "click",

    () =>
      page("mobile")

  );


$("languageSelect")
  ?.addEventListener(

    "change",

    () => {

      const language =
        currentLanguage();


      $("patientLang").textContent =
        language.name;


      showToast(
        `${language.name} selected`
      );

    }

  );


$("notifyBtn")
  ?.addEventListener(

    "click",

    enableNotifications

  );


$("cameraBtn")
  ?.addEventListener(

    "click",

    startCamera

  );


$("stopCameraBtn")
  ?.addEventListener(

    "click",

    stopCamera

  );


document
  .querySelectorAll(".filter")
  .forEach(

    (button) => {

      button.addEventListener(

        "click",

        () => {

          activeFilter =
            button.dataset.filter ||
            "all";


          document
            .querySelectorAll(".filter")
            .forEach(

              (item) =>

                item.classList.remove(
                  "active"
                )

            );


          button.classList.add(
            "active"
          );


          render();

        }

      );

    }

  );


document.addEventListener(

  "click",

  (event) => {

    const button =
      event.target.closest(
        ".act"
      );


    if (!button) return;


    alertAction(

      button.dataset.id,

      button.dataset.action

    );

  }

);


$("reportForm")
  ?.addEventListener(

    "submit",

    uploadReport

  );


$("appointmentForm")
  ?.addEventListener(

    "submit",

    createAppointment

  );


$("closeAlertOverlay")
  ?.addEventListener(

    "click",

    closeOverlay

  );


$("overlayVoiceBtn")
  ?.addEventListener(

    "click",

    () => {

      if (!activeAlert) return;


      speak(

        `${activeAlert.message}. Room ${activeAlert.room}. Bed ${activeAlert.bed}.`,

        activeAlert.language

      );

    }

  );


$("overlayAckBtn")
  ?.addEventListener(

    "click",

    async () => {

      if (
        activeAlert?.id
      ) {

        await alertAction(

          activeAlert.id,

          "acknowledge"

        );


        closeOverlay();

      }

    }

  );


$("overlayResolveBtn")
  ?.addEventListener(

    "click",

    async () => {

      if (
        activeAlert?.id
      ) {

        await alertAction(

          activeAlert.id,

          "resolve"

        );


        closeOverlay();

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

        closeOverlay();

      }

    }

  );


window.addEventListener(

  "beforeunload",

  stopCamera

);

}



/* =====================================
   INITIALIZE APPLICATION
===================================== */

async function initialize() {

  console.log(
    "CareGesture AI starting..."
  );


  setupVoices();


  setupEvents();


  const language =
    currentLanguage();


  if ($("patientLang")) {

    $("patientLang").textContent =
      language.name;

  }


  if (

    typeof window.Hands ===
    "undefined"

  ) {

    console.warn(
      "MediaPipe Hands has not loaded."
    );

  } else {

    console.log(
      "MediaPipe Hands loaded successfully."
    );

  }


  try {

    const health =
      await api(
        "/api/health"
      );


    console.log(
      "Server connected:",
      health
    );


  } catch (error) {

    console.warn(
      "Server connection error:",
      error
    );

  }


  await refresh();


  setInterval(

    refresh,

    5000

  );


  console.log(
    "CareGesture AI ready."
  );

}



/* =====================================
   START
===================================== */

if (

  document.readyState ===
  "loading"

) {

  document.addEventListener(

    "DOMContentLoaded",

    initialize

  );

} else {

  initialize();

}


})();
