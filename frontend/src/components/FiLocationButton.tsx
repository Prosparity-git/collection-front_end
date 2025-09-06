
import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMapLocation } from "@/utils/formatters";
import { toast } from "sonner";

interface FiLocationButtonProps {
  fiLocation?: string;
}

const FiLocationButton = ({ fiLocation }: FiLocationButtonProps) => {
  const handleOpenMap = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const mapUrl = formatMapLocation(fiLocation);
    if (mapUrl) {
      window.open(mapUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('No location available');
    }
  };

  if (!fiLocation) return null;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleOpenMap}
      className="flex items-center gap-2"
    >
      <MapPin className="h-4 w-4" />
      View FI Location on Map
    </Button>
  );
};

export default FiLocationButton;
