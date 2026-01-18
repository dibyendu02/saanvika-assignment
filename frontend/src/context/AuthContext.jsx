import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                // Check if token is expired
                if (decoded.exp * 1000 < Date.now()) {
                    logout();
                } else {
                    setUser(decoded);
                    // Fetch full user profile to get office details
                    fetchUserProfile();
                }
            } catch (error) {
                logout();
            }
        }
        setLoading(false);
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await api.get('/users/profile');
            const userData = response.data.data.user;
            setUser(prev => ({
                ...prev,
                ...userData,
                assignedOffice: userData.assignedOfficeId,
                primaryOffice: userData.primaryOfficeId,
            }));
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
        }
    };

    const login = async (email, password) => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { token, user: userData } = response.data.data;
            localStorage.setItem('token', token);
            const decoded = jwtDecode(token);
            setUser({
                ...decoded,
                ...userData,
                assignedOffice: userData.assignedOfficeId,
                primaryOffice: userData.primaryOfficeId,
            });
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed',
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    // Helper function: Check if user is super admin
    const isSuperAdmin = () => {
        return user?.role === 'super_admin';
    };

    // Helper function: Check if user is admin
    const isAdmin = () => {
        return user?.role === 'admin';
    };

    // Helper function: Check if user is admin or super admin
    const isAdminOrSuperAdmin = () => {
        return user?.role === 'admin' || user?.role === 'super_admin';
    };

    // Helper function: Get assigned office (for admins)
    const getAssignedOffice = () => {
        return user?.assignedOffice || null;
    };

    // Helper function: Get primary office (for internal/external)
    const getPrimaryOffice = () => {
        return user?.primaryOffice || null;
    };

    // Helper function: Get user's office (assigned for admin, primary for others)
    const getUserOffice = () => {
        if (user?.role === 'admin') {
            return user?.assignedOffice;
        }
        return user?.primaryOffice;
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            isSuperAdmin,
            isAdmin,
            isAdminOrSuperAdmin,
            getAssignedOffice,
            getPrimaryOffice,
            getUserOffice,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
