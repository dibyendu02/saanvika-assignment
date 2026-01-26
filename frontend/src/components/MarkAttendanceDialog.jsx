import { useState, useEffect } from 'react';
import { markAttendance } from '../api/attendance';
import { useToast } from '../hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { UserCheck, Loader2, AlertCircle, MapPin } from 'lucide-react';
import MapView from './MapView';

export default function MarkAttendanceDialog({ trigger, onSuccess }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [coordinates, setCoordinates] = useState(null);
    const [locationError, setLocationError] = useState(null);
    const { toast } = useToast();

    // Auto-capture location when dialog opens
    useEffect(() => {
        if (open && !coordinates && !gettingLocation) {
            getCurrentLocation();
        }
    }, [open]);

    const getCurrentLocation = () => {
        setGettingLocation(true);
        setLocationError(null);

        if (!navigator.geolocation) {
            const errorMsg = 'Geolocation is not supported by your browser';
            setLocationError(errorMsg);
            toast({
                title: 'Error',
                description: errorMsg,
                variant: 'destructive',
            });
            setGettingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoordinates({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setGettingLocation(false);
                setLocationError(null);
            },
            (error) => {
                console.error('Error getting location:', error);
                let errorMessage = 'Failed to get your location';

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location permission denied. Please enable location access.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out.';
                        break;
                }

                setLocationError(errorMessage);
                toast({
                    title: 'Error',
                    description: errorMessage,
                    variant: 'destructive',
                });
                setGettingLocation(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            }
        );
    };

    const handleMarkAttendance = async () => {
        if (!coordinates) {
            toast({
                title: 'Error',
                description: 'Location not available. Please try again.',
                variant: 'destructive',
            });
            return;
        }

        try {
            setLoading(true);
            await markAttendance({
                longitude: coordinates.longitude,
                latitude: coordinates.latitude,
            });

            toast({
                title: 'Success',
                description: 'Attendance marked successfully',
            });

            // Reset form
            setCoordinates(null);
            setLocationError(null);
            setOpen(false);

            // Call success callback if provided
            if (onSuccess) {
                onSuccess();
            }
        } catch (error) {
            console.error('Error marking attendance:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to mark attendance',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (newOpen) => {
        if (!loading && !gettingLocation) {
            setOpen(newOpen);
            if (!newOpen) {
                // Reset form when closing
                setCoordinates(null);
                setLocationError(null);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <UserCheck className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Mark Attendance</span>
                        <span className="md:hidden">Mark</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Mark Attendance</DialogTitle>
                    <DialogDescription>
                        Your location will be captured to mark attendance for today
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 p-4">
                    {/* Map Preview or Loading State */}
                    <div className="space-y-2">
                        <Label>Current Location</Label>
                        {gettingLocation ? (
                            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary-600 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">Capturing your location...</p>
                                </div>
                            </div>
                        ) : locationError ? (
                            <div className="h-64 bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
                                <div className="text-center px-4">
                                    <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                                    <p className="text-sm text-red-700 mb-3">{locationError}</p>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={getCurrentLocation}
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            </div>
                        ) : coordinates ? (
                            <>
                                <MapView
                                    latitude={coordinates.latitude}
                                    longitude={coordinates.longitude}
                                    employeeName="Your Location"
                                    timestamp="Now"
                                    className="h-64"
                                />
                                <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    Lat: {coordinates.latitude.toFixed(6)}, Lng: {coordinates.longitude.toFixed(6)}
                                </div>
                            </>
                        ) : (
                            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                                <p className="text-sm text-gray-500">No location data</p>
                            </div>
                        )}
                    </div>

                    {/* Info Message */}
                    <div className="bg-primary-50 border border-primary-100 rounded-lg p-3">
                        <p className="text-sm text-primary-800">
                            <strong>Note:</strong> Your attendance will be marked for today with your current location.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleOpenChange(false)}
                            disabled={loading || gettingLocation}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="flex-1"
                            onClick={handleMarkAttendance}
                            disabled={loading || gettingLocation || !coordinates}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Marking...
                                </>
                            ) : (
                                <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Mark Attendance
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
