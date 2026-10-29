# Pyvanta public-site improvements

Prepared locally for review; no deployment was performed.

## Changes
- Added a free Python demo to `index.html`, powered by Pyodide loaded from its CDN only when the visitor runs code. It executes in the visitor's browser and is explicitly described as a learning preview rather than a secure sandbox.
- Added previews for a Python lesson, a sample interactive MCQ, and a coding exercise.
- Added homepage FAQ, privacy/proctoring summary, and visible links to plans, privacy, and support.
- Added `privacy.html` explaining account/learning data, Firebase use, browser visibility/fullscreen events, limitations, and how to seek support. Review this notice against the final production configuration and legal requirements before relying on it as a formal privacy policy.
- Added `support.html` with FAQs and routes to existing account/subscription flows. No unverified email or phone number was invented.
- Added a subscription feature comparison table to `subscriptions.html`, aligned to `subscription-config.js` (Starter 60 days / 200-point unlock; Pro direct access to Special Coding Section; Premium all special sections and Code Visualizations Lab).
- Added responsive demo styles, visible keyboard focus, reduced-motion accommodations, and table overflow support in `pyvanta-theme.css`.
- Updated sitemap entries for the public homepage, subscription, privacy, and support pages.

## Important limitations / review items
- The demo downloads Pyodide from a CDN the first time it is used. An internet connection is needed.
- Browser-side Python execution is not a hardened security sandbox. Visitors should not enter secrets or run untrusted programs; infinite loops may still freeze a browser tab.
- The supplied project has a student support workflow but no verified public support email address, so the support page points users to the existing signed-in support route/institution.
- Privacy copy is based on the code paths reviewed (Firebase, fullscreen and Page Visibility API); it should be reviewed by the platform operator against production Firebase rules, actual data-retention practices, and applicable privacy law.
- Deployment was not performed.

## Validation performed
- JavaScript syntax checked for the new inline scripts and `subscriptions.js`.
- Checked for duplicate IDs on the homepage.
- Confirmed the demo, FAQ, plan comparison, privacy and support links are present.
