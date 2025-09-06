import { useEffect, useRef, useCallback } from 'react';
import { client } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';

interface UseOptimizedRealtimeUpdatesProps {
  onApplicationUpdate?: () => void;
  onStatusUpdate?: () => void;
  selectedEmiMonth?: string | null;
  currentApplicationIds?: string[];
}

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: { [key: string]: any };
  old?: { [key: string]: any };
  errors?: any[];
}

export const useOptimizedRealtimeUpdates = ({
  onApplicationUpdate,
  onStatusUpdate,
  selectedEmiMonth,
  currentApplicationIds = []
}: UseOptimizedRealtimeUpdatesProps) => {
  const { user } = useAuth();
  const channelRef = useRef<any>(null);
  const isActiveRef = useRef(true);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  // Throttled update function to batch multiple rapid changes
  const throttledUpdate = useCallback((updateType: 'application' | 'status') => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      if (isActiveRef.current) {
        console.log(`Throttled ${updateType} update triggered`);
        if (updateType === 'application') {
          onApplicationUpdate?.();
        } else {
          onStatusUpdate?.();
        }
      }
    }, 1500); // Increased throttle to 1.5 seconds to reduce updates
  }, [onApplicationUpdate, onStatusUpdate]);

  useEffect(() => {
    if (!user || !selectedEmiMonth || currentApplicationIds.length === 0) {
      return;
    }

    console.log('=== SETTING UP OPTIMIZED REAL-TIME SUBSCRIPTIONS ===');
    console.log('Monitoring applications:', currentApplicationIds.slice(0, 5), '... and', Math.max(0, currentApplicationIds.length - 5), 'more');

    // Handle visibility changes
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
      if (!document.hidden) {
        console.log('Tab visible - resuming updates');
        // Trigger update after coming back to tab (delayed to avoid spam)
        setTimeout(() => {
          if (isActiveRef.current) {
            onApplicationUpdate?.();
          }
        }, 2000);
      } else {
        console.log('Tab hidden - pausing updates');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Create a single channel for critical updates only
    const channel = client.channel(`optimized-updates-${selectedEmiMonth}`)
      
    // Only subscribe to field_status changes for current applications
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'field_status'
      },
      (payload: RealtimePayload) => {
        if (isActiveRef.current && payload.new && (payload.new as any).application_id && currentApplicationIds.includes((payload.new as any).application_id)) {
          console.log('Status update for visible application:', (payload.new as any).application_id);
          throttledUpdate('status');
        }
      }
    )
    
    // Subscribe to PTP changes for current applications
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ptp_dates'
      },
      (payload: RealtimePayload) => {
        if (isActiveRef.current && payload.new && (payload.new as any).application_id && currentApplicationIds.includes((payload.new as any).application_id)) {
          console.log('PTP update for visible application:', (payload.new as any).application_id);
          throttledUpdate('status');
        }
      }
    )
    
    .subscribe((status) => {
      console.log('Optimized realtime subscription status:', status);
    });

    channelRef.current = channel;

    return () => {
      console.log('🧹 Cleaning up optimized real-time subscriptions');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      if (channelRef.current) {
        client.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, selectedEmiMonth, currentApplicationIds, throttledUpdate]);

  return {
    isActive: isActiveRef.current,
    connectionActive: !!channelRef.current
  };
};
