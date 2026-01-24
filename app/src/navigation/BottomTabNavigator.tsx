/**
 * Bottom Tab Navigator
 * Main tab navigation matching UI references
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { COLORS, TYPOGRAPHY } from '../constants/theme';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens (we'll create these next)
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import OfficesScreen from '../screens/offices/OfficesScreen';
import EmployeeDirectoryScreen from '../screens/employees/EmployeeDirectoryScreen';
import AttendanceScreen from '../screens/attendance/AttendanceScreen';
import MoreScreen from '../screens/more/MoreScreen';

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
                name="Offices"
                component={OfficesScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="office-building" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Directory"
                component={EmployeeDirectoryScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="account-group" size={size} color={color} />
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
                name="More"
                component={MoreScreen}
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
