
// Database application type with updated date column types
export interface DatabaseApplication {
  id: string;
  applicant_id: string;
  applicant_name: string;
  branch_name: string;
  team_lead: string;
  rm_name: string;
  dealer_name: string;
  lender_name: string;
  lms_status: string;
  emi_amount: number;
  principle_due: number;
  interest_due: number;
  demand_date?: string | Date; // Now a proper DATE type
  user_id: string;
  created_at: string;
  updated_at: string;
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
  amount_collected?: number;
}

export interface UserProfile {
  full_name?: string;
  email?: string;
}

export interface CommentData {
  application_id: string;
  content: string;
  created_at: string;
  user_id: string;
}

export interface FieldStatus {
  id: string;
  application_id: string;
  status: string;
  user_id: string;
  user_email?: string;
  demand_date: string | Date; // Now a proper DATE type
  created_at: string;
  updated_at: string;
}

// Updated interfaces for PTP and Payment dates with proper DATE types
export interface PtpDate {
  id: string;
  application_id: string;
  ptp_date?: string;
  demand_date: string | Date; // Now a proper DATE type
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentDate {
  id: string;
  application_id: string;
  paid_date?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface CollectionData {
  id?: string;
  application_id: string;
  demand_date: string | Date; // Now a proper DATE type
  team_lead?: string;
  rm_name?: string;
  repayment?: string;
  emi_amount?: number;
  last_month_bounce?: number;
  lms_status?: string;
  collection_rm?: string;
  amount_collected?: number | null;
  created_at?: string;
  updated_at?: string;
}

// Minimal user/session types for dev auth
export interface User {
  id: string;
  email?: string;
  full_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Session {
  user: User;
}
