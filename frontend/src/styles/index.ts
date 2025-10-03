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

// Accessibility Utilities
export type {
    ColorBlindnessType,
    WCAGLevel,
    AccessibilityValidationResult,
    ColorCombination,
} from './accessibility-utils';

export {
    validateWCAGAA,
    validateWCAGAAA,
    validateDesignSystemContrast,
    simulateColorBlindness,
    validateColorBlindFriendly,
    generateAccessibleAlternatives,
    applyAccessibilityEnhancements,
    generateAccessibilityReport,
    createAccessibleStatusIndicator,
    createAccessibleProgressBar,
    initializeAccessibility,
} from './accessibility-utils';

// Responsive Utilities
export type {
    Breakpoint,
    DeviceInfo,
} from './responsive-utils';

export {
    BREAKPOINTS,
    getDeviceInfo,
    matchesBreakpoint,
    getCurrentBreakpoint,
    getResponsiveValue,
    getTouchTargetSize,
    applyResponsiveClasses,
    getResponsiveFontSize,
    getResponsiveSpacing,
    isDarkMode,
    toggleDarkMode,
    initializeDarkMode,
    getResponsiveColumns,
    setResponsiveProperties,
    getResponsiveImageSrc,
    initializeResponsiveDesign,
    getAnimationDuration,
    createBreakpointObserver,
} from './responsive-utils';

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
    INPUT_SM: 'input-sm',
    INPUT_MD: 'input-md',
    INPUT_LG: 'input-lg',
    INPUT_SUCCESS: 'input-success',
    INPUT_WARNING: 'input-warning',
    INPUT_ERROR: 'input-error',
    TEXTAREA_BASE: 'textarea-base',
    SELECT_BASE: 'select-base',
    CHECKBOX_BASE: 'checkbox-base',
    RADIO_BASE: 'radio-base',
    LABEL_BASE: 'label-base',
    LABEL_REQUIRED: 'label-required',
    LABEL_OPTIONAL: 'label-optional',
    FORM_GROUP: 'form-group',
    FORM_GROUP_INLINE: 'form-group-inline',
    FORM_ERROR_MESSAGE: 'form-error-message',
    FORM_SUCCESS_MESSAGE: 'form-success-message',
    FORM_WARNING_MESSAGE: 'form-warning-message',
    FORM_HELP_TEXT: 'form-help-text',
    FORM_LOADING: 'form-loading',
    FORM_SUCCESS_BANNER: 'form-success-banner',
    FORM_ERROR_BANNER: 'form-error-banner',
    FORM_LOADING_SPINNER: 'form-loading-spinner',
    FORM_PROGRESS_BAR: 'form-progress-bar',
    FORM_PROGRESS_FILL: 'form-progress-fill',
    FORM_PROGRESS_FILL_SUCCESS: 'form-progress-fill-success',
    FORM_PROGRESS_FILL_ERROR: 'form-progress-fill-error',
    BTN_LOADING: 'btn-loading',
    FORM_VALIDATION_SUMMARY: 'form-validation-summary',
    FORM_VALIDATION_SUMMARY_TITLE: 'form-validation-summary-title',
    FORM_VALIDATION_SUMMARY_LIST: 'form-validation-summary-list',
    FORM_VALIDATION_SUMMARY_ITEM: 'form-validation-summary-item',
    FORM_STEPS: 'form-steps',
    FORM_STEP: 'form-step',
    FORM_STEP_ACTIVE: 'form-step-active',
    FORM_STEP_COMPLETED: 'form-step-completed',
    FORM_STEP_NUMBER: 'form-step-number',
    FORM_STEP_TITLE: 'form-step-title',

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

    // Accessibility Classes
    STATUS_INDICATOR: 'status-indicator',
    STATUS_SUCCESS: 'status-success',
    STATUS_WARNING: 'status-warning',
    STATUS_ERROR: 'status-error',
    STATUS_INFO: 'status-info',
    PROGRESS_BAR_ACCESSIBLE: 'progress-bar-accessible',
    QUIZ_OPTION: 'quiz-option',
    QUIZ_OPTION_CORRECT: 'quiz-option-correct',
    QUIZ_OPTION_INCORRECT: 'quiz-option-incorrect',
    QUIZ_OPTION_ACTIVE: 'quiz-option-active',
    BADGE_ACCESSIBLE: 'badge-accessible',
    BADGE_SUCCESS_ACCESSIBLE: 'badge-success-accessible',
    BADGE_WARNING_ACCESSIBLE: 'badge-warning-accessible',
    BADGE_ERROR_ACCESSIBLE: 'badge-error-accessible',
    BADGE_INFO_ACCESSIBLE: 'badge-info-accessible',
    ALERT_ACCESSIBLE: 'alert-accessible',
    ALERT_SUCCESS_ACCESSIBLE: 'alert-success-accessible',
    ALERT_WARNING_ACCESSIBLE: 'alert-warning-accessible',
    ALERT_ERROR_ACCESSIBLE: 'alert-error-accessible',
    ALERT_INFO_ACCESSIBLE: 'alert-info-accessible',
    FOCUS_VISIBLE: 'focus-visible',
    SR_ONLY: 'sr-only',
    SKIP_LINK: 'skip-link',

    // Responsive Classes
    COURSE_GRID: 'course-grid',
    METRIC_GRID: 'metric-grid',
    THEME_TOGGLE: 'theme-toggle',
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