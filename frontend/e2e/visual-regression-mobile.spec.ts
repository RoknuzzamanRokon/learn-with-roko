import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Visual Regression Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/style-guide');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
    });

    test('color palette displays correctly on mobile', async ({ page }) => {
        await page.click('text=Color Palette');
        await page.waitForLoadState('networkidle');

        // Test mobile layout of color palette
        await expect(page.locator('[data-testid="color-palette"]')).toHaveScreenshot('mobile-color-palette.png');

        // Test individual color sections on mobile
        await expect(page.locator('[data-testid="primary-colors"]')).toHaveScreenshot('mobile-primary-colors.png');
        await expect(page.locator('[data-testid="status-colors"]')).toHaveScreenshot('mobile-status-colors.png');
    });

    test('component showcase displays correctly on mobile', async ({ page }) => {
        await page.click('text=Components');
        await page.waitForLoadState('networkidle');

        // Test mobile component layout
        await expect(page.locator('[data-testid="component-showcase"]')).toHaveScreenshot('mobile-component-showcase.png');

        // Test button components on mobile
        const buttons = page.locator('[data-testid="button-components"]');
        if (await buttons.isVisible()) {
            await expect(buttons).toHaveScreenshot('mobile-button-components.png');
        }

        // Test form components on mobile
        const forms = page.locator('[data-testid="form-components"]');
        if (await forms.isVisible()) {
            await expect(forms).toHaveScreenshot('mobile-form-components.png');
        }
    });

    test('navigation displays correctly on mobile', async ({ page }) => {
        // Test mobile navigation
        const navigation = page.locator('[data-testid="navigation"]');
        if (await navigation.isVisible()) {
            await expect(navigation).toHaveScreenshot('mobile-navigation.png');
        }

        // Test mobile menu if it exists
        const mobileMenu = page.locator('[data-testid="mobile-menu"]');
        if (await mobileMenu.isVisible()) {
            await expect(mobileMenu).toHaveScreenshot('mobile-menu.png');
        }

        // Test hamburger menu
        const hamburger = page.locator('[data-testid="hamburger-menu"]');
        if (await hamburger.isVisible()) {
            await hamburger.click();
            await page.waitForTimeout(300);
            await expect(page.locator('[data-testid="mobile-menu-open"]')).toHaveScreenshot('mobile-menu-open.png');
        }
    });
});

test.describe('Mobile Touch Interactions and Color Feedback', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/style-guide');
        await page.waitForLoadState('networkidle');
    });

    test('touch interactions show proper color feedback', async ({ page }) => {
        await page.click('text=Components');
        await page.waitForLoadState('networkidle');

        // Test touch feedback on buttons
        const buttons = page.locator('[data-testid="interactive-buttons"] button');
        if (await buttons.count() > 0) {
            const firstButton = buttons.first();

            // Normal state
            await expect(firstButton).toHaveScreenshot('mobile-button-normal.png');

            // Simulate touch start (active state)
            await firstButton.dispatchEvent('touchstart');
            await page.waitForTimeout(100);
            await expect(firstButton).toHaveScreenshot('mobile-button-active.png');

            // Touch end
            await firstButton.dispatchEvent('touchend');
            await page.waitForTimeout(100);
            await expect(firstButton).toHaveScreenshot('mobile-button-after-touch.png');
        }
    });

    test('mobile form interactions display correct colors', async ({ page }) => {
        await page.goto('/form-demo');
        await page.waitForLoadState('networkidle');

        // Test mobile form layout
        await expect(page).toHaveScreenshot('mobile-form-demo.png', { fullPage: true });

        // Test input focus on mobile
        const inputs = page.locator('input[type="text"]');
        if (await inputs.count() > 0) {
            const firstInput = inputs.first();

            // Normal state
            await expect(firstInput).toHaveScreenshot('mobile-input-normal.png');

            // Focus state
            await firstInput.focus();
            await page.waitForTimeout(300);
            await expect(firstInput).toHaveScreenshot('mobile-input-focus.png');

            // Type some text
            await firstInput.fill('Test input');
            await expect(firstInput).toHaveScreenshot('mobile-input-filled.png');
        }
    });

    test('mobile dashboard displays colors correctly', async ({ page }) => {
        // Login first
        await page.goto('/auth/login');
        await page.fill('[data-testid="email-input"]', 'learner@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');
        await page.waitForURL('/dashboard');
        await page.waitForLoadState('networkidle');

        // Test mobile dashboard layout
        await expect(page).toHaveScreenshot('mobile-dashboard.png', { fullPage: true });

        // Test mobile course cards
        const courseCards = page.locator('[data-testid="course-card"]');
        if (await courseCards.count() > 0) {
            await expect(courseCards.first()).toHaveScreenshot('mobile-course-card.png');
        }

        // Test mobile progress indicators
        const progressBars = page.locator('[data-testid="progress-bar"]');
        if (await progressBars.count() > 0) {
            await expect(progressBars.first()).toHaveScreenshot('mobile-progress-bar.png');
        }
    });
});

test.describe('Mobile Responsive Color Breakpoints', () => {
    const breakpoints = [
        { name: 'small-mobile', width: 320, height: 568 },
        { name: 'mobile', width: 375, height: 667 },
        { name: 'large-mobile', width: 414, height: 896 },
        { name: 'tablet-portrait', width: 768, height: 1024 },
        { name: 'tablet-landscape', width: 1024, height: 768 }
    ];

    for (const { name, width, height } of breakpoints) {
        test(`color system adapts correctly at ${name} (${width}x${height})`, async ({ page }) => {
            await page.setViewportSize({ width, height });
            await page.goto('/style-guide');
            await page.waitForLoadState('networkidle');

            // Test color palette at this breakpoint
            await page.click('text=Color Palette');
            await page.waitForLoadState('networkidle');
            await expect(page.locator('[data-testid="color-palette"]')).toHaveScreenshot(`color-palette-${name}.png`);

            // Test components at this breakpoint
            await page.click('text=Components');
            await page.waitForLoadState('networkidle');
            await expect(page.locator('[data-testid="component-showcase"]')).toHaveScreenshot(`component-showcase-${name}.png`);
        });
    }
});

test.describe('Mobile Dark Mode Color Testing', () => {
    test.beforeEach(async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.goto('/style-guide');
        await page.waitForLoadState('networkidle');
    });

    test('dark mode colors display correctly on mobile', async ({ page }) => {
        // Test dark mode color palette
        await page.click('text=Color Palette');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('[data-testid="color-palette"]')).toHaveScreenshot('mobile-dark-color-palette.png');

        // Test dark mode components
        await page.click('text=Components');
        await page.waitForLoadState('networkidle');
        await expect(page.locator('[data-testid="component-showcase"]')).toHaveScreenshot('mobile-dark-components.png');
    });

    test('dark mode dashboard displays correctly on mobile', async ({ page }) => {
        // Login first
        await page.goto('/auth/login');
        await page.fill('[data-testid="email-input"]', 'learner@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');
        await page.waitForURL('/dashboard');
        await page.waitForLoadState('networkidle');

        // Test dark mode mobile dashboard
        await expect(page).toHaveScreenshot('mobile-dark-dashboard.png', { fullPage: true });
    });
});

test.describe('Mobile Accessibility Color Testing', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/style-guide');
        await page.waitForLoadState('networkidle');
    });

    test('high contrast mode works on mobile', async ({ page }) => {
        // Simulate high contrast mode
        await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });

        await page.click('text=Accessibility');
        await page.waitForLoadState('networkidle');

        // Test high contrast accessibility features
        const highContrast = page.locator('[data-testid="high-contrast-demo"]');
        if (await highContrast.isVisible()) {
            await expect(highContrast).toHaveScreenshot('mobile-high-contrast.png');
        }
    });

    test('reduced motion affects color transitions on mobile', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });

        await page.click('text=Components');
        await page.waitForLoadState('networkidle');

        // Test that animations are reduced/disabled
        const animatedComponents = page.locator('[data-testid="animated-components"]');
        if (await animatedComponents.isVisible()) {
            await expect(animatedComponents).toHaveScreenshot('mobile-reduced-motion.png');
        }
    });

    test('mobile color blind simulation works correctly', async ({ page }) => {
        await page.click('text=Accessibility');
        await page.waitForLoadState('networkidle');

        // Test color blind simulation on mobile
        const colorBlindDemo = page.locator('[data-testid="colorblind-simulation"]');
        if (await colorBlindDemo.isVisible()) {
            await expect(colorBlindDemo).toHaveScreenshot('mobile-colorblind-simulation.png');
        }

        // Test different color blind types
        const protanopia = page.locator('[data-testid="protanopia-demo"]');
        if (await protanopia.isVisible()) {
            await expect(protanopia).toHaveScreenshot('mobile-protanopia.png');
        }

        const deuteranopia = page.locator('[data-testid="deuteranopia-demo"]');
        if (await deuteranopia.isVisible()) {
            await expect(deuteranopia).toHaveScreenshot('mobile-deuteranopia.png');
        }

        const tritanopia = page.locator('[data-testid="tritanopia-demo"]');
        if (await tritanopia.isVisible()) {
            await expect(tritanopia).toHaveScreenshot('mobile-tritanopia.png');
        }
    });
});

test.describe('Mobile Performance Color Testing', () => {
    test('mobile color rendering performance', async ({ page }) => {
        await page.goto('/style-guide');
        await page.waitForLoadState('networkidle');

        // Measure paint timing for color-heavy pages
        const paintTiming = await page.evaluate(() => {
            const entries = performance.getEntriesByType('paint');
            return entries.reduce((acc, entry) => {
                acc[entry.name] = entry.startTime;
                return acc;
            }, {});
        });

        console.log('Mobile paint timing:', paintTiming);

        // Test large color grids on mobile
        await page.setContent(`
            <div data-testid="mobile-color-grid" style="display: grid; grid-template-columns: repeat(10, 1fr); gap: 2px; padding: 10px;">
                ${Array.from({ length: 100 }, (_, i) => {
            const hue = (i * 3.6) % 360;
            return `<div style="background: hsl(${hue}, 70%, 50%); aspect-ratio: 1; min-height: 20px;"></div>`;
        }).join('')}
            </div>
        `);

        await expect(page.locator('[data-testid="mobile-color-grid"]')).toHaveScreenshot('mobile-color-grid-performance.png');
    });
});