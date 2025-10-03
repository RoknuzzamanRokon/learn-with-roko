"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { ThemeConfig } from "../types/theme";
import { ThemeManager } from "../services/themeService";

interface ThemeContextType {
  currentTheme: ThemeConfig | null;
  isLoading: boolean;
  error: string | null;
  switchTheme: (themeId: string) => Promise<void>;
  updateTheme: (theme: ThemeConfig) => Promise<void>;
  previewTheme: (theme: ThemeConfig) => void;
  clearPreview: () => Promise<void>;
  resetToDefault: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeTheme();
  }, []);

  const initializeTheme = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize theme system
      await ThemeManager.initialize();

      // Load current theme
      const theme = await ThemeManager.getCurrentTheme();
      setCurrentTheme(theme);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to initialize theme";
      setError(errorMessage);
      console.error("Theme initialization error:", err);

      // Fallback to default theme
      try {
        const defaultTheme = await ThemeManager.getDefaultTheme();
        setCurrentTheme(defaultTheme);
        ThemeManager.applyTheme(defaultTheme);
      } catch (fallbackErr) {
        console.error("Failed to load default theme:", fallbackErr);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchTheme = async (themeId: string) => {
    try {
      setError(null);
      await ThemeManager.switchTheme(themeId);

      // Reload current theme to reflect changes
      const updatedTheme = await ThemeManager.getCurrentTheme();
      setCurrentTheme(updatedTheme);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to switch theme";
      setError(errorMessage);
      throw err;
    }
  };

  const updateTheme = async (theme: ThemeConfig) => {
    try {
      setError(null);
      await ThemeManager.saveTheme(theme);
      setCurrentTheme(theme);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update theme";
      setError(errorMessage);
      throw err;
    }
  };

  const previewTheme = (theme: ThemeConfig) => {
    try {
      ThemeManager.applyThemePreview(theme);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to preview theme";
      setError(errorMessage);
      console.error("Theme preview error:", err);
    }
  };

  const clearPreview = async () => {
    try {
      setError(null);
      await ThemeManager.clearPreview();

      // Reload current theme
      const theme = await ThemeManager.getCurrentTheme();
      setCurrentTheme(theme);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to clear preview";
      setError(errorMessage);
      throw err;
    }
  };

  const resetToDefault = async () => {
    try {
      setError(null);
      const defaultTheme = await ThemeManager.getDefaultTheme();
      await ThemeManager.saveTheme(defaultTheme);
      setCurrentTheme(defaultTheme);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to reset theme";
      setError(errorMessage);
      throw err;
    }
  };

  const value: ThemeContextType = {
    currentTheme,
    isLoading,
    error,
    switchTheme,
    updateTheme,
    previewTheme,
    clearPreview,
    resetToDefault,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
