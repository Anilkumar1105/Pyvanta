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


## Automatic certificates on Firebase Spark (browser-generated mode)

Students can generate a certificate PDF without Firebase Cloud Functions or a Blaze upgrade. The browser checks the student's active subscription document, loads their own submitted exam records and matching exam course tags, then requires at least five distinct completed exams with a 70% average. Achievement levels are Bronze (70–79%), Silver (80–89%), Gold (90–94%) and Platinum (95–100%). The PDF downloads immediately.

### Important limitations

- This mode does not use Cloud Functions and does not require a Blaze upgrade.
- Newly generated certificates are stored only in the student's current browser local storage. They are not synchronized to another device and may be lost if browser data is cleared.
- The PDF is explicitly marked as a browser-generated, non-publicly-verified copy. It has no public verification QR. Existing certificates previously issued through the trusted admin/Cloud Function path remain in the official wallet and verification registry.
- Because eligibility is checked in the browser, a technically knowledgeable user could manipulate client-side data. Do not treat Spark-mode PDFs as tamper-proof credentials. Strong, publicly verifiable certificates require a trusted backend such as Cloud Functions or another server.
- Each exam must have the correct Python or SQL course mapping in Admin Dashboard → Exams. Only distinct exams with submitted or auto-submitted results and numeric percentages are counted.

### Deployment on GitHub/Vercel

1. Upload the updated website files to the existing GitHub repository; Vercel will redeploy the static site.
2. No Firebase Functions deployment is needed. No Firestore rules change is required for browser-generated certificates.
3. Keep the existing Firestore rules and official verification registry unchanged.
4. Test with one active subscriber who has five completed Python exams averaging at least 70%, then test SQL and ineligible accounts.
