const express=require("express");
const path=require("path");
const multer=require("multer");
const fs=require("fs");

const app=express();
const PORT=Number(process.env.PORT)||10000;
const publicDir=path.join(__dirname,"public");
const dataDir=path.join(__dirname,"data");
const uploadDir=path.join(__dirname,"uploads");

[publicDir,dataDir,uploadDir].forEach(d=>fs.mkdirSync(d,{recursive:true}));

const dbFile=path.join(dataDir,"db.json");

const defaults={
  users:[
    {id:"P1001",name:"Demo Patient",role:"patient",room:"204",bed:"3",language:"en"},
    {id:"N1001",name:"Demo Nurse",role:"nurse",language:"en"},
    {id:"D1001",name:"Demo Doctor",role:"doctor",language:"en"},
    {id:"A1001",name:"System Admin",role:"admin",language:"en"}
  ],
  alerts:[],
  reports:[],
  appointments:[
    {id:1,patientId:"P1001",doctor:"Dr. Ananya",date:"2026-09-05",time:"10:30",status:"Scheduled"}
  ],
  devices:[]
};

function cloneDefaults(){
  return JSON.parse(JSON.stringify(defaults));
}

function ensureDb(){
  if(!fs.existsSync(dbFile)){
    fs.writeFileSync(dbFile,JSON.stringify(defaults,null,2),"utf8");
  }
}

function read(){
  try{
    ensureDb();
    const parsed=JSON.parse(fs.readFileSync(dbFile,"utf8"));
    return {
      ...cloneDefaults(),
      ...parsed,
      users:Array.isArray(parsed.users)?parsed.users:cloneDefaults().users,
      alerts:Array.isArray(parsed.alerts)?parsed.alerts:[],
      reports:Array.isArray(parsed.reports)?parsed.reports:[],
      appointments:Array.isArray(parsed.appointments)?parsed.appointments:[],
      devices:Array.isArray(parsed.devices)?parsed.devices:[]
    };
  }catch(e){
    console.error("DB_READ_ERROR",e);
    const fresh=cloneDefaults();
    try{fs.writeFileSync(dbFile,JSON.stringify(fresh,null,2),"utf8")}catch(writeError){console.error("DB_REPAIR_ERROR",writeError)}
    return fresh;
  }
}

function write(db){
  const tmp=dbFile+"."+process.pid+".tmp";
  fs.writeFileSync(tmp,JSON.stringify(db,null,2),"utf8");
  fs.renameSync(tmp,dbFile);
}

function id(prefix){
  return prefix+Date.now()+Math.random().toString(36).slice(2,8);
}

app.use(express.json({limit:"2mb"}));
app.use(express.urlencoded({extended:true,limit:"2mb"}));
app.use(express.static(publicDir));

const storage=multer.diskStorage({
  destination:(req,file,cb)=>cb(null,uploadDir),
  filename:(req,file,cb)=>cb(null,Date.now()+"-"+Math.random().toString(36).slice(2,8)+path.extname(file.originalname).toLowerCase())
});

const upload=multer({
  storage,
  limits:{fileSize:8*1024*1024},
  fileFilter:(req,file,cb)=>{
    const e=path.extname(file.originalname).toLowerCase();
    const ok=[".pdf",".png",".jpg",".jpeg"].includes(e);
    cb(ok?null:new Error("Only PDF, JPG, JPEG and PNG files are allowed."),ok);
  }
});

app.get("/api/health",(req,res)=>res.json({
  ok:true,
  service:"CareGesture AI",
  time:new Date().toISOString(),
  database:fs.existsSync(dbFile)
}));

app.get("/api/state",(req,res)=>res.json(read()));
app.get("/api/users",(req,res)=>res.json(read().users));
app.get("/api/alerts",(req,res)=>res.json(read().alerts));

app.post("/api/alerts",(req,res)=>{
  try{
    const b=req.body||{};
    const patientId=String(b.patientId||"").trim();
    const message=String(b.message||"").trim();

    if(!patientId||!message){
      return res.status(400).json({ok:false,error:"patientId and message are required"});
    }

    const db=read();
    const confidence=Number(b.confidence);

    const alert={
      id:id("AL"),
      patientId,
      patientName:String(b.patientName||"Patient"),
      room:String(b.room||"-"),
      bed:String(b.bed||"-"),
      gesture:String(b.gesture||"Manual"),
      message,
      language:["en","kn","hi"].includes(String(b.language))?String(b.language):"en",
      priority:["Normal","High","Critical"].includes(String(b.priority))?String(b.priority):"Normal",
      confidence:Number.isFinite(confidence)?Math.max(0,Math.min(100,confidence)):0,
      status:"New",
      createdAt:new Date().toISOString(),
      acknowledgedAt:null,
      resolvedAt:null
    };

    if(!Array.isArray(db.alerts))db.alerts=[];
    db.alerts.unshift(alert);
    write(db);

    // Return the exact saved alert only after the file write succeeds.
    return res.status(201).json({ok:true,...alert});
  }catch(e){
    console.error("ALERT_SAVE_ERROR",e);
    return res.status(500).json({
      ok:false,
      error:"Alert could not be saved",
      detail:e.message||"Database write failed"
    });
  }
});

app.patch("/api/alerts/:id",(req,res)=>{
  try{
    const db=read();
    const alert=db.alerts.find(x=>String(x.id)===String(req.params.id));
    if(!alert)return res.status(404).json({ok:false,error:"Alert not found"});

    const action=String(req.body?.action||"");
    const now=new Date().toISOString();

    if(action==="acknowledge"){
      alert.status="Acknowledged";
      alert.acknowledgedAt=now;
    }else if(action==="resolve"){
      alert.status="Resolved";
      alert.resolvedAt=now;
    }else if(action==="escalate"){
      alert.status="Escalated";
      alert.priority="Critical";
    }else{
      return res.status(400).json({ok:false,error:"Invalid action"});
    }

    write(db);
    return res.json({ok:true,...alert});
  }catch(e){
    console.error("ALERT_UPDATE_ERROR",e);
    return res.status(500).json({ok:false,error:"Alert update failed",detail:e.message});
  }
});

app.post("/api/devices/register",(req,res)=>{
  try{
    const b=req.body||{};
    if(!b.userId||!b.token)return res.status(400).json({ok:false,error:"userId and token required"});
    const db=read();
    db.devices=(db.devices||[]).filter(x=>x.token!==String(b.token));
    db.devices.push({
      userId:String(b.userId),
      role:String(b.role||"nurse"),
      token:String(b.token),
      platform:String(b.platform||"android"),
      updatedAt:new Date().toISOString()
    });
    write(db);
    return res.status(201).json({ok:true});
  }catch(e){
    console.error("DEVICE_REGISTER_ERROR",e);
    return res.status(500).json({ok:false,error:"Device registration failed",detail:e.message});
  }
});

app.get("/api/devices",(req,res)=>res.json(read().devices||[]));

app.get("/api/reports",(req,res)=>res.json(read().reports));

app.post("/api/reports",upload.single("report"),(req,res)=>{
  try{
    if(!req.file)return res.status(400).json({ok:false,error:"No report uploaded"});
    const db=read();
    const report={
      id:id("REP"),
      patientId:String(req.body.patientId||"P1001"),
      originalName:req.file.originalname,
      storedName:req.file.filename,
      type:req.file.mimetype,
      size:req.file.size,
      uploadedAt:new Date().toISOString(),
      analysis:"Demo document intake complete."
    };
    db.reports.unshift(report);
    write(db);
    return res.status(201).json(report);
  }catch(e){
    console.error("REPORT_SAVE_ERROR",e);
    return res.status(500).json({ok:false,error:"Report could not be saved",detail:e.message});
  }
});

app.get("/api/appointments",(req,res)=>res.json(read().appointments));

app.post("/api/appointments",(req,res)=>{
  try{
    const b=req.body||{};
    if(!b.date||!b.time)return res.status(400).json({ok:false,error:"date and time are required"});
    const db=read();
    const appointment={
      id:Date.now(),
      patientId:String(b.patientId||"P1001"),
      doctor:String(b.doctor||"Dr. Ananya"),
      date:String(b.date),
      time:String(b.time),
      status:"Scheduled",
      createdAt:new Date().toISOString()
    };
    db.appointments.unshift(appointment);
    write(db);
    return res.status(201).json(appointment);
  }catch(e){
    console.error("APPOINTMENT_SAVE_ERROR",e);
    return res.status(500).json({ok:false,error:"Appointment could not be saved",detail:e.message});
  }
});

app.get("/uploads/:filename",(req,res)=>{
  const file=path.join(uploadDir,path.basename(req.params.filename));
  return fs.existsSync(file)?res.sendFile(file):res.status(404).json({ok:false,error:"File not found"});
});

app.get("/",(req,res)=>res.sendFile(path.join(publicDir,"index.html")));

app.use((req,res,next)=>{
  if(req.method==="GET"&&req.accepts("html")&&!req.path.startsWith("/api/")&&!req.path.startsWith("/uploads/")){
    return res.sendFile(path.join(publicDir,"index.html"));
  }
  next();
});

app.use((req,res)=>res.status(404).json({ok:false,error:"Route not found"}));

app.use((err,req,res,next)=>{
  console.error("SERVER_ERROR",err);
  res.status(400).json({ok:false,error:err.message||"Request failed"});
});

app.listen(PORT,"0.0.0.0",()=>console.log(`CareGesture AI running on http://0.0.0.0:${PORT}`));
