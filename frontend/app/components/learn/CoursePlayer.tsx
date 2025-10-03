"use client";

import React, { useState, useEffect, useRef } from "react";
import { Lecture, CourseWithSections } from "../../types/course";
import { LectureProgressUpdate } from "../../types/enrollment";
import { NoteTaking } from "./NoteTaking";
import { ResourceDownload } from "./ResourceDownload";
import { QuizList } from "./QuizList";
import { QADiscussion } from "./QADiscussion";

interface CoursePlayerProps {
  lecture: Lecture;
  course: CourseWithSections;
  onProgressUpdate: (
    lectureId: number,
    progressData: LectureProgressUpdate
  ) => void;
}

export function CoursePlayer({
  lecture,
  course,
  onProgressUpdate,
}: CoursePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [watchTime, setWatchTime] = useState(0);
  const [lastProgressUpdate, setLastProgressUpdate] = useState(0);

  const progressUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset player state when lecture changes
    setCurrentTime(0);
    setWatchTime(0);
    setIsPlaying(false);

    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, [lecture.id]);

  useEffect(() => {
    // Update progress every 10 seconds while playing
    if (isPlaying) {
      progressUpdateInterval.current = setInterval(() => {
        setWatchTime((prev) => prev + 1);

        // Send progress update every 30 seconds
        if (watchTime > 0 && watchTime % 30 === 0) {
          const progressPercentage =
            duration > 0 ? (currentTime / duration) * 100 : 0;
          onProgressUpdate(lecture.id, {
            watch_time_seconds: watchTime,
            progress_percentage: progressPercentage,
            is_completed: progressPercentage >= 90,
          });
          setLastProgressUpdate(watchTime);
        }
      }, 1000);
    } else {
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current);
      }
    }

    return () => {
      if (progressUpdateInterval.current) {
        clearInterval(progressUpdateInterval.current);
      }
    };
  }, [
    isPlaying,
    watchTime,
    currentTime,
    duration,
    lecture.id,
    onProgressUpdate,
  ]);

  useEffect(() => {
    // Auto-hide controls after 3 seconds of inactivity
    if (showControls && isPlaying) {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
      hideControlsTimeout.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (hideControlsTimeout.current) {
        clearTimeout(hideControlsTimeout.current);
      }
    };
  }, [showControls, isPlaying]);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative bg-black">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-auto max-h-[70vh]"
        src={lecture.video_url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onMouseMove={() => setShowControls(true)}
        onClick={handlePlayPause}
      />

      {/* Video Controls Overlay */}
      {showControls && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/90 to-transparent p-4">
          {/* Progress Bar */}
          <div className="mb-4">
            <div
              className="relative h-2 bg-gray-600 rounded-full cursor-pointer hover:h-3 transition-all"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const newTime = (clickX / rect.width) * duration;
                handleSeek(newTime);
              }}
            >
              <div
                className="absolute top-0 left-0 h-full bg-primary-500 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
              <div
                className="absolute top-1/2 transform -translate-y-1/2 w-3 h-3 bg-primary-600 rounded-full shadow-lg opacity-0 hover:opacity-100 transition-opacity"
                style={{ left: `${progressPercentage}%`, marginLeft: "-6px" }}
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-4">
              {/* Play/Pause Button */}
              <button
                onClick={handlePlayPause}
                className="p-3 hover:bg-primary-600/30 rounded-full transition-colors border border-transparent hover:border-primary-400"
              >
                {isPlaying ? (
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg
                    className="w-6 h-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Time Display */}
              <span className="text-sm font-medium bg-gray-800/50 px-2 py-1 rounded">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>

              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleVolumeChange(volume > 0 ? 0 : 1)}
                  className="p-2 hover:bg-primary-600/30 rounded transition-colors"
                >
                  {volume > 0 ? (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) =>
                    handleVolumeChange(parseFloat(e.target.value))
                  }
                  className="w-20 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider-primary"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Playback Speed */}
              <select
                value={playbackRate}
                onChange={(e) =>
                  handlePlaybackRateChange(parseFloat(e.target.value))
                }
                className="bg-gray-800/50 text-white text-sm border border-gray-600 rounded px-3 py-1 hover:border-primary-400 focus:border-primary-500 focus:outline-none"
              >
                <option value={0.5} className="text-black">
                  0.5x
                </option>
                <option value={0.75} className="text-black">
                  0.75x
                </option>
                <option value={1} className="text-black">
                  1x
                </option>
                <option value={1.25} className="text-black">
                  1.25x
                </option>
                <option value={1.5} className="text-black">
                  1.5x
                </option>
                <option value={2} className="text-black">
                  2x
                </option>
              </select>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-primary-600/30 rounded-full transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lecture Info */}
      <div className="p-6 bg-white">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {lecture.title}
            </h2>
            {lecture.description && (
              <p className="text-gray-600 mb-4">{lecture.description}</p>
            )}
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-gray-600">
                  Duration: {Math.floor(lecture.duration_minutes)} minutes
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <svg
                  className="w-4 h-4 text-primary-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span className="text-primary-600 font-semibold">
                  Progress: {Math.round(progressPercentage)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Features */}
        <div className="mt-6 border-t pt-6 space-y-6">
          {/* Note Taking */}
          {course.allow_notes && (
            <NoteTaking
              lectureId={lecture.id}
              currentTime={currentTime}
              onNoteCreated={(note) => {
                console.log("Note created:", note);
              }}
              onNoteUpdated={(note) => {
                console.log("Note updated:", note);
              }}
              onNoteDeleted={(noteId) => {
                console.log("Note deleted:", noteId);
              }}
            />
          )}

          {/* Resource Downloads */}
          <ResourceDownload
            lectureId={lecture.id}
            onResourceDownloaded={(resource) => {
              console.log("Resource downloaded:", resource);
            }}
          />

          {/* Course Quizzes */}
          <QuizList
            courseId={course.id}
            onQuizSelect={(quiz) => {
              console.log("Quiz selected:", quiz);
              // This could navigate to a quiz taking page
              // For now, we'll just log it
            }}
          />

          {/* Q&A Discussion */}
          {course.allow_qa && (
            <QADiscussion
              lectureId={lecture.id}
              currentTime={currentTime}
              onQuestionCreated={(question) => {
                console.log("Question created:", question);
              }}
              onAnswerCreated={(answer) => {
                console.log("Answer created:", answer);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
