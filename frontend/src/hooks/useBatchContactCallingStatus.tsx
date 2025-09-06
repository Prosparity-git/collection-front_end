
import { useState, useCallback } from 'react';
import { client } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { getMonthDateRange } from '@/utils/dateUtils';

export interface BatchContactStatus {
  applicant?: string;
  co_applicant?: string;
  guarantor?: string;
  reference?: string;
  latest?: string;
}

export const useBatchContactCallingStatus = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchBatchContactStatus = useCallback(async (
    applicationIds: string[], 
    selectedMonth?: string | null
  ): Promise<Record<string, BatchContactStatus>> => {
    if (!user || applicationIds.length === 0) return {};
    
    setLoading(true);
    
    try {
      console.log('=== BATCH CONTACT STATUS FETCH ===');
      console.log('Application IDs:', applicationIds.length);
      console.log('Selected Month:', selectedMonth);

      let query = client
        .from('contact_calling_status')
        .select('application_id, contact_type, status, created_at')
        .in('application_id', applicationIds);

      // Add month filter if provided - filter by demand_date using proper date range
      if (selectedMonth) {
        const { start, end } = getMonthDateRange(selectedMonth);
        console.log('Date range for contact status:', { start, end });
        
        query = query
          .gte('demand_date', start)
          .lte('demand_date', end);
      }

      // Order by created_at to get latest status per contact type
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching batch contact status:', error);
        // Return empty object instead of throwing to prevent cascade failures
        return {};
      }

      // Group by application_id and contact_type, getting latest status for each
      const statusMap: Record<string, BatchContactStatus> = {};
      
      if (data) {
        data.forEach(status => {
          if (!statusMap[status.application_id]) {
            statusMap[status.application_id] = {};
          }
          
          // Only set if we don't already have a status for this contact type (keeps latest due to ordering)
          const contactType = status.contact_type.toLowerCase() as keyof BatchContactStatus;
          if (!statusMap[status.application_id][contactType]) {
            statusMap[status.application_id][contactType] = status.status;
          }
        });

        // Calculate latest calling status for each application
        Object.keys(statusMap).forEach(appId => {
          const statuses = Object.values(statusMap[appId]);
          if (statuses.length > 0) {
            // Find the most recent non-"Not Called" status, or "Not Called" if all are
            const activeStatuses = statuses.filter(s => s !== 'Not Called');
            statusMap[appId].latest = activeStatuses.length > 0 ? activeStatuses[0] : 'No Calls';
          } else {
            statusMap[appId].latest = 'No Calls';
          }
        });
      }

      console.log('✅ Batch contact status loaded:', Object.keys(statusMap).length, 'applications');
      return statusMap;
    } catch (error) {
      console.error('Error in fetchBatchContactStatus:', error);
      return {}; // Return empty object to prevent cascade failures
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    fetchBatchContactStatus,
    loading
  };
};
