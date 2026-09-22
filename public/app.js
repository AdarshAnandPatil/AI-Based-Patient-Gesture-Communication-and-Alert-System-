let state={alerts:[],reports:[],appointments:[]},filter="all",activeAlert=null,camera=null;
const $=id=>document.getElementById(id);

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
 if(p==="gesture" && !cameraRunning){setTimeout(()=>startCamera(),150);}
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
function overlay(a){
 activeAlert=a;
 $("overlayMessage").textContent=a.message||"Patient alert";
 $("overlayMeta").textContent=`Room ${a.room||"-"} · Bed ${a.bed||"-"}`;
 $("overlayPatient").textContent=`Patient ${a.patientId||"-"} · ${a.patientName||"Patient"}`;
 $("overlayPriority").textContent=a.priority==="Critical"?"🚨 CRITICAL PATIENT ALERT":"🚨 PATIENT ALERT";
 const ov=$("alertOverlay");
 ov.classList.add("show");
 ov.setAttribute("aria-hidden","false");
}

function closeAlertOverlay(){
 const ov=$("alertOverlay");
 ov.classList.remove("show");ov.setAttribute("aria-hidden","true");
 activeAlert=null;emergencyModalOpen=false;
 try{speechSynthesis.cancel();speechSynthesis.resume?.()}catch{}
 const status=$("voiceStatus");if(status)status.textContent=(labels[$("languageSelect").value]||labels.en).voiceReady;
}
let emergencyModalOpen=false,lastEmergencyModalAt=0,emergencyLatched=false;

async function createGestureAlert(number){
 const g=gestureMap[number];if(!g)return;
 const l=$("languageSelect").value,tx=labels[l]||labels.en,message=tx[g.key];
 const payload={patientId:$("patientId").value,patientName:"Demo Patient",room:$("room").value,bed:$("bed").value,gesture:g.name,message,language:l,priority:g.priority,confidence:95};
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
  notifyAlert(a);updateLocalAlert(a);showDetection(number,true);
  if(g.key==="emergency"&&emergencyModalOpen){
   activeAlert=a;$("overlayMessage").textContent=a.message;$("overlayMeta").textContent=`Room ${a.room} · Bed ${a.bed}`;$("overlayPatient").textContent=`Patient ${a.patientId} · ${a.patientName||"Patient"}`;$("overlayPriority").textContent="🚨 CRITICAL PATIENT ALERT";
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
let cameraStream=null,hands=null,faceMesh=null,cameraRunning=false,processingFrame=false,lastProcessTime=0,frameHandle=null;
let mediaPipeBase="https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/";
let faceMeshBase="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/";
let cameraMode="single",latestHands=[],latestFaces=[],multiLastFrame=0;
const multiStates={};
const DEFAULT_BEDS={
  1:{id:"P1001",name:"Patient A",lang:"en"},2:{id:"P1002",name:"Patient B",lang:"en"},
  3:{id:"P1003",name:"Patient C",lang:"en"},4:{id:"P1004",name:"Patient D",lang:"en"}
};
const multiText={
 en:{face:"Face detected — patient assigned to bed",blink1:"Patient indicates YES / OK",blink2:"Patient needs HELP",blink3:"PATIENT EMERGENCY — IMMEDIATE HELP",blinkRapid:"Rapid repeated blinking — attention needed",long:"Prolonged eye closure — monitoring",headLeft:"Need Position Change / Turn Left",headRight:"Need Position Change / Turn Right",headUp:"Need Breathing Assistance / Raise Head",headDown:"Pain / Discomfort",headAttention:"Need Nurse Attention",headWorse:"Sudden Discomfort / Condition Change",headMonitoring:"Immediate Monitoring Required",headEmergency:"IMMEDIATE MEDICAL ASSISTANCE REQUIRED",pain:"Severe / sudden pain",breathing:"Difficulty breathing",fall:"Fall / injury",worsening:"Sudden worsening of condition",nurse:"Immediate need for nurse / doctor",faceDistress:"Possible discomfort / distress — monitoring",faceSmile:"Normal / Comfortable facial communication",faceOpen:"Need attention / mouth-open communication",faceFrown:"Possible pain / discomfort — monitoring",faceBreathing:"Possible breathing difficulty — monitoring",faceMonitoring:"Face communication unclear — monitoring"},
 kn:{face:"ಮುಖ ಪತ್ತೆಯಾಗಿದೆ — ರೋಗಿಯನ್ನು ಹಾಸಿಗೆಗೆ ಹೊಂದಿಸಲಾಗಿದೆ",blink1:"ರೋಗಿ ಹೌದು / ಸರಿ ಎಂದು ಸೂಚಿಸಿದ್ದಾರೆ",blink2:"ರೋಗಿಗೆ ಸಹಾಯ ಬೇಕಾಗಿದೆ",blink3:"ರೋಗಿಗೆ ತುರ್ತು ಸಹಾಯ ಬೇಕಾಗಿದೆ",blinkRapid:"ತ್ವರಿತವಾಗಿ ಕಣ್ಣು ಮಿಟುಕಿಸುವುದು — ಗಮನ ಅಗತ್ಯ",long:"ಕಣ್ಣು ದೀರ್ಘವಾಗಿ ಮುಚ್ಚಿದೆ — ಗಮನಿಸಲಾಗುತ್ತಿದೆ",headLeft:"ಸ್ಥಾನ ಬದಲಾವಣೆ / ಎಡಕ್ಕೆ ತಿರುಗಿಸಿ",headRight:"ಸ್ಥಾನ ಬದಲಾವಣೆ / ಬಲಕ್ಕೆ ತಿರುಗಿಸಿ",headUp:"ಉಸಿರಾಟಕ್ಕೆ ಸಹಾಯ / ತಲೆ ಮೇಲಕ್ಕೆ",headDown:"ನೋವು / ಅಸೌಕರ್ಯ",headAttention:"ನರ್ಸ್ ಗಮನ ಅಗತ್ಯ",headWorse:"ಅಕಸ್ಮಿಕ ಅಸೌಕರ್ಯ / ಸ್ಥಿತಿ ಬದಲಾವಣೆ",headMonitoring:"ತಕ್ಷಣ ಮೇಲ್ವಿಚಾರಣೆ ಅಗತ್ಯ",headEmergency:"ತಕ್ಷಣ ವೈದ್ಯಕೀಯ ಸಹಾಯ ಅಗತ್ಯ",pain:"ತೀವ್ರ / ಅಕಸ್ಮಿಕ ನೋವು",breathing:"ಉಸಿರಾಟದ ತೊಂದರೆ",fall:"ಬೀಳುವಿಕೆ / ಗಾಯ",worsening:"ಸ್ಥಿತಿ ಅಕಸ್ಮಿಕವಾಗಿ ಹದಗೆಟ್ಟಿದೆ",nurse:"ತಕ್ಷಣ ನರ್ಸ್ / ವೈದ್ಯರು ಬೇಕು",faceDistress:"ಅಸೌಕರ್ಯ / ತೊಂದರೆ ಸಾಧ್ಯತೆ — ಗಮನಿಸಲಾಗುತ್ತಿದೆ",faceSmile:"ಸಾಮಾನ್ಯ / ಆರಾಮದಾಯಕ ಮುಖ ಸಂವಹನ",faceOpen:"ಗಮನ ಬೇಕು / ಬಾಯಿ ತೆರೆಯುವ ಸಂವಹನ",faceFrown:"ನೋವು / ಅಸೌಕರ್ಯ ಸಾಧ್ಯತೆ — ಗಮನಿಸಲಾಗುತ್ತಿದೆ",faceBreathing:"ಉಸಿರಾಟದ ತೊಂದರೆ ಸಾಧ್ಯತೆ — ಗಮನಿಸಲಾಗುತ್ತಿದೆ",faceMonitoring:"ಮುಖ ಸಂವಹನ ಸ್ಪಷ್ಟವಿಲ್ಲ — ಗಮನಿಸಲಾಗುತ್ತಿದೆ"},
 hi:{face:"चेहरा पहचाना गया — मरीज को बेड से जोड़ा गया",blink1:"मरीज YES / OK संकेत दे रहा है",blink2:"मरीज को मदद चाहिए",blink3:"मरीज की आपात स्थिति — तुरंत मदद",blinkRapid:"तेजी से बार-बार पलक झपकाना — ध्यान चाहिए",long:"आंखें लंबे समय तक बंद — निगरानी",headLeft:"स्थिति बदलना / बाईं ओर मोड़ना",headRight:"स्थिति बदलना / दाईं ओर मोड़ना",headUp:"सांस लेने में सहायता / सिर ऊपर करना",headDown:"दर्द / असुविधा",headAttention:"नर्स का ध्यान चाहिए",headWorse:"अचानक असुविधा / स्थिति में बदलाव",headMonitoring:"तुरंत निगरानी आवश्यक",headEmergency:"तुरंत चिकित्सा सहायता आवश्यक",pain:"तेज / अचानक दर्द",breathing:"सांस लेने में कठिनाई",fall:"गिरना / चोट",worsening:"स्थिति अचानक बिगड़ना",nurse:"तुरंत नर्स / डॉक्टर चाहिए",faceDistress:"संभावित असुविधा / परेशानी — निगरानी",faceSmile:"सामान्य / आरामदायक चेहरे का संचार",faceOpen:"ध्यान चाहिए / मुंह खोलने का संकेत",faceFrown:"संभावित दर्द / असुविधा — निगरानी",faceBreathing:"संभावित सांस लेने में कठिनाई — निगरानी",faceMonitoring:"चेहरे का संकेत स्पष्ट नहीं — निगरानी"}
};

function getBedConfig(n){
 const d=DEFAULT_BEDS[n];
 const id=$(`bed${n}Id`)?.value?.trim()||d.id;
 const name=$(`bed${n}Name`)?.value?.trim()||d.name;
 const lang=$(`bed${n}Lang`)?.value||d.lang;
 return {bed:String(n),id,name,lang,room:$('multiRoom')?.value?.trim()||"204"};
}
function getAllBeds(){return [1,2,3,4].map(getBedConfig)}
function makePatientState(){return {gestureHistory:[],gestureCandidate:null,gestureSince:0,lastGesture:null,lastGestureAt:0,wasClosed:false,closedAt:0,blinkTimes:[],lastBlinkEventAt:0,lastRapidBlinkAt:0,lastLongAt:0,neutral:null,lastHeadAt:0,lastHeadDir:null,lastHeadSeq:[],headRepeatCount:0,lastFaceAt:0,eyeBaseline:0,eyeSamples:[],handHistory:[],lastHandEmergencyAt:0,lastFaceEventAt:0}}
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
async function ensureFaceMesh(){
 if(window.FaceMesh)return true;
 const version="0.4.1633559619";let lastError=null;
 for(const source of [{base:`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${version}/`,script:`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${version}/face_mesh.js`},{base:`https://unpkg.com/@mediapipe/face_mesh@${version}/`,script:`https://unpkg.com/@mediapipe/face_mesh@${version}/face_mesh.js`}]){
  try{await loadScript(source.script,"face");if(window.FaceMesh){faceMeshBase=source.base;return true}}catch(e){lastError=e}
 }
 throw lastError||new Error("MediaPipe Face Mesh library could not be loaded")
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
 const wrist=lm[0],index=lm[8],openPalm=number>=4,fist=number===0;
 const point={x:wrist.x,y:wrist.y,z:wrist.z||0,open:openPalm,number,at:now};st.handHistory.push(point);st.handHistory=st.handHistory.filter(p=>now-p.at<2200);
 if(st.handHistory.length<4)return null;
 const recent=st.handHistory.slice(-Math.min(12,st.handHistory.length)),first=recent[0],last=recent[recent.length-1];
 const dx=last.x-first.x,dy=last.y-first.y,dz=last.z-first.z;
 const maxX=Math.max(...recent.map(p=>p.x))-Math.min(...recent.map(p=>p.x));
 const maxY=Math.max(...recent.map(p=>p.y))-Math.min(...recent.map(p=>p.y));
 const zSpan=Math.max(...recent.map(p=>p.z))-Math.min(...recent.map(p=>p.z));
 const nowOpen=recent.slice(-5).filter(p=>p.open).length>=3;
 if(now-st.lastHandEmergencyAt<2200)return null;
 // Open palm moving toward/away from camera = breathing difficulty.
 if(nowOpen&&zSpan>.10){st.lastHandEmergencyAt=now;return {key:"breathing",name:"Emergency Action — Difficulty Breathing",priority:"Critical",emoji:"🫁"}}
 // Open palm with a sharp downward movement = fall/injury signal.
 if(nowOpen&&dy>.18&&Math.abs(dy)>Math.abs(dx)*1.25){st.lastHandEmergencyAt=now;return {key:"fall",name:"Emergency Action — Fall / Injury",priority:"Critical",emoji:"🩹"}}
 // Rapid left/right waving = sudden worsening.
 let changes=0;for(let i=1;i<recent.length;i++){const a=recent[i-1].x,b=recent[i].x;if(Math.abs(b-a)>.045)changes++}if(nowOpen&&changes>=4&&maxX>.20){st.lastHandEmergencyAt=now;return {key:"worsening",name:"Emergency Action — Sudden Worsening",priority:"Critical",emoji:"⚠️"}}
 // Repeated fist movement in/out of the center = severe/sudden pain signal.
 if(fist&&recent.filter(p=>p.number===0).length>=4&&maxY>.16){st.lastHandEmergencyAt=now;return {key:"pain",name:"Emergency Action — Severe / Sudden Pain",priority:"Critical",emoji:"😣"}}
 // Raised open palm held high for 2 seconds = immediate nurse/doctor.
 if(openPalm&&last.y<.34&&recent.filter(p=>p.open).length>=8){st.lastHandEmergencyAt=now;return {key:"nurse",name:"Emergency Action — Immediate Nurse / Doctor",priority:"Critical",emoji:"👩‍⚕️"}}
 return null;
}
function patientTextForEvent(cfg,type){const t=multiText[cfg.lang]||multiText.en;return t[type]||type}
function patientVoiceForEvent(cfg,type){const t=multiText[cfg.lang]||multiText.en;return t[type]||type}

function drawMultiScene(){
 const c=$("outputCanvas"),ctx=c?.getContext("2d"),v=$("inputVideo");if(!ctx||!v)return;
 const w=v.videoWidth||640,vh=v.videoHeight||480;if(c.width!==w)c.width=w;if(c.height!==vh)c.height=vh;
 ctx.clearRect(0,0,w,vh);
 // Fixed bed zones
 const zones=[{b:1,x:0,y:0,w:.5,h:.5},{b:2,x:.5,y:0,w:.5,h:.5},{b:3,x:0,y:.5,w:.5,h:.5},{b:4,x:.5,y:.5,w:.5,h:.5}];
 ctx.lineWidth=3;ctx.strokeStyle="rgba(255,255,255,.8)";ctx.fillStyle="rgba(15,24,39,.55)";ctx.font="bold 15px Arial";
 zones.forEach(z=>{ctx.strokeRect(z.x*w,z.y*vh,z.w*w,z.h*vh);const cfg=getBedConfig(z.b);ctx.fillRect(z.x*w+7,z.y*vh+7,Math.min(250,w*z.w-14),28);ctx.fillStyle="#fff";ctx.fillText(`BED ${z.b} · ${cfg.id}`,z.x*w+14,z.y*vh+27);ctx.fillStyle="rgba(15,24,39,.55)"});
 // faces
 latestFaces.forEach((lm,i)=>{const box=faceBox(lm),bed=bedForPoint(box.cx,box.cy),cfg=getBedConfig(bed);const color="#7c4dff";ctx.strokeStyle=color;ctx.lineWidth=3;ctx.strokeRect(box.minX*w,box.minY*vh,box.w*w,box.h*vh);ctx.fillStyle=color;ctx.font="bold 14px Arial";ctx.fillText(`${cfg.id} · Bed ${bed}`,box.minX*w,Math.max(18,box.minY*vh-5));ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(lm[1].x*w,lm[1].y*vh,5,0,Math.PI*2);ctx.fill()});
 // hands and association
 latestHands.forEach(handLm=>{const wrist=handLm[0];let best=null,bestD=Infinity;latestFaces.forEach((f,i)=>{const b=faceBox(f),d=Math.hypot(wrist.x-b.cx,wrist.y-b.cy);if(d<bestD){bestD=d;best={face:i,box:b}}});if(!best||bestD>.38)return;const bed=bedForPoint(best.box.cx,best.box.cy),cfg=getBedConfig(bed);ctx.strokeStyle="#20d46b";ctx.fillStyle="#20d46b";handLm.forEach(p=>{ctx.beginPath();ctx.arc(p.x*w,p.y*vh,3.5,0,Math.PI*2);ctx.fill()});ctx.font="bold 14px Arial";ctx.fillText(`${cfg.id} · ${countFingers(handLm)} fingers`,wrist.x*w+8,wrist.y*vh-8)});
}

async function createMultiAlert(cfg,gesture,message,priority="Normal",confidence=92,voiceText=message){
 const payload={patientId:cfg.id,patientName:cfg.name,room:cfg.room,bed:cfg.bed,gesture,message,language:cfg.lang,priority,confidence};
 const key=`${cfg.bed}|${gesture}`;const now=Date.now();const st=multiStates[cfg.bed];
 if(st.lastGesture===key&&now-st.lastGestureAt<2500)return;
 st.lastGesture=key;st.lastGestureAt=now;
 if(priority==="Critical"){const localAlert={id:"LOCAL-"+now,...payload,status:"Saving…",createdAt:new Date().toISOString(),acknowledgedAt:null,resolvedAt:null};overlay(localAlert)}
 showMultiEvent(cfg,gesture,message,priority);speak(voiceText,cfg.lang);
 try{const a=await api("/api/alerts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});notifyAlert(a);updateLocalAlert(a);if(priority==="Critical"&&activeAlert){activeAlert=a;$("overlayMessage").textContent=a.message;$("overlayMeta").textContent=`Room ${a.room} · Bed ${a.bed}`;$("overlayPatient").textContent=`Patient ${a.patientId} · ${a.patientName||"Patient"}`;$("overlayPriority").textContent="🚨 CRITICAL PATIENT ALERT"}}
 catch(e){console.warn("Multi alert failed",e);toast(`Detected Bed ${cfg.bed}, but alert could not be saved.`)}
}
function showMultiEvent(cfg,gesture,message,priority){
 const p=$('multiAiStatus');if(p)p.textContent=`${priority==="Critical"?"🚨":"✓"} Bed ${cfg.bed} · ${cfg.id} · ${message}`;
 const d=$('detectedGesture');if(d)d.textContent=`Bed ${cfg.bed} · ${gesture}`;
 const e=$('detectedEmoji');if(e)e.textContent=gesture.includes("Emergency")||priority==="Critical"?"🚨":"👤";
 const n=$('detectedNeed');if(n)n.textContent=message;
 const sub=$('detectedDetail');if(sub)sub.textContent=`${cfg.name} · Room ${cfg.room} · Bed ${cfg.bed}`;
 $('detectionPanel')?.classList.toggle('emergency-detection',priority==="Critical");
}
function patientCfgSingle(){return {_stateKey:"single",bed:String($("bed")?.value?.trim()||"3"),id:$("patientId")?.value?.trim()||"P1001",name:$("patientName")?.value?.trim()||"Demo Patient",lang:$("languageSelect")?.value||"en",room:$("room")?.value?.trim()||"204"}}
function processHandForPatient(h,cfg,st,now){
 const number=countFingers(h);const motion=handMotionEvent(st,h,number,now);if(motion){const tx=multiText[cfg.lang]||multiText.en;createMultiAlert(cfg,motion.name,tx[motion.key]||motion.name,motion.priority,96,tx[motion.key]||motion.name);return true}
 st.gestureHistory.push(number);if(st.gestureHistory.length>7)st.gestureHistory.shift();const freq={};st.gestureHistory.forEach(n=>freq[n]=(freq[n]||0)+1);const top=Object.entries(freq).sort((a,b)=>b[1]-a[1])[0];if(!top||+top[1]<5)return false;
 const detected=+top[0];if(st.gestureCandidate!==detected){st.gestureCandidate=detected;st.gestureSince=now;return false}if(now-st.gestureSince<400)return false;
 const key=`gesture:${detected}`;if(st.lastGesture===key&&now-st.lastGestureAt<3500)return false;st.lastGesture=key;st.lastGestureAt=now;
 const g=gestureMap[detected],tx=labels[cfg.lang]||labels.en;const message=tx[g.key];showPatientEvent(cfg,g.name,message,g.priority,g.emoji);
 createMultiAlert(cfg,g.name,message,g.priority,95,{food:tx.voice,water:tx.water,nurse:tx.nurseVoice,toilet:tx.toiletVoice,emergency:tx.emergencyVoice,ok:tx.okVoice}[g.key]);return true;
}
function showPatientEvent(cfg,gesture,message,priority,emoji="👤"){$("multiAiStatus").textContent=`${priority==="Critical"?"🚨":"✓"} ${cfg.id} · Bed ${cfg.bed} · ${message}`;$('detectedGesture').textContent=`${emoji} ${gesture}`;$('detectedEmoji').textContent=emoji;$('detectedNeed').textContent=message;$('detectedDetail').textContent=`${cfg.name} · Room ${cfg.room} · Bed ${cfg.bed}`;$('detectionPanel')?.classList.toggle('emergency-detection',priority==="Critical")}
async function createMultiAlert(cfg,gesture,message,priority="Normal",confidence=92,voiceText=message){
 const payload={patientId:cfg.id,patientName:cfg.name,room:cfg.room,bed:cfg.bed,gesture,message,language:cfg.lang,priority,confidence};const key=`${cfg._stateKey||cfg.bed}|${gesture}`,now=Date.now(),st=multiStates[cfg._stateKey||cfg.bed]||makePatientState();
 if(st.lastAlertKey===key&&now-(st.lastAlertAt||0)<2500)return;st.lastAlertKey=key;st.lastAlertAt=now;
 if(priority==="Critical"){const localAlert={id:"LOCAL-"+now,...payload,status:"Saving…",createdAt:new Date().toISOString(),acknowledgedAt:null,resolvedAt:null};overlay(localAlert)}
 showPatientEvent(cfg,gesture,message,priority,gesture.includes("Emergency")?"🚨":"👤");speak(voiceText,cfg.lang);
 try{const a=await api("/api/alerts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});notifyAlert(a);updateLocalAlert(a);if(priority==="Critical"&&activeAlert){activeAlert=a;$("overlayMessage").textContent=a.message;$("overlayMeta").textContent=`Room ${a.room} · Bed ${a.bed}`;$("overlayPatient").textContent=`Patient ${a.patientId} · ${a.patientName||"Patient"}`;$("overlayPriority").textContent="🚨 CRITICAL PATIENT ALERT"}}catch(e){console.warn("Alert save failed",e);toast(`Bed ${cfg.bed}: alert detected, but server save failed.`)}
}
function processMultiHands(){latestHands.forEach(h=>{if(!latestFaces.length)return;const wrist=h[0];let best=null,bestD=Infinity;latestFaces.forEach(f=>{const b=faceBox(f),d=Math.hypot(wrist.x-b.cx,wrist.y-b.cy);if(d<bestD){bestD=d;best=b}});if(!best||bestD>.42)return;const bed=bedForPoint(best.cx,best.cy),cfg=getBedConfig(bed),st=multiStates[bed],now=Date.now();processHandForPatient(h,cfg,st,now)})}
function processFaceForPatient(lm,cfg,st,now){
 st.lastFaceAt=now;
 const box=faceBox(lm),eye=eyeOpenScore(lm),event=updateEyeState(st,eye,now),tx=multiText[cfg.lang]||multiText.en;
 if(event){if(event.kind==="blink3")createMultiAlert(cfg,"3 Blinks — Emergency",tx.blink3,"Critical",94,tx.blink3);else if(event.kind==="blink2")createMultiAlert(cfg,"2 Blinks — Need Help",tx.blink2,"High",93,tx.blink2);else if(event.kind==="blinkRapid")createMultiAlert(cfg,"Rapid Repeated Blinking — Attention",tx.blinkRapid,"High",91,tx.blinkRapid);else if(event.kind==="long")createMultiAlert(cfg,"Prolonged Eye Closure",tx.long,"High",90,tx.long)}
 if(st.pendingBlink1){st.pendingBlink1=false;createMultiAlert(cfg,"1 Blink — Yes / OK",tx.blink1,"Normal",90,tx.blink1)}
 const dir=getHeadDirection(lm,box,st);
 if(dir&&now-st.lastHeadAt>650){
  const same=dir===st.lastHeadDir;st.headRepeatCount=same?(st.headRepeatCount||1)+1:1;st.lastHeadAt=now;st.lastHeadDir=dir;
  const key=headActionForState(st,dir,now);
  const priority=key==="headEmergency"?"Critical":(key==="headAttention"||key==="headWorse"||key==="headMonitoring")?"High":"Normal";createMultiAlert(cfg,`Head Action — ${key}`,tx[key],priority,key==="headEmergency"?97:88,tx[key]);
 }else if(!dir&&now-st.lastHeadAt>1800){st.lastHeadDir=null;st.headRepeatCount=0}
 // Simple sustained facial communication. These are communication/monitoring signals, not diagnoses.
 const mouthOpen=distance(lm[13],lm[14])/Math.max(distance(lm[61],lm[291]),.001);
 const mouthWidth=Math.max(distance(lm[61],lm[291]),.001),cornerAvgY=(lm[61].y+lm[291].y)/2,centerY=(lm[13].y+lm[14].y)/2;
 const smile=(centerY-cornerAvgY)/mouthWidth>.10, frown=(cornerAvgY-centerY)/mouthWidth>.13;
 const faceSignal=mouthOpen>.36?"breathing":smile?"smile":frown?"frown":"monitoring";
 if(faceSignal===st.faceSignal){st.faceSignalSince=st.faceSignalSince||now;if(now-st.faceSignalSince>1200&&now-(st.lastFaceEventAt||0)>8000){st.lastFaceEventAt=now;const key=faceSignal==="breathing"?"faceBreathing":faceSignal==="smile"?"faceSmile":faceSignal==="frown"?"faceFrown":"faceMonitoring";const priority=key==="faceBreathing"?"High":"Normal";createMultiAlert(cfg,`Face — ${key}`,tx[key],priority,key==="faceBreathing"?86:80,tx[key]);st.faceSignalSince=now+4000}}
 else {st.faceSignal=faceSignal;st.faceSignalSince=now}
}
function processMultiFaces(){const now=Date.now();latestFaces.forEach(lm=>{const box=faceBox(lm),bed=bedForPoint(box.cx,box.cy),cfg=getBedConfig(bed),st=multiStates[bed];processFaceForPatient(lm,cfg,st,now)})}
function handleMultiHandsResults(r){latestHands=r.multiHandLandmarks||[]}
function handleMultiFaceResults(r){latestFaces=r.multiFaceLandmarks||[]}
function drawSingleScene(r){
 const c=$("outputCanvas"),ctx=c.getContext("2d"),v=$("inputVideo"),w=v.videoWidth||640,h=v.videoHeight||480;if(c.width!==w)c.width=w;if(c.height!==h)c.height=h;ctx.clearRect(0,0,c.width,c.height);
 const lm=r.multiHandLandmarks?.[0];if(lm){const cfg=patientCfgSingle(),st=multiStates.single||makePatientState();multiStates.single=st;const now=Date.now();ctx.fillStyle="#20d46b";lm.forEach(p=>{ctx.beginPath();ctx.arc(p.x*c.width,p.y*c.height,4,0,Math.PI*2);ctx.fill()});processHandForPatient(lm,cfg,st,now);$("cameraHint").classList.add("hidden");$("cameraStatus").textContent="✋ Hand detected"}
}
function drawSingleFaceScene(){
 const c=$("outputCanvas"),ctx=c.getContext("2d"),v=$("inputVideo"),lm=latestFaces[0];if(!lm)return;const w=v.videoWidth||640,h=v.videoHeight||480;ctx.strokeStyle="#7c4dff";ctx.lineWidth=3;const b=faceBox(lm);ctx.strokeRect(b.minX*w,b.minY*h,b.w*w,b.h*h);ctx.fillStyle="#7c4dff";ctx.font="bold 14px Arial";ctx.fillText(`${patientCfgSingle().id} · Face / Eye / Head`,b.minX*w,Math.max(18,b.minY*h-5))}
async function processVideoFrame(now){
 if(!cameraRunning)return;frameHandle=requestAnimationFrame(processVideoFrame);const v=$("inputVideo");if(v.readyState<2||!hands||processingFrame)return;if(now-lastProcessTime<100)return;lastProcessTime=now;processingFrame=true;
 try{await hands.send({image:v});if(faceMesh)await faceMesh.send({image:v});if(cameraMode==="multi"){processMultiHands();processMultiFaces();drawMultiScene();$("cameraStatus").textContent=latestFaces.length?`AI running — ${latestFaces.length} face${latestFaces.length===1?"":"s"} detected`:`AI running — waiting for patients`;}else{const st=multiStates.single||makePatientState();multiStates.single=st;const cfg=patientCfgSingle();if(latestFaces[0]){processFaceForPatient(latestFaces[0],cfg,st,now);drawSingleFaceScene()}$("cameraStatus").textContent=latestFaces[0]?"AI running — hand + face + eye + head monitoring":"AI running — show hand or face";$("cameraHint").classList.toggle("hidden",!!(latestHands.length||latestFaces.length));}}
 catch(e){console.error("AI frame error",e);setCameraDiagnostic("AI frame error: "+e.message)}finally{processingFrame=false}}
async function startCamera(){
 try{if(cameraRunning)return;setCameraDiagnostic("Checking browser camera and AI libraries…");if(!window.isSecureContext)throw new Error("Camera requires HTTPS or localhost. Open the Render HTTPS address.");if(!navigator.mediaDevices?.getUserMedia)throw new Error("Camera API is unavailable in this browser. Use Chrome over HTTPS.");await ensureMediaPipeHands();await ensureFaceMesh();const v=$("inputVideo");if(!v)throw new Error("Camera video element was not found");
  hands=new window.Hands({locateFile:f=>mediaPipeBase+f});hands.setOptions({maxNumHands:cameraMode==="multi"?4:1,modelComplexity:1,staticImageMode:false,minDetectionConfidence:.58,minTrackingConfidence:.58});hands.onResults(cameraMode==="multi"?handleMultiHandsResults:drawSingleScene);
  faceMesh=new window.FaceMesh({locateFile:f=>faceMeshBase+f});faceMesh.setOptions({maxNumFaces:cameraMode==="multi"?4:1,refineLandmarks:true,minDetectionConfidence:.58,minTrackingConfidence:.58});faceMesh.onResults(handleMultiFaceResults);resetMultiStates();multiStates.single=makePatientState();latestHands=[];latestFaces=[];
  cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:1280,max:1280},height:{ideal:720,max:720},frameRate:{ideal:15,max:20}},audio:false});v.srcObject=cameraStream;v.muted=true;v.setAttribute("playsinline","");await v.play();cameraRunning=true;lastProcessTime=0;processingFrame=false;stableCounts=[];candidateGesture=null;candidateSince=0;lastDetected=null;lastSentGesture=null;primeVoice();$("aiBadge").textContent=cameraMode==="multi"?"MULTI-PATIENT AI RUNNING":"SINGLE-PATIENT MULTIMODAL AI";$("aiBadge").classList.add("running");$("cameraHint").textContent=cameraMode==="multi"?"Place each patient inside the assigned bed zone":"Show a hand or face clearly";setCameraDiagnostic(cameraMode==="multi"?"✓ One camera is monitoring hand, face, eye and head communication for up to 4 bed zones.":"✓ Camera connected. Hand + face + eye + head communication is active.",true);$("multiAiStatus").textContent=cameraMode==="multi"?"Multi-patient AI is ready: face → bed → hand/eye/head action.":"Single-patient multimodal AI is ready.";frameHandle=requestAnimationFrame(processVideoFrame);
 }catch(e){console.error("Camera start failed",e);stopCamera();let msg=e.message||"Camera could not start";if(e.name==="NotAllowedError")msg="Camera permission denied. Allow Camera for this site in Chrome settings, then press Start again.";else if(e.name==="NotFoundError")msg="No camera found on this device.";else if(e.name==="NotReadableError")msg="Camera is busy or being used by another application.";else if(e.name==="SecurityError")msg="Camera blocked by browser security. Use the HTTPS Render address.";setCameraDiagnostic("⚠ "+msg);toast(msg)}
}
function stopCamera(){cameraRunning=false;if(frameHandle)cancelAnimationFrame(frameHandle);frameHandle=null;processingFrame=false;if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null}const v=$("inputVideo");if(v)v.srcObject=null;if(hands){try{hands.close?.()}catch{}hands=null}if(faceMesh){try{faceMesh.close?.()}catch{}faceMesh=null}latestHands=[];latestFaces=[];$("cameraStatus").textContent="Camera is off";$("aiBadge").textContent="AI READY";$("aiBadge").classList.remove("running");stableCounts=[];candidateGesture=null;candidateSince=0;lastDetected=null;lastSentGesture=null;emergencyLatched=false;resetMultiStates();multiStates.single=makePatientState();const l=$("languageSelect").value;$("detectedGesture").textContent=(labels[l]||labels.en).waiting;$("detectedEmoji").textContent="✋";$("detectedNeed").textContent="Show your hand or patient face to communicate";$("multiAiStatus").textContent=cameraMode==="multi"?"Multi-patient AI is stopped.":"Single-patient hand mode is ready."}
function setCameraMode(mode){if(cameraMode===mode)return;if(cameraRunning)stopCamera();cameraMode=mode;$("singleModeBtn")?.classList.toggle("active",mode==="single");$("multiModeBtn")?.classList.toggle("active",mode==="multi");$("multiRoomPanel")?.classList.toggle("hidden",mode!=="multi");$("cameraHint").textContent=mode==="multi"?"Place each patient inside the assigned bed zone":"Press “Start Camera AI” and show your hand";$("multiAiStatus").textContent=mode==="multi"?"Multi-patient room mode: configure beds, then start the camera.":"Single-patient hand mode is ready."}
async function saveRoomLayout(){const payload={room:$("multiRoom").value.trim()||"204",beds:getAllBeds()};try{await api("/api/room-layout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});toast("Bed assignments saved")}catch(e){localStorage.setItem("caregesture-room-layout",JSON.stringify(payload));toast("Saved on this browser (server layout endpoint unavailable)")}}
async function loadRoomLayout(){try{const d=await api("/api/room-layout");if(d?.room)$("multiRoom").value=d.room;for(const b of d.beds||[]){$(`bed${b.bed}Id`).value=b.id;$(`bed${b.bed}Name`).value=b.name;$(`bed${b.bed}Lang`).value=b.lang||"en"}}
 catch{try{const d=JSON.parse(localStorage.getItem("caregesture-room-layout")||"null");if(d?.room)$("multiRoom").value=d.room;for(const b of d?.beds||[]){$(`bed${b.bed}Id`).value=b.id;$(`bed${b.bed}Name`).value=b.name;$(`bed${b.bed}Lang`).value=b.lang||"en"}}catch{}}
}
function updateMobilePanel(){const el=$("mobileServerUrl");if(el)el.textContent=location.origin}
document.addEventListener("DOMContentLoaded",()=>{
 loadRoomLayout();
 document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>page(b.dataset.page));
 $("openGestureBtn").onclick=()=>page("gesture");$("viewAlertsBtn").onclick=()=>page("alerts");$("openMobileBtn").onclick=()=>page("mobile");$("notifyBtn").onclick=notifyEnable;
 $("languageSelect").onchange=()=>updateGuide();
 document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");render()});
 document.addEventListener("click",e=>{const b=e.target.closest(".act");if(b)act(b.dataset.id,b.dataset.action)});
 $("openMultiCameraBtn").onclick=()=>{setCameraMode("multi");page("gesture")};
 $("cameraBtn").onclick=startCamera;$("singleModeBtn").onclick=()=>setCameraMode("single");$("multiModeBtn").onclick=()=>setCameraMode("multi");$("saveRoomLayoutBtn").onclick=saveRoomLayout;$("stopCameraBtn").onclick=stopCamera;$("copyMobileUrl").onclick=async()=>{try{await navigator.clipboard.writeText(location.origin);toast("Server URL copied")}catch{toast("Copy failed — use the URL shown above")}};
 $("reportForm").onsubmit=report;$("appointmentForm").onsubmit=appointment;
 $("closeAlertOverlay").onclick=(e)=>{e.preventDefault();e.stopPropagation();closeAlertOverlay()};
 $("alertOverlay").addEventListener("click",e=>{if(e.target===$("alertOverlay"))closeAlertOverlay()});
 $("overlayVoiceBtn").onclick=()=>activeAlert&&speak(`${activeAlert.message}. Room ${activeAlert.room}. Bed ${activeAlert.bed}`,activeAlert.language);
 $("overlayAckBtn").onclick=async()=>{const a=activeAlert;if(!a)return;closeAlertOverlay();if(!String(a.id).startsWith("LOCAL-")){try{await act(a.id,"acknowledge")}catch{}}};
 $("overlayResolveBtn").onclick=async()=>{const a=activeAlert;if(!a)return;closeAlertOverlay();if(!String(a.id).startsWith("LOCAL-")){try{await act(a.id,"resolve")}catch{}}};
 updateGuide();refresh();setInterval(refresh,3000);
});
