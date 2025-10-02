"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import {
  moderationService,
  CourseForReview,
  CoursesForReviewResponse,
  ModerationFilters,
  ModerationStatistics,
} from "../../services/moderationService";

export default function CourseManagementPage() {
  const { user, isLoading: loading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<CourseForReview[]>([]);
  const [statistics, setStatistics] = useState<ModerationStatistics | null>(
    null
  );
  const [pagination, setPagination] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [filters, setFilters] = useState<ModerationFilters>({
    limit: 20,
    offset: 0,
  });

  useEffect(() => {
    if (!loading && (!user || user.role !== "super_admin")) {
      router.push("/dashboard");
      return;
    }

    if (user && user.role === "super_admin") {
      loadData();
    }
  }, [user, loading, router, filters]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [coursesData, statsData] = await Promise.all([
        moderationService.getCoursesForReview(filters),
        moderationService.getModerationStatistics(),
      ]);

      setCourses(coursesData.courses);
      setPagination(coursesData.pagination);
      setStatistics(statsData);
    } catch (err) {
      console.error("Failed to load course management data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (courseId: number, newStatus: string) => {
    try {
      await moderationService.updateCourseStatus(courseId, {
        status: newStatus,
      });
      await loadData(); // Reload data
    } catch (err) {
      console.error("Failed to update course status:", err);
      alert("Failed to update course status");
    }
  };

  const handleFeatureToggle = async (courseId: number, isFeatured: boolean) => {
    try {
      await moderationService.toggleCourseFeatured(courseId, {
        is_featured: isFeatured,
      });
      await loadData(); // Reload data
    } catch (err) {
      console.error("Failed to toggle course featured status:", err);
      alert("Failed to update course featured status");
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedCourses.length === 0) {
      alert("Please select courses first");
      return;
    }

    try {
      const result = await moderationService.bulkUpdateCourses({
        course_ids: selectedCourses,
        action: action,
      });

      if (result.errors.length > 0) {
        alert(
          `Updated ${result.updated} courses. Errors: ${result.errors.join(
            ", "
          )}`
        );
      } else {
        alert(`Successfully updated ${result.updated} courses`);
      }

      setSelectedCourses([]);
      await loadData(); // Reload data
    } catch (err) {
      console.error("Failed to perform bulk action:", err);
      alert("Failed to perform bulk action");
    }
  };

  const handleCourseSelect = (courseId: number, selected: boolean) => {
    if (selected) {
      setSelectedCourses([...selectedCourses, courseId]);
    } else {
      setSelectedCourses(selectedCourses.filter((id) => id !== courseId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedCourses(courses.map((course) => course.id));
    } else {
      setSelectedCourses([]);
    }
  };

  const handleFilterChange = (newFilters: Partial<ModerationFilters>) => {
    setFilters({ ...filters, ...newFilters, offset: 0 });
  };

  const handlePageChange = (newOffset: number) => {
    setFilters({ ...filters, offset: newOffset });
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
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
            onClick={loadData}
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
                Course Management
              </h1>
              <p className="mt-2 text-gray-600">
                Review and moderate platform courses
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

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">📝</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Draft Courses
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {moderationService.formatNumber(
                      statistics.course_status.draft
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Published Courses
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {moderationService.formatNumber(
                      statistics.course_status.published
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">⭐</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Featured Courses
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {moderationService.formatNumber(
                      statistics.featured_courses
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🔍</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">
                    Need Review
                  </p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {moderationService.formatNumber(
                      statistics.courses_needing_review
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status || ""}
                  onChange={(e) =>
                    handleFilterChange({ status: e.target.value || undefined })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={filters.search || ""}
                  onChange={(e) =>
                    handleFilterChange({ search: e.target.value || undefined })
                  }
                  placeholder="Search courses or instructors..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="md:col-span-2 flex items-end space-x-2">
                <button
                  onClick={() =>
                    handleFilterChange({ status: undefined, search: undefined })
                  }
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCourses.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-800">
                {selectedCourses.length} course(s) selected
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => handleBulkAction("publish")}
                  className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                >
                  Publish
                </button>
                <button
                  onClick={() => handleBulkAction("archive")}
                  className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
                >
                  Archive
                </button>
                <button
                  onClick={() => handleBulkAction("feature")}
                  className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                >
                  Feature
                </button>
                <button
                  onClick={() => handleBulkAction("unfeature")}
                  className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
                >
                  Unfeature
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Courses Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={
                        selectedCourses.length === courses.length &&
                        courses.length > 0
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enrollments
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedCourses.includes(course.id)}
                        onChange={(e) =>
                          handleCourseSelect(course.id, e.target.checked)
                        }
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start space-x-3">
                        {course.thumbnail_url && (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="w-16 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {course.title}
                            {course.is_featured && (
                              <span className="ml-2 text-yellow-500">⭐</span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {course.total_lectures} lectures •{" "}
                            {moderationService.formatDuration(
                              course.total_duration
                            )}
                          </div>
                          <div className="text-xs text-gray-400">
                            Created{" "}
                            {moderationService.getRelativeTime(
                              course.created_at
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {course.instructor.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {course.instructor.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${moderationService.getStatusColor(
                          course.status
                        )}`}
                      >
                        {moderationService.getStatusIcon(course.status)}{" "}
                        {course.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {course.price === 0
                        ? "Free"
                        : moderationService.formatCurrency(course.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {moderationService.formatNumber(course.enrollment_count)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() =>
                          router.push(`/admin/courses/${course.id}`)
                        }
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Review
                      </button>

                      {course.status === "draft" && (
                        <button
                          onClick={() =>
                            handleStatusChange(course.id, "published")
                          }
                          className="text-green-600 hover:text-green-900"
                        >
                          Publish
                        </button>
                      )}

                      {course.status === "published" && (
                        <button
                          onClick={() =>
                            handleStatusChange(course.id, "archived")
                          }
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Archive
                        </button>
                      )}

                      <button
                        onClick={() =>
                          handleFeatureToggle(course.id, !course.is_featured)
                        }
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        {course.is_featured ? "Unfeature" : "Feature"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() =>
                    handlePageChange(
                      Math.max(0, filters.offset! - filters.limit!)
                    )
                  }
                  disabled={!pagination.has_prev}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    handlePageChange(filters.offset! + filters.limit!)
                  }
                  disabled={!pagination.has_next}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{" "}
                    <span className="font-medium">{filters.offset! + 1}</span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(
                        filters.offset! + filters.limit!,
                        pagination.total
                      )}
                    </span>{" "}
                    of <span className="font-medium">{pagination.total}</span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() =>
                        handlePageChange(
                          Math.max(0, filters.offset! - filters.limit!)
                        )
                      }
                      disabled={!pagination.has_prev}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        handlePageChange(filters.offset! + filters.limit!)
                      }
                      disabled={!pagination.has_next}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No courses found
            </h3>
            <p className="text-gray-500">
              Try adjusting your filters or search terms.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
