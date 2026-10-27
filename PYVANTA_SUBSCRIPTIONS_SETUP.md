# Pyvanta subscription setup

## Included
- Pyvanta dark theme tokens: Jet Black `#050505`, Royal Amethyst `#6633AA`, Electric Cyan `#00E5FF`.
- Subscription plans: Starter ₹149 / 60 days; Pro ₹299 / 180 days; Premium ₹499 / 360 days.
- Email/password student signup with Firebase email verification. New self-registrations are student-only. Existing login accounts remain able to sign in; payment activation requires verified email.
- UPI intent + QR generated in the browser after configuring the merchant UPI ID.
- Payment requests stored in `subscriptionRequests`; admin approval creates/extends `subscriptions/{uid}`.
- Premium student pages redirect to the subscription page when there is no active subscription. Student dashboard remains accessible for history and renewal.
- Admin review page: `admin-subscriptions.html`.

## Required before production
1. In `subscription-config.js`, replace `YOUR_UPI_ID@BANK` with the actual verified merchant VPA and confirm the payee name. Until then, no payment QR is generated.
2. Deploy `firestore.rules` with `firebase deploy --only firestore:rules`. Review these rules against your current production rules before deploying; the uploaded rules are the project baseline.
3. Firebase Console → Authentication → Sign-in method: enable Email/Password. Set the authorized domain for GitHub Pages. Configure email templates and test verification links on the deployed domain.
4. Create at least one admin account using the existing admin workflow. Do not allow students to self-assign `role: admin`.
5. Publish the site to GitHub Pages with all root-level JS/CSS/HTML files. Static hosting does not run Cloud Functions.
6. Manually verify each payment in the merchant's bank/UPI app before approving it. A UPI transaction reference entered by a student is not proof of payment.

## Important security and functionality limits
- Direct UPI QR/deep-link payments cannot be automatically verified by a static GitHub Pages frontend. Current activation is admin-reviewed. For automatic verification, integrate a supported payment gateway (for example Razorpay) with a trusted server/webhook or Cloud Function. Never activate access solely from a client-side success callback.
- The admin approval UI uses Firestore client SDK and relies on the admin role in Firestore rules. Existing `isAdmin()` trusts `users/{uid}.role`; lock down who can modify this field and consider Firebase custom claims / Cloud Functions for stronger production security.
- The student can submit their own request, but only admins can write subscription activation documents. Review the Firestore rules carefully before deployment.
- This update does not delete existing users, exam submissions, points, streaks, or learning progress. Existing students without a subscription will be asked to subscribe when opening premium pages. Their dashboard/history remains accessible.
- A frontend subscription gate is a useful UI access control, but any future server APIs must independently validate subscription status.


## Admin navigation and approval email

- The Admin Dashboard sidebar now has separate **Payment Requests** and **Subscribed Users** links.
- The admin top bar uses the midnight-charcoal theme instead of a white background.
- On approval, the portal queues a confirmation message in Firestore's `mail` collection. The message confirms the plan name, amount, expiry date, and how to upgrade/extend.

### Required email delivery setup

Queueing a document does not send an email by itself. In Firebase Console, install/configure the official **Trigger Email from Firestore** extension and connect a real SMTP provider. Configure it to watch the `mail` collection and verify the sender domain/address. Deploy the updated `firestore.rules` so only admins can enqueue email messages. Test with a real test account before production. If the extension is not installed/configured or the admin role rules block writes, the subscription will still activate but the UI will warn that email could not be queued.

Do not put SMTP passwords or email-provider secrets in frontend JavaScript or GitHub Pages.


Current plan policy (2026-10):
- Starter (₹149 / 60 days): regular learning sections and MCQ/mock tests; Special Coding Section unlocks at 150 Learning Points.
- Pro (₹299 / 180 days): Starter features plus direct Special Coding Section access without the point threshold.
- Premium (₹499 / 360 days): Pro features, all special sections, and Code Visualizations Lab. SQLite sessions are planned for Premium within 1–2 months and are not live yet.
