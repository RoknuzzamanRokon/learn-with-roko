import { ThemeConfig, ThemeValidationResult, ColorAccessibilityResult } from "../types/theme";

export class ThemeManager {
    private static readonly STORAGE_KEY = 'lms_theme_config';
    private static readonly PREVIEW_STORAGE_KEY = 'lms_theme_preview';

    /**
     * Get the current active theme
     */
    static async getCurrentTheme(): Promise<ThemeConfig> {
        try {
            // In a real implementation, this would fetch from an API
            // For now, we'll use localStorage with a fallback to default
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
            return this.getDefaultTheme();
        } catch (error) {
            console.error('Failed to load current theme:', error);
            return this.getDefaultTheme();
        }
    }

    /**
     * Get the default theme configuration
     */
    static async getDefaultTheme(): Promise<ThemeConfig> {
        return {
            id: 'default',
            name: 'Default LMS Theme',
            isDefault: true,
            isCustomizable: true,
            colors: {
                primary: {
                    '50': '#eff6ff',
                    '100': '#dbeafe',
                    '200': '#bfdbfe',
                    '300': '#93c5fd',
                    '400': '#60a5fa',
                    '500': '#3b82f6',
                    '600': '#2563eb',
                    '700': '#1d4ed8',
                    '800': '#1e40af',
                    '900': '#1e3a8a'
                },
                neutral: {
                    '50': '#f9fafb',
                    '100': '#f3f4f6',
                    '200': '#e5e7eb',
                    '300': '#d1d5db',
                    '400': '#9ca3af',
                    '500': '#6b7280',
                    '600': '#4b5563',
                    '700': '#374151',
                    '800': '#1f2937',
                    '900': '#111827'
                },
                success: {
                    '50': '#ecfdf5',
                    '100': '#d1fae5',
                    '200': '#a7f3d0',
                    '300': '#6ee7b7',
                    '400': '#34d399',
                    '500': '#10b981',
                    '600': '#059669',
                    '700': '#047857',
                    '800': '#065f46',
                    '900': '#064e3b'
                },
                warning: {
                    '50': '#fffbeb',
                    '100': '#fef3c7',
                    '200': '#fde68a',
                    '300': '#fcd34d',
                    '400': '#fbbf24',
                    '500': '#f59e0b',
                    '600': '#d97706',
                    '700': '#b45309',
                    '800': '#92400e',
                    '900': '#78350f'
                },
                error: {
                    '50': '#fef2f2',
                    '100': '#fee2e2',
                    '200': '#fecaca',
                    '300': '#fca5a5',
                    '400': '#f87171',
                    '500': '#ef4444',
                    '600': '#dc2626',
                    '700': '#b91c1c',
                    '800': '#991b1b',
                    '900': '#7f1d1d'
                },
                accent: {
                    purple: '#8b5cf6',
                    teal: '#14b8a6'
                }
            }
        };
    }

    /**
     * Save theme configuration
     */
    static async saveTheme(theme: ThemeConfig): Promise<void> {
        try {
            // Validate theme before saving
            const validation = await this.validateThemeAccessibility(theme);
            if (!validation.isValid) {
                throw new Error(`Theme validation failed: ${validation.errors.join(', ')}`);
            }

            // In a real implementation, this would save to an API
            // For now, we'll use localStorage
            const themeToSave = {
                ...theme,
                updatedAt: new Date().toISOString()
            };

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(themeToSave));

            // Apply the theme immediately
            this.applyTheme(themeToSave);

            // Clear any preview
            localStorage.removeItem(this.PREVIEW_STORAGE_KEY);
        } catch (error) {
            console.error('Failed to save theme:', error);
            throw error;
        }
    }

    /**
     * Apply theme to the document
     */
    static applyTheme(theme: ThemeConfig): void {
        const root = document.documentElement;

        // Apply primary colors
        Object.entries(theme.colors.primary).forEach(([shade, color]) => {
            root.style.setProperty(`--primary-${shade}`, color);
        });

        // Apply neutral colors
        Object.entries(theme.colors.neutral).forEach(([shade, color]) => {
            root.style.setProperty(`--gray-${shade}`, color);
        });

        // Apply status colors
        Object.entries(theme.colors.success).forEach(([shade, color]) => {
            root.style.setProperty(`--success-${shade}`, color);
        });

        Object.entries(theme.colors.warning).forEach(([shade, color]) => {
            root.style.setProperty(`--warning-${shade}`, color);
        });

        Object.entries(theme.colors.error).forEach(([shade, color]) => {
            root.style.setProperty(`--error-${shade}`, color);
        });

        // Apply accent colors
        root.style.setProperty('--accent-purple-500', theme.colors.accent.purple);
        root.style.setProperty('--accent-teal-500', theme.colors.accent.teal);

        // Set white color
        root.style.setProperty('--white', '#ffffff');
    }

    /**
     * Apply theme preview (temporary application)
     */
    static applyThemePreview(theme: ThemeConfig): void {
        // Store preview theme
        localStorage.setItem(this.PREVIEW_STORAGE_KEY, JSON.stringify(theme));

        // Apply theme temporarily
        this.applyTheme(theme);
    }

    /**
     * Validate theme accessibility compliance
     */
    static async validateThemeAccessibility(theme: ThemeConfig): Promise<ThemeValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];
        const contrastRatios: { [key: string]: number } = {};

        try {
            // Check primary color contrast against white
            const primaryContrast = this.calculateContrastRatio(theme.colors.primary['600'], '#ffffff');
            contrastRatios['primary-white'] = primaryContrast;

            if (primaryContrast < 4.5) {
                errors.push('Primary color does not meet WCAG AA contrast requirements against white background');
            }

            // Check primary color contrast against neutral backgrounds
            const primaryNeutralContrast = this.calculateContrastRatio(theme.colors.primary['600'], theme.colors.neutral['50']);
            contrastRatios['primary-neutral'] = primaryNeutralContrast;

            if (primaryNeutralContrast < 4.5) {
                warnings.push('Primary color may have insufficient contrast against light neutral backgrounds');
            }

            // Check status colors
            const statusColors = ['success', 'warning', 'error'] as const;
            for (const status of statusColors) {
                const statusContrast = this.calculateContrastRatio(theme.colors[status]['600'], '#ffffff');
                contrastRatios[`${status}-white`] = statusContrast;

                if (statusContrast < 4.5) {
                    errors.push(`${status} color does not meet WCAG AA contrast requirements`);
                }
            }

            // Check for color blindness accessibility
            const colorBlindResult = this.validateColorBlindAccessibility(theme);
            if (!colorBlindResult.isValid) {
                warnings.push(...colorBlindResult.warnings);
            }

            return {
                isValid: errors.length === 0,
                errors,
                warnings,
                contrastRatios
            };
        } catch (error) {
            return {
                isValid: false,
                errors: ['Failed to validate theme accessibility'],
                warnings: []
            };
        }
    }

    /**
     * Calculate contrast ratio between two colors
     */
    private static calculateContrastRatio(color1: string, color2: string): number {
        const luminance1 = this.getLuminance(color1);
        const luminance2 = this.getLuminance(color2);

        const lighter = Math.max(luminance1, luminance2);
        const darker = Math.min(luminance1, luminance2);

        return (lighter + 0.05) / (darker + 0.05);
    }

    /**
     * Get relative luminance of a color
     */
    private static getLuminance(hex: string): number {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return 0;

        const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });

        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    /**
     * Convert hex color to RGB
     */
    private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    /**
     * Validate color blind accessibility
     */
    private static validateColorBlindAccessibility(theme: ThemeConfig): { isValid: boolean; warnings: string[] } {
        const warnings: string[] = [];

        // Check if success and error colors are distinguishable for color blind users
        const successHue = this.getHue(theme.colors.success['600']);
        const errorHue = this.getHue(theme.colors.error['600']);

        if (Math.abs(successHue - errorHue) < 60) {
            warnings.push('Success and error colors may be difficult to distinguish for color-blind users');
        }

        // Check if warning and error colors are distinguishable
        const warningHue = this.getHue(theme.colors.warning['600']);

        if (Math.abs(warningHue - errorHue) < 30) {
            warnings.push('Warning and error colors may be too similar for color-blind users');
        }

        return {
            isValid: warnings.length === 0,
            warnings
        };
    }

    /**
     * Get hue value from hex color
     */
    private static getHue(hex: string): number {
        const rgb = this.hexToRgb(hex);
        if (!rgb) return 0;

        const r = rgb.r / 255;
        const g = rgb.g / 255;
        const b = rgb.b / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const delta = max - min;

        if (delta === 0) return 0;

        let hue = 0;
        if (max === r) {
            hue = ((g - b) / delta) % 6;
        } else if (max === g) {
            hue = (b - r) / delta + 2;
        } else {
            hue = (r - g) / delta + 4;
        }

        return hue * 60;
    }

    /**
     * Switch to a different theme
     */
    static async switchTheme(themeId: string): Promise<void> {
        try {
            let theme: ThemeConfig;

            if (themeId === 'default') {
                theme = await this.getDefaultTheme();
            } else {
                // In a real implementation, this would fetch from an API
                theme = await this.getCurrentTheme();
            }

            // Validate theme before switching
            const validation = await this.validateThemeAccessibility(theme);
            if (!validation.isValid) {
                throw new Error(`Theme validation failed: ${validation.errors.join(', ')}`);
            }

            // Save theme preference
            await this.saveThemePreference(theme);

            // Apply theme
            this.applyTheme(theme);
        } catch (error) {
            console.error('Failed to switch theme:', error);
            throw error;
        }
    }

    /**
     * Save theme preference for current user
     */
    static async saveThemePreference(theme: ThemeConfig): Promise<void> {
        try {
            const preference = {
                themeId: theme.id,
                appliedAt: new Date().toISOString(),
                customizations: theme
            };

            // In a real implementation, this would save to user preferences API
            // For now, we'll use localStorage
            localStorage.setItem('lms_user_theme_preference', JSON.stringify(preference));
        } catch (error) {
            console.error('Failed to save theme preference:', error);
            throw error;
        }
    }

    /**
     * Get user's theme preference
     */
    static async getUserThemePreference(): Promise<ThemeConfig | null> {
        try {
            const stored = localStorage.getItem('lms_user_theme_preference');
            if (stored) {
                const preference = JSON.parse(stored);
                return preference.customizations;
            }
            return null;
        } catch (error) {
            console.error('Failed to load user theme preference:', error);
            return null;
        }
    }

    /**
     * Clear theme preview and revert to saved theme
     */
    static async clearPreview(): Promise<void> {
        try {
            // Remove preview from storage
            localStorage.removeItem(this.PREVIEW_STORAGE_KEY);

            // Load and apply saved theme
            const savedTheme = await this.getCurrentTheme();
            this.applyTheme(savedTheme);
        } catch (error) {
            console.error('Failed to clear theme preview:', error);
            throw error;
        }
    }

    /**
     * Check if theme system supports runtime updates
     */
    static supportsRuntimeUpdates(): boolean {
        return typeof document !== 'undefined' &&
            document.documentElement &&
            document.documentElement.style &&
            typeof document.documentElement.style.setProperty === 'function';
    }

    /**
     * Update a single CSS custom property
     */
    static updateCSSProperty(property: string, value: string): void {
        if (!this.supportsRuntimeUpdates()) {
            console.warn('Runtime CSS updates not supported in this environment');
            return;
        }

        document.documentElement.style.setProperty(property, value);
    }

    /**
     * Batch update multiple CSS properties
     */
    static batchUpdateCSSProperties(properties: Record<string, string>): void {
        if (!this.supportsRuntimeUpdates()) {
            console.warn('Runtime CSS updates not supported in this environment');
            return;
        }

        const root = document.documentElement;
        Object.entries(properties).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });
    }

    /**
     * Initialize theme system
     */
    static async initialize(): Promise<void> {
        try {
            // Check if there's a preview theme to restore
            const preview = localStorage.getItem(this.PREVIEW_STORAGE_KEY);
            if (preview) {
                const previewTheme = JSON.parse(preview);
                this.applyTheme(previewTheme);
                return;
            }

            // Check for user theme preference first
            const userPreference = await this.getUserThemePreference();
            if (userPreference) {
                this.applyTheme(userPreference);
                return;
            }

            // Load and apply current theme
            const currentTheme = await this.getCurrentTheme();
            this.applyTheme(currentTheme);
        } catch (error) {
            console.error('Failed to initialize theme system:', error);
            // Fallback to default theme
            const defaultTheme = await this.getDefaultTheme();
            this.applyTheme(defaultTheme);
        }
    }
}

/**
 * Validate color accessibility for individual colors
 */
export async function validateColorAccessibility(
    color: string,
    backgroundColor: string = '#ffffff'
): Promise<ColorAccessibilityResult> {
    try {
        const contrastRatio = ThemeManager['calculateContrastRatio'](color, backgroundColor);
        const warnings: string[] = [];

        if (contrastRatio < 3) {
            warnings.push('Very poor contrast - text may be unreadable');
        } else if (contrastRatio < 4.5) {
            warnings.push('Does not meet WCAG AA standards');
        } else if (contrastRatio < 7) {
            warnings.push('Meets WCAG AA but not AAA standards');
        }

        return {
            isValid: contrastRatio >= 4.5,
            contrastRatio,
            warnings
        };
    } catch (error) {
        return {
            isValid: false,
            warnings: ['Invalid color format']
        };
    }
}