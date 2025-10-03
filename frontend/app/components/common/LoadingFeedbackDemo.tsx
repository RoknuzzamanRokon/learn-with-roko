"use client";

import React, { useState } from "react";
import {
  LoadingSpinner,
  ProgressBar,
  SkeletonLoader,
  SkeletonCard,
  SkeletonList,
  LoadingOverlay,
  InlineLoader,
  ButtonLoader,
  Toast,
  ToastProvider,
  useToastHelpers,
  Alert,
  Banner,
  Modal,
  ConfirmationModal,
} from "./index";

const LoadingFeedbackDemo: React.FC = () => {
  const [progress, setProgress] = useState(45);
  const [showOverlay, setShowOverlay] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false);

  return (
    <ToastProvider>
      <LoadingFeedbackDemoContent
        progress={progress}
        setProgress={setProgress}
        showOverlay={showOverlay}
        setShowOverlay={setShowOverlay}
        showBanner={showBanner}
        setShowBanner={setShowBanner}
        showModal={showModal}
        setShowModal={setShowModal}
        showConfirmModal={showConfirmModal}
        setShowConfirmModal={setShowConfirmModal}
        isButtonLoading={isButtonLoading}
        setIsButtonLoading={setIsButtonLoading}
      />
    </ToastProvider>
  );
};

const LoadingFeedbackDemoContent: React.FC<{
  progress: number;
  setProgress: (value: number) => void;
  showOverlay: boolean;
  setShowOverlay: (value: boolean) => void;
  showBanner: boolean;
  setShowBanner: (value: boolean) => void;
  showModal: boolean;
  setShowModal: (value: boolean) => void;
  showConfirmModal: boolean;
  setShowConfirmModal: (value: boolean) => void;
  isButtonLoading: boolean;
  setIsButtonLoading: (value: boolean) => void;
}> = ({
  progress,
  setProgress,
  showOverlay,
  setShowOverlay,
  showBanner,
  setShowBanner,
  showModal,
  setShowModal,
  showConfirmModal,
  setShowConfirmModal,
  isButtonLoading,
  setIsButtonLoading,
}) => {
  const { success, error, warning, info } = useToastHelpers();

  const handleButtonLoading = () => {
    setIsButtonLoading(true);
    setTimeout(() => setIsButtonLoading(false), 3000);
  };

  const handleOverlayDemo = () => {
    setShowOverlay(true);
    setTimeout(() => setShowOverlay(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Loading States & Feedback Components Demo
        </h1>
        <p className="text-gray-600">
          Comprehensive showcase of loading indicators and notification
          components
        </p>
      </div>

      {/* Loading Spinners */}
      <section className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Loading Spinners</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <LoadingSpinner size="sm" color="primary" />
            <p className="mt-2 text-sm text-gray-600">Small Primary</p>
          </div>
          <div className="text-center">
            <LoadingSpinner size="md" color="success" />
            <p className="mt-2 text-sm text-gray-600">Medium Success</p>
          </div>
          <div className="text-center">
            <LoadingSpinner size="lg" color="warning" />
            <p className="mt-2 text-sm text-gray-600">Large Warning</p>
          </div>
          <div className="text-center">
            <LoadingSpinner size="xl" color="error" />
            <p className="mt-2 text-sm text-gray-600">XL Error</p>
          </div>
        </div>
      </section>

      {/* Progress Bars */}
      <section className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Progress Bars</h2>
        <div className="space-y-4">
          <div>
            <ProgressBar
              progress={progress}
              color="primary"
              showLabel
              label="Upload Progress"
            />
          </div>
          <div>
            <ProgressBar progress={75} color="success" size="sm" />
          </div>
          <div>
            <ProgressBar progress={30} color="warning" size="lg" animated />
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setProgress(Math.max(0, progress - 10))}
              className="btn-base btn-secondary btn-sm"
            >
              -10%
            </button>
            <button
              onClick={() => setProgress(Math.min(100, progress + 10))}
              className="btn-base btn-primary btn-sm"
            >
              +10%
            </button>
          </div>
        </div>
      </section>

      {/* Skeleton Loaders */}
      <section className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Skeleton Loaders</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Individual Skeletons</h3>
            <div className="space-y-3">
              <SkeletonLoader variant="text" />
              <SkeletonLoader variant="text" lines={3} />
              <SkeletonLoader variant="circular" width="3rem" height="3rem" />
              <SkeletonLoader variant="rectangular" height="8rem" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3">Skeleton Card</h3>
            <SkeletonCard />
          </div>
        </div>
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-3">Skeleton List</h3>
          <SkeletonList items={3} />
        </div>
      </section>

      {/* Inline Loaders */}
      <section className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Inline Loaders</h2>
        <div className="space-y-4">
          <InlineLoader message="Loading content..." />
          <div className="flex space-x-4">
            <button
              onClick={handleButtonLoading}
              className="btn-base btn-primary btn-md"
              disabled={isButtonLoading}
            >
              <ButtonLoader
                isLoading={isButtonLoading}
                loadingText="Processing..."
              >
                Submit Form
              </ButtonLoader>
            </button>
            <button
              onClick={handleOverlayDemo}
              className="btn-base btn-secondary btn-md"
            >
              Show Loading Overlay
            </button>
          </div>
        </div>
      </section>

      {/* Alerts */}
      <section className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Alert Components</h2>
        <div className="space-y-4">
          <Alert
            type="success"
            title="Success!"
            message="Your changes have been saved successfully."
            showIcon
          />
          <Alert
            type="warning"
            title="Warning"
            message="Please review your input before proceeding."
            variant="outlined"
            showIcon
          />
          <Alert
            type="error"
            message="An error occurred while processing your request."
            variant="filled"
            showIcon
            closable
          />
          <Alert type="info" variant="soft" showIcon>
            <p>This is a custom alert with children content.</p>
            <button className="mt-2 text-sm underline">Learn more</button>
          </Alert>
        </div>
      </section>

      {/* Toast Notifications */}
      <section className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Toast Notifications</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => success("Operation completed successfully!")}
            className="btn-base btn-success btn-sm"
          >
            Success Toast
          </button>
          <button
            onClick={() => error("Something went wrong!", "Error")}
            className="btn-base btn-error btn-sm"
          >
            Error Toast
          </button>
          <button
            onClick={() => warning("Please check your input", "Warning")}
            className="btn-base btn-warning btn-sm"
          >
            Warning Toast
          </button>
          <button
            onClick={() => info("Here is some information", "Info")}
            className="btn-base btn-primary btn-sm"
          >
            Info Toast
          </button>
        </div>
      </section>

      {/* Banner */}
      <section className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Banner Component</h2>
        <button
          onClick={() => setShowBanner(true)}
          className="btn-base btn-primary btn-md"
        >
          Show Banner
        </button>
      </section>

      {/* Modals */}
      <section className="bg-white p-6 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Modal Components</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowModal(true)}
            className="btn-base btn-primary btn-md"
          >
            Show Modal
          </button>
          <button
            onClick={() => setShowConfirmModal(true)}
            className="btn-base btn-error btn-md"
          >
            Show Confirmation
          </button>
        </div>
      </section>

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={showOverlay}
        message="Processing your request..."
        size="lg"
        backdrop="blur"
      />

      {/* Banner */}
      {showBanner && (
        <Banner
          type="info"
          title="System Maintenance"
          message="We will be performing scheduled maintenance tonight from 2-4 AM EST."
          onClose={() => setShowBanner(false)}
          actionButton={{
            text: "Learn More",
            onClick: () => alert("More info clicked"),
            variant: "secondary",
          }}
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Example Modal"
        size="md"
        footer={
          <>
            <button
              onClick={() => setShowModal(false)}
              className="btn-base btn-secondary btn-md"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="btn-base btn-primary btn-md"
            >
              Save Changes
            </button>
          </>
        }
      >
        <p className="text-gray-700">
          This is an example modal with consistent color theming. You can
          include any content here, including forms, images, or other
          components.
        </p>
      </Modal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {
          alert("Confirmed!");
          setShowConfirmModal(false);
        }}
        title="Confirm Deletion"
        message="Are you sure you want to delete this item? This action cannot be undone."
        type="danger"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default LoadingFeedbackDemo;
