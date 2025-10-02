"use client";

import React, { useState, useEffect } from "react";
import { CourseWithSections } from "../../types/course";
import { Enrollment } from "../../types/enrollment";
import { courseService } from "../../services/courseService";
import { enrollmentService } from "../../services/enrollmentService";
import { useAuth } from "../../contexts/AuthContext";
import { PaymentModal } from "./PaymentModal";

interface CourseDetailProps {
  courseId: number;
}

export const CourseDetail: React.FC<CourseDetailProps> = ({ courseId }) => {
  const { user, isAuthenticated } = useAuth();
  const [course, setCourse] = useState<CourseWithSections | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadCourseDetail();
    if (isAuthenticated) {
      checkEnrollment();
    }
  }, [courseId, isAuthenticated]);

  const loadCourseDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const courseData = await courseService.getCourseCatalogDetail(courseId);
      setCourse(courseData);
    } catch (error) {
      console.error("Failed to load course:", error);
      setError("Failed to load course details. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const isEnrolled = await enrollmentService.isEnrolled(courseId);
      if (isEnrolled) {
        const enrollmentData = await enrollmentService.getEnrollment(courseId);
        setEnrollment(enrollmentData);
      }
    } catch (error) {
      // User is not enrolled, which is fine
      console.log("User not enrolled in course");
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = "/auth";
      return;
    }

    if (!course) return;

    // If course is paid, show payment modal
    if (course.price > 0) {
      setShowPaymentModal(true);
      return;
    }

    // Handle free course enrollment
    try {
      setIsEnrolling(true);
      const enrollmentData = await enrollmentService.enrollInCourse({
        course_id: courseId,
      });
      setEnrollment(enrollmentData);
    } catch (error) {
      console.error("Failed to enroll:", error);
      setError("Failed to enroll in course. Please try again.");
    } finally {
      setIsEnrolling(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Refresh enrollment status
    checkEnrollment();
    setShowPaymentModal(false);
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatPrice = (price: number): string => {
    if (price === 0) {
      return "Free";
    }
    return `$${price.toFixed(2)}`;
  };

  const getDifficultyColor = (level: string): string => {
    switch (level) {
      case "beginner":
        return "bg-green-100 text-green-800";
      case "intermediate":
        return "bg-yellow-100 text-yellow-800";
      case "advanced":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || "Course not found"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Course Header */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(
                  course.difficulty_level
                )}`}
              >
                {course.difficulty_level.charAt(0).toUpperCase() +
                  course.difficulty_level.slice(1)}
              </span>
              {course.category && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                  {course.category.name}
                </span>
              )}
              {course.is_featured && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                  Featured
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {course.title}
            </h1>
            <p className="text-lg text-gray-600">{course.short_description}</p>
          </div>

          {/* Course Stats */}
          <div className="flex items-center space-x-6 mb-6 text-sm text-gray-500">
            <span className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
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
              {formatDuration(course.total_duration)}
            </span>
            <span className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {course.total_lectures} lectures
            </span>
            <span className="flex items-center">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                />
              </svg>
              {course.language.toUpperCase()}
            </span>
          </div>

          {/* Course Description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              About This Course
            </h2>
            <div className="prose max-w-none text-gray-700">
              {course.description.split("\n").map((paragraph, index) => (
                <p key={index} className="mb-3">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Course Curriculum */}
          {course.sections && course.sections.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Course Curriculum
              </h2>
              <div className="space-y-4">
                {course.sections.map((section, sectionIndex) => (
                  <div
                    key={section.id}
                    className="border border-gray-200 rounded-lg"
                  >
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-medium text-gray-900">
                        {sectionIndex + 1}. {section.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {section.total_lectures} lectures •{" "}
                        {formatDuration(section.total_duration)}
                      </p>
                    </div>
                    <div className="px-4 py-2">
                      {section.lectures.map((lecture, lectureIndex) => (
                        <div
                          key={lecture.id}
                          className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex items-center">
                            <span className="text-sm text-gray-500 mr-3">
                              {lectureIndex + 1}.
                            </span>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {lecture.title}
                              </p>
                              {lecture.is_preview && (
                                <span className="text-xs text-green-600 font-medium">
                                  Free Preview
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDuration(lecture.duration)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            {/* Course Preview */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
              <div className="aspect-video bg-gray-200">
                {course.preview_video_url ? (
                  <video
                    controls
                    className="w-full h-full object-cover"
                    poster={course.thumbnail_url}
                  >
                    <source src={course.preview_video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                    <span className="text-white text-4xl font-semibold">
                      {course.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="text-3xl font-bold text-gray-900 mb-4">
                  {formatPrice(course.price)}
                </div>

                {enrollment ? (
                  <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                      <p className="text-sm text-green-700 font-medium">
                        ✓ You are enrolled in this course
                      </p>
                    </div>
                    <button
                      onClick={() => (window.location.href = `/dashboard`)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md font-medium transition-colors duration-200"
                    >
                      Go to Course
                    </button>
                    {enrollment.progress_percentage > 0 && (
                      <div className="text-sm text-gray-600">
                        Progress: {enrollment.progress_percentage.toFixed(1)}%
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleEnroll}
                    disabled={isEnrolling}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-md font-medium transition-colors duration-200"
                  >
                    {isEnrolling
                      ? "Enrolling..."
                      : course.is_free
                      ? "Enroll for Free"
                      : "Enroll Now"}
                  </button>
                )}

                {!isAuthenticated && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    You need to be logged in to enroll
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {course && (
        <PaymentModal
          course={course}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
