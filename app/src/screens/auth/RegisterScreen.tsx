/**
 * Register Screen
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dropdown } from '../../components/ui/Dropdown';
import { showToast } from '../../utils/toast';
import { COLORS, TYPOGRAPHY, SPACING } from '../../constants/theme';
import officesApi from '../../api/offices';

export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { register } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [primaryOfficeId, setPrimaryOfficeId] = useState('');

    const [offices, setOffices] = useState<{ label: string; value: string }[]>([]);
    const [loadingOffices, setLoadingOffices] = useState(true);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        phone?: string;
        password?: string;
        primaryOfficeId?: string;
    }>({});

    useEffect(() => {
        fetchOffices();
    }, []);

    const fetchOffices = async () => {
        try {
            const data = await officesApi.getPublic();
            const officeOptions = data.map((office: any) => ({
                label: office.name,
                value: office._id,
            }));
            setOffices(officeOptions);
        } catch (error) {
            console.error('Error fetching offices:', error);
            showToast.error('Error', 'Failed to load offices');
        } finally {
            setLoadingOffices(false);
        }
    };

    const validate = (): boolean => {
        const newErrors: any = {};

        if (!name.trim()) newErrors.name = 'Name is required';

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!phone.trim()) {
            newErrors.phone = 'Phone number is required';
        } else if (!/^[0-9]{10,15}$/.test(phone)) {
            newErrors.phone = 'Phone must be 10-15 digits';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!primaryOfficeId) {
            newErrors.primaryOfficeId = 'Primary office is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validate()) return;

        setLoading(true);
        try {
            await register({
                name: name.trim(),
                email: email.trim().toLowerCase(),
                phone: phone.trim(),
                password,
                primaryOfficeId,
                role: 'external',
            });
            showToast.success(
                'Registration Successful',
                'Your account is pending verification. Please login after approval.'
            );
            navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
            });
        } catch (error: any) {
            console.error('Registration Failed:', error.response?.data);
            const rawMessage = error.response?.data?.message || '';

            // Backend join errors with ', '. We split them for better display and processing.
            const errorParts = rawMessage.split(',').map((s: string) => s.trim());
            const fieldErrors: any = {};
            const displayErrors: string[] = [];

            errorParts.forEach((part: string) => {
                const lowerPart = part.toLowerCase();
                if (lowerPart.includes('email')) {
                    fieldErrors.email = part;
                    displayErrors.push(part);
                } else if (lowerPart.includes('phone')) {
                    fieldErrors.phone = part;
                    displayErrors.push(part);
                } else if (lowerPart.includes('name')) {
                    fieldErrors.name = part;
                    displayErrors.push(part);
                } else if (lowerPart.includes('password')) {
                    fieldErrors.password = part;
                    displayErrors.push(part);
                } else if (lowerPart.includes('office')) {
                    fieldErrors.primaryOfficeId = part;
                    displayErrors.push(part);
                } else if (part) {
                    displayErrors.push(part);
                }
            });

            if (Object.keys(fieldErrors).length > 0) {
                setErrors(prev => ({ ...prev, ...fieldErrors }));
            }

            showToast.error(
                'Registration Failed',
                displayErrors.length > 0 ? displayErrors.join('\n') : 'Something went wrong. Please try again.'
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
                    <Text style={styles.subtitle}>Registration</Text>
                </View>

                <View style={styles.form}>
                    <Text style={styles.title}>Join Us</Text>
                    <Text style={styles.description}>
                        Create an account as an external employee.
                    </Text>

                    <Input
                        label="Full Name"
                        value={name}
                        onChangeText={(text) => {
                            setName(text);
                            if (errors.name) setErrors({ ...errors, name: undefined });
                        }}
                        placeholder="e.g. John Doe"
                        error={errors.name}
                    />

                    <Input
                        label="Email Address"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        placeholder="e.g. john@company.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        error={errors.email}
                    />

                    <Input
                        label="Phone Number"
                        value={phone}
                        onChangeText={(text) => {
                            setPhone(text);
                            if (errors.phone) setErrors({ ...errors, phone: undefined });
                        }}
                        placeholder="e.g. 9876543210"
                        keyboardType="phone-pad"
                        error={errors.phone}
                    />

                    {loadingOffices ? (
                        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
                    ) : (
                        <Dropdown
                            label="Primary Office"
                            placeholder="Select your office"
                            options={offices}
                            value={primaryOfficeId}
                            onSelect={(value) => {
                                setPrimaryOfficeId(value);
                                if (errors.primaryOfficeId) setErrors({ ...errors, primaryOfficeId: undefined });
                            }}
                            error={errors.primaryOfficeId}
                        />
                    )}

                    <Input
                        label="Password"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        placeholder="Create a password"
                        secureTextEntry
                        error={errors.password}
                    />

                    <Button
                        title="Register"
                        onPress={handleRegister}
                        loading={loading}
                        style={styles.registerButton}
                    />

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Login')}
                        style={styles.loginLink}
                    >
                        <Text style={styles.loginLinkText}>
                            Already have an account? <Text style={styles.loginLinkHighlight}>Login</Text>
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
        padding: SPACING.xl,
        paddingTop: SPACING['4xl'],
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
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
    registerButton: {
        marginTop: SPACING.base,
    },
    loginLink: {
        marginTop: SPACING.xl,
        alignItems: 'center',
        paddingVertical: SPACING.md,
    },
    loginLinkText: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.textSecondary,
    },
    loginLinkHighlight: {
        color: COLORS.primary,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
    },
});

export default RegisterScreen;
