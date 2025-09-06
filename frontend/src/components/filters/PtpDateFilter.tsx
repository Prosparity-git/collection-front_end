
import CustomMultiSelectFilter from "@/components/CustomMultiSelectFilter";
import { useEffect } from "react";

interface PtpDateFilterProps {
  selectedValues: string[];
  onValueChange: (values: string[]) => void;
  availableOptions: string[];
}

const PtpDateFilter = ({ selectedValues, onValueChange, availableOptions }: PtpDateFilterProps) => {
  // Debug logging for options
  useEffect(() => {
    console.log('🔍 PtpDateFilter: Received availableOptions:', availableOptions);
    console.log('🔍 PtpDateFilter: Options length:', availableOptions?.length);
    console.log('🔍 PtpDateFilter: Selected values:', selectedValues);
  }, [availableOptions, selectedValues]);

  // Since the backend already returns display labels like "Overdue PTP", "Today's PTP", etc.
  // we can use them directly without conversion
  const displayOptions = availableOptions || [];

  const handleChange = (selectedLabels: string[]) => {
    // Pass the selected display labels directly since that's what the backend expects
    onValueChange(selectedLabels);
  };

  return (
    <CustomMultiSelectFilter
      label="PTP Date"
      options={displayOptions}
      selected={selectedValues}
      onSelectionChange={handleChange}
      placeholder="Select PTP dates"
    />
  );
};

export default PtpDateFilter;
