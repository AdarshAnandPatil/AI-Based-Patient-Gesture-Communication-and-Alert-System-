# AI-Based Patient Gesture Communication and Alert System

## Updated gesture detection
- 1 finger → Food
- 2 fingers → Water
- 3 fingers → Food
- 4 fingers → Toilet
- 5 fingers → Doctor / Nurse needed
- 0 fingers (closed fist) → All OK

The patient no longer needs to press Patient Needs buttons. The camera counts the fingers automatically, waits for a stable gesture, displays a large message, and sends the alert to the backend.

## Voice fix
The browser now selects only a voice that actually matches the selected language (`en-IN`, `kn-IN`, or `hi-IN`). It does **not** silently use an English voice when Kannada/Hindi is selected. If the phone/browser has no matching Kannada/Hindi voice installed, the UI reports that the language voice is unavailable.

Browsers expose only voices available on the current device, and the voice list can load asynchronously through `voiceschanged`. Therefore a browser-only implementation cannot guarantee Kannada/Hindi speech on every device. Install the corresponding language/voice pack on the device for browser speech, or use a server/native TTS service for guaranteed multilingual audio.

## Deployment
Use the existing Render configuration:
- Build: `npm install`
- Start: `npm start`
- Branch: `main`
- Root directory: empty

After deployment, hard refresh the browser so `/app.js?v=5` and `/style.css?v=5` load the updated files.
