let state = {users:[], alerts:[], reports:[], appointments:[]};
let currentFilter = "all";
let camera = null;
let stream = null;
let hands = null;

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

const langNames = {en:"English",kn:"Kannada",hi:"Hindi"};
const voiceLangs = {en:"en-IN",kn:"kn-IN",hi:"hi-IN"};

document.addEventListener("DOMContentLoaded", async () => {
  document.querySelectorAll(".nav").forEach(b => b.onclick = () => showPage(b.dataset.page));
  document.getElementById("roleSelect").onchange = updateRole;
  document.getElementById("languageSelect").onchange = () => { renderAll(); showToast("Language changed to " + langNames[getLang()]); };
  document.querySelectorAll(".gesture-btn").forEach(b => b.onclick = () => createAlert(b.dataset.gesture, 0.96));
  document.querySelectorAll(".filter").forEach(b => b.onclick = () => {
    document.querySelectorAll(".filter").forEach(x => x.classList.remove("active"));
    b.classList.add("active"); currentFilter = b.dataset.filter; renderAlerts();
  });
  document.getElementById("notifyBtn").onclick = enableNotifications;
  document.getElementById("cameraBtn").onclick = startCamera;
  document.getElementById("stopCameraBtn").onclick = stopCamera;
  document.getElementById("reportForm").onsubmit = uploadReport;
  document.getElementById("appointmentForm").onsubmit = addAppointment;
  await refresh();
  initHands();
});

function getLang(){ return document.getElementById("languageSelect").value; }
function showPage(id){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===id));
  const titles={dashboard:"Nurse Dashboard",gesture:"Gesture Communication",alerts:"Alert Center",patient:"Patient Care",reports:"Medical Reports",appointments:"Appointments",analytics:"Analytics"};
  document.getElementById("pageTitle").textContent=titles[id] || "CareGesture AI";
  renderAll();
}
function updateRole(){
  const role=document.getElementById("roleSelect").value;
  const names={patient:"Patient Portal",nurse:"Nurse Dashboard",doctor:"Doctor Dashboard",admin:"Admin Dashboard"};
  document.getElementById("roleLabel").textContent=role[0].toUpperCase()+role.slice(1);
  document.getElementById("pageTitle").textContent=names[role];
  showToast("Viewing " + names[role]);
}
async function refresh(){
  try{
    const r=await fetch("/api/state"); state=await r.json(); renderAll();
  }catch(e){showToast("Server connection error");}
}
function renderAll(){renderDashboard();renderAlerts();renderReports();renderAppointments();renderAnalytics();}
function renderDashboard(){
  const active=state.alerts.filter(a=>!["Resolved"].includes(a.status));
  const critical=state.alerts.filter(a=>a.priority==="Critical" && a.status!=="Resolved");
  document.getElementById("activeCount").textContent=active.length;
  document.getElementById("criticalCount").textContent=critical.length;
  const conf=state.alerts.filter(a=>a.confidence>0);
  document.getElementById("confidenceStat").textContent=conf.length ? Math.round(conf.reduce((s,a)=>s+a.confidence,0)/conf.length*100)+"%" : "—";
  const today=new Date().toDateString();
  document.getElementById("todayCount").textContent=state.alerts.filter(a=>new Date(a.createdAt).toDateString()===today).length;
  const recent=state.alerts.slice(0,5);
  document.getElementById("recentAlerts").innerHTML=recent.length ? recent.map(alertHTML).join("") : '<p class="hint">No alerts yet. Open Gesture Communication to create a demo alert.</p>';
}
function alertHTML(a,actions=true){
  const cls=a.status==="Resolved"?"resolved":a.priority==="Critical"?"critical":a.priority==="High"?"high":"";
  return `<div class="alert ${cls}">
    <div class="alert-top"><div class="alert-main"><div class="alert-icon">${iconFor(a.gesture)}</div><div><h4>${escapeHTML(a.message)}</h4><p>${escapeHTML(a.patientName)} · Room ${escapeHTML(a.room)} · Bed ${escapeHTML(a.bed)}</p></div></div><span class="badge">${escapeHTML(a.status)}</span></div>
    <p style="margin-top:9px">Gesture: ${escapeHTML(a.gesture)} · Confidence: ${a.confidence ? Math.round(a.confidence*100)+"%" : "Manual"} · ${new Date(a.createdAt).toLocaleString()}</p>
    ${actions ? `<div class="alert-actions">${a.status==="New"?`<button class="outline mini" onclick="alertAction('${a.id}','acknowledge')">✓ Acknowledge</button>`:""}${a.status!=="Resolved"?`<button class="outline mini" onclick="alertAction('${a.id}','resolve')">Resolve</button>`:""}${a.status!=="Resolved"&&a.priority!=="Critical"?`<button class="outline mini" onclick="alertAction('${a.id}','escalate')">🚨 Escalate</button>`:""}</div>`:""}
  </div>`;
}
function renderAlerts(){
  let arr=state.alerts;
  if(currentFilter==="New")arr=arr.filter(a=>a.status==="New");
  if(currentFilter==="Critical")arr=arr.filter(a=>a.priority==="Critical");
  if(currentFilter==="Acknowledged")arr=arr.filter(a=>a.status==="Acknowledged");
  if(currentFilter==="Resolved")arr=arr.filter(a=>a.status==="Resolved");
  document.getElementById("alertList").innerHTML=arr.length?arr.map(a=>alertHTML(a,true)).join(""):'<p class="hint">No alerts in this filter.</p>';
}
async function alertAction(id,action){
  const r=await fetch("/api/alerts/"+id,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action})});
  if(!r.ok){showToast("Could not update alert");return}
  const a=await r.json();
  if(action==="acknowledge") speak(translations[getLang()].ack);
  if(action==="escalate") notifyUser("🚨 "+a.message);
  showToast("Alert "+action+"d");
  await refresh();
}
async function createAlert(type,confidence){
  const lang=getLang(), t=translations[lang], patientId=document.getElementById("patientId").value||"P1001";
  const room=document.getElementById("room").value||"204", bed=document.getElementById("bed").value||"3";
  const patient=state.users.find(u=>u.id===patientId);
  const key=type==="water"?"water":type==="food"?"food":type==="nurse"?"nurse":type==="help"?"help":type==="stop"?"stop":"emergency";
  const priority=type==="emergency"?"Critical":type==="help"||type==="nurse"?"High":"Normal";
  const body={patientId,patientName:patient?.name||"Demo Patient",room,bed,gesture:type,message:t[key],language:lang,priority,confidence};
  const r=await fetch("/api/alerts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(!r.ok){showToast("Failed to create alert");return}
  const a=await r.json();
  document.getElementById("detectedBadge").textContent=type.toUpperCase()+" · "+Math.round(confidence*100)+"%";
  speak(voiceText(type,room,bed,lang));
  notifyUser((type==="emergency"?"🚨 ":"✋ ")+a.message);
  showToast("Alert sent to care team");
  await refresh();
}
function voiceText(type,room,bed,lang){
  const key=type==="water"?"voiceWater":type==="food"?"voiceFood":type==="nurse"?"voiceNurse":type==="help"?"voiceHelp":type==="stop"?"voiceStop":"voiceEmergency";
  return translations[lang][key].replace("{room}",room).replace("{bed}",bed);
}
function speak(text){
  if(!("speechSynthesis" in window))return;
  window.speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text);u.lang=voiceLangs[getLang()];u.rate=.92;
  window.speechSynthesis.speak(u);
}
async function enableNotifications(){
  if(!("Notification" in window)){showToast("Browser notifications are not supported.");return}
  const p=await Notification.requestPermission();
  showToast(p==="granted"?"Notifications enabled":"Notification permission not granted");
}
function notifyUser(text){
  if("Notification" in window && Notification.permission==="granted") new Notification("CareGesture AI",{body:text});
}
function initHands(){
  if(typeof Hands==="undefined") return;
  hands=new Hands({locateFile:file=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`});
  hands.setOptions({maxNumHands:1,modelComplexity:1,minDetectionConfidence:.6,minTrackingConfidence:.6});
  hands.onResults(results=>{
    const c=document.getElementById("outputCanvas"),v=document.getElementById("inputVideo"),ctx=c.getContext("2d");
    c.width=v.videoWidth;c.height=v.videoHeight;ctx.clearRect(0,0,c.width,c.height);
    if(results.multiHandLandmarks?.length){
      drawConnectors(ctx,results.multiHandLandmarks[0],HAND_CONNECTIONS,{color:"#62a0ff",lineWidth:3});
      drawLandmarks(ctx,results.multiHandLandmarks[0],{color:"#fff",lineWidth:1});
      const g=classifyGesture(results.multiHandLandmarks[0]);
      if(g) {document.getElementById("detectedBadge").textContent=g.toUpperCase()+" · AI detected"; }
    }
  });
}
function classifyGesture(l){
  // Lightweight demonstration classifier based on landmark geometry.
  // For production, train/validate a dedicated gesture classifier with clinical usability testing.
  const tips=[8,12,16,20],pips=[6,10,14,18];
  const extended=tips.map((t,i)=>l[t].y < l[pips[i]].y);
  const count=extended.filter(Boolean).length;
  if(count===4)return "help";
  if(extended[0]&&extended[1]&&!extended[2]&&!extended[3])return "food";
  if(extended[0]&&!extended[1]&&!extended[2]&&!extended[3])return "water";
  return null;
}
async function startCamera(){
  try{
    stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user"},audio:false});
    const v=document.getElementById("inputVideo");v.srcObject=stream;document.getElementById("cameraStatus").textContent="Camera active · processing locally";
    camera=new Camera(v,{onFrame:async()=>{if(hands)await hands.send({image:v})},width:640,height:400});camera.start();
  }catch(e){showToast("Camera permission was denied or unavailable.");}
}
function stopCamera(){
  if(camera)camera.stop();camera=null;
  if(stream)stream.getTracks().forEach(t=>t.stop());stream=null;
  document.getElementById("cameraStatus").textContent="Camera is off";
  const c=document.getElementById("outputCanvas");c.getContext("2d").clearRect(0,0,c.width,c.height);
}
async function uploadReport(e){
  e.preventDefault();const form=new FormData(e.target);
  const r=await fetch("/api/reports",{method:"POST",body:form});const data=await r.json();
  if(!r.ok){showToast(data.error||"Upload failed");return}
  e.target.reset();showToast("Report uploaded");await refresh();
}
function renderReports(){
  document.getElementById("reportList").innerHTML=state.reports.length?state.reports.map(r=>`<div class="table-row"><span><b>${escapeHTML(r.originalName)}</b><small>${escapeHTML(r.patientId)}</small></span><span>${escapeHTML(r.type)}</span><span>${new Date(r.uploadedAt).toLocaleString()}</span><span>Intake complete</span></div>`).join(""):'<p class="hint">No reports uploaded.</p>';
}
async function addAppointment(e){
  e.preventDefault();const body=Object.fromEntries(new FormData(e.target));
  const r=await fetch("/api/appointments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(!r.ok){showToast("Could not schedule appointment");return}
  e.target.reset();showToast("Appointment scheduled");await refresh();
}
function renderAppointments(){
  document.getElementById("appointmentList").innerHTML=state.appointments.length?state.appointments.map(a=>`<div class="table-row"><span><b>${escapeHTML(a.patientId)}</b></span><span>${escapeHTML(a.doctor)}</span><span>${escapeHTML(a.date)} ${escapeHTML(a.time)}</span><span>${escapeHTML(a.status)}</span></div>`).join(""):'<p class="hint">No appointments.</p>';
}
function renderAnalytics(){
  document.getElementById("aTotal").textContent=state.alerts.length;
  document.getElementById("aResolved").textContent=state.alerts.filter(a=>a.status==="Resolved").length;
  document.getElementById("aEscalated").textContent=state.alerts.filter(a=>a.status==="Escalated").length;
  document.getElementById("aAppointments").textContent=state.appointments.length;
  const counts={};state.alerts.forEach(a=>counts[a.gesture]=(counts[a.gesture]||0)+1);
  const max=Math.max(1,...Object.values(counts));
  document.getElementById("gestureBars").innerHTML=Object.keys(counts).length?Object.entries(counts).map(([k,v])=>`<div class="bar"><div style="display:flex;justify-content:space-between;font-size:12px"><span>${escapeHTML(k)}</span><b>${v}</b></div><div class="bar-line"><div class="bar-fill" style="width:${v/max*100}%"></div></div></div>`).join(""):'<p class="hint">Create gesture alerts to see analytics.</p>';
}
function iconFor(g){return {water:"💧",food:"🍲",nurse:"🧑‍⚕️",help:"🤚",stop:"✋",emergency:"🚨"}[g]||"🔔";}
function escapeHTML(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
let toastTimer;function showToast(t){const x=document.getElementById("toast");x.textContent=t;x.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>x.classList.remove("show"),2500);}
