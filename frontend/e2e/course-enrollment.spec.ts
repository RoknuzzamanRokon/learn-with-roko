import { test, expect } from '@playwright/test';

test.describe('Course Enrollment Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Login as a learner before each test
        await page.goto('/auth/login');
        await page.fill('[data-testid="email-input"]', 'learner@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');
        await expect(page).toHaveURL('/dashboard');
    });

    test('user can browse course catalog', async ({ page }) => {
        // Navigate to course catalog
        await page.click('[data-testid="browse-courses-link"]');

        // Verify we're on the catalog page
        await expect(page).toHaveURL('/catalog');

        // Verify courses are displayed
        await expect(page.locator('[data-testid="course-card"]')).toHaveCount.greaterThan(0);

        // Verify course information is displayed
        const firstCourse = page.locator('[data-testid="course-card"]').first();
        await expect(firstCourse.locator('[data-testid="course-title"]')).toBeVisible();
        await expect(firstCourse.locator('[data-testid="course-price"]')).toBeVisible();
        await expect(firstCourse.locator('[data-testid="course-difficulty"]')).toBeVisible();
    });

    test('user can search and filter courses', async ({ page }) => {
        await page.goto('/catalog');

        // Test search functionality
        await page.fill('[data-testid="search-input"]', 'JavaScript');
        await page.press('[data-testid="search-input"]', 'Enter');

        // Verify search results
        await expect(page.locator('[data-testid="course-card"]')).toHaveCount.greaterThan(0);

        // Test category filter
        await page.click('[data-testid="category-filter"]');
        await page.click('[data-testid="category-programming"]');

        // Verify filtered results
        await expect(page.locator('[data-testid="course-card"]')).toHaveCount.greaterThan(0);
    });

    test('user can enroll in a free course', async ({ page }) => {
        await page.goto('/catalog');

        // Find and click on a free course
        const freeCourse = page.locator('[data-testid="course-card"]').filter({ hasText: 'Free' }).first();
        await freeCourse.click();

        // Verify we're on the course detail page
        await expect(page.locator('[data-testid="course-title"]')).toBeVisible();

        // Enroll in the course
        await page.click('[data-testid="enroll-button"]');

        // Verify enrollment success
        await expect(page.locator('[data-testid="enrollment-success"]')).toBeVisible();

        // Verify we can access the course
        await page.click('[data-testid="start-learning-button"]');
        await expect(page).toHaveURL(/\/learn\/\d+/);
    });

    test('user can enroll in a paid course', async ({ page }) => {
        await page.goto('/catalog');

        // Find and click on a paid course
        const paidCourse = page.locator('[data-testid="course-card"]').filter({ hasText: '$' }).first();
        await paidCourse.click();

        // Verify we're on the course detail page
        await expect(page.locator('[data-testid="course-title"]')).toBeVisible();

        // Click enroll button
        await page.click('[data-testid="enroll-button"]');

        // Verify payment form is displayed
        await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();

        // Fill payment information (using test card)
        await page.fill('[data-testid="card-number"]', '4242424242424242');
        await page.fill('[data-testid="card-expiry"]', '12/25');
        await page.fill('[data-testid="card-cvc"]', '123');

        // Submit payment
        await page.click('[data-testid="pay-button"]');

        // Verify enrollment success
        await expect(page.locator('[data-testid="enrollment-success"]')).toBeVisible();
    });

    test('user can view enrolled courses in dashboard', async ({ page }) => {
        // Assume user has enrolled courses
        await page.goto('/dashboard');

        // Verify enrolled courses section
        await expect(page.locator('[data-testid="enrolled-courses"]')).toBeVisible();

        // Verify course progress is displayed
        const enrolledCourse = page.locator('[data-testid="enrolled-course-card"]').first();
        await expect(enrolledCourse.locator('[data-testid="progress-bar"]')).toBeVisible();

        // Click to continue learning
        await enrolledCourse.locator('[data-testid="continue-learning-button"]').click();

        // Verify we're taken to the course player
        await expect(page).toHaveURL(/\/learn\/\d+/);
    });
});