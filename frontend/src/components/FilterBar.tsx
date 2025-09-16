import { useState, useEffect } from "react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import FilterHeader from "@/components/filters/FilterHeader";
import FilterContent from "@/components/filters/FilterContent";
import { calculateActiveFilterCount } from "@/utils/filterUtils";

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

  // Update temp filters when applied filters change
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  // Calculate total active filters with proper typing (use applied filters for badge)
  const activeFilterCount = calculateActiveFilterCount(filters);

  // Handle temporary filter changes (doesn't trigger API calls)
  const handleTempFilterChange = (key: string, values: string[]) => {
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
          availableOptions={availableOptions || {}}
          onFilterChange={handleTempFilterChange}
          onClose={handleApplyFilters}
          onCancel={handleCancel}
        />
      </CollapsibleContent>
    </Collapsible>
  );
};

export default FilterBar;
