import { CircleUser } from "lucide-react";
import { Application } from "@/types/application";
import { formatCurrency, formatEmiMonth } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";
import VehicleStatusBadge from "../VehicleStatusBadge";

interface ApplicationHeaderProps {
  application: Application;
}

const ApplicationHeader = ({ application }: ApplicationHeaderProps) => {
  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <div className="p-2 sm:p-3 bg-blue-100 rounded-full">
        <CircleUser className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
            {application.applicant_name}
          </h3>
          <VehicleStatusBadge vehicleStatus={application.vehicle_status} />
        </div>
        <div className="space-y-1 text-xs sm:text-sm text-gray-600">
          {application.demand_date && (
            <div>
              <span className="font-medium">EMI Month:</span> {formatEmiMonth(application.demand_date)}
            </div>
          )}
          {application.emi_amount != null && (
            <div>
              <span className="font-medium">EMI Due:</span> {formatCurrency(application.emi_amount)}
            </div>
          )}
          <div>
            <span className="font-medium">Total POS:</span> {application.total_pos != null && !isNaN(application.total_pos) ? formatCurrency(application.total_pos) : 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationHeader;
