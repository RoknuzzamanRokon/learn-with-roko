// Responsive Features Test

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    getDeviceInfo,
    matchesBreakpoint,
    getCurrentBreakpoint,
    getResponsiveValue,
    getTouchTargetSize,
    getResponsiveFontSize,
    getResponsiveSpacing,
    isDarkMode,
    getResponsiveColumns,
    getAnimationDuration,
    BREAKPOINTS
} from '../../styles/responsive-utils';

// Mock window object for testing
const createMockWindow = (width: number, height: number, options: any = {}) => ({
    innerWidth: width,
    innerHeight: height,
    devicePixelRatio: options.pixelRatio || 1,
    matchMedia: vi.fn((query: string) => ({
        matches: options.matches?.[query] || false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    })),
    navigator: {
        maxTouchPoints: options.maxTouchPoints || 0
    },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    localStorage: {
        getItem: vi.fn(),
        setItem: vi.fn()
    }
});

const mockDocument = {
    documentElement: {
        style: {
            setProperty: vi.fn(),
            removeProperty: vi.fn()
        },
        classList: {
            add: vi.fn(),
            remove: vi.fn()
        },
        setAttribute: vi.fn()
    }
};

describe('Responsive Features', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Device Detection', () => {
        it('should detect mobile devices correctly', () => {
            // @ts-ignore
            global.window = createMockWindow(375, 667, {
                maxTouchPoints: 5,
                matches: {
                    '(hover: hover)': false,
                    '(prefers-color-scheme: dark)': false,
                    '(prefers-reduced-motion: reduce)': false,
                    '(prefers-contrast: high)': false
                }
            });

            const deviceInfo = getDeviceInfo();

            expect(deviceInfo.isMobile).toBe(true);
            expect(deviceInfo.isTablet).toBe(false);
            expect(deviceInfo.isDesktop).toBe(false);
            expect(deviceInfo.isTouch).toBe(true);
            expect(deviceInfo.hasHover).toBe(false);
            expect(deviceInfo.orientation).toBe('portrait');
        });

        it('should detect tablet devices correctly', () => {
            // @ts-ignore
            global.window = createMockWindow(768, 1024, {
                maxTouchPoints: 10,
                matches: {
                    '(hover: hover)': true,
                    '(prefers-color-scheme: dark)': false,
                    '(prefers-reduced-motion: reduce)': false,
                    '(prefers-contrast: high)': false
                }
            });

            const deviceInfo = getDeviceInfo();

            expect(deviceInfo.isMobile).toBe(false);
            expect(deviceInfo.isTablet).toBe(true);
            expect(deviceInfo.isDesktop).toBe(false);
            expect(deviceInfo.isTouch).toBe(true);
            expect(deviceInfo.hasHover).toBe(true);
            expect(deviceInfo.orientation).toBe('portrait');
        });

        it('should detect desktop devices correctly', () => {
            // @ts-ignore
            global.window = createMockWindow(1920, 1080, {
                maxTouchPoints: 0,
                matches: {
                    '(hover: hover)': true,
                    '(prefers-color-scheme: dark)': false,
                    '(prefers-reduced-motion: reduce)': false,
                    '(prefers-contrast: high)': false
                }
            });

            const deviceInfo = getDeviceInfo();

            expect(deviceInfo.isMobile).toBe(false);
            expect(deviceInfo.isTablet).toBe(false);
            expect(deviceInfo.isDesktop).toBe(true);
            expect(deviceInfo.isTouch).toBe(false);
            expect(deviceInfo.hasHover).toBe(true);
            expect(deviceInfo.orientation).toBe('landscape');
        });

        it('should detect high DPI displays', () => {
            // @ts-ignore
            global.window = createMockWindow(1920, 1080, {
                pixelRatio: 2,
                matches: {
                    '(hover: hover)': true,
                    '(prefers-color-scheme: dark)': false,
                    '(prefers-reduced-motion: reduce)': false,
                    '(prefers-contrast: high)': false
                }
            });

            const deviceInfo = getDeviceInfo();
            expect(deviceInfo.pixelRatio).toBe(2);
        });
    });

    describe('Breakpoint Matching', () => {
        it('should match breakpoints correctly', () => {
            // @ts-ignore
            global.window = createMockWindow(768, 1024);

            expect(matchesBreakpoint('mobile', 'up')).toBe(true);
            expect(matchesBreakpoint('tablet', 'up')).toBe(true);
            expect(matchesBreakpoint('desktop', 'up')).toBe(false);

            expect(matchesBreakpoint('desktop', 'down')).toBe(true);
            expect(matchesBreakpoint('tablet', 'down')).toBe(false);
        });

        it('should get current breakpoint correctly', () => {
            // Mobile
            // @ts-ignore
            global.window = createMockWindow(375, 667);
            expect(getCurrentBreakpoint()).toBe('mobile');

            // Tablet
            // @ts-ignore
            global.window = createMockWindow(768, 1024);
            expect(getCurrentBreakpoint()).toBe('tablet');

            // Desktop
            // @ts-ignore
            global.window = createMockWindow(1024, 768);
            expect(getCurrentBreakpoint()).toBe('desktop');

            // Large
            // @ts-ignore
            global.window = createMockWindow(1280, 800);
            expect(getCurrentBreakpoint()).toBe('large');

            // XL
            // @ts-ignore
            global.window = createMockWindow(1536, 864);
            expect(getCurrentBreakpoint()).toBe('xl');
        });
    });

    describe('Responsive Values', () => {
        it('should return responsive values based on current breakpoint', () => {
            // @ts-ignore
            global.window = createMockWindow(768, 1024);

            const values = {
                mobile: 1,
                tablet: 2,
                desktop: 3,
                large: 4
            };

            const result = getResponsiveValue(values, 0);
            expect(result).toBe(2); // Should return tablet value
        });

        it('should fallback to smaller breakpoints when current not available', () => {
            // @ts-ignore
            global.window = createMockWindow(1024, 768);

            const values = {
                mobile: 1,
                tablet: 2
                // desktop not defined
            };

            const result = getResponsiveValue(values, 0);
            expect(result).toBe(2); // Should fallback to tablet
        });

        it('should return fallback when no matching breakpoint found', () => {
            // @ts-ignore
            global.window = createMockWindow(1024, 768);

            const values = {}; // No values defined

            const result = getResponsiveValue(values, 99);
            expect(result).toBe(99); // Should return fallback
        });
    });

    describe('Touch Target Sizing', () => {
        it('should return appropriate touch target sizes', () => {
            // Mobile
            // @ts-ignore
            global.window = createMockWindow(375, 667);
            expect(getTouchTargetSize()).toBe(44);

            // Tablet
            // @ts-ignore
            global.window = createMockWindow(768, 1024);
            expect(getTouchTargetSize()).toBe(40);

            // Desktop
            // @ts-ignore
            global.window = createMockWindow(1024, 768);
            expect(getTouchTargetSize()).toBe(32);
        });
    });

    describe('Responsive Typography', () => {
        it('should scale font sizes appropriately', () => {
            // Mobile
            // @ts-ignore
            global.window = createMockWindow(375, 667);
            expect(getResponsiveFontSize(1)).toBe('0.875rem');

            // Tablet
            // @ts-ignore
            global.window = createMockWindow(768, 1024);
            expect(getResponsiveFontSize(1)).toBe('0.9375rem');

            // Desktop
            // @ts-ignore
            global.window = createMockWindow(1024, 768);
            expect(getResponsiveFontSize(1)).toBe('1rem');
        });

        it('should scale spacing appropriately', () => {
            // Mobile
            // @ts-ignore
            global.window = createMockWindow(375, 667);
            expect(getResponsiveSpacing(1)).toBe('0.75rem');

            // Tablet
            // @ts-ignore
            global.window = createMockWindow(768, 1024);
            expect(getResponsiveSpacing(1)).toBe('0.875rem');

            // Desktop
            // @ts-ignore
            global.window = createMockWindow(1024, 768);
            expect(getResponsiveSpacing(1)).toBe('1rem');
        });
    });

    describe('Dark Mode Detection', () => {
        it('should detect system dark mode preference', () => {
            // @ts-ignore
            global.window = createMockWindow(1024, 768, {
                matches: {
                    '(prefers-color-scheme: dark)': true
                }
            });
            // @ts-ignore
            global.window.localStorage.getItem = vi.fn().mockReturnValue(null);

            expect(isDarkMode()).toBe(true);
        });

        it('should respect manual dark mode override', () => {
            // @ts-ignore
            global.window = createMockWindow(1024, 768, {
                matches: {
                    '(prefers-color-scheme: dark)': false // System prefers light
                }
            });
            // @ts-ignore
            global.window.localStorage.getItem = vi.fn().mockReturnValue('dark'); // User chose dark

            expect(isDarkMode()).toBe(true);
        });
    });

    describe('Grid Columns', () => {
        it('should return appropriate column counts for different breakpoints', () => {
            // Mobile
            // @ts-ignore
            global.window = createMockWindow(375, 667);
            expect(getResponsiveColumns()).toBe(1);

            // Tablet
            // @ts-ignore
            global.window = createMockWindow(768, 1024);
            expect(getResponsiveColumns()).toBe(2);

            // Desktop
            // @ts-ignore
            global.window = createMockWindow(1024, 768);
            expect(getResponsiveColumns()).toBe(3);

            // Large
            // @ts-ignore
            global.window = createMockWindow(1280, 800);
            expect(getResponsiveColumns()).toBe(4);
        });

        it('should accept custom column counts', () => {
            // @ts-ignore
            global.window = createMockWindow(768, 1024);
            expect(getResponsiveColumns(2, 4, 6, 8)).toBe(4);
        });
    });

    describe('Animation Duration', () => {
        it('should return normal duration when motion is not reduced', () => {
            // @ts-ignore
            global.window = createMockWindow(1024, 768, {
                matches: {
                    '(prefers-reduced-motion: reduce)': false
                }
            });

            expect(getAnimationDuration(200)).toBe(200);
        });

        it('should return zero duration when motion is reduced', () => {
            // @ts-ignore
            global.window = createMockWindow(1024, 768, {
                matches: {
                    '(prefers-reduced-motion: reduce)': true
                }
            });

            expect(getAnimationDuration(200)).toBe(0);
        });

        it('should use default duration when none provided', () => {
            // @ts-ignore
            global.window = createMockWindow(1024, 768, {
                matches: {
                    '(prefers-reduced-motion: reduce)': false
                }
            });

            expect(getAnimationDuration()).toBe(200);
        });
    });

    describe('Server-Side Rendering', () => {
        it('should handle undefined window gracefully', () => {
            // @ts-ignore
            global.window = undefined;

            const deviceInfo = getDeviceInfo();
            expect(deviceInfo.isDesktop).toBe(true);
            expect(deviceInfo.isMobile).toBe(false);
            expect(deviceInfo.isTablet).toBe(false);

            expect(matchesBreakpoint('desktop')).toBe(false);
            expect(getCurrentBreakpoint()).toBe('desktop');
            expect(isDarkMode()).toBe(false);
        });
    });
});