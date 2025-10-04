/**
 * Service for quiz-related API operations
 */

import { getAuthHeaders } from '../utils/auth';

import {
    Quiz, QuizSummary, QuizCreate, QuizUpdate,
    Question, QuestionCreate, QuestionUpdate,
    QuizAttempt, QuizAttemptDetail, QuizAttemptSubmission, QuizResult
} from '../types/quiz';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class QuizService {
    private async getAuthHeaders(): Promise<HeadersInit> {
        const token = require('../utils/auth').getAuthToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        };
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    // Quiz management
    async createQuiz(quizData: QuizCreate): Promise<Quiz> {
        const response = await fetch(`${API_BASE_URL}/quizzes/`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(quizData),
        });

        return this.handleResponse<Quiz>(response);
    }

    async getCourseQuizzes(courseId: number): Promise<QuizSummary[]> {
        const response = await fetch(`${API_BASE_URL}/quizzes/course/${courseId}`, {
            method: 'GET',
            headers: await getAuthHeaders(),
        });

        return this.handleResponse<QuizSummary[]>(response);
    }

    async getQuiz(quizId: number): Promise<Quiz> {
        const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
            method: 'GET',
            headers: await getAuthHeaders(),
        });

        return this.handleResponse<Quiz>(response);
    }

    async updateQuiz(quizId: number, quizData: QuizUpdate): Promise<Quiz> {
        const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
            method: 'PUT',
            headers: await getAuthHeaders(),
            body: JSON.stringify(quizData),
        });

        return this.handleResponse<Quiz>(response);
    }

    async deleteQuiz(quizId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}`, {
            method: 'DELETE',
            headers: await getAuthHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
    }

    // Question management
    async addQuestion(quizId: number, questionData: QuestionCreate): Promise<Question> {
        const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/questions`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(questionData),
        });

        return this.handleResponse<Question>(response);
    }

    async updateQuestion(questionId: number, questionData: QuestionUpdate): Promise<Question> {
        const response = await fetch(`${API_BASE_URL}/quizzes/questions/${questionId}`, {
            method: 'PUT',
            headers: await getAuthHeaders(),
            body: JSON.stringify(questionData),
        });

        return this.handleResponse<Question>(response);
    }

    async deleteQuestion(questionId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/quizzes/questions/${questionId}`, {
            method: 'DELETE',
            headers: await getAuthHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
    }

    // Quiz attempts
    async startQuizAttempt(quizId: number): Promise<QuizAttempt> {
        const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/attempts`, {
            method: 'POST',
            headers: await getAuthHeaders(),
        });

        return this.handleResponse<QuizAttempt>(response);
    }

    async submitQuizAttempt(attemptId: number, submission: QuizAttemptSubmission): Promise<QuizResult> {
        const response = await fetch(`${API_BASE_URL}/quizzes/attempts/${attemptId}/submit`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(submission),
        });

        return this.handleResponse<QuizResult>(response);
    }

    async getQuizAttempt(attemptId: number): Promise<QuizAttemptDetail> {
        const response = await fetch(`${API_BASE_URL}/quizzes/attempts/${attemptId}`, {
            method: 'GET',
            headers: await getAuthHeaders(),
        });

        return this.handleResponse<QuizAttemptDetail>(response);
    }

    async getUserQuizAttempts(quizId: number): Promise<QuizAttempt[]> {
        const response = await fetch(`${API_BASE_URL}/quizzes/${quizId}/attempts`, {
            method: 'GET',
            headers: await getAuthHeaders(),
        });

        return this.handleResponse<QuizAttempt[]>(response);
    }

    // Utility methods
    formatTime(minutes: number): string {
        if (minutes < 60) {
            return `${minutes} min`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }

    formatScore(score: number): string {
        return `${Math.round(score)}%`;
    }

    getQuestionTypeLabel(type: string): string {
        switch (type) {
            case 'multiple_choice':
                return 'Multiple Choice';
            case 'true_false':
                return 'True/False';
            case 'short_answer':
                return 'Short Answer';
            case 'essay':
                return 'Essay';
            default:
                return type;
        }
    }

    getAttemptStatusColor(attempt: QuizAttempt): string {
        if (!attempt.is_completed) {
            return 'text-yellow-600 bg-yellow-100';
        }
        return attempt.is_passed
            ? 'text-green-600 bg-green-100'
            : 'text-red-600 bg-red-100';
    }

    getAttemptStatusText(attempt: QuizAttempt): string {
        if (!attempt.is_completed) {
            return 'In Progress';
        }
        return attempt.is_passed ? 'Passed' : 'Failed';
    }
}

export const quizService = new QuizService();