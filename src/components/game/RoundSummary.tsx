import { useState } from "react";
import { PhotoBreakdown } from "./PhotoBreakdown";
import { NicknameInput } from "./NicknameInput";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { GameMode, PhotoScoreResultDTO, NicknameValidation } from "@/types";
import { ValidationConstants } from "@/types";

interface RoundSummaryProps {
  mode: GameMode;
  results: PhotoScoreResultDTO[];
  totalScore: number;
  totalTimeMs: number;
  isFirstSubmission: boolean; // Daily mode only
  leaderboardRank?: number; // After submission
  onViewLeaderboard: () => void;
  onPlayAgain: () => void;
  onSubmitWithNickname: (nickname: string, consent: boolean) => Promise<void>;
}

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
  const [consentGiven, setConsentGiven] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const isDailyMode = mode === "daily";
  const showNicknameForm = isDailyMode && isFirstSubmission && !hasSubmitted;
  const showLeaderboardRank = isDailyMode && (hasSubmitted || !isFirstSubmission) && leaderboardRank !== undefined;
  const maxScore = results.length * 20000;
  const percentage = (totalScore / maxScore) * 100;

  // Format time as MM:SS
  // const formatTime = (ms: number) => {
  //   const totalSeconds = Math.floor(ms / 1000);
  //   const minutes = Math.floor(totalSeconds / 60);
  //   const seconds = totalSeconds % 60;
  //   return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  // };

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
    // Clear error when user types
    if (nicknameError) {
      setNicknameError(null);
    }
  };

  const handleSubmit = async () => {
    // Validate nickname
    const validation = validateNickname(nickname);
    if (!validation.isValid) {
      setNicknameError(validation.error || "Invalid nickname");
      return;
    }

    // Check consent
    if (!consentGiven) {
      setNicknameError("You must agree to display your nickname on the leaderboard");
      return;
    }

    setIsSubmitting(true);
    setNicknameError(null);

    try {
      await onSubmitWithNickname(nickname, consentGiven);
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
    if (percentage >= 90) return "🏆 Outstanding Performance!";
    if (percentage >= 75) return "🌟 Excellent Work!";
    if (percentage >= 60) return "👏 Great Job!";
    if (percentage >= 40) return "👍 Good Effort!";
    return "📈 Room for Improvement!";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-8 text-white text-center">
            <h1 className="text-4xl font-bold mb-2">Round Complete!</h1>
            <p className="text-xl opacity-90">{getPerformanceMessage()}</p>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 space-y-6">
            {/* Total score */}
            <div className="max-w-md mx-auto">
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 text-center border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Score</p>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                  {totalScore.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  out of {maxScore.toLocaleString()} ({percentage.toFixed(1)}%)
                </p>
              </div>
            </div>

            {/* Leaderboard rank (after submission) */}
            {showLeaderboardRank && (
              <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-lg p-6 text-center border-2 border-yellow-400 dark:border-yellow-600">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  🎖️ You placed #{leaderboardRank} on today&#39;s leaderboard!
                </p>
              </div>
            )}

            {/* Photo breakdown */}
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Photo Breakdown</h2>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <PhotoBreakdown key={result.photo_id} result={result} index={index} />
                ))}
              </div>
            </div>

            {/* Nickname submission form (Daily, first attempt) */}
            {showNicknameForm && (
              <div className="space-y-4 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Submit to Leaderboard</h3>

                <NicknameInput value={nickname} onChange={handleNicknameChange} error={nicknameError || undefined} />

                {/* Consent checkbox */}
                <div className="flex items-start gap-3 pt-2">
                  <Checkbox
                    id="consent"
                    checked={consentGiven}
                    onCheckedChange={(checked) => setConsentGiven(checked === true)}
                    className="mt-1"
                  />
                  <label htmlFor="consent" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                    I agree to have my nickname displayed on the public leaderboard
                  </label>
                </div>

                {/* Submit button */}
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !nickname || !consentGiven}
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
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {showLeaderboardRank && (
                <Button
                  onClick={onViewLeaderboard}
                  variant="default"
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  View Leaderboard
                </Button>
              )}

              <Button onClick={onPlayAgain} variant="outline" size="lg" className="flex-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Play Again
              </Button>

              <Button onClick={() => (window.location.href = "/")} variant="outline" size="lg" className="flex-1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
