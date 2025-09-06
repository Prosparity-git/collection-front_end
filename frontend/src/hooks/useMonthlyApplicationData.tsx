import { useState, useEffect, useCallback } from 'react';
import { client } from '@/integrations/api/client';
import { formatEmiMonth } from '@/utils/formatters';
import { FiltersService } from '@/integrations/api/services';

export const useMonthlyApplicationData = (applicantId?: string) => {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [availableMonthsFormatted, setAvailableMonthsFormatted] = useState<string[]>([]);

  const fetchMonthlyData = useCallback(async () => {
    if (!applicantId) {
      setMonthlyData([]);
      setAvailableMonths([]);
      setAvailableMonthsFormatted([]);
      return;
    }
    setLoading(true);
    try {
      console.log('📅 Fetching loan-specific months for applicant:', applicantId);
      
      // Step 1: Get the loan_application_id from loan_details table using applicant_id
      const { data: loanData, error: loanError } = await client
        .from('loan_details')
        .select('loan_application_id')
        .eq('applicant_id', applicantId)
        .maybeSingle();
      
      if (loanError) {
        console.error('Error fetching loan details:', loanError);
        return;
      }
      
      if (!loanData) {
        console.warn('No loan found for applicant:', applicantId);
        setAvailableMonths([]);
        setAvailableMonthsFormatted([]);
        setMonthlyData([]);
        return;
      }
      
      const loanApplicationId = loanData.loan_application_id;
      console.log('📅 Found loan_application_id:', loanApplicationId, 'for applicant:', applicantId);
      
      // Step 2: Get all payment details for this specific loan with repayment status
      const { data: paymentData, error: paymentError } = await client
        .from('payment_details')
        .select(`
          id, 
          demand_month, 
          demand_year, 
          demand_date, 
          demand_amount, 
          amount_collected, 
          ptp_date, 
          demand_num, 
          fees, 
          fees_status, 
          payment_date, 
          mode, 
          payment_information,
          repayment_status_id,
          repayment_status(repayment_status)
        `)
        .eq('loan_application_id', loanApplicationId)
        .order('demand_year', { ascending: true })
        .order('demand_month', { ascending: true });
      
      if (paymentError) {
        console.error('Error fetching payment details:', paymentError);
        return;
      }
      
      if (!paymentData || paymentData.length === 0) {
        console.warn('No payment details found for loan_application_id:', loanApplicationId);
        setAvailableMonths([]);
        setAvailableMonthsFormatted([]);
        setMonthlyData([]);
        return;
      }
      
      console.log('📅 Found payment details:', paymentData);
      
      // Step 3: Convert demand_month and demand_year to formatted dates
      const monthMap = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      let months: string[] = [];
      
      if (paymentData[0].demand_date) {
        // If demand_date is available, use it directly
        months = paymentData.map(payment => payment.demand_date);
        console.log('📅 Using demand_date from payment_details:', months);
      } else {
        // If no demand_date, construct from demand_month and demand_year
        months = paymentData.map(payment => {
          const monthName = monthMap[payment.demand_month];
          const year = payment.demand_year.toString().slice(-2); // Get last 2 digits
          return `${monthName}-${year}`;
        });
        console.log('📅 Constructed months from demand_month/demand_year:', months);
      }
      
      // Remove duplicates and sort
      const uniqueMonths = [...new Set(months)].sort();
      
      // Set the available months
      setAvailableMonths(uniqueMonths);
      
      // Format months for display (if they're not already formatted)
      const monthsFormatted = uniqueMonths.map(month => {
        // If month is already in "Aug-25" format, use it as is
        if (month.includes('-') && month.length === 6) {
          return month;
        }
        // Otherwise format it
        return formatEmiMonth(month);
      });
      setAvailableMonthsFormatted(monthsFormatted);
      
      // Set monthly data to payment details for later use
      setMonthlyData(paymentData);
      
      console.log('✅ Loan-specific monthly data updated:', { 
        applicantId, 
        loanApplicationId, 
        uniqueMonths, 
        monthsFormatted,
        paymentDetailsCount: paymentData.length 
      });
      
    } catch (error) {
      console.error('Error in fetchMonthlyData:', error);
    } finally {
      setLoading(false);
    }
  }, [applicantId]);

  const getApplicationForMonth = useCallback((month: string): any => {
    const monthData = monthlyData.find(item => item.demand_date === month);
    if (monthData) {
      return {
        ...monthData,
        amount_collected: monthData.amount_collected || null
      };
    }
    return null;
  }, [monthlyData]);

  useEffect(() => {
    fetchMonthlyData();
  }, [fetchMonthlyData]);

  return {
    monthlyData,
    availableMonths,
    availableMonthsFormatted,
    loading,
    getApplicationForMonth,
    refetch: fetchMonthlyData
  };
}; 