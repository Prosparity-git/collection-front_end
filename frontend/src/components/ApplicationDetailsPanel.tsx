import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Application } from "@/types/application";
import { useComments, Comment as CommentType } from "@/hooks/useComments";
import { useAuditLogs } from "@/hooks/useAuditLogs";
import { useCallingLogs } from "@/hooks/useCallingLogs";
// import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ApplicationHeader from "./details/ApplicationHeader";
import ContactsTab from "./details/ContactsTab";
import StatusTab from "./details/StatusTab";
import CommentsTab from "./details/CommentsTab";
import DetailsTab from "./details/DetailsTab";
import { useApplicationHandlers } from "./details/ApplicationHandlers";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRepaymentHistory } from "@/hooks/useRepaymentHistory";
import { useMonthlyApplicationData } from '@/hooks/useMonthlyApplicationData';
import MonthSelector from './details/MonthSelector';
import { formatEmiMonth } from "@/utils/formatters";
import { monthToEmiDate } from "@/utils/dateUtils";
import { getApplicationDetails, API_BASE_URL } from '@/integrations/api/client';
import { CommentsService, COMMENT_TYPES } from '@/integrations/api/services/commentsService';

interface ApplicationDetailsPanelProps {
  application: Application | null;
  onClose: () => void;
  onSave: (updatedApp: Application) => void;
  onDataChanged?: () => void;
  selectedEmiMonth?: string | null;
  refetchStatusCounts?: () => void;
}

const ApplicationDetailsPanel = ({ 
  application, 
  onClose, 
  onSave, 
  onDataChanged, 
  selectedEmiMonth,
  refetchStatusCounts
}: ApplicationDetailsPanelProps) => {
  const { user } = useAuth();
  const [currentApplication, setCurrentApplication] = useState<Application | null>(application);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [monthSpecificPtpDate, setMonthSpecificPtpDate] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('contacts');
  
  // Add tracking for user-initiated month changes
  const userSelectedMonthRef = useRef<boolean>(false);
  const isUpdatingStatusRef = useRef<boolean>(false);
  const initializedRef = useRef<boolean>(false);
  
  const { monthlyData, availableMonths, availableMonthsFormatted, loading: monthlyLoading, getApplicationForMonth, refetch: refetchMonthlyData } = useMonthlyApplicationData(currentApplication?.applicant_id);

  // Debug logging for monthly data
  useEffect(() => {
    console.log('ApplicationDetailsPanel: Monthly data state changed:', {
      hasMonthlyData: !!monthlyData,
      monthlyDataLength: monthlyData?.length || 0,
      monthlyLoading,
      currentPaymentId: currentApplication?.payment_id,
      selectedMonth
    });
    
    if (monthlyData && monthlyData.length > 0) {
      console.log('ApplicationDetailsPanel: Monthly data available:', monthlyData.map(m => ({
        id: m.id,
        demand_date: m.demand_date,
        demand_month: m.demand_month,
        demand_year: m.demand_year
      })));
    }
  }, [monthlyData, monthlyLoading, currentApplication?.payment_id, selectedMonth]);

  // Handle application changes
  useEffect(() => {
    console.log('ApplicationDetailsPanel: Application changed', {
      applicantId: application?.applicant_id,
      paymentId: application?.payment_id,
      emiMonth: application?.emi_month
    });
    setCurrentApplication(application);
    // Reset initialization flag when application changes
    initializedRef.current = false;
    userSelectedMonthRef.current = false;
    // Clear selectedMonth when application changes to force proper initialization
    setSelectedMonth('');
    
    // Log the expected behavior
    if (application?.payment_id) {
      console.log('ApplicationDetailsPanel: Expecting to initialize month for payment_id:', application.payment_id);
    }
  }, [application]);

  // Fetch full application details from API when application changes
  useEffect(() => {
    const fetchFullApplicationDetails = async () => {
      if (currentApplication?.applicant_id && currentApplication?.emi_month) {
        try {
          console.log('ApplicationDetailsPanel: Fetching full application details from API for:', currentApplication.applicant_id);
          const apiApplication = await getApplicationDetails(currentApplication.applicant_id, currentApplication.emi_month);
          
          if (apiApplication) {
            console.log('ApplicationDetailsPanel: Received API application data:', apiApplication);
            // Merge API data with current application data
            const enhancedApplication = {
              ...currentApplication,
              ...apiApplication,
              // Preserve any local-only fields
              field_status: currentApplication.field_status,
              applicant_calling_status: currentApplication.applicant_calling_status,
              co_applicant_calling_status: currentApplication.co_applicant_calling_status,
              guarantor_calling_status: currentApplication.guarantor_calling_status,
              reference_calling_status: currentApplication.reference_calling_status,
            };
            
            console.log('ApplicationDetailsPanel: Enhanced application with API data:', enhancedApplication);
            setCurrentApplication(enhancedApplication);
          }
        } catch (error) {
          console.error('ApplicationDetailsPanel: Failed to fetch full application details:', error);
          // Continue with local data if API fetch fails
        }
      }
    };

    fetchFullApplicationDetails();
  }, [currentApplication?.applicant_id, currentApplication?.emi_month]);
  
  const { repaymentHistory } = useRepaymentHistory(currentApplication?.applicant_id);
  
  // Initialize comments hook but only fetch when needed
  const { comments: oldComments, fetchComments, addComment, clearComments } = useComments(selectedMonth);
  
  // Function to fetch comments for a specific payment_id
  const fetchCommentsByPaymentId = useCallback(async (paymentId: number) => {
    if (!paymentId) return;
    
    try {
      console.log('🔍 Fetching comments for payment_id:', paymentId);
      const commentsResponse = await CommentsService.getCommentsByRepaymentAndType(
        paymentId.toString(),
        COMMENT_TYPES.APPLICATION_DETAILS,
        0, // skip
        100 // limit
      );
      
      if (commentsResponse.results && commentsResponse.results.length > 0) {
        console.log('✅ Found comments for payment_id:', paymentId, 'count:', commentsResponse.results.length);
        // Update the comments state directly
        setComments(commentsResponse.results.map(comment => ({
          ...comment,
          user_name: comment.user_name || `User ${comment.user_id}`, // Use actual username from backend
          content: comment.comment,
          application_id: currentApplication?.applicant_id || ''
        })));
      } else {
        console.log('ℹ️ No comments found for payment_id:', paymentId);
        setComments([]);
      }
    } catch (error) {
      console.error('❌ Error fetching comments by payment_id:', error);
      setComments([]);
    }
  }, [currentApplication?.applicant_id]);
  
  // State for comments fetched by payment_id
  const [comments, setComments] = useState<CommentType[]>([]);
  
  const { auditLogs, addAuditLog, refetch: refetchAuditLogs } = useAuditLogs(currentApplication?.applicant_id, selectedMonth);
  const { callingLogs, addCallingLog, refetch: refetchCallingLogs } = useCallingLogs(currentApplication?.applicant_id, selectedMonth);

  // Fetch month-specific PTP date (DISABLED)
  useEffect(() => {
    setMonthSpecificPtpDate(null); // Feature disabled until real API is available
  }, [currentApplication?.applicant_id, selectedMonth]);

  // Clear comments when application changes
  useEffect(() => {
    console.log('ApplicationDetailsPanel: Clearing comments for application', currentApplication?.applicant_id);
    clearComments();
    setComments([]); // Also clear our local comments state
  }, [currentApplication?.applicant_id, clearComments]);
  
  // Fetch comments when payment_id is available
  useEffect(() => {
    if (currentApplication?.payment_id) {
      console.log('🔍 ApplicationDetailsPanel: Fetching comments for payment_id:', currentApplication.payment_id);
      fetchCommentsByPaymentId(currentApplication.payment_id);
    }
  }, [currentApplication?.payment_id, fetchCommentsByPaymentId]);

  // Improved month initialization logic with user selection tracking
  useEffect(() => {
    console.log('ApplicationDetailsPanel: Month initialization check', {
      selectedEmiMonth,
      availableMonths,
      currentApplicationId: currentApplication?.applicant_id,
      selectedMonth,
      applicationEmiMonth: currentApplication?.emi_month,
      applicationDemandDate: currentApplication?.demand_date,
      applicationPaymentId: currentApplication?.payment_id,
      userSelectedMonth: userSelectedMonthRef.current,
      isUpdatingStatus: isUpdatingStatusRef.current,
      initialized: initializedRef.current,
      monthlyLoading,
      monthlyDataAvailable: !!monthlyData && monthlyData.length > 0
    });
    
    // Don't reinitialize if:
    // 1. Already initialized and user has made a selection OR already has a selected month
    // 2. Currently updating status (prevents interference)
    // 3. No available months or application
    // 4. User has explicitly selected a month (preserve their choice)
    if ((initializedRef.current && (userSelectedMonthRef.current || selectedMonth)) || 
        isUpdatingStatusRef.current || 
        !currentApplication?.applicant_id ||
        (userSelectedMonthRef.current && selectedMonth)) {
      return;
    }
    
    // Only initialize if we don't have a selected month yet
    if (!selectedMonth) {
      let initialMonth = '';
      
      // Priority 1: Use selectedEmiMonth from dashboard filters (user's current context) - this should match the dashboard
      if (selectedEmiMonth) {
        const matchingMonth = availableMonths.find(month => 
          formatEmiMonth(month) === selectedEmiMonth
        );
        
        if (matchingMonth) {
          initialMonth = matchingMonth;
          console.log('ApplicationDetailsPanel: ✅ Using selectedEmiMonth from dashboard:', selectedEmiMonth, '->', initialMonth);
        } else {
          console.log('ApplicationDetailsPanel: ⚠️ selectedEmiMonth', selectedEmiMonth, 'not available for this loan. Available months:', availableMonths.map(m => formatEmiMonth(m)));
        }
      }
      
      // Priority 2: Try to match the month associated with the application's payment_id (repayment_id)
      if (!initialMonth && currentApplication?.payment_id && monthlyData && monthlyData.length > 0) {
        console.log('ApplicationDetailsPanel: Checking payment_id match:', {
          paymentId: currentApplication.payment_id,
          monthlyDataCount: monthlyData.length,
          monthlyData: monthlyData.map(m => ({ id: m.id, demand_date: m.demand_date, demand_month: m.demand_month, demand_year: m.demand_year }))
        });
        
        // Find the payment detail that matches the current payment_id
        const matchingPayment = monthlyData.find(payment => 
          payment.id === currentApplication.payment_id
        );
        
        if (matchingPayment) {
          console.log('ApplicationDetailsPanel: Found matching payment in main logic:', matchingPayment);
          
          // Try to use demand_date first
          if (matchingPayment.demand_date) {
            initialMonth = matchingPayment.demand_date;
            console.log('ApplicationDetailsPanel: ✅ Found month for payment_id using demand_date:', currentApplication.payment_id, '->', initialMonth);
          } 
          // Fallback to constructing from demand_month and demand_year
          else if (matchingPayment.demand_month && matchingPayment.demand_year) {
            const monthMap = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthName = monthMap[matchingPayment.demand_month];
            const year = matchingPayment.demand_year.toString().slice(-2);
            initialMonth = `${monthName}-${year}`;
            console.log('ApplicationDetailsPanel: ✅ Found month for payment_id using demand_month/demand_year:', currentApplication.payment_id, '->', initialMonth);
          } else {
            console.log('ApplicationDetailsPanel: ❌ No month information available for payment_id:', currentApplication.payment_id);
          }
        } else {
          console.log('ApplicationDetailsPanel: ❌ No matching payment found for payment_id:', currentApplication.payment_id, 'in monthlyData');
        }
      } else {
        console.log('ApplicationDetailsPanel: ⚠️ Cannot check payment_id match:', {
          hasPaymentId: !!currentApplication?.payment_id,
          hasMonthlyData: !!monthlyData,
          monthlyDataLength: monthlyData?.length || 0
        });
      }
      
      // Priority 3: Try to match the application's current emi_month or demand_date if it exists in available months
      if (!initialMonth && (currentApplication?.emi_month || currentApplication?.demand_date)) {
        const applicationMonth = currentApplication?.emi_month || currentApplication?.demand_date;
        
        // First try exact match
        const exactMatch = availableMonths.find(month => 
          month === applicationMonth
        );
        
        if (exactMatch) {
          initialMonth = exactMatch;
          console.log('ApplicationDetailsPanel: Found exact match for application emi_month/demand_date', applicationMonth, '->', initialMonth);
        } else {
          // If exact match not found, try formatted match
          const applicationMonthFormatted = formatEmiMonth(applicationMonth);
          const formattedMatch = availableMonths.find(month => 
            formatEmiMonth(month) === applicationMonthFormatted
          );
          
          if (formattedMatch) {
            initialMonth = formattedMatch;
            console.log('ApplicationDetailsPanel: Found formatted match for application emi_month/demand_date', applicationMonthFormatted, '->', initialMonth);
          }
        }
      }
      
      // Priority 4: Fallback to most recent month for this specific loan
      if (!initialMonth && availableMonths.length > 0) {
        initialMonth = availableMonths[availableMonths.length - 1];
        console.log('ApplicationDetailsPanel: Using most recent month for this loan:', initialMonth);
      }
      
      // Priority 5: Emergency fallback - if still no month, try to get from filters service
      if (!initialMonth) {
        console.warn('ApplicationDetailsPanel: No month found through normal channels, trying emergency fallback');
        // This will be handled by the useMonthlyApplicationData hook
        return;
      }
      
      console.log('ApplicationDetailsPanel: Setting initial month to', initialMonth, 'based on selectedEmiMonth:', selectedEmiMonth, 'payment_id:', currentApplication?.payment_id, 'and application EMI month:', currentApplication?.emi_month);
      setSelectedMonth(initialMonth);
      initializedRef.current = true;
      // This is automatic initialization, not user-initiated
      userSelectedMonthRef.current = false;
    }
  }, [availableMonths, selectedMonth, currentApplication?.applicant_id, currentApplication?.demand_date, currentApplication?.payment_id, selectedEmiMonth, monthlyData, monthlyLoading]);

  // Additional effect to handle month initialization when monthlyData becomes available
  useEffect(() => {
    // If we have monthlyData but no selectedMonth, try to initialize
    if (monthlyData && monthlyData.length > 0 && !selectedMonth && currentApplication?.payment_id && !initializedRef.current) {
      console.log('ApplicationDetailsPanel: Monthly data became available, attempting to initialize month');
      console.log('ApplicationDetailsPanel: Monthly data structure:', monthlyData.map(m => ({
        id: m.id,
        demand_date: m.demand_date,
        demand_month: m.demand_month,
        demand_year: m.demand_year
      })));
      
      let monthToUse = '';
      
      // Priority 1: Use selectedEmiMonth from dashboard filters (user's current context) - this should match the dashboard
      if (selectedEmiMonth) {
        const matchingMonth = availableMonths.find(month => 
          formatEmiMonth(month) === selectedEmiMonth
        );
        
        if (matchingMonth) {
          monthToUse = matchingMonth;
          console.log('ApplicationDetailsPanel: ✅ Using selectedEmiMonth from dashboard:', selectedEmiMonth, '->', monthToUse);
        } else {
          console.log('ApplicationDetailsPanel: ⚠️ selectedEmiMonth', selectedEmiMonth, 'not available for this loan. Available months:', availableMonths.map(m => formatEmiMonth(m)));
        }
      }
      
      // Priority 2: Try to match the month associated with the application's payment_id (repayment_id)
      if (!monthToUse) {
        // Find the payment detail that matches the current payment_id
        const matchingPayment = monthlyData.find(payment => 
          payment.id === currentApplication.payment_id
        );
        
        if (matchingPayment) {
          console.log('ApplicationDetailsPanel: Found matching payment:', matchingPayment);
          
          // Try to use demand_date first
          if (matchingPayment.demand_date) {
            monthToUse = matchingPayment.demand_date;
            console.log('ApplicationDetailsPanel: Using demand_date:', monthToUse);
          } 
          // Fallback to constructing from demand_month and demand_year
          else if (matchingPayment.demand_month && matchingPayment.demand_year) {
            const monthMap = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthName = monthMap[matchingPayment.demand_month];
            const year = matchingPayment.demand_year.toString().slice(-2);
            monthToUse = `${monthName}-${year}`;
            console.log('ApplicationDetailsPanel: Constructed month from demand_month/demand_year:', monthToUse);
          }
        } else {
          console.log('ApplicationDetailsPanel: ❌ Still no matching payment found after data load for payment_id:', currentApplication.payment_id);
        }
      }
      
      if (monthToUse) {
        console.log('ApplicationDetailsPanel: ✅ Setting month to:', monthToUse, 'for payment_id:', currentApplication.payment_id);
        setSelectedMonth(monthToUse);
        initializedRef.current = true;
        userSelectedMonthRef.current = false;
      } else {
        console.log('ApplicationDetailsPanel: ❌ Could not determine month for payment_id:', currentApplication.payment_id);
      }
    }
  }, [monthlyData, selectedMonth, currentApplication?.payment_id, selectedEmiMonth, availableMonths]);

  // Emergency fallback: If we still don't have a month after initialization, set one
  useEffect(() => {
    if (!selectedMonth && availableMonths.length > 0 && !monthlyLoading) {
      console.log('ApplicationDetailsPanel: Emergency fallback - setting month to first available:', availableMonths[0]);
      setSelectedMonth(availableMonths[0]);
      initializedRef.current = true;
    }
  }, [selectedMonth, availableMonths, monthlyLoading]);

  // Handle user-initiated month changes
  const handleMonthChange = useCallback(async (newMonth: string, newApplication?: any) => {
    console.log('ApplicationDetailsPanel: Month changed to', newMonth);
    setSelectedMonth(newMonth);
    userSelectedMonthRef.current = true; // Mark as user-initiated
    
    // If we have new application data from the month dropdown, update the current application
    if (newApplication && newApplication.monthOption && newApplication.monthOption.repayment_id) {
      // Create a new application object with the updated payment_id and month-specific data
      const updatedApplication = {
        ...newApplication.application,
        payment_id: parseInt(newApplication.monthOption.repayment_id, 10),
        emi_month: newMonth,
        demand_date: newApplication.monthOption.demand_date
      };
      
      console.log('ApplicationDetailsPanel: ✅ Updated payment_id to', updatedApplication.payment_id, 'for month:', newMonth);
      
      // Update the current application state
      setCurrentApplication(updatedApplication);
      
      // Force a re-render of child components by updating the key
      setActiveTab(activeTab); // This will trigger a re-render
    } else {
      console.log('ApplicationDetailsPanel: ⚠️ No monthOption data found, using application as-is');
      if (newApplication && newApplication.application) {
        setCurrentApplication(newApplication.application);
      }
    }
    
    // Force a refresh of monthly data to ensure we have the latest data for the new month
    if (monthlyData && monthlyData.length > 0) {
      console.log('ApplicationDetailsPanel: 🔄 Refreshing monthly data for new month:', newMonth);
      // Force a refresh of the monthly data to ensure we have the latest data
      setTimeout(() => {
        refetchMonthlyData();
      }, 100);
    }
    
    // Fetch application data for the new month if we don't have it
    if (currentApplication?.applicant_id) {
      try {
        console.log('ApplicationDetailsPanel: 🔄 Fetching application data for new month:', newMonth);
        const apiApplication = await getApplicationDetails(currentApplication.applicant_id, newMonth);
        
        if (apiApplication) {
          console.log('ApplicationDetailsPanel: ✅ Received API application data for month:', newMonth, apiApplication);
          // Update the current application with the new month's data
          const enhancedApplication = {
            ...currentApplication,
            ...apiApplication,
            emi_month: newMonth,
            // Preserve any local-only fields
            field_status: currentApplication.field_status,
            applicant_calling_status: currentApplication.applicant_calling_status,
            co_applicant_calling_status: currentApplication.co_applicant_calling_status,
            guarantor_calling_status: currentApplication.guarantor_calling_status,
            reference_calling_status: currentApplication.reference_calling_status,
          };
          
          console.log('ApplicationDetailsPanel: ✅ Enhanced application with new month data:', enhancedApplication);
          setCurrentApplication(enhancedApplication);
        }
      } catch (error) {
        console.error('ApplicationDetailsPanel: ❌ Failed to fetch application data for month:', newMonth, error);
      }
    }
  }, [activeTab, monthlyData, refetchMonthlyData, currentApplication]);

  // Only fetch comments when the comments tab is active AND we have the required data
  const handleCommentsTabAccess = useCallback(async () => {
    if (currentApplication?.applicant_id && selectedMonth) {
      console.log('ApplicationDetailsPanel: Fetching comments for active tab', {
        applicationId: currentApplication.applicant_id,
        selectedMonth
      });
      try {
        await fetchComments(currentApplication.applicant_id);
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    }
  }, [currentApplication?.applicant_id, selectedMonth, fetchComments]);

  // Handle tab changes
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    if (value === 'comments') {
      handleCommentsTabAccess();
    }
  }, [handleCommentsTabAccess]);

  const monthlyCollectionData = selectedMonth ? getApplicationForMonth(selectedMonth) : null;

  
  const {
    handleStatusChange,
    handlePtpDateChange,
    handleCallingStatusChange
  } = useApplicationHandlers(currentApplication, user, addAuditLog, addCallingLog, (updatedApp) => {
    setCurrentApplication(updatedApp);
    onSave(updatedApp);
    onDataChanged?.();
  }, selectedMonth);

  // Enhanced status change handler with update tracking
  const handleStatusChangeWithTracking = useCallback(async (newStatus: string) => {
    isUpdatingStatusRef.current = true;
    try {
      await handleStatusChange(newStatus);
    } finally {
      // Reset the flag after a delay to allow for real-time updates to settle
      setTimeout(() => {
        isUpdatingStatusRef.current = false;
      }, 1000);
    }
  }, [handleStatusChange]);

  // Enhanced PTP date change handler with update tracking
  const handlePtpDateChangeWithTracking = useCallback(async (newDate: string) => {
    isUpdatingStatusRef.current = true;
    // Mark that user has selected a month to prevent reinitialization
    userSelectedMonthRef.current = true;
    try {
      await handlePtpDateChange(newDate);
    } finally {
      // Reset the flag after a delay to allow for real-time updates to settle
      setTimeout(() => {
        isUpdatingStatusRef.current = false;
      }, 1000);
    }
  }, [handlePtpDateChange]);

  const displayApplication = (() => {
    if (!currentApplication) return null;
    if (monthlyCollectionData) {
      return {
        ...currentApplication,
        team_lead: monthlyCollectionData.team_lead || currentApplication.team_lead,
        rm_name: monthlyCollectionData.rm_name || currentApplication.rm_name,
        repayment: monthlyCollectionData.repayment || currentApplication.repayment,
        emi_amount: monthlyCollectionData.emi_amount || currentApplication.emi_amount,
        last_month_bounce: monthlyCollectionData.last_month_bounce || currentApplication.last_month_bounce,
        lms_status: monthlyCollectionData.lms_status || currentApplication.lms_status,
        collection_rm: monthlyCollectionData.collection_rm || currentApplication.collection_rm,
        demand_date: monthlyCollectionData.demand_date || currentApplication.demand_date,
        amount_collected: monthlyCollectionData.amount_collected || currentApplication.amount_collected,
        ptp_date: monthSpecificPtpDate || currentApplication.ptp_date,
        vehicle_status: currentApplication.vehicle_status,
      };
    }
    return {
      ...currentApplication,
      ptp_date: monthSpecificPtpDate || currentApplication.ptp_date,
      vehicle_status: currentApplication.vehicle_status,
    };
  })();

  if (!currentApplication) return null;

  const handleAddComment = async (content: string, paymentId?: number) => {
    if (!user?.id) {
      toast.error('You must be logged in to add comments');
      return;
    }
    
    if (currentApplication?.applicant_id) {
      try {
        console.log('🔍 handleAddComment called with:', { content, paymentId, currentApplicationPaymentId: currentApplication.payment_id, userId: user.id });
        
        if (paymentId) {
          // Direct approach: use the payment_id from the application row API
          const commentData = {
            repayment_id: paymentId.toString(),
            comment: content.trim(),
            user_id: user.id, // Use current user's ID from auth context
            comment_type: COMMENT_TYPES.APPLICATION_DETAILS
          };
          
          console.log('🚀 Creating comment with payment_id directly:', commentData);
          await CommentsService.createComment(commentData);
          
          // Refresh comments after adding
          await fetchCommentsByPaymentId(paymentId);
        } else {
          // Fallback to old logic
          await addComment(
            currentApplication.applicant_id, 
            content, 
            selectedMonth,
            currentApplication.loan_id, // Pass loan_id
            selectedMonth // Pass emi_month (selectedMonth format: "Aug-25")
          );
        }
        toast.success('Comment added');
        // Force refresh comments after adding (already done above for paymentId case)
        if (!paymentId) {
          await fetchComments(currentApplication.applicant_id);
        }
        await onDataChanged?.();
      } catch (error) {
        console.error('Error adding comment:', error);
        toast.error('Failed to add comment');
      }
    }
  };

  // Disable handleVehicleStatusChange
  const handleVehicleStatusChange = async (newStatus: string) => {
    toast.error('Vehicle status update not available in this mode.');
  };

  // Function to reload application details after contact calling status updates
  const reloadApplicationDetails = useCallback(async () => {
    if (currentApplication?.applicant_id && selectedMonth) {
      try {
        console.log('🔄 ApplicationDetailsPanel: Reloading application details after contact status update...');
        console.log('🔄 ApplicationDetailsPanel: Calling getApplicationDetails with:', {
          applicantId: currentApplication.applicant_id,
          selectedMonth: selectedMonth
        });
        
        // Add a small delay to ensure the backend transaction is committed
        console.log('🔄 ApplicationDetailsPanel: Waiting 500ms for backend transaction to commit...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Use full application reload to get all updated calling statuses
        const apiApplication = await getApplicationDetails(currentApplication.applicant_id, selectedMonth);
        
        if (apiApplication) {
          console.log('🔄 ApplicationDetailsPanel: Received updated API application data:', apiApplication);
          console.log('🔄 ApplicationDetailsPanel: Current calling statuses:', {
            applicant: currentApplication.applicant_calling_status,
            co_applicant: currentApplication.co_applicant_calling_status,
            guarantor: currentApplication.guarantor_calling_status,
            reference: currentApplication.reference_calling_status
          });
          console.log('🔄 ApplicationDetailsPanel: API calling statuses:', {
            applicant: apiApplication.applicant_calling_status,
            co_applicant: apiApplication.co_applicant_calling_status,
            guarantor: apiApplication.guarantor_calling_status,
            reference: apiApplication.reference_calling_status
          });
          
          // Merge API data with current application data, preserving local state
          const enhancedApplication = {
            ...currentApplication,
            ...apiApplication,
            // Preserve any local-only fields
            field_status: currentApplication.field_status,
            // Update calling statuses from API
            applicant_calling_status: apiApplication.applicant_calling_status || currentApplication.applicant_calling_status,
            co_applicant_calling_status: apiApplication.co_applicant_calling_status || currentApplication.co_applicant_calling_status,
            guarantor_calling_status: apiApplication.guarantor_calling_status || currentApplication.guarantor_calling_status,
            reference_calling_status: apiApplication.reference_calling_status || currentApplication.reference_calling_status,
          };
          
          console.log('🔄 ApplicationDetailsPanel: Enhanced application with updated API data:', enhancedApplication);
          console.log('🔄 ApplicationDetailsPanel: Final calling statuses after merge:', {
            applicant: enhancedApplication.applicant_calling_status,
            co_applicant: enhancedApplication.co_applicant_calling_status,
            guarantor: enhancedApplication.guarantor_calling_status,
            reference: enhancedApplication.reference_calling_status
          });
          
          setCurrentApplication(enhancedApplication);
          
          // Notify parent component of data change
          onDataChanged?.();
          
          console.log('✅ Application details reloaded successfully');
        }
      } catch (error) {
        console.error('❌ ApplicationDetailsPanel: Failed to reload application details:', error);
        // Continue with local data if API fetch fails
      }
    } else {
      console.warn('⚠️ ApplicationDetailsPanel: Cannot reload application details - missing applicant_id or selectedMonth');
    }
  }, [currentApplication?.applicant_id, selectedMonth, onDataChanged]);

  return (
    <div className="application-details-panel bg-white flex flex-col">
      <div className="flex-shrink-0 p-4 sm:p-6 border-b bg-white">
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <h2 className="text-lg sm:text-xl font-semibold">Application Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-100 rounded-full h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ApplicationHeader application={displayApplication} />
      </div>

      <MonthSelector
        availableMonths={availableMonths}
        availableMonthsFormatted={availableMonthsFormatted}
        selectedMonth={selectedMonth}
        onMonthChange={handleMonthChange}
        loading={monthlyLoading}
        loanId={currentApplication?.loan_id}
        currentApplicationPaymentId={currentApplication?.payment_id}
      />

      <div className="flex-1 flex-col-min-h-0">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
          <div className="flex-shrink-0 pt-3 sm:pt-4 border-b">
            <TabsList className="grid w-full grid-cols-4 text-xs sm:text-sm h-auto">
              <TabsTrigger value="contacts" className="py-2">Contacts</TabsTrigger>
              <TabsTrigger value="status" className="py-2">Status</TabsTrigger>
              <TabsTrigger value="comments" className="py-2">Comments</TabsTrigger>
              <TabsTrigger value="details" className="py-2">Details</TabsTrigger>
            </TabsList>
          </div>
          
          <div className="application-details-content flex-1 overflow-y-auto p-4 sm:p-4">
            <TabsContent value="contacts" className="m-0">
              <ContactsTab 
                key={`contacts-${currentApplication?.payment_id}-${selectedMonth}`}
                application={currentApplication}
                callingLogs={callingLogs}
                onCallingStatusChange={handleCallingStatusChange}
                selectedMonth={selectedMonth}
                onReloadApplication={reloadApplicationDetails}
              />
            </TabsContent>
            <TabsContent value="status" className="m-0">
              <StatusTab 
                key={`status-${currentApplication?.payment_id}-${selectedMonth}`}
                application={currentApplication}
                auditLogs={auditLogs}
                onStatusChange={() => {}}
                onPtpDateChange={handlePtpDateChangeWithTracking}
                addAuditLog={addAuditLog}
                selectedMonth={selectedMonth}
                refetchStatusCounts={refetchStatusCounts}
                monthlyData={monthlyData}
              />
            </TabsContent>
            <TabsContent value="comments" className="m-0">
              <CommentsTab 
                comments={comments}
                onAddComment={handleAddComment}
                paymentId={currentApplication.payment_id}
              />
            </TabsContent>
            <TabsContent value="details" className="m-0">
              <DetailsTab 
                key={`details-${currentApplication?.payment_id}-${selectedMonth}`}
                application={currentApplication}
                repaymentHistory={repaymentHistory}
                auditLogs={auditLogs}
                onVehicleStatusChange={handleVehicleStatusChange}
                monthlyData={monthlyData}
                selectedMonth={selectedMonth}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default ApplicationDetailsPanel;

