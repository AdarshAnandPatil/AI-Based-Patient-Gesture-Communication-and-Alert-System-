# Smart Patient Gesture Communication System — Upgraded

This version connects the hospital web dashboard, backend, and a real Flutter Android mobile app.

## Architecture

Patient Camera → Gesture Detection → Node/Express Backend → Hospital Dashboard + Flutter Mobile App
                                               └→ Firebase Cloud Messaging (FCM)

## Features

- Large patient alerts with patient/room/bed/request
- Browser voice + manual repeat voice button
- English/Kannada/Hindi speech where the device/browser provides the voice
- Automatic alert polling and WebSocket-style live updates via Socket.IO
- REST mobile API
- Alert history
- Acknowledge / Resolve / Escalate
- Optional Firebase Admin FCM push notifications
- Flutter Android application
- Render deployment configuration
- Existing gesture detection can POST alerts to `/api/alerts`

## 1. Run backend

```bash
cd backend
npm install
npm start
```

Open `http://localhost:10000`.

For Render, use:
- Build command: `npm install`
- Start command: `npm start`

## 2. Create an alert

Example:

```bash
curl -X POST http://localhost:10000/api/alerts \
  -H "Content-Type: application/json" \
  -d '{"patientId":"P1001","patientName":"Patient 1001","room":"204","bed":"3","request":"NEED WATER","language":"en","severity":"normal"}'
```

## 3. Firebase push notifications

Firebase is optional. The dashboard/mobile app still works without FCM.

Create a Firebase project, register the Android app using the Flutter package name, and place the generated `google-services.json` inside:

`mobile/android/app/google-services.json`

For server-side push, create a Firebase service-account JSON and set these Render environment variables:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Do NOT commit service-account JSON or private keys.

## 4. Flutter app

```bash
cd mobile
flutter pub get
flutter run
```

The app asks for the backend URL during setup. For an Android emulator use the backend reachable from the emulator; for a physical phone use your deployed Render URL or a computer IP reachable on the same network.

## 5. Connecting your existing gesture detector

When MediaPipe/OpenCV recognizes a gesture, send the detected request to:

`POST /api/alerts`

Map examples:
- Open palm → NEED HELP
- One finger → NEED WATER
- Two fingers → NEED FOOD

The backend then stores the alert, broadcasts it to the web dashboard, and sends FCM push notifications to registered mobile devices when Firebase is configured.

## Important

Firebase credentials are intentionally NOT included. The repository contains integration points and safe setup instructions only.
