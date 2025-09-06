
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
import { ArrowUpDown, TrendingUp, Clock } from 'lucide-react';
import { DrillDownFilter } from '@/pages/Analytics';
import { differenceInDays, parseISO, isValid } from 'date-fns';

interface CollectionVelocityTableProps {
  applications: Application[];
  onDrillDown?: (filter: DrillDownFilter) => void;
}

interface VelocityData {
  branch_name: string;
  rm_name: string;
  totalApplications: number;
  fastCollections: number; // <= 3 days
  mediumCollections: number; // 4-7 days  
  slowCollections: number; // > 7 days
  avgCollectionDays: number;
  velocityScore: number;
}

type SortField = 'branch_name' | 'rm_name' | 'avgCollectionDays' | 'velocityScore' | 'fastCollections';
type SortDirection = 'asc' | 'desc';

const CollectionVelocityTable = ({ applications, onDrillDown }: CollectionVelocityTableProps) => {
  const [sortField, setSortField] = useState<SortField>('velocityScore');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const velocityData = useMemo(() => {
    const velocityMap = new Map<string, VelocityData>();

    applications.forEach(app => {
      const rmName = app.collection_rm || app.rm_name || 'Unknown RM';
      const key = `${app.branch_name}_${rmName}`;

      if (!velocityMap.has(key)) {
        velocityMap.set(key, {
          branch_name: app.branch_name,
          rm_name: rmName,
          totalApplications: 0,
          fastCollections: 0,
          mediumCollections: 0,
          slowCollections: 0,
          avgCollectionDays: 0,
          velocityScore: 0
        });
      }

      const data = velocityMap.get(key)!;
      
      // Only count applications that have been resolved (paid)
      if (app.field_status === 'Paid' || app.field_status === 'Paid (Pending Approval)') {
        data.totalApplications++;

        // For demo purposes, we'll simulate collection days based on demand_date
        // In real implementation, you'd use actual payment_date - demand_date
        if (app.demand_date) {
          try {
            const demandDate = parseISO(app.demand_date);
            const currentDate = new Date();
            const daysDiff = Math.abs(differenceInDays(currentDate, demandDate));
            
            // Simulate collection speed based on status and other factors
            let simulatedDays = daysDiff;
            if (app.field_status === 'Paid') {
              simulatedDays = Math.min(daysDiff, 10); // Assume paid faster
            }

            if (simulatedDays <= 3) {
              data.fastCollections++;
            } else if (simulatedDays <= 7) {
              data.mediumCollections++;
            } else {
              data.slowCollections++;
            }
          } catch (error) {
            // Default to medium if date parsing fails
            data.mediumCollections++;
          }
        } else {
          data.mediumCollections++;
        }
      }
    });

    // Calculate averages and scores
    return Array.from(velocityMap.values())
      .filter(data => data.totalApplications > 0)
      .map(data => {
        // Calculate weighted average days
        const totalDays = (data.fastCollections * 2) + (data.mediumCollections * 5) + (data.slowCollections * 10);
        const avgDays = data.totalApplications > 0 ? totalDays / data.totalApplications : 0;
        
        // Calculate velocity score (higher is better)
        const fastPercentage = (data.fastCollections / data.totalApplications) * 100;
        const mediumPercentage = (data.mediumCollections / data.totalApplications) * 100;
        const velocityScore = (fastPercentage * 3) + (mediumPercentage * 1.5);

        return {
          ...data,
          avgCollectionDays: avgDays,
          velocityScore
        };
      })
      .sort((a, b) => b.velocityScore - a.velocityScore);
  }, [applications]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'avgCollectionDays' ? 'asc' : 'desc');
    }
  };

  const sortedData = [...velocityData].sort((a, b) => {
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

  const handleCellClick = (row: VelocityData, type: string) => {
    if (onDrillDown) {
      onDrillDown({
        branch_name: row.branch_name,
        rm_name: row.rm_name,
        status_type: 'paid'
      });
    }
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

  return (
    <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="pb-3 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-red-600" />
          <CardTitle className="text-xl text-red-900">Collection Velocity Analysis</CardTitle>
        </div>
        <CardDescription className="text-red-700">
          Track speed of collections and identify fastest performing branches and RMs
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <div className="rounded-lg border border-gray-200 overflow-x-auto shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/80">
                <SortableHeader field="branch_name" className="min-w-[100px]">Branch</SortableHeader>
                <SortableHeader field="rm_name" className="min-w-[100px]">RM</SortableHeader>
                <SortableHeader field="fastCollections" className="w-20 text-center">Fast (≤3d)</SortableHeader>
                <TableHead className="w-20 text-center">Medium (4-7d)</TableHead>
                <TableHead className="w-20 text-center">Slow (&gt;7d)</TableHead>
                <SortableHeader field="avgCollectionDays" className="w-24 text-center">Avg Days</SortableHeader>
                <SortableHeader field="velocityScore" className="w-24 text-center">Velocity Score</SortableHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((row, index) => (
                <TableRow key={`${row.branch_name}-${row.rm_name}`} className="hover:bg-gray-50/50">
                  <TableCell className="py-3 font-medium">
                    <div className="space-y-1">
                      <div className="truncate max-w-[100px]" title={row.branch_name}>
                        {row.branch_name}
                      </div>
                      {index < 3 && (
                        <div>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            index === 0 ? 'bg-green-100 text-green-800' :
                            index === 1 ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            #{index + 1} Fastest
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="truncate max-w-[100px]" title={row.rm_name}>
                      {row.rm_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-center py-3">
                    <button 
                      onClick={() => handleCellClick(row, 'fast')}
                      className="text-green-600 font-medium hover:bg-green-50 px-2 py-1 rounded"
                    >
                      {row.fastCollections}
                    </button>
                  </TableCell>
                  <TableCell className="text-center py-3">
                    <button 
                      onClick={() => handleCellClick(row, 'medium')}
                      className="text-yellow-600 hover:bg-yellow-50 px-2 py-1 rounded"
                    >
                      {row.mediumCollections}
                    </button>
                  </TableCell>
                  <TableCell className="text-center py-3">
                    <button 
                      onClick={() => handleCellClick(row, 'slow')}
                      className="text-red-600 hover:bg-red-50 px-2 py-1 rounded"
                    >
                      {row.slowCollections}
                    </button>
                  </TableCell>
                  <TableCell className="text-center py-3">
                    <span className={`px-2 py-1 rounded-full font-medium ${
                      row.avgCollectionDays <= 3 ? 'bg-green-100 text-green-800' :
                      row.avgCollectionDays <= 5 ? 'bg-yellow-100 text-yellow-800' :
                      row.avgCollectionDays <= 7 ? 'bg-orange-100 text-orange-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {row.avgCollectionDays.toFixed(1)}d
                    </span>
                  </TableCell>
                  <TableCell className="text-center py-3">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`px-3 py-1.5 rounded-full font-medium ${
                        row.velocityScore >= 200 ? 'bg-green-100 text-green-800' :
                        row.velocityScore >= 150 ? 'bg-yellow-100 text-yellow-800' :
                        row.velocityScore >= 100 ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {row.velocityScore.toFixed(0)}
                      </span>
                      {row.velocityScore >= 200 && <TrendingUp className="h-3 w-3 text-green-600" />}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {sortedData.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-500">No velocity data available</p>
            <p className="text-gray-400">Complete some collections to see velocity analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CollectionVelocityTable;
