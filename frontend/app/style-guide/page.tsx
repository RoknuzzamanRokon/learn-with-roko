"use client";

import React, { useState } from "react";
import { ColorPalette } from "./components/ColorPalette";
import { ComponentShowcase } from "./components/ComponentShowcase";
import { UsageGuidelines } from "./components/UsageGuidelines";
import { AccessibilityDemo } from "./components/AccessibilityDemo";
import { DocumentationGenerator } from "./components/DocumentationGenerator";

export default function StyleGuidePage() {
  const [activeTab, setActiveTab] = useState("colors");

  const tabs = [
    { id: "colors", label: "Color Palette", component: ColorPalette },
    { id: "components", label: "Components", component: ComponentShowcase },
    { id: "guidelines", label: "Usage Guidelines", component: UsageGuidelines },
    {
      id: "accessibility",
      label: "Accessibility",
      component: AccessibilityDemo,
    },
    {
      id: "documentation",
      label: "Documentation Generator",
      component: DocumentationGenerator,
    },
  ];

  const ActiveComponent =
    tabs.find((tab) => tab.id === activeTab)?.component || ColorPalette;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              LMS Design System Style Guide
            </h1>
            <p className="mt-2 text-gray-600">
              Interactive documentation for the Learning Management System color
              palette and components
            </p>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-primary-600 text-primary-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ActiveComponent />
      </main>
    </div>
  );
}
