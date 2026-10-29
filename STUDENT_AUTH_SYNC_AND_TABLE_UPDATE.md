# Student account sync and Students table update

## What changed
- Admin Dashboard > Students table no longer displays Roll No. or Section columns.
- Students Excel and PDF exports now contain Name, Email, and Password only.
- Student rows sort by name.
- Added a one-time Firebase Admin SDK script to create missing `users/{uid}` Firestore profiles for Firebase Authentication accounts and normalize non-admin profiles to `role: "student"`.
- Existing Firestore profiles with `role: "admin"` are preserved. The script does not delete or modify Firebase Authentication accounts.

## Why Firebase Authentication accounts may be missing from Students
Firebase Authentication and the Firestore `users` collection are separate. The current Students page reads profile documents from Firestore; an account visible in Authentication will not appear there until `users/{uid}` exists with the expected profile data. A browser-only page cannot safely list all Firebase Authentication users; use the Admin SDK migration below.

## One-time migration (back up first)
1. In Firebase Console, create/download a service-account JSON for the correct project. Keep it private and never commit it to GitHub.
2. From the project directory, install the Admin SDK in a temporary working directory or in an ignored local folder: `npm install firebase-admin`.
3. Run: `node scripts/sync-auth-users-to-firestore.cjs /absolute/path/to/service-account.json`
4. Confirm the summary counts and check `Firestore > users` for several UIDs. The script preserves existing admin profiles and assigns `student` to all other Auth accounts.
5. Refresh Admin Dashboard. Verify that all expected student profiles appear and test login with one affected student account.

The migration fills missing name/email/role profile fields from Firebase Authentication where possible. It cannot recover missing student roll numbers, sections, or passwords. Do not store real passwords in Firestore; use Firebase password-reset email when a student needs to set a password.
