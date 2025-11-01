import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Calendar, CheckCircle, Clock, Eye, Plus, Trash2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateDailySetModal } from "@/components/CreateDailySetModal";
import type { AdminDailySetListItemDTO, AdminDailySetsResponseDTO } from "@/types";

export const DailySetsManager = () => {
  const [data, setData] = useState<AdminDailySetsResponseDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  const fetchDailySets = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/daily-sets?page=${page}&limit=20`);
      if (!response.ok) {
        throw new Error("Failed to fetch daily sets");
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load daily sets");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchDailySets();
  }, [fetchDailySets, page]);

  const handleDelete = async (id: string, date: string) => {
    if (!confirm(`Are you sure you want to delete the daily set for ${date}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/daily-sets/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete daily set");
      }

      // Refresh the list
      fetchDailySets();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete daily set");
    }
  };

  const handlePublish = async (id: string, date: string) => {
    if (!confirm(`Publish the daily set for ${date}? This will make it active for players.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/daily-sets/${id}/publish`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to publish daily set");
      }

      // Refresh the list
      fetchDailySets();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to publish daily set");
    }
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchDailySets();
  };

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg p-6">
        <p className="text-red-900 dark:text-red-100 font-medium">{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { daily_sets, pagination, schedule_status } = data;

  return (
    <div className="space-y-6">
      {/* Schedule Status Alert */}
      <Card className={schedule_status.warning ? "border-orange-200 dark:border-orange-900" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
              <CardTitle>Schedule Status</CardTitle>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create Daily Set
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Days Scheduled Ahead</p>
              <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                {schedule_status.days_scheduled_ahead}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Next Unpublished</p>
              <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                {schedule_status.next_unpublished_date || "None"}
              </p>
            </div>
            {schedule_status.warning && (
              <div className="md:col-span-1">
                <div className="flex items-start gap-2 text-orange-800 dark:text-orange-200">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{schedule_status.warning}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Daily Sets List */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Daily Sets</CardTitle>
          <CardDescription>
            {pagination.total_items} total set{pagination.total_items !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {daily_sets.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">No daily sets scheduled yet</p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Daily Set
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {daily_sets.map((set) => (
                <DailySetRow key={set.daily_set_id} set={set} onDelete={handleDelete} onPublish={handlePublish} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                Page {page} of {pagination.total_pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                disabled={page === pagination.total_pages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <CreateDailySetModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

interface DailySetRowProps {
  set: AdminDailySetListItemDTO;
  onDelete: (id: string, date: string) => void;
  onPublish: (id: string, date: string) => void;
}

const DailySetRow = ({ set, onDelete, onPublish }: DailySetRowProps) => {
  // const isPast = new Date(set.date_utc) < new Date(new Date().toISOString().split("T")[0]);
  const isToday = set.date_utc === new Date().toISOString().split("T")[0];
  const isIncomplete = set.photo_count !== 5;

  return (
    <div className="flex items-center justify-between p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex-shrink-0">
          <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{set.date_utc}</div>
          {isToday && (
            <Badge variant="outline" className="mt-1">
              Today
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          {set.is_published ? (
            <Badge className="bg-green-100 dark:bg-green-950 text-green-800 dark:text-green-200 border-green-200 dark:border-green-900">
              <CheckCircle className="h-3 w-3 mr-1" />
              Published
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="border-orange-200 dark:border-orange-900 text-orange-700 dark:text-orange-300"
            >
              <Clock className="h-3 w-3 mr-1" />
              Draft
            </Badge>
          )}

          {isIncomplete && (
            <Badge variant="outline" className="border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
              <AlertCircle className="h-3 w-3 mr-1" />
              Incomplete ({set.photo_count}/5)
            </Badge>
          )}

          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {set.photo_count} photo{set.photo_count !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <a href={`/admin/daily-sets/${set.daily_set_id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View
          </a>
        </Button>

        {!set.is_published && !isIncomplete && (
          <Button variant="default" size="sm" onClick={() => onPublish(set.daily_set_id, set.date_utc)}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Publish
          </Button>
        )}

        {!set.is_published && (
          <Button variant="destructive" size="sm" onClick={() => onDelete(set.daily_set_id, set.date_utc)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
