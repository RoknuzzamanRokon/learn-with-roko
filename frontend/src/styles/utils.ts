// Design System Utility Functions

import { CSS_VARIABLES, WCAG_AA_CONTRAST_RATIO } from './types';

/**
 * Check if the browser supports CSS custom properties
 */
export const supportsCSSCustomProperties = (): boolean => {
    if (typeof window === 'undefined') return false;

    return window.CSS && window.CSS.supports && window.CSS.supports('color', 'var(--fake-var)');
};

/**
 * Get a CSS custom property value
 */
export const getCSSVariable = (variable: string): string => {
    if (typeof window === 'undefined') return '';

    return getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim();
};

/**
 * Set a CSS custom property value
 */
export const setCSSVariable = (variable: string, value: string): void => {
    if (typeof window === 'undefined') return;

    document.documentElement.style.setProperty(variable, value);
};

/**
 * Convert hex color to RGB values
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
        }
        : null;
};

/**
 * Calculate relative luminance of a color
 */
export const getRelativeLuminance = (r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

/**
 * Calculate contrast ratio between two colors
 */
export const getContrastRatio = (color1: string, color2: string): number => {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    if (!rgb1 || !rgb2) return 0;

    const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
};

/**
 * Check if color combination meets WCAG AA standards
 */
export const meetsWCAGAA = (foreground: string, background: string): boolean => {
    const ratio = getContrastRatio(foreground, background);
    return ratio >= WCAG_AA_CONTRAST_RATIO;
};

/**
 * Generate CSS class name for color variant
 */
export const getColorClassName = (
    base: string,
    variant: 'primary' | 'secondary' | 'success' | 'warning' | 'error',
    type: 'bg' | 'text' | 'border' = 'bg'
): string => {
    return `${base}-${variant}`;
};

/**
 * Apply theme colors to document root
 */
export const applyTheme = (colors: Record<string, string>): void => {
    if (typeof window === 'undefined') return;

    Object.entries(colors).forEach(([variable, value]) => {
        setCSSVariable(variable, value);
    });
};

/**
 * Reset theme to default colors
 */
export const resetTheme = (): void => {
    if (typeof window === 'undefined') return;

    // Remove all custom property overrides
    const root = document.documentElement;
    const customProperties = Object.values(CSS_VARIABLES);

    customProperties.forEach((property) => {
        root.style.removeProperty(property);
    });
};

/**
 * Get all current theme colors
 */
export const getCurrentTheme = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};

    const theme: Record<string, string> = {};
    const customProperties = Object.values(CSS_VARIABLES);

    customProperties.forEach((property) => {
        const value = getCSSVariable(property);
        if (value) {
            theme[property] = value;
        }
    });

    return theme;
};

/**
 * Validate color format (hex, rgb, hsl)
 */
export const isValidColor = (color: string): boolean => {
    if (typeof window === 'undefined') return false;

    const style = new Option().style;
    style.color = color;
    return style.color !== '';
};

/**
 * Generate color palette from base color
 */
export const generateColorPalette = (baseColor: string): Record<number, string> => {
    // This is a simplified version - in a real implementation,
    // you'd use a more sophisticated color manipulation library
    const rgb = hexToRgb(baseColor);
    if (!rgb) return {};

    const palette: Record<number, string> = {};
    const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

    shades.forEach((shade, index) => {
        const factor = (index - 5) * 0.1; // 500 is the base (index 5)
        const r = Math.max(0, Math.min(255, rgb.r + (255 - rgb.r) * factor));
        const g = Math.max(0, Math.min(255, rgb.g + (255 - rgb.g) * factor));
        const b = Math.max(0, Math.min(255, rgb.b + (255 - rgb.b) * factor));

        palette[shade] = `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
    });

    return palette;
};

/**
 * Check if user prefers dark mode
 */
export const prefersDarkMode = (): boolean => {
    if (typeof window === 'undefined') return false;

    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Check if user prefers high contrast
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
 * Add CSS custom property support detection class to document
 */
export const addFeatureDetectionClasses = (): void => {
    if (typeof window === 'undefined') return;

    const html = document.documentElement;

    // CSS Custom Properties support
    if (supportsCSSCustomProperties()) {
        html.classList.add('modern-color-support');
    } else {
        html.classList.add('legacy-color-support');
    }

    // User preferences
    if (prefersDarkMode()) {
        html.classList.add('prefers-dark');
    }

    if (prefersHighContrast()) {
        html.classList.add('prefers-high-contrast');
    }

    if (prefersReducedMotion()) {
        html.classList.add('prefers-reduced-motion');
    }
};