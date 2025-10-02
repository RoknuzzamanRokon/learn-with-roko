import { http, HttpResponse } from 'msw'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

export const handlers = [
    // Auth endpoints
    http.post(`${API_BASE_URL}/auth/login`, () => {
        return HttpResponse.json({
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            token_type: 'bearer',
            expires_in: 3600,
            user: {
                id: 1,
                email: 'test@example.com',
                username: 'testuser',
                first_name: 'Test',
                last_name: 'User',
                role: 'learner',
                is_active: true
            }
        })
    }),

    http.post(`${API_BASE_URL}/auth/register`, () => {
        return HttpResponse.json({
            id: 1,
            email: 'test@example.com',
            username: 'testuser',
            first_name: 'Test',
            last_name: 'User',
            role: 'learner',
            is_active: true,
            created_at: new Date().toISOString()
        })
    }),

    http.post(`${API_BASE_URL}/auth/refresh`, () => {
        return HttpResponse.json({
            access_token: 'new-mock-access-token',
            refresh_token: 'new-mock-refresh-token',
            token_type: 'bearer',
            expires_in: 3600
        })
    }),

    // User endpoints
    http.get(`${API_BASE_URL}/users/me`, () => {
        return HttpResponse.json({
            id: 1,
            email: 'test@example.com',
            username: 'testuser',
            first_name: 'Test',
            last_name: 'User',
            role: 'learner',
            is_active: true,
            created_at: new Date().toISOString()
        })
    }),

    // Course endpoints
    http.get(`${API_BASE_URL}/courses`, () => {
        return HttpResponse.json([
            {
                id: 1,
                title: 'Test Course 1',
                description: 'A test course description',
                instructor_id: 2,
                price: 99.99,
                is_published: true,
                thumbnail_url: 'https://example.com/thumbnail1.jpg',
                difficulty_level: 'beginner',
                created_at: new Date().toISOString(),
                instructor: {
                    id: 2,
                    first_name: 'John',
                    last_name: 'Instructor',
                    username: 'instructor1'
                }
            },
            {
                id: 2,
                title: 'Test Course 2',
                description: 'Another test course description',
                instructor_id: 2,
                price: 149.99,
                is_published: true,
                thumbnail_url: 'https://example.com/thumbnail2.jpg',
                difficulty_level: 'intermediate',
                created_at: new Date().toISOString(),
                instructor: {
                    id: 2,
                    first_name: 'John',
                    last_name: 'Instructor',
                    username: 'instructor1'
                }
            }
        ])
    }),

    http.get(`${API_BASE_URL}/courses/:id`, ({ params }) => {
        const { id } = params
        return HttpResponse.json({
            id: parseInt(id as string),
            title: `Test Course ${id}`,
            description: 'A detailed test course description',
            instructor_id: 2,
            price: 99.99,
            is_published: true,
            thumbnail_url: `https://example.com/thumbnail${id}.jpg`,
            difficulty_level: 'beginner',
            created_at: new Date().toISOString(),
            instructor: {
                id: 2,
                first_name: 'John',
                last_name: 'Instructor',
                username: 'instructor1'
            },
            sections: [
                {
                    id: 1,
                    title: 'Introduction',
                    description: 'Course introduction',
                    order_index: 1,
                    lectures: [
                        {
                            id: 1,
                            title: 'Welcome',
                            description: 'Welcome to the course',
                            order_index: 1,
                            duration_minutes: 5,
                            video_url: 'https://example.com/video1.mp4'
                        }
                    ]
                }
            ]
        })
    }),

    // Enrollment endpoints
    http.post(`${API_BASE_URL}/enrollments`, () => {
        return HttpResponse.json({
            id: 1,
            user_id: 1,
            course_id: 1,
            enrolled_at: new Date().toISOString(),
            progress_percentage: 0,
            completed_at: null
        })
    }),

    http.get(`${API_BASE_URL}/enrollments/user/:userId`, () => {
        return HttpResponse.json([
            {
                id: 1,
                user_id: 1,
                course_id: 1,
                enrolled_at: new Date().toISOString(),
                progress_percentage: 25.5,
                completed_at: null,
                course: {
                    id: 1,
                    title: 'Enrolled Course',
                    thumbnail_url: 'https://example.com/thumbnail.jpg',
                    instructor: {
                        first_name: 'John',
                        last_name: 'Instructor'
                    }
                }
            }
        ])
    }),

    // Error handlers
    http.get(`${API_BASE_URL}/error`, () => {
        return new HttpResponse(null, { status: 500 })
    }),

    http.get(`${API_BASE_URL}/unauthorized`, () => {
        return new HttpResponse(null, { status: 401 })
    }),
]