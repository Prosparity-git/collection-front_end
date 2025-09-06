
export interface PlanVsAchievementApplication {
  applicant_id: string;
  branch_name: string;
  rm_name: string;
  collection_rm: string;
  dealer_name: string;
  applicant_name: string;
  previous_ptp_date: string | null;
  previous_status: string | null;
  updated_ptp_date: string | null;
  updated_status: string | null;
  comment_trail: string;
  emi_amount: number;
  demand_date: string;
  lender_name: string;
  team_lead: string;
  principle_due: number;
  interest_due: number;
  last_month_bounce: number;
  applicant_mobile: string;
  co_applicant_name: string;
  co_applicant_mobile: string;
  co_applicant_address: string;
  guarantor_name: string;
  guarantor_mobile: string;
  guarantor_address: string;
  reference_name: string;
  reference_mobile: string;
  reference_address: string;
  applicant_address: string;
  house_ownership: string;
  repayment: string;
  fi_location: string;
}
