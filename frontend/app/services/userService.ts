/**
 * User management API service
 */

import { User, UserCreate, UserUpdate, UserSearchFilters, UserListPaginatedResponse, UserStats } from '../types/user';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class UserService {
    private getAuthHeaders(): HeadersInit {
        const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('access_token='))
            ?.split('=')[1];

        return {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        };
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'An error occurred' }));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    async createUser(userData: UserCreate): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/users/`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(userData),
        });

        return this.handleResponse<User>(response);
    }

    async getUsers(
        page: number = 1,
        perPage: number = 20,
        filters: UserSearchFilters = {}
    ): Promise<UserListPaginatedResponse> {
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString(),
        });

        if (filters.search) params.append('search', filters.search);
        if (filters.role) params.append('role', filters.role);
        if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());

        const response = await fetch(`${API_BASE_URL}/users/?${params}`, {
            headers: this.getAuthHeaders(),
        });

        return this.handleResponse<UserListPaginatedResponse>(response);
    }

    async getUserById(userId: number): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            headers: this.getAuthHeaders(),
        });

        return this.handleResponse<User>(response);
    }

    async updateUser(userId: number, userData: UserUpdate): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(userData),
        });

        return this.handleResponse<User>(response);
    }

    async updateUserRole(userId: number, role: "super_admin" | "instructor" | "learner"): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ role }),
        });

        return this.handleResponse<User>(response);
    }

    async suspendUser(userId: number): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/suspend`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
        });

        return this.handleResponse<User>(response);
    }

    async activateUser(userId: number): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/activate`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
        });

        return this.handleResponse<User>(response);
    }

    async deleteUser(userId: number): Promise<{ message: string }> {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders(),
        });

        return this.handleResponse<{ message: string }>(response);
    }

    async getUserStats(): Promise<UserStats> {
        const response = await fetch(`${API_BASE_URL}/users/stats`, {
            headers: this.getAuthHeaders(),
        });

        return this.handleResponse<UserStats>(response);
    }

    async getMyProfile(): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/users/profile/me`, {
            headers: this.getAuthHeaders(),
        });

        return this.handleResponse<User>(response);
    }

    async updateMyProfile(userData: UserUpdate): Promise<User> {
        const response = await fetch(`${API_BASE_URL}/users/profile/me`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(userData),
        });

        return this.handleResponse<User>(response);
    }
}

export const userService = new UserService();