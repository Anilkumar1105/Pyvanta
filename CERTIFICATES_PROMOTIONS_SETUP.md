# Pyvanta Certificates, Promotions & Student Transformations

## Added pages and modules
- `admin-recognition.html` / `admin-recognition.js`: admin-only certificate issuing/revocation, campaign management, and student success story management.
- `my-certificates.html` / `my-certificates.js`: student certificate wallet, PDF download, QR verification, and active campaign participation.
- `verify-certificate.html` / `verify-certificate.js`: public certificate verification using the minimal public registry.
- `homepage-promotions.js`: loads only published promotions and approved student transformation stories on `index.html`.
- `index.html`: adds the Before/After transformation and active promotions sections.
- `admin-dashboard.html`: adds the Certificates & Promotions admin navigation.
- `student-dashboard.html`: adds a My Certificates & Promotions shortcut.
- `auth.js`: keeps the certificate wallet available for students whose subscription is expired, like the existing dashboard/history pages.
- `firestore.rules`: adds access controls for the new collections.

## Firestore collections
- `certificates`: private issued certificate record; student owner and admins can read; admins write.
- `publicCertificates`: minimal verification fields only; public read, admin write.
- `promotions`: private admin-managed campaign source.\n- `publicPromotions`: sanitized published campaign projection; public read, admin write. Optional reward targets can track a student's existing Learning Points or unique completed coding-problem count.
- `promotionEntries`: students can create/read their own participation entries; admins can review.
- `studentSuccessStories`: private admin-managed story source, including UID and consent/audit metadata.\n- `publicStudentSuccessStories`: sanitized approved story projection; public read, admin write.
- `courseBaselines`: private baseline/final comparison record; admin-managed.

## Important operating rules
1. Issue certificates only after the admin checks the completion criteria and confirms student consent.
2. The current admin tool records an explicit eligibility attestation; it does not infer course completion from subscription purchase.
3. Baseline and final assessment scores in this version are entered by an admin after checking actual assessment records. Do not enter estimates or illustrative values as real student results.
4. Obtain student permission before publishing their name, scores, problem counts, or quote.
5. The public verification and homepage projection collections deliberately do not expose email, Firebase UID, roll number, consent metadata, admin UID, or private notes.
6. QR codes on the student PDF point to `verify-certificate.html?id=<certificateId>`.
7. Campaigns are visible on the homepage/student wallet only when published and within their configured dates.

## Deploy / test
1. Review `firestore.rules` against the live Firebase rules before replacing them. These rules are based on the uploaded project baseline and must be merged carefully if production rules have changed.
2. Deploy rules with `firebase deploy --only firestore:rules` from the Firebase project root.
3. Upload all new HTML/JS files and modified files to the same GitHub Pages/Vercel project root.
4. Test admin issuing/revocation with a test student account.
5. Test student wallet while active and expired subscription; the wallet should remain available.
6. Test public certificate verification in a signed-out/incognito browser.
7. Test campaign publish/unpublish and start/end date visibility.
8. Test homepage with zero stories/promotions and with approved records.
9. Confirm that student consent is obtained before publishing any public story.

## Current limitations / next hardening step
This project is a static frontend. Admin-only Firestore writes are protected by rules, but the browser itself is not a trusted server. For stronger issuance guarantees and immutable audit trails, move certificate ID creation, eligibility validation, and revocation synchronization into Firebase Cloud Functions with App Check. The current story form uses admin-entered verified results; automatic baseline/final extraction requires mapping the existing exam result schema and adding a dedicated baseline assessment workflow.
