import { useState } from "react";
import { Trash2, Check, X, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: () => Promise<void>;
  onToggleDailyEligible: (value: boolean) => Promise<void>;
  className?: string;
}

export const BulkActionsToolbar = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onToggleDailyEligible,
  className,
}: BulkActionsToolbarProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      setShowDeleteDialog(false);
      toast.success(`Successfully deleted ${selectedCount} photos`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete photos");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleDailyEligible = async (value: boolean) => {
    setIsUpdating(true);
    try {
      await onToggleDailyEligible(value);
      toast.success(`Successfully ${value ? "enabled" : "disabled"} daily eligibility for ${selectedCount} photos`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update photos");
    } finally {
      setIsUpdating(false);
    }
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <div
        className={cn(
          "sticky top-0 z-10 bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-900 p-4 shadow-sm",
          className
        )}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-semibold">
                {selectedCount}
              </div>
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                {selectedCount} {selectedCount === 1 ? "photo" : "photos"} selected
              </span>
            </div>

            {selectedCount < totalCount && (
              <Button variant="link" size="sm" onClick={onSelectAll} className="text-blue-600 dark:text-blue-400">
                Select all {totalCount}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleToggleDailyEligible(true)} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Enable Daily
            </Button>

            <Button variant="outline" size="sm" onClick={() => handleToggleDailyEligible(false)} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
              Disable Daily
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isUpdating || isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>

            <Button variant="ghost" size="sm" onClick={onDeselectAll}>
              Clear Selection
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Photos</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedCount} {selectedCount === 1 ? "photo" : "photos"}? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete {selectedCount} {selectedCount === 1 ? "Photo" : "Photos"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
