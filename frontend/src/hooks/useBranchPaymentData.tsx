
import { useState, useEffect, useMemo } from 'react';
import { Application } from '@/types/application';
import { useFieldStatusManager } from '@/hooks/useFieldStatusManager';
import { client } from '@/integrations/api/client';
import { getMonthDateRange, convertEmiMonthToDatabase } from '@/utils/dateUtils';

export interface PaymentStatusRow {
  rm_name: string;
  branch_name: string;
  unpaid: number;
  partially_paid: number;
  paid_pending_approval: number;
  paid: number;
  others: number;
  total: number;
}

export interface BranchPaymentStatus {
  branch_name: string;
  total_stats: PaymentStatusRow;
  rm_stats: PaymentStatusRow[];
}

// Simple cache for branch payment data
const paymentDataCache = new Map<string, BranchPaymentStatus[]>();

export const useBranchPaymentData = (applications: Application[], selectedEmiMonth?: string) => {
  const { fetchFieldStatus } = useFieldStatusManager();
  const [data, setData] = useState<BranchPaymentStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Create cache key
  const cacheKey = useMemo(() => {
    return `payment-${selectedEmiMonth || 'all'}-${applications.length}`;
  }, [selectedEmiMonth, applications.length]);

  useEffect(() => {
    const fetchPaymentData = async () => {
      // Check cache first
      if (paymentDataCache.has(cacheKey)) {
        console.log('📊 Cache HIT for payment data:', cacheKey);
        setData(paymentDataCache.get(cacheKey)!);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        console.log('📊 Cache MISS - Fast-loading payment data for month:', selectedEmiMonth);
        
        // Optimized single query with joins to get everything at once
        let query = client
          .from('collection')
          .select(`
            application_id,
            demand_date,
            applications!inner(
              applicant_id,
              branch_name,
              rm_name,
              collection_rm,
              lms_status
            )
          `);

        // Apply date filtering if month is selected
        if (selectedEmiMonth) {
          const dbFormatMonth = convertEmiMonthToDatabase(selectedEmiMonth);
          if (!dbFormatMonth || !dbFormatMonth.match(/^\d{4}-\d{2}$/)) {
            throw new Error(`Invalid month format: ${selectedEmiMonth}`);
          }
          
          const { start, end } = getMonthDateRange(dbFormatMonth);
          query = query.gte('demand_date', start).lte('demand_date', end);
        }

        const { data: collectionData, error } = await query;

        if (error) {
          console.error('Error fetching collection data:', error);
          throw new Error(`Failed to fetch collection data: ${error.message}`);
        }

        if (!collectionData || collectionData.length === 0) {
          console.log('No collection data found for month:', selectedEmiMonth);
          setData([]);
          return;
        }

        // Get application IDs for field status fetch in batches
        const applicationIds = collectionData.map(record => record.application_id);
        console.log(`📊 Processing ${applicationIds.length} applications for payment analysis`);
        
        // Batch fetch field status - only for applications we need
        const dbFormatMonth = selectedEmiMonth ? convertEmiMonthToDatabase(selectedEmiMonth) : undefined;
        const statusMap = await fetchFieldStatus(applicationIds, dbFormatMonth, false);
        
        console.log('🔍 Field status loaded for', Object.keys(statusMap).length, 'applications');

        const branchMap = new Map<string, BranchPaymentStatus>();
        
        // Process only applications that have collection records for this month
        collectionData.forEach(record => {
          if (!record.applications) {
            console.warn('Missing application data for record:', record.application_id);
            return;
          }
          
          const app = record.applications;
          const branchName = app?.branch_name || 'Unknown Branch';
          const rmName = app?.collection_rm || app?.rm_name || 'Unknown RM';
          
          // Get month-specific status from field_status table via manager, fallback to lms_status from applications
          let fieldStatus = statusMap[record.application_id];
          if (!fieldStatus) {
            // Use the application's lms_status as fallback instead of defaulting to 'Unpaid'
            fieldStatus = app.lms_status || 'Unpaid';
            console.log(`🔄 Using fallback status for ${record.application_id}: ${fieldStatus}`);
          }
          
          if (!branchMap.has(branchName)) {
            branchMap.set(branchName, {
              branch_name: branchName,
              total_stats: {
                rm_name: branchName,
                branch_name: branchName,
                unpaid: 0,
                partially_paid: 0,
                paid_pending_approval: 0,
                paid: 0,
                others: 0,
                total: 0
              },
              rm_stats: []
            });
          }
          
          const branch = branchMap.get(branchName)!;
          
          let rmStats = branch.rm_stats.find(rm => rm.rm_name === rmName);
          if (!rmStats) {
            rmStats = {
              rm_name: rmName,
              branch_name: branchName,
              unpaid: 0,
              partially_paid: 0,
              paid_pending_approval: 0,
              paid: 0,
              others: 0,
              total: 0
            };
            branch.rm_stats.push(rmStats);
          }
          
          rmStats.total++;
          branch.total_stats.total++;
          
          switch (fieldStatus) {
            case 'Unpaid':
              rmStats.unpaid++;
              branch.total_stats.unpaid++;
              break;
            case 'Partially Paid':
              rmStats.partially_paid++;
              branch.total_stats.partially_paid++;
              break;
            case 'Paid (Pending Approval)':
              rmStats.paid_pending_approval++;
              branch.total_stats.paid_pending_approval++;
              break;
            case 'Paid':
              rmStats.paid++;
              branch.total_stats.paid++;
              break;
            case 'Cash Collected from Customer':
            case 'Customer Deposited to Bank':
            default:
              rmStats.others++;
              branch.total_stats.others++;
              break;
          }
        });
        
        const result = Array.from(branchMap.values())
          .map(branch => ({
            ...branch,
            rm_stats: branch.rm_stats.sort((a, b) => b.total - a.total)
          }))
          .sort((a, b) => b.total_stats.total - a.total_stats.total);
          
        console.log('📈 Payment data processing complete. Final status distribution:');
        result.forEach(branch => {
          console.log(`Branch ${branch.branch_name}:`, {
            unpaid: branch.total_stats.unpaid,
            partially_paid: branch.total_stats.partially_paid,
            paid_pending_approval: branch.total_stats.paid_pending_approval,
            paid: branch.total_stats.paid,
            others: branch.total_stats.others,
            total: branch.total_stats.total
          });
        });
        
        // Cache the result for future use
        paymentDataCache.set(cacheKey, result);
        console.log('📊 Payment data cached with key:', cacheKey);
        
        setData(result);
      } catch (err) {
        console.error('Error in fetchPaymentData:', err);
        setError(err as Error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    if (applications && applications.length > 0) {
      fetchPaymentData();
    } else {
      console.log('No applications provided to useBranchPaymentData');
      setData([]);
    }
  }, [selectedEmiMonth, fetchFieldStatus, applications]);

  return { data, loading, error };
};
