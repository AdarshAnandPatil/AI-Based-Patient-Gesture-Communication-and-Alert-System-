/* =========================================================
   AI-BASED PATIENT GESTURE COMMUNICATION SYSTEM
   COMPLETE public/app.js

   Features:
   ✓ Hand Gesture Detection (0–5 fingers)
   ✓ English / Kannada / Hindi
   ✓ Text + Voice + Alert
   ✓ Room and Bed Number
   ✓ Alert saving through server API
   ✓ Face Detection
   ✓ Eye Blink Communication
   ✓ Head Movement Communication
   ✓ Camera Diagnostics
   ✓ Test All Modules
   ========================================================= */


/* =========================
   APPLICATION STATE
========================= */

let state = {
    alerts: [],
    reports: [],
    appointments: []
};

let filter = "all";
let activeAlert = null;

const $ = (id) => document.getElementById(id);


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
        food: "PATIENT NEEDS FOOD",
        water: "PATIENT NEEDS WATER",
        nurse: "PATIENT NEEDS NURSE",
        help: "PATIENT NEEDS HELP",
        emergency: "EMERGENCY — DOCTOR / NURSE NEEDED",
        ok: "ALL OK",

        detect: "FINGERS DETECTED",

        waiting: "Waiting for hand gesture…",

        detail:
            "AI is watching the hand landmarks automatically.",

        voiceReady:
            "🔊 Automatic voice is ready",

        voice:
            "Patient needs food.",

        waterVoice:
            "Patient needs water.",

        nurseVoice:
            "Patient needs a nurse.",

        helpVoice:
            "Patient needs help.",

        emergencyVoice:
            "Emergency. Doctor or nurse is needed.",

        okVoice:
            "Patient is all okay."
    },


    kn: {

        food:
            "ರೋಗಿಗೆ ಆಹಾರ ಬೇಕಾಗಿದೆ",

        water:
            "ರೋಗಿಗೆ ನೀರು ಬೇಕಾಗಿದೆ",

        nurse:
            "ರೋಗಿಗೆ ನರ್ಸ್ ಬೇಕಾಗಿದೆ",

        help:
            "ರೋಗಿಗೆ ಸಹಾಯ ಬೇಕಾಗಿದೆ",

        emergency:
            "ತುರ್ತು — ವೈದ್ಯರು / ನರ್ಸ್ ಬೇಕು",

        ok:
            "ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ",

        detect:
            "ಬೆರಳುಗಳು ಪತ್ತೆಯಾಗಿವೆ",

        waiting:
            "ಕೈ ಸನ್ನೆಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ…",

        detail:
            "AI ಕೈಯ ಲ್ಯಾಂಡ್‌ಮಾರ್ಕ್‌ಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಗಮನಿಸುತ್ತಿದೆ.",

        voiceReady:
            "🔊 ಸ್ವಯಂಚಾಲಿತ ಧ್ವನಿ ಸಿದ್ಧವಾಗಿದೆ",

        voice:
            "ರೋಗಿಗೆ ಆಹಾರ ಬೇಕಾಗಿದೆ.",

        waterVoice:
            "ರೋಗಿಗೆ ನೀರು ಬೇಕಾಗಿದೆ.",

        nurseVoice:
            "ರೋಗಿಗೆ ನರ್ಸ್ ಬೇಕಾಗಿದೆ.",

        helpVoice:
            "ರೋಗಿಗೆ ಸಹಾಯ ಬೇಕಾಗಿದೆ.",

        emergencyVoice:
            "ತುರ್ತು ಪರಿಸ್ಥಿತಿ. ವೈದ್ಯರು ಅಥವಾ ನರ್ಸ್ ಬೇಕು.",

        okVoice:
            "ರೋಗಿ ಸಂಪೂರ್ಣವಾಗಿ ಸರಿಯಾಗಿದ್ದಾರೆ."
    },


    hi: {

        food:
            "मरीज को खाना चाहिए",

        water:
            "मरीज को पानी चाहिए",

        nurse:
            "मरीज को नर्स चाहिए",

        help:
            "मरीज को मदद चाहिए",

        emergency:
            "आपातकाल — डॉक्टर / नर्स की जरूरत है",

        ok:
            "सब ठीक है",

        detect:
            "उंगलियां पहचानी गईं",

        waiting:
            "हाथ के इशारे का इंतजार…",

        detail:
            "AI हाथ के लैंडमार्क को अपने आप पहचान रहा है।",

        voiceReady:
            "🔊 स्वचालित आवाज तैयार है",

        voice:
            "मरीज को खाना चाहिए।",

        waterVoice:
            "मरीज को पानी चाहिए।",

        nurseVoice:
            "मरीज को नर्स चाहिए।",

        helpVoice:
            "मरीज को मदद चाहिए।",

        emergencyVoice:
            "आपातकाल। डॉक्टर या नर्स की जरूरत है।",

        okVoice:
            "मरीज बिल्कुल ठीक है।"
    }
};


/* =========================
   GESTURE GUIDE TEXT
========================= */

const guideText = {

    en: {
        food: "Food",
        foodSub: "Patient needs food",

        water: "Water",
        waterSub: "Patient needs water",

        nurse: "Nurse",
        nurseSub: "Patient needs nurse",

        help: "Help",
        helpSub: "Patient needs help",

        emergency: "Emergency",
        emergencySub: "Emergency assistance",

        ok: "All OK",
        okSub: "Everything is okay"
    },


    kn: {

        food: "ಆಹಾರ",
        foodSub: "ರೋಗಿಗೆ ಆಹಾರ ಬೇಕಾಗಿದೆ",

        water: "ನೀರು",
        waterSub: "ರೋಗಿಗೆ ನೀರು ಬೇಕಾಗಿದೆ",

        nurse: "ನರ್ಸ್",
        nurseSub: "ರೋಗಿಗೆ ನರ್ಸ್ ಬೇಕಾಗಿದೆ",

        help: "ಸಹಾಯ",
        helpSub: "ರೋಗಿಗೆ ಸಹಾಯ ಬೇಕಾಗಿದೆ",

        emergency: "ತುರ್ತು",
        emergencySub: "ತುರ್ತು ಸಹಾಯ",

        ok: "ಎಲ್ಲವೂ ಸರಿ",
        okSub: "ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ"
    },


    hi: {

        food: "खाना",
        foodSub: "मरीज को खाना चाहिए",

        water: "पानी",
        waterSub: "मरीज को पानी चाहिए",

        nurse: "नर्स",
        nurseSub: "मरीज को नर्स चाहिए",

        help: "मदद",
        helpSub: "मरीज को मदद चाहिए",

        emergency: "आपातकाल",
        emergencySub: "आपातकालीन सहायता",

        ok: "सब ठीक",
        okSub: "सब कुछ ठीक है"
    }
};


/* =========================
   GESTURE MAPPING
========================= */

/*

0 Fingers → All OK
1 Finger  → Water
2 Fingers → Food
3 Fingers → Nurse
4 Fingers → Help
5 Fingers → Emergency

*/

const gestureMap = {

    0: {
        key: "ok",
        name: "0 Fingers",
        emoji: "✊",
        priority: "Normal"
    },

    1: {
        key: "water",
        name: "1 Finger",
        emoji: "☝️",
        priority: "Normal"
    },

    2: {
        key: "food",
        name: "2 Fingers",
        emoji: "✌️",
        priority: "Normal"
    },

    3: {
        key: "nurse",
        name: "3 Fingers",
        emoji: "🤟",
        priority: "High"
    },

    4: {
        key: "help",
        name: "4 Fingers",
        emoji: "🖖",
        priority: "High"
    },

    5: {
        key: "emergency",
        name: "5 Fingers",
        emoji: "🖐️",
        priority: "Critical"
    }
};


/* =========================
   UTILITIES
========================= */

function esc(value) {

    return String(value ?? "")
        .replace(/[&<>"']/g, character => {

            const entities = {

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return entities[character];
        });
}


function toast(message) {

    const element = $("toast");

    if (!element) {
        console.log(message);
        return;
    }

    element.textContent = message;

    element.classList.add("show");

    setTimeout(() => {

        element.classList.remove("show");

    }, 3000);
}


/* =========================
   PAGE NAVIGATION
========================= */

function page(pageName) {

    document
        .querySelectorAll(".page")
        .forEach(element => {

            element.classList.remove("active");

        });


    const target = $(pageName);

    if (target) {

        target.classList.add("active");

    }


    document
        .querySelectorAll(".nav")
        .forEach(element => {

            element.classList.toggle(

                "active",

                element.dataset.page === pageName
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

        faceeye:
            "Face & Eye AI",

        mobile:
            "Mobile App",

        test:
            "Test All Modules"
    };


    if ($("pageTitle")) {

        $("pageTitle").textContent =
            titles[pageName] || pageName;

    }


    if (
        pageName === "gesture" &&
        !cameraRunning
    ) {

        setTimeout(() => {

            startCamera();

        }, 200);

    }


    if (pageName === "mobile") {

        updateMobilePanel();

    }
}


/* =========================
   API FUNCTION
========================= */

async function api(url, options = {}) {

    const controller =
        new AbortController();

    const timer =
        setTimeout(() => {

            controller.abort();

        }, 10000);


    try {

        const response =
            await fetch(

                url,

                {

                    cache: "no-store",

                    ...options,

                    signal:
                        controller.signal
                }
            );


        let data = {};


        try {

            data =
                await response.json();

        }
        catch (error) {

            data = {};

        }


        if (!response.ok) {

            throw new Error(

                data.detail ||

                data.error ||

                data.message ||

                `Request failed (${response.status})`
            );
        }


        return data;

    }
    catch (error) {

        if (
            error.name ===
            "AbortError"
        ) {

            throw new Error(
                "Server request timed out"
            );
        }

        throw error;

    }
    finally {

        clearTimeout(timer);

    }
}


/* =========================
   LOAD SERVER STATE
========================= */

async function refresh() {

    try {

        const data =
            await api("/api/state");


        state = {

            alerts:
                data.alerts || [],

            reports:
                data.reports || [],

            appointments:
                data.appointments || []
        };


        render();

    }
    catch (error) {

        console.warn(
            "Server connection error:",
            error
        );

    }
}


/* =========================
   RENDER DASHBOARD
========================= */

function render() {

    const alerts =
        state.alerts || [];


    const activeAlerts =
        alerts.filter(alert =>
            alert.status !== "Resolved"
        );


    const confidenceValues =
        alerts
            .map(alert =>
                Number(alert.confidence)
            )
            .filter(Number.isFinite);


    if ($("activeCount")) {

        $("activeCount").textContent =
            activeAlerts.length;

    }


    if ($("criticalCount")) {

        $("criticalCount").textContent =
            alerts.filter(alert =>

                alert.priority === "Critical" &&

                alert.status !== "Resolved"

            ).length;

    }


    if ($("confidenceStat")) {

        $("confidenceStat").textContent =
            confidenceValues.length

                ?

                Math.round(

                    confidenceValues.reduce(

                        (total, value) =>
                            total + value,

                        0
                    )

                    /

                    confidenceValues.length

                ) + "%"

                :

                "—";

    }


    if ($("todayCount")) {

        const today =
            new Date()
                .toISOString()
                .slice(0, 10);


        $("todayCount").textContent =
            alerts.filter(alert =>

                alert.createdAt &&
                alert.createdAt.slice(0, 10) === today

            ).length;

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


    let filteredAlerts;


    if (filter === "all") {

        filteredAlerts = alerts;

    }
    else if (filter === "Critical") {

        filteredAlerts =
            alerts.filter(alert =>
                alert.priority === "Critical"
            );

    }
    else {

        filteredAlerts =
            alerts.filter(alert =>
                alert.status === filter
            );

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
                            ${esc(
                                report.originalName
                            )}
                        </b>

                        <div class="alert-meta">

                            ${esc(
                                report.patientId
                            )}

                            ·

                            ${
                                report.uploadedAt
                                    ?

                                    new Date(
                                        report.uploadedAt
                                    ).toLocaleString()

                                    :

                                    ""
                            }

                        </div>

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

                            ${esc(
                                appointment.date
                            )}

                            ${esc(
                                appointment.time
                            )}

                        </b>

                        <div class="alert-meta">

                            ${esc(
                                appointment.doctor
                            )}

                            ·

                            ${esc(
                                appointment.status
                            )}

                        </div>

                    </div>

                `)

                .join("");

    }


    if ($("aTotal")) {

        $("aTotal").textContent =
            alerts.length;

    }


    if ($("aResolved")) {

        $("aResolved").textContent =

            alerts.filter(alert =>
                alert.status === "Resolved"
            ).length;

    }


    if ($("aEscalated")) {

        $("aEscalated").textContent =

            alerts.filter(alert =>
                alert.status === "Escalated"
            ).length;

    }


    if ($("aAppointments")) {

        $("aAppointments").textContent =

            (state.appointments || [])
                .length;

    }


    const gestureCounts = {};


    alerts.forEach(alert => {

        const gesture =
            alert.gesture ||
            "Unknown";


        gestureCounts[gesture] =
            (gestureCounts[gesture] || 0) + 1;

    });


    if ($("gestureBars")) {

        $("gestureBars").innerHTML =

            Object.entries(gestureCounts)

                .map(([gesture, count]) => `

                    <div class="alert-card">

                        <b>
                            ${esc(gesture)}
                        </b>

                        —

                        ${count}

                    </div>

                `)

                .join("")

            ||

            "<p>No gesture data.</p>";

    }
}


/* =========================
   ALERT CARD
========================= */

function card(alert) {

    return `

        <div class="alert-card
            ${
                alert.priority === "Critical"
                    ?
                    "critical"
                    :
                    ""
            }
        ">

            <b>

                ${esc(alert.priority)}

                ·

                ${esc(alert.status)}

            </b>


            <div class="alert-message">

                ${esc(alert.message)}

            </div>


            <div class="alert-meta">

                Patient
                ${esc(alert.patientId)}

                · Room
                ${esc(alert.room)}

                · Bed
                ${esc(alert.bed)}

                ·
                ${esc(alert.confidence)}%

            </div>


            <div class="alert-actions">

                <button

                    class="primary act"

                    data-id="${esc(alert.id)}"

                    data-action="voice"

                    type="button"

                >

                    🔊 Voice

                </button>


                <button

                    class="outline act"

                    data-id="${esc(alert.id)}"

                    data-action="acknowledge"

                    type="button"

                >

                    Acknowledge

                </button>


                <button

                    class="outline act"

                    data-id="${esc(alert.id)}"

                    data-action="resolve"

                    type="button"

                >

                    Resolve

                </button>


                <button

                    class="outline act"

                    data-id="${esc(alert.id)}"

                    data-action="escalate"

                    type="button"

                >

                    Escalate

                </button>

            </div>

        </div>

    `;
}


/* =========================
   LANGUAGE
========================= */

function getSelectedLang() {

    const selector =
        $("languageSelect");


    if (!selector) {

        return "en-IN";

    }


    return langs[selector.value] ||
        "en-IN";
}


/* =========================
   TEXT TO SPEECH
========================= */

function loadVoices() {

    if (
        !window.speechSynthesis
    ) {

        return [];

    }


    return speechSynthesis.getVoices();

}


if (
    "speechSynthesis" in window
) {

    loadVoices();


    speechSynthesis.addEventListener(

        "voiceschanged",

        loadVoices
    );

}


function findVoice(language) {

    const wanted =
        (language || "en-IN")
            .toLowerCase();


    const base =
        wanted.split("-")[0];


    const voices =
        loadVoices();


    return (

        voices.find(
            voice =>
                voice.lang
                    ?.toLowerCase()
                    === wanted
        )

        ||

        voices.find(
            voice =>
                voice.lang
                    ?.toLowerCase()
                    .startsWith(
                        base + "-"
                    )
        )

        ||

        voices.find(
            voice =>
                voice.lang
                    ?.toLowerCase()
                    .startsWith(base)
        )

        ||

        null
    );
}


let speechTimer = null;


function speak(textToSay, languageKey) {

    if (!textToSay) {

        return false;

    }


    if (
        !(
            "speechSynthesis" in window
        )
    ) {

        toast(
            "Voice is not supported on this browser"
        );

        return false;

    }


    const language =

        langs[
            languageKey ||
            $("languageSelect")?.value
        ]

        ||

        "en-IN";


    const utterance =
        new SpeechSynthesisUtterance(
            textToSay
        );


    utterance.lang =
        language;

    utterance.rate =
        0.9;

    utterance.pitch =
        1;

    utterance.volume =
        1;


    const voice =
        findVoice(language);


    if (voice) {

        utterance.voice =
            voice;

    }


    const voiceStatus =
        $("voiceStatus");


    if (voiceStatus) {

        voiceStatus.textContent =

            voice

                ?

                `🔊 Speaking (${voice.lang})`

                :

                "🔊 Speaking with browser voice";

    }


    utterance.onend = () => {

        if (voiceStatus) {

            voiceStatus.textContent =
                "✓ Voice completed";

        }

    };


    utterance.onerror = () => {

        if (voiceStatus) {

            voiceStatus.textContent =
                "⚠️ Voice could not be played";

        }

    };


    try {

        speechSynthesis.cancel();

        speechSynthesis.resume();


        if (speechTimer) {

            clearTimeout(
                speechTimer
            );

        }


        speechTimer =
            setTimeout(() => {

                speechSynthesis.speak(
                    utterance
                );

            }, 100);

    }
    catch (error) {

        console.error(
            "Speech error:",
            error
        );

    }


    return true;
}


function primeVoice() {

    try {

        if (
            !window.speechSynthesis
        ) {

            return;

        }


        speechSynthesis.cancel();

        speechSynthesis.resume();

    }
    catch (error) {

        console.warn(error);

    }
}


/* =========================
   ALERT OVERLAY
========================= */

function overlay(alert) {

    activeAlert =
        alert;


    if ($("overlayMessage")) {

        $("overlayMessage").textContent =
            alert.message ||
            "Patient alert";

    }


    if ($("overlayMeta")) {

        $("overlayMeta").textContent =

            `Room ${alert.room || "-"}

             ·

             Bed ${alert.bed || "-"}`;

    }


    if ($("overlayPatient")) {

        $("overlayPatient").textContent =

            `Patient ${alert.patientId || "-"}

             ·

             ${alert.patientName || "Patient"}`;

    }


    if ($("overlayPriority")) {

        $("overlayPriority").textContent =

            alert.priority === "Critical"

                ?

                "🚨 CRITICAL PATIENT ALERT"

                :

                "🚨 PATIENT ALERT";

    }


    const overlayElement =
        $("alertOverlay");


    if (overlayElement) {

        overlayElement.classList.add(
            "show"
        );

        overlayElement.setAttribute(
            "aria-hidden",
            "false"
        );

    }
}


function closeAlertOverlay() {

    const overlayElement =
        $("alertOverlay");


    if (overlayElement) {

        overlayElement.classList.remove(
            "show"
        );

        overlayElement.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    activeAlert = null;


    try {

        speechSynthesis.cancel();

    }
    catch (error) {}


    const status =
        $("voiceStatus");


    const language =
        $("languageSelect")?.value ||
        "en";


    if (status) {

        status.textContent =
            (labels[language] || labels.en)
                .voiceReady;

    }
}


/* =========================
   CREATE GESTURE ALERT
========================= */

let emergencyLatched = false;


async function createGestureAlert(
    number
) {

    const gesture =
        gestureMap[number];


    if (!gesture) {

        return;

    }


    const language =
        $("languageSelect")?.value ||
        "en";


    const text =
        labels[language] ||
        labels.en;


    const patientId =
        $("patientId")?.value ||
        "P1001";


    const room =
        $("room")?.value ||
        "204";


    const bed =
        $("bed")?.value ||
        "1";


    const message =
        text[gesture.key];


    const payload = {

        patientId,

        patientName:
            "Demo Patient",

        room,

        bed,

        gesture:
            gesture.name,

        message,

        language,

        priority:
            gesture.priority,

        confidence:
            95
    };


    try {

        const alert =

            await api(

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
                            payload
                        )
                }
            );


        updateLocalAlert(
            alert
        );


        notifyAlert(
            alert
        );


        showDetection(
            number,
            true
        );


        if (
            gesture.key ===
            "emergency"
        ) {

            overlay(alert);

        }


        return alert;

    }
    catch (error) {

        console.error(
            "Gesture alert error:",
            error
        );

        toast(

            "Gesture detected, but alert could not be saved: "

            +

            error.message

        );

        return null;

    }
}


/* =========================
   ALERT ACTION
========================= */

async function act(
    id,
    action
) {

    try {

        if (
            action === "voice"
        ) {

            const alert =
                state.alerts.find(
                    item =>
                        String(item.id) ===
                        String(id)
                );


            if (alert) {

                speak(

                    `${alert.message}.
                    Room ${alert.room}.
                    Bed ${alert.bed}.`,

                    alert.language
                );

            }

            return;

        }


        const updatedAlert =

            await api(

                "/api/alerts/" +
                encodeURIComponent(id),

                {

                    method:
                        "PATCH",

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


        updateLocalAlert(
            updatedAlert
        );


        toast(
            "Alert updated"
        );


        return updatedAlert;

    }
    catch (error) {

        console.error(error);

        toast(
            "Could not update alert"
        );

    }
}


/* =========================
   BROWSER NOTIFICATION
========================= */

function notifyAlert(alert) {

    if (

        "Notification" in window

        &&

        Notification.permission ===
        "granted"

    ) {

        new Notification(

            alert.priority ===
            "Critical"

                ?

                "🚨 Patient Emergency"

                :

                "Patient Gesture Alert",

            {

                body:
                    `${alert.message}
                     | Room ${alert.room}
                     | Bed ${alert.bed}`
            }
        );

    }
}


async function notifyEnable() {

    if (
        !("Notification" in window)
    ) {

        toast(
            "Notifications are not supported"
        );

        return;

    }


    try {

        const permission =
            await Notification.requestPermission();


        if (
            permission === "granted"
        ) {

            toast(
                "Notifications enabled"
            );

        }
        else {

            toast(
                "Notifications were not allowed"
            );

        }

    }
    catch (error) {

        toast(
            "Could not enable notifications"
        );

    }
}


/* =========================
   SHOW GESTURE DETECTION
========================= */

function showDetection(
    number,
    sent = false
) {

    const gesture =
        gestureMap[number];


    if (!gesture) {

        return;

    }


    const language =
        $("languageSelect")?.value ||
        "en";


    const text =
        labels[language] ||
        labels.en;


    if ($("detectedGesture")) {

        $("detectedGesture").textContent =

            `${gesture.emoji}

             ${gesture.name}

             ${text.detect}`;

    }


    if ($("detectedEmoji")) {

        $("detectedEmoji").textContent =
            gesture.emoji;

    }


    if ($("detectedNeed")) {

        $("detectedNeed").textContent =
            text[gesture.key];

    }


    if ($("detectedDetail")) {

        $("detectedDetail").textContent =

            text.detail

            +

            (

                sent

                    ?

                    " ✓ Alert sent and saved."

                    :

                    ""
            );

    }


    const panel =
        $("detectionPanel");


    if (panel) {

        panel.classList.toggle(

            "emergency-detection",

            gesture.key ===
            "emergency"
        );

    }
}


/* =========================
   SPEAK DETECTED GESTURE
========================= */

function speakDetected(number) {

    const gesture =
        gestureMap[number];


    if (!gesture) {

        return;

    }


    const language =
        $("languageSelect")?.value ||
        "en";


    const text =
        labels[language] ||
        labels.en;


    const voiceMessages = {

        food:
            text.voice,

        water:
            text.waterVoice,

        nurse:
            text.nurseVoice,

        help:
            text.helpVoice,

        emergency:
            text.emergencyVoice,

        ok:
            text.okVoice
    };


    speak(

        voiceMessages[gesture.key],

        language
    );
}


/* =========================
   UPDATE GESTURE GUIDE
========================= */

function updateGuide() {

    const language =
        $("languageSelect")?.value ||
        "en";


    const text =
        guideText[language] ||
        guideText.en;


    const values = {

        guideWater:
            text.water,

        guideWaterSub:
            text.waterSub,

        guideFood:
            text.food,

        guideFoodSub:
            text.foodSub,

        guideNurse:
            text.nurse,

        guideNurseSub:
            text.nurseSub,

        guideHelp:
            text.help,

        guideHelpSub:
            text.helpSub,

        guideEmergency:
            text.emergency,

        guideEmergencySub:
            text.emergencySub,

        guideOk:
            text.ok,

        guideOkSub:
            text.okSub
    };


    Object.entries(values)
        .forEach(

            ([id, value]) => {

                if ($(id)) {

                    $(id).textContent =
                        value;

                }

            }

        );


    if ($("patientLang")) {

        $("patientLang").textContent = {

            en: "English",

            kn: "Kannada",

            hi: "Hindi"

        }[language];

    }


    if (
        lastDetected !== null
    ) {

        showDetection(
            lastDetected,
            false
        );

    }
}


/* =========================
   HAND LANDMARK MATH
========================= */

function distance(a, b) {

    return Math.hypot(

        a.x - b.x,

        a.y - b.y

    );
}


function angle(a, b, c) {

    const ab = {

        x:
            a.x - b.x,

        y:
            a.y - b.y
    };


    const cb = {

        x:
            c.x - b.x,

        y:
            c.y - b.y
    };


    const dot =

        ab.x * cb.x

        +

        ab.y * cb.y;


    const denominator =

        Math.hypot(
            ab.x,
            ab.y
        )

        *

        Math.hypot(
            cb.x,
            cb.y
        );


    if (!denominator) {

        return 0;

    }


    return (

        Math.acos(

            Math.max(

                -1,

                Math.min(
                    1,
                    dot / denominator
                )
            )
        )

        *

        180

        /

        Math.PI

    );
}


function fingerExtended(
    landmarks,
    mcp,
    pip,
    tip
) {

    return (

        angle(

            landmarks[mcp],

            landmarks[pip],

            landmarks[tip]

        )

        >

        150

        &&

        distance(
            landmarks[tip],
            landmarks[0]
        )

        >

        distance(
            landmarks[pip],
            landmarks[0]
        ) * 1.04

    );
}


/* =========================
   COUNT FINGERS
========================= */

function countFingers(
    landmarks
) {

    let count = 0;


    const fingers = [

        [5, 6, 8],

        [9, 10, 12],

        [13, 14, 16],

        [17, 18, 20]
    ];


    fingers.forEach(
        ([mcp, pip, tip]) => {

            if (

                fingerExtended(

                    landmarks,

                    mcp,

                    pip,

                    tip

                )

            ) {

                count++;

            }

        }
    );


    /* Thumb */

    const thumbAngle =

        angle(

            landmarks[2],

            landmarks[3],

            landmarks[4]

        );


    if (

        thumbAngle > 145

        &&

        distance(
            landmarks[4],
            landmarks[0]
        )

        >

        distance(
            landmarks[3],
            landmarks[0]
        ) * 1.02

    ) {

        count++;

    }


    return count;
}


/* =========================
   HAND AI VARIABLES
========================= */

let lastDetected = null;

let stableCounts = [];

let candidateGesture = null;

let candidateSince = 0;

let lastSentGesture = null;

let lastSentAt = 0;


let cameraStream = null;

let hands = null;

let cameraRunning = false;

let processingFrame = false;

let lastProcessTime = 0;

let frameHandle = null;


let mediaPipeBase =

    "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/";


/* =========================
   UPDATE LOCAL ALERT
========================= */

function updateLocalAlert(alert) {

    if (!alert) {

        return;

    }


    if (
        !Array.isArray(state.alerts)
    ) {

        state.alerts = [];

    }


    state.alerts = [

        alert,

        ...state.alerts.filter(
            item =>

                String(item.id)

                !==

                String(alert.id)
        )
    ];


    render();
}


/* =========================
   CAMERA DIAGNOSTICS
========================= */

function setCameraDiagnostic(
    message,
    ok = false
) {

    const element =
        $("cameraDiagnostic");


    if (element) {

        element.textContent =
            message;

        element.classList.toggle(
            "ok",
            ok
        );

    }


    const health =
        $("cameraHealth");


    if (health) {

        health.innerHTML = `

            <div class="health-item
                ${ok ? "ok" : "warn"}">

                <b>Latest status:</b>

                ${esc(message)}

            </div>


            <div class="health-item
                ${window.isSecureContext ? "ok" : "fail"}">

                <b>Secure context:</b>

                ${
                    window.isSecureContext

                        ?

                        "HTTPS / localhost ✓"

                        :

                        "Not secure ✗"
                }

            </div>


            <div class="health-item
                ${
                    navigator.mediaDevices?.getUserMedia

                        ?

                        "ok"

                        :

                        "fail"
                }">

                <b>Camera API:</b>

                ${
                    navigator.mediaDevices?.getUserMedia

                        ?

                        "Available ✓"

                        :

                        "Unavailable ✗"
                }

            </div>


            <div class="health-item
                ${cameraRunning ? "ok" : "warn"}">

                <b>Camera stream:</b>

                ${
                    cameraRunning

                        ?

                        "Running ✓"

                        :

                        "Stopped"
                }

            </div>

        `;

    }
}


function setFaceDiagnostic(
    message,
    ok = false
) {

    const element =
        $("faceDiagnostic");


    if (element) {

        element.textContent =
            message;

        element.classList.toggle(
            "ok",
            ok
        );

    }
}


function updateRuntime(
    id,
    text
) {

    const element =
        $(id);


    if (element) {

        element.textContent =
            text;

    }
}


/* =========================
   DIAGNOSTICS
========================= */

function diagnosticRow(
    label,
    status,
    detail
) {

    const icon =

        status === "ok"

            ?

            "✓"

            :

            status === "warn"

                ?

                "⚠"

                :

                "✗";


    return `

        <div class="diagnostic-item ${status}">

            <b>

                ${icon}

                ${esc(label)}

            </b>

            <br>

            <span>

                ${esc(detail)}

            </span>

        </div>

    `;
}


async function runFullDiagnostics() {

    const output =
        $("diagnosticResults");


    if (!output) {

        return;

    }


    output.innerHTML =
        diagnosticRow(

            "Diagnostics",

            "warn",

            "Running checks…"
        );


    const rows = [];


    rows.push(

        diagnosticRow(

            "HTTPS / Secure Context",

            window.isSecureContext
                ?
                "ok"
                :
                "fail",

            window.isSecureContext

                ?

                "Secure camera context available."

                :

                "Use HTTPS Render URL or localhost."
        )
    );


    rows.push(

        diagnosticRow(

            "Camera API",

            navigator.mediaDevices?.getUserMedia

                ?

                "ok"

                :

                "fail",

            navigator.mediaDevices?.getUserMedia

                ?

                "getUserMedia is available."

                :

                "Camera API unavailable."
        )
    );


    rows.push(

        diagnosticRow(

            "Speech Synthesis",

            "speechSynthesis" in window

                ?

                "ok"

                :

                "fail",

            "speechSynthesis" in window

                ?

                "Browser voice API available."

                :

                "No browser voice API."
        )
    );


    const language =
        getSelectedLang();


    const voice =
        findVoice(language);


    rows.push(

        diagnosticRow(

            "Selected Language Voice",

            voice

                ?

                "ok"

                :

                "warn",

            voice

                ?

                `Voice found: ${voice.name} (${voice.lang})`

                :

                `No installed ${language} voice was found on this device.`
        )
    );


    try {

        const server =
            await api("/api/state");


        rows.push(

            diagnosticRow(

                "Alert Server",

                "ok",

                `Connected. ${
                    server.alerts?.length || 0
                } alert(s) returned.`
            )
        );

    }
    catch (error) {

        rows.push(

            diagnosticRow(

                "Alert Server",

                "fail",

                error.message
            )
        );

    }


    rows.push(

        diagnosticRow(

            "Hand AI Library",

            window.Hands

                ?

                "ok"

                :

                "warn",

            window.Hands

                ?

                "MediaPipe Hands loaded."

                :

                "Will load when camera starts."
        )
    );


    rows.push(

        diagnosticRow(

            "Face AI Library",

            window.FaceMesh

                ?

                "ok"

                :

                "warn",

            window.FaceMesh

                ?

                "MediaPipe FaceMesh loaded."

                :

                "Will load when Face AI starts."
        )
    );


    rows.push(

        diagnosticRow(

            "Live Hand Detection",

            cameraRunning

                ?

                "ok"

                :

                "warn",

            cameraRunning

                ?

                "Camera running."

                :

                "Hand camera is stopped."
        )
    );


    rows.push(

        diagnosticRow(

            "Live Face Detection",

            faceRunning

                ?

                "ok"

                :

                "warn",

            faceRunning

                ?

                "Face AI is running."

                :

                "Face AI is stopped."
        )
    );


    output.innerHTML =
        rows.join("");
}


/* =========================
   TEST ALERT
========================= */

async function sendTestAlert() {

    const payload = {

        patientId:
            $("patientId")?.value ||
            "P1001",

        patientName:
            "Demo Patient",

        room:
            $("room")?.value ||
            "204",

        bed:
            $("bed")?.value ||
            "3",

        gesture:
            "System Test",

        message:
            "TEST ALERT — Room and Bed communication check",

        language:
            $("languageSelect")?.value ||
            "en",

        priority:
            "Normal",

        confidence:
            100
    };


    try {

        const alert =
            await api(

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
                            payload
                        )
                }
            );


        updateLocalAlert(
            alert
        );


        toast(
            "✓ Test alert saved successfully"
        );

    }
    catch (error) {

        toast(
            "Test alert failed: " +
            error.message
        );

    }
}


/* =========================
   LOAD MEDIAPIPE SCRIPT
========================= */

function loadScript(src) {

    return new Promise(
        (resolve, reject) => {

            const existing =

                document.querySelector(

                    `script[data-mp-src="${src}"]`
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
                    () =>
                        reject(
                            new Error(
                                "MediaPipe Hands failed to load"
                            )
                        ),
                    { once: true }
                );


                return;

            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                src;


            script.async =
                true;


            script.dataset.mpSrc =
                src;


            script.onload =
                resolve;


            script.onerror =
                () =>

                    reject(

                        new Error(

                            "Could not load MediaPipe Hands"
                        )
                    );


            document.head.appendChild(
                script
            );

        }
    );
}


/* =========================
   ENSURE MEDIAPIPE HANDS
========================= */

async function ensureMediaPipeHands() {

    if (window.Hands) {

        return true;

    }


    const version =
        "0.4.1675469240";


    const sources = [

        {

            base:

                `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${version}/`,

            script:

                `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${version}/hands.js`
        },

        {

            base:

                `https://unpkg.com/@mediapipe/hands@${version}/`,

            script:

                `https://unpkg.com/@mediapipe/hands@${version}/hands.js`
        }
    ];


    let lastError = null;


    for (
        const source of sources
    ) {

        try {

            await loadScript(
                source.script
            );


            if (window.Hands) {

                mediaPipeBase =
                    source.base;

                return true;

            }

        }
        catch (error) {

            lastError =
                error;

        }

    }


    throw (

        lastError

        ||

        new Error(
            "MediaPipe Hands could not be loaded"
        )
    );
}


/* =========================
   HANDLE HAND LANDMARKS
========================= */

function handleLandmarks(results) {

    const canvas =
        $("outputCanvas");


    const video =
        $("inputVideo");


    if (
        !canvas ||
        !video
    ) {

        return;

    }


    const context =
        canvas.getContext("2d");


    const width =
        video.videoWidth ||
        640;


    const height =
        video.videoHeight ||
        480;


    if (canvas.width !== width) {

        canvas.width =
            width;

    }


    if (canvas.height !== height) {

        canvas.height =
            height;

    }


    context.clearRect(

        0,

        0,

        canvas.width,

        canvas.height
    );


    const landmarks =
        results.multiHandLandmarks?.[0];


    if (!landmarks) {

        if ($("cameraStatus")) {

            $("cameraStatus").textContent =
                "Camera running — show one hand";

        }


        updateRuntime(

            "handLiveStatus",

            "Camera: RUNNING · Waiting for hand…"
        );


        if ($("cameraHint")) {

            $("cameraHint")
                .classList
                .remove("hidden");

        }


        stableCounts = [];

        candidateGesture = null;

        candidateSince = 0;

        return;

    }


    if ($("cameraHint")) {

        $("cameraHint")
            .classList
            .add("hidden");

    }


    if ($("cameraStatus")) {

        $("cameraStatus").textContent =
            "✋ Hand detected";

    }


    setCameraDiagnostic(

        "✓ Hand detected. Processing landmarks…",

        true
    );


    context.fillStyle =
        "#20d46b";


    landmarks.forEach(point => {

        context.beginPath();

        context.arc(

            point.x * canvas.width,

            point.y * canvas.height,

            4,

            0,

            Math.PI * 2
        );

        context.fill();

    });


    const number =
        countFingers(
            landmarks
        );


    stableCounts.push(
        number
    );


    if (
        stableCounts.length > 7
    ) {

        stableCounts.shift();

    }


    const frequency = {};


    stableCounts.forEach(
        count => {

            frequency[count] =
                (frequency[count] || 0) + 1;

        }
    );


    updateRuntime(

        "handLiveStatus",

        `Hand: DETECTED · Fingers: ${number}
         · Samples: ${stableCounts.length}/7`
    );


    const best =

        Object.entries(frequency)

            .sort(
                (a, b) =>
                    b[1] - a[1]
            )[0];


    if (

        !best

        ||

        Number(best[1]) < 5

    ) {

        return;

    }


    const detected =
        Number(best[0]);


    const now =
        Date.now();


    if (
        candidateGesture !==
        detected
    ) {

        candidateGesture =
            detected;

        candidateSince =
            now;

        return;

    }


    if (

        now -
        candidateSince

        <

        400

    ) {

        return;

    }


    if (
        lastDetected ===
        detected
    ) {

        return;

    }


    lastDetected =
        detected;


    showDetection(
        detected,
        false
    );


    if ($("detectedDetail")) {

        $("detectedDetail").textContent =
            "Gesture confirmed. Speaking and sending alert…";

    }


    /* Speak */

    speakDetected(
        detected
    );


    /* Prevent continuous duplicate alerts */

    if (

        lastSentGesture !==
        detected

        ||

        now -
        lastSentAt

        >

        3000

    ) {

        lastSentGesture =
            detected;

        lastSentAt =
            now;


        createGestureAlert(
            detected
        );

    }
}


/* =========================
   PROCESS HAND VIDEO
========================= */

async function processVideoFrame(now) {

    if (!cameraRunning) {

        return;

    }


    frameHandle =
        requestAnimationFrame(
            processVideoFrame
        );


    const video =
        $("inputVideo");


    if (

        !video

        ||

        video.readyState < 2

        ||

        !hands

        ||

        processingFrame

    ) {

        return;

    }


    if (

        now -
        lastProcessTime

        <

        70

    ) {

        return;

    }


    lastProcessTime =
        now;


    processingFrame =
        true;


    try {

        await hands.send({

            image:
                video

        });

    }
    catch (error) {

        console.error(
            "Hand AI frame error:",
            error
        );


        setCameraDiagnostic(

            "AI processing error: " +
            error.message
        );

    }
    finally {

        processingFrame =
            false;

    }
}


/* =========================
   START HAND CAMERA
========================= */

async function startCamera() {

    try {

        if (cameraRunning) {

            return;

        }


        setCameraDiagnostic(

            "Checking camera and AI library…"
        );


        if (
            !window.isSecureContext
        ) {

            throw new Error(

                "Camera requires HTTPS or localhost. Use the Render HTTPS URL."
            );

        }


        if (
            !navigator.mediaDevices?.getUserMedia
        ) {

            throw new Error(

                "Camera API is unavailable. Use Chrome with HTTPS."
            );

        }


        await ensureMediaPipeHands();


        const video =
            $("inputVideo");


        if (!video) {

            throw new Error(
                "Hand camera video element was not found."
            );

        }


        hands =
            new window.Hands({

                locateFile:

                    file =>
                        mediaPipeBase +
                        file
            });


        hands.setOptions({

            maxNumHands:
                1,

            modelComplexity:
                0,

            staticImageMode:
                false,

            minDetectionConfidence:
                0.5,

            minTrackingConfidence:
                0.5
        });


        hands.onResults(
            handleLandmarks
        );


        setCameraDiagnostic(
            "Requesting camera permission…"
        );


        try {

            cameraStream =

                await navigator
                    .mediaDevices
                    .getUserMedia({

                        video: {

                            facingMode: {
                                ideal: "user"
                            },

                            width: {
                                ideal: 640
                            },

                            height: {
                                ideal: 480
                            },

                            frameRate: {
                                ideal: 20
                            }
                        },

                        audio:
                            false
                    });

        }
        catch (error) {

            cameraStream =

                await navigator
                    .mediaDevices
                    .getUserMedia({

                        video:
                            true,

                        audio:
                            false
                    });

        }


        video.srcObject =
            cameraStream;


        video.muted =
            true;


        video.playsInline =
            true;


        await video.play();


        cameraRunning =
            true;


        stableCounts =
            [];


        candidateGesture =
            null;


        candidateSince =
            0;


        lastDetected =
            null;


        lastSentGesture =
            null;


        primeVoice();


        if ($("cameraStatus")) {

            $("cameraStatus").textContent =
                "Camera running — show one hand";

        }


        if ($("aiBadge")) {

            $("aiBadge").textContent =
                "AI RUNNING";

            $("aiBadge")
                .classList
                .add("running");

        }


        updateRuntime(

            "handLiveStatus",

            "Camera: RUNNING · Waiting for hand…"
        );


        setCameraDiagnostic(

            "✓ Camera connected. Hand AI is running.",

            true
        );


        frameHandle =
            requestAnimationFrame(
                processVideoFrame
            );

    }
    catch (error) {

        console.error(
            "Camera error:",
            error
        );


        stopCamera();


        let message =
            error.message ||
            "Camera could not start";


        if (
            error.name ===
            "NotAllowedError"
        ) {

            message =
                "Camera permission denied. Allow Camera permission and try again.";

        }
        else if (
            error.name ===
            "NotFoundError"
        ) {

            message =
                "No camera was found.";

        }
        else if (
            error.name ===
            "NotReadableError"
        ) {

            message =
                "Camera is busy. Close other applications using the camera.";

        }


        setCameraDiagnostic(
            "⚠ " + message
        );


        toast(message);

    }
}


/* =========================
   STOP HAND CAMERA
========================= */

function stopCamera() {

    cameraRunning =
        false;


    if (frameHandle) {

        cancelAnimationFrame(
            frameHandle
        );

        frameHandle =
            null;

    }


    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(track =>
                track.stop()
            );


        cameraStream =
            null;

    }


    const video =
        $("inputVideo");


    if (video) {

        video.srcObject =
            null;

    }


    if (hands) {

        try {

            hands.close?.();

        }
        catch (error) {}


        hands =
            null;

    }


    if ($("cameraStatus")) {

        $("cameraStatus").textContent =
            "Camera is off";

    }


    if ($("aiBadge")) {

        $("aiBadge").textContent =
            "AI READY";

        $("aiBadge")
            .classList
            .remove("running");

    }


    updateRuntime(

        "handLiveStatus",

        "Camera: OFF"
    );


    stableCounts =
        [];


    candidateGesture =
        null;


    candidateSince =
        0;


    lastDetected =
        null;


    lastSentGesture =
        null;
}


/* =========================================================
   FACE + EYE + HEAD AI
========================================================= */

let faceStream =
    null;

let faceMesh =
    null;

let faceRunning =
    false;

let faceBusy =
    false;

let faceFrame =
    null;

let faceLastTime =
    0;


let faceBase =

    "https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/";


let eyeClosed =
    false;

let blinkCount =
    0;

let blinkWindowTimer =
    null;

let lastBlinkSignalAt =
    0;


let faceBaselineX =
    null;

let faceBaselineY =
    null;

let lastHeadSignalAt =
    0;


/* =========================
   FACE LANGUAGE TEXT
========================= */

const faceText = {

    en: {

        waiting:
            "Waiting for patient face…",

        ready:
            "Face & eye communication ready",

        normal:
            "Patient face detected — responsive",

        blink1:
            "YES / OK",

        blink2:
            "NEED HELP",

        blink3:
            "EMERGENCY",

        right:
            "HEAD RIGHT — YES",

        left:
            "HEAD LEFT — NO",

        down:
            "HEAD DOWN — NEED HELP",

        help:
            "Patient needs help. Nurse assistance is required.",

        emergency:
            "Emergency. Immediate nurse or doctor assistance is required.",

        yes:
            "Patient indicates yes or okay."
    },


    kn: {

        waiting:
            "ರೋಗಿಯ ಮುಖಕ್ಕಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ…",

        ready:
            "ಮುಖ ಮತ್ತು ಕಣ್ಣಿನ ಸಂವಹನ ಸಿದ್ಧವಾಗಿದೆ",

        normal:
            "ರೋಗಿಯ ಮುಖ ಪತ್ತೆಯಾಗಿದೆ — ಸ್ಪಂದಿಸುತ್ತಿದ್ದಾರೆ",

        blink1:
            "ಹೌದು / ಸರಿ",

        blink2:
            "ಸಹಾಯ ಬೇಕು",

        blink3:
            "ತುರ್ತು ಪರಿಸ್ಥಿತಿ",

        right:
            "ತಲೆ ಬಲಕ್ಕೆ — ಹೌದು",

        left:
            "ತಲೆ ಎಡಕ್ಕೆ — ಇಲ್ಲ",

        down:
            "ತಲೆ ಕೆಳಗೆ — ಸಹಾಯ ಬೇಕು",

        help:
            "ರೋಗಿಗೆ ಸಹಾಯ ಬೇಕಾಗಿದೆ. ನರ್ಸ್ ಸಹಾಯ ಅಗತ್ಯವಿದೆ.",

        emergency:
            "ತುರ್ತು ಪರಿಸ್ಥಿತಿ. ತಕ್ಷಣ ನರ್ಸ್ ಅಥವಾ ವೈದ್ಯರ ಸಹಾಯ ಅಗತ್ಯವಿದೆ.",

        yes:
            "ರೋಗಿಯು ಹೌದು ಅಥವಾ ಸರಿ ಎಂದು ಸೂಚಿಸಿದ್ದಾರೆ."
    },


    hi: {

        waiting:
            "मरीज के चेहरे का इंतजार…",

        ready:
            "चेहरा और आंख संचार तैयार है",

        normal:
            "मरीज का चेहरा पहचाना गया — प्रतिक्रिया दे रहा है",

        blink1:
            "हां / ठीक",

        blink2:
            "मदद चाहिए",

        blink3:
            "आपातकाल",

        right:
            "सिर दाईं ओर — हां",

        left:
            "सिर बाईं ओर — नहीं",

        down:
            "सिर नीचे — मदद चाहिए",

        help:
            "मरीज को मदद चाहिए। नर्स की सहायता आवश्यक है।",

        emergency:
            "आपातकाल। तुरंत नर्स या डॉक्टर की सहायता आवश्यक है।",

        yes:
            "मरीज ने हां या ठीक होने का संकेत दिया है।"
    }
};


function ft() {

    const language =
        $("languageSelect")?.value ||
        "en";


    return faceText[language] ||
        faceText.en;
}


/* =========================
   LOAD FACE MESH
========================= */

function loadFaceScript(src) {

    return new Promise(
        (resolve, reject) => {

            if (window.FaceMesh) {

                resolve();

                return;

            }


            const script =
                document.createElement(
                    "script"
                );


            script.src =
                src;


            script.async =
                true;


            script.onload =
                resolve;


            script.onerror =
                () =>

                    reject(

                        new Error(

                            "Could not load MediaPipe FaceMesh"
                        )
                    );


            document.head.appendChild(
                script
            );

        }
    );
}


async function ensureFaceMesh() {

    if (window.FaceMesh) {

        return true;

    }


    const version =
        "0.4.1633559619";


    const sources = [

        {

            base:

                `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${version}/`,

            script:

                `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${version}/face_mesh.js`
        },

        {

            base:

                `https://unpkg.com/@mediapipe/face_mesh@${version}/`,

            script:

                `https://unpkg.com/@mediapipe/face_mesh@${version}/face_mesh.js`
        }
    ];


    let lastError =
        null;


    for (
        const source of sources
    ) {

        try {

            await loadFaceScript(
                source.script
            );


            if (
                window.FaceMesh
            ) {

                faceBase =
                    source.base;

                return true;

            }

        }
        catch (error) {

            lastError =
                error;

        }

    }


    throw (

        lastError

        ||

        new Error(
            "Face AI library could not be loaded"
        )
    );
}


/* =========================
   EYE RATIO
========================= */

function eyeRatio(
    landmarks,
    a,
    b,
    c,
    d
) {

    const width =
        distance(
            landmarks[a],
            landmarks[b]
        );


    const height =
        distance(
            landmarks[c],
            landmarks[d]
        );


    return width

        ?

        height / width

        :

        1;
}


/* =========================
   DRAW FACE
========================= */

function drawFace(
    landmarks
) {

    const video =
        $("faceVideo");


    const canvas =
        $("faceCanvas");


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


    canvas.width =
        width;

    canvas.height =
        height;


    const context =
        canvas.getContext("2d");


    context.clearRect(
        0,
        0,
        width,
        height
    );


    context.fillStyle =
        "#22c55e";


    [

        33,
        133,
        159,
        145,

        263,
        362,
        386,
        374,

        1,
        4,
        152,

        234,
        454

    ].forEach(index => {

        const point =
            landmarks[index];


        if (!point) {

            return;

        }


        context.beginPath();

        context.arc(

            point.x * width,

            point.y * height,

            3,

            0,

            Math.PI * 2
        );

        context.fill();

    });

}


/* =========================
   FACE UI
========================= */

function setFaceUI(
    kind,
    emoji,
    title,
    detail
) {

    if ($("faceDetected")) {

        $("faceDetected").textContent =
            kind;

    }


    if ($("faceEmoji")) {

        $("faceEmoji").textContent =
            emoji;

    }


    if ($("faceNeed")) {

        $("faceNeed").textContent =
            title;

    }


    if ($("faceDetail")) {

        $("faceDetail").textContent =
            detail;

    }
}


/* =========================
   CREATE FACE ALERT
========================= */

async function createFaceAlert(

    gesture,

    message,

    priority = "High",

    confidence = 90

) {

    const language =
        $("languageSelect")?.value ||
        "en";


    const payload = {

        patientId:
            $("patientId")?.value ||
            "P1001",

        patientName:
            "Demo Patient",

        room:
            $("room")?.value ||
            "204",

        bed:
            $("bed")?.value ||
            "1",

        gesture,

        message,

        language,

        priority,

        confidence
    };


    try {

        const alert =
            await api(

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
                            payload
                        )
                }
            );


        updateLocalAlert(
            alert
        );


        notifyAlert(
            alert
        );


        if (
            priority ===
            "Critical"
        ) {

            overlay(
                alert
            );

        }


        return alert;

    }
    catch (error) {

        console.error(
            "Face alert error:",
            error
        );


        toast(

            "Face/eye signal detected, but alert could not be saved."

        );

        return null;

    }
}


/* =========================
   BLINK COMMUNICATION
========================= */

function emitBlinkSignal() {

    const number =
        blinkCount;


    blinkCount =
        0;


    const text =
        ft();


    const now =
        Date.now();


    if (

        now -
        lastBlinkSignalAt

        <

        2500

    ) {

        return;

    }


    lastBlinkSignalAt =
        now;


    const language =
        $("languageSelect")?.value ||
        "en";


    if (
        number === 1
    ) {

        setFaceUI(

            "👁 1 BLINK",

            "👁️",

            text.blink1,

            "Patient blink communication detected."

        );


        speak(
            text.yes,
            language
        );

    }
    else if (
        number === 2
    ) {

        setFaceUI(

            "👁👁 2 BLINKS",

            "👁️",

            text.blink2,

            "Automatic help alert sent."

        );


        speak(
            text.help,
            language
        );


        createFaceAlert(

            "2 Eye Blinks",

            text.help,

            "High",

            92
        );

    }
    else if (
        number >= 3
    ) {

        setFaceUI(

            "👁👁👁 3 BLINKS",

            "🚨",

            text.blink3,

            "Automatic emergency alert sent."

        );


        speak(
            text.emergency,
            language
        );


        createFaceAlert(

            "3 Eye Blinks",

            text.emergency,

            "Critical",

            95
        );

    }
}


function registerBlink() {

    blinkCount++;


    clearTimeout(
        blinkWindowTimer
    );


    blinkWindowTimer =

        setTimeout(

            emitBlinkSignal,

            1100
        );
}


/* =========================
   HANDLE FACE RESULTS
========================= */

function handleFaceResults(results) {

    faceBusy =
        false;


    const landmarks =
        results.multiFaceLandmarks?.[0];


    const text =
        ft();


    if (!landmarks) {

        if ($("faceStatus")) {

            $("faceStatus").textContent =
                "Camera running — show patient face";

        }


        if ($("faceHint")) {

            $("faceHint")
                .classList
                .remove("hidden");

        }


        updateRuntime(

            "faceLiveStatus",

            "Face: NOT DETECTED"
        );


        return;

    }


    if ($("faceHint")) {

        $("faceHint")
            .classList
            .add("hidden");

    }


    if ($("faceStatus")) {

        $("faceStatus").textContent =
            "🙂 Face detected — eye and head signals active";

    }


    setFaceDiagnostic(

        "✓ Face detected. Eye and head landmarks are processing.",

        true
    );


    drawFace(
        landmarks
    );


    /* Eye measurements */

    const leftEye =

        (

            eyeRatio(
                landmarks,
                33,
                133,
                159,
                145
            )

            +

            eyeRatio(
                landmarks,
                33,
                133,
                158,
                153
            )

        )

        / 2;


    const rightEye =

        (

            eyeRatio(
                landmarks,
                263,
                362,
                386,
                374
            )

            +

            eyeRatio(
                landmarks,
                263,
                362,
                385,
                380
            )

        )

        / 2;


    const closed =

        leftEye < 0.20

        &&

        rightEye < 0.20;


    updateRuntime(

        "faceLiveStatus",

        `Face: DETECTED
         · Eyes: ${closed ? "CLOSED" : "OPEN"}
         · Blinks: ${blinkCount}`
    );


    if (
        closed &&
        !eyeClosed
    ) {

        eyeClosed =
            true;

    }


    if (
        !closed &&
        eyeClosed
    ) {

        eyeClosed =
            false;

        registerBlink();

    }


    /* HEAD POSITION */

    const x =

        (

            landmarks[1].x

            -

            landmarks[234].x

        )

        /

        Math.max(

            0.001,

            landmarks[454].x

            -

            landmarks[234].x
        );


    const y =

        (

            landmarks[1].y

            -

            landmarks[10].y

        )

        /

        Math.max(

            0.001,

            landmarks[152].y

            -

            landmarks[10].y
        );


    if (
        faceBaselineX === null
    ) {

        faceBaselineX =
            x;

        faceBaselineY =
            y;


        setFaceDiagnostic(

            "✓ Face baseline calibrated. Keep head centered, then move your head.",

            true
        );

    }


    const now =
        Date.now();


    if (

        now -
        lastHeadSignalAt

        >

        2500

    ) {

        const language =
            $("languageSelect")?.value ||
            "en";


        if (

            x -
            faceBaselineX

            >

            0.13

        ) {

            lastHeadSignalAt =
                now;


            setFaceUI(

                "HEAD RIGHT",

                "➡️",

                text.right,

                "Patient head movement detected."

            );


            speak(
                text.yes,
                language
            );

        }


        else if (

            x -
            faceBaselineX

            <

            -0.13

        ) {

            lastHeadSignalAt =
                now;


            setFaceUI(

                "HEAD LEFT",

                "⬅️",

                text.left,

                "Patient head movement detected."

            );

        }


        else if (

            y -
            faceBaselineY

            >

            0.13

        ) {

            lastHeadSignalAt =
                now;


            setFaceUI(

                "HEAD DOWN",

                "⬇️",

                text.down,

                "Automatic help alert sent."

            );


            speak(
                text.help,
                language
            );


            createFaceAlert(

                "Head Down",

                text.help,

                "High",

                88
            );

        }

    }


    if (

        blinkCount === 0

        &&

        now -
        lastHeadSignalAt

        >

        1000

    ) {

        setFaceUI(

            "🙂 FACE DETECTED",

            "🙂",

            text.normal,

            "Eye blink and head movement communication are active."

        );

    }
}


/* =========================
   FACE VIDEO LOOP
========================= */

async function faceLoop(now) {

    if (!faceRunning) {

        return;

    }


    faceFrame =
        requestAnimationFrame(
            faceLoop
        );


    const video =
        $("faceVideo");


    if (

        !faceMesh

        ||

        faceBusy

        ||

        !video

        ||

        video.readyState < 2

    ) {

        return;

    }


    if (

        now -
        faceLastTime

        <

        70

    ) {

        return;

    }


    faceLastTime =
        now;


    faceBusy =
        true;


    try {

        await faceMesh.send({

            image:
                video

        });

    }
    catch (error) {

        console.error(
            "Face AI frame error:",
            error
        );


        faceBusy =
            false;

    }
}


/* =========================
   START FACE CAMERA
========================= */

async function startFaceCamera() {

    try {

        if (faceRunning) {

            return;

        }


        /* Stop hand camera because
           one device camera should
           be used by one AI module */

        stopCamera();


        if ($("faceStatus")) {

            $("faceStatus").textContent =
                "Starting Face & Eye AI…";

        }


        setFaceDiagnostic(

            "Checking camera and Face AI library…"
        );


        if (
            !window.isSecureContext
        ) {

            throw new Error(

                "Camera requires HTTPS or localhost."
            );

        }


        if (
            !navigator.mediaDevices?.getUserMedia
        ) {

            throw new Error(
                "Camera API is unavailable."
            );

        }


        await ensureFaceMesh();


        const video =
            $("faceVideo");


        if (!video) {

            throw new Error(
                "Face camera video element was not found."
            );

        }


        faceMesh =
            new window.FaceMesh({

                locateFile:

                    file =>
                        faceBase +
                        file
            });


        faceMesh.setOptions({

            maxNumFaces:
                1,

            refineLandmarks:
                true,

            minDetectionConfidence:
                0.5,

            minTrackingConfidence:
                0.5
        });


        faceMesh.onResults(
            handleFaceResults
        );


        setFaceDiagnostic(
            "Requesting camera permission…"
        );


        try {

            faceStream =

                await navigator
                    .mediaDevices
                    .getUserMedia({

                        video: {

                            facingMode: {
                                ideal: "user"
                            },

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

        }
        catch (error) {

            faceStream =

                await navigator
                    .mediaDevices
                    .getUserMedia({

                        video:
                            true,

                        audio:
                            false
                    });

        }


        video.srcObject =
            faceStream;


        video.muted =
            true;


        video.playsInline =
            true;


        await video.play();


        faceRunning =
            true;


        faceBusy =
            false;


        faceBaselineX =
            null;


        faceBaselineY =
            null;


        blinkCount =
            0;


        eyeClosed =
            false;


        primeVoice();


        if ($("faceAiBadge")) {

            $("faceAiBadge").textContent =
                "AI RUNNING";


            $("faceAiBadge")
                .classList
                .add("running");

        }


        if ($("faceVoiceStatus")) {

            $("faceVoiceStatus").textContent =
                "🔊 Automatic multilingual voice is ready";

        }


        setFaceDiagnostic(

            "✓ Face camera connected. Face AI is running.",

            true
        );


        updateRuntime(

            "faceLiveStatus",

            "Face AI: RUNNING · Waiting for face…"
        );


        faceFrame =
            requestAnimationFrame(
                faceLoop
            );

    }
    catch (error) {

        console.error(
            "Face AI error:",
            error
        );


        stopFaceCamera();


        if ($("faceStatus")) {

            $("faceStatus").textContent =

                "Face & Eye AI error: "

                +

                (

                    error.message ||
                    "Could not start"
                );

        }


        setFaceDiagnostic(

            "⚠ "

            +

            (

                error.message ||
                "Could not start"
            )
        );


        toast(

            error.message ||
            "Face & Eye AI could not start"
        );

    }
}


/* =========================
   STOP FACE CAMERA
========================= */

function stopFaceCamera() {

    faceRunning =
        false;


    faceBusy =
        false;


    if (faceFrame) {

        cancelAnimationFrame(
            faceFrame
        );

        faceFrame =
            null;

    }


    if (faceStream) {

        faceStream
            .getTracks()
            .forEach(track =>
                track.stop()
            );


        faceStream =
            null;

    }


    const video =
        $("faceVideo");


    if (video) {

        video.srcObject =
            null;

    }


    if (faceMesh) {

        try {

            faceMesh.close?.();

        }
        catch (error) {}


        faceMesh =
            null;

    }


    faceBaselineX =
        null;


    faceBaselineY =
        null;


    blinkCount =
        0;


    eyeClosed =
        false;


    clearTimeout(
        blinkWindowTimer
    );


    if ($("faceAiBadge")) {

        $("faceAiBadge").textContent =
            "AI READY";


        $("faceAiBadge")
            .classList
            .remove("running");

    }


    if ($("faceStatus")) {

        $("faceStatus").textContent =
            "Face & Eye AI is off";

    }


    updateRuntime(

        "faceLiveStatus",

        "Face AI: OFF"
    );


    setFaceUI(

        ft().waiting,

        "🙂",

        ft().ready,

        "Face presence, eye blinks and head movement will be detected automatically."

    );
}


/* =========================
   MEDICAL REPORT
========================= */

async function report(event) {

    event.preventDefault();


    const form =
        $("reportForm");


    if (!form) {

        return;

    }


    try {

        const formData =
            new FormData(form);


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


        let data = {};


        try {

            data =
                await response.json();

        }
        catch (error) {}


        if (!response.ok) {

            throw new Error(

                data.error ||

                "Report upload failed"
            );

        }


        form.reset();


        toast(
            "Report uploaded successfully"
        );


        refresh();

    }
    catch (error) {

        console.error(error);

        toast(
            "Report upload failed: " +
            error.message
        );

    }
}


/* =========================
   APPOINTMENT
========================= */

async function appointment(event) {

    event.preventDefault();


    const form =
        $("appointmentForm");


    if (!form) {

        return;

    }


    const formData =
        new FormData(form);


    const payload =
        Object.fromEntries(
            formData.entries()
        );


    try {

        const appointmentData =

            await api(

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
                            payload
                        )
                }
            );


        if (
            appointmentData
        ) {

            toast(
                "Appointment created successfully"
            );

        }


        form.reset();


        refresh();

    }
    catch (error) {

        console.error(error);

        toast(

            "Appointment failed: " +

            error.message
        );

    }
}


/* =========================
   MOBILE PANEL
========================= */

function updateMobilePanel() {

    const element =
        $("mobileServerUrl");


    if (element) {

        element.textContent =
            location.origin;

    }
}


/* =========================================================
   APPLICATION INITIALIZATION
========================================================= */

document.addEventListener(

    "DOMContentLoaded",

    () => {


        /* Navigation */

        document
            .querySelectorAll(".nav")
            .forEach(button => {

                button.onclick =
                    () =>

                        page(
                            button.dataset.page
                        );

            });


        /* Main buttons */

        if ($("openGestureBtn")) {

            $("openGestureBtn").onclick =
                () =>
                    page("gesture");

        }


        if ($("viewAlertsBtn")) {

            $("viewAlertsBtn").onclick =
                () =>
                    page("alerts");

        }


        if ($("openMobileBtn")) {

            $("openMobileBtn").onclick =
                () =>
                    page("mobile");

        }


        if ($("notifyBtn")) {

            $("notifyBtn").onclick =
                notifyEnable;

        }


        /* Language */

        if ($("languageSelect")) {

            $("languageSelect").onchange =
                () => {

                    updateGuide();

                    primeVoice();

                };

        }


        /* Alert filters */

        document
            .querySelectorAll(".filter")
            .forEach(button => {

                button.onclick =
                    () => {

                        filter =
                            button.dataset.filter;


                        document
                            .querySelectorAll(".filter")
                            .forEach(element =>

                                element
                                    .classList
                                    .remove("active")
                            );


                        button
                            .classList
                            .add("active");


                        render();

                    };

            });


        /* Alert actions */

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


                act(

                    button.dataset.id,

                    button.dataset.action

                );

            }

        );


        /* Hand Camera */

        if ($("cameraBtn")) {

            $("cameraBtn").onclick =
                startCamera;

        }


        if ($("stopCameraBtn")) {

            $("stopCameraBtn").onclick =
                stopCamera;

        }


        /* Face Camera */

        if ($("faceCameraBtn")) {

            $("faceCameraBtn").onclick =
                startFaceCamera;

        }


        if ($("stopFaceCameraBtn")) {

            $("stopFaceCameraBtn").onclick =
                stopFaceCamera;

        }


        /* Voice */

        if ($("voiceBtn")) {

            $("voiceBtn").onclick =
                primeVoice;

        }


        /* Diagnostics */

        if ($("runDiagnosticsBtn")) {

            $("runDiagnosticsBtn").onclick =
                runFullDiagnostics;

        }


        /* Test Voice */

        if ($("testVoiceBtn")) {

            $("testVoiceBtn").onclick =
                () => {

                    const language =
                        $("languageSelect")?.value ||
                        "en";


                    const text =
                        labels[language] ||
                        labels.en;


                    speak(
                        text.helpVoice,
                        language
                    );

                };

        }


        /* Test Alert */

        if ($("testAlertBtn")) {

            $("testAlertBtn").onclick =
                sendTestAlert;

        }


        /* Copy Mobile URL */

        if ($("copyMobileUrl")) {

            $("copyMobileUrl").onclick =
                async () => {

                    try {

                        await navigator
                            .clipboard
                            .writeText(
                                location.origin
                            );


                        toast(
                            "Server URL copied"
                        );

                    }
                    catch (error) {

                        toast(
                            "Copy failed. Use the URL shown above."
                        );

                    }

                };

        }


        /* Report */

        if ($("reportForm")) {

            $("reportForm").onsubmit =
                report;

        }


        /* Appointment */

        if ($("appointmentForm")) {

            $("appointmentForm").onsubmit =
                appointment;

        }


        /* Alert overlay close */

        if ($("closeAlertOverlay")) {

            $("closeAlertOverlay").onclick =
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    closeAlertOverlay();

                };

        }


        if ($("alertOverlay")) {

            $("alertOverlay")
                .addEventListener(

                    "click",

                    event => {

                        if (

                            event.target ===
                            $("alertOverlay")

                        ) {

                            closeAlertOverlay();

                        }

                    }

                );

        }


        /* Overlay voice */

        if ($("overlayVoiceBtn")) {

            $("overlayVoiceBtn").onclick =
                () => {

                    if (!activeAlert) {

                        return;

                    }


                    speak(

                        `${activeAlert.message}.
                        Room ${activeAlert.room}.
                        Bed ${activeAlert.bed}.`,

                        activeAlert.language

                    );

                };

        }


        /* Overlay acknowledge */

        if ($("overlayAckBtn")) {

            $("overlayAckBtn").onclick =
                async () => {

                    if (!activeAlert) {

                        return;

                    }


                    const alert =
                        activeAlert;


                    closeAlertOverlay();


                    if (
                        alert.id
                    ) {

                        await act(

                            alert.id,

                            "acknowledge"

                        );

                    }

                };

        }


        /* Overlay resolve */

        if ($("overlayResolveBtn")) {

            $("overlayResolveBtn").onclick =
                async () => {

                    if (!activeAlert) {

                        return;

                    }


                    const alert =
                        activeAlert;


                    closeAlertOverlay();


                    if (
                        alert.id
                    ) {

                        await act(

                            alert.id,

                            "resolve"

                        );

                    }

                };

        }


        /* Start application */

        updateGuide();


        refresh();


        setInterval(

            refresh,

            5000

        );


        /* Clean up camera */

        window.addEventListener(

            "beforeunload",

            () => {

                stopCamera();

                stopFaceCamera();

            }

        );

    }

);
