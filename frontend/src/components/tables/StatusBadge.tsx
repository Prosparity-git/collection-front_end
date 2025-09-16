
import { Badge } from "@/components/ui/badge";
import { memo } from "react";
import { getStatusLabel, getStatusVariant } from "@/utils/statusMapping";

interface StatusBadgeProps {
  status: string;
}

const StatusBadge = memo(({ status }: StatusBadgeProps) => {
  const displayStatus = getStatusLabel(status);
  const variantClass = getStatusVariant(status);
  
  return (
    <Badge className={`${variantClass} border`}>
      {displayStatus}
    </Badge>
  );
});

StatusBadge.displayName = "StatusBadge";

export default StatusBadge;
