/**
 * Attendance Screen
 * Attendance records with filtering
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
import { attendanceApi } from '../../api/attendance';
import officesApi from '../../api/offices';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { showToast } from '../../utils/toast';
import { Dropdown } from '../../components/ui/Dropdown';
import { COLORS, TYPOGRAPHY, SPACING, ICON_SIZES } from '../../constants/theme';
import { Attendance } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { format } from 'date-fns';

export const AttendanceScreen: React.FC = () => {
    const [attendance, setAttendance] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [offices, setOffices] = useState<any[]>([]);
    const [selectedOffice, setSelectedOffice] = useState<string>('all');
    const [showOfficeFilter, setShowOfficeFilter] = useState(false);
    const [filteredAttendance, setFilteredAttendance] = useState<Attendance[]>([]);

    const fetchAttendance = useCallback(async () => {
        try {
            const [attendanceData, officesData] = await Promise.all([
                attendanceApi.getAll(),
                officesApi.getAll()
            ]);

            // Ensure data is always an array
            const validAttendance = Array.isArray(attendanceData) ? attendanceData : [];
            setAttendance(validAttendance);
            setOffices(officesData);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            showToast.error('Error', 'Failed to load attendance records');
            setAttendance([]); // Set empty array on error
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    useEffect(() => {
        applyFilters(attendance, selectedOffice);
    }, [attendance, selectedOffice]);

    const applyFilters = (data: Attendance[], officeId: string) => {
        if (officeId === 'all') {
            setFilteredAttendance(data);
        } else {
            const filtered = data.filter(record => {
                const recordOfficeId = typeof record.office === 'object' ? record.office?._id : record.office;
                return recordOfficeId === officeId;
            });
            setFilteredAttendance(filtered);
        }
    };

    const handleOfficeFilter = (officeId: string) => {
        setSelectedOffice(officeId);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchAttendance();
    };

    const formatDate = (dateString: string): string => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch {
            return dateString;
        }
    };

    const formatTime = (dateString: string): string => {
        try {
            return format(new Date(dateString), 'hh:mm a');
        } catch {
            return '';
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Attendance</Text>
                    <Text style={styles.subtitle}>{filteredAttendance.length} Records</Text>
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

            {/* Office Filters */}
            {showOfficeFilter && (
                <View style={{
                    paddingHorizontal: SPACING.base,
                    marginBottom: SPACING.base,
                    marginTop: SPACING.sm
                }}>
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

            {/* Stats */}
            <Card style={styles.statsCard}>
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Icon name="calendar-check" size={ICON_SIZES.md} color={COLORS.success} />
                        <View style={styles.statInfo}>
                            <Text style={styles.statValue}>{filteredAttendance.length}</Text>
                            <Text style={styles.statLabel}>Total Records</Text>
                        </View>
                    </View>
                </View>
            </Card>

            {/* Attendance List */}
            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {Array.isArray(filteredAttendance) && filteredAttendance.map((record) => (
                    <Card key={record._id} style={styles.attendanceCard}>
                        <View style={styles.attendanceHeader}>
                            <Avatar name={record.user?.name || 'Unknown'} size={40} />
                            <View style={styles.attendanceInfo}>
                                <Text style={styles.employeeName}>{record.user?.name || 'Unknown'}</Text>
                                <Text style={styles.officeName}>{record.office?.name || 'N/A'}</Text>
                            </View>
                            <View style={styles.dateContainer}>
                                <Text style={styles.dateText}>{formatDate(record.date)}</Text>
                                <Text style={styles.timeText}>{formatTime(record.createdAt)}</Text>
                            </View>
                        </View>

                        <View style={styles.locationContainer}>
                            <Icon name="map-marker" size={ICON_SIZES.sm} color={COLORS.textLight} />
                            <Text style={styles.locationText}>
                                {record.location.latitude.toFixed(6)}, {record.location.longitude.toFixed(6)}
                            </Text>
                        </View>
                    </Card>
                ))}

                {(!filteredAttendance || filteredAttendance.length === 0) && (
                    <View style={styles.emptyContainer}>
                        <Icon name="calendar-blank-outline" size={64} color={COLORS.textLight} />
                        <Text style={styles.emptyText}>No attendance records found</Text>
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
    statsCard: {
        marginHorizontal: SPACING.base,
        marginVertical: SPACING.base,
    },
    statsRow: {
        flexDirection: 'row',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    statInfo: {
        gap: SPACING.xs,
    },
    statValue: {
        fontSize: TYPOGRAPHY.fontSize.xl,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    statLabel: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    content: {
        flex: 1,
        paddingHorizontal: SPACING.base,
    },
    attendanceCard: {
        marginBottom: SPACING.base,
    },
    attendanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    attendanceInfo: {
        flex: 1,
        marginLeft: SPACING.md,
    },
    employeeName: {
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
    },
    officeName: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    dateContainer: {
        alignItems: 'flex-end',
    },
    dateText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textPrimary,
    },
    timeText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
        marginTop: 2,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
    },
    locationText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
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
});

export default AttendanceScreen;
