import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { format } from "date-fns";

interface LogEntry {
  id: string;
  created_at: string;
  user_name?: string | null;
  field?: string;
  previous_value?: string | null;
  new_value?: string | null;
  contact_type?: string;
  previous_status?: string | null;
  new_status?: string;
}

interface LogDialogProps {
  open: boolean;
  onClose: () => void;
  logs: LogEntry[];
  title: string;
  type: 'audit' | 'calling';
}

const LogDialog = ({ open, onClose, logs, title, type }: LogDialogProps) => {
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${format(date, 'dd-MMM-yy')} at ${format(date, 'HH:mm')}`;
    } catch {
      return dateStr;
    }
  };

  // Function to display user name with fallback
  const displayUserName = (userName: string | null) => {
    if (!userName || userName.trim() === '' || userName === 'Unknown User') {
      return 'Unknown User';
    }
    
    // If it looks like an email, try to extract name part or use as is
    if (userName.includes('@')) {
      return userName; // Keep email if that's all we have
    }
    
    return userName;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-sm text-gray-500 text-center py-8">
              No {type === 'audit' ? 'status changes' : 'call activity'} recorded yet
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-semibold text-blue-700 capitalize">
                      {type === 'audit' ? log.field : log.contact_type?.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(log.created_at)}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">From:</span>
                      <span className="text-red-600 font-medium">
                        {type === 'audit' 
                          ? (log.previous_value || 'Not Set')
                          : (log.previous_status || 'Not Called')
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-600">To:</span>
                      <span className="text-green-600 font-medium">
                        {type === 'audit' 
                          ? (log.new_value || 'Not Set')
                          : log.new_status
                        }
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Changed by: {displayUserName(log.user_name)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LogDialog;
