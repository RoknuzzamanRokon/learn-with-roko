"use client";

import React, { useState, useEffect } from "react";
import { enrollmentService } from "../../services/enrollmentService";
import { CourseCard } from "./CourseCard";
import { DashboardStats } from "./DashboardStats";
import { RecentActivity } from "./RecentActivity";

interface EnrolledCourse {
  enrollment_id: number;
  course_id: number;
  course_title: string;
  course_description: string;
  instructor_name: string;
  thumbnail_url?: string;
  progress_percentage: number;
  is_completed: boolean;
  enrolled_at: string;
  last_accessed?: string;
  completed_at?: string;
  total_duration: number;
  total_lectures: number;
  next_lecture?: {
    id: number;
    title: string;
    section_title: string;
  };
  progress_details?: {
    completed_lectures: number;
    total_lectures: number;
    total_watch_time: number;
  };
}

interface DashboardSummary {
  total_enrollments: number;
  completed_courses: number;
  in_progress_courses: number;
  total_watch_time_minutes: number;
  certificates_earned: number;
  completion_rate: number;
}

interface RecentActivityItem {
  type: string;
  course_id: number;
  course_title: string;
  lecture_id: number;
  lecture_title: string;
  section_title: string;
  timestamp: string;
  watch_time: number;
  is_completed: boolean;
}

export function LearnerDashboard() {
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [dashboardSummary, setDashboardSummary] =
    useState<DashboardSummary | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "in-progress" | "completed"
  >("all");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [courses, summary, activity] = await Promise.all([
        enrollmentService.getEnrolledCoursesForDashboard(),
        enrollmentService.getDashboardSummary(),
        enrollmentService.getRecentActivity(5),
      ]);

      setEnrolledCourses(courses);
      setDashboardSummary(summary);
      setRecentActivity(activity);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCourses = () => {
    switch (activeTab) {
      case "in-progress":
        return enrolledCourses.filter(
          (course) => !course.is_completed && course.progress_percentage > 0
        );
      case "completed":
        return enrolledCourses.filter((course) => course.is_completed);
      default:
        return enrolledCourses;
    }
  };

  const continueCourse = (courseId: number) => {
    // Navigate to course player
    window.location.href = `/learn/${courseId}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        {dashboardSummary && <DashboardStats summary={dashboardSummary} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Course Tabs */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    {
                      key: "all",
                      label: "All Courses",
                      count: enrolledCourses.length,
                    },
                    {
                      key: "in-progress",
                      label: "In Progress",
                      count: enrolledCourses.filter(
                        (c) => !c.is_completed && c.progress_percentage > 0
                      ).length,
                    },
                    {
                      key: "completed",
                      label: "Completed",
                      count: enrolledCourses.filter((c) => c.is_completed)
                        .length,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.key
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </nav>
              </div>

              {/* Course List */}
              <div className="p-6">
                {getFilteredCourses().length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <svg
                        className="mx-auto h-12 w-12"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {activeTab === "all" && "No courses enrolled"}
                      {activeTab === "in-progress" && "No courses in progress"}
                      {activeTab === "completed" && "No completed courses"}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {activeTab === "all" &&
                        "Start your learning journey by browsing our course catalog."}
                      {activeTab === "in-progress" &&
                        "Continue learning by accessing your enrolled courses."}
                      {activeTab === "completed" &&
                        "Complete some courses to see them here."}
                    </p>
                    {activeTab === "all" && (
                      <button
                        onClick={() => (window.location.href = "/catalog")}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Browse Courses
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {getFilteredCourses().map((course) => (
                      <CourseCard
                        key={course.enrollment_id}
                        course={course}
                        onContinue={() => continueCourse(course.course_id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <RecentActivity activities={recentActivity} />

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => (window.location.href = "/catalog")}
                  className="w-full text-left px-4 py-3 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Browse New Courses
                </button>
                <button
                  onClick={() => (window.location.href = "/certificates")}
                  className="w-full text-left px-4 py-3 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  View Certificates
                </button>
                <button
                  onClick={() => (window.location.href = "/profile")}
                  className="w-full text-left px-4 py-3 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  Update Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
