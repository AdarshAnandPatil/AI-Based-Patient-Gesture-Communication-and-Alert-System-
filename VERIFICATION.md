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


## Alert Overlay / Re-Arm Fix (2026-09-23)
- Alert overlay now normalizes patient, room, and bed fields so it does not display `undefined`.
- Acknowledge and Resolve close the overlay immediately before updating the server.
- Close (X), outside click, and Escape also close the overlay.
- Play Voice replays the current alert without reopening a duplicate overlay.
- Alerts auto-close after 8 seconds if staff does not act, preventing the overlay from remaining permanently on screen.
- Camera recognition continues while the overlay is visible, so another patient can generate the next alert; a new alert replaces the previous overlay and voice.
- Recognition remains latched per patient/action so the same continuous gesture does not repeatedly fire; after the signal changes/disappears, the next intentional gesture can be detected without restarting the camera.
