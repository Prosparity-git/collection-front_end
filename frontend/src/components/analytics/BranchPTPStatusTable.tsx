
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { startOfDay } from 'date-fns';
import { Application } from '@/types/application';
import { useBranchPTPData, type BranchPTPStatus } from '@/hooks/useBranchPTPData';
import ClickableTableCell from './shared/ClickableTableCell';
import { DrillDownFilter } from '@/pages/Analytics';
import { categorizePtpDate } from '@/utils/ptpDateUtils';

interface BranchPTPStatusTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
  batchData?: any;
  selectedEmiMonth?: string;
  onMonthChange?: (month: string) => void;
}

const BranchPTPStatusTable = ({ 
  applications, 
  onDrillDown, 
  batchData, 
  selectedEmiMonth: propSelectedEmiMonth,
  onMonthChange 
}: BranchPTPStatusTableProps) => {
  const [localSelectedEmiMonth, setLocalSelectedEmiMonth] = useState<string>('Jul-25');
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  
  // Use prop or local state for selected month
  const selectedEmiMonth = propSelectedEmiMonth || localSelectedEmiMonth;
  
  // Use preloaded batch data when available, fallback to hook for backwards compatibility
  const shouldUseBatchData = batchData && Object.keys(batchData).length > 0;
  
  console.log('[BranchPTPStatusTable] Using batch data:', shouldUseBatchData, 'Batch data keys:', Object.keys(batchData || {}));
  
  const { data: hookBranchPtpData, loading: hookLoading, error: hookError } = useBranchPTPData(
    shouldUseBatchData ? [] : applications, // Pass empty array when using batch data to skip processing
    selectedEmiMonth
  );

  const toggleBranchExpansion = (branchName: string) => {
    const newExpanded = new Set(expandedBranches);
    if (newExpanded.has(branchName)) {
      newExpanded.delete(branchName);
    } else {
      newExpanded.add(branchName);
    }
    setExpandedBranches(newExpanded);
  };

  const availableMonths = ['Jun-25', 'Jul-25'];

  const handleCellClick = (branchName: string, rmName: string | undefined, ptpCriteria: string) => {
    onDrillDown({
      branch_name: branchName,
      rm_name: rmName,
      status_type: 'total', // For PTP we use total as base
      ptp_criteria: ptpCriteria,
      selectedEmiMonth: selectedEmiMonth
    });
  };

  // Process batch data into BranchPTPStatus format when available
  const processedBranchPtpData = useMemo(() => {
    if (!shouldUseBatchData) {
      return hookBranchPtpData;
    }

    console.log('[BranchPTPStatusTable] Processing batch data for PTP analysis');
    console.log('[BranchPTPStatusTable] Selected EMI Month:', selectedEmiMonth);
    
    // Filter applications by demand_date matching selectedEmiMonth first
    const filteredApplications = applications.filter(app => {
      if (!app.demand_date) return false;
      
      try {
        const demandDate = new Date(app.demand_date);
        const monthYear = demandDate.toLocaleString('en-US', { month: 'short', year: '2-digit' });
        const formattedMonth = `${monthYear.slice(0, 3)}-${monthYear.slice(-2)}`;
        return formattedMonth === selectedEmiMonth;
      } catch (error) {
        console.error('Error parsing demand_date:', app.demand_date, error);
        return false;
      }
    });

    console.log(`[BranchPTPStatusTable] Filtered ${filteredApplications.length} applications for ${selectedEmiMonth}`);
    
    // Enrich applications with batch data
    const enrichedApplications = filteredApplications.map(app => {
      const enriched = {
        ...app,
        ptp_date: batchData.ptpDates?.[app.applicant_id] || null,
        field_status: batchData.statuses?.[app.applicant_id] || app.lms_status
      };
      
      // Log enrichment details for debugging
      if (batchData.statuses?.[app.applicant_id]) {
        console.log(`[BranchPTPStatusTable] Enriched ${app.applicant_id}: field_status=${enriched.field_status}, ptp_date=${enriched.ptp_date}`);
      }
      
      return enriched;
    });

    console.log('[BranchPTPStatusTable] Enriched applications sample:', enrichedApplications.slice(0, 3));

    // Group by branch and process PTP status
    const branchGroups = enrichedApplications.reduce((acc, app) => {
      const branch = app.branch_name;
      const rm = app.collection_rm || app.rm_name;
      
      if (!acc[branch]) {
        acc[branch] = {};
      }
      if (!acc[branch][rm]) {
        acc[branch][rm] = [];
      }
      acc[branch][rm].push(app);
      return acc;
    }, {} as Record<string, Record<string, Application[]>>);

    const result: BranchPTPStatus[] = Object.entries(branchGroups).map(([branchName, rmGroups]) => {
      const rmStats = Object.entries(rmGroups).map(([rmName, apps]) => {
        console.log(`[BranchPTPStatusTable] Processing RM: ${rmName}, Apps: ${apps.length}`);
        
        // Filter out applications with 'Paid' field_status for this specific month
        const nonPaidApps = apps.filter(app => {
          const isPaid = app.field_status === 'Paid';
          if (isPaid) {
            console.log(`[BranchPTPStatusTable] Excluding paid app: ${app.applicant_id}, Status: ${app.field_status}`);
          }
          return !isPaid;
        });
        
        console.log(`[BranchPTPStatusTable] Non-paid apps for ${rmName}: ${nonPaidApps.length}/${apps.length}`);
        
        // Calculate PTP statistics using the utility function for consistency
        const categorizedApps = {
          overdue: [] as any[],
          today: [] as any[],
          tomorrow: [] as any[],
          future: [] as any[],
          no_date: [] as any[]
        };
        
        nonPaidApps.forEach(app => {
          const category = categorizePtpDate(app.ptp_date);
          categorizedApps[category].push(app);
        });

        const overdueApps = categorizedApps.overdue;
        const todayApps = categorizedApps.today;
        const tomorrowApps = categorizedApps.tomorrow;
        const futureApps = categorizedApps.future;
        const noPtpApps = categorizedApps.no_date;

        const stats = {
          rm_name: rmName,
          branch_name: branchName,
          overdue: overdueApps.length,
          today: todayApps.length,
          tomorrow: tomorrowApps.length,
          future: futureApps.length,
          no_ptp_set: noPtpApps.length,
          total: nonPaidApps.length
        };

        console.log(`[BranchPTPStatusTable] ${rmName} PTP stats:`, stats);

        return stats;
      });

      const totalStats = {
        rm_name: 'Total',
        branch_name: branchName,
        overdue: rmStats.reduce((acc, rm) => acc + rm.overdue, 0),
        today: rmStats.reduce((acc, rm) => acc + rm.today, 0),
        tomorrow: rmStats.reduce((acc, rm) => acc + rm.tomorrow, 0),
        future: rmStats.reduce((acc, rm) => acc + rm.future, 0),
        no_ptp_set: rmStats.reduce((acc, rm) => acc + rm.no_ptp_set, 0),
        total: rmStats.reduce((acc, rm) => acc + rm.total, 0)
      };

      return {
        branch_name: branchName,
        total_stats: totalStats,
        rm_stats: rmStats
      };
    });

    console.log('[BranchPTPStatusTable] Processed branch PTP data:', result);
    return result;
  }, [shouldUseBatchData, applications, batchData, hookBranchPtpData, selectedEmiMonth]);

  const branchPtpData = processedBranchPtpData;
  const loading = shouldUseBatchData ? false : hookLoading;
  const error = shouldUseBatchData ? null : hookError;

  const totals = branchPtpData.reduce(
    (acc, branch) => ({
      overdue: acc.overdue + branch.total_stats.overdue,
      today: acc.today + branch.total_stats.today,
      tomorrow: acc.tomorrow + branch.total_stats.tomorrow,
      future: acc.future + branch.total_stats.future,
      no_ptp_set: acc.no_ptp_set + branch.total_stats.no_ptp_set,
      total: acc.total + branch.total_stats.total,
    }),
    { overdue: 0, today: 0, tomorrow: 0, future: 0, no_ptp_set: 0, total: 0 }
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Branch PTP Status Analysis</CardTitle>
          <CardDescription>
            PTP status breakdown by branch and collection RM (excludes Paid applications)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading PTP data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Branch PTP Status Analysis</CardTitle>
          <CardDescription>
            PTP status breakdown by branch and collection RM (excludes Paid applications)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <p className="text-lg font-medium">Error loading PTP data</p>
            <p className="text-sm">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle>Branch PTP Status Analysis</CardTitle>
            <CardDescription>
              PTP status breakdown by branch and collection RM for {selectedEmiMonth} (excludes Paid applications)
            </CardDescription>
          </div>
          <div className="flex gap-4 items-center">
            <Select 
              value={selectedEmiMonth} 
              onValueChange={(month) => {
                if (onMonthChange) {
                  onMonthChange(month);
                } else {
                  setLocalSelectedEmiMonth(month);
                }
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select EMI Month" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map(month => (
                  <SelectItem key={month} value={month}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {branchPtpData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No PTP data available for the selected month
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium w-8"></TableHead>
                  <TableHead className="font-medium w-48">Branch / RM</TableHead>
                  <TableHead className="font-medium text-center w-20">Overdue</TableHead>
                  <TableHead className="font-medium text-center w-16">Today</TableHead>
                  <TableHead className="font-medium text-center w-20">Tomorrow</TableHead>
                  <TableHead className="font-medium text-center w-16">Future</TableHead>
                  <TableHead className="font-medium text-center w-24">No PTP Set</TableHead>
                  <TableHead className="font-medium text-center w-16">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchPtpData.map((branch) => (
                  <React.Fragment key={branch.branch_name}>
                    <TableRow className="bg-muted/30 font-medium">
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleBranchExpansion(branch.branch_name)}
                          className="h-6 w-6 p-0"
                        >
                          {expandedBranches.has(branch.branch_name) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="font-bold text-sm">{branch.branch_name}</TableCell>
                      <ClickableTableCell
                        value={branch.total_stats.overdue}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'overdue')}
                        className="text-red-600 font-medium"
                      />
                      <ClickableTableCell
                        value={branch.total_stats.today}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'today')}
                        className="text-blue-600 font-medium"
                      />
                      <ClickableTableCell
                        value={branch.total_stats.tomorrow}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'tomorrow')}
                        className="text-orange-600 font-medium"
                      />
                      <ClickableTableCell
                        value={branch.total_stats.future}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'future')}
                        className="text-green-600 font-medium"
                      />
                      <ClickableTableCell
                        value={branch.total_stats.no_ptp_set}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'no_ptp_set')}
                        className="text-gray-600 font-medium"
                      />
                      <ClickableTableCell
                        value={branch.total_stats.total}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'total')}
                        className="text-purple-600 font-bold"
                      />
                    </TableRow>
                    {expandedBranches.has(branch.branch_name) && branch.rm_stats.map((rm) => (
                      <TableRow key={`${branch.branch_name}-${rm.rm_name}`}>
                        <TableCell></TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex items-center pl-4">
                            <span className="mr-2 text-gray-400">├─</span>
                            <span className="font-medium">{rm.rm_name}</span>
                          </div>
                        </TableCell>
                        <ClickableTableCell
                          value={rm.overdue}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'overdue')}
                          className="text-red-600"
                        />
                        <ClickableTableCell
                          value={rm.today}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'today')}
                          className="text-blue-600"
                        />
                        <ClickableTableCell
                          value={rm.tomorrow}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'tomorrow')}
                          className="text-orange-600"
                        />
                        <ClickableTableCell
                          value={rm.future}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'future')}
                          className="text-green-600"
                        />
                        <ClickableTableCell
                          value={rm.no_ptp_set}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'no_ptp_set')}
                          className="text-gray-600"
                        />
                        <ClickableTableCell
                          value={rm.total}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'total')}
                          className="text-purple-600 font-medium"
                        />
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
                {branchPtpData.length > 0 && (
                  <TableRow className="bg-primary/10 font-bold">
                    <TableCell></TableCell>
                    <TableCell className="font-bold text-sm">Grand Total</TableCell>
                    <ClickableTableCell
                      value={totals.overdue}
                      onClick={() => handleCellClick('', undefined, 'overdue')}
                      className="text-red-600 font-bold"
                    />
                    <ClickableTableCell
                      value={totals.today}
                      onClick={() => handleCellClick('', undefined, 'today')}
                      className="text-blue-600 font-bold"
                    />
                    <ClickableTableCell
                      value={totals.tomorrow}
                      onClick={() => handleCellClick('', undefined, 'tomorrow')}
                      className="text-orange-600 font-bold"
                    />
                    <ClickableTableCell
                      value={totals.future}
                      onClick={() => handleCellClick('', undefined, 'future')}
                      className="text-green-600 font-bold"
                    />
                    <ClickableTableCell
                      value={totals.no_ptp_set}
                      onClick={() => handleCellClick('', undefined, 'no_ptp_set')}
                      className="text-gray-600 font-bold"
                    />
                    <ClickableTableCell
                      value={totals.total}
                      onClick={() => handleCellClick('', undefined, 'total')}
                      className="text-purple-600 font-bold"
                    />
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BranchPTPStatusTable;
