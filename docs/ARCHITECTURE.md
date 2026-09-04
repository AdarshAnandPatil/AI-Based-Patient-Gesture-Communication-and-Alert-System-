# System Architecture

Patient Camera
   |
   v
MediaPipe Hands (browser)
   |
   v
Gesture classifier
   |
   v
Localized message generator
   |
   v
Express API
   |
   +--> Nurse web alert center
   |
   +--> Doctor/admin workflow
   |
   +--> Browser notification + voice
   |
   +--> Mobile app / FCM integration point

## Escalation

Patient gesture -> New alert -> Nurse acknowledgement -> Resolve

If the request is emergency/critical, the UI marks it Critical. A production implementation should also run a server-side escalation timer and send an FCM/SMS/approved hospital notification if acknowledgement does not happen within a configured period.

## Privacy

The camera demo processes frames in the browser and does not upload continuous video. Only the interpreted event is sent to the API.
