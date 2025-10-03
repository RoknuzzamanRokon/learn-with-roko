// Design System Color Types

export type ColorShade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export interface ColorPalette {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
}

export interface AccentColors {
    purple: ColorPalette;
    teal: ColorPalette;
}

export interface DesignSystemColors {
    primary: ColorPalette;
    gray: ColorPalette;
    success: ColorPalette;
    warning: ColorPalette;
    error: ColorPalette;
    accent: AccentColors;
    white: string;
}

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline-primary' | 'outline-secondary';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export type CardVariant = 'base' | 'primary' | 'success' | 'warning' | 'error';

// CSS Custom Property Names
export const CSS_VARIABLES = {
    // Primary Colors
    PRIMARY_50: '--primary-50',
    PRIMARY_100: '--primary-100',
    PRIMARY_200: '--primary-200',
    PRIMARY_300: '--primary-300',
    PRIMARY_400: '--primary-400',
    PRIMARY_500: '--primary-500',
    PRIMARY_600: '--primary-600',
    PRIMARY_700: '--primary-700',
    PRIMARY_800: '--primary-800',
    PRIMARY_900: '--primary-900',

    // Gray Colors
    WHITE: '--white',
    GRAY_50: '--gray-50',
    GRAY_100: '--gray-100',
    GRAY_200: '--gray-200',
    GRAY_300: '--gray-300',
    GRAY_400: '--gray-400',
    GRAY_500: '--gray-500',
    GRAY_600: '--gray-600',
    GRAY_700: '--gray-700',
    GRAY_800: '--gray-800',
    GRAY_900: '--gray-900',

    // Status Colors
    SUCCESS_50: '--success-50',
    SUCCESS_100: '--success-100',
    SUCCESS_200: '--success-200',
    SUCCESS_300: '--success-300',
    SUCCESS_400: '--success-400',
    SUCCESS_500: '--success-500',
    SUCCESS_600: '--success-600',
    SUCCESS_700: '--success-700',
    SUCCESS_800: '--success-800',
    SUCCESS_900: '--success-900',

    WARNING_50: '--warning-50',
    WARNING_100: '--warning-100',
    WARNING_200: '--warning-200',
    WARNING_300: '--warning-300',
    WARNING_400: '--warning-400',
    WARNING_500: '--warning-500',
    WARNING_600: '--warning-600',
    WARNING_700: '--warning-700',
    WARNING_800: '--warning-800',
    WARNING_900: '--warning-900',

    ERROR_50: '--error-50',
    ERROR_100: '--error-100',
    ERROR_200: '--error-200',
    ERROR_300: '--error-300',
    ERROR_400: '--error-400',
    ERROR_500: '--error-500',
    ERROR_600: '--error-600',
    ERROR_700: '--error-700',
    ERROR_800: '--error-800',
    ERROR_900: '--error-900',

    // Accent Colors
    ACCENT_PURPLE_50: '--accent-purple-50',
    ACCENT_PURPLE_100: '--accent-purple-100',
    ACCENT_PURPLE_200: '--accent-purple-200',
    ACCENT_PURPLE_300: '--accent-purple-300',
    ACCENT_PURPLE_400: '--accent-purple-400',
    ACCENT_PURPLE_500: '--accent-purple-500',
    ACCENT_PURPLE_600: '--accent-purple-600',
    ACCENT_PURPLE_700: '--accent-purple-700',
    ACCENT_PURPLE_800: '--accent-purple-800',
    ACCENT_PURPLE_900: '--accent-purple-900',

    ACCENT_TEAL_50: '--accent-teal-50',
    ACCENT_TEAL_100: '--accent-teal-100',
    ACCENT_TEAL_200: '--accent-teal-200',
    ACCENT_TEAL_300: '--accent-teal-300',
    ACCENT_TEAL_400: '--accent-teal-400',
    ACCENT_TEAL_500: '--accent-teal-500',
    ACCENT_TEAL_600: '--accent-teal-600',
    ACCENT_TEAL_700: '--accent-teal-700',
    ACCENT_TEAL_800: '--accent-teal-800',
    ACCENT_TEAL_900: '--accent-teal-900',
} as const;

// Color utility functions
export const getColorValue = (variable: string): string => {
    if (typeof window !== 'undefined') {
        return getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    }
    return '';
};

export const setColorValue = (variable: string, value: string): void => {
    if (typeof window !== 'undefined') {
        document.documentElement.style.setProperty(variable, value);
    }
};

// Accessibility helpers
export const WCAG_AA_CONTRAST_RATIO = 4.5;
export const WCAG_AAA_CONTRAST_RATIO = 7;

// Color combinations that meet WCAG AA standards
export const ACCESSIBLE_COLOR_COMBINATIONS = [
    { foreground: CSS_VARIABLES.GRAY_900, background: CSS_VARIABLES.WHITE },
    { foreground: CSS_VARIABLES.GRAY_800, background: CSS_VARIABLES.GRAY_50 },
    { foreground: CSS_VARIABLES.GRAY_600, background: CSS_VARIABLES.GRAY_100 },
    { foreground: CSS_VARIABLES.WHITE, background: CSS_VARIABLES.PRIMARY_600 },
    { foreground: CSS_VARIABLES.WHITE, background: CSS_VARIABLES.SUCCESS_600 },
    { foreground: CSS_VARIABLES.WHITE, background: CSS_VARIABLES.WARNING_600 },
    { foreground: CSS_VARIABLES.WHITE, background: CSS_VARIABLES.ERROR_600 },
    { foreground: CSS_VARIABLES.PRIMARY_600, background: CSS_VARIABLES.PRIMARY_50 },
    { foreground: CSS_VARIABLES.SUCCESS_600, background: CSS_VARIABLES.SUCCESS_50 },
    { foreground: CSS_VARIABLES.WARNING_600, background: CSS_VARIABLES.WARNING_50 },
    { foreground: CSS_VARIABLES.ERROR_600, background: CSS_VARIABLES.ERROR_50 },
] as const;