/**
 * Types for note-taking functionality
 */

export interface Note {
    id: number;
    user_id: number;
    lecture_id: number;
    content: string;
    timestamp?: number; // Video timestamp in seconds
    created_at: string;
    updated_at: string;
}

export interface NoteCreate {
    lecture_id: number;
    content: string;
    timestamp?: number;
}

export interface NoteUpdate {
    content?: string;
    timestamp?: number;
}

export interface NoteListResponse {
    notes: Note[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

export interface NoteSearchFilters {
    lecture_id?: number;
    course_id?: number;
    search?: string;
    page?: number;
    per_page?: number;
}