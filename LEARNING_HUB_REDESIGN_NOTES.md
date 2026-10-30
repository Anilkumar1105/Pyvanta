# Pyvanta Learning Hub redesign

## What changed
- Replaced the long learning-module grid on the student dashboard with a responsive Learning Hub.
- Added two subject tabs only: Python and SQL.
- Added a Continue Learning card, module search, and status filters.
- Added expandable learning phases. Admin-defined `phase` values are used first; existing levels without a phase are automatically grouped into sets of six.
- Added compact module cards with completion progress and subtle hover/entry animations.
- Added reduced-motion support for students who prefer less animation.
- Added Subject and optional Learning phase fields to the Admin Create/Edit Learning Level form.
- Added the subject column to the Admin Learning Levels table.

## Data compatibility
- Existing levels without a `subject` field are treated as Python.
- New SQL levels can be created by selecting SQL in the Admin form.
- Existing learning level IDs and `learningProgress` documents are unchanged. Student progress is not reset or migrated.
- No Firebase security rules, credentials, or deployed data were changed.

## Admin usage
1. Open Admin Dashboard > Learning Levels > Create Level.
2. Choose Python or SQL.
3. Optionally enter a Learning phase name to group related modules.
4. Save. The student Learning Hub displays the new module under that subject.

## Validation performed
- JavaScript syntax checks passed for `admin-dashboard.js`, `learning.js`, `learning-page.js`, and the inline student dashboard module script.
- This is a source-code update only; it has not been deployed or tested against the live Firebase project.
