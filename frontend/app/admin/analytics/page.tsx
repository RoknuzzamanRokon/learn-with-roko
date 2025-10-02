"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  analyticsService,
  RevenueAnalytics,
  UserRegistrationAnalytics,
  CourseCreationAnalytics,
  AnalyticsFilters,
} from "../../services/analyticsService";

export default function AnalyticsPage() {
  const { user, isLoading: loading } = useAuth();
  const router = useRouter();
  const [revenueData, setRevenueData] = useState<RevenueAnalytics | null>(null);
  const [userData, setUserData] = useState<UserRegistrationAnalytics | null>(
    null
  );
  const [courseData, setCourseData] = useState<CourseCreationAnalytics | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AnalyticsFilters>({
    group_by: "day",
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== "super_admin")) {
      router.push("/dashboard");
      return;
    }

    if (user && user.role === "super_admin") {
      loadAnalyticsData();
    }
  }, [user, loading, router, filters]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [revenue, users, courses] = await Promise.all([
        analyticsService.getRevenueAnalytics(filters),
        analyticsService.getUserRegistrationAnalytics(filters),
        analyticsService.getCourseCreationAnalytics(filters),
      ]);

      setRevenueData(revenue);
      setUserData(users);
      setCourseData(courses);
    } catch (err) {
      console.error("Failed to load analytics data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load analytics data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (range: string) => {
    const now = new Date();
    let startDate: Date;

    switch (range) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    setFilters({
      ...filters,
      start_date: analyticsService.formatDateForAPI(startDate),
      end_date: analyticsService.formatDateForAPI(now),
    });
  };

  const handleGroupByChange = (groupBy: "day" | "week" | "month") => {
    setFilters({
      ...filters,
      group_by: groupBy,
    });
  };

  const exportData = async (type: string) => {
    try {
      let data: any;
      let filename: string;

      switch (type) {
        case "revenue":
          data = revenueData;
          filename = "revenue-analytics.json";
          break;
        case "users":
          data = userData;
          filename = "user-registration-analytics.json";
          break;
        case "courses":
          data = courseData;
          filename = "course-creation-analytics.json";
          break;
        default:
          return;
      }

      if (!data) return;

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export data:", err);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
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
            onClick={loadAnalyticsData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Analytics & Reports
              </h1>
              <p className="mt-2 text-gray-600">
                Detailed platform analytics and insights
              </p>
            </div>
            <button
              onClick={() => router.push("/admin")}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Range
                </label>
                <div className="flex space-x-2">
                  {["7d", "30d", "90d"].map((range) => (
                    <button
                      key={range}
                      onClick={() => handleDateRangeChange(range)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      {range === "7d"
                        ? "Last 7 days"
                        : range === "30d"
                        ? "Last 30 days"
                        : "Last 90 days"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group By
                </label>
                <select
                  value={filters.group_by}
                  onChange={(e) =>
                    handleGroupByChange(
                      e.target.value as "day" | "week" | "month"
                    )
                  }
                  className="border border-gray-300 rounded px-3 py-1 text-sm"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Analytics */}
        {revenueData && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Revenue Analytics
                </h2>
                <button
                  onClick={() => exportData("revenue")}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Export Data
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsService.formatCurrency(
                      revenueData.summary.total_revenue || 0
                    )}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Total Transactions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsService.formatNumber(
                      revenueData.summary.total_transactions || 0
                    )}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Average Transaction</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsService.formatCurrency(
                      revenueData.summary.average_transaction || 0
                    )}
                  </p>
                </div>
              </div>

              {/* Simple chart representation */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">
                  Revenue Over Time
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {revenueData.chart_data.length > 0 ? (
                    <div className="space-y-2">
                      {revenueData.chart_data.slice(-10).map((point, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            {point.period
                              ? new Date(point.period).toLocaleDateString()
                              : "N/A"}
                          </span>
                          <span className="font-medium">
                            {analyticsService.formatCurrency(
                              point.revenue || 0
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center">
                      No revenue data available
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Registration Analytics */}
        {userData && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  User Registration Analytics
                </h2>
                <button
                  onClick={() => exportData("users")}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Export Data
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500">Total New Registrations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsService.formatNumber(
                    userData.summary.total_registrations || 0
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">
                  Registrations Over Time
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {userData.chart_data.length > 0 ? (
                    <div className="space-y-2">
                      {userData.chart_data.slice(-10).map((point, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            {point.period
                              ? new Date(point.period).toLocaleDateString()
                              : "N/A"}
                          </span>
                          <span className="font-medium">
                            {point.registrations || 0} registrations
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center">
                      No registration data available
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Course Creation Analytics */}
        {courseData && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Course Creation Analytics
                </h2>
                <button
                  onClick={() => exportData("courses")}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Export Data
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500">Total New Courses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analyticsService.formatNumber(
                    courseData.summary.total_courses || 0
                  )}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">
                  Course Creation Over Time
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {courseData.chart_data.length > 0 ? (
                    <div className="space-y-2">
                      {courseData.chart_data.slice(-10).map((point, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-gray-600">
                            {point.period
                              ? new Date(point.period).toLocaleDateString()
                              : "N/A"}
                          </span>
                          <span className="font-medium">
                            {point.courses_created || 0} courses
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center">
                      No course creation data available
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
