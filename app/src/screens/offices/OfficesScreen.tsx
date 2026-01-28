/**
 * Offices Screen
 * Office list with filtering and management
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,

} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { officesApi } from '../../api/offices';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import AddOfficeForm from '../../components/forms/AddOfficeForm';
import { showToast } from '../../utils/toast';
import { COLORS, TYPOGRAPHY, SPACING, ICON_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { Office } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Alert, ActivityIndicator } from 'react-native';

export const OfficesScreen: React.FC = () => {
    const { user } = useAuth();
    const [offices, setOffices] = useState<Office[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const isSuperAdmin = user?.role === 'super_admin';

    const fetchOffices = useCallback(async () => {
        try {
            const data = await officesApi.getAll();
            setOffices(data);
        } catch (error) {
            console.error('Error fetching offices:', error);
            showToast.error('Error', 'Failed to load offices');
        } finally {
            setRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchOffices();
        }, [fetchOffices])
    );

    const handleDeleteOffice = (office: Office) => {
        Alert.alert(
            'Delete Office',
            `Are you sure you want to delete ${office.name}? All employee associations may be affected.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeletingId(office._id);
                        try {
                            await officesApi.delete(office._id);
                            showToast.success('Success', `${office.name} deleted successfully`);
                            fetchOffices();
                        } catch (error: any) {
                            showToast.error('Error', error.response?.data?.message || 'Failed to delete office');
                        } finally {
                            setDeletingId(null);
                        }
                    },
                },
            ]
        );
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchOffices();
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Offices</Text>
                <Text style={styles.subtitle}>{offices.length} Active Locations</Text>
            </View>



            {/* Office List */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={{
                    paddingTop: SPACING.base,
                    paddingBottom: SPACING['4xl'] // Space for FAB
                }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {offices.map((office) => (
                    <Card key={office._id} style={styles.officeCard}>
                        <View style={styles.officeHeader}>
                            <View style={styles.officeIcon}>
                                <Icon name="office-building" size={ICON_SIZES.md} color={COLORS.primary} />
                            </View>
                            <View style={styles.officeInfo}>
                                <Text style={styles.officeName}>{office.name}</Text>
                                <Text style={styles.officeId}>#{office._id.slice(-6).toUpperCase()}</Text>
                            </View>
                            <View style={styles.officeHeaderActions}>
                                <Badge
                                    label={office.status || 'active'}
                                    variant={office.status === 'active' ? 'success' : 'default'}
                                />
                                {isSuperAdmin && (
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => handleDeleteOffice(office)}
                                        disabled={deletingId === office._id}
                                    >
                                        {deletingId === office._id ? (
                                            <ActivityIndicator size="small" color={COLORS.danger} />
                                        ) : (
                                            <Icon name="trash-can-outline" size={ICON_SIZES.sm} color={COLORS.danger} />
                                        )}
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <View style={styles.officeLocation}>
                            <Icon name="map-marker" size={ICON_SIZES.sm} color={COLORS.textLight} />
                            <Text style={styles.locationText}>{office.address}</Text>
                        </View>

                        <View style={styles.officeStats}>
                            <View style={styles.statItem}>
                                <Text style={styles.statItemLabel}>EMPLOYEES</Text>
                                <Text style={styles.statItemValue}>{office.currentEmployeeCount || 0}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statItemLabel}>TARGET</Text>
                                <Text style={styles.statItemValue}>{office.targetHeadcount}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statItemLabel}>PROGRESS</Text>
                                <Text style={styles.statItemValue}>
                                    {office.targetHeadcount > 0
                                        ? Math.round(((office.currentEmployeeCount || 0) / office.targetHeadcount) * 100)
                                        : 0}%
                                </Text>
                            </View>
                        </View>

                        <ProgressBar
                            current={office.currentEmployeeCount || 0}
                            target={office.targetHeadcount}
                        />
                    </Card>
                ))}

                {offices.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Icon name="office-building-outline" size={64} color={COLORS.textLight} />
                        <Text style={styles.emptyText}>No offices found</Text>
                    </View>
                )}
            </ScrollView>

            {/* Add Button */}
            <TouchableOpacity style={styles.fab} onPress={() => setShowAddForm(true)}>
                <Icon name="plus" size={ICON_SIZES.lg} color={COLORS.textWhite} />
            </TouchableOpacity>

            {/* Add Office Form */}
            <AddOfficeForm
                isVisible={showAddForm}
                onClose={() => setShowAddForm(false)}
                onSuccess={fetchOffices}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
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
        marginTop: SPACING.xs,
    },
    statsContainer: {
        flexDirection: 'row',
        gap: SPACING.base,
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.base,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: SPACING.base,
    },
    statIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.sm,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
        textAlign: 'center',
    },
    statValue: {
        fontSize: TYPOGRAPHY.fontSize['2xl'],
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
        marginTop: SPACING.xs,
    },
    statSubtext: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
        marginTop: SPACING.xs / 2,
        textAlign: 'center',
    },

    content: {
        flex: 1,
        paddingHorizontal: SPACING.base,
    },
    officeCard: {
        marginBottom: SPACING.base,
    },
    officeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    officeIcon: {
        width: 48,
        height: 48,
        borderRadius: BORDER_RADIUS.md,
        backgroundColor: COLORS.primaryLight + '20',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.md,
    },
    officeInfo: {
        flex: 1,
    },
    officeHeaderActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    deleteButton: {
        padding: SPACING.xs,
        borderRadius: BORDER_RADIUS.sm,
    },
    officeName: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
    },
    officeId: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
        marginTop: 2,
    },
    officeLocation: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        marginBottom: SPACING.md,
    },
    locationText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    officeStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.md,
    },
    statItem: {
        flex: 1,
    },
    statItemLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
        marginBottom: SPACING.xs,
    },
    statItemValue: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING['4xl'],
    },
    emptyText: {
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.textLight,
        marginTop: SPACING.base,
    },
    fab: {
        position: 'absolute',
        right: SPACING.base,
        bottom: SPACING.base,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
});

export default OfficesScreen;
