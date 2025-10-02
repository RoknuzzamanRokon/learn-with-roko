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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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
        return "text-green-600 bg-green-100";
      case "warning":
        return "text-yellow-600 bg-yellow-100";
      case "critical":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case "info":
        return "border-blue-200 bg-blue-50 text-blue-800";
      case "warning":
        return "border-yellow-200 bg-yellow-50 text-yellow-800";
      case "critical":
        return "border-red-200 bg-red-50 text-red-800";
      default:
        return "border-gray-200 bg-gray-50 text-gray-800";
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Platform overview and key metrics
          </p>
        </div>

        {/* Key Metrics */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Users Metric */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm">👥</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Users
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analyticsService.formatNumber(metrics.users.total)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {metrics.users.recent_signups} new this month
                  </p>
                </div>
              </div>
            </div>

            {/* Courses Metric */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm">📚</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Courses
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analyticsService.formatNumber(metrics.courses.total)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {metrics.courses.published} published
                  </p>
                </div>
              </div>
            </div>

            {/* Revenue Metric */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-sm">💰</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analyticsService.formatCurrency(
                      metrics.revenue.total,
                      metrics.revenue.currency
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Enrollments Metric */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm">🎓</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Enrollments
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {analyticsService.formatNumber(metrics.enrollments.total)}
                  </p>
                  <p className="text-xs text-gray-500">
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
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">
                    System Health
                  </h2>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(
                      health.overall_status
                    )}`}
                  >
                    {health.overall_status}
                  </span>
                </div>
              </div>
              <div className="p-6">
                {health.alerts.length > 0 ? (
                  <div className="space-y-3">
                    {health.alerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${getAlertSeverityColor(
                          alert.severity
                        )}`}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <span className="text-sm">
                              {alert.severity === "critical"
                                ? "🚨"
                                : alert.severity === "warning"
                                ? "⚠️"
                                : "ℹ️"}
                            </span>
                          </div>
                          <div className="ml-2">
                            <p className="text-sm font-medium">
                              {alert.type.replace("_", " ")}
                            </p>
                            <p className="text-sm">{alert.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <span className="text-2xl">✅</span>
                    <p className="text-sm text-gray-500 mt-2">
                      All systems operational
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {activity && (
            <div className="lg:col-span-2 bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Activity
                </h2>
              </div>
              <div className="p-6">
                {activity.activities.length > 0 ? (
                  <div className="space-y-4">
                    {activity.activities.map((item, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <span className="text-lg">
                            {getActivityIcon(item.type)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">
                            {item.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {analyticsService.getRelativeTime(item.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Quick Actions
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => router.push("/admin/users")}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="text-lg mb-2">👥</div>
                <h3 className="font-medium text-gray-900">Manage Users</h3>
                <p className="text-sm text-gray-500">
                  View and manage all users
                </p>
              </button>

              <button
                onClick={() => router.push("/admin/instructor-applications")}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="text-lg mb-2">📝</div>
                <h3 className="font-medium text-gray-900">
                  Instructor Applications
                </h3>
                <p className="text-sm text-gray-500">
                  Review pending applications
                </p>
              </button>

              <button
                onClick={() => router.push("/admin/analytics")}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="text-lg mb-2">📊</div>
                <h3 className="font-medium text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-500">View detailed reports</p>
              </button>

              <button
                onClick={() => router.push("/admin/courses")}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
              >
                <div className="text-lg mb-2">📚</div>
                <h3 className="font-medium text-gray-900">Course Management</h3>
                <p className="text-sm text-gray-500">
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
