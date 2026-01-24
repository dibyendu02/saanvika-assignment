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
import employeesApi from '../../api/employees';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Dropdown } from '../../components/ui/Dropdown';
import { showToast } from '../../utils/toast';
import { COLORS, TYPOGRAPHY, SPACING, ICON_SIZES } from '../../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { pick, types, DocumentPickerResponse } from '@react-native-documents/picker';

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
    const [createMode, setCreateMode] = useState<'single' | 'bulk'>('single');
    const [selectedFile, setSelectedFile] = useState<DocumentPickerResponse | null>(null);
    const [uploadResult, setUploadResult] = useState<any>(null);
    const [formData, setFormData] = useState({
        goodiesType: '',
        totalQuantity: '',
        distributionDate: new Date().toISOString().split('T')[0],
        officeId: '',
        isForAllEmployees: true,
    });

    // Employee Selection State
    const [employees, setEmployees] = useState<any[]>([]);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);

    const isManagement = ['super_admin', 'admin'].includes(user?.role || '');
    const canClaim = ['internal', 'external'].includes(user?.role || '');
    const isSuperAdmin = user?.role === 'super_admin';

    useEffect(() => {
        fetchDistributions();
        if (isSuperAdmin) {
            fetchOffices();
        }
    }, [filterOfficeId]);



    // Fetch employees when office or target mode changes
    useEffect(() => {
        if (!showCreateModal) return;

        if (formData.isForAllEmployees) {
            setEmployees([]);
            return;
        }

        const fetchTargetEmployees = async () => {
            const targetOfficeId = isSuperAdmin ? formData.officeId : (user?.primaryOfficeId && typeof user.primaryOfficeId === 'object' ? (user.primaryOfficeId as any)._id : user?.primaryOfficeId);

            if (!targetOfficeId) return;

            setLoadingEmployees(true);
            try {
                const data = await employeesApi.getByOffice(targetOfficeId);
                // Filter to only show internal and external employees
                const filteredEmployees = data.filter((emp: any) => ['internal', 'external'].includes(emp.role));
                setEmployees(filteredEmployees);
            } catch (error) {
                console.error('Error fetching employees:', error);
                showToast.error('Error', 'Failed to load employees');
            } finally {
                setLoadingEmployees(false);
            }
        };

        fetchTargetEmployees();
    }, [formData.isForAllEmployees, formData.officeId, showCreateModal, isSuperAdmin, user]);

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

    const handleFilePick = async () => {
        try {
            const [res] = await pick({
                type: [types.xls, types.xlsx],
                allowMultiSelection: false,
            });
            setSelectedFile(res as any);
            setUploadResult(null);
        } catch (err) {
            console.log('File pick cancelled or failed', err);
        }
    };

    const handleBulkUpload = async () => {
        if (!selectedFile || !formData.goodiesType || !formData.distributionDate) {
            showToast.error('Error', 'Please fill all fields and select a file');
            return;
        }

        setCreateLoading(true);
        try {
            const data = new FormData();
            data.append('file', {
                uri: selectedFile.uri,
                type: selectedFile.type,
                name: selectedFile.name,
            });
            data.append('goodiesType', formData.goodiesType);
            data.append('distributionDate', formData.distributionDate);

            const result = await goodiesApi.bulkUpload(data);
            setUploadResult(result.data);

            if (result.data.successCount > 0) {
                showToast.success('Success', `Processed ${result.data.successCount} records successfully`);
                fetchDistributions();
            } else {
                showToast.error('Error', 'No records were processed successfully');
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            showToast.error('Error', error.response?.data?.message || 'Bulk upload failed');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleCreateDistribution = async () => {
        if (createMode === 'bulk') {
            await handleBulkUpload();
            return;
        }



        if (!formData.goodiesType || !formData.totalQuantity || !formData.distributionDate) {
            showToast.error('Error', 'Please fill in all required fields');
            return;
        }

        if (!formData.isForAllEmployees && selectedEmployeeIds.length === 0) {
            showToast.error('Error', 'Please select at least one employee');
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
                targetEmployees: formData.isForAllEmployees ? [] : selectedEmployeeIds,
            });

            showToast.success('Success', 'Distribution created successfully');
            setShowCreateModal(false);
            resetCreateForm();
            fetchDistributions();
        } catch (error: any) {
            console.error('Create error:', error);
            showToast.error('Error', error.response?.data?.message || 'Failed to create distribution');
        } finally {
            setCreateLoading(false);
        }
    };

    const resetCreateForm = () => {
        setFormData({
            goodiesType: '',
            totalQuantity: '',
            distributionDate: new Date().toISOString().split('T')[0],
            officeId: '',
            isForAllEmployees: true,
        });
        setSelectedFile(null);
        setUploadResult(null);
        setCreateMode('single');
        setSelectedEmployeeIds([]);
        setEmployees([]);
    };

    const handleCloseCreateModal = () => {
        resetCreateForm();
        setShowCreateModal(false);
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
                onRequestClose={handleCloseCreateModal}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {createMode === 'single' ? 'Create Distribution' : 'Bulk Upload'}
                            </Text>
                            <TouchableOpacity
                                onPress={handleCloseCreateModal}
                                style={styles.closeButton}
                            >
                                <Icon name="close" size={24} color={COLORS.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.tabContainer}>
                            <TouchableOpacity
                                style={[styles.tab, createMode === 'single' && styles.activeTab]}
                                onPress={() => setCreateMode('single')}
                            >
                                <Text style={[styles.tabText, createMode === 'single' && styles.activeTabText]}>Single</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.tab, createMode === 'bulk' && styles.activeTab]}
                                onPress={() => setCreateMode('bulk')}
                            >
                                <Text style={[styles.tabText, createMode === 'bulk' && styles.activeTabText]}>Bulk Upload</Text>
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

                            {createMode === 'single' ? (
                                <>
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

                                    {isSuperAdmin && (
                                        <Dropdown
                                            label="Select Office"
                                            placeholder="Choose an office..."
                                            options={offices.map(office => ({ label: office.name, value: office._id }))}
                                            value={formData.officeId}
                                            onSelect={(value) => setFormData({ ...formData, officeId: value })}
                                        />
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

                                    {!formData.isForAllEmployees && (
                                        <View style={styles.employeeListContainer}>
                                            <Text style={styles.sectionTitle}>Select Employees</Text>

                                            {loadingEmployees ? (
                                                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
                                            ) : employees.length === 0 ? (
                                                <Text style={styles.emptyText}>No employees found in this office</Text>
                                            ) : (
                                                <>
                                                    <View style={styles.selectionHeader}>
                                                        <Text style={styles.selectionCount}>
                                                            {selectedEmployeeIds.length} selected
                                                        </Text>
                                                        <TouchableOpacity
                                                            onPress={() => {
                                                                if (selectedEmployeeIds.length === employees.length) {
                                                                    setSelectedEmployeeIds([]);
                                                                } else {
                                                                    setSelectedEmployeeIds(employees.map(e => e._id));
                                                                }
                                                            }}
                                                        >
                                                            <Text style={styles.selectAllText}>
                                                                {selectedEmployeeIds.length === employees.length ? 'Deselect All' : 'Select All'}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    </View>

                                                    <View style={styles.employeeList}>
                                                        {employees.map((emp) => (
                                                            <TouchableOpacity
                                                                key={emp._id}
                                                                style={[
                                                                    styles.employeeItem,
                                                                    selectedEmployeeIds.includes(emp._id) && styles.employeeItemActive
                                                                ]}
                                                                onPress={() => {
                                                                    if (selectedEmployeeIds.includes(emp._id)) {
                                                                        setSelectedEmployeeIds(prev => prev.filter(id => id !== emp._id));
                                                                    } else {
                                                                        setSelectedEmployeeIds(prev => [...prev, emp._id]);
                                                                    }
                                                                }}
                                                            >
                                                                <View style={[
                                                                    styles.checkbox,
                                                                    selectedEmployeeIds.includes(emp._id) && styles.checkboxActive
                                                                ]}>
                                                                    {selectedEmployeeIds.includes(emp._id) && (
                                                                        <Icon name="check" size={12} color={COLORS.textWhite} />
                                                                    )}
                                                                </View>
                                                                <View>
                                                                    <Text style={styles.employeeName}>{emp.name}</Text>
                                                                    <Text style={styles.employeeEmail}>{emp.email}</Text>
                                                                </View>
                                                            </TouchableOpacity>
                                                        ))}
                                                    </View>
                                                </>
                                            )}
                                        </View>
                                    )}
                                </>
                            ) : (
                                <>
                                    <View style={styles.formGroup}>
                                        <Text style={styles.label}>Excel File</Text>
                                        <TouchableOpacity
                                            style={styles.fileInput}
                                            onPress={handleFilePick}
                                        >
                                            <Icon name={selectedFile ? "file-excel" : "upload"} size={24} color={COLORS.primary} />
                                            <Text style={styles.fileInputText}>
                                                {selectedFile ? selectedFile.name : 'Choose Excel File'}
                                            </Text>
                                        </TouchableOpacity>
                                        <Text style={styles.helperText}>
                                            File must include employee_id column. {isSuperAdmin && 'Super admins must include office_id column.'}
                                        </Text>
                                    </View>

                                    {uploadResult && (
                                        <View style={styles.resultContainer}>
                                            <View style={styles.resultRow}>
                                                <Text style={styles.successText}>Success: {uploadResult.successCount}</Text>
                                                <Text style={styles.errorText}>Failed: {uploadResult.failedCount}</Text>
                                            </View>
                                            {uploadResult.failedRecords?.length > 0 && (
                                                <View style={styles.errorList}>
                                                    <Text style={styles.errorTitle}>Errors:</Text>
                                                    {uploadResult.failedRecords.map((item: any, index: number) => (
                                                        <Text key={index} style={styles.errorItem}>
                                                            {item.row ? `Row ${item.row}: ` : ''}{item.error}
                                                        </Text>
                                                    ))}
                                                </View>
                                            )}
                                        </View>
                                    )}
                                </>
                            )}

                            <Button
                                variant="primary"
                                onPress={handleCreateDistribution}
                                loading={createLoading}
                                style={styles.submitButton}
                                title={createMode === 'single' ? "Create Distribution" : "Upload & Distribute"}
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
    tabContainer: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.md,
        paddingTop: SPACING.md,
        gap: SPACING.md,
    },
    tab: {
        flex: 1,
        paddingVertical: SPACING.sm,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: COLORS.primary,
    },
    tabText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textSecondary,
    },
    activeTabText: {
        color: COLORS.primary,
    },
    fileInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        borderRadius: SPACING.md,
        padding: SPACING.lg,
        backgroundColor: COLORS.backgroundLight,
    },
    fileInputText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textPrimary,
    },
    helperText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
        marginTop: SPACING.xs,
    },
    resultContainer: {
        marginTop: SPACING.md,
        padding: SPACING.md,
        backgroundColor: COLORS.backgroundLight,
        borderRadius: SPACING.sm,
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    successText: {
        color: COLORS.success,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
    },
    errorText: {
        color: COLORS.danger,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
    },
    errorList: {
        marginTop: SPACING.sm,
    },
    errorTitle: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.danger,
        marginBottom: SPACING.xs,
    },
    errorItem: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.danger,
        marginBottom: 2,
    },
    employeeListContainer: {
        marginTop: SPACING.md,
        maxHeight: 300,
    },
    sectionTitle: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    selectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    selectionCount: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textSecondary,
    },
    selectAllText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
    },
    employeeList: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: SPACING.sm,
    },
    employeeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    employeeItemActive: {
        backgroundColor: COLORS.primaryLight + '20',
    },
    employeeName: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textPrimary,
    },
    employeeEmail: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textSecondary,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginRight: SPACING.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.background,
    },
    checkboxActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
});

export default GoodiesScreen;
