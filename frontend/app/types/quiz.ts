/**
 * Types for quiz and assessment functionality
 */

export type QuestionType = "multiple_choice" | "true_false" | "short_answer" | "essay";

export interface Question {
    id: number;
    quiz_id: number;
    question_text: string;
    question_type: QuestionType;
    order_index: number;
    points: number;
    options?: string[];
    correct_answer: string;
    explanation?: string;
    created_at: string;
    updated_at: string;
}

export interface QuestionCreate {
    question_text: string;
    question_type: QuestionType;
    order_index: number;
    points: number;
    options?: string[];
    correct_answer: string;
    explanation?: string;
}

export interface QuestionUpdate {
    question_text?: string;
    question_type?: QuestionType;
    order_index?: number;
    points?: number;
    options?: string[];
    correct_answer?: string;
    explanation?: string;
}

export interface Quiz {
    id: number;
    title: string;
    description?: string;
    course_id: number;
    time_limit?: number; // in minutes
    max_attempts: number;
    passing_score: number; // percentage
    show_correct_answers: boolean;
    randomize_questions: boolean;
    is_published: boolean;
    created_at: string;
    updated_at: string;
    questions: Question[];
}

export interface QuizSummary {
    id: number;
    title: string;
    description?: string;
    course_id: number;
    time_limit?: number;
    max_attempts: number;
    passing_score: number;
    show_correct_answers: boolean;
    randomize_questions: boolean;
    is_published: boolean;
    question_count: number;
    total_points: number;
    created_at: string;
    updated_at: string;
}

export interface QuizCreate {
    course_id: number;
    title: string;
    description?: string;
    time_limit?: number;
    max_attempts: number;
    passing_score: number;
    show_correct_answers: boolean;
    randomize_questions: boolean;
}

export interface QuizUpdate {
    title?: string;
    description?: string;
    time_limit?: number;
    max_attempts?: number;
    passing_score?: number;
    show_correct_answers?: boolean;
    randomize_questions?: boolean;
    is_published?: boolean;
}

export interface QuizAttemptAnswer {
    question_id: number;
    answer: string;
}

export interface QuizAttemptSubmission {
    answers: QuizAttemptAnswer[];
}

export interface QuizAttempt {
    id: number;
    user_id: number;
    quiz_id: number;
    attempt_number: number;
    score?: number;
    total_points: number;
    earned_points: number;
    is_completed: boolean;
    is_passed: boolean;
    started_at: string;
    completed_at?: string;
    time_taken?: number; // in minutes
}

export interface QuizAttemptDetail extends QuizAttempt {
    answers?: Record<string, string>;
    quiz: QuizSummary;
}

export interface QuestionFeedback {
    id: number;
    question_text: string;
    question_type: QuestionType;
    points: number;
    user_answer: string;
    is_correct: boolean;
    correct_answer?: string;
    explanation?: string;
    options?: string[];
}

export interface QuizResult {
    attempt: QuizAttempt;
    questions: QuestionFeedback[];
    can_retake: boolean;
    next_attempt_number?: number;
}

export interface QuizFormData {
    title: string;
    description: string;
    time_limit: string;
    max_attempts: string;
    passing_score: string;
    show_correct_answers: boolean;
    randomize_questions: boolean;
}

export interface QuestionFormData {
    question_text: string;
    question_type: QuestionType;
    order_index: string;
    points: string;
    options: string[];
    correct_answer: string;
    explanation: string;
}