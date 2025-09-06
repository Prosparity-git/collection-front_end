
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Application } from '@/types/application';
import { useBranchPaymentData, type BranchPaymentStatus } from '@/hooks/useBranchPaymentData';
import ClickableTableCell from './shared/ClickableTableCell';
import { DrillDownFilter } from '@/pages/Analytics';

interface BranchPaymentStatusTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

const BranchPaymentStatusTable = ({ applications, onDrillDown }: BranchPaymentStatusTableProps) => {
  const [selectedEmiMonth, setSelectedEmiMonth] = useState<string>('Jul-25');
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  
  const { data: branchPaymentData, loading, error } = useBranchPaymentData(
    applications, 
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

  const handleCellClick = (branchName: string, rmName: string | undefined, statusType: string) => {
    onDrillDown({
      branch_name: branchName,
      rm_name: rmName,
      status_type: statusType,
      selectedEmiMonth: selectedEmiMonth
    });
  };

  const totals = branchPaymentData.reduce(
    (acc, branch) => ({
      unpaid: acc.unpaid + branch.total_stats.unpaid,
      partially_paid: acc.partially_paid + branch.total_stats.partially_paid,
      paid_pending_approval: acc.paid_pending_approval + branch.total_stats.paid_pending_approval,
      paid: acc.paid + branch.total_stats.paid,
      others: acc.others + branch.total_stats.others,
      total: acc.total + branch.total_stats.total,
    }),
    { unpaid: 0, partially_paid: 0, paid_pending_approval: 0, paid: 0, others: 0, total: 0 }
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Branch Payment Status Analysis</CardTitle>
          <CardDescription>
            Payment status breakdown by branch and collection RM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-100 border-t-blue-600"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-300 animate-ping"></div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-base font-medium text-gray-700 animate-pulse">Loading payment data...</p>
              <p className="text-sm text-gray-500 mt-1">Analyzing branch performance metrics</p>
            </div>
            <div className="mt-4 w-48 bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Branch Payment Status Analysis</CardTitle>
          <CardDescription>
            Payment status breakdown by branch and collection RM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            <p className="text-lg font-medium">Error loading payment data</p>
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
            <CardTitle>Branch Payment Status Analysis</CardTitle>
            <CardDescription>
              Payment status breakdown by branch and collection RM for {selectedEmiMonth}
            </CardDescription>
          </div>
          <div className="flex gap-4 items-center">
            <Select value={selectedEmiMonth} onValueChange={setSelectedEmiMonth}>
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
        {branchPaymentData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No payment data available for the selected month
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium w-8"></TableHead>
                  <TableHead className="font-medium w-48">Branch / RM</TableHead>
                  <TableHead className="font-medium text-center w-20">Unpaid</TableHead>
                  <TableHead className="font-medium text-center w-24">Partially Paid</TableHead>
                  <TableHead className="font-medium text-center w-20">Paid (Pending)</TableHead>
                  <TableHead className="font-medium text-center w-16">Paid</TableHead>
                  <TableHead className="font-medium text-center w-20">Others</TableHead>
                  <TableHead className="font-medium text-center w-16">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {branchPaymentData.map((branch) => (
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
                        value={branch.total_stats.unpaid}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'unpaid')}
                        className="text-red-600 font-medium"
                      />
                      <ClickableTableCell
                        value={branch.total_stats.partially_paid}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'partially_paid')}
                        className="text-orange-600 font-medium"
                      />
                      <ClickableTableCell
                        value={branch.total_stats.paid_pending_approval}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'paid_pending_approval')}
                        className="text-yellow-600 font-medium"
                      />
                      <ClickableTableCell
                        value={branch.total_stats.paid}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'paid')}
                        className="text-green-600 font-medium"
                      />
                      <ClickableTableCell
                        value={branch.total_stats.others}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'others')}
                        className="text-gray-600 font-medium"
                      />
                      <ClickableTableCell
                        value={branch.total_stats.total}
                        onClick={() => handleCellClick(branch.branch_name, undefined, 'total')}
                        className="text-blue-600 font-bold"
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
                          value={rm.unpaid}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'unpaid')}
                          className="text-red-600"
                        />
                        <ClickableTableCell
                          value={rm.partially_paid}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'partially_paid')}
                          className="text-orange-600"
                        />
                        <ClickableTableCell
                          value={rm.paid_pending_approval}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'paid_pending_approval')}
                          className="text-yellow-600"
                        />
                        <ClickableTableCell
                          value={rm.paid}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'paid')}
                          className="text-green-600"
                        />
                        <ClickableTableCell
                          value={rm.others}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'others')}
                          className="text-gray-600"
                        />
                        <ClickableTableCell
                          value={rm.total}
                          onClick={() => handleCellClick(branch.branch_name, rm.rm_name, 'total')}
                          className="text-blue-600 font-medium"
                        />
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
                {branchPaymentData.length > 0 && (
                  <TableRow className="bg-primary/10 font-bold">
                    <TableCell></TableCell>
                    <TableCell className="font-bold text-sm">Grand Total</TableCell>
                    <ClickableTableCell
                      value={totals.unpaid}
                      onClick={() => handleCellClick('', undefined, 'unpaid')}
                      className="text-red-600 font-bold"
                    />
                    <ClickableTableCell
                      value={totals.partially_paid}
                      onClick={() => handleCellClick('', undefined, 'partially_paid')}
                      className="text-orange-600 font-bold"
                    />
                    <ClickableTableCell
                      value={totals.paid_pending_approval}
                      onClick={() => handleCellClick('', undefined, 'paid_pending_approval')}
                      className="text-yellow-600 font-bold"
                    />
                    <ClickableTableCell
                      value={totals.paid}
                      onClick={() => handleCellClick('', undefined, 'paid')}
                      className="text-green-600 font-bold"
                    />
                    <ClickableTableCell
                      value={totals.others}
                      onClick={() => handleCellClick('', undefined, 'others')}
                      className="text-gray-600 font-bold"
                    />
                    <ClickableTableCell
                      value={totals.total}
                      onClick={() => handleCellClick('', undefined, 'total')}
                      className="text-blue-600 font-bold"
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

export default BranchPaymentStatusTable;
