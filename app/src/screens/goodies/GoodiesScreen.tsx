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
    Modal,
    TextInput,
    Switch,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { goodiesApi, GoodiesDistribution, ClaimRecord } from '../../api/goodies';
import officesApi from '../../api/offices';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { showToast } from '../../utils/toast';
import { COLORS, TYPOGRAPHY, SPACING, ICON_SIZES } from '../../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';

export const GoodiesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [distributions, setDistributions] = useState<GoodiesDistribution[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [claiming, setClaiming] = useState<string | null>(null);
    const [offices, setOffices] = useState<any[]>([]);
    const [filterOfficeId, setFilterOfficeId] = useState('all');
    const [showOfficeFilter, setShowOfficeFilter] = useState(false);

    // Details Modal State
    const [showDetails, setShowDetails] = useState(false);
    const [selectedDistribution, setSelectedDistribution] = useState<GoodiesDistribution | null>(null);
    const [claims, setClaims] = useState<ClaimRecord[]>([]);
    const [loadingClaims, setLoadingClaims] = useState(false);

    // Create Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [formData, setFormData] = useState({
        goodiesType: '',
        totalQuantity: '',
        distributionDate: new Date().toISOString().split('T')[0],
        officeId: '',
        isForAllEmployees: true,
    });

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

    const handleShowDetails = async (distribution: GoodiesDistribution) => {
        setSelectedDistribution(distribution);
        setShowDetails(true);
        setLoadingClaims(true);
        setClaims([]); // Clear previous claims
        try {
            const data = await goodiesApi.getDistributionClaims(distribution._id);
            setClaims(data);
        } catch (error) {
            console.error('Error fetching claims:', error);
            showToast.error('Error', 'Failed to load claim details');
        } finally {
            setLoadingClaims(false);
        }
    };

    const handleCloseDetails = () => {
        setShowDetails(false);
        setSelectedDistribution(null);
        setClaims([]);
    };



    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(false);
        if (selectedDate) {
            setFormData({
                ...formData,
                distributionDate: selectedDate.toISOString().split('T')[0],
            });
        }
    };

    const handleCreateDistribution = async () => {
        if (!formData.goodiesType || !formData.totalQuantity || !formData.distributionDate) {
            showToast.error('Error', 'Please fill in all required fields');
            return;
        }

        if (isSuperAdmin && !formData.officeId) {
            showToast.error('Error', 'Please select an office');
            return;
        }

        setCreateLoading(true);
        try {
            // Safely handle primaryOfficeId whether it is populated or just an ID
            const userOfficeId = user?.primaryOfficeId && typeof user.primaryOfficeId === 'object' && '_id' in user.primaryOfficeId
                ? (user.primaryOfficeId as any)._id
                : user?.primaryOfficeId;

            await goodiesApi.createDistribution({
                goodiesType: formData.goodiesType,
                totalQuantity: parseInt(formData.totalQuantity),
                distributionDate: formData.distributionDate,
                officeId: isSuperAdmin ? formData.officeId : (userOfficeId || ''),
                isForAllEmployees: formData.isForAllEmployees,
                targetEmployees: [], // For now empty, or implement selection later
            });

            showToast.success('Success', 'Distribution created successfully');
            setShowCreateModal(false);
            setFormData({
                goodiesType: '',
                totalQuantity: '',
                distributionDate: new Date().toISOString().split('T')[0],
                officeId: '',
                isForAllEmployees: true,
            });
            fetchDistributions();
        } catch (error: any) {
            console.error('Create error:', error);
            showToast.error('Error', error.response?.data?.message || 'Failed to create distribution');
        } finally {
            setCreateLoading(false);
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
                    {isManagement && (
                        <TouchableOpacity
                            style={styles.detailsIconButton}
                            onPress={() => handleShowDetails(item)}
                        >
                            <Icon name="history" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                    )}
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

                {/* Actions */}
                {/* Actions */}
                {canClaimItem && (
                    <View style={styles.cardFooter}>
                        <View style={styles.actionRow}>
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

            {/* Details Modal */}
            <Modal
                visible={showDetails}
                animationType="slide"
                transparent={true}
                onRequestClose={handleCloseDetails}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Distribution Details</Text>
                            <TouchableOpacity onPress={handleCloseDetails} style={styles.closeButton}>
                                <Icon name="close" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {selectedDistribution && (
                            <View style={styles.modalBody}>
                                <Text style={styles.modalSubtitle}>{selectedDistribution.goodiesType}</Text>
                                <View style={styles.modalStats}>
                                    <Text style={styles.modalStatText}>
                                        Total: <Text style={styles.bold}>{selectedDistribution.totalQuantity}</Text>
                                    </Text>
                                    <Text style={styles.modalStatText}>
                                        Rest: <Text style={[styles.bold, { color: getStockColor(selectedDistribution.remainingCount) }]}>
                                            {selectedDistribution.remainingCount}
                                        </Text>
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.claimsListHeader}>
                            <Text style={styles.claimsListTitle}>Claim History</Text>
                        </View>

                        {loadingClaims ? (
                            <View style={styles.modalLoading}>
                                <ActivityIndicator size="small" color={COLORS.primary} />
                                <Text>Loading claims...</Text>
                            </View>
                        ) : claims.length === 0 ? (
                            <View style={styles.modalEmpty}>
                                <Text style={styles.modalEmptyText}>No claims yet.</Text>
                            </View>
                        ) : (
                            <FlatList
                                data={claims}
                                keyExtractor={(item) => item._id}
                                renderItem={({ item }) => (
                                    <View style={styles.claimItem}>
                                        <View style={styles.claimUser}>
                                            <Icon name="account-circle-outline" size={24} color={COLORS.textSecondary} />
                                            <View style={styles.claimUserInfo}>
                                                <Text style={styles.claimUserName}>{item.userId?.name || 'Unknown'}</Text>
                                                <Text style={styles.claimUserEmail}>{item.userId?.email}</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.claimDate}>{formatDate(item.receivedAt)}</Text>
                                    </View>
                                )}
                                contentContainerStyle={styles.claimsList}
                            />
                        )}
                    </View>
                </View>
            </Modal>

            {/* Create Distribution Modal */}
            <Modal
                visible={showCreateModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCreateModal(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Create Distribution</Text>
                            <TouchableOpacity
                                onPress={() => setShowCreateModal(false)}
                                style={styles.closeButton}
                            >
                                <Icon name="close" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.formContainer}>
                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Goodies Type</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Diwali Gift Box"
                                    value={formData.goodiesType}
                                    onChangeText={(text) => setFormData({ ...formData, goodiesType: text })}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Total Quantity</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. 100"
                                    keyboardType="numeric"
                                    value={formData.totalQuantity}
                                    onChangeText={(text) => setFormData({ ...formData, totalQuantity: text })}
                                />
                            </View>

                            <View style={styles.formGroup}>
                                <Text style={styles.label}>Distribution Date</Text>
                                <TouchableOpacity
                                    style={styles.dateInput}
                                    onPress={() => setShowDatePicker(true)}
                                >
                                    <Text style={styles.dateInputText}>{formData.distributionDate}</Text>
                                    <Icon name="calendar" size={20} color={COLORS.textSecondary} />
                                </TouchableOpacity>
                                {showDatePicker && (
                                    <DateTimePicker
                                        value={new Date(formData.distributionDate)}
                                        mode="date"
                                        display="default"
                                        onChange={handleDateChange}
                                        minimumDate={new Date()}
                                    />
                                )}
                            </View>

                            {isSuperAdmin && (
                                <View style={styles.formGroup}>
                                    <Text style={styles.label}>Select Office</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
                                        {offices.map((office) => (
                                            <TouchableOpacity
                                                key={office._id}
                                                style={[
                                                    styles.filterChip,
                                                    formData.officeId === office._id && styles.filterChipActive,
                                                ]}
                                                onPress={() => setFormData({ ...formData, officeId: office._id })}
                                            >
                                                <Text
                                                    style={[
                                                        styles.filterChipText,
                                                        formData.officeId === office._id && styles.filterChipTextActive,
                                                    ]}
                                                >
                                                    {office.name}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            <View style={styles.switchContainer}>
                                <Text style={styles.label}>All Employees</Text>
                                <Switch
                                    value={formData.isForAllEmployees}
                                    onValueChange={(val) => setFormData({ ...formData, isForAllEmployees: val })}
                                    trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
                                    thumbColor={formData.isForAllEmployees ? COLORS.primary : '#f4f3f4'}
                                />
                            </View>

                            <Button
                                variant="primary"
                                onPress={handleCreateDistribution}
                                loading={createLoading}
                                style={styles.submitButton}
                                title="Create Distribution"
                            />
                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* FAB */}
            {isManagement && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setShowCreateModal(true)}
                    activeOpacity={0.8}
                >
                    <Icon name="plus" size={30} color={COLORS.textWhite} />
                </TouchableOpacity>
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
    detailsIconButton: {
        padding: SPACING.sm,
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
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: SPACING.sm,
    },
    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingHorizontal: SPACING.md,
    },
    detailsButtonText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.primary,
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
    // Modal Styles (Bottom Sheet)
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderTopLeftRadius: SPACING.lg,
        borderTopRightRadius: SPACING.lg,
        height: '70%',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    closeButton: {
        padding: SPACING.xs,
    },
    modalBody: {
        padding: SPACING.md,
        backgroundColor: COLORS.backgroundLight,
    },
    modalSubtitle: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    modalStats: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    modalStatText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    bold: {
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    claimsListHeader: {
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.md,
        paddingBottom: SPACING.sm,
    },
    claimsListTitle: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textSecondary,
    },
    claimsList: {
        paddingHorizontal: SPACING.md,
        paddingBottom: SPACING.md,
    },
    claimItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    claimUser: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: SPACING.sm,
    },
    claimUserInfo: {
        flex: 1,
    },
    claimUserName: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textPrimary,
    },
    claimUserEmail: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textSecondary,
    },
    claimDate: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textSecondary,
    },
    modalLoading: {
        padding: SPACING.xl,
        alignItems: 'center',
        gap: SPACING.sm,
    },
    modalEmpty: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    modalEmptyText: {
        color: COLORS.textSecondary,
        fontSize: TYPOGRAPHY.fontSize.sm,
    },
    // FAB
    fab: {
        position: 'absolute',
        bottom: SPACING['2xl'],
        right: SPACING.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    // Form Styles
    formContainer: {
        padding: SPACING.md,
    },
    formGroup: {
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: SPACING.sm,
        padding: SPACING.md,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textPrimary,
        backgroundColor: COLORS.background,
    },
    dateInput: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: SPACING.sm,
        padding: SPACING.md,
        backgroundColor: COLORS.background,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateInputText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textPrimary,
    },
    chipContainer: {
        flexDirection: 'row',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    submitButton: {
        marginTop: SPACING.sm,
    },
});

export default GoodiesScreen;
