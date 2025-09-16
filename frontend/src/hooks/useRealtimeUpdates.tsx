import { createContext, useContext, useCallback, useRef } from 'react';

interface RealtimeUpdateContextType {
  subscribe: (callback: (data: any) => void) => () => void;
  notify: (data: any) => void;
  notifyApplicationUpdate: (applicationId: string, updates: any) => void;
  notifyStatusUpdate: (applicationId: string, status: string) => void;
  notifyPreEmiStatusUpdate: (applicationId: string, preEmiStatus: string) => void;
  notifyPtpDateUpdate: (applicationId: string, ptpDate: string) => void;
  notifyAmountCollectedUpdate: (applicationId: string, amount: number) => void;
  notifyCommentAdded: (applicationId: string, comment: any) => void;
  notifyContactStatusUpdate: (applicationId: string, contactType: string, status: string) => void;
}

const RealtimeUpdateContext = createContext<RealtimeUpdateContextType | null>(null);

export const useRealtimeUpdates = () => {
  const context = useContext(RealtimeUpdateContext);
  if (!context) {
    throw new Error('useRealtimeUpdates must be used within a RealtimeUpdateProvider');
  }
  return context;
};

export const useRealtimeUpdateProvider = () => {
  const subscribers = useRef<Set<(data: any) => void>>(new Set());

  const subscribe = useCallback((callback: (data: any) => void) => {
    subscribers.current.add(callback);
    
    // Return unsubscribe function
    return () => {
      subscribers.current.delete(callback);
    };
  }, []);

  const notify = useCallback((data: any) => {
    subscribers.current.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in realtime update callback:', error);
      }
    });
  }, []);

  const notifyApplicationUpdate = useCallback((applicationId: string, updates: any) => {
    console.log('🔄 RealtimeUpdate: Notifying application update:', { applicationId, updates });
    notify({
      type: 'APPLICATION_UPDATE',
      applicationId,
      updates,
      timestamp: Date.now()
    });
  }, [notify]);

  const notifyStatusUpdate = useCallback((applicationId: string, status: string) => {
    console.log('🔄 RealtimeUpdate: Notifying status update:', { applicationId, status });
    notify({
      type: 'STATUS_UPDATE',
      applicationId,
      status,
      timestamp: Date.now()
    });
  }, [notify]);

  const notifyPreEmiStatusUpdate = useCallback((applicationId: string, preEmiStatus: string) => {
    console.log('🔄 RealtimeUpdate: Notifying pre-EMI status update:', { applicationId, preEmiStatus });
    notify({
      type: 'PRE_EMI_STATUS_UPDATE',
      applicationId,
      preEmiStatus,
      timestamp: Date.now()
    });
  }, [notify]);

  const notifyPtpDateUpdate = useCallback((applicationId: string, ptpDate: string) => {
    console.log('🔄 RealtimeUpdate: Notifying PTP date update:', { applicationId, ptpDate });
    notify({
      type: 'PTP_DATE_UPDATE',
      applicationId,
      ptpDate,
      timestamp: Date.now()
    });
  }, [notify]);

  const notifyAmountCollectedUpdate = useCallback((applicationId: string, amount: number) => {
    console.log('🔄 RealtimeUpdate: Notifying amount collected update:', { applicationId, amount });
    notify({
      type: 'AMOUNT_COLLECTED_UPDATE',
      applicationId,
      amount,
      timestamp: Date.now()
    });
  }, [notify]);

  const notifyCommentAdded = useCallback((applicationId: string, comment: any) => {
    console.log('🔄 RealtimeUpdate: Notifying comment added:', { applicationId, comment });
    notify({
      type: 'COMMENT_ADDED',
      applicationId,
      comment,
      timestamp: Date.now()
    });
  }, [notify]);

  const notifyContactStatusUpdate = useCallback((applicationId: string, contactType: string, status: string) => {
    console.log('🔄 RealtimeUpdate: Notifying contact status update:', { applicationId, contactType, status });
    notify({
      type: 'CONTACT_STATUS_UPDATE',
      applicationId,
      contactType,
      status,
      timestamp: Date.now()
    });
  }, [notify]);

  return {
    subscribe,
    notify,
    notifyApplicationUpdate,
    notifyStatusUpdate,
    notifyPreEmiStatusUpdate,
    notifyPtpDateUpdate,
    notifyAmountCollectedUpdate,
    notifyCommentAdded,
    notifyContactStatusUpdate
  };
};

export { RealtimeUpdateContext };