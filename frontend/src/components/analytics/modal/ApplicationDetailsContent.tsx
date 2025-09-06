
import { FileText } from 'lucide-react';
import { Application } from '@/types/application';
import OptimizedApplicationsTable from '@/components/tables/OptimizedApplicationsTable';

interface ApplicationDetailsContentProps {
  applications: Application[];
  onApplicationSelect: (app: Application) => void;
  selectedEmiMonth?: string | null;
  statusData?: Record<string, string>;
  batchData?: any;
}

const ApplicationDetailsContent = ({ applications, onApplicationSelect, selectedEmiMonth, statusData, batchData }: ApplicationDetailsContentProps) => {
  if (applications.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center space-y-4">
        <div>
          <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-900">No applications found</h3>
          <p className="text-gray-500">No applications match the selected criteria.</p>
        </div>
      </div>
    );
  }

  console.log('ApplicationDetailsContent - Batch data passed:', !!batchData, batchData ? {
    statuses: Object.keys(batchData.statuses || {}).length,
    comments: Object.keys(batchData.comments || {}).length,
    ptpDates: Object.keys(batchData.ptpDates || {}).length,
    contactStatuses: Object.keys(batchData.contactStatuses || {}).length
  } : 'No batch data');

  return (
    <div className="h-full overflow-auto">
      <OptimizedApplicationsTable
        applications={applications}
        onRowClick={onApplicationSelect}
        selectedEmiMonth={selectedEmiMonth}
        preloadedStatusData={statusData}
        preloadedBatchData={batchData}
      />
    </div>
  );
};

export default ApplicationDetailsContent;
