/**
 * Service for note-related API operations
 */

import { getAuthHeaders } from '../utils/auth';

import { Note, NoteCreate, NoteUpdate, NoteListResponse, NoteSearchFilters } from '../types/note';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class NoteService {
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

    async createNote(noteData: NoteCreate): Promise<Note> {
        const response = await fetch(`${API_BASE_URL}/notes/`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(noteData),
        });

        return this.handleResponse<Note>(response);
    }

    async getUserNotes(filters: NoteSearchFilters = {}): Promise<NoteListResponse> {
        const params = new URLSearchParams();

        if (filters.lecture_id) params.append('lecture_id', filters.lecture_id.toString());
        if (filters.course_id) params.append('course_id', filters.course_id.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.per_page) params.append('per_page', filters.per_page.toString());

        const response = await fetch(`${API_BASE_URL}/notes/?${params}`, {
            method: 'GET',
            headers: await getAuthHeaders(),
        });

        return this.handleResponse<NoteListResponse>(response);
    }

    async getLectureNotes(lectureId: number): Promise<Note[]> {
        const response = await fetch(`${API_BASE_URL}/notes/lecture/${lectureId}`, {
            method: 'GET',
            headers: await getAuthHeaders(),
        });

        return this.handleResponse<Note[]>(response);
    }

    async getNote(noteId: number): Promise<Note> {
        const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
            method: 'GET',
            headers: await getAuthHeaders(),
        });

        return this.handleResponse<Note>(response);
    }

    async updateNote(noteId: number, noteData: NoteUpdate): Promise<Note> {
        const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
            method: 'PUT',
            headers: await getAuthHeaders(),
            body: JSON.stringify(noteData),
        });

        return this.handleResponse<Note>(response);
    }

    async deleteNote(noteId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
            method: 'DELETE',
            headers: await getAuthHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
    }

    formatTimestamp(seconds: number): string {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    parseTimestamp(timeString: string): number {
        const parts = timeString.split(':');
        if (parts.length === 2) {
            const minutes = parseInt(parts[0], 10);
            const seconds = parseInt(parts[1], 10);
            return minutes * 60 + seconds;
        }
        return 0;
    }
}

export const noteService = new NoteService();