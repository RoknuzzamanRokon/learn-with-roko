/**
 * Moderation service for course and content management.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface InstructorInfo {
    id: number;
    name: string;
    email: string;
    role?: string;
    created_at?: string;
}

export interface CategoryInfo {
    id: number;
    name: string;
    description?: string;
}

export interface CourseStatistics {
    total_enrollments: number;
    completed_enrollments: number;
    completion_rate: number;
    sections_count: number;
    lectures_count: number;
}

export interface LectureInfo {
    id: number;
    title: string;
    description?: string;
    lecture_type: string;
    order_index: number;
    duration: number;
    is_preview: boolean;
    is_downloadable: boolean;
}

export interface SectionInfo {
    id: number;
    title: string;
    description?: string;
    order_index: number;
    total_duration: number;
    total_lectures: number;
    lectures: LectureInfo[];
}

export interface CourseForReview {
    id: number;
    title: string;
    description: string;
    short_description?: string;
    status: string;
    difficulty_level: string;
    price: number;
    is_featured: boolean;
    thumbnail_url?: string;
    total_duration: number;
    total_lectures: number;
    created_at: string;
    updated_at: string;
    published_at?: string;
    instructor: InstructorInfo;
    category?: CategoryInfo;
    enrollment_count: number;
}

export interface CourseDetailForReview {
    id: number;
    title: string;
    description: string;
    short_description?: string;
    status: string;
    difficulty_level: string;
    price: number;
    is_featured: boolean;
    thumbnail_url?: string;
    preview_video_url?: string;
    total_duration: number;
    total_lectures: number;
    language: string;
    allow_qa: boolean;
    allow_notes: boolean;
    created_at: string;
    updated_at: string;
    published_at?: string;
    instructor: InstructorInfo;
    category?: CategoryInfo;
    statistics: CourseStatistics;
    sections: SectionInfo[];
}

export interface PaginationInfo {
    total: number;
    limit: number;
    offset: number;
    has_next: boolean;
    has_prev: boolean;
}

export interface CoursesForReviewResponse {
    courses: CourseForReview[];
    pagination: PaginationInfo;
}

export interface CourseStatusUpdate {
    status: string;
    admin_notes?: string;
}

export interface CourseFeaturedToggle {
    is_featured: boolean;
}

export interface ModerationStatistics {
    course_status: {
        draft: number;
        published: number;
        archived: number;
    };
    featured_courses: number;
    recent_submissions: number;
    courses_needing_review: number;
}

export interface BulkUpdateRequest {
    course_ids: number[];
    action: string;
    value?: any;
}

export interface BulkUpdateResponse {
    updated: number;
    errors: string[];
}

export interface ModerationFilters {
    status?: string;
    search?: string;
    instructor_id?: number;
    limit?: number;
    offset?: number;
}

class ModerationService {
    private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const token = localStorage.getItem('token');

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...(token && { Authorization: `Bearer ${token}` }),
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    async getCoursesForReview(filters: ModerationFilters = {}): Promise<CoursesForReviewResponse> {
        const params = new URLSearchParams();

        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        if (filters.instructor_id) params.append('instructor_id', filters.instructor_id.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.offset) params.append('offset', filters.offset.toString());

        const queryString = params.toString();
        const endpoint = `/moderation/courses${queryString ? `?${queryString}` : ''}`;

        return this.makeRequest<CoursesForReviewResponse>(endpoint);
    }

    async getCourseDetailsForReview(courseId: number): Promise<CourseDetailForReview> {
        return this.makeRequest<CourseDetailForReview>(`/moderation/courses/${courseId}`);
    }

    async updateCourseStatus(courseId: number, statusUpdate: CourseStatusUpdate): Promise<any> {
        return this.makeRequest(`/moderation/courses/${courseId}/status`, {
            method: 'PUT',
            body: JSON.stringify(statusUpdate),
        });
    }

    async toggleCourseFeatured(courseId: number, featuredToggle: CourseFeaturedToggle): Promise<any> {
        return this.makeRequest(`/moderation/courses/${courseId}/featured`, {
            method: 'PUT',
            body: JSON.stringify(featuredToggle),
        });
    }

    async getModerationStatistics(): Promise<ModerationStatistics> {
        return this.makeRequest<ModerationStatistics>('/moderation/statistics');
    }

    async bulkUpdateCourses(bulkUpdate: BulkUpdateRequest): Promise<BulkUpdateResponse> {
        return this.makeRequest<BulkUpdateResponse>('/moderation/courses/bulk-update', {
            method: 'POST',
            body: JSON.stringify(bulkUpdate),
        });
    }

    // Utility methods
    getStatusColor(status: string): string {
        switch (status.toLowerCase()) {
            case 'published': return 'text-green-600 bg-green-100';
            case 'draft': return 'text-yellow-600 bg-yellow-100';
            case 'archived': return 'text-gray-600 bg-gray-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    }

    getStatusIcon(status: string): string {
        switch (status.toLowerCase()) {
            case 'published': return '✅';
            case 'draft': return '📝';
            case 'archived': return '📦';
            default: return '❓';
        }
    }

    getDifficultyColor(difficulty: string): string {
        switch (difficulty.toLowerCase()) {
            case 'beginner': return 'text-green-600 bg-green-100';
            case 'intermediate': return 'text-yellow-600 bg-yellow-100';
            case 'advanced': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    }

    formatCurrency(amount: number, currency: string = 'USD'): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    }

    formatDuration(minutes: number): string {
        if (minutes < 60) {
            return `${minutes}m`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }

    getRelativeTime(timestamp: string): string {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;

        return date.toLocaleDateString();
    }

    formatNumber(num: number): string {
        return new Intl.NumberFormat('en-US').format(num);
    }

    formatPercentage(num: number): string {
        return `${num.toFixed(1)}%`;
    }
}

export const moderationService = new ModerationService();