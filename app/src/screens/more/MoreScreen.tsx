/**
 * More Screen
 * Settings, profile, and logout
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { showToast } from '../../utils/toast';
import { COLORS, TYPOGRAPHY, SPACING, ICON_SIZES } from '../../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const MoreScreen: React.FC = () => {
    const { user, logout } = useAuth();

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            showToast.success('Logged Out', 'See you soon!');
        } catch (error) {
            console.error('Logout error:', error);
            showToast.error('Error', 'Failed to logout');
        }
    };

    const getRoleDisplay = (role: string): string => {
        return role.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    const menuItems = [
        {
            icon: 'gift',
            label: 'Goodies',
            onPress: () => showToast.info('Coming Soon', 'Goodies management feature'),
        },
        {
            icon: 'map-marker-check',
            label: 'Location Requests',
            onPress: () => showToast.info('Coming Soon', 'Location requests feature'),
        },
        {
            icon: 'cog',
            label: 'Settings',
            onPress: () => showToast.info('Coming Soon', 'Settings feature'),
        },
        {
            icon: 'help-circle',
            label: 'Help & Support',
            onPress: () => showToast.info('Coming Soon', 'Help & support feature'),
        },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>More</Text>
            </View>

            <ScrollView style={styles.content}>
                {/* Profile Card */}
                <Card style={styles.profileCard}>
                    <View style={styles.profileHeader}>
                        <Avatar name={user?.name || 'User'} size={64} />
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>{user?.name}</Text>
                            <Text style={styles.profileRole}>{getRoleDisplay(user?.role || '')}</Text>
                            <Text style={styles.profileEmail}>{user?.email}</Text>
                        </View>
                    </View>
                </Card>

                {/* Menu Items */}
                <View style={styles.menuSection}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.menuItem}
                            onPress={item.onPress}
                        >
                            <View style={styles.menuItemLeft}>
                                <Icon name={item.icon} size={ICON_SIZES.md} color={COLORS.textSecondary} />
                                <Text style={styles.menuItemText}>{item.label}</Text>
                            </View>
                            <Icon name="chevron-right" size={ICON_SIZES.md} color={COLORS.textLight} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Icon name="logout" size={ICON_SIZES.md} color={COLORS.danger} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                {/* App Info */}
                <View style={styles.appInfo}>
                    <Text style={styles.appInfoText}>SAANVIKA Admin Dashboard</Text>
                    <Text style={styles.appInfoText}>Version 1.0.0</Text>
                </View>
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
        paddingHorizontal: SPACING.base,
        paddingTop: SPACING['4xl'],
        paddingBottom: SPACING.base,
        backgroundColor: COLORS.backgroundLight,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize['2xl'],
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    content: {
        flex: 1,
        padding: SPACING.base,
    },
    profileCard: {
        marginBottom: SPACING.base,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.base,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    profileRole: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.primary,
        marginTop: SPACING.xs,
    },
    profileEmail: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    menuSection: {
        backgroundColor: COLORS.backgroundLight,
        borderRadius: SPACING.md,
        marginBottom: SPACING.base,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.base,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.md,
    },
    menuItemText: {
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.textPrimary,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.sm,
        backgroundColor: COLORS.dangerLight,
        padding: SPACING.base,
        borderRadius: SPACING.md,
        marginBottom: SPACING.xl,
    },
    logoutText: {
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.danger,
    },
    appInfo: {
        alignItems: 'center',
        paddingVertical: SPACING.xl,
    },
    appInfoText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
        marginBottom: SPACING.xs,
    },
});

export default MoreScreen;
