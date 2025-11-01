import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ApproveSubmissionCommand, RejectSubmissionCommand, SubmissionStatus } from "@/types";

interface ModerationActionsProps {
  // submissionId: string;
  currentStatus: SubmissionStatus;
  onApprove: (command: ApproveSubmissionCommand) => Promise<void>;
  onReject: (command: RejectSubmissionCommand) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export const ModerationActions = ({ currentStatus, onApprove, onReject, isLoading, error }: ModerationActionsProps) => {
  const [reviewNotes, setReviewNotes] = useState("");
  const [isDailyEligible, setIsDailyEligible] = useState(true);
  const [rejectReason, setRejectReason] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleApprove = async () => {
    setValidationError("");

    if (reviewNotes.length > 500) {
      setValidationError("Review notes must be 500 characters or less");
      return;
    }

    const command: ApproveSubmissionCommand = {
      is_daily_eligible: isDailyEligible,
    };

    if (reviewNotes.trim()) {
      command.review_notes = reviewNotes.trim();
    }

    await onApprove(command);
  };

  const handleReject = async () => {
    setValidationError("");

    if (!rejectReason.trim()) {
      setValidationError("Rejection reason is required");
      return;
    }

    if (rejectReason.length > 500) {
      setValidationError("Rejection reason must be 500 characters or less");
      return;
    }

    const command: RejectSubmissionCommand = {
      review_notes: rejectReason.trim(),
      delete_file: true,
    };

    await onReject(command);
  };

  // If not pending, show status info
  if (currentStatus !== "pending") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-neutral-100 dark:bg-neutral-800 p-4">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            This submission has already been{" "}
            <span className="font-semibold">{currentStatus === "approved" ? "approved" : "rejected"}</span>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Approve Section */}
      <div className="space-y-4 border border-green-200 dark:border-green-900/30 rounded-lg p-4">
        <h3 className="font-semibold text-green-700 dark:text-green-400 flex items-center gap-2">
          <Check className="h-5 w-5" />
          Approve Submission
        </h3>

        <div className="space-y-3">
          <div>
            <Label htmlFor="review-notes" className="text-sm">
              Review Notes (Optional)
            </Label>
            <Textarea
              id="review-notes"
              placeholder="Add any notes about this approval..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              maxLength={500}
              rows={3}
              className="mt-1.5"
            />
            <p className="text-xs text-neutral-500 mt-1">{reviewNotes.length}/500 characters</p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="daily-eligible"
              checked={isDailyEligible}
              onCheckedChange={(checked) => setIsDailyEligible(checked as boolean)}
            />
            <Label htmlFor="daily-eligible" className="text-sm font-normal cursor-pointer">
              Make eligible for daily challenges
            </Label>
          </div>

          <Button
            onClick={handleApprove}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Approve Submission
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Reject Section */}
      <div className="space-y-4 border border-red-200 dark:border-red-900/30 rounded-lg p-4">
        <h3 className="font-semibold text-red-700 dark:text-red-400 flex items-center gap-2">
          <X className="h-5 w-5" />
          Reject Submission
        </h3>

        <div className="space-y-3">
          <div>
            <Label htmlFor="reject-reason" className="text-sm">
              Rejection Reason (Required)
            </Label>
            <Textarea
              id="reject-reason"
              placeholder="Explain why this submission is being rejected..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              maxLength={500}
              rows={3}
              className="mt-1.5"
            />
            <p className="text-xs text-neutral-500 mt-1">{rejectReason.length}/500 characters</p>
          </div>

          <Button
            onClick={handleReject}
            disabled={isLoading || !rejectReason.trim()}
            variant="destructive"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rejecting...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Reject Submission
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {(validationError || error) && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-900/30">
          <p className="text-sm text-red-800 dark:text-red-400">{validationError || error}</p>
        </div>
      )}
    </div>
  );
};
