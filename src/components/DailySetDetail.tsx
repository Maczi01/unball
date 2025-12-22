import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, CheckCircle, Clock, Image as ImageIcon, Trash2, Trophy } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { AdminDailySetDTO } from "@/types";

interface DailySetDetailProps {
  dailySetId?: string;
}

export const DailySetDetail = ({ dailySetId }: DailySetDetailProps) => {
  const [dailySet, setDailySet] = useState<AdminDailySetDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDailySet = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/daily-sets/${dailySetId}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Daily set not found");
        }
        throw new Error("Failed to fetch daily set");
      }
      const data = await response.json();
      setDailySet(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load daily set");
    } finally {
      setIsLoading(false);
    }
  }, [dailySetId]);

  useEffect(() => {
    if (dailySetId) {
      fetchDailySet();
    }
  }, [dailySetId, fetchDailySet]);

  const handlePublish = async () => {
    if (!dailySet) return;

    if (!confirm(`Publish the daily set for ${dailySet.date_utc}? This will make it active for players.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/daily-sets/${dailySetId}/publish`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to publish daily set");
      }

      // Refresh the data
      fetchDailySet();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to publish daily set");
    }
  };

  const handleDelete = async () => {
    if (!dailySet) return;

    if (!confirm(`Are you sure you want to delete the daily set for ${dailySet.date_utc}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/daily-sets/${dailySetId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete daily set");
      }

      // Redirect back to list
      window.location.href = "/admin/daily-sets";
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete daily set");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="outline" asChild>
          <a href="/admin/daily-sets">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Daily Sets
          </a>
        </Button>
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg p-6">
          <p className="text-red-900 dark:text-red-100 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!dailySet) {
    return null;
  }

  const isIncomplete = dailySet.photos.length !== 5;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="outline" asChild className="mb-4">
          <a href="/admin/daily-sets">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Daily Sets
          </a>
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">Daily Set Details</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2">
              {new Date(dailySet.date_utc).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {dailySet.is_published ? (
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
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Set Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Date (UTC)</p>
              <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100">{dailySet.date_utc}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Status</p>
              <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                {dailySet.is_published ? "Published" : "Draft"}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Photo Count</p>
              <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100">{dailySet.photos.length} / 5</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">Created At</p>
              <p className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                {new Date(dailySet.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photos */}
      <Card>
        <CardHeader>
          <CardTitle>Photos ({dailySet.photos.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isIncomplete && (
            <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-900 rounded-lg">
              <p className="text-orange-900 dark:text-orange-100 text-sm">
                This set is incomplete. It needs exactly 5 photos to be published.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dailySet.photos.map((photo) => (
              <div
                key={photo.photo_id}
                className="flex gap-4 p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg"
              >
                <div className="flex-shrink-0 w-32 h-24">
                  {photo.photo_url ? (
                    <img src={photo.photo_url} alt={photo.event_name} className="w-full h-full object-cover rounded" />
                  ) : (
                    <div className="w-full h-full bg-neutral-100 dark:bg-neutral-800 rounded flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-neutral-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        Position {photo.position}
                      </Badge>
                      <h3 className="font-medium text-neutral-900 dark:text-neutral-100">{photo.event_name}</h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Year: {photo.year_utc}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
            <CardTitle>Leaderboard ({dailySet.leaderboard.length})</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {dailySet.leaderboard.length === 0 ? (
            <div className="text-center py-8 text-neutral-600 dark:text-neutral-400">
              No submissions yet for this daily set.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-neutral-200 dark:border-neutral-800">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Rank
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Nickname
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Score
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Time
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-neutral-600 dark:text-neutral-400">
                      Submitted
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {dailySet.leaderboard.map((entry) => (
                    <tr
                      key={`${entry.nickname}-${entry.submission_timestamp}`}
                      className="border-b border-neutral-100 dark:border-neutral-900 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-900"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {entry.rank <= 3 ? (
                            <Badge
                              className={
                                entry.rank === 1
                                  ? "bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-900"
                                  : entry.rank === 2
                                    ? "bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-900"
                                    : "bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-200 border-orange-200 dark:border-orange-900"
                              }
                            >
                              #{entry.rank}
                            </Badge>
                          ) : (
                            <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                              #{entry.rank}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {entry.nickname}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {entry.total_score}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-neutral-600 dark:text-neutral-400">
                        {(entry.total_time_ms / 1000).toFixed(1)}s
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-neutral-600 dark:text-neutral-400">
                        {new Date(entry.submission_timestamp).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {!dailySet.is_published && !isIncomplete && (
              <Button onClick={handlePublish}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Publish Daily Set
              </Button>
            )}

            {!dailySet.is_published && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Set
              </Button>
            )}

            {dailySet.is_published && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                This set is published and cannot be modified or deleted.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
