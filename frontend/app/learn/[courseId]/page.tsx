"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { courseService } from "../../services/courseService";
import { enrollmentService } from "../../services/enrollmentService";
import { CoursePlayer } from "../../components/learn/CoursePlayer";
import { CourseSidebar } from "../../components/learn";
import { CourseWithSections } from "../../types/course";
import { Enrollment, CourseProgress } from "../../types/enrollment";

export default function LearnPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const courseId = parseInt(params.courseId as string);
  const lectureId = searchParams.get("lecture")
    ? parseInt(searchParams.get("lecture")!)
    : null;

  const [course, setCourse] = useState<CourseWithSections | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(
    null
  );
  const [currentLectureId, setCurrentLectureId] = useState<number | null>(
    lectureId
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (courseId) {
      loadCourseData();
    }
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      setLoading(true);

      // Load course with sections and lectures
      const courseData = await courseService.getCourseWithSections(courseId);
      setCourse(courseData);

      // Check enrollment
      const enrollmentData = await enrollmentService.getEnrollment(courseId);
      setEnrollment(enrollmentData);

      // Load progress
      const progressData = await enrollmentService.getCourseProgress(courseId);
      setCourseProgress(progressData);

      // Set initial lecture if not specified in URL
      if (!currentLectureId && courseData.sections.length > 0) {
        const firstSection = courseData.sections[0];
        if (firstSection.lectures.length > 0) {
          setCurrentLectureId(firstSection.lectures[0].id);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("404")) {
        setError("Course not found or you are not enrolled in this course.");
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to load course data"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLectureSelect = (lectureId: number) => {
    setCurrentLectureId(lectureId);
    // Update URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.set("lecture", lectureId.toString());
    window.history.replaceState({}, "", url.toString());
  };

  const handleProgressUpdate = async (lectureId: number, progressData: any) => {
    try {
      await enrollmentService.updateLectureProgress(lectureId, progressData);
      // Reload course progress to get updated stats
      const updatedProgress = await enrollmentService.getCourseProgress(
        courseId
      );
      setCourseProgress(updatedProgress);
    } catch (err) {
      console.error("Failed to update progress:", err);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 mb-4">
            Please log in to access this course.
          </p>
          <button
            onClick={() => (window.location.href = "/auth")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

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
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => (window.location.href = "/catalog")}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Browse Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!course || !enrollment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Course Not Available
          </h2>
          <p className="text-gray-600">
            This course is not available or you are not enrolled.
          </p>
        </div>
      </div>
    );
  }

  const currentLecture = course.sections
    .flatMap((section) => section.lectures)
    .find((lecture) => lecture.id === currentLectureId);

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <CourseSidebar
        course={course}
        courseProgress={courseProgress}
        currentLectureId={currentLectureId}
        onLectureSelect={handleLectureSelect}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarOpen ? "ml-80" : "ml-0"
        }`}
      >
        {/* Header */}
        <header className="header-primary px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {course.title}
                </h1>
                {currentLecture && (
                  <p className="text-sm text-gray-600">
                    {currentLecture.title}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Progress:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="progress-fill bg-success-500 h-2 rounded-full"
                      style={{ width: `${enrollment.progress_percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-success-600">
                    {Math.round(enrollment.progress_percentage)}%
                  </span>
                </div>
              </div>
              <button
                onClick={() => (window.location.href = "/dashboard")}
                className="btn-base btn-secondary btn-sm"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </header>

        {/* Course Player */}
        <main className="flex-1">
          {currentLecture ? (
            <CoursePlayer
              lecture={currentLecture}
              course={course}
              onProgressUpdate={(progressData) =>
                handleProgressUpdate(currentLecture.id, progressData)
              }
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Select a Lecture
                </h2>
                <p className="text-gray-600">
                  Choose a lecture from the sidebar to start learning.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
