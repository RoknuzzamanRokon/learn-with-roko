"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Course,
  CourseCreate,
  CourseUpdate,
  CourseFormData,
  CourseCategory,
  DifficultyLevel,
} from "../../types/course";
import { courseService } from "../../services/courseService";
import FileUpload from "./FileUpload";

interface CourseBuilderProps {
  course?: Course;
  onSave?: (course: Course) => void;
  onCancel?: () => void;
}

const DIFFICULTY_OPTIONS: { value: DifficultyLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
];

export default function CourseBuilder({
  course,
  onSave,
  onCancel,
}: CourseBuilderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [formData, setFormData] = useState<CourseFormData>({
    title: course?.title || "",
    description: course?.description || "",
    short_description: course?.short_description || "",
    category_id: course?.category_id?.toString() || "",
    price: course?.price?.toString() || "0",
    difficulty_level: course?.difficulty_level || "beginner",
    language: course?.language || "en",
    thumbnail_url: course?.thumbnail_url || "",
    preview_video_url: course?.preview_video_url || "",
    allow_qa: course?.allow_qa ?? true,
    allow_notes: course?.allow_notes ?? true,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const categoriesData = await courseService.getCategories();
      setCategories(categoriesData);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError("Course title is required");
      return false;
    }
    if (!formData.description.trim()) {
      setError("Course description is required");
      return false;
    }
    if (isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      setError("Price must be a valid number greater than or equal to 0");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const courseData: CourseCreate | CourseUpdate = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        short_description: formData.short_description.trim() || undefined,
        category_id: formData.category_id
          ? parseInt(formData.category_id)
          : undefined,
        price: parseFloat(formData.price),
        difficulty_level: formData.difficulty_level,
        language: formData.language,
        thumbnail_url: formData.thumbnail_url.trim() || undefined,
        preview_video_url: formData.preview_video_url.trim() || undefined,
        allow_qa: formData.allow_qa,
        allow_notes: formData.allow_notes,
      };

      let savedCourse: Course;
      if (course) {
        // Update existing course
        savedCourse = await courseService.updateCourse(course.id, courseData);
      } else {
        // Create new course
        savedCourse = await courseService.createCourse(
          courseData as CourseCreate
        );
      }

      if (onSave) {
        onSave(savedCourse);
      } else {
        router.push(`/instructor/courses/${savedCourse.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-[var(--gray-200)] p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-[var(--gray-900)]">
            {course ? "Edit Course" : "Create New Course"}
          </h1>
          {course && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-[var(--gray-600)]">Status:</span>
              <span
                className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                  course.is_published
                    ? "bg-[var(--success-100)] text-[var(--success-800)] border-[var(--success-200)]"
                    : course.status === "draft"
                    ? "bg-[var(--warning-100)] text-[var(--warning-800)] border-[var(--warning-200)]"
                    : "bg-[var(--gray-100)] text-[var(--gray-800)] border-[var(--gray-200)]"
                }`}
              >
                {course.is_published
                  ? "Published"
                  : course.status === "draft"
                  ? "Draft"
                  : "Archived"}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-[var(--error-50)] border border-[var(--error-200)] rounded-md">
            <div className="flex items-center">
              <span className="text-[var(--error-600)] mr-2">⚠️</span>
              <p className="text-[var(--error-800)] font-medium">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-[var(--gray-50)] p-6 rounded-lg border border-[var(--gray-200)]">
            <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-4">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-[var(--gray-700)] mb-2"
                >
                  Course Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-[var(--gray-300)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition-colors"
                  placeholder="Enter course title"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="short_description"
                  className="block text-sm font-medium text-[var(--gray-700)] mb-2"
                >
                  Short Description
                </label>
                <input
                  type="text"
                  id="short_description"
                  name="short_description"
                  value={formData.short_description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-[var(--gray-300)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition-colors"
                  placeholder="Brief description for course cards"
                  maxLength={500}
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-[var(--gray-700)] mb-2"
                >
                  Course Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-[var(--gray-300)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition-colors"
                  placeholder="Detailed course description"
                  required
                />
              </div>
            </div>
          </div>

          {/* Course Details */}
          <div className="bg-[var(--gray-50)] p-6 rounded-lg border border-[var(--gray-200)]">
            <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-4">
              Course Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="category_id"
                  className="block text-sm font-medium text-[var(--gray-700)] mb-2"
                >
                  Category
                </label>
                <select
                  id="category_id"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-[var(--gray-300)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition-colors"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-[var(--gray-700)] mb-2"
                >
                  Price ($) *
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-[var(--gray-300)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition-colors"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="difficulty_level"
                  className="block text-sm font-medium text-[var(--gray-700)] mb-2"
                >
                  Difficulty Level
                </label>
                <select
                  id="difficulty_level"
                  name="difficulty_level"
                  value={formData.difficulty_level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-[var(--gray-300)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition-colors"
                >
                  {DIFFICULTY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="language"
                  className="block text-sm font-medium text-[var(--gray-700)] mb-2"
                >
                  Language
                </label>
                <select
                  id="language"
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-[var(--gray-300)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition-colors"
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Media URLs */}
          <div className="bg-[var(--gray-50)] p-6 rounded-lg border border-[var(--gray-200)]">
            <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-4">
              Media
            </h3>
            <div className="space-y-6">
              <div>
                <label
                  htmlFor="thumbnail_url"
                  className="block text-sm font-medium text-[var(--gray-700)] mb-2"
                >
                  Thumbnail URL
                </label>
                <input
                  type="url"
                  id="thumbnail_url"
                  name="thumbnail_url"
                  value={formData.thumbnail_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-[var(--gray-300)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition-colors"
                  placeholder="https://example.com/thumbnail.jpg or upload below"
                />
                <div className="mt-3 p-4 bg-white border border-[var(--gray-200)] rounded-md">
                  <FileUpload
                    onFileUploaded={(fileInfo) => {
                      setFormData((prev) => ({
                        ...prev,
                        thumbnail_url: fileInfo.url,
                      }));
                    }}
                    acceptedTypes="image/*"
                    maxSize={10}
                    multiple={false}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="preview_video_url"
                  className="block text-sm font-medium text-[var(--gray-700)] mb-2"
                >
                  Preview Video URL
                </label>
                <input
                  type="url"
                  id="preview_video_url"
                  name="preview_video_url"
                  value={formData.preview_video_url}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-[var(--gray-300)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-[var(--primary-500)] transition-colors"
                  placeholder="https://example.com/preview.mp4 or upload below"
                />
                <div className="mt-3 p-4 bg-white border border-[var(--gray-200)] rounded-md">
                  <FileUpload
                    onFileUploaded={(fileInfo) => {
                      setFormData((prev) => ({
                        ...prev,
                        preview_video_url: fileInfo.url,
                      }));
                    }}
                    acceptedTypes="video/*"
                    maxSize={50}
                    multiple={false}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Course Settings */}
          <div className="bg-[var(--gray-50)] p-6 rounded-lg border border-[var(--gray-200)]">
            <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-4">
              Course Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center p-3 bg-white border border-[var(--gray-200)] rounded-md hover:bg-[var(--gray-50)] transition-colors">
                <input
                  type="checkbox"
                  name="allow_qa"
                  checked={formData.allow_qa}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-[var(--primary-600)] focus:ring-[var(--primary-500)] border-[var(--gray-300)] rounded"
                />
                <span className="ml-3 text-sm font-medium text-[var(--gray-700)]">
                  Allow Q&A
                </span>
                <span className="ml-2 text-xs text-[var(--gray-500)]">
                  Students can ask questions
                </span>
              </label>

              <label className="flex items-center p-3 bg-white border border-[var(--gray-200)] rounded-md hover:bg-[var(--gray-50)] transition-colors">
                <input
                  type="checkbox"
                  name="allow_notes"
                  checked={formData.allow_notes}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-[var(--primary-600)] focus:ring-[var(--primary-500)] border-[var(--gray-300)] rounded"
                />
                <span className="ml-3 text-sm font-medium text-[var(--gray-700)]">
                  Allow Notes
                </span>
                <span className="ml-2 text-xs text-[var(--gray-500)]">
                  Students can take notes
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-[var(--gray-200)]">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-2 text-sm font-medium text-[var(--gray-700)] bg-white border border-[var(--gray-300)] rounded-md hover:bg-[var(--gray-50)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--gray-500)] transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 text-sm font-medium text-white bg-[var(--primary-600)] border border-transparent rounded-md hover:bg-[var(--primary-700)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--primary-500)] disabled:opacity-50 transition-colors"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : course ? (
                "Update Course"
              ) : (
                "Create Course"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
