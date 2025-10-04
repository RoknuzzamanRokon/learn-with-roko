"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";

// Types
export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: "super_admin" | "instructor" | "learner";
  is_active: boolean;
  is_verified: boolean;
  profile_image?: string;
  bio?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Token storage keys
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user";

// API base URL
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated
  const isAuthenticated = !!user && !!tokens;

  // Initialize auth state from cookies
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = Cookies.get(ACCESS_TOKEN_KEY);
        const refreshToken = Cookies.get(REFRESH_TOKEN_KEY);
        const userData = Cookies.get(USER_KEY);

        if (accessToken && refreshToken && userData) {
          const parsedUser = JSON.parse(userData);
          const tokenData: AuthTokens = {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: "bearer",
            expires_in: 1800, // 30 minutes default
          };

          // Check if token is expired
          try {
            const decoded: any = jwtDecode(accessToken);
            const currentTime = Date.now() / 1000;

            if (decoded.exp < currentTime) {
              // Token expired, try to refresh
              const refreshed = await refreshTokenInternal(refreshToken);
              if (!refreshed) {
                clearAuthData();
                return;
              }
            } else {
              setUser(parsedUser);
              setTokens(tokenData);
            }
          } catch (error) {
            console.error("Error decoding token:", error);
            clearAuthData();
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Clear auth data
  const clearAuthData = () => {
    setUser(null);
    setTokens(null);
    Cookies.remove(ACCESS_TOKEN_KEY);
    Cookies.remove(REFRESH_TOKEN_KEY);
    Cookies.remove(USER_KEY);
  };

  // Store auth data
  const storeAuthData = (userData: User, tokenData: AuthTokens) => {
    setUser(userData);
    setTokens(tokenData);

    // Store in cookies with appropriate expiration
    const accessTokenExpiry = new Date(
      Date.now() + tokenData.expires_in * 1000
    );
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    Cookies.set(ACCESS_TOKEN_KEY, tokenData.access_token, {
      expires: accessTokenExpiry,
    });
    Cookies.set(REFRESH_TOKEN_KEY, tokenData.refresh_token, {
      expires: refreshTokenExpiry,
    });
    Cookies.set(USER_KEY, JSON.stringify(userData), {
      expires: refreshTokenExpiry,
    });
  };

  // Login function
  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await response.json();
      storeAuthData(data.user, data.tokens);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Register function
  const register = async (data: RegisterData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Registration failed");
      }

      // After successful registration, automatically log in
      await login({ email: data.email, password: data.password });
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (tokens?.access_token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthData();
    }
  };

  // Internal refresh token function
  const refreshTokenInternal = async (
    refreshToken: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const tokenData = await response.json();

      // Get current user data
      const currentUser = user || JSON.parse(Cookies.get(USER_KEY) || "{}");
      if (currentUser) {
        storeAuthData(currentUser, tokenData);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Token refresh error:", error);
      return false;
    }
  };

  // Public refresh token function
  const refreshToken = async (): Promise<boolean> => {
    const refreshTokenValue =
      tokens?.refresh_token || Cookies.get(REFRESH_TOKEN_KEY);
    if (!refreshTokenValue) {
      return false;
    }

    return await refreshTokenInternal(refreshTokenValue);
  };

  // Permission checking using the comprehensive permission system
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // Super admin has all permissions
    if (user.role === "super_admin") return true;

    // Import and use the comprehensive permission system
    const { hasPermission: checkPermission } = require("../utils/permissions");
    return checkPermission(user.role, permission);
  };

  // Role checking
  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false;

    // Super admin can assume any role
    if (user.role === "super_admin") return true;

    if (Array.isArray(role)) {
      return role.includes(user.role);
    }

    return user.role === role;
  };

  const value: AuthContextType = {
    user,
    tokens,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
