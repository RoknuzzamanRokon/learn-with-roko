"use client";

import React, { useState } from "react";

interface ColorSwatch {
  name: string;
  variable: string;
  hex: string;
  usage: string;
}

interface ColorGroup {
  name: string;
  description: string;
  colors: ColorSwatch[];
}

export function ColorPalette() {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const colorGroups: ColorGroup[] = [
    {
      name: "Primary Brand Colors",
      description:
        "Core brand colors used for primary actions, links, and brand elements",
      colors: [
        {
          name: "Primary 50",
          variable: "--primary-50",
          hex: "#eff6ff",
          usage: "Light backgrounds, subtle highlights",
        },
        {
          name: "Primary 100",
          variable: "--primary-100",
          hex: "#dbeafe",
          usage: "Hover states for light elements",
        },
        {
          name: "Primary 200",
          variable: "--primary-200",
          hex: "#bfdbfe",
          usage: "Disabled states, light borders",
        },
        {
          name: "Primary 300",
          variable: "--primary-300",
          hex: "#93c5fd",
          usage: "Secondary elements, light accents",
        },
        {
          name: "Primary 400",
          variable: "--primary-400",
          hex: "#60a5fa",
          usage: "Interactive elements, medium emphasis",
        },
        {
          name: "Primary 500",
          variable: "--primary-500",
          hex: "#3b82f6",
          usage: "Default primary color, buttons",
        },
        {
          name: "Primary 600",
          variable: "--primary-600",
          hex: "#2563eb",
          usage: "Main brand color, primary actions",
        },
        {
          name: "Primary 700",
          variable: "--primary-700",
          hex: "#1d4ed8",
          usage: "Hover states, pressed buttons",
        },
        {
          name: "Primary 800",
          variable: "--primary-800",
          hex: "#1e40af",
          usage: "Active states, dark themes",
        },
        {
          name: "Primary 900",
          variable: "--primary-900",
          hex: "#1e3a8a",
          usage: "High contrast, dark backgrounds",
        },
      ],
    },
    {
      name: "Neutral Colors",
      description:
        "Grayscale colors for text, backgrounds, borders, and general UI elements",
      colors: [
        {
          name: "White",
          variable: "--white",
          hex: "#ffffff",
          usage: "Card backgrounds, primary text on dark",
        },
        {
          name: "Gray 50",
          variable: "--gray-50",
          hex: "#f9fafb",
          usage: "Page backgrounds, subtle containers",
        },
        {
          name: "Gray 100",
          variable: "--gray-100",
          hex: "#f3f4f6",
          usage: "Card backgrounds, input backgrounds",
        },
        {
          name: "Gray 200",
          variable: "--gray-200",
          hex: "#e5e7eb",
          usage: "Borders, dividers, disabled elements",
        },
        {
          name: "Gray 300",
          variable: "--gray-300",
          hex: "#d1d5db",
          usage: "Input borders, subtle dividers",
        },
        {
          name: "Gray 400",
          variable: "--gray-400",
          hex: "#9ca3af",
          usage: "Placeholder text, secondary icons",
        },
        {
          name: "Gray 500",
          variable: "--gray-500",
          hex: "#6b7280",
          usage: "Secondary text, form labels",
        },
        {
          name: "Gray 600",
          variable: "--gray-600",
          hex: "#4b5563",
          usage: "Body text, primary content",
        },
        {
          name: "Gray 700",
          variable: "--gray-700",
          hex: "#374151",
          usage: "Headings, emphasized text",
        },
        {
          name: "Gray 800",
          variable: "--gray-800",
          hex: "#1f2937",
          usage: "Primary headings, high emphasis",
        },
        {
          name: "Gray 900",
          variable: "--gray-900",
          hex: "#111827",
          usage: "Highest contrast text, titles",
        },
      ],
    },
    {
      name: "Success Colors",
      description:
        "Green colors for positive states, completed actions, and success messages",
      colors: [
        {
          name: "Success 50",
          variable: "--success-50",
          hex: "#ecfdf5",
          usage: "Success message backgrounds",
        },
        {
          name: "Success 100",
          variable: "--success-100",
          hex: "#d1fae5",
          usage: "Light success indicators",
        },
        {
          name: "Success 500",
          variable: "--success-500",
          hex: "#10b981",
          usage: "Success icons, progress bars",
        },
        {
          name: "Success 600",
          variable: "--success-600",
          hex: "#059669",
          usage: "Success buttons, completed states",
        },
        {
          name: "Success 700",
          variable: "--success-700",
          hex: "#047857",
          usage: "Success button hover states",
        },
        {
          name: "Success 900",
          variable: "--success-900",
          hex: "#064e3b",
          usage: "Success text on light backgrounds",
        },
      ],
    },
    {
      name: "Warning Colors",
      description:
        "Orange/yellow colors for caution states, pending actions, and warning messages",
      colors: [
        {
          name: "Warning 50",
          variable: "--warning-50",
          hex: "#fffbeb",
          usage: "Warning message backgrounds",
        },
        {
          name: "Warning 100",
          variable: "--warning-100",
          hex: "#fef3c7",
          usage: "Light warning indicators",
        },
        {
          name: "Warning 500",
          variable: "--warning-500",
          hex: "#f59e0b",
          usage: "Warning icons, pending states",
        },
        {
          name: "Warning 600",
          variable: "--warning-600",
          hex: "#d97706",
          usage: "Warning buttons, caution actions",
        },
        {
          name: "Warning 700",
          variable: "--warning-700",
          hex: "#b45309",
          usage: "Warning button hover states",
        },
        {
          name: "Warning 900",
          variable: "--warning-900",
          hex: "#78350f",
          usage: "Warning text on light backgrounds",
        },
      ],
    },
    {
      name: "Error Colors",
      description:
        "Red colors for error states, destructive actions, and error messages",
      colors: [
        {
          name: "Error 50",
          variable: "--error-50",
          hex: "#fef2f2",
          usage: "Error message backgrounds",
        },
        {
          name: "Error 100",
          variable: "--error-100",
          hex: "#fee2e2",
          usage: "Light error indicators",
        },
        {
          name: "Error 500",
          variable: "--error-500",
          hex: "#ef4444",
          usage: "Error icons, validation errors",
        },
        {
          name: "Error 600",
          variable: "--error-600",
          hex: "#dc2626",
          usage: "Error buttons, destructive actions",
        },
        {
          name: "Error 700",
          variable: "--error-700",
          hex: "#b91c1c",
          usage: "Error button hover states",
        },
        {
          name: "Error 900",
          variable: "--error-900",
          hex: "#7f1d1d",
          usage: "Error text on light backgrounds",
        },
      ],
    },
    {
      name: "Accent Colors",
      description:
        "Special accent colors for highlights, features, and visual interest",
      colors: [
        {
          name: "Purple 500",
          variable: "--accent-purple-500",
          hex: "#8b5cf6",
          usage: "Special features, premium content",
        },
        {
          name: "Purple 600",
          variable: "--accent-purple-600",
          hex: "#7c3aed",
          usage: "Purple accents, special actions",
        },
        {
          name: "Teal 500",
          variable: "--accent-teal-500",
          hex: "#14b8a6",
          usage: "Highlights, featured content",
        },
        {
          name: "Teal 600",
          variable: "--accent-teal-600",
          hex: "#0d9488",
          usage: "Teal accents, secondary features",
        },
      ],
    },
  ];

  const copyToClipboard = async (text: string, colorName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedColor(colorName);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Color Palette</h2>
        <p className="text-gray-600 mb-8">
          Complete color system with CSS custom properties and usage guidelines.
          Click on any color to copy its CSS variable or hex value.
        </p>
      </div>

      {colorGroups.map((group) => (
        <section key={group.name} className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {group.name}
            </h3>
            <p className="text-gray-600">{group.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {group.colors.map((color) => (
              <div
                key={color.name}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Color Swatch */}
                <div
                  className="h-20 cursor-pointer relative group"
                  style={{ backgroundColor: `var(${color.variable})` }}
                  onClick={() =>
                    copyToClipboard(`var(${color.variable})`, color.name)
                  }
                >
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                      Click to copy
                    </span>
                  </div>
                </div>

                {/* Color Info */}
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{color.name}</h4>
                    {copiedColor === color.name && (
                      <span className="text-xs text-success-600 font-medium">
                        Copied!
                      </span>
                    )}
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          `var(${color.variable})`,
                          `${color.name}-var`
                        )
                      }
                      className="block w-full text-left text-sm text-gray-600 hover:text-primary-600 transition-colors"
                    >
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        var({color.variable})
                      </code>
                    </button>

                    <button
                      onClick={() =>
                        copyToClipboard(color.hex, `${color.name}-hex`)
                      }
                      className="block w-full text-left text-sm text-gray-600 hover:text-primary-600 transition-colors"
                    >
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {color.hex}
                      </code>
                    </button>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">{color.usage}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Color Usage Examples */}
      <section className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Color Usage Examples
          </h3>
          <p className="text-gray-600">
            See how colors work together in real UI components
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Text Color Examples */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-4">
              Text Color Hierarchy
            </h4>
            <div className="space-y-3">
              <p className="text-gray-900 text-lg font-semibold">
                Primary Heading (Gray 900)
              </p>
              <p className="text-gray-800 text-base font-medium">
                Secondary Heading (Gray 800)
              </p>
              <p className="text-gray-700 text-base">
                Emphasized Text (Gray 700)
              </p>
              <p className="text-gray-600 text-base">Body Text (Gray 600)</p>
              <p className="text-gray-500 text-sm">Secondary Text (Gray 500)</p>
              <p className="text-gray-400 text-sm">
                Placeholder Text (Gray 400)
              </p>
            </div>
          </div>

          {/* Status Color Examples */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-4">Status Colors</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-success-500 rounded-full"></div>
                <span className="text-success-700">Success State</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-warning-500 rounded-full"></div>
                <span className="text-warning-700">Warning State</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-error-500 rounded-full"></div>
                <span className="text-error-700">Error State</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-primary-500 rounded-full"></div>
                <span className="text-primary-700">Primary Action</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
