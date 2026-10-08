/**
 * Multimodal face / eye / head communication engine.
 * Conservative by design: neutral/no-face states never generate alerts.
 */
const FaceHeadEngine = {
  lastPose:'CENTER', poseStartTime:0, lastPoseChange:0, shakeCount:0,
  eyesClosedStart:0, blinkCounter:0, lastBlinkTimestamp:0, rapidBlinkStart:0, rapidBlinkCount:0,
  lastActionTime:0, cooldownMs:5000,
  lastFaceSeen:0,

  reset(){
    this.lastPose='CENTER'; this.poseStartTime=Date.now(); this.lastPoseChange=Date.now();
    this.shakeCount=0; this.eyesClosedStart=0; this.blinkCounter=0; this.lastBlinkTimestamp=0;
    this.rapidBlinkStart=0; this.rapidBlinkCount=0;
  },
  dist(a,b){ return Math.hypot((a?.x||0)-(b?.x||0),(a?.y||0)-(b?.y||0)); },
  calculateEAR(top,bottom,left,right){ return this.dist(top,bottom)/(Math.max(this.dist(left,right),0.001)*2); },
  canTrigger(now){ return now-this.lastActionTime>this.cooldownMs; },
  action(type, requirement, priority, confidence, message, code){
    const now=Date.now();
    this.lastActionTime=now;
    return {type,requirement,priority,confidence,detectionStatus:'Confirmed',gestureCode:code,message};
  },
  processFaceLandmarks(lm){
    if(!lm || lm.length<400 || AppState.alertProcessing) return null;
    const now=Date.now(); this.lastFaceSeen=now;
    const nose=lm[1], leftEar=lm[234], rightEar=lm[454], forehead=lm[10], chin=lm[152];
    if(!nose||!leftEar||!rightEar||!forehead||!chin) return null;
    const faceHeight=Math.max(Math.abs(chin.y-forehead.y),0.08);
    const dl=Math.abs(nose.x-leftEar.x), dr=Math.abs(nose.x-rightEar.x), yaw=dl/Math.max(dr,0.01);
    const pitch=(nose.y-forehead.y)/faceHeight;
    let pose='CENTER';
    if(yaw>1.75) pose='TURN_LEFT'; else if(yaw<0.57) pose='TURN_RIGHT';
    else if(pitch<0.40) pose='HEAD_UP'; else if(pitch>0.64) pose='HEAD_DOWN';
    if(!this.poseStartTime) this.poseStartTime=now;
    if(pose!==this.lastPose){
      if((this.lastPose==='TURN_LEFT'&&pose==='TURN_RIGHT')||(this.lastPose==='TURN_RIGHT'&&pose==='TURN_LEFT')){
        this.shakeCount = (now-this.lastPoseChange<800) ? this.shakeCount+1 : 1;
      }
      this.lastPose=pose; this.poseStartTime=now; this.lastPoseChange=now;
    }
    const hold=now-this.poseStartTime;

    // Head emergency: repeated intentional left/right shaking.
    if(this.shakeCount>=4 && this.canTrigger(now)){
      this.shakeCount=0;
      return this.action('head','Head Emergency / Immediate Medical Assistance','emergency',96,'Repeated rapid head movement detected as an emergency communication signal.','HEAD_EMERGENCY');
    }
    if(this.shakeCount>=2 && hold>700 && this.canTrigger(now)){
      this.shakeCount=0;
      return this.action('head','Need Nurse Assistance / Head Movement','attention',90,'Repeated intentional head movement requests nurse attention.','HEAD_HELP');
    }
    if(hold>1600 && this.canTrigger(now)){
      if(pose==='TURN_LEFT') return this.action('head','Position Change — Left','normal',91,'Patient requests a position change to the left.','HEAD_LEFT');
      if(pose==='TURN_RIGHT') return this.action('head','Position Change — Right','normal',91,'Patient requests a position change to the right.','HEAD_RIGHT');
      if(pose==='HEAD_UP') return this.action('head','Raise Head / Breathing Assistance','attention',90,'Patient requests head elevation or breathing assistance.','HEAD_UP');
      if(pose==='HEAD_DOWN') return this.action('head','Pain / Discomfort','attention',88,'Sustained downward head position indicates discomfort.','HEAD_DOWN');
    }

    // Eyes: deliberate blink patterns only after the eye is clearly open/closed.
    const lEAR=this.calculateEAR(lm[159],lm[145],lm[33],lm[133]);
    const rEAR=this.calculateEAR(lm[386],lm[374],lm[362],lm[263]);
    const eyeRatio=(lEAR+rEAR)/2;
    const closed=eyeRatio<0.17;
    if(closed){
      if(!this.eyesClosedStart) this.eyesClosedStart=now;
      const dur=now-this.eyesClosedStart;
      if(dur>2800 && this.canTrigger(now)) return this.action('eye','Prolonged Eye Closure / Monitoring','normal',91,'Prolonged eye closure detected; monitoring signal recorded.','EYE_LONG_CLOSURE');
    } else if(this.eyesClosedStart){
      const dur=now-this.eyesClosedStart; this.eyesClosedStart=0;
      if(dur>=120 && dur<=650){
        this.blinkCounter++; this.lastBlinkTimestamp=now;
        if(now-this.rapidBlinkStart<2500) this.rapidBlinkCount++; else {this.rapidBlinkStart=now;this.rapidBlinkCount=1;}
        if(this.rapidBlinkCount>=4 && this.canTrigger(now)){
          this.rapidBlinkCount=0; this.blinkCounter=0;
          return this.action('eye','Eye Emergency / Immediate Medical Assistance','emergency',96,'Repeated deliberate blinking detected as an emergency communication signal.','EYE_EMERGENCY');
        }
      }
    }
    if(this.blinkCounter>0 && now-this.lastBlinkTimestamp>1000){
      const c=this.blinkCounter; this.blinkCounter=0;
      if(this.canTrigger(now)){
        if(c===1) return this.action('eye','Yes / All OK — Single Blink','normal',93,'Single deliberate blink communicates yes or OK.','EYE_SINGLE_BLINK');
        if(c===2) return this.action('eye','Need Help — Double Blink','attention',93,'Double deliberate blink requests assistance.','EYE_DOUBLE_BLINK');
        if(c>=3) return this.action('eye','Eye Emergency / Immediate Medical Assistance','emergency',96,'Three deliberate blinks request immediate medical assistance.','EYE_TRIPLE_BLINK');
      }
    }

    // Facial actions: mouth, smile and frown signals. Use normalized geometry and hold time.
    const mouthGap=this.dist(lm[13],lm[14])/faceHeight;
    const mouthWidth=Math.max(this.dist(lm[61],lm[291]),0.01);
    const smileRatio=this.dist(lm[61],lm[291])/Math.max(this.dist(lm[78],lm[308]),0.01);
    const browGap=this.dist(lm[70],lm[300])/faceHeight;
    if(mouthGap>0.30 && hold>1200 && this.canTrigger(now)){
      return this.action('face','Facial Emergency / Breathing Distress','emergency',93,'Prolonged open-mouth facial signal detected as a possible emergency communication.','FACE_BREATHING_EMERGENCY');
    }
    if(mouthGap>0.16 && mouthGap<0.30 && hold>900 && this.canTrigger(now)){
      return this.action('face','Open Mouth — Need Attention','attention',88,'Open-mouth facial action requests attention.','FACE_OPEN_MOUTH');
    }
    if(smileRatio>1.10 && hold>1200 && this.canTrigger(now)){
      return this.action('face','Smile — Feeling Better','normal',87,'Sustained smile facial action communicates a positive response.','FACE_SMILE');
    }
    if(browGap<0.72 && hold>1200 && this.canTrigger(now)){
      return this.action('face','Frown / Distress — Need Help','attention',86,'Sustained furrowed-brow facial action indicates distress or discomfort.','FACE_FROWN');
    }
    return null;
  }
};
