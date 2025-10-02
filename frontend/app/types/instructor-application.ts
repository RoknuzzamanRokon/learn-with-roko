/**
 * Types for instructor application functionality
 */

export type ApplicationStatus = "pending" | "approved" | "rejected";

export interface InstructorApplication {
    id: number;
    user_id: number;
    motivation: string;
    experience: string;
    expertise_areas: string;
    sample_course_outline?: string;
    status: ApplicationStatus;
    reviewed_by?: number;
    review_notes?: string;
    reviewed_at?: string;
    created_at: string;
    updated_at: string;
    applicant_name?: string;
    applicant_email?: string;
    reviewer_name?: string;
}

export interface InstructorApplicationCreate {
    motivation: string;
    experience: string;
    expertise_areas: string;
    sample_course_outline?: string;
}

export interface InstructorApplicationUpdate {
    motivation?: string;
    experience?: string;
    expertise_areas?: string;
    sample_course_outline?: string;
}

export interface InstructorApplicationReview {
    status: ApplicationStatus;
    review_notes?: string;
}

export interface InstructorApplicationList {
    id: number;
    user_id: number;
    status: ApplicationStatus;
    created_at: string;
    reviewed_at?: string;
    applicant_name: string;
    applicant_email: string;
    reviewer_name?: string;
}

export interface InstructorApplicationPaginatedResponse {
    applications: InstructorApplicationList[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

export interface InstructorApplicationStats {
    total_applications: number;
    pending_applications: number;
    approved_applications: number;
    rejected_applications: number;
    applications_this_month: number;
    applications_this_week: number;
}

export interface InstructorApplicationFilters {
    status?: ApplicationStatus;
    user_id?: number;
    created_after?: string;
    created_before?: string;
}