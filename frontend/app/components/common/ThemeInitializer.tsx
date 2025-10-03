"use client";

import { useEffect } from "react";
import { ThemeManager } from "../../services/themeService";

export function ThemeInitializer() {
  useEffect(() => {
    // Initialize theme system when the app loads
    ThemeManager.initialize().catch((error) => {
      console.error("Failed to initialize theme system:", error);
    });
  }, []);

  // This component doesn't render anything
  return null;
}
