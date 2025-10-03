"use client";

import React from "react";

interface RecentActivityProps {
  activities: Array<{
    type: string;
    course_id: number;
    course_title: string;
    lecture_id: number;
    lecture_title: string;
    section_title: string;
    timestamp: string;
    watch_time: number;
    is_completed: boolean;
  }>;
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor(
      (now.getTime() - activityTime.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return activityTime.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatWatchTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) return `${remainingSeconds}s`;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getActivityIcon = (type: string, isCompleted: boolean) => {
    if (isCompleted) {
      return (
        <div className="flex-shrink-0 w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
          <svg
            className="w-4 h-4 text-success-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );
    }

    return (
      <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
        <svg
          className="w-4 h-4 text-primary-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9-4V8a3 3 0 013-3h6a3 3 0 013 3v2M7 21h10a2 2 0 002-2V9a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  };

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg
              className="mx-auto h-8 w-8"
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
          </div>
          <p className="text-sm text-gray-500">No recent activity</p>
          <p className="text-xs text-gray-400 mt-1">
            Start learning to see your progress here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Recent Activity
      </h3>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          <div key={index} className="flex items-start space-x-3">
            {getActivityIcon(activity.type, activity.is_completed)}
            <div className="flex-1 min-w-0">
              <div className="text-sm">
                <span className="font-medium text-gray-900">
                  {activity.is_completed ? "Completed" : "Watched"}
                </span>
                <span className="text-gray-600"> {activity.lecture_title}</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                <span className="font-medium">{activity.course_title}</span>
                <span className="mx-1">•</span>
                <span>{activity.section_title}</span>
              </div>
              <div className="flex items-center text-xs text-gray-400 mt-1">
                <span>{formatTimeAgo(activity.timestamp)}</span>
                {activity.watch_time > 0 && (
                  <>
                    <span className="mx-1">•</span>
                    <span>{formatWatchTime(activity.watch_time)} watched</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() =>
                (window.location.href = `/learn/${activity.course_id}?lecture=${activity.lecture_id}`)
              }
              className="text-xs text-primary-600 hover:text-primary-800 font-medium"
            >
              Continue
            </button>
          </div>
        ))}
      </div>

      {activities.length >= 5 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => (window.location.href = "/activity")}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            View all activity →
          </button>
        </div>
      )}
    </div>
  );
}
