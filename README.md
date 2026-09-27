# AI-Based Patient Gesture Communication and Alert System

Upgraded Render-ready version.

## Included
- Large full-screen patient alert overlay.
- Text + browser voice alerts.
- English / Kannada / Hindi messages.
- Acknowledge / Resolve / Escalate.
- Browser notifications.
- MediaPipe camera page.
- Reports and appointments.
- Analytics.
- Mobile Flutter starter in `mobile/`.

## Web
`npm install` then `npm start`.

## Mobile
Run `flutter create .` inside `mobile/`, replace `lib/main.dart` with the supplied file, add dependencies from `pubspec_additions.txt`, then run `flutter pub get` and `flutter run`.

The Flutter app polls the Render API and uses native phone TTS. True background push notifications require your own Firebase Cloud Messaging configuration.

Never commit Firebase private/server credentials to GitHub.

Current backend:
https://ai-based-patient-gesture-communication.onrender.com

## Mobile monitoring

The `mobile/` folder contains a Flutter monitor app. On the same Wi-Fi network, enter the computer's local URL such as `http://192.168.1.5:10000` in **IP Settings**. For monitoring from home over a different network, use the deployed HTTPS URL or a secure VPN/tunnel; a private `192.168.x.x` address is not reachable directly from the internet.

## Multi-Patient Room Camera (added)

The web app now has two camera modes:

- **Single Patient** — keeps the original one-patient hand-gesture demonstration.
- **Multi-Patient Room** — one fixed camera monitors up to four registered bed zones.

### Multi-patient pipeline

Camera → MediaPipe Face Mesh (up to 4 faces) + MediaPipe Hands (up to 4 hands) → hand/face association → 2×2 bed-zone assignment → patient ID/name/room/bed → hand gesture / eye blink / head movement → existing alert, voice and mobile pipeline.

### Bed-zone setup

Default Room 204 layout:

- Bed 1: P1001 / Patient A / top-left
- Bed 2: P1002 / Patient B / top-right
- Bed 3: P1003 / Patient C / bottom-left
- Bed 4: P1004 / Patient D / bottom-right

The administrator can edit patient ID, name, language and room from the Multi-Patient Room panel and save the configuration.

### Communication events

- Hand: existing 0–5 finger gesture mapping is preserved.
- Eye: 1 blink = Yes/OK, 2 blinks = Need Help, 3 blinks = Emergency; prolonged closure is reported as a monitoring event.
- Head: left/right/up/down movement is reported as a communication event.
- Face: face presence and bed assignment are detected. The system does not claim biometric identity recognition or medical diagnosis from facial expression.

Camera access still requires HTTPS (Render) or localhost and browser camera permission.

## Current multimodal communication mapping

The camera supports the same hand, eye, face and intentional head communication actions in both Single Patient and Multi-Patient Room modes. The system treats emergency actions as requests for immediate clinical assistance, not as diagnoses.
