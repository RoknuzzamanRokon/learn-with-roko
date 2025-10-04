/**
 * Service for communication API calls (announcements and messaging)
 */

import { getAuthHeaders } from '../utils/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Announcement interfaces
export interface AnnouncementCreate {
    title: string;
    content: string;
    course_id: number;
    announcement_type?: string;
    priority?: string;
    is_published?: boolean;
    is_pinned?: boolean;
    send_email?: boolean;
    send_notification?: boolean;
}

export interface AnnouncementUpdate {
    title?: string;
    content?: string;
    announcement_type?: string;
    priority?: string;
    is_published?: boolean;
    is_pinned?: boolean;
    send_email?: boolean;
    send_notification?: boolean;
}

export interface Announcement {
    id: number;
    title: string;
    content: string;
    course_id: number;
    instructor_id: number;
    instructor_name: string;
    course_title: string;
    announcement_type: string;
    priority: string;
    is_published: boolean;
    is_pinned: boolean;
    send_email: boolean;
    send_notification: boolean;
    created_at: string;
    updated_at: string;
    published_at: string | null;
    read_count: number;
    total_recipients: number;
}

export interface AnnouncementListResponse {
    announcements: Announcement[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

// Message interfaces
export interface MessageCreate {
    subject: string;
    content: string;
    recipient_id: number;
    course_id?: number;
    parent_message_id?: number;
    message_type?: string;
    is_important?: boolean;
}

export interface Message {
    id: number;
    subject: string;
    content: string;
    sender_id: number;
    recipient_id: number;
    sender_name: string;
    recipient_name: string;
    course_id: number | null;
    course_title: string | null;
    parent_message_id: number | null;
    message_type: string;
    status: string;
    is_important: boolean;
    is_archived_by_sender: boolean;
    is_archived_by_recipient: boolean;
    sent_at: string;
    delivered_at: string | null;
    read_at: string | null;
    reply_count: number;
}

export interface MessageListResponse {
    messages: Message[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

// Bulk message interfaces
export interface BulkMessageCreate {
    subject: string;
    content: string;
    course_id: number;
    recipient_filter?: string;
    send_email?: boolean;
    send_notification?: boolean;
}

export interface BulkMessage {
    id: number;
    subject: string;
    content: string;
    sender_id: number;
    course_id: number;
    sender_name: string;
    course_title: string;
    recipient_filter: string;
    total_recipients: number;
    delivered_count: number;
    read_count: number;
    send_email: boolean;
    send_notification: boolean;
    created_at: string;
    sent_at: string | null;
}

export interface BulkMessageListResponse {
    bulk_messages: BulkMessage[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}

export interface CommunicationStats {
    total_announcements: number;
    unread_announcements: number;
    total_messages: number;
    unread_messages: number;
    total_sent_messages: number;
    total_bulk_messages: number;
}

class CommunicationService {
    private async getAuthHeaders(): Promise<HeadersInit> {
        const token = require('../utils/auth').getAuthToken();
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

    // Announcement methods
    async createAnnouncement(announcementData: AnnouncementCreate): Promise<Announcement> {
        const response = await fetch(`${API_BASE_URL}/communication/announcements`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(announcementData),
        });
        return this.handleResponse<Announcement>(response);
    }

    async getCourseAnnouncements(
        courseId: number,
        page: number = 1,
        perPage: number = 20,
        includeUnpublished: boolean = false
    ): Promise<AnnouncementListResponse> {
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString(),
            include_unpublished: includeUnpublished.toString(),
        });

        const response = await fetch(
            `${API_BASE_URL}/communication/announcements/course/${courseId}?${params}`,
            {
                method: 'GET',
                headers: await getAuthHeaders(),
            }
        );
        return this.handleResponse<AnnouncementListResponse>(response);
    }

    async updateAnnouncement(
        announcementId: number,
        updateData: AnnouncementUpdate
    ): Promise<Announcement> {
        const response = await fetch(
            `${API_BASE_URL}/communication/announcements/${announcementId}`,
            {
                method: 'PUT',
                headers: await getAuthHeaders(),
                body: JSON.stringify(updateData),
            }
        );
        return this.handleResponse<Announcement>(response);
    }

    async deleteAnnouncement(announcementId: number): Promise<{ message: string }> {
        const response = await fetch(
            `${API_BASE_URL}/communication/announcements/${announcementId}`,
            {
                method: 'DELETE',
                headers: await getAuthHeaders(),
            }
        );
        return this.handleResponse<{ message: string }>(response);
    }

    async markAnnouncementAsRead(
        announcementId: number
    ): Promise<{ message: string; was_unread: boolean }> {
        const response = await fetch(
            `${API_BASE_URL}/communication/announcements/${announcementId}/read`,
            {
                method: 'POST',
                headers: await getAuthHeaders(),
            }
        );
        return this.handleResponse<{ message: string; was_unread: boolean }>(response);
    }

    // Message methods
    async sendMessage(messageData: MessageCreate): Promise<Message> {
        const response = await fetch(`${API_BASE_URL}/communication/messages`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(messageData),
        });
        return this.handleResponse<Message>(response);
    }

    async getMessages(
        messageType: 'sent' | 'received' | 'all' = 'all',
        page: number = 1,
        perPage: number = 20
    ): Promise<MessageListResponse> {
        const params = new URLSearchParams({
            message_type: messageType,
            page: page.toString(),
            per_page: perPage.toString(),
        });

        const response = await fetch(`${API_BASE_URL}/communication/messages?${params}`, {
            method: 'GET',
            headers: await getAuthHeaders(),
        });
        return this.handleResponse<MessageListResponse>(response);
    }

    async markMessageAsRead(messageId: number): Promise<{ message: string }> {
        const response = await fetch(
            `${API_BASE_URL}/communication/messages/${messageId}/read`,
            {
                method: 'POST',
                headers: await getAuthHeaders(),
            }
        );
        return this.handleResponse<{ message: string }>(response);
    }

    // Bulk message methods
    async sendBulkMessage(bulkMessageData: BulkMessageCreate): Promise<BulkMessage> {
        const response = await fetch(`${API_BASE_URL}/communication/bulk-messages`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(bulkMessageData),
        });
        return this.handleResponse<BulkMessage>(response);
    }

    async getBulkMessages(
        page: number = 1,
        perPage: number = 20
    ): Promise<BulkMessageListResponse> {
        const params = new URLSearchParams({
            page: page.toString(),
            per_page: perPage.toString(),
        });

        const response = await fetch(
            `${API_BASE_URL}/communication/bulk-messages?${params}`,
            {
                method: 'GET',
                headers: await getAuthHeaders(),
            }
        );
        return this.handleResponse<BulkMessageListResponse>(response);
    }

    // Statistics
    async getCommunicationStats(courseId?: number): Promise<CommunicationStats> {
        const params = new URLSearchParams();
        if (courseId) {
            params.append('course_id', courseId.toString());
        }

        const response = await fetch(
            `${API_BASE_URL}/communication/stats?${params}`,
            {
                method: 'GET',
                headers: await getAuthHeaders(),
            }
        );
        return this.handleResponse<CommunicationStats>(response);
    }
}

export const communicationService = new CommunicationService();