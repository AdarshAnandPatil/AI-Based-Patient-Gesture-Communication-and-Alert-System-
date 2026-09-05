(() => {
  "use strict";

  /* =========================================================
     CAREGESTURE AI
     Matched exactly to the supplied index.html
     ========================================================= */

  const API_BASE = "";
  const PATIENT_NAME = "Demo Patient";

  const LANGS = {
    en: {
      code: "en-IN",
      name: "English",
      food: "Food",
      water: "Water",
      toilet: "Toilet",
      emergency: "Doctor / Nurse Needed",
      ok: "All OK",
      foodSub: "Patient needs food",
      waterSub: "Patient needs water",
      toiletSub: "Patient needs toilet",
      emergencySub: "Emergency assistance",
      okSub: "Everything is okay",
      waiting: "Show your hand to communicate",
      waitingSub: "The detected patient need will appear here automatically.",
      voiceReady: "🔊 Automatic voice is ready",
      voiceSpeaking: "🔊 Speaking...",
      voiceUnavailable: "🔇 Voice unavailable on this device",
      cameraStarting: "Starting camera...",
      cameraRunning: "Camera AI is running",
      cameraStopped: "Camera is off",
      noCamera: "Camera could not be started",
      alertSaved: "Alert saved successfully",
      alertFailed: "Alert could not be saved",
      emergency: "PATIENT EMERGENCY",
      connectionError: "Server connection problem"
    },

    kn: {
      code: "kn-IN",
      name: "ಕನ್ನಡ",
      food: "ಆಹಾರ",
      water: "ನೀರು",
      toilet: "ಶೌಚಾಲಯ",
      emergency: "ವೈದ್ಯರು / ನರ್ಸ್ ಅಗತ್ಯ",
      ok: "ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ",
      foodSub: "ರೋಗಿಗೆ ಆಹಾರ ಬೇಕಾಗಿದೆ",
      waterSub: "ರೋಗಿಗೆ ನೀರು ಬೇಕಾಗಿದೆ",
      toiletSub: "ರೋಗಿಗೆ ಶೌಚಾಲಯ ಬೇಕಾಗಿದೆ",
      emergencySub: "ತುರ್ತು ಸಹಾಯ ಅಗತ್ಯ",
      okSub: "ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ",
      waiting: "ಸಂವಹನಕ್ಕಾಗಿ ಕೈ ತೋರಿಸಿ",
      waitingSub: "ರೋಗಿಯ ಅಗತ್ಯ ಇಲ್ಲಿ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಕಾಣಿಸುತ್ತದೆ.",
      voiceReady: "🔊 ಸ್ವಯಂಚಾಲಿತ ಧ್ವನಿ ಸಿದ್ಧವಾಗಿದೆ",
      voiceSpeaking: "🔊 ಮಾತನಾಡುತ್ತಿದೆ...",
      voiceUnavailable: "🔇 ಈ ಸಾಧನದಲ್ಲಿ ಧ್ವನಿ ಲಭ್ಯವಿಲ್ಲ",
      cameraStarting: "ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭವಾಗುತ್ತಿದೆ...",
      cameraRunning: "ಕ್ಯಾಮೆರಾ AI ಚಾಲನೆಯಲ್ಲಿದೆ",
      cameraStopped: "ಕ್ಯಾಮೆರಾ ಆಫ್ ಆಗಿದೆ",
      noCamera: "ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ",
      alertSaved: "ಅಲರ್ಟ್ ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ",
      alertFailed: "ಅಲರ್ಟ್ ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ",
      emergency: "ರೋಗಿಗೆ ತುರ್ತು ಪರಿಸ್ಥಿತಿ",
      connectionError: "ಸರ್ವರ್ ಸಂಪರ್ಕ ಸಮಸ್ಯೆ"
    },

    hi: {
      code: "hi-IN",
      name: "हिन्दी",
      food: "खाना",
      water: "पानी",
      toilet: "शौचालय",
      emergency: "डॉक्टर / नर्स की आवश्यकता",
      ok: "सब ठीक है",
      foodSub: "मरीज को खाना चाहिए",
      waterSub: "मरीज को पानी चाहिए",
      toiletSub: "मरीज को शौचालय चाहिए",
      emergencySub: "आपातकालीन सहायता आवश्यक",
      okSub: "सब कुछ ठीक है",
      waiting: "बात करने के लिए हाथ दिखाएं",
      waitingSub: "मरीज की आवश्यकता यहां अपने आप दिखाई देगी।",
      voiceReady: "🔊 स्वचालित आवाज तैयार है",
      voiceSpeaking: "🔊 बोल रहा है...",
      voiceUnavailable: "🔇 इस डिवाइस पर आवाज उपलब्ध नहीं है",
      cameraStarting: "कैमरा शुरू हो रहा है...",
      cameraRunning: "कैमरा AI चल रहा है",
      cameraStopped: "कैमरा बंद है",
      noCamera: "कैमरा शुरू नहीं हो सका",
      alertSaved: "अलर्ट सफलतापूर्वक सेव हुआ",
      alertFailed: "अलर्ट सेव नहीं हो सका",
      emergency: "मरीज की आपात स्थिति",
      connectionError: "सर्वर कनेक्शन समस्या"
    }
  };

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

  /* =========================================================
     DOM HELPERS
     ========================================================= */

  const $ = (id) => document.getElementById(id);

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

    alertOverlay: $("alertOverlay"),
    closeAlertOverlay: $("closeAlertOverlay"),
    overlayPriority: $("overlayPriority"),
    overlayMessage: $("overlayMessage"),
    overlayMeta: $("overlayMeta"),
    overlayPatient: $("overlayPatient"),
    overlayVoiceBtn: $("overlayVoiceBtn"),
    overlayAckBtn: $("overlayAckBtn"),
    overlayResolveBtn: $("overlayResolveBtn"),

    activeCount: $("activeCount"),
    criticalCount: $("criticalCount"),
    todayCount: $("todayCount"),
    confidenceStat: $("confidenceStat"),
    recentAlerts: $("recentAlerts"),
    alertList: $("alertList"),

    patientLang: $("patientLang"),

    reportForm: $("reportForm"),
    reportList: $("reportList"),

    appointmentForm: $("appointmentForm"),
    appointmentList: $("appointmentList"),

    aTotal: $("aTotal"),
    aResolved: $("aResolved"),
    aEscalated: $("aEscalated"),
    aAppointments: $("aAppointments"),

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

  /* =========================================================
     STATE
     ========================================================= */

  let currentLang = localStorage.getItem("caregesture-language") || "en";

  let stream = null;
  let hands = null;
  let cameraRunning = false;
  let processingFrame = false;

  let lastGesture = null;
  let candidateGesture = null;
  let candidateSince = 0;
  let stableGesture = null;

  let lastAlertGesture = null;
  let lastAlertTime = 0;

  let activeAlert = null;

  let voices = [];
  let mediaPipeLoaded = false;

  let animationId = null;

  /* =========================================================
     BASIC UI
     ========================================================= */

  function getLang() {
    return LANGS[currentLang] || LANGS.en;
  }

  function showToast(message, type = "normal") {
    if (!els.toast) return;

    els.toast.textContent = message;
    els.toast.className = "";
    els.toast.classList.add("show");

    if (type === "error") {
      els.toast.classList.add("error");
    }

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      els.toast.classList.remove("show");
    }, 2800);
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

    const d = new Date(value);

    if (Number.isNaN(d.getTime())) {
      return String(value);
    }

    return d.toLocaleString();
  }

  /* =========================================================
     LANGUAGE
     ========================================================= */

  function updateLanguageUI() {
    const L = getLang();

    if (els.languageSelect) {
      els.languageSelect.value = currentLang;
    }

    if (els.patientLang) {
      els.patientLang.textContent = L.name;
    }

    if (els.guideFood1) els.guideFood1.textContent = L.food;
    if (els.guideFood1Sub) els.guideFood1Sub.textContent = L.foodSub;

    if (els.guideWater) els.guideWater.textContent = L.water;
    if (els.guideWaterSub) els.guideWaterSub.textContent = L.waterSub;

    if (els.guideFood3) els.guideFood3.textContent = L.food;
    if (els.guideFood3Sub) els.guideFood3Sub.textContent = L.foodSub;

    if (els.guideToilet) els.guideToilet.textContent = L.toilet;
    if (els.guideToiletSub) {
      els.guideToiletSub.textContent = L.toiletSub;
    }

    if (els.guideEmergency) {
      els.guideEmergency.textContent = L.emergency;
    }

    if (els.guideEmergencySub) {
      els.guideEmergencySub.textContent = L.emergencySub;
    }

    if (els.guideOk) els.guideOk.textContent = L.ok;
    if (els.guideOkSub) els.guideOkSub.textContent = L.okSub;

    if (!stableGesture) {
      showWaitingState();
    }
  }

  function changeLanguage(value) {
    if (!LANGS[value]) return;

    currentLang = value;
    localStorage.setItem("caregesture-language", value);

    updateLanguageUI();

    showToast(`${getLang().name} selected`);

    if (stableGesture !== null) {
      const info = GESTURES[stableGesture];

      if (info) {
        updateDetectionUI(stableGesture, info, false);
      }
    }
  }

  /* =========================================================
     SPEECH SYNTHESIS
     ========================================================= */

  function loadVoices() {
    if (!("speechSynthesis" in window)) {
      voices = [];
      return;
    }

    voices = window.speechSynthesis.getVoices() || [];
  }

  function setupVoiceLoading() {
    if (!("speechSynthesis" in window)) {
      return;
    }

    loadVoices();

    if ("onvoiceschanged" in window.speechSynthesis) {
      window.speechSynthesis.addEventListener(
        "voiceschanged",
        loadVoices
      );
    }

    // Some Android browsers need a small delay.
    setTimeout(loadVoices, 300);
    setTimeout(loadVoices, 1000);
    setTimeout(loadVoices, 2000);
  }

  function findBestVoice(languageCode) {
    if (!voices.length) {
      loadVoices();
    }

    const target = String(languageCode).toLowerCase();
    const base = target.split("-")[0];

    // Exact language first.
    let voice = voices.find(
      (v) => String(v.lang).toLowerCase() === target
    );

    if (voice) return voice;

    // Same language family.
    voice = voices.find(
      (v) => String(v.lang).toLowerCase().startsWith(base)
    );

    if (voice) return voice;

    // Some Android voices contain language names.
    const languageNames = {
      en: ["english"],
      kn: ["kannada"],
      hi: ["hindi"]
    };

    const nameList = languageNames[currentLang] || [];

    voice = voices.find((v) => {
      const name = String(v.name || "").toLowerCase();
      return nameList.some((x) => name.includes(x));
    });

    return voice || null;
  }

  function speak(text, options = {}) {
    if (!("speechSynthesis" in window)) {
      if (els.voiceStatus) {
        els.voiceStatus.textContent = getLang().voiceUnavailable;
      }
      return false;
    }

    if (!text) return false;

    try {
      const synth = window.speechSynthesis;

      synth.cancel();

      const utterance = new SpeechSynthesisUtterance(String(text));

      const L = getLang();

      utterance.lang = L.code;
      utterance.rate = options.rate || 0.92;
      utterance.pitch = options.pitch || 1;
      utterance.volume = 1;

      const voice = findBestVoice(L.code);

      if (voice) {
        utterance.voice = voice;
      }

      if (els.voiceStatus) {
        els.voiceStatus.textContent = L.voiceSpeaking;
      }

      utterance.onstart = () => {
        if (els.voiceStatus) {
          els.voiceStatus.textContent = L.voiceSpeaking;
        }
      };

      utterance.onend = () => {
        if (els.voiceStatus) {
          els.voiceStatus.textContent = L.voiceReady;
        }
      };

      utterance.onerror = (event) => {
        console.warn("Speech error:", event);

        if (els.voiceStatus) {
          els.voiceStatus.textContent = L.voiceUnavailable;
        }
      };

      // Calling speak from a short timeout improves reliability
      // on several mobile browsers.
      setTimeout(() => {
        try {
          synth.speak(utterance);
        } catch (error) {
          console.error("Speech start error:", error);

          if (els.voiceStatus) {
            els.voiceStatus.textContent = L.voiceUnavailable;
          }
        }
      }, 50);

      return true;
    } catch (error) {
      console.error("Speech error:", error);

      if (els.voiceStatus) {
        els.voiceStatus.textContent = getLang().voiceUnavailable;
      }

      return false;
    }
  }

  /* =========================================================
     DETECTION UI
     ========================================================= */

  function showWaitingState() {
    const L = getLang();

    if (els.detectedGesture) {
      els.detectedGesture.textContent = "Waiting for hand gesture…";
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

  function updateDetectionUI(count, info, speakNow = true) {
    const L = getLang();

    const text = L[info.key];
    const sub = L[`${info.key}Sub`];

    if (els.detectedGesture) {
      els.detectedGesture.textContent = info.gesture;
    }

    if (els.detectedEmoji) {
      els.detectedEmoji.textContent = info.emoji;
    }

    if (els.detectedNeed) {
      els.detectedNeed.textContent = text;
    }

    if (els.detectedDetail) {
      els.detectedDetail.textContent = sub;
    }

    if (speakNow) {
      speak(text);
    }
  }

  /* =========================================================
     API
     ========================================================= */

  async function apiFetch(path, options = {}, timeout = 8000) {
    const controller = new AbortController();

    const timer = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(API_BASE + path, {
        ...options,
        signal: controller.signal,
        headers: {
          ...(options.body instanceof FormData
            ? {}
            : { "Content-Type": "application/json" }),
          ...(options.headers || {})
        }
      });

      clearTimeout(timer);

      let data = null;

      try {
        data = await response.json();
      } catch (_) {
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
      clearTimeout(timer);
      throw error;
    }
  }

  /* =========================================================
     SAVE ALERT
     ========================================================= */

  async function saveGestureAlert(count, info) {
    const L = getLang();

    const patientId =
      els.patientId?.value.trim() || "P1001";

    const room =
      els.room?.value.trim() || "204";

    const bed =
      els.bed?.value.trim() || "3";

    const message = L[info.key];

    const payload = {
      patientId,
      patientName: PATIENT_NAME,
      room,
      bed,
      gesture: info.gesture,
      message,
      language: currentLang,
      priority: info.priority,
      confidence: info.confidence
    };

    try {
      const alert = await apiFetch(
        "/api/alerts",
        {
          method: "POST",
          body: JSON.stringify(payload)
        },
        10000
      );

      activeAlert = alert;

      showToast(L.alertSaved);

      // Refresh alert center immediately.
      await refreshAlerts();

      return alert;
    } catch (error) {
      console.error("SAVE ALERT ERROR:", error);

      showToast(
        `${L.alertFailed}: ${error.message}`,
        "error"
      );

      return null;
    }
  }

  /* =========================================================
     EMERGENCY OVERLAY
     ========================================================= */

  function showAlertOverlay(alert, info) {
    if (!els.alertOverlay) return;

    const L = getLang();

    const message =
      alert?.message ||
      L[info.key] ||
      L.emergency;

    const room =
      alert?.room ||
      els.room?.value ||
      "204";

    const bed =
      alert?.bed ||
      els.bed?.value ||
      "3";

    const patientId =
      alert?.patientId ||
      els.patientId?.value ||
      "P1001";

    if (els.overlayPriority) {
      els.overlayPriority.textContent =
        "🚨 " + L.emergency;
    }

    if (els.overlayMessage) {
      els.overlayMessage.textContent = message;
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

    // Speak emergency immediately.
    speak(message, {
      rate: 0.85,
      pitch: 1
    });
  }

  function closeAlertOverlay() {
    if (!els.alertOverlay) return;

    els.alertOverlay.classList.remove("show");

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    activeAlert = null;
  }

  /* =========================================================
     GESTURE EVENT
     ========================================================= */

  async function handleStableGesture(count) {
    const info = GESTURES[count];

    if (!info) return;

    stableGesture = count;

    updateDetectionUI(count, info, true);

    /*
      Prevent saving the same gesture continuously.

      Same gesture can save again after 4 seconds.
      A different gesture can save immediately.
    */
    const now = Date.now();

    const sameGesture =
      lastAlertGesture === count;

    const tooSoon =
      now - lastAlertTime < 4000;

    if (sameGesture && tooSoon) {
      return;
    }

    lastAlertGesture = count;
    lastAlertTime = now;

    // Save in background so camera does NOT freeze.
    const alert = await saveGestureAlert(count, info);

    if (count === 5) {
      if (alert) {
        showAlertOverlay(alert, info);
      } else {
        // Still show emergency UI even if network save failed.
        showAlertOverlay(
          {
            message: getLang().emergency,
            room: els.room?.value || "204",
            bed: els.bed?.value || "3",
            patientId: els.patientId?.value || "P1001"
          },
          info
        );
      }
    }
  }

  /* =========================================================
     FINGER COUNTING
     ========================================================= */

  function distance(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;

    return Math.sqrt(
      dx * dx +
      dy * dy
    );
  }

  function countFingers(landmarks) {
    if (!landmarks || landmarks.length < 21) {
      return 0;
    }

    let count = 0;

    /*
      MediaPipe landmark indexes:

      Thumb:
      1 = CMC
      2 = MCP
      3 = IP
      4 = TIP

      Index:
      5 = MCP
      6 = PIP
      7 = DIP
      8 = TIP

      Middle:
      9 = MCP
      10 = PIP
      11 = DIP
      12 = TIP

      Ring:
      13 = MCP
      14 = PIP
      15 = DIP
      16 = TIP

      Pinky:
      17 = MCP
      18 = PIP
      19 = DIP
      20 = TIP
    */

    // Index finger.
    if (
      landmarks[8].y <
      landmarks[6].y
    ) {
      count++;
    }

    // Middle finger.
    if (
      landmarks[12].y <
      landmarks[10].y
    ) {
      count++;
    }

    // Ring finger.
    if (
      landmarks[16].y <
      landmarks[14].y
    ) {
      count++;
    }

    // Pinky.
    if (
      landmarks[20].y <
      landmarks[18].y
    ) {
      count++;
    }

    /*
      Thumb is handled using horizontal distance.

      This works better for both left and right hands
      than simply checking x direction.
    */

    const thumbTip = landmarks[4];
    const thumbIp = landmarks[3];
    const thumbMcp = landmarks[2];
    const wrist = landmarks[0];

    const tipDistance = distance(
      thumbTip,
      wrist
    );

    const ipDistance = distance(
      thumbIp,
      wrist
    );

    const mcpDistance = distance(
      thumbMcp,
      wrist
    );

    if (
      tipDistance >
      ipDistance * 1.12 &&
      tipDistance >
      mcpDistance * 1.35
    ) {
      count++;
    }

    return Math.max(
      0,
      Math.min(5, count)
    );
  }

  /* =========================================================
     GESTURE STABILITY
     ========================================================= */

  function processGesture(count) {
    const now = Date.now();

    if (candidateGesture !== count) {
      candidateGesture = count;
      candidateSince = now;
      return;
    }

    const stableFor =
      now - candidateSince;

    // Require the gesture to remain stable.
    if (stableFor < 450) {
      return;
    }

    if (lastGesture === count) {
      return;
    }

    lastGesture = count;

    handleStableGesture(count);
  }

  /* =========================================================
     CANVAS DRAWING
     ========================================================= */

  function drawLandmarks(results) {
    const canvas = els.outputCanvas;
    const video = els.inputVideo;

    if (!canvas || !video) return;

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

    if (
      !results ||
      !results.multiHandLandmarks
    ) {
      return;
    }

    for (
      const landmarks of
      results.multiHandLandmarks
    ) {
      drawConnections(
        ctx,
        landmarks,
        canvas.width,
        canvas.height
      );

      for (const point of landmarks) {
        ctx.beginPath();

        ctx.arc(
          point.x * canvas.width,
          point.y * canvas.height,
          4,
          0,
          Math.PI * 2
        );

        ctx.fillStyle = "#00ff99";
        ctx.fill();
      }
    }
  }

  function drawConnections(
    ctx,
    landmarks,
    width,
    height
  ) {
    const connections = [
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

    ctx.strokeStyle = "#00ff99";
    ctx.lineWidth = 3;

    for (const [a, b] of connections) {
      const p1 = landmarks[a];
      const p2 = landmarks[b];

      ctx.beginPath();

      ctx.moveTo(
        p1.x * width,
        p1.y * height
      );

      ctx.lineTo(
        p2.x * width,
        p2.y * height
      );

      ctx.stroke();
    }
  }

  /* =========================================================
     MEDIAPIPE
     ========================================================= */

  function loadScript(src) {
    return new Promise(
      (resolve, reject) => {
        const existing =
          document.querySelector(
            `script[src="${src}"]`
          );

        if (existing) {
          if (existing.dataset.loaded === "true") {
            resolve();
          } else {
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
          }

          return;
        }

        const script =
          document.createElement("script");

        script.src = src;
        script.async = true;

        script.onload = () => {
          script.dataset.loaded = "true";
          resolve();
        };

        script.onerror = () => {
          reject(
            new Error(
              `Could not load ${src}`
            )
          );
        };

        document.head.appendChild(script);
      }
    );
  }

  async function loadMediaPipe() {
    if (mediaPipeLoaded && window.Hands) {
      return true;
    }

    if (els.cameraDiagnostic) {
      els.cameraDiagnostic.textContent =
        "Loading AI hand detection...";
    }

    try {
      await loadScript(
        "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
      );

      await loadScript(
        "https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js"
      );

      await loadScript(
        "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"
      );

      await loadScript(
        "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
      );

      if (!window.Hands) {
        throw new Error(
          "MediaPipe Hands did not load."
        );
      }

      mediaPipeLoaded = true;

      return true;
    } catch (error) {
      console.error(
        "MediaPipe loading error:",
        error
      );

      if (els.cameraDiagnostic) {
        els.cameraDiagnostic.textContent =
          "AI library could not load. Check internet connection.";
      }

      return false;
    }
  }

  function createHands() {
    if (!window.Hands) {
      throw new Error(
        "MediaPipe Hands is unavailable."
      );
    }

    hands = new window.Hands({
      locateFile: (file) => {
        return (
          "https://cdn.jsdelivr.net/npm/@mediapipe/hands/" +
          file
        );
      }
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.60
    });

    hands.onResults(onResults);
  }

  function onResults(results) {
    processingFrame = false;

    drawLandmarks(results);

    if (
      !results ||
      !results.multiHandLandmarks ||
      !results.multiHandLandmarks.length
    ) {
      candidateGesture = null;
      candidateSince = 0;

      if (els.cameraHint) {
        els.cameraHint.style.display = "";
      }

      return;
    }

    if (els.cameraHint) {
      els.cameraHint.style.display = "none";
    }

    const landmarks =
      results.multiHandLandmarks[0];

    const fingers =
      countFingers(landmarks);

    processGesture(fingers);
  }

  /* =========================================================
     CAMERA
     ========================================================= */

  async function startCamera() {
    if (cameraRunning) {
      showToast("Camera is already running.");
      return;
    }

    const L = getLang();

    if (
      !els.inputVideo ||
      !els.outputCanvas
    ) {
      showToast(
        "Camera elements are missing.",
        "error"
      );
      return;
    }

    try {
      if (els.cameraStatus) {
        els.cameraStatus.textContent =
          L.cameraStarting;
      }

      if (els.aiBadge) {
        els.aiBadge.textContent =
          "LOADING AI...";
      }

      if (els.cameraDiagnostic) {
        els.cameraDiagnostic.textContent =
          "Requesting camera permission...";
      }

      /*
        getUserMedia must run from a secure context.
        Render HTTPS satisfies this requirement.
      */
      stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: {
              ideal: 1280
            },
            height: {
              ideal: 720
            }
          },
          audio: false
        });

      els.inputVideo.srcObject = stream;

      await els.inputVideo.play();

      const loaded =
        await loadMediaPipe();

      if (!loaded) {
        stopCamera(false);

        if (els.cameraStatus) {
          els.cameraStatus.textContent =
            L.noCamera;
        }

        return;
      }

      if (!hands) {
        createHands();
      }

      cameraRunning = true;
      processingFrame = false;

      lastGesture = null;
      candidateGesture = null;
      candidateSince = 0;
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

      if (els.cameraHint) {
        els.cameraHint.style.display = "";
      }

      showWaitingState();

      showToast(
        "Camera AI started successfully."
      );

      processVideoFrame();
    } catch (error) {
      console.error(
        "Camera start error:",
        error
      );

      cameraRunning = false;

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
            "Camera permission was denied. Allow camera access in browser settings.";
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
        "error"
      );
    }
  }

  async function processVideoFrame() {
    if (!cameraRunning) {
      return;
    }

    if (
      !processingFrame &&
      hands &&
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
          "MediaPipe frame error:",
          error
        );

        processingFrame = false;
      }
    }

    animationId =
      requestAnimationFrame(
        processVideoFrame
      );
  }

  function stopCamera(showMessage = true) {
    cameraRunning = false;
    processingFrame = false;

    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }

    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop();
      }

      stream = null;
    }

    if (els.inputVideo) {
      els.inputVideo.srcObject = null;
    }

    if (els.outputCanvas) {
      const ctx =
        els.outputCanvas.getContext("2d");

      ctx.clearRect(
        0,
        0,
        els.outputCanvas.width,
        els.outputCanvas.height
      );
    }

    candidateGesture = null;
    candidateSince = 0;
    lastGesture = null;
    stableGesture = null;

    if (els.cameraStatus) {
      els.cameraStatus.textContent =
        getLang().cameraStopped;
    }

    if (els.aiBadge) {
      els.aiBadge.textContent =
        "AI READY";
    }

    if (els.cameraDiagnostic) {
      els.cameraDiagnostic.textContent =
        "Camera stopped.";
    }

    if (els.cameraHint) {
      els.cameraHint.style.display = "";
    }

    showWaitingState();

    if (showMessage) {
      showToast("Camera stopped.");
    }
  }

  /* =========================================================
     NAVIGATION
     ========================================================= */

  function navigate(page) {
    const pages =
      document.querySelectorAll(
        ".page"
      );

    pages.forEach((section) => {
      section.classList.toggle(
        "active",
        section.id === page
      );
    });

    document
      .querySelectorAll(".nav")
      .forEach((button) => {
        button.classList.toggle(
          "active",
          button.dataset.page === page
        );
      });

    const titles = {
      dashboard: "Nurse Dashboard",
      gesture: "Gesture Communication",
      alerts: "Alert Center",
      patient: "Patient Care",
      reports: "Medical Reports",
      appointments: "Appointments",
      analytics: "Analytics",
      mobile: "Mobile App"
    };

    if (els.pageTitle) {
      els.pageTitle.textContent =
        titles[page] || "CareGesture AI";
    }

    if (page === "alerts") {
      refreshAlerts();
    }

    if (page === "dashboard") {
      refreshAlerts();
    }

    if (page === "reports") {
      refreshReports();
    }

    if (page === "appointments") {
      refreshAppointments();
    }

    if (page === "analytics") {
      refreshAnalytics();
    }

    if (page === "mobile") {
      updateMobileUrl();
    }

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  /* =========================================================
     ALERT RENDERING
     ========================================================= */

  function priorityIcon(priority) {
    if (priority === "Critical") return "🚨";
    if (priority === "High") return "⚠️";
    return "🔔";
  }

  function renderAlertHTML(alert) {
    return `
      <div class="panel alert-card"
           data-alert-id="${escapeHTML(alert.id)}">

        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">

          <div>
            <h3>
              ${priorityIcon(alert.priority)}
              ${escapeHTML(alert.message)}
            </h3>

            <p>
              <b>${escapeHTML(alert.gesture)}</b>
              · ${escapeHTML(alert.priority)}
            </p>

            <p>
              Patient:
              ${escapeHTML(alert.patientName || "Demo Patient")}
              · ${escapeHTML(alert.patientId)}
            </p>

            <p>
              Room ${escapeHTML(alert.room)}
              · Bed ${escapeHTML(alert.bed)}
            </p>

            <p>
              Confidence:
              ${escapeHTML(alert.confidence)}%
              · ${formatDate(alert.createdAt)}
            </p>

            <p>
              Status:
              <b>${escapeHTML(alert.status)}</b>
            </p>
          </div>

        </div>

        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;">

          <button
            class="outline alert-action"
            data-action="acknowledge"
            data-id="${escapeHTML(alert.id)}"
            type="button">
            ✓ Acknowledge
          </button>

          <button
            class="outline alert-action"
            data-action="resolve"
            data-id="${escapeHTML(alert.id)}"
            type="button">
            ✓ Resolve
          </button>

          <button
            class="outline alert-action"
            data-action="escalate"
            data-id="${escapeHTML(alert.id)}"
            type="button">
            🚨 Escalate
          </button>

        </div>
      </div>
    `;
  }

  function renderRecentAlerts(alerts) {
    if (!els.recentAlerts) return;

    const recent =
      alerts.slice(0, 5);

    if (!recent.length) {
      els.recentAlerts.innerHTML =
        "<p>No alerts yet.</p>";

      return;
    }

    els.recentAlerts.innerHTML =
      recent
        .map(renderAlertHTML)
        .join("");
  }

  let activeFilter = "all";

  function renderAlertList(alerts) {
    if (!els.alertList) return;

    let filtered = alerts;

    if (activeFilter !== "all") {
      if (activeFilter === "Critical") {
        filtered =
          alerts.filter(
            (a) =>
              a.priority === "Critical"
          );
      } else {
        filtered =
          alerts.filter(
            (a) =>
              a.status === activeFilter
          );
      }
    }

    if (!filtered.length) {
      els.alertList.innerHTML =
        '<div class="panel"><p>No alerts found.</p></div>';

      return;
    }

    els.alertList.innerHTML =
      filtered
        .map(renderAlertHTML)
        .join("");
  }

  /* =========================================================
     ALERT REFRESH
     ========================================================= */

  async function refreshAlerts() {
    try {
      const alerts =
        await apiFetch(
          "/api/alerts",
          {
            method: "GET"
          },
          8000
        );

      if (!Array.isArray(alerts)) {
        return;
      }

      renderRecentAlerts(alerts);
      renderAlertList(alerts);

      updateDashboardStats(alerts);
      updateAnalyticsStats(alerts);

      return alerts;
    } catch (error) {
      console.error(
        "Refresh alerts error:",
        error
      );

      return [];
    }
  }

  function updateDashboardStats(alerts) {
    const active =
      alerts.filter(
        (a) =>
          a.status !== "Resolved"
      );

    const critical =
      alerts.filter(
        (a) =>
          a.priority === "Critical" &&
          a.status !== "Resolved"
      );

    const todayString =
      new Date()
        .toISOString()
        .slice(0, 10);

    const today =
      alerts.filter(
        (a) =>
          String(a.createdAt || "")
            .slice(0, 10) ===
          todayString
      );

    const confidenceValues =
      alerts
        .map((a) =>
          Number(a.confidence)
        )
        .filter(Number.isFinite);

    const average =
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
        today.length;
    }

    if (els.confidenceStat) {
      els.confidenceStat.textContent =
        average === null
          ? "—"
          : `${average}%`;
    }
  }

  function updateAnalyticsStats(alerts) {
    if (els.aTotal) {
      els.aTotal.textContent =
        alerts.length;
    }

    if (els.aResolved) {
      els.aResolved.textContent =
        alerts.filter(
          (a) =>
            a.status === "Resolved"
        ).length;
    }

    if (els.aEscalated) {
      els.aEscalated.textContent =
        alerts.filter(
          (a) =>
            a.status === "Escalated"
        ).length;
    }
  }

  /* =========================================================
     ALERT ACTIONS
     ========================================================= */

  async function alertAction(id, action) {
    try {
      const updated =
        await apiFetch(
          `/api/alerts/${encodeURIComponent(id)}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              action
            })
          },
          8000
        );

      activeAlert = updated;

      showToast(
        `Alert ${action}d successfully.`
      );

      closeAlertOverlay();

      await refreshAlerts();
    } catch (error) {
      console.error(
        "Alert action error:",
        error
      );

      showToast(
        error.message ||
        "Alert action failed.",
        "error"
      );
    }
  }

  /* =========================================================
     REPORTS
     ========================================================= */

  async function refreshReports() {
    if (!els.reportList) return;

    try {
      const reports =
        await apiFetch(
          "/api/reports",
          {
            method: "GET"
          },
          8000
        );

      if (!Array.isArray(reports)) {
        return;
      }

      if (!reports.length) {
        els.reportList.innerHTML =
          "<p>No reports uploaded yet.</p>";

        return;
      }

      els.reportList.innerHTML =
        reports
          .map(
            (report) => `
              <div class="panel">
                <h3>📄 ${escapeHTML(report.originalName)}</h3>
                <p>
                  Patient:
                  ${escapeHTML(report.patientId)}
                </p>
                <p>
                  Uploaded:
                  ${formatDate(report.uploadedAt)}
                </p>
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
            `
          )
          .join("");
    } catch (error) {
      console.error(
        "Reports error:",
        error
      );
    }
  }

  async function uploadReport(event) {
    event.preventDefault();

    if (!els.reportForm) return;

    const formData =
      new FormData(
        els.reportForm
      );

    try {
      showToast(
        "Uploading report..."
      );

      await apiFetch(
        "/api/reports",
        {
          method: "POST",
          body: formData
        },
        30000
      );

      showToast(
        "Report uploaded successfully."
      );

      els.reportForm.reset();

      await refreshReports();
    } catch (error) {
      console.error(
        "Upload report error:",
        error
      );

      showToast(
        error.message ||
        "Report upload failed.",
        "error"
      );
    }
  }

  /* =========================================================
     APPOINTMENTS
     ========================================================= */

  async function refreshAppointments() {
    if (!els.appointmentList) return;

    try {
      const appointments =
        await apiFetch(
          "/api/appointments",
          {
            method: "GET"
          },
          8000
        );

      if (!Array.isArray(appointments)) {
        return;
      }

      if (els.aAppointments) {
        els.aAppointments.textContent =
          appointments.length;
      }

      if (!appointments.length) {
        els.appointmentList.innerHTML =
          "<p>No appointments.</p>";

        return;
      }

      els.appointmentList.innerHTML =
        appointments
          .map(
            (a) => `
              <div class="panel">
                <h3>📅 ${escapeHTML(a.doctor)}</h3>
                <p>
                  ${escapeHTML(a.date)}
                  ·
                  ${escapeHTML(a.time)}
                </p>
                <p>
                  Patient:
                  ${escapeHTML(a.patientId)}
                </p>
                <p>
                  Status:
                  <b>${escapeHTML(a.status)}</b>
                </p>
              </div>
            `
          )
          .join("");
    } catch (error) {
      console.error(
        "Appointments error:",
        error
      );
    }
  }

  async function createAppointment(event) {
    event.preventDefault();

    if (!els.appointmentForm) return;

    const formData =
      new FormData(
        els.appointmentForm
      );

    const payload = {
      patientId:
        formData.get("patientId") ||
        "P1001",

      doctor:
        formData.get("doctor") ||
        "Dr. Ananya",

      date:
        formData.get("date"),

      time:
        formData.get("time")
    };

    try {
      await apiFetch(
        "/api/appointments",
        {
          method: "POST",
          body: JSON.stringify(payload)
        },
        10000
      );

      showToast(
        "Appointment scheduled successfully."
      );

      els.appointmentForm.reset();

      await refreshAppointments();
    } catch (error) {
      console.error(
        "Appointment error:",
        error
      );

      showToast(
        error.message ||
        "Appointment could not be scheduled.",
        "error"
      );
    }
  }

  /* =========================================================
     ANALYTICS
     ========================================================= */

  async function refreshAnalytics() {
    try {
      const alerts =
        await apiFetch(
          "/api/alerts",
          {
            method: "GET"
          },
          8000
        );

      if (!Array.isArray(alerts)) {
        return;
      }

      updateAnalyticsStats(
        alerts
      );

      const counts = {};

      alerts.forEach((alert) => {
        const gesture =
          alert.gesture ||
          "Unknown";

        counts[gesture] =
          (counts[gesture] || 0) +
          1;
      });

      const bars =
        document.getElementById(
          "gestureBars"
        );

      if (!bars) return;

      const max =
        Math.max(
          1,
          ...Object.values(counts)
        );

      if (!Object.keys(counts).length) {
        bars.innerHTML =
          "<p>No gesture activity yet.</p>";

        return;
      }

      bars.innerHTML =
        Object.entries(counts)
          .map(
            ([gesture, count]) => {
              const percent =
                Math.max(
                  5,
                  Math.round(
                    (count / max) *
                    100
                  )
                );

              return `
                <div style="margin:12px 0;">
                  <div style="display:flex;justify-content:space-between;">
                    <b>${escapeHTML(gesture)}</b>
                    <span>${count}</span>
                  </div>

                  <div style="
                    width:100%;
                    height:10px;
                    border-radius:10px;
                    background:#ddd;
                    overflow:hidden;
                  ">
                    <div style="
                      width:${percent}%;
                      height:100%;
                      border-radius:10px;
                      background:currentColor;
                    "></div>
                  </div>
                </div>
              `;
            }
          )
          .join("");
    } catch (error) {
      console.error(
        "Analytics error:",
        error
      );
    }
  }

  /* =========================================================
     MOBILE
     ========================================================= */

  function updateMobileUrl() {
    if (!els.mobileServerUrl) {
      return;
    }

    els.mobileServerUrl.textContent =
      window.location.origin;
  }

  async function copyMobileUrl() {
    const url =
      window.location.origin;

    try {
      await navigator.clipboard.writeText(
        url
      );

      showToast(
        "Server URL copied."
      );
    } catch (error) {
      // Fallback for older browsers.
      const input =
        document.createElement("input");

      input.value = url;

      document.body.appendChild(
        input
      );

      input.select();

      try {
        document.execCommand(
          "copy"
        );

        showToast(
          "Server URL copied."
        );
      } catch (_) {
        showToast(
          url
        );
      }

      input.remove();
    }
  }

  /* =========================================================
     NOTIFICATIONS
     ========================================================= */

  async function enableNotifications() {
    if (
      !("Notification" in window)
    ) {
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
          "Notifications enabled."
        );

        new Notification(
          "CareGesture AI",
          {
            body:
              "Patient alert notifications are enabled."
          }
        );
      } else {
        showToast(
          "Notification permission was not granted.",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Notification error:",
        error
      );
    }
  }

  /* =========================================================
     EVENT LISTENERS
     ========================================================= */

  function setupEvents() {
    // Navigation.
    document
      .querySelectorAll(".nav")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            navigate(
              button.dataset.page
            );
          }
        );
      });

    // Dashboard buttons.
    const openGestureBtn =
      $("openGestureBtn");

    if (openGestureBtn) {
      openGestureBtn.addEventListener(
        "click",
        () => navigate("gesture")
      );
    }

    const viewAlertsBtn =
      $("viewAlertsBtn");

    if (viewAlertsBtn) {
      viewAlertsBtn.addEventListener(
        "click",
        () => navigate("alerts")
      );
    }

    const openMobileBtn =
      $("openMobileBtn");

    if (openMobileBtn) {
      openMobileBtn.addEventListener(
        "click",
        () => navigate("mobile")
      );
    }

    // Language.
    if (els.languageSelect) {
      els.languageSelect.addEventListener(
        "change",
        (event) => {
          changeLanguage(
            event.target.value
          );
        }
      );
    }

    // Camera.
    if (els.cameraBtn) {
      els.cameraBtn.addEventListener(
        "click",
        startCamera
      );
    }

    if (els.stopCameraBtn) {
      els.stopCameraBtn.addEventListener(
        "click",
        () => stopCamera(true)
      );
    }

    // Notification.
    const notifyBtn =
      $("notifyBtn");

    if (notifyBtn) {
      notifyBtn.addEventListener(
        "click",
        enableNotifications
      );
    }

    // Close emergency overlay.
    if (els.closeAlertOverlay) {
      els.closeAlertOverlay.addEventListener(
        "click",
        closeAlertOverlay
      );
    }

    // Overlay voice.
    if (els.overlayVoiceBtn) {
      els.overlayVoiceBtn.addEventListener(
        "click",
        () => {
          const text =
            els.overlayMessage?.textContent ||
            getLang().emergency;

          speak(text, {
            rate: 0.85
          });
        }
      );
    }

    // Overlay acknowledge.
    if (els.overlayAckBtn) {
      els.overlayAckBtn.addEventListener(
        "click",
        () => {
          if (
            activeAlert &&
            activeAlert.id
          ) {
            alertAction(
              activeAlert.id,
              "acknowledge"
            );
          }
        }
      );
    }

    // Overlay resolve.
    if (els.overlayResolveBtn) {
      els.overlayResolveBtn.addEventListener(
        "click",
        () => {
          if (
            activeAlert &&
            activeAlert.id
          ) {
            alertAction(
              activeAlert.id,
              "resolve"
            );
          }
        }
      );
    }

    // Alert filters.
    document
      .querySelectorAll(".filter")
      .forEach((button) => {
        button.addEventListener(
          "click",
          () => {
            document
              .querySelectorAll(".filter")
              .forEach((b) =>
                b.classList.remove(
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

    // Alert buttons through event delegation.
    document.addEventListener(
      "click",
      (event) => {
        const button =
          event.target.closest(
            ".alert-action"
          );

        if (!button) return;

        const id =
          button.dataset.id;

        const action =
          button.dataset.action;

        if (id && action) {
          alertAction(
            id,
            action
          );
        }
      }
    );

    // Report form.
    if (els.reportForm) {
      els.reportForm.addEventListener(
        "submit",
        uploadReport
      );
    }

    // Appointment form.
    if (els.appointmentForm) {
      els.appointmentForm.addEventListener(
        "submit",
        createAppointment
      );
    }

    // Copy mobile URL.
    if (els.copyMobileUrl) {
      els.copyMobileUrl.addEventListener(
        "click",
        copyMobileUrl
      );
    }

    // Close overlay by clicking outside.
    if (els.alertOverlay) {
      els.alertOverlay.addEventListener(
        "click",
        (event) => {
          if (
            event.target ===
            els.alertOverlay
          ) {
            closeAlertOverlay();
          }
        }
      );
    }

    // ESC closes emergency overlay.
    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Escape" &&
          els.alertOverlay?.classList.contains(
            "show"
          )
        ) {
          closeAlertOverlay();
        }
      }
    );

    // Stop camera before leaving page.
    window.addEventListener(
      "beforeunload",
      () => {
        stopCamera(false);
      }
    );
  }

  /* =========================================================
     INITIALIZATION
     ========================================================= */

  async function initialize() {
    console.log(
      "CareGesture AI app.js loaded."
    );

    setupVoiceLoading();

    setupEvents();

    updateLanguageUI();

    updateMobileUrl();

    showWaitingState();

    // Check server.
    try {
      await apiFetch(
        "/api/health",
        {
          method: "GET"
        },
        5000
      );

      console.log(
        "CareGesture server connected."
      );
    } catch (error) {
      console.warn(
        "Server health check failed:",
        error
      );
    }

    // Load dashboard data.
    await refreshAlerts();
    await refreshAppointments();

    // Reports are loaded when page is opened.
    // Analytics are loaded when page is opened.

    console.log(
      "CareGesture AI initialized successfully."
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
