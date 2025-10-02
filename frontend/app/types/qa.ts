/**
 * Types for Q&A and discussion functionality
 */

export interface QAAnswer {
    id: number;
    user_id: number;
    question_id: number;
    content: string;
    is_instructor_answer: boolean;
    is_accepted: boolean;
    created_at: string;
    updated_at: string;
    user_name: string;
}

export interface QAAnswerCreate {
    question_id: number;
    content: string;
}

export interface QAAnswerUpdate {
    content?: string;
}

export interface QAQuestion {
    id: number;
    user_id: number;
    lecture_id: number;
    title: string;
    content: string;
    timestamp?: number; // Video timestamp in seconds
    is_answered: boolean;
    is_featured: boolean;
    created_at: string;
    updated_at: string;
    user_name: string;
    answers: QAAnswer[];
}

export interface QAQuestionCreate {
    lecture_id: number;
    title: string;
    content: string;
    timestamp?: number;
}

export interface QAQuestionUpdate {
    title?: string;
    content?: string;
    timestamp?: number;
}

export interface QAQuestionListResponse {
    questions: QAQuestion[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

export interface QASearchFilters {
    lecture_id?: number;
    course_id?: number;
    is_answered?: boolean;
    is_featured?: boolean;
    search?: string;
    page?: number;
    per_page?: number;
}

export interface QAModerationAction {
    is_featured?: boolean;
    is_answered?: boolean;
}

export interface QAAnswerModerationAction {
    is_accepted?: boolean;
}