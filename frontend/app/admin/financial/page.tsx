"use client";

import React from "react";
import { useAuth } from "../../contexts/AuthContext";
import FinancialDashboard from "../../components/admin/FinancialDashboard";

export default function FinancialPage() {
  const { user } = useAuth();

  // Check if user has admin permissions
  if (!user || user.role !== "super_admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FinancialDashboard />
      </div>
    </div>
  );
}
