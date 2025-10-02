"use client";

import React, { useState, useEffect } from "react";
import {
  CourseSearchFilters,
  CourseListPaginatedResponse,
} from "../../types/course";
import { courseService } from "../../services/courseService";
import { CourseCard } from "./CourseCard";
import { CourseFilters } from "./CourseFilters";

export const CourseCatalog: React.FC = () => {
  const [courses, setCourses] = useState<CourseListPaginatedResponse | null>(
    null
  );
  const [filters, setFilters] = useState<CourseSearchFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const perPage = 12;

  useEffect(() => {
    loadCourses();
  }, [currentPage]);

  const loadCourses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await courseService.getCourseCatalog(
        filters,
        currentPage,
        perPage
      );
      setCourses(response);
    } catch (error) {
      console.error("Failed to load courses:", error);
      setError("Failed to load courses. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltersChange = (newFilters: CourseSearchFilters) => {
    setFilters(newFilters);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadCourses();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPagination = () => {
    if (!courses || courses.total_pages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    const startPage = Math.max(
      1,
      currentPage - Math.floor(maxVisiblePages / 2)
    );
    const endPage = Math.min(
      courses.total_pages,
      startPage + maxVisiblePages - 1
    );

    // Previous button
    if (courses.has_prev) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50"
        >
          Previous
        </button>
      );
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium border ${
            i === currentPage
              ? "bg-blue-600 text-white border-blue-600"
              : "text-gray-500 bg-white border-gray-300 hover:bg-gray-50"
          }`}
        >
          {i}
        </button>
      );
    }

    // Next button
    if (courses.has_next) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50"
        >
          Next
        </button>
      );
    }

    return (
      <div className="flex justify-center mt-8">
        <nav className="flex" aria-label="Pagination">
          {pages}
        </nav>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Course Catalog
        </h1>
        <p className="text-gray-600">
          Discover and enroll in courses to advance your skills and knowledge.
        </p>
      </div>

      {/* Filters */}
      <CourseFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onSearch={handleSearch}
      />

      {/* Results Summary */}
      {courses && (
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {courses.courses.length} of {courses.total} courses
            {currentPage > 1 &&
              ` (Page ${currentPage} of ${courses.total_pages})`}
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
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
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Course Grid */}
      {courses && courses.courses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {courses && courses.courses.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No courses found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria or filters.
          </p>
        </div>
      )}

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};
