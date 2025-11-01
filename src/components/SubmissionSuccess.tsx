import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { PhotoSubmissionResponseDTO } from "@/types";

interface SubmissionSuccessProps {
  submission: PhotoSubmissionResponseDTO;
  onSubmitAnother: () => void;
  onViewSubmissions: () => void;
  open?: boolean;
}

export function SubmissionSuccess({
  submission,
  onSubmitAnother,
  onViewSubmissions,
  open = true,
}: SubmissionSuccessProps) {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <DialogTitle className="text-xl">Photo Submitted Successfully!</DialogTitle>
          <DialogDescription className="text-center">{submission.message}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">Submission ID:</span>
              <code className="rounded bg-neutral-100 dark:bg-neutral-900 px-2 py-1 text-xs font-mono">
                {submission.submission_id.slice(0, 8)}...
              </code>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">Status:</span>
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-400"
              >
                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)} Review
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">Submitted:</span>
              <span className="text-neutral-700 dark:text-neutral-300">
                {new Date(submission.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 p-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              <strong className="text-neutral-900 dark:text-neutral-100">What happens next?</strong>
              <br />
              Your photo will be reviewed by our team. You&#39;ll be able to check the status in your submission
              history. Approved photos will be added to the game!
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
          <Button type="button" variant="outline" onClick={onSubmitAnother} className="w-full sm:w-auto">
            Submit Another Photo
          </Button>
          <Button type="button" onClick={onViewSubmissions} className="w-full sm:w-auto">
            View My Submissions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
