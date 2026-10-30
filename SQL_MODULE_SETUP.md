# Pyvanta SQL & SQLite Premium Module

## Included in this update
- New `sql-learning.html` student learning hub.
- Premium-only access check for the 360-day Premium subscription.
- SQLite browser execution using SQL.js / WebAssembly.
- Built-in sample schemas and beginner query challenges.
- SQL concepts, topic MCQs, query practice, timed MCQ/query/mixed practice exams, special challenges and query visualization walkthroughs.
- New `sql-content-admin.html` Excel importer with workbook template generation.
- Firestore collections: `sqlContent`, `sqlMcqs`, `sqlChallenges`, `sqlVisualizations`, `sqlSubmissions`, `sqlExamAttempts`.
- Premium plan feature metadata updated; dashboard links added.

## Excel workbook sheets
1. `SQL_CONTENT`: `id`, `title`, `description`, `content`, `order`, `published`
2. `SQL_MCQ`: `id`, `questionText`, `OptionA`, `OptionB`, `OptionC`, `OptionD`, `correctOptionIndex` (0–3), `explanation`, `topic`, `difficulty`, `published`
3. `SQL_QUERIES`: `id`, `title`, `prompt`, `starter`, `solution`, `topic`, `difficulty`, `tables` (comma-separated), `order`, `published`
4. `SQL_SPECIAL`: same columns as SQL_QUERIES; these rows are marked as special challenges.
5. `SQL_VISUALIZATIONS`: `id`, `title`, `query`, `stepsJson` (JSON array), `explanation`, `topic`, `published`

The admin page can generate a blank template workbook. Use stable IDs when you want an import to update an existing record instead of creating a duplicate.

## Deployment checklist
1. Review `subscription-config.js` and confirm Premium is the 360-day plan.
2. Deploy the updated `firestore.rules` before using SQL content import.
3. Sign in as an admin and open `sql-content-admin.html` to upload the Excel workbook.
4. Publish rows by setting `published` to TRUE.
5. Sign in with an active Premium test account and open `sql-learning.html`.
6. Test the Starter and Pro paywall, Premium access, query runner, MCQ bank, all three practice exam types, special challenges and imported visualizations.

## Important scope / grading note
The SQL MCQ, query and mixed exams in this first implementation are self-practice assessments. Attempts are saved to `sqlExamAttempts`, but they are not yet wired into the existing scheduled-exam creation, section scheduling, formal result exports or the existing exam-history dashboard. Query evaluation currently runs in the browser against the included sample SQLite database; do not use it for high-stakes grading or store confidential answer keys in client-readable records. For formal exams, move query execution and hidden test evaluation to a trusted server/Cloud Function and connect the SQL question type to the existing exam workflow.

## SQLite execution note
The practice lab uses SQL.js in the browser and a local sample database. It does not create or connect to a Firebase-hosted SQLite database. Student progress and attempts are stored in Firestore. The browser editor allows read-only SELECT/WITH queries to prevent destructive statements against the practice database.
