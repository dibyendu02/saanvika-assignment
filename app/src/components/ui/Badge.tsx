/**
 * Badge Component
 * Status badges (Active, Inactive, etc.)
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface BadgeProps {
    label: string;
    variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
    style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
    label,
    variant = 'default',
    style,
}) => {
    return (
        <View style={[styles.badge, styles[variant], style]}>
            <Text style={[styles.text, styles[`text_${variant}`]]}>
                {label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: BORDER_RADIUS.sm,
        alignSelf: 'flex-start',
    },

    // Variants
    success: {
        backgroundColor: COLORS.activeBg,
    },
    warning: {
        backgroundColor: COLORS.warningLight,
    },
    danger: {
        backgroundColor: COLORS.dangerLight,
    },
    info: {
        backgroundColor: COLORS.infoLight,
    },
    default: {
        backgroundColor: COLORS.inactiveBg,
    },

    // Text styles
    text: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        textTransform: 'uppercase',
    },
    text_success: {
        color: COLORS.activeGreen,
    },
    text_warning: {
        color: COLORS.warning,
    },
    text_danger: {
        color: COLORS.danger,
    },
    text_info: {
        color: COLORS.info,
    },
    text_default: {
        color: COLORS.inactiveText,
    },
});

export default Badge;
