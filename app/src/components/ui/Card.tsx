/**
 * Card Component
 * Container with shadow and padding
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../constants/theme';

interface CardProps {
    children: ReactNode;
    style?: ViewStyle;
    padding?: number;
}

export const Card: React.FC<CardProps> = ({
    children,
    style,
    padding = SPACING.base,
}) => {
    return (
        <View style={[styles.card, { padding }, style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.backgroundLight,
        borderRadius: BORDER_RADIUS.lg,
        ...SHADOWS.md,
    },
});

export default Card;
