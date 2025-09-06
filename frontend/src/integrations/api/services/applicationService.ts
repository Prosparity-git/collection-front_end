import { API_BASE_URL, getAuthHeaders } from '../client';
import { getCurrentEmiMonth } from '@/utils/formatters';

// Types for application data
export interface ApplicationFilterParams {
  emi_month?: string;
  search?: string;
  branch?: string;
  dealer?: string;
  lender?: string;
  status?: string;
  rm_name?: string;
  tl_name?: string;
  ptp_date_filter?: string;
  offset?: number;
  limit?: number;
}

export interface ApplicationItem {
  application_id: string;
  loan_id?: number; // Added loan_id field
  applicant_name: string;
  emi_amount: number;
  status: string;
  emi_month: string;
  branch: string;
  rm_name: string;
  tl_name: string;
  dealer: string;
  lender: string | null;
  ptp_date: string | null;
  calling_status: string | null;
  calling_statuses?: {
    applicant?: string;
    co_applicant?: string;
    guarantor?: string;
    reference?: string;
  };
  comments: string[];
}

export interface FilteredApplicationsResponse {
  total: number;
  results: ApplicationItem[];
}

// Application Service
export class ApplicationService {
  // GET /api/v1/applications/ - Get filtered applications
  static async getFilteredApplications(params: ApplicationFilterParams): Promise<FilteredApplicationsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.emi_month) queryParams.append('emi_month', params.emi_month);
    if (params.search) queryParams.append('search', params.search);
    if (params.branch) queryParams.append('branch', params.branch);
    if (params.dealer) queryParams.append('dealer', params.dealer);
    if (params.lender) queryParams.append('lender', params.lender);
    if (params.status) queryParams.append('status', params.status);
    if (params.rm_name) queryParams.append('rm_name', params.rm_name);
    if (params.tl_name) queryParams.append('tl_name', params.tl_name);
    if (params.ptp_date_filter) queryParams.append('ptp_date_filter', params.ptp_date_filter);
    if (params.offset !== undefined) queryParams.append('offset', params.offset.toString());
    if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${API_BASE_URL}/applications/?${queryParams.toString()}`, {
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch filtered applications: ${response.status}`);
    }
    
    return await response.json();
  }

  // GET /api/v1/applications/ - Get applications with basic filters
  static async getApplications(
    emiMonth: string = getCurrentEmiMonth(),
    search: string = "",
    offset: number = 0,
    limit: number = 20
  ): Promise<{ total: number; applications: ApplicationItem[] }> {
    const params: ApplicationFilterParams = {
      emi_month: emiMonth,
      search,
      offset,
      limit
    };
    
    const data = await this.getFilteredApplications(params);
    return {
      total: data.total,
      applications: data.results
    };
  }

  // GET /api/v1/applications/ - Get all applications for a month
  static async getAllApplications(emiMonth: string = getCurrentEmiMonth()): Promise<ApplicationItem[]> {
    const params: ApplicationFilterParams = {
      emi_month: emiMonth,
      offset: 0,
      limit: 1000
    };
    
    const data = await this.getFilteredApplications(params);
    return data.results;
  }

  // GET /api/v1/applications/ - Get single application details
  static async getApplicationDetails(applicationId: string, emiMonth: string = getCurrentEmiMonth()): Promise<ApplicationItem> {
    const params: ApplicationFilterParams = {
      emi_month: emiMonth,
      search: applicationId,
      offset: 0,
      limit: 1
    };
    
    const data = await this.getFilteredApplications(params);
    
    if (data.results && data.results.length > 0) {
      return data.results[0];
    } else {
      throw new Error("Application not found");
    }
  }

  // GET /api/v1/applications/ - Get application details by loan_id and month
  static async getApplicationByLoanAndMonth(loanId: number, emiMonth: string): Promise<ApplicationItem | null> {
    try {
      const params: ApplicationFilterParams = {
        emi_month: emiMonth,
        offset: 0,
        limit: 1000 // Get all applications for the month to find by loan_id
      };
      
      const data = await this.getFilteredApplications(params);
      
      // Find the application with matching loan_id
      const application = data.results.find(app => app.loan_id === loanId);
      
      if (application) {
        console.log('✅ Found application for loan_id:', loanId, 'and month:', emiMonth);
        return application;
      } else {
        console.log('⚠️ No application found for loan_id:', loanId, 'and month:', emiMonth);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching application by loan_id and month:', error);
      return null;
    }
  }
}
