# LMS Design System Style Guide

## Overview

The LMS Design System Style Guide is an interactive documentation and component library that provides comprehensive guidance for implementing the Learning Management System's color palette and design components.

## Features

### 🎨 Color Palette

- Complete color system with CSS custom properties
- Interactive color swatches with copy-to-clipboard functionality
- Usage guidelines for each color
- Color hierarchy and semantic naming

### 🧩 Component Showcase

- Interactive examples of all UI components
- Multiple states and variants (hover, active, disabled)
- Real-time component customization
- Form elements, buttons, cards, navigation, and alerts

### 📋 Usage Guidelines

- Best practices for color implementation
- Technical guidelines for developers
- Component patterns and conventions
- Common mistakes to avoid

### ♿ Accessibility Compliance

- WCAG 2.1 AA compliance testing
- Contrast ratio validation
- Color-blind friendly design patterns
- Screen reader compatibility
- Keyboard navigation testing

### 📚 Documentation Generator

- Automated markdown documentation generation
- JSON export for design tools
- Accessibility compliance reports
- Developer API reference

## Getting Started

### Accessing the Style Guide

Navigate to `/style-guide` in your browser to access the interactive style guide.

### Using Colors in Your Code

#### CSS Custom Properties

```css
.button-primary {
  background-color: var(--primary-600);
  color: var(--white);
  border: 1px solid var(--primary-600);
}

.button-primary:hover {
  background-color: var(--primary-700);
  border-color: var(--primary-700);
}
```

#### Tailwind CSS Classes

```html
<button
  class="bg-primary-600 text-white hover:bg-primary-700 border border-primary-600"
>
  Primary Button
</button>

<div class="text-gray-600 bg-gray-50 border border-gray-200">Card Content</div>
```

### Generating Documentation

Use the built-in CLI tools to generate documentation:

```bash
# Generate all documentation formats
npm run docs:colors

# Generate specific formats
npm run docs:colors:markdown
npm run docs:colors:json
npm run docs:colors:css

# Custom output directory
node scripts/generate-color-docs.js --output=./build/docs
```

## Color System

### Primary Colors

- **Primary 600** (`#2563eb`) - Main brand color, primary actions
- **Primary 700** (`#1d4ed8`) - Hover states, pressed buttons
- **Primary 50** (`#eff6ff`) - Light backgrounds, subtle highlights

### Neutral Colors

- **Gray 900** (`#111827`) - Highest contrast text, titles
- **Gray 600** (`#4b5563`) - Body text, primary content
- **Gray 200** (`#e5e7eb`) - Borders, dividers, disabled elements

### Status Colors

- **Success 600** (`#059669`) - Success buttons, completed states
- **Warning 600** (`#d97706`) - Warning buttons, caution actions
- **Error 600** (`#dc2626`) - Error buttons, destructive actions

### Accent Colors

- **Purple 500** (`#8b5cf6`) - Special features, premium content
- **Teal 500** (`#14b8a6`) - Highlights, featured content

## Accessibility Standards

### WCAG Compliance

- **AA Standard**: 4.5:1 contrast ratio for normal text
- **AA Large**: 3:1 contrast ratio for large text (18pt+ or 14pt+ bold)
- **AAA Standard**: 7:1 contrast ratio for enhanced accessibility

### Color Independence

- Never rely solely on color to convey information
- Always provide text labels or icons alongside color coding
- Use patterns or shapes for additional differentiation

### Focus Indicators

- All interactive elements have visible focus indicators
- Focus rings meet contrast requirements
- Keyboard navigation is fully supported

## Component Patterns

### Button States

```css
/* Default */
.btn-primary {
  background: var(--primary-600);
}

/* Hover */
.btn-primary:hover {
  background: var(--primary-700);
}

/* Disabled */
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Form Validation

```css
/* Default */
.input-base {
  border-color: var(--gray-300);
}

/* Success */
.input-success {
  border-color: var(--success-500);
}

/* Error */
.input-error {
  border-color: var(--error-500);
}
```

### Status Messages

```css
/* Success Alert */
.alert-success {
  background: var(--success-50);
  border: 1px solid var(--success-200);
  color: var(--success-800);
}

/* Error Alert */
.alert-error {
  background: var(--error-50);
  border: 1px solid var(--error-200);
  color: var(--error-800);
}
```

## Development Guidelines

### Adding New Colors

1. Add color to `COLOR_PALETTE` in `utils/colorAnalyzer.ts`
2. Include RGB and HSL values for accessibility calculations
3. Provide clear usage descriptions
4. Test contrast ratios with existing colors
5. Update Tailwind configuration

### Extending Components

1. Follow existing naming conventions
2. Use semantic color tokens, not hardcoded values
3. Test all interactive states
4. Validate accessibility compliance
5. Document usage patterns

### Testing Colors

```typescript
import { calculateContrastRatio, COLOR_PALETTE } from "./utils/colorAnalyzer";

const foreground = COLOR_PALETTE.neutral[10]; // gray-900
const background = COLOR_PALETTE.neutral[0]; // white
const result = calculateContrastRatio(foreground, background);

if (result.passes) {
  console.log(
    `Contrast ratio ${result.ratio}:1 meets ${result.level} standards`
  );
}
```

## API Reference

### Color Analyzer Functions

#### `calculateContrastRatio(color1, color2)`

Calculates WCAG contrast ratio between two colors.

- **Returns**: `{ ratio: number, level: string, passes: boolean }`

#### `generateAccessibilityReport()`

Generates comprehensive accessibility report.

- **Returns**: `AccessibilityReport[]`

#### `generateColorDocumentation()`

Creates markdown documentation for the color palette.

- **Returns**: `string` (Markdown formatted)

#### `validateColorAccessibility()`

Validates accessibility across the entire palette.

- **Returns**: `{ totalTests: number, passed: number, failed: number, warnings: string[] }`

## File Structure

```
app/style-guide/
├── components/
│   ├── ColorPalette.tsx          # Interactive color palette
│   ├── ComponentShowcase.tsx     # Component examples
│   ├── UsageGuidelines.tsx       # Implementation guidelines
│   ├── AccessibilityDemo.tsx     # Accessibility testing
│   └── DocumentationGenerator.tsx # Auto-documentation
├── utils/
│   └── colorAnalyzer.ts          # Color analysis utilities
├── page.tsx                      # Main style guide page
└── README.md                     # This documentation
```

## Contributing

When contributing to the design system:

1. **Follow Accessibility Standards**: All changes must meet WCAG AA standards
2. **Test Thoroughly**: Validate colors across different devices and conditions
3. **Document Changes**: Update documentation and examples
4. **Maintain Consistency**: Follow established patterns and conventions
5. **Consider Impact**: Evaluate how changes affect existing implementations

## Support

For questions or issues with the design system:

1. Check the interactive style guide at `/style-guide`
2. Review the usage guidelines and accessibility documentation
3. Use the documentation generator for up-to-date reference materials
4. Test color combinations with the built-in accessibility tools

## Version History

- **v1.0.0** - Initial release with complete color system and interactive documentation
- Comprehensive accessibility compliance
- Automated documentation generation
- Developer tools and utilities
