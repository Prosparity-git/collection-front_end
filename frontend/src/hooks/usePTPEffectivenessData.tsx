
import { useMemo } from 'react';
import { Application } from '@/types/application';
import { format } from 'date-fns';

interface PTPEffectivenessEntry {
  ptp_date: string;
  total_ptps: number;
  paid_on_ptp: number;
  paid_after_ptp: number;
  unpaid_others: number;
}

export const usePTPEffectivenessData = (applications: Application[]) => {
  return useMemo(() => {
    const dateMap = new Map<string, PTPEffectivenessEntry>();

    applications.forEach(app => {
      // Only count applications with PTPs
      if (!app.ptp_date) return;

      const ptpDateStr = app.ptp_date;
      let displayDate: string;
      
      try {
        const ptpDate = new Date(ptpDateStr);
        displayDate = format(ptpDate, 'yyyy-MM-dd');
      } catch {
        displayDate = ptpDateStr;
      }

      if (!dateMap.has(displayDate)) {
        dateMap.set(displayDate, {
          ptp_date: displayDate,
          total_ptps: 0,
          paid_on_ptp: 0,
          paid_after_ptp: 0,
          unpaid_others: 0
        });
      }

      const dateEntry = dateMap.get(displayDate)!;
      dateEntry.total_ptps++;

      // Determine payment status and timing
      const isPaid = app.field_status === 'Paid';
      const isPaidPending = app.field_status === 'Paid (Pending Approval)';
      const isOverdue = app.ptp_date && new Date(app.ptp_date) < new Date() && !isPaid && !isPaidPending;

      // For now, we'll use simplified logic since we don't have audit logs
      // In the future, this should check when the status actually changed
      if (isPaid || isPaidPending) {
        // Assume payment happened on PTP date if status is paid
        // This is a simplification - ideally we'd check audit logs for actual payment date
        dateEntry.paid_on_ptp++;
      } else if (isOverdue) {
        dateEntry.paid_after_ptp++;
      } else {
        dateEntry.unpaid_others++;
      }
    });

    return Array.from(dateMap.values()).sort((a, b) => b.ptp_date.localeCompare(a.ptp_date));
  }, [applications]);
};
