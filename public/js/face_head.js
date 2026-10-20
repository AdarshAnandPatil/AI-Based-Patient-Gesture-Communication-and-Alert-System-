/**
 * Multimodal face / eye / head communication engine.
 * The camera selects ONE modality at a time. No other modality can create an alert.
 */
const FaceHeadEngine = {
  lastPose:'CENTER', poseStartTime:0, lastPoseChange:0, shakeCount:0,
  eyesClosedStart:0, blinkCounter:0, lastBlinkTimestamp:0, rapidBlinkStart:0, rapidBlinkCount:0,
  lastActionTime:0, cooldownMs:2200,

  reset(){
    this.lastPose='CENTER'; this.poseStartTime=Date.now(); this.lastPoseChange=Date.now();
    this.shakeCount=0; this.eyesClosedStart=0; this.blinkCounter=0; this.lastBlinkTimestamp=0;
    this.rapidBlinkStart=0; this.rapidBlinkCount=0; this.lastActionTime=0;
  },
  dist(a,b){ return Math.hypot((a?.x||0)-(b?.x||0),(a?.y||0)-(b?.y||0)); },
  calculateEAR(top,bottom,left,right){ return this.dist(top,bottom)/(Math.max(this.dist(left,right),0.001)*2); },
  canTrigger(now){ return now-this.lastActionTime>this.cooldownMs; },
  action(type, requirement, priority, confidence, message, code){
    const now=Date.now(); this.lastActionTime=now;
    return {type,requirement,priority,confidence:Math.round(confidence),detectionStatus:'Confirmed',gestureCode:code,message};
  },
  baseFace(lm){
    if(!lm || lm.length<400) return null;
    const nose=lm[1], leftEar=lm[234], rightEar=lm[454], forehead=lm[10], chin=lm[152];
    if(!nose||!leftEar||!rightEar||!forehead||!chin) return null;
    const faceHeight=Math.max(Math.abs(chin.y-forehead.y),0.08);
    const dl=Math.abs(nose.x-leftEar.x), dr=Math.abs(nose.x-rightEar.x);
    const yaw=dl/Math.max(dr,0.01);
    const pitch=(nose.y-forehead.y)/faceHeight;
    return {nose,forehead,chin,faceHeight,yaw,pitch};
  },

  processHead(lm){
    const b=this.baseFace(lm); if(!b) return null;
    const now=Date.now();
    let pose='CENTER';
    // Conservative pose thresholds to avoid normal small movements.
    if(b.yaw>1.72) pose='TURN_LEFT';
    else if(b.yaw<0.58) pose='TURN_RIGHT';
    else if(b.pitch<0.38) pose='HEAD_UP';
    else if(b.pitch>0.66) pose='HEAD_DOWN';

    if(!this.poseStartTime) this.poseStartTime=now;
    if(pose!==this.lastPose){
      if((this.lastPose==='TURN_LEFT'&&pose==='TURN_RIGHT')||(this.lastPose==='TURN_RIGHT'&&pose==='TURN_LEFT')){
        this.shakeCount=(now-this.lastPoseChange<900)?this.shakeCount+1:1;
      }
      this.lastPose=pose; this.poseStartTime=now; this.lastPoseChange=now;
    }
    const hold=now-this.poseStartTime;
    if(this.shakeCount>=4 && this.canTrigger(now)){
      this.shakeCount=0;
      return this.action('head','Emergency Head Shake — Immediate Assistance','emergency',97,'Repeated deliberate left-right head movement detected as an emergency signal.','HEAD_EMERGENCY');
    }
    if(this.shakeCount>=2 && hold>500 && this.canTrigger(now)){
      this.shakeCount=0;
      return this.action('head','Repeated Head Movement — Need Nurse','attention',92,'Repeated deliberate head movement requests nurse assistance.','HEAD_HELP');
    }
    if(hold>1500 && this.canTrigger(now)){
      if(pose==='TURN_LEFT') return this.action('head','Head Left — Position Change','normal',93,'Patient requests a position change to the left.','HEAD_LEFT');
      if(pose==='TURN_RIGHT') return this.action('head','Head Right — Position Change','normal',93,'Patient requests a position change to the right.','HEAD_RIGHT');
      if(pose==='HEAD_UP') return this.action('head','Head Up — Breathing Assistance','attention',92,'Patient requests head elevation or breathing assistance.','HEAD_UP');
      if(pose==='HEAD_DOWN') return this.action('head','Head Down — Pain / Discomfort','attention',90,'Sustained downward head position indicates discomfort.','HEAD_DOWN');
    }
    return null;
  },

  processEye(lm){
    const b=this.baseFace(lm); if(!b) return null;
    const now=Date.now();
    const lEAR=this.calculateEAR(lm[159],lm[145],lm[33],lm[133]);
    const rEAR=this.calculateEAR(lm[386],lm[374],lm[362],lm[263]);
    const eyeRatio=(lEAR+rEAR)/2;
    const closed=eyeRatio<0.155;
    if(closed){
      if(!this.eyesClosedStart) this.eyesClosedStart=now;
      const dur=now-this.eyesClosedStart;
      if(dur>3200 && this.canTrigger(now)) return this.action('eye','Prolonged Eye Closure — Monitoring','attention',93,'Prolonged eye closure detected.','EYE_LONG_CLOSURE');
      return null;
    }
    if(this.eyesClosedStart){
      const dur=now-this.eyesClosedStart; this.eyesClosedStart=0;
      if(dur>=120 && dur<=650){
        this.blinkCounter++; this.lastBlinkTimestamp=now;
        if(now-this.rapidBlinkStart<2600) this.rapidBlinkCount++; else {this.rapidBlinkStart=now;this.rapidBlinkCount=1;}
        if(this.rapidBlinkCount>=4 && this.canTrigger(now)){
          this.rapidBlinkCount=0; this.blinkCounter=0;
          return this.action('eye','Emergency Rapid Blink — Immediate Assistance','emergency',98,'Repeated deliberate rapid blinking detected as an emergency signal.','EYE_EMERGENCY');
        }
      }
    }
    if(this.blinkCounter>0 && now-this.lastBlinkTimestamp>900){
      const c=this.blinkCounter; this.blinkCounter=0;
      if(this.canTrigger(now)){
        if(c===1) return this.action('eye','Single Blink — Yes / OK','normal',94,'Single deliberate blink communicates yes or OK.','EYE_SINGLE_BLINK');
        if(c===2) return this.action('eye','Double Blink — Need Help','attention',95,'Double deliberate blink requests assistance.','EYE_DOUBLE_BLINK');
        return this.action('eye','Triple Blink — Emergency','emergency',97,'Three deliberate blinks request immediate medical assistance.','EYE_TRIPLE_BLINK');
      }
    }
    return null;
  },

  processFace(lm){
    const b=this.baseFace(lm); if(!b) return null;
    const now=Date.now();
    const mouthGap=this.dist(lm[13],lm[14])/b.faceHeight;
    const mouthWidth=Math.max(this.dist(lm[61],lm[291]),0.01);
    const mouthCenterY=(lm[13].y+lm[14].y)/2;
    const cornerAvgY=(lm[61].y+lm[291].y)/2;
    const cornerLift=(mouthCenterY-cornerAvgY)/b.faceHeight;
    const browY=(lm[70].y+lm[300].y)/2;
    const browLift=(lm[10].y-browY)/b.faceHeight;

    // Open mouth must be held to avoid ordinary speech/brief mouth motion triggering.
    if(mouthGap>0.30 && this.canTrigger(now)) return this.action('face','Open Mouth — Breathing Emergency','emergency',95,'Sustained open-mouth signal indicates possible breathing distress.','FACE_BREATHING_EMERGENCY');
    if(mouthGap>0.16 && mouthGap<=0.30 && this.canTrigger(now)) return this.action('face','Open Mouth — Need Attention','attention',90,'Sustained open-mouth facial action requests attention.','FACE_OPEN_MOUTH');
    if(cornerLift>0.025 && mouthWidth>0.07 && this.canTrigger(now)) return this.action('face','Smile — Feeling Better','normal',91,'Sustained upward mouth-corner movement communicates a positive response.','FACE_SMILE');
    if(cornerLift<-0.025 && browLift<0.10 && this.canTrigger(now)) return this.action('face','Frown / Distress — Need Help','attention',90,'Downturned mouth corners indicate distress or discomfort.','FACE_FROWN');
    return null;
  },

  processFaceLandmarks(lm, modality='face'){
    if(!lm || lm.length<400) return null;
    if(modality==='head') return this.processHead(lm);
    if(modality==='eye') return this.processEye(lm);
    if(modality==='face') return this.processFace(lm);
    return null;
  }
};
