# AI-Based Patient Gesture Communication and Alert System

A real-world healthcare assistive communication prototype for non-verbal patient needs. The hospital PC performs the main AI/camera processing and a nurse phone can connect through the same hospital Wi-Fi.

## Included in this final package

- Hospital command-center dashboard with page-by-page navigation (no long stacked dashboard)
- Patient admission and management
- Patient → Room → Bed → Doctor → Nurse mapping
- Duplicate patient ID and duplicate room/bed protection
- Rooms & Beds occupancy command map
- Appointments / care schedule
- Active alerts and Alert History
- Alert workflow: Active/Pending → Acknowledged → Resolved → Archived
- Emergency alert protection and confirmation rules
- Reports and analytics
- System health panel
- Admin / Nurse / Viewer roles
- Secure password hashing using Node.js `scrypt`
- Session timeout and password change
- Audit log
- Backup JSON download
- Configurable detection thresholds and re-arm timing
- Configurable gesture/meaning registry
- English / Kannada / Hindi voice configuration
- Hand communication: Pointing Finger, OK Sign, Thumbs Up/Down, 2–5 finger mappings
- Face communication, eye-blink communication and head-movement engine
- Separate difficulty-breathing / emergency pathway
- Invalid/unknown movement rejection
- Global alert lock and same-gesture re-arm protection
- Live camera page using MediaPipe Hands + Face Mesh
- Verification / Simulation suite for judging and unreliable camera environments
- Same-Wi-Fi nurse mobile page with real-time Server-Sent Events synchronization
- Responsive colorful healthcare command-center UI; avoids a blue-heavy/white-heavy/black-heavy theme
- Existing project assets and source modules are preserved where applicable

## Architecture

Patient signal → Camera/AI → Validation → Patient/Room/Bed mapping → Voice + Alert → Nurse Mobile → Acknowledge → Resolve → History/Analytics

The local Node.js server listens on `0.0.0.0`, so a phone on the same LAN can open `/mobile` using the computer's local IP.

## Run locally

1. Install Node.js LTS.
2. Open a terminal in this project folder.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:3000`.
6. Sign in with an authorized account configured for the deployment. The login UI intentionally does not display default credentials.

For a fresh demo install, the server creates hashed demo accounts from these environment variables when no `data/users.json` exists:

- `ADMIN_USER` / `ADMIN_PASSWORD`
- `NURSE_USER` / `NURSE_PASSWORD`
- `VIEWER_USER` / `VIEWER_PASSWORD`

If they are not supplied, the fresh local demo uses the legacy project defaults internally; the passwords are stored only as scrypt hashes. Change the password immediately from **System Settings**.

## Render

- Environment: Node
- Build Command: `npm install`
- Start Command: `npm start`
- Service type: Web Service

For cloud deployment, set the admin/admin-only credentials as Render environment variables. The same-Wi-Fi mobile workflow is intended for a hospital/local-network deployment; a public Render deployment is useful for showing the web UI but is not the same as a hospital LAN.

## Same-Wi-Fi demo

1. Start the server on the hospital/demo computer.
2. Put the nurse phone on the same Wi-Fi.
3. From the dashboard tap **Same-Wi-Fi**.
4. Open the displayed `/mobile` address on the phone.
5. Log in with the nurse account.
6. Use Live Monitor or Simulation to generate a valid alert.
7. The nurse phone receives the alert and can **Acknowledge** or **Resolve** it.

## Important safety positioning

This is an assistive communication prototype. It does not diagnose medical conditions and does not replace hospital emergency systems or clinical judgment. Emergency detection should be clinically validated before real-world deployment.

## Demo narrative

A strong judging scenario is:

**Room 101 → Bed 2 → Ravi Kumar → Pointing Finger → Help Required → 94% confidence → nurse mobile → Acknowledge → Resolve → history/report.**

Then demonstrate an **Unknown Gesture**. The system should show it as rejected and generate no patient alert. Finally demonstrate **Difficulty Breathing / Emergency** as a separate high-priority path.

Created by Adarsh Anand Patil


## Detection safety
- No hand/face signal means no communication event.
- Supported signals require confidence and multi-frame stability.
- Unknown/random movement is rejected and cannot create an alert.
- Single and multi-patient modes use admin-managed patient/bed assignments.
- Face, eye and head communication have separate validation paths and emergency patterns.
- Reports expose valid, invalid/rejected and estimated false-prediction metrics.
- Emergency events use the same protected alert workflow and audit trail.

## Hospital LAN architecture
The hospital PC/laptop performs camera + AI detection and runs the Node.js server. The mobile device joins the same Wi-Fi and opens `/mobile`. A Vercel/public deployment is only a presentation/demo layer; persistent local hospital monitoring should run on the hospital LAN.
