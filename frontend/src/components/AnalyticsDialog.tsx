
import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Application } from '@/types/application';
import PaymentStatusTable from './analytics/PaymentStatusTable';
import PTPStatusTable from './analytics/PTPStatusTable';

interface AnalyticsDialogProps {
  applications: Application[];
}

const AnalyticsDialog = ({ applications }: AnalyticsDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs">
          <BarChart3 className="h-3 w-3 mr-1" />
          Analytics
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Analytics Dashboard</DialogTitle>
          <DialogDescription>
            View payment status and PTP analytics across RMs and branches
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="payment-status" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payment-status">Payment Status</TabsTrigger>
            <TabsTrigger value="ptp-status">PTP Status</TabsTrigger>
          </TabsList>
          
          <TabsContent value="payment-status" className="space-y-4">
            <PaymentStatusTable applications={applications} />
          </TabsContent>
          
          <TabsContent value="ptp-status" className="space-y-4">
            <PTPStatusTable applications={applications} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AnalyticsDialog;
