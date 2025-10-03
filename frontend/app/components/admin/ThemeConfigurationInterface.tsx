"use client";

import { useState, useEffect } from "react";
import { ColorPicker } from "./ColorPicker";
import { ThemePreview } from "./ThemePreview";
import { useTheme } from "../../contexts/ThemeContext";
import { ThemeConfig, ColorPalette } from "../../types";
import { ThemeManager } from "../../services/themeService";

export function ThemeConfigurationInterface() {
  const {
    currentTheme,
    isLoading: themeLoading,
    error: themeError,
    updateTheme,
    previewTheme: applyPreview,
    clearPreview,
    resetToDefault,
  } = useTheme();

  const [previewTheme, setPreviewTheme] = useState<ThemeConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (currentTheme) {
      setPreviewTheme(currentTheme);
    }
  }, [currentTheme]);

  useEffect(() => {
    if (themeError) {
      setError(themeError);
    }
  }, [themeError]);

  const handleColorChange = (
    colorType: keyof ThemeConfig["colors"],
    shade: keyof ColorPalette,
    color: string
  ) => {
    if (!previewTheme) return;

    const updatedTheme = {
      ...previewTheme,
      colors: {
        ...previewTheme.colors,
        [colorType]: {
          ...previewTheme.colors[colorType],
          [shade]: color,
        },
      },
    };

    setPreviewTheme(updatedTheme);
    setHasUnsavedChanges(true);

    // Apply preview changes immediately
    applyPreview(updatedTheme);
  };

  const handleSaveTheme = async () => {
    if (!previewTheme) return;

    try {
      setIsSaving(true);
      setError(null);

      // Validate theme accessibility
      const validationResult = await ThemeManager.validateThemeAccessibility(
        previewTheme
      );
      if (!validationResult.isValid) {
        setError(
          `Theme validation failed: ${validationResult.errors.join(", ")}`
        );
        return;
      }

      // Save theme using context
      await updateTheme(previewTheme);
      setHasUnsavedChanges(false);
      setSuccessMessage("Theme saved successfully!");

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save theme");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetTheme = () => {
    if (!currentTheme) return;

    if (currentTheme) {
      setPreviewTheme(currentTheme);
      setHasUnsavedChanges(false);
      applyPreview(currentTheme);
    }
  };

  const handleResetToDefault = async () => {
    try {
      await resetToDefault();
      if (currentTheme) {
        setPreviewTheme(currentTheme);
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reset to default theme"
      );
    }
  };

  if (themeLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-[var(--gray-200)] p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)] mx-auto"></div>
          <p className="mt-4 text-[var(--gray-600)]">
            Loading theme configuration...
          </p>
        </div>
      </div>
    );
  }

  if (!previewTheme) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-[var(--gray-200)] p-8">
        <div className="text-center">
          <div className="text-[var(--error-600)] text-xl mb-4">⚠️ Error</div>
          <p className="text-[var(--gray-600)] mb-4">
            {error || "Failed to load theme"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-base btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Status Messages */}
      {error && (
        <div className="bg-[var(--error-50)] border border-[var(--error-200)] rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-[var(--error-600)] text-lg mr-3">⚠️</span>
            <p className="text-[var(--error-800)]">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-[var(--error-600)] hover:text-[var(--error-700)]"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-[var(--success-50)] border border-[var(--success-200)] rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-[var(--success-600)] text-lg mr-3">✅</span>
            <p className="text-[var(--success-800)]">{successMessage}</p>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-auto text-[var(--success-600)] hover:text-[var(--success-700)]"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-sm border border-[var(--gray-200)] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--gray-900)]">
              Theme Actions
            </h2>
            <p className="text-sm text-[var(--gray-600)] mt-1">
              {hasUnsavedChanges
                ? "You have unsaved changes"
                : "All changes saved"}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleResetToDefault}
              className="btn-base btn-secondary"
              disabled={themeLoading}
            >
              Reset to Default
            </button>
            {hasUnsavedChanges && (
              <button
                onClick={handleResetTheme}
                className="btn-base btn-secondary"
              >
                Discard Changes
              </button>
            )}
            <button
              onClick={handleSaveTheme}
              disabled={!hasUnsavedChanges || isSaving}
              className="btn-base btn-primary"
            >
              {isSaving ? "Saving..." : "Save Theme"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Color Configuration */}
        <div className="space-y-6">
          {/* Primary Colors */}
          <div className="bg-white rounded-lg shadow-sm border border-[var(--gray-200)] p-6">
            <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-4">
              Primary Brand Colors
            </h3>
            <div className="space-y-4">
              {Object.entries(previewTheme.colors.primary).map(
                ([shade, color]: [string, string]) => (
                  <ColorPicker
                    key={`primary-${shade}`}
                    label={`Primary ${shade}`}
                    value={color}
                    onChange={(newColor) =>
                      handleColorChange(
                        "primary",
                        shade as keyof ColorPalette,
                        newColor
                      )
                    }
                  />
                )
              )}
            </div>
          </div>

          {/* Status Colors */}
          <div className="bg-white rounded-lg shadow-sm border border-[var(--gray-200)] p-6">
            <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-4">
              Status Colors
            </h3>
            <div className="space-y-6">
              {/* Success Colors */}
              <div>
                <h4 className="text-md font-medium text-[var(--gray-800)] mb-3">
                  Success
                </h4>
                <div className="space-y-2">
                  {Object.entries(previewTheme.colors.success).map(
                    ([shade, color]: [string, string]) => (
                      <ColorPicker
                        key={`success-${shade}`}
                        label={`Success ${shade}`}
                        value={color}
                        onChange={(newColor) =>
                          handleColorChange(
                            "success",
                            shade as keyof ColorPalette,
                            newColor
                          )
                        }
                        size="sm"
                      />
                    )
                  )}
                </div>
              </div>

              {/* Warning Colors */}
              <div>
                <h4 className="text-md font-medium text-[var(--gray-800)] mb-3">
                  Warning
                </h4>
                <div className="space-y-2">
                  {Object.entries(previewTheme.colors.warning).map(
                    ([shade, color]: [string, string]) => (
                      <ColorPicker
                        key={`warning-${shade}`}
                        label={`Warning ${shade}`}
                        value={color}
                        onChange={(newColor) =>
                          handleColorChange(
                            "warning",
                            shade as keyof ColorPalette,
                            newColor
                          )
                        }
                        size="sm"
                      />
                    )
                  )}
                </div>
              </div>

              {/* Error Colors */}
              <div>
                <h4 className="text-md font-medium text-[var(--gray-800)] mb-3">
                  Error
                </h4>
                <div className="space-y-2">
                  {Object.entries(previewTheme.colors.error).map(
                    ([shade, color]: [string, string]) => (
                      <ColorPicker
                        key={`error-${shade}`}
                        label={`Error ${shade}`}
                        value={color}
                        onChange={(newColor) =>
                          handleColorChange(
                            "error",
                            shade as keyof ColorPalette,
                            newColor
                          )
                        }
                        size="sm"
                      />
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Preview */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-[var(--gray-200)] p-6">
            <h3 className="text-lg font-semibold text-[var(--gray-900)] mb-4">
              Live Preview
            </h3>
            <ThemePreview theme={previewTheme} />
          </div>
        </div>
      </div>
    </div>
  );
}
