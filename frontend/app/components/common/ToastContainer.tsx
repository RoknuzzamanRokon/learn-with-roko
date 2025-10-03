"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import Toast, { ToastProps } from "./Toast";

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, "id" | "onClose">) => void;
  hideToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 5,
}) => {
  const [toasts, setToasts] = useState<(ToastProps & { id: string })[]>([]);

  const showToast = useCallback(
    (toast: Omit<ToastProps, "id" | "onClose">) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast = { ...toast, id };

      setToasts((prev) => {
        const updated = [newToast, ...prev];
        return updated.slice(0, maxToasts);
      });
    },
    [maxToasts]
  );

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast, clearAllToasts }}>
      {children}
      <div className="fixed inset-0 pointer-events-none z-50">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => hideToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Convenience functions for different toast types
export const useToastHelpers = () => {
  const { showToast } = useToast();

  return {
    success: (message: string, title?: string, options?: Partial<ToastProps>) =>
      showToast({ type: "success", message, title, ...options }),

    error: (message: string, title?: string, options?: Partial<ToastProps>) =>
      showToast({ type: "error", message, title, ...options }),

    warning: (message: string, title?: string, options?: Partial<ToastProps>) =>
      showToast({ type: "warning", message, title, ...options }),

    info: (message: string, title?: string, options?: Partial<ToastProps>) =>
      showToast({ type: "info", message, title, ...options }),
  };
};
