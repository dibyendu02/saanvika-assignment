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
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { showToast } from '../../utils/toast';
import { COLORS, TYPOGRAPHY, SPACING, ICON_SIZES } from '../../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export const MoreScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
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

    // Role-based access control
    const isSuperAdmin = user?.role === 'super_admin';
    const isAdmin = user?.role === 'admin';
    const isInternal = user?.role === 'internal';
    const isExternal = user?.role === 'external';

    const menuItems = [
        {
            icon: 'bell',
            label: 'Notifications',
            onPress: () => navigation.navigate('Notifications'),
            roles: ['super_admin', 'admin', 'internal', 'external'],
        },
        {
            icon: 'office-building',
            label: 'Offices',
            onPress: () => navigation.navigate('Offices'),
            roles: ['super_admin'],
        },
        {
            icon: 'account-group',
            label: 'Employees',
            onPress: () => navigation.navigate('Employees'),
            roles: ['super_admin', 'admin', 'internal'],
        },
        {
            icon: 'map-marker-check',
            label: 'Location Requests',
            onPress: () => navigation.navigate('LocationRequests'),
            roles: ['super_admin', 'admin', 'internal', 'external'],
        },
        {
            icon: 'cog',
            label: 'Settings',
            onPress: () => showToast.info('Coming Soon', 'Settings feature'),
            roles: ['super_admin', 'admin', 'internal', 'external'],
        },
        {
            icon: 'help-circle',
            label: 'Help & Support',
            onPress: () => showToast.info('Coming Soon', 'Help & support feature'),
            roles: ['super_admin', 'admin', 'internal', 'external'],
        },
    ].filter(item => item.roles.includes(user?.role || ''));

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
                                <Icon name={item.icon} size={ICON_SIZES.md} color={COLORS.secondary} />
                                <Text style={styles.menuItemText}>{item.label}</Text>
                            </View>
                            <Icon name="chevron-right" size={ICON_SIZES.md} color={COLORS.textLight} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                <Button
                    variant="danger"
                    onPress={handleLogout}
                    style={styles.logoutButton}
                >
                    <Icon name="logout" size={ICON_SIZES.md} color={COLORS.textWhite} style={{ marginRight: SPACING.sm }} />
                    <Text style={[styles.logoutText, { color: COLORS.textWhite }]}>Logout</Text>
                </Button>

                <View style={styles.appInfo}>
                    <Text style={styles.appInfoText}>SAANVIKA Console</Text>
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
        color: COLORS.secondary,
        marginTop: SPACING.xs,
        fontWeight: '700',
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
        marginBottom: SPACING.xl,
    },
    logoutText: {
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
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
