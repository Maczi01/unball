import { useState } from "react";
import type { DailySetPhotoDTO } from "@/types";

interface PhotoDisplayProps {
  photo: DailySetPhotoDTO;
  currentIndex: number; // 0-4
  totalPhotos: number; // Always 5
  onLoad?: () => void;
}

export function PhotoDisplay({ photo, currentIndex, totalPhotos, onLoad }: PhotoDisplayProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
    console.error("Failed to load photo:", photo.photo_url);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    // Force image reload by appending timestamp
    const img = document.querySelector(`img[data-photo-id="${photo.photo_id}"]`) as HTMLImageElement;
    if (img) {
      const url = new URL(photo.photo_url);
      url.searchParams.set("retry", Date.now().toString());
      img.src = url.toString();
    }
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Photo container */}
      <div className="relative w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
        {/* Loading skeleton */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700 animate-pulse">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading photo...</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="text-center space-y-4 p-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-red-500 mx-auto"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="space-y-2">
                <p className="text-red-600 dark:text-red-400 font-semibold">Failed to load photo</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  The image could not be loaded. Please try again.
                </p>
              </div>
              <button
                onClick={handleRetry}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Actual image */}
        <img
          data-photo-id={photo.photo_id}
          src={photo.photo_url}
          alt={`Football photo ${currentIndex + 1} of ${totalPhotos}${photo.place ? ` from ${photo.place}` : ""}`}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="eager"
        />

        {/* Thumbnail as background (shown while loading) */}
        {isLoading && photo.thumbnail_url && (
          <img
            src={photo.thumbnail_url}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover scale-110"
          />
        )}
      </div>
    </div>
  );
}
