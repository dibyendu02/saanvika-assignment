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

const Tab = createBottomTabNavigator();

export const BottomTabNavigator: React.FC = () => {
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
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="view-dashboard" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Attendance"
                component={AttendanceScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="calendar-check" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Goodies"
                component={GoodiesScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="gift" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Locations"
                component={LocationsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="map-marker" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="More"
                component={MoreStackNavigator}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="dots-horizontal" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default BottomTabNavigator;
