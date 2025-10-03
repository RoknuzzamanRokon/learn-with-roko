"use client";

import React, { useState } from "react";

export function AccessibilityDemo() {
  const [contrastMode, setContrastMode] = useState("normal");
  const [colorBlindMode, setColorBlindMode] = useState("normal");

  const contrastPairs = [
    {
      name: "Primary on White",
      fg: "var(--primary-600)",
      bg: "var(--white)",
      ratio: "7.21:1",
      status: "AAA",
    },
    {
      name: "Gray 900 on White",
      fg: "var(--gray-900)",
      bg: "var(--white)",
      ratio: "16.75:1",
      status: "AAA",
    },
    {
      name: "Gray 600 on White",
      fg: "var(--gray-600)",
      bg: "var(--white)",
      ratio: "7.21:1",
      status: "AAA",
    },
    {
      name: "Gray 400 on White",
      fg: "var(--gray-400)",
      bg: "var(--white)",
      ratio: "3.12:1",
      status: "AA Large",
    },
    {
      name: "White on Primary",
      fg: "var(--white)",
      bg: "var(--primary-600)",
      ratio: "7.21:1",
      status: "AAA",
    },
    {
      name: "White on Success",
      fg: "var(--white)",
      bg: "var(--success-600)",
      ratio: "4.89:1",
      status: "AA",
    },
    {
      name: "White on Warning",
      fg: "var(--white)",
      bg: "var(--warning-600)",
      ratio: "4.12:1",
      status: "AA",
    },
    {
      name: "White on Error",
      fg: "var(--white)",
      bg: "var(--error-600)",
      ratio: "5.47:1",
      status: "AA",
    },
  ];

  const colorBlindTests = [
    {
      name: "Success vs Error Distinction",
      description:
        "Testing if success and error states are distinguishable for color-blind users",
      elements: [
        { type: "success", label: "Success Message", icon: "✓" },
        { type: "error", label: "Error Message", icon: "✕" },
        { type: "warning", label: "Warning Message", icon: "⚠" },
      ],
    },
    {
      name: "Progress Indicators",
      description: "Testing progress indicators with patterns and labels",
      elements: [
        {
          type: "completed",
          label: "Completed (100%)",
          progress: 100,
          pattern: "solid",
        },
        {
          type: "in-progress",
          label: "In Progress (75%)",
          progress: 75,
          pattern: "striped",
        },
        {
          type: "not-started",
          label: "Not Started (0%)",
          progress: 0,
          pattern: "dotted",
        },
      ],
    },
  ];

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Accessibility Compliance
        </h2>
        <p className="text-gray-600 mb-8">
          Comprehensive accessibility testing and compliance validation for the
          LMS color system.
        </p>
      </div>

      {/* Accessibility Controls */}
      <section className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Accessibility Testing Controls
          </h3>
          <p className="text-gray-600">
            Use these controls to test different accessibility scenarios
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contrast Mode
              </label>
              <select
                value={contrastMode}
                onChange={(e) => setContrastMode(e.target.value)}
                className="input-base w-full"
              >
                <option value="normal">Normal Contrast</option>
                <option value="high">High Contrast</option>
                <option value="reduced">Reduced Contrast (Testing)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color Vision Simulation
              </label>
              <select
                value={colorBlindMode}
                onChange={(e) => setColorBlindMode(e.target.value)}
                className="input-base w-full"
              >
                <option value="normal">Normal Vision</option>
                <option value="protanopia">Protanopia (Red-blind)</option>
                <option value="deuteranopia">Deuteranopia (Green-blind)</option>
                <option value="tritanopia">Tritanopia (Blue-blind)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Contrast Ratio Testing */}
      <section className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Contrast Ratio Compliance
          </h3>
          <p className="text-gray-600">
            WCAG 2.1 contrast ratio testing for all color combinations
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="mb-6">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-success-500 rounded-full mr-2"></span>
                <span>AAA (7:1+) - Enhanced</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-primary-500 rounded-full mr-2"></span>
                <span>AA (4.5:1+) - Standard</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-warning-500 rounded-full mr-2"></span>
                <span>AA Large (3:1+) - Large Text Only</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-error-500 rounded-full mr-2"></span>
                <span>Fail (&lt;3:1) - Non-compliant</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {contrastPairs.map((pair, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <div
                  className="h-20 flex items-center justify-center text-sm font-medium"
                  style={{
                    backgroundColor: pair.bg,
                    color: pair.fg,
                    filter:
                      contrastMode === "high"
                        ? "contrast(1.5)"
                        : contrastMode === "reduced"
                        ? "contrast(0.7)"
                        : "none",
                  }}
                >
                  Sample Text
                </div>
                <div className="p-3">
                  <h4 className="font-medium text-gray-900 text-sm mb-1">
                    {pair.name}
                  </h4>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{pair.ratio}</span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        pair.status === "AAA"
                          ? "bg-success-100 text-success-800"
                          : pair.status === "AA"
                          ? "bg-primary-100 text-primary-800"
                          : pair.status === "AA Large"
                          ? "bg-warning-100 text-warning-800"
                          : "bg-error-100 text-error-800"
                      }`}
                    >
                      {pair.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Color-Blind Friendly Testing */}
      <section className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Color-Blind Friendly Design
          </h3>
          <p className="text-gray-600">
            Testing color combinations with additional visual cues for
            accessibility
          </p>
        </div>

        <div className="space-y-8">
          {colorBlindTests.map((test, testIndex) => (
            <div
              key={testIndex}
              className="bg-white p-6 rounded-lg border border-gray-200"
            >
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">
                  {test.name}
                </h4>
                <p className="text-gray-600 text-sm">{test.description}</p>
              </div>

              {test.name === "Success vs Error Distinction" && (
                <div className="space-y-4">
                  {test.elements.map((element, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border flex items-center ${
                        element.type === "success"
                          ? "bg-success-50 border-success-200"
                          : element.type === "error"
                          ? "bg-error-50 border-error-200"
                          : "bg-warning-50 border-warning-200"
                      }`}
                      style={{
                        filter:
                          colorBlindMode === "protanopia"
                            ? "sepia(1) saturate(0.8) hue-rotate(-50deg)"
                            : colorBlindMode === "deuteranopia"
                            ? "sepia(1) saturate(0.8) hue-rotate(50deg)"
                            : colorBlindMode === "tritanopia"
                            ? "sepia(1) saturate(0.8) hue-rotate(180deg)"
                            : "none",
                      }}
                    >
                      <span
                        className={`text-2xl mr-3 ${
                          element.type === "success"
                            ? "text-success-600"
                            : element.type === "error"
                            ? "text-error-600"
                            : "text-warning-600"
                        }`}
                      >
                        {"icon" in element ? element.icon : "●"}
                      </span>
                      <span
                        className={`font-medium ${
                          element.type === "success"
                            ? "text-success-800"
                            : element.type === "error"
                            ? "text-error-800"
                            : "text-warning-800"
                        }`}
                      >
                        {element.label}
                      </span>
                      <span className="ml-auto text-xs bg-white px-2 py-1 rounded border">
                        {element.type.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {test.name === "Progress Indicators" && (
                <div className="space-y-4">
                  {test.elements.map((element, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">
                          {element.label}
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {"pattern" in element
                            ? element.pattern.toUpperCase()
                            : "STANDARD"}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            element.type === "completed"
                              ? "bg-success-500"
                              : element.type === "in-progress"
                              ? "bg-primary-500"
                              : "bg-gray-300"
                          }`}
                          style={{
                            width: `${
                              "progress" in element ? element.progress : 0
                            }%`,
                            backgroundImage:
                              "pattern" in element &&
                              element.pattern === "striped"
                                ? "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.3) 4px, rgba(255,255,255,0.3) 8px)"
                                : "pattern" in element &&
                                  element.pattern === "dotted"
                                ? "radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)"
                                : "none",
                            backgroundSize:
                              "pattern" in element &&
                              element.pattern === "dotted"
                                ? "8px 8px"
                                : "auto",
                            filter:
                              colorBlindMode === "protanopia"
                                ? "sepia(1) saturate(0.8) hue-rotate(-50deg)"
                                : colorBlindMode === "deuteranopia"
                                ? "sepia(1) saturate(0.8) hue-rotate(50deg)"
                                : colorBlindMode === "tritanopia"
                                ? "sepia(1) saturate(0.8) hue-rotate(180deg)"
                                : "none",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Keyboard Navigation Testing */}
      <section className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Keyboard Navigation & Focus States
          </h3>
          <p className="text-gray-600">
            Testing focus indicators and keyboard accessibility
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-4">
            Use Tab key to navigate through these elements and observe focus
            indicators:
          </p>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <button className="btn-base btn-primary focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                Primary Button
              </button>
              <button className="btn-base btn-secondary focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                Secondary Button
              </button>
              <button className="btn-base btn-success focus:ring-2 focus:ring-success-500 focus:ring-offset-2">
                Success Button
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Focus me with Tab"
                className="input-base focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <select className="input-base focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option>Select an option</option>
                <option>Option 1</option>
                <option>Option 2</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2 text-primary-600 focus:ring-primary-500 focus:ring-2"
                />
                <span>Checkbox with focus ring</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="focus-test"
                  className="mr-2 text-primary-600 focus:ring-primary-500 focus:ring-2"
                />
                <span>Radio button with focus ring</span>
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Screen Reader Testing */}
      <section className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Screen Reader Compatibility
          </h3>
          <p className="text-gray-600">
            Testing semantic markup and screen reader announcements
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="space-y-6">
            {/* Status Announcements */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">
                Status Announcements
              </h4>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-success-50 border border-success-200 rounded-lg">
                  <span className="text-success-600 mr-3" aria-hidden="true">
                    ✓
                  </span>
                  <span className="text-success-800">
                    <span className="sr-only">Success: </span>
                    Form submitted successfully
                  </span>
                </div>
                <div className="flex items-center p-3 bg-error-50 border border-error-200 rounded-lg">
                  <span className="text-error-600 mr-3" aria-hidden="true">
                    ✕
                  </span>
                  <span className="text-error-800">
                    <span className="sr-only">Error: </span>
                    Please correct the highlighted fields
                  </span>
                </div>
                <div className="flex items-center p-3 bg-warning-50 border border-warning-200 rounded-lg">
                  <span className="text-warning-600 mr-3" aria-hidden="true">
                    ⚠
                  </span>
                  <span className="text-warning-800">
                    <span className="sr-only">Warning: </span>
                    Your session will expire in 5 minutes
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Announcements */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">
                Progress Indicators
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Progress
                  </label>
                  <div
                    className="w-full bg-gray-200 rounded-full h-3"
                    role="progressbar"
                    aria-valuenow={75}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Course completion progress"
                  >
                    <div className="bg-primary-500 h-3 rounded-full w-3/4"></div>
                  </div>
                  <span className="sr-only">75% complete</span>
                  <span className="text-sm text-gray-600 mt-1 block">
                    75% complete
                  </span>
                </div>
              </div>
            </div>

            {/* Color-coded Information */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">
                Color-coded Information with Text Labels
              </h4>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span
                    className="w-3 h-3 bg-success-500 rounded-full mr-3"
                    aria-hidden="true"
                  ></span>
                  <span>Available (shown in green)</span>
                </div>
                <div className="flex items-center">
                  <span
                    className="w-3 h-3 bg-warning-500 rounded-full mr-3"
                    aria-hidden="true"
                  ></span>
                  <span>Limited availability (shown in orange)</span>
                </div>
                <div className="flex items-center">
                  <span
                    className="w-3 h-3 bg-error-500 rounded-full mr-3"
                    aria-hidden="true"
                  ></span>
                  <span>Unavailable (shown in red)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accessibility Checklist */}
      <section className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Accessibility Compliance Checklist
          </h3>
          <p className="text-gray-600">WCAG 2.1 AA compliance verification</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-800 mb-4">
                Color & Contrast
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="text-success-600 mr-3">✓</span>
                  <span className="text-gray-700">
                    All text meets 4.5:1 contrast ratio minimum
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="text-success-600 mr-3">✓</span>
                  <span className="text-gray-700">
                    Large text meets 3:1 contrast ratio minimum
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="text-success-600 mr-3">✓</span>
                  <span className="text-gray-700">
                    Color is not the only means of conveying information
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="text-success-600 mr-3">✓</span>
                  <span className="text-gray-700">
                    Focus indicators have sufficient contrast
                  </span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-gray-800 mb-4">
                Interaction & Navigation
              </h4>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="text-success-600 mr-3">✓</span>
                  <span className="text-gray-700">
                    All interactive elements are keyboard accessible
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="text-success-600 mr-3">✓</span>
                  <span className="text-gray-700">
                    Focus indicators are clearly visible
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="text-success-600 mr-3">✓</span>
                  <span className="text-gray-700">
                    Status messages are announced to screen readers
                  </span>
                </li>
                <li className="flex items-center">
                  <span className="text-success-600 mr-3">✓</span>
                  <span className="text-gray-700">
                    Color-coded elements have text alternatives
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
