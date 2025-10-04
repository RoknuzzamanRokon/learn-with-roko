/**
 * Certificate service for API interactions
 */

import { getAuthHeaders } from '../utils/auth';

import {
    Certificate,
    CertificateWithDetails,
    CompletionStatus,
    CertificateVerification
} from '../types/certificate';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class CertificateService {
    private async getAuthHeaders(): Promise<HeadersInit> {
        const token = require('../utils/auth').getAuthToken();
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
        };
    }

    /**
     * Get all certificates for the current user
     */
    async getMyCertificates(): Promise<CertificateWithDetails[]> {
        const response = await fetch(`${API_BASE_URL}/certificates/my-certificates`, {
            method: 'GET',
            headers: await getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch certificates');
        }

        return response.json();
    }

    /**
     * Check course completion status
     */
    async checkCourseCompletion(courseId: number): Promise<CompletionStatus> {
        const response = await fetch(`${API_BASE_URL}/certificates/course/${courseId}/completion-status`, {
            method: 'GET',
            headers: await getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to check course completion');
        }

        return response.json();
    }

    /**
     * Generate certificate for a completed course
     */
    async generateCertificate(courseId: number): Promise<Certificate> {
        const response = await fetch(`${API_BASE_URL}/certificates/course/${courseId}/generate`, {
            method: 'POST',
            headers: await getAuthHeaders(),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to generate certificate');
        }

        return response.json();
    }

    /**
     * Download certificate PDF
     */
    async downloadCertificate(certificateId: string): Promise<Blob> {
        const response = await fetch(`${API_BASE_URL}/certificates/download/${certificateId}`, {
            method: 'GET',
            headers: await getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to download certificate');
        }

        return response.blob();
    }

    /**
     * Get certificate details by ID
     */
    async getCertificate(certificateId: string): Promise<CertificateWithDetails> {
        const response = await fetch(`${API_BASE_URL}/certificates/${certificateId}`, {
            method: 'GET',
            headers: await getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Failed to fetch certificate');
        }

        return response.json();
    }

    /**
     * Verify certificate using verification code
     */
    async verifyCertificate(verificationCode: string): Promise<CertificateVerification> {
        const response = await fetch(`${API_BASE_URL}/certificates/verify/${verificationCode}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to verify certificate');
        }

        return response.json();
    }

    /**
     * Download certificate as PDF file
     */
    async downloadCertificateFile(certificateId: string, filename?: string): Promise<void> {
        try {
            const blob = await this.downloadCertificate(certificateId);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename || `certificate_${certificateId}.pdf`;

            // Trigger download
            document.body.appendChild(link);
            link.click();

            // Cleanup
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading certificate:', error);
            throw error;
        }
    }
}

export const certificateService = new CertificateService();