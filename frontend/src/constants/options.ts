export const VEHICLE_STATUS_OPTIONS = [
  { value: "none", label: "None", color: "bg-gray-100 text-gray-800 border border-gray-200" },
  { value: "Repossessed", label: "Repo", color: "bg-green-100 text-green-800 border border-green-200" },
  { value: "Need to repossess", label: "Need to repossess", color: "bg-orange-100 text-orange-800 border border-orange-200" },
  { value: "Third party", label: "Third party", color: "bg-blue-100 text-blue-800 border border-blue-200" },
  { value: "Repossessed_sold", label: "Repo-Sold", color: "bg-purple-100 text-purple-800 border border-purple-200" },
];

export const CALLING_STATUS_OPTIONS = [
  { value: "No response", label: "No response" },
  { value: "Customer funded the account", label: "Customer funded the account" },
  { value: "Customer will fund the account on a future date", label: "Customer will fund the account on a future date" },
  { value: "Cash collected", label: "Cash collected" },
  { value: "Cash will be collected on a future date", label: "Cash will be collected on a future date" },
  { value: "Spoken – no commitment", label: "Spoken – no commitment" },
  { value: "Refused / unable to fund", label: "Refused / unable to fund" }
];

export const STATUS_FILTER_OPTIONS = [
  "Unpaid",
  "Partially Paid",
  "Cash Collected from Customer",
  "Customer Deposited to Bank",
  "Paid",
  "Paid (Pending Approval)",
  "Overdue Paid"
];

export const PAYMENT_MODE_OPTIONS = [
  { value: "1", label: "Cash Collected" },
  { value: "2", label: "UPI" },
  { value: "3", label: "Payment Link" }
]; 