"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  analyticsService,
  DashboardMetrics,
  RecentActivity,
  SystemHealth,
} from "../services/analyticsService";

export default function AdminDashboard() {
  const { user, isLoading: loading } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [activity, setActivity] = useState<RecentActivity | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "super_admin")) {
      router.push("/dashboard");
      return;
    }

    if (user && user.role === "super_admin") {
      loadDashboardData();
    }
  }, [user, loading, router]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [metricsData, activityData, healthData] = await Promise.all([
        analyticsService.getDashboardMetrics(),
        analyticsService.getRecentActivity(10),
        analyticsService.getSystemHealth(),
      ]);

      setMetrics(metricsData);
      setActivity(activityData);
      setHealth(healthData);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--gray-50)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary-600)] mx-auto"></div>
          <p className="mt-4 text-[var(--gray-600)]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--gray-50)] flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-sm border border-[var(--gray-200)]">
          <div className="text-[var(--error-600)] text-xl mb-4">⚠️ Error</div>
          <p className="text-[var(--gray-600)] mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-[var(--primary-600)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-700)] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-[var(--success-700)] bg-[var(--success-100)] border border-[var(--success-200)]";
      case "warning":
        return "text-[var(--warning-700)] bg-[var(--warning-100)] border border-[var(--warning-200)]";
      case "critical":
        return "text-[var(--error-700)] bg-[var(--error-100)] border border-[var(--error-200)]";
      default:
        return "text-[var(--gray-700)] bg-[var(--gray-100)] border border-[var(--gray-200)]";
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case "info":
        return "border-[var(--primary-200)] bg-[var(--primary-50)] text-[var(--primary-800)]";
      case "warning":
        return "border-[var(--warning-200)] bg-[var(--warning-50)] text-[var(--warning-800)]";
      case "critical":
        return "border-[var(--error-200)] bg-[var(--error-50)] text-[var(--error-800)]";
      default:
        return "border-[var(--gray-200)] bg-[var(--gray-50)] text-[var(--gray-800)]";
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_registration":
        return "👤";
      case "course_creation":
        return "📚";
      case "enrollment":
        return "✅";
      case "course_completion":
        return "🎓";
      default:
        return "📝";
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--gray-900)]">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-[var(--gray-600)]">
            Platform overview and key metrics
          </p>
        </div>

        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Users Metric */}
            <div className="bg-white rounded-lg shadow-sm border-t-4 border-t-[var(--primary-600)] p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-[var(--primary-50)] rounded-full flex items-center justify-center">
                    <span className="text-[var(--primary-600)] text-lg">
                      👥
                    </span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-[var(--gray-500)]">
                    Total Users
                  </p>
                  <p className="text-2xl font-bold text-[var(--gray-900)]">
                    {analyticsService.formatNumber(metrics.users.total)}
                  </p>
                  <p className="text-xs text-[var(--success-600)] font-medium">
                    +{metrics.users.recent_signups} new this month
                  </p>
                </div>
              </div>
            </div>

            {/* Courses Metric */}
            <div className="bg-white rounded-lg shadow-sm border-t-4 border-t-[var(--success-600)] p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-[var(--success-50)] rounded-full flex items-center justify-center">
                    <span className="text-[var(--success-600)] text-lg">
                      📚
                    </span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-[var(--gray-500)]">
                    Total Courses
                  </p>
                  <p className="text-2xl font-bold text-[var(--gray-900)]">
                    {analyticsService.formatNumber(metrics.courses.total)}
                  </p>
                  <p className="text-xs text-[var(--gray-600)]">
                    {metrics.courses.published} published
                  </p>
                </div>
              </div>
            </div>

            {/* Revenue Metric */}
            <div className="bg-white rounded-lg shadow-sm border-t-4 border-t-[var(--warning-600)] p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-[var(--warning-50)] rounded-full flex items-center justify-center">
                    <span className="text-[var(--warning-600)] text-lg">
                      💰
                    </span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-[var(--gray-500)]">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-[var(--gray-900)]">
                    {analyticsService.formatCurrency(
                      metrics.revenue.total,
                      metrics.revenue.currency
                    )}
                  </p>
                  <p className="text-xs text-[var(--gray-600)]">This month</p>
                </div>
              </div>
            </div>

            {/* Enrollments Metric */}
            <div className="bg-white rounded-lg shadow-sm border-t-4 border-t-[var(--accent-purple-600)] p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-[var(--accent-purple-50)] rounded-full flex items-center justify-center">
                    <span className="text-[var(--accent-purple-600)] text-lg">
                      🎓
                    </span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-[var(--gray-500)]">
                    Enrollments
                  </p>
                  <p className="text-2xl font-bold text-[var(--gray-900)]">
                    {analyticsService.formatNumber(metrics.enrollments.total)}
                  </p>
                  <p className="text-xs text-[var(--success-600)] font-medium">
                    {analyticsService.formatPercentage(
                      metrics.enrollments.completion_rate
                    )}{" "}
                    completion rate
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* System Health */}
          {health && (
            <div className="bg-white rounded-lg shadow-sm border border-[var(--gray-200)]">
              <div className="p-6 border-b border-[var(--gray-200)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-[var(--gray-900)]">
                    System Health
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(
                      health.overall_status
                    )}`}
                  >
                    {health.overall_status.charAt(0).toUpperCase() +
                      health.overall_status.slice(1)}
                  </span>
                </div>
              </div>
              <div className="p-6">
                {health.alerts.length > 0 ? (
                  <div className="space-y-3">
                    {health.alerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${getAlertSeverityColor(
                          alert.severity
                        )}`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <span className="text-lg">
                              {alert.severity === "critical"
                                ? "🚨"
                                : alert.severity === "warning"
                                ? "⚠️"
                                : "ℹ️"}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-semibold">
                              {alert.type.replace("_", " ").toUpperCase()}
                            </p>
                            <p className="text-sm mt-1">{alert.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[var(--success-100)] rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">✅</span>
                    </div>
                    <p className="text-sm text-[var(--gray-600)] font-medium">
                      All systems operational
                    </p>
                    <p className="text-xs text-[var(--gray-500)] mt-1">
                      No alerts or issues detected
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {activity && (
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-[var(--gray-200)]">
              <div className="p-6 border-b border-[var(--gray-200)]">
                <h2 className="text-lg font-semibold text-[var(--gray-900)]">
                  Recent Activity
                </h2>
              </div>
              <div className="p-6">
                {activity.activities.length > 0 ? (
                  <div className="space-y-4">
                    {activity.activities.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-4 p-3 rounded-lg hover:bg-[var(--gray-50)] transition-colors"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-[var(--primary-50)] rounded-full flex items-center justify-center">
                            <span className="text-sm">
                              {getActivityIcon(item.type)}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[var(--gray-900)] font-medium">
                            {item.message}
                          </p>
                          <p className="text-xs text-[var(--gray-500)] mt-1">
                            {analyticsService.getRelativeTime(item.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-[var(--gray-100)] rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl text-[var(--gray-400)]">
                        📝
                      </span>
                    </div>
                    <p className="text-[var(--gray-500)]">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-[var(--gray-200)]">
          <div className="p-6 border-b border-[var(--gray-200)]">
            <h2 className="text-lg font-semibold text-[var(--gray-900)]">
              Quick Actions
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => router.push("/admin/users")}
                className="p-4 border border-[var(--gray-200)] rounded-lg hover:bg-[var(--primary-50)] hover:border-[var(--primary-200)] text-left transition-colors group"
              >
                <div className="w-10 h-10 bg-[var(--primary-100)] rounded-lg flex items-center justify-center mb-3 group-hover:bg-[var(--primary-200)] transition-colors">
                  <span className="text-[var(--primary-600)] text-lg">👥</span>
                </div>
                <h3 className="font-semibold text-[var(--gray-900)] mb-1">
                  Manage Users
                </h3>
                <p className="text-sm text-[var(--gray-600)]">
                  View and manage all users
                </p>
              </button>

              <button
                onClick={() => router.push("/admin/instructor-applications")}
                className="p-4 border border-[var(--gray-200)] rounded-lg hover:bg-[var(--warning-50)] hover:border-[var(--warning-200)] text-left transition-colors group"
              >
                <div className="w-10 h-10 bg-[var(--warning-100)] rounded-lg flex items-center justify-center mb-3 group-hover:bg-[var(--warning-200)] transition-colors">
                  <span className="text-[var(--warning-600)] text-lg">📝</span>
                </div>
                <h3 className="font-semibold text-[var(--gray-900)] mb-1">
                  Instructor Applications
                </h3>
                <p className="text-sm text-[var(--gray-600)]">
                  Review pending applications
                </p>
              </button>

              <button
                onClick={() => router.push("/admin/analytics")}
                className="p-4 border border-[var(--gray-200)] rounded-lg hover:bg-[var(--accent-purple-50)] hover:border-[var(--accent-purple-200)] text-left transition-colors group"
              >
                <div className="w-10 h-10 bg-[var(--accent-purple-100)] rounded-lg flex items-center justify-center mb-3 group-hover:bg-[var(--accent-purple-200)] transition-colors">
                  <span className="text-[var(--accent-purple-600)] text-lg">
                    📊
                  </span>
                </div>
                <h3 className="font-semibold text-[var(--gray-900)] mb-1">
                  Analytics
                </h3>
                <p className="text-sm text-[var(--gray-600)]">
                  View detailed reports
                </p>
              </button>

              <button
                onClick={() => router.push("/admin/courses")}
                className="p-4 border border-[var(--gray-200)] rounded-lg hover:bg-[var(--success-50)] hover:border-[var(--success-200)] text-left transition-colors group"
              >
                <div className="w-10 h-10 bg-[var(--success-100)] rounded-lg flex items-center justify-center mb-3 group-hover:bg-[var(--success-200)] transition-colors">
                  <span className="text-[var(--success-600)] text-lg">📚</span>
                </div>
                <h3 className="font-semibold text-[var(--gray-900)] mb-1">
                  Course Management
                </h3>
                <p className="text-sm text-[var(--gray-600)]">
                  Moderate and manage courses
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
