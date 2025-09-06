
import { useCallback } from 'react';
import { useExportBase, ExportData } from './useExportBase';

export const useFullReport = () => {
  const { createWorkbook } = useExportBase();

  const exportFullReport = useCallback((data: ExportData, fileName: string = 'applications-report') => {
    const exportData = data.applications.map(app => ({
      'Applicant ID': app.applicant_id,
      'Branch Name': app.branch_name,
      'RM Name': app.rm_name || app.collection_rm,
      'Dealer Name': app.dealer_name,
      'Applicant Name': app.applicant_name,
      'Applicant Mobile Number': app.applicant_mobile || '',
      'Applicant Current Address': app.applicant_address || '',
      'House Ownership': app.house_ownership || '',
      'Co-Applicant Name': app.co_applicant_name || '',
      'Coapplicant Mobile Number': app.co_applicant_mobile || '',
      'Coapplicant Current Address': app.co_applicant_address || '',
      'Guarantor Name': app.guarantor_name || '',
      'Guarantor Mobile Number': app.guarantor_mobile || '',
      'Guarantor Current Address': app.guarantor_address || '',
      'Reference Name': app.reference_name || '',
      'Reference Mobile Number': app.reference_mobile || '',
      'Reference Address': app.reference_address || '',
      'FI Submission Location': app.fi_location || '',
      'Demand Date': app.demand_date || '',
      'Repayment': app.repayment || '',
      'Principle Due': app.principle_due || 0,
      'Interest Due': app.interest_due || 0,
      'EMI': app.emi_amount,
      'Last Month Bounce': app.last_month_bounce || 0,
      'Lender Name': app.lender_name,
      'Status': app.field_status || 'Unpaid',
      'Team Lead': app.team_lead
    }));

    const colWidths = [
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 25 },
      { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 15 },
      { wch: 30 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 25 },
      { wch: 15 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, { wch: 15 },
      { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 25 },
      { wch: 12 }, { wch: 20 }
    ];

    createWorkbook(exportData, 'Applications', fileName, colWidths);
  }, [createWorkbook]);

  return { exportFullReport };
};
