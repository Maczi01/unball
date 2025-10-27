import { Loader2, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PhotoPreview } from "@/components/PhotoPreview";
import { MetadataDisplay } from "@/components/MetadataDisplay";
import { ModerationActions } from "@/components/ModerationActions";
import type {
  AdminPhotoSubmissionDetailDTO,
  ApproveSubmissionCommand,
  RejectSubmissionCommand,
  ModerationActionState,
} from "@/types";

interface SubmissionDetailModalProps {
  submissionId: string | null;
  submission: AdminPhotoSubmissionDetailDTO | null;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  moderationAction: ModerationActionState;
  onClose: () => void;
  onApprove: (id: string, command: ApproveSubmissionCommand) => Promise<void>;
  onReject: (id: string, command: RejectSubmissionCommand) => Promise<void>;
}

export const SubmissionDetailModal = ({
  submissionId,
  submission,
  isOpen,
  isLoading,
  error,
  moderationAction,
  onClose,
  onApprove,
  onReject,
}: SubmissionDetailModalProps) => {
  const handleApprove = async (command: ApproveSubmissionCommand) => {
    if (submissionId) {
      await onApprove(submissionId, command);
    }
  };

  const handleReject = async (command: RejectSubmissionCommand) => {
    if (submissionId) {
      await onReject(submissionId, command);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl font-bold">
              {submission ? submission.event_name : "Submission Details"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-full"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
            <span className="ml-2 text-neutral-600">Loading submission details...</span>
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-900/30">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {submission && !isLoading && (
          <div className="space-y-6">
            {/* Photo Preview */}
            <PhotoPreview photoUrl={submission.photo_url} alt={submission.event_name} />

            {/* Metadata */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Submission Details</h3>
              <MetadataDisplay submission={submission} />
            </div>

            {/* Moderation Actions */}
            <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">
              <h3 className="text-lg font-semibold mb-4">Moderation</h3>
              <ModerationActions
                submissionId={submission.id}
                currentStatus={submission.status}
                onApprove={handleApprove}
                onReject={handleReject}
                isLoading={moderationAction.status === "submitting"}
                error={moderationAction.error}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
