let state={alerts:[],reports:[],appointments:[]},filter="all",activeAlert=null,camera=null;
const $=id=>document.getElementById(id);

const langs={en:"en-IN",kn:"kn-IN",hi:"hi-IN"};
const labels={
 en:{food:"PATIENT NEEDS FOOD",water:"PATIENT NEEDS WATER",nurse:"PATIENT NEEDS NURSE",help:"PATIENT NEEDS HELP",emergency:"EMERGENCY — DOCTOR / NURSE NEEDED",ok:"ALL OK",detect:"FINGERS DETECTED",waiting:"Waiting for hand gesture…",detail:"AI is watching the hand landmarks automatically.",voiceReady:"🔊 Automatic voice is ready",voice:"Patient needs food.",waterVoice:"Patient needs water.",nurseVoice:"Patient needs a nurse.",helpVoice:"Patient needs help.",emergencyVoice:"Emergency. Doctor or nurse is needed.",okVoice:"Patient is all okay."},
 kn:{food:"ರೋಗಿಗೆ ಆಹಾರ ಬೇಕಾಗಿದೆ",water:"ರೋಗಿಗೆ ನೀರು ಬೇಕಾಗಿದೆ",nurse:"ರೋಗಿಗೆ ನರ್ಸ್ ಬೇಕಾಗಿದೆ",help:"ರೋಗಿಗೆ ಸಹಾಯ ಬೇಕಾಗಿದೆ",emergency:"ತುರ್ತು — ವೈದ್ಯರು / ನರ್ಸ್ ಬೇಕು",ok:"ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ",detect:"ಬೆರಳುಗಳು ಪತ್ತೆಯಾಗಿವೆ",waiting:"ಕೈ ಸನ್ನೆಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ…",detail:"AI ಕೈಯ ಲ್ಯಾಂಡ್‌ಮಾರ್ಕ್‌ಗಳನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಗಮನಿಸುತ್ತಿದೆ.",voiceReady:"🔊 ಸ್ವಯಂಚಾಲಿತ ಧ್ವನಿ ಸಿದ್ಧವಾಗಿದೆ",voice:"ರೋಗಿಗೆ ಆಹಾರ ಬೇಕಾಗಿದೆ.",waterVoice:"ರೋಗಿಗೆ ನೀರು ಬೇಕಾಗಿದೆ.",nurseVoice:"ರೋಗಿಗೆ ನರ್ಸ್ ಬೇಕಾಗಿದೆ.",helpVoice:"ರೋಗಿಗೆ ಸಹಾಯ ಬೇಕಾಗಿದೆ.",emergencyVoice:"ತುರ್ತು ಪರಿಸ್ಥಿತಿ. ವೈದ್ಯರು ಅಥವಾ ನರ್ಸ್ ಬೇಕು.",okVoice:"ರೋಗಿ ಸಂಪೂರ್ಣವಾಗಿ ಸರಿಯಾಗಿದ್ದಾರೆ."},
 hi:{food:"मरीज को खाना चाहिए",water:"मरीज को पानी चाहिए",nurse:"मरीज को नर्स चाहिए",help:"मरीज को मदद चाहिए",emergency:"आपातकाल — डॉक्टर / नर्स की जरूरत है",ok:"सब ठीक है",detect:"उंगलियां पहचानी गईं",waiting:"हाथ के इशारे का इंतजार…",detail:"AI हाथ के लैंडमार्क को अपने आप पहचान रहा है।",voiceReady:"🔊 स्वचालित आवाज तैयार है",voice:"मरीज को खाना चाहिए।",waterVoice:"मरीज को पानी चाहिए।",nurseVoice:"मरीज को नर्स चाहिए।",helpVoice:"मरीज को मदद चाहिए।",emergencyVoice:"आपातकाल। डॉक्टर या नर्स की जरूरत है।",okVoice:"मरीज बिल्कुल ठीक है।"}
};
const guideText={
 en:{food:"Food",foodSub:"Patient needs food",water:"Water",waterSub:"Patient needs water",nurse:"Nurse",nurseSub:"Patient needs nurse",help:"Help",helpSub:"Patient needs help",emergency:"Emergency",emergencySub:"Emergency assistance",ok:"All OK",okSub:"Everything is okay"},
 kn:{food:"ಆಹಾರ",foodSub:"ರೋಗಿಗೆ ಆಹಾರ ಬೇಕಾಗಿದೆ",water:"ನೀರು",waterSub:"ರೋಗಿಗೆ ನೀರು ಬೇಕಾಗಿದೆ",nurse:"ನರ್ಸ್",nurseSub:"ರೋಗಿಗೆ ನರ್ಸ್ ಬೇಕಾಗಿದೆ",help:"ಸಹಾಯ",helpSub:"ರೋಗಿಗೆ ಸಹಾಯ ಬೇಕಾಗಿದೆ",emergency:"ತುರ್ತು",emergencySub:"ತುರ್ತು ಸಹಾಯ",ok:"ಎಲ್ಲವೂ ಸರಿ",okSub:"ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ"},
 hi:{food:"खाना",foodSub:"मरीज को खाना चाहिए",water:"पानी",waterSub:"मरीज को पानी चाहिए",nurse:"नर्स",nurseSub:"मरीज को नर्स चाहिए",help:"मदद",helpSub:"मरीज को मदद चाहिए",emergency:"आपातकाल",emergencySub:"आपातकालीन सहायता",ok:"सब ठीक",okSub:"सब कुछ ठीक है"}
};

const gestureMap={
 1:{key:"water",name:"1 Finger",emoji:"☝️",priority:"Normal"},
 2:{key:"food",name:"2 Fingers",emoji:"✌️",priority:"Normal"},
 3:{key:"nurse",name:"3 Fingers",emoji:"🤟",priority:"High"},
 4:{key:"help",name:"4 Fingers",emoji:"🖖",priority:"High"},
 5:{key:"emergency",name:"5 Fingers",emoji:"🖐️",priority:"Critical"},
 0:{key:"ok",name:"0 Fingers",emoji:"✊",priority:"Normal"}
};

function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function toast(t){$("toast").textContent=t;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2400)}
function page(p){
 document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));
 const target=$(p); if(target)target.classList.add("active");
 document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===p));
 $("pageTitle").textContent={dashboard:"Nurse Dashboard",gesture:"Gesture Communication",alerts:"Alert Center",patient:"Patient Care",reports:"Medical Reports",appointments:"Appointments",analytics:"Analytics",faceeye:"Face & Eye AI",mobile:"Mobile App",test:"Test All Modules"}[p]||p;
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
 const voiceText={food:tx.voice,water:tx.waterVoice,nurse:tx.nurseVoice,help:tx.helpVoice,emergency:tx.emergencyVoice,ok:tx.okVoice}[g.key];
 speak(voiceText,l);
}
function updateGuide(){
 const l=$("languageSelect").value,t=guideText[l]||guideText.en;
 $("guideWater").textContent=t.water;$("guideWaterSub").textContent=t.waterSub;$("guideFood").textContent=t.food;$("guideFoodSub").textContent=t.foodSub;
 $("guideNurse").textContent=t.nurse;$("guideNurseSub").textContent=t.nurseSub;$("guideHelp").textContent=t.help;$("guideHelpSub").textContent=t.helpSub;
 $("guideEmergency").textContent=t.emergency;$("guideEmergencySub").textContent=t.emergencySub;$("guideOk").textContent=t.ok;$("guideOkSub").textContent=t.okSub;
 $("patientLang").textContent={en:"English",kn:"Kannada",hi:"Hindi"}[l];if(lastDetected!==null)showDetection(lastDetected,false);
}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
function angle(a,b,c){const ab={x:a.x-b.x,y:a.y-b.y},cb={x:c.x-b.x,y:c.y-b.y},dot=ab.x*cb.x+ab.y*cb.y,den=Math.hypot(ab.x,ab.y)*Math.hypot(cb.x,cb.y);return den?Math.acos(Math.max(-1,Math.min(1,dot/den)))*180/Math.PI:0}
function fingerExtended(lm,mcp,pip,tip){return angle(lm[mcp],lm[pip],lm[tip])>150&&distance(lm[tip],lm[0])>distance(lm[pip],lm[0])*1.04}
function countFingers(lm){let count=0;[[5,6,8],[9,10,12],[13,14,16],[17,18,20]].forEach(([m,p,t])=>{if(fingerExtended(lm,m,p,t))count++});if(fingerExtended(lm,2,3,4))count++;return count}
let lastDetected=null,stableCounts=[],candidateGesture=null,candidateSince=0,lastSentGesture=null,lastSentAt=0;
let cameraStream=null,hands=null,cameraRunning=false,processingFrame=false,lastProcessTime=0,frameHandle=null,mediaPipeBase="https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/";

function updateLocalAlert(a){
 if(!a)return;
 state.alerts=Array.isArray(state.alerts)?state.alerts:[];
 state.alerts=[a,...state.alerts.filter(x=>String(x.id)!==String(a.id))];
 render();
}

function setCameraDiagnostic(message,ok=false){
 const el=$("cameraDiagnostic");
 if(el){el.textContent=message;el.classList.toggle("ok",ok);}
 const health=$("cameraHealth");
 if(health){health.innerHTML=`<div class="health-item ${ok?"ok":"warn"}"><b>Latest status:</b> ${esc(message)}</div><div class="health-item ${window.isSecureContext?"ok":"fail"}"><b>Secure context:</b> ${window.isSecureContext?"HTTPS/localhost ✓":"Not secure ✗"}</div><div class="health-item ${navigator.mediaDevices?.getUserMedia?"ok":"fail"}"><b>Camera API:</b> ${navigator.mediaDevices?.getUserMedia?"Available ✓":"Unavailable ✗"}</div><div class="health-item ${cameraRunning?"ok":"warn"}"><b>Camera stream:</b> ${cameraRunning?"Running ✓":"Stopped"}</div>`;}
}
function setFaceDiagnostic(message,ok=false){const el=$("faceDiagnostic");if(el){el.textContent=message;el.classList.toggle("ok",ok);}}
function diagnosticRow(label,status,detail){return `<div class="diagnostic-item ${status}"><b>${status==="ok"?"✓":status==="warn"?"⚠":"✗"} ${esc(label)}</b><br><span>${esc(detail)}</span></div>`}
async function runFullDiagnostics(){
 const out=$("diagnosticResults");if(!out)return;out.innerHTML=diagnosticRow("Diagnostics","warn","Running checks…");let rows=[];
 rows.push(diagnosticRow("HTTPS / Secure Context",window.isSecureContext?"ok":"fail",window.isSecureContext?"Secure camera context available.":"Use HTTPS Render URL or localhost."));
 rows.push(diagnosticRow("Camera API",navigator.mediaDevices?.getUserMedia?"ok":"fail",navigator.mediaDevices?.getUserMedia?"getUserMedia is available.":"Browser does not expose camera API."));
 rows.push(diagnosticRow("Speech Synthesis","speechSynthesis" in window?"ok":"fail","speechSynthesis" in window?"Browser voice API available.":"No browser voice API."));
 const lang=getSelectedLang(),v=findVoice(lang);rows.push(diagnosticRow("Selected Language Voice",v?"ok":"warn",v?`Device voice found: ${v.name} (${v.lang})`:`No installed ${lang} voice found; fallback may require internet and can be blocked by browser.`));
 rows.push(diagnosticRow("Notifications","Notification" in window?"ok":"warn","Notification" in window?`Permission: ${Notification.permission}`:"Not supported."));
 try{const r=await api("/api/state");rows.push(diagnosticRow("Alert Server","ok",`Connected. ${Array.isArray(r.alerts)?r.alerts.length:0} alert(s) currently returned.`));}catch(e){rows.push(diagnosticRow("Alert Server","fail",e.message));}
 rows.push(diagnosticRow("Hand AI Library",window.Hands?"ok":"warn",window.Hands?"MediaPipe Hands already loaded.":"Not loaded yet. It will be downloaded when Start Camera AI is pressed."));
 rows.push(diagnosticRow("Face AI Library",window.FaceMesh?"ok":"warn",window.FaceMesh?"MediaPipe FaceMesh already loaded.":"Not loaded yet. It will be downloaded when Start Face & Eye AI is pressed."));
 rows.push(diagnosticRow("Live Hand Detection",cameraRunning?"ok":"warn",cameraRunning?"Camera is running; show one hand to verify real detection.":"Press Start Camera AI for physical test."));
 rows.push(diagnosticRow("Live Face Detection",faceRunning?"ok":"warn",faceRunning?"Face AI is running; show a face to verify real detection.":"Press Start Face & Eye AI for physical test."));
 out.innerHTML=rows.join("");
}
async function sendTestAlert(){const payload={patientId:$("patientId")?.value||"P1001",patientName:"Demo Patient",room:$("room")?.value||"204",bed:$("bed")?.value||"3",gesture:"System Test",message:"TEST ALERT — system, room and bed communication check",language:$("languageSelect")?.value||"en",priority:"Normal",confidence:100};try{const a=await api("/api/alerts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});updateLocalAlert(a);toast("Test alert saved with Room and Bed");}catch(e){toast("Test alert failed: "+e.message)}}

function loadScript(src){
 return new Promise((resolve,reject)=>{
  const existing=document.querySelector(`script[data-mp-src="${src}"]`);
  if(existing){existing.addEventListener("load",()=>resolve(),{once:true});if(window.Hands)resolve();return;}
  const script=document.createElement("script");
  script.src=src;script.async=true;script.dataset.mpSrc=src;
  script.onload=()=>resolve();script.onerror=()=>reject(new Error("Could not load MediaPipe Hands"));
  document.head.appendChild(script);
 });
}

async function ensureMediaPipeHands(){
 if(window.Hands)return true;
 const version="0.4.1675469240";
 const sources=[
  {base:`https://cdn.jsdelivr.net/npm/@mediapipe/hands@${version}/`,script:`https://cdn.jsdelivr.net/npm/@mediapipe/hands@${version}/hands.js`},
  {base:`https://unpkg.com/@mediapipe/hands@${version}/`,script:`https://unpkg.com/@mediapipe/hands@${version}/hands.js`}
 ];
 let lastError=null;
 for(const source of sources){
  try{await loadScript(source.script);if(window.Hands){mediaPipeBase=source.base;return true;}}catch(e){lastError=e;}
 }
 throw lastError||new Error("MediaPipe Hands library could not be loaded");
}

function handleLandmarks(r){
 const c=$("outputCanvas"),ctx=c.getContext("2d"),v=$("inputVideo");
 const w=v.videoWidth||640,h=v.videoHeight||480;
 if(c.width!==w)c.width=w;if(c.height!==h)c.height=h;
 ctx.clearRect(0,0,c.width,c.height);
 const lm=r.multiHandLandmarks?.[0];
 if(!lm){$("cameraStatus").textContent="Camera running — show one hand";$("cameraHint").classList.remove("hidden");stableCounts=[];candidateGesture=null;candidateSince=0;if(emergencyModalOpen)closeAlertOverlay();emergencyLatched=false;return}
 $("cameraHint").classList.add("hidden");$("cameraStatus").textContent="✋ Hand detected";
 ctx.lineWidth=3;ctx.strokeStyle="#20d46b";ctx.fillStyle="#20d46b";
 lm.forEach(p=>{ctx.beginPath();ctx.arc(p.x*c.width,p.y*c.height,4,0,Math.PI*2);ctx.fill()});
 const number=countFingers(lm);stableCounts.push(number);if(stableCounts.length>7)stableCounts.shift();
 const freq={};stableCounts.forEach(n=>freq[n]=(freq[n]||0)+1);
 const best=Object.entries(freq).sort((a,b)=>b[1]-a[1])[0];
 if(!best||Number(best[1])<5)return;
 const detected=Number(best[0]),now=Date.now();
 if(candidateGesture!==detected){candidateGesture=detected;candidateSince=now;return}
 if(now-candidateSince<400)return;
 if(lastDetected===detected)return;
 lastDetected=detected;
 if(detected!==5)emergencyLatched=false;
 showDetection(detected,false);speakDetected(detected);
 if(lastSentGesture!==detected||now-lastSentAt>2500){lastSentGesture=detected;lastSentAt=now;createGestureAlert(detected);}
}

async function processVideoFrame(now){
 if(!cameraRunning)return;
 frameHandle=requestAnimationFrame(processVideoFrame);
 const v=$("inputVideo");
 if(v.readyState<2||!hands||processingFrame)return;
 if(now-lastProcessTime<66)return;
 lastProcessTime=now;processingFrame=true;
 try{await hands.send({image:v});}catch(e){console.error("Hands frame error",e);setCameraDiagnostic("AI frame error: "+e.message);}finally{processingFrame=false;}
}

async function startCamera(){
 try{
  if(cameraRunning)return;
  setCameraDiagnostic("Checking browser camera and AI library…");
  if(!window.isSecureContext)throw new Error("Camera requires HTTPS or localhost. Open the Render HTTPS address.");
  if(!navigator.mediaDevices?.getUserMedia)throw new Error("Camera API is unavailable in this browser. Use Chrome over HTTPS.");
  await ensureMediaPipeHands();
  const v=$("inputVideo");
  if(!v)throw new Error("Camera video element was not found");
  setCameraDiagnostic("Requesting camera permission…");
  hands=new window.Hands({locateFile:f=>mediaPipeBase+f});
  hands.setOptions({maxNumHands:1,modelComplexity:0,staticImageMode:false,minDetectionConfidence:.5,minTrackingConfidence:.5});
  hands.onResults(handleLandmarks);
  cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:640,max:640},height:{ideal:480,max:480},frameRate:{ideal:20,max:24}},audio:false});
  v.srcObject=cameraStream;v.muted=true;v.setAttribute("playsinline","");await v.play();
  cameraRunning=true;lastProcessTime=0;processingFrame=false;stableCounts=[];candidateGesture=null;candidateSince=0;lastDetected=null;lastSentGesture=null;primeVoice();
  $("cameraStatus").textContent="Camera running — show one hand";$("aiBadge").textContent="AI RUNNING";$("aiBadge").classList.add("running");$("cameraHint").textContent="Show one hand clearly";
  setCameraDiagnostic("✓ Camera connected. AI is detecting fingers.",true);
  const l=$("languageSelect").value;$("voiceStatus").textContent=(labels[l]||labels.en).voiceReady;
  frameHandle=requestAnimationFrame(processVideoFrame);
 }catch(e){
  console.error("Camera start failed",e);
  stopCamera();
  let msg=e.message||"Camera could not start";
  if(e.name==="NotAllowedError")msg="Camera permission denied. Allow Camera for this site in Chrome settings, then press Start again.";
  else if(e.name==="NotFoundError")msg="No camera found on this device.";
  else if(e.name==="NotReadableError")msg="Camera is busy or being used by another application.";
  else if(e.name==="SecurityError")msg="Camera blocked by browser security. Use the HTTPS Render address.";
  setCameraDiagnostic("⚠ "+msg);toast(msg);
 }
}

function stopCamera(){
 cameraRunning=false;if(frameHandle)cancelAnimationFrame(frameHandle);frameHandle=null;processingFrame=false;
 if(cameraStream){cameraStream.getTracks().forEach(t=>t.stop());cameraStream=null}
 const v=$("inputVideo");if(v)v.srcObject=null;
 if(hands){try{hands.close?.()}catch{}hands=null}
 $("cameraStatus").textContent="Camera is off";$("aiBadge").textContent="AI READY";$("aiBadge").classList.remove("running");
 stableCounts=[];candidateGesture=null;candidateSince=0;lastDetected=null;lastSentGesture=null;emergencyLatched=false;
 const l=$("languageSelect").value;$("detectedGesture").textContent=(labels[l]||labels.en).waiting;$("detectedEmoji").textContent="✋";$("detectedNeed").textContent="Show your hand to communicate";
}

function updateMobilePanel(){
 const el=$("mobileServerUrl");
 if(el)el.textContent=location.origin;
}


/* =========================================================
   FACE + EYE + HEAD COMMUNICATION
   Uses MediaPipe FaceMesh. This module measures face presence,
   eye closure/blinks and simple head movement. It does NOT claim
   to medically diagnose pain/fear from facial landmarks alone.
   ========================================================= */
let faceStream=null,faceMesh=null,faceRunning=false,faceBusy=false,faceFrame=null,faceLastTime=0;
let faceBase="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.4.1633559619/";
let eyeClosed=false,blinkCount=0,blinkWindowTimer=null,lastBlinkSignalAt=0,faceBaselineX=null,faceBaselineY=null,lastHeadSignalAt=0;

const faceText={
 en:{waiting:"Waiting for patient face…",ready:"Face & eye communication ready",normal:"Patient face detected — responsive",blink1:"YES / OK",blink2:"NEED HELP",blink3:"EMERGENCY",right:"HEAD RIGHT — YES",left:"HEAD LEFT — NO",down:"HEAD DOWN — NEED HELP",help:"Patient needs help. Nurse assistance is required.",emergency:"Emergency. Immediate nurse or doctor assistance is required.",yes:"Patient indicates yes or okay."},
 kn:{waiting:"ರೋಗಿಯ ಮುಖಕ್ಕಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ…",ready:"ಮುಖ ಮತ್ತು ಕಣ್ಣಿನ ಸಂವಹನ ಸಿದ್ಧವಾಗಿದೆ",normal:"ರೋಗಿಯ ಮುಖ ಪತ್ತೆಯಾಗಿದೆ — ಸ್ಪಂದಿಸುತ್ತಿದ್ದಾರೆ",blink1:"ಹೌದು / ಸರಿ",blink2:"ಸಹಾಯ ಬೇಕು",blink3:"ತುರ್ತು ಪರಿಸ್ಥಿತಿ",right:"ತಲೆ ಬಲಕ್ಕೆ — ಹೌದು",left:"ತಲೆ ಎಡಕ್ಕೆ — ಇಲ್ಲ",down:"ತಲೆ ಕೆಳಗೆ — ಸಹಾಯ ಬೇಕು",help:"ರೋಗಿಗೆ ಸಹಾಯ ಬೇಕಾಗಿದೆ. ನರ್ಸ್ ಸಹಾಯ ಅಗತ್ಯವಿದೆ.",emergency:"ತುರ್ತು ಪರಿಸ್ಥಿತಿ. ತಕ್ಷಣ ನರ್ಸ್ ಅಥವಾ ವೈದ್ಯರ ಸಹಾಯ ಅಗತ್ಯವಿದೆ.",yes:"ರೋಗಿಯು ಹೌದು ಅಥವಾ ಸರಿ ಎಂದು ಸೂಚಿಸಿದ್ದಾರೆ."},
 hi:{waiting:"मरीज के चेहरे का इंतजार…",ready:"चेहरा और आंख संचार तैयार है",normal:"मरीज का चेहरा पहचाना गया — प्रतिक्रिया दे रहा है",blink1:"हां / ठीक",blink2:"मदद चाहिए",blink3:"आपातकाल",right:"सिर दाईं ओर — हां",left:"सिर बाईं ओर — नहीं",down:"सिर नीचे — मदद चाहिए",help:"मरीज को मदद चाहिए। नर्स की सहायता आवश्यक है।",emergency:"आपातकाल। तुरंत नर्स या डॉक्टर की सहायता आवश्यक है।",yes:"मरीज ने हां या ठीक होने का संकेत दिया है।"}
};
function ft(){return faceText[$("languageSelect")?.value]||faceText.en}
function loadFaceScript(src){return new Promise((resolve,reject)=>{if(window.FaceMesh)return resolve();const old=document.querySelector(`script[data-face-src="${src}"]`);if(old){old.addEventListener("load",resolve,{once:true});old.addEventListener("error",()=>reject(new Error("Face AI library failed to load")),{once:true});return;}const x=document.createElement("script");x.src=src;x.async=true;x.dataset.faceSrc=src;x.onload=resolve;x.onerror=()=>reject(new Error("Could not load MediaPipe FaceMesh"));document.head.appendChild(x);});}
async function ensureFaceMesh(){if(window.FaceMesh)return true;const v="0.4.1633559619";const sources=[
 {base:`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${v}/`,script:`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${v}/face_mesh.js`},
 {base:`https://unpkg.com/@mediapipe/face_mesh@${v}/`,script:`https://unpkg.com/@mediapipe/face_mesh@${v}/face_mesh.js`}];let err;for(const q of sources){try{await loadFaceScript(q.script);if(window.FaceMesh){faceBase=q.base;return true;}}catch(e){err=e;}}throw err||new Error("Face AI library could not be loaded");}
function eyeRatio(lm,a,b,c,d){const w=distance(lm[a],lm[b]);const h=(distance(lm[c],lm[d]));return w?h/w:1}
function drawFace(lm){const v=$("faceVideo"),c=$("faceCanvas");if(!v||!c)return;const w=v.videoWidth||640,h=v.videoHeight||480;if(c.width!==w)c.width=w;if(c.height!==h)c.height=h;const ctx=c.getContext("2d");ctx.clearRect(0,0,w,h);ctx.strokeStyle="#38bdf8";ctx.fillStyle="#22c55e";[33,133,159,145,263,362,386,374,1,4,152,234,454].forEach(i=>{const p=lm[i];if(!p)return;ctx.beginPath();ctx.arc(p.x*w,p.y*h,3,0,Math.PI*2);ctx.fill();});ctx.beginPath();[33,133,362,263,33].forEach((i,n)=>{const p=lm[i];if(n)ctx.lineTo(p.x*w,p.y*h);else ctx.moveTo(p.x*w,p.y*h)});ctx.stroke();}
function setFaceUI(kind,emoji,title,detail){$("faceDetected").textContent=kind;$("faceEmoji").textContent=emoji;$("faceNeed").textContent=title;$("faceDetail").textContent=detail;}
async function createFaceAlert(gesture,message,priority="High",confidence=90){const l=$("languageSelect").value,payload={patientId:$("patientId").value||"P1001",patientName:"Demo Patient",room:$("room").value||"204",bed:$("bed").value||"3",gesture,message,language:l,priority,confidence};try{const a=await api("/api/alerts",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});updateLocalAlert(a);notifyAlert(a);if(priority==="Critical")overlay(a);return a;}catch(e){toast("Face/eye signal detected, but alert could not be saved.");}}
function emitBlinkSignal(){const n=blinkCount;blinkCount=0;const t=ft(),now=Date.now();if(now-lastBlinkSignalAt<2500)return;lastBlinkSignalAt=now;if(n===1){setFaceUI("👁 1 BLINK", "👁️",t.blink1,"Patient blink communication detected.");speak(t.yes,$("languageSelect").value);}else if(n===2){setFaceUI("👁👁 2 BLINKS","👁️",t.blink2,"Automatic high-priority help alert sent.");speak(t.help,$("languageSelect").value);createFaceAlert("2 Eye Blinks",t.help,"High",92);}else if(n>=3){setFaceUI("👁👁👁 3 BLINKS","🚨",t.blink3,"Automatic critical emergency alert sent.");speak(t.emergency,$("languageSelect").value);createFaceAlert("3 Eye Blinks",t.emergency,"Critical",95);}}
function registerBlink(){blinkCount++;clearTimeout(blinkWindowTimer);blinkWindowTimer=setTimeout(emitBlinkSignal,1100);}
function handleFaceResults(r){faceBusy=false;const lm=r.multiFaceLandmarks?.[0];const t=ft();if(!lm){$("faceStatus").textContent="Camera running — show patient face";$("faceHint").classList.remove("hidden");return;}$("faceHint").classList.add("hidden");$("faceStatus").textContent="🙂 Face detected — eye and head signals active";drawFace(lm);
 // Eye aspect ratio from FaceMesh landmarks. Calibrated conservatively.
 const left=(eyeRatio(lm,33,133,159,145)+eyeRatio(lm,33,133,158,153))/2;
 const right=(eyeRatio(lm,263,362,386,374)+eyeRatio(lm,263,362,385,380))/2;
 const closed=(left<0.20&&right<0.20);
 if(closed&&!eyeClosed)eyeClosed=true;if(!closed&&eyeClosed){eyeClosed=false;registerBlink();}
 // Head movement uses nose relative to left/right face edges; baseline is learned while face is centered.
 const x=(lm[1].x-lm[234].x)/Math.max(0.001,lm[454].x-lm[234].x),y=(lm[1].y-lm[10].y)/Math.max(0.001,lm[152].y-lm[10].y);
 if(faceBaselineX===null){faceBaselineX=x;faceBaselineY=y;}else{faceBaselineX=faceBaselineX*.995+x*.005;faceBaselineY=faceBaselineY*.995+y*.005;}
 const now=Date.now();if(now-lastHeadSignalAt>2200){if(x-faceBaselineX>.13){lastHeadSignalAt=now;setFaceUI("HEAD RIGHT","➡️",t.right,"Patient head movement communication detected.");speak(t.yes,$("languageSelect").value);}else if(x-faceBaselineX<-.13){lastHeadSignalAt=now;setFaceUI("HEAD LEFT","⬅️",t.left,"Patient head movement communication detected.");}else if(y-faceBaselineY>.13){lastHeadSignalAt=now;setFaceUI("HEAD DOWN","⬇️",t.down,"Automatic high-priority help alert sent.");speak(t.help,$("languageSelect").value);createFaceAlert("Head Down",t.help,"High",88);}}
 if(blinkCount===0&&now-lastHeadSignalAt>1000)setFaceUI("🙂 FACE DETECTED","🙂",t.normal,"Eye blink and head movement communication are active.");}
async function faceLoop(now){if(!faceRunning)return;faceFrame=requestAnimationFrame(faceLoop);const v=$("faceVideo");if(!faceMesh||faceBusy||!v||v.readyState<2||now-faceLastTime<66)return;faceLastTime=now;faceBusy=true;try{await faceMesh.send({image:v});}catch(e){console.warn("Face frame error",e);faceBusy=false;}}
async function startFaceCamera(){try{if(faceRunning)return;stopCamera();$("faceStatus").textContent="Starting Face & Eye AI…";setFaceDiagnostic("Checking HTTPS, camera permission and FaceMesh library…");if(!window.isSecureContext)throw new Error("Camera requires HTTPS or localhost.");await ensureFaceMesh();const v=$("faceVideo");faceMesh=new window.FaceMesh({locateFile:f=>faceBase+f});faceMesh.setOptions({maxNumFaces:1,refineLandmarks:true,minDetectionConfidence:.55,minTrackingConfidence:.55});faceMesh.onResults(handleFaceResults);faceStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:640},height:{ideal:480}},audio:false});v.srcObject=faceStream;v.muted=true;v.playsInline=true;await v.play();faceRunning=true;faceBusy=false;faceBaselineX=null;faceBaselineY=null;blinkCount=0;eyeClosed=false;primeVoice();$("faceAiBadge").textContent="AI RUNNING";$("faceAiBadge").classList.add("running");$("faceVoiceStatus").textContent="🔊 Automatic multilingual voice is ready";setFaceDiagnostic("✓ Face camera connected and FaceMesh processing started.",true);faceFrame=requestAnimationFrame(faceLoop);}catch(e){console.error(e);stopFaceCamera();$("faceStatus").textContent="Face & Eye AI error: "+(e.message||"Could not start");setFaceDiagnostic("⚠ "+(e.message||"Could not start"));toast(e.message||"Face & Eye AI could not start");}}
function stopFaceCamera(){faceRunning=false;faceBusy=false;if(faceFrame)cancelAnimationFrame(faceFrame);faceFrame=null;if(faceStream){faceStream.getTracks().forEach(t=>t.stop());faceStream=null}const v=$("faceVideo");if(v)v.srcObject=null;if(faceMesh){try{faceMesh.close?.()}catch{}faceMesh=null}faceBaselineX=null;faceBaselineY=null;blinkCount=0;eyeClosed=false;clearTimeout(blinkWindowTimer);const c=$("faceCanvas");if(c)c.getContext("2d").clearRect(0,0,c.width,c.height);$("faceAiBadge").textContent="AI READY";$("faceAiBadge").classList.remove("running");$("faceStatus").textContent="Face & Eye AI is off";setFaceUI(ft().waiting,"🙂",ft().ready,"Face presence, eye blinks and head movement will be detected automatically.");}

document.addEventListener("DOMContentLoaded",()=>{
 document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>page(b.dataset.page));
 $("openGestureBtn").onclick=()=>page("gesture");$("viewAlertsBtn").onclick=()=>page("alerts");$("openMobileBtn").onclick=()=>page("mobile");$("notifyBtn").onclick=notifyEnable;
 $("languageSelect").onchange=()=>updateGuide();
 document.querySelectorAll(".filter").forEach(b=>b.onclick=()=>{filter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");render()});
 document.addEventListener("click",e=>{const b=e.target.closest(".act");if(b)act(b.dataset.id,b.dataset.action)});
 $("cameraBtn").onclick=startCamera;$("stopCameraBtn").onclick=stopCamera;$("faceCameraBtn").onclick=startFaceCamera;$("stopFaceCameraBtn").onclick=stopFaceCamera;$("voiceBtn").onclick=primeVoice;$("runDiagnosticsBtn").onclick=runFullDiagnostics;$("testVoiceBtn").onclick=()=>{const l=$("languageSelect").value,t=labels[l]||labels.en;speak(t.helpVoice,l)};$("testAlertBtn").onclick=sendTestAlert;$("copyMobileUrl").onclick=async()=>{try{await navigator.clipboard.writeText(location.origin);toast("Server URL copied")}catch{toast("Copy failed — use the URL shown above")}};
 $("reportForm").onsubmit=report;$("appointmentForm").onsubmit=appointment;
 $("closeAlertOverlay").onclick=(e)=>{e.preventDefault();e.stopPropagation();closeAlertOverlay()};
 $("alertOverlay").addEventListener("click",e=>{if(e.target===$("alertOverlay"))closeAlertOverlay()});
 $("overlayVoiceBtn").onclick=()=>activeAlert&&speak(`${activeAlert.message}. Room ${activeAlert.room}. Bed ${activeAlert.bed}`,activeAlert.language);
 $("overlayAckBtn").onclick=async()=>{const a=activeAlert;if(!a)return;closeAlertOverlay();if(!String(a.id).startsWith("LOCAL-")){try{await act(a.id,"acknowledge")}catch{}}};
 $("overlayResolveBtn").onclick=async()=>{const a=activeAlert;if(!a)return;closeAlertOverlay();if(!String(a.id).startsWith("LOCAL-")){try{await act(a.id,"resolve")}catch{}}};
 updateGuide();refresh();setInterval(refresh,3000);window.addEventListener("beforeunload",()=>{stopCamera();stopFaceCamera();});
});
