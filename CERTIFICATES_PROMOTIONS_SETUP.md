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
- `certificateRequests`: students create and read their own Python/SQL requests; admins can read all requests and approve/reject them. A request stores its status, reason, review note and linked certificate ID.
- `certificates`: private issued certificate record; student owner and admins can read; admins write.
- `publicCertificates`: minimal verification fields only; public read, admin write.
- `promotions`: private admin-managed campaign source.\n- `publicPromotions`: sanitized published campaign projection; public read, admin write. Optional reward targets can track a student's existing Learning Points or unique completed coding-problem count.
- `promotionEntries`: students can create/read their own participation entries; admins can review.
- `studentSuccessStories`: private admin-managed story source, including UID and consent/audit metadata.\n- `publicStudentSuccessStories`: sanitized approved story projection; public read, admin write.
- `courseBaselines`: private baseline/final comparison record; admin-managed.

## Important operating rules
1. Students submit a request from My Certificates. Admins review it in Certificates & Promotions → Student certificate requests.
2. To approve, select Review / Issue, complete the certificate details, confirm eligibility and consent, then issue. Issuing links the certificate ID to the request and changes its status to approved.
3. To reject, use Reject and enter a reason; the student sees that reason in their request history. Students may submit a new request after a rejected request.
4. Issue certificates only after the admin checks the completion criteria and confirms student consent.
5. The current admin tool records an explicit eligibility attestation; it does not infer course completion from subscription purchase.
6. Baseline and final assessment scores in this version are entered by an admin after checking actual assessment records. Do not enter estimates or illustrative values as real student results.
7. Obtain student permission before publishing their name, scores, problem counts, or quote.
8. The public verification and homepage projection collections deliberately do not expose email, Firebase UID, roll number, consent metadata, admin UID, or private notes.
9. QR codes on the student PDF point to `verify-certificate.html?id=<certificateId>`.
10. Campaigns are visible on the homepage/student wallet only when published and within their configured dates.

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


## Automatic student certificate issuance (updated)

Student flow: **My Certificates → choose Python or SQL → Check eligibility & download**. The trusted callable Cloud Function checks the student's active subscription and course exam history. Eligibility is: at least **5 completed exams** tagged to the selected course and an average of at least **70%**. Achievement levels: Bronze 70–79%, Silver 80–89%, Gold 90–94%, Platinum 95–100%. A successful request creates the private certificate, public verification projection, and request-history record atomically; the browser then downloads the PDF. Duplicate requests return the existing certificate instead of issuing another.

### Required setup for automatic issuance

1. In Admin Dashboard → Exams, edit every existing exam and set **Certificate course mapping** to Python or SQL. New exams default to Python; choose SQL when appropriate. Exams without a correct `course`/`subject` value are not counted.
2. Cloud Functions require the Firebase project to use the **Blaze (pay-as-you-go) plan**. Review Firebase pricing and configure billing before deploying.
3. From the project root run `cd functions && npm install && cd ..`, then `firebase deploy --only functions`. Deploy the updated Firestore rules with `firebase deploy --only firestore:rules`. Deploy Hosting separately when ready.
4. Test with a subscribed student who has 5 completed exams in one course and a 70%+ average, then test an unsubscribed student and a student below the threshold.

The eligibility check and certificate creation run in a callable Cloud Function using the Admin SDK; students cannot directly write certificate records or certificate request records under the updated rules. The function checks for an existing certificate before issuance and uses an issuance lock to prevent duplicate concurrent requests. App Check is not enforced in this initial function configuration; enable and enforce it after registering the web app and testing valid clients. Existing old pending admin-review requests are legacy records and are not auto-approved.


### CORS troubleshooting (Vercel)

The callable function explicitly enables CORS for the deployed web client. If the browser still reports a failed OPTIONS preflight, verify that the latest `requestCourseCertificate` callable has actually deployed to `us-central1` in the same Firebase project as the frontend. From the project root run:

```bash
firebase use
firebase deploy --only functions:requestCourseCertificate
firebase functions:list
```

Confirm the listed function is `requestCourseCertificate`, region `us-central1`, and generation 2. Then hard-refresh the Vercel site. Do not replace the callable with a plain `onRequest` handler unless the frontend is also changed from `httpsCallable`. The callable SDK sends the required authentication token and callable request envelope. If preflight still fails, inspect the function deployment logs and the HTTP status for the OPTIONS request; a missing function, wrong region/project, or failed deployment can look like a CORS problem in the browser.
