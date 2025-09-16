import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw, Clock, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { RecentActivityItem } from '@/integrations/api/services/recentActivityService';

interface RecentActivityCardProps {
  activities: RecentActivityItem[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  title?: string;
  showHeader?: boolean;
  maxItems?: number;
}

const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  activities,
  loading,
  error,
  onRefresh,
  title = "Recent Activity",
  showHeader = true,
  maxItems = 10
}) => {
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${format(date, 'dd-MMM-yy')} at ${format(date, 'HH:mm')}`;
    } catch {
      return dateStr;
    }
  };

  const formatValue = (value: string | null, activityType: string) => {
    if (!value) return 'None';
    
    // Format based on activity type
    switch (activityType) {
      case 'Amount Collected':
        // Format as currency if it's a number
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          return `₹${numValue.toLocaleString('en-IN')}`;
        }
        return value;
      case 'PTP Date':
        // Format as date if it's a date string
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return format(date, 'dd-MMM-yyyy');
          }
        } catch {
          // Fall through to return original value
        }
        return value;
      default:
        return value;
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'Status':
        return '🔄';
      case 'Calling Status':
        return '📞';
      case 'PTP Date':
        return '📅';
      case 'Amount Collected':
        return '💰';
      default:
        return '📝';
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'Status':
        return 'text-blue-600';
      case 'Calling Status':
        return 'text-green-600';
      case 'PTP Date':
        return 'text-orange-600';
      case 'Amount Collected':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  // Show only recent items
  const recentActivities = activities.slice(0, maxItems);

  return (
    <Card>
      {showHeader && (
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {title}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="text-xs h-7"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
      )}
      
      <CardContent className="pt-0">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-600 py-3">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading recent activity...
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 py-3">
            <p className="font-medium">Error loading activity:</p>
            <p>{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && recentActivities.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-3">
            No recent activity recorded yet
          </div>
        )}

        {!loading && !error && recentActivities.length > 0 && (
          <div className="space-y-2">
            {recentActivities.map((activity, index) => (
              <div 
                key={`${activity.id}-${activity.timestamp}-${index}`} 
                className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm hover:bg-gray-100 transition-colors"
              >
                <div className="text-lg flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.activity_type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`font-medium ${getActivityColor(activity.activity_type)}`}>
                      {activity.activity_type}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {activity.changed_by}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                    <span className="text-red-600 font-medium">
                      {formatValue(activity.from_value, activity.activity_type)}
                    </span>
                    <ArrowRight className="h-3 w-3 text-gray-400" />
                    <span className="text-green-600 font-medium">
                      {formatValue(activity.to_value, activity.activity_type)}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(activity.timestamp)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivityCard;
