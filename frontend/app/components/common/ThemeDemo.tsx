"use client";

import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { ThemeManager } from "../../services/themeService";

export function ThemeDemo() {
  const { currentTheme, previewTheme, clearPreview } = useTheme();
  const [isTestingColors, setIsTestingColors] = useState(false);

  const testColorChange = async () => {
    if (!currentTheme || isTestingColors) return;

    setIsTestingColors(true);

    try {
      // Create a test theme with different primary color
      const testTheme = {
        ...currentTheme,
        colors: {
          ...currentTheme.colors,
          primary: {
            ...currentTheme.colors.primary,
            "600": "#dc2626", // Red color for testing
          },
        },
      };

      // Preview the test theme
      previewTheme(testTheme);

      // Revert after 3 seconds
      setTimeout(async () => {
        await clearPreview();
        setIsTestingColors(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to test color change:", error);
      setIsTestingColors(false);
    }
  };

  const testRuntimeUpdate = () => {
    if (!ThemeManager.supportsRuntimeUpdates()) {
      alert("Runtime updates not supported in this environment");
      return;
    }

    // Test individual property update
    const originalColor = getComputedStyle(
      document.documentElement
    ).getPropertyValue("--primary-600");

    ThemeManager.updateCSSProperty("--primary-600", "#059669");

    // Revert after 2 seconds
    setTimeout(() => {
      ThemeManager.updateCSSProperty("--primary-600", originalColor);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[var(--gray-200)] p-6">
      <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-4">
        Theme System Demo
      </h3>

      <div className="space-y-4">
        {/* Current Theme Info */}
        <div className="bg-[var(--gray-50)] rounded-lg p-4">
          <h4 className="text-sm font-medium text-[var(--gray-700)] mb-2">
            Current Theme
          </h4>
          <div className="text-sm text-[var(--gray-600)]">
            <div>Name: {currentTheme?.name || "Loading..."}</div>
            <div>ID: {currentTheme?.id || "Loading..."}</div>
            <div>
              Primary Color:
              <span
                className="inline-block w-4 h-4 rounded ml-2 border border-[var(--gray-300)]"
                style={{ backgroundColor: currentTheme?.colors.primary["600"] }}
              ></span>
              {currentTheme?.colors.primary["600"]}
            </div>
          </div>
        </div>

        {/* Demo Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={testColorChange}
            disabled={isTestingColors}
            className="btn-base btn-primary"
          >
            {isTestingColors ? "Testing..." : "Test Color Preview (3s)"}
          </button>

          <button
            onClick={testRuntimeUpdate}
            className="btn-base btn-secondary"
          >
            Test Runtime Update (2s)
          </button>
        </div>

        {/* Sample Components */}
        <div className="border-t border-[var(--gray-200)] pt-4">
          <h4 className="text-sm font-medium text-[var(--gray-700)] mb-3">
            Sample Components
          </h4>
          <div className="space-y-3">
            {/* Buttons */}
            <div className="flex flex-wrap gap-2">
              <button className="btn-base btn-primary">Primary</button>
              <button className="btn-base btn-secondary">Secondary</button>
              <button className="btn-base btn-success">Success</button>
              <button className="btn-base btn-warning">Warning</button>
              <button className="btn-base btn-error">Error</button>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="text-xs text-[var(--gray-600)] mb-1">
                Progress: 75%
              </div>
              <div className="w-full bg-[var(--gray-200)] rounded-full h-2">
                <div
                  className="bg-[var(--primary-600)] h-2 rounded-full transition-colors duration-300"
                  style={{ width: "75%" }}
                ></div>
              </div>
            </div>

            {/* Status Messages */}
            <div className="space-y-2">
              <div className="bg-[var(--success-50)] border border-[var(--success-200)] rounded p-2 text-xs text-[var(--success-800)]">
                ✅ Success message
              </div>
              <div className="bg-[var(--warning-50)] border border-[var(--warning-200)] rounded p-2 text-xs text-[var(--warning-800)]">
                ⚠️ Warning message
              </div>
              <div className="bg-[var(--error-50)] border border-[var(--error-200)] rounded p-2 text-xs text-[var(--error-800)]">
                ❌ Error message
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
