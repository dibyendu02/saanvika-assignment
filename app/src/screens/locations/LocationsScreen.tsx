/**
 * Locations Screen
 * Display shared location records with pagination
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    Alert,
    Linking,
    Platform,
    PermissionsAndroid,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useAuth } from '../../context/AuthContext';
import { locationApi, LocationRecord } from '../../api/location';
import officesApi from '../../api/offices';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { showToast } from '../../utils/toast';
import { Dropdown } from '../../components/ui/Dropdown';
import { COLORS, TYPOGRAPHY, SPACING, ICON_SIZES } from '../../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native';

export const LocationsScreen: React.FC = () => {
    const { user } = useAuth();
    const [locations, setLocations] = useState<LocationRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sharing, setSharing] = useState(false);
    const [offices, setOffices] = useState<any[]>([]);
    const [filterOfficeId, setFilterOfficeId] = useState('all');
    const [showOfficeFilter, setShowOfficeFilter] = useState(false);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
    });

    const canShareLocation = ['internal', 'external'].includes(user?.role || '');
    const isSuperAdmin = user?.role === 'super_admin';

    const fetchLocations = useCallback(async () => {
        try {
            const data = await locationApi.getLocations({
                page: pagination.currentPage,
                limit: 10,
                officeId: filterOfficeId !== 'all' ? filterOfficeId : undefined,
            });
            setLocations(data.records);
            setPagination({
                currentPage: data.currentPage,
                totalPages: data.totalPages,
                totalRecords: data.totalRecords,
            });
        } catch (error) {
            console.error('Error fetching locations:', error);
            showToast.error('Error', 'Failed to load locations');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [pagination.currentPage, filterOfficeId]);

    const fetchOffices = useCallback(async () => {
        try {
            const data = await officesApi.getAll();
            setOffices(data);
        } catch (error) {
            console.error('Error fetching offices:', error);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchLocations();
            if (isSuperAdmin) {
                fetchOffices();
            }
        }, [fetchLocations, fetchOffices, isSuperAdmin])
    );

    const onRefresh = () => {
        setRefreshing(true);
        setPagination({ ...pagination, currentPage: 1 });
        fetchLocations();
    };

    const requestLocationPermission = async () => {
        if (Platform.OS === 'ios') {
            Geolocation.requestAuthorization();
            return true;
        }

        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: 'Location Permission',
                    message: 'This app needs access to your location to share it.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn(err);
            return false;
        }
    };

    const handleShareLocation = () => {
        Alert.alert(
            'Share Location',
            'This will share your current location. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Share',
                    onPress: async () => {
                        const hasPermission = await requestLocationPermission();
                        if (!hasPermission) {
                            showToast.error('Error', 'Location permission denied');
                            return;
                        }

                        setSharing(true);
                        Geolocation.setRNConfiguration({
                            skipPermissionRequests: false,
                            authorizationLevel: 'whenInUse',
                        });

                        Geolocation.getCurrentPosition(
                            async (position) => {
                                const { latitude, longitude } = position.coords;
                                console.log('Location:', latitude, longitude);

                                try {
                                    await locationApi.shareLocation({
                                        latitude,
                                        longitude,
                                        reason: 'Shared from mobile app',
                                    });
                                    showToast.success('Success', 'Location shared successfully');
                                    setPagination({ ...pagination, currentPage: 1 });
                                    fetchLocations();
                                } catch (error: any) {
                                    console.error('API Error:', error);
                                    showToast.error('Error', error.response?.data?.message || 'Failed to share location');
                                } finally {
                                    setSharing(false);
                                }
                            },
                            (error) => {
                                console.error('Error getting location:', error);
                                let errorMessage = 'Failed to get current location';
                                if (error.code === 1) errorMessage = 'Location permission denied';
                                if (error.code === 2) errorMessage = 'Location provider unavailable';
                                if (error.code === 3) errorMessage = 'Location request timed out';

                                showToast.error('Error', errorMessage);
                                setSharing(false);
                            },
                            {
                                enableHighAccuracy: false,
                                timeout: 30000,
                                maximumAge: 10000
                            }
                        );
                    },
                },
            ]
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleViewOnMap = (location: LocationRecord) => {
        const [longitude, latitude] = location.location?.coordinates || [];

        if (!latitude || !longitude) {
            showToast.error('Error', 'Invalid location coordinates');
            return;
        }

        const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${latitude},${longitude}`;
        const label = location.userId?.name || 'User Location';
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`,
        });

        if (url) {
            Linking.openURL(url).catch((err) => {
                console.error('Error opening map:', err);
                showToast.error('Error', 'Could not open map');
            });
        }
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= pagination.totalPages) {
            setPagination({ ...pagination, currentPage: page });
        }
    };

    const renderLocationCard = ({ item }: { item: LocationRecord }) => {
        const [longitude, latitude] = item.location?.coordinates || [];

        return (
            <Card style={styles.locationCard}>
                {/* User Info */}
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <Icon name="account" size={ICON_SIZES.md} color={COLORS.primary} />
                    </View>
                    <View style={styles.userDetails}>
                        <Text style={styles.userName}>{item.userId?.name || 'Unknown'}</Text>
                        <Text style={styles.userEmail}>{item.userId?.email || ''}</Text>
                        <View style={styles.roleBadge}>
                            <Text style={styles.roleText}>
                                {item.userId?.role?.toUpperCase() || 'N/A'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Location Details */}
                <View style={styles.locationDetails}>
                    <View style={styles.detailRow}>
                        <Icon name="clock-outline" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.detailText}>{formatDate(item.sharedAt)}</Text>
                    </View>
                    {item.reason && (
                        <View style={styles.detailRow}>
                            <Icon name="information-outline" size={16} color={COLORS.textSecondary} />
                            <Text style={styles.detailText} numberOfLines={2}>
                                "{item.reason}"
                            </Text>
                        </View>
                    )}
                </View>

                {/* Coordinates */}
                <View style={styles.coordinates}>
                    <View style={styles.coordinateItem}>
                        <Text style={styles.coordinateLabel}>Latitude</Text>
                        <Text style={styles.coordinateValue}>
                            {latitude ? Number(latitude).toFixed(6) : 'N/A'}
                        </Text>
                    </View>
                    <View style={styles.coordinateItem}>
                        <Text style={styles.coordinateLabel}>Longitude</Text>
                        <Text style={styles.coordinateValue}>
                            {longitude ? Number(longitude).toFixed(6) : 'N/A'}
                        </Text>
                    </View>
                </View>

                {/* View on Map Button */}
                <Button
                    variant="outline"
                    size="sm"
                    onPress={() => handleViewOnMap(item)}
                    style={styles.viewButton}
                >
                    <Icon name="map-marker" size={16} color={COLORS.primary} />
                    <Text style={styles.viewButtonText}>View on Map</Text>
                </Button>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>Shared Locations</Text>
                    <Text style={styles.subtitle}>View location sharing records</Text>
                </View>
                <View style={styles.headerActions}>
                    {isSuperAdmin && offices.length > 0 && (
                        <TouchableOpacity
                            style={styles.filterButton}
                            onPress={() => setShowOfficeFilter(!showOfficeFilter)}
                        >
                            <Icon name="filter-variant" size={ICON_SIZES.sm} color={COLORS.primary} />
                        </TouchableOpacity>
                    )}
                    {canShareLocation && (
                        <TouchableOpacity
                            style={styles.shareButton}
                            onPress={handleShareLocation}
                            disabled={sharing}
                        >
                            {sharing ? (
                                <ActivityIndicator size="small" color={COLORS.textWhite} />
                            ) : (
                                <Icon name="map-marker-plus" size={ICON_SIZES.sm} color={COLORS.textWhite} />
                            )}
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Office Filter */}
            {showOfficeFilter && isSuperAdmin && (
                <View style={styles.filterContainer}>
                    <Dropdown
                        placeholder="Filter by Office"
                        options={[
                            { label: 'All Offices', value: 'all' },
                            ...offices.map(office => ({ label: office.name, value: office._id }))
                        ]}
                        value={filterOfficeId}
                        onSelect={setFilterOfficeId}
                    />
                </View>
            )}

            {/* Content */}
            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading locations...</Text>
                </View>
            ) : (
                <FlatList
                    data={locations}
                    renderItem={renderLocationCard}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={[
                        styles.listContent,
                        locations.length === 0 && { flex: 1, justifyContent: 'center' }
                    ]}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="map-marker-outline" size={64} color={COLORS.textLight} />
                            <Text style={styles.emptyTitle}>No Location Records</Text>
                            <Text style={styles.emptyText}>
                                {canShareLocation
                                    ? 'Share your location to get started'
                                    : 'No location records found'}
                            </Text>
                        </View>
                    }
                    ListFooterComponent={
                        pagination.totalPages > 1 ? (
                            <View style={styles.pagination}>
                                <Text style={styles.paginationText}>
                                    Page {pagination.currentPage} of {pagination.totalPages}
                                </Text>
                                <View style={styles.paginationButtons}>
                                    <TouchableOpacity
                                        style={[
                                            styles.paginationButton,
                                            pagination.currentPage === 1 && styles.paginationButtonDisabled,
                                        ]}
                                        onPress={() => handlePageChange(pagination.currentPage - 1)}
                                        disabled={pagination.currentPage === 1}
                                    >
                                        <Icon
                                            name="chevron-left"
                                            size={20}
                                            color={
                                                pagination.currentPage === 1
                                                    ? COLORS.textLight
                                                    : COLORS.primary
                                            }
                                        />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.paginationButton,
                                            pagination.currentPage === pagination.totalPages &&
                                            styles.paginationButtonDisabled,
                                        ]}
                                        onPress={() => handlePageChange(pagination.currentPage + 1)}
                                        disabled={pagination.currentPage === pagination.totalPages}
                                    >
                                        <Icon
                                            name="chevron-right"
                                            size={20}
                                            color={
                                                pagination.currentPage === pagination.totalPages
                                                    ? COLORS.textLight
                                                    : COLORS.primary
                                            }
                                        />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ) : null
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.base,
        paddingTop: SPACING['4xl'],
        paddingBottom: SPACING.base,
        backgroundColor: COLORS.backgroundLight,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize['2xl'],
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    headerActions: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    filterButton: {
        padding: SPACING.sm,
        borderRadius: SPACING.sm,
        backgroundColor: COLORS.primaryLight + '20',
    },
    shareButton: {
        padding: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: SPACING.sm,
        backgroundColor: COLORS.primary,
    },
    filterContainer: {
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.backgroundLight,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    filterChip: {
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.sm,
        borderRadius: SPACING.lg,
        backgroundColor: COLORS.background,
        marginRight: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterChipText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    filterChipTextActive: {
        color: COLORS.textWhite,
    },
    listContent: {
        padding: SPACING.base,
    },
    locationCard: {
        marginBottom: SPACING.base,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.primaryLight + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
    },
    userEmail: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    roleBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: SPACING.sm,
        backgroundColor: COLORS.primaryLight + '20',
        marginTop: SPACING.xs,
    },
    roleText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
    },
    locationDetails: {
        marginBottom: SPACING.md,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        marginBottom: SPACING.xs,
    },
    detailText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        flex: 1,
    },
    coordinates: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: SPACING.md,
        padding: SPACING.md,
        backgroundColor: COLORS.background,
        borderRadius: SPACING.sm,
    },
    coordinateItem: {
        alignItems: 'center',
    },
    coordinateLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
        marginBottom: SPACING.xs,
    },
    coordinateValue: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
        fontFamily: 'monospace',
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
    },
    viewButtonText: {
        color: COLORS.primary,
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.base,
        backgroundColor: COLORS.backgroundLight,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    paginationText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    paginationButtons: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    paginationButton: {
        padding: SPACING.sm,
        borderRadius: SPACING.sm,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    paginationButtonDisabled: {
        opacity: 0.5,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.md,
    },
    loadingText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    emptyTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
        marginTop: SPACING.base,
        marginBottom: SPACING.sm,
    },
    emptyText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});

export default LocationsScreen;
