import { API_BASE_URL, getAuthHeaders } from '../client';
import { FilterState } from '@/types/filters';

// Types for summary data - updated to match new backend response
export interface SummaryStatusResponse {
  total: number;
  future: number;
  overdue: number;
  partially_paid: number;
  paid: number;
  foreclose: number;
  paid_pending_approval: number;
  paid_rejected: number;
  overdue_paid: number;
}

// Summary Service
export class SummaryService {
  static async getSummaryStatus(
    emiMonth: string, 
    filters?: Partial<FilterState>
  ): Promise<SummaryStatusResponse> {
    const queryParams = new URLSearchParams({
      emi_month: emiMonth,
    });

    // Add filter parameters if provided
    if (filters) {
      if (filters.branch && filters.branch.length > 0) {
        queryParams.append('branch', filters.branch.join(','));
      }
      if (filters.dealer && filters.dealer.length > 0) {
        queryParams.append('dealer', filters.dealer.join(','));
      }
      if (filters.lender && filters.lender.length > 0) {
        queryParams.append('lender', filters.lender.join(','));
      }
      if (filters.status && filters.status.length > 0) {
        queryParams.append('status', filters.status.join(','));
      }
      if (filters.rm && filters.rm.length > 0) {
        queryParams.append('rm_name', filters.rm.join(','));
      }
      if (filters.teamLead && filters.teamLead.length > 0) {
        queryParams.append('tl_name', filters.teamLead.join(','));
      }
      if (filters.sourceRm && filters.sourceRm.length > 0) {
        queryParams.append('source_rm_name', filters.sourceRm.join(','));
      }
      if (filters.sourceTeamLead && filters.sourceTeamLead.length > 0) {
        queryParams.append('source_tl_name', filters.sourceTeamLead.join(','));
      }
      if (filters.ptpDate && filters.ptpDate.length > 0) {
        // Convert PTP date display labels to backend values
        const ptpDateValues = filters.ptpDate.map(label => {
          switch (label) {
            case 'Overdue PTP': return 'overdue';
            case 'Today\'s PTP': return 'today';
            case 'Tomorrow\'s PTP': return 'tomorrow';
            case 'Future PTP': return 'future';
            case 'No PTP Date': return 'no_ptp';
            default: return label.toLowerCase();
          }
        });
        queryParams.append('ptp_date_filter', ptpDateValues.join(','));
      }
      if ((filters as any).dpdBucket && (filters as any).dpdBucket.length > 0) {
        queryParams.append('current_dpd_bucket', (filters as any).dpdBucket.join(','));
      }
      if (filters.repayment && filters.repayment.length > 0) {
        queryParams.append('demand_num', filters.repayment.join(','));
      }
      if (filters.specialCaseFilter && filters.specialCaseFilter.length > 0) {
        queryParams.append('special_case_filter', filters.specialCaseFilter.join(','));
      }
      // Note: demand_num filter is now properly mapped from frontend repayment filter
    }

    const response = await fetch(
      `${API_BASE_URL}/summary/summary?${queryParams.toString()}`,
      { headers: getAuthHeaders() }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch summary status: ${response.status}`);
    }

    return await response.json();
  }

  // Helper method to get total applications count
  static async getTotalApplications(
    emiMonth: string, 
    filters?: Partial<FilterState>
  ): Promise<number> {
    const summary = await this.getSummaryStatus(emiMonth, filters);
    return summary.total;
  }

  // Helper method to get future applications count
  static async getFutureApplications(
    emiMonth: string, 
    filters?: Partial<FilterState>
  ): Promise<number> {
    const summary = await this.getSummaryStatus(emiMonth, filters);
    return summary.future;
  }

  // Helper method to get overdue applications count
  static async getOverdueApplications(
    emiMonth: string, 
    filters?: Partial<FilterState>
  ): Promise<number> {
    const summary = await this.getSummaryStatus(emiMonth, filters);
    return summary.overdue;
  }

  // Helper method to get partially paid applications count
  static async getPartiallyPaidApplications(
    emiMonth: string, 
    filters?: Partial<FilterState>
  ): Promise<number> {
    const summary = await this.getSummaryStatus(emiMonth, filters);
    return summary.partially_paid;
  }

  // Helper method to get paid applications count
  static async getPaidApplications(
    emiMonth: string, 
    filters?: Partial<FilterState>
  ): Promise<number> {
    const summary = await this.getSummaryStatus(emiMonth, filters);
    return summary.paid;
  }

  // Helper method to get foreclose applications count
  static async getForecloseApplications(
    emiMonth: string, 
    filters?: Partial<FilterState>
  ): Promise<number> {
    const summary = await this.getSummaryStatus(emiMonth, filters);
    return summary.foreclose;
  }

  // Helper method to get paid pending approval applications count
  static async getPaidPendingApprovalApplications(
    emiMonth: string, 
    filters?: Partial<FilterState>
  ): Promise<number> {
    const summary = await this.getSummaryStatus(emiMonth, filters);
    return summary.paid_pending_approval;
  }

  // Helper method to get paid rejected applications count
  static async getPaidRejectedApplications(
    emiMonth: string, 
    filters?: Partial<FilterState>
  ): Promise<number> {
    const summary = await this.getSummaryStatus(emiMonth, filters);
    return summary.paid_rejected;
  }

  // Helper method to get collection metrics
  static async getCollectionMetrics(
    emiMonth: string, 
    filters?: Partial<FilterState>
  ): Promise<{
    total: number;
    future: number;
    overdue: number;
    partiallyPaid: number;
    paid: number;
    foreclose: number;
    paidPendingApproval: number;
    paidRejected: number;
  }> {
    const summary = await this.getSummaryStatus(emiMonth, filters);
    
    return {
      total: summary.total,
      future: summary.future,
      overdue: summary.overdue,
      partiallyPaid: summary.partially_paid,
      paid: summary.paid,
      foreclose: summary.foreclose,
      paidPendingApproval: summary.paid_pending_approval,
      paidRejected: summary.paid_rejected,
    };
  }
}
