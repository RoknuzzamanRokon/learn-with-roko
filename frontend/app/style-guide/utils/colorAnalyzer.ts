/**
 * Color Analysis Utilities for LMS Design System
 * Automatically extracts and analyzes color palette information
 */

export interface ColorInfo {
    name: string;
    variable: string;
    hex: string;
    rgb: { r: number; g: number; b: number };
    hsl: { h: number; s: number; l: number };
    usage: string;
    category: string;
}

export interface ContrastResult {
    ratio: number;
    level: 'AAA' | 'AA' | 'AA Large' | 'Fail';
    passes: boolean;
}

export interface AccessibilityReport {
    colorPair: string;
    foreground: string;
    background: string;
    contrast: ContrastResult;
    recommendations: string[];
}

/**
 * Color palette definition extracted from CSS custom properties
 */
export const COLOR_PALETTE: Record<string, ColorInfo[]> = {
    primary: [
        { name: 'Primary 50', variable: '--primary-50', hex: '#eff6ff', rgb: { r: 239, g: 246, b: 255 }, hsl: { h: 214, s: 100, l: 97 }, usage: 'Light backgrounds, subtle highlights', category: 'primary' },
        { name: 'Primary 100', variable: '--primary-100', hex: '#dbeafe', rgb: { r: 219, g: 234, b: 254 }, hsl: { h: 214, s: 94, l: 93 }, usage: 'Hover states for light elements', category: 'primary' },
        { name: 'Primary 200', variable: '--primary-200', hex: '#bfdbfe', rgb: { r: 191, g: 219, b: 254 }, hsl: { h: 213, s: 97, l: 87 }, usage: 'Disabled states, light borders', category: 'primary' },
        { name: 'Primary 300', variable: '--primary-300', hex: '#93c5fd', rgb: { r: 147, g: 197, b: 253 }, hsl: { h: 212, s: 96, l: 78 }, usage: 'Secondary elements, light accents', category: 'primary' },
        { name: 'Primary 400', variable: '--primary-400', hex: '#60a5fa', rgb: { r: 96, g: 165, b: 250 }, hsl: { h: 213, s: 93, l: 68 }, usage: 'Interactive elements, medium emphasis', category: 'primary' },
        { name: 'Primary 500', variable: '--primary-500', hex: '#3b82f6', rgb: { r: 59, g: 130, b: 246 }, hsl: { h: 217, s: 91, l: 60 }, usage: 'Default primary color, buttons', category: 'primary' },
        { name: 'Primary 600', variable: '--primary-600', hex: '#2563eb', rgb: { r: 37, g: 99, b: 235 }, hsl: { h: 221, s: 83, l: 53 }, usage: 'Main brand color, primary actions', category: 'primary' },
        { name: 'Primary 700', variable: '--primary-700', hex: '#1d4ed8', rgb: { r: 29, g: 78, b: 216 }, hsl: { h: 224, s: 76, l: 48 }, usage: 'Hover states, pressed buttons', category: 'primary' },
        { name: 'Primary 800', variable: '--primary-800', hex: '#1e40af', rgb: { r: 30, g: 64, b: 175 }, hsl: { h: 226, s: 71, l: 40 }, usage: 'Active states, dark themes', category: 'primary' },
        { name: 'Primary 900', variable: '--primary-900', hex: '#1e3a8a', rgb: { r: 30, g: 58, b: 138 }, hsl: { h: 224, s: 64, l: 33 }, usage: 'High contrast, dark backgrounds', category: 'primary' },
    ],
    neutral: [
        { name: 'White', variable: '--white', hex: '#ffffff', rgb: { r: 255, g: 255, b: 255 }, hsl: { h: 0, s: 0, l: 100 }, usage: 'Card backgrounds, primary text on dark', category: 'neutral' },
        { name: 'Gray 50', variable: '--gray-50', hex: '#f9fafb', rgb: { r: 249, g: 250, b: 251 }, hsl: { h: 210, s: 20, l: 98 }, usage: 'Page backgrounds, subtle containers', category: 'neutral' },
        { name: 'Gray 100', variable: '--gray-100', hex: '#f3f4f6', rgb: { r: 243, g: 244, b: 246 }, hsl: { h: 220, s: 14, l: 96 }, usage: 'Card backgrounds, input backgrounds', category: 'neutral' },
        { name: 'Gray 200', variable: '--gray-200', hex: '#e5e7eb', rgb: { r: 229, g: 231, b: 235 }, hsl: { h: 220, s: 13, l: 91 }, usage: 'Borders, dividers, disabled elements', category: 'neutral' },
        { name: 'Gray 300', variable: '--gray-300', hex: '#d1d5db', rgb: { r: 209, g: 213, b: 219 }, hsl: { h: 216, s: 12, l: 84 }, usage: 'Input borders, subtle dividers', category: 'neutral' },
        { name: 'Gray 400', variable: '--gray-400', hex: '#9ca3af', rgb: { r: 156, g: 163, b: 175 }, hsl: { h: 218, s: 11, l: 65 }, usage: 'Placeholder text, secondary icons', category: 'neutral' },
        { name: 'Gray 500', variable: '--gray-500', hex: '#6b7280', rgb: { r: 107, g: 114, b: 128 }, hsl: { h: 220, s: 9, l: 46 }, usage: 'Secondary text, form labels', category: 'neutral' },
        { name: 'Gray 600', variable: '--gray-600', hex: '#4b5563', rgb: { r: 75, g: 85, b: 99 }, hsl: { h: 215, s: 14, l: 34 }, usage: 'Body text, primary content', category: 'neutral' },
        { name: 'Gray 700', variable: '--gray-700', hex: '#374151', rgb: { r: 55, g: 65, b: 81 }, hsl: { h: 217, s: 19, l: 27 }, usage: 'Headings, emphasized text', category: 'neutral' },
        { name: 'Gray 800', variable: '--gray-800', hex: '#1f2937', rgb: { r: 31, g: 41, b: 55 }, hsl: { h: 215, s: 28, l: 17 }, usage: 'Primary headings, high emphasis', category: 'neutral' },
        { name: 'Gray 900', variable: '--gray-900', hex: '#111827', rgb: { r: 17, g: 24, b: 39 }, hsl: { h: 221, s: 39, l: 11 }, usage: 'Highest contrast text, titles', category: 'neutral' },
    ],
    success: [
        { name: 'Success 50', variable: '--success-50', hex: '#ecfdf5', rgb: { r: 236, g: 253, b: 245 }, hsl: { h: 152, s: 81, l: 96 }, usage: 'Success message backgrounds', category: 'success' },
        { name: 'Success 100', variable: '--success-100', hex: '#d1fae5', rgb: { r: 209, g: 250, b: 229 }, hsl: { h: 149, s: 80, l: 90 }, usage: 'Light success indicators', category: 'success' },
        { name: 'Success 500', variable: '--success-500', hex: '#10b981', rgb: { r: 16, g: 185, b: 129 }, hsl: { h: 160, s: 84, l: 39 }, usage: 'Success icons, progress bars', category: 'success' },
        { name: 'Success 600', variable: '--success-600', hex: '#059669', rgb: { r: 5, g: 150, b: 105 }, hsl: { h: 161, s: 94, l: 30 }, usage: 'Success buttons, completed states', category: 'success' },
        { name: 'Success 700', variable: '--success-700', hex: '#047857', rgb: { r: 4, g: 120, b: 87 }, hsl: { h: 163, s: 94, l: 24 }, usage: 'Success button hover states', category: 'success' },
        { name: 'Success 900', variable: '--success-900', hex: '#064e3b', rgb: { r: 6, g: 78, b: 59 }, hsl: { h: 164, s: 86, l: 16 }, usage: 'Success text on light backgrounds', category: 'success' },
    ],
    warning: [
        { name: 'Warning 50', variable: '--warning-50', hex: '#fffbeb', rgb: { r: 255, g: 251, b: 235 }, hsl: { h: 48, s: 100, l: 96 }, usage: 'Warning message backgrounds', category: 'warning' },
        { name: 'Warning 100', variable: '--warning-100', hex: '#fef3c7', rgb: { r: 254, g: 243, b: 199 }, hsl: { h: 48, s: 96, l: 89 }, usage: 'Light warning indicators', category: 'warning' },
        { name: 'Warning 500', variable: '--warning-500', hex: '#f59e0b', rgb: { r: 245, g: 158, b: 11 }, hsl: { h: 38, s: 92, l: 50 }, usage: 'Warning icons, pending states', category: 'warning' },
        { name: 'Warning 600', variable: '--warning-600', hex: '#d97706', rgb: { r: 217, g: 119, b: 6 }, hsl: { h: 32, s: 95, l: 44 }, usage: 'Warning buttons, caution actions', category: 'warning' },
        { name: 'Warning 700', variable: '--warning-700', hex: '#b45309', rgb: { r: 180, g: 83, b: 9 }, hsl: { h: 26, s: 90, l: 37 }, usage: 'Warning button hover states', category: 'warning' },
        { name: 'Warning 900', variable: '--warning-900', hex: '#78350f', rgb: { r: 120, g: 53, b: 15 }, hsl: { h: 22, s: 78, l: 26 }, usage: 'Warning text on light backgrounds', category: 'warning' },
    ],
    error: [
        { name: 'Error 50', variable: '--error-50', hex: '#fef2f2', rgb: { r: 254, g: 242, b: 242 }, hsl: { h: 0, s: 86, l: 97 }, usage: 'Error message backgrounds', category: 'error' },
        { name: 'Error 100', variable: '--error-100', hex: '#fee2e2', rgb: { r: 254, g: 226, b: 226 }, hsl: { h: 0, s: 93, l: 94 }, usage: 'Light error indicators', category: 'error' },
        { name: 'Error 500', variable: '--error-500', hex: '#ef4444', rgb: { r: 239, g: 68, b: 68 }, hsl: { h: 0, s: 84, l: 60 }, usage: 'Error icons, validation errors', category: 'error' },
        { name: 'Error 600', variable: '--error-600', hex: '#dc2626', rgb: { r: 220, g: 38, b: 38 }, hsl: { h: 0, s: 73, l: 51 }, usage: 'Error buttons, destructive actions', category: 'error' },
        { name: 'Error 700', variable: '--error-700', hex: '#b91c1c', rgb: { r: 185, g: 28, b: 28 }, hsl: { h: 0, s: 74, l: 42 }, usage: 'Error button hover states', category: 'error' },
        { name: 'Error 900', variable: '--error-900', hex: '#7f1d1d', rgb: { r: 127, g: 29, b: 29 }, hsl: { h: 0, s: 63, l: 31 }, usage: 'Error text on light backgrounds', category: 'error' },
    ],
    accent: [
        { name: 'Purple 500', variable: '--accent-purple-500', hex: '#8b5cf6', rgb: { r: 139, g: 92, b: 246 }, hsl: { h: 258, s: 90, l: 66 }, usage: 'Special features, premium content', category: 'accent' },
        { name: 'Purple 600', variable: '--accent-purple-600', hex: '#7c3aed', rgb: { r: 124, g: 58, b: 237 }, hsl: { h: 262, s: 83, l: 58 }, usage: 'Purple accents, special actions', category: 'accent' },
        { name: 'Teal 500', variable: '--accent-teal-500', hex: '#14b8a6', rgb: { r: 20, g: 184, b: 166 }, hsl: { h: 173, s: 80, l: 40 }, usage: 'Highlights, featured content', category: 'accent' },
        { name: 'Teal 600', variable: '--accent-teal-600', hex: '#0d9488', rgb: { r: 13, g: 148, b: 136 }, hsl: { h: 175, s: 84, l: 32 }, usage: 'Teal accents, secondary features', category: 'accent' },
    ],
};

/**
 * Calculate relative luminance of a color
 */
function getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 */
export function calculateContrastRatio(color1: ColorInfo, color2: ColorInfo): ContrastResult {
    const lum1 = getLuminance(color1.rgb.r, color1.rgb.g, color1.rgb.b);
    const lum2 = getLuminance(color2.rgb.r, color2.rgb.g, color2.rgb.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    const ratio = (brightest + 0.05) / (darkest + 0.05);

    let level: ContrastResult['level'];
    let passes = false;

    if (ratio >= 7) {
        level = 'AAA';
        passes = true;
    } else if (ratio >= 4.5) {
        level = 'AA';
        passes = true;
    } else if (ratio >= 3) {
        level = 'AA Large';
        passes = true;
    } else {
        level = 'Fail';
        passes = false;
    }

    return { ratio: Math.round(ratio * 100) / 100, level, passes };
}

/**
 * Generate accessibility compliance report
 */
export function generateAccessibilityReport(): AccessibilityReport[] {
    const reports: AccessibilityReport[] = [];

    // Common color combinations to test
    const testCombinations = [
        // Text on white backgrounds
        { fg: COLOR_PALETTE.primary[6], bg: COLOR_PALETTE.neutral[0] }, // primary-600 on white
        { fg: COLOR_PALETTE.neutral[10], bg: COLOR_PALETTE.neutral[0] }, // gray-900 on white
        { fg: COLOR_PALETTE.neutral[5], bg: COLOR_PALETTE.neutral[0] }, // gray-600 on white
        { fg: COLOR_PALETTE.neutral[3], bg: COLOR_PALETTE.neutral[0] }, // gray-400 on white

        // White text on colored backgrounds
        { fg: COLOR_PALETTE.neutral[0], bg: COLOR_PALETTE.primary[6] }, // white on primary-600
        { fg: COLOR_PALETTE.neutral[0], bg: COLOR_PALETTE.success[3] }, // white on success-600
        { fg: COLOR_PALETTE.neutral[0], bg: COLOR_PALETTE.warning[3] }, // white on warning-600
        { fg: COLOR_PALETTE.neutral[0], bg: COLOR_PALETTE.error[3] }, // white on error-600

        // Text on light colored backgrounds
        { fg: COLOR_PALETTE.primary[6], bg: COLOR_PALETTE.primary[0] }, // primary-600 on primary-50
        { fg: COLOR_PALETTE.success[5], bg: COLOR_PALETTE.success[0] }, // success-900 on success-50
        { fg: COLOR_PALETTE.warning[5], bg: COLOR_PALETTE.warning[0] }, // warning-900 on warning-50
        { fg: COLOR_PALETTE.error[5], bg: COLOR_PALETTE.error[0] }, // error-900 on error-50
    ];

    testCombinations.forEach(({ fg, bg }) => {
        const contrast = calculateContrastRatio(fg, bg);
        const recommendations: string[] = [];

        if (!contrast.passes) {
            recommendations.push('This color combination does not meet WCAG accessibility standards');
            if (contrast.ratio < 3) {
                recommendations.push('Consider using a darker foreground or lighter background color');
            } else if (contrast.ratio < 4.5) {
                recommendations.push('This combination is only suitable for large text (18pt+ or 14pt+ bold)');
            }
        }

        if (contrast.level === 'AA' && contrast.ratio < 7) {
            recommendations.push('Consider improving contrast for AAA compliance');
        }

        reports.push({
            colorPair: `${fg.name} on ${bg.name}`,
            foreground: fg.hex,
            background: bg.hex,
            contrast,
            recommendations,
        });
    });

    return reports;
}

/**
 * Generate color palette documentation in markdown format
 */
export function generateColorDocumentation(): string {
    const timestamp = new Date().toISOString().split('T')[0];

    let markdown = `# LMS Color Palette Documentation

*Generated on ${timestamp}*

## Overview

This document provides comprehensive documentation for the LMS Design System color palette, including usage guidelines, accessibility compliance, and implementation details.

## Color Categories

`;

    // Generate documentation for each color category
    Object.entries(COLOR_PALETTE).forEach(([category, colors]) => {
        markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1)} Colors\n\n`;

        markdown += `| Color | Variable | Hex | RGB | HSL | Usage |\n`;
        markdown += `|-------|----------|-----|-----|-----|-------|\n`;

        colors.forEach(color => {
            const { r, g, b } = color.rgb;
            const { h, s, l } = color.hsl;
            markdown += `| ${color.name} | \`var(${color.variable})\` | ${color.hex} | rgb(${r}, ${g}, ${b}) | hsl(${h}°, ${s}%, ${l}%) | ${color.usage} |\n`;
        });

        markdown += '\n';
    });

    // Add accessibility section
    markdown += `## Accessibility Compliance\n\n`;

    const accessibilityReport = generateAccessibilityReport();

    markdown += `### Contrast Ratio Testing\n\n`;
    markdown += `| Color Combination | Contrast Ratio | WCAG Level | Status |\n`;
    markdown += `|-------------------|----------------|------------|--------|\n`;

    accessibilityReport.forEach(report => {
        const status = report.contrast.passes ? '✅ Pass' : '❌ Fail';
        markdown += `| ${report.colorPair} | ${report.contrast.ratio}:1 | ${report.contrast.level} | ${status} |\n`;
    });

    markdown += `\n### Accessibility Guidelines\n\n`;
    markdown += `- **WCAG AA Standard**: Minimum contrast ratio of 4.5:1 for normal text\n`;
    markdown += `- **WCAG AA Large Text**: Minimum contrast ratio of 3:1 for large text (18pt+ or 14pt+ bold)\n`;
    markdown += `- **WCAG AAA Standard**: Enhanced contrast ratio of 7:1 for normal text\n`;
    markdown += `- **Color Independence**: Never rely solely on color to convey information\n`;
    markdown += `- **Focus Indicators**: Ensure focus states have sufficient contrast\n\n`;

    // Add implementation section
    markdown += `## Implementation\n\n`;
    markdown += `### CSS Custom Properties\n\n`;
    markdown += `All colors are defined as CSS custom properties in the root stylesheet:\n\n`;
    markdown += `\`\`\`css\n:root {\n`;

    Object.values(COLOR_PALETTE).flat().forEach(color => {
        markdown += `  ${color.variable}: ${color.hex};\n`;
    });

    markdown += `}\n\`\`\`\n\n`;

    markdown += `### Tailwind CSS Classes\n\n`;
    markdown += `Colors are available as Tailwind utility classes:\n\n`;
    markdown += `- Text colors: \`text-primary-600\`, \`text-gray-900\`, etc.\n`;
    markdown += `- Background colors: \`bg-primary-600\`, \`bg-gray-50\`, etc.\n`;
    markdown += `- Border colors: \`border-primary-600\`, \`border-gray-200\`, etc.\n\n`;

    return markdown;
}

/**
 * Generate JSON export of color palette
 */
export function generateColorJSON(): string {
    const colorData = {
        metadata: {
            version: '1.0.0',
            generatedAt: new Date().toISOString(),
            description: 'LMS Design System Color Palette',
        },
        colors: COLOR_PALETTE,
        accessibility: generateAccessibilityReport(),
    };

    return JSON.stringify(colorData, null, 2);
}

/**
 * Validate color accessibility across the entire palette
 */
export function validateColorAccessibility(): {
    totalTests: number;
    passed: number;
    failed: number;
    warnings: string[];
} {
    const report = generateAccessibilityReport();
    const passed = report.filter(r => r.contrast.passes).length;
    const failed = report.filter(r => !r.contrast.passes).length;

    const warnings: string[] = [];

    report.forEach(r => {
        if (!r.contrast.passes) {
            warnings.push(`${r.colorPair}: ${r.contrast.ratio}:1 (${r.contrast.level})`);
        }
    });

    return {
        totalTests: report.length,
        passed,
        failed,
        warnings,
    };
}