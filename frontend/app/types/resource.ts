/**
 * Types for downloadable resource functionality
 */

export type ResourceType =
    | "pdf"
    | "document"
    | "presentation"
    | "spreadsheet"
    | "archive"
    | "code"
    | "image"
    | "audio"
    | "other";

export interface LectureResource {
    id: number;
    lecture_id: number;
    title: string;
    description?: string;
    resource_type: ResourceType;
    file_url: string;
    file_name: string;
    file_size?: number;
    mime_type?: string;
    is_downloadable: boolean;
    download_count: number;
    created_at: string;
    updated_at: string;
}

export interface LectureResourceCreate {
    lecture_id: number;
    title: string;
    description?: string;
    resource_type: ResourceType;
    file_url: string;
    file_name: string;
    file_size?: number;
    mime_type?: string;
    is_downloadable?: boolean;
}

export interface LectureResourceUpdate {
    title?: string;
    description?: string;
    resource_type?: ResourceType;
    is_downloadable?: boolean;
}

export interface ResourceDownload {
    id: number;
    user_id: number;
    resource_id: number;
    downloaded_at: string;
}