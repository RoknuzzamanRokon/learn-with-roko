"use client";

import React, { useState, useEffect } from "react";
import { checkApiHealth } from "../../utils/api";

interface ApiStatusProps {
  showWhenHealthy?: boolean;
}

export const ApiStatus: React.FC<ApiStatusProps> = ({
  showWhenHealthy = false,
}) => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      setIsChecking(true);
      try {
        const healthy = await checkApiHealth();
        setIsHealthy(healthy);
      } catch (error) {
        setIsHealthy(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkHealth();

    // Check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Don't show anything while checking initially
  if (isChecking && isHealthy === null) {
    return null;
  }

  // Don't show when healthy unless explicitly requested
  if (isHealthy && !showWhenHealthy) {
    return null;
  }

  return (
    <div
      className={`fixed top-20 right-4 z-50 max-w-sm rounded-lg shadow-lg p-4 ${
        isHealthy
          ? "bg-green-50 border border-green-200"
          : "bg-red-50 border border-red-200"
      }`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {isChecking ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
          ) : isHealthy ? (
            <svg
              className="h-5 w-5 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <div className="ml-3">
          <h3
            className={`text-sm font-medium ${
              isHealthy ? "text-green-800" : "text-red-800"
            }`}
          >
            {isChecking
              ? "Checking API..."
              : isHealthy
              ? "API Connected"
              : "API Disconnected"}
          </h3>
          <div
            className={`mt-1 text-sm ${
              isHealthy ? "text-green-700" : "text-red-700"
            }`}
          >
            {isChecking ? (
              "Verifying backend connection..."
            ) : isHealthy ? (
              "Backend server is running and accessible"
            ) : (
              <div>
                <p className="mb-2">Cannot connect to the backend server.</p>
                <div className="text-xs space-y-1">
                  <p>• Check if the backend is running on port 8000</p>
                  <p>• Verify your network connection</p>
                  <p>• Ensure CORS is properly configured</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook to get API health status
 */
export const useApiHealth = () => {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      setIsChecking(true);
      try {
        const healthy = await checkApiHealth();
        setIsHealthy(healthy);
      } catch (error) {
        setIsHealthy(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return { isHealthy, isChecking };
};
