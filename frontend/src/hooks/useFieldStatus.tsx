
import { useState, useCallback } from 'react';
import { client } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { FieldStatus } from '@/types/database';
import { getMonthDateRange } from '@/utils/dateUtils';

export const useFieldStatus = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchFieldStatus = useCallback(async (applicationIds: string[], selectedMonth?: string) => {
    if (applicationIds.length === 0) return {};

    console.log('🔍 fetchFieldStatus called with:', { 
      applicationIdsCount: applicationIds.length, 
      selectedMonth,
      sampleIds: applicationIds.slice(0, 3)
    });

    if (selectedMonth) {
      // If selectedMonth is provided, filter by date range
      const { start, end } = getMonthDateRange(selectedMonth);
      console.log('🔍 Fetching field status for month range:', start, 'to', end);
      
      const { data, error } = await client
        .from('field_status')
        .select('*')
        .in('application_id', applicationIds)
        .gte('demand_date', start)
        .lte('demand_date', end)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching field status:', error);
        return {};
      }

      console.log('📋 Raw field status data:', data?.length || 0, 'records');
      console.log('📋 Sample field status records:', data?.slice(0, 3));

      // Create a map of application_id -> status (latest record per application for the month)
      const statusMap: Record<string, string> = {};
      const processedApps = new Set<string>();
      
      data?.forEach(status => {
        if (!processedApps.has(status.application_id)) {
          statusMap[status.application_id] = status.status;
          processedApps.add(status.application_id);
        }
      });

      console.log(`✅ Fetched field status for ${Object.keys(statusMap).length} applications (month: ${selectedMonth})`);
      console.log('📊 Status distribution from field_status table:', 
        Object.values(statusMap).reduce((acc, status) => {
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      );
      
      return statusMap;
    } else {
      // For analytics - get the truly latest status per application based on created_at only
      console.log('🔍 Fetching latest field status for all applications (analytics mode)');
      
      const { data, error } = await client
        .from('field_status')
        .select('*')
        .in('application_id', applicationIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching field status:', error);
        return {};
      }

      console.log('📋 Raw field status data (analytics mode):', data?.length || 0, 'records');

      // Create a map of application_id -> latest status (based on created_at only)
      const statusMap: Record<string, string> = {};
      const processedApps = new Set<string>();
      
      data?.forEach(status => {
        if (!processedApps.has(status.application_id)) {
          statusMap[status.application_id] = status.status;
          processedApps.add(status.application_id);
        }
      });

      console.log(`✅ Fetched latest field status for ${Object.keys(statusMap).length} applications (analytics mode)`);
      console.log('📊 Status distribution from field_status table (analytics):', 
        Object.values(statusMap).reduce((acc, status) => {
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      );
      
      return statusMap;
    }
  }, []);

  const updateFieldStatus = useCallback(async (applicationId: string, newStatus: string, demandDate: string) => {
    if (!user || !demandDate) return null;

    setLoading(true);
    try {
      // Convert YYYY-MM to actual EMI date (5th of the month)
      const emiDate = demandDate.match(/^\d{4}-\d{2}$/) 
        ? `${demandDate}-05` 
        : demandDate;

      console.log('Updating field status:', { applicationId, newStatus, emiDate });

      const updateData = {
        application_id: applicationId,
        status: newStatus,
        demand_date: emiDate,
        user_id: user.id,
        user_email: user.email,
        updated_at: new Date().toISOString()
      };

      // Use upsert with the correct conflict resolution
      const { data, error } = await client
        .from('field_status')
        .upsert(updateData, {
          onConflict: 'application_id,demand_date',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating field status:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error updating field status:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    fetchFieldStatus,
    updateFieldStatus,
    loading
  };
};
