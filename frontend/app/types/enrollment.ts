/**
 * Types for enrollment and progress tracking functionality
 */

export interface Enrollment {
    id: number;
    user_id: number;
    course_id: number;
    progress_percentage: number;
    is_completed: boolean;
    enrolled_at: string;
    completed_at?: string;
    last_accessed?: string;
}

export interface EnrollmentCreate {
    course_id: number;
}

export interface CourseProgress {
    id: number;
    user_id: number;
    course_id: number;
    completed_lectures: number;
    total_lectures: number;
    completed_quizzes: number;
    total_quizzes: number;
    total_watch_time: number;
    total_watch_time_minutes: number;
    progress_percentage: number;
    current_section_id?: number;
    current_lecture_id?: number;
    created_at: string;
    updated_at: string;
    completion_percentage: number;
    lecture_progress?: LectureProgress[];
}

export interface LectureProgress {
    id: number;
    user_id: number;
    lecture_id: number;
    is_completed: boolean;
    watch_time: number;
    watch_time_seconds: number;
    progress_percentage: number;
    last_position: number;
    started_at: string;
    completed_at?: string;
    last_accessed: string;
}

export interface LectureProgressUpdate {
    watch_time_seconds: number;
    progress_percentage: number;
    is_completed: boolean;
}

export interface PaymentIntentCreate {
    course_id: number;
}

export interface PaymentIntentResponse {
    client_secret: string;
    amount: number;
    currency: string;
}