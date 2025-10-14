import { VEHICLE_STATUS_OPTIONS } from "@/constants/options";

interface VehicleStatusBadgeProps {
  vehicleStatus?: string | null;
  className?: string;
}

const VehicleStatusBadge = ({ vehicleStatus, className = "" }: VehicleStatusBadgeProps) => {
  // Handle null, undefined, or empty values
  if (!vehicleStatus || vehicleStatus.trim() === '') {
    return null;
  }

  // Find the matching option from constants
  const statusOption = VEHICLE_STATUS_OPTIONS.find(option => 
    option.value.toLowerCase() === vehicleStatus.toLowerCase()
  );

  // If no exact match found, try to find by label
  const statusOptionByLabel = VEHICLE_STATUS_OPTIONS.find(option => 
    option.label.toLowerCase() === vehicleStatus.toLowerCase()
  );

  const matchedOption = statusOption || statusOptionByLabel;

  // If still no match, create a default option for unknown statuses
  const displayOption = matchedOption || {
    value: vehicleStatus,
    label: vehicleStatus,
    color: "bg-gray-100 text-gray-800 border border-gray-200"
  };

  return (
    <span 
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${displayOption.color} ${className}`}
    >
      {displayOption.label}
    </span>
  );
};

export default VehicleStatusBadge;
