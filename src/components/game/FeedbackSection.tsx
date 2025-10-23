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
							<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
								Photo {currentPhoto} Results
							</h1>
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
				<div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
					{/* Celebration message */}
					<div className="text-center bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-6 shadow-lg">
						<p className="text-3xl font-bold text-white" id="feedback-title">
							{getCelebrationMessage()}
						</p>
					</div>

					{/* Two column layout: Photo & Map */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Left: Photo */}
						<div className="space-y-4">
							<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
								<img
									src={photoUrl}
									alt="Football match"
									className="w-full h-auto object-cover"
								/>
							</div>

							{/* Event details */}
							<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
								<h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
									{result.event_name}
								</h3>
								{result.description && (
									<p className="text-gray-600 dark:text-gray-400 mb-3">
										{result.description}
									</p>
								)}
								<div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
									<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
									</svg>
									<span>Correct Year: {result.correct_year}</span>
								</div>
							</div>
						</div>

						{/* Right: Map with both pins */}
						<div className="space-y-4">
							<div className="h-[400px] lg:h-[500px]">
								<MapComponent
									userPin={userGuessPin}
									correctPin={{ lat: result.correct_lat, lon: result.correct_lon }}
									showFeedback={true}
									kmError={result.km_error}
									onPinPlace={() => {}}
									onPinMove={() => {}}
									className="h-full rounded-lg shadow-lg"
								/>
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
