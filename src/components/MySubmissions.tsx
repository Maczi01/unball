import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertCircle, ImageIcon, Calendar, MapPin, Plus, FileText } from "lucide-react";
import type { Database } from "@/db/database.types";

type SubmissionStatus = Database["public"]["Enums"]["submission_status"];

interface PhotoSubmission {
  id: string;
  event_name: string;
  year_utc: number;
  status: SubmissionStatus;
  submitter_email: string | null;
  photo_url: string;
  created_at: string;
  competition: string | null;
  place: string | null;
  description: string | null;
  rejection_reason: string | null;
  reviewed_at: string | null;
}

interface SubmissionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

type FilterStatus = "all" | SubmissionStatus;

export function MySubmissions() {
  const [submissions, setSubmissions] = useState<PhotoSubmission[]>([]);
  const [stats, setStats] = useState<SubmissionStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  useEffect(() => {
    async function fetchSubmissions() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/photos/submissions/my");

        if (!response.ok) {
          throw new Error("Failed to load submissions");
        }

        const data = await response.json();
        setSubmissions(data.submissions || []);
        setStats(data.stats || { total: 0, pending: 0, approved: 0, rejected: 0 });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching submissions:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissions();
  }, []);

  const filteredSubmissions = useMemo(() => {
    if (filterStatus === "all") {
      return submissions;
    }
    return submissions.filter((sub) => sub.status === filterStatus);
  }, [submissions, filterStatus]);

  const getStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-700 dark:text-yellow-400">
            Pending Review
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="border-green-500 text-green-700 dark:text-green-400">
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="border-red-500 text-red-700 dark:text-red-400">
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-neutral-500" />
          <p className="text-neutral-500 dark:text-neutral-400">Loading your submissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div
          className="flex items-start gap-3 p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-100">Error Loading Submissions</h3>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Submissions</h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">Track the status of your photo submissions</p>
        </div>
        <Button asChild>
          <a href="/submit-photo">
            <Plus className="mr-2 h-4 w-4" />
            Submit New Photo
          </a>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-yellow-600 dark:text-yellow-400">Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-600 dark:text-yellow-400">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-green-600 dark:text-green-400">Approved</CardDescription>
            <CardTitle className="text-3xl text-green-600 dark:text-green-400">{stats.approved}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-red-600 dark:text-red-400">Rejected</CardDescription>
            <CardTitle className="text-3xl text-red-600 dark:text-red-400">{stats.rejected}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as FilterStatus)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({stats.approved})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({stats.rejected})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 space-y-4">
              <ImageIcon className="h-12 w-12 mx-auto text-neutral-400" />
              <div>
                <h3 className="text-lg font-semibold">
                  {filterStatus === "all" ? "No Submissions Yet" : `No ${filterStatus} submissions`}
                </h3>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                  {filterStatus === "all" ? (
                    <>
                      Start contributing by submitting your first photo!
                      <br />
                      <Button asChild className="mt-4">
                        <a href="/submit-photo">
                          <Plus className="mr-2 h-4 w-4" />
                          Submit Your First Photo
                        </a>
                      </Button>
                    </>
                  ) : (
                    `You don't have any ${filterStatus} submissions.`
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSubmissions.map((submission) => (
            <Card key={submission.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Thumbnail */}
                <div className="sm:w-48 h-48 sm:h-auto bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
                  <img
                    src={submission.photo_url}
                    alt={submission.event_name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 p-4 sm:py-4 sm:pr-4 sm:pl-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold">{submission.event_name}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {submission.year_utc}
                        </span>
                        {submission.place && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {submission.place}
                          </span>
                        )}
                        {submission.competition && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {submission.competition}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-2">
                      {getStatusBadge(submission.status)}
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {formatDate(submission.created_at)}
                      </span>
                    </div>
                  </div>

                  {submission.description && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3 line-clamp-2">
                      {submission.description}
                    </p>
                  )}

                  {submission.status === "rejected" && submission.rejection_reason && (
                    <div className="mt-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                      <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">Rejection Reason:</p>
                      <p className="text-sm text-red-700 dark:text-red-300">{submission.rejection_reason}</p>
                    </div>
                  )}

                  {submission.status === "approved" && submission.reviewed_at && (
                    <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Approved on {formatDate(submission.reviewed_at)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
