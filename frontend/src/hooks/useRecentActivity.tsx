import { useState, useEffect, useCallback } from 'react';
import { RecentActivityService, RecentActivityItem, RecentActivityParams } from '@/integrations/api/services/recentActivityService';

interface UseRecentActivityReturn {
  activities: RecentActivityItem[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refreshActivities: () => Promise<void>;
}

export const useRecentActivity = (params: RecentActivityParams = {}): UseRecentActivityReturn => {
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching recent activity with params:', params);
      
      const response = await RecentActivityService.getRecentActivity(params);
      
      console.log('📥 Recent activity data received:', response);
      
      setActivities(response.activities || []);
      setTotalCount(response.total_count || 0);
    } catch (err) {
      console.error('❌ Error fetching recent activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recent activity');
      setActivities([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [params.loan_id, params.repayment_id, params.limit, params.days_back]);

  const refreshActivities = useCallback(async () => {
    await fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    totalCount,
    refreshActivities,
  };
};

export const useLoanRecentActivity = (
  loanId: number | null,
  params: Omit<RecentActivityParams, 'loan_id'> = {}
): UseRecentActivityReturn => {
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchActivities = useCallback(async () => {
    if (!loanId) {
      console.log('🔄 useLoanRecentActivity: No loan ID, clearing activities');
      setActivities([]);
      setTotalCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 useLoanRecentActivity: Fetching loan recent activity for loan ID:', loanId, 'with params:', params);
      console.log('🔄 useLoanRecentActivity: Repayment ID:', params.repayment_id);
      
      const response = await RecentActivityService.getLoanRecentActivity(loanId, params);
      
      console.log('📥 useLoanRecentActivity: Loan recent activity data received:', response);
      console.log('📥 useLoanRecentActivity: Activities count:', response.activities?.length || 0);
      
      setActivities(response.activities || []);
      setTotalCount(response.total_count || 0);
    } catch (err) {
      console.error('❌ useLoanRecentActivity: Error fetching loan recent activity:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch loan recent activity');
      setActivities([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [loanId, params.repayment_id, params.limit, params.days_back]);

  const refreshActivities = useCallback(async () => {
    await fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return {
    activities,
    loading,
    error,
    totalCount,
    refreshActivities,
  };
};
