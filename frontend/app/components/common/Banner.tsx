"use client";

import React from "react";

interface BannerProps {
  type?: "success" | "warning" | "error" | "info" | "announcement";
  title?: string;
  message?: string;
  children?: React.ReactNode;
  showIcon?: boolean;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
  position?: "top" | "bottom";
  actionButton?: {
    text: string;
    onClick: () => void;
    variant?: "primary" | "secondary";
  };
}

const Banner: React.FC<BannerProps> = ({
  type = "info",
  title,
  message,
  children,
  showIcon = true,
  closable = true,
  onClose,
  className = "",
  position = "top",
  actionButton,
}) => {
  const typeConfig = {
    success: {
      iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      bgColor: "bg-success-600",
      textColor: "text-white",
      buttonColor: "bg-success-700 hover:bg-success-800",
    },
    warning: {
      iconPath:
        "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z",
      bgColor: "bg-warning-600",
      textColor: "text-white",
      buttonColor: "bg-warning-700 hover:bg-warning-800",
    },
    error: {
      iconPath:
        "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
      bgColor: "bg-error-600",
      textColor: "text-white",
      buttonColor: "bg-error-700 hover:bg-error-800",
    },
    info: {
      iconPath: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      bgColor: "bg-primary-600",
      textColor: "text-white",
      buttonColor: "bg-primary-700 hover:bg-primary-800",
    },
    announcement: {
      iconPath:
        "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
      bgColor: "bg-gray-800",
      textColor: "text-white",
      buttonColor: "bg-gray-700 hover:bg-gray-900",
    },
  };

  const config = typeConfig[type];
  const positionClasses = position === "top" ? "top-0" : "bottom-0";

  return (
    <div
      className={`fixed left-0 right-0 z-40 ${positionClasses} ${config.bgColor} ${config.textColor} ${className}`}
      role="banner"
      aria-live="polite"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center flex-1 min-w-0">
            {showIcon && (
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-white"
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

            <div className={`${showIcon ? "ml-3" : ""} flex-1 min-w-0`}>
              {title && (
                <h3 className="text-sm font-medium text-white mb-1">{title}</h3>
              )}

              {message && (
                <p className="text-sm text-white opacity-90">{message}</p>
              )}

              {children && (
                <div className="text-sm text-white opacity-90">{children}</div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {actionButton && (
              <button
                onClick={actionButton.onClick}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                  actionButton.variant === "secondary"
                    ? "bg-white bg-opacity-20 hover:bg-opacity-30"
                    : config.buttonColor
                }`}
              >
                {actionButton.text}
              </button>
            )}

            {closable && (
              <button
                onClick={onClose}
                className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
                aria-label="Close banner"
              >
                <svg
                  className="w-5 h-5"
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
        </div>
      </div>
    </div>
  );
};

export default Banner;
