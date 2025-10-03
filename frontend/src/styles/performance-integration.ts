/**
 * Performance monitoring integration for color system
 * Integrates all performance monitoring components and provides unified API
 */

import { useState, useEffect } from 'react';
import { ColorSystemPerformanceMonitor, getGlobalPerformanceMonitor } from './performance-monitor';
import { PerformanceAlertManager, getGlobalAlertManager } from './performance-alerts';
import { CriticalCSSExtractor } from './critical-css';
import { CSSPurgingOptimizer } from './css-purging';
import { CSSOptimizer } from './css-optimization';

export interface PerformanceReport {
    timestamp: string;
    metrics: {
        cssLoadTime: number;
        cssParseTime: number;
        renderTime: number;
        bundleSize: number;
        memoryUsage: number;
        colorVariableCount: number;
        unusedColorClasses: number;
    };
    optimization: {
        criticalCSSSize: number;
        purgingReduction: number;
        optimizationReduction: number;
    };
    alerts: {
        total: number;
        bySeverity: Record<string, number>;
        recent: number;
    };
    recommendations: string[];
}

/**
 * Unified performance monitoring system
 */
export class ColorSystemPerformanceIntegration {
    private monitor: ColorSystemPerformanceMonitor;
    private alertManager: PerformanceAlertManager;
    private criticalExtractor: CriticalCSSExtractor;
    private purgingOptimizer: CSSPurgingOptimizer;
    private cssOptimizer: CSSOptimizer;
    private isInitialized: boolean = false;

    constructor() {
        this.monitor = getGlobalPerformanceMonitor();
        this.alertManager = getGlobalAlertManager();
        this.criticalExtractor = new CriticalCSSExtractor();
        this.purgingOptimizer = new CSSPurgingOptimizer();
        this.cssOptimizer = new CSSOptimizer();
    }

    /**
     * Initializes the performance monitoring system
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) return;

        try {
            // Start performance monitoring
            this.monitor.startMonitoring();

            // Set up alert listeners
            this.setupAlertIntegration();

            // Initialize baseline metrics
            await this.establishBaseline();

            this.isInitialized = true;
            console.log('🚀 Color system performance monitoring initialized');

        } catch (error) {
            console.error('Failed to initialize performance monitoring:', error);
            throw error;
        }
    }

    /**
     * Sets up integration between monitor and alert manager
     */
    private setupAlertIntegration(): void {
        // Listen for performance events and evaluate alerts
        if (typeof window !== 'undefined') {
            window.addEventListener('colorSystemPerformanceAlert', (event: Event) => {
                const customEvent = event as CustomEvent;
                const { alerts } = customEvent.detail;
                console.log('Performance alert triggered:', alerts);
            });
        }
    }

    /**
     * Establishes baseline performance metrics
     */
    private async establishBaseline(): Promise<void> {
        try {
            // Measure initial CSS variable usage
            const cssStats = await this.monitor.measureCSSVariableUsage();

            // Update baseline for regression detection
            this.alertManager.updateBaseline({
                colorVariableCount: cssStats.count,
                unusedColorClasses: cssStats.unusedCount
            });

            console.log('📊 Performance baseline established:', cssStats);

        } catch (error) {
            console.warn('Failed to establish baseline:', error);
        }
    }

    /**
     * Generates comprehensive performance report
     */
    async generateReport(): Promise<PerformanceReport> {
        const statistics = this.monitor.getStatistics();
        const alertStats = this.alertManager.getStatistics();
        const cssStats = await this.monitor.measureCSSVariableUsage();

        // Generate optimization metrics
        const criticalCSS = this.criticalExtractor.generateCriticalCSS();
        const criticalCSSSize = new Blob([criticalCSS]).size;

        // Simulate optimization results (in real implementation, would use actual CSS)
        const mockCSS = ':root { --primary-600: #2563eb; } .btn { color: var(--primary-600); }';
        const purgingResult = await this.purgingOptimizer.optimizeCSS(mockCSS, []);
        const optimizationResult = this.cssOptimizer.optimize(purgingResult.optimizedCSS);

        const report: PerformanceReport = {
            timestamp: new Date().toISOString(),
            metrics: {
                cssLoadTime: statistics.latest?.cssLoadTime || 0,
                cssParseTime: statistics.latest?.cssParseTime || 0,
                renderTime: statistics.latest?.renderTime || 0,
                bundleSize: statistics.latest?.bundleSize || 0,
                memoryUsage: statistics.latest?.memoryUsage || 0,
                colorVariableCount: cssStats.count,
                unusedColorClasses: cssStats.unusedCount
            },
            optimization: {
                criticalCSSSize,
                purgingReduction: purgingResult.sizeReduction,
                optimizationReduction: optimizationResult.sizeReduction
            },
            alerts: {
                total: alertStats.total,
                bySeverity: alertStats.bySeverity,
                recent: alertStats.recent
            },
            recommendations: this.generateRecommendations(statistics, alertStats, cssStats)
        };

        return report;
    }

    /**
     * Generates performance recommendations based on current metrics
     */
    private generateRecommendations(
        statistics: any,
        alertStats: any,
        cssStats: { count: number; unusedCount: number }
    ): string[] {
        const recommendations: string[] = [];

        // CSS Load Time recommendations
        if (statistics.averages?.cssLoadTime > 100) {
            recommendations.push('Consider implementing critical CSS inlining to reduce CSS load time');
            recommendations.push('Enable CSS compression and minification in production');
        }

        // Bundle Size recommendations
        if (statistics.averages?.bundleSize > 50 * 1024) {
            recommendations.push('CSS bundle size is large - consider CSS purging to remove unused styles');
            recommendations.push('Split CSS into critical and non-critical parts for better loading performance');
        }

        // Memory Usage recommendations
        if (statistics.averages?.memoryUsage > 10 * 1024 * 1024) {
            recommendations.push('High memory usage detected - review CSS custom property usage');
            recommendations.push('Consider reducing the number of CSS variables or optimizing their usage');
        }

        // CSS Variables recommendations
        if (cssStats.unusedCount > 20) {
            recommendations.push(`${cssStats.unusedCount} unused CSS variables detected - consider removing them`);
        }

        if (cssStats.count > 200) {
            recommendations.push('Large number of CSS variables - consider grouping or reducing complexity');
        }

        // Alert-based recommendations
        if (alertStats.recent > 5) {
            recommendations.push('Multiple recent performance alerts - investigate potential performance regression');
        }

        if (alertStats.bySeverity.critical > 0) {
            recommendations.push('Critical performance issues detected - immediate attention required');
        }

        // Render Time recommendations
        if (statistics.averages?.renderTime > 16) {
            recommendations.push('Render time exceeds 60fps target - optimize CSS animations and transitions');
            recommendations.push('Consider using CSS containment for better rendering performance');
        }

        // General recommendations
        if (recommendations.length === 0) {
            recommendations.push('Performance metrics look good - continue monitoring for any regressions');
        }

        return recommendations;
    }

    /**
     * Runs performance optimization analysis
     */
    async runOptimizationAnalysis(): Promise<{
        currentSize: number;
        optimizedSize: number;
        reduction: number;
        recommendations: string[];
    }> {
        // Simulate current CSS size (in real implementation, would analyze actual CSS files)
        const currentCSS = this.generateMockCSS();
        const currentSize = new Blob([currentCSS]).size;

        // Run optimization pipeline
        const purgingResult = await this.purgingOptimizer.optimizeCSS(currentCSS, []);
        const optimizationResult = this.cssOptimizer.optimize(purgingResult.optimizedCSS);

        const optimizedSize = new Blob([optimizationResult.optimizedCSS]).size;
        const reduction = ((currentSize - optimizedSize) / currentSize) * 100;

        const recommendations = [
            ...purgingResult.removedClasses.length > 0 ? [`Removed ${purgingResult.removedClasses.length} unused CSS classes`] : [],
            ...optimizationResult.optimizations,
            reduction > 20 ? 'Significant size reduction achieved - consider applying these optimizations' : 'Moderate optimization gains available'
        ];

        return {
            currentSize,
            optimizedSize,
            reduction,
            recommendations
        };
    }

    /**
     * Generates mock CSS for analysis (replace with actual CSS reading in real implementation)
     */
    private generateMockCSS(): string {
        return `
      :root {
        --primary-50: #eff6ff;
        --primary-100: #dbeafe;
        --primary-600: #2563eb;
        --primary-700: #1d4ed8;
        --gray-50: #f9fafb;
        --gray-100: #f3f4f6;
        --gray-600: #4b5563;
        --gray-900: #111827;
        --success-600: #059669;
        --warning-600: #d97706;
        --error-600: #dc2626;
      }
      
      .btn-primary { background: var(--primary-600); color: white; }
      .btn-secondary { background: var(--gray-100); color: var(--gray-600); }
      .text-primary { color: var(--primary-600); }
      .text-gray-900 { color: var(--gray-900); }
      .bg-gray-50 { background: var(--gray-50); }
      
      /* Unused classes for testing purging */
      .unused-class-1 { color: red; }
      .unused-class-2 { background: blue; }
    `;
    }

    /**
     * Exports comprehensive performance data
     */
    async exportPerformanceData(): Promise<{
        report: PerformanceReport;
        rawMetrics: any;
        alerts: any[];
        optimization: any;
    }> {
        const report = await this.generateReport();
        const rawMetrics = this.monitor.exportMetrics();
        const alerts = this.alertManager.getAlerts();
        const optimization = await this.runOptimizationAnalysis();

        return {
            report,
            rawMetrics,
            alerts,
            optimization
        };
    }

    /**
     * Cleans up performance monitoring
     */
    cleanup(): void {
        if (this.isInitialized) {
            this.monitor.cleanup();
            this.alertManager.clearAlerts();
            this.isInitialized = false;
            console.log('🧹 Performance monitoring cleaned up');
        }
    }

    /**
     * Gets current performance status
     */
    getStatus(): {
        isMonitoring: boolean;
        alertCount: number;
        lastMetricTime: number | null;
        recommendations: number;
    } {
        const statistics = this.monitor.getStatistics();
        const alertStats = this.alertManager.getStatistics();

        return {
            isMonitoring: this.isInitialized,
            alertCount: alertStats.total,
            lastMetricTime: statistics.latest?.timestamp || null,
            recommendations: 0 // Will be calculated when report is generated
        };
    }
}

/**
 * Global performance integration instance
 */
let globalIntegration: ColorSystemPerformanceIntegration | null = null;

export function getGlobalPerformanceIntegration(): ColorSystemPerformanceIntegration {
    if (!globalIntegration) {
        globalIntegration = new ColorSystemPerformanceIntegration();
    }
    return globalIntegration;
}

/**
 * Initializes global performance monitoring
 */
export async function initializeGlobalPerformanceMonitoring(): Promise<void> {
    const integration = getGlobalPerformanceIntegration();
    await integration.initialize();
}

/**
 * React hook for performance integration
 */
export function usePerformanceIntegration() {
    const [integration] = useState(() => getGlobalPerformanceIntegration());
    const [status, setStatus] = useState(integration.getStatus());
    const [report, setReport] = useState<PerformanceReport | null>(null);

    useEffect(() => {
        // Initialize on mount
        integration.initialize().catch(console.error);

        // Update status periodically
        const interval = setInterval(() => {
            setStatus(integration.getStatus());
        }, 5000);

        return () => {
            clearInterval(interval);
        };
    }, [integration]);

    const generateReport = async () => {
        try {
            const newReport = await integration.generateReport();
            setReport(newReport);
            return newReport;
        } catch (error) {
            console.error('Failed to generate performance report:', error);
            throw error;
        }
    };

    const exportData = async () => {
        try {
            const data = await integration.exportPerformanceData();

            // Create and download file
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `color-system-performance-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            return data;
        } catch (error) {
            console.error('Failed to export performance data:', error);
            throw error;
        }
    };

    return {
        integration,
        status,
        report,
        generateReport,
        exportData,
        cleanup: () => integration.cleanup()
    };
}

// Auto-initialize in development mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    initializeGlobalPerformanceMonitoring().catch(console.error);
}