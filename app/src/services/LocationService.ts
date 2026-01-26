/**
 * Location Service
 * Handles geolocation and permissions
 */

import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export interface Coordinates {
    latitude: number;
    longitude: number;
}

export const LocationService = {
    /**
     * Request location permissions
     */
    async requestPermission(): Promise<boolean> {
        if (Platform.OS === 'ios') {
            Geolocation.requestAuthorization();
            return true;
        }

        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: 'Location Permission',
                        message: 'App needs access to your location to share it.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }

        return false;
    },

    /**
     * Get current position with fallback
     */
    getCurrentPosition(highAccuracy: boolean = true): Promise<Coordinates> {
        return new Promise((resolve, reject) => {
            Geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    // If high accuracy fails, try with low accuracy
                    if (error.code === 3) { // Timeout
                        console.log('🔄 High accuracy timed out, retrying with low accuracy...');
                        Geolocation.getCurrentPosition(
                            (position) => {
                                resolve({
                                    latitude: position.coords.latitude,
                                    longitude: position.coords.longitude,
                                });
                            },
                            (err) => reject(err),
                            {
                                enableHighAccuracy: false,
                                timeout: 15000,
                                maximumAge: 10000,
                            }
                        );
                    } else {
                        reject(error);
                    }
                },
                {
                    enableHighAccuracy: highAccuracy,
                    timeout: 30000, // Increased to 30s
                    maximumAge: 10000,
                }
            );
        });
    },
};

export default LocationService;
