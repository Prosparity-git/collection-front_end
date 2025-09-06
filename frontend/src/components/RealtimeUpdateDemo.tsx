import { useState, useEffect } from 'react';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RealtimeUpdateDemoProps {
  applicationId?: string;
}

const RealtimeUpdateDemo = ({ applicationId }: RealtimeUpdateDemoProps) => {
  const [updates, setUpdates] = useState<any[]>([]);
  const { subscribe } = useRealtimeUpdates();

  useEffect(() => {
    const unsubscribe = subscribe((update) => {
      console.log('🔄 RealtimeUpdateDemo: Received update:', update);
      
      // Only show updates for the specific application if applicationId is provided
      if (applicationId && update.applicationId !== applicationId) {
        return;
      }
      
      setUpdates(prev => [
        {
          ...update,
          id: Date.now() + Math.random(),
          receivedAt: new Date().toLocaleTimeString()
        },
        ...prev.slice(0, 9) // Keep only last 10 updates
      ]);
    });

    return unsubscribe;
  }, [subscribe, applicationId]);

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'STATUS_UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'PRE_EMI_STATUS_UPDATE':
        return 'bg-green-100 text-green-800';
      case 'PTP_DATE_UPDATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'AMOUNT_COLLECTED_UPDATE':
        return 'bg-purple-100 text-purple-800';
      case 'COMMENT_ADDED':
        return 'bg-pink-100 text-pink-800';
      case 'CONTACT_STATUS_UPDATE':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUpdateDescription = (update: any) => {
    switch (update.type) {
      case 'STATUS_UPDATE':
        return `Status changed to: ${update.status}`;
      case 'PRE_EMI_STATUS_UPDATE':
        return `Pre-EMI status changed to: ${update.preEmiStatus}`;
      case 'PTP_DATE_UPDATE':
        return `PTP date set to: ${update.ptpDate}`;
      case 'AMOUNT_COLLECTED_UPDATE':
        return `Amount collected: ₹${update.amount}`;
      case 'COMMENT_ADDED':
        return `Comment added: "${update.comment?.content?.substring(0, 50)}..."`;
      case 'CONTACT_STATUS_UPDATE':
        return `${update.contactType} status changed to: ${update.status}`;
      default:
        return 'Application updated';
    }
  };

  if (updates.length === 0) {
    return null;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">
          Realtime Updates {applicationId && `for ${applicationId}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {updates.map((update) => (
            <div key={update.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded text-xs">
              <Badge className={`text-xs ${getUpdateTypeColor(update.type)}`}>
                {update.type.replace('_UPDATE', '').replace('_ADDED', '')}
              </Badge>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">
                  {getUpdateDescription(update)}
                </div>
                <div className="text-gray-500">
                  {update.receivedAt} • App: {update.applicationId}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RealtimeUpdateDemo;
