import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Award, Calendar, Clock, Loader2, Medal, Trophy } from "lucide-react";
import type { LeaderboardResponseDTO } from "@/types";

interface LeaderboardProps {
  date?: string;
}

export function Leaderboard({ date }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate] = useState<string>(date || "today");

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        setError(null);

        const endpoint = selectedDate === "today" ? "/api/leaderboard" : `/api/leaderboard/${selectedDate}`;

        const response = await fetch(endpoint);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("No leaderboard data available for this date");
          }
          throw new Error("Failed to load leaderboard");
        }

        const data = await response.json();
        setLeaderboard(data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Error fetching leaderboard:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [selectedDate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg">
          <Trophy className="h-6 w-6 text-white" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 shadow-lg">
          <Medal className="h-6 w-6 text-white" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg">
          <Award className="h-6 w-6 text-white" />
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-semibold text-lg">
        {rank}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-neutral-500" />
          <p className="text-neutral-500 dark:text-neutral-400">Loading leaderboard...</p>
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
            <h3 className="font-semibold text-red-900 dark:text-red-100">Error Loading Leaderboard</h3>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!leaderboard) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <h1 className="text-4xl font-bold tracking-tight">Leaderboard</h1>
        </div>
        <div className="flex items-center justify-center gap-2 text-neutral-500 dark:text-neutral-400">
          <Calendar className="h-5 w-5" />
          <p className="text-lg">{formatDate(leaderboard.date_utc)}</p>
        </div>
        <p className="text-neutral-500 dark:text-neutral-400">
          {leaderboard.total_submissions} {leaderboard.total_submissions === 1 ? "submission" : "submissions"}
        </p>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.leaderboard.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {leaderboard.leaderboard.slice(0, 3).map((entry) => (
            <Card
              key={entry.rank}
              className={`${
                entry.rank === 1
                  ? "md:order-2 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-300 dark:border-yellow-700"
                  : entry.rank === 2
                    ? "md:order-1 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/20 border-gray-300 dark:border-gray-700"
                    : "md:order-3 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border-orange-300 dark:border-orange-700"
              }`}
            >
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">{getRankBadge(entry.rank)}</div>
                <CardTitle className="text-xl truncate">{entry.nickname}</CardTitle>
                <CardDescription className="text-2xl font-bold text-foreground mt-2">
                  {entry.total_score} points
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Full Leaderboard Table */}
      {leaderboard.leaderboard.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Full Rankings</CardTitle>
            <CardDescription>All submissions ranked by score and time</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-neutral-50 dark:bg-neutral-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Rank</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Player</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Score</th>
                    {/*<th className="px-6 py-3 text-right text-sm font-semibold">Time</th>*/}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {leaderboard.leaderboard.map((entry) => (
                    <tr
                      key={`${entry.rank}-${entry.nickname}`}
                      className={`hover:bg-neutral-50 dark:hover:bg-neutral-900/50 ${
                        entry.rank <= 3 ? "bg-neutral-50/50 dark:bg-neutral-900/30" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {entry.rank <= 3 ? (
                            getRankBadge(entry.rank)
                          ) : (
                            <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 w-12 text-center">
                              #{entry.rank}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium">{entry.nickname}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Badge variant="secondary" className="font-semibold">
                          {entry.total_score}
                        </Badge>
                      </td>
                      {/*<td className="px-6 py-4 text-right">*/}
                      {/*  <div className="flex items-center justify-end gap-1 text-sm text-neutral-600 dark:text-neutral-400">*/}
                      {/*    <Clock className="h-4 w-4" />*/}
                      {/*    <span>{formatTime(entry.total_time_ms)}</span>*/}
                      {/*  </div>*/}
                      {/*</td>*/}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 space-y-4">
              <Trophy className="h-12 w-12 mx-auto text-neutral-400" />
              <div>
                <h3 className="text-lg font-semibold">No Submissions Yet</h3>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">Be the first to submit for this date!</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
