
import { useMemo, useState } from 'react';
import { Application } from '@/types/application';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpDown, Calendar, BarChart3 } from 'lucide-react';
import { DrillDownFilter } from '@/pages/Analytics';
import { format, parseISO, getDay, getMonth, isValid } from 'date-fns';

interface PaymentPatternTableProps {
  applications: Application[];
  onDrillDown?: (filter: DrillDownFilter) => void;
}

interface PatternData {
  period: string;
  type: 'day' | 'month';
  totalPayments: number;
  totalAmount: number;
  avgAmount: number;
  percentage: number;
}

type SortField = 'period' | 'totalPayments' | 'totalAmount' | 'avgAmount' | 'percentage';
type SortDirection = 'asc' | 'desc';

const PaymentPatternTable = ({ applications, onDrillDown }: PaymentPatternTableProps) => {
  const [viewType, setViewType] = useState<'day' | 'month'>('day');
  const [sortField, setSortField] = useState<SortField>('totalPayments');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const patternData = useMemo(() => {
    const paidApplications = applications.filter(app => 
      app.field_status === 'Paid' || app.field_status === 'Paid (Pending Approval)'
    );

    if (viewType === 'day') {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayMap = new Map<number, PatternData>();

      // Initialize all days
      dayNames.forEach((name, index) => {
        dayMap.set(index, {
          period: name,
          type: 'day',
          totalPayments: 0,
          totalAmount: 0,
          avgAmount: 0,
          percentage: 0
        });
      });

      paidApplications.forEach(app => {
        // For demo, we'll use demand_date as proxy for payment date
        if (app.demand_date) {
          try {
            const date = parseISO(app.demand_date);
            if (isValid(date)) {
              const dayOfWeek = getDay(date);
              const data = dayMap.get(dayOfWeek)!;
              data.totalPayments++;
              data.totalAmount += Number(app.emi_amount) || 0;
            }
          } catch (error) {
            console.error('Error parsing date:', app.demand_date);
          }
        }
      });

      const totalPayments = paidApplications.length;
      return Array.from(dayMap.values()).map(data => ({
        ...data,
        avgAmount: data.totalPayments > 0 ? data.totalAmount / data.totalPayments : 0,
        percentage: totalPayments > 0 ? (data.totalPayments / totalPayments) * 100 : 0
      }));

    } else {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      const monthMap = new Map<number, PatternData>();

      // Initialize all months
      monthNames.forEach((name, index) => {
        monthMap.set(index, {
          period: name,
          type: 'month',
          totalPayments: 0,
          totalAmount: 0,
          avgAmount: 0,
          percentage: 0
        });
      });

      paidApplications.forEach(app => {
        if (app.demand_date) {
          try {
            const date = parseISO(app.demand_date);
            if (isValid(date)) {
              const month = getMonth(date);
              const data = monthMap.get(month)!;
              data.totalPayments++;
              data.totalAmount += Number(app.emi_amount) || 0;
            }
          } catch (error) {
            console.error('Error parsing date:', app.demand_date);
          }
        }
      });

      const totalPayments = paidApplications.length;
      return Array.from(monthMap.values()).map(data => ({
        ...data,
        avgAmount: data.totalPayments > 0 ? data.totalAmount / data.totalPayments : 0,
        percentage: totalPayments > 0 ? (data.totalPayments / totalPayments) * 100 : 0
      }));
    }
  }, [applications, viewType]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...patternData].sort((a, b) => {
    let aValue: number | string = a[sortField];
    let bValue: number | string = b[sortField];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return sortDirection === 'asc' 
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const SortableHeader = ({ 
    field, 
    children, 
    className = "" 
  }: { 
    field: SortField; 
    children: React.ReactNode; 
    className?: string; 
  }) => (
    <TableHead className={`cursor-pointer hover:bg-gray-50 ${className}`} onClick={() => handleSort(field)}>
      <div className="flex items-center justify-center gap-1">
        {children}
        <ArrowUpDown className="h-3 w-3" />
      </div>
    </TableHead>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getBarWidth = (percentage: number) => {
    const maxPercentage = Math.max(...patternData.map(d => d.percentage));
    return maxPercentage > 0 ? (percentage / maxPercentage) * 100 : 0;
  };

  return (
    <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="pb-3 bg-gradient-to-r from-teal-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-teal-600" />
            <div>
              <CardTitle className="text-lg text-teal-900">Payment Pattern Analysis</CardTitle>
              <CardDescription className="text-sm text-teal-700">
                Temporal patterns and behavioral insights from payment data
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewType('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewType === 'day' 
                  ? 'bg-teal-100 text-teal-800 border-2 border-teal-200' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              By Day
            </button>
            <button
              onClick={() => setViewType('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewType === 'month' 
                  ? 'bg-teal-100 text-teal-800 border-2 border-teal-200' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              By Month
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="rounded-lg border border-gray-200 overflow-x-auto shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="text-xs bg-gray-50/80">
                <SortableHeader field="period" className="min-w-[120px]">
                  {viewType === 'day' ? 'Day of Week' : 'Month'}
                </SortableHeader>
                <SortableHeader field="totalPayments" className="w-24 text-center">Payments</SortableHeader>
                <SortableHeader field="totalAmount" className="w-28 text-center">Total Amount</SortableHeader>
                <SortableHeader field="avgAmount" className="w-24 text-center">Avg Amount</SortableHeader>
                <SortableHeader field="percentage" className="w-32 text-center">Percentage</SortableHeader>
                <TableHead className="w-40 text-center text-xs">Visual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row) => (
                <TableRow key={row.period} className="text-sm hover:bg-gray-50/50">
                  <TableCell className="py-3 text-xs font-medium">
                    <div className="flex items-center gap-2">
                      <span>{row.period}</span>
                      {row.percentage > 20 && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                          Peak
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-3 text-xs font-medium">
                    {row.totalPayments}
                  </TableCell>
                  <TableCell className="text-center py-3 text-xs text-green-600 font-medium">
                    {formatCurrency(row.totalAmount)}
                  </TableCell>
                  <TableCell className="text-center py-3 text-xs">
                    {formatCurrency(row.avgAmount)}
                  </TableCell>
                  <TableCell className="text-center py-3 text-xs">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      row.percentage >= 20 ? 'bg-green-100 text-green-800' :
                      row.percentage >= 15 ? 'bg-blue-100 text-blue-800' :
                      row.percentage >= 10 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {row.percentage.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-teal-400 to-blue-500 transition-all duration-300"
                          style={{ width: `${getBarWidth(row.percentage)}%` }}
                        />
                      </div>
                      {row.percentage > 0 && (
                        <BarChart3 className="h-3 w-3 text-teal-600" />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {sortedData.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-500">No payment pattern data available</p>
            <p className="text-sm text-gray-400">Complete some payments to see temporal patterns</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentPatternTable;
