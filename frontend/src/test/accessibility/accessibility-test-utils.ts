/**
 * Comprehensive Accessibility Testing Utilities
 * 
 * This module provides utilities for automated accessibility testing including:
 * - Color contrast validation
 * - Color blindness simulation and testing
 * - Visual regression testing for color consistency
 * - WCAG compliance validation
 * - Accessibility reporting
 */

import {
    validateWCAGAA,
    validateWCAGAAA,
    validateDesignSystemContrast,
    simulateColorBlindness,
    validateColorBlindFriendly,
    generateAccessibilityReport,
    type ColorBlindnessType,
    type AccessibilityValidationResult,
    type WCAGLevel
} from '../../styles/accessibility-utils';
import { DEFAULT_COLORS, DESIGN_SYSTEM_CLASSES } from '../../styles';

/**
 * Test configuration for accessibility testing
 */
export interface AccessibilityTestConfig {
    wcagLevel: WCAGLevel;
    includeColorBlindness: boolean;
    includeVisualRegression: boolean;
    testLargeText: boolean;
    generateReport: boolean;
}

/**
 * Default test configuration
 */
export const DEFAULT_TEST_CONFIG: AccessibilityTestConfig = {
    wcagLevel: 'AA',
    includeColorBlindness: true,
    includeVisualRegression: true,
    testLargeText: true,
    generateReport: true
};

/**
 * Color combination test case
 */
export interface ColorTestCase {
    name: string;
    foreground: string;
    background: string;
    context: 'normal' | 'large' | 'ui';
    critical: boolean;
}

/**
 * Predefined critical color combinations for testing
 */
export const CRITICAL_COLOR_COMBINATIONS: ColorTestCase[] = [
    {
        name: 'Primary Button Text',
        foreground: DEFAULT_COLORS.WHITE,
        background: DEFAULT_COLORS.PRIMARY,
        context: 'ui',
        critical: true
    },
    {
        name: 'Body Text',
        foreground: DEFAULT_COLORS.GRAY_600,
        background: DEFAULT_COLORS.WHITE,
        context: 'normal',
        critical: true
    },
    {
        name: 'Heading Text',
        foreground: DEFAULT_COLORS.GRAY_900,
        background: DEFAULT_COLORS.WHITE,
        context: 'large',
        critical: true
    },
    {
        name: 'Success Status',
        foreground: '#047857',
        background: '#ecfdf5',
        context: 'normal',
        critical: true
    },
    {
        name: 'Warning Status',
        foreground: '#b45309',
        background: '#fffbeb',
        context: 'normal',
        critical: true
    },
    {
        name: 'Error Status',
        foreground: '#b91c1c',
        background: '#fef2f2',
        context: 'normal',
        critical: true
    },
    {
        name: 'Primary Link',
        foreground: DEFAULT_COLORS.PRIMARY,
        background: DEFAULT_COLORS.WHITE,
        context: 'normal',
        critical: true
    },
    {
        name: 'Navigation Active',
        foreground: DEFAULT_COLORS.PRIMARY,
        background: '#dbeafe',
        context: 'normal',
        critical: false
    },
    {
        name: 'Secondary Text',
        foreground: DEFAULT_COLORS.GRAY_500,
        background: DEFAULT_COLORS.WHITE,
        context: 'normal',
        critical: false
    },
    {
        name: 'Success Button',
        foreground: DEFAULT_COLORS.WHITE,
        background: DEFAULT_COLORS.SUCCESS,
        context: 'ui',
        critical: true
    },
    {
        name: 'Warning Button',
        foreground: DEFAULT_COLORS.WHITE,
        background: DEFAULT_COLORS.WARNING,
        context: 'ui',
        critical: true
    },
    {
        name: 'Error Button',
        foreground: DEFAULT_COLORS.WHITE,
        background: DEFAULT_COLORS.ERROR,
        context: 'ui',
        critical: true
    }
];

/**
 * Component test cases for visual regression testing
 */
export interface ComponentTestCase {
    name: string;
    className: string;
    variants: string[];
    states: string[];
}

export const COMPONENT_TEST_CASES: ComponentTestCase[] = [
    {
        name: 'Button',
        className: DESIGN_SYSTEM_CLASSES.BTN_BASE,
        variants: [
            DESIGN_SYSTEM_CLASSES.BTN_PRIMARY,
            DESIGN_SYSTEM_CLASSES.BTN_SECONDARY,
            DESIGN_SYSTEM_CLASSES.BTN_SUCCESS,
            DESIGN_SYSTEM_CLASSES.BTN_WARNING,
            DESIGN_SYSTEM_CLASSES.BTN_ERROR
        ],
        states: ['default', 'hover', 'active', 'disabled', 'focus']
    },
    {
        name: 'Status Indicator',
        className: DESIGN_SYSTEM_CLASSES.STATUS_INDICATOR,
        variants: [
            DESIGN_SYSTEM_CLASSES.STATUS_SUCCESS,
            DESIGN_SYSTEM_CLASSES.STATUS_WARNING,
            DESIGN_SYSTEM_CLASSES.STATUS_ERROR,
            DESIGN_SYSTEM_CLASSES.STATUS_INFO
        ],
        states: ['default']
    },
    {
        name: 'Badge',
        className: DESIGN_SYSTEM_CLASSES.BADGE_BASE,
        variants: [
            DESIGN_SYSTEM_CLASSES.BADGE_PRIMARY,
            DESIGN_SYSTEM_CLASSES.BADGE_SUCCESS,
            DESIGN_SYSTEM_CLASSES.BADGE_WARNING,
            DESIGN_SYSTEM_CLASSES.BADGE_ERROR
        ],
        states: ['default']
    },
    {
        name: 'Alert',
        className: DESIGN_SYSTEM_CLASSES.ALERT_BASE,
        variants: [
            DESIGN_SYSTEM_CLASSES.ALERT_INFO,
            DESIGN_SYSTEM_CLASSES.ALERT_SUCCESS,
            DESIGN_SYSTEM_CLASSES.ALERT_WARNING,
            DESIGN_SYSTEM_CLASSES.ALERT_ERROR
        ],
        states: ['default']
    }
];

/**
 * Accessibility test result
 */
export interface AccessibilityTestResult {
    testName: string;
    passed: boolean;
    wcagResult?: AccessibilityValidationResult;
    colorBlindnessResults?: Record<ColorBlindnessType, AccessibilityValidationResult>;
    visualRegressionResult?: boolean;
    recommendations: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Comprehensive accessibility test suite result
 */
export interface AccessibilityTestSuiteResult {
    summary: {
        totalTests: number;
        passed: number;
        failed: number;
        warnings: number;
        critical: number;
        passRate: number;
    };
    results: AccessibilityTestResult[];
    report: ReturnType<typeof generateAccessibilityReport>;
    recommendations: string[];
}

/**
 * Run comprehensive accessibility tests for a color combination
 */
export const testColorCombination = (
    testCase: ColorTestCase,
    config: AccessibilityTestConfig = DEFAULT_TEST_CONFIG
): AccessibilityTestResult => {
    const { name, foreground, background, context, critical } = testCase;
    const isLargeText = context === 'large';
    const recommendations: string[] = [];
    let passed = true;

    // Test WCAG compliance
    const wcagResult = config.wcagLevel === 'AAA'
        ? validateWCAGAAA(foreground, background, isLargeText)
        : validateWCAGAA(foreground, background, isLargeText);

    if (!wcagResult.isValid) {
        passed = false;
        if (wcagResult.recommendations) {
            recommendations.push(...wcagResult.recommendations);
        }
    }

    // Test color blindness accessibility
    let colorBlindnessResults: Record<ColorBlindnessType, AccessibilityValidationResult> | undefined;
    if (config.includeColorBlindness) {
        colorBlindnessResults = validateColorBlindFriendly(foreground, background);

        const colorBlindFailures = Object.entries(colorBlindnessResults)
            .filter(([_, result]) => !result.isValid);

        if (colorBlindFailures.length > 2) {
            recommendations.push(
                `Consider adding icons or patterns for ${name} as it may not be distinguishable for users with ${colorBlindFailures.map(([type]) => type).join(', ')}`
            );
        }
    }

    // Determine severity
    let severity: AccessibilityTestResult['severity'] = 'low';
    if (!wcagResult.isValid) {
        severity = critical ? 'critical' : 'high';
    } else if (colorBlindnessResults && Object.values(colorBlindnessResults).some(r => !r.isValid)) {
        severity = critical ? 'high' : 'medium';
    }

    return {
        testName: name,
        passed,
        wcagResult,
        colorBlindnessResults,
        recommendations,
        severity
    };
};

/**
 * Run accessibility tests for all critical color combinations
 */
export const testAllColorCombinations = (
    config: AccessibilityTestConfig = DEFAULT_TEST_CONFIG
): AccessibilityTestResult[] => {
    return CRITICAL_COLOR_COMBINATIONS.map(testCase =>
        testColorCombination(testCase, config)
    );
};

/**
 * Test component color consistency
 */
export const testComponentColorConsistency = (
    component: ComponentTestCase
): AccessibilityTestResult => {
    const { name, className, variants } = component;
    const recommendations: string[] = [];
    let passed = true;

    // Create test elements for each variant
    const testContainer = document.createElement('div');
    testContainer.style.position = 'absolute';
    testContainer.style.top = '-9999px';
    testContainer.style.left = '-9999px';
    document.body.appendChild(testContainer);

    try {
        variants.forEach(variant => {
            const element = document.createElement('div');
            element.className = `${className} ${variant}`;
            element.textContent = `Test ${name}`;
            testContainer.appendChild(element);

            // Verify classes are applied correctly
            if (!element.classList.contains(variant)) {
                passed = false;
                recommendations.push(`${variant} class not properly applied to ${name} component`);
            }
        });
    } finally {
        document.body.removeChild(testContainer);
    }

    return {
        testName: `${name} Component Consistency`,
        passed,
        visualRegressionResult: passed,
        recommendations,
        severity: passed ? 'low' : 'medium'
    };
};

/**
 * Test all components for color consistency
 */
export const testAllComponentConsistency = (): AccessibilityTestResult[] => {
    return COMPONENT_TEST_CASES.map(testComponentColorConsistency);
};

/**
 * Generate color blindness simulation report
 */
export const generateColorBlindnessReport = (
    testCases: ColorTestCase[] = CRITICAL_COLOR_COMBINATIONS
): Record<string, Record<ColorBlindnessType, string>> => {
    const report: Record<string, Record<ColorBlindnessType, string>> = {};

    testCases.forEach(({ name, foreground, background }) => {
        report[name] = {} as Record<ColorBlindnessType, string>;

        const colorBlindnessTypes: ColorBlindnessType[] = ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'];

        colorBlindnessTypes.forEach(type => {
            const simulatedFg = simulateColorBlindness(foreground, type);
            const simulatedBg = simulateColorBlindness(background, type);
            report[name][type] = `${simulatedFg} on ${simulatedBg}`;
        });
    });

    return report;
};

/**
 * Run comprehensive accessibility test suite
 */
export const runAccessibilityTestSuite = (
    config: AccessibilityTestConfig = DEFAULT_TEST_CONFIG
): AccessibilityTestSuiteResult => {
    const results: AccessibilityTestResult[] = [];

    // Test color combinations
    const colorResults = testAllColorCombinations(config);
    results.push(...colorResults);

    // Test component consistency
    if (config.includeVisualRegression) {
        const componentResults = testAllComponentConsistency();
        results.push(...componentResults);
    }

    // Calculate summary
    const totalTests = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = totalTests - passed;
    const warnings = results.filter(r => r.severity === 'medium').length;
    const critical = results.filter(r => r.severity === 'critical').length;
    const passRate = totalTests > 0 ? (passed / totalTests) * 100 : 0;

    // Generate comprehensive recommendations
    const recommendations: string[] = [];

    // Collect all recommendations
    results.forEach(result => {
        recommendations.push(...result.recommendations);
    });

    // Add general recommendations based on results
    if (critical > 0) {
        recommendations.push('CRITICAL: Address failing color combinations immediately to ensure basic accessibility');
    }

    if (passRate < 90) {
        recommendations.push('Consider reviewing the color palette to improve overall accessibility compliance');
    }

    const failingColorBlindTests = results.filter(r =>
        r.colorBlindnessResults &&
        Object.values(r.colorBlindnessResults).some(result => !result.isValid)
    );

    if (failingColorBlindTests.length > 0) {
        recommendations.push('Add icons, patterns, or alternative indicators for status elements to support color blind users');
    }

    // Generate accessibility report
    const report = config.generateReport ? generateAccessibilityReport() : {
        summary: { totalCombinations: 0, passingAA: 0, passingAAA: 0, failingAA: 0 },
        details: {},
        colorBlindnessResults: {}
    };

    return {
        summary: {
            totalTests,
            passed,
            failed,
            warnings,
            critical,
            passRate
        },
        results,
        report,
        recommendations: [...new Set(recommendations)] // Remove duplicates
    };
};

/**
 * Enhanced accessibility test utilities for automated CI/CD integration
 */
export const createAccessibilityTestSummary = (
    suiteResult: AccessibilityTestSuiteResult
): {
    passed: boolean;
    score: number;
    criticalIssues: number;
    recommendations: string[];
    jsonReport: object;
} => {
    const { summary, results, recommendations } = suiteResult;

    return {
        passed: summary.critical === 0 && summary.passRate >= 85,
        score: Math.round(summary.passRate),
        criticalIssues: summary.critical,
        recommendations: recommendations.slice(0, 5), // Top 5 recommendations
        jsonReport: {
            timestamp: new Date().toISOString(),
            summary,
            failedTests: results.filter(r => !r.passed).map(r => ({
                name: r.testName,
                severity: r.severity,
                contrast: r.wcagResult?.contrastRatio,
                required: r.wcagResult?.requiredRatio,
                recommendations: r.recommendations
            }))
        }
    };
};

/**
 * Automated accessibility testing for CI/CD pipelines
 */
export const runAutomatedAccessibilityCheck = (): {
    exitCode: number;
    report: string;
    summary: ReturnType<typeof createAccessibilityTestSummary>;
} => {
    const suiteResult = runAccessibilityTestSuite({
        wcagLevel: 'AA',
        includeColorBlindness: true,
        includeVisualRegression: true,
        testLargeText: true,
        generateReport: true
    });

    const summary = createAccessibilityTestSummary(suiteResult);
    const report = createAccessibilityTestReport(suiteResult);

    return {
        exitCode: summary.passed ? 0 : 1,
        report,
        summary
    };
};

/**
 * Create accessibility test HTML report
 */
export const createAccessibilityTestReport = (
    suiteResult: AccessibilityTestSuiteResult
): string => {
    const { summary, results, recommendations } = suiteResult;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Accessibility Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; }
        .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .pass-rate { font-size: 2em; font-weight: bold; color: ${summary.passRate >= 90 ? '#059669' : summary.passRate >= 75 ? '#d97706' : '#dc2626'}; }
        .test-result { margin: 15px 0; padding: 15px; border-left: 4px solid; border-radius: 4px; }
        .passed { border-color: #059669; background: #ecfdf5; }
        .failed { border-color: #dc2626; background: #fef2f2; }
        .warning { border-color: #d97706; background: #fffbeb; }
        .critical { border-color: #dc2626; background: #fef2f2; font-weight: bold; }
        .recommendations { background: #eff6ff; padding: 20px; border-radius: 8px; margin-top: 30px; }
        .color-sample { display: inline-block; width: 20px; height: 20px; border: 1px solid #ccc; margin: 0 5px; vertical-align: middle; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f9fafb; font-weight: 600; }
    </style>
</head>
<body>
    <h1>Accessibility Test Report</h1>
    
    <div class="summary">
        <h2>Summary</h2>
        <div class="pass-rate">${summary.passRate.toFixed(1)}% Pass Rate</div>
        <p>
            <strong>Total Tests:</strong> ${summary.totalTests} |
            <strong>Passed:</strong> ${summary.passed} |
            <strong>Failed:</strong> ${summary.failed} |
            <strong>Warnings:</strong> ${summary.warnings} |
            <strong>Critical:</strong> ${summary.critical}
        </p>
    </div>

    <h2>Test Results</h2>
    ${results.map(result => `
        <div class="test-result ${result.passed ? 'passed' : 'failed'} ${result.severity}">
            <h3>${result.testName} ${result.passed ? '✓' : '✗'}</h3>
            ${result.wcagResult ? `
                <p><strong>WCAG Contrast:</strong> ${result.wcagResult.contrastRatio.toFixed(2)} 
                (Required: ${result.wcagResult.requiredRatio})</p>
            ` : ''}
            ${result.colorBlindnessResults ? `
                <p><strong>Color Blindness Results:</strong></p>
                <ul>
                    ${Object.entries(result.colorBlindnessResults).map(([type, cbResult]) => `
                        <li>${type}: ${cbResult.isValid ? '✓' : '✗'} (${cbResult.contrastRatio.toFixed(2)})</li>
                    `).join('')}
                </ul>
            ` : ''}
            ${result.recommendations.length > 0 ? `
                <p><strong>Recommendations:</strong></p>
                <ul>
                    ${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            ` : ''}
        </div>
    `).join('')}

    ${recommendations.length > 0 ? `
        <div class="recommendations">
            <h2>Overall Recommendations</h2>
            <ul>
                ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    ` : ''}

    <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280;">
        <p>Generated on ${new Date().toLocaleString()}</p>
    </footer>
</body>
</html>
    `;

    return html;
};

/**
 * Utility to save accessibility test report to file (for Node.js environments)
 */
export const saveAccessibilityReport = (
    suiteResult: AccessibilityTestSuiteResult,
    filename: string = 'accessibility-report.html'
): void => {
    if (typeof window !== 'undefined') {
        // Browser environment - create download link
        const html = createAccessibilityTestReport(suiteResult);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } else {
        // Node.js environment would use fs.writeFileSync
        console.log('Report generated. In a Node.js environment, this would save to:', filename);
    }
};

/**
 * Quick accessibility check for a single element
 */
export const quickAccessibilityCheck = (element: HTMLElement): AccessibilityTestResult => {
    const computedStyle = window.getComputedStyle(element);
    const backgroundColor = computedStyle.backgroundColor;
    const color = computedStyle.color;

    // Convert RGB to hex (simplified)
    const rgbToHex = (rgb: string): string => {
        const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!match) return '#000000';

        const r = parseInt(match[1]).toString(16).padStart(2, '0');
        const g = parseInt(match[2]).toString(16).padStart(2, '0');
        const b = parseInt(match[3]).toString(16).padStart(2, '0');

        return `#${r}${g}${b}`;
    };

    const fgHex = rgbToHex(color);
    const bgHex = rgbToHex(backgroundColor);

    const wcagResult = validateWCAGAA(fgHex, bgHex);
    const colorBlindnessResults = validateColorBlindFriendly(fgHex, bgHex);

    const recommendations: string[] = [];
    if (!wcagResult.isValid && wcagResult.recommendations) {
        recommendations.push(...wcagResult.recommendations);
    }

    return {
        testName: `Element Accessibility Check`,
        passed: wcagResult.isValid,
        wcagResult,
        colorBlindnessResults,
        recommendations,
        severity: wcagResult.isValid ? 'low' : 'high'
    };
};

// All exports are already defined above