/**
 * Goodies Screen
 * Display and manage goodies distributions
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
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { goodiesApi, GoodiesDistribution } from '../../api/goodies';
import officesApi from '../../api/offices';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { showToast } from '../../utils/toast';
import { COLORS, TYPOGRAPHY, SPACING, ICON_SIZES } from '../../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const GoodiesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [distributions, setDistributions] = useState<GoodiesDistribution[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [claiming, setClaiming] = useState<string | null>(null);
    const [offices, setOffices] = useState<any[]>([]);
    const [filterOfficeId, setFilterOfficeId] = useState('all');
    const [showOfficeFilter, setShowOfficeFilter] = useState(false);

    const isManagement = ['super_admin', 'admin'].includes(user?.role || '');
    const canClaim = ['internal', 'external'].includes(user?.role || '');
    const isSuperAdmin = user?.role === 'super_admin';

    useEffect(() => {
        fetchDistributions();
        if (isSuperAdmin) {
            fetchOffices();
        }
    }, [filterOfficeId]);

    const fetchDistributions = useCallback(async () => {
        try {
            const data = await goodiesApi.getDistributions(
                filterOfficeId !== 'all' ? filterOfficeId : undefined
            );
            setDistributions(data);
        } catch (error) {
            console.error('Error fetching distributions:', error);
            showToast.error('Error', 'Failed to load goodies distributions');
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
        fetchDistributions();
    };

    const handleClaim = async (distributionId: string) => {
        setClaiming(distributionId);
        try {
            await goodiesApi.claimGoodies(distributionId);
            showToast.success('Success', 'Goodies claimed successfully!');
            fetchDistributions();
        } catch (error: any) {
            showToast.error('Error', error.response?.data?.message || 'Failed to claim goodies');
        } finally {
            setClaiming(null);
        }
    };

    const getStockColor = (remaining: number) => {
        if (remaining <= 0) return COLORS.danger;
        if (remaining <= 5) return COLORS.warning;
        return COLORS.success;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const renderDistributionCard = ({ item }: { item: GoodiesDistribution }) => {
        const stockColor = getStockColor(item.remainingCount);
        const canClaimItem = canClaim && item.remainingCount > 0;

        return (
            <Card style={styles.distributionCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <View style={[styles.iconContainer, { backgroundColor: COLORS.infoLight }]}>
                            <Icon name="gift" size={ICON_SIZES.md} color={COLORS.info} />
                        </View>
                        <View style={styles.cardHeaderInfo}>
                            <Text style={styles.goodiesType}>{item.goodiesType}</Text>
                            <Text style={styles.officeName}>
                                <Icon name="office-building" size={12} color={COLORS.textSecondary} />
                                {' '}{item.officeId?.name || 'Unknown Office'}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Available</Text>
                            <Text style={[styles.statValue, { color: stockColor }]}>
                                {item.remainingCount}/{item.totalQuantity}
                            </Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Claimed</Text>
                            <Text style={styles.statValue}>{item.claimedCount || 0}</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Date</Text>
                            <Text style={styles.statValue}>{formatDate(item.distributionDate)}</Text>
                        </View>
                    </View>

                    <View style={styles.targetBadge}>
                        {item.isForAllEmployees ? (
                            <View style={[styles.badge, styles.badgeBlue]}>
                                <Icon name="account-group" size={12} color={COLORS.primary} />
                                <Text style={[styles.badgeText, { color: COLORS.primary }]}>All Employees</Text>
                            </View>
                        ) : (
                            <View style={[styles.badge, styles.badgePurple]}>
                                <Icon name="account-check" size={12} color="#7C3AED" />
                                <Text style={[styles.badgeText, { color: '#7C3AED' }]}>
                                    {item.targetEmployees?.length || 0} Selected
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {canClaimItem && (
                    <View style={styles.cardFooter}>
                        <Button
                            variant="primary"
                            size="sm"
                            onPress={() => handleClaim(item._id)}
                            disabled={claiming === item._id}
                            style={styles.claimButton}
                        >
                            {claiming === item._id ? (
                                <>
                                    <ActivityIndicator size="small" color={COLORS.textWhite} />
                                    <Text style={styles.buttonText}>Claiming...</Text>
                                </>
                            ) : (
                                <>
                                    <Icon name="hand-back-right" size={16} color={COLORS.textWhite} />
                                    <Text style={styles.buttonText}>Claim Goodies</Text>
                                </>
                            )}
                        </Button>
                    </View>
                )}

                {item.remainingCount <= 0 && (
                    <View style={styles.outOfStock}>
                        <Icon name="alert-circle" size={16} color={COLORS.danger} />
                        <Text style={styles.outOfStockText}>Out of Stock</Text>
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
                    <Text style={styles.title}>Goodies Distribution</Text>
                    <Text style={styles.subtitle}>
                        {isManagement ? 'Manage goodies distribution' : 'Claim your goodies'}
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
                    <Text style={styles.loadingText}>Loading distributions...</Text>
                </View>
            ) : distributions.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="gift-outline" size={64} color={COLORS.textLight} />
                    <Text style={styles.emptyTitle}>No Goodies Found</Text>
                    <Text style={styles.emptyText}>
                        {isManagement
                            ? 'Create a new distribution to get started'
                            : 'No goodies available at the moment'}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={distributions}
                    renderItem={renderDistributionCard}
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
    distributionCard: {
        marginBottom: SPACING.base,
        padding: 0,
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.base,
        backgroundColor: COLORS.background,
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    cardHeaderInfo: {
        flex: 1,
    },
    goodiesType: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    officeName: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    cardBody: {
        padding: SPACING.base,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
        marginBottom: SPACING.xs,
    },
    statValue: {
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    targetBadge: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        borderRadius: SPACING.lg,
        gap: SPACING.xs,
    },
    badgeBlue: {
        backgroundColor: COLORS.primaryLight + '20',
    },
    badgePurple: {
        backgroundColor: '#EDE9FE',
    },
    badgeText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    cardFooter: {
        padding: SPACING.base,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    claimButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
    },
    buttonText: {
        color: COLORS.textWhite,
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    outOfStock: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.xs,
        padding: SPACING.md,
        backgroundColor: COLORS.dangerLight,
    },
    outOfStockText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.danger,
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

export default GoodiesScreen;
