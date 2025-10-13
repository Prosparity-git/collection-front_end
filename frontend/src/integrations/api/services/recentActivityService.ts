import { API_BASE_URL, getAuthHeaders } from '../client';

// Types for recent activity data
export interface RecentActivityItem {
  id: number;
  activity_type: 'Status' | 'Calling Status' | 'PTP Date' | 'Amount Collected';
  from_value: string | null;
  to_value: string | null;
  changed_by: string;
  timestamp: string;
  loan_id: number | null;
  repayment_id: number | null;
}

export interface RecentActivityResponse {
  activities: RecentActivityItem[];
  total_count: number;
}

export interface RecentActivityParams {
  loan_id?: number;
  repayment_id?: number;
  limit?: number;
  days_back?: number;
}

// Recent Activity Service
export class RecentActivityService {
  // GET /api/v1/recent-activity/ - Get recent activity for all loans or filtered
  static async getRecentActivity(params: RecentActivityParams = {}): Promise<RecentActivityResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.loan_id) {
      queryParams.append('loan_id', params.loan_id.toString());
    }
    if (params.repayment_id) {
      queryParams.append('repayment_id', params.repayment_id.toString());
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.days_back) {
      queryParams.append('days_back', params.days_back.toString());
    }

    const url = `${API_BASE_URL}/recent-activity/?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Failed to fetch recent activity:', response.status, errorData);
      throw new Error(`Failed to fetch recent activity: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('📥 Recent activity response:', data);
    return data;
  }

  // GET /api/v1/recent-activity/ - Get recent activity for a specific loan
  static async getLoanRecentActivity(
    loanId: number,
    params: Omit<RecentActivityParams, 'loan_id'> = {}
  ): Promise<RecentActivityResponse> {
    const queryParams = new URLSearchParams();
    
    // Add loan_id as query parameter (not in path)
    queryParams.append('loan_id', loanId.toString());
    
    if (params.repayment_id) {
      queryParams.append('repayment_id', params.repayment_id.toString());
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params.days_back) {
      queryParams.append('days_back', params.days_back.toString());
    }

    const url = `${API_BASE_URL}/recent-activity/?${queryParams.toString()}`;
    
    console.log('🌐 RecentActivityService: Making API call to:', url);
    console.log('🌐 RecentActivityService: Query parameters:', Object.fromEntries(queryParams.entries()));
    
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ RecentActivityService: Failed to fetch loan recent activity:', response.status, errorData);
      throw new Error(`Failed to fetch loan recent activity: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('📥 RecentActivityService: Loan recent activity response:', data);
    console.log('📥 RecentActivityService: Activities count:', data.activities?.length || 0);
    return data;
  }
}
