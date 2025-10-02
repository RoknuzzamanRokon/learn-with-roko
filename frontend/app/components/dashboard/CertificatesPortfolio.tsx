"use client";

import React, { useState, useEffect } from "react";
import { CertificateWithDetails } from "../../types/certificate";
import { certificateService } from "../../services/certificateService";
import { CertificateCard } from "./CertificateCard";

export const CertificatesPortfolio: React.FC = () => {
  const [certificates, setCertificates] = useState<CertificateWithDetails[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "course" | "instructor">(
    "date"
  );

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await certificateService.getMyCertificates();
      setCertificates(data);
    } catch (err) {
      setError("Failed to load certificates. Please try again.");
      console.error("Error fetching certificates:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedCertificates = React.useMemo(() => {
    let filtered = certificates;

    // Filter by search term
    if (searchTerm) {
      filtered = certificates.filter(
        (cert) =>
          cert.course_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cert.instructor_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          cert.certificate_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort certificates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return (
            new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime()
          );
        case "course":
          return a.course_title.localeCompare(b.course_title);
        case "instructor":
          return a.instructor_name.localeCompare(b.instructor_name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [certificates, searchTerm, sortBy]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Certificates
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchCertificates}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              My Certificates
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {certificates.length} certificate
              {certificates.length !== 1 ? "s" : ""} earned
            </p>
          </div>

          {certificates.length > 0 && (
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search certificates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "date" | "course" | "instructor")
                }
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">Sort by Date</option>
                <option value="course">Sort by Course</option>
                <option value="instructor">Sort by Instructor</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {certificates.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Certificates Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Complete courses to earn certificates and showcase your
              achievements.
            </p>
            <a
              href="/catalog"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Browse Courses
            </a>
          </div>
        ) : filteredAndSortedCertificates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">
              No certificates match your search criteria.
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedCertificates.map((certificate) => (
              <CertificateCard key={certificate.id} certificate={certificate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
