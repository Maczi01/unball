import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PhotoThumbnail } from "@/components/PhotoThumbnail";
import { SubmissionMetadata } from "@/components/SubmissionMetadata";
import { QuickActions } from "@/components/QuickActions";
import type { AdminPhotoSubmissionListItemDTO } from "@/types";

interface SubmissionCardProps {
  submission: AdminPhotoSubmissionListItemDTO;
  onClick: (id: string) => void;
  onQuickApprove?: (id: string) => Promise<void>;
  onQuickReject?: (id: string, reason: string) => Promise<void>;
}

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
} as const;

export const SubmissionCard = ({ submission, onClick, onQuickApprove, onQuickReject }: SubmissionCardProps) => {
  const isPending = submission.status === "pending";

  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => onClick(submission.id)}
    >
      <div className="flex gap-4 p-4">
        <PhotoThumbnail
          photoUrl={submission.photo_url}
          alt={submission.event_name}
          className="w-32 h-32 rounded flex-shrink-0"
        />

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <SubmissionMetadata
                eventName={submission.event_name}
                yearUtc={submission.year_utc}
                submitterEmail={submission.submitter_email}
                createdAt={submission.created_at}
              />
              <Badge className={STATUS_STYLES[submission.status]} variant="secondary">
                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
              </Badge>
            </div>
          </div>

          {isPending && onQuickApprove && onQuickReject && (
            <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <QuickActions submissionId={submission.id} onApprove={onQuickApprove} onReject={onQuickReject} />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};
