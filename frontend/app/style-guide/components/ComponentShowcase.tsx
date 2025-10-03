"use client";

import React, { useState } from "react";

export function ComponentShowcase() {
  const [selectedButton, setSelectedButton] = useState("primary");
  const [inputState, setInputState] = useState("default");
  const [cardVariant, setCardVariant] = useState("default");

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Component Showcase
        </h2>
        <p className="text-gray-600 mb-8">
          Interactive examples of all components with color variations. Use the
          controls to see different states and variants.
        </p>
      </div>

      {/* Button Components */}
      <section className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Buttons</h3>
          <p className="text-gray-600">
            All button variants with hover and active states
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Button Variant:
            </label>
            <select
              value={selectedButton}
              onChange={(e) => setSelectedButton(e.target.value)}
              className="input-base w-48"
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Normal State */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Normal</h4>
              <button className={`btn-base btn-${selectedButton} w-full`}>
                {selectedButton.charAt(0).toUpperCase() +
                  selectedButton.slice(1)}{" "}
                Button
              </button>
            </div>

            {/* Hover State */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Hover</h4>
              <button
                className={`btn-base btn-${selectedButton} w-full hover:opacity-90`}
              >
                Hover State
              </button>
            </div>

            {/* Active State */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Active</h4>
              <button
                className={`btn-base btn-${selectedButton} w-full active:scale-95`}
              >
                Active State
              </button>
            </div>

            {/* Disabled State */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-700">Disabled</h4>
              <button
                className={`btn-base btn-${selectedButton} w-full`}
                disabled
              >
                Disabled
              </button>
            </div>
          </div>

          {/* Button Sizes */}
          <div className="mt-8">
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              Button Sizes
            </h4>
            <div className="flex flex-wrap items-center gap-4">
              <button
                className={`btn-base btn-${selectedButton} text-xs px-2 py-1`}
              >
                Small
              </button>
              <button className={`btn-base btn-${selectedButton}`}>
                Medium (Default)
              </button>
              <button
                className={`btn-base btn-${selectedButton} text-base px-6 py-3`}
              >
                Large
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Form Components */}
      <section className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Form Elements
          </h3>
          <p className="text-gray-600">
            Input fields, labels, and form validation states
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Input State:
            </label>
            <select
              value={inputState}
              onChange={(e) => setInputState(e.target.value)}
              className="input-base w-48"
            >
              <option value="default">Default</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Text Inputs */}
            <div className="space-y-4">
              <div className="form-group">
                <label className="label-base">Email Address</label>
                <input
                  type="email"
                  className={
                    inputState === "error"
                      ? "input-error"
                      : inputState === "success"
                      ? "input-success"
                      : "input-base"
                  }
                  placeholder="Enter your email"
                  defaultValue={
                    inputState === "success"
                      ? "user@example.com"
                      : inputState === "error"
                      ? "invalid-email"
                      : ""
                  }
                />
                {inputState === "error" && (
                  <div className="form-error-message">
                    Please enter a valid email address
                  </div>
                )}
                {inputState === "success" && (
                  <div className="text-success-600 text-sm mt-1 flex items-center">
                    <span className="mr-2">✓</span>
                    Email is valid
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="label-base label-required">Password</label>
                <input
                  type="password"
                  className={
                    inputState === "error" ? "input-error" : "input-base"
                  }
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {/* Select and Textarea */}
            <div className="space-y-4">
              <div className="form-group">
                <label className="label-base">Course Category</label>
                <select className="input-base">
                  <option>Select a category</option>
                  <option>Programming</option>
                  <option>Design</option>
                  <option>Business</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label-base">Description</label>
                <textarea
                  className="input-base"
                  rows={3}
                  placeholder="Enter course description"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Checkboxes and Radio Buttons */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">
                Checkboxes
              </h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-3 text-primary-600"
                    defaultChecked
                  />
                  <span className="text-gray-700">Email notifications</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-3 text-primary-600" />
                  <span className="text-gray-700">SMS notifications</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-3 text-primary-600"
                    disabled
                  />
                  <span className="text-gray-400">
                    Push notifications (disabled)
                  </span>
                </label>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">
                Radio Buttons
              </h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="plan"
                    className="mr-3 text-primary-600"
                    defaultChecked
                  />
                  <span className="text-gray-700">Basic Plan</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="plan"
                    className="mr-3 text-primary-600"
                  />
                  <span className="text-gray-700">Premium Plan</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="plan"
                    className="mr-3 text-primary-600"
                  />
                  <span className="text-gray-700">Enterprise Plan</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Card Components */}
      <section className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Cards and Containers
          </h3>
          <p className="text-gray-600">
            Different card styles and container variations
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Card Variant:
            </label>
            <select
              value={cardVariant}
              onChange={(e) => setCardVariant(e.target.value)}
              className="input-base w-48"
            >
              <option value="default">Default</option>
              <option value="featured">Featured</option>
              <option value="metric-primary">Metric - Primary</option>
              <option value="metric-success">Metric - Success</option>
              <option value="metric-warning">Metric - Warning</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Course Card */}
            <div
              className={`bg-white rounded-lg border shadow-sm overflow-hidden ${
                cardVariant === "featured"
                  ? "border-l-4 border-l-primary-600"
                  : "border-gray-200"
              }`}
            >
              <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-600"></div>
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2">
                  {cardVariant === "featured"
                    ? "Featured Course"
                    : "Course Title"}
                </h4>
                <p className="text-gray-600 text-sm mb-3">
                  Learn the fundamentals of web development with this
                  comprehensive course.
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-primary-600 font-medium">$99</span>
                  <button className="btn-base btn-primary text-xs px-3 py-1">
                    Enroll
                  </button>
                </div>
              </div>
            </div>

            {/* Metric Card */}
            <div
              className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${
                cardVariant.startsWith("metric")
                  ? `border-t-4 ${
                      cardVariant === "metric-primary"
                        ? "border-t-primary-600"
                        : cardVariant === "metric-success"
                        ? "border-t-success-600"
                        : cardVariant === "metric-warning"
                        ? "border-t-warning-600"
                        : ""
                    }`
                  : ""
              }`}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">1,234</p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      cardVariant === "metric-primary"
                        ? "bg-primary-100"
                        : cardVariant === "metric-success"
                        ? "bg-success-100"
                        : cardVariant === "metric-warning"
                        ? "bg-warning-100"
                        : "bg-gray-100"
                    }`}
                  >
                    <span
                      className={`text-xl ${
                        cardVariant === "metric-primary"
                          ? "text-primary-600"
                          : cardVariant === "metric-success"
                          ? "text-success-600"
                          : cardVariant === "metric-warning"
                          ? "text-warning-600"
                          : "text-gray-600"
                      }`}
                    >
                      👥
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <span
                    className={`text-sm font-medium ${
                      cardVariant === "metric-success"
                        ? "text-success-600"
                        : cardVariant === "metric-warning"
                        ? "text-warning-600"
                        : "text-primary-600"
                    }`}
                  >
                    +12% from last month
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h4 className="font-semibold text-gray-900 mb-4">
                Course Progress
              </h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">JavaScript Basics</span>
                    <span className="text-success-600 font-medium">100%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-success-500 h-2 rounded-full w-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">React Fundamentals</span>
                    <span className="text-primary-600 font-medium">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary-500 h-2 rounded-full w-3/4"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Advanced Patterns</span>
                    <span className="text-gray-400 font-medium">0%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-300 h-2 rounded-full w-0"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Components */}
      <section className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Navigation Elements
          </h3>
          <p className="text-gray-600">
            Navigation bars, tabs, and breadcrumbs
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          {/* Tab Navigation */}
          <div className="mb-8">
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              Tab Navigation
            </h4>
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8">
                <button className="py-2 px-1 border-b-2 border-primary-600 text-primary-600 font-medium text-sm">
                  Dashboard
                </button>
                <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
                  Courses
                </button>
                <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
                  Progress
                </button>
                <button className="py-2 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
                  Settings
                </button>
              </nav>
            </div>
          </div>

          {/* Breadcrumbs */}
          <div className="mb-8">
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              Breadcrumbs
            </h4>
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li>
                  <a href="#" className="text-gray-500 hover:text-gray-700">
                    Home
                  </a>
                </li>
                <li>
                  <span className="text-gray-400">/</span>
                </li>
                <li>
                  <a href="#" className="text-gray-500 hover:text-gray-700">
                    Courses
                  </a>
                </li>
                <li>
                  <span className="text-gray-400">/</span>
                </li>
                <li>
                  <span className="text-gray-900 font-medium">
                    JavaScript Basics
                  </span>
                </li>
              </ol>
            </nav>
          </div>

          {/* Pagination */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              Pagination
            </h4>
            <nav className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
                  Previous
                </button>
                <button className="px-3 py-2 text-sm bg-primary-600 text-white rounded-md">
                  1
                </button>
                <button className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50">
                  2
                </button>
                <button className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50">
                  3
                </button>
                <button className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50">
                  Next
                </button>
              </div>
              <span className="text-sm text-gray-700">
                Showing 1 to 10 of 97 results
              </span>
            </nav>
          </div>
        </div>
      </section>

      {/* Alert and Notification Components */}
      <section className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Alerts and Notifications
          </h3>
          <p className="text-gray-600">
            Status messages, alerts, and feedback components
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
          {/* Success Alert */}
          <div className="bg-success-50 border border-success-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-success-600 text-lg">✓</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-success-800">
                  Course completed successfully!
                </h3>
                <div className="mt-2 text-sm text-success-700">
                  <p>
                    You have successfully completed the JavaScript Basics
                    course. Your certificate is now available.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Alert */}
          <div className="bg-warning-50 border border-warning-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-warning-600 text-lg">⚠</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-warning-800">
                  Assignment deadline approaching
                </h3>
                <div className="mt-2 text-sm text-warning-700">
                  <p>
                    Your assignment is due in 2 days. Make sure to submit it
                    before the deadline.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          <div className="bg-error-50 border border-error-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-error-600 text-lg">✕</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-error-800">
                  Payment failed
                </h3>
                <div className="mt-2 text-sm text-error-700">
                  <p>
                    There was an error processing your payment. Please check
                    your payment method and try again.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Info Alert */}
          <div className="bg-primary-50 border border-primary-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-primary-600 text-lg">ℹ</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-primary-800">
                  New course available
                </h3>
                <div className="mt-2 text-sm text-primary-700">
                  <p>
                    A new advanced React course has been added to your learning
                    path. Check it out!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
