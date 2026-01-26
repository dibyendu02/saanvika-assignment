/**
 * More Stack Navigator
 * Stack navigation for More tab and its sub-screens
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MoreScreen from '../screens/more/MoreScreen';
import OfficesScreen from '../screens/offices/OfficesScreen';
import EmployeeDirectoryScreen from '../screens/employees/EmployeeDirectoryScreen';
import GoodiesScreen from '../screens/goodies/GoodiesScreen';
import LocationRequestsScreen from '../screens/location-requests/LocationRequestsScreen';
import LocationsScreen from '../screens/locations/LocationsScreen';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';

const Stack = createStackNavigator();

export const MoreStackNavigator: React.FC = () => {
    return (
        <Stack.Navigator
            initialRouteName="MoreMain"
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="MoreMain" component={MoreScreen} />
            <Stack.Screen name="Offices" component={OfficesScreen} />
            <Stack.Screen name="Employees" component={EmployeeDirectoryScreen} />
            <Stack.Screen name="Goodies" component={GoodiesScreen} />
            <Stack.Screen name="LocationRequests" component={LocationRequestsScreen} />
            <Stack.Screen name="Locations" component={LocationsScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
        </Stack.Navigator>
    );
};

export default MoreStackNavigator;
