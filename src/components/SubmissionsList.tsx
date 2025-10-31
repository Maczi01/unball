import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { SubmissionCard } from "@/components/SubmissionCard";
import { Pagination } from "@/components/Pagination";
import type { AdminPhotoSubmissionListItemDTO, PaginationDTO } from "@/types";

interface SubmissionsListProps {
  submissions: AdminPhotoSubmissionListItemDTO[];
  pagination: PaginationDTO | null;
  isLoading: boolean;
  onSubmissionClick: (id: string) => void;
  onPageChange: (page: number) => void;
  onQuickApprove?: (id: string) => Promise<void>;
  onQuickReject?: (id: string, reason: string) => Promise<void>;
}

const LoadingSkeleton = () => (
  <div className="grid gap-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <Card key={i} className="p-4">
        <div className="flex gap-4">
          <Skeleton className="w-32 h-32 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      </Card>
    ))}
  </div>
);

const EmptyState = ({ statusFilter }: { statusFilter: string }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="rounded-full bg-neutral-100 dark:bg-neutral-800 p-6 mb-4">
      <svg className="h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1">No submissions found</h3>
    <p className="text-neutral-600 dark:text-neutral-400">
      {statusFilter === "all" ? "There are no photo submissions yet." : `No ${statusFilter} submissions found.`}
    </p>
  </div>
);

export const SubmissionsList = ({
  submissions,
  pagination,
  isLoading,
  onSubmissionClick,
  onPageChange,
  onQuickApprove,
  onQuickReject,
}: SubmissionsListProps) => {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (submissions.length === 0) {
    return <EmptyState statusFilter={pagination ? "filtered" : "all"} />;
  }

  return (
    <div>
      <div className="grid gap-4">
        {submissions.map((submission) => (
          <SubmissionCard
            key={submission.id}
            submission={submission}
            onClick={onSubmissionClick}
            onQuickApprove={onQuickApprove}
            onQuickReject={onQuickReject}
          />
        ))}
      </div>

      {pagination && pagination.total_pages > 1 && (
        <Pagination currentPage={pagination.page} totalPages={pagination.total_pages} onPageChange={onPageChange} />
      )}
    </div>
  );
};
