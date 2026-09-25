let state={alerts:[],reports:[],appointments:[]},filter="all",activeAlert=null,camera=null;
const base$=id=>document.getElementById(id);
const $=id=>{if(typeof recognitionMode!=="undefined"&&recognitionMode!=="hand"){const map={inputVideo:"faceInputVideo",outputCanvas:"faceOutputCanvas",cameraHint:"faceCameraHint",cameraStatus:"faceCameraStatus",cameraDiagnostic:"faceCameraDiagnostic",multiAiStatus:"faceAiStatus",aiBadge:"faceAiBadge"};const f=base$(map[id]||id);if(f)return f;}return base$(id)};

const langs={en:"en-IN",kn:"kn-IN",hi:"hi-IN"};
const labels={
 en:{food:"PATIENT NEEDS FOOD",water:"PATIENT NEEDS WATER",toilet:"PATIENT NEEDS TOILET",nurse:"PATIENT NEEDS NURSE / DOCTOR",emergency:"EMERGENCY — IMMEDIATE MEDICAL ASSISTANCE REQUIRED",ok:"ALL OK",detect:"DETECTED",waiting:"Waiting for patient communication…",detail:"AI is monitoring hand, eye, face and head communication.",voiceReady:"🔊 Automatic voice is ready",voice:"Patient needs food.",waterVoice:"Patient needs water.",toiletVoice:"Patient needs toilet assistance.",nurseVoice:"Patient needs a nurse or doctor.",emergencyVoice:"Emergency. Immediate medical assistance is required.",okVoice:"Patient is all okay."},
 kn:{food:"ರೋಗಿಗೆ ಆಹಾರ ಬೇಕಾಗಿದೆ",water:"ರೋಗಿಗೆ ನೀರು ಬೇಕಾಗಿದೆ",toilet:"ರೋಗಿಗೆ ಶೌಚಾಲಯ ಸಹಾಯ ಬೇಕಾಗಿದೆ",nurse:"ರೋಗಿಗೆ ನರ್ಸ್ / ವೈದ್ಯರು ಬೇಕು",emergency:"ತುರ್ತು — ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ಸಹಾಯ ಅಗತ್ಯ",ok:"ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ",detect:"ಪತ್ತೆಯಾಗಿದೆ",waiting:"ರೋಗಿಯ ಸಂವಹನಕ್ಕಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ…",detail:"AI ಕೈ, ಕಣ್ಣು, ಮುಖ ಮತ್ತು ತಲೆ ಸಂವಹನವನ್ನು ಗಮನಿಸುತ್ತಿದೆ.",voiceReady:"🔊 ಸ್ವಯಂಚಾಲಿತ ಧ್ವನಿ ಸಿದ್ಧವಾಗಿದೆ",voice:"ರೋಗಿಗೆ ಆಹಾರ ಬೇಕಾಗಿದೆ.",waterVoice:"ರೋಗಿಗೆ ನೀರು ಬೇಕಾಗಿದೆ.",toiletVoice:"ರೋಗಿಗೆ ಶೌಚಾಲಯ ಸಹಾಯ ಬೇಕಾಗಿದೆ.",nurseVoice:"ರೋಗಿಗೆ ನರ್ಸ್ ಅಥವಾ ವೈದ್ಯರು ಬೇಕಾಗಿದ್ದಾರೆ.",emergencyVoice:"ತುರ್ತು ಪರಿಸ್ಥಿತಿ. ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ಸಹಾಯ ಅಗತ್ಯ.",okVoice:"ರೋಗಿ ಸಂಪೂರ್ಣವಾಗಿ ಸರಿಯಾಗಿದ್ದಾರೆ."},
 hi:{food:"मरीज को खाना चाहिए",water:"मरीज को पानी चाहिए",toilet:"मरीज को शौचालय की सहायता चाहिए",nurse:"मरीज को नर्स / डॉक्टर चाहिए",emergency:"आपातकाल — तुरंत चिकित्सा सहायता आवश्यक",ok:"सब ठीक है",detect:"पहचाना गया",waiting:"मरीज के संचार का इंतजार…",detail:"AI हाथ, आंख, चेहरे और सिर के संकेतों को देख रहा है।",voiceReady:"🔊 स्वचालित आवाज तैयार है",voice:"मरीज को खाना चाहिए।",waterVoice:"मरीज को पानी चाहिए।",toiletVoice:"मरीज को शौचालय की सहायता चाहिए।",nurseVoice:"मरीज को नर्स या डॉक्टर चाहिए।",emergencyVoice:"आपातकाल। तुरंत चिकित्सा सहायता आवश्यक है।",okVoice:"मरीज बिल्कुल ठीक है।"}
};
const guideText={
 en:{food:"Food",foodSub:"1 finger — patient needs food",water:"Water",waterSub:"2 fingers — patient needs water",nurse:"Nurse / Doctor",nurseSub:"3 fingers — nurse or doctor needed",toilet:"Toilet",toiletSub:"4 fingers — toilet assistance",emergency:"Emergency",emergencySub:"5 fingers — immediate medical assistance",ok:"All OK",okSub:"0 fingers — everything is okay"},
 kn:{food:"ಆಹಾರ",foodSub:"1 ಬೆರಳು — ಆಹಾರ ಬೇಕು",water:"ನೀರು",waterSub:"2 ಬೆರಳು — ನೀರು ಬೇಕು",nurse:"ನರ್ಸ್ / ವೈದ್ಯರು",nurseSub:"3 ಬೆರಳು — ನರ್ಸ್ ಅಥವಾ ವೈದ್ಯರು ಬೇಕು",toilet:"ಶೌಚಾಲಯ",toiletSub:"4 ಬೆರಳು — ಶೌಚಾಲಯ ಸಹಾಯ",emergency:"ತುರ್ತು",emergencySub:"5 ಬೆರಳು — ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ಸಹಾಯ",ok:"ಎಲ್ಲವೂ ಸರಿ",okSub:"0 ಬೆರಳು — ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ"},
 hi:{food:"खाना",foodSub:"1 उंगली — खाना चाहिए",water:"पानी",waterSub:"2 उंगलियां — पानी चाहिए",nurse:"नर्स / डॉक्टर",nurseSub:"3 उंगलियां — नर्स या डॉक्टर चाहिए",toilet:"शौचालय",toiletSub:"4 उंगलियां — शौचालय सहायता",emergency:"आपातकाल",emergencySub:"5 उंगलियां — तुरंत चिकित्सा सहायता",ok:"सब ठीक",okSub:"0 उंगलियां — सब ठीक है"}
};
const gestureMap={
 1:{key:"food",name:"1 Finger — Food",emoji:"☝️",priority:"Normal"},
 2:{key:"water",name:"2 Fingers — Water",emoji:"✌️",priority:"Normal"},
 3:{key:"nurse",name:"3 Fingers — Nurse / Doctor",emoji:"🤟",priority:"High"},
 4:{key:"toilet",name:"4 Fingers — Toilet",emoji:"🖖",priority:"Normal"},
 5:{key:"emergency",name:"5 Fingers — Emergency",emoji:"🖐️",priority:"Critical"},
 0:{key:"ok",name:"0 Fingers — All OK",emoji:"✊",priority:"Normal"}
};

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2400)}
function page(p){
 document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
 const target=$(p); if(target)target.classList.add("active");
 document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===p));
 $("pageTitle").textContent={dashboard:"Nurse Dashboard",gesture:"Gesture Communication",faceeye:"Face, Eye & Head AI",alerts:"Alert Center",patient:"Patient Care",reports:"Medical Reports",appointments:"Appointments",analytics:"Analytics",mobile:"Mobile App"}[p]||p;
 if(p==="mobile")updateMobilePanel();
 if(p==="gesture"){if(cameraRunning)stopCamera();recognitionMode="hand";updateModeUI()}
 if(p==="faceeye"&&recognitionMode==="hand"){if(cameraRunning)stopCamera();recognitionMode="face";updateModeUI()}

}
async function api(u,o={}){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),7000);
 try{
  const r=await fetch(u,{cache:"no-store",...o,signal:controller.signal});
  let d={}; try{d=await r.json()}catch{}
  if(!r.ok)throw Error(d.detail||d.error||`Request failed (${r.status})`);
  return d;
 }catch(e){
  if(e.name==="AbortError")throw Error("Server request timed out");
  throw e;
 }finally{clearTimeout(timer)}
}
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

function getSelectedLang(){return langs[$("languageSelect").value]||"en-IN"}
function loadVoices(){return window.speechSynthesis?.getVoices?.()||[]}
if("speechSynthesis" in window){loadVoices();speechSynthesis.addEventListener?.("voiceschanged",loadVoices)}
function findVoice(lang){
 const wanted=(lang||"en-IN").toLowerCase(),base=wanted.split("-")[0],voices=loadVoices();
 const exact=voices.find(v=>v.lang?.toLowerCase()===wanted);
 const baseVoice=voices.find(v=>v.lang?.toLowerCase()===base);
 const prefix=voices.find(v=>v.lang?.toLowerCase().startsWith(base+"-"));
 return exact||baseVoice||prefix||null;
}
let speechTimer=null,voiceAudio=null;
function googleTtsFallback(text,lang){
 try{
  if(voiceAudio){voiceAudio.pause();voiceAudio=null}
  const tl=(lang||"en-IN").split("-")[0];
  const url="https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl="+encodeURIComponent(tl)+"&q="+encodeURIComponent(text);
  voiceAudio=new Audio(url);voiceAudio.volume=1;
  voiceAudio.play().catch(()=>{});
 }catch(e){console.warn("TTS fallback failed",e)}
}
function speak(textToSay,l){
 if(!textToSay)return false;
 const synth=window.speechSynthesis;
 if(!(synth&&window.SpeechSynthesisUtterance)){toast("Voice is not supported on this browser");return false}
 const lang=langs[l||$("languageSelect").value]||"en-IN";
 const u=new SpeechSynthesisUtterance(textToSay);u.lang=lang;u.rate=.92;u.pitch=1;u.volume=1;
 const voice=findVoice(lang);if(voice)u.voice=voice;
 const status=$("voiceStatus");if(status)status.textContent=voice?"🔊 Speaking":"🔊 Speaking with device voice";
 let fallbackUsed=false;
 u.onend=()=>{if(status)status.textContent="✓ Voice completed"};
 u.onerror=e=>{
  if(status)status.textContent="⚠️ Voice fallback";
  console.warn("Speech error",e.error,lang);
  if(!fallbackUsed){fallbackUsed=true;googleTtsFallback(textToSay,lang)}
 };
 if(speechTimer)clearTimeout(speechTimer);
 try{synth.cancel();synth.resume?.()}catch{}
 speechTimer=setTimeout(()=>{
  try{synth.speak(u);synth.resume?.()}catch(e){console.warn("Speech start error",e);googleTtsFallback(textToSay,lang)}
 },20);
 return true;
}
function primeVoice(){
 try{
  const synth=window.speechSynthesis;if(!synth)return;
  synth.cancel();synth.resume?.();
  const u=new SpeechSynthesisUtterance(" ");u.volume=0;u.lang=getSelectedLang();synth.speak(u);
 }catch{}
}
let alertCloseTimer=null;
function normalizeAlert(a={}){
 const text=(v,fallback)=>{const s=String(v??"").trim();return s||fallback};
 const patientId=text(a.patientId??a.patient_id,"P1001");
 const patientName=text(a.patientName??a.patient_name,"Patient");
 const room=text(a.room??a.roomNumber??a.room_no,"204");
 const bed=text(a.bed??a.bedNumber??a.bed_no,"-");
 const message=text(a.message,"Patient alert");
 const language=text(a.language,"en");
 const priority=text(a.priority,"Normal");
 return {...a,patientId,patientName,room,bed,message,language,priority};
}
function overlay(raw){
 const a=normalizeAlert(raw);
 if(alertCloseTimer){clearTimeout(alertCloseTimer);alertCloseTimer=null}
 activeAlert=a;
 $("overlayMessage").textContent=a.message;
 $("overlayMeta").textContent=`Room ${a.room} · Bed ${a.bed}`;
 $("overlayPatient").textContent=`Patient ${a.patientId} · ${a.patientName}`;
 $("overlayPriority").textContent=a.priority==="Critical"?"🚨 CRITICAL PATIENT ALERT":a.priority==="High"?"⚠️ HIGH PRIORITY PATIENT ALERT":"🚨 PATIENT ALERT";
 const ov=$("alertOverlay");
 ov.classList.add("show");
 ov.setAttribute("aria-hidden","false");
 // Keep the alert visible long enough for staff to read it, but never block the next gesture forever.
 const opened=a;
 alertCloseTimer=setTimeout(()=>{if(activeAlert===opened)closeAlertOverlay()},8000);
}

function closeAlertOverlay(){
 if(alertCloseTimer){clearTimeout(alertCloseTimer);alertCloseTimer=null}
 const ov=$("alertOverlay");
 if(ov){ov.classList.remove("show");ov.setAttribute("aria-hidden","true")}
 activeAlert=null;emergencyModalOpen=false;
 try{speechSynthesis.cancel();speechSynthesis.resume?.()}catch{}
 const status=$("voiceStatus");if(status)status.textContent=(labels[$("languageSelect").value]||labels.en).voiceReady;
}
let emergencyModalOpen=false,lastEmergencyModalAt=0,emergencyLatched=false;

async function createGestureAlert(number){
 const g=gestureMap[number];if(!g)return;
 const l=$("languageSelect").value,tx=labels[l]||labels.en,message=tx[g.key];
 const payload={patientId:$("patientId")?.value?.trim()||"P1001",patientName:$("patientName")?.value?.trim()||"Demo Patient",room:$("room")?.value?.trim()||"204",bed:$("bed")?.value?.trim()||"3",gesture:g.name,message,language:l,priority:g.priority,confidence:95};
 showDetection(number,false);
 if(g.key==="emergency"&&!emergencyModalOpen&&!emergencyLatched){
  emergencyLatched=true;
  const localAlert={id:"LOCAL-"+Date.now(),...payload,status:"Saving…",createdAt:new Date().toISOString(),acknowledgedAt:null,resolvedAt:null};
  emergencyModalOpen=true;lastEmergencyModalAt=Date.now();overlay(localAlert);
 }
 try{
  let a;
  for(let attempt=0;attempt<3;attempt++){
   try{a=await api("/api/alerts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});break}
   catch(e){if(attempt===2)throw e;await new Promise(r=>setTimeout(r,350))}
  }
  a=normalizeAlert(a);notifyAlert(a);updateLocalAlert(a);showDetection(number,true);
  if(g.key==="emergency"&&emergencyModalOpen&&activeAlert&&String(activeAlert.id).startsWith("LOCAL-")){
   overlay(a);
  }
 }catch(e){
  console.warn("Alert send failed",e);showDetection(number,false);
  if(g.key==="emergency"&&emergencyModalOpen){
   $("overlayPriority").textContent="⚠️ EMERGENCY DETECTED";$("overlayMessage").textContent=message;$("overlayMeta").textContent=`Room ${payload.room} · Bed ${payload.bed}`;$("overlayPatient").textContent=`Patient ${payload.patientId} · ${payload.patientName}`;
  }
  toast("Gesture detected, but the server could not save the alert.");
 }
}

async function act(id,action){
 try{
  const a=await api("/api/alerts/"+encodeURIComponent(id),{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action})});
  updateLocalAlert(a);
  return a;
 }catch(e){
  console.warn("Alert action failed",e);
  toast("Could not update alert. Check server connection.");
  throw e;
 }
}
function notifyAlert(a){if("Notification"in window&&Notification.permission==="granted")new Notification(a.priority==="Critical"?"🚨 Patient Emergency":"Patient Gesture Alert",{body:a.message})}
async function enableNotifications(){
 if(!("Notification" in window)){toast("Notifications are not supported by this browser");return}
 try{const permission=await Notification.requestPermission();toast(permission==="granted"?"Notifications enabled":"Notification permission was not granted")}catch{toast("Could not enable notifications")}
}
async function uploadReport(event){
 event.preventDefault();
 try{await api("/api/reports",{method:"POST",body:new FormData(event.target)});toast("Report uploaded successfully");event.target.reset();await refresh()}catch(e){toast(e.message||"Report upload failed")}
}
async function createAppointment(event){
 event.preventDefault();
 try{const payload=Object.fromEntries(new FormData(event.target).entries());await api("/api/appointments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});toast("Appointment scheduled successfully");event.target.reset();await refresh()}catch(e){toast(e.message||"Appointment scheduling failed")}
}
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
 $("guideFood1").textContent=t.food;$("guideFood1Sub").textContent=t.foodSub;
 $("guideWater").textContent=t.water;$("guideWaterSub").textContent=t.waterSub;
 $("guideNurse").textContent=t.nurse;$("guideNurseSub").textContent=t.nurseSub;
 $("guideToilet").textContent=t.toilet;$("guideToiletSub").textContent=t.toiletSub;
 $("guideEmergency").textContent=t.emergency;$("guideEmergencySub").textContent=t.emergencySub;
 $("guideOk").textContent=t.ok;$("guideOkSub").textContent=t.okSub;
 $("patientLang").textContent={en:"English",kn:"Kannada",hi:"Hindi"}[l];
 if(lastDetected!==null)showDetection(lastDetected,false);
}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function angle(a,b,c){const ab={x:a.x-b.x,y:a.y-b.y},cb={x:c.x-b.x,y:c.y-b.y},dot=ab.x*cb.x+ab.y*cb.y,den=Math.hypot(ab.x,ab.y)*Math.hypot(cb.x,cb.y);return den?Math.acos(Math.max(-1,Math.min(1,dot/den)))*180/Math.PI:0}
function fingerExtended(lm,mcp,pip,tip){return angle(lm[mcp],lm[pip],lm[tip])>150&&distance(lm[tip],lm[0])>distance(lm[pip],lm[0])*1.04}
function countFingers(lm){let count=0;[[5,6,8],[9,10,12],[13,14,16],[17,18,20]].forEach(([m,p,t])=>{if(fingerExtended(lm,m,p,t))count++});if(fingerExtended(lm,2,3,4))count++;return count}
let lastDetected=null,stableCounts=[],candidateGesture=null,candidateSince=0,lastSentGesture=null,lastSentAt=0;
let cameraStream=null,hands=null,faceLandmarker=null,cameraRunning=false,processingFrame=false,lastProcessTime=0,frameHandle=null,faceFrameTime=0;
let mediaPipeBase="https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/";
let faceVisionBase="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/wasm";
let faceModelUrl="https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
let patientMode="single",recognitionMode="hand",latestHands=[],latestFaces=[],multiLastFrame=0;
const multiStates={};
const DEFAULT_BEDS={
  1:{id:"P1001",name:"Patient A",lang:"en"},2:{id:"P1002",name:"Patient B",lang:"en"},
  3:{id:"P1003",name:"Patient C",lang:"en"},4:{id:"P1004",name:"Patient D",lang:"en"}
};
const multiText={
 en:{face:"Face detected — patient assigned to bed",blink1:"Patient indicates YES / OK",blink2:"Patient needs HELP",blink3:"PATIENT EMERGENCY — IMMEDIATE HELP",blinkRapid:"Rapid repeated blinking — attention needed",long:"Prolonged eye closure — monitoring",headLeft:"Need Position Change / Turn Left",headRight:"Need Position Change / Turn Right",headUp:"Need Breathing Assistance / Raise Head",headDown:"Pain / Discomfort",headAttention:"Need Nurse Attention",headWorse:"Sudden Discomfort / Condition Change",headMonitoring:"Immediate Monitoring Required",headEmergency:"IMMEDIATE MEDICAL ASSISTANCE REQUIRED",pain:"Severe / sudden pain",breathing:"Difficulty breathing",fall:"Fall / injury",worsening:"Sudden worsening of condition",nurse:"Immediate need for nurse / doctor",faceDistress:"Possible discomfort / distress — monitoring",faceSmile:"Normal / Comfortable facial communication",faceOpen:"Need attention / mouth-open communication",faceFrown:"Possible pain / discomfort — monitoring",faceBreathing:"Possible breathing difficulty — monitoring",faceEmergency:"Severe facial distress signal — immediate medical assistance required",faceMonitoring:"Face communication unclear — monitoring"},
 kn:{face:"ಮುಖ ಪತ್ತೆಯಾಗಿದೆ — ರೋಗಿಯನ್ನು ಹಾಸಿಗೆಗೆ ಹೊಂದಿಸಲಾಗಿದೆ",blink1:"ರೋಗಿ ಹೌದು / ಸರಿ ಎಂದು ಸೂಚಿಸಿದ್ದಾರೆ",blink2:"ರೋಗಿಗೆ ಸಹಾಯ ಬೇಕಾಗಿದೆ",blink3:"ರೋಗಿಗೆ ತುರ್ತು ಸಹಾಯ ಬೇಕಾಗಿದೆ",blinkRapid:"ತ್ವರಿತವಾಗಿ ಕಣ್ಣು ಮಿಟುಕಿಸುವುದು — ಗಮನ ಅಗತ್ಯ",long:"ಕಣ್ಣು ದೀರ್ಘವಾಗಿ ಮುಚ್ಚಿದೆ — ಗಮನಿಸಲಾಗುತ್ತಿದೆ",headLeft:"ಸ್ಥಾನ ಬದಲಾವಣೆ / ಎಡಕ್ಕೆ ತಿರುಗಿಸಿ",headRight:"ಸ್ಥಾನ ಬದಲಾವಣೆ / ಬಲಕ್ಕೆ ತಿರುಗಿಸಿ",headUp:"ಉಸಿರಾಟಕ್ಕೆ ಸಹಾಯ / ತಲೆ ಮೇಲಕ್ಕೆ",headDown:"ನೋವು / ಅಸೌಕರ್ಯ",headAttention:"ನರ್ಸ್ ಗಮನ ಅಗತ್ಯ",headWorse:"ಅಕಸ್ಮಿಕ ಅಸೌಕರ್ಯ / ಸ್ಥಿತಿ ಬದಲಾವಣೆ",headMonitoring:"ತಕ್ಷಣ ಮೇಲ್ವಿಚಾರಣೆ ಅಗತ್ಯ",headEmergency:"ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ಸಹಾಯ ಅಗತ್ಯ",pain:"ತೀವ್ರ / ಅಕಸ್ಮಿಕ ನೋವು",breathing:"ಉಸಿರಾಟದ ತೊಂದರೆ",fall:"ಬೀಳುವಿಕೆ / ಗಾಯ",worsening:"ಸ್ಥಿತಿ ಅಕಸ್ಮಿಕವಾಗಿ ಹದಗೆಟ್ಟಿದೆ",nurse:"ತಕ್ಷಣ ನರ್ಸ್ / ವೈದ್ಯರು ಬೇಕು",faceDistress:"ಅಸೌಕರ್ಯ / ತೊಂದರೆ ಸಾಧ್ಯತೆ — ಗಮನಿಸಲಾಗುತ್ತಿದೆ",faceSmile:"ಸಾಮಾನ್ಯ / ಆರಾಮದಾಯಕ ಮುಖ ಸಂವಹನ",faceOpen:"ಗಮನ ಬೇಕು / ಬಾಯಿ ತೆರೆಯುವ ಸಂವಹನ",faceFrown:"ನೋವು / ಅಸೌಕರ್ಯ ಸಾಧ್ಯತೆ — ಗಮನಿಸಲಾಗುತ್ತಿದೆ",faceBreathing:"ಉಸಿರಾಟದ ತೊಂದರೆ ಸಾಧ್ಯತೆ — ಗಮನಿಸಲಾಗುತ್ತಿದೆ",faceEmergency:"ತೀವ್ರ ಮುಖದ ತೊಂದರೆ ಸಂಕೇತ — ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ಸಹಾಯ ಅಗತ್ಯ",faceMonitoring:"ಮುಖ ಸಂವಹನ ಸ್ಪಷ್ಟವಿಲ್ಲ — ಗಮನಿಸಲಾಗುತ್ತಿದೆ"},
 hi:{face:"चेहरा पहचाना गया — मरीज को बेड से जोड़ा गया",blink1:"मरीज YES / OK संकेत दे रहा है",blink2:"मरीज को मदद चाहिए",blink3:"मरीज की आपात स्थिति — तुरंत मदद",blinkRapid:"तेजी से बार-बार पलक झपकाना — ध्यान चाहिए",long:"आंखें लंबे समय तक बंद — निगरानी",headLeft:"स्थिति बदलना / बाईं ओर मोड़ना",headRight:"स्थिति बदलना / दाईं ओर मोड़ना",headUp:"सांस लेने में सहायता / सिर ऊपर करना",headDown:"दर्द / असुविधा",headAttention:"नर्स का ध्यान चाहिए",headWorse:"अचानक असुविधा / स्थिति में बदलाव",headMonitoring:"तुरंत निगरानी आवश्यक",headEmergency:"तुरंत चिकित्सा सहायता आवश्यक",pain:"तेज / अचानक दर्द",breathing:"सांस लेने में कठिनाई",fall:"गिरना / चोट",worsening:"स्थिति अचानक बिगड़ना",nurse:"तुरंत नर्स / डॉक्टर चाहिए",faceDistress:"संभावित असुविधा / परेशानी — निगरानी",faceSmile:"सामान्य / आरामदायक चेहरे का संचार",faceOpen:"ध्यान चाहिए / मुंह खोलने का संकेत",faceFrown:"संभावित दर्द / असुविधा — निगरानी",faceBreathing:"संभावित सांस लेने में कठिनाई — निगरानी",faceEmergency:"चेहरे पर गंभीर परेशानी का संकेत — तुरंत चिकित्सा सहायता आवश्यक",faceMonitoring:"चेहरे का संकेत स्पष्ट नहीं — निगरानी"}
};

function getBedConfig(n){
 const d=DEFAULT_BEDS[n],pre=recognitionMode!=="hand"?"fbed":"bed";
 const id=$(`${pre}${n}Id`)?.value?.trim()||d.id;
 const name=$(`${pre}${n}Name`)?.value?.trim()||d.name;
 const lang=$(`${pre}${n}Lang`)?.value||d.lang;
 const room=$(recognitionMode!=="hand"?"faceMultiRoom":"multiRoom")?.value?.trim()||"204";
 return {bed:String(n),id,name,lang,room};
}
function getAllBeds(){return [1,2,3,4].map(getBedConfig)}
function makePatientState(){return {gestureHistory:[],gestureCandidate:null,gestureSince:0,lastGesture:null,lastGestureAt:0,wasClosed:false,closedAt:0,blinkTimes:[],lastBlinkEventAt:0,lastRapidBlinkAt:0,lastLongAt:0,neutral:null,lastHeadAt:0,lastHeadDir:null,lastHeadSeq:[],headRepeatCount:0,lastFaceAt:0,eyeBaseline:0,eyeSamples:[],handHistory:[],lastHandEmergencyAt:0,lastFaceEventAt:0,faceSignal:null,faceSignalSince:0,pendingBlink1:false,lastAlertKey:null,lastAlertAt:0,armed:true,cooldownUntil:0}}
function resetMultiStates(){for(let i=1;i<=4;i++)multiStates[i]=makePatientState()}
resetMultiStates();


function updateLocalAlert(a){
 if(!a)return;
 state.alerts=Array.isArray(state.alerts)?state.alerts:[];
 state.alerts=[a,...state.alerts.filter(x=>String(x.id)!==String(a.id))];
 render();
}
function setCameraDiagnostic(message,ok=false){const el=$("cameraDiagnostic");if(el){el.textContent=message;el.classList.toggle("ok",ok)}}
function loadScript(src,label){return new Promise((resolve,reject)=>{
 const existing=document.querySelector(`script[data-mp-src="${src}"]`);
 if(existing){if((label==="hands"&&window.Hands)||(label==="face"&&window.FaceMesh)){resolve();return}existing.addEventListener("load",()=>resolve(),{once:true});existing.addEventListener("error",()=>reject(new Error(`Could not load ${label} AI library`)),{once:true});return}
 const script=document.createElement("script");script.src=src;script.async=true;script.dataset.mpSrc=src;
 script.onload=()=>resolve();script.onerror=()=>reject(new Error(`Could not load ${label} AI library`));document.head.appendChild(script);
})}
async function ensureMediaPipeHands(){
 if(window.Hands)return true;
 const version="0.4.1675469240";let lastError=null;
 for(const source of [{base:`https://cdn.jsdelivr.net/npm/@mediapipe/hands@${version}/`,script:`https://cdn.jsdelivr.net/npm/@mediapipe/hands@${version}/hands.js`},{base:`https://unpkg.com/@mediapipe/hands@${version}/`,script:`https://unpkg.com/@mediapipe/hands@${version}/hands.js`}]){
  try{await loadScript(source.script,"hands");if(window.Hands){mediaPipeBase=source.base;return true}}catch(e){lastError=e}
 }
 throw lastError||new Error("MediaPipe Hands library could not be loaded")
}
async function ensureFaceLandmarker(){
 if(faceLandmarker)return true;
 if(!window.FilesetResolver||!window.FaceLandmarker){
  const src="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/vision_bundle.mjs";
  const mod=await import(src);
  window.FilesetResolver=mod.FilesetResolver;
  window.FaceLandmarker=mod.FaceLandmarker;
 }
 const vision=await window.FilesetResolver.forVisionTasks(faceVisionBase);
 faceLandmarker=await window.FaceLandmarker.createFromOptions(vision,{
  baseOptions:{modelAssetPath:faceModelUrl,delegate:"GPU"},
  runningMode:"VIDEO",numFaces:patientMode==="multi"?4:1,
  minFaceDetectionConfidence:.55,minFacePresenceConfidence:.55,minTrackingConfidence:.55,
  outputFaceBlendshapes:false,outputFacialTransformationMatrixes:false
 });
 return true;
}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function angle(a,b,c){const ab={x:a.x-b.x,y:a.y-b.y},cb={x:c.x-b.x,y:c.y-b.y},dot=ab.x*cb.x+ab.y*cb.y,den=Math.hypot(ab.x,ab.y)*Math.hypot(cb.x,cb.y);return den?Math.acos(Math.max(-1,Math.min(1,dot/den)))*180/Math.PI:0}
function fingerExtended(lm,mcp,pip,tip){return angle(lm[mcp],lm[pip],lm[tip])>150&&distance(lm[tip],lm[0])>distance(lm[pip],lm[0])*1.04}
function countFingers(lm){let count=0;[[5,6,8],[9,10,12],[13,14,16],[17,18,20]].forEach(([m,p,t])=>{if(fingerExtended(lm,m,p,t))count++});if(fingerExtended(lm,2,3,4))count++;return count}
function faceBox(lm){let minX=1,minY=1,maxX=0,maxY=0;lm.forEach(p=>{minX=Math.min(minX,p.x);minY=Math.min(minY,p.y);maxX=Math.max(maxX,p.x);maxY=Math.max(maxY,p.y)});return {minX,minY,maxX,maxY,cx:(minX+maxX)/2,cy:(minY+maxY)/2,w:maxX-minX,h:maxY-minY}}
function bedForPoint(x,y){return x<.5?(y<.5?1:3):(y<.5?2:4)}
function eyeRatio(lm,ids){const a=lm[ids[0]],b=lm[ids[1]],c=lm[ids[2]],d=lm[ids[3]],e=lm[ids[4]],f=lm[ids[5]];return (distance(b,f)+distance(c,e))/(2*Math.max(distance(a,d),0.0001))}
function eyeOpenScore(lm){return (eyeRatio(lm,[33,160,158,133,153,144])+eyeRatio(lm,[362,385,387,263,373,380]))/2}
function updateEyeState(st,score,now){
 if(score>.22 && st.eyeSamples.length<45){st.eyeSamples.push(score);st.eyeBaseline=st.eyeSamples.reduce((a,b)=>a+b,0)/st.eyeSamples.length}
 if(!st.eyeBaseline)st.eyeBaseline=.27;
 const closedThreshold=Math.max(.13,st.eyeBaseline*.68),openThreshold=Math.max(.20,st.eyeBaseline*.82);
 const closed=score<closedThreshold,open=score>openThreshold;
 if(closed&&!st.wasClosed){st.wasClosed=true;st.closedAt=now;return null}
 if(st.wasClosed&&open){
  const duration=now-st.closedAt;st.wasClosed=false;
  if(duration>=900&&now-st.lastLongAt>5000){st.lastLongAt=now;return {kind:"long"}}
  if(duration>=55&&duration<900){
   st.blinkTimes.push(now);st.blinkTimes=st.blinkTimes.filter(t=>now-t<1700);
   if(now-st.lastBlinkEventAt>900){
    const n=st.blinkTimes.length;
    if(n>=3){st.lastBlinkEventAt=now;st.blinkTimes=[];return {kind:"blink3"}}
    if(n===2){const span=now-st.blinkTimes[0];if(span<650){st.lastRapidBlinkAt=now;st.lastBlinkEventAt=now;st.blinkTimes=[];return {kind:"blinkRapid"}}st.lastBlinkEventAt=now;st.blinkTimes=[];return {kind:"blink2"}}
    if(n===1){setTimeout(()=>{
      const cur=st,n2=Date.now();
      if(cur.blinkTimes.length===1&&n2-cur.blinkTimes[0]>=1050&&n2-cur.lastBlinkEventAt>800){cur.lastBlinkEventAt=n2;cur.blinkTimes=[];cur.pendingBlink1=true}
    },1100)}
   }
  }
 }
 return null;
}
function getHeadDirection(lm,box,st){
 const nose=lm[1]||lm[4],left=lm[234],right=lm[454],top=lm[10],chin=lm[152];if(!nose||!left||!right||!top||!chin)return null;
 const faceW=Math.max(distance(left,right),.001),faceH=Math.max(distance(top,chin),.001);
 if(!st.neutral){st.neutral={x:nose.x,y:nose.y};return null}
 const dx=(nose.x-st.neutral.x)/faceW,dy=(nose.y-st.neutral.y)/faceH;
 if(Math.hypot(dx,dy)<.16)return null;
 if(Math.abs(dx)>Math.abs(dy)*1.15)return dx>0?"right":"left";
 return dy>0?"down":"up";
}
function headActionForState(st,dir,now){
 st.lastHeadSeq=st.lastHeadSeq||[];st.lastHeadSeq.push({dir,at:now});st.lastHeadSeq=st.lastHeadSeq.filter(x=>now-x.at<3000);
 const seq=st.lastHeadSeq, dirs=seq.map(x=>x.dir);
 const unique=[...new Set(dirs)];
 const changes=seq.slice(1).filter((x,i)=>x.dir!==seq[i].dir).length;
 const leftRight=seq.filter(x=>x.dir==="left"||x.dir==="right").length;
 // Clearly intentional rapid head shaking: alternating left/right several times in a short window.
 if(leftRight>=5&&unique.includes("left")&&unique.includes("right")&&changes>=4&&now-seq[0].at<2300){st.lastHeadSeq=[];return "headEmergency"}
 // Repeated left/right movement means the patient needs nurse attention.
 if(leftRight>=4&&unique.includes("left")&&unique.includes("right")){st.lastHeadSeq=[];return "headAttention"}
 // Sustained downward/unstable movement requires immediate monitoring.
 const downs=seq.filter(x=>x.dir==="down").length;
 if(downs>=3&&now-seq[0].at>=1400){st.lastHeadSeq=[];return "headMonitoring"}
 // Other repeated abnormal movements indicate sudden discomfort/condition change.
 if(seq.length>=5&&changes>=3){st.lastHeadSeq=[];return "headWorse"}
 return dir==="left"?"headLeft":dir==="right"?"headRight":dir==="up"?"headUp":"headDown";
}
function handMotionEvent(st,lm,number,now){
 const wrist=lm[0],index=lm[8],openPalm=number>=4,fist=number<=1;
 const point={x:wrist.x,y:wrist.y,z:wrist.z||0,open:openPalm,number,at:now};
 st.handHistory.push(point);
 st.handHistory=st.handHistory.filter(p=>now-p.at<1800);
 const recent=st.handHistory.slice(-14);
 if(recent.length<5 || now-st.lastHandEmergencyAt<1400)return null;
 const first=recent[0],last=recent[recent.length-1];
 const dx=last.x-first.x,dy=last.y-first.y,dz=last.z-first.z;
 const maxX=Math.max(...recent.map(p=>p.x))-Math.min(...recent.map(p=>p.x));
 const maxY=Math.max(...recent.map(p=>p.y))-Math.min(...recent.map(p=>p.y));
 const maxZ=Math.max(...recent.map(p=>p.z))-Math.min(...recent.map(p=>p.z));
 const openRecent=recent.filter(p=>p.open).length;
 const fistRecent=recent.filter(p=>p.number<=1).length;
 const xChanges=recent.slice(1).filter((p,i)=>{const d=p.x-recent[i].x;return Math.abs(d)>.035}).length;
 const zChanges=recent.slice(1).filter((p,i)=>Math.abs(p.z-recent[i].z)>.025).length;
 // 1) Repeated fist left/right movement = severe/sudden pain.
 if(fist&&fistRecent>=5&&maxX>.13&&xChanges>=3){
  st.lastHandEmergencyAt=now;st.handHistory=[];
  return {key:"pain",name:"Emergency Action — Severe / Sudden Pain",priority:"Critical",emoji:"😣"};
 }
 // 2) Open palm repeatedly toward/away from camera = difficulty breathing.
 if(openRecent>=5&&maxZ>.075&&zChanges>=3){
  st.lastHandEmergencyAt=now;st.handHistory=[];
  return {key:"breathing",name:"Emergency Action — Difficulty Breathing",priority:"Critical",emoji:"🫁"};
 }
 // 3) Sharp downward open-palm movement = fall/injury.
 if(openRecent>=4&&dy>.13&&dy>Math.abs(dx)*1.15){
  st.lastHandEmergencyAt=now;st.handHistory=[];
  return {key:"fall",name:"Emergency Action — Fall / Injury",priority:"Critical",emoji:"🩹"};
 }
 // 4) Rapid open-palm side-to-side waving = sudden worsening.
 if(openRecent>=5&&maxX>.16&&xChanges>=4){
  st.lastHandEmergencyAt=now;st.handHistory=[];
  return {key:"worsening",name:"Emergency Action — Sudden Worsening",priority:"Critical",emoji:"⚠️"};
 }
 // 5) Open palm raised and held = immediate nurse/doctor.
 if(openPalm&&openRecent>=8&&last.y<.38&&maxX<.12&&maxY<.14&&now-first.at>=850){
  st.lastHandEmergencyAt=now;st.handHistory=[];
  return {key:"nurse",name:"Emergency Action — Immediate Nurse / Doctor",priority:"Critical",emoji:"👩‍⚕️"};
 }
 return null;
}
function patientTextForEvent(cfg,type){const t=multiText[cfg.lang]||multiText.en;return t[type]||type}
function patientVoiceForEvent(cfg,type){const t=multiText[cfg.lang]||multiText.en;return t[type]||type}

function drawMultiScene(){
 const c=$("outputCanvas"),ctx=c?.getContext("2d"),v=$("inputVideo");if(!ctx||!v)return;const w=v.videoWidth||640,h=v.videoHeight||480;if(c.width!==w)c.width=w;if(c.height!==h)c.height=h;ctx.clearRect(0,0,w,h);
 const zones=[{b:1,x:0,y:0},{b:2,x:.5,y:0},{b:3,x:0,y:.5},{b:4,x:.5,y:.5}];ctx.lineWidth=3;ctx.font="bold 15px Arial";
 zones.forEach(z=>{ctx.strokeStyle="rgba(255,255,255,.8)";ctx.strokeRect(z.x*w,z.y*h,w/2,h/2);const cfg=getBedConfig(z.b);ctx.fillStyle="rgba(15,24,39,.65)";ctx.fillRect(z.x*w+7,z.y*h+7,210,28);ctx.fillStyle="#fff";ctx.fillText(`BED ${z.b} · ${cfg.id}`,z.x*w+14,z.y*h+27)});
 if(recognitionMode==="hand") latestHands.forEach(lm=>{const p=lm[0],bed=bedForPoint(p.x,p.y),cfg=getBedConfig(bed);ctx.fillStyle="#20d46b";lm.forEach(q=>{ctx.beginPath();ctx.arc(q.x*w,q.y*h,3.5,0,Math.PI*2);ctx.fill()});ctx.fillText(`${cfg.id} · Bed ${bed} · ${countFingers(lm)} fingers`,p.x*w+8,p.y*h-8)});
 else latestFaces.forEach(lm=>{const b=faceBox(lm),bed=bedForPoint(b.cx,b.cy),cfg=getBedConfig(bed);ctx.strokeStyle=recognitionMode==="eye"?"#ff9f43":recognitionMode==="head"?"#00b894":"#7c4dff";ctx.strokeRect(b.minX*w,b.minY*h,b.w*w,b.h*h);ctx.fillStyle=ctx.strokeStyle;ctx.fillText(`${cfg.id} · Bed ${bed} · ${recognitionMode.toUpperCase()}`,b.minX*w,Math.max(18,b.minY*h-5))});
}
async function createMultiAlert(cfg,gesture,message,priority="Normal",confidence=92,voiceText=message){
 const st=multiStates[cfg._stateKey||cfg.bed]||makePatientState(),now=Date.now(),key=`${cfg._stateKey||cfg.bed}|${gesture}`;
 if(!st.armed||now<(st.cooldownUntil||0)||st.lastAlertKey===key&&now-(st.lastAlertAt||0)<5000)return false;
 st.lastAlertKey=key;st.lastAlertAt=now;st.armed=false;st.cooldownUntil=now+1200;
 const payload={patientId:String(cfg.id||"P1001"),patientName:String(cfg.name||"Patient"),room:String(cfg.room||"204"),bed:String(cfg.bed||"-"),gesture:String(gesture||"Communication"),message:String(message||gesture||"Patient alert"),language:String(cfg.lang||"en"),priority,confidence};
 const localAlert=normalizeAlert({id:"LOCAL-"+now,...payload,status:"Saving…",createdAt:new Date().toISOString()});
 overlay(localAlert);
 showPatientEvent({...cfg,...payload},payload.gesture,payload.message,payload.priority,payload.priority==="Critical"?"🚨":"👤");
 speak(voiceText||payload.message,payload.language);
 try{
  const a=normalizeAlert(await api("/api/alerts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)}));
  notifyAlert(a);updateLocalAlert(a);
  if(activeAlert && String(activeAlert.id)===String(localAlert.id)){overlay(a)}
 }catch(e){
  console.warn("Alert save failed",e);
  toast(`Bed ${payload.bed}: alert detected, but alert could not be saved.`);
 }
 return true;
}
function showMultiEvent(cfg,gesture,message,priority){showPatientEvent(cfg,gesture,message,priority,priority==="Critical"?"🚨":"👤")}
function patientCfgSingle(){return {_stateKey:"single",bed:String($("bed")?.value?.trim()||"3"),id:$("patientId")?.value?.trim()||"P1001",name:$("patientName")?.value?.trim()||"Demo Patient",lang:$("languageSelect")?.value||"en",room:$("room")?.value?.trim()||"204"}}
function rearmState(st,now,signalAbsent=false,currentSignal=null){
 if(st.armed)return;
 if(now<(st.cooldownUntil||0))return;
 const changed=currentSignal!==null && st.lastSignal!==null && String(currentSignal)!==String(st.lastSignal);
 if(signalAbsent||changed){
  st.armed=true;st.gestureHistory=[];st.gestureCandidate=null;st.gestureSince=0;
  st.lastHeadSeq=[];st.headRepeatCount=0;st.blinkTimes=[];st.pendingBlink1=false;st.handHistory=[];
  st.faceSignal=null;st.faceSignalSince=0;
 }
}
function processHandForPatient(h,cfg,st,now){
 const number=countFingers(h);
 rearmState(st,now,false,number);
 if(!st.armed)return false;
 const motion=handMotionEvent(st,h,number,now);
 if(motion){const tx=multiText[cfg.lang]||multiText.en;return createMultiAlert(cfg,motion.name,tx[motion.key]||motion.name,motion.priority,96,tx[motion.key]||motion.name)}
 st.gestureHistory.push(number);if(st.gestureHistory.length>7)st.gestureHistory.shift();const freq={};st.gestureHistory.forEach(n=>freq[n]=(freq[n]||0)+1);const top=Object.entries(freq).sort((a,b)=>b[1]-a[1])[0];if(!top||+top[1]<5)return false;
 const detected=+top[0];if(st.gestureCandidate!==detected){st.gestureCandidate=detected;st.gestureSince=now;return false}if(now-st.gestureSince<450)return false;const g=gestureMap[detected],tx=labels[cfg.lang]||labels.en;
 st.lastSignal=detected;
 return createMultiAlert(cfg,g.name,tx[g.key],g.priority,95,{food:tx.voice,water:tx.water,nurse:tx.nurseVoice,toilet:tx.toiletVoice,emergency:tx.emergencyVoice,ok:tx.okVoice}[g.key]);
}
function showPatientEvent(cfg,gesture,message,priority,emoji="👤"){$("multiAiStatus").textContent=`${priority==="Critical"?"🚨":"✓"} ${cfg.id} · Bed ${cfg.bed} · ${message}`;$('detectedGesture').textContent=`${emoji} ${gesture}`;$('detectedEmoji').textContent=emoji;$('detectedNeed').textContent=message;$('detectedDetail').textContent=`${cfg.name} · Room ${cfg.room} · Bed ${cfg.bed}`;$('detectionPanel')?.classList.toggle('emergency-detection',priority==="Critical")}
function processMultiHands(){latestHands.forEach(h=>{const p=h[0];if(!p)return;const bed=bedForPoint(p.x,p.y),cfg=getBedConfig(bed),st=multiStates[bed],now=Date.now();processHandForPatient(h,cfg,st,now)})}
function processFaceForPatient(lm,cfg,st,now){
 const box=faceBox(lm),tx=multiText[cfg.lang]||multiText.en;
 const eyeScore=eyeOpenScore(lm);
 if(recognitionMode==="eye"){
  // Re-arm after the eyes return to an open/neutral state, so the next intentional blink can be detected without restarting the camera.
  if(!st.armed && now>=(st.cooldownUntil||0) && eyeScore>.20 && !st.wasClosed){st.armed=true;st.pendingBlink1=false;st.blinkTimes=[];}
  if(!st.armed)return;
  const event=updateEyeState(st,eyeScore,now);
  if(event){
   if(event.kind==="blink3")return createMultiAlert(cfg,"3 Blinks — Emergency",tx.blink3,"Critical",94,tx.blink3);
   if(event.kind==="blink2")return createMultiAlert(cfg,"2 Blinks — Need Help",tx.blink2,"High",93,tx.blink2);
   if(event.kind==="blinkRapid")return createMultiAlert(cfg,"Rapid Repeated Blinking — Attention",tx.blinkRapid,"High",91,tx.blinkRapid);
   if(event.kind==="long")return createMultiAlert(cfg,"Prolonged Eye Closure",tx.long,"High",90,tx.long)
  }
  if(st.pendingBlink1){st.pendingBlink1=false;return createMultiAlert(cfg,"1 Blink — Yes / OK",tx.blink1,"Normal",90,tx.blink1)}
  return;
 }
 if(recognitionMode==="head"){
  const dir=getHeadDirection(lm,box,st);
  // Re-arm only after the head returns close to neutral, preventing continuous repeats while the same movement is held.
  if(!dir){
   if(!st.armed && now>=(st.cooldownUntil||0)){st.armed=true;st.lastHeadSeq=[];st.headRepeatCount=0;}
   if(now-st.lastHeadAt>1800){st.lastHeadDir=null;st.headRepeatCount=0}
   return;
  }
  if(!st.armed)return;
  if(now-st.lastHeadAt>650){
   const same=dir===st.lastHeadDir;st.headRepeatCount=same?(st.headRepeatCount||1)+1:1;st.lastHeadAt=now;st.lastHeadDir=dir;
   const key=headActionForState(st,dir,now),priority=key==="headEmergency"?"Critical":(key==="headAttention"||key==="headWorse"||key==="headMonitoring")?"High":"Normal";
   return createMultiAlert(cfg,`Head Action — ${key}`,tx[key],priority,key==="headEmergency"?97:88,tx[key]);
  }
  return;
 }
 // Face communication: classify the current intentional facial state, then re-arm when the patient changes back to neutral or to a different state.
 const mouthOpen=distance(lm[13],lm[14])/Math.max(distance(lm[61],lm[291]),.001),mouthWidth=Math.max(distance(lm[61],lm[291]),.001),cornerAvgY=(lm[61].y+lm[291].y)/2,centerY=(lm[13].y+lm[14].y)/2;
 const smile=(centerY-cornerAvgY)/mouthWidth>.10,frown=(cornerAvgY-centerY)/mouthWidth>.13;
 const severeDistress=frown&&mouthOpen>.22;
 const faceSignal=severeDistress?"emergency":mouthOpen>.36?"breathing":smile?"smile":frown?"frown":"monitoring";
 if(!st.armed){
  if(now>=(st.cooldownUntil||0) && st.faceSignal!==faceSignal){st.armed=true;st.faceSignal=faceSignal;st.faceSignalSince=now;}
  if(!st.armed)return;
 }
 if(faceSignal!==st.faceSignal){st.faceSignal=faceSignal;st.faceSignalSince=now;return}
 if(now-st.faceSignalSince>1200){
  const key=faceSignal==="emergency"?"faceEmergency":faceSignal==="breathing"?"faceBreathing":faceSignal==="smile"?"faceSmile":faceSignal==="frown"?"faceFrown":"faceMonitoring";
  const priority=key==="faceEmergency"?"Critical":key==="faceBreathing"?"High":"Normal";
  return createMultiAlert(cfg,`Face — ${key}`,tx[key],priority,key==="faceEmergency"?96:key==="faceBreathing"?86:80,tx[key]);
 }
}
function processMultiFaces(){if(recognitionMode==="hand")return;const now=Date.now();latestFaces.forEach(lm=>{const b=faceBox(lm),bed=bedForPoint(b.cx,b.cy),cfg=getBedConfig(bed),st=multiStates[bed];processFaceForPatient(lm,cfg,st,now)})}
function handleMultiHandsResults(r){latestHands=r.multiHandLandmarks||[]}
function handleMultiFaceResults(r){latestFaces=r.multiFaceLandmarks||[]}
function drawSingleScene(r){const c=$("outputCanvas"),ctx=c.getContext("2d"),v=$("inputVideo"),w=v.videoWidth||640,h=v.videoHeight||480;if(c.width!==w)c.width=w;if(c.height!==h)c.height=h;ctx.clearRect(0,0,c.width,c.height);const lm=r.multiHandLandmarks?.[0];if(lm&&recognitionMode==="hand"){const cfg=patientCfgSingle(),st=multiStates.single,now=Date.now();ctx.fillStyle="#20d46b";lm.forEach(p=>{ctx.beginPath();ctx.arc(p.x*c.width,p.y*c.height,4,0,Math.PI*2);ctx.fill()});processHandForPatient(lm,cfg,st,now);$("cameraHint").classList.add("hidden");$("cameraStatus").textContent="✋ Hand detected"}}
function drawSingleFaceScene(){const c=$("outputCanvas"),ctx=c.getContext("2d"),v=$("inputVideo"),lm=latestFaces[0];if(!lm)return;const w=v.videoWidth||640,h=v.videoHeight||480;if(c.width!==w)c.width=w;if(c.height!==h)c.height=h;ctx.clearRect(0,0,w,h);const b=faceBox(lm);ctx.strokeStyle=recognitionMode==="eye"?"#ff9f43":recognitionMode==="head"?"#00b894":"#7c4dff";ctx.lineWidth=3;ctx.strokeRect(b.minX*w,b.minY*h,b.w*w,b.h*h);ctx.fillStyle=ctx.strokeStyle;ctx.font="bold 14px Arial";ctx.fillText(`${patientCfgSingle().id} · ${recognitionMode.toUpperCase()}`,b.minX*w,Math.max(18,b.minY*h-5))}
async function processVideoFrame(now){
 if(!cameraRunning)return;
 frameHandle=requestAnimationFrame(processVideoFrame);
 const v=$("inputVideo");
 if(v.readyState<2||processingFrame)return;
 if(now-lastProcessTime<70)return;
 lastProcessTime=now;processingFrame=true;
 try{
  if(recognitionMode==="hand"){
   await hands.send({image:v});
   if(patientMode==="multi"){if(!latestHands.length)for(let i=1;i<=4;i++)rearmState(multiStates[i],now,true);processMultiHands();drawMultiScene()}
   else if(!latestHands.length)rearmState(multiStates.single,now,true);
  }else{
   const result=faceLandmarker.detectForVideo(v,now);
   latestFaces=result?.faceLandmarks||[];
   if(patientMode==="multi"){if(!latestFaces.length)for(let i=1;i<=4;i++)rearmState(multiStates[i],now,true);processMultiFaces();drawMultiScene()}
   else if(latestFaces[0])processFaceForPatient(latestFaces[0],patientCfgSingle(),multiStates.single,now);
   else rearmState(multiStates.single,now,true);
   if(latestFaces[0])drawSingleFaceScene();
  }
  if(patientMode==="multi")$('cameraStatus').textContent=recognitionMode==="hand"?(latestHands.length?`AI running — ${latestHands.length} hand${latestHands.length===1?"":"s"} detected`:"AI running — waiting for hands"):(latestFaces.length?`AI running — ${latestFaces.length} patient${latestFaces.length===1?"":"s"} detected`:"AI running — waiting for patients");
  else $("cameraStatus").textContent=recognitionMode==="hand"?(latestHands.length?"✋ Hand detected":"AI ready — show one hand"):(latestFaces.length?`AI running — ${recognitionMode} recognition`:"AI ready — show face/eyes");
 }catch(e){
  console.error("AI frame error",e);
  setCameraDiagnostic("⚠ AI frame skipped: "+(e?.message||e),false);
 }finally{processingFrame=false}
}
async function startCamera(){
 try{
  if(cameraRunning)return;
  setCameraDiagnostic("Checking browser camera and AI libraries…");
  if(!window.isSecureContext)throw new Error("Camera requires HTTPS or localhost. Open the Render HTTPS address.");
  if(!navigator.mediaDevices?.getUserMedia)throw new Error("Camera API is unavailable in this browser. Use Chrome over HTTPS.");
  if(recognitionMode==="hand")await ensureMediaPipeHands();else await ensureFaceLandmarker();
  const v=$("inputVideo");if(!v)throw new Error("Camera video element was not found");
  if(recognitionMode==="hand"){
   hands=new window.Hands({locateFile:f=>mediaPipeBase+f});
   hands.setOptions({maxNumHands:patientMode==="multi"?4:1,modelComplexity:1,staticImageMode:false,minDetectionConfidence:.58,minTrackingConfidence:.58});
   hands.onResults(patientMode==="multi"?handleMultiHandsResults:drawSingleScene);
  }else{
   // FaceLandmarker is initialized by ensureFaceLandmarker; no legacy Face Mesh WASM is used.
  }
  resetMultiStates();multiStates.single=makePatientState();latestHands=[];latestFaces=[];
  cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:1280,max:1280},height:{ideal:720,max:720},frameRate:{ideal:20,max:24}},audio:false});
  v.srcObject=cameraStream;v.muted=true;v.setAttribute("playsinline","");await v.play();
  cameraRunning=true;lastProcessTime=0;processingFrame=false;primeVoice();
  $("aiBadge").textContent=`${patientMode==="multi"?"MULTI-PATIENT":"SINGLE-PATIENT"} · ${recognitionMode.toUpperCase()} AI`;$("aiBadge").classList.add("running");
  $("cameraHint").textContent=patientMode==="multi"?"Place patients inside their assigned zones and demonstrate one communication action at a time.":recognitionMode==="hand"?"Show one hand, hold the gesture briefly, then lower your hand before the next detection.":recognitionMode==="eye"?"Show your face, perform one eye action, wait for the result, then prepare the next action.":"Show your face, perform one head action, wait for the result, then prepare the next action.";
  setCameraDiagnostic(`✓ Camera connected. ${patientMode==="multi"?"Up to 4 patients":"One patient"} · ${recognitionMode} recognition active.`,true);
  $("multiAiStatus").textContent=`${patientMode==="multi"?"Multi-patient":"Single-patient"} ${recognitionMode} recognition is ready.`;
  frameHandle=requestAnimationFrame(processVideoFrame);
 }catch(e){
  console.error("Camera start failed",e);stopCamera();
  let msg=e.message||"Camera could not start";
  if(e.name==="NotAllowedError")msg="Camera permission denied. Allow Camera for this site in Chrome settings, then press Start again.";
  else if(e.name==="NotFoundError")msg="No camera found on this device.";
  else if(e.name==="NotReadableError")msg="Camera is busy or being used by another application.";
  else if(e.name==="SecurityError")msg="Camera blocked by browser security. Use the HTTPS Render address.";
  setCameraDiagnostic("⚠ "+msg);toast(msg);
 }
}
function stopCamera(){cameraRunning=false;if(frameHandle)cancelAnimationFrame(frameHandle);frameHandle=null;processingFrame=false;if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null}const v=$("inputVideo");if(v)v.srcObject=null;if(hands){try{hands.close?.()}catch{}hands=null}if(faceLandmarker){try{faceLandmarker.close?.()}catch{}faceLandmarker=null}latestHands=[];latestFaces=[];$("cameraStatus").textContent="Camera is off";$("aiBadge").textContent="AI READY";$("aiBadge").classList.remove("running");resetMultiStates();multiStates.single=makePatientState();$("detectedNeed").textContent="Ready for the next intentional communication action";$("multiAiStatus").textContent=`${patientMode==="multi"?"Multi-patient":"Single-patient"} ${recognitionMode} recognition is stopped.`}
function setPatientMode(mode){if(cameraRunning)stopCamera();patientMode=mode;updateModeUI()}
function setRecognitionMode(mode){if(cameraRunning)stopCamera();recognitionMode=mode;updateModeUI()}
function updateModeUI(){$("singleModeBtn")?.classList.toggle("active",patientMode==="single");$("multiModeBtn")?.classList.toggle("active",patientMode==="multi");$("faceSingleModeBtn")?.classList.toggle("active",patientMode==="single");$("faceMultiModeBtn")?.classList.toggle("active",patientMode==="multi");$("multiRoomPanel")?.classList.toggle("hidden",patientMode!=="multi");$("faceMultiRoomPanel")?.classList.toggle("hidden",patientMode!=="multi");$("faceRecognitionBtn")?.classList.toggle("active",recognitionMode==="face");$("eyeRecognitionBtn")?.classList.toggle("active",recognitionMode==="eye");$("headRecognitionBtn")?.classList.toggle("active",recognitionMode==="head");const l=patientMode==="multi"?"Multi-Patient":"Single Patient";$("multiAiStatus").textContent=`${l} · ${recognitionMode} recognition selected. Press Start Camera AI.`}
function setCameraMode(mode){setPatientMode(mode)}
async function saveRoomLayout(){const payload={room:$("multiRoom").value.trim()||"204",beds:getAllBeds()};try{await api("/api/room-layout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});toast("Bed assignments saved")}catch(e){localStorage.setItem("caregesture-room-layout",JSON.stringify(payload));toast("Saved on this browser (server layout endpoint unavailable)")}}
async function loadRoomLayout(){try{const d=await api("/api/room-layout");if(d?.room)$("multiRoom").value=d.room;for(const b of d.beds||[]){$(`bed${b.bed}Id`).value=b.id;$(`bed${b.bed}Name`).value=b.name;$(`bed${b.bed}Lang`).value=b.lang||"en"}}
 catch{try{const d=JSON.parse(localStorage.getItem("caregesture-room-layout")||"null");if(d?.room)$("multiRoom").value=d.room;for(const b of d?.beds||[]){$(`bed${b.bed}Id`).value=b.id;$(`bed${b.bed}Name`).value=b.name;$(`bed${b.bed}Lang`).value=b.lang||"en"}}catch{}}
}
function updateMobilePanel(){const el=$("mobileServerUrl");if(el)el.textContent=location.origin}
document.addEventListener("DOMContentLoaded",()=>{
 loadRoomLayout();
 document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>page(b.dataset.page));
 $("openGestureBtn").onclick=()=>page("gesture");$("viewAlertsBtn").onclick=()=>page("alerts");$("openMobileBtn").onclick=()=>page("mobile");$("notifyBtn").onclick=enableNotifications;
 $("languageSelect").onchange=()=>updateGuide();
 document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");render()});
 document.addEventListener("click",e=>{const b=e.target.closest(".act");if(b)act(b.dataset.id,b.dataset.action)});

 $("cameraBtn").onclick=startCamera;$("voiceBtn")?.addEventListener("click",primeVoice);$("faceVoiceBtn")?.addEventListener("click",primeVoice);$("faceCameraBtn")?.addEventListener("click",startCamera);$("singleModeBtn").onclick=()=>setPatientMode("single");$("multiModeBtn").onclick=()=>setPatientMode("multi");$("faceSingleModeBtn")?.addEventListener("click",()=>setPatientMode("single"));$("faceMultiModeBtn")?.addEventListener("click",()=>setPatientMode("multi"));$("faceRecognitionBtn")?.addEventListener("click",()=>setRecognitionMode("face"));$("eyeRecognitionBtn")?.addEventListener("click",()=>setRecognitionMode("eye"));$("headRecognitionBtn")?.addEventListener("click",()=>setRecognitionMode("head"));$("saveRoomLayoutBtn").onclick=saveRoomLayout;$("stopCameraBtn").onclick=stopCamera;$("faceStopCameraBtn")?.addEventListener("click",stopCamera);$("copyMobileUrl").onclick=async()=>{try{await navigator.clipboard.writeText(location.origin);toast("Server URL copied")}catch{toast("Copy failed — use the URL shown above")}};
 $("reportForm").onsubmit=report;$("appointmentForm").onsubmit=appointment;
 $("closeAlertOverlay").onclick=(e)=>{e.preventDefault();e.stopPropagation();closeAlertOverlay()};
 $("alertOverlay").addEventListener("click",e=>{if(e.target===$("alertOverlay"))closeAlertOverlay()});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("alertOverlay").classList.contains("show"))closeAlertOverlay()});
 $("overlayVoiceBtn").onclick=(e)=>{e.preventDefault();e.stopPropagation();if(activeAlert){const a=normalizeAlert(activeAlert);speak(`${a.message}. Room ${a.room}. Bed ${a.bed}`,a.language)}};
 $("overlayAckBtn").onclick=async(e)=>{e.preventDefault();e.stopPropagation();const a=activeAlert?normalizeAlert(activeAlert):null;if(!a)return;closeAlertOverlay();if(!String(a.id).startsWith("LOCAL-")){try{await act(a.id,"acknowledge")}catch{}}};
 $("overlayResolveBtn").onclick=async(e)=>{e.preventDefault();e.stopPropagation();const a=activeAlert?normalizeAlert(activeAlert):null;if(!a)return;closeAlertOverlay();if(!String(a.id).startsWith("LOCAL-")){try{await act(a.id,"resolve")}catch{}}};
 updateGuide();updateModeUI();refresh();setInterval(refresh,3000);
});
