# LMS UI Enhancement Design System

This directory contains the design system foundation for the Learning Management System UI enhancement project.

## Files Overview

- `design-system.css` - Core component styles and utilities
- `types.ts` - TypeScript type definitions for the color system
- `utils.ts` - Utility functions for color management and accessibility
- `index.ts` - Main export file for the design system

## CSS Custom Properties

The design system uses CSS custom properties (CSS variables) for consistent color management:

### Primary Colors

```css
--primary-50 to --primary-900
```

### Neutral Colors

```css
--white
--gray-50 to --gray-900
```

### Status Colors

```css
--success-50 to --success-900
--warning-50 to --warning-900
--error-50 to --error-900
```

### Accent Colors

```css
--accent-purple-50 to --accent-purple-900
--accent-teal-50 to --accent-teal-900
```

## Component Classes

### Buttons

- `.btn-base` - Base button styles
- `.btn-primary` - Primary button variant
- `.btn-secondary` - Secondary button variant
- `.btn-success` - Success button variant
- `.btn-warning` - Warning button variant
- `.btn-error` - Error button variant
- `.btn-outline-primary` - Outlined primary button
- `.btn-outline-secondary` - Outlined secondary button

### Cards

- `.card-base` - Base card styles
- `.card-primary` - Primary card with left border
- `.card-success` - Success card with left border
- `.card-warning` - Warning card with left border
- `.card-error` - Error card with left border

### Navigation

- `.nav-link` - Navigation link styles
- `.nav-link-active` - Active navigation link styles

### Form Inputs

- `.input-base` - Base input styles
- `.input-error` - Error state input
- `.input-success` - Success state input

### Progress Indicators

- `.progress-bar` - Progress bar container
- `.progress-fill` - Progress bar fill (primary color)
- `.progress-fill-success` - Progress bar fill (success color)

### Badges

- `.badge-base` - Base badge styles
- `.badge-primary` - Primary badge
- `.badge-success` - Success badge
- `.badge-warning` - Warning badge
- `.badge-error` - Error badge

### Alerts

- `.alert-base` - Base alert styles
- `.alert-info` - Info alert (primary color)
- `.alert-success` - Success alert
- `.alert-warning` - Warning alert
- `.alert-error` - Error alert

## Utility Classes

### Text Colors

- `.text-primary` - Primary text color
- `.text-success` - Success text color
- `.text-warning` - Warning text color
- `.text-error` - Error text color

### Background Colors

- `.bg-primary` - Primary background color
- `.bg-success` - Success background color
- `.bg-warning` - Warning background color
- `.bg-error` - Error background color

### Border Colors

- `.border-primary` - Primary border color
- `.border-success` - Success border color
- `.border-warning` - Warning border color
- `.border-error` - Error border color

### Transitions

- `.color-transition` - Smooth color transitions

## Usage Examples

### Button Example

```html
<button class="btn-base btn-primary">Primary Button</button>
<button class="btn-base btn-secondary">Secondary Button</button>
<button class="btn-base btn-outline-primary">Outlined Button</button>
```

### Card Example

```html
<div class="card-base">
  <div class="p-4">
    <h3>Basic Card</h3>
    <p>Card content goes here</p>
  </div>
</div>

<div class="card-primary">
  <div class="p-4">
    <h3>Primary Card</h3>
    <p>Card with primary left border</p>
  </div>
</div>
```

### Navigation Example

```html
<nav>
  <a href="#" class="nav-link">Home</a>
  <a href="#" class="nav-link nav-link-active">Dashboard</a>
  <a href="#" class="nav-link">Courses</a>
</nav>
```

### Form Example

```html
<input type="text" class="input-base" placeholder="Enter text" />
<input type="email" class="input-error" placeholder="Email with error" />
<input type="text" class="input-success" placeholder="Valid input" />
```

### Progress Example

```html
<div class="progress-bar">
  <div class="progress-fill" style="width: 75%"></div>
</div>

<div class="progress-bar">
  <div class="progress-fill-success" style="width: 100%"></div>
</div>
```

### Badge Example

```html
<span class="badge-base badge-primary">Primary</span>
<span class="badge-base badge-success">Success</span>
<span class="badge-base badge-warning">Warning</span>
<span class="badge-base badge-error">Error</span>
```

### Alert Example

```html
<div class="alert-base alert-info">
  <p>This is an informational alert.</p>
</div>

<div class="alert-base alert-success">
  <p>This is a success alert.</p>
</div>

<div class="alert-base alert-warning">
  <p>This is a warning alert.</p>
</div>

<div class="alert-base alert-error">
  <p>This is an error alert.</p>
</div>
```

## Browser Compatibility

The design system includes fallback colors for browsers that don't support CSS custom properties. All color values have hardcoded fallbacks to ensure compatibility with older browsers.

## Accessibility Features

- WCAG AA compliant contrast ratios
- High contrast mode support via `@media (prefers-contrast: high)`
- Reduced motion support via `@media (prefers-reduced-motion: reduce)`
- Color-blind friendly design patterns
- Focus indicators for interactive elements

## TypeScript Integration

Import design system utilities in your TypeScript files:

```typescript
import {
  CSS_VARIABLES,
  getCSSVariable,
  setCSSVariable,
  meetsWCAGAA,
  DESIGN_SYSTEM_CLASSES,
} from "../styles";

// Get a color value
const primaryColor = getCSSVariable(CSS_VARIABLES.PRIMARY_600);

// Set a custom color
setCSSVariable(CSS_VARIABLES.PRIMARY_600, "#1d4ed8");

// Check accessibility compliance
const isAccessible = meetsWCAGAA("#ffffff", "#2563eb");

// Use predefined class names
const buttonClass = DESIGN_SYSTEM_CLASSES.BTN_PRIMARY;
```

## Customization

The design system supports runtime theme customization through CSS custom properties. You can update colors dynamically using the utility functions provided in `utils.ts`.

## Testing

Run the design system tests:

```bash
npm run test:run -- design-system.test.ts
```

The tests cover:

- CSS custom property support detection
- Color utility functions
- Accessibility compliance validation
- Feature detection capabilities
