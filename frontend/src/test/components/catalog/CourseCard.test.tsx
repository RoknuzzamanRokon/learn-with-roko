import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CourseCard } from "@/components/catalog/CourseCard";
import { Course } from "@/types/course";

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

describe("CourseCard", () => {
  const mockCourse: Course = {
    id: 1,
    title: "Test Course Title",
    description:
      "This is a test course description that should be displayed in the card.",
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
    total_duration: 120, // 2 hours
    total_lectures: 15,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  it("renders course card with all basic information", () => {
    render(<CourseCard course={mockCourse} />);

    expect(screen.getByText("Test Course Title")).toBeInTheDocument();
    expect(screen.getByText("Short test description")).toBeInTheDocument();
    expect(screen.getByText("$99.99")).toBeInTheDocument();
    expect(screen.getByText("Beginner")).toBeInTheDocument();
    expect(screen.getByText("2h 0m")).toBeInTheDocument();
    expect(screen.getByText("15 lectures")).toBeInTheDocument();
  });

  it("displays course thumbnail when provided", () => {
    render(<CourseCard course={mockCourse} />);

    const thumbnail = screen.getByAltText("Test Course Title");
    expect(thumbnail).toBeInTheDocument();
    expect(thumbnail).toHaveAttribute(
      "src",
      "https://example.com/thumbnail.jpg"
    );
  });

  it("displays fallback thumbnail when no image provided", () => {
    const courseWithoutThumbnail = { ...mockCourse, thumbnail_url: "" };
    render(<CourseCard course={courseWithoutThumbnail} />);

    expect(screen.getByText("T")).toBeInTheDocument(); // First letter of title
  });

  it("displays featured badge when course is featured", () => {
    const featuredCourse = { ...mockCourse, is_featured: true };
    render(<CourseCard course={featuredCourse} />);

    expect(screen.getByText("Featured")).toBeInTheDocument();
  });

  it("does not display featured badge when course is not featured", () => {
    render(<CourseCard course={mockCourse} />);

    expect(screen.queryByText("Featured")).not.toBeInTheDocument();
  });

  it("formats free course price correctly", () => {
    const freeCourse = { ...mockCourse, price: 0 };
    render(<CourseCard course={freeCourse} />);

    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("formats paid course price correctly", () => {
    const paidCourse = { ...mockCourse, price: 149.5 };
    render(<CourseCard course={paidCourse} />);

    expect(screen.getByText("$149.50")).toBeInTheDocument();
  });

  it("formats duration correctly for hours and minutes", () => {
    const courseWithDuration = { ...mockCourse, total_duration: 150 }; // 2h 30m
    render(<CourseCard course={courseWithDuration} />);

    expect(screen.getByText("2h 30m")).toBeInTheDocument();
  });

  it("formats duration correctly for minutes only", () => {
    const courseWithDuration = { ...mockCourse, total_duration: 45 }; // 45m
    render(<CourseCard course={courseWithDuration} />);

    expect(screen.getByText("45m")).toBeInTheDocument();
  });

  it("applies correct difficulty level styling for beginner", () => {
    render(<CourseCard course={mockCourse} />);

    const difficultyBadge = screen.getByText("Beginner");
    expect(difficultyBadge).toHaveClass("bg-green-100", "text-green-800");
  });

  it("applies correct difficulty level styling for intermediate", () => {
    const intermediateCourse = {
      ...mockCourse,
      difficulty_level: "intermediate",
    };
    render(<CourseCard course={intermediateCourse} />);

    const difficultyBadge = screen.getByText("Intermediate");
    expect(difficultyBadge).toHaveClass("bg-yellow-100", "text-yellow-800");
  });

  it("applies correct difficulty level styling for advanced", () => {
    const advancedCourse = { ...mockCourse, difficulty_level: "advanced" };
    render(<CourseCard course={advancedCourse} />);

    const difficultyBadge = screen.getByText("Advanced");
    expect(difficultyBadge).toHaveClass("bg-red-100", "text-red-800");
  });

  it("applies default styling for unknown difficulty level", () => {
    const unknownDifficultyCourse = {
      ...mockCourse,
      difficulty_level: "unknown",
    };
    render(<CourseCard course={unknownDifficultyCourse} />);

    const difficultyBadge = screen.getByText("Unknown");
    expect(difficultyBadge).toHaveClass("bg-gray-100", "text-gray-800");
  });

  it("creates correct link to course detail page", () => {
    render(<CourseCard course={mockCourse} />);

    const viewCourseLink = screen.getByRole("link", { name: /view course/i });
    expect(viewCourseLink).toHaveAttribute("href", "/catalog/1");
  });

  it("uses short description when available, falls back to description", () => {
    render(<CourseCard course={mockCourse} />);

    expect(screen.getByText("Short test description")).toBeInTheDocument();
    expect(
      screen.queryByText("This is a test course description")
    ).not.toBeInTheDocument();
  });

  it("uses description when short description is not available", () => {
    const courseWithoutShortDesc = {
      ...mockCourse,
      short_description: undefined,
    };
    render(<CourseCard course={courseWithoutShortDesc} />);

    expect(
      screen.getByText(/This is a test course description/)
    ).toBeInTheDocument();
  });

  it("displays correct number of lectures", () => {
    const courseWithLectures = { ...mockCourse, total_lectures: 25 };
    render(<CourseCard course={courseWithLectures} />);

    expect(screen.getByText("25 lectures")).toBeInTheDocument();
  });

  it("has proper accessibility attributes", () => {
    render(<CourseCard course={mockCourse} />);

    const thumbnail = screen.getByAltText("Test Course Title");
    expect(thumbnail).toBeInTheDocument();

    const viewCourseLink = screen.getByRole("link", { name: /view course/i });
    expect(viewCourseLink).toBeInTheDocument();
  });

  it("applies hover effects correctly", () => {
    render(<CourseCard course={mockCourse} />);

    const card = screen
      .getByText("Test Course Title")
      .closest("div")?.parentElement;
    expect(card).toHaveClass("hover:shadow-lg", "transition-shadow");

    const viewButton = screen.getByRole("link", { name: /view course/i });
    expect(viewButton).toHaveClass("hover:bg-blue-700", "transition-colors");
  });

  it("truncates long titles and descriptions appropriately", () => {
    const longTitleCourse = {
      ...mockCourse,
      title:
        "This is a very long course title that should be truncated when displayed in the card component",
      short_description:
        "This is a very long description that should also be truncated when displayed in the course card component to maintain proper layout and readability",
    };
    render(<CourseCard course={longTitleCourse} />);

    const titleElement = screen.getByText(/This is a very long course title/);
    const descElement = screen.getByText(/This is a very long description/);

    expect(titleElement).toHaveClass("line-clamp-2");
    expect(descElement).toHaveClass("line-clamp-2");
  });
});
