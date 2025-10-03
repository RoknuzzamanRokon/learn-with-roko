#!/usr/bin/env node

/**
 * CLI tool for generating LMS color palette documentation
 * Usage: node scripts/generate-color-docs.js [options]
 */

const fs = require("fs");
const path = require("path");

// Color palette data (extracted from CSS custom properties)
const COLOR_PALETTE = {
  primary: [
    {
      name: "Primary 50",
      variable: "--primary-50",
      hex: "#eff6ff",
      usage: "Light backgrounds, subtle highlights",
    },
    {
      name: "Primary 100",
      variable: "--primary-100",
      hex: "#dbeafe",
      usage: "Hover states for light elements",
    },
    {
      name: "Primary 200",
      variable: "--primary-200",
      hex: "#bfdbfe",
      usage: "Disabled states, light borders",
    },
    {
      name: "Primary 300",
      variable: "--primary-300",
      hex: "#93c5fd",
      usage: "Secondary elements, light accents",
    },
    {
      name: "Primary 400",
      variable: "--primary-400",
      hex: "#60a5fa",
      usage: "Interactive elements, medium emphasis",
    },
    {
      name: "Primary 500",
      variable: "--primary-500",
      hex: "#3b82f6",
      usage: "Default primary color, buttons",
    },
    {
      name: "Primary 600",
      variable: "--primary-600",
      hex: "#2563eb",
      usage: "Main brand color, primary actions",
    },
    {
      name: "Primary 700",
      variable: "--primary-700",
      hex: "#1d4ed8",
      usage: "Hover states, pressed buttons",
    },
    {
      name: "Primary 800",
      variable: "--primary-800",
      hex: "#1e40af",
      usage: "Active states, dark themes",
    },
    {
      name: "Primary 900",
      variable: "--primary-900",
      hex: "#1e3a8a",
      usage: "High contrast, dark backgrounds",
    },
  ],
  neutral: [
    {
      name: "White",
      variable: "--white",
      hex: "#ffffff",
      usage: "Card backgrounds, primary text on dark",
    },
    {
      name: "Gray 50",
      variable: "--gray-50",
      hex: "#f9fafb",
      usage: "Page backgrounds, subtle containers",
    },
    {
      name: "Gray 100",
      variable: "--gray-100",
      hex: "#f3f4f6",
      usage: "Card backgrounds, input backgrounds",
    },
    {
      name: "Gray 200",
      variable: "--gray-200",
      hex: "#e5e7eb",
      usage: "Borders, dividers, disabled elements",
    },
    {
      name: "Gray 300",
      variable: "--gray-300",
      hex: "#d1d5db",
      usage: "Input borders, subtle dividers",
    },
    {
      name: "Gray 400",
      variable: "--gray-400",
      hex: "#9ca3af",
      usage: "Placeholder text, secondary icons",
    },
    {
      name: "Gray 500",
      variable: "--gray-500",
      hex: "#6b7280",
      usage: "Secondary text, form labels",
    },
    {
      name: "Gray 600",
      variable: "--gray-600",
      hex: "#4b5563",
      usage: "Body text, primary content",
    },
    {
      name: "Gray 700",
      variable: "--gray-700",
      hex: "#374151",
      usage: "Headings, emphasized text",
    },
    {
      name: "Gray 800",
      variable: "--gray-800",
      hex: "#1f2937",
      usage: "Primary headings, high emphasis",
    },
    {
      name: "Gray 900",
      variable: "--gray-900",
      hex: "#111827",
      usage: "Highest contrast text, titles",
    },
  ],
  success: [
    {
      name: "Success 50",
      variable: "--success-50",
      hex: "#ecfdf5",
      usage: "Success message backgrounds",
    },
    {
      name: "Success 100",
      variable: "--success-100",
      hex: "#d1fae5",
      usage: "Light success indicators",
    },
    {
      name: "Success 500",
      variable: "--success-500",
      hex: "#10b981",
      usage: "Success icons, progress bars",
    },
    {
      name: "Success 600",
      variable: "--success-600",
      hex: "#059669",
      usage: "Success buttons, completed states",
    },
    {
      name: "Success 700",
      variable: "--success-700",
      hex: "#047857",
      usage: "Success button hover states",
    },
    {
      name: "Success 900",
      variable: "--success-900",
      hex: "#064e3b",
      usage: "Success text on light backgrounds",
    },
  ],
  warning: [
    {
      name: "Warning 50",
      variable: "--warning-50",
      hex: "#fffbeb",
      usage: "Warning message backgrounds",
    },
    {
      name: "Warning 100",
      variable: "--warning-100",
      hex: "#fef3c7",
      usage: "Light warning indicators",
    },
    {
      name: "Warning 500",
      variable: "--warning-500",
      hex: "#f59e0b",
      usage: "Warning icons, pending states",
    },
    {
      name: "Warning 600",
      variable: "--warning-600",
      hex: "#d97706",
      usage: "Warning buttons, caution actions",
    },
    {
      name: "Warning 700",
      variable: "--warning-700",
      hex: "#b45309",
      usage: "Warning button hover states",
    },
    {
      name: "Warning 900",
      variable: "--warning-900",
      hex: "#78350f",
      usage: "Warning text on light backgrounds",
    },
  ],
  error: [
    {
      name: "Error 50",
      variable: "--error-50",
      hex: "#fef2f2",
      usage: "Error message backgrounds",
    },
    {
      name: "Error 100",
      variable: "--error-100",
      hex: "#fee2e2",
      usage: "Light error indicators",
    },
    {
      name: "Error 500",
      variable: "--error-500",
      hex: "#ef4444",
      usage: "Error icons, validation errors",
    },
    {
      name: "Error 600",
      variable: "--error-600",
      hex: "#dc2626",
      usage: "Error buttons, destructive actions",
    },
    {
      name: "Error 700",
      variable: "--error-700",
      hex: "#b91c1c",
      usage: "Error button hover states",
    },
    {
      name: "Error 900",
      variable: "--error-900",
      hex: "#7f1d1d",
      usage: "Error text on light backgrounds",
    },
  ],
  accent: [
    {
      name: "Purple 500",
      variable: "--accent-purple-500",
      hex: "#8b5cf6",
      usage: "Special features, premium content",
    },
    {
      name: "Purple 600",
      variable: "--accent-purple-600",
      hex: "#7c3aed",
      usage: "Purple accents, special actions",
    },
    {
      name: "Teal 500",
      variable: "--accent-teal-500",
      hex: "#14b8a6",
      usage: "Highlights, featured content",
    },
    {
      name: "Teal 600",
      variable: "--accent-teal-600",
      hex: "#0d9488",
      usage: "Teal accents, secondary features",
    },
  ],
};

// Utility functions
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function calculateContrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  if (!rgb1 || !rgb2) return 0;

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function getWCAGLevel(ratio) {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}

// Documentation generators
function generateMarkdownDocs() {
  const timestamp = new Date().toISOString().split("T")[0];

  let markdown = `# LMS Color Palette Documentation

*Generated on ${timestamp}*

## Overview

This document provides comprehensive documentation for the LMS Design System color palette, including usage guidelines, accessibility compliance, and implementation details.

## Color Categories

`;

  // Generate documentation for each color category
  Object.entries(COLOR_PALETTE).forEach(([category, colors]) => {
    markdown += `### ${
      category.charAt(0).toUpperCase() + category.slice(1)
    } Colors\n\n`;

    markdown += `| Color | Variable | Hex | Usage |\n`;
    markdown += `|-------|----------|-----|-------|\n`;

    colors.forEach((color) => {
      markdown += `| ${color.name} | \`var(${color.variable})\` | ${color.hex} | ${color.usage} |\n`;
    });

    markdown += "\n";
  });

  // Add accessibility section
  markdown += `## Accessibility Compliance\n\n`;

  // Test common combinations
  const testCombinations = [
    { name: "Primary on White", fg: "#2563eb", bg: "#ffffff" },
    { name: "Gray 900 on White", fg: "#111827", bg: "#ffffff" },
    { name: "Gray 600 on White", fg: "#4b5563", bg: "#ffffff" },
    { name: "White on Primary", fg: "#ffffff", bg: "#2563eb" },
    { name: "White on Success", fg: "#ffffff", bg: "#059669" },
    { name: "White on Warning", fg: "#ffffff", bg: "#d97706" },
    { name: "White on Error", fg: "#ffffff", bg: "#dc2626" },
  ];

  markdown += `### Contrast Ratio Testing\n\n`;
  markdown += `| Color Combination | Contrast Ratio | WCAG Level | Status |\n`;
  markdown += `|-------------------|----------------|------------|--------|\n`;

  testCombinations.forEach((combo) => {
    const ratio = calculateContrastRatio(combo.fg, combo.bg);
    const level = getWCAGLevel(ratio);
    const status = ratio >= 4.5 ? "✅ Pass" : "❌ Fail";
    markdown += `| ${combo.name} | ${ratio.toFixed(
      2
    )}:1 | ${level} | ${status} |\n`;
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

  Object.values(COLOR_PALETTE)
    .flat()
    .forEach((color) => {
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

function generateJSONExport() {
  const colorData = {
    metadata: {
      version: "1.0.0",
      generatedAt: new Date().toISOString(),
      description: "LMS Design System Color Palette",
    },
    colors: COLOR_PALETTE,
  };

  return JSON.stringify(colorData, null, 2);
}

function generateCSSVariables() {
  let css = `/* LMS Design System Color Palette */\n/* Generated on ${
    new Date().toISOString().split("T")[0]
  } */\n\n:root {\n`;

  Object.values(COLOR_PALETTE)
    .flat()
    .forEach((color) => {
      css += `  ${color.variable}: ${color.hex};\n`;
    });

  css += "}\n";
  return css;
}

// CLI functionality
function main() {
  const args = process.argv.slice(2);
  const outputDir =
    args.find((arg) => arg.startsWith("--output="))?.split("=")[1] || "./docs";
  const format =
    args.find((arg) => arg.startsWith("--format="))?.split("=")[1] || "all";

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log("🎨 Generating LMS Color Palette Documentation...\n");

  if (format === "all" || format === "markdown") {
    const markdown = generateMarkdownDocs();
    const markdownPath = path.join(outputDir, "color-palette.md");
    fs.writeFileSync(markdownPath, markdown);
    console.log(`✅ Markdown documentation generated: ${markdownPath}`);
  }

  if (format === "all" || format === "json") {
    const json = generateJSONExport();
    const jsonPath = path.join(outputDir, "color-palette.json");
    fs.writeFileSync(jsonPath, json);
    console.log(`✅ JSON export generated: ${jsonPath}`);
  }

  if (format === "all" || format === "css") {
    const css = generateCSSVariables();
    const cssPath = path.join(outputDir, "color-variables.css");
    fs.writeFileSync(cssPath, css);
    console.log(`✅ CSS variables generated: ${cssPath}`);
  }

  console.log("\n🎉 Documentation generation complete!");
  console.log(`\nGenerated files in: ${path.resolve(outputDir)}`);

  // Display summary
  const totalColors = Object.values(COLOR_PALETTE).flat().length;
  const categories = Object.keys(COLOR_PALETTE).length;

  console.log(`\n📊 Summary:`);
  console.log(`   • ${totalColors} colors across ${categories} categories`);
  console.log(`   • Accessibility compliance testing included`);
  console.log(`   • Ready for developer implementation`);
}

// Help text
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
LMS Color Palette Documentation Generator

Usage: node generate-color-docs.js [options]

Options:
  --output=<dir>     Output directory (default: ./docs)
  --format=<type>    Output format: all, markdown, json, css (default: all)
  --help, -h         Show this help message

Examples:
  node generate-color-docs.js
  node generate-color-docs.js --output=./build/docs --format=markdown
  node generate-color-docs.js --format=json
`);
  process.exit(0);
}

// Run the CLI
if (require.main === module) {
  main();
}

module.exports = {
  generateMarkdownDocs,
  generateJSONExport,
  generateCSSVariables,
  COLOR_PALETTE,
};
