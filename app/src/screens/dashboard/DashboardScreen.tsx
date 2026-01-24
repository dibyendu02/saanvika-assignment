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
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi } from '../../api/dashboard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { showToast } from '../../utils/toast';
import { COLORS, TYPOGRAPHY, SPACING, ICON_SIZES } from '../../constants/theme';
import { DashboardStats } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

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

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const getRoleDisplay = (role: string): string => {
        return role.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.logo}>SAANVIKA</Text>
                    <Text style={styles.subtitle}>
                        Welcome back, {getRoleDisplay(user?.role || '')}
                    </Text>
                </View>
                <TouchableOpacity style={styles.notificationButton}>
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
                    <TouchableOpacity onPress={() => navigation.navigate('Offices')} activeOpacity={0.9}>
                        <Card style={styles.statCard}>
                            <View style={[styles.statIconContainer, { backgroundColor: COLORS.primaryLight + '20' }]}>
                                <Icon name="office-building" size={ICON_SIZES.md} color={COLORS.primary} />
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

                    <TouchableOpacity onPress={() => navigation.navigate('More')} activeOpacity={0.9}>
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

                {/* Internal Notice */}
                <Card style={styles.noticeCard}>
                    <View style={styles.noticeHeader}>
                        <Icon name="information-outline" size={ICON_SIZES.sm} color={COLORS.primary} />
                        <Text style={styles.noticeTitle}>Internal Notice</Text>
                    </View>
                    <Text style={styles.noticeText}>
                        This dashboard provides a high-level overview of SAANVIKA operations. Use the navigation below to manage offices, employees and locations.
                    </Text>
                </Card>

                {/* External Employee Targets */}
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
    logo: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
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
        color: COLORS.primary,
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
        paddingVertical: SPACING.xl,
    },

});

export default DashboardScreen;
