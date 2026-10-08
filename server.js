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
  detectionMetrics: path.join(DATA_DIR, 'detection_metrics.json')
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
  confirmedConfidenceThreshold:85,
  rearmSeconds:5,
  emergencyConfidenceThreshold:88,
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
  const a = hashPassword(process.env.ADMIN_PASSWORD || 'admin123');
  writeJson(FILES.users, [
    { username: process.env.ADMIN_USER || 'admin', name:'System Administrator', role:'admin', ...a, updatedAt:new Date().toISOString() }
  ]);
} else {
  // Admin-only authentication: migrate legacy nurse/viewer records to admin.
  const migrated = users.map(u => ({ ...u, role: 'admin' }));
  if (JSON.stringify(migrated) !== JSON.stringify(users)) writeJson(FILES.users, migrated);
}

let liveState = { currentGesture:'Waiting for gesture…', confidence:0, detectionStatus:'Ready', patientId:'P1024', patientName:'Ravi Kumar', room:'101', bed:'2', priority:'normal', timestamp:new Date().toISOString(), cameraActive:false, mode:'live' };
const sessions = new Map();
const sseClients = new Set();

function audit(action, details, user='system') {
  const logs = readJson(FILES.audit, defaultAudit);
  logs.unshift({ id:`LOG-${Date.now()}`, timestamp:new Date().toISOString(), user, action, details });
  writeJson(FILES.audit, logs.slice(0, 1000));
}
function broadcast(type, payload) {
  const msg = `data: ${JSON.stringify({ type, payload, timestamp:new Date().toISOString() })}\n\n`;
  for (const res of sseClients) res.write(msg);
}
function tokenFrom(req) { return (req.headers.authorization || '').replace(/^Bearer\s+/,''); }
function auth(req, res, roles=[]) {
  const token = tokenFrom(req); const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) return res.status(401).json({success:false,message:'Session expired. Please log in again.'});
  if (roles.length && !roles.includes(session.role)) return res.status(403).json({success:false,message:'Insufficient permissions.'});
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
  sessions.set(token,{ username:user.username,name:user.name,role:user.role,expiresAt:Date.now()+Number(settings.sessionMinutes||30)*60000 });
  audit('LOGIN',`Successful login as ${user.role}`,user.username);
  res.json({success:true,token,user:{username:user.username,name:user.name,role:user.role}});
});
app.post('/api/logout',(req,res)=>{ const token=tokenFrom(req); const s=sessions.get(token); if(s) audit('LOGOUT','User logged out',s.username); sessions.delete(token); res.json({success:true}); });
app.get('/api/auth-status',(req,res)=>{ const s=sessions.get(tokenFrom(req)); res.json({authenticated:!!s && s.expiresAt>Date.now(),user:s?{username:s.username,name:s.name,role:s.role}:null}); });
app.get('/api/network-info',(req,res)=>{ const ip=localIp(); res.json({localIp:ip,port:PORT,mobileUrl:`http://${ip}:${PORT}/mobile`,dashboardUrl:`http://${ip}:${PORT}/dashboard`}); });

app.get('/api/events',(req,res)=>{ res.setHeader('Content-Type','text/event-stream'); res.setHeader('Cache-Control','no-cache'); res.setHeader('Connection','keep-alive'); res.flushHeaders?.(); res.write(`data: ${JSON.stringify({type:'connected',payload:{ok:true}})}\n\n`); sseClients.add(res); req.on('close',()=>sseClients.delete(res)); });

app.get('/api/live-status',(req,res)=>{ const alerts=readJson(FILES.alerts,defaultAlerts); res.json({...liveState,pendingCount:alerts.filter(a=>['pending','acknowledged'].includes(a.status)).length,latestAlert:alerts[0]||null,detectionMetrics:detectionSummary()}); });
app.post('/api/live-status',(req,res)=>{
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
  const duplicateBed = patients.some(p=>p.id!==currentId && String(p.room)===String(body.room) && String(p.bed)===String(body.bed)); if(duplicateBed) return `Room ${body.room} Bed ${body.bed} is already assigned.`;
  return null;
}
app.get('/api/patients',(req,res)=>res.json(readJson(FILES.patients,defaultPatients)));
app.post('/api/patients',(req,res)=>{ if(!auth(req,res,['admin'])) return; const patients=readJson(FILES.patients,defaultPatients); const body=req.body||{}; const id=body.id||`P${Date.now().toString().slice(-6)}`; const err=validatePatient({...body,id},patients); if(err) return res.status(400).json({message:err}); const p={id,name:body.name,age:body.age||'',gender:body.gender||'',room:String(body.room),bed:String(body.bed),condition:body.condition||'',status:body.status||'Normal',doctor:body.doctor||'',nurse:body.nurse||'',emergencyContact:body.emergencyContact||'',admissionDate:body.admissionDate||new Date().toISOString(),communication:body.communication||[],priority:body.priority||'Normal',notes:body.notes||''}; patients.unshift(p); writeJson(FILES.patients,patients); audit('PATIENT_CREATE',`${p.name} assigned Room ${p.room} Bed ${p.bed}`,req.user.username); broadcast('patients',p); res.status(201).json(p); });
app.put('/api/patients/:id',(req,res)=>{ if(!auth(req,res,['admin'])) return; const patients=readJson(FILES.patients,defaultPatients); const i=patients.findIndex(p=>p.id===req.params.id); if(i<0) return res.status(404).json({message:'Patient not found'}); const body={...patients[i],...req.body,id:req.params.id}; const err=validatePatient(body,patients,req.params.id); if(err) return res.status(400).json({message:err}); patients[i]=body; writeJson(FILES.patients,patients); audit('PATIENT_UPDATE',`${body.name} updated`,req.user.username); broadcast('patients',body); res.json(body); });
app.delete('/api/patients/:id',(req,res)=>{ if(!auth(req,res,['admin'])) return; const patients=readJson(FILES.patients,defaultPatients); const p=patients.find(x=>x.id===req.params.id); if(!p) return res.status(404).json({message:'Patient not found'}); writeJson(FILES.patients,patients.filter(x=>x.id!==req.params.id)); audit('PATIENT_DELETE',`${p.name} removed`,req.user.username); broadcast('patients',{id:req.params.id,deleted:true}); res.json({success:true}); });

app.get('/api/rooms',(req,res)=>{ const patients=readJson(FILES.patients,defaultPatients); const rooms=[]; for(let r=101;r<=106;r++){ for(let b=1;b<=2;b++){ const p=patients.find(x=>String(x.room)===String(r)&&String(x.bed)===String(b)); rooms.push({room:String(r),bed:String(b),occupied:!!p,patient:p||null}); } } res.json(rooms); });

app.get('/api/appointments',(req,res)=>{ const a=readJson(FILES.appointments,defaultAppointments); res.json(req.query.patientId?a.filter(x=>x.patientId===req.query.patientId):a); });
app.post('/api/appointments',(req,res)=>{ if(!auth(req,res,['admin'])) return; const a=readJson(FILES.appointments,defaultAppointments); const b=req.body||{}; const item={id:`APT-${Date.now().toString().slice(-6)}`,patientId:b.patientId||'',patientName:b.patientName||'',room:String(b.room||''),bed:String(b.bed||''),doctor:b.doctor||'',specialty:b.specialty||'',date:b.date||new Date().toISOString().slice(0,10),time:b.time||'',reason:b.reason||'',priority:b.priority||'Routine',status:'Scheduled'}; a.unshift(item); writeJson(FILES.appointments,a); audit('APPOINTMENT_CREATE',`${item.patientName} - ${item.date} ${item.time}`,req.user.username); res.status(201).json(item); });
app.patch('/api/appointments/:id',(req,res)=>{ if(!auth(req,res,['admin','nurse'])) return; const a=readJson(FILES.appointments,defaultAppointments); const i=a.findIndex(x=>x.id===req.params.id); if(i<0)return res.status(404).json({message:'Appointment not found'}); a[i]={...a[i],...req.body}; writeJson(FILES.appointments,a); res.json(a[i]); });
app.delete('/api/appointments/:id',(req,res)=>{ if(!auth(req,res,['admin'])) return; const a=readJson(FILES.appointments,defaultAppointments); writeJson(FILES.appointments,a.filter(x=>x.id!==req.params.id)); audit('APPOINTMENT_DELETE',req.params.id,req.user.username); res.json({success:true}); });

app.get('/api/alerts',(req,res)=>{ let a=readJson(FILES.alerts,defaultAlerts); if(req.query.status&&req.query.status!=='all')a=a.filter(x=>x.status===req.query.status); if(req.query.priority&&req.query.priority!=='all')a=a.filter(x=>x.priority===req.query.priority); a.sort((x,y)=>new Date(y.timestamp)-new Date(x.timestamp)); if(req.query.limit)a=a.slice(0,Number(req.query.limit)); res.json(a); });
app.post('/api/alerts',(req,res)=>{ const b=req.body||{}; const patients=readJson(FILES.patients,defaultPatients); const p=patients.find(x=>x.id===b.patientId); const a=readJson(FILES.alerts,defaultAlerts); const item={id:b.id||`ALT-${Date.now().toString().slice(-7)}`,timestamp:new Date().toISOString(),patientId:b.patientId||p?.id||'',patient:b.patient||p?.name||'Patient',room:String(b.room||p?.room||''),bed:String(b.bed||p?.bed||''),gesture:b.gesture||'Unknown',requirement:b.requirement||'Assistance Required',message:b.message||'Assistance required.',confidence:Number(b.confidence||90),detectionStatus:b.detectionStatus||'Confirmed',priority:b.priority||'attention',status:'pending',language:b.language||'en',type:b.type||'hand_gesture'}; a.unshift(item); writeJson(FILES.alerts,a); liveState={...liveState,currentGesture:item.gesture,confidence:item.confidence,detectionStatus:item.detectionStatus,patientId:item.patientId,patientName:item.patient,room:item.room,bed:item.bed,priority:item.priority,timestamp:item.timestamp}; broadcast('alert',item); broadcast('live',liveState); res.status(201).json(item); });
app.patch('/api/alerts/:id',(req,res)=>{ const token=tokenFrom(req); const s=sessions.get(token); if(!s||s.expiresAt<Date.now()) return res.status(401).json({message:'Login required'}); if(s.role!=='admin') return res.status(403).json({message:'Admin access required.'}); const a=readJson(FILES.alerts,defaultAlerts); const i=a.findIndex(x=>x.id===req.params.id); if(i<0)return res.status(404).json({message:'Alert not found'}); const next=req.body.status; if(!['pending','acknowledged','resolved','archived'].includes(next)) return res.status(400).json({message:'Invalid alert state'}); if(a[i].priority==='emergency' && next==='archived' && s.role!=='admin') return res.status(403).json({message:'Emergency archival requires admin'}); a[i].status=next; if(next==='acknowledged')a[i].acknowledgedAt=new Date().toISOString(); if(next==='resolved')a[i].resolvedAt=new Date().toISOString(); if(next==='archived')a[i].archivedAt=new Date().toISOString(); writeJson(FILES.alerts,a); audit(`ALERT_${next.toUpperCase()}`,`${a[i].id} ${a[i].patient}`,s.username); broadcast('alert',a[i]); res.json(a[i]); });
app.delete('/api/alerts/:id',(req,res)=>{ if(!auth(req,res,['admin'])) return; const a=readJson(FILES.alerts,defaultAlerts); const target=a.find(x=>x.id===req.params.id); if(!target)return res.status(404).json({message:'Alert not found'}); if(target.priority==='emergency')return res.status(400).json({message:'Emergency alerts cannot be silently deleted. Archive after resolution.'}); writeJson(FILES.alerts,a.filter(x=>x.id!==req.params.id)); audit('ALERT_DELETE',`${target.id} deleted after confirmation`,req.user.username); res.json({success:true}); });

app.get('/api/reports',(req,res)=>{ const a=readJson(FILES.reports,defaultReports); res.json(req.query.patientId?a.filter(x=>x.patientId===req.query.patientId):a); });
app.post('/api/reports',upload.single('reportFile'),(req,res)=>{ if(!auth(req,res,['admin']))return; const b=req.body||{}; const item={id:`REP-${Date.now().toString().slice(-6)}`,patientId:b.patientId||'',patientName:b.patientName||'',room:b.room||'',bed:b.bed||'',title:b.title||'Clinical Report',type:b.type||'General',doctor:b.doctor||'',date:b.date||new Date().toISOString().slice(0,10),summary:b.summary||'',status:b.status||'Normal',fileName:req.file?.originalname||null,fileUrl:req.file?`/uploads/${req.file.filename}`:null}; const a=readJson(FILES.reports,defaultReports); a.unshift(item); writeJson(FILES.reports,a); audit('REPORT_CREATE',item.title,req.user.username); res.status(201).json(item); });
app.delete('/api/reports/:id',(req,res)=>{ if(!auth(req,res,['admin']))return; const a=readJson(FILES.reports,defaultReports); writeJson(FILES.reports,a.filter(x=>x.id!==req.params.id)); audit('REPORT_DELETE',req.params.id,req.user.username); res.json({success:true}); });

app.get('/api/patients/:id/timeline',(req,res)=>{
  const p=readJson(FILES.patients,defaultPatients).find(x=>x.id===req.params.id);
  if(!p) return res.status(404).json({message:'Patient not found'});
  const alerts=readJson(FILES.alerts,defaultAlerts).filter(x=>x.patientId===p.id).sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  res.json({patient:p,timeline:alerts});
});
app.get('/api/detection-metrics',(req,res)=>res.json(detectionSummary()));
app.get('/api/system-health',(req,res)=>res.json({
  server:'RUNNING', aiEngine:'ACTIVE', dataStore:fs.existsSync(DATA_DIR)?'ONLINE':'OFFLINE',
  camera:liveState.cameraActive?'ACTIVE':'READY', mobileSync:sseClients.size>0?'CONNECTED':'READY',
  sseClients:sseClients.size, uptimeSeconds:Math.round(process.uptime()), lastDetectionAt:liveState.timestamp,
  mode:liveState.mode, detection:detectionSummary()
}));

app.get('/api/stats',(req,res)=>{ const a=readJson(FILES.alerts,defaultAlerts),p=readJson(FILES.patients,defaultPatients),r=readJson(FILES.reports,defaultReports),ap=readJson(FILES.appointments,defaultAppointments); res.json({patients:p.length,total:a.length,pending:a.filter(x=>x.status==='pending').length,acknowledged:a.filter(x=>x.status==='acknowledged').length,resolved:a.filter(x=>x.status==='resolved').length,emergency:a.filter(x=>x.priority==='emergency').length,reportsCount:r.length,appointmentsCount:ap.length,invalidCount:a.filter(x=>x.type==='invalid_gesture').length}); });

app.get('/api/users',(req,res)=>{ if(!auth(req,res,['admin']))return; res.json(readJson(FILES.users,[]).map(u=>({username:u.username,name:u.name,role:u.role,updatedAt:u.updatedAt}))); });
app.post('/api/users',(req,res)=>{ if(!auth(req,res,['admin']))return; const b=req.body||{}; if(!b.username||!b.password||String(b.password).length<8||b.role !== 'admin')return res.status(400).json({message:'Admin username and password (8+ characters) are required.'}); const list=readJson(FILES.users,[]); if(list.some(u=>u.username===b.username))return res.status(400).json({message:'Username already exists.'}); const item={username:b.username,name:b.name||b.username,role:'admin',...hashPassword(b.password),updatedAt:new Date().toISOString()}; list.push(item); writeJson(FILES.users,list); audit('USER_CREATE',`${item.username} (${item.role})`,req.user.username); res.status(201).json({username:item.username,name:item.name,role:item.role}); });
app.delete('/api/users/:username',(req,res)=>{ if(!auth(req,res,['admin']))return; if(req.params.username===req.user.username)return res.status(400).json({message:'You cannot delete your own account.'}); const list=readJson(FILES.users,[]); const target=list.find(u=>u.username===req.params.username); if(!target)return res.status(404).json({message:'User not found'}); writeJson(FILES.users,list.filter(u=>u.username!==req.params.username)); audit('USER_DELETE',`${target.username} (${target.role})`,req.user.username); res.json({success:true}); });
app.get('/api/audit',(req,res)=>{ if(!auth(req,res,['admin']))return; res.json(readJson(FILES.audit,defaultAudit)); });
app.get('/api/settings',(req,res)=>{ if(!auth(req,res,['admin']))return; res.json(readJson(FILES.settings,defaultSettings)); });
app.put('/api/settings',(req,res)=>{ if(!auth(req,res,['admin']))return; const next={...readJson(FILES.settings,defaultSettings),...req.body}; writeJson(FILES.settings,next); audit('SETTINGS_UPDATE','System settings updated',req.user.username); res.json(next); });
app.post('/api/change-password',(req,res)=>{ if(!auth(req,res,['admin']))return; const {currentPassword,newPassword}=req.body||{}; if(!newPassword||newPassword.length<8)return res.status(400).json({message:'New password must be at least 8 characters.'}); const list=readJson(FILES.users,[]); const i=list.findIndex(u=>u.username===req.user.username); if(i<0||!verifyPassword(currentPassword,list[i]))return res.status(400).json({message:'Current password is incorrect.'}); Object.assign(list[i],hashPassword(newPassword),{updatedAt:new Date().toISOString()}); writeJson(FILES.users,list); audit('PASSWORD_CHANGE','Password changed',req.user.username); res.json({success:true}); });
app.get('/api/backup',(req,res)=>{ if(!auth(req,res,['admin']))return; const backup={createdAt:new Date().toISOString(),patients:readJson(FILES.patients,[]),alerts:readJson(FILES.alerts,[]),appointments:readJson(FILES.appointments,[]),reports:readJson(FILES.reports,[]),settings:readJson(FILES.settings,defaultSettings)}; res.setHeader('Content-Disposition',`attachment; filename="patient-system-backup-${Date.now()}.json"`); res.json(backup); });
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

app.get('/',(_,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.get('/dashboard',(_,res)=>res.sendFile(path.join(__dirname,'public','dashboard.html')));
app.get('/camera',(_,res)=>res.sendFile(path.join(__dirname,'public','camera.html')));
app.get('/nurse',(_,res)=>res.sendFile(path.join(__dirname,'public','dashboard.html')));
app.get('/mobile',(_,res)=>res.sendFile(path.join(__dirname,'public','mobile.html')));

app.listen(PORT,'0.0.0.0',()=>{ console.log(`\n🏥 AI-Based Patient Gesture Communication & Alert System`); console.log(`Local: http://localhost:${PORT}`); console.log(`Dashboard: http://${localIp()}:${PORT}/dashboard`); console.log(`Mobile: http://${localIp()}:${PORT}/mobile`); });
