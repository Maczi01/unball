import { Toaster } from "@/components/ui/sonner";
import { ModerationHeader } from "@/components/ModerationHeader";
import { SubmissionsList } from "@/components/SubmissionsList";
import { SubmissionDetailModal } from "@/components/SubmissionDetailModal";
import { usePhotoModeration } from "@/components/hooks/usePhotoModeration";

export const PhotoModerationDashboard = () => {
  const { state, setStatusFilter, setPage, openDetailModal, closeDetailModal, approveSubmission, rejectSubmission } =
    usePhotoModeration();

  const handleQuickApprove = async (id: string) => {
    await approveSubmission(id, { is_daily_eligible: true });
  };

  const handleQuickReject = async (id: string, reason: string) => {
    await rejectSubmission(id, { review_notes: reason });
  };

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      <Toaster />

      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-end gap-2 pb-4">
          <a
            href="/admin"
            className="inline-flex items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Dashboard
          </a>
          <a
            href="/admin/photos"
            className="inline-flex items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            Manage Photos
          </a>
          <a
            href="/admin/users"
            className="inline-flex items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-800 px-4 py-2 text-sm font-medium text-neutral-900 dark:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            User Management
          </a>
        </div>

        <ModerationHeader
          currentStatus={state.currentStatus}
          statusCounts={state.statusCounts}
          onStatusChange={setStatusFilter}
        />

        <SubmissionsList
          submissions={state.submissions}
          pagination={state.pagination}
          isLoading={state.isLoading}
          onSubmissionClick={openDetailModal}
          onPageChange={setPage}
          onQuickApprove={handleQuickApprove}
          onQuickReject={handleQuickReject}
        />

        <SubmissionDetailModal
          submissionId={state.selectedSubmissionId}
          submission={state.submissionDetail}
          isOpen={state.selectedSubmissionId !== null}
          isLoading={state.isDetailLoading}
          error={state.detailError}
          moderationAction={state.moderationAction}
          onClose={closeDetailModal}
          onApprove={approveSubmission}
          onReject={rejectSubmission}
        />
      </div>
    </div>
  );
};
