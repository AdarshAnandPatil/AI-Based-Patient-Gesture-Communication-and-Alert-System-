# Mobile Companion

This folder documents the mobile companion architecture.

Recommended implementation: Flutter.

The mobile app should:
- authenticate the nurse/doctor
- register the device token
- subscribe to patient/ward alert topics
- receive Firebase Cloud Messaging (FCM) notifications
- speak localized alert text
- show patient room/bed, message, confidence and priority
- allow acknowledge / resolve / escalate
- use the same backend API as the web application

Do not commit Firebase service-account private keys. They belong in the deployment platform's secret environment variables.

Example API:
PATCH /api/alerts/:id
JSON: {"action":"acknowledge"}
