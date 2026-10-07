# AI-Based Patient Gesture Communication and Alert System

An AI-assisted computer-vision patient communication and alert system built for hospital and clinical care demonstration. Designed for college engineering project demonstrations.

---

## 🌟 System Overview
Enables patients with temporary or severe speech/mobility impairments to communicate essential daily needs and critical emergency conditions non-verbally using:
- **Hand Gestures & Emergency Movements** (21 MediaPipe hand landmarks)
- **Eye Blink Communication** (1 blink: OK, 2 blinks: Need Help, 3 blinks: Emergency, prolonged closure, rapid blinking)
- **Facial Signals** (Discomfort, pain, respiratory distress indications)
- **Head Movements** (Left/Right tilt, Head up/down hold, rapid shaking)

---

## 🖐️ Gesture Mappings
- **1 Finger:** Food Required
- **2 Fingers:** Water Required
- **3 Fingers:** Nurse / Doctor Assistance Required
- **4 Fingers:** Washroom / Toilet Assistance
- **5 Fingers:** Emergency / Immediate Medical Assistance
- **0 Fingers / Strict Fist:** All OK *(Strict geometric fist validation required; ambiguous hand shapes are rejected as Invalid)*

### 🚨 Emergency Hand Movements
- **Fist + Repeated Movement:** Severe / Sudden Pain
- **Palm Toward / Away:** Difficulty Breathing
- **Sharp Downward Palm:** Fall / Injury
- **Rapid Side-to-Side Waving:** Sudden Worsening
- **Raised Palm + Held:** Immediate Nurse / Doctor

---

## 🔒 Safety & Robustness Core Rules
1. **Global Alert & Voice Lock:** While an alert is being announced and spoken, all new hand, face, eye, and head inputs are strictly locked out to prevent overlapping alerts or sound loops.
2. **Complete Voice Sequence Lock:** The system remains locked until the complete sentence finishes:
   *(e.g., "Water required. Patient 1. Room 101. Bed 1.")*
3. **6 Safe Unlock Conditions:**
   - Spoken announcement completes fully
   - User clicks **✕ Close** button
   - User clicks outside the alert modal
   - User presses **Escape** key
   - User clicks **✓ Acknowledge**
   - User clicks **✓ Resolve**
4. **Re-Arm Protection:** Once unlocked, if the patient continues holding the same gesture, no duplicate alert is triggered until the patient releases their hand or returns to neutral.
5. **Invalid Gesture Rejection:** Ambiguous or partial hand shapes never become "All OK". Instead, a yellow warning feedback is shown with actual calculated confidence and speech feedback protected by a cooldown timer.
6. **Defensible Confidence Calculation:** Confidence is dynamically calculated from landmark stability (jitter reduction), finger extension geometry, and confirmation buffer consistency (70% - 97%). No fake fixed numbers.
7. **Multilingual Voice Fallback:** Supports English, Kannada, and Hindi. If regional voice synthesizer is not installed on the browser/OS, the system displays the regional text while seamlessly speaking English fallback with an informative banner.

---

## 🚀 Quick Start Guide

### 1. Start Server
Run in terminal:
```bash
node server.js
```
or double click `run.bat`.

### 2. Open in Browser
- **Main Patient System:** [http://localhost:3000/](http://localhost:3000/)
- **Nurse Central Dashboard:** [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Mobile Web Monitor:** [http://localhost:3000/mobile](http://localhost:3000/mobile)

### 3. Verify Formal 22 Tests
On the main page, the **Project Verification Suite** includes 22 one-click test buttons matching each test case specified in the engineering requirements.
