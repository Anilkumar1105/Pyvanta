Pyvanta SQL Excel Reference Solution Import Fix

Replace admin-dashboard.js and admin-dashboard.html in your project with these files.

Fixes:
- Reads ReferenceSolution (also Solution/ReferenceAnswer/Answer aliases) from SQL_QUERY Excel rows.
- Saves the imported solution into learningCodingQuestions with the question.
- Adds the Reference Solution field to the SQL admin edit form and loads/saves it when editing.
- The existing SQL_QUESTIONS + SQL_TEST_CASES workbook layout remains supported.

Then deploy. Import your SQL workbook into the SQL learning level using Learning > Coding Practice > Import Excel.
The student View Solution reads the saved question.solution field.
