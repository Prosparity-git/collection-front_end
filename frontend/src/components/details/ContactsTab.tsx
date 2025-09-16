
import { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Application } from "@/types/application";
import { CallingLog } from "@/hooks/useCallingLogs";
import { format } from "date-fns";
import { Activity, Users, RefreshCw } from "lucide-react";
import ContactCard from "./ContactCard";
import { useContactCallingStatus } from "@/hooks/useContactCallingStatus";
import { useApplicationContacts } from "@/hooks/useApplicationContacts";
import LogDialog from "./LogDialog";
import FiLocationDisplay from "./FiLocationDisplay";
import { toast } from "sonner";
import { testContactCallingPayload } from '@/integrations/api/services/statusManagementService';

interface ContactsTabProps {
  application: Application;
  callingLogs: CallingLog[];
  onCallingStatusChange: (contactType: string, newStatus: string, currentStatus?: string) => void;
  selectedMonth: string;
  onReloadApplication?: () => void; // Callback to reload application details
}

const ContactsTab = ({ application, callingLogs, onCallingStatusChange, selectedMonth, onReloadApplication }: ContactsTabProps) => {
  const [showLogDialog, setShowLogDialog] = useState(false);
  
  // Use loan_id if available, otherwise fallback to applicant_id
  const contactId = application.loan_id ? application.loan_id.toString() : application.applicant_id;
  
  const { contacts: apiContacts, loading: contactsLoading, error: contactsError, refreshContacts } = useApplicationContacts(contactId);
  const { updateContactStatus } = useContactCallingStatus();

  // Ref to track the last known good state for each month
  const lastKnownStateRef = useRef<Record<string, Record<string, string>>>({});

  // Local state for calling statuses that gets updated immediately
  const [localContactStatuses, setLocalContactStatuses] = useState<Record<string, string>>(() => {
    // Convert any string statuses to numeric values for consistency
    const convertStatusToNumeric = (status: any) => {
      if (!status) return '3';
      if (['1', '2', '3'].includes(status.toString())) return status.toString();
      
      const statusMap: Record<string, string> = {
        'answered': '1',
        'not answered': '2',
        'not called': '3'
      };
      return statusMap[status.toString().toLowerCase()] || '3';
    };
    
    if (application.calling_statuses) {
      return {
        applicant: convertStatusToNumeric(application.calling_statuses.applicant),
        co_applicant: convertStatusToNumeric(application.calling_statuses.co_applicant),
        guarantor: convertStatusToNumeric(application.calling_statuses.guarantor),
        reference: convertStatusToNumeric(application.calling_statuses.reference)
      };
    }
    
    return {
      applicant: '3',
      co_applicant: '3',
      guarantor: '3',
      reference: '3'
    };
  });

  // Update local statuses when application prop changes, but be more resilient to month changes
  useEffect(() => {
    if (application.calling_statuses) {
      // Create a month key for tracking state
      const monthKey = `${selectedMonth}-${application.payment_id}`;
      
      // Only update local statuses if we don't have any local changes or if the application data is more complete
      const hasLocalChanges = Object.values(localContactStatuses).some(status => 
        status !== '3' && status !== '1' && status !== '2'
      );
      
      const hasApplicationStatuses = Object.values(application.calling_statuses).some(status => 
        status && status !== '3'
      );
      
      // If we have local changes and the application doesn't have statuses for this month, preserve local state
      if (hasLocalChanges && !hasApplicationStatuses) {
        console.log('🔄 ContactsTab: Preserving local status changes during month change');
        return;
      }
      
      // If application has statuses, update local state and store in ref
      if (hasApplicationStatuses) {
        console.log('🔄 ContactsTab: Updating local statuses from application data:', application.calling_statuses);
        setLocalContactStatuses(application.calling_statuses);
        lastKnownStateRef.current[monthKey] = { ...application.calling_statuses };
      } else {
        // If no application statuses, try to restore from last known state for this month
        const lastKnownState = lastKnownStateRef.current[monthKey];
        if (lastKnownState && hasLocalChanges) {
          console.log('🔄 ContactsTab: Restoring last known state for month:', monthKey, lastKnownState);
          setLocalContactStatuses(lastKnownState);
        }
      }
    }
  }, [application.calling_statuses, localContactStatuses, selectedMonth, application.payment_id]);

  // Log the contact ID being used
  useEffect(() => {
    console.log('🔄 ContactsTab: Using contact ID:', contactId, 'for application:', application.applicant_id);
    console.log('🔄 ContactsTab: Application has loan_id:', application.loan_id);
    console.log('🔄 ContactsTab: Application calling statuses:', application.calling_statuses);
    console.log('🔄 ContactsTab: Local calling statuses:', localContactStatuses);
    console.log('🔄 ContactsTab: Selected month:', selectedMonth);
    console.log('🔄 ContactsTab: Application payment_id:', application.payment_id);
    
    // Test the payload structure
    testContactCallingPayload();
  }, [contactId, application.applicant_id, application.loan_id, application.calling_statuses, localContactStatuses, selectedMonth, application.payment_id]);

  // Use local calling statuses for the UI (removed unused variable)

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${format(date, 'dd-MMM-yy')} at ${format(date, 'HH:mm')}`;
    } catch {
      return dateStr;
    }
  };

  // Show only recent 2 calling logs
  const recentCallLogs = callingLogs.slice(0, 2);

  // Build contacts array from API data and calling statuses
  const buildContactsFromAPI = () => {
    if (!apiContacts) return [];

    const contacts = [
      {
        type: "applicant",
        displayType: "Applicant",
        name: apiContacts.applicant?.name || application.applicant_name,
        mobile: apiContacts.applicant?.phone || application.applicant_mobile,
        email: apiContacts.applicant?.email,
        callingStatus: localContactStatuses.applicant || '3',
        contactTypeId: 1 // 1 for Applicant
      },
      ...apiContacts.co_applicants?.map((coApp, index) => ({
        type: "co_applicant",
        displayType: `Co-Applicant ${apiContacts.co_applicants.length > 1 ? index + 1 : ""}`,
        name: coApp.name,
        mobile: coApp.phone,
        email: coApp.email,
        callingStatus: localContactStatuses.co_applicant || '3',
        contactTypeId: 2 // 2 for Co-Applicant
      })) || [],
      ...apiContacts.guarantors?.map((guarantor, index) => ({
        type: "guarantor",
        displayType: `Guarantor ${apiContacts.guarantors.length > 1 ? index + 1 : ""}`,
        name: guarantor.name,
        mobile: guarantor.phone,
        email: guarantor.email,
        callingStatus: localContactStatuses.guarantor || '3',
        contactTypeId: 3 // 3 for Guarantor
      })) || [],
      ...apiContacts.references?.map((reference, index) => ({
        type: "reference",
        displayType: `Reference ${apiContacts.references.length > 1 ? index + 1 : ""}`,
        name: reference.name,
        mobile: reference.phone,
        email: reference.email,
        callingStatus: localContactStatuses.reference || '3',
        contactTypeId: 4 // 4 for Reference
      })) || []
    ];

    return contacts;
  };

  // Fallback to application data if API contacts not available
  const buildContactsFromApplication = () => {
    return [
      {
        type: "applicant",
        displayType: "Applicant",
        name: application.applicant_name,
        mobile: application.applicant_mobile,
        email: undefined,
        callingStatus: localContactStatuses.applicant || '3',
        contactTypeId: 1 // 1 for Applicant
      },
      ...application.co_applicant_name ? [{
        type: "co_applicant",
        displayType: "Co-Applicant",
        name: application.co_applicant_name,
        mobile: application.co_applicant_mobile,
        email: undefined,
        callingStatus: localContactStatuses.co_applicant || '3',
        contactTypeId: 2 // 2 for Co-Applicant
      }] : [],
      ...application.guarantor_name ? [{
        type: "guarantor",
        displayType: "Guarantor",
        name: application.guarantor_name,
        mobile: application.guarantor_mobile,
        email: undefined,
        callingStatus: localContactStatuses.guarantor || '3',
        contactTypeId: 3 // 3 for Guarantor
      }] : [],
      ...application.reference_name ? [{
        type: "reference",
        displayType: "Reference",
        name: application.reference_name,
        mobile: application.reference_mobile,
        email: undefined,
        callingStatus: localContactStatuses.reference || '3',
        contactTypeId: 4 // 4 for Reference
      }] : []
    ];
  };

  // Use useMemo to rebuild contacts array when localContactStatuses changes
  const contacts = useMemo(() => {
    console.log('🔄 ContactsTab: Rebuilding contacts array with statuses:', localContactStatuses);
    const result = apiContacts ? buildContactsFromAPI() : buildContactsFromApplication();
    console.log('🔄 ContactsTab: Built contacts array:', result.map(c => ({ type: c.type, callingStatus: c.callingStatus })));
    console.log('🔄 ContactsTab: Contacts array dependencies changed - apiContacts:', !!apiContacts, 'localContactStatuses:', localContactStatuses, 'selectedMonth:', selectedMonth);
    return result;
  }, [apiContacts, localContactStatuses, application, selectedMonth]);

  const handleContactStatusChange = async (contactType: string, newStatus: string, currentStatus?: string) => {
    try {
      console.log('🔄 Updating contact status:', { contactType, from: currentStatus, to: newStatus, applicationId: application.applicant_id, loanId: application.loan_id, paymentId: application.payment_id, selectedMonth, repaymentId: application.payment_id?.toString() });
      
      // Use loan_id if available, otherwise fallback to applicant_id
      const contactId = application.loan_id ? application.loan_id.toString() : application.applicant_id;
      console.log('🔑 Using contact ID for API call:', contactId, '(loan_id available:', !!application.loan_id, ')');
      console.log('🔑 Using repayment ID for API call:', application.payment_id?.toString(), '(payment_id available:', !!application.payment_id, ')');
      
      // Find the contact to get the contact type ID
      const contact = contacts.find(c => c.type === contactType);
      if (!contact) {
        throw new Error(`Contact type ${contactType} not found`);
      }
      
      // Update the contact status using the hook with the contact type ID
      await updateContactStatus(contactId, contactType, newStatus, selectedMonth, application.payment_id?.toString());
      
          // Update local statuses with the new status (newStatus is already the display text)
      setLocalContactStatuses(prev => {
        const newStatuses = {
          ...prev,
          [contactType]: newStatus // Keep the numeric value as is for UI consistency
        };
        
        // Store the updated state in the ref for this month
        const monthKey = `${selectedMonth}-${application.payment_id}`;
        lastKnownStateRef.current[monthKey] = newStatuses;
        console.log('🔄 ContactsTab: Stored updated state in ref for month:', monthKey, newStatuses);
        console.log('🔄 ContactsTab: Updated status for', contactType, 'to:', newStatus);
        
        return newStatuses;
      });
      
      // Force a re-render by updating the application calling_statuses
      if (application.calling_statuses) {
        application.calling_statuses[contactType as keyof typeof application.calling_statuses] = newStatus;
      }
      
      // Force a re-render by triggering a state update
      setLocalContactStatuses(prev => ({ ...prev }));
      
      console.log('🔄 Updated local status for', contactType, 'to:', newStatus);

      // Call the parent handler for logging
      await onCallingStatusChange(contactType, newStatus, currentStatus);
      
      console.log('✅ Contact status updated successfully');
      
      // Reload application details to get the updated calling statuses
      if (onReloadApplication) {
        console.log('🔄 ContactsTab: Calling onReloadApplication callback...');
        onReloadApplication();
      } else {
        console.warn('⚠️ ContactsTab: onReloadApplication callback is not available');
      }
      
      // Show success message with the actual status that was set
      const statusDisplay = newStatus === '1' ? 'Answered' : 
                           newStatus === '2' ? 'Not Answered' : 
                           newStatus === '3' ? 'Not Called' : newStatus;
      
      console.log('🔄 ContactsTab: Success message - status:', newStatus, 'display:', statusDisplay);
      toast.success(`${contactType.replace('_', ' ')} status updated to "${statusDisplay}" successfully`);
      
    } catch (error) {
      console.error('❌ Failed to update contact status:', error);
      
      // Check if this is actually a success message disguised as an error
      const errorMessage = error.message || 'Unknown error';
      if (errorMessage.includes('Updated:') || errorMessage.includes('Calling records created:')) {
        // This is actually a success message from the backend
        console.log('🔄 Backend returned success message:', errorMessage);
        
        // Even if it's a "fake error", we should still update the local state
        setLocalContactStatuses(prev => {
          const newStatuses = {
            ...prev,
            [contactType]: newStatus // Keep the numeric value as is for UI consistency
          };
          
          // Store the updated state in the ref for this month
          const monthKey = `${selectedMonth}-${application.payment_id}`;
          lastKnownStateRef.current[monthKey] = newStatuses;
          console.log('🔄 ContactsTab: Stored updated state in ref for month (error case):', monthKey, newStatuses);
          
          return newStatuses;
        });
        
        // Force a re-render by updating the application calling_statuses
        if (application.calling_statuses) {
          application.calling_statuses[contactType as keyof typeof application.calling_statuses] = newStatus;
        }
        
        // Force a re-render by triggering a state update
        setLocalContactStatuses(prev => ({ ...prev }));
        
        // Reload application details to get the updated calling statuses
        if (onReloadApplication) {
          console.log('🔄 ContactsTab: Calling onReloadApplication callback (error case)...');
          onReloadApplication();
        } else {
          console.warn('⚠️ ContactsTab: onReloadApplication callback is not available (error case)');
        }
        
        toast.success(`${contactType.replace('_', ' ')} status updated successfully`);
      } else {
        // This is a real error
        toast.error(`Failed to update ${contactType.replace('_', ' ')} status: ${errorMessage}`);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Application Contacts</h3>
        </div>
        {/* Refresh button hidden as requested */}
        {/* <Button
          variant="outline"
          size="sm"
          onClick={refreshContacts}
          disabled={contactsLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${contactsLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button> */}
      </div>

      {/* Error state */}
      {contactsError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="text-sm text-red-600">
              <p className="font-medium">Error loading contacts:</p>
              <p>{contactsError}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshContacts}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {contactsLoading && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading contacts...
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Cards */}
      {!contactsLoading && !contactsError && (
        <div className="space-y-4">
          {contacts.map((contact, index) => (
            <ContactCard
              key={`${contact.type}-${contact.callingStatus}-${selectedMonth}`}
              title={contact.displayType}
              name={contact.name}
              mobile={contact.mobile}
              email={contact.email}
              currentStatus={contact.callingStatus}
              onStatusChange={(newStatus) => handleContactStatusChange(contact.type, newStatus, contact.callingStatus)}
              contactTypeId={contact.contactTypeId}
            />
          ))}
        </div>
      )}

      {/* FI Location Display */}
      <FiLocationDisplay fiLocation={application.fi_location} />

      {/* Recent Call Activity - Hidden as requested */}
      {/* <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Call Activity
            </div>
            {callingLogs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogDialog(true)}
                className="text-xs h-7"
              >
                Log ({callingLogs.length})
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recentCallLogs.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-3">
              No call activity recorded yet
            </div>
          ) : (
            <div className="space-y-2">
              {recentCallLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="flex-1">
                    <span className="font-medium text-blue-700 capitalize">
                      {log.contact_type.replace('_', ' ')}
                    </span>
                    <div className="text-xs text-gray-600">
                      <span className="text-red-600">{log.previous_status || 'not called'}</span>
                      {' → '}
                      <span className="text-green-600">{log.new_status}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    <div>{formatDateTime(log.created_at)}</div>
                    <div>by {log.user_name || 'Unknown'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card> */}

      {/* Log Dialog - Hidden as requested */}
      {/* <LogDialog
        open={showLogDialog}
        onClose={() => setShowLogDialog(false)}
        logs={callingLogs}
        title="Call Activity History"
        type="calling"
      /> */}
    </div>
  );
};

export default ContactsTab;
