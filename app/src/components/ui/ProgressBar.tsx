/**
 * ProgressBar Component
 * Progress indicator for office targets
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface ProgressBarProps {
    current: number;
    target: number;
    showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    current,
    target,
    showPercentage = true,
}) => {
    const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;

    const getColor = (percent: number): string => {
        if (percent >= 90) return COLORS.success;
        if (percent >= 50) return COLORS.warning;
        return COLORS.danger;
    };

    return (
        <View style={styles.container}>
            <View style={styles.barContainer}>
                <View style={styles.barBackground}>
                    <View
                        style={[
                            styles.barFill,
                            {
                                width: `${percentage}%`,
                                backgroundColor: getColor(percentage),
                            },
                        ]}
                    />
                </View>
                {showPercentage && (
                    <Text style={[styles.percentage, { color: getColor(percentage) }]}>
                        {Math.round(percentage)}%
                    </Text>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    barContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    barBackground: {
        flex: 1,
        height: 8,
        backgroundColor: COLORS.borderLight,
        borderRadius: BORDER_RADIUS.full,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: BORDER_RADIUS.full,
    },
    percentage: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        minWidth: 40,
        textAlign: 'right',
    },
});

export default ProgressBar;
