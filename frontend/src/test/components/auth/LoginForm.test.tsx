import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "@/components/auth/LoginForm";
import { AuthProvider } from "@/contexts/AuthContext";

// Mock the AuthContext
const mockLogin = vi.fn();
const mockAuthContext = {
  user: null,
  login: mockLogin,
  logout: vi.fn(),
  register: vi.fn(),
  isLoading: false,
  isAuthenticated: false,
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

describe("LoginForm", () => {
  const user = userEvent.setup();
  const mockOnSuccess = vi.fn();
  const mockOnSwitchToRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form with all required fields", () => {
    render(<LoginForm />);

    expect(
      screen.getByRole("heading", { name: /sign in/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });

  it("shows validation errors for empty fields", async () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole("button", { name: /sign in/i });
    await user.click(submitButton);

    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    expect(screen.getByText(/password is required/i)).toBeInTheDocument();
  });

  it("shows validation error for invalid email format", async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "invalid-email");
    await user.click(submitButton);

    expect(
      screen.getByText(/please enter a valid email address/i)
    ).toBeInTheDocument();
  });

  it("shows validation error for short password", async () => {
    render(<LoginForm />);

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(passwordInput, "123");
    await user.click(submitButton);

    expect(
      screen.getByText(/password must be at least 6 characters/i)
    ).toBeInTheDocument();
  });

  it("clears validation errors when user starts typing", async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    // Trigger validation error
    await user.click(submitButton);
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();

    // Start typing to clear error
    await user.type(emailInput, "test@example.com");
    expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
  });

  it("calls login function with correct data on valid form submission", async () => {
    mockLogin.mockResolvedValueOnce({});
    render(<LoginForm onSuccess={mockOnSuccess} />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("shows loading state during form submission", async () => {
    // Mock login to return a pending promise
    let resolveLogin: () => void;
    const loginPromise = new Promise<void>((resolve) => {
      resolveLogin = resolve;
    });
    mockLogin.mockReturnValueOnce(loginPromise);

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitButton);

    // Check loading state
    expect(screen.getByText(/signing in.../i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
    expect(emailInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();

    // Resolve the promise to end loading state
    resolveLogin!();
    await waitFor(() => {
      expect(screen.queryByText(/signing in.../i)).not.toBeInTheDocument();
    });
  });

  it("displays error message when login fails", async () => {
    const errorMessage = "Invalid credentials";
    mockLogin.mockRejectedValueOnce(new Error(errorMessage));

    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "wrongpassword");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it("displays generic error message for unknown errors", async () => {
    mockLogin.mockRejectedValueOnce("Unknown error");

    render(<LoginForm />);

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

  it("shows switch to register button when onSwitchToRegister is provided", () => {
    render(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} />);

    const switchButton = screen.getByRole("button", { name: /sign up here/i });
    expect(switchButton).toBeInTheDocument();
  });

  it("calls onSwitchToRegister when switch button is clicked", async () => {
    render(<LoginForm onSwitchToRegister={mockOnSwitchToRegister} />);

    const switchButton = screen.getByRole("button", { name: /sign up here/i });
    await user.click(switchButton);

    expect(mockOnSwitchToRegister).toHaveBeenCalled();
  });

  it("does not show switch to register button when onSwitchToRegister is not provided", () => {
    render(<LoginForm />);

    expect(
      screen.queryByRole("button", { name: /sign up here/i })
    ).not.toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    expect(emailInput).toHaveAttribute("type", "email");
    expect(emailInput).toHaveAttribute("id", "email");
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(passwordInput).toHaveAttribute("id", "password");
  });

  it("applies error styling to fields with validation errors", async () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole("button", { name: /sign in/i });

    await user.click(submitButton);

    expect(emailInput).toHaveClass("border-red-300");
  });

  it("applies normal styling to fields without validation errors", () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toHaveClass("border-gray-300");
  });
});
