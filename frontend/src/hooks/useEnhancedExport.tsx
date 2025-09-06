
import { useCallback } from 'react';
import { Application } from '@/types/application';
import { usePtpCommentsReport } from './exports/usePtpCommentsReport';
import { useFullReport } from './exports/useFullReport';
import { usePlanVsAchievementReport } from './exports/usePlanVsAchievementReport';

interface ExportData {
  applications: Application[];
}

export const useEnhancedExport = () => {
  const { exportPtpCommentsReport } = usePtpCommentsReport();
  const { exportFullReport } = useFullReport();
  const { exportPlanVsAchievementReport, loading: planVsAchievementLoading } = usePlanVsAchievementReport();

  // Legacy export function for backward compatibility
  const exportToExcel = useCallback((applications: Application[], fileName: string = 'applications-export') => {
    const exportData = { applications };
    exportFullReport(exportData, fileName);
  }, [exportFullReport]);

  return {
    exportPtpCommentsReport,
    exportFullReport,
    exportPlanVsAchievementReport,
    exportToExcel,
    planVsAchievementLoading
  };
};
