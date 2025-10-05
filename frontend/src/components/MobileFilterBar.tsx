import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import CustomMultiSelectFilter from "./CustomMultiSelectFilter";

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
  };
  emiMonthOptions?: string[];
  selectedEmiMonth?: string | null;
  onEmiMonthChange?: (month: string) => void;
}

const MobileFilterBar = ({ filters, onFilterChange, availableOptions, emiMonthOptions, selectedEmiMonth, onEmiMonthChange }: MobileFilterBarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Temporary filters - what user is currently selecting
  const [tempFilters, setTempFilters] = useState(filters);

  // Update temp filters when applied filters change
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  // Ensure all filter options have default empty arrays
  const safeFilterOptions = {
    branches: availableOptions?.branches || [],
    teamLeads: availableOptions?.team_leads || [], // Use team_leads from availableOptions
    rms: availableOptions?.rms || [],
    sourceTeamLeads: availableOptions?.source_team_leads || [],
    sourceRms: availableOptions?.source_rms || [],
    dealers: availableOptions?.dealers || [],
    lenders: availableOptions?.lenders || [],
    statuses: availableOptions?.statuses || [],
    repayments: availableOptions?.repayments || [],
    lastMonthBounce: availableOptions?.lastMonthBounce || [],
    ptpDateOptions: availableOptions?.ptpDateOptions || [],
  };

  // Debug logging for filter options
  useEffect(() => {
    console.log('🔍 MobileFilterBar: Received availableOptions:', availableOptions);
    console.log('🔍 MobileFilterBar: Safe filter options:', safeFilterOptions);
    console.log('🔍 MobileFilterBar: Repayments options:', safeFilterOptions.repayments);
    console.log('🔍 MobileFilterBar: PTP Date options:', safeFilterOptions.ptpDateOptions);
    console.log('🔍 MobileFilterBar: Last Month Bounce options:', safeFilterOptions.lastMonthBounce);
  }, [availableOptions, safeFilterOptions]);

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
  };

  // Count active filters (use applied filters for badge)
  const activeFilterCount = Object.values(filters).reduce(
    (count, filterArray) => count + (filterArray?.length || 0), 
    0
  );

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

  // Cancel changes and reset to applied filters
  const handleCancel = () => {
    setTempFilters(filters);
    setIsOpen(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50"
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
        
        <CollapsibleContent>
          <div className="p-4 space-y-6 border-t">
            <h3 className="font-medium text-gray-900 text-sm">Filter Applications</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">PTP Date</label>
                <CustomMultiSelectFilter
                  label="PTP Date"
                  options={safeFilterOptions.ptpDateOptions}
                  selected={safeFilters.ptpDate}
                  onSelectionChange={(values) => handleTempFilterChange('ptpDate', values)}
                />
              </div>

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

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Branches</label>
                <CustomMultiSelectFilter
                  label="Branches"
                  options={safeFilterOptions.branches}
                  selected={safeFilters.branch}
                  onSelectionChange={(values) => handleTempFilterChange('branch', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Current Team Leads</label>
                <CustomMultiSelectFilter
                  label="Current Team Leads"
                  options={safeFilterOptions.teamLeads}
                  selected={safeFilters.teamLead}
                  onSelectionChange={(values) => handleTempFilterChange('teamLead', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Current RMs</label>
                <CustomMultiSelectFilter
                  label="Current RMs"
                  options={safeFilterOptions.rms}
                  selected={safeFilters.rm}
                  onSelectionChange={(values) => handleTempFilterChange('rm', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Source Team Leads</label>
                <CustomMultiSelectFilter
                  label="Source Team Leads"
                  options={safeFilterOptions.sourceTeamLeads}
                  selected={safeFilters.sourceTeamLead}
                  onSelectionChange={(values) => handleTempFilterChange('sourceTeamLead', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Source RMs</label>
                <CustomMultiSelectFilter
                  label="Source RMs"
                  options={safeFilterOptions.sourceRms}
                  selected={safeFilters.sourceRm}
                  onSelectionChange={(values) => handleTempFilterChange('sourceRm', values)}
                />
              </div>


              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Dealers</label>
                <CustomMultiSelectFilter
                  label="Dealers"
                  options={safeFilterOptions.dealers}
                  selected={safeFilters.dealer}
                  onSelectionChange={(values) => handleTempFilterChange('dealer', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Lenders</label>
                <CustomMultiSelectFilter
                  label="Lenders"
                  options={safeFilterOptions.lenders}
                  selected={safeFilters.lender}
                  onSelectionChange={(values) => handleTempFilterChange('lender', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Status</label>
                <CustomMultiSelectFilter
                  label="Status"
                  options={safeFilterOptions.statuses}
                  selected={safeFilters.status}
                  onSelectionChange={(values) => handleTempFilterChange('status', values)}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">Repayment</label>
                <CustomMultiSelectFilter
                  label="Repayment"
                  options={safeFilterOptions.repayments}
                  selected={safeFilters.repayment}
                  onSelectionChange={(values) => handleTempFilterChange('repayment', values)}
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
              <div className="border border-blue-500 rounded-lg p-2 bg-blue-50 flex-1">
                <Button
                  variant="default"
                  className="w-full px-8 py-2 text-base font-semibold"
                  onClick={handleApplyFilters}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default MobileFilterBar;
