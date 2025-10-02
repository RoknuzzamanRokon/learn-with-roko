"use client";

import { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import {
  moderationService,
  CourseDetailForReview,
} from "../../../services/moderationService";

export default function CourseReviewPage() {
  const { user, isLoading: loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const courseId = parseInt(params.id as string);

  const [course, setCourse] = useState<CourseDetailForReview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "super_admin")) {
      router.push("/dashboard");
      return;
    }

    if (user && user.role === "super_admin" && courseId) {
      loadCourseDetails();
    }
  }, [user, loading, router, courseId]);

  const loadCourseDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const courseData = await moderationService.getCourseDetailsForReview(
        courseId
      );
      setCourse(courseData);
    } catch (err) {
      console.error("Failed to load course details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load course details"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!course) return;

    try {
      setIsUpdating(true);
      await moderationService.updateCourseStatus(course.id, {
        status: newStatus,
        admin_notes: adminNotes || undefined,
      });

      alert(`Course status updated to ${newStatus}`);
      await loadCourseDetails(); // Reload course data
      setAdminNotes(""); // Clear notes
    } catch (err) {
      console.error("Failed to update course status:", err);
      alert("Failed to update course status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFeatureToggle = async () => {
    if (!course) return;

    try {
      setIsUpdating(true);
      await moderationService.toggleCourseFeatured(course.id, {
        is_featured: !course.is_featured,
      });

      alert(
        `Course ${course.is_featured ? "unfeatured" : "featured"} successfully`
      );
      await loadCourseDetails(); // Reload course data
    } catch (err) {
      console.error("Failed to toggle course featured status:", err);
      alert("Failed to update course featured status");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course details...</p>
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
          <div className="space-x-4">
            <button
              onClick={loadCourseDetails}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              onClick={() => router.push("/admin/courses")}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Back to Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-xl mb-4">Course not found</div>
          <button
            onClick={() => router.push("/admin/courses")}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
          >
            Back to Courses
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
                Course Review
              </h1>
              <p className="mt-2 text-gray-600">
                Review and moderate course content
              </p>
            </div>
            <button
              onClick={() => router.push("/admin/courses")}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Back to Courses
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Overview */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  {course.thumbnail_url && (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-32 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {course.title}
                      </h2>
                      {course.is_featured && (
                        <span className="text-yellow-500 text-xl">⭐</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mb-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${moderationService.getStatusColor(
                          course.status
                        )}`}
                      >
                        {moderationService.getStatusIcon(course.status)}{" "}
                        {course.status}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${moderationService.getDifficultyColor(
                          course.difficulty_level
                        )}`}
                      >
                        {course.difficulty_level}
                      </span>
                      <span className="text-sm text-gray-500">
                        {course.price === 0
                          ? "Free"
                          : moderationService.formatCurrency(course.price)}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">
                      {course.short_description}
                    </p>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span>{course.statistics.sections_count} sections</span>
                      <span>{course.statistics.lectures_count} lectures</span>
                      <span>
                        {moderationService.formatDuration(
                          course.total_duration
                        )}
                      </span>
                      <span>{course.language}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Description */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Course Description
                </h3>
                <div className="prose max-w-none">
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {course.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Course Curriculum */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Course Curriculum
                </h3>
                <div className="space-y-4">
                  {course.sections.map((section, sectionIndex) => (
                    <div
                      key={section.id}
                      className="border border-gray-200 rounded-lg"
                    >
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">
                            {sectionIndex + 1}. {section.title}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {section.total_lectures} lectures •{" "}
                            {moderationService.formatDuration(
                              section.total_duration
                            )}
                          </span>
                        </div>
                        {section.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {section.description}
                          </p>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="space-y-2">
                          {section.lectures.map((lecture, lectureIndex) => (
                            <div
                              key={lecture.id}
                              className="flex items-center justify-between py-2"
                            >
                              <div className="flex items-center space-x-3">
                                <span className="text-sm text-gray-500">
                                  {sectionIndex + 1}.{lectureIndex + 1}
                                </span>
                                <span className="text-sm">
                                  {lecture.lecture_type === "video"
                                    ? "🎥"
                                    : lecture.lecture_type === "quiz"
                                    ? "❓"
                                    : lecture.lecture_type === "text"
                                    ? "📄"
                                    : "📎"}
                                </span>
                                <span className="text-sm text-gray-900">
                                  {lecture.title}
                                </span>
                                {lecture.is_preview && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    Preview
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-gray-500">
                                {moderationService.formatDuration(
                                  lecture.duration
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Instructor Info */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Instructor
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900">
                      {course.instructor.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {course.instructor.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">
                      Role: {course.instructor.role}
                    </p>
                    <p className="text-sm text-gray-500">
                      Member since:{" "}
                      {moderationService.getRelativeTime(
                        course.instructor.created_at || ""
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Statistics */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Statistics
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      Total Enrollments
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {moderationService.formatNumber(
                        course.statistics.total_enrollments
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Completed</span>
                    <span className="text-sm font-medium text-gray-900">
                      {moderationService.formatNumber(
                        course.statistics.completed_enrollments
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      Completion Rate
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {moderationService.formatPercentage(
                        course.statistics.completion_rate
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Created</span>
                    <span className="text-sm font-medium text-gray-900">
                      {moderationService.getRelativeTime(course.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Last Updated</span>
                    <span className="text-sm font-medium text-gray-900">
                      {moderationService.getRelativeTime(course.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Admin Actions
                </h3>

                {/* Admin Notes */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Add notes about this review..."
                  />
                </div>

                {/* Status Actions */}
                <div className="space-y-3">
                  {course.status === "draft" && (
                    <button
                      onClick={() => handleStatusChange("published")}
                      disabled={isUpdating}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {isUpdating ? "Publishing..." : "Publish Course"}
                    </button>
                  )}

                  {course.status === "published" && (
                    <button
                      onClick={() => handleStatusChange("archived")}
                      disabled={isUpdating}
                      className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                      {isUpdating ? "Archiving..." : "Archive Course"}
                    </button>
                  )}

                  {course.status === "archived" && (
                    <button
                      onClick={() => handleStatusChange("published")}
                      disabled={isUpdating}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {isUpdating ? "Publishing..." : "Republish Course"}
                    </button>
                  )}

                  <button
                    onClick={handleFeatureToggle}
                    disabled={isUpdating}
                    className={`w-full px-4 py-2 rounded-lg disabled:opacity-50 ${
                      course.is_featured
                        ? "bg-orange-600 text-white hover:bg-orange-700"
                        : "bg-yellow-600 text-white hover:bg-yellow-700"
                    }`}
                  >
                    {isUpdating
                      ? course.is_featured
                        ? "Unfeaturing..."
                        : "Featuring..."
                      : course.is_featured
                      ? "Unfeature Course"
                      : "Feature Course"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
