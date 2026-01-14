import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon issue in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to recenter map when coordinates change
function RecenterMap({ lat, lng }) {
    const map = useMap();

    useEffect(() => {
        if (lat && lng) {
            map.setView([lat, lng], 15);
        }
    }, [lat, lng, map]);

    return null;
}

/**
 * MapView Component
 * Displays a single location marker on an interactive map
 * 
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @param {string} employeeName - Name of the employee
 * @param {string} timestamp - When location was shared
 * @param {string} reason - Optional reason for sharing location
 * @param {string} className - Optional CSS classes
 */
export default function MapView({
    latitude,
    longitude,
    employeeName,
    timestamp,
    reason,
    className = ''
}) {
    // Default center (fallback if no coordinates provided)
    const center = [latitude || 0, longitude || 0];
    const zoom = 15;

    if (!latitude || !longitude) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}>
                <p className="text-gray-500">No location data available</p>
            </div>
        );
    }

    return (
        <div className={className}>
            <MapContainer
                center={center}
                zoom={zoom}
                style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={center}>
                    <Popup>
                        <div className="text-sm">
                            <p className="font-semibold">{employeeName}</p>
                            <p className="text-gray-600 text-xs mt-1">{timestamp}</p>
                            {reason && (
                                <p className="text-gray-700 mt-2 italic">"{reason}"</p>
                            )}
                        </div>
                    </Popup>
                </Marker>
                <RecenterMap lat={latitude} lng={longitude} />
            </MapContainer>
        </div>
    );
}
