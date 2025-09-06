import { useState, useEffect, useCallback, useMemo } from 'react';
import { client } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { FilterState } from '@/types/filters';
import { formatEmiMonth } from '@/utils/formatters';
import { useFilterCache } from './useFilterCache';
import { normalizeEmiMonth, groupDatesByMonth } from '@/utils/dateUtils';
import { VEHICLE_STATUS_OPTIONS } from '@/constants/options';
import { FiltersService } from '@/integrations/api/services';

interface CascadingFilterOptions {
  branches: string[];
  teamLeads: string[];
  rms: string[];
  dealers: string[];
  lenders: string[];
  statuses: string[];
  emiMonths: string[];
  repayments: string[];
  lastMonthBounce: string[];
  ptpDateOptions: string[];
  vehicleStatusOptions: string[];
}

export const useCascadingFilters = () => {
  const { user } = useAuth();
  const { getCachedData, setCachedData } = useFilterCache<CascadingFilterOptions>('filter-options');
  
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

  const [availableOptions, setAvailableOptions] = useState<CascadingFilterOptions>({
    branches: [],
    teamLeads: [],
    rms: [],
    dealers: [],
    lenders: [],
    statuses: [],
    emiMonths: [],
    repayments: [],
    lastMonthBounce: ['Not paid', 'Paid on time', '1-5 days late', '6-15 days late', '15+ days late'],
    ptpDateOptions: [],
    vehicleStatusOptions: []
  });

  const [selectedEmiMonth, setSelectedEmiMonth] = useState<string | null>(null);
  const [defaultEmiMonth, setDefaultEmiMonth] = useState<string | null>(null);
  const [emiMonthOptions, setEmiMonthOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch filter options from backend API
  const fetchFilterOptions = useCallback(async () => {
    try {
      console.log('Fetching filter options from backend API...');
      const filterOptions = await FiltersService.getAllFilterOptions();
      
      setAvailableOptions(prev => ({
        ...prev,
        branches: filterOptions.branches || [],
        teamLeads: filterOptions.team_leads || [],
        rms: filterOptions.rms || [],
        dealers: filterOptions.dealers || [],
        lenders: filterOptions.lenders || [],
        statuses: filterOptions.statuses || [],
        repayments: filterOptions.demand_num || [], // Map demand_num to repayments
        ptpDateOptions: filterOptions.ptpDateOptions || [],
        vehicleStatusOptions: filterOptions.vehicle_statuses || []
      }));

      // Set EMI months from backend
      if (filterOptions.emi_months && filterOptions.emi_months.length > 0) {
        setEmiMonthOptions(filterOptions.emi_months);
      }

      console.log('Filter options loaded from backend:', filterOptions);
    } catch (error) {
      console.error('Failed to fetch filter options from backend:', error);
      // Fallback to hardcoded options if backend fails
      setAvailableOptions(prev => ({
        ...prev,
        ptpDateOptions: ['Overdue PTP', "Today's PTP", "Tomorrow's PTP", 'Future PTP', 'No PTP'],
        vehicleStatusOptions: VEHICLE_STATUS_OPTIONS.map(opt => opt.value)
      }));
    }
  }, []);

  // Fetch all available EMI months from both tables (prioritize collection)
  const fetchAllEmiMonths = useCallback(async () => {
    if (!user) return;

    try {
      console.log('Fetching all EMI months from database...');

      // PRIMARY: Get demand dates from collection table first
      const { data: colDates } = await client
        .from('collection')
        .select('demand_date')
        .not('demand_date', 'is', null);

      // SECONDARY: Get demand dates from applications table
      const { data: appDates } = await client
        .from('applications')
        .select('demand_date')
        .not('demand_date', 'is', null);

      console.log('Raw collection dates:', colDates?.slice(0, 10));
      console.log('Raw app dates:', appDates?.slice(0, 10));

      // Combine all dates and group by normalized month (prioritize collection data)
      const allDates: string[] = [];
      colDates?.forEach(item => {
        if (item.demand_date) allDates.push(item.demand_date);
      });
      appDates?.forEach(item => {
        if (item.demand_date) allDates.push(item.demand_date);
      });

      // Group dates by normalized month
      const monthGroups = groupDatesByMonth(allDates);
      console.log('Month groups:', monthGroups);

      // Sort normalized months in descending order (newest first)
      const sortedMonths = Object.keys(monthGroups).sort((a, b) => b.localeCompare(a));
      
      // Only set EMI months if we don't have them from backend
      if (emiMonthOptions.length === 0) {
        setEmiMonthOptions(sortedMonths);
      }

      // Set default to latest month if no month is selected
      if (sortedMonths.length > 0) {
        const latestMonth = sortedMonths[0];
        setDefaultEmiMonth(latestMonth);
        
        if (!selectedEmiMonth) {
          console.log('Setting default EMI month to:', latestMonth);
          setSelectedEmiMonth(latestMonth);
        }
      }

      console.log('Available EMI months:', sortedMonths);
    } catch (error) {
      console.error('Error fetching EMI months:', error);
    }
  }, [user, selectedEmiMonth, emiMonthOptions]);

  // Handle filter changes
  const handleFilterChange = useCallback((key: string, values: string[]) => {
    console.log('Filter change:', key, values);
    setFilters(prev => ({
      ...prev,
      [key]: values
    }));
  }, []);

  // Handle EMI month change
  const handleEmiMonthChange = useCallback((month: string) => {
    console.log('EMI month changed to:', month);
    setSelectedEmiMonth(month);
    // Clear other filters when EMI month changes to ensure fresh data
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

  // Clear all filters except EMI month
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

  // Initialize EMI months on mount
  useEffect(() => {
    if (user) {
      fetchAllEmiMonths();
    }
  }, [user, fetchAllEmiMonths]);

  // Fetch options when EMI month or filters change
  useEffect(() => {
    if (user && selectedEmiMonth) {
      fetchFilterOptions();
    }
  }, [user, selectedEmiMonth, filters, fetchFilterOptions]);

  return {
    filters,
    availableOptions,
    handleFilterChange,
    clearAllFilters,
    selectedEmiMonth,
    handleEmiMonthChange,
    emiMonthOptions,
    defaultEmiMonth,
    loading
  };
};
