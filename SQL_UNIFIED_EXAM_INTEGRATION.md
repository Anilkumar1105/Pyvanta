# SQL Unified Exam Results Integration

## What changed
- SQL timed assessments now create an `in-progress` document in the existing `submissions` collection.
- On submission, the same document is finalized with `score`, `totalMarks`, `percentage`, `mcqScore`, `codingScore`, `status`, `submittedAt`, `subject: "SQL"`, `sqlExamType`, and `sqlReview`.
- The SQL content admin page creates three inactive catalog documents in `exams`: `sql_practice_mcq`, `sql_practice_query`, and `sql_practice_mixed`. These catalog records let existing student history and admin result screens resolve the SQL exam title and type.
- Student history uses the submission document ID to open the exact attempt, so repeated SQL practice attempts do not open the wrong result.
- Admin result details show SQL MCQ selections and query attempts/solutions.
- SQL Query is available as a history/results filter.
- Python topper calculations exclude SQL practice attempts; the general weekly topper and overall exam analytics can include both subjects.

## Firestore access
The existing `submissions` rules already permit a signed-in student to create their own submission and update it while its current status is `in-progress`. The existing `exams` rules permit admin writes and signed-in reads. No new collection rule is required for this integration.

## First-time setup
1. Deploy the project's current `firestore.rules` if it is not already deployed.
2. Sign in as an administrator and open **Admin Dashboard → SQL Content** once. This creates/refreshes the three SQL exam catalog documents.
3. Publish sufficient SQL MCQs and query challenges in the SQL Excel import workbook.
4. Sign in with a Premium 360-day account and run one MCQ, one Query, and one Mixed SQL assessment.
5. Confirm each attempt appears in **Student Dashboard → My Exam History** and **Admin Dashboard → Results**.

## Important limitations
- SQL assessment execution and grading currently run in the browser using the seeded sql.js practice database and compare the submitted result with the imported solution. This is suitable for learning/practice but is not tamper-proof server-side grading.
- These SQL practice assessments have their own timer and are recorded in the shared result infrastructure. They do not yet inherit the Python exam page's fullscreen/violation monitoring or scheduled-section exam workflow.
- Existing historical Python submissions and student data are not migrated or rewritten.
