// Configure your real merchant UPI ID before accepting payments.
// Never use a sample VPA for real transactions.
export const PYVANTA_UPI_ID = "YOUR_UPI_ID@BANK";
export const PYVANTA_PAYEE_NAME = "Pyvanta";
export const PYVANTA_PLANS = [
  {
    id: "starter", name: "Starter", durationDays: 60, durationLabel: "2 months · 60 days", price: 149,
    label: "Essential", specialSection: "points", allSpecialSections: false, codeVisualizations: false, sqliteSessions: false,
    features: ["All regular learning sections", "MCQ tests and mock tests", "Coding practice and progress tracking", "Special Coding Section unlocks at 200 Learning Points"]
  },
  {
    id: "pro", name: "Pro", durationDays: 180, durationLabel: "6 months · 180 days", price: 299,
    label: "Most Popular", specialSection: "included", allSpecialSections: false, codeVisualizations: false, sqliteSessions: false,
    features: ["Everything in Starter", "Direct access to the Special Coding Section", "No 200-point requirement for that section", "MCQ tests, mock tests and progress tracking"]
  },
  {
    id: "premium", name: "Premium", durationDays: 360, durationLabel: "12 months · 360 days", price: 499,
    label: "Best Value", specialSection: "included", allSpecialSections: true, codeVisualizations: true, sqliteSessions: false, sqliteSessionsComingSoon: true,
    features: ["Everything in Pro", "Access to all special sections", "Code Visualizations Lab", "SQLite learning sessions coming soon (within 1–2 months)"]
  }
];

// Legacy IDs keep existing subscriptions and pending requests recognizable.
export function getPyvantaPlan(planId) {
  const aliases = { "3m": "starter", "6m": "pro", "12m": "premium" };
  return PYVANTA_PLANS.find((plan) => plan.id === planId) || PYVANTA_PLANS.find((plan) => plan.id === aliases[planId]) || null;
}
