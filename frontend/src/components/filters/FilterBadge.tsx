
import { Badge } from "@/components/ui/badge";

interface FilterBadgeProps {
  count: number;
}

const FilterBadge = ({ count }: FilterBadgeProps) => {
  if (count === 0) return null;
  
  return (
    <Badge variant="secondary" className="ml-1">
      {count}
    </Badge>
  );
};

export default FilterBadge;
