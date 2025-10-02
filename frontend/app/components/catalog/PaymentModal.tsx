"use client";

import React, { useState } from "react";
import { Course } from "../../types/course";
import { enrollmentService } from "../../services/enrollmentService";

interface PaymentModalProps {
  course: Course;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  course,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<
    "details" | "processing" | "success"
  >("details");

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setPaymentStep("processing");

      // Create payment intent
      const paymentIntent = await enrollmentService.createPaymentIntent({
        course_id: course.id,
      });

      // Simulate payment processing (in real implementation, this would use Stripe)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock successful payment - extract payment intent ID from client secret
      const paymentIntentId = paymentIntent.client_secret.replace(
        "_secret",
        ""
      );

      // Enroll user after successful payment
      await enrollmentService.enrollWithPayment(
        { course_id: course.id },
        paymentIntentId
      );

      setPaymentStep("success");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Payment failed:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Payment failed. Please try again."
      );
      setPaymentStep("details");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {paymentStep === "success"
              ? "Payment Successful!"
              : "Complete Your Purchase"}
          </h2>
          {paymentStep !== "processing" && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {paymentStep === "details" && (
            <>
              {/* Course Summary */}
              <div className="mb-6">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg">
                        <span className="text-white text-lg font-semibold">
                          {course.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {course.total_lectures} lectures •{" "}
                      {Math.floor(course.total_duration / 60)}h{" "}
                      {course.total_duration % 60}m
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Course Price:</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatPrice(course.price)}
                  </span>
                </div>
              </div>

              {/* Mock Payment Form */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">
                  Payment Information
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="4242 4242 4242 4242"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      disabled={isProcessing}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={isProcessing}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVC
                      </label>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This is a demo. Use any test card details.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium transition-colors duration-200"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-md font-medium transition-colors duration-200"
                >
                  {isProcessing
                    ? "Processing..."
                    : `Pay ${formatPrice(course.price)}`}
                </button>
              </div>
            </>
          )}

          {paymentStep === "processing" && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Processing Payment
              </h3>
              <p className="text-gray-600">
                Please wait while we process your payment...
              </p>
            </div>
          )}

          {paymentStep === "success" && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Payment Successful!
              </h3>
              <p className="text-gray-600">
                You have been enrolled in the course. Redirecting...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
