/**
 * Location Requests Screen
 * Display and manage location requests
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
    Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { locationApi, LocationRequest } from '../../api/location';
import officesApi from '../../api/offices';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { showToast } from '../../utils/toast';
import { COLORS, TYPOGRAPHY, SPACING, ICON_SIZES } from '../../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const LocationRequestsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<LocationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [responding, setResponding] = useState<string | null>(null);
    const [offices, setOffices] = useState<any[]>([]);
    const [filterOfficeId, setFilterOfficeId] = useState('all');
    const [showOfficeFilter, setShowOfficeFilter] = useState(false);

    const isExternal = user?.role === 'external';
    const isSuperAdmin = user?.role === 'super_admin';

    useEffect(() => {
        fetchRequests();
        if (isSuperAdmin) {
            fetchOffices();
        }
    }, [filterOfficeId]);

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
            setLoading(false);
            setRefreshing(false);
        }
    }, [filterOfficeId]);

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
                        setResponding(requestId);
                        try {
                            await locationApi.denyLocationRequest(requestId);
                            showToast.success('Success', 'Request denied');
                            fetchRequests();
                        } catch (error: any) {
                            showToast.error('Error', error.response?.data?.message || 'Failed to deny request');
                        } finally {
                            setResponding(null);
                        }
                    },
                },
            ]
        );
    };

    const handleShareLocation = (requestId: string) => {
        // Navigate to a location sharing screen or show modal
        // For now, we'll just show a toast
        showToast.info('Share Location', 'This will open location sharing interface');
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
                {isExternal && isPending && (
                    <View style={styles.actions}>
                        <Button
                            variant="primary"
                            size="sm"
                            onPress={() => handleShareLocation(item._id)}
                            style={styles.actionButton}
                        >
                            <Icon name="map-marker" size={16} color={COLORS.textWhite} />
                            <Text style={styles.buttonText}>Share Location</Text>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onPress={() => handleDeny(item._id)}
                            disabled={responding === item._id}
                            style={styles.actionButton}
                        >
                            {responding === item._id ? (
                                <ActivityIndicator size="small" color={COLORS.danger} />
                            ) : (
                                <>
                                    <Icon name="close" size={16} color={COLORS.danger} />
                                    <Text style={[styles.buttonText, { color: COLORS.danger }]}>Deny</Text>
                                </>
                            )}
                        </Button>
                    </View>
                )}

                {!isExternal && isPending && (
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
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity
                            style={[
                                styles.filterChip,
                                filterOfficeId === 'all' && styles.filterChipActive,
                            ]}
                            onPress={() => setFilterOfficeId('all')}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    filterOfficeId === 'all' && styles.filterChipTextActive,
                                ]}
                            >
                                All Offices
                            </Text>
                        </TouchableOpacity>
                        {offices.map((office) => (
                            <TouchableOpacity
                                key={office._id}
                                style={[
                                    styles.filterChip,
                                    filterOfficeId === office._id && styles.filterChipActive,
                                ]}
                                onPress={() => setFilterOfficeId(office._id)}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        filterOfficeId === office._id && styles.filterChipTextActive,
                                    ]}
                                >
                                    {office.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading requests...</Text>
                </View>
            ) : requests.length === 0 ? (
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
