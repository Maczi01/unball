import { useState, useEffect, useCallback } from "react";
import { X, Calendar, Check, Image as ImageIcon, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminPhotoListItemDTO, PaginationDTO } from "@/types";

interface CreateDailySetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateDailySetModal = ({ isOpen, onClose, onSuccess }: CreateDailySetModalProps) => {
  const [date, setDate] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [photos, setPhotos] = useState<AdminPhotoListItemDTO[]>([]);
  const [pagination, setPagination] = useState<PaginationDTO | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/daily-sets/available-photos?page=${page}&limit=20`);
      if (!response.ok) {
        throw new Error("Failed to fetch available photos");
      }
      const data = await response.json();
      // Defensive filter: ensure only eligible photos are shown
      const eligiblePhotos = data.photos.filter((photo: AdminPhotoListItemDTO) => photo.is_daily_eligible === true);
      setPhotos(eligiblePhotos);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load photos");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    if (isOpen) {
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split("T")[0]);

      // Reset state
      setSelectedPhotos([]);
      setError(null);

      // Fetch photos
      fetchPhotos();
    }
  }, [fetchPhotos, isOpen, page]);

  const togglePhoto = (photoId: string) => {
    setSelectedPhotos((prev) => {
      if (prev.includes(photoId)) {
        return prev.filter((id) => id !== photoId);
      }
      if (prev.length >= 5) {
        return prev; // Max 5 photos
      }
      return [...prev, photoId];
    });
  };

  const handleSubmit = async () => {
    if (!date) {
      setError("Please select a date");
      return;
    }

    if (selectedPhotos.length !== 5) {
      setError("Please select exactly 5 photos");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await fetch("/api/admin/daily-sets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date_utc: date,
          photo_ids: selectedPhotos,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create daily set");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create daily set");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Create Daily Set</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Select a date and 5 photos for the daily challenge
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Date Selection */}
          <div className="mb-6">
            {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
            <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-100 mb-2">Date (UTC)</label>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-neutral-500" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="border border-neutral-300 dark:border-neutral-700 rounded-md px-3 py-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Photo Selection Status */}
          <div className="mb-6 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  Photos Selected: {selectedPhotos.length} / 5
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                  Click on photos to select or deselect them
                </p>
              </div>
              {selectedPhotos.length === 5 && (
                <Badge className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200">
                  <Check className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
              </div>
            </div>
          )}

          {/* Photo Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="aspect-video rounded-lg" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600 dark:text-neutral-400">No photos available</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {photos.map((photo) => {
                  const isSelected = selectedPhotos.includes(photo.id);
                  const selectionIndex = selectedPhotos.indexOf(photo.id);

                  return (
                    <button
                      key={photo.id}
                      onClick={() => togglePhoto(photo.id)}
                      disabled={!isSelected && selectedPhotos.length >= 5}
                      className={`relative aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected
                          ? "border-blue-500 ring-2 ring-blue-500/20"
                          : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                      } ${!isSelected && selectedPhotos.length >= 5 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {photo.thumbnail_url ? (
                        <img src={photo.thumbnail_url} alt={photo.event_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-neutral-400" />
                        </div>
                      )}

                      {/* Selection Badge */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {selectionIndex + 1}
                        </div>
                      )}

                      {/* Photo Info Overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-white text-xs font-medium line-clamp-1">{photo.event_name}</p>
                        <p className="text-white/70 text-xs">{photo.year_utc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination && pagination.total_pages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    Page {page} of {pagination.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                    disabled={page === pagination.total_pages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={selectedPhotos.length !== 5 || isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Daily Set"}
          </Button>
        </div>
      </div>
    </div>
  );
};
