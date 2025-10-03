/**
 * Performance monitoring dashboard component
 * Displays real-time color system performance metrics
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  useColorSystemPerformance,
  ColorSystemPerformanceMonitor,
} from "./performance-monitor";

interface PerformanceDashboardProps {
  enabled?: boolean;
  compact?: boolean;
  className?: string;
}

export function PerformanceDashboard({
  enabled = true,
  compact = false,
  className = "",
}: PerformanceDashboardProps) {
  const {
    statistics,
    monitor,
    measureCSSVariables,
    exportMetrics,
    clearMetrics,
  } = useColorSystemPerformance(enabled);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [cssVariableStats, setCSSVariableStats] = useState<{
    count: number;
    unusedCount: number;
    measureTime: number;
  } | null>(null);

  const handleMeasureCSSVariables = async () => {
    try {
      const stats = await measureCSSVariables();
      setCSSVariableStats(stats);
    } catch (error) {
      console.error("Failed to measure CSS variables:", error);
    }
  };

  const handleExportMetrics = () => {
    const data = exportMetrics();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `color-system-performance-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!enabled) {
    return null;
  }

  const formatTime = (ms: number) => `${ms.toFixed(2)}ms`;
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusColor = (value: number, threshold: number) => {
    if (value > threshold * 1.5) return "text-error-600 bg-error-50";
    if (value > threshold) return "text-warning-600 bg-warning-50";
    return "text-success-600 bg-success-50";
  };

  return (
    <div
      className={`performance-dashboard bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-primary-600 rounded-full animate-pulse"></div>
          <h3 className="text-sm font-medium text-gray-900">
            Color System Performance
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleMeasureCSSVariables}
            className="text-xs px-2 py-1 bg-primary-50 text-primary-600 rounded hover:bg-primary-100 transition-colors"
          >
            Measure CSS
          </button>

          <button
            onClick={handleExportMetrics}
            className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
          >
            Export
          </button>

          <button
            onClick={clearMetrics}
            className="text-xs px-2 py-1 bg-error-50 text-error-600 rounded hover:bg-error-100 transition-colors"
          >
            Clear
          </button>

          {compact && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded hover:bg-gray-100 transition-colors"
            >
              {isExpanded ? "Collapse" : "Expand"}
            </button>
          )}
        </div>
      </div>

      {/* Metrics Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Current Metrics */}
          {statistics.latest && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">
                Current Metrics
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MetricCard
                  label="CSS Load"
                  value={formatTime(statistics.latest.cssLoadTime)}
                  status={getStatusColor(statistics.latest.cssLoadTime, 100)}
                />
                <MetricCard
                  label="CSS Parse"
                  value={formatTime(statistics.latest.cssParseTime)}
                  status={getStatusColor(statistics.latest.cssParseTime, 50)}
                />
                <MetricCard
                  label="Render Time"
                  value={formatTime(statistics.latest.renderTime)}
                  status={getStatusColor(statistics.latest.renderTime, 16)}
                />
                <MetricCard
                  label="Bundle Size"
                  value={formatBytes(statistics.latest.bundleSize)}
                  status={getStatusColor(
                    statistics.latest.bundleSize,
                    50 * 1024
                  )}
                />
              </div>
            </div>
          )}

          {/* Average Metrics */}
          {statistics.averages &&
            Object.keys(statistics.averages).length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-2">
                  Average Performance
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {statistics.averages.cssLoadTime && (
                    <MetricCard
                      label="Avg CSS Load"
                      value={formatTime(statistics.averages.cssLoadTime)}
                      status="text-gray-600 bg-gray-50"
                    />
                  )}
                  {statistics.averages.cssParseTime && (
                    <MetricCard
                      label="Avg CSS Parse"
                      value={formatTime(statistics.averages.cssParseTime)}
                      status="text-gray-600 bg-gray-50"
                    />
                  )}
                  {statistics.averages.renderTime && (
                    <MetricCard
                      label="Avg Render"
                      value={formatTime(statistics.averages.renderTime)}
                      status="text-gray-600 bg-gray-50"
                    />
                  )}
                  {statistics.averages.memoryUsage && (
                    <MetricCard
                      label="Avg Memory"
                      value={formatBytes(statistics.averages.memoryUsage)}
                      status="text-gray-600 bg-gray-50"
                    />
                  )}
                </div>
              </div>
            )}

          {/* CSS Variable Stats */}
          {cssVariableStats && (
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-2">
                CSS Variables Analysis
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <MetricCard
                  label="Total Variables"
                  value={cssVariableStats.count.toString()}
                  status="text-primary-600 bg-primary-50"
                />
                <MetricCard
                  label="Unused Variables"
                  value={cssVariableStats.unusedCount.toString()}
                  status={
                    cssVariableStats.unusedCount > 10
                      ? "text-warning-600 bg-warning-50"
                      : "text-success-600 bg-success-50"
                  }
                />
                <MetricCard
                  label="Analysis Time"
                  value={formatTime(cssVariableStats.measureTime)}
                  status="text-gray-600 bg-gray-50"
                />
              </div>
            </div>
          )}

          {/* Alert Summary */}
          {statistics.alertCount > 0 && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 text-warning-600">⚠️</div>
                <span className="text-sm font-medium text-warning-800">
                  {statistics.alertCount} performance alert
                  {statistics.alertCount !== 1 ? "s" : ""} detected
                </span>
              </div>
            </div>
          )}

          {/* No Data State */}
          {!statistics.latest && (
            <div className="text-center py-8 text-gray-500">
              <div className="text-2xl mb-2">📊</div>
              <p className="text-sm">No performance data available yet.</p>
              <p className="text-xs text-gray-400 mt-1">
                Metrics will appear as the application is used.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  status: string;
}

function MetricCard({ label, value, status }: MetricCardProps) {
  return (
    <div className={`p-3 rounded-lg border ${status}`}>
      <div className="text-xs font-medium opacity-75 mb-1">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

/**
 * Compact performance indicator for development
 */
export function PerformanceIndicator({
  className = "",
}: {
  className?: string;
}) {
  const { statistics } = useColorSystemPerformance(
    process.env.NODE_ENV === "development"
  );
  const [isVisible, setIsVisible] = useState(false);

  // Show indicator only if there are performance issues
  useEffect(() => {
    setIsVisible(statistics.alertCount > 0);
  }, [statistics.alertCount]);

  if (!isVisible || !statistics.latest) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <div className="bg-warning-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center space-x-2 animate-pulse">
        <span className="text-sm">⚠️</span>
        <span className="text-xs font-medium">Performance Issues Detected</span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-xs opacity-75 hover:opacity-100 ml-2"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * Performance monitoring provider component
 */
export function PerformanceMonitoringProvider({
  children,
  enabled = process.env.NODE_ENV === "development",
}: {
  children: React.ReactNode;
  enabled?: boolean;
}) {
  useColorSystemPerformance(enabled);

  return (
    <>
      {children}
      {enabled && <PerformanceIndicator />}
    </>
  );
}
