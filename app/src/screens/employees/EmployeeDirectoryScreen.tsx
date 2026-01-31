/**
 * Employee Directory Screen
 * Employee list with search and filtering
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TextInput,
    TouchableOpacity,

} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { employeesApi } from '../../api/employees';
import { officesApi } from '../../api/offices';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import AddEmployeeForm from '../../components/forms/AddEmployeeForm';
import EditEmployeeForm from '../../components/forms/EditEmployeeForm';
import { showToast } from '../../utils/toast';
import { Dropdown } from '../../components/ui/Dropdown';
import { locationApi } from '../../api/location';
import { COLORS, TYPOGRAPHY, SPACING, ICON_SIZES, BORDER_RADIUS } from '../../constants/theme';
import { User, Office } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Alert, ActivityIndicator } from 'react-native';

export const EmployeeDirectoryScreen: React.FC = () => {
    const { user } = useAuth();
    const [employees, setEmployees] = useState<User[]>([]);
    const [filteredEmployees, setFilteredEmployees] = useState<User[]>([]);
    const [offices, setOffices] = useState<Office[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOffice, setSelectedOffice] = useState<string>('all');
    const [showOfficeFilter, setShowOfficeFilter] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showEditForm, setShowEditForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<User | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

    const isManagement = ['super_admin', 'admin', 'internal'].includes(user?.role || '');
    const isAdmin = ['super_admin', 'admin'].includes(user?.role || '');

    const fetchData = useCallback(async () => {
        try {
            const [employeesData, officesData] = await Promise.all([
                employeesApi.getAll(),
                officesApi.getAll(),
            ]);
            setEmployees(employeesData);
            setOffices(officesData);
            applyFilters(employeesData, searchQuery, selectedOffice);
        } catch (error) {
            console.error('Error fetching data:', error);
            showToast.error('Error', 'Failed to load employees');
        } finally {
            setRefreshing(false);
        }
    }, [searchQuery, selectedOffice]);

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [fetchData])
    );

    const applyFilters = (data: User[], search: string, office: string) => {
        let filtered = data;

        // Filter by office
        if (office !== 'all') {
            filtered = filtered.filter(emp => {
                // Handle both string ID and populated Office object
                const officeId = typeof emp.primaryOfficeId === 'object'
                    ? emp.primaryOfficeId?._id
                    : emp.primaryOfficeId;
                return officeId === office;
            });
        }

        // Filter by search query
        if (search.trim()) {
            const query = search.toLowerCase();
            filtered = filtered.filter(emp =>
                emp.name.toLowerCase().includes(query) ||
                emp.email.toLowerCase().includes(query) ||
                emp.employeeId?.toLowerCase().includes(query)
            );
        }

        setFilteredEmployees(filtered);
    };

    const handleSuspendEmployee = async (employee: User) => {
        setActionLoadingId(employee._id);
        try {
            if (employee.status === 'suspended' || employee.status === 'inactive') {
                await employeesApi.unsuspend(employee._id);
                showToast.success('Success', `${employee.name} reactivated`);
            } else {
                await employeesApi.suspend(employee._id);
                showToast.success('Success', `${employee.name} suspended`);
            }
            fetchData();
        } catch (error: any) {
            showToast.error('Error', error.response?.data?.message || 'Action failed');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleDeleteEmployee = (employee: User) => {
        Alert.alert(
            'Delete Employee',
            `Are you sure you want to delete ${employee.name}? This action cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setDeletingId(employee._id);
                        try {
                            await employeesApi.delete(employee._id);
                            showToast.success('Success', `${employee.name} deleted successfully`);
                            fetchData();
                        } catch (error: any) {
                            showToast.error('Error', error.response?.data?.message || 'Failed to delete employee');
                        } finally {
                            setDeletingId(null);
                        }
                    },
                },
            ]
        );
    };

    const handleRequestLocation = async (employeeId: string) => {
        setActionLoadingId(employeeId);
        try {
            await locationApi.requestLocation(employeeId);
            showToast.success('Success', 'Location request sent');
        } catch (error: any) {
            showToast.error('Error', error.response?.data?.message || 'Failed to request location');
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleEditEmployee = (employee: User) => {
        setEditingEmployee(employee);
        setShowEditForm(true);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleSearch = (text: string) => {
        setSearchQuery(text);
        applyFilters(employees, text, selectedOffice);
    };

    const handleOfficeFilter = (officeId: string) => {
        setSelectedOffice(officeId);
        applyFilters(employees, searchQuery, officeId);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Employee Directory</Text>
                    <Text style={styles.subtitle}>Manage and view all accounts</Text>
                </View>
                {offices.length > 0 && (
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setShowOfficeFilter(!showOfficeFilter)}
                    >
                        <Icon name="filter-variant" size={ICON_SIZES.sm} color={COLORS.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Icon name="magnify" size={ICON_SIZES.sm} color={COLORS.textLight} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search employees..."
                    placeholderTextColor={COLORS.textLight}
                    value={searchQuery}
                    onChangeText={handleSearch}
                />
            </View>

            {/* Office Filters */}
            {showOfficeFilter && (
                <View style={{ paddingHorizontal: SPACING.base, marginBottom: SPACING.base }}>
                    <Dropdown
                        placeholder="Filter by Office"
                        options={[
                            { label: 'All Offices', value: 'all' },
                            ...offices.map(office => ({ label: office.name, value: office._id }))
                        ]}
                        value={selectedOffice}
                        onSelect={handleOfficeFilter}
                    />
                </View>
            )}

            {/* Employee List */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {filteredEmployees.map((employee) => (
                    <Card key={employee._id} style={styles.employeeCard}>
                        <View style={styles.employeeHeader}>
                            <Avatar name={employee.name} size={48} />
                            <View style={styles.employeeInfo}>
                                <Text style={styles.employeeName}>{employee.name}</Text>
                                <Text style={styles.employeeId}>
                                    {employee.employeeId || `#${employee._id.slice(-6).toUpperCase()}`}
                                </Text>
                            </View>
                            <View style={styles.employeeHeaderActions}>
                                <Badge
                                    label={employee.status}
                                    variant={employee.status === 'active' ? 'success' : 'default'}
                                />
                                {isManagement && employee._id !== user?._id && (
                                    <View style={styles.employeeHeaderActions}>
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => handleRequestLocation(employee._id)}
                                            disabled={!!actionLoadingId}
                                        >
                                            <Icon name="map-marker-radius" size={ICON_SIZES.sm} color={COLORS.primary} />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => handleSuspendEmployee(employee)}
                                            disabled={!!actionLoadingId}
                                        >
                                            <Icon
                                                name={(employee.status === 'suspended' || employee.status === 'inactive') ? "account-check" : "account-off"}
                                                size={ICON_SIZES.sm}
                                                color={(employee.status === 'suspended' || employee.status === 'inactive') ? COLORS.success : COLORS.warning}
                                            />
                                        </TouchableOpacity>

                                        {isAdmin && (
                                            <>
                                                <TouchableOpacity
                                                    style={styles.actionButton}
                                                    onPress={() => handleEditEmployee(employee)}
                                                    disabled={!!actionLoadingId}
                                                >
                                                    <Icon name="pencil" size={ICON_SIZES.sm} color={COLORS.primary} />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.deleteButton}
                                                    onPress={() => handleDeleteEmployee(employee)}
                                                    disabled={deletingId === employee._id}
                                                >
                                                    {deletingId === employee._id ? (
                                                        <ActivityIndicator size="small" color={COLORS.danger} />
                                                    ) : (
                                                        <Icon name="trash-can-outline" size={ICON_SIZES.sm} color={COLORS.danger} />
                                                    )}
                                                </TouchableOpacity>
                                            </>
                                        )}
                                    </View>
                                )}
                            </View>
                        </View>

                        <View style={styles.employeeDetails}>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>OFFICE & ROLE</Text>
                                <Text style={styles.detailValue}>
                                    {employee.primaryOffice?.name ||
                                        (typeof employee.primaryOfficeId === 'object' && employee.primaryOfficeId?.name) ||
                                        offices.find(o => o._id === employee.primaryOfficeId)?.name ||
                                        (employee.role.includes('admin') ? 'Global' : 'Not Assigned')} • {employee.role.toUpperCase()}
                                </Text>
                            </View>

                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>CONTACT INFO</Text>
                                <View style={styles.contactInfo}>
                                    <View style={styles.contactItem}>
                                        <Icon name="email" size={ICON_SIZES.xs} color={COLORS.textLight} />
                                        <Text style={styles.contactText}>{employee.email}</Text>
                                    </View>
                                    {employee.phone && (
                                        <View style={styles.contactItem}>
                                            <Icon name="phone" size={ICON_SIZES.xs} color={COLORS.textLight} />
                                            <Text style={styles.contactText}>{employee.phone}</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </Card>
                ))}

                {filteredEmployees.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Icon name="account-search-outline" size={64} color={COLORS.textLight} />
                        <Text style={styles.emptyText}>No employees found</Text>
                    </View>
                )}
            </ScrollView>

            {/* Add Button */}
            <TouchableOpacity style={styles.fab} onPress={() => setShowAddForm(true)}>
                <Icon name="account-plus" size={ICON_SIZES.lg} color={COLORS.textWhite} />
            </TouchableOpacity>

            {/* Add Employee Form */}
            <AddEmployeeForm
                isVisible={showAddForm}
                onClose={() => setShowAddForm(false)}
                onSuccess={fetchData}
                offices={offices}
            />

            {/* Edit Employee Form */}
            <EditEmployeeForm
                isVisible={showEditForm}
                onClose={() => {
                    setShowEditForm(false);
                    setEditingEmployee(null);
                }}
                onSuccess={fetchData}
                employee={editingEmployee}
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.base,
        paddingTop: SPACING['4xl'],
        paddingBottom: SPACING.base,
        backgroundColor: COLORS.backgroundLight,
    },
    filterButton: {
        padding: SPACING.sm,
        borderRadius: SPACING.sm,
        backgroundColor: COLORS.primaryLight + '20',
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
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.backgroundLight,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.base,
        marginHorizontal: SPACING.base,
        marginVertical: SPACING.base,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        paddingVertical: SPACING.md,
        marginLeft: SPACING.sm,
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.textPrimary,
    },
    filtersContainer: {
        maxHeight: 50,
    },
    filtersContent: {
        paddingHorizontal: SPACING.base,
        paddingBottom: SPACING.base,
        gap: SPACING.sm,
    },
    filterChip: {
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.sm,
        borderRadius: BORDER_RADIUS.full,
        backgroundColor: COLORS.backgroundLight,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: SPACING.sm,
    },
    filterChipActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    filterText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textSecondary,
    },
    filterTextActive: {
        color: COLORS.textWhite,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.base,
    },
    employeeCard: {
        marginBottom: SPACING.base,
    },
    employeeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
    },
    employeeInfo: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    employeeName: {
        fontSize: TYPOGRAPHY.fontSize.md,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
    },
    employeeId: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
        marginTop: 2,
    },
    employeeDetails: {
        gap: SPACING.md,
    },
    employeeHeaderActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    deleteButton: {
        padding: SPACING.xs,
        borderRadius: BORDER_RADIUS.sm,
    },
    actionButton: {
        padding: SPACING.xs,
        borderRadius: BORDER_RADIUS.sm,
    },
    detailRow: {
        gap: SPACING.xs,
    },
    detailLabel: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
    },
    detailValue: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    contactInfo: {
        gap: SPACING.xs,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    contactText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
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

export default EmployeeDirectoryScreen;
