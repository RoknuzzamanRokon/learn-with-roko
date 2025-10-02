"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm, RegisterForm } from "../components/auth";
import { useAuth } from "../contexts/AuthContext";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const handleAuthSuccess = () => {
    router.push("/dashboard");
  };

  const switchToRegister = () => {
    setIsLogin(false);
  };

  const switchToLogin = () => {
    setIsLogin(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Learning Management System
          </h1>
          <p className="text-gray-600">Your gateway to knowledge and growth</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {isLogin ? (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToRegister={switchToRegister}
          />
        ) : (
          <RegisterForm
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={switchToLogin}
          />
        )}
      </div>

      <div className="mt-8 text-center">
        <div className="text-sm text-gray-500">
          <p>Demo Accounts:</p>
          <p>Super Admin: admin@learnwithroko.com / admin123</p>
          <p>Instructor: instructor@learnwithroko.com / instructor123</p>
          <p>Learner: learner@learnwithroko.com / learner123</p>
        </div>
      </div>
    </div>
  );
}
