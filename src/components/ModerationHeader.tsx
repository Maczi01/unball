import { StatusCounts } from "@/components/StatusCounts";
import { StatusFilter } from "@/components/StatusFilter";
import type { StatusCountsDTO, SubmissionStatus } from "@/types";

interface ModerationHeaderProps {
  currentStatus: SubmissionStatus | "all";
  statusCounts: StatusCountsDTO;
  onStatusChange: (status: SubmissionStatus | "all") => void;
}

export const ModerationHeader = ({
  currentStatus,
  statusCounts,
  onStatusChange,
}: ModerationHeaderProps) => {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Photo Submissions
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          Review and moderate user-submitted photos
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <StatusCounts counts={statusCounts} />
        <StatusFilter value={currentStatus} onChange={onStatusChange} />
      </div>
    </header>
  );
};
