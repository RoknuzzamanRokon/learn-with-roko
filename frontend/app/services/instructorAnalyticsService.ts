/**
 * Service for instructor analytics API calls
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface InstructorDashboardMetrics {
    courses: {
        total: number;
        published: number;
        draft: number;
    };
    students: {
        total: number;
        active: number;
        completed: number;
    };
    revenue: {
        total: number;
        this_month: number;
        currency: string;
    };
    engagement: {
        avg_completion_rate: number;
        avg_rating: number;
    };
}

export interface CoursePerformance {
    course_id: number;
    title: string;
    price: number;
    status: string;
    created_at: string;
    total_enrollments: number;
    completed_enrollments: number;
    completion_rate: number;
    avg_progress: number;
    revenue: number;
}

export interface CoursePerformanceAnalytics {
    courses: CoursePerformance[];
    summary: {
        total_courses: number;
        total_enrollments: number;
        total_revenue: number;
        avg_completion_rate: number;
        period: {
            start: string | null;
            end: string | null;
        };
    };
}

export interface StudentProgress {
    student_id: number;
    student_name: string;
    student_email: string;
    course_id: number;
    course_title: string;
    enrolled_at: string;
    progress_percentage: number;
    is_completed: boolean;
    completed_at: string | null;
    last_accessed: string | null;
    total_watch_time: number;
    completed_lectures: number;
    total_lectures: number;
}

export interface StudentProgressTracking {
    students: StudentProgress[];
    summary: {
        total_students: number;
        completed_students: number;
        completion_rate: number;
        avg_progress: number;
        course_filter: number | null;
    };
}

export interface QuizAttemptDetail {
    student_name: string;
    score: number | null;
    is_passed: boolean;
    attempt_number: number;
    completed_at: string | null;
}

export interface QuizBreakdown {
    quiz_id: number;
    quiz_title: string;
    course_title: string;
    total_attempts: number;
    average_score: number;
    pass_rate: number;
    recent_attempts: QuizAttemptDetail[];
}

export interface QuizScoreAnalytics {
    total_attempts: number;
    average_score: number;
    pass_rate: number;
    quiz_breakdown: QuizBreakdown[];
}

export interface DailyActivity {
    date: string | null;
    active_students: number;
}

export interface ActiveStudent {
    name: string;
    lecture_views: number;
    total_watch_time: number;
}

export interface StudentEngagementMetrics {
    period_days: number;
    daily_activity: DailyActivity[];
    avg_session_duration: number;
    most_active_students: ActiveStudent[];
}

class InstructorAnalyticsService {
    private async getAuthHeaders(): Promise<HeadersInit> {
        const token = localStorage.getItem('access_token');
        return {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    async getDashboardMetrics(): Promise<InstructorDashboardMetrics> {
        const response = await fetch(`${API_BASE_URL}/instructor/analytics/dashboard`, {
            method: 'GET',
            headers: await this.getAuthHeaders(),
        });
        return this.handleResponse<InstructorDashboardMetrics>(response);
    }

    async getCoursePerformanceAnalytics(
        startDate?: string,
        endDate?: string
    ): Promise<CoursePerformanceAnalytics> {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const response = await fetch(
            `${API_BASE_URL}/instructor/analytics/course-performance?${params}`,
            {
                method: 'GET',
                headers: await this.getAuthHeaders(),
            }
        );
        return this.handleResponse<CoursePerformanceAnalytics>(response);
    }

    async getStudentProgressTracking(courseId?: number): Promise<StudentProgressTracking> {
        const params = new URLSearchParams();
        if (courseId) params.append('course_id', courseId.toString());

        const response = await fetch(
            `${API_BASE_URL}/instructor/analytics/student-progress?${params}`,
            {
                method: 'GET',
                headers: await this.getAuthHeaders(),
            }
        );
        return this.handleResponse<StudentProgressTracking>(response);
    }

    async getQuizScoreAnalytics(courseId?: number): Promise<QuizScoreAnalytics> {
        const params = new URLSearchParams();
        if (courseId) params.append('course_id', courseId.toString());

        const response = await fetch(
            `${API_BASE_URL}/instructor/analytics/quiz-scores?${params}`,
            {
                method: 'GET',
                headers: await this.getAuthHeaders(),
            }
        );
        return this.handleResponse<QuizScoreAnalytics>(response);
    }

    async getStudentEngagementMetrics(days: number = 30): Promise<StudentEngagementMetrics> {
        const params = new URLSearchParams();
        params.append('days', days.toString());

        const response = await fetch(
            `${API_BASE_URL}/instructor/analytics/student-engagement?${params}`,
            {
                method: 'GET',
                headers: await this.getAuthHeaders(),
            }
        );
        return this.handleResponse<StudentEngagementMetrics>(response);
    }
}

export const instructorAnalyticsService = new InstructorAnalyticsService();