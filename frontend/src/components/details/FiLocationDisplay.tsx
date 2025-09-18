import { MapPin, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FiLocationDisplayProps {
  fiLocation?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
}

const FiLocationDisplay = ({ fiLocation, latitude, longitude, address }: FiLocationDisplayProps) => {
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

  // Get coordinates from either direct props or parsed fiLocation
  const getCoordinates = () => {
    // First try to use direct latitude/longitude props
    if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
      // Validate coordinates
      if (!isNaN(latitude) && !isNaN(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
        return { lat: latitude, lng: longitude };
      }
    }
    
    // Fallback to parsing fiLocation
    return parseLocation(fiLocation);
  };

  const coordinates = getCoordinates();

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
          {/* Address Section */}
          {address && (
            <div>
              <p className="text-sm font-medium text-gray-700">Address</p>
              <p className="text-xs text-gray-600">
                {address}
              </p>
            </div>
          )}
          
          {/* Coordinates Section */}
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
