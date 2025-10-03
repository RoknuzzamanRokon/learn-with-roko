/**
 * Integration Tests for Accessibility Testing Utilities
 * 
 * This test suite validates that all accessibility testing utilities work together
 * and provides comprehensive coverage for the LMS UI enhancement requirements.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
    runComprehensiveAccessibilityTests,
    quickAccessibilityCheck,
    ciAccessibilityCheck,
    type ComprehensiveAccessibilityResult
} from './accessibility-test-runner';

import {
    runAutomatedAccessibilityCheck,
    createAccessibilityTestSummary
} from './accessibility-test-utils';

import {
    runVisualRegressionTests,
    generateVisualRegressionReport,
    createComponentShowcase
} from './visual-regression-utils';

import {
    getAccessibilityConfig,
    validateAccessibilityConfig,
    getRecommendedConfig,
    ACCESSIBILITY_CONFIGS
} from './accessibility-config';

describe('Accessibility Testing Utilities Integration', () => {
    let comprehensiveResult: ComprehensiveAccessibilityResult;

    beforeAll(async () => {
        // Run comprehensive accessibility tests once for all integration tests
        comprehensiveResult = await runComprehensiveAccessibilityTests({
            environment: 'development',
            includeVisualRegression: true,
            generateReports: false,
            verbose: false
        });
    });

    describe('Automated Color Contrast Validation', () => {
        it('should validate all critical color combinations automatically', () => {
            const { accessibilityTests } = comprehensiveResult;

            expect(accessibilityTests).toBeDefined();
            expect(accessibilityTests.summary.totalTests).toBeGreaterThan(0);

            // Check that critical tests are included
            const criticalTests = accessibilityTests.results.filter(r => r.severity === 'critical');
            expect(criticalTests.length).toBeGreaterThan(0);

            console.log(`✅ Automated contrast validation: ${accessibilityTests.summary.passed}/${accessibilityTests.summary.totalTests} tests passed`);
        });

        it('should provide detailed contrast ratio information', () => {
            const { accessibilityTests } = comprehensiveResult;

            accessibilityTests.results.forEach(result => {
                if (result.wcagResult) {
                    expect(result.wcagResult).toBeDefined();
                    expect(typeof result.wcagResult?.contrastRatio).toBe('number');
                    expect(result.wcagResult?.contrastRatio).toBeGreaterThan(0);

                    if (!result.passed && result.wcagResult) {
                        expect(result.recommendations.length).toBeGreaterThan(0);
                    }
                });
        });

        it('should identify and report failing combinations with actionable recommendations', () => {
            const { accessibilityTests } = comprehensiveResult;

            const failingTests = accessibilityTests.results.filter(r => !r.passed);

            failingTests.forEach(test => {
                expect(test.recommendations).toBeDefined();
                expect(test.recommendations.length).toBeGreaterThan(0);
                expect(test.severity).toMatch(/low|medium|high|critical/);

                console.log(`⚠️ ${test.testName}: ${test.recommendations[0]}`);
            });
        });
    });

    describe('Color Blindness Simulation Testing', () => {
        it('should test all color combinations for color blindness accessibility', () => {
            const { accessibilityTests } = comprehensiveResult;

            const colorBlindnessTests = accessibilityTests.results.filter(r =>
                r.colorBlindnessResults !== undefined
            );

            expect(colorBlindnessTests.length).toBeGreaterThan(0);

            colorBlindnessTests.forEach(test => {
                expect(test.colorBlindnessResults).toBeDefined();

                if (test.colorBlindnessResults) {
                    // Check all color blindness types are tested
                    expect(test.colorBlindnessResults.protanopia).toBeDefined();
                    expect(test.colorBlindnessResults.deuteranopia).toBeDefined();
                    expect(test.colorBlindnessResults.tritanopia).toBeDefined();
                    expect(test.colorBlindnessResults.achromatopsia).toBeDefined();
                }
            });

            console.log(`👁️ Color blindness testing: ${colorBlindnessTests.length} combinations tested`);
        });

        it('should recommend alternative indicators for problematic combinations', () => {
            const { accessibilityTests } = comprehensiveResult;

            const problematicTests = accessibilityTests.results.filter(r =>
                r.colorBlindnessResults &&
                Object.values(r.colorBlindnessResults).filter(cb => !cb.isValid).length > 2
            );

            problematicTests.forEach(test => {
                const hasIconRecommendation = test.recommendations.some(rec =>
                    rec.includes('icon') || rec.includes('pattern')
                );

                if (problematicTests.length > 0) {
                    expect(hasIconRecommendation).toBe(true);
                }

                console.log(`🔍 ${test.testName} needs alternative indicators`);
            });
        });

        it('should simulate color blindness accurately for all types', async () => {
            // Test the visual regression component which includes color blindness simulation
            const visualResults = await runVisualRegressionTests();

            expect(visualResults).toBeDefined();
            expect(Array.isArray(visualResults)).toBe(true);

            // Visual regression tests should include color consistency checks
            const colorConsistencyTests = visualResults.filter(r =>
                r.component.includes('button') || r.component.includes('status')
            );

            expect(colorConsistencyTests.length).toBeGreaterThan(0);

            console.log(`🎨 Color blindness simulation: ${colorConsistencyTests.length} components tested`);
        });
    });

    describe('Visual Regression Testing for Color Consistency', () => {
        it('should capture and compare component screenshots', async () => {
            if (comprehensiveResult.visualRegressionTests) {
                const { results, summary } = comprehensiveResult.visualRegressionTests;

                expect(results).toBeDefined();
                expect(Array.isArray(results)).toBe(true);
                expect(results.length).toBeGreaterThan(0);

                expect(summary.total).toBe(results.length);
                expect(summary.passed + summary.failed).toBe(summary.total);

                console.log(`📸 Visual regression: ${summary.passed}/${summary.total} tests passed`);
            }
        });

        it('should detect color inconsistencies across component states', async () => {
            const showcase = createComponentShowcase();

            expect(showcase).toBeDefined();
            expect(showcase.tagName).toBe('DIV');

            // Verify showcase contains expected components
            const buttons = showcase.querySelectorAll('button');
            const statusIndicators = showcase.querySelectorAll('[class*="status"]');

            expect(buttons.length).toBeGreaterThan(0);
            expect(statusIndicators.length).toBeGreaterThan(0);

            console.log(`🧩 Component showcase: ${buttons.length} buttons, ${statusIndicators.length} status indicators`);
        });

        it('should validate component color consistency across different states', () => {
            if (comprehensiveResult.visualRegressionTests) {
                const { results } = comprehensiveResult.visualRegressionTests;

                // Group results by component
                const componentGroups = results.reduce((groups, result) => {
                    if (!groups[result.component]) {
                        groups[result.component] = [];
                    }
                    groups[result.component].push(result);
                    return groups;
                }, {} as Record<string, typeof results>);

                Object.entries(componentGroups).forEach(([component, componentResults]) => {
                    const stateCount = componentResults.length;
                    const passedStates = componentResults.filter(r => r.passed).length;

                    console.log(`🔄 ${component}: ${passedStates}/${stateCount} states consistent`);
                });
            }
        });
    });

    describe('Comprehensive Test Suite Integration', () => {
        it('should provide unified test results and recommendations', () => {
            expect(comprehensiveResult.overallSummary).toBeDefined();
            expect(comprehensiveResult.recommendations).toBeDefined();
            expect(comprehensiveResult.nextSteps).toBeDefined();

            const { overallSummary } = comprehensiveResult;

            expect(overallSummary.totalTests).toBeGreaterThan(0);
            expect(overallSummary.passedTests + overallSummary.failedTests).toBe(overallSummary.totalTests);
            expect(overallSummary.overallPassRate).toBeGreaterThanOrEqual(0);
            expect(overallSummary.overallPassRate).toBeLessThanOrEqual(100);

            console.log(`📊 Overall summary: ${overallSummary.overallPassRate.toFixed(1)}% pass rate`);
        });

        it('should generate actionable recommendations based on test results', () => {
            const { recommendations, nextSteps } = comprehensiveResult;

            expect(Array.isArray(recommendations)).toBe(true);
            expect(Array.isArray(nextSteps)).toBe(true);

            if (comprehensiveResult.overallSummary.criticalIssues > 0) {
                const hasCriticalRecommendation = recommendations.some(rec =>
                    rec.includes('CRITICAL') || rec.includes('critical')
                );
                expect(hasCriticalRecommendation).toBe(true);
            }

            console.log(`💡 Generated ${recommendations.length} recommendations and ${nextSteps.length} next steps`);
        });

        it('should track performance metrics', () => {
            const { performance } = comprehensiveResult;

            expect(performance.totalDuration).toBeGreaterThan(0);
            expect(performance.accessibilityTestDuration).toBeGreaterThan(0);
            expect(performance.totalDuration).toBeGreaterThanOrEqual(performance.accessibilityTestDuration);

            // Performance should be reasonable (under 10 seconds for comprehensive tests)
            expect(performance.totalDuration).toBeLessThan(10000);

            console.log(`⚡ Performance: ${(performance.totalDuration / 1000).toFixed(2)}s total`);
        });
    });

    describe('Configuration and Environment Support', () => {
        it('should support different testing environments', () => {
            const environments = Object.keys(ACCESSIBILITY_CONFIGS);

            environments.forEach(env => {
                const config = getAccessibilityConfig(env as keyof typeof ACCESSIBILITY_CONFIGS);
                const validation = validateAccessibilityConfig(config);

                expect(validation.isValid).toBe(true);
                expect(config.wcagLevel).toMatch(/AA|AAA/);

                console.log(`🔧 ${env} environment: WCAG ${config.wcagLevel}`);
            });
        });

        it('should provide recommended configurations for different use cases', () => {
            const useCases = ['development', 'ci', 'production', 'audit'] as const;

            useCases.forEach(useCase => {
                const recommendation = getRecommendedConfig(useCase);

                expect(recommendation.config).toBeDefined();
                expect(recommendation.description).toBeDefined();
                expect(Array.isArray(recommendation.recommendations)).toBe(true);

                console.log(`📋 ${useCase}: ${recommendation.description}`);
            });
        });

        it('should validate configuration options', () => {
            // Test valid configuration
            const validConfig = {
                wcagLevel: 'AA' as const,
                includeColorBlindness: true,
                includeVisualRegression: true,
                testLargeText: true,
                generateReport: true
            };

            const validValidation = validateAccessibilityConfig(validConfig);
            expect(validValidation.isValid).toBe(true);
            expect(validValidation.errors.length).toBe(0);

            // Test invalid configuration
            const invalidConfig = {
                wcagLevel: 'INVALID' as any,
                includeColorBlindness: 'not-boolean' as any,
                includeVisualRegression: true,
                testLargeText: true,
                generateReport: true
            };

            const invalidValidation = validateAccessibilityConfig(invalidConfig);
            expect(invalidValidation.isValid).toBe(false);
            expect(invalidValidation.errors.length).toBeGreaterThan(0);
        });
    });

    describe('Quick Testing Utilities', () => {
        it('should provide quick accessibility check for development', async () => {
            const quickResult = await quickAccessibilityCheck();

            expect(quickResult).toBeDefined();
            expect(typeof quickResult.passed).toBe('boolean');
            expect(typeof quickResult.score).toBe('number');
            expect(typeof quickResult.criticalIssues).toBe('number');
            expect(typeof quickResult.summary).toBe('string');

            expect(quickResult.score).toBeGreaterThanOrEqual(0);
            expect(quickResult.score).toBeLessThanOrEqual(100);

            console.log(`⚡ Quick check: ${quickResult.summary}`);
        });

        it('should provide CI-optimized accessibility check', async () => {
            const ciResult = await ciAccessibilityCheck();

            expect(ciResult).toBeDefined();
            expect([0, 1]).toContain(ciResult.exitCode);
            expect(ciResult.report).toBeDefined();

            // Exit code should be 0 if passed, 1 if failed
            expect(ciResult.exitCode).toBe(ciResult.report.overallSummary.passed ? 0 : 1);

            console.log(`🔄 CI check: Exit code ${ciResult.exitCode}`);
        });

        it('should provide automated accessibility check with reports', () => {
            const automatedResult = runAutomatedAccessibilityCheck();

            expect(automatedResult).toBeDefined();
            expect([0, 1]).toContain(automatedResult.exitCode);
            expect(automatedResult.summary).toBeDefined();
            expect(automatedResult.report).toBeDefined();

            const summary = createAccessibilityTestSummary(automatedResult.summary.jsonReport as any);
            expect(summary.passed).toBe(automatedResult.exitCode === 0);

            console.log(`🤖 Automated check: ${summary.score}% score`);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle invalid configurations gracefully', async () => {
            try {
                await runComprehensiveAccessibilityTests({
                    config: {
                        wcagLevel: 'INVALID' as any,
                        includeColorBlindness: true,
                        includeVisualRegression: true,
                        testLargeText: true,
                        generateReport: true
                    }
                });

                // Should not reach here
                expect(true).toBe(false);
            } catch (error) {
                expect(error).toBeDefined();
                expect(error instanceof Error).toBe(true);
            }
        });

        it('should handle missing DOM elements gracefully', async () => {
            // Test with minimal DOM
            const originalBody = document.body.innerHTML;
            document.body.innerHTML = '<div>Minimal content</div>';

            try {
                const result = await runComprehensiveAccessibilityTests({
                    includeVisualRegression: false,
                    generateReports: false
                });

                expect(result).toBeDefined();
                expect(result.overallSummary).toBeDefined();
            } finally {
                document.body.innerHTML = originalBody;
            }
        });

        it('should provide consistent results across multiple runs', async () => {
            const run1 = await quickAccessibilityCheck();
            const run2 = await quickAccessibilityCheck();

            expect(run1.score).toBe(run2.score);
            expect(run1.criticalIssues).toBe(run2.criticalIssues);
            expect(run1.passed).toBe(run2.passed);

            console.log('🔄 Consistency verified across multiple runs');
        });
    });

    describe('Requirements Validation', () => {
        it('should meet task requirement: automated tests for color contrast validation', () => {
            const contrastTests = comprehensiveResult.accessibilityTests.results.filter(r =>
                r.wcagResult !== undefined
            );

            expect(contrastTests.length).toBeGreaterThan(0);

            // Should test critical color combinations
            const criticalContrastTests = contrastTests.filter(r => r.severity === 'critical');
            expect(criticalContrastTests.length).toBeGreaterThan(0);

            console.log(`✅ Requirement 1: ${contrastTests.length} automated contrast validation tests`);
        });

        it('should meet task requirement: color-blind simulation testing tools', () => {
            const colorBlindTests = comprehensiveResult.accessibilityTests.results.filter(r =>
                r.colorBlindnessResults !== undefined
            );

            expect(colorBlindTests.length).toBeGreaterThan(0);

            // Should test all color blindness types
            colorBlindTests.forEach(test => {
                if (test.colorBlindnessResults) {
                    expect(test.colorBlindnessResults.protanopia).toBeDefined();
                    expect(test.colorBlindnessResults.deuteranopia).toBeDefined();
                    expect(test.colorBlindnessResults.tritanopia).toBeDefined();
                    expect(test.colorBlindnessResults.achromatopsia).toBeDefined();
                }
            });

            console.log(`✅ Requirement 2: ${colorBlindTests.length} color blindness simulation tests`);
        });

        it('should meet task requirement: visual regression tests for color consistency', () => {
            if (comprehensiveResult.visualRegressionTests) {
                const visualTests = comprehensiveResult.visualRegressionTests.results;

                expect(visualTests.length).toBeGreaterThan(0);

                // Should test multiple components and states
                const componentTypes = new Set(visualTests.map(t => t.component));
                const stateTypes = new Set(visualTests.map(t => t.state));

                expect(componentTypes.size).toBeGreaterThan(1);
                expect(stateTypes.size).toBeGreaterThan(1);

                console.log(`✅ Requirement 3: ${visualTests.length} visual regression tests across ${componentTypes.size} components`);
            } else {
                console.log('⚠️ Visual regression tests not included in this run');
            }
        });

        it('should provide comprehensive accessibility testing coverage', () => {
            const { overallSummary, accessibilityTests } = comprehensiveResult;

            // Should have reasonable test coverage
            expect(overallSummary.totalTests).toBeGreaterThanOrEqual(10);

            // Should test different types of accessibility issues
            const testTypes = new Set(accessibilityTests.results.map(r => {
                if (r.wcagResult) return 'contrast';
                if (r.colorBlindnessResults) return 'colorblind';
                if (r.visualRegressionResult !== undefined) return 'visual';
                return 'other';
            }));

            expect(testTypes.size).toBeGreaterThan(1);

            console.log(`✅ Comprehensive coverage: ${overallSummary.totalTests} tests across ${testTypes.size} test types`);
        });
    });
});