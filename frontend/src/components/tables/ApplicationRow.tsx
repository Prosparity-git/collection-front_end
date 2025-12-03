import { memo, useEffect, useState } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Application } from "@/types/application";
import { formatEmiMonth, formatCurrency, formatPtpDate } from "@/utils/formatters";
import { Check, X, IndianRupee } from "lucide-react";

import StatusBadge from "./StatusBadge";
import ApplicationDetails from "./ApplicationDetails";
import CallStatusDisplay from "../CallStatusDisplay";
import CommentsDisplay from "./CommentsDisplay";
import VehicleStatusBadge from "../VehicleStatusBadge";
import type { BatchComment } from "@/hooks/useBatchComments";
import type { BatchContactStatus } from "@/hooks/useBatchContactCallingStatus";
import { CommentsService } from "@/integrations/api/services/commentsService";
import { COMMENT_TYPES } from "@/integrations/api/services/commentsService";

interface ApplicationRowProps {
  application: Application;
  selectedApplicationId?: string;
  onRowClick: (application: Application) => void;
  selectedEmiMonth?: string | null;
  // Batched data props
  batchedStatus?: string;
  batchedPtpDate?: string | null;
  batchedContactStatus?: BatchContactStatus;
  batchedComments?: BatchComment[];
  isLoading?: boolean;
}

const ApplicationRow = memo(({ 
  application, 
  selectedApplicationId, 
  onRowClick,
  selectedEmiMonth,
  batchedStatus,
  batchedPtpDate,
  batchedContactStatus,
  batchedComments,
  isLoading
}: ApplicationRowProps) => {
  const [comments, setComments] = useState<BatchComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  // Fetch comments for this application
  useEffect(() => {
    const fetchComments = async () => {
      if (!application.payment_id) {
        console.log('⚠️ No payment_id for application:', application.applicant_id);
        return;
      }
      
      console.log('🔍 Fetching comments for application:', application.applicant_id, 'payment_id:', application.payment_id);
      setCommentsLoading(true);
      try {
        const commentsResponse = await CommentsService.getCommentsByRepaymentAndType(
          application.payment_id.toString(),
          COMMENT_TYPES.APPLICATION_DETAILS,
          0, // skip
          3  // limit - get top 3 comments
        );

        console.log('📝 Comments response for', application.applicant_id, ':', commentsResponse);

        if (commentsResponse.results && commentsResponse.results.length > 0) {
          const mappedComments: BatchComment[] = commentsResponse.results.map(comment => ({
            id: comment.id.toString(),
            content: comment.comment,
            created_at: comment.commented_at,
            user_id: comment.user_id.toString(),
            user_name: comment.user_name || `User ${comment.user_id}`,
            application_id: application.applicant_id
          }));
          console.log('✅ Mapped comments for', application.applicant_id, ':', mappedComments);
          setComments(mappedComments);
        } else {
          console.log('ℹ️ No comments found for application:', application.applicant_id);
          setComments([]);
        }
      } catch (error) {
        console.error('❌ Error fetching comments for application:', application.applicant_id, error);
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [application.payment_id, application.applicant_id]);

  const handleRowClick = (e: React.MouseEvent) => {
    onRowClick(application);
  };

  return (
    <TableRow
      className={`cursor-pointer transition-colors align-top ${
        selectedApplicationId === application.id
          ? 'bg-blue-50 border-l-4 border-l-blue-500 hover:bg-blue-100'
          : 'hover:bg-gray-50'
      }`}
      onClick={handleRowClick}
    >
      {/* Application Details */}
      <TableCell className="py-4 align-top w-[24%]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-blue-800">{application.applicant_name}</span>
            <VehicleStatusBadge vehicleStatus={application.vehicle_status} />
            {(() => {
              // Check for problematic tag - handle various formats
              const tags = application.special_case_tags || [];
              const hasProblematic = tags.some(tag => {
                if (!tag) return false;
                const normalizedTag = String(tag).toLowerCase().trim();
                return normalizedTag === 'problematic';
              });
              
              // Debug logging for troubleshooting
              if (tags.length > 0) {
                console.log(`🔍 [ApplicationRow] ${application.applicant_name} (${application.applicant_id}):`, {
                  special_case_tags: tags,
                  hasProblematic,
                  tagsArray: tags,
                  tagTypes: tags.map(t => typeof t)
                });
              }
              
              return hasProblematic ? (
                <span 
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-700 text-white border border-red-800"
                  title="Problematic Case"
                >
                  Problematic
                </span>
              ) : null;
            })()}
          </div>
          <span className="text-xs text-gray-700">ID: {application.applicant_id}</span>
          <span className="text-xs text-gray-700">
            EMI Amount: {application.emi_amount != null && !isNaN(application.emi_amount) ? formatCurrency(application.emi_amount) : 'N/A'}
          </span>
          <span className="text-xs text-gray-700">EMI Month: {formatEmiMonth(selectedEmiMonth ? selectedEmiMonth : application.emi_month)}</span>
          <span className="text-xs text-gray-700">Branch: {application.branch_name}</span>
          <span className="text-xs text-gray-700">
            RM: {application.rm_name || 'N/A'}, TL: {application.team_lead || 'N/A'}
          </span>
          <span className="text-xs text-gray-700">Repayment Number: {application.demand_num || 'N/A'}</span>
          <span className="text-xs text-gray-700">Current DPD Bucket: {application.current_dpd_bucket ?? 'X'}</span>
          {/* NACH Status */}
          {application.nach_status !== undefined && application.nach_status !== null && (
            <>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-700">NACH Status: </span>
                {Number(application.nach_status) === 1 ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <X className="h-3 w-3 text-red-600" />
                )}
              </div>
              {Number(application.nach_status) !== 1 && application.reason && (
                <span className="text-xs text-gray-700">NACH Reason: {application.reason}</span>
              )}
            </>
          )}
        </div>
      </TableCell>

      {/* Overdue */}
      <TableCell className="py-4 align-top text-center w-[18%]">
        <div className="flex flex-col gap-1 items-center">
          <div className="text-sm grid grid-cols-[auto_auto_1fr] items-center gap-x-1">
            <span className="text-gray-600">As of 7th:</span>
            <span className="font-semibold text-blue-600 inline-flex items-center gap-1">
              {application.total_overdue_amount != null && !isNaN(application.total_overdue_amount)
                ? (
                  <>
                    <IndianRupee className="h-4 w-4" />
                    {`${application.total_overdue_amount.toLocaleString('en-IN')}/-`}
                  </>
                )
                : 'N/A'}
            </span>
          </div>
          <div className="text-sm grid grid-cols-[auto_auto_1fr] items-center gap-x-1">
            <span className="text-gray-600">As of Today:</span>
            <span className="font-semibold text-blue-600 inline-flex items-center gap-1">
              {application.current_overdue_amount != null && !isNaN(application.current_overdue_amount)
                ? (
                  <>
                    <IndianRupee className="h-4 w-4" />
                    {`${application.current_overdue_amount.toLocaleString('en-IN')}/-`}
                  </>
                )
                : 'N/A'}
            </span>
          </div>
        </div>
      </TableCell>

      {/* Status */}
      <TableCell className="py-4 align-top text-center w-[10%]">
        <StatusBadge status={application.status} />
      </TableCell>

      {/* PTP Date */}
      <TableCell className="py-4 align-top text-center w-[10%]">
        {batchedPtpDate ? formatPtpDate(batchedPtpDate) : (application.ptp_date ? formatPtpDate(application.ptp_date) : 'Not Set')}
      </TableCell>


      {/* Amount Collected */}
      <TableCell className="py-4 align-top text-center w-[10%]">
        <div className="text-black font-semibold text-base">
          {application.amount_collected ? formatCurrency(application.amount_collected) : 'NA'}
        </div>
      </TableCell>

      {/* Recent Comments */}
      <TableCell className="py-4 align-top w-[20%]">
        <CommentsDisplay 
          comments={comments}
          hasComments={comments.length > 0}
          loading={commentsLoading}
        />
      </TableCell>
    </TableRow>
  );
});

ApplicationRow.displayName = "ApplicationRow";

export default ApplicationRow;
