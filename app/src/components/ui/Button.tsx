/**
 * Button Component
 * Reusable button with variants
 */

import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    loading?: boolean;
    style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    disabled = false,
    loading = false,
    style,
}) => {
    const buttonStyle: ViewStyle = {
        ...styles.base,
        ...styles[variant],
        ...styles[`size_${size}`],
        ...(disabled && styles.disabled),
        ...style,
    };

    const textStyle: TextStyle = {
        ...styles.text,
        ...styles[`text_${variant}`],
        ...styles[`text_size_${size}`],
        ...(disabled && styles.textDisabled),
    };

    return (
        <TouchableOpacity
            style={buttonStyle}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
        >
            {loading ? (
                <ActivityIndicator
                    color={variant === 'outline' ? COLORS.primary : COLORS.textWhite}
                />
            ) : (
                <Text style={textStyle}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        borderRadius: BORDER_RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },

    // Variants
    primary: {
        backgroundColor: COLORS.primary,
    },
    secondary: {
        backgroundColor: COLORS.backgroundDark,
    },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    danger: {
        backgroundColor: COLORS.danger,
    },

    // Sizes
    size_sm: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        minHeight: 36,
    },
    size_md: {
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        minHeight: 44,
    },
    size_lg: {
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.base,
        minHeight: 52,
    },

    // Disabled
    disabled: {
        opacity: 0.5,
    },

    // Text styles
    text: {
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    text_primary: {
        color: COLORS.textWhite,
    },
    text_secondary: {
        color: COLORS.textPrimary,
    },
    text_outline: {
        color: COLORS.primary,
    },
    text_danger: {
        color: COLORS.textWhite,
    },
    text_size_sm: {
        fontSize: TYPOGRAPHY.fontSize.sm,
    },
    text_size_md: {
        fontSize: TYPOGRAPHY.fontSize.base,
    },
    text_size_lg: {
        fontSize: TYPOGRAPHY.fontSize.md,
    },
    textDisabled: {
        opacity: 1,
    },
});

export default Button;
