/**
 * Location Requests Screen
 * Display and manage location requests
 */

import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { locationApi, LocationRequest } from '../../api/location';
import officesApi from '../../api/offices';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { showToast } from '../../utils/toast';
import { Dropdown } from '../../components/ui/Dropdown';
import { COLORS, TYPOGRAPHY, SPACING, ICON_SIZES } from '../../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LocationService from '../../services/LocationService';

export const LocationRequestsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<LocationRequest[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [respondingId, setRespondingId] = useState<string | null>(null);
    const isExternal = user?.role === 'external';
    const isSuperAdmin = user?.role === 'super_admin';
    const isManagement = ['super_admin', 'admin'].includes(user?.role || '');

    const [respondingAction, setRespondingAction] = useState<'share' | 'deny' | 'delete' | null>(null);
    const [offices, setOffices] = useState<any[]>([]);
    const [filterOfficeId, setFilterOfficeId] = useState('all');
    const [showOfficeFilter, setShowOfficeFilter] = useState(false);

    const fetchRequests = useCallback(async () => {
        try {
            const data = await locationApi.getLocationRequests(
                filterOfficeId !== 'all' ? filterOfficeId : undefined
            );
            setRequests(data);
        } catch (error) {
            console.error('Error fetching requests:', error);
            showToast.error('Error', 'Failed to load location requests');
        } finally {
            setRefreshing(false);
        }
    }, [filterOfficeId]);

    useFocusEffect(
        useCallback(() => {
            fetchRequests();
            if (isSuperAdmin) {
                fetchOffices();
            }
            return () => { }; // Optional cleanup
        }, [fetchRequests, isSuperAdmin])
    );

    const fetchOffices = async () => {
        try {
            const data = await officesApi.getAll();
            setOffices(data);
        } catch (error) {
            console.error('Error fetching offices:', error);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchRequests();
    };

    const handleDeny = async (requestId: string) => {
        Alert.alert(
            'Deny Request',
            'Are you sure you want to deny this location request?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Deny',
                    style: 'destructive',
                    onPress: async () => {
                        setRespondingId(requestId);
                        setRespondingAction('deny');
                        try {
                            await locationApi.denyLocationRequest(requestId);
                            showToast.success('Success', 'Request denied');
                            fetchRequests();
                        } catch (error: any) {
                            showToast.error('Error', error.response?.data?.message || 'Failed to deny request');
                        } finally {
                            setRespondingId(null);
                            setRespondingAction(null);
                        }
                    },
                },
            ]
        );
    };

    const handleShareLocation = async (requestId: string) => {
        try {
            setRespondingId(requestId);
            setRespondingAction('share');

            // 1. Request Permission
            const hasPermission = await LocationService.requestPermission();
            if (!hasPermission) {
                showToast.error('Permission Denied', 'Please enable location access to share your location.');
                return;
            }

            // 2. Get Current Position
            showToast.info('Fetching Location', 'Getting your current coordinates...');
            const coords = await LocationService.getCurrentPosition();

            // 3. Share Location with Backend
            await locationApi.shareLocation({
                requestId,
                latitude: coords.latitude,
                longitude: coords.longitude,
                reason: 'Requested by team',
            });

            showToast.success('Success', 'Location shared successfully');
            fetchRequests();
        } catch (error: any) {
            console.error('Error sharing location:', error);
            showToast.error('Error', error.code === 3 ? 'Location request timed out. Please try again or move to an open area.' : (error.response?.data?.message || 'Failed to share location'));
        } finally {
            setRespondingId(null);
            setRespondingAction(null);
        }
    };

    const handleDeleteRequest = async (request: LocationRequest) => {
        Alert.alert(
            user?._id === request.requester._id ? 'Cancel Request' : 'Delete Request',
            'Are you sure you want to perform this action?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: 'destructive',
                    onPress: async () => {
                        setRespondingId(request._id);
                        setRespondingAction('delete');
                        try {
                            await locationApi.deleteLocationRequest(request._id);
                            showToast.success('Success', 'Request deleted');
                            fetchRequests();
                        } catch (error: any) {
                            showToast.error('Error', error.response?.data?.message || 'Failed to delete request');
                        } finally {
                            setRespondingId(null);
                            setRespondingAction(null);
                        }
                    },
                },
            ]
        );
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return COLORS.warning;
            case 'shared':
                return COLORS.success;
            case 'denied':
                return COLORS.danger;
            case 'expired':
                return COLORS.textLight;
            default:
                return COLORS.textSecondary;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return 'clock-outline';
            case 'shared':
                return 'check-circle';
            case 'denied':
                return 'close-circle';
            case 'expired':
                return 'clock-alert-outline';
            default:
                return 'help-circle';
        }
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

    const renderRequestCard = ({ item }: { item: LocationRequest }) => {
        const statusColor = getStatusColor(item.status);
        const statusIcon = getStatusIcon(item.status);
        const isPending = item.status === 'pending';

        return (
            <Card style={styles.requestCard}>
                {/* User Info */}
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <Icon name="account" size={ICON_SIZES.md} color={COLORS.primary} />
                    </View>
                    <View style={styles.userDetails}>
                        <Text style={styles.userName}>
                            {isExternal ? item.requester.name : item.targetUser.name}
                        </Text>
                        <Text style={styles.userEmail}>
                            {isExternal ? item.requester.email : item.targetUser.email}
                        </Text>
                    </View>
                </View>

                {/* Request Details */}
                <View style={styles.requestDetails}>
                    <View style={styles.detailRow}>
                        <Icon name="clock-outline" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.detailText}>
                            Requested {formatDate(item.requestedAt)}
                        </Text>
                    </View>
                    {item.respondedAt && (
                        <View style={styles.detailRow}>
                            <Icon name="check-circle" size={16} color={COLORS.textSecondary} />
                            <Text style={styles.detailText}>
                                Responded {formatDate(item.respondedAt)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Status Badge */}
                <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Icon name={statusIcon} size={14} color={statusColor} />
                        <Text style={[styles.statusText, { color: statusColor }]}>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Text>
                    </View>
                </View>

                {/* Actions */}
                <View style={styles.actions}>
                    {/* External: Share/Deny for Pending */}
                    {isExternal && isPending && (
                        <>
                            <Button
                                variant="primary"
                                size="sm"
                                onPress={() => handleShareLocation(item._id)}
                                disabled={respondingId === item._id}
                                style={styles.actionButton}
                            >
                                {respondingId === item._id && respondingAction === 'share' ? (
                                    <ActivityIndicator size="small" color={COLORS.textWhite} />
                                ) : (
                                    <>
                                        <Icon name="map-marker" size={16} color={COLORS.textWhite} />
                                        <Text style={styles.buttonText}>Share Location</Text>
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onPress={() => handleDeny(item._id)}
                                disabled={respondingId === item._id}
                                style={styles.actionButton}
                            >
                                {respondingId === item._id && respondingAction === 'deny' ? (
                                    <ActivityIndicator size="small" color={COLORS.danger} />
                                ) : (
                                    <>
                                        <Icon name="close" size={16} color={COLORS.danger} />
                                        <Text style={[styles.buttonText, { color: COLORS.danger }]}>Deny</Text>
                                    </>
                                )}
                            </Button>
                        </>
                    )}

                    {/* Non-External: View Location for Shared */}
                    {!isExternal && item.status === 'shared' && item.locationId && (
                        <Button
                            variant="primary"
                            size="sm"
                            onPress={() => {
                                // Extract location data from populated field
                                const locationRecord = item.locationId as any;
                                const coordinates = locationRecord?.location?.coordinates;

                                if (coordinates && coordinates.length === 2) {
                                    const [longitude, latitude] = coordinates;

                                    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
                                    const latLng = `${latitude},${longitude}`;
                                    const label = item.targetUser?.name || 'User Location';
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
                                } else {
                                    showToast.error('Error', 'Location coordinates not available');
                                }
                            }}
                            style={styles.actionButton}
                        >
                            <Icon name="map-marker-radius" size={16} color={COLORS.textWhite} />
                            <Text style={styles.buttonText}>View Location</Text>
                        </Button>
                    )}

                    {/* Delete/Cancel Button */}
                    {(isManagement || item.requester._id === user?._id) && (
                        <Button
                            variant="outline"
                            size="sm"
                            onPress={() => handleDeleteRequest(item)}
                            disabled={respondingId === item._id}
                            style={styles.deleteButton}
                        >
                            {respondingId === item._id && respondingAction === 'delete' ? (
                                <ActivityIndicator size="small" color={COLORS.danger} />
                            ) : (
                                <>
                                    <Icon name="trash-can-outline" size={16} color={COLORS.danger} />
                                    <Text style={[styles.buttonText, { color: COLORS.danger }]}>
                                        {item.status === 'pending' && item.requester._id === user?._id ? 'Cancel Request' : 'Delete'}
                                    </Text>
                                </>
                            )}
                        </Button>
                    )}
                </View>

                {!isExternal && isPending && !((isManagement || item.requester._id === user?._id)) && (
                    <View style={styles.waitingBadge}>
                        <Icon name="clock-outline" size={14} color={COLORS.warning} />
                        <Text style={styles.waitingText}>Waiting for response</Text>
                    </View>
                )}
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Location Requests</Text>
                    <Text style={styles.subtitle}>
                        {isExternal
                            ? 'Manage location requests from your team'
                            : 'Track your location requests'}
                    </Text>
                </View>
                {isSuperAdmin && offices.length > 0 && (
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setShowOfficeFilter(!showOfficeFilter)}
                    >
                        <Icon name="filter-variant" size={ICON_SIZES.sm} color={COLORS.primary} />
                    </TouchableOpacity>
                )}
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
            {requests.length === 0 && !refreshing ? (
                <View style={styles.emptyContainer}>
                    <Icon name="navigation-outline" size={64} color={COLORS.textLight} />
                    <Text style={styles.emptyTitle}>No Requests Found</Text>
                    <Text style={styles.emptyText}>
                        {isExternal
                            ? 'No location requests received'
                            : 'No location requests sent'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={requests}
                    renderItem={renderRequestCard}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
    filterButton: {
        padding: SPACING.sm,
        borderRadius: SPACING.sm,
        backgroundColor: COLORS.primaryLight + '20',
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
    requestCard: {
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
    requestDetails: {
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
    },
    statusContainer: {
        marginBottom: SPACING.md,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: SPACING.lg,
        gap: SPACING.xs,
    },
    statusText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    actions: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
    },
    deleteButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
    },
    fullWidthButton: {
        flex: 1,
    },
    buttonText: {
        color: COLORS.textWhite,
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    waitingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.warningLight,
        borderRadius: SPACING.sm,
    },
    waitingText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.warning,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
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

export default LocationRequestsScreen;
