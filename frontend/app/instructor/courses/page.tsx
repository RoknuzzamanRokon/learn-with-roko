"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Course, CourseListPaginatedResponse } from "../../types/course";
import { courseService } from "../../services/courseService";
import RoleGuard from "../../components/auth/RoleGuard";

export default function InstructorCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  });

  useEffect(() => {
    loadCourses();
  }, [pagination.page]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const response: CourseListPaginatedResponse =
        await courseService.getMyCourses(pagination.page, pagination.per_page);
      setCourses(response.courses);
      setPagination({
        page: response.page,
        per_page: response.per_page,
        total: response.total,
        total_pages: response.total_pages,
        has_next: response.has_next,
        has_prev: response.has_prev,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: number, courseTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await courseService.deleteCourse(courseId);
      setCourses(courses.filter((course) => course.id !== courseId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete course");
    }
  };

  const handleStatusToggle = async (
    courseId: number,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "published" ? "draft" : "published";

    try {
      const updatedCourse = await courseService.updateCourseStatus(courseId, {
        status: newStatus,
      });
      setCourses(
        courses.map((course) =>
          course.id === courseId ? updatedCourse : course
        )
      );
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to update course status"
      );
    }
  };

  const formatPrice = (price: number): string => {
    return price === 0 ? "Free" : `$${price.toFixed(2)}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["instructor", "super_admin"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
                <p className="mt-2 text-gray-600">
                  Manage your courses and track their performance
                </p>
              </div>
              <Link
                href="/instructor/courses/create"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create New Course
              </Link>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            {/* Courses Grid */}
            {courses.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No courses
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating your first course.
                </p>
                <div className="mt-6">
                  <Link
                    href="/instructor/courses/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create Course
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-white rounded-lg shadow-md overflow-hidden"
                    >
                      {/* Course Thumbnail */}
                      <div className="h-48 bg-gray-200 relative">
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg
                              className="w-12 h-12"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-2 right-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              course.status === "published"
                                ? "bg-green-100 text-green-800"
                                : course.status === "draft"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {course.status.charAt(0).toUpperCase() +
                              course.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      {/* Course Content */}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className={`text-lg font-semibold ${
                              course.is_free
                                ? "text-green-600"
                                : "text-blue-600"
                            }`}
                          >
                            {formatPrice(course.price)}
                          </span>
                          <span className="text-sm text-gray-500 capitalize">
                            {course.difficulty_level}
                          </span>
                        </div>

                        <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                          {course.title}
                        </h3>

                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {course.short_description || course.description}
                        </p>

                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <span>{course.total_lectures} lectures</span>
                          <span>{formatDuration(course.total_duration)}</span>
                        </div>

                        <div className="text-xs text-gray-500 mb-4">
                          Created: {formatDate(course.created_at)}
                          {course.published_at && (
                            <span className="block">
                              Published: {formatDate(course.published_at)}
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <Link
                            href={`/instructor/courses/${course.id}/edit`}
                            className="flex-1 px-3 py-2 text-sm font-medium text-center text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() =>
                              handleStatusToggle(course.id, course.status)
                            }
                            className={`flex-1 px-3 py-2 text-sm font-medium text-center border rounded-md ${
                              course.status === "published"
                                ? "text-yellow-700 bg-yellow-50 border-yellow-200 hover:bg-yellow-100"
                                : "text-green-700 bg-green-50 border-green-200 hover:bg-green-100"
                            }`}
                          >
                            {course.status === "published"
                              ? "Unpublish"
                              : "Publish"}
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteCourse(course.id, course.title)
                            }
                            className="px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.total_pages > 1 && (
                  <div className="mt-8 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {(pagination.page - 1) * pagination.per_page + 1}{" "}
                      to{" "}
                      {Math.min(
                        pagination.page * pagination.per_page,
                        pagination.total
                      )}{" "}
                      of {pagination.total} courses
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: prev.page - 1,
                          }))
                        }
                        disabled={!pagination.has_prev}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() =>
                          setPagination((prev) => ({
                            ...prev,
                            page: prev.page + 1,
                          }))
                        }
                        disabled={!pagination.has_next}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
