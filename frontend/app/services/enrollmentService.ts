/**
 * Enrollment service for API interactions
 */

import {
    Enrollment,
    EnrollmentCreate,
    CourseProgress,
    LectureProgress,
    LectureProgressUpdate,
    PaymentIntentCreate,
    PaymentIntentResponse
} from '../types/enrollment';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class EnrollmentService {
    private async getAuthHeaders(): Promise<HeadersInit> {
        const token = localStorage.getItem('access_token');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    async enrollInCourse(enrollmentData: EnrollmentCreate): Promise<Enrollment> {
        const response = await fetch(`${API_BASE_URL}/enrollments`, {
            method: 'POST',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(enrollmentData)
        });
        return this.handleResponse<Enrollment>(response);
    }

    async getMyEnrollments(): Promise<Enrollment[]> {
        const response = await fetch(`${API_BASE_URL}/enrollments`, {
            headers: await this.getAuthHeaders()
        });
        return this.handleResponse<Enrollment[]>(response);
    }

    async getEnrollment(courseId: number): Promise<Enrollment> {
        const response = await fetch(`${API_BASE_URL}/enrollments/${courseId}`, {
            headers: await this.getAuthHeaders()
        });
        return this.handleResponse<Enrollment>(response);
    }

    async getCourseProgress(courseId: number): Promise<CourseProgress> {
        const response = await fetch(`${API_BASE_URL}/enrollments/${courseId}/progress`, {
            headers: await this.getAuthHeaders()
        });
        return this.handleResponse<CourseProgress>(response);
    }

    async updateLectureProgress(lectureId: number, progressData: LectureProgressUpdate): Promise<LectureProgress> {
        const response = await fetch(`${API_BASE_URL}/enrollments/lectures/${lectureId}/progress`, {
            method: 'PUT',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(progressData)
        });
        return this.handleResponse<LectureProgress>(response);
    }

    async getLectureProgress(lectureId: number): Promise<LectureProgress> {
        const response = await fetch(`${API_BASE_URL}/enrollments/lectures/${lectureId}/progress`, {
            headers: await this.getAuthHeaders()
        });
        return this.handleResponse<LectureProgress>(response);
    }

    async isEnrolled(courseId: number): Promise<boolean> {
        try {
            await this.getEnrollment(courseId);
            return true;
        } catch (error) {
            return false;
        }
    }

    async createPaymentIntent(paymentData: PaymentIntentCreate): Promise<PaymentIntentResponse> {
        const response = await fetch(`${API_BASE_URL}/enrollments/payment-intent`, {
            method: 'POST',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(paymentData)
        });
        return this.handleResponse<PaymentIntentResponse>(response);
    }

    async enrollWithPayment(enrollmentData: EnrollmentCreate, paymentIntentId: string): Promise<Enrollment> {
        const response = await fetch(`${API_BASE_URL}/enrollments/enroll-with-payment?payment_intent_id=${paymentIntentId}`, {
            method: 'POST',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(enrollmentData)
        });
        return this.handleResponse<Enrollment>(response);
    }
}

export const enrollmentService = new EnrollmentService();