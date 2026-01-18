/**
 * Location Map Picker Component
 * Interactive map for selecting office location with click-to-select and draggable marker
 */
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix for default marker icon in bundlers
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Component to recenter map
function RecenterMap({ center }) {
    const map = useMap();

    useEffect(() => {
        if (center) {
            map.flyTo(center, 13, {
                duration: 1.5
            });
        }
    }, [center, map]);

    return null;
}

// Component to handle map clicks and marker dragging
function LocationMarker({ position, onPositionChange }) {
    const map = useMapEvents({
        click(e) {
            onPositionChange(e.latlng.lat, e.latlng.lng);
        },
    });

    return position ? (
        <Marker
            position={position}
            draggable={true}
            eventHandlers={{
                dragend: (e) => {
                    const marker = e.target;
                    const position = marker.getLatLng();
                    onPositionChange(position.lat, position.lng);
                },
            }}
        />
    ) : null;
}

const LocationMapPicker = ({ latitude, longitude, onLocationChange, address }) => {
    // Default center: India (if no coordinates provided)
    const defaultCenter = [20.5937, 78.9629];

    const [position, setPosition] = useState([
        latitude || defaultCenter[0],
        longitude || defaultCenter[1]
    ]);

    const [mapCenter, setMapCenter] = useState(null);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [hasAutoFetched, setHasAutoFetched] = useState(false);

    // Auto-fetch current location on mount if no coordinates provided
    useEffect(() => {
        if (!latitude && !longitude && !hasAutoFetched) {
            setHasAutoFetched(true);
            if (navigator.geolocation) {
                setIsGettingLocation(true);
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        setPosition([latitude, longitude]);
                        setMapCenter([latitude, longitude]);
                        onLocationChange(latitude, longitude);
                        setIsGettingLocation(false);
                    },
                    (error) => {
                        console.log('Could not get current location, using default:', error.message);
                        setIsGettingLocation(false);
                    }
                );
            }
        }
    }, [latitude, longitude, hasAutoFetched, onLocationChange]);

    useEffect(() => {
        if (latitude && longitude) {
            setPosition([latitude, longitude]);
        }
    }, [latitude, longitude]);

    const handlePositionChange = (lat, lng) => {
        setPosition([lat, lng]);
        onLocationChange(lat, lng);
    };

    const getCurrentLocation = () => {
        if (navigator.geolocation) {
            setIsGettingLocation(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    handlePositionChange(latitude, longitude);
                    setMapCenter([latitude, longitude]); // Trigger map re-center
                    setIsGettingLocation(false);
                },
                (error) => {
                    console.error('Error getting location:', error);
                    alert('Unable to get your location. Please check your browser permissions.');
                    setIsGettingLocation(false);
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    };

    return (
        <div className="space-y-3">
            {/* Map Container */}
            <div className="relative">
                <MapContainer
                    center={position}
                    zoom={13}
                    className="h-[200px] w-full rounded-lg border border-gray-300 z-0"
                    style={{ zIndex: 0 }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker
                        position={position}
                        onPositionChange={handlePositionChange}
                    />
                    <RecenterMap center={mapCenter} />
                </MapContainer>
            </div>

            {/* Controls and Coordinates Display */}
            <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="font-medium">Lat:</span>
                        <span className="font-mono">{position[0].toFixed(6)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="font-medium">Lng:</span>
                        <span className="font-mono">{position[1].toFixed(6)}</span>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    {isGettingLocation ? 'Getting Location...' : 'Use My Location'}
                </button>
            </div>

            {/* Instructions */}
            <p className="text-xs text-gray-500 flex items-start gap-1">
                <span className="text-blue-600 font-medium">💡 Tip:</span>
                <span>Click anywhere on the map to set the location, or drag the marker to adjust.</span>
            </p>
        </div>
    );
};

export default LocationMapPicker;
