/**
 * Login Screen
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { showToast } from '../../utils/toast';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = (): boolean => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await login(email.trim(), password);
            showToast.success('Login Successful', 'Welcome back!');
        } catch (error: any) {
            showToast.error(
                'Login Failed',
                error.response?.data?.message || 'Invalid email or password'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <Text style={styles.logo}>SAANVIKA</Text>
                    <Text style={styles.subtitle}>Admin Dashboard</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.title}>Login</Text>
                    <Text style={styles.description}>
                        Welcome back! Please login to continue.
                    </Text>

                    <Input
                        label="Email Address"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        placeholder="e.g. admin@company.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={errors.email}
                    />

                    <Input
                        label="Password"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        placeholder="Enter your password"
                        secureTextEntry
                        error={errors.password}
                    />

                    <Button
                        title="Login"
                        onPress={handleLogin}
                        loading={loading}
                        style={styles.loginButton}
                    />

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Register')}
                        style={styles.registerLink}
                    >
                        <Text style={styles.registerLinkText}>
                            Don't have an account? <Text style={styles.registerLinkHighlight}>Register</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: SPACING.xl,
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING['3xl'],
    },
    logo: {
        fontSize: TYPOGRAPHY.fontSize['3xl'],
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.primary,
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.textSecondary,
        marginTop: SPACING.xs,
    },
    form: {
        width: '100%',
    },
    title: {
        fontSize: TYPOGRAPHY.fontSize['2xl'],
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textPrimary,
        marginBottom: SPACING.xs,
    },
    description: {
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.textSecondary,
        marginBottom: SPACING.xl,
    },
    loginButton: {
        marginTop: SPACING.base,
    },
    registerLink: {
        marginTop: SPACING.xl,
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    registerLinkText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    registerLinkHighlight: {
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
    },
});

export default LoginScreen;
