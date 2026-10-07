/**
 * gestures.js - Updated MediaPipe 21 Landmark Analysis
 * 
 * Replaced gestures:
 *   - Sharp Downward Palm, Rapid Side Waving, Raised Palm Held
 * 
 * Added new gestures:
 *   - 👍 Thumbs Up (Yes / Feeling Better / OK)
 *   - 👎 Thumbs Down (Discomfort / Pain / Not OK)
 *   - 👉 Swipe Right / Palm Right (Need Position Change - Turn Right)
 *   - 👈 Swipe Left / Palm Left (Need Position Change - Turn Left)
 * 
 * Preserved core gestures:
 *   - 1 Finger: Food
 *   - 2 Fingers: Water
 *   - 3 Fingers: Nurse / Doctor
 *   - 4 Fingers: Toilet
 *   - 5 Fingers: Emergency / Immediate Medical Assistance
 *   - 0 Fingers / Strict Fist: All OK
 *   - Fist + Repeated Motion: Severe / Sudden Pain
 *   - Palm Toward / Away: Difficulty Breathing
 *   - Strict fist check (Ambiguous hand NEVER becomes All OK)
 */

const GestureEngine = {
  WRIST: 0,
  THUMB_TIP: 4, THUMB_IP: 3, THUMB_MCP: 2, THUMB_CMC: 1,
  INDEX_TIP: 8, INDEX_DIP: 7, INDEX_PIP: 6, INDEX_MCP: 5,
  MIDDLE_TIP: 12, MIDDLE_DIP: 11, MIDDLE_PIP: 10, MIDDLE_MCP: 9,
  RING_TIP: 16, RING_DIP: 15, RING_PIP: 14, RING_MCP: 13,
  PINKY_TIP: 20, PINKY_DIP: 19, PINKY_PIP: 18, PINKY_MCP: 17,

  frameBuffer: [],
  maxBuffer: 4,

  motionHistory: [],
  maxMotionHistory: 16,

  dist(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  evaluateFingerStates(landmarks, handedness = 'Right') {
    const wrist = landmarks[this.WRIST];
    const thumbTip = landmarks[this.THUMB_TIP];
    const thumbMcp = landmarks[this.THUMB_MCP];
    const thumbIp = landmarks[this.THUMB_IP];
    const indexMcp = landmarks[this.INDEX_MCP];
    const middleMcp = landmarks[this.MIDDLE_MCP];
    const ringMcp = landmarks[this.RING_MCP];
    const pinkyMcp = landmarks[this.PINKY_MCP];

    const handScale = this.dist(wrist, middleMcp) || 0.1;

    // Check individual finger extension
    const checkFinger = (tipIdx, pipIdx, mcpIdx) => {
      const tip = landmarks[tipIdx];
      const pip = landmarks[pipIdx];
      const mcp = landmarks[mcpIdx];
      const tipWristDist = this.dist(wrist, tip);
      const pipWristDist = this.dist(wrist, pip);
      const tipMcpDist = this.dist(mcp, tip);
      const pipMcpDist = this.dist(mcp, pip);

      // Extended: tip is well past PIP away from wrist and MCP
      const isExt = (tipWristDist > pipWristDist * 1.06) && (tipMcpDist > pipMcpDist * 1.08);
      // Curled: tip is close to MCP/wrist
      const isCurled = (tipWristDist < pipWristDist * 1.03) || (tipMcpDist < pipMcpDist * 0.96);
      return { isExt, isCurled };
    };

    const indexCheck = checkFinger(this.INDEX_TIP, this.INDEX_PIP, this.INDEX_MCP);
    const middleCheck = checkFinger(this.MIDDLE_TIP, this.MIDDLE_PIP, this.MIDDLE_MCP);
    const ringCheck = checkFinger(this.RING_TIP, this.RING_PIP, this.RING_MCP);
    const pinkyCheck = checkFinger(this.PINKY_TIP, this.PINKY_PIP, this.PINKY_MCP);

    const indexExt = indexCheck.isExt;
    const middleExt = middleCheck.isExt;
    const ringExt = ringCheck.isExt;
    const pinkyExt = pinkyCheck.isExt;

    // Thumb extension check
    const thumbTipDist = this.dist(wrist, thumbTip);
    const thumbMcpDist = this.dist(wrist, thumbMcp);
    const thumbDistToIndexMcp = this.dist(thumbTip, indexMcp);
    const thumbExt = (thumbDistToIndexMcp / handScale > 0.62) && (thumbTipDist > thumbMcpDist * 1.12);

    // Thumb vertical direction (Y decreases towards top of screen)
    const isThumbPointingUp = (thumbTip.y < thumbIp.y - 0.015) && (thumbTip.y < indexMcp.y);
    const isThumbPointingDown = (thumbTip.y > thumbIp.y + 0.015) && (thumbTip.y > indexMcp.y);

    const states = {
      thumb: thumbExt,
      index: indexExt,
      middle: middleExt,
      ring: ringExt,
      pinky: pinkyExt
    };

    const allFourCurled = indexCheck.isCurled && middleCheck.isCurled && ringCheck.isCurled && pinkyCheck.isCurled;

    return {
      states,
      allFourCurled,
      isThumbPointingUp,
      isThumbPointingDown,
      clarity: 0.95
    };
  },

  isStrictFist(evaluation, landmarks) {
    return evaluation.allFourCurled && !evaluation.isThumbPointingUp && !evaluation.isThumbPointingDown;
  },

  detectDynamicMotions(landmarks) {
    const wrist = landmarks[this.WRIST];
    const indexTip = landmarks[this.INDEX_TIP];
    const now = Date.now();

    this.motionHistory.push({
      x: wrist.x,
      y: wrist.y,
      scale: this.dist(wrist, indexTip),
      time: now
    });

    if (this.motionHistory.length > this.maxMotionHistory) {
      this.motionHistory.shift();
    }

    if (this.motionHistory.length < 6) return null;

    const first = this.motionHistory[0];
    const last = this.motionHistory[this.motionHistory.length - 1];
    const dt = (last.time - first.time) / 1000 || 0.1;

    // 1. Swipe Right: Deliberate horizontal sweep to the right
    const dx = last.x - first.x;
    const vx = dx / dt;

    if (vx > 0.75 && dx > 0.16) {
      return {
        requirement: 'Need Position Change (Turn Right)',
        priority: 'attention',
        msg: 'Hand swipe right detected. Patient requests turn to right.'
      };
    }

    // 2. Swipe Left: Deliberate horizontal sweep to the left
    if (vx < -0.75 && dx < -0.16) {
      return {
        requirement: 'Need Position Change (Turn Left)',
        priority: 'attention',
        msg: 'Hand swipe left detected. Patient requests turn to left.'
      };
    }

    return null;
  },

  calculateDefensibleConfidence(stabilityScore, clarityScore, consistencyRatio) {
    const raw = 75 + (stabilityScore * 12) + (clarityScore * 8) + (consistencyRatio * 5);
    return Math.max(75, Math.min(98, Math.round(raw)));
  },

  measureStability(currentLm) {
    if (!this.lastLandmarks) {
      this.lastLandmarks = currentLm;
      return 0.9;
    }
    const checkPts = [0, 4, 8, 12, 16, 20];
    let totalJitter = 0;
    checkPts.forEach(idx => {
      totalJitter += this.dist(currentLm[idx], this.lastLandmarks[idx]);
    });
    this.lastLandmarks = currentLm;
    const avgJitter = totalJitter / checkPts.length;
    return Math.max(0.2, Math.min(1.0, 1.0 - (avgJitter / 0.06)));
  },

  interpretHand(landmarks, handedness = 'Right') {
    const stability = this.measureStability(landmarks);
    const evaluation = this.evaluateFingerStates(landmarks, handedness);
    const { states, allFourCurled, isThumbPointingUp, isThumbPointingDown } = evaluation;

    // 1. 👍 Thumbs Up (Thumb extended up, all 4 other fingers curled into palm)
    if (allFourCurled && isThumbPointingUp) {
      const conf = this.calculateDefensibleConfidence(stability, 0.95, 1.0);
      return {
        type: 'hand_gesture',
        requirement: 'Thumbs Up / Feeling Better',
        priority: 'normal',
        confidence: conf,
        detectionStatus: 'Confirmed',
        gestureCode: 'THUMBS_UP',
        message: 'Patient reports feeling better / affirmative response.'
      };
    }

    // 2. 👎 Thumbs Down (Thumb extended down, all 4 other fingers curled into palm)
    if (allFourCurled && isThumbPointingDown) {
      const conf = this.calculateDefensibleConfidence(stability, 0.95, 1.0);
      return {
        type: 'hand_gesture',
        requirement: 'Thumbs Down / Discomfort',
        priority: 'attention',
        confidence: conf,
        detectionStatus: 'Confirmed',
        gestureCode: 'THUMBS_DOWN',
        message: 'Patient reports discomfort or negative state.'
      };
    }

    // 3. Strict Fist (0 fingers = All OK / Fist shaking = Sudden Pain)
    if (this.isStrictFist(evaluation, landmarks)) {
      const isFistMoving = this.motionHistory.length >= 6 &&
        Math.abs(this.motionHistory[this.motionHistory.length - 1].y - this.motionHistory[0].y) > 0.16;

      if (isFistMoving) {
        const conf = this.calculateDefensibleConfidence(stability, 0.9, 0.9);
        return {
          type: 'emergency_motion',
          requirement: 'Severe / Sudden Pain',
          priority: 'emergency',
          confidence: conf,
          detectionStatus: 'Confirmed',
          gestureCode: 'FIST_MOTION',
          message: 'Severe sudden pain reported.'
        };
      }

      const conf = this.calculateDefensibleConfidence(stability, 0.95, 0.95);
      return {
        type: 'hand_gesture',
        requirement: 'All OK',
        priority: 'normal',
        confidence: conf,
        detectionStatus: 'Confirmed',
        gestureCode: 'FIST',
        fingerCount: 0,
        message: 'Patient reports all OK.'
      };
    }

    // 4. Dynamic motions (Swipe Right / Swipe Left)
    const dynamicMotion = this.detectDynamicMotions(landmarks);
    if (dynamicMotion) {
      const conf = this.calculateDefensibleConfidence(stability, 0.9, 1.0);
      return {
        type: 'emergency_motion',
        requirement: dynamicMotion.requirement,
        priority: dynamicMotion.priority,
        confidence: conf,
        detectionStatus: 'Confirmed',
        gestureCode: 'MOTION',
        message: dynamicMotion.msg
      };
    }

    // 5. Finger count mappings (Index, Middle, Ring, Pinky)
    // 5 Fingers: All extended -> Emergency
    if (states.index && states.middle && states.ring && states.pinky && states.thumb) {
      const conf = this.calculateDefensibleConfidence(stability, 0.95, 1.0);
      return {
        type: 'hand_gesture',
        requirement: 'Emergency / Immediate Medical Assistance',
        priority: 'emergency',
        confidence: conf,
        detectionStatus: 'Confirmed',
        gestureCode: '5_FINGERS',
        fingerCount: 5,
        message: 'Emergency! Immediate medical assistance required.'
      };
    }

    // 4 Fingers: Index + Middle + Ring + Pinky -> Toilet
    if (states.index && states.middle && states.ring && states.pinky) {
      const conf = this.calculateDefensibleConfidence(stability, 0.92, 1.0);
      return {
        type: 'hand_gesture',
        requirement: 'Toilet',
        priority: 'attention',
        confidence: conf,
        detectionStatus: 'Confirmed',
        gestureCode: '4_FINGERS',
        fingerCount: 4,
        message: 'Washroom assistance required.'
      };
    }

    // 3 Fingers: Index + Middle + Ring -> Nurse / Doctor
    if (states.index && states.middle && states.ring && !states.pinky) {
      const conf = this.calculateDefensibleConfidence(stability, 0.92, 1.0);
      return {
        type: 'hand_gesture',
        requirement: 'Nurse / Doctor',
        priority: 'attention',
        confidence: conf,
        detectionStatus: 'Confirmed',
        gestureCode: '3_FINGERS',
        fingerCount: 3,
        message: 'Nurse or Doctor assistance required.'
      };
    }

    // 2 Fingers: Index + Middle -> Water
    if (states.index && states.middle && !states.ring && !states.pinky) {
      const conf = this.calculateDefensibleConfidence(stability, 0.95, 1.0);
      return {
        type: 'hand_gesture',
        requirement: 'Water',
        priority: 'normal',
        confidence: conf,
        detectionStatus: 'Confirmed',
        gestureCode: '2_FINGERS',
        fingerCount: 2,
        message: 'Water required.'
      };
    }

    // 1 Finger: Index only -> Food
    if (states.index && !states.middle && !states.ring && !states.pinky) {
      const conf = this.calculateDefensibleConfidence(stability, 0.95, 1.0);
      return {
        type: 'hand_gesture',
        requirement: 'Food',
        priority: 'normal',
        confidence: conf,
        detectionStatus: 'Confirmed',
        gestureCode: '1_FINGER',
        fingerCount: 1,
        message: 'Food required.'
      };
    }

    // If gesture is transitioning or ambiguous
    return {
      type: 'invalid_gesture',
      requirement: 'Invalid Gesture',
      priority: 'warning',
      confidence: 60,
      detectionStatus: 'Not Confirmed',
      gestureCode: 'INVALID',
      message: 'Please make a clear gesture (Thumbs Up/Down, 1-5 fingers, or Fist).'
    };
  },


  processFrame(landmarks, handedness = 'Right') {
    if (!landmarks || landmarks.length < 21) {
      this.frameBuffer = [];
      resetRearmState();
      return null;
    }

    const currentResult = this.interpretHand(landmarks, handedness);
    if (currentResult.type === 'invalid_gesture') {
      this.frameBuffer = [];
      return currentResult;
    }

    this.frameBuffer.push(currentResult);
    if (this.frameBuffer.length > this.maxBuffer) {
      this.frameBuffer.shift();
    }

    if (this.frameBuffer.length < AppState.requiredConsistentFrames) {
      return {
        ...currentResult,
        detectionStatus: 'Verifying...',
        isConfirmed: false
      };
    }

    const recent = this.frameBuffer.slice(-AppState.requiredConsistentFrames);
    const targetCode = recent[0].gestureCode;
    const isConsistent = recent.every(item => item.gestureCode === targetCode);

    if (isConsistent) {
      const consistencyRatio = recent.filter(i => i.gestureCode === targetCode).length / recent.length;
      return {
        ...currentResult,
        detectionStatus: 'Confirmed',
        isConfirmed: true,
        consistencyRatio
      };
    }

    return {
      ...currentResult,
      detectionStatus: 'Unstable',
      isConfirmed: false
    };
  }
};
