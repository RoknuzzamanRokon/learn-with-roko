import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the application
        await page.goto('/');
    });

    test('user can register a new account', async ({ page }) => {
        // Navigate to registration page
        await page.click('text=Sign Up');

        // Fill out registration form
        await page.fill('[data-testid="first-name-input"]', 'John');
        await page.fill('[data-testid="last-name-input"]', 'Doe');
        await page.fill('[data-testid="email-input"]', 'john.doe@example.com');
        await page.fill('[data-testid="username-input"]', 'johndoe');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.fill('[data-testid="confirm-password-input"]', 'password123');

        // Submit registration
        await page.click('[data-testid="register-button"]');

        // Verify successful registration
        await expect(page).toHaveURL('/dashboard');
        await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Welcome, John');
    });

    test('user can login with valid credentials', async ({ page }) => {
        // Navigate to login page
        await page.click('text=Sign In');

        // Fill out login form
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');

        // Submit login
        await page.click('[data-testid="login-button"]');

        // Verify successful login
        await expect(page).toHaveURL('/dashboard');
        await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    });

    test('user cannot login with invalid credentials', async ({ page }) => {
        // Navigate to login page
        await page.click('text=Sign In');

        // Fill out login form with invalid credentials
        await page.fill('[data-testid="email-input"]', 'invalid@example.com');
        await page.fill('[data-testid="password-input"]', 'wrongpassword');

        // Submit login
        await page.click('[data-testid="login-button"]');

        // Verify error message is displayed
        await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');

        // Verify user is not redirected
        await expect(page).toHaveURL('/auth/login');
    });

    test('user can logout successfully', async ({ page }) => {
        // Login first
        await page.goto('/auth/login');
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');

        // Wait for dashboard to load
        await expect(page).toHaveURL('/dashboard');

        // Click user menu and logout
        await page.click('[data-testid="user-menu"]');
        await page.click('[data-testid="logout-button"]');

        // Verify user is logged out and redirected
        await expect(page).toHaveURL('/');
        await expect(page.locator('text=Sign In')).toBeVisible();
    });

    test('form validation works correctly', async ({ page }) => {
        // Navigate to registration page
        await page.click('text=Sign Up');

        // Try to submit empty form
        await page.click('[data-testid="register-button"]');

        // Verify validation errors are displayed
        await expect(page.locator('[data-testid="first-name-error"]')).toContainText('First name is required');
        await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required');

        // Fill invalid email
        await page.fill('[data-testid="email-input"]', 'invalid-email');
        await page.click('[data-testid="register-button"]');

        // Verify email validation error
        await expect(page.locator('[data-testid="email-error"]')).toContainText('Please enter a valid email');

        // Fill short password
        await page.fill('[data-testid="password-input"]', '123');
        await page.click('[data-testid="register-button"]');

        // Verify password validation error
        await expect(page.locator('[data-testid="password-error"]')).toContainText('Password must be at least 6 characters');
    });

    test('password reset flow works', async ({ page }) => {
        // Navigate to login page
        await page.goto('/auth/login');

        // Click forgot password link
        await page.click('text=Forgot Password?');

        // Verify we're on the forgot password page
        await expect(page).toHaveURL('/auth/forgot-password');

        // Fill email and submit
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.click('[data-testid="reset-password-button"]');

        // Verify success message
        await expect(page.locator('[data-testid="success-message"]')).toContainText('Password reset email sent');
    });

    test('protected routes redirect to login when not authenticated', async ({ page }) => {
        // Try to access protected route directly
        await page.goto('/dashboard');

        // Verify redirect to login
        await expect(page).toHaveURL('/auth/login');

        // Try to access instructor dashboard
        await page.goto('/instructor/dashboard');

        // Verify redirect to login
        await expect(page).toHaveURL('/auth/login');
    });

    test('role-based access control works correctly', async ({ page }) => {
        // Login as learner
        await page.goto('/auth/login');
        await page.fill('[data-testid="email-input"]', 'learner@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');

        // Try to access instructor dashboard
        await page.goto('/instructor/dashboard');

        // Verify access denied or redirect
        await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();

        // Logout and login as instructor
        await page.click('[data-testid="user-menu"]');
        await page.click('[data-testid="logout-button"]');

        await page.goto('/auth/login');
        await page.fill('[data-testid="email-input"]', 'instructor@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');

        // Now try to access instructor dashboard
        await page.goto('/instructor/dashboard');

        // Verify access is granted
        await expect(page.locator('[data-testid="instructor-dashboard"]')).toBeVisible();
    });
});