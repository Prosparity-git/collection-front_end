
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
import { ArrowUpDown, Users, TrendingUp } from 'lucide-react';
import { DrillDownFilter } from '@/pages/Analytics';

interface RMPerformanceTableProps {
  applications: Application[];
  onDrillDown?: (filter: DrillDownFilter) => void;
}

interface RMPerformanceData {
  rm_name: string;
  branch_name: string;
  totalApplications: number;
  paidApplications: number;
  pendingApplications: number;
  conversionRate: number;
  avgEmiAmount: number;
  totalCollectionAmount: number;
  ptpComplianceRate: number;
}

type SortField = 'rm_name' | 'totalApplications' | 'paidApplications' | 'conversionRate' | 'avgEmiAmount' | 'totalCollectionAmount' | 'ptpComplianceRate';
type SortDirection = 'asc' | 'desc';

const RMPerformanceTable = ({ applications, onDrillDown }: RMPerformanceTableProps) => {
  const [sortField, setSortField] = useState<SortField>('conversionRate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const rmPerformanceData = useMemo(() => {
    const rmMap = new Map<string, RMPerformanceData>();

    applications.forEach(app => {
      const rmName = app.collection_rm || app.rm_name || 'Unknown RM';
      const key = `${rmName}_${app.branch_name}`;

      if (!rmMap.has(key)) {
        rmMap.set(key, {
          rm_name: rmName,
          branch_name: app.branch_name,
          totalApplications: 0,
          paidApplications: 0,
          pendingApplications: 0,
          conversionRate: 0,
          avgEmiAmount: 0,
          totalCollectionAmount: 0,
          ptpComplianceRate: 0
        });
      }

      const data = rmMap.get(key)!;
      data.totalApplications++;

      if (app.field_status === 'Paid' || app.field_status === 'Paid (Pending Approval)') {
        data.paidApplications++;
        data.totalCollectionAmount += Number(app.emi_amount) || 0;
      } else {
        data.pendingApplications++;
      }
    });

    // Calculate rates and averages
    return Array.from(rmMap.values()).map(data => {
      const totalEmiAmount = applications
        .filter(app => (app.collection_rm || app.rm_name) === data.rm_name && app.branch_name === data.branch_name)
        .reduce((sum, app) => sum + (Number(app.emi_amount) || 0), 0);

      const ptpApplications = applications
        .filter(app => (app.collection_rm || app.rm_name) === data.rm_name && app.branch_name === data.branch_name && app.ptp_date);
      
      const ptpPaidApplications = ptpApplications
        .filter(app => app.field_status === 'Paid' || app.field_status === 'Paid (Pending Approval)');

      return {
        ...data,
        conversionRate: data.totalApplications > 0 ? (data.paidApplications / data.totalApplications) * 100 : 0,
        avgEmiAmount: data.totalApplications > 0 ? totalEmiAmount / data.totalApplications : 0,
        ptpComplianceRate: ptpApplications.length > 0 ? (ptpPaidApplications.length / ptpApplications.length) * 100 : 0
      };
    }).sort((a, b) => b.conversionRate - a.conversionRate);
  }, [applications]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedData = [...rmPerformanceData].sort((a, b) => {
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

  const CellButton = ({ 
    value, 
    onClick, 
    className = "" 
  }: { 
    value: number; 
    onClick?: () => void; 
    className?: string; 
  }) => {
    if (!onClick) {
      return <span className={`text-center ${className}`}>{value}</span>;
    }
    
    return (
      <button
        onClick={onClick}
        className={`text-center hover:bg-blue-50 hover:text-blue-600 rounded px-1 py-0.5 transition-colors w-full ${className}`}
      >
        {value}
      </button>
    );
  };

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

  return (
    <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-lg text-orange-900">RM Performance Analysis</CardTitle>
        </div>
        <CardDescription className="text-sm text-orange-700">
          Individual RM metrics, conversion rates, and collection performance comparison
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="rounded-lg border border-gray-200 overflow-x-auto shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="text-xs bg-gray-50/80">
                <SortableHeader field="rm_name" className="min-w-[140px]">RM Name</SortableHeader>
                <SortableHeader field="totalApplications" className="w-20 text-center">Total</SortableHeader>
                <SortableHeader field="paidApplications" className="w-20 text-center">Paid</SortableHeader>
                <SortableHeader field="conversionRate" className="w-24 text-center">Conv. Rate</SortableHeader>
                <SortableHeader field="avgEmiAmount" className="w-24 text-center">Avg EMI</SortableHeader>
                <SortableHeader field="totalCollectionAmount" className="w-28 text-center">Collections</SortableHeader>
                <SortableHeader field="ptpComplianceRate" className="w-24 text-center">PTP Rate</SortableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row, index) => (
                <TableRow key={`${row.rm_name}-${row.branch_name}`} className="text-sm hover:bg-gray-50/50">
                  <TableCell className="py-3">
                    <div className="space-y-1">
                      <div className="font-medium text-xs">{row.rm_name}</div>
                      <div className="text-xs text-gray-500">{row.branch_name}</div>
                      {index < 3 && (
                        <div className="text-xs">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            #{index + 1} Performer
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-3 text-xs">
                    <CellButton value={row.totalApplications} />
                  </TableCell>
                  <TableCell className="text-center py-3 text-xs">
                    <CellButton 
                      value={row.paidApplications}
                      className="text-green-600 font-medium"
                    />
                  </TableCell>
                  <TableCell className="text-center py-3 text-xs">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                      row.conversionRate >= 80 ? 'bg-green-100 text-green-800' :
                      row.conversionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      row.conversionRate >= 40 ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {row.conversionRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-center py-3 text-xs">
                    {formatCurrency(row.avgEmiAmount)}
                  </TableCell>
                  <TableCell className="text-center py-3 text-xs font-medium text-blue-600">
                    {formatCurrency(row.totalCollectionAmount)}
                  </TableCell>
                  <TableCell className="text-center py-3 text-xs">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      row.ptpComplianceRate >= 70 ? 'bg-green-100 text-green-800' :
                      row.ptpComplianceRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {row.ptpComplianceRate.toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {sortedData.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-500">No RM performance data available</p>
            <p className="text-sm text-gray-400">Applications need assigned RMs to generate performance metrics</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RMPerformanceTable;
