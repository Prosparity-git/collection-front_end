export interface Application {
  id: string;
  applicant_id: string;
  loan_id?: number; // Added loan_id field from API response
  payment_id?: number; // Added payment_id field from API response
  demand_num?: string; // Added demand_num field from API response
  applicant_name: string;
  branch_name: string;
  team_lead: string;
  rm_name: string;
  dealer_name: string;
  lender_name: string;
  lms_status: string;
  field_status?: string; // From field_status table
  emi_amount: number;
  principle_due: number;
  interest_due: number;
  demand_date?: string;
  emi_month?: string; // EMI month from API response
  user_id: string;
  created_at: string;
  updated_at: string;
  auditLogs?: AuditLog[];
  applicant_mobile?: string;
  applicant_address?: string;
  house_ownership?: string;
  co_applicant_name?: string;
  co_applicant_mobile?: string;
  co_applicant_address?: string;
  guarantor_name?: string;
  guarantor_mobile?: string;
  guarantor_address?: string;
  reference_name?: string;
  reference_mobile?: string;
  reference_address?: string;
  fi_location?: string;
  repayment?: string;
  last_month_bounce?: number;
  collection_rm?: string;
  // These are now fetched from separate tables
  ptp_date?: string; // From ptp_dates table
  paid_date?: string; // From payment_dates table
  applicant_calling_status?: string; // From contact_calling_status table
  co_applicant_calling_status?: string;
  guarantor_calling_status?: string;
  reference_calling_status?: string;
  latest_calling_status?: string;
  recent_comments?: Array<{content: string; user_name: string}>;
  disbursement_date?: string;
  loan_amount?: number;
  vehicle_status?: string;
  amount_collected?: number;
  // Additional fields from API response
  payment_mode?: string; // Payment mode (Cash, UPI, etc.)
  status?: string; // Current status from API
  branch?: string; // Branch from API response
  rm_name_api?: string; // RM name from API response
  tl_name?: string; // Team lead name from API response
  dealer?: string; // Dealer from API response
  lender?: string; // Lender from API response
  demand_calling_status?: string; // Demand calling status from API response
  calling_statuses?: {
    applicant?: string;
    co_applicant?: string;
    guarantor?: string;
    reference?: string;
  };
}

export interface AuditLog {
  id: string;
  field: string;
  previous_value: string | null;
  new_value: string | null;
  user_id: string;
  user_email: string | null;
  user_name?: string | null;
  application_id: string;
  created_at: string;
}

export interface FilterOptions {
  branches: string[];
  teamLeads: string[];
  dealers: string[];
  lenders: string[];
  statuses: string[];
  emiMonths: string[];
  repayments: string[];
  lastMonthBounce: string[];
}

export interface RepaymentHistory {
  id: string;
  application_id: string;
  repayment_number: number;
  delay_in_days: number;
}
