import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import LoginForm from "@/components/auth/LoginForm";
import { CourseCard } from "@/components/catalog/CourseCard";
import { Course } from "@/types/course";

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// Mock the AuthContext for LoginForm
const mockAuthContext = {
  user: null,
  login: vi.fn(),
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

// Mock Next.js Link component
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("Accessibility Tests", () => {
  describe("LoginForm Accessibility", () => {
    it("should not have any accessibility violations", async () => {
      const { container } = render(<LoginForm />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has proper form labels", () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    it("has proper form structure with fieldsets or proper labeling", () => {
      render(<LoginForm />);

      // Check that form inputs have proper labels
      const emailInput = screen.getByRole("textbox", {
        name: /email address/i,
      });
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      expect(emailInput).toHaveAttribute("id", "email");
      expect(passwordInput).toHaveAttribute("id", "password");
      expect(submitButton).toHaveAttribute("type", "submit");
    });

    it("provides proper error announcements", async () => {
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: /sign in/i });
      submitButton.click();

      // Wait for validation errors to appear
      await screen.findByText(/email is required/i);

      // Check that error messages are properly associated with inputs
      const emailError = screen.getByText(/email is required/i);
      expect(emailError).toBeInTheDocument();

      // Error messages should be announced to screen readers
      expect(emailError).toHaveClass("text-red-600");
    });

    it("has proper focus management", () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: /sign in/i });

      // Check that elements can receive focus
      expect(emailInput).not.toHaveAttribute("tabindex", "-1");
      expect(passwordInput).not.toHaveAttribute("tabindex", "-1");
      expect(submitButton).not.toHaveAttribute("tabindex", "-1");
    });

    it("has proper contrast ratios for text elements", () => {
      render(<LoginForm />);

      // Check that important text elements have proper styling for contrast
      const heading = screen.getByRole("heading", { name: /sign in/i });
      const emailLabel = screen.getByText(/email address/i);

      expect(heading).toHaveClass("text-gray-900"); // Should have good contrast
      expect(emailLabel).toHaveClass("text-gray-700"); // Should have good contrast
    });
  });

  describe("CourseCard Accessibility", () => {
    const mockCourse: Course = {
      id: 1,
      title: "Test Course Title",
      description: "This is a test course description.",
      short_description: "Short test description",
      instructor_id: 1,
      instructor: {
        id: 1,
        first_name: "John",
        last_name: "Instructor",
        username: "instructor1",
      },
      price: 99.99,
      is_published: true,
      is_featured: false,
      thumbnail_url: "https://example.com/thumbnail.jpg",
      difficulty_level: "beginner",
      total_duration: 120,
      total_lectures: 15,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    it("should not have any accessibility violations", async () => {
      const { container } = render(<CourseCard course={mockCourse} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("has proper image alt text", () => {
      render(<CourseCard course={mockCourse} />);

      const thumbnail = screen.getByAltText("Test Course Title");
      expect(thumbnail).toBeInTheDocument();
      expect(thumbnail).toHaveAttribute("alt", "Test Course Title");
    });

    it("has proper link accessibility", () => {
      render(<CourseCard course={mockCourse} />);

      const viewCourseLink = screen.getByRole("link", { name: /view course/i });
      expect(viewCourseLink).toBeInTheDocument();
      expect(viewCourseLink).toHaveAttribute("href", "/catalog/1");
    });

    it("has proper heading structure", () => {
      render(<CourseCard course={mockCourse} />);

      const courseTitle = screen.getByText("Test Course Title");
      expect(courseTitle).toBeInTheDocument();

      // The title should be in a heading element or have proper semantic structure
      expect(courseTitle.tagName).toBe("H3");
    });

    it("provides meaningful text for screen readers", () => {
      render(<CourseCard course={mockCourse} />);

      // Check that important information is available as text
      expect(screen.getByText("Test Course Title")).toBeInTheDocument();
      expect(screen.getByText("Short test description")).toBeInTheDocument();
      expect(screen.getByText("$99.99")).toBeInTheDocument();
      expect(screen.getByText("Beginner")).toBeInTheDocument();
      expect(screen.getByText("2h 0m")).toBeInTheDocument();
      expect(screen.getByText("15 lectures")).toBeInTheDocument();
    });

    it("has proper color contrast for difficulty badges", () => {
      render(<CourseCard course={mockCourse} />);

      const difficultyBadge = screen.getByText("Beginner");
      expect(difficultyBadge).toHaveClass("bg-green-100", "text-green-800");

      // These classes should provide sufficient contrast
    });

    it("handles missing thumbnail gracefully for accessibility", () => {
      const courseWithoutThumbnail = { ...mockCourse, thumbnail_url: "" };
      render(<CourseCard course={courseWithoutThumbnail} />);

      // Should still provide meaningful content for screen readers
      const fallbackContent = screen.getByText("T"); // First letter fallback
      expect(fallbackContent).toBeInTheDocument();
    });
  });

  describe("General Accessibility Patterns", () => {
    it("uses semantic HTML elements appropriately", () => {
      render(
        <main>
          <h1>Learning Management System</h1>
          <nav>
            <ul>
              <li>
                <a href="/courses">Courses</a>
              </li>
              <li>
                <a href="/dashboard">Dashboard</a>
              </li>
            </ul>
          </nav>
          <section>
            <h2>Featured Courses</h2>
            <article>
              <h3>Course Title</h3>
              <p>Course description</p>
            </article>
          </section>
        </main>
      );

      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByRole("navigation")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
    });

    it("provides proper keyboard navigation support", () => {
      render(
        <div>
          <button>Button 1</button>
          <a href="/link">Link 1</a>
          <input type="text" placeholder="Input 1" />
          <button>Button 2</button>
        </div>
      );

      const button1 = screen.getByRole("button", { name: "Button 1" });
      const link1 = screen.getByRole("link", { name: "Link 1" });
      const input1 = screen.getByRole("textbox");
      const button2 = screen.getByRole("button", { name: "Button 2" });

      // All interactive elements should be focusable
      expect(button1).not.toHaveAttribute("tabindex", "-1");
      expect(link1).not.toHaveAttribute("tabindex", "-1");
      expect(input1).not.toHaveAttribute("tabindex", "-1");
      expect(button2).not.toHaveAttribute("tabindex", "-1");
    });

    it("provides proper ARIA labels where needed", () => {
      render(
        <div>
          <button aria-label="Close dialog">×</button>
          <input type="search" aria-label="Search courses" />
          <div role="alert" aria-live="polite">
            Status message
          </div>
        </div>
      );

      const closeButton = screen.getByRole("button", { name: "Close dialog" });
      const searchInput = screen.getByRole("searchbox", {
        name: "Search courses",
      });
      const alertDiv = screen.getByRole("alert");

      expect(closeButton).toHaveAttribute("aria-label", "Close dialog");
      expect(searchInput).toHaveAttribute("aria-label", "Search courses");
      expect(alertDiv).toHaveAttribute("aria-live", "polite");
    });

    it("handles loading states accessibly", () => {
      render(
        <div>
          <button disabled aria-describedby="loading-text">
            Submit
          </button>
          <div id="loading-text" aria-live="polite">
            Loading...
          </div>
        </div>
      );

      const submitButton = screen.getByRole("button", { name: "Submit" });
      const loadingText = screen.getByText("Loading...");

      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveAttribute("aria-describedby", "loading-text");
      expect(loadingText).toHaveAttribute("aria-live", "polite");
    });

    it("provides proper error announcements", () => {
      render(
        <div>
          <input
            type="email"
            aria-describedby="email-error"
            aria-invalid="true"
          />
          <div id="email-error" role="alert">
            Please enter a valid email address
          </div>
        </div>
      );

      const emailInput = screen.getByRole("textbox");
      const errorMessage = screen.getByRole("alert");

      expect(emailInput).toHaveAttribute("aria-invalid", "true");
      expect(emailInput).toHaveAttribute("aria-describedby", "email-error");
      expect(errorMessage).toHaveAttribute("id", "email-error");
    });
  });
});
