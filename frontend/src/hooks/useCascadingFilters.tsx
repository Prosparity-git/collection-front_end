import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { client } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { FilterState } from '@/types/filters';
import { formatEmiMonth, getCurrentEmiMonth } from '@/utils/formatters';
import { useQueryCache } from './useQueryCache';
import { normalizeEmiMonth, groupDatesByMonth } from '@/utils/dateUtils';
import { VEHICLE_STATUS_OPTIONS } from '@/constants/options';
import { FiltersService, CascadingResponse } from '@/integrations/api/services';

interface CascadingFilterOptions {
  branches: string[];
  teamLeads: string[];
  rms: string[];
  sourceTeamLeads?: string[];
  sourceRms?: string[];
  dealers: string[];
  lenders: string[];
  statuses: string[];
  emiMonths: string[];
  repayments: string[];
  lastMonthBounce: string[];
  ptpDateOptions: string[];
  vehicleStatusOptions: string[];
}

// Define cascade relationships - which filters affect which others
const CASCADE_DEPENDENCIES: Record<string, string[]> = {
  branch: ['teamLeads', 'rms', 'sourceTeamLeads', 'sourceRms', 'dealers', 'lenders'],
  teamLead: ['rms', 'dealers', 'lenders'],
  rm: ['dealers', 'lenders'],
  sourceTeamLead: ['sourceRms', 'dealers', 'lenders'],
  sourceRm: ['dealers', 'lenders'],
  dealer: ['branches', 'teamLeads', 'rms', 'sourceTeamLeads', 'sourceRms', 'lenders'],
  lender: ['branches', 'teamLeads', 'rms', 'sourceTeamLeads', 'sourceRms', 'dealers']
};

export const useCascadingFilters = () => {
  const { user } = useAuth();
  const filterCache = useQueryCache<CascadingFilterOptions>();
  const cascadingCache = useQueryCache<CascadingResponse>();
  
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
    dpdBucket: [],
    specialCaseFilter: []
  });

  const [availableOptions, setAvailableOptions] = useState<CascadingFilterOptions>({
    branches: [],
    teamLeads: [],
    rms: [],
    sourceTeamLeads: [],
    sourceRms: [],
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

  // Track pending API calls to avoid duplicate requests
  const pendingCallsRef = useRef<Map<string, Promise<any>>>(new Map());
  
  // Track if initial data has been loaded
  const initialLoadRef = useRef(false);

  // Fetch filter options from backend API with caching
  const fetchFilterOptions = useCallback(async () => {
    const cacheKey = 'all-filter-options';
    const cached = filterCache.getCachedData(cacheKey);
    
    if (cached && initialLoadRef.current) {
      console.log('Using cached filter options');
      return cached;
    }

    try {
      console.log('Fetching filter options from backend API...');
      setLoading(true);
      const filterOptions = await FiltersService.getAllFilterOptions();
      
      const options: CascadingFilterOptions = {
        branches: [],
        teamLeads: [],
        rms: [],
        sourceTeamLeads: [],
        sourceRms: [],
        dealers: [],
        lenders: [],
        statuses: filterOptions.statuses || [],
        emiMonths: [],
        repayments: filterOptions.demand_num || [],
        lastMonthBounce: ['Not paid', 'Paid on time', '1-5 days late', '6-15 days late', '15+ days late'],
        ptpDateOptions: filterOptions.ptpDateOptions || [],
        vehicleStatusOptions: filterOptions.vehicle_statuses || []
      };
      
      // Only update non-cascading fields from fetchFilterOptions
      // Cascading fields will be populated by the cascading endpoint
      setAvailableOptions(prev => ({ 
        ...prev, 
        statuses: options.statuses,
        repayments: options.repayments,
        lastMonthBounce: options.lastMonthBounce,
        ptpDateOptions: options.ptpDateOptions,
        vehicleStatusOptions: options.vehicleStatusOptions
      }));
      filterCache.setCachedData(cacheKey, options, 5 * 60 * 1000); // Cache for 5 minutes

      // Set EMI months from backend
      if (filterOptions.emi_months && filterOptions.emi_months.length > 0) {
        setEmiMonthOptions(filterOptions.emi_months);
      }

      console.log('Filter options loaded from backend:', filterOptions);
      initialLoadRef.current = true;
      return options;
    } catch (error) {
      console.error('Failed to fetch filter options from backend:', error);
      // Fallback to hardcoded options if backend fails
      const fallbackOptions: Partial<CascadingFilterOptions> = {
        ptpDateOptions: ['Overdue PTP', "Today's PTP", "Tomorrow's PTP", 'Future PTP', 'No PTP'],
        vehicleStatusOptions: VEHICLE_STATUS_OPTIONS.map(opt => opt.value)
      };
      setAvailableOptions(prev => ({ ...prev, ...fallbackOptions }));
    } finally {
      setLoading(false);
    }
  }, [filterCache]);

  // Fetch all available EMI months from both tables (prioritize collection)
  const fetchAllEmiMonths = useCallback(async () => {
    if (!user) return;

    try {
      console.log('Fetching all EMI months from database...');

      // Use Promise.all for parallel fetching
      const [colResult, appResult] = await Promise.all([
        client.from('collection').select('demand_date'),
        client.from('applications').select('demand_date')
      ]);

      const colDates = colResult.data;
      const appDates = appResult.data;

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
      dpdBucket: [],
      specialCaseFilter: []
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
      dpdBucket: [],
      specialCaseFilter: []
    });
  }, []);

  // Initialize EMI months on mount
  useEffect(() => {
    if (user) {
      fetchAllEmiMonths();
    }
  }, [user, fetchAllEmiMonths]);

  // Fetch options when EMI month changes (not when filters change - that's handled by cascading)
  useEffect(() => {
    if (user && selectedEmiMonth && !initialLoadRef.current) {
      fetchFilterOptions();
    }
  }, [user, selectedEmiMonth, fetchFilterOptions]);

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
          teamLeads: res.team_leads?.map(i => i.name) || prev.teamLeads,
          rms: res.rms?.map(i => i.name) || prev.rms,
          sourceTeamLeads: res.source_team_leads?.map(i => i.name) || prev.sourceTeamLeads,
          sourceRms: res.source_rms?.map(i => i.name) || prev.sourceRms,
          dealers: res.dealers?.map(i => i.name) || prev.dealers,
          lenders: res.lenders?.map(i => i.name) || prev.lenders,
        }));
      } catch {}
    };
    seed();
  }, []);

  // Optimized cascading: call backend with all selected ids, improved debounce and caching
  useEffect(() => {
    if (!user) return;

    const toId = (map: Record<string, number>, names: string[] | undefined) => {
      if (!names || names.length === 0) return undefined;
      return map[names[0]]; // use first selection for cascading context
    };

    const timer = setTimeout(async () => {
      // Check if we have any filters selected
      const hasFilters = filters.branch.length > 0 || filters.teamLead.length > 0 || 
                         filters.rm.length > 0 || filters.sourceTeamLead.length > 0 || 
                         filters.sourceRm.length > 0 || filters.dealer.length > 0 || 
                         filters.lender.length > 0;
      
      if (!hasFilters && initialLoadRef.current) {
        // If no filters, skip cascading API call but ensure initial options are loaded
        return;
      }

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

        // Create cache key based on params
        const cacheKey = `cascading-${JSON.stringify(params)}`;
        const cached = cascadingCache.getCachedData(cacheKey);
        
        if (cached) {
          console.log('Using cached cascading data');
          const res = cached;
          
          // Update maps and options from cache
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

          // Update available options based on impacted fields
          const lastKey = lastChangedKeyRef.current;
          const impacted = lastKey ? CASCADE_DEPENDENCIES[lastKey] || [] : [];
          
          setAvailableOptions(prev => {
            const names = (arr?: { id: number; name: string }[]) => (arr || []).map(i => i.name);
            const next: any = { ...prev };
            
            // Always update ALL cascading fields for consistency
            if (lastKey) {
              if (impacted.includes('teamLeads')) next.teamLeads = names(res.team_leads);
              if (impacted.includes('rms')) next.rms = names(res.rms);
              if (impacted.includes('sourceTeamLeads')) next.sourceTeamLeads = names(res.source_team_leads);
              if (impacted.includes('sourceRms')) next.sourceRms = names(res.source_rms);
              if (impacted.includes('dealers')) next.dealers = names(res.dealers);
              if (impacted.includes('lenders')) next.lenders = names(res.lenders);
              if (impacted.includes('branches')) next.branches = names(res.branches);
            } else {
              // If lastKey is not set, update all cascading fields to be safe
              next.teamLeads = names(res.team_leads);
              next.rms = names(res.rms);
              next.sourceTeamLeads = names(res.source_team_leads);
              next.sourceRms = names(res.source_rms);
              next.dealers = names(res.dealers);
              next.lenders = names(res.lenders);
              next.branches = names(res.branches);
            }
            return next;
          });
          return;
        }

        // Check for pending API call to avoid duplicate requests
        let apiCall = pendingCallsRef.current.get(cacheKey);
        if (!apiCall) {
          apiCall = FiltersService.getCascadingOptions(params);
          pendingCallsRef.current.set(cacheKey, apiCall);
        }

        const res = await apiCall;
        pendingCallsRef.current.delete(cacheKey);

        // Cache the response for 2 minutes
        cascadingCache.setCachedData(cacheKey, res, 2 * 60 * 1000);

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

        // Determine impacted lists based on last changed key using CASCADE_DEPENDENCIES
        const lastKey = lastChangedKeyRef.current;
        const impacted = lastKey ? CASCADE_DEPENDENCIES[lastKey] || [] : [];

        setAvailableOptions(prev => {
          const names = (arr?: { id: number; name: string }[]) => (arr || []).map(i => i.name);
          const next: any = { ...prev };
          
          // Always update ALL cascading fields, not just impacted ones
          // This ensures that when a filter is selected, all dependent filters
          // show the correct filtered options based on current selections
          if (lastKey) {
            // If we know what changed, update only impacted fields for efficiency
            if (impacted.includes('teamLeads')) next.teamLeads = names(res.team_leads);
            if (impacted.includes('rms')) next.rms = names(res.rms);
            if (impacted.includes('sourceTeamLeads')) next.sourceTeamLeads = names(res.source_team_leads);
            if (impacted.includes('sourceRms')) next.sourceRms = names(res.source_rms);
            if (impacted.includes('dealers')) next.dealers = names(res.dealers);
            if (impacted.includes('lenders')) next.lenders = names(res.lenders);
            if (impacted.includes('branches')) next.branches = names(res.branches);
          } else {
            // If lastKey is not set, update all cascading fields to be safe
            next.teamLeads = names(res.team_leads);
            next.rms = names(res.rms);
            next.sourceTeamLeads = names(res.source_team_leads);
            next.sourceRms = names(res.source_rms);
            next.dealers = names(res.dealers);
            next.lenders = names(res.lenders);
            next.branches = names(res.branches);
          }
          return next;
        });
      } catch (e) {
        console.error('Cascading API error:', e);
        // ignore cascading errors to avoid breaking applied filters UX
      }
    }, 150); // Reduced debounce from 250ms to 150ms for faster response

    return () => clearTimeout(timer);
    // Include dealer/lender in deps to trigger cascading
  }, [user, filters.branch, filters.teamLead, filters.rm, (filters as any).sourceTeamLead, (filters as any).sourceRm, filters.dealer, filters.lender, nameToId, cascadingCache]);

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
