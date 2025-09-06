
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Application } from '@/types/application';
import { PlanVsAchievementApplication } from '@/types/planVsAchievement';
import PlanVsAchievementRow from './PlanVsAchievementRow';
import { getChangeSummary } from '@/utils/planVsAchievementUtils';

interface PlanVsAchievementTableProps {
  loading: boolean;
  reportData: PlanVsAchievementApplication[];
  sortedReportData: PlanVsAchievementApplication[];
  applications: Application[];
  commentsByApp: Record<string, Array<{content: string; user_name: string}>>;
  selectedDate: Date | undefined;
  selectedApplication: Application | null;
  onExportReport: () => void;
  onApplicationSelect: (app: Application) => void;
}

const PlanVsAchievementTable = ({
  loading,
  reportData,
  sortedReportData,
  applications,
  commentsByApp,
  selectedDate,
  selectedApplication,
  onExportReport,
  onApplicationSelect
}: PlanVsAchievementTableProps) => {
  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <Filter className="h-5 w-5 text-gray-600" />
              {loading ? 'Loading Analysis...' : `Analysis Results (${reportData.length} applications)`}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-1">
              Plan vs achievement analysis for {selectedDate && format(selectedDate, "MMMM dd, yyyy")}
            </CardDescription>
          </div>
          {reportData.length > 0 && (
            <Button 
              onClick={onExportReport}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              size="lg"
            >
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-lg font-medium text-gray-600">Analyzing planned vs achievements...</p>
            </div>
          </div>
        ) : reportData.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <p className="text-xl font-medium text-gray-600">No Data Found</p>
                <p className="text-gray-500 mt-2">No applications found with PTP set for the selected date and time</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                  <TableHead className="font-bold text-gray-900 w-80 py-4">Application Details</TableHead>
                  <TableHead className="font-bold text-gray-900 text-center py-4">Previous PTP Date</TableHead>
                  <TableHead className="font-bold text-gray-900 text-center py-4">Previous Status</TableHead>
                  <TableHead className="font-bold text-gray-900 text-center py-4">Updated PTP Date</TableHead>
                  <TableHead className="font-bold text-gray-900 text-center py-4">Updated Status</TableHead>
                  <TableHead className="font-bold text-gray-900 text-center py-4">Change Summary</TableHead>
                  <TableHead className="font-bold text-gray-900 py-4">Comment Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedReportData.map((item, index) => {
                  const application = applications.find(app => app.applicant_id === item.applicant_id);
                  const changeSummary = getChangeSummary(item);
                  const comments = commentsByApp[item.applicant_id] || [];
                  
                  return (
                    <PlanVsAchievementRow
                      key={item.applicant_id}
                      item={item}
                      index={index}
                      application={application}
                      changeSummary={changeSummary}
                      comments={comments}
                      selectedApplication={selectedApplication}
                      onApplicationSelect={onApplicationSelect}
                    />
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlanVsAchievementTable;
