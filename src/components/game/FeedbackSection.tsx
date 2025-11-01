import { ScoreCard } from "./ScoreCard";
import { Button } from "@/components/ui/button";
import { MapComponent } from "./MapComponent";
import type { PhotoScoreResultDTO } from "@/types";

interface FeedbackSectionProps {
  result: PhotoScoreResultDTO;
  runningTotal: number;
  currentPhoto: number; // 1-5
  totalPhotos: number; // 5
  onNext: () => void;
  userGuessPin: { lat: number; lon: number } | null;
  photoUrl: string;
}

export function FeedbackSection({
  result,
  runningTotal,
  currentPhoto,
  totalPhotos,
  onNext,
  userGuessPin,
  photoUrl,
}: FeedbackSectionProps) {
  const isLastPhoto = currentPhoto === totalPhotos;
  const maxTotalScore = totalPhotos * 20000;
  const photosCompleted = currentPhoto;

  // Calculate percentage for running total
  const percentage = (runningTotal / (photosCompleted * 20000)) * 100;

  // Celebration message based on score
  const getCelebrationMessage = () => {
    const photoPercentage = (result.total_score / 20000) * 100;
    if (photoPercentage >= 90) return "🎉 Incredible! Almost perfect!";
    if (photoPercentage >= 75) return "🌟 Excellent guess!";
    if (photoPercentage >= 50) return "👍 Good effort!";
    return "📍 Keep trying!";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Photo {currentPhoto} Results</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {photosCompleted} of {totalPhotos} photos completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">Running Total</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                {runningTotal.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-4 space-y-4">
          {/* Celebration message with score - more compact */}
          <div className="text-center bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg py-4 px-6 shadow-lg">
            <p className="text-xl font-bold text-white mb-1" id="feedback-title">
              {getCelebrationMessage()}
            </p>
            <p className="text-4xl font-black text-white tabular-nums">{result.total_score.toLocaleString()} points</p>
            <p className="text-sm text-blue-100 mt-1">out of 20,000 possible</p>
          </div>

          {/* Two column layout: Photo & Map - more compact */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Photo */}
            <div className="space-y-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <img src={photoUrl} alt="Football match" className="w-full h-auto max-h-[300px] object-contain" />
              </div>
            </div>

            {/* Right: Map with both pins */}
            <div>
              <div className="h-[300px] lg:h-[380px]">
                <MapComponent
                  userPin={userGuessPin}
                  correctPin={{ lat: result.correct_lat, lon: result.correct_lon }}
                  showFeedback={true}
                  kmError={result.km_error}
                  onPinPlace={() => {
                    // eslint-disable-next-line no-console
                    console.log("Pin moved");
                  }}
                  onPinMove={() => {
                    // eslint-disable-next-line no-console
                    console.log("Pin moved");
                  }}
                  className="h-full rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>

          {/* Photo Info section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-purple-600 dark:text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Photo Information
            </h3>

            <div className="space-y-4">
              {/* Event Details */}
              <div>
                <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">{result.event_name}</h4>
                {result.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{result.description}</p>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Year: {result.correct_year}</span>
                  </div>
                  {result.place && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>Place: {result.place}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo Credit */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Photo Attribution</h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <p>
                    <span className="font-medium">Credit:</span> {result.credit}
                  </p>
                  <p>
                    <span className="font-medium">License:</span> {result.license}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* More Info section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              More Information
            </h3>

            <div className="space-y-4">
              {/* Source URL - YouTube or other links */}
              {result.source_url ? (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Watch Video</h4>
                  <a
                    href={result.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
                    </svg>
                    Watch on YouTube
                  </a>
                </div>
              ) : (
                <div className="text-center py-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto text-gray-300 dark:text-gray-600 mb-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    No additional video content available for this match.
                  </p>
                </div>
              )}

              {/* Additional resources placeholder */}
              <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Learn more about this historic football moment and relive the action through archived footage and
                  highlights.
                </p>
              </div>
            </div>
          </div>

          {/* Score card */}
          <ScoreCard result={result} animate={true} />

          {/* Running total progress */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Round Progress</h4>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {photosCompleted} of {totalPhotos} photos
                </span>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${(photosCompleted / totalPhotos) * 100}%` }}
                    role="progressbar"
                    aria-valuenow={photosCompleted}
                    aria-valuemin={0}
                    aria-valuemax={totalPhotos}
                  />
                </div>

                {/* Running total score */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Score</span>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 tabular-nums">
                      {runningTotal.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      out of {maxTotalScore.toLocaleString()} ({percentage.toFixed(1)}%)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed bottom action bar */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-4 px-4 md:px-6">
        <div className="max-w-7xl mx-auto flex justify-center">
          <Button
            size="lg"
            onClick={onNext}
            className="min-w-[250px] text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          >
            {isLastPhoto ? (
              <>
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                See Final Results
              </>
            ) : (
              <>
                Next Photo
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
