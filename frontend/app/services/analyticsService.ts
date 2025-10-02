/**
 * Analytics service for admin dashboard data.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface DashboardMetrics {
    users: {
        total: number;
        learners: number;
        instructors: number;
        recent_signups: number;
    };
    courses: {
        total: number;
        published: number;
        draft: number;
    };
    enrollments: {
        total: number;
        completed: number;
        completion_rate: number;
    };
    revenue: {
        total: number;
        currency: string;
    };
    certificates: {
        total: number;
    };
}

export interface ActivityItem {
    type: string;
    message: string;
    timestamp: string;
    user_id?: number;
    user_name?: string;
    course_id?: number;
    course_title?: string;
}

export interface RecentActivity {
    activities: ActivityItem[];
}

export interface HealthAlert {
    type: string;
    severity: string;
    message: string;
    count?: number;
}

export interface SystemHealth {
    overall_status: string;
    alerts: HealthAlert[];
    metrics: Record<string, any>;
}

export interface ChartDataPoint {
    period?: string;
    revenue?: number;
    transaction_count?: number;
    registrations?: number;
    courses_created?: number;
}

export interface AnalyticsSummary {
    total_revenue?: number;
    total_transactions?: number;
    average_transaction?: number;
    total_registrations?: number;
    total_courses?: number;
    period: {
        start: string;
        end: string;
        group_by: string;
    };
}

export interface RevenueAnalytics {
    chart_data: ChartDataPoint[];
    summary: AnalyticsSummary;
}

export interface UserRegistrationAnalytics {
    chart_data: ChartDataPoint[];
    summary: AnalyticsSummary;
}

export interface CourseCreationAnalytics {
    chart_data: ChartDataPoint[];
    summary: AnalyticsSummary;
}

export interface AnalyticsFilters {
    start_date?: string;
    end_date?: string;
    group_by?: 'day' | 'week' | 'month';
}

class AnalyticsService {
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

    async getDashboardMetrics(): Promise<DashboardMetrics> {
        return this.makeRequest<DashboardMetrics>('/analytics/dashboard');
    }

    async getRecentActivity(limit: number = 20): Promise<RecentActivity> {
        return this.makeRequest<RecentActivity>(`/analytics/activity?limit=${limit}`);
    }

    async getSystemHealth(): Promise<SystemHealth> {
        return this.makeRequest<SystemHealth>('/analytics/health');
    }

    async getRevenueAnalytics(filters: AnalyticsFilters = {}): Promise<RevenueAnalytics> {
        const params = new URLSearchParams();

        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        if (filters.group_by) params.append('group_by', filters.group_by);

        const queryString = params.toString();
        const endpoint = `/analytics/revenue${queryString ? `?${queryString}` : ''}`;

        return this.makeRequest<RevenueAnalytics>(endpoint);
    }

    async getUserRegistrationAnalytics(filters: AnalyticsFilters = {}): Promise<UserRegistrationAnalytics> {
        const params = new URLSearchParams();

        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        if (filters.group_by) params.append('group_by', filters.group_by);

        const queryString = params.toString();
        const endpoint = `/analytics/users${queryString ? `?${queryString}` : ''}`;

        return this.makeRequest<UserRegistrationAnalytics>(endpoint);
    }

    async getCourseCreationAnalytics(filters: AnalyticsFilters = {}): Promise<CourseCreationAnalytics> {
        const params = new URLSearchParams();

        if (filters.start_date) params.append('start_date', filters.start_date);
        if (filters.end_date) params.append('end_date', filters.end_date);
        if (filters.group_by) params.append('group_by', filters.group_by);

        const queryString = params.toString();
        const endpoint = `/analytics/courses${queryString ? `?${queryString}` : ''}`;

        return this.makeRequest<CourseCreationAnalytics>(endpoint);
    }

    // Utility method to format currency
    formatCurrency(amount: number, currency: string = 'USD'): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    }

    // Utility method to format numbers
    formatNumber(num: number): string {
        return new Intl.NumberFormat('en-US').format(num);
    }

    // Utility method to format percentage
    formatPercentage(num: number): string {
        return `${num.toFixed(1)}%`;
    }

    // Utility method to format date for API
    formatDateForAPI(date: Date): string {
        return date.toISOString();
    }

    // Utility method to get relative time
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
}

export const analyticsService = new AnalyticsService();