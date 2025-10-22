import { ScoreCard } from "./ScoreCard";
import { Button } from "@/components/ui/button";
import type { PhotoScoreResultDTO } from "@/types";

interface FeedbackSectionProps {
	result: PhotoScoreResultDTO;
	runningTotal: number;
	currentPhoto: number; // 1-5
	totalPhotos: number; // 5
	onNext: () => void;
}

export function FeedbackSection({
	result,
	runningTotal,
	currentPhoto,
	totalPhotos,
	onNext,
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
		<div
			className="fixed inset-0 bg-black/60 flex items-center justify-center z-40 p-4 animate-in fade-in duration-300"
			role="dialog"
			aria-modal="true"
			aria-labelledby="feedback-title"
		>
			<div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				<div className="space-y-6">
					{/* Celebration message */}
					<div className="text-center">
						<p className="text-2xl font-bold text-white mb-2" id="feedback-title">
							{getCelebrationMessage()}
						</p>
					</div>

					{/* Score card */}
					<ScoreCard result={result} animate={true} />

					{/* Running total */}
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

					{/* Next button */}
					<div className="flex justify-center">
						<Button
							size="lg"
							onClick={onNext}
							className="min-w-[200px] text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
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
									See Results
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
		</div>
	);
}
