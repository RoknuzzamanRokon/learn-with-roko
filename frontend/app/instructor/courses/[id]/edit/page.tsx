"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Course, Section } from "../../../../types/course";
import { courseService } from "../../../../services/courseService";
import RoleGuard from "../../../../components/auth/RoleGuard";
import CourseBuilder from "../../../../components/instructor/CourseBuilder";
import CurriculumEditor from "../../../../components/instructor/CurriculumEditor";

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = parseInt(params.id as string);

  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "curriculum">(
    "details"
  );

  useEffect(() => {
    if (courseId) {
      loadCourse();
    }
  }, [courseId]);

  const loadCourse = async () => {
    try {
      setLoading(true);
      const courseData = await courseService.getCourseById(courseId, true);
      setCourse(courseData as Course);

      // Load sections separately for better control
      const sectionsData = await courseService.getCourseSections(courseId);
      setSections(sectionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const handleCourseUpdate = (updatedCourse: Course) => {
    setCourse(updatedCourse);
  };

  const handleSectionsChange = (updatedSections: Section[]) => {
    setSections(updatedSections);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Course not found"}</p>
          <button
            onClick={() => router.push("/instructor/courses")}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={["instructor", "super_admin"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {course.title}
                  </h1>
                  <p className="mt-2 text-gray-600">
                    Status:{" "}
                    <span
                      className={`capitalize ${
                        course.status === "published"
                          ? "text-green-600"
                          : course.status === "draft"
                          ? "text-yellow-600"
                          : "text-gray-600"
                      }`}
                    >
                      {course.status}
                    </span>
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => router.push("/instructor/courses")}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Back to Courses
                  </button>
                  {course.status === "draft" && (
                    <button
                      onClick={async () => {
                        try {
                          const updatedCourse =
                            await courseService.updateCourseStatus(courseId, {
                              status: "published",
                            });
                          setCourse(updatedCourse);
                        } catch (err) {
                          alert("Failed to publish course");
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                    >
                      Publish Course
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-8">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "details"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Course Details
                </button>
                <button
                  onClick={() => setActiveTab("curriculum")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "curriculum"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Curriculum
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "details" && (
              <CourseBuilder
                course={course}
                onSave={handleCourseUpdate}
                onCancel={() => router.push("/instructor/courses")}
              />
            )}

            {activeTab === "curriculum" && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <CurriculumEditor
                  courseId={courseId}
                  sections={sections}
                  onSectionsChange={handleSectionsChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
