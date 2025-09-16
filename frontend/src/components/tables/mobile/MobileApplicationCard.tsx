import { memo } from "react";
import { Application } from "@/types/application";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPtpDate, formatEmiMonth } from "@/utils/formatters";
import CallButton from "../../CallButton";
import { X, ArrowRight } from "lucide-react";
import CommentsDisplay from "../CommentsDisplay";

interface MobileApplicationCardProps {
  application: Application;
  onRowClick: (application: Application) => void;
  selectedApplicationId?: string;
  selectedMonth: string;
}

const getStatusColor = (status: string) => {
  const variants = {
    'Unpaid': 'bg-red-100 text-red-800 border-red-200',
    'Partially Paid': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Cash Collected from Customer': 'bg-orange-100 text-orange-800 border-orange-200',
    'Customer Deposited to Bank': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'Paid (Pending Approval)': 'bg-blue-100 text-blue-800 border-blue-200',
    'Paid': 'bg-green-100 text-green-800 border-green-200'
  };
  
  return `${variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800 border-gray-200'} border`;
};

const getStatusIcon = (status: string) => {
  const statusLower = status.toLowerCase();
  
  // Handle "Not Called" status
  if (statusLower === "not called" || statusLower === "not called") {
    return <div className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" />;
  }
  
  // Handle "Not answered" status
  if (statusLower === "not answered" || statusLower === "no response") {
    return <X className="w-3 h-3 text-red-500 flex-shrink-0" />;
  }
  
  // Handle "Called" or "answered" status
  if (statusLower === "called" || statusLower === "answered" || 
      statusLower === "customer funded the account" || 
      statusLower === "customer will fund the account on a future date" ||
      statusLower === "cash collected" ||
      statusLower === "cash will be collected on a future date" ||
      statusLower === "spoken – no commitment" ||
      statusLower === "refused / unable to fund") {
    return <ArrowRight className="w-3 h-3 text-green-500 flex-shrink-0" />;
  }
  
  // Default case - empty circle
  return <div className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" />;
};

const MobileApplicationCard = memo(({ 
  application, 
  onRowClick, 
  selectedApplicationId,
  selectedMonth
}: MobileApplicationCardProps) => {
  // Use the same data flow as desktop ApplicationRow - directly from application object
  const displayStatus = application.status;
  const displayPtpDate = application.ptp_date;
  const displayContactStatus = {
    applicant: application.applicant_calling_status || "Not Called",
    co_applicant: application.co_applicant_calling_status || "Not Called",
    guarantor: application.guarantor_calling_status || "Not Called",
    reference: application.reference_calling_status || "Not Called"
  };
  const displayComments = (application as any).comments || [];

  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98] ${
        selectedApplicationId === application.id ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-lg'
      }`}
      onClick={() => onRowClick(application)}
    >
      <CardContent className="p-3 sm:p-4">
        {/* Application Details - Match desktop ApplicationRow exactly */}
        <div className="mb-3">
          <div className="flex flex-col gap-1">
            <span className="font-bold text-blue-800 text-sm sm:text-base">{application.applicant_name}</span>
            <span className="text-xs text-gray-700">ID: {application.applicant_id}</span>
            <span className="text-xs text-gray-700">EMI Month: {formatEmiMonth(selectedMonth || application.emi_month)}</span>
            <span className="text-xs text-gray-700">Branch: {application.branch_name}</span>
            <span className="text-xs text-gray-700">TL: {application.team_lead}</span>
            <span className="text-xs text-gray-700">RM: {application.rm_name}</span>
            <span className="text-xs text-gray-700">Dealer: {application.dealer_name}</span>
            <span className="text-xs text-gray-700">Lender: {application.lender_name}</span>
          </div>
        </div>

        {/* EMI Amount - Match desktop styling exactly */}
        <div className="mb-3">
          <div className="text-blue-600 font-semibold text-sm sm:text-base">
            {formatCurrency(application.emi_amount)}
          </div>
        </div>

        {/* Status - Match desktop StatusBadge exactly */}
        <div className="mb-3">
          <Badge className={getStatusColor(displayStatus)}>
            {displayStatus}
          </Badge>
        </div>

        {/* PTP Date - Match desktop structure exactly */}
        <div className="mb-3">
          <div className="text-xs text-gray-700">
            {displayPtpDate ? formatPtpDate(displayPtpDate) : 'Not Set'}
          </div>
        </div>

        {/* Calling Status - Match desktop CallingStatusColumn exactly */}
        <div className="mb-3">
          <div className="text-xs text-gray-700 mb-2">Calling Status:</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1 text-xs">
              {getStatusIcon(displayContactStatus.applicant)}
              <span className="text-gray-700 font-medium">Applicant</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {getStatusIcon(displayContactStatus.co_applicant)}
              <span className="text-gray-700 font-medium">Co-Applicant</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {getStatusIcon(displayContactStatus.guarantor)}
              <span className="text-gray-700 font-medium">Guarantor</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              {getStatusIcon(displayContactStatus.reference)}
              <span className="text-gray-700 font-medium">Reference</span>
            </div>
          </div>
        </div>

        {/* Recent Comments - Use CommentsDisplay component for consistency */}
        <div className="border-t pt-3">
          <CommentsDisplay 
            comments={displayComments?.map((comment: string) => ({
              content: comment,
              user_name: 'Unknown User' // Default user name for mobile
            })) || []}
            hasComments={!!displayComments?.length}
          />
        </div>

        {/* Call Button - Keep for mobile convenience */}
        {application.applicant_mobile && (
          <div className="mt-3 pt-3 border-t">
            <CallButton 
              name="Call Applicant" 
              phone={application.applicant_mobile}
              variant="default"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-1.5 w-full text-xs sm:text-sm"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
});

MobileApplicationCard.displayName = "MobileApplicationCard";

export default MobileApplicationCard;
