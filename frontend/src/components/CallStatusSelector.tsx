
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CallStatusSelectorProps {
  currentStatus?: string;
  onStatusChange: (status: string) => void;
  disabled?: boolean;
}

// Updated calling status options according to the table
// ID: 1=Answered, 2=Not Answered, 3=Not Called
const CALLING_STATUS_OPTIONS = [
  { value: "3", display: "Not Called", color: "text-gray-600" },
  { value: "2", display: "Not Answered", color: "text-red-600" },
  { value: "1", display: "Answered", color: "text-green-600" }
];

const CallStatusSelector = ({ currentStatus, onStatusChange, disabled }: CallStatusSelectorProps) => {
  // Debug logging to track status changes
  console.log('🔄 CallStatusSelector: Rendering with currentStatus:', currentStatus);
  
  // Convert string status to integer ID for display
  const getDisplayValue = (status: string | undefined) => {
    if (!status) return "3"; // Default to "Not Called"
    
    // If status is already a number (ID), return it directly
    if (["1", "2", "3"].includes(status)) {
      return status;
    }
    
    // If status is a string description, convert to ID
    const statusMap: Record<string, string> = {
      "answered": "1",
      "not answered": "2", 
      "not called": "3"
    };
    
    const result = statusMap[status.toLowerCase()] || "3";
    console.log('🔄 CallStatusSelector: Converting status:', status, 'to display value:', result);
    return result;
  };

  const currentOption = CALLING_STATUS_OPTIONS.find(opt => opt.value === getDisplayValue(currentStatus)) || CALLING_STATUS_OPTIONS[0];

  const handleValueChange = (value: string) => {
    console.log('🔄 CallStatusSelector: Status changed from', currentStatus, 'to', value);
    console.log('🔄 CallStatusSelector: Calling onStatusChange with value:', value);
    onStatusChange(value);
  };

  return (
    <Select 
      value={getDisplayValue(currentStatus)} 
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={`w-40 h-8 text-xs ${currentOption.color}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {CALLING_STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value} className={`text-xs ${option.color}`}>
            {option.display}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CallStatusSelector;
