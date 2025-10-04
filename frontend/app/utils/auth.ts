/**
 * Authentication utilities for API calls
 */

import Cookies from 'js-cookie';

/**
 * Get authentication headers with Bearer token from cookies
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
    const token = Cookies.get('access_token');
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

/**
 * Get authentication headers for file uploads (without Content-Type)
 */
export async function getAuthHeadersForUpload(): Promise<HeadersInit> {
    const token = Cookies.get('access_token');
    return {
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

/**
 * Get just the Bearer token for manual header construction
 */
export function getAuthToken(): string | undefined {
    return Cookies.get('access_token');
}

/**
 * Check if user is authenticated by checking for valid token
 */
export function isAuthenticated(): boolean {
    const token = Cookies.get('access_token');
    return !!token;
}