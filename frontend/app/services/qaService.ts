/**
 * Service for Q&A and discussion API operations
 */

import {
    QAQuestion, QAQuestionCreate, QAQuestionUpdate, QAQuestionListResponse,
    QAAnswer, QAAnswerCreate, QAAnswerUpdate,
    QASearchFilters, QAModerationAction, QAAnswerModerationAction
} from '../types/qa';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class QAService {
    private async getAuthHeaders(): Promise<HeadersInit> {
        const token = localStorage.getItem('access_token');
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

    // Question management
    async createQuestion(questionData: QAQuestionCreate): Promise<QAQuestion> {
        const response = await fetch(`${API_BASE_URL}/qa/questions`, {
            method: 'POST',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(questionData),
        });

        return this.handleResponse<QAQuestion>(response);
    }

    async getQuestions(filters: QASearchFilters = {}): Promise<QAQuestionListResponse> {
        const params = new URLSearchParams();

        if (filters.lecture_id) params.append('lecture_id', filters.lecture_id.toString());
        if (filters.course_id) params.append('course_id', filters.course_id.toString());
        if (filters.is_answered !== undefined) params.append('is_answered', filters.is_answered.toString());
        if (filters.is_featured !== undefined) params.append('is_featured', filters.is_featured.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.per_page) params.append('per_page', filters.per_page.toString());

        const response = await fetch(`${API_BASE_URL}/qa/questions?${params}`, {
            method: 'GET',
            headers: await this.getAuthHeaders(),
        });

        return this.handleResponse<QAQuestionListResponse>(response);
    }

    async getLectureQuestions(lectureId: number): Promise<QAQuestion[]> {
        const response = await fetch(`${API_BASE_URL}/qa/questions/lecture/${lectureId}`, {
            method: 'GET',
            headers: await this.getAuthHeaders(),
        });

        return this.handleResponse<QAQuestion[]>(response);
    }

    async getQuestion(questionId: number): Promise<QAQuestion> {
        const response = await fetch(`${API_BASE_URL}/qa/questions/${questionId}`, {
            method: 'GET',
            headers: await this.getAuthHeaders(),
        });

        return this.handleResponse<QAQuestion>(response);
    }

    async updateQuestion(questionId: number, questionData: QAQuestionUpdate): Promise<QAQuestion> {
        const response = await fetch(`${API_BASE_URL}/qa/questions/${questionId}`, {
            method: 'PUT',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(questionData),
        });

        return this.handleResponse<QAQuestion>(response);
    }

    async deleteQuestion(questionId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/qa/questions/${questionId}`, {
            method: 'DELETE',
            headers: await this.getAuthHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
    }

    // Answer management
    async createAnswer(answerData: QAAnswerCreate): Promise<QAAnswer> {
        const response = await fetch(`${API_BASE_URL}/qa/answers`, {
            method: 'POST',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(answerData),
        });

        return this.handleResponse<QAAnswer>(response);
    }

    async updateAnswer(answerId: number, answerData: QAAnswerUpdate): Promise<QAAnswer> {
        const response = await fetch(`${API_BASE_URL}/qa/answers/${answerId}`, {
            method: 'PUT',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(answerData),
        });

        return this.handleResponse<QAAnswer>(response);
    }

    async deleteAnswer(answerId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/qa/answers/${answerId}`, {
            method: 'DELETE',
            headers: await this.getAuthHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
    }

    // Moderation
    async moderateQuestion(questionId: number, moderationData: QAModerationAction): Promise<QAQuestion> {
        const response = await fetch(`${API_BASE_URL}/qa/questions/${questionId}/moderate`, {
            method: 'PUT',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(moderationData),
        });

        return this.handleResponse<QAQuestion>(response);
    }

    async moderateAnswer(answerId: number, moderationData: QAAnswerModerationAction): Promise<QAAnswer> {
        const response = await fetch(`${API_BASE_URL}/qa/answers/${answerId}/moderate`, {
            method: 'PUT',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(moderationData),
        });

        return this.handleResponse<QAAnswer>(response);
    }

    // Utility methods
    formatTimestamp(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    parseTimestamp(timeString: string): number {
        const parts = timeString.split(':');
        if (parts.length === 2) {
            const minutes = parseInt(parts[0], 10);
            const seconds = parseInt(parts[1], 10);
            return minutes * 60 + seconds;
        }
        return 0;
    }

    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    getQuestionStatusColor(question: QAQuestion): string {
        if (question.is_featured) {
            return 'text-yellow-600 bg-yellow-100';
        }
        if (question.is_answered) {
            return 'text-green-600 bg-green-100';
        }
        return 'text-gray-600 bg-gray-100';
    }

    getQuestionStatusText(question: QAQuestion): string {
        if (question.is_featured) {
            return 'Featured';
        }
        if (question.is_answered) {
            return 'Answered';
        }
        return 'Unanswered';
    }

    getAnswerTypeColor(answer: QAAnswer): string {
        if (answer.is_instructor_answer) {
            return 'text-blue-600 bg-blue-100';
        }
        if (answer.is_accepted) {
            return 'text-green-600 bg-green-100';
        }
        return 'text-gray-600 bg-gray-100';
    }

    getAnswerTypeText(answer: QAAnswer): string {
        if (answer.is_instructor_answer) {
            return 'Instructor';
        }
        if (answer.is_accepted) {
            return 'Accepted';
        }
        return 'Student';
    }
}

export const qaService = new QAService();