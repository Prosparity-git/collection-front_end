import { Application } from "@/types/application";
import SimpleApplicationsTable from "@/components/tables/SimpleApplicationsTable";
import PaginationControls from "@/components/PaginationControls";
import { useIsMobile } from "@/hooks/use-mobile";
import OptimizedMobileTable from "@/components/tables/mobile/OptimizedMobileTable";

interface MainContentProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  onApplicationDeleted?: () => void;
  selectedApplicationId?: string;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalCount: number;
  pageSize: number;
  selectedEmiMonth?: string | null;
}

const MainContent = ({
  applications,
  onRowClick,
  selectedApplicationId,
  currentPage,
  totalPages,
  onPageChange,
  totalCount,
  pageSize,
  selectedEmiMonth
}: MainContentProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4">
      {/* Results Summary - Only show when there are applications */}
      {applications.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs sm:text-sm text-gray-600 gap-2 sm:gap-0">
          <span>
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} applications
          </span>
          {totalCount >= 1000 && (
            <span className="text-amber-600 font-medium text-xs sm:text-sm">
              Showing first 1,000 results
          </span>
          )}
        </div>
      )}

      {/* Table */}
      {isMobile ? (
        <OptimizedMobileTable
          applications={applications}
          onRowClick={onRowClick}
          selectedApplicationId={selectedApplicationId}
          selectedEmiMonth={selectedEmiMonth}
        />
      ) : (
        <SimpleApplicationsTable
          applications={applications}
          onRowClick={onRowClick}
          selectedApplicationId={selectedApplicationId}
          selectedEmiMonth={selectedEmiMonth}
        />
      )}

      {/* Pagination - Only show when there are applications */}
      {applications.length > 0 && totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalCount={totalCount}
          pageSize={pageSize}
        />
      )}
    </div>
  );
};

export default MainContent;

