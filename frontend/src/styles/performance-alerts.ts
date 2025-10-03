/**
 * Performance alert system for color system monitoring
 * Creates alerts for performance regression in color system updates
 */

import { useState, useEffect } from 'react';

export interface AlertRule {
    id: string;
    name: string;
    metric: string;
    threshold: number;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    description: string;
}

export interface Alert {
    id: string;
    ruleId: string;
    ruleName: string;
    metric: string;
    value: number;
    threshold: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: number;
    acknowledged: boolean;
    resolvedAt?: number;
}

export interface AlertConfig {
    enabled: boolean;
    rules: AlertRule[];
    notifications: {
        console: boolean;
        browser: boolean;
        webhook?: string;
    };
    retention: {
        maxAlerts: number;
        maxAge: number; // milliseconds
    };
}

export const DEFAULT_ALERT_RULES: AlertRule[] = [
    {
        id: 'css-load-time-high',
        name: 'High CSS Load Time',
        metric: 'cssLoadTime',
        threshold: 200,
        operator: 'gt',
        severity: 'medium',
        enabled: true,
        description: 'CSS files are taking too long to load'
    },
    {
        id: 'css-parse-time-high',
        name: 'High CSS Parse Time',
        metric: 'cssParseTime',
        threshold: 100,
        operator: 'gt',
        severity: 'medium',
        enabled: true,
        description: 'CSS parsing is taking too long'
    },
    {
        id: 'render-time-critical',
        name: 'Critical Render Time',
        metric: 'renderTime',
        threshold: 50,
        operator: 'gt',
        severity: 'high',
        enabled: true,
        description: 'Rendering performance is severely degraded'
    },
    {
        id: 'bundle-size-large',
        name: 'Large CSS Bundle',
        metric: 'bundleSize',
        threshold: 100 * 1024, // 100KB
        operator: 'gt',
        severity: 'medium',
        enabled: true,
        description: 'CSS bundle size is larger than recommended'
    },
    {
        id: 'memory-usage-high',
        name: 'High Memory Usage',
        metric: 'memoryUsage',
        threshold: 50 * 1024 * 1024, // 50MB
        operator: 'gt',
        severity: 'high',
        enabled: true,
        description: 'Memory usage is higher than expected'
    },
    {
        id: 'unused-variables-high',
        name: 'Too Many Unused Variables',
        metric: 'unusedColorClasses',
        threshold: 50,
        operator: 'gt',
        severity: 'low',
        enabled: true,
        description: 'High number of unused CSS variables detected'
    }
];

export const DEFAULT_ALERT_CONFIG: AlertConfig = {
    enabled: true,
    rules: DEFAULT_ALERT_RULES,
    notifications: {
        console: true,
        browser: true
    },
    retention: {
        maxAlerts: 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
};

/**
 * Performance alert manager
 */
export class PerformanceAlertManager {
    private config: AlertConfig;
    private alerts: Alert[] = [];
    private listeners: ((alert: Alert) => void)[] = [];
    private regressionBaseline: Map<string, number> = new Map();

    constructor(config: AlertConfig = DEFAULT_ALERT_CONFIG) {
        this.config = config;
        this.loadPersistedAlerts();
        this.setupBrowserNotifications();
    }

    /**
     * Evaluates metrics against alert rules
     */
    evaluateMetrics(metrics: Record<string, number>): Alert[] {
        if (!this.config.enabled) return [];

        const newAlerts: Alert[] = [];

        for (const rule of this.config.rules) {
            if (!rule.enabled || !(rule.metric in metrics)) continue;

            const value = metrics[rule.metric];
            const shouldAlert = this.evaluateRule(rule, value);

            if (shouldAlert) {
                const alert = this.createAlert(rule, value);
                newAlerts.push(alert);
                this.addAlert(alert);
            }
        }

        return newAlerts;
    }

    /**
     * Evaluates a single rule against a value
     */
    private evaluateRule(rule: AlertRule, value: number): boolean {
        switch (rule.operator) {
            case 'gt': return value > rule.threshold;
            case 'gte': return value >= rule.threshold;
            case 'lt': return value < rule.threshold;
            case 'lte': return value <= rule.threshold;
            case 'eq': return value === rule.threshold;
            default: return false;
        }
    }

    /**
     * Creates an alert from a rule and value
     */
    private createAlert(rule: AlertRule, value: number): Alert {
        const alert: Alert = {
            id: `${rule.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ruleId: rule.id,
            ruleName: rule.name,
            metric: rule.metric,
            value,
            threshold: rule.threshold,
            severity: rule.severity,
            message: this.generateAlertMessage(rule, value),
            timestamp: Date.now(),
            acknowledged: false
        };

        return alert;
    }

    /**
     * Generates a human-readable alert message
     */
    private generateAlertMessage(rule: AlertRule, value: number): string {
        const formattedValue = this.formatMetricValue(rule.metric, value);
        const formattedThreshold = this.formatMetricValue(rule.metric, rule.threshold);

        return `${rule.description}. Current: ${formattedValue}, Threshold: ${formattedThreshold}`;
    }

    /**
     * Formats metric values for display
     */
    private formatMetricValue(metric: string, value: number): string {
        switch (metric) {
            case 'cssLoadTime':
            case 'cssParseTime':
            case 'renderTime':
                return `${value.toFixed(2)}ms`;
            case 'bundleSize':
            case 'memoryUsage':
                return this.formatBytes(value);
            default:
                return value.toString();
        }
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
     * Adds an alert to the collection
     */
    private addAlert(alert: Alert): void {
        this.alerts.unshift(alert);
        this.cleanupOldAlerts();
        this.persistAlerts();
        this.notifyAlert(alert);
        this.notifyListeners(alert);
    }

    /**
     * Sends notifications for an alert
     */
    private notifyAlert(alert: Alert): void {
        if (this.config.notifications.console) {
            this.logAlertToConsole(alert);
        }

        if (this.config.notifications.browser) {
            this.showBrowserNotification(alert);
        }

        if (this.config.notifications.webhook) {
            this.sendWebhookNotification(alert);
        }
    }

    /**
     * Logs alert to console with appropriate styling
     */
    private logAlertToConsole(alert: Alert): void {
        const styles = {
            low: 'color: #059669; background: #ecfdf5;',
            medium: 'color: #d97706; background: #fffbeb;',
            high: 'color: #dc2626; background: #fef2f2;',
            critical: 'color: #ffffff; background: #dc2626; font-weight: bold;'
        };

        console.log(
            `%c🚨 ${alert.severity.toUpperCase()} ALERT: ${alert.ruleName}`,
            styles[alert.severity],
            `\n${alert.message}\nTime: ${new Date(alert.timestamp).toLocaleString()}`
        );
    }

    /**
     * Shows browser notification
     */
    private async showBrowserNotification(alert: Alert): Promise<void> {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'default') {
            await Notification.requestPermission();
        }

        if (Notification.permission === 'granted') {
            const notification = new Notification(`Performance Alert: ${alert.ruleName}`, {
                body: alert.message,
                icon: this.getAlertIcon(alert.severity),
                tag: alert.ruleId,
                requireInteraction: alert.severity === 'critical'
            });

            notification.onclick = () => {
                window.focus();
                this.acknowledgeAlert(alert.id);
                notification.close();
            };

            // Auto-close after 10 seconds for non-critical alerts
            if (alert.severity !== 'critical') {
                setTimeout(() => notification.close(), 10000);
            }
        }
    }

    /**
     * Gets icon for alert severity
     */
    private getAlertIcon(severity: string): string {
        const icons = {
            low: '💡',
            medium: '⚠️',
            high: '🚨',
            critical: '🔥'
        };
        return icons[severity as keyof typeof icons] || '⚠️';
    }

    /**
     * Sends webhook notification
     */
    private async sendWebhookNotification(alert: Alert): Promise<void> {
        if (!this.config.notifications.webhook) return;

        try {
            await fetch(this.config.notifications.webhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'performance_alert',
                    alert,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Failed to send webhook notification:', error);
        }
    }

    /**
     * Sets up browser notification permissions
     */
    private setupBrowserNotifications(): void {
        if ('Notification' in window && Notification.permission === 'default') {
            // Request permission on first user interaction
            document.addEventListener('click', () => {
                Notification.requestPermission();
            }, { once: true });
        }
    }

    /**
     * Detects performance regression by comparing with baseline
     */
    detectRegression(metric: string, currentValue: number, threshold: number = 0.2): boolean {
        const baseline = this.regressionBaseline.get(metric);

        if (!baseline) {
            this.regressionBaseline.set(metric, currentValue);
            return false;
        }

        const regression = (currentValue - baseline) / baseline;
        return regression > threshold;
    }

    /**
     * Updates baseline values for regression detection
     */
    updateBaseline(metrics: Record<string, number>): void {
        for (const [metric, value] of Object.entries(metrics)) {
            this.regressionBaseline.set(metric, value);
        }
    }

    /**
     * Acknowledges an alert
     */
    acknowledgeAlert(alertId: string): boolean {
        const alert = this.alerts.find(a => a.id === alertId);

        if (alert && !alert.acknowledged) {
            alert.acknowledged = true;
            this.persistAlerts();
            return true;
        }

        return false;
    }

    /**
     * Resolves an alert
     */
    resolveAlert(alertId: string): boolean {
        const alert = this.alerts.find(a => a.id === alertId);

        if (alert && !alert.resolvedAt) {
            alert.resolvedAt = Date.now();
            alert.acknowledged = true;
            this.persistAlerts();
            return true;
        }

        return false;
    }

    /**
     * Gets all alerts with optional filtering
     */
    getAlerts(filter?: {
        severity?: string;
        acknowledged?: boolean;
        resolved?: boolean;
        since?: number;
    }): Alert[] {
        let filtered = [...this.alerts];

        if (filter) {
            if (filter.severity) {
                filtered = filtered.filter(a => a.severity === filter.severity);
            }

            if (filter.acknowledged !== undefined) {
                filtered = filtered.filter(a => a.acknowledged === filter.acknowledged);
            }

            if (filter.resolved !== undefined) {
                const hasResolved = (a: Alert) => !!a.resolvedAt;
                filtered = filtered.filter(a => hasResolved(a) === filter.resolved);
            }

            if (filter.since !== undefined) {
                filtered = filtered.filter(a => a.timestamp >= filter.since!);
            }
        }

        return filtered;
    }

    /**
     * Gets alert statistics
     */
    getStatistics(): {
        total: number;
        bySeverity: Record<string, number>;
        acknowledged: number;
        resolved: number;
        recent: number; // last 24 hours
    } {
        const now = Date.now();
        const dayAgo = now - (24 * 60 * 60 * 1000);

        const bySeverity = this.alerts.reduce((acc, alert) => {
            acc[alert.severity] = (acc[alert.severity] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total: this.alerts.length,
            bySeverity,
            acknowledged: this.alerts.filter(a => a.acknowledged).length,
            resolved: this.alerts.filter(a => a.resolvedAt).length,
            recent: this.alerts.filter(a => a.timestamp >= dayAgo).length
        };
    }

    /**
     * Adds alert listener
     */
    addListener(listener: (alert: Alert) => void): void {
        this.listeners.push(listener);
    }

    /**
     * Removes alert listener
     */
    removeListener(listener: (alert: Alert) => void): void {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Notifies all listeners of new alert
     */
    private notifyListeners(alert: Alert): void {
        this.listeners.forEach(listener => {
            try {
                listener(alert);
            } catch (error) {
                console.error('Alert listener error:', error);
            }
        });
    }

    /**
     * Cleans up old alerts based on retention policy
     */
    private cleanupOldAlerts(): void {
        const { maxAlerts, maxAge } = this.config.retention;
        const cutoffTime = Date.now() - maxAge;

        // Remove alerts older than maxAge
        this.alerts = this.alerts.filter(alert => alert.timestamp >= cutoffTime);

        // Keep only the most recent maxAlerts
        if (this.alerts.length > maxAlerts) {
            this.alerts = this.alerts.slice(0, maxAlerts);
        }
    }

    /**
     * Persists alerts to localStorage
     */
    private persistAlerts(): void {
        try {
            localStorage.setItem('colorSystemAlerts', JSON.stringify(this.alerts));
        } catch (error) {
            console.warn('Failed to persist alerts:', error);
        }
    }

    /**
     * Loads persisted alerts from localStorage
     */
    private loadPersistedAlerts(): void {
        try {
            const stored = localStorage.getItem('colorSystemAlerts');
            if (stored) {
                this.alerts = JSON.parse(stored);
                this.cleanupOldAlerts();
            }
        } catch (error) {
            console.warn('Failed to load persisted alerts:', error);
            this.alerts = [];
        }
    }

    /**
     * Clears all alerts
     */
    clearAlerts(): void {
        this.alerts = [];
        this.persistAlerts();
    }

    /**
     * Updates alert configuration
     */
    updateConfig(newConfig: Partial<AlertConfig>): void {
        this.config = { ...this.config, ...newConfig };
    }
}

/**
 * Global alert manager instance
 */
let globalAlertManager: PerformanceAlertManager | null = null;

export function getGlobalAlertManager(): PerformanceAlertManager {
    if (!globalAlertManager) {
        globalAlertManager = new PerformanceAlertManager();
    }
    return globalAlertManager;
}

/**
 * React hook for performance alerts
 */
export function usePerformanceAlerts() {
    const [alertManager] = useState(() => getGlobalAlertManager());
    const [alerts, setAlerts] = useState(alertManager.getAlerts());
    const [statistics, setStatistics] = useState(alertManager.getStatistics());

    useEffect(() => {
        const updateAlerts = () => {
            setAlerts(alertManager.getAlerts());
            setStatistics(alertManager.getStatistics());
        };

        const listener = () => updateAlerts();
        alertManager.addListener(listener);

        return () => {
            alertManager.removeListener(listener);
        };
    }, [alertManager]);

    return {
        alerts,
        statistics,
        acknowledgeAlert: (id: string) => {
            alertManager.acknowledgeAlert(id);
            setAlerts(alertManager.getAlerts());
            setStatistics(alertManager.getStatistics());
        },
        resolveAlert: (id: string) => {
            alertManager.resolveAlert(id);
            setAlerts(alertManager.getAlerts());
            setStatistics(alertManager.getStatistics());
        },
        clearAlerts: () => {
            alertManager.clearAlerts();
            setAlerts([]);
            setStatistics(alertManager.getStatistics());
        }
    };
}