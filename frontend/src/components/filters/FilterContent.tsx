import { Button } from "@/components/ui/button";
import CustomMultiSelectFilter from "@/components/CustomMultiSelectFilter";
import PtpDateFilter from "@/components/filters/PtpDateFilter";
import { useState } from "react";

interface FilterContentProps {
  filters: any;
  availableOptions: any;
  onFilterChange: (key: string, values: string[]) => void;
  onClose?: () => void;
  onCancel?: () => void;
  onDropdownOpenChange?: (key: string, open: boolean) => void;
}

const FilterContent = ({ filters, availableOptions, onFilterChange, onClose, onCancel, onDropdownOpenChange }: FilterContentProps) => {
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const setOpen = (key: string) => (v: boolean) => {
    setOpenMap(prev => ({ ...prev, [key]: v }));
    onDropdownOpenChange?.(key, v);
  };

  return (
    <div className="p-4 bg-gray-50 border-b">
      {/* Main Filters Section */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Main Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Branch Filter */}
          <CustomMultiSelectFilter
            label="Branch"
            options={availableOptions.branches || []}
            selected={filters.branch || []}
            onSelectionChange={(values) => onFilterChange('branch', values)}
            placeholder="Select branches"
            onOpenChange={setOpen('branch')}
            deferChangeUntilClose
          />

          {/* Current Team Lead Filter (Collection TL) */}
          <CustomMultiSelectFilter
            label="Collection TL"
            options={availableOptions.team_leads || []}
            selected={filters.teamLead || []}
            onSelectionChange={(values) => onFilterChange('teamLead', values)}
            placeholder="Select team leads"
            onOpenChange={setOpen('teamLead')}
            deferChangeUntilClose
          />

          {/* Current RM Filter (Collection RM) */}
          <CustomMultiSelectFilter
            label="Collection RM"
            options={availableOptions.rms || []}
            selected={filters.rm || []}
            onSelectionChange={(values) => onFilterChange('rm', values)}
            placeholder="Select RMs"
            onOpenChange={setOpen('rm')}
            deferChangeUntilClose
          />

          {/* DPD Bucket Filter */}
          <CustomMultiSelectFilter
            label="DPD Bucket"
            options={availableOptions.dpd_buckets || []}
            selected={filters.dpdBucket || []}
            onSelectionChange={(values) => onFilterChange('dpdBucket', values)}
            placeholder="Select DPD buckets"
            onOpenChange={setOpen('dpdBucket')}
            deferChangeUntilClose
          />

          {/* Status Filter */}
          <CustomMultiSelectFilter
            label="Status"
            options={availableOptions.statuses || []}
            selected={filters.status || []}
            onSelectionChange={(values) => onFilterChange('status', values)}
            placeholder="Select status"
            onOpenChange={setOpen('status')}
            deferChangeUntilClose
          />
        </div>
      </div>

      {/* Other Filters Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Other Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Source Team Lead Filter */}
          <CustomMultiSelectFilter
            label="Source Team Lead"
            options={availableOptions.source_team_leads || []}
            selected={filters.sourceTeamLead || []}
            onSelectionChange={(values) => onFilterChange('sourceTeamLead', values)}
            placeholder="Select source team leads"
            onOpenChange={setOpen('sourceTeamLead')}
            deferChangeUntilClose
          />

          {/* Source RM Filter */}
          <CustomMultiSelectFilter
            label="Source RM"
            options={availableOptions.source_rms || []}
            selected={filters.sourceRm || []}
            onSelectionChange={(values) => onFilterChange('sourceRm', values)}
            placeholder="Select source RMs"
            onOpenChange={setOpen('sourceRm')}
            deferChangeUntilClose
          />

          {/* Dealer Filter */}
          <CustomMultiSelectFilter
            label="Dealer"
            options={availableOptions.dealers || []}
            selected={filters.dealer || []}
            onSelectionChange={(values) => onFilterChange('dealer', values)}
            placeholder="Select dealers"
            onOpenChange={setOpen('dealer')}
            deferChangeUntilClose
          />

          {/* Lender Filter */}
          <CustomMultiSelectFilter
            label="Lender"
            options={availableOptions.lenders || []}
            selected={filters.lender || []}
            onSelectionChange={(values) => onFilterChange('lender', values)}
            placeholder="Select lenders"
            onOpenChange={setOpen('lender')}
            deferChangeUntilClose
          />

          {/* Repayment Filter */}
          <CustomMultiSelectFilter
            label="Repayment"
            options={availableOptions.repayments || []}
            selected={filters.repayment || []}
            onSelectionChange={(values) => onFilterChange('repayment', values)}
            placeholder="Select repayment"
            onOpenChange={setOpen('repayment')}
            deferChangeUntilClose
          />

          {/* PTP Date Filter */}
          <PtpDateFilter
            selectedValues={filters.ptpDate || []}
            onValueChange={(values) => onFilterChange('ptpDate', values)}
            availableOptions={availableOptions.ptpDateOptions || []}
          />

          {/* Last Month Bounce Filter - Hidden as requested */}
          {/* <CustomMultiSelectFilter
            label="Last Month Bounce"
            options={availableOptions.lastMonthBounce || []}
            selected={filters.lastMonthBounce || []}
            onSelectionChange={(values) => onFilterChange('lastMonthBounce', values)}
            placeholder="Select bounce status"
          /> */}

          {/* Vehicle Status Filter - Hidden as requested */}
          {/* <CustomMultiSelectFilter
            label="Vehicle Status"
            options={availableOptions.vehicle_statuses || []}
            selected={filters.vehicleStatus || []}
            onSelectionChange={(values) => onFilterChange('vehicleStatus', values)}
            placeholder="Select vehicle status"
          /> */}
        </div>
      </div>

      {/* Action Buttons */}
      {(onClose || onCancel) && (
        <div className="mt-6 flex justify-end gap-3">
          {onCancel && (
            <Button
              variant="outline"
              className="px-6 py-2"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          {onClose && (
            <Button
              variant="default"
              className="px-8 py-2 text-base font-semibold"
              onClick={onClose}
            >
              Done
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterContent;
