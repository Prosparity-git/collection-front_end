
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

const OptimizedTableHeader = () => {
  return (
    <TableHeader>
      <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50 border-b-2 border-slate-200">
        <TableHead className="font-bold text-slate-800 py-4 px-6">Application Details</TableHead>
        <TableHead className="font-bold text-slate-800 text-center py-4 px-4 whitespace-nowrap">EMI Amount</TableHead>
        <TableHead className="font-bold text-slate-800 text-center py-4 px-4 whitespace-nowrap">Status</TableHead>
        <TableHead className="font-bold text-slate-800 text-center py-4 px-4 whitespace-nowrap">PTP Date</TableHead>
        <TableHead className="font-bold text-slate-800 text-center py-4 px-4 whitespace-nowrap">Calling Status</TableHead>
        <TableHead className="font-bold text-slate-800 py-4 px-4 whitespace-nowrap">Recent Comments</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default OptimizedTableHeader;
