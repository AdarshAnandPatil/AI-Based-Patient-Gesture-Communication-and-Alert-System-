let state={alerts:[],reports:[],appointments:[]},filter="all",activeAlert=null,camera=null;
const $=id=>document.getElementById(id);

const langs={en:"en-IN",kn:"kn-IN",hi:"hi-IN"};
const labels={
 en:{food:"PATIENT NEEDS FOOD",water:"PATIENT NEEDS WATER",toilet:"PATIENT NEEDS TOILET",emergency:"EMERGENCY — DOCTOR / NURSE NEEDED",ok:"ALL OK",detect:"FINGERS DETECTED",waiting:"Waiting for hand gesture…",detail:"AI is watching the hand landmarks automatically.",voiceReady:"🔊 Automatic voice is ready",voice:"Patient needs food.",waterVoice:"Patient needs water.",toiletVoice:"Patient needs toilet.",emergencyVoice:"Emergency. Doctor or nurse is needed.",okVoice:"Patient is all okay."},
 kn:{food:"ರೋಗಿಗೆ ಆಹಾರ ಬೇಕಾಗಿದೆ",water:"ರೋಗಿಗೆ ನೀರು ಬೇಕಾಗಿದೆ",toilet:"ರೋಗಿಗೆ ಶೌಚಾಲಯಕ್ಕೆ ಹೋಗಬೇಕು",emergency:"ತುರ್ತು — ವೈದ್ಯರು / ನರ್ಸ್ ಬೇಕು",ok:"ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ",detect:"ಬೆರಳುಗಳು ಪತ್ತೆಯಾಗಿವೆ",waiting:"ಕೈ ಸನ್ನೆಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ…",detail:"AI ಕೈಯ ಲ್ಯಾಂಡ್‌ಮಾರ್ಕ್‌ಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಗಮನಿಸುತ್ತಿದೆ.",voiceReady:"🔊 ಸ್ವಯಂಚಾಲಿತ ಧ್ವನಿ ಸಿದ್ಧವಾಗಿದೆ",voice:"ರೋಗಿಗೆ ಆಹಾರ ಬೇಕಾಗಿದೆ.",waterVoice:"ರೋಗಿಗೆ ನೀರು ಬೇಕಾಗಿದೆ.",toiletVoice:"ರೋಗಿಗೆ ಶೌಚಾಲಯಕ್ಕೆ ಹೋಗಬೇಕು.",emergencyVoice:"ತುರ್ತು ಪರಿಸ್ಥಿತಿ. ವೈದ್ಯರು ಅಥವಾ ನರ್ಸ್ ಬೇಕು.",okVoice:"ರೋಗಿ ಸಂಪೂರ್ಣವಾಗಿ ಸರಿಯಾಗಿದ್ದಾರೆ."},
 hi:{food:"मरीज को खाना चाहिए",water:"मरीज को पानी चाहिए",toilet:"मरीज को शौचालय जाना है",emergency:"आपातकाल — डॉक्टर / नर्स की जरूरत है",ok:"सब ठीक है",detect:"उंगलियां पहचानी गईं",waiting:"हाथ के इशारे का इंतजार…",detail:"AI हाथ के लैंडमार्क को अपने आप पहचान रहा है।",voiceReady:"🔊 स्वचालित आवाज तैयार है",voice:"मरीज को खाना चाहिए।",waterVoice:"मरीज को पानी चाहिए।",toiletVoice:"मरीज को शौचालय जाना है।",emergencyVoice:"आपातकाल। डॉक्टर या नर्स की जरूरत है।",okVoice:"मरीज बिल्कुल ठीक है।"}
};
const guideText={
 en:{food:"Food",foodSub:"Patient needs food",water:"Water",waterSub:"Patient needs water",toilet:"Toilet",toiletSub:"Patient needs toilet",emergency:"Doctor / Nurse Needed",emergencySub:"Emergency assistance",ok:"All OK",okSub:"Everything is okay"},
 kn:{food:"ಆಹಾರ",foodSub:"ರೋಗಿಗೆ ಆಹಾರ ಬೇಕಾಗಿದೆ",water:"ನೀರು",waterSub:"ರೋಗಿಗೆ ನೀರು ಬೇಕಾಗಿದೆ",toilet:"ಶೌಚಾಲಯ",toiletSub:"ರೋಗಿಗೆ ಶೌಚಾಲಯ ಬೇಕಾಗಿದೆ",emergency:"ವೈದ್ಯರು / ನರ್ಸ್ ಬೇಕು",emergencySub:"ತುರ್ತು ಸಹಾಯ",ok:"ಎಲ್ಲವೂ ಸರಿ",okSub:"ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ"},
 hi:{food:"खाना",foodSub:"मरीज को खाना चाहिए",water:"पानी",waterSub:"मरीज को पानी चाहिए",toilet:"शौचालय",toiletSub:"मरीज को शौचालय जाना है",emergency:"डॉक्टर / नर्स चाहिए",emergencySub:"आपातकालीन सहायता",ok:"सब ठीक",okSub:"सब कुछ ठीक है"}
};

const gestureMap={
 1:{key:"food",name:"1 Finger",emoji:"☝️",priority:"Normal"},
 2:{key:"water",name:"2 Fingers",emoji:"✌️",priority:"Normal"},
 3:{key:"food",name:"3 Fingers",emoji:"🤟",priority:"Normal"},
 4:{key:"toilet",name:"4 Fingers",emoji:"🖖",priority:"High"},
 5:{key:"emergency",name:"5 Fingers",emoji:"🖐️",priority:"Critical"},
 0:{key:"ok",name:"0 Fingers",emoji:"✊",priority:"Normal"}
};

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2400)}
function page(p){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));$(p).classList.add("active");document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===p));$("pageTitle").textContent={dashboard:"Nurse Dashboard",gesture:"Gesture Communication",alerts:"Alert Center",patient:"Patient Care",reports:"Medical Reports",appointments:"Appointments",analytics:"Analytics"}[p]}
async function api(u,o={}){const r=await fetch(u,{cache:"no-store",...o});let d={};try{d=await r.json()}catch{}if(!r.ok)throw Error(d.error||"Request failed");return d}
async function refresh(){try{state=await api("/api/state");render()}catch(e){toast("Server connection error")}}
function render(){
 const a=state.alerts||[],active=a.filter(x=>x.status!=="Resolved"),conf=a.map(x=>+x.confidence).filter(Number.isFinite);
 $("activeCount").textContent=active.length;$("criticalCount").textContent=a.filter(x=>x.priority==="Critical"&&x.status!=="Resolved").length;
 $("confidenceStat").textContent=conf.length?Math.round(conf.reduce((x,y)=>x+y,0)/conf.length)+"%":"—";
 $("todayCount").textContent=a.filter(x=>x.createdAt?.slice(0,10)===new Date().toISOString().slice(0,10)).length;
 $("recentAlerts").innerHTML=a.slice(0,5).map(card).join("")||"<p>No alerts yet.</p>";
 let f=filter==="all"?a:filter==="Critical"?a.filter(x=>x.priority==="Critical"):a.filter(x=>x.status===filter);
 $("alertList").innerHTML=f.map(card).join("")||"<p>No alerts in this filter.</p>";
 $("reportList").innerHTML=(state.reports||[]).map(x=>`<div class="alert-card"><b>${esc(x.originalName)}</b><div class="alert-meta">${esc(x.patientId)} · ${new Date(x.uploadedAt).toLocaleString()}</div></div>`).join("")||"<p>No reports.</p>";
 $("appointmentList").innerHTML=(state.appointments||[]).map(x=>`<div class="alert-card"><b>${esc(x.date)} ${esc(x.time)}</b><div class="alert-meta">${esc(x.doctor)} · ${esc(x.status)}</div></div>`).join("");
 $("aTotal").textContent=a.length;$("aResolved").textContent=a.filter(x=>x.status==="Resolved").length;$("aEscalated").textContent=a.filter(x=>x.status==="Escalated").length;$("aAppointments").textContent=(state.appointments||[]).length;
 let g={};a.forEach(x=>g[x.gesture]=(g[x.gesture]||0)+1);$("gestureBars").innerHTML=Object.entries(g).map(([k,v])=>`<div class="alert-card"><b>${esc(k)}</b> — ${v}</div>`).join("")||"<p>No gesture data.</p>";
}
function card(a){return `<div class="alert-card ${a.priority==="Critical"?"critical":""}"><b>${esc(a.priority)} · ${esc(a.status)}</b><div class="alert-message">${esc(a.message)}</div><div class="alert-meta">Patient ${esc(a.patientId)} · Room ${esc(a.room)} · Bed ${esc(a.bed)} · ${esc(a.confidence)}%</div><div class="alert-actions"><button class="primary act" data-id="${esc(a.id)}" data-action="voice" type="button">🔊 Voice</button><button class="outline act" data-id="${esc(a.id)}" data-action="acknowledge" type="button">Acknowledge</button><button class="outline act" data-id="${esc(a.id)}" data-action="resolve" type="button">Resolve</button><button class="outline act" data-id="${esc(a.id)}" data-action="escalate" type="button">Escalate</button></div></div>`}

async function act(id,a){const x=(state.alerts||[]).find(z=>String(z.id)===String(id));if(a==="voice")return x&&overlay(x);try{await api("/api/alerts/"+encodeURIComponent(id),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:a})});toast(a==="acknowledge"?"Alert acknowledged":a==="resolve"?"Alert resolved":"Alert escalated");refresh()}catch(e){toast(e.message)}}
async function notifyEnable(){if(!("Notification"in window))return toast("Notifications not supported");const p=await Notification.requestPermission();toast(p==="granted"?"Notifications enabled":"Permission not granted")}
async function report(e){e.preventDefault();try{await api("/api/reports",{method:"POST",body:new FormData(e.target)});toast("Report uploaded");e.target.reset();refresh()}catch(x){toast(x.message)}}
async function appointment(e){e.preventDefault();try{await api("/api/appointments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.fromEntries(new FormData(e.target).entries()))});toast("Appointment scheduled");e.target.reset();refresh()}catch(x){toast(x.message)}}
function getSelectedLang(){return langs[$("languageSelect").value]||"en-IN"}
function loadVoices(){return window.speechSynthesis?.getVoices?.()||[]}
if("speechSynthesis" in window){loadVoices();speechSynthesis.addEventListener?.("voiceschanged",loadVoices)}
function findVoice(lang){
 const wanted=lang.toLowerCase(),base=wanted.split("-")[0],voices=loadVoices();
 return voices.find(v=>v.lang?.toLowerCase()===wanted)||voices.find(v=>v.lang?.toLowerCase().startsWith(base+"-"))||voices.find(v=>v.lang?.toLowerCase()===base)||null;
}
let speechTimer=null;
function speak(textToSay,l){
 if(!textToSay||!(window.speechSynthesis&&window.SpeechSynthesisUtterance)){toast("Voice is not supported on this browser");return false}
 const lang=langs[l||$("languageSelect").value]||"en-IN";
 const u=new SpeechSynthesisUtterance(textToSay);u.lang=lang;u.rate=.95;u.pitch=1;u.volume=1;
 const voice=findVoice(lang);if(voice)u.voice=voice;
 const status=$("voiceStatus");if(status)status.textContent=voice?"🔊 Speaking":"🔊 Speaking with device voice";
 u.onend=()=>{if(status)status.textContent="✓ Voice completed"};
 u.onerror=e=>{if(status)status.textContent="⚠️ Voice error";console.warn("Speech error",e.error,lang)};
 // Never let TTS block gesture recognition. Replace only the previous utterance.
 if(speechTimer)clearTimeout(speechTimer);
 try{speechSynthesis.cancel()}catch{}
 speechTimer=setTimeout(()=>{try{speechSynthesis.speak(u)}catch(e){console.warn("Speech start error",e)}},0);
 return true;
}
function overlay(a){
 activeAlert=a;$('overlayMessage').textContent=a.message;$('overlayMeta').textContent=`Room ${a.room} · Bed ${a.bed}`;
 $('overlayPatient').textContent=`Patient ${a.patientId} · ${a.patientName||"Patient"}`;
 $('overlayPriority').textContent=a.priority==="Critical"?"🚨 CRITICAL PATIENT ALERT":"🚨 PATIENT ALERT";$('alertOverlay').classList.add('show');
}
async function createGestureAlert(number){
 const g=gestureMap[number];if(!g)return;
 const l=$("languageSelect").value,tx=labels[l]||labels.en,message=tx[g.key];
 try{
  const a=await api("/api/alerts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({patientId:$("patientId").value,patientName:"Demo Patient",room:$("room").value,bed:$("bed").value,gesture:g.name,message,language:l,priority:g.priority,confidence:95})});
  notifyAlert(a);refresh();
  // Only emergency opens the blocking modal; normal gestures stay on the live camera.
  if(g.key==="emergency")overlay(a);
 }catch(e){console.warn("Alert send failed",e);toast("Gesture detected, but alert could not be saved")}
}
function notifyAlert(a){if("Notification"in window&&Notification.permission==="granted")new Notification(a.priority==="Critical"?"🚨 Patient Emergency":"Patient Gesture Alert",{body:a.message})}
function showDetection(number,sent=false){
 const g=gestureMap[number],l=$("languageSelect").value,tx=labels[l]||labels.en;if(!g)return;
 $("detectedGesture").textContent=`${g.emoji} ${g.name} ${tx.detect}`;$("detectedEmoji").textContent=g.emoji;$("detectedNeed").textContent=tx[g.key];
 $("detectedDetail").textContent=(g.key==="ok")?tx.detail:`${tx.detail}${sent?" ✓ Alert sent automatically.":""}`;
 $("voiceStatus").textContent=tx.voiceReady;$('detectionPanel').classList.toggle('emergency-detection',g.key==='emergency');
}
function speakDetected(number){
 const g=gestureMap[number],l=$("languageSelect").value,tx=labels[l]||labels.en;if(!g)return;
 const voiceText={food:tx.voice,water:tx.water,toilet:tx.toilet,emergency:tx.emergencyVoice,ok:tx.okVoice}[g.key];
 speak(voiceText,l);
}
function updateGuide(){
 const l=$("languageSelect").value,t=guideText[l]||guideText.en;
 $("guideFood1").textContent=t.food;$("guideFood1Sub").textContent=t.foodSub;$("guideWater").textContent=t.water;$("guideWaterSub").textContent=t.waterSub;
 $("guideFood3").textContent=t.food;$("guideFood3Sub").textContent=t.foodSub;$("guideToilet").textContent=t.toilet;$("guideToiletSub").textContent=t.toiletSub;
 $("guideEmergency").textContent=t.emergency;$("guideEmergencySub").textContent=t.emergencySub;$("guideOk").textContent=t.ok;$("guideOkSub").textContent=t.okSub;
 $("patientLang").textContent={en:"English",kn:"Kannada",hi:"Hindi"}[l];if(lastDetected!==null)showDetection(lastDetected,false);
}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function angle(a,b,c){const ab={x:a.x-b.x,y:a.y-b.y},cb={x:c.x-b.x,y:c.y-b.y},dot=ab.x*cb.x+ab.y*cb.y,den=Math.hypot(ab.x,ab.y)*Math.hypot(cb.x,cb.y);return den?Math.acos(Math.max(-1,Math.min(1,dot/den)))*180/Math.PI:0}
function fingerExtended(lm,mcp,pip,tip){return angle(lm[mcp],lm[pip],lm[tip])>150&&distance(lm[tip],lm[0])>distance(lm[pip],lm[0])*1.04}
function countFingers(lm){let count=0;[[5,6,8],[9,10,12],[13,14,16],[17,18,20]].forEach(([m,p,t])=>{if(fingerExtended(lm,m,p,t))count++});if(fingerExtended(lm,2,3,4))count++;return count}
let lastDetected=null,stableCounts=[],lastSentGesture=null,lastSentAt=0;
function handleLandmarks(r){
 const c=$("outputCanvas"),ctx=c.getContext("2d"),v=$("inputVideo");c.width=v.videoWidth||640;c.height=v.videoHeight||480;ctx.clearRect(0,0,c.width,c.height);
 const lm=r.multiHandLandmarks?.[0];
 if(!lm){$("cameraStatus").textContent="Camera running — show one hand";$("cameraHint").classList.remove("hidden");stableCounts=[];return}
 $("cameraHint").classList.add("hidden");$("cameraStatus").textContent="✋ Hand detected";ctx.lineWidth=3;ctx.strokeStyle="#20d46b";ctx.fillStyle="#20d46b";
 lm.forEach(p=>{ctx.beginPath();ctx.arc(p.x*c.width,p.y*c.height,4,0,Math.PI*2);ctx.fill()});
 const number=countFingers(lm);stableCounts.push(number);if(stableCounts.length>4)stableCounts.shift();
 const freq={};stableCounts.forEach(n=>freq[n]=(freq[n]||0)+1);const best=Object.entries(freq).sort((a,b)=>b[1]-a[1])[0];if(!best||Number(best[1])<2)return;
 const detected=Number(best[0]);if(lastDetected!==detected){lastDetected=detected;showDetection(detected,false);speakDetected(detected)}
 const now=Date.now();if(lastSentGesture!==detected||now-lastSentAt>2500){lastSentGesture=detected;lastSentAt=now;void createGestureAlert(detected)}
}
async function startCamera(){
 try{
  if(camera) stopCamera();
  if(!window.Hands){throw new Error("MediaPipe Hands library did not load")}
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){throw new Error("Camera API is not available. Open this site in HTTPS Chrome.")}

  const v=$("inputVideo");
  const status=$("cameraStatus"), badge=$("aiBadge"), hint=$("cameraHint");
  status.textContent="Requesting camera permission…";
  hint.classList.remove("hidden");

  const stream=await navigator.mediaDevices.getUserMedia({
   video:{facingMode:{ideal:"user"},width:{ideal:640},height:{ideal:480}},
   audio:false
  });
  v.srcObject=stream;
  v.muted=true;
  v.playsInline=true;
  await v.play();

  const hands=new Hands({locateFile:f=>`https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/${f}`});
  hands.setOptions({maxNumHands:1,modelComplexity:0,minDetectionConfidence:.55,minTrackingConfidence:.55});
  hands.onResults(handleLandmarks);

  camera={stream,hands,running:true,raf:0,busy:false};
  badge.textContent="AI RUNNING";
  badge.classList.add("running");
  status.textContent="Camera running — show one hand";
  const l=$("languageSelect").value;
  $("voiceStatus").textContent=(labels[l]||labels.en).voiceReady;
  hint.textContent="Show one hand clearly inside the camera";

  const processFrame=async()=>{
   if(!camera||!camera.running)return;
   if(v.readyState>=2 && !camera.busy){
    camera.busy=true;
    try{await hands.send({image:v})}catch(e){console.warn("MediaPipe frame error",e)}
    finally{if(camera)camera.busy=false}
   }
   if(camera&&camera.running)camera.raf=requestAnimationFrame(processFrame);
  };
  camera.raf=requestAnimationFrame(processFrame);
 }catch(e){
  console.error("Camera start failed:",e);
  if(camera)stopCamera();
  const message=e?.name==="NotAllowedError"?"Camera permission denied. Allow camera access in Chrome and try again.":e?.name==="NotFoundError"?"No camera was found on this device.":e?.message||"Unable to start camera.";
  $("cameraStatus").textContent=message;
  toast(message);
 }
}
function stopCamera(){
 if(camera){
  camera.running=false;
  if(camera.raf)cancelAnimationFrame(camera.raf);
  try{camera.hands?.close?.()}catch{}
  camera.stream?.getTracks?.().forEach(t=>t.stop());
  camera=null;
 }
 const v=$("inputVideo");
 if(v.srcObject){v.srcObject.getTracks().forEach(t=>t.stop());v.srcObject=null}
 $("cameraStatus").textContent="Camera is off";
 $("aiBadge").textContent="AI READY";
 $("aiBadge").classList.remove("running");
 $("cameraHint").classList.remove("hidden");
 $("cameraHint").textContent="Press “Start Camera AI” and show your hand";
 stableCounts=[];lastDetected=null;lastSentGesture=null;
 const l=$("languageSelect").value;
 $("detectedGesture").textContent=(labels[l]||labels.en).waiting;
 $("detectedEmoji").textContent="✋";
 $("detectedNeed").textContent="Show your hand to communicate";
 $("detectedDetail").textContent=(labels[l]||labels.en).detail;
}
document.addEventListener("DOMContentLoaded",()=>{
 document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>page(b.dataset.page));
 $("openGestureBtn").onclick=()=>page("gesture");$("viewAlertsBtn").onclick=()=>page("alerts");$("notifyBtn").onclick=notifyEnable;
 $("languageSelect").onchange=()=>updateGuide();
 document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");render()});
 document.addEventListener("click",e=>{const b=e.target.closest(".act");if(b)act(b.dataset.id,b.dataset.action)});
 $("cameraBtn").onclick=startCamera;$("stopCameraBtn").onclick=stopCamera;
 $("reportForm").onsubmit=report;$("appointmentForm").onsubmit=appointment;
 $("closeAlertOverlay").onclick=()=>$("alertOverlay").classList.remove("show");
 $("overlayVoiceBtn").onclick=()=>activeAlert&&speak(`${activeAlert.message}. Room ${activeAlert.room}. Bed ${activeAlert.bed}`,activeAlert.language);
 $("overlayAckBtn").onclick=async()=>{if(activeAlert){await act(activeAlert.id,"acknowledge");$("alertOverlay").classList.remove("show")}};
 $("overlayResolveBtn").onclick=async()=>{if(activeAlert){await act(activeAlert.id,"resolve");$("alertOverlay").classList.remove("show")}};
 updateGuide();refresh();setInterval(refresh,3000);
});
