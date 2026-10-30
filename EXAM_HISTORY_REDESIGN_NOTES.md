# Pyvanta Exam History & Result Review Update

## What changed
- Student dashboard exam history now has filters for All / MCQ / Coding / Mixed and Passed / Failed / Pending.
- Student `View details` opens one consistent result view for MCQ, Coding, and Mixed exams.
- MCQ review shows the student's selected answer and correct answer.
- Coding review shows problem-level marks, test-case results, execution time, attempt count, and expandable submitted code.
- Result and code preview styling now follows Pyvanta midnight / violet / cyan theme with readable dark code panels.
- Admin Results table now provides a full-detail action for every non-absent exam type, rather than only a code-history action for coding/mixed exams.
- Admin result details include student identity, score, percentage, violations, MCQ review, and coding submissions where applicable.
- Admin Results includes an exam-type filter and a visible count / read-error notice. If Firestore denies admin reads, the UI now shows the error instead of silently looking empty.

## Data safety
- No Firestore collections or existing result documents are renamed, migrated, overwritten, or deleted.
- Existing `submissions` and `codeSubmissions` collections remain the source of truth.
- No Firestore rules changes are included.
- Exam/question documents are read using the existing functions and permissions.

## Important limitations
- Historical detail is only available when the existing submission contains answers and the corresponding exam questions remain available/published to the student.
- Coding details are only available when `codeSubmissions` documents exist for that student and exam.
- The admin Results notice reports Firestore read failures with the error message. If it reports permission denied, verify the signed-in admin's `users/{uid}.role` is exactly `admin` and the deployed rules permit admin reads of `submissions` and `codeSubmissions`.
- Static syntax and HTML parsing checks were run. No live Firebase account or production data was accessed, and no deployment was performed.
