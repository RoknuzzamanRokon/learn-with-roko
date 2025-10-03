"use client";

import React, { useState } from "react";
import { DESIGN_SYSTEM_CLASSES } from "../../../src/styles";

interface FormExampleProps {
  onSubmit?: (data: any) => void;
}

export default function FormExample({ onSubmit }: FormExampleProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    bio: "",
    country: "",
    notifications: false,
    newsletter: false,
    accountType: "learner",
    terms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.email) {
        newErrors.email = "Email is required";
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address";
      }

      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    if (step === 2) {
      if (!formData.firstName) {
        newErrors.firstName = "First name is required";
      }

      if (!formData.lastName) {
        newErrors.lastName = "Last name is required";
      }

      if (!formData.country) {
        newErrors.country = "Please select your country";
      }
    }

    if (step === 3) {
      if (!formData.terms) {
        newErrors.terms = "You must accept the terms and conditions";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 3));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(3)) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setIsSuccess(true);
      onSubmit?.(formData);
    } catch (error) {
      setErrors({
        general: "Registration failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className={DESIGN_SYSTEM_CLASSES.FORM_SUCCESS_BANNER}>
            Registration completed successfully! Welcome to our platform.
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome Aboard!
            </h2>
            <p className="text-gray-600">
              Your account has been created successfully. You can now start
              exploring our courses.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Create Account</h2>
          <p className="text-gray-600 mt-2">
            Join our learning community in just a few steps
          </p>
        </div>

        {/* Multi-step Progress */}
        <div className={DESIGN_SYSTEM_CLASSES.FORM_STEPS}>
          <div
            className={`${DESIGN_SYSTEM_CLASSES.FORM_STEP} ${
              currentStep >= 1 ? DESIGN_SYSTEM_CLASSES.FORM_STEP_ACTIVE : ""
            } ${
              currentStep > 1 ? DESIGN_SYSTEM_CLASSES.FORM_STEP_COMPLETED : ""
            }`}
          >
            <div className={DESIGN_SYSTEM_CLASSES.FORM_STEP_NUMBER}>
              {currentStep > 1 ? "" : "1"}
            </div>
            <div className={DESIGN_SYSTEM_CLASSES.FORM_STEP_TITLE}>Account</div>
          </div>
          <div
            className={`${DESIGN_SYSTEM_CLASSES.FORM_STEP} ${
              currentStep >= 2 ? DESIGN_SYSTEM_CLASSES.FORM_STEP_ACTIVE : ""
            } ${
              currentStep > 2 ? DESIGN_SYSTEM_CLASSES.FORM_STEP_COMPLETED : ""
            }`}
          >
            <div className={DESIGN_SYSTEM_CLASSES.FORM_STEP_NUMBER}>
              {currentStep > 2 ? "" : "2"}
            </div>
            <div className={DESIGN_SYSTEM_CLASSES.FORM_STEP_TITLE}>Profile</div>
          </div>
          <div
            className={`${DESIGN_SYSTEM_CLASSES.FORM_STEP} ${
              currentStep >= 3 ? DESIGN_SYSTEM_CLASSES.FORM_STEP_ACTIVE : ""
            }`}
          >
            <div className={DESIGN_SYSTEM_CLASSES.FORM_STEP_NUMBER}>3</div>
            <div className={DESIGN_SYSTEM_CLASSES.FORM_STEP_TITLE}>
              Preferences
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className={DESIGN_SYSTEM_CLASSES.FORM_ERROR_BANNER}>
              {errors.general}
            </div>
          )}

          {/* Step 1: Account Information */}
          {currentStep === 1 && (
            <>
              <div className={DESIGN_SYSTEM_CLASSES.FORM_GROUP}>
                <label
                  htmlFor="email"
                  className={`${DESIGN_SYSTEM_CLASSES.LABEL_BASE} ${DESIGN_SYSTEM_CLASSES.LABEL_REQUIRED}`}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={
                    errors.email
                      ? DESIGN_SYSTEM_CLASSES.INPUT_ERROR
                      : DESIGN_SYSTEM_CLASSES.INPUT_BASE
                  }
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
                {errors.email && (
                  <div className={DESIGN_SYSTEM_CLASSES.FORM_ERROR_MESSAGE}>
                    {errors.email}
                  </div>
                )}
              </div>

              <div className={DESIGN_SYSTEM_CLASSES.FORM_GROUP}>
                <label
                  htmlFor="password"
                  className={`${DESIGN_SYSTEM_CLASSES.LABEL_BASE} ${DESIGN_SYSTEM_CLASSES.LABEL_REQUIRED}`}
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={
                    errors.password
                      ? DESIGN_SYSTEM_CLASSES.INPUT_ERROR
                      : DESIGN_SYSTEM_CLASSES.INPUT_BASE
                  }
                  placeholder="Create a password"
                  disabled={isLoading}
                />
                {errors.password && (
                  <div className={DESIGN_SYSTEM_CLASSES.FORM_ERROR_MESSAGE}>
                    {errors.password}
                  </div>
                )}
                <div className={DESIGN_SYSTEM_CLASSES.FORM_HELP_TEXT}>
                  Password must be at least 6 characters long
                </div>
              </div>

              <div className={DESIGN_SYSTEM_CLASSES.FORM_GROUP}>
                <label
                  htmlFor="confirmPassword"
                  className={`${DESIGN_SYSTEM_CLASSES.LABEL_BASE} ${DESIGN_SYSTEM_CLASSES.LABEL_REQUIRED}`}
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={
                    errors.confirmPassword
                      ? DESIGN_SYSTEM_CLASSES.INPUT_ERROR
                      : DESIGN_SYSTEM_CLASSES.INPUT_BASE
                  }
                  placeholder="Confirm your password"
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <div className={DESIGN_SYSTEM_CLASSES.FORM_ERROR_MESSAGE}>
                    {errors.confirmPassword}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Step 2: Profile Information */}
          {currentStep === 2 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className={DESIGN_SYSTEM_CLASSES.FORM_GROUP}>
                  <label
                    htmlFor="firstName"
                    className={`${DESIGN_SYSTEM_CLASSES.LABEL_BASE} ${DESIGN_SYSTEM_CLASSES.LABEL_REQUIRED}`}
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={
                      errors.firstName
                        ? DESIGN_SYSTEM_CLASSES.INPUT_ERROR
                        : DESIGN_SYSTEM_CLASSES.INPUT_BASE
                    }
                    placeholder="First name"
                    disabled={isLoading}
                  />
                  {errors.firstName && (
                    <div className={DESIGN_SYSTEM_CLASSES.FORM_ERROR_MESSAGE}>
                      {errors.firstName}
                    </div>
                  )}
                </div>

                <div className={DESIGN_SYSTEM_CLASSES.FORM_GROUP}>
                  <label
                    htmlFor="lastName"
                    className={`${DESIGN_SYSTEM_CLASSES.LABEL_BASE} ${DESIGN_SYSTEM_CLASSES.LABEL_REQUIRED}`}
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={
                      errors.lastName
                        ? DESIGN_SYSTEM_CLASSES.INPUT_ERROR
                        : DESIGN_SYSTEM_CLASSES.INPUT_BASE
                    }
                    placeholder="Last name"
                    disabled={isLoading}
                  />
                  {errors.lastName && (
                    <div className={DESIGN_SYSTEM_CLASSES.FORM_ERROR_MESSAGE}>
                      {errors.lastName}
                    </div>
                  )}
                </div>
              </div>

              <div className={DESIGN_SYSTEM_CLASSES.FORM_GROUP}>
                <label
                  htmlFor="country"
                  className={`${DESIGN_SYSTEM_CLASSES.LABEL_BASE} ${DESIGN_SYSTEM_CLASSES.LABEL_REQUIRED}`}
                >
                  Country
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className={
                    errors.country
                      ? DESIGN_SYSTEM_CLASSES.INPUT_ERROR
                      : DESIGN_SYSTEM_CLASSES.SELECT_BASE
                  }
                  disabled={isLoading}
                >
                  <option value="">Select your country</option>
                  <option value="us">United States</option>
                  <option value="ca">Canada</option>
                  <option value="uk">United Kingdom</option>
                  <option value="au">Australia</option>
                  <option value="de">Germany</option>
                  <option value="fr">France</option>
                  <option value="other">Other</option>
                </select>
                {errors.country && (
                  <div className={DESIGN_SYSTEM_CLASSES.FORM_ERROR_MESSAGE}>
                    {errors.country}
                  </div>
                )}
              </div>

              <div className={DESIGN_SYSTEM_CLASSES.FORM_GROUP}>
                <label
                  htmlFor="bio"
                  className={`${DESIGN_SYSTEM_CLASSES.LABEL_BASE} ${DESIGN_SYSTEM_CLASSES.LABEL_OPTIONAL}`}
                >
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className={DESIGN_SYSTEM_CLASSES.TEXTAREA_BASE}
                  placeholder="Tell us a bit about yourself"
                  disabled={isLoading}
                />
                <div className={DESIGN_SYSTEM_CLASSES.FORM_HELP_TEXT}>
                  This will be displayed on your profile page
                </div>
              </div>
            </>
          )}

          {/* Step 3: Preferences */}
          {currentStep === 3 && (
            <>
              <div className={DESIGN_SYSTEM_CLASSES.FORM_GROUP}>
                <label className={DESIGN_SYSTEM_CLASSES.LABEL_BASE}>
                  Account Type
                </label>
                <div className="space-y-3">
                  <div className={DESIGN_SYSTEM_CLASSES.FORM_GROUP_INLINE}>
                    <input
                      type="radio"
                      id="learner"
                      name="accountType"
                      value="learner"
                      checked={formData.accountType === "learner"}
                      onChange={handleChange}
                      className={DESIGN_SYSTEM_CLASSES.RADIO_BASE}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="learner"
                      className={DESIGN_SYSTEM_CLASSES.LABEL_BASE}
                    >
                      Learner - I want to take courses
                    </label>
                  </div>
                  <div className={DESIGN_SYSTEM_CLASSES.FORM_GROUP_INLINE}>
                    <input
                      type="radio"
                      id="instructor"
                      name="accountType"
                      value="instructor"
                      checked={formData.accountType === "instructor"}
                      onChange={handleChange}
                      className={DESIGN_SYSTEM_CLASSES.RADIO_BASE}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="instructor"
                      className={DESIGN_SYSTEM_CLASSES.LABEL_BASE}
                    >
                      Instructor - I want to create and teach courses
                    </label>
                  </div>
                </div>
              </div>

              <div className={DESIGN_SYSTEM_CLASSES.FORM_GROUP}>
                <label className={DESIGN_SYSTEM_CLASSES.LABEL_BASE}>
                  Notification Preferences
                </label>
                <div className="space-y-3">
                  <div className={DESIGN_SYSTEM_CLASSES.FORM_GROUP_INLINE}>
                    <input
                      type="checkbox"
                      id="notifications"
                      name="notifications"
                      checked={formData.notifications}
                      onChange={handleChange}
                      className={DESIGN_SYSTEM_CLASSES.CHECKBOX_BASE}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="notifications"
                      className={DESIGN_SYSTEM_CLASSES.LABEL_BASE}
                    >
                      Email notifications for course updates
                    </label>
                  </div>
                  <div className={DESIGN_SYSTEM_CLASSES.FORM_GROUP_INLINE}>
                    <input
                      type="checkbox"
                      id="newsletter"
                      name="newsletter"
                      checked={formData.newsletter}
                      onChange={handleChange}
                      className={DESIGN_SYSTEM_CLASSES.CHECKBOX_BASE}
                      disabled={isLoading}
                    />
                    <label
                      htmlFor="newsletter"
                      className={DESIGN_SYSTEM_CLASSES.LABEL_BASE}
                    >
                      Subscribe to our newsletter
                    </label>
                  </div>
                </div>
              </div>

              <div className={DESIGN_SYSTEM_CLASSES.FORM_GROUP}>
                <div className={DESIGN_SYSTEM_CLASSES.FORM_GROUP_INLINE}>
                  <input
                    type="checkbox"
                    id="terms"
                    name="terms"
                    checked={formData.terms}
                    onChange={handleChange}
                    className={
                      errors.terms
                        ? DESIGN_SYSTEM_CLASSES.INPUT_ERROR
                        : DESIGN_SYSTEM_CLASSES.CHECKBOX_BASE
                    }
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="terms"
                    className={`${DESIGN_SYSTEM_CLASSES.LABEL_BASE} ${DESIGN_SYSTEM_CLASSES.LABEL_REQUIRED}`}
                  >
                    I agree to the Terms of Service and Privacy Policy
                  </label>
                </div>
                {errors.terms && (
                  <div className={DESIGN_SYSTEM_CLASSES.FORM_ERROR_MESSAGE}>
                    {errors.terms}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                disabled={isLoading}
                className={DESIGN_SYSTEM_CLASSES.BTN_SECONDARY}
              >
                Previous
              </button>
            )}

            <div className="ml-auto">
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isLoading}
                  className={DESIGN_SYSTEM_CLASSES.BTN_PRIMARY}
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`${DESIGN_SYSTEM_CLASSES.BTN_PRIMARY} ${
                    isLoading ? DESIGN_SYSTEM_CLASSES.BTN_LOADING : ""
                  }`}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </button>
              )}
            </div>
          </div>

          {/* Loading Progress Bar */}
          {isLoading && (
            <div className={DESIGN_SYSTEM_CLASSES.FORM_PROGRESS_BAR}>
              <div
                className={DESIGN_SYSTEM_CLASSES.FORM_PROGRESS_FILL}
                style={{ width: "100%" }}
              />
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
