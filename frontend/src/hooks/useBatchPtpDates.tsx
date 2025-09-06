
import { useState, useCallback } from 'react';
import { client } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { getMonthDateRange, convertEmiMonthToDatabase } from '@/utils/dateUtils';

export const useBatchPtpDates = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchBatchPtpDates = useCallback(async (
    applicationIds: string[], 
    selectedMonth?: string | null
  ): Promise<Record<string, string | null>> => {
    if (!user || applicationIds.length === 0) {
      console.log('❌ No user or empty application IDs for batch PTP dates');
      return {};
    }
    
    setLoading(true);
    
    try {
      console.log('=== BATCH PTP DATES FETCH ===');
      console.log('Application IDs:', applicationIds.length);
      console.log('Selected Month:', selectedMonth);

      let query = client
        .from('ptp_dates')
        .select('application_id, ptp_date, created_at')
        .in('application_id', applicationIds);

      // Add month filter if provided - filter by demand_date using proper date range
      if (selectedMonth) {
        // Convert EMI month format from display (Jul-25) to database (2025-07)
        const dbFormatMonth = convertEmiMonthToDatabase(selectedMonth);
        const { start, end } = getMonthDateRange(dbFormatMonth);
        console.log('Date range for PTP dates:', { start, end });
        
        query = query
          .gte('demand_date', start)
          .lte('demand_date', end);
      }

      // Order by created_at to get latest PTP date per application
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('❌ Error fetching batch PTP dates:', error);
        // Return empty object instead of throwing to prevent cascade failures
        return {};
      }

      // Group by application_id and get the latest PTP date
      const ptpMap: Record<string, string | null> = {};
      
      if (data) {
        data.forEach(ptp => {
          // Only set if we don't already have a PTP date for this application (keeps latest due to ordering)
          if (!ptpMap.hasOwnProperty(ptp.application_id)) {
            ptpMap[ptp.application_id] = ptp.ptp_date;
          }
        });
      }

      console.log('✅ Batch PTP dates loaded:', Object.keys(ptpMap).length, 'applications');
      return ptpMap;
    } catch (error) {
      console.error('❌ Error in fetchBatchPtpDates:', error);
      return {}; // Return empty object to prevent cascade failures
    } finally {
      setLoading(false);
    }
  }, [user]);

  // New function: fetch latest PTP date from audit_logs for each application
  const fetchBatchPtpDatesFromAuditLog = useCallback(async (
    applicationIds: string[],
    selectedMonth?: string | null
  ): Promise<Record<string, string | null>> => {
    if (!user || applicationIds.length === 0) {
      console.log('❌ No user or empty application IDs for batch PTP dates (audit log)');
      return {};
    }
    setLoading(true);
    try {
      console.log('=== BATCH PTP DATES FROM AUDIT LOG FETCH ===');
      console.log('Application IDs:', applicationIds.length);
      console.log('Selected Month:', selectedMonth);

      let query = client
        .from('audit_logs')
        .select('application_id, field, new_value, created_at, demand_date')
        .in('application_id', applicationIds)
        .eq('field', 'PTP Date');

      // Add month filter if provided - filter by demand_date using proper date range
      if (selectedMonth) {
        // Convert EMI month format from display (Jul-25) to database (2025-07)
        const dbFormatMonth = convertEmiMonthToDatabase(selectedMonth);
        const { start, end } = getMonthDateRange(dbFormatMonth);
        query = query
          .gte('demand_date', start)
          .lte('demand_date', end);
      }

      // Order by created_at to get latest PTP date per application
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) {
        console.error('❌ Error fetching batch PTP dates from audit log:', error);
        return {};
      }

      // Group by application_id and get the latest PTP date from audit log
      const ptpMap: Record<string, string | null> = {};
      if (data) {
        data.forEach(log => {
          if (!ptpMap.hasOwnProperty(log.application_id)) {
            ptpMap[log.application_id] = log.new_value;
          }
        });
      }
      console.log('✅ Batch PTP dates from audit log loaded:', Object.keys(ptpMap).length, 'applications');
      return ptpMap;
    } catch (error) {
      console.error('❌ Error in fetchBatchPtpDatesFromAuditLog:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    fetchBatchPtpDates,
    fetchBatchPtpDatesFromAuditLog,
    loading
  };
};
