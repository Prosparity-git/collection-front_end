import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Card } from '@/components/ui/card';
import { useApplications } from '@/hooks/useApplications';
import BranchPaymentStatusTable from '@/components/analytics/BranchPaymentStatusTable';
import ApplicationDetailsModal from '@/components/analytics/ApplicationDetailsModal';
import { Application } from '@/types/application';
import { format, isToday, isTomorrow, isBefore, isAfter, startOfDay } from 'date-fns';
import { useFieldStatusManager } from '@/hooks/useFieldStatusManager';
import { usePtpDates } from '@/hooks/usePtpDates';
import { client } from '@/integrations/api/client';
import { getMonthDateRange, convertEmiMonthToDatabase } from '@/utils/dateUtils';
import { useCentralizedDataManager } from '@/hooks/useCentralizedDataManager';

export interface DrillDownFilter {
  branch_name: string;
  rm_name?: string;
  status_type: string;
  ptp_criteria?: string;
  ptp_date?: string;
  selectedEmiMonth?: string; // Add month context
}

const Analytics = () => {
  const navigate = useNavigate();
  const { allApplications, loading } = useApplications();
  const { fetchFieldStatus } = useFieldStatusManager();
  const { fetchPtpDates } = usePtpDates();
  const dataManager = useCentralizedDataManager();
  const [selectedFilter, setSelectedFilter] = useState<DrillDownFilter | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [filteredApplications, setFilteredApplications] = useState<Application[]>([]);
  const [filteredApplicationsStatusData, setFilteredApplicationsStatusData] = useState<Record<string, string>>({});
  const [batchData, setBatchData] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);

  console.log('Analytics - Applications loaded:', allApplications?.length || 0);
  console.log('Analytics - Loading state:', loading);


  const handleDrillDown = async (filter: DrillDownFilter) => {
    console.log('Analytics - Drill down filter:', filter);
    setSelectedFilter(filter);
    setModalLoading(true);
    setShowModal(true);

    try {
      const filtered = await getFilteredApplications(filter);
      setFilteredApplications(filtered);
      
      // After getting filtered applications, fetch complete batch data
      if (filtered.length > 0) {
        console.log('📊 Fetching complete batch data for', filtered.length, 'applications');
        const applicationIds = filtered.map(app => app.applicant_id);
        const enrichedData = await dataManager.fetchAllData(applicationIds, {
          selectedEmiMonth: filter.selectedEmiMonth,
          priority: 'high'
        });
        setBatchData(enrichedData);
        console.log('✅ Batch data loaded for modal:', {
          statuses: Object.keys(enrichedData.statuses).length,
          comments: Object.keys(enrichedData.comments).length,
          ptpDates: Object.keys(enrichedData.ptpDates).length,
          contactStatuses: Object.keys(enrichedData.contactStatuses).length
        });
      } else {
        setBatchData(null);
      }
    } catch (error) {
      console.error('Error filtering applications:', error);
      setFilteredApplications([]);
      setBatchData(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedFilter(null);
    setFilteredApplications([]);
    setBatchData(null);
  };

  const getFilteredApplications = async (filter: DrillDownFilter): Promise<Application[]> => {
    if (!allApplications) {
      console.log('No applications available');
      return [];
    }

    console.log('Filtering applications with filter:', filter);
    console.log('Total applications:', allApplications.length);

    try {
      let relevantApplications: Application[] = [];
      let statusMap: Record<string, string> = {};
      let ptpDatesMap: Record<string, string | null> = {};

      if (filter.selectedEmiMonth && filter.selectedEmiMonth !== 'All') {
        // For specific month, get applications with collection records for that month
        const dbFormatMonth = convertEmiMonthToDatabase(filter.selectedEmiMonth);
        const { start, end } = getMonthDateRange(dbFormatMonth);
        
        console.log('Fetching collection records for date range:', { start, end });
        
        const { data: collectionData, error } = await client
          .from('collection')
          .select(`
            application_id,
            applications!inner(*)
          `)
          .gte('demand_date', start)
          .lte('demand_date', end);

        if (error) {
          console.error('Error fetching collection data:', error);
          return [];
        }

        if (!collectionData || collectionData.length === 0) {
          console.log('No collection data found for month:', filter.selectedEmiMonth);
          return [];
        }

        // Get applications from collection records
        relevantApplications = collectionData
          .map(record => record.applications)
          .filter(app => app != null) as Application[];

        // Get month-specific field status and PTP dates for these applications
        const applicationIds = collectionData.map(record => record.application_id);
        statusMap = await fetchFieldStatus(applicationIds, dbFormatMonth, false);
        
        // Use the hook's fetchPtpDates function
        ptpDatesMap = await fetchPtpDates(applicationIds, dbFormatMonth);
        
        console.log('Month-specific filtering - Applications with collection records:', relevantApplications.length);
        console.log('Status map loaded:', Object.keys(statusMap).length);
        console.log('PTP dates map loaded:', Object.keys(ptpDatesMap).length);
      } else {
        // For "All" months, use all applications
        relevantApplications = allApplications;
        
        // Get latest field status and PTP dates for all applications
        const applicationIds = allApplications.map(app => app.applicant_id);
        statusMap = await fetchFieldStatus(applicationIds, undefined, true);
        
        // Use the hook's fetchPtpDates function
        ptpDatesMap = await fetchPtpDates(applicationIds);
        
        console.log('All months filtering - Total applications:', relevantApplications.length);
      }

      // Enrich applications with fetched data to match the hook's expectations
      const enrichedApplications = relevantApplications.map(app => ({
        ...app,
        ptp_date: ptpDatesMap[app.applicant_id] || app.ptp_date || null,
        field_status: statusMap[app.applicant_id] || app.lms_status || 'Unpaid'
      }));

      // Now filter based on the criteria using the same logic as the hook
      const filtered = enrichedApplications.filter(app => {
        // Handle PTP date-specific filtering
        if (filter.ptp_criteria === 'date_specific' && filter.ptp_date) {
          if (!app.ptp_date) return false;
          
          try {
            const appPtpDate = format(new Date(app.ptp_date), 'yyyy-MM-dd');
            if (appPtpDate !== filter.ptp_date) return false;
          } catch {
            return false;
          }
          
          // Apply status filter for the specific date
          switch (filter.status_type) {
            case 'paid':
              return app.field_status === 'Paid';
            case 'overdue':
              return app.ptp_date && new Date(app.ptp_date) < new Date() && app.field_status !== 'Paid';
            case 'total':
              return true;
            default:
              return false;
          }
        }

        // Filter by branch
        if (filter.branch_name && app.branch_name !== filter.branch_name) return false;

        // Filter by RM if specified
        if (filter.rm_name) {
          const actualRM = app.collection_rm || app.rm_name || 'Unknown RM';
          if (actualRM !== filter.rm_name) {
            return false;
          }
        }

        // Get the field status for this application
        const fieldStatus = app.field_status;

        // Handle PTP criteria-based filtering - ALWAYS exclude "Paid" status for ALL PTP criteria
        if (filter.ptp_criteria) {
          // Exclude "Paid" status for ALL PTP criteria (including 'total')
          if (fieldStatus === 'Paid') {
            return false;
          }

          const today = startOfDay(new Date());
          
          switch (filter.ptp_criteria) {
            case 'overdue':
              if (!app.ptp_date) return false;
              try {
                const ptpDate = new Date(app.ptp_date);
                return isBefore(ptpDate, today);
              } catch {
                return false;
              }
            case 'today':
              if (!app.ptp_date) return false;
              try {
                const ptpDate = new Date(app.ptp_date);
                return isToday(ptpDate);
              } catch {
                return false;
              }
            case 'tomorrow':
              if (!app.ptp_date) return false;
              try {
                const ptpDate = new Date(app.ptp_date);
                return isTomorrow(ptpDate);
              } catch {
                return false;
              }
            case 'future':
              if (!app.ptp_date) return false;
              try {
                const ptpDate = new Date(app.ptp_date);
                return isAfter(ptpDate, today) && !isTomorrow(ptpDate);
              } catch {
                return false;
              }
            case 'no_ptp_set':
              return !app.ptp_date;
            case 'total':
              // For total, return all unpaid applications (already filtered above)
              return true;
            default:
              break;
          }
        }

        // Filter by status type using month-specific status
        switch (filter.status_type) {
          case 'unpaid':
            return fieldStatus === 'Unpaid';
          case 'partially_paid':
            return fieldStatus === 'Partially Paid';
          case 'paid_pending_approval':
            return fieldStatus === 'Paid (Pending Approval)';
          case 'paid':
            return fieldStatus === 'Paid';
          case 'others':
            return ['Cash Collected from Customer', 'Customer Deposited to Bank'].includes(fieldStatus || '') ||
                   !['Unpaid', 'Partially Paid', 'Paid (Pending Approval)', 'Paid'].includes(fieldStatus || '');
          case 'total':
            // For total, return all applications (already filtered above)
            return true;
          default:
            return false;
        }
      });

      console.log('Filtered applications count:', filtered.length);
      console.log('Sample filtered applications:', filtered.slice(0, 3).map(app => ({
        applicant_id: app.applicant_id,
        ptp_date: app.ptp_date,
        field_status: app.field_status,
        branch_name: app.branch_name
      })));
      
      // Create status mapping for consistent display
      const statusMapping = filtered.reduce((acc, app) => {
        acc[app.applicant_id] = app.field_status;
        return acc;
      }, {} as Record<string, string>);
      
      setFilteredApplicationsStatusData(statusMapping);
      return filtered;
    } catch (error) {
      console.error('Error filtering applications:', error);
      return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-lg font-medium text-gray-700">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!allApplications || allApplications.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:bg-white/80 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
              <p className="text-gray-600">No applications data available</p>
            </div>
          </div>
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0 p-8">
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-lg">No applications data found. Please check your data connection.</p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Use same container width as main applications table */}
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 hover:bg-white/80 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive insights into payment collections for {allApplications.length} applications</p>
          </div>
        </div>

        {/* Analytics Content */}
        <div className="relative">
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0 p-8">
            <BranchPaymentStatusTable 
              applications={allApplications} 
              onDrillDown={handleDrillDown}
            />
          </Card>
        </div>

        {/* Drill-down Modal */}
        <ApplicationDetailsModal
          isOpen={showModal}
          onClose={handleCloseModal}
          applications={filteredApplications}
          filter={selectedFilter}
          loading={modalLoading}
          statusData={filteredApplicationsStatusData}
          batchData={batchData}
        />
      </div>
    </div>
  );
};

export default Analytics;
