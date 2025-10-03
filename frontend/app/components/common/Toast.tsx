"use client";

import React, { useEffect, useState } from "react";

export interface ToastProps {
  id?: string;
  type?: "success" | "warning" | "error" | "info";
  title?: string;
  message: string;
  duration?: number; // in milliseconds, 0 for persistent
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
  showIcon?: boolean;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type = "info",
  title,
  message,
  duration = 5000,
  position = "top-right",
  showIcon = true,
  closable = true,
  onClose,
  className = "",
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300); // Animation duration
  };

  if (!isVisible) return null;

  const typeStyles = {
    success: {
      container: "bg-success-50 border-success-200 text-success-800",
      icon: "text-success-600",
      iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    warning: {
      container: "bg-warning-50 border-warning-200 text-warning-800",
      icon: "text-warning-600",
      iconPath:
        "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z",
    },
    error: {
      container: "bg-error-50 border-error-200 text-error-800",
      icon: "text-error-600",
      iconPath:
        "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
    },
    info: {
      container: "bg-primary-50 border-primary-200 text-primary-800",
      icon: "text-primary-600",
      iconPath: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
  };

  const positionStyles = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-center": "top-4 left-1/2 transform -translate-x-1/2",
    "bottom-center": "bottom-4 left-1/2 transform -translate-x-1/2",
  };

  const currentStyle = typeStyles[type];

  return (
    <div
      className={`fixed z-50 max-w-sm w-full ${positionStyles[position]} ${
        isExiting ? "animate-fade-out" : "animate-fade-in"
      } ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div
        className={`flex items-start p-4 border rounded-lg shadow-lg ${currentStyle.container}`}
      >
        {showIcon && (
          <div className={`flex-shrink-0 ${currentStyle.icon}`}>
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
                d={currentStyle.iconPath}
              />
            </svg>
          </div>
        )}

        <div className={`flex-1 ${showIcon ? "ml-3" : ""}`}>
          {title && <h4 className="text-sm font-semibold mb-1">{title}</h4>}
          <p className="text-sm">{message}</p>
        </div>

        {closable && (
          <button
            onClick={handleClose}
            className={`flex-shrink-0 ml-3 ${currentStyle.icon} hover:opacity-75 transition-opacity`}
            aria-label="Close notification"
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
    </div>
  );
};

export default Toast;
