"use client";

import React, { useState, useEffect } from "react";
import {
  InstructorApplication,
  InstructorApplicationList,
  ApplicationStatus,
} from "../../types/instructor-application";
import { instructorApplicationService } from "../../services/instructorApplicationService";

interface InstructorApplicationReviewModalProps {
  application: InstructorApplicationList | null;
  isOpen: boolean;
  onClose: () => void;
  onApplicationReviewed: (application: InstructorApplication) => void;
}

export function InstructorApplicationReviewModal({
  application,
  isOpen,
  onClose,
  onApplicationReviewed,
}: InstructorApplicationReviewModalProps) {
  const [fullApplication, setFullApplication] =
    useState<InstructorApplication | null>(null);
  const [loading, setLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    if (application && isOpen) {
      loadFullApplication();
    }
  }, [application, isOpen]);

  const loadFullApplication = async () => {
    if (!application) return;

    try {
      setLoading(true);
      setError(null);
      const fullApp = await instructorApplicationService.getApplicationById(
        application.id
      );
      setFullApplication(fullApp);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load application details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status: ApplicationStatus) => {
    if (!application) return;

    try {
      setReviewLoading(true);
      setError(null);

      const reviewedApplication =
        await instructorApplicationService.reviewApplication(application.id, {
          status,
          review_notes: reviewNotes || undefined,
        });

      onApplicationReviewed(reviewedApplication);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to review application"
      );
    } finally {
      setReviewLoading(false);
    }
  };

  if (!isOpen || !application) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              Review Instructor Application
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">
                Loading application details...
              </p>
            </div>
          ) : fullApplication ? (
            <div className="space-y-6">
              {/* Applicant Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">
                  Applicant Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">
                      {fullApplication.applicant_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">
                      {fullApplication.applicant_email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Applied On</p>
                    <p className="font-medium">
                      {new Date(
                        fullApplication.created_at
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        fullApplication.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : fullApplication.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {fullApplication.status.charAt(0).toUpperCase() +
                        fullApplication.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Application Details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    Motivation
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {fullApplication.motivation}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    Experience & Background
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {fullApplication.experience}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    Expertise Areas
                  </h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {fullApplication.expertise_areas}
                    </p>
                  </div>
                </div>

                {fullApplication.sample_course_outline && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-2">
                      Sample Course Outline
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {fullApplication.sample_course_outline}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Review Section */}
              {fullApplication.status === "pending" && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">
                    Review Application
                  </h3>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Notes (Optional)
                    </label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add any notes about your decision..."
                      maxLength={1000}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {reviewNotes.length}/1000 characters
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => handleReview("rejected")}
                      disabled={reviewLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {reviewLoading ? "Processing..." : "Reject"}
                    </button>
                    <button
                      onClick={() => handleReview("approved")}
                      disabled={reviewLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {reviewLoading ? "Processing..." : "Approve"}
                    </button>
                  </div>
                </div>
              )}

              {/* Previous Review */}
              {fullApplication.status !== "pending" &&
                fullApplication.reviewed_at && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium mb-4">Review Details</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Reviewed By</p>
                          <p className="font-medium">
                            {fullApplication.reviewer_name || "Unknown"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Reviewed On</p>
                          <p className="font-medium">
                            {new Date(
                              fullApplication.reviewed_at
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      {fullApplication.review_notes && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">
                            Review Notes
                          </p>
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {fullApplication.review_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              {/* Close Button */}
              {fullApplication.status !== "pending" && (
                <div className="flex justify-end pt-6 border-t">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
