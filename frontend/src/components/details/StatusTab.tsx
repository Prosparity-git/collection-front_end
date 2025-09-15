import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Application } from "@/types/application";
import { AuditLog } from "@/hooks/useAuditLogs";
import { format } from "date-fns";
import { History, Clock, AlertCircle, Save } from "lucide-react";
import { useFilteredAuditLogs } from "@/hooks/useFilteredAuditLogs";
import { toast } from "sonner";
import LogDialog from "./LogDialog";
import { client } from "@/integrations/api/client";
import { useAuth } from "@/hooks/useAuth";
import { useFieldStatus } from "@/hooks/useFieldStatus";
import { monthToEmiDate } from '@/utils/dateUtils';
import { StatusManagementService } from '@/integrations/api/services/statusManagementService';

interface StatusTabProps {
  application: Application;
  auditLogs: AuditLog[];
  onStatusChange: (newStatus: string) => void;
  onPtpDateChange: (newDate: string) => void;
  addAuditLog: (appId: string, field: string, previousValue: string | null, newValue: string | null, demandDate: string) => Promise<void>;
  selectedMonth: string;
  refetchStatusCounts?: () => void;
  monthlyData?: any[]; // Add monthlyData to access month-specific status
}

// New demand status options (calling status)
const DEMAND_STATUS_OPTIONS = [
  { value: "1", label: "Deposited in Bank" },
  { value: "2", label: "Cash Collected" },
  { value: "3", label: "PTP Taken" },
  { value: "4", label: "No Response" }
];

// Reverse mapping for backend string values to frontend labels
const DEMAND_STATUS_BACKEND_MAPPING = {
  "deposited in bank": "Deposited in Bank",
  "cash collected": "Cash Collected", 
  "ptp taken": "PTP Taken",
  "no response": "No Response",
  "no_response": "No Response",
  "noresponse": "No Response",
  "deposited_in_bank": "Deposited in Bank",
  "cash_collected": "Cash Collected",
  "ptp_taken": "PTP Taken",
  "1": "Deposited in Bank",
  "2": "Cash Collected",
  "3": "PTP Taken", 
  "4": "No Response"
};

// New repayment status options (collection status)
const REPAYMENT_STATUS_OPTIONS = [
  { value: "1", label: "Future" },
  { value: "2", label: "Partially Paid" },
  // { value: "3", label: "Paid" },
  { value: "4", label: "Overdue" },
  { value: "5", label: "Foreclose" },
  { value: "6", label: "Paid (Pending Approval)" },
  // { value: "7", label: "Paid Rejected" }
];

const StatusTab = ({ application, auditLogs, onStatusChange, onPtpDateChange, addAuditLog, selectedMonth, refetchStatusCounts, monthlyData }: StatusTabProps) => {
  // Debug application data
  console.log('🔍 StatusTab: Application data received:', {
    applicant_id: application.applicant_id,
    demand_calling_status: application.demand_calling_status,
    status: application.status,
    ptp_date: application.ptp_date,
    amount_collected: application.amount_collected
  });
  
  const [ptpDate, setPtpDate] = useState('');
  const [showLogDialog, setShowLogDialog] = useState(false);
  const { user } = useAuth();
  const [amountCollected, setAmountCollected] = useState<string>(application.amount_collected?.toString() ?? '');
  const { fetchFieldStatus, updateFieldStatus } = useFieldStatus();
  const [currentStatus, setCurrentStatus] = useState<string>('Not Set');
  const [currentDemandStatus, setCurrentDemandStatus] = useState<string>('');
  
  // Form state for the 4 fields - keep these independent for user input
  // These fields start empty and are controlled by user input, NOT by API data
  // The current status display cards show the API values, but form fields are for new input
  const [formData, setFormData] = useState({
    demandStatus: '', // Start empty for user input
    repaymentStatus: '', // Start empty for user input
    ptpDate: '', // Start empty for user input
    amountCollected: '' // Start empty for user input
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if status is "Paid" to disable demand and repayment status fields
  const isStatusPaid = useMemo(() => {
    return currentStatus === '3' || currentStatus === 'Paid';
  }, [currentStatus]);

  // PTP date synchronization - improved to handle month-specific data
  useEffect(() => {
    console.log('📅 StatusTab: Synchronizing PTP date for month:', selectedMonth);
    console.log('Application PTP date:', application.ptp_date);
    console.log('Type of PTP date:', typeof application.ptp_date);
    
    // Don't automatically set the form field - keep it independent for user input
    // Only update the display state if needed
    
    if (application.ptp_date) {
      try {
        let inputValue = '';
        
        if (typeof application.ptp_date === 'string') {
          let parsedDate: Date;
          
          // Handle different date formats
          if (application.ptp_date.includes('T') || application.ptp_date.includes('Z')) {
            // ISO string format
            parsedDate = new Date(application.ptp_date);
          } else if (application.ptp_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // YYYY-MM-DD format
            parsedDate = new Date(application.ptp_date + 'T00:00:00.000Z');
          } else {
            // Try parsing as generic date
            parsedDate = new Date(application.ptp_date);
          }
          
          if (!isNaN(parsedDate.getTime())) {
            // Format for HTML date input (YYYY-MM-DD)
            inputValue = parsedDate.toISOString().split('T')[0];
            console.log('✅ Parsed date for input:', inputValue);
            // Don't set form data - keep form field independent
            // setFormData(prev => ({ ...prev, ptpDate: inputValue }));
          } else {
            console.warn('⚠️ Could not parse date:', application.ptp_date);
          }
        }
        
        // Don't update form data - keep form field independent for user input
        // setFormData(prev => ({ ...prev, ptpDate: inputValue }));
      } catch (error) {
        console.error('❌ Error parsing PTP date:', error);
      }
    } else {
      // Don't update form data - keep form field independent for user input
      // setFormData(prev => ({ ...prev, ptpDate: '' }));
    }
  }, [application.ptp_date, selectedMonth]);

  // Mount effect to ensure proper synchronization of all form fields
  useEffect(() => {
    console.log('🚀 StatusTab: Component mounted, synchronizing form data with API:', {
      amount_collected: application.amount_collected,
      demand_calling_status: application.demand_calling_status,
      status: application.status,
      ptp_date: application.ptp_date
    });
    
    // Only set the display states, NOT the form input fields
    // Form fields should remain independent for user input
    // This ensures users can type new values without them being overridden
    
    // Synchronize demand calling status display
    if (application.demand_calling_status) {
      setCurrentDemandStatus(application.demand_calling_status);
    }
    
    // Synchronize status display
    if (application.status && application.status !== 'Unknown') {
      setCurrentStatus(application.status);
    }
    
  }, []); // Empty dependency array - only run on mount

  // Fetch current status on mount or when application changes
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        console.log('🔄 Fetching current status for application:', application.applicant_id);
        
        // Check if we have monthlyData with the correct status
        if (monthlyData && monthlyData.length > 0) {
          console.log('🔍 StatusTab: Available monthlyData:', monthlyData.map(item => ({
            demand_date: item.demand_date,
            demand_month: item.demand_month,
            demand_year: item.demand_year,
            lms_status: item.lms_status,
            id: item.id
          })));
          
          // Find the month data that matches the current selectedMonth
          const monthData = monthlyData.find(item => {
            // Try to match by demand_date first
            if (item.demand_date) {
              return item.demand_date === selectedMonth;
            }
            // Fallback to constructing month from demand_month and demand_year
            if (item.demand_month && item.demand_year) {
              const monthMap = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const monthName = monthMap[item.demand_month];
              const year = item.demand_year.toString().slice(-2);
              const constructedMonth = `${monthName}-${year}`;
              return constructedMonth === selectedMonth;
            }
            return false;
          });

          if (monthData) {
            console.log('✅ StatusTab: Found matching month data:', monthData);
            
            // Check if we have status from monthlyData
            if (monthData.lms_status) {
              console.log('✅ StatusTab: Found lms_status in monthlyData:', monthData.lms_status);
              setCurrentStatus(monthData.lms_status);
              return; // Use this status, don't override with field_status
            } else {
              console.log('⚠️ StatusTab: No lms_status found in monthlyData for month:', selectedMonth);
            }
          } else {
            console.log('⚠️ StatusTab: No month data found for selectedMonth:', selectedMonth);
          }
        } else {
          console.log('⚠️ StatusTab: No monthlyData available');
        }
        
        // Check if application has status from API response
        if (application.status && application.status !== 'Unknown') {
          console.log('✅ StatusTab: Using application status from API:', application.status);
          setCurrentStatus(application.status);
        }
        
        // Check if application has demand_calling_status from API response
        if (application.demand_calling_status) {
          console.log('✅ StatusTab: Using demand_calling_status from API:', application.demand_calling_status);
          setCurrentDemandStatus(application.demand_calling_status);
          
          // Don't update form data - keep form fields independent for user input
          // setFormData(prev => ({
          //   ...prev,
          //   demandStatus: application.demand_calling_status
          // }));
        }
        
        // Fallback to field_status only if monthlyData doesn't have the status
        const { data: statusRow, error: statusError } = await client
          .from('field_status')
          .select('status, calling_status')
          .eq('application_id', application.applicant_id)
          .order('created_at', { ascending: false })
          .maybeSingle();

        if (statusError) {
          console.error('❌ Error fetching status:', statusError);
          return;
        }

        const fetchedStatus = statusRow?.status || 'Not Set';
        const fetchedDemandStatus = statusRow?.calling_status || '';
        
        console.log('📋 Fetched status from field_status:', { status: fetchedStatus, demandStatus: fetchedDemandStatus });
        
        // Only set status if we don't have it from application data
        if (!application.status || application.status === 'Unknown') {
          setCurrentStatus(fetchedStatus);
        }
        
        // IMPORTANT: Only set demand status from database if we DON'T have it from API
        // This prevents overriding the correct API value with database values
        if (!application.demand_calling_status) {
          console.log('⚠️ No API demand_calling_status, using database fallback:', fetchedDemandStatus);
          setCurrentDemandStatus(fetchedDemandStatus);
          
          // Don't update form data - keep form fields independent for user input
          // setFormData(prev => ({
          //   ...prev,
          //   demandStatus: fetchedDemandStatus,
          //   repaymentStatus: fetchedStatus && fetchedStatus !== 'Not Set' ? fetchedStatus : ''
          // }));
        } else {
          console.log('✅ Keeping API demand_calling_status, not overriding with database value');
          // Don't update form data - keep form fields independent for user input
          // setFormData(prev => ({
          //   ...prev,
          //   repaymentStatus: fetchedStatus && fetchedStatus !== 'Not Set' ? fetchedStatus : ''
          // }));
        }
        
      } catch (error) {
        console.error('❌ Error fetching status:', error);
      }
    };

    fetchStatus();
  }, [application.applicant_id, selectedMonth, monthlyData]);

  // Initialize amount collected from application data with proper synchronization
  useEffect(() => {
    console.log('💰 StatusTab: Initializing amount collected from API:', {
      apiValue: application.amount_collected,
      type: typeof application.amount_collected,
      currentFormValue: formData.amountCollected
    });
    
    // Only set the display state, NOT the form input field
    // Form field should remain independent for user input
    // This ensures users can type new values without them being overridden by API data
    if (application.amount_collected !== undefined && application.amount_collected !== null) {
      const amountString = application.amount_collected.toString();
      if (amountString !== '0') {
        console.log('✅ StatusTab: Setting amount collected display from API:', amountString);
        setAmountCollected(amountString);
        // Don't update formData.amountCollected - keep it independent
      } else {
        console.log('⚠️ StatusTab: API amount is 0 or empty, setting display to empty');
        setAmountCollected('');
      }
    } else {
      console.log('⚠️ StatusTab: No amount collected in API, setting display to empty');
      setAmountCollected('');
    }
  }, [application.amount_collected, selectedMonth]);
  
  // Debug application data changes
  useEffect(() => {
    console.log('🔍 StatusTab: Application data changed:', {
      applicant_id: application.applicant_id,
      amount_collected: application.amount_collected,
      amount_collected_type: typeof application.amount_collected,
      demand_calling_status: application.demand_calling_status,
      status: application.status,
      ptp_date: application.ptp_date
    });
  }, [application]);

  // Debug amount collected changes
  useEffect(() => {
    console.log('💰 StatusTab: Amount collected debug:', {
      apiValue: application.amount_collected,
      apiValueType: typeof application.amount_collected,
      formValue: formData.amountCollected,
      formValueType: typeof formData.amountCollected,
      stateValue: amountCollected,
      stateValueType: typeof amountCollected
    });
  }, [application.amount_collected, formData.amountCollected, amountCollected]);

  // Debug currentDemandStatus changes
  useEffect(() => {
    console.log('🔍 currentDemandStatus changed:', currentDemandStatus);
    console.log('🔍 Application demand_calling_status:', application.demand_calling_status);
    console.log('🔍 Form data demandStatus:', formData.demandStatus);
    console.log('🔍 Available mapping keys:', Object.keys(DEMAND_STATUS_BACKEND_MAPPING));
    if (currentDemandStatus) {
      console.log('🔍 Mapping result:', DEMAND_STATUS_BACKEND_MAPPING[currentDemandStatus.toLowerCase()]);
    }
  }, [currentDemandStatus, application.demand_calling_status, formData.demandStatus]);
  
  // Debug selected month changes
  useEffect(() => {
    console.log('🔍 Selected month changed:', selectedMonth);
    console.log('🔍 Application demand_calling_status:', application.demand_calling_status);
    console.log('🔍 Current demand status state:', currentDemandStatus);
  }, [selectedMonth, application.demand_calling_status, currentDemandStatus]);
  
  // Initialize demand status from application data
  useEffect(() => {
    if (application.demand_calling_status && !currentDemandStatus) {
      console.log('🔍 Initializing demand status from application data:', application.demand_calling_status);
      setCurrentDemandStatus(application.demand_calling_status);
      // Don't update form data - keep form fields independent
      // setFormData(prev => ({ ...prev, demandStatus: application.demand_calling_status }));
    }
  }, [application.demand_calling_status, currentDemandStatus]);
  
  // Synchronize form data with application data changes
  useEffect(() => {
    if (application.demand_calling_status && application.demand_calling_status !== currentDemandStatus) {
      console.log('🔍 Synchronizing demand status from application data change:', application.demand_calling_status);
      setCurrentDemandStatus(application.demand_calling_status);
      // Don't update form data - keep form fields independent
      // setFormData(prev => ({ ...prev, demandStatus: application.demand_calling_status }));
    }
  }, [application.demand_calling_status]);
  
  // Direct synchronization of form data with API payload
  useEffect(() => {
    console.log('🔍 API demand_calling_status changed:', application.demand_calling_status);
    if (application.demand_calling_status) {
      // Don't update form data - keep form fields independent
      // setFormData(prev => ({ ...prev, demandStatus: application.demand_calling_status }));
      setCurrentDemandStatus(application.demand_calling_status);
    }
  }, [application.demand_calling_status]);
  
  // Use the hook directly without wrapping in useMemo
  const statusAndPtpLogs = useFilteredAuditLogs(auditLogs);

  // Handle form field changes (no auto-save)
  const handleFormFieldChange = (field: string, value: any) => {
    console.log(`🔄 Form field change: ${field} =`, value, 'Type:', typeof value);
    
    if (field === 'demandStatus') {
      console.log('🎯 Demand status change:', {
        oldValue: formData.demandStatus,
        newValue: value,
        oldType: typeof formData.demandStatus,
        newType: typeof value
      });
    }
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      console.log('📝 Updated form data:', newData);
      return newData;
    });
  };

  // Debug form data changes specifically
  useEffect(() => {
    console.log('📊 Form data changed:', {
      demandStatus: {
        value: formData.demandStatus,
        type: typeof formData.demandStatus,
        label: DEMAND_STATUS_OPTIONS.find(opt => opt.value === formData.demandStatus)?.label || 'Not found'
      },
      repaymentStatus: {
        value: formData.repaymentStatus,
        type: typeof formData.repaymentStatus,
        label: REPAYMENT_STATUS_OPTIONS.find(opt => opt.value === formData.repaymentStatus)?.label || 'Not found'
      },
      ptpDate: formData.ptpDate,
      amountCollected: formData.amountCollected
    });
  }, [formData.demandStatus, formData.repaymentStatus, formData.ptpDate, formData.amountCollected]);

  // Debug form data on every render
  useEffect(() => {
    console.log('🔍 Current form data:', formData);
    console.log('🔍 Current demand status state:', { 
      currentDemandStatus, 
      applicationDemandStatus: application.demand_calling_status,
      formDemandStatus: formData.demandStatus,
      formDemandStatusType: typeof formData.demandStatus
    });
    console.log('🔍 Current validation state:', {
      user: !!user,
      selectedMonth,
      applicantId: application?.applicant_id,
      hasFormData: !!(formData.demandStatus || 
                      formData.repaymentStatus || 
                      formData.ptpDate || 
                      (formData.amountCollected !== undefined && formData.amountCollected !== '' && formData.amountCollected !== '0'))
    });
  }, [formData, user, selectedMonth, application?.applicant_id, currentDemandStatus, application.demand_calling_status]);

  // Handle form submission using the new StatusManagementService
  const handleSubmit = async () => {
    console.log('🔍 Submit validation check:', {
      user: !!user,
      selectedMonth,
      applicantId: application?.applicant_id,
      formData,
      currentFormData: formData
    });

    // Check for missing basic information
    if (!user) {
      toast.error('User not authenticated. Please log in again.');
      return;
    }

    // Removed application ID validation as it's not required

    // Check if form has any data to submit
    const hasFormData = formData.demandStatus || 
                       formData.repaymentStatus || 
                       formData.ptpDate || 
                       (formData.amountCollected !== undefined && formData.amountCollected !== '' && formData.amountCollected !== '0');

    if (!hasFormData) {
      toast.error('Please fill in at least one field before submitting.');
      return;
    }

    // Prevent submission if status is "Paid" and user is trying to change any fields
    if (isStatusPaid && (formData.demandStatus || formData.repaymentStatus || formData.ptpDate || formData.amountCollected !== '')) {
      toast.error('Cannot change any fields when current status is "Paid". All fields are locked for paid applications.');
      return;
    }

    console.log('✅ All validation passed, proceeding with submission');

    setIsSubmitting(true);
    try {
      console.log('🚀 Submitting status update with form data:', formData);
      
      // Extract loan_id and payment_id (repayment_id) from application payload
      const loanId = application.loan_id?.toString() || application.applicant_id;
      const repaymentId = application.payment_id?.toString() || '';
      
      console.log('🔍 StatusTab: Using payment_id:', repaymentId, 'for month:', selectedMonth, 'application:', application.applicant_id);
      
      // Prepare the request payload according to the new API schema
      const statusUpdatePayload = {
        repayment_id: repaymentId,
        calling_type: 2, // 2 for demand calling
        demand_calling_status: formData.demandStatus ? parseInt(formData.demandStatus, 10) : undefined,
        repayment_status: formData.repaymentStatus ? parseInt(formData.repaymentStatus, 10) : undefined,
        ptp_date: formData.ptpDate || undefined,
        amount_collected: formData.amountCollected ? parseFloat(formData.amountCollected) : undefined,
        contact_calling_status: 0, // Default value as per API schema
        contact_type: 1 // Default value as per API schema
      };

      // Remove undefined values
      Object.keys(statusUpdatePayload).forEach(key => {
        if (statusUpdatePayload[key as keyof typeof statusUpdatePayload] === undefined) {
          delete statusUpdatePayload[key as keyof typeof statusUpdatePayload];
        }
      });

      console.log('📤 Submitting to StatusManagementService:', statusUpdatePayload);
      
      // Call the StatusManagementService with loan_id
      const result = await StatusManagementService.updateApplicationStatus(
        loanId,
        statusUpdatePayload
      );

      console.log('✅ Status update successful:', result);
      
      // Update local state
      if (formData.demandStatus) {
        setCurrentDemandStatus(formData.demandStatus);
      }
      if (formData.repaymentStatus) {
        setCurrentStatus(formData.repaymentStatus);
        onStatusChange(formData.repaymentStatus);
      }
      if (formData.ptpDate) {
        setPtpDate(formData.ptpDate);
        onPtpDateChange(formData.ptpDate);
      }
      if (formData.amountCollected !== undefined) {
        setAmountCollected(formData.amountCollected);
      }

      // Add audit logs for changed fields
      
      if (formData.demandStatus && formData.demandStatus !== currentDemandStatus) {
        const oldLabel = DEMAND_STATUS_BACKEND_MAPPING[currentDemandStatus?.toLowerCase()] || currentDemandStatus;
        const newLabel = DEMAND_STATUS_OPTIONS.find(opt => opt.value === formData.demandStatus)?.label || formData.demandStatus;
        
        await addAuditLog(
          application.applicant_id,
          'Demand Status',
          oldLabel,
          newLabel,
          '' // Empty string since month is now linked via repayment_id
        );
      }
      
      if (formData.repaymentStatus && formData.repaymentStatus !== currentStatus) {
        const oldLabel = REPAYMENT_STATUS_OPTIONS.find(opt => opt.value === currentStatus)?.label || currentStatus;
        const newLabel = REPAYMENT_STATUS_OPTIONS.find(opt => opt.value === formData.repaymentStatus)?.label || formData.repaymentStatus;
        
        await addAuditLog(
          application.applicant_id,
          'Repayment Status',
          oldLabel,
          newLabel,
          '' // Empty string since month is now linked via repayment_id
        );
      }
      
      if (formData.ptpDate && formData.ptpDate !== ptpDate) {
        await addAuditLog(
          application.applicant_id,
          'PTP Date',
          ptpDate || null,
          formData.ptpDate,
          '' // Empty string since month is now linked via repayment_id
        );
      }
      
      if (formData.amountCollected !== undefined && formData.amountCollected !== (application.amount_collected?.toString() || '0')) {
        await addAuditLog(
          application.applicant_id,
          'Amount Collected',
          application.amount_collected?.toString() || '0',
          formData.amountCollected.toString(),
          '' // Empty string since month is now linked via repayment_id
        );
      }

      // Refresh status counts if callback provided
      if (refetchStatusCounts) {
        refetchStatusCounts();
      }

      toast.success('Status updated successfully!');
      
    } catch (error) {
      console.error('❌ Failed to submit status update:', error);
      toast.error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Optimized date formatting function
  const formatDateTime = useMemo(() => {
    return (dateStr: string) => {
      try {
        const date = new Date(dateStr);
        return `${format(date, 'dd-MMM-yyyy')} at ${format(date, 'HH:mm')}`;
      } catch {
        return dateStr;
      }
    };
  }, []);

  // Show only recent 2 status/PTP changes and deduplicate
  const recentStatusAndPtpLogs = useMemo(() => {
    if (!Array.isArray(statusAndPtpLogs)) return [];
    
    // Deduplicate logs based on field + timestamp combination
    const seenLogs = new Set();
    const uniqueLogs = statusAndPtpLogs.filter(log => {
      const key = `${log.field}-${log.created_at}-${log.new_value}`;
      if (seenLogs.has(key)) {
        return false;
      }
      seenLogs.add(key);
      return true;
    });
    
    return uniqueLogs.slice(0, 2);
  }, [statusAndPtpLogs]);

  // Check if status is pending approval


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Status Management</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {isStatusPaid && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Status Locked</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                This application has a "Paid" status. All fields are locked and cannot be modified.
              </p>
            </div>
          )}
          <div className="space-y-4">
            {/* Demand Status dropdown */}
            <div>
              <Label htmlFor="demandStatus">Demand Status</Label>
              <Select 
                key={`demand-${formData.demandStatus}`} // Force re-render when value changes
                value={formData.demandStatus || ''} // Ensure value is never undefined
                onValueChange={(value) => handleFormFieldChange('demandStatus', value)}
                disabled={isStatusPaid}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select demand status..." />
                </SelectTrigger>
                <SelectContent>
                  {DEMAND_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isStatusPaid && (
                <div className="text-xs text-amber-600 mt-1">
                  Demand status cannot be changed when repayment status is "Paid"
                </div>
              )}
            </div>
            
            {/* Current Demand Status Display Card */}
            <div className="col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-600 mb-2 font-medium">Current Demand Status for {selectedMonth}</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Demand Status:</span>
                <Badge variant="outline" className="text-xs">
                  {(() => {
                    // Use the same pattern as repayment status - read from demand_calling_status field
                    const apiDemandStatus = application.demand_calling_status;
                    
                    if (!apiDemandStatus) {
                      return 'Not Set';
                    }
                    
                    // Map the backend values to frontend labels using the same pattern as repayment status
                    const statusMap: { [key: string]: string } = {
                      'no response': 'No Response',
                      'no_response': 'No Response',
                      'ptp taken': 'PTP Taken',
                      'ptp_taken': 'PTP Taken',
                      'deposited in bank': 'Deposited in Bank',
                      'deposited_in_bank': 'Deposited in Bank',
                      'cash collected': 'Cash Collected',
                      'cash_collected': 'Cash Collected'
                    };
                    
                    return statusMap[apiDemandStatus.toLowerCase()] || apiDemandStatus;
                  })()}
                </Badge>
              </div>
            </div>
            
            {/* Repayment Status dropdown */}
            <div>
              <Label htmlFor="status">Repayment Status</Label>
              <Select 
                key={`repayment-${formData.repaymentStatus}`} // Force re-render when value changes
                value={formData.repaymentStatus || ''} // Ensure value is never undefined
                onValueChange={(value) => handleFormFieldChange('repaymentStatus', value)}
                disabled={isStatusPaid}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select repayment status..." />
                </SelectTrigger>
                <SelectContent>
                  {REPAYMENT_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isStatusPaid && (
                <div className="text-xs text-amber-600 mt-1">
                  Repayment status cannot be changed when current status is "Paid"
                </div>
              )}
            </div>
            
            {/* Current Status Display Line */}
            <div className="col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-600 mb-2 font-medium">Current Repayment Status for {selectedMonth}</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Repayment Status:</span>
                <Badge variant="outline" className="text-xs">
                  {currentStatus ? 
                    REPAYMENT_STATUS_OPTIONS.find(opt => opt.value === currentStatus)?.label || currentStatus 
                    : 'Not Set'
                  }
                </Badge>
              </div>
            </div>
            
            {/* PTP DATE INPUT */}
            <div>
              <Label htmlFor="ptpDate">PTP Date</Label>
              <Input
                key={`ptp-${formData.ptpDate}`} // Force re-render when value changes
                id="ptpDate"
                type="date"
                value={formData.ptpDate || ''} // Ensure value is never undefined
                onChange={(e) => handleFormFieldChange('ptpDate', e.target.value)}
                className="mt-1"
                placeholder="Select PTP date"
                disabled={isStatusPaid}
              />
              {!application.ptp_date && !isStatusPaid && (
                <div className="text-xs text-gray-500">No PTP date set</div>
              )}
              {isStatusPaid && (
                <div className="text-xs text-amber-600 mt-1">
                  PTP date cannot be changed when current status is "Paid"
                </div>
              )}
            </div>

            {/* Current PTP Date Display Card */}
            <div className="col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-600 mb-2 font-medium">Current PTP Date for {selectedMonth}</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">PTP Date:</span>
                <Badge variant="outline" className="text-xs">
                  {application.ptp_date ? 
                    (() => {
                      try {
                        const date = new Date(application.ptp_date);
                        return format(date, 'dd-MMM-yyyy');
                      } catch {
                        return application.ptp_date;
                      }
                    })()
                    : 'Not Set'
                  }
                </Badge>
              </div>
            </div>

            {/* AMOUNT COLLECTED INPUT */}
            <div>
              <Label htmlFor="amount-collected">Amount Collected</Label>
              <Input
                id="amount-collected"
                type="text"
                value={formData.amountCollected || ''} // Ensure value is never undefined
                onChange={(e) => handleFormFieldChange('amountCollected', e.target.value)}
                placeholder="Enter amount collected"
                className="mt-1"
                disabled={isStatusPaid}
              />
              {isStatusPaid && (
                <div className="text-xs text-amber-600 mt-1">
                  Amount collected cannot be changed when current status is "Paid"
                </div>
              )}
            </div>

            {/* Current Amount Collected Display Card */}
            <div className="col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-600 mb-2 font-medium">Current Amount Collected for {selectedMonth}</div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Amount Collected:</span>
                <Badge variant="outline" className="text-xs">
                  {application.amount_collected ? 
                    `₹${application.amount_collected.toLocaleString('en-IN')}` 
                    : '₹0'
                  }
                </Badge>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isStatusPaid}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating Status...
                  </>
                ) : isStatusPaid ? (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    No Changes Allowed
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Submit Status Update
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Status & PTP Changes - Hidden as requested */}
      {/* <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent Changes
            </div>
            {Array.isArray(statusAndPtpLogs) && statusAndPtpLogs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogDialog(true)}
                className="text-xs h-7"
              >
                Log ({statusAndPtpLogs.length})
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {recentStatusAndPtpLogs.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-3">
              No status or PTP date changes recorded yet
            </div>
          ) : (
            <div className="space-y-2">
              {recentStatusAndPtpLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="flex-1">
                    <span className="font-medium text-blue-700">{log.field}</span>
                    <div className="text-xs text-gray-600">
                      <span className="text-red-600">{log.previous_value || 'Not Set'}</span>
                      {' → '}
                      <span className="text-green-600">{log.new_value || 'Cleared'}</span>
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
        logs={Array.isArray(statusAndPtpLogs) ? statusAndPtpLogs : []}
        title="Status & PTP Date History"
        type="audit"
      /> */}
    </div>
  );
};

export default StatusTab;
