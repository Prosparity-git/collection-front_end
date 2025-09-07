
import { useEffect, useRef } from 'react';
import { client } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';

interface UseRealtimeUpdatesProps {
  onApplicationUpdate?: () => void;
  onCallingLogUpdate?: () => void;
  onAuditLogUpdate?: () => void;
  onCommentUpdate?: () => void;
  onPtpDateUpdate?: () => void;
}

export const useRealtimeUpdates = ({
  onApplicationUpdate,
  onCallingLogUpdate,
  onAuditLogUpdate,
  onCommentUpdate,
  onPtpDateUpdate
}: UseRealtimeUpdatesProps) => {
  const { user } = useAuth();
  const channelsRef = useRef<any[]>([]);
  const isActiveRef = useRef(true);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!user) return;

    console.log('=== SETTING UP OPTIMIZED REAL-TIME SUBSCRIPTIONS ===');

    // Track page visibility to pause/resume connections
    const handleVisibilityChange = () => {
      isActiveRef.current = !document.hidden;
      
      if (document.hidden) {
        console.log('🛑 Tab hidden - pausing real-time updates');
        // Clear any pending updates
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }
      } else {
        console.log('👁️ Tab visible - resuming real-time updates');
        // Trigger a delayed refresh when tab becomes active again
        updateTimeoutRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            onApplicationUpdate?.();
          }
        }, 1000); // Increased delay to allow for settling
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Create optimized real-time subscriptions with improved debouncing
    const createSubscription = (tableName: string, callback: () => void) => {
      return client
        .channel(`${tableName}-changes-optimized`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tableName
          },
          (payload) => {
            // Only process updates if tab is active
            if (isActiveRef.current) {
              console.log(`✅ ${tableName} update received:`, payload);
              
              // Clear any existing timeout to debounce rapid updates
              if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
              }
              
              // Debounce the callback to prevent rapid-fire updates
              updateTimeoutRef.current = setTimeout(() => {
                if (isActiveRef.current) {
                  callback();
                }
              }, 500); // 500ms debounce for better stability
            } else {
              console.log(`⏸️ ${tableName} update received but tab inactive`);
            }
          }
        )
        .subscribe();
    };

    // Subscribe to critical tables only with improved callback handling
    const subscriptions = [
      createSubscription('ptp_dates', () => {
        onPtpDateUpdate?.();
        // Don't trigger additional application updates for PTP changes
        // as they cause month switching issues
      }),
      
      createSubscription('audit_logs', () => {
        onAuditLogUpdate?.();
      }),
      
      createSubscription('applications', () => {
        onApplicationUpdate?.();
      }),
      
      createSubscription('calling_logs', () => {
        onCallingLogUpdate?.();
      }),
      
      createSubscription('contact_calling_status', () => {
        onCallingLogUpdate?.();
      }),
      
      createSubscription('comments', () => {
        onCommentUpdate?.();
      }),

      // Add field_status subscription for status updates
      createSubscription('field_status', () => {
        onApplicationUpdate?.();
      }),

      // Add collection subscription for amount updates
      createSubscription('collection', () => {
        onApplicationUpdate?.();
      })
    ];

    channelsRef.current = subscriptions;

    return () => {
      console.log('🧹 Cleaning up optimized real-time subscriptions');
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Clear any pending timeouts
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      subscriptions.forEach(channel => {
        client.removeChannel(channel);
      });
      channelsRef.current = [];
    };
  }, [user, onApplicationUpdate, onCallingLogUpdate, onAuditLogUpdate, onCommentUpdate, onPtpDateUpdate]);

  // Return current connection status
  return {
    isActive: isActiveRef.current,
    connectionCount: channelsRef.current.length
  };
};
