
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { client } from "@/integrations/api/client";
import { toast } from "sonner";
import { History, Search, Filter } from "lucide-react";
import { format } from "date-fns";

interface StatusChangeRequest {
  id: string;
  application_id: string;
  requested_status: string;
  current_status: string;
  requested_by_email: string;
  requested_by_name?: string;
  request_timestamp: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  reviewed_by_email?: string;
  reviewed_by_name?: string;
  review_timestamp?: string;
  review_comments?: string;
}

const StatusRequestHistory = () => {
  const [requests, setRequests] = useState<StatusChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchRequestHistory = async () => {
    try {
      const { data, error } = await client
        .from('status_change_requests')
        .select('*')
        .order('request_timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching request history:', error);
        toast.error('Failed to fetch request history');
        return;
      }

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching request history:', error);
      toast.error('Failed to fetch request history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestHistory();
  }, []);

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.application_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requested_by_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requested_by_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reviewed_by_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reviewed_by_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || request.approval_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-50 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-50 text-red-800 border-red-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading request history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Status Change Request History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by application ID, user name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Request History Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Application ID</TableHead>
                  <TableHead>Status Change</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Request Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reviewed By</TableHead>
                  <TableHead>Review Date</TableHead>
                  <TableHead>Comments</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-medium text-blue-600">
                        {request.application_id}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-1 bg-red-50 text-red-700 rounded">
                          {request.current_status}
                        </span>
                        <span>→</span>
                        <span className="px-2 py-1 bg-green-50 text-green-700 rounded">
                          {request.requested_status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {request.requested_by_name || 'Unknown'}
                        </div>
                        <div className="text-gray-500">
                          {request.requested_by_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {format(new Date(request.request_timestamp), 'dd-MMM-yyyy HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={getStatusColor(request.approval_status)}
                      >
                        {request.approval_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.reviewed_by_name || request.reviewed_by_email ? (
                        <div className="text-sm">
                          <div className="font-medium">
                            {request.reviewed_by_name || 'Unknown'}
                          </div>
                          <div className="text-gray-500">
                            {request.reviewed_by_email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Not reviewed</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {request.review_timestamp ? (
                        <div className="text-sm text-gray-600">
                          {format(new Date(request.review_timestamp), 'dd-MMM-yyyy HH:mm')}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {request.review_comments ? (
                        <div className="text-sm max-w-xs truncate" title={request.review_comments}>
                          {request.review_comments}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No comments</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {requests.length === 0 
                ? "No status change requests found"
                : "No requests match your search criteria"
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StatusRequestHistory;
