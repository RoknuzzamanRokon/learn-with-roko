"use client";

import React from "react";
import Link from "next/link";
import { Course } from "../../types/course";

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
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

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Course Thumbnail */}
      <div className="relative h-48 bg-gray-200">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
            <span className="text-white text-xl font-semibold">
              {course.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {course.is_featured && (
          <div className="absolute top-2 left-2">
            <span className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-semibold">
              Featured
            </span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(
              course.difficulty_level
            )}`}
          >
            {course.difficulty_level.charAt(0).toUpperCase() +
              course.difficulty_level.slice(1)}
          </span>
        </div>
      </div>

      {/* Course Content */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {course.short_description || course.description}
        </p>

        {/* Course Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
          <div className="flex items-center space-x-4">
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
          </div>
        </div>

        {/* Price and Action */}
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-gray-900">
            {formatPrice(course.price)}
          </div>
          <Link
            href={`/catalog/${course.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
          >
            View Course
          </Link>
        </div>
      </div>
    </div>
  );
};
