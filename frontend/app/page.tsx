"use client";

import Link from "next/link";
import { useAuth } from "./contexts/AuthContext";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">
            Loading your learning journey...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative bg-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-accent-teal-50 opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <div className="mb-8">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary-100 text-primary-800 border border-primary-200">
                🎓 Welcome to Your Learning Journey
              </span>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 sm:text-6xl md:text-7xl leading-tight">
              Learn Without
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-teal-600">
                Limits
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600 leading-relaxed">
              Discover thousands of courses from expert instructors. Build new
              skills, advance your career, or explore new interests with our
              comprehensive learning platform.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <svg
                  className="w-5 h-5 mr-2"
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
                Browse Courses
              </Link>
              {!isAuthenticated && (
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl text-primary-700 bg-white border-2 border-primary-200 hover:bg-primary-50 hover:border-primary-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Get Started Free
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">10K+</div>
                <div className="text-sm text-gray-600 mt-1">
                  Active Students
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-success-600">500+</div>
                <div className="text-sm text-gray-600 mt-1">Expert Courses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-purple-600">
                  50+
                </div>
                <div className="text-sm text-gray-600 mt-1">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-teal-600">
                  95%
                </div>
                <div className="text-sm text-gray-600 mt-1">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our Platform?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to learn and grow your skills in one
              comprehensive platform
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group relative bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border border-primary-200">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
                Expert Instructors
              </h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Learn from industry professionals and experienced educators who
                bring real-world expertise to every lesson
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group relative bg-gradient-to-br from-success-50 to-success-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border border-success-200">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r from-success-500 to-success-600 text-white mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
                Progress Tracking
              </h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Monitor your learning journey with detailed analytics, earn
                certificates, and celebrate your achievements
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group relative bg-gradient-to-br from-accent-teal-50 to-accent-teal-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border border-accent-teal-200">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r from-accent-teal-500 to-accent-teal-600 text-white mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
                Learn at Your Pace
              </h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Access courses anytime, anywhere, and learn at your own speed
                with lifetime access to materials
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group relative bg-gradient-to-br from-accent-purple-50 to-accent-purple-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border border-accent-purple-200">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r from-accent-purple-500 to-accent-purple-600 text-white mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
                Community Support
              </h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Join a vibrant community of learners, participate in
                discussions, and get help when you need it
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group relative bg-gradient-to-br from-warning-50 to-warning-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border border-warning-200">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r from-warning-500 to-warning-600 text-white mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
                Interactive Learning
              </h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Engage with interactive content, quizzes, assignments, and
                hands-on projects for better retention
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group relative bg-gradient-to-br from-error-50 to-error-100 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 border border-error-200">
              <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-r from-error-500 to-error-600 text-white mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 text-center mb-4">
                Secure & Reliable
              </h3>
              <p className="text-gray-600 text-center leading-relaxed">
                Your data is protected with enterprise-grade security, ensuring
                a safe and reliable learning environment
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-accent-teal-600 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-24 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              <span className="block">Ready to start learning?</span>
              <span className="block text-primary-200 mt-2">
                Join thousands of learners today.
              </span>
            </h2>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-primary-100">
              Start your learning journey with our comprehensive courses and
              expert instructors. No commitment required - explore for free!
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl text-primary-700 bg-white hover:bg-gray-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <svg
                  className="w-5 h-5 mr-2"
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
                Explore Courses
              </Link>
              {!isAuthenticated && (
                <Link
                  href="/auth"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-xl text-white bg-transparent border-2 border-white hover:bg-white hover:text-primary-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Sign Up Free
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">
              Learning Management System
            </h3>
            <p className="text-gray-400 mb-8">
              Empowering learners worldwide with quality education
            </p>
            <div className="flex justify-center space-x-6">
              <Link
                href="/catalog"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Courses
              </Link>
              <Link
                href="/auth"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Sign Up
              </Link>
              <Link
                href="/dashboard"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/style-guide"
                className="text-gray-400 hover:text-white transition-colors"
              >
                Style Guide
              </Link>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800">
              <p className="text-gray-500 text-sm">
                © 2024 Learning Management System. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
