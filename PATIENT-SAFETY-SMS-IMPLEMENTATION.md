# Patient Safety Monitoring + SMS additions

## Included in this update
- Added a separate Patient Safety Monitoring option to Detection Studio, leaving Hand, Face, Eye and Head modes in place.
- Added MediaPipe Pose landmark processing and temporal heuristics for the nine selectable observation categories.
- Added a camera-generated safety-event record, on-screen alert dialog, voice announcement and nurse acknowledgement/resolution controls.
- Added patient-scoped safety event APIs; family accounts can read only events for their linked patient.
- Added nurse mobile safety-event acknowledge / assistance-started / resolve controls.
- Added SMS sending through Twilio for patient alerts, camera/staff safety events, safety status changes, medical updates and nurse/family updates.
- Added registered mobile-number fields to account creation. Family and nurse accounts need an international-format phone number to be eligible for SMS.

## Important validation limits
This is an engineering prototype using pose landmarks and transparent threshold heuristics, not a trained or clinically validated patient-safety model. The browser pose model does not produce calibrated event probabilities, so the alert deliberately displays **Not calibrated** instead of fabricating a confidence percentage. The event detector must be clinically validated and tuned with real ward camera positions before any real patient deployment.

Breathing observation is an experimental upper-body landmark-motion indicator only; it cannot measure respiratory rate reliably or diagnose respiratory distress. Seizure-like movement is not a seizure diagnosis. Bed-exit detection requires a stable camera view and bed-zone calibration. Night-time detection uses the camera device's local clock. Safety camera alerts currently require Single Patient mode; multi-person pose association is not safe to claim from the single-person Pose model. Prolonged inactivity is a visual movement observation, not proof of unconsciousness.

A standard webcam cannot diagnose heart attack, cardiac arrest, stroke, oxygen level, internal bleeding or death. Those remain staff-reported medical events, with death requiring authorized doctor confirmation.

## SMS configuration required before delivery
Set these environment variables in Render:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM`
- `PUBLIC_BASE_URL` (the public HTTPS base URL of this app)

Add the nurse and family mobile numbers in international E.164 format when creating their accounts, e.g. `+919876543210`. Family recipients are selected by linked patient ID; nurse recipients are matched to the patient's assigned nurse name. The patient's emergency-contact number is also included if valid. For India, configure provider-approved sender ID, DLT registration and message templates as applicable. No SMS can be delivered until a real Twilio account, approved sender and recipient numbers are configured. This workspace did not have SMS credentials, so live carrier delivery could not be tested.

The app's JSON files live in `data/`. Configure persistent storage for that directory on the hosting platform if records must survive service restarts and redeploys.

## Checks performed
- `node --check` passed for server.js and modified frontend JavaScript.
- Inline JavaScript in the HTML pages passed `node --check` extraction checks.
- Existing Hand gesture test suite: 57 passed, 0 failed.
- Existing Face/Eye/Head test suite: 29 passed, 0 failed.
- Live browser camera tests, real hospital webcam validation, Twilio SMS delivery and multi-device end-to-end tests were not possible in this environment.

## Follow-up fixes (30 October 2026)

- Patient admission now preselects the first unoccupied room/bed instead of defaulting to Room 101 Bed 1, which may already be occupied.
- Patient create/edit forms now show a clear inline error and toast if the selected room/bed belongs to another patient. The server continues to enforce unique room/bed assignment; it does not silently place two patients in one bed.
- The duplicate-bed error names the current occupant and asks the admin to select an available bed.
- Patient Safety Monitoring now exposes a Front camera / Back camera selector. It is hidden for Hand, Face, Eye and Head modalities. On supported phones, changing the selector restarts the same camera stream with the selected `facingMode`. Browser/device support may vary.

## Follow-up verification

- JavaScript syntax checks: passed for server, public scripts and test scripts.
- Hand gesture regression tests: 57 passed.
- Face/Eye/Head regression tests: 29 passed.
- Dashboard page smoke tests: all 10 pages passed.
- Load and synthetic test scripts: exited successfully.
- Live browser camera switching and live SMS delivery were not testable in this offline build environment. SMS still requires valid provider credentials and approved sender/template configuration.
