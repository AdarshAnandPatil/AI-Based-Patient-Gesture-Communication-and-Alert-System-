# Final Gesture Verification

This build was statically checked after the requested multimodal corrections.

## Requested communication mapping

### Hand
- 0 fingers -> All OK
- 1 finger -> Food
- 2 fingers -> Water
- 3 fingers -> Nurse / Doctor
- 4 fingers -> Toilet
- 5 fingers -> Emergency / Immediate Medical Assistance
- Fist repeated movement -> Severe / Sudden Pain
- Open palm toward/away from camera -> Difficulty Breathing
- Open palm sharp downward -> Fall / Injury
- Rapid open-palm waving -> Sudden Worsening
- Raised open palm held -> Immediate Nurse / Doctor

### Eyes
- 1 blink -> Yes / OK
- 2 normal blinks -> Need Help
- 3 blinks -> Emergency / Immediate Help
- Rapid repeated blinking -> Attention
- Prolonged eye closure -> Monitoring

### Face
- Normal / comfortable facial communication
- Discomfort / distress / possible pain monitoring
- Possible breathing difficulty monitoring
- Face communication unclear -> monitoring
- Facial signals are communication/monitoring signals, not medical diagnoses.

### Head
- Left and hold -> Position Change / Turn Left
- Right and hold -> Position Change / Turn Right
- Up and hold -> Breathing Assistance / Raise Head
- Down and hold -> Pain / Discomfort
- Repeated left/right -> Need Nurse Attention
- Repeated abnormal movement -> Sudden Discomfort / Condition Change
- Sustained downward/unstable movement -> Immediate Monitoring Required
- Rapid repeated head shaking + sustained movement -> Immediate Medical Assistance Required (Critical)

## Both modes
The same `processHandForPatient()` and `processFaceForPatient()` pipelines are used for Single Patient Mode and Multi-Patient Room Mode. Multi-Patient Mode keeps separate patient state per bed.

## Static checks performed
- `node --check public/app.js` PASS
- `node --check server.js` PASS
- ZIP extraction/integrity PASS
- Required mapping strings present PASS
- Old head-right = drinking mapping absent PASS

## Runtime limitation
Actual webcam/MediaPipe inference requires a browser with camera permission and network-loaded MediaPipe assets. It was not possible to perform a real webcam inference test in this offline build environment, so runtime detection accuracy is not claimed as verified here.
