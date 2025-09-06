import { API_BASE_URL, getAuthHeaders } from '../client';

// Types for payment details data
export interface PaymentDetail {
  id: number; // This is the repayment_id
  loan_application_id: number; // This is the loan_id
  demand_amount: number;
  principal_amount: number;
  interest: number;
  demand_date: string;
  demand_month: number;
  demand_year: number;
  demand_num: number;
  amount_collected: number;
  fees: number;
  fees_status: string;
}

export interface PaymentDetailsResponse {
  total: number;
  results: PaymentDetail[];
}

// Payment Details Service
export class PaymentDetailsService {
  // GET /api/v1/payment-details/by_loan_and_month - Get payment details by loan_id and emi_month
  static async getPaymentDetailsByLoanAndMonth(
    loanId: number,
    emiMonth: string
  ): Promise<PaymentDetail | null> {
    try {
      // Parse emi_month (e.g., "Aug-25" -> month: 8, year: 2025)
      const monthMap: { [key: string]: number } = {
        'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
        'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
      };
      
      const [monthStr, yearStr] = emiMonth.split('-');
      const month = monthMap[monthStr];
      const year = parseInt(`20${yearStr}`);
      
      if (!month || !year) {
        throw new Error(`Invalid emi_month format: ${emiMonth}. Expected format: "Aug-25"`);
      }

      console.log('🔍 Looking for payment details:', { loanId, month, year, emiMonth });

      // First try the specific endpoint
      try {
        // Build query parameters
        const params = new URLSearchParams({
          loan_id: loanId.toString(),
          month: month.toString(),
          year: year.toString()
        });

        const response = await fetch(`${API_BASE_URL}/payment-details/by_loan_and_month?${params.toString()}`, {
          headers: getAuthHeaders()
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Payment details found via specific endpoint:', data);
          return data;
        } else {
          console.log('⚠️ Specific endpoint not available, trying alternative approach...');
        }
      } catch (specificError) {
        console.log('⚠️ Specific endpoint failed, trying alternative approach:', specificError.message);
      }

      // Alternative approach: Get all payment details for the loan and filter
      console.log('🔄 Fetching all payment details for loan_id:', loanId);
      const allPaymentDetails = await this.getPaymentDetailsByLoan(loanId);
      
      // Filter by month and year
      const matchingPayment = allPaymentDetails.results.find(payment => 
        payment.demand_month === month && payment.demand_year === year
      );

      if (matchingPayment) {
        console.log('✅ Payment details found via filtering:', matchingPayment);
        return matchingPayment;
      } else {
        console.log('❌ No matching payment details found for month:', month, 'year:', year);
        return null;
      }
      
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw error;
    }
  }

  // GET /api/v1/payment-details/{id} - Get specific payment detail by ID
  static async getPaymentDetailById(id: number): Promise<PaymentDetail> {
    const response = await fetch(`${API_BASE_URL}/payment-details/${id}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payment detail: ${response.status}`);
    }

    return await response.json();
  }

  // GET /api/v1/payment-details/loan/{loan_id} - Get all payment details for a loan
  static async getPaymentDetailsByLoan(loanId: number): Promise<PaymentDetailsResponse> {
    const response = await fetch(`${API_BASE_URL}/payment-details/loan/${loanId}`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch payment details for loan: ${response.status}`);
    }

    return await response.json();
  }
}
