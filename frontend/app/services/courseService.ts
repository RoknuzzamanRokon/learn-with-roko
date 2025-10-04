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
import { getAuthHeaders } from '../utils/auth';
import { ApiService, getErrorMessage } from '../utils/api';

class CourseService extends ApiService {
    constructor() {
        super();
    }

    // Course Category Methods
    async createCategory(categoryData: CourseCategoryCreate): Promise<CourseCategory> {
        try {
            return await this.post<CourseCategory>('/courses/categories', categoryData, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async getCategories(includeInactive: boolean = false): Promise<CourseCategory[]> {
        try {
            const params = new URLSearchParams();
            if (includeInactive) {
                params.append('include_inactive', 'true');
            }

            return await this.get<CourseCategory[]>(`/courses/categories?${params}`, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async getCategoryById(categoryId: number): Promise<CourseCategory> {
        try {
            return await this.get<CourseCategory>(`/courses/categories/${categoryId}`, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async updateCategory(categoryId: number, categoryData: CourseCategoryUpdate): Promise<CourseCategory> {
        try {
            return await this.put<CourseCategory>(`/courses/categories/${categoryId}`, categoryData, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async deleteCategory(categoryId: number): Promise<void> {
        try {
            await this.delete<void>(`/courses/categories/${categoryId}`, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    // Course Methods
    async createCourse(courseData: CourseCreate): Promise<Course> {
        try {
            return await this.post<Course>('/courses', courseData, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async getCourses(
        filters?: CourseSearchFilters,
        page: number = 1,
        perPage: number = 20
    ): Promise<CourseListPaginatedResponse> {
        try {
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

            return await this.get<CourseListPaginatedResponse>(`/courses?${params}`, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async getMyCourses(page: number = 1, perPage: number = 20): Promise<CourseListPaginatedResponse> {
        try {
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('per_page', perPage.toString());

            return await this.get<CourseListPaginatedResponse>(`/courses/my-courses?${params}`, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async getCourseById(courseId: number, includeSections: boolean = false): Promise<Course | CourseWithSections> {
        try {
            const params = new URLSearchParams();
            if (includeSections) {
                params.append('include_sections', 'true');
            }

            return await this.get<Course | CourseWithSections>(`/courses/${courseId}?${params}`, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async getCourseWithSections(courseId: number): Promise<CourseWithSections> {
        try {
            return await this.get<CourseWithSections>(`/courses/${courseId}?include_sections=true`, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async updateCourse(courseId: number, courseData: CourseUpdate): Promise<Course> {
        try {
            return await this.put<Course>(`/courses/${courseId}`, courseData, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async updateCourseStatus(courseId: number, statusData: CourseStatusUpdate): Promise<Course> {
        try {
            return await this.put<Course>(`/courses/${courseId}/status`, statusData, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async deleteCourse(courseId: number): Promise<void> {
        try {
            await this.delete<void>(`/courses/${courseId}`, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    // Section Methods
    async createSection(courseId: number, sectionData: SectionCreate): Promise<Section> {
        try {
            return await this.post<Section>(`/courses/${courseId}/sections`, sectionData, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async getCourseSections(courseId: number): Promise<Section[]> {
        try {
            return await this.get<Section[]>(`/courses/${courseId}/sections`, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async getSectionById(sectionId: number): Promise<Section> {
        try {
            return await this.get<Section>(`/courses/sections/${sectionId}`, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async updateSection(sectionId: number, sectionData: SectionUpdate): Promise<Section> {
        try {
            return await this.put<Section>(`/courses/sections/${sectionId}`, sectionData, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async deleteSection(sectionId: number): Promise<void> {
        try {
            await this.delete<void>(`/courses/sections/${sectionId}`, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    // Lecture Methods
    async createLecture(sectionId: number, lectureData: LectureCreate): Promise<Lecture> {
        try {
            return await this.post<Lecture>(`/courses/sections/${sectionId}/lectures`, lectureData, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async getSectionLectures(sectionId: number): Promise<Lecture[]> {
        try {
            return await this.get<Lecture[]>(`/courses/sections/${sectionId}/lectures`, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async getLectureById(lectureId: number): Promise<Lecture> {
        try {
            return await this.get<Lecture>(`/courses/lectures/${lectureId}`, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async updateLecture(lectureId: number, lectureData: LectureUpdate): Promise<Lecture> {
        try {
            return await this.put<Lecture>(`/courses/lectures/${lectureId}`, lectureData, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async deleteLecture(lectureId: number): Promise<void> {
        try {
            await this.delete<void>(`/courses/lectures/${lectureId}`, await getAuthHeaders());
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    // Public Catalog Methods (no authentication required)
    async getCourseCatalog(
        filters?: CourseSearchFilters,
        page: number = 1,
        perPage: number = 20
    ): Promise<CourseListPaginatedResponse> {
        try {
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

            return await this.get<CourseListPaginatedResponse>(`/courses/catalog?${params}`);
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }

    async getCourseCatalogDetail(courseId: number): Promise<CourseWithSections> {
        try {
            return await this.get<CourseWithSections>(`/courses/catalog/${courseId}`);
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    }
}

export const courseService = new CourseService();