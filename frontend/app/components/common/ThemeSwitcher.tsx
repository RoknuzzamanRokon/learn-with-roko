"use client";

import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext";

interface ThemeSwitcherProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeSwitcher({
  className = "",
  showLabel = true,
}: ThemeSwitcherProps) {
  const { currentTheme, switchTheme, isLoading } = useTheme();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleThemeSwitch = async (themeId: string) => {
    if (isSwitching || isLoading) return;

    try {
      setIsSwitching(true);
      await switchTheme(themeId);
    } catch (error) {
      console.error("Failed to switch theme:", error);
    } finally {
      setIsSwitching(false);
    }
  };

  const availableThemes = [
    { id: "default", name: "Default", description: "Standard LMS theme" },
    // In a real implementation, this would be loaded from an API
  ];

  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showLabel && (
          <span className="text-sm text-[var(--gray-600)]">Theme:</span>
        )}
        <div className="animate-pulse bg-[var(--gray-200)] rounded px-3 py-1 w-20 h-6"></div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showLabel && (
        <span className="text-sm text-[var(--gray-600)]">Theme:</span>
      )}
      <select
        value={currentTheme?.id || "default"}
        onChange={(e) => handleThemeSwitch(e.target.value)}
        disabled={isSwitching}
        className="input-base text-sm py-1 px-2 min-w-[120px]"
      >
        {availableThemes.map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.name}
          </option>
        ))}
      </select>
      {isSwitching && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--primary-600)]"></div>
      )}
    </div>
  );
}

interface QuickThemeSwitcherProps {
  className?: string;
}

export function QuickThemeSwitcher({
  className = "",
}: QuickThemeSwitcherProps) {
  const { currentTheme, resetToDefault, isLoading } = useTheme();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetToDefault = async () => {
    if (isResetting || isLoading) return;

    try {
      setIsResetting(true);
      await resetToDefault();
    } catch (error) {
      console.error("Failed to reset theme:", error);
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading || !currentTheme) {
    return null;
  }

  // Only show if not already using default theme
  if (currentTheme.id === "default") {
    return null;
  }

  return (
    <button
      onClick={handleResetToDefault}
      disabled={isResetting}
      className={`btn-base btn-secondary text-xs px-2 py-1 ${className}`}
      title="Reset to default theme"
    >
      {isResetting ? (
        <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
      ) : (
        "🎨 Reset Theme"
      )}
    </button>
  );
}
