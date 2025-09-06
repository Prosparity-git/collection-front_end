
import { useMemo } from 'react';
import { Application } from '@/types/application';
import { isToday, isTomorrow, isBefore, isAfter, startOfDay } from 'date-fns';

export interface PaymentStatusRow {
  rm_name: string;
  branch_name: string;
  unpaid: number;
  partially_paid: number;
  paid_pending_approval: number;
  paid: number;
  others: number;
  total: number;
}

export interface PTPStatusRow {
  rm_name: string;
  branch_name: string;
  overdue: number;
  today: number;
  tomorrow: number;
  future: number;
  no_ptp_set: number;
  total: number;
}

export const useAnalyticsData = (applications: Application[]) => {
  const paymentStatusData = useMemo(() => {
    const groupedData = new Map<string, PaymentStatusRow>();
    
    applications.forEach(app => {
      const key = `${app.rm_name || app.collection_rm || 'Unknown RM'}_${app.branch_name}`;
      
      if (!groupedData.has(key)) {
        groupedData.set(key, {
          rm_name: app.rm_name || app.collection_rm || 'Unknown RM',
          branch_name: app.branch_name,
          unpaid: 0,
          partially_paid: 0,
          paid_pending_approval: 0,
          paid: 0,
          others: 0,
          total: 0
        });
      }
      
      const row = groupedData.get(key)!;
      row.total++;
      
      switch (app.field_status) {
        case 'Unpaid':
          row.unpaid++;
          break;
        case 'Partially Paid':
          row.partially_paid++;
          break;
        case 'Paid (Pending Approval)':
          row.paid_pending_approval++;
          break;
        case 'Cash Collected from Customer':
        case 'Customer Deposited to Bank':
        case 'Paid':
          row.paid++;
          break;
        default:
          row.others++;
          break;
      }
    });
    
    return Array.from(groupedData.values()).sort((a, b) => 
      a.rm_name.localeCompare(b.rm_name) || a.branch_name.localeCompare(b.branch_name)
    );
  }, [applications]);

  const ptpStatusData = useMemo(() => {
    // Filter out paid applications
    const unpaidApplications = applications.filter(app => 
      !['Cash Collected from Customer', 'Customer Deposited to Bank', 'Paid'].includes(app.field_status || '')
    );
    
    const groupedData = new Map<string, PTPStatusRow>();
    const today = startOfDay(new Date());
    
    unpaidApplications.forEach(app => {
      const key = `${app.rm_name || app.collection_rm || 'Unknown RM'}_${app.branch_name}`;
      
      if (!groupedData.has(key)) {
        groupedData.set(key, {
          rm_name: app.rm_name || app.collection_rm || 'Unknown RM',
          branch_name: app.branch_name,
          overdue: 0,
          today: 0,
          tomorrow: 0,
          future: 0,
          no_ptp_set: 0,
          total: 0
        });
      }
      
      const row = groupedData.get(key)!;
      row.total++;
      
      if (!app.ptp_date) {
        row.no_ptp_set++;
      } else {
        try {
          const ptpDate = new Date(app.ptp_date);
          
          if (isToday(ptpDate)) {
            row.today++;
          } else if (isTomorrow(ptpDate)) {
            row.tomorrow++;
          } else if (isBefore(ptpDate, today)) {
            row.overdue++;
          } else if (isAfter(ptpDate, today)) {
            row.future++;
          } else {
            row.no_ptp_set++;
          }
        } catch {
          row.no_ptp_set++;
        }
      }
    });
    
    return Array.from(groupedData.values()).sort((a, b) => 
      a.rm_name.localeCompare(b.rm_name) || a.branch_name.localeCompare(b.branch_name)
    );
  }, [applications]);

  return {
    paymentStatusData,
    ptpStatusData
  };
};
