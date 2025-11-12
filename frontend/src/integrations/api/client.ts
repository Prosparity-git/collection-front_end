import { toast } from "@/hooks/use-toast";
import { formatEmiMonth, getCurrentEmiMonth } from '@/utils/formatters';

// Export the API base URL for use in services
export const API_BASE_URL = "http://127.0.0.1:8000/api/v1"; 


//export const API_BASE_URL = import.meta.env.VITE_API_URL + "/api/v1";

//export const API_BASE_URL = import.meta.env.VITE_API_URL + "/api/v1";

// API Response wrapper for consistent error handling
export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Get authentication headers
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
}

// Utility function to handle API responses
export async function handleApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (response.ok) {
    try {
      const data = await response.json();
      return {
        data,
        error: null,
        success: true
      };
    } catch (error) {
      return {
        data: null,
        error: 'Failed to parse response',
        success: false
      };
    }
  } else {
    let errorMessage = `HTTP ${response.status}`;
    try {
      const errorData = await response.json();
      // Handle different error response formats
      if (errorData.detail) {
        // If detail is an array (validation errors), join them
        if (Array.isArray(errorData.detail)) {
          errorMessage = errorData.detail.map((err: any) => err.msg || err).join('; ');
        } else {
          errorMessage = errorData.detail;
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch {
      errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    }
    
    return {
      data: null,
      error: errorMessage,
      success: false
    };
  }
}

// Utility function to make API requests with error handling
export async function apiRequest<T>(
  url: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: getAuthHeaders(),
      ...options,
    });
    
    return await handleApiResponse<T>(response);
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Network error',
      success: false
    };
  }
}

// Legacy interfaces for backward compatibility
interface ApiApplicationItem {
  application_id: string;
  loan_id?: number; // Added loan_id field
  payment_id?: number; // Added payment_id field
  demand_num?: string; // Added demand_num field
  applicant_name: string;
  mobile?: string; // Added mobile field from API response
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
  comments: string[];
  calling_statuses?: {
    applicant?: string;
    co_applicant?: string;
    guarantor?: string;
    reference?: string;
  };
  // Additional fields from API response
  amount_collected?: number;
  payment_mode?: string;
  loan_amount?: number;
  disbursement_date?: string;
  house_ownership?: string;
  demand_calling_status?: string;
  latitude?: number; // Latitude coordinate from API response
  longitude?: number; // Longitude coordinate from API response
  address?: string; // Address from API response
  vehicle_status_name?: string; // Vehicle status name from API response
  repossession_date?: string; // Vehicle repossession date
  repossession_sale_date?: string; // Vehicle repossession sale date
  repossession_sale_amount?: number; // Vehicle repossession sale amount
  current_dpd_bucket?: string | null; // Current DPD bucket
  total_overdue_amount?: number; // Total overdue amount from backend
  current_overdue_amount?: number; // Current overdue amount from backend
  total_pos?: number; // Total POS from backend
  nach_status?: number; // NACH status (1 = success, 2+ = failure)
  reason?: string | null; // Reason for NACH failure
}

interface ApiFilteredResponse {
  total: number;
  results: ApiApplicationItem[];
}

export function mapApiResponseToApplication(apiItem: ApiApplicationItem): any {
  return {
    id: apiItem.application_id,
    applicant_id: apiItem.application_id,
    loan_id: apiItem.loan_id, // Map loan_id from API response
    payment_id: apiItem.payment_id, // Map payment_id from API response
    demand_num: apiItem.demand_num, // Map demand_num from API response
    applicant_name: apiItem.applicant_name,
    branch_name: apiItem.branch,
    team_lead: apiItem.tl_name,
    tl_name: apiItem.tl_name,
    rm_name: apiItem.rm_name,
    dealer_name: apiItem.dealer,
    lender_name: apiItem.lender,
    lms_status: apiItem.status || 'Unknown',
    field_status: apiItem.status,
    status: apiItem.status, 
    emi_amount: apiItem.emi_amount,
    principle_due: 0, 
    interest_due: 0, 
    demand_date: apiItem.emi_month,
    emi_month: apiItem.emi_month, 
    user_id: '1', // Default value
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ptp_date: apiItem.ptp_date,
    latest_calling_status: apiItem.calling_status || 'Not Called',
    calling_status: apiItem.calling_status || 'Not Called', 
    recent_comments: (apiItem.comments || []).map((comment: string) => ({
      content: comment,
      user_name: 'Unknown'
    })),
    comments: apiItem.comments || [], 
    applicant_mobile: apiItem.mobile || '',
    applicant_address: '',
    co_applicant_name: '',
    co_applicant_mobile: '',
    co_applicant_address: '',
    guarantor_name: '',
    guarantor_mobile: '',
    guarantor_address: '',
    reference_name: '',
    reference_mobile: '',
    reference_address: '',
    fi_location: '',
    repayment: '',
    last_month_bounce: 0,
    collection_rm: '',
    paid_date: '',
    // Map calling statuses from the API response
    applicant_calling_status: apiItem.calling_statuses?.applicant || 'Not Called',
    co_applicant_calling_status: apiItem.calling_statuses?.co_applicant || 'Not Called',
    guarantor_calling_status: apiItem.calling_statuses?.guarantor || 'Not Called',
    reference_calling_status: apiItem.calling_statuses?.reference || 'Not Called',
    disbursement_date: apiItem.disbursement_date || '',
    loan_amount: apiItem.loan_amount || 0,
    vehicle_status: apiItem.vehicle_status_name || '',
    amount_collected: apiItem.amount_collected || 0,
    // Map additional fields from API response
    payment_mode: apiItem.payment_mode || '',
    calling_statuses: apiItem.calling_statuses || {},
    house_ownership: apiItem.house_ownership || '',
    demand_calling_status: apiItem.demand_calling_status || '',
    latitude: apiItem.latitude,
    longitude: apiItem.longitude,
    address: apiItem.address,
    repossession_date: apiItem.repossession_date || null,
    repossession_sale_date: apiItem.repossession_sale_date || null,
    repossession_sale_amount: apiItem.repossession_sale_amount || null,
    current_dpd_bucket: (apiItem as any).current_dpd_bucket ?? null,
    total_overdue_amount: (apiItem as any).total_overdue_amount ?? null,
    current_overdue_amount: (apiItem as any).current_overdue_amount ?? null,
    total_pos: (apiItem as any).total_pos ?? null,
    nach_status: apiItem.nach_status !== undefined && apiItem.nach_status !== null 
      ? (typeof apiItem.nach_status === 'string' ? parseInt(apiItem.nach_status, 10) : apiItem.nach_status)
      : undefined,
    reason: apiItem.reason ?? null
  };
}

// Legacy functions for backward compatibility
export async function getApplicationDetails(applicationId: string, emiMonth: string = getCurrentEmiMonth()): Promise<any> {
  const params = new URLSearchParams({
    emi_month: emiMonth,
    search: applicationId,
    offset: "0",
    limit: "1"
  });

  const res = await fetch(`${API_BASE_URL}/applications/?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch application details");

  const data: ApiFilteredResponse = await res.json();
  if (data.results && data.results.length > 0) {
    return mapApiResponseToApplication(data.results[0]);
  } else {
    throw new Error("Application not found");
  }
}

export async function getFilteredApplications(
  emiMonth: string = getCurrentEmiMonth(),
  search: string = "",
  offset: number = 0,
  limit: number = 1000
): Promise<{ total: number; applications: any[] }> {
  const params = new URLSearchParams({
    emi_month: emiMonth,
    search: search,
    offset: offset.toString(),
    limit: limit.toString()
  });

  const res = await fetch(`${API_BASE_URL}/applications/?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch applications");

  const data: ApiFilteredResponse = await res.json();
  return {
    total: data.total,
    applications: data.results.map(mapApiResponseToApplication)
  };
}

export async function getApplicationsList(emiMonth: string = getCurrentEmiMonth()): Promise<any[]> {
  const params = new URLSearchParams({
    emi_month: emiMonth,
    offset: "0",
    limit: "20"
  });

  const res = await fetch(`${API_BASE_URL}/applications/?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch applications list");

  const data: ApiFilteredResponse = await res.json();
  return data.results.map(mapApiResponseToApplication);
}

export async function getCollectionsSummary(emiMonth: string, filters?: any) {
  // Import SummaryService dynamically to avoid circular dependencies
  const { SummaryService } = await import('./services/summaryService');
  return SummaryService.getSummaryStatus(emiMonth, filters);
}

export async function getFilterOptions() {
  const res = await fetch(`${API_BASE_URL}/filters/options`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch filter options");
  return res.json();
}

export async function getApplicationsFromBackend(
  emiMonth: string, 
  offset = 0, 
  limit = 20,
  additionalFilters: {
    branch?: string[];
    teamLead?: string[];
    rm?: string[];
    sourceTeamLead?: string[];
    sourceRm?: string[];
    dealer?: string[];
    lender?: string[];
    status?: string[];
    repayment?: string[];
    lastMonthBounce?: string[];
    ptpDate?: string[];
    vehicleStatus?: string[];
    search?: string;
  } = {}
) {
  const params = new URLSearchParams();
  if (emiMonth) params.append('emi_month', emiMonth);
  params.append('offset', offset.toString());
  params.append('limit', limit.toString());

  if (additionalFilters.search) {
    params.append('search', additionalFilters.search);
  }
  if (additionalFilters.branch && additionalFilters.branch.length > 0) {
    params.append('branch', additionalFilters.branch.join(','));
  }
  if (additionalFilters.teamLead && additionalFilters.teamLead.length > 0) {
    params.append('tl_name', additionalFilters.teamLead.join(','));
  }
  if (additionalFilters.rm && additionalFilters.rm.length > 0) {
    params.append('rm_name', additionalFilters.rm.join(','));
  }
  if (additionalFilters.sourceTeamLead && additionalFilters.sourceTeamLead.length > 0) {
    params.append('source_tl_name', additionalFilters.sourceTeamLead.join(','));
  }
  if (additionalFilters.sourceRm && additionalFilters.sourceRm.length > 0) {
    params.append('source_rm_name', additionalFilters.sourceRm.join(','));
  }
  if (additionalFilters.dealer && additionalFilters.dealer.length > 0) {
    params.append('dealer', additionalFilters.dealer.join(','));
  }
  if (additionalFilters.lender && additionalFilters.lender.length > 0) {
    params.append('lender', additionalFilters.lender.join(','));
  }
  if (additionalFilters.status && additionalFilters.status.length > 0) {
    params.append('status', additionalFilters.status.join(','));
  }
  if (additionalFilters.repayment && additionalFilters.repayment.length > 0) {
    params.append('demand_num', additionalFilters.repayment.join(','));
  }
  if (additionalFilters.ptpDate && additionalFilters.ptpDate.length > 0) {
    params.append('ptp_date_filter', additionalFilters.ptpDate.join(','));
  }
  if (additionalFilters.vehicleStatus && additionalFilters.vehicleStatus.length > 0) {
    params.append('vehicle_status', additionalFilters.vehicleStatus.join(','));
  }
  if ((additionalFilters as any).dpdBucket && (additionalFilters as any).dpdBucket.length > 0) {
    params.append('current_dpd_bucket', (additionalFilters as any).dpdBucket.join(','));
  }

  const response = await fetch(`${API_BASE_URL}/applications/?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch applications');
  
  console.log('🌐 API Request URL:', `${API_BASE_URL}/applications/?${params.toString()}`);
  console.log('🌐 API Response status:', response.status);
  console.log('🌐 EMI Month being sent:', emiMonth);
  console.log('🌐 Repayment filters being sent:', additionalFilters.repayment);
  console.log('🌐 PTP Date filters being sent:', additionalFilters.ptpDate);
  
  return await response.json();
}

export async function getPendingApprovals() {
  const response = await fetch(`${API_BASE_URL}/paidpending-approval/`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch pending approvals');
  const data = await response.json();
  // Return the full response structure
  return data;
}

export async function reviewPendingApproval(requestId: string, payload: any) {
  const response = await fetch(`${API_BASE_URL}/paidpending-approval/${requestId}/review`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error('Failed to review request');
  return await response.json();
}

// Mock client for backward compatibility - this maintains compatibility with existing components
type MockResult<T = any> = { data: T | null | any[]; error: null; count?: number };

class MockQueryBuilder<T = any> implements PromiseLike<MockResult<T>> {
  private _single: boolean = false;
  private _maybeSingle: boolean = false;
  private _selectFields: string[] = [];
  private _whereConditions: Array<{ field: string; operator: string; value: any }> = [];
  private _orderBy: { field: string; ascending: boolean } | null = null;
  private _limitValue: number | null = null;
  private _table: string = '';
  private _operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private _data: any = null;

  from(table: string) {
    this._table = table;
    return this;
  }

  select(...fields: string[]) {
    this._selectFields = fields.length > 0 ? fields : ['*'];
    this._operation = 'select';
    return this;
  }

  insert(data: any) {
    this._data = data;
    this._operation = 'insert';
    return this;
  }

  update(data: any) {
    this._data = data;
    this._operation = 'update';
    return this;
  }

  upsert(data: any) {
    this._data = data;
    this._operation = 'upsert';
    return this;
  }

  delete() {
    this._operation = 'delete';
    return this;
  }

  eq(field: string, value: any) {
    this._whereConditions.push({ field, operator: 'eq', value });
    return this;
  }

  in(field: string, value: any[]) {
    this._whereConditions.push({ field, operator: 'in', value });
    return this;
  }

  gte(field: string, value: any) {
    this._whereConditions.push({ field, operator: 'gte', value });
    return this;
  }

  lte(field: string, value: any) {
    this._whereConditions.push({ field, operator: 'lte', value });
    return this;
  }

  order(field: string, options: { ascending: boolean }) {
    this._orderBy = { field, ascending: options.ascending };
    return this;
  }

  limit(value: number) {
    this._limitValue = value;
    return this;
  }

  single() { 
    this._single = true; 
    return this; 
  }

  maybeSingle() { 
    this._maybeSingle = true; 
    return this; 
  }
  
  then<TResult1 = MockResult<T>, TResult2 = never>(
    onfulfilled?: ((value: MockResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    _onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    // Simulate a successful response with mock data
    let result: MockResult<T>;

    // For select operations, return mock data based on the table
    if (this._operation === 'select') {
      if (this._table === 'field_status') {
        if (this._single || this._maybeSingle) {
          result = {
            data: { status: '1', calling_status: '1' } as T,
            error: null,
            count: 1
          };
        } else {
          result = {
            data: [{ status: '1', calling_status: '1' }] as T,
            error: null,
            count: 1
          };
        }
      } else if (this._table === 'payment_details') {
        if (this._single || this._maybeSingle) {
          result = {
            data: { amount_collected: '1000' } as T,
            error: null,
            count: 1
          };
        } else {
          result = {
            data: [{ amount_collected: '1000' }] as T,
            error: null,
            count: 1
          };
        }
      } else {
        if (this._single || this._maybeSingle) {
          result = {
            data: {} as T,
            error: null,
            count: 0
          };
        } else {
          result = {
            data: [] as T,
            error: null,
            count: 0
          };
        }
      }
    } else {
      result = {
        data: this._single || this._maybeSingle ? null : [] as T,
        error: null,
        count: 0
      };
    }

    const fulfilled = onfulfilled ?? ((v: any) => v as TResult1);
    const out = fulfilled(result) as any;
    
    // Wrap in a tiny thenable
    return {
      then: (res: any) => {
        const next = res ? res(out) : out;
        return { then: (r: any) => (r ? r(next) : next) } as any;
      }
    } as any;
  }
}

export const client = {
  from<T = any>(_table: string) {
    return new MockQueryBuilder<T>();
  },
  auth: {
    signOut: async () => ({ error: null }),
    signUp: async (_args: any) => ({ data: { user: { id: 'user1', email: _args?.email } }, error: null }),
    admin: {
      createUser: async (_args: any) => ({ data: { user: { id: 'user1', email: _args?.email } }, error: null })
    }
  },
  functions: {
    invoke: async (_fn: string, _args?: any) => ({
      data: { successful: 1, failed: 0, errors: [] },
      error: null
    })
  },
  channel: (_name: string) => ({
    on: () => ({ subscribe: () => ({}) }),
    subscribe: () => ({}),
    unsubscribe: () => ({})
  }),
  removeChannel: (_chan: any) => {}
};