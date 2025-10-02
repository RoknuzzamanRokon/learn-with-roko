/**
 * Types for user management functionality
 */

export interface UserRole {
    SUPER_ADMIN: "super_admin";
    INSTRUCTOR: "instructor";
    LEARNER: "learner";
}

export interface User {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    full_name: string;
    role: "super_admin" | "instructor" | "learner";
    is_active: boolean;
    is_verified: boolean;
    profile_image?: string;
    bio?: string;
    created_at: string;
    updated_at: string;
    last_login?: string;
}

export interface UserCreate {
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    password: string;
    role?: "super_admin" | "instructor" | "learner";
    bio?: string;
    is_active?: boolean;
}

export interface UserUpdate {
    email?: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    bio?: string;
    profile_image?: string;
    is_active?: boolean;
}

export interface UserSearchFilters {
    search?: string;
    role?: "super_admin" | "instructor" | "learner";
    is_active?: boolean;
    created_after?: string;
    created_before?: string;
}

export interface UserListPaginatedResponse {
    users: User[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

export interface UserStats {
    total_users: number;
    active_users: number;
    inactive_users: number;
    super_admins: number;
    instructors: number;
    learners: number;
    new_users_this_month: number;
    new_users_this_week: number;
}