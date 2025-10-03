import { defineConfig, devices } from '@playwright/test';

/**
 * Visual Regression Testing Configuration
 * Specialized configuration for visual regression tests with optimized settings
 * for screenshot consistency and cross-browser/mobile testing
 */
export default defineConfig({
    testDir: './e2e',
    testMatch: '**/visual-regression*.spec.ts',

    /* Run tests in files in parallel */
    fullyParallel: true,

    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,

    /* Retry on CI only - visual tests can be flaky */
    retries: process.env.CI ? 3 : 1,

    /* Opt out of parallel tests on CI for more consistent screenshots */
    workers: process.env.CI ? 1 : 2,

    /* Reporter to use */
    reporter: [
        ['html', { outputFolder: 'playwright-report-visual' }],
        ['json', { outputFile: 'visual-test-results.json' }]
    ],

    /* Global test timeout */
    timeout: 60000,

    /* Expect timeout for assertions */
    expect: {
        /* Timeout for expect() calls */
        timeout: 10000,

        /* Threshold for screenshot comparison (0-1, where 0 is identical) */
        toHaveScreenshot: {
            threshold: 0.2
        },

        /* Animation handling */
        toMatchSnapshot: {
            threshold: 0.2
        }
    },

    /* Shared settings for all projects */
    use: {
        /* Base URL */
        baseURL: 'http://localhost:3000',

        /* Collect trace when retrying failed test */
        trace: 'retain-on-failure',

        /* Take screenshot on failure */
        screenshot: 'only-on-failure',

        /* Record video on failure */
        video: 'retain-on-failure',

        /* Disable animations for consistent screenshots */
        // reducedMotion: 'reduce', // Commented out due to TypeScript compatibility

        /* Force consistent color scheme */
        colorScheme: 'light',

        /* Consistent viewport for desktop tests */
        viewport: { width: 1280, height: 720 },

        /* Ignore HTTPS errors */
        ignoreHTTPSErrors: true,

        /* Wait for fonts to load */
        // waitForTimeout: 2000 // Commented out due to TypeScript compatibility
    },

    /* Configure projects for different browsers and devices */
    projects: [
        /* Desktop Browsers */
        {
            name: 'chromium-desktop',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1280, height: 720 }
            },
            testMatch: '**/visual-regression.spec.ts'
        },
        {
            name: 'firefox-desktop',
            use: {
                ...devices['Desktop Firefox'],
                viewport: { width: 1280, height: 720 }
            },
            testMatch: '**/visual-regression.spec.ts'
        },
        {
            name: 'webkit-desktop',
            use: {
                ...devices['Desktop Safari'],
                viewport: { width: 1280, height: 720 }
            },
            testMatch: '**/visual-regression.spec.ts'
        },

        /* Cross-Browser Testing */
        {
            name: 'chromium-cross-browser',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1280, height: 720 }
            },
            testMatch: '**/visual-regression-cross-browser.spec.ts'
        },
        {
            name: 'firefox-cross-browser',
            use: {
                ...devices['Desktop Firefox'],
                viewport: { width: 1280, height: 720 }
            },
            testMatch: '**/visual-regression-cross-browser.spec.ts'
        },
        {
            name: 'webkit-cross-browser',
            use: {
                ...devices['Desktop Safari'],
                viewport: { width: 1280, height: 720 }
            },
            testMatch: '**/visual-regression-cross-browser.spec.ts'
        },

        /* Mobile Devices */
        {
            name: 'mobile-chrome',
            use: { ...devices['Pixel 5'] },
            testMatch: '**/visual-regression-mobile.spec.ts'
        },
        {
            name: 'mobile-safari',
            use: { ...devices['iPhone 12'] },
            testMatch: '**/visual-regression-mobile.spec.ts'
        },
        {
            name: 'tablet-chrome',
            use: { ...devices['iPad Pro'] },
            testMatch: '**/visual-regression-mobile.spec.ts'
        },

        /* High DPI Testing */
        {
            name: 'high-dpi',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1280, height: 720 },
                deviceScaleFactor: 2
            },
            testMatch: '**/visual-regression.spec.ts'
        },

        /* Dark Mode Testing */
        {
            name: 'dark-mode-desktop',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1280, height: 720 },
                colorScheme: 'dark'
            },
            testMatch: '**/visual-regression.spec.ts'
        },
        {
            name: 'dark-mode-mobile',
            use: {
                ...devices['iPhone 12'],
                colorScheme: 'dark'
            },
            testMatch: '**/visual-regression-mobile.spec.ts'
        }
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        stdout: 'ignore',
        stderr: 'pipe'
    }
});