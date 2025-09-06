
import { useState, useCallback, useMemo } from 'react';
import { FilterState } from '@/types/filters';

export const useServerSideFiltering = () => {
  const [filters, setFilters] = useState<FilterState>({
    branch: [],
    teamLead: [],
    rm: [],
    dealer: [],
    lender: [],
    status: [],
    emiMonth: [],
    repayment: [],
    lastMonthBounce: [],
    ptpDate: [],
    vehicleStatus: []
  });

  const handleFilterChange = useCallback((key: string, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [key]: values
    }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({
      branch: [],
      teamLead: [],
      rm: [],
      dealer: [],
      lender: [],
      status: [],
      emiMonth: [],
      repayment: [],
      lastMonthBounce: [],
      ptpDate: [],
      vehicleStatus: []
    });
  }, []);

  // Extract selected EMI Month for context-aware filtering
  const selectedEmiMonth = useMemo(() => {
    if (filters.emiMonth.length === 1) {
      return filters.emiMonth[0];
    }
    return null;
  }, [filters.emiMonth]);

  return {
    filters,
    handleFilterChange,
    clearAllFilters,
    selectedEmiMonth
  };
};
