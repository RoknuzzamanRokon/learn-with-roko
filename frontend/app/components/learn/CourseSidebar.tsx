"use client";

import React from "react";
import { CourseWithSections } from "../../types/course";
import { CourseProgress } from "../../types/enrollment";

interface CourseSidebarProps {
  course: CourseWithSections;
  courseProgress: CourseProgress | null;
  currentLectureId: number | null;
  onLectureSelect: (lectureId: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function CourseSidebar({
  course,
  courseProgress,
  currentLectureId,
  onLectureSelect,
  isOpen,
  onToggle,
}: CourseSidebarProps) {
  const getLectureProgress = (lectureId: number) => {
    return courseProgress?.lecture_progress?.find(
      (lp) => lp.lecture_id === lectureId
    );
  };

  const getSectionProgress = (sectionId: number) => {
    const sectionLectures =
      course.sections.find((s) => s.id === sectionId)?.lectures || [];

    const completedLectures = sectionLectures.filter((lecture) => {
      const progress = getLectureProgress(lecture.id);
      return progress?.is_completed || false;
    }).length;

    return {
      completed: completedLectures,
      total: sectionLectures.length,
      percentage:
        sectionLectures.length > 0
          ? (completedLectures / sectionLectures.length) * 100
          : 0,
    };
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } w-80`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              Course Content
            </h2>
            <button
              onClick={onToggle}
              className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Course Progress */}
          {courseProgress && (
            <div className="mt-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
              <div className="flex items-center justify-between text-sm text-gray-700 mb-2">
                <span className="font-medium">Overall Progress</span>
                <span className="font-semibold text-primary-600">
                  {Math.round(courseProgress.progress_percentage)}%
                </span>
              </div>
              <div className="progress-bar mb-2">
                <div
                  className="progress-fill bg-primary-600 transition-all duration-500"
                  style={{ width: `${courseProgress.progress_percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>
                  {courseProgress.completed_lectures} of{" "}
                  {courseProgress.total_lectures} lectures
                </span>
                <span>
                  {formatDuration(courseProgress.total_watch_time_minutes)}{" "}
                  watched
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Course Sections */}
        <div className="flex-1 overflow-y-auto">
          {course.sections.map((section, sectionIndex) => {
            const sectionProgress = getSectionProgress(section.id);

            return (
              <div key={section.id} className="border-b border-gray-100">
                {/* Section Header */}
                <div
                  className={`p-4 ${
                    sectionProgress.percentage === 100
                      ? "bg-success-50 border-l-4 border-success-500"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">
                      {sectionIndex + 1}. {section.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          sectionProgress.percentage === 100
                            ? "bg-success-100 text-success-700"
                            : sectionProgress.percentage > 0
                            ? "bg-primary-100 text-primary-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {sectionProgress.completed}/{sectionProgress.total}
                      </span>
                      {sectionProgress.percentage === 100 && (
                        <svg
                          className="w-4 h-4 text-success-500"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      )}
                    </div>
                  </div>
                  {section.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {section.description}
                    </p>
                  )}
                  {/* Section Progress Bar */}
                  {sectionProgress.percentage > 0 &&
                    sectionProgress.percentage < 100 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-primary-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${sectionProgress.percentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                </div>

                {/* Section Lectures */}
                <div className="divide-y divide-gray-100">
                  {section.lectures.map((lecture, lectureIndex) => {
                    const lectureProgress = getLectureProgress(lecture.id);
                    const isActive = currentLectureId === lecture.id;
                    const isCompleted = lectureProgress?.is_completed || false;

                    return (
                      <button
                        key={lecture.id}
                        onClick={() => onLectureSelect(lecture.id)}
                        className={`w-full text-left p-4 transition-colors ${
                          isActive
                            ? "bg-primary-50 border-r-4 border-primary-600"
                            : isCompleted
                            ? "hover:bg-success-50"
                            : lectureProgress?.progress_percentage &&
                              lectureProgress.progress_percentage > 0
                            ? "hover:bg-primary-50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Lecture Status Icon */}
                          <div className="flex-shrink-0 mt-1">
                            {isCompleted ? (
                              <div className="w-5 h-5 bg-success-500 rounded-full flex items-center justify-center shadow-sm">
                                <svg
                                  className="w-3 h-3 text-white"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                </svg>
                              </div>
                            ) : lectureProgress?.progress_percentage &&
                              lectureProgress.progress_percentage > 0 ? (
                              <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center shadow-sm">
                                <div className="w-2 h-2 bg-white rounded-full" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded-full hover:border-primary-400 transition-colors" />
                            )}
                          </div>

                          {/* Lecture Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p
                                className={`text-sm font-medium truncate ${
                                  isActive
                                    ? "text-primary-700"
                                    : isCompleted
                                    ? "text-success-700"
                                    : "text-gray-900"
                                }`}
                              >
                                {lectureIndex + 1}. {lecture.title}
                              </p>
                              {isActive && (
                                <svg
                                  className="w-4 h-4 text-primary-600 flex-shrink-0 ml-2"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M8 5v14l11-7z" />
                                </svg>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-500">
                                {formatDuration(lecture.duration_minutes)}
                              </span>
                              {lectureProgress?.progress_percentage &&
                                lectureProgress.progress_percentage > 0 &&
                                !isCompleted && (
                                  <span className="text-xs text-primary-600 font-semibold">
                                    {Math.round(
                                      lectureProgress.progress_percentage
                                    )}
                                    %
                                  </span>
                                )}
                            </div>

                            {/* Progress Bar for Partially Watched */}
                            {lectureProgress?.progress_percentage &&
                              lectureProgress.progress_percentage > 0 &&
                              !isCompleted && (
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                  <div
                                    className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                                    style={{
                                      width: `${lectureProgress.progress_percentage}%`,
                                    }}
                                  />
                                </div>
                              )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {course.sections.length} sections •{" "}
              {course.sections.reduce(
                (total, section) => total + section.lectures.length,
                0
              )}{" "}
              lectures
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Total duration:{" "}
              {formatDuration(
                course.sections.reduce(
                  (total, section) =>
                    total +
                    section.lectures.reduce(
                      (sectionTotal, lecture) =>
                        sectionTotal + lecture.duration_minutes,
                      0
                    ),
                  0
                )
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}
    </>
  );
}
