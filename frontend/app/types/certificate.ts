/**
 * Certificate-related type definitions
 */

export interface Certificate {
    id: number;
    user_id: number;
    course_id: number;
    certificate_id: string;
    title: string;
    description?: string;
    verification_code: string;
    certificate_url?: string;
    is_verified: boolean;
    issued_at: string;
    expires_at?: string;
}

export interface CertificateWithDetails extends Certificate {
    user_name: string;
    course_title: string;
    instructor_name: string;
}

export interface CompletionStatus {
    completed: boolean;
    lectures_completed: boolean;
    quizzes_passed: boolean;
    lecture_progress: {
        completed: number;
        total: number;
    };
    quiz_details: Array<{
        quiz_id: number;
        title: string;
        passed: boolean;
        score?: number;
        passing_score: number;
    }>;
    completion_percentage: number;
    error?: string;
}

export interface CertificateVerification {
    valid: boolean;
    certificate?: CertificateWithDetails;
    message: string;
}

export interface CertificateCreateRequest {
    user_id: number;
    course_id: number;
}