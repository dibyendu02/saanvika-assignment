/**
 * Notifications Screen
 * Display and manage user notifications
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi, Notification } from '../../api/notifications';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { showToast } from '../../utils/toast';
import { COLORS, TYPOGRAPHY, SPACING, ICON_SIZES } from '../../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatDistanceToNow } from 'date-fns';

export const NotificationsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [markingAllRead, setMarkingAllRead] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        total: 0,
    });

    useEffect(() => {
        fetchNotifications();
    }, [pagination.currentPage]);

    const fetchNotifications = useCallback(async () => {
        try {
            const data = await notificationsApi.getNotifications({
                page: pagination.currentPage,
                limit: 20,
            });
            setNotifications(data.notifications);
            setUnreadCount(data.unreadCount);
            setPagination({
                currentPage: data.currentPage,
                totalPages: data.totalPages,
                total: data.totalNotifications,
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            showToast.error('Error', 'Failed to load notifications');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [pagination.currentPage]);

    const onRefresh = () => {
        setRefreshing(true);
        setPagination({ ...pagination, currentPage: 1 });
        fetchNotifications();
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await notificationsApi.markAsRead(notificationId);
            // Update local state
            setNotifications(
                notifications.map((n) =>
                    n._id === notificationId ? { ...n, isRead: true } : n
                )
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
            showToast.error('Error', 'Failed to mark notification as read');
        }
    };

    const handleMarkAllAsRead = async () => {
        setMarkingAllRead(true);
        try {
            await notificationsApi.markAllAsRead();
            setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
            showToast.success('Success', 'All notifications marked as read');
        } catch (error) {
            console.error('Error marking all as read:', error);
            showToast.error('Error', 'Failed to mark all as read');
        } finally {
            setMarkingAllRead(false);
        }
    };

    const handleDeleteNotification = async (notificationId: string) => {
        try {
            await notificationsApi.deleteNotification(notificationId);
            setNotifications(notifications.filter((n) => n._id !== notificationId));
            showToast.success('Success', 'Notification deleted');
        } catch (error) {
            console.error('Error deleting notification:', error);
            showToast.error('Error', 'Failed to delete notification');
        }
    };

    const handleNotificationTap = async (notification: Notification) => {
        // Mark as read if unread
        if (!notification.isRead) {
            await handleMarkAsRead(notification._id);
        }

        // Navigate based on notification type
        switch (notification.type) {
            case 'location_request':
                navigation.navigate('More', {
                    screen: 'LocationRequests',
                });
                break;
            case 'location_shared':
                navigation.navigate('More', {
                    screen: 'Locations',
                });
                break;
            case 'goodies_distributed':
                navigation.navigate('More', {
                    screen: 'Goodies',
                });
                break;
            default:
                // Just mark as read, no navigation
                break;
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'location_request':
                return { name: 'map-marker-question', color: COLORS.warning };
            case 'location_shared':
                return { name: 'map-marker-check', color: COLORS.success };
            case 'goodies_distributed':
                return { name: 'gift', color: COLORS.info };
            default:
                return { name: 'bell', color: COLORS.primary };
        }
    };

    const formatTime = (dateString: string) => {
        try {
            return formatDistanceToNow(new Date(dateString), { addSuffix: true });
        } catch {
            return 'Recently';
        }
    };

    const renderNotificationCard = ({ item }: { item: Notification }) => {
        const iconConfig = getNotificationIcon(item.type);

        return (
            <TouchableOpacity
                onPress={() => handleNotificationTap(item)}
                activeOpacity={0.7}
            >
                <Card style={[styles.notificationCard, !item.isRead ? styles.unreadCard : null] as any}>
                    <View style={styles.cardContent}>
                        {/* Icon */}
                        <View style={[styles.iconContainer, { backgroundColor: iconConfig.color + '20' }]}>
                            <Icon name={iconConfig.name} size={ICON_SIZES.md} color={iconConfig.color} />
                        </View>

                        {/* Content */}
                        <View style={styles.textContent}>
                            <View style={styles.titleRow}>
                                <Text
                                    style={[
                                        styles.title,
                                        !item.isRead && styles.unreadTitle,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {item.title}
                                </Text>
                                <View style={styles.titleRight}>
                                    {!item.isRead && <View style={styles.unreadDot} />}
                                    <TouchableOpacity
                                        onPress={() => {
                                            handleDeleteNotification(item._id);
                                        }}
                                        style={styles.deleteButton}
                                    >
                                        <Icon name="close" size={16} color={COLORS.textLight} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <Text style={styles.message} numberOfLines={2}>
                                {item.message}
                            </Text>
                            <View style={styles.footer}>
                                <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
                                {item.sender && (
                                    <Text style={styles.sender}>• {item.sender.name}</Text>
                                )}
                            </View>
                        </View>
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Notifications</Text>
                    {unreadCount > 0 && (
                        <Text style={styles.subtitle}>
                            {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
                        </Text>
                    )}
                </View>
                {unreadCount > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onPress={handleMarkAllAsRead}
                        disabled={markingAllRead}
                        style={styles.markAllButton}
                    >
                        {markingAllRead ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                            <>
                                <Icon name="check-all" size={16} color={COLORS.primary} />
                                <Text style={styles.markAllText}>Mark all read</Text>
                            </>
                        )}
                    </Button>
                )}
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Loading notifications...</Text>
                </View>
            ) : notifications.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Icon name="bell-outline" size={64} color={COLORS.textLight} />
                    <Text style={styles.emptyTitle}>No Notifications</Text>
                    <Text style={styles.emptyText}>
                        You're all caught up! Check back later for updates.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderNotificationCard}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.base,
        paddingTop: SPACING['4xl'],
        paddingBottom: SPACING.base,
        backgroundColor: COLORS.backgroundLight,
    },
    headerTitle: {
        fontSize: TYPOGRAPHY.fontSize['2xl'],
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    markAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingHorizontal: SPACING.md,
    },
    markAllText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    listContent: {
        padding: SPACING.base,
    },
    notificationCard: {
        marginBottom: SPACING.md,
        padding: SPACING.md,
    },
    unreadCard: {
        borderLeftWidth: 3,
        borderLeftColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight + '10',
    },
    cardContent: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textContent: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: SPACING.xs,
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize.base,
        fontWeight: TYPOGRAPHY.fontWeight.medium,
        color: COLORS.textPrimary,
        flex: 1,
    },
    titleRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
    },
    deleteButton: {
        padding: SPACING.xs,
    },
    unreadTitle: {
        fontWeight: TYPOGRAPHY.fontWeight.bold,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        marginLeft: SPACING.xs,
    },
    message: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        lineHeight: TYPOGRAPHY.fontSize.sm * TYPOGRAPHY.lineHeight.relaxed,
        marginBottom: SPACING.sm,
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    time: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
    },
    sender: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.textLight,
        marginLeft: SPACING.xs,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.md,
    },
    loadingText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    emptyTitle: {
        fontSize: TYPOGRAPHY.fontSize.lg,
        fontWeight: TYPOGRAPHY.fontWeight.semibold,
        color: COLORS.textPrimary,
        marginTop: SPACING.base,
        marginBottom: SPACING.sm,
    },
    emptyText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});

export default NotificationsScreen;
