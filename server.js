const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

const FILES = {
  patients: path.join(DATA_DIR, 'patients.json'),
  alerts: path.join(DATA_DIR, 'alerts.json'),
  reports: path.join(DATA_DIR, 'reports.json'),
  appointments: path.join(DATA_DIR, 'appointments.json'),
  audit: path.join(DATA_DIR, 'audit.json'),
  users: path.join(DATA_DIR, 'users.json'),
  settings: path.join(DATA_DIR, 'settings.json'),
  detectionMetrics: path.join(DATA_DIR, 'detection_metrics.json'),
  familyUpdates: path.join(DATA_DIR, 'family_updates.json'),
  safetyEvents: path.join(DATA_DIR, 'safety_events.json'),
  medicalEvents: path.join(DATA_DIR, 'medical_events.json')
};

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOADS_DIR),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,8)}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

function readJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify(fallback, null, 2));
      return fallback;
    }
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch { return fallback; }
}
function writeJson(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }
function localIp() {
  const nets = os.networkInterfaces();
  for (const key of Object.keys(nets)) for (const n of nets[key] || []) if (n.family === 'IPv4' && !n.internal) return n.address;
  return 'localhost';
}
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}
function verifyPassword(password, record) {
  try {
    const derived = crypto.scryptSync(password, record.salt, 64);
    const stored = Buffer.from(record.hash, 'hex');
    return stored.length === derived.length && crypto.timingSafeEqual(stored, derived);
  } catch { return false; }
}

const defaultPatients = [
  { id:'P1024', name:'Ravi Kumar', age:54, gender:'Male', room:'101', bed:'2', condition:'Post-operative recovery', status:'Monitoring', doctor:'Dr. Sharma', nurse:'Nurse Anjali', emergencyContact:'+91 98765 43210', admissionDate:new Date().toISOString(), communication:['Pointing Finger','OK Sign','Voice'], priority:'Normal', notes:'Demo patient for Room 101 Bed 2.' },
  { id:'P1025', name:'Anjali Rao', age:61, gender:'Female', room:'101', bed:'1', condition:'Mobility assistance', status:'Normal', doctor:'Dr. Verma', nurse:'Nurse Priya', emergencyContact:'+91 98111 22334', admissionDate:new Date().toISOString(), communication:['Hand Gesture','Eye Blink'], priority:'Normal', notes:'' },
  { id:'P1026', name:'Kumar Shetty', age:47, gender:'Male', room:'102', bed:'1', condition:'Respiratory observation', status:'Attention', doctor:'Dr. Kulkarni', nurse:'Nurse Anjali', emergencyContact:'+91 97222 33445', admissionDate:new Date().toISOString(), communication:['Head Movement','Voice'], priority:'Priority', notes:'' },
  { id:'P1027', name:'Priya Patil', age:69, gender:'Female', room:'102', bed:'2', condition:'Cardiac observation', status:'Normal', doctor:'Dr. Mehta', nurse:'Nurse Mary', emergencyContact:'+91 99333 44556', admissionDate:new Date().toISOString(), communication:['OK Sign','Eye Blink'], priority:'Normal', notes:'' }
];
const defaultAlerts = [
  { id:'ALT-1001', timestamp:new Date(Date.now()-18*60000).toISOString(), patientId:'P1024', patient:'Ravi Kumar', room:'101', bed:'2', gesture:'Pointing Finger', requirement:'Help Required', message:'Patient Ravi Kumar requests assistance.', confidence:94, detectionStatus:'Confirmed', priority:'attention', status:'resolved', language:'en', type:'hand_gesture', acknowledgedAt:new Date(Date.now()-17*60000).toISOString(), resolvedAt:new Date(Date.now()-15*60000).toISOString() },
  { id:'ALT-1002', timestamp:new Date(Date.now()-6*60000).toISOString(), patientId:'P1026', patient:'Kumar Shetty', room:'102', bed:'1', gesture:'Difficulty Breathing', requirement:'Emergency Assistance', message:'Possible difficulty in breathing. Immediate assessment required.', confidence:91, detectionStatus:'Confirmed', priority:'emergency', status:'acknowledged', language:'en', type:'emergency', acknowledgedAt:new Date(Date.now()-3*60000).toISOString() }
];
const defaultReports = [];
const defaultAppointments = [
  { id:'APT-2001', patientId:'P1024', patientName:'Ravi Kumar', room:'101', bed:'2', doctor:'Dr. Sharma', specialty:'Post-op review', date:new Date().toISOString().slice(0,10), time:'10:30', reason:'Wound and mobility assessment', priority:'Routine', status:'Scheduled' }
];
const defaultAudit = [];
const defaultSettings = {
  lowConfidenceThreshold:80,
  confirmedConfidenceThreshold:82,
  rearmSeconds:1.2,
  emergencyConfidenceThreshold:86,
  defaultLanguage:'en',
  sessionMinutes:30,
  voiceEnabled:true,
  simulationEnabled:true,
  emergencyLocked:true,
  gestures:[
    {name:'Pointing Finger',meaning:'Help Required',mode:'Hand'},
    {name:'OK Sign',meaning:'Feeling Better / OK',mode:'Hand'},
    {name:'Thumbs Up',meaning:'Feeling Better',mode:'Hand'},
    {name:'Thumbs Down',meaning:'Discomfort Reported',mode:'Hand'},
    {name:'2 Fingers',meaning:'Water Required',mode:'Hand'},
    {name:'3 Fingers',meaning:'Nurse / Doctor',mode:'Hand'},
    {name:'4 Fingers',meaning:'Toilet Assistance',mode:'Hand'},
    {name:'5 Fingers',meaning:'Emergency Assistance',mode:'Hand'},
    {name:'Eye Blink',meaning:'Attention / Communication',mode:'Eye'},
    {name:'Head Movement',meaning:'Assistance / Position Request',mode:'Head'},
    {name:'Difficulty Breathing',meaning:'Emergency Assistance',mode:'Emergency'}
  ]
};

const defaultDetectionMetrics = {
  totalAttempts: 0,
  validPredictions: 0,
  invalidPredictions: 0,
  lowConfidence: 0,
  unstableDetections: 0,
  falsePredictionCount: 0,
  byMode: { single: 0, multi: 0 },
  byModality: { hand: 0, face: 0, eye: 0, head: 0, emergency: 0, unknown: 0 },
  lastDetectionAt: null
};

readJson(FILES.patients, defaultPatients);
readJson(FILES.alerts, defaultAlerts);
readJson(FILES.reports, defaultReports);
readJson(FILES.appointments, defaultAppointments);
readJson(FILES.audit, defaultAudit);
readJson(FILES.settings, defaultSettings);
readJson(FILES.detectionMetrics, defaultDetectionMetrics);

const users = readJson(FILES.users, null);
if (!users) {
  let initialPassword = process.env.ADMIN_PASSWORD;
  if (!initialPassword) {
    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
      initialPassword = crypto.randomBytes(9).toString('base64url');
      console.log('\n⚠️  ADMIN_PASSWORD was not set. Generated one-time admin password: ' + initialPassword + '\n   Set ADMIN_PASSWORD in your hosting environment variables.\n');
    } else initialPassword = 'admin123';
  }
  const a = hashPassword(initialPassword);
  writeJson(FILES.users, [
    { username: process.env.ADMIN_USER || 'admin', name:'System Administrator', role:'admin', ...a, updatedAt:new Date().toISOString() }
  ]);
} else {
  // Preserve valid family/nurse roles; migrate only legacy records with no role.
  const migrated = users.map(u => ({ ...u, role: ['admin','nurse','family'].includes(u.role) ? u.role : 'admin' }));
  if (JSON.stringify(migrated) !== JSON.stringify(users)) writeJson(FILES.users, migrated);
}

let liveState = { currentGesture:'Waiting for gesture…', confidence:0, detectionStatus:'Ready', patientId:'P1024', patientName:'Ravi Kumar', room:'101', bed:'2', priority:'normal', timestamp:new Date().toISOString(), cameraActive:false, mode:'live' };
const sessions = new Map();
const sseClients = new Set();


// Optional real SMS delivery via Twilio. Without credentials the website remains usable;
// SMS is reported as unconfigured rather than pretending to have been sent.
async function sendPatientSms(patient, message) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) return { configured:false, sent:0 };
  const users=readJson(FILES.users,[]);
  const phones=new Set();
  for (const u of users) {
    if (u.phone && ((u.role==='family' && u.linkedPatientId===patient.id) || (u.role==='nurse' && (!patient.nurse || String(patient.nurse).toLowerCase().includes(String(u.name||'').toLowerCase()) || String(u.name||'').toLowerCase().includes(String(patient.nurse).toLowerCase()))))) phones.add(String(u.phone).trim());
  }
  if (patient.emergencyContact) phones.add(String(patient.emergencyContact).trim());
  let sent=0;
  for (const rawTo of phones) {
    const to=rawTo.replace(/[\s()-]/g,'');
    if (!/^\+[1-9]\d{7,14}$/.test(to)) continue;
    try {
      const body=new URLSearchParams({To:to,From:TWILIO_FROM,Body:message});
      const r=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,{method:'POST',headers:{Authorization:'Basic '+Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),'Content-Type':'application/x-www-form-urlencoded'},body});
      if(r.ok) sent++; else console.error('[SMS] Twilio rejected message:',r.status,await r.text());
    } catch(e) { console.error('[SMS] delivery error:',e.message); }
  }
  return {configured:true,sent};
}
function smsText(patient, heading, details, timestamp=new Date().toISOString()) {
  const when=new Date(timestamp).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'});
  const host=process.env.PUBLIC_BASE_URL||'';
  return `${heading}\nPatient: ${patient.name}\nRoom ${patient.room}, Bed ${patient.bed}\n${details}\nTime: ${when}${host?'\nOpen: '+host+'/family':''}`;
}

function audit(action, details, user='system') {
  const logs = readJson(FILES.audit, defaultAudit);
  logs.unshift({ id:`LOG-${Date.now()}`, timestamp:new Date().toISOString(), user, action, details });
  writeJson(FILES.audit, logs.slice(0, 1000));
}
function broadcast(type, payload) {
  for (const client of sseClients) {
    const session=client.session;
    if(session?.role==='family') {
      const patientId=payload?.patientId || payload?.id && payload?.patientId;
      if(!patientId || patientId!==session.linkedPatientId) continue;
    }
    client.res.write(`data: ${JSON.stringify({ type, payload, timestamp:new Date().toISOString() })}\n\n`);
  }
}
function tokenFrom(req) { return (req.headers.authorization || '').replace(/^Bearer\s+/,''); }
function auth(req, res, roles=[]) {
  // Returns true ONLY when the request is authorised. On failure it sends the error
  // response itself and returns false so callers can simply `if(!auth(...)) return;`.
  const token = tokenFrom(req) || String(req.query?.token || ''); const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) { res.status(401).json({success:false,message:'Session expired. Please log in again.'}); return false; }
  if (roles.length && !roles.includes(session.role)) { res.status(403).json({success:false,message:'Insufficient permissions.'}); return false; }
  req.user = session; return true;
}

function recordDetection(event = {}) {
  const m = readJson(FILES.detectionMetrics, defaultDetectionMetrics);
  const modality = String(event.modality || 'unknown').toLowerCase();
  const mode = event.mode === 'multi' ? 'multi' : 'single';
  m.totalAttempts++;
  if (event.accepted) m.validPredictions++; else m.invalidPredictions++;
  if (event.reason === 'low_confidence') m.lowConfidence++;
  if (event.reason === 'unstable') m.unstableDetections++;
  if (event.falsePrediction === true) m.falsePredictionCount++;
  m.byMode[mode] = (m.byMode[mode] || 0) + 1;
  m.byModality[modality] = (m.byModality[modality] || 0) + 1;
  m.lastDetectionAt = new Date().toISOString();
  writeJson(FILES.detectionMetrics, m);
  return m;
}
function detectionSummary() {
  const m = readJson(FILES.detectionMetrics, defaultDetectionMetrics);
  const total = Math.max(1, Number(m.totalAttempts || 0));
  return {
    ...m,
    validPercentage: Number(((Number(m.validPredictions||0) / total) * 100).toFixed(1)),
    invalidPercentage: Number(((Number(m.invalidPredictions||0) / total) * 100).toFixed(1)),
    falsePredictionPercentage: Number(((Number(m.falsePredictionCount||0) / total) * 100).toFixed(1)),
    rejectionRatePercentage: Number(((Number(m.invalidPredictions||0) / total) * 100).toFixed(1))
  };
}

app.post('/api/login', (req,res) => {
  const { username='', password='' } = req.body || {};
  const list = readJson(FILES.users, []); const user = list.find(u=>u.username===username);
  if (!user || !verifyPassword(password,user)) return res.status(401).json({success:false,message:'Invalid username or password.'});
  const settings = readJson(FILES.settings, defaultSettings);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token,{ username:user.username,name:user.name,role:user.role,linkedPatientId:user.linkedPatientId||null,relationship:user.relationship||'',expiresAt:Date.now()+Number(settings.sessionMinutes||30)*60000 });
  audit('LOGIN',`Successful login as ${user.role}`,user.username);
  res.json({success:true,token,user:{username:user.username,name:user.name,role:user.role}});
});
app.post('/api/logout',(req,res)=>{ const token=tokenFrom(req); const s=sessions.get(token); if(s) audit('LOGOUT','User logged out',s.username); sessions.delete(token); res.json({success:true}); });
app.get('/api/auth-status',(req,res)=>{ const s=sessions.get(tokenFrom(req)); res.json({authenticated:!!s && s.expiresAt>Date.now(),user:s?{username:s.username,name:s.name,role:s.role}:null}); });
app.get('/api/network-info',(req,res)=>{ if(!auth(req,res)) return; const ip=localIp(); const host=req.headers['x-forwarded-host']||req.headers.host||`${ip}:${PORT}`; const proto=(req.headers['x-forwarded-proto']||req.protocol||'http').split(',')[0]; const hosted=!!process.env.RENDER||/onrender\.com$/.test(String(host).split(':')[0]); const base=hosted?`${proto}://${host}`:`http://${ip}:${PORT}`; res.json({localIp:ip,port:PORT,hosted,mobileUrl:`${base}/mobile`,dashboardUrl:`${base}/dashboard`,cameraUrl:`${base}/camera`}); });

app.get('/api/events',(req,res)=>{ if(!auth(req,res)) return; res.setHeader('Content-Type','text/event-stream'); res.setHeader('Cache-Control','no-cache'); res.setHeader('Connection','keep-alive'); res.flushHeaders?.(); res.write(`data: ${JSON.stringify({type:'connected',payload:{ok:true}})}\n\n`); const client={res,session:req.user}; sseClients.add(client); req.on('close',()=>sseClients.delete(client)); });

app.get('/api/live-status',(req,res)=>{ if(!auth(req,res)) return; const alerts=readJson(FILES.alerts,defaultAlerts); if(req.user.role==='family'){const own=liveState.patientId===req.user.linkedPatientId?liveState:null;const ownAlerts=alerts.filter(a=>a.patientId===req.user.linkedPatientId);return res.json({...((own)||{currentGesture:'No patient signal',patientId:req.user.linkedPatientId}),pendingCount:ownAlerts.filter(a=>['pending','acknowledged'].includes(a.status)).length,latestAlert:ownAlerts[0]||null});} res.json({...liveState,pendingCount:alerts.filter(a=>['pending','acknowledged'].includes(a.status)).length,latestAlert:alerts[0]||null,detectionMetrics:detectionSummary()}); });
app.post('/api/live-status',(req,res)=>{
  if(!auth(req,res,['admin','nurse'])) return;
  const body=req.body||{};
  liveState={...liveState,...body,timestamp:new Date().toISOString()};
  if (body.metricEvent) {
    recordDetection({accepted:body.detectionStatus==='Confirmed', modality:body.modality||'unknown', mode:body.mode, reason:body.reason, falsePrediction:body.falsePrediction===true});
  }
  broadcast('live',liveState); res.json({success:true,liveState});
});

function validatePatient(body, patients, currentId=null) {
  const required=['name','room','bed']; for(const k of required) if(!String(body[k]||'').trim()) return `${k} is required.`;
  const duplicateId = body.id && patients.some(p=>p.id===body.id && p.id!==currentId); if(duplicateId) return 'Patient ID already exists.';
  const duplicateBed = patients.some(p=>p.id!==currentId && String(p.room)===String(body.room) && String(p.bed)===String(body.bed)); if(duplicateBed) { const occupant=patients.find(p=>p.id!==currentId && String(p.room)===String(body.room) && String(p.bed)===String(body.bed)); return `Room ${body.room} Bed ${body.bed} is already assigned to ${occupant?.name||'another patient'}. Choose an available bed before saving.`; }
  return null;
}
app.get('/api/patients',(req,res)=>{ if(!auth(req,res)) return;
  let pts=readJson(FILES.patients,defaultPatients);
  if(req.user.role==='family') pts=pts.filter(p=>p.id===req.user.linkedPatientId);
  res.json(pts); });
app.post('/api/patients',(req,res)=>{ if(!auth(req,res,['admin'])) return; const patients=readJson(FILES.patients,defaultPatients); const body=req.body||{}; const id=body.id||`P${Date.now().toString().slice(-6)}`; const err=validatePatient({...body,id},patients); if(err) return res.status(400).json({message:err}); const p={id,name:body.name,age:body.age||'',gender:body.gender||'',room:String(body.room),bed:String(body.bed),condition:body.condition||'',status:body.status||'Normal',doctor:body.doctor||'',nurse:body.nurse||'',emergencyContact:body.emergencyContact||'',admissionDate:body.admissionDate||new Date().toISOString(),communication:body.communication||[],priority:body.priority||'Normal',notes:body.notes||''}; patients.unshift(p); writeJson(FILES.patients,patients); audit('PATIENT_CREATE',`${p.name} assigned Room ${p.room} Bed ${p.bed}`,req.user.username); broadcast('patients',p); res.status(201).json(p); });
app.put('/api/patients/:id',(req,res)=>{ if(!auth(req,res,['admin'])) return; const patients=readJson(FILES.patients,defaultPatients); const i=patients.findIndex(p=>p.id===req.params.id); if(i<0) return res.status(404).json({message:'Patient not found'}); const body={...patients[i],...req.body,id:req.params.id}; const err=validatePatient(body,patients,req.params.id); if(err) return res.status(400).json({message:err}); patients[i]=body; writeJson(FILES.patients,patients); audit('PATIENT_UPDATE',`${body.name} updated`,req.user.username); broadcast('patients',body); res.json(body); });
app.delete('/api/patients/:id',(req,res)=>{ if(!auth(req,res,['admin'])) return; const patients=readJson(FILES.patients,defaultPatients); const p=patients.find(x=>x.id===req.params.id); if(!p) return res.status(404).json({message:'Patient not found'}); writeJson(FILES.patients,patients.filter(x=>x.id!==req.params.id)); audit('PATIENT_DELETE',`${p.name} removed`,req.user.username); broadcast('patients',{id:req.params.id,deleted:true}); res.json({success:true}); });

app.get('/api/rooms',(req,res)=>{ if(!auth(req,res,['admin','nurse'])) return; const patients=readJson(FILES.patients,defaultPatients); const rooms=[]; for(let r=101;r<=106;r++){ for(let b=1;b<=2;b++){ const p=patients.find(x=>String(x.room)===String(r)&&String(x.bed)===String(b)); rooms.push({room:String(r),bed:String(b),occupied:!!p,patient:p||null}); } } res.json(rooms); });

app.get('/api/appointments',(req,res)=>{ if(!auth(req,res)) return; const a=readJson(FILES.appointments,defaultAppointments); if(req.user.role==='family')return res.json(a.filter(x=>x.patientId===req.user.linkedPatientId)); res.json(req.query.patientId?a.filter(x=>x.patientId===req.query.patientId):a); });
app.post('/api/appointments',(req,res)=>{ if(!auth(req,res,['admin'])) return; const a=readJson(FILES.appointments,defaultAppointments); const b=req.body||{}; const item={id:`APT-${Date.now().toString().slice(-6)}`,patientId:b.patientId||'',patientName:b.patientName||'',room:String(b.room||''),bed:String(b.bed||''),doctor:b.doctor||'',specialty:b.specialty||'',date:b.date||new Date().toISOString().slice(0,10),time:b.time||'',reason:b.reason||'',priority:b.priority||'Routine',status:'Scheduled'}; a.unshift(item); writeJson(FILES.appointments,a); audit('APPOINTMENT_CREATE',`${item.patientName} - ${item.date} ${item.time}`,req.user.username); res.status(201).json(item); });
app.patch('/api/appointments/:id',(req,res)=>{ if(!auth(req,res,['admin','nurse'])) return; const a=readJson(FILES.appointments,defaultAppointments); const i=a.findIndex(x=>x.id===req.params.id); if(i<0)return res.status(404).json({message:'Appointment not found'}); a[i]={...a[i],...req.body}; writeJson(FILES.appointments,a); res.json(a[i]); });
app.delete('/api/appointments/:id',(req,res)=>{ if(!auth(req,res,['admin'])) return; const a=readJson(FILES.appointments,defaultAppointments); writeJson(FILES.appointments,a.filter(x=>x.id!==req.params.id)); audit('APPOINTMENT_DELETE',req.params.id,req.user.username); res.json({success:true}); });

app.get('/api/alerts',(req,res)=>{ if(!auth(req,res)) return; let a=readJson(FILES.alerts,defaultAlerts);
  if(req.user.role==='family') a=a.filter(x=>x.patientId===req.user.linkedPatientId); if(req.query.status&&req.query.status!=='all')a=a.filter(x=>x.status===req.query.status); if(req.query.priority&&req.query.priority!=='all')a=a.filter(x=>x.priority===req.query.priority); a.sort((x,y)=>new Date(y.timestamp)-new Date(x.timestamp)); if(req.query.limit)a=a.slice(0,Number(req.query.limit)); res.json(a); });
app.post('/api/alerts',(req,res)=>{ if(!auth(req,res,['admin','nurse'])) return; const b=req.body||{}; const patients=readJson(FILES.patients,defaultPatients); const p=patients.find(x=>x.id===b.patientId); const a=readJson(FILES.alerts,defaultAlerts); const item={id:b.id||`ALT-${Date.now().toString().slice(-7)}`,timestamp:new Date().toISOString(),patientId:b.patientId||p?.id||'',patient:b.patient||p?.name||'Patient',room:String(b.room||p?.room||''),bed:String(b.bed||p?.bed||''),gesture:b.gesture||'Unknown',requirement:b.requirement||'Assistance Required',message:b.message||'Assistance required.',confidence:Number(b.confidence||90),detectionStatus:b.detectionStatus||'Confirmed',priority:b.priority||'attention',status:'pending',language:b.language||'en',type:b.type||'hand_gesture'}; a.unshift(item); writeJson(FILES.alerts,a); liveState={...liveState,currentGesture:item.gesture,confidence:item.confidence,detectionStatus:item.detectionStatus,patientId:item.patientId,patientName:item.patient,room:item.room,bed:item.bed,priority:item.priority,timestamp:item.timestamp}; broadcast('alert',item); broadcast('live',liveState); if(p) sendPatientSms(p,smsText(p,'PATIENT ALERT',`${item.requirement}: ${item.message}`,item.timestamp)).then(sms=>console.log('[SMS alert]',sms)); res.status(201).json(item); });
app.patch('/api/alerts/:id',(req,res)=>{ const token=tokenFrom(req); const s=sessions.get(token); if(!s||s.expiresAt<Date.now()) return res.status(401).json({message:'Login required'}); if(!['admin','nurse'].includes(s.role)) return res.status(403).json({message:'Staff access required.'}); const a=readJson(FILES.alerts,defaultAlerts); const i=a.findIndex(x=>x.id===req.params.id); if(i<0)return res.status(404).json({message:'Alert not found'}); const next=(req.body||{}).status; if(!['pending','acknowledged','resolved','archived'].includes(next)) return res.status(400).json({message:'Invalid alert state'}); if(a[i].priority==='emergency' && next==='archived' && s.role!=='admin') return res.status(403).json({message:'Emergency archival requires admin'}); a[i].status=next; if(next==='acknowledged')a[i].acknowledgedAt=new Date().toISOString(); if(next==='resolved')a[i].resolvedAt=new Date().toISOString(); if(next==='archived')a[i].archivedAt=new Date().toISOString(); writeJson(FILES.alerts,a); audit(`ALERT_${next.toUpperCase()}`,`${a[i].id} ${a[i].patient}`,s.username); broadcast('alert',a[i]); const patient=patientRecord(a[i].patientId); if(patient) sendPatientSms(patient,smsText(patient,'NURSE ALERT UPDATE',`Alert status: ${next}. Updated by ${s.name}.`,new Date().toISOString())).then(sms=>console.log('[SMS alert status]',sms)); res.json(a[i]); });
app.delete('/api/alerts/:id',(req,res)=>{ if(!auth(req,res,['admin'])) return; const a=readJson(FILES.alerts,defaultAlerts); const target=a.find(x=>x.id===req.params.id); if(!target)return res.status(404).json({message:'Alert not found'}); if(target.priority==='emergency')return res.status(400).json({message:'Emergency alerts cannot be silently deleted. Archive after resolution.'}); writeJson(FILES.alerts,a.filter(x=>x.id!==req.params.id)); audit('ALERT_DELETE',`${target.id} deleted after confirmation`,req.user.username); res.json({success:true}); });

app.get('/api/reports',(req,res)=>{ if(!auth(req,res)) return; let a=readJson(FILES.reports,defaultReports); if(req.user.role==='family')a=a.filter(x=>x.patientId===req.user.linkedPatientId); else if(req.query.patientId)a=a.filter(x=>x.patientId===req.query.patientId); res.json(a); });
app.post('/api/reports',upload.single('reportFile'),(req,res)=>{ if(!auth(req,res,['admin']))return; const b=req.body||{}; const item={id:`REP-${Date.now().toString().slice(-6)}`,patientId:b.patientId||'',patientName:b.patientName||'',room:b.room||'',bed:b.bed||'',title:b.title||'Clinical Report',type:b.type||'General',doctor:b.doctor||'',date:b.date||new Date().toISOString().slice(0,10),summary:b.summary||'',status:b.status||'Normal',fileName:req.file?.originalname||null,fileUrl:req.file?`/uploads/${req.file.filename}`:null}; const a=readJson(FILES.reports,defaultReports); a.unshift(item); writeJson(FILES.reports,a); audit('REPORT_CREATE',item.title,req.user.username); res.status(201).json(item); });
app.delete('/api/reports/:id',(req,res)=>{ if(!auth(req,res,['admin']))return; const a=readJson(FILES.reports,defaultReports); writeJson(FILES.reports,a.filter(x=>x.id!==req.params.id)); audit('REPORT_DELETE',req.params.id,req.user.username); res.json({success:true}); });

app.get('/api/patients/:id/timeline',(req,res)=>{
  if(!auth(req,res)) return;
  const p=readJson(FILES.patients,defaultPatients).find(x=>x.id===req.params.id);
  if(!p) return res.status(404).json({message:'Patient not found'});
  if(req.user.role==='family' && req.user.linkedPatientId!==p.id) return res.status(403).json({message:'You can only view your linked patient.'});
  const alerts=readJson(FILES.alerts,defaultAlerts).filter(x=>x.patientId===p.id).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  res.json({patient:p,timeline:alerts});
});
app.get('/api/detection-metrics',(req,res)=>{ if(!auth(req,res,['admin','nurse'])) return; res.json(detectionSummary()); });
app.get('/api/system-health',(req,res)=>{ if(!auth(req,res,['admin','nurse'])) return; res.json({
  server:'RUNNING', aiEngine:'ACTIVE', dataStore:fs.existsSync(DATA_DIR)?'ONLINE':'OFFLINE',
  camera:liveState.cameraActive?'ACTIVE':'READY', mobileSync:sseClients.size>0?'CONNECTED':'READY',
  sseClients:sseClients.size, uptimeSeconds:Math.round(process.uptime()), lastDetectionAt:liveState.timestamp,
  mode:liveState.mode, detection:detectionSummary()
}); });

app.get('/api/stats',(req,res)=>{ if(!auth(req,res,['admin','nurse'])) return; const a=readJson(FILES.alerts,defaultAlerts),p=readJson(FILES.patients,defaultPatients),r=readJson(FILES.reports,defaultReports),ap=readJson(FILES.appointments,defaultAppointments); res.json({patients:p.length,total:a.length,pending:a.filter(x=>x.status==='pending').length,acknowledged:a.filter(x=>x.status==='acknowledged').length,resolved:a.filter(x=>x.status==='resolved').length,emergency:a.filter(x=>x.priority==='emergency').length,reportsCount:r.length,appointmentsCount:ap.length,invalidCount:a.filter(x=>x.type==='invalid_gesture').length}); });


// ── Family portal ──────────────────────────────────────────────────────────
app.get('/family',(_,res)=>res.sendFile(path.join(__dirname,'public','family.html')));

app.get('/api/family/me',(req,res)=>{
  if(!auth(req,res)) return;
  if(req.user.role!=='family') return res.status(403).json({message:'Family access only'});
  const pid=req.user.linkedPatientId;
  if(!pid) return res.status(400).json({message:'No patient linked to this account'});
  const patients=readJson(FILES.patients,defaultPatients);
  const patient=patients.find(p=>p.id===pid);
  if(!patient) return res.status(404).json({message:'Linked patient not found'});
  let alerts=readJson(FILES.alerts,defaultAlerts).filter(a=>a.patientId===pid);
  alerts.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  const live={...liveState}; const liveForPatient=(live.patientId===pid)?live:null;
  const updates=readJson(FILES.familyUpdates,[]).filter(x=>x.patientId===pid).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  const safetyEvents=readJson(FILES.safetyEvents,[]).filter(x=>x.patientId===pid).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  const medicalEvents=readJson(FILES.medicalEvents,[]).filter(x=>x.patientId===pid).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  const today=new Date().toISOString().slice(0,10); const todays=alerts.filter(x=>String(x.timestamp).slice(0,10)===today);
  const summary={totalGestures:todays.filter(x=>['hand_gesture','face','eye','head','emergency'].includes(x.type)).length,water:todays.filter(x=>/water/i.test(x.requirement||'')).length,help:todays.filter(x=>/help|assistance/i.test(x.requirement||'')).length,emergency:todays.filter(x=>x.priority==='emergency').length,completed:todays.filter(x=>x.status==='resolved').length,pending:todays.filter(x=>['pending','acknowledged'].includes(x.status)).length};
  res.json({patient,alerts:alerts.slice(0,50),live:liveForPatient,updates:updates.slice(0,30),safetyEvents:safetyEvents.slice(0,30),medicalEvents:medicalEvents.slice(0,30),summary,relationship:req.user.relationship||''});
});


// Family communication, camera safety observations and authorized medical event reporting.
function patientRecord(patientId){return readJson(FILES.patients,defaultPatients).find(p=>p.id===String(patientId));}
function familyPatientFilter(req, patientId){return req.user.role!=='family'||req.user.linkedPatientId===String(patientId);}
app.get('/api/family-updates',(req,res)=>{if(!auth(req,res))return;let rows=readJson(FILES.familyUpdates,[]);if(req.user.role==='family')rows=rows.filter(x=>x.patientId===req.user.linkedPatientId);else if(req.query.patientId)rows=rows.filter(x=>x.patientId===req.query.patientId);res.json(rows.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)));});
app.post('/api/family-updates',(req,res)=>{if(!auth(req,res,['admin','nurse']))return;const b=req.body||{},p=patientRecord(b.patientId);if(!p)return res.status(400).json({message:'Select a valid patient.'});const message=String(b.message||'').trim();if(!message||message.length>1000)return res.status(400).json({message:'Update must contain 1–1000 characters.'});const rows=readJson(FILES.familyUpdates,[]);const item={id:`UPD-${Date.now()}`,patientId:p.id,patientName:p.name,message,author:req.user.name,authorRole:req.user.role,timestamp:new Date().toISOString()};rows.unshift(item);writeJson(FILES.familyUpdates,rows);audit('FAMILY_UPDATE',`${p.name}: ${message.slice(0,100)}`,req.user.username);broadcast('family-update',item);sendPatientSms(p,smsText(p,'HOSPITAL / NURSE UPDATE',item.message,item.timestamp)).then(sms=>console.log('[SMS family update]',sms));res.status(201).json(item);});
app.get('/api/safety-events',(req,res)=>{if(!auth(req,res))return;let rows=readJson(FILES.safetyEvents,[]);if(req.user.role==='family')rows=rows.filter(x=>x.patientId===req.user.linkedPatientId);else if(req.query.patientId)rows=rows.filter(x=>x.patientId===req.query.patientId);res.json(rows.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)));});
app.post('/api/safety-events',(req,res)=>{if(!auth(req,res,['admin','nurse']))return;const b=req.body||{},p=patientRecord(b.patientId);if(!p)return res.status(400).json({message:'Select a valid patient.'});const allowed=['Patient Fall','Seizure-like Movement','Prolonged Inactivity','Breathing Pattern Observation','Bed Exit Attempt','Patient Collapsing','Unusual Body Posture','Repeated Restless Movement','Unusual Night-time Activity'];if(!allowed.includes(b.eventType))return res.status(400).json({message:'Unsupported visual safety event.'});const rows=readJson(FILES.safetyEvents,[]);const item={id:`SAFE-${Date.now()}`,patientId:p.id,patientName:p.name,room:p.room,bed:p.bed,eventType:b.eventType,source:b.source||'staff-observed',priority:['Patient Fall','Seizure-like Movement','Patient Collapsing'].includes(b.eventType)?'critical':'warning',confidence:Number.isFinite(Number(b.confidence))?Math.max(0,Math.min(100,Number(b.confidence))):null,status:'verification_pending',note:String(b.note||'').slice(0,500),timestamp:new Date().toISOString(),reportedBy:req.user.name};rows.unshift(item);writeJson(FILES.safetyEvents,rows);audit('SAFETY_EVENT',`${p.name}: ${item.eventType}`,req.user.username);broadcast('safety-event',item);sendPatientSms(p,smsText(p,'PATIENT SAFETY ALERT',`${item.eventType} — ${item.status.replace('_',' ')}. Nurse verification required.`,item.timestamp)).then(sms=>console.log('[SMS safety event]',sms));res.status(201).json(item);});
app.patch('/api/safety-events/:id',(req,res)=>{if(!auth(req,res,['admin','nurse']))return;const rows=readJson(FILES.safetyEvents,[]),i=rows.findIndex(x=>x.id===req.params.id);if(i<0)return res.status(404).json({message:'Safety event not found'});const status=String(req.body?.status||'');if(!['verification_pending','acknowledged','assistance_started','resolved'].includes(status))return res.status(400).json({message:'Invalid safety event status'});rows[i]={...rows[i],status,updatedAt:new Date().toISOString(),updatedBy:req.user.name,staffNote:String(req.body?.note||'').slice(0,500)};writeJson(FILES.safetyEvents,rows);broadcast('safety-event',rows[i]);const p=patientRecord(rows[i].patientId);if(p)sendPatientSms(p,smsText(p,'PATIENT SAFETY STATUS',`${rows[i].eventType}: ${status.replaceAll('_',' ')}. ${rows[i].staffNote}`,rows[i].updatedAt)).then(x=>console.log('[SMS safety status]',x));res.json(rows[i]);});

app.get('/api/medical-events',(req,res)=>{if(!auth(req,res))return;let rows=readJson(FILES.medicalEvents,[]);if(req.user.role==='family')rows=rows.filter(x=>x.patientId===req.user.linkedPatientId);else if(req.query.patientId)rows=rows.filter(x=>x.patientId===req.query.patientId);res.json(rows.sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)));});
app.post('/api/medical-events',(req,res)=>{if(!auth(req,res,['admin','nurse']))return;const b=req.body||{},p=patientRecord(b.patientId);if(!p)return res.status(400).json({message:'Select a valid patient.'});const allowed=['Suspected Heart Attack','Suspected Cardiac Arrest','Severe Breathing Difficulty','Suspected Stroke','Severe Bleeding','Patient Condition Critical','Patient Stabilized','Patient Death Confirmed by Doctor','Other Medical Emergency'];if(!allowed.includes(b.eventType))return res.status(400).json({message:'Unsupported medical event.'});if(b.eventType==='Patient Death Confirmed by Doctor'&&b.confirmedByDoctor!==true)return res.status(400).json({message:'Death can only be recorded after authorized doctor confirmation.'});const rows=readJson(FILES.medicalEvents,[]);const item={id:`MED-${Date.now()}`,patientId:p.id,patientName:p.name,room:p.room,bed:p.bed,eventType:b.eventType,status:b.status||'reported',note:String(b.note||'').slice(0,500),timestamp:new Date().toISOString(),reportedBy:req.user.name,confirmedByDoctor:b.confirmedByDoctor===true};rows.unshift(item);writeJson(FILES.medicalEvents,rows);audit('MEDICAL_EVENT',`${p.name}: ${item.eventType}`,req.user.username);broadcast('medical-event',item);sendPatientSms(p,smsText(p,'HOSPITAL MEDICAL UPDATE',`${item.eventType}: ${item.note||'Medical team update recorded.'}`,item.timestamp)).then(x=>console.log('[SMS medical event]',x));res.status(201).json(item);});

// Allow admin to create family users with linkedPatientId
app.get('/api/users',(req,res)=>{ if(!auth(req,res,['admin']))return; res.json(readJson(FILES.users,[]).map(u=>({username:u.username,name:u.name,role:u.role,linkedPatientId:u.linkedPatientId||null,relationship:u.relationship||'',phone:u.phone||'',updatedAt:u.updatedAt}))); });
app.post('/api/users',(req,res)=>{
  if(!auth(req,res,['admin']))return;
  const b=req.body||{}; const role=b.role||'admin';
  if(!['admin','nurse','family'].includes(role)) return res.status(400).json({message:'Choose admin, nurse or family role.'});
  if(!String(b.username||'').trim()||!b.password||String(b.password).length<8) return res.status(400).json({message:'Username and password (8+ characters) are required.'});
  if(['family','nurse'].includes(role) && !/^\+[1-9]\d{7,14}$/.test(String(b.phone||'').replace(/[\s()-]/g,''))) return res.status(400).json({message:'A valid mobile number in international format (for example +919876543210) is required for SMS notifications.'});
  const list=readJson(FILES.users,[]); const username=String(b.username).trim();
  if(list.some(u=>u.username.toLowerCase()===username.toLowerCase()))return res.status(400).json({message:'Username already exists.'});
  let linkedPatientId=null;
  if(role==='family'){
    linkedPatientId=String(b.linkedPatientId||'');
    const patient=readJson(FILES.patients,defaultPatients).find(p=>p.id===linkedPatientId);
    if(!patient) return res.status(400).json({message:'Select a valid patient for this family account.'});
  }
  const item={username,name:String(b.name||username).trim(),role,linkedPatientId,relationship:String(b.relationship||''),phone:String(b.phone||'').trim(),...hashPassword(String(b.password)),updatedAt:new Date().toISOString()};
  list.push(item); writeJson(FILES.users,list); audit('USER_CREATE',`${item.username} (${item.role})${linkedPatientId?' linked to '+linkedPatientId:''}`,req.user.username);
  res.status(201).json({username:item.username,name:item.name,role:item.role,linkedPatientId:item.linkedPatientId,relationship:item.relationship});
});
app.delete('/api/users/:username',(req,res)=>{ if(!auth(req,res,['admin']))return; if(req.params.username===req.user.username)return res.status(400).json({message:'You cannot delete your own account.'}); const list=readJson(FILES.users,[]); const target=list.find(u=>u.username===req.params.username); if(!target)return res.status(404).json({message:'User not found'}); writeJson(FILES.users,list.filter(u=>u.username!==req.params.username)); audit('USER_DELETE',`${target.username} (${target.role})`,req.user.username); res.json({success:true}); });
app.get('/api/audit',(req,res)=>{ if(!auth(req,res,['admin']))return; res.json(readJson(FILES.audit,defaultAudit)); });
app.get('/api/settings',(req,res)=>{ if(!auth(req,res,['admin']))return; res.json(readJson(FILES.settings,defaultSettings)); });
app.put('/api/settings',(req,res)=>{ if(!auth(req,res,['admin']))return; const next={...readJson(FILES.settings,defaultSettings),...req.body}; writeJson(FILES.settings,next); audit('SETTINGS_UPDATE','System settings updated',req.user.username); res.json(next); });
app.post('/api/change-password',(req,res)=>{ if(!auth(req,res,['admin']))return; const {currentPassword,newPassword}=req.body||{}; if(!newPassword||newPassword.length<8)return res.status(400).json({message:'New password must be at least 8 characters.'}); const list=readJson(FILES.users,[]); const i=list.findIndex(u=>u.username===req.user.username); if(i<0||!verifyPassword(currentPassword,list[i]))return res.status(400).json({message:'Current password is incorrect.'}); Object.assign(list[i],hashPassword(newPassword),{updatedAt:new Date().toISOString()}); writeJson(FILES.users,list); audit('PASSWORD_CHANGE','Password changed',req.user.username); res.json({success:true}); });
app.get('/api/backup',(req,res)=>{ if(!auth(req,res,['admin']))return; const backup={createdAt:new Date().toISOString(),patients:readJson(FILES.patients,[]),alerts:readJson(FILES.alerts,[]),appointments:readJson(FILES.appointments,[]),reports:readJson(FILES.reports,[]),familyUpdates:readJson(FILES.familyUpdates,[]),safetyEvents:readJson(FILES.safetyEvents,[]),medicalEvents:readJson(FILES.medicalEvents,[]),settings:readJson(FILES.settings,defaultSettings)}; res.setHeader('Content-Disposition',`attachment; filename="patient-system-backup-${Date.now()}.json"`); res.json(backup); });
app.post('/api/simulate',(req,res)=>{
  if(!auth(req,res,['admin']))return;
  const b=req.body||{}; const patients=readJson(FILES.patients,defaultPatients);
  const p=patients.find(x=>x.id===b.patientId)||patients[0];
  if(!p) return res.status(400).json({message:'Add a patient before simulation.'});
  const gesture=b.gesture||'Unknown Gesture';
  const modality=(b.modality||'hand').toLowerCase();
  const map={
    'Pointing Finger':['Help Required','attention','Patient requests assistance.','hand_gesture'],
    'OK Sign':['Feeling Better / OK','normal','Patient communicates that they are OK.','hand_gesture'],
    'Thumbs Up':['Feeling Better','normal','Patient gives an affirmative response.','hand_gesture'],
    'Thumbs Down':['Discomfort Reported','attention','Patient reports discomfort.','hand_gesture'],
    '2 Fingers':['Water Required','attention','Patient requests water.','hand_gesture'],
    '3 Fingers':['Nurse / Doctor Assistance','attention','Patient requests nurse or doctor assistance.','hand_gesture'],
    '4 Fingers':['Toilet Assistance','attention','Patient requests toilet assistance.','hand_gesture'],
    '5 Fingers':['Emergency Assistance','emergency','Emergency medical assistance required.','emergency'],
    'Difficulty Breathing':['Difficulty Breathing / Emergency','emergency','Possible difficulty breathing. Immediate assessment required.','emergency'],
    'Emergency':['Emergency Assistance','emergency','Emergency assistance required.','emergency'],
    'Smile':['Smile — Feeling Better','normal','Facial smile action communicates a positive response.','face'],
    'Frown / Distress':['Frown / Distress — Need Help','attention','Facial distress action requests help.','face'],
    'Open Mouth':['Facial Emergency / Breathing Distress','emergency','Prolonged open-mouth facial emergency signal.','emergency'],
    'Single Blink':['Yes / All OK — Single Blink','normal','Single deliberate blink communicates yes or OK.','eye'],
    'Double Blink':['Need Help — Double Blink','attention','Double deliberate blink requests assistance.','eye'],
    'Triple Blink':['Eye Emergency / Immediate Medical Assistance','emergency','Three deliberate blinks request immediate medical assistance.','emergency'],
    'Head Left':['Position Change — Left','normal','Patient requests a position change to the left.','head'],
    'Head Right':['Position Change — Right','normal','Patient requests a position change to the right.','head'],
    'Head Down':['Pain / Discomfort','attention','Sustained downward head movement indicates discomfort.','head'],
    'Head Shake':['Head Emergency / Immediate Medical Assistance','emergency','Repeated rapid head shaking is an emergency signal.','emergency'],
    'Unknown Gesture':['Unrecognized / Invalid Signal','normal','Movement did not match a supported communication signal.','unknown']
  };
  const m=map[gesture]||map['Unknown Gesture'];
  const accepted=m[3]!=='unknown' && Number(b.confidence||94)>=85;
  const reason=!accepted?(Number(b.confidence||94)<85?'low_confidence':'unsupported'):'';
  const item={patientId:p.id,patient:p.name,room:p.room,bed:p.bed,gesture,requirement:m[0],priority:m[1],message:m[2],confidence:Number(b.confidence||94),detectionStatus:accepted?'Confirmed':'Rejected',type:m[3],language:b.language||'en',modality,mode:b.mode||'single'};
  recordDetection({accepted,modality:item.modality,mode:item.mode,reason,falsePrediction:!accepted});
  liveState={...liveState,currentGesture:item.gesture,confidence:item.confidence,detectionStatus:item.detectionStatus,patientId:item.patientId,patientName:item.patient,room:item.room,bed:item.bed,priority:item.priority,timestamp:new Date().toISOString(),mode:'simulation',modality:item.modality};
  broadcast('live',liveState);
  if(!accepted) return res.json({success:true,alert:null,liveState,validation:{accepted:false,reason:reason==='low_confidence'?'Confidence below safety threshold; signal rejected.':'Unsupported/invalid signal; no alert generated.'}});
  const a=readJson(FILES.alerts,defaultAlerts);
  const alert={id:`ALT-${Date.now().toString().slice(-7)}`,...item,status:'pending',timestamp:new Date().toISOString()};
  a.unshift(alert); writeJson(FILES.alerts,a); broadcast('alert',alert);
  res.json({success:true,alert,liveState,validation:{accepted:true,reason:'Supported signal passed confidence and validation checks.'}});
});

app.get('/healthz',(_,res)=>res.json({ok:true,uptime:Math.round(process.uptime())}));
app.get('/',(_,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.get('/dashboard',(_,res)=>res.sendFile(path.join(__dirname,'public','dashboard.html')));
app.get('/camera',(_,res)=>res.sendFile(path.join(__dirname,'public','camera.html')));
app.get('/nurse',(_,res)=>res.sendFile(path.join(__dirname,'public','dashboard.html')));
app.get('/mobile',(_,res)=>res.sendFile(path.join(__dirname,'public','mobile.html')));

app.listen(PORT,'0.0.0.0',()=>{ console.log(`\n🏥 AI-Based Patient Gesture Communication & Alert System`); console.log(`Local: http://localhost:${PORT}`); console.log(`Dashboard: http://${localIp()}:${PORT}/dashboard`); console.log(`Mobile: http://${localIp()}:${PORT}/mobile`); });
