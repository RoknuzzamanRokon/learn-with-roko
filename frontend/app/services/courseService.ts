/**
 * Course service for API interactions
 */

import {
    Course,
    CourseCreate,
    CourseUpdate,
    CourseStatusUpdate,
    CourseListPaginatedResponse,
    CourseSearchFilters,
    CourseWithSections,
    CourseCategory,
    CourseCategoryCreate,
    CourseCategoryUpdate,
    Section,
    SectionCreate,
    SectionUpdate,
    Lecture,
    LectureCreate,
    LectureUpdate
} from '../types/course';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class CourseService {
    private async getAuthHeaders(): Promise<HeadersInit> {
        const token = localStorage.getItem('access_token');
        return {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        };
    }

    private async handleResponse<T>(response: Response): Promise<T> {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    // Course Category Methods
    async createCategory(categoryData: CourseCategoryCreate): Promise<CourseCategory> {
        const response = await fetch(`${API_BASE_URL}/courses/categories`, {
            method: 'POST',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(categoryData)
        });
        return this.handleResponse<CourseCategory>(response);
    }

    async getCategories(includeInactive: boolean = false): Promise<CourseCategory[]> {
        const params = new URLSearchParams();
        if (includeInactive) {
            params.append('include_inactive', 'true');
        }

        const response = await fetch(`${API_BASE_URL}/courses/categories?${params}`, {
            headers: await this.getAuthHeaders()
        });
        return this.handleResponse<CourseCategory[]>(response);
    }

    async getCategoryById(categoryId: number): Promise<CourseCategory> {
        const response = await fetch(`${API_BASE_URL}/courses/categories/${categoryId}`, {
            headers: await this.getAuthHeaders()
        });
        return this.handleResponse<CourseCategory>(response);
    }

    async updateCategory(categoryId: number, categoryData: CourseCategoryUpdate): Promise<CourseCategory> {
        const response = await fetch(`${API_BASE_URL}/courses/categories/${categoryId}`, {
            method: 'PUT',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(categoryData)
        });
        return this.handleResponse<CourseCategory>(response);
    }

    async deleteCategory(categoryId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/courses/categories/${categoryId}`, {
            method: 'DELETE',
            headers: await this.getAuthHeaders()
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
    }

    // Course Methods
    async createCourse(courseData: CourseCreate): Promise<Course> {
        const response = await fetch(`${API_BASE_URL}/courses`, {
            method: 'POST',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(courseData)
        });
        return this.handleResponse<Course>(response);
    }

    async getCourses(
        filters?: CourseSearchFilters,
        page: number = 1,
        perPage: number = 20
    ): Promise<CourseListPaginatedResponse> {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('per_page', perPage.toString());

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, value.toString());
                }
            });
        }

        const response = await fetch(`${API_BASE_URL}/courses?${params}`, {
            headers: await this.getAuthHeaders()
        });
        return this.handleResponse<CourseListPaginatedResponse>(response);
    }

    async getMyCourses(page: number = 1, perPage: number = 20): Promise<CourseListPaginatedResponse> {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('per_page', perPage.toString());

        const response = await fetch(`${API_BASE_URL}/courses/my-courses?${params}`, {
            headers: await this.getAuthHeaders()
        });
        return this.handleResponse<CourseListPaginatedResponse>(response);
    }

    async getCourseById(courseId: number, includeSections: boolean = false): Promise<Course | CourseWithSections> {
        const params = new URLSearchParams();
        if (includeSections) {
            params.append('include_sections', 'true');
        }

        const response = await fetch(`${API_BASE_URL}/courses/${courseId}?${params}`, {
            headers: await this.getAuthHeaders()
        });
        return this.handleResponse<Course | CourseWithSections>(response);
    }

    async getCourseWithSections(courseId: number): Promise<CourseWithSections> {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}?include_sections=true`, {
            headers: await this.getAuthHeaders()
        });
        return this.handleResponse<CourseWithSections>(response);
    }

    async updateCourse(courseId: number, courseData: CourseUpdate): Promise<Course> {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
            method: 'PUT',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(courseData)
        });
        return this.handleResponse<Course>(response);
    }

    async updateCourseStatus(courseId: number, statusData: CourseStatusUpdate): Promise<Course> {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}/status`, {
            method: 'PUT',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(statusData)
        });
        return this.handleResponse<Course>(response);
    }

    async deleteCourse(courseId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}`, {
            method: 'DELETE',
            headers: await this.getAuthHeaders()
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
    }

    // Section Methods
    async createSection(courseId: number, sectionData: SectionCreate): Promise<Section> {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}/sections`, {
            method: 'POST',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(sectionData)
        });
        return this.handleResponse<Section>(response);
    }

    async getCourseSections(courseId: number): Promise<Section[]> {
        const response = await fetch(`${API_BASE_URL}/courses/${courseId}/sections`, {
            headers: await this.getAuthHeaders()
        });
        return this.handleResponse<Section[]>(response);
    }

    async getSectionById(sectionId: number): Promise<Section> {
        const response = await fetch(`${API_BASE_URL}/courses/sections/${sectionId}`, {
            headers: await this.getAuthHeaders()
        });
        return this.handleResponse<Section>(response);
    }

    async updateSection(sectionId: number, sectionData: SectionUpdate): Promise<Section> {
        const response = await fetch(`${API_BASE_URL}/courses/sections/${sectionId}`, {
            method: 'PUT',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(sectionData)
        });
        return this.handleResponse<Section>(response);
    }

    async deleteSection(sectionId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/courses/sections/${sectionId}`, {
            method: 'DELETE',
            headers: await this.getAuthHeaders()
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
    }

    // Lecture Methods
    async createLecture(sectionId: number, lectureData: LectureCreate): Promise<Lecture> {
        const response = await fetch(`${API_BASE_URL}/courses/sections/${sectionId}/lectures`, {
            method: 'POST',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(lectureData)
        });
        return this.handleResponse<Lecture>(response);
    }

    async getSectionLectures(sectionId: number): Promise<Lecture[]> {
        const response = await fetch(`${API_BASE_URL}/courses/sections/${sectionId}/lectures`, {
            headers: await this.getAuthHeaders()
        });
        return this.handleResponse<Lecture[]>(response);
    }

    async getLectureById(lectureId: number): Promise<Lecture> {
        const response = await fetch(`${API_BASE_URL}/courses/lectures/${lectureId}`, {
            headers: await this.getAuthHeaders()
        });
        return this.handleResponse<Lecture>(response);
    }

    async updateLecture(lectureId: number, lectureData: LectureUpdate): Promise<Lecture> {
        const response = await fetch(`${API_BASE_URL}/courses/lectures/${lectureId}`, {
            method: 'PUT',
            headers: await this.getAuthHeaders(),
            body: JSON.stringify(lectureData)
        });
        return this.handleResponse<Lecture>(response);
    }

    async deleteLecture(lectureId: number): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/courses/lectures/${lectureId}`, {
            method: 'DELETE',
            headers: await this.getAuthHeaders()
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
    }

    // Public Catalog Methods (no authentication required)
    async getCourseCatalog(
        filters?: CourseSearchFilters,
        page: number = 1,
        perPage: number = 20
    ): Promise<CourseListPaginatedResponse> {
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('per_page', perPage.toString());

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, value.toString());
                }
            });
        }

        const response = await fetch(`${API_BASE_URL}/courses/catalog?${params}`);
        return this.handleResponse<CourseListPaginatedResponse>(response);
    }

    async getCourseCatalogDetail(courseId: number): Promise<CourseWithSections> {
        const response = await fetch(`${API_BASE_URL}/courses/catalog/${courseId}`);
        return this.handleResponse<CourseWithSections>(response);
    }
}

export const courseService = new CourseService();