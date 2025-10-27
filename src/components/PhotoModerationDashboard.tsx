import { Toaster } from "@/components/ui/sonner";
import { ModerationHeader } from "@/components/ModerationHeader";
import { SubmissionsList } from "@/components/SubmissionsList";
import { SubmissionDetailModal } from "@/components/SubmissionDetailModal";
import { usePhotoModeration } from "@/components/hooks/usePhotoModeration";
import type { AdminPhotoSubmissionsResponseDTO } from "@/types";

interface PhotoModerationDashboardProps {
  initialData?: AdminPhotoSubmissionsResponseDTO;
  adminEmail: string;
}

export const PhotoModerationDashboard = ({
  initialData,
  adminEmail,
}: PhotoModerationDashboardProps) => {
  const {
    state,
    setStatusFilter,
    setPage,
    openDetailModal,
    closeDetailModal,
    approveSubmission,
    rejectSubmission,
  } = usePhotoModeration();

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
