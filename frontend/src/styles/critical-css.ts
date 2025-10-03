/**
 * Critical CSS extraction and inlining utilities for color system optimization
 * Implements critical CSS inlining for color definitions to improve performance
 */

export interface CriticalCSSConfig {
    inlineThreshold: number; // Size threshold in bytes for inlining
    colorVariables: string[]; // Essential color variables to inline
    components: string[]; // Critical components to inline
}

export const DEFAULT_CRITICAL_CONFIG: CriticalCSSConfig = {
    inlineThreshold: 2048, // 2KB threshold
    colorVariables: [
        '--primary-600',
        '--primary-700',
        '--white',
        '--gray-50',
        '--gray-100',
        '--gray-200',
        '--gray-600',
        '--gray-900',
        '--success-600',
        '--warning-600',
        '--error-600'
    ],
    components: [
        'btn-primary',
        'btn-secondary',
        'input-base',
        'form-error-message'
    ]
};

/**
 * Extracts critical CSS for above-the-fold content
 */
export class CriticalCSSExtractor {
    private config: CriticalCSSConfig;

    constructor(config: CriticalCSSConfig = DEFAULT_CRITICAL_CONFIG) {
        this.config = config;
    }

    /**
     * Generates critical CSS string with essential color definitions
     */
    generateCriticalCSS(): string {
        const criticalVariables = this.extractCriticalVariables();
        const criticalComponents = this.extractCriticalComponents();

        return `
/* Critical CSS - Color System Foundation */
:root {
${criticalVariables}
}

/* Critical Components */
${criticalComponents}

/* Browser Compatibility */
@supports not (color: var(--primary-600)) {
  .btn-primary { background-color: #2563eb !important; color: #ffffff !important; }
  .btn-secondary { background-color: #f3f4f6 !important; color: #374151 !important; }
}
`.trim();
    }

    /**
     * Extracts essential color variables for critical CSS
     */
    private extractCriticalVariables(): string {
        const variables = [
            '  --primary-600: #2563eb;',
            '  --primary-700: #1d4ed8;',
            '  --white: #ffffff;',
            '  --gray-50: #f9fafb;',
            '  --gray-100: #f3f4f6;',
            '  --gray-200: #e5e7eb;',
            '  --gray-600: #4b5563;',
            '  --gray-900: #111827;',
            '  --success-600: #059669;',
            '  --warning-600: #d97706;',
            '  --error-600: #dc2626;'
        ];

        return variables.join('\n');
    }

    /**
     * Extracts critical component styles
     */
    private extractCriticalComponents(): string {
        return `
.btn-primary {
  background-color: var(--primary-600);
  color: var(--white);
  border-color: var(--primary-600);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  border: 1px solid;
  transition: color 0.2s, background-color 0.2s, border-color 0.2s;
  cursor: pointer;
  text-decoration: none;
}

.btn-primary:hover {
  background-color: var(--primary-700);
  border-color: var(--primary-700);
}

.btn-secondary {
  background-color: var(--gray-100);
  color: var(--gray-700);
  border-color: var(--gray-200);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  border: 1px solid;
  transition: color 0.2s, background-color 0.2s, border-color 0.2s;
  cursor: pointer;
  text-decoration: none;
}

.input-base {
  display: block;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--gray-300);
  border-radius: 0.375rem;
  background-color: var(--white);
  color: var(--gray-900);
  font-size: 0.875rem;
}

.input-base:focus {
  outline: none;
  border-color: var(--primary-600);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
`.trim();
    }

    /**
     * Checks if CSS should be inlined based on size threshold
     */
    shouldInline(cssContent: string): boolean {
        return new Blob([cssContent]).size <= this.config.inlineThreshold;
    }

    /**
     * Generates inline CSS for HTML head injection
     */
    generateInlineCSS(): string {
        const criticalCSS = this.generateCriticalCSS();

        if (this.shouldInline(criticalCSS)) {
            return `<style id="critical-css">${criticalCSS}</style>`;
        }

        return '';
    }
}

/**
 * Next.js integration for critical CSS
 */
export function getCriticalCSSForPage(pathname: string): string {
    const extractor = new CriticalCSSExtractor();

    // Customize critical CSS based on page type
    const pageSpecificConfig = getPageSpecificConfig(pathname);
    const customExtractor = new CriticalCSSExtractor(pageSpecificConfig);

    return customExtractor.generateCriticalCSS();
}

/**
 * Gets page-specific critical CSS configuration
 */
function getPageSpecificConfig(pathname: string): CriticalCSSConfig {
    const baseConfig = { ...DEFAULT_CRITICAL_CONFIG };

    // Dashboard pages need more color variables
    if (pathname.includes('/dashboard')) {
        baseConfig.colorVariables.push(
            '--success-50',
            '--success-500',
            '--primary-50',
            '--primary-500'
        );
        baseConfig.components.push('progress-complete', 'metric-card-primary');
    }

    // Auth pages need minimal colors
    if (pathname.includes('/auth')) {
        baseConfig.colorVariables = [
            '--primary-600',
            '--primary-700',
            '--white',
            '--gray-100',
            '--gray-600',
            '--error-600'
        ];
        baseConfig.components = ['btn-primary', 'input-base', 'form-error-message'];
    }

    // Course player needs video-specific colors
    if (pathname.includes('/learn')) {
        baseConfig.colorVariables.push('--gray-800', '--gray-400');
        baseConfig.components.push('video-controls', 'progress-bar');
    }

    return baseConfig;
}

/**
 * Performance monitoring for critical CSS
 */
export class CriticalCSSPerformanceMonitor {
    private metrics: Map<string, number> = new Map();

    /**
     * Measures critical CSS generation time
     */
    measureGenerationTime(fn: () => string): { result: string; duration: number } {
        const start = performance.now();
        const result = fn();
        const duration = performance.now() - start;

        this.metrics.set('generation_time', duration);
        return { result, duration };
    }

    /**
     * Measures CSS size impact
     */
    measureSizeImpact(original: string, critical: string): {
        originalSize: number;
        criticalSize: number;
        reduction: number;
    } {
        const originalSize = new Blob([original]).size;
        const criticalSize = new Blob([critical]).size;
        const reduction = ((originalSize - criticalSize) / originalSize) * 100;

        this.metrics.set('original_size', originalSize);
        this.metrics.set('critical_size', criticalSize);
        this.metrics.set('size_reduction', reduction);

        return { originalSize, criticalSize, reduction };
    }

    /**
     * Gets all performance metrics
     */
    getMetrics(): Record<string, number> {
        return Object.fromEntries(this.metrics);
    }

    /**
     * Resets performance metrics
     */
    reset(): void {
        this.metrics.clear();
    }
}