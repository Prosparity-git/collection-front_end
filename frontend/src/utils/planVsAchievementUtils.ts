
import { Application } from '@/types/application';
import { PlanVsAchievementApplication } from '@/types/planVsAchievement';

export const convertToApplications = (data: PlanVsAchievementApplication[]): Application[] => {
  return data.map(item => ({
    id: item.applicant_id,
    applicant_id: item.applicant_id,
    applicant_name: item.applicant_name,
    branch_name: item.branch_name,
    rm_name: item.rm_name,
    collection_rm: item.collection_rm,
    dealer_name: item.dealer_name,
    field_status: item.updated_status || 'Unknown',
    ptp_date: item.updated_ptp_date,
    emi_amount: item.emi_amount,
    demand_date: item.demand_date,
    lender_name: item.lender_name,
    team_lead: item.team_lead,
    principle_due: item.principle_due,
    interest_due: item.interest_due,
    last_month_bounce: item.last_month_bounce,
    applicant_mobile: item.applicant_mobile,
    co_applicant_name: item.co_applicant_name,
    co_applicant_mobile: item.co_applicant_mobile,
    co_applicant_address: item.co_applicant_address,
    guarantor_name: item.guarantor_name,
    guarantor_mobile: item.guarantor_mobile,
    guarantor_address: item.guarantor_address,
    reference_name: item.reference_name,
    reference_mobile: item.reference_mobile,
    reference_address: item.reference_address,
    applicant_address: item.applicant_address,
    house_ownership: item.house_ownership,
    repayment: item.repayment,
    fi_location: item.fi_location,
    user_id: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lms_status: 'Unknown',
    applicant_calling_status: 'Not Called',
    co_applicant_calling_status: 'Not Called',
    guarantor_calling_status: 'Not Called',
    reference_calling_status: 'Not Called',
    latest_calling_status: 'No Calls',
    recent_comments: []
  }));
};

export const getChangeSummary = (item: PlanVsAchievementApplication): string => {
  const statusChanged = item.previous_status !== item.updated_status;
  const ptpChanged = item.previous_ptp_date !== item.updated_ptp_date;

  if (statusChanged && ptpChanged) {
    return 'Status Updated & PTP Updated';
  } else if (statusChanged) {
    return 'Status Updated';
  } else if (ptpChanged) {
    return 'PTP Updated';
  } else {
    return 'No Change';
  }
};

export const getChangePriority = (item: PlanVsAchievementApplication): number => {
  const statusChanged = item.previous_status !== item.updated_status;
  const ptpChanged = item.previous_ptp_date !== item.updated_ptp_date;

  if (statusChanged && ptpChanged) return 1;
  if (statusChanged) return 2;
  if (ptpChanged) return 3;
  return 4; // No change
};
