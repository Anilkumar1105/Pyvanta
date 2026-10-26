// Configure your real merchant UPI ID before accepting payments.
// Never use a sample VPA for real transactions.
export const PYVANTA_UPI_ID = "YOUR_UPI_ID@BANK";
export const PYVANTA_PAYEE_NAME = "Pyvanta";
export const PYVANTA_PLANS = [
  { id: "3m", name: "3 Months", months: 3, price: 99, label: "Starter" },
  { id: "6m", name: "6 Months", months: 6, price: 199, label: "Popular" },
  { id: "12m", name: "1 Year", months: 12, price: 299, label: "Best Value" }
];
