
import { useState, useEffect, useCallback } from 'react';
import { client } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { monthToEmiDate } from '@/utils/dateUtils';

export interface AuditLog {
  id: string;
  field: string;
  previous_value: string | null;
  new_value: string | null;
  created_at: string;
  user_id: string;
  user_email: string | null;
  user_name: string;
  application_id: string;
  demand_date?: string;
}

export const useAuditLogs = (applicationId?: string, selectedMonth?: string) => {
  const { user } = useAuth();
  const { getUserName, fetchProfiles } = useUserProfiles();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAuditLogs = useCallback(async () => {
    if (!user || !applicationId) return;

    setLoading(true);
    try {
      console.log('=== FETCHING AUDIT LOGS ===');
      console.log('Application ID:', applicationId);
      console.log('Selected Month:', selectedMonth);

      let query = client
        .from('audit_logs')
        .select('*')
        .eq('application_id', applicationId);

      // Add month filtering if selectedMonth is provided - filter by demand_date
      if (selectedMonth) {
        const emiDate = monthToEmiDate(selectedMonth);
        console.log('Filtering audit logs by demand_date:', emiDate);
        
        query = query.eq('demand_date', emiDate);
      }

      // Order by most recent first
      query = query.order('created_at', { ascending: false });

      const { data: auditData, error: auditError } = await query;

      if (auditError) {
        console.error('Error fetching audit logs:', auditError);
        return;
      }

      if (!auditData || auditData.length === 0) {
        console.log('No audit logs found for application:', applicationId, 'month:', selectedMonth);
        setAuditLogs([]);
        return;
      }

      console.log('Raw audit logs data:', auditData);

      // Get unique user IDs for profile fetching
      const userIds = [...new Set(auditData.map(log => log.user_id))];
      console.log('Fetching profiles for user IDs:', userIds);

      // Fetch user profiles first and wait for completion
      await fetchProfiles(userIds);

      // Small delay to ensure profiles are cached
      await new Promise(resolve => setTimeout(resolve, 100));

      // Map audit logs with resolved user names
      const mappedLogs: AuditLog[] = auditData.map(log => {
        const userName = getUserName(log.user_id, log.user_email);
        console.log(`✓ Audit log ${log.id}: user_id=${log.user_id} -> resolved_name="${userName}"`);
        
        return {
          ...log,
          user_name: userName
        };
      });

      console.log('Final mapped audit logs with resolved names:', mappedLogs);
      setAuditLogs(mappedLogs);
    } catch (error) {
      console.error('Exception in fetchAuditLogs:', error);
    } finally {
      setLoading(false);
    }
  }, [user, applicationId, selectedMonth, fetchProfiles, getUserName]);

  const addAuditLog = useCallback(async (
    appId: string, 
    field: string, 
    previousValue: string | null, 
    newValue: string | null,
    demandDate?: string
  ): Promise<void> => {
    if (!user) return;

    try {
      console.log('=== ADDING AUDIT LOG ===');
      console.log('Application ID:', appId);
      console.log('Field:', field);
      console.log('Previous Value:', previousValue);
      console.log('New Value:', newValue);
      console.log('User ID:', user.id);
      console.log('User email:', user.email);
      console.log('Demand Date:', demandDate);

      const logData: any = {
        application_id: appId,
        field,
        previous_value: previousValue,
        new_value: newValue,
        user_id: user.id,
        user_email: user.email
      };

      // Add demand_date if provided
      if (demandDate) {
        logData.demand_date = demandDate;
      }

      const { error } = await client
        .from('audit_logs')
        .insert(logData);

      if (error) {
        console.error('Error adding audit log:', error);
        throw error;
      }

      console.log('✓ Audit log added successfully');
      // Refresh audit logs after adding
      await fetchAuditLogs();
    } catch (error) {
      console.error('Exception in addAuditLog:', error);
      throw error;
    }
  }, [user, fetchAuditLogs]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  const refetch = useCallback(async () => {
    await fetchAuditLogs();
  }, [fetchAuditLogs]);

  return {
    auditLogs,
    loading,
    addAuditLog,
    refetch
  };
};
