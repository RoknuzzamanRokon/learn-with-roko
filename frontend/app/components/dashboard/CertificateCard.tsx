"use client";

import React from "react";
import { CertificateWithDetails } from "../../types/certificate";
import { certificateService } from "../../services/certificateService";

interface CertificateCardProps {
  certificate: CertificateWithDetails;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  certificate,
}) => {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await certificateService.downloadCertificateFile(
        certificate.certificate_id,
        `${certificate.course_title.replace(
          /[^a-zA-Z0-9]/g,
          "_"
        )}_Certificate.pdf`
      );
    } catch (error) {
      console.error("Error downloading certificate:", error);
      alert("Failed to download certificate. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Certificate Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {certificate.course_title}
          </h3>
          <p className="text-sm text-gray-600">
            Instructor: {certificate.instructor_name}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {certificate.is_verified && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Verified
            </span>
          )}
        </div>
      </div>

      {/* Certificate Details */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Issued Date:</span>
          <span className="text-gray-900">
            {formatDate(certificate.issued_at)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Certificate ID:</span>
          <span className="text-gray-900 font-mono text-xs">
            {certificate.certificate_id}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Verification Code:</span>
          <span className="text-gray-900 font-mono text-xs">
            {certificate.verification_code}
          </span>
        </div>
      </div>

      {/* Description */}
      {certificate.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {certificate.description}
        </p>
      )}

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isDownloading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Downloading...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download PDF
            </span>
          )}
        </button>

        <button
          onClick={() => {
            navigator.clipboard.writeText(certificate.verification_code);
            alert("Verification code copied to clipboard!");
          }}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Copy Code
        </button>
      </div>

      {/* Expiration Warning */}
      {certificate.expires_at &&
        new Date(certificate.expires_at) < new Date() && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-800">
              ⚠️ This certificate expired on{" "}
              {formatDate(certificate.expires_at)}
            </p>
          </div>
        )}
    </div>
  );
};
