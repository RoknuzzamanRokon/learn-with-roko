/**
 * File service for handling file uploads and downloads
 */

import { getAuthHeaders, getAuthHeadersForUpload } from '../utils/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface FileUploadResponse {
    message: string;
    file: {
        id: string;
        filename: string;
        original_filename: string;
        file_path: string;
        file_size: number;
        content_type: string;
        category: string;
        uploaded_by: number;
        uploaded_at: string;
    };
}

export interface MultipleFileUploadResponse {
    message: string;
    result: {
        successful: FileUploadResponse['file'][];
        failed: Array<{
            filename: string;
            error: string;
        }>;
    };
}

class FileService {
    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    /**
     * Upload a single file
     */
    async uploadFile(file: File): Promise<FileUploadResponse> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/files/upload`, {
            method: 'POST',
            headers: await getAuthHeadersForUpload(),
            body: formData
        });

        return this.handleResponse<FileUploadResponse>(response);
    }

    /**
     * Upload multiple files
     */
    async uploadMultipleFiles(files: File[]): Promise<MultipleFileUploadResponse> {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        const response = await fetch(`${API_BASE_URL}/files/upload-multiple`, {
            method: 'POST',
            headers: await getAuthHeadersForUpload(),
            body: formData
        });

        return this.handleResponse<MultipleFileUploadResponse>(response);
    }

    /**
     * Download a file
     */
    async downloadFile(category: string, filename: string): Promise<Blob> {
        const response = await fetch(`${API_BASE_URL}/files/download/${category}/${filename}`, {
            headers: await getAuthHeaders()
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }

        return response.blob();
    }

    /**
     * Delete a file
     */
    async deleteFile(filePath: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/files/delete`, {
            method: 'DELETE',
            headers: await getAuthHeaders(),
            body: JSON.stringify({ file_path: filePath })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
    }

    /**
     * Get file information
     */
    async getFileInfo(filePath: string): Promise<any> {
        const params = new URLSearchParams({ file_path: filePath });
        const response = await fetch(`${API_BASE_URL}/files/info?${params}`, {
            headers: await getAuthHeaders()
        });

        return this.handleResponse<any>(response);
    }

    /**
     * Get file URL for serving (development only)
     */
    getFileUrl(category: string, filename: string): string {
        return `${API_BASE_URL}/files/uploads/${category}/${filename}`;
    }
}

export const fileService = new FileService();