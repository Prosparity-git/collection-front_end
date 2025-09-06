import { TableCell, TableRow } from '@/components/ui/table';
import { Application } from '@/types/application';
import { PlanVsAchievementApplication } from '@/types/planVsAchievement';
import ApplicationDetails from '@/components/tables/ApplicationDetails';
import StatusBadge from '@/components/tables/StatusBadge';
import { formatPtpDate } from '@/utils/formatters';

interface CommentChangesDisplayProps {
  comments?: Array<{content: string; user_name: string}>;
}

const CommentChangesDisplay = ({ comments }: CommentChangesDisplayProps) => {
  if (!comments || comments.length === 0) {
    return <div className="text-xs text-gray-400 italic">No comment changes</div>;
  }

  return (
    <div className="space-y-1">
      {comments.map((comment, index) => (
        <div key={index} className="text-xs p-2 rounded bg-gray-50 border-l-2 border-blue-200">
          <div className="font-medium text-blue-700 mb-1">{comment.user_name}</div>
          <div className="text-gray-600 break-words">{comment.content}</div>
        </div>
      ))}
    </div>
  );
};

interface PlanVsAchievementRowProps {
  item: PlanVsAchievementApplication;
  index: number;
  application: Application | undefined;
  changeSummary: string;
  comments: Array<{content: string; user_name: string}>;
  selectedApplication: Application | null;
  onApplicationSelect: (app: Application, event: React.MouseEvent<HTMLTableRowElement>) => void;
}

const PlanVsAchievementRow = ({
  item,
  index,
  application,
  changeSummary,
  comments,
  selectedApplication,
  onApplicationSelect
}: PlanVsAchievementRowProps) => {
  return (
    <TableRow 
      className={`
        cursor-pointer transition-all duration-200 border-b border-gray-100
        ${selectedApplication?.applicant_id === item.applicant_id 
          ? 'bg-blue-50 border-l-4 border-l-blue-500' 
          : 'hover:bg-gray-50'
        }
        ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}
      `}
      onClick={event => application && onApplicationSelect(application, event)}
    >
      <TableCell className="py-4">
        {application && <ApplicationDetails application={application} />}
      </TableCell>
      
      <TableCell className="text-center py-4">
        <span className={`
          font-medium whitespace-nowrap px-3 py-1 rounded-full text-sm
          ${item.previous_ptp_date 
            ? 'text-blue-700 bg-blue-100' 
            : 'text-gray-500 bg-gray-100'
          }
        `}>
          {item.previous_ptp_date ? formatPtpDate(item.previous_ptp_date) : 'Not Set'}
        </span>
      </TableCell>
      
      <TableCell className="text-center py-4">
        {item.previous_status ? (
          <StatusBadge status={item.previous_status} />
        ) : (
          <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">Unknown</span>
        )}
      </TableCell>
      
      <TableCell className="text-center py-4">
        <span className={`
          font-medium whitespace-nowrap px-3 py-1 rounded-full text-sm
          ${item.updated_ptp_date 
            ? 'text-blue-700 bg-blue-100' 
            : 'text-gray-500 bg-gray-100'
          }
        `}>
          {item.updated_ptp_date ? formatPtpDate(item.updated_ptp_date) : 'Not Set'}
        </span>
      </TableCell>
      
      <TableCell className="text-center py-4">
        {item.updated_status ? (
          <StatusBadge status={item.updated_status} />
        ) : (
          <span className="text-gray-500 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">Unknown</span>
        )}
      </TableCell>
      
      <TableCell className="text-center py-4">
        <span className={`
          px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap
          ${changeSummary === 'No Change' 
            ? 'bg-gray-100 text-gray-600'
            : changeSummary.includes('Status Changed') && changeSummary.includes('PTP')
            ? 'bg-purple-100 text-purple-700'
            : changeSummary.includes('Status Changed')
            ? 'bg-green-100 text-green-700'
            : 'bg-blue-100 text-blue-700'
          }
        `}>
          {changeSummary}
        </span>
      </TableCell>
      
      <TableCell className="max-w-[300px] py-4">
        <CommentChangesDisplay comments={comments} />
      </TableCell>
    </TableRow>
  );
};

export default PlanVsAchievementRow;
