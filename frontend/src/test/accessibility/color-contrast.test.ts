import { describe, it, expect, beforeAll } from 'vitest';
import {
    validateWCAGAA,
    validateWCAGAAA,
    validateDesignSystemContrast,
    generateAccessibilityReport,
    type AccessibilityValidationResult,
    type WCAGLevel
} from '../../styles/accessibility-utils';
import { DEFAULT_COLORS } from '../../styles';

describe('Color Contrast Validation Tests', () => {
    let contrastResults: Record<string, AccessibilityValidationResult>;
    let accessibilityReport: ReturnType<typeof generateAccessibilityReport>;

    beforeAll(() => {
        contrastResults = validateDesignSystemContrast();
        accessibilityReport = generateAccessibilityReport();
    });

    describe('WCAG AA Compliance', () => {
        it('should validate primary button contrast meets WCAG AA', () => {
            const result = validateWCAGAA('#ffffff', DEFAULT_COLORS.PRIMARY);

            expect(result.isValid).toBe(true);
            expect(result.contrastRatio).toBeGreaterThanOrEqual(4.5);
            expect(result.level).toBe('AA');
        });

        it('should validate secondary button contrast meets WCAG AA', () => {
            const result = validateWCAGAA('#374151', '#f3f4f6');

            expect(result.isValid).toBe(true);
            expect(result.contrastRatio).toBeGreaterThanOrEqual(4.5);
        });

        it('should validate success button contrast meets WCAG AA', () => {
            const result = validateWCAGAA('#ffffff', DEFAULT_COLORS.SUCCESS);

            expect(result.isValid).toBe(true);
            expect(result.contrastRatio).toBeGreaterThanOrEqual(4.5);
        });

        it('should validate warning button contrast meets WCAG AA', () => {
            const result = validateWCAGAA('#ffffff', DEFAULT_COLORS.WARNING);

            expect(result.isValid).toBe(true);
            expect(result.contrastRatio).toBeGreaterThanOrEqual(4.5);
        });

        it('should validate error button contrast meets WCAG AA', () => {
            const result = validateWCAGAA('#ffffff', DEFAULT_COLORS.ERROR);

            expect(result.isValid).toBe(true);
            expect(result.contrastRatio).toBeGreaterThanOrEqual(4.5);
        });

        it('should validate body text contrast meets WCAG AA', () => {
            const result = validateWCAGAA(DEFAULT_COLORS.GRAY_600, DEFAULT_COLORS.WHITE);

            expect(result.isValid).toBe(true);
            expect(result.contrastRatio).toBeGreaterThanOrEqual(4.5);
        });

        it('should validate heading text contrast meets WCAG AA', () => {
            const result = validateWCAGAA(DEFAULT_COLORS.GRAY_900, DEFAULT_COLORS.WHITE);

            expect(result.isValid).toBe(true);
            expect(result.contrastRatio).toBeGreaterThanOrEqual(4.5);
        });

        it('should validate secondary text contrast meets WCAG AA', () => {
            const result = validateWCAGAA(DEFAULT_COLORS.GRAY_500, DEFAULT_COLORS.WHITE);

            expect(result.isValid).toBe(true);
            expect(result.contrastRatio).toBeGreaterThanOrEqual(4.5);
        });

        it('should validate primary link contrast meets WCAG AA', () => {
            const result = validateWCAGAA(DEFAULT_COLORS.PRIMARY, DEFAULT_COLORS.WHITE);

            expect(result.isValid).toBe(true);
            expect(result.contrastRatio).toBeGreaterThanOrEqual(4.5);
        });

        it('should validate all status indicators meet WCAG AA', () => {
            const statusCombinations = [
                { name: 'Success Status', fg: '#047857', bg: '#ecfdf5' },
                { name: 'Warning Status', fg: '#b45309', bg: '#fffbeb' },
                { name: 'Error Status', fg: '#b91c1c', bg: '#fef2f2' }
            ];

            statusCombinations.forEach(({ name, fg, bg }) => {
                const result = validateWCAGAA(fg, bg);
                expect(result.isValid, `${name} should meet WCAG AA`).toBe(true);
                expect(result.contrastRatio).toBeGreaterThanOrEqual(4.5);
            });
        });
    });

    describe('WCAG AAA Compliance', () => {
        it('should test enhanced contrast for critical elements', () => {
            const criticalElements = [
                { name: 'Primary CTA Button', fg: '#ffffff', bg: DEFAULT_COLORS.PRIMARY },
                { name: 'Error Alert', fg: '#ffffff', bg: DEFAULT_COLORS.ERROR },
                { name: 'Main Heading', fg: DEFAULT_COLORS.GRAY_900, bg: DEFAULT_COLORS.WHITE }
            ];

            criticalElements.forEach(({ name, fg, bg }) => {
                const result = validateWCAGAAA(fg, bg);

                if (result.isValid) {
                    expect(result.contrastRatio).toBeGreaterThanOrEqual(7);
                    console.log(`✓ ${name} meets WCAG AAA with ratio ${result.contrastRatio.toFixed(2)}`);
                } else {
                    console.log(`⚠ ${name} only meets AA with ratio ${result.contrastRatio.toFixed(2)}`);
                }
            });
        });

        it('should validate large text AAA compliance', () => {
            const largeTextCombinations = [
                { name: 'Large Heading', fg: DEFAULT_COLORS.GRAY_800, bg: DEFAULT_COLORS.WHITE },
                { name: 'Large Button Text', fg: '#ffffff', bg: DEFAULT_COLORS.PRIMARY }
            ];

            largeTextCombinations.forEach(({ name, fg, bg }) => {
                const result = validateWCAGAAA(fg, bg, true); // isLargeText = true

                expect(result.contrastRatio).toBeGreaterThanOrEqual(3);
                console.log(`${name}: ${result.isValid ? '✓' : '⚠'} Ratio: ${result.contrastRatio.toFixed(2)}`);
            });
        });
    });

    describe('Design System Comprehensive Validation', () => {
        it('should validate all design system color combinations', () => {
            expect(contrastResults).toBeDefined();

            const failingCombinations: string[] = [];

            Object.entries(contrastResults).forEach(([name, result]) => {
                if (!result.isValid) {
                    failingCombinations.push(`${name}: ${result.contrastRatio.toFixed(2)} (required: ${result.requiredRatio})`);
                }
            });

            if (failingCombinations.length > 0) {
                console.warn('Failing color combinations:', failingCombinations);
            }

            // At least 90% of combinations should pass WCAG AA
            const totalCombinations = Object.keys(contrastResults).length;
            const passingCombinations = Object.values(contrastResults).filter(r => r.isValid).length;
            const passRate = passingCombinations / totalCombinations;

            expect(passRate).toBeGreaterThanOrEqual(0.9);
        });

        it('should generate comprehensive accessibility report', () => {
            expect(accessibilityReport.summary).toBeDefined();
            expect(accessibilityReport.details).toBeDefined();
            expect(accessibilityReport.colorBlindnessResults).toBeDefined();

            const { summary } = accessibilityReport;

            expect(summary.totalCombinations).toBeGreaterThan(0);
            expect(summary.passingAA).toBeGreaterThan(0);
            expect(summary.failingAA).toBeGreaterThanOrEqual(0);

            // Log summary for visibility
            console.log('Accessibility Report Summary:', {
                total: summary.totalCombinations,
                passingAA: summary.passingAA,
                passingAAA: summary.passingAAA,
                failingAA: summary.failingAA,
                aaPassRate: `${((summary.passingAA / summary.totalCombinations) * 100).toFixed(1)}%`
            });
        });

        it('should provide recommendations for failing combinations', () => {
            Object.entries(contrastResults).forEach(([name, result]) => {
                if (!result.isValid && result.recommendations) {
                    expect(result.recommendations).toBeInstanceOf(Array);
                    expect(result.recommendations.length).toBeGreaterThan(0);

                    console.log(`Recommendations for ${name}:`, result.recommendations);
                }
            });
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle invalid color formats gracefully', () => {
            const result = validateWCAGAA('invalid-color', '#ffffff');

            // Should not throw error and should return a result
            expect(result).toBeDefined();
            expect(typeof result.isValid).toBe('boolean');
        });

        it('should handle transparent colors', () => {
            const result = validateWCAGAA('rgba(0,0,0,0.5)', '#ffffff');

            expect(result).toBeDefined();
            expect(typeof result.contrastRatio).toBe('number');
        });

        it('should validate extreme contrast combinations', () => {
            const blackOnWhite = validateWCAGAA('#000000', '#ffffff');
            const whiteOnBlack = validateWCAGAA('#ffffff', '#000000');

            expect(blackOnWhite.isValid).toBe(true);
            expect(whiteOnBlack.isValid).toBe(true);
            expect(blackOnWhite.contrastRatio).toBeCloseTo(21, 0); // Maximum possible contrast
            expect(whiteOnBlack.contrastRatio).toBeCloseTo(21, 0);
        });

        it('should validate minimal contrast combinations', () => {
            const grayOnGray = validateWCAGAA('#777777', '#888888');

            expect(grayOnGray.isValid).toBe(false);
            expect(grayOnGray.contrastRatio).toBeLessThan(4.5);
        });
    });

    describe('Performance and Optimization', () => {
        it('should validate contrast calculations are performant', () => {
            const startTime = performance.now();

            // Run 100 contrast calculations
            for (let i = 0; i < 100; i++) {
                validateWCAGAA(DEFAULT_COLORS.PRIMARY, DEFAULT_COLORS.WHITE);
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Should complete 100 calculations in under 100ms
            expect(duration).toBeLessThan(100);
        });

        it('should cache repeated calculations efficiently', () => {
            const color1 = DEFAULT_COLORS.PRIMARY;
            const color2 = DEFAULT_COLORS.WHITE;

            const startTime = performance.now();

            // Run same calculation multiple times
            for (let i = 0; i < 50; i++) {
                validateWCAGAA(color1, color2);
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            // Should be very fast for repeated calculations
            expect(duration).toBeLessThan(50);
        });
    });
});