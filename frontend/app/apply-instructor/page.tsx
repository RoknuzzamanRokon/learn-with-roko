"use client";

import { useState } from "react";
import { InstructorApplicationForm } from "../components/instructor/InstructorApplicationForm";
import { InstructorApplication } from "../types/instructor-application";

export default function ApplyInstructorPage() {
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [submittedApplication, setSubmittedApplication] =
    useState<InstructorApplication | null>(null);

  const handleApplicationSubmitted = (application: InstructorApplication) => {
    setSubmittedApplication(application);
    setApplicationSubmitted(true);
  };

  if (applicationSubmitted && submittedApplication) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Application Submitted Successfully!
            </h1>
            <p className="text-gray-600 mb-6">
              Thank you for applying to become an instructor. Your application
              has been submitted and is now under review.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
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
                    What happens next?
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        Our admin team will review your application within 3-5
                        business days
                      </li>
                      <li>
                        You'll receive an email notification once the review is
                        complete
                      </li>
                      <li>
                        If approved, your account will be upgraded to instructor
                        status
                      </li>
                      <li>
                        You can then start creating and publishing courses
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-x-4">
              <a
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Go to Dashboard
              </a>
              <button
                onClick={() => {
                  setApplicationSubmitted(false);
                  setSubmittedApplication(null);
                }}
                className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Submit Another Application
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Become an Instructor
          </h1>
          <p className="mt-2 text-gray-600">
            Share your knowledge and expertise with learners around the world
          </p>
        </div>

        <InstructorApplicationForm
          onApplicationSubmitted={handleApplicationSubmitted}
        />
      </div>
    </div>
  );
}
