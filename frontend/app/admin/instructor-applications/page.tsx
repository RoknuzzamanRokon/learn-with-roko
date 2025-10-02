"use client";

import { useState } from "react";
import {
  InstructorApplicationList,
  InstructorApplicationReviewModal,
} from "../../components/admin";
import {
  InstructorApplicationList as ApplicationListType,
  InstructorApplication,
} from "../../types/instructor-application";

export default function InstructorApplicationsPage() {
  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationListType | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleApplicationSelect = (application: ApplicationListType) => {
    setSelectedApplication(application);
    setIsReviewModalOpen(true);
  };

  const handleApplicationReview = (application: ApplicationListType) => {
    setSelectedApplication(application);
    setIsReviewModalOpen(true);
  };

  const handleApplicationReviewed = (application: InstructorApplication) => {
    // Refresh the list after review
    setRefreshTrigger((prev) => prev + 1);
    setIsReviewModalOpen(false);
    setSelectedApplication(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Instructor Applications
          </h1>
          <p className="mt-2 text-gray-600">
            Review and manage instructor role applications
          </p>
        </div>

        {/* Application List */}
        <InstructorApplicationList
          key={refreshTrigger} // Force re-render when refreshTrigger changes
          onApplicationSelect={handleApplicationSelect}
          onApplicationReview={handleApplicationReview}
        />

        {/* Review Modal */}
        <InstructorApplicationReviewModal
          application={selectedApplication}
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedApplication(null);
          }}
          onApplicationReviewed={handleApplicationReviewed}
        />
      </div>
    </div>
  );
}
