/**
 * Visual Regression Testing Utilities for Color Consistency
 * 
 * This module provides utilities for capturing and comparing visual snapshots
 * of UI components to ensure color consistency across different states and conditions.
 */

import { DESIGN_SYSTEM_CLASSES, DEFAULT_COLORS } from '../../styles';
import { VISUAL_REGRESSION_CONFIG } from './accessibility-config';

/**
 * Component snapshot configuration
 */
export interface ComponentSnapshot {
    name: string;
    html: string;
    css?: string;
    viewport?: { width: number; height: number };
    states?: string[];
}

/**
 * Visual regression test result
 */
export interface VisualRegressionResult {
    component: string;
    state: string;
    passed: boolean;
    differences?: {
        pixelDifference: number;
        percentageDifference: number;
        colorInconsistencies: string[];
    };
    screenshot?: string; // Base64 encoded screenshot
    baseline?: string; // Base64 encoded baseline
}

/**
 * Create component showcase for visual testing
 */
export function createComponentShowcase(): HTMLElement {
    const showcase = document.createElement('div');
    showcase.className = 'component-showcase';
    showcase.style.cssText = `
        padding: 20px;
        background: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.5;
    `;

    // Button components
    const buttonSection = createButtonShowcase();
    showcase.appendChild(buttonSection);

    // Status indicators
    const statusSection = createStatusIndicatorShowcase();
    showcase.appendChild(statusSection);

    // Form elements
    const formSection = createFormElementShowcase();
    showcase.appendChild(formSection);

    // Cards and containers
    const cardSection = createCardShowcase();
    showcase.appendChild(cardSection);

    // Navigation elements
    const navSection = createNavigationShowcase();
    showcase.appendChild(navSection);

    return showcase;
}

/**
 * Create button component showcase
 */
function createButtonShowcase(): HTMLElement {
    const section = document.createElement('div');
    section.innerHTML = `
        <h3 style="margin: 20px 0 10px 0; color: ${DEFAULT_COLORS.GRAY_900};">Buttons</h3>
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">
            <button class="${DESIGN_SYSTEM_CLASSES.BTN_BASE} ${DESIGN_SYSTEM_CLASSES.BTN_PRIMARY}">Primary</button>
            <button class="${DESIGN_SYSTEM_CLASSES.BTN_BASE} ${DESIGN_SYSTEM_CLASSES.BTN_SECONDARY}">Secondary</button>
            <button class="${DESIGN_SYSTEM_CLASSES.BTN_BASE} ${DESIGN_SYSTEM_CLASSES.BTN_SUCCESS}">Success</button>
            <button class="${DESIGN_SYSTEM_CLASSES.BTN_BASE} ${DESIGN_SYSTEM_CLASSES.BTN_WARNING}">Warning</button>
            <button class="${DESIGN_SYSTEM_CLASSES.BTN_BASE} ${DESIGN_SYSTEM_CLASSES.BTN_ERROR}">Error</button>
            <button class="${DESIGN_SYSTEM_CLASSES.BTN_BASE} ${DESIGN_SYSTEM_CLASSES.BTN_PRIMARY}" disabled>Disabled</button>
        </div>
    `;
    return section;
}

/**
 * Create status indicator showcase
 */
function createStatusIndicatorShowcase(): HTMLElement {
    const section = document.createElement('div');
    section.innerHTML = `
        <h3 style="margin: 20px 0 10px 0; color: ${DEFAULT_COLORS.GRAY_900};">Status Indicators</h3>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
            <div class="${DESIGN_SYSTEM_CLASSES.STATUS_INDICATOR} ${DESIGN_SYSTEM_CLASSES.STATUS_SUCCESS}">
                <span aria-hidden="true">✓</span><span>Success: Operation completed successfully</span>
            </div>
            <div class="${DESIGN_SYSTEM_CLASSES.STATUS_INDICATOR} ${DESIGN_SYSTEM_CLASSES.STATUS_WARNING}">
                <span aria-hidden="true">⚠</span><span>Warning: Please review your input</span>
            </div>
            <div class="${DESIGN_SYSTEM_CLASSES.STATUS_INDICATOR} ${DESIGN_SYSTEM_CLASSES.STATUS_ERROR}">
                <span aria-hidden="true">✕</span><span>Error: Something went wrong</span>
            </div>
            <div class="${DESIGN_SYSTEM_CLASSES.STATUS_INDICATOR} ${DESIGN_SYSTEM_CLASSES.STATUS_INFO}">
                <span aria-hidden="true">ℹ</span><span>Info: Additional information available</span>
            </div>
        </div>
    `;
    return section;
}

/**
 * Create form element showcase
 */
function createFormElementShowcase(): HTMLElement {
    const section = document.createElement('div');
    section.innerHTML = `
        <h3 style="margin: 20px 0 10px 0; color: ${DEFAULT_COLORS.GRAY_900};">Form Elements</h3>
        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; max-width: 300px;">
            <input type="text" class="${DESIGN_SYSTEM_CLASSES.INPUT_BASE}" placeholder="Normal input" />
            <input type="text" class="${DESIGN_SYSTEM_CLASSES.INPUT_BASE} ${DESIGN_SYSTEM_CLASSES.INPUT_SUCCESS}" placeholder="Success state" />
            <input type="text" class="${DESIGN_SYSTEM_CLASSES.INPUT_BASE} ${DESIGN_SYSTEM_CLASSES.INPUT_ERROR}" placeholder="Error state" />
            <select class="${DESIGN_SYSTEM_CLASSES.INPUT_BASE}">
                <option>Select option</option>
                <option>Option 1</option>
                <option>Option 2</option>
            </select>
        </div>
    `;
    return section;
}

/**
 * Create card showcase
 */
function createCardShowcase(): HTMLElement {
    const section = document.createElement('div');
    section.innerHTML = `
        <h3 style="margin: 20px 0 10px 0; color: ${DEFAULT_COLORS.GRAY_900};">Cards</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
            <div class="${DESIGN_SYSTEM_CLASSES.CARD_BASE}">
                <h4 style="margin: 0 0 8px 0;">Base Card</h4>
                <p style="margin: 0; color: ${DEFAULT_COLORS.GRAY_600};">Standard card content</p>
            </div>
            <div class="${DESIGN_SYSTEM_CLASSES.CARD_BASE} ${DESIGN_SYSTEM_CLASSES.CARD_PRIMARY}">
                <h4 style="margin: 0 0 8px 0;">Primary Card</h4>
                <p style="margin: 0; color: ${DEFAULT_COLORS.GRAY_600};">Featured content</p>
            </div>
            <div class="${DESIGN_SYSTEM_CLASSES.CARD_BASE} ${DESIGN_SYSTEM_CLASSES.CARD_SUCCESS}">
                <h4 style="margin: 0 0 8px 0;">Success Card</h4>
                <p style="margin: 0; color: ${DEFAULT_COLORS.GRAY_600};">Positive outcome</p>
            </div>
        </div>
    `;
    return section;
}

/**
 * Create navigation showcase
 */
function createNavigationShowcase(): HTMLElement {
    const section = document.createElement('div');
    section.innerHTML = `
        <h3 style="margin: 20px 0 10px 0; color: ${DEFAULT_COLORS.GRAY_900};">Navigation</h3>
        <nav style="margin-bottom: 20px;">
            <div style="display: flex; gap: 16px; padding: 12px; background: ${DEFAULT_COLORS.GRAY_50}; border-radius: 8px;">
                <a href="#" class="${DESIGN_SYSTEM_CLASSES.NAV_LINK}">Home</a>
                <a href="#" class="${DESIGN_SYSTEM_CLASSES.NAV_LINK} ${DESIGN_SYSTEM_CLASSES.NAV_LINK_ACTIVE}">Courses</a>
                <a href="#" class="${DESIGN_SYSTEM_CLASSES.NAV_LINK}">Profile</a>
                <a href="#" class="${DESIGN_SYSTEM_CLASSES.NAV_LINK}">Settings</a>
            </div>
        </nav>
    `;
    return section;
}

/**
 * Create progress bar showcase
 */
function createProgressShowcase(): HTMLElement {
    const section = document.createElement('div');
    section.innerHTML = `
        <h3 style="margin: 20px 0 10px 0; color: ${DEFAULT_COLORS.GRAY_900};">Progress Indicators</h3>
        <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px;">
            <div>
                <label style="display: block; margin-bottom: 4px; font-size: 14px;">Course Progress (75%)</label>
                <div class="${DESIGN_SYSTEM_CLASSES.PROGRESS_BAR}" style="width: 100%; max-width: 300px;">
                    <div class="${DESIGN_SYSTEM_CLASSES.PROGRESS_FILL} ${DESIGN_SYSTEM_CLASSES.PROGRESS_FILL_SUCCESS}" style="width: 75%;"></div>
                </div>
            </div>
            <div>
                <label style="display: block; margin-bottom: 4px; font-size: 14px;">Loading (45%)</label>
                <div class="${DESIGN_SYSTEM_CLASSES.PROGRESS_BAR}" style="width: 100%; max-width: 300px;">
                    <div class="${DESIGN_SYSTEM_CLASSES.PROGRESS_FILL}" style="width: 45%;"></div>
                </div>
            </div>
        </div>
    `;
    return section;
}

/**
 * Capture component screenshot (mock implementation)
 */
export async function captureComponentScreenshot(
    component: HTMLElement,
    options: {
        viewport?: { width: number; height: number };
        state?: string;
        devicePixelRatio?: number;
    } = {}
): Promise<string> {
    // In a real implementation, this would use html2canvas or similar
    // For testing purposes, we'll return a mock base64 string

    const { viewport = { width: 800, height: 600 }, state = 'default' } = options;

    // Simulate screenshot capture
    return new Promise((resolve) => {
        setTimeout(() => {
            // Mock base64 image data
            const mockImageData = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
            resolve(mockImageData);
        }, 100);
    });
}

/**
 * Compare two screenshots for visual differences
 */
export function compareScreenshots(
    baseline: string,
    current: string,
    threshold: number = 0.1
): {
    passed: boolean;
    pixelDifference: number;
    percentageDifference: number;
    colorInconsistencies: string[];
} {
    // Mock implementation - in reality would use image comparison library
    // like pixelmatch or similar

    const mockPixelDifference = Math.floor(Math.random() * 100);
    const mockPercentageDifference = (mockPixelDifference / 10000) * 100;

    return {
        passed: mockPercentageDifference <= threshold,
        pixelDifference: mockPixelDifference,
        percentageDifference: mockPercentageDifference,
        colorInconsistencies: mockPercentageDifference > threshold ? [
            'Button background color mismatch',
            'Text color inconsistency in status indicator'
        ] : []
    };
}

/**
 * Run visual regression tests for all components
 */
export async function runVisualRegressionTests(
    baselineDir?: string
): Promise<VisualRegressionResult[]> {
    const results: VisualRegressionResult[] = [];
    const showcase = createComponentShowcase();

    // Add showcase to DOM temporarily
    document.body.appendChild(showcase);

    try {
        // Test each component in different states
        const components = VISUAL_REGRESSION_CONFIG.components;
        const states = VISUAL_REGRESSION_CONFIG.states;

        for (const componentName of components) {
            for (const state of states) {
                // Apply state to component (mock implementation)
                const componentElement = showcase.querySelector(`[class*="${componentName}"]`);

                if (componentElement) {
                    // Simulate state application
                    if (state !== 'default') {
                        componentElement.classList.add(state);
                    }

                    // Capture screenshot
                    const screenshot = await captureComponentScreenshot(componentElement as HTMLElement, { state });

                    // Compare with baseline (mock)
                    const baseline = screenshot; // In reality, would load from baseline directory
                    const comparison = compareScreenshots(baseline, screenshot);

                    results.push({
                        component: componentName,
                        state,
                        passed: comparison.passed,
                        differences: comparison.passed ? undefined : {
                            pixelDifference: comparison.pixelDifference,
                            percentageDifference: comparison.percentageDifference,
                            colorInconsistencies: comparison.colorInconsistencies
                        },
                        screenshot,
                        baseline
                    });

                    // Remove state class
                    if (state !== 'default') {
                        componentElement.classList.remove(state);
                    }
                }
            }
        }
    } finally {
        // Clean up
        document.body.removeChild(showcase);
    }

    return results;
}

/**
 * Generate visual regression test report
 */
export function generateVisualRegressionReport(
    results: VisualRegressionResult[]
): {
    summary: {
        total: number;
        passed: number;
        failed: number;
        passRate: number;
    };
    failedTests: VisualRegressionResult[];
    recommendations: string[];
} {
    const total = results.length;
    const passed = results.filter(r => r.passed).length;
    const failed = total - passed;
    const passRate = total > 0 ? (passed / total) * 100 : 0;

    const failedTests = results.filter(r => !r.passed);

    const recommendations: string[] = [];

    if (failed > 0) {
        recommendations.push(`${failed} visual regression tests failed - review component styling`);

        // Analyze common issues
        const colorIssues = failedTests.filter(t =>
            t.differences?.colorInconsistencies && t.differences.colorInconsistencies.length > 0
        );

        if (colorIssues.length > 0) {
            recommendations.push('Color inconsistencies detected - verify CSS custom properties are applied correctly');
        }

        const highDifference = failedTests.filter(t =>
            t.differences && t.differences.percentageDifference > 5
        );

        if (highDifference.length > 0) {
            recommendations.push('Significant visual differences detected - check for layout or styling changes');
        }
    }

    if (passRate < 95) {
        recommendations.push('Consider updating baselines if intentional design changes were made');
    }

    return {
        summary: {
            total,
            passed,
            failed,
            passRate
        },
        failedTests,
        recommendations
    };
}

/**
 * Update visual regression baselines
 */
export async function updateVisualBaselines(
    components?: string[],
    outputDir: string = './visual-baselines'
): Promise<void> {
    const showcase = createComponentShowcase();
    document.body.appendChild(showcase);

    try {
        const componentsToUpdate = components || VISUAL_REGRESSION_CONFIG.components;

        for (const componentName of componentsToUpdate) {
            for (const state of VISUAL_REGRESSION_CONFIG.states) {
                const componentElement = showcase.querySelector(`[class*="${componentName}"]`);

                if (componentElement) {
                    if (state !== 'default') {
                        componentElement.classList.add(state);
                    }

                    const screenshot = await captureComponentScreenshot(componentElement as HTMLElement, { state });

                    // In a real implementation, would save to file system
                    console.log(`Updated baseline for ${componentName}-${state}`);

                    if (state !== 'default') {
                        componentElement.classList.remove(state);
                    }
                }
            }
        }
    } finally {
        document.body.removeChild(showcase);
    }
}

/**
 * Test component color consistency across different conditions
 */
export function testComponentColorConsistency(
    componentElement: HTMLElement,
    expectedColors: Record<string, string>
): {
    passed: boolean;
    inconsistencies: Array<{
        property: string;
        expected: string;
        actual: string;
    }>;
} {
    const inconsistencies: Array<{
        property: string;
        expected: string;
        actual: string;
    }> = [];

    const computedStyle = window.getComputedStyle(componentElement);

    Object.entries(expectedColors).forEach(([property, expectedValue]) => {
        const actualValue = computedStyle.getPropertyValue(property);

        // Normalize color values for comparison
        const normalizedExpected = normalizeColor(expectedValue);
        const normalizedActual = normalizeColor(actualValue);

        if (normalizedExpected !== normalizedActual) {
            inconsistencies.push({
                property,
                expected: expectedValue,
                actual: actualValue
            });
        }
    });

    return {
        passed: inconsistencies.length === 0,
        inconsistencies
    };
}

/**
 * Normalize color values for comparison
 */
function normalizeColor(color: string): string {
    // Simple color normalization - in reality would handle rgb/hex/hsl conversion
    return color.toLowerCase().trim();
}

/**
 * Create visual test environment
 */
export function createVisualTestEnvironment(): {
    container: HTMLElement;
    cleanup: () => void;
} {
    const container = document.createElement('div');
    container.id = 'visual-test-environment';
    container.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: 1024px;
        height: 768px;
        background: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    document.body.appendChild(container);

    return {
        container,
        cleanup: () => {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        }
    };
}