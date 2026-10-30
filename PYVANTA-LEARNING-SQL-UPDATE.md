# Pyvanta Learning + Exams + Special Section Update

## Changes
- Removed the standalone SQL Content link from Admin navigation.
- Removed the separate SQL & SQLite Learning Lab promotional card from the student dashboard.
- Restored one Code Visualizations Lab card. Students choose Python or SQL inside the same visualization page.
- Kept the Learning Hub subject switch (Python / SQL) and module cards in the same place.
- SQL practice questions imported through the unified workbook are saved in `learningCodingQuestions` with `subject: "SQL"` and `language: "sql"`, so they appear under the SQL learning level's Query Practice.
- Added SQLite.js execution and test-case comparison for SQL practice questions in the shared Learning page.
- Added Python / SQL subject filter to the Special Section in both admin and student views.
- Added SQL special-question fields: schema/setup SQL, starter query, expected output JSON.
- Added SQL_QUERY Excel import type and a separate SQL Special Query Excel template.
- Student Special Section uses a SQL.js query playground for SQL questions and the existing Pyodide playground for Python questions.

## Admin workflow
1. Admin Dashboard -> Learning: create or select a level and ensure its Subject is Python or SQL.
2. Add concepts and topic MCQs to that level.
3. Import SQL query practice questions into the SQL level using the learning coding/query template; include `language=sql`, `schemaSql`, and test case JSON.
4. Admin Dashboard -> Special Section: choose Python or SQL filter.
5. For SQL Special questions, choose SQL in the question form and fill Schema/setup SQL, Starter Query and Expected output JSON. Or click SQL Query Excel and import rows with `Type=SQL_QUERY`.
6. Publish questions to make them visible to students.

## Student workflow
- Learning Hub: select Python or SQL, open a module, study concepts, pass topic MCQ and enter practice. SQL practice opens a SQLite query editor.
- Code Visualizations Lab: open the one shared lab and select Python or SQL inside it.
- Special Section: select Python or SQL and solve the corresponding challenges in the in-page editor.

## Important limitations / test checklist
- Existing exam catalogue remains shared and exam course mapping supports Python / SQL. This package does not yet change the formal proctored exam runner to grade SQL query questions. SQL query execution is available in Learning practice and Special Section; formal SQL query exam grading needs a dedicated SQL question editor/runner integration in `exam.js`.
- SQL.js runs in the browser. It is suitable for learning/practice, not tamper-proof high-stakes grading. Use server-side grading for secure formal exams.
- Existing Python code paths, data and question records are retained.
- Test on a staging copy, verify Firestore rules for `learningCodingQuestions` and `specialCodingQuestions`, and confirm Premium access rules.
