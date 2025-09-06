import { API_BASE_URL, getAuthHeaders } from '../client';

export interface MonthOption {
  month: string; // Format: "Jan-25"
  repayment_id: string; // The payment details ID for this month
  demand_date: string; // Full date in YYYY-MM-DD format
  is_current: boolean; // Whether this is the current month
}

export interface MonthDropdownResponse {
  loan_id: string;
  total_months: number;
  current_month: string; // Current selected month
  months: MonthOption[];
  message: string;
}

// Month Dropdown Service
export class MonthDropdownService {
  // GET /api/v1/month-dropdown/{loan_id}/months - Get all available months for a loan
  static async getMonthDropdownOptions(
    loanId: number
  ): Promise<MonthDropdownResponse | null> {
    try {
      console.log('📅 Fetching month dropdown options for loan_id:', loanId);
      
      const response = await fetch(`${API_BASE_URL}/month-dropdown/${loanId}/months`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        console.error('❌ Failed to fetch month dropdown options:', response.status, response.statusText);
        return null;
      }
      
      const data: MonthDropdownResponse = await response.json();
      console.log('✅ Month dropdown options fetched:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Error fetching month dropdown options:', error);
      return null;
    }
  }
}
