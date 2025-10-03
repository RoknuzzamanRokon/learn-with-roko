/**
 * Accessibility Testing Configuration
 * 
 * Centralized configuration for all accessibility testing utilities
 * including WCAG standards, color combinations, and test thresholds.
 */

import { ColorTestCase, AccessibilityTestConfig } from './accessibility-test-utils';

/**
 * WCAG compliance thresholds
 */
export const WCAG_THRESHOLDS = {
    AA: {
        normal: 4.5,
        large: 3.0
    },
    AAA: {
        normal: 7.0,
        large: 4.5
    }
} as const;

/**
 * Accessibility test configurations for different environments
 */
export const ACCESSIBILITY_CONFIGS = {
    // Development environment - comprehensive testing
    development: {
        wcagLevel: 'AA' as const,
        includeColorBlindness: true,
        includeVisualRegression: true,
        testLargeText: true,
        generateReport: true,
        failOnWarnings: false,
        minPassRate: 80
    },

    // CI/CD environment - focused on critical issues
    ci: {
        wcagLevel: 'AA' as const,
        includeColorBlindness: true,
        includeVisualRegression: false, // Skip visual regression in CI for speed
        testLargeText: true,
        generateReport: true,
        failOnWarnings: false,
        minPassRate: 85
    },

    // Production readiness - strict standards
    production: {
        wcagLevel: 'AA' as const,
        includeColorBlindness: true,
        includeVisualRegression: true,
        testLargeText: true,
        generateReport: true,
        failOnWarnings: true,
        minPassRate: 95
    },

    // Enhanced accessibility - WCAG AAA compliance
    enhanced: {
        wcagLevel: 'AAA' as const,
        includeColorBlindness: true,
        includeVisualRegression: true,
        testLargeText: true,
        generateReport: true,
        failOnWarnings: true,
        minPassRate: 90
    }
} as const;

/**
 * Critical color combinations that must pass accessibility tests
 * These are the most important UI elements for user interaction
 */
export const CRITICAL_ACCESSIBILITY_COMBINATIONS: ColorTestCase[] = [
    // Primary interactive elements
    {
        name: 'Primary CTA Button',
        foreground: '#ffffff',
        background: '#2563eb',
        context: 'ui',
        critical: true
    },
    {
        name: 'Primary Button Hover',
        foreground: '#ffffff',
        background: '#1d4ed8',
        context: 'ui',
        critical: true
    },
    {
        name: 'Secondary Button',
        foreground: '#374151',
        background: '#f3f4f6',
        context: 'ui',
        critical: true
    },

    // Text content
    {
        name: 'Primary Text',
        foreground: '#111827',
        background: '#ffffff',
        context: 'normal',
        critical: true
    },
    {
        name: 'Body Text',
        foreground: '#374151',
        background: '#ffffff',
        context: 'normal',
        critical: true
    },
    {
        name: 'Large Heading',
        foreground: '#111827',
        background: '#ffffff',
        context: 'large',
        critical: true
    },

    // Status and feedback
    {
        name: 'Success Message',
        foreground: '#065f46',
        background: '#d1fae5',
        context: 'normal',
        critical: true
    },
    {
        name: 'Error Message',
        foreground: '#991b1b',
        background: '#fee2e2',
        context: 'normal',
        critical: true
    },
    {
        name: 'Warning Message',
        foreground: '#92400e',
        background: '#fef3c7',
        context: 'normal',
        critical: true
    },

    // Navigation and links
    {
        name: 'Primary Link',
        foreground: '#2563eb',
        background: '#ffffff',
        context: 'normal',
        critical: true
    },
    {
        name: 'Navigation Active',
        foreground: '#1d4ed8',
        background: '#dbeafe',
        context: 'normal',
        critical: false
    },

    // Form elements
    {
        name: 'Form Input Focus',
        foreground: '#111827',
        background: '#ffffff',
        context: 'normal',
        critical: true
    },
    {
        name: 'Form Error State',
        foreground: '#dc2626',
        background: '#ffffff',
        context: 'normal',
        critical: true
    }
];

/**
 * Color combinations that should be tested but are not critical
 */
export const SECONDARY_ACCESSIBILITY_COMBINATIONS: ColorTestCase[] = [
    {
        name: 'Secondary Text',
        foreground: '#6b7280',
        background: '#ffffff',
        context: 'normal',
        critical: false
    },
    {
        name: 'Placeholder Text',
        foreground: '#9ca3af',
        background: '#ffffff',
        context: 'normal',
        critical: false
    },
    {
        name: 'Disabled Button',
        foreground: '#9ca3af',
        background: '#f3f4f6',
        context: 'ui',
        critical: false
    },
    {
        name: 'Card Border',
        foreground: '#e5e7eb',
        background: '#ffffff',
        context: 'ui',
        critical: false
    },
    {
        name: 'Subtle Background',
        foreground: '#374151',
        background: '#f9fafb',
        context: 'normal',
        critical: false
    }
];

/**
 * All color combinations for comprehensive testing
 */
export const ALL_ACCESSIBILITY_COMBINATIONS = [
    ...CRITICAL_ACCESSIBILITY_COMBINATIONS,
    ...SECONDARY_ACCESSIBILITY_COMBINATIONS
];

/**
 * Color blindness simulation accuracy thresholds
 */
export const COLOR_BLINDNESS_THRESHOLDS = {
    // Minimum percentage of color blindness types that should pass
    minPassRate: 0.75, // 75% of color blindness types should pass

    // Critical elements should pass for most types
    criticalMinPassRate: 0.5, // 50% for critical elements

    // Types of color blindness to test
    types: ['protanopia', 'deuteranopia', 'tritanopia', 'achromatopsia'] as const
};

/**
 * Visual regression testing configuration
 */
export const VISUAL_REGRESSION_CONFIG = {
    // Components to test for visual consistency
    components: [
        'button',
        'card',
        'alert',
        'badge',
        'progress-bar',
        'status-indicator',
        'form-input',
        'navigation'
    ],

    // States to test for each component
    states: ['default', 'hover', 'active', 'focus', 'disabled'],

    // Viewport sizes for responsive testing
    viewports: [
        { width: 320, height: 568, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 1024, height: 768, name: 'desktop' },
        { width: 1920, height: 1080, name: 'large-desktop' }
    ]
};

/**
 * Performance thresholds for accessibility tests
 */
export const PERFORMANCE_THRESHOLDS = {
    // Maximum time for single contrast calculation (ms)
    maxContrastCalculationTime: 10,

    // Maximum time for full test suite (ms)
    maxTestSuiteTime: 5000,

    // Maximum time for color blindness simulation (ms)
    maxColorBlindnessSimulationTime: 50,

    // Maximum memory usage increase during tests (MB)
    maxMemoryIncrease: 100
};

/**
 * Report generation configuration
 */
export const REPORT_CONFIG = {
    // Default output formats
    formats: ['html', 'json', 'console'] as const,

    // Report sections to include
    sections: {
        summary: true,
        detailedResults: true,
        colorBlindnessReport: true,
        visualRegressionResults: true,
        recommendations: true,
        performanceMetrics: false
    },

    // Styling for HTML reports
    htmlStyling: {
        theme: 'light' as const,
        includeCharts: true,
        includeColorSamples: true,
        responsive: true
    }
};

/**
 * Integration configuration for different tools and platforms
 */
export const INTEGRATION_CONFIG = {
    // GitHub Actions
    githubActions: {
        createAnnotations: true,
        setOutputs: true,
        generateJobSummary: true,
        uploadArtifacts: true
    },

    // Jest/Vitest integration
    testFramework: {
        failOnCritical: true,
        warnOnMinorIssues: true,
        generateSnapshots: false,
        updateSnapshots: false
    },

    // Webpack/Vite build integration
    buildTools: {
        failBuildOnCritical: true,
        generateBuildReport: true,
        optimizeForProduction: true
    }
};

/**
 * Get configuration for specific environment
 */
export function getAccessibilityConfig(environment: keyof typeof ACCESSIBILITY_CONFIGS): AccessibilityTestConfig {
    const config = ACCESSIBILITY_CONFIGS[environment];

    return {
        wcagLevel: config.wcagLevel,
        includeColorBlindness: config.includeColorBlindness,
        includeVisualRegression: config.includeVisualRegression,
        testLargeText: config.testLargeText,
        generateReport: config.generateReport
    };
}

/**
 * Validate accessibility configuration
 */
export function validateAccessibilityConfig(config: AccessibilityTestConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
} {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate WCAG level
    if (!['AA', 'AAA'].includes(config.wcagLevel)) {
        errors.push(`Invalid WCAG level: ${config.wcagLevel}. Must be 'AA' or 'AAA'.`);
    }

    // Validate boolean options
    const booleanOptions = [
        'includeColorBlindness',
        'includeVisualRegression',
        'testLargeText',
        'generateReport'
    ] as const;

    booleanOptions.forEach(option => {
        if (typeof config[option] !== 'boolean') {
            errors.push(`${option} must be a boolean value.`);
        }
    });

    // Performance warnings
    if (config.includeVisualRegression && config.includeColorBlindness) {
        warnings.push('Running both visual regression and color blindness tests may impact performance.');
    }

    if (config.wcagLevel === 'AAA') {
        warnings.push('WCAG AAA compliance is very strict and may result in many failures.');
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Get recommended configuration based on use case
 */
export function getRecommendedConfig(useCase: 'development' | 'ci' | 'production' | 'audit'): {
    config: AccessibilityTestConfig;
    description: string;
    recommendations: string[];
} {
    switch (useCase) {
        case 'development':
            return {
                config: getAccessibilityConfig('development'),
                description: 'Comprehensive testing for development environment',
                recommendations: [
                    'Run tests frequently during development',
                    'Fix critical issues immediately',
                    'Use generated reports to track progress'
                ]
            };

        case 'ci':
            return {
                config: getAccessibilityConfig('ci'),
                description: 'Optimized for CI/CD pipelines',
                recommendations: [
                    'Focus on critical accessibility issues',
                    'Fail builds on critical failures only',
                    'Generate artifacts for review'
                ]
            };

        case 'production':
            return {
                config: getAccessibilityConfig('production'),
                description: 'Strict standards for production readiness',
                recommendations: [
                    'All critical tests must pass',
                    'Address all warnings before deployment',
                    'Maintain high pass rate standards'
                ]
            };

        case 'audit':
            return {
                config: getAccessibilityConfig('enhanced'),
                description: 'Comprehensive audit with WCAG AAA standards',
                recommendations: [
                    'Use for periodic accessibility audits',
                    'Review all recommendations carefully',
                    'Consider implementing AAA standards for critical elements'
                ]
            };

        default:
            return {
                config: getAccessibilityConfig('development'),
                description: 'Default development configuration',
                recommendations: ['Consider specifying a more specific use case']
            };
    }
}