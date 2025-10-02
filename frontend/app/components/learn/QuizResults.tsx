"use client";

import React from "react";
import { QuizResult } from "../../types/quiz";

interface QuizResultsProps {
  result: QuizResult;
  onRetakeQuiz?: () => void;
  onBackToCourse?: () => void;
}

export function QuizResults({
  result,
  onRetakeQuiz,
  onBackToCourse,
}: QuizResultsProps) {
  const { attempt, questions, can_retake } = result;

  const formatScore = (score: number): string => {
    return `${Math.round(score)}%`;
  };

  const getScoreColor = (score: number, passingScore: number): string => {
    return score >= passingScore ? "text-green-600" : "text-red-600";
  };

  const getScoreBgColor = (score: number, passingScore: number): string => {
    return score >= passingScore
      ? "bg-green-50 border-green-200"
      : "bg-red-50 border-red-200";
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours !== 1 ? "s" : ""} ${remainingMinutes} minute${
      remainingMinutes !== 1 ? "s" : ""
    }`;
  };

  const correctAnswers = questions.filter((q) => q.is_correct).length;
  const totalQuestions = questions.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">Quiz Results</h1>
          <p className="text-gray-600">Attempt {attempt.attempt_number}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Score Summary */}
        <div
          className={`bg-white rounded-lg shadow-md p-6 mb-6 border-2 ${getScoreBgColor(
            attempt.score || 0,
            70
          )}`}
        >
          <div className="text-center">
            <div
              className={`text-6xl font-bold mb-2 ${getScoreColor(
                attempt.score || 0,
                70
              )}`}
            >
              {formatScore(attempt.score || 0)}
            </div>
            <div className="text-xl font-semibold text-gray-900 mb-2">
              {attempt.is_passed
                ? "🎉 Congratulations! You passed!"
                : "😔 You did not pass this time"}
            </div>
            <div className="text-gray-600 mb-4">
              You answered {correctAnswers} out of {totalQuestions} questions
              correctly
            </div>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
              <div>
                <span className="font-medium">Score:</span>{" "}
                {attempt.earned_points} / {attempt.total_points} points
              </div>
              {attempt.time_taken && (
                <div>
                  <span className="font-medium">Time taken:</span>{" "}
                  {formatTime(attempt.time_taken)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {can_retake && (
            <button
              onClick={onRetakeQuiz}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Retake Quiz
            </button>
          )}
          <button
            onClick={onBackToCourse}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
          >
            Back to Course
          </button>
        </div>

        {/* Question Review */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Question Review
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {questions.map((question, index) => (
              <div key={question.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Question {index + 1}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        question.is_correct
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {question.is_correct ? "Correct" : "Incorrect"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {question.points}{" "}
                      {question.points === 1 ? "point" : "points"}
                    </span>
                  </div>
                </div>

                <div className="prose max-w-none mb-4">
                  <p className="text-gray-900">{question.question_text}</p>
                </div>

                {/* Multiple Choice Options */}
                {question.question_type === "multiple_choice" &&
                  question.options && (
                    <div className="space-y-2 mb-4">
                      {question.options.map((option, optionIndex) => (
                        <div
                          key={optionIndex}
                          className={`p-3 border rounded-lg ${
                            option === question.user_answer &&
                            option === question.correct_answer
                              ? "bg-green-50 border-green-300"
                              : option === question.user_answer &&
                                option !== question.correct_answer
                              ? "bg-red-50 border-red-300"
                              : option === question.correct_answer
                              ? "bg-green-50 border-green-300"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-900">{option}</span>
                            <div className="flex items-center space-x-2">
                              {option === question.user_answer && (
                                <span className="text-xs text-blue-600 font-medium">
                                  Your answer
                                </span>
                              )}
                              {option === question.correct_answer && (
                                <span className="text-xs text-green-600 font-medium">
                                  Correct
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                {/* True/False */}
                {question.question_type === "true_false" && (
                  <div className="space-y-2 mb-4">
                    {["true", "false"].map((option) => (
                      <div
                        key={option}
                        className={`p-3 border rounded-lg ${
                          option === question.user_answer &&
                          option === question.correct_answer
                            ? "bg-green-50 border-green-300"
                            : option === question.user_answer &&
                              option !== question.correct_answer
                            ? "bg-red-50 border-red-300"
                            : option === question.correct_answer
                            ? "bg-green-50 border-green-300"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 capitalize">
                            {option}
                          </span>
                          <div className="flex items-center space-x-2">
                            {option === question.user_answer && (
                              <span className="text-xs text-blue-600 font-medium">
                                Your answer
                              </span>
                            )}
                            {option === question.correct_answer && (
                              <span className="text-xs text-green-600 font-medium">
                                Correct
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Short Answer / Essay */}
                {(question.question_type === "short_answer" ||
                  question.question_type === "essay") && (
                  <div className="space-y-3 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Answer:
                      </label>
                      <div
                        className={`p-3 border rounded-lg ${
                          question.is_correct
                            ? "bg-green-50 border-green-300"
                            : "bg-red-50 border-red-300"
                        }`}
                      >
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {question.user_answer || "No answer provided"}
                        </p>
                      </div>
                    </div>
                    {question.correct_answer && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Correct Answer:
                        </label>
                        <div className="p-3 bg-green-50 border border-green-300 rounded-lg">
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {question.correct_answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Explanation */}
                {question.explanation && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">
                      Explanation:
                    </h4>
                    <p className="text-blue-800 text-sm">
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
