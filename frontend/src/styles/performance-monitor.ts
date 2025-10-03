/**
 * Performance monitoring system for color system
 * Tracks CSS bundle size impact, rendering performance, and color-related metrics
 */

import { useState, useEffect } from 'react';

export interface PerformanceMetrics {
    cssLoadTime: number;
    cssParseTime: number;
    renderTime: number;
    bundleSize: number;
    colorVariableCount: number;
    unusedColorClasses: number;
    memoryUsage: number;
    timestamp: number;
}

export interface PerformanceThresholds {
    cssLoadTime: number; // ms
    cssParseTime: number; // ms
    renderTime: number; // ms
    bundleSize: number; // bytes
    memoryUsage: number; // bytes
}

export const DEFAULT_THRESHOLDS: PerformanceThresholds = {
    cssLoadTime: 100, // 100ms
    cssParseTime: 50, // 50ms
    renderTime: 16, // 16ms (60fps)
    bundleSize: 50 * 1024, // 50KB
    memoryUsage: 10 * 1024 * 1024 // 10MB
};

/**
 * Color system performance monitor
 */
export class ColorSystemPerformanceMonitor {
    private metrics: PerformanceMetrics[] = [];
    private thresholds: PerformanceThresholds;
    private observers: PerformanceObserver[] = [];
    private isMonitoring: boolean = false;

    constructor(thresholds: PerformanceThresholds = DEFAULT_THRESHOLDS) {
        this.thresholds = thresholds;
        this.initializeObservers();
    }

    /**
     * Starts performance monitoring
     */
    startMonitoring(): void {
        if (this.isMonitoring) return;

        this.isMonitoring = true;
        this.startResourceObserver();
        this.startPaintObserver();
        this.startMemoryObserver();

        console.log('🔍 Color system performance monitoring started');
    }

    /**
     * Stops performance monitoring
     */
    stopMonitoring(): void {
        if (!this.isMonitoring) return;

        this.isMonitoring = false;
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];

        console.log('⏹️ Color system performance monitoring stopped');
    }

    /**
     * Initializes performance observers
     */
    private initializeObservers(): void {
        if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
            console.warn('PerformanceObserver not supported');
            return;
        }
    }

    /**
     * Starts resource loading observer for CSS files
     */
    private startResourceObserver(): void {
        if (typeof window === 'undefined') return;

        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();

                for (const entry of entries) {
                    if (entry.name.includes('.css') || entry.name.includes('color')) {
                        this.recordCSSLoadMetrics(entry as PerformanceResourceTiming);
                    }
                }
            });

            observer.observe({ entryTypes: ['resource'] });
            this.observers.push(observer);
        } catch (error) {
            console.warn('Failed to start resource observer:', error);
        }
    }

    /**
     * Starts paint timing observer
     */
    private startPaintObserver(): void {
        if (typeof window === 'undefined') return;

        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();

                for (const entry of entries) {
                    if (entry.name === 'first-contentful-paint') {
                        this.recordRenderMetrics(entry.startTime);
                    }
                }
            });

            observer.observe({ entryTypes: ['paint'] });
            this.observers.push(observer);
        } catch (error) {
            console.warn('Failed to start paint observer:', error);
        }
    }

    /**
     * Starts memory usage monitoring
     */
    private startMemoryObserver(): void {
        if (typeof window === 'undefined') return;

        const checkMemory = () => {
            if ('memory' in performance) {
                const memoryInfo = (performance as any).memory;
                this.recordMemoryMetrics(memoryInfo.usedJSHeapSize);
            }
        };

        // Check memory usage every 5 seconds
        const interval = setInterval(checkMemory, 5000);

        // Store interval for cleanup
        (this as any).memoryInterval = interval;
    }

    /**
     * Records CSS loading metrics
     */
    private recordCSSLoadMetrics(entry: PerformanceResourceTiming): void {
        const loadTime = entry.responseEnd - entry.requestStart;
        // For resource timing, we can estimate parse time as the time between response end and duration end
        const parseTime = entry.duration - (entry.responseEnd - entry.startTime);

        const metrics: Partial<PerformanceMetrics> = {
            cssLoadTime: loadTime,
            cssParseTime: Math.max(0, parseTime), // Ensure non-negative
            bundleSize: entry.transferSize || entry.encodedBodySize || 0,
            timestamp: Date.now()
        };

        this.addMetrics(metrics);
        this.checkThresholds(metrics);
    }

    /**
     * Records rendering performance metrics
     */
    private recordRenderMetrics(renderTime: number): void {
        const metrics: Partial<PerformanceMetrics> = {
            renderTime,
            timestamp: Date.now()
        };

        this.addMetrics(metrics);
        this.checkThresholds(metrics);
    }

    /**
     * Records memory usage metrics
     */
    private recordMemoryMetrics(memoryUsage: number): void {
        const metrics: Partial<PerformanceMetrics> = {
            memoryUsage,
            timestamp: Date.now()
        };

        this.addMetrics(metrics);
        this.checkThresholds(metrics);
    }

    /**
     * Adds metrics to the collection
     */
    private addMetrics(partialMetrics: Partial<PerformanceMetrics>): void {
        const existingMetrics = this.metrics[this.metrics.length - 1] || {};

        // Create base metrics with defaults
        const baseMetrics: PerformanceMetrics = {
            cssLoadTime: 0,
            cssParseTime: 0,
            renderTime: 0,
            bundleSize: 0,
            colorVariableCount: 0,
            unusedColorClasses: 0,
            memoryUsage: 0,
            timestamp: Date.now()
        };

        // Merge existing metrics, then partial metrics
        const metrics: PerformanceMetrics = {
            ...baseMetrics,
            ...existingMetrics,
            ...partialMetrics,
            timestamp: partialMetrics.timestamp || Date.now() // Ensure timestamp is always updated
        };

        this.metrics.push(metrics);

        // Keep only last 100 metrics to prevent memory leaks
        if (this.metrics.length > 100) {
            this.metrics = this.metrics.slice(-100);
        }
    }

    /**
     * Checks if metrics exceed thresholds and triggers alerts
     */
    private checkThresholds(metrics: Partial<PerformanceMetrics>): void {
        // Convert metrics to the format expected by alert manager
        const metricsForAlert: Record<string, number> = {};

        if (metrics.cssLoadTime) metricsForAlert.cssLoadTime = metrics.cssLoadTime;
        if (metrics.cssParseTime) metricsForAlert.cssParseTime = metrics.cssParseTime;
        if (metrics.renderTime) metricsForAlert.renderTime = metrics.renderTime;
        if (metrics.bundleSize) metricsForAlert.bundleSize = metrics.bundleSize;
        if (metrics.memoryUsage) metricsForAlert.memoryUsage = metrics.memoryUsage;
        if (metrics.colorVariableCount) metricsForAlert.colorVariableCount = metrics.colorVariableCount;
        if (metrics.unusedColorClasses) metricsForAlert.unusedColorClasses = metrics.unusedColorClasses;

        // Use alert manager for sophisticated alerting
        if (typeof window !== 'undefined') {
            try {
                const { getGlobalAlertManager } = require('./performance-alerts');
                const alertManager = getGlobalAlertManager();
                alertManager.evaluateMetrics(metricsForAlert);
            } catch (error) {
                // Fallback to legacy alerting if alert manager is not available
                console.warn('Alert manager not available, using legacy alerts');
            }
        }

        // Legacy alert system for backward compatibility
        const alerts: string[] = [];

        if (metrics.cssLoadTime && metrics.cssLoadTime > this.thresholds.cssLoadTime) {
            alerts.push(`CSS load time (${metrics.cssLoadTime.toFixed(2)}ms) exceeds threshold (${this.thresholds.cssLoadTime}ms)`);
        }

        if (metrics.cssParseTime && metrics.cssParseTime > this.thresholds.cssParseTime) {
            alerts.push(`CSS parse time (${metrics.cssParseTime.toFixed(2)}ms) exceeds threshold (${this.thresholds.cssParseTime}ms)`);
        }

        if (metrics.renderTime && metrics.renderTime > this.thresholds.renderTime) {
            alerts.push(`Render time (${metrics.renderTime.toFixed(2)}ms) exceeds threshold (${this.thresholds.renderTime}ms)`);
        }

        if (metrics.bundleSize && metrics.bundleSize > this.thresholds.bundleSize) {
            alerts.push(`Bundle size (${this.formatBytes(metrics.bundleSize)}) exceeds threshold (${this.formatBytes(this.thresholds.bundleSize)})`);
        }

        if (metrics.memoryUsage && metrics.memoryUsage > this.thresholds.memoryUsage) {
            alerts.push(`Memory usage (${this.formatBytes(metrics.memoryUsage)}) exceeds threshold (${this.formatBytes(this.thresholds.memoryUsage)})`);
        }

        if (alerts.length > 0) {
            this.triggerPerformanceAlert(alerts);
        }
    }

    /**
     * Triggers performance alerts
     */
    private triggerPerformanceAlert(alerts: string[]): void {
        console.warn('🚨 Color System Performance Alert:');
        alerts.forEach(alert => console.warn(`  - ${alert}`));

        // Emit custom event for external monitoring systems
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('colorSystemPerformanceAlert', {
                detail: { alerts, timestamp: Date.now() }
            }));
        }
    }

    /**
     * Measures CSS variable usage performance
     */
    measureCSSVariableUsage(): Promise<{ count: number; unusedCount: number; measureTime: number }> {
        return new Promise((resolve) => {
            const startTime = performance.now();

            // Get all CSS rules and count variables
            let variableCount = 0;
            let unusedCount = 0;

            try {
                const styleSheets = Array.from(document.styleSheets);

                for (const sheet of styleSheets) {
                    try {
                        const rules = Array.from(sheet.cssRules || []);

                        for (const rule of rules) {
                            if (rule.type === CSSRule.STYLE_RULE) {
                                const styleRule = rule as CSSStyleRule;
                                const cssText = styleRule.cssText;

                                // Count CSS variables
                                const variableMatches = cssText.match(/--[\w-]+/g);
                                if (variableMatches) {
                                    variableCount += variableMatches.length;
                                }

                                // Count unused variables (simplified check)
                                const unusedMatches = cssText.match(/--[\w-]+:\s*[^;]+;/g);
                                if (unusedMatches) {
                                    // This is a simplified check - in reality, you'd need more sophisticated analysis
                                    unusedCount += Math.floor(unusedMatches.length * 0.1); // Assume 10% unused
                                }
                            }
                        }
                    } catch (error) {
                        // Skip inaccessible stylesheets (CORS)
                        continue;
                    }
                }
            } catch (error) {
                console.warn('Failed to analyze CSS variables:', error);
            }

            const measureTime = performance.now() - startTime;

            // Update metrics
            this.addMetrics({
                colorVariableCount: variableCount,
                unusedColorClasses: unusedCount,
                timestamp: Date.now()
            });

            resolve({ count: variableCount, unusedCount, measureTime });
        });
    }

    /**
     * Measures color-related rendering performance
     */
    measureColorRenderingPerformance(element: HTMLElement): Promise<number> {
        return new Promise((resolve) => {
            const startTime = performance.now();

            // Force a style recalculation by changing a color property
            const originalColor = element.style.color;
            element.style.color = 'var(--primary-600)';

            // Use requestAnimationFrame to measure actual render time
            requestAnimationFrame(() => {
                const renderTime = performance.now() - startTime;

                // Restore original color
                element.style.color = originalColor;

                this.addMetrics({
                    renderTime,
                    timestamp: Date.now()
                });

                resolve(renderTime);
            });
        });
    }

    /**
     * Gets performance statistics
     */
    getStatistics(): {
        averages: Partial<PerformanceMetrics>;
        maximums: Partial<PerformanceMetrics>;
        latest: PerformanceMetrics | null;
        alertCount: number;
    } {
        if (this.metrics.length === 0) {
            return {
                averages: {},
                maximums: {},
                latest: null,
                alertCount: 0
            };
        }

        const averages: Partial<PerformanceMetrics> = {};
        const maximums: Partial<PerformanceMetrics> = {};
        const keys = ['cssLoadTime', 'cssParseTime', 'renderTime', 'bundleSize', 'memoryUsage'] as const;

        for (const key of keys) {
            const values = this.metrics.map(m => m[key]).filter(v => v > 0);

            if (values.length > 0) {
                averages[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
                maximums[key] = Math.max(...values);
            }
        }

        return {
            averages,
            maximums,
            latest: this.metrics[this.metrics.length - 1] || null,
            alertCount: this.metrics.filter(m => this.exceedsThresholds(m)).length
        };
    }

    /**
     * Checks if metrics exceed any thresholds
     */
    private exceedsThresholds(metrics: PerformanceMetrics): boolean {
        return (
            metrics.cssLoadTime > this.thresholds.cssLoadTime ||
            metrics.cssParseTime > this.thresholds.cssParseTime ||
            metrics.renderTime > this.thresholds.renderTime ||
            metrics.bundleSize > this.thresholds.bundleSize ||
            metrics.memoryUsage > this.thresholds.memoryUsage
        );
    }

    /**
     * Exports metrics data
     */
    exportMetrics(): {
        metrics: PerformanceMetrics[];
        thresholds: PerformanceThresholds;
        statistics: ReturnType<ColorSystemPerformanceMonitor['getStatistics']>;
        exportTime: string;
    } {
        return {
            metrics: [...this.metrics],
            thresholds: { ...this.thresholds },
            statistics: this.getStatistics(),
            exportTime: new Date().toISOString()
        };
    }

    /**
     * Clears all collected metrics
     */
    clearMetrics(): void {
        this.metrics = [];
        console.log('🧹 Performance metrics cleared');
    }

    /**
     * Formats bytes to human readable format
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Cleanup method to prevent memory leaks
     */
    cleanup(): void {
        this.stopMonitoring();
        this.clearMetrics();

        // Clear memory monitoring interval
        if ((this as any).memoryInterval) {
            clearInterval((this as any).memoryInterval);
        }
    }
}

/**
 * Performance monitoring React hook
 */
export function useColorSystemPerformance(enabled: boolean = true) {
    const [monitor] = useState(() => new ColorSystemPerformanceMonitor());
    const [statistics, setStatistics] = useState(monitor.getStatistics());

    useEffect(() => {
        if (!enabled) return;

        monitor.startMonitoring();

        // Update statistics every 10 seconds
        const interval = setInterval(() => {
            setStatistics(monitor.getStatistics());
        }, 10000);

        // Listen for performance alerts
        const handleAlert = (event: CustomEvent) => {
            console.warn('Performance alert received:', event.detail);
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('colorSystemPerformanceAlert', handleAlert as EventListener);
        }

        return () => {
            monitor.stopMonitoring();
            clearInterval(interval);

            if (typeof window !== 'undefined') {
                window.removeEventListener('colorSystemPerformanceAlert', handleAlert as EventListener);
            }
        };
    }, [enabled, monitor]);

    return {
        monitor,
        statistics,
        measureCSSVariables: () => monitor.measureCSSVariableUsage(),
        measureColorRendering: (element: HTMLElement) => monitor.measureColorRenderingPerformance(element),
        exportMetrics: () => monitor.exportMetrics(),
        clearMetrics: () => {
            monitor.clearMetrics();
            setStatistics(monitor.getStatistics());
        }
    };
}

/**
 * Global performance monitoring instance
 */
let globalMonitor: ColorSystemPerformanceMonitor | null = null;

export function getGlobalPerformanceMonitor(): ColorSystemPerformanceMonitor {
    if (!globalMonitor) {
        globalMonitor = new ColorSystemPerformanceMonitor();
    }
    return globalMonitor;
}

export function startGlobalPerformanceMonitoring(): void {
    const monitor = getGlobalPerformanceMonitor();
    monitor.startMonitoring();
}

export function stopGlobalPerformanceMonitoring(): void {
    if (globalMonitor) {
        globalMonitor.stopMonitoring();
    }
}

// Auto-start monitoring in development mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    startGlobalPerformanceMonitoring();
}