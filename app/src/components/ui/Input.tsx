/**
 * Input Component
 * Text input with label and validation
 */

import React from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ViewStyle,
    TextInputProps,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    containerStyle,
    style,
    ...props
}) => {
    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    error && styles.inputError,
                    style,
                ]}
                placeholderTextColor={COLORS.textLight}
                {...props}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.base,
    },
    label: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xs,
    },
    input: {
        backgroundColor: COLORS.backgroundLight,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.base,
        paddingVertical: SPACING.md,
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.textPrimary,
        minHeight: 44,
    },
    inputError: {
        borderColor: COLORS.danger,
    },
    errorText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.danger,
        marginTop: SPACING.xs,
    },
});

export default Input;
