"use client";

import React, { useState, useEffect } from "react";
import {
  QAQuestion,
  QAAnswer,
  QAQuestionCreate,
  QAAnswerCreate,
} from "../../types/qa";
import { qaService } from "../../services/qaService";
import { useAuth } from "../../contexts/AuthContext";

interface QADiscussionProps {
  lectureId: number;
  currentTime?: number;
  onQuestionCreated?: (question: QAQuestion) => void;
  onAnswerCreated?: (answer: QAAnswer) => void;
}

export function QADiscussion({
  lectureId,
  currentTime = 0,
  onQuestionCreated,
  onAnswerCreated,
}: QADiscussionProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QAQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // New question form
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [newQuestionTitle, setNewQuestionTitle] = useState("");
  const [newQuestionContent, setNewQuestionContent] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  // Answer forms
  const [answerForms, setAnswerForms] = useState<
    Record<number, { content: string; submitting: boolean }>
  >({});

  useEffect(() => {
    if (isExpanded) {
      loadQuestions();
    }
  }, [lectureId, isExpanded]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const lectureQuestions = await qaService.getLectureQuestions(lectureId);
      setQuestions(lectureQuestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async () => {
    if (!newQuestionTitle.trim() || !newQuestionContent.trim()) return;

    try {
      setSubmittingQuestion(true);
      const questionData: QAQuestionCreate = {
        lecture_id: lectureId,
        title: newQuestionTitle.trim(),
        content: newQuestionContent.trim(),
        timestamp: Math.floor(currentTime),
      };

      const newQuestion = await qaService.createQuestion(questionData);
      setQuestions([newQuestion, ...questions]);
      setNewQuestionTitle("");
      setNewQuestionContent("");
      setShowQuestionForm(false);
      onQuestionCreated?.(newQuestion);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create question"
      );
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const handleCreateAnswer = async (questionId: number) => {
    const answerForm = answerForms[questionId];
    if (!answerForm?.content.trim()) return;

    try {
      setAnswerForms((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], submitting: true },
      }));

      const answerData: QAAnswerCreate = {
        question_id: questionId,
        content: answerForm.content.trim(),
      };

      const newAnswer = await qaService.createAnswer(answerData);

      // Update the question with the new answer
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId ? { ...q, answers: [...q.answers, newAnswer] } : q
        )
      );

      // Clear the answer form
      setAnswerForms((prev) => {
        const newForms = { ...prev };
        delete newForms[questionId];
        return newForms;
      });

      onAnswerCreated?.(newAnswer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create answer");
    } finally {
      setAnswerForms((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], submitting: false },
      }));
    }
  };

  const startAnswering = (questionId: number) => {
    setAnswerForms((prev) => ({
      ...prev,
      [questionId]: { content: "", submitting: false },
    }));
  };

  const cancelAnswering = (questionId: number) => {
    setAnswerForms((prev) => {
      const newForms = { ...prev };
      delete newForms[questionId];
      return newForms;
    });
  };

  const updateAnswerContent = (questionId: number, content: string) => {
    setAnswerForms((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], content },
    }));
  };

  const formatTimestamp = (seconds?: number) => {
    if (!seconds) return "No timestamp";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">
            Q&A Discussion ({questions.length})
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

          {/* Ask Question Button */}
          <div className="mb-6">
            {!showQuestionForm ? (
              <button
                onClick={() => setShowQuestionForm(true)}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Ask a question about this lecture</span>
                </div>
              </button>
            ) : (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Ask a Question
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question Title
                    </label>
                    <input
                      type="text"
                      value={newQuestionTitle}
                      onChange={(e) => setNewQuestionTitle(e.target.value)}
                      placeholder="What's your question about?"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question Details
                    </label>
                    <textarea
                      value={newQuestionContent}
                      onChange={(e) => setNewQuestionContent(e.target.value)}
                      placeholder="Provide more details about your question..."
                      className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Timestamp: {formatTimestamp(Math.floor(currentTime))}
                    </span>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setShowQuestionForm(false);
                          setNewQuestionTitle("");
                          setNewQuestionContent("");
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateQuestion}
                        disabled={
                          !newQuestionTitle.trim() ||
                          !newQuestionContent.trim() ||
                          submittingQuestion
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingQuestion ? "Posting..." : "Post Question"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Questions List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : questions.length === 0 ? (
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
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-500">No questions yet</p>
              <p className="text-sm text-gray-400">
                Be the first to ask a question about this lecture
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question) => (
                <div
                  key={question.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {question.is_featured && (
                          <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                            Featured
                          </span>
                        )}
                        {question.is_answered && (
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            Answered
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatTimestamp(question.timestamp)} •{" "}
                      {formatDate(question.created_at)}
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="mb-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      {question.title}
                    </h4>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {question.content}
                    </p>
                    <div className="mt-2 text-sm text-gray-500">
                      Asked by {question.user_name}
                    </div>
                  </div>

                  {/* Answers */}
                  {question.answers.length > 0 && (
                    <div className="border-t border-gray-100 pt-4 space-y-4">
                      {question.answers.map((answer) => (
                        <div
                          key={answer.id}
                          className="bg-gray-50 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                {answer.user_name}
                              </span>
                              {answer.is_instructor_answer && (
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                  Instructor
                                </span>
                              )}
                              {answer.is_accepted && (
                                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                  Accepted
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500">
                              {formatDate(answer.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">
                            {answer.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Answer Form */}
                  {answerForms[question.id] ? (
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <div className="space-y-3">
                        <textarea
                          value={answerForms[question.id].content}
                          onChange={(e) =>
                            updateAnswerContent(question.id, e.target.value)
                          }
                          placeholder="Write your answer..."
                          className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          rows={3}
                        />
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => cancelAnswering(question.id)}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleCreateAnswer(question.id)}
                            disabled={
                              !answerForms[question.id].content.trim() ||
                              answerForms[question.id].submitting
                            }
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            {answerForms[question.id].submitting
                              ? "Posting..."
                              : "Post Answer"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-gray-100 pt-4 mt-4">
                      <button
                        onClick={() => startAnswering(question.id)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Answer this question
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
