import { useState, useEffect, useCallback } from "react";
import { MapPin, Navigation, ExternalLink, AlertCircle, CheckCircle, Loader2, Map, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Application } from "@/types/application";
import { FieldVisitService, FieldVisitLocation, CreateFieldVisitRequest } from "@/integrations/api/services/fieldVisitService";
import { toast } from "sonner";
import { format } from "date-fns";

interface FieldVisitTabProps {
  application: Application | null;
  paymentId?: number;
  applicationId?: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// Hardcoded visit types based on the data structure
const VISIT_TYPES = [
  { id: 1, type_name: "Customer Visit - House", description: "Visit to customer location" },
  { id: 2, type_name: "Customer Visit - Outside Location", description: "Follow-up visit for payment collection" }
];

// Utility function to round coordinates to meet backend validation requirements
const roundCoordinate = (value: number, maxDigits: number): number => {
  // Calculate decimal places needed to stay within maxDigits
  const integerPart = Math.abs(Math.floor(value));
  const integerDigits = integerPart.toString().length;
  const decimalPlaces = Math.max(0, maxDigits - integerDigits - 1); // -1 for decimal point
  return Number(value.toFixed(Math.min(decimalPlaces, 6))); // Cap at 6 decimal places for practical precision
};

const FieldVisitTab = ({ application, paymentId, applicationId }: FieldVisitTabProps) => {
  const [selectedVisitType, setSelectedVisitType] = useState<number>(1); // Default to Customer Visit
  const [fieldVisits, setFieldVisits] = useState<FieldVisitLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [selectedVisitForMap, setSelectedVisitForMap] = useState<FieldVisitLocation | null>(null);
  const [showMapDialog, setShowMapDialog] = useState(false);

  // Load field visits for this application
  const loadFieldVisits = useCallback(async () => {
    if (!applicationId || !paymentId) {
      console.log('FieldVisitTab: Missing required IDs', { applicationId, paymentId });
      return;
    }

    console.log('FieldVisitTab: Loading field visits with IDs', { 
      loan_application_id: applicationId, 
      payment_details_id: paymentId 
    });

    try {
      setLoading(true);
      const visits = await FieldVisitService.getVisitsByFilter({
        loan_application_id: applicationId,
        payment_details_id: paymentId
      });
      setFieldVisits(visits);
      console.log('FieldVisitTab: Loaded visits', visits);
    } catch (error) {
      console.error('Failed to load field visits:', error);
      setAlert({ type: 'error', message: 'Failed to load field visits' });
    } finally {
      setLoading(false);
    }
  }, [applicationId, paymentId]);

  useEffect(() => {
    loadFieldVisits();
  }, [loadFieldVisits]);

  // Get user's current location
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setAlert({ type: 'error', message: 'Geolocation is not supported by this browser' });
      return;
    }

    setGettingLocation(true);
    setAlert(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const location: LocationData = {
        latitude: roundCoordinate(position.coords.latitude, 10), // Max 10 digits for latitude
        longitude: roundCoordinate(position.coords.longitude, 11), // Max 11 digits for longitude
        accuracy: position.coords.accuracy
      };

      setLocationData(location);
      setAlert({ 
        type: 'success', 
        message: `Location captured! Accuracy: ${Math.round(location.accuracy || 0)}m` 
      });

    } catch (error) {
      console.error('Error getting location:', error);
      let errorMessage = 'Failed to get location';
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
      }
      
      setAlert({ type: 'error', message: errorMessage });
    } finally {
      setGettingLocation(false);
    }
  };

  // Record field visit
  const recordFieldVisit = async () => {
    if (!locationData || !applicationId || !paymentId) {
      setAlert({ type: 'error', message: 'Please get your location first' });
      return;
    }

    try {
      setLoading(true);
      setAlert(null);

      const visitData: CreateFieldVisitRequest = {
        loan_application_id: applicationId,
        payment_details_id: paymentId,
        visit_type_id: selectedVisitType,
        latitude: roundCoordinate(locationData.latitude, 10), // Max 10 digits for latitude
        longitude: roundCoordinate(locationData.longitude, 11) // Max 11 digits for longitude
      };

      const newVisit = await FieldVisitService.createFieldVisit(visitData);
      
      // Add to local state
      setFieldVisits(prev => [newVisit, ...prev]);
      
      setAlert({ 
        type: 'success', 
        message: `Field visit recorded successfully! Visit ID: ${newVisit.id}` 
      });

      toast.success('Field visit recorded successfully!');
      
      // Clear location data after successful recording
      setLocationData(null);

    } catch (error) {
      console.error('Failed to record field visit:', error);
      
      // Parse error message to show user-friendly version
      let errorMessage = 'Failed to record field visit';
      if (error instanceof Error) {
        const errorText = error.message;
        
        // Extract distance from error message (Hindi text)
        const distanceMatch = errorText.match(/दूरी:\s*([\d,]+)\s*मीटर/);
        const statusMatch = errorText.match(/Error creating field visit:\s*\d+:/);
        
        if (distanceMatch) {
          const distance = parseInt(distanceMatch[1].replace(/,/g, ''));
          
          // Show distance in meters if under 1000m, in kilometers if above 1000m
          let distanceText;
          if (distance < 1000) {
            distanceText = `${distance} मीटर`;
          } else {
            const distanceKm = (distance / 1000).toFixed(1);
            distanceText = `${distanceKm} किमी`;
          }
          
          errorMessage = `ग्राहक के घर से बहुत दूर हैं (${distanceText})। कृपया 100 मीटर के दायरे में जाएं।`;
        } else {
          errorMessage = errorText;
        }
      }
      
      setAlert({ type: 'error', message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Open location in maps
  const openInMaps = (latitude: string, longitude: string) => {
    const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  // Show map dialog for a specific visit
  const showMapForVisit = (visit: FieldVisitLocation) => {
    setSelectedVisitForMap(visit);
    setShowMapDialog(true);
  };

  // Map component for displaying location using OpenStreetMap
  const MapView = ({ latitude, longitude, title }: { latitude: string; longitude: string; title?: string }) => {
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(longitude)-0.01},${parseFloat(latitude)-0.01},${parseFloat(longitude)+0.01},${parseFloat(latitude)+0.01}&layer=mapnik&marker=${latitude},${longitude}`;
    
    return (
      <div className="w-full h-full min-h-48 rounded-lg overflow-hidden border">
        <iframe
          src={mapUrl}
          width="100%"
          height="100%"
          style={{ border: 0, minHeight: '192px' }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={title || "Field Visit Location"}
        />
      </div>
    );
  };

  // Format date and time
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return `${format(date, 'dd-MMM-yy')} at ${format(date, 'HH:mm')}`;
    } catch {
      return dateStr;
    }
  };

  // Get visit type name by ID
  const getVisitTypeName = (visitTypeId: number) => {
    const visitType = VISIT_TYPES.find(type => type.id === visitTypeId);
    return visitType?.type_name || `Type ${visitTypeId}`;
  };

  if (!application) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Alert Messages */}
      {alert && (
        <Alert className={alert.type === 'error' ? 'border-red-200 bg-red-50' : 
                          alert.type === 'success' ? 'border-green-200 bg-green-50' : 
                          'border-blue-200 bg-blue-50'}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className={alert.type === 'error' ? 'text-red-800' : 
                                        alert.type === 'success' ? 'text-green-800' : 
                                        'text-blue-800'}>
            {alert.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Field Visit Form */}
      <Card className="mx-0">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="text-sm sm:text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Field Visit (Customer Visit)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-4 sm:px-6">
          <div className="space-y-4">
            {/* Visit Type Selection */}
            <div>
              <Label htmlFor="visitType" className="text-sm font-medium">Visit Type</Label>
              <Select value={selectedVisitType.toString()} onValueChange={(value) => setSelectedVisitType(Number(value))}>
                <SelectTrigger className="w-full h-10">
                  <SelectValue placeholder="Select visit type" />
                </SelectTrigger>
                <SelectContent>
                  {VISIT_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.type_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">Saved in device cookie</p>
            </div>

            {/* Location Status */}
            {locationData && (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Location Captured</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Coordinates: {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                    {locationData.accuracy && ` (Accuracy: ${Math.round(locationData.accuracy)}m)`}
                  </p>
                </div>
                
                {/* Preview Map */}
                <div className="space-y-2">
                  <Label className="text-xs text-gray-600 font-medium">Location Preview</Label>
                  <div className="w-full h-48 sm:h-64">
                    <MapView 
                      latitude={locationData.latitude.toString()} 
                      longitude={locationData.longitude.toString()}
                      title="Current Location"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Get Location Button */}
            <Button 
              onClick={getCurrentLocation}
              disabled={gettingLocation}
              className="w-full bg-blue-600 hover:bg-blue-700 h-11 text-sm sm:text-base"
              size="default"
            >
              {gettingLocation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Getting Location...</span>
                  <span className="sm:hidden">Getting...</span>
                </>
              ) : (
                <>
                  <Navigation className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Get My Location</span>
                  <span className="sm:hidden">Get Location</span>
                </>
              )}
            </Button>

            {/* Record Visit Button */}
            {locationData && (
              <Button 
                onClick={recordFieldVisit}
                disabled={loading}
                className="w-full h-11 text-sm sm:text-base"
                size="default"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Recording Visit...</span>
                    <span className="sm:hidden">Recording...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Record Field Visit</span>
                    <span className="sm:hidden">Record Visit</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Field Visits History */}
      <Card className="mx-0">
        <CardHeader className="pb-3 px-4 sm:px-6">
          <CardTitle className="text-sm sm:text-base">
            Field Visits ({fieldVisits.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-4 sm:px-6">
          {loading && fieldVisits.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-sm text-gray-500">Loading visits...</span>
            </div>
          ) : fieldVisits.length > 0 ? (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {fieldVisits.map((visit) => (
                <div key={visit.id} className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="space-y-3">
                    {/* Visit Info */}
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          #{visit.id}
                        </Badge>
                        <Badge variant="outline" className="text-xs w-fit">
                          {getVisitTypeName(visit.visit_type_id)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Agent:</span>
                        <span className="text-xs text-gray-700 font-medium">{visit.agent_name}</span>
                      </div>
                    </div>
                    
                    {/* Date and Time */}
                    <p className="text-xs text-gray-600">
                      {formatDateTime(visit.created_at)}
                    </p>
                    
                    {/* Coordinates */}
                    <p className="text-xs text-gray-800 font-mono break-all">
                      {visit.latitude}, {visit.longitude}
                    </p>
                    
                    {/* Action Buttons - Stacked on mobile, side-by-side on desktop */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button
                        onClick={() => showMapForVisit(visit)}
                        size="sm"
                        variant="outline"
                        className="flex-1 h-9"
                      >
                        <Map className="h-3 w-3 mr-1" />
                        <span className="text-xs">View Map</span>
                      </Button>
                      <Button
                        onClick={() => openInMaps(visit.latitude, visit.longitude)}
                        size="sm"
                        variant="outline"
                        className="flex-1 h-9"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        <span className="text-xs">External</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-400 italic text-center py-8">
              No field visits recorded yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Map Dialog */}
      <Dialog open={showMapDialog} onOpenChange={setShowMapDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm sm:text-base">
              <MapPin className="h-5 w-5" />
              Field Visit Location Map
            </DialogTitle>
          </DialogHeader>
          {selectedVisitForMap && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm">
                        Visit #{selectedVisitForMap.id} - {getVisitTypeName(selectedVisitForMap.visit_type_id)}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">Agent:</span>
                        <span className="text-xs text-gray-700 font-medium">{selectedVisitForMap.agent_name}</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">
                      {formatDateTime(selectedVisitForMap.created_at)}
                    </p>
                    <p className="text-xs text-gray-800 font-mono break-all">
                      {selectedVisitForMap.latitude}, {selectedVisitForMap.longitude}
                    </p>
                  </div>
                  <Button
                    onClick={() => openInMaps(selectedVisitForMap.latitude, selectedVisitForMap.longitude)}
                    size="sm"
                    variant="outline"
                    className="w-full sm:w-auto h-9"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    <span className="text-xs">Open in Maps</span>
                  </Button>
                </div>
              </div>
              <div className="w-full">
                <MapView 
                  latitude={selectedVisitForMap.latitude} 
                  longitude={selectedVisitForMap.longitude}
                  title={`Field Visit #${selectedVisitForMap.id}`}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FieldVisitTab;
