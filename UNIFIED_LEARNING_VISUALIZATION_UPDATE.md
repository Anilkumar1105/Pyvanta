# Pyvanta Unified Learning + Visualization Update

## What changed
- Legacy SQL_CONTENT imports now create `learningLevels` and `learningConcepts`, so SQL modules appear in the existing Python/SQL Learning Hub.
- Legacy SQL_MCQ imports now create `learningMcqQuestions`, so SQL topic MCQs use the same learning flow and progress records.
- Existing SQL query/special challenge banks remain in `sqlChallenges` for the SQLite Query Practice/Exam Lab.
- SQL visualization imports now write to `codeVisualizations` with `subject: "SQL"`.
- Shared workbook template supports MODULES, TOPICS, TOPIC_CONTENT, TOPIC_MCQ and PRACTICE_QUESTIONS with a subject column (Python or SQL), plus legacy SQL sheets.
- Visualization Lab has a Python/SQL subject filter. Existing visualization records without subject are treated as Python.
- Admin now provides separate Python and SQL visualization Excel templates.
- Learning lesson Markdown is rendered with marked + DOMPurify instead of showing raw Markdown syntax.

## Import the supplied SQL workbook
1. Sign in as admin.
2. Open Admin Dashboard -> SQL Content.
3. Download the Unified Learning Excel Template (optional; legacy SQL workbook remains supported).
4. Upload `pyvanta_sql_module1_database_fundamentals.xlsx`.
5. Preview the mapped collections. Confirm the preview includes `learningLevels`, `learningConcepts`, and `learningMcqQuestions`.
6. Click Import validated rows.
7. Refresh the student dashboard and choose SQL. Module 1 should appear.

The current supplied workbook has 12 SQL_CONTENT lessons and 20 SQL_MCQ rows. Its SQL_QUERIES, SQL_SPECIAL and SQL_VISUALIZATIONS sheets are header-only.

## Important
- Imports use deterministic document IDs for module/concept/MCQ records, so re-importing the same IDs updates those same documents rather than creating duplicates.
- Existing Python learning collections and progress are not deleted or migrated.
- This update does not change Firebase security rules. Admin must have write access to the shared learning collections and codeVisualizations.
- SQL query challenges remain in the SQL Lab query bank; they are not executed by the Python Pyodide editor.
- Test with a non-admin Premium 360-day account and verify both subject filters before production deployment.
