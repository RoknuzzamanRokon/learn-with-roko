"use client";

import React from "react";

interface AlertProps {
  type?: "success" | "warning" | "error" | "info";
  title?: string;
  message?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "filled" | "outlined" | "soft";
}

const Alert: React.FC<AlertProps> = ({
  type = "info",
  title,
  message,
  children,
  showIcon = true,
  closable = false,
  onClose,
  className = "",
  size = "md",
  variant = "soft",
}) => {
  const typeConfig = {
    success: {
      iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      colors: {
        filled: "bg-success-600 text-white border-success-600",
        outlined: "bg-white text-success-700 border-success-300",
        soft: "bg-success-50 text-success-800 border-success-200",
      },
    },
    warning: {
      iconPath:
        "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z",
      colors: {
        filled: "bg-warning-600 text-white border-warning-600",
        outlined: "bg-white text-warning-700 border-warning-300",
        soft: "bg-warning-50 text-warning-800 border-warning-200",
      },
    },
    error: {
      iconPath:
        "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
      colors: {
        filled: "bg-error-600 text-white border-error-600",
        outlined: "bg-white text-error-700 border-error-300",
        soft: "bg-error-50 text-error-800 border-error-200",
      },
    },
    info: {
      iconPath: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      colors: {
        filled: "bg-primary-600 text-white border-primary-600",
        outlined: "bg-white text-primary-700 border-primary-300",
        soft: "bg-primary-50 text-primary-800 border-primary-200",
      },
    },
  };

  const sizeConfig = {
    sm: {
      container: "p-3",
      icon: "w-4 h-4",
      title: "text-sm font-medium",
      content: "text-sm",
    },
    md: {
      container: "p-4",
      icon: "w-5 h-5",
      title: "text-base font-medium",
      content: "text-sm",
    },
    lg: {
      container: "p-6",
      icon: "w-6 h-6",
      title: "text-lg font-medium",
      content: "text-base",
    },
  };

  const config = typeConfig[type];
  const sizeStyles = sizeConfig[size];
  const colorClasses = config.colors[variant];

  return (
    <div
      className={`flex items-start border rounded-lg ${sizeStyles.container} ${colorClasses} ${className}`}
      role="alert"
    >
      {showIcon && (
        <div className="flex-shrink-0">
          <svg
            className={`${sizeStyles.icon} ${
              variant === "filled" ? "text-white" : `text-${type}-600`
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={config.iconPath}
            />
          </svg>
        </div>
      )}

      <div className={`flex-1 ${showIcon ? "ml-3" : ""}`}>
        {title && <h3 className={`${sizeStyles.title} mb-1`}>{title}</h3>}

        {message && <p className={sizeStyles.content}>{message}</p>}

        {children && <div className={sizeStyles.content}>{children}</div>}
      </div>

      {closable && (
        <button
          onClick={onClose}
          className={`flex-shrink-0 ml-3 ${
            variant === "filled"
              ? "text-white hover:text-gray-200"
              : `text-${type}-600 hover:text-${type}-800`
          } transition-colors`}
          aria-label="Close alert"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Alert;
