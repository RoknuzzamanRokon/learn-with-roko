"use client";

import React, { useState, useEffect } from "react";
import {
  Section,
  SectionCreate,
  SectionUpdate,
  SectionFormData,
  Lecture,
  LectureCreate,
  LectureUpdate,
  LectureFormData,
  LectureType,
} from "../../types/course";
import { courseService } from "../../services/courseService";
import FileUpload from "./FileUpload";

interface CurriculumEditorProps {
  courseId: number;
  sections: Section[];
  onSectionsChange: (sections: Section[]) => void;
}

const LECTURE_TYPE_OPTIONS: { value: LectureType; label: string }[] = [
  { value: "video", label: "Video" },
  { value: "text", label: "Text/Article" },
  { value: "quiz", label: "Quiz" },
  { value: "assignment", label: "Assignment" },
  { value: "resource", label: "Resource/Download" },
];

export default function CurriculumEditor({
  courseId,
  sections,
  onSectionsChange,
}: CurriculumEditorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set()
  );
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [editingLecture, setEditingLecture] = useState<number | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAddLecture, setShowAddLecture] = useState<number | null>(null);
  const [sectionLectures, setSectionLectures] = useState<
    Record<number, Lecture[]>
  >({});

  // Form states
  const [sectionFormData, setSectionFormData] = useState<SectionFormData>({
    title: "",
    description: "",
    order_index: 0,
  });

  const [lectureFormData, setLectureFormData] = useState<LectureFormData>({
    title: "",
    description: "",
    lecture_type: "video",
    order_index: 0,
    duration: "0",
    video_url: "",
    content_url: "",
    is_preview: false,
    is_downloadable: false,
  });

  useEffect(() => {
    // Load lectures for all sections
    sections.forEach((section) => {
      if (!sectionLectures[section.id]) {
        loadSectionLectures(section.id);
      }
    });
  }, [sections]);

  const loadSectionLectures = async (sectionId: number) => {
    try {
      const lectures = await courseService.getSectionLectures(sectionId);
      setSectionLectures((prev) => ({ ...prev, [sectionId]: lectures }));
    } catch (err) {
      console.error(`Failed to load lectures for section ${sectionId}:`, err);
    }
  };

  const toggleSection = (sectionId: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
      // Load lectures if not already loaded
      if (!sectionLectures[sectionId]) {
        loadSectionLectures(sectionId);
      }
    }
    setExpandedSections(newExpanded);
  };

  // Section handlers
  const handleAddSection = () => {
    setSectionFormData({
      title: "",
      description: "",
      order_index: sections.length,
    });
    setShowAddSection(true);
    setEditingSection(null);
  };

  const handleEditSection = (section: Section) => {
    setSectionFormData({
      title: section.title,
      description: section.description || "",
      order_index: section.order_index,
    });
    setEditingSection(section.id);
    setShowAddSection(true);
  };

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (editingSection) {
        // Update existing section
        const updatedSection = await courseService.updateSection(
          editingSection,
          {
            title: sectionFormData.title.trim(),
            description: sectionFormData.description.trim() || undefined,
            order_index: sectionFormData.order_index,
          }
        );

        const updatedSections = sections.map((s) =>
          s.id === editingSection ? updatedSection : s
        );
        onSectionsChange(updatedSections);
      } else {
        // Create new section
        const newSection = await courseService.createSection(courseId, {
          title: sectionFormData.title.trim(),
          description: sectionFormData.description.trim() || undefined,
          order_index: sectionFormData.order_index,
        });

        onSectionsChange([...sections, newSection]);
      }

      setShowAddSection(false);
      setEditingSection(null);
      setSectionFormData({ title: "", description: "", order_index: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save section");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this section? All lectures in this section will also be deleted."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      await courseService.deleteSection(sectionId);
      const updatedSections = sections.filter((s) => s.id !== sectionId);
      onSectionsChange(updatedSections);

      // Remove lectures from state
      const newSectionLectures = { ...sectionLectures };
      delete newSectionLectures[sectionId];
      setSectionLectures(newSectionLectures);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete section");
    } finally {
      setLoading(false);
    }
  };

  // Lecture handlers
  const handleAddLecture = (sectionId: number) => {
    const sectionLectureCount = sectionLectures[sectionId]?.length || 0;
    setLectureFormData({
      title: "",
      description: "",
      lecture_type: "video",
      order_index: sectionLectureCount,
      duration: "0",
      video_url: "",
      content_url: "",
      is_preview: false,
      is_downloadable: false,
    });
    setShowAddLecture(sectionId);
    setEditingLecture(null);
  };

  const handleEditLecture = (lecture: Lecture) => {
    setLectureFormData({
      title: lecture.title,
      description: lecture.description || "",
      lecture_type: lecture.lecture_type,
      order_index: lecture.order_index,
      duration: lecture.duration.toString(),
      video_url: lecture.video_url || "",
      content_url: lecture.content_url || "",
      is_preview: lecture.is_preview,
      is_downloadable: lecture.is_downloadable,
    });
    setEditingLecture(lecture.id);
    setShowAddLecture(lecture.section_id);
  };

  const handleLectureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const lectureData = {
        title: lectureFormData.title.trim(),
        description: lectureFormData.description.trim() || undefined,
        lecture_type: lectureFormData.lecture_type,
        order_index: lectureFormData.order_index,
        duration: parseInt(lectureFormData.duration) || 0,
        video_url: lectureFormData.video_url.trim() || undefined,
        content_url: lectureFormData.content_url.trim() || undefined,
        is_preview: lectureFormData.is_preview,
        is_downloadable: lectureFormData.is_downloadable,
      };

      if (editingLecture) {
        // Update existing lecture
        const updatedLecture = await courseService.updateLecture(
          editingLecture,
          lectureData
        );
        const sectionId = updatedLecture.section_id;
        const updatedLectures = sectionLectures[sectionId].map((l) =>
          l.id === editingLecture ? updatedLecture : l
        );
        setSectionLectures((prev) => ({
          ...prev,
          [sectionId]: updatedLectures,
        }));
      } else {
        // Create new lecture
        const sectionId = showAddLecture!;
        const newLecture = await courseService.createLecture(
          sectionId,
          lectureData
        );
        const currentLectures = sectionLectures[sectionId] || [];
        setSectionLectures((prev) => ({
          ...prev,
          [sectionId]: [...currentLectures, newLecture],
        }));
      }

      setShowAddLecture(null);
      setEditingLecture(null);
      setLectureFormData({
        title: "",
        description: "",
        lecture_type: "video",
        order_index: 0,
        duration: "0",
        video_url: "",
        content_url: "",
        is_preview: false,
        is_downloadable: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save lecture");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLecture = async (lectureId: number, sectionId: number) => {
    if (!confirm("Are you sure you want to delete this lecture?")) {
      return;
    }

    setLoading(true);
    try {
      await courseService.deleteLecture(lectureId);
      const updatedLectures = sectionLectures[sectionId].filter(
        (l) => l.id !== lectureId
      );
      setSectionLectures((prev) => ({ ...prev, [sectionId]: updatedLectures }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete lecture");
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Course Curriculum
        </h2>
        <button
          onClick={handleAddSection}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={loading}
        >
          Add Section
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Section Form Modal */}
      {showAddSection && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingSection ? "Edit Section" : "Add New Section"}
            </h3>

            <form onSubmit={handleSectionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Title *
                </label>
                <input
                  type="text"
                  value={sectionFormData.title}
                  onChange={(e) =>
                    setSectionFormData((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={sectionFormData.description}
                  onChange={(e) =>
                    setSectionFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddSection(false);
                    setEditingSection(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? "Saving..." : editingSection ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lecture Form Modal */}
      {showAddLecture && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {editingLecture ? "Edit Lecture" : "Add New Lecture"}
            </h3>

            <form onSubmit={handleLectureSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lecture Title *
                  </label>
                  <input
                    type="text"
                    value={lectureFormData.title}
                    onChange={(e) =>
                      setLectureFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={lectureFormData.lecture_type}
                    onChange={(e) =>
                      setLectureFormData((prev) => ({
                        ...prev,
                        lecture_type: e.target.value as LectureType,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LECTURE_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={lectureFormData.duration}
                    onChange={(e) =>
                      setLectureFormData((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={lectureFormData.description}
                    onChange={(e) =>
                      setLectureFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Video URL
                  </label>
                  <input
                    type="url"
                    value={lectureFormData.video_url}
                    onChange={(e) =>
                      setLectureFormData((prev) => ({
                        ...prev,
                        video_url: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content URL
                  </label>
                  <input
                    type="url"
                    value={lectureFormData.content_url}
                    onChange={(e) =>
                      setLectureFormData((prev) => ({
                        ...prev,
                        content_url: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Or upload a file below"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Content File
                  </label>
                  <FileUpload
                    onFileUploaded={(fileInfo) => {
                      if (fileInfo.category === "video") {
                        setLectureFormData((prev) => ({
                          ...prev,
                          video_url: fileInfo.url,
                        }));
                      } else {
                        setLectureFormData((prev) => ({
                          ...prev,
                          content_url: fileInfo.url,
                        }));
                      }
                    }}
                    acceptedTypes="video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain,application/zip"
                    maxSize={100}
                    multiple={false}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload videos, documents, or other course materials. Files
                    will be automatically assigned to the appropriate URL field.
                  </p>
                </div>

                <div className="md:col-span-2 flex items-center space-x-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={lectureFormData.is_preview}
                      onChange={(e) =>
                        setLectureFormData((prev) => ({
                          ...prev,
                          is_preview: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Free Preview
                    </span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={lectureFormData.is_downloadable}
                      onChange={(e) =>
                        setLectureFormData((prev) => ({
                          ...prev,
                          is_downloadable: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Downloadable
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddLecture(null);
                    setEditingLecture(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  disabled={loading}
                >
                  {loading ? "Saving..." : editingLecture ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sections List */}
      <div className="space-y-4">
        {sections.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No sections yet. Add your first section to get started.
          </div>
        ) : (
          sections.map((section) => (
            <div key={section.id} className="border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between p-4 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {expandedSections.has(section.id) ? "▼" : "▶"}
                  </button>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {section.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {section.total_lectures} lectures •{" "}
                      {formatDuration(section.total_duration)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleAddLecture(section.id)}
                    className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                  >
                    Add Lecture
                  </button>
                  <button
                    onClick={() => handleEditSection(section)}
                    className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteSection(section.id)}
                    className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {expandedSections.has(section.id) && (
                <div className="border-t border-gray-200">
                  {sectionLectures[section.id]?.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No lectures yet. Add your first lecture.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {sectionLectures[section.id]?.map((lecture) => (
                        <div
                          key={lecture.id}
                          className="flex items-center justify-between p-4"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">
                                {lecture.lecture_type === "video"
                                  ? "▶"
                                  : lecture.lecture_type === "quiz"
                                  ? "?"
                                  : lecture.lecture_type === "assignment"
                                  ? "✎"
                                  : "📄"}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {lecture.title}
                              </h4>
                              <div className="flex items-center space-x-2 text-sm text-gray-500">
                                <span className="capitalize">
                                  {lecture.lecture_type}
                                </span>
                                <span>•</span>
                                <span>{formatDuration(lecture.duration)}</span>
                                {lecture.is_preview && (
                                  <>
                                    <span>•</span>
                                    <span className="text-green-600">
                                      Preview
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEditLecture(lecture)}
                              className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteLecture(lecture.id, section.id)
                              }
                              className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded hover:bg-red-100"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
