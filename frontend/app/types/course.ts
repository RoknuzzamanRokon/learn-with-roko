/**
 * Types for course management functionality
 */

export type CourseStatus = "draft" | "published" | "archived";
export type DifficultyLevel = "beginner" | "intermediate" | "advanced";
export type LectureType = "video" | "text" | "quiz" | "assignment" | "resource";

export interface CourseCategory {
    id: number;
    name: string;
    description?: string;
    parent_id?: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CourseCategoryCreate {
    name: string;
    description?: string;
    parent_id?: number;
}

export interface CourseCategoryUpdate {
    name?: string;
    description?: string;
    parent_id?: number;
    is_active?: boolean;
}

export interface Course {
    id: number;
    title: string;
    description: string;
    short_description?: string;
    instructor_id: number;
    category_id?: number;
    price: number;
    status: CourseStatus;
    difficulty_level: DifficultyLevel;
    thumbnail_url?: string;
    preview_video_url?: string;
    total_duration: number;
    total_lectures: number;
    language: string;
    is_featured: boolean;
    allow_qa: boolean;
    allow_notes: boolean;
    created_at: string;
    updated_at: string;
    published_at?: string;
    is_free: boolean;
    is_published: boolean;
}

export interface CourseCreate {
    title: string;
    description: string;
    short_description?: string;
    category_id?: number;
    price: number;
    difficulty_level: DifficultyLevel;
    language?: string;
    thumbnail_url?: string;
    preview_video_url?: string;
    allow_qa?: boolean;
    allow_notes?: boolean;
}

export interface CourseUpdate {
    title?: string;
    description?: string;
    short_description?: string;
    category_id?: number;
    price?: number;
    difficulty_level?: DifficultyLevel;
    language?: string;
    thumbnail_url?: string;
    preview_video_url?: string;
    allow_qa?: boolean;
    allow_notes?: boolean;
}

export interface CourseStatusUpdate {
    status: CourseStatus;
}

export interface Section {
    id: number;
    title: string;
    description?: string;
    course_id: number;
    order_index: number;
    total_duration: number;
    total_lectures: number;
    created_at: string;
    updated_at: string;
}

export interface SectionCreate {
    title: string;
    description?: string;
    order_index: number;
}

export interface SectionUpdate {
    title?: string;
    description?: string;
    order_index?: number;
}

export interface Lecture {
    id: number;
    title: string;
    description?: string;
    section_id: number;
    lecture_type: LectureType;
    order_index: number;
    duration: number;
    video_url?: string;
    content_url?: string;
    is_preview: boolean;
    is_downloadable: boolean;
    created_at: string;
    updated_at: string;
}

export interface LectureCreate {
    title: string;
    description?: string;
    lecture_type: LectureType;
    order_index: number;
    duration: number;
    video_url?: string;
    content_url?: string;
    is_preview?: boolean;
    is_downloadable?: boolean;
}

export interface LectureUpdate {
    title?: string;
    description?: string;
    lecture_type?: LectureType;
    order_index?: number;
    duration?: number;
    video_url?: string;
    content_url?: string;
    is_preview?: boolean;
    is_downloadable?: boolean;
}

export interface CourseSearchFilters {
    search?: string;
    category_id?: number;
    instructor_id?: number;
    status?: CourseStatus;
    difficulty_level?: DifficultyLevel;
    is_free?: boolean;
    is_featured?: boolean;
    min_price?: number;
    max_price?: number;
}

export interface CourseListPaginatedResponse {
    courses: Course[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

export interface SectionWithLectures extends Section {
    lectures: Lecture[];
}

export interface CourseWithSections extends Course {
    sections: SectionWithLectures[];
    category?: CourseCategory;
}

// Form-specific types
export interface CourseFormData {
    title: string;
    description: string;
    short_description: string;
    category_id: string;
    price: string;
    difficulty_level: DifficultyLevel;
    language: string;
    thumbnail_url: string;
    preview_video_url: string;
    allow_qa: boolean;
    allow_notes: boolean;
}

export interface SectionFormData {
    title: string;
    description: string;
    order_index: number;
}

export interface LectureFormData {
    title: string;
    description: string;
    lecture_type: LectureType;
    order_index: number;
    duration: string;
    video_url: string;
    content_url: string;
    is_preview: boolean;
    is_downloadable: boolean;
}