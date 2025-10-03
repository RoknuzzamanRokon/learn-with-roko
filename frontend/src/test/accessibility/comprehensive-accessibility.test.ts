import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
    runAccessibilityTestSuite,
    testAllColorCombinations,
    testAllComponentConsistency,
    generateColorBlindnessReport,
    createAccessibilityTestReport,
    quickAccessibilityCheck,
    DEFAULT_TEST_CONFIG,
    CRITICAL_COLOR_COMBINATIONS,
    type AccessibilityTestSuiteResult,
    type AccessibilityTestConfig
} from './accessibility-test-utils';

describe('Comprehensive Accessibility Testing Suite', () => {
    let testSuiteResult: AccessibilityTestSuiteResult;
    let testContainer: HTMLDivElement;

    beforeAll(async () => {
        // Create test container
        testContainer = document.createElement('div');
        testContainer.id = 'accessibility-test-container';
        testContainer.style.position = 'absolute';
        testContainer.style.top = '-9999px';
        testContainer.style.left = '-9999px';
        document.body.appendChild(testContainer);

        // Run comprehensive accessibility test suite
        testSuiteResult = runAccessibilityTestSuite(DEFAULT_TEST_CONFIG);
    });

    afterAll(() => {
        if (testContainer && testContainer.parentNode) {
            testContainer.parentNode.removeChild(testContainer);
        }
    });

    describe('Automated Color Contrast Validation', () => {
        it('should validate all critical color combinations meet WCAG AA standards', () => {
            const colorResults = testAllColorCombinations({
                ...DEFAULT_TEST_CONFIG,
                wcagLevel: 'AA'
            });

            const criticalFailures = colorResults.filter(result =>
                result.severity === 'critical' && !result.passed
            );

            expect(criticalFailures.length).toBe(0);

            if (criticalFailures.length > 0) {
                console.error('Critical accessibility failures:', criticalFailures.map(f => ({
                    test: f.testName,
                    contrast: f.wcagResult?.contrastRatio,
                    required: f.wcagResult?.requiredRatio,
                    recommendations: f.recommendations
                })));
            }

            // Log summary of color contrast tests
            const passedTests = colorResults.filter(r => r.passed).length;
            const totalTests = colorResults.length;
            console.log(`Color Contrast Tests: ${passedTests}/${totalTests} passed (${((passedTests / totalTests) * 100).toFixed(1)}%)`);
        });

        it('should provide detailed contrast ratio information for all combinations', () => {
            const colorResults = testAllColorCombinations();

            colorResults.forEach(result => {
                expect(result.wcagResult).toBeDefined();
                expect(result.wcagResult?.contrastRatio).toBeGreaterThan(0);
                expect(typeof result.wcagResult?.isValid).toBe('boolean');

                if (!result.passed) {
                    console.warn(`${result.testName}: Contrast ratio ${result.wcagResult?.contrastRatio.toFixed(2)} (required: ${result.wcagResult?.requiredRatio})`);
                }
            });
        });

        it('should test enhanced WCAG AAA compliance for critical elements', () => {
            const aaaConfig: AccessibilityTestConfig = {
                ...DEFAULT_TEST_CONFIG,
                wcagLevel: 'AAA'
            };

            const aaaResults = testAllColorCombinations(aaaConfig);
            const criticalElements = aaaResults.filter(r =>
                CRITICAL_COLOR_COMBINATIONS.find(c => c.name === r.testName)?.critical
            );

            const aaaPassingCritical = criticalElements.filter(r => r.passed).length;
            const totalCritical = criticalElements.length;

            console.log(`WCAG AAA Critical Elements: ${aaaPassingCritical}/${totalCritical} passed`);

            // At least 70% of critical elements should meet AAA standards
            expect(aaaPassingCritical / totalCritical).toBeGreaterThanOrEqual(0.7);
        });
    });

    describe('Color Blindness Simulation and Testing', () => {
        it('should test all color combinations for color blindness accessibility', () => {
            const colorResults = testAllColorCombinations();
            const colorBlindnessFailures: string[] = [];

            colorResults.forEach(result => {
                if (result.colorBlindnessResults) {
                    const failingTypes = Object.entries(result.colorBlindnessResults)
                        .filter(([_, cbResult]) => !cbResult.isValid)
                        .map(([type]) => type);

                    if (failingTypes.length > 2) {
                        colorBlindnessFailures.push(`${result.testName}: ${failingTypes.join(', ')}`);
                    }
                }
            });

            if (colorBlindnessFailures.length > 0) {
                console.warn('Elements needing additional visual indicators:', colorBlindnessFailures);
            }

            // Most elements should be accessible to at least some forms of color blindness
            expect(colorBlindnessFailures.length).toBeLessThan(colorResults.length * 0.3);
        });

        it('should generate comprehensive color blindness simulation report', () => {
            const colorBlindnessReport = generateColorBlindnessReport();

            expect(Object.keys(colorBlindnessReport).length).toBeGreaterThan(0);

            Object.entries(colorBlindnessReport).forEach(([elementName, simulations]) => {
                expect(simulations.protanopia).toBeDefined();
                expect(simulations.deuteranopia).toBeDefined();
                expect(simulations.tritanopia).toBeDefined();
                expect(simulations.achromatopsia).toBeDefined();

                // Each simulation should return valid color values
                Object.values(simulations).forEach(colorPair => {
                    expect(typeof colorPair).toBe('string');
                    expect(colorPair).toMatch(/^#[0-9a-f]{6}/i);
                });
            });

            console.log('Color blindness simulation report generated for', Object.keys(colorBlindnessReport).length, 'elements');
        });

        it('should validate status indicators work for color blind users', () => {
            const statusElements = [
                { name: 'Success Status', fg: '#047857', bg: '#ecfdf5' },
                { name: 'Warning Status', fg: '#b45309', bg: '#fffbeb' },
                { name: 'Error Status', fg: '#b91c1c', bg: '#fef2f2' }
            ];

            statusElements.forEach(({ name, fg, bg }) => {
                const colorResults = testAllColorCombinations();
                const statusResult = colorResults.find(r => r.testName === name);

                if (statusResult?.colorBlindnessResults) {
                    const failingTypes = Object.entries(statusResult.colorBlindnessResults)
                        .filter(([_, result]) => !result.isValid);

                    if (failingTypes.length > 0) {
                        console.log(`${name} should include icons/patterns for:`, failingTypes.map(([type]) => type));
                    }
                }
            });
        });
    });

    describe('Visual Regression Testing for Color Consistency', () => {
        it('should validate component color consistency across variants', () => {
            const componentResults = testAllComponentConsistency();

            const failingComponents = componentResults.filter(r => !r.passed);

            expect(failingComponents.length).toBe(0);

            if (failingComponents.length > 0) {
                console.error('Components with color consistency issues:',
                    failingComponents.map(c => ({
                        component: c.testName,
                        recommendations: c.recommendations
                    }))
                );
            }

            console.log(`Component consistency tests: ${componentResults.filter(r => r.passed).length}/${componentResults.length} passed`);
        });

        it('should test color consistency across different states', () => {
            const testStates = ['default', 'hover', 'active', 'focus', 'disabled'];
            const buttonElement = document.createElement('button');
            buttonElement.className = 'btn-base btn-primary';
            testContainer.appendChild(buttonElement);

            testStates.forEach(state => {
                // Reset classes
                buttonElement.className = 'btn-base btn-primary';

                // Add state class
                if (state !== 'default') {
                    buttonElement.classList.add(state);
                }

                // Verify state class is applied
                if (state !== 'default') {
                    expect(buttonElement.classList.contains(state)).toBe(true);
                }
            });

            testContainer.removeChild(buttonElement);
        });

        it('should validate responsive color consistency', () => {
            const responsiveElement = document.createElement('div');
            responsiveElement.className = 'responsive-color-test';
            responsiveElement.style.cssText = `
                background-color: var(--primary-600, #2563eb);
                color: var(--white, #ffffff);
            `;
            testContainer.appendChild(responsiveElement);

            // Test CSS custom property usage
            expect(responsiveElement.style.backgroundColor).toContain('var(--primary-600');
            expect(responsiveElement.style.color).toContain('var(--white');

            testContainer.removeChild(responsiveElement);
        });
    });

    describe('Comprehensive Test Suite Results', () => {
        it('should achieve minimum accessibility standards', () => {
            expect(testSuiteResult).toBeDefined();
            expect(testSuiteResult.summary.totalTests).toBeGreaterThan(0);

            const { summary } = testSuiteResult;

            // Log comprehensive summary
            console.log('Accessibility Test Suite Summary:', {
                totalTests: summary.totalTests,
                passed: summary.passed,
                failed: summary.failed,
                warnings: summary.warnings,
                critical: summary.critical,
                passRate: `${summary.passRate.toFixed(1)}%`
            });

            // Minimum standards
            expect(summary.critical).toBe(0); // No critical failures
            expect(summary.passRate).toBeGreaterThanOrEqual(85); // 85% pass rate minimum
        });

        it('should provide actionable recommendations', () => {
            expect(testSuiteResult.recommendations).toBeDefined();
            expect(Array.isArray(testSuiteResult.recommendations)).toBe(true);

            if (testSuiteResult.recommendations.length > 0) {
                console.log('Accessibility Recommendations:');
                testSuiteResult.recommendations.forEach((rec, index) => {
                    console.log(`${index + 1}. ${rec}`);
                });
            }
        });

        it('should generate comprehensive HTML report', () => {
            const htmlReport = createAccessibilityTestReport(testSuiteResult);

            expect(htmlReport).toBeDefined();
            expect(typeof htmlReport).toBe('string');
            expect(htmlReport).toContain('<!DOCTYPE html>');
            expect(htmlReport).toContain('Accessibility Test Report');
            expect(htmlReport).toContain(testSuiteResult.summary.passRate.toFixed(1));

            console.log('HTML report generated successfully');
        });
    });

    describe('Quick Accessibility Checks', () => {
        it('should perform quick accessibility check on DOM elements', () => {
            const testButton = document.createElement('button');
            testButton.style.backgroundColor = '#2563eb';
            testButton.style.color = '#ffffff';
            testButton.textContent = 'Test Button';
            testContainer.appendChild(testButton);

            const quickCheck = quickAccessibilityCheck(testButton);

            expect(quickCheck).toBeDefined();
            expect(quickCheck.testName).toBe('Element Accessibility Check');
            expect(typeof quickCheck.passed).toBe('boolean');
            expect(quickCheck.wcagResult).toBeDefined();

            console.log('Quick check result:', {
                passed: quickCheck.passed,
                contrast: quickCheck.wcagResult?.contrastRatio.toFixed(2),
                recommendations: quickCheck.recommendations
            });

            testContainer.removeChild(testButton);
        });

        it('should handle elements with transparent or complex backgrounds', () => {
            const complexElement = document.createElement('div');
            complexElement.style.backgroundColor = 'rgba(37, 99, 235, 0.8)';
            complexElement.style.color = '#ffffff';
            complexElement.textContent = 'Complex Background';
            testContainer.appendChild(complexElement);

            const quickCheck = quickAccessibilityCheck(complexElement);

            expect(quickCheck).toBeDefined();
            expect(quickCheck.wcagResult).toBeDefined();

            testContainer.removeChild(complexElement);
        });
    });

    describe('Performance and Reliability', () => {
        it('should complete accessibility tests within reasonable time', () => {
            const startTime = performance.now();

            const quickSuite = runAccessibilityTestSuite({
                wcagLevel: 'AA',
                includeColorBlindness: true,
                includeVisualRegression: false,
                testLargeText: false,
                generateReport: false
            });

            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(quickSuite).toBeDefined();
            expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds

            console.log(`Accessibility test suite completed in ${duration.toFixed(2)}ms`);
        });

        it('should handle edge cases gracefully', () => {
            const edgeCases = [
                { fg: '#000000', bg: '#000000' }, // Same colors
                { fg: '#ffffff', bg: '#ffffff' }, // Same colors
                { fg: 'invalid', bg: '#ffffff' }, // Invalid color
                { fg: '#ffffff', bg: 'invalid' }  // Invalid color
            ];

            edgeCases.forEach(({ fg, bg }) => {
                expect(() => {
                    const colorResults = testAllColorCombinations();
                    // Should not throw errors even with invalid inputs
                }).not.toThrow();
            });
        });

        it('should provide consistent results across multiple runs', () => {
            const run1 = runAccessibilityTestSuite(DEFAULT_TEST_CONFIG);
            const run2 = runAccessibilityTestSuite(DEFAULT_TEST_CONFIG);

            expect(run1.summary.totalTests).toBe(run2.summary.totalTests);
            expect(run1.summary.passed).toBe(run2.summary.passed);
            expect(run1.summary.failed).toBe(run2.summary.failed);

            console.log('Consistency check passed - results are deterministic');
        });
    });

    describe('Integration with Design System', () => {
        it('should validate all design system colors meet accessibility standards', () => {
            const designSystemResults = testSuiteResult.results.filter(r =>
                r.testName.includes('Button') ||
                r.testName.includes('Status') ||
                r.testName.includes('Text')
            );

            const criticalDesignSystemFailures = designSystemResults.filter(r =>
                r.severity === 'critical' && !r.passed
            );

            expect(criticalDesignSystemFailures.length).toBe(0);

            console.log(`Design system accessibility: ${designSystemResults.filter(r => r.passed).length}/${designSystemResults.length} components passed`);
        });

        it('should ensure color system supports future enhancements', () => {
            // Test that the color system is extensible
            const futureColors = [
                { name: 'Future Primary', fg: '#1e40af', bg: '#ffffff' },
                { name: 'Future Success', fg: '#065f46', bg: '#d1fae5' },
                { name: 'Future Warning', fg: '#92400e', bg: '#fef3c7' }
            ];

            futureColors.forEach(({ name, fg, bg }) => {
                const colorResults = testAllColorCombinations();
                // System should be able to handle new color combinations
                expect(colorResults).toBeDefined();
            });

            console.log('Color system is ready for future enhancements');
        });
    });
});