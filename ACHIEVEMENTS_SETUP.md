# Pyvanta Achievements & Goals

## Included
- Student dashboard Achievements & Goals panel with progress bars and earned/locked stars.
- Milestones for unique completed coding questions, learning streaks, 200 Learning Points, higher-point goals, weekly active learning days, and completed learning concepts.
- Admin milestone settings card inside the Analytics tab.
- Student goals read from `appSettings/achievementSettings`; if the document does not exist, defaults are used.
- Existing weekly toppers and coding-toppers panels remain the weekly leaderboard experience.

## Defaults
- Code Warrior: 25 unique completed Learning coding questions.
- Streak Star: 7-day best streak.
- Special Section Star: 200 Learning Points (fixed; this does not change subscription or Special Section access rules).
- Pyvanta Legend: 500 Learning Points.
- Weekly Goal: solve a Learning problem on 5 of the last 7 days.

## Deployment
1. Replace the corresponding project files from this ZIP in the GitHub repository.
2. Commit and push the changes.
3. Sign in as an admin and open Analytics to configure the achievement thresholds.
4. Sign in as a student and refresh the dashboard to view goals and progress.

The existing Firestore rules allow signed-in users to read `appSettings` and admins to write it, so no rules change is needed for these settings. Achievement badges are derived from existing progress/points/streak records; this implementation does not grant extra Learning Points or modify the 200-point unlock policy.
