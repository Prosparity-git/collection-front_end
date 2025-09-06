import { useState, useEffect, useRef } from 'react';
import { usePlanVsAchievementData } from '@/hooks/exports/usePlanVsAchievementData';
import { usePlanVsAchievementReport } from '@/hooks/exports/usePlanVsAchievementReport';
import { Application } from '@/types/application';
import { PlanVsAchievementApplication } from '@/types/planVsAchievement';
import ApplicationDetailsPanel from '@/components/ApplicationDetailsPanel';
import { useComments } from '@/hooks/useComments';
import PlanVsAchievementHeader from './planVsAchievement/PlanVsAchievementHeader';
import PlanVsAchievementSummary from './planVsAchievement/PlanVsAchievementSummary';
import PlanVsAchievementTable from './planVsAchievement/PlanVsAchievementTable';
import { convertToApplications, getChangePriority } from '@/utils/planVsAchievementUtils';
import ReactDOM from 'react-dom';

const PlanVsAchievementTab = () => {
  // Set default to today and 11AM
  const today = new Date();
  const defaultDateTime = new Date(today);
  defaultDateTime.setHours(11, 0, 0, 0);
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(today);
  const [selectedTime, setSelectedTime] = useState<string>('11:00');
  const [reportData, setReportData] = useState<PlanVsAchievementApplication[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [commentsByApp, setCommentsByApp] = useState<Record<string, Array<{content: string; user_name: string}>>>({});

  const { fetchPlanVsAchievementData, loading } = usePlanVsAchievementData();
  const { exportPlanVsAchievementReport } = usePlanVsAchievementReport();
  const { fetchCommentsByApplications } = useComments();

  const getSelectedDateTime = (): Date | null => {
    if (!selectedDate) return null;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const dateTime = new Date(selectedDate);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime;
  };

  // Sort applications by change priority
  const sortedReportData = [...reportData].sort((a, b) => {
    return getChangePriority(a) - getChangePriority(b);
  });

  // Calculate summary statistics
  const getSummaryStats = () => {
    const total = reportData.length;
    const statusChanged = reportData.filter(item => item.previous_status !== item.updated_status).length;
    const ptpUpdated = reportData.filter(
      item =>
        item.previous_ptp_date !== item.updated_ptp_date &&
        item.previous_status === item.updated_status
    ).length;
    const statusAndPtpUpdated = reportData.filter(
      item =>
        item.previous_status !== item.updated_status &&
        item.previous_ptp_date !== item.updated_ptp_date
    ).length;
    const noChange = reportData.filter(item => 
      item.previous_status === item.updated_status && 
      item.previous_ptp_date === item.updated_ptp_date
    ).length;

    return { total, statusChanged, ptpUpdated, statusAndPtpUpdated, noChange };
  };

  // Filter comments by date range - only between planned date/time and today
  const filterCommentsByDateRange = async (appIds: string[]) => {
    const plannedDateTime = getSelectedDateTime();
    if (!plannedDateTime || appIds.length === 0) return {};

    const today = new Date();
    const comments = await fetchCommentsByApplications(appIds, plannedDateTime, today);
    return comments;
  };

  // Automatically run report when date/time changes
  useEffect(() => {
    const runReport = async () => {
      const dateTime = getSelectedDateTime();
      if (!dateTime) return;

      const data = await fetchPlanVsAchievementData(dateTime);
      setReportData(data);
      
      const convertedApps = convertToApplications(data);
      setApplications(convertedApps);

      // Fetch filtered comments for all applications
      const appIds = data.map(item => item.applicant_id);
      if (appIds.length > 0) {
        const comments = await filterCommentsByDateRange(appIds);
        setCommentsByApp(comments);
      }
    };

    runReport();
  }, [selectedDate, selectedTime, fetchPlanVsAchievementData, fetchCommentsByApplications]);

  const handleExportReport = async () => {
    const dateTime = getSelectedDateTime();
    if (!dateTime) return;

    await exportPlanVsAchievementReport(dateTime, 'plan-vs-achievement-report');
  };

  const handleApplicationSelect = (app: Application) => {
    setSelectedApplication(app);
  };

  const handleClosePanel = () => {
    setSelectedApplication(null);
  };

  const handleApplicationUpdate = (updatedApp: Application) => {
    setSelectedApplication(updatedApp);
    // In a real app, you'd update the applications list here
  };

  const stats = getSummaryStats();

  return (
    <div className="relative w-full">
      <div className="space-y-8 transition-all duration-300">
        <PlanVsAchievementHeader
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          onDateSelect={setSelectedDate}
          onTimeChange={setSelectedTime}
        />

        <PlanVsAchievementSummary
          stats={stats}
          loading={loading}
          hasData={reportData.length > 0}
        />

        <PlanVsAchievementTable
          loading={loading}
          reportData={reportData}
          sortedReportData={sortedReportData}
          applications={applications}
          commentsByApp={commentsByApp}
          selectedDate={selectedDate}
          selectedApplication={selectedApplication}
          onExportReport={handleExportReport}
          onApplicationSelect={handleApplicationSelect}
        />
      </div>

      {/* Application Details Panel - Portal for true docked drawer */}
      {selectedApplication && ReactDOM.createPortal(
        <>
          {/* Subtle overlay for focus, does not block scroll */}
          <div className="fixed inset-0 bg-black/10 z-40 transition-opacity animate-fade-in pointer-events-none" />
          <div
            className="fixed right-0 top-0 h-screen min-w-[350px] max-w-[500px] w-[35vw] z-50 bg-white shadow-2xl border-l-2 border-gray-300 flex flex-col animate-slide-in overflow-y-auto rounded-none m-0 p-0"
          >
            <ApplicationDetailsPanel
              application={selectedApplication}
              onClose={handleClosePanel}
              onSave={handleApplicationUpdate}
              onDataChanged={() => {
                console.log('Application data changed');
              }}
            />
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

export default PlanVsAchievementTab;
