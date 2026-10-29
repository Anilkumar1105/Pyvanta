# Pyvanta account/profile recovery

## What changed in this patch
- Login and protected-page guards call `getOrRepairUserProfile()` after Firebase Authentication succeeds.
- If `users/{Firebase UID}` is missing, the signed-in account can create only its own `role: student` profile, subject to deployed Firestore rules. The code never grants admin access and never overwrites an existing profile.
- Signup stores the Firebase UID in the profile, normalizes email, and distinguishes Firestore permission errors from other failures.
- Verification email delivery failure is reported separately from account/profile creation.
- The one-time reconciliation script below imports missing Authentication accounts into Firestore while preserving existing documents and roles.

## Deploy and verify
1. Back up Firestore first.
2. Deploy the project's `firestore.rules` from Firebase Console/CLI. Confirm `users/{uid}` permits a signed-in owner to create their own profile only when `role == 'student'`, with string `email` and `name`.
3. Ensure `firebase-config.js` points at the intended Firebase project for both Authentication and Firestore.
4. Test a brand-new signup; verify Authentication account and `users/{same UID}` document both exist.
5. Test an existing Auth account whose `users/{UID}` document is missing; sign in and verify the profile is repaired.
6. For all existing Auth accounts, run the trusted Admin SDK sync script below. The browser cannot enumerate all Authentication users.

## One-time/repeatable Admin SDK sync
- Keep a service-account JSON outside the repository; never commit it or paste its private key into chat.
- In a temporary trusted directory, install `firebase-admin` (`npm install firebase-admin`).
- Set `ADMIN_EMAILS` to comma-separated known administrator emails so missing admin profiles are skipped.
- Run: `ADMIN_EMAILS='admin@example.com' node scripts/sync-auth-users-to-firestore.cjs /absolute/path/service-account.json`
- Review the summary and check several UIDs in Firestore. Existing profiles are preserved; missing profiles are created as students unless their email is on the admin allowlist.

## Passwords and email verification
- Firebase Authentication never reveals a user's current password. Do not store plaintext passwords in Firestore or use a displayed value as a credential. Use password-reset emails for account recovery.
- `emailVerified` from the current Authentication user is authoritative for the signed-in user. Firestore's copy is only a snapshot and can become stale; refresh/sync it through a trusted Admin SDK process if the admin table needs authoritative verification status.
- Email verification does not activate a subscription. Subscription state must be read from the subscription record/status separately.
