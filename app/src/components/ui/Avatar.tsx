/**
 * Avatar Component
 * User avatar with initials fallback
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, TYPOGRAPHY } from '../../constants/theme';

interface AvatarProps {
    name: string;
    size?: number;
    style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
    name,
    size = 40,
    style,
}) => {
    const getInitials = (fullName: string): string => {
        const names = fullName.trim().split(' ');
        if (names.length >= 2) {
            return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return fullName.substring(0, 2).toUpperCase();
    };

    const getBackgroundColor = (str: string): string => {
        // Generate a consistent color based on the name
        const colors = [
            '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
            '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
        ];
        const index = str.charCodeAt(0) % colors.length;
        return colors[index];
    };

    return (
        <View
            style={[
                styles.avatar,
                {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: getBackgroundColor(name),
                },
                style,
            ]}
        >
            <Text style={[styles.initials, { fontSize: size * 0.4 }]}>
                {getInitials(name)}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    avatar: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    initials: {
        color: COLORS.textWhite,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
});

export default Avatar;
