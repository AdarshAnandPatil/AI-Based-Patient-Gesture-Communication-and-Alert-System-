# Implementation and verification status — role-separated update

## What is included
- Existing patient gesture communication, camera, face/eye/head detection, alerting, family portal, mobile monitor, dashboard and original source files are retained.
- Separate entry pages and navigation: Admin command center (`/dashboard`) and care workspace (`/care`), Nurse (`/nurse`), Doctor (`/doctor`), Billing (`/billing`), Parent portal (`/family`) and Parent care/billing/messages (`/family-care`). These are separate entry screens using the existing shared care UI assets; the role-specific navigation and server permissions determine what each account can do.
- Family accounts are linked to exactly one `linkedPatientId`. Family APIs filter to that child; requests for a different patient ID are denied.
- Nurse and doctor patient lists and clinical records are filtered by the nurse/doctor assigned on the patient record. Patient-scoped create/update operations verify assignment server-side.
- Billing accounts can read/manage billing records and see limited discharge clearance information, not clinical reports, alerts or monitoring.
- Admin account management remains admin-only. Accounts can be deactivated without erasing their historical actions. Passwords are scrypt-hashed; initial local admin password is randomly generated and printed to the server console. Set `ADMIN_USER` and `ADMIN_PASSWORD` in hosting environment variables before first production initialization.
- Care permissions: doctor manages prescriptions and initiates/approves discharge; nurse manages tasks, pain/food records and medicine administration; billing manages charges/payments; family can send messages but cannot edit sent messages or clinical/financial records.
- Alerts, reports, appointments and patient records are archived/cancelled rather than silently erased where the corresponding delete action is available. Messages are immutable. Audit entries record important actions.
- Billing supports itemized charges, admission advance/partial payments, balance calculation and printable individual receipt references. It records payments; it does not collect money online.
- New care pages use colourful green/yellow/red cards, priority labels, active/completed sections, patient/room details, waiting time and action buttons inspired by the supplied nurse dashboard. Existing main gesture UI is not redesigned.

## Security boundaries tested in this environment
- Added `tests/access-control.test.js`: checks linked-parent restriction, nurse and doctor patient assignment, billing-vs-clinical scope, and role-specific write permissions.
- Existing hand gesture tests: 57 passed.
- Existing face/eye/head tests: 29 passed.
- Existing dashboard smoke tests: 10 sections passed.
- JavaScript syntax checks: all public JS files and server.js passed.
- ZIP integrity: verified after packaging.

## Not fully verified / limitations
- `npm ci` timed out in this environment; Express, CORS and Multer were unavailable. Therefore no live HTTP/API end-to-end or browser click-through test could be run. The access-control test exercises the policy helpers and checks route wiring; it is not a substitute for live HTTP penetration testing.
- Nurse/doctor assignment depends on the assigned nurse/doctor name on each patient record matching the account display name or username. Admin must assign the correct staff identity.
- Parent online UPI/card payment is not integrated. Billing staff can record a payment made through the hospital's actual payment channel. A verified Razorpay/other gateway integration and merchant account are still required for in-app payment collection.
- SMS requires valid Twilio credentials and live delivery verification. Browser notifications are only available while the portal is open; no background mobile push service is configured.
- Language preferences cover English, Kannada, Hindi, Telugu and Tamil. Arbitrary medical free-text translation is not implemented; original text is retained.
- Camera registry does not automatically identify which person is in which bed. Experimental safety heuristics are not clinically validated and must be verified by staff. The system does not diagnose seizures, breathing conditions, oxygen levels or falls.
- Medicine administration remains a nurse-recorded workflow based on doctor-approved prescriptions; it is not an autonomous medication system.
- PDFs use browser Print → Save as PDF, not a digitally signed hospital document service.
- The application stores data in JSON files and sessions in process memory. Render free instances may lose local files on restart. Configure persistent storage or migrate to a production database before relying on records.
- This is a student prototype, not a certified hospital information system or medical device. Do not use real patient data or clinical decisions without security, privacy/legal and clinical review.

## Required live verification after download
1. Run `npm ci` and `npm test` in a network-enabled environment.
2. Run `npm start` and create separate test accounts for Admin, Nurse Anjali, Doctor Sharma, Billing and Ravi's parent.
3. Assign Nurse Anjali and Dr Sharma to Ravi in the patient record. Assign different staff to Imran.
4. Verify Ravi's parent cannot access Imran's patient, bills, timeline, alerts, reports or events by changing the ID in the URL/API request.
5. Verify Nurse Anjali and Dr Sharma cannot access Imran unless assigned.
6. Verify billing cannot access clinical records and family cannot create/update bills or prescriptions.
7. Click through every action in each role page and confirm the resulting record is persisted after reload.
8. Configure and test SMS/payment integrations separately before representing them as active.
