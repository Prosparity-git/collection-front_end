
import { ChevronRight, ChevronDown } from 'lucide-react';

interface ExpandableRowProps {
  isExpanded: boolean;
  onToggle: () => void;
  label: string;
}

const ExpandableRow = ({ isExpanded, onToggle, label }: ExpandableRowProps) => {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-2 hover:text-blue-600 transition-colors"
    >
      {isExpanded ? (
        <ChevronDown className="h-4 w-4" />
      ) : (
        <ChevronRight className="h-4 w-4" />
      )}
      {label}
    </button>
  );
};

export default ExpandableRow;
