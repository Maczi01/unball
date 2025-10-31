import { useState, useCallback, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { BulkActionsToolbar } from "@/components/BulkActionsToolbar";
import type { AdminPhotoListItemDTO } from "@/types";
import { cn } from "@/lib/utils";

interface PhotosListWithBulkActionsProps {
  initialPhotos: AdminPhotoListItemDTO[];
}

export const PhotosListWithBulkActions = ({ initialPhotos }: PhotosListWithBulkActionsProps) => {
  const [photos, setPhotos] = useState(initialPhotos);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Update photos when initial data changes
  useEffect(() => {
    setPhotos(initialPhotos);
  }, [initialPhotos]);

  const handleSelectPhoto = useCallback((photoId: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(photoId);
      } else {
        newSet.delete(photoId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(photos.map((p) => p.id)));
  }, [photos]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleDelete = useCallback(async () => {
    const idsToDelete = Array.from(selectedIds);

    const response = await fetch("/api/admin/photos/bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        photo_ids: idsToDelete,
        action: "delete",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete photos");
    }

    // Remove deleted photos from state
    setPhotos((prev) => prev.filter((p) => !selectedIds.has(p.id)));
    setSelectedIds(new Set());
  }, [selectedIds]);

  const handleToggleDailyEligible = useCallback(
    async (value: boolean) => {
      const idsToUpdate = Array.from(selectedIds);

      const response = await fetch("/api/admin/photos/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          photo_ids: idsToUpdate,
          action: "update",
          updates: {
            is_daily_eligible: value,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update photos");
      }

      // Update photos in state
      setPhotos((prev) =>
        prev.map((photo) => (selectedIds.has(photo.id) ? { ...photo, is_daily_eligible: value } : photo))
      );
      setSelectedIds(new Set());
    },
    [selectedIds]
  );

  return (
    <div>
      <Toaster />

      <BulkActionsToolbar
        selectedCount={selectedIds.size}
        totalCount={photos.length}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onDelete={handleDelete}
        onToggleDailyEligible={handleToggleDailyEligible}
      />

      {photos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {photos.map((photo) => {
            const isSelected = selectedIds.has(photo.id);

            return (
              <div
                key={photo.id}
                className={cn(
                  "bg-white dark:bg-neutral-900 rounded-lg shadow-sm overflow-hidden transition-all",
                  isSelected && "ring-2 ring-blue-500 shadow-md"
                )}
              >
                {/* Selection Checkbox */}
                <div className="absolute top-3 left-3 z-10">
                  <div className="bg-white dark:bg-neutral-800 rounded p-1 shadow-md">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleSelectPhoto(photo.id, checked as boolean)}
                      aria-label={`Select ${photo.event_name}`}
                    />
                  </div>
                </div>

                <a href={`/admin/photos/${photo.id}/edit`} className="block group">
                  {/* Photo */}
                  <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 overflow-hidden relative">
                    {photo.thumbnail_url ? (
                      <img
                        src={photo.thumbnail_url}
                        alt={photo.event_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-neutral-400">
                        <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {photo.event_name}
                    </h3>

                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <span>Year: {photo.year_utc}</span>
                      {photo.is_daily_eligible && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          Daily
                        </span>
                      )}
                    </div>

                    {photo.first_used_in_daily_date && (
                      <p className="text-xs text-neutral-500">
                        Used in daily: {new Date(photo.first_used_in_daily_date).toLocaleDateString()}
                      </p>
                    )}

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-xs text-neutral-500">
                        {new Date(photo.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-sm text-blue-600 dark:text-blue-400 group-hover:underline">Edit →</span>
                    </div>
                  </div>
                </a>
              </div>
            );
          })}
        </div>
      ) : (
        // Empty State
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 p-6 mb-4">
            <svg className="h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">No photos found</h3>
          <p className="text-neutral-600 dark:text-neutral-400">There are no photos in the database yet.</p>
        </div>
      )}
    </div>
  );
};
