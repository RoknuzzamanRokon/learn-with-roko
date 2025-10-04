/**
 * API utilities for handling backend connectivity and error management
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface ApiError {
    message: string;
    status?: number;
    detail?: string;
}

/**
 * Check if the backend API is accessible
 */
export async function checkApiHealth(): Promise<boolean> {
    try {
        const healthUrl = API_BASE_URL.replace('/api', '') + '/health';
        console.log('Checking API health at:', healthUrl);

        const response = await fetch(healthUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            // Add timeout to prevent hanging (if supported)
            signal: typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(5000) : undefined
        });

        console.log('Health check response:', response.status, response.statusText);
        return response.ok;
    } catch (error) {
        console.warn('API health check failed:', error);
        return false;
    }
}

/**
 * Enhanced fetch with better error handling and retry logic
 */
export async function apiRequest(
    url: string,
    options: RequestInit = {},
    retries: number = 1
): Promise<Response> {
    let lastError: Error;

    console.log(`Making API request to: ${url}`);
    console.log('Request options:', { method: options.method || 'GET', headers: options.headers });

    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                // Add timeout to prevent hanging (if supported)
                signal: options.signal || (typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? AbortSignal.timeout(10000) : undefined)
            });

            console.log(`API response: ${response.status} ${response.statusText}`);
            return response;
        } catch (error) {
            lastError = error as Error;
            console.error(`API request attempt ${attempt + 1} failed:`, {
                url,
                error: error.message,
                type: error.constructor.name
            });

            // If it's the last attempt, don't retry
            if (attempt === retries) {
                break;
            }

            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
    }

    // Handle specific error types
    if (lastError instanceof TypeError && lastError.message === 'Failed to fetch') {
        throw new ApiError(
            `Cannot connect to the API server. Please check:\n` +
            `1. Backend server is running on ${API_BASE_URL.replace('/api', '')}\n` +
            `2. CORS is properly configured\n` +
            `3. Network connectivity is available`
        );
    }

    throw lastError;
}

/**
 * Handle API response and extract data
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
            const errorData = await response.json();
            errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
            // If we can't parse the error response, use the default message
        }

        throw new ApiError(errorMessage, response.status);
    }

    try {
        return await response.json();
    } catch (error) {
        throw new ApiError('Invalid JSON response from server');
    }
}

/**
 * Create a standardized API service class
 */
export class ApiService {
    protected baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
    }

    protected async request<T>(
        endpoint: string,
        options: RequestInit = {},
        retries: number = 1
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const response = await apiRequest(url, options, retries);
        return handleApiResponse<T>(response);
    }

    protected async get<T>(endpoint: string, headers?: HeadersInit): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET', headers });
    }

    protected async post<T>(endpoint: string, data?: any, headers?: HeadersInit): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            headers,
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    protected async put<T>(endpoint: string, data?: any, headers?: HeadersInit): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            headers,
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    protected async delete<T>(endpoint: string, headers?: HeadersInit): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE', headers });
    }
}

/**
 * Development mode helpers
 */
export function isDevelopment(): boolean {
    return process.env.NODE_ENV === 'development';
}

/**
 * Show user-friendly error messages
 */
export function getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
        return error.message;
    }

    if (error instanceof Error) {
        if (error.message === 'Failed to fetch') {
            return 'Unable to connect to the server. Please check your internet connection and try again.';
        }
        return error.message;
    }

    return 'An unexpected error occurred. Please try again.';
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
    public status?: number;
    public detail?: string;

    constructor(message: string, status?: number, detail?: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.detail = detail;
    }
}