import { useEffect, useCallback, useRef } from 'react';
import { useRealtimeUpdates } from './useRealtimeUpdates';
import { Application } from '@/types/application';

interface UseRealtimeApplicationUpdatesProps {
  applications: Application[];
  setApplications: (applications: Application[]) => void;
  onApplicationUpdate?: (applicationId: string, updates: any) => void;
}

export const useRealtimeApplicationUpdates = ({
  applications,
  setApplications,
  onApplicationUpdate
}: UseRealtimeApplicationUpdatesProps) => {
  const { subscribe } = useRealtimeUpdates();
  const applicationsRef = useRef(applications);

  // Update ref when applications change
  useEffect(() => {
    applicationsRef.current = applications;
  }, [applications]);

  const updateApplication = useCallback((applicationId: string, updates: any) => {
    console.log('🔄 RealtimeApplicationUpdates: Updating application:', { applicationId, updates });
    
    setApplications(prevApplications => {
      return prevApplications.map(app => {
        if (app.applicant_id === applicationId) {
          const updatedApp = { ...app, ...updates };
          console.log('🔄 RealtimeApplicationUpdates: Updated application:', updatedApp);
          return updatedApp;
        }
        return app;
      });
    });

    // Call the optional callback
    if (onApplicationUpdate) {
      onApplicationUpdate(applicationId, updates);
    }
  }, [setApplications, onApplicationUpdate]);

  useEffect(() => {
    const unsubscribe = subscribe((update) => {
      console.log('🔄 RealtimeApplicationUpdates: Received update:', update);
      
      const { type, applicationId, ...updateData } = update;
      
      switch (type) {
        case 'STATUS_UPDATE':
          updateApplication(applicationId, { 
            status: updateData.status,
            field_status: updateData.status 
          });
          break;
          
        case 'PRE_EMI_STATUS_UPDATE':
          updateApplication(applicationId, { 
            demand_calling_status: updateData.preEmiStatus 
          });
          break;
          
        case 'PTP_DATE_UPDATE':
          updateApplication(applicationId, { 
            ptp_date: updateData.ptpDate 
          });
          break;
          
        case 'AMOUNT_COLLECTED_UPDATE':
          updateApplication(applicationId, { 
            amount_collected: updateData.amount 
          });
          break;
          
        case 'COMMENT_ADDED':
          // For comments, we might want to trigger a refresh of comments
          // or update a comment count if we track that
          console.log('🔄 RealtimeApplicationUpdates: Comment added for application:', applicationId);
          break;
          
        case 'CONTACT_STATUS_UPDATE':
          // Update the specific contact calling status
          const contactType = updateData.contactType;
          const status = updateData.status;
          
          updateApplication(applicationId, {
            [`${contactType}_calling_status`]: status
          });
          break;
          
        case 'APPLICATION_UPDATE':
          // Generic application update
          updateApplication(applicationId, updateData.updates);
          break;
          
        default:
          console.log('🔄 RealtimeApplicationUpdates: Unknown update type:', type);
      }
    });

    return unsubscribe;
  }, [subscribe, updateApplication]);

  return {
    updateApplication
  };
};
