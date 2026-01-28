import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    FlatList,
    StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

interface Option {
    label: string;
    value: string;
}

interface DropdownProps {
    label?: string;
    options: Option[];
    value: string;
    onSelect: (value: string) => void;
    placeholder?: string;
    error?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
    label,
    options,
    value,
    onSelect,
    placeholder = 'Select an option',
    error,
}) => {
    const [visible, setVisible] = useState(false);

    const selectedOption = options.find((opt) => opt.value === value);

    const handleSelect = (val: string) => {
        onSelect(val);
        setVisible(false);
    };

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}

            <TouchableOpacity
                style={[
                    styles.trigger,
                    error && styles.triggerError
                ]}
                onPress={() => setVisible(true)}
                activeOpacity={0.7}
            >
                <Text style={[
                    styles.valueText,
                    !selectedOption && styles.placeholderText
                ]}>
                    {selectedOption ? selectedOption.label : placeholder}
                </Text>
                <Icon name="chevron-down" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Modal
                visible={visible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <TouchableOpacity
                    style={styles.overlay}
                    activeOpacity={1}
                    onPress={() => setVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <FlatList
                            data={options}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.option,
                                        value === item.value && styles.selectedOption
                                    ]}
                                    onPress={() => handleSelect(item.value)}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        value === item.value && styles.selectedOptionText
                                    ]}>
                                        {item.label}
                                    </Text>
                                    {value === item.value && (
                                        <Icon name="check" size={20} color={COLORS.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                            style={styles.list}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 0,
    },
    label: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    trigger: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: SPACING.sm,
        padding: SPACING.md,
        backgroundColor: COLORS.background,
    },
    triggerError: {
        borderColor: COLORS.danger,
    },
    errorText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.danger,
        marginTop: SPACING.xs,
        marginBottom: SPACING.xs,
    },
    valueText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textPrimary,
        flex: 1,
    },
    placeholderText: {
        color: COLORS.textSecondary,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: SPACING.lg,
    },
    modalContent: {
        backgroundColor: COLORS.background,
        borderRadius: SPACING.md,
        maxHeight: '50%',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    list: {
        padding: SPACING.sm,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.borderLight,
    },
    selectedOption: {
        backgroundColor: COLORS.primaryLight + '10',
    },
    optionText: {
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.textPrimary,
    },
    selectedOptionText: {
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
});
