# AI-Based Patient Gesture Communication and Alert System

A Render-ready working MVP for a final-year healthcare project.

## Main features

- Patient, Nurse, Doctor and Admin role selector
- AI/computer-vision hand landmark processing using MediaPipe Hands in the browser
- Gesture-to-message workflow
- Water, food, nurse, help, stop/no and emergency request types
- Confidence display
- Nurse alert center with acknowledge, resolve and escalation
- English, Kannada and Hindi localized alert text
- Browser Text-to-Speech voice alerts with language selection
- Browser notification support
- Patient room/bed identification
- AI risk-assessment and emergency-triage demonstration pages
- Medical report PDF/JPG/PNG upload API
- Appointment scheduling
- Operational analytics
- Responsive web interface
- Render deployment configuration
- Safety boundaries: decision support only; no autonomous diagnosis or prescription

## Run locally

Requirements: Node.js 18+

```bash
npm install
npm start
```

Open `http://localhost:10000`.

Camera access normally requires localhost or HTTPS. Render provides HTTPS.

## Deploy to Render

1. Push this folder to GitHub.
2. In Render, choose **New + → Web Service**.
3. Connect the GitHub repository.
4. Render detects `render.yaml`, or use:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Deploy.
6. Open the HTTPS Render URL and allow camera/notification permissions.

## Important production notes

This is a functional academic MVP, not a clinical system.

### Data storage
The demo uses `data/db.json`. Render's normal free web-service filesystem is not intended as permanent production database storage. For a real deployment, replace this with PostgreSQL/Supabase or another managed database.

### AI gesture recognition
MediaPipe Hands detects hand landmarks in the browser. The included classifier is deliberately lightweight for a demo. For a final production/academic evaluation, collect your own gesture dataset, train/validate a classifier, report accuracy/precision/recall/F1, and define a confidence threshold.

### Voice
Voice uses the browser's Web Speech API. Kannada/Hindi voice availability depends on the device/browser. The selected language is explicitly passed to speech synthesis; if the device lacks that voice, provide a visible fallback rather than silently claiming that the requested voice was used.

### Medical report analysis
The API accepts files and records intake metadata. It does not pretend to diagnose from a document. Connect a validated OCR + clinical NLP pipeline only after proper testing and privacy review.

### Mobile app
The web application is the Render-deployed core. A native Flutter/React Native companion should use the same `/api/alerts` backend and Firebase Cloud Messaging (FCM) for reliable background push notifications. Do not place FCM private keys in this repository.

## Suggested next modules

- PostgreSQL/Supabase
- Real authentication with hashed passwords and JWT/session management
- Firebase Cloud Messaging mobile app
- Dedicated gesture classifier
- OCR with confidence and human review
- Clinician-reviewed risk models
- Audit logging
- Role/permission enforcement on every API endpoint
- Rate limiting and security headers
- Encrypted storage and appropriate healthcare privacy controls

## Academic safety statement

The system is intended as an assistive communication and clinical decision-support prototype. Final medical decisions must remain with qualified healthcare professionals.
