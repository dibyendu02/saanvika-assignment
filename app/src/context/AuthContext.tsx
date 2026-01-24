/**
 * Authentication Context
 * Manages user authentication state and provides auth functions
 */

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/auth';
import { User, AuthResponse } from '../types';
import fcmService from '../services/fcmService';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (userData: any) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from storage on mount
    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const [token, userJson] = await Promise.all([
                AsyncStorage.getItem('token'),
                AsyncStorage.getItem('user'),
            ]);

            if (token && userJson) {
                setUser(JSON.parse(userJson));
            }
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const response: AuthResponse = await authApi.login(email, password);

            // Save token and user to storage
            await AsyncStorage.setItem('token', response.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.user));

            setUser(response.user);

            // Register FCM token after successful login
            try {
                await fcmService.registerToken();
            } catch (fcmError) {
                console.error('FCM registration error:', fcmError);
                // Don't fail login if FCM registration fails
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    };

    const register = async (userData: any) => {
        try {
            const response: AuthResponse = await authApi.register(userData);

            // Save token and user to storage
            await AsyncStorage.setItem('token', response.token);
            await AsyncStorage.setItem('user', JSON.stringify(response.user));

            setUser(response.user);

            // Register FCM token after successful registration
            try {
                await fcmService.registerToken();
            } catch (fcmError) {
                console.error('FCM registration error:', fcmError);
                // Don't fail registration if FCM registration fails
            }
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            // Remove FCM token before logout
            try {
                await fcmService.removeToken();
            } catch (fcmError) {
                console.error('FCM removal error:', fcmError);
                // Continue with logout even if FCM removal fails
            }

            // Clear storage and state
            await AsyncStorage.multiRemove(['token', 'user']);
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear state even if storage removal fails
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
