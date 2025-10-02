"use client";

import React from "react";
import { CertificatesPortfolio } from "../components/dashboard/CertificatesPortfolio";

export default function CertificatesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
          <p className="mt-2 text-gray-600">
            View and manage your earned certificates from completed courses.
          </p>
        </div>

        {/* Certificates Portfolio */}
        <CertificatesPortfolio />
      </div>
    </div>
  );
}
