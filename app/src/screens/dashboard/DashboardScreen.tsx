/**
 * Dashboard Screen
 * Main dashboard with stats, targets, and quick actions
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Platform,
    PermissionsAndroid,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/dashboard';
import attendanceApi from '../../api/attendance';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { showToast } from '../../utils/toast';
import { COLORS, TYPOGRAPHY, SPACING, ICON_SIZES } from '../../constants/theme';
import { DashboardStats } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from '@react-native-community/geolocation';
import { useFocusEffect } from '@react-navigation/native';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [markingAttendance, setMarkingAttendance] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            const data = await dashboardApi.getStats();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
            showToast.error('Error', 'Failed to load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchStats();
        }, [fetchStats])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const getRoleDisplay = (role: string): string => {
        return role.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const handleMarkAttendance = async () => {
        try {
            setMarkingAttendance(true);

            // Request location permission on Android
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
                );
                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    showToast.error('Permission Denied', 'Location permission is required to mark attendance');
                    setMarkingAttendance(false);
                    return;
                }
            }

            // Get current location with fallback
            const getLocation = (highAccuracy: boolean) => {
                return new Promise((resolve, reject) => {
                    Geolocation.getCurrentPosition(
                        (position) => resolve(position),
                        (error) => reject(error),
                        {
                            enableHighAccuracy: highAccuracy,
                            timeout: highAccuracy ? 30000 : 60000, // Increased timeout
                            maximumAge: highAccuracy ? 0 : 10000,
                        }
                    );
                });
            };

            try {
                // Try high accuracy first
                const position: any = await getLocation(true);

                await attendanceApi.mark({
                    longitude: position.coords.longitude,
                    latitude: position.coords.latitude,
                });
                showToast.success('Success', 'Attendance marked successfully!');
                fetchStats(); // Refresh stats
            } catch (highAccuracyError: any) {
                // If high accuracy fails, try low accuracy
                if (highAccuracyError.code === 3) { // TIMEOUT
                    try {
                        showToast.info('Retrying', 'Trying with lower accuracy...');
                        const position: any = await getLocation(false);

                        await attendanceApi.mark({
                            longitude: position.coords.longitude,
                            latitude: position.coords.latitude,
                        });
                        showToast.success('Success', 'Attendance marked successfully!');
                        fetchStats(); // Refresh stats
                    } catch (lowAccuracyError: any) {
                        throw lowAccuracyError;
                    }
                } else {
                    throw highAccuracyError;
                }
            }
        } catch (error: any) {
            console.error('Geolocation error:', error);
            if (error.code === 3) {
                showToast.error('Timeout', 'Could not get location. Please ensure GPS is enabled and try again.');
            } else if (error.response?.data?.message) {
                // Extract the main error message from backend
                const errorMessage = error.response.data.message;
                showToast.error('Error', errorMessage);
            } else if (error.message) {
                showToast.error('Error', error.message);
            } else {
                showToast.error('Error', 'Failed to mark attendance. Please try again.');
            }
        } finally {
            setMarkingAttendance(false);
        }
    };

    const isEmployee = ['internal', 'external'].includes(user?.role || '');

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logoPart1}>SAANVIK</Text>
                        <Text style={styles.logoPart2}>A</Text>
                    </View>
                    <Text style={styles.subtitle}>
                        {getRoleDisplay(user?.role || '')} Console
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={() => navigation.navigate('More', { screen: 'Notifications' })}
                >
                    <Icon name="bell-outline" size={ICON_SIZES.md} color={COLORS.textPrimary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Stats Cards */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.statsScroll}
                    contentContainerStyle={styles.statsScrollContent}
                >
                    <TouchableOpacity onPress={() => navigation.navigate('More', { screen: 'Offices' })} activeOpacity={0.9}>
                        <Card style={styles.statCard}>
                            <View style={[styles.statIconContainer, { backgroundColor: COLORS.secondary + '20' }]}>
                                <Icon name="office-building" size={ICON_SIZES.md} color={COLORS.secondary} />
                            </View>
                            <Text style={styles.statValue}>{stats?.totalOffices || 0}</Text>
                            <Text style={styles.statLabel}>Total Offices</Text>
                            <Text style={styles.statSubtext}>{stats?.activeOffices || 0} Active Locations</Text>
                        </Card>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('Attendance')} activeOpacity={0.9}>
                        <Card style={styles.statCard}>
                            <View style={[styles.statIconContainer, { backgroundColor: COLORS.successLight }]}>
                                <Icon name="calendar-check" size={ICON_SIZES.md} color={COLORS.success} />
                            </View>
                            <Text style={styles.statValue}>{stats?.attendanceToday || 0}</Text>
                            <Text style={styles.statLabel}>Attendance Records</Text>
                            <Text style={styles.statSubtext}>Today's attendance</Text>
                        </Card>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate('More', { screen: 'Goodies' })} activeOpacity={0.9}>
                        <Card style={styles.statCard}>
                            <View style={[styles.statIconContainer, { backgroundColor: COLORS.infoLight }]}>
                                <Icon name="gift" size={ICON_SIZES.md} color={COLORS.info} />
                            </View>
                            <Text style={styles.statValue}>{stats?.goodiesManaged || 0}</Text>
                            <Text style={styles.statLabel}>Goodies Managed</Text>
                            <Text style={styles.statSubtext}>Inventory items</Text>
                        </Card>
                    </TouchableOpacity>
                </ScrollView>

                {/* Quick Action for Employees */}
                {isEmployee && (
                    <Card style={styles.quickActionCard}>
                        <View style={styles.quickActionContent}>
                            <View style={styles.quickActionLeft}>
                                <View style={[styles.quickActionIcon, { backgroundColor: COLORS.success + '20' }]}>
                                    <Icon name="calendar-check" size={ICON_SIZES.lg} color={COLORS.success} />
                                </View>
                                <View style={styles.quickActionText}>
                                    <Text style={styles.quickActionTitle}>Mark Today's Attendance</Text>
                                    <Text style={styles.quickActionSubtitle}>Tap to mark your attendance with location</Text>
                                </View>
                            </View>
                            <Button
                                variant="primary"
                                size="sm"
                                onPress={handleMarkAttendance}
                                loading={markingAttendance}
                                disabled={markingAttendance}
                            >
                                <Text style={styles.quickActionButtonText}>
                                    {markingAttendance ? 'Marking...' : 'Mark Now'}
                                </Text>
                            </Button>
                        </View>
                    </Card>
                )}

                {/* Share Location Quick Action - External Employees Only */}
                {user?.role === 'external' && (
                    <Card style={{ ...styles.quickActionCard, backgroundColor: COLORS.infoLight }}>
                        <View style={styles.quickActionContent}>
                            <View style={styles.quickActionLeft}>
                                <View style={[styles.quickActionIcon, { backgroundColor: COLORS.info + '20' }]}>
                                    <Icon name="map-marker-plus" size={ICON_SIZES.lg} color={COLORS.info} />
                                </View>
                                <View style={styles.quickActionText}>
                                    <Text style={styles.quickActionTitle}>Share Your Location</Text>
                                    <Text style={styles.quickActionSubtitle}>Share your current location with the team</Text>
                                </View>
                            </View>
                            <Button
                                variant="primary"
                                size="sm"
                                onPress={() => navigation.navigate('Locations')}
                            >
                                <Text style={styles.quickActionButtonText}>Share</Text>
                            </Button>
                        </View>
                    </Card>
                )}

                {/* Internal Notice */}
                <Card style={styles.noticeCard}>
                    <View style={styles.noticeHeader}>
                        <Icon name="information-outline" size={ICON_SIZES.sm} color={COLORS.secondary} />
                        <Text style={styles.noticeTitle}>Internal Notice</Text>
                    </View>
                    <Text style={styles.noticeText}>
                        This dashboard provides a high-level overview of SAANVIKA operations. Use the navigation below to manage offices, employees and locations.
                    </Text>
                </Card>

                {/* External Employee Targets - Only for Admins and Super Admins */}
                {(user?.role === 'admin' || user?.role === 'super_admin') && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>External Employee Targets</Text>
                        {stats?.officeTargets && stats.officeTargets.length > 0 ? (
                            stats.officeTargets.map((target, index) => (
                                <Card key={index} style={styles.targetCard}>
                                    <Text style={styles.targetOfficeName}>{target.officeName}</Text>
                                    <View style={styles.targetStats}>
                                        <Text style={styles.targetText}>
                                            {target.current}/{target.target} Employees
                                        </Text>
                                    </View>
                                    <ProgressBar current={target.current} target={target.target} />
                                </Card>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>No office targets available</Text>
                        )}
                    </View>
                )}


            </ScrollView>
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
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoPart1: {
        fontSize: 24,
        fontWeight: '900',
        color: COLORS.primary,
        letterSpacing: -0.5,
    },
    logoPart2: {
        fontSize: 24,
        fontWeight: '900',
        color: COLORS.secondary,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginTop: 2,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    notificationButton: {
        padding: SPACING.sm,
    },
    content: {
        flex: 1,
        padding: SPACING.base,
    },
    statsScroll: {
        marginBottom: SPACING.base,
        marginHorizontal: -SPACING.base, // Allow scrolling edge to edge
    },
    statsScrollContent: {
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.sm, // Prevent top/bottom shadow clipping
        gap: SPACING.base,
    },
    statCard: {
        width: 160,
        alignItems: 'center',
        paddingVertical: SPACING.base,
    },
    statCardFull: {
        alignItems: 'center',
        marginBottom: SPACING.base,
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primaryLight + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    statValue: {
        fontSize: TYPOGRAPHY.fontSize['2xl'],
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    statLabel: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    statSubtext: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
        marginTop: SPACING.xs,
    },
    noticeCard: {
        marginBottom: SPACING.base,
    },
    noticeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        marginBottom: SPACING.sm,
    },
    noticeTitle: {
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.secondary,
    },
    noticeText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.relaxed,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.md,
    },
    targetCard: {
        marginBottom: SPACING.md,
    },
    targetOfficeName: {
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    targetStats: {
        marginBottom: SPACING.sm,
    },
    targetText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    emptyText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textLight,
        textAlign: 'center',
        marginTop: SPACING.base,
    },
    quickActionCard: {
        marginBottom: SPACING.base,
        backgroundColor: COLORS.successLight,
    },
    quickActionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    quickActionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: SPACING.base,
    },
    quickActionIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.base,
    },
    quickActionText: {
        flex: 1,
    },
    quickActionTitle: {
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    quickActionSubtitle: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    quickActionButtonText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textWhite,
    },
});

export default DashboardScreen;
