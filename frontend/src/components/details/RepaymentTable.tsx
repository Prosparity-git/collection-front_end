import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DelayCalculationService, DelayCalculationResult } from '@/integrations/api/services/delayCalculationService';
import { format } from 'date-fns';

interface RepaymentTableProps {
  loanId: number;
}

const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'paid late':
      return 'text-yellow-600';
    case 'paid early':
      return 'text-green-600';
    case 'paid':
      return 'text-green-700';
    case 'overdue':
      return 'text-red-600';
    case 'overdue (current month)':
      return 'text-orange-600';
    default:
      return 'text-gray-600';
  }
};

const getStatusIcon = (status: string): string => {
  // Return a colored circle emoji based on status
  switch (status.toLowerCase()) {
    case 'paid late':
      return '🟡';
    case 'paid early':
      return '🟢';
    case 'paid':
      return '🟢';
    case 'overdue':
      return '🔴';
    case 'overdue (current month)':
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
      <CardHeader className="pb-3">
        <CardTitle className="text-2xl font-semibold text-gray-800">Repayment Table</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full border-collapse min-w-[480px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50">EMI No.</th>
                <th className="text-left py-2 px-3 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50 hidden">Demand Date</th>
                <th className="text-left py-2 px-3 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50">Payment Date</th>
                <th className="text-left py-2 px-3 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50">Delay Days</th>
                <th className="text-left py-2 px-3 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50">Overdue Amount</th>
                <th className="text-left py-2 px-3 text-xs sm:text-sm font-semibold text-gray-700 bg-gray-50">Status</th>
              </tr>
            </thead>
            <tbody>
              {repaymentData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500 text-sm">
                    No repayment data available
                  </td>
                </tr>
              ) : (
                repaymentData.map((item, index) => {
                  return (
                    <tr key={item.payment_id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                      <td className="py-2 px-3 text-xs sm:text-sm font-medium text-gray-900">{item.demand_num}</td>
                      <td className="py-2 px-3 text-xs sm:text-sm text-gray-700 hidden">{formatDate(item.demand_date)}</td>
                      <td className="py-2 px-3 text-xs sm:text-sm text-gray-700">{formatDate(item.payment_date)}</td>
                      <td className="py-2 px-3 text-xs sm:text-sm">
                        <span className={`font-medium ${item.delay_days < 0 ? 'text-green-600' : item.delay_days > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {item.delay_days}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs sm:text-sm font-medium text-gray-900">{formatAmount(item.overdue_amount)}</td>
                      <td className="py-2 px-3 text-xs sm:text-sm">
                        <span className={`font-medium text-[10px] sm:text-xs ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
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
