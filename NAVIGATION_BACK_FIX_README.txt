Pyvanta learning back-navigation fix

Changed file: learning.html

What changed:
- The Back to Dashboard link now uses browser history when the learning page was opened from student-dashboard.html.
- This lets the browser restore the existing dashboard entry, including its scroll position and in-memory UI, when the browser supports back-forward cache.
- If the learning page was opened directly or from another page, the link retains its normal student-dashboard.html destination.

Install:
1. Replace learning.html in your project with the version in this archive.
2. Deploy the file.

Note: Browser back-forward cache behavior is controlled by the browser and hosting/runtime conditions. If the browser cannot restore the dashboard entry, it may still reload it; this change avoids forcing a fresh dashboard navigation when history restoration is available.
