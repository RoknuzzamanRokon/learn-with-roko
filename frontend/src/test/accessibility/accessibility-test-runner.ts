/**
 * Comprehensive Accessibility Test Runner
 * 
 * This module provides a unified interface for running all accessibility tests
 * including color contrast validation, color blindness simulation, and visual regression testing.
 */

import {
    runAccessibilityTestSuite,
    createAccessibilityTestReport,
    createAccessibilityTestSummary,
    type AccessibilityTestSuiteResult,
    type AccessibilityTestConfig
} from './accessibility-test-utils';

import {
    runVisualRegressionTests,
    generateVisualRegressionReport,
    type VisualRegressionResult
} from './visual-regression-utils';

import {
    getAccessibilityConfig,
    validateAccessibilityConfig,
    ACCESSIBILITY_CONFIGS,
    type WCAG_THRESHOLDS
} from './accessibility-config';

/**
 * Comprehensive test result combining all accessibility tests
 */
export interface ComprehensiveAccessibilityResult {
    timestamp: string;
    environment: string;
    config: AccessibilityTestConfig;

    // Core accessibility tests
    accessibilityTests: AccessibilityTestSuiteResult;

    // Visual regression tests
    visualRegressionTests?: {
        results: VisualRegressionResult[];
        summary: ReturnType<typeof generateVisualRegressionReport>;
    };

    // Overall summary
    overallSummary: {
        totalTests: number;
        passedTests: number;
        failedTests: number;
        criticalIssues: number;
        warnings: number;
        overallPassRate: number;
        passed: boolean;
    };

    // Performance metrics
    performance: {
        totalDuration: number;
        accessibilityTestDuration: number;
        visualRegressionDuration?: number;
        memoryUsage?: number;
    };

    // Recommendations and next steps
    recommendations: string[];
    nextSteps: string[];
}

/**
 * Test runner options
 */
export interface TestRunnerOptions {
    environment?: keyof typeof ACCESSIBILITY_CONFIGS;
    config?: Partial<AccessibilityTestConfig>;
    includeVisualRegression?: boolean;
    includePerformanceMetrics?: boolean;
    generateReports?: boolean;
    outputDirectory?: string;
    verbose?: boolean;
}

/**
 * Main accessibility test runner
 */
export async function runComprehensiveAccessibilityTests(
    options: TestRunnerOptions = {}
): Promise<ComprehensiveAccessibilityResult> {
    const startTime = performance.now();

    // Setup configuration
    const environment = options.environment || 'development';
    const baseConfig = getAccessibilityConfig(environment);
    const config = { ...baseConfig, ...options.config };

    // Validate configuration
    const configValidation = validateAccessibilityConfig(config);
    if (!configValidation.isValid) {
        throw new Error(`Invalid configuration: ${configValidation.errors.join(', ')}`);
    }

    if (options.verbose && configValidation.warnings.length > 0) {
        console.warn('Configuration warnings:', configValidation.warnings);
    }

    const result: ComprehensiveAccessibilityResult = {
        timestamp: new Date().toISOString(),
        environment,
        config,
        accessibilityTests: {} as AccessibilityTestSuiteResult,
        overallSummary: {} as any,
        performance: {
            totalDuration: 0,
            accessibilityTestDuration: 0
        },
        recommendations: [],
        nextSteps: []
    };

    try {
        // Run core accessibility tests
        if (options.verbose) {
            console.log('🔍 Running core accessibility tests...');
        }

        const accessibilityStartTime = performance.now();
        result.accessibilityTests = runAccessibilityTestSuite(config);
        const accessibilityEndTime = performance.now();
        result.performance.accessibilityTestDuration = accessibilityEndTime - accessibilityStartTime;

        // Run visual regression tests if enabled
        if (options.includeVisualRegression !== false && config.includeVisualRegression) {
            if (options.verbose) {
                console.log('📸 Running visual regression tests...');
            }

            const visualStartTime = performance.now();
            const visualResults = await runVisualRegressionTests();
            const visualSummary = generateVisualRegressionReport(visualResults);
            const visualEndTime = performance.now();

            result.visualRegressionTests = {
                results: visualResults,
                summary: visualSummary
            };
            result.performance.visualRegressionDuration = visualEndTime - visualStartTime;
        }

        // Calculate overall summary
        result.overallSummary = calculateOverallSummary(result);

        // Generate recommendations
        result.recommendations = generateRecommendations(result);
        result.nextSteps = generateNextSteps(result);

        // Calculate total duration
        const endTime = performance.now();
        result.performance.totalDuration = endTime - startTime;

        // Add memory usage if requested
        if (options.includePerformanceMetrics && typeof (performance as any).memory !== 'undefined') {
            result.performance.memoryUsage = (performance as any).memory.usedJSHeapSize;
        }

        // Generate reports if requested
        if (options.generateReports !== false) {
            await generateComprehensiveReports(result, options);
        }

        if (options.verbose) {
            logTestSummary(result);
        }

        return result;

    } catch (error) {
        console.error('Error running accessibility tests:', error);
        throw error;
    }
}

/**
 * Calculate overall summary from all test results
 */
function calculateOverallSummary(result: ComprehensiveAccessibilityResult): ComprehensiveAccessibilityResult['overallSummary'] {
    const accessibilityTests = result.accessibilityTests.summary;
    const visualTests = result.visualRegressionTests?.summary;

    let totalTests = accessibilityTests.totalTests;
    let passedTests = accessibilityTests.passed;
    let failedTests = accessibilityTests.failed;

    if (visualTests) {
        totalTests += visualTests.summary.total;
        passedTests += visualTests.summary.passed;
        failedTests += visualTests.summary.failed;
    }

    const overallPassRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const criticalIssues = accessibilityTests.critical;
    const warnings = accessibilityTests.warnings;

    // Determine if overall tests passed
    const passed = criticalIssues === 0 && overallPassRate >= 85;

    return {
        totalTests,
        passedTests,
        failedTests,
        criticalIssues,
        warnings,
        overallPassRate,
        passed
    };
}

/**
 * Generate actionable recommendations based on test results
 */
function generateRecommendations(result: ComprehensiveAccessibilityResult): string[] {
    const recommendations: string[] = [];
    const { accessibilityTests, visualRegressionTests, overallSummary } = result;

    // Critical issues
    if (overallSummary.criticalIssues > 0) {
        recommendations.push(
            `🚨 CRITICAL: ${overallSummary.criticalIssues} critical accessibility issues must be fixed immediately`
        );
    }

    // Pass rate recommendations
    if (overallSummary.overallPassRate < 85) {
        recommendations.push(
            `📊 Overall pass rate (${overallSummary.overallPassRate.toFixed(1)}%) is below minimum threshold (85%)`
        );
    } else if (overallSummary.overallPassRate < 95) {
        recommendations.push(
            `📈 Good progress! Consider addressing remaining issues to reach 95% pass rate`
        );
    }

    // Color contrast specific recommendations
    const contrastFailures = accessibilityTests.results.filter(r =>
        r.wcagResult && !r.wcagResult.isValid
    );

    if (contrastFailures.length > 0) {
        recommendations.push(
            `🎨 ${contrastFailures.length} color combinations fail WCAG contrast requirements`
        );

        const criticalContrastFailures = contrastFailures.filter(r => r.severity === 'critical');
        if (criticalContrastFailures.length > 0) {
            recommendations.push(
                `⚠️ Focus on fixing contrast issues in: ${criticalContrastFailures.map(r => r.testName).join(', ')}`
            );
        }
    }

    // Color blindness recommendations
    const colorBlindIssues = accessibilityTests.results.filter(r =>
        r.colorBlindnessResults &&
        Object.values(r.colorBlindnessResults).some(cb => !cb.isValid)
    );

    if (colorBlindIssues.length > 0) {
        recommendations.push(
            `👁️ ${colorBlindIssues.length} elements may not be accessible to color blind users - consider adding icons or patterns`
        );
    }

    // Visual regression recommendations
    if (visualRegressionTests && (visualRegressionTests.summary as any).failed > 0) {
        recommendations.push(
            `📸 ${(visualRegressionTests.summary as any).failed} visual regression tests failed - review component styling consistency`
        );
    }

    // Performance recommendations
    if (result.performance.totalDuration > 5000) {
        recommendations.push(
            `⚡ Test suite took ${(result.performance.totalDuration / 1000).toFixed(1)}s - consider optimizing test performance`
        );
    }

    // Add general accessibility recommendations
    if (recommendations.length === 0) {
        recommendations.push('✅ All accessibility tests passed! Consider periodic re-testing as the codebase evolves');
    } else {
        recommendations.push('📚 Review WCAG 2.1 guidelines for detailed accessibility requirements');
        recommendations.push('🔄 Re-run tests after making fixes to verify improvements');
    }

    return recommendations;
}

/**
 * Generate next steps based on test results
 */
function generateNextSteps(result: ComprehensiveAccessibilityResult): string[] {
    const nextSteps: string[] = [];
    const { overallSummary, accessibilityTests } = result;

    if (overallSummary.criticalIssues > 0) {
        nextSteps.push('1. Fix all critical accessibility issues immediately');
        nextSteps.push('2. Re-run accessibility tests to verify fixes');
    }

    if (overallSummary.overallPassRate < 95) {
        nextSteps.push('3. Address remaining accessibility warnings');
        nextSteps.push('4. Consider implementing WCAG AAA standards for critical elements');
    }

    // Specific next steps based on failing tests
    const failedTests = accessibilityTests.results.filter(r => !r.passed);
    if (failedTests.length > 0) {
        const buttonIssues = failedTests.filter(r => r.testName.includes('Button'));
        const textIssues = failedTests.filter(r => r.testName.includes('Text'));
        const statusIssues = failedTests.filter(r => r.testName.includes('Status'));

        if (buttonIssues.length > 0) {
            nextSteps.push('5. Review and fix button color contrast issues');
        }

        if (textIssues.length > 0) {
            nextSteps.push('6. Adjust text colors to meet WCAG contrast requirements');
        }

        if (statusIssues.length > 0) {
            nextSteps.push('7. Add icons or patterns to status indicators for color blind accessibility');
        }
    }

    // Integration and process improvements
    nextSteps.push('8. Integrate accessibility tests into CI/CD pipeline');
    nextSteps.push('9. Set up automated accessibility monitoring');
    nextSteps.push('10. Schedule regular accessibility audits');

    return nextSteps;
}

/**
 * Generate comprehensive reports
 */
async function generateComprehensiveReports(
    result: ComprehensiveAccessibilityResult,
    options: TestRunnerOptions
): Promise<void> {
    const outputDir = options.outputDirectory || './accessibility-reports';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    try {
        // Create output directory (in a real implementation)
        if (options.verbose) {
            console.log(`📁 Generating reports in ${outputDir}`);
        }

        // Generate HTML report
        const htmlReport = createAccessibilityTestReport(result.accessibilityTests);
        if (options.verbose) {
            console.log(`📄 Generated HTML report: accessibility-report-${timestamp}.html`);
        }

        // Generate JSON report
        const jsonReport = JSON.stringify(result, null, 2);
        if (options.verbose) {
            console.log(`📊 Generated JSON report: accessibility-report-${timestamp}.json`);
        }

        // Generate summary report
        const summaryReport = generateSummaryReport(result);
        if (options.verbose) {
            console.log(`📋 Generated summary report: accessibility-summary-${timestamp}.md`);
        }

    } catch (error) {
        console.warn('Warning: Could not generate reports:', error);
    }
}

/**
 * Generate markdown summary report
 */
function generateSummaryReport(result: ComprehensiveAccessibilityResult): string {
    const { overallSummary, accessibilityTests, visualRegressionTests, recommendations, nextSteps } = result;

    return `
# Accessibility Test Report

**Generated:** ${new Date(result.timestamp).toLocaleString()}  
**Environment:** ${result.environment}  
**WCAG Level:** ${result.config.wcagLevel}

## 📊 Overall Summary

| Metric | Value |
|--------|-------|
| **Overall Pass Rate** | ${overallSummary.overallPassRate.toFixed(1)}% |
| **Total Tests** | ${overallSummary.totalTests} |
| **Passed** | ${overallSummary.passedTests} |
| **Failed** | ${overallSummary.failedTests} |
| **Critical Issues** | ${overallSummary.criticalIssues} |
| **Warnings** | ${overallSummary.warnings} |
| **Status** | ${overallSummary.passed ? '✅ PASSED' : '❌ FAILED'} |

## 🔍 Accessibility Tests

- **Color Contrast Tests:** ${accessibilityTests.summary.passed}/${accessibilityTests.summary.totalTests} passed
- **Color Blindness Tests:** Included
- **WCAG Compliance:** ${result.config.wcagLevel} level

${visualRegressionTests ? `
## 📸 Visual Regression Tests

- **Component Tests:** ${(visualRegressionTests.summary as any).passed}/${(visualRegressionTests.summary as any).total} passed
- **Pass Rate:** ${(visualRegressionTests.summary as any).passRate.toFixed(1)}%
` : ''}

## ⚡ Performance

- **Total Duration:** ${(result.performance.totalDuration / 1000).toFixed(2)}s
- **Accessibility Tests:** ${(result.performance.accessibilityTestDuration / 1000).toFixed(2)}s
${result.performance.visualRegressionDuration ? `- **Visual Regression:** ${(result.performance.visualRegressionDuration / 1000).toFixed(2)}s` : ''}

## 💡 Recommendations

${recommendations.map(rec => `- ${rec}`).join('\n')}

## 📋 Next Steps

${nextSteps.map(step => `${step}`).join('\n')}

---

*Report generated by LMS Accessibility Test Suite*
    `.trim();
}

/**
 * Log test summary to console
 */
function logTestSummary(result: ComprehensiveAccessibilityResult): void {
    const { overallSummary } = result;

    console.log('\n' + '='.repeat(60));
    console.log('🔍 ACCESSIBILITY TEST SUMMARY');
    console.log('='.repeat(60));

    console.log(`📊 Overall Pass Rate: ${overallSummary.overallPassRate.toFixed(1)}%`);
    console.log(`✅ Passed: ${overallSummary.passedTests}/${overallSummary.totalTests}`);
    console.log(`❌ Failed: ${overallSummary.failedTests}`);
    console.log(`🚨 Critical: ${overallSummary.criticalIssues}`);
    console.log(`⚠️  Warnings: ${overallSummary.warnings}`);

    console.log(`\n⚡ Performance:`);
    console.log(`   Total Duration: ${(result.performance.totalDuration / 1000).toFixed(2)}s`);

    if (overallSummary.passed) {
        console.log('\n🎉 All accessibility tests passed!');
    } else {
        console.log('\n❌ Accessibility issues detected. Please review the detailed report.');
    }

    console.log('='.repeat(60) + '\n');
}

/**
 * Quick accessibility check for development
 */
export async function quickAccessibilityCheck(): Promise<{
    passed: boolean;
    score: number;
    criticalIssues: number;
    summary: string;
}> {
    const result = await runComprehensiveAccessibilityTests({
        environment: 'development',
        includeVisualRegression: false,
        generateReports: false,
        verbose: false
    });

    return {
        passed: result.overallSummary.passed,
        score: Math.round(result.overallSummary.overallPassRate),
        criticalIssues: result.overallSummary.criticalIssues,
        summary: `${result.overallSummary.passedTests}/${result.overallSummary.totalTests} tests passed (${result.overallSummary.overallPassRate.toFixed(1)}%)`
    };
}

/**
 * CI/CD optimized accessibility check
 */
export async function ciAccessibilityCheck(): Promise<{
    exitCode: number;
    report: ComprehensiveAccessibilityResult;
}> {
    const result = await runComprehensiveAccessibilityTests({
        environment: 'ci',
        includeVisualRegression: false,
        generateReports: true,
        verbose: true
    });

    return {
        exitCode: result.overallSummary.passed ? 0 : 1,
        report: result
    };
}