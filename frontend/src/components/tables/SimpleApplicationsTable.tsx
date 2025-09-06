import { memo } from "react";
import { Application } from "@/types/application";
import TableHeader from "./TableHeader";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import StatusBadge from "./StatusBadge";
import ApplicationRow from "./ApplicationRow";
import { useCentralizedDataManager } from '@/hooks/useCentralizedDataManager';
import { useEffect } from 'react';

interface SimpleApplicationsTableProps {
  applications: Application[];
  onRowClick: (application: Application) => void;
  selectedApplicationId?: string;
  selectedEmiMonth?: string | null;
}

const SimpleApplicationsTable = memo(({
  applications,
  onRowClick,
  selectedApplicationId,
  selectedEmiMonth
}: SimpleApplicationsTableProps) => {
  const { data, loading, fetchAllData, clearData } = useCentralizedDataManager(selectedEmiMonth);

  // Extract application IDs
  const applicationIds = applications.map(app => app.applicant_id);

  useEffect(() => {
    clearData();
    if (applicationIds.length > 0) {
      fetchAllData(applicationIds, { selectedEmiMonth });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationIds.join(","), selectedEmiMonth]);

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
      {applications.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader />
            <TableBody>
              {applications.map((application) => (
                <ApplicationRow
                  key={application.id}
                  application={application}
                  selectedApplicationId={selectedApplicationId}
                  onRowClick={onRowClick}
                  batchedStatus={data.statuses[application.applicant_id] || 'Unpaid'}
                  batchedPtpDate={data.ptpDates[application.applicant_id] || null}
                  batchedContactStatus={data.contactStatuses[application.applicant_id]}
                  batchedComments={data.comments[application.applicant_id] || []}
                  isLoading={loading}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium text-gray-500">No applications found</p>
          <p className="text-sm text-gray-400">Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );
});

SimpleApplicationsTable.displayName = "SimpleApplicationsTable";

export default SimpleApplicationsTable;
