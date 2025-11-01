import { useCallback, useEffect, useReducer, useState } from "react";
import { GameHeader } from "./GameHeader";
import { AlreadySubmittedNotice } from "./AlreadySubmittedNotice";
import { PhotoDisplay } from "./PhotoDisplay";
import { MapComponent } from "./MapComponent";
import { YearPicker } from "./YearPicker";
import { SubmitButton } from "./SubmitButton";
import { FeedbackSection } from "./FeedbackSection";
import { RoundSummary } from "./RoundSummary";
import { useGameTimer } from "@/components/hooks/useGameTimer";
import { usePhotoGuess } from "@/components/hooks/usePhotoGuess";
import { useDeviceToken } from "@/components/hooks/useDeviceToken";
import { useSubmissionCheck } from "@/components/hooks/useSubmissionCheck";
import type {
  DailySetResponseDTO,
  DailySubmissionCommand,
  DailySubmissionResponseDTO,
  GameMode,
  GameViewModel,
  GuessDTO,
  NormalRoundResponseDTO,
  PhotoScoreResultDTO,
  PhotoState,
} from "@/types";

interface GameViewProps {
  mode: GameMode;
  initialData: DailySetResponseDTO | NormalRoundResponseDTO;
  isAlreadySubmitted: boolean;
}

type GameAction =
  | { type: "SUBMIT_GUESS"; payload: { guess: GuessDTO; result: PhotoScoreResultDTO } }
  | { type: "NEXT_PHOTO" }
  | { type: "SET_ERROR"; payload: { message: string; retryable: boolean } }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "COMPLETE_ROUND"; payload: { results: PhotoScoreResultDTO[]; rank?: number } };

function gameReducer(state: GameViewModel, action: GameAction): GameViewModel {
  switch (action.type) {
    case "SUBMIT_GUESS": {
      const { guess, result } = action.payload;
      const updatedPhotos = [...state.photos];
      updatedPhotos[state.currentPhotoIndex] = {
        ...updatedPhotos[state.currentPhotoIndex],
        guess,
        result,
        status: "complete",
      };

      return {
        ...state,
        photos: updatedPhotos,
        totalScore: state.totalScore + result.total_score,
        isLoading: false,
      };
    }

    case "NEXT_PHOTO": {
      return {
        ...state,
        currentPhotoIndex: state.currentPhotoIndex + 1,
      };
    }

    case "SET_ERROR": {
      return {
        ...state,
        error: {
          type: "submission",
          message: action.payload.message,
          retryable: action.payload.retryable,
        },
        isLoading: false,
      };
    }

    case "CLEAR_ERROR": {
      return {
        ...state,
        error: null,
      };
    }

    case "SET_LOADING": {
      return {
        ...state,
        isLoading: action.payload,
      };
    }

    case "COMPLETE_ROUND": {
      return {
        ...state,
        isLoading: false,
      };
    }

    default:
      return state;
  }
}

function initializeGameState(
  mode: GameMode,
  initialData: DailySetResponseDTO | NormalRoundResponseDTO,
  isAlreadySubmitted: boolean
): GameViewModel {
  const photos: PhotoState[] =
    "photos" in initialData
      ? initialData.photos.map((photo) => ({
          photoData: photo,
          guess: null,
          result: null,
          status: "pending" as const,
        }))
      : [];

  return {
    mode,
    dailySetId: "daily_set_id" in initialData ? initialData.daily_set_id : null,
    dateUtc: "date_utc" in initialData ? initialData.date_utc : null,
    photos,
    currentPhotoIndex: 0,
    startTime: Date.now(),
    elapsedTime: 0,
    totalScore: 0,
    isAlreadySubmitted,
    isLoading: false,
    error: null,
  };
}

export function GameView({ mode, initialData, isAlreadySubmitted }: GameViewProps) {
  const [gameState, dispatch] = useReducer(gameReducer, { mode, initialData, isAlreadySubmitted }, (initial) =>
    initializeGameState(initial.mode, initial.initialData, initial.isAlreadySubmitted)
  );

  const { pin, year, setPin, setYear, clearGuess, isComplete } = usePhotoGuess();
  const { elapsedMs } = useGameTimer(mode === "daily");
  const { deviceToken, isStorageAvailable } = useDeviceToken();
  const { hasSubmitted } = useSubmissionCheck(mode, deviceToken);

  const [showFeedback, setShowFeedback] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [leaderboardRank, setLeaderboardRank] = useState<number | undefined>(undefined);
  const [lastGuessPin, setLastGuessPin] = useState<{ lat: number; lon: number } | null>(null);

  const currentPhoto = gameState.photos[gameState.currentPhotoIndex];
  const currentPhotoNumber = gameState.currentPhotoIndex + 1;
  const isLastPhoto = gameState.currentPhotoIndex === gameState.photos.length - 1;

  // Handle guess submission
  const handleSubmitGuess = useCallback(async () => {
    if (!pin || year === null || !currentPhoto) return;

    dispatch({ type: "SET_LOADING", payload: true });

    const guess: GuessDTO = {
      photo_id: currentPhoto.photoData.photo_id,
      guessed_lat: pin.lat,
      guessed_lon: pin.lon,
      guessed_year: year,
    };

    try {
      // Call per-photo scoring endpoint
      const response = await fetch(`/api/photos/${currentPhoto.photoData.photo_id}/score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guessed_lat: guess.guessed_lat,
          guessed_lon: guess.guessed_lon,
          guessed_year: guess.guessed_year,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to score guess");
      }

      const result: PhotoScoreResultDTO = await response.json();

      // Save the guess pin before clearing
      setLastGuessPin({ lat: pin.lat, lon: pin.lon });

      dispatch({ type: "SUBMIT_GUESS", payload: { guess, result } });
      setShowFeedback(true);
      clearGuess();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Submission error:", error);
      dispatch({
        type: "SET_ERROR",
        payload: {
          message: "Failed to submit guess. Please try again.",
          retryable: true,
        },
      });
    }
  }, [pin, year, currentPhoto, clearGuess]);

  // Handle next photo
  const handleNextPhoto = useCallback(() => {
    setShowFeedback(false);

    if (isLastPhoto) {
      // Show summary for last photo
      setShowSummary(true);
    } else {
      // Move to next photo
      dispatch({ type: "NEXT_PHOTO" });
    }
  }, [isLastPhoto]);

  // Handle final submission (Daily mode)
  const handleSubmitWithNickname = useCallback(
    async (nickname: string, consent: boolean) => {
      if (mode !== "daily" || !gameState.dailySetId || !gameState.dateUtc || !deviceToken) {
        throw new Error("Invalid submission state");
      }

      const guesses: GuessDTO[] = gameState.photos.filter((p) => p.guess !== null).map((p) => p.guess as GuessDTO);

      const submissionData: DailySubmissionCommand = {
        daily_set_id: gameState.dailySetId,
        date_utc: gameState.dateUtc,
        nickname,
        consent_given: consent,
        guesses,
        total_time_ms: elapsedMs,
      };

      const response = await fetch("/api/daily/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Token": deviceToken,
        },
        body: JSON.stringify(submissionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to submit to leaderboard");
      }

      const result: DailySubmissionResponseDTO = await response.json();
      setLeaderboardRank(result.leaderboard_rank ?? undefined);
    },
    [mode, gameState.dailySetId, gameState.dateUtc, gameState.photos, deviceToken, elapsedMs]
  );

  // Handle exit
  const handleExit = useCallback(() => {
    window.location.href = "/";
  }, []);

  // Handle view leaderboard
  const handleViewLeaderboard = useCallback(() => {
    window.location.href = "/leaderboard";
  }, []);

  // Handle play again
  const handlePlayAgain = useCallback(() => {
    window.location.reload();
  }, []);

  // Show error if device token is unavailable in Daily mode
  useEffect(() => {
    if (mode === "daily" && !isStorageAvailable) {
      dispatch({
        type: "SET_ERROR",
        payload: {
          message: "Daily mode requires browser storage. Please enable cookies/storage or try Normal mode.",
          retryable: false,
        },
      });
    }
  }, [mode, isStorageAvailable]);

  if (!currentPhoto) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 text-lg font-semibold">Failed to load game data</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  // Show feedback page
  if (showFeedback && currentPhoto.result) {
    return (
      <FeedbackSection
        result={currentPhoto.result}
        runningTotal={gameState.totalScore}
        currentPhoto={currentPhotoNumber}
        totalPhotos={gameState.photos.length}
        onNext={handleNextPhoto}
        userGuessPin={lastGuessPin}
        photoUrl={currentPhoto.photoData.photo_url}
      />
    );
  }

  // Show round summary
  if (showSummary) {
    return (
      <RoundSummary
        mode={mode}
        results={gameState.photos.filter((p) => p.result !== null).map((p) => p.result as PhotoScoreResultDTO)}
        totalScore={gameState.totalScore}
        totalTimeMs={elapsedMs}
        isFirstSubmission={mode === "daily" && !hasSubmitted && !isAlreadySubmitted}
        leaderboardRank={leaderboardRank}
        onViewLeaderboard={handleViewLeaderboard}
        onPlayAgain={handlePlayAgain}
        onSubmitWithNickname={handleSubmitWithNickname}
      />
    );
  }

  // Show main game interface
  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <GameHeader
        mode={mode}
        currentPhoto={currentPhotoNumber}
        totalPhotos={gameState.photos.length}
        elapsedMs={elapsedMs}
        onExit={handleExit}
      />

      {/* Already submitted notice */}
      {mode === "daily" && (hasSubmitted || isAlreadySubmitted) && (
        <div className="px-4 md:px-6 pt-4">
          <AlreadySubmittedNotice />
        </div>
      )}

      {/* Main game area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4 md:p-6 pb-6">
        <div className="w-full h-full max-h-full grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: Photo and controls */}
          <div className="space-y-3 flex flex-col max-h-full overflow-hidden">
            {/* Photo */}
            <div className="flex-1 flex flex-col min-h-0">
              <PhotoDisplay
                photo={currentPhoto.photoData}
                currentIndex={gameState.currentPhotoIndex}
                totalPhotos={gameState.photos.length}
              />
            </div>

            {/* Year picker */}
            <YearPicker selectedYear={year} onYearChange={setYear} disabled={false} />

            {/* Submit button */}
            <SubmitButton isDisabled={!isComplete} isLoading={gameState.isLoading} onClick={handleSubmitGuess} />
          </div>

          {/* Right column: Map */}
          <div className="h-[400px] lg:max-h-full lg:h-full">
            <MapComponent
              userPin={pin}
              correctPin={null}
              showFeedback={false}
              kmError={null}
              onPinPlace={setPin}
              onPinMove={setPin}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* Error display */}
      {gameState.error && (
        <div className="fixed bottom-4 right-4 max-w-md bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 p-4 rounded-lg shadow-lg">
          <div className="flex items-start gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-red-500 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900 dark:text-red-100">{gameState.error.message}</p>
            </div>
            <button
              onClick={() => dispatch({ type: "CLEAR_ERROR" })}
              className="text-red-500 hover:text-red-700 dark:hover:text-red-300"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
