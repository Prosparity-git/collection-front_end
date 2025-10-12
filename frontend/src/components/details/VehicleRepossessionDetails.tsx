import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface VehicleRepossessionDetailsProps {
  application: {
    repossession_date?: string | null;
    repossession_sale_date?: string | null;
    repossession_sale_amount?: number | null;
  };
}

const DetailItem = ({ label, value }: { label: string; value: string | number | undefined }) => (
  <div>
    <p className="text-xs font-medium text-gray-500">{label}</p>
    <p className="text-sm font-semibold text-gray-800 break-words">{value || 'N/A'}</p>
  </div>
);

const VehicleRepossessionDetails: React.FC<VehicleRepossessionDetailsProps> = ({ application }) => {
  // Check if any repossession data exists
  const hasRepossessionData = application.repossession_date || 
                             application.repossession_sale_date || 
                             application.repossession_sale_amount;

  // Don't render the component if no repossession data exists
  if (!hasRepossessionData) {
    return null;
  }

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: number | null | undefined): string => {
    if (!amount) return 'N/A';
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Vehicle Repossession Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-8">
          <DetailItem label="Repossession Date" value={formatDate(application.repossession_date)} />
          <DetailItem label="Sale Date" value={formatDate(application.repossession_sale_date)} />
          <DetailItem label="Sale Amount" value={formatAmount(application.repossession_sale_amount)} />
        </div>
      </CardContent>
    </Card>
  );
};

export default VehicleRepossessionDetails;
