/* =========================================================
   CareGesture AI
   Fixed public/app.js
   ========================================================= */

(() => {
  "use strict";

  const API_BASE = "";

  /* =========================
     LANGUAGE SETTINGS
     ========================= */

  const langs = {
    en: "en-IN",
    kn: "kn-IN",
    hi: "hi-IN"
  };

  const labels = {
    en: {
      food: "Patient needs food",
      water: "Patient needs water",
      toilet: "Patient needs toilet",
      emergency: "Emergency! Doctor or nurse needed",
      ok: "Patient is okay"
    },

    kn: {
      food: "ರೋಗಿಗೆ ಆಹಾರ ಬೇಕಾಗಿದೆ",
      water: "ರೋಗಿಗೆ ನೀರು ಬೇಕಾಗಿದೆ",
      toilet: "ರೋಗಿಗೆ ಶೌಚಾಲಯಕ್ಕೆ ಹೋಗಬೇಕು",
      emergency: "ತುರ್ತು ಪರಿಸ್ಥಿತಿ! ವೈದ್ಯರು ಅಥವಾ ನರ್ಸ್ ಬೇಕಾಗಿದ್ದಾರೆ",
      ok: "ರೋಗಿ ಸುರಕ್ಷಿತವಾಗಿದ್ದಾರೆ"
    },

    hi: {
      food: "मरीज को खाना चाहिए",
      water: "मरीज को पानी चाहिए",
      toilet: "मरीज को शौचालय जाना है",
      emergency: "आपातकाल! डॉक्टर या नर्स की जरूरत है",
      ok: "मरीज ठीक है"
    }
  };


  /* =========================
     GESTURE MAP
     ========================= */

  const gestureMap = {
    0: {
      key: "ok",
      gesture: "0 Fingers",
      priority: "Normal"
    },

    1: {
      key: "food",
      gesture: "1 Finger",
      priority: "Normal"
    },

    2: {
      key: "water",
      gesture: "2 Fingers",
      priority: "Normal"
    },

    3: {
      key: "food",
      gesture: "3 Fingers",
      priority: "Normal"
    },

    4: {
      key: "toilet",
      gesture: "4 Fingers",
      priority: "High"
    },

    5: {
      key: "emergency",
      gesture: "5 Fingers",
      priority: "Critical"
    }
  };


  /* =========================
     PATIENT INFORMATION
     ========================= */

  let currentLang = "en";

  let patientId = "P1001";
  let patientName = "Demo Patient";
  let room = "204";
  let bed = "3";


  /* =========================
     CAMERA / DETECTION STATE
     ========================= */

  let camera = null;
  let stream = null;
  let detector = null;
  let cameraRunning = false;

  let lastGesture = null;

  let candidateGesture = null;
  let candidateSince = 0;
  let stableFrames = 0;

  let lastProcessedAt = 0;

  /*
    Prevent repeated alerts while the same gesture
    is continuously held.
  */
  let lastAlertAt = 0;
  let lastAlertGesture = null;

  let activeAlert = null;

  /* =========================
     SPEECH STATE
     ========================= */

  let voices = [];


  /* =========================
     CONSTANTS
     ========================= */

  const DETECT_INTERVAL = 80;

  /*
    Gesture must remain stable for this time.
  */
  const STABLE_MS = 350;

  /*
    Number of stable frames required.
  */
  const REQUIRED_STABLE_FRAMES = 4;

  /*
    Same gesture will not create another alert
    immediately.
  */
  const ALERT_COOLDOWN = 1800;


  /* =========================
     DOM HELPERS
     ========================= */

  const $ = selector => document.querySelector(selector);

  function getEl(...selectors) {
    for (const selector of selectors) {
      const element =
        typeof selector === "string"
          ? $(selector)
          : selector;

      if (element) {
        return element;
      }
    }

    return null;
  }


  function setText(selectors, value) {
    const element = getEl(...selectors);

    if (element) {
      element.textContent = value;
    }
  }


  /* =========================
     API HELPER
     ========================= */

  function api(path, options = {}) {
    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, options.timeout || 7000);

    return fetch(API_BASE + path, {
      ...options,

      signal: controller.signal,

      headers: {
        ...(options.body
          ? {
              "Content-Type": "application/json"
            }
          : {}),

        ...(options.headers || {})
      }
    }).finally(() => {
      clearTimeout(timeout);
    });
  }


  /* =========================================================
     SAVE ALERT
     ========================================================= */

  async function saveAlert(payload) {
    let lastError = null;

    /*
      Try up to 3 times.
      Importantly, this function is NOT awaited by
      the camera detection loop.
    */

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await api("/api/alerts", {
          method: "POST",

          body: JSON.stringify(payload),

          timeout: 7000
        });

        const data =
          await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data.error ||
            `Server error ${response.status}`
          );
        }

        return data;

      } catch (error) {
        lastError = error;

        /*
          Small retry delay.
        */
        await new Promise(resolve => {
          setTimeout(resolve, 250 * attempt);
        });
      }
    }

    throw (
      lastError ||
      new Error("Alert could not be saved")
    );
  }


  /* =========================================================
     SPEECH / VOICE
     ========================================================= */

  function loadVoices() {
    if (!("speechSynthesis" in window)) {
      return [];
    }

    voices =
      window.speechSynthesis.getVoices() || [];

    return voices;
  }


  function findVoice(languageCode) {
    const wanted =
      (
        langs[languageCode] ||
        langs.en
      ).toLowerCase();

    const shortLanguage =
      wanted.split("-")[0];

    const availableVoices =
      loadVoices();

    /*
      First try exact match:
      en-IN / kn-IN / hi-IN
    */

    let voice =
      availableVoices.find(
        v =>
          v.lang &&
          v.lang.toLowerCase() === wanted
      );

    if (voice) {
      return voice;
    }


    /*
      Then try same language:
      en-US, en-GB, etc.
    */

    voice =
      availableVoices.find(
        v =>
          v.lang &&
          v.lang
            .toLowerCase()
            .startsWith(shortLanguage + "-")
      );

    if (voice) {
      return voice;
    }


    /*
      Then exact short language.
    */

    voice =
      availableVoices.find(
        v =>
          v.lang &&
          v.lang.toLowerCase() === shortLanguage
      );

    if (voice) {
      return voice;
    }


    /*
      Last language fallback.
    */

    return (
      availableVoices.find(
        v =>
          v.lang &&
          v.lang
            .toLowerCase()
            .startsWith(shortLanguage)
      ) || null
    );
  }


  function speak(text, languageCode = currentLang) {
    if (!text) {
      return;
    }

    if (!("speechSynthesis" in window)) {
      console.warn(
        "Speech synthesis is not supported."
      );

      return;
    }

    const synth =
      window.speechSynthesis;

    const language =
      langs[languageCode] || langs.en;

    try {
      /*
        Stop previous speech so that
        every new gesture speaks clearly.
      */
      synth.cancel();

      loadVoices();

      const utterance =
        new SpeechSynthesisUtterance(
          String(text)
        );

      /*
        IMPORTANT:
        Set language explicitly.
      */
      utterance.lang = language;

      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      const voice =
        findVoice(languageCode);

      if (voice) {
        utterance.voice = voice;
      }

      utterance.onerror = event => {
        console.warn(
          "Speech error:",
          event.error,
          language
        );
      };


      /*
        Some Android/Chrome devices populate
        voices asynchronously.
      */
      setTimeout(() => {
        try {
          const latestVoice =
            findVoice(languageCode);

          if (latestVoice) {
            utterance.voice =
              latestVoice;
          }

          synth.speak(utterance);

        } catch (error) {
          console.warn(
            "Speech start failed:",
            error
          );
        }
      }, 100);

    } catch (error) {
      console.warn(
        "Speech synthesis failed:",
        error
      );
    }
  }


  /* =========================================================
     LANGUAGE
     ========================================================= */

  function updateLanguage(language) {
    if (!labels[language]) {
      language = "en";
    }

    currentLang = language;

    document.documentElement.lang =
      langs[language];


    const selector = getEl(
      "#languageSelect",
      "#language",
      "#langSelect",
      "select[name='language']"
    );

    if (selector) {
      selector.value = language;
    }


    /*
      If an alert is already visible,
      update its displayed text.
    */

    if (activeAlert) {
      const text =
        labels[currentLang][
          activeAlert.key
        ];

      setText(
        [
          "#detectedMessage",
          "#detectionText",
          "#gestureMessage",
          "#detectedText"
        ],
        text
      );
    }
  }


  /* =========================================================
     SHOW DETECTION
     ========================================================= */

  function showDetection(
    info,
    shouldSpeak = true
  ) {
    if (!info) {
      return;
    }

    const text =
      labels[currentLang][info.key] ||
      labels.en[info.key];


    /*
      Large detection message.
    */

    setText(
      [
        "#detectedMessage",
        "#detectionText",
        "#gestureMessage",
        "#detectedText"
      ],
      text
    );


    /*
      Gesture name.
    */

    setText(
      [
        "#gestureName",
        "#detectedGesture"
      ],
      info.gesture
    );


    /*
      Voice.
    */

    if (shouldSpeak) {
      speak(
        text,
        currentLang
      );
    }
  }


  /* =========================================================
     EMERGENCY / ALERT OVERLAY
     ========================================================= */

  function overlay(info) {
    const modal = getEl(
      "#alertOverlay",
      "#emergencyOverlay",
      ".alert-overlay",
      ".emergency-overlay"
    );

    /*
      Even if the modal does not exist,
      detection and backend saving still work.
    */

    activeAlert = info;

    const message =
      labels[currentLang][info.key] ||
      labels.en[info.key];


    setText(
      [
        "#alertMessage",
        "#overlayMessage",
        "#emergencyMessage"
      ],
      message
    );


    setText(
      [
        "#alertGesture",
        "#overlayGesture",
        "#emergencyGesture"
      ],
      info.gesture
    );


    setText(
      [
        "#alertTitle",
        "#overlayTitle",
        "#emergencyTitle"
      ],
      info.key === "emergency"
        ? "Emergency Alert"
        : "Patient Alert"
    );


    if (!modal) {
      return;
    }


    modal.classList.add("show");

    /*
      Some HTML uses hidden attribute.
    */

    modal.hidden = false;
  }


  /* =========================================================
     CLOSE ALERT
     ========================================================= */

  function closeAlertOverlay() {
    const modal = getEl(
      "#alertOverlay",
      "#emergencyOverlay",
      ".alert-overlay",
      ".emergency-overlay"
    );

    if (modal) {
      modal.classList.remove("show");
      modal.hidden = true;
    }

    activeAlert = null;


    if (
      "speechSynthesis" in window
    ) {
      try {
        window.speechSynthesis.cancel();
      } catch (_) {}
    }
  }


  /* =========================================================
     CREATE GESTURE ALERT
     ========================================================= */

  function createGestureAlert(info) {
    if (!info) {
      return;
    }


    /*
      Always immediately show the detection.
    */

    showDetection(
      info,
      true
    );


    /*
      0 fingers = All OK.
      No alert needs to be stored.
    */

    if (info.key === "ok") {
      return;
    }


    const now = Date.now();


    /*
      Prevent duplicate alerts while
      the same gesture remains visible.
    */

    if (
      info.gesture === lastAlertGesture &&
      now - lastAlertAt <
        ALERT_COOLDOWN
    ) {
      return;
    }


    lastAlertGesture =
      info.gesture;

    lastAlertAt = now;


    /*
      Build backend payload.
    */

    const payload = {
      patientId,

      patientName,

      room,

      bed,

      gesture:
        info.gesture,

      message:
        labels[currentLang][info.key] ||
        labels.en[info.key],

      language:
        currentLang,

      priority:
        info.priority,

      confidence: 95
    };


    /* =========================================
       EMERGENCY
       ========================================= */

    if (
      info.key === "emergency"
    ) {
      /*
        Show immediately.
      */

      overlay(info);

      /*
        Speak immediately.
      */

      speak(
        payload.message,
        currentLang
      );
    }


    /* =========================================
       SAVE ALERT IN BACKGROUND
       =========================================

       DO NOT use:
       await saveAlert(payload)

       because that can make camera detection
       wait for network response.

       Instead save independently.
    */

    saveAlert(payload)
      .then(saved => {
        console.log(
          "Alert saved successfully:",
          saved
        );
      })
      .catch(error => {
        console.error(
          "Alert save failed:",
          error
        );
      });
  }


  /* =========================================================
     COUNT EXTENDED FINGERS
     ========================================================= */

  function countExtendedFingers(
    landmarks
  ) {
    if (
      !landmarks ||
      landmarks.length !== 21
    ) {
      return 0;
    }


    const wrist =
      landmarks[0];

    let count = 0;


    /*
      THUMB
    */

    const thumbTip =
      landmarks[4];

    const thumbIp =
      landmarks[3];


    const thumbTipDistance =
      Math.hypot(
        thumbTip.x - wrist.x,
        thumbTip.y - wrist.y
      );

    const thumbIpDistance =
      Math.hypot(
        thumbIp.x - wrist.x,
        thumbIp.y - wrist.y
      );


    if (
      thumbTipDistance >
      thumbIpDistance * 1.08
    ) {
      count++;
    }


    /*
      INDEX
      MIDDLE
      RING
      PINKY
    */

    const fingers = [
      [8, 6],
      [12, 10],
      [16, 14],
      [20, 18]
    ];


    for (
      const [tip, pip]
      of fingers
    ) {
      const tipDistance =
        Math.hypot(
          landmarks[tip].x -
            wrist.x,

          landmarks[tip].y -
            wrist.y
        );


      const pipDistance =
        Math.hypot(
          landmarks[pip].x -
            wrist.x,

          landmarks[pip].y -
            wrist.y
        );


      if (
        tipDistance >
        pipDistance * 1.12
      ) {
        count++;
      }
    }


    return Math.max(
      0,
      Math.min(5, count)
    );
  }


  /* =========================================================
     PROCESS GESTURE
     ========================================================= */

  function processGesture(
    count
  ) {
    const info =
      gestureMap[count];

    if (!info) {
      return;
    }


    const now =
      Date.now();


    /*
      New candidate gesture.
    */

    if (
      candidateGesture !== count
    ) {
      candidateGesture =
        count;

      candidateSince =
        now;

      stableFrames = 1;

      return;
    }


    stableFrames++;


    /*
      Gesture must be stable.
    */

    if (
      stableFrames >=
        REQUIRED_STABLE_FRAMES &&

      now - candidateSince >=
        STABLE_MS &&

      lastGesture !== count
    ) {
      lastGesture =
        count;

      createGestureAlert(
        info
      );
    }
  }


  /* =========================================================
     RESET GESTURE
     ========================================================= */

  function resetGestureState() {
    candidateGesture = null;

    candidateSince = 0;

    stableFrames = 0;

    lastGesture = null;
  }


  /* =========================================================
     MEDIAPIPE RESULTS
     ========================================================= */

  function handleLandmarks(
    results
  ) {
    if (
      !results ||
      !results.multiHandLandmarks ||
      !results.multiHandLandmarks.length
    ) {
      resetGestureState();
      return;
    }


    const count =
      countExtendedFingers(
        results.multiHandLandmarks[0]
      );


    processGesture(
      count
    );
  }


  /* =========================================================
     START CAMERA
     ========================================================= */

  async function startCamera() {
    if (cameraRunning) {
      return;
    }


    camera = getEl(
      "#camera",
      "#video",
      "video"
    );


    if (!camera) {
      console.error(
        "Camera video element not found."
      );

      return;
    }


    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      alert(
        "Camera access is not supported by this browser."
      );

      return;
    }


    try {
      stream =
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


      camera.srcObject =
        stream;


      await camera.play();


      cameraRunning =
        true;


      /*
        MediaPipe Hands
      */

      if (
        typeof window.Hands !==
        "function"
      ) {
        console.warn(
          "MediaPipe Hands library not found."
        );

        return;
      }


      detector =
        new window.Hands({
          locateFile: file =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });


      detector.setOptions({
        maxNumHands: 1,

        modelComplexity: 1,

        minDetectionConfidence:
          0.6,

        minTrackingConfidence:
          0.6
      });


      detector.onResults(
        handleLandmarks
      );


      /*
        Camera processing loop.
      */

      const loop =
        async () => {
          if (!cameraRunning) {
            return;
          }


          if (
            camera.readyState >= 2 &&
            performance.now() -
              lastProcessedAt >=
              DETECT_INTERVAL
          ) {
            lastProcessedAt =
              performance.now();


            try {
              await detector.send({
                image: camera
              });

            } catch (error) {
              console.warn(
                "MediaPipe frame error:",
                error
              );
            }
          }


          requestAnimationFrame(
            loop
          );
        };


      requestAnimationFrame(
        loop
      );

    } catch (error) {
      console.error(
        "Camera start failed:",
        error
      );


      alert(
        "Unable to access camera. Please allow camera permission and try again."
      );
    }
  }


  /* =========================================================
     STOP CAMERA
     ========================================================= */

  function stopCamera() {
    cameraRunning =
      false;


    if (stream) {
      stream
        .getTracks()
        .forEach(track => {
          track.stop();
        });
    }


    stream = null;


    if (camera) {
      camera.srcObject =
        null;
    }


    resetGestureState();
  }


  /* =========================================================
     LOAD PATIENT
     ========================================================= */

  async function loadPatient() {
    try {
      const response =
        await api(
          "/api/users"
        );


      if (!response.ok) {
        return;
      }


      const users =
        await response.json();


      const patient =
        users.find(
          user =>
            user.role ===
            "patient"
        ) ||
        users[0];


      if (!patient) {
        return;
      }


      patientId =
        patient.id ||
        patientId;


      patientName =
        patient.name ||
        patientName;


      room =
        patient.room ||
        room;


      bed =
        patient.bed ||
        bed;


      setText(
        ["#patientName"],
        patientName
      );


      setText(
        ["#patientRoom"],
        room
      );


      setText(
        ["#patientBed"],
        bed
      );


      if (
        patient.language &&
        labels[patient.language]
      ) {
        updateLanguage(
          patient.language
        );
      }

    } catch (error) {
      console.warn(
        "Patient data load failed:",
        error
      );
    }
  }


  /* =========================================================
     BUTTONS / UI
     ========================================================= */

  function wireButtons() {

    /*
      Language selector.
    */

    const languageSelect =
      getEl(
        "#languageSelect",
        "#language",
        "#langSelect",
        "select[name='language']"
      );


    if (languageSelect) {
      languageSelect.addEventListener(
        "change",
        () => {
          updateLanguage(
            languageSelect.value
          );

          loadVoices();
        }
      );
    }


    /*
      Start camera buttons.
    */

    const cameraButton =
      getEl(
        "#startCamera",
        "#cameraBtn",
        "#startBtn",
        "#enableCamera"
      );


    if (cameraButton) {
      cameraButton.addEventListener(
        "click",
        startCamera
      );
    }


    /*
      Stop camera.
    */

    const stopButton =
      getEl(
        "#stopCamera",
        "#stopCameraBtn",
        "#stopBtn"
      );


    if (stopButton) {
      stopButton.addEventListener(
        "click",
        stopCamera
      );
    }


    /*
      Close emergency/alert popup.
    */

    const closeButton =
      getEl(
        "#closeAlert",
        "#closeAlertBtn",
        "#closeEmergency",
        "#emergencyClose",
        ".close-alert"
      );


    if (closeButton) {
      closeButton.addEventListener(
        "click",
        closeAlertOverlay
      );
    }


    /*
      Voice test button if it exists.
    */

    const voiceButton =
      getEl(
        "#enableVoiceBtn",
        "#voiceBtn",
        "#enableVoice"
      );


    if (voiceButton) {
      voiceButton.addEventListener(
        "click",
        () => {
          speak(
            labels[currentLang].emergency,
            currentLang
          );
        }
      );
    }


    /*
      Support data attributes used
      by some existing HTML.
    */

    document.addEventListener(
      "click",
      event => {
        const target =
          event.target.closest?.(
            "[data-close-alert], " +
            "[data-close-emergency], " +
            ".modal-close"
          );


        if (target) {
          closeAlertOverlay();
        }
      }
    );
  }


  /* =========================================================
     INITIALIZE SPEECH
     ========================================================= */

  function initSpeech() {
    if (
      !("speechSynthesis" in window)
    ) {
      return;
    }


    /*
      Voices may initially be empty.
    */

    loadVoices();


    /*
      Chrome / Android can populate
      voices later.
    */

    if (
      "onvoiceschanged" in
      window.speechSynthesis
    ) {
      window.speechSynthesis.addEventListener(
        "voiceschanged",
        loadVoices
      );
    }


    /*
      Additional attempts for mobile devices.
    */

    setTimeout(
      loadVoices,
      300
    );

    setTimeout(
      loadVoices,
      1200
    );
  }


  /* =========================================================
     PAGE INITIALIZATION
     ========================================================= */

  document.addEventListener(
    "DOMContentLoaded",
    async () => {

      wireButtons();

      initSpeech();

      await loadPatient();


      /*
        Optional automatic camera start.
        Only starts if HTML contains:

        <body data-auto-camera="true">
      */

      if (
        document.body?.dataset
          ?.autoCamera === "true"
      ) {
        startCamera();
      }
    }
  );


  /* =========================================================
     PUBLIC FUNCTIONS
     ========================================================= */

  window.CareGesture = {
    startCamera,
    stopCamera,
    speak,
    updateLanguage,
    closeAlertOverlay
  };

})();
