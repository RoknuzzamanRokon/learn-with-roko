"use client";

import React from "react";

export function UsageGuidelines() {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Usage Guidelines
        </h2>
        <p className="text-gray-600 mb-8">
          Best practices and guidelines for implementing the LMS color system
          effectively and consistently.
        </p>
      </div>

      {/* Color Application Principles */}
      <section className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Color Application Principles
          </h3>
          <p className="text-gray-600">
            Core principles for using colors effectively in the LMS interface
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-6 h-6 bg-primary-600 rounded-full mr-3"></span>
              Hierarchy and Emphasis
            </h4>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                Use primary colors for the most important actions and elements
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                Apply neutral grays for supporting content and backgrounds
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                Reserve bright colors (success, warning, error) for status
                communication
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                Use accent colors sparingly for special features or highlights
              </li>
            </ul>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
              <span className="w-6 h-6 bg-success-600 rounded-full mr-3"></span>
              Consistency and Patterns
            </h4>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="text-success-600 mr-2">•</span>
                Always use CSS custom properties instead of hardcoded hex values
              </li>
              <li className="flex items-start">
                <span className="text-success-600 mr-2">•</span>
                Maintain consistent color usage across similar components
              </li>
              <li className="flex items-start">
                <span className="text-success-600 mr-2">•</span>
                Follow established patterns for interactive states (hover,
                active, disabled)
              </li>
              <li className="flex items-start">
                <span className="text-success-600 mr-2">•</span>
                Use semantic color names that describe purpose, not appearance
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Implementation Guidelines */}
      <section className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Implementation Guidelines
          </h3>
          <p className="text-gray-600">
            Technical guidelines for developers implementing the color system
          </p>
        </div>

        <div className="space-y-8">
          {/* CSS Custom Properties */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-4">
              CSS Custom Properties
            </h4>
            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-gray-700 mb-2">
                  ✅ Do: Use CSS custom properties
                </h5>
                <div className="bg-gray-50 p-4 rounded-md">
                  <code className="text-sm text-gray-800">
                    {`/* Good */
.button-primary {
  background-color: var(--primary-600);
  color: var(--white);
  border: 1px solid var(--primary-600);
}

.button-primary:hover {
  background-color: var(--primary-700);
  border-color: var(--primary-700);
}`}
                  </code>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-700 mb-2">
                  ❌ Don't: Use hardcoded hex values
                </h5>
                <div className="bg-error-50 p-4 rounded-md border border-error-200">
                  <code className="text-sm text-error-800">
                    {`/* Bad */
.button-primary {
  background-color: #2563eb;
  color: #ffffff;
  border: 1px solid #2563eb;
}

.button-primary:hover {
  background-color: #1d4ed8;
  border-color: #1d4ed8;
}`}
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Tailwind CSS Classes */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-4">
              Tailwind CSS Classes
            </h4>
            <div className="space-y-4">
              <div>
                <h5 className="font-medium text-gray-700 mb-2">
                  ✅ Do: Use semantic Tailwind classes
                </h5>
                <div className="bg-gray-50 p-4 rounded-md">
                  <code className="text-sm text-gray-800">
                    {`<!-- Good -->
<button class="bg-primary-600 text-white border border-primary-600 hover:bg-primary-700">
  Primary Button
</button>

<div class="text-gray-600 bg-gray-50 border border-gray-200">
  Card content
</div>`}
                  </code>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-700 mb-2">
                  Available Tailwind Color Classes
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h6 className="text-sm font-medium text-gray-700 mb-2">
                      Text Colors
                    </h6>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>
                        <code>text-primary-{"{50-900}"}</code>
                      </li>
                      <li>
                        <code>text-gray-{"{50-900}"}</code>
                      </li>
                      <li>
                        <code>text-success-{"{50-900}"}</code>
                      </li>
                      <li>
                        <code>text-warning-{"{50-900}"}</code>
                      </li>
                      <li>
                        <code>text-error-{"{50-900}"}</code>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h6 className="text-sm font-medium text-gray-700 mb-2">
                      Background Colors
                    </h6>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>
                        <code>bg-primary-{"{50-900}"}</code>
                      </li>
                      <li>
                        <code>bg-gray-{"{50-900}"}</code>
                      </li>
                      <li>
                        <code>bg-success-{"{50-900}"}</code>
                      </li>
                      <li>
                        <code>bg-warning-{"{50-900}"}</code>
                      </li>
                      <li>
                        <code>bg-error-{"{50-900}"}</code>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Component Patterns */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-4">
              Component Color Patterns
            </h4>
            <div className="space-y-6">
              <div>
                <h5 className="font-medium text-gray-700 mb-3">
                  Button States
                </h5>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          State
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Primary Button
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Secondary Button
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Default
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <code>bg-primary-600 text-white</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <code>bg-gray-100 text-gray-700</code>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Hover
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <code>bg-primary-700</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <code>bg-gray-200</code>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Disabled
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <code>opacity-50 cursor-not-allowed</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <code>opacity-50 cursor-not-allowed</code>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h5 className="font-medium text-gray-700 mb-3">
                  Form Input States
                </h5>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          State
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Border Color
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Focus Ring
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Default
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <code>border-gray-300</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <code>ring-primary-600</code>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Success
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <code>border-success-500</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <code>ring-success-600</code>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Error
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <code>border-error-500</code>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <code>ring-error-600</code>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Color Usage Scenarios */}
      <section className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Color Usage Scenarios
          </h3>
          <p className="text-gray-600">
            Specific guidelines for different parts of the LMS interface
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Dashboard Colors */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-4">
              Dashboard Interface
            </h4>
            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Progress Indicators
                </h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    <span className="text-success-600">•</span> Completed:{" "}
                    <code>success-500/600</code>
                  </li>
                  <li>
                    <span className="text-primary-600">•</span> In Progress:{" "}
                    <code>primary-500/600</code>
                  </li>
                  <li>
                    <span className="text-gray-400">•</span> Not Started:{" "}
                    <code>gray-300/400</code>
                  </li>
                </ul>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Metric Cards
                </h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    <span className="text-primary-600">•</span> Primary metrics:{" "}
                    <code>primary-600</code> top border
                  </li>
                  <li>
                    <span className="text-success-600">•</span> Positive trends:{" "}
                    <code>success-600</code> top border
                  </li>
                  <li>
                    <span className="text-warning-600">•</span> Warnings:{" "}
                    <code>warning-600</code> top border
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Course Interface Colors */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-4">
              Course Interface
            </h4>
            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Video Player
                </h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    <span className="text-primary-600">•</span> Progress bar:{" "}
                    <code>primary-600</code>
                  </li>
                  <li>
                    <span className="text-gray-800">•</span> Controls
                    background: <code>gray-800</code>
                  </li>
                  <li>
                    <span className="text-white">•</span> Control icons:{" "}
                    <code>white</code>
                  </li>
                </ul>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Quiz States
                </h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    <span className="text-success-600">•</span> Correct:{" "}
                    <code>success-50</code> bg, <code>success-600</code> border
                  </li>
                  <li>
                    <span className="text-error-600">•</span> Incorrect:{" "}
                    <code>error-50</code> bg, <code>error-600</code> border
                  </li>
                  <li>
                    <span className="text-primary-600">•</span> Active:{" "}
                    <code>primary-50</code> bg, <code>primary-600</code> border
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Admin Interface Colors */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-4">
              Admin Interface
            </h4>
            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  User Management
                </h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    <span className="text-success-600">•</span> Active users:{" "}
                    <code>success-600</code> badge
                  </li>
                  <li>
                    <span className="text-warning-600">•</span> Pending users:{" "}
                    <code>warning-600</code> badge
                  </li>
                  <li>
                    <span className="text-error-600">•</span> Suspended users:{" "}
                    <code>error-600</code> badge
                  </li>
                </ul>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Course Status
                </h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    <span className="text-success-600">•</span> Published:{" "}
                    <code>success-600</code>
                  </li>
                  <li>
                    <span className="text-warning-600">•</span> Draft:{" "}
                    <code>warning-600</code>
                  </li>
                  <li>
                    <span className="text-gray-600">•</span> Archived:{" "}
                    <code>gray-600</code>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Form Interface Colors */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-4">Form Interface</h4>
            <div className="space-y-4">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Validation States
                </h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    <span className="text-success-600">•</span> Valid input:{" "}
                    <code>success-500</code> border
                  </li>
                  <li>
                    <span className="text-error-600">•</span> Invalid input:{" "}
                    <code>error-500</code> border
                  </li>
                  <li>
                    <span className="text-gray-300">•</span> Default input:{" "}
                    <code>gray-300</code> border
                  </li>
                </ul>
              </div>
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Form Messages
                </h5>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    <span className="text-success-600">•</span> Success
                    messages: <code>success-600</code> text
                  </li>
                  <li>
                    <span className="text-error-600">•</span> Error messages:{" "}
                    <code>error-600</code> text
                  </li>
                  <li>
                    <span className="text-gray-600">•</span> Help text:{" "}
                    <code>gray-600</code> text
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Common Mistakes */}
      <section className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Common Mistakes to Avoid
          </h3>
          <p className="text-gray-600">
            Frequent pitfalls when implementing the color system
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-error-700 mb-4">
                ❌ Don't Do This
              </h4>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-error-600 mr-2">•</span>
                  Use too many different colors in one interface
                </li>
                <li className="flex items-start">
                  <span className="text-error-600 mr-2">•</span>
                  Apply bright status colors for decorative purposes
                </li>
                <li className="flex items-start">
                  <span className="text-error-600 mr-2">•</span>
                  Rely solely on color to convey important information
                </li>
                <li className="flex items-start">
                  <span className="text-error-600 mr-2">•</span>
                  Use hardcoded hex values instead of CSS variables
                </li>
                <li className="flex items-start">
                  <span className="text-error-600 mr-2">•</span>
                  Ignore contrast ratios for accessibility compliance
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-success-700 mb-4">
                ✅ Do This Instead
              </h4>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="text-success-600 mr-2">•</span>
                  Stick to the defined color palette and use it consistently
                </li>
                <li className="flex items-start">
                  <span className="text-success-600 mr-2">•</span>
                  Reserve status colors for actual status communication
                </li>
                <li className="flex items-start">
                  <span className="text-success-600 mr-2">•</span>
                  Combine color with icons, text, or patterns for clarity
                </li>
                <li className="flex items-start">
                  <span className="text-success-600 mr-2">•</span>
                  Always use CSS custom properties for maintainability
                </li>
                <li className="flex items-start">
                  <span className="text-success-600 mr-2">•</span>
                  Test all color combinations for accessibility compliance
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Reference */}
      <section className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Quick Reference
          </h3>
          <p className="text-gray-600">
            Handy reference for common color usage patterns
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">
                Primary Actions
              </h4>
              <ul className="text-sm space-y-1">
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    primary-600
                  </code>{" "}
                  - Main buttons
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    primary-700
                  </code>{" "}
                  - Hover states
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    primary-50
                  </code>{" "}
                  - Light backgrounds
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">
                Text Hierarchy
              </h4>
              <ul className="text-sm space-y-1">
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    gray-900
                  </code>{" "}
                  - Primary headings
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    gray-700
                  </code>{" "}
                  - Secondary headings
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    gray-600
                  </code>{" "}
                  - Body text
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    gray-400
                  </code>{" "}
                  - Placeholder text
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-3">
                Status Indicators
              </h4>
              <ul className="text-sm space-y-1">
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    success-600
                  </code>{" "}
                  - Success states
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    warning-600
                  </code>{" "}
                  - Warning states
                </li>
                <li>
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    error-600
                  </code>{" "}
                  - Error states
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
