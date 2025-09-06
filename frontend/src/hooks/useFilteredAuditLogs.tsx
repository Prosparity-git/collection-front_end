import { useMemo } from 'react';
import { AuditLog } from '@/hooks/useAuditLogs';

export const useFilteredAuditLogs = (auditLogs: AuditLog[]) => {
  return useMemo(() => {
    console.log('=== FILTERING AUDIT LOGS ===');
    console.log('Total audit logs received:', auditLogs.length);
    
    // Filter to include Status, PTP Date, Amount Collected, and Calling Status changes
    const statusRelatedLogs = auditLogs.filter(log => {
      const isStatusField = log.field === 'Status';
      const isPtpField = log.field === 'PTP Date';
      const isAmountCollected = log.field === 'Amount Collected';
      const isCallingStatus = log.field === 'Calling Status';
      
      console.log(`Log ${log.id}: field="${log.field}" -> include=${isStatusField || isPtpField || isAmountCollected || isCallingStatus}`);
      
      return isStatusField || isPtpField || isAmountCollected || isCallingStatus;
    });
    console.log('Filtered status-related logs:', statusRelatedLogs.length);
    console.log('Status-related logs:', statusRelatedLogs.map(log => ({ 
      id: log.id, 
      field: log.field, 
      previous: log.previous_value, 
      new: log.new_value,
      created_at: log.created_at
    })));
    
    return statusRelatedLogs;
  }, [auditLogs]);
};
