
import { useState, useEffect, useCallback } from 'react';
import { client } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { monthToEmiDate } from '@/utils/dateUtils';

export interface CallingLog {
  id: string;
  contact_type: string;
  previous_status: string | null;
  new_status: string;
  created_at: string;
  user_id: string;
  user_email: string | null;
  user_name: string;
  application_id: string;
  demand_date?: string;
}

export const useCallingLogs = (applicationId?: string, selectedMonth?: string) => {
  const { user } = useAuth();
  const { getUserName, fetchProfiles } = useUserProfiles();
  const [callingLogs, setCallingLogs] = useState<CallingLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCallingLogs = useCallback(async () => {
    if (!user || !applicationId) return;

    setLoading(true);
    try {
      console.log('=== FETCHING CALLING LOGS ===');
      console.log('Application ID:', applicationId);
      console.log('Selected Month:', selectedMonth);

      let query = client
        .from('calling_logs')
        .select('*')
        .eq('application_id', applicationId);

      // Add month filtering if selectedMonth is provided - filter by demand_date
      if (selectedMonth) {
        const emiDate = monthToEmiDate(selectedMonth);
        console.log('Filtering calling logs by demand_date:', emiDate);
        
        query = query.eq('demand_date', emiDate);
      }

      // Order by most recent first
      query = query.order('created_at', { ascending: false });

      const { data: logsData, error: logsError } = await query;

      if (logsError) {
        console.error('Error fetching calling logs:', logsError);
        return;
      }

      if (!logsData || logsData.length === 0) {
        console.log('No calling logs found for application:', applicationId, 'month:', selectedMonth);
        setCallingLogs([]);
        return;
      }

      console.log('Raw calling logs data:', logsData);

      // Get unique user IDs for profile fetching
      const userIds = [...new Set(logsData.map(log => log.user_id))];
      console.log('Fetching profiles for user IDs:', userIds);

      // Fetch user profiles first and wait for completion
      await fetchProfiles(userIds);

      // Small delay to ensure profiles are cached
      await new Promise(resolve => setTimeout(resolve, 100));

      // Map calling logs with resolved user names
      const mappedLogs: CallingLog[] = logsData.map(log => {
        const userName = getUserName(log.user_id, log.user_email);
        console.log(`✓ Calling log ${log.id}: user_id=${log.user_id} -> resolved_name="${userName}"`);
        
        return {
          ...log,
          user_name: userName
        };
      });

      console.log('Final mapped calling logs with resolved names:', mappedLogs);
      setCallingLogs(mappedLogs);
    } catch (error) {
      console.error('Exception in fetchCallingLogs:', error);
    } finally {
      setLoading(false);
    }
  }, [user, applicationId, selectedMonth, fetchProfiles, getUserName]);

  const addCallingLog = useCallback(async (
    contactType: string, 
    previousStatus: string, 
    newStatus: string
  ): Promise<void> => {
    if (!user || !applicationId) return;

    try {
      console.log('=== ADDING CALLING LOG ===');
      console.log('Application ID:', applicationId);
      console.log('Contact Type:', contactType);
      console.log('Previous Status:', previousStatus);
      console.log('New Status:', newStatus);
      console.log('User ID:', user.id);
      console.log('User email:', user.email);
      console.log('Selected Month:', selectedMonth);

      const logData: any = {
        application_id: applicationId,
        contact_type: contactType,
        previous_status: previousStatus,
        new_status: newStatus,
        user_id: user.id,
        user_email: user.email,
        user_name: getUserName(user.id, user.email)
      };

      // Add demand_date if selectedMonth is provided
      if (selectedMonth) {
        logData.demand_date = monthToEmiDate(selectedMonth);
      }

      const { error } = await client
        .from('calling_logs')
        .insert(logData);

      if (error) {
        console.error('Error adding calling log:', error);
        throw error;
      }

      console.log('✓ Calling log added successfully');
      // Refresh calling logs after adding
      await fetchCallingLogs();
    } catch (error) {
      console.error('Exception in addCallingLog:', error);
      throw error;
    }
  }, [user, applicationId, selectedMonth, getUserName, fetchCallingLogs]);

  useEffect(() => {
    fetchCallingLogs();
  }, [fetchCallingLogs]);

  const refetch = useCallback(async () => {
    await fetchCallingLogs();
  }, [fetchCallingLogs]);

  return {
    callingLogs,
    loading,
    addCallingLog,
    refetch
  };
};
