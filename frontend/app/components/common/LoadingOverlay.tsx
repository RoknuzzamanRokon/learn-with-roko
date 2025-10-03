"use client";

import React from "react";
import LoadingSpinner from "./LoadingSpinner";

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  size?: "sm" | "md" | "lg" | "xl";
  color?: "primary" | "secondary" | "success" | "warning" | "error";
  backdrop?: "light" | "dark" | "blur";
  className?: string;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isVisible,
  message = "Loading...",
  size = "lg",
  color = "primary",
  backdrop = "light",
  className = "",
}) => {
  if (!isVisible) return null;

  const backdropClasses = {
    light: "bg-white bg-opacity-80",
    dark: "bg-gray-900 bg-opacity-50",
    blur: "bg-white bg-opacity-70 backdrop-blur-sm",
  };

  const textColorClasses = {
    light: "text-gray-700",
    dark: "text-white",
    blur: "text-gray-700",
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${backdropClasses[backdrop]} ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size={size} color={color} />
        {message && (
          <p className={`text-sm font-medium ${textColorClasses[backdrop]}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

// Component for inline loading states
export const InlineLoader: React.FC<{
  message?: string;
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "success" | "warning" | "error";
  className?: string;
}> = ({
  message = "Loading...",
  size = "md",
  color = "primary",
  className = "",
}) => (
  <div
    className={`flex items-center justify-center space-x-3 p-4 ${className}`}
  >
    <LoadingSpinner size={size} color={color} />
    <span className="text-sm font-medium text-gray-600">{message}</span>
  </div>
);

// Component for button loading states
export const ButtonLoader: React.FC<{
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({
  isLoading,
  children,
  loadingText = "Loading...",
  size = "sm",
  className = "",
}) => (
  <div className={`flex items-center justify-center space-x-2 ${className}`}>
    {isLoading && <LoadingSpinner size={size} color="secondary" />}
    <span>{isLoading ? loadingText : children}</span>
  </div>
);

export default LoadingOverlay;
