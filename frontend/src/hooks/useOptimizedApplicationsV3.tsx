import { useState, useEffect, useCallback, useMemo } from 'react';
import { client } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { Application } from '@/types/application';
import { FilterState } from '@/types/filters';
import { getMonthDateRange, monthToEmiDate } from '@/utils/dateUtils';
import { useQueryCache } from './useQueryCache';
import { useDebouncedAPI } from './useDebouncedAPI';
import { useBatchPtpDates } from './useBatchPtpDates';
import { useBatchFieldStatus } from './useBatchFieldStatus';
import { categorizePtpDate } from '@/utils/ptpDateUtils';
import { categorizeLastMonthBounce, isValidPtpDateCategory, isValidLastMonthBounceCategory } from '@/utils/filterUtils';

interface UseOptimizedApplicationsV3Props {
  filters: FilterState;
  searchTerm: string;
  page: number;
  pageSize: number;
  selectedEmiMonth?: string | null;
}

interface ApplicationsResponse {
  applications: Application[];
  totalCount: number;
  totalPages: number;
  loading: boolean;
  refetch: () => Promise<void>;
}

export const useOptimizedApplicationsV3 = ({
  filters,
  searchTerm,
  page,
  pageSize,
  selectedEmiMonth
}: UseOptimizedApplicationsV3Props): ApplicationsResponse => {
  const { user } = useAuth();
  const { getCachedData, setCachedData, invalidateCache } = useQueryCache<ApplicationsResponse>();
  const [applications, setApplications] = useState<Application[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Batch data hooks for client-side filtering
  const { fetchBatchPtpDates } = useBatchPtpDates();
  const { fetchBatchFieldStatus } = useBatchFieldStatus();

  // Create cache key based on all parameters
  const normalizedSearchTerm = searchTerm?.trim() || '';
  const cacheKey = useMemo(() => {
    return `applications-${selectedEmiMonth}-${JSON.stringify(filters)}-${normalizedSearchTerm}-${page}-${pageSize}`;
  }, [selectedEmiMonth, filters, normalizedSearchTerm, page, pageSize]);

  const fetchApplicationsCore = useCallback(async () => {
    if (!user || !selectedEmiMonth) {
      console.log('❌ Missing user or selectedEmiMonth:', { user: !!user, selectedEmiMonth });
      return { applications: [], totalCount: 0, totalPages: 0, loading: false, refetch: async () => {} };
    }

    console.log('=== OPTIMIZED V3 FETCH START ===');
    console.log('Selected EMI Month:', selectedEmiMonth);
    console.log('Search term:', `"${normalizedSearchTerm}"`);

    // Check cache first for non-search queries
    if (!normalizedSearchTerm && Object.values(filters).every(arr => arr.length === 0)) {
      const cachedResult = getCachedData(cacheKey);
      if (cachedResult) {
        console.log('✅ Using cached data, skipping API call');
        return cachedResult;
      }
    }

    const { start, end } = getMonthDateRange(selectedEmiMonth);
    console.log('📅 Date range for month', selectedEmiMonth, ':', start, 'to', end);

    try {
      console.log('=== STEP 1: FETCHING MAIN DATA ===');
      
      let dataQuery = client
        .from('collection')
        .select(`
          *,
          applications!inner(*)
        `)
        .gte('demand_date', start)
        .lte('demand_date', end);

      // Apply server-side filters
      if (filters.teamLead?.length > 0) {
        dataQuery = dataQuery.in('team_lead', filters.teamLead);
      }
      if (filters.rm?.length > 0) {
        dataQuery = dataQuery.in('rm_name', filters.rm);
      }
      if (filters.repayment?.length > 0) {
        dataQuery = dataQuery.in('repayment', filters.repayment);
      }
      if (filters.branch?.length > 0) {
        dataQuery = dataQuery.in('applications.branch_name', filters.branch);
      }
      if (filters.dealer?.length > 0) {
        dataQuery = dataQuery.in('applications.dealer_name', filters.dealer);
      }
      if (filters.lender?.length > 0) {
        dataQuery = dataQuery.in('applications.lender_name', filters.lender);
      }
      if (filters.vehicleStatus?.length > 0) {
        const normalizedVehicleStatuses = filters.vehicleStatus.map(status => 
          status === 'None' || status === 'N/A' ? null : status
        );
        if (normalizedVehicleStatuses.includes(null)) {
          const nonNullStatuses = normalizedVehicleStatuses.filter(status => status !== null);
          if (nonNullStatuses.length > 0) {
            dataQuery = dataQuery.or(`applications.vehicle_status.in.(${nonNullStatuses.join(',')}),applications.vehicle_status.is.null`);
          } else {
            dataQuery = dataQuery.is('applications.vehicle_status', null);
          }
        } else {
          dataQuery = dataQuery.in('applications.vehicle_status', normalizedVehicleStatuses);
        }
      }

      console.log('📤 Executing main data query for month:', selectedEmiMonth);
      const { data: allData, error: dataError } = await dataQuery;

      if (dataError) {
        console.error('❌ Data query error:', dataError);
        throw dataError;
      }

      console.log(`✅ Fetched ${allData?.length || 0} total records from database`);

      // Transform data first
      let transformedApplications: Application[] = (allData || []).map(record => {
        const app = record.applications;
        return {
          id: record.application_id,
          applicant_id: record.application_id,
          demand_date: record.demand_date,
          emi_amount: record.emi_amount || 0,
          amount_collected: record.amount_collected || 0,
          lms_status: record.lms_status || 'Unpaid',
          collection_rm: record.collection_rm || 'N/A',
          team_lead: record.team_lead || '',
          rm_name: record.rm_name || '',
          repayment: record.repayment || '',
          last_month_bounce: record.last_month_bounce || 0,
          field_status: 'Unpaid',
          applicant_name: app?.applicant_name || 'Unknown',
          applicant_mobile: app?.applicant_mobile || '',
          applicant_address: app?.applicant_address || '',
          branch_name: app?.branch_name || '',
          dealer_name: app?.dealer_name || '',
          lender_name: app?.lender_name || '',
          principle_due: app?.principle_due || 0,
          interest_due: app?.interest_due || 0,
          loan_amount: app?.loan_amount || 0,
          vehicle_status: app?.vehicle_status,
          fi_location: app?.fi_location,
          house_ownership: app?.house_ownership,
          co_applicant_name: app?.co_applicant_name,
          co_applicant_mobile: app?.co_applicant_mobile,
          co_applicant_address: app?.co_applicant_address,
          guarantor_name: app?.guarantor_name,
          guarantor_mobile: app?.guarantor_mobile,
          guarantor_address: app?.guarantor_address,
          reference_name: app?.reference_name,
          reference_mobile: app?.reference_mobile,
          reference_address: app?.reference_address,
          disbursement_date: app?.disbursement_date,
          created_at: app?.created_at || new Date().toISOString(),
          updated_at: app?.updated_at || new Date().toISOString(),
          user_id: app?.user_id || user.id
        } as Application;
      });

      // Apply search filtering first to reduce dataset size
      if (normalizedSearchTerm) {
        console.log('=== STEP 2: APPLYING SEARCH FILTER ===');
        const searchLower = normalizedSearchTerm.toLowerCase();
        
        transformedApplications = transformedApplications.filter(app => {
          const searchableFields = [
            app.applicant_name?.toLowerCase() || '',
            app.applicant_id?.toLowerCase() || '',
            app.applicant_mobile?.toLowerCase() || '',
            app.dealer_name?.toLowerCase() || '',
            app.lender_name?.toLowerCase() || '',
            app.branch_name?.toLowerCase() || '',
            app.rm_name?.toLowerCase() || '',
            app.team_lead?.toLowerCase() || '',
            app.collection_rm?.toLowerCase() || ''
          ];

          return searchableFields.some(field => field.includes(searchLower));
        });

        console.log(`🔍 Search results: ${transformedApplications.length} applications`);
      }

      // Apply client-side filters only if needed
      const needsPtpData = filters.ptpDate?.length > 0;
      const needsStatusData = filters.status?.length > 0;
      
      if (needsPtpData || needsStatusData) {
        console.log('=== STEP 3: APPLYING CLIENT-SIDE FILTERS ===');
        
        const applicationIds = transformedApplications.map(app => app.applicant_id);
        
        let ptpDatesMap: Record<string, string | null> = {};
        let fieldStatusMap: Record<string, string> = {};
        
        if (needsPtpData) {
          ptpDatesMap = await fetchBatchPtpDates(applicationIds, selectedEmiMonth);
        }
        
        if (needsStatusData) {
          fieldStatusMap = await fetchBatchFieldStatus(applicationIds, selectedEmiMonth);
        }

        // Apply PTP date filter
        if (filters.ptpDate?.length > 0) {
          transformedApplications = transformedApplications.filter(app => {
            const ptpDate = ptpDatesMap[app.applicant_id];
            const category = categorizePtpDate(ptpDate);
            return filters.ptpDate.some(selectedCategory => {
              if (isValidPtpDateCategory(selectedCategory)) {
                return category === selectedCategory;
              }
              return false;
            });
          });
        }

        // Apply status filter
        if (filters.status?.length > 0) {
          const emiDate = monthToEmiDate(selectedEmiMonth);
          transformedApplications = transformedApplications.filter(app => {
            const currentStatus = fieldStatusMap[app.applicant_id] || app.lms_status;
            return filters.status.includes(currentStatus) && app.demand_date === emiDate;
          });
        }
      }

      // Apply last month bounce filter
      if (filters.lastMonthBounce?.length > 0) {
        transformedApplications = transformedApplications.filter(app => {
          const bounceCategory = categorizeLastMonthBounce(app.last_month_bounce);
          return filters.lastMonthBounce.some(selectedCategory => {
            if (isValidLastMonthBounceCategory(selectedCategory)) {
              return bounceCategory === selectedCategory;
            }
            return false;
          });
        });
      }

      // Sort by applicant name
      const sortedApplications = transformedApplications.sort((a, b) => {
        const getFirstName = (fullName: string = '') => {
          const firstName = fullName.split(' ')[0];
          return firstName ? firstName.toLowerCase() : '';
        };
        
        const firstNameA = getFirstName(a.applicant_name);
        const firstNameB = getFirstName(b.applicant_name);
        
        const nameComparison = firstNameA.localeCompare(firstNameB);
        if (nameComparison !== 0) return nameComparison;
        
        return new Date(b.demand_date || '').getTime() - new Date(a.demand_date || '').getTime();
      });

      // Apply pagination
      const offset = (page - 1) * pageSize;
      const paginatedApplications = sortedApplications.slice(offset, offset + pageSize);

      const finalTotalCount = sortedApplications.length;

      const result = {
        applications: paginatedApplications,
        totalCount: finalTotalCount,
        totalPages: Math.ceil(finalTotalCount / pageSize),
        loading: false,
        refetch: async () => {}
      };

      // Cache non-search results
      const hasActiveFilters = Object.values(filters).some(arr => arr.length > 0);
      if (!normalizedSearchTerm && !hasActiveFilters) {
        setCachedData(cacheKey, result, 2 * 60 * 1000);
      }
      
      console.log('=== OPTIMIZED V3 FETCH COMPLETE ===');
      console.log(`📊 Final: Total: ${finalTotalCount}, Page: ${page}, Results: ${paginatedApplications.length}`);
      
      return result;
    } catch (error) {
      console.error('❌ Error in fetchApplicationsCore:', error);
      throw error;
    }
  }, [user, selectedEmiMonth, filters, normalizedSearchTerm, page, pageSize, cacheKey, getCachedData, setCachedData, fetchBatchPtpDates, fetchBatchFieldStatus]);

  // Use debounced API call with longer debounce for stability
  const { data: apiResult, loading: apiLoading, call: debouncedFetch } = useDebouncedAPI(fetchApplicationsCore, 500);

  // Update local state when API result changes
  useEffect(() => {
    if (apiResult) {
      setApplications(apiResult.applications);
      setTotalCount(apiResult.totalCount);
    }
  }, [apiResult]);

  // Trigger debounced fetch when dependencies change
  useEffect(() => {
    setLoading(true);
    debouncedFetch();
  }, [debouncedFetch]);

  useEffect(() => {
    setLoading(apiLoading);
  }, [apiLoading]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(totalCount / pageSize);
  }, [totalCount, pageSize]);

  // Refetch function
  const refetch = useCallback(async () => {
    console.log('🔄 Refetch called - invalidating cache');
    invalidateCache(selectedEmiMonth || 'applications');
    await debouncedFetch();
  }, [invalidateCache, selectedEmiMonth, debouncedFetch]);

  return {
    applications,
    totalCount,
    totalPages,
    loading,
    refetch
  };
};
