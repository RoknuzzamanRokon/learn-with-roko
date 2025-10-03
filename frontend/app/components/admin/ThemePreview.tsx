"use client";

import { ThemeConfig } from "../../types";

interface ThemePreviewProps {
  theme: ThemeConfig;
}

export function ThemePreview({ theme }: ThemePreviewProps) {
  // Create CSS custom properties for preview
  const previewStyles = {
    "--preview-primary-50": theme.colors.primary["50"],
    "--preview-primary-100": theme.colors.primary["100"],
    "--preview-primary-500": theme.colors.primary["500"],
    "--preview-primary-600": theme.colors.primary["600"],
    "--preview-primary-700": theme.colors.primary["700"],
    "--preview-success-50": theme.colors.success["50"],
    "--preview-success-500": theme.colors.success["500"],
    "--preview-success-600": theme.colors.success["600"],
    "--preview-warning-50": theme.colors.warning["50"],
    "--preview-warning-500": theme.colors.warning["500"],
    "--preview-warning-600": theme.colors.warning["600"],
    "--preview-error-50": theme.colors.error["50"],
    "--preview-error-500": theme.colors.error["500"],
    "--preview-error-600": theme.colors.error["600"],
  } as React.CSSProperties;

  return (
    <div className="space-y-6" style={previewStyles}>
      {/* Header Preview */}
      <div className="border border-[var(--gray-200)] rounded-lg overflow-hidden">
        <div className="bg-white border-b border-[var(--gray-200)] p-4">
          <h4 className="text-sm font-medium text-[var(--gray-700)] mb-2">
            Header & Navigation
          </h4>
          <div className="bg-white border-b border-[var(--gray-200)] p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: "var(--preview-primary-600)" }}
                ></div>
                <span className="font-semibold text-[var(--gray-900)]">
                  LMS Platform
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="px-3 py-1 rounded text-sm text-white"
                  style={{ backgroundColor: "var(--preview-primary-600)" }}
                >
                  Dashboard
                </button>
                <button className="px-3 py-1 rounded text-sm text-[var(--gray-600)] hover:bg-[var(--gray-100)]">
                  Courses
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Button Preview */}
      <div className="border border-[var(--gray-200)] rounded-lg p-4">
        <h4 className="text-sm font-medium text-[var(--gray-700)] mb-3">
          Buttons
        </h4>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-4 py-2 rounded text-sm font-medium text-white"
            style={{ backgroundColor: "var(--preview-primary-600)" }}
          >
            Primary
          </button>
          <button className="px-4 py-2 rounded text-sm font-medium bg-[var(--gray-100)] text-[var(--gray-700)] border border-[var(--gray-200)]">
            Secondary
          </button>
          <button
            className="px-4 py-2 rounded text-sm font-medium text-white"
            style={{ backgroundColor: "var(--preview-success-600)" }}
          >
            Success
          </button>
          <button
            className="px-4 py-2 rounded text-sm font-medium text-white"
            style={{ backgroundColor: "var(--preview-warning-600)" }}
          >
            Warning
          </button>
          <button
            className="px-4 py-2 rounded text-sm font-medium text-white"
            style={{ backgroundColor: "var(--preview-error-600)" }}
          >
            Error
          </button>
        </div>
      </div>

      {/* Card Preview */}
      <div className="border border-[var(--gray-200)] rounded-lg p-4">
        <h4 className="text-sm font-medium text-[var(--gray-700)] mb-3">
          Cards & Metrics
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div
            className="bg-white border rounded-lg p-3"
            style={{
              borderTopColor: "var(--preview-primary-600)",
              borderTopWidth: "4px",
            }}
          >
            <div className="text-xs text-[var(--gray-500)]">Total Users</div>
            <div className="text-lg font-bold text-[var(--gray-900)]">
              1,234
            </div>
          </div>
          <div
            className="bg-white border rounded-lg p-3"
            style={{
              borderTopColor: "var(--preview-success-600)",
              borderTopWidth: "4px",
            }}
          >
            <div className="text-xs text-[var(--gray-500)]">Completed</div>
            <div className="text-lg font-bold text-[var(--gray-900)]">89%</div>
          </div>
        </div>
      </div>

      {/* Form Preview */}
      <div className="border border-[var(--gray-200)] rounded-lg p-4">
        <h4 className="text-sm font-medium text-[var(--gray-700)] mb-3">
          Form Elements
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--gray-700)] mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-3 py-2 text-sm border border-[var(--gray-300)] rounded focus:outline-none"
              style={
                {
                  borderColor: "var(--gray-300)",
                } as React.CSSProperties
              }
              onFocus={(e) => {
                e.target.style.borderColor = "var(--preview-primary-600)";
                e.target.style.boxShadow = `0 0 0 3px ${theme.colors.primary["600"]}20`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "var(--gray-300)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="preview-checkbox"
              className="rounded"
              style={{ accentColor: "var(--preview-primary-600)" }}
            />
            <label
              htmlFor="preview-checkbox"
              className="text-xs text-[var(--gray-700)]"
            >
              Remember me
            </label>
          </div>
        </div>
      </div>

      {/* Status Messages Preview */}
      <div className="border border-[var(--gray-200)] rounded-lg p-4">
        <h4 className="text-sm font-medium text-[var(--gray-700)] mb-3">
          Status Messages
        </h4>
        <div className="space-y-2">
          <div
            className="p-2 rounded text-xs"
            style={{
              backgroundColor: "var(--preview-success-50)",
              color: "var(--preview-success-600)",
              border: `1px solid var(--preview-success-500)`,
            }}
          >
            ✅ Success: Changes saved successfully
          </div>
          <div
            className="p-2 rounded text-xs"
            style={{
              backgroundColor: "var(--preview-warning-50)",
              color: "var(--preview-warning-600)",
              border: `1px solid var(--preview-warning-500)`,
            }}
          >
            ⚠️ Warning: Please review your settings
          </div>
          <div
            className="p-2 rounded text-xs"
            style={{
              backgroundColor: "var(--preview-error-50)",
              color: "var(--preview-error-600)",
              border: `1px solid var(--preview-error-500)`,
            }}
          >
            ❌ Error: Something went wrong
          </div>
        </div>
      </div>

      {/* Progress Indicators Preview */}
      <div className="border border-[var(--gray-200)] rounded-lg p-4">
        <h4 className="text-sm font-medium text-[var(--gray-700)] mb-3">
          Progress Indicators
        </h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-[var(--gray-600)] mb-1">
              <span>Course Progress</span>
              <span>75%</span>
            </div>
            <div className="w-full bg-[var(--gray-200)] rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{
                  backgroundColor: "var(--preview-primary-600)",
                  width: "75%",
                }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs text-[var(--gray-600)] mb-1">
              <span>Quiz Score</span>
              <span>90%</span>
            </div>
            <div className="w-full bg-[var(--gray-200)] rounded-full h-2">
              <div
                className="h-2 rounded-full"
                style={{
                  backgroundColor: "var(--preview-success-600)",
                  width: "90%",
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links Preview */}
      <div className="border border-[var(--gray-200)] rounded-lg p-4">
        <h4 className="text-sm font-medium text-[var(--gray-700)] mb-3">
          Navigation
        </h4>
        <div className="space-y-1">
          <div
            className="px-3 py-2 rounded text-sm font-medium"
            style={{
              backgroundColor: "var(--preview-primary-100)",
              color: "var(--preview-primary-600)",
              borderLeft: `3px solid var(--preview-primary-600)`,
            }}
          >
            📊 Dashboard (Active)
          </div>
          <div className="px-3 py-2 rounded text-sm text-[var(--gray-600)] hover:bg-[var(--gray-50)]">
            📚 Courses
          </div>
          <div className="px-3 py-2 rounded text-sm text-[var(--gray-600)] hover:bg-[var(--gray-50)]">
            👥 Users
          </div>
        </div>
      </div>
    </div>
  );
}
