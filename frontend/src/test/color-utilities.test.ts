/**
 * Color Utility Functions Unit Tests
 * Comprehensive tests for color validation, conversion, theme switching, and accessibility compliance
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    hexToRgb,
    getRelativeLuminance,
    getContrastRatio,
    meetsWCAGAA,
    isValidColor,
    generateColorPalette,
    supportsCSSCustomProperties,
    getCSSVariable,
    setCSSVariable,
    applyTheme,
    resetTheme,
    getCurrentTheme,
    prefersDarkMode,
    prefersHighContrast,
    prefersReducedMotion,
    addFeatureDetectionClasses
} from '../styles/utils';

import {
    validateWCAGAA,
    validateWCAGAAA,
    simulateColorBlindness,
    validateColorBlindFriendly,
    generateAccessibleAlternatives,
    prefersHighContrast as accessibilityPrefersHighContrast,
    prefersReducedMotion as accessibilityPrefersReducedMotion,
    applyAccessibilityEnhancements,
    generateAccessibilityReport,
    type ColorBlindnessType,
    type AccessibilityValidationResult
} from '../styles/accessibility-utils';

import { ThemeManager, validateColorAccessibility } from '../../app/services/themeService';
import { CSS_VARIABLES, WCAG_AA_CONTRAST_RATIO, WCAG_AAA_CONTRAST_RATIO } from '../styles/types';

// Mock DOM environment
const createMockWindow = () => ({
    CSS: {
        supports: vi.fn()
    },
    matchMedia: vi.fn(),
    getComputedStyle: vi.fn(),
    Option: vi.fn()
});

const createMockDocument = () => ({
    documentElement: {
        style: {
            setProperty: vi.fn(),
            removeProperty: vi.fn(),
            getPropertyValue: vi.fn()
        },
        classList: {
            add: vi.fn(),
            remove: vi.fn(),
            contains: vi.fn()
        }
    },
    body: {
        classList: {
            add: vi.fn(),
            remove: vi.fn()
        },
        insertBefore: vi.fn(),
        firstChild: null
    },
    querySelector: vi.fn(),
    createElement: vi.fn(),
    addEventListener: vi.fn()
});

const createMockLocalStorage = () => {
    const storage: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => storage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            storage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete storage[key];
        }),
        clear: vi.fn(() => {
            Object.keys(storage).forEach(key => delete storage[key]);
        })
    };
};

describe('Color Utility Functions', () => {
    let mockWindow: ReturnType<typeof createMockWindow>;
    let mockDocument: ReturnType<typeof createMockDocument>;
    let mockLocalStorage: ReturnType<typeof createMockLocalStorage>;

    beforeEach(() => {
        mockWindow = createMockWindow();
        mockDocument = createMockDocument();
        mockLocalStorage = createMockLocalStorage();

        // Setup global mocks
        Object.defineProperty(global, 'window', {
            value: mockWindow,
            writable: true
        });

        Object.defineProperty(global, 'document', {
            value: mockDocument,
            writable: true
        });

        Object.defineProperty(global, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        });

        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Color Conversion Utilities', () => {
        describe('hexToRgb', () => {
            it('should convert valid hex colors to RGB', () => {
                expect(hexToRgb('#2563eb')).toEqual({ r: 37, g: 99, b: 235 });
                expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
                expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
                expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
                expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
                expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
            });

            it('should handle hex colors without # prefix', () => {
                expect(hexToRgb('2563eb')).toEqual({ r: 37, g: 99, b: 235 });
                expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
            });

            it('should return null for invalid hex colors', () => {
                expect(hexToRgb('invalid')).toBeNull();
                expect(hexToRgb('#gggggg')).toBeNull();
                expect(hexToRgb('')).toBeNull();
                expect(hexToRgb('#12345')).toBeNull();
                expect(hexToRgb('#1234567')).toBeNull();
            });

            it('should handle case insensitive hex colors', () => {
                expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
                expect(hexToRgb('#AbCdEf')).toEqual({ r: 171, g: 205, b: 239 });
            });
        });

        describe('getRelativeLuminance', () => {
            it('should calculate correct luminance for pure colors', () => {
                // White should have luminance of 1
                expect(getRelativeLuminance(255, 255, 255)).toBeCloseTo(1, 2);

                // Black should have luminance of 0
                expect(getRelativeLuminance(0, 0, 0)).toBeCloseTo(0, 2);

                // Red component test
                expect(getRelativeLuminance(255, 0, 0)).toBeCloseTo(0.2126, 2);

                // Green component test
                expect(getRelativeLuminance(0, 255, 0)).toBeCloseTo(0.7152, 2);

                // Blue component test
                expect(getRelativeLuminance(0, 0, 255)).toBeCloseTo(0.0722, 2);
            });

            it('should handle mid-range values correctly', () => {
                // Gray (128, 128, 128) should be around 0.22
                expect(getRelativeLuminance(128, 128, 128)).toBeCloseTo(0.22, 1);
            });
        });

        describe('getContrastRatio', () => {
            it('should calculate maximum contrast ratio for black and white', () => {
                expect(getContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
                expect(getContrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 0);
            });

            it('should return 1 for identical colors', () => {
                expect(getContrastRatio('#2563eb', '#2563eb')).toBeCloseTo(1, 1);
                expect(getContrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 1);
            });

            it('should calculate correct ratios for common color combinations', () => {
                // Primary blue on white
                const primaryWhite = getContrastRatio('#2563eb', '#ffffff');
                expect(primaryWhite).toBeGreaterThan(4.5); // Should meet WCAG AA

                // Success green on white
                const successWhite = getContrastRatio('#059669', '#ffffff');
                expect(successWhite).toBeGreaterThan(4.5);

                // Warning orange on white
                const warningWhite = getContrastRatio('#d97706', '#ffffff');
                expect(warningWhite).toBeGreaterThan(4.5);
            });

            it('should return 0 for invalid colors', () => {
                expect(getContrastRatio('invalid', '#ffffff')).toBe(0);
                expect(getContrastRatio('#ffffff', 'invalid')).toBe(0);
            });
        });
    });

    describe('Color Validation Utilities', () => {
        describe('meetsWCAGAA', () => {
            it('should validate WCAG AA compliance correctly', () => {
                expect(meetsWCAGAA('#ffffff', '#2563eb')).toBe(true);
                expect(meetsWCAGAA('#000000', '#ffffff')).toBe(true);
                expect(meetsWCAGAA('#f3f4f6', '#ffffff')).toBe(false);
                expect(meetsWCAGAA('#e5e7eb', '#ffffff')).toBe(false);
            });
        });

        describe('isValidColor', () => {
            beforeEach(() => {
                const mockOption = {
                    style: { color: '' }
                };
                mockWindow.Option = vi.fn().mockImplementation(() => mockOption);
            });

            it('should validate hex colors', () => {
                const mockOption = { style: { color: '' } };
                mockWindow.Option = vi.fn().mockReturnValue(mockOption);

                // Simulate valid color
                mockOption.style.color = '#2563eb';
                expect(isValidColor('#2563eb')).toBe(true);

                // Simulate invalid color
                mockOption.style.color = '';
                expect(isValidColor('invalid-color')).toBe(false);
            });
        });

        describe('generateColorPalette', () => {
            it('should generate a complete color palette from base color', () => {
                const palette = generateColorPalette('#2563eb');

                expect(palette).toHaveProperty('50');
                expect(palette).toHaveProperty('100');
                expect(palette).toHaveProperty('500');
                expect(palette).toHaveProperty('900');

                // All values should be valid hex colors
                Object.values(palette).forEach(color => {
                    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
                });
            });

            it('should return empty object for invalid base color', () => {
                const palette = generateColorPalette('invalid');
                expect(palette).toEqual({});
            });
        });
    });

    describe('CSS Custom Properties Management', () => {
        describe('supportsCSSCustomProperties', () => {
            it('should detect CSS custom properties support', () => {
                mockWindow.CSS.supports.mockReturnValue(true);
                expect(supportsCSSCustomProperties()).toBe(true);
                expect(mockWindow.CSS.supports).toHaveBeenCalledWith('color', 'var(--fake-var)');
            });

            it('should handle lack of support', () => {
                mockWindow.CSS.supports.mockReturnValue(false);
                expect(supportsCSSCustomProperties()).toBe(false);
            });

            it('should handle missing CSS.supports', () => {
                mockWindow.CSS = undefined as any;
                expect(supportsCSSCustomProperties()).toBe(false);
            });
        });

        describe('getCSSVariable and setCSSVariable', () => {
            it('should get CSS variable values', () => {
                mockWindow.getComputedStyle.mockReturnValue({
                    getPropertyValue: vi.fn().mockReturnValue('  #2563eb  ')
                });

                const result = getCSSVariable('--primary-600');
                expect(result).toBe('#2563eb');
            });

            it('should set CSS variable values', () => {
                setCSSVariable('--primary-600', '#1d4ed8');
                expect(mockDocument.documentElement.style.setProperty)
                    .toHaveBeenCalledWith('--primary-600', '#1d4ed8');
            });
        });

        describe('applyTheme and resetTheme', () => {
            it('should apply theme colors', () => {
                const theme = {
                    '--primary-600': '#2563eb',
                    '--success-600': '#059669'
                };

                applyTheme(theme);

                expect(mockDocument.documentElement.style.setProperty)
                    .toHaveBeenCalledWith('--primary-600', '#2563eb');
                expect(mockDocument.documentElement.style.setProperty)
                    .toHaveBeenCalledWith('--success-600', '#059669');
            });

            it('should reset theme to defaults', () => {
                resetTheme();

                // Should remove all CSS variables
                Object.values(CSS_VARIABLES).forEach(variable => {
                    expect(mockDocument.documentElement.style.removeProperty)
                        .toHaveBeenCalledWith(variable);
                });
            });
        });

        describe('getCurrentTheme', () => {
            it('should get current theme colors', () => {
                mockWindow.getComputedStyle.mockReturnValue({
                    getPropertyValue: vi.fn()
                        .mockReturnValueOnce('#2563eb')
                        .mockReturnValueOnce('#059669')
                        .mockReturnValue('')
                });

                const theme = getCurrentTheme();
                expect(theme).toHaveProperty('--primary-600', '#2563eb');
                expect(theme).toHaveProperty('--success-600', '#059669');
            });
        });
    });

    describe('User Preference Detection', () => {
        beforeEach(() => {
            mockWindow.matchMedia.mockImplementation((query: string) => ({
                matches: false,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn()
            }));
        });

        describe('prefersDarkMode', () => {
            it('should detect dark mode preference', () => {
                mockWindow.matchMedia.mockImplementation((query: string) => ({
                    matches: query.includes('dark'),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn()
                }));

                expect(prefersDarkMode()).toBe(true);
                expect(mockWindow.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
            });

            it('should handle missing matchMedia', () => {
                mockWindow.matchMedia = undefined as any;
                expect(prefersDarkMode()).toBe(false);
            });
        });

        describe('prefersHighContrast', () => {
            it('should detect high contrast preference', () => {
                mockWindow.matchMedia.mockImplementation((query: string) => ({
                    matches: query.includes('high'),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn()
                }));

                expect(prefersHighContrast()).toBe(true);
                expect(mockWindow.matchMedia).toHaveBeenCalledWith('(prefers-contrast: high)');
            });
        });

        describe('prefersReducedMotion', () => {
            it('should detect reduced motion preference', () => {
                mockWindow.matchMedia.mockImplementation((query: string) => ({
                    matches: query.includes('reduce'),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn()
                }));

                expect(prefersReducedMotion()).toBe(true);
                expect(mockWindow.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
            });
        });

        describe('addFeatureDetectionClasses', () => {
            it('should add appropriate classes based on feature support', () => {
                mockWindow.CSS.supports.mockReturnValue(true);
                mockWindow.matchMedia.mockImplementation((query: string) => ({
                    matches: query.includes('dark') || query.includes('high'),
                    addEventListener: vi.fn(),
                    removeEventListener: vi.fn()
                }));

                addFeatureDetectionClasses();

                expect(mockDocument.documentElement.classList.add)
                    .toHaveBeenCalledWith('modern-color-support');
                expect(mockDocument.documentElement.classList.add)
                    .toHaveBeenCalledWith('prefers-dark');
                expect(mockDocument.documentElement.classList.add)
                    .toHaveBeenCalledWith('prefers-high-contrast');
            });

            it('should add legacy support class when CSS custom properties not supported', () => {
                mockWindow.CSS.supports.mockReturnValue(false);

                addFeatureDetectionClasses();

                expect(mockDocument.documentElement.classList.add)
                    .toHaveBeenCalledWith('legacy-color-support');
            });
        });
    });
});