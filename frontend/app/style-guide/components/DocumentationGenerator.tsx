"use client";

import React, { useState } from "react";
import {
  generateColorDocumentation,
  generateColorJSON,
  generateAccessibilityReport,
  validateColorAccessibility,
  COLOR_PALETTE,
} from "../utils/colorAnalyzer";

export function DocumentationGenerator() {
  const [activeTab, setActiveTab] = useState("overview");
  const [generatedDocs, setGeneratedDocs] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateMarkdown = async () => {
    setIsGenerating(true);
    try {
      const markdown = generateColorDocumentation();
      setGeneratedDocs(markdown);
      setActiveTab("markdown");
    } catch (error) {
      console.error("Error generating documentation:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateJSON = async () => {
    setIsGenerating(true);
    try {
      const json = generateColorJSON();
      setGeneratedDocs(json);
      setActiveTab("json");
    } catch (error) {
      console.error("Error generating JSON:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const accessibilityReport = generateAccessibilityReport();
  const accessibilityValidation = validateColorAccessibility();

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "accessibility", label: "Accessibility Report" },
    { id: "markdown", label: "Markdown Docs" },
    { id: "json", label: "JSON Export" },
    { id: "guidelines", label: "Developer Guidelines" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Automated Documentation Generator
        </h2>
        <p className="text-gray-600 mb-6">
          Generate comprehensive documentation, accessibility reports, and
          developer guidelines for the LMS color system.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Color Count */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Colors</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.values(COLOR_PALETTE).flat().length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 text-xl">🎨</span>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Categories</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Object.keys(COLOR_PALETTE).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                  <span className="text-success-600 text-xl">📂</span>
                </div>
              </div>
            </div>

            {/* Accessibility Score */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Accessibility</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(
                      (accessibilityValidation.passed /
                        accessibilityValidation.totalTests) *
                        100
                    )}
                    %
                  </p>
                </div>
                <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                  <span className="text-success-600 text-xl">♿</span>
                </div>
              </div>
            </div>

            {/* Documentation Status */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Documentation</p>
                  <p className="text-2xl font-bold text-success-600">Ready</p>
                </div>
                <div className="w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
                  <span className="text-success-600 text-xl">📚</span>
                </div>
              </div>
            </div>
          </div>

          {/* Color Categories Overview */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Color Categories
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(COLOR_PALETTE).map(([category, colors]) => (
                <div key={category} className="space-y-3">
                  <h4 className="font-medium text-gray-700 capitalize">
                    {category}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {colors.slice(0, 6).map((color, index) => (
                      <div
                        key={index}
                        className="w-8 h-8 rounded border border-gray-200"
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                    {colors.length > 6 && (
                      <div className="w-8 h-8 rounded border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-600">
                        +{colors.length - 6}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {colors.length} colors
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Generate Documentation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleGenerateMarkdown}
                disabled={isGenerating}
                className="btn-base btn-primary flex items-center justify-center"
              >
                {isGenerating ? (
                  <span className="animate-spin mr-2">⏳</span>
                ) : (
                  <span className="mr-2">📝</span>
                )}
                Generate Markdown Documentation
              </button>
              <button
                onClick={handleGenerateJSON}
                disabled={isGenerating}
                className="btn-base btn-secondary flex items-center justify-center"
              >
                {isGenerating ? (
                  <span className="animate-spin mr-2">⏳</span>
                ) : (
                  <span className="mr-2">📄</span>
                )}
                Export JSON Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accessibility Report Tab */}
      {activeTab === "accessibility" && (
        <div className="space-y-8">
          {/* Accessibility Summary */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Accessibility Compliance Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-success-600 mb-2">
                  {accessibilityValidation.passed}
                </div>
                <div className="text-sm text-gray-600">Passed Tests</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-error-600 mb-2">
                  {accessibilityValidation.failed}
                </div>
                <div className="text-sm text-gray-600">Failed Tests</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">
                  {Math.round(
                    (accessibilityValidation.passed /
                      accessibilityValidation.totalTests) *
                      100
                  )}
                  %
                </div>
                <div className="text-sm text-gray-600">Compliance Rate</div>
              </div>
            </div>
          </div>

          {/* Detailed Accessibility Report */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">
                Contrast Ratio Testing Results
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Color Combination
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preview
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contrast Ratio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      WCAG Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {accessibilityReport.map((report, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {report.colorPair}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className="px-3 py-2 text-sm rounded"
                          style={{
                            backgroundColor: report.background,
                            color: report.foreground,
                          }}
                        >
                          Sample Text
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.contrast.ratio}:1
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            report.contrast.level === "AAA"
                              ? "bg-success-100 text-success-800"
                              : report.contrast.level === "AA"
                              ? "bg-primary-100 text-primary-800"
                              : report.contrast.level === "AA Large"
                              ? "bg-warning-100 text-warning-800"
                              : "bg-error-100 text-error-800"
                          }`}
                        >
                          {report.contrast.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            report.contrast.passes
                              ? "bg-success-100 text-success-800"
                              : "bg-error-100 text-error-800"
                          }`}
                        >
                          {report.contrast.passes ? "✅ Pass" : "❌ Fail"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recommendations */}
          {accessibilityValidation.warnings.length > 0 && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-warning-800 mb-4">
                Accessibility Recommendations
              </h3>
              <ul className="space-y-2">
                {accessibilityValidation.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-warning-600 mr-2">⚠</span>
                    <span className="text-warning-700 text-sm">{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Markdown Documentation Tab */}
      {activeTab === "markdown" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Markdown Documentation
            </h3>
            <div className="flex space-x-3">
              <button
                onClick={handleGenerateMarkdown}
                className="btn-base btn-secondary text-sm"
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Regenerate"}
              </button>
              {generatedDocs && (
                <button
                  onClick={() =>
                    handleDownload(
                      generatedDocs,
                      "lms-color-palette.md",
                      "text/markdown"
                    )
                  }
                  className="btn-base btn-primary text-sm"
                >
                  Download MD
                </button>
              )}
            </div>
          </div>

          {generatedDocs ? (
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  lms-color-palette.md
                </span>
              </div>
              <pre className="p-6 text-sm text-gray-800 overflow-x-auto max-h-96">
                {generatedDocs}
              </pre>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600 mb-4">
                Click "Generate Markdown Documentation" to create comprehensive
                documentation.
              </p>
              <button
                onClick={handleGenerateMarkdown}
                className="btn-base btn-primary"
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate Documentation"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* JSON Export Tab */}
      {activeTab === "json" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">JSON Export</h3>
            <div className="flex space-x-3">
              <button
                onClick={handleGenerateJSON}
                className="btn-base btn-secondary text-sm"
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Regenerate"}
              </button>
              {generatedDocs && (
                <button
                  onClick={() =>
                    handleDownload(
                      generatedDocs,
                      "lms-color-palette.json",
                      "application/json"
                    )
                  }
                  className="btn-base btn-primary text-sm"
                >
                  Download JSON
                </button>
              )}
            </div>
          </div>

          {generatedDocs ? (
            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  lms-color-palette.json
                </span>
              </div>
              <pre className="p-6 text-sm text-gray-800 overflow-x-auto max-h-96">
                {generatedDocs}
              </pre>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
              <p className="text-gray-600 mb-4">
                Click "Export JSON Data" to create a machine-readable color
                palette export.
              </p>
              <button
                onClick={handleGenerateJSON}
                className="btn-base btn-primary"
                disabled={isGenerating}
              >
                {isGenerating ? "Generating..." : "Export JSON"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Developer Guidelines Tab */}
      {activeTab === "guidelines" && (
        <div className="space-y-8">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Developer Implementation Guidelines
            </h3>

            <div className="space-y-6">
              {/* CSS Custom Properties */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">
                  CSS Custom Properties Usage
                </h4>
                <div className="bg-gray-50 p-4 rounded-md">
                  <code className="text-sm text-gray-800">
                    {`/* Recommended: Use CSS custom properties */
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

              {/* Tailwind Classes */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">
                  Tailwind CSS Classes
                </h4>
                <div className="bg-gray-50 p-4 rounded-md">
                  <code className="text-sm text-gray-800">
                    {`<!-- Recommended: Use semantic Tailwind classes -->
<button class="bg-primary-600 text-white hover:bg-primary-700">
  Primary Button
</button>

<div class="text-gray-600 bg-gray-50 border border-gray-200">
  Card Content
</div>`}
                  </code>
                </div>
              </div>

              {/* Color Validation */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">
                  Accessibility Validation
                </h4>
                <div className="bg-gray-50 p-4 rounded-md">
                  <code className="text-sm text-gray-800">
                    {`// Use the color analyzer to validate combinations
import { calculateContrastRatio, COLOR_PALETTE } from './utils/colorAnalyzer';

const foreground = COLOR_PALETTE.neutral[10]; // gray-900
const background = COLOR_PALETTE.neutral[0];  // white
const result = calculateContrastRatio(foreground, background);

if (result.passes) {
  console.log(\`Contrast ratio \${result.ratio}:1 meets \${result.level} standards\`);
}`}
                  </code>
                </div>
              </div>

              {/* Extension Guidelines */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3">
                  Extending the Color System
                </h4>
                <div className="space-y-3">
                  <div className="bg-success-50 border border-success-200 rounded-md p-4">
                    <h5 className="font-medium text-success-800 mb-2">
                      ✅ Best Practices
                    </h5>
                    <ul className="text-sm text-success-700 space-y-1">
                      <li>• Add new colors to the COLOR_PALETTE constant</li>
                      <li>
                        • Include RGB and HSL values for accessibility
                        calculations
                      </li>
                      <li>• Provide clear usage descriptions</li>
                      <li>• Test contrast ratios with existing colors</li>
                      <li>
                        • Update Tailwind configuration to include new colors
                      </li>
                    </ul>
                  </div>

                  <div className="bg-error-50 border border-error-200 rounded-md p-4">
                    <h5 className="font-medium text-error-800 mb-2">
                      ❌ Avoid These Mistakes
                    </h5>
                    <ul className="text-sm text-error-700 space-y-1">
                      <li>• Don't add colors without accessibility testing</li>
                      <li>• Don't use hardcoded hex values in components</li>
                      <li>
                        • Don't create colors that are too similar to existing
                        ones
                      </li>
                      <li>• Don't ignore semantic naming conventions</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* API Reference */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Color Analyzer API Reference
            </h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  calculateContrastRatio(color1, color2)
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  Calculates the contrast ratio between two colors and returns
                  WCAG compliance information.
                </p>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <strong>Returns:</strong>{" "}
                  <code>
                    {"{ ratio: number, level: string, passes: boolean }"}
                  </code>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  generateAccessibilityReport()
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  Generates a comprehensive accessibility report for all common
                  color combinations.
                </p>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <strong>Returns:</strong> <code>AccessibilityReport[]</code>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  generateColorDocumentation()
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  Generates complete markdown documentation for the color
                  palette.
                </p>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <strong>Returns:</strong> <code>string</code> (Markdown
                  formatted)
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-700 mb-2">
                  validateColorAccessibility()
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  Validates accessibility compliance across the entire color
                  palette.
                </p>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <strong>Returns:</strong>{" "}
                  <code>
                    {
                      "{ totalTests: number, passed: number, failed: number, warnings: string[] }"
                    }
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
