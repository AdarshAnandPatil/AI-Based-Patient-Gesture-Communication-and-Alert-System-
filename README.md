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
