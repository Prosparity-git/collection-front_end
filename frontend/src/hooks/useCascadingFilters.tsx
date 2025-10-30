import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
    sourceTeamLead: [],
    sourceRm: [],
    dealer: [],
    lender: [],
    status: [],
    emiMonth: [],
    repayment: [],
    lastMonthBounce: [],
    ptpDate: [],
    vehicleStatus: [],
    dpdBucket: []
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

  // Track last changed key to apply dependency rules on applied filters
  const lastChangedKeyRef = useRef<string | null>(null);

  // Name -> ID maps for applied filters (seeded from cascading endpoint)
  const [nameToId, setNameToId] = useState<Record<string, Record<string, number>>>(
    {
      branches: {},
      team_leads: {},
      rms: {},
      source_team_leads: {},
      source_rms: {},
      dealers: {},
      lenders: {}
    }
  );

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
        source_team_leads: filterOptions.source_team_leads || [],
        source_rms: filterOptions.source_rms || [],
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
        .select('demand_date');

      // SECONDARY: Get demand dates from applications table
      const { data: appDates } = await client
        .from('applications')
        .select('demand_date');

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
    lastChangedKeyRef.current = key;
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
      sourceTeamLead: [],
      sourceRm: [],
      dealer: [],
      lender: [],
      status: [],
      emiMonth: [],
      repayment: [],
      lastMonthBounce: [],
      ptpDate: [],
      vehicleStatus: [],
      dpdBucket: []
    });
  }, []);

  // Clear all filters except EMI month
  const clearAllFilters = useCallback(() => {
    setFilters({
      branch: [],
      teamLead: [],
      rm: [],
      sourceTeamLead: [],
      sourceRm: [],
      dealer: [],
      lender: [],
      status: [],
      emiMonth: [],
      repayment: [],
      lastMonthBounce: [],
      ptpDate: [],
      vehicleStatus: [],
      dpdBucket: []
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

  // Seed name->id maps from cascading endpoint on mount
  useEffect(() => {
    const seed = async () => {
      try {
        const res = await FiltersService.getCascadingOptions({});
        const toMap = (arr: { id: number; name: string }[]) => Object.fromEntries(arr.map(i => [i.name, i.id])) as Record<string, number>;
        setNameToId({
          branches: toMap(res.branches || []),
          team_leads: toMap(res.team_leads || []),
          rms: toMap(res.rms || []),
          source_team_leads: toMap(res.source_team_leads || []),
          source_rms: toMap(res.source_rms || []),
          dealers: toMap(res.dealers || []),
          lenders: toMap(res.lenders || []),
        });
        // Also ensure initial options include dealers/lenders if present
        setAvailableOptions(prev => ({
          ...prev,
          branches: res.branches?.map(i => i.name) || prev.branches,
          team_leads: res.team_leads?.map(i => i.name) || (prev as any).team_leads,
          rms: res.rms?.map(i => i.name) || prev.rms,
          source_team_leads: res.source_team_leads?.map(i => i.name) || (prev as any).source_team_leads,
          source_rms: res.source_rms?.map(i => i.name) || (prev as any).source_rms,
          dealers: res.dealers?.map(i => i.name) || prev.dealers,
          lenders: res.lenders?.map(i => i.name) || prev.lenders,
        } as any));
      } catch {}
    };
    seed();
  }, []);

  // Applied cascading: call backend with all selected ids, 250ms debounce
  useEffect(() => {
    if (!user) return;

    const toId = (map: Record<string, number>, names: string[] | undefined) => {
      if (!names || names.length === 0) return undefined;
      return map[names[0]]; // use first selection for cascading context
    };

    const timer = setTimeout(async () => {
      try {
        const params = {
          branch_id: toId(nameToId.branches, filters.branch),
          tl_id: toId(nameToId.team_leads, filters.teamLead),
          rm_id: toId(nameToId.rms, filters.rm),
          source_tl_id: toId(nameToId.source_team_leads, filters.sourceTeamLead),
          source_rm_id: toId(nameToId.source_rms, filters.sourceRm),
          dealer_id: toId(nameToId.dealers, filters.dealer),
          lender_id: toId(nameToId.lenders, filters.lender)
        };

        const res = await FiltersService.getCascadingOptions(params);

        // Update name->id maps with latest options
        const mergeMap = (prev: Record<string, number>, arr: { id: number; name: string }[]) => ({
          ...prev,
          ...Object.fromEntries((arr || []).map(i => [i.name, i.id]))
        });
        setNameToId(prev => ({
          branches: mergeMap(prev.branches, res.branches || []),
          team_leads: mergeMap(prev.team_leads, res.team_leads || []),
          rms: mergeMap(prev.rms, res.rms || []),
          source_team_leads: mergeMap(prev.source_team_leads, res.source_team_leads || []),
          source_rms: mergeMap(prev.source_rms, res.source_rms || []),
          dealers: mergeMap(prev.dealers, res.dealers || []),
          lenders: mergeMap(prev.lenders, res.lenders || []),
        }));

        // Determine impacted lists and update availableOptions accordingly
        const lastKey = lastChangedKeyRef.current;
        const impacted = (() => {
          switch (lastKey) {
            case 'branch':
              return ['team_leads', 'rms', 'source_team_leads', 'source_rms', 'dealers', 'lenders'];
            case 'teamLead':
              return ['rms', 'source_team_leads', 'source_rms', 'dealers', 'lenders'];
            case 'rm':
              return ['team_leads', 'source_team_leads', 'source_rms', 'dealers', 'lenders'];
            case 'sourceTeamLead':
              return ['source_rms', 'team_leads', 'rms', 'dealers', 'lenders'];
            case 'sourceRm':
              return ['source_team_leads', 'team_leads', 'rms', 'dealers', 'lenders'];
            case 'dealer':
              return ['branches', 'team_leads', 'rms', 'source_team_leads', 'source_rms', 'lenders'];
            case 'lender':
              return ['branches', 'team_leads', 'rms', 'source_team_leads', 'source_rms', 'dealers'];
            default:
              return [] as string[];
          }
        })();

        setAvailableOptions(prev => {
          const names = (arr?: { id: number; name: string }[]) => (arr || []).map(i => i.name);
          const next: any = { ...prev };
          if (impacted.includes('branches')) next.branches = names(res.branches);
          if (impacted.includes('team_leads')) next.team_leads = names(res.team_leads);
          if (impacted.includes('rms')) next.rms = names(res.rms);
          if (impacted.includes('source_team_leads')) next.source_team_leads = names(res.source_team_leads);
          if (impacted.includes('source_rms')) next.source_rms = names(res.source_rms);
          if (impacted.includes('dealers')) next.dealers = names(res.dealers);
          if (impacted.includes('lenders')) next.lenders = names(res.lenders);
          return next;
        });
      } catch (e) {
        // ignore cascading errors to avoid breaking applied filters UX
      }
    }, 250);

    return () => clearTimeout(timer);
    // Include dealer/lender in deps to trigger cascading
  }, [user, filters.branch, filters.teamLead, filters.rm, (filters as any).sourceTeamLead, (filters as any).sourceRm, filters.dealer, filters.lender, nameToId]);

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
