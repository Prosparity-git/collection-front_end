
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

interface PaymentStatusTableProps {
  applications: Application[];
}

const PaymentStatusTable = ({ applications }: PaymentStatusTableProps) => {
  const { paymentStatusData } = useAnalyticsData(applications);

  const totals = paymentStatusData.reduce(
    (acc, row) => ({
      unpaid: acc.unpaid + row.unpaid,
      partially_paid: acc.partially_paid + row.partially_paid,
      paid_pending_approval: acc.paid_pending_approval + row.paid_pending_approval,
      paid: acc.paid + row.paid,
      others: acc.others + row.others,
      total: acc.total + row.total,
    }),
    { unpaid: 0, partially_paid: 0, paid_pending_approval: 0, paid: 0, others: 0, total: 0 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Status by RM and Branch</CardTitle>
        <CardDescription>
          Breakdown of applications by payment status across different RMs and branches
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">RM / Collection RM</TableHead>
                <TableHead className="font-medium">Branch</TableHead>
                <TableHead className="font-medium text-center">Unpaid</TableHead>
                <TableHead className="font-medium text-center">Partially Paid</TableHead>
                <TableHead className="font-medium text-center">Paid (Pending Approval)</TableHead>
                <TableHead className="font-medium text-center">Paid</TableHead>
                <TableHead className="font-medium text-center">Others</TableHead>
                <TableHead className="font-medium text-center">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentStatusData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{row.rm_name}</TableCell>
                  <TableCell>{row.branch_name}</TableCell>
                  <TableCell className="text-center">{row.unpaid}</TableCell>
                  <TableCell className="text-center">{row.partially_paid}</TableCell>
                  <TableCell className="text-center">{row.paid_pending_approval}</TableCell>
                  <TableCell className="text-center">{row.paid}</TableCell>
                  <TableCell className="text-center">{row.others}</TableCell>
                  <TableCell className="text-center font-medium">{row.total}</TableCell>
                </TableRow>
              ))}
              {paymentStatusData.length > 0 && (
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={2} className="font-bold">Total</TableCell>
                  <TableCell className="text-center font-bold">{totals.unpaid}</TableCell>
                  <TableCell className="text-center font-bold">{totals.partially_paid}</TableCell>
                  <TableCell className="text-center font-bold">{totals.paid_pending_approval}</TableCell>
                  <TableCell className="text-center font-bold">{totals.paid}</TableCell>
                  <TableCell className="text-center font-bold">{totals.others}</TableCell>
                  <TableCell className="text-center font-bold">{totals.total}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        
        {paymentStatusData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No data available for payment status analysis
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentStatusTable;
