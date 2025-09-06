import { useMemo, useState, useEffect } from "react";
import { Application, RepaymentHistory, AuditLog } from "@/types/application";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VEHICLE_STATUS_OPTIONS } from "@/constants/options";
import { format } from "date-fns";
import { History } from "lucide-react";
import { Button } from "../ui/button";
import LogDialog from "./LogDialog";
import { formatEmiMonth } from "@/utils/formatters";

const getVehicleStatusColor = (status: string | undefined) => {
    return VEHICLE_STATUS_OPTIONS.find(o => o.value === status)?.color || "bg-gray-400 text-white";
};

const DetailItem = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <div>
        <p className="text-xs font-medium text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-800 break-words">{value || 'N/A'}</p>
    </div>
);



const DetailsTab = ({
  application,
  repaymentHistory,
  auditLogs,
  onVehicleStatusChange,
  monthlyData,
  selectedMonth, // Add selectedMonth prop
}: {
  application: Application | null;
  repaymentHistory: RepaymentHistory[];
  auditLogs: AuditLog[];
  onVehicleStatusChange: (newStatus: string) => void;
  monthlyData?: any[];
  selectedMonth?: string; // Add selectedMonth to props
}) => {
  const [showLogDialog, setShowLogDialog] = useState(false);

  // Debug props received
  console.log('🔍 DetailsTab: Component rendered with props:', {
    selectedMonth,
    hasMonthlyData: !!monthlyData,
    monthlyDataLength: monthlyData?.length || 0,
    applicationId: application?.applicant_id,
    paymentId: application?.payment_id,
    timestamp: new Date().toISOString()
  });

  if (!application) {
    return <div>Loading...</div>;
  }

  // Get month-specific data for the selected month
  const monthSpecificData = useMemo(() => {
    console.log('🔍 DetailsTab: Calculating month-specific data for month:', selectedMonth);
    console.log('🔍 DetailsTab: Available monthlyData:', monthlyData);
    
    if (!selectedMonth || !monthlyData || monthlyData.length === 0) {
      console.log('🔍 DetailsTab: No monthlyData or selectedMonth, returning null');
      return null;
    }
    
    // Find the month data that matches the selected month
    const monthData = monthlyData.find(item => {
      console.log('🔍 DetailsTab: Checking item:', item);
      
      // Try to match by demand_date first
      if (item.demand_date) {
        const matches = item.demand_date === selectedMonth;
        console.log('🔍 DetailsTab: Checking demand_date:', item.demand_date, 'against selectedMonth:', selectedMonth, 'matches:', matches);
        return matches;
      }
      // Fallback to constructing month from demand_month and demand_year
      if (item.demand_month && item.demand_year) {
        const monthMap = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = monthMap[item.demand_month];
        const year = item.demand_year.toString().slice(-2);
        const constructedMonth = `${monthName}-${year}`;
        const matches = constructedMonth === selectedMonth;
        console.log('🔍 DetailsTab: Checking constructed month:', constructedMonth, 'against selectedMonth:', selectedMonth, 'matches:', matches);
        return matches;
      }
      return false;
    });
    
    console.log('🔍 DetailsTab: Found month data:', monthData);
    return monthData;
  }, [selectedMonth, monthlyData]);

  // Debug effect to track month changes and data updates
  useEffect(() => {
    console.log('🔍 DetailsTab: Data updated:', {
      selectedMonth,
      hasMonthlyData: !!monthlyData,
      monthlyDataLength: monthlyData?.length || 0,
      hasMonthSpecificData: !!monthSpecificData,
      applicationData: {
        emi_amount: application.emi_amount,
        lms_status: application.lms_status,
        field_status: application.field_status,
        ptp_date: application.ptp_date,
        amount_collected: application.amount_collected,
        demand_num: application.demand_num
      }
    });
  }, [selectedMonth, monthlyData, monthSpecificData, application]);

  // Helper function to get month-specific value or fallback to application value
  const getMonthSpecificValue = (field: string, fallbackValue?: any) => {
    if (monthSpecificData && monthSpecificData[field] !== undefined && monthSpecificData[field] !== null) {
      console.log(`🔍 DetailsTab: Using month-specific ${field}:`, monthSpecificData[field]);
      return monthSpecificData[field];
    }
    console.log(`🔍 DetailsTab: Using fallback ${field}:`, fallbackValue);
    return fallbackValue;
  };

  // Helper function to get month-specific status
  const getMonthSpecificStatus = () => {
    if (monthSpecificData) {
      // Priority: repayment_status > lms_status > field_status
      return monthSpecificData.repayment_status?.repayment_status || 
             monthSpecificData.lms_status || 
             monthSpecificData.field_status ||
             application.lms_status || 
             application.field_status;
    }
    return application.lms_status || application.field_status;
  };

  // Helper function to get the best available value for a field
  const getBestValue = (field: string, monthSpecificField?: string) => {
    // First try to get from month-specific data
    if (monthSpecificData && monthSpecificData[field] !== undefined && monthSpecificData[field] !== null) {
      return monthSpecificData[field];
    }
    
    // Then try to get from month-specific field (e.g., demand_amount for emi_amount)
    if (monthSpecificField && monthSpecificData && monthSpecificData[monthSpecificField] !== undefined && monthSpecificData[monthSpecificField] !== null) {
      return monthSpecificData[monthSpecificField];
    }
    
    // Finally fallback to application data
    return application[field as keyof Application];
  };

  const vehicleStatusLogs = useMemo(() => {
    if (!auditLogs) return [];
    return auditLogs
      .filter(log => log.field === 'Vehicle Status')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [auditLogs]);

  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${format(date, 'dd-MMM-yy')} at ${format(date, 'HH:mm')}`;
    } catch {
      return dateStr;
    }
  };

  const repaymentHistoryString = repaymentHistory
    .sort((a, b) => a.repayment_number - b.repayment_number)
    .map(h => h.delay_in_days)
    .join(' | ');

  const monthlyProgression = monthlyData
    ?.filter(item => item.demand_date) // Only include items with valid demand_date
    .sort((a, b) => {
      // Handle cases where demand_date might be undefined
      const dateA = a.demand_date || '';
      const dateB = b.demand_date || '';
      return dateA.localeCompare(dateB);
    })
    .map(item => {
      const amount = item.demand_amount || 0;
      const status = item.repayment_status?.repayment_status || 'Unknown';
      const monthDisplay = item.demand_date ? formatEmiMonth(item.demand_date) : 'Unknown Month';
      const amountDisplay = amount ? parseFloat(amount.toString()).toLocaleString() : '0';
      return `${monthDisplay}: ₹${amountDisplay} (${status})`;
    })
    .join(' → ');



  return (
    <div className="space-y-4">
      {/* Basic Application Information */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Application Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
            <DetailItem label="Application ID" value={application.applicant_id} />
            <DetailItem label="Applicant Name" value={application.applicant_name} />
            <DetailItem label="EMI Month" value={selectedMonth || application.emi_month} />
            <DetailItem label="Current Status" value={getMonthSpecificStatus()} />
          </div>
        </CardContent>
      </Card>

      {/* Loan & Repayment Details */}
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Loan & Repayment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
            <DetailItem label="Loan Amount" value={application.loan_amount ? `₹${application.loan_amount.toLocaleString()}`: 'N/A'} />
            <DetailItem label="Disbursement Date" value={application.disbursement_date} />
            <DetailItem label="EMI Amount" value={getBestValue('emi_amount', 'demand_amount') ? `₹${parseFloat(getBestValue('emi_amount', 'demand_amount').toString()).toLocaleString()}` : 'N/A'} />
            <DetailItem label="Repayment Number" value={getBestValue('demand_num') || 'N/A'} />
            <DetailItem label="House Ownership" value={application.house_ownership} />
            <DetailItem label="Payment Mode" value={application.payment_mode} />
            <div className="col-span-2 md:grid-cols-3">
                <DetailItem label="Repayment History (Delay in Days)" value={repaymentHistoryString || "No history"} />
            </div>
            {monthlyData && monthlyData.length > 1 && (
              <div className="col-span-2 md:col-span-3">
                <DetailItem label="Monthly Progression (EMI & Status)" value={monthlyProgression || "No progression data"} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assignment & Status */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment & Status</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
                <DetailItem label="RM Name" value={application.rm_name} />
                <DetailItem label="Team Lead" value={application.team_lead} />
                <DetailItem label="Branch" value={application.branch_name} />
                <DetailItem label="Dealer" value={application.dealer_name} />
                <DetailItem label="Lender" value={application.lender_name} />
            </div>
        </CardContent>
      </Card>

      {/* PTP & Payment Information */}
      <Card>
        <CardHeader>
          <CardTitle>PTP & Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
            <DetailItem label="PTP Date" value={getBestValue('ptp_date')} />
            <DetailItem label="Amount Collected" value={getBestValue('amount_collected') ? `₹${parseFloat(getBestValue('amount_collected').toString()).toLocaleString()}` : 'N/A'} />
            <DetailItem label="Payment Mode" value={getBestValue('payment_mode', 'mode')} />
          </div>
        </CardContent>
      </Card>



      {/* Comments */}
      {(application.recent_comments && application.recent_comments.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {application.recent_comments.map((comment, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-800">{comment.content}</p>
                  <p className="text-xs text-gray-500 mt-1">by {comment.user_name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Vehicle Status - Hidden as requested */}
      {/* <Card>
        <CardHeader>
            <CardTitle>Vehicle Status</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
            <div className="w-64">
                <Select
                    value={application.vehicle_status || 'None'}
                    onValueChange={(value) => onVehicleStatusChange(value === 'None' ? '' : value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select vehicle status..." />
                    </SelectTrigger>
                    <SelectContent>
                        {VEHICLE_STATUS_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {application.vehicle_status && application.vehicle_status !== 'None' && (
                <Badge className={`${getVehicleStatusColor(application.vehicle_status)}`}>
                    {application.vehicle_status}
                </Badge>
            )}
        </CardContent>
      </Card> */}

      {/* Vehicle Status Change History - Hidden as requested */}
      {/* <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Vehicle Status History
            </div>
            {vehicleStatusLogs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLogDialog(true)}
                className="text-xs h-7"
              >
                Log ({vehicleStatusLogs.length})
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {vehicleStatusLogs.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-3">
              No changes recorded yet
            </div>
          ) : (
            <div className="space-y-2">
              {vehicleStatusLogs.slice(0, 2).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="flex-1">
                    <span className="font-medium text-blue-700 capitalize">
                      {log.field}
                    </span>
                    <div className="text-xs text-gray-600">
                      <span className="text-red-600">{log.previous_value || 'None'}</span>
                      {' → '}
                      <span className="text-green-600">{log.new_value || 'None'}</span>
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

      {/* Log Dialog for Vehicle Status - Hidden as requested */}
      {/* <LogDialog
        open={showLogDialog}
        onClose={() => setShowLogDialog(false)}
        logs={vehicleStatusLogs}
        title="Vehicle Status Change History"
        type="audit"
      /> */}
    </div>
  );
};

export default DetailsTab; 