(() => {
  "use strict";

  /* =========================================================
     CAREGESTURE AI
     COMPLETE APP.JS
     ENGLISH + KANNADA + HINDI VOICE FIX
     ========================================================= */

  const $ = (id) => document.getElementById(id);

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
  let voiceReady = false;

  /* =========================================================
     LANGUAGE DATA
     ========================================================= */

  const LANGUAGES = {
    en: {
      code: "en-IN",
      name: "English",

      water: "Need Water",
      food: "Need Food",
      nurse: "Need Nurse",
      help: "Need Help",
      stop: "Stop / No",
      emergency: "Emergency",

      handDetected: "Hand detected",
      cameraRunning: "Camera AI is running",
      cameraStarting: "Starting camera...",
      cameraStopped: "Camera is off",

      alertCreated: "Alert created successfully",
      voiceUnavailable: "Voice is unavailable on this device",

      emergencyAlert: "CRITICAL PATIENT ALERT",

      room: "Room",
      bed: "Bed",
      patient: "Patient"
    },

    kn: {
      code: "kn-IN",
      name: "ಕನ್ನಡ",

      water: "ನೀರು ಬೇಕು",
      food: "ಆಹಾರ ಬೇಕು",
      nurse: "ನರ್ಸ್ ಬೇಕು",
      help: "ಸಹಾಯ ಬೇಕು",
      stop: "ನಿಲ್ಲಿಸಿ ಅಥವಾ ಬೇಡ",
      emergency: "ತುರ್ತು ಪರಿಸ್ಥಿತಿ",

      handDetected: "ಕೈ ಪತ್ತೆಯಾಗಿದೆ",
      cameraRunning: "ಕ್ಯಾಮೆರಾ AI ಚಾಲನೆಯಲ್ಲಿದೆ",
      cameraStarting: "ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭವಾಗುತ್ತಿದೆ...",
      cameraStopped: "ಕ್ಯಾಮೆರಾ ಆಫ್ ಆಗಿದೆ",

      alertCreated: "ಅಲರ್ಟ್ ಯಶಸ್ವಿಯಾಗಿ ರಚಿಸಲಾಗಿದೆ",
      voiceUnavailable: "ಈ ಸಾಧನದಲ್ಲಿ ಧ್ವನಿ ಲಭ್ಯವಿಲ್ಲ",

      emergencyAlert: "ರೋಗಿಯ ತುರ್ತು ಎಚ್ಚರಿಕೆ",

      room: "ಕೊಠಡಿ",
      bed: "ಹಾಸಿಗೆ",
      patient: "ರೋಗಿ"
    },

    hi: {
      code: "hi-IN",
      name: "हिन्दी",

      water: "पानी चाहिए",
      food: "खाना चाहिए",
      nurse: "नर्स चाहिए",
      help: "मदद चाहिए",
      stop: "रुकें या नहीं",
      emergency: "आपातकाल",

      handDetected: "हाथ का पता चला",
      cameraRunning: "कैमरा ए आई चल रहा है",
      cameraStarting: "कैमरा शुरू हो रहा है",
      cameraStopped: "कैमरा बंद है",

      alertCreated: "अलर्ट सफलतापूर्वक बनाया गया",
      voiceUnavailable: "इस डिवाइस पर आवाज उपलब्ध नहीं है",

      emergencyAlert: "मरीज का गंभीर अलर्ट",

      room: "कमरा",
      bed: "बेड",
      patient: "मरीज"
    }
  };


  function currentLanguage() {
    const select = $("languageSelect");
    const key = select ? select.value : "en";
    return LANGUAGES[key] || LANGUAGES.en;
  }


  function currentLanguageKey() {
    const select = $("languageSelect");
    return select ? select.value : "en";
  }


  /* =========================================================
     GESTURE MAPPING
     ========================================================= */

  const FINGER_GESTURES = {

    0: {
      key: "stop",
      gesture: "0 Fingers",
      priority: "Normal",
      confidence: 94
    },

    1: {
      key: "water",
      gesture: "1 Finger",
      priority: "Normal",
      confidence: 95
    },

    2: {
      key: "food",
      gesture: "2 Fingers",
      priority: "Normal",
      confidence: 95
    },

    3: {
      key: "nurse",
      gesture: "3 Fingers",
      priority: "High",
      confidence: 95
    },

    4: {
      key: "help",
      gesture: "4 Fingers",
      priority: "High",
      confidence: 96
    },

    5: {
      key: "emergency",
      gesture: "5 Fingers",
      priority: "Critical",
      confidence: 98
    }

  };


  /* =========================================================
     BASIC HELPERS
     ========================================================= */

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

    toast.textContent = message;

    toast.classList.add("show");

    if (error) {
      toast.classList.add("error");
    } else {
      toast.classList.remove("error");
    }

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);

  }


  function formatDate(date) {

    if (!date) return "-";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return String(date);
    }

    return d.toLocaleString();

  }


  /* =========================================================
     API
     ========================================================= */

  async function api(url, options = {}) {

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 10000);


    try {

      const fetchOptions = {
        cache: "no-store",
        ...options,
        signal: controller.signal
      };


      if (
        options.body &&
        !(options.body instanceof FormData)
      ) {

        fetchOptions.headers = {
          "Content-Type": "application/json",
          ...(options.headers || {})
        };

      }


      const response = await fetch(
        url,
        fetchOptions
      );


      clearTimeout(timeout);


      let data = null;

      try {
        data = await response.json();
      } catch (e) {
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


  /* =========================================================
     VOICE SYSTEM
     IMPORTANT:
     - Waits for voices
     - Finds English/Kannada/Hindi voice
     - Does NOT cancel the next utterance
     - Speaks message first
     - Speaks Room and Bed after message
     ========================================================= */


  function loadVoices() {

    if (!("speechSynthesis" in window)) {
      voices = [];
      return [];
    }

    voices = window.speechSynthesis.getVoices() || [];

    if (voices.length > 0) {
      voiceReady = true;
    }

    return voices;

  }


  function setupVoices() {

    if (!("speechSynthesis" in window)) {
      return;
    }


    loadVoices();


    window.speechSynthesis.addEventListener(
      "voiceschanged",
      () => {
        loadVoices();
        console.log("Speech voices loaded:", voices);
      }
    );


    setTimeout(loadVoices, 200);
    setTimeout(loadVoices, 500);
    setTimeout(loadVoices, 1000);
    setTimeout(loadVoices, 2000);
    setTimeout(loadVoices, 3000);

  }


  async function waitForVoices() {

    if (!("speechSynthesis" in window)) {
      return [];
    }


    loadVoices();

    if (voices.length > 0) {
      return voices;
    }


    return new Promise(resolve => {

      let finished = false;


      const finish = () => {

        if (finished) return;

        finished = true;

        loadVoices();

        resolve(voices);

      };


      const timer = setTimeout(
        finish,
        1500
      );


      const handler = () => {

        clearTimeout(timer);

        finish();

      };


      window.speechSynthesis.addEventListener(
        "voiceschanged",
        handler,
        { once: true }
      );

    });

  }


  function findVoice(languageKey) {

    loadVoices();


    if (!voices.length) {
      return null;
    }


    const language =
      LANGUAGES[languageKey] ||
      LANGUAGES.en;


    const target =
      language.code.toLowerCase();


    const base =
      target.split("-")[0];


    /*
       1. EXACT LANGUAGE MATCH
    */

    let voice = voices.find(v =>
      String(v.lang || "")
        .toLowerCase() === target
    );

    if (voice) return voice;


    /*
       2. SAME LANGUAGE
       kn-IN / kn
       hi-IN / hi
       en-IN / en-US
    */

    voice = voices.find(v =>
      String(v.lang || "")
        .toLowerCase()
        .startsWith(base + "-")
    );

    if (voice) return voice;


    voice = voices.find(v =>
      String(v.lang || "")
        .toLowerCase() === base
    );

    if (voice) return voice;


    /*
       3. SEARCH BY VOICE NAME
    */

    const voiceNames = {

      en: [
        "english",
        "india"
      ],

      kn: [
        "kannada",
        "ಕನ್ನಡ"
      ],

      hi: [
        "hindi",
        "हिन्दी",
        "हिंदी"
      ]

    };


    const names =
      voiceNames[languageKey] ||
      [];


    voice = voices.find(v => {

      const name =
        String(v.name || "")
          .toLowerCase();

      return names.some(item =>
        name.includes(item.toLowerCase())
      );

    });


    if (voice) return voice;


    /*
       English fallback only.
       English should continue working
       exactly as before.
    */

    if (languageKey === "en") {

      voice = voices.find(v =>
        String(v.lang || "")
          .toLowerCase()
          .startsWith("en")
      );

      if (voice) return voice;

    }


    return null;

  }


  /*
     Create one speech utterance.
  */

  function createUtterance(
    text,
    languageKey
  ) {

    const language =
      LANGUAGES[languageKey] ||
      LANGUAGES.en;


    const utterance =
      new SpeechSynthesisUtterance(
        String(text)
      );


    utterance.lang =
      language.code;


    utterance.rate =
      languageKey === "en"
        ? 0.85
        : 0.78;


    utterance.pitch = 1;

    utterance.volume = 1;


    const voice =
      findVoice(languageKey);


    if (voice) {
      utterance.voice = voice;
    }


    return utterance;

  }


  /*
     MAIN SIMPLE SPEAK FUNCTION

     Used for buttons and normal voice.
  */

  async function speak(
    text,
    languageKey = null
  ) {

    if (!text) return;


    if (!("speechSynthesis" in window)) {

      showToast(
        currentLanguage().voiceUnavailable,
        true
      );

      return;

    }


    try {

      const key =
        languageKey ||
        currentLanguageKey();


      await waitForVoices();


      /*
         Cancel old speech only ONCE
         before starting a completely
         new speech request.
      */

      window.speechSynthesis.cancel();


      await new Promise(resolve =>
        setTimeout(resolve, 120)
      );


      const utterance =
        createUtterance(
          text,
          key
        );


      utterance.onerror =
        event => {

          console.warn(
            "Speech synthesis error:",
            event.error
          );

        };


      window.speechSynthesis.speak(
        utterance
      );


      /*
         Android speech recovery
      */

      setTimeout(() => {

        try {

          if (
            window.speechSynthesis.paused
          ) {

            window.speechSynthesis.resume();

          }

        } catch (e) {}

      }, 200);


    } catch (error) {

      console.error(
        "Voice error:",
        error
      );

    }

  }


  /*
     ALERT VOICE

     VERY IMPORTANT:

     English:
       Need Food.
       Room 204.
       Bed 3.

     Kannada:
       ಆಹಾರ ಬೇಕು.
       ಕೊಠಡಿ 204.
       ಹಾಸಿಗೆ 3.

     Hindi:
       खाना चाहिए।
       कमरा 204।
       बेड 3।

     Message is spoken FIRST.

     Room and Bed are spoken only
     AFTER the gesture message.

     This fixes the previous problem.
  */

  async function speakAlert(alert) {

    if (!alert) return;


    if (!("speechSynthesis" in window)) {

      showToast(
        currentLanguage().voiceUnavailable,
        true
      );

      return;

    }


    try {

      const languageKey =
        LANGUAGES[alert.language]
          ? alert.language
          : currentLanguageKey();


      const L =
        LANGUAGES[languageKey] ||
        LANGUAGES.en;


      await waitForVoices();


      /*
         STOP PREVIOUS ALERT SPEECH
      */

      window.speechSynthesis.cancel();


      await new Promise(resolve =>
        setTimeout(resolve, 150)
      );


      /*
         IMPORTANT:
         Create separate utterances.

         DO NOT call speak() three times,
         because speak() cancels previous speech.

         Put all utterances into the SAME
         speech queue.
      */


      const messageText =
        String(
          alert.message || ""
        ).trim();


      const roomText =
        `${L.room} ${alert.room}`;


      const bedText =
        `${L.bed} ${alert.bed}`;


      /*
         1. DETECTED GESTURE MESSAGE
      */

      if (messageText) {

        const messageUtterance =
          createUtterance(
            messageText,
            languageKey
          );


        messageUtterance.onerror =
          event => {

            console.warn(
              "Gesture voice error:",
              event.error
            );

          };


        window.speechSynthesis.speak(
          messageUtterance
        );

      }


      /*
         2. ROOM
      */

      const roomUtterance =
        createUtterance(
          roomText,
          languageKey
        );


      roomUtterance.onerror =
        event => {

          console.warn(
            "Room voice error:",
            event.error
          );

        };


      window.speechSynthesis.speak(
        roomUtterance
      );


      /*
         3. BED
      */

      const bedUtterance =
        createUtterance(
          bedText,
          languageKey
        );


      bedUtterance.onerror =
        event => {

          console.warn(
            "Bed voice error:",
            event.error
          );

        };


      window.speechSynthesis.speak(
        bedUtterance
      );


      /*
         Android recovery
      */

      setTimeout(() => {

        try {

          if (
            window.speechSynthesis.paused
          ) {

            window.speechSynthesis.resume();

          }

        } catch (e) {}

      }, 250);


    } catch (error) {

      console.error(
        "Alert voice error:",
        error
      );

    }

  }


  /* =========================================================
     LANGUAGE UI
     ========================================================= */

  function updateLanguage() {

    const L =
      currentLanguage();


    const patientLang =
      $("patientLang");


    if (patientLang) {

      patientLang.textContent =
        L.name;

    }


    /*
       Load voices when language changes.
    */

    loadVoices();


    showToast(
      `${L.name} selected`
    );

  }


  /* =========================================================
     NAVIGATION
     ========================================================= */

  function page(pageName) {

    document
      .querySelectorAll(".page")
      .forEach(section => {

        section.classList.toggle(
          "active",
          section.id === pageName
        );

      });


    document
      .querySelectorAll(".nav")
      .forEach(button => {

        button.classList.toggle(
          "active",
          button.dataset.page === pageName
        );

      });


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


    const title =
      $("pageTitle");


    if (title) {

      title.textContent =
        titles[pageName] ||
        "CareGesture AI";

    }


    if (
      pageName === "alerts" ||
      pageName === "dashboard" ||
      pageName === "analytics"
    ) {

      refresh();

    }

  }


  /* =========================================================
     ALERT RENDERING
     ========================================================= */

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


  function card(alert) {

    return `

      <div class="alert-card
        ${alert.priority === "Critical"
          ? "critical"
          : ""
        }">

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

          Patient
          ${escapeHTML(alert.patientId)}

          · Room
          ${escapeHTML(alert.room)}

          · Bed
          ${escapeHTML(alert.bed)}

          · ${escapeHTML(alert.confidence)}%

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
        a =>
          a.status !== "Resolved"
      );


    const critical =
      alerts.filter(
        a =>
          a.priority === "Critical" &&
          a.status !== "Resolved"
      );


    const confidence =
      alerts
        .map(
          a =>
            Number(a.confidence)
        )
        .filter(
          Number.isFinite
        );


    const today =
      new Date()
        .toISOString()
        .slice(0, 10);


    const todayAlerts =
      alerts.filter(
        a =>
          String(a.createdAt || "")
            .slice(0, 10) === today
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
        confidence.length
          ? Math.round(
              confidence.reduce(
                (sum, value) =>
                  sum + value,
                0
              ) /
              confidence.length
            ) + "%"
          : "—";

    }


    if ($("recentAlerts")) {

      $("recentAlerts").innerHTML =
        alerts
          .slice(0, 5)
          .map(card)
          .join("")
        ||
        "<p>No alerts yet.</p>";

    }


    let filteredAlerts =
      alerts;


    if (
      activeFilter !== "all"
    ) {

      if (
        activeFilter === "Critical"
      ) {

        filteredAlerts =
          alerts.filter(
            a =>
              a.priority === "Critical"
          );

      } else {

        filteredAlerts =
          alerts.filter(
            a =>
              a.status === activeFilter
          );

      }

    }


    if ($("alertList")) {

      $("alertList").innerHTML =
        filteredAlerts
          .map(card)
          .join("")
        ||
        "<p>No alerts in this filter.</p>";

    }


    if ($("reportList")) {

      $("reportList").innerHTML =
        (state.reports || [])
          .map(report => `

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
                target="_blank"
                rel="noopener">

                Open Report

              </a>

            </div>

          `)
          .join("")
        ||
        "<p>No reports.</p>";

    }


    if ($("appointmentList")) {

      $("appointmentList").innerHTML =
        (state.appointments || [])
          .map(appointment => `

            <div class="alert-card">

              <b>
                📅
                ${escapeHTML(
                  appointment.date
                )}

                ${escapeHTML(
                  appointment.time
                )}
              </b>


              <div class="alert-meta">

                ${escapeHTML(
                  appointment.doctor
                )}

                ·

                ${escapeHTML(
                  appointment.status
                )}

              </div>

            </div>

          `)
          .join("")
        ||
        "<p>No appointments.</p>";

    }


    if ($("aTotal")) {

      $("aTotal").textContent =
        alerts.length;

    }


    if ($("aResolved")) {

      $("aResolved").textContent =
        alerts.filter(
          a =>
            a.status === "Resolved"
        ).length;

    }


    if ($("aEscalated")) {

      $("aEscalated").textContent =
        alerts.filter(
          a =>
            a.status === "Escalated"
        ).length;

    }


    if ($("aAppointments")) {

      $("aAppointments").textContent =
        (state.appointments || [])
          .length;

    }


    renderGestureAnalytics(
      alerts
    );

  }


  function renderGestureAnalytics(alerts) {

    const container =
      $("gestureBars");


    if (!container) {
      return;
    }


    const counts = {};


    alerts.forEach(alert => {

      const gesture =
        alert.gesture ||
        "Unknown";


      counts[gesture] =
        (counts[gesture] || 0) + 1;

    });


    const entries =
      Object.entries(counts);


    if (!entries.length) {

      container.innerHTML =
        "<p>No gesture data.</p>";

      return;

    }


    const maximum =
      Math.max(
        ...entries.map(
          entry => entry[1]
        ),
        1
      );


    container.innerHTML =
      entries
        .map(
          ([gesture, count]) => {

            const percentage =
              Math.round(
                count /
                maximum *
                100
              );


            return `

              <div class="alert-card">

                <div
                  style="
                    display:flex;
                    justify-content:space-between;
                  ">

                  <b>
                    ${escapeHTML(gesture)}
                  </b>

                  <b>
                    ${count}
                  </b>

                </div>


                <div
                  style="
                    width:100%;
                    height:10px;
                    background:#ddd;
                    border-radius:10px;
                    overflow:hidden;
                    margin-top:10px;
                  ">

                  <div
                    style="
                      width:${percentage}%;
                      height:100%;
                      background:#2563eb;
                    ">

                  </div>

                </div>

              </div>

            `;

          }
        )
        .join("");

  }


  /* =========================================================
     REFRESH DATA
     ========================================================= */

  async function refresh() {

    try {

      state =
        await api(
          "/api/state"
        );


      render();


    } catch (error) {

      console.warn(
        "Refresh error:",
        error
      );

    }

  }


  /* =========================================================
     BROWSER NOTIFICATION
     ========================================================= */

  function showBrowserNotification(alert) {

    if (
      !("Notification" in window)
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
            `${alert.message} • Room ${alert.room} • Bed ${alert.bed}`

        }
      );

    } catch (error) {

      console.warn(
        "Notification error:",
        error
      );

    }

  }


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
          "Notification permission was not granted",
          true
        );

      }

    } catch (error) {

      showToast(
        "Could not enable notifications",
        true
      );

    }

  }


  /* =========================================================
     ALERT OVERLAY
     ========================================================= */

  function overlay(alert) {

    if (!alert) {
      return;
    }


    activeAlert =
      alert;


    const L =
      LANGUAGES[
        alert.language
      ] ||
      currentLanguage();


    if ($("overlayMessage")) {

      $("overlayMessage").textContent =
        alert.message;

    }


    if ($("overlayMeta")) {

      $("overlayMeta").textContent =
        `Room ${alert.room} · Bed ${alert.bed}`;

    }


    if ($("overlayPatient")) {

      $("overlayPatient").textContent =
        `Patient ${alert.patientId} · ${
          alert.patientName ||
          "Demo Patient"
        }`;

    }


    if ($("overlayPriority")) {

      $("overlayPriority").textContent =

        alert.priority === "Critical"

          ? `🚨 ${L.emergencyAlert}`

          : "🔔 PATIENT ALERT";

    }


    $("alertOverlay")
      ?.classList
      .add("show");


    /*
       IMPORTANT:
       Use speakAlert().
       This speaks:
       1. Gesture message
       2. Room
       3. Bed
    */

    speakAlert(alert);


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

      window
        .speechSynthesis
        .cancel();

    }

  }


  /* =========================================================
     CREATE ALERT
     ========================================================= */

  async function createAlert(
    gestureKey,
    options = {}
  ) {

    try {

      const languageKey =
        currentLanguageKey();


      const L =
        currentLanguage();


      const message =
        options.message ||
        L[gestureKey];


      if (!message) {

        throw new Error(
          "Invalid gesture"
        );

      }


      const patientId =
        $("patientId")?.value
          .trim()
        || "P1001";


      const room =
        $("room")?.value
          .trim()
        || "204";


      const bed =
        $("bed")?.value
          .trim()
        || "3";


      const priority =
        options.priority ||

        (
          gestureKey === "emergency"

            ? "Critical"

            : (
              gestureKey === "help" ||
              gestureKey === "nurse"
            )

              ? "High"

              : "Normal"
        );


      const gesture =
        options.gesture ||
        gestureKey;


      const confidence =
        options.confidence ||
        95;


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

                gesture,

                message,

                language:
                  languageKey,

                priority,

                confidence

              })

          }
        );


      showToast(
        L.alertCreated
      );


      overlay(
        alert
      );


      await refresh();


      return alert;


    } catch (error) {

      console.error(
        "Create alert error:",
        error
      );


      showToast(
        error.message ||
        "Alert could not be created",
        true
      );


      return null;

    }

  }


  /* =========================================================
     ALERT ACTIONS
     ========================================================= */

  async function alertAction(
    id,
    action
  ) {

    if (
      action === "voice"
    ) {

      const alert =
        (state.alerts || [])
          .find(
            a =>
              String(a.id) ===
              String(id)
          );


      if (alert) {

        /*
           Use corrected alert voice
        */

        speakAlert(alert);

      }


      return;

    }


    try {

      const updated =
        await api(
          "/api/alerts/" +
          encodeURIComponent(id),
          {

            method: "PATCH",

            body:
              JSON.stringify({
                action
              })

          }
        );


      activeAlert =
        updated;


      showToast(
        action === "acknowledge"

          ? "Alert acknowledged"

          : action === "resolve"

            ? "Alert resolved"

            : "Alert escalated"
      );


      await refresh();


    } catch (error) {

      showToast(
        error.message,
        true
      );

    }

  }


  /* =========================================================
     FINGER DETECTION
     ========================================================= */

  function distance(
    point1,
    point2
  ) {

    const x =
      point1.x -
      point2.x;


    const y =
      point1.y -
      point2.y;


    return Math.sqrt(
      x * x +
      y * y
    );

  }


  function countFingers(
    landmarks
  ) {

    if (
      !landmarks ||
      landmarks.length < 21
    ) {

      return 0;

    }


    let count = 0;


    /*
       INDEX
    */

    if (
      landmarks[8].y <
      landmarks[6].y
    ) {

      count++;

    }


    /*
       MIDDLE
    */

    if (
      landmarks[12].y <
      landmarks[10].y
    ) {

      count++;

    }


    /*
       RING
    */

    if (
      landmarks[16].y <
      landmarks[14].y
    ) {

      count++;

    }


    /*
       PINKY
    */

    if (
      landmarks[20].y <
      landmarks[18].y
    ) {

      count++;

    }


    /*
       THUMB
    */

    const wrist =
      landmarks[0];


    const thumbTip =
      landmarks[4];


    const thumbIP =
      landmarks[3];


    const thumbMCP =
      landmarks[2];


    const tipDistance =
      distance(
        thumbTip,
        wrist
      );


    const ipDistance =
      distance(
        thumbIP,
        wrist
      );


    const mcpDistance =
      distance(
        thumbMCP,
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


  /* =========================================================
     GESTURE STABILITY
     ========================================================= */

  function processGesture(
    fingerCount
  ) {

    const gesture =
      FINGER_GESTURES[
        fingerCount
      ];


    if (!gesture) {
      return;
    }


    if (
      candidateGesture !==
      fingerCount
    ) {

      candidateGesture =
        fingerCount;


      stableFrames = 1;

      return;

    }


    stableFrames++;


    /*
       Require stable frames
    */

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


    if (!info) {
      return;
    }


    const now =
      Date.now();


    if (

      lastAlertGesture ===
      fingerCount

      &&

      now -
      lastAlertTime <

      3500

    ) {

      return;

    }


    lastAlertGesture =
      fingerCount;


    lastAlertTime =
      now;


    console.log(
      "GESTURE DETECTED:",
      fingerCount,
      info.key
    );


    const L =
      currentLanguage();


    if ($("cameraStatus")) {

      $("cameraStatus").textContent =
        `${L.handDetected}: ${info.gesture} → ${L[info.key]}`;

    }


    /*
       Save alert and play voice
    */

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


  /* =========================================================
     DRAW HAND LANDMARKS
     ========================================================= */

  const HAND_CONNECTIONS = [

    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],

    [0, 5],
    [5, 6],
    [6, 7],
    [7, 8],

    [0, 9],
    [9, 10],
    [10, 11],
    [11, 12],

    [0, 13],
    [13, 14],
    [14, 15],
    [15, 16],

    [0, 17],
    [17, 18],
    [18, 19],
    [19, 20],

    [5, 9],
    [9, 13],
    [13, 17]

  ];


  function drawHand(
    landmarks
  ) {

    const video =
      $("inputVideo");


    const canvas =
      $("outputCanvas");


    if (
      !video ||
      !canvas
    ) {

      return;

    }


    const width =
      video.videoWidth ||
      640;


    const height =
      video.videoHeight ||
      480;


    if (
      canvas.width !== width ||
      canvas.height !== height
    ) {

      canvas.width =
        width;


      canvas.height =
        height;

    }


    const context =
      canvas.getContext("2d");


    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    if (!landmarks) {
      return;
    }


    context.strokeStyle =
      "#22c55e";


    context.lineWidth =
      3;


    HAND_CONNECTIONS.forEach(
      ([start, end]) => {

        const point1 =
          landmarks[start];


        const point2 =
          landmarks[end];


        context.beginPath();


        context.moveTo(
          point1.x *
          canvas.width,

          point1.y *
          canvas.height
        );


        context.lineTo(
          point2.x *
          canvas.width,

          point2.y *
          canvas.height
        );


        context.stroke();

      }
    );


    context.fillStyle =
      "#00ff88";


    landmarks.forEach(
      point => {

        context.beginPath();


        context.arc(

          point.x *
          canvas.width,

          point.y *
          canvas.height,

          5,

          0,

          Math.PI * 2

        );


        context.fill();

      }
    );

  }


  /* =========================================================
     MEDIAPIPE RESULTS
     ========================================================= */

  function onResults(
    results
  ) {

    processingFrame =
      false;


    const canvas =
      $("outputCanvas");


    const video =
      $("inputVideo");


    if (

      !results ||

      !results.multiHandLandmarks ||

      !results
        .multiHandLandmarks
        .length

    ) {

      if (
        canvas &&
        video
      ) {

        const context =
          canvas.getContext("2d");


        context.clearRect(

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


      return;

    }


    const landmarks =
      results
        .multiHandLandmarks[0];


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


  /* =========================================================
     MEDIAPIPE INITIALIZATION
     ========================================================= */

  function initializeHands() {

    if (
      hands
    ) {

      return true;

    }


    if (
      !window.Hands
    ) {

      console.error(
        "MediaPipe Hands is not loaded"
      );

      return false;

    }


    try {

      hands =
        new window.Hands(
          {

            locateFile:
              (file) =>

                "https://cdn.jsdelivr.net/npm/@mediapipe/hands/" +
                file

          }
        );


      hands.setOptions(
        {

          maxNumHands: 1,

          modelComplexity: 1,

          minDetectionConfidence:
            0.55,

          minTrackingConfidence:
            0.55

        }
      );


      hands.onResults(
        onResults
      );


      return true;


    } catch (error) {

      console.error(
        "MediaPipe initialization error:",
        error
      );


      return false;

    }

  }


  /* =========================================================
     CAMERA FRAME LOOP
     ========================================================= */

  async function processVideoFrame() {

    if (
      !cameraRunning
    ) {

      return;

    }


    const video =
      $("inputVideo");


    if (

      !processingFrame

      &&

      hands

      &&

      video

      &&

      video.readyState >= 2

    ) {

      processingFrame =
        true;


      try {

        await hands.send(
          {
            image: video
          }
        );


      } catch (error) {

        console.error(
          "Hand detection frame error:",
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


  /* =========================================================
     START CAMERA
     ========================================================= */

  async function startCamera() {

    if (
      cameraRunning
    ) {

      showToast(
        "Camera AI is already running"
      );

      return;

    }


    const video =
      $("inputVideo");


    if (!video) {

      showToast(
        "Camera video element not found",
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


    const L =
      currentLanguage();


    try {

      if ($("cameraStatus")) {

        $("cameraStatus").textContent =
          L.cameraStarting;

      }


      /*
         Load voices after user click.
      */

      await waitForVoices();


      /*
         Initialize MediaPipe
      */

      const aiReady =
        initializeHands();


      if (!aiReady) {

        showToast(
          "AI hand detection library could not load. Check internet connection.",
          true
        );


        if ($("cameraStatus")) {

          $("cameraStatus").textContent =
            "AI library error";

        }


        return;

      }


      try {

        stream =
          await navigator
            .mediaDevices
            .getUserMedia(
              {

                video:
                  {

                    facingMode:
                      {
                        ideal: "user"
                      },

                    width:
                      {
                        ideal: 1280
                      },

                    height:
                      {
                        ideal: 720
                      }

                  },

                audio: false

              }
            );


      } catch (firstError) {

        stream =
          await navigator
            .mediaDevices
            .getUserMedia(
              {

                video: true,

                audio: false

              }
            );

      }


      video.srcObject =
        stream;


      video.muted =
        true;


      video.playsInline =
        true;


      await new Promise(
        resolve => {

          video.onloadedmetadata =
            () => resolve();

        }
      );


      await video.play();


      cameraRunning =
        true;


      processingFrame =
        false;


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
          L.cameraRunning;

      }


      showToast(
        "Camera AI started successfully. Show your hand."
      );


      processVideoFrame();


    } catch (error) {

      console.error(
        "Camera start error:",
        error
      );


      cameraRunning =
        false;


      if ($("cameraStatus")) {

        if (
          error.name ===
          "NotAllowedError"
        ) {

          $("cameraStatus").textContent =
            "Camera permission denied";

        } else if (
          error.name ===
          "NotFoundError"
        ) {

          $("cameraStatus").textContent =
            "No camera found";

        } else {

          $("cameraStatus").textContent =
            "Camera could not start";

        }

      }


      showToast(
        "Camera error: " +
        error.message,
        true
      );

    }

  }


  /* =========================================================
     STOP CAMERA
     ========================================================= */

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


    if (
      stream
    ) {

      stream
        .getTracks()
        .forEach(
          track =>
            track.stop()
        );


      stream =
        null;

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

      const context =
        canvas.getContext("2d");


      context.clearRect(

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


    showToast(
      "Camera stopped"
    );

  }


  /* =========================================================
     REPORT UPLOAD
     ========================================================= */

  async function uploadReport(event) {

    event.preventDefault();


    try {

      const form =
        event.target;


      await api(
        "/api/reports",
        {

          method: "POST",

          body:
            new FormData(form)

        }
      );


      showToast(
        "Report uploaded successfully"
      );


      form.reset();


      await refresh();


    } catch (error) {

      showToast(
        error.message,
        true
      );

    }

  }


  /* =========================================================
     APPOINTMENT
     ========================================================= */

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
        "Appointment scheduled successfully"
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


  /* =========================================================
     EVENT LISTENERS
     ========================================================= */

  function setupEvents() {


    /*
       NAVIGATION
    */

    document
      .querySelectorAll(".nav")
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              page(
                button.dataset.page
              );

            }
          );

        }
      );


    $("openGestureBtn")
      ?.addEventListener(
        "click",
        () => page("gesture")
      );


    $("viewAlertsBtn")
      ?.addEventListener(
        "click",
        () => page("alerts")
      );


    $("openMobileBtn")
      ?.addEventListener(
        "click",
        () => page("mobile")
      );


    /*
       LANGUAGE
    */

    $("languageSelect")
      ?.addEventListener(
        "change",
        updateLanguage
      );


    /*
       NOTIFICATION
    */

    $("notifyBtn")
      ?.addEventListener(
        "click",
        enableNotifications
      );


    /*
       CAMERA
    */

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


    /*
       ALERT FILTERS
    */

    document
      .querySelectorAll(".filter")
      .forEach(
        button => {

          button.addEventListener(
            "click",
            () => {

              activeFilter =
                button.dataset.filter ||
                "all";


              document
                .querySelectorAll(
                  ".filter"
                )
                .forEach(
                  item =>
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


    /*
       ALERT ACTION BUTTONS
    */

    document.addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            ".act"
          );


        if (!button) {
          return;
        }


        alertAction(

          button.dataset.id,

          button.dataset.action

        );

      }
    );


    /*
       REPORT FORM
    */

    $("reportForm")
      ?.addEventListener(
        "submit",
        uploadReport
      );


    /*
       APPOINTMENT FORM
    */

    $("appointmentForm")
      ?.addEventListener(
        "submit",
        createAppointment
      );


    /*
       CLOSE OVERLAY
    */

    $("closeAlertOverlay")
      ?.addEventListener(
        "click",
        closeOverlay
      );


    /*
       PLAY OVERLAY VOICE

       Uses corrected multilingual
       alert voice.
    */

    $("overlayVoiceBtn")
      ?.addEventListener(
        "click",
        () => {

          if (!activeAlert) {
            return;
          }


          speakAlert(
            activeAlert
          );

        }
      );


    /*
       ACKNOWLEDGE
    */

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


    /*
       RESOLVE
    */

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


    /*
       CLICK OUTSIDE OVERLAY
    */

    $("alertOverlay")
      ?.addEventListener(
        "click",
        event => {

          if (
            event.target ===
            $("alertOverlay")
          ) {

            closeOverlay();

          }

        }
      );


    /*
       STOP CAMERA
    */

    window.addEventListener(
      "beforeunload",
      () => {

        stopCamera();

      }
    );

  }


  /* =========================================================
     INITIALIZATION
     ========================================================= */

  async function initialize() {

    console.log(
      "CareGesture AI starting..."
    );


    setupVoices();


    setupEvents();


    const L =
      currentLanguage();


    if ($("patientLang")) {

      $("patientLang").textContent =
        L.name;

    }


    /*
       Check MediaPipe
    */

    if (!window.Hands) {

      console.warn(
        "MediaPipe Hands has not loaded yet."
      );

    } else {

      console.log(
        "MediaPipe Hands loaded."
      );

    }


    /*
       Check server
    */

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
        "Server connection failed:",
        error
      );

    }


    await refresh();


    /*
       Refresh alerts every 5 seconds.
    */

    setInterval(
      refresh,
      5000
    );


    console.log(
      "CareGesture AI ready."
    );

  }


  /* =========================================================
     START
     ========================================================= */

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
