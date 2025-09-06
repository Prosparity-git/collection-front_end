
import { TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface ClickableTableCellProps {
  value: number;
  onClick: () => void;
  className?: string;
  colorClass?: string;
}

const ClickableTableCell = ({ value, onClick, className, colorClass }: ClickableTableCellProps) => {
  return (
    <TableCell 
      className={cn(
        "text-center cursor-pointer hover:bg-muted/50 transition-colors",
        colorClass,
        className
      )}
      onClick={onClick}
    >
      {value}
    </TableCell>
  );
};

export default ClickableTableCell;
