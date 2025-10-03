import { Page, Locator, expect } from '@playwright/test';

/**
 * Utility functions for visual regression testing
 * Provides consistent methods for taking screenshots and validating visual elements
 */

export class VisualTestHelpers {
    constructor(private page: Page) { }

    /**
     * Wait for all images and fonts to load before taking screenshots
     */
    async waitForVisualStability(): Promise<void> {
        // Wait for network to be idle
        await this.page.waitForLoadState('networkidle');

        // Wait for fonts to load
        await this.page.waitForFunction(() => document.fonts.ready);

        // Wait for images to load
        await this.page.waitForFunction(() => {
            const images = Array.from(document.images);
            return images.every(img => img.complete);
        });

        // Additional wait for CSS animations to settle
        await this.page.waitForTimeout(500);
    }

    /**
     * Take a screenshot of a component with consistent settings
     */
    async screenshotComponent(
        locator: Locator,
        name: string,
        options: {
            fullPage?: boolean;
            clip?: { x: number; y: number; width: number; height: number };
            mask?: Locator[];
            threshold?: number;
        } = {}
    ): Promise<void> {
        await this.waitForVisualStability();

        const screenshotOptions = {
            threshold: 0.2,
            mode: 'percent' as const,
            ...options
        };

        await expect(locator).toHaveScreenshot(name, screenshotOptions);
    }

    /**
     * Take a full page screenshot with consistent settings
     */
    async screenshotPage(
        name: string,
        options: {
            mask?: Locator[];
            threshold?: number;
        } = {}
    ): Promise<void> {
        await this.waitForVisualStability();

        const screenshotOptions = {
            fullPage: true,
            threshold: 0.2,
            mode: 'percent' as const,
            ...options
        };

        await expect(this.page).toHaveScreenshot(name, screenshotOptions);
    }

    /**
     * Test color consistency across different states
     */
    async testColorStates(
        element: Locator,
        baseName: string,
        states: Array<{
            name: string;
            action: () => Promise<void>;
            waitTime?: number;
        }>
    ): Promise<void> {
        // Test normal state
        await this.screenshotComponent(element, `${baseName}-normal.png`);

        // Test each state
        for (const state of states) {
            await state.action();
            if (state.waitTime) {
                await this.page.waitForTimeout(state.waitTime);
            }
            await this.screenshotComponent(element, `${baseName}-${state.name}.png`);
        }
    }

    /**
     * Test responsive behavior at different breakpoints
     */
    async testResponsiveColors(
        name: string,
        breakpoints: Array<{ name: string; width: number; height: number }>
    ): Promise<void> {
        for (const breakpoint of breakpoints) {
            await this.page.setViewportSize({
                width: breakpoint.width,
                height: breakpoint.height
            });
            await this.waitForVisualStability();
            await this.screenshotPage(`${name}-${breakpoint.name}.png`);
        }
    }

    /**
     * Test color accessibility features
     */
    async testAccessibilityColors(baseName: string): Promise<void> {
        // Test normal colors
        await this.screenshotPage(`${baseName}-normal.png`);

        // Test high contrast mode
        await this.page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
        await this.waitForVisualStability();
        await this.screenshotPage(`${baseName}-high-contrast.png`);

        // Test reduced motion
        await this.page.emulateMedia({ reducedMotion: 'reduce' });
        await this.waitForVisualStability();
        await this.screenshotPage(`${baseName}-reduced-motion.png`);

        // Reset to normal
        await this.page.emulateMedia({ colorScheme: 'light', reducedMotion: 'no-preference' });
    }

    /**
     * Create a color test grid for validation
     */
    async createColorTestGrid(colors: Array<{ name: string; value: string }>): Promise<void> {
        const gridHtml = colors.map(color =>
            `<div style="background: ${color.value}; width: 100px; height: 100px; display: inline-block; margin: 5px; position: relative;">
                <span style="position: absolute; bottom: 5px; left: 5px; background: rgba(0,0,0,0.7); color: white; padding: 2px 4px; font-size: 10px;">
                    ${color.name}
                </span>
            </div>`
        ).join('');

        await this.page.setContent(`
            <div data-testid="color-test-grid" style="padding: 20px; background: white;">
                <h2>Color Test Grid</h2>
                ${gridHtml}
            </div>
        `);

        await this.screenshotComponent(
            this.page.locator('[data-testid="color-test-grid"]'),
            'color-test-grid.png'
        );
    }

    /**
     * Test color contrast ratios
     */
    async testColorContrast(
        foregroundColor: string,
        backgroundColor: string,
        testName: string
    ): Promise<void> {
        await this.page.setContent(`
            <div data-testid="contrast-test" style="
                background: ${backgroundColor}; 
                color: ${foregroundColor}; 
                padding: 40px; 
                font-size: 18px;
                font-weight: normal;
            ">
                <h1 style="color: ${foregroundColor}; margin: 0 0 20px 0;">Heading Text (${foregroundColor} on ${backgroundColor})</h1>
                <p style="margin: 0 0 20px 0;">Regular body text for contrast testing. This text should meet WCAG AA standards.</p>
                <p style="font-size: 14px; margin: 0;">Small text (14px) for additional contrast validation.</p>
                <button style="
                    background: ${foregroundColor}; 
                    color: ${backgroundColor}; 
                    border: 2px solid ${foregroundColor};
                    padding: 10px 20px;
                    margin-top: 20px;
                ">Button Example</button>
            </div>
        `);

        await this.screenshotComponent(
            this.page.locator('[data-testid="contrast-test"]'),
            `contrast-test-${testName}.png`
        );
    }

    /**
     * Simulate color blindness for testing
     */
    async simulateColorBlindness(type: 'protanopia' | 'deuteranopia' | 'tritanopia'): Promise<void> {
        const filters = {
            protanopia: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\'><defs><filter id=\'protanopia\'><feColorMatrix values=\'0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0\'/></filter></defs></svg>#protanopia")',
            deuteranopia: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\'><defs><filter id=\'deuteranopia\'><feColorMatrix values=\'0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0\'/></filter></defs></svg>#deuteranopia")',
            tritanopia: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\'><defs><filter id=\'tritanopia\'><feColorMatrix values=\'0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0\'/></filter></defs></svg>#tritanopia")'
        };

        await this.page.addStyleTag({
            content: `
                body { 
                    filter: ${filters[type]} !important; 
                }
            `
        });
    }

    /**
     * Test animation color transitions
     */
    async testColorAnimations(
        element: Locator,
        baseName: string,
        animationDuration: number = 2000
    ): Promise<void> {
        // Capture start state
        await this.screenshotComponent(element, `${baseName}-animation-start.png`);

        // Capture mid-animation
        await this.page.waitForTimeout(animationDuration / 2);
        await this.screenshotComponent(element, `${baseName}-animation-mid.png`);

        // Capture end state
        await this.page.waitForTimeout(animationDuration / 2);
        await this.screenshotComponent(element, `${baseName}-animation-end.png`);
    }

    /**
     * Validate color consistency across themes
     */
    async testThemeConsistency(
        themes: Array<{ name: string; cssClass: string }>,
        testName: string
    ): Promise<void> {
        for (const theme of themes) {
            await this.page.evaluate((className) => {
                document.body.className = className;
            }, theme.cssClass);

            await this.waitForVisualStability();
            await this.screenshotPage(`${testName}-${theme.name}.png`);
        }
    }

    /**
     * Test color performance with large datasets
     */
    async testColorPerformance(
        colorCount: number,
        testName: string
    ): Promise<{ renderTime: number; paintTime: number }> {
        const colors = Array.from({ length: colorCount }, (_, i) => {
            const hue = (i * 360) / colorCount;
            return `hsl(${hue}, 70%, 50%)`;
        });

        const startTime = performance.now();

        await this.page.setContent(`
            <div data-testid="performance-test" style="display: flex; flex-wrap: wrap; padding: 20px;">
                ${colors.map(color =>
            `<div style="background: ${color}; width: 20px; height: 20px; margin: 1px;"></div>`
        ).join('')}
            </div>
        `);

        await this.waitForVisualStability();
        const renderTime = performance.now() - startTime;

        // Get paint timing
        const paintTiming = await this.page.evaluate(() => {
            const entries = performance.getEntriesByType('paint');
            const firstPaint = entries.find(entry => entry.name === 'first-paint');
            return firstPaint ? firstPaint.startTime : 0;
        });

        await this.screenshotComponent(
            this.page.locator('[data-testid="performance-test"]'),
            `${testName}-performance.png`
        );

        return { renderTime, paintTime: paintTiming };
    }
}