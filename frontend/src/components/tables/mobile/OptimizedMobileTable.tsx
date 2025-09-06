
import { memo } from "react";
import { Application } from "@/types/application";
import MobileApplicationCard from "./MobileApplicationCard";

interface OptimizedMobileTableProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  selectedApplicationId?: string;
  selectedEmiMonth?: string | null;
}

const OptimizedMobileTable = memo(({ 
  applications, 
  onRowClick, 
  selectedApplicationId,
  selectedEmiMonth 
}: OptimizedMobileTableProps) => {
  if (applications.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium text-gray-500">No applications found</p>
          <p className="text-sm text-gray-400">Try adjusting your filters or search terms</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => (
        <MobileApplicationCard
          key={app.id}
          application={app}
          onRowClick={onRowClick}
          selectedApplicationId={selectedApplicationId}
          selectedMonth={selectedEmiMonth || ''}
        />
      ))}
    </div>
  );
});

OptimizedMobileTable.displayName = "OptimizedMobileTable";

export default OptimizedMobileTable;
