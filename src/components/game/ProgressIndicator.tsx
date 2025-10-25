interface ProgressIndicatorProps {
  current: number; // 1-5
  total: number; // Always 5
}

export function ProgressIndicator({ current, total }: ProgressIndicatorProps) {
  return (
    <div
      className="flex items-center gap-2"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Photo ${current} of ${total}`}
    >
      {Array.from({ length: total }, (_, index) => {
        const photoNumber = index + 1;
        const isActive = photoNumber === current;
        const isCompleted = photoNumber < current;

        return (
          <div
            key={photoNumber}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
              isActive
                ? "bg-blue-500 text-white ring-4 ring-blue-200 dark:ring-blue-800 scale-110"
                : isCompleted
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
            }`}
            aria-label={`Photo ${photoNumber}${isActive ? " (current)" : isCompleted ? " (completed)" : ""}`}
            aria-current={isActive ? "step" : undefined}
          >
            {isCompleted ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              photoNumber
            )}
          </div>
        );
      })}

      {/* Screen reader only text */}
      <span className="sr-only">
        Currently on photo {current} of {total}
      </span>
    </div>
  );
}
