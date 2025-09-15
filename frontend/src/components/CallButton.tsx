
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPhoneLink } from "@/utils/formatters";

interface CallButtonProps {
  name: string;
  phone?: string;
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "default";
  className?: string;
}

const CallButton = ({ name, phone, variant = "ghost", size = "sm", className = "" }: CallButtonProps) => {
  if (!phone) return null;

  const phoneLink = formatPhoneLink(phone);
  if (!phoneLink) return null;

  return (
    <Button
      variant={variant}
      size={size}
      className={`gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 ${className}`}
      asChild
    >
      <a href={phoneLink}>
        <Phone className="h-3 w-3" />
        <span className="text-xs">{name}</span>
      </a>
    </Button>
  );
};

export default CallButton;
