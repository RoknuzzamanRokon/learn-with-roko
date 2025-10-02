/**
 * Instructor application API service
 */

import {
    InstructorApplication,
    InstructorApplicationCreate,
    InstructorApplicationUpdate,
    InstructorApplicationReview,
    InstructorApplicationPaginatedResponse,
    InstructorApplicationStats,
    InstructorApplicationFilters,
    ApplicationStatus
} from '../types/instructor-application';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class InstructorApplicationService {
    private getAuthHeaders(): HeadersInit {
        const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('access_token='))
            ?.split('=')[1];

        return {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    async createApplication(applicationData: InstructorApplicationCreate): Promise<InstructorApplication> {
        const response = await fetch(`${API_BASE_URL}/instructor-applications/`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(applicationData),
        });

        return this.handleResponse<InstructorApplication>(response);
    }

    async getApplications(
        page: number = 1,
        perPage: number = 20,
        filters: InstructorApplicationFilters = {}
    ): Promise<InstructorApplicationPaginatedResponse> {
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString(),
        });

        if (filters.status) params.append('status', filters.status);
        if (filters.user_id) params.append('user_id', filters.user_id.toString());

        const response = await fetch(`${API_BASE_URL}/instructor-applications/?${params}`, {
            headers: this.getAuthHeaders(),
        });

        return this.handleResponse<InstructorApplicationPaginatedResponse>(response);
    }

    async getMyApplications(): Promise<InstructorApplication[]> {
        const response = await fetch(`${API_BASE_URL}/instructor-applications/my-applications`, {
            headers: this.getAuthHeaders(),
        });

        return this.handleResponse<InstructorApplication[]>(response);
    }

    async getApplicationById(applicationId: number): Promise<InstructorApplication> {
        const response = await fetch(`${API_BASE_URL}/instructor-applications/${applicationId}`, {
            headers: this.getAuthHeaders(),
        });

        return this.handleResponse<InstructorApplication>(response);
    }

    async updateApplication(
        applicationId: number,
        applicationData: InstructorApplicationUpdate
    ): Promise<InstructorApplication> {
        const response = await fetch(`${API_BASE_URL}/instructor-applications/${applicationId}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(applicationData),
        });

        return this.handleResponse<InstructorApplication>(response);
    }

    async reviewApplication(
        applicationId: number,
        reviewData: InstructorApplicationReview
    ): Promise<InstructorApplication> {
        const response = await fetch(`${API_BASE_URL}/instructor-applications/${applicationId}/review`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(reviewData),
        });

        return this.handleResponse<InstructorApplication>(response);
    }

    async deleteApplication(applicationId: number): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE_URL}/instructor-applications/${applicationId}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders(),
        });

        return this.handleResponse<{ message: string }>(response);
    }

    async getApplicationStats(): Promise<InstructorApplicationStats> {
        const response = await fetch(`${API_BASE_URL}/instructor-applications/stats`, {
            headers: this.getAuthHeaders(),
        });

        return this.handleResponse<InstructorApplicationStats>(response);
    }
}

export const instructorApplicationService = new InstructorApplicationService();