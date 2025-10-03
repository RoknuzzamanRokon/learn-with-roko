#!/usr/bin/env node

/**
 * Automated Accessibility Check for CI/CD Integration
 * 
 * This script runs comprehensive accessibility tests and generates reports
 * suitable for continuous integration pipelines.
 * 
 * Usage:
 * - npm run test:accessibility:ci
 * - node automated-accessibility-check.js
 * 
 * Exit codes:
 * - 0: All accessibility tests passed
 * - 1: Critical accessibility issues found
 * - 2: Configuration or runtime error
 */

import { runAutomatedAccessibilityCheck, createAccessibilityTestSummary } from './accessibility-test-utils';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface AccessibilityCheckOptions {
    outputDir?: string;
    generateHtml?: boolean;
    generateJson?: boolean;
    verbose?: boolean;
    failOnWarnings?: boolean;
    wcagLevel?: 'AA' | 'AAA';
}

/**
 * Main function for automated accessibility checking
 */
export async function runAccessibilityCheck(options: AccessibilityCheckOptions = {}): Promise<number> {
    const {
        outputDir = './accessibility-reports',
        generateHtml = true,
        generateJson = true,
        verbose = false,
        failOnWarnings = false,
        wcagLevel = 'AA'
    } = options;

    try {
        console.log('🔍 Running automated accessibility checks...');
        console.log(`📋 WCAG Level: ${wcagLevel}`);
        console.log(`📁 Output Directory: ${outputDir}`);

        // Create output directory if it doesn't exist
        try {
            mkdirSync(outputDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }

        // Run accessibility tests
        const { exitCode, report, summary } = runAutomatedAccessibilityCheck();

        // Log summary to console
        console.log('\n📊 Accessibility Test Results:');
        console.log(`   Total Tests: ${(summary.jsonReport as any).summary.totalTests}`);
        console.log(`   Passed: ${(summary.jsonReport as any).summary.passed}`);
        console.log(`   Failed: ${(summary.jsonReport as any).summary.failed}`);
        console.log(`   Warnings: ${(summary.jsonReport as any).summary.warnings}`);
        console.log(`   Critical Issues: ${summary.criticalIssues}`);
        console.log(`   Pass Rate: ${summary.score}%`);

        // Determine final exit code
        let finalExitCode = exitCode;
        if (failOnWarnings && (summary.jsonReport as any).summary.warnings > 0) {
            finalExitCode = 1;
        }

        // Generate reports
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        if (generateJson) {
            const jsonPath = join(outputDir, `accessibility-report-${timestamp}.json`);
            writeFileSync(jsonPath, JSON.stringify(summary.jsonReport, null, 2));
            console.log(`📄 JSON Report: ${jsonPath}`);
        }

        if (generateHtml) {
            const htmlPath = join(outputDir, `accessibility-report-${timestamp}.html`);
            writeFileSync(htmlPath, report);
            console.log(`🌐 HTML Report: ${htmlPath}`);
        }

        // Display recommendations
        if (summary.recommendations.length > 0) {
            console.log('\n💡 Top Recommendations:');
            summary.recommendations.forEach((rec, index) => {
                console.log(`   ${index + 1}. ${rec}`);
            });
        }

        // Display final result
        if (finalExitCode === 0) {
            console.log('\n✅ All accessibility checks passed!');
        } else {
            console.log('\n❌ Accessibility issues found. Please review the report.');

            if (verbose && (summary.jsonReport as any).failedTests.length > 0) {
                console.log('\n🔍 Failed Tests:');
                (summary.jsonReport as any).failedTests.forEach((test: any) => {
                    console.log(`   • ${test.name} (${test.severity})`);
                    if (test.contrast && test.required) {
                        console.log(`     Contrast: ${test.contrast.toFixed(2)} (required: ${test.required})`);
                    }
                });
            }
        }

        return finalExitCode;

    } catch (error) {
        console.error('❌ Error running accessibility checks:', error);
        return 2;
    }
}

/**
 * CLI interface for the accessibility checker
 */
export function runCLI(): void {
    const args = process.argv.slice(2);
    const options: AccessibilityCheckOptions = {};

    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        switch (arg) {
            case '--output-dir':
                options.outputDir = args[++i];
                break;
            case '--no-html':
                options.generateHtml = false;
                break;
            case '--no-json':
                options.generateJson = false;
                break;
            case '--verbose':
                options.verbose = true;
                break;
            case '--fail-on-warnings':
                options.failOnWarnings = true;
                break;
            case '--wcag-aaa':
                options.wcagLevel = 'AAA';
                break;
            case '--help':
                console.log(`
Automated Accessibility Checker

Usage: node automated-accessibility-check.js [options]

Options:
  --output-dir <dir>     Output directory for reports (default: ./accessibility-reports)
  --no-html             Skip HTML report generation
  --no-json             Skip JSON report generation
  --verbose             Show detailed test results
  --fail-on-warnings    Fail on warnings, not just critical issues
  --wcag-aaa            Use WCAG AAA standard instead of AA
  --help                Show this help message

Exit Codes:
  0  All tests passed
  1  Accessibility issues found
  2  Configuration or runtime error
                `);
                process.exit(0);
                break;
        }
    }

    // Run the accessibility check
    runAccessibilityCheck(options)
        .then(exitCode => {
            process.exit(exitCode);
        })
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(2);
        });
}

/**
 * GitHub Actions integration helper
 */
export function generateGitHubActionsOutput(summary: ReturnType<typeof createAccessibilityTestSummary>): void {
    if (process.env.GITHUB_ACTIONS) {
        // Set GitHub Actions outputs
        console.log(`::set-output name=accessibility-score::${summary.score}`);
        console.log(`::set-output name=critical-issues::${summary.criticalIssues}`);
        console.log(`::set-output name=passed::${summary.passed}`);

        // Create annotations for failed tests
        if ((summary.jsonReport as any).failedTests && Array.isArray((summary.jsonReport as any).failedTests)) {
            (summary.jsonReport as any).failedTests.forEach((test: any) => {
                const level = test.severity === 'critical' ? 'error' : 'warning';
                console.log(`::${level}::${test.name}: ${test.recommendations?.[0] || 'Accessibility issue detected'}`);
            });
        }

        // Create job summary
        const summaryTable = `
## 🔍 Accessibility Test Results

| Metric | Value |
|--------|-------|
| **Pass Rate** | ${summary.score}% |
| **Total Tests** | ${(summary.jsonReport as any).summary.totalTests} |
| **Passed** | ${(summary.jsonReport as any).summary.passed} |
| **Failed** | ${(summary.jsonReport as any).summary.failed} |
| **Critical Issues** | ${summary.criticalIssues} |
| **Warnings** | ${(summary.jsonReport as any).summary.warnings} |

${summary.recommendations.length > 0 ? `
### 💡 Recommendations
${summary.recommendations.map(rec => `- ${rec}`).join('\n')}
` : ''}
        `;

        console.log(`::notice::${summaryTable}`);
    }
}

// Run CLI if this file is executed directly
if (require.main === module) {
    runCLI();
}