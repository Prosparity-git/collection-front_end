
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';

interface SortableTableHeaderProps {
  label: string;
  field: string;
  onSort: (field: string) => void;
  className?: string;
  currentSort?: { field: string; direction: 'asc' | 'desc' };
}

const SortableTableHeader = ({ 
  label, 
  field, 
  onSort, 
  className = "",
  currentSort 
}: SortableTableHeaderProps) => {
  const getSortIcon = () => {
    if (currentSort?.field === field) {
      return currentSort.direction === 'asc' ? 
        <ArrowUp className="h-3 w-3" /> : 
        <ArrowDown className="h-3 w-3" />;
    }
    return <ArrowUpDown className="h-3 w-3" />;
  };

  return (
    <TableHead className={`font-medium text-sm ${className}`}>
      <button
        onClick={() => onSort(field)}
        className="flex items-center gap-1 hover:text-blue-600 transition-colors mx-auto"
      >
        {label}
        {getSortIcon()}
      </button>
    </TableHead>
  );
};

export default SortableTableHeader;
