# AI-Based Patient Gesture Communication and Alert System

Assistive, non-verbal patient communication: camera (hand / face / eye / head) → validation → patient-room-bed mapping → voice + alert → nurse phone → acknowledge → resolve → history & analytics.

Created by Adarsh Anand Patil. Assistive technology only — not a replacement for clinical judgment.

## Run locally
```
npm install
npm start          # http://localhost:3000
npm test           # detection-engine unit tests
```
First start creates the admin account from `ADMIN_USER` / `ADMIN_PASSWORD` (default `admin` / `admin123` locally — change it in System Settings).

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
