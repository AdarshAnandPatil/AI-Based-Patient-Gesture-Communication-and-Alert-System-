# Deploy this project to Render

## GitHub

Create a repository named:

`ai-patient-gesture-communication`

Upload all files in this folder.

## Render

Choose **Web Service**.

- Environment: Node
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`

After deployment, open the HTTPS URL.

## Test

1. Select Nurse.
2. Open Gesture Communication.
3. Select English/Kannada/Hindi.
4. Click Need Water / Need Nurse / Emergency.
5. Allow browser notifications if desired.
6. Hear the localized voice alert.
7. Open Alert Center.
8. Acknowledge, resolve or escalate.
9. Upload a sample PDF/JPG/PNG in Medical Reports.
10. Schedule an appointment.

## Camera

On the Render HTTPS site:
- allow camera permission
- click Start Camera
- show a hand
- MediaPipe will display detected landmarks and a basic gesture label

For the most reliable project demonstration, the six gesture buttons are included as a deterministic fallback.

## Important Render limitation

`data/db.json` is demo storage. For permanent production data, use PostgreSQL/Supabase because Render's ephemeral filesystem can reset.

The same applies to uploaded report files. Use object storage for a production deployment.
