import { useState, useEffect } from "react";
import {
  Users,
  Image,
  FileCheck,
  Calendar,
  AlertCircle,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  users: {
    total: number;
    admins: number;
    with_photo_permission: number;
    with_consent: number;
  };
  photos: {
    total: number;
    daily_eligible: number;
  };
  submissions: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  daily_sets: {
    scheduled_ahead: number;
    next_unpublished: string | null;
  };
  pending_count: number;
  recent_photos: {
    id: string;
    event_name: string;
    thumbnail_url: string | null;
    created_at: string;
  }[];
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/dashboard/stats");
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard stats");
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg p-6">
        <p className="text-red-900 dark:text-red-100 font-medium">{error || "Failed to load dashboard"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      {stats.pending_count > 0 && (
        <Card className="border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <CardTitle className="text-orange-900 dark:text-orange-100">Pending Reviews</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-orange-800 dark:text-orange-200 mb-3">
              You have {stats.pending_count} photo submission{stats.pending_count !== 1 ? "s" : ""} waiting for review.
            </p>
            <Button asChild variant="outline" className="border-orange-300 dark:border-orange-800">
              <a href="/admin/photo-moderation">
                Review Submissions
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-neutral-500 mt-1">
              {stats.users.admins} admin{stats.users.admins !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Photo Permissions</CardTitle>
            <Shield className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.with_photo_permission}</div>
            <p className="text-xs text-neutral-500 mt-1">Users can add photos</p>
          </CardContent>
        </Card>

        {/* Photos Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Photos</CardTitle>
            <Image className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.photos.total}</div>
            <p className="text-xs text-neutral-500 mt-1">{stats.photos.daily_eligible} daily eligible</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Sets</CardTitle>
            <Calendar className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.daily_sets.scheduled_ahead}</div>
            <p className="text-xs text-neutral-500 mt-1">Days scheduled ahead</p>
          </CardContent>
        </Card>

        {/* Submissions Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.submissions.pending}</div>
            <p className="text-xs text-neutral-500 mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.submissions.approved}</div>
            <p className="text-xs text-neutral-500 mt-1">Total approved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.submissions.rejected}</div>
            <p className="text-xs text-neutral-500 mt-1">Total rejected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
            <FileCheck className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.submissions.total}</div>
            <p className="text-xs text-neutral-500 mt-1">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button asChild variant="outline" className="h-auto py-4 flex-col items-start">
              <a href="/admin/daily-sets">
                <Calendar className="h-5 w-5 mb-2" />
                <span className="font-semibold">Daily Sets</span>
                <span className="text-xs text-neutral-500">Schedule daily challenges</span>
              </a>
            </Button>

            <Button asChild variant="outline" className="h-auto py-4 flex-col items-start">
              <a href="/admin/photo-moderation">
                <FileCheck className="h-5 w-5 mb-2" />
                <span className="font-semibold">Photo Moderation</span>
                <span className="text-xs text-neutral-500">Review submissions</span>
              </a>
            </Button>

            <Button asChild variant="outline" className="h-auto py-4 flex-col items-start">
              <a href="/admin/photos">
                <Image className="h-5 w-5 mb-2" />
                <span className="font-semibold">Manage Photos</span>
                <span className="text-xs text-neutral-500">Edit approved photos</span>
              </a>
            </Button>

            <Button asChild variant="outline" className="h-auto py-4 flex-col items-start">
              <a href="/admin/users">
                <Users className="h-5 w-5 mb-2" />
                <span className="font-semibold">User Management</span>
                <span className="text-xs text-neutral-500">Manage permissions</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Photos */}
      {stats.recent_photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Added Photos</CardTitle>
            <CardDescription>Last 5 approved photos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {stats.recent_photos.map((photo) => (
                <a key={photo.id} href={`/admin/photos/${photo.id}/edit`} className="group block space-y-2">
                  <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
                    {photo.thumbnail_url ? (
                      <img
                        src={photo.thumbnail_url}
                        alt={photo.event_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="h-8 w-8 text-neutral-400" />
                      </div>
                    )}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-neutral-900 dark:text-neutral-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {photo.event_name}
                    </p>
                    <p className="text-xs text-neutral-500">{new Date(photo.created_at).toLocaleDateString()}</p>
                  </div>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
