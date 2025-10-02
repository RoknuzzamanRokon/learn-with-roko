"use client";

import React, { useState } from "react";
import { CertificateVerification as CertificateVerificationType } from "../../types/certificate";
import { certificateService } from "../../services/certificateService";

export const CertificateVerification: React.FC = () => {
  const [verificationCode, setVerificationCode] = useState("");
  const [verification, setVerification] =
    useState<CertificateVerificationType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      setError("Please enter a verification code");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await certificateService.verifyCertificate(
        verificationCode.trim()
      );
      setVerification(result);
    } catch (err) {
      setError(
        "Failed to verify certificate. Please check the code and try again."
      );
      console.error("Error verifying certificate:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setVerificationCode("");
    setVerification(null);
    setError(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="text-blue-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Certificate Verification
          </h2>
          <p className="text-gray-600">
            Enter a verification code to validate a certificate's authenticity
          </p>
        </div>

        {!verification ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label
                htmlFor="verificationCode"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Verification Code
              </label>
              <input
                type="text"
                id="verificationCode"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(e.target.value.toUpperCase())
                }
                placeholder="Enter verification code (e.g., DDEF32CCF0944715)"
                className="w-full px-4 py-3 border border-gray-300 rounded-md text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={16}
              />
              <p className="text-xs text-gray-500 mt-1">
                The verification code can be found on the certificate document
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
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
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !verificationCode.trim()}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Verifying...
                </span>
              ) : (
                "Verify Certificate"
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            {verification.valid ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-8 w-8 text-green-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-green-800">
                      Certificate Verified ✓
                    </h3>
                    <p className="text-sm text-green-700">
                      {verification.message}
                    </p>
                  </div>
                </div>

                {verification.certificate && (
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Certificate Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Student:</span>
                        <p className="font-medium text-gray-900">
                          {verification.certificate.user_name}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Course:</span>
                        <p className="font-medium text-gray-900">
                          {verification.certificate.course_title}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Instructor:</span>
                        <p className="font-medium text-gray-900">
                          {verification.certificate.instructor_name}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Issue Date:</span>
                        <p className="font-medium text-gray-900">
                          {formatDate(verification.certificate.issued_at)}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-gray-500">Certificate ID:</span>
                        <p className="font-mono text-sm text-gray-900">
                          {verification.certificate.certificate_id}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-8 w-8 text-red-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-red-800">
                      Certificate Not Valid
                    </h3>
                    <p className="text-sm text-red-700">
                      {verification.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <button
                onClick={handleReset}
                className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Verify Another Certificate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
