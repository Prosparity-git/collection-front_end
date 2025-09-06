
import { Application } from '@/types/application';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PTPStatusTableProps {
  applications: Application[];
}

const PTPStatusTable = ({ applications }: PTPStatusTableProps) => {
  const { ptpStatusData } = useAnalyticsData(applications);

  const totals = ptpStatusData.reduce(
    (acc, row) => ({
      overdue: acc.overdue + row.overdue,
      today: acc.today + row.today,
      tomorrow: acc.tomorrow + row.tomorrow,
      future: acc.future + row.future,
      no_ptp_set: acc.no_ptp_set + row.no_ptp_set,
      total: acc.total + row.total,
    }),
    { overdue: 0, today: 0, tomorrow: 0, future: 0, no_ptp_set: 0, total: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>PTP Status by RM and Branch</CardTitle>
        <CardDescription>
          PTP date analysis for unpaid applications (excludes fully paid cases)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">RM / Collection RM</TableHead>
                <TableHead className="font-medium">Branch</TableHead>
                <TableHead className="font-medium text-center">Overdue</TableHead>
                <TableHead className="font-medium text-center">Today</TableHead>
                <TableHead className="font-medium text-center">Tomorrow</TableHead>
                <TableHead className="font-medium text-center">Future</TableHead>
                <TableHead className="font-medium text-center">No PTP Set</TableHead>
                <TableHead className="font-medium text-center">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ptpStatusData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{row.rm_name}</TableCell>
                  <TableCell>{row.branch_name}</TableCell>
                  <TableCell className="text-center text-red-600">{row.overdue}</TableCell>
                  <TableCell className="text-center text-blue-600">{row.today}</TableCell>
                  <TableCell className="text-center text-orange-600">{row.tomorrow}</TableCell>
                  <TableCell className="text-center text-green-600">{row.future}</TableCell>
                  <TableCell className="text-center text-gray-600">{row.no_ptp_set}</TableCell>
                  <TableCell className="text-center font-medium">{row.total}</TableCell>
                </TableRow>
              ))}
              {ptpStatusData.length > 0 && (
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={2} className="font-bold">Total</TableCell>
                  <TableCell className="text-center font-bold text-red-600">{totals.overdue}</TableCell>
                  <TableCell className="text-center font-bold text-blue-600">{totals.today}</TableCell>
                  <TableCell className="text-center font-bold text-orange-600">{totals.tomorrow}</TableCell>
                  <TableCell className="text-center font-bold text-green-600">{totals.future}</TableCell>
                  <TableCell className="text-center font-bold text-gray-600">{totals.no_ptp_set}</TableCell>
                  <TableCell className="text-center font-bold">{totals.total}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {ptpStatusData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No data available for PTP status analysis
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PTPStatusTable;
