import { API_BASE_URL, getAuthHeaders } from '../client';

// Types for paid pending data
export interface PaidPendingApplication {
  loan_id: number;
  applicant_id: number;
  applicant_name: string;
  current_status: string;
  amount_collected: number;
  ptp_date: string | null;
  demand_date: string | null;
  demand_amount: number;
  payment_date: string | null;
  updated_at: string | null;
}

export interface PaidPendingApplicationsResponse {
  total_applications: number;
  status: string;
  applications: PaidPendingApplication[];
}

export interface PaidPendingApprovalRequest {
  loan_id: number;
  action: 'approve' | 'reject';
  reason?: string;
  user_id: string;
}

export interface PaidPendingApprovalResponse {
  success: boolean;
  message: string;
  new_status: string;
  loan_id: number;
}

// Paid Pending Service
export class PaidPendingService {
  // GET /api/v1/paidpending-approval/ - Get all paid pending applications
  static async getPaidPendingApplications(): Promise<PaidPendingApplicationsResponse> {
    const response = await fetch(`${API_BASE_URL}/paidpending-approval/`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch paid pending applications: ${response.status}`);
    }

    return await response.json();
  }

  // GET /api/v1/paidpending-approval/{loan_id} - Get specific application status
  static async getPaidPendingApplicationStatus(loanId: string): Promise<{
    loan_id: number;
    applicant_id: number | null;
    applicant_name: string;
    current_status: string;
    status_id: number | null;
    is_paid_pending: boolean;
    amount_collected: number;
    ptp_date: string | null;
    demand_date: string | null;
    demand_amount: number;
    payment_date: string | null;
    updated_at: string | null;
  }> {
    const response = await fetch(`${API_BASE_URL}/paidpending-approval/${loanId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch application status: ${response.status}`);
    }

    return await response.json();
  }

  // POST /api/v1/paidpending-approval/approve - Approve or reject paid pending
  static async approveRejectPaidPending(
    approvalData: PaidPendingApprovalRequest
  ): Promise<PaidPendingApprovalResponse> {
    const response = await fetch(`${API_BASE_URL}/paidpending-approval/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(approvalData),
    });

    if (!response.ok) {
      throw new Error(`Failed to process approval: ${response.status}`);
    }

    return await response.json();
  }

  // GET /api/v1/paidpending-applications/ - Get paid pending applications list
  static async getPaidPendingApplicationsList(
    skip: number = 0,
    limit: number = 100
  ): Promise<{
    total: number;
    results: any[];
  }> {
    const queryParams = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(
      `${API_BASE_URL}/paidpending-applications/?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch paid pending applications list: ${response.status}`);
    }

    return await response.json();
  }

  // Helper method to check if an application is in paid pending status
  static async isApplicationPaidPending(loanId: string): Promise<boolean> {
    try {
      const status = await this.getPaidPendingApplicationStatus(loanId);
      return status.is_paid_pending;
    } catch (error) {
      return false;
    }
  }

  // Helper method to get applications that need approval
  static async getApplicationsNeedingApproval(): Promise<PaidPendingApplication[]> {
    const response = await this.getPaidPendingApplications();
    return response.applications;
  }
}
