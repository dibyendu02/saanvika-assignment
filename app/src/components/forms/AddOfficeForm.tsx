/**
 * Add Office Form Component
 * Modal form for creating new offices
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { showToast } from '../../utils/toast';
import { officesApi } from '../../api/offices';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LocationService from '../../services/LocationService';

const leafletHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { margin: 0; padding: 0; }
        #map { width: 100%; height: 100vh; }
        .center-marker {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -100%);
            z-index: 1000;
            pointer-events: none;
            width: 40px;
            height: 40px;
            background-image: url('https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png');
            background-repeat: no-repeat;
            background-position: center bottom;
        }
        .locate-btn {
            position: absolute;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            background: white;
            border-radius: 50%;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div id="map"></div>
    <div class="center-marker"></div>
    <div class="locate-btn" onclick="locateUser()">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
            <circle cx="12" cy="10" r="3"/>
        </svg>
    </div>
    <script>
        var map = L.map('map').setView([12.9716, 77.5946], 16);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        function updatePosition() {
            var center = map.getCenter();
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'positionUpdate',
                lat: center.lat,
                lng: center.lng
            }));
        }

        function locateUser() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'locateMe'
            }));
        }

        function centerMap(lat, lng) {
            map.setView([lat, lng], 18);
        }

        map.on('moveend', updatePosition);
        setTimeout(updatePosition, 500);
    </script>
</body>
</html>
`;

interface AddOfficeFormProps {
    isVisible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}


const AddOfficeForm: React.FC<AddOfficeFormProps> = ({
    isVisible,
    onClose,
    onSuccess,
}) => {
    const [loading, setLoading] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        officeId: '',
        targetHeadcount: '',
        latitude: '',
        longitude: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [selectedMapLocation, setSelectedMapLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [locating, setLocating] = useState(false);
    const webViewRef = React.useRef<WebView>(null);

    const handleLocateMe = async () => {
        try {
            setLocating(true);
            const hasPermission = await LocationService.requestPermission();
            if (!hasPermission) {
                showToast.error('Permission Denied', 'Please enable location access to find your current position.');
                return;
            }

            const coords = await LocationService.getCurrentPosition(false);
            if (webViewRef.current) {
                const js = `centerMap(${coords.latitude}, ${coords.longitude})`;
                webViewRef.current.injectJavaScript(js);
            }
        } catch (error) {
            console.error('Error locating user:', error);
            showToast.error('Error', 'Failed to get your current location.');
        } finally {
            setLocating(false);
        }
    };

    const onMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'locateMe') {
                handleLocateMe();
            } else if (data.type === 'positionUpdate') {
                setSelectedMapLocation({ lat: data.lat, lng: data.lng });
            } else {
                // Fallback for old message format if any
                setSelectedMapLocation({ lat: data.lat, lng: data.lng });
            }
        } catch (e) {
            console.error('Error parsing map message', e);
        }
    };

    React.useEffect(() => {
        if (showMapPicker) {
            // Small delay to ensure WebView is ready
            const timer = setTimeout(() => {
                handleLocateMe();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [showMapPicker]);

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Office name is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.officeId.trim()) newErrors.officeId = 'Office ID is required';
        if (!formData.targetHeadcount || parseInt(formData.targetHeadcount) < 0) {
            newErrors.targetHeadcount = 'Valid target headcount is required';
        }
        if (!formData.latitude || isNaN(parseFloat(formData.latitude))) {
            newErrors.latitude = 'Valid latitude is required';
        }
        if (!formData.longitude || isNaN(parseFloat(formData.longitude))) {
            newErrors.longitude = 'Valid longitude is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleMapSelect = () => {
        if (selectedMapLocation) {
            setFormData(prev => ({
                ...prev,
                latitude: selectedMapLocation.lat.toFixed(6),
                longitude: selectedMapLocation.lng.toFixed(6),
            }));
            setShowMapPicker(false);
            showToast.success('Location Selected', 'Coordinates updated from map');
        } else {
            // Default if no movement
            setFormData(prev => ({
                ...prev,
                latitude: '12.9716',
                longitude: '77.5946',
            }));
            setShowMapPicker(false);
        }
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await officesApi.create({
                name: formData.name.trim(),
                address: formData.address.trim(),
                officeId: formData.officeId.trim(),
                targetHeadcount: parseInt(formData.targetHeadcount),
                location: {
                    type: 'Point',
                    coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
                },
            });

            showToast.success('Success', 'Office created successfully');
            resetForm();
            onSuccess();
            onClose();
        } catch (error: any) {
            showToast.error('Error', error.response?.data?.message || 'Failed to create office');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            address: '',
            officeId: '',
            targetHeadcount: '',
            latitude: '',
            longitude: '',
        });
        setErrors({});
    };

    return (
        <>
            <Modal
                visible={isVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={onClose}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.header}>
                            <View style={styles.headerLeft}>
                                <Icon name="office-building" size={24} color={COLORS.primary} />
                                <Text style={styles.title}>Add New Office</Text>
                            </View>
                            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                <Icon name="close" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                            <Input
                                label="Office Name"
                                value={formData.name}
                                onChangeText={(text) => {
                                    setFormData({ ...formData, name: text });
                                    if (errors.name) setErrors({ ...errors, name: '' });
                                }}
                                placeholder="e.g., Main Office"
                                error={errors.name}
                            />

                            <Input
                                label="Office ID"
                                value={formData.officeId}
                                onChangeText={(text) => {
                                    setFormData({ ...formData, officeId: text });
                                    if (errors.officeId) setErrors({ ...errors, officeId: '' });
                                }}
                                placeholder="e.g., OFF001"
                                error={errors.officeId}
                            />

                            <Input
                                label="Address"
                                value={formData.address}
                                onChangeText={(text) => {
                                    setFormData({ ...formData, address: text });
                                    if (errors.address) setErrors({ ...errors, address: '' });
                                }}
                                placeholder="Full address"
                                multiline
                                error={errors.address}
                            />

                            <Input
                                label="Target Headcount"
                                value={formData.targetHeadcount}
                                onChangeText={(text) => {
                                    setFormData({ ...formData, targetHeadcount: text });
                                    if (errors.targetHeadcount) setErrors({ ...errors, targetHeadcount: '' });
                                }}
                                placeholder="e.g., 50"
                                keyboardType="numeric"
                                error={errors.targetHeadcount}
                            />

                            <TouchableOpacity
                                style={styles.mapButton}
                                onPress={() => setShowMapPicker(true)}
                            >
                                <Icon name="map-marker-radius" size={24} color={COLORS.primary} />
                                <Text style={styles.mapButtonText}>Pick Location on Map</Text>
                                <Icon name="chevron-right" size={20} color={COLORS.textLight} style={{ marginLeft: 'auto' }} />
                            </TouchableOpacity>

                            <View style={styles.row}>
                                <View style={styles.halfWidth}>
                                    <Input
                                        label="Latitude"
                                        value={formData.latitude}
                                        onChangeText={(text) => {
                                            setFormData({ ...formData, latitude: text });
                                            if (errors.latitude) setErrors({ ...errors, latitude: '' });
                                        }}
                                        placeholder="12.9716"
                                        keyboardType="decimal-pad"
                                        error={errors.latitude}
                                    />
                                </View>
                                <View style={styles.halfWidth}>
                                    <Input
                                        label="Longitude"
                                        value={formData.longitude}
                                        onChangeText={(text) => {
                                            setFormData({ ...formData, longitude: text });
                                            if (errors.longitude) setErrors({ ...errors, longitude: '' });
                                        }}
                                        placeholder="77.5946"
                                        keyboardType="decimal-pad"
                                        error={errors.longitude}
                                    />
                                </View>
                            </View>

                            <View style={styles.buttonContainer}>
                                <Button
                                    title="Cancel"
                                    onPress={onClose}
                                    variant="outline"
                                    style={styles.button}
                                />
                                <Button
                                    title="Create Office"
                                    onPress={handleSubmit}
                                    loading={loading}
                                    style={styles.button}
                                />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
            {/* Map Picker Modal */}
            <Modal
                visible={showMapPicker}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setShowMapPicker(false)}
            >
                <View style={styles.mapContainer}>
                    <View style={styles.mapHeader}>
                        <TouchableOpacity onPress={() => setShowMapPicker(false)} style={styles.closeButton}>
                            <Icon name="arrow-left" size={24} color={COLORS.textPrimary} />
                        </TouchableOpacity>
                        <Text style={styles.title}>Select Location</Text>
                        <View style={{ width: 40 }} />
                    </View>

                    <View style={{ flex: 1 }}>
                        <WebView
                            ref={webViewRef}
                            originWhitelist={['*']}
                            source={{ html: leafletHtml }}
                            onMessage={onMessage}
                            style={{ flex: 1 }}
                            geolocationEnabled={true}
                        />
                        {locating && (
                            <View style={styles.locatingOverlay}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                                <Text style={styles.locatingText}>Locating...</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.mapFooter}>
                        <Button
                            title="Confirm Location"
                            onPress={handleMapSelect}
                        />
                    </View>
                </View>
            </Modal>

        </>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.backgroundLight,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    closeButton: {
        padding: SPACING.xs,
    },
    content: {
        padding: SPACING.base,
    },
    row: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    halfWidth: {
        flex: 1,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.xl,
        marginBottom: SPACING['2xl'],
    },
    button: {
        flex: 1,
    },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: SPACING.md,
        marginTop: SPACING.md,
        marginBottom: SPACING.md,
        gap: SPACING.sm,
    },
    mapButtonText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textPrimary,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    mapContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    mapHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.backgroundLight,
        elevation: 2,
        zIndex: 10,
    },
    mapPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.backgroundDark,
    },
    mapPlaceholderText: {
        fontSize: TYPOGRAPHY.fontSize['2xl'],
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textSecondary,
        marginTop: SPACING.md,
    },
    mapPlaceholderSubtext: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textLight,
        marginTop: SPACING.xs,
    },
    centerPin: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -24,
        marginTop: -48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapFooter: {
        padding: SPACING.base,
        backgroundColor: COLORS.backgroundLight,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    locatingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    locatingText: {
        marginTop: SPACING.sm,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
});

export default AddOfficeForm;
