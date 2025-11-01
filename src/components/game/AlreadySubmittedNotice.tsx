import { useState } from "react";

interface AlreadySubmittedNoticeProps {
  onDismiss?: () => void;
}

export function AlreadySubmittedNotice({ onDismiss }: AlreadySubmittedNoticeProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (isDismissed) {
    return null;
  }

  return (
    <div
      className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 mb-4 animate-in slide-in-from-top duration-300"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        {/* Info icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-blue-500 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        {/* Message */}
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">Already Submitted Today</h3>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            You&#39;ve already submitted today&#39;s Daily Challenge. This is a practice round and won&#39;t affect your
            leaderboard position.
          </p>
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            aria-label="Dismiss notice"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
