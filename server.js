const express=require("express"),path=require("path"),multer=require("multer"),fs=require("fs");
const app=express(),PORT=process.env.PORT||10000;
const publicDir=path.join(__dirname,"public"),dataDir=path.join(__dirname,"data"),uploadDir=path.join(__dirname,"uploads");
[publicDir,dataDir,uploadDir].forEach(d=>fs.mkdirSync(d,{recursive:true}));
const dbFile=path.join(dataDir,"db.json");
const defaults={users:[{id:"P1001",name:"Demo Patient",role:"patient",room:"204",bed:"3",language:"en"},{id:"N1001",name:"Demo Nurse",role:"nurse",language:"en"},{id:"D1001",name:"Demo Doctor",role:"doctor",language:"en"},{id:"A1001",name:"System Admin",role:"admin",language:"en"}],alerts:[],reports:[],appointments:[{id:1,patientId:"P1001",doctor:"Dr. Ananya",date:"2026-09-05",time:"10:30",status:"Scheduled"}],devices:[]};
if(!fs.existsSync(dbFile))fs.writeFileSync(dbFile,JSON.stringify(defaults,null,2));
function read(){try{return {...defaults,...JSON.parse(fs.readFileSync(dbFile,"utf8"))}}catch(e){fs.writeFileSync(dbFile,JSON.stringify(defaults,null,2));return {...defaults}}}
function write(x){
  const tmp=dbFile+'.tmp';
  fs.writeFileSync(tmp,JSON.stringify(x,null,2),'utf8');
  fs.renameSync(tmp,dbFile);
}
function id(p){return p+Date.now()+Math.random().toString(36).slice(2,7)}
app.use(express.json({limit:"2mb"}));app.use(express.urlencoded({extended:true,limit:"2mb"}));app.use(express.static(publicDir));
const storage=multer.diskStorage({destination:(r,f,cb)=>cb(null,uploadDir),filename:(r,f,cb)=>cb(null,Date.now()+"-"+Math.random().toString(36).slice(2,8)+path.extname(f.originalname).toLowerCase())});
const upload=multer({storage,limits:{fileSize:8*1024*1024},fileFilter:(r,f,cb)=>{const e=path.extname(f.originalname).toLowerCase();cb([".pdf",".png",".jpg",".jpeg"].includes(e)?null:new Error("Only PDF, JPG, JPEG and PNG files are allowed."),[".pdf",".png",".jpg",".jpeg"].includes(e))}});
app.get("/api/health",(q,s)=>s.json({ok:true,service:"CareGesture AI",time:new Date().toISOString(),database:fs.existsSync(dbFile)}));
app.get("/api/state",(q,s)=>s.json(read()));app.get("/api/users",(q,s)=>s.json(read().users));app.get("/api/alerts",(q,s)=>s.json(read().alerts));
app.post("/api/alerts",(q,s)=>{
  try{
    const b=q.body||{};
    if(!b.patientId||!String(b.message||"").trim())return s.status(400).json({error:"patientId and message are required"});
    const db=read(),c=Number(b.confidence);
    const a={id:id("AL"),patientId:String(b.patientId),patientName:String(b.patientName||"Patient"),room:String(b.room||"-"),bed:String(b.bed||"-"),gesture:String(b.gesture||"Manual"),message:String(b.message).trim(),language:String(b.language||"en"),priority:["Normal","High","Critical"].includes(b.priority)?b.priority:"Normal",confidence:Number.isFinite(c)?Math.max(0,Math.min(100,c)):0,status:"New",createdAt:new Date().toISOString(),acknowledgedAt:null,resolvedAt:null};
    db.alerts=Array.isArray(db.alerts)?db.alerts:[];db.alerts.unshift(a);write(db);return s.status(201).json(a);
  }catch(e){console.error("ALERT_SAVE_ERROR",e);return s.status(500).json({error:"Alert could not be saved",detail:e.message});}
});
app.patch("/api/alerts/:id",(q,s)=>{const db=read(),a=db.alerts.find(x=>String(x.id)===String(q.params.id));if(!a)return s.status(404).json({error:"Alert not found"});const n=new Date().toISOString();if(q.body.action==="acknowledge"){a.status="Acknowledged";a.acknowledgedAt=n}else if(q.body.action==="resolve"){a.status="Resolved";a.resolvedAt=n}else if(q.body.action==="escalate"){a.status="Escalated";a.priority="Critical"}else return s.status(400).json({error:"Invalid action"});write(db);s.json(a)});
app.post("/api/devices/register",(q,s)=>{const b=q.body||{},db=read();if(!b.userId||!b.token)return s.status(400).json({error:"userId and token required"});db.devices=(db.devices||[]).filter(x=>x.token!==b.token);db.devices.push({userId:String(b.userId),role:String(b.role||"nurse"),token:String(b.token),platform:String(b.platform||"android"),updatedAt:new Date().toISOString()});write(db);s.status(201).json({ok:true})});
app.get("/api/devices",(q,s)=>s.json(read().devices||[]));
app.get("/api/reports",(q,s)=>s.json(read().reports));
app.post("/api/reports",upload.single("report"),(q,s)=>{if(!q.file)return s.status(400).json({error:"No report uploaded"});const db=read(),r={id:id("REP"),patientId:String(q.body.patientId||"P1001"),originalName:q.file.originalname,storedName:q.file.filename,type:q.file.mimetype,size:q.file.size,uploadedAt:new Date().toISOString(),analysis:"Demo document intake complete."};db.reports.unshift(r);write(db);s.status(201).json(r)});
app.get("/api/appointments",(q,s)=>s.json(read().appointments));
app.post("/api/appointments",(q,s)=>{const b=q.body||{};if(!b.date||!b.time)return s.status(400).json({error:"date and time are required"});const db=read(),a={id:Date.now(),patientId:String(b.patientId||"P1001"),doctor:String(b.doctor||"Dr. Ananya"),date:String(b.date),time:String(b.time),status:"Scheduled",createdAt:new Date().toISOString()};db.appointments.unshift(a);write(db);s.status(201).json(a)});
app.get("/uploads/:filename",(q,s)=>{const f=path.join(uploadDir,path.basename(q.params.filename));fs.existsSync(f)?s.sendFile(f):s.status(404).json({error:"File not found"})});
app.get("/",(q,s)=>s.sendFile(path.join(publicDir,"index.html")));
app.use((q,s,n)=>{if(q.method==="GET"&&q.accepts("html")&&!q.path.startsWith("/api/")&&!q.path.startsWith("/uploads/"))return s.sendFile(path.join(publicDir,"index.html"));n()});
app.use((q,s)=>s.status(404).json({error:"Route not found"}));app.use((e,q,s,n)=>s.status(400).json({error:e.message||"Request failed"}));
app.listen(PORT,"0.0.0.0",()=>console.log(`CareGesture AI running on http://0.0.0.0:${PORT}`));