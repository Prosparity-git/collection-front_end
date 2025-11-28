import { useRef, useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronUp, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import CustomMultiSelectFilter from "./CustomMultiSelectFilter";
import { calculateActiveFilterCount } from "@/utils/filterUtils";
import { FiltersService } from "@/integrations/api/services";

interface MobileFilterBarProps {
  filters: {
    branch: string[];
    teamLead: string[];
    rm: string[];
    sourceTeamLead?: string[];
    sourceRm?: string[];
    dealer: string[];
    lender: string[];
    status: string[];
    repayment: string[];
    lastMonthBounce: string[];
    ptpDate: string[];
    dpdBucket: string[];
  };
  onFilterChange: (key: string, values: string[]) => void;
  availableOptions: {
    branches: string[];
    team_leads: string[]; // Fix: match the actual property name from mappedOptions
    rms: string[];
    source_team_leads?: string[];
    source_rms?: string[];
    dealers: string[];
    lenders: string[];
    statuses: string[];
    emiMonths: string[];
    repayments: string[];
    lastMonthBounce: string[];
    ptpDateOptions: string[];
    dpd_buckets?: string[];
  };
  emiMonthOptions?: string[];
  selectedEmiMonth?: string | null;
  onEmiMonthChange?: (month: string) => void;
}

const MobileFilterBar = ({ filters, onFilterChange, availableOptions, emiMonthOptions, selectedEmiMonth, onEmiMonthChange }: MobileFilterBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeOpenKey, setActiveOpenKey] = useState<string | null>(null);
  
  // Temporary filters - what user is currently selecting
  const [tempFilters, setTempFilters] = useState(filters);

  // Track last changed key to apply dependency rules
  const lastChangedKeyRef = useRef<string | null>(null);

  // Name -> ID maps for cascading API
  const [idMaps, setIdMaps] = useState<Record<string, Record<string, number>>>({
    branches: {},
    team_leads: {},
    rms: {},
    source_team_leads: {},
    source_rms: {},
    dealers: {},
    lenders: {}
  });

  // Overrides for live preview while panel is open
  const [cascadeOverrides, setCascadeOverrides] = useState<Partial<Record<string, string[]>>>({});

  // Name normalization function to handle whitespace/case differences
  const normalize = (s: string) => s?.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

  // Update temp filters when applied filters change
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  // Seed idMaps on mount with normalized names
  useEffect(() => {
    const seed = async () => {
      try {
        const res = await FiltersService.getCascadingOptions({});
        const toMap = (arr: { id: number; name: string }[]) => 
          Object.fromEntries(arr.map(i => [normalize(i.name), i.id])) as Record<string, number>;
        setIdMaps({
          branches: toMap(res.branches || []),
          team_leads: toMap(res.team_leads || []),
          rms: toMap(res.rms || []),
          source_team_leads: toMap(res.source_team_leads || []),
          source_rms: toMap(res.source_rms || []),
          dealers: toMap(res.dealers || []),
          lenders: toMap(res.lenders || []),
        });
      } catch (e) {
        console.error('Failed to seed idMaps:', e);
      }
    };
    seed();
  }, []);

  // Merge base options with overrides for preview
  const mergedAvailableOptions = useMemo(() => {
    const mergeList = (base: string[] | undefined, over?: string[]) => (over && over.length ? over : base || []);
    return {
      ...availableOptions,
      branches: mergeList(availableOptions?.branches, cascadeOverrides.branches),
      team_leads: mergeList(availableOptions?.team_leads, cascadeOverrides.team_leads),
      rms: mergeList(availableOptions?.rms, cascadeOverrides.rms),
      source_team_leads: mergeList(availableOptions?.source_team_leads, cascadeOverrides.source_team_leads),
      source_rms: mergeList(availableOptions?.source_rms, cascadeOverrides.source_rms),
      dealers: mergeList(availableOptions?.dealers, cascadeOverrides.dealers),
      lenders: mergeList(availableOptions?.lenders, cascadeOverrides.lenders)
    };
  }, [availableOptions, cascadeOverrides]);

  // Ensure all filter options have default empty arrays
  const safeFilterOptions = {
    branches: mergedAvailableOptions?.branches || [],
    teamLeads: mergedAvailableOptions?.team_leads || [], // Use team_leads from availableOptions
    rms: mergedAvailableOptions?.rms || [],
    sourceTeamLeads: mergedAvailableOptions?.source_team_leads || [],
    sourceRms: mergedAvailableOptions?.source_rms || [],
    dealers: mergedAvailableOptions?.dealers || [],
    lenders: mergedAvailableOptions?.lenders || [],
    statuses: mergedAvailableOptions?.statuses || [],
    repayments: mergedAvailableOptions?.repayments || [],
    lastMonthBounce: mergedAvailableOptions?.lastMonthBounce || [],
    ptpDateOptions: mergedAvailableOptions?.ptpDateOptions || [],
    dpdBuckets: mergedAvailableOptions?.dpd_buckets || [],
  };

  // Use the prop if provided, else fallback to availableOptions.emiMonths
  const safeEmiMonthOptions = emiMonthOptions || availableOptions?.emiMonths || [];

  // Ensure all filters have default empty arrays
  const safeFilters = {
    branch: tempFilters?.branch || [],
    teamLead: tempFilters?.teamLead || [],
    rm: tempFilters?.rm || [],
    sourceTeamLead: tempFilters?.sourceTeamLead || [],
    sourceRm: tempFilters?.sourceRm || [],
    dealer: tempFilters?.dealer || [],
    lender: tempFilters?.lender || [],
    status: tempFilters?.status || [],
    repayment: tempFilters?.repayment || [],
    lastMonthBounce: tempFilters?.lastMonthBounce || [],
    ptpDate: tempFilters?.ptpDate || [],
    dpdBucket: tempFilters?.dpdBucket || [],
  };

  // Calculate total active filters with proper typing (use applied filters for badge)
  const activeFilterCount = calculateActiveFilterCount(filters);
  
  // Calculate total pending selections (temporary filters)
  const pendingFilterCount = calculateActiveFilterCount(tempFilters);
  
  // Check if there are any filters (applied or pending)
  const hasAnyFilters = activeFilterCount > 0 || pendingFilterCount > 0;

  // Handle temporary filter changes (doesn't trigger API calls)
  const handleTempFilterChange = (key: string, values: string[]) => {
    lastChangedKeyRef.current = key;
    setTempFilters(prev => ({
      ...prev,
      [key]: values
    }));
  };

  // Apply temporary filters when Done is clicked
  const handleApplyFilters = () => {
    Object.keys(tempFilters).forEach(key => {
      const currentValue = filters[key] || [];
      const newValue = tempFilters[key] || [];
      
      // Only call onFilterChange if the values have actually changed
      if (JSON.stringify(currentValue.sort()) !== JSON.stringify(newValue.sort())) {
        onFilterChange(key, newValue);
      }
    });
    setIsOpen(false);
  };

  // Clear all filters (both temp and applied) - works at all times, even with pending selections
  const clearAllFilters = () => {
    // Create empty filters object for all filter keys
    const emptyFilters = Object.keys(filters).reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {} as any);
    
    // Clear temporary filters (pending selections)
    setTempFilters(emptyFilters);
    
    // Clear all applied filters immediately
    Object.keys(emptyFilters).forEach(key => {
      onFilterChange(key, []);
    });
    
    // Reset state
    setActiveOpenKey(null);
    setCascadeOverrides({});
    lastChangedKeyRef.current = null;
    
    // Close panel if it's open
    if (isOpen) {
      setIsOpen(false);
    }
  };

  // Reset temporary filters to match applied filters (cancel changes)
  const handleCancel = () => {
    setTempFilters(filters);
    setIsOpen(false);
  };

  // Build selected IDs (comma-separated) from names using idMaps with normalization
  const buildSelectedIds = (omitKey?: string | null) => {
    const toIds = (map: Record<string, number>, names: string[] | undefined) => {
      if (!names || names.length === 0) return undefined;
      const ids = names
        .map(n => map[normalize(n)])
        .filter((v): v is number => typeof v === 'number');
      return ids.length ? ids.join(',') : undefined;
    };

    const omitSet = new Set<string>([omitKey || '']);

    return {
      branch_id: omitSet.has('branch') ? undefined : toIds(idMaps.branches, tempFilters.branch),
      tl_id: omitSet.has('teamLead') ? undefined : toIds(idMaps.team_leads, tempFilters.teamLead),
      rm_id: omitSet.has('rm') ? undefined : toIds(idMaps.rms, tempFilters.rm),
      source_tl_id: omitSet.has('sourceTeamLead') ? undefined : toIds(idMaps.source_team_leads, tempFilters.sourceTeamLead),
      source_rm_id: omitSet.has('sourceRm') ? undefined : toIds(idMaps.source_rms, tempFilters.sourceRm),
      dealer_id: omitSet.has('dealer') ? undefined : toIds(idMaps.dealers, tempFilters.dealer),
      lender_id: omitSet.has('lender') ? undefined : toIds(idMaps.lenders, tempFilters.lender)
    };
  };

  // Helper to merge id maps from API response with normalization
  const mergeIdMaps = (items: { id: number; name: string }[]) =>
    Object.fromEntries(items.map(i => [normalize(i.name), i.id])) as Record<string, number>;

  // Determine which lists are impacted by the last changed key
  const impactedListsForKey = (key: string | null): string[] => {
    switch (key) {
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
        return [];
    }
  };

  // Debounced live cascading while panel is open (30ms debounce for faster response)
  useEffect(() => {
    if (!isOpen) {
      setCascadeOverrides({});
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        // When a dropdown opens, omit that key from the API call to get fresh options
        const params = buildSelectedIds(activeOpenKey);
        const res = await FiltersService.getCascadingOptions(params as any);

        // Update id maps by merging with normalized names
        setIdMaps(prev => ({
          branches: { ...prev.branches, ...mergeIdMaps(res.branches || []) },
          team_leads: { ...prev.team_leads, ...mergeIdMaps(res.team_leads || []) },
          rms: { ...prev.rms, ...mergeIdMaps(res.rms || []) },
          source_team_leads: { ...prev.source_team_leads, ...mergeIdMaps(res.source_team_leads || []) },
          source_rms: { ...prev.source_rms, ...mergeIdMaps(res.source_rms || []) },
          dealers: { ...prev.dealers, ...mergeIdMaps(res.dealers || []) },
          lenders: { ...prev.lenders, ...mergeIdMaps(res.lenders || []) }
        }));

        // Compute overrides for ALL cascading fields to ensure consistency
        const lastKey = lastChangedKeyRef.current;
        const impacted = impactedListsForKey(lastKey);
        const toNames = (arr?: { id: number; name: string }[]) => (arr || []).map(i => i.name);
        const overrides: Partial<Record<string, string[]>> = {};

        // Always update ALL cascading fields when any filter changes
        overrides.branches = toNames(res.branches);
        overrides.team_leads = toNames(res.team_leads);
        overrides.rms = toNames(res.rms);
        overrides.source_team_leads = toNames(res.source_team_leads);
        overrides.source_rms = toNames(res.source_rms);
        overrides.dealers = toNames(res.dealers);
        overrides.lenders = toNames(res.lenders);

        setCascadeOverrides(overrides);
      } catch (e) {
        // Swallow errors in live preview to avoid UX disruption
        setCascadeOverrides({});
      }
    }, 30);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tempFilters, activeOpenKey]);

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-2 p-4 border-b">
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex-1 flex items-center justify-between hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="gap-2"
            disabled={!hasAnyFilters}
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Clear All</span>
          </Button>
        </div>
        
        <CollapsibleContent>
          <div className="p-4 space-y-6 border-t">
            <h3 className="font-medium text-gray-900 text-sm">Filter Applications</h3>
            
            {/* EMI Month Selector - Outside of filter sections */}
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-700">EMI Month</label>
              <select
                value={selectedEmiMonth || ''}
                onChange={(e) => onEmiMonthChange?.(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select EMI Month</option>
                {safeEmiMonthOptions.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* Main Filters Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Main Filters</h4>
              
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Branch</label>
                <CustomMultiSelectFilter
                  label="Branch"
                  options={safeFilterOptions.branches}
                  selected={safeFilters.branch}
                  onSelectionChange={(values) => handleTempFilterChange('branch', values)}
                  onOpenChange={(open) => setActiveOpenKey(open ? 'branch' : null)}
                  deferChangeUntilClose
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Collection TL</label>
                <CustomMultiSelectFilter
                  label="Collection TL"
                  options={safeFilterOptions.teamLeads}
                  selected={safeFilters.teamLead}
                  onSelectionChange={(values) => handleTempFilterChange('teamLead', values)}
                  onOpenChange={(open) => setActiveOpenKey(open ? 'teamLead' : null)}
                  deferChangeUntilClose
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Collection RM</label>
                <CustomMultiSelectFilter
                  label="Collection RM"
                  options={safeFilterOptions.rms}
                  selected={safeFilters.rm}
                  onSelectionChange={(values) => handleTempFilterChange('rm', values)}
                  onOpenChange={(open) => setActiveOpenKey(open ? 'rm' : null)}
                  deferChangeUntilClose
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">DPD Bucket</label>
                <CustomMultiSelectFilter
                  label="DPD Bucket"
                  options={safeFilterOptions.dpdBuckets}
                  selected={safeFilters.dpdBucket}
                  onSelectionChange={(values) => handleTempFilterChange('dpdBucket', values)}
                  placeholder="Select DPD buckets"
                  onOpenChange={(open) => setActiveOpenKey(open ? 'dpdBucket' : null)}
                  deferChangeUntilClose
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Status</label>
                <CustomMultiSelectFilter
                  label="Status"
                  options={safeFilterOptions.statuses}
                  selected={safeFilters.status}
                  onSelectionChange={(values) => handleTempFilterChange('status', values)}
                  onOpenChange={(open) => setActiveOpenKey(open ? 'status' : null)}
                  deferChangeUntilClose
                />
              </div>
            </div>

            {/* Other Filters Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Other Filters</h4>
              
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Source Team Lead</label>
                <CustomMultiSelectFilter
                  label="Source Team Lead"
                  options={safeFilterOptions.sourceTeamLeads}
                  selected={safeFilters.sourceTeamLead}
                  onSelectionChange={(values) => handleTempFilterChange('sourceTeamLead', values)}
                  onOpenChange={(open) => setActiveOpenKey(open ? 'sourceTeamLead' : null)}
                  deferChangeUntilClose
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Source RM</label>
                <CustomMultiSelectFilter
                  label="Source RM"
                  options={safeFilterOptions.sourceRms}
                  selected={safeFilters.sourceRm}
                  onSelectionChange={(values) => handleTempFilterChange('sourceRm', values)}
                  onOpenChange={(open) => setActiveOpenKey(open ? 'sourceRm' : null)}
                  deferChangeUntilClose
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Dealer</label>
                <CustomMultiSelectFilter
                  label="Dealer"
                  options={safeFilterOptions.dealers}
                  selected={safeFilters.dealer}
                  onSelectionChange={(values) => handleTempFilterChange('dealer', values)}
                  onOpenChange={(open) => setActiveOpenKey(open ? 'dealer' : null)}
                  deferChangeUntilClose
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Lender</label>
                <CustomMultiSelectFilter
                  label="Lender"
                  options={safeFilterOptions.lenders}
                  selected={safeFilters.lender}
                  onSelectionChange={(values) => handleTempFilterChange('lender', values)}
                  onOpenChange={(open) => setActiveOpenKey(open ? 'lender' : null)}
                  deferChangeUntilClose
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Repayment</label>
                <CustomMultiSelectFilter
                  label="Repayment"
                  options={safeFilterOptions.repayments}
                  selected={safeFilters.repayment}
                  onSelectionChange={(values) => handleTempFilterChange('repayment', values)}
                  onOpenChange={(open) => setActiveOpenKey(open ? 'repayment' : null)}
                  deferChangeUntilClose
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">PTP Date</label>
                <CustomMultiSelectFilter
                  label="PTP Date"
                  options={safeFilterOptions.ptpDateOptions}
                  selected={safeFilters.ptpDate}
                  onSelectionChange={(values) => handleTempFilterChange('ptpDate', values)}
                  onOpenChange={(open) => setActiveOpenKey(open ? 'ptpDate' : null)}
                  deferChangeUntilClose
                />
              </div>

              {/* Last Month Status Filter - Hidden as requested */}
              {/* <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Last Month Status</label>
                <CustomMultiSelectFilter
                  label="Last Month Status"
                  options={safeFilterOptions.lastMonthBounce}
                  selected={safeFilters.lastMonthBounce}
                  onSelectionChange={(values) => handleTempFilterChange('lastMonthBounce', values)}
                />
              </div> */}
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1 px-6 py-2"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="flex-1 px-8 py-2 text-base font-semibold"
                onClick={handleApplyFilters}
              >
                Done
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default MobileFilterBar;
