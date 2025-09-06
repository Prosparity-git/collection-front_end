export type LastMonthBounceCategory = 'Not paid' | 'Paid on time' | '1-5 days late' | '6-15 days late' | '15+ days late';

export interface FilterState {
  branch: string[];
  teamLead: string[];
  rm: string[];
  dealer: string[];
  lender: string[];
  status: string[];
  emiMonth: string[];
  repayment: string[];
  lastMonthBounce: LastMonthBounceCategory[];
  ptpDate: string[]; // Changed to string[] to handle display labels
  vehicleStatus: string[];
}

export interface AvailableOptions {
  branches: string[];
  teamLeads: string[];
  rms: string[];
  dealers: string[];
  lenders: string[];
  statuses: string[];
  emiMonths: string[];
  repayments: string[];
  lastMonthBounce: LastMonthBounceCategory[];
  ptpDateOptions: string[];
  vehicleStatusOptions: string[];
  demand_num: string[]; // Added to match backend API response
}

// Export alias for compatibility
export type Filters = FilterState;
