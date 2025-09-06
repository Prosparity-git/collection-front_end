import { MapPin, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FiLocationDisplayProps {
  fiLocation: string | null;
}

const FiLocationDisplay = ({ fiLocation }: FiLocationDisplayProps) => {
  // Parse FI location to extract coordinates
  const parseLocation = (location: string | null) => {
    if (!location || location.trim() === '') {
      return null;
    }

    // Remove "FI_PENDING_" prefix if present
    const cleanLocation = location.replace(/^FI_PENDING_/i, '');
    
    // Try to parse coordinates (expecting format like "lat,lng" or "lat lng")
    const coordMatch = cleanLocation.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
    
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      
      // Validate coordinates
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }
    
    return null;
  };

  const coordinates = parseLocation(fiLocation);

  if (!coordinates) {
    return null;
  }

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const openInMaps = () => {
    const mapsUrl = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-600" />
          Field Investigation Location
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Coordinates</p>
              <p className="text-xs text-gray-600 font-mono">
                {formatCoordinates(coordinates.lat, coordinates.lng)}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={openInMaps}
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              View on Map
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FiLocationDisplay;
