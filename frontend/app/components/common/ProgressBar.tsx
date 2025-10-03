"use client";

import React from "react";

interface ProgressBarProps {
  progress: number; // 0-100
  size?: "sm" | "md" | "lg";
  color?: "primary" | "success" | "warning" | "error";
  showLabel?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  size = "md",
  color = "primary",
  showLabel = false,
  label,
  className = "",
  animated = false,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, progress));

  const sizeClasses = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  const colorClasses = {
    primary: "bg-primary-600",
    success: "bg-success-600",
    warning: "bg-warning-600",
    error: "bg-error-600",
  };

  const backgroundClasses = {
    primary: "bg-primary-100",
    success: "bg-success-100",
    warning: "bg-warning-100",
    error: "bg-error-100",
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">
            {label || "Progress"}
          </span>
          <span className="text-sm font-medium text-gray-700">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
      <div
        className={`w-full rounded-full ${backgroundClasses[color]} ${sizeClasses[size]}`}
        role="progressbar"
        aria-valuenow={clampedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `Progress: ${Math.round(clampedProgress)}%`}
      >
        <div
          className={`${
            sizeClasses[size]
          } rounded-full transition-all duration-300 ease-out ${
            colorClasses[color]
          } ${animated ? "animate-pulse" : ""}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
