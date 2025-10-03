"use client";

import React, { useState, useRef } from "react";

interface FileUploadProps {
  onFileUploaded: (fileInfo: any) => void;
  acceptedTypes?: string;
  maxSize?: number; // in MB
  multiple?: boolean;
  className?: string;
}

interface UploadedFile {
  filename: string;
  original_filename: string;
  content_type: string;
  category: string;
  size: number;
  url: string;
}

export default function FileUpload({
  onFileUploaded,
  acceptedTypes = "video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*",
  maxSize = 100,
  multiple = false,
  className = "",
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    const maxSizeBytes = maxSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    // Check file type (basic validation)
    const allowedTypes = acceptedTypes.split(",").map((type) => type.trim());
    const fileType = file.type;
    const isAllowed = allowedTypes.some((type) => {
      if (type.endsWith("/*")) {
        const baseType = type.replace("/*", "");
        return fileType.startsWith(baseType);
      }
      return fileType === type;
    });

    if (!isAllowed) {
      return "File type not supported";
    }

    return null;
  };

  const uploadFiles = async (files: FileList) => {
    setError(null);
    setUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        throw new Error("Authentication required");
      }

      const formData = new FormData();
      const fileArray = Array.from(files);

      // Validate all files first
      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          throw new Error(`${file.name}: ${validationError}`);
        }
      }

      if (multiple && fileArray.length > 1) {
        // Multiple file upload
        fileArray.forEach((file) => {
          formData.append("files", file);
        });

        const response = await fetch("/api/files/upload-multiple", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.detail || `Upload failed: ${response.status}`
          );
        }

        const result = await response.json();
        setUploadProgress(100);

        // Handle results
        if (result.result.uploaded_files) {
          result.result.uploaded_files.forEach((file: UploadedFile) => {
            onFileUploaded(file);
          });
        }

        if (result.result.errors && result.result.errors.length > 0) {
          const errorMessages = result.result.errors
            .map((err: any) => `${err.filename}: ${err.error}`)
            .join(", ");
          setError(`Some files failed to upload: ${errorMessages}`);
        }
      } else {
        // Single file upload
        formData.append("file", fileArray[0]);

        const response = await fetch("/api/files/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.detail || `Upload failed: ${response.status}`
          );
        }

        const result = await response.json();
        setUploadProgress(100);
        onFileUploaded(result.file);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFiles(files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? "border-[var(--primary-400)] bg-[var(--primary-50)]"
            : uploading
            ? "border-[var(--gray-300)] bg-[var(--gray-50)]"
            : "border-[var(--gray-300)] hover:border-[var(--gray-400)]"
        } ${uploading ? "pointer-events-none" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary-600)] mx-auto"></div>
            <div>
              <p className="text-sm text-[var(--gray-600)] font-medium">
                Uploading...
              </p>
              {uploadProgress > 0 && (
                <div className="mt-2">
                  <div className="bg-[var(--gray-200)] rounded-full h-2">
                    <div
                      className="bg-[var(--primary-600)] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-[var(--gray-500)] mt-1">
                    {uploadProgress}%
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="mx-auto h-12 w-12 text-[var(--gray-400)]">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--gray-600)]">
                <span className="font-semibold text-[var(--primary-600)]">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-[var(--gray-500)]">
                {multiple ? "Multiple files supported" : "Single file only"} •
                Max {maxSize}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 p-3 bg-[var(--error-50)] border border-[var(--error-200)] rounded-md">
          <div className="flex items-center">
            <span className="text-[var(--error-600)] mr-2">⚠️</span>
            <p className="text-sm text-[var(--error-800)] font-medium">
              {error}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
