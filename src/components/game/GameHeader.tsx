import { useState } from "react";
import { ModeBadge } from "./ModeBadge";
import { ProgressIndicator } from "./ProgressIndicator";
import { Timer } from "./Timer";
import { Button } from "@/components/ui/button";
import type { GameMode } from "@/types";

interface GameHeaderProps {
  mode: GameMode;
  currentPhoto: number; // 1-5
  totalPhotos: number; // Always 5
  elapsedMs: number; // Timer value in milliseconds (Daily mode)
  onExit: () => void;
}

export function GameHeader({ mode, currentPhoto, totalPhotos, elapsedMs, onExit }: GameHeaderProps) {
  const [showExitDialog, setShowExitDialog] = useState(false);

  const handleExitClick = () => {
    setShowExitDialog(true);
  };

  const handleConfirmExit = () => {
    setShowExitDialog(false);
    onExit();
  };

  const handleCancelExit = () => {
    setShowExitDialog(false);
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 md:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left section: Mode badge */}
          <div className="flex items-center gap-4">
            <ModeBadge mode={mode} />
          </div>

          {/* Center section: Progress indicator */}
          <div className="flex justify-center md:flex-1">
            <ProgressIndicator current={currentPhoto} total={totalPhotos} />
          </div>

          {/* Right section: Timer (Daily mode) and Exit button */}
          <div className="flex items-center justify-between md:justify-end gap-4">
            {mode === "daily" && <Timer elapsedMs={elapsedMs} />}

            <Button
              variant="outline"
              size="sm"
              onClick={handleExitClick}
              className="text-gray-700 dark:text-gray-300"
              aria-label="Exit game"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Exit
            </Button>
          </div>
        </div>
      </header>

      {/* Exit confirmation dialog */}
      {showExitDialog && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-dialog-title"
          onClick={handleCancelExit}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="exit-dialog-title" className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
              Exit Game?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Your progress will be lost. Are you sure you want to exit?
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={handleCancelExit}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmExit}>
                Exit Game
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
