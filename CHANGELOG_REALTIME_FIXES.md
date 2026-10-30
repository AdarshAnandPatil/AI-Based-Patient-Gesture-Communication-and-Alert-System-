# Real-time responsiveness update

Changes made to the supplied project:

- Reduced ideal webcam capture resolution to 640x480 and requested a 30 FPS cap to reduce inference load.
- Switched MediaPipe Hands to model complexity 0 for faster inference and lowered detection/tracking thresholds slightly.
- Disabled Face Mesh refined landmarks to reduce inference overhead; current face, eye and head logic uses regular face-mesh landmarks.
- Changed single-patient detection to track one hand/face by default; multi-patient mode can raise the count to four.
- Relaxed the minimum hand bounding-box size gate so hands farther from the camera are less likely to be discarded before classification.
- Passed MediaPipe's reported handedness into the gesture engine rather than hard-coding `Right`.
- Reduced default hand confirmation from six consistent frames to four.
- Reduced default same-gesture re-arm interval from five seconds to 1.2 seconds; admin settings can override it.
- Made the alert modal render before chime/network persistence and reduced the post-speech close delay.
- Increased speech rate slightly and shortened the speech safety timeout.

## Verification performed

- `npm test`: 57 hand checks and 29 face/eye/head checks passed.
- `node --check server.js` and `node --check public/js/*.js`: passed.
- `node tests/dashboard.smoke.js`: 10 dashboard sections rendered without reported exceptions.

## Limitations

- Real webcam/video/audio testing was not possible in this environment. Automated gesture tests use simulated landmarks; they do not prove live-camera latency, device compatibility, or recognition accuracy.
- Server startup could not be verified here because dependencies such as Express are not installed in this execution environment. Run `npm install` before `npm start` or deploy through the configured Render build process.
- Only one selected modality (hand, face, eye, or head) is analysed at a time in the current Detection Studio. This update does not convert it to simultaneous multi-modal inference.
- Faster thresholds may trade some false-positive resistance for responsiveness. Test with multiple users and lighting conditions before any clinical use; this is a prototype, not a validated medical device.
