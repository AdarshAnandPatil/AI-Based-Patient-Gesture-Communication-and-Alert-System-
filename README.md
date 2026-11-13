# AI-Based Patient Gesture Communication and Alert System

Assistive, non-verbal patient communication: camera (hand / face / eye / head) → validation → patient-room-bed mapping → voice + alert → nurse phone → acknowledge → resolve → history & analytics.

Created by Adarsh Anand Patil. Assistive technology only — not a replacement for clinical judgment.

## Run locally
```
npm install
npm start          # http://localhost:3000
npm test           # detection-engine unit tests
```
First start creates the admin account from `ADMIN_USER` / `ADMIN_PASSWORD` (default `admin` / `admin123` locally — change it in System Settings). Use the Admin & Audit page to create Doctor, Nurse, Billing Staff and Family accounts; family accounts must be linked to one patient.

## Deploy on Render
1. Push this folder to GitHub.
2. Render → **New → Blueprint** (uses `render.yaml`) or **New → Web Service**: Build `npm install`, Start `npm start`.
3. Environment: `ADMIN_USER`, `ADMIN_PASSWORD` (Blueprint generates a password — see the service's Environment tab).
4. Open the HTTPS URL. The camera needs HTTPS, which Render provides.

Note: Render's free tier has an ephemeral disk — patient/alert data resets on redeploy/restart. Use a paid persistent disk (mount at `/opt/render/project/src/data`) for lasting data. Free services also sleep after inactivity.

## Detection (one modality at a time)
| Modality | Signal | Meaning |
|---|---|---|
| Hand | Pointing finger / OK / 👍 / 👎 / 2 / 3 / 4 / 5 fingers / palm push-pull | Help / OK / Better / Discomfort / Water / Nurse / Toilet / Emergency / Breathing |
| Face | Smile, frown+brows, mouth open, mouth wide open | Better / Need help / Attention / Breathing emergency |
| Eye | 1 / 2 / 3 firm half-second blinks | Yes-OK / Help / Emergency |
| Head | Turn left/right, up, down (hold 1.2 s), quick shake | Position / Breathing / Pain / Emergency |

Safety: multi-frame confirmation, hold times, neutral-face calibration, re-arm after release, unknown poses rejected, resting fist ignored, normal blinks/talking ignored.

## Pages
Dashboard · Live Monitor (camera + simulation) · Patients · Rooms & Beds · Appointments · Active Alerts · Alert History · Reports & Analytics · Settings · Admin & Audit · Nurse Mobile (`/mobile`).


## Family monitoring additions
- Admin can create multiple family accounts linked to one patient; each family account is server-filtered to that patient only.
- Family portal shows patient activity timeline, today's gesture summary, nurse updates, visual safety observations and authorized medical-event reports.
- Nurse/admin mobile view can post family updates and report safety observations or medical events.
- Alert acknowledgement and resolution timestamps are recorded for staff.
- Browser notifications are optional and require the family member to enable them while the portal is open; this is not background Web Push.

## Visual safety monitoring status (important)
The selected nine visual safety event types are available as a patient-linked reporting and notification workflow. **This release does not contain a validated computer-vision model that automatically recognizes those nine events from webcam frames.** Staff must record/verify observations through the staff mobile interface. The existing hand/face/eye/head gesture engine is preserved and is not represented as a fall, seizure, breathing, or medical-diagnosis detector. A separate pose/action-recognition model, camera-zone calibration and clinical validation are required before automatic visual-event detection can be enabled.

Medical events such as suspected heart attack, cardiac arrest, stroke and death are staff-reported only. Death records require the doctor-confirmation checkbox; a camera cannot diagnose or confirm death. This application is a communication and safety-support prototype, not a medical device or substitute for clinical care.

## Data persistence
JSON records are stored under `data/`. On Render, configure a persistent disk mounted at `/opt/render/project/src/data` if records must survive restarts/redeployments. Do not rely on the free ephemeral filesystem for patient records.


## Patient Safety Monitoring and SMS setup

The Detection Studio includes an additional Patient Safety Monitoring mode using the MediaPipe Pose landmark model. It provides experimental visual heuristics for possible falls/collapse, inactivity, posture, repeated movement, bed-edge movement, night-time movement and possible periodic upper-body movement. These are **not clinically validated models**. The breathing observation is particularly experimental; a webcam cannot measure oxygen, respiratory distress or reliably diagnose breathing problems. Seizure-like movement is not a seizure diagnosis. Use nurse/doctor verification. Single-patient mode is required for camera-generated family-linked events; multi-patient room/bed mapping is not claimed to be reliable for this safety mode.

### Real SMS notifications

SMS is implemented through Twilio's Messaging API and is disabled until configured. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` and `PUBLIC_BASE_URL` in the Render service environment (or local `.env` loaded by your deployment process). Add each nurse/family user's mobile number in international E.164 format (example `+919876543210`) when creating the account. Family recipients are restricted to accounts linked to that patient; nurse recipients are matched to the patient's assigned nurse. The patient's emergency contact is also included if it is a valid international number. Do not commit real credentials to GitHub. For India, ensure your SMS provider, sender ID, DLT registration and message templates meet applicable telecom requirements. SMS cannot be confirmed until a real provider account and recipient numbers are configured and a live delivery test is performed.

Family website data refreshes periodically and remains patient-scoped on the server. SMS can reach registered recipients when the website is closed, provided the server is running and the SMS gateway is configured. Configure a persistent Render disk mounted at the project's `data` directory so JSON records survive deploys/restarts.

## Advanced Patient Care Workspace (added)
Open **Advanced Care Modules** from the command-center sidebar or visit `/care` after signing in. The workspace adds persistent JSON-backed workflows for:

- Discharge stages: doctor initiation, nurse clearance, billing clearance, doctor approval and final discharge. A bed is released only after the final discharge stage; the patient record is retained.
- Itemized bills, partial/full payments, balances and payment history.
- Patient-reported pain location/intensity/type/duration and nurse assessment status.
- Doctor-approved prescriptions and nurse medicine-administration records. This module does not prescribe or change doses.
- Nurse task priority and response states, food/nutrition logs, safety observations, family message records, camera registry and language preferences (English, Kannada, Hindi, Telugu, Tamil).

### New care API
All routes require the existing Bearer session token:

- `GET/POST /api/care/:collection`
- `PATCH /api/care/:collection/:id`

Collections: `discharges`, `bills`, `pain`, `prescriptions`, `administrations`, `tasks`, `messages`, `food`, `cameras`, `languages`.

Data is stored in separate JSON files under `data/`, preserving the existing JSON persistence approach. Existing APIs and files remain in place. The new files are created on first use. Include the `data/` directory in persistent storage/backups for deployments; Render's local filesystem may be ephemeral unless a persistent disk is configured.

### Role notes
The existing user-management API now accepts `doctor` and `billing` roles in addition to `admin`, `nurse` and `family`. Admin can create those accounts. Prescription creation is doctor/admin only; medicine administration is nurse/admin; billing changes are billing/admin; discharge stage permissions are enforced server-side. Family accounts can read only their linked patient's permitted care records.

### Important implementation boundaries
The existing Patient Safety Monitoring pose heuristics are experimental and require staff verification; they are not a clinically validated fall/seizure/breathing AI model. The new multi-camera page can open separate browser streams for registered devices, but it does not provide verified bed-to-person identity tracking or automatic reconnect orchestration. Free-text medical translation is not claimed: the original message is retained and translation status is marked `original_only` until a verified translation provider is configured. Twilio SMS continues to require real credentials in environment variables and must be tested in the deployed environment. This application is decision support, not a medical diagnostic device.


## Role-specific care workspaces (added 11 Nov 2026)
After an authorized user signs in, the app routes them by role:
- Admin: `/dashboard` and `/care`
- Nurse: `/nurse`
- Doctor: `/doctor`
- Billing: `/billing`
- Parent/family: `/family` (full linked-child workspace at `/care`)

The parent workspace is limited by the server to the one patient linked to that family account. Family members can view permitted updates, bills, discharge progress, payment receipts and send messages; they cannot edit clinical or billing records. Staff workspaces show role-specific tabs and actions.

Billing staff can add charges during a stay and record multiple payments. Each newly recorded payment receives a receipt reference that can be printed from the bill. Initial payments are recorded as admission advance by default. **This is payment recordkeeping, not online money collection**: no UPI/card payment gateway is configured in this project.

New care-card styling uses green/yellow/red status colours and active/completed request groups inspired by the supplied nurse-dashboard reference. Existing gesture/camera UI has been retained.

## Verification caveat
Run `npm ci` and `npm start` in a network-enabled environment before deployment. In the authoring environment, `npm ci` timed out and Express/CORS/Multer were not available, so live HTTP/API integration testing could not be completed. Existing hand, face/eye/head and dashboard smoke tests were run, and JavaScript syntax checks passed. Review `IMPLEMENTATION_STATUS.md` for remaining external integrations and clinical limitations.


## Role separation and access-control update
- Separate entry pages: `/nurse`, `/doctor`, `/billing`, `/family`, and the Admin command center at `/dashboard`; Admin care modules are at `/care`; family care/billing/messages are at `/family-care`.
- Nurse and doctor patient lists and care records are filtered using the assigned nurse/doctor stored on the patient record. Requests for unassigned patient records are rejected by the server.
- Family accounts are bound to one `linkedPatientId`; the server filters patient data and rejects access to another patient's ID.
- Billing accounts can access billing records and limited discharge clearance details, not clinical reports or monitoring.
- Clinical and financial history should be corrected through new records / documented workflow, not silently erased. Patient removal now archives the patient record. Messages are immutable after sending.
- Local first-run Admin password is randomly generated and printed to the server console; save it and change it immediately. Production should set `ADMIN_USER` and `ADMIN_PASSWORD` as environment variables before first startup.

**Deployment warning:** This is a student prototype using JSON-file persistence and in-memory sessions. Do not use it for real patient records or clinical decisions. Production hospital deployment requires a security review, durable database, HTTPS, secure cookie/session management, backup/restore testing, privacy/legal review, and clinical validation.

## Role-separated workspace update (12 Nov 2026)
The latest access-control update adds separate entry pages: Admin command center `/dashboard` and care workspace `/care`, Nurse `/nurse`, Doctor `/doctor`, Billing `/billing`, Parent portal `/family`, and Parent care/billing/messages `/family-care`. Role-specific tabs are backed by server-side role checks. Nurses and doctors are limited to patients assigned by the patient record's nurse/doctor field. Family accounts are restricted to the single `linkedPatientId`. Billing access is limited to billing records and a limited discharge-clearance view.

Patient records are archived rather than erased; reports and alerts are archived; appointments are cancelled; staff accounts are deactivated; sent messages cannot be edited. Important changes are written to the audit log. New account passwords must be at least 10 characters. On first local startup, the administrator password is randomly generated and printed to the server console; in production configure `ADMIN_USER` and `ADMIN_PASSWORD` before first startup.

The new `tests/access-control.test.js` exercises role and patient-scope policy helpers and checks that the relevant API routes use those filters. It does not replace live HTTP security testing. See `IMPLEMENTATION_STATUS.md` for test results and important limitations. In particular, `npm ci` timed out in the build environment, so live Express API and browser end-to-end tests could not be completed. Online payments and SMS are not active until their external integrations are configured and verified.

## Role dashboards
Use the account role after login to enter its dedicated workspace:
- Nurse: `/nurse`
- Doctor: `/doctor`
- Billing: `/billing`
- Admin care operations: `/admin-care`
- Family: `/family`

The four staff workspaces now have distinct page layouts/identity and role-specific navigation. Server API role and patient-scope checks remain in `server.js`. For a production deployment, use a persistent database/disk, HTTPS, strong account credentials, and live integration tests. Twilio SMS and real payment collection require external provider configuration; recorded billing payments are not online payment processing. Safety observations require human verification and are not validated camera diagnoses.
