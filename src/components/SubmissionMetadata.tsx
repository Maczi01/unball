import { formatDistanceToNow } from "date-fns";

interface SubmissionMetadataProps {
  eventName: string;
  yearUtc: number;
  submitterEmail: string | null;
  createdAt: string;
}

export const SubmissionMetadata = ({
  eventName,
  yearUtc,
  submitterEmail,
  createdAt,
}: SubmissionMetadataProps) => {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
        {eventName}
      </h3>
      <div className="text-sm text-neutral-600 dark:text-neutral-400">
        <p>Year: {yearUtc}</p>
        {submitterEmail && <p className="line-clamp-1">By: {submitterEmail}</p>}
        <p className="text-xs text-neutral-500 dark:text-neutral-500">
          {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
};
