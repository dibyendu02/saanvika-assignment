import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ViewStyle,
    TextInputProps,
    TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
    rightIcon?: string;
    onRightIconPress?: () => void;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    containerStyle,
    style,
    secureTextEntry,
    rightIcon,
    onRightIconPress,
    ...props
}) => {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    const isSecure = secureTextEntry && !isPasswordVisible;

    return (
        <View style={[styles.container, containerStyle]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={styles.inputContainer}>
                <TextInput
                    style={[
                        styles.input,
                        error && styles.inputError,
                        style,
                        (secureTextEntry || rightIcon) && { paddingRight: 50 }
                    ]}
                    placeholderTextColor={COLORS.textLight}
                    secureTextEntry={isSecure}
                    {...props}
                />
                {secureTextEntry ? (
                    <TouchableOpacity
                        style={styles.iconContainer}
                        onPress={togglePasswordVisibility}
                        activeOpacity={0.7}
                    >
                        <Icon
                            name={isPasswordVisible ? 'eye-off' : 'eye'}
                            size={20}
                            color={COLORS.textSecondary}
                        />
                    </TouchableOpacity>
                ) : rightIcon ? (
                    <TouchableOpacity
                        style={styles.iconContainer}
                        onPress={onRightIconPress}
                        disabled={!onRightIconPress}
                        activeOpacity={0.7}
                    >
                        <Icon
                            name={rightIcon}
                            size={20}
                            color={COLORS.textSecondary}
                        />
                    </TouchableOpacity>
                ) : null}
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.base,
    },
    label: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        fontWeight: TYPOGRAPHY.fontWeight.bold,
        color: COLORS.textSecondary,
        marginBottom: SPACING.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputContainer: {
        position: 'relative',
    },
    input: {
        backgroundColor: COLORS.backgroundLight,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: BORDER_RADIUS.md,
        paddingHorizontal: SPACING.base,
        paddingVertical: 14,
        fontSize: TYPOGRAPHY.fontSize.base,
        color: COLORS.textPrimary,
        minHeight: 48,
    },
    inputError: {
        borderColor: COLORS.danger,
    },
    errorText: {
        fontSize: TYPOGRAPHY.fontSize.xs,
        color: COLORS.danger,
        marginTop: SPACING.xs,
    },
    iconContainer: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default Input;
