"use client";

import React, { useState, useEffect } from "react";
import {
  CourseSearchFilters,
  CourseCategory,
  DifficultyLevel,
} from "../../types/course";
import { courseService } from "../../services/courseService";

interface CourseFiltersProps {
  filters: CourseSearchFilters;
  onFiltersChange: (filters: CourseSearchFilters) => void;
  onSearch: () => void;
}

export const CourseFilters: React.FC<CourseFiltersProps> = ({
  filters,
  onFiltersChange,
  onSearch,
}) => {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const categoriesData = await courseService.getCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof CourseSearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  const clearFilters = () => {
    onFiltersChange({});
    onSearch();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <form onSubmit={handleSearchSubmit} className="space-y-4">
        {/* Search Input */}
        <div>
          <label
            htmlFor="search"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Search Courses
          </label>
          <div className="relative">
            <input
              type="text"
              id="search"
              value={filters.search || ""}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              placeholder="Search by title or description..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Category Filter */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category
            </label>
            <select
              id="category"
              value={filters.category_id || ""}
              onChange={(e) =>
                handleFilterChange(
                  "category_id",
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label
              htmlFor="difficulty"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Difficulty
            </label>
            <select
              id="difficulty"
              value={filters.difficulty_level || ""}
              onChange={(e) =>
                handleFilterChange(
                  "difficulty_level",
                  (e.target.value as DifficultyLevel) || undefined
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Price Filter */}
          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Price
            </label>
            <select
              id="price"
              value={
                filters.is_free !== undefined
                  ? filters.is_free
                    ? "free"
                    : "paid"
                  : ""
              }
              onChange={(e) => {
                if (e.target.value === "free") {
                  handleFilterChange("is_free", true);
                } else if (e.target.value === "paid") {
                  handleFilterChange("is_free", false);
                } else {
                  handleFilterChange("is_free", undefined);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Courses</option>
              <option value="free">Free Only</option>
              <option value="paid">Paid Only</option>
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price Range
            </label>
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.min_price || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "min_price",
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                min="0"
                step="0.01"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.max_price || ""}
                onChange={(e) =>
                  handleFilterChange(
                    "max_price",
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200"
          >
            Search Courses
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-md font-medium transition-colors duration-200"
          >
            Clear Filters
          </button>
        </div>
      </form>
    </div>
  );
};
