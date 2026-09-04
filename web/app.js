const socket = io();
const alertsEl = document.getElementById("alerts");
const connectionEl = document.getElementById("connection");
const criticalBanner = document.getElementById("criticalBanner");

const langMap = { en: "en-IN", kn: "kn-IN", hi: "hi-IN" };

socket.on("connect", () => {
  connectionEl.textContent = "● Live";
  connectionEl.className = "online";
});

socket.on("disconnect", () => {
  connectionEl.textContent = "● Offline";
  connectionEl.className = "offline";
});

socket.on("initial-alerts", renderAll);
socket.on("patient-alert", alert => {
  renderAll([alert, ...currentAlerts()]);
  speakAlert(alert);
  if (alert.severity === "critical") showCritical();
});
socket.on("alert-updated", updated => {
  const all = currentAlerts().map(a => a.id === updated.id ? updated : a);
  renderAll(all);
});

function currentAlerts() {
  return [...document.querySelectorAll(".alert-card")].map(card => JSON.parse(card.dataset.alert));
}

function renderAll(alerts) {
  alertsEl.innerHTML = "";
  alerts.slice(0, 50).forEach(addAlertCard);
}

function addAlertCard(alert) {
  const card = document.createElement("article");
  card.className = `alert-card ${alert.severity}`;
  card.dataset.alert = JSON.stringify(alert);

  card.innerHTML = `
    <div class="alert-title">
      <span>🚨 PATIENT ALERT</span>
      <strong>${escapeHtml(alert.status)}</strong>
    </div>
    <div class="request">${escapeHtml(alert.request)}</div>
    <div class="patient-grid">
      <div><small>Patient</small><b>${escapeHtml(alert.patientName)}</b></div>
      <div><small>ID</small><b>${escapeHtml(alert.patientId)}</b></div>
      <div><small>Room</small><b>${escapeHtml(alert.room)}</b></div>
      <div><small>Bed</small><b>${escapeHtml(alert.bed)}</b></div>
    </div>
    <div class="actions">
      <button onclick="speakById('${alert.id}')">🔊 Play Voice</button>
      <button onclick="setStatus('${alert.id}','ACKNOWLEDGED')">Acknowledge</button>
      <button onclick="setStatus('${alert.id}','RESOLVED')">Resolve</button>
      <button onclick="setStatus('${alert.id}','ESCALATED')">Escalate</button>
    </div>
  `;
  alertsEl.appendChild(card);
}

function speakById(id) {
  const alert = currentAlerts().find(a => a.id === id);
  if (alert) speakAlert(alert);
}

function speakAlert(alert) {
  if (!("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const text = `Patient alert. ${alert.patientName}. Room ${alert.room}. Bed ${alert.bed}. Request: ${alert.request}.`;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = langMap[alert.language] || "en-IN";
  utterance.rate = 0.9;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

async function setStatus(id, status) {
  await fetch(`/api/alerts/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
}

document.getElementById("sendTest").onclick = async () => {
  const body = {
    patientId: patientId.value,
    patientName: patientName.value,
    room: room.value,
    bed: bed.value,
    request: request.value,
    language: language.value,
    severity: severity.value
  };

  await fetch("/api/alerts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
};

function showCritical() {
  criticalBanner.classList.remove("hidden");
  setTimeout(() => criticalBanner.classList.add("hidden"), 10000);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

// Fallback refresh so alerts still appear if a socket reconnect is delayed.
setInterval(async () => {
  try {
    const res = await fetch("/api/alerts");
    const data = await res.json();
    renderAll(data);
  } catch (_) {}
}, 5000);
