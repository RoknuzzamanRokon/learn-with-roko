/**
 * Service for resource-related API operations
 */

import { getAuthHeaders } from '../utils/auth';

import { LectureResource, LectureResourceCreate, LectureResourceUpdate } from '../types/resource';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ResourceService {
    private async getAuthHeaders(): Promise<HeadersInit> {
        const token = require('../utils/auth').getAuthToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        };
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    async createResource(resourceData: LectureResourceCreate): Promise<LectureResource> {
        const response = await fetch(`${API_BASE_URL}/resources/`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(resourceData),
        });

        return this.handleResponse<LectureResource>(response);
    }

    async getLectureResources(lectureId: number): Promise<LectureResource[]> {
        const response = await fetch(`${API_BASE_URL}/resources/lecture/${lectureId}`, {
            method: 'GET',
            headers: await getAuthHeaders(),
        });

        return this.handleResponse<LectureResource[]>(response);
    }

    async getResource(resourceId: number): Promise<LectureResource> {
        const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`, {
            method: 'GET',
            headers: await getAuthHeaders(),
        });

        return this.handleResponse<LectureResource>(response);
    }

    async updateResource(resourceId: number, resourceData: LectureResourceUpdate): Promise<LectureResource> {
        const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`, {
            method: 'PUT',
            headers: await getAuthHeaders(),
            body: JSON.stringify(resourceData),
        });

        return this.handleResponse<LectureResource>(response);
    }

    async deleteResource(resourceId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/resources/${resourceId}`, {
            method: 'DELETE',
            headers: await getAuthHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
    }

    async downloadResource(resourceId: number): Promise<void> {
        const token = require('../utils/auth').getAuthToken();
        const headers: HeadersInit = {
            ...(token && { 'Authorization': `Bearer ${token}` }),
        };

        const response = await fetch(`${API_BASE_URL}/resources/${resourceId}/download`, {
            method: 'POST',
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        // Handle redirect response
        if (response.redirected) {
            window.open(response.url, '_blank');
        } else {
            // Fallback: create download link
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = ''; // Browser will determine filename
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getResourceIcon(resourceType: string): string {
        switch (resourceType) {
            case 'pdf':
                return '📄';
            case 'document':
                return '📝';
            case 'presentation':
                return '📊';
            case 'spreadsheet':
                return '📈';
            case 'archive':
                return '🗜️';
            case 'code':
                return '💻';
            case 'image':
                return '🖼️';
            case 'audio':
                return '🎵';
            default:
                return '📎';
        }
    }
}

export const resourceService = new ResourceService();