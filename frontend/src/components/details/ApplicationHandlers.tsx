import { useCallback } from 'react';
import { client } from '@/integrations/api/client';
import { Application } from '@/types/application';
import { monthToEmiDate } from '@/utils/dateUtils';
import { toast } from 'sonner';
import { StatusManagementService } from '@/integrations/api/services/statusManagementService';

export const useApplicationHandlers = (
  application: Application | null,
  user: any,
  addAuditLog: any,
  addCallingLog: any,
  onUpdate: (updatedApp: Application) => void,
  selectedMonth?: string
) => {
  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!application || !user || !selectedMonth) return;

    const originalApplication = application;
    const previousStatus = originalApplication.lms_status;
    const updatedApplication = { ...application, lms_status: newStatus };

    // 1. Optimistic UI update - update both local state and parent
    

    onUpdate(updatedApplication);

    try {
      // 2. Safe database update
      const { error } = await client
        .from('applications')
        .update({ lms_status: newStatus })
        .eq('applicant_id', originalApplication.applicant_id);

      if (error) {
        console.error('Database error updating status:', error);
        throw error;
      }

      // Add to audit log on success - status changes are tracked per month
      await addAuditLog(
        originalApplication.applicant_id,
        'Status',
        previousStatus,
        newStatus,
        monthToEmiDate(selectedMonth) // Use proper date format
      );

      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status. Reverting change.');
      // 3. Revert UI on failure - update both local state and parent
      onUpdate(originalApplication);
    }
  }, [application, user, addAuditLog, onUpdate, selectedMonth]);

  const handlePtpDateChange = useCallback(async (newPtpDate: string | null) => {
    if (!application || !user || !selectedMonth) return;

    const originalApplication = application;
    const previousPtpDate = originalApplication.ptp_date || null;
    const updatedApplication = { ...application, ptp_date: newPtpDate };

    // 1. Optimistic UI update - update both local state and parent
    onUpdate(updatedApplication);

    try {
      // Convert YYYY-MM to EMI date format
      const emiDate = selectedMonth.match(/^\d{4}-\d{2}$/)
        ? `${selectedMonth}-05`
        : selectedMonth;

      // 2. Safe database update
      const { error } = await client
        .from('ptp_dates')
        .upsert(
          {
            application_id: application.applicant_id,
            ptp_date: newPtpDate,
            demand_date: emiDate,
            user_id: user.id,
            user_email: user.email,
            updated_at: new Date().toISOString()
          },
          {
            onConflict: 'application_id,demand_date',
            ignoreDuplicates: false
          }
        );

      if (error) {
        console.error('Database error updating PTP date:', error);
        throw error;
      }

      // Add to audit log on success - PTP date changes are tracked per month
      await addAuditLog(
        originalApplication.applicant_id,
        'PTP Date',
        previousPtpDate || 'None',
        newPtpDate || 'None',
        emiDate // Use proper date format
      );

      toast.success('PTP Date updated successfully');
    } catch (error) {
      console.error('Failed to update PTP Date:', error);
      toast.error('Failed to update PTP Date. Reverting change.');
      // 3. Revert UI on failure - update both local state and parent
      onUpdate(originalApplication);
    }
  }, [application, user, addAuditLog, onUpdate, selectedMonth]);

  const handleCallingStatusChange = useCallback(async (contactType: string, newStatus: string, currentStatus?: string) => {
    if (!application || !user || !selectedMonth) return;

    try {
      console.log('=== UPDATING CALLING STATUS ===');
      console.log('Application ID:', application.applicant_id);
      console.log('Contact Type:', contactType);
      console.log('New Status:', newStatus);
      console.log('Selected Month:', selectedMonth);

      // Convert YYYY-MM to EMI date format (5th of the month)
      const emiDate = selectedMonth.match(/^\d{4}-\d{2}$/)
        ? `${selectedMonth}-05`
        : selectedMonth;

      // Optimistically update the UI
      const updatedApp: Application = {
        ...application,
        [`${contactType}_calling_status`]: newStatus,
      } as Application;
      onUpdate(updatedApp);

      // Add calling log
      await addCallingLog(contactType, currentStatus || 'not called', newStatus);

      // Use StatusManagementService to update contact calling status
      const contactId = application.loan_id ? application.loan_id.toString() : application.applicant_id.toString();
      console.log('🔑 ApplicationHandlers: Using contact ID for API call:', contactId, '(loan_id available:', !!application.loan_id, ')');
      console.log('🔑 ApplicationHandlers: Using repayment ID for API call:', application.payment_id?.toString(), '(payment_id available:', !!application.payment_id, ')');
      const result = await StatusManagementService.updateContactCallingStatus(
        contactId,
        contactType,
        newStatus,
        emiDate,
        application.payment_id?.toString()
      );

      if (result.success) {
        console.log('✅ Contact calling status updated successfully via API:', result);
        toast.success(`Calling status updated for ${contactType}`);
      } else {
        throw new Error(result.message || 'Failed to update calling status');
      }

    } catch (error) {
      console.error('Failed to update calling status:', error);
      toast.error('Failed to update calling status');
      
      // Revert optimistic update on error
      onUpdate(application);
    }
  }, [application, user, addCallingLog, onUpdate, selectedMonth]);

  const handleAmountCollectedChange = useCallback(async (newAmount: number | null) => {
    if (!application || !user || !selectedMonth) return;

    const previousAmount = application.amount_collected || 0;
    
    try {
      console.log('=== UPDATING AMOUNT COLLECTED ===');
      console.log('Application ID:', application.applicant_id);
      console.log('New Amount:', newAmount);
      console.log('Selected Month:', selectedMonth);

      // Convert YYYY-MM to EMI date format
      const emiDate = selectedMonth.match(/^\d{4}-\d{2}$/) 
        ? `${selectedMonth}-05` 
        : selectedMonth;

      const updateData = {
        application_id: application.applicant_id,
        demand_date: emiDate,
        amount_collected: newAmount,
        // Include other fields that might be needed
        team_lead: application.team_lead,
        rm_name: application.rm_name,
        repayment: application.repayment,
        emi_amount: application.emi_amount,
        last_month_bounce: application.last_month_bounce,
        lms_status: application.lms_status,
        collection_rm: application.collection_rm,
        updated_at: new Date().toISOString()
      };

      // Use upsert with the correct conflict resolution
      const { error } = await client
        .from('collection')
        .upsert(updateData, {
          onConflict: 'application_id,demand_date',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error updating amount collected:', error);
        throw error;
      }

      // Add audit log
      await addAuditLog(
        application.applicant_id,
        'Amount Collected',
        previousAmount?.toString() || '0',
        newAmount?.toString() || '0',
        emiDate
      );

      // Update local state
      const updatedApp = { ...application, amount_collected: newAmount };
      onUpdate(updatedApp);

      console.log('✅ Amount collected updated successfully');
    } catch (error) {
      console.error('Error in handleAmountCollectedChange:', error);
      throw error;
    }
  }, [application, user, addAuditLog, onUpdate, selectedMonth]);

  return {
    handleStatusChange,
    handlePtpDateChange,
    handleCallingStatusChange,
    handleAmountCollectedChange
  };
};
