// Accessibility Utility Functions for WCAG Compliance

import { CSS_VARIABLES, WCAG_AA_CONTRAST_RATIO, WCAG_AAA_CONTRAST_RATIO } from './types';
import { hexToRgb, getRelativeLuminance, getContrastRatio } from './utils';

/**
 * Color blindness simulation types
 */
export type ColorBlindnessType = 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

/**
 * WCAG compliance levels
 */
export type WCAGLevel = 'AA' | 'AAA';

/**
 * Accessibility validation result
 */
export interface AccessibilityValidationResult {
    isValid: boolean;
    contrastRatio: number;
    requiredRatio: number;
    level: WCAGLevel;
    recommendations?: string[];
}

/**
 * Color combination for validation
 */
export interface ColorCombination {
    foreground: string;
    background: string;
    context?: 'normal' | 'large' | 'ui';
}

/**
 * Validate WCAG AA contrast ratio for a color combination
 */
export const validateWCAGAA = (
    foreground: string,
    background: string,
    isLargeText: boolean = false
): AccessibilityValidationResult => {
    const contrastRatio = getContrastRatio(foreground, background);
    const requiredRatio = isLargeText ? 3 : WCAG_AA_CONTRAST_RATIO;

    return {
        isValid: contrastRatio >= requiredRatio,
        contrastRatio,
        requiredRatio,
        level: 'AA',
        recommendations: contrastRatio < requiredRatio ? [
            `Current contrast ratio: ${contrastRatio.toFixed(2)}`,
            `Required ratio: ${requiredRatio}`,
            'Consider using darker text or lighter background colors',
            'Test with actual users who have visual impairments'
        ] : undefined
    };
};

/**
 * Validate WCAG AAA contrast ratio for a color combination
 */
export const validateWCAGAAA = (
    foreground: string,
    background: string,
    isLargeText: boolean = false
): AccessibilityValidationResult => {
    const contrastRatio = getContrastRatio(foreground, background);
    const requiredRatio = isLargeText ? 4.5 : WCAG_AAA_CONTRAST_RATIO;

    return {
        isValid: contrastRatio >= requiredRatio,
        contrastRatio,
        requiredRatio,
        level: 'AAA',
        recommendations: contrastRatio < requiredRatio ? [
            `Current contrast ratio: ${contrastRatio.toFixed(2)}`,
            `Required ratio: ${requiredRatio}`,
            'Consider using higher contrast colors',
            'AAA compliance provides enhanced accessibility'
        ] : undefined
    };
};

/**
 * Validate all color combinations in the design system
 */
export const validateDesignSystemContrast = (): Record<string, AccessibilityValidationResult> => {
    const results: Record<string, AccessibilityValidationResult> = {};

    // Define critical color combinations to validate
    const combinations: Array<{ name: string; combination: ColorCombination }> = [
        {
            name: 'Primary Button',
            combination: { foreground: '#ffffff', background: '#2563eb' }
        },
        {
            name: 'Secondary Button',
            combination: { foreground: '#374151', background: '#f3f4f6' }
        },
        {
            name: 'Success Button',
            combination: { foreground: '#ffffff', background: '#059669' }
        },
        {
            name: 'Warning Button',
            combination: { foreground: '#ffffff', background: '#d97706' }
        },
        {
            name: 'Error Button',
            combination: { foreground: '#ffffff', background: '#dc2626' }
        },
        {
            name: 'Body Text',
            combination: { foreground: '#374151', background: '#ffffff' }
        },
        {
            name: 'Heading Text',
            combination: { foreground: '#111827', background: '#ffffff' }
        },
        {
            name: 'Secondary Text',
            combination: { foreground: '#6b7280', background: '#ffffff' }
        },
        {
            name: 'Primary Link',
            combination: { foreground: '#2563eb', background: '#ffffff' }
        },
        {
            name: 'Success Status',
            combination: { foreground: '#047857', background: '#ecfdf5' }
        },
        {
            name: 'Warning Status',
            combination: { foreground: '#b45309', background: '#fffbeb' }
        },
        {
            name: 'Error Status',
            combination: { foreground: '#b91c1c', background: '#fef2f2' }
        },
        {
            name: 'Navigation Active',
            combination: { foreground: '#2563eb', background: '#dbeafe' }
        }
    ];

    combinations.forEach(({ name, combination }) => {
        results[name] = validateWCAGAA(
            combination.foreground,
            combination.background,
            combination.context === 'large'
        );
    });

    return results;
};

/**
 * Simulate color blindness for a given color
 */
export const simulateColorBlindness = (color: string, type: ColorBlindnessType): string => {
    const rgb = hexToRgb(color);
    if (!rgb) return color;

    let { r, g, b } = rgb;

    // Normalize RGB values to 0-1 range
    r = r / 255;
    g = g / 255;
    b = b / 255;

    // Apply color blindness transformation matrices
    switch (type) {
        case 'protanopia': // Red-blind
            r = 0.567 * r + 0.433 * g;
            g = 0.558 * r + 0.442 * g;
            b = 0.242 * g + 0.758 * b;
            break;

        case 'deuteranopia': // Green-blind
            r = 0.625 * r + 0.375 * g;
            g = 0.7 * r + 0.3 * g;
            b = 0.3 * g + 0.7 * b;
            break;

        case 'tritanopia': // Blue-blind
            r = 0.95 * r + 0.05 * g;
            g = 0.433 * g + 0.567 * b;
            b = 0.475 * g + 0.525 * b;
            break;

        case 'achromatopsia': // Complete color blindness
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            r = g = b = gray;
            break;
    }

    // Convert back to 0-255 range and format as hex
    const rHex = Math.round(Math.max(0, Math.min(255, r * 255))).toString(16).padStart(2, '0');
    const gHex = Math.round(Math.max(0, Math.min(255, g * 255))).toString(16).padStart(2, '0');
    const bHex = Math.round(Math.max(0, Math.min(255, b * 255))).toString(16).padStart(2, '0');

    return `#${rHex}${gHex}${bHex}`;
};

/**
 * Test color combinations for color blindness accessibility
 */
export const validateColorBlindFriendly = (
    foreground: string,
    background: string
): Record<ColorBlindnessType, AccessibilityValidationResult> => {
    const results: Record<ColorBlindnessType, AccessibilityValidationResult> = {} as any;

    const colorBlindnessTypes: ColorBlindnessType[] = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];

    colorBlindnessTypes.forEach(type => {
        const simulatedFg = simulateColorBlindness(foreground, type);
        const simulatedBg = simulateColorBlindness(background, type);

        results[type] = validateWCAGAA(simulatedFg, simulatedBg);
    });

    return results;
};

/**
 * Generate accessible color alternatives
 */
export const generateAccessibleAlternatives = (
    foreground: string,
    background: string
): { foreground: string[]; background: string[] } => {
    const alternatives = {
        foreground: [] as string[],
        background: [] as string[]
    };

    const fgRgb = hexToRgb(foreground);
    const bgRgb = hexToRgb(background);

    if (!fgRgb || !bgRgb) return alternatives;

    // Generate darker foreground alternatives
    for (let i = 1; i <= 5; i++) {
        const factor = i * 0.15;
        const r = Math.max(0, Math.round(fgRgb.r * (1 - factor)));
        const g = Math.max(0, Math.round(fgRgb.g * (1 - factor)));
        const b = Math.max(0, Math.round(fgRgb.b * (1 - factor)));

        const altColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

        if (validateWCAGAA(altColor, background).isValid) {
            alternatives.foreground.push(altColor);
        }
    }

    // Generate lighter background alternatives
    for (let i = 1; i <= 5; i++) {
        const factor = i * 0.15;
        const r = Math.min(255, Math.round(bgRgb.r + (255 - bgRgb.r) * factor));
        const g = Math.min(255, Math.round(bgRgb.g + (255 - bgRgb.g) * factor));
        const b = Math.min(255, Math.round(bgRgb.b + (255 - bgRgb.b) * factor));

        const altColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

        if (validateWCAGAA(foreground, altColor).isValid) {
            alternatives.background.push(altColor);
        }
    }

    return alternatives;
};

/**
 * Check if user prefers high contrast mode
 */
export const prefersHighContrast = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches;
};

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Apply accessibility enhancements based on user preferences
 */
export const applyAccessibilityEnhancements = (): void => {
    if (typeof window === 'undefined') return;

    const html = document.documentElement;

    // Add classes based on user preferences
    if (prefersHighContrast()) {
        html.classList.add('prefers-high-contrast');
    }

    if (prefersReducedMotion()) {
        html.classList.add('prefers-reduced-motion');
    }

    // Add focus-visible polyfill support
    if (!('focus-visible' in window)) {
        html.classList.add('js-focus-visible');
    }
};

/**
 * Generate accessibility report for the design system
 */
export const generateAccessibilityReport = (): {
    summary: {
        totalCombinations: number;
        passingAA: number;
        passingAAA: number;
        failingAA: number;
    };
    details: Record<string, AccessibilityValidationResult>;
    colorBlindnessResults: Record<string, Record<ColorBlindnessType, AccessibilityValidationResult>>;
} => {
    const contrastResults = validateDesignSystemContrast();
    const colorBlindnessResults: Record<string, Record<ColorBlindnessType, AccessibilityValidationResult>> = {};

    // Test key combinations for color blindness
    const keyCombinations = [
        { name: 'Success Status', fg: '#047857', bg: '#ecfdf5' },
        { name: 'Warning Status', fg: '#b45309', bg: '#fffbeb' },
        { name: 'Error Status', fg: '#b91c1c', bg: '#fef2f2' },
        { name: 'Primary Button', fg: '#ffffff', bg: '#2563eb' }
    ];

    keyCombinations.forEach(({ name, fg, bg }) => {
        colorBlindnessResults[name] = validateColorBlindFriendly(fg, bg);
    });

    const totalCombinations = Object.keys(contrastResults).length;
    const passingAA = Object.values(contrastResults).filter(result => result.isValid).length;
    const passingAAA = Object.values(contrastResults).filter(result => {
        const aaaResult = validateWCAGAAA(result.contrastRatio.toString(), '');
        return aaaResult.isValid;
    }).length;
    const failingAA = totalCombinations - passingAA;

    return {
        summary: {
            totalCombinations,
            passingAA,
            passingAAA,
            failingAA
        },
        details: contrastResults,
        colorBlindnessResults
    };
};

/**
 * Create accessible status indicator with icon and pattern
 */
export const createAccessibleStatusIndicator = (
    status: 'success' | 'warning' | 'error' | 'info',
    text: string,
    includePattern: boolean = false
): string => {
    const icons = {
        success: '✓',
        warning: '⚠',
        error: '✕',
        info: 'ℹ'
    };

    const patternClass = includePattern ? ` status-${status}-pattern` : '';

    return `
        <span class="status-indicator status-${status}${patternClass}" role="status" aria-label="${status}: ${text}">
            <span aria-hidden="true">${icons[status]}</span>
            <span>${text}</span>
        </span>
    `;
};

/**
 * Create accessible progress bar with pattern and text
 */
export const createAccessibleProgressBar = (
    percentage: number,
    status: 'success' | 'warning' | 'error' = 'success',
    label?: string
): string => {
    const ariaLabel = label || `Progress: ${percentage}%`;

    return `
        <div class="progress-bar-accessible" role="progressbar" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100" aria-label="${ariaLabel}">
            <div class="progress-fill-${status}" style="width: ${percentage}%">
                <span class="sr-only">${percentage}% complete</span>
            </div>
        </div>
    `;
};

/**
 * Initialize accessibility features on page load
 */
export const initializeAccessibility = (): void => {
    if (typeof window === 'undefined') return;

    // Apply user preference classes
    applyAccessibilityEnhancements();

    // Add skip links if they don't exist
    const skipLink = document.querySelector('.skip-link');
    if (!skipLink) {
        const skipLinkElement = document.createElement('a');
        skipLinkElement.href = '#main-content';
        skipLinkElement.className = 'skip-link';
        skipLinkElement.textContent = 'Skip to main content';
        document.body.insertBefore(skipLinkElement, document.body.firstChild);
    }

    // Add focus-visible polyfill behavior
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('using-keyboard');
        }
    });

    document.addEventListener('mousedown', () => {
        document.body.classList.remove('using-keyboard');
    });

    // Monitor for preference changes
    if (window.matchMedia) {
        const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

        highContrastQuery.addEventListener('change', applyAccessibilityEnhancements);
        reducedMotionQuery.addEventListener('change', applyAccessibilityEnhancements);
    }
};