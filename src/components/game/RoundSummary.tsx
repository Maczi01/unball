import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Award, BarChart3, Home, MapPin, RefreshCw, Share2, Trophy } from "lucide-react";
import { NicknameInput } from "./NicknameInput";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { GameMode, NicknameValidation, PhotoScoreResultDTO, LeaderboardEntryDTO } from "@/types";
import { ValidationConstants } from "@/types";

interface RoundSummaryProps {
  mode: GameMode;
  results: PhotoScoreResultDTO[];
  totalScore: number;
  isFirstSubmission: boolean; // Daily mode only
  leaderboardRank?: number; // After submission
  onViewLeaderboard: () => void;
  onPlayAgain: () => void;
  onSubmitWithNickname: (nickname: string, consent: boolean) => Promise<void>;
}

// Helper functions
const fmt = (v: number): string => {
  return Number.isFinite(v) ? v.toLocaleString() : "0";
};

export function RoundSummary({
  mode,
  results,
  totalScore,
  isFirstSubmission,
  leaderboardRank,
  onViewLeaderboard,
  onPlayAgain,
  onSubmitWithNickname,
}: RoundSummaryProps) {
  const [nickname, setNickname] = useState("");
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntryDTO[]>([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);

  const isDailyMode = mode === "daily";
  const showNicknameForm = isDailyMode && isFirstSubmission && !hasSubmitted;
  const showLeaderboardRank = isDailyMode && (hasSubmitted || !isFirstSubmission) && leaderboardRank !== undefined;
  const maxScore = results.length * 10000;
  const accuracy = Math.round((totalScore / maxScore) * 100);

  // Fetch leaderboard after submission
  useEffect(() => {
    if (showLeaderboardRank && isDailyMode) {
      const fetchLeaderboard = async () => {
        setIsLoadingLeaderboard(true);
        try {
          const response = await fetch("/api/leaderboard?limit=10");
          if (response.ok) {
            const data = await response.json();
            setLeaderboardData(data.leaderboard || []);
          }
        } catch (error) {
          console.error("Failed to fetch leaderboard:", error);
        } finally {
          setIsLoadingLeaderboard(false);
        }
      };
      fetchLeaderboard();
    }
  }, [showLeaderboardRank, isDailyMode]);

  // Validate nickname
  const validateNickname = (value: string): NicknameValidation => {
    const trimmed = value.trim();

    if (trimmed !== value) {
      return { isValid: false, error: "No leading or trailing spaces allowed" };
    }

    if (trimmed.length < ValidationConstants.NICKNAME.MIN_LENGTH) {
      return {
        isValid: false,
        error: `Nickname must be at least ${ValidationConstants.NICKNAME.MIN_LENGTH} characters`,
      };
    }

    if (trimmed.length > ValidationConstants.NICKNAME.MAX_LENGTH) {
      return {
        isValid: false,
        error: `Nickname must be at most ${ValidationConstants.NICKNAME.MAX_LENGTH} characters`,
      };
    }

    if (!ValidationConstants.NICKNAME.REGEX.test(trimmed)) {
      return {
        isValid: false,
        error: "Only letters, numbers, spaces, hyphens, and underscores allowed",
      };
    }

    return { isValid: true };
  };

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    if (nicknameError) {
      setNicknameError(null);
    }
  };

  const handleSubmit = async () => {
    const validation = validateNickname(nickname);
    if (!validation.isValid) {
      setNicknameError(validation.error || "Invalid nickname");
      return;
    }

    setIsSubmitting(true);
    setNicknameError(null);

    try {
      await onSubmitWithNickname(nickname, true); // Always consent = true
      setHasSubmitted(true);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Submission error:", error);
      if (error instanceof Error) {
        setNicknameError(error.message);
      } else {
        setNicknameError("Failed to submit. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get performance message
  const getPerformanceMessage = () => {
    if (accuracy >= 90) return "Outstanding Performance!";
    if (accuracy >= 75) return "Excellent Work!";
    if (accuracy >= 60) return "Great Job!";
    if (accuracy >= 40) return "Good Effort!";
    return "Room for Improvement!";
  };

  // Handle share to clipboard
  const handleShare = async () => {
    const emojiMap = {
      90: "🏆✨",
      75: "🎯🔥",
      60: "👍💪",
      40: "📈🎲",
      0: "🌱🎮",
    };

    const emoji = emojiMap[Object.keys(emojiMap).find((key) => accuracy >= Number(key)) as keyof typeof emojiMap] || "🎮";

    const shareText = `${emoji} Snaptrip Results ${emoji}

📊 Score: ${fmt(totalScore)}/${fmt(maxScore)} (${accuracy}%)
${isDailyMode ? "🗓️ Daily Challenge" : "🎯 Normal Mode"}

${results.map((r, i) => `${i + 1}. ${r.place || "Unknown"} - ${fmt(r.total_score)} pts (${fmt(r.km_error)} km)`).join("\n")}

Play at: https://snaptrip.app/`;

    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Results copied to clipboard! 🎉");
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy results");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-sky-50 text-slate-900 dark:from-gray-900 dark:to-gray-800 dark:text-gray-100">
      {/* Header band */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden rounded-b-3xl bg-gradient-to-r from-sky-500 to-teal-400 text-white shadow-sm"
      >
        <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="text-3xl md:text-4xl font-semibold tracking-tight">Round Complete!</div>
              <div className="mt-2 text-white/90 flex items-center gap-2">
                <Trophy className="h-5 w-5" /> {mode === "daily" ? "Daily Challenge" : "Normal Mode"}
              </div>
              <div className="mt-3 text-lg text-white/95">🎯 {getPerformanceMessage()}</div>
            </div>
            <button
              onClick={onPlayAgain}
              className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium transition-colors backdrop-blur-sm border border-white/30"
            >
              <RefreshCw className="h-4 w-4" /> Play Again
            </button>
          </div>
        </div>
      </motion.section>

      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        {/* Score + meta */}
        {/*<section className="grid grid-cols-1 md:grid-cols-4 gap-4">*/}
        <section className="">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="md:col-span-2 rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm p-6 text-center dark:bg-gray-800 dark:ring-gray-700"
          >
            <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total Score</div>
            <div className="mt-1 text-5xl font-semibold text-slate-900 dark:text-gray-100">{fmt(totalScore)}</div>
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              out of {fmt(maxScore)} ({accuracy}%)
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-slate-100 overflow-hidden dark:bg-gray-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-teal-400"
                style={{ width: `${accuracy}%` }}
              />
            </div>
          </motion.div>
          {/*<InfoCard*/}
          {/*  icon={<CalendarDays className="h-4 w-4 text-sky-600 dark:text-sky-400" />}*/}
          {/*  label="Time"*/}
          {/*  value={formatTime(totalTimeMs)}*/}
          {/*  delay={0.45}*/}
          {/*/>*/}
          {/*<InfoCard*/}
          {/*  icon={<Compass className="h-4 w-4 text-sky-600 dark:text-sky-400" />}*/}
          {/*  label="Rounds"*/}
          {/*  value={`${rounds}`}*/}
          {/*  delay={0.5}*/}
          {/*/>*/}
        </section>

        {/* Leaderboard rank (after submission) */}
        {showLeaderboardRank && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.55 }}
              className="mt-6 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-2xl p-6 text-center border-2 border-yellow-400 dark:border-yellow-600"
            >
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center justify-center gap-2">
                <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                You placed #{leaderboardRank} on today&#39;s leaderboard!
              </p>
            </motion.div>

            {/* Leaderboard list */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="mt-6 bg-white dark:bg-gray-800 rounded-2xl ring-1 ring-slate-100 dark:ring-gray-700 shadow-sm p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-4">
                <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                Today&#39;s Top 10
              </h3>

              {isLoadingLeaderboard ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : leaderboardData.length > 0 ? (
                <div className="space-y-2">
                  {leaderboardData.map((entry, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        entry.rank === leaderboardRank
                          ? "bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-400 dark:border-yellow-600"
                          : "bg-slate-50 dark:bg-gray-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                            entry.rank === 1
                              ? "bg-yellow-400 text-yellow-900"
                              : entry.rank === 2
                                ? "bg-slate-300 text-slate-900"
                                : entry.rank === 3
                                  ? "bg-orange-400 text-orange-900"
                                  : "bg-slate-200 dark:bg-gray-600 text-slate-700 dark:text-gray-300"
                          }`}
                        >
                          {entry.rank}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {entry.nickname}
                          {entry.rank === leaderboardRank && (
                            <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">(You)</span>
                          )}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {entry.total_score.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No leaderboard data available</p>
              )}
            </motion.div>
          </>
        )}

        {/* Nickname submission form (Daily, first attempt) */}
        {showNicknameForm && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.55 }}
            className="mt-6 space-y-4 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Submit to Leaderboard
            </h3>

            <NicknameInput value={nickname} onChange={handleNicknameChange} error={nicknameError || undefined} />

            {/* Submit button */}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !nickname}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                "Submit to Leaderboard"
              )}
            </Button>
          </motion.div>
        )}

        {/* 5-photo horizontal gallery */}
        <section className="mt-10">
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-gray-100"
          >
            Your Photos
          </motion.h2>
          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[800px] grid grid-cols-5 gap-4 md:min-w-0 md:grid-cols-5">
              {results.map((result, i) => (
                <motion.div
                  key={result.photo_id}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.35, delay: 0.65 + i * 0.03 }}
                  className="rounded-2xl bg-white ring-1 ring-slate-100 shadow-sm overflow-hidden dark:bg-gray-800 dark:ring-gray-700"
                >
                  <img src={result.photo_url} alt={result.place || "Photo"} className="h-40 w-full object-cover" />
                  <div className="p-3 border-t border-slate-100 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate flex items-center gap-1 text-slate-900 dark:text-gray-100">
                          <MapPin className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400 flex-shrink-0" />
                          {result.place || "Unknown"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {fmt(result.km_error)} km away
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-900 dark:text-gray-100">
                          {fmt(result.total_score)}
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400">points</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Actions */}
        <section className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.9 }}
            onClick={onPlayAgain}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-sky-600 text-white font-medium hover:bg-sky-700 transition-colors dark:bg-sky-600 dark:hover:bg-sky-700"
          >
            <RefreshCw className="h-4 w-4" /> Play Again
          </motion.button>
          {showLeaderboardRank && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.95 }}
              onClick={onViewLeaderboard}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-sky-200 dark:border-sky-700 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 font-medium transition-colors"
            >
              <BarChart3 className="h-4 w-4" /> View Leaderboard
            </motion.button>
          )}
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.0 }}
            onClick={() => (window.location.href = "/")}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 font-medium transition-colors"
          >
            <Home className="h-4 w-4" /> Home
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.4, delay: 1.0 }}
            onClick={handleShare}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-700 text-slate-700 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 font-medium transition-colors"
          >
            <Share2 className="h-4 w-4" /> Share Results
          </motion.button>
        </section>
      </main>

      <footer className="py-10 text-center text-sm text-gray-600 dark:text-gray-400">
        © {new Date().getFullYear()} Photo Guesser
      </footer>
    </div>
  );
}
