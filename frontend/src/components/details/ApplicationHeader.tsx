import { CircleUser } from "lucide-react";
import { Application } from "@/types/application";
import { formatCurrency, formatEmiMonth } from "@/utils/formatters";
import { Badge } from "@/components/ui/badge";

interface ApplicationHeaderProps {
  application: Application;
}

const VEHICLE_STATUS_COLORS: { [key: string]: string } = {
  "Risky": "bg-yellow-500 text-white",
  "Repossessed": "bg-red-600 text-white",
  "Might Need to Repossess": "bg-orange-500 text-white",
};

const ApplicationHeader = ({ application }: ApplicationHeaderProps) => {
  const statusColor = application.vehicle_status 
    ? VEHICLE_STATUS_COLORS[application.vehicle_status] || "bg-gray-400 text-white" 
    : "";

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
          {application.vehicle_status && (
            <Badge className={statusColor}>{application.vehicle_status}</Badge>
          )}
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
        </div>
      </div>
    </div>
  );
};

export default ApplicationHeader;
