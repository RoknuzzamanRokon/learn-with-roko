"use client";

import React, { useState, useEffect } from "react";
import { CompletionStatus } from "../../types/certificate";
import { certificateService } from "../../services/certificateService";

interface CourseCompletionStatusProps {
  courseId: number;
  onCertificateGenerated?: () => void;
}

export const CourseCompletionStatus: React.FC<CourseCompletionStatusProps> = ({
  courseId,
  onCertificateGenerated,
}) => {
  const [completionStatus, setCompletionStatus] =
    useState<CompletionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkCompletion();
  }, [courseId]);

  const checkCompletion = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await certificateService.checkCourseCompletion(courseId);
      setCompletionStatus(status);
    } catch (err) {
      setError("Failed to check course completion status");
      console.error("Error checking completion:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCertificate = async () => {
    try {
      setGeneratingCertificate(true);
      setError(null);
      await certificateService.generateCertificate(courseId);
      onCertificateGenerated?.();
      // Refresh completion status
      await checkCompletion();
    } catch (err: any) {
      setError(err.message || "Failed to generate certificate");
      console.error("Error generating certificate:", err);
    } finally {
      setGeneratingCertificate(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error && !completionStatus) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">{error}</p>
        <button
          onClick={checkCompletion}
          className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!completionStatus) {
    return null;
  }

  const progressPercentage = Math.round(completionStatus.completion_percentage);
  const isCompleted = completionStatus.completed;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Course Progress</h3>
        <span className="text-sm font-medium text-gray-600">
          {progressPercentage}% Complete
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            isCompleted ? "bg-green-500" : "bg-blue-500"
          }`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      {/* Progress Details */}
      <div className="space-y-3 mb-4">
        {/* Lectures Progress */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center">
            <div
              className={`w-4 h-4 rounded-full mr-2 ${
                completionStatus.lectures_completed
                  ? "bg-green-500"
                  : "bg-gray-300"
              }`}
            >
              {completionStatus.lectures_completed && (
                <svg
                  className="w-3 h-3 text-white ml-0.5 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <span className="text-gray-700">Lectures</span>
          </div>
          <span className="text-gray-600">
            {completionStatus.lecture_progress.completed} /{" "}
            {completionStatus.lecture_progress.total}
          </span>
        </div>

        {/* Quizzes Progress */}
        {completionStatus.quiz_details.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div
                className={`w-4 h-4 rounded-full mr-2 ${
                  completionStatus.quizzes_passed
                    ? "bg-green-500"
                    : "bg-gray-300"
                }`}
              >
                {completionStatus.quizzes_passed && (
                  <svg
                    className="w-3 h-3 text-white ml-0.5 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <span className="text-gray-700">Quizzes</span>
            </div>
            <span className="text-gray-600">
              {completionStatus.quiz_details.filter((q) => q.passed).length} /{" "}
              {completionStatus.quiz_details.length}
            </span>
          </div>
        )}
      </div>

      {/* Quiz Details */}
      {completionStatus.quiz_details.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Quiz Results
          </h4>
          <div className="space-y-2">
            {completionStatus.quiz_details.map((quiz) => (
              <div
                key={quiz.quiz_id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600">{quiz.title}</span>
                <div className="flex items-center">
                  {typeof quiz.score === "number" && (
                    <span className="text-gray-500 mr-2">
                      {Math.round(quiz.score)}%
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      quiz.passed
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {quiz.passed ? "Passed" : "Not Passed"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completion Status */}
      {isCompleted ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <svg
              className="w-5 h-5 text-green-500 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-green-800 font-medium">
              Congratulations! Course Completed
            </span>
          </div>
          <p className="text-sm text-green-700 mb-3">
            You have successfully completed all requirements for this course.
          </p>
          <button
            onClick={handleGenerateCertificate}
            disabled={generatingCertificate}
            className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generatingCertificate ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating Certificate...
              </span>
            ) : (
              "Generate Certificate"
            )}
          </button>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <svg
              className="w-5 h-5 text-blue-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-blue-800 font-medium">Keep Going!</span>
          </div>
          <p className="text-sm text-blue-700">
            Complete all lectures and pass all quizzes to earn your certificate.
          </p>
        </div>
      )}
    </div>
  );
};
