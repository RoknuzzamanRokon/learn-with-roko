import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Color Rendering Validation', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/style-guide');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000); // Additional wait for CSS to fully apply
    });

    test('primary colors render consistently across browsers', async ({ page, browserName }) => {
        await page.click('text=Color Palette');
        await page.waitForLoadState('networkidle');

        // Test primary color swatches
        const primaryColors = page.locator('[data-testid="primary-colors"]');
        await expect(primaryColors).toHaveScreenshot(`primary-colors-${browserName}.png`);

        // Test primary color usage in components
        await page.click('text=Components');
        await page.waitForLoadState('networkidle');

        const primaryButtons = page.locator('[data-testid="primary-buttons"]');
        if (await primaryButtons.isVisible()) {
            await expect(primaryButtons).toHaveScreenshot(`primary-buttons-${browserName}.png`);
        }
    });

    test('status colors render consistently across browsers', async ({ page, browserName }) => {
        await page.click('text=Color Palette');
        await page.waitForLoadState('networkidle');

        // Test status color swatches
        const statusColors = page.locator('[data-testid="status-colors"]');
        await expect(statusColors).toHaveScreenshot(`status-colors-${browserName}.png`);

        // Test status colors in components
        await page.click('text=Components');
        await page.waitForLoadState('networkidle');

        const statusButtons = page.locator('[data-testid="status-buttons"]');
        if (await statusButtons.isVisible()) {
            await expect(statusButtons).toHaveScreenshot(`status-buttons-${browserName}.png`);
        }

        // Test alert components with status colors
        const alerts = page.locator('[data-testid="alert-components"]');
        if (await alerts.isVisible()) {
            await expect(alerts).toHaveScreenshot(`alert-components-${browserName}.png`);
        }
    });

    test('neutral colors render consistently across browsers', async ({ page, browserName }) => {
        await page.click('text=Color Palette');
        await page.waitForLoadState('networkidle');

        // Test neutral color swatches
        const neutralColors = page.locator('[data-testid="neutral-colors"]');
        await expect(neutralColors).toHaveScreenshot(`neutral-colors-${browserName}.png`);

        // Test neutral colors in layout components
        await page.click('text=Components');
        await page.waitForLoadState('networkidle');

        const cards = page.locator('[data-testid="card-components"]');
        if (await cards.isVisible()) {
            await expect(cards).toHaveScreenshot(`card-components-${browserName}.png`);
        }
    });

    test('gradient and shadow effects render consistently', async ({ page, browserName }) => {
        await page.click('text=Components');
        await page.waitForLoadState('networkidle');

        // Test components with gradients and shadows
        const gradientComponents = page.locator('[data-testid="gradient-components"]');
        if (await gradientComponents.isVisible()) {
            await expect(gradientComponents).toHaveScreenshot(`gradient-components-${browserName}.png`);
        }

        const shadowComponents = page.locator('[data-testid="shadow-components"]');
        if (await shadowComponents.isVisible()) {
            await expect(shadowComponents).toHaveScreenshot(`shadow-components-${browserName}.png`);
        }
    });

    test('hover and focus states render consistently', async ({ page, browserName }) => {
        await page.click('text=Components');
        await page.waitForLoadState('networkidle');

        // Test button hover states
        const buttons = page.locator('[data-testid="interactive-buttons"] button').first();
        if (await buttons.isVisible()) {
            // Normal state
            await expect(buttons).toHaveScreenshot(`button-normal-${browserName}.png`);

            // Hover state
            await buttons.hover();
            await page.waitForTimeout(300); // Wait for hover transition
            await expect(buttons).toHaveScreenshot(`button-hover-${browserName}.png`);

            // Focus state
            await buttons.focus();
            await page.waitForTimeout(300); // Wait for focus transition
            await expect(buttons).toHaveScreenshot(`button-focus-${browserName}.png`);
        }

        // Test form input focus states
        const inputs = page.locator('[data-testid="form-inputs"] input').first();
        if (await inputs.isVisible()) {
            // Normal state
            await expect(inputs).toHaveScreenshot(`input-normal-${browserName}.png`);

            // Focus state
            await inputs.focus();
            await page.waitForTimeout(300);
            await expect(inputs).toHaveScreenshot(`input-focus-${browserName}.png`);
        }
    });

    test('color accessibility features render consistently', async ({ page, browserName }) => {
        await page.click('text=Accessibility');
        await page.waitForLoadState('networkidle');

        // Test high contrast mode simulation
        const highContrast = page.locator('[data-testid="high-contrast-demo"]');
        if (await highContrast.isVisible()) {
            await expect(highContrast).toHaveScreenshot(`high-contrast-${browserName}.png`);
        }

        // Test color blind simulation
        const colorBlindDemo = page.locator('[data-testid="colorblind-simulation"]');
        if (await colorBlindDemo.isVisible()) {
            await expect(colorBlindDemo).toHaveScreenshot(`colorblind-simulation-${browserName}.png`);
        }

        // Test contrast ratio examples
        const contrastExamples = page.locator('[data-testid="contrast-examples"]');
        if (await contrastExamples.isVisible()) {
            await expect(contrastExamples).toHaveScreenshot(`contrast-examples-${browserName}.png`);
        }
    });
});

test.describe('Browser-Specific Color Rendering Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/style-guide');
        await page.waitForLoadState('networkidle');
    });

    test('CSS custom properties render correctly', async ({ page, browserName }) => {
        // Test CSS custom property fallbacks
        await page.addStyleTag({
            content: `
                .test-custom-properties {
                    background: #2563eb; /* fallback */
                    background: var(--primary-600);
                    color: #ffffff; /* fallback */
                    color: var(--white);
                    padding: 20px;
                    margin: 10px;
                }
            `
        });

        await page.setContent(`
            <div class="test-custom-properties" data-testid="custom-properties-test">
                CSS Custom Properties Test
            </div>
        `);

        await expect(page.locator('[data-testid="custom-properties-test"]')).toHaveScreenshot(`custom-properties-${browserName}.png`);
    });

    test('color transparency and opacity render correctly', async ({ page, browserName }) => {
        // Test various opacity levels
        await page.setContent(`
            <div style="background: white; padding: 20px;">
                <div style="background: rgba(37, 99, 235, 1); color: white; padding: 10px; margin: 5px;" data-testid="opacity-100">
                    Opacity 100%
                </div>
                <div style="background: rgba(37, 99, 235, 0.8); color: white; padding: 10px; margin: 5px;" data-testid="opacity-80">
                    Opacity 80%
                </div>
                <div style="background: rgba(37, 99, 235, 0.6); color: white; padding: 10px; margin: 5px;" data-testid="opacity-60">
                    Opacity 60%
                </div>
                <div style="background: rgba(37, 99, 235, 0.4); color: white; padding: 10px; margin: 5px;" data-testid="opacity-40">
                    Opacity 40%
                </div>
                <div style="background: rgba(37, 99, 235, 0.2); color: black; padding: 10px; margin: 5px;" data-testid="opacity-20">
                    Opacity 20%
                </div>
            </div>
        `);

        await expect(page.locator('[data-testid="opacity-100"]').locator('..')).toHaveScreenshot(`opacity-levels-${browserName}.png`);
    });

    test('color blending modes render correctly', async ({ page, browserName }) => {
        // Test CSS blend modes if supported
        await page.setContent(`
            <div style="background: linear-gradient(45deg, #2563eb, #10b981); padding: 40px;" data-testid="blend-test">
                <div style="background: rgba(255, 255, 255, 0.8); mix-blend-mode: multiply; padding: 20px; color: black;">
                    Multiply Blend Mode
                </div>
                <div style="background: rgba(239, 68, 68, 0.8); mix-blend-mode: screen; padding: 20px; color: white; margin-top: 10px;">
                    Screen Blend Mode
                </div>
            </div>
        `);

        await expect(page.locator('[data-testid="blend-test"]')).toHaveScreenshot(`blend-modes-${browserName}.png`);
    });

    test('color gamut and wide color support', async ({ page, browserName }) => {
        // Test P3 color space if supported
        await page.setContent(`
            <div style="padding: 20px; background: white;" data-testid="color-gamut-test">
                <div style="background: rgb(37, 99, 235); padding: 15px; margin: 5px; color: white;">
                    sRGB Color
                </div>
                <div style="background: color(display-p3 0.146 0.388 0.922); padding: 15px; margin: 5px; color: white;">
                    P3 Color (if supported)
                </div>
                <div style="background: lch(50% 50 250); padding: 15px; margin: 5px; color: white;">
                    LCH Color (if supported)
                </div>
            </div>
        `);

        await expect(page.locator('[data-testid="color-gamut-test"]')).toHaveScreenshot(`color-gamut-${browserName}.png`);
    });
});

test.describe('Color Rendering Performance Tests', () => {
    test('large color grids render efficiently', async ({ page, browserName }) => {
        // Create a large grid of colored elements to test rendering performance
        const colorGrid = Array.from({ length: 100 }, (_, i) => {
            const hue = (i * 3.6) % 360;
            return `<div style="background: hsl(${hue}, 70%, 50%); width: 50px; height: 50px; display: inline-block; margin: 1px;"></div>`;
        }).join('');

        await page.setContent(`
            <div data-testid="color-grid" style="width: 600px;">
                ${colorGrid}
            </div>
        `);

        // Measure rendering time
        const startTime = Date.now();
        await page.locator('[data-testid="color-grid"]').waitFor();
        const renderTime = Date.now() - startTime;

        // Take screenshot for visual verification
        await expect(page.locator('[data-testid="color-grid"]')).toHaveScreenshot(`color-grid-${browserName}.png`);

        // Log performance for analysis
        console.log(`Color grid render time in ${browserName}: ${renderTime}ms`);
    });

    test('CSS animation color transitions render smoothly', async ({ page, browserName }) => {
        // Test color animations
        await page.setContent(`
            <style>
                @keyframes colorCycle {
                    0% { background-color: #2563eb; }
                    25% { background-color: #10b981; }
                    50% { background-color: #f59e0b; }
                    75% { background-color: #ef4444; }
                    100% { background-color: #2563eb; }
                }
                .animated-color {
                    width: 200px;
                    height: 200px;
                    animation: colorCycle 4s infinite;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                }
            </style>
            <div class="animated-color" data-testid="animated-color">
                Color Animation Test
            </div>
        `);

        // Take screenshots at different animation points
        await expect(page.locator('[data-testid="animated-color"]')).toHaveScreenshot(`animated-color-start-${browserName}.png`);

        await page.waitForTimeout(1000);
        await expect(page.locator('[data-testid="animated-color"]')).toHaveScreenshot(`animated-color-mid-${browserName}.png`);
    });
});