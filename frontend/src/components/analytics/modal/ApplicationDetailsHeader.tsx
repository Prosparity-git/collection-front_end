
import { FileText, Users, MapPin, Download } from 'lucide-react';
import { DrillDownFilter } from '@/pages/Analytics';
import { Button } from '@/components/ui/button';
import { useExport } from '@/hooks/useExport';
import { Application } from '@/types/application';
import ModalFilterDescription from './ModalFilterDescription';

interface ApplicationDetailsHeaderProps {
  applicationsCount: number;
  filter: DrillDownFilter | null;
  applications: Application[];
}

const ApplicationDetailsHeader = ({ applicationsCount, filter, applications }: ApplicationDetailsHeaderProps) => {
  const { exportToExcel } = useExport();

  const handleExport = () => {
    const exportData = { applications };
    exportToExcel(exportData, 'analytics-drill-down-report');
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-start gap-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold text-gray-900">
            Application Details
          </h2>
        </div>
        <div className="flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-3 w-3" />
            Export
          </Button>
        </div>
      </div>
      <p className="text-lg">
        <ModalFilterDescription filter={filter} />
      </p>
      <div className="flex items-center gap-6 text-gray-600">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <span className="font-medium text-lg">{applicationsCount} applications</span>
        </div>
        {filter?.branch_name && (
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <span className="text-lg">{filter.branch_name}</span>
          </div>
        )}
        {filter?.rm_name && (
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span className="text-lg">{filter.rm_name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplicationDetailsHeader;
