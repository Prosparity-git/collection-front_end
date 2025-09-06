import { useState, useEffect, useCallback } from 'react';
import { MonthDropdownService, MonthDropdownResponse, MonthOption } from '@/integrations/api/services/monthDropdownService';
import { ApplicationService, ApplicationItem } from '@/integrations/api/services/applicationService';
import { Application } from '@/types/application';

export interface MonthDropdownData {
  months: MonthOption[];
  currentMonth: string;
  totalMonths: number;
  loading: boolean;
  error: string | null;
}

export const useMonthDropdown = (loanId?: number, currentApplicationPaymentId?: number) => {
  const [monthData, setMonthData] = useState<MonthDropdownData>({
    months: [],
    currentMonth: '',
    totalMonths: 0,
    loading: false,
    error: null
  });

  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [currentApplication, setCurrentApplication] = useState<Application | null>(null);

  // Fetch month dropdown options
  const fetchMonthOptions = useCallback(async () => {
    if (!loanId) {
      setMonthData(prev => ({ ...prev, months: [], currentMonth: '', totalMonths: 0 }));
      return;
    }

    setMonthData(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await MonthDropdownService.getMonthDropdownOptions(loanId);
      
      if (response) {
        setMonthData({
          months: response.months,
          currentMonth: response.current_month,
          totalMonths: response.total_months,
          loading: false,
          error: null
        });

        // After months are populated, automatically set the month based on current application's repayment ID
        if (response.months.length > 0 && currentApplicationPaymentId) {
          console.log('🔄 useMonthDropdown: Months populated, looking for repayment_id match:', currentApplicationPaymentId);
          
          // Find the month option that matches the current application's repayment ID
          const matchingMonthOption = response.months.find(month => 
            month.repayment_id === currentApplicationPaymentId.toString()
          );
          
          if (matchingMonthOption) {
            console.log('✅ useMonthDropdown: Found matching month for repayment_id:', currentApplicationPaymentId, '->', matchingMonthOption.month);
            setSelectedMonth(matchingMonthOption.month);
          } else {
            console.log('⚠️ useMonthDropdown: No matching month found for repayment_id:', currentApplicationPaymentId, 'Available months:', response.months.map(m => ({ month: m.month, repayment_id: m.repayment_id })));
            // Fallback to first month if no match found
            setSelectedMonth(response.months[0].month);
          }
        } else if (response.months.length > 0) {
          // Set the first month as selected if no repayment_id match or no currentApplicationPaymentId
          setSelectedMonth(response.months[0].month);
        }
      } else {
        setMonthData(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'Failed to fetch month options' 
        }));
      }
    } catch (error) {
      console.error('Error fetching month options:', error);
      setMonthData(prev => ({ 
        ...prev, 
        loading: false, 
        error: 'Error fetching month options' 
      }));
    }
  }, [loanId, currentApplicationPaymentId]);

  // Fetch application details for a specific month
  const fetchApplicationForMonth = useCallback(async (month: string) => {
    if (!loanId || !month) return null;

    try {
      // Find the month option to get repayment_id
      const monthOption = monthData.months.find(m => m.month === month);
      if (!monthOption) {
        console.error('useMonthDropdown: Month option not found for:', month);
        return null;
      }

      // Fetch application details for this month using the ApplicationService
      const application = await ApplicationService.getApplicationByLoanAndMonth(loanId, month);
      
      if (application) {
        // Convert ApplicationItem to Application type if needed
        // For now, we'll return both the month option and application data
        const result = {
          monthOption,
          application
        };
        return result;
      } else {
        console.log('useMonthDropdown: No application found for month:', month);
        return null;
      }
    } catch (error) {
      console.error('useMonthDropdown: Error fetching application for month:', error);
      return null;
    }
  }, [loanId, monthData.months]);

  // Handle month selection
  const handleMonthChange = useCallback(async (month: string) => {
    console.log('useMonthDropdown: Month changed to:', month);
    setSelectedMonth(month);
    
    // Check if monthData.months is populated
    if (!monthData.months || monthData.months.length === 0) {
      console.log('useMonthDropdown: Fetching month options first');
      await fetchMonthOptions();
      
      // Wait a bit for the state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check again
      if (!monthData.months || monthData.months.length === 0) {
        console.log('useMonthDropdown: ❌ No month data available after fetch');
        return null;
      }
    }
    
    // Fetch application details for the new month
    const result = await fetchApplicationForMonth(month);
    if (result) {
      console.log('useMonthDropdown: ✅ Fetched result for month:', month, 'with repayment_id:', result.monthOption.repayment_id);
      
      // Store the current application data
      setCurrentApplication(result.application as any);
      
      // Return the result so the parent component can access monthOption data
      return result;
    } else {
      console.log('useMonthDropdown: ⚠️ No result returned for month:', month);
    }
    return null;
  }, [fetchApplicationForMonth, monthData.months, fetchMonthOptions]);

  // Initialize when loanId changes
  useEffect(() => {
    if (loanId) {
      fetchMonthOptions();
    }
  }, [loanId, fetchMonthOptions]);

  // Auto-select month when currentApplicationPaymentId changes (after months are already loaded)
  useEffect(() => {
    if (currentApplicationPaymentId && monthData.months.length > 0) {
      console.log('🔄 useMonthDropdown: currentApplicationPaymentId changed, looking for matching month:', currentApplicationPaymentId);
      
      // Find the month option that matches the current application's repayment ID
      const matchingMonthOption = monthData.months.find(month => 
        month.repayment_id === currentApplicationPaymentId.toString()
      );
      
      if (matchingMonthOption) {
        console.log('✅ useMonthDropdown: Auto-selecting month for repayment_id:', currentApplicationPaymentId, '->', matchingMonthOption.month);
        setSelectedMonth(matchingMonthOption.month);
      } else {
        console.log('⚠️ useMonthDropdown: No matching month found for repayment_id:', currentApplicationPaymentId, 'Available months:', monthData.months.map(m => ({ month: m.month, repayment_id: m.repayment_id })));
      }
    }
  }, [currentApplicationPaymentId, monthData.months]);

  return {
    ...monthData,
    selectedMonth,
    currentApplication,
    handleMonthChange,
    fetchApplicationForMonth,
    refreshMonthOptions: fetchMonthOptions
  };
};
