"use client";

import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { DESIGN_SYSTEM_CLASSES } from "../../../src/styles";

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export default function LoginForm({
  onSuccess,
  onSwitchToRegister,
}: LoginFormProps) {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      await login(formData);
      onSuccess?.();
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : "Login failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white shadow-lg rounded-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Sign In</h2>
          <p className="text-gray-600 mt-2">
            Welcome back! Please sign in to your account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className={DESIGN_SYSTEM_CLASSES.FORM_ERROR_BANNER}>
              {errors.general}
            </div>
          )}

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
              placeholder="Enter your password"
              disabled={isLoading}
            />
            {errors.password && (
              <div className={DESIGN_SYSTEM_CLASSES.FORM_ERROR_MESSAGE}>
                {errors.password}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full ${DESIGN_SYSTEM_CLASSES.BTN_PRIMARY} ${
              isLoading ? DESIGN_SYSTEM_CLASSES.BTN_LOADING : ""
            }`}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {onSwitchToRegister && (
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className={
                  DESIGN_SYSTEM_CLASSES.TEXT_PRIMARY +
                  " hover:opacity-80 font-medium"
                }
              >
                Sign up here
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
