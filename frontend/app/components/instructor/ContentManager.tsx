"use client";

import React, { useState, useEffect } from "react";

interface UploadedFile {
  filename: string;
  original_filename: string;
  content_type: string;
  category: string;
  size: number;
  url: string;
  uploaded_by: number;
}

interface ContentManagerProps {
  courseId?: number;
  onFileSelect?: (file: UploadedFile) => void;
  selectedFiles?: string[];
  className?: string;
}

export default function ContentManager({
  courseId,
  onFileSelect,
  selectedFiles = [],
  className = "",
}: ContentManagerProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (category: string, contentType: string): string => {
    switch (category) {
      case "video":
        return "🎥";
      case "image":
        return "🖼️";
      case "document":
        if (contentType.includes("pdf")) return "📄";
        if (contentType.includes("word")) return "📝";
        if (
          contentType.includes("powerpoint") ||
          contentType.includes("presentation")
        )
          return "�";
        return "📄";
      case "archive":
        return "📦";
      default:
        return "📄";
    }
  };

  const handleDeleteFile = async (fileUrl: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this file? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const { getAuthToken } = await import("../../utils/auth");
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await fetch("/api/files/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ file_path: fileUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to delete file");
      }

      // Remove file from local state
      setFiles(files.filter((file) => file.url !== fileUrl));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete file");
    }
  };

  const filteredFiles = files.filter((file) => {
    const matchesFilter = filter === "all" || file.category === filter;
    const matchesSearch =
      searchTerm === "" ||
      file.original_filename.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categories = [
    { value: "all", label: "All Files", count: files.length },
    {
      value: "video",
      label: "Videos",
      count: files.filter((f) => f.category === "video").length,
    },
    {
      value: "document",
      label: "Documents",
      count: files.filter((f) => f.category === "document").length,
    },
    {
      value: "image",
      label: "Images",
      count: files.filter((f) => f.category === "image").length,
    },
    {
      value: "archive",
      label: "Archives",
      count: files.filter((f) => f.category === "archive").length,
    },
  ];

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Content Library</h3>
          <div className="text-sm text-gray-500">
            {filteredFiles.length} file{filteredFiles.length !== 1 ? "s" : ""}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => setFilter(category.value)}
                className={`px-3 py-1 text-sm rounded-full border ${
                  filter === category.value
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Files Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading files...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📁</div>
            <p className="text-gray-600">
              {searchTerm || filter !== "all"
                ? "No files match your criteria"
                : "No files uploaded yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.url}
                className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                  selectedFiles.includes(file.url)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200"
                }`}
                onClick={() => onFileSelect && onFileSelect(file)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-2xl">
                    {getFileIcon(file.category, file.content_type)}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFile(file.url);
                    }}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete file"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                <h4
                  className="font-medium text-gray-900 text-sm mb-1 truncate"
                  title={file.original_filename}
                >
                  {file.original_filename}
                </h4>

                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex justify-between">
                    <span className="capitalize">{file.category}</span>
                    <span>{formatFileSize(file.size)}</span>
                  </div>
                  <div className="truncate" title={file.content_type}>
                    {file.content_type}
                  </div>
                </div>

                {/* Preview for images */}
                {file.category === "image" && (
                  <div className="mt-2">
                    <img
                      src={file.url}
                      alt={file.original_filename}
                      className="w-full h-20 object-cover rounded"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-3 flex space-x-2">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-2 py-1 text-xs text-center text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View
                  </a>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(file.url);
                    }}
                    className="flex-1 px-2 py-1 text-xs text-center text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100"
                    title="Copy URL"
                  >
                    Copy URL
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
