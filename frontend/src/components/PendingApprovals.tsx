import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/integrations/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getPendingApprovals, getAuthHeaders } from "@/integrations/api/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, User, DollarSign, Calendar, FileText } from "lucide-react";

// Custom CSS for very small screens
const customStyles = `
  @media (max-width: 480px) {
    .xs\\:hidden { display: none !important; }
    .xs\\:inline { display: inline !important; }
    .xs\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  }
`;

interface PendingApprovalApplication {
  loan_id: number;
  repayment_id: string; // Added repayment_id field
  applicant_id: string;
  applicant_name: string;
  current_status: string;
  amount_collected: number;
  ptp_date: string;
  demand_date: string;
  demand_amount: number;
  payment_date: string;
  updated_at: string;
}

interface PendingApprovalResponse {
  total_applications: number;
  status: string;
  applications: PendingApprovalApplication[];
}

interface PendingApprovalsProps {
  onUpdate: () => void;
}

const PendingApprovals = ({ onUpdate }: PendingApprovalsProps) => {
  const { user } = useAuth();
  const [pendingApplications, setPendingApplications] = useState<PendingApprovalApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(() => {
    // Load saved state from localStorage
    const saved = localStorage.getItem('pendingApprovalsOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save toggle state to localStorage
  useEffect(() => {
    localStorage.setItem('pendingApprovalsOpen', JSON.stringify(isOpen));
  }, [isOpen]);

  const fetchPendingApplications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data: PendingApprovalResponse = await getPendingApprovals();
      console.log('Fetched pending applications:', data); // Debug log
      setPendingApplications(data.applications || []);
    } catch (error) {
      console.error('Error fetching pending applications:', error);
      toast.error('Failed to fetch pending applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApplications();
  }, [user]);

  const handleApprove = async (application: PendingApprovalApplication) => {
    if (!user) return;

    const actionKey = `${application.applicant_id}-approve`;
    setProcessingActions(prev => new Set(prev).add(actionKey));

    try {
      const payload = {
        loan_id: application.loan_id.toString(),
        repayment_id: application.repayment_id, // Using the actual repayment_id from API response
        action: "accept",
        user_id: user.id, // Use current user's ID from auth context
        comments: "" // Empty comments as requested
      };

      console.log('Sending approve payload:', payload); // Debug log

      const response = await fetch(`${API_BASE_URL}/paidpending-approval/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to approve application: ${response.status}`);
      }

      toast.success(`Application ${application.applicant_id} approved successfully`);
      
      // Refresh the applications and trigger parent update
      await fetchPendingApplications();
      onUpdate();
    } catch (error) {
      console.error('Error approving application:', error);
      toast.error('Failed to approve application');
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const handleReject = async (application: PendingApprovalApplication) => {
    if (!user) return;

    const actionKey = `${application.applicant_id}-reject`;
    setProcessingActions(prev => new Set(prev).add(actionKey));

    try {
      const payload = {
        loan_id: application.loan_id.toString(),
        repayment_id: application.repayment_id, // Using the actual repayment_id from API response
        action: "reject",
        user_id: user.id, // Use current user's ID from auth context
        comments: "" // Empty comments as requested
      };

      console.log('Sending reject payload:', payload); // Debug log

      const response = await fetch(`${API_BASE_URL}/paidpending-approval/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to reject application: ${response.status}`);
      }

      toast.success(`Application ${application.applicant_id} rejected successfully`);
      
      // Refresh the applications and trigger parent update
      await fetchPendingApplications();
      onUpdate();
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast.error('Failed to reject application');
    } finally {
      setProcessingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(actionKey);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 flex-shrink-0" />
            <span className="text-base sm:text-lg font-semibold">Pending Status Approvals</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="text-center py-4 text-sm sm:text-base">Loading pending applications...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <style>{customStyles}</style>
      <Card className="overflow-hidden">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors p-3 sm:p-6">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Clock className="h-5 w-5 flex-shrink-0" />
                <span className="text-base sm:text-lg font-semibold">Pending Status Approvals</span>
                {pendingApplications.length > 0 && (
                  <Badge variant="secondary" className="ml-2 flex-shrink-0">
                    {pendingApplications.length}
                  </Badge>
                )}
              </div>
              <div className="flex-shrink-0">
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            {pendingApplications.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <Clock className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                <p className="text-base sm:text-lg font-medium">No pending requests</p>
                <p className="text-xs sm:text-sm">All applications have been reviewed</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {pendingApplications.map((application) => (
                  <div key={application.applicant_id} className="border rounded-lg p-3 sm:p-4 bg-gray-50">
                    {/* Mobile-first layout */}
                    <div className="space-y-3">
                      {/* Header with name and ID */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <User className="h-4 w-4 text-gray-600 flex-shrink-0" />
                          <span className="font-medium text-base sm:text-lg truncate">{application.applicant_name}</span>
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {application.applicant_id}
                          </Badge>
                        </div>
                        
                        {/* Action buttons - Stack vertically on very small screens */}
                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(application)}
                            disabled={processingActions.has(`${application.applicant_id}-approve`) || processingActions.has(`${application.applicant_id}-reject`)}
                            className="flex items-center justify-center gap-1 bg-green-600 hover:bg-green-700 w-full sm:w-auto min-h-[32px] sm:min-h-[36px]"
                          >
                            {processingActions.has(`${application.applicant_id}-approve`) ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                <span className="hidden xs:inline">Processing...</span>
                                <span className="xs:hidden">...</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span className="hidden xs:inline">Approve</span>
                                <span className="xs:hidden">Approve</span>
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(application)}
                            disabled={processingActions.has(`${application.applicant_id}-approve`) || processingActions.has(`${application.applicant_id}-reject`)}
                            className="flex items-center justify-center gap-1 w-full sm:w-auto min-h-[32px] sm:min-h-[36px]"
                          >
                            {processingActions.has(`${application.applicant_id}-reject`) ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                <span className="hidden xs:inline">Processing...</span>
                                <span className="xs:hidden">...</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                <span className="hidden xs:inline">Reject</span>
                                <span className="xs:hidden">Reject</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Application details - Responsive grid */}
                      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm">
                        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                          <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                          <span className="font-medium text-xs sm:text-sm whitespace-nowrap">Amount:</span>
                          <span className="text-green-600 font-semibold text-xs sm:text-sm truncate">
                            ₹{application.amount_collected.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                          <span className="font-medium text-xs sm:text-sm whitespace-nowrap">PTP:</span>
                          <span className="text-xs sm:text-sm truncate">{application.ptp_date || 'Not set'}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                          <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                          <span className="font-medium text-xs sm:text-sm whitespace-nowrap">Demand:</span>
                          <span className="text-xs sm:text-sm truncate">₹{application.demand_amount.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                          <span className="font-medium text-xs sm:text-sm whitespace-nowrap">Demand Date:</span>
                          <span className="text-xs sm:text-sm truncate">{formatDate(application.demand_date)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                          <span className="font-medium text-xs sm:text-sm whitespace-nowrap">Payment:</span>
                          <span className="text-xs sm:text-sm truncate">{formatDate(application.payment_date)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-500 flex-shrink-0" />
                          <span className="font-medium text-xs sm:text-sm whitespace-nowrap">Updated:</span>
                          <span className="text-xs sm:text-sm truncate">{formatDate(application.updated_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
    </>
  );
};

export default PendingApprovals;
