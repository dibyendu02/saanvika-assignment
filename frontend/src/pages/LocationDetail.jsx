import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLocationById } from '../api/location';
import { useToast } from '../hooks/use-toast';
import { format } from 'date-fns';
import { ArrowLeft, MapPin, User, Calendar, MessageSquare } from 'lucide-react';
import MapView from '../components/MapView';

export default function LocationDetail() {
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const { id } = useParams();
    const { toast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        fetchLocationDetail();
    }, [id]);

    const fetchLocationDetail = async () => {
        try {
            setLoading(true);
            const response = await getLocationById(id);

            if (response.success) {
                setLocation(response.data.location);
            }
        } catch (error) {
            console.error('Error fetching location detail:', error);
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to fetch location details',
                variant: 'destructive',
            });

            // If unauthorized or not found, redirect back
            if (error.response?.status === 403 || error.response?.status === 404) {
                setTimeout(() => navigate('/locations'), 2000);
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        try {
            return format(new Date(dateString), 'MMMM dd, yyyy HH:mm:ss');
        } catch {
            return dateString;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading location details...</p>
            </div>
        );
    }

    if (!location) {
        return (
            <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Location not found</p>
                <button
                    onClick={() => navigate('/locations')}
                    className="mt-4 text-primary-600 hover:text-primary-800 font-medium"
                >
                    Back to Locations
                </button>
            </div>
        );
    }

    const latitude = location.location?.coordinates?.[1];
    const longitude = location.location?.coordinates?.[0];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 md:gap-4">
                <button
                    onClick={() => navigate('/locations')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                    <ArrowLeft className="h-5 w-5 md:h-6 md:w-6 text-gray-600" />
                </button>
                <div className="min-w-0">
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">
                        Location Details
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5 truncate">
                        Shared location on map
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Map Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow p-4">
                        <h2 className="text-lg font-semibold mb-4">Location on Map</h2>
                        <MapView
                            latitude={latitude}
                            longitude={longitude}
                            employeeName={location.userId?.name || 'Unknown'}
                            timestamp={formatDate(location.sharedAt)}
                            reason={location.reason}
                            className="h-72 md:h-[500px] rounded-md overflow-hidden"
                        />
                    </div>
                </div>

                {/* Details Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow p-6 space-y-6">
                        <h2 className="text-lg font-semibold border-b pb-2">Information</h2>

                        {/* Employee Info */}
                        <div className="space-y-2">
                            <div className="flex items-start gap-3">
                                <User className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Employee</p>
                                    <p className="font-medium">{location.userId?.name || 'Unknown'}</p>
                                    <p className="text-sm text-gray-600">{location.userId?.email || ''}</p>
                                </div>
                            </div>
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                            <p className="text-sm text-gray-500">Role</p>
                            <span className="px-3 py-1 inline-flex text-sm font-semibold rounded-full bg-primary-50 text-primary-700">
                                {location.userId?.role || 'N/A'}
                            </span>
                        </div>

                        {/* Timestamp */}
                        <div className="space-y-2">
                            <div className="flex items-start gap-3">
                                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Shared At</p>
                                    <p className="font-medium">{formatDate(location.sharedAt)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Coordinates */}
                        <div className="space-y-2">
                            <div className="flex items-start gap-3">
                                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-sm text-gray-500">Coordinates</p>
                                    <p className="font-mono text-sm">
                                        Lat: {latitude?.toFixed(6)}<br />
                                        Lng: {longitude?.toFixed(6)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Reason */}
                        {location.reason && (
                            <div className="space-y-2">
                                <div className="flex items-start gap-3">
                                    <MessageSquare className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-gray-500">Reason</p>
                                        <p className="italic text-gray-700">"{location.reason}"</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Office Info */}
                        {location.officeId && (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-500">Office</p>
                                <p className="font-medium">{location.officeId.name || 'N/A'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
