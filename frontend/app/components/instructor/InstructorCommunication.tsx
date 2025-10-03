"use client";

import React, { useState, useEffect } from "react";
import {
  communicationService,
  Announcement,
  AnnouncementCreate,
  BulkMessage,
  BulkMessageCreate,
  Message,
  MessageCreate,
  CommunicationStats,
} from "../../services/communicationService";
import { courseService } from "../../services/courseService";
import { Course } from "../../types/course";

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-medium text-sm rounded-lg ${
      active
        ? "bg-blue-600 text-white"
        : "text-gray-600 hover:text-gray-800 hover:bg-gray-100"
    }`}
  >
    {children}
  </button>
);

interface AnnouncementFormProps {
  courses: Course[];
  onSubmit: (data: AnnouncementCreate) => void;
  loading: boolean;
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({
  courses,
  onSubmit,
  loading,
}) => {
  const [formData, setFormData] = useState<AnnouncementCreate>({
    title: "",
    content: "",
    course_id: 0,
    announcement_type: "general",
    priority: "normal",
    is_published: true,
    is_pinned: false,
    send_email: false,
    send_notification: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.course_id === 0) {
      alert("Please select a course");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Create Announcement
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course
          </label>
          <select
            value={formData.course_id}
            onChange={(e) =>
              setFormData({ ...formData, course_id: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value={0}>Select a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content
          </label>
          <textarea
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              value={formData.announcement_type}
              onChange={(e) =>
                setFormData({ ...formData, announcement_type: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="general">General</option>
              <option value="course_update">Course Update</option>
              <option value="assignment">Assignment</option>
              <option value="quiz">Quiz</option>
              <option value="deadline">Deadline</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_pinned}
              onChange={(e) =>
                setFormData({ ...formData, is_pinned: e.target.checked })
              }
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Pin announcement</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.send_email}
              onChange={(e) =>
                setFormData({ ...formData, send_email: e.target.checked })
              }
              className="mr-2"
            />
            <span className="text-sm text-gray-700">
              Send email notification
            </span>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Announcement"}
          </button>
        </div>
      </form>
    </div>
  );
};

interface BulkMessageFormProps {
  courses: Course[];
  onSubmit: (data: BulkMessageCreate) => void;
  loading: boolean;
}

const BulkMessageForm: React.FC<BulkMessageFormProps> = ({
  courses,
  onSubmit,
  loading,
}) => {
  const [formData, setFormData] = useState<BulkMessageCreate>({
    subject: "",
    content: "",
    course_id: 0,
    recipient_filter: "all",
    send_email: false,
    send_notification: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.course_id === 0) {
      alert("Please select a course");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Send Bulk Message
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Course
          </label>
          <select
            value={formData.course_id}
            onChange={(e) =>
              setFormData({ ...formData, course_id: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value={0}>Select a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipients
          </label>
          <select
            value={formData.recipient_filter}
            onChange={(e) =>
              setFormData({ ...formData, recipient_filter: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Students</option>
            <option value="active">Active Students (last 30 days)</option>
            <option value="completed">Students who completed the course</option>
            <option value="struggling">
              Students with low progress (&lt;25%)
            </option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject
          </label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) =>
              setFormData({ ...formData, subject: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex items-center space-x-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.send_email}
              onChange={(e) =>
                setFormData({ ...formData, send_email: e.target.checked })
              }
              className="mr-2"
            />
            <span className="text-sm text-gray-700">
              Send email notification
            </span>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Bulk Message"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default function InstructorCommunication() {
  const [activeTab, setActiveTab] = useState("announcements");
  const [courses, setCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [bulkMessages, setBulkMessages] = useState<BulkMessage[]>([]);
  const [stats, setStats] = useState<CommunicationStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [coursesResponse, statsResponse] = await Promise.all([
        courseService.getMyCourses(1, 100),
        communicationService.getCommunicationStats(),
      ]);

      setCourses(coursesResponse.courses);
      setStats(statsResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (data: AnnouncementCreate) => {
    try {
      setLoading(true);
      const announcement = await communicationService.createAnnouncement(data);
      setAnnouncements([announcement, ...announcements]);
      alert("Announcement created successfully!");
    } catch (err) {
      alert(
        err instanceof Error ? err.message : "Failed to create announcement"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSendBulkMessage = async (data: BulkMessageCreate) => {
    try {
      setLoading(true);
      const bulkMessage = await communicationService.sendBulkMessage(data);
      setBulkMessages([bulkMessage, ...bulkMessages]);
      alert(
        `Bulk message sent successfully to ${bulkMessage.total_recipients} students!`
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send bulk message");
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Communication
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadInitialData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Communication Center
            </h1>
            <p className="mt-2 text-gray-600">
              Manage announcements and communicate with your students
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Announcements
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total_announcements}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Messages
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total_sent_messages}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Bulk Messages
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.total_bulk_messages}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-orange-100">
                    <svg
                      className="w-6 h-6 text-orange-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h10V9H4v2zM4 7h10V5H4v2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Unread Messages
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.unread_messages}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-8">
            <div className="flex space-x-4">
              <TabButton
                active={activeTab === "announcements"}
                onClick={() => setActiveTab("announcements")}
              >
                Announcements
              </TabButton>
              <TabButton
                active={activeTab === "bulk-messages"}
                onClick={() => setActiveTab("bulk-messages")}
              >
                Bulk Messages
              </TabButton>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "announcements" && (
            <AnnouncementForm
              courses={courses}
              onSubmit={handleCreateAnnouncement}
              loading={loading}
            />
          )}

          {activeTab === "bulk-messages" && (
            <BulkMessageForm
              courses={courses}
              onSubmit={handleSendBulkMessage}
              loading={loading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
