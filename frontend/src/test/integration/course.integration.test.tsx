import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "../mocks/server";

// Mock course catalog component (you would import the actual component)
const MockCourseCatalog = () => {
  const [courses, setCourses] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/courses");
        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }
        const data = await response.json();
        setCourses(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) return <div>Loading courses...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Course Catalog</h1>
      {courses.length === 0 ? (
        <p>No courses available</p>
      ) : (
        <div data-testid="course-list">
          {courses.map((course: any) => (
            <div key={course.id} data-testid={`course-${course.id}`}>
              <h3>{course.title}</h3>
              <p>{course.description}</p>
              <span>${course.price}</span>
              <span>{course.difficulty_level}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

describe("Course Integration Tests", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("successfully fetches and displays course catalog", async () => {
    render(<MockCourseCatalog />);

    // Initially shows loading
    expect(screen.getByText(/loading courses/i)).toBeInTheDocument();

    // Wait for courses to load
    await waitFor(() => {
      expect(screen.getByText("Course Catalog")).toBeInTheDocument();
    });

    // Check that courses are displayed
    expect(screen.getByTestId("course-list")).toBeInTheDocument();
    expect(screen.getByText("Test Course 1")).toBeInTheDocument();
    expect(screen.getByText("Test Course 2")).toBeInTheDocument();
  });

  it("handles empty course catalog", async () => {
    // Override the default handler to return empty array
    server.use(
      http.get("http://localhost:8000/api/courses", () => {
        return HttpResponse.json([]);
      })
    );

    render(<MockCourseCatalog />);

    await waitFor(() => {
      expect(screen.getByText(/no courses available/i)).toBeInTheDocument();
    });
  });

  it("handles course catalog fetch error", async () => {
    // Override the default handler to return error
    server.use(
      http.get("http://localhost:8000/api/courses", () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    render(<MockCourseCatalog />);

    await waitFor(() => {
      expect(
        screen.getByText(/error: failed to fetch courses/i)
      ).toBeInTheDocument();
    });
  });

  it("handles network error when fetching courses", async () => {
    // Override the default handler to simulate network error
    server.use(
      http.get("http://localhost:8000/api/courses", () => {
        return HttpResponse.error();
      })
    );

    render(<MockCourseCatalog />);

    await waitFor(() => {
      expect(screen.getByText(/error:/i)).toBeInTheDocument();
    });
  });

  it("successfully fetches individual course details", async () => {
    const MockCourseDetail = ({ courseId }: { courseId: number }) => {
      const [course, setCourse] = React.useState(null);
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState("");

      React.useEffect(() => {
        const fetchCourse = async () => {
          try {
            const response = await fetch(
              `http://localhost:8000/api/courses/${courseId}`
            );
            if (!response.ok) {
              throw new Error("Course not found");
            }
            const data = await response.json();
            setCourse(data);
          } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
          } finally {
            setLoading(false);
          }
        };

        fetchCourse();
      }, [courseId]);

      if (loading) return <div>Loading course...</div>;
      if (error) return <div>Error: {error}</div>;
      if (!course) return <div>Course not found</div>;

      return (
        <div>
          <h1>{(course as any).title}</h1>
          <p>{(course as any).description}</p>
          <div data-testid="course-sections">
            {(course as any).sections?.map((section: any) => (
              <div key={section.id}>
                <h3>{section.title}</h3>
                <div data-testid={`section-${section.id}-lectures`}>
                  {section.lectures?.map((lecture: any) => (
                    <div key={lecture.id}>{lecture.title}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    render(<MockCourseDetail courseId={1} />);

    await waitFor(() => {
      expect(screen.getByText("Test Course 1")).toBeInTheDocument();
    });

    expect(screen.getByTestId("course-sections")).toBeInTheDocument();
    expect(screen.getByText("Introduction")).toBeInTheDocument();
    expect(screen.getByText("Welcome")).toBeInTheDocument();
  });

  it("handles course not found error", async () => {
    // Override the default handler to return 404
    server.use(
      http.get("http://localhost:8000/api/courses/999", () => {
        return new HttpResponse(null, { status: 404 });
      })
    );

    const MockCourseDetail = ({ courseId }: { courseId: number }) => {
      const [course, setCourse] = React.useState(null);
      const [loading, setLoading] = React.useState(true);
      const [error, setError] = React.useState("");

      React.useEffect(() => {
        const fetchCourse = async () => {
          try {
            const response = await fetch(
              `http://localhost:8000/api/courses/${courseId}`
            );
            if (!response.ok) {
              throw new Error("Course not found");
            }
            const data = await response.json();
            setCourse(data);
          } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
          } finally {
            setLoading(false);
          }
        };

        fetchCourse();
      }, [courseId]);

      if (loading) return <div>Loading course...</div>;
      if (error) return <div>Error: {error}</div>;
      if (!course) return <div>Course not found</div>;

      return <div>{(course as any).title}</div>;
    };

    render(<MockCourseDetail courseId={999} />);

    await waitFor(() => {
      expect(screen.getByText(/error: course not found/i)).toBeInTheDocument();
    });
  });

  it("successfully enrolls user in a course", async () => {
    const MockEnrollmentButton = ({ courseId }: { courseId: number }) => {
      const [enrolling, setEnrolling] = React.useState(false);
      const [enrolled, setEnrolled] = React.useState(false);
      const [error, setError] = React.useState("");

      const handleEnroll = async () => {
        setEnrolling(true);
        setError("");

        try {
          const response = await fetch(
            "http://localhost:8000/api/enrollments",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer mock-token",
              },
              body: JSON.stringify({ course_id: courseId }),
            }
          );

          if (!response.ok) {
            throw new Error("Enrollment failed");
          }

          setEnrolled(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
          setEnrolling(false);
        }
      };

      if (enrolled) return <div>Successfully enrolled!</div>;
      if (error) return <div>Error: {error}</div>;

      return (
        <button
          onClick={handleEnroll}
          disabled={enrolling}
          data-testid="enroll-button"
        >
          {enrolling ? "Enrolling..." : "Enroll Now"}
        </button>
      );
    };

    render(<MockEnrollmentButton courseId={1} />);

    const enrollButton = screen.getByTestId("enroll-button");
    await user.click(enrollButton);

    await waitFor(() => {
      expect(screen.getByText(/successfully enrolled!/i)).toBeInTheDocument();
    });
  });

  it("handles enrollment failure", async () => {
    // Override the default handler to return error
    server.use(
      http.post("http://localhost:8000/api/enrollments", () => {
        return new HttpResponse(
          JSON.stringify({ detail: "Already enrolled" }),
          { status: 400 }
        );
      })
    );

    const MockEnrollmentButton = ({ courseId }: { courseId: number }) => {
      const [enrolling, setEnrolling] = React.useState(false);
      const [enrolled, setEnrolled] = React.useState(false);
      const [error, setError] = React.useState("");

      const handleEnroll = async () => {
        setEnrolling(true);
        setError("");

        try {
          const response = await fetch(
            "http://localhost:8000/api/enrollments",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer mock-token",
              },
              body: JSON.stringify({ course_id: courseId }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Enrollment failed");
          }

          setEnrolled(true);
        } catch (err) {
          setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
          setEnrolling(false);
        }
      };

      if (enrolled) return <div>Successfully enrolled!</div>;
      if (error) return <div>Error: {error}</div>;

      return (
        <button
          onClick={handleEnroll}
          disabled={enrolling}
          data-testid="enroll-button"
        >
          {enrolling ? "Enrolling..." : "Enroll Now"}
        </button>
      );
    };

    render(<MockEnrollmentButton courseId={1} />);

    const enrollButton = screen.getByTestId("enroll-button");
    await user.click(enrollButton);

    await waitFor(() => {
      expect(screen.getByText(/error: already enrolled/i)).toBeInTheDocument();
    });
  });

  it("fetches user enrollments successfully", async () => {
    const MockUserEnrollments = ({ userId }: { userId: number }) => {
      const [enrollments, setEnrollments] = React.useState([]);
      const [loading, setLoading] = React.useState(true);

      React.useEffect(() => {
        const fetchEnrollments = async () => {
          try {
            const response = await fetch(
              `http://localhost:8000/api/enrollments/user/${userId}`
            );
            const data = await response.json();
            setEnrollments(data);
          } catch (err) {
            console.error("Failed to fetch enrollments");
          } finally {
            setLoading(false);
          }
        };

        fetchEnrollments();
      }, [userId]);

      if (loading) return <div>Loading enrollments...</div>;

      return (
        <div>
          <h2>My Enrollments</h2>
          {enrollments.length === 0 ? (
            <p>No enrollments found</p>
          ) : (
            <div data-testid="enrollments-list">
              {enrollments.map((enrollment: any) => (
                <div
                  key={enrollment.id}
                  data-testid={`enrollment-${enrollment.id}`}
                >
                  <h3>{enrollment.course.title}</h3>
                  <p>Progress: {enrollment.progress_percentage}%</p>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    };

    render(<MockUserEnrollments userId={1} />);

    await waitFor(() => {
      expect(screen.getByText("My Enrollments")).toBeInTheDocument();
    });

    expect(screen.getByTestId("enrollments-list")).toBeInTheDocument();
    expect(screen.getByText("Enrolled Course")).toBeInTheDocument();
    expect(screen.getByText("Progress: 25.5%")).toBeInTheDocument();
  });
});
