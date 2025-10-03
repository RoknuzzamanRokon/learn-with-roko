"use client";

import React from "react";

interface SkeletonLoaderProps {
  variant?: "text" | "rectangular" | "circular" | "card";
  width?: string | number;
  height?: string | number;
  lines?: number; // For text variant
  className?: string;
  animated?: boolean;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = "rectangular",
  width,
  height,
  lines = 1,
  className = "",
  animated = true,
}) => {
  const baseClasses = `bg-gray-200 ${animated ? "animate-pulse" : ""}`;

  const getVariantClasses = () => {
    switch (variant) {
      case "text":
        return "rounded h-4";
      case "circular":
        return "rounded-full";
      case "rectangular":
        return "rounded";
      case "card":
        return "rounded-lg";
      default:
        return "rounded";
    }
  };

  const getStyle = () => {
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === "number" ? `${width}px` : width;
    if (height)
      style.height = typeof height === "number" ? `${height}px` : height;
    return style;
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()} ${
              index === lines - 1 ? "w-3/4" : "w-full"
            }`}
            style={{ height: height || "1rem" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={getStyle()}
      role="status"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Predefined skeleton components for common use cases
export const SkeletonCard: React.FC<{ className?: string }> = ({
  className = "",
}) => (
  <div
    className={`p-6 bg-white rounded-lg border border-gray-200 ${className}`}
  >
    <div className="animate-pulse">
      <SkeletonLoader variant="rectangular" height="12rem" className="mb-4" />
      <SkeletonLoader variant="text" lines={2} className="mb-3" />
      <div className="flex items-center space-x-3">
        <SkeletonLoader variant="circular" width="2rem" height="2rem" />
        <SkeletonLoader variant="text" width="6rem" />
      </div>
    </div>
  </div>
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({
  items = 3,
  className = "",
}) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: items }).map((_, index) => (
      <div
        key={index}
        className="flex items-center space-x-4 p-4 bg-white rounded-lg border border-gray-200"
      >
        <SkeletonLoader variant="circular" width="3rem" height="3rem" />
        <div className="flex-1">
          <SkeletonLoader variant="text" className="mb-2" />
          <SkeletonLoader variant="text" width="60%" />
        </div>
      </div>
    ))}
  </div>
);

export default SkeletonLoader;
