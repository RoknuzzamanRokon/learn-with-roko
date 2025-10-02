"use client";

import React, { useState } from "react";
import {
  InstructorApplicationCreate,
  InstructorApplication,
} from "../../types/instructor-application";
import { instructorApplicationService } from "../../services/instructorApplicationService";
import { useAuth } from "../../contexts/AuthContext";

interface InstructorApplicationFormProps {
  onApplicationSubmitted?: (application: InstructorApplication) => void;
  onCancel?: () => void;
}

export function InstructorApplicationForm({
  onApplicationSubmitted,
  onCancel,
}: InstructorApplicationFormProps) {
  const { user, hasRole } = useAuth();
  const [formData, setFormData] = useState<InstructorApplicationCreate>({
    motivation: "",
    experience: "",
    expertise_areas: "",
    sample_course_outline: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user can apply
  const canApply = user && hasRole("learner");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const application = await instructorApplicationService.createApplication(
        formData
      );

      if (onApplicationSubmitted) {
        onApplicationSubmitted(application);
      }

      // Reset form
      setFormData({
        motivation: "",
        experience: "",
        expertise_areas: "",
        sample_course_outline: "",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to submit application"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!canApply) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Application Not Available
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                Only learners can apply to become instructors.
                {user?.role === "instructor" &&
                  " You are already an instructor."}
                {user?.role === "super_admin" &&
                  " Super admins cannot apply to become instructors."}
                {!user && " Please log in to apply."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Apply to Become an Instructor
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Share your experience and expertise to help others learn
          </p>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Why do you want to become an instructor? *
            </label>
            <textarea
              name="motivation"
              value={formData.motivation}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell us about your passion for teaching and what motivates you to share knowledge..."
              required
              minLength={50}
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.motivation.length}/2000 characters (minimum 50)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What is your relevant experience and background? *
            </label>
            <textarea
              name="experience"
              value={formData.experience}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your professional experience, education, certifications, and any teaching background..."
              required
              minLength={50}
              maxLength={2000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.experience.length}/2000 characters (minimum 50)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What areas do you want to teach? *
            </label>
            <textarea
              name="expertise_areas"
              value={formData.expertise_areas}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="List the subjects, technologies, or skills you want to teach (e.g., Web Development, Data Science, Photography)..."
              required
              minLength={20}
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.expertise_areas.length}/1000 characters (minimum 20)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sample Course Outline (Optional)
            </label>
            <textarea
              name="sample_course_outline"
              value={formData.sample_course_outline}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Provide a sample course outline or curriculum for a course you'd like to create. Include topics, learning objectives, and structure..."
              maxLength={3000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.sample_course_outline.length}/3000 characters (optional)
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Application Review Process
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Your application will be reviewed by our admin team. This
                    process typically takes 3-5 business days. You'll receive an
                    email notification once your application has been reviewed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={
                loading ||
                formData.motivation.length < 50 ||
                formData.experience.length < 50 ||
                formData.expertise_areas.length < 20
              }
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
