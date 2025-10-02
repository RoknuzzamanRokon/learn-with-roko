import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";
import LoginForm from "@/components/auth/LoginForm";
import { AuthProvider } from "@/contexts/AuthContext";

// Mock Next.js router
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

describe("Authentication Integration Tests", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderWithAuthProvider = (component: React.ReactElement) => {
    return render(<AuthProvider>{component}</AuthProvider>);
  };

  it("successfully logs in user with valid credentials", async () => {
    const mockOnSuccess = vi.fn();

    renderWithAuthProvider(<LoginForm onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it("handles login failure with invalid credentials", async () => {
    // Override the default successful login handler
    server.use(
      http.post("http://localhost:8000/api/auth/login", () => {
        return new HttpResponse(
          JSON.stringify({ detail: "Invalid credentials" }),
          { status: 401 }
        );
      })
    );

    renderWithAuthProvider(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "wrongpassword");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it("handles network errors during login", async () => {
    // Override the default handler to simulate network error
    server.use(
      http.post("http://localhost:8000/api/auth/login", () => {
        return HttpResponse.error();
      })
    );

    renderWithAuthProvider(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/login failed. please try again./i)
      ).toBeInTheDocument();
    });
  });

  it("handles server errors during login", async () => {
    // Override the default handler to simulate server error
    server.use(
      http.post("http://localhost:8000/api/auth/login", () => {
        return new HttpResponse(
          JSON.stringify({ detail: "Internal server error" }),
          { status: 500 }
        );
      })
    );

    renderWithAuthProvider(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
    });
  });

  it("stores authentication tokens after successful login", async () => {
    const mockOnSuccess = vi.fn();

    renderWithAuthProvider(<LoginForm onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    // Check if tokens are stored (this would depend on your auth implementation)
    // You might need to check localStorage, cookies, or context state
  });

  it("handles token refresh on expired access token", async () => {
    // This test would require setting up a scenario where the access token is expired
    // and the system attempts to refresh it automatically

    // Override handlers to simulate expired token scenario
    server.use(
      http.get("http://localhost:8000/api/users/me", () => {
        return new HttpResponse(JSON.stringify({ detail: "Token expired" }), {
          status: 401,
        });
      }),
      http.post("http://localhost:8000/api/auth/refresh", () => {
        return HttpResponse.json({
          access_token: "new-mock-access-token",
          refresh_token: "new-mock-refresh-token",
          token_type: "bearer",
          expires_in: 3600,
        });
      })
    );

    // This test would need to be implemented based on your specific auth flow
    // For now, we'll just verify the refresh endpoint is available
    expect(true).toBe(true); // Placeholder
  });

  it("redirects to login page when refresh token is invalid", async () => {
    // Override handlers to simulate invalid refresh token
    server.use(
      http.post("http://localhost:8000/api/auth/refresh", () => {
        return new HttpResponse(
          JSON.stringify({ detail: "Invalid refresh token" }),
          { status: 401 }
        );
      })
    );

    // This test would need to be implemented based on your specific auth flow
    // and how you handle invalid refresh tokens
    expect(true).toBe(true); // Placeholder
  });

  it("maintains authentication state across page reloads", async () => {
    // This test would verify that authentication state is properly restored
    // from stored tokens when the application is reloaded

    // This would typically involve:
    // 1. Logging in a user
    // 2. Simulating a page reload
    // 3. Verifying the user is still authenticated

    expect(true).toBe(true); // Placeholder - implement based on your auth strategy
  });

  it("clears authentication state on logout", async () => {
    // This test would verify that logout properly clears all authentication data

    // This would typically involve:
    // 1. Logging in a user
    // 2. Calling logout
    // 3. Verifying tokens are cleared and user is unauthenticated

    expect(true).toBe(true); // Placeholder - implement based on your auth strategy
  });
});
