/**
 * face_head.js - Facial Communication, Eye Blink & Head Movement Recognition
 * AI-Based Patient Gesture Communication and Alert System
 * 
 * Non-verbal patient communication signals (NOT medical diagnosis).
 * All events strictly check AppState.alertProcessing before firing.
 */

const FaceHeadEngine = {
  // Eye state tracking
  eyeHistory: [],
  blinkCounter: 0,
  lastBlinkTimestamp: 0,
  eyesClosedStart: 0,
  rapidBlinkStart: 0,
  rapidBlinkCount: 0,

  // Head tracking
  headPoseHistory: [],
  lastPose: 'CENTER',
  poseStartTime: 0,
  lastShakeTime: 0,
  shakeCount: 0,

  // Debounce cooldown
  lastTriggeredAction: null,
  lastActionTime: 0,
  cooldownMs: 4000,

  /**
   * Calculate Eye Aspect Ratio (EAR) approximation
   */
  calculateEAR(eyeTop, eyeBottom, eyeLeft, eyeRight) {
    const vertical = Math.hypot(eyeTop.x - eyeBottom.x, eyeTop.y - eyeBottom.y);
    const horizontal = Math.hypot(eyeLeft.x - eyeRight.x, eyeLeft.y - eyeRight.y) || 0.01;
    return vertical / (horizontal * 2.0);
  },

  /**
   * Process Face Mesh landmarks (or synthetic values for demo testing)
   */
  processFaceLandmarks(faceLandmarks) {
    if (!faceLandmarks || faceLandmarks.length === 0) return null;
    if (AppState.alertProcessing) return null; // Global Alert Lock check!

    const now = Date.now();

    // Key points (MediaPipe FaceMesh index approximations):
    // Nose tip: 1, Left ear: 234, Right ear: 454, Forehead: 10, Chin: 152
    // Left eye: top 159, bottom 145, left 33, right 133
    // Right eye: top 386, bottom 374, left 362, right 263
    // Mouth: top lip 13, bottom lip 14, left 61, right 291
    // Eyebrows: left 70, right 300

    const nose = faceLandmarks[1] || { x: 0.5, y: 0.5 };
    const leftEar = faceLandmarks[234] || { x: 0.3, y: 0.5 };
    const rightEar = faceLandmarks[454] || { x: 0.7, y: 0.5 };
    const forehead = faceLandmarks[10] || { x: 0.5, y: 0.2 };
    const chin = faceLandmarks[152] || { x: 0.5, y: 0.8 };

    // ─── 1. Head Movement & Pose Estimation ──────────────────────────────────
    // Yaw estimation: compare nose distance to left ear vs right ear
    const distToLeft = Math.abs(nose.x - leftEar.x);
    const distToRight = Math.abs(nose.x - rightEar.x);
    const yawRatio = distToLeft / (distToRight || 0.01);

    // Pitch estimation: nose position relative to forehead and chin
    const faceHeight = Math.abs(chin.y - forehead.y) || 0.1;
    const pitchRatio = (nose.y - forehead.y) / faceHeight;

    let currentPose = 'CENTER';
    if (yawRatio > 1.8) {
      currentPose = 'TURN_LEFT';
    } else if (yawRatio < 0.55) {
      currentPose = 'TURN_RIGHT';
    } else if (pitchRatio < 0.42) {
      currentPose = 'HEAD_UP';
    } else if (pitchRatio > 0.62) {
      currentPose = 'HEAD_DOWN';
    }

    // Pose hold duration
    if (currentPose !== this.lastPose) {
      // Check for rapid left-right shaking
      if ((this.lastPose === 'TURN_LEFT' && currentPose === 'TURN_RIGHT') ||
          (this.lastPose === 'TURN_RIGHT' && currentPose === 'TURN_LEFT')) {
        if (now - this.lastShakeTime < 700) {
          this.shakeCount++;
        } else {
          this.shakeCount = 1;
        }
        this.lastShakeTime = now;
      }
      this.lastPose = currentPose;
      this.poseStartTime = now;
    }

    const holdDuration = now - this.poseStartTime;

    // Head triggers (require sustained hold or shaking pattern):
    if (this.shakeCount >= 4 && (now - this.lastActionTime > this.cooldownMs)) {
      this.shakeCount = 0;
      this.lastActionTime = now;
      return {
        type: 'head',
        requirement: 'Rapid Shaking / Immediate Medical Assistance',
        priority: 'emergency',
        confidence: 94,
        detectionStatus: 'Confirmed',
        message: 'Rapid repeated head shaking detected. Immediate medical assistance required.'
      };
    }

    if (this.shakeCount >= 2 && holdDuration > 600 && (now - this.lastActionTime > this.cooldownMs)) {
      this.shakeCount = 0;
      this.lastActionTime = now;
      return {
        type: 'head',
        requirement: 'Repeated Head Movement / Need Nurse Attention',
        priority: 'attention',
        confidence: 89,
        detectionStatus: 'Confirmed',
        message: 'Repeated left-right movement detected. Nurse attention requested.'
      };
    }

    if (holdDuration > 1500 && (now - this.lastActionTime > this.cooldownMs)) {
      if (currentPose === 'TURN_LEFT') {
        this.lastActionTime = now;
        return {
          type: 'head',
          requirement: 'Need Position Change / Turn Left',
          priority: 'normal',
          confidence: 91,
          detectionStatus: 'Confirmed',
          message: 'Left head tilt held. Patient requests position change to left.'
        };
      } else if (currentPose === 'TURN_RIGHT') {
        this.lastActionTime = now;
        return {
          type: 'head',
          requirement: 'Need Position Change / Turn Right',
          priority: 'normal',
          confidence: 91,
          detectionStatus: 'Confirmed',
          message: 'Right head tilt held. Patient requests position change to right.'
        };
      } else if (currentPose === 'HEAD_UP') {
        this.lastActionTime = now;
        return {
          type: 'head',
          requirement: 'Need Breathing Assistance / Raise Head',
          priority: 'attention',
          confidence: 90,
          detectionStatus: 'Confirmed',
          message: 'Head raised up held. Breathing assistance requested.'
        };
      } else if (currentPose === 'HEAD_DOWN') {
        this.lastActionTime = now;
        return {
          type: 'head',
          requirement: 'Pain / Discomfort',
          priority: 'attention',
          confidence: 88,
          detectionStatus: 'Confirmed',
          message: 'Downward head posture. Discomfort or pain signal.'
        };
      }
    }

    // ─── 2. Eye Blink Communication ──────────────────────────────────────────
    // Eye landmarks approximation
    const leftEarVal = this.calculateEAR(
      faceLandmarks[159] || { x: 0.4, y: 0.38 },
      faceLandmarks[145] || { x: 0.4, y: 0.40 },
      faceLandmarks[33] || { x: 0.35, y: 0.39 },
      faceLandmarks[133] || { x: 0.45, y: 0.39 }
    );
    const isEyesClosed = leftEarVal < 0.18;

    if (isEyesClosed) {
      if (!this.eyesClosedStart) {
        this.eyesClosedStart = now;
      }
      const closedDuration = now - this.eyesClosedStart;
      if (closedDuration > 2600 && (now - this.lastActionTime > this.cooldownMs)) {
        this.lastActionTime = now;
        return {
          type: 'eye',
          requirement: 'Prolonged Eye Closure / Monitoring',
          priority: 'normal',
          confidence: 92,
          detectionStatus: 'Confirmed',
          message: 'Prolonged eye closure detected. Patient state monitoring active.'
        };
      }
    } else {
      // Eyes just reopened
      if (this.eyesClosedStart && (now - this.eyesClosedStart > 120 && now - this.eyesClosedStart < 800)) {
        // Valid deliberate blink
        this.blinkCounter++;
        this.lastBlinkTimestamp = now;

        // Check rapid blinking counter
        if (now - this.rapidBlinkStart < 2200) {
          this.rapidBlinkCount++;
        } else {
          this.rapidBlinkStart = now;
          this.rapidBlinkCount = 1;
        }

        if (this.rapidBlinkCount >= 4 && (now - this.lastActionTime > this.cooldownMs)) {
          this.rapidBlinkCount = 0;
          this.blinkCounter = 0;
          this.lastActionTime = now;
          return {
            type: 'eye',
            requirement: 'Rapid Blinking / Attention Required',
            priority: 'attention',
            confidence: 91,
            detectionStatus: 'Confirmed',
            message: 'Rapid repeated blinking detected. Attention requested.'
          };
        }
      }
      this.eyesClosedStart = 0;
    }

    // Check blink counter timeout to determine 1, 2, or 3 blinks
    if (this.blinkCounter > 0 && (now - this.lastBlinkTimestamp > 950)) {
      const count = this.blinkCounter;
      this.blinkCounter = 0;

      if (now - this.lastActionTime > this.cooldownMs) {
        this.lastActionTime = now;

        if (count === 1) {
          return {
            type: 'eye',
            requirement: 'All OK',
            priority: 'normal',
            confidence: 93,
            detectionStatus: 'Confirmed',
            message: 'Single blink: Patient reports Yes / OK.'
          };
        } else if (count === 2) {
          return {
            type: 'eye',
            requirement: 'Need Help',
            priority: 'attention',
            confidence: 92,
            detectionStatus: 'Confirmed',
            message: 'Double blink: Patient needs assistance.'
          };
        } else if (count >= 3) {
          return {
            type: 'eye',
            requirement: 'Emergency / Immediate Medical Assistance',
            priority: 'emergency',
            confidence: 96,
            detectionStatus: 'Confirmed',
            message: 'Triple blink: Emergency medical help requested!'
          };
        }
      }
    }

    // ─── 3. Facial Communication Signals (Distress / Discomfort) ─────────────
    // Lip separation & brow distance
    const topLip = faceLandmarks[13] || { x: 0.5, y: 0.65 };
    const bottomLip = faceLandmarks[14] || { x: 0.5, y: 0.68 };
    const mouthGap = Math.abs(bottomLip.y - topLip.y) / faceHeight;

    const leftBrow = faceLandmarks[70] || { x: 0.38, y: 0.32 };
    const rightBrow = faceLandmarks[300] || { x: 0.62, y: 0.32 };
    const browGap = Math.abs(rightBrow.x - leftBrow.x) / faceHeight;

    if (mouthGap > 0.22 && holdDuration > 1800 && (now - this.lastActionTime > this.cooldownMs)) {
      this.lastActionTime = now;
      return {
        type: 'face',
        requirement: 'Difficulty Breathing',
        priority: 'attention',
        confidence: 88,
        detectionStatus: 'Confirmed',
        message: 'Open-mouth facial signal. Possible breathing difficulty indicated.'
      };
    }

    if (browGap < 0.28 && holdDuration > 2000 && (now - this.lastActionTime > this.cooldownMs)) {
      this.lastActionTime = now;
      return {
        type: 'face',
        requirement: 'Severe / Sudden Pain',
        priority: 'attention',
        confidence: 87,
        detectionStatus: 'Confirmed',
        message: 'Furrowed brow facial signal. Possible pain or discomfort indicated.'
      };
    }

    return null;
  }
};
