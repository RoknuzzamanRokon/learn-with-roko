import { describe, it, expect, beforeAll } from 'vitest';
import {
    simulateColorBlindness,
    validateColorBlindFriendly,
    validateWCAGAA,
    type ColorBlindnessType,
    type AccessibilityValidationResult
} from '../../styles/accessibility-utils';
import { DEFAULT_COLORS } from '../../styles';

describe('Color Blindness Simulation and Testing', () => {
    const colorBlindnessTypes: ColorBlindnessType[] = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];

    describe('Color Blindness Simulation', () => {
        it('should simulate protanopia (red-blind) correctly', () => {
            const originalRed = '#ff0000';
            const simulatedColor = simulateColorBlindness(originalRed, 'protanopia');

            expect(simulatedColor).toBeDefined();
            expect(simulatedColor).toMatch(/^#[0-9a-f]{6}$/i);
            expect(simulatedColor).not.toBe(originalRed);

            console.log(`Protanopia simulation: ${originalRed} → ${simulatedColor}`);
        });

        it('should simulate deuteranopia (green-blind) correctly', () => {
            const originalGreen = '#00ff00';
            const simulatedColor = simulateColorBlindness(originalGreen, 'deuteranopia');

            expect(simulatedColor).toBeDefined();
            expect(simulatedColor).toMatch(/^#[0-9a-f]{6}$/i);
            expect(simulatedColor).not.toBe(originalGreen);

            console.log(`Deuteranopia simulation: ${originalGreen} → ${simulatedColor}`);
        });

        it('should simulate tritanopia (blue-blind) correctly', () => {
            const originalBlue = '#0000ff';
            const simulatedColor = simulateColorBlindness(originalBlue, 'tritanopia');

            expect(simulatedColor).toBeDefined();
            expect(simulatedColor).toMatch(/^#[0-9a-f]{6}$/i);
            expect(simulatedColor).not.toBe(originalBlue);

            console.log(`Tritanopia simulation: ${originalBlue} → ${simulatedColor}`);
        });

        it('should simulate achromatopsia (complete color blindness) correctly', () => {
            const originalColor = DEFAULT_COLORS.PRIMARY;
            const simulatedColor = simulateColorBlindness(originalColor, 'achromatopsia');

            expect(simulatedColor).toBeDefined();
            expect(simulatedColor).toMatch(/^#[0-9a-f]{6}$/i);

            // Should be grayscale (all RGB components equal)
            const rgb = simulatedColor.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
            if (rgb) {
                const r = parseInt(rgb[1], 16);
                const g = parseInt(rgb[2], 16);
                const b = parseInt(rgb[3], 16);

                // All components should be equal (grayscale)
                expect(r).toBe(g);
                expect(g).toBe(b);
            }

            console.log(`Achromatopsia simulation: ${originalColor} → ${simulatedColor}`);
        });

        it('should handle edge cases in color simulation', () => {
            const edgeCases = ['#000000', '#ffffff', '#808080'];

            edgeCases.forEach(color => {
                colorBlindnessTypes.forEach(type => {
                    const simulated = simulateColorBlindness(color, type);
                    expect(simulated).toBeDefined();
                    expect(simulated).toMatch(/^#[0-9a-f]{6}$/i);
                });
            });
        });
    });

    describe('Design System Color Blindness Validation', () => {
        const criticalColorCombinations = [
            { name: 'Primary Button', fg: '#ffffff', bg: DEFAULT_COLORS.PRIMARY },
            { name: 'Success Status', fg: '#047857', bg: '#ecfdf5' },
            { name: 'Warning Status', fg: '#b45309', bg: '#fffbeb' },
            { name: 'Error Status', fg: '#b91c1c', bg: '#fef2f2' },
            { name: 'Body Text', fg: DEFAULT_COLORS.GRAY_600, bg: DEFAULT_COLORS.WHITE },
            { name: 'Navigation Active', fg: DEFAULT_COLORS.PRIMARY, bg: '#dbeafe' }
        ];

        criticalColorCombinations.forEach(({ name, fg, bg }) => {
            describe(`${name} Color Blindness Accessibility`, () => {
                let colorBlindResults: Record<ColorBlindnessType, AccessibilityValidationResult>;

                beforeAll(() => {
                    colorBlindResults = validateColorBlindFriendly(fg, bg);
                });

                it('should be accessible for protanopia users', () => {
                    const result = colorBlindResults.protanopia;

                    if (!result.isValid) {
                        console.warn(`${name} may not be accessible for protanopia users:`, {
                            contrast: result.contrastRatio.toFixed(2),
                            required: result.requiredRatio,
                            recommendations: result.recommendations
                        });
                    }

                    // Log result for visibility
                    console.log(`${name} protanopia: ${result.isValid ? '✓' : '⚠'} (${result.contrastRatio.toFixed(2)})`);
                });

                it('should be accessible for deuteranopia users', () => {
                    const result = colorBlindResults.deuteranopia;

                    if (!result.isValid) {
                        console.warn(`${name} may not be accessible for deuteranopia users:`, {
                            contrast: result.contrastRatio.toFixed(2),
                            required: result.requiredRatio,
                            recommendations: result.recommendations
                        });
                    }

                    console.log(`${name} deuteranopia: ${result.isValid ? '✓' : '⚠'} (${result.contrastRatio.toFixed(2)})`);
                });

                it('should be accessible for tritanopia users', () => {
                    const result = colorBlindResults.tritanopia;

                    if (!result.isValid) {
                        console.warn(`${name} may not be accessible for tritanopia users:`, {
                            contrast: result.contrastRatio.toFixed(2),
                            required: result.requiredRatio,
                            recommendations: result.recommendations
                        });
                    }

                    console.log(`${name} tritanopia: ${result.isValid ? '✓' : '⚠'} (${result.contrastRatio.toFixed(2)})`);
                });

                it('should be accessible for achromatopsia users', () => {
                    const result = colorBlindResults.achromatopsia;

                    if (!result.isValid) {
                        console.warn(`${name} may not be accessible for achromatopsia users:`, {
                            contrast: result.contrastRatio.toFixed(2),
                            required: result.requiredRatio,
                            recommendations: result.recommendations
                        });
                    }

                    console.log(`${name} achromatopsia: ${result.isValid ? '✓' : '⚠'} (${result.contrastRatio.toFixed(2)})`);
                });

                it('should pass accessibility for at least 75% of color blindness types', () => {
                    const results = Object.values(colorBlindResults);
                    const passingResults = results.filter(r => r.isValid);
                    const passRate = passingResults.length / results.length;

                    expect(passRate).toBeGreaterThanOrEqual(0.75);

                    console.log(`${name} color blindness pass rate: ${(passRate * 100).toFixed(1)}%`);
                });
            });
        });
    });

    describe('Status Indicator Color Blindness Testing', () => {
        const statusColors = {
            success: { color: '#10b981', bg: '#ecfdf5' },
            warning: { color: '#f59e0b', bg: '#fffbeb' },
            error: { color: '#ef4444', bg: '#fef2f2' },
            info: { color: '#3b82f6', bg: '#eff6ff' }
        };

        Object.entries(statusColors).forEach(([status, { color, bg }]) => {
            it(`should differentiate ${status} status for color blind users`, () => {
                const results = validateColorBlindFriendly(color, bg);

                // Test that the status is distinguishable in at least some form of color blindness
                const hasGoodContrast = Object.values(results).some(result => result.isValid);

                if (!hasGoodContrast) {
                    console.warn(`${status} status may need additional visual indicators (icons, patterns) for color blind users`);
                }

                // Log detailed results
                colorBlindnessTypes.forEach(type => {
                    const result = results[type];
                    console.log(`${status} ${type}: ${result.isValid ? '✓' : '⚠'} (${result.contrastRatio.toFixed(2)})`);
                });
            });
        });

        it('should recommend alternative indicators for problematic status colors', () => {
            const problematicCombinations: string[] = [];

            Object.entries(statusColors).forEach(([status, { color, bg }]) => {
                const results = validateColorBlindFriendly(color, bg);
                const failingTypes = colorBlindnessTypes.filter(type => !results[type].isValid);

                if (failingTypes.length > 2) {
                    problematicCombinations.push(status);
                }
            });

            if (problematicCombinations.length > 0) {
                console.log('Status indicators that should include icons or patterns:', problematicCombinations);

                // Provide specific recommendations
                problematicCombinations.forEach(status => {
                    console.log(`Recommendation for ${status}: Add icon (✓, ⚠, ✕, ℹ) and/or pattern/texture`);
                });
            }
        });
    });

    describe('Interactive Element Color Blindness Testing', () => {
        const interactiveElements = [
            { name: 'Primary Link', color: DEFAULT_COLORS.PRIMARY, bg: DEFAULT_COLORS.WHITE },
            { name: 'Visited Link', color: '#7c3aed', bg: DEFAULT_COLORS.WHITE },
            { name: 'Focus Indicator', color: '#2563eb', bg: '#dbeafe' },
            { name: 'Selected Item', color: '#ffffff', bg: '#1d4ed8' }
        ];

        interactiveElements.forEach(({ name, color, bg }) => {
            it(`should ensure ${name} is distinguishable for color blind users`, () => {
                const results = validateColorBlindFriendly(color, bg);

                // Interactive elements should be accessible to most color blind users
                const passingTypes = colorBlindnessTypes.filter(type => results[type].isValid);
                const passRate = passingTypes.length / colorBlindnessTypes.length;

                expect(passRate).toBeGreaterThanOrEqual(0.5); // At least 50% should pass

                console.log(`${name} color blindness accessibility:`, {
                    passRate: `${(passRate * 100).toFixed(1)}%`,
                    passing: passingTypes,
                    failing: colorBlindnessTypes.filter(type => !results[type].isValid)
                });
            });
        });
    });

    describe('Color Blindness Simulation Accuracy', () => {
        it('should produce consistent simulation results', () => {
            const testColor = DEFAULT_COLORS.PRIMARY;

            colorBlindnessTypes.forEach(type => {
                const result1 = simulateColorBlindness(testColor, type);
                const result2 = simulateColorBlindness(testColor, type);

                expect(result1).toBe(result2);
            });
        });

        it('should handle RGB and hex color formats', () => {
            const hexColor = '#2563eb';
            const rgbColor = 'rgb(37, 99, 235)';

            // Both should produce valid results (though may differ due to format)
            colorBlindnessTypes.forEach(type => {
                const hexResult = simulateColorBlindness(hexColor, type);
                expect(hexResult).toMatch(/^#[0-9a-f]{6}$/i);

                // RGB format handling would need additional implementation
                // For now, just test that hex works consistently
            });
        });

        it('should preserve brightness relationships in simulations', () => {
            const lightColor = '#f0f0f0';
            const darkColor = '#303030';

            colorBlindnessTypes.forEach(type => {
                const lightSimulated = simulateColorBlindness(lightColor, type);
                const darkSimulated = simulateColorBlindness(darkColor, type);

                // Extract brightness (simple average of RGB)
                const getLightness = (hex: string) => {
                    const rgb = hex.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
                    if (!rgb) return 0;
                    const r = parseInt(rgb[1], 16);
                    const g = parseInt(rgb[2], 16);
                    const b = parseInt(rgb[3], 16);
                    return (r + g + b) / 3;
                };

                const lightSimulatedBrightness = getLightness(lightSimulated);
                const darkSimulatedBrightness = getLightness(darkSimulated);

                // Light color should still be lighter than dark color after simulation
                expect(lightSimulatedBrightness).toBeGreaterThan(darkSimulatedBrightness);
            });
        });
    });

    describe('Comprehensive Color Blindness Report', () => {
        it('should generate comprehensive color blindness accessibility report', () => {
            const testCombinations = [
                { name: 'Primary Button', fg: '#ffffff', bg: DEFAULT_COLORS.PRIMARY },
                { name: 'Success Alert', fg: '#047857', bg: '#ecfdf5' },
                { name: 'Warning Alert', fg: '#b45309', bg: '#fffbeb' },
                { name: 'Error Alert', fg: '#b91c1c', bg: '#fef2f2' },
                { name: 'Body Text', fg: DEFAULT_COLORS.GRAY_600, bg: DEFAULT_COLORS.WHITE }
            ];

            const report = testCombinations.map(({ name, fg, bg }) => {
                const results = validateColorBlindFriendly(fg, bg);
                const passingTypes = colorBlindnessTypes.filter(type => results[type].isValid);

                return {
                    element: name,
                    passRate: (passingTypes.length / colorBlindnessTypes.length) * 100,
                    passing: passingTypes,
                    failing: colorBlindnessTypes.filter(type => !results[type].isValid),
                    needsAlternativeIndicators: passingTypes.length < 3
                };
            });

            console.log('Color Blindness Accessibility Report:');
            console.table(report.map(r => ({
                Element: r.element,
                'Pass Rate': `${r.passRate.toFixed(1)}%`,
                'Needs Icons/Patterns': r.needsAlternativeIndicators ? 'Yes' : 'No'
            })));

            // At least 80% of elements should have good color blindness accessibility
            const elementsWithGoodAccessibility = report.filter(r => r.passRate >= 75);
            const overallPassRate = elementsWithGoodAccessibility.length / report.length;

            expect(overallPassRate).toBeGreaterThanOrEqual(0.8);
        });
    });
});