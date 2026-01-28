/**
 * Bottom Tab Navigator
 * Main tab navigation with core features accessible to all roles
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import AttendanceScreen from '../screens/attendance/AttendanceScreen';
import GoodiesScreen from '../screens/goodies/GoodiesScreen';
import LocationsScreen from '../screens/locations/LocationsScreen';
import MoreStackNavigator from './MoreStackNavigator';
import { notificationsApi } from '../api/notifications';
import { useFocusEffect } from '@react-navigation/native';

const Tab = createBottomTabNavigator();

// Tab Bar Icon Components
const TabIcon = ({ name, color, size, badgeCount }: { name: string; color: string; size: number, badgeCount?: number }) => (
    <View style={{ width: size, height: size }}>
        <Icon name={name} size={size} color={color} />
        {badgeCount !== undefined && badgeCount > 0 && (
            <View style={{
                position: 'absolute',
                right: -6,
                top: -3,
                backgroundColor: COLORS.danger,
                borderRadius: 9,
                width: 18,
                height: 18,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: COLORS.backgroundLight,
            }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {badgeCount > 9 ? '9+' : badgeCount}
                </Text>
            </View>
        )}
    </View>
);

import { View, Text } from 'react-native';

export const BottomTabNavigator: React.FC = () => {
    const [unreadCount, setUnreadCount] = React.useState(0);

    const fetchUnreadCount = React.useCallback(async () => {
        try {
            const data = await notificationsApi.getNotifications({ page: 1, limit: 1 });
            setUnreadCount(data.unreadCount || 0);
        } catch (error) {
            console.error('Error fetching unread count for tab:', error);
        }
    }, []);

    // We can't use useFocusEffect here easily because it's the navigator
    // But we can set up an interval or just fetch once and rely on focus of tabs
    React.useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textLight,
                tabBarStyle: {
                    backgroundColor: COLORS.backgroundLight,
                    borderTopColor: COLORS.border,
                    paddingBottom: 32,
                    paddingTop: 8,
                    height: 85,
                },
                tabBarLabelStyle: {
                    fontSize: TYPOGRAPHY.fontSize.xs,
                    fontWeight: TYPOGRAPHY.fontWeight.medium,
                },
            }}
        >
            <Tab.Screen
                name="Home"
                component={DashboardScreen}
                options={{
                    tabBarIcon: (props) => <TabIcon name="view-dashboard" {...props} />,
                }}
            />
            <Tab.Screen
                name="Attendance"
                component={AttendanceScreen}
                options={{
                    tabBarIcon: (props) => <TabIcon name="calendar-check" {...props} />,
                }}
            />
            <Tab.Screen
                name="Goodies"
                component={GoodiesScreen}
                options={{
                    tabBarIcon: (props) => <TabIcon name="gift" {...props} />,
                }}
            />
            <Tab.Screen
                name="Locations"
                component={LocationsScreen}
                options={{
                    tabBarIcon: (props) => <TabIcon name="map-marker" {...props} />,
                }}
            />
            <Tab.Screen
                name="More"
                component={MoreStackNavigator}
                options={{
                    tabBarIcon: (props) => <TabIcon name="dots-horizontal" {...props} badgeCount={unreadCount} />,
                }}
                listeners={({ navigation }) => ({
                    tabPress: () => {
                        // Navigate to the 'More' tab and reset to 'MoreMain'
                        navigation.navigate('More', { screen: 'MoreMain' });
                    },
                })}
            />
        </Tab.Navigator>
    );
};

export default BottomTabNavigator;
