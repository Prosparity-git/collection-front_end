import { useRef, useState, useEffect, useMemo } from "react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import FilterHeader from "@/components/filters/FilterHeader";
import FilterContent from "@/components/filters/FilterContent";
import { calculateActiveFilterCount } from "@/utils/filterUtils";
import { FiltersService } from "@/integrations/api/services";

interface FilterBarProps {
  filters: any;
  availableOptions: any;
  onFilterChange: (key: string, values: string[]) => void;
  selectedEmiMonth?: string | null;
  onEmiMonthChange?: (month: string) => void;
  emiMonthOptions?: string[];
}

const FilterBar = ({
  filters,
  availableOptions = {}, // Default to empty object
  onFilterChange,
  selectedEmiMonth,
  onEmiMonthChange,
  emiMonthOptions = []
}: FilterBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
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

  // Update temp filters when applied filters change
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  // Seed idMaps on mount
  useEffect(() => {
    const seed = async () => {
      try {
        const res = await FiltersService.getCascadingOptions({});
        const toMap = (arr: { id: number; name: string }[]) => 
          Object.fromEntries(arr.map(i => [i.name, i.id])) as Record<string, number>;
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

  // Calculate total active filters with proper typing (use applied filters for badge)
  const activeFilterCount = calculateActiveFilterCount(filters);

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

  // Clear all filters (both temp and applied)
  const clearAllFilters = () => {
    const emptyFilters = Object.keys(filters).reduce((acc, key) => {
      acc[key] = [];
      return acc;
    }, {} as any);
    
    setTempFilters(emptyFilters);
    Object.keys(emptyFilters).forEach(key => {
      onFilterChange(key, []);
    });
  };

  // Reset temporary filters to match applied filters (cancel changes)
  const handleCancel = () => {
    setTempFilters(filters);
    setIsOpen(false);
  };

  console.log('FilterBar render - available options:', {
    statuses: availableOptions?.statuses?.length || 0,
    ptpDateOptions: availableOptions?.ptpDateOptions?.length || 0,
    branches: availableOptions?.branches?.length || 0,
    repayments: availableOptions?.repayments?.length || 0,
    lastMonthBounce: availableOptions?.lastMonthBounce?.length || 0
  });

  // Build selected IDs from names using idMaps
  const buildSelectedIds = () => {
    const pickFirstId = (map: Record<string, number>, names: string[] | undefined) => {
      if (!names || names.length === 0) return undefined;
      const first = names[0];
      return map[first];
    };

    return {
      branch_id: pickFirstId(idMaps.branches, tempFilters.branch),
      tl_id: pickFirstId(idMaps.team_leads, tempFilters.teamLead),
      rm_id: pickFirstId(idMaps.rms, tempFilters.rm),
      source_tl_id: pickFirstId(idMaps.source_team_leads, tempFilters.sourceTeamLead),
      source_rm_id: pickFirstId(idMaps.source_rms, tempFilters.sourceRm),
      dealer_id: pickFirstId(idMaps.dealers, tempFilters.dealer),
      lender_id: pickFirstId(idMaps.lenders, tempFilters.lender)
    };
  };

  // Helper to merge id maps from API response
  const mergeIdMaps = (items: { id: number; name: string }[]) =>
    Object.fromEntries(items.map(i => [i.name, i.id])) as Record<string, number>;

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

  // Debounced live cascading while panel is open
  useEffect(() => {
    if (!isOpen) {
      setCascadeOverrides({});
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const params = buildSelectedIds();
        const res = await FiltersService.getCascadingOptions(params);

        // Update id maps by merging
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
        // This ensures that when a filter is selected, all dependent filters show the correct filtered options
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
    }, 250);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tempFilters]);

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

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <FilterHeader
        isOpen={isOpen}
        activeFilterCount={activeFilterCount}
        selectedEmiMonth={selectedEmiMonth}
        onEmiMonthChange={onEmiMonthChange}
        emiMonthOptions={emiMonthOptions}
        onClearAllFilters={clearAllFilters}
      />

      <CollapsibleContent>
        <FilterContent
          filters={tempFilters}
          availableOptions={mergedAvailableOptions || {}}
          onFilterChange={handleTempFilterChange}
          onClose={handleApplyFilters}
          onCancel={handleCancel}
        />
      </CollapsibleContent>
    </Collapsible>
  );
};

export default FilterBar;
