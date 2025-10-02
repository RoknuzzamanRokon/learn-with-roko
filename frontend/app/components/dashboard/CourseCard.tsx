"use client";

import React from "react";

interface CourseCardProps {
  course: {
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
  };
  onContinue: () => void;
}

export function CourseCard({ course, onContinue }: CourseCardProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return "bg-gray-200";
    if (percentage < 30) return "bg-red-500";
    if (percentage < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-48 h-32">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.course_title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {course.course_title}
            </h3>
            {course.is_completed && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <svg
                  className="w-3 h-3 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Completed
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {course.course_description}
          </p>

          <div className="flex items-center text-sm text-gray-500 mb-4">
            <span>By {course.instructor_name}</span>
            <span className="mx-2">•</span>
            <span>{formatDuration(course.total_duration)}</span>
            <span className="mx-2">•</span>
            <span>{course.total_lectures} lectures</span>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">
                Progress
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(course.progress_percentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(
                  course.progress_percentage
                )}`}
                style={{ width: `${course.progress_percentage}%` }}
              ></div>
            </div>
          </div>

          {/* Next Lecture or Completion Info */}
          {course.is_completed ? (
            <div className="flex items-center text-sm text-green-600 mb-4">
              <svg
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Completed on{" "}
              {course.completed_at
                ? formatDate(course.completed_at)
                : "Unknown"}
            </div>
          ) : course.next_lecture ? (
            <div className="text-sm text-gray-600 mb-4">
              <span className="font-medium">Up Next:</span>{" "}
              {course.next_lecture.title}
              <div className="text-xs text-gray-500 mt-1">
                in {course.next_lecture.section_title}
              </div>
            </div>
          ) : course.progress_percentage === 0 ? (
            <div className="text-sm text-gray-600 mb-4">
              <span className="font-medium">Ready to start</span>
            </div>
          ) : null}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              {course.last_accessed ? (
                <>Last accessed {formatDate(course.last_accessed)}</>
              ) : (
                <>Enrolled {formatDate(course.enrolled_at)}</>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  (window.location.href = `/catalog/${course.course_id}`)
                }
                className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                View Details
              </button>
              <button
                onClick={onContinue}
                className="px-4 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                {course.is_completed
                  ? "Review"
                  : course.progress_percentage === 0
                  ? "Start"
                  : "Continue"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
