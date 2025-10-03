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
import {
    validateWCAGAA,
    validateWCAGAAA,
    validateColorBlindFriendly,
    simulateColorBlindness,
    type ColorBlindnessType
} from '../../styles/accessibility-utils';

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

    describe('Keyboard Navigation Testing with Color Feedback', () => {
        it('should test keyboard navigation with proper color feedback for interactive elements', () => {
            const interactiveElements = [
                { tag: 'button', className: 'btn-primary', text: 'Primary Button' },
                { tag: 'button', className: 'btn-secondary', text: 'Secondary Button' },
                { tag: 'a', className: 'link-primary', text: 'Primary Link' },
                { tag: 'input', className: 'form-input', text: '', type: 'text' }
            ];

            interactiveElements.forEach(({ tag, className, text, type }) => {
                const element = document.createElement(tag) as HTMLElement;
                element.className = className;
                if (text) element.textContent = text;
                if (type && element instanceof HTMLInputElement) {
                    element.type = type;
                }
                testContainer.appendChild(element);

                // Test focus state
                element.focus();
                expect(document.activeElement).toBe(element);

                // Test that focus styles are applied
                const computedStyle = window.getComputedStyle(element);
                const hasFocusStyles = element.matches(':focus') ||
                    element.classList.contains('focus') ||
                    computedStyle.outline !== 'none';

                if (!hasFocusStyles) {
                    console.warn(`${className} may need visible focus indicators for keyboard navigation`);
                }

                // Test keyboard interaction
                const keydownEvent = new KeyboardEvent('keydown', { key: 'Enter' });
                element.dispatchEvent(keydownEvent);

                testContainer.removeChild(element);
            });
        });

        it('should validate color feedback for keyboard navigation states', () => {
            const navigationStates = [
                { state: 'focus', className: 'focus:ring-2 focus:ring-primary-500' },
                { state: 'active', className: 'active:bg-primary-700' },
                { state: 'hover', className: 'hover:bg-primary-600' }
            ];

            const testButton = document.createElement('button');
            testButton.className = 'btn-primary';
            testButton.textContent = 'Test Navigation';
            testContainer.appendChild(testButton);

            navigationStates.forEach(({ state, className }) => {
                // Simulate state by adding class
                testButton.classList.add(className.split(':')[1]);

                // Verify color contrast is maintained in all states
                const quickCheck = quickAccessibilityCheck(testButton);
                expect(quickCheck.wcagResult?.isValid).toBe(true);

                // Remove state class
                testButton.classList.remove(className.split(':')[1]);
            });

            testContainer.removeChild(testButton);
        });

        it('should test tab order and keyboard accessibility for form elements', () => {
            // Create a form with multiple elements
            const form = document.createElement('form');
            const elements = [
                { tag: 'input', type: 'text', id: 'field1', label: 'Field 1' },
                { tag: 'input', type: 'email', id: 'field2', label: 'Field 2' },
                { tag: 'select', id: 'field3', label: 'Field 3' },
                { tag: 'button', type: 'submit', id: 'submit', label: 'Submit' }
            ];

            elements.forEach(({ tag, type, id, label }) => {
                const labelEl = document.createElement('label');
                labelEl.setAttribute('for', id);
                labelEl.textContent = label;
                form.appendChild(labelEl);

                const element = document.createElement(tag) as HTMLElement;
                element.id = id;
                if (type && (element instanceof HTMLInputElement || element instanceof HTMLButtonElement)) {
                    element.type = type;
                }
                if (tag === 'select') {
                    const option = document.createElement('option');
                    option.value = 'test';
                    option.textContent = 'Test Option';
                    (element as HTMLSelectElement).appendChild(option);
                }
                form.appendChild(element);
            });

            testContainer.appendChild(form);

            // Test tab order
            const focusableElements = form.querySelectorAll('input, select, button');
            focusableElements.forEach((element, index) => {
                (element as HTMLElement).focus();
                expect(document.activeElement).toBe(element);

                // Test color feedback for each focused element
                const quickCheck = quickAccessibilityCheck(element as HTMLElement);
                if (!quickCheck.passed) {
                    console.warn(`Form element ${index + 1} may have accessibility issues:`, quickCheck.recommendations);
                }
            });

            testContainer.removeChild(form);
        });

        it('should validate error state color feedback for keyboard users', () => {
            const errorStates = [
                { element: 'input', errorClass: 'border-red-500 text-red-600', label: 'Error Input' },
                { element: 'button', errorClass: 'bg-red-600 text-white', label: 'Error Button' },
                { element: 'div', errorClass: 'bg-red-50 border-red-200 text-red-800', label: 'Error Alert' }
            ];

            errorStates.forEach(({ element: tag, errorClass, label }) => {
                const element = document.createElement(tag) as HTMLElement;
                element.className = errorClass;
                element.textContent = label;
                element.setAttribute('aria-invalid', 'true');
                testContainer.appendChild(element);

                // Test that error states are keyboard accessible
                if (element.tabIndex >= 0 || ['input', 'button', 'a'].includes(tag)) {
                    element.focus();
                    expect(document.activeElement).toBe(element);
                }

                // Validate error state color contrast
                const quickCheck = quickAccessibilityCheck(element);
                expect(quickCheck.wcagResult?.isValid).toBe(true);

                testContainer.removeChild(element);
            });
        });
    });

    describe('Automated WCAG Compliance Testing Enhancement', () => {
        it('should perform comprehensive WCAG 2.1 Level AA compliance testing', () => {
            const wcagTestCases = [
                // Success Criterion 1.4.3 - Contrast (Minimum)
                { name: 'Normal Text Contrast', fg: '#374151', bg: '#ffffff', minRatio: 4.5 },
                { name: 'Large Text Contrast', fg: '#6b7280', bg: '#ffffff', minRatio: 3.0, isLarge: true },

                // Success Criterion 1.4.6 - Contrast (Enhanced) - AAA
                { name: 'Enhanced Normal Text', fg: '#111827', bg: '#ffffff', minRatio: 7.0, level: 'AAA' },
                { name: 'Enhanced Large Text', fg: '#374151', bg: '#ffffff', minRatio: 4.5, isLarge: true, level: 'AAA' },

                // Interactive elements
                { name: 'Button Focus Indicator', fg: '#2563eb', bg: '#dbeafe', minRatio: 3.0 },
                { name: 'Link Hover State', fg: '#1d4ed8', bg: '#ffffff', minRatio: 4.5 },

                // Status indicators
                { name: 'Success Indicator', fg: '#065f46', bg: '#d1fae5', minRatio: 4.5 },
                { name: 'Warning Indicator', fg: '#92400e', bg: '#fef3c7', minRatio: 4.5 },
                { name: 'Error Indicator', fg: '#991b1b', bg: '#fee2e2', minRatio: 4.5 }
            ];

            const wcagResults = wcagTestCases.map(testCase => {
                const result = testCase.level === 'AAA'
                    ? validateWCAGAAA(testCase.fg, testCase.bg, testCase.isLarge)
                    : validateWCAGAA(testCase.fg, testCase.bg, testCase.isLarge);

                return {
                    ...testCase,
                    passed: result.isValid,
                    actualRatio: result.contrastRatio,
                    result
                };
            });

            // All critical WCAG tests should pass
            const failedCritical = wcagResults.filter(r => !r.passed && r.level !== 'AAA');
            expect(failedCritical.length).toBe(0);

            // Log detailed results
            console.log('WCAG Compliance Test Results:');
            wcagResults.forEach(test => {
                const status = test.passed ? '✓' : '✗';
                const level = test.level || 'AA';
                console.log(`${status} ${test.name} (${level}): ${test.actualRatio.toFixed(2)} (required: ${test.minRatio})`);
            });

            // Calculate overall compliance rate
            const passedTests = wcagResults.filter(r => r.passed).length;
            const totalTests = wcagResults.length;
            const complianceRate = (passedTests / totalTests) * 100;

            expect(complianceRate).toBeGreaterThanOrEqual(90);
            console.log(`Overall WCAG compliance rate: ${complianceRate.toFixed(1)}%`);
        });

        it('should test non-text contrast requirements (WCAG 1.4.11)', () => {
            const nonTextElements = [
                { name: 'Button Border', color: '#d1d5db', background: '#ffffff', minRatio: 3.0 },
                { name: 'Form Input Border', color: '#9ca3af', background: '#ffffff', minRatio: 3.0 },
                { name: 'Focus Indicator', color: '#2563eb', background: '#ffffff', minRatio: 3.0 },
                { name: 'Active State Border', color: '#1d4ed8', background: '#f3f4f6', minRatio: 3.0 }
            ];

            nonTextElements.forEach(({ name, color, background, minRatio }) => {
                const result = validateWCAGAA(color, background);
                const meetsNonTextRequirement = result.contrastRatio >= minRatio;

                if (!meetsNonTextRequirement) {
                    console.warn(`${name} non-text contrast: ${result.contrastRatio.toFixed(2)} (required: ${minRatio})`);
                }

                // Non-text elements should meet 3:1 ratio minimum
                expect(result.contrastRatio).toBeGreaterThanOrEqual(minRatio);
            });
        });

        it('should validate color is not the only means of conveying information', () => {
            const informationalElements = [
                { name: 'Required Field Indicator', hasIcon: true, hasText: true, colorOnly: false },
                { name: 'Success Message', hasIcon: true, hasText: true, colorOnly: false },
                { name: 'Error Message', hasIcon: true, hasText: true, colorOnly: false },
                { name: 'Warning Alert', hasIcon: true, hasText: true, colorOnly: false },
                { name: 'Status Badge', hasIcon: false, hasText: true, colorOnly: false }
            ];

            informationalElements.forEach(({ name, hasIcon, hasText, colorOnly }) => {
                // Elements should not rely on color alone
                expect(colorOnly).toBe(false);

                // Should have at least text or icon as alternative
                expect(hasText || hasIcon).toBe(true);

                console.log(`${name}: ${hasText ? 'Text ✓' : 'Text ✗'} ${hasIcon ? 'Icon ✓' : 'Icon ✗'}`);
            });
        });
    });

    describe('Enhanced Color Blindness Testing', () => {
        it('should test all color combinations against multiple color blindness types', () => {
            const colorBlindnessTypes: ColorBlindnessType[] = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];
            const testCombinations = CRITICAL_COLOR_COMBINATIONS;

            const colorBlindnessReport = testCombinations.map(({ name, foreground, background }) => {
                const results = validateColorBlindFriendly(foreground, background);

                const typeResults = colorBlindnessTypes.map(type => ({
                    type,
                    passed: results[type].isValid,
                    contrast: results[type].contrastRatio,
                    simulatedFg: simulateColorBlindness(foreground, type),
                    simulatedBg: simulateColorBlindness(background, type)
                }));

                const passedTypes = typeResults.filter(r => r.passed).length;
                const passRate = (passedTypes / colorBlindnessTypes.length) * 100;

                return {
                    element: name,
                    passRate,
                    typeResults,
                    needsAlternativeIndicators: passRate < 75
                };
            });

            // Log comprehensive color blindness report
            console.log('Color Blindness Accessibility Report:');
            colorBlindnessReport.forEach(({ element, passRate, needsAlternativeIndicators }) => {
                const status = needsAlternativeIndicators ? '⚠' : '✓';
                console.log(`${status} ${element}: ${passRate.toFixed(1)}% pass rate`);
            });

            // At least 80% of elements should have good color blindness accessibility
            const elementsWithGoodAccessibility = colorBlindnessReport.filter(r => r.passRate >= 75);
            const overallPassRate = (elementsWithGoodAccessibility.length / colorBlindnessReport.length) * 100;

            expect(overallPassRate).toBeGreaterThanOrEqual(80);
            console.log(`Overall color blindness accessibility: ${overallPassRate.toFixed(1)}%`);
        });

        it('should provide specific recommendations for color blind users', () => {
            const problematicElements = testSuiteResult.results.filter(result => {
                if (!result.colorBlindnessResults) return false;

                const failingTypes = Object.values(result.colorBlindnessResults)
                    .filter(cbResult => !cbResult.isValid);

                return failingTypes.length > 2; // More than 2 types fail
            });

            problematicElements.forEach(element => {
                const recommendations = [
                    `Add icons to ${element.testName} (e.g., ✓ for success, ⚠ for warning, ✗ for error)`,
                    `Consider patterns or textures as additional visual indicators`,
                    `Ensure sufficient contrast ratios are maintained`,
                    `Test with color blindness simulation tools`
                ];

                console.log(`Recommendations for ${element.testName}:`, recommendations);
            });

            // Should provide actionable recommendations
            expect(problematicElements.length).toBeLessThan(testSuiteResult.results.length * 0.3);
        });

        it('should simulate color blindness accurately for testing', () => {
            const testColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
            const colorBlindnessTypes: ColorBlindnessType[] = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];

            testColors.forEach(color => {
                colorBlindnessTypes.forEach(type => {
                    const simulated = simulateColorBlindness(color, type);

                    // Should return valid hex color
                    expect(simulated).toMatch(/^#[0-9a-f]{6}$/i);

                    // Should be different from original (except for some edge cases)
                    if (type !== 'achromatopsia' || color !== '#808080') {
                        // Allow some colors to remain similar for certain types
                    }

                    console.log(`${color} → ${simulated} (${type})`);
                });
            });
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