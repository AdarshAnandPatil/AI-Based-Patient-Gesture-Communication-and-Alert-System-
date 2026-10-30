# AI-Based Patient Gesture Communication and Alert System

Assistive, non-verbal patient communication: camera (hand / face / eye / head) → validation → patient-room-bed mapping → voice + alert → nurse phone → acknowledge → resolve → history & analytics.

Created by Adarsh Anand Patil. Assistive technology only — not a replacement for clinical judgment.

## Run locally
```
npm install
npm start          # http://localhost:3000
npm test           # detection-engine unit tests
```
First start creates the admin account from `ADMIN_USER` / `ADMIN_PASSWORD` (default `admin` / `admin123` locally — change it in System Settings). Use the Admin & Audit page to create Nurse and Family accounts; family accounts must be linked to one patient.

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
