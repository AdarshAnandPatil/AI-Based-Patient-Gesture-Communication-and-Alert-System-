# Final Verification

## Included communication modes
- Gesture Recognition: Single Patient + Multi-Patient Room
- Face & Eye Recognition: Single Patient + Multi-Patient Room
- Face Recognition, Eye Blink Recognition, Head Movement Recognition are selectable one at a time.

## Hand communication
- 1 finger: Food
- 2 fingers: Water
- 3 fingers: Nurse / Doctor
- 4 fingers: Toilet
- 5 fingers: Emergency / Immediate Medical Assistance
- 0 fingers: All OK
- Motion emergency actions: Severe/Sudden Pain, Difficulty Breathing, Fall/Injury, Sudden Worsening, Immediate Nurse/Doctor

## Face communication
- Normal/Comfortable
- Discomfort/Distress
- Possible Pain/Distress
- Possible Breathing Difficulty
- Severe Facial Distress -> Immediate Medical Assistance
- Monitoring

## Eye communication
- 1 blink: Yes/OK
- 2 blinks: Need Help
- 3 blinks: Emergency/Immediate Help
- Prolonged eye closure: Monitoring
- Rapid repeated blinking: Attention

## Head communication
- Left hold: Turn Left / Position Change
- Right hold: Turn Right / Position Change
- Up hold: Raise Head / Breathing Assistance
- Down hold: Pain / Discomfort
- Repeated left-right: Nurse Attention
- Repeated abnormal: Sudden Discomfort / Condition Change
- Sustained downward/unstable: Immediate Monitoring
- Rapid repeated head shaking: Immediate Medical Assistance

## Anti-repeat behavior
- Alerts are intentionally event-based.
- Same held signal does not continuously create new alerts.
- Hand mode can accept a different deliberate hand gesture without restarting the camera.
- Eye mode re-arms after the eyes return open/neutral.
- Head mode re-arms after the head returns to neutral.
- Face mode re-arms after the facial state changes/returns to neutral.
- Alert overlay has Close, Acknowledge, Resolve, outside-click and Escape handling.

## Static checks
- `node --check public/app.js`: PASS
- HTML required guide labels: PASS
- ZIP integrity (`unzip -t`): PASS

Live webcam/MediaPipe behavior still requires browser/device testing because this environment cannot operate the user's camera interactively.
