(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const PATIENT_NAME = "Demo Patient";

  /* =========================
     LANGUAGE DATA
  ========================== */

  const LANG = {
    en: {
      code: "en-IN",
      name: "English",

      food: "Food",
      foodSub: "Patient needs food",

      water: "Water",
      waterSub: "Patient needs water",

      toilet: "Toilet",
      toiletSub: "Patient needs toilet",

      emergency: "Doctor / Nurse Needed",
      emergencySub: "Emergency assistance",

      ok: "All OK",
      okSub: "Everything is okay",

      emergencyTitle: "PATIENT EMERGENCY",

      waiting: "Show your hand to communicate",
      waitingSub:
        "The detected patient need will appear here automatically.",

      voiceReady: "🔊 Automatic voice is ready",
      voiceSpeaking: "🔊 Speaking...",
      voiceUnavailable: "🔇 Voice unavailable on this device",

      cameraStarting: "Starting camera...",
      cameraRunning: "Camera AI is running",
      cameraStopped: "Camera is off",
      noCamera: "Camera could not be started",

      alertSaved: "Alert saved successfully",
      alertFailed: "Alert could not be saved"
    },

    kn: {
      code: "kn-IN",
      name: "ಕನ್ನಡ",

      food: "ಆಹಾರ",
      foodSub: "ರೋಗಿಗೆ ಆಹಾರ ಬೇಕಾಗಿದೆ",

      water: "ನೀರು",
      waterSub: "ರೋಗಿಗೆ ನೀರು ಬೇಕಾಗಿದೆ",

      toilet: "ಶೌಚಾಲಯ",
      toiletSub: "ರೋಗಿಗೆ ಶೌಚಾಲಯ ಬೇಕಾಗಿದೆ",

      emergency: "ವೈದ್ಯರು / ನರ್ಸ್ ಅಗತ್ಯ",
      emergencySub: "ತುರ್ತು ಸಹಾಯ ಅಗತ್ಯ",

      ok: "ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ",
      okSub: "ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ",

      emergencyTitle: "ರೋಗಿಗೆ ತುರ್ತು ಪರಿಸ್ಥಿತಿ",

      waiting: "ಸಂವಹನಕ್ಕಾಗಿ ಕೈ ತೋರಿಸಿ",
      waitingSub:
        "ರೋಗಿಯ ಅಗತ್ಯ ಇಲ್ಲಿ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಕಾಣಿಸುತ್ತದೆ.",

      voiceReady: "🔊 ಸ್ವಯಂಚಾಲಿತ ಧ್ವನಿ ಸಿದ್ಧವಾಗಿದೆ",
      voiceSpeaking: "🔊 ಮಾತನಾಡುತ್ತಿದೆ...",
      voiceUnavailable: "🔇 ಈ ಸಾಧನದಲ್ಲಿ ಧ್ವನಿ ಲಭ್ಯವಿಲ್ಲ",

      cameraStarting: "ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭವಾಗುತ್ತಿದೆ...",
      cameraRunning: "ಕ್ಯಾಮೆರಾ AI ಚಾಲನೆಯಲ್ಲಿದೆ",
      cameraStopped: "ಕ್ಯಾಮೆರಾ ಆಫ್ ಆಗಿದೆ",
      noCamera: "ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ",

      alertSaved: "ಅಲರ್ಟ್ ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ",
      alertFailed: "ಅಲರ್ಟ್ ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ"
    },

    hi: {
      code: "hi-IN",
      name: "हिन्दी",

      food: "खाना",
      foodSub: "मरीज को खाना चाहिए",

      water: "पानी",
      waterSub: "मरीज को पानी चाहिए",

      toilet: "शौचालय",
      toiletSub: "मरीज को शौचालय चाहिए",

      emergency: "डॉक्टर / नर्स की आवश्यकता",
      emergencySub: "आपातकालीन सहायता आवश्यक",

      ok: "सब ठीक है",
      okSub: "सब कुछ ठीक है",

      emergencyTitle: "मरीज की आपात स्थिति",

      waiting: "बात करने के लिए हाथ दिखाएं",
      waitingSub:
        "मरीज की आवश्यकता यहां अपने आप दिखाई देगी।",

      voiceReady: "🔊 स्वचालित आवाज तैयार है",
      voiceSpeaking: "🔊 बोल रहा है...",
      voiceUnavailable: "🔇 इस डिवाइस पर आवाज उपलब्ध नहीं है",

      cameraStarting: "कैमरा शुरू हो रहा है...",
      cameraRunning: "कैमरा AI चल रहा है",
      cameraStopped: "कैमरा बंद है",
      noCamera: "कैमरा शुरू नहीं हो सका",

      alertSaved: "अलर्ट सफलतापूर्वक सेव हुआ",
      alertFailed: "अलर्ट सेव नहीं हो सका"
    }
  };

  /* =========================
     GESTURE MAPPING
  ========================== */

  const GESTURES = {
    0: {
      key: "ok",
      gesture: "0 Fingers",
      priority: "Normal",
      confidence: 94,
      emoji: "✊"
    },

    1: {
      key: "food",
      gesture: "1 Finger",
      priority: "Normal",
      confidence: 95,
      emoji: "☝️"
    },

    2: {
      key: "water",
      gesture: "2 Fingers",
      priority: "Normal",
      confidence: 95,
      emoji: "✌️"
    },

    3: {
      key: "food",
      gesture: "3 Fingers",
      priority: "Normal",
      confidence: 94,
      emoji: "🤟"
    },

    4: {
      key: "toilet",
      gesture: "4 Fingers",
      priority: "High",
      confidence: 95,
      emoji: "🖖"
    },

    5: {
      key: "emergency",
      gesture: "5 Fingers",
      priority: "Critical",
      confidence: 97,
      emoji: "🖐️"
    }
  };

  /* =========================
     DOM
  ========================== */

  const els = {
    languageSelect: $("languageSelect"),

    cameraBtn: $("cameraBtn"),
    stopCameraBtn: $("stopCameraBtn"),

    inputVideo: $("inputVideo"),
    outputCanvas: $("outputCanvas"),

    cameraHint: $("cameraHint"),
    cameraStatus: $("cameraStatus"),
    cameraDiagnostic: $("cameraDiagnostic"),
    aiBadge: $("aiBadge"),

    detectedGesture: $("detectedGesture"),
    detectedEmoji: $("detectedEmoji"),
    detectedNeed: $("detectedNeed"),
    detectedDetail: $("detectedDetail"),
    voiceStatus: $("voiceStatus"),

    patientId: $("patientId"),
    room: $("room"),
    bed: $("bed"),

    activeCount: $("activeCount"),
    criticalCount: $("criticalCount"),
    todayCount: $("todayCount"),
    confidenceStat: $("confidenceStat"),

    recentAlerts: $("recentAlerts"),
    alertList: $("alertList"),

    patientLang: $("patientLang"),

    alertOverlay: $("alertOverlay"),
    closeAlertOverlay: $("closeAlertOverlay"),

    overlayPriority: $("overlayPriority"),
    overlayMessage: $("overlayMessage"),
    overlayMeta: $("overlayMeta"),
    overlayPatient: $("overlayPatient"),

    overlayVoiceBtn: $("overlayVoiceBtn"),
    overlayAckBtn: $("overlayAckBtn"),
    overlayResolveBtn: $("overlayResolveBtn"),

    reportForm: $("reportForm"),
    reportList: $("reportList"),

    appointmentForm: $("appointmentForm"),
    appointmentList: $("appointmentList"),

    aTotal: $("aTotal"),
    aResolved: $("aResolved"),
    aEscalated: $("aEscalated"),
    aAppointments: $("aAppointments"),

    gestureBars: $("gestureBars"),

    mobileServerUrl: $("mobileServerUrl"),
    copyMobileUrl: $("copyMobileUrl"),

    pageTitle: $("pageTitle"),
    toast: $("toast"),

    guideFood1: $("guideFood1"),
    guideFood1Sub: $("guideFood1Sub"),

    guideWater: $("guideWater"),
    guideWaterSub: $("guideWaterSub"),

    guideFood3: $("guideFood3"),
    guideFood3Sub: $("guideFood3Sub"),

    guideToilet: $("guideToilet"),
    guideToiletSub: $("guideToiletSub"),

    guideEmergency: $("guideEmergency"),
    guideEmergencySub: $("guideEmergencySub"),

    guideOk: $("guideOk"),
    guideOkSub: $("guideOkSub")
  };

  /* =========================
     STATE
  ========================== */

  let currentLang =
    localStorage.getItem("caregesture-language") || "en";

  let stream = null;
  let hands = null;

  let cameraRunning = false;
  let processingFrame = false;

  let animationId = null;

  let candidateGesture = null;
  let candidateSince = 0;

  let lastDetectedGesture = null;
  let stableGesture = null;

  let lastAlertGesture = null;
  let lastAlertTime = 0;

  let activeAlert = null;
  let activeFilter = "all";

  let voices = [];
  let mediaPipeLoaded = false;

  /* =========================
     HELPERS
  ========================== */

  function getLang() {
    return LANG[currentLang] || LANG.en;
  }

  function escapeHTML(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString();
  }

  function showToast(message, error = false) {
    if (!els.toast) return;

    els.toast.textContent = message;

    els.toast.className = "";

    if (error) {
      els.toast.classList.add("error");
    }

    els.toast.classList.add("show");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      els.toast.classList.remove("show");
    }, 3000);
  }

  /* =========================
     API
  ========================== */

  async function api(path, options = {}) {
    const response = await fetch(path, {
      cache: "no-store",
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? {}
          : options.body
            ? { "Content-Type": "application/json" }
            : {}),
        ...(options.headers || {})
      }
    });

    let data = null;

    try {
      data = await response.json();
    } catch (_) {}

    if (!response.ok) {
      throw new Error(
        data?.error ||
        `Request failed (${response.status})`
      );
    }

    return data;
  }

  /* =========================
     LANGUAGE
  ========================== */

  function showWaitingState() {
    const L = getLang();

    if (els.detectedGesture) {
      els.detectedGesture.textContent =
        "Waiting for hand gesture…";
    }

    if (els.detectedEmoji) {
      els.detectedEmoji.textContent = "✋";
    }

    if (els.detectedNeed) {
      els.detectedNeed.textContent = L.waiting;
    }

    if (els.detectedDetail) {
      els.detectedDetail.textContent = L.waitingSub;
    }

    if (els.voiceStatus) {
      els.voiceStatus.textContent = L.voiceReady;
    }
  }

  function updateLanguageUI() {
    const L = getLang();

    if (els.languageSelect) {
      els.languageSelect.value = currentLang;
    }

    if (els.patientLang) {
      els.patientLang.textContent = L.name;
    }

    if (els.guideFood1) {
      els.guideFood1.textContent = L.food;
    }

    if (els.guideFood1Sub) {
      els.guideFood1Sub.textContent = L.foodSub;
    }

    if (els.guideWater) {
      els.guideWater.textContent = L.water;
    }

    if (els.guideWaterSub) {
      els.guideWaterSub.textContent = L.waterSub;
    }

    if (els.guideFood3) {
      els.guideFood3.textContent = L.food;
    }

    if (els.guideFood3Sub) {
      els.guideFood3Sub.textContent = L.foodSub;
    }

    if (els.guideToilet) {
      els.guideToilet.textContent = L.toilet;
    }

    if (els.guideToiletSub) {
      els.guideToiletSub.textContent = L.toiletSub;
    }

    if (els.guideEmergency) {
      els.guideEmergency.textContent = L.emergency;
    }

    if (els.guideEmergencySub) {
      els.guideEmergencySub.textContent =
        L.emergencySub;
    }

    if (els.guideOk) {
      els.guideOk.textContent = L.ok;
    }

    if (els.guideOkSub) {
      els.guideOkSub.textContent = L.okSub;
    }

    if (stableGesture === null) {
      showWaitingState();
    } else {
      updateDetectionUI(
        stableGesture,
        GESTURES[stableGesture],
        false
      );
    }
  }

  function changeLanguage(language) {
    if (!LANG[language]) return;

    currentLang = language;

    localStorage.setItem(
      "caregesture-language",
      currentLang
    );

    updateLanguageUI();

    showToast(
      `${getLang().name} selected`
    );
  }

  /* =========================
     VOICE
  ========================== */

  function loadVoices() {
    if (!("speechSynthesis" in window)) {
      return;
    }

    voices =
      window.speechSynthesis.getVoices() || [];
  }

  function setupVoices() {
    if (!("speechSynthesis" in window)) {
      return;
    }

    loadVoices();

    window.speechSynthesis.addEventListener(
      "voiceschanged",
      loadVoices
    );

    setTimeout(loadVoices, 500);
    setTimeout(loadVoices, 1500);
  }

  function findVoice(languageCode) {
    loadVoices();

    const target =
      String(languageCode).toLowerCase();

    const base =
      target.split("-")[0];

    let voice = voices.find(
      v =>
        String(v.lang).toLowerCase() === target
    );

    if (voice) return voice;

    voice = voices.find(
      v =>
        String(v.lang)
          .toLowerCase()
          .startsWith(base)
    );

    return voice || null;
  }

  function speak(text) {
    if (!text) return;

    if (!("speechSynthesis" in window)) {
      if (els.voiceStatus) {
        els.voiceStatus.textContent =
          getLang().voiceUnavailable;
      }

      return;
    }

    try {
      const synth =
        window.speechSynthesis;

      synth.cancel();

      const utterance =
        new SpeechSynthesisUtterance(
          String(text)
        );

      const L = getLang();

      utterance.lang = L.code;
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      const voice =
        findVoice(L.code);

      if (voice) {
        utterance.voice = voice;
      }

      utterance.onstart = () => {
        if (els.voiceStatus) {
          els.voiceStatus.textContent =
            L.voiceSpeaking;
        }
      };

      utterance.onend = () => {
        if (els.voiceStatus) {
          els.voiceStatus.textContent =
            L.voiceReady;
        }
      };

      utterance.onerror = () => {
        if (els.voiceStatus) {
          els.voiceStatus.textContent =
            L.voiceUnavailable;
        }
      };

      synth.speak(utterance);

    } catch (error) {
      console.error("Voice error:", error);

      if (els.voiceStatus) {
        els.voiceStatus.textContent =
          getLang().voiceUnavailable;
      }
    }
  }

  /* =========================
     DETECTION UI
  ========================== */

  function updateDetectionUI(
    count,
    info,
    speakNow = false
  ) {
    if (!info) return;

    const L = getLang();

    const message = L[info.key];
    const detail =
      L[`${info.key}Sub`];

    if (els.detectedGesture) {
      els.detectedGesture.textContent =
        info.gesture;
    }

    if (els.detectedEmoji) {
      els.detectedEmoji.textContent =
        info.emoji;
    }

    if (els.detectedNeed) {
      els.detectedNeed.textContent =
        message;
    }

    if (els.detectedDetail) {
      els.detectedDetail.textContent =
        detail;
    }

    if (speakNow) {
      speak(message);
    }
  }

  /* =========================
     SAVE ALERT
  ========================== */

  async function saveAlert(count, info) {
    const L = getLang();

    const payload = {
      patientId:
        els.patientId?.value.trim() ||
        "P1001",

      patientName: PATIENT_NAME,

      room:
        els.room?.value.trim() ||
        "204",

      bed:
        els.bed?.value.trim() ||
        "3",

      gesture: info.gesture,

      message: L[info.key],

      language: currentLang,

      priority: info.priority,

      confidence: info.confidence
    };

    try {
      const alert = await api(
        "/api/alerts",
        {
          method: "POST",

          body: JSON.stringify(payload)
        }
      );

      activeAlert = alert;

      await refreshAlerts();

      return alert;

    } catch (error) {

      console.error(
        "Alert save error:",
        error
      );

      showToast(
        `${L.alertFailed}: ${error.message}`,
        true
      );

      return null;
    }
  }

  /* =========================
     EMERGENCY OVERLAY
  ========================== */

  function showEmergencyOverlay(
    alert,
    info
  ) {
    if (!els.alertOverlay) return;

    const L = getLang();

    const patientId =
      alert?.patientId ||
      els.patientId?.value ||
      "P1001";

    const room =
      alert?.room ||
      els.room?.value ||
      "204";

    const bed =
      alert?.bed ||
      els.bed?.value ||
      "3";

    const message =
      alert?.message ||
      L[info.key];

    if (els.overlayPriority) {
      els.overlayPriority.textContent =
        "🚨 " + L.emergencyTitle;
    }

    if (els.overlayMessage) {
      els.overlayMessage.textContent =
        message;
    }

    if (els.overlayMeta) {
      els.overlayMeta.textContent =
        `Room ${room} · Bed ${bed}`;
    }

    if (els.overlayPatient) {
      els.overlayPatient.textContent =
        `Patient ${patientId} · ${PATIENT_NAME}`;
    }

    els.alertOverlay.classList.add("show");

    speak(message);
  }

  function closeOverlay() {
    if (!els.alertOverlay) return;

    els.alertOverlay.classList.remove(
      "show"
    );

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }

  /* =========================
     GESTURE HANDLER
  ========================== */

  async function handleGesture(count) {

    const info = GESTURES[count];

    if (!info) return;

    stableGesture = count;

    updateDetectionUI(
      count,
      info,
      true
    );

    const now = Date.now();

    /*
       Same gesture cannot continuously
       create alerts every frame.
    */

    if (
      lastAlertGesture === count &&
      now - lastAlertTime < 5000
    ) {
      return;
    }

    lastAlertGesture = count;
    lastAlertTime = now;

    const alert =
      await saveAlert(count, info);

    if (count === 5) {

      showEmergencyOverlay(
        alert || {
          patientId:
            els.patientId?.value ||
            "P1001",

          room:
            els.room?.value ||
            "204",

          bed:
            els.bed?.value ||
            "3",

          message:
            getLang().emergency
        },
        info
      );
    }
  }

  /* =========================
     FINGER COUNTING
  ========================== */

  function countFingers(landmarks) {

    if (
      !landmarks ||
      landmarks.length < 21
    ) {
      return 0;
    }

    let count = 0;

    /*
       Index
    */

    if (
      landmarks[8].y <
      landmarks[6].y
    ) {
      count++;
    }

    /*
       Middle
    */

    if (
      landmarks[12].y <
      landmarks[10].y
    ) {
      count++;
    }

    /*
       Ring
    */

    if (
      landmarks[16].y <
      landmarks[14].y
    ) {
      count++;
    }

    /*
       Pinky
    */

    if (
      landmarks[20].y <
      landmarks[18].y
    ) {
      count++;
    }

    /*
       Thumb

       MediaPipe supplies handedness,
       but this method works reasonably
       for both hands by checking distance
       from the palm.
    */

    const wrist =
      landmarks[0];

    const thumbTip =
      landmarks[4];

    const thumbIP =
      landmarks[3];

    const thumbMCP =
      landmarks[2];

    const distance = (a, b) => {

      const dx = a.x - b.x;
      const dy = a.y - b.y;

      return Math.sqrt(
        dx * dx +
        dy * dy
      );
    };

    const tipDistance =
      distance(thumbTip, wrist);

    const ipDistance =
      distance(thumbIP, wrist);

    const mcpDistance =
      distance(thumbMCP, wrist);

    if (
      tipDistance >
        ipDistance * 1.12 &&
      tipDistance >
        mcpDistance * 1.3
    ) {
      count++;
    }

    return Math.max(
      0,
      Math.min(5, count)
    );
  }

  /* =========================
     STABILITY CHECK
  ========================== */

  function processGesture(count) {

    const now = Date.now();

    if (
      candidateGesture !== count
    ) {

      candidateGesture = count;
      candidateSince = now;

      return;
    }

    /*
       Hand must remain stable
       for 600 milliseconds.
    */

    if (
      now - candidateSince < 600
    ) {
      return;
    }

    if (
      lastDetectedGesture === count
    ) {
      return;
    }

    lastDetectedGesture = count;

    handleGesture(count);
  }

  /* =========================
     DRAW HAND
  ========================== */

  function drawResults(results) {

    const video =
      els.inputVideo;

    const canvas =
      els.outputCanvas;

    if (!video || !canvas) return;

    const width =
      video.videoWidth ||
      video.clientWidth ||
      640;

    const height =
      video.videoHeight ||
      video.clientHeight ||
      480;

    if (
      canvas.width !== width ||
      canvas.height !== height
    ) {

      canvas.width = width;
      canvas.height = height;
    }

    const ctx =
      canvas.getContext("2d");

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    const handList =
      results?.multiHandLandmarks;

    if (
      !handList ||
      !handList.length
    ) {
      return;
    }

    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17]
    ];

    handList.forEach(
      landmarks => {

        ctx.lineWidth = 3;
        ctx.strokeStyle = "#00ff99";

        connections.forEach(
          ([a, b]) => {

            const p1 =
              landmarks[a];

            const p2 =
              landmarks[b];

            ctx.beginPath();

            ctx.moveTo(
              p1.x * canvas.width,
              p1.y * canvas.height
            );

            ctx.lineTo(
              p2.x * canvas.width,
              p2.y * canvas.height
            );

            ctx.stroke();
          }
        );

        landmarks.forEach(
          point => {

            ctx.beginPath();

            ctx.arc(
              point.x * canvas.width,
              point.y * canvas.height,
              5,
              0,
              Math.PI * 2
            );

            ctx.fillStyle =
              "#00ff99";

            ctx.fill();
          }
        );
      }
    );
  }

  /* =========================
     MEDIAPIPE SCRIPT LOADER
  ========================== */

  function loadScript(src) {

    return new Promise(
      (resolve, reject) => {

        const existing =
          [...document.scripts].find(
            script => script.src === src
          );

        if (existing) {

          if (window.Hands) {
            resolve();
            return;
          }

          existing.addEventListener(
            "load",
            resolve,
            { once: true }
          );

          existing.addEventListener(
            "error",
            reject,
            { once: true }
          );

          return;
        }

        const script =
          document.createElement("script");

        script.src = src;
        script.async = true;

        script.onload = resolve;

        script.onerror = () =>
          reject(
            new Error(
              "Could not load AI library"
            )
          );

        document.head.appendChild(script);
      }
    );
  }

  async function loadMediaPipe() {

    if (
      mediaPipeLoaded &&
      window.Hands
    ) {
      return true;
    }

    if (els.cameraDiagnostic) {
      els.cameraDiagnostic.textContent =
        "Loading AI hand detection...";
    }

    try {

      /*
         Only Hands is required.
         We do not depend on MediaPipe Camera
         because getUserMedia is more reliable
         on Render/mobile browsers.
      */

      await loadScript(
        "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
      );

      if (!window.Hands) {
        throw new Error(
          "MediaPipe Hands unavailable"
        );
      }

      mediaPipeLoaded = true;

      return true;

    } catch (error) {

      console.error(
        "MediaPipe load error:",
        error
      );

      if (els.cameraDiagnostic) {

        els.cameraDiagnostic.textContent =
          "AI library could not load. Check your internet connection.";
      }

      return false;
    }
  }

  /* =========================
     CREATE AI MODEL
  ========================== */

  function createHands() {

    hands =
      new window.Hands({

        locateFile: file =>
          "https://cdn.jsdelivr.net/npm/@mediapipe/hands/" +
          file
      });

    hands.setOptions({

      maxNumHands: 1,

      modelComplexity: 1,

      minDetectionConfidence: 0.6,

      minTrackingConfidence: 0.6
    });

    hands.onResults(onResults);
  }

  /* =========================
     AI RESULTS
  ========================== */

  function onResults(results) {

    processingFrame = false;

    drawResults(results);

    const landmarks =
      results?.multiHandLandmarks?.[0];

    if (!landmarks) {

      candidateGesture = null;
      candidateSince = 0;
      lastDetectedGesture = null;

      if (els.cameraHint) {
        els.cameraHint.style.display = "";
      }

      return;
    }

    if (els.cameraHint) {
      els.cameraHint.style.display = "none";
    }

    const fingers =
      countFingers(landmarks);

    processGesture(fingers);
  }

  /* =========================
     CAMERA FRAME LOOP
  ========================== */

  async function processFrame() {

    if (!cameraRunning) {
      return;
    }

    if (
      hands &&
      !processingFrame &&
      els.inputVideo &&
      els.inputVideo.readyState >= 2
    ) {

      processingFrame = true;

      try {

        await hands.send({
          image: els.inputVideo
        });

      } catch (error) {

        console.error(
          "AI frame error:",
          error
        );

        processingFrame = false;
      }
    }

    animationId =
      requestAnimationFrame(
        processFrame
      );
  }

  /* =========================
     START CAMERA
  ========================== */

  async function startCamera() {

    if (cameraRunning) {

      showToast(
        "Camera is already running."
      );

      return;
    }

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {

      showToast(
        "Camera is not supported by this browser.",
        true
      );

      return;
    }

    const L = getLang();

    try {

      if (els.cameraStatus) {
        els.cameraStatus.textContent =
          L.cameraStarting;
      }

      if (els.cameraDiagnostic) {
        els.cameraDiagnostic.textContent =
          "Requesting camera permission...";
      }

      if (els.aiBadge) {
        els.aiBadge.textContent =
          "LOADING AI...";
      }

      /*
         Load MediaPipe first.
      */

      const loaded =
        await loadMediaPipe();

      if (!loaded) {

        if (els.aiBadge) {
          els.aiBadge.textContent =
            "AI ERROR";
        }

        return;
      }

      if (!hands) {
        createHands();
      }

      /*
         Request camera.
      */

      stream =
        await navigator.mediaDevices.getUserMedia({

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

      els.inputVideo.srcObject =
        stream;

      await els.inputVideo.play();

      cameraRunning = true;

      processingFrame = false;

      candidateGesture = null;
      candidateSince = 0;

      lastDetectedGesture = null;
      stableGesture = null;

      if (els.cameraStatus) {
        els.cameraStatus.textContent =
          L.cameraRunning;
      }

      if (els.cameraDiagnostic) {
        els.cameraDiagnostic.textContent =
          "Camera connected • AI hand detection active";
      }

      if (els.aiBadge) {
        els.aiBadge.textContent =
          "AI ACTIVE";
      }

      showWaitingState();

      processFrame();

      showToast(
        "Camera AI started successfully."
      );

    } catch (error) {

      console.error(
        "Camera error:",
        error
      );

      cameraRunning = false;

      if (stream) {

        stream
          .getTracks()
          .forEach(
            track => track.stop()
          );

        stream = null;
      }

      if (els.cameraStatus) {
        els.cameraStatus.textContent =
          L.noCamera;
      }

      if (els.aiBadge) {
        els.aiBadge.textContent =
          "AI ERROR";
      }

      if (els.cameraDiagnostic) {

        if (
          error.name ===
          "NotAllowedError"
        ) {

          els.cameraDiagnostic.textContent =
            "Camera permission denied. Please allow camera access.";

        } else if (
          error.name ===
          "NotFoundError"
        ) {

          els.cameraDiagnostic.textContent =
            "No camera was found on this device.";

        } else {

          els.cameraDiagnostic.textContent =
            "Camera error: " +
            error.message;
        }
      }

      showToast(
        "Camera could not be started.",
        true
      );
    }
  }

  /* =========================
     STOP CAMERA
  ========================== */

  function stopCamera(showMessage = true) {

    cameraRunning = false;

    processingFrame = false;

    if (animationId) {

      cancelAnimationFrame(
        animationId
      );

      animationId = null;
    }

    if (stream) {

      stream
        .getTracks()
        .forEach(
          track => track.stop()
        );

      stream = null;
    }

    if (els.inputVideo) {

      els.inputVideo.srcObject =
        null;
    }

    if (els.outputCanvas) {

      const ctx =
        els.outputCanvas.getContext(
          "2d"
        );

      ctx.clearRect(
        0,
        0,
        els.outputCanvas.width,
        els.outputCanvas.height
      );
    }

    candidateGesture = null;
    candidateSince = 0;

    lastDetectedGesture = null;
    stableGesture = null;

    if (els.cameraStatus) {

      els.cameraStatus.textContent =
        getLang().cameraStopped;
    }

    if (els.cameraDiagnostic) {

      els.cameraDiagnostic.textContent =
        "Camera stopped.";
    }

    if (els.aiBadge) {

      els.aiBadge.textContent =
        "AI READY";
    }

    if (els.cameraHint) {

      els.cameraHint.style.display =
        "";
    }

    showWaitingState();

    if (showMessage) {

      showToast(
        "Camera stopped."
      );
    }
  }

  /* =========================
     ALERT RENDERING
  ========================== */

  function priorityIcon(priority) {

    if (
      priority === "Critical"
    ) return "🚨";

    if (
      priority === "High"
    ) return "⚠️";

    return "🔔";
  }

  function alertCard(alert) {

    return `
      <div class="panel alert-card">

        <div>

          <h3>
            ${priorityIcon(alert.priority)}
            ${escapeHTML(alert.message)}
          </h3>

          <p>
            <b>
              ${escapeHTML(alert.gesture)}
            </b>
            ·
            ${escapeHTML(alert.priority)}
          </p>

          <p>
            Patient:
            ${escapeHTML(
              alert.patientName ||
              PATIENT_NAME
            )}
            ·
            ${escapeHTML(alert.patientId)}
          </p>

          <p>
            Room
            ${escapeHTML(alert.room)}
            · Bed
            ${escapeHTML(alert.bed)}
          </p>

          <p>
            Confidence:
            ${escapeHTML(alert.confidence)}%
          </p>

          <p>
            ${formatDate(alert.createdAt)}
          </p>

          <p>
            Status:
            <b>
              ${escapeHTML(alert.status)}
            </b>
          </p>

        </div>

        <div
          style="
            display:flex;
            gap:8px;
            flex-wrap:wrap;
            margin-top:12px;
          "
        >

          <button
            class="outline alert-action"
            data-id="${escapeHTML(alert.id)}"
            data-action="acknowledge"
            type="button"
          >
            ✓ Acknowledge
          </button>

          <button
            class="outline alert-action"
            data-id="${escapeHTML(alert.id)}"
            data-action="resolve"
            type="button"
          >
            ✓ Resolve
          </button>

          <button
            class="outline alert-action"
            data-id="${escapeHTML(alert.id)}"
            data-action="escalate"
            type="button"
          >
            🚨 Escalate
          </button>

        </div>

      </div>
    `;
  }

  function renderAlerts(alerts) {

    const recent =
      alerts.slice(0, 5);

    if (els.recentAlerts) {

      els.recentAlerts.innerHTML =
        recent.length
          ? recent
              .map(alertCard)
              .join("")
          : "<p>No alerts yet.</p>";
    }

    let filtered = alerts;

    if (
      activeFilter !== "all"
    ) {

      if (
        activeFilter === "Critical"
      ) {

        filtered =
          alerts.filter(
            alert =>
              alert.priority ===
              "Critical"
          );

      } else {

        filtered =
          alerts.filter(
            alert =>
              alert.status ===
              activeFilter
          );
      }
    }

    if (els.alertList) {

      els.alertList.innerHTML =
        filtered.length
          ? filtered
              .map(alertCard)
              .join("")
          : `
            <div class="panel">
              <p>No alerts found.</p>
            </div>
          `;
    }
  }

  /* =========================
     ALERT STATS
  ========================== */

  function updateStats(alerts) {

    const active =
      alerts.filter(
        alert =>
          alert.status !== "Resolved"
      );

    const critical =
      alerts.filter(
        alert =>
          alert.priority ===
            "Critical" &&
          alert.status !== "Resolved"
      );

    const today =
      new Date()
        .toISOString()
        .slice(0, 10);

    const todayAlerts =
      alerts.filter(
        alert =>
          String(
            alert.createdAt || ""
          ).slice(0, 10) === today
      );

    const values =
      alerts
        .map(
          alert =>
            Number(alert.confidence)
        )
        .filter(
          Number.isFinite
        );

    const average =
      values.length
        ? Math.round(
            values.reduce(
              (sum, value) =>
                sum + value,
              0
            ) / values.length
          )
        : null;

    if (els.activeCount) {

      els.activeCount.textContent =
        active.length;
    }

    if (els.criticalCount) {

      els.criticalCount.textContent =
        critical.length;
    }

    if (els.todayCount) {

      els.todayCount.textContent =
        todayAlerts.length;
    }

    if (els.confidenceStat) {

      els.confidenceStat.textContent =
        average === null
          ? "—"
          : average + "%";
    }

    if (els.aTotal) {

      els.aTotal.textContent =
        alerts.length;
    }

    if (els.aResolved) {

      els.aResolved.textContent =
        alerts.filter(
          alert =>
            alert.status ===
            "Resolved"
        ).length;
    }

    if (els.aEscalated) {

      els.aEscalated.textContent =
        alerts.filter(
          alert =>
            alert.status ===
            "Escalated"
        ).length;
    }
  }

  /* =========================
     REFRESH ALERTS
  ========================== */

  async function refreshAlerts() {

    try {

      const alerts =
        await api("/api/alerts");

      if (!Array.isArray(alerts)) {
        return [];
      }

      renderAlerts(alerts);

      updateStats(alerts);

      return alerts;

    } catch (error) {

      console.error(
        "Refresh alerts:",
        error
      );

      return [];
    }
  }

  /* =========================
     ALERT ACTION
  ========================== */

  async function alertAction(
    id,
    action
  ) {

    try {

      await api(
        `/api/alerts/${encodeURIComponent(id)}`,
        {
          method: "PATCH",

          body: JSON.stringify({
            action
          })
        }
      );

      showToast(
        `Alert ${action} successful.`
      );

      closeOverlay();

      activeAlert = null;

      await refreshAlerts();

    } catch (error) {

      showToast(
        error.message,
        true
      );
    }
  }

  /* =========================
     REPORTS
  ========================== */

  async function refreshReports() {

    if (!els.reportList) return;

    try {

      const reports =
        await api("/api/reports");

      if (
        !Array.isArray(reports)
      ) {
        return;
      }

      els.reportList.innerHTML =
        reports.length
          ? reports
              .map(
                report => `
                  <div class="panel">

                    <h3>
                      📄
                      ${escapeHTML(
                        report.originalName
                      )}
                    </h3>

                    <p>
                      Patient:
                      ${escapeHTML(
                        report.patientId
                      )}
                    </p>

                    <p>
                      Uploaded:
                      ${formatDate(
                        report.uploadedAt
                      )}
                    </p>

                    <a
                      class="outline"
                      href="/uploads/${encodeURIComponent(
                        report.storedName
                      )}"
                      target="_blank"
                    >
                      Open Report
                    </a>

                  </div>
                `
              )
              .join("")
          : "<p>No reports uploaded yet.</p>";

    } catch (error) {

      console.error(
        "Reports error:",
        error
      );
    }
  }

  async function uploadReport(event) {

    event.preventDefault();

    try {

      const formData =
        new FormData(
          els.reportForm
        );

      await api(
        "/api/reports",
        {
          method: "POST",
          body: formData
        }
      );

      showToast(
        "Report uploaded successfully."
      );

      els.reportForm.reset();

      await refreshReports();

    } catch (error) {

      showToast(
        error.message,
        true
      );
    }
  }

  /* =========================
     APPOINTMENTS
  ========================== */

  async function refreshAppointments() {

    try {

      const appointments =
        await api(
          "/api/appointments"
        );

      if (
        !Array.isArray(appointments)
      ) {
        return;
      }

      if (els.aAppointments) {

        els.aAppointments.textContent =
          appointments.length;
      }

      if (els.appointmentList) {

        els.appointmentList.innerHTML =
          appointments.length
            ? appointments
                .map(
                  appointment => `
                    <div class="panel">

                      <h3>
                        📅
                        ${escapeHTML(
                          appointment.doctor
                        )}
                      </h3>

                      <p>
                        ${escapeHTML(
                          appointment.date
                        )}
                        ·
                        ${escapeHTML(
                          appointment.time
                        )}
                      </p>

                      <p>
                        Patient:
                        ${escapeHTML(
                          appointment.patientId
                        )}
                      </p>

                      <p>
                        Status:
                        <b>
                          ${escapeHTML(
                            appointment.status
                          )}
                        </b>
                      </p>

                    </div>
                  `
                )
                .join("")
            : "<p>No appointments.</p>";
      }

    } catch (error) {

      console.error(
        "Appointments:",
        error
      );
    }
  }

  async function createAppointment(
    event
  ) {

    event.preventDefault();

    const form =
      new FormData(
        els.appointmentForm
      );

    const payload = {

      patientId:
        form.get("patientId") ||
        "P1001",

      doctor:
        form.get("doctor") ||
        "Dr. Ananya",

      date:
        form.get("date"),

      time:
        form.get("time")
    };

    try {

      await api(
        "/api/appointments",
        {
          method: "POST",

          body:
            JSON.stringify(payload)
        }
      );

      showToast(
        "Appointment scheduled successfully."
      );

      els.appointmentForm.reset();

      await refreshAppointments();

    } catch (error) {

      showToast(
        error.message,
        true
      );
    }
  }

  /* =========================
     ANALYTICS
  ========================== */

  async function refreshAnalytics() {

    const alerts =
      await refreshAlerts();

    if (!els.gestureBars) {
      return;
    }

    const counts = {};

    alerts.forEach(alert => {

      const gesture =
        alert.gesture || "Unknown";

      counts[gesture] =
        (counts[gesture] || 0) + 1;
    });

    const entries =
      Object.entries(counts);

    if (!entries.length) {

      els.gestureBars.innerHTML =
        "<p>No gesture activity yet.</p>";

      return;
    }

    const max =
      Math.max(
        ...Object.values(counts),
        1
      );

    els.gestureBars.innerHTML =
      entries
        .map(
          ([gesture, count]) => {

            const percentage =
              Math.round(
                count / max * 100
              );

            return `
              <div
                style="
                  margin:14px 0;
                "
              >

                <div
                  style="
                    display:flex;
                    justify-content:space-between;
                  "
                >

                  <b>
                    ${escapeHTML(
                      gesture
                    )}
                  </b>

                  <span>
                    ${count}
                  </span>

                </div>

                <div
                  style="
                    width:100%;
                    height:10px;
                    background:#ddd;
                    border-radius:10px;
                    overflow:hidden;
                    margin-top:6px;
                  "
                >

                  <div
                    style="
                      width:${percentage}%;
                      height:100%;
                      background:#22c55e;
                    "
                  ></div>

                </div>

              </div>
            `;
          }
        )
        .join("");
  }

  /* =========================
     MOBILE URL
  ========================== */

  function updateMobileURL() {

    if (
      !els.mobileServerUrl
    ) return;

    els.mobileServerUrl.textContent =
      window.location.origin;
  }

  async function copyMobileURL() {

    const url =
      window.location.origin;

    try {

      await navigator.clipboard
        .writeText(url);

      showToast(
        "Server URL copied."
      );

    } catch (_) {

      showToast(url);
    }
  }

  /* =========================
     NOTIFICATIONS
  ========================== */

  async function enableNotifications() {

    if (
      !("Notification" in window)
    ) {

      showToast(
        "Notifications are not supported."
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
          "Notifications enabled."
        );

      } else {

        showToast(
          "Notification permission was not granted."
        );
      }

    } catch (error) {

      console.error(
        "Notification error:",
        error
      );
    }
  }

  /* =========================
     NAVIGATION
  ========================== */

  function navigate(page) {

    document
      .querySelectorAll(".page")
      .forEach(section => {

        section.classList.toggle(
          "active",
          section.id === page
        );
      });

    document
      .querySelectorAll(".nav")
      .forEach(button => {

        button.classList.toggle(
          "active",
          button.dataset.page === page
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

    if (els.pageTitle) {

      els.pageTitle.textContent =
        titles[page] ||
        "CareGesture AI";
    }

    if (
      page === "dashboard" ||
      page === "alerts"
    ) {

      refreshAlerts();
    }

    if (
      page === "reports"
    ) {

      refreshReports();
    }

    if (
      page === "appointments"
    ) {

      refreshAppointments();
    }

    if (
      page === "analytics"
    ) {

      refreshAnalytics();
    }

    if (
      page === "mobile"
    ) {

      updateMobileURL();
    }
  }

  /* =========================
     EVENTS
  ========================== */

  function setupEvents() {

    document
      .querySelectorAll(".nav")
      .forEach(button => {

        button.addEventListener(
          "click",
          () =>
            navigate(
              button.dataset.page
            )
        );
      });

    $("openGestureBtn")
      ?.addEventListener(
        "click",
        () => navigate("gesture")
      );

    $("viewAlertsBtn")
      ?.addEventListener(
        "click",
        () => navigate("alerts")
      );

    $("openMobileBtn")
      ?.addEventListener(
        "click",
        () => navigate("mobile")
      );

    els.languageSelect
      ?.addEventListener(
        "change",
        event =>
          changeLanguage(
            event.target.value
          )
      );

    els.cameraBtn
      ?.addEventListener(
        "click",
        startCamera
      );

    els.stopCameraBtn
      ?.addEventListener(
        "click",
        () => stopCamera(true)
      );

    $("notifyBtn")
      ?.addEventListener(
        "click",
        enableNotifications
      );

    els.closeAlertOverlay
      ?.addEventListener(
        "click",
        closeOverlay
      );

    els.overlayVoiceBtn
      ?.addEventListener(
        "click",
        () =>
          speak(
            els.overlayMessage
              ?.textContent ||
            getLang().emergency
          )
      );

    els.overlayAckBtn
      ?.addEventListener(
        "click",
        () => {

          if (
            activeAlert?.id
          ) {

            alertAction(
              activeAlert.id,
              "acknowledge"
            );
          }
        }
      );

    els.overlayResolveBtn
      ?.addEventListener(
        "click",
        () => {

          if (
            activeAlert?.id
          ) {

            alertAction(
              activeAlert.id,
              "resolve"
            );
          }
        }
      );

    document
      .querySelectorAll(".filter")
      .forEach(button => {

        button.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(".filter")
              .forEach(
                item =>
                  item.classList.remove(
                    "active"
                  )
              );

            button.classList.add(
              "active"
            );

            activeFilter =
              button.dataset.filter ||
              "all";

            refreshAlerts();
          }
        );
      });

    document.addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            ".alert-action"
          );

        if (!button) return;

        alertAction(
          button.dataset.id,
          button.dataset.action
        );
      }
    );

    els.reportForm
      ?.addEventListener(
        "submit",
        uploadReport
      );

    els.appointmentForm
      ?.addEventListener(
        "submit",
        createAppointment
      );

    els.copyMobileUrl
      ?.addEventListener(
        "click",
        copyMobileURL
      );

    els.alertOverlay
      ?.addEventListener(
        "click",
        event => {

          if (
            event.target ===
            els.alertOverlay
          ) {

            closeOverlay();
          }
        }
      );

    document.addEventListener(
      "keydown",
      event => {

        if (
          event.key === "Escape"
        ) {

          closeOverlay();
        }
      }
    );

    window.addEventListener(
      "beforeunload",
      () => stopCamera(false)
    );
  }

  /* =========================
     INITIALIZE
  ========================== */

  async function initialize() {

    console.log(
      "CareGesture AI starting..."
    );

    setupVoices();

    setupEvents();

    updateLanguageUI();

    updateMobileURL();

    showWaitingState();

    /*
       Server health check
    */

    try {

      const health =
        await api("/api/health");

      console.log(
        "Server connected:",
        health
      );

    } catch (error) {

      console.warn(
        "Server health check failed:",
        error
      );
    }

    /*
       Load dashboard data
    */

    await refreshAlerts();

    await refreshAppointments();

    console.log(
      "CareGesture AI ready."
    );
  }

  /* =========================
     START APP
  ========================== */

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
