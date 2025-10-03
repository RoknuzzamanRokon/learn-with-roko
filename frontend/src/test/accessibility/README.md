# Accessibility Testing Utilities

This directory contains comprehensive accessibility testing utilities for the LMS UI Enhancement project. These tools provide automated testing for color contrast validation, color blindness simulation, and visual regression testing to ensure WCAG compliance and inclusive design.

## Overview

The accessibility testing suite includes:

1. **Color Contrast Validation** - Automated WCAG AA/AAA compliance testing
2. **Color Blindness Simulation** - Testing for protanopia, deuteranopia, tritanopia, and achromatopsia
3. **Visual Regression Testing** - Ensuring color consistency across components and states
4. **Comprehensive Reporting** - Detailed accessibility reports with actionable recommendations

## Files Structure

```
src/test/accessibility/
├── README.md                           # This documentation
├── accessibility-test-utils.ts         # Core testing utilities and helpers
├── color-contrast.test.ts             # WCAG contrast ratio validation tests
├── color-blindness.test.ts            # Color blindness simulation and testing
├── visual-regression.test.ts          # Visual consistency and regression tests
├── comprehensive-accessibility.test.ts # Full test suite integration
└── accessibility.test.tsx             # Existing component accessibility tests
```

## Usage

### Running Tests

```bash
# Run all accessibility tests
npm run test:run -- src/test/accessibility/

# Run specific test suites
npm run test:run -- src/test/accessibility/color-contrast.test.ts
npm run test:run -- src/test/accessibility/color-blindness.test.ts
npm run test:run -- src/test/accessibility/visual-regression.test.ts
npm run test:run -- src/test/accessibility/comprehensive-accessibility.test.ts

# Run with coverage
npm run test:coverage -- src/test/accessibility/
```

### Using Testing Utilities

```typescript
import {
  runAccessibilityTestSuite,
  testColorCombination,
  validateWCAGAA,
  simulateColorBlindness,
  createAccessibilityTestReport,
} from "./accessibility-test-utils";

// Run comprehensive accessibility test suite
const results = runAccessibilityTestSuite();
console.log(`Pass rate: ${results.summary.passRate}%`);

// Test specific color combination
const testCase = {
  name: "Primary Button",
  foreground: "#ffffff",
  background: "#2563eb",
  context: "ui" as const,
  critical: true,
};
const result = testColorCombination(testCase);

// Generate HTML report
const htmlReport = createAccessibilityTestReport(results);
```

## Test Categories

### 1. Color Contrast Validation (`color-contrast.test.ts`)

Tests WCAG AA and AAA compliance for all color combinations in the design system.

**Features:**

- Validates contrast ratios for buttons, text, status indicators
- Tests both normal and large text requirements
- Provides specific recommendations for failing combinations
- Performance testing for contrast calculations

**Key Tests:**

- Primary, secondary, success, warning, error button contrast
- Body text, heading text, secondary text contrast
- Status indicator contrast (success, warning, error)
- Edge cases and error handling

### 2. Color Blindness Testing (`color-blindness.test.ts`)

Simulates different types of color blindness and validates accessibility.

**Features:**

- Simulates protanopia (red-blind), deuteranopia (green-blind), tritanopia (blue-blind), achromatopsia (complete color blindness)
- Tests all design system colors for color blind accessibility
- Identifies elements that need additional visual indicators
- Generates comprehensive color blindness reports

**Key Tests:**

- Color blindness simulation accuracy
- Design system color combinations for each type of color blindness
- Status indicator differentiation for color blind users
- Interactive element accessibility

### 3. Visual Regression Testing (`visual-regression.test.ts`)

Ensures color consistency across components, states, and themes.

**Features:**

- Component color consistency validation
- State-based color testing (hover, active, focus, disabled)
- Cross-browser color consistency
- Responsive design color validation
- Dark mode preparation testing

**Key Tests:**

- Button, card, form, navigation component consistency
- Color animation and transition consistency
- CSS custom property fallback testing
- High contrast mode support

### 4. Comprehensive Testing (`comprehensive-accessibility.test.ts`)

Integrates all testing utilities into a complete accessibility validation suite.

**Features:**

- Full design system accessibility validation
- Performance and reliability testing
- Integration with existing design system
- Future enhancement readiness testing

## Test Results and Reporting

### Current Test Results

Based on the latest test run:

- **Total Tests**: 16
- **Pass Rate**: 81.3%
- **Critical Issues**: 2 (Success and Warning button contrast)
- **Warnings**: 1 (Color blindness considerations)

### Identified Issues

1. **Success Button**: Contrast ratio 3.77 (required: 4.5)
2. **Warning Button**: Contrast ratio 3.19 (required: 4.5)
3. **Navigation Active**: Contrast ratio 4.24 (required: 4.5)
4. **Color Blindness**: Some status indicators need additional visual cues

### Recommendations

1. **Immediate Actions**:

   - Darken success button color or use white text with darker background
   - Adjust warning button colors to meet WCAG AA standards
   - Improve navigation active state contrast

2. **Enhancement Actions**:
   - Add icons to status indicators (✓, ⚠, ✕, ℹ)
   - Implement patterns or textures for color blind users
   - Consider WCAG AAA compliance for critical elements

## Configuration

### Test Configuration Options

```typescript
interface AccessibilityTestConfig {
  wcagLevel: "AA" | "AAA"; // WCAG compliance level
  includeColorBlindness: boolean; // Test color blindness accessibility
  includeVisualRegression: boolean; // Test visual consistency
  testLargeText: boolean; // Test large text requirements
  generateReport: boolean; // Generate detailed reports
}
```

### Critical Color Combinations

The test suite validates these critical color combinations:

- Primary, secondary, success, warning, error buttons
- Body text, heading text, secondary text
- Status indicators (success, warning, error, info)
- Navigation elements and links
- Form inputs and validation states

## Integration with CI/CD

Add accessibility testing to your CI/CD pipeline:

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests
on: [push, pull_request]
jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:run -- src/test/accessibility/
      - name: Upload accessibility report
        if: failure()
        uses: actions/upload-artifact@v2
        with:
          name: accessibility-report
          path: accessibility-report.html
```

## Best Practices

### Writing Accessibility Tests

1. **Test Real Color Combinations**: Use actual colors from your design system
2. **Include Context**: Test colors in their actual usage context (buttons, text, etc.)
3. **Test Edge Cases**: Include transparent colors, gradients, and complex backgrounds
4. **Validate Recommendations**: Ensure failing tests provide actionable feedback

### Maintaining Tests

1. **Update with Design Changes**: Keep tests synchronized with design system updates
2. **Regular Validation**: Run tests frequently during development
3. **Monitor Performance**: Ensure tests complete quickly for CI/CD integration
4. **Document Issues**: Track accessibility issues and their resolutions

## Troubleshooting

### Common Issues

1. **Import Path Errors**: Ensure correct relative paths to styles directory
2. **CSS Custom Property Support**: Tests require modern browser environment
3. **Performance Issues**: Large test suites may need optimization for CI/CD

### Debugging Tips

1. **Use Console Logging**: Tests include detailed console output for debugging
2. **Check Individual Tests**: Run specific test files to isolate issues
3. **Validate Color Values**: Ensure color values are in correct format (hex, rgb)
4. **Review Recommendations**: Test failures include specific improvement suggestions

## Future Enhancements

### Planned Features

1. **Screenshot Comparison**: Visual regression testing with actual screenshots
2. **Automated Fixes**: Suggest specific color adjustments for failing tests
3. **Real-time Validation**: Browser extension for live accessibility checking
4. **Advanced Simulations**: More sophisticated color blindness simulations

### Contributing

When adding new accessibility tests:

1. Follow existing test patterns and naming conventions
2. Include comprehensive test coverage for new features
3. Add documentation for new testing utilities
4. Ensure tests are performant and reliable
5. Include both positive and negative test cases

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)
- [Color Blindness Simulator](https://www.color-blindness.com/coblis-color-blindness-simulator/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Support

For questions or issues with the accessibility testing utilities:

1. Check this documentation first
2. Review test output and error messages
3. Consult WCAG guidelines for accessibility requirements
4. Create an issue with detailed reproduction steps

---

_This accessibility testing suite ensures the LMS UI Enhancement project meets modern accessibility standards and provides an inclusive experience for all users._
