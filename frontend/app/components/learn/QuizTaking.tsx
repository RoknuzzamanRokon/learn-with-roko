"use client";

import React, { useState, useEffect } from "react";
import {
  Quiz,
  QuizAttempt,
  QuizAttemptAnswer,
  QuizResult,
  Question,
} from "../../types/quiz";
import { quizService } from "../../services/quizService";

interface QuizTakingProps {
  quiz: Quiz;
  onQuizCompleted?: (result: QuizResult) => void;
  onQuizCancelled?: () => void;
}

export function QuizTaking({
  quiz,
  onQuizCompleted,
  onQuizCancelled,
}: QuizTakingProps) {
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(
    null
  );
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer effect
  useEffect(() => {
    if (
      quiz.time_limit &&
      currentAttempt &&
      timeRemaining !== null &&
      timeRemaining > 0
    ) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            // Time's up - auto submit
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz.time_limit, currentAttempt, timeRemaining]);

  useEffect(() => {
    startQuizAttempt();
  }, []);

  const startQuizAttempt = async () => {
    try {
      setLoading(true);
      const attempt = await quizService.startQuizAttempt(quiz.id);
      setCurrentAttempt(attempt);

      // Set timer if quiz has time limit
      if (quiz.time_limit) {
        setTimeRemaining(quiz.time_limit * 60); // Convert minutes to seconds
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start quiz");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!currentAttempt || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const submission = {
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          question_id: parseInt(questionId),
          answer,
        })),
      };

      const result = await quizService.submitQuizAttempt(
        currentAttempt.id,
        submission
      );
      onQuizCompleted?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit quiz");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getTimeColor = (): string => {
    if (!timeRemaining || !quiz.time_limit) return "text-gray-600";
    const percentage = timeRemaining / (quiz.time_limit * 60);
    if (percentage > 0.5) return "text-green-600";
    if (percentage > 0.25) return "text-yellow-600";
    return "text-red-600";
  };

  const renderQuestion = (question: Question, index: number) => {
    const userAnswer = answers[question.id] || "";

    return (
      <div key={question.id} className="space-y-4">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Question {index + 1} of {quiz.questions.length}
          </h3>
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {question.points} {question.points === 1 ? "point" : "points"}
          </span>
        </div>

        <div className="prose max-w-none">
          <p className="text-gray-900">{question.question_text}</p>
        </div>

        <div className="space-y-3">
          {question.question_type === "multiple_choice" && question.options && (
            <div className="space-y-2">
              {question.options.map((option, optionIndex) => (
                <label
                  key={optionIndex}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={userAnswer === option}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          )}

          {question.question_type === "true_false" && (
            <div className="space-y-2">
              {["true", "false"].map((option) => (
                <label
                  key={option}
                  className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={userAnswer === option}
                    onChange={(e) =>
                      handleAnswerChange(question.id, e.target.value)
                    }
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-gray-900 capitalize">{option}</span>
                </label>
              ))}
            </div>
          )}

          {(question.question_type === "short_answer" ||
            question.question_type === "essay") && (
            <textarea
              value={userAnswer}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder="Enter your answer..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={question.question_type === "essay" ? 6 : 3}
            />
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Starting quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
            <button
              onClick={onQuizCancelled}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentAttempt) {
    return null;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const answeredQuestions = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {quiz.title}
            </h1>
            <p className="text-sm text-gray-600">
              Attempt {currentAttempt.attempt_number} of {quiz.max_attempts}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {timeRemaining !== null && (
              <div className={`text-sm font-medium ${getTimeColor()}`}>
                Time remaining: {formatTime(timeRemaining)}
              </div>
            )}
            <div className="text-sm text-gray-600">
              {answeredQuestions} of {quiz.questions.length} answered
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${
                ((currentQuestionIndex + 1) / quiz.questions.length) * 100
              }%`,
            }}
          />
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {renderQuestion(currentQuestion, currentQuestionIndex)}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() =>
                setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))
              }
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="flex space-x-3">
              {!isLastQuestion ? (
                <button
                  onClick={() =>
                    setCurrentQuestionIndex(
                      Math.min(
                        quiz.questions.length - 1,
                        currentQuestionIndex + 1
                      )
                    )
                  }
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Submit Quiz"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Question Navigation */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Question Navigation
          </h3>
          <div className="grid grid-cols-10 gap-2">
            {quiz.questions.map((question, index) => (
              <button
                key={question.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-8 h-8 text-xs rounded ${
                  index === currentQuestionIndex
                    ? "bg-blue-600 text-white"
                    : answers[question.id]
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : "bg-gray-100 text-gray-600 border border-gray-300"
                } hover:bg-opacity-80 transition-colors`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
