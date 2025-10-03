"use client";

import { useState, useRef, useEffect } from "react";
import { validateColorAccessibility } from "../../services/themeService";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  size?: "sm" | "md" | "lg";
  showValidation?: boolean;
}

export function ColorPicker({
  label,
  value,
  onChange,
  size = "md",
  showValidation = true,
}: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    contrastRatio?: number;
    warnings: string[];
  } | null>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
    if (showValidation) {
      validateColor(value);
    }
  }, [value, showValidation]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validateColor = async (color: string) => {
    try {
      const result = await validateColorAccessibility(color, "#ffffff");
      setValidationResult(result);
    } catch (err) {
      setValidationResult({
        isValid: false,
        warnings: ["Invalid color format"],
      });
    }
  };

  const handleColorChange = (newColor: string) => {
    setInputValue(newColor);
    onChange(newColor);
    if (showValidation) {
      validateColor(newColor);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setInputValue(newColor);

    // Validate hex color format
    if (/^#[0-9A-F]{6}$/i.test(newColor)) {
      onChange(newColor);
      if (showValidation) {
        validateColor(newColor);
      }
    }
  };

  const handleColorInputClick = () => {
    colorInputRef.current?.click();
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          container: "text-sm",
          colorBox: "w-6 h-6",
          input: "text-xs px-2 py-1",
        };
      case "lg":
        return {
          container: "text-lg",
          colorBox: "w-10 h-10",
          input: "text-base px-4 py-3",
        };
      default:
        return {
          container: "text-base",
          colorBox: "w-8 h-8",
          input: "text-sm px-3 py-2",
        };
    }
  };

  const sizeClasses = getSizeClasses();

  const presetColors = [
    "#2563eb",
    "#1d4ed8",
    "#1e40af",
    "#1e3a8a", // Blues
    "#059669",
    "#047857",
    "#065f46",
    "#064e3b", // Greens
    "#d97706",
    "#b45309",
    "#92400e",
    "#78350f", // Oranges
    "#dc2626",
    "#b91c1c",
    "#991b1b",
    "#7f1d1d", // Reds
    "#7c3aed",
    "#6d28d9",
    "#5b21b6",
    "#4c1d95", // Purples
    "#0d9488",
    "#0f766e",
    "#115e59",
    "#134e4a", // Teals
  ];

  return (
    <div className={`relative ${sizeClasses.container}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-[var(--gray-700)] mb-2">
        {label}
      </label>

      <div className="flex items-center space-x-3">
        {/* Color Preview Box */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`${sizeClasses.colorBox} border-2 border-[var(--gray-300)] rounded-lg cursor-pointer hover:border-[var(--primary-500)] transition-colors flex-shrink-0`}
          style={{ backgroundColor: value }}
          title={`Click to open color picker for ${label}`}
        />

        {/* Hex Input */}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          className={`input-base ${sizeClasses.input} font-mono flex-1`}
          placeholder="#000000"
          maxLength={7}
        />

        {/* Native Color Input (Hidden) */}
        <input
          ref={colorInputRef}
          type="color"
          value={value}
          onChange={(e) => handleColorChange(e.target.value)}
          className="sr-only"
        />

        {/* Color Picker Button */}
        <button
          onClick={handleColorInputClick}
          className="btn-base btn-secondary px-3 py-2 text-sm"
          title="Open system color picker"
        >
          🎨
        </button>
      </div>

      {/* Validation Results */}
      {showValidation && validationResult && (
        <div className="mt-2">
          {validationResult.isValid ? (
            <div className="flex items-center text-xs text-[var(--success-600)]">
              <span className="mr-1">✅</span>
              {validationResult.contrastRatio && (
                <span>
                  Contrast: {validationResult.contrastRatio.toFixed(2)}:1
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs text-[var(--error-600)]">
              <div className="flex items-center">
                <span className="mr-1">⚠️</span>
                <span>Accessibility issues detected</span>
              </div>
              {validationResult.warnings.map((warning, index) => (
                <div key={index} className="ml-4 mt-1">
                  • {warning}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Color Picker Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-[var(--gray-200)] rounded-lg shadow-lg p-4 z-50 min-w-[280px]">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-[var(--gray-700)] mb-2">
              Preset Colors
            </h4>
            <div className="grid grid-cols-8 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  onClick={() => {
                    handleColorChange(color);
                    setIsOpen(false);
                  }}
                  className="w-6 h-6 rounded border border-[var(--gray-300)] hover:border-[var(--primary-500)] transition-colors"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--gray-200)] pt-3">
            <button
              onClick={handleColorInputClick}
              className="w-full btn-base btn-primary text-sm py-2"
            >
              Open Advanced Color Picker
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
