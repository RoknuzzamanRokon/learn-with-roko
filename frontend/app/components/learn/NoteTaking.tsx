"use client";

import React, { useState, useEffect } from "react";
import { Note, NoteCreate, NoteUpdate } from "../../types/note";
import { noteService } from "../../services/noteService";

interface NoteTakingProps {
  lectureId: number;
  currentTime?: number;
  onNoteCreated?: (note: Note) => void;
  onNoteUpdated?: (note: Note) => void;
  onNoteDeleted?: (noteId: number) => void;
}

export function NoteTaking({
  lectureId,
  currentTime = 0,
  onNoteCreated,
  onNoteUpdated,
  onNoteDeleted,
}: NoteTakingProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [lectureId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const lectureNotes = await noteService.getLectureNotes(lectureId);
      setNotes(lectureNotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) return;

    try {
      setLoading(true);
      const noteData: NoteCreate = {
        lecture_id: lectureId,
        content: newNoteContent.trim(),
        timestamp: Math.floor(currentTime),
      };

      const newNote = await noteService.createNote(noteData);
      setNotes([...notes, newNote]);
      setNewNoteContent("");
      onNoteCreated?.(newNote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create note");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async (noteId: number) => {
    if (!editContent.trim()) return;

    try {
      setLoading(true);
      const updateData: NoteUpdate = {
        content: editContent.trim(),
      };

      const updatedNote = await noteService.updateNote(noteId, updateData);
      setNotes(notes.map((note) => (note.id === noteId ? updatedNote : note)));
      setEditingNote(null);
      setEditContent("");
      onNoteUpdated?.(updatedNote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update note");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      setLoading(true);
      await noteService.deleteNote(noteId);
      setNotes(notes.filter((note) => note.id !== noteId));
      onNoteDeleted?.(noteId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete note");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (note: Note) => {
    setEditingNote(note);
    setEditContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNote(null);
    setEditContent("");
  };

  const formatTimestamp = (seconds?: number) => {
    if (!seconds) return "No timestamp";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b border-gray-200 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">
            Notes ({notes.length})
          </h3>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-xs text-red-500 hover:text-red-700"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* New Note Form */}
          <div className="mb-6">
            <div className="flex items-start space-x-3">
              <div className="flex-1">
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  placeholder="Add a note at the current time..."
                  className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Timestamp: {formatTimestamp(Math.floor(currentTime))}
                  </span>
                  <button
                    onClick={handleCreateNote}
                    disabled={!newNoteContent.trim() || loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? "Adding..." : "Add Note"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-4">
            {notes.length === 0 ? (
              <div className="text-center py-8">
                <svg
                  className="w-12 h-12 text-gray-300 mx-auto mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                <p className="text-gray-500">No notes yet</p>
                <p className="text-sm text-gray-400">
                  Add your first note to get started
                </p>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  {editingNote?.id === note.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={3}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {formatTimestamp(note.timestamp)}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateNote(note.id)}
                            disabled={loading}
                            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{formatTimestamp(note.timestamp)}</span>
                          <span>•</span>
                          <span>{formatDate(note.created_at)}</span>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => startEditing(note)}
                            className="p-1 text-gray-400 hover:text-blue-600 rounded"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
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
                      </div>
                      <p className="text-gray-900 whitespace-pre-wrap">
                        {note.content}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
