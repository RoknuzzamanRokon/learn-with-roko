/**
 * Design System Foundation Tests
 * Tests for CSS custom properties and color system functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    supportsCSSCustomProperties,
    getCSSVariable,
    setCSSVariable,
    hexToRgb,
    getContrastRatio,
    meetsWCAGAA,
    isValidColor,
    addFeatureDetectionClasses,
} from '../styles/utils';
import { CSS_VARIABLES, WCAG_AA_CONTRAST_RATIO } from '../styles/types';

// Mock DOM environment
const mockWindow = {
    CSS: {
        supports: vi.fn(),
    },
    matchMedia: vi.fn(),
    getComputedStyle: vi.fn(),
};

const mockDocument = {
    documentElement: {
        style: {
            setProperty: vi.fn(),
            removeProperty: vi.fn(),
        },
        classList: {
            add: vi.fn(),
        },
    },
};

// Mock global objects
Object.defineProperty(global, 'window', {
    value: mockWindow,
    writable: true,
});

Object.defineProperty(global, 'document', {
    value: mockDocument,
    writable: true,
});

describe('Design System Foundation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('CSS Custom Properties Support', () => {
        it('should detect CSS custom properties support', () => {
            mockWindow.CSS.supports.mockReturnValue(true);

            expect(supportsCSSCustomProperties()).toBe(true);
            expect(mockWindow.CSS.supports).toHaveBeenCalledWith('color', 'var(--fake-var)');
        });

        it('should handle lack of CSS custom properties support', () => {
            mockWindow.CSS.supports.mockReturnValue(false);

            expect(supportsCSSCustomProperties()).toBe(false);
        });

        it('should handle missing CSS.supports', () => {
            const originalCSS = mockWindow.CSS;
            mockWindow.CSS = undefined as any;

            expect(supportsCSSCustomProperties()).toBe(false);

            mockWindow.CSS = originalCSS;
        });
    });

    describe('CSS Variable Management', () => {
        it('should get CSS variable value', () => {
            const mockGetComputedStyle = vi.fn().mockReturnValue({
                getPropertyValue: vi.fn().mockReturnValue('  #2563eb  '),
            });
            mockWindow.getComputedStyle = mockGetComputedStyle;

            const result = getCSSVariable('--primary-600');

            expect(result).toBe('#2563eb');
            expect(mockGetComputedStyle).toHaveBeenCalledWith(mockDocument.documentElement);
        });

        it('should set CSS variable value', () => {
            setCSSVariable('--primary-600', '#1d4ed8');

            expect(mockDocument.documentElement.style.setProperty).toHaveBeenCalledWith(
                '--primary-600',
                '#1d4ed8'
            );
        });
    });

    describe('Color Utilities', () => {
        it('should convert hex to RGB correctly', () => {
            expect(hexToRgb('#2563eb')).toEqual({ r: 37, g: 99, b: 235 });
            expect(hexToRgb('2563eb')).toEqual({ r: 37, g: 99, b: 235 });
            expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
            expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
        });

        it('should return null for invalid hex colors', () => {
            expect(hexToRgb('invalid')).toBeNull();
            expect(hexToRgb('#gggggg')).toBeNull();
            expect(hexToRgb('')).toBeNull();
        });

        it('should calculate contrast ratio correctly', () => {
            // White on black should have high contrast
            const highContrast = getContrastRatio('#ffffff', '#000000');
            expect(highContrast).toBeCloseTo(21, 0);

            // Same colors should have contrast ratio of 1
            const sameColor = getContrastRatio('#2563eb', '#2563eb');
            expect(sameColor).toBeCloseTo(1, 0);
        });

        it('should validate WCAG AA compliance', () => {
            // White on primary blue should meet WCAG AA
            expect(meetsWCAGAA('#ffffff', '#2563eb')).toBe(true);

            // Light gray on white should not meet WCAG AA
            expect(meetsWCAGAA('#f3f4f6', '#ffffff')).toBe(false);
        });

        it('should validate color formats', () => {
            // Mock Option constructor
            const mockOption = {
                style: { color: '' },
            };

            global.Option = vi.fn().mockImplementation(() => mockOption);

            // Valid hex color
            mockOption.style.color = '#2563eb';
            expect(isValidColor('#2563eb')).toBe(true);

            // Invalid color
            mockOption.style.color = '';
            expect(isValidColor('invalid-color')).toBe(false);
        });
    });

    describe('Feature Detection', () => {
        it('should add feature detection classes', () => {
            mockWindow.CSS.supports.mockReturnValue(true);
            mockWindow.matchMedia.mockImplementation((query) => ({
                matches: query.includes('dark'),
            }));

            addFeatureDetectionClasses();

            expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('modern-color-support');
            expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('prefers-dark');
        });
    });

    describe('CSS Variables Constants', () => {
        it('should have all required CSS variable names', () => {
            expect(CSS_VARIABLES.PRIMARY_600).toBe('--primary-600');
            expect(CSS_VARIABLES.SUCCESS_600).toBe('--success-600');
            expect(CSS_VARIABLES.WARNING_600).toBe('--warning-600');
            expect(CSS_VARIABLES.ERROR_600).toBe('--error-600');
            expect(CSS_VARIABLES.WHITE).toBe('--white');
            expect(CSS_VARIABLES.GRAY_50).toBe('--gray-50');
            expect(CSS_VARIABLES.GRAY_900).toBe('--gray-900');
        });

        it('should have correct WCAG contrast ratio constant', () => {
            expect(WCAG_AA_CONTRAST_RATIO).toBe(4.5);
        });
    });
});