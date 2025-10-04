"use client";

import React, { useState, useEffect } from "react";
import { checkApiHealth, API_BASE_URL } from "../../utils/api";

export const ApiDebug: React.FC = () => {
  const [results, setResults] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState<string>("Loading...");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Set the current origin only on the client side to avoid hydration mismatch
    setCurrentOrigin(window.location.origin);
    setIsMounted(true);
  }, []);

  // Don't render on server side to avoid hydration issues
  if (!isMounted) {
    return null;
  }

  const testDirectFetch = async () => {
    setIsLoading(true);
    setResults("Testing direct fetch...\n");

    try {
      // Test 1: Health endpoint
      setResults((prev) => prev + "Test 1: Health endpoint\n");
      const healthResponse = await fetch("http://localhost:8000/health");
      const healthData = await healthResponse.json();
      setResults(
        (prev) => prev + `✅ Health: ${JSON.stringify(healthData)}\n\n`
      );

      // Test 2: Categories endpoint
      setResults((prev) => prev + "Test 2: Categories endpoint\n");
      const categoriesResponse = await fetch(
        "http://localhost:8000/api/courses/categories"
      );
      const categoriesData = await categoriesResponse.json();
      setResults(
        (prev) => prev + `✅ Categories: ${categoriesData.length} items\n\n`
      );

      // Test 3: API health check function
      setResults((prev) => prev + "Test 3: API health check function\n");
      const healthCheck = await checkApiHealth();
      setResults((prev) => prev + `Health check result: ${healthCheck}\n\n`);

      setResults((prev) => prev + "✅ All tests passed!\n");
    } catch (error) {
      setResults((prev) => prev + `❌ Error: ${error.message}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  const testWithCORS = async () => {
    setIsLoading(true);
    setResults("Testing with CORS headers...\n");

    try {
      const response = await fetch(
        "http://localhost:8000/api/courses/categories",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Origin: "http://localhost:3000",
          },
          mode: "cors",
        }
      );

      const data = await response.json();
      setResults(
        (prev) => prev + `✅ CORS test passed: ${data.length} categories\n`
      );
    } catch (error) {
      setResults((prev) => prev + `❌ CORS test failed: ${error.message}\n`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md">
      <h3 className="text-lg font-semibold mb-3">API Debug Panel</h3>

      <div className="space-y-2 mb-4">
        <p className="text-sm">
          <strong>API Base URL:</strong> {API_BASE_URL}
        </p>
        <p className="text-sm">
          <strong>Current Origin:</strong> {currentOrigin}
        </p>
      </div>

      <div className="space-y-2 mb-4">
        <button
          onClick={testDirectFetch}
          disabled={isLoading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
        >
          {isLoading ? "Testing..." : "Test Direct Fetch"}
        </button>

        <button
          onClick={testWithCORS}
          disabled={isLoading}
          className="w-full bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded text-sm disabled:opacity-50"
        >
          {isLoading ? "Testing..." : "Test CORS"}
        </button>
      </div>

      {results && (
        <div className="bg-gray-100 p-3 rounded text-xs font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
          {results}
        </div>
      )}
    </div>
  );
};
