# Free Public Mock Test

Added `mock-test.html` and `mock-test.js`, linked from the homepage navigation and free Python demo section.

## Test format
- 5 beginner Python MCQs (1 mark each; 5 marks total)
- 2 beginner coding tasks (5 marks each; 10 marks total), graded against four input/output cases per question
- 20-minute countdown timer
- Fullscreen is required to start
- Question navigation and answered-state indicators
- Fullscreen exit and tab visibility changes are counted as violations; the second violation auto-submits
- Result summary includes MCQ and coding marks, test-case results, percentage, and the 40% pass threshold
- Does not require login and does not read/write Firebase or save results to an account

## Technical and safety notes
- Python execution reuses the site's `python-runner.js` and Pyodide implementation, including its soft timeout handling.
- A soft timeout is not a hard security boundary; Pyodide runs inside the browser tab. This public trial is for practice, not high-stakes assessment or untrusted code.
- Fullscreen and tab-visibility events are best-effort browser signals and may behave differently across browsers/devices.
- An internet connection is required to load Pyodide from jsDelivr.
- The mock test is separate from authenticated admin-created exams and does not write to Firestore.
