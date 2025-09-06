
import { useState, useEffect, useCallback } from 'react';
import { client } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { getMonthDateRange } from '@/utils/dateUtils';

export interface BatchComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user_name: string;
  application_id: string;
}

export const useBatchComments = (selectedMonth?: string | null) => {
  const { user } = useAuth();
  const { getUserName, fetchProfiles } = useUserProfiles();
  const [comments, setComments] = useState<Record<string, BatchComment[]>>({});
  const [loading, setLoading] = useState(false);

  const fetchBatchComments = useCallback(async (applicationIds: string[]): Promise<Record<string, BatchComment[]>> => {
    if (!user || !applicationIds.length) return {};

    setLoading(true);
    
    try {
      console.log('=== BATCH FETCHING COMMENTS ===');
      console.log('Application IDs:', applicationIds.slice(0, 5), '... and', Math.max(0, applicationIds.length - 5), 'more');
      console.log('Selected Month:', selectedMonth);

      // For now, return empty comments since we need applications data to map to payment_id
      // This will be fixed when we can pass applications data to this hook
      console.log('⚠️ Comments fetching temporarily disabled - needs applications data for payment_id mapping');
      setComments({});
      return {};
      
    } catch (error) {
      console.error('Exception in batch fetchComments:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, [user, selectedMonth]);

  // Clear comments when selectedMonth changes
  useEffect(() => {
    setComments({});
  }, [selectedMonth]);

  return {
    comments,
    loading,
    fetchBatchComments
  };
};
