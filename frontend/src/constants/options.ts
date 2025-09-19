export const VEHICLE_STATUS_OPTIONS = [
  { value: "None", label: "None", color: "bg-gray-400 text-white" },
  { value: "Repossessed", label: "Repossessed", color: "bg-red-600 text-white" },
  { value: "Need to repossess", label: "Need to repossess", color: "bg-orange-500 text-white" },
  { value: "Third party", label: "Third party", color: "bg-blue-500 text-white" },
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