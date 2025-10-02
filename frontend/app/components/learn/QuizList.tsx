"use client";

import React, { useState, useEffect } from "react";
import { QuizSummary, QuizAttempt } from "../../types/quiz";
import { quizService } from "../../services/quizService";

interface QuizListProps {
  courseId: number;
  onQuizSelect?: (quiz: QuizSummary) => void;
}

export function QuizList({ courseId, onQuizSelect }: QuizListProps) {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<
    Record<number, QuizAttempt[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadQuizzes();
  }, [courseId]);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      const courseQuizzes = await quizService.getCourseQuizzes(courseId);
      setQuizzes(courseQuizzes);

      // Load attempts for each quiz
      const attempts: Record<number, QuizAttempt[]> = {};
      for (const quiz of courseQuizzes) {
        try {
          const userAttempts = await quizService.getUserQuizAttempts(quiz.id);
          attempts[quiz.id] = userAttempts;
        } catch (err) {
          // If no attempts found, that's okay
          attempts[quiz.id] = [];
        }
      }
      setQuizAttempts(attempts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quizzes");
    } finally {
      setLoading(false);
    }
  };

  const getBestAttempt = (attempts: QuizAttempt[]): QuizAttempt | null => {
    if (attempts.length === 0) return null;
    return attempts.reduce((best, current) =>
      (current.score || 0) > (best.score || 0) ? current : best
    );
  };

  const getQuizStatus = (quiz: QuizSummary, attempts: QuizAttempt[]) => {
    if (attempts.length === 0) {
      return { text: "Not Started", color: "text-gray-600 bg-gray-100" };
    }

    const bestAttempt = getBestAttempt(attempts);
    if (!bestAttempt) {
      return { text: "Not Started", color: "text-gray-600 bg-gray-100" };
    }

    if (bestAttempt.is_passed) {
      return { text: "Passed", color: "text-green-600 bg-green-100" };
    }

    if (attempts.length >= quiz.max_attempts) {
      return { text: "Failed", color: "text-red-600 bg-red-100" };
    }

    return { text: "In Progress", color: "text-yellow-600 bg-yellow-100" };
  };

  const canTakeQuiz = (quiz: QuizSummary, attempts: QuizAttempt[]): boolean => {
    if (attempts.length === 0) return true;

    const bestAttempt = getBestAttempt(attempts);
    if (bestAttempt?.is_passed) return false; // Already passed

    return attempts.length < quiz.max_attempts;
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (quizzes.length === 0 && !loading) {
    return null; // Don't show the component if there are no quizzes
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">
            Quizzes ({quizzes.length})
          </h3>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-xs text-red-500 hover:text-red-700"
              >
                Dismiss
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 text-gray-300 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500">No quizzes available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => {
                const attempts = quizAttempts[quiz.id] || [];
                const status = getQuizStatus(quiz, attempts);
                const bestAttempt = getBestAttempt(attempts);
                const canTake = canTakeQuiz(quiz, attempts);

                return (
                  <div
                    key={quiz.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {quiz.title}
                          </h4>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}
                          >
                            {status.text}
                          </span>
                        </div>

                        {quiz.description && (
                          <p className="text-gray-600 mb-3">
                            {quiz.description}
                          </p>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                          <span>{quiz.question_count} questions</span>
                          <span>•</span>
                          <span>{quiz.total_points} points</span>
                          {quiz.time_limit && (
                            <>
                              <span>•</span>
                              <span>
                                {formatTime(quiz.time_limit)} time limit
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>
                            {quiz.max_attempts} attempt
                            {quiz.max_attempts !== 1 ? "s" : ""} allowed
                          </span>
                          <span>•</span>
                          <span>{quiz.passing_score}% to pass</span>
                        </div>

                        {bestAttempt && (
                          <div className="text-sm text-gray-600 mb-3">
                            Best score: {Math.round(bestAttempt.score || 0)}% (
                            {attempts.length} of {quiz.max_attempts} attempts
                            used)
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        {canTake ? (
                          <button
                            onClick={() => onQuizSelect?.(quiz)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                          >
                            {attempts.length === 0
                              ? "Start Quiz"
                              : "Retake Quiz"}
                          </button>
                        ) : (
                          <span className="px-4 py-2 bg-gray-100 text-gray-500 rounded-md text-sm">
                            {bestAttempt?.is_passed
                              ? "Completed"
                              : "No attempts left"}
                          </span>
                        )}

                        {attempts.length > 0 && (
                          <button
                            onClick={() => {
                              // Could implement viewing past attempts
                              console.log("View attempts for quiz:", quiz.id);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            View attempts
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
