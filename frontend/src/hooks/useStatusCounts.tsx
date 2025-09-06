import { useState, useEffect, useCallback, useRef } from 'react';
import { getCollectionsSummary } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { FilterState } from '@/types/filters';
import { getMonthDateRange, monthToEmiDate } from '@/utils/dateUtils';
import { useFieldStatusManager } from '@/hooks/useFieldStatusManager';

interface StatusCounts {
  total: number;
  statusFuture: number;
  statusOverdue: number;
  statusPartiallyPaid: number;
  statusPaid: number;
  statusForeclose: number;
  statusPendingApproval: number;
  statusPaidRejected: number;
}

interface UseStatusCountsProps {
  filters: FilterState;
  selectedEmiMonth?: string | null;
  searchTerm?: string;
}

export const useStatusCounts = ({ filters, selectedEmiMonth, searchTerm = '' }: UseStatusCountsProps) => {
  const { user } = useAuth();
  const { fetchFieldStatus } = useFieldStatusManager();
  const [statusCounts, setStatusCounts] = useState<StatusCounts>({
    total: 0,
    statusFuture: 0,
    statusOverdue: 0,
    statusPartiallyPaid: 0,
    statusPaid: 0,
    statusForeclose: 0,
    statusPendingApproval: 0,
    statusPaidRejected: 0
  });
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastRequestRef = useRef<string>('');

  const validateInputs = useCallback((month?: string | null): boolean => {
    if (!user) {
      console.warn('❌ No user for status counts');
      return false;
    }
    if (!month) {
      console.warn('❌ No selected EMI month for status counts');
      return false;
    }
    return true;
  }, [user]);

  const isOnlyEmiMonthFilter = (filters: FilterState) => {
    // All filters except emiMonth should be empty
    return Object.entries(filters).every(([key, value]) => {
      if (key === 'emiMonth') return true;
      return Array.isArray(value) && value.length === 0;
    });
  };

  const fetchStatusCounts = useCallback(async () => {
    if (!validateInputs(selectedEmiMonth)) {
      setStatusCounts({
        total: 0,
        statusFuture: 0,
        statusOverdue: 0,
        statusPartiallyPaid: 0,
        statusPaid: 0,
        statusForeclose: 0,
        statusPendingApproval: 0,
        statusPaidRejected: 0
      });
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // Always use FastAPI backend summary with filters
      const summary = await getCollectionsSummary(selectedEmiMonth!, filters);
      // Map backend keys to StatusCounts
      setStatusCounts({
        total: summary.total || 0,
        statusFuture: summary.future || 0,
        statusOverdue: summary.overdue || 0,
        statusPartiallyPaid: summary.partially_paid || 0,
        statusPaid: summary.paid || 0,
        statusForeclose: summary.foreclose || 0,
        statusPendingApproval: summary.paid_pending_approval || 0,
        statusPaidRejected: summary.paid_rejected || 0
      });
    } catch (error) {
      console.error('Error fetching status counts:', error);
      setStatusCounts({
        total: 0,
        statusFuture: 0,
        statusOverdue: 0,
        statusPartiallyPaid: 0,
        statusPaid: 0,
        statusForeclose: 0,
        statusPendingApproval: 0,
        statusPaidRejected: 0
      });
    } finally {
      setLoading(false);
    }
  }, [selectedEmiMonth, filters, validateInputs]);

  // Effect with proper cleanup
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchStatusCounts();
    }, 300); // Debounce requests

    return () => {
      clearTimeout(timeoutId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStatusCounts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    statusCounts,
    loading,
    refetch: fetchStatusCounts
  };
};
