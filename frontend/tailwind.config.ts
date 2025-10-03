import type { Config } from 'tailwindcss'
import { createNextJSPurgingConfig } from './src/styles/css-purging'

const config: Config = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './src/**/*.{js,ts,jsx,tsx,mdx}',
    ],

    // CSS purging configuration for production optimization
    // Note: Tailwind CSS v4 handles purging automatically based on content paths
    theme: {
        extend: {
            colors: {
                // Primary Brand Colors
                primary: {
                    50: 'var(--primary-50)',
                    100: 'var(--primary-100)',
                    200: 'var(--primary-200)',
                    300: 'var(--primary-300)',
                    400: 'var(--primary-400)',
                    500: 'var(--primary-500)',
                    600: 'var(--primary-600)',
                    700: 'var(--primary-700)',
                    800: 'var(--primary-800)',
                    900: 'var(--primary-900)',
                },
                // Neutral Colors
                gray: {
                    50: 'var(--gray-50)',
                    100: 'var(--gray-100)',
                    200: 'var(--gray-200)',
                    300: 'var(--gray-300)',
                    400: 'var(--gray-400)',
                    500: 'var(--gray-500)',
                    600: 'var(--gray-600)',
                    700: 'var(--gray-700)',
                    800: 'var(--gray-800)',
                    900: 'var(--gray-900)',
                },
                // Status Colors
                success: {
                    50: 'var(--success-50)',
                    100: 'var(--success-100)',
                    200: 'var(--success-200)',
                    300: 'var(--success-300)',
                    400: 'var(--success-400)',
                    500: 'var(--success-500)',
                    600: 'var(--success-600)',
                    700: 'var(--success-700)',
                    800: 'var(--success-800)',
                    900: 'var(--success-900)',
                },
                warning: {
                    50: 'var(--warning-50)',
                    100: 'var(--warning-100)',
                    200: 'var(--warning-200)',
                    300: 'var(--warning-300)',
                    400: 'var(--warning-400)',
                    500: 'var(--warning-500)',
                    600: 'var(--warning-600)',
                    700: 'var(--warning-700)',
                    800: 'var(--warning-800)',
                    900: 'var(--warning-900)',
                },
                error: {
                    50: 'var(--error-50)',
                    100: 'var(--error-100)',
                    200: 'var(--error-200)',
                    300: 'var(--error-300)',
                    400: 'var(--error-400)',
                    500: 'var(--error-500)',
                    600: 'var(--error-600)',
                    700: 'var(--error-700)',
                    800: 'var(--error-800)',
                    900: 'var(--error-900)',
                },
                // Special Accents
                accent: {
                    purple: {
                        50: 'var(--accent-purple-50)',
                        100: 'var(--accent-purple-100)',
                        200: 'var(--accent-purple-200)',
                        300: 'var(--accent-purple-300)',
                        400: 'var(--accent-purple-400)',
                        500: 'var(--accent-purple-500)',
                        600: 'var(--accent-purple-600)',
                        700: 'var(--accent-purple-700)',
                        800: 'var(--accent-purple-800)',
                        900: 'var(--accent-purple-900)',
                    },
                    teal: {
                        50: 'var(--accent-teal-50)',
                        100: 'var(--accent-teal-100)',
                        200: 'var(--accent-teal-200)',
                        300: 'var(--accent-teal-300)',
                        400: 'var(--accent-teal-400)',
                        500: 'var(--accent-teal-500)',
                        600: 'var(--accent-teal-600)',
                        700: 'var(--accent-teal-700)',
                        800: 'var(--accent-teal-800)',
                        900: 'var(--accent-teal-900)',
                    },
                },
                // Semantic color aliases
                white: 'var(--white)',
            },
        },
    },
    plugins: [],
}

export default config