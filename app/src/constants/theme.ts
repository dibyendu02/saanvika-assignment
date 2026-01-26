/**
 * Theme Constants
 * Design tokens matching the UI references
 */

export const COLORS = {
    // Brand Colors - High Fidelity Navy and Gold
    primary: '#002B45',      // Deep Brand Navy
    primaryLight: '#003A5C',
    primaryDark: '#001D2E',

    secondary: '#C5A059',    // Brand Gold
    secondaryLight: '#D4B476',
    secondaryDark: '#A6823D',

    accent: '#C5A059',       // Alias for Brand Gold

    // Background colors
    background: '#FFFFFF',   // Pristine White
    backgroundLight: '#F8F9FA',
    backgroundDark: '#E9ECEF',

    // Text colors
    textPrimary: '#1A1A1A',
    textSecondary: '#4A4A4A',
    textLight: '#8E8E8E',
    textWhite: '#FFFFFF',
    textGold: '#C5A059',

    // Status colors - Refined palette
    success: '#10B981',
    successLight: '#ECFDF5',
    warning: '#F59E0B',
    warningLight: '#FFFBEB',
    danger: '#EF4444',
    dangerLight: '#FEF2F2',
    info: '#002B45',         // Use navy for info to match brand
    infoLight: '#E6EAED',

    // UI colors
    border: '#DEE2E6',
    borderLight: '#F1F3F5',
    shadow: '#00000010',

    // Badge colors
    activeGreen: '#10B981',
    activeBg: '#ECFDF5',
    inactiveBg: '#F1F3F5',
    inactiveText: '#8E8E8E',
};

export const TYPOGRAPHY = {
    // Font families - Matching web app (Poppins)
    fontFamily: {
        regular: 'Poppins-Regular',
        medium: 'Poppins-Medium',
        semibold: 'Poppins-SemiBold',
        bold: 'Poppins-Bold',
    },

    // Font sizes
    fontSize: {
        xs: 10,
        sm: 12,
        base: 14,
        md: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 28,
        '4xl': 32,
    },

    // Font weights
    fontWeight: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },

    // Line heights
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
};

export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    '2xl': 32,
    '3xl': 40,
    '4xl': 48,
};

export const BORDER_RADIUS = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
};

export const SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 2,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
};

export const ICON_SIZES = {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 40,
};

export default {
    COLORS,
    TYPOGRAPHY,
    SPACING,
    BORDER_RADIUS,
    SHADOWS,
    ICON_SIZES,
};
