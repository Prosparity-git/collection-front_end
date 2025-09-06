
import { memo } from "react";

interface Comment {
  content: string;
  user_name: string;
}

interface CommentsDisplayProps {
  comments?: Comment[] | any[];
  hasComments?: boolean;
  loading?: boolean;
}

const CommentsDisplay = memo(({ comments, hasComments, loading }: CommentsDisplayProps) => {
  
  if (loading) {
    return (
      <div className="bg-gray-50 p-3 rounded">
        <div className="text-xs text-gray-400 italic">Loading comments...</div>
      </div>
    );
  }
  
  if (comments && comments.length > 0) {
    return (
      <div className="bg-gray-50 p-3 rounded">
        <div className="space-y-2">
          {comments.slice(0, 3).map((comment, index) => (
            <div key={index} className="relative pl-4">
              {/* Light blue vertical line */}
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-200"></div>
              {/* User name in blue */}
              <div className="font-medium text-blue-600 text-sm mb-1">
                {comment.user_name || 'Unknown User'}
              </div>
              {/* Comment text */}
              <div className="text-xs text-gray-700 break-words">{comment.content}</div>
            </div>
          ))}
          {comments.length > 3 && (
            <div className="text-xs text-blue-600 italic mt-2">
              +{comments.length - 3} more comments
            </div>
          )}
        </div>
      </div>
    );
  }

  // For empty state, show a simple indicator
  return (
    <div className="text-xs text-gray-400 italic">
      {hasComments ? 'Has comments - click to view' : 'Click to add comments'}
    </div>
  );
});

CommentsDisplay.displayName = "CommentsDisplay";

export default CommentsDisplay;
