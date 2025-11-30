import { useState, useEffect, useRef, useCallback } from "react";
import type { DailySetPhotoDTO, NormalRoundPhotoDTO } from "@/types";

interface PhotoDisplayProps {
  photo: DailySetPhotoDTO | NormalRoundPhotoDTO;
  currentIndex: number; // 0-4
  totalPhotos: number; // Always 5
  onLoad?: () => void;
}

export function PhotoDisplay({ photo, currentIndex, totalPhotos, onLoad }: PhotoDisplayProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  // Check if image is already loaded (cached)
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalHeight !== 0) {
      handleImageLoad();
    }
  }, [handleImageLoad, photo.photo_url]);

  // Reset zoom and position when photo changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [photo.photo_id]);

  // Wheel zoom handler
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY * -0.001;
      const newScale = Math.min(Math.max(1, scale + delta), 5);

      if (newScale === 1) {
        setPosition({ x: 0, y: 0 });
      }

      setScale(newScale);
    },
    [scale]
  );

  // Mouse drag handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (scale > 1) {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
      }
    },
    [scale, position]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && scale > 1) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, scale, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (scale > 1 && e.touches.length === 1) {
        setIsDragging(true);
        setDragStart({
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y,
        });
      }
    },
    [scale, position]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isDragging && scale > 1 && e.touches.length === 1) {
        setPosition({
          x: e.touches[0].clientX - dragStart.x,
          y: e.touches[0].clientY - dragStart.y,
        });
      }
    },
    [isDragging, scale, dragStart]
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add wheel event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      return () => container.removeEventListener("wheel", handleWheel);
    }
  }, [handleWheel]);

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
    // eslint-disable-next-line no-console
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

  const handleZoomIn = () => {
    const newScale = Math.min(scale + 0.5, 5);
    setScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.5, 1);
    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
    setScale(newScale);
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="h-full flex flex-col min-h-0">
      {/* Photo container */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        ref={containerRef}
        className="relative w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
      >
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
        {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
        <img
          ref={imgRef}
          data-photo-id={photo.photo_id}
          src={photo.photo_url}
          alt={`Photo ${currentIndex + 1} of ${totalPhotos}${photo.place ? ` from ${photo.place}` : ""}`}
          className={`w-full h-full object-contain transition-opacity duration-300 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="eager"
          draggable={false}
        />

        {/* Zoom controls */}
        {!isLoading && !hasError && (
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 bg-white/90 dark:bg-gray-800/90 rounded-lg p-2 shadow-lg">
            <button
              onClick={handleZoomIn}
              disabled={scale >= 5}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Zoom in"
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
                />
              </svg>
            </button>
            <button
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label="Zoom out"
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
                />
              </svg>
            </button>
            {scale > 1 && (
              <button
                onClick={handleResetZoom}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Reset zoom"
                type="button"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
            )}
            <div className="text-xs text-center text-gray-600 dark:text-gray-400 pt-1 border-t border-gray-300 dark:border-gray-600">
              {Math.round(scale * 100)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
