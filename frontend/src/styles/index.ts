// Design System Exports

// Types
export type {
    ColorShade,
    ColorPalette,
    AccentColors,
    DesignSystemColors,
    ButtonVariant,
    BadgeVariant,
    AlertVariant,
    CardVariant,
} from './types';

export {
    CSS_VARIABLES,
    getColorValue,
    setColorValue,
    WCAG_AA_CONTRAST_RATIO,
    WCAG_AAA_CONTRAST_RATIO,
    ACCESSIBLE_COLOR_COMBINATIONS,
} from './types';

// Utilities
export {
    supportsCSSCustomProperties,
    getCSSVariable,
    setCSSVariable,
    hexToRgb,
    getRelativeLuminance,
    getContrastRatio,
    meetsWCAGAA,
    getColorClassName,
    applyTheme,
    resetTheme,
    getCurrentTheme,
    isValidColor,
    generateColorPalette,
    prefersDarkMode,
    prefersHighContrast,
    prefersReducedMotion,
    addFeatureDetectionClasses,
} from './utils';

// CSS Classes - these correspond to the classes defined in design-system.css
export const DESIGN_SYSTEM_CLASSES = {
    // Button Classes
    BTN_BASE: 'btn-base',
    BTN_PRIMARY: 'btn-primary',
    BTN_SECONDARY: 'btn-secondary',
    BTN_SUCCESS: 'btn-success',
    BTN_WARNING: 'btn-warning',
    BTN_ERROR: 'btn-error',
    BTN_OUTLINE_PRIMARY: 'btn-outline-primary',
    BTN_OUTLINE_SECONDARY: 'btn-outline-secondary',

    // Card Classes
    CARD_BASE: 'card-base',
    CARD_PRIMARY: 'card-primary',
    CARD_SUCCESS: 'card-success',
    CARD_WARNING: 'card-warning',
    CARD_ERROR: 'card-error',

    // Navigation Classes
    NAV_LINK: 'nav-link',
    NAV_LINK_ACTIVE: 'nav-link-active',

    // Form Classes
    INPUT_BASE: 'input-base',
    INPUT_ERROR: 'input-error',
    INPUT_SUCCESS: 'input-success',

    // Progress Classes
    PROGRESS_BAR: 'progress-bar',
    PROGRESS_FILL: 'progress-fill',
    PROGRESS_FILL_SUCCESS: 'progress-fill-success',

    // Badge Classes
    BADGE_BASE: 'badge-base',
    BADGE_PRIMARY: 'badge-primary',
    BADGE_SUCCESS: 'badge-success',
    BADGE_WARNING: 'badge-warning',
    BADGE_ERROR: 'badge-error',

    // Alert Classes
    ALERT_BASE: 'alert-base',
    ALERT_INFO: 'alert-info',
    ALERT_SUCCESS: 'alert-success',
    ALERT_WARNING: 'alert-warning',
    ALERT_ERROR: 'alert-error',

    // Utility Classes
    TEXT_PRIMARY: 'text-primary',
    TEXT_SUCCESS: 'text-success',
    TEXT_WARNING: 'text-warning',
    TEXT_ERROR: 'text-error',
    BG_PRIMARY: 'bg-primary',
    BG_SUCCESS: 'bg-success',
    BG_WARNING: 'bg-warning',
    BG_ERROR: 'bg-error',
    BORDER_PRIMARY: 'border-primary',
    BORDER_SUCCESS: 'border-success',
    BORDER_WARNING: 'border-warning',
    BORDER_ERROR: 'border-error',
    COLOR_TRANSITION: 'color-transition',
} as const;

// Default color values for fallbacks
export const DEFAULT_COLORS = {
    PRIMARY: '#2563eb',
    SUCCESS: '#059669',
    WARNING: '#d97706',
    ERROR: '#dc2626',
    WHITE: '#ffffff',
    GRAY_50: '#f9fafb',
    GRAY_100: '#f3f4f6',
    GRAY_200: '#e5e7eb',
    GRAY_300: '#d1d5db',
    GRAY_400: '#9ca3af',
    GRAY_500: '#6b7280',
    GRAY_600: '#4b5563',
    GRAY_700: '#374151',
    GRAY_800: '#1f2937',
    GRAY_900: '#111827',
} as const;