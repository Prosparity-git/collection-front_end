import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { AuthService } from "@/integrations/api/services/authService";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/layout/AppHeader";
import FiltersSection from "@/components/layout/FiltersSection";
import MainContent from "@/components/layout/MainContent";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import StatusCards from "@/components/StatusCards";
import { ApplicationTableSkeleton, StatusCardsSkeleton } from "@/components/LoadingStates";
import PendingApprovals from "@/components/PendingApprovals";
import ApplicationDetailsPanel from "@/components/ApplicationDetailsPanel";
import { getApplicationDetails, getApplicationsFromBackend, getFilterOptions, getCollectionsSummary, mapApiResponseToApplication } from '@/integrations/api/client';
import { getCurrentEmiMonth, generateMonthOptions } from '@/utils/formatters';
import { useRealtimeApplicationUpdates } from '@/hooks/useRealtimeApplicationUpdates';

const PAGE_SIZE = 20;

const Index = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // State
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filterOptions, setFilterOptions] = useState(null);
  const [filters, setFilters] = useState({
    branch: [],
    teamLead: [],
    rm: [],
    dealer: [],
    lender: [],
    status: [],
    repayment: [],
    lastMonthBounce: [],
    ptpDate: [],
    vehicleStatus: []
  });
  const [selectedEmiMonthRaw, setSelectedEmiMonthRaw] = useState(getCurrentEmiMonth());
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Extract selected EMI month - prioritize user selection
  const selectedEmiMonth = selectedEmiMonthRaw || getCurrentEmiMonth();
  
  // Debug logging for EMI month changes
  useEffect(() => {
    console.log('📅 EMI Month changed - selectedEmiMonthRaw:', selectedEmiMonthRaw);
    console.log('📅 EMI Month changed - selectedEmiMonth:', selectedEmiMonth);
  }, [selectedEmiMonthRaw, selectedEmiMonth]);

  // Check if user can view pending approvals (admin only)
  const canViewPendingApprovals = AuthService.canViewPendingApprovals();

  // Initialize realtime updates
  useRealtimeApplicationUpdates({
    applications,
    setApplications,
    onApplicationUpdate: (applicationId, updates) => {
      console.log('🔄 Index: Application updated via realtime:', { applicationId, updates });
      // Update the selected application if it's the one being updated
      if (selectedApplication && selectedApplication.applicant_id === applicationId) {
        setSelectedApplication(prev => ({ ...prev, ...updates }));
      }
    }
  });

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Fetch filter options on mount
  useEffect(() => {
    console.log('🔍 Index.tsx: Fetching filter options...');
    getFilterOptions()
      .then((options) => {
        console.log('🔍 Index.tsx: Filter options received from API:', options);
        console.log('🔍 Index.tsx: demand_num from API:', options.demand_num);
        console.log('🔍 Index.tsx: ptpDateOptions from API:', options.ptpDateOptions);
        setFilterOptions(options);
      })
      .catch((error) => {
        console.error('❌ Index.tsx: Error fetching filter options:', error);
      });
  }, []);

  // Fetch applications when EMI month, filters, or page changes
  useEffect(() => {
    console.log('🔄 useEffect triggered - selectedEmiMonth:', selectedEmiMonth);
    console.log('🔄 useEffect triggered - selectedEmiMonthRaw:', selectedEmiMonthRaw);
    console.log('🔄 useEffect triggered - filters changed:', filters);
    
    if (!selectedEmiMonth) {
      setApplications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const offset = (currentPage - 1) * PAGE_SIZE;
    
    // Prepare filter parameters
    const filterParams = {
      search: searchTerm, // Enable backend search for better performance
      branch: filters.branch,
      teamLead: filters.teamLead,
      rm: filters.rm,
      dealer: filters.dealer,
      lender: filters.lender,
      status: filters.status,
      repayment: filters.repayment,
      lastMonthBounce: filters.lastMonthBounce,
      ptpDate: filters.ptpDate,
      vehicleStatus: filters.vehicleStatus
    };
    
    console.log('📡 Sending filter params to API:', filterParams);
    console.log('📡 Current filters state:', filters);
    console.log('📡 Fetching for EMI month:', selectedEmiMonth);
    console.log('📡 PTP Date filter:', filters.ptpDate);
    console.log('📡 Repayment filter:', filters.repayment);
    console.log('📡 Pagination - Current page:', currentPage, 'Page size:', PAGE_SIZE, 'Offset:', offset);
    
    getApplicationsFromBackend(selectedEmiMonth, offset, PAGE_SIZE, filterParams) // Use proper pagination
      .then((data) => {
        console.log('✅ API response received:', data);
        console.log('✅ Results count:', data.results?.length || 0);
        console.log('✅ First few results:', data.results?.slice(0, 3));
        console.log('✅ EMI months in results:', data.results?.map(r => r.emi_month));
        console.log('✅ Demand numbers in results:', data.results?.map(r => r.demand_num));
        console.log('✅ PTP dates in results:', data.results?.map(r => r.ptp_date));
        
        const mappedApplications = (data.results || []).map(mapApiResponseToApplication);
        console.log('✅ Mapped applications demand_num values:', mappedApplications.map(app => app.demand_num));
        console.log('✅ Mapped applications PTP dates:', mappedApplications.map(app => app.ptp_date));
        
        setApplications(mappedApplications); // Set current page applications
        setTotalCount(data.total || 0);
      })
      .catch((error) => {
        console.error('❌ API error:', error);
        setApplications([]);
      })
      .finally(() => setLoading(false));
  }, [selectedEmiMonth, currentPage, searchTerm, filters.branch, filters.teamLead, filters.rm, filters.dealer, filters.lender, filters.status, filters.repayment, filters.lastMonthBounce, filters.ptpDate, filters.vehicleStatus]);

  // Fetch summary when EMI month changes
  useEffect(() => {
    if (selectedEmiMonth) {
      setSummaryLoading(true);
      getCollectionsSummary(selectedEmiMonth, filters)
        .then(setSummary)
        .catch(() => setSummary(null))
        .finally(() => setSummaryLoading(false));
    }
  }, [selectedEmiMonth, filters]);

  // Update month options when current month changes (but don't change user selection)
  useEffect(() => {
    const updateMonthOptions = () => {
      // Force re-render of filter options to include new months
      if (filterOptions) {
        setFilterOptions({ ...filterOptions });
      }
    };

    // Check every day for new months
    const interval = setInterval(updateMonthOptions, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [filterOptions]);

  // Function to filter applications based on selected filters
  const filterApplications = useCallback((apps: any[], currentFilters: any) => {
    return apps.filter(app => {
      // Search is now handled by backend API
      
      // Branch filter
      if (currentFilters.branch && currentFilters.branch.length > 0) {
        if (!currentFilters.branch.includes(app.branch_name)) return false;
      }
      
      // Team Lead filter
      if (currentFilters.teamLead && currentFilters.teamLead.length > 0) {
        if (!currentFilters.teamLead.includes(app.tl_name)) return false;
      }
      
      // RM filter
      if (currentFilters.rm && currentFilters.rm.length > 0) {
        if (!currentFilters.rm.includes(app.rm_name)) return false;
      }
      
      // Dealer filter
      if (currentFilters.dealer && currentFilters.dealer.length > 0) {
        if (!currentFilters.dealer.includes(app.dealer_name)) return false;
      }
      
      // Lender filter
      if (currentFilters.lender && currentFilters.lender.length > 0) {
        if (!currentFilters.lender.includes(app.lender_name)) return false;
      }
      
      // Status filter
      if (currentFilters.status && currentFilters.status.length > 0) {
        if (!currentFilters.status.includes(app.status)) return false;
      }
      
      // Repayment filter (demand_num)
      if (currentFilters.repayment && currentFilters.repayment.length > 0) {
        console.log('🔍 Comparing repayment filter:', {
          filterValues: currentFilters.repayment,
          appDemandNum: app.demand_num,
          appDemandNumType: typeof app.demand_num,
          appDemandNumString: app.demand_num?.toString(),
          includes: currentFilters.repayment.includes(app.demand_num?.toString())
        });
        if (!currentFilters.repayment.includes(app.demand_num?.toString())) return false;
      }
      
      // Vehicle Status filter
      if (currentFilters.vehicleStatus && currentFilters.vehicleStatus.length > 0) {
        if (!currentFilters.vehicleStatus.includes(app.vehicle_status)) return false;
      }
      
      return true;
    });
  }, []);

  // Reset page when filters change (server-side filtering handles the rest)
  useEffect(() => {
    if (Object.values(filters).some(filterArray => filterArray.length > 0)) {
      console.log('🔍 Filters changed, resetting to page 1');
      setCurrentPage(1); // Reset to first page when filters change
    }
  }, [filters]); // Only reset page when filters change, not when data is fetched

  // Applications are already paginated from the server
  const paginatedApplications = applications;

  // Handlers
  const handleEmiMonthChange = (month) => {
    console.log('EMI Month changed to:', month);
    console.log('Previous selectedEmiMonthRaw:', selectedEmiMonthRaw);
    
    setSelectedEmiMonthRaw(month);
    setCurrentPage(1);
    
    // Force clear applications to ensure fresh data is fetched
    setApplications([]);
    setTotalCount(0);
  };
  const handleFilterChange = (key: string, values: string[]) => {
    console.log('Filter change:', key, values);
    console.log('Filter change - key type:', typeof key);
    console.log('Filter change - values type:', typeof values);
    console.log('Filter change - values content:', values);
    
    // Special handling for filters that should trigger fresh data fetch
    const shouldFetchFreshData = ['ptpDate', 'repayment', 'status', 'branch', 'dealer', 'lender', 'rm', 'teamLead'];
    
    if (shouldFetchFreshData.includes(key)) {
      console.log('🔄 Filter change requires fresh data fetch:', key);
      // Clear cached data to force fresh fetch
      setApplications([]);
      setAllApplications([]);
      setTotalCount(0);
    }
    
    if (key === 'repayment') {
      console.log('🔍 Repayment filter change - values:', values);
      console.log('🔍 Repayment filter change - first value type:', typeof values[0]);
      console.log('🔍 Repayment filter change - first value:', values[0]);
    }
    
    if (key === 'ptpDate') {
      console.log('🔍 PTP Date filter change - values:', values);
      console.log('🔍 PTP Date filter change - will trigger fresh data fetch');
    }
    
    setFilters(prev => ({
      ...prev,
      [key]: values
    }));
    setCurrentPage(1);
  };
  const handleApplicationSelect = (app) => setSelectedApplication(app);
  const handleApplicationClose = () => setSelectedApplication(null);
  const handleApplicationDeleted = () => {
    setSelectedApplication(null);
    setCurrentPage(1);
  };
  const handleApplicationUpdated = (updatedApp) => {
    setSelectedApplication(updatedApp);
  };

  // Search handler
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Export handlers
  const handleExportFull = () => {
    // TODO: Implement full export functionality
    console.log('Export full requested');
  };

  const handleExportPtpComments = () => {
    // TODO: Implement PTP comments export functionality
    console.log('Export PTP comments requested');
  };

  const handleExportPlanVsAchievement = (plannedDateTime: Date) => {
    // TODO: Implement plan vs achievement export functionality
    console.log('Export plan vs achievement requested for:', plannedDateTime);
  };

  // Map backend filter keys to frontend keys
  const mappedOptions = filterOptions && {
    emiMonthOptions: generateMonthOptions(), // Use dynamic month generation
    branches: filterOptions.branches,
    dealers: filterOptions.dealers,
    lenders: filterOptions.lenders,
    statuses: filterOptions.statuses,
    ptpDateOptions: filterOptions.ptpDateOptions,
    vehicle_statuses: filterOptions.vehicle_statuses,
    team_leads: filterOptions.team_leads,
    rms: filterOptions.rms,
    repayments: filterOptions.demand_num, // Map demand_num to repayments
    lastMonthBounce: ['Not paid', 'Paid on time', '1-5 days late', '6-15 days late', '15+ days late'], // Hardcoded options
  };

  // Debug logging for filter options
  useEffect(() => {
    if (filterOptions) {
      console.log('🔍 Index.tsx: Filter options from API:', filterOptions);
      console.log('🔍 Index.tsx: Mapped options for frontend:', mappedOptions);
      console.log('🔍 Index.tsx: Repayments (demand_num):', filterOptions.demand_num);
      console.log('🔍 Index.tsx: PTP Date options:', filterOptions.ptpDateOptions);
      console.log('🔍 Index.tsx: Mapped repayments:', mappedOptions?.repayments);
      console.log('🔍 Index.tsx: Mapped ptpDateOptions:', mappedOptions?.ptpDateOptions);
    }
  }, [filterOptions, mappedOptions]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4 md:py-6 lg:py-8">
        <div className="space-y-2 sm:space-y-4 md:space-y-6">
          <AppHeader 
            onExportFull={handleExportFull}
            onExportPtpComments={handleExportPtpComments}
            onExportPlanVsAchievement={handleExportPlanVsAchievement}
            onLogout={handleLogout}
            user={user}
          />
          <FiltersSection
            filters={filters}
            availableOptions={mappedOptions}
            onFilterChange={handleFilterChange}
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            selectedEmiMonth={selectedEmiMonth}
            onEmiMonthChange={handleEmiMonthChange}
            emiMonthOptions={mappedOptions?.emiMonthOptions}
            loading={!filterOptions}
            searchLoading={loading}
            totalCount={totalCount}
          />
          {summaryLoading ? (
            <StatusCardsSkeleton />
          ) : (
            <StatusCards statusCounts={summary} />
          )}
          {canViewPendingApprovals && <PendingApprovals onUpdate={() => {}} />}
          <MainContent
            applications={paginatedApplications}
            onRowClick={handleApplicationSelect}
            onApplicationDeleted={handleApplicationDeleted}
            selectedApplicationId={selectedApplication?.id}
            currentPage={currentPage}
            totalPages={Math.ceil((totalCount || 1) / PAGE_SIZE)}
            onPageChange={setCurrentPage}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            selectedEmiMonth={selectedEmiMonth}
          />
        </div>
      </div>
      <PWAInstallPrompt />
      {selectedApplication && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={handleApplicationClose}
          />
          <div className="fixed inset-y-0 right-0 w-full sm:w-[95%] md:w-96 lg:w-[500px] z-50">
            <ApplicationDetailsPanel
              application={selectedApplication}
              onClose={handleApplicationClose}
              onSave={handleApplicationUpdated}
              onDataChanged={() => {
                console.log('🔄 Index: Data changed in ApplicationDetailsPanel');
                // The realtime updates will handle refreshing the applications table
              }}
              selectedEmiMonth={selectedEmiMonth}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Index;
