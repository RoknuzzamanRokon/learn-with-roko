"use client";

import React from "react";
import { ApiDebug } from "../components/debug/ApiDebug";

export default function DebugPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">API Debug Console</h1>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold mb-4">API Connection Testing</h2>
        <p className="text-gray-600 mb-6">
          Use this page to test and debug API connectivity issues. This is
          especially useful when troubleshooting "Failed to fetch" errors.
        </p>

        <ApiDebug />
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">
          Quick Troubleshooting
        </h3>
        <div className="space-y-2 text-sm text-blue-700">
          <p>
            • <strong>Backend not running:</strong> Start with{" "}
            <code className="bg-blue-100 px-1 rounded">
              python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
            </code>
          </p>
          <p>
            • <strong>CORS issues:</strong> Check browser console for
            CORS-related errors
          </p>
          <p>
            • <strong>Network problems:</strong> Verify localhost:8000 is
            accessible
          </p>
          <p>
            • <strong>Authentication issues:</strong> Clear cookies and login
            again
          </p>
        </div>
      </div>
    </div>
  );
}
