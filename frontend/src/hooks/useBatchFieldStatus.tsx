
import { useState } from 'react';
import { useFieldStatusManager } from '@/hooks/useFieldStatusManager';

export const useBatchFieldStatus = () => {
  const { fetchFieldStatus, loading: managerLoading } = useFieldStatusManager();
  const [loading, setLoading] = useState(false);

  const fetchBatchFieldStatus = async (
    applicationIds: string[], 
    selectedMonth?: string | null
  ): Promise<Record<string, string>> => {
    if (applicationIds.length === 0) {
      console.log('❌ No application IDs for batch field status');
      return {};
    }
    
    setLoading(true);
    
    try {
      console.log('=== BATCH FIELD STATUS FETCH ===');
      console.log('Application IDs:', applicationIds.length);
      console.log('Selected Month:', selectedMonth);

      const result = await fetchFieldStatus(applicationIds, selectedMonth);
      
      console.log('✅ Batch field status loaded:', Object.keys(result).length, 'applications');
      return result;
    } catch (error) {
      console.error('❌ Error in fetchBatchFieldStatus:', error);
      return {}; // Return empty object to prevent cascade failures
    } finally {
      setLoading(false);
    }
  };

  return {
    fetchBatchFieldStatus,
    loading: loading || managerLoading
  };
};
