
import { useState, useCallback } from 'react';
import { client } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { PtpDate } from '@/types/database';
import { getMonthDateRange } from '@/utils/dateUtils';

export const usePtpDates = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchPtpDate = useCallback(async (applicationId: string, demandMonth?: string): Promise<string | null> => {
    if (!user) return null;
    
    try {
      let query = client
        .from('ptp_dates')
        .select('ptp_date')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false })
        .limit(1);

      // Add demand_date filter if provided (month range)
      if (demandMonth) {
        const { start, end } = getMonthDateRange(demandMonth);
        query = query.gte('demand_date', start).lte('demand_date', end);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('Error fetching PTP date:', error);
        return null;
      }

      return data?.ptp_date || null;
    } catch (error) {
      console.error('Error fetching PTP date:', error);
      return null;
    }
  }, [user]);

  const fetchPtpDates = useCallback(async (applicationIds: string[], demandMonth?: string): Promise<Record<string, string | null>> => {
    if (!user || applicationIds.length === 0) return {};
    
    try {
      console.log('🔄 Fetching PTP dates for', applicationIds.length, 'applications');
      console.log('Demand month filter:', demandMonth || 'All dates');
      
      let query = client
        .from('ptp_dates')
        .select('application_id, ptp_date, created_at, demand_date')
        .in('application_id', applicationIds)
        .order('application_id', { ascending: true })
        .order('created_at', { ascending: false });

      // Add demand_date filter if provided (month range)
      if (demandMonth) {
        const { start, end } = getMonthDateRange(demandMonth);
        query = query.gte('demand_date', start).lte('demand_date', end);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching PTP dates:', error);
        return {};
      }

      // Get the latest record for each application (including null ptp_date)
      const ptpMap: Record<string, string | null> = {};
      const processedApps = new Set<string>();
      
      data?.forEach(ptp => {
        if (!processedApps.has(ptp.application_id)) {
          ptpMap[ptp.application_id] = ptp.ptp_date;
          processedApps.add(ptp.application_id);
        }
      });

      console.log('✅ Fetched PTP dates:', Object.keys(ptpMap).length, 'applications processed');
      return ptpMap;
    } catch (error) {
      console.error('Error fetching PTP dates:', error);
      return {};
    }
  }, [user]);

  const updatePtpDate = useCallback(async (applicationId: string, ptpDate: string | null, demandDate: string) => {
    if (!user || !demandDate) {
      console.error('PTP Update Failed: User not authenticated or demand date missing');
      return false;
    }

    console.log('=== PTP UPDATE ATTEMPT - USING UPSERT ===');
    console.log('Application ID:', applicationId);
    console.log('Demand Date:', demandDate);
    console.log('User ID:', user.id);
    console.log('New PTP Date:', ptpDate);
    console.log('Is clearing date:', ptpDate === null || ptpDate === '');

    setLoading(true);
    try {
      // Validate input
      if (!applicationId || applicationId.trim() === '') {
        console.error('PTP Update Failed: Invalid application ID');
        return false;
      }

      // Validate date format if provided (not null/empty)
      if (ptpDate && ptpDate.trim() !== '') {
        const parsedDate = new Date(ptpDate);
        if (isNaN(parsedDate.getTime())) {
          console.error('PTP Update Failed: Invalid PTP date format:', ptpDate);
          return false;
        }
      }

      // Convert empty string to null for clearing
      const finalPtpDate = (ptpDate && ptpDate.trim() !== '') ? ptpDate : null;

      // Convert YYYY-MM to actual EMI date (5th of the month) and validate
      let emiDate: string;
      if (demandDate.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = demandDate.split('-').map(Number);
        
        // Validate month
        if (month < 1 || month > 12) {
          console.error('PTP Update Failed: Invalid month in demand date:', demandDate);
          return false;
        }
        
        // Create date and validate it exists (prevents Feb 31, etc.)
        const testDate = new Date(year, month - 1, 5);
        if (testDate.getMonth() !== month - 1) {
          console.error('PTP Update Failed: Invalid date would be created from:', demandDate);
          return false;
        }
        
        emiDate = `${demandDate}-05`;
      } else {
        // Validate existing date format
        const testDate = new Date(demandDate);
        if (isNaN(testDate.getTime())) {
          console.error('PTP Update Failed: Invalid demand date format:', demandDate);
          return false;
        }
        emiDate = demandDate;
      }

      console.log('Attempting to upsert PTP date record...');
      console.log('Final PTP Date value:', finalPtpDate);
      console.log('EMI Date:', emiDate);
      
      // Use upsert to handle both insert and update cases
      const { error: upsertError, data: upsertData } = await client
        .from('ptp_dates')
        .upsert({
          application_id: applicationId,
          ptp_date: finalPtpDate,
          demand_date: emiDate,
          user_id: user.id
        }, {
          onConflict: 'application_id,demand_date',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (upsertError) {
        console.error('❌ PTP Upsert Error:', upsertError);
        return false;
      }

      console.log('✅ PTP date record upserted:', upsertData);
      return true;

    } catch (error) {
      console.error('PTP Update Failed: Unexpected error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    fetchPtpDate,
    fetchPtpDates,
    updatePtpDate,
    loading
  };
};
