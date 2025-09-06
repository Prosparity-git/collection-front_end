import { useState, useCallback, useRef, useEffect } from 'react';
import { useFieldStatusManager } from '@/hooks/useFieldStatusManager';
import { useBatchComments } from '@/hooks/useBatchComments';
import { useBatchPtpDates } from '@/hooks/useBatchPtpDates';
import { useBatchContactCallingStatus } from '@/hooks/useBatchContactCallingStatus';

interface CentralizedData {
  statuses: Record<string, string>;
  comments: Record<string, any[]>;
  ptpDates: Record<string, string | null>;
  contactStatuses: Record<string, any>;
}

interface DataManagerOptions {
  selectedEmiMonth?: string | null;
  priority?: 'high' | 'medium' | 'low';
}

export const useCentralizedDataManager = (selectedEmiMonth?: string | null) => {
  const { fetchFieldStatus, loading: statusLoading } = useFieldStatusManager();
  const { fetchBatchComments, comments, loading: commentsLoading } = useBatchComments(selectedEmiMonth);
  const { fetchBatchPtpDates, fetchBatchPtpDatesFromAuditLog, loading: ptpLoading } = useBatchPtpDates();
  const { fetchBatchContactStatus, loading: contactLoading } = useBatchContactCallingStatus();

  const [data, setData] = useState<CentralizedData>({
    statuses: {},
    comments: {},
    ptpDates: {},
    contactStatuses: {}
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<string>('');

  const fetchAllData = useCallback(async (
    applicationIds: string[],
    options: DataManagerOptions = {}
  ): Promise<CentralizedData> => {
    if (applicationIds.length === 0) {
      const emptyData = {
        statuses: {},
        comments: {},
        ptpDates: {},
        contactStatuses: {}
      };
      setData(emptyData);
      return emptyData;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const requestId = `${applicationIds.join(',')}-${options.selectedEmiMonth || 'none'}`;

    // Skip duplicate requests
    if (lastRequestRef.current === requestId) {
      console.log('⏭️ Skipping duplicate centralized data request');
      return data;
    }

    lastRequestRef.current = requestId;
    setLoading(true);
    setError(null);

    try {
      console.log('=== CENTRALIZED DATA MANAGER ===');
      console.log('Application IDs:', applicationIds.length);
      console.log('Selected EMI Month:', options.selectedEmiMonth);
      console.log('Priority:', options.priority || 'medium');

      // Determine request strategy based on priority and data size
      const shouldParallelize = applicationIds.length < 500 && options.priority !== 'low';

      let newData: CentralizedData;

      if (shouldParallelize) {
        // Fetch all data in parallel for better performance
        console.log('📊 Fetching all data in parallel...');
        const [statusData, ptpData, contactData, commentsResult] = await Promise.all([
          fetchFieldStatus(applicationIds, options.selectedEmiMonth),
          fetchBatchPtpDatesFromAuditLog(applicationIds, options.selectedEmiMonth),
          fetchBatchContactStatus(applicationIds, options.selectedEmiMonth),
          fetchBatchComments(applicationIds)
        ]);

        newData = {
          statuses: statusData,
          ptpDates: ptpData,
          contactStatuses: contactData,
          comments: commentsResult
        };
      } else {
        // Sequential loading for large datasets or low priority
        console.log('📊 Fetching data sequentially...');
        
        const statusData = await fetchFieldStatus(applicationIds, options.selectedEmiMonth);
        
        if (abortControllerRef.current?.signal.aborted) return data;
        
        const ptpData = await fetchBatchPtpDatesFromAuditLog(applicationIds, options.selectedEmiMonth);
        
        if (abortControllerRef.current?.signal.aborted) return data;
        
        const contactData = await fetchBatchContactStatus(applicationIds, options.selectedEmiMonth);
        
        if (abortControllerRef.current?.signal.aborted) return data;
        
        const commentsResult = await fetchBatchComments(applicationIds);

        newData = {
          statuses: statusData,
          ptpDates: ptpData,
          contactStatuses: contactData,
          comments: commentsResult
        };
      }

      // Check if request was cancelled
      if (abortControllerRef.current?.signal.aborted) {
        return data;
      }

      console.log('✅ Centralized data fetch complete:', {
        statuses: Object.keys(newData.statuses).length,
        ptpDates: Object.keys(newData.ptpDates).length,
        contactStatuses: Object.keys(newData.contactStatuses).length,
        comments: Object.keys(newData.comments).length
      });

      setData(newData);
      return newData;

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('🛑 Centralized data fetch was cancelled');
        return data;
      }

      console.error('❌ Error in centralized data fetch:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
      
      // Return partial data instead of throwing
      return data;
    } finally {
      setLoading(false);
    }
  }, [fetchFieldStatus, fetchBatchComments, fetchBatchPtpDates, fetchBatchPtpDatesFromAuditLog, fetchBatchContactStatus]);

  const clearData = useCallback(() => {
    setData({
      statuses: {},
      comments: {},
      ptpDates: {},
      contactStatuses: {}
    });
    setError(null);
  }, []);

  const cancelRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const isLoading = loading || statusLoading || commentsLoading || ptpLoading || contactLoading;

  return {
    data,
    loading: isLoading,
    error,
    fetchAllData,
    clearData,
    cancelRequests
  };
};
