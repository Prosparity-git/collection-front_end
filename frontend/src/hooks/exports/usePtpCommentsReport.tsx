
import { useCallback } from 'react';
import { useExportBase, ExportData } from './useExportBase';
import { formatPtpDate } from '@/utils/formatters';

export const usePtpCommentsReport = () => {
  const { formatCommentTrail, createWorkbook } = useExportBase();

  const exportPtpCommentsReport = useCallback((data: ExportData, fileName: string = 'ptp-comments-report') => {
    const exportData = data.applications.map(app => ({
      'Applicant ID': app.applicant_id,
      'Branch Name': app.branch_name,
      'RM Name': app.rm_name || app.collection_rm,
      'Dealer Name': app.dealer_name,
      'Applicant Name': app.applicant_name,
      'PTP Date': formatPtpDate(app.ptp_date),
      'Comment Trail': formatCommentTrail(app.recent_comments || [])
    }));

    const colWidths = [
      { wch: 20 }, // Applicant ID
      { wch: 20 }, // Branch Name
      { wch: 20 }, // RM Name
      { wch: 25 }, // Dealer Name
      { wch: 25 }, // Applicant Name
      { wch: 15 }, // PTP Date
      { wch: 60 }  // Comment Trail (wider for multiple comments)
    ];

    createWorkbook(exportData, 'PTP and Comments', fileName, colWidths);
  }, [formatCommentTrail, createWorkbook]);

  return { exportPtpCommentsReport };
};
