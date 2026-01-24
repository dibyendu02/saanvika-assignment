/**
 * Theme Constants
 * Design tokens matching the UI references
 */

export const COLORS = {
    // Primary colors - Deep blue from UI references
    primary: '#1E3A8A',
    primaryLight: '#3B82F6',
    primaryDark: '#1E40AF',

    // Background colors
    background: '#F5F7FA',
    backgroundLight: '#FFFFFF',
    backgroundDark: '#E5E7EB',

    // Text colors
    textPrimary: '#1F2937',
    textSecondary: '#6B7280',
    textLight: '#9CA3AF',
    textWhite: '#FFFFFF',

    // Status colors
    success: '#10B981',
    successLight: '#D1FAE5',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    danger: '#EF4444',
    dangerLight: '#FEE2E2',
    info: '#8B5CF6',
    infoLight: '#EDE9FE',

    // UI colors
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    shadow: '#00000015',

    // Badge colors
    activeGreen: '#10B981',
    activeBg: '#D1FAE5',
    inactiveBg: '#F3F4F6',
    inactiveText: '#6B7280',
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
