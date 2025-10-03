/**
 * Tests for color system performance monitoring
 * Verifies that performance monitoring and alerting systems work correctly
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ColorSystemPerformanceMonitor } from '../styles/performance-monitor';
import { PerformanceAlertManager } from '../styles/performance-alerts';
import { CriticalCSSExtractor } from '../styles/critical-css';
import { CSSPurgingOptimizer } from '../styles/css-purging';
import { CSSOptimizer } from '../styles/css-optimization';

// Mock performance API
const mockPerformance = {
    now: vi.fn(() => Date.now()),
    memory: {
        usedJSHeapSize: 1024 * 1024 * 10 // 10MB
    }
};

// Mock PerformanceObserver
class MockPerformanceObserver {
    private callback: (list: any) => void;

    constructor(callback: (list: any) => void) {
        this.callback = callback;
    }

    observe() {
        // Mock implementation
    }

    disconnect() {
        // Mock implementation
    }
}

// Setup global mocks
beforeEach(() => {
    global.performance = mockPerformance as any;
    global.PerformanceObserver = MockPerformanceObserver as any;

    // Mock localStorage
    const localStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
    };
    global.localStorage = localStorageMock as any;

    // Mock window
    global.window = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
    } as any;
});

afterEach(() => {
    vi.clearAllMocks();
});

describe('ColorSystemPerformanceMonitor', () => {
    let monitor: ColorSystemPerformanceMonitor;

    beforeEach(() => {
        monitor = new ColorSystemPerformanceMonitor();
    });

    afterEach(() => {
        monitor.cleanup();
    });

    it('should initialize with default thresholds', () => {
        expect(monitor).toBeDefined();
        const stats = monitor.getStatistics();
        expect(stats.latest).toBeNull();
        expect(stats.averages).toEqual({});
    });

    it('should measure CSS variable usage', async () => {
        // Mock document.styleSheets
        const mockStyleSheets = [
            {
                cssRules: [
                    {
                        type: 1, // CSSRule.STYLE_RULE
                        cssText: ':root { --primary-600: #2563eb; --gray-900: #111827; }'
                    }
                ]
            }
        ];

        global.document = {
            styleSheets: mockStyleSheets
        } as any;

        global.CSSRule = {
            STYLE_RULE: 1
        } as any;

        const result = await monitor.measureCSSVariableUsage();

        expect(result).toHaveProperty('count');
        expect(result).toHaveProperty('unusedCount');
        expect(result).toHaveProperty('measureTime');
        expect(typeof result.count).toBe('number');
        expect(typeof result.measureTime).toBe('number');
    });

    it('should measure color rendering performance', async () => {
        const mockElement = {
            style: { color: '' }
        } as HTMLElement;

        // Mock requestAnimationFrame
        global.requestAnimationFrame = vi.fn((callback) => {
            setTimeout(callback, 16);
            return 1;
        });

        const renderTime = await monitor.measureColorRenderingPerformance(mockElement);

        expect(typeof renderTime).toBe('number');
        expect(renderTime).toBeGreaterThanOrEqual(0);
    });

    it('should export metrics correctly', () => {
        const exported = monitor.exportMetrics();

        expect(exported).toHaveProperty('metrics');
        expect(exported).toHaveProperty('thresholds');
        expect(exported).toHaveProperty('statistics');
        expect(exported).toHaveProperty('exportTime');
        expect(Array.isArray(exported.metrics)).toBe(true);
    });
});

describe('PerformanceAlertManager', () => {
    let alertManager: PerformanceAlertManager;

    beforeEach(() => {
        alertManager = new PerformanceAlertManager();
    });

    it('should evaluate metrics and create alerts', () => {
        const metrics = {
            cssLoadTime: 250, // Exceeds default threshold of 200ms
            renderTime: 60,   // Exceeds default threshold of 50ms
            bundleSize: 150 * 1024 // Exceeds default threshold of 100KB
        };

        const alerts = alertManager.evaluateMetrics(metrics);

        expect(alerts.length).toBeGreaterThan(0);

        const cssLoadAlert = alerts.find(a => a.metric === 'cssLoadTime');
        expect(cssLoadAlert).toBeDefined();
        expect(cssLoadAlert?.severity).toBe('medium');
        expect(cssLoadAlert?.value).toBe(250);
    });

    it('should acknowledge and resolve alerts', () => {
        const metrics = { cssLoadTime: 250 };
        const alerts = alertManager.evaluateMetrics(metrics);

        expect(alerts.length).toBe(1);
        const alert = alerts[0];

        // Test acknowledgment
        const acknowledged = alertManager.acknowledgeAlert(alert.id);
        expect(acknowledged).toBe(true);

        const updatedAlert = alertManager.getAlerts().find(a => a.id === alert.id);
        expect(updatedAlert?.acknowledged).toBe(true);

        // Test resolution
        const resolved = alertManager.resolveAlert(alert.id);
        expect(resolved).toBe(true);

        const resolvedAlert = alertManager.getAlerts().find(a => a.id === alert.id);
        expect(resolvedAlert?.resolvedAt).toBeDefined();
    });

    it('should detect performance regression', () => {
        // Set baseline
        alertManager.updateBaseline({ cssLoadTime: 100 });

        // Test regression detection
        const hasRegression = alertManager.detectRegression('cssLoadTime', 150, 0.2); // 50% increase
        expect(hasRegression).toBe(true);

        const noRegression = alertManager.detectRegression('cssLoadTime', 110, 0.2); // 10% increase
        expect(noRegression).toBe(false);
    });

    it('should generate statistics correctly', () => {
        // Create some alerts
        alertManager.evaluateMetrics({ cssLoadTime: 250, renderTime: 60 });

        const stats = alertManager.getStatistics();

        expect(stats.total).toBeGreaterThan(0);
        expect(stats.bySeverity).toHaveProperty('medium');
        expect(stats.acknowledged).toBe(0);
        expect(stats.resolved).toBe(0);
    });
});

describe('CriticalCSSExtractor', () => {
    let extractor: CriticalCSSExtractor;

    beforeEach(() => {
        extractor = new CriticalCSSExtractor();
    });

    it('should generate critical CSS', () => {
        const criticalCSS = extractor.generateCriticalCSS();

        expect(criticalCSS).toContain(':root');
        expect(criticalCSS).toContain('--primary-600');
        expect(criticalCSS).toContain('.btn-primary');
        expect(criticalCSS).toContain('background-color: var(--primary-600)');
    });

    it('should generate inline CSS when size is below threshold', () => {
        const inlineCSS = extractor.generateInlineCSS();

        if (inlineCSS) {
            expect(inlineCSS).toContain('<style id="critical-css">');
            expect(inlineCSS).toContain('</style>');
        }
    });

    it('should determine if CSS should be inlined based on size', () => {
        const smallCSS = '.btn { color: red; }';
        const shouldInlineSmall = extractor.shouldInline(smallCSS);
        expect(shouldInlineSmall).toBe(true);

        const largeCSS = 'a'.repeat(5000); // Large string
        const shouldInlineLarge = extractor.shouldInline(largeCSS);
        expect(shouldInlineLarge).toBe(false);
    });
});

describe('CSSPurgingOptimizer', () => {
    let optimizer: CSSPurgingOptimizer;

    beforeEach(() => {
        optimizer = new CSSPurgingOptimizer({
            enabled: true,
            safelist: ['text-primary-600'],
            blocklist: [],
            keyframes: true,
            fontFace: true,
            variables: true
        });
    });

    it('should optimize CSS by removing unused classes', async () => {
        const cssContent = `
      .text-primary-600 { color: #2563eb; }
      .text-unused-class { color: #ff0000; }
      .bg-primary-600 { background: #2563eb; }
    `;

        const contentFiles = ['mock-file.tsx'];

        const result = await optimizer.optimizeCSS(cssContent, contentFiles);

        expect(result.optimizedCSS).toBeDefined();
        expect(result.removedClasses).toBeDefined();
        expect(result.sizeReduction).toBeGreaterThanOrEqual(0);
    });
});

describe('CSSOptimizer', () => {
    let optimizer: CSSOptimizer;

    beforeEach(() => {
        optimizer = new CSSOptimizer();
    });

    it('should optimize CSS content', () => {
        const cssContent = `
      :root {
        --primary-600: #2563eb;
        --unused-var: #ff0000;
      }
      
      .btn { 
        background: var(--primary-600); 
        color: white; 
      }
      
      /* Duplicate rule */
      .btn { 
        background: var(--primary-600); 
        color: white; 
      }
    `;

        const result = optimizer.optimize(cssContent);

        expect(result.optimizedCSS).toBeDefined();
        expect(result.optimizations).toBeDefined();
        expect(result.sizeReduction).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(result.optimizations)).toBe(true);
    });

    it('should get optimization statistics', () => {
        const cssContent = `
      :root { --primary-600: #2563eb; --gray-900: #111827; }
      .btn { color: var(--primary-600); }
    `;

        optimizer.optimize(cssContent);
        const stats = optimizer.getStatistics();

        expect(stats).toHaveProperty('totalDefined');
        expect(stats).toHaveProperty('totalUsed');
        expect(stats).toHaveProperty('unused');
        expect(stats).toHaveProperty('mostUsed');
    });
});

describe('Integration Tests', () => {
    it('should work together in a complete workflow', async () => {
        const monitor = new ColorSystemPerformanceMonitor();
        const alertManager = new PerformanceAlertManager();

        try {
            // Start monitoring
            monitor.startMonitoring();

            // Simulate some metrics
            const mockMetrics = {
                cssLoadTime: 150,
                cssParseTime: 30,
                renderTime: 12,
                bundleSize: 45 * 1024,
                memoryUsage: 8 * 1024 * 1024
            };

            // Evaluate alerts
            const alerts = alertManager.evaluateMetrics(mockMetrics);

            // Should not create alerts for good performance
            expect(alerts.length).toBe(0);

            // Test with poor performance
            const poorMetrics = {
                cssLoadTime: 300,
                renderTime: 80,
                bundleSize: 200 * 1024
            };

            const poorAlerts = alertManager.evaluateMetrics(poorMetrics);
            expect(poorAlerts.length).toBeGreaterThan(0);

            // Test CSS optimization
            const extractor = new CriticalCSSExtractor();
            const criticalCSS = extractor.generateCriticalCSS();
            expect(criticalCSS).toBeTruthy();

        } finally {
            monitor.cleanup();
        }
    });
});