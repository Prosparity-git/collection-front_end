
import { useState, useEffect, useCallback, useMemo } from 'react';
import { client } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { Application } from '@/types/application';
import { FilterState } from '@/types/filters';
import { getMonthDateRange } from '@/utils/dateUtils';
import { chunkArray, BATCH_SIZE } from '@/utils/batchUtils';

interface UseOptimizedApplicationsV2Props {
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

export const useOptimizedApplicationsV2 = ({
  filters,
  searchTerm,
  page,
  pageSize,
  selectedEmiMonth
}: UseOptimizedApplicationsV2Props): ApplicationsResponse => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchApplications = useCallback(async () => {
    if (!user || !selectedEmiMonth) {
      setApplications([]);
      setTotalCount(0);
      return;
    }

    setLoading(true);
    try {
      console.log('=== FETCHING APPLICATIONS WITH BATCHED QUERIES ===');
      console.log('Selected EMI Month:', selectedEmiMonth);
      console.log('Filters:', filters);
      console.log('Search Term:', searchTerm);

      // Get date range for the selected month
      const { start, end } = getMonthDateRange(selectedEmiMonth);
      console.log('Date range for query:', start, 'to', end);

      // STEP 1: Get ALL applications from collection table for this month (PRIMARY SOURCE)
      let collectionQuery = client
        .from('collection')
        .select('*')
        .gte('demand_date', start)
        .lte('demand_date', end);

      // Apply filters to collection query
      if (filters.teamLead?.length > 0) {
        collectionQuery = collectionQuery.in('team_lead', filters.teamLead);
      }
      if (filters.rm?.length > 0) {
        collectionQuery = collectionQuery.in('rm_name', filters.rm);
      }
      if (filters.repayment?.length > 0) {
        collectionQuery = collectionQuery.in('repayment', filters.repayment);
      }

      const { data: collectionData, error: collectionError } = await collectionQuery;

      if (collectionError) {
        console.error('Error fetching collection data:', collectionError);
        throw collectionError;
      }

      console.log(`Found ${collectionData?.length || 0} records in collection table`);

      if (!collectionData || collectionData.length === 0) {
        setApplications([]);
        setTotalCount(0);
        return;
      }

      // STEP 2: Get application IDs from collection data
      const applicationIds = collectionData.map(col => col.application_id);
      console.log(`Extracted ${applicationIds.length} unique application IDs from collection`);

      // STEP 3: Batch the application IDs for safe querying
      const applicationIdChunks = chunkArray(applicationIds, BATCH_SIZE);
      console.log(`Split ${applicationIds.length} IDs into ${applicationIdChunks.length} batches of max ${BATCH_SIZE} each`);

      // STEP 4: Fetch detailed application data in batches
      const fetchBatchedApplications = async () => {
        const batchPromises = applicationIdChunks.map(async (idChunk, batchIndex) => {
          console.log(`Fetching batch ${batchIndex + 1}/${applicationIdChunks.length} with ${idChunk.length} IDs`);
          
          let applicationsQuery = client
            .from('applications')
            .select('*')
            .in('applicant_id', idChunk);

          // Apply additional filters that only exist in applications table
          if (filters.branch?.length > 0) {
            applicationsQuery = applicationsQuery.in('branch_name', filters.branch);
          }
          if (filters.dealer?.length > 0) {
            applicationsQuery = applicationsQuery.in('dealer_name', filters.dealer);
          }
          if (filters.lender?.length > 0) {
            applicationsQuery = applicationsQuery.in('lender_name', filters.lender);
          }
          if (filters.vehicleStatus?.length > 0) {
            if (filters.vehicleStatus.includes('None')) {
              applicationsQuery = applicationsQuery.or(`vehicle_status.is.null,vehicle_status.in.(${filters.vehicleStatus.filter(v => v !== 'None').join(',')})`);
            } else {
              applicationsQuery = applicationsQuery.in('vehicle_status', filters.vehicleStatus);
            }
          }

          // Apply search if provided
          if (searchTerm.trim()) {
            applicationsQuery = applicationsQuery.or(`applicant_name.ilike.%${searchTerm}%,applicant_id.ilike.%${searchTerm}%,applicant_mobile.ilike.%${searchTerm}%`);
          }

          const { data, error } = await applicationsQuery;
          
          if (error) {
            console.error(`Error fetching batch ${batchIndex + 1}:`, error);
            throw error;
          }

          console.log(`Batch ${batchIndex + 1} completed: ${data?.length || 0} records`);
          return data || [];
        });

        // Execute all batch requests in parallel
        const batchResults = await Promise.all(batchPromises);
        
        // Flatten the results
        const allApplicationsData = batchResults.flat();
        console.log(`Successfully fetched ${allApplicationsData.length} detailed application records from ${applicationIdChunks.length} batches`);
        
        return allApplicationsData;
      };

      const applicationsData = await fetchBatchedApplications();

      // STEP 5: Create lookup maps for efficient merging
      const collectionMap = new Map();
      collectionData.forEach(col => {
        collectionMap.set(col.application_id, col);
      });

      const applicationsMap = new Map();
      applicationsData.forEach(app => {
        applicationsMap.set(app.applicant_id, app);
      });

      // STEP 6: Merge data - Collection is PRIMARY, Applications provides additional details
      const mergedApplications: Application[] = [];

      collectionData.forEach(collectionRecord => {
        const applicationId = collectionRecord.application_id;
        const applicationDetails = applicationsMap.get(applicationId);

        // Create merged application record
        const mergedApp: Application = {
          // Use collection data as primary source for core EMI data
          id: applicationId,
          applicant_id: applicationId,
          demand_date: collectionRecord.demand_date,
          emi_amount: collectionRecord.emi_amount || 0,
          amount_collected: collectionRecord.amount_collected || 0,
          lms_status: collectionRecord.lms_status || 'Unpaid',
          collection_rm: collectionRecord.collection_rm || 'N/A',
          team_lead: collectionRecord.team_lead || '',
          rm_name: collectionRecord.rm_name || '',
          repayment: collectionRecord.repayment || '',
          last_month_bounce: collectionRecord.last_month_bounce || 0,
          field_status: 'Unpaid', // Will be updated by field status hook
          
          // Use application details if available, otherwise provide defaults
          applicant_name: applicationDetails?.applicant_name || 'Unknown',
          applicant_mobile: applicationDetails?.applicant_mobile || '',
          applicant_address: applicationDetails?.applicant_address || '',
          branch_name: applicationDetails?.branch_name || '',
          dealer_name: applicationDetails?.dealer_name || '',
          lender_name: applicationDetails?.lender_name || '',
          principle_due: applicationDetails?.principle_due || 0,
          interest_due: applicationDetails?.interest_due || 0,
          loan_amount: applicationDetails?.loan_amount || 0,
          vehicle_status: applicationDetails?.vehicle_status,
          fi_location: applicationDetails?.fi_location,
          house_ownership: applicationDetails?.house_ownership,
          co_applicant_name: applicationDetails?.co_applicant_name,
          co_applicant_mobile: applicationDetails?.co_applicant_mobile,
          co_applicant_address: applicationDetails?.co_applicant_address,
          guarantor_name: applicationDetails?.guarantor_name,
          guarantor_mobile: applicationDetails?.guarantor_mobile,
          guarantor_address: applicationDetails?.guarantor_address,
          reference_name: applicationDetails?.reference_name,
          reference_mobile: applicationDetails?.reference_mobile,
          reference_address: applicationDetails?.reference_address,
          disbursement_date: applicationDetails?.disbursement_date,
          created_at: applicationDetails?.created_at || new Date().toISOString(),
          updated_at: applicationDetails?.updated_at || new Date().toISOString(),
          user_id: applicationDetails?.user_id || user.id
        };

        mergedApplications.push(mergedApp);
      });

      console.log(`Created ${mergedApplications.length} merged application records`);

      // STEP 7: Apply client-side filtering for cases where server-side filtering wasn't possible
      let filteredApplications = mergedApplications;

      // Apply any remaining search filtering if needed
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filteredApplications = filteredApplications.filter(app => 
          app.applicant_name.toLowerCase().includes(searchLower) ||
          app.applicant_id.toLowerCase().includes(searchLower) ||
          (app.applicant_mobile && app.applicant_mobile.toLowerCase().includes(searchLower))
        );
      }

      const totalCount = filteredApplications.length;
      setTotalCount(totalCount);

      // STEP 8: Apply pagination
      const offset = (page - 1) * pageSize;
      const paginatedApplications = filteredApplications.slice(offset, offset + pageSize);

      console.log(`Final result: ${paginatedApplications.length} applications (page ${page}/${Math.ceil(totalCount / pageSize)}) - Total: ${totalCount}`);
      
      setApplications(paginatedApplications);

    } catch (error) {
      console.error('Error in fetchApplications:', error);
      setApplications([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [user, selectedEmiMonth, filters, searchTerm, page, pageSize]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(totalCount / pageSize);
  }, [totalCount, pageSize]);

  // Refetch function for external use
  const refetch = useCallback(async () => {
    await fetchApplications();
  }, [fetchApplications]);

  return {
    applications,
    totalCount,
    totalPages,
    loading,
    refetch
  };
};
