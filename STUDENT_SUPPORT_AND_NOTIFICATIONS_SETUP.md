# Pyvanta support, subscription status, and coding completion updates

## Included
- Student dashboard support form with category, message, status, and admin response display.
- Admin > Payment Requests page now includes Student support requests; use Reply/Edit response to answer the student.
- Student dashboard subscription notice shows pending approval, approved/active, rejected, or no request.
- Learning coding question list shows a green Completed badge after every test case passes (saved in that student's browser local storage, matching the existing completion tracking implementation).
- Firestore rules added for `supportRequests` so students can create/read only their own requests and only admins can respond.

## Deploy
1. Replace the project files on GitHub with this ZIP's files.
2. Publish `firestore.rules` in Firebase Console > Firestore Database > Rules (or deploy the rules using Firebase CLI).
3. Commit and push the site files, then hard-refresh the website (`Ctrl+Shift+R`).
4. Test using a student account: submit a support request, verify a pending subscription notification, then respond from Admin > Payment Requests.
5. To test subscription status, submit a payment request from the Subscriptions page and approve/reject it from the admin page.

Note: These are dashboard notifications shown when the student opens/reloads the dashboard, not push notifications or email alerts. Coding completion badges currently use local browser storage; they appear for that student in the same browser.
