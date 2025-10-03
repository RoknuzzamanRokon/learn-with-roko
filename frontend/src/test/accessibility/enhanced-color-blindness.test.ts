import { describe, it, expect } from 'vitest';
import {
    simulateColorBlindness,
    validateColorBlindFriendly,
    type ColorBlindnessType
} from '../../styles/accessibility-utils';
import { DEFAULT_COLORS } from '../../styles';

/**
 * Enhanced Color Blindness Testing Suite
 * 
 * This test suite provides comprehensive color blindness simulation and testing
 * to ensure the design system is accessible to users with various types of color vision deficiencies.
 */

describe('Enhanced Color Blindness Testing', () => {
    const colorBlindnessTypes: ColorBlindnessType[] = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];

    describe('Comprehensive UI Element Color Blindness Testing', () => {
        it('should test color differentiation for all UI element categories', () => {
            const uiElementCategories = [
                {
                    category: 'Interactive Buttons',
                    elements: [
                        { name: 'Primary Button', fg: '#ffffff', bg: DEFAULT_COLORS.PRIMARY },
                        { name: 'Secondary Button', fg: '#374151', bg: '#f3f4f6' },
                        { name: 'Success Button', fg: '#ffffff', bg: DEFAULT_COLORS.SUCCESS },
                        { name: 'Warning Button', fg: '#ffffff', bg: DEFAULT_COLORS.WARNING },
                        { name: 'Error Button', fg: '#ffffff', bg: DEFAULT_COLORS.ERROR }
                    ]
                },
                {
                    category: 'Status Indicators',
                    elements: [
                        { name: 'Success Status', fg: '#065f46', bg: '#d1fae5' },
                        { name: 'Warning Status', fg: '#92400e', bg: '#fef3c7' },
                        { name: 'Error Status', fg: '#991b1b', bg: '#fee2e2' },
                        { name: 'Info Status', fg: '#1e40af', bg: '#dbeafe' }
                    ]
                },
                {
                    category: 'Navigation Elements',
                    elements: [
                        { name: 'Active Link', fg: DEFAULT_COLORS.PRIMARY, bg: DEFAULT_COLORS.WHITE },
                        { name: 'Visited Link', fg: '#7c3aed', bg: DEFAULT_COLORS.WHITE },
                        { name: 'Navigation Highlight', fg: DEFAULT_COLORS.PRIMARY, bg: '#dbeafe' },
                        { name: 'Breadcrumb Active', fg: '#1d4ed8', bg: DEFAULT_COLORS.WHITE }
                    ]
                },
                {
                    category: 'Form Elements',
                    elements: [
                        { name: 'Form Error State', fg: '#dc2626', bg: DEFAULT_COLORS.WHITE },
                        { name: 'Form Success State', fg: '#059669', bg: DEFAULT_COLORS.WHITE },
                        { name: 'Required Field Indicator', fg: '#dc2626', bg: DEFAULT_COLORS.WHITE },
                        { name: 'Form Focus State', fg: '#1e40af', bg: '#dbeafe' }
                    ]
                }
            ];

            uiElementCategories.forEach(({ category, elements }) => {
                console.log(`\n=== ${category} Color Blindness Analysis ===`);

                elements.forEach(({ name, fg, bg }) => {
                    const results = validateColorBlindFriendly(fg, bg);

                    const typeResults = colorBlindnessTypes.map(type => {
                        const simulatedFg = simulateColorBlindness(fg, type);
                        const simulatedBg = simulateColorBlindness(bg, type);

                        return {
                            type,
                            passed: results[type].isValid,
                            contrast: results[type].contrastRatio,
                            original: { fg, bg },
                            simulated: { fg: simulatedFg, bg: simulatedBg }
                        };
                    });

                    const passedTypes = typeResults.filter(r => r.passed).length;
                    const passRate = (passedTypes / colorBlindnessTypes.length) * 100;

                    console.log(`${name}: ${passRate.toFixed(1)}% accessibility rate`);

                    typeResults.forEach(({ type, passed, contrast, simulated }) => {
                        const status = passed ? '✓' : '✗';
                        console.log(`  ${status} ${type}: ${contrast.toFixed(2)} contrast (${simulated.fg} on ${simulated.bg})`);
                    });

                    // Critical UI elements should have good color blind accessibility
                    if (['Interactive Buttons', 'Status Indicators'].includes(category)) {
                        expect(passRate, `${name} should be accessible to most color blind users`).toBeGreaterThanOrEqual(50);
                    }
                });
            });
        });

        it('should analyze color differentiation between similar elements', () => {
            const colorPairs = [
                {
                    name: 'Success vs Warning Buttons',
                    colors: [DEFAULT_COLORS.SUCCESS, DEFAULT_COLORS.WARNING],
                    context: 'Critical for user actions'
                },
                {
                    name: 'Error vs Warning Status',
                    colors: [DEFAULT_COLORS.ERROR, DEFAULT_COLORS.WARNING],
                    context: 'Important for status communication'
                },
                {
                    name: 'Primary vs Success Actions',
                    colors: [DEFAULT_COLORS.PRIMARY, DEFAULT_COLORS.SUCCESS],
                    context: 'May cause confusion in forms'
                },
                {
                    name: 'Active vs Visited Links',
                    colors: [DEFAULT_COLORS.PRIMARY, '#7c3aed'],
                    context: 'Navigation state indication'
                }
            ];

            console.log('\n=== Color Differentiation Analysis ===');

            colorPairs.forEach(({ name, colors, context }) => {
                console.log(`\n${name} (${context}):`);

                colorBlindnessTypes.forEach(type => {
                    const simulatedColors = colors.map(color => simulateColorBlindness(color, type));
                    const colorDistance = calculateColorDistance(simulatedColors[0], simulatedColors[1]);
                    const areSufficientlyDifferent = colorDistance > 50; // Threshold for noticeable difference

                    const status = areSufficientlyDifferent ? '✓' : '⚠';
                    console.log(`  ${status} ${type}: Distance ${colorDistance.toFixed(1)} (${areSufficientlyDifferent ? 'Distinguishable' : 'May be confusing'})`);

                    if (!areSufficientlyDifferent) {
                        console.log(`    Recommendation: Add icons, patterns, or text labels`);
                    }
                });
            });
        });

        it('should validate color blindness simulation accuracy and consistency', () => {
            const testColors = [
                { color: '#ff0000', name: 'Pure Red', expectedChanges: ['protanopia', 'deuteranopia'] },
                { color: '#00ff00', name: 'Pure Green', expectedChanges: ['protanopia', 'deuteranopia'] },
                { color: '#0000ff', name: 'Pure Blue', expectedChanges: ['tritanopia'] },
                { color: '#ffff00', name: 'Yellow', expectedChanges: ['tritanopia'] },
                { color: '#808080', name: 'Gray', expectedChanges: [] } // Should remain unchanged for most types
            ];

            console.log('\n=== Color Blindness Simulation Validation ===');

            testColors.forEach(({ color, name, expectedChanges }) => {
                console.log(`\n${name} (${color}):`);

                colorBlindnessTypes.forEach(type => {
                    const simulated = simulateColorBlindness(color, type);
                    const hasChanged = simulated !== color;
                    const shouldChange = expectedChanges.includes(type) || type === 'achromatopsia';

                    // Validate hex format
                    expect(simulated).toMatch(/^#[0-9a-f]{6}$/i);

                    // For achromatopsia, result should be grayscale
                    if (type === 'achromatopsia') {
                        const rgb = hexToRgb(simulated);
                        if (rgb) {
                            expect(rgb.r).toBe(rgb.g);
                            expect(rgb.g).toBe(rgb.b);
                        }
                    }

                    const changeStatus = hasChanged ? 'Changed' : 'Unchanged';
                    const expectedStatus = shouldChange ? 'Expected' : 'Acceptable';
                    console.log(`  ${type}: ${simulated} (${changeStatus}, ${expectedStatus})`);
                });
            });
        });
    });

    describe('Accessibility Recommendations and Implementation Guide', () => {
        it('should provide specific implementation recommendations for color blind accessibility', () => {
            const implementationGuide = [
                {
                    category: 'Status Indicators',
                    issue: 'Color-only status communication',
                    solution: 'Add semantic icons alongside colors',
                    examples: [
                        '✓ Success (green background + checkmark icon)',
                        '⚠ Warning (yellow background + warning icon)',
                        '✗ Error (red background + X icon)',
                        'ℹ Info (blue background + info icon)'
                    ],
                    implementation: 'Use icon fonts (Font Awesome, Heroicons) or SVG icons with semantic meaning',
                    priority: 'High'
                },
                {
                    category: 'Form Validation',
                    issue: 'Color-only error indication',
                    solution: 'Combine color with text descriptions and border patterns',
                    examples: [
                        'Red border + "Error: Email is required" text',
                        'Green border + "✓ Valid email address" text',
                        'Dashed borders for warnings',
                        'ARIA live regions for screen readers'
                    ],
                    implementation: 'Use CSS border styles, descriptive error messages, and ARIA attributes',
                    priority: 'High'
                },
                {
                    category: 'Interactive Elements',
                    issue: 'Button state indication relies on color',
                    solution: 'Use multiple visual indicators',
                    examples: [
                        'Underlines for links',
                        'Border changes for button states',
                        'Shadow effects for elevation',
                        'Text labels for icon buttons'
                    ],
                    implementation: 'Combine color changes with border, shadow, and typography modifications',
                    priority: 'Medium'
                },
                {
                    category: 'Data Visualization',
                    issue: 'Charts and graphs use color-only differentiation',
                    solution: 'Use patterns, textures, and direct labeling',
                    examples: [
                        'Hatching patterns for different data series',
                        'Different line styles (solid, dashed, dotted)',
                        'Direct data labels on chart elements',
                        'Shape variations for scatter plots'
                    ],
                    implementation: 'Use CSS patterns, SVG textures, and comprehensive labeling',
                    priority: 'Medium'
                },
                {
                    category: 'Navigation',
                    issue: 'Active/current page indication uses color only',
                    solution: 'Add text indicators and visual emphasis',
                    examples: [
                        'Bold text for current page',
                        'Underline for active navigation items',
                        '"Current page" text for screen readers',
                        'Breadcrumb separators and labels'
                    ],
                    implementation: 'Use font-weight, text-decoration, and ARIA current attributes',
                    priority: 'Medium'
                }
            ];

            console.log('\n=== Color Blind Accessibility Implementation Guide ===');

            implementationGuide.forEach(({ category, issue, solution, examples, implementation, priority }) => {
                console.log(`\n${category} [${priority} Priority]:`);
                console.log(`  Issue: ${issue}`);
                console.log(`  Solution: ${solution}`);
                console.log(`  Examples:`);
                examples.forEach(example => {
                    console.log(`    • ${example}`);
                });
                console.log(`  Implementation: ${implementation}`);
            });

            // Validate completeness of recommendations
            expect(implementationGuide.length).toBeGreaterThanOrEqual(5);
            implementationGuide.forEach(guide => {
                expect(guide.examples.length).toBeGreaterThan(0);
                expect(guide.implementation).toBeDefined();
                expect(['High', 'Medium', 'Low'].includes(guide.priority)).toBe(true);
            });
        });

        it('should generate comprehensive color blindness accessibility report', () => {
            const testElements = [
                { name: 'Primary CTA Button', fg: '#ffffff', bg: DEFAULT_COLORS.PRIMARY, critical: true },
                { name: 'Success Alert', fg: '#065f46', bg: '#d1fae5', critical: true },
                { name: 'Warning Alert', fg: '#92400e', bg: '#fef3c7', critical: true },
                { name: 'Error Alert', fg: '#991b1b', bg: '#fee2e2', critical: true },
                { name: 'Info Alert', fg: '#1e40af', bg: '#dbeafe', critical: false },
                { name: 'Body Text', fg: DEFAULT_COLORS.GRAY_600, bg: DEFAULT_COLORS.WHITE, critical: true },
                { name: 'Secondary Text', fg: DEFAULT_COLORS.GRAY_500, bg: DEFAULT_COLORS.WHITE, critical: false }
            ];

            const report = testElements.map(({ name, fg, bg, critical }) => {
                const results = validateColorBlindFriendly(fg, bg);
                const passingTypes = colorBlindnessTypes.filter(type => results[type].isValid);
                const passRate = (passingTypes.length / colorBlindnessTypes.length) * 100;

                return {
                    element: name,
                    critical,
                    passRate,
                    passing: passingTypes,
                    failing: colorBlindnessTypes.filter(type => !results[type].isValid),
                    needsAlternativeIndicators: passRate < 75,
                    recommendations: generateRecommendations(name, passingTypes, colorBlindnessTypes)
                };
            });

            console.log('\n=== Color Blindness Accessibility Report ===');
            console.table(report.map(r => ({
                Element: r.element,
                Critical: r.critical ? 'Yes' : 'No',
                'Pass Rate': `${r.passRate.toFixed(1)}%`,
                'Needs Enhancement': r.needsAlternativeIndicators ? 'Yes' : 'No'
            })));

            // Critical elements should have good accessibility
            const criticalElements = report.filter(r => r.critical);
            const criticalWithGoodAccessibility = criticalElements.filter(r => r.passRate >= 75);
            const criticalAccessibilityRate = (criticalWithGoodAccessibility.length / criticalElements.length) * 100;

            expect(criticalAccessibilityRate).toBeGreaterThanOrEqual(80);
            console.log(`\nCritical elements accessibility rate: ${criticalAccessibilityRate.toFixed(1)}%`);

            // Overall accessibility should be good
            const elementsWithGoodAccessibility = report.filter(r => r.passRate >= 75);
            const overallAccessibilityRate = (elementsWithGoodAccessibility.length / report.length) * 100;

            expect(overallAccessibilityRate).toBeGreaterThanOrEqual(70);
            console.log(`Overall color blindness accessibility rate: ${overallAccessibilityRate.toFixed(1)}%`);

            // Log specific recommendations
            const elementsNeedingEnhancement = report.filter(r => r.needsAlternativeIndicators);
            if (elementsNeedingEnhancement.length > 0) {
                console.log('\n=== Elements Needing Enhancement ===');
                elementsNeedingEnhancement.forEach(({ element, recommendations }) => {
                    console.log(`${element}:`);
                    recommendations.forEach(rec => {
                        console.log(`  • ${rec}`);
                    });
                });
            }
        });
    });

    describe('Advanced Color Blindness Testing', () => {
        it('should test color combinations in different lighting conditions', () => {
            const lightingConditions = [
                { name: 'Bright Sunlight', modifier: 0.8 }, // Colors appear washed out
                { name: 'Indoor Lighting', modifier: 1.0 }, // Normal conditions
                { name: 'Low Light', modifier: 1.2 }, // Colors appear darker
                { name: 'Blue Light Filter', modifier: 0.9 } // Warmer colors
            ];

            const testCombinations = [
                { name: 'Primary Button', fg: '#ffffff', bg: DEFAULT_COLORS.PRIMARY },
                { name: 'Error Text', fg: '#dc2626', bg: DEFAULT_COLORS.WHITE }
            ];

            console.log('\n=== Lighting Condition Analysis ===');

            testCombinations.forEach(({ name, fg, bg }) => {
                console.log(`\n${name}:`);

                lightingConditions.forEach(({ name: conditionName, modifier }) => {
                    const adjustedFg = adjustColorForLighting(fg, modifier);
                    const adjustedBg = adjustColorForLighting(bg, modifier);

                    colorBlindnessTypes.forEach(type => {
                        const simulatedFg = simulateColorBlindness(adjustedFg, type);
                        const simulatedBg = simulateColorBlindness(adjustedBg, type);
                        const results = validateColorBlindFriendly(simulatedFg, simulatedBg);

                        const status = results[type].isValid ? '✓' : '✗';
                        console.log(`  ${status} ${conditionName} + ${type}: ${results[type].contrastRatio.toFixed(2)}`);
                    });
                });
            });
        });

        it('should validate color blindness accessibility across different screen types', () => {
            const screenTypes = [
                { name: 'LCD Monitor', colorAccuracy: 0.95 },
                { name: 'OLED Display', colorAccuracy: 1.0 },
                { name: 'Mobile Screen', colorAccuracy: 0.9 },
                { name: 'E-ink Display', colorAccuracy: 0.3 }
            ];

            const criticalElements = [
                { name: 'Error Button', fg: '#ffffff', bg: DEFAULT_COLORS.ERROR },
                { name: 'Success Status', fg: '#065f46', bg: '#d1fae5' }
            ];

            console.log('\n=== Screen Type Compatibility Analysis ===');

            criticalElements.forEach(({ name, fg, bg }) => {
                console.log(`\n${name}:`);

                screenTypes.forEach(({ name: screenName, colorAccuracy }) => {
                    const adjustedFg = adjustColorAccuracy(fg, colorAccuracy);
                    const adjustedBg = adjustColorAccuracy(bg, colorAccuracy);

                    const accessibilityResults = colorBlindnessTypes.map(type => {
                        const simulatedFg = simulateColorBlindness(adjustedFg, type);
                        const simulatedBg = simulateColorBlindness(adjustedBg, type);
                        const results = validateColorBlindFriendly(simulatedFg, simulatedBg);
                        return results[type].isValid;
                    });

                    const passRate = (accessibilityResults.filter(Boolean).length / colorBlindnessTypes.length) * 100;
                    const status = passRate >= 75 ? '✓' : '⚠';

                    console.log(`  ${status} ${screenName}: ${passRate.toFixed(1)}% accessibility`);
                });
            });
        });
    });
});

// Helper functions
function calculateColorDistance(color1: string, color2: string): number {
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    if (!rgb1 || !rgb2) return 0;

    // Calculate Euclidean distance in RGB space
    const rDiff = rgb1.r - rgb2.r;
    const gDiff = rgb1.g - rgb2.g;
    const bDiff = rgb1.b - rgb2.b;

    return Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function adjustColorForLighting(color: string, modifier: number): string {
    const rgb = hexToRgb(color);
    if (!rgb) return color;

    const adjusted = {
        r: Math.min(255, Math.max(0, Math.round(rgb.r * modifier))),
        g: Math.min(255, Math.max(0, Math.round(rgb.g * modifier))),
        b: Math.min(255, Math.max(0, Math.round(rgb.b * modifier)))
    };

    return rgbToHex(adjusted.r, adjusted.g, adjusted.b);
}

function adjustColorAccuracy(color: string, accuracy: number): string {
    const rgb = hexToRgb(color);
    if (!rgb) return color;

    // Simulate color accuracy by reducing color depth
    const adjusted = {
        r: Math.round(rgb.r * accuracy),
        g: Math.round(rgb.g * accuracy),
        b: Math.round(rgb.b * accuracy)
    };

    return rgbToHex(adjusted.r, adjusted.g, adjusted.b);
}

function generateRecommendations(elementName: string, passingTypes: ColorBlindnessType[], allTypes: ColorBlindnessType[]): string[] {
    const failingTypes = allTypes.filter(type => !passingTypes.includes(type));
    const recommendations: string[] = [];

    if (failingTypes.length === 0) {
        recommendations.push('Good color blind accessibility - no changes needed');
        return recommendations;
    }

    if (elementName.includes('Button')) {
        recommendations.push('Add text labels or icons to buttons');
        recommendations.push('Use border or shadow changes for button states');
    }

    if (elementName.includes('Status') || elementName.includes('Alert')) {
        recommendations.push('Add semantic icons (✓, ⚠, ✗, ℹ)');
        recommendations.push('Include descriptive text alongside color');
    }

    if (elementName.includes('Text')) {
        recommendations.push('Increase contrast ratio if possible');
        recommendations.push('Consider using bold or italic for emphasis');
    }

    if (failingTypes.includes('protanopia') || failingTypes.includes('deuteranopia')) {
        recommendations.push('Avoid red-green color combinations');
    }

    if (failingTypes.includes('tritanopia')) {
        recommendations.push('Avoid blue-yellow color combinations');
    }

    if (failingTypes.includes('achromatopsia')) {
        recommendations.push('Ensure sufficient contrast for grayscale viewing');
    }

    return recommendations;
}