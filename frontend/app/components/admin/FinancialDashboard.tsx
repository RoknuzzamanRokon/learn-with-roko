"use client";

import React, { useState, useEffect } from "react";
import { transactionService } from "../../services/transactionService";
import {
  FinancialDashboardData,
  RevenueOverview,
  RevenueTrend,
  CourseRevenueAnalysis,
  InstructorRevenueAnalysis,
  PaymentMethodAnalysis,
} from "../../types/transaction";

interface FinancialDashboardProps {
  className?: string;
}

export default function FinancialDashboard({
  className = "",
}: FinancialDashboardProps) {
  const [dashboardData, setDashboardData] =
    useState<FinancialDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // 30 days ago
    end: new Date().toISOString().split("T")[0], // today
  });

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = `${dateRange.start}T00:00:00Z`;
      const endDate = `${dateRange.end}T23:59:59Z`;

      const data = await transactionService.getFinancialDashboard(
        startDate,
        endDate
      );
      setDashboardData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold mb-2">Error Loading Dashboard</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const {
    revenue_overview,
    revenue_trends,
    top_courses,
    top_instructors,
    payment_methods,
    pending_payouts,
  } = dashboardData;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Financial Dashboard
          </h1>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="self-center text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Gross Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(revenue_overview.gross_revenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                Platform Revenue
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(revenue_overview.platform_revenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">
                Total Transactions
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {revenue_overview.total_transactions.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Refund Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(revenue_overview.refund_rate)}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Trends Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Revenue Trends
        </h2>
        <div className="h-64 flex items-center justify-center text-gray-500">
          {/* Placeholder for chart - would integrate with a charting library like Chart.js or Recharts */}
          <div className="text-center">
            <p className="text-sm">
              Revenue trends visualization would go here
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {revenue_trends.length} data points from {dateRange.start} to{" "}
              {dateRange.end}
            </p>
          </div>
        </div>
      </div>

      {/* Top Courses and Instructors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Courses */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top Performing Courses
          </h2>
          <div className="space-y-3">
            {top_courses.slice(0, 5).map((course, index) => (
              <div
                key={course.course_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">
                      #{index + 1}
                    </span>
                    <p className="font-medium text-gray-900 truncate">
                      {course.course_title}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    by {course.instructor_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {course.sales_count} sales
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(course.gross_revenue)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Instructors */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top Earning Instructors
          </h2>
          <div className="space-y-3">
            {top_instructors.slice(0, 5).map((instructor, index) => (
              <div
                key={instructor.instructor_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">
                      #{index + 1}
                    </span>
                    <p className="font-medium text-gray-900">
                      {instructor.instructor_name}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {instructor.course_count} courses
                  </p>
                  <p className="text-xs text-gray-500">
                    {instructor.sales_count} sales
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(instructor.gross_revenue)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Est. commission:{" "}
                    {formatCurrency(instructor.estimated_commission)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Methods and Pending Payouts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Payment Methods
          </h2>
          <div className="space-y-3">
            {payment_methods.map((method) => (
              <div
                key={method.payment_method}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 capitalize">
                    {method.payment_method.replace("_", " ")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {method.transaction_count} transactions (
                    {formatPercentage(method.percentage_of_transactions)})
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(method.total_revenue)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Avg: {formatCurrency(method.avg_transaction_value)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Payouts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pending Payouts
          </h2>
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {pending_payouts.count}
            </p>
            <p className="text-sm text-gray-600 mb-4">Pending Payouts</p>
            <p className="text-lg font-semibold text-yellow-600">
              {formatCurrency(pending_payouts.total_amount)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total Amount</p>
          </div>
        </div>
      </div>
    </div>
  );
}
