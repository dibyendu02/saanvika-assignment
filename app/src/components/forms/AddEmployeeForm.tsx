/**
 * Add Employee Form Component  
 * Modal form for creating new employees
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
} from 'react-native';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Dropdown } from '../ui/Dropdown';
import { showToast } from '../../utils/toast';
import { employeesApi } from '../../api/employees';
import { useAuth } from '../../context/AuthContext';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import { Office } from '../../types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface AddEmployeeFormProps {
    isVisible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    offices: Office[];
}

const AddEmployeeForm: React.FC<AddEmployeeFormProps> = ({
    isVisible,
    onClose,
    onSuccess,
    offices,
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        employeeId: '',
        role: 'external',
        primaryOfficeId: '',
        phone: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        if (!formData.password || formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        if (!formData.primaryOfficeId) {
            newErrors.primaryOfficeId = 'Office is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await employeesApi.create({
                name: formData.name.trim(),
                email: formData.email.trim(),
                password: formData.password,
                employeeId: formData.employeeId.trim() || undefined,
                role: formData.role as any,
                primaryOfficeId: formData.primaryOfficeId,
                phone: formData.phone.trim() || undefined,
            });

            showToast.success('Success', 'Employee created successfully');
            resetForm();
            onSuccess();
            onClose();
        } catch (error: any) {
            showToast.error('Error', error.response?.data?.message || 'Failed to create employee');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            password: '',
            employeeId: '',
            role: 'external',
            primaryOfficeId: '',
            phone: '',
        });
        setErrors({});
    };

    return (
        <Modal
            visible={isVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Icon name="account-plus" size={24} color={COLORS.primary} />
                            <Text style={styles.title}>Add New Employee</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Icon name="close" size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                        <Input
                            label="Full Name"
                            value={formData.name}
                            onChangeText={(text) => {
                                setFormData({ ...formData, name: text });
                                if (errors.name) setErrors({ ...errors, name: '' });
                            }}
                            placeholder="Enter full name"
                            error={errors.name}
                        />

                        <Input
                            label="Employee ID (Optional)"
                            value={formData.employeeId}
                            onChangeText={(text) => setFormData({ ...formData, employeeId: text })}
                            placeholder="e.g., EMP001"
                        />

                        <Input
                            label="Email Address"
                            value={formData.email}
                            onChangeText={(text) => {
                                setFormData({ ...formData, email: text });
                                if (errors.email) setErrors({ ...errors, email: '' });
                            }}
                            placeholder="email@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            error={errors.email}
                        />

                        <Input
                            label="Password"
                            value={formData.password}
                            onChangeText={(text) => {
                                setFormData({ ...formData, password: text });
                                if (errors.password) setErrors({ ...errors, password: '' });
                            }}
                            placeholder="Min. 6 characters"
                            secureTextEntry
                            error={errors.password}
                        />

                        <Input
                            label="Phone Number (Optional)"
                            value={formData.phone}
                            onChangeText={(text) => setFormData({ ...formData, phone: text })}
                            placeholder="10-15 digits"
                            keyboardType="phone-pad"
                        />

                        <View style={styles.pickerContainer}>
                            <Text style={styles.label}>Role</Text>
                            <View style={styles.roleButtons}>
                                {(user?.role === 'super_admin' ? ['external', 'internal', 'admin'] : ['external', 'internal']).map((role) => (
                                    <TouchableOpacity
                                        key={role}
                                        style={[
                                            styles.roleButton,
                                            formData.role === role && styles.roleButtonActive,
                                        ]}
                                        onPress={() => setFormData({ ...formData, role })}
                                    >
                                        <Text
                                            style={[
                                                styles.roleButtonText,
                                                formData.role === role && styles.roleButtonTextActive,
                                            ]}
                                        >
                                            {role.charAt(0).toUpperCase() + role.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.pickerContainer}>
                            <Dropdown
                                label="Assigned Office *"
                                placeholder="Select an office"
                                options={offices.map(office => ({ label: office.name, value: office._id }))}
                                value={formData.primaryOfficeId}
                                onSelect={(value) => {
                                    setFormData({ ...formData, primaryOfficeId: value });
                                    if (errors.primaryOfficeId) setErrors({ ...errors, primaryOfficeId: '' });
                                }}
                                error={errors.primaryOfficeId}
                            />
                        </View>

                        <View style={styles.buttonContainer}>
                            <Button
                                title="Cancel"
                                onPress={onClose}
                                variant="outline"
                                style={styles.button}
                            />
                            <Button
                                title="Create Employee"
                                onPress={handleSubmit}
                                loading={loading}
                                style={styles.button}
                            />
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: COLORS.backgroundLight,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
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
    pickerContainer: {
        marginBottom: SPACING.base,
    },
    label: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textPrimary,
        marginBottom: SPACING.sm,
    },
    roleButtons: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    roleButton: {
        flex: 1,
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.base,
        borderRadius: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.backgroundLight,
        alignItems: 'center',
    },
    roleButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    roleButtonText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textSecondary,
    },
    roleButtonTextActive: {
        color: COLORS.textWhite,
    },
    officeButtons: {
        flexDirection: 'row',
        gap: SPACING.sm,
    },
    officeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.md,
        borderRadius: SPACING.sm,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.backgroundLight,
    },
    officeButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    officeButtonText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textSecondary,
    },
    officeButtonTextActive: {
        color: COLORS.textWhite,
    },
    errorText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.danger,
        marginTop: SPACING.xs,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginTop: SPACING.xl,
        marginBottom: SPACING['2xl'],
    },
    button: {
        flex: 1,
    },
});

export default AddEmployeeForm;
