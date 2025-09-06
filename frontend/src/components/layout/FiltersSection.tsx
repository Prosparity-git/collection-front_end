import { useIsMobile } from "@/hooks/use-mobile";
import FilterBar from "@/components/FilterBar";
import MobileFilterBar from "@/components/MobileFilterBar";
import SearchBar from "@/components/SearchBar";
import { useEffect } from "react";

interface FiltersSectionProps {
  filters: any;
  availableOptions: any;
  onFilterChange: (key: string, values: string[]) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedEmiMonth?: string | null;
  onEmiMonthChange?: (month: string) => void;
  emiMonthOptions?: string[];
  loading?: boolean;
  searchLoading?: boolean;
  totalCount?: number;
}

const FiltersSection = ({
  filters,
  availableOptions,
  onFilterChange,
  searchTerm,
  onSearchChange,
  selectedEmiMonth,
  onEmiMonthChange,
  emiMonthOptions = [],
  loading = false,
  searchLoading = false,
  totalCount
}: FiltersSectionProps) => {
  const isMobile = useIsMobile();

  // Debug logging for filter options
  useEffect(() => {
    console.log('🔍 FiltersSection: Received availableOptions:', availableOptions);
    console.log('🔍 FiltersSection: Repayments options:', availableOptions?.repayments);
    console.log('🔍 FiltersSection: PTP Date options:', availableOptions?.ptpDateOptions);
    console.log('🔍 FiltersSection: Last Month Bounce options:', availableOptions?.lastMonthBounce);
  }, [availableOptions]);

  return (
    <div className="space-y-4">
      {/* Filters Dropdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {isMobile ? (
          <MobileFilterBar
            filters={filters}
            availableOptions={availableOptions}
            onFilterChange={onFilterChange}
            emiMonthOptions={emiMonthOptions}
            selectedEmiMonth={selectedEmiMonth}
            onEmiMonthChange={onEmiMonthChange}
          />
        ) : (
          <FilterBar
            filters={filters}
            availableOptions={availableOptions}
            onFilterChange={onFilterChange}
            selectedEmiMonth={selectedEmiMonth}
            onEmiMonthChange={onEmiMonthChange}
            emiMonthOptions={emiMonthOptions}
          />
        )}
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <SearchBar
          value={searchTerm}
          onChange={onSearchChange}
          placeholder="Search by application name or ID..."
          loading={searchLoading}
          resultCount={searchTerm ? totalCount : undefined}
        />
      </div>
    </div>
  );
};

export default FiltersSection;
