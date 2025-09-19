// Status mapping utilities for consistent status handling across the application

// Map integer values to status labels (matching StatusTab REPAYMENT_STATUS_OPTIONS)
export const REPAYMENT_STATUS_MAPPING = {
  '1': 'Future',
  '2': 'Partially Paid',
  '3': 'Paid',
  '4': 'Overdue',
  '5': 'Foreclose',
  '6': 'Paid (Pending Approval)',
  '7': 'Paid Rejected'
};

// Map status labels back to integer values
export const STATUS_LABEL_TO_INTEGER = {
  'Future': '1',
  'Partially Paid': '2',
  'Paid': '3',
  'Overdue': '4',
  'Foreclose': '5',
  'Paid (Pending Approval)': '6',
  'Paid(Pending Approval)': '6', // Handle format without space
  'Paid Rejected': '7'
};

/**
 * Convert integer status to display label
 * @param status - Status value (can be integer string or label)
 * @returns Display label for the status
 */
export const getStatusLabel = (status: string | null | undefined): string => {
  if (!status) return 'Unknown';
  
  // If it's already a label (not an integer), return as is
  if (isNaN(Number(status))) {
    return status;
  }
  
  // If it's an integer, map it to the label
  return REPAYMENT_STATUS_MAPPING[status as keyof typeof REPAYMENT_STATUS_MAPPING] || status;
};

/**
 * Convert status label to integer value
 * @param label - Status label
 * @returns Integer value for the status
 */
export const getStatusInteger = (label: string | null | undefined): string => {
  if (!label) return '1'; // Default to Future
  
  // If it's already an integer, return as is
  if (!isNaN(Number(label))) {
    return label;
  }
  
  // If it's a label, map it to the integer
  return STATUS_LABEL_TO_INTEGER[label as keyof typeof STATUS_LABEL_TO_INTEGER] || '1';
};

/**
 * Get status color variant for UI components
 * @param status - Status value (integer or label)
 * @returns CSS class variant for the status
 */
export const getStatusVariant = (status: string | null | undefined): string => {
  const label = getStatusLabel(status);
  
  const variants = {
    'Future': 'bg-gray-100 text-gray-800 border-gray-200',
    'Unpaid': 'bg-red-100 text-red-800 border-red-200',
    'Partially Paid': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Overdue': 'bg-red-100 text-red-800 border-red-200',
    'Overdue Paid': 'bg-orange-100 text-orange-800 border-orange-200',
    'Foreclose': 'bg-purple-100 text-purple-800 border-purple-200',
    'Paid (Pending Approval)': 'bg-blue-100 text-blue-800 border-blue-200',
    'Paid': 'bg-green-100 text-green-800 border-green-200',
    'Paid Rejected': 'bg-red-100 text-red-800 border-red-200',
    'Cash Collected from Customer': 'bg-orange-100 text-orange-800 border-orange-200',
    'Customer Deposited to Bank': 'bg-indigo-100 text-indigo-800 border-indigo-200'
  };
  
  return variants[label as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-200';
};
