import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests - Core Components', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to style guide for component testing
        await page.goto('/style-guide');

        // Wait for page to fully load and styles to apply
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000); // Additional wait for CSS animations
    });

    test('color palette displays correctly', async ({ page }) => {
        // Navigate to colors tab
        await page.click('text=Color Palette');
        await page.waitForLoadState('networkidle');

        // Take screenshot of the entire color palette
        await expect(page.locator('[data-testid="color-palette"]')).toHaveScreenshot('color-palette.png');

        // Test individual color sections
        await expect(page.locator('[data-testid="primary-colors"]')).toHaveScreenshot('primary-colors.png');
        await expect(page.locator('[data-testid="neutral-colors"]')).toHaveScreenshot('neutral-colors.png');
        await expect(page.locator('[data-testid="status-colors"]')).toHaveScreenshot('status-colors.png');
        await expect(page.locator('[data-testid="accent-colors"]')).toHaveScreenshot('accent-colors.png');
    });

    test('component showcase displays correctly', async ({ page }) => {
        // Navigate to components tab
        await page.click('text=Components');
        await page.waitForLoadState('networkidle');

        // Take screenshot of the entire component showcase
        await expect(page.locator('[data-testid="component-showcase"]')).toHaveScreenshot('component-showcase.png');

        // Test individual component sections
        await expect(page.locator('[data-testid="button-components"]')).toHaveScreenshot('button-components.png');
        await expect(page.locator('[data-testid="card-components"]')).toHaveScreenshot('card-components.png');
        await expect(page.locator('[data-testid="form-components"]')).toHaveScreenshot('form-components.png');
        await expect(page.locator('[data-testid="navigation-components"]')).toHaveScreenshot('navigation-components.png');
    });

    test('accessibility demo displays correctly', async ({ page }) => {
        // Navigate to accessibility tab
        await page.click('text=Accessibility');
        await page.waitForLoadState('networkidle');

        // Take screenshot of accessibility demonstrations
        await expect(page.locator('[data-testid="accessibility-demo"]')).toHaveScreenshot('accessibility-demo.png');
        await expect(page.locator('[data-testid="contrast-examples"]')).toHaveScreenshot('contrast-examples.png');
        await expect(page.locator('[data-testid="colorblind-simulation"]')).toHaveScreenshot('colorblind-simulation.png');
    });
});

test.describe('Visual Regression Tests - Dashboard Components', () => {
    test.beforeEach(async ({ page }) => {
        // Login as learner to access dashboard
        await page.goto('/auth/login');
        await page.fill('[data-testid="email-input"]', 'learner@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');
        await page.waitForURL('/dashboard');
        await page.waitForLoadState('networkidle');
    });

    test('learner dashboard displays correctly', async ({ page }) => {
        // Take screenshot of entire dashboard
        await expect(page).toHaveScreenshot('learner-dashboard.png', { fullPage: true });

        // Test individual dashboard components
        await expect(page.locator('[data-testid="dashboard-stats"]')).toHaveScreenshot('dashboard-stats.png');
        await expect(page.locator('[data-testid="enrolled-courses"]')).toHaveScreenshot('enrolled-courses.png');
        await expect(page.locator('[data-testid="recent-activity"]')).toHaveScreenshot('recent-activity.png');
        await expect(page.locator('[data-testid="certificates-portfolio"]')).toHaveScreenshot('certificates-portfolio.png');
    });

    test('course cards display correctly', async ({ page }) => {
        // Test different course card states
        const courseCards = page.locator('[data-testid="course-card"]');

        if (await courseCards.count() > 0) {
            await expect(courseCards.first()).toHaveScreenshot('course-card-enrolled.png');
        }

        // Test progress indicators
        const progressBars = page.locator('[data-testid="progress-bar"]');
        if (await progressBars.count() > 0) {
            await expect(progressBars.first()).toHaveScreenshot('progress-bar.png');
        }
    });
});

test.describe('Visual Regression Tests - Course Catalog', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/catalog');
        await page.waitForLoadState('networkidle');
    });

    test('course catalog displays correctly', async ({ page }) => {
        // Take screenshot of entire catalog page
        await expect(page).toHaveScreenshot('course-catalog.png', { fullPage: true });

        // Test course filters
        await expect(page.locator('[data-testid="course-filters"]')).toHaveScreenshot('course-filters.png');

        // Test course grid
        await expect(page.locator('[data-testid="course-grid"]')).toHaveScreenshot('course-grid.png');
    });

    test('course cards in catalog display correctly', async ({ page }) => {
        const courseCards = page.locator('[data-testid="course-card"]');

        if (await courseCards.count() > 0) {
            // Test different course card variants
            await expect(courseCards.first()).toHaveScreenshot('catalog-course-card.png');

            // Test featured course cards if they exist
            const featuredCards = page.locator('[data-testid="featured-course-card"]');
            if (await featuredCards.count() > 0) {
                await expect(featuredCards.first()).toHaveScreenshot('featured-course-card.png');
            }
        }
    });
});

test.describe('Visual Regression Tests - Learning Interface', () => {
    test.beforeEach(async ({ page }) => {
        // Login and navigate to a course
        await page.goto('/auth/login');
        await page.fill('[data-testid="email-input"]', 'learner@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');
        await page.waitForURL('/dashboard');

        // Navigate to first enrolled course
        const continueButton = page.locator('[data-testid="continue-learning-button"]').first();
        if (await continueButton.isVisible()) {
            await continueButton.click();
            await page.waitForLoadState('networkidle');
        }
    });

    test('course player displays correctly', async ({ page }) => {
        // Skip if not on a course page
        if (!page.url().includes('/learn/')) {
            test.skip();
        }

        // Take screenshot of course player
        await expect(page).toHaveScreenshot('course-player.png', { fullPage: true });

        // Test course sidebar
        await expect(page.locator('[data-testid="course-sidebar"]')).toHaveScreenshot('course-sidebar.png');

        // Test video player controls if present
        const videoPlayer = page.locator('[data-testid="video-player"]');
        if (await videoPlayer.isVisible()) {
            await expect(videoPlayer).toHaveScreenshot('video-player.png');
        }

        // Test course completion status
        const completionStatus = page.locator('[data-testid="course-completion-status"]');
        if (await completionStatus.isVisible()) {
            await expect(completionStatus).toHaveScreenshot('course-completion-status.png');
        }
    });

    test('quiz interface displays correctly', async ({ page }) => {
        // Skip if not on a course page
        if (!page.url().includes('/learn/')) {
            test.skip();
        }

        // Navigate to quiz if available
        const quizLink = page.locator('[data-testid="quiz-link"]').first();
        if (await quizLink.isVisible()) {
            await quizLink.click();
            await page.waitForLoadState('networkidle');

            // Test quiz taking interface
            await expect(page.locator('[data-testid="quiz-taking"]')).toHaveScreenshot('quiz-taking.png');

            // Test different question states
            const questions = page.locator('[data-testid="quiz-question"]');
            if (await questions.count() > 0) {
                await expect(questions.first()).toHaveScreenshot('quiz-question.png');
            }
        }
    });
});

test.describe('Visual Regression Tests - Admin Interface', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin
        await page.goto('/auth/login');
        await page.fill('[data-testid="email-input"]', 'admin@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');
        await page.waitForURL('/dashboard');

        // Navigate to admin panel
        await page.goto('/admin');
        await page.waitForLoadState('networkidle');
    });

    test('admin dashboard displays correctly', async ({ page }) => {
        // Take screenshot of admin dashboard
        await expect(page).toHaveScreenshot('admin-dashboard.png', { fullPage: true });

        // Test metric cards
        await expect(page.locator('[data-testid="admin-metrics"]')).toHaveScreenshot('admin-metrics.png');

        // Test user management section
        const userManagement = page.locator('[data-testid="user-management"]');
        if (await userManagement.isVisible()) {
            await expect(userManagement).toHaveScreenshot('user-management.png');
        }
    });

    test('theme configuration displays correctly', async ({ page }) => {
        // Navigate to theme configuration
        await page.goto('/admin/theme');
        await page.waitForLoadState('networkidle');

        // Test theme configuration interface
        await expect(page.locator('[data-testid="theme-configuration"]')).toHaveScreenshot('theme-configuration.png');

        // Test color picker components
        const colorPickers = page.locator('[data-testid="color-picker"]');
        if (await colorPickers.count() > 0) {
            await expect(colorPickers.first()).toHaveScreenshot('color-picker.png');
        }

        // Test theme preview
        const themePreview = page.locator('[data-testid="theme-preview"]');
        if (await themePreview.isVisible()) {
            await expect(themePreview).toHaveScreenshot('theme-preview.png');
        }
    });
});

test.describe('Visual Regression Tests - Form Components', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/form-demo');
        await page.waitForLoadState('networkidle');
    });

    test('form components display correctly', async ({ page }) => {
        // Take screenshot of form demo page
        await expect(page).toHaveScreenshot('form-demo.png', { fullPage: true });

        // Test different form states
        await expect(page.locator('[data-testid="form-inputs"]')).toHaveScreenshot('form-inputs.png');
        await expect(page.locator('[data-testid="form-validation"]')).toHaveScreenshot('form-validation.png');

        // Test form buttons
        await expect(page.locator('[data-testid="form-buttons"]')).toHaveScreenshot('form-buttons.png');
    });

    test('form validation states display correctly', async ({ page }) => {
        // Trigger validation errors
        const submitButton = page.locator('[data-testid="submit-button"]');
        if (await submitButton.isVisible()) {
            await submitButton.click();
            await page.waitForTimeout(500); // Wait for validation to appear

            // Test error states
            await expect(page.locator('[data-testid="form-errors"]')).toHaveScreenshot('form-errors.png');
        }

        // Test success states
        const successForm = page.locator('[data-testid="success-form"]');
        if (await successForm.isVisible()) {
            await expect(successForm).toHaveScreenshot('form-success.png');
        }
    });
});

test.describe('Visual Regression Tests - Loading States', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/style-guide');
        await page.waitForLoadState('networkidle');
    });

    test('loading components display correctly', async ({ page }) => {
        // Navigate to components that show loading states
        await page.click('text=Components');
        await page.waitForLoadState('networkidle');

        // Test loading spinners
        const loadingSpinners = page.locator('[data-testid="loading-spinner"]');
        if (await loadingSpinners.count() > 0) {
            await expect(loadingSpinners.first()).toHaveScreenshot('loading-spinner.png');
        }

        // Test skeleton loaders
        const skeletonLoaders = page.locator('[data-testid="skeleton-loader"]');
        if (await skeletonLoaders.count() > 0) {
            await expect(skeletonLoaders.first()).toHaveScreenshot('skeleton-loader.png');
        }

        // Test progress bars
        const progressBars = page.locator('[data-testid="progress-bar"]');
        if (await progressBars.count() > 0) {
            await expect(progressBars.first()).toHaveScreenshot('progress-bar-loading.png');
        }
    });
});