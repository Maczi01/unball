import { useState, useEffect, useCallback } from "react";

import type {
  AdminPhotoSubmissionListItemDTO,
  AdminPhotoSubmissionDetailDTO,
  AdminPhotoSubmissionsResponseDTO,
  StatusCountsDTO,
  SubmissionStatus,
  PaginationDTO,
  ApproveSubmissionCommand,
  RejectSubmissionCommand,
  ModerationActionState,
} from "@/types";

interface PhotoModerationState {
  // List state
  submissions: AdminPhotoSubmissionListItemDTO[];
  statusCounts: StatusCountsDTO;
  isLoading: boolean;
  error: string | null;

  // Filter state
  currentStatus: SubmissionStatus | "all";
  currentPage: number;
  pagination: PaginationDTO | null;

  // Detail modal state
  selectedSubmissionId: string | null;
  submissionDetail: AdminPhotoSubmissionDetailDTO | null;
  isDetailLoading: boolean;
  detailError: string | null;

  // Action state
  moderationAction: ModerationActionState;
}

interface UsePhotoModerationReturn {
  state: PhotoModerationState;
  setStatusFilter: (status: SubmissionStatus | "all") => void;
  setPage: (page: number) => void;
  openDetailModal: (id: string) => void;
  closeDetailModal: () => void;
  approveSubmission: (id: string, command: ApproveSubmissionCommand) => Promise<void>;
  rejectSubmission: (id: string, command: RejectSubmissionCommand) => Promise<void>;
  refreshList: () => Promise<void>;
}

export const usePhotoModeration = (): UsePhotoModerationReturn => {
  const [state, setState] = useState<PhotoModerationState>({
    submissions: [],
    statusCounts: { pending: 0, approved: 0, rejected: 0 },
    isLoading: false,
    error: null,
    currentStatus: "all",
    currentPage: 1,
    pagination: null,
    selectedSubmissionId: null,
    submissionDetail: null,
    isDetailLoading: false,
    detailError: null,
    moderationAction: { status: "idle" },
  });

  // Fetch submissions list
  const fetchSubmissions = useCallback(async (status: SubmissionStatus | "all", page: number) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "50",
      });

      if (status !== "all") {
        params.append("status", status);
      }

      const response = await fetch(`/api/admin/photo-submissions?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch submissions");
      }

      const data: AdminPhotoSubmissionsResponseDTO = await response.json();

      setState((prev) => ({
        ...prev,
        submissions: data.submissions,
        statusCounts: data.status_counts,
        pagination: data.pagination,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to fetch submissions",
        isLoading: false,
      }));
    }
  }, []);

  // Fetch submission detail
  const fetchSubmissionDetail = useCallback(async (id: string) => {
    setState((prev) => ({
      ...prev,
      isDetailLoading: true,
      detailError: null,
      submissionDetail: null,
    }));

    try {
      const response = await fetch(`/api/admin/photo-submissions/${id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch submission details");
      }

      const data: AdminPhotoSubmissionDetailDTO = await response.json();

      setState((prev) => ({
        ...prev,
        submissionDetail: data,
        isDetailLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        detailError: error instanceof Error ? error.message : "Failed to fetch submission details",
        isDetailLoading: false,
      }));
    }
  }, []);

  // Set status filter
  const setStatusFilter = useCallback(
    (status: SubmissionStatus | "all") => {
      setState((prev) => ({ ...prev, currentStatus: status, currentPage: 1 }));
      fetchSubmissions(status, 1);
    },
    [fetchSubmissions]
  );

  // Set page
  const setPage = useCallback(
    (page: number) => {
      setState((prev) => ({ ...prev, currentPage: page }));
      fetchSubmissions(state.currentStatus, page);
    },
    [fetchSubmissions, state.currentStatus]
  );

  // Open detail modal
  const openDetailModal = useCallback(
    (id: string) => {
      setState((prev) => ({ ...prev, selectedSubmissionId: id }));
      fetchSubmissionDetail(id);
    },
    [fetchSubmissionDetail]
  );

  // Close detail modal
  const closeDetailModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      selectedSubmissionId: null,
      submissionDetail: null,
      detailError: null,
      moderationAction: { status: "idle" },
    }));
  }, []);

  // Approve submission
  const approveSubmission = useCallback(
    async (id: string, command: ApproveSubmissionCommand) => {
      setState((prev) => ({
        ...prev,
        moderationAction: { status: "submitting" },
      }));

      try {
        const response = await fetch(`/api/admin/photo-submissions/${id}/approve`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to approve submission");
        }

        setState((prev) => ({
          ...prev,
          moderationAction: { status: "success" },
        }));

        // Refresh list after successful approval
        await fetchSubmissions(state.currentStatus, state.currentPage);
        closeDetailModal();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          moderationAction: {
            status: "error",
            error: error instanceof Error ? error.message : "Failed to approve submission",
          },
        }));
      }
    },
    [fetchSubmissions, state.currentStatus, state.currentPage, closeDetailModal]
  );

  // Reject submission
  const rejectSubmission = useCallback(
    async (id: string, command: RejectSubmissionCommand) => {
      setState((prev) => ({
        ...prev,
        moderationAction: { status: "submitting" },
      }));

      try {
        const response = await fetch(`/api/admin/photo-submissions/${id}/reject`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(command),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to reject submission");
        }

        setState((prev) => ({
          ...prev,
          moderationAction: { status: "success" },
        }));

        // Refresh list after successful rejection
        await fetchSubmissions(state.currentStatus, state.currentPage);
        closeDetailModal();
      } catch (error) {
        setState((prev) => ({
          ...prev,
          moderationAction: {
            status: "error",
            error: error instanceof Error ? error.message : "Failed to reject submission",
          },
        }));
      }
    },
    [fetchSubmissions, state.currentStatus, state.currentPage, closeDetailModal]
  );

  // Refresh list
  const refreshList = useCallback(async () => {
    await fetchSubmissions(state.currentStatus, state.currentPage);
  }, [fetchSubmissions, state.currentStatus, state.currentPage]);

  // Initial fetch
  useEffect(() => {
    fetchSubmissions("all", 1);
  }, [fetchSubmissions]);

  return {
    state,
    setStatusFilter,
    setPage,
    openDetailModal,
    closeDetailModal,
    approveSubmission,
    rejectSubmission,
    refreshList,
  };
};
