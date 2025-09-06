
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
import { useState } from 'react';
import { DrillDownFilter } from '@/pages/Analytics';
import { useTableSorting } from '@/hooks/useTableSorting';
import { usePTPEffectivenessData } from '@/hooks/usePTPEffectivenessData';
import SortableTableHeader from './shared/SortableTableHeader';
import ClickableTableCell from './shared/ClickableTableCell';

interface PTPEffectivenessTableProps {
  applications: Application[];
  onDrillDown: (filter: DrillDownFilter) => void;
}

type SortField = 'ptp_date' | 'total_ptps' | 'paid_on_ptp' | 'paid_after_ptp' | 'unpaid_others';

const PTPEffectivenessTable = ({ applications, onDrillDown }: PTPEffectivenessTableProps) => {
  const ptpDateData = usePTPEffectivenessData(applications);
  const { sortField, sortDirection, handleSort, getSortedData } = useTableSorting<SortField>('ptp_date');

  const handleCellClick = (ptpDate: string, statusType: string) => {
    // For PTP date-based drilling, we need to filter by the specific date
    onDrillDown({
      branch_name: '',
      status_type: statusType,
      ptp_criteria: 'date_specific',
      ptp_date: ptpDate
    });
  };

  const getValue = (item: any, field: SortField) => {
    switch (field) {
      case 'ptp_date': return item.ptp_date;
      case 'total_ptps': return item.total_ptps;
      case 'paid_on_ptp': return item.paid_on_ptp;
      case 'paid_after_ptp': return item.paid_after_ptp;
      case 'unpaid_others': return item.unpaid_others;
      default: return 0;
    }
  };

  const sortedData = getSortedData(ptpDateData, getValue);

  const totals = ptpDateData.reduce(
    (acc, dateEntry) => ({
      total_ptps: acc.total_ptps + dateEntry.total_ptps,
      paid_on_ptp: acc.paid_on_ptp + dateEntry.paid_on_ptp,
      paid_after_ptp: acc.paid_after_ptp + dateEntry.paid_after_ptp,
      unpaid_others: acc.unpaid_others + dateEntry.unpaid_others,
    }),
    { total_ptps: 0, paid_on_ptp: 0, paid_after_ptp: 0, unpaid_others: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">PTP Effectiveness by Date</CardTitle>
            <CardDescription className="text-xs">
              Analysis of PTP promise keeping behavior by PTP date
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHeader 
                  label="PTP Date" 
                  field="ptp_date" 
                  onSort={handleSort}
                  className="w-32"
                />
                <SortableTableHeader 
                  label="Total PTPs" 
                  field="total_ptps" 
                  onSort={handleSort}
                  className="text-center w-24"
                />
                <SortableTableHeader 
                  label="Paid on PTP" 
                  field="paid_on_ptp" 
                  onSort={handleSort}
                  className="text-center w-24"
                />
                <SortableTableHeader 
                  label="Paid after PTP" 
                  field="paid_after_ptp" 
                  onSort={handleSort}
                  className="text-center w-24"
                />
                <SortableTableHeader 
                  label="Unpaid and Others" 
                  field="unpaid_others" 
                  onSort={handleSort}
                  className="text-center w-32"
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((dateEntry) => (
                <TableRow key={dateEntry.ptp_date} className="hover:bg-muted/50">
                  <TableCell className="font-medium text-sm">
                    {dateEntry.ptp_date}
                  </TableCell>
                  <ClickableTableCell
                    value={dateEntry.total_ptps}
                    onClick={() => handleCellClick(dateEntry.ptp_date, 'total')}
                  />
                  <ClickableTableCell
                    value={dateEntry.paid_on_ptp}
                    onClick={() => handleCellClick(dateEntry.ptp_date, 'paid')}
                    className="text-green-600"
                  />
                  <ClickableTableCell
                    value={dateEntry.paid_after_ptp}
                    onClick={() => handleCellClick(dateEntry.ptp_date, 'overdue')}
                    className="text-red-600"
                  />
                  <TableCell className="text-center text-sm font-medium">
                    {dateEntry.unpaid_others}
                  </TableCell>
                </TableRow>
              ))}
              
              {ptpDateData.length > 0 && (
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={1} className="font-bold text-sm">Total</TableCell>
                  <TableCell className="text-center font-bold text-sm">{totals.total_ptps}</TableCell>
                  <TableCell className="text-center font-bold text-sm text-green-600">{totals.paid_on_ptp}</TableCell>
                  <TableCell className="text-center font-bold text-sm text-red-600">{totals.paid_after_ptp}</TableCell>
                  <TableCell className="text-center font-bold text-sm">{totals.unpaid_others}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {ptpDateData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No data available for PTP effectiveness analysis</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PTPEffectivenessTable;
