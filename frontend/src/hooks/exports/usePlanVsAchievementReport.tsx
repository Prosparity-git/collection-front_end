
import { useCallback } from 'react';
import { useExportBase } from './useExportBase';
import { usePlanVsAchievementData } from './usePlanVsAchievementData';
import { formatPtpDate } from '@/utils/formatters';

export const usePlanVsAchievementReport = () => {
  const { createWorkbook } = useExportBase();
  const { fetchPlanVsAchievementData, loading } = usePlanVsAchievementData();

  const exportPlanVsAchievementReport = useCallback(async (plannedDateTime: Date, fileName: string = 'plan-vs-achievement-report') => {
    const data = await fetchPlanVsAchievementData(plannedDateTime);
    
    const exportData = data.map(app => ({
      'Branch Name': app.branch_name,
      'RM': app.rm_name,
      'Collection RM': app.collection_rm,
      'Dealer': app.dealer_name,
      'Applicant': app.applicant_name,
      'Previous PTP Date': formatPtpDate(app.previous_ptp_date),
      'Previous Status': app.previous_status,
      'Updated PTP Date': formatPtpDate(app.updated_ptp_date),
      'Updated Status': app.updated_status,
      'Comment Trail': app.comment_trail
    }));

    const colWidths = [
      { wch: 20 }, // Branch Name
      { wch: 20 }, // RM
      { wch: 20 }, // Collection RM
      { wch: 25 }, // Dealer
      { wch: 25 }, // Applicant
      { wch: 15 }, // Previous PTP Date
      { wch: 20 }, // Previous Status
      { wch: 15 }, // Updated PTP Date
      { wch: 20 }, // Updated Status
      { wch: 60 }  // Comment Trail
    ];

    createWorkbook(exportData, 'Plan vs Achievement', fileName, colWidths);
    return data.length;
  }, [fetchPlanVsAchievementData, createWorkbook]);

  return { exportPlanVsAchievementReport, loading };
};
