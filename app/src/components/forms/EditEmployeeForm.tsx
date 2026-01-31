/**
 * Edit Employee Form Component
 * Modal form for editing employee details (Employee ID)
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
} from 'react-native';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { showToast } from '../../utils/toast';
import { employeesApi } from '../../api/employees';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import { User } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface EditEmployeeFormProps {
    isVisible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    employee: User | null;
}

const EditEmployeeForm: React.FC<EditEmployeeFormProps> = ({
    isVisible,
    onClose,
    onSuccess,
    employee,
}) => {
    const [loading, setLoading] = useState(false);
    const [employeeId, setEmployeeId] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (employee) {
            setEmployeeId(employee.employeeId || '');
            setError('');
        }
    }, [employee]);

    const handleSubmit = async () => {
        if (!employee) return;

        setLoading(true);
        setError('');
        try {
            await employeesApi.update(employee._id, { employeeId: employeeId.trim() });
            showToast.success('Success', 'Employee ID updated successfully');
            onSuccess();
            onClose();
        } catch (err: any) {
            const message = err.response?.data?.message || 'Failed to update employee';
            setError(message);
            showToast.error('Error', message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setEmployeeId('');
        setError('');
        onClose();
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Icon name="account-edit" size={24} color={COLORS.primary} />
                            <Text style={styles.title}>Edit Employee ID</Text>
                        </View>
                        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                            <Icon name="close" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        <View style={styles.employeeInfo}>
                            <Text style={styles.employeeName}>{employee?.name}</Text>
                            <Text style={styles.employeeEmail}>{employee?.email}</Text>
                        </View>

                        <Input
                            label="Employee ID"
                            value={employeeId}
                            onChangeText={(text) => {
                                setEmployeeId(text);
                                if (error) setError('');
                            }}
                            placeholder="e.g., EMP001"
                            error={error}
                        />

                        <View style={styles.buttonContainer}>
                            <Button
                                title="Cancel"
                                onPress={handleClose}
                                variant="outline"
                                style={styles.button}
                            />
                            <Button
                                title="Save Changes"
                                onPress={handleSubmit}
                                loading={loading}
                                style={styles.button}
                            />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        paddingHorizontal: SPACING.base,
    },
    modalContent: {
        backgroundColor: COLORS.backgroundLight,
        borderRadius: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    closeButton: {
        padding: SPACING.xs,
    },
    content: {
        padding: SPACING.base,
    },
    employeeInfo: {
        marginBottom: SPACING.lg,
        paddingBottom: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    employeeName: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    employeeEmail: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.xl,
    },
    button: {
        flex: 1,
    },
});

export default EditEmployeeForm;
