import { API_BASE_URL, getAuthHeaders } from '../client';

export interface DelayCalculationResult {
  payment_id: number;
  loan_id: number;
  demand_num: number;
  demand_date: string;
  payment_date: string | null;
  delay_days: number;
  overdue_amount: number;
}

export interface DelayCalculationResponse {
  loan_id: number;
  total_repayments: number;
  results: DelayCalculationResult[];
}

export class DelayCalculationService {
  /**
   * Calculate delay days for repayments of a given loan up to current month
   * @param loanId - The loan ID to calculate delays for
   * @returns Promise<DelayCalculationResponse>
   */
  static async getDelayCalculations(loanId: number): Promise<DelayCalculationResponse> {
    const url = `${API_BASE_URL}/delay-calculation/${loanId}`;
    
    console.log('🌐 DelayCalculationService: Making API call to:', url);
    
    const response = await authenticatedFetch(url, {
      method: 'GET',
      ,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ DelayCalculationService: Failed to fetch delay calculations:', response.status, errorData);
      throw new Error(`Failed to fetch delay calculations: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log('📥 DelayCalculationService: Delay calculations response:', data);
    return data;
  }
}
