
import { useState, useCallback } from 'react';
import { client } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';
import { monthToEmiDate } from '@/utils/dateUtils';
import { StatusManagementService } from '@/integrations/api/services/statusManagementService';

export interface ContactStatusData {
  applicant?: string;
  co_applicant?: string;
  guarantor?: string;
  reference?: string;
}

// Helper function to convert integer status to display text
const convertStatusToDisplay = (status: string | number): string => {
  const statusStr = status?.toString() || "3";
  
  // If it's already a display text, return as is
  if (["answered", "not answered", "not called"].includes(statusStr.toLowerCase())) {
    return statusStr;
  }
  
  // Convert integer ID to display text - but for UI consistency, return the numeric value
  const statusMap: Record<string, string> = {
    "1": "1", // Keep as "1" for UI consistency
    "2": "2", // Keep as "2" for UI consistency
    "3": "3"  // Keep as "3" for UI consistency
  };
  
  return statusMap[statusStr] || "3";
};

// Helper function to convert display text to integer ID
const convertDisplayToStatusId = (display: string): string => {
  const displayLower = display.toLowerCase();
  
  // If it's already an ID, return as is
  if (["1", "2", "3"].includes(display)) {
    return display;
  }
  
  // Convert display text to integer ID
  const displayMap: Record<string, string> = {
    "answered": "1",
    "not answered": "2",
    "not called": "3"
  };
  
  return displayMap[displayLower] || "3";
};

export const useContactCallingStatus = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const fetchContactStatus = useCallback(async (applicationId: string, selectedMonth?: string): Promise<ContactStatusData> => {
    if (!user || !applicationId) return {};
    
    setLoading(true);
    
    try {
      console.log('=== CONTACT STATUS FETCH ===');
      console.log('Application ID:', applicationId);
      console.log('Selected Month:', selectedMonth);

      let query = client
        .from('contact_calling_status')
        .select('contact_type, status, created_at')
        .eq('application_id', applicationId);

      // Add month filter if provided - filter by demand_date
      if (selectedMonth) {
        const emiDate = monthToEmiDate(selectedMonth);
        console.log('Filtering by demand_date:', emiDate);
        
        query = query.eq('demand_date', emiDate);
      }

      // Order by created_at to get latest status per contact type
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching contact status:', error);
        return {};
      }

      // Group by contact_type and get the latest status
      const statusData: ContactStatusData = {};
      
      if (data) {
        data.forEach(status => {
          const contactType = status.contact_type.toLowerCase() as keyof ContactStatusData;
          // Only set if we don't already have a status for this contact type (keeps latest due to ordering)
          if (!statusData[contactType]) {
            // Convert integer status to display text for the UI
            statusData[contactType] = convertStatusToDisplay(status.status);
          }
        });
      }

      console.log('✅ Contact status loaded:', statusData);
      return statusData;
    } catch (error) {
      console.error('Error in fetchContactStatus:', error);
      return {};
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateContactStatus = useCallback(async (
    applicationId: string, 
    contactType: string, 
    newStatus: string,
    selectedMonth?: string,
    repaymentId?: string
  ): Promise<void> => {
    if (!user) return;

    try {
      console.log('=== UPDATING CONTACT STATUS ===');
      console.log('Application ID:', applicationId);
      console.log('Contact Type:', contactType);
      console.log('New Status:', newStatus);
      console.log('Selected Month:', selectedMonth);
      console.log('Repayment ID:', repaymentId);

      // Convert YYYY-MM to EMI date format (5th of the month)
      const emiDate = selectedMonth ? monthToEmiDate(selectedMonth) : undefined;

      // Convert display text to integer ID for API call
      const statusId = convertDisplayToStatusId(newStatus);
      console.log('Converted status for API:', { display: newStatus, id: statusId });

      // Use StatusManagementService to update contact calling status
      const result = await StatusManagementService.updateContactCallingStatus(
        applicationId,
        contactType,
        statusId, // Pass the integer ID
        emiDate,
        repaymentId
      );

      console.log('📥 API Response Result:', result);

      if (result.success) {
        console.log('✅ Contact status updated successfully via API:', result);
      } else {
        console.error('❌ API returned success: false:', result);
        throw new Error(result.message || 'Failed to update contact status');
      }

    } catch (error) {
      console.error('Error in updateContactStatus:', error);
      throw error;
    }
  }, [user]);

  return {
    fetchContactStatus,
    updateContactStatus,
    loading
  };
};
