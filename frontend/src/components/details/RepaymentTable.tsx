import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DelayCalculationService, DelayCalculationResult } from '@/integrations/api/services/delayCalculationService';
import { format } from 'date-fns';

interface RepaymentTableProps {
  loanId: number;
}

type PaymentStatus = 'Paid Late' | 'Paid Early' | 'Paid' | 'Overdue' | 'Due (Current Month)';

const getPaymentStatus = (demandDate: string, paymentDate: string | null, delayDays: number): PaymentStatus => {
  const demandDateObj = new Date(demandDate);
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const demandMonth = demandDateObj.getMonth();
  const demandYear = demandDateObj.getFullYear();
  
  // Case 3: Both dates are the same
  if (paymentDate && new Date(paymentDate).toDateString() === demandDateObj.toDateString()) {
    return 'Paid';
  }
  
  // Case 1: Payment exists and payment date is after demand date
  if (paymentDate && new Date(paymentDate) > demandDateObj) {
    return 'Paid Late';
  }
  
  // Case 2: Payment exists and payment date is before demand date
  if (paymentDate && new Date(paymentDate) < demandDateObj) {
    return 'Paid Early';
  }
  
  // Case 5: No payment, current month is same as demand date month
  if (!paymentDate && currentMonth === demandMonth && currentYear === demandYear) {
    return 'Due (Current Month)';
  }
  
  // Case 4: No payment, current month is ahead of demand date month
  if (!paymentDate && (currentYear > demandYear || (currentYear === demandYear && currentMonth > demandMonth))) {
    return 'Overdue';
  }
  
  return 'Due (Current Month)';
};

const getStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case 'Paid Late':
      return 'text-yellow-600 border-yellow-200 bg-yellow-50';
    case 'Paid Early':
      return 'text-green-600 border-green-200 bg-green-50';
    case 'Paid':
      return 'text-green-700 border-green-200 bg-green-50';
    case 'Overdue':
      return 'text-red-600 border-red-200 bg-red-50';
    case 'Due (Current Month)':
      return 'text-orange-600 border-orange-200 bg-orange-50';
    default:
      return 'text-gray-600 border-gray-200 bg-gray-50';
  }
};

const getStatusIcon = (status: PaymentStatus): string => {
  // Return a colored circle emoji based on status
  switch (status) {
    case 'Paid Late':
      return '🟡';
    case 'Paid Early':
      return '🟢';
    case 'Paid':
      return '🟢';
    case 'Overdue':
      return '🔴';
    case 'Due (Current Month)':
      return '🟠';
    default:
      return '⚪';
  }
};

const RepaymentTable: React.FC<RepaymentTableProps> = ({ loanId }) => {
  const [repaymentData, setRepaymentData] = useState<DelayCalculationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepaymentData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await DelayCalculationService.getDelayCalculations(loanId);
        setRepaymentData(response.results);
      } catch (err) {
        console.error('Error fetching repayment data:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch repayment data');
      } finally {
        setLoading(false);
      }
    };

    if (loanId) {
      fetchRepaymentData();
    }
  }, [loanId]);

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'yyyy-MM-dd');
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount: number): string => {
    return amount ? `₹${amount.toLocaleString()}` : '₹0';
  };

  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Repayment Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500">Loading repayment data...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Repayment Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-red-500">Error: {error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-semibold text-gray-800">Repayment Table</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">EMI #</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50 hidden">Demand Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Payment Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Delay Days</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Overdue Amount</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 bg-gray-50">Status</th>
              </tr>
            </thead>
            <tbody>
              {repaymentData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500 text-sm">
                    No repayment data available
                  </td>
                </tr>
              ) : (
                repaymentData.map((item, index) => {
                  const status = getPaymentStatus(item.demand_date, item.payment_date, item.delay_days);
                  return (
                    <tr key={item.payment_id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.demand_num}</td>
                      <td className="py-3 px-4 text-sm text-gray-700 hidden">{formatDate(item.demand_date)}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{formatDate(item.payment_date)}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className={`font-medium ${item.delay_days < 0 ? 'text-green-600' : item.delay_days > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {item.delay_days}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{formatAmount(item.overdue_amount)}</td>
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{getStatusIcon(status)}</span>
                          <Badge variant="outline" className={`${getStatusColor(status)} border font-medium text-xs px-3 py-1 rounded-full`}>
                            {status}
                          </Badge>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RepaymentTable;
