"use client";

import React from "react";
import { CertificateVerification } from "../components/common/CertificateVerification";

export default function VerifyCertificatePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Certificate Verification
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl mx-auto">
            Verify the authenticity of certificates issued by our learning
            platform. Enter the verification code found on any certificate to
            confirm its validity.
          </p>
        </div>

        {/* Certificate Verification Component */}
        <CertificateVerification />

        {/* Additional Information */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              About Certificate Verification
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">How it works</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Each certificate has a unique verification code</li>
                  <li>• Codes are generated when certificates are issued</li>
                  <li>• Verification is instant and secure</li>
                  <li>• All certificates are digitally signed</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  What you'll see
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Student name and course details</li>
                  <li>• Instructor information</li>
                  <li>• Issue date and certificate ID</li>
                  <li>• Verification status</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
