
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

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up to parent elements
    window.location.href = phoneLink; // Navigate to phone link
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={`gap-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 ${className}`}
      onClick={handleClick}
    >
      <Phone className="h-3 w-3" />
      <span className="text-xs">{name}</span>
    </Button>
  );
};

export default CallButton;
